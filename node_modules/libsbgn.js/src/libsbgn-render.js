/**
 * This submodule contains the classes to manage the render extension's xml and some utility functions.
 * It adds the ability to save the styles and colors used in an SBGN map, as features like background-color,
 * border thickness or font properties are not part of the SBGN standard.
 *
 * It is loosely based on the {@link http://sbml.org/Documents/Specifications/SBML_Level_3/Packages/render|render extension of the SBML format}.
 * A subset of this specification has been adapted for SBGN-ML integration.
 *
 * See {@link Extension} for more general information on extensions in the SBGN-ML format.
 *
 * You can access the following classes like this: <code>libsbgn.render.ColorDefinition</code>
 *
 * @module libsbgn-render
 * @namespace libsbgn.render
*/

var utils = require('./utilities');
var checkParams = utils.checkParams;
var xml2js = require('xml2js');

var ns = {};

ns.xmlns = "http://www.sbml.org/sbml/level3/version1/render/version1";

// ------- COLORDEFINITION -------
/**
 * Represents the <code>&lt;colorDefinition&gt;</code> element.
 * @class
 * @param {Object} params
 * @param {string=} params.id
 * @param {string=} params.value
 */
var ColorDefinition = function(params) {
	var params = checkParams(params, ['id', 'value']);
	this.id 	= params.id;
	this.value 	= params.value;
};

/**
 * @return {Object} - xml2js formatted object
 */
ColorDefinition.prototype.buildJsObj = function () {
	var colordefObj = {};

	// attributes
	var attributes = {};
	if(this.id != null) {
		attributes.id = this.id;
	}
	if(this.value != null) {
		attributes.value = this.value;
	}
	utils.addAttributes(colordefObj, attributes);
	return colordefObj;
};

/**
 * @return {string}
 */
ColorDefinition.prototype.toXML = function () {
	return utils.buildString({colorDefinition: this.buildJsObj()})
};

/**
 * @param {String} string
 * @return {ColorDefinition}
 */
ColorDefinition.fromXML = function (string) {
	var colorDefinition;
	function fn (err, result) {
        colorDefinition = ColorDefinition.fromObj(result);
    };
    utils.parseString(string, fn);
    return colorDefinition;
};

/**
 * @param {Object} jsObj - xml2js formatted object
 * @return {ColorDefinition}
 */
ColorDefinition.fromObj = function (jsObj) {
	var colorDefinitionNode = utils.getChildByNameIgnoringNamespace(jsObj, "colorDefinition");

	if (colorDefinitionNode === null) {
		throw new Error("Bad XML provided, expected tagName colorDefinition, got: " + Object.keys(jsObj)[0]);
	}

	var colorDefinition = new ns.ColorDefinition();
	jsObj = colorDefinitionNode;
	if (typeof jsObj != 'object') { // nothing inside, empty xml
		return colorDefinition;
	}

	if (jsObj.$) { // we have some attributes
		var attributes = jsObj.$;
		colorDefinition.id = utils.getChildByNameIgnoringNamespace(attributes, "id");;
		colorDefinition.value = utils.getChildByNameIgnoringNamespace(attributes, "value");
	}
	return colorDefinition;
};

ns.ColorDefinition = ColorDefinition;
// ------- END COLORDEFINITION -------

// ------- LISTOFCOLORDEFINITIONS -------
/**
 * Represents the <code>&lt;listOfColorDefinitions&gt;</code> element.
 * @class
 */
var ListOfColorDefinitions = function () {
	this.colorDefinitions = [];
	this.colorIndex = {};
};

/**
 * @param {ColorDefinition} colorDefinition
 */
ListOfColorDefinitions.prototype.addColorDefinition = function (colorDefinition) {
	this.colorDefinitions.push(colorDefinition);
	this.colorIndex[colorDefinition.id] = colorDefinition.value;
};

/**
 * Convenient method to get a color value directly.
 * @param {string} id
 * @return {string}
 */
ListOfColorDefinitions.prototype.getColorById = function (id) {
	return this.colorIndex[id];
};

