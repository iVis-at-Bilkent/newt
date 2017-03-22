var jquery = $ = require('jquery');
var lo_get = require('lodash.get');
var lo_set = require('lodash.set');
var appUtilities = require('./app-utilities');

var appUndoActions = {};

appUndoActions.changeDataDirty = function (param) {
  var result = {};
  var eles = param.eles; // a pure array of nodes, not a cy collection
  result.name = param.name;
  result.valueMap = {};
  result.eles = eles;

  for (var i = 0; i < eles.length; i++) {
    var ele = eles[i];
    result.valueMap[ele.id()] = ele._private.data[param.name];
  }

  //elementUtilities.changeData(param.eles, param.name, param.valueMap);
  if ( typeof param.valueMap === 'object' ) {
    cy.startBatch();
    for (var i = 0; i < eles.length; i++) {
      var ele = eles[i];
      ele._private.data[param.name] = param.valueMap[ele.id()];
    }
    cy.endBatch();
  }
  else {
    eles._private.data[param.name] = param.valueMap;
  }

  return result;
};

/* changes a value in the interface menu
 * we have 3 menus: GeneralProperties, LayoutProperties, GridProperties (see related backboneView)
 * we take as argument:
 * - property: can be one of currentLayoutProperties, currentGridProperties, currentGeneralProperties
 * - id: the id of the input to change
 * - type: the type of input, may include: text, checkbox, radio, select
 * - value
 * in case of checkbox or radio, value is true or false
 *
 * IMPORTANT:
 * value must be the same for the interface menu input and the property stored in the code 
 */
appUndoActions.changeMenu = function (param) {
  var id = param.id;
  var jQId = '#'+id;
  var type = param.type;
  var currentValue = lo_get(appUtilities, param.property);

  var result = {
    id: id,
    type: type,
    value: currentValue,
    property: param.property
  };

  if(type == "checkbox" || type == "radio"){
    $(jQId).prop('checked', param.value);
  }
  else {
    $(jQId).val(param.value);
  }
  lo_set(appUtilities, param.property, param.value);

  return result;
}




module.exports = appUndoActions;