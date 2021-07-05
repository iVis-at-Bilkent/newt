
var libs = require('../utilities/lib-utilities').getLibs();
var jQuery = $ = libs.jQuery;
var cytoscape = libs.cytoscape;
// var optionUtilities = require('./option-utilities');
// var options = optionUtilities.getOptions();
var truncate = require('./text-utilities').truncate;
// only functions not depending on the instances can be used in this way
// e.g. elementUtilities.generateStateVarId()
var elementUtilities = require('./element-utilities-factory')();

var ns = {};

// Keep in mind that for each method 'mainObj' parameter refers to the main object for which the operation will be done.
// It refers to the object that could be refered by 'this' while there was prototyping in these classes.
// For example AuxiliaryUnit.copy(mainObj, existingInstance, newParent, newId) copies the variable passed by 'mainObj'
// parameter and in this case 'mainObj' can be considered as `the object to be copied`

// The old constructors are replaced by 'construct()' methods while removing prototyping from the classes.

// 'AuxiliaryUnit' and 'AuxUnitLayout' objects keep the id of their parent nodes instead of the nodes themselves to avoid circular references.
// To maintain this property related methods to get and set parent nodes should be used instead of directly accessing the parent object.

// Also, there is a parent-child relationship between the AuxiliaryUnit class and StateVariable and UnitOfInformation
// classes. While calling a method of AuxiliaryUnit class that method should be called from
// the actual class of related auxilary unit (Would be StateVariable or UnitOfInformation. This is needed to prevent conflictions when the
// methods of AuxiliaryUnit class is overriden by these classes). That class can be obtained by calling 'getAuxUnitClass(mainObj)'
// method for the auxilary unit object.

var getAuxUnitClass = function(unit) {
  // Unit parameter may pass the unit itself or the type of the unit check it
  var unitType = typeof unit === 'string' ? unit : unit.clazz;
  // Retrieve and return unit class according to the unit type
  var className = unitType === 'state variable' ? 'StateVariable' : 'UnitOfInformation';
  return ns[className];
};

ns.getAuxUnitClass = getAuxUnitClass; // Expose getAuxUnitClass method

var AuxiliaryUnit = {};

// -------------- AuxiliaryUnit -------------- //
// constructs a new auxiliary unit object and returns it
AuxiliaryUnit.construct = function(parent) {
  var obj = {};

  AuxiliaryUnit.setParentRef(obj, parent);

  obj.id = null;
  obj.bbox = null;  
  obj.anchorSide = null;
  obj.isDisplayed = false;
  obj.style = null;

  return obj;
};

AuxiliaryUnit.getParent = function(mainObj, cy) {
  var parent = mainObj.parent;
  // If parent variable stores the id of parent instead of the actual parent get the actual parent by id
  if (typeof parent === 'string') {
    return cy.getElementById(parent);
  }

  return parent;
};

AuxiliaryUnit.setParentRef = function(mainObj, newParent) {
  if (mainObj && newParent) {
    // Reference to id instead of the node itself to avaoid circular reference
    mainObj.parent = typeof newParent === 'string' ? newParent : newParent.id();
  }
}

AuxiliaryUnit.checkPoint = function(x, y, node, threshold) {
  var centerX = node._private.position.x;
  var centerY = node._private.position.y;
  var padding = parseInt(node.css('border-width')) / 2;
  var stateAndInfos = node._private.data.statesandinfos;
  var cyBaseNodeShapes = cytoscape.baseNodeShapes;
//    threshold = parseFloat(threshold);

  for (var i = 0; i < stateAndInfos.length; i++) {
    var state = stateAndInfos[i];

    if (!state.isDisplayed) {
      continue;
    }

    var stateWidth = parseFloat(state.bbox.w) + threshold;
    var stateHeight = parseFloat(state.bbox.h) + threshold;
    var coord = AuxiliaryUnit.getAbsoluteCoord(state, node.cy());
    var stateCenterX = coord.x;
    var stateCenterY = coord.y;
    var checkPoint;

    if (state.clazz == "state variable") {
      checkPoint = cyBaseNodeShapes["ellipse"].checkPoint(
              x, y, padding, stateWidth, stateHeight, stateCenterX, stateCenterY);
    } else if (state.clazz == "unit of information") {
      checkPoint = cyBaseNodeShapes["roundrectangle"].checkPoint(
              x, y, padding, stateWidth, stateHeight, stateCenterX, stateCenterY);
    }

    if (checkPoint == true) {
      return state;
    }
  }

  return null;
};

/*
 * Return a new AuxiliaryUnit object. A new parent reference and new id can
 * optionnally be passed.
 */
AuxiliaryUnit.copy = function (mainObj, cy, existingInstance, newParent, newId) {
  var newUnit = existingInstance ? existingInstance : AuxiliaryUnit.construct();

  var parentToSet = newParent || getAuxUnitClass(mainObj).getParent(mainObj, cy);
  AuxiliaryUnit.setParentRef(newUnit, parentToSet);

  newUnit.id = newId ? newId : mainObj.id;
  newUnit.bbox = jQuery.extend(true, {}, mainObj.bbox);
  newUnit.coordType = mainObj.coordType;
  newUnit.anchorSide = mainObj.anchorSide;
  newUnit.isDisplayed = mainObj.isDisplayed;
  newUnit.style = mainObj.style;
  return newUnit;
};

// draw the auxiliary unit at its position
AuxiliaryUnit.draw = function(mainObj, cy, context) {
  var unitClass = getAuxUnitClass(mainObj);
  var coords = unitClass.getAbsoluteCoord(mainObj, cy);

  unitClass.drawShape(mainObj, cy, context, coords.x, coords.y);
  if (unitClass.hasText(mainObj, cy)) {
    unitClass.drawText(mainObj, cy, context, coords.x, coords.y);
  }
  mainObj.isDisplayed = true;
};

// to be implemented by children
AuxiliaryUnit.getText = function(mainObj, cy) {
  throw new Error("Abstract method!");
};
AuxiliaryUnit.hasText = function(mainObj, cy) {
  throw new Error("Abstract method!");
};
AuxiliaryUnit.drawShape = function(mainObj, cy, context, x, y) {
  var style = mainObj.style;
  cytoscape.sbgn.drawInfoBox(context, x, y, mainObj.bbox.w, mainObj.bbox.h,
                              style['shape-name']);

  var tmp_ctxt = context.fillStyle;
  context.fillStyle = style['background-color'];
  context.fill();
  context.fillStyle = tmp_ctxt;

  var parent = getAuxUnitClass(mainObj).getParent(mainObj, cy);
  var borderStyle = style.dashed ? 'dashed' : undefined;
  var borderWidth = style['border-width'];
  // Selected nodes have a specific border color so infobox should have the same
  // border color when the node is selected. May need to be updated if style of
  // selected nodes is updated in a different way.
  var borderColor = parent.selected() ? null : style['border-color'];
  cytoscape.sbgn.drawBorder( { context, node: parent, borderStyle, borderColor, borderWidth } );
};

