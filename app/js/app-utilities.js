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
  randomize: false,
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
  showGeometricGuidelines: false,
  showDistributionGuidelines: false,
  guidelineTolerance: 2.0,
  guidelineColor: "#0B9BCD",
  horizontalGuidelineColor: "#ff0000",
  verticalGuidelineColor: "#00ff00",
  geometricAlignmentRange: 450,
  distributionAlignmentRange: 300
};

appUtilities.currentGridProperties = jquery.extend(true, {}, appUtilities.defaultGridProperties);

appUtilities.defaultGeneralProperties = {
  compoundPadding: 10,
  dynamicLabelSize: 'regular',
  fitLabelsToNodes: false,
  rearrangeAfterExpandCollapse: true,
  animateOnDrawingChanges: true,
  adjustNodeLabelFontSizeAutomatically: false,
  mapColorScheme: 'opposed_red_blue'
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
  var extendedList = chise.elementUtilities.extendNodeList(eles);
  chise.showAndPerformLayout(extendedList, this.triggerIncrementalLayout.bind(this));
};

appUtilities.mapColorSchemes = mapColorSchemes = {
  'black_white': {
    'name': 'Black and white',
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
      'and operator': '#ffffff',
      'or operator': '#ffffff',
      'not operator': '#ffffff',
      'and': '#ffffff',
      'or': '#ffffff',
      'not': '#ffffff',
      'compartment': '#ffffff'
    }
  },
  'greyscale': {
    'name': 'Greyscale',
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
      'and operator': '#ffffff',
      'or operator': '#ffffff',
      'not operator': '#ffffff',
      'and': '#ffffff',
      'or': '#ffffff',
      'not': '#ffffff',
      'compartment': '#f0f0f0'
    }
  },
  'inverse_greyscale': {
    'name': 'Inverse greyscale',
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
      'and operator': '#ffffff',
      'or operator': '#ffffff',
      'not operator': '#ffffff',
      'and': '#ffffff',
      'or': '#ffffff',
      'not': '#ffffff',
      'compartment': '#bdbdbd'
    }
  },
  'blue_scale': {
    'name': 'Blue scale',
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
      'and operator': '#ffffff',
      'or operator': '#ffffff',
      'not operator': '#ffffff',
      'and': '#ffffff',
      'or': '#ffffff',
      'not': '#ffffff',
      'compartment': '#eff3ff'
    }
  },
  'inverse_blue_scale': {
    'name': 'Inverse blue scale',
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
      'and operator': '#ffffff',
      'or operator': '#ffffff',
      'not operator': '#ffffff',
      'and': '#ffffff',
      'or': '#ffffff',
      'not': '#ffffff',
      'compartment': '#9ecae1'
    }
  },
  'opposed_red_blue': {
    'name': 'Red blue',
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
      'and operator': '#ffffff',
      'or operator': '#ffffff',
      'not operator': '#ffffff',
      'and': '#ffffff',
      'or': '#ffffff',
      'not': '#ffffff',
      'compartment': '#f7f7f7'
    }
  },
  'opposed_red_blue2': {
    'name': 'Red blue 2',
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
      'and operator': '#ffffff',
      'or operator': '#ffffff',
      'not operator': '#ffffff',
      'and': '#ffffff',
      'or': '#ffffff',
      'not': '#ffffff',
      'compartment': '#f7f7f7'
    }
  },
  'opposed_green_brown': {
    'name': 'Green brown',
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
      'and operator': '#ffffff',
      'or operator': '#ffffff',
      'not operator': '#ffffff',
      'and': '#ffffff',
      'or': '#ffffff',
      'not': '#ffffff',
      'compartment': '#f5f5f5'
    }
  },
  'opposed_green_brown2': {
    'name': 'Green brown 2',
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
      'and operator': '#ffffff',
      'or operator': '#ffffff',
      'not operator': '#ffffff',
      'and': '#ffffff',
      'or': '#ffffff',
      'not': '#ffffff',
      'compartment': '#f5f5f5'
    }
  }
}
// set multimers to be the same as their original elements
// just to avoid typing it manually in the mapColorSchemes dictionary
for(var scheme in mapColorSchemes){
  mapColorSchemes[scheme]['values']['nucleic acid feature multimer'] = mapColorSchemes[scheme]['values']['nucleic acid feature'];
  mapColorSchemes[scheme]['values']['macromolecule multimer'] = mapColorSchemes[scheme]['values']['macromolecule'];
  mapColorSchemes[scheme]['values']['simple chemical multimer'] = mapColorSchemes[scheme]['values']['simple chemical'];
  mapColorSchemes[scheme]['values']['complex multimer'] = mapColorSchemes[scheme]['values']['complex'];
}

// change the global style of the map by applying the current color scheme
appUtilities.applyMapColorScheme = function() {
  console.log("Change map color scheme");

  // edit style of the current map elements
  var eles = cy.nodes();
  for( var i = 0; i < eles.length; i++ ){
    nodeClass = eles[i].data().class;
    classBgColor = mapColorSchemes[appUtilities.currentGeneralProperties.mapColorScheme]['values'][nodeClass];
    eles[i].style('background-color', classBgColor);
    eles[i].style('background-opacity', 1);
  }

  // set to be the default as well
  for(var nodeClass in mapColorSchemes[appUtilities.currentGeneralProperties.mapColorScheme]['values']){
    classBgColor = mapColorSchemes[appUtilities.currentGeneralProperties.mapColorScheme]['values'][nodeClass];
    // nodeClass may not be defined in the defaultProperties (for edges, for example)
    if(nodeClass in chise.elementUtilities.defaultProperties){
      chise.elementUtilities.defaultProperties[nodeClass]['background-color'] = classBgColor;
      chise.elementUtilities.defaultProperties[nodeClass]['background-opacity'] = 1;
    }
  }
}

module.exports = appUtilities;
