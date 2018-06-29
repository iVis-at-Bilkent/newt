var jquery = $ = require('jquery');
var lo_get = require('lodash.get');
var lo_set = require('lodash.set');
var appUtilities = require('./app-utilities');

module.exports = function (cy) {
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
   * - update (optional): a function to apply after changing properties to update graph
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

    // need to get and set properties on scratchpad of cy
    var scratchpad = appUtilities.getScratch(cy);

    var currentValue = lo_get(scratchpad, param.property);

    var result = {
      id: id,
      type: type,
      value: currentValue,
      property: param.property,
      update: param.update
    };

    if(type == "checkbox" || type == "radio"){
      $(jQId).prop('checked', param.value);
    }
    else {
      $(jQId).val(param.value);
    }
    lo_set(scratchpad, param.property, param.value);

    if (param.update){
      param.update.call();
    };
    return result;
  }

  appUndoActions.refreshColorSchemeMenu = function (param) {

    // get 'currentGeneralProperties' for cy
    var currentGeneralProperties = appUtilities.getScratch(cy, 'currentGeneralProperties');

    var result = {
      value: currentGeneralProperties.mapColorScheme,
      self: param.self
    };

    if (param.self){
      var inverted_id = param.self.schemes[param.value].invert;
      param.self.schemes[param.value].isDisplayed = true;

      if (inverted_id)
        param.self.schemes[inverted_id].isDisplayed = false;

      param.self.render();
    } else {
      document.getElementById("map-color-scheme_preview_" + result.value).style.border = "1px solid";
    };

    document.getElementById("map-color-scheme_preview_" + param.value).style.border = "3px solid";
    currentGeneralProperties.mapColorScheme = param.value;

    // update 'currentGeneralProperties' in scratchpad
    appUtilities.setScratch(cy, 'currentGeneralProperties', currentGeneralProperties);

    return result;
  }

  //For each unit, save the positions and sides of respective elements
  appUndoActions.relocateInfoBoxes = function(param) {
    var node = param.node;
    var color = param.color;
    var data = param.data;
    var tempColor = node.data("border-color");
    var tempData = [];

    var index = 0;
    node.data('statesandinfos').forEach( function(ele) {
      tempData.push({
        x: ele.bbox.x,
        y: ele.bbox.y,
        anchorSide: ele.anchorSide,
      });
      if (data !== undefined) {
        ele.bbox.x = data[index].x;
        ele.bbox.y = data[index].y
        var anchorSide = ele.anchorSide;
        ele.anchorSide = data[index].anchorSide;
        appUtilities.modifyUnits(node, ele, anchorSide);
        index++;
      }
    });

    if (data === undefined) {
      appUtilities.enableInfoBoxRelocation(node);
    }
    else {
      appUtilities.disableInfoBoxRelocation(color);
    }

    var result = {
      node: node,
      color: tempColor,
      data: tempData
    };

    return result;
  }

  return appUndoActions;
};
