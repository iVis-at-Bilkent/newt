/*
 *
 * Common utilities for sample application. Includes functions and variables.
 * You can directly utilize this object also you can use this object to set a variable in a file and access it in another file.
 */
var jquery = $ = require('jquery');
var chroma = require('chroma-js');

var appUtilities = {};

// Configuration flag for whether the operations should be undoable.
// It is to be checked and passed to extensions/libraries where applicable.
appUtilities.undoable = true;

appUtilities.defaultLayoutProperties = {
  name: 'cose-bilkent',
  nodeRepulsion: 2000,
  idealEdgeLength: 30,
  edgeElasticity: 0.45,
  nestingFactor: 0.1,
  gravity: 0.25,
  numIter: 2500,
  tile: true,
  animationEasing: 'cubic-bezier(0.17,0.72,0.41,0.98)',
  animate: 'end',
  animationDuration: 2000,
  randomize: false,
  tilingPaddingVertical: 20,
  tilingPaddingHorizontal: 20,
  gravityRangeCompound: 1.5,
  gravityCompound: 1.0,
  gravityRange: 3.8,
  initialEnergyOnIncremental: 0.3,
  improveFlow: true,
  stop: function () {
    chise.endSpinner('layout-spinner');
  }
};

appUtilities.currentLayoutProperties = jquery.extend(true, {}, appUtilities.defaultLayoutProperties);

appUtilities.defaultGridProperties = {
  showGrid: false,
  snapToGridOnRelease: false,
  snapToGridDuringDrag: false,
  snapToAlignmentLocationOnRelease: false,
  snapToAlignmentLocationDuringDrag: false,
  gridSize: 20,
  gridColor: "#c8c8c8",
  autoResizeNodes: false,
  showGeometricGuidelines: false,
  showInitPosAlignment: false,
  showDistributionGuidelines: false,
  lineWidth: 0.75,
  guidelineTolerance: 3.0,
  guidelineColor: "#0B9BCD",
  horizontalGuidelineColor: "#0B9BCD",
  verticalGuidelineColor: "#0B9BCD",
  initPosAlignmentColor: "#0000ff",
  geometricAlignmentRange: 300,
  distributionAlignmentRange: 200,
  minDistributionAlignmentRange: 15,
  initPosAlignmentLine: [0, 0],
  lineDash: [3, 5],
  horizontalDistLine: [0, 0],
  verticalDistLine: [0, 0],
};

appUtilities.currentGridProperties = jquery.extend(true, {}, appUtilities.defaultGridProperties);

appUtilities.defaultGeneralProperties = {
  compoundPadding: 10,
  extraCompartmentPadding: 14,
  extraComplexPadding: 10,
  arrowScale: 1.25,
  showComplexName: true,
  dynamicLabelSize: 'regular',
  fitLabelsToNodes: false,
  fitLabelsToInfoboxes: false,
  rearrangeAfterExpandCollapse: true,
  animateOnDrawingChanges: true,
  adjustNodeLabelFontSizeAutomatically: false,
  enablePorts: true,
  allowCompoundNodeResize: false,
  mapColorScheme: 'black_white',
  defaultInfoboxHeight: 12,
  defaultInfoboxWidth: 30,
  mapType: function() {return chise.getMapType() || "Unknown"},
  mapName: "",
  mapDescription: ""
};

appUtilities.currentGeneralProperties = jquery.extend(true, {}, appUtilities.defaultGeneralProperties);

appUtilities.setFileContent = function (fileName) {
  var span = document.getElementById('file-name');
  var displayedSpan = document.getElementById('displayed-file-name');
  while (span.firstChild) {
    span.removeChild(span.firstChild);
  }
  while (displayedSpan.firstChild) {
      displayedSpan.removeChild(displayedSpan.firstChild);
  }
  span.appendChild(document.createTextNode(fileName));
  if (fileName.length <= 40)
      displayedSpan.appendChild(document.createTextNode(fileName));
  else displayedSpan.appendChild(document.createTextNode(fileName.substring(0, 34) + "...xml"));

  displayedSpan.style.display = 'block';
  span.style.display = 'none';
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
    },
    expandCollapseCueSize: 12,
    expandCollapseCuePosition: function (node) {;
       var offset = 1, rectSize = 12; // this is the expandCollapseCueSize;
       var size = cy.zoom() < 1 ? rectSize / (2*cy.zoom()) : rectSize / 2; 
       var x = node.position('x') - node.width() / 2 - parseFloat(node.css('padding-left'))
           + parseFloat(node.css('border-width')) + size + offset;
       if (node.data("class") == "compartment"){
           var y  = node.position('y') - node.outerHeight() / 2  + Math.min(15, node.outerHeight()*0.05)
               + parseFloat(node.css('border-width'))+ size;
       } else {
           var y = node.position('y') - node.height() / 2 - parseFloat(node.css('padding-top'))
               + parseFloat(node.css('border-width')) + size + offset;
       };

       return {'x': x, 'y': y};
    },
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
    //This is the margin on left and right of the main content when the page is
    //displayed
    var mainContentMargin = 10;
    $("#sbgn-network-container").width(windowWidth  * 0.8 - mainContentMargin);
    $("#sbgn-inspector").width(windowWidth  * 0.2 - mainContentMargin);
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
/*
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
*/
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

