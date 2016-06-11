var http = require('http');
var https = require('https');

var utnoProxy = function(config) {

	var apiKey = config.utno.apiKey;

	// Keep track of rate limit
	var rateLimitMax =  500;
	var rateLimitReset = "";
	var rateLimitUsed = 0;


    function buildUrl(type, parameters) {
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
        return '/' + type + (id ? '/' + id : '') + '?api_key=' + apiKey + parameterString;
    }

    function isRateLimitExceeded() {
        if (rateLimitMax >= rateLimitUsed) {
            return true;
        }
        return false;
    }

    function getRateLimitReset() {
        return rateLimitReset;
    }

    function updateRateInfo(headers) {

        if (headers.hasOwnProperty('x-ratelimit-limit')) {
            rateLimitMax = headers['x-ratelimit-limit'];
        }

        if (headers.hasOwnProperty('x-ratelimit-remaining')) {
            rateLimitUsed = headers['x-ratelimit-remaining'];
        }

        if (headers.hasOwnProperty('x-ratelimit-reset')) {
            rateLimitReset = new Date(Number(headers['x-ratelimit-reset']*1000))
        }
        printRateInfo();
    }

    function printRateInfo() {
        console.log('Limit: ' + rateLimitMax);
        console.log('Limit used: ' + rateLimitUsed);
        console.log('Limit reset: ' + rateLimitReset);
    }


    function get(type, parameters, success, error) {

	    var req = https.get({
	        host: config.utno.host,
            path: buildUrl(type, parameters)
        }, function(res) {
		    res.setEncoding('utf8');
            var body = "";

            res.on('data', function(resData) {
                body += resData;
            });
            res.on('end', function() {
                var json = JSON.parse(body);

                updateRateInfo(res.headers);
            	success(json);
            });
        });


        req.on('error', function(e){
           error(e);
        });

    }



    return {
        isRateLimitExceeded : isRateLimitExceeded,
        getRateLimitReset: getRateLimitReset,
        get: get
    }
}


module.exports = utnoProxy;