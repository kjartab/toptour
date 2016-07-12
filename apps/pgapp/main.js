var utapi = require('./utapi.js');
var toptourData = require('./toptourdata.js');


function fetchAndHandleUpdates(type, params, success, errorHandler) {

    function callback(data) {

        if (data.count > 0 && data.total < (parameters.skip + data.count)) {

            // pass on to message/update handler
            
            handleUpdates(data);

        } else {

            success();

        }

    }

    utapi.get(type, params, callback, errorHandler);



}


function processUpdates(type, params) {


    var parameters = parameters || { after : '2016-03-01T00:00:38', limit : 50, skip : 0 };

    function error() {
        console.log("error updating");
    }

    function success() {
        console.log("done");
        finish();
    }

    fetchAndHandleUpdates(type, parameters, success, error)

}