// Show neighbors of given eles and perform incremental layout afterward if Rearrange option is checked
appUtilities.showHiddenNeighbors = function(eles) {
    var extendedList = chise.elementUtilities.extendNodeList(eles);
    if (this.currentGeneralProperties.rearrangeAfterExpandCollapse )
    {
        //Put them near node, show and perform incremental layout
        chise.showAndPerformLayout(eles, extendedList, this.triggerIncrementalLayout.bind(this));
    }
    else
    {
        //Just show them
        chise.showEles(extendedList);
    }
};

// Show neighbors of given eles and perform incremental layout afterward if Rearrange option is checked
appUtilities.showAll = function() {
    if (this.currentGeneralProperties.rearrangeAfterExpandCollapse )
    {
        //Show all and perform incremental layout
        chise.showAllAndPerformLayout(this.triggerIncrementalLayout.bind(this));
    }
    else
    {
        //Just show them all
        chise.showAll();
    }
};

// Hides nodes and perform incremental layout afterward if Rearrange option is checked
appUtilities.hideNodesSmart = function(eles) {
    if (this.currentGeneralProperties.rearrangeAfterExpandCollapse )
    {
        //Put them near node and perform incremental layout
        chise.hideAndPerformLayout(eles, this.triggerIncrementalLayout.bind(this));
    }
    else
    {
        //Just show them
        chise.hideNodesSmart(eles);
    }
};

