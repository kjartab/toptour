var http = require('http');
var _ = require('underscore');

var turbase = {
    host: 'http://dev.nasjonalturbase.no',
    port: 80
};

var api_key = '0e1718433eece23d17c3f49c55018c5bd2181c99';


function getTurBase(objectName, parameters, callback) {
<<<<<<< HEAD
    console.log()
    http.get({
        host: 'dev.nasjonalturbase.no',
=======

    http.get({
        host: 'api.nasjonalturbase.no',
>>>>>>> 7f61f7440c0a0e8df53db4a36cbcf6e2fc92978e
        path: buildUrl(objectName, parameters)
    }, function(response) {

        var body = '';
<<<<<<< HEAD
        response.on('data', function(d) {
=======
        response.on('data',function updataData(objectName, parameters) {


 function(d) {
>>>>>>> 7f61f7440c0a0e8df53db4a36cbcf6e2fc92978e
            body += d;
        });
        response.on('end', function() {

            // Data reception is done, do whatever with it!
            var parsed = JSON.parse(body);
<<<<<<< HEAD
=======
            console.log("Body");
>>>>>>> 7f61f7440c0a0e8df53db4a36cbcf6e2fc92978e
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
<<<<<<< HEAD
            // eachCallback(doc);
=======
>>>>>>> 7f61f7440c0a0e8df53db4a36cbcf6e2fc92978e
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

<<<<<<< HEAD
    getUpdates(objectName, parameters, counter, updatedDocs, upsertDocuments);
=======
    getUpdates(objectName, parameters, counter, updatedDocs, getAndUpsertDocuments);
>>>>>>> 7f61f7440c0a0e8df53db4a36cbcf6e2fc92978e

}

function getQuery(doc) {
    return {
        "query" : {
            "range" : {
                "after" : {
<<<<<<< HEAD
                    "gt" :  
=======
                    "gt" : 2 
>>>>>>> 7f61f7440c0a0e8df53db4a36cbcf6e2fc92978e
                }
                
            }
        },
         "from" : 0, 
         "size" : 5
    }
}

function getAndUpsertDocuments(objectName, updatedDocs) {
<<<<<<< HEAD
    var config = config || {
        index : 'test'
    }
=======

    var config = config || {
        index : 'test'
    }

    var esArray = [];

>>>>>>> 7f61f7440c0a0e8df53db4a36cbcf6e2fc92978e
    var chunks;
    var i = 0;
    var limit = 100;
    var updatedArray = [];
<<<<<<< HEAD
     _.each(updatedDocs, function(doc) {
        esArray.push({index : config.index});
        esArray.push(getQuery(doc));
     });



    function popAndLoad(updatedArray, callback) {
        if (updatedArray.length > 0) {
            var doc = updatedArray.pop();

=======

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
>>>>>>> 7f61f7440c0a0e8df53db4a36cbcf6e2fc92978e
        } else {
            finalCallback();
            return;
        }
<<<<<<< HEAD
    }

    popAndLoad(updatedArray, popAndLoad) {

    }

=======
        eachCallback(updatedDocs, eachCallback, finalCallback);
    }

    popAndLoad(updatedDocs, popAndLoad, callback);
    
>>>>>>> 7f61f7440c0a0e8df53db4a36cbcf6e2fc92978e
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

<<<<<<< HEAD
updateData('turer', { after : '2016-02-22T19:10:38' , limit: 2 });
=======
updateData('turer', { after : '2016-02-29T19:10:38' , limit: 2 });
>>>>>>> 7f61f7440c0a0e8df53db4a36cbcf6e2fc92978e
