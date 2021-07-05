/**
 * The API contains two other submodules: {@link libsbgn.render} and {@link libsbgn.annot}
 * @module libsbgn
 * @namespace libsbgn
*/

var renderExt = require('./libsbgn-render');
var annotExt = require('./libsbgn-annotations');
var xml2js = require('xml2js');
var utils = require('./utilities');
var schematronValidator = require('./schematronValidator');
var checkParams = utils.checkParams;

var ns = {}; // namespace that encapsulates all exportable features

ns.xmlns = "http://sbgn.org/libsbgn/0.3";

// ------- SBGNBase -------
/**
 * Parent class for several sbgn elements. Used to provide extension and notes element.
 * End users don't need to interact with it. It can be safely ignored.
 * @class
 * @param {Object} params
 * @param {Extension=} params.extension
 * @param {Notes=} params.notes
 */
var SBGNBase = function (params) {
	var params = checkParams(params, ['extension', 'notes']);
	this.extension 	= params.extension;
	this.notes = params.notes;
};

/**
 * Allows inheriting objects to get an extension element.
 * @param {Extension} extension
 */
SBGNBase.prototype.setExtension = function (extension) {
	this.extension = extension;
};

/**
 * Allows inheriting objects to get a notes element.
 * @param {Notes} notes
 */
SBGNBase.prototype.setNotes = function (notes) {
	this.notes = notes;
};

/**
 * Add the appropriate properties to jsObj.
 * @param {Object} jsObj - xml2js formatted object
 */
SBGNBase.prototype.baseToJsObj = function (jsObj) {
	if(this.extension != null) {
		jsObj.extension = this.extension.buildJsObj();
	}
	if(this.notes != null) {
		jsObj.notes = this.notes.buildJsObj();
	}
};

/**
 * Get the appropriate properties from jsObj.
 * @param {Object} jsObj - xml2js formatted object
 */
SBGNBase.prototype.baseFromObj = function (jsObj) {
	if (jsObj.extension) {
		var extension = ns.Extension.fromObj({extension: jsObj.extension[0]});
		this.setExtension(extension);
	}
	if (jsObj.notes) {
		var notes = ns.Notes.fromObj({notes: jsObj.notes[0]});
		this.setNotes(notes);
	}
};
ns.SBGNBase = SBGNBase;
// ------- END SBGNBase -------

// ------- SBGN -------
/**
 * Represents the <code>&lt;sbgn&gt;</code> element.
 * @class
 * @extends SBGNBase
 * @param {Object} params
 * @param {string=} params.xmlns
 * @param {Map[]=} params.maps
 */
var Sbgn = function (params) {
	ns.SBGNBase.call(this, params);
	var params = checkParams(params, ['xmlns', 'maps']);
	this.xmlns 	= params.xmlns;
	this.maps 	= params.maps || [];
};

Sbgn.prototype = Object.create(ns.SBGNBase.prototype);
Sbgn.prototype.constructor = Sbgn;

/**
 * @param {Map} map
 */
Sbgn.prototype.addMap = function (map) {
	this.maps.push(map);
};

/**
 * @return {Object} - xml2js formatted object
 */
Sbgn.prototype.buildJsObj = function () {
	var sbgnObj = {};

	// attributes
	var attributes = {};
	if(this.xmlns != null) {
		attributes.xmlns = this.xmlns;
	}
	utils.addAttributes(sbgnObj, attributes);

	// children
	this.baseToJsObj(sbgnObj);
	for(var i=0; i < this.maps.length; i++) {
		if (i==0) {
			sbgnObj.map = [];
		}
		sbgnObj.map.push(this.maps[i].buildJsObj());
	}
	return sbgnObj;
};

/**
 * @return {string}
 */
Sbgn.prototype.toXML = function () {
	return utils.buildString({sbgn: this.buildJsObj()});
};

/**
 * @param {String} file
 * @return {Issue[]}
 */
Sbgn.doValidation = function (file) {
   return schematronValidator.doValidation(file);
};

/**
 * @param {String} string
 * @return {Sbgn}
 */
Sbgn.fromXML = function (string) {
    var sbgn;
    function fn (err, result) {
        sbgn = Sbgn.fromObj(result);
    }
    utils.parseString(string, fn);
    return sbgn;
};

/**
 * @param {Object} jsObj - xml2js formatted object
 * @return {Sbgn}
 */
Sbgn.fromObj = function (jsObj) {
	if (typeof jsObj.sbgn == 'undefined') {
		throw new Error("Bad XML provided, expected tagName sbgn, got: " + Object.keys(jsObj)[0]);
	}

	var sbgn = new ns.Sbgn();
	jsObj = jsObj.sbgn;
	if(typeof jsObj != 'object') { // nothing inside, empty xml
		return sbgn;
	}

	if(jsObj.$) { // we have some atributes
		var attributes = jsObj.$;
		sbgn.xmlns = attributes.xmlns || null;

		// getting attribute with 'xmlns' doesn't work if some namespace is defined like 'xmlns:sbgn'
		// so if there is some attribute there, and we didn't find the xmlns directly, we need to into it
		if(!sbgn.xmlns && Object.keys(attributes).length > 0) {
			// sbgn is not supposed to have any other attribute than an xmlns, so we assume the first attr is the xmlns
			var key = Object.keys(attributes)[0];
			if(key.startsWith('xmlns')) {
				sbgn.xmlns = attributes[key];
				sbgn.namespacePrefix = key.replace('xmlns:', '');
			}
			else {
				throw new Error("Couldn't find xmlns definition in sbgn element");
			}
		}
	}

	if(jsObj.map) {
		var maps = jsObj.map;
		for (var i=0; i < maps.length; i++) {
			var map = ns.Map.fromObj({map: maps[i]});
			sbgn.addMap(map);
		}
	}

	sbgn.baseFromObj(jsObj); // call to parent class
	return sbgn;
};
ns.Sbgn = Sbgn;
// ------- END SBGN -------

// ------- MAP -------
/**
 * Represents the <code>&lt;map&gt;</code> element.
 * @class
 * @extends SBGNBase
 * @param {Object} params
 * @param {string=} params.id
 * @param {string=} params.language
 * @param {string=} params.version
 * @param {Glyph[]=} params.glyphs
 * @param {Arc[]=} params.arcs
 * @param {Bbox=} params.bbox
 * @param {Arcgroup[]=} params.arcgroups
 */
var Map = function (params) {
	ns.SBGNBase.call(this, params);
	var params = checkParams(params, ['id', 'language', 'version', 'glyphs', 'arcs', 'bbox', 'arcgroups']);
	this.id 		= params.id;
	this.language 	= params.language;
	this.version	= params.version;
	this.bbox 		= params.bbox;
	this.glyphs 	= params.glyphs || [];
	this.arcs 		= params.arcs || [];
	this.arcgroups 	= params.arcgroups || [];
};

Map.prototype = Object.create(ns.SBGNBase.prototype);
Map.prototype.constructor = Map;

/**
 * @param {Glyph} glyph
 */
Map.prototype.addGlyph = function (glyph) {
	this.glyphs.push(glyph);
};

