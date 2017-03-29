var libxmljs = require('libxmljs');
fs = require('fs');

function validateSBGNML(sbgnml, res) {
	//console.log("validating", sbgnml);

	fs.readFile('app/resources/libsbgn-0.3.xsd', 'utf8', function (err, data) {
	  if (err) {
	  	// res.send something in case of error
	    return console.log(err);
	  }
	  var xsdDoc = libxmljs.parseXml(data);
	  var xmlDoc = libxmljs.parseXml(sbgnml);
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
	  	res.send("validate OK");
	  }
	});
}

/*
	processes all the ajax calls to this file
	use the "fn" argument to determine which function to execute
*/
exports.processRequest = function(req, res) {
	var fn = req.query.fn;
	// need sanity check for fn, send bad request if not present
	if (fn == "validateSBGNML") {
		var xmlInput = req.query.xml;
		validateSBGNML(xmlInput, res);
	}
}