// draw the statesOrInfo's label at given position
AuxiliaryUnit.drawText = function(mainObj, cy, context, centerX, centerY) {
  // access the sbgnvizParams set for cy
  var options = cy.scratch('_sbgnviz').sbgnvizParams.optionUtilities.getOptions();
  var unitClass = getAuxUnitClass(mainObj);
  var parent = unitClass.getParent(mainObj, cy);
  var style = mainObj.style;

  // part of : $$.sbgn.drawText(context, textProp);
  // save style before modification
  var oldFont = context.font;
  var oldStyle = context.fillStyle;
  var oldOpacity = context.globalAlpha;

  context.font = style['font-style'] + " " + style['font-weight'] + " "
                  + style['font-size'] + "px " + style['font-family'];
  context.fillStyle = style['font-color'];
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.globalAlpha = parent.css('text-opacity') * parent.css('opacity'); // ?

  var text;
  if(options.fitLabelsToInfoboxes()){
    // here we memoize the truncated text into _textCache,
    // as it is not something that changes so much
    text = unitClass.getText(mainObj, cy);
    var key = text + context.font + mainObj.bbox.w;
    if(mainObj._textCache && mainObj._textCache[key]) {
      text = mainObj._textCache[key];
    }
    else {
      text = truncate(unitClass.getText(mainObj, cy), context.font, mainObj.bbox.w);
      if(!mainObj._textCache) {
        mainObj._textCache = {};
      }
      mainObj._textCache[key] = text;
    }
  }
  else {
    text = unitClass.getText(mainObj, cy);
  }

  context.fillText(text, centerX, centerY);

  // restore saved style
  context.fillStyle = oldStyle;
  context.font = oldFont;
  context.globalAlpha = oldOpacity;
};

AuxiliaryUnit.getAbsoluteCoord = function(mainObj, cy) {
  var parent = getAuxUnitClass(mainObj).getParent(mainObj, cy);
  var position = parent.position();
  var padding = parent.padding();
  /* if(parent.data().complexCalculatedPadding){
    padding = Number(parent.data().complexCalculatedPadding);
    //delete parent._private.data.complexCalculatedPadding;
  }else{
    padding = parent.padding();
  } */
  var parentWidth = parent.width();
  var parentHeight = parent.height();
  var borderWidth = Number(parent.css("border-width").replace("px",""));//parent.data()['border-width'];
  var position = parent.position();
  if (mainObj === undefined || parent === undefined || position === undefined) {
    return;
  }
  var borderWidth = parent.data()["border-width"];
  if ( borderWidth === undefined) {
    return;
  }

  var absX , absY;
  if (mainObj.anchorSide == "top" || mainObj.anchorSide == "bottom") {    
   
    absX = ((mainObj.bbox.x * (parent.outerWidth() - borderWidth)) / 100) + (position.x - parentWidth/2 - padding);
    absY = mainObj.anchorSide == "top" ? position.y - parentHeight/2 - padding : position.y + parentHeight/2 + padding ;
   
   
  }
  else {   
    absY = ((mainObj.bbox.y * (parent.outerHeight() - borderWidth)) / 100) + (position.y - parentHeight/2 - padding);
    absX = mainObj.anchorSide == "left" ? position.x - parentWidth/2 - padding :position.x + parentWidth/2 + padding;  
    
  }

  
  // due to corner of barrel shaped compartment shift absX to right
 /*  if (parent.data("class") == "compartment"){
      absX += parent.outerWidth() * 0.1;
  } */

  return {x: absX, y: absY};
  
};

AuxiliaryUnit.convertToAbsoluteCoord = function(mainObj, relX, relY, cy) {
  var parent = getAuxUnitClass(mainObj).getParent(mainObj, cy);
  var position = parent.position();
  var padding = parent.padding();
  var parentWidth = parent.width();
  var parentHeight = parent.height();
  var borderWidth = Number(parent.css("border-width").replace("px",""));


  var absX , absY;
  if (mainObj.anchorSide == "top" || mainObj.anchorSide == "bottom") {    
   
    absX = ((relX * (parent.outerWidth() - borderWidth)) / 100) + (position.x - parentWidth/2 - padding);
    absY = mainObj.anchorSide == "top" ? position.y - parentHeight/2 - padding : position.y + parentHeight/2 + padding;
   
   
  }
  else {   
     absY = ((relY * (parent.outerHeight() - borderWidth)) / 100) + (position.y - parentHeight/2 - padding);
     absX = mainObj.anchorSide == "left" ? position.x - parentWidth/2 - padding :position.x + parentWidth/2 + padding;   
    
  }

 /*  if (parent.data("class") == "compartment"){
    absX += parent.outerWidth() * 0.1;
  }; */
  return {x: absX, y: absY}; 
};

AuxiliaryUnit.convertToRelativeCoord = function(mainObj, absX, absY, cy, parentNode){
  if (mainObj === undefined) {
    return;
  }
  if (parentNode !== undefined) {
    var parent = parentNode;
  }
  else {
    var parent = getAuxUnitClass(mainObj).getParent(mainObj, cy);
  }
  var position = parent.position();
  var parentWidth = parent.width();
  var parentHeight = parent.height();
  var padding = parent.padding();
 /*  if(parent.data().complexCalculatedPadding){
    padding = Number(parent.data().complexCalculatedPadding)
  }else{
    padding = parent.padding();
  } */
 
 
 
 
  var borderWidth = Number(parent.css("border-width").replace("px",""));


  /* if (parent.data("class") == "compartment"){
    absX -= parent.outerWidth() * 0.1;
  } */

  var relX , relY;
  if (mainObj.anchorSide == "top" || mainObj.anchorSide == "bottom") {
    
   
    relX = ((absX - (position.x - parentWidth/2 - padding)) * 100 )/ (parent.outerWidth() - borderWidth);
    relY = mainObj.anchorSide == "top" ? 0 : 100;
  }
  else {
   
    relX = mainObj.anchorSide == "left" ? 0 : 100;
    relY = ((absY - (position.y - parentHeight/2 - padding)) * 100) / (parent.outerHeight() - borderWidth);
   
  }
  relX = relX < 0 ? 0 : relX;
  relX = relX > 100 ? 100 : relX;
  relY = relY < 0 ? 0 : relY;
  relY = relY > 100 ? 100 : relY;

  
  return {x: relX, y: relY};
  
  
};

AuxiliaryUnit.setAnchorSide = function(mainObj, node) {

  var thisX = mainObj.bbox.x;
  var thisY = mainObj.bbox.y;
  var thisH = mainObj.bbox.h;
  var thisW = mainObj.bbox.w;
  var width, height, padding;
  if(node.data("originalW")){
    width = node.data("originalW");    
    padding = 0;
  }else{
    width = node.width();
    padding = node.data('class') == "complex" ? Number(node.data().complexCalculatedPadding) : node.padding();
  }

  if(node.data("originalH")){
    height = node.data("originalH");    
    padding = 0;
  }else{
    height = node.height();
    padding = node.data('class') == "complex" ? Number(node.data().complexCalculatedPadding) : node.padding();
  }
  
 
  
  var parentX = (node.data('class') == "compartment" || node.data('class') == "complex") ? node.data('bbox').x : node.position().x;
  var parentY = (node.data('class') == "compartment" || node.data('class') == "complex") ? node.data('bbox').y : node.position().y;
  var parentX1 = Number((parentX - width / 2 - padding).toFixed(2));
  var parentX2 = Number((parentX+width/2 + padding).toFixed(2));
  var parentY1 = Number((parentY - height/ 2 - padding).toFixed(2));
  var parentY2 = Number((parentY + height/ 2+ padding).toFixed(2));
  var centerX = Number((thisX+thisW/2).toFixed(2));
  var centerY = Number((thisY+thisH/2).toFixed(2));


  if (centerY ==parentY1){
    mainObj.anchorSide = "top";
  }
  else if (centerY == parentY2) {
    mainObj.anchorSide = "bottom";
  }
  else if(centerX == parentX1) {
    mainObj.anchorSide = "left";
  }
  else if((centerX  <=  (parentX2 + 2))  && (centerX  >=  (parentX2 - 2)) ){
    mainObj.anchorSide = "right";
  }else{
    return false;
  }

  return true;

};



