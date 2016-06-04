var http = require('http');
var _ = require('underscore');
var elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client({
  host: '10.0.0.116:9200'
  // log: 'trace'
});

var pg = require('pg');
var conString = "postgres://postgres:postgres@10.0.0.116/toptour";

function done() {
    return;
}

function end() {
    return;
}

function insertRecords(hits, callback) {

    var count = hits.length;

    var query = "";
    for (var i=0; i<hits.length; i++) {
        // console.log(hits[i]._source);

        var data = { 
                'url' : hits[i]._source.url,
                'tilkomst' : hits[i]._source.tilkomst, 
                'tilbyder' : hits[i]._source.tilbyder,
                'lisens' : hits[i]._source.lisens
                // 'beskrivelse' : hits[i]._source.beskrivelse
                // 'url' : hits[i]._source.url,
                // 'url' : hits[i]._source.url


            };
        query +=  "INSERT INTO utno.tur(geom, turjson) values ( ST_SetSRID(ST_GeomFromGeoJSON('"+  JSON.stringify(hits[i]._source.geojson) + "'),4326), '" + JSON.stringify(data).replace(/'/g, "\'\'").replace('\\\'', '\'\'') + "');";

    }


    var client = new pg.Client(conString);
    client.connect(function(err) {
      if(err) {
        return console.error('could not connect to postgres', err);
      }
      client.query(query, function(err, result) {

        if(err) {
          return console.error('error running query', err);
        }

        client.end();
        callback();

        });

      });

     


}


 // INSERT INTO utno.tur(turjosn) values ('{"test" : "test" }')


// getRecords(end);










var index = "toptour";


var allTitles = [];

// first we do a search, and specify a scroll timeout
client.search({
  index: 'toptour',
  // Set to 30 seconds because we are calling right back
  scroll: '30s',
  search_type: 'scan',

    body: '{ "query" : { "match_all": {} }}'

}, 
    function getMoreUntilDone(error, response) {
        // collect the title from each response
        // console.log(error, response);
        response.hits.hits.forEach(function (hit) {
            allTitles.push(hit._source.navn);
        });

        // insertRecords(response.hits.hits);

        if (response.hits.total !== allTitles.length) {
            if (response.hits.hits.length > 0) {
                insertRecords(response.hits.hits, function() {
                    console.log("callback");
                    // now we can call scroll over and over
                    client.scroll({
                      scrollId: response._scroll_id,
                      scroll: '30s'
                    }, getMoreUntilDone);
                });

            } else {
                client.scroll({
                      scrollId: response._scroll_id,
                      scroll: '30s'
                    }, getMoreUntilDone);
            }
            

            

        } else {
            // console.log('every "test" navn', allTitles);
            console.log("done");
        }
    });


function table_exists() {

}

function create_table() {

}

function load_to_pg() {

}