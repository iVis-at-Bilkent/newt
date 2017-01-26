var express = require('express');
var app = express();
var server = require('http').createServer(app);
var port = process.env.port || 3000;

server.listen(port, function(){
  console.log('server listening on port%d', port);
});

app.use(express.static(__dirname));