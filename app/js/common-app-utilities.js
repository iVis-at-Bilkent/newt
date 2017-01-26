//Override String endsWith method for IE
String.prototype.endsWith = function (suffix) {
  return this.indexOf(suffix, this.length - suffix.length) !== -1;
};

function getFirstSelectedNode() {
  return window.firstSelectedNode ? window.firstSelectedNode : cy.nodes(":selected")[0];
}

var defaultSbgnStyleRules = {
  'compound-padding': 10,
  'dynamic-label-size': 'regular',
  'fit-labels-to-nodes': false,
  'rearrange-after-expand-collapse': true,
  'tiling-padding-vertical': 20,
  'tiling-padding-horizontal': 20,
  'animate-on-drawing-changes': true,
  'adjust-node-label-font-size-automatically': false,
  'show-grid': false,
  'snap-to-grid': false,
  'discrete-drag': false,
  'grid-size': 20,
  'auto-resize-nodes': false,
  'show-alignment-guidelines': true,
  'guideline-tolerance': 2.0,
  'guideline-color': "#0B9BCD"
};

var sbgnStyleRules = _.clone(this.defaultSbgnStyleRules);

//A function to trigger incremental layout. 
var triggerIncrementalLayout = function () {
  beforePerformLayout();

  var preferences = {
    randomize: false,
    animate: sbgnStyleRules['animate-on-drawing-changes'] ? 'end' : false,
    fit: false
  };

  if (sbgnLayoutProp.currentLayoutProperties.animate === 'during') {
    delete preferences.animate;
  }

  sbgnLayoutProp.applyLayout(preferences, false); // layout must not be undoable
};

var getExpandCollapseOptions = function() {
  return {
    fisheye: function(){
      return sbgnStyleRules['rearrange-after-expand-collapse'];
    },
    animate: function(){
      return sbgnStyleRules['animate-on-drawing-changes'];
    },
    layoutBy: function(){
      if(!sbgnStyleRules['rearrange-after-expand-collapse']) {
        return;
      }
      
      triggerIncrementalLayout();
    }
  };
};

function enableDragAndDropMode() {
  window.dragAndDropModeEnabled = true;
  $("#sbgn-network-container canvas").addClass("target-cursor");
  cy.autolock(true);
  cy.autounselectify(true);
}

function disableDragAndDropMode() {
  window.dragAndDropModeEnabled = null;
  window.nodesToDragAndDrop = null;
  $("#sbgn-network-container canvas").removeClass("target-cursor");
  cy.autolock(false);
  cy.autounselectify(false);
}

function dynamicResize()
{

  var win = $(this); //this = window

  var windowWidth = win.width();
  var windowHeight = win.height();

  var canvasWidth = 1000;
  var canvasHeight = 680;

  if (windowWidth > canvasWidth)
  {
    $("#sbgn-network-container").width(windowWidth * 0.9 * 0.8);
    $("#sbgn-inspector").width(windowWidth * 0.9 * 0.2);
    var w = $("#sbgn-inspector-and-canvas").width();
    $(".nav-menu").width(w);
    $(".navbar").width(w);
//    $("#sbgn-info-content").width(windowWidth * 0.85);
    $("#sbgn-toolbar").width(w);
  }

  if (windowHeight > canvasHeight)
  {
    $("#sbgn-network-container").height(windowHeight * 0.85);
    $("#sbgn-inspector").height(windowHeight * 0.85);
  }
}

$(window).on('resize', dynamicResize);

$(document).ready(function ()
{
  dynamicResize();
});

var getNodesData = function () {
  var nodesData = {};
  var nodes = cy.nodes();
  for (var i = 0; i < nodes.length; i++) {
    var node = nodes[i];
    nodesData[node.id()] = {
      width: node.width(),
      height: node.height(),
      x: node.position("x"),
      y: node.position("y")
    };
  }
  return nodesData;
};

/*
 * This function refreshs the enabled-disabled status of undo-redo buttons.
 * The status of buttons are determined by whether the undo-redo stacks are empty.
 */
var refreshUndoRedoButtonsStatus = function () {
  var ur = cy.undoRedo();

  if (ur.isUndoStackEmpty()) {
    $("#undo-last-action").parent("li").addClass("disabled");
  }
  else {
    $("#undo-last-action").parent("li").removeClass("disabled");
  }

  if (ur.isRedoStackEmpty()) {
    $("#redo-last-action").parent("li").addClass("disabled");
  }
  else {
    $("#redo-last-action").parent("li").removeClass("disabled");
  }
};

var resetUndoRedoButtons = function () {
  $("#undo-last-action").parent("li").addClass("disabled");
  $("#redo-last-action").parent("li").addClass("disabled");
};

var showHiddenNeighbors = function (eles) {
  var hiddenNeighbours = elementUtilities.getProcessesOfGivenEles(eles).filter(':hidden');
  if (hiddenNeighbours.length === 0) {
    return;
  }

  var param = {
    eles: hiddenNeighbours
  };

  cy.undoRedo().do("showAndPerformIncrementalLayout", param);
};