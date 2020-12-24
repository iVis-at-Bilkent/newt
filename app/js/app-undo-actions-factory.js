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
  appUndoActions.expOnLoad= function(param){
    appUndoActions.changeMenu(param.params.experimentDescription);
    return param;
  }

  appUndoActions.expFileDel = function(param){
    var cy = appUtilities.getActiveCy();
    var chiseInstance = appUtilities.getActiveChiseInstance();
    var fileName =param.fileName;
    var params = {fileName};
    var neededparams = chiseInstance.undoRedoActionFunctions.removeFile(params);
    neededparams.self = param.self;
    neededparams.document= param.document;
    var fileNames = chiseInstance.getGroupedDataMap();
    param.self.params.experimentDescription.value =  fileNames;
    appUndoActions.changeMenu(param.self.params.experimentDescription);
    param.self.render();
    
    return neededparams;
  }

  appUndoActions.expFileUndoDel = function(param){
    var cy = appUtilities.getActiveCy();
    var chiseInstance = appUtilities.getActiveChiseInstance();
    var neededparams = chiseInstance.undoRedoActionFunctions.addFile(param);
    neededparams.self = param.self;
    neededparams.document= param.document;
    var fileNames = chiseInstance.getGroupedDataMap();
    param.self.params.experimentDescription.value =  fileNames;
    appUndoActions.changeMenu(param.self.params.experimentDescription);
    param.self.render();

    return neededparams;
  }

  appUndoActions.updateExperimentPanel = function(param){
    var cy = appUtilities.getActiveCy();
    var chiseInstance = appUtilities.getActiveChiseInstance();
    var fileName =param.fileName;
    var expName = param.expName;
    var params = {fileName, expName};
    var neededparams = chiseInstance.undoRedoActionFunctions.removeExp(params);
    neededparams.self = param.self;
    neededparams.document= param.document;
    var fileNames = chiseInstance.getGroupedDataMap();
    param.self.params.experimentDescription.value =  fileNames;
    param.self.render();

    return neededparams;
  }

  appUndoActions.updateExperimentPanel2 = function(param){
    var cy = appUtilities.getActiveCy();
    var chiseInstance = appUtilities.getActiveChiseInstance();
    chiseInstance.undoRedoActionFunctions.addExp(param);
    var fileNames = chiseInstance.getGroupedDataMap();
    param.self.params.experimentDescription.value =  fileNames;
    param.self.render();

    return param;
  }
  appUndoActions.hideExperimentPanel = function(param){
    var cy = appUtilities.getActiveCy();
    evt = param.evt;
    var chiseInstance = appUtilities.getActiveChiseInstance();
    chiseInstance.undoRedoActionFunctions.hideExp(param);
    if(evt.target.value === "true" || evt.target.value == true){
      evt.target.style.backgroundColor = "#777";
      evt.target.value = "false";
    }
    else{
      evt.target.value = "true";
      evt.target.style.backgroundColor = "";
    }
    param.self.render();

    return param;
  }

  appUndoActions.unhideExperimentPanel = function(param){
    var cy = appUtilities.getActiveCy();
    evt = param.evt;
    var chiseInstance = appUtilities.getActiveChiseInstance();
    chiseInstance.undoRedoActionFunctions.unhideExp(param);
    if(evt.target.value === "true" || evt.target.value == true){
      evt.target.style.backgroundColor = "#777";
      evt.target.value = "false";
    }
    else{
      evt.target.value = "true";
      evt.target.style.backgroundColor = "";
    }
    param.self.render();

    return param;
  }

  appUndoActions.updateRemoveAll = function(param){
    var cy = appUtilities.getActiveCy();
    var chiseInstance = appUtilities.getActiveChiseInstance();
    var resparams = chiseInstance.undoRedoActionFunctions.removeAll(param);
    resparams.self = param.self;
    var fileNames = chiseInstance.getGroupedDataMap();
    param.self.params.experimentDescription.value =  fileNames;
    appUndoActions.changeMenu(param.self.params.experimentDescription);
    param.self.render();

    return resparams;
  }

  appUndoActions.updateRestore = function(param){
    var cy = appUtilities.getActiveCy();
    var chiseInstance = appUtilities.getActiveChiseInstance();
    chiseInstance.undoRedoActionFunctions.restoreAll(param);
    var fileNames = chiseInstance.getGroupedDataMap();
    param.self.params.experimentDescription.value =  fileNames;
    appUndoActions.changeMenu(param.self.params.experimentDescription);
    param.self.render();

    return param;
  }

  appUndoActions.hideAllUI = function(param){
    var cy = appUtilities.getActiveCy();
    var chiseInstance = appUtilities.getActiveChiseInstance();
    var params = chiseInstance.undoRedoActionFunctions.hideAll();
    var fileNames = chiseInstance.getGroupedDataMap();
    param.self.params.experimentDescription.value =  fileNames;
    params.self = param.self
    param.self.render();

    return params;
  }
  appUndoActions.hideAllUIUndo = function(param){
    var cy = appUtilities.getActiveCy();
    var chiseInstance = appUtilities.getActiveChiseInstance();
    chiseInstance.undoRedoActionFunctions.hideAllUndo(param);
    var fileNames = chiseInstance.getGroupedDataMap();
    param.self.params.experimentDescription.value =  fileNames;
    jQId = '#' + param.self.params.experimentDescription.id;
    $(jQId).val(param.self.params.experimentDescription.value);
    var params = {};
    params.self = param.self;
    param.self.render();

    return params;
  }
  appUndoActions.unhideAllUIUndo = function(param){
    var cy = appUtilities.getActiveCy();
    var chiseInstance = appUtilities.getActiveChiseInstance();
    chiseInstance.undoRedoActionFunctions.unhideAllUndo(param);
    var params = {};
    params.self = param.self;
    var fileNames = chiseInstance.getGroupedDataMap();
    param.self.params.experimentDescription.value =  fileNames;
    param.self.render();

    return params;
  }
  appUndoActions.unhideAllUI = function(param){
    var cy = appUtilities.getActiveCy();
    var chiseInstance = appUtilities.getActiveChiseInstance();
    var params = chiseInstance.undoRedoActionFunctions.unhideAll();
    var fileNames = chiseInstance.getGroupedDataMap();
    param.self.params.experimentDescription.value =  fileNames;
    params.self = param.self;
    param.self.render();

    return params;
  }
  
  appUndoActions.hideFileUI = function(param){
    var cy = appUtilities.getActiveCy();
    var chiseInstance = appUtilities.getActiveChiseInstance();
    var params = chiseInstance.undoRedoActionFunctions.hideFile(param);
    var fileNames = chiseInstance.getGroupedDataMap();
    param.self.params.experimentDescription.value =  fileNames;
    params.self = param.self;
    param.self.render();

    return params;
  }

  appUndoActions.hideFileUIredo = function(param){
    var cy = appUtilities.getActiveCy();
    var chiseInstance = appUtilities.getActiveChiseInstance();
    var params = chiseInstance.undoRedoActionFunctions.hideFileUndo(param);
    var fileNames = chiseInstance.getGroupedDataMap();
    param.self.params.experimentDescription.value =  fileNames;
    params.self = param.self;
    param.self.render();

    return params;
  }

  appUndoActions.unhideFileUIredo = function(param){
    var cy = appUtilities.getActiveCy();
    var chiseInstance = appUtilities.getActiveChiseInstance();
    var params = chiseInstance.undoRedoActionFunctions.unhideFileUndo(param);
    params.self = param.self;
    var fileNames = chiseInstance.getGroupedDataMap();
    param.self.params.experimentDescription.value =  fileNames;
    param.self.render();

    return params;
  }

  appUndoActions.unhideFileUI = function(param){
    var cy = appUtilities.getActiveCy();
    var chiseInstance = appUtilities.getActiveChiseInstance();
    var params = chiseInstance.undoRedoActionFunctions.unhideFile(param);
    var fileNames = chiseInstance.getGroupedDataMap();
    param.self.params.experimentDescription.value =  fileNames;
    params.self = param.self;
    param.self.render();

    return params;
  }

  appUndoActions.loadExperimentData = function (param){
    var cy = appUtilities.getActiveCy();
    var chiseInstance = appUtilities.getActiveChiseInstance();
    var result = chiseInstance.parseData(param.data, param.fileName, param.errorCallback, param.sampleExperiment);
    if(result != "Error"){
      appUndoActions.changeMenu(param.self.params.experimentDescription);
    }
    
    param.self.render();

    return param;
  }

  appUndoActions.loadMore = function (param){
    var cy = appUtilities.getActiveCy();
    var chiseInstance = appUtilities.getActiveChiseInstance();
    var result = chiseInstance.parseData(param.data, param.fileName, param.errorCallback);
    if(result != "Error"){
      appUndoActions.changeMenu(param.self.params.experimentDescription);
    }
   
    param.self.render();

    return param;
  }

  appUndoActions.loadMoreUndo = function(param){
    var cy = appUtilities.getActiveCy();
    var chiseInstance = appUtilities.getActiveChiseInstance();
    var fileName =param.fileName;
    var params = {fileName};
    var neededparams = chiseInstance.undoRedoActionFunctions.removeFile(params)
    var fileNames = chiseInstance.getGroupedDataMap();
    param.self.params.experimentDescription.value =  fileNames;
    appUndoActions.changeMenu(param.self.params.experimentDescription);
    param.self.render();

    return param;
  }
 
  appUndoActions.undoLoadExperiment = function (param){
    var cy = appUtilities.getActiveCy();
    var chiseInstance = appUtilities.getActiveChiseInstance();
    var fileName =param.fileName;
    var params = {fileName};
    var neededparams = chiseInstance.undoRedoActionFunctions.removeAll(params);
    var fileNames = chiseInstance.getGroupedDataMap();
    param.self.params.experimentDescription.value =  fileNames;
    appUndoActions.changeMenu(param.self.params.experimentDescription);
    param.self.render();
    
    return param;
  }

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

    if(id == "compound-padding"){
      var chise = appUtilities.getActiveChiseInstance();
      chise.setCompoundPadding(param.value);
    }
    if (param.update){
      param.update.call();

    };
   
   if (id == "highlight-color" || id == "highlight-thickness") {
    var viewUtilities = cy.viewUtilities('get');
    var highlightColor = $('#highlight-color').val();
    var extraHighlightThickness = Number($('#highlight-thickness').val());

    viewUtilities.changeHighlightStyle(0, {
      'border-width' : function (ele) { 
        return Math.max(parseFloat(ele.data('border-width')) + extraHighlightThickness, 3); 
      }, 'border-color': highlightColor
    }, {
      'width': function (ele) { return Math.max(parseFloat(ele.data('width')) + extraHighlightThickness, 3); },
      'line-color': highlightColor,
      'color': highlightColor,
      'text-border-color': highlightColor,
      'source-arrow-color': highlightColor,
      'target-arrow-color': highlightColor
    });
   }

    return result;
  }

  appUndoActions.refreshColorSchemeMenu = function (param) {

    // get 'currentGeneralProperties' for cy
    var currentGeneralProperties = appUtilities.getScratch(cy, 'currentGeneralProperties');

    // return the old values of map color scheme and map color scheme style to undo
    var result = {
      value: currentGeneralProperties.mapColorScheme,
      self: param.self,
      scheme_type: currentGeneralProperties.mapColorSchemeStyle
    };

    if(param.scheme_type == '3D'){
        var inverted_id = param.self.schemes_3D[param.value].invert;
        param.self.schemes_3D[param.value].isDisplayed = true;
        if (inverted_id){
          param.self.schemes_3D[inverted_id].isDisplayed = false;
        }
        $("#color-scheme-inspector-style-select").val(param.scheme_type);
        param.self.changeStyle(param.scheme_type);
        // update 'currentGeneralProperties' in scratchpad before rendering the color scheme view
        currentGeneralProperties.mapColorScheme = param.value;
        currentGeneralProperties.mapColorSchemeStyle = param.scheme_type;
        appUtilities.setScratch(cy, 'currentGeneralProperties', currentGeneralProperties);
        param.self.render();
    }

    else if(param.scheme_type == 'gradient'){
        var inverted_id = param.self.schemes_gradient[param.value].invert;
        param.self.schemes_gradient[param.value].isDisplayed = true;
        if (inverted_id){
          param.self.schemes_gradient[inverted_id].isDisplayed = false;
        }
        $("#color-scheme-inspector-style-select").val(param.scheme_type);
        param.self.changeStyle(param.scheme_type);
        // update 'currentGeneralProperties' in scratchpad before rendering the color scheme view
        currentGeneralProperties.mapColorScheme = param.value;
        currentGeneralProperties.mapColorSchemeStyle = param.scheme_type;
        appUtilities.setScratch(cy, 'currentGeneralProperties', currentGeneralProperties);
        param.self.render();
    }
    else{
        var inverted_id = param.self.schemes[param.value].invert;
        param.self.schemes[param.value].isDisplayed = true;
        if (inverted_id){
          param.self.schemes[inverted_id].isDisplayed = false;
        }
        $("#color-scheme-inspector-style-select").val(param.scheme_type);
        param.self.changeStyle(param.scheme_type);
        // update 'currentGeneralProperties' in scratchpad before rendering the color scheme view
        currentGeneralProperties.mapColorScheme = param.value;
        currentGeneralProperties.mapColorSchemeStyle = param.scheme_type;
        appUtilities.setScratch(cy, 'currentGeneralProperties', currentGeneralProperties);
        param.self.render();
    }
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
