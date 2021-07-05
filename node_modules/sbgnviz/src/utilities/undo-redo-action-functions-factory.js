/*
 * This file exports the functions to be utilized in undoredo extension actions
 */

module.exports = function () {

  var elementUtilities;
  var experimentalDataOverlay;
  var mainUtilities;
  var cy;

  function undoRedoActionFunctions (param) {
    elementUtilities = param.elementUtilities;
    experimentalDataOverlay = param.experimentalDataOverlay;
    mainUtilities = param.mainUtilities;
    cy = param.sbgnCyInstance.getCy();
  }

  undoRedoActionFunctions.deleteElesSimple = function (param) {
    return elementUtilities.deleteElesSimple(param.eles);
  };

  undoRedoActionFunctions.restoreEles = function (eles) {
    var param = {};
    param.eles = elementUtilities.restoreEles(eles);
    return param;
  };

  undoRedoActionFunctions.deleteNodesSmart = function (param) {
    if (param.firstTime) {
      return elementUtilities.deleteNodesSmart(param.eles);
    }
    return elementUtilities.deleteElesSimple(param.eles);
  };

  undoRedoActionFunctions.setPortsOrdering = function(param) {
    var nodes = param.nodes;
    var ordering = param.ordering;
    var portDistance = param.portDistance;
    var connectedEdges = nodes.connectedEdges();
    var nodePropMap = {}; // Node prop map for current status of the nodes it is to be attached to the result map. It includes node current port ordering and current ports.
    var edgePropMap = {}; // Edge prop map for current status of the nodes it is to be attached to the result map. It includes edge portsource and porttarget.

    // Fill node/edge prop maps for undo/redo actions

    // Node prop map includes a copy of node ports
    for ( var i = 0; i < nodes.length; i++ ) {
      var node = nodes[i];
      var ports = node.data('ports');
      var currentOrdering = elementUtilities.getPortsOrdering(node); // Get the current node ports ordering
      var portsCopy = ports.length === 2 ? [ { id: ports[0].id, x: ports[0].x, y: ports[0].y }, { id: ports[1].id, x: ports[1].x, y: ports[1].y } ] : [];
      nodePropMap[node.id()] = { ordering: currentOrdering, ports: portsCopy };
    }

    // Node prop map includes edge portsource and porttarget
    for ( var i = 0; i < connectedEdges.length; i++ ) {
      var edge = connectedEdges[i];
      edgePropMap[edge.id()] = { portsource: edge.data('portsource'), porttarget: edge.data('porttarget') };
    }

    var result = {
      nodes: nodes,
      nodePropMap: nodePropMap,
      edgePropMap: edgePropMap
    };

    // If this is the first time call related method from element utilities else go back to the stored props of nodes/edges
    if ( param.firstTime ) {
      elementUtilities.setPortsOrdering(nodes, ordering, portDistance);
    }
    else {
      cy.startBatch();

      // Go back to stored node ports state
      for ( var i = 0; i < nodes.length; i++ ) {
        var node = nodes[i];
        var portsToReturn = param.nodePropMap[node.id()].ports;
        var orderingsToReturn = param.nodePropMap[node.id()].ordering;
        node.data('ports', portsToReturn);
        node.data('portsordering', orderingsToReturn); // Update the cached ports ordering
      }

      // Go back to stored edge portsource/porttargets state
      for ( var i = 0; i < connectedEdges.length; i++ ) {
        var edge = connectedEdges[i];
        var props = param.edgePropMap[edge.id()];
        edge.data('portsource', props.portsource);
        edge.data('porttarget', props.porttarget);
      }

      cy.endBatch();
    }

    return result;
  };

  undoRedoActionFunctions.hideExp = function(param){
    var expName = param.expName;
    var fileName = param.fileName;
    return experimentalDataOverlay.hideExp(fileName, expName);
  }

  undoRedoActionFunctions.unhideExp = function(param){
    var expName = param.expName;
    var fileName = param.fileName;
    return experimentalDataOverlay.unhideExp(fileName, expName);
  }

  undoRedoActionFunctions.hideAll = function(){
    return experimentalDataOverlay.hideAll();
  }

  undoRedoActionFunctions.hideAllUndo = function(param){
    var invisibleFile = param.invisibleFile;
    var invisibleExp = param.invisibleExp;
    return experimentalDataOverlay.hideAllUndo(invisibleFile, invisibleExp);
  }

  undoRedoActionFunctions.unhideAll = function(){
    return experimentalDataOverlay.unhideAll();
  }

  undoRedoActionFunctions.unhideAllUndo = function(param){
    var visibleFile = param.visibleFile;
    var visibleExp = param.visibleExp;
    return experimentalDataOverlay.unhideFileUndo(visibleFile, visibleExp);
  }

  undoRedoActionFunctions.hideFile = function(param){
    var fileName = param.fileName;
    return experimentalDataOverlay.hideFile(fileName);
  }

  undoRedoActionFunctions.hideFileUndo = function(param){
    var fileName = param.fileName;
    var invisible = param.invisible;
    return experimentalDataOverlay.hideFileUndo(fileName, invisible);
  }

  undoRedoActionFunctions.unhideFile = function(param){
    var fileName = param.fileName;
    return experimentalDataOverlay.unhideFile(fileName);
  }

  undoRedoActionFunctions.unhideFileUndo = function(param){
    var fileName = param.fileName;
    var visible = param.visible;
    return experimentalDataOverlay.unhideFileUndo(fileName, visible);
  }

  undoRedoActionFunctions.addExp = function(param){
    var fileName = param.fileName;
    var expName = param.expName;
    var isVisible = param.isVisible;
    var values = param.values;
    var groupArray = param.groupArray;
    return experimentalDataOverlay.addExp(fileName, expName, isVisible, values, groupArray);
  }

  undoRedoActionFunctions.removeExp = function(param){
    var fileName = param.fileName;
    var expName = param.expName;
    return experimentalDataOverlay.removeExp(fileName, expName);
  }

  undoRedoActionFunctions.addFile = function(param){
    var fileName = param.fileName;
    var parsed = param.parsed;
    var grouped = param.grouped;
    var visible = param.visible;
    var visiblef = param.visiblef;
    return experimentalDataOverlay.addFile(fileName,parsed,visible,grouped, visiblef);
  }

  undoRedoActionFunctions.removeFile = function(param){
    var fileName = param.fileName;
    return experimentalDataOverlay.removeFile(fileName);
  }

  undoRedoActionFunctions.removeAll = function(param){
    return experimentalDataOverlay.removeAll();
  }

  undoRedoActionFunctions.restoreAll = function(param){
    var parsed = param.parsed;
    var grouped = param.grouped;
    var visible = param.visible;
    var visiblef = param.visiblef;
    return experimentalDataOverlay.restoreAll(parsed,visible,grouped,visiblef)
  }
  
  undoRedoActionFunctions.setCompoundPadding = function(newPadding) {
    var result = mainUtilities.getCompoundPadding();   
    mainUtilities.setCompoundPadding(newPadding);   
    
    return result;
  }; 

  return undoRedoActionFunctions;
};
