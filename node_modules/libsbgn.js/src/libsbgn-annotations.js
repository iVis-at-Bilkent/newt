/**
 * This submodule manages the annotations extension. It adds the ability to save semantic data into
 * SBGN-ML in the form of RDF elements. Any SBGN element that can host an extension tag can also 
 * get RDF annotations. This means that almost every element can get annotated.
 *
 * The annotations here are intended to be used in two ways:
 * - with controlled vocabulary and resources, as suggested by COMBINE, with the help of MIRIAM
 *   identifiers.
 * - as a mean to attach arbitrary data in the form of key-value properties.
 *
 * # Controlled vocabulary
 *
 * The formal way of using annotations is to use specific vocabulary with specific identifiers to
 * provide additional information that can not be conveyed otherwise through the SBGN format.
 * See --link to combine qualifiers-- and --link to identifiers.org and MIRIAM---
 * This was also based on the annotation extension of SBML --link to annotation proposal for SBML--
 *
 *
 * See {@link Extension} for more general information on extensions in the SBGN-ML format.
 *
 * You can access the following classes like this: <code>libsbgn.annot.Annotation</code>
 *
 * @module libsbgn-annotations
 * @namespace libsbgn.annot
*/

var checkParams = require('./utilities').checkParams;
var $rdf = require('rdflib');
var N3 = require('n3');
var Util = require('./annotation-utils');
var utils = require('./utilities');

var ns = {};

//ns.xmlns = "http://www.sbml.org/sbml/level3/version1/render/version1";

// ------- ANNOTATION -------
/**
 * Represents the <code>&lt;annotation&gt;</code> element.
 * @class
 * @param {Object} params
 * @param {RdfElement=} params.rdfElement
 */
var Annotation = function (params) {
	var params = checkParams(params, ['rdfElement']);
	this.rdfElement = params.rdfElement;
};

/**
 * @param {RdfElement} rdfElement
 */
Annotation.prototype.setRdfElement = function(rdfElement) {
	this.rdfElement = rdfElement;
};

Annotation.prototype.buildJsObj = function () {
	var annotationJsonObj = {};

	if(this.rdfElement != null) {
		annotationJsonObj =  this.rdfElement.buildJsObj();
	}

	return annotationJsonObj;
};

/**
 * @return {string}
 */
Annotation.prototype.toXML = function() {
	return utils.buildString({annotation: this.buildJsObj()})
};

Annotation.fromXML = function (string) {
	var annotation;
	function fn (err, result) {
		annotation = Annotation.fromObj(result);
	};
	utils.parseStringKeepPrefix(string, fn);
	return annotation;
};

Annotation.fromObj = function (jsObj) {
	if (typeof jsObj.annotation == 'undefined') {
		throw new Error("Bad XML provided, expected tagName annotation, got: " + Object.keys(jsObj)[0]);
	}

	var annotation = new ns.Annotation();
	jsObj = jsObj.annotation;
	if(typeof jsObj != 'object') { // nothing inside, empty xml
		return annotation;
	}

	// children
	if(jsObj['rdf:RDF']) {
		var obj = {};
		obj['rdf:RDF'] = jsObj['rdf:RDF'][0];
		var rdf = ns.RdfElement.fromObj(obj);
		annotation.setRdfElement(rdf);
	}

	return annotation;
};

ns.Annotation = Annotation;
// ------- END ANNOTATION -------

// ------- STOREOBJECT -------
var StoreObject = function (params) {
	var params = checkParams(params, ['store']);
	if (params.store) {
		this.store = params.store;
	}
	else {
		var store = N3.Store();
		store.addPrefixes(Util.prefixes);
		this.store = store;
	}
};

StoreObject.prototype.getCustomPropertiesOfId = function (id) {
	return Util.getCustomPropertiesOfId(this.store, id);
};

StoreObject.prototype.getAllIds = function () {
	return Util.getAllIds(this.store);
};

StoreObject.prototype.addCustomProperty = function (id, kvObject) {
	return Util.addCustomProperty(this.store, id, kvObject);
};

StoreObject.prototype.getResourcesOfId = function(id) {
	return Util.getResourcesOfId(this.store, id);
};

StoreObject.prototype.addResource = function (id, kvObject) {
	return Util.addResource(this.store, id, kvObject);
};

ns.StoreObject = StoreObject;
// ------- END STOREOBJECT -------

