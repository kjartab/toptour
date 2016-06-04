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


}


 // INSERT INTO utno.tur(turjosn) values ('{"test" : "test" }')


// getRecords(end);




var counter = 0;
var ids = {};
function insertRecords(hits, callback) {
  body = [];
  for (var i=0; i<hits.length; i++) {
    counter++;
    if (ids.hasOwnProperty(hits[i]._id)) {
      console.log("HAS ID" + hits[i]._id);
    } else {
      ids[hits[i]._id] = hits[i];
    }
    // console.log()
    body.push({index : { _index : "test", _type : "tur", _id : hits[i]._id }});
    body.push(hits[i]._source);
  }
  // console.log(hits);

  client.bulk({body : body }, function() {
    console.log("lest " + counter);
    callback();
  });
}



var index = "toptour";


var allTitles = [];

// first we do a search, and specify a scroll timeout
client.search({
  index: 'toptour',
  // Set to 30 seconds because we are calling right back
  scroll: '30s',
  search_type: 'scan',

    body: '{ "query" : { "match_all": {} }}'

}

function createIndex(params, success) {

  client.indices.create(params, success)

}




function getMoreUntilDone(error, response) {

    response.hits.hits.forEach(function (hit) {
        allTitles.push(hit._source.navn);
    });

    if (response.hits.total !== allTitles.length) {
        if (response.hits.hits.length > 0) {
            insertRecords(response.hits.hits, function() {

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

