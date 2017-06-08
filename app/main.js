var chise = require('chise');
var sbgnviz = require('sbgnviz');
var filesaverjs = require('filesaverjs');
window.jQuery = window.jquery = window.$ = require('jquery'); // jquery should be global because jquery.qtip extension is not compatible with commonjs
var cytoscape = require('cytoscape');

require('jquery-expander')($);
require('bootstrap');

appUtilities = require('./js/app-utilities');
var appUndoActions = require('./js/app-undo-actions');
var appCy = require('./js/app-cy');
var appMenu = require('./js/app-menu');

// Get cy extension instances
var cyPanzoom = require('cytoscape-panzoom');
var cyQtip = require('cytoscape-qtip');
var cyCoseBilkent = require('cytoscape-cose-bilkent');
var cyUndoRedo = require('cytoscape-undo-redo');
var cyClipboard = require('cytoscape-clipboard');
var cyContextMenus = require('cytoscape-context-menus');
var cyExpandCollapse = require('cytoscape-expand-collapse');
var cyEdgeBendEditing = require('cytoscape-edge-bend-editing');
var cyViewUtilities = require('cytoscape-view-utilities');
var cyEdgehandles = require('cytoscape-edgehandles');
var cyGridGuide = require('cytoscape-grid-guide');
var cyAutopanOnDrag = require('cytoscape-autopan-on-drag');
var cyNodeResize = require('cytoscape-node-resize');

// Register cy extensions
cyPanzoom( cytoscape, $ );
cyQtip( cytoscape, $ );
cyCoseBilkent( cytoscape );
cyUndoRedo( cytoscape );
cyClipboard( cytoscape, $ );
cyContextMenus( cytoscape, $ );
cyExpandCollapse( cytoscape, $ );
cyEdgeBendEditing( cytoscape, $ );
cyViewUtilities( cytoscape, $ );
cyEdgehandles( cytoscape );
cyGridGuide( cytoscape );
cyAutopanOnDrag( cytoscape );
cyNodeResize( cytoscape, $ );

// Libraries to pass sbgnviz
var libs = {};

libs.filesaverjs = filesaverjs;
libs.jquery = jquery;
libs.cytoscape = cytoscape;
libs.sbgnviz = sbgnviz;

chise({
  networkContainerSelector: '#sbgn-network-container',
  imgPath: 'node_modules/sbgnviz/src/img',
  // whether to fit label to nodes
  fitLabelsToNodes: function () {
    return appUtilities.currentGeneralProperties.fitLabelsToNodes;
  },
  // dynamic label size it may be 'small', 'regular', 'large'
  dynamicLabelSize: function () {
    return appUtilities.currentGeneralProperties.dynamicLabelSize;
  },
  // percentage used to calculate compound paddings
  compoundPadding: function () {
    return appUtilities.currentGeneralProperties.compoundPadding;
  },
  extraCompartmentPadding: appUtilities.currentGeneralProperties.extraCompartmentPadding,
  extraComplexPadding: appUtilities.currentGeneralProperties.extraComplexPadding,
  showComplexName: appUtilities.currentGeneralProperties.showComplexName,
  // Whether to adjust node label font size automatically.
  // If this option return false do not adjust label sizes according to node height uses node.data('labelsize')
  // instead of doing it.
  adjustNodeLabelFontSizeAutomatically: function() {
    return appUtilities.currentGeneralProperties.adjustNodeLabelFontSizeAutomatically;
  },
  undoable: appUtilities.undoable,
  undoableDrag: function() {
    return appUtilities.ctrlKeyDown !== true;
  }
}, libs);

appCy();
appMenu();