/**
 * @param {Arc} arc
 */
Map.prototype.addArc = function (arc) {
	this.arcs.push(arc);
};

/**
 * @param {Bbox} bbox
 */
Map.prototype.setBbox = function (bbox) {
	this.bbox = bbox;
};

/**
 * @param {Arcgroup} arc
 */
Map.prototype.addArcgroup = function (arcgroup) {
	this.arcgroups.push(arcgroup);
};

/**
 * @param {string} class_
 * @return {Gyph[]}
 */
Map.prototype.getGlyphsByClass = function (class_) {
	var resultGlyphs = [];
	for(var i=0; i < this.glyphs.length; i++) {
		var glyph = this.glyphs[i];
		if(glyph.class_ == class_) {
			resultGlyphs.push(glyph);
		}
	}
	return resultGlyphs;
};

/**
 * @return {Object} - xml2js formatted object
 */
Map.prototype.buildJsObj = function () {
	var mapObj = {};

	// attributes
	var attributes = {};
	if(this.id != null) {
		attributes.id = this.id;
	}
	if(this.language != null) {
		attributes.language = this.language;
	}
	if(this.version != null) {
		attributes.version = this.version;
	}
	utils.addAttributes(mapObj, attributes);

	// children
	this.baseToJsObj(mapObj);
	if(this.bbox != null) {
		mapObj.bbox =  this.bbox.buildJsObj();
	}
	for(var i=0; i < this.glyphs.length; i++) {
		if (i==0) {
			mapObj.glyph = [];
		}
		mapObj.glyph.push(this.glyphs[i].buildJsObj());
	}
	for(var i=0; i < this.arcs.length; i++) {
		if (i==0) {
			mapObj.arc = [];
		}
		mapObj.arc.push(this.arcs[i].buildJsObj());
	}
	for(var i=0; i < this.arcgroups.length; i++) {
		if (i==0) {
			mapObj.arcgroup = [];
		}
		mapObj.arcgroup.push(this.arcgroups[i].buildJsObj());
	}
	return mapObj;
};

/**
 * @return {string}
 */
Map.prototype.toXML = function () {
	return utils.buildString({map: this.buildJsObj()});
};

/**
 * @param {String} string
 * @return {Map}
 */
Map.fromXML = function (string) {
	var map;
	function fn (err, result) {
        map = Map.fromObj(result);
    };
    utils.parseString(string, fn);
    return map;
};

/**
 * @param {Object} jsObj - xml2js formatted object
 * @return {Map}
 */
Map.fromObj = function (jsObj) {
	if (typeof jsObj.map == 'undefined') {
		throw new Error("Bad XML provided, expected tagName map, got: " + Object.keys(jsObj)[0]);
	}

	var map = new ns.Map();
	jsObj = jsObj.map;
	if(typeof jsObj != 'object') { // nothing inside, empty xml
		return map;
	}

	if(jsObj.$) { // we have some attributes
		var attributes = jsObj.$;
		map.id = attributes.id || null;
		map.language = attributes.language || null;
		map.version = attributes.version || null;
	}

	if(jsObj.bbox) {
		var bbox = ns.Bbox.fromObj({bbox: jsObj.bbox[0]});
		map.setBbox(bbox);
	}
	if(jsObj.glyph) {
		var glyphs = jsObj.glyph;
		for (var i=0; i < glyphs.length; i++) {
			var glyph = ns.Glyph.fromObj({glyph: glyphs[i]});
			map.addGlyph(glyph);
		}
	}
	if(jsObj.arc) {
		var arcs = jsObj.arc;
		for (var i=0; i < arcs.length; i++) {
			var arc = ns.Arc.fromObj({arc: arcs[i]});
			map.addArc(arc);
		}
	}
	if(jsObj.arcgroup) {
		var arcgroups = jsObj.arcgroup;
		for (var i=0; i < arcgroups.length; i++) {
			var arcgroup = ns.Arcgroup.fromObj({arcgroup: arcgroups[i]});
			map.addArcgroup(arcgroup);
		}
	}

	map.baseFromObj(jsObj);
	return map;
};

ns.Map = Map;
// ------- END MAP -------

// ------- EXTENSION -------
/**
 * Represents the <code>&lt;extension&gt;</code> element.
 * @class
 */
var Extension = function () {
	// consider first order children, add them with their tagname as property of this object
	// store string if no supported parsing (unrecognized extensions)
	// else store instance of the extension
	this.list = {};
};

/**
 * @param {String|render.RenderInformation|annot.Annotation} extension
 */
Extension.prototype.add = function (extension) {
	if (extension instanceof renderExt.RenderInformation) {
		this.list['renderInformation'] = extension;
	}
	else if (extension instanceof annotExt.Annotation) {
		this.list['annotation'] = extension;
	}
	else if(typeof extension == "string") {
		var parsedAsObj;
		function fn (err, result) {
	        parsedAsObj = result;
	    };
	    utils.parseString(extension, fn);
	    var name = Object.keys(parsedAsObj)[0];
	    if(name == "renderInformation") {
	    	var renderInformation = renderExt.RenderInformation.fromXML(extension);
			this.list['renderInformation'] = renderInformation;
	    }
	    else if(name == "annotation") {
	    	var annotation = annotExt.Annotation.fromXML(extension);
			this.list['annotation'] = renderInformation;
	    }
	    else {
	    	this.list[name] = extension;
	    }
	}
};

/**
 * @param {string} extensionName
 * @return {boolean}
 */
Extension.prototype.has = function (extensionName) {
	return this.list.hasOwnProperty(extensionName);
};

/**
 * @param {string} extensionName
 * @return {String|render.RenderInformation|annot.Annotation}
 */
Extension.prototype.get = function (extensionName) {
	if (this.has(extensionName)) {
		return this.list[extensionName];
	}
	else {
		return null;
	}
};

/**
 * @return {Object} - xml2js formatted object
 */
Extension.prototype.buildJsObj = function () {
	var extensionObj = {};

	for (var extInstance in this.list) {
		if (extInstance == "renderInformation") {
			extensionObj.renderInformation =  this.get(extInstance).buildJsObj();
		} 
		else if (extInstance == "annotation") {
			extensionObj.annotation =  this.get(extInstance).buildJsObj();
		}
		else {
			// unsupported extensions are stored as is, as xml string
			// we need to parse it to build the js object
			var unsupportedExtObj;
			function fn (err, result) {
		        unsupportedExtObj = result;
		    };
		    utils.parseString(this.get(extInstance), fn);
			extensionObj[extInstance] = unsupportedExtObj[extInstance];
		}
	}
	return extensionObj;
};

/**
 * @return {string}
 */
Extension.prototype.toXML = function () {
	return utils.buildString({extension: this.buildJsObj()})
};

/**
 * @param {String} string
 * @return {Extension}
 */
Extension.fromXML = function (string) {
	var extension;
	function fn (err, result) {
        extension = Extension.fromObj(result);
    };
    utils.parseString(string, fn);
    return extension;
};

/**
 * @param {Object} jsObj - xml2js formatted object
 * @return {Extension}
 */
