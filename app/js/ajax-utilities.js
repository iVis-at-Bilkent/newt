var libxmljs = require('libxmljs');
var fs = require('fs');
var request = require('request');
var querystring = require('querystring');
var neo4j = require('neo4j-driver').v1;
var driver = neo4j.driver("bolt://localhost", neo4j.auth.basic("neo4j", "123456"));
var session = driver.session();
/*
	functions in this file all have to take the same arguments:
	 - req: the ajax request object, contains parameters sent threw ajax call in req.query
	 - res: the response object that MUST be called through res.send to send the result back
	The only cases where res.send doesn't need to be used is in case of errors.
	Then it is possible to throw the error and let it be handled by the server.js call.
*/

exports.ReadFromDb = function (req, res) {
	//var url = req.query.url;
	//request.get(url, {timeout: 5000},
 	if(req.method == 'GET') {
			const resultPromise3 = session.run(
  'call ReadGraphFromDb() yield out return out'
	);
 	resultPromise3.then(result3 => {
   var singleRecord = result3.records[0];
  var datas = singleRecord.get(0);
  res.send(datas);
 //  res.sendStatus(200)  ;
 //	}
});
	}
 };
 exports.AddSBGNML = function (req, res) {
	var sbgnml;
 	// passing the entire map for validation is too big to use GET request. POST should be prefered.
	if(req.method == 'POST') {
		var body = '';
		req.on('data', function (data) {
			body += data;
		});
 		req.on('end', function () {
			var resultPromise = session.run(
  'MATCH (n) OPTIONAL MATCH (n)-[r]-() DELETE n,r');
			resultPromise.then( function(){
        session.close();
        driver.close();
				var post = querystring.parse(body);
			sbgnml = post.sbgnml;
 			 session.run(
  'call InsertGraph($name2)',
  {name2: sbgnml}).then( ( result ) => {
        console.log( result );
        session.close();
        driver.close();
    } )
    .catch( ( err ) => { console.log( err ); } );
 			}
 			);
 		});
	}
 };
 exports.Neighbors = function (req, res) {
	var sbgnml;
	var limit;
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
		var post = querystring.parse(body);
			sbgnml = post.sbgnml;
			limit = post.limit;
			const resultPromise3 = session.run(
  'CREATE (a:Person {name2: $name}) RETURN a',
  {name: sbgnml});
 	resultPromise3.then(result3 => {
   var singleRecord = result3.records[0];
  var datas = singleRecord.get(0);
   res.send(datas);
 //  res.sendStatus(200)  ;
 //	}
});
	}
 };
 exports.AddSBGNML2 = function (req, res) {
	var sbgnml;
	var limit;
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
			limit = post.limit;
			const rrd =	 session.run(
  'call Neighbors($name, $limit)',
  {name: sbgnml, limit: neo4j.int(limit)});
   rrd.then(result3 => {
   var singleRecord = result3.records[0];
  var datas = singleRecord.get(0);
  if(datas == null){
      res.send("null")
  }
  else{
  res.send(datas);
  }
   //res.sendStatus(200)  ;
 //	}
});
 		});
	}
	else if(req.method == 'GET') {
		sbgnml = req.query.sbgnml;
 	}
 };
 exports.PathsTo	 = function (req, res) {
     req.setTimeout(0);
	var sbgnml;
	var limit;
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
			target = post.target;
			source = post.source;
			limit = post.limit;
			addition = post.addition;
			const rrd =	 session.run(
  'call PathsBetween($source, $target, $limit, $addition)',
  {source: source, target: target,limit: neo4j.int(limit), addition: neo4j.int(addition)});
   rrd.then(result3 => {
   var singleRecord = result3.records[0];
  var datas = singleRecord.get(0);
  if(datas == null){
      res.send("null")
  }
  else{
  res.send(datas);
  }
 //  res.sendStatus(200)  ;
 //	}
});
 		});
	}
	else if(req.method == 'GET') {
		sbgnml = req.query.sbgnml;
 	}
 };
 exports.GOI	 = function (req, res) {
     req.setTimeout(0);
	var sbgnml;
	var limit;
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
			genes = post.genes;
			limit = post.limit;
			direction = post.direction;
			const rrd =	 session.run(
  'call GOI($genes, $limit, $direction)',
  {genes: genes ,limit: neo4j.int(limit), direction: neo4j.int(direction)});
   rrd.then(result3 => {
   var singleRecord = result3.records[0];
  var datas = singleRecord.get(0);


  if(datas == null){
      res.send("null")
  }
  else{
  res.send(datas);
  }


  session.close();
  driver.close();

   //res.sendStatus(200)  ;
 //	}
}).catch(( err ) => { console.log( err ); })   ;
 		});





	}
	else if(req.method == 'GET') {
		sbgnml = req.query.sbgnml;
 	}
 };

 exports.Stream = function (req, res) {
	var sbgnml;
	var limit;
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
			limit = post.limit;
			dir = post.dir;
			const rrd =	 session.run(
  'call StreamHighlight($name, $limit, $dir)',
  {name: sbgnml, limit: neo4j.int(limit),dir: neo4j.int(dir) });
   rrd.then(result3 => {
   var singleRecord = result3.records[0];
  var datas = singleRecord.get(0);
   res.send(datas);
 //  res.sendStatus(200)  ;
 //	}
});
 		});
	}
	else if(req.method == 'GET') {
		sbgnml = req.query.sbgnml;
 	}
 };

 exports.HighlightSeeds = function (req, res) {
  var sbgnml;
  var limit;
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
      const rrd =	 session.run(
  'call ReturnIdSForHighlight($name)',
  {name: sbgnml});
   rrd.then(result3 => {
   var singleRecord = result3.records[0];
  var datas = singleRecord.get(0);
   res.send(datas);
 //  res.sendStatus(200)  ;
 //	}
 });
    });
  }
  else if(req.method == 'GET') {
    sbgnml = req.query.sbgnml;
  }
 };

 exports.Stream2 = function (req, res) {
	var sbgnml;
	var limit;
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
			limit = post.limit;
			dir = post.dir;
			const rrd =	 session.run(
  'call StreamPaths($name, $limit, $dir)',
  {name: sbgnml, limit: neo4j.int(limit),dir: neo4j.int(dir) });
   rrd.then(result3 => {
   var singleRecord = result3.records[0];
  var datas = singleRecord.get(0);
  if(datas == null){
      res.send("null")
  }
  else{
  res.send(datas);
  }
   //res.sendStatus(200)  ;
 //	}
});
 		});
	}
	else if(req.method == 'GET') {
		sbgnml = req.query.sbgnml;
 	}
 };




