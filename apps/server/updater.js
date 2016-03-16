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
var newDocs = 0;
var existing = 0;
var total = 0;
var docsFound= 0;
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
    console.log("Documents found " + docsFound);
    console.log("Requests sent to Turbase server: " + requestCounter);
    return;
}

function handleIndexLookupResponse(response, completedCallback) {
            console.log("handle response");
            var mappedDoc = mapData(response);

            if (mappedDoc) {
                var hits = response.hits.hits;
                if (hits.length === 0) {
                    console.log("hits === 0");
                    // The document does not exist in index - index it
                    getUt(
                        mappedDoc.utid, 
                        'turer', 
                        function(data) {
                            indexDocument(data, completedCallback, completedCallback);
                        }, 
                        function() {
                            completedCallback(); 
                            console.log("error getting doc from UT.no")
                        }
                    );

                } else if (hits.length > 1) {
                    console.log("hits > 1");
                    // There are two documents with the same Ut.no ID. Something is wrong.
                     console.log("Duplicates!" + hits[0]._source.utid);
                } else {

                    console.log("HANDEL");
                    console.log(mappedDoc);
                    if (response.hits.hits[0]._source.endret == mappedDoc.endret) {
                    console.log("hits similar");
                        // Same document
                    } else {
                        // For now, take the UT.no document
                        getUt(
                            mappedDoc.utid, 
                            'turer', 
                            function(data) {
                                 console.log("hits === 0");
                                indexDocument(data, completedCallback, completedCallback);
                            }, 
                            function() {
                                completedCallback(); 
                                console.log("error getting doc from UT.no")
                            }
                        );
                    }
                }
            } else {
                completedCallback();
            }
            


}

function updateChangedDocs(objectName, docs) {
    var count = _.keys(docs).length;


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
            console.log("mapping ok")
            // The document is ok (i.e. it is a valid UT.no document)
            printLoadStatus();
            docsMapped++;

            client.search({
                index : config.index,
                body: buildQuery(mappedDoc)
            },function(err, data) {
                    console.log("es return");
                    if (err) {
                        completedCallback();
                    } else {
                        handleIndexLookupResponse(data, completedCallback);
                    }

                    
                }
            );
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
                success(data);
            }
        });
}





parameters =  { after : '2015-03-11T19:10:38' , limit: 50 };
updateData('turer', parameters);