/**
 * Convenient method to get all the color values in the list.
 * @return {string[]}
 */
ListOfColorDefinitions.prototype.getAllColors = function () {
	return Object.values(this.colorIndex);
};

/**
 * @return {Object} - xml2js formatted object
 */
ListOfColorDefinitions.prototype.buildJsObj = function () {
	var listOfColorDefinitionsObj = {};

	for(var i=0; i < this.colorDefinitions.length; i++) {
		if (i==0) {
			listOfColorDefinitionsObj.colorDefinition = [];
		}
		listOfColorDefinitionsObj.colorDefinition.push(this.colorDefinitions[i].buildJsObj());
	}

	return listOfColorDefinitionsObj;
};

/**
 * @return {string}
 */
ListOfColorDefinitions.prototype.toXML = function () {
	return utils.buildString({listOfColorDefinitions: this.buildJsObj()})
};

/**
 * @param {String} string
 * @return {ListOfColorDefinitions}
 */
ListOfColorDefinitions.fromXML = function (string) {
	var listOfColorDefinitions;
	function fn (err, result) {
        listOfColorDefinitions = ListOfColorDefinitions.fromObj(result);
    };
    utils.parseString(string, fn);
    return listOfColorDefinitions;
};

/**
 * @param {Object} jsObj - xml2js formatted object
 * @return {ListOfColorDefinitions}
 */
ListOfColorDefinitions.fromObj = function (jsObj) {
	var listOfColorDefinitionsNode = utils.getChildByNameIgnoringNamespace(jsObj, "listOfColorDefinitions");
	if (listOfColorDefinitionsNode === null) {
		throw new Error("Bad XML provided, expected tagName listOfColorDefinitions, got: " + Object.keys(jsObj)[0]);
	}

	var listOfColorDefinitions = new ns.ListOfColorDefinitions();
	jsObj = listOfColorDefinitionsNode;
	if (typeof jsObj != 'object') { // nothing inside, empty xml
		return listOfColorDefinitions;
	}

	// children
	var colorDefinitionNode = utils.getChildByNameIgnoringNamespace(jsObj, "colorDefinition");
	if (colorDefinitionNode) {
		var colorDefinitions = colorDefinitionNode;
		for (var i=0; i < colorDefinitions.length; i++) {
			var colorDefinition = ns.ColorDefinition.fromObj({colorDefinition: colorDefinitions[i]});
			listOfColorDefinitions.addColorDefinition(colorDefinition);
		}
	}

	return listOfColorDefinitions;
};

ns.ListOfColorDefinitions = ListOfColorDefinitions;
// ------- END LISTOFCOLORDEFINITIONS -------

// ------- RENDERGROUP -------
/**
 * Represents the <code>&lt;g&gt;</code> element.
 * @class
 * @param {Object} params
 * @param {string=} params.id
 * @param {string=} params.fontSize
 * @param {string=} params.fontFamily
 * @param {string=} params.fontWeight
 * @param {string=} params.fontStyle
 * @param {string=} params.fontColor
 * @param {string=} params.textAnchor
 * @param {string=} params.vtextAnchor
 * @param {string=} params.fill The element's background color
 * @param {string=} params.stroke Border color for glyphs, line color for arcs.
 * @param {string=} params.strokeWidth
 * @param {string=} params.backgroundImage
 * @param {string=} params.backgroundFit
 * @param {string=} params.backgroundPosX
 * @param {string=} params.backgroundPosY
 * @param {string=} params.backgroundWidth
 * @param {string=} params.backgroundHeight
 * @param {string=} params.backgroundImageOpacity
 * @param {string=} params.backgroundOpacity
 */