Extension.fromObj = function (jsObj) {
	if (typeof jsObj.extension == 'undefined') {
		throw new Error("Bad XML provided, expected tagName extension, got: " + Object.keys(jsObj)[0]);
	}

	var extension = new Extension();
	jsObj = jsObj.extension;
	if(typeof jsObj != 'object') { // nothing inside, empty xml
		return extension;
	}

	//var children = Object.keys(jsObj);
	for (var extName in jsObj) {
		//var extName = Object.keys(jsObj[i])[0];
		var extJsObj = jsObj[extName];

		//extension.add(extInstance);
		if (extName === 'renderInformation' || 
				extName.endsWith(':renderInformation')) {
			var renderInformation = renderExt.RenderInformation.fromObj({renderInformation: extJsObj[0]});
			extension.add(renderInformation);
		}
		else if (extName == 'annotation') {
			var annotation = annotExt.Annotation.fromObj({annotation: extJsObj[0]});
			extension.add(annotation);
		}
		else { // unsupported extension, we still store the data as is
			var unsupportedExt = {};
			unsupportedExt[extName] = extJsObj[0]; // make extension serialisable
			var stringExt = utils.buildString(unsupportedExt); // serialise to string
			extension.add(stringExt); // save it
		}
	}

	return extension;
};

ns.Extension = Extension;
// ------- END EXTENSION -------

// ------- NOTES -------
/**
 * Represents the <code>&lt;notes&gt;</code> element.
 * Its single content attribute stores xhtml elements as string.
 * @class
 */
var Notes = function () {
	this.content = "";
};

/**
 * Overwrite the content.
 * @param {String} string
 */
Notes.prototype.setContent = function (string) {
	this.content = string;
};

/**
 * @param {String} string
 */
Notes.prototype.appendContent = function (string) {
	this.content += string;
};

/**
 * @return {Object} - xml2js formatted object
 */
Notes.prototype.buildJsObj = function () {

	var parsedContent = "";
	if(this.content != "") { // xml2js refuses to parse empty strings
	    utils.parseString(this.content, function (err, result) {
	        parsedContent = result;
	    });
	}

	return parsedContent;
};

/**
 * @return {string}
 */
Notes.prototype.toXML = function () {
	return utils.buildString({notes: this.buildJsObj()})
};

/**
 * @param {String} string
 * @return {Notes}
 */
Notes.fromXML = function (string) {
	var notes;
	function fn (err, result) {
        notes = Notes.fromObj(result);
    };
    utils.parseString(string, fn);
    return notes;
};

/**
 * @param {Object} jsObj - xml2js formatted object
 * @return {Notes}
 */
Notes.fromObj = function (jsObj) {
	if (typeof jsObj.notes == 'undefined') {
		throw new Error("Bad XML provided, expected tagName notes, got: " + Object.keys(jsObj)[0]);
	}

	var notes = new Notes();
	jsObj = jsObj.notes;
	if(typeof jsObj != 'object') { // nothing inside, empty xml
		return notes;
	}

	var stringExt = utils.buildString({notes: jsObj}); // serialise to string
	// xml2js does weird things when you just want to serialize the content
	// need to include the <notes> root to get it properly, and then remove it in the result string.
	stringExt = stringExt.replace('<notes>', '');
	stringExt = stringExt.replace('</notes>', '');
	notes.content = stringExt; // save it

	return notes;
};

ns.Notes = Notes;
// ------- END NOTES -------

// ------- GLYPH -------
/**
 * Represents the <code>&lt;glyph&gt;</code> element.
 * @class Glyph
 * @extends SBGNBase
 * @param {Object} params
 * @param {string=} params.id
 * @param {string=} params.class_
 * @param {string=} params.compartmentRef
 * @param {string|number=} params.compartmentOrder
 * @param {string=} params.mapRef
 * @param {string=} params.tagRef
 * @param {string=} params.orientation
 * @param {Label=} params.label
 * @param {Bbox=} params.bbox
 * @param {State=} params.state
 * @param {Clone=} params.clone
 * @param {Callout=} params.callout
 * @param {Entity=} params.entity
 * @param {Glyph[]=} params.glyphMembers
 * @param {Port[]=} params.ports
 */
var Glyph = function (params) {
	ns.SBGNBase.call(this, params);
	var params = checkParams(params, ['id', 'class_', 'compartmentRef', 'compartmentOrder', 'mapRef',
		'tagRef', 'orientation', 'label', 'bbox', 'glyphMembers', 'ports', 'state', 'clone', 'entity', 'callout']);
	this.id 				= params.id;
	this.class_				= params.class_;
	this.compartmentRef		= params.compartmentRef;
	this.compartmentOrder	= parseFloat(params.compartmentOrder);
	this.mapRef				= params.mapRef;
	this.tagRef				= params.tagRef;
	this.orientation		= params.orientation;

	// children
	this.label 			= params.label;
	this.state 			= params.state;
	this.clone 			= params.clone;
	this.callout 		= params.callout;
	this.entity 		= params.entity;
	this.bbox 			= params.bbox;
	this.glyphMembers 	= params.glyphMembers || []; // case of complex, can have arbitrary list of nested glyphs
	this.ports 			= params.ports || [];
};

Glyph.prototype = Object.create(ns.SBGNBase.prototype);
Glyph.prototype.constructor = Glyph;

/**
 * @param {Label} label
 */
Glyph.prototype.setLabel = function (label) {
	this.label = label;
};

/**
 * @param {State} state
 */
Glyph.prototype.setState = function (state) {
	this.state = state;
};

/**
 * @param {Bbox} bbox
 */
Glyph.prototype.setBbox = function (bbox) {
	this.bbox = bbox;
};

/**
 * @param {Clone} clone
 */
Glyph.prototype.setClone = function (clone) {
	this.clone = clone;
};

/**
 * @param {Callout} callout
 */
Glyph.prototype.setCallout = function (callout) {
	this.callout = callout;
};

/**
 * @param {Entity} entity
 */
Glyph.prototype.setEntity = function (entity) {
	this.entity = entity;
};

/**
 * @param {Glyph} glyphMember
 */
Glyph.prototype.addGlyphMember = function (glyphMember) {
	this.glyphMembers.push(glyphMember);
};

/**
 * @param {Port} port
 */
Glyph.prototype.addPort = function (port) {
	this.ports.push(port);
};

/**
 * @return {Object} - xml2js formatted object
 */
