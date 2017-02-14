/*
 * 
 * Common utilities for sample application. Includes functions and variables.
 * You can directly utilize this object also you can use this object to set a variable in a file and access it in another file.
 */
var jquery = $ = require('jquery');

var appUtilities = {};

appUtilities.defaultLayoutProperties = {
  name: 'cose-bilkent',
  nodeRepulsion: 4500,
  idealEdgeLength: 50,
  edgeElasticity: 0.45,
  nestingFactor: 0.1,
  gravity: 0.25,
  numIter: 2500,
  tile: true,
  animationEasing: 'cubic-bezier(0.19, 1, 0.22, 1)',
  animate: 'end',
  animationDuration: 1000,
  randomize: true,
  tilingPaddingVertical: 20,
  tilingPaddingHorizontal: 20,
  gravityRangeCompound: 1.5,
  gravityCompound: 1.0,
  gravityRange: 3.8,
  stop: function () {
    chise.endSpinner('layout-spinner');
  }
};

appUtilities.currentLayoutProperties = jquery.extend(true, {}, appUtilities.defaultLayoutProperties);

appUtilities.defaultGridProperties = {
  showGrid: false,
  snapToGrid: false,
  discreteDrag: false,
  gridSize: 20,
  autoResizeNodes: false,
  showGeometricGuidelines: true,
  showDistributionGuidelines: true,
  guidelineTolerance: 2.0,
  guidelineColor: "#0B9BCD",
  horizontalGuidelineColor: "#ff0000",
  verticalGuidelineColor: "#00ff00",
  distributionAlignmentRange: 300
};

appUtilities.currentGridProperties = jquery.extend(true, {}, appUtilities.defaultGridProperties);

appUtilities.defaultGeneralProperties = {
  compoundPadding: 10,
  dynamicLabelSize: 'regular',
  fitLabelsToNodes: false,
  rearrangeAfterExpandCollapse: true,
  animateOnDrawingChanges: true,
  adjustNodeLabelFontSizeAutomatically: false
};

appUtilities.currentGeneralProperties = jquery.extend(true, {}, appUtilities.defaultGeneralProperties);

appUtilities.setFileContent = function (fileName) {
  var span = document.getElementById('file-name');
  while (span.firstChild) {
    span.removeChild(span.firstChild);
  }
  span.appendChild(document.createTextNode(fileName));
};

appUtilities.triggerIncrementalLayout = function () {
  // If 'animate-on-drawing-changes' is false then animate option must be 'end' instead of false
  // If it is 'during' use it as is. Set 'randomize' and 'fit' options to false
  var preferences = {
    randomize: false,
    animate: this.currentGeneralProperties.animateOnDrawingChanges ? 'end' : false,
    fit: false
  };
  if (this.currentLayoutProperties.animate === 'during') {
    delete preferences.animate;
  }

  this.layoutPropertiesView.applyLayout(preferences, true); // layout must not be undoable
};

appUtilities.getExpandCollapseOptions = function () {
  var self = this;
  return {
    fisheye: function () {
      return self.currentGeneralProperties.rearrangeAfterExpandCollapse;
    },
    animate: function () {
      return self.currentGeneralProperties.animateOnDrawingChanges;
    },
    layoutBy: function () {
      if (!self.currentGeneralProperties.rearrangeAfterExpandCollapse) {
        return;
      }

      self.triggerIncrementalLayout();
    }
  };
};

appUtilities.dynamicResize = function () {
  var win = $(window);

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
};

appUtilities.nodeQtipFunction = function (node) {
  if (node.renderedStyle("label") == node.data("label") && node.data("statesandinfos").length == 0 && node.data("class") != "complex") {
    return;
  }

  var qtipContent = chise.getQtipContent(node);

  if (!qtipContent) {
    return;
  }

  node.qtip({
    content: function () {
      return qtipContent;
    },
    show: {
      ready: true
    },
    position: {
      my: 'top center',
      at: 'bottom center',
      adjust: {
        cyViewport: true
      }
    },
    style: {
      classes: 'qtip-bootstrap',
      tip: {
        width: 16,
        height: 8
      }
    }
  });
};

appUtilities.refreshUndoRedoButtonsStatus = function () {
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

appUtilities.resetUndoRedoButtons = function () {
  $("#undo-last-action").parent("li").addClass("disabled");
  $("#redo-last-action").parent("li").addClass("disabled");
};

/*
 * Set elements data according to their unselected line-color and border-color.
 * This is needed for inspector because when elements are selected their border-color and line-color changes,
 * so we need to keep their original values in data.
 */
appUtilities.setElementsData = function(eles) {
  cy.startBatch();
  if (!eles) {
    eles = cy.elements();
  }
  var nodes = eles.nodes();
  var edges = eles.edges();

  nodes.each(function(i, ele) {
    // This data may be set already (This happens usually in cloning or copy-pasting elements)
    if (!ele.data('borderColor')) {
      ele.data('borderColor', ele.css('border-color'));
    }
  });

  edges.each(function(i, ele) {
    // This data may be set already (This happens usually in cloning or copy-pasting elements)
    if (ele.data('lineColor')) {
      ele.data('lineColor', ele.css('line-color'));
    }
  });
  cy.endBatch();
};

// Enable drag and drop mode
appUtilities.enableDragAndDropMode = function() {
  appUtilities.dragAndDropModeEnabled = true;
  $("#sbgn-network-container canvas").addClass("target-cursor");
  cy.autolock(true);
  cy.autounselectify(true);
};

// Disable drag and drop mode
appUtilities.disableDragAndDropMode = function() {
  appUtilities.dragAndDropModeEnabled = null;
  appUtilities.nodesToDragAndDrop = null;
  $("#sbgn-network-container canvas").removeClass("target-cursor");
  cy.autolock(false);
  cy.autounselectify(false);
};

// Show given eles and perform incremental layout afterward
appUtilities.showAndPerformIncrementalLayout = function(eles) {
  var extendedList = chise.elementUtilities.extendNodeList(eles).filter(':hidden');
  if (extendedList.length === 0) {
    return;
  }
  chise.showAndPerformLayout(extendedList, this.triggerIncrementalLayout.bind(this));
};

module.exports = appUtilities;