AuxiliaryUnit.addToParent = function (mainObj, cy, parentNode, location, position, index) {

  // add state var to the parent's statesandinfos
  if(typeof index != "undefined") { // specific index provided (for undo/redo consistency)
    parentNode.data('statesandinfos').splice(index, 0, mainObj);
  }
  else {
    parentNode.data('statesandinfos').push(mainObj);
  }

  if(!parentNode.data('auxunitlayouts')) { // ensure minimal initialization
    parentNode.data('auxunitlayouts', {});
  }
  if(!location) { // location not provided, need to define it automatically
    location = AuxUnitLayout.selectNextAvailable(parentNode, cy);
  }
  // here we are sure to have a location even if it was not provided as argument
  // get or create the necessary layout
  if(!parentNode.data('auxunitlayouts')[location]) {
    parentNode.data('auxunitlayouts')[location] = AuxUnitLayout.construct(parentNode, location);
  }

  var layout = parentNode.data('auxunitlayouts')[location];
  mainObj.anchorSide = location;
  switch(location) {
    case "top": mainObj.bbox.y = 0; break;
    case "bottom": mainObj.bbox.y = 100; break;
    case "left": mainObj.bbox.x = 0; break;
    case "right": mainObj.bbox.x = 100; break;
  }
  // add stateVar to layout, precomputing of relative coords will be triggered accordingly
  var insertedPosition = AuxUnitLayout.addAuxUnit(layout, cy, mainObj, position);
  return insertedPosition;
}

AuxiliaryUnit.removeFromParent = function (mainObj, cy) {
  var parent = getAuxUnitClass(mainObj).getParent(mainObj, cy);
  var parentLayout = parent.data('auxunitlayouts')[mainObj.anchorSide];
  AuxUnitLayout.removeAuxUnit(parentLayout, cy, mainObj);
  if (AuxUnitLayout.isEmpty(parentLayout)){
    delete parent.data('auxunitlayouts')[mainObj.anchorSide];
  }
  var statesandinfos = parent.data('statesandinfos');
  var index  = statesandinfos.indexOf(mainObj);
  statesandinfos.splice(index, 1);
};

AuxiliaryUnit.getPositionIndex = function(mainObj, cy) {
  return getAuxUnitClass(mainObj).getParent(mainObj, cy).data('auxunitlayouts')[mainObj.anchorSide].units.indexOf(mainObj);
};

ns.AuxiliaryUnit = AuxiliaryUnit;
// -------------- END AuxiliaryUnit -------------- //

// -------------- StateVariable -------------- //
/**
 * parent has to be a stateful EPN (complex, macromolecule or nucleic acid)
 */

var StateVariable = {};

// StateVariable extends AuxiliaryUnit by inheriting each static property of it
for (var prop in AuxiliaryUnit) {
  StateVariable[prop] = AuxiliaryUnit[prop];
}

// Construct a state variable object by extending default behaviours of a AuxiliaryUnit object and returns that object
StateVariable.construct = function(value, stateVariableDefinition, parent, id) {
  var obj = AuxiliaryUnit.construct(parent);
  obj.id = id || elementUtilities.generateStateVarId();
  obj.state = {};
  obj.state.value = value;
  obj.state.variable = null;
  obj.stateVariableDefinition = stateVariableDefinition;
  obj.clazz = "state variable";

  return obj;
};

StateVariable.getText = function(mainObj) {
  var stateValue = mainObj.state.value || '';
  var stateVariable = mainObj.state.variable ? "@" + mainObj.state.variable : "";

  return stateValue + stateVariable;
};

StateVariable.hasText = function(mainObj) {
  return (mainObj.state.value && mainObj.state.value != "") || (mainObj.state.variable && mainObj.state.variable != "");
};

/*this function is called upon creation of state variable and it returns the location information of the added state variable
*/
StateVariable.create = function(parentNode, cy, value, variable, bbox, location, position, style, index, id) {
  // create the new state var of info
  var stateVar = StateVariable.construct();
  StateVariable.setParentRef(stateVar, parentNode);

  stateVar.value = value;
  stateVar.variable = variable;
  stateVar.state = {value: value, variable: variable};
  stateVar.bbox = bbox;
  stateVar.style = style;
  if ( id ) {
    stateVar.id = id;
  }
  // link to layout
  position = StateVariable.addToParent(stateVar, cy, parentNode, location, position, index);
  return {
    index: StateVariable.getParent(stateVar, cy).data('statesandinfos').indexOf(stateVar),
    location: stateVar.anchorSide,
    position: position
  }

};

StateVariable.remove = function (mainObj, cy) {
  var position = StateVariable.getPositionIndex(mainObj, cy);
  var index = StateVariable.getParent(mainObj, cy).data('statesandinfos').indexOf(mainObj);
  StateVariable.removeFromParent(mainObj, cy);
  //console.log("after remove", this.parent.data('auxunitlayouts'), this.parent.data('statesandinfos'));
  return {
    clazz: "state variable",
    state: {
      value: mainObj.state.value,
      variable: mainObj.state.variable
    },
    bbox: {
      w: mainObj.bbox.w,
      h: mainObj.bbox.h
    },
    location: mainObj.anchorSide,
    position: position,
    index: index,
    style : mainObj.style
  };
};

StateVariable.copy = function(mainObj, cy, newParent, newId) {
  var newStateVar = AuxiliaryUnit.copy(mainObj, cy, StateVariable.construct(), newParent, newId);
  newStateVar.state = jQuery.extend(true, {}, mainObj.state);
  newStateVar.stateVariableDefinition = mainObj.stateVariableDefinition;
  newStateVar.clazz = mainObj.clazz;
  return newStateVar;
};

ns.StateVariable = StateVariable;
// -------------- END StateVariable -------------- //

// -------------- UnitOfInformation -------------- //
/**
 * parent can be an EPN, compartment or subunit
 */

var UnitOfInformation = {};

// UnitOfInformation extends AuxiliaryUnit by inheriting each static property of it
for (var prop in AuxiliaryUnit) {
  UnitOfInformation[prop] = AuxiliaryUnit[prop];
}

// Constructs a UnitOfInformation object by extending properties of an AuxiliaryUnit object and return that object
UnitOfInformation.construct = function(value, parent, id) {
  var obj = AuxiliaryUnit.construct(parent);
  obj.id = id || elementUtilities.generateUnitOfInfoId();
  obj.label = {text: value}; // from legacy code, contains {text: }
  obj.clazz = "unit of information";

  return obj;
};

UnitOfInformation.getText = function(mainObj) {
  return mainObj.label.text;
};

UnitOfInformation.hasText = function(mainObj) {
  return mainObj.label.text && mainObj.label.text != "";
};

/**
 * Creates a unit of info and links everything accordingly
 * @param parentNode - the cytoscape element hosting the unit of information
 * @param value - its text
 * @param [location] - the side where it will be placed top, bottom, right, left or undefined (auto placement)
 * @param [position] - its position in the order of elements placed on the same location
 * @param [index] - its index in the statesandinfos list
 */
