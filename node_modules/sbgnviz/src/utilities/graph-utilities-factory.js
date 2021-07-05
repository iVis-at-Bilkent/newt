/*
 * Common utilities for sbgnviz graphs
 */

var classes = require('./classes');
var libUtilities = require('./lib-utilities');
var libs = libUtilities.getLibs();
var jQuery = $ = libs.jQuery;

module.exports = function () {
  var optionUtilities;
  var options, cy;

  function graphUtilities (param) {
    optionUtilities = param.optionUtilities;
    options = optionUtilities.getOptions();
    cy = param.sbgnCyInstance.getCy();    
  }

  // TODO make these initial values user options instead of hardcoding them here
  graphUtilities.portsEnabled = true;
  graphUtilities.compoundSizesConsidered = true;

  graphUtilities.disablePorts = function() {
    graphUtilities.portsEnabled = false;
    
    cy.style().update();
  };

  graphUtilities.enablePorts = function() {
    graphUtilities.portsEnabled = true;
    
    cy.style().update();
  };

  graphUtilities.arePortsEnabled = function() {
    return graphUtilities.portsEnabled;
  };

  graphUtilities.considerCompoundSizes = function() {
    graphUtilities.compoundSizesConsidered = true;
    cy.style().update();
  };

  graphUtilities.omitCompoundSizes = function() {
    graphUtilities.compoundSizesConsidered = false;
    cy.style().update();
  };

  graphUtilities.areCompoundSizesConsidered = function() {
    return graphUtilities.compoundSizesConsidered == true;
  };

  graphUtilities.updateGraph = function(cyGraph, callback, layoutOptions, tileInfoBoxes) {
   

    var isLayoutRequired;
    if(layoutOptions === undefined){
      isLayoutRequired = false;
    }
    else{
      isLayoutRequired = true;
    }

    $(document).trigger( "updateGraphStart", cy );
    // Reset undo/redo stack and buttons when a new graph is loaded
    if (options.undoable) {
      cy.undoRedo().reset();
  //    this.resetUndoRedoButtons();
    }

    cy.startBatch();
    // clear data
    cy.remove('*');
    cy.add(cyGraph);

    //add position information to data for preset layout
    var positionMap = {};
    cy.nodes().forEach(function(node) {
      var xPos = node.data('bbox').x;
      var yPos = node.data('bbox').y;
      positionMap[node.data('id')] = {'x': xPos, 'y': yPos};

      // assign correct parents to info boxes
      var statesandinfos = node.data('statesandinfos');
      for (var j=0; j < statesandinfos.length; j++) {
        classes.getAuxUnitClass(statesandinfos[j]).setParentRef(statesandinfos[j], node);
      }
    });


    //this.refreshPaddings(); // Recalculates/refreshes the compound paddings
    cy.endBatch();

    if(isLayoutRequired) {
      var preferences = {};
      if(cy.nodes().length > 3000 || cy.edges().length > 3000) {
        preferences.quality = "draft";
      }
      preferences.animate = false;
      preferences.randomize = true;
      preferences = $.extend({}, layoutOptions, preferences);
      var layout = cy.layout(preferences);
    }
    else {
      var layout = cy.layout({
        name: 'preset',
        positions: positionMap,
        fit: true,
        padding: 20
      });
    }

    // Check this for cytoscape.js backward compatibility
    if (layout && layout.run) {
      layout.run();
    }

    var performLayout = function(){
      cy.fit( cy.elements(":visible"), 20 )
    };
    // Update the style
    cy.style().update();
    // Initilize the anchor points once the elements are created
    if (cy.edgeEditing && cy.edgeEditing('initialized')) {
      cy.edgeEditing('get').initAnchorPoints(cy.edges());
    }



    $(document).trigger( "updateGraphEnd", [cy, (isLayoutRequired || tileInfoBoxes) , performLayout]);
    if (callback) callback();
  };

  graphUtilities.calculatePaddings = function(paddingPercent) {
    //As default use the compound padding value
    if (!paddingPercent) {
      var compoundPadding = options.compoundPadding;
      paddingPercent = typeof compoundPadding === 'function' ? compoundPadding.call() : compoundPadding;
    }

    var nodes = cy.nodes();
    var total = 0;
    var numOfSimples = 0;
    for (var i = 0; i < nodes.length; i++) {
      var theNode = nodes[i];
      if (theNode.children() == null || theNode.children().length == 0) {
        total += Number(theNode.width());
        total += Number(theNode.height());
        numOfSimples++;
      }
    }

    var calc_padding = (paddingPercent / 100) * Math.floor(total / (2 * numOfSimples));
    if (calc_padding < 5) {
      calc_padding = 5;
    }

    return calc_padding;
  };

  graphUtilities.recalculatePaddings = graphUtilities.refreshPaddings = function() {
    // this.calculatedPaddings is not working here
    // TODO: replace this reference with this.calculatedPaddings once the reason is figured out
    //graphUtilities.calculatedPaddings = this.calculatePaddings();
    var compoundPadding = options.compoundPadding;
    return ( typeof compoundPadding === 'function') ? compoundPadding.call() : compoundPadding
    //return graphUtilities.calculatedPaddings;
  };

  graphUtilities.getCompoundPaddings = function() {
    // Return calculated paddings in case of that data is invalid return 5
    var compoundPadding = options.compoundPadding;
    return ( typeof compoundPadding === 'function') ? compoundPadding.call() : compoundPadding

    //return graphUtilities.calculatedPaddings || 5;
  };

  return graphUtilities;
}
