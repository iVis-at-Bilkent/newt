/*
 * These are the main utilities to be directly utilized by the user interactions.
 * Idealy, this file is just required by index.js
 */

var libUtilities = require('./lib-utilities');
var libs = libUtilities.getLibs();
var jQuery = $ = libs.jQuery;

module.exports = function () {
  var elementUtilities, jsonToSbgnml, sbgnmlToJson, tdToJson, nwtToJson,
      sifToJson, optionUtilities, graphUtilities, layoutLoader, jsonToNwt;
  var cy, options;

  function mainUtilities (param) {
    elementUtilities = param.elementUtilities;
    jsonToSbgnml = param.jsonToSbgnmlConverter;
    jsonToNwt = param.jsonToNwtConverter;
    sbgnmlToJson = param.sbgnmlToJsonConverter;
    nwtToJson = param.nwtToJsonConverter;
    tdToJson = param.tdToJsonConverter;
    sifToJson = param.sifToJsonConverter;
    optionUtilities = param.optionUtilities;
    graphUtilities = param.graphUtilities;
    cy = param.sbgnCyInstance.getCy();
    layoutLoader = param.layoutLoader;
    layoutToText = param.layoutToText;

    options = optionUtilities.getOptions();
  }

  mainUtilities.beforePerformLayout = function() {
    var parents = cy.nodes(':parent');
    var edges = cy.edges();

    cy.startBatch();

    // graphUtilities.disablePorts();

    // TODO do this by using extension API
    // removes all bendpoints for all edges in cytoscape instance
    for(var i = 0; i < edges.length; i++){
      var edge = edges[i];
      edge.removeClass('edgebendediting-hasbendpoints');
      edge.removeClass('edgecontrolediting-hascontrolpoints');
      edge.removeClass('edgebendediting-hasmultiplebendpoints');
      edge.removeClass('edgecontrolediting-hasmultiplecontrolpoints');
      edge.data('cyedgebendeditingDistances', []);
      edge.data('cyedgebendeditingWeights', []);
      edge.data('cyedgecontroleditingDistances', []);	
      edge.data('cyedgecontroleditingWeights', []);
    }

    parents.removeData('minWidth');
    parents.removeData('minHeight');
    parents.removeData('minWidthBiasLeft');
    parents.removeData('minWidthBiasRight');
    parents.removeData('minHeightBiasTop');
    parents.removeData('minHeightBiasBottom');

    cy.endBatch();
    
    if(parents.length > 0)
      cy.style().update();
  };

  // Expand given nodes. Requires expandCollapse extension and considers undoable option.
  mainUtilities.expandNodes = function(nodes) {
    if ( elementUtilities.isGraphTopologyLocked() ) {
      return;
    }

    // Get expandCollapse api
    var expandCollapse = cy.expandCollapse('get');

    var nodesToExpand = expandCollapse.expandableNodes(nodes);
    if (nodesToExpand.length == 0) {
      return;
    }
    if(options.undoable) {
      cy.undoRedo().do("expand", {
        nodes: nodesToExpand,
      });
    }
    else {
      expandCollapse.expand(nodes);
    }
  };

  // Collapse given nodes. Requires expandCollapse extension and considers undoable option.
  mainUtilities.collapseNodes = function(nodes) {
    if ( elementUtilities.isGraphTopologyLocked() ) {
      return;
    }

    // Get expandCollapse api
    var expandCollapse = cy.expandCollapse('get');

    if (expandCollapse.collapsibleNodes(nodes).length == 0) {
      return;
    }

    if(options.undoable) {
      cy.undoRedo().do("collapse", {
        nodes: nodes
      });
    }
    else {
      expandCollapse.collapse(nodes);
    }
  };

  // Collapse all complexes recursively. Requires expandCollapse extension and considers undoable option.
  mainUtilities.collapseComplexes = function() {
    if ( elementUtilities.isGraphTopologyLocked() ) {
      return;
    }

    // Get expandCollapse api
    var expandCollapse = cy.expandCollapse('get');

    var complexes = cy.nodes("[class^='complex']");
    if (expandCollapse.collapsibleNodes(complexes).length == 0) {
      return;
    }

    if (options.undoable) {
      cy.undoRedo().do("collapseRecursively", {
        nodes: complexes
      });
    }
    else {
      expandCollapse.collapseRecursively(complexes);
    }
  };

  // Expand all complexes recursively. Requires expandCollapse extension and considers undoable option.
  mainUtilities.expandComplexes = function() {
    if ( elementUtilities.isGraphTopologyLocked() ) {
      return;
    }

    // Get expandCollapse api
    var expandCollapse = cy.expandCollapse('get');

    var nodes = expandCollapse.expandableNodes(cy.nodes().filter("[class^='complex']"));
    if (nodes.length == 0) {
      return;
    }

    if (options.undoable) {
      cy.undoRedo().do("expandRecursively", {
        nodes: nodes
      });
    }
    else {
      expandCollapse.expandRecursively(nodes);
    }
  };

  // Collapse all nodes recursively. Requires expandCollapse extension and considers undoable option.
  mainUtilities.collapseAll = function() {
    if ( elementUtilities.isGraphTopologyLocked() ) {
      return;
    }

    // Get expandCollapse api
    var expandCollapse = cy.expandCollapse('get');

    var nodes = cy.nodes(':visible');
    if (expandCollapse.collapsibleNodes(nodes).length == 0) {
      return;
    }

    if (options.undoable) {
      cy.undoRedo().do("collapseRecursively", {
        nodes: nodes
      });
    }
    else {
      expandCollapse.collapseRecursively(nodes);
    }
  };

  // Expand all nodes recursively. Requires expandCollapse extension and considers undoable option.
  mainUtilities.expandAll = function() {
    if ( elementUtilities.isGraphTopologyLocked() ) {
      return;
    }

    // Get expandCollapse api
    var expandCollapse = cy.expandCollapse('get');

    var nodes = expandCollapse.expandableNodes(cy.nodes(':visible'));
    if (nodes.length == 0) {
      return;
    }

    if (options.undoable) {
      cy.undoRedo().do("expandRecursively", {
        nodes: nodes
      });
    }
    else {
      expandCollapse.expandRecursively(nodes);
    }
  };

  // Increase border width to show nodes with hidden neighbors
  mainUtilities.thickenBorder = function(eles){
    eles.forEach(function( ele ){
      var defaultBorderWidth = Number(ele.data("border-width"));
      ele.data("border-width", defaultBorderWidth + 2);
    });
    eles.data("thickBorder", true);
    return eles;
  }
  // Decrease border width when hidden neighbors of the nodes become visible
  mainUtilities.thinBorder = function(eles){
    eles.forEach(function( ele ){
      var defaultBorderWidth = Number(ele.data("border-width"));
      ele.data("border-width", defaultBorderWidth - 2);
    });
    eles.removeData("thickBorder");
    return eles;
  }

  mainUtilities.hideElesSimple = function(eles) {
    var viewUtilities = cy.viewUtilities('get');

    if (eles.length === 0) {
      return;
    }

    if(options.undoable) {

      var ur = cy.undoRedo();
      ur.action("thickenBorder", mainUtilities.thickenBorder, mainUtilities.thinBorder);
      ur.action("thinBorder", mainUtilities.thinBorder, mainUtilities.thickenBorder);

      // Batching
      var actions = [];
      var nodesWithHiddenNeighbor = cy.edges(":hidden").connectedNodes().intersection(eles);
      actions.push({name: "thinBorder", param: nodesWithHiddenNeighbor});
      actions.push({name: "hide", param: eles});
      nodesWithHiddenNeighbor = eles.neighborhood(":visible")
              .nodes().difference(eles).difference(cy.nodes("[thickBorder]"));
      actions.push({name: "thickenBorder", param: nodesWithHiddenNeighbor});
      cy.undoRedo().do("batch", actions);
    }
    else {
      var nodesWithHiddenNeighbor = cy.edges(":hidden").connectedNodes(':visible');
      mainUtilities.thinBorder(nodesWithHiddenNeighbor);
      viewUtilities.hide(eles);
      var nodesWithHiddenNeighbor = cy.edges(":hidden").connectedNodes(':visible');
      mainUtilities.thickenBorder(nodesWithHiddenNeighbor);
    }
  }

  // Extends the given nodes list in a smart way to leave the map intact and hides the resulting list.
  // Requires viewUtilities extension and considers 'undoable' option.
  mainUtilities.hideNodesSmart = function(_nodes) {
    // If this function is being called we can assume that view utilities extension is on use
    var viewUtilities = cy.viewUtilities('get');
    var nodes = _nodes.nodes(); // Ensure that nodes list just include nodes

    var allNodes = cy.nodes(":visible");
    var nodesToShow = elementUtilities.extendRemainingNodes(nodes, allNodes);
    var nodesToHide = allNodes.not(nodesToShow);

    if (nodesToHide.length === 0) {
      return;
    }

    if(options.undoable) {

      var ur = cy.undoRedo();
      ur.action("thickenBorder", mainUtilities.thickenBorder, mainUtilities.thinBorder);
      ur.action("thinBorder", mainUtilities.thinBorder, mainUtilities.thickenBorder);

      // Batching
      var actions = [];
      var nodesWithHiddenNeighbor = cy.edges(":hidden").connectedNodes().intersection(nodesToHide);
      actions.push({name: "thinBorder", param: nodesWithHiddenNeighbor});
      actions.push({name: "hide", param: nodesToHide});
      nodesWithHiddenNeighbor = nodesToHide.neighborhood(":visible")
              .nodes().difference(nodesToHide).difference(cy.nodes("[thickBorder]"));
      actions.push({name: "thickenBorder", param: nodesWithHiddenNeighbor});
      cy.undoRedo().do("batch", actions);
    }
    else {
      var nodesWithHiddenNeighbor = cy.edges(":hidden").connectedNodes(':visible');
      mainUtilities.thinBorder(nodesWithHiddenNeighbor);
      viewUtilities.hide(nodesToHide);
      var nodesWithHiddenNeighbor = cy.edges(":hidden").connectedNodes(':visible');
      mainUtilities.thickenBorder(nodesWithHiddenNeighbor);
    }
  };

  // Extends the given nodes list in a smart way to leave the map intact.
  // Then unhides the resulting list and hides others. Requires viewUtilities extension and considers 'undoable' option.
  mainUtilities.showNodesSmart = function(_nodes) {
    // If this function is being called we can assume that view utilities extension is on use
    var viewUtilities = cy.viewUtilities('get');
    var nodes = _nodes.nodes(); // Ensure that nodes list just include nodes

    var allNodes = cy.elements();
    var nodesToShow = elementUtilities.extendNodeList(nodes);
    var nodesToHide = allNodes.not(nodesToShow);

    if (nodesToHide.length === 0) {
      return;
    }

    if(options.undoable) {
      var ur = cy.undoRedo();
      ur.action("thickenBorder", mainUtilities.thickenBorder, mainUtilities.thinBorder);
      ur.action("thinBorder", mainUtilities.thinBorder, mainUtilities.thickenBorder);

      // Batching
      var actions = [];
      var nodesWithHiddenNeighbor = cy.edges(":hidden").connectedNodes(':visible');
      actions.push({name: "thinBorder", param: nodesWithHiddenNeighbor});
      actions.push({name: "hide", param: nodesToHide});
      nodesWithHiddenNeighbor = nodesToHide.neighborhood(":visible")
              .nodes().difference(nodesToHide);
      actions.push({name: "thickenBorder", param: nodesWithHiddenNeighbor});
      cy.undoRedo().do("batch", actions);
    }
    else {
      var nodesWithHiddenNeighbor = cy.edges(":hidden").connectedNodes(':visible');
      mainUtilities.thinBorder(nodesWithHiddenNeighbor);
      viewUtilities.hide(nodesToHide);
      var nodesWithHiddenNeighbor = cy.edges(":hidden").connectedNodes(':visible');
      mainUtilities.thickenBorder(nodesWithHiddenNeighbor);
    }
  };

  // Unhides elements passed as arguments. Requires viewUtilities extension and considers 'undoable' option.
  mainUtilities.showEles = function(eles) {
      // If this function is being called we can assume that view utilities extension is on use
      var viewUtilities = cy.viewUtilities('get');
      var hiddenEles = eles.filter(':hidden');
      if (hiddenEles.length === 0) {
          return;
      }
      if(options.undoable) {
          var ur = cy.undoRedo();
          ur.action("thickenBorder", mainUtilities.thickenBorder, mainUtilities.thinBorder);
          ur.action("thinBorder", mainUtilities.thinBorder, mainUtilities.thickenBorder);

          // Batching
          var actions = [];
          var nodesToThinBorder = (hiddenEles.neighborhood(":visible").nodes("[thickBorder]"))
                                  .difference(cy.edges(":hidden").difference(hiddenEles.edges().union(hiddenEles.nodes().connectedEdges())).connectedNodes());
          actions.push({name: "thinBorder", param: nodesToThinBorder});
          actions.push({name: "show", param: hiddenEles});
          var nodesToThickenBorder = hiddenEles.nodes().edgesWith(cy.nodes(":hidden").difference(hiddenEles.nodes()))
  	            .connectedNodes().intersection(hiddenEles.nodes());
          actions.push({name: "thickenBorder", param: nodesToThickenBorder});
          cy.undoRedo().do("batch", actions);
      }
      else {
          var nodesWithHiddenNeighbor = cy.edges(":hidden").connectedNodes(':visible');
          mainUtilities.thinBorder(nodesWithHiddenNeighbor);
          viewUtilities.show(eles);
          var nodesWithHiddenNeighbor = cy.edges(":hidden").connectedNodes(':visible');
          mainUtilities.thickenBorder(nodesWithHiddenNeighbor);
      }
  };

  // Unhides all elements. Requires viewUtilities extension and considers 'undoable' option.
  mainUtilities.showAll = function() {
    // If this function is being called we can assume that view utilities extension is on use
    var viewUtilities = cy.viewUtilities('get');

    if (cy.elements().length === cy.elements(':visible').length) {
      return;
    }

    if(options.undoable) {
      var ur = cy.undoRedo();
      ur.action("thickenBorder", mainUtilities.thickenBorder, mainUtilities.thinBorder);
      ur.action("thinBorder", mainUtilities.thinBorder, mainUtilities.thickenBorder);

      // Batching
      var actions = [];
      var nodesWithHiddenNeighbor = cy.nodes("[thickBorder]");
      actions.push({name: "thinBorder", param: nodesWithHiddenNeighbor});
      actions.push({name: "show", param: cy.elements()});
      cy.undoRedo().do("batch", actions);
    }
    else {
      var nodesWithHiddenNeighbor = cy.edges(":hidden").connectedNodes(':visible');
      mainUtilities.thinBorder(nodesWithHiddenNeighbor);
      viewUtilities.show(cy.elements());
    }
  };

  // Removes the given elements in a simple way. Considers 'undoable' option.
  mainUtilities.deleteElesSimple = function(eles) {
    if (elementUtilities.isGraphTopologyLocked() || eles.length == 0) {
      return;
    }

    if (options.undoable) {
      cy.undoRedo().do("deleteElesSimple", {
        eles: eles
      });
    }
    else {
      eles.remove();
    }
  };

  // Extends the given nodes list in a smart way to leave the map intact and removes the resulting list.
  // Considers 'undoable' option.
  mainUtilities.deleteNodesSmart = function(_nodes) {
    var nodes = _nodes.nodes();
    if (elementUtilities.isGraphTopologyLocked() || nodes.length == 0) {
      return;
    }

    if(options.undoable) {
      cy.undoRedo().do("deleteNodesSmart", {
        firstTime: true,
        eles: nodes
      });
    }
    else {
      elementUtilities.deleteNodesSmart(nodes);
    }
  };

  function isNeed2Highligth(eles2highligth) {
    if (eles2highligth.length === 0) {
      return false;
    }
    var viewUtilities = cy.viewUtilities('get');
    var highlightClass = viewUtilities.getAllHighlightClasses()[0];
    var highlightedEles = cy.elements('.' + highlightClass).filter(':visible');
    if (highlightedEles.contains(eles2highligth)) {
      return false;
    }
    return true;
  }

  // Highlights selected elements. Requires viewUtilities extension and considers 'undoable' option.
  mainUtilities.highlightSelected = function (_eles) {

    var elesToHighlight = _eles;
    if (!isNeed2Highligth(elesToHighlight)) {
      return;
    }

    // If this function is being called we can assume that view utilities extension is on use
    var viewUtilities = cy.viewUtilities('get');
    if (options.undoable) {
      cy.undoRedo().do('highlight', { eles: elesToHighlight, idx: 0 });
    }
    else {
      viewUtilities.highlight(elesToHighlight);
    }

    cy.elements().unselect();
  };

  // Highlights neighbours of the given nodes. Requires viewUtilities extension and considers 'undoable' option.
  mainUtilities.highlightNeighbours = function(_nodes) {
    // If this function is being called we can assume that view utilities extension is on use
    var viewUtilities = cy.viewUtilities('get');

    var nodes = _nodes.nodes(); // Ensure that nodes list just include nodes
    var elesToHighlight = elementUtilities.getNeighboursOfNodes(nodes);
    if (!isNeed2Highligth(elesToHighlight)) {
      return;
    }

    if (options.undoable) {
      cy.undoRedo().do('highlight', { eles: elesToHighlight, idx: 0 });
    }
    else {
      viewUtilities.highlight(elesToHighlight);
    }

    cy.elements().unselect();
  };

  // Finds the elements whose label includes the given label and highlights processes of those elements.
  // Requires viewUtilities extension and considers 'undoable' option.
  mainUtilities.searchByLabel = function(label) {
    if (label.length == 0) {
      return;
    }

    var nodesToHighlight = cy.nodes(":visible").filter(function (ele, i) {
      if(typeof ele === "number") {
        ele = i;
      }
      if (ele.data("label") && ele.data("label").toLowerCase().indexOf(label) >= 0) {
        return true;
      }
      return false;
    });

    if (nodesToHighlight.length == 0) {
      return;
    }

    // If this function is being called we can assume that view utilities extension is on use
    var viewUtilities = cy.viewUtilities('get');

    // Use this line for smart search
    // nodesToHighlight = elementUtilities.extendNodeList(nodesToHighlight);

    if (options.undoable) {
      cy.undoRedo().do('highlight', { eles: nodesToHighlight, idx: 0 });
    }
    else {
      viewUtilities.highlight(nodesToHighlight);
    }

    cy.elements().unselect();
  };

  // Highlights processes of the given nodes. Requires viewUtilities extension and considers 'undoable' option.
  mainUtilities.highlightProcesses = function(_nodes) {
    var nodes = _nodes.nodes(); // Ensure that nodes list just include nodes
    var elesToHighlight = elementUtilities.extendNodeList(nodes);
    if (!isNeed2Highligth(elesToHighlight)) {
      return;
    }

    // If this function is being called we can assume that view utilities extension is on use
    var viewUtilities = cy.viewUtilities('get');

    if (options.undoable) {
      cy.undoRedo().do('highlight', { eles: elesToHighlight, idx: 0 });
    }
    else {
      viewUtilities.highlight(elesToHighlight);
    }

    cy.elements().unselect();
  };

  // Unhighlights any highlighted element. Requires viewUtilities extension and considers 'undoable' option.
  mainUtilities.removeHighlights = function() {
    if (elementUtilities.noneIsNotHighlighted()) {
      return;
    }

    // If this function is being called we can assume that view utilities extension is on use
    var viewUtilities = cy.viewUtilities('get');

    if (options.undoable) {
      cy.undoRedo().do("removeHighlights");
    }
    else {
      viewUtilities.removeHighlights();
    }
    cy.style().update();
  };

  mainUtilities.loadLayoutData = function(layoutText, byName) {
    layoutLoader.load( layoutText, byName );
  };

  mainUtilities.getLayoutText = function( byName ) {
    layoutToText.convert( byName );
  };

  // Performs layout by given layoutOptions. Considers 'undoable' option. However, by setting notUndoable parameter
  // to a truthy value you can force an undable layout operation independant of 'undoable' option.
  mainUtilities.performLayout = function(layoutOptions, notUndoable) {
    
    if (!options.undoable || notUndoable) { // 'notUndoable' flag can be used to have composite actions in undo/redo stack
      // Things to do before performing layout
      mainUtilities.beforePerformLayout();
      
      var layout = cy.elements().filter(':visible').layout(layoutOptions);

      // Check this for cytoscape.js backward compatibility
      if (layout && layout.run) {
        layout.run();
      }
    }
    else {
      cy.undoRedo().do("layout", {
        options: layoutOptions,
        eles: cy.elements().filter(':visible')
      });
    }
  };

  // Creates an sbgnml file content from the exising graph and returns it.
  mainUtilities.createSbgnml = function() {
    return jsonToSbgnml.createSbgnml();
  };

  mainUtilities.createNwt = function() {
    return jsonToNwt.createSbgnml();
  };

  // Converts given sbgnml data to a json object in a special format
  // (http://js.cytoscape.org/#notation/elements-json) and returns it.
  mainUtilities.convertSbgnmlToJson = function(data, urlParams) {
    return sbgnmlToJson.convert(data, urlParams);
  };

  mainUtilities.convertNwtToJson = function(data) {
    return nwtToJson.convert(data);
  };


  // Create the qtip contents of the given node and returns it.
  mainUtilities.getQtipContent = function(node) {
    return elementUtilities.getQtipContent(node);
  };

  // Change option
  mainUtilities.setShowComplexName = function(showComplexName) {
    options.showComplexName = showComplexName;
    // make change active by triggering data which will trigger style update
    cy.nodes('[class^="complex"]').forEach(function(ele){
      ele.trigger("data");
    });
  };

  /*
   * Sets the ordering of the given nodes.
   * Ordering options are 'L-to-R', 'R-to-L', 'T-to-B', 'B-to-T', 'none'.
   * If a node does not have any port before the operation and it is supposed to have some after operation the portDistance parameter is
   * used to set the distance between the node center and the ports. The default port distance is 60.
   * Considers undoable option.
   */
  mainUtilities.setPortsOrdering = function (nodes, ordering, portDistance) {
    if ( nodes.length === 0 ) {
      return;
    }

    if (!options.undoable) {
      elementUtilities.setPortsOrdering(nodes, ordering, portDistance);
    }
    else {
      var param = {
        nodes: nodes,
        ordering: ordering,
        portDistance: portDistance
      };

      cy.undoRedo().do("setPortsOrdering", param);
    }

    cy.style().update();
  };

  /**
   * Get map properties from SBGNML file
   * Needs to be called after file is loaded - sbgnvizLoadFileEnd event
   * return: map properties as object
   */
mainUtilities.getMapProperties = function() {
  if( elementUtilities.fileFormat !== undefined){
    if( elementUtilities.fileFormat == 'sbgnml')
      return sbgnmlToJson.mapPropertiesToObj();
    else if( elementUtilities.fileFormat == 'nwt' )
      return nwtToJson.mapPropertiesToObj();
    else if( elementUtilities.fileFormat == 'td')
      return tdToJson.mapPropertiesToObj();
    else if( elementUtilities.fileFormat == 'sif' )
      return sifToJson.mapPropertiesToObj();
    else{
      console.log( "File format mismatched!")
      return
    }
  }else{
    console.log( "File format is not defined!")
    return;
  }
 };
  mainUtilities.doValidation = function(file) {
    return sbgnmlToJson.doValidation(file);
  }

  mainUtilities.setCompoundPadding = function(newPaddingValue) {
    options.compoundPadding = newPaddingValue;
    optionUtilities.extendOptions(options);    
  }

  mainUtilities.getCompoundPadding = function() {
    return options.compoundPadding;
  }
   return mainUtilities;
};
