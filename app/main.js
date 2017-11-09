var chise = require('chise');
var sbgnviz = require('sbgnviz');
var filesaverjs = require('filesaverjs');
var konva = require('konva');
window.jQuery = window.jquery = window.$ = require('jquery'); // jquery should be global because jquery.qtip extension is not compatible with commonjs
var cytoscape = require('cytoscape');

require('jquery-expander')($);
require('bootstrap');

var appUtilities = require('./js/app-utilities');
var appMenu = require('./js/app-menu');

// Get cy extension instances
var cyPanzoom = require('cytoscape-panzoom');
//var cyQtip = require('cytoscape-qtip');
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
//cyQtip( cytoscape, $ );
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
cyNodeResize( cytoscape, $, konva );

// Libraries to pass sbgnviz
var libs = {};

libs.filesaverjs = filesaverjs;
libs.jquery = jquery;
libs.cytoscape = cytoscape;
libs.sbgnviz = sbgnviz;


$(document).ready(function () {

  // Register chise with libs
  chise.register(libs);

  // create a new tab and access the related chise.js instance
  var chiseInstance = appUtilities.createNewTab();

  // set the new chise.js instance as the active one (as it is the only instance so far)
  appUtilities.setActiveChiseInstance(chiseInstance);

  // appCy(); to be called inside appUtilities.createNewTab()
  appMenu();
});
