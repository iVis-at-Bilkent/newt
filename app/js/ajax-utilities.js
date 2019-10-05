var libxmljs = require('libxmljs');
var fs = require('fs');
var request = require('request');
var querystring = require('querystring');
/*
	functions in this file all have to take the same arguments:
	 - req: the ajax request object, contains parameters sent threw ajax call in req.query 
	 - res: the response object that MUST be called through res.send to send the result back
	The only cases where res.send doesn't need to be used is in case of errors.
	Then it is possible to throw the error and let it be handled by the server.js call.
*/
exports.validateSBGNML = function (req, res) {
	var sbgnml;
	// passing the entire map for validation is too big to use GET request. POST should be prefered.
	if(req.method == 'POST') {
		var body = '';
		req.on('data', function (data) {
			body += data;
			// Security: too much POST data, kill the connection!
			// 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
			if (body.length > 1e8) { // kill if more than 100MB
				req.connection.destroy();
				res.status(413);
				res.send("Error: Too much data passed");
				return;
			}
		});

		req.on('end', function () {
			var post = querystring.parse(body);
			sbgnml = post.sbgnml;
			executeValidate(sbgnml, res);
		});
	}
	else if(req.method == 'GET') {
		sbgnml = req.query.sbgnml;
		executeValidate(sbgnml, res);
	}

	function executeValidate(sbgnml, res) {
		var xsdString;
		try {
			xsdString = fs.readFileSync('./app/resources/libsbgn-0.3.xsd', {encoding: 'utf8'});// function (err, data) {
		}
		catch (err) {
			res.status(500);
			res.send("Error: Failed to read xsd file " + err);
			return;
		}

		var xsdDoc;
		try {
			xsdDoc = libxmljs.parseXml(xsdString);
		}
		catch (err) {
			res.status(500);
			res.send("Error: libxmljs failed to parse xsd " + err);
			return;
		}

		var xmlDoc;
		try {
			xmlDoc = libxmljs.parseXml(sbgnml);
		}
		catch (err) {
			res.status(415);
			res.send("Error: libxmljs failed to parse xml " + err);
			return;
		}

		if (!xmlDoc.validate(xsdDoc)) {
			var errors = xmlDoc.validationErrors;
			var errorList = [];
			for(var i=0; i < errors.length; i++) {
				 // I can't understand the structure of this object. It's a mix of object with string in the middle....
				var error = errors[i];
				var message = error.toString(); // get the string message part
				var newErrorObj = {}; // get the object properties
				newErrorObj.message = message;
				for(var key in error) {
					newErrorObj[key] = error[key];
				}
				errorList.push(newErrorObj);
			}
			res.send(errorList);
		}
		else {
			res.send([]);
		}
	}
};

/**
 * Simple get request to other page. Used to test the validity of annotations links.
 * Simply pass the response back.
 * This cannot be done on browser side due to CORS/same-origin policies forbiding requests
 * by the application to other domains than the application's domain.
 */
exports.testURL = function (req, res) {

	var options = {  
		url: req.query.url,
		method: 'GET',
		qs: req.query.qs,
		timeout: 30000
	};
	

	request.get(options, function (error, response, body) {
		res.send({error: error, response: response});
	});

};

exports.ServerRequest = function (req, res) {
	//request for taking authentication from minerva api
	if(req.body.postType === "auth"){
	var options = {  
		url: req.body.address,
		method: 'POST',
		timeout: 30000,
		json: req.body.param,
		contentType: "application/json"
	};
	
	request.post(options, function (error, response, body) {
		res.send({error: error, response: response});
	});
	}else{
		//request for sending the file to be changed
		var headers = {
			"Cookie" : req.body.token,
			"Content-Type": "text/plain"
		}
		var options = {  
			url: req.body.url,
			method: 'POST',
			qs: req.query.qs,
			timeout: 30000,
			body: req.body.file,
			headers: headers
		};
		
		request.post(options, function (error, response, body) {
			res.send({error: error, response: response.body});
		});
	}

};

