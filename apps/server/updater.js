var http = require('http');
var _ = require('underscore');

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
            console.log("Body");
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
    return '/' + objectName + (id ? id : '') + '?api_key=' + api_key + parameterString;
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

    getUpdates(objectName, parameters, counter, updatedDocs, getAndUpsertDocuments);

}

function getQuery(doc) {
    return {
        "query" : {
            "range" : {
                "after" : {
                    "gt" : 2 
                }
                
            }
        },
         "from" : 0, 
         "size" : 5
    }
}

function getAndUpsertDocuments(objectName, updatedDocs) {

    var config = config || {
        index : 'test'
    }

    var esArray = [];

    var chunks;
    var i = 0;
    var limit = 100;
    var updatedArray = [];

    _.each(updatedDocs, function(doc) {
        esArray.push({index : config.index});
        esArray.push(getQuery(doc));
    });

    es.loadDocs(updatedDocs, function(docs) {

        var changedDocuments = [];
        _.each(docs, function(doc) {
            if (updatedDocs.hasOwnProperty(doc.turbase_id)) {
                changedDocuments(mergeDocuments(doc, updatedDocs[doc.turbase_id]));
            } else {
                changedDocuments.push(doc);
            }
        });
        upsertDocuments(changedDocuments, function() {
            console.log("loaded");
        });
    });

}

function upsertDocuments(updatedDocs, callback) {

    function popAndLoad(updatedDocs, eachCallback, finalCallback) {
        if (updatedDocs.length > 0) {
            var doc = updatedDocs.pop();
            console.log(doc);
        } else {
            finalCallback();
            return;
        }
        eachCallback(updatedDocs, eachCallback, finalCallback);
    }

    popAndLoad(updatedDocs, popAndLoad, callback);
    
}

function handleUpdates(data) {

}

// update the
function updataData(objectName, parameters) {


    
    getTurbase(buildUrl(objectName, parameters), callback);





}

// getTurBase('turer', null, function(data) {  
//     console.log(data);
// });

updateData('turer', { after : '2016-02-29T19:10:38' , limit: 2 });