appUtilities.mapColorSchemes = mapColorSchemes = {
  'black_white': {
    'name': 'Black and white',
    'preview': ['#ffffff', '#000000'],
    'values': {
      'unspecified entity': '#ffffff',
      'simple chemical': '#ffffff',
      'macromolecule': '#ffffff',
      'nucleic acid feature': '#ffffff',
      'perturbing agent': '#ffffff',
      'source and sink': '#ffffff',
      'complex': '#ffffff',
      'process': '#ffffff',
      'omitted process': '#ffffff',
      'uncertain process': '#ffffff',
      'association': '#ffffff',
      'dissociation': '#ffffff',
      'phenotype': '#ffffff',
      'tag': '#ffffff',
      'consumption': '#ffffff',
      'production': '#ffffff',
      'modulation': '#ffffff',
      'stimulation': '#ffffff',
      'catalysis': '#ffffff',
      'inhibition': '#ffffff',
      'necessary stimulation': '#ffffff',
      'logic arc': '#ffffff',
      'equivalence arc': '#ffffff',
      'and': '#ffffff',
      'or': '#ffffff',
      'not': '#ffffff',
      'compartment': '#ffffff',
      'submap': '#ffffff',
      // AF
      'BA plain': '#ffffff',
      'BA unspecified entity': '#ffffff',
      'BA simple chemical': '#ffffff',
      'BA macromolecule': '#ffffff',
      'BA nucleic acid feature': '#ffffff',
      'BA perturbing agent': '#ffffff',
      'BA complex': '#ffffff',
      'delay': '#ffffff'
    }
  },
  'greyscale': {
    'name': 'Greyscale',
    'preview': ['#ffffff', '#f0f0f0', '#d9d9d9', '#bdbdbd'],
    'invert': 'inverse_greyscale',
    'values': {
      'unspecified entity': '#ffffff',
      'simple chemical': '#bdbdbd',
      'macromolecule': '#bdbdbd',
      'nucleic acid feature': '#bdbdbd',
      'perturbing agent': '#bdbdbd',
      'source and sink': '#ffffff',
      'complex': '#d9d9d9',
      'process': '#ffffff',
      'omitted process': '#ffffff',
      'uncertain process': '#ffffff',
      'association': '#ffffff',
      'dissociation': '#ffffff',
      'phenotype': '#ffffff',
      'tag': '#ffffff',
      'consumption': '#ffffff',
      'production': '#ffffff',
      'modulation': '#ffffff',
      'stimulation': '#ffffff',
      'catalysis': '#ffffff',
      'inhibition': '#ffffff',
      'necessary stimulation': '#ffffff',
      'logic arc': '#ffffff',
      'equivalence arc': '#ffffff',
      'and': '#ffffff',
      'or': '#ffffff',
      'not': '#ffffff',
      'compartment': '#f0f0f0',
      'submap': '#f0f0f0',
      // AF
      'BA plain': '#ffffff',
      'BA unspecified entity': '#ffffff',
      'BA simple chemical': '#bdbdbd',
      'BA macromolecule': '#bdbdbd',
      'BA nucleic acid feature': '#bdbdbd',
      'BA perturbing agent': '#bdbdbd',
      'BA complex': '#d9d9d9',
      'delay': '#ffffff'
    }
  },
  'inverse_greyscale': {
    'name': 'Inverse greyscale',
    'preview': ['#bdbdbd', '#d9d9d9', '#f0f0f0', '#ffffff'],
    'invert': 'greyscale',
    'values': {
      'unspecified entity': '#f0f0f0',
      'simple chemical': '#f0f0f0',
      'macromolecule': '#f0f0f0',
      'nucleic acid feature': '#f0f0f0',
      'perturbing agent': '#f0f0f0',
      'source and sink': '#f0f0f0',
      'complex': '#d9d9d9',
      'process': '#ffffff',
      'omitted process': '#ffffff',
      'uncertain process': '#ffffff',
      'association': '#ffffff',
      'dissociation': '#ffffff',
      'phenotype': '#f0f0f0',
      'tag': '#f0f0f0',
      'consumption': '#ffffff',
      'production': '#ffffff',
      'modulation': '#ffffff',
      'stimulation': '#ffffff',
      'catalysis': '#ffffff',
      'inhibition': '#ffffff',
      'necessary stimulation': '#ffffff',
      'logic arc': '#ffffff',
      'equivalence arc': '#ffffff',
      'and': '#ffffff',
      'or': '#ffffff',
      'not': '#ffffff',
      'compartment': '#bdbdbd',
      'submap': '#bdbdbd',
      // AF
      'BA plain': '#f0f0f0',
      'BA unspecified entity': '#f0f0f0',
      'BA simple chemical': '#f0f0f0',
      'BA macromolecule': '#f0f0f0',
      'BA nucleic acid feature': '#f0f0f0',
      'BA perturbing agent': '#f0f0f0',
      'BA complex': '#d9d9d9',
      'delay': '#ffffff'
    }
  },
  'blue_scale': {
    'name': 'Blue scale',
    'preview': ['#ffffff', '#eff3ff', '#c6dbef', '#9ecae1'],
    'invert': 'inverse_blue_scale',
    'values': {
      'unspecified entity': '#9ecae1',
      'simple chemical': '#9ecae1',
      'macromolecule': '#9ecae1',
      'nucleic acid feature': '#9ecae1',
      'perturbing agent': '#9ecae1',
      'source and sink': '#9ecae1',
      'complex': '#c6dbef',
      'process': '#ffffff',
      'omitted process': '#ffffff',
      'uncertain process': '#ffffff',
      'association': '#ffffff',
      'dissociation': '#ffffff',
      'phenotype': '#9ecae1',
      'tag': '#9ecae1',
      'consumption': '#ffffff',
      'production': '#ffffff',
      'modulation': '#ffffff',
      'stimulation': '#ffffff',
      'catalysis': '#ffffff',
      'inhibition': '#ffffff',
      'necessary stimulation': '#ffffff',
      'logic arc': '#ffffff',
      'equivalence arc': '#ffffff',
      'and': '#ffffff',
      'or': '#ffffff',
      'not': '#ffffff',
      'compartment': '#eff3ff',
      'submap': '#eff3ff',
      // AF
      'BA plain': '#9ecae1',
      'BA unspecified entity': '#9ecae1',
      'BA simple chemical': '#9ecae1',
      'BA macromolecule': '#9ecae1',
      'BA nucleic acid feature': '#9ecae1',
      'BA perturbing agent': '#9ecae1',
      'BA complex': '#c6dbef',
      'delay': '#ffffff'
    }
  },
  'inverse_blue_scale': {
    'name': 'Inverse blue scale',
    'preview': ['#9ecae1', '#c6dbef', '#eff3ff', '#ffffff'],
    'invert': 'blue_scale',
    'values': {
      'unspecified entity': '#eff3ff',
      'simple chemical': '#eff3ff',
      'macromolecule': '#eff3ff',
      'nucleic acid feature': '#eff3ff',
      'perturbing agent': '#eff3ff',
      'source and sink': '#eff3ff',
      'complex': '#c6dbef',
      'process': '#ffffff',
      'omitted process': '#ffffff',
      'uncertain process': '#ffffff',
      'association': '#ffffff',
      'dissociation': '#ffffff',
      'phenotype': '#eff3ff',
      'tag': '#eff3ff',
      'consumption': '#ffffff',
      'production': '#ffffff',
      'modulation': '#ffffff',
      'stimulation': '#ffffff',
      'catalysis': '#ffffff',
      'inhibition': '#ffffff',
      'necessary stimulation': '#ffffff',
      'logic arc': '#ffffff',
      'equivalence arc': '#ffffff',
      'and': '#ffffff',
      'or': '#ffffff',
      'not': '#ffffff',
      'compartment': '#9ecae1',
      'submap': '#9ecae1',
      // AF
      'BA plain': '#eff3ff',
      'BA unspecified entity': '#eff3ff',
      'BA simple chemical': '#eff3ff',
      'BA macromolecule': '#eff3ff',
      'BA nucleic acid feature': '#eff3ff',
      'BA perturbing agent': '#eff3ff',
      'BA complex': '#c6dbef',
      'delay': '#ffffff'
    }
  },
  'opposed_red_blue': {
    'name': 'Red blue',
    'preview': ['#f4a582', '#fddbc7', '#f7f7f7', '#d1e5f0', '#92c5de'],
    'invert': 'opposed_red_blue2',
    'values': {
      'unspecified entity': '#f7f7f7',
      'simple chemical': '#fddbc7',
      'macromolecule': '#92c5de',
      'nucleic acid feature': '#f4a582',
      'perturbing agent': '#f7f7f7',
      'source and sink': '#f7f7f7',
      'complex': '#d1e5f0',
      'process': '#ffffff',
      'omitted process': '#ffffff',
      'uncertain process': '#ffffff',
      'association': '#ffffff',
      'dissociation': '#ffffff',
      'phenotype': '#f7f7f7',
      'tag': '#f7f7f7',
      'consumption': '#ffffff',
      'production': '#ffffff',
      'modulation': '#ffffff',
      'stimulation': '#ffffff',
      'catalysis': '#ffffff',
      'inhibition': '#ffffff',
      'necessary stimulation': '#ffffff',
      'logic arc': '#ffffff',
      'equivalence arc': '#ffffff',
      'and': '#ffffff',
      'or': '#ffffff',
      'not': '#ffffff',
      'compartment': '#f7f7f7',
      'submap': '#f7f7f7',
      // AF
      'BA plain': '#f7f7f7',
      'BA unspecified entity': '#f7f7f7',
      'BA simple chemical': '#fddbc7',
      'BA macromolecule': '#92c5de',
      'BA nucleic acid feature': '#f4a582',
      'BA perturbing agent': '#f7f7f7',
      'BA complex': '#d1e5f0',
      'delay': '#ffffff'
    }
  },
  'opposed_red_blue2': {
    'name': 'Red blue 2',
    'preview': ['#92c5de', '#d1e5f0', '#f7f7f7', '#fddbc7', '#f4a582'],
    'invert': 'opposed_red_blue',
    'values': {
      'unspecified entity': '#f7f7f7',
      'simple chemical': '#d1e5f0',
      'macromolecule': '#f4a582',
      'nucleic acid feature': '#92c5de',
      'perturbing agent': '#f7f7f7',
      'source and sink': '#f7f7f7',
      'complex': '#fddbc7',
      'process': '#ffffff',
      'omitted process': '#ffffff',
      'uncertain process': '#ffffff',
      'association': '#ffffff',
      'dissociation': '#ffffff',
      'phenotype': '#f7f7f7',
      'tag': '#f7f7f7',
      'consumption': '#ffffff',
      'production': '#ffffff',
      'modulation': '#ffffff',
      'stimulation': '#ffffff',
      'catalysis': '#ffffff',
      'inhibition': '#ffffff',
      'necessary stimulation': '#ffffff',
      'logic arc': '#ffffff',
      'equivalence arc': '#ffffff',
      'and': '#ffffff',
      'or': '#ffffff',
      'not': '#ffffff',
      'compartment': '#f7f7f7',
      'submap': '#f7f7f7',
      // AF
      'BA plain': '#f7f7f7',
      'BA unspecified entity': '#f7f7f7',
      'BA simple chemical': '#d1e5f0',
      'BA macromolecule': '#f4a582',
      'BA nucleic acid feature': '#92c5de',
      'BA perturbing agent': '#f7f7f7',
      'BA complex': '#fddbc7',
      'delay': '#ffffff'
    }
  },
  'opposed_green_brown': {
    'name': 'Green brown',
    'preview': ['#dfc27d', '#f6e8c3', '#f5f5f5', '#c7eae5', '#80cdc1'],
    'invert': 'opposed_green_brown2',
    'values': {
      'unspecified entity': '#f5f5f5',
      'simple chemical': '#f6e8c3',
      'macromolecule': '#80cdc1',
      'nucleic acid feature': '#dfc27d',
      'perturbing agent': '#f5f5f5',
      'source and sink': '#f5f5f5',
      'complex': '#c7eae5',
      'process': '#ffffff',
      'omitted process': '#ffffff',
      'uncertain process': '#ffffff',
      'association': '#ffffff',
      'dissociation': '#ffffff',
      'phenotype': '#f5f5f5',
      'tag': '#f5f5f5',
      'consumption': '#ffffff',
      'production': '#ffffff',
      'modulation': '#ffffff',
      'stimulation': '#ffffff',
      'catalysis': '#ffffff',
      'inhibition': '#ffffff',
      'necessary stimulation': '#ffffff',
      'logic arc': '#ffffff',
      'equivalence arc': '#ffffff',
      'and': '#ffffff',
      'or': '#ffffff',
      'not': '#ffffff',
      'compartment': '#f5f5f5',
      'submap': '#f5f5f5',
      // AF
      'BA plain': '#f5f5f5',
      'BA unspecified entity': '#f5f5f5',
      'BA simple chemical': '#f6e8c3',
      'BA macromolecule': '#80cdc1',
      'BA nucleic acid feature': '#dfc27d',
      'BA perturbing agent': '#f5f5f5',
      'BA complex': '#c7eae5',
      'delay': '#ffffff'
    }
  },
  'opposed_green_brown2': {
    'name': 'Green brown 2',
    'preview': ['#80cdc1', '#c7eae5', '#f5f5f5', '#f6e8c3', '#dfc27d'],
    'invert': 'opposed_green_brown',
    'values': {
      'unspecified entity': '#f5f5f5',
      'simple chemical': '#c7eae5',
      'macromolecule': '#dfc27d',
      'nucleic acid feature': '#80cdc1',
      'perturbing agent': '#f5f5f5',
      'source and sink': '#f5f5f5',
      'complex': '#f6e8c3',
      'process': '#ffffff',
      'omitted process': '#ffffff',
      'uncertain process': '#ffffff',
      'association': '#ffffff',
      'dissociation': '#ffffff',
      'phenotype': '#f5f5f5',
      'tag': '#f5f5f5',
      'consumption': '#ffffff',
      'production': '#ffffff',
      'modulation': '#ffffff',
      'stimulation': '#ffffff',
      'catalysis': '#ffffff',
      'inhibition': '#ffffff',
      'necessary stimulation': '#ffffff',
      'logic arc': '#ffffff',
      'equivalence arc': '#ffffff',
      'and': '#ffffff',
      'or': '#ffffff',
      'not': '#ffffff',
      'compartment': '#f5f5f5',
      'submap': '#f5f5f5',
      // AF
      'BA plain': '#f5f5f5',
      'BA unspecified entity': '#f5f5f5',
      'BA simple chemical': '#c7eae5',
      'BA macromolecule': '#dfc27d',
      'BA nucleic acid feature': '#80cdc1',
      'BA perturbing agent': '#f5f5f5',
      'BA complex': '#f6e8c3',
      'delay': '#ffffff'
    }
  },
  'opposed_purple_brown': {
    'name': 'Purple brown',
    'preview': ['#fdb863', '#fee0b6', '#f7f7f7', '#d8daeb', '#b2abd2'],
    'invert': 'opposed_purple_brown2',
    'values': {
      'unspecified entity': '#f7f7f7',
      'simple chemical': '#fee0b6',
      'macromolecule': '#b2abd2',
      'nucleic acid feature': '#fdb863',
      'perturbing agent': '#f7f7f7',
      'source and sink': '#f7f7f7',
      'complex': '#d8daeb',
      'process': '#ffffff',
      'omitted process': '#ffffff',
      'uncertain process': '#ffffff',
      'association': '#ffffff',
      'dissociation': '#ffffff',
      'phenotype': '#f7f7f7',
      'tag': '#f7f7f7',
      'consumption': '#ffffff',
      'production': '#ffffff',
      'modulation': '#ffffff',
      'stimulation': '#ffffff',
      'catalysis': '#ffffff',
      'inhibition': '#ffffff',
      'necessary stimulation': '#ffffff',
      'logic arc': '#ffffff',
      'equivalence arc': '#ffffff',
      'and': '#ffffff',
      'or': '#ffffff',
      'not': '#ffffff',
      'compartment': '#f7f7f7',
      'submap': '#f7f7f7',
      // AF
      'BA plain': '#f7f7f7',
      'BA unspecified entity': '#f7f7f7',
      'BA simple chemical': '#fee0b6',
      'BA macromolecule': '#b2abd2',
      'BA nucleic acid feature': '#fdb863',
      'BA perturbing agent': '#f7f7f7',
      'BA complex': '#d8daeb',
      'delay': '#ffffff'
    }
  },
  'opposed_purple_brown2': {
    'name': 'Purple brown 2',
    'preview': ['#b2abd2', '#d8daeb', '#f7f7f7', '#fee0b6', '#fdb863'],
    'invert': 'opposed_purple_brown',
    'values': {
      'unspecified entity': '#f7f7f7',
      'simple chemical': '#d8daeb',
      'macromolecule': '#fdb863',
      'nucleic acid feature': '#b2abd2',
      'perturbing agent': '#f7f7f7',
      'source and sink': '#f7f7f7',
      'complex': '#fee0b6',
      'process': '#ffffff',
      'omitted process': '#ffffff',
      'uncertain process': '#ffffff',
      'association': '#ffffff',
      'dissociation': '#ffffff',
      'phenotype': '#f7f7f7',
      'tag': '#f7f7f7',
      'consumption': '#ffffff',
      'production': '#ffffff',
      'modulation': '#ffffff',
      'stimulation': '#ffffff',
      'catalysis': '#ffffff',
      'inhibition': '#ffffff',
      'necessary stimulation': '#ffffff',
      'logic arc': '#ffffff',
      'equivalence arc': '#ffffff',
      'and': '#ffffff',
      'or': '#ffffff',
      'not': '#ffffff',
      'compartment': '#f7f7f7',
      'submap': '#f7f7f7',
      // AF
      'BA plain': '#f7f7f7',
      'BA unspecified entity': '#f7f7f7',
      'BA simple chemical': '#d8daeb',
      'BA macromolecule': '#fdb863',
      'BA nucleic acid feature': '#b2abd2',
      'BA perturbing agent': '#f7f7f7',
      'BA complex': '#fee0b6',
      'delay': '#ffffff'
    }
  },
  'opposed_purple_green': {
    'name': 'Purple green',
    'preview': ['#a6dba0', '#d9f0d3', '#f7f7f7', '#e7d4e8', '#c2a5cf'],
    'invert': 'opposed_purple_green2',
    'values': {
      'unspecified entity': '#f7f7f7',
      'simple chemical': '#d9f0d3',
      'macromolecule': '#c2a5cf',
      'nucleic acid feature': '#a6dba0',
      'perturbing agent': '#f7f7f7',
      'source and sink': '#f7f7f7',
      'complex': '#e7d4e8',
      'process': '#ffffff',
      'omitted process': '#ffffff',
      'uncertain process': '#ffffff',
      'association': '#ffffff',
      'dissociation': '#ffffff',
      'phenotype': '#f7f7f7',
      'tag': '#f7f7f7',
      'consumption': '#ffffff',
      'production': '#ffffff',
      'modulation': '#ffffff',
      'stimulation': '#ffffff',
      'catalysis': '#ffffff',
      'inhibition': '#ffffff',
      'necessary stimulation': '#ffffff',
      'logic arc': '#ffffff',
      'equivalence arc': '#ffffff',
      'and': '#ffffff',
      'or': '#ffffff',
      'not': '#ffffff',
      'compartment': '#f7f7f7',
      'submap': '#f7f7f7',
      // AF
      'BA plain': '#f7f7f7',
      'BA unspecified entity': '#f7f7f7',
      'BA simple chemical': '#d9f0d3',
      'BA macromolecule': '#c2a5cf',
      'BA nucleic acid feature': '#a6dba0',
      'BA perturbing agent': '#f7f7f7',
      'BA complex': '#e7d4e8',
      'delay': '#ffffff'
    }
  },
  'opposed_purple_green2': {
    'name': 'Purple green 2',
    'preview': ['#c2a5cf', '#e7d4e8', '#f7f7f7', '#d9f0d3', '#a6dba0'],
    'invert': 'opposed_purple_green',
    'values': {
      'unspecified entity': '#f7f7f7',
      'simple chemical': '#e7d4e8',
      'macromolecule': '#a6dba0',
      'nucleic acid feature': '#c2a5cf',
      'perturbing agent': '#f7f7f7',
      'source and sink': '#f7f7f7',
      'complex': '#d9f0d3',
      'process': '#ffffff',
      'omitted process': '#ffffff',
      'uncertain process': '#ffffff',
      'association': '#ffffff',
      'dissociation': '#ffffff',
      'phenotype': '#f7f7f7',
      'tag': '#f7f7f7',
      'consumption': '#ffffff',
      'production': '#ffffff',
      'modulation': '#ffffff',
      'stimulation': '#ffffff',
      'catalysis': '#ffffff',
      'inhibition': '#ffffff',
      'necessary stimulation': '#ffffff',
      'logic arc': '#ffffff',
      'equivalence arc': '#ffffff',
      'and': '#ffffff',
      'or': '#ffffff',
      'not': '#ffffff',
      'compartment': '#f7f7f7',
      'submap': '#f7f7f7',
      // AF
      'BA plain': '#f7f7f7',
      'BA unspecified entity': '#f7f7f7',
      'BA simple chemical': '#e7d4e8',
      'BA macromolecule': '#a6dba0',
      'BA nucleic acid feature': '#c2a5cf',
      'BA perturbing agent': '#f7f7f7',
      'BA complex': '#d9f0d3',
      'delay': '#ffffff'
    }
  },
  'opposed_grey_red': {
    'name': 'Grey red',
    'preview': ['#bababa', '#e0e0e0', '#ffffff', '#fddbc7', '#f4a582'],
    'invert': 'opposed_grey_red2',
    'values': {
      'unspecified entity': '#ffffff',
      'simple chemical': '#e0e0e0',
      'macromolecule': '#f4a582',
      'nucleic acid feature': '#bababa',
      'perturbing agent': '#ffffff',
      'source and sink': '#ffffff',
      'complex': '#fddbc7',
      'process': '#ffffff',
      'omitted process': '#ffffff',
      'uncertain process': '#ffffff',
      'association': '#ffffff',
      'dissociation': '#ffffff',
      'phenotype': '#ffffff',
      'tag': '#ffffff',
      'consumption': '#ffffff',
      'production': '#ffffff',
      'modulation': '#ffffff',
      'stimulation': '#ffffff',
      'catalysis': '#ffffff',
      'inhibition': '#ffffff',
      'necessary stimulation': '#ffffff',
      'logic arc': '#ffffff',
      'equivalence arc': '#ffffff',
      'and': '#ffffff',
      'or': '#ffffff',
      'not': '#ffffff',
      'compartment': '#ffffff',
      'submap': '#ffffff',
      // AF
      'BA plain': '#ffffff',
      'BA unspecified entity': '#ffffff',
      'BA simple chemical': '#e0e0e0',
      'BA macromolecule': '#f4a582',
      'BA nucleic acid feature': '#bababa',
      'BA perturbing agent': '#ffffff',
      'BA complex': '#fddbc7',
      'delay': '#ffffff'
    }
  },
  'opposed_grey_red2': {
    'name': 'Grey red 2',
    'preview': ['#f4a582', '#fddbc7', '#ffffff', '#e0e0e0', '#bababa'],
    'invert': 'opposed_grey_red',
    'values': {
      'unspecified entity': '#ffffff',
      'simple chemical': '#fddbc7',
      'macromolecule': '#bababa',
      'nucleic acid feature': '#f4a582',
      'perturbing agent': '#ffffff',
      'source and sink': '#ffffff',
      'complex': '#e0e0e0',
      'process': '#ffffff',
      'omitted process': '#ffffff',
      'uncertain process': '#ffffff',
      'association': '#ffffff',
      'dissociation': '#ffffff',
      'phenotype': '#ffffff',
      'tag': '#ffffff',
      'consumption': '#ffffff',
      'production': '#ffffff',
      'modulation': '#ffffff',
      'stimulation': '#ffffff',
      'catalysis': '#ffffff',
      'inhibition': '#ffffff',
      'necessary stimulation': '#ffffff',
      'logic arc': '#ffffff',
      'equivalence arc': '#ffffff',
      'and': '#ffffff',
      'or': '#ffffff',
      'not': '#ffffff',
      'compartment': '#ffffff',
      'submap': '#ffffff',
      // AF
      'BA plain': '#ffffff',
      'BA unspecified entity': '#ffffff',
      'BA simple chemical': '#fddbc7',
      'BA macromolecule': '#bababa',
      'BA nucleic acid feature': '#f4a582',
      'BA perturbing agent': '#ffffff',
      'BA complex': '#e0e0e0',
      'delay': '#ffffff'
    }
  }
};
// set multimers to be the same as their original elements
// just to avoid typing it manually in the mapColorSchemes dictionary
for(var scheme in mapColorSchemes){
  mapColorSchemes[scheme]['values']['nucleic acid feature multimer'] = mapColorSchemes[scheme]['values']['nucleic acid feature'];
  mapColorSchemes[scheme]['values']['macromolecule multimer'] = mapColorSchemes[scheme]['values']['macromolecule'];
  mapColorSchemes[scheme]['values']['simple chemical multimer'] = mapColorSchemes[scheme]['values']['simple chemical'];
  mapColorSchemes[scheme]['values']['complex multimer'] = mapColorSchemes[scheme]['values']['complex'];
}

