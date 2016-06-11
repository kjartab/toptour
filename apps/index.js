var utnoProxy = require('./utnoProxy.js');
var pgStorage = require('./pgStorage.js');
var _ = require('underscore');

var sync = function(config) {

    var utno = new utnoProxy(config);



    var updateQueues = {

    };

    var objUpdateQueues = {

    };

    // Process updates after parameters.after datetime


    function append(type) {

        _.each(newUpdates, function(newUpdate) {
            objUpdateQueues[type][newUpdate._id] = newUpdate;
        });

        var queue = objUpdateQueues[type];
    }

    function handleUpdateQueue(type) {
        var updates = updateQueues[type];

        if (!objUpdateQueues.hasOwnProperty(type)) {
            objUpdateQueues[type] = {};
        }

        pgStorage.getNewUpdates(type, updates, function(newUpdates) {


            // All new updates gathered, empty the update queue
            updateQueues[type] = {};

            gatherNewDocuments(type);

        });

    }

    function getAndHandleUpdates(type, parameters) {
        function error() {
            console.log("error");
        }
        function success() {
            handleUpdateQueue(type);
        }
        getUpdates(type, parameters, success, error);
    }

    function getAlteredDocs(documents, callback) {
        isRateLimitExceeded()
        pgStorage.getAlteredDocuments(documents, callback);
    }

    function addUpdatesToQueue(type, updates) {
        if (!updateQueues.hasOwnProperty(type)) {
            updateQueues[type] = {};
        }
        var queue = updateQueues[type];

        _.each(updates, function(update) {

            if (!queue.hasOwnProperty(update._id)) {
                queue[update._id] = update;
            } else {
                var existingUpdate = Date.parse(queue[update._id].endret)
                var newUpdate = Date.parse(update.endret);

                if (newUpdate > existingUpdate) {
                    queue[update._id] = update;
                }
            }
        });

        console.log("added " + Object.keys(queue).length + " to queue: " + type);

    }

    function getUpdates(type, parameters, success, error) {

        utno.get(
            type, 
            parameters, 
            function(data) {

                parameters.skip += data.count;                
                addUpdatesToQueue(type, data.documents);

                if (data.total == 0) {
                    success(data);
                } else if (data.total <= parameters.skip) {
                    success(data);
                } else {
                    getUpdates(type, parameters, success, error);
                }
                
            },
            error
        );
    }

    return {
        getAndHandleUpdates : getAndHandleUpdates
    }

}




var config = {
    "utno" : {
        "host": "dev.nasjonalturbase.no",
        "apiKey" : '0e1718433eece23d17c3f49c55018c5bd2181c99'
    },
    "pg" : {
        "connectionStrin" : "postgres://username:password@localhost/database"
    }
}


var s = sync(config);

parameters =  { after : '2016-05-05T14:23:00' , limit: 50 , skip: 0};


s.getAndHandleUpdates(
    'turer', 
    parameters);