var RenderGroup = function (params) {
	// each of those are optional, so test if it is defined is mandatory
	var params = checkParams(params, ['fontSize', 'fontFamily', 'fontWeight',
		'fontStyle', 'fontColor', 'textAnchor', 'vtextAnchor', 'fill', 'id', 'stroke', 'strokeWidth', 'backgroundImage',
		'backgroundFit', 'backgroundPosX', 'backgroundPosY', 'backgroundWidth', 'backgroundHeight', 'backgroundImageOpacity','backgroundOpacity' ]);
	// specific to renderGroup
	this.fontSize 		= params.fontSize;
	this.fontFamily 	= params.fontFamily;
	this.fontWeight 	= params.fontWeight;
	this.fontStyle 		= params.fontStyle;
	this.fontColor		= params.fontColor;
	this.textAnchor 	= params.textAnchor; // probably useless
	this.vtextAnchor 	= params.vtextAnchor; // probably useless
	// from GraphicalPrimitive2D
	this.fill 			= params.fill; // fill color
	// from GraphicalPrimitive1D
	this.id 			= params.id;
	this.stroke 		= params.stroke; // stroke color
	this.strokeWidth 	= params.strokeWidth;
	this.backgroundImage = params.backgroundImage;
	this.backgroundFit = params.backgroundFit;
	this.backgroundPosX = params.backgroundPosX;
	this.backgroundPosY = params.backgroundPosY;
	this.backgroundWidth = params.backgroundWidth;
	this.backgroundHeight = params.backgroundHeight;
	this.backgroundImageOpacity = params.backgroundImageOpacity;
	this.backgroundOpacity = params.backgroundOpacity;
};

/**
 * @return {Object} - xml2js formatted object
 */
RenderGroup.prototype.buildJsObj = function () {
	var renderGroupObj = {};

	// attributes
	var attributes = {};
	if(this.id != null) {
		attributes.id = this.id;
	}
	if(this.fontSize != null) {
		attributes.fontSize = this.fontSize;
	}
	if(this.fontFamily != null) {
		attributes.fontFamily = this.fontFamily;
	}
	if(this.fontWeight != null) {
		attributes.fontWeight = this.fontWeight;
	}
	if(this.fontStyle != null) {
		attributes.fontStyle = this.fontStyle;
	}
	if (this.fontColor != null) {
		attributes.fontColor = this.fontColor;
	}
	if(this.textAnchor != null) {
		attributes.textAnchor = this.textAnchor;
	}
	if(this.vtextAnchor != null) {
		attributes.vtextAnchor = this.vtextAnchor;
	}
	if(this.stroke != null) {
		attributes.stroke = this.stroke;
	}
	if(this.strokeWidth != null) {
		attributes.strokeWidth = this.strokeWidth;
	}
	if(this.fill != null) {
		attributes.fill = this.fill;
	}
	if(this.backgroundImage != null) {
		attributes.backgroundImage = this.backgroundImage;
	}
	if(this.backgroundFit != null) {
		attributes.backgroundFit = this.backgroundFit;
	}
	if(this.backgroundPosX != null) {
		attributes.backgroundPosX = this.backgroundPosX;
	}
	if(this.backgroundPosY != null) {
		attributes.backgroundPosY = this.backgroundPosY;
	}
	if(this.backgroundWidth != null) {
		attributes.backgroundWidth = this.backgroundWidth;
	}
	if(this.backgroundHeight != null) {
		attributes.backgroundHeight = this.backgroundHeight;
	}
	if(this.backgroundImageOpacity != null) {
		attributes.backgroundImageOpacity = this.backgroundImageOpacity;
	}
	if(this.backgroundOpacity != null) {
		attributes.backgroundOpacity = this.backgroundOpacity;
	}
	utils.addAttributes(renderGroupObj, attributes);
	return renderGroupObj;
};

/**
 * @return {string}
 */
RenderGroup.prototype.toXML = function () {
	return utils.buildString({g: this.buildJsObj()})
};

/**
 * @param {String} string
 * @return {RenderGroup}
 */
RenderGroup.fromXML = function (string) {
	var g;
	function fn (err, result) {
        g = RenderGroup.fromObj(result);
    };
    utils.parseString(string, fn);
    return g;
};

/**
 * @param {Object} jsObj - xml2js formatted object
 * @return {RenderGroup}
 */