UnitOfInformation.create = function (parentNode, cy, value, bbox, location, position, style, index, id) {
  // create the new unit of info
  var unit = UnitOfInformation.construct(value, parentNode);
  unit.bbox = bbox;
  unit.style = style;
  if ( id ) {
    unit.id = id;
  }

  //console.log("will insert on", location, position);
  position = UnitOfInformation.addToParent(unit, cy, parentNode, location, position, index);

  return {
    index: UnitOfInformation.getParent(unit, cy).data('statesandinfos').indexOf(unit),
    location: unit.anchorSide,
    position: position
  }
};

UnitOfInformation.remove = function (mainObj, cy) {
  var position = UnitOfInformation.getPositionIndex(mainObj, cy);
  var index = UnitOfInformation.getParent(mainObj, cy).data('statesandinfos').indexOf(mainObj);
  UnitOfInformation.removeFromParent(mainObj, cy);
  //console.log("after remove", this.parent.data('auxunitlayouts'), this.parent.data('statesandinfos'));
  return {
    clazz: "unit of information",
    label: {
      text: mainObj.label.text
    },
    bbox: {
      w: mainObj.bbox.w,
      h: mainObj.bbox.h
    },
    location: mainObj.anchorSide,
    position: position,
    index: index,
    style: mainObj.style
  };
};

UnitOfInformation.copy = function(mainObj, cy, newParent, newId) {
  var newUnitOfInfo = AuxiliaryUnit.copy(mainObj, cy, UnitOfInformation.construct(), newParent, newId);
  newUnitOfInfo.label = jQuery.extend(true, {}, mainObj.label);
  newUnitOfInfo.clazz = mainObj.clazz;
  return newUnitOfInfo;
};

ns.UnitOfInformation = UnitOfInformation;
// -------------- END UnitOfInformation -------------- //

// -------------- EntityType -------------- //
/**
 * The type of the EPN, for example there can be severals myosin EPN, but only one myosin EntityType
 * This class will hold the information regarding state variable, that are shared between all myosins
 */

var EntityType = {};

// Constructs an EntityType object and returns it
EntityType.construct = function(name, EPN) {
  var obj = {};
  obj.name = name; // normally the same as its EPNs
  obj.stateVariableDefinitions = []; // 0 or many shared state definitions
  obj.EPNs = []; // there should always be at least 1 element, else no reason to exist
  return obj;
};

EntityType.createNewDefinitionFor = function (mainObj, stateVar) {
  var newDefinition = StateVariableDefinition.construct();
  newDefinition.entityType = mainObj;
  newDefinition.stateVariables.push(stateVar);

  stateVar.stateVariableDefinition = newDefinition;
  stateVar.parent.data('entityType', mainObj);
  mainObj.stateVariableDefinitions.push(newDefinition);
};

EntityType.assignStateVariable = function (mainObj, stateVar) {
  // first trivial case, no stateDefinition yet for this entityType, so this is a new one
  if (mainObj.stateVariableDefinitions.length == 0) {
    EntityType.createNewDefinitionFor(mainObj, stateVar);
  }
  else { // if definitions are already present, we need to match those to the current stateVariable
    for(var i=0; i < mainObj.stateVariableDefinitions.length; i++) {
      var matchStateDef = mainObj.stateVariableDefinitions[i];
      if (StateVariableDefinition.matchStateVariable(matchStateDef, stateVar)){
        matchStateDef.stateVariables.push(stateVar);
        stateVar.stateVariableDefinition = matchStateDef;
        stateVar.parent.data('entityType', mainObj);
        return;
      }
    }
    // if nothing was matched among the current stateVarDef of this entityType, create new one
    EntityType.createNewDefinitionFor(mainObj, stateVar);
  }
};

ns.EntityType = EntityType;
// -------------- END EntityType -------------- //

// -------------- StateVariableDefinition -------------- //
/**
 * The state variable definition is something shared across different EPNs
 * The concerned EPNs are linked through the entitype reference
 */

var StateVariableDefinition = {};

// Constructs a new StateVariableDefinition object and returns it
StateVariableDefinition.construct = function(name, entityType) {
  var obj = {};
  obj.name = name;
  obj.entityType = entityType; // reference to owning entity type
  obj.stateVariables = []; // there should always be at least 1 element, else no reason to exist
  return obj;
};

/**
 * returns an array of elements that share this state definition
 */
StateVariableDefinition.getConcernedEPNs = function(mainObj) {
  return mainObj.entityType.EPNs;
};

/**
 * Guess if the provided stateVariable belongs to this stateVarDefinition
 * We consider it does, if either the statevar.value or statevar.variable are matching one
 * if the statevar in the set of the StateVarDef
 * This is because we normally compare only stateVariables from the same entityType
 */
StateVariableDefinition.matchStateVariable = function(mainObj, stateVar) {
  for(var i=0; i < mainObj.stateVariables.length; i++) {
    var matchStateVar = mainObj.stateVariables[i];
    // Don't match a stateVar against another one from the same element.
    // If 2 statevar on the same element, then they have to belong to 2 different stateVarDefinitions
    if(matchStateVar.parent === stateVar.parent) {
      continue;
    }
    //console.log("try", [matchStateVar.value, matchStateVar.variable], [stateVar.value, stateVar.variable]);
    // normal sure case. Example:
    // P T134 - undefined T134
    // P undef - P undef
    if (//(matchStateVar.value && stateVar.value && matchStateVar.value == stateVar.value ) ||
        (matchStateVar.variable && stateVar.variable && matchStateVar.variable == stateVar.variable)) {
      return true;
    }
    // more subtle case, with empty stateVar. Look only at value and discard variable
    // example: undef undef - P undef
    else if ((!matchStateVar.variable && !stateVar.variable) && (matchStateVar.value || stateVar.value)) {
      return true;
    }
  }
  return false;
};

ns.StateVariableDefinition = StateVariableDefinition;
// -------------- END StateVariableDefinition -------------- //

// -------------- AuxUnitLayout -------------- //
/**
 * Responsible for laying out the auxiliary units contained on a same edge
 */

var AuxUnitLayout = {};

AuxUnitLayout.construct = function(parentNode, location, alignment) {
  var obj = {};
  obj.units = [];
  obj.location = location;
  obj.alignment = alignment || "left"; // this was intended to be used, but it isn't for now
  AuxUnitLayout.setParentNodeRef(obj, parentNode);

  obj.renderLengthCache = [];
  obj.lengthUsed = 0;

  // specific rules for the layout
  if(parentNode.data('class') == "simple chemical") {
    obj.outerMargin = 3;
  }

  return obj;
};

AuxUnitLayout.getParentNode = function(mainObj, cy) {
  //console.log(mainObj);
  var parentNode = mainObj.parentNode;

  // If parentNode is id of parent node rather than being itself get the parent node by that id
  if (typeof parentNode === 'string') {
    return cy.getElementById(parentNode)
  }

  return parentNode;
};

AuxUnitLayout.setParentNodeRef = function(mainObj, parentNode) {
  if (mainObj && parentNode) {
    // Keep id of parent node to avaoid circular references
    mainObj.parentNode = typeof parentNode === 'string' ? parentNode : parentNode.id();
  }
}

/**
 * outerMargin: the left and right space left between the side of the node, and the first (and last) box
 * unitGap: the space between the auxiliary units
 * alwaysShowAuxUnits: bypasses any limit of units displayed, and prevent units from disappearing,
 * forcing a minimum size for the node
 * maxUnitDisplayed: show at most this amount of units, even when there is enough space
 *
 * These options can be defined at the instance level. If it is found in an instance, then it
 * takes precedence. If not found, the following class' values are used.
 */
