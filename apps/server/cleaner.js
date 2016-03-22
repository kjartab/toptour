var _ = require('underscore');
var elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client({
  host: 'localhost:9200'
  // log: 'trace'
});




var env = 'dev';
var env = 'prod';
var config = config || {
    index : 'toptour' + (env === 'dev' ? '_dev' : '')
}

var turbase = {
    host: (env === 'dev' ? 'dev' : 'api') + '.nasjonalturbase.no',
    port: 80
};

var api_key = '0e1718433eece23d17c3f49c55018c5bd2181c99';




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

function getQuery() {

}

function lookThrough() {

    var allTitles = [];
    var utIds = [];

    // first we do a search, and specify a scroll timeout
    client.search({
      index: config.index,
      // Set to 30 seconds because we are calling right back
      scroll: '30s',
      search_type: 'scan',  
      q: getQuery()
    }, function getMoreUntilDone(error, response) {
      // collect the title from each response
        response.hits.hits.forEach(function (hit) {
            // allTitles.push(hit.fields.title);
            if (!hit._source.hasOwnProperty('utid')) {
                // deleteDocument(hit._id, 'tour', config.index);
                console.log(hit);
                console.log(hit._id);
            }
            // console.log(hit);


        });

      if (response.hits.total !== allTitles.length) {
        // now we can call scroll over and over
        client.scroll({
          scrollId: response._scroll_id,
          scroll: '30s'
        }, getMoreUntilDone);
      } else {
        console.log('every "test" title', allTitles);
      }
    });
}


function deleteDocument(id, success, error) {


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


lookThrough();