Glyph.prototype.buildJsObj = function () {
	var glyphObj = {};

	// attributes
	var attributes = {};
	if(this.id != null) {
		attributes.id = this.id;
	}
	if(this.class_ != null) {
		attributes.class = this.class_;
	}
	if(this.compartmentRef != null) {
		attributes.compartmentRef = this.compartmentRef;
	}
	if(!isNaN(this.compartmentOrder)) {
		attributes.compartmentOrder = this.compartmentOrder;
	}
	if(this.mapRef != null) {
		attributes.mapRef = this.mapRef;
	}
	if(this.tagRef != null) {
		attributes.tagRef = this.tagRef;
	}
	if(this.orientation != null) {
		attributes.orientation = this.orientation;
	}
	utils.addAttributes(glyphObj, attributes);

	// children
	this.baseToJsObj(glyphObj);
	if(this.label != null) {
		glyphObj.label =  this.label.buildJsObj();
	}
	if(this.state != null) {
		glyphObj.state =  this.state.buildJsObj();
	}
	if(this.clone != null) {
		glyphObj.clone =  this.clone.buildJsObj();
	}
	if(this.callout != null) {
		glyphObj.callout =  this.callout.buildJsObj();
	}
	if(this.entity != null) {
		glyphObj.entity =  this.entity.buildJsObj();
	}
	if(this.bbox != null) {
		glyphObj.bbox =  this.bbox.buildJsObj();
	}
	for(var i=0; i < this.glyphMembers.length; i++) {
		if (i==0) {
			glyphObj.glyph = [];
		}
		glyphObj.glyph.push(this.glyphMembers[i].buildJsObj());
	}
	for(var i=0; i < this.ports.length; i++) {
		if (i==0) {
			glyphObj.port = [];
		}
		glyphObj.port.push(this.ports[i].buildJsObj());
	}
	return glyphObj;
};

/**
 * @return {string}
 */
Glyph.prototype.toXML = function () {
	return utils.buildString({glyph: this.buildJsObj()})
};

/**
 * @param {String} string
 * @return {Glyph}
 */
Glyph.fromXML = function (string) {
	var glyph;
	function fn (err, result) {
        glyph = Glyph.fromObj(result);
    };
    utils.parseString(string, fn);
    return glyph;
};

/**
 * @param {Object} jsObj - xml2js formatted object
 * @return {Glyph}
 */
Glyph.fromObj = function (jsObj) {
	if (typeof jsObj.glyph == 'undefined') {
		throw new Error("Bad XML provided, expected tagName glyph, got: " + Object.keys(jsObj)[0]);
	}

	var glyph = new ns.Glyph();
	jsObj = jsObj.glyph;
	if(typeof jsObj != 'object') { // nothing inside, empty xml
		return glyph;
	}

	if(jsObj.$) { // we have some attributes
		var attributes = jsObj.$;
		glyph.id = attributes.id || null;
		glyph.class_ = attributes.class || null;
		glyph.compartmentRef = attributes.compartmentRef || null;
		glyph.compartmentOrder = parseFloat(attributes.compartmentOrder);
		glyph.mapRef = attributes.mapRef || null;
		glyph.tagRef = attributes.tagRef || null;
		glyph.orientation = attributes.orientation || null;
	}

	// children
	if(jsObj.label) {
		var label = ns.Label.fromObj({label: jsObj.label[0]});
		glyph.setLabel(label);
	}
	if(jsObj.state) {
		var state = ns.State.fromObj({state: jsObj.state[0]});
		glyph.setState(state);
	}
	if(jsObj.clone) {
		var clone = ns.Clone.fromObj({clone: jsObj.clone[0]});
		glyph.setClone(clone);
	}
	if(jsObj.callout) {
		var callout = ns.Callout.fromObj({callout: jsObj.callout[0]});
		glyph.setCallout(callout);
	}
	if(jsObj.entity) {
		var entity = ns.Entity.fromObj({entity: jsObj.entity[0]});
		glyph.setEntity(entity);
	}
	if(jsObj.bbox) {
		var bbox = ns.Bbox.fromObj({bbox: jsObj.bbox[0]});
		glyph.setBbox(bbox);
	}

	if(jsObj.glyph) {
		var glyphs = jsObj.glyph;
		for (var i=0; i < glyphs.length; i++) {
			var glyphMember = ns.Glyph.fromObj({glyph: glyphs[i]});
			glyph.addGlyphMember(glyphMember);
		}
	}
	if(jsObj.port) {
		var ports = jsObj.port;
		for (var i=0; i < ports.length; i++) {
			var port = ns.Port.fromObj({port: ports[i]});
			glyph.addPort(port);
		}
	}

	glyph.baseFromObj(jsObj);
	return glyph;
};

ns.Glyph = Glyph;
// ------- END GLYPH -------

// ------- LABEL -------
/**
 * Represents the <code>&lt;label&gt;</code> element.
 * @class Label
 * @extends SBGNBase
 * @param {Object} params
 * @param {string=} params.text
 * @param {Bbox=} params.bbox
 */
var Label = function (params) {
	ns.SBGNBase.call(this, params);
	var params = checkParams(params, ['text', 'bbox']);
	this.text = params.text;
	this.bbox = params.bbox;
};

Label.prototype = Object.create(ns.SBGNBase.prototype);
Label.prototype.constructor = ns.Label;

/**
 * @param {Bbox} bbox
 */
Label.prototype.setBbox = function (bbox) {
	this.bbox = bbox;
};

/**
 * @return {Object} - xml2js formatted object
 */
Label.prototype.buildJsObj = function () {
	var labelObj = {};

	// attributes
	var attributes = {};
	if(this.text != null) {
		attributes.text = this.text;
	}
	else { // text is a required attribute
		attributes.text = "";
	}
	// ensure encoding of line breaks is always respected
	//attributes.text = attributes.text.replace('\n', '\n'); //'&#xA;');
	utils.addAttributes(labelObj, attributes);

	this.baseToJsObj(labelObj);
	if(this.bbox != null) {
		labelObj.bbox =  this.bbox.buildJsObj();
	}
	return labelObj;
};

/**
 * @return {string}
 */
Label.prototype.toXML = function () {
	return utils.buildString({label: this.buildJsObj()})
};

/**
 * @param {String} string
 * @return {Label}
 */
Label.fromXML = function (string) {
	var label;
	function fn (err, result) {
        label = Label.fromObj(result);
    };
    utils.parseString(string, fn);
    return label;
};

/**
 * @param {Object} jsObj - xml2js formatted object
 * @return {Label}
 */
Label.fromObj = function (jsObj) {
	if (typeof jsObj.label == 'undefined') {
		throw new Error("Bad XML provided, expected tagName label, got: " + Object.keys(jsObj)[0]);
	}

	var label = new ns.Label();
	jsObj = jsObj.label;
	if(typeof jsObj != 'object') { // nothing inside, empty xml
		return label;
	}

	if(jsObj.$) { // we have some attributes
		var attributes = jsObj.$;
		label.text = attributes.text || null;
	}

	if(jsObj.bbox) {
		var bbox = ns.Bbox.fromObj({bbox: jsObj.bbox[0]});
		label.setBbox(bbox);
	}
	label.baseFromObj(jsObj);
	return label;
};

ns.Label = Label;
// ------- END LABEL -------

// ------- BBOX -------
/**
 * Represents the <code>&lt;bbox&gt;</code> element.
 * @class Bbox
 * @extends SBGNBase
 * @param {Object} params
 * @param {string|number=} params.x
 * @param {string|number=} params.y
 * @param {string|number=} params.w
 * @param {string|number=} params.h
 */