RenderGroup.fromObj = function (jsObj) {
	var gNode = utils.getChildByNameIgnoringNamespace(jsObj, "g");
	if (gNode === null) {
		throw new Error("Bad XML provided, expected tagName g, got: " + Object.keys(jsObj)[0]);
	}

	var g = new ns.RenderGroup();
	jsObj = gNode;
	if (typeof jsObj != 'object') { // nothing inside, empty xml
		return g;
	}

	if(jsObj.$) { // we have some attributes
		
		var attributes = jsObj.$;
		g.id = utils.getChildByNameIgnoringNamespace(attributes, "id");
		g.fontSize = utils.getChildByNameIgnoringNamespace(attributes, "fontSize");
		g.fontFamily = utils.getChildByNameIgnoringNamespace(attributes, "fontFamily");
		g.fontWeight = utils.getChildByNameIgnoringNamespace(attributes, "fontWeight");
		g.fontStyle = utils.getChildByNameIgnoringNamespace(attributes, "fontStyle");
		g.fontColor = utils.getChildByNameIgnoringNamespace(attributes, "fontColor");
		g.textAnchor = utils.getChildByNameIgnoringNamespace(attributes, "textAnchor");
		g.vtextAnchor = utils.getChildByNameIgnoringNamespace(attributes, "vtextAnchor");
		g.stroke = utils.getChildByNameIgnoringNamespace(attributes, "stroke");
		g.strokeWidth = utils.getChildByNameIgnoringNamespace(attributes, "strokeWidth");
		g.fill = utils.getChildByNameIgnoringNamespace(attributes, "fill");
		g.backgroundImage = utils.getChildByNameIgnoringNamespace(attributes, "backgroundImage");
		g.backgroundFit = utils.getChildByNameIgnoringNamespace(attributes, "backgroundFit");
		g.backgroundPosX = utils.getChildByNameIgnoringNamespace(attributes, "backgroundPosX");
		g.backgroundPosY = utils.getChildByNameIgnoringNamespace(attributes, "backgroundPosY");
		g.backgroundWidth = utils.getChildByNameIgnoringNamespace(attributes, "backgroundWidth");
		g.backgroundHeight = utils.getChildByNameIgnoringNamespace(attributes, "backgroundHeight");
		g.backgroundImageOpacity = utils.getChildByNameIgnoringNamespace(attributes, "backgroundImageOpacity");
		g.backgroundOpacity = utils.getChildByNameIgnoringNamespace(attributes, "backgroundOpacity");
	}
	return g;
};

ns.RenderGroup = RenderGroup;
// ------- END RENDERGROUP -------

// ------- STYLE -------
/**
 * Represents the <code>&lt;style&gt;</code> element.
 * @class
 * @param {Object} params
 * @param {string=} params.id
 * @param {string=} params.name
 * @param {string=} params.idList
 * @param {RenderGroup=} params.renderGroup
 */
var Style = function(params) {
	var params = checkParams(params, ['id', 'name', 'idList', 'renderGroup']);
	this.id 			= params.id;
	this.name 			= params.name;
	this.idList 		= params.idList; // TODO add utility functions to manage this (should be array)
	this.renderGroup 	= params.renderGroup;
};

/**
 * @param {RenderGroup} renderGroup
 */
Style.prototype.setRenderGroup = function (renderGroup) {
	this.renderGroup = renderGroup;
};

/**
 * @return {string[]}
 */
Style.prototype.getIdListAsArray = function () {
	return this.idList.split(' ');
}

/**
 * @param {string[]} idArray
 */
Style.prototype.setIdListFromArray = function (idArray) {
	this.idList = idArray.join(' ');
}

/**
 * Convenience function returning a map of ids to their respective RenderGroup object.
 * The style properties can then be directly accessed. Example: map[id].stroke
 * @return {Object.<string, RenderGroup>}
 */
Style.prototype.getStyleMap = function () {
	var index = {};
	var ids = this.getIdListAsArray();
	for(var i=0; i < ids.length; i++) {
		var id = ids[i];
		index[id] = this.renderGroup;
	}
	return index;
};
/**
 * @return {Object} - xml2js formatted object
 */
