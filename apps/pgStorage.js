var pg = require('pg');
var _ = require('underscore');


var pgStorage = function(config) {

    var conString = config.pg.connectionString;


    function query(queryString, callback) {

        pg.connect(conString, function(err, client, done) {
            
            if(err) {
                return console.error('error fetching client from pool', err);
            }
            // client.query(queryString, function(err, result) {
            client.query('SELECT $1::int AS number', ['1'], function(err, result) {

                done();

                if(err) {
                    return console.error('error running query', err);
                }
                callback(result);
                // console.log(result.rows[0].number);
                    //output: 1     
            });
        });
    }
    

    function getNewUpdates(updates, callback) {
        
        // get ids from the updates
        var ids = "2, 3, 4";


        var queryString = "SELECT * FROM test WHERE id IN " + ids;

        // Query for documents, filter out the ones that hasnt changed?
        query(queryString, function(result) {

            _.each(result.rows, function(row) {
                
            });

        });


    }

	return {
		getNewUpdates: getNewUpdates
	}

}

module.exports = pgStorage;