var Bbox = function (params) {
	ns.SBGNBase.call(this, params);
	var params = checkParams(params, ['x', 'y', 'w', 'h']);
	this.x = parseFloat(params.x);
	this.y = parseFloat(params.y);
	this.w = parseFloat(params.w);
	this.h = parseFloat(params.h);
};

Bbox.prototype = Object.create(ns.SBGNBase.prototype);
Bbox.prototype.constructor = ns.Bbox;

/**
 * @return {Object} - xml2js formatted object
 */
Bbox.prototype.buildJsObj = function () {
	var bboxObj = {};

	// attributes
	var attributes = {};
	if(!isNaN(this.x)) {
		attributes.x = this.x;
	}
	if(!isNaN(this.y)) {
		attributes.y = this.y;
	}
	if(!isNaN(this.w)) {
		attributes.w = this.w;
	}
	if(!isNaN(this.h)) {
		attributes.h = this.h;
	}
	utils.addAttributes(bboxObj, attributes);
	this.baseToJsObj(bboxObj);
	return bboxObj;
};

/**
 * @return {string}
 */
Bbox.prototype.toXML = function () {
	return utils.buildString({bbox: this.buildJsObj()})
};

/**
 * @param {String} string
 * @return {Bbox}
 */
Bbox.fromXML = function (string) {
	var bbox;
	function fn (err, result) {
        bbox = Bbox.fromObj(result);
    };
    utils.parseString(string, fn);
    return bbox;
};

/**
 * @param {Object} jsObj - xml2js formatted object
 * @return {Bbox}
 */
Bbox.fromObj = function (jsObj) {
	if (typeof jsObj.bbox == 'undefined') {
		throw new Error("Bad XML provided, expected tagName bbox, got: " + Object.keys(jsObj)[0]);
	}

	var bbox = new ns.Bbox();
	jsObj = jsObj.bbox;
	if(typeof jsObj != 'object') { // nothing inside, empty xml
		return bbox;
	}

	if(jsObj.$) { // we have some attributes
		var attributes = jsObj.$;
		bbox.x = parseFloat(attributes.x);
		bbox.y = parseFloat(attributes.y);
		bbox.w = parseFloat(attributes.w);
		bbox.h = parseFloat(attributes.h);
	}
	bbox.baseFromObj(jsObj);
	return bbox;
};

ns.Bbox = Bbox;
// ------- END BBOX -------

// ------- STATE -------
/**
 * Represents the <code>&lt;state&gt;</code> element.
 * @class State
 * @param {Object} params
 * @param {string=} params.value
 * @param {string=} params.variable
 */
var State = function (params) {
	var params = checkParams(params, ['value', 'variable']);
	this.value = params.value;
	this.variable = params.variable;
};

/**
 * @return {Object} - xml2js formatted object
 */
State.prototype.buildJsObj = function () {
	var stateObj = {};

	// attributes
	var attributes = {};
	if(this.value != null) {
		attributes.value = this.value;
	}
	if(this.variable != null) {
		attributes.variable = this.variable;
	}
	utils.addAttributes(stateObj, attributes);
	return stateObj;
};

/**
 * @return {string}
 */
State.prototype.toXML = function () {
	return utils.buildString({state: this.buildJsObj()})
};

/**
 * @param {String} string
 * @return {State}
 */
State.fromXML = function (string) {
	var state;
	function fn (err, result) {
        state = State.fromObj(result);
    };
    utils.parseString(string, fn);
    return state;
};

/**
 * @param {Object} jsObj - xml2js formatted object
 * @return {State}
 */
State.fromObj = function (jsObj) {
	if (typeof jsObj.state == 'undefined') {
		throw new Error("Bad XML provided, expected tagName state, got: " + Object.keys(jsObj)[0]);
	}

	var state = new ns.State();
	jsObj = jsObj.state;
	if(typeof jsObj != 'object') { // nothing inside, empty xml
		return state;
	}

	if(jsObj.$) { // we have some attributes
		var attributes = jsObj.$;
		state.value = attributes.value || null;
		state.variable = attributes.variable || null;
	}
	return state;
};

ns.State = State;
/**
 * @class StateType
 * @deprecated Replaced by State
 */
ns.StateType = State;
// ------- END STATE -------

// ------- CLONE -------
/**
 * Represents the <code>&lt;clone&gt;</code> element.
 * @class Clone
 * @param {Object} params
 * @param {string=} params.label
 */
var Clone = function (params) {
	var params = checkParams(params, ['label']);
	this.label = params.label;
};

/**
 * @param {Label} label
 */
Clone.prototype.setLabel = function (label) {
	this.label = label;
};

/**
 * @return {Object} - xml2js formatted object
 */
Clone.prototype.buildJsObj = function () {
	var cloneObj = {};

	// children
	if(this.label != null) {
		cloneObj.label =  this.label.buildJsObj();
	}
	return cloneObj;
};

/**
 * @return {string}
 */
Clone.prototype.toXML = function () {
	return utils.buildString({clone: this.buildJsObj()})
};

/**
 * @param {String} string
 * @return {Clone}
 */
Clone.fromXML = function (string) {
	var clone;
	function fn (err, result) {
        clone = Clone.fromObj(result);
    };
    utils.parseString(string, fn);
    return clone;
};

/**
 * @param {Object} jsObj - xml2js formatted object
 * @return {Clone}
 */
Clone.fromObj = function (jsObj) {
	if (typeof jsObj.clone == 'undefined') {
		throw new Error("Bad XML provided, expected tagName clone, got: " + Object.keys(jsObj)[0]);
	}

	var clone = new ns.Clone();
	jsObj = jsObj.clone;
	if(typeof jsObj != 'object') { // nothing inside, empty xml
		return clone;
	}

	// children
	if(jsObj.label) {
		var label = ns.Label.fromObj({label: jsObj.label[0]});
		clone.setLabel(label);
	}
	return clone;
};

ns.Clone = Clone;
/**
 * @class CloneType
 * @deprecated Replaced by Clone
 */
ns.CloneType = Clone;
// ------- END CLONE -------

// ------- ENTITYTYPE -------
/**
 * Represents the <code>&lt;entity&gt;</code> element.
 * @class Entity
 * @param {Object} params
 * @param {string=} params.name
 */
var Entity = function (params) {
	var params = checkParams(params, ['name']);
	this.name = params.name;
};

/**
 * @return {Object} - xml2js formatted object
 */
Entity.prototype.buildJsObj = function () {
	var entityObj = {};

	// attributes
	var attributes = {};
	if(this.name != null) {
		attributes.name = this.name;
	}
	utils.addAttributes(entityObj, attributes);
	return entityObj;
};

/**
 * @return {string}
 */
Entity.prototype.toXML = function () {
	return utils.buildString({entity: this.buildJsObj()})
};

/**
 * @param {String} string
 * @return {Entity}
 */
Entity.fromXML = function (string) {
	var entity;
	function fn (err, result) {
        entity = Entity.fromObj(result);
    };
    utils.parseString(string, fn);
    return entity;
};

/**
 * @param {Object} jsObj - xml2js formatted object
 * @return {Entity}
 */
