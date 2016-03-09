var http = require('http');
var _ = require('underscore');
var elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client({
  host: 'localhost:9200'
  // log: 'trace'
});

var env = 'dev';
// var env = 'prod'

var config = config || {
    index : 'toptour' + (env === 'dev' ? '_dev' : '')
}

var turbase = {
    host: (env === 'dev' ? 'dev' : 'api') + '.nasjonalturbase.no',
    port: 80
};

var api_key = '0e1718433eece23d17c3f49c55018c5bd2181c99';


function getTurBase(objectName, parameters, callback) {
    
    http.get({
        host: turbase.host,
        path: buildUrl(objectName, parameters)
    }, function(response) {

        var body = '';
        response.on('data', function(d) {
            body += d;
        });
        response.on('end', function() {

            var res = JSON.parse(body);
            checkResponse(res);
            // console.log(parsed);
            callback(res);
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
    var count = _.keys(docs).length;
    console.log("potentially updating " + count);
    var newDocs = 0;
    function decrement() {
        count--;

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

            if (hits.length === 0) {

                getUt(
                    mappedDoc.utid, 
                    'turer',
                    function(data) {
                        indexDocument(data, function() {
                            newDocs++;
                            decrement();
                        });                        
                    },
                    function(err) {
                       console.log("error");
                       decrement();
                    });
            } else {
                decrement();
            }
        }, 
        function(error) {
            console.log(error, ' error');
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

function checkResponse(response, success, error) {
    if (response.hasOwnProperty('message')) {
        if (response.message === 'API rate limit exceeded') {
            console.log("API rate");|
            process.exit();
        }
    }
    success();
}

function getUt(id, type, success) {

    http.get({
        host: turbase.host,
        path: buildUrl(type, { id: id})
    }, function(response) {
        var body = '';
        response.on('data', function(d) {
            body += d;
        });
        response.on('end', function() {
            var res = JSON.parse(body);
            checkResponse(res);
            success(res);
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


updateData('turer', { after : '2016-02-02T19:10:38' , limit: 50 });