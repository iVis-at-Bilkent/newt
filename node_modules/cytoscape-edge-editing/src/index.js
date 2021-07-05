;(function(){ 'use strict';
  
  var anchorPointUtilities = require('./anchorPointUtilities');
  var debounce = require("./debounce");
  
  // registers the extension on a cytoscape lib ref
  var register = function( cytoscape, $, Konva){
    var uiUtilities = require('./UIUtilities');
    
    if( !cytoscape || !$ || !Konva){ return; } // can't register if required libraries unspecified

    var defaults = {
      // A function parameter to get bend point positions, should return positions of bend points
      bendPositionsFunction: function(ele) {
        return ele.data('bendPointPositions');
      },
      // A function parameter to get control point positions, should return positions of control points
      controlPositionsFunction: function(ele) {
        return ele.data('controlPointPositions');
      },
      // A function parameter to set bend point positions
      bendPointPositionsSetterFunction: function(ele, bendPointPositions) {
        ele.data('bendPointPositions', bendPointPositions);
      },
      // A function parameter to set bend point positions
      controlPointPositionsSetterFunction: function(ele, controlPointPositions) {
        ele.data('controlPointPositions', controlPointPositions);
      },
      // whether to initilize bend and control points on creation of this extension automatically
      initAnchorsAutomatically: true,
      // the classes of those edges that should be ignored
      ignoredClasses: [],
      // whether the bend and control editing operations are undoable (requires cytoscape-undo-redo.js)
      undoable: false,
      // the size of bend and control point shape is obtained by multipling width of edge with this parameter
      anchorShapeSizeFactor: 3,
      // z-index value of the canvas in which bend and control points are drawn
      zIndex: 999,
      //An option that controls the distance within which a bend point is considered "near" the line segment between its two neighbors and will be automatically removed
      bendRemovalSensitivity : 8,
      // title of add bend point menu item (User may need to adjust width of menu items according to length of this option)
      addBendMenuItemTitle: "Add Bend Point",
      // title of remove bend point menu item (User may need to adjust width of menu items according to length of this option)
      removeBendMenuItemTitle: "Remove Bend Point",
      // title of remove all bend points menu item
      removeAllBendMenuItemTitle: "Remove All Bend Points",
      // title of add control point menu item (User may need to adjust width of menu items according to length of this option)
      addControlMenuItemTitle: "Add Control Point",
      // title of remove control point menu item (User may need to adjust width of menu items according to length of this option)
      removeControlMenuItemTitle: "Remove Control Point",
      // title of remove all control points menu item
      removeAllControlMenuItemTitle: "Remove All Control Points",
      // whether the bend and control points can be moved by arrows
      moveSelectedAnchorsOnKeyEvents: function () {
          return true;
      },
      // whether 'Remove all bend points' and 'Remove all control points' options should be presented
      enableMultipleAnchorRemovalOption: false,
      // specifically for edge-editing menu items, whether trailing dividers should be used
      useTrailingDividersAfterContextMenuOptions: false,
      // Enable / disable drag creation of anchor points when there is at least one anchor already on the edge
      enableCreateAnchorOnDrag: true
    };
    
    var options;
    var initialized = false;
    
    // Merge default options with the ones coming from parameter
    function extend(defaults, options) {
      var obj = {};

      for (var i in defaults) {
        obj[i] = defaults[i];
      }

      for (var i in options) {
        // SPLIT FUNCTIONALITY?
        if(i == "bendRemovalSensitivity"){
          var value = options[i];
           if(!isNaN(value))
           {
              if(value >= 0 && value <= 20){
                obj[i] = options[i];
              }else if(value < 0){
                obj[i] = 0
              }else{
                obj[i] = 20
              }
           }
        }else{
          obj[i] = options[i];
        }

      }

      return obj;
    };
    
    cytoscape( 'core', 'edgeEditing', function(opts){
      var cy = this;
      
      if( opts === 'initialized' ) {
        return initialized;
      }
      
      if( opts !== 'get' ) {
        // merge the options with default ones
        options = extend(defaults, opts);
        initialized = true;

        // define edgebendediting-hasbendpoints css class
        cy.style().selector('.edgebendediting-hasbendpoints').css({
          'curve-style': 'segments',
          'segment-distances': function (ele) {
            return anchorPointUtilities.getDistancesString(ele, 'bend');
          },
          'segment-weights': function (ele) {
            return anchorPointUtilities.getWeightsString(ele, 'bend');
          },
          'edge-distances': 'node-position'
        });

        // define edgecontrolediting-hascontrolpoints css class
        cy.style().selector('.edgecontrolediting-hascontrolpoints').css({
          'curve-style': 'unbundled-bezier',
          'control-point-distances': function (ele) {
            return anchorPointUtilities.getDistancesString(ele, 'control');
          },
          'control-point-weights': function (ele) {
            return anchorPointUtilities.getWeightsString(ele, 'control');
          },
          'edge-distances': 'node-position'
        });

        cy.style().selector("#nwt_reconnectEdge_dummy").css({
          'width' : '1',
          'height' : '1',
          'visibility' : 'hidden'
        });

        anchorPointUtilities.setIgnoredClasses(options.ignoredClasses);

        // init bend positions conditionally
        if (options.initAnchorsAutomatically) {
          // CHECK THIS, options.ignoredClasses UNUSED
          anchorPointUtilities.initAnchorPoints(options.bendPositionsFunction, options.controlPositionsFunction, cy.edges(), options.ignoredClasses);
        }

        uiUtilities(options, cy);
      }
      
      var instance = initialized ? {
        /*
        * get bend or control points of the given edge in an array A,
        * A[2 * i] is the x coordinate and A[2 * i + 1] is the y coordinate
        * of the ith bend point. (Returns undefined if the curve style is not segments nor unbundled bezier)
        */
        getAnchorsAsArray: function(ele) {
          return anchorPointUtilities.getAnchorsAsArray(ele);
        },
        // Initilize points for the given edges using 'options.bendPositionsFunction'
        initAnchorPoints: function(eles) {
          anchorPointUtilities.initAnchorPoints(options.bendPositionsFunction, options.controlPositionsFunction, eles);
        },
        deleteSelectedAnchor: function(ele, index) {
          anchorPointUtilities.removeAnchor(ele, index);
        },
        getEdgeType: function(ele) {
          return anchorPointUtilities.getEdgeType(ele);
        }
      } : undefined;

      return instance; // chainability
    } );

  };

  if( typeof module !== 'undefined' && module.exports ){ // expose as a commonjs module
    module.exports = register;
  }

  if( typeof define !== 'undefined' && define.amd ){ // expose as an amd/requirejs module
    define('cytoscape-edge-editing', function(){
      return register;
    });
  }

  if( typeof cytoscape !== 'undefined' && $ && Konva){ // expose to global cytoscape (i.e. window.cytoscape)
    register( cytoscape, $, Konva );
  }

})();