Entity.fromObj = function (jsObj) {
	if (typeof jsObj.entity == 'undefined') {
		throw new Error("Bad XML provided, expected tagName entity, got: " + Object.keys(jsObj)[0]);
	}

	var entity = new ns.Entity();
	jsObj = jsObj.entity;
	if(typeof jsObj != 'object') { // nothing inside, empty xml
		return entity;
	}

	if(jsObj.$) { // we have some attributes
		var attributes = jsObj.$;
		entity.name = attributes.name || null;
	}
	return entity;
};

ns.Entity = Entity;
/**
 * @class EntityType
 * @deprecated Replaced by Entity
 */
ns.EntityType = Entity;
// ------- END ENTITYTYPE -------

// ------- PORT -------
/**
 * Represents the <code>&lt;port&gt;</code> element.
 * @class Port
 * @param {Object} params
 * @param {string=} params.id
 * @param {string|number=} params.x
 * @param {string|number=} params.y
 */
var Port = function (params) {
	ns.SBGNBase.call(this, params);
	var params = checkParams(params, ['id', 'x', 'y']);
	this.id = params.id;
	this.x 	= parseFloat(params.x);
	this.y 	= parseFloat(params.y);
};

Port.prototype = Object.create(ns.SBGNBase.prototype);
Port.prototype.constructor = ns.Port;

/**
 * @return {Object} - xml2js formatted object
 */
Port.prototype.buildJsObj = function () {
	var portObj = {};

	// attributes
	var attributes = {};
	if(this.id != null) {
		attributes.id = this.id;
	}
	if(!isNaN(this.x)) {
		attributes.x = this.x;
	}
	if(!isNaN(this.y)) {
		attributes.y = this.y;
	}
	utils.addAttributes(portObj, attributes);
	this.baseToJsObj(portObj);
	return portObj;
};

/**
 * @return {string}
 */
Port.prototype.toXML = function () {
	return utils.buildString({port: this.buildJsObj()})
};

/**
 * @param {String} string
 * @return {Port}
 */
Port.fromXML = function (string) {
	var port;
	function fn (err, result) {
        port = Port.fromObj(result);
    };
    utils.parseString(string, fn);
    return port;
};

/**
 * @param {Object} jsObj - xml2js formatted object
 * @return {Port}
 */
Port.fromObj = function (jsObj) {
	if (typeof jsObj.port == 'undefined') {
		throw new Error("Bad XML provided, expected tagName port, got: " + Object.keys(jsObj)[0]);
	}

	var port = new ns.Port();
	jsObj = jsObj.port;
	if(typeof jsObj != 'object') { // nothing inside, empty xml
		return port;
	}

	if(jsObj.$) { // we have some attributes
		var attributes = jsObj.$;
		port.x = parseFloat(attributes.x);
		port.y = parseFloat(attributes.y);
		port.id = attributes.id || null;
	}
	port.baseFromObj(jsObj);
	return port;
};

ns.Port = Port;
// ------- END PORT -------

// ------- ARC -------
/**
 * Represents the <code>&lt;arc&gt;</code> element.
 * @class Arc
 * @param {Object} params
 * @param {string=} params.id
 * @param {string=} params.class_
 * @param {string=} params.source
 * @param {string=} params.target
 * @param {Start=} params.start
 * @param {End=} params.end
 * @param {Next=} params.nexts
 * @param {Glyph[]=} params.glyphs The arc's cardinality. Possibility to have more than one glyph is left open.
 */
var Arc = function (params) {
	ns.SBGNBase.call(this, params);
	var params = checkParams(params, ['id', 'class_', 'source', 'target', 'start', 'end', 'nexts', 'glyphs']);
	this.id 	= params.id;
	this.class_ = params.class_;
	this.source = params.source;
	this.target = params.target;

	this.start 	= params.start;
	this.end 	= params.end;
	this.nexts 	= params.nexts || [];
	this.glyphs = params.glyphs || [];
};

Arc.prototype = Object.create(ns.SBGNBase.prototype);
Arc.prototype.constructor = ns.Arc;

/**
 * @param {Start} start
 */
Arc.prototype.setStart = function (start) {
	this.start = start;
};

/**
 * @param {End} end
 */
Arc.prototype.setEnd = function (end) {
	this.end = end;
};

/**
 * @param {Next} next
 */
Arc.prototype.addNext = function (next) {
	this.nexts.push(next);
};

/**
 * @param {Glyph} glyph
 */
Arc.prototype.addGlyph = function (glyph) {
	this.glyphs.push(glyph);
};

/**
 * @return {Object} - xml2js formatted object
 */
Arc.prototype.buildJsObj = function () {
	var arcObj = {};

	// attributes
	var attributes = {};
	if(this.id != null) {
		attributes.id = this.id;
	}
	if(this.class_ != null) {
		attributes.class = this.class_;
	}
	if(this.source != null) {
		attributes.source = this.source;
	}
	if(this.target != null) {
		attributes.target = this.target;
	}
	utils.addAttributes(arcObj, attributes);

	// children
	this.baseToJsObj(arcObj);
	for(var i=0; i < this.glyphs.length; i++) {
		if (i==0) {
			arcObj.glyph = [];
		}
		arcObj.glyph.push(this.glyphs[i].buildJsObj());
	}
	if(this.start != null) {
		arcObj.start =  this.start.buildJsObj();
	}
	if(this.state != null) {
		arcObj.state =  this.state.buildJsObj();
	}
	for(var i=0; i < this.nexts.length; i++) {
		if (i==0) {
			arcObj.next = [];
		}
		arcObj.next.push(this.nexts[i].buildJsObj());
	}
	if(this.end != null) {
		arcObj.end =  this.end.buildJsObj();
	}
	return arcObj;
};

/**
 * @return {string}
 */
Arc.prototype.toXML = function () {
	return utils.buildString({arc: this.buildJsObj()})
};

/**
 * @param {String} string
 * @return {Arc}
 */
Arc.fromXML = function (string) {
	var arc;
	function fn (err, result) {
        arc = Arc.fromObj(result);
    };
    utils.parseString(string, fn);
    return arc;
};

/**
 * @param {Object} jsObj - xml2js formatted object
 * @return {Arc}
 */
Arc.fromObj = function (jsObj) {
	if (typeof jsObj.arc == 'undefined') {
		throw new Error("Bad XML provided, expected tagName arc, got: " + Object.keys(jsObj)[0]);
	}

	var arc = new ns.Arc();
	jsObj = jsObj.arc;
	if(typeof jsObj != 'object') { // nothing inside, empty xml
		return arc;
	}

	if(jsObj.$) { // we have some attributes
		var attributes = jsObj.$;
		arc.id = attributes.id || null;
		arc.class_ = attributes.class || null;
		arc.source = attributes.source || null;
		arc.target = attributes.target || null;
	}

	// children
	if(jsObj.start) {
		var start = ns.Start.fromObj({start: jsObj.start[0]});
		arc.setStart(start);
	}
	if(jsObj.next) {
		var nexts = jsObj.next;
		for (var i=0; i < nexts.length; i++) {
			var next = ns.Next.fromObj({next: nexts[i]});
			arc.addNext(next);
		}
	}
	if(jsObj.end) {
		var end = ns.End.fromObj({end: jsObj.end[0]});
		arc.setEnd(end);
	}
	if(jsObj.glyph) {
		var glyphs = jsObj.glyph;
		for (var i=0; i < glyphs.length; i++) {
			var glyph = ns.Glyph.fromObj({glyph: glyphs[i]});
			arc.addGlyph(glyph);
		}
	}

	arc.baseFromObj(jsObj);
	return arc;
};

