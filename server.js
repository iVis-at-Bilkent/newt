var express = require('express');
var app = express();
var bodyParser = require('body-parser');
const multer = require('multer');
const { spawn } = require('child_process');
var server = require('http').createServer(app);
var port = process.env.PORT || 80;
app.use(bodyParser.urlencoded({
	limit: "100mb",
	extended: false
  }));
  app.use(bodyParser.json());
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

app.post('/simulate', function(req, res) {
    const python = spawn('env/bin/python', ['simulator.py', req.body.file, req.body.start, req.body.stop, req.body.step]);
    
    new Promise((resolve, reject) => {
      let stdoutData = '';
      let stderrData = '';
  
      python.stdout.on('data', (data) => {
        stdoutData += data.toString();
      });
      python.stderr.on('data', (data) => {
        stderrData += data.toString();
      });
  
      python.on('close', (code) => {
        if (code === 0) {
            resolve(JSON.parse(stdoutData));  // Resolve with accumulated stdout data
        } else {
            reject(stderrData);  // Reject with accumulated stderr data
        }
      });
    })
	.then((data) => {
		res.status(200).send(data);
	})
	.catch((err) => {
		res.status(500).send(err);
	});
});

app.use('/libs', express.static(__dirname + '/libs'));
app.use(express.static(__dirname, {dotfiles: 'ignore'}));
