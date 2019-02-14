var express = require('express');
var app = express();
var server = require('http').createServer(app);
var port = process.env.port || 8080;

var ajaxUtilities = require('./app/js/ajax-utilities');

/**
 * This function redirects requests from the application to the corresponding function
 * located in ajax-utilities. The desired function is passed in the URL.
 */
function requestHandler(req, res){
	// :fn holds the name of the function to call in ajax-utilities.js
	var fn = req.params.fn || "";
	if (typeof ajaxUtilities[fn] !== "function") {
		// URL doesn't point to an actual function
		res.sendStatus(400);
	}
	else{
		try {
			ajaxUtilities[fn](req, res);
		}
		catch (err) {
			// this cannot catch the errors thrown INSIDE the function called above
			// if this function performs ASYNCHRONOUS things
			console.log("Error with call to /utilities/"+fn+" with query: "+req.query, err);
			res.sendStatus(500);
		}
	}
}
app.get('/utilities/:fn', requestHandler);
app.post('/utilities/:fn', requestHandler);

server.listen(port, function(){
  console.log('server listening on port: %d', port);
});
app.use(express.static(__dirname));