exports.ReadFromDb = function (req, res) {
	//var url = req.query.url;
	//request.get(url, {timeout: 5000},


	if(req.method == 'GET') {
			const resultPromise3 = session.run(
  'call ReadGraphFromDb() yield out return out'
	);

	resultPromise3.then(result3 => {


  var singleRecord = result3.records[0];
  var datas = singleRecord.get(0);
  res.send(datas);

//  res.sendStatus(200)  ;


//	}
});
	}



};

exports.AddSBGNML = function (req, res) {
	var sbgnml;


	// passing the entire map for validation is too big to use GET request. POST should be prefered.
	if(req.method == 'POST') {
		var body = '';
		req.on('data', function (data) {
			body += data;
		});

		req.on('end', function () {
			var resultPromise = session.run(
  'MATCH (n) OPTIONAL MATCH (n)-[r]-()DELETE n,r' );
			resultPromise.then( function(){
				var post = querystring.parse(body);
			sbgnml = post.sbgnml;

			 session.run(
  'call InsertGraph($name2)',
  {name2: sbgnml});

			}





			);


		});
	}



};

exports.Neighbors = function (req, res) {
	var sbgnml;
	var limit;

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
		var post = querystring.parse(body);
			sbgnml = post.sbgnml;
			limit = post.limit;
			const resultPromise3 = session.run(
  'CREATE (a:Person {name2: $name}) RETURN a',
  {name: sbgnml});

	resultPromise3.then(result3 => {


  var singleRecord = result3.records[0];
  var datas = singleRecord.get(0);

  res.send(datas);

//  res.sendStatus(200)  ;


//	}
});
	}

};