Style.prototype.buildJsObj = function () {
	var styleObj = {};

	// attributes
	var attributes = {};
	if(this.id != null) {
		attributes.id = this.id;
	}
	if(this.name != null) {
		attributes.name = this.name;
	}
	if(this.idList != null) {
		attributes.idList = this.idList;
	}
	utils.addAttributes(styleObj, attributes);

	// children
	if(this.renderGroup != null) {
		styleObj.g =  this.renderGroup.buildJsObj();
	}
	return styleObj;
};

/**
 * @return {string}
 */
Style.prototype.toXML = function () {
	return utils.buildString({style: this.buildJsObj()})
};

/**
 * @param {String} string
 * @return {Style}
 */
Style.fromXML = function (string) {
	var style;
	function fn (err, result) {
        style = Style.fromObj(result);
    };
    utils.parseString(string, fn);
    return style;
};

/**
 * @param {Object} jsObj - xml2js formatted object
 * @return {Style}
 */
Style.fromObj = function (jsObj) {
	var styleNode = utils.getChildByNameIgnoringNamespace(jsObj, "style");
	if (styleNode === null) {
		throw new Error("Bad XML provided, expected tagName style, got: " + Object.keys(jsObj)[0]);
	}

	var style = new ns.Style();
	jsObj = styleNode;
	if (typeof jsObj != 'object') { // nothing inside, empty xml
		return style;
	}

	if (jsObj.$) { // we have some attributes
		var attributes = jsObj.$;
		style.id = utils.getChildByNameIgnoringNamespace(attributes, "id");
		style.name = utils.getChildByNameIgnoringNamespace(attributes, "name");
		style.idList = utils.getChildByNameIgnoringNamespace(attributes, "idList");
	}

	// children
	var gNode = utils.getChildByNameIgnoringNamespace(jsObj, "g");
	if(gNode) {
		var g = ns.RenderGroup.fromObj({g: gNode[0]});
		style.setRenderGroup(g);
	}

	return style;
};

ns.Style = Style;
// ------- END STYLE -------

// ------- LISTOFSTYLES -------
/**
 * Represents the <code>&lt;listOfStyles&gt;</code> element.
 * @class
 */
var ListOfStyles = function() {
	this.styles = [];
};

/**
 * @param {Style} style
 */
ListOfStyles.prototype.addStyle = function (style) {
	this.styles.push(style);
};

/**
 * Convenience function returning a map of ids to their respective RenderGroup object,
 * for all the styles.
 * The style properties can then be directly accessed. Example: map[id].stroke
 * @return {Object.<string, RenderGroup>}
 */
ListOfStyles.prototype.getStyleMap = function () {
	var index = {};
	for(var i=0; i < this.styles.length; i++) {
		var style = this.styles[i];
		var subIndex = style.getStyleMap();
		for(var id in subIndex) {
			index[id] = subIndex[id];
		}
	}
	return index;
}

/**
 * @return {Object} - xml2js formatted object
 */
ListOfStyles.prototype.buildJsObj = function () {
	var listOfStylesObj = {};

	for(var i=0; i < this.styles.length; i++) {
		if (i==0) {
			listOfStylesObj.style = [];
		}
		listOfStylesObj.style.push(this.styles[i].buildJsObj());
	}

	return listOfStylesObj;
};

/**
 * @return {string}
 */
ListOfStyles.prototype.toXML = function () {
	return utils.buildString({listOfStyles: this.buildJsObj()})
};

/**
 * @param {String} string
 * @return {ListOfStyles}
 */
ListOfStyles.fromXML = function (string) {
	var listOfStyles;
	function fn (err, result) {
        listOfStyles = ListOfStyles.fromObj(result);
    };
    utils.parseString(string, fn);
    return listOfStyles;
};

/**
 * @param {Object} jsObj - xml2js formatted object
 * @return {ListOfStyles}
 */
