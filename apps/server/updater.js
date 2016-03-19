var http = require('http');
var _ = require('underscore');
var elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client({
  host: 'localhost:9200'
  // log: 'trace'
});

var env = 'dev';
var env = 'prod'
var config = config || {
    index : 'toptour' + (env === 'dev' ? '_dev' : '')
}

var turbase = {
    host: (env === 'dev' ? 'dev' : 'api') + '.nasjonalturbase.no',
    port: 80
};
console.log(turbase.host);
console.log(config.index);
var api_key = '0e1718433eece23d17c3f49c55018c5bd2181c99';


function getTurBase(objectName, parameters, callback) {
    requestCounter++;
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
            checkResponse(res, callback, finish);
        });
    });
}

var requestCounter = 0;
var parameters;
var limitExceeded = false;
var docsIndexed = 0;
var newDocs = 0;
var existing = 0;
var total = 0;
var docsFound= 0;
var deletedDocs = 0;
var docsProcessed = 0;
var docsMapped = 0;

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

    if (counter%20 == 0) {
        process.stdout.write(counter + "...");
    }

    getTurBase(objectName, parameters, function(data) {
        counter += data.count;
        total = data.total;
        parameters.skip = counter;

        checkResponse(
            data, 
            function(data) {

                _.each(data.documents, function(doc) {
                    updatedDocs[doc._id] = doc;
                });

                if (counter < total) {
                    getUpdates(objectName, parameters, counter, updatedDocs, endCallback);
                } else {
                    console.log("start loading , counter : " + counter);
                    endCallback(objectName, updatedDocs);
                    return;
                }

            },  
            function() {
                console.log("api limit reached - start loading");
                endcallback(objectName, updatedDocs);
            }
        );
    });
}



function updateData(objectName, parameters) {


    var parameters = parameters || { after : '2016-03-07T19:10:38', limit : 50, skip : 0 };
    var counter = 0;
    var updatedDocs = {};

    getUpdates(objectName, parameters, counter, updatedDocs, updateChangedDocs);

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
    console.log("\r\n ------------------- \r\n");

    printLoadStatus();
    process.exit();
}


function printLoadStatus() {
    console.log("Loaded documents updated after " + parameters.after);
    console.log("Retrieved " + total + " documents");
    console.log("New documents indexed: " + newDocs);
    console.log("Retrieved documents that were up to date: " + existing);
    console.log("Processed " + docsProcessed);
    console.log("Documents mapped " + docsMapped);
    console.log("Documents deleted " + deletedDocs);
    console.log("Documents found " + docsFound);
    console.log("Documents indexed " + docsIndexed);
    console.log("Requests sent to Turbase server: " + requestCounter);
    return;
}

function deleteDocuments(hits, callback) {
    var counter = hits.length;
    var onReturn = function() {
        counter--;
        if(counter === 0) {
            callback();
        }
    } 
    _.each(hits, function(hit) {
        deleteDocument(hit._id, onReturn, onReturn);
    });

}

function getAndIndex(doc, type, completedCallback) {
    if (!limitExceeded) {
    getUt(
        doc.utid,
        type,
        function(data) {
            indexDocument(data, completedCallback, completedCallback);
        },
        function() {
            completedCallback(); 
        }
    );

    } else {
        console.log("Skipped getting, limit exceeded");
        completedCallback();
    }

}

function handleIndexLookupResponse(mappedDoc, response, completedCallback) {

            if (mappedDoc && !limitExceeded) {
                var hits = response.hits.hits;

                // The document does not exist - index it
                if (hits.length === 0) {
                    console.log("indexing new document - was not present in index", mappedDoc.utid);
                    getAndIndex(mappedDoc, 'turer', completedCallback);

                // Duplicates in data store, delete all and take UT.no version
                } else if (hits.length > 1) {
                    console.log("MORE than one document with this ID, delete all and index")
                    
                    deleteDocuments(hits, function() {
                        getAndIndex(mappedDoc, 'turer', completedCallback);
                    });

                // One exact match, check timestamp
                } else {


                    if (hits[0]._source.endret == mappedDoc.endret) {
                        completedCallback();
                        // Same document
                    } else {
                        var localDoc = response.hits.hits[0];

                        // if (Date.parse(localDoc._source.endret) < Date.parse(mappedDoc.endret)) {
                            deleteDocument(localDoc._id, 
                            function() {
                                getAndIndex(mappedDoc, 'turer', completedCallback);
                            },
                            completedCallback);
                        // }

                        
                    }
                }
            } else {
                console.log("limited exceeded or doc incorrect");
                completedCallback();
            }
            


}

function deleteDocument(id, success, error) {

    deletedDocs++;
    client.delete(
    { 
        index: config.index, 
        type: 'tour',
        id : id
    },
    function(err, data) {
        if (err) {
            console.log("could not delete " + id);
            console.log(err);
            if (error) {
                error();   
            }
        } else {
            if (success) {

            }
        }
    });

}

function updateChangedDocs(objectName, docs) {
    var count = _.keys(docs).length;
    console.log(docs);

    console.log("potentially updating " + count + "\r\n");

    var completed = 0;

    function completedCallback(utid) {
        completed++;
        if (completed == count) {
            finish();
        }
    }

    _.each(docs, function(doc) {

        var mappedDoc = mapData(doc);
        if (mappedDoc) {
            // The document is ok (i.e. it is a valid UT.no document)

            docsMapped++;

            client.search({
                index : config.index,
                body: buildQuery(mappedDoc)
            },
            function(err, data) {
                if (err) {
                    console.log("error", err);
                    completedCallback();
                } else {
                    handleIndexLookupResponse(mappedDoc, data, completedCallback);
                }             
            });
    	} else {
    		completedCallback();
    	}
    });

    // getAndUpsertDocuments(docs);
}

function mapData(doc) {

    if (verifyDoc(doc)) {

        doc.utid = doc._id;
        
        if (doc.hasOwnProperty('_id')) {
            delete doc['_id']
        }
    	return doc;
    }
	  
    return false;
}

function verifyDoc(doc) {
    if (doc.hasOwnProperty('message')) {
        if (doc.message === 'API rate limit exceeded') {
            return false;
        }
    }
    return true;
}

function checkResponse(response, success, error) {
    if (response.hasOwnProperty('message')) {
        if (response.message === 'API rate limit exceeded') {
            console.log("API rate exceedded");
            limitExceeded = true;
            if (error) {
                console.log("finish");
                error(response);               
            }

        }
    }
    success(response);
}

function getUt(id, type, success, error) {
    requestCounter++;
    console.log("get id " + type + ": " + id);
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
            checkResponse(res, success, error);
        });
    });

}

function indexDocument(doc, success, error) {
    var mappedDoc = mapData(doc);
    docsIndexed++;

    client.index(
        { 
            index: config.index,
            type: 'tour',
            body : mappedDoc
        },
        function(err, data) {
            if (err) {
                error();
            } else {
                if (success) {
                    success(data);
                }
                
            }
        });
}


function deleteDuplicates() {

    
}


parameters =  { after : '2015-11-01T19:10:38' , limit: 50 };
updateData('turer', parameters);