ns.Arc = Arc;
// ------- END ARC -------

// ------- Start -------
/**
 * Represents the <code>&lt;start&gt;</code> element.
 * @class Start
 * @param {Object} params
 * @param {string|number=} params.x
 * @param {string|number=} params.y
 */
var Start = function (params) {
	var params = checkParams(params, ['x', 'y']);
	this.x = parseFloat(params.x);
	this.y = parseFloat(params.y);
};

/**
 * @return {Object} - xml2js formatted object
 */
Start.prototype.buildJsObj = function () {
	var startObj = {};

	// attributes
	var attributes = {};
	if(!isNaN(this.x)) {
		attributes.x = this.x;
	}
	if(!isNaN(this.y)) {
		attributes.y = this.y;
	}
	utils.addAttributes(startObj, attributes);
	return startObj;
};

/**
 * @return {string}
 */
Start.prototype.toXML = function () {
	return utils.buildString({start: this.buildJsObj()})
};

/**
 * @param {String} string
 * @return {Start}
 */
Start.fromXML = function (string) {
	var start;
	function fn (err, result) {
        start = Start.fromObj(result);
    };
    utils.parseString(string, fn);
    return start;
};

/**
 * @param {Object} jsObj - xml2js formatted object
 * @return {Start}
 */
Start.fromObj = function (jsObj) {
	if (typeof jsObj.start == 'undefined') {
		throw new Error("Bad XML provided, expected tagName start, got: " + Object.keys(jsObj)[0]);
	}

	var start = new ns.Start();
	jsObj = jsObj.start;
	if(typeof jsObj != 'object') { // nothing inside, empty xml
		return start;
	}

	if(jsObj.$) { // we have some attributes
		var attributes = jsObj.$;
		start.x = parseFloat(attributes.x);
		start.y = parseFloat(attributes.y);
	}
	return start;
};

ns.Start = Start;
/**
 * @class StartType
 * @deprecated Replaced by Start
 */
ns.StartType = Start;
// ------- END Start -------

// ------- End -------
/**
 * Represents the <code>&lt;end&gt;</code> element.
 * @class End
 * @param {Object} params
 * @param {string|number=} params.x
 * @param {string|number=} params.y
 */
var End = function (params) {
	var params = checkParams(params, ['x', 'y']);
	this.x = parseFloat(params.x);
	this.y = parseFloat(params.y);
};

/**
 * @return {Object} - xml2js formatted object
 */
End.prototype.buildJsObj = function () {
	var endObj = {};

	// attributes
	var attributes = {};
	if(!isNaN(this.x)) {
		attributes.x = this.x;
	}
	if(!isNaN(this.y)) {
		attributes.y = this.y;
	}
	utils.addAttributes(endObj, attributes);
	return endObj;
};

/**
 * @return {string}
 */
End.prototype.toXML = function () {
	return utils.buildString({end: this.buildJsObj()})
};

/**
 * @param {String} string
 * @return {End}
 */
End.fromXML = function (string) {
	var end;
	function fn (err, result) {
        end = End.fromObj(result);
    };
    utils.parseString(string, fn);
    return end;
};

/**
 * @param {Object} jsObj - xml2js formatted object
 * @return {End}
 */
End.fromObj = function (jsObj) {
	if (typeof jsObj.end == 'undefined') {
		throw new Error("Bad XML provided, expected tagName end, got: " + Object.keys(jsObj)[0]);
	}

	var end = new ns.End();
	jsObj = jsObj.end;
	if(typeof jsObj != 'object') { // nothing inside, empty xml
		return end;
	}

	if(jsObj.$) { // we have some attributes
		var attributes = jsObj.$;
		end.x = parseFloat(attributes.x);
		end.y = parseFloat(attributes.y);
	}
	return end;
};

ns.End = End;
/**
 * @class EndType
 * @deprecated Replaced by End
 */
ns.EndType = End;
// ------- END End -------

// ------- Next -------
/**
 * Represents the <code>&lt;next&gt;</code> element.
 * @class Next
 * @param {Object} params
 * @param {string|number=} params.x
 * @param {string|number=} params.y
 */
var Next = function (params) {
	var params = checkParams(params, ['x', 'y']);
	this.x = parseFloat(params.x);
	this.y = parseFloat(params.y);
};

/**
 * @return {Object} - xml2js formatted object
 */
Next.prototype.buildJsObj = function () {
	var nextObj = {};

	// attributes
	var attributes = {};
	if(!isNaN(this.x)) {
		attributes.x = this.x;
	}
	if(!isNaN(this.y)) {
		attributes.y = this.y;
	}
	utils.addAttributes(nextObj, attributes);
	return nextObj;
};

/**
 * @return {string}
 */
Next.prototype.toXML = function () {
	return utils.buildString({next: this.buildJsObj()})
};

/**
 * @param {String} string
 * @return {Next}
 */
Next.fromXML = function (string) {
	var next;
	function fn (err, result) {
        next = Next.fromObj(result);
    };
    utils.parseString(string, fn);
    return next;
};

/**
 * @param {Object} jsObj - xml2js formatted object
 * @return {Next}
 */
Next.fromObj = function (jsObj) {
	if (typeof jsObj.next == 'undefined') {
		throw new Error("Bad XML provided, expected tagName next, got: " + Object.keys(jsObj)[0]);
	}

	var next = new ns.Next();
	jsObj = jsObj.next;
	if(typeof jsObj != 'object') { // nothing inside, empty xml
		return next;
	}

	if(jsObj.$) { // we have some attributes
		var attributes = jsObj.$;
		next.x = parseFloat(attributes.x);
		next.y = parseFloat(attributes.y);
	}
	return next;
};

ns.Next = Next;
/**
 * @class NextType
 * @deprecated Replaced by Next
 */
ns.NextType = Next;
// ------- END Next -------

// ------- POINT -------
/**
 * Represents the <code>&lt;point&gt;</code> element.
 * @class Point
 * @param {Object} params
 * @param {string|number=} params.x
 * @param {string|number=} params.y
 */
var Point = function (params) {
	ns.SBGNBase.call(this, params);
	var params = checkParams(params, ['x', 'y']);
	this.x = parseFloat(params.x);
	this.y = parseFloat(params.y);
};
Point.prototype = Object.create(ns.SBGNBase.prototype);
Point.prototype.constructor = Point;

/**
 * @return {Object} - xml2js formatted object
 */
Point.prototype.buildJsObj = function () {
	var pointJsObj = {};

	// attributes
	var attributes = {};
	if(!isNaN(this.x)) {
		attributes.x = this.x;
	}
	if(!isNaN(this.y)) {
		attributes.y = this.y;
	}
	utils.addAttributes(pointJsObj, attributes);
	this.baseToJsObj(pointJsObj);
	return pointJsObj;
};