// ------- GLOBALSTORE -------
var GlobalRdfStore = function (params) {
	ns.StoreObject.call(this, params);
};
GlobalRdfStore.prototype = Object.create(ns.StoreObject.prototype);
GlobalRdfStore.prototype.constructor = GlobalRdfStore;

GlobalRdfStore.prototype.load = function (annotations) {
	for(var i=0; i<annotations.length; i++) {
		var annot = annotations[i];
		if(annot.rdfElement != null) {
			var rdfElement = annot.rdfElements;
			this.store.addTriples(rdfElement.store.getTriples());
		}
	}
	this.store.addPrefixes(Util.prefixes);
};

GlobalRdfStore.prototype.test = function () {
	console.log("globalstore test");
	var id2 = "http://local/anID000002";
	var id1 = "http://local/anID000001";
	console.log("all properties of id2", this.getCustomPropertiesOfId(id2));
	console.log("all ids", this.getAllIds());
	console.log("hasSIO", Util.hasRelationship(this.store, id2, "sio:SIO_000223"));
	console.log("add hasprop", Util.getRelationship(this.store, id1, "sio:SIO_000223"));
	console.log("add hasprop2", Util.getRelationship(this.store, id2, "sio:SIO_000223"));
	console.log("hasSIO2", Util.hasRelationship(this.store, id2, "sio:SIO_000223"));
	console.log("add kvprop", Util.addCustomProperty(this.store, id2, {test: "testvalue"}));
	console.log("all properties of id2", this.getCustomPropertiesOfId(id2));
	console.log("-------");
	console.log("all properties of id", this.getCustomPropertiesOfId(id1));
	console.log("add kvprop", Util.addCustomProperty(this.store, id1, {test: "testvalue"}));
	console.log("all properties of id", this.getCustomPropertiesOfId(id1));
	console.log("**********");
	console.log("get all resources", Util.getResourcesOfId(this.store, id1));
	console.log("get all resources for id2", Util.getResourcesOfId(this.store, id2));
	console.log("**********");
	console.log("add resource for id2", Util.addResource(this.store, id2, {"bqbiol:is": "http://aURL"}));
	console.log("get all resources for id2", Util.getResourcesOfId(this.store, id2));
	console.log("add resource for id2", Util.addResource(this.store, id2, {"bqmodel:is": "http://aURLZZZ"}));
	console.log("get all resources for id2", Util.getResourcesOfId(this.store, id2));
	/*var self = this;
	this.getAllIds().forEach(function(e){
		console.log(e, self.getCustomPropertiesOfId(e));
	});*/
};

ns.GlobalRdfStore = GlobalRdfStore;
// ------- END GLOBALSTORE -------

// ------- RDFELEMENT -------
/**
 * Represents the <code>&lt;rd:RDFf&gt;</code> element.
 * @class
 */
var RdfElement = function (params) {
	ns.StoreObject.call(this, params);
};
RdfElement.prototype = Object.create(ns.StoreObject.prototype);
RdfElement.prototype.constructor = RdfElement;

RdfElement.uri = 'http://www.eisbm.org/';

/**
 * @return {string}
 */
