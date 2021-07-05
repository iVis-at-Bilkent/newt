;(function(){ 'use strict';

	// registers the extension on a cytoscape lib ref
	var register = function(cytoscape){

		if(!cytoscape){ return; } // can't register if cytoscape unspecified
		require("./extend");

		// flag that indicates if extension api functions are registed to cytoscape
		// note that ideally these functions should not be directly registered to core from cytoscape.js
		// extensions
		var apiRegistered = false;

		var defaults = {
			// On/Off Modules
			/* From the following four snap options, at most one should be true at a given time */
			snapToGridOnRelease: true, // Snap to grid on release
			snapToGridDuringDrag: false, // Snap to grid during drag
			snapToAlignmentLocationOnRelease: false, // Snap to alignment location on release
			snapToAlignmentLocationDuringDrag: false, // Snap to alignment location during drag
			distributionGuidelines: false, //Distribution guidelines
			geometricGuideline: false, // Geometric guidelines
			initPosAlignment: false, // Guideline to initial mouse position
			centerToEdgeAlignment: false, // Center tı edge alignment
			resize: false, // Adjust node sizes to cell sizes
			parentPadding: false, // Adjust parent sizes to cell sizes by padding
			drawGrid: true, // Draw grid background

			// General
			gridSpacing: 20, // Distance between the lines of the grid.
			snapToGridCenter: true, // Snaps nodes to center of gridlines. When false, snaps to gridlines themselves.
			zoomDash: true, // Determines whether the size of the dashes should change when the drawing is zoomed in and out if grid is drawn.
			panGrid: false, // Determines whether the grid should move then the user moves the graph if grid is drawn.
			gridStackOrder: -1, // Namely z-index
			gridColor: '#dedede', // Color of grid lines
			lineWidth: 1.0, // Width of grid lines
			guidelinesStackOrder: 4, // z-index of guidelines
			guidelinesTolerance: 2.00, // Tolerance distance for rendered positions of nodes' interaction.
			guidelinesStyle: { // Set ctx properties of line. Properties are here:
				strokeStyle: "#8b7d6b", // color of geometric guidelines
				geometricGuidelineRange: 400, // range of geometric guidelines
				range: 100, // max range of distribution guidelines
				minDistRange: 10, // min range for distribution guidelines
				distGuidelineOffset: 10, // shift amount of distribution guidelines
				horizontalDistColor: "#ff0000", // color of horizontal distribution alignment
				verticalDistColor: "#00ff00", // color of vertical distribution alignment
				initPosAlignmentColor: "#0000ff", // color of alignment to initial location
				lineDash: [0, 0], // line style of geometric guidelines
				horizontalDistLine: [0, 0], // line style of horizontal distribıtion guidelines
				verticalDistLine: [0, 0], // line style of vertical distribıtion guidelines
				initPosAlignmentLine: [0, 0], // line style of alignment to initial mouse position
			},

			// Parent Padding
			parentSpacing: -1 // -1 to set paddings of parents to gridSpacing
		};
		var _snapOnRelease = require("./snap_on_release");
		var _snapToGridDuringDrag = require("./snap_during_drag");
		var _drawGrid = require("./draw_grid");
		var _resize = require("./resize");
		var _eventsController = require("./events_controller");
		var _guidelines = require("./guidelines");
		var _parentPadding = require("./parentPadding");
		var _alignment = require("./alignment");
		var debounce = require("./debounce");

		function getScratch(cy) {
			if (!cy.scratch("_gridGuide")) {
				cy.scratch("_gridGuide", { });
			}

			return cy.scratch("_gridGuide");
		}

		cytoscape( 'core', 'gridGuide', function(opts){
			var cy = this;

			// access the scratch pad for cy
			var scratchPad = getScratch(cy);

			// extend the already existing options for the instance or the default options
			var options = Object.extend({}, scratchPad.options || defaults, opts);

			// reset the options for the instance
			scratchPad.options = options;

			if (!scratchPad.initialized) {

				var snap, resize, snapToGridDuringDrag, drawGrid, eventsController, guidelines, parentPadding, alignment;

				snap = _snapOnRelease(cy, options.gridSpacing, options.snapToGridCenter);
				resize = _resize(options.gridSpacing);
				snapToGridDuringDrag = _snapToGridDuringDrag(cy, snap);
				drawGrid = _drawGrid(options, cy, debounce);
				guidelines = _guidelines(options, cy, debounce);
				parentPadding = _parentPadding(options, cy);

				eventsController = _eventsController(cy, snap, resize, snapToGridDuringDrag, drawGrid, guidelines, parentPadding, options);

				alignment = _alignment(cytoscape, cy, apiRegistered);

				// mark that api functions are registered to cytoscape
				apiRegistered = true;

				eventsController.init(options);

				// init params in scratchPad
				scratchPad.initialized = true;
				scratchPad.eventsController = eventsController;
			}
			else {
				var eventsController = scratchPad.eventsController;
				eventsController.syncWithOptions(options);
			}

			return this; // chainability
		} ) ;

	};

	if( typeof module !== 'undefined' && module.exports ){ // expose as a commonjs module
		module.exports = register;
	}

	if( typeof define !== 'undefined' && define.amd ){ // expose as an amd/requirejs module
		define('cytoscape-grid-guide', function(){
			return register;
		});
	}

	if( typeof cytoscape !== 'undefined' ){ // expose to global cytoscape (i.e. window.cytoscape)
		register( cytoscape );
	}

})();