AuxUnitLayout.outerMargin = 5;
AuxUnitLayout.unitGap = 5;
AuxUnitLayout.currentTopUnitGap = 5;
AuxUnitLayout.currentBottomUnitGap = 5;
AuxUnitLayout.currentLeftUnitGap = 5;
AuxUnitLayout.currentRightUnitGap = 5;
AuxUnitLayout.alwaysShowAuxUnits = true;
AuxUnitLayout.maxUnitDisplayed = -1;
AuxUnitLayout.lastPos = -1;

AuxUnitLayout.update = function(mainObj, cy) {
  //AuxUnitLayout.precomputeCoords(mainObj, cy);
};

AuxUnitLayout.addAuxUnit = function(mainObj, cy, unit, position, preComputed) {
  if(typeof position != "undefined") {
    //console.log("add unit at positiion", position);
    mainObj.units.splice(position, 0, unit);
  }
  else {
    mainObj.units.push(unit);
    position = mainObj.units.length - 1;
  }
  if (preComputed === undefined || preComputed === false) {
    AuxUnitLayout.computeCoords(mainObj, cy, unit);
    var parentNode = AuxUnitLayout.getParentNode(mainObj, cy);
    var locations = AuxUnitLayout.checkFit(parentNode,cy);
    if(locations.filter(function(loc){return loc == mainObj.location}).length > 0){
      AuxUnitLayout.fitUnits(parentNode,cy, [mainObj.location]);
    }
    
    
  }
  //AuxUnitLayout.updateLengthCache(mainObj, cy);
  //AuxUnitLayout.update(mainObj, cy, true);
  /*if (AuxUnitLayout.getAlwaysShowAuxUnits(mainObj)) {
    // set a minimum size according to both sides on the same orientation
    AuxUnitLayout.setParentMinLength(mainObj, cy);
    // need to resize the parent in case the space was too small
    AuxUnitLayout.resizeParent(mainObj, cy, mainObj.lengthUsed);
  }*/
  //cy.style().update(); // <- was it really necessary ?
  return position;
};

AuxUnitLayout.computeCoords = function(mainObj, cy, unit){
  AuxUnitLayout.setDisplayedUnits(mainObj, cy);
  var location = mainObj.location;
  var node = AuxUnitLayout.getParentNode(mainObj, cy);
  if (location === "top" || location === "bottom") {
    var position = node.position();
    var parentWidth = node.data('bbox').w;
    var padding = node.padding();
    var parentWidth = node.width();
    var parentHeight = node.height();
    var parentX1 = position.x - parentWidth/2 - padding;
    var parentX2 = position.x + parentWidth/2 + padding;
    var parentY1 = position.y - parentHeight/2 - padding;
    var parentY2 = position.y + parentHeight/2 + padding;

    if (mainObj.units.length === 1) {
      
      var relativeCoords = AuxiliaryUnit.convertToRelativeCoord(unit, unit.bbox.w/2 + (parentX1) + AuxUnitLayout.getCurrentGap(location), (parentY1) + AuxUnitLayout.getCurrentGap(location), cy);
      unit.bbox.x = relativeCoords.x ;
      unit.bbox.y = relativeCoords.y;
    }
    else {
      var lastUnit = mainObj.units[mainObj.units.length - 2];//Get the position of the last unit
      var lastUnitAbsCord = AuxiliaryUnit.convertToAbsoluteCoord(lastUnit, lastUnit.bbox.x, lastUnit.bbox.y, cy);
      var relativeCoords = AuxiliaryUnit.convertToRelativeCoord(unit, unit.bbox.w/2+ lastUnitAbsCord.x + lastUnit.bbox.w/2 + AuxUnitLayout.getCurrentGap(location), (parentY1) + AuxUnitLayout.getCurrentGap(location), cy);
      unit.bbox.x = relativeCoords.x ;
      unit.bbox.y = relativeCoords.y;
     // unit.bbox.x = mainObj.units[lastUnit].bbox.x +  mainObj.units[lastUnit].bbox.w/2 + unit.bbox.w/2 + AuxUnitLayout.getCurrentGap(location);
    }
    unit.bbox.y = (location === "top") ? 0 : 100;
  }//We don't have the right or left addition cases yet
};

AuxUnitLayout.removeAuxUnit = function(mainObj, cy, unit) {
  var index = mainObj.units.indexOf(unit);
  mainObj.units.splice(index, 1);
  //AuxUnitLayout.updateLengthCache(mainObj, cy);
  /*AuxUnitLayout.update(mainObj, cy, true);
  if (AuxUnitLayout.getAlwaysShowAuxUnits(mainObj)) {
    // set a minimum size according to both sides on the same orientation
    AuxUnitLayout.setParentMinLength(mainObj, cy);
  }*/
  var parentNode = AuxUnitLayout.getParentNode(mainObj, cy);

  //TODO find a way to elimate this redundancy to update info-box positions
  parentNode.data('border-width', parentNode.data('border-width'));
};

/**
 * reorder boxes using their defined positions. From left to right and top to bottom.
 * this ensures that their order in the layout's list corresponds to the reality of the map.
 */
AuxUnitLayout.reorderFromPositions = function(mainObj, cy) {
  mainObj.units.sort(function(a, b) {
    if(mainObj.location == "top" || mainObj.location == "bottom") {
      if (a.bbox.x < b.bbox.x) {
        return -1;
      }
      if (a.bbox.x > b.bbox.x) {
        return 1;
      }
    }
    else {
      if (a.bbox.y < b.bbox.y) {
        return -1;
      }
      if (a.bbox.y > b.bbox.y) {
        return 1;
      }
    }
    return 0;
  });
  //console.log("units after reoarder", this.units);
  /*AuxUnitLayout.updateLengthCache(mainObj, cy);
  AuxUnitLayout.update(mainObj, cy, true);*/
};

/**
 * use a cached list to determine what is the length needed to draw x aux units.
 * can then be compared against the parent node's dimensions, to decide how many
 * aux units to draw.
 */
AuxUnitLayout.updateLengthCache = function(mainObj, cy) {
  mainObj.renderLengthCache = [0];
  var previous = AuxUnitLayout.getOuterMargin(mainObj);
  for(var i=0; i < mainObj.units.length; i++) {
    var currentLength;
    if(AuxUnitLayout.isTorB(mainObj)) {
      currentLength = mainObj.units[i].bbox.w;
    }
    else {
      currentLength = mainObj.units[i].bbox.h;
    }
    mainObj.renderLengthCache.push(previous + currentLength + AuxUnitLayout.getOuterMargin(mainObj));
    previous += currentLength + AuxUnitLayout.getUnitGap(mainObj);
  }
};

/**
 * Use the cached precomputed lengths to decide how many units we are capable of drawing,
 * considering the size of the parent node.
 * The number returned says: we are able to draw the N first units of the lists.
 * Unused for now.
 */
AuxUnitLayout.getDrawableUnitAmount = function(mainObj) {
  if(AuxUnitLayout.getAlwaysShowAuxUnits(mainObj)) {
    // bypass all this
    return mainObj.units.length;
  }

  // get the length of the side on which we draw
  var availableSpace;
  if (AuxUnitLayout.isTorB(mainObj)) {
    availableSpace = AuxUnitLayout.getParentNode(mainObj, cy).outerWidth();
  }
  else {
    availableSpace = AuxUnitLayout.getParentNode(mainObj, cy).outerHeight();
  }
  // loop over the cached precomputed lengths
  for(var i=0; i < mainObj.renderLengthCache.length; i++) {
    if(mainObj.renderLengthCache[i] > availableSpace) {
      // stop if we overflow
      return i - 1;
    }
  }
  return mainObj.units.length;
};