ListOfStyles.fromObj = function (jsObj) {
	var listOfStylesNode = utils.getChildByNameIgnoringNamespace(jsObj, "listOfStyles");
	if (listOfStylesNode === null) {
		throw new Error("Bad XML provided, expected tagName listOfStyles, got: " + Object.keys(jsObj)[0]);
	}

	var listOfStyles = new ns.ListOfStyles();
	jsObj = listOfStylesNode;
	if (typeof jsObj != 'object') { // nothing inside, empty xml
		return listOfStyles;
	}

	// children
	var styles = utils.getChildByNameIgnoringNamespace(jsObj, "style");
	if (styles) {
		for (var i = 0; i < styles.length; i++) {
			var style = ns.Style.fromObj({style: styles[i]});
			listOfStyles.addStyle(style);
		}
	}

	return listOfStyles;
};

ns.ListOfStyles = ListOfStyles;
// ------- END LISTOFSTYLES -------
// ------- BACKGROUNDIMAGE -------
/**
 * Represents the <code>&lt;backgroundImage&gt;</code> element.
 * @class
 * @param {Object} params
 * @param {string=} params.id
 * @param {string=} params.value
 */
var BackgroundImage = function(params) {
	var params = checkParams(params, ['id', 'value']);
	this.id 	= params.id;
	this.value 	= params.value;
};

/**
 * @return {Object} - xml2js formatted object
 */
BackgroundImage.prototype.buildJsObj = function () {
	var bgImgObj = {};

	// attributes
	var attributes = {};
	if(this.id != null) {
		attributes.id = this.id;
	}
	if(this.value != null) {
		attributes.value = this.value;
	}
	utils.addAttributes(bgImgObj, attributes);
	return bgImgObj;
};

/**
 * @return {string}
 */
BackgroundImage.prototype.toXML = function () {
	return utils.buildString({backgroundImage: this.buildJsObj()})
};

/**
 * @param {String} string
 * @return {BackgroundImage}
 */
BackgroundImage.fromXML = function (string) {
	var backgroundImage;
	function fn (err, result) {
        backgroundImage = BackgroundImage.fromObj(result);
    };
    utils.parseString(string, fn);
    return backgroundImage;
};

/**
 * @param {Object} jsObj - xml2js formatted object
 * @return {BackgroundImage}
 */
BackgroundImage.fromObj = function (jsObj) {
	if (typeof jsObj.backgroundImage == 'undefined') {
		throw new Error("Bad XML provided, expected tagName backgroundImage, got: " + Object.keys(jsObj)[0]);
	}

	var backgroundImage = new ns.BackgroundImage();
	jsObj = jsObj.backgroundImage;
	if(typeof jsObj != 'object') { // nothing inside, empty xml
		return backgroundImage;
	}

	if(jsObj.$) { // we have some attributes
		var attributes = jsObj.$;
		backgroundImage.id = attributes.id || null;
		backgroundImage.value = attributes.value || null;
	}
	return backgroundImage;
};

ns.BackgroundImage = BackgroundImage;
// ------- END BACKGROUNDIMAGE -------

// ------- LISTOFBACKGROUNDIMAGES -------
/**
 * Represents the <code>&lt;listOfBackgroundImages&gt;</code> element.
 * @class
 */
var ListOfBackgroundImages = function () {
	this.backgroundImages = [];
	this.imageIndex = {};
};

/**
 * @param {BackgroundImage} backgroundImage
 */
ListOfBackgroundImages.prototype.addBackgroundImage = function (backgroundImage) {
	this.backgroundImages.push(backgroundImage);
	this.imageIndex[backgroundImage.id] = backgroundImage.value;
};

/**
 * Convenient method to get a background image value directly.
 * @param {string} id
 * @return {string}
 */
ListOfBackgroundImages.prototype.getBackgroundImageById = function (id) {
	return this.imageIndex[id];
};

/**
 * Convenient method to get all the background image values in the list.
 * @return {string[]}
 */
ListOfBackgroundImages.prototype.getAllImages = function () {
	return Object.values(this.imageIndex);
};

/**
 * @return {Object} - xml2js formatted object
 */