/**
 * @return {string}
 */
Point.prototype.toXML = function () {
	return utils.buildString({point: this.buildJsObj()})
};

/**
 * @param {String} string
 * @return {Point}
 */
Point.fromXML = function (string) {
	var point;
	function fn (err, result) {
        point = Point.fromObj(result);
    };
    utils.parseString(string, fn);
    return point;
};

/**
 * @param {Object} jsObj - xml2js formatted object
 * @return {Point}
 */
Point.fromObj = function (jsObj) {
	if (typeof jsObj.point == 'undefined') {
		throw new Error("Bad XML provided, expected tagName point, got: " + Object.keys(jsObj)[0]);
	}

	var point = new ns.Point();
	jsObj = jsObj.point;
	if(typeof jsObj != 'object') { // nothing inside, empty xml
		return point;
	}

	if(jsObj.$) { // we have some attributes
		var attributes = jsObj.$;
		point.x = parseFloat(attributes.x);
		point.y = parseFloat(attributes.y);
	}
	point.baseFromObj(jsObj);
	return point;
};

ns.Point = Point;
// ------- END POINT -------

// ------- CALLOUT -------
/**
 * Represents the <code>&lt;callout&gt;</code> element.
 * @class Callout
 * @param {Object} params
 * @param {string=} params.target
 * @param {Point=} params.point
 */
var Callout = function (params) {
	var params = checkParams(params, ['target', 'point']);
	this.target = params.target;
	this.point = params.point;
};

/**
 * @param {Point} point
 */
Callout.prototype.setPoint = function(point) {
	this.point = point;
};

/**
 * @return {Object} - xml2js formatted object
 */
Callout.prototype.buildJsObj = function () {
	var calloutObj = {};

	// attributes
	var attributes = {};
	if(this.target != null) {
		attributes.target = this.target;
	}
	utils.addAttributes(calloutObj, attributes);

	// children
	if(this.point != null) {
		calloutObj.point =  this.point.buildJsObj();
	}
	return calloutObj;
};

/**
 * @return {string}
 */
Callout.prototype.toXML = function () {
	return utils.buildString({callout: this.buildJsObj()})
};

/**
 * @param {String} string
 * @return {Callout}
 */
Callout.fromXML = function (string) {
	var callout;
	function fn (err, result) {
        callout = Callout.fromObj(result);
    };
    utils.parseString(string, fn);
    return callout;
};

/**
 * @param {Object} jsObj - xml2js formatted object
 * @return {Callout}
 */
Callout.fromObj = function (jsObj) {
	if (typeof jsObj.callout == 'undefined') {
		throw new Error("Bad XML provided, expected tagName callout, got: " + Object.keys(jsObj)[0]);
	}

	var callout = new ns.Callout();
	jsObj = jsObj.callout;
	if(typeof jsObj != 'object') { // nothing inside, empty xml
		return callout;
	}

	if(jsObj.$) { // we have some attributes
		var attributes = jsObj.$;
		callout.target = attributes.target || null;
	}

	// children
	if(jsObj.point) {
		var point = ns.Point.fromObj({point: jsObj.point[0]});
		callout.setPoint(point);
	}
	return callout;
};

ns.Callout = Callout;
// ------- END CALLOUT -------

// ------- ARCGROUP -------
/**
 * Represents the <code>&lt;arcgroup&gt;</code> element.
 * @class
 * @extends SBGNBase
 * @param {Object} params
 * @param {string=} params.class_
 * @param {Glyph[]=} params.glyphs
 * @param {Arc[]=} params.arcs
 */
var Arcgroup = function (params) {
	ns.SBGNBase.call(this, params);
	var params = checkParams(params, ['class_', 'glyphs', 'arcs']);
	this.class_ 		= params.class_;
	this.glyphs 	= params.glyphs || [];
	this.arcs 		= params.arcs || [];
};

Arcgroup.prototype = Object.create(ns.SBGNBase.prototype);
Arcgroup.prototype.constructor = Arcgroup;

/**
 * @param {Glyph} glyph
 */
Arcgroup.prototype.addGlyph = function (glyph) {
	this.glyphs.push(glyph);
};

/**
 * @param {Arc} arc
 */
Arcgroup.prototype.addArc = function (arc) {
	this.arcs.push(arc);
};

/**
 * @return {Object} - xml2js formatted object
 */
Arcgroup.prototype.buildJsObj = function () {
	var arcgroupObj = {};

	// attributes
	var attributes = {};
	if(this.class_ != null) {
		attributes.class = this.class_;
	}
	utils.addAttributes(arcgroupObj, attributes);

	// children
	this.baseToJsObj(arcgroupObj);
	for(var i=0; i < this.glyphs.length; i++) {
		if (i==0) {
			arcgroupObj.glyph = [];
		}
		arcgroupObj.glyph.push(this.glyphs[i].buildJsObj());
	}
	for(var i=0; i < this.arcs.length; i++) {
		if (i==0) {
			arcgroupObj.arc = [];
		}
		arcgroupObj.arc.push(this.arcs[i].buildJsObj());
	}
	return arcgroupObj;
};

/**
 * @return {string}
 */
Arcgroup.prototype.toXML = function () {
	return utils.buildString({arcgroup: this.buildJsObj()});
};

/**
 * @param {String} string
 * @return {Arcgroup}
 */
Arcgroup.fromXML = function (string) {
	var arcgroup;
	function fn (err, result) {
        arcgroup = Arcgroup.fromObj(result);
    };
    utils.parseString(string, fn);
    return arcgroup;
};

/**
 * @param {Object} jsObj - xml2js formatted object
 * @return {Arcgroup}
 */
Arcgroup.fromObj = function (jsObj) {
	if (typeof jsObj.arcgroup == 'undefined') {
		throw new Error("Bad XML provided, expected tagName arcgroup, got: " + Object.keys(jsObj)[0]);
	}

	var arcgroup = new ns.Arcgroup();
	jsObj = jsObj.arcgroup;
	if(typeof jsObj != 'object') { // nothing inside, empty xml
		return arcgroup;
	}

	if(jsObj.$) { // we have some attributes
		var attributes = jsObj.$;
		arcgroup.class_ = attributes.class || null;
	}

	if(jsObj.glyph) {
		var glyphs = jsObj.glyph;
		for (var i=0; i < glyphs.length; i++) {
			var glyph = ns.Glyph.fromObj({glyph: glyphs[i]});
			arcgroup.addGlyph(glyph);
		}
	}
	if(jsObj.arc) {
		var arcs = jsObj.arc;
		for (var i=0; i < arcs.length; i++) {
			var arc = ns.Arc.fromObj({arc: arcs[i]});
			arcgroup.addArc(arc);
		}
	}

	arcgroup.baseFromObj(jsObj);
	return arcgroup;
};

ns.Arcgroup = Arcgroup;
// ------- END ARCGROUP -------

ns.render = renderExt;
ns.annot = annotExt;
ns.schematronValidator = schematronValidator;
module.exports = ns;