AuxUnitLayout.setDisplayedUnits = function (mainObj, cy) {
  // get the length of the side on which we draw

  var availableSpace;
  if (AuxUnitLayout.isTorB(mainObj)) {
    availableSpace = AuxUnitLayout.getParentNode(mainObj, cy).outerWidth();
    // due to corner of barrel shaped compartment decrease availableSpace -- no infobox on corners
    if (AuxUnitLayout.getParentNode(mainObj, cy).data("class") == "compartment")
        availableSpace *= 0.8;
  }
  else {
    availableSpace = AuxUnitLayout.getParentNode(mainObj, cy).outerHeight();
  }

  // there is always n+1 elements in the cachedLength for n units
  var alwaysShowAuxUnits = AuxUnitLayout.getAlwaysShowAuxUnits(mainObj);
  var maxUnitDisplayed = AuxUnitLayout.getMaxUnitDisplayed(mainObj);
  for(var i=0; i < mainObj.units.length; i++) {
    if((mainObj.renderLengthCache[i+1] <= availableSpace // do we have enough space?
      && (maxUnitDisplayed == -1 || i < maxUnitDisplayed)) // is there no limit? or are we under that limit?
      || alwaysShowAuxUnits) { // do we always want to show everything regardless?
      mainObj.units[i].isDisplayed = true;
    }
    else {
      mainObj.units[i].isDisplayed = false;
    }
  }
};


AuxUnitLayout.getUsedWidth = function(node, tb){
  var units = tb.units;
  var totalWidth = 0;
  for (var i = 0; i < units.length; i++) {
    totalWidth += units[i].bbox.w;
  }
  return totalWidth;
}

AuxUnitLayout.getUsedHeight = function(node, tb){
  var units = tb.units;
  var totalHeight = 0;
  for (var i = 0; i < units.length; i++) {
    totalHeight += units[i].bbox.h;
  }
  return totalHeight;
}

AuxUnitLayout.getUsedLengthTB = function(node, tb){
  var units = tb.units;
  return AuxUnitLayout.getUsedWidth(node, tb) + (units.length +  1) * AuxUnitLayout.unitGap; //One gap for leftmost outer margin
}

AuxUnitLayout.getUsedLengthLR = function(node, tb){
  var units = tb.units;
  return AuxUnitLayout.getUsedHeight(node, tb) + (units.length +  1) * AuxUnitLayout.unitGap; //One gap for leftmost outer margin
}

AuxUnitLayout.setCurrentGap = function (location, value){
  if (location === "top") {
    AuxUnitLayout.currentTopUnitGap = value;
  }
  else if (location === "bottom") {
    AuxUnitLayout.currentBottomUnitGap = value;
  }
  else if (location === "right") {
    AuxUnitLayout.currentRightUnitGap = value;
  }
  else {
    AuxUnitLayout.currentLeftUnitGap = value;
  }
};

AuxUnitLayout.getCurrentGap = function (location){
  if (location === "top") {
    return AuxUnitLayout.currentTopUnitGap;
  }
  else if (location === "bottom") {
    return AuxUnitLayout.currentBottomUnitGap;
  }
  else if (location === "right") {
    return AuxUnitLayout.currentRightUnitGap;
  }
  else {
    return AuxUnitLayout.currentLeftUnitGap;
  }
};

AuxUnitLayout.checkFit = function (node, cy, forceCheck){
  var fitLocations = [];
  for(var location in node.data('auxunitlayouts')) {
    if (forceCheck !== undefined && location !== forceCheck) {
      continue;
    }
    if (AuxUnitLayout.getCurrentGap(location) < AuxUnitLayout.unitGap) {
      fitLocations.push(location);
      continue;
    }
    var unit = node.data('auxunitlayouts')[location];
    var units = unit.units;
    if (units.length === 0) {
      continue;
    }
    var firstUnit = units[0];
    var lastUnit = units[units.length-1];
    var coordsFirst = AuxiliaryUnit.convertToAbsoluteCoord(firstUnit, firstUnit.bbox.x, firstUnit.bbox.y, cy);
    var coordsLast = AuxiliaryUnit.convertToAbsoluteCoord(lastUnit, lastUnit.bbox.x, lastUnit.bbox.y, cy);
    var gap = AuxUnitLayout.getCurrentGap(location);
    var padding = node.padding();
    if (units.length > 0) { //For any case of removal
      if (location === "top" || location === "bottom") {
        var parentX1 = node.position().x - node.width()/2 - padding;
        var parentX2 = node.position().x + node.width()/2 + padding;
        var firstX1 = coordsFirst.x - firstUnit.bbox.w/2;
        var lastX2 = coordsLast.x + lastUnit.bbox.w/2;

        if(parentX2 < lastX2 + gap){
          fitLocations.push(location)
        }
        /* if (parentX1 + gap > firstX1 || parentX2 - gap < lastX2) {
            fitLocations.push(location);
        } */
      }
      else {
        var parentY1 = node.position().y - node.height()/2 - padding;
        var parentY2 = node.position().y + node.height()/2 + padding;
        var firstY1 = coordsFirst.y - firstUnit.bbox.h/2;
        var lastY2 = coordsLast.y + lastUnit.bbox.h/2;
        if(parentY2 < lastY2 + gap){
          fitLocations.push(location)
        }
        /* if (parentY1 + gap > firstY1 || parentY2 - gap < lastY2) {
            fitLocations.push(location);
        } */
      }
    }
  }
  return fitLocations;
};

