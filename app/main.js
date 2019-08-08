var chise = require('chise');
var sbgnviz = require('sbgnviz');
var filesaverjs = require('filesaverjs');
var konva = require('konva');
var tippy = require('tippy.js');
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
var cyEdgeEditing = require('cytoscape-edge-editing');
var cyViewUtilities = require('cytoscape-view-utilities');
var cyEdgehandles = require('cytoscape-edgehandles');
var cyGridGuide = require('cytoscape-grid-guide');
var cyAutopanOnDrag = require('cytoscape-autopan-on-drag');
var cyNodeResize = require('cytoscape-node-resize');
var cyPopper = require('cytoscape-popper');

// Register cy extensions
cyPanzoom( cytoscape, $ );
//cyQtip( cytoscape, $ );
cyCoseBilkent( cytoscape );
cyUndoRedo( cytoscape );
cyClipboard( cytoscape, $ );
cyContextMenus( cytoscape, $ );
cyExpandCollapse( cytoscape, $ );
cyEdgeEditing( cytoscape, $ );
cyViewUtilities( cytoscape, $ );
cyEdgehandles( cytoscape );
cyGridGuide( cytoscape, $ );
cyAutopanOnDrag( cytoscape );
cyNodeResize( cytoscape, $, konva );
cyPopper( cytoscape );

// Libraries to pass sbgnviz
var libs = {};

libs.filesaverjs = filesaverjs;
libs.jquery = jquery;
libs.cytoscape = cytoscape;
libs.sbgnviz = sbgnviz;
libs.tippy = tippy;


$(document).ready(function () {

  // Register chise with libs
  chise.register(libs);

  appMenu();

  // create a new network and access the related chise.js instance
  appUtilities.createNewNetwork();

  // launch with model file if exists
  appUtilities.launchWithModelFile();
});
