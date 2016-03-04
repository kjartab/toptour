var express = require('express');
var app = express();
var cors = require('cors');
app.use(cors());

var url = require('url')
var port = 3000;
var server = app.listen(port);

config.server = "localhost:"+port;

app.get('/trips', function(req, res) {


function stdCallback(err, data) {
    if (err) {
        res.send(400, "error");
    } else {
        res.send(JSON.stringify(data));
    }        
}


app.get('/search', function(req, res) {
    es.search('_all', req, stdCallback); 
});


app.get('/search/{type}', function(req, res) {
    es.search(type, req, stdCallback); 
});


app.get('/api/{type}/{id}', function(req, res) {
    es.get(type, id, stdCallback);
});