AuxUnitLayout.setIdealGap = function(node, location){

  var parentWidth = node.width();
  var parentHeight = node.height();
  var padding = node.padding();
  var position = node.position();
  var parentX1 = position.x - parentWidth/2 - padding;
  var parentY1 = position.y - parentHeight/2 - padding;
  var estimatedGap;
   
    var auxUnit = node.data('auxunitlayouts')[location];
    if (auxUnit === undefined) {
      return 0;
    }
    if (auxUnit.units.length <= 0 || !auxUnit.units) {
      return 0;
    }
    var units = auxUnit.units;
    
    if ( location === "top" || location === "bottom") {
      usedLength = AuxUnitLayout.getUsedLengthTB(node, auxUnit);
      var totalWidth = AuxUnitLayout.getUsedWidth(node, auxUnit);
      estimatedGap = (parentWidth + 2* padding - totalWidth) / (units.length + 1);
      if (estimatedGap > AuxUnitLayout.unitGap) {
        estimatedGap = AuxUnitLayout.unitGap;
      }

      //var firstPosition = AuxiliaryUnit.convertToRelativeCoord(units[0], unit[0].bbox.w/2 + (parentX1) + estimatedGap, (parentY1) + estimatedGap, undefined, node);//Position of the first unit
      
      var usedLength = estimatedGap;
      for (var i = 0; i < units.length; i++) {
        var relativeCord = AuxiliaryUnit.convertToRelativeCoord(units[i], parentX1 +usedLength + units[i].bbox.w/2, (parentY1) , undefined, node);
        units[i].bbox.x = relativeCord.x;
        units[i].bbox.y = relativeCord.y;
        usedLength += units[i].bbox.w+ estimatedGap;       
       
      }
      AuxUnitLayout.setCurrentGap(location, estimatedGap);
    }
    else {
      //Find total left length
      usedLength = AuxUnitLayout.getUsedLengthLR(node, auxUnit);
      //Compare the side lengths
      var totalHeight = AuxUnitLayout.getUsedHeight(node, auxUnit);
      estimatedGap = (parentHeight + 2* padding - totalHeight) / (units.length + 1);
      if (estimatedGap > AuxUnitLayout.unitGap) {
        estimatedGap = AuxUnitLayout.unitGap;
      }
      //Else scale by using available space, reducing margins and gaps.
      //Check if new gap is enough to fit
      var usedLength = estimatedGap;
      for (var i = 0; i < units.length; i++) {
        var relativeCord = AuxiliaryUnit.convertToRelativeCoord(units[i], parentX1 , (parentY1) + usedLength + units[i].bbox.h/2, undefined, node);
        units[i].bbox.x = relativeCord.x;
        units[i].bbox.y = relativeCord.y;
        usedLength += units[i].bbox.h+ estimatedGap;
      }
      //AuxUnitLayout.currentLeftUnitGap = estimatedGap;
    }
    AuxUnitLayout.setCurrentGap(location, estimatedGap);
  
}
AuxUnitLayout.fitUnits = function (node, cy, locations) {

  var parentWidth = node.width();
  var parentHeight = node.height();
  var padding = node.padding();
  var position = node.position();
  var parentX1 = position.x - parentWidth/2 - padding;
  var parentX2 = position.x + parentWidth/2 + padding;
  var parentY1 = position.y - parentHeight/2 - padding;
  var parentY2 = position.y + parentHeight/2 + padding;

  //Get Parent node and find parent width
  
  var estimatedGap;

  for (var index = 0; index < locations.length; index++) {
    var location = locations[index];
    var auxUnit = node.data('auxunitlayouts')[location];
    if (auxUnit === undefined) {
      continue;
    }
    if (auxUnit.units.length <= 0 || !auxUnit.units) {
      continue;
    }
    var units = auxUnit.units;
    
    if ( location === "top" || location === "bottom") {
      usedLength = AuxUnitLayout.getUsedLengthTB(node, auxUnit);
      var totalWidth = AuxUnitLayout.getUsedWidth(node, auxUnit);
      estimatedGap = (parentWidth + 2*padding - totalWidth) / (units.length + 1);
      if (estimatedGap > AuxUnitLayout.unitGap) {
        estimatedGap = AuxUnitLayout.unitGap;
      }

      //var firstPosition = AuxiliaryUnit.convertToRelativeCoord(units[0], unit[0].bbox.w/2 + (parentX1) + estimatedGap, (parentY1) + estimatedGap, undefined, node);//Position of the first unit
      
      var usedLength = estimatedGap;
      for (var i = 0; i < units.length; i++) {
        var relativeCord = AuxiliaryUnit.convertToRelativeCoord(units[i], parentX1 +usedLength + units[i].bbox.w/2, (parentY1) , undefined, node);
        units[i].bbox.x = relativeCord.x;
        units[i].bbox.y = relativeCord.y;
        usedLength += units[i].bbox.w+ estimatedGap;       
       
      }
      AuxUnitLayout.setCurrentGap(location, estimatedGap);
    }
    else {
      //Find total left length
      usedLength = AuxUnitLayout.getUsedLengthLR(node, auxUnit);
      //Compare the side lengths
      var totalHeight = AuxUnitLayout.getUsedHeight(node, auxUnit);
      estimatedGap = (parentHeight + 2*padding  - totalHeight) / (units.length + 1);
      if (estimatedGap > AuxUnitLayout.unitGap) {
        estimatedGap = AuxUnitLayout.unitGap;
      }
      //Else scale by using available space, reducing margins and gaps.
      //Check if new gap is enough to fit
      var usedLength = estimatedGap;
      for (var i = 0; i < units.length; i++) {
        var relativeCord = AuxiliaryUnit.convertToRelativeCoord(units[i], parentX1 , (parentY1) + usedLength + units[i].bbox.h/2, undefined, node);
        units[i].bbox.x = relativeCord.x;
        units[i].bbox.y = relativeCord.y;
        usedLength += units[i].bbox.h+ estimatedGap;
      }
      //AuxUnitLayout.currentLeftUnitGap = estimatedGap;
    }
    AuxUnitLayout.setCurrentGap(location, estimatedGap);
  }

  //TODO find a way to elimate this redundancy to update info-box positions
  node.data('border-width', node.data('border-width'));

};


// Calculate total length used in a side
// TODO find a way to refactor, remove ugliness of top-bottom/left-right.
AuxUnitLayout.precomputeCoords = function (mainObj, cy, doForceUpdate) {
  AuxUnitLayout.setDisplayedUnits(mainObj, cy);
  var lengthUsed = AuxUnitLayout.getOuterMargin(mainObj);
  var finalLengthUsed = lengthUsed;
  var unitGap = AuxUnitLayout.getUnitGap(mainObj);
  var parentNode = AuxUnitLayout.getParentNode(mainObj, cy);

  for(var i=0; i < mainObj.units.length; i++) {
    // change the coordinate system of the auxiliary unit according to the chosen layout
    var auxUnit = mainObj.units[i];
    if (auxUnit.coordType != "relativeToSide" || doForceUpdate) {
      if (auxUnit.coordType == "relativeToCenter" || doForceUpdate) {
        if(AuxUnitLayout.isTorB(mainObj)) {
          //auxUnit.bbox.y = 0;
          auxUnit.bbox.x = lengthUsed + auxUnit.bbox.w / 2;
        }
        else {
          //auxUnit.bbox.x = 0;
          auxUnit.bbox.y = lengthUsed + auxUnit.bbox.h / 2;
        }
      }
      auxUnit.coordType = "relativeToSide";
    }

    if(AuxUnitLayout.isTorB(mainObj)) {
      //auxUnit.bbox.y = 0;
      lengthUsed += auxUnit.bbox.w + unitGap;
    }
    else {
      //auxUnit.bbox.x = 0;
      lengthUsed += auxUnit.bbox.h + unitGap;
    }

    if(auxUnit.isDisplayed) {
      finalLengthUsed = lengthUsed;
    }
  }
  // adjust the length, should be composed of outerMargin on the end, not unitGap
  finalLengthUsed = finalLengthUsed - unitGap + AuxUnitLayout.getOuterMargin(mainObj);

  mainObj.lengthUsed = finalLengthUsed;
};

AuxUnitLayout.draw = function (mainObj, cy, context) {
  for(var i=0; i < mainObj.units.length; i++) {
    var auxUnit = mainObj.units[i];
      getAuxUnitClass(auxUnit).draw(auxUnit, cy, context);
  }
};

AuxUnitLayout.modifyUnits = function(parentNode, unit, oldLocation, cy){
  var location = unit.anchorSide;
  var posX = unit.bbox.x;
  var posY = unit.bbox.y;
  if (!parentNode.data('auxunitlayouts')[oldLocation]) {
    parentNode.data('auxunitlayouts')[oldLocation] = AuxUnitLayout.construct(parentNode, oldLocation);
  }
  var oldAuxUnit = parentNode.data('auxunitlayouts')[oldLocation];
  var deleteUnits = oldAuxUnit.units;

  //Delete from old location
  var deleteIndex;
  for (var i = 0; i < deleteUnits.length; i++) {
    if(deleteUnits[i] === unit) {
      deleteIndex = i;
      break;
    }
  }
  deleteUnits.splice(deleteIndex, 1);
  //If new is not constructed contruct interval
  if (!parentNode.data('auxunitlayouts')[location]) {
    parentNode.data('auxunitlayouts')[location] = AuxUnitLayout.construct(parentNode, location);
  }
  var insertAuxUnit = insertUnits = parentNode.data('auxunitlayouts')[location];
  var insertUnits = insertAuxUnit.units;

  var index = 0;
  //Insert into new unit array
  if (location === "top" || location === "bottom") {
    while ( insertUnits[index] !== undefined && posX > insertUnits[index].bbox.x) {
      index++;
    }
  }
  else {
    while ( insertUnits[index] !== undefined && posY > insertUnits[index].bbox.y) {
      index++;
    }
  }
  insertUnits.splice(index, 0, unit);
};

