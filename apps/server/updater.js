var http = require('http');
var _ = require('underscore');
var elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client({
  host: 'localhost:9200'
  // log: 'trace'
});

var config = config || {
    index : 'test3'
}

var turbase = {
    host: 'http://dev.nasjonalturbase.no',
    port: 80
};

var api_key = '0e1718433eece23d17c3f49c55018c5bd2181c99';


function getTurBase(objectName, parameters, callback) {
    
    http.get({
        host: 'api.nasjonalturbase.no',
        path: buildUrl(objectName, parameters)
    }, function(response) {

        var body = '';
        response.on('data', function(d) {
            body += d;
        });
        response.on('end', function() {

            // Data reception is done, do whatever with it!
            var parsed = JSON.parse(body);
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
    var parameters = parameters || { limit : 2, skip : 0 };
    var counter = 0;
    var updatedDocs = {};

    getUpdates(objectName, parameters, counter, updatedDocs, updateChangedDocs);

}

function getQuery(index, doc) {
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

function updateChangedDocs(objectName, docs) {

    _.each(docs, function(doc) {
        var mappedDoc = mapData(doc);
        console.log(getQuery(config.index, mappedDoc))
        client.search(getQuery(config.index, mappedDoc)
        , function(error, response) {
            console.log(response);
        });
        console.log(doc);
        getUt(doc.utid, 'turer', function(data) {
            // console.log(data);
            // indexDocument(doc);
        });


    });

    // getAndUpsertDocuments(docs);
}

// function getQuery(doc) {
//     return {
//         "query" : {
//             "range" : {
//                 "after" : {
//                     "gt" : 2 
//                 }
//             }
//         },
//          "from" : 0, 
//          "size" : 5
//     }
// }

function mapData(doc) {
    // console.log(doc._id);
    console.log(doc._id);
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

function getAndUpsertDocuments(objectName, updatedDocs) {


    var esArray = [];

    var chunks;
    var i = 0;
    var limit = 100;
    var updatedArray = [];
    var counter = 0;

    _.each(updatedDocs, function(doc) {
        getUt(doc._id, 'turer', indexDocument);
        counter++;
    });

}

// function getUtDocument(id) {
//     var apiKey = "0e1718433eece23d17c3f49c55018c5bd2181c99"
//     var url = "http://dev.nasjonalturbase.no/turer/524081f9b8cb77df15000fd3"

// }

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


updateData('turer', { after : '2016-03-03T19:10:38' , limit: 3 });