ListOfBackgroundImages.prototype.buildJsObj = function () {
	var listOfBgImagesObj = {};

	for(var i=0; i < this.backgroundImages.length; i++) {
		if (i==0) {
			listOfBgImagesObj.backgroundImage = [];
		}
		listOfBgImagesObj.backgroundImage.push(this.backgroundImages[i].buildJsObj());
	}

	return listOfBgImagesObj;
};

/**
 * @return {string}
 */
ListOfBackgroundImages.prototype.toXML = function () {
	return utils.buildString({listOfBackgroundImages: this.buildJsObj()})
};

/**
 * @param {String} string
 * @return {ListOfBackgroundImages}
 */
ListOfBackgroundImages.fromXML = function (string) {
	var listOfBackgroundImages;
	function fn (err, result) {
        listOfBackgroundImages = ListOfBackgroundImages.fromObj(result);
    };
    utils.parseString(string, fn);
    return listOfBackgroundImages;
};

/**
 * @param {Object} jsObj - xml2js formatted object
 * @return {ListOfBackgroundImages}
 */
ListOfBackgroundImages.fromObj = function (jsObj) {
	var listOfBackgroundImagesNode = utils.getChildByNameIgnoringNamespace(jsObj, "listOfBackgroundImages");
	if (listOfBackgroundImagesNode === null) {
		throw new Error("Bad XML provided, expected tagName listOfBackgroundImages, got: " + Object.keys(jsObj)[0]);
	}

	var listOfBackgroundImages = new ns.ListOfBackgroundImages();
	jsObj = listOfBackgroundImagesNode;
	if(typeof jsObj != 'object') { // nothing inside, empty xml
		return listOfBackgroundImages;
	}

	// children
	if(jsObj.backgroundImage) {
		var backgroundImages = jsObj.backgroundImage;
		for (var i=0; i < backgroundImages.length; i++) {
			var backgroundImage = ns.BackgroundImage.fromObj({backgroundImage: backgroundImages[i]});
			listOfBackgroundImages.addBackgroundImage(backgroundImage);
		}
	}

	return listOfBackgroundImages;
};

ns.ListOfBackgroundImages = ListOfBackgroundImages;
// ------- END LISTOFBACKGROUNDIMAGES -------
// ------- RENDERINFORMATION -------
/**
 * Represents the <code>&lt;renderInformation&gt;</code> element.
 * @class
 * @param {Object} params
 * @param {string=} params.id
 * @param {string=} params.name
 * @param {string=} params.programName
 * @param {string=} params.programVersion
 * @param {string=} params.backgroundColor
 * @param {ListOfColorDefinitions=} params.listOfColorDefinitions
 * @param {ListOfStyles=} params.listOfStyles
 * @param {ListOfBackgroundImages=} params.listOfBackgroundImages
 */
var RenderInformation = function (params) {
	var params = checkParams(params, ['id', 'name', 'programName',
		'programVersion', 'backgroundColor', 'listOfColorDefinitions', 'listOfStyles', 'listOfBackgroundImages']);
	this.id 					= params.id; // required, rest is optional
	this.name 					= params.name;
	this.programName 			= params.programName;
	this.programVersion 		= params.programVersion;
	this.backgroundColor 		= params.backgroundColor;
	this.listOfColorDefinitions = params.listOfColorDefinitions;
	this.listOfStyles 			= params.listOfStyles;
	this.listOfBackgroundImages = params.listOfBackgroundImages;
};

/**
 * @param {ListOfColorDefinitions} listOfColorDefinitions
 */
RenderInformation.prototype.setListOfColorDefinitions = function(listOfColorDefinitions) {
	this.listOfColorDefinitions = listOfColorDefinitions;
};

/**
 * @param {ListOfStyles} listOfStyles
 */
RenderInformation.prototype.setListOfStyles = function(listOfStyles) {
	this.listOfStyles = listOfStyles;
};

/**
 * @param {ListOfBackgroundImages} listOfBackgroundImages
 */
RenderInformation.prototype.setListOfBackgroundImages = function(listOfBackgroundImages) {
	this.listOfBackgroundImages = listOfBackgroundImages;
};

/**
 * @return {Object} - xml2js formatted object
 */
