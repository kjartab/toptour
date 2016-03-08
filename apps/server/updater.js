var http = require('http');
var _ = require('underscore');
var elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client({
  host: 'localhost:9200'
  // log: 'trace'
});

var config = config || {
    index : 'toptour'
}

var turbase = {
    host: 'http://dev.nasjonalturbase.no',
    port: 80
};

var api_key = '0e1718433eece23d17c3f49c55018c5bd2181c99';


function getTurBase(objectName, parameters, callback) {
    
    http.get({
        host: 'dev.nasjonalturbase.no',
        path: buildUrl(objectName, parameters)
    }, function(response) {

        var body = '';
        response.on('data', function(d) {
            body += d;
        });
        response.on('end', function() {

            var parsed = JSON.parse(body);
            console.log(parsed);
            callback(parsed);
        });
    });
}

function buildUrl(objectName, parameters) {
    var parameterString = '';
    var first = true;
    var id = null;
    for (key in parameters) {
        if (key === 'id') {
            id = parameters[key];
        } else {
            parameterString += '&' + key + '=' + parameters[key]; 
        }
    }
    return '/' + objectName + (id ? '/' + id : '') + '?api_key=' + api_key + parameterString;
}


function getUpdates(objectName, parameters, counter, updatedDocs, endCallback) {

    getTurBase(objectName, parameters, function(data) {
        counter += data.count;
        total = data.total;
        parameters.skip = counter;
        
        _.each(data.documents, function(doc) {
            updatedDocs[doc._id] = doc;
        });

        if (total > counter) {
            getUpdates(objectName, parameters, counter, updatedDocs, endCallback);
        } else {
            endCallback(objectName, updatedDocs);
            return;
        }

    });
}

function updateData(objectName, parameters) {

    var total = 0;
    var parameters = parameters || { limit : 50, skip : 0 };
    var counter = 0;
    var updatedDocs = {};

    getUpdates(objectName, parameters, counter, updatedDocs, updateChangedDocs);

}

function buildIndex(index, doc) {
    return JSON.stringify({
        index: index,
        body: {
            query: {
                term: {
                    utid: doc.utid
                }
            }
        }
    });
}

function buildQuery(doc) {
    return JSON.stringify({
        query: {
            term: {
                utid: doc.utid
            }
        }
    });
}

function finish() {
    process.exit();
}

function updateChangedDocs(objectName, docs) {
    console.log(docs);
    var count = _.keys(docs).length;
    var newDocs = 0;
    function decrement() {
        count--;
        console.log(count);
        if (count==0) {
            console.log("new docs: " + newDocs);
            finish();
        }
    }
    _.each(docs, function(doc) {

        var mappedDoc = mapData(doc);
        
        client.search({
            index : config.index,
            body: buildQuery(mappedDoc)
        }).then(
        function(response) {
            var hits = response.hits.hits;
            console.log("hits length: ");
            console.log(hits.length);
            if (hits.length === 0) {
                newDocs++;

                getUt(
                    mappedDoc.utid, 
                    'turer',
                    function(data) {
                        console.log("got it")
                        indexDocument(data);
                        decrement();
                    },
                    function(err) {
                         
                       decrement();
                        console.log(err, "error")
                    });
            } else {
                decrement();
            }
        }, 
        function(error) {
            console.log("error");
            decrement();
        });
    });

    // getAndUpsertDocuments(docs);
}

function mapData(doc) {
    // console.log(doc._id);

    doc.utid = doc._id;
    if (doc.hasOwnProperty('_id')) {
        delete doc['_id']
    }

    return doc;
}

function getUt(id, type, success) {

    http.get({
        host: 'api.nasjonalturbase.no',
        path: buildUrl(type, { id: id})
    }, function(response) {

        var body = '';
        response.on('data', function(d) {
            body += d;
        });
        response.on('end', function() {
            success(JSON.parse(body));
        });
    });
}

function indexDocument(doc, success) {
    var mappedDoc = mapData(doc);
    client.index(
        { 
            index: config.index, 
            type: 'tour',
            body : mappedDoc
        },
        function(err, data) {
        
        });
}


// update the
function updataData(objectName, parameters) {
    getTurbase(buildUrl(objectName, parameters), callback);
}

// getTurBase('turer', null, function(data) {  
//     console.log(data);
// });


updateData('turer', { after : '2012-11-15T22:10:38' , limit: 50 });