exports.AddSBGNML2 = function (req, res) {
	var sbgnml;
	var limit;

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
			limit = post.limit;
			const rrd =	 session.run(
  'call Neighbors($name, $limit)',
  {name: sbgnml, limit: neo4j.int(limit)});

  rrd.then(result3 => {


  var singleRecord = result3.records[0];
  var datas = singleRecord.get(0);

  res.send(datas);

  //res.sendStatus(200)  ;


//	}
});


		});
	}
	else if(req.method == 'GET') {
		sbgnml = req.query.sbgnml;


	}


};



exports.PathsTo	 = function (req, res) {
	var sbgnml;
	var limit;

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
			target = post.target;
			source = post.source;
			limit = post.limit;
			addition = post.addition;
			const rrd =	 session.run(
  'call PathsBetween($source, $target, $limit, $addition)',
  {source: source, target: target,limit: neo4j.int(limit), addition: neo4j.int(addition)});

  rrd.then(result3 => {


  var singleRecord = result3.records[0];
  var datas = singleRecord.get(0);

   res.send(datas);

//  res.sendStatus(200)  ;


//	}
});


		});
	}
	else if(req.method == 'GET') {
		sbgnml = req.query.sbgnml;


	}


};

exports.GOI	 = function (req, res) {
	var sbgnml;
	var limit;

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
			genes = post.genes;
			limit = post.limit;
			direction = post.direction;
			const rrd =	 session.run(
  'call GOI($genes, $limit, $direction)',
  {genes: genes ,limit: neo4j.int(limit), direction: neo4j.int(direction)});

  rrd.then(result3 => {


  var singleRecord = result3.records[0];
  var datas = singleRecord.get(0);

   res.send(datas);

  //res.sendStatus(200)  ;


//	}
});


		});
	}
	else if(req.method == 'GET') {
		sbgnml = req.query.sbgnml;


	}


};


exports.Stream = function (req, res) {
	var sbgnml;
	var limit;

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
			limit = post.limit;
			dir = post.dir;
			const rrd =	 session.run(
  'call StreamHighlight($name, $limit, $dir)',
  {name: sbgnml, limit: neo4j.int(limit),dir: neo4j.int(dir) });

  rrd.then(result3 => {


  var singleRecord = result3.records[0];
  var datas = singleRecord.get(0);

  res.send(datas);

//  res.sendStatus(200)  ;


//	}
});


		});
	}
	else if(req.method == 'GET') {
		sbgnml = req.query.sbgnml;


	}


};

exports.Stream2 = function (req, res) {
	var sbgnml;
	var limit;

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
			limit = post.limit;
			dir = post.dir;
			const rrd =	 session.run(
  'call StreamPaths($name, $limit, $dir)',
  {name: sbgnml, limit: neo4j.int(limit),dir: neo4j.int(dir) });

  rrd.then(result3 => {


  var singleRecord = result3.records[0];
  var datas = singleRecord.get(0);

  res.send(datas);

  //res.sendStatus(200)  ;


//	}
});


		});
	}
	else if(req.method == 'GET') {
		sbgnml = req.query.sbgnml;


	}


};


/**
 * 100MB limit to map size, to avoid potential flood.
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
			xsdString = fs.readFileSync('app/resources/libsbgn-0.3.xsd', {encoding: 'utf8'});// function (err, data) {
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
	var url = req.query.url;
	request.get(url, {timeout: 5000}, function (error, response, body) {
		res.send({error: error, response: response});
	});
};