RenderInformation.prototype.buildJsObj = function () {
	var renderInformationObj = {};

	// attributes
	var attributes = {};
	attributes.xmlns = ns.xmlns;
	if(this.id != null) {
		attributes.id = this.id;
	}
	if(this.name != null) {
		attributes.name = this.name;
	}
	if(this.programName != null) {
		attributes.programName = this.programName;
	}
	if(this.programVersion != null) {
		attributes.programVersion = this.programVersion;
	}
	if(this.backgroundColor != null) {
		attributes.backgroundColor = this.backgroundColor;
	}
	utils.addAttributes(renderInformationObj, attributes);

	// children
	if(this.listOfColorDefinitions != null) {
		renderInformationObj.listOfColorDefinitions =  this.listOfColorDefinitions.buildJsObj();
	}
	if(this.listOfBackgroundImages != null) {
		renderInformationObj.listOfBackgroundImages =  this.listOfBackgroundImages.buildJsObj();
	}
	if(this.listOfStyles != null) {
		renderInformationObj.listOfStyles =  this.listOfStyles.buildJsObj();
	}
	return renderInformationObj;
};

/**
 * @return {string}
 */
RenderInformation.prototype.toXML = function() {
	return utils.buildString({renderInformation: this.buildJsObj()})
};

/**
 * @param {String} string
 * @return {RenderInformation}
 */
RenderInformation.fromXML = function (string) {
	var renderInformation;
	function fn (err, result) {
        renderInformation = RenderInformation.fromObj(result);
    };
    utils.parseString(string, fn);
    return renderInformation;
};

/**
 * @param {Object} jsObj - xml2js formatted object
 * @return {RenderInformation}
 */
RenderInformation.fromObj = function (jsObj) {
	var renderInformationNode = utils.getChildByNameIgnoringNamespace(jsObj, "renderInformation");
	if (renderInformationNode === null) {
		throw new Error("Bad XML provided, expected tagName renderInformation, got: " + Object.keys(jsObj)[0]);
	}

	var renderInformation = new ns.RenderInformation();
	jsObj = renderInformationNode;
	if(typeof jsObj != 'object') { // nothing inside, empty xml
		return renderInformation;
	}

	if(jsObj.$) { // we have some attributes
		var attributes = jsObj.$;
		renderInformation.id = utils.getChildByNameIgnoringNamespace(attributes,"id");
		renderInformation.name = utils.getChildByNameIgnoringNamespace(attributes,"name");
		renderInformation.programName = utils.getChildByNameIgnoringNamespace(attributes,"programName");
		renderInformation.programVersion = utils.getChildByNameIgnoringNamespace(attributes,"programVersion");
		renderInformation.backgroundColor = utils.getChildByNameIgnoringNamespace(attributes,"backgroundColor");
	}

	// children
	var listOfColorDefinitionsNode = utils.getChildByNameIgnoringNamespace(jsObj, "listOfColorDefinitions");
	if(listOfColorDefinitionsNode) {
		var listOfColorDefinitions = ns.ListOfColorDefinitions.fromObj({listOfColorDefinitions: listOfColorDefinitionsNode});
		renderInformation.setListOfColorDefinitions(listOfColorDefinitions);
	}

	var listOfStylesNode = utils.getChildByNameIgnoringNamespace(jsObj, "listOfStyles");
	if(listOfStylesNode) {
		var listOfStyles = ns.ListOfStyles.fromObj({listOfStyles: listOfStylesNode});
		renderInformation.setListOfStyles(listOfStyles);
	}

	var listOfBackgroundImagesNode = utils.getChildByNameIgnoringNamespace(jsObj, "listOfBackgroundImages");
	if(listOfBackgroundImagesNode) {
		var listOfBackgroundImages = ns.ListOfBackgroundImages.fromObj({listOfBackgroundImages: listOfBackgroundImagesNode[0]});
		renderInformation.setListOfBackgroundImages(listOfBackgroundImages);
	}
	return renderInformation;
};

ns.RenderInformation = RenderInformation;
// ------- END RENDERINFORMATION -------

module.exports = ns;