RdfElement.prototype.toXML = function() {
	/*
		Add some functions to the writer object of N3
		Those functions will allow us to serialize triples synchronously.
		Without it, we would be forced to use the asynchronous functions.
	*/
	function addSimpleWrite (writer) {
		// replicates the writer._write function but returns a string
		writer.simpleWriteTriple = function (subject, predicate, object, graph) {
			return this._encodeIriOrBlankNode(subject) + ' ' +
                  this._encodeIriOrBlankNode(predicate) + ' ' +
                  this._encodeObject(object) +
			(graph ? ' ' + this._encodeIriOrBlankNode(graph) + '.\n' : '.\n')
		};
		// allows to provide an array of triples and concatenate their serialized strings
		writer.simpleWriteTriples = function (array) {
			var stringN3 = '';
			for (var i=0; i<array.length; i++) {
				var triple = array[i];
				stringN3 += this.simpleWriteTriple(triple.subject, triple.predicate, triple.object, triple.graph);
			}
			return stringN3;
		};
	}

	// serialize the stored graph to N3
	var writer = N3.Writer({ prefixes: Util.prefixes, format: 'N-Triples' });
	addSimpleWrite(writer); // add our custom methods to the writer
	var stringN3 = writer.simpleWriteTriples(this.store.getTriples()); // use custom method to serialize triples

	// read N3 format
	var graph = $rdf.graph();
	try {
	    $rdf.parse(stringN3, graph, RdfElement.uri, 'text/n3');
	} catch (err) {
	    console.log(err);
	}
	/*
		The namespace prefixes are lost in the n3 format, so rdflib will guess them on its own.
		The result gives weird wrong prefixes. Here we provide the original names. Aesthetic purpose only.
	*/
	graph.namespaces = Util.prefixes;

	/*
		serialize to RDF+XML 
		problem, the output differs from the original XML. rdflib expands collections like Bag, and 
		elements with only atributes. It also makes things less readable.
		We need to replace several things to keep output the same as input. 
	*/
	var serialize = $rdf.serialize($rdf.sym(RdfElement.uri), graph, undefined, 'application/rdf+xml');

	function replaceLi(string) {
		var regexpLi = /<rdf:li( rdf:parseType="Resource")?>[\s\S]*?<(\w+):SIO_000116>([\s\S]*?)<\/\2:SIO_000116>[\s\S]*?<rdf:value>([\s\S]*?)<\/rdf:value>[\s\S]*?<\/rdf:li>/g;
		var result = string.replace(regexpLi, '<rdf:li $2:SIO_000116="$3" rdf:value="$4"/>');
		return result;
	}

	function replaceBag(string) {
		// regexp will spot a transformed bag and capture its content
		var regexpBag = /(<rdf:Description>([\s\S]*?)<rdf:type rdf:resource="http:\/\/www\.w3\.org\/1999\/02\/22-rdf-syntax-ns#Bag"\/>[\s\S]*?<\/rdf:Description>)/g;
		var result1 = string.replace(regexpBag, '<rdf:Bag>$2</rdf:Bag>');
		var result2 = result1.replace(/    <\/rdf:Bag>/g, '</rdf:Bag>');
		return result2;
	}

	function replaceParseType(string) {
		var regexp = / rdf:parseType="Resource"/g;
		return string.replace(regexp, '');
	}

	function replaceSlashInID(string) {
		return string.replace(new RegExp(/rdf:about="\//g), 'rdf:about="');
	}
	
	var result = replaceSlashInID(replaceParseType(replaceLi(replaceBag(serialize))));
	
	return result;
};

/**
 * @param {Element} xml
 * @return {RdfElement}
 */
RdfElement.fromString = function (stringXml) {

	var rdfElement = new RdfElement();
	var graph = $rdf.graph();

	// rdflib only accepts string as input, not xml elements
	try {
	    $rdf.parse(stringXml, graph, RdfElement.uri, 'application/rdf+xml');
	} catch (err) {
	    console.log(err);
	}
	
	// convert to turtle to feed to N3
	var turtle = $rdf.serialize($rdf.sym(RdfElement.uri), graph, undefined, 'text/turtle');

	var parser = N3.Parser();
	var store = N3.Store();
	store.addPrefixes(Util.prefixes);
	store.addTriples(parser.parse(turtle));
	
	rdfElement.store = store;

	return rdfElement;
};

RdfElement.fromXML = function (string) {
	var rdfElement;
	function fn (err, result) {
        rdfElement = RdfElement.fromObj(result);
    };
    utils.parseStringKeepPrefix(string, fn);
    return rdfElement;
};

RdfElement.prototype.buildJsObj = function () {
	var rdfElementJsObj;
	function fn (err, result) {
		rdfElementJsObj = result;
	};
	utils.parseStringKeepPrefix(this.toXML(), fn);
	return rdfElementJsObj;
};

RdfElement.fromObj = function (jsObj) {
	if (typeof jsObj['rdf:RDF'] == 'undefined') {
		throw new Error("Bad XML provided, expected tagName rdf:RDF, got: " + Object.keys(jsObj)[0]);
	}

	var rdfElement = new ns.RdfElement();
	jsObj = jsObj['rdf:RDF'];
	if(typeof jsObj != 'object') { // nothing inside, empty xml
		return rdfElement;
	}

	var obj = {};
	obj['rdf:RDF'] = jsObj;
	rdfElement = ns.RdfElement.fromString(utils.buildString(obj));

	return rdfElement;
};

RdfElement.prototype.test = function() {
	//console.log(this.store);
	//console.log(this.store.getTriples("http://local/anID000001", null, null));
	console.log("expand prefix shortcut", Util.expandPrefix("sio:SIO_000116"));
	console.log("all properties of id", this.getCustomPropertiesOfId("http://local/anID000001"));
	console.log("all ids", this.getAllIds());
};

ns.RdfElement = RdfElement;
// ------- END RDFELEMENT -------


ns.rdflib = $rdf;
ns.Util = Util;

module.exports = ns;
