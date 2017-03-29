var express = require('express');
var app = express();
var server = require('http').createServer(app);
var port = process.env.port || 80;

var ajaxUtilities = require('./app/js/ajax-utilities');
app.get('/utilities', function(req, res){
	ajaxUtilities.processRequest(req, res);
});

server.listen(port, function(){
  console.log('server listening on port%d', port);
});

app.use(express.static(__dirname));