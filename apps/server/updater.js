var http = require('http');
var _ = require('underscore');

var turbase = {
    host: 'http://dev.nasjonalturbase.no',
    port: 80
};

var api_key = '0e1718433eece23d17c3f49c55018c5bd2181c99';


function getTurBase(objectName, parameters, callback) {
    console.log()
    http.get({
        host: 'dev.nasjonalturbase.no',
        path: buildUrl(objectName, parameters)
    }, function(response) {

        var body = '';
        response.on('data', function(d) {
            body += d;
        });
        response.on('end', function() {

            // Data reception is done, do whatever with it!
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
    return '/' + objectName + (id ? id : '') + '?api_key=' + api_key + parameterString;
}


function getUpdates(objectName, parameters, counter, updatedDocs, endCallback) {

    getTurBase(objectName, parameters, function(data) {
        counter += data.count;
        total = data.total;
        parameters.skip = counter;

        _.each(data.documents, function(doc) {
            // eachCallback(doc);
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

    getUpdates(objectName, parameters, counter, updatedDocs, upsertDocuments);

}

function getQuery(doc) {
    return {
        "query" : {
            "range" : {
                "after" : {
                    "gt" :  
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
    var chunks;
    var i = 0;
    var limit = 100;
    var updatedArray = [];
     _.each(updatedDocs, function(doc) {
        esArray.push({index : config.index});
        esArray.push(getQuery(doc));
     });



    function popAndLoad(updatedArray, callback) {
        if (updatedArray.length > 0) {
            var doc = updatedArray.pop();

        } else {
            finalCallback();
            return;
        }
    }

    popAndLoad(updatedArray, popAndLoad) {

    }

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

updateData('turer', { after : '2016-02-22T19:10:38' , limit: 2 });