AuxUnitLayout.isEmpty = function(mainObj) {
  return mainObj.units.length == 0;
};

AuxUnitLayout.unitCount = function(mainObj) {
  return mainObj.units.length;
};

AuxUnitLayout.unitLength = function(mainObj) {
  var units = mainObj.units;
  var rightMostPoint = 0;
  for (var i = 0; i < units.length; i++) {
    var box = units[i].bbox;
    if (box.x + box.w / 2 > rightMostPoint){
      rightMostPoint = box.x + box.w / 2;
    }
  }
  return rightMostPoint;
};

//Get Unit Gaps
AuxUnitLayout.getCurrentTopGap = function(){
  return AuxUnitLayout.currentTopUnitGap;
}

AuxUnitLayout.getCurrentBottomGap = function(){
  return AuxUnitLayout.currentBottomUnitGap;
}

AuxUnitLayout.getCurrentLeftGap = function(){
  return AuxUnitLayout.currentLeftUnitGap;
}

AuxUnitLayout.getCurrentRightGap = function(){
  return AuxUnitLayout.currentRightUnitGap;
}

/**
 * Auto choose the next layout. To add a new aux unit, for example.
 */
AuxUnitLayout.selectNextAvailable = function(node) {
  var top = node.data('auxunitlayouts').top;
  var bottom = node.data('auxunitlayouts').bottom;
  var resultLocation = "top";
  // start by adding on top if free
  if(!top || AuxUnitLayout.isEmpty(top)) {
    resultLocation = "top";
  }
  else if(!bottom || AuxUnitLayout.isEmpty(bottom)) {
    resultLocation = "bottom";
  }
  else {
    // choose the side (top or bottom) that has the most space available to the right of the rightmost infobox
    if(AuxUnitLayout.unitLength(top) <= AuxUnitLayout.unitLength(bottom)) {
      resultLocation = "top";
    }
    else {
      resultLocation = "bottom";
    }
  }
  AuxUnitLayout.lastPos = resultLocation; //Set last used position
  return resultLocation;
};

AuxUnitLayout.resizeParent = function (mainObj, cy, length) {
  var parentNode = AuxUnitLayout.getParentNode(mainObj, cy);
  if(AuxUnitLayout.isTorB(mainObj)) {
    if(parentNode.data('bbox').w < length) {
      cy.trigger("nodeediting.resizestart", ["centerright", parentNode]);
      parentNode.data('bbox').w = length;
      cy.trigger("nodeediting.resizeend", ["centerright", parentNode]);
    }
  }
  else {
    if(parentNode.data('bbox').h < length) {
      cy.trigger("nodeediting.resizestart", ["bottomcenter", parentNode]);
      parentNode.data('bbox').h = length;
      cy.trigger("nodeediting.resizeend", ["bottomcenter", parentNode]);
    }
  }
};

AuxUnitLayout.isTorB = function (mainObj) {
  return mainObj.location == "top" || mainObj.location == "bottom";
};

AuxUnitLayout.isLorR = function (mainObj) {
  return mainObj.location == "left" || mainObj.location == "right";
};

AuxUnitLayout.setParentMinLength = function (mainObj, cy) {
  var parentNode = AuxUnitLayout.getParentNode(mainObj, cy);
  var parentLayouts = parentNode.data('auxunitlayouts');
  switch(mainObj.location) {
    case "top":
      var compareVal = parentLayouts.bottom ? parentLayouts.bottom.lengthUsed : 0;
      break;
    case "bottom":
      var compareVal = parentLayouts.top ? parentLayouts.top.lengthUsed : 0;
      break;
    case "left":
      var compareVal = parentLayouts.right ? parentLayouts.right.lengthUsed : 0;
      break;
    case "right":
      var compareVal = parentLayouts.left ? parentLayouts.left.lengthUsed : 0;
      break;
  }
  if(AuxUnitLayout.isTorB(mainObj)) {
    parentNode.data('resizeMinWidth', Math.max(mainObj.lengthUsed, compareVal));
  }
  else {
    parentNode.data('resizeMinHeight', Math.max(mainObj.lengthUsed, compareVal));
  }
};

AuxUnitLayout.getOuterMargin = function (mainObj) {
  if(typeof mainObj.outerMargin !== "undefined" && mainObj.outerMargin !== null) {
    return mainObj.outerMargin;
  }
  else {
    return AuxUnitLayout.outerMargin;
  }
};

AuxUnitLayout.getUnitGap = function (mainObj) {
  if(typeof mainObj.unitGap !== "undefined" && mainObj.unitGap !== null) {
    return mainObj.unitGap;
  }
  else {
    return AuxUnitLayout.unitGap;
  }
};

AuxUnitLayout.getAlwaysShowAuxUnits = function (mainObj) {
  if(typeof mainObj.alwaysShowAuxUnits !== "undefined" && mainObj.alwaysShowAuxUnits !== null) {
    return mainObj.alwaysShowAuxUnits;
  }
  else {
    return AuxUnitLayout.alwaysShowAuxUnits;
  }
};

AuxUnitLayout.getMaxUnitDisplayed = function (mainObj) {
  if(typeof mainObj.maxUnitDisplayed !== "undefined" && mainObj.maxUnitDisplayed !== null) {
    return mainObj.maxUnitDisplayed;
  }
  else {
    return AuxUnitLayout.maxUnitDisplayed;
  }
};

/*
 *  Duplicate a layout. Doesn't copy the units attribute, reset it instead.
 */
AuxUnitLayout.copy = function(mainObj, cy, newParent) {
  var newLayout = AuxUnitLayout.construct(newParent);
  // Copying the same reference to units would be inconsistent.
  // Duplicating owned units goes beyonnd the scope, because we need to assign
  // ids that are tied to the global cound of units of a node.
  // So duplicating units is something that should be properly done outside of this function.
  // TODO that is a bit dirty, find a nice modular way to arrange that
  newLayout.units = [];
  newLayout.location = mainObj.location;
  newLayout.alignment = mainObj.alignment;
  AuxUnitLayout.setParentNodeRef(newLayout, newParent);
  newLayout.renderLengthCache = mainObj.renderLengthCache;
  newLayout.lengthUsed = mainObj.lengthUsed;
  if(typeof mainObj.outerMargin !== "undefined") {
    newLayout.outerMargin = mainObj.outerMargin;
  }
  if(typeof mainObj.unitGap !== "undefined") {
    newLayout.unitGap = mainObj.unitGap;
  }
  if(typeof mainObj.alwaysShowAuxUnits !== "undefined") {
    newLayout.alwaysShowAuxUnits = mainObj.alwaysShowAuxUnits;
  }
  if(typeof mainObj.maxUnitDisplayed !== "undefined") {
    newLayout.maxUnitDisplayed = mainObj.maxUnitDisplayed;
  }
  return newLayout;
};

ns.AuxUnitLayout = AuxUnitLayout;
// -------------- END AuxUnitLayout -------------- //

module.exports = ns;