// go through eles, mapping the id of these elements to values that were mapped to their data().class
// classMap is of the form: {ele.data().class: value}
// return object of the form: {ele.id: value}
appUtilities.mapEleClassToId = function(eles, classMap) {
  result = {};
  for( var i = 0; i < eles.length; i++ ){
    ele = eles[i];
    result[ele.id()] = classMap[ele.data().class];
  }
  return result;
};

// change the global style of the map by applying the current color scheme
appUtilities.applyMapColorScheme = function(newColorScheme, self) {
  var eles = cy.nodes();
  var idMap = appUtilities.mapEleClassToId(eles, mapColorSchemes[newColorScheme]['values']);
  var collapsedChildren = cy.expandCollapse('get').getAllCollapsedChildrenRecursively().filter("node");
  var collapsedIdMap = appUtilities.mapEleClassToId(collapsedChildren, mapColorSchemes[newColorScheme]['values']);

  var actions = [];
  // edit style of the current map elements
  actions.push({name: "changeData", param: {eles: eles, name: 'background-color', valueMap: idMap}});
  // collapsed nodes' style should also be changed, special edge case
  actions.push({name: "changeDataDirty", param: {eles: collapsedChildren, name: 'background-color', valueMap: collapsedIdMap}});

  actions.push({name: "refreshColorSchemeMenu", param: {value: newColorScheme, self: self}});
  // set to be the default as well
  for(var nodeClass in mapColorSchemes[newColorScheme]['values']){
    classBgColor = mapColorSchemes[newColorScheme]['values'][nodeClass];
    // nodeClass may not be defined in the defaultProperties (for edges, for example)
    if(nodeClass in chise.elementUtilities.defaultProperties){
      actions.push({name: "setDefaultProperty", param: {class: nodeClass, name: 'background-color', value: classBgColor}});
    }
  }

  cy.undoRedo().do("batch", actions);
  // ensure the menu is updated accordingly
  document.getElementById("map-color-scheme_preview_" + newColorScheme).style.border = "3px solid";
};

