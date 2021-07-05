var ns = {};
var xml2js = require('xml2js');

/*
	guarantees to return an object with given args being set to null if not present, other args returned as is
*/
ns.checkParams = function (params, names) {
	if (typeof params == "undefined" || params == null) {
		params = {};
	}
	if (typeof params != 'object') {
		throw new Error("Bad params. Object with named parameters must be passed.");
	}
	for(var i=0; i < names.length; i++) {
		var argName = names[i];
		if (typeof params[argName] == 'undefined') {
			params[argName] = null;
		}
	}
	return params;
}

ns.getFirstLevelByName = function (xmlObj, localName) {
	var result = [];
	for(var i=0; i<xmlObj.childNodes.length; i++) {
		var child = xmlObj.childNodes[i];
		if (child.localName && child.localName == localName) {
			result.push(child);
		}
	}
	return result;
};

ns.addAttributes = function (jsObj, attributes) {
	jsObj.$ = attributes;
};

ns.parseString = function (string, fn) {
	var parser = new xml2js.Parser({
		tagNameProcessors: [ns.removePrefixForSbgnTags],
		attrValueProcessors: [xml2js.processors.parseNumbers, xml2js.processors.parseBooleans]
	});
	parser.parseString(string, fn);
};

ns.removePrefixForSbgnTags = function (name){
	var sbgnTags = new Set([
		"arc",
		"arcgroup",
		"bbox",
		"callout",
		"clone",
		"end",
		"entity",
		"extension",
		"glyph",
		"label",
		"map",
		"next",
		"notes",
		"point",
		"port",
		"sbgn",
		"start",
		"sate"
	]);

	if(name.indexOf(":") !== -1) { // some prefix found
		var tmp = name.split(":");
		var tagName = tmp[tmp.length - 1];
		if(sbgnTags.has(tagName)) {
			// this is a standard sbgn element, we don't want a prefix
			return tagName;
		}
	}
	return name;
}

ns.parseStringKeepPrefix = function (string, fn) {
	var parser = new xml2js.Parser({
		attrValueProcessors: [xml2js.processors.parseNumbers, xml2js.processors.parseBooleans]
	});
	parser.parseString(string, fn);
};

ns.buildString = function (obj) {
	var xmlString =  new xml2js.Builder({
		headless: true,
		renderOpts: {pretty: false}
	}).buildObject(obj);

	/* 	dirty hack needed to solve the newline char encoding problem
		xml2js doesn't encode \n as &#xA; we need to do it manually
	*/
	var re = /<label text="((.|\n+)+?)"/gm;
	var xmlString_correctLabel = xmlString.replace(re, function(match, p1, p2) {
		return '<label text="'+p1.replace(/\n/g, "&#xA;")+'"';
	});
	return xmlString_correctLabel;
};

/**
 *  Returns child object from a map that correspond to the name. If attributes/node names are prefixed with namespace
 *  this namespace is ignored. If such child does not exist null is returned.
 *
 * @param {Object} obj
 * @param {string} childName
 * @return {Object|null}
 */
ns.getChildByNameIgnoringNamespace = function (obj, childName) {
  if (Array.isArray(obj)) {
    for (var i = 0; i < obj.length; i++) {
      var result = this.getChildByNameIgnoringNamespace(obj[i], childName);
      if (result !== null) {
        return result;
      }
    }
  } else {
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (key === childName) {
          return obj[key];
        } else if (key.endsWith(":" + childName)) {
          return obj[key];
        }
      }
    }
  }
  return null;
};

module.exports = ns;
