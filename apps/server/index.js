var express = require('express');
var app = express();
var cors = require('cors');
app.use(cors());

var url = require('url')
var port = 3000;
var server = app.listen(port);

config.server = "localhost:"+port;


<<<<<<< HEAD


app.get('/trips', function(req, res) {
    
=======
function callback(err, data) {
    if (err) {
        res.send(400, "error");
    } else {
        res.send(JSON.stringify(data));
    }        
}

app.get('/search', function(req, res) {

    es.search('_all', req, callback); 

});


app.get('/search/{type}', function(req, res) {

    es.search(type, req, callback); 

});

app.get('/trips', function(req, res) {


    es.get('trips', callback) {

    }
>>>>>>> 7f61f7440c0a0e8df53db4a36cbcf6e2fc92978e

});

app.get('/places', function(req, res) {



});

app.get('/regions', function(req, res) {


});

app.get('/events', function(req, res) {


});

app.get('/photos', function(req, res) {


});