// the 3 following functions are related to the handling of the dynamic image
// used during drag and drop of palette nodes
appUtilities.dragImageMouseMoveHandler = function (e) {
      $("#drag-image").css({left:e.pageX, top:e.pageY});
};

appUtilities.addDragImage = function (img, width, height){
  // see: http://stackoverflow.com/questions/38838508/make-a-dynamic-image-follow-mouse
  $(document.body).append('<img id="drag-image" src="app/img/nodes/'+img+'" style="position: absolute;'+
                                'width:'+width+'; height:'+height+'; left: -100px; top: -100px;" >');
  $(document).on("mousemove", appUtilities.dragImageMouseMoveHandler);
};

appUtilities.removeDragImage = function () {
  $("#drag-image").remove();
  $(document).off("mousemove", appUtilities.dragImageMouseMoveHandler);
};

appUtilities.getAllStyles = function () {
  var collapsedChildren = cy.expandCollapse('get').getAllCollapsedChildrenRecursively();
  var collapsedChildrenNodes = collapsedChildren.filter("node");
  var nodes = cy.nodes().union(collapsedChildrenNodes);
  var collapsedChildrenEdges = collapsedChildren.filter("edge");
  var edges = cy.edges().union(collapsedChildrenEdges);

  // first get all used colors, then deal with them and keep reference to them
  var colorUsed = appUtilities.getColorsFromElements(nodes, edges);

  var nodePropertiesToXml = {
    'background-color': 'fill',
    'background-opacity': 'background-opacity', // not an sbgnml XML attribute, but used with fill
    'border-color': 'stroke',
    'border-width': 'strokeWidth',
    'font-size': 'fontSize',
    'font-weight': 'fontWeight',
    'font-style': 'fontStyle',
    'font-family': 'fontFamily'
  };
  var edgePropertiesToXml = {
    'line-color': 'stroke',
    'width': 'strokeWidth'
  };

  function getStyleHash (element, properties) {
    var hash = "";
    for(var cssProp in properties){
      if (element.data(cssProp)) {
        hash += element.data(cssProp).toString();
      }
      else {
        hash += "";
      }
    }
    return hash;
  }

  function getStyleProperties (element, properties) {
    var props = {};
    for(var cssProp in properties){
      if (element.data(cssProp)) {
        //if it is a color property, replace it with corresponding id
        if (cssProp == 'background-color' || cssProp == 'border-color' || cssProp == 'line-color') {
          var validColor = appUtilities.elementValidColor(element, cssProp);
          var colorID = colorUsed[validColor];
          props[properties[cssProp]] = colorID;
        }
        else{
          props[properties[cssProp]] = element.data(cssProp);
        }
      }
    }
    return props;
  }

  // populate the style structure for nodes
  var styles = {}; // list of styleKey pointing to a list of properties and a list of nodes
  for(var i=0; i<nodes.length; i++) {
    var node = nodes[i];
    var styleKey = "node"+getStyleHash(node, nodePropertiesToXml);
    if (!styles.hasOwnProperty(styleKey)) { // new style encountered, init this new style
      var properties = getStyleProperties(node, nodePropertiesToXml);
      styles[styleKey] = {
        idList: [],
        properties: properties
      };
    }
    var currentNodeStyle = styles[styleKey];
    // add current node id to this style
    currentNodeStyle.idList.push(node.data('id'));
  }

  // populate the style structure for edges
  for(var i=0; i<edges.length; i++) {
    var edge = edges[i];
    var styleKey = "edge"+getStyleHash(edge, edgePropertiesToXml);
    if (!styles.hasOwnProperty(styleKey)) { // new style encountered, init this new style
      var properties = getStyleProperties(edge, edgePropertiesToXml);
      styles[styleKey] = {
        idList: [],
        properties: properties
      };
    }
    var currentEdgeStyle = styles[styleKey];
    // add current node id to this style
    currentEdgeStyle.idList.push(edge.data('id'));
  }

  var containerBgColor = $("#sbgn-network-container").css('background-color');
  if (containerBgColor == "transparent") {
    containerBgColor = "#ffffff";
  }
  else {
    containerBgColor = getXmlValidColor(containerBgColor);
  }

  return {
    colors: colorUsed,
    background: containerBgColor,
    styles: styles
  };
};

