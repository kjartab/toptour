var http = require('http');
var _ = require('underscore');
var elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client({
  host: 'localhost:9200'
  // log: 'trace'
});
var arg;
var args = process.argv;
var env = 'prod';
if (args.length > 2) {
    if (args[2] === 'dev') {
        env = 'dev';
    }
}

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




function fetchAndHandleUpdates(objectName, parameters, success, err) {

    getTurBase(objectName, parameters, function(data) {
        console.log("received updates");
        var check = true;//checkResponse(data);
        if (check) {
            console.log("check ok", data.count, data.total);
            parameters.skip += data.count;
            console.log(data.count + " > 0 &&  " + data.total + " !=  " +parameters.skip)
            if (data.count > 0 && data.total != parameters.skip) {


                handleUpdates(
                    data.documents, 
                    function(data) {
                        console.log("fetch and handle updates - CALLBACK")
                        console.log("next", parameters.skip);
                        fetchAndHandleUpdates(objectName, parameters, success, err);
                    },
                    function(data) {
                        console.log("error next");
                        err();    
                        console.log("fetch and handle updates - ERROR")
                    }
                    );
            } else {

                        console.log("fetch and handle updates - SUCCESS")
                success();
            }
        } else {
            console.log("ERROR - fetch and handle updates")
            err();
        }

    });
}

function handleUpdates(documents, success, error) {
    console.log(documents);
    var docCount = documents.length;

    function onEachSuccess(data) {
        docCount--;
        console.log("doc count ", docCount);
        if (docCount === 0) {
            success();
        }
    }

    function onEachError(data) {
        docCount--;
        console.log("doc count ", docCount);
        if (docCount === 0) {
            success();
        }        
    }

    _.each(documents, function(doc) {

        var mappedDoc = mapData(doc);
        if (mappedDoc) {

            docsMapped++;

            client.search({
                index : config.index,
                body: buildQuery(mappedDoc)
            },
            function(err, data) {
                if (err) {
                    console.log("error", err);
                    error(err);
                } else {
                    handleIndexLookupResponse(mappedDoc, data, onEachSuccess, onEachError);
                }             
            });   
        } else {
            onEachError();
        }

    });


}



function processUpdates(objectName, parameters) {

    var parameters = parameters || { after : '2016-03-01T00:00:38', limit : 50, skip : 0 };

    function error() {
        console.log("error updating");
    }
    function success() {
        console.log("done");
        finish();
    }
    fetchAndHandleUpdates(objectName, parameters, success, error)

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

/* takes as arguments 
    - obj - an object with an UTID property
    - response - the response from Elasticsearch based on obj's UTID 
    - completedCallback - callback which needs to be called
*/
function handleIndexLookupResponse(obj, response, success, error) {

    var hits = response.hits.hits;

    if (hits.length === 0) {
        console.log("NEW DOC!!!", obj);
        // The document does not exist - index it
        getAndIndex(obj, 'turer', success);

    } else if (hits.length > 1) {
        
        console.log("DUPLICATE!!!", obj);
        console.log(hits[0]);
        console.log("======!()/%#)(%!")
        console.log(hits[1]);
        // duplicates - delete all with UT ID and reindex
        deleteDocuments(hits, function() {
            getAndIndex(obj, 'turer', success);
        });

    } else if (hits.length === 1) {
        // On exact hit - check time difference
        if (hits[0]._source.endret == obj.endret) {
            // Same document
        console.log("EXACT HIT, NOT CHANGING",hits[0]._id, obj.endret);
            success();

        } else {
            console.log("EXACT HIT, CHANGING", hits[0]._id);
            // The document is newer or older - delete it and grab doc with UTID
            deleteDocument(hits[0]._id, 
            function() {
                getAndIndex(obj, 'turer', success);
            },
            error);
            
        }
    } else {
        console.log("BIG ERROR!!");
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

    client.index({ 
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





parameters =  { after : '2016-03-05T14:23:00' , limit: 50 , skip: 0};
processUpdates('turer', parameters);
