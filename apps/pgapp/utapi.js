var http = require('http');

var _ = require('underscore');

var app = function(config) {

    var url = config.utno.url;

    function get(type, parameters) {

        http.get({
            
            host: url,
            path: buildUrl(type, parameters)

        }, function(response) {

            var body = '';
            
            response.on('data', function(d) {
                body += d;
            });

            response.on('end', function() {
                var res = JSON.parse(body);
            });
        });


    }

    return {
        get : get

    }

}

module.exports = app;