// accepts short or long hex or rgb color, return sbgnml compliant color value (= long hex)
// can optionnally convert opacity value and return a 8 characer hex color
function getXmlValidColor(color, opacity) {
  var finalColor = chroma(color).hex();
  if (typeof opacity === 'undefined') {
    return finalColor;
  }
  else { // append opacity as hex
    // see http://stackoverflow.com/questions/2877322/convert-opacity-to-hex-in-javascript
    return finalColor + Math.floor(opacity * 255).toString(16);
  }
}

appUtilities.elementValidColor = function (ele, colorProperty) {
  if (ele.data(colorProperty)) {
    if (colorProperty == 'background-color') { // special case, take in count the opacity
      if (ele.data('background-opacity')) {
        return getXmlValidColor(ele.data('background-color'), ele.data('background-opacity'));
      }
      else {
        return getXmlValidColor(ele.data('background-color'));
      }
    }
    else { // general case
      return getXmlValidColor(ele.data(colorProperty));
    }
  }
  else { // element don't have that property
    return undefined;
  }
};

/*
  returns: {
    xmlValid: id
  }
*/
appUtilities.getColorsFromElements = function (nodes, edges) {
  var colorHash = {};
  var colorID = 0;
  for(var i=0; i<nodes.length; i++) {
    var node = nodes[i];
    var bgValidColor = appUtilities.elementValidColor(node, 'background-color');
    if (!colorHash[bgValidColor]) {
      colorID++;
      colorHash[bgValidColor] = 'color_' + colorID;
    }

    var borderValidColor = appUtilities.elementValidColor(node, 'border-color');
    if (!colorHash[borderValidColor]) {
      colorID++;
      colorHash[borderValidColor] = 'color_' + colorID;
    }
  }
  for(var i=0; i<edges.length; i++) {
    var edge = edges[i];
    var lineValidColor = appUtilities.elementValidColor(edge, 'line-color');
    if (!colorHash[lineValidColor]) {
      colorID++;
      colorHash[lineValidColor] = 'color_' + colorID;
    }
  }
  return colorHash;
}

/**
 * updates current general properties and refreshes map
 * @mapProperties : a set of properties as object
 */
appUtilities.setMapProperties = function(mapProperties) {
  for (property in mapProperties){
    var value = mapProperties[property];
    // convert strings to correct appropriate types
    if (value == 'true' || value == 'false')  // if boolean
      appUtilities.currentGeneralProperties[property] = (value == 'true');
    else if (Number(value))  // if number
      appUtilities.currentGeneralProperties[property] = Number(value);
    else  // if string
      appUtilities.currentGeneralProperties[property] = value;
  }
    // refresh map with new settings
    chise.setShowComplexName(appUtilities.currentGeneralProperties.showComplexName);
    chise.refreshPaddings(); // Refresh/recalculate paddings

    if (appUtilities.currentGeneralProperties.enablePorts) {
      chise.enablePorts();
    }
    else {
      chise.disablePorts();
    }

    if (appUtilities.currentGeneralProperties.allowCompoundNodeResize) {
      chise.considerCompoundSizes();
    }
    else {
      chise.omitCompoundSizes();
    }

    cy.edges().css('arrow-scale', appUtilities.currentGeneralProperties.arrowScale);
    cy.style().update();
};

module.exports = appUtilities;
