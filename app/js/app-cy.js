var jquery = $ = require('jquery');
var appUtilities = require('./app-utilities');
var modeHandler = require('./app-mode-handler');
var inspectorUtilities = require('./inspector-utilities');
var appUndoActionsFactory = require('./app-undo-actions-factory');
var _ = require('underscore');
var Tippy = require('tippy.js');

module.exports = function (chiseInstance) {
  var getExpandCollapseOptions = appUtilities.getExpandCollapseOptions.bind(appUtilities);
//  var nodeQtipFunction = appUtilities.nodeQtipFunction.bind(appUtilities);
  var refreshUndoRedoButtonsStatus = appUtilities.refreshUndoRedoButtonsStatus.bind(appUtilities);

  // use chise instance associated with chise instance
  var cy = chiseInstance.getCy();

  // register extensions and bind events when cy is ready
  cy.ready(function () {
    cytoscapeExtensionsAndContextMenu();
    bindCyEvents();
    cy.style().selector('core').style({'active-bg-opacity': 0});
    // If undo extension, register undo/redo actions
    if (appUtilities.undoable) {
      registerUndoRedoActions();
    }
  });

  function registerUndoRedoActions() { // only if undoRedo is set
    // get ur extension instance for cy
    var ur = cy.undoRedo();

    // generate an instance of app undo actions with related cy
    var appUndoActions = appUndoActionsFactory(cy);

    // bind ur actions
    ur.action("changeDataDirty", appUndoActions.changeDataDirty, appUndoActions.changeDataDirty);
    ur.action("changeMenu", appUndoActions.changeMenu, appUndoActions.changeMenu);
    ur.action("refreshColorSchemeMenu", appUndoActions.refreshColorSchemeMenu, appUndoActions.refreshColorSchemeMenu);
    ur.action("relocateInfoBoxes", appUndoActions.relocateInfoBoxes, appUndoActions.relocateInfoBoxes);
    ur.action("applySIFTopologyGrouping", appUndoActions.applySIFTopologyGrouping, appUndoActions.applySIFTopologyGrouping);
  }

  function cytoscapeExtensionsAndContextMenu() {
    cy.expandCollapse(getExpandCollapseOptions(cy));

    var contextMenus = cy.contextMenus({
      menuItemClasses: ['custom-menu-item'],
    });

    cy.autopanOnDrag();

    cy.edgeEditing({
      // this function specifies the positions of bend points
      bendPositionsFunction: function (ele) {
        return ele.data('bendPointPositions');
      },
      // whether the bend editing operations are undoable (requires cytoscape-undo-redo.js)
      undoable: appUtilities.undoable,
      // title of remove bend point menu item
      removeBendMenuItemTitle: "Delete Bend Point",
      // whether to initilize bend points on creation of this extension automatically
      initBendPointsAutomatically: false,
      // function to validate edge source and target on reconnection
      validateEdge: chiseInstance.elementUtilities.validateArrowEnds,
      // function to be called on invalid edge reconnection
      actOnUnsuccessfulReconnection: function () {
        if(appUtilities.promptInvalidEdgeWarning){
          appUtilities.promptInvalidEdgeWarning.render();
        }
      },
      // function that handles edge reconnection
      handleReconnectEdge: chiseInstance.elementUtilities.addEdge,
    });

    contextMenus.appendMenuItems([
      {
        id: 'ctx-menu-general-properties',
        content: 'Properties...',
        image: {src : "app/img/toolbar/settings.svg", width : 16, height : 16, x : 2, y : 3},
        coreAsWell: true,
        onClickFunction: function (event) {
          $("#general-properties").trigger("click");
        }
      },
      {
        id: 'ctx-menu-delete',
        content: 'Delete',
        image: {src : "app/img/toolbar/delete-simple.svg", width : 16, height : 16, x : 2, y : 3},
        selector: 'node, edge',
        onClickFunction: function (event) {
          cy.undoRedo().do("deleteElesSimple", {
            eles: event.target || event.cyTarget
          });
          $('#inspector-palette-tab a').tab('show');
        }
      },
      {
        id: 'ctx-menu-delete-selected',
        content: 'Delete Selected',
        image: {src : "app/img/toolbar/delete-simple.svg", width : 16, height : 16, x : 2, y : 3},
        onClickFunction: function () {
          $("#delete-selected-simple").trigger('click');
        },
        coreAsWell: true // Whether core instance have this item on cxttap
      },
      {
        id: 'ctx-menu-hide-selected',
        content: 'Hide Selected',
        image: {src : "app/img/toolbar/hide-selected.svg", width : 16, height : 16, x : 2, y : 3},
        onClickFunction: function () {
          $("#hide-selected").trigger('click');
        },
        coreAsWell: true // Whether core instance have this item on cxttap
      },
      {
        id: 'ctx-menu-show-all',
        content: 'Show All',
        image: {src : "app/img/toolbar/show-all.svg", width : 16, height : 16, x : 2, y : 3},
        onClickFunction: function () {
          $("#show-all").trigger('click');
        },
        coreAsWell: true // Whether core instance have this item on cxttap
      },
      {
        id: 'ctx-menu-collapse-complexes',
        content: 'Collapse Complexes',
        onClickFunction: function () {
          $("#collapse-complexes").trigger('click');
        },
        coreAsWell: true // Whether core instance have this item on cxttap
      },
      {
        id: 'ctx-menu-highlight-selected',
        content: 'Highlight Selected',
        image: {src : "app/img/toolbar/highlight-selected.svg", width : 16, height : 16, x : 2, y : 3},
        onClickFunction: function () {
          $("#highlight-selected").trigger('click');
        },
        coreAsWell: true // Whether core instance have this item on cxttap
      },
      {
        id: 'ctx-menu-zoom-to-selected',
        content: 'Zoom to Selected',
        onClickFunction: function() {
          $("#zoom-to-selected").trigger('click');
        },
        coreAsWell: true
      },
      {
        id: 'ctx-menu-expand', // ID of menu item
        content: 'Expand', // Title of menu item
        image: {src : "app/img/toolbar/expand-selected.svg", width : 16, height : 16, x : 2, y : 3},
        // Filters the elements to have this menu item on cxttap
        // If the selector is not truthy no elements will have this menu item on cxttap
        selector: 'node.cy-expand-collapse-collapsed-node',
        onClickFunction: function (event) { // The function to be executed on click
          cy.undoRedo().do("expand", {
            nodes: event.target || event.cyTarget
          });
        }
      },
      {
        id: 'ctx-menu-collapse',
        content: 'Collapse',
        image: {src : "app/img/toolbar/collapse-selected.svg", width : 16, height : 16, x : 2, y : 3},
        selector: 'node:parent[class!="topology group"]',
        onClickFunction: function (event) {
          cy.undoRedo().do("collapse", {
            nodes: event.target || event.cyTarget
          });
        }
      },
      {
        id: 'ctx-menu-perform-layout',
        content: 'Perform Layout',
        image: {src : "app/img/toolbar/layout-cose.svg", width : 16, height : 16, x : 2, y : 3},
        onClickFunction: function () {
          $("#perform-layout").trigger('click');
        },
        coreAsWell: true // Whether core instance have this item on cxttap
      },
      {
        id: 'ctx-menu-select-all-object-of-this-type',
        content: 'Select Objects of This Type',
        selector: 'node, edge',
        onClickFunction: function (event) {
          var cyTarget = event.target || event.cyTarget;
          var sbgnclass = cyTarget.data('class');

          cy.elements().unselect();
          cy.elements('[class="' + sbgnclass + '"]').select();
        }
      },
      {
        id: 'ctx-menu-show-hidden-neighbors',
        content: 'Show Hidden Neighbors',
        selector: 'node[thickBorder]',
        onClickFunction: function (event) {
          var cyTarget = event.target || event.cyTarget;
          appUtilities.showHiddenNeighbors(cyTarget, appUtilities.getChiseInstance(cy));
        }
      },
      {
        id: 'ctx-menu-highlight-neighbors',
        content: 'Highlight Neighbors',
        selector: 'node[class="process"],[class="omitted process"],[class="uncertain process"],[class="association"],[class="dissociation"]',
        onClickFunction: function (event) {
          var cyTarget = event.target || event.cyTarget;
          cyTarget.select();
          $("#highlight-neighbors-of-selected").trigger('click');
        }
      },
      {
        id: 'ctx-menu-highlight-processes',
        content: 'Highlight Processes',
        selector: 'node[class="unspecified entity"],[class^="simple chemical"],[class^="macromolecule"],[class^="nucleic acid feature"],[class^="complex"]',
        onClickFunction: function (event) {
          var cyTarget = event.target || event.cyTarget;
          cyTarget.select();
          $("#highlight-processes-of-selected").trigger('click');
        }
      },
      {
        id: 'ctx-menu-animate-edge',
        content: 'Navigate to Other End',
        selector: 'edge',
        onClickFunction: function (event) {
          var cyTarget = event.target || event.cyTarget;
          appUtilities.navigateToOtherEnd(cyTarget, event.renderedPosition, event.position);
        }
      },
      {
        id: 'ctx-menu-convert-into-reversible',
        content: 'Convert into Reversible Reaction',
        selector: 'node[class="process"]',
        onClickFunction: function (event) {
          var cyTarget = event.target || event.cyTarget;
          var consumptionEdges = cyTarget._private.edges.filter(edge => edge._private.data.class === "consumption");

          if (consumptionEdges.length > 0) {
            var ur = cy.undoRedo();
            ur.do("convertIntoReversibleReaction", {processId: cyTarget.id(), collection: consumptionEdges, mapType: "Unknown"});
          }
          var currentArrowScale = Number($('#arrow-scale').val());
          cyTarget.connectedEdges().style('arrow-scale', currentArrowScale);
        }
      },
      {
        id: 'ctx-menu-relocate-info-boxes',
        content: 'Relocate Information Boxes',
        selector: 'node[class^="macromolecule"],[class^="complex"],[class^="simple chemical"],[class^="nucleic acid feature"],[class^="compartment"],[class="protein"],[class="small macromolecule"]',
        onClickFunction: function (event){
          var cyTarget = event.target || event.cyTarget;
          appUtilities.relocateInfoBoxes(cyTarget);
        }
      },
      {
        id: 'ctx-menu-tile-info-boxes',
        content: 'Tile Information Boxes',
        selector: 'node[class^="macromolecule"],[class^="complex"],[class^="simple chemical"],[class^="nucleic acid feature"],[class^="compartment"],[class="protein"],[class="small macromolecule"]',
        onClickFunction: function (event){
          var cyTarget = event.target || event.cyTarget;
          var locations = ["top", "bottom", "right", "left"]; //Fit all locations
          chiseInstance.fitUnits(cyTarget, locations); //Force fit
        }
      },
      {
        id: 'ctx-menu-fit-content-into-node',
        content: 'Resize Node to Content',
        selector: 'node[class^="macromolecule"],[class^="complex"],[class^="simple chemical"],[class^="nucleic acid feature"],' +
        '[class^="unspecified entity"], [class^="perturbing agent"],[class^="phenotype"],[class^="tag"],[class^="compartment"],[class^="submap"],[class^="BA"],[class="protein"],[class="small macromolecule"]',
        onClickFunction: function (event) {
            var cyTarget = event.target || event.cyTarget;
            //Collection holds the element and is used to generalize resizeNodeToContent function (which is used from Edit-> Menu)
            var collection = cy.collection();
            collection = collection.add(cyTarget);
            appUtilities.resizeNodesToContent(collection);
        }
      },
      {
        id: 'ctx-menu-query-pcids',
        content: 'Query PC IDs',
        selector: 'edge',
        onClickFunction: function (event) {
          var edge = event.target || event.cyTarget;
          var qUrl = 'http://www.pathwaycommons.org/pc2/get?';
          var pcIDSet = edge.data( 'pcIDSet' );

          for ( var pcID in pcIDSet ) {
            qUrl += ( 'uri=' + pcID + '&' );
          }

          qUrl += 'format=sbgn';

          $.ajax({
            type: 'get',
            url: "/utilities/testURL",
            data: { url: qUrl },
            success: function( data ) {
              if (!data.error && data.response.statusCode == 200 && data.response.body) {
                var xml = $.parseXML(data.response.body);
                appUtilities.createNewNetwork();
                var activeChise = appUtilities.getActiveChiseInstance();
                activeChise.updateGraph(chiseInstance.convertSbgnmlToJson(xml), undefined, true);
              }
            },
            error: function(xhr, options, err){
              console.log( err );
            }
          });
        }
      },
    ]);

    cy.clipboard({
      clipboardSize: 5, // Size of clipboard. 0 means unlimited. If size is exceeded, first added item in clipboard will be removed.
      shortcuts: {
        enabled: true, // Whether keyboard shortcuts are enabled
        undoable: appUtilities.undoable // and if undoRedo extension exists
      },
      afterPaste: function(eles) {
        eles.nodes().forEach(function(ele){
          // skip nodes without any auxiliary units
          if(!ele.data('statesandinfos') || ele.data('statesandinfos').length == 0) {
            return;
          }

          // Defined to get index of an auxilary unit in statesandinfos array.
          // Since during clone operation the reference of object is changed we cannot use .indexOf() method
          // Instead we compare the objects by stringifing them. However, string representation of the objects may be the same.
          // To prevent conflictions in such cases we need to keep used incdices here and pass the already used indices.
          var usedIndices = {};

          // maintain consistency of layouts, and infoboxes through them
          // we need to replace the layouts contained in ele by new cloned layouts
          var globalInfoboxCount = 0;
          for(var side in ele.data('auxunitlayouts')) {
            var layout = ele.data('auxunitlayouts')[side];
            var newLayout = chiseInstance.classes.AuxUnitLayout.copy(layout, cy, ele); // get a new layout

            // copy each infobox of the layout
            for(var i=0; i < layout.units.length; i++) {
              var auxunit = layout.units[i];
              var auxunitStr = JSON.stringify(auxunit);
              // keep the new infobox at exactly the same position in the statesandinfos list
              // var statesandinfosIndex = ele.data('statesandinfos').indexOf(auxunit);

              var statesandinfos = ele.data('statesandinfos');

              // keep the new infobox at exactly the same position in the statesandinfos list
              var statesandinfosIndex;

              // Go through the not used indices of statesandinfos to get the index of aucilary unit
              for (var j = 0; j < statesandinfos.length; j++) {
                // Already used pass it
                if (usedIndices[j]) {
                  continue;
                }

                var currentBox = statesandinfos[j];

                // Found out the correct index
                if (JSON.stringify(currentBox) === auxunitStr) {
                  usedIndices[j] = true;
                  statesandinfosIndex = j;
                  break;
                }
              }

              // copy the current infobox
              var newAuxunit = chiseInstance.classes.getAuxUnitClass(auxunit).copy(auxunit, cy, ele, ele.data('id') + "_" + globalInfoboxCount);
              // update statesandinfos list
              ele.data('statesandinfos')[statesandinfosIndex] = newAuxunit;
              // update layout's infobox list
              newLayout.units[i] = newAuxunit;
              globalInfoboxCount++;
            }
            // update layout
            ele.data('auxunitlayouts')[side] = newLayout;
          }
        });
      }
    });

    // local utility function to avoid code duplication
    function highlightColor(ele) {
      if (ele.selected()){
        return '#d67614'; // default select color
      }
      else {
        return '#0B9BCD'; // highlight color
      }
    };
    cy.viewUtilities({
      node: {
        highlighted: { // styles for when nodes are highlighted.
          'border-width': function(ele) {
            return Math.max(parseFloat(ele.data('border-width')) + 2, 3);
          },
          'border-color': highlightColor
        },
        unhighlighted: {// styles for when nodes are unhighlighted.
          'opacity': function (ele) {
            // We return the same opacity because to override the unhibhlighted ele opacity in view-utilities
            return ele.css('opacity');
          }
        }
      },
      edge: {
        highlighted: {
          'width': function(ele) { // styles for when edges are highlighted.
            return parseFloat(ele.data('width')) + 2;
          },
          'line-color': highlightColor,
          'source-arrow-color': highlightColor,
          'target-arrow-color': highlightColor
        },
        unhighlighted: {// styles for when edges are unhighlighted.
          'opacity': function (ele) {
            // We return the same opacity because to override the unhibhlighted ele opacity in view-utilities
            return ele.css('opacity');
          }
        }
      },
      neighbor: function(node){ //select and return process-based neighbors
        var nodesToSelect = node;
        if(chiseInstance.elementUtilities.isPNClass(node) || chiseInstance.elementUtilities.isLogicalOperator(node)){
            nodesToSelect = nodesToSelect.union(node.openNeighborhood());
        }
        node.openNeighborhood().forEach(function(ele){
            if(chiseInstance.elementUtilities.isPNClass(ele) || chiseInstance.elementUtilities.isLogicalOperator(ele)){
                nodesToSelect = nodesToSelect.union(ele.closedNeighborhood());
                ele.openNeighborhood().forEach(function(ele2){
                    if(chiseInstance.elementUtilities.isPNClass(ele2) || chiseInstance.elementUtilities.isLogicalOperator(ele2)){
                        nodesToSelect = nodesToSelect.union(ele2.closedNeighborhood());
                    }
                });
            }
        });
        return nodesToSelect;
      },
      neighborSelectTime: 500 //ms
    });

    cy.nodeResize({
      padding: 2, // spacing between node and grapples/rectangle
      undoable: appUtilities.undoable, // and if cy.undoRedo exists

      grappleSize: 7, // size of square dots
      grappleColor: "#d67614", // color of grapples
      inactiveGrappleStroke: "inside 1px #d67614",
      boundingRectangle: true, // enable/disable bounding rectangle
      boundingRectangleLineDash: [1.5, 1.5], // line dash of bounding rectangle
      boundingRectangleLineColor: "darkgray",
      boundingRectangleLineWidth: 1.5,
      zIndex: 999,
      getCompoundMinWidth: function(node) {
        return node.data('minWidth') || 0;
      },
      getCompoundMinHeight: function(node) {
        return node.data('minHeight') || 0;
      },
      getCompoundMinWidthBiasRight: function(node) {
        return node.data('minWidthBiasRight') || 0;
      },
      getCompoundMinWidthBiasLeft: function(node) {
        return node.data('minWidthBiasLeft') || 0;
      },
      getCompoundMinHeightBiasTop: function(node) {
        return node.data('minHeightBiasTop') || 0;
      },
      getCompoundMinHeightBiasBottom: function(node) {
        return node.data('minHeightBiasBottom') || 0;
      },
      setWidth: function(node, width) {
        var bbox = node.data('bbox');
        bbox.w = width;
        node.data('bbox', bbox);
      },
      setHeight: function(node, height) {
        var bbox = node.data('bbox');
        bbox.h = height;
        node.data('bbox', bbox);
      },
      setCompoundMinWidth: function(node, minWidth) {
        node.data('minWidth', minWidth);
      },
      setCompoundMinHeight: function(node, minHeight) {
        node.data('minHeight', minHeight);
      },
      setCompoundMinWidthBiasLeft: function(node, minWidthBiasLeft) {
        node.data('minWidthBiasLeft', minWidthBiasLeft);
      },
      setCompoundMinWidthBiasRight: function(node, minHeightBiasRight) {
        node.data('minWidthBiasRight', minHeightBiasRight);
      },
      setCompoundMinHeightBiasTop: function(node, minHeightBiasTop) {
        node.data('minHeightBiasTop', minHeightBiasTop);
      },
      setCompoundMinHeightBiasBottom: function(node, minHeightBiasBottom) {
        node.data('minHeightBiasBottom', minHeightBiasBottom);
      },
      minWidth: function (node) {
        var data = node.data("resizeMinWidth");
        return data ? data : 10;
      }, // a function returns min width of node
      minHeight: function (node) {
        var data = node.data("resizeMinHeight");
        return data ? data : 10;
      }, // a function returns min height of node

      isFixedAspectRatioResizeMode: function (node) {
        //Initially checks if Aspect ratio in Object properties is checked
        if (appUtilities.nodeResizeUseAspectRatio)
            return true;
        //Otherwise it checks 'processes', 'and', 'or' etc. which have fixedAspectRatio as default
        var sbgnclass = node.data("class");
        return chiseInstance.elementUtilities.mustBeSquare(sbgnclass);
      }, // with only 4 active grapples (at corners)
      isNoResizeMode: function (node) {
        var currentGeneralProperties = appUtilities.getScratch(cy, 'currentGeneralProperties');
        return node.is(':parent') && !currentGeneralProperties.allowCompoundNodeResize;
      }, // no active grapples

      cursors: {// See http://www.w3schools.com/cssref/tryit.asp?filename=trycss_cursor
        // May take any "cursor" css property
        default: "default", // to be set after resizing finished or mouseleave
        inactive: "url('app/img/cancel.svg') 6 6, not-allowed",
        nw: "nw-resize",
        n: "n-resize",
        ne: "ne-resize",
        e: "e-resize",
        se: "se-resize",
        s: "s-resize",
        sw: "sw-resize",
        w: "w-resize"
      },

      resizeToContentCueEnabled: function (node){
        var enabled_classes = ["macromolecule", "complex", "simple chemical", "nucleic acid feature",
          "unspecified entity", "perturbing agent", "phenotype", "tag", "compartment", "submap", "BA"];
        var node_class = node.data('class');
        var result = false;

        enabled_classes.forEach(function(enabled_class){
          if(node_class.indexOf(enabled_class) > -1)
            result = true;
        });

        return result && !chiseInstance.elementUtilities.isResizedToContent(node) && (cy.zoom() > 0.5);
      },
      resizeToContentFunction: appUtilities.resizeNodesToContent,
      resizeToContentCuePosition: 'bottom-right',
    });

    //For adding edges interactively
    cy.edgehandles({
      // fired when edgehandles is done and entities are added
      complete: function (sourceNode, targetNodes, addedEntities) {
        if (!targetNodes) {
          return;
        }

        var modeProperties = appUtilities.getScratch(cy, 'modeProperties');

        // We need to remove interactively added entities because we should add the edge with the chise api
        addedEntities.remove();

        /*
         * If in add edge mode create an edge
         */
        if (modeProperties.mode === 'add-edge-mode') {
          // fired when edgehandles is done and entities are added
          var source = sourceNode.id();
          var target = targetNodes[0].id();
          var edgeParams = {class : modeProperties.selectedEdgeType, language : modeProperties.selectedEdgeLanguage};
          var promptInvalidEdge = function(){
            appUtilities.promptInvalidEdgeWarning.render();
          }

          // if added edge changes map type, warn user
          if (chiseInstance.getMapType() && chiseInstance.getMapType() != "Unknown" && edgeParams.language != chiseInstance.getMapType()){
            appUtilities.promptMapTypeView.render(function(){
                chiseInstance.addEdge(source, target, edgeParams, promptInvalidEdge);
                var addedEdge = cy.elements()[cy.elements().length - 1];
                var currentArrowScale = Number($('#arrow-scale').val());
                addedEdge.style('arrow-scale', currentArrowScale);
            });
          }
          else{
              chiseInstance.addEdge(source, target, edgeParams, promptInvalidEdge);
              var addedEdge = cy.elements()[cy.elements().length - 1];
              var currentArrowScale = Number($('#arrow-scale').val());
              addedEdge.style('arrow-scale', currentArrowScale);
          }

          // If not in sustain mode set selection mode
          if (!modeProperties.sustainMode) {
            modeHandler.setSelectionMode();
          }
        }

      },
      loopAllowed: function( node ) {
        // for the specified node, return whether edges from itself to itself are allowed
        return false;
      },
      toggleOffOnLeave: true, // whether an edge is cancelled by leaving a node (true), or whether you need to go over again to cancel (false; allows multiple edges in one pass)
      handleSize: 0, // the size of the edge handle put on nodes (Note that it is 0 because we do not want to see the handle)
      handleHitThreshold: 0,
    });

    cy.edgehandles('drawoff');

    var gridProperties = appUtilities.getScratch(cy, 'currentGridProperties');

    cy.gridGuide({
      drawGrid: gridProperties.showGrid,
      gridColor: gridProperties.gridColor,
      snapToGridOnRelease: gridProperties.snapToGridOnRelease,
      snapToGridDuringDrag: gridProperties.snapToGridDuringDrag,
      gridSpacing: gridProperties.gridSize,
      resize: gridProperties.autoResizeNodes,
      guidelines: gridProperties.showAlignmentGuidelines,
      guidelinesTolerance: gridProperties.guidelineTolerance,
      geometricGuideline: gridProperties.showGeometricGuidelines,
      initPosAlignment: gridProperties.showInitPosAlignment,
      distributionGuidelines: gridProperties.showDistributionGuidelines,
      snapToAlignmentLocationOnRelease: gridProperties.snapToAlignmentLocationOnRelease,
      snapToAlignmentLocationDuringDrag: gridProperties.snapToAlignmentLocationDuringDrag,
      lineWidth: gridProperties.lineWidth,
      guidelinesStyle: {
        initPosAlignmentLine: gridProperties.initPosAlignmentLine,
        lineDash: gridProperties.lineDash,
        horizontalDistLine: gridProperties.horizontalDistLine,
        strokeStyle: gridProperties.guidelineColor,
        horizontalDistColor: gridProperties.horizontalGuidelineColor,
        verticalDistColor: gridProperties.verticalGuidelineColor,
        initPosAlignmentColor: gridProperties.initPosAlignmentColor,
        geometricGuidelineRange: gridProperties.geometricAlignmentRange,
        range: gridProperties.distributionAlignmentRange,
        minDistRange: gridProperties.minDistributionAlignmentRange
      }
    });

    var panProps = {
      fitPadding: 10,
      fitSelector: ':visible',
      animateOnFit: function () {
        var currentGeneralProperties = appUtilities.getScratch(cy, 'currentGeneralProperties');
        return currentGeneralProperties.animateOnDrawingChanges;
      },
      animateOnZoom: function () {
        var currentGeneralProperties = appUtilities.getScratch(cy, 'currentGeneralProperties');
        return currentGeneralProperties.animateOnDrawingChanges;
      }
    };

    cy.panzoom(panProps);
  }

  function bindCyEvents() {

    // Expand collapse extension is supposed to clear expand collapse cue on node position event.
    // If compounds are resized position event is not triggered though the position of the node is changed.
    // Therefore, we listen to noderesize.resizedrag event here and if the node is a compound we need to call clearVisualCue() method of
    // expand collapse extension.
    cy.on("noderesize.resizedrag", function(e, type, node){
        if (node.isParent()) {
            cy.expandCollapse('get').clearVisualCue();
        }
    });

    /*
     * Collapsing/expanding can change the nature of the node and change wether it's resizeable or not.
     * We need to refresh the resize grapples to ensure they are consistent with their parent's status.
     * (for instance: complexes)
     */
    cy.on("fit-units-after-expandcollapse", function(event) {
      cy.nodes().forEach(function(ele){
        if(!ele.data('statesandinfos') || ele.data('statesandinfos').length == 0) {
          return;
        }
        var locations = chiseInstance.elementUtilities.checkFit(ele); //Fit all locations
        chiseInstance.elementUtilities.fitUnits(ele, locations); //Force fit
      });
      cy.style().update();
    });

    //Fixes info box locations after expand collapse
    cy.on("expandcollapse.aftercollapse expandcollapse.afterexpand", function(e, type, node) {
      cy.nodeResize('get').refreshGrapples();
    });

    //Updates arrow-scale of edges after expand
    cy.on("expandcollapse.afterexpand", function(event) {
        var currentArrowScale = Number($('#arrow-scale').val());
        cy.edges().style('arrow-scale', currentArrowScale);
    });

    //Changes arrow-scale of pasted edges
    cy.on("pasteClonedElements", function(e) {
        var currentArrowScale = Number($('#arrow-scale').val());
        cy.edges(":selected").style('arrow-scale', currentArrowScale);
    });

    cy.on("afterDo", function (event, actionName, args, res) {
      refreshUndoRedoButtonsStatus(cy);

      if(actionName == "resize") {
        var node = res.node;
        // ensure consistency of infoboxes through resizing
        if(node.data('statesandinfos').length > 0) {
          updateInfoBox(node);
        }
        // ensure consistency of inspector properties through resizing
        inspectorUtilities.handleSBGNInspector();
      }
    });

    cy.on("afterUndo", function (event, actionName, args, res) {
      refreshUndoRedoButtonsStatus(cy);
      cy.style().update();
      inspectorUtilities.handleSBGNInspector();

      if(actionName == "resize") {
        var node = res.node;
        // ensure consistency of infoboxes through resizing
        if(node.data('statesandinfos').length > 0) {
          updateInfoBox(node);
        }
      }
      else if ( actionName === "changeMenu" ) {

        // if map name is changed update the description of the related tab
        if (args.id === 'map-name') {

          // use the panel id as the network key
          var networkKey = cy.container().id;

          // update the network tab description as the map name is just changed
          appUtilities.updateNetworkTabDesc(networkKey);

        }

      }
    });

    cy.on("afterRedo", function (event, actionName, args, res) {
      refreshUndoRedoButtonsStatus(cy);
      cy.style().update();
      inspectorUtilities.handleSBGNInspector();

      if(actionName == "resize") {
        var node = res.node;
        // ensure consistency of infoboxes through resizing
        if(node.data('statesandinfos').length > 0) {
          updateInfoBox(node);
        }
      }
      else if ( actionName === "changeMenu" ) {

        // if map name is changed update the description of the related tab
        if (args.id === 'map-name') {

          // use the panel id as the network key
          var networkKey = cy.container().id;

          // update the network tab description as the map name is just changed
          appUtilities.updateNetworkTabDesc(networkKey);

        }

      }
    });

    cy.on("mousedown", "node", function (event) {

      var self = this;

      // get mode properties for cy
      var modeProperties = appUtilities.getScratch(cy, 'modeProperties');

      if (modeProperties.mode == 'selection-mode' && appUtilities.ctrlKeyDown) {
        appUtilities.enableDragAndDropMode(cy);

        appUtilities.setScratch(cy, 'mouseDownNode', self);
        var nodesToDragAndDrop = self.union(cy.nodes(':selected'));
        appUtilities.setScratch(cy, 'nodesToDragAndDrop', nodesToDragAndDrop);

        var dragAndDropStartPosition = event.position || event.cyPosition;
        appUtilities.setScratch(cy, 'dragAndDropStartPosition', dragAndDropStartPosition);
      }
    });

    cy.on("mouseup", function (event) {

      var self = event.target || event.cyTarget;

      // get chise instance for cy
      var chiseInstance = appUtilities.getChiseInstance(cy);

      if ( appUtilities.getScratch(cy, 'dragAndDropModeEnabled') ) {

        var nodes = appUtilities.getScratch(cy, 'nodesToDragAndDrop');
        if (appUtilities.ctrlKeyDown ) {
          var newParent;
          if( self != cy) {
            newParent = self;
            nodes = nodes.difference(newParent);
            if (!newParent.data("class").startsWith("complex") && newParent.data("class") != "compartment"
                && newParent.data("class") != "submap") {
              newParent = newParent.parent()[0];
            }
          }

          appUtilities.disableDragAndDropMode(cy);

          var mouseDownNode = appUtilities.getScratch(cy, 'mouseDownNode');
          var pos = event.position || event.cyPosition;
          var dragAndDropStartPosition = appUtilities.getScratch(cy, 'dragAndDropStartPosition');

          if( self == cy ||(self != cy && mouseDownNode != self)){
            chiseInstance.changeParent(nodes, newParent, pos.x - dragAndDropStartPosition.x,
                                  pos.y - dragAndDropStartPosition.y);
          }

          appUtilities.setScratch(cy, 'dragAndDropStartPosition', null);
          appUtilities.setScratch(cy, 'nodesToDragAndDrop', null);
        }
        else {
          appUtilities.disableDragAndDropMode(cy);
          appUtilities.setScratch(cy, 'dragAndDropStartPosition', null);
          appUtilities.setScratch(cy, 'nodesToDragAndDrop', null);
        }

      }

      nodeToUnselect = undefined;

      /*  make palette tab active if no element is selected
          cannot be done on unselect event because it causes conflict with the select trigger
          when nodes are selected one after another
          after tests, seems better to do it here

          With the addition of the 3rd Map tab, we can probably keep the behavior
          when the user has the Object tab selected.
      */
      if (cy.elements(':selected').length == 0){
        /* edge case when the properties tab is already selected (and shown empty)
          and an element is selected, the property tab gets shown and the palette tab is concatenated after it
          we need to wait a bit before triggering the following, and check again if everything is unselected
          that is really dirty...
        */
        setTimeout(function () {
          if (cy.elements(':selected').length == 0){
            if ($('#inspector-style-tab').hasClass('active')) {
              $('#inspector-palette-tab a').tab('show');
              $('#inspector-style-tab a').blur();
              $('#inspector-map-tab a').blur();
            }
          }
        }, 20);
      }
    });
/*
    cy.on('mouseover', 'node', function (event) {
      var node = this;

      $(".qtip").remove();

      if (event.originalEvent.shiftKey)
        return;

      node.qtipTimeOutFcn = setTimeout(function () {
        nodeQtipFunction(node);
      }, 2500);
    });

    cy.on('mouseout', 'node', function (event) {
      if (this.qtipTimeOutFcn != null) {
        clearTimeout(this.qtipTimeOutFcn);
        this.qtipTimeOutFcn = null;
      }
    });
*/
    // Indicates whether creating a process with convenient edges
    var convenientProcessSource;
    // cyTarget will be selected after 'tap' event is ended by cy core. We do not want this behaviour.
    // Therefore we need to set node to unselect on 'tapend' event (this may be changed as 'tap' event later),
    //  which is to be unselected on 'select' event.
    var nodeToUnselect;

    // If mouesdown in add-node-mode and selected node type is a PN draw on edge handles and mark that creating a convenient process
    cy.on('mousedown', 'node', function() {
      var node = this;

      // get mode properties for cy
      var modeProperties = appUtilities.getScratch(cy, 'modeProperties');

      if (modeProperties.mode === 'add-node-mode' && chiseInstance.elementUtilities.isPNClass(modeProperties.selectedNodeType) && chiseInstance.elementUtilities.isEPNClass(node) && !convenientProcessSource) {
        convenientProcessSource = node;
        cy.edgehandles('drawon');
      }
    });

    cy.on('tapend', function (event, relPos) {

      relPos = relPos || false;
      $('input').blur();

      var cyTarget;

      // get mode properties for cy
      var modeProperties = appUtilities.getScratch(cy, 'modeProperties');

      if (relPos){ // drag and drop case
        var nodesAtRelpos = chiseInstance.elementUtilities.getNodesAt(relPos);
        if (nodesAtRelpos.length == 0) { // when element is placed in the background
          cyTarget = cy;
        }
        else {
          // take last node as the parent one, as it seems that cy is behaving like this
          // caution, may not work some day, dirty hack
          cyTarget = nodesAtRelpos.pop();
        }
        // also be aware that not everything in the event may be correctly defined here
      }
      else { // normal click case
        cyTarget = event.target || event.cyTarget;
      }

      // If in add node mode do the followings conditionally,
      // If selected node type is a PN create a process and source and target nodes are EPNs with convenient edges,
      // else just create a new node with the current selected node type
      if (modeProperties.mode === "add-node-mode") {
        var nodeType = modeProperties.selectedNodeType;
        var nodeParams = {class : nodeType, language : modeProperties.selectedNodeLanguage};

        if( convenientProcessSource && cyTarget.isNode && cyTarget.isNode()
                && cyTarget.id() !== convenientProcessSource.id()
                && chiseInstance.elementUtilities.isPNClass(nodeType)
                && chiseInstance.elementUtilities.isEPNClass(cyTarget)
                && chiseInstance.elementUtilities.isEPNClass(convenientProcessSource)
                && !(cyTarget.parent()[0] != undefined && chiseInstance.elementUtilities.isEPNClass(cyTarget.parent()[0]) ||
                  convenientProcessSource.parent()[0] != undefined && chiseInstance.elementUtilities.isEPNClass(convenientProcessSource.parent()[0])))
        {
          chiseInstance.addProcessWithConvenientEdges(convenientProcessSource, cyTarget, nodeParams);
          //Update arrow scale of the newly added edge
          var addedEdge = cy.elements()[cy.elements().length - 1];
          var currentArrowScale = Number($('#arrow-scale').val());
          addedEdge.style('arrow-scale', currentArrowScale);
        }
        else {
          var cyPosX;
          var cyPosY;
          if (relPos) {
            modelPos = chiseInstance.elementUtilities.convertToModelPosition(relPos);
            cyPosX = modelPos.x;
            cyPosY = modelPos.y;
          }
          else {
            var pos = event.position || event.cyPosition;
            cyPosX = pos.x;
            cyPosY = pos.y;
          }


          var parent, parentId, parentClass;

          // If cyTarget is a node determine the parent of new node
          if (cyTarget.isNode && cyTarget.isNode()) {
            if (cyTarget.data('class').startsWith('complex') || cyTarget.data('class') === 'compartment'
                ||  cyTarget.data('class') == 'submap') {
              parent = cyTarget;
            }
            else {
              parent = cyTarget.parent()[0];
            }

            // Set nodeToUnselect here
            nodeToUnselect = cyTarget;
          }

          // If parent is defined get parentId and parentClass
          if (parent) {
            parentId = parent.id();
            parentClass = parent.data('class');
          }

          // If the parent class is valid for the node type then add the node
          if (chiseInstance.elementUtilities.isValidParent(nodeType, parentClass)) {

            // if added node changes map type, warn user
            if (chiseInstance.getMapType() && chiseInstance.getMapType() != "Unknown" && nodeParams.language != chiseInstance.getMapType()){
              appUtilities.promptMapTypeView.render(function(){
                  chiseInstance.addNode(cyPosX, cyPosY, nodeParams, undefined, parentId);});
            }
            else{
              chiseInstance.addNode(cyPosX, cyPosY, nodeParams, undefined, parentId);
            }
            if (nodeType === 'process' || nodeType === 'omitted process' || nodeType === 'uncertain process' || nodeType === 'association' || nodeType === 'dissociation'  || nodeType === 'and'  || nodeType === 'or'  || nodeType === 'not')
            {
                var newEle = cy.nodes()[cy.nodes().length - 1];
                var defaultPortsOrdering = chiseInstance.elementUtilities.getDefaultProperties(nodeType)['ports-ordering'];
                chiseInstance.elementUtilities.setPortsOrdering(newEle, ( defaultPortsOrdering ? defaultPortsOrdering : 'L-to-R'));
            }

            // If the node will not be added to the root then the parent node may be resized and the top left corner pasition may change after
            // the node is added. Therefore, we may need to clear the expand collapse viusal cue.
            if (parent) {
              cy.expandCollapse('get').clearVisualCue();
            }
          }
        }

        // If not in sustainable mode set selection mode
        if (!modeProperties.sustainMode) {
          modeHandler.setSelectionMode();
        }
      }

      // Signal that creation of convenient process is finished
      if (convenientProcessSource) {
        convenientProcessSource = undefined;
        // cy.edgehandles('drawoff'); call will set the autoungrabify state the value of autoungrabify before the drawon
        // however here we do not want to change that state here so we need to keep the current ungrabify state and return back to it
        // after cy.edgehandles('drawoff'); is called
        var currentUngrabifyState = cy.autoungrabify();
        // After tap is performed drawoff edgehandles
        cy.edgehandles('drawoff');
        // Return the current current ungrabify state (Do not let edge handles to change it)
        cy.autoungrabify(currentUngrabifyState);
      }

      appUtilities.removeDragImage();
    });

    var tappedBefore;

    cy.on('tap', 'node', function (event) {
      var node = this;

      var tappedNow = node;
      setTimeout(function () {
        tappedBefore = null;
      }, 300);
      if (tappedBefore && tappedBefore.id() === tappedNow.id()) {
        tappedNow.trigger('doubleTap');
        tappedBefore = null;
      } else {
        tappedBefore = tappedNow;
      }

//      $(".qtip").remove();

      if (event.originalEvent.shiftKey)
        return;
/*
      if (node.qtipTimeOutFcn != null) {
        clearTimeout(node.qtipTimeOutFcn);
        node.qtipTimeOutFcn = null;
      }

      nodeQtipFunction(node);
*/
    });

    cy.on('doubleTap', 'node', function (event) {

      // get mode properties for cy
      var modeProperties = appUtilities.getScratch(cy, 'modeProperties');

      if (modeProperties.mode == 'selection-mode') {
        var node = this;

        if (!chiseInstance.elementUtilities.canHaveSBGNLabel(node)) {
          return;
        }

        var nodeLabelTextbox = $("#node-label-textbox");
        var containerPos = $(cy.container()).position();
        var containerWidth = $(cy.container()).width();
        var containerHeight = $(cy.container()).height();

        // Adjust left of the textbox
        var left = containerPos.left + this.renderedPosition().x;
        left -= nodeLabelTextbox.width() / 2;
        // If textbox goes beyond the borders of container, "+5" is for better seperation
        if(left < containerPos.left){
          left = containerPos.left + 5;
        }
        if((left + nodeLabelTextbox.width()) > (containerPos.left + containerWidth)){
          left -= (left + nodeLabelTextbox.width()) - (containerPos.left + containerWidth) + 5;
        }

        left = left.toString() + 'px';

        // Adjust top of the textbox
        var top = containerPos.top + this.renderedPosition().y;
        top -= nodeLabelTextbox.height() / 2;

        //For complexes and compartments move the textarea to the bottom
        var nodeType = node.data('class');
        if (nodeType == "compartment" || nodeType.startsWith("complex") || nodeType == "submap")
            top += (node.outerHeight() / 2 * cy.zoom() );

        // If textbox goes beyond the borders of container, "+5" is for better seperation
        if(top < containerPos.top){
          top = containerPos.top + 5;
        }
        if((top + nodeLabelTextbox.height()) > (containerPos.top + containerHeight)){
          top -= (top + nodeLabelTextbox.height()) - (containerPos.top + containerHeight) + 5;
        }

        top = top.toString() + 'px';

        nodeLabelTextbox.css('left', left);
        nodeLabelTextbox.css('top', top);
        cy.nodes().unselect();
        nodeLabelTextbox.show();
        var sbgnlabel = this.data('label');
        if (sbgnlabel == null) {
          sbgnlabel = "";
        }
        nodeLabelTextbox.val(sbgnlabel);
        nodeLabelTextbox.data('node', this);
        nodeLabelTextbox.focus();
      }
    });

    var handleInspectorThrottled = _.throttle(function() {
      inspectorUtilities.handleSBGNInspector();
    }, 200);

    // When we select/unselect many elements in one operation these 'select' / 'unselect' events called may times
    // and unfortunetaly the inspector is refreshed many times. This seriously decreases the performance. To handle this
    // problem we call the method used to refresh the inspector in a throttled way and decrease the number of calls.
    cy.on('select', function() {
      handleInspectorThrottled();
      // Go to inspector style/properties tab when a node is selected
      if (!$('#inspector-style-tab').hasClass('active')) {
        $('#inspector-style-tab a').tab('show');
        $('#inspector-palette-tab a').blur();
        $('#inspector-map-tab a').blur();
      }
      //Remove grapples while node-label-textbox is visible
      if($("#node-label-textbox").is(":visible")){
        cy.nodeResize('get').removeGrapples();
      }
    });

    cy.on('unselect', function() {
      if($("#node-label-textbox").is(":visible")){
        cy.nodes().unselect();
      }
      $("#node-label-textbox").blur();
      handleInspectorThrottled();
    });

    /*
     * Set/unset the first selected node on select/unselect node events to align w.r.t that node when needed
     */
    cy.on('select', 'node', function() {
      if (!appUtilities.firstSelectedNode) {
        appUtilities.firstSelectedNode = this;
      }

      // Unselect nodeToUnselect and then unset it here
      if (nodeToUnselect && nodeToUnselect.id() === this.id()) {
        nodeToUnselect.unselect();
        nodeToUnselect = undefined;
      }
    });

    cy.on('unselect', 'node', function() {
      if (appUtilities.firstSelectedNode && appUtilities.firstSelectedNode.id() === this.id()) {
        appUtilities.firstSelectedNode = undefined;
      }
    });

    // infobox refresh when resize happen, for simple nodes
    cy.on('noderesize.resizedrag', function(e, type, node) {
      if(node.data('statesandinfos').length > 0) {
        updateInfoBox(node);
      }
    });

    cy.on('layoutstop', function (event) {
  		/*
  		* 'preset' layout is called to give the initial positions of nodes by sbgnviz.
  		* Seems like 'grid' layout is called by Cytoscape.js core in loading graphs.
  		* If the layout is not one of these (normally it is supposed to be 'cose-bilkent')
  		* stop layout spinner for the related chise instance.
  		*/
      if (event.layout.options.name !== 'preset' && event.layout.options.name !== 'grid')
      {
        appUtilities.getChiseInstance(cy).endSpinner('layout-spinner');
      }
      cy.nodes().forEach(function(ele){
        // skip nodes without any auxiliary units
        if(!ele.data('statesandinfos') || ele.data('statesandinfos').length == 0) {
          return;
        }
        var locations = chiseInstance.elementUtilities.checkFit(ele); //Fit all locations
        chiseInstance.elementUtilities.fitUnits(ele, locations); //Force fit
      });
    });

    // if the position of compound changes by repositioning its children
    // Note: position event for compound is not triggered in this case
    // edge case: when moving a complex, it triggers the position change of the children,
    // which then triggers the event below.
    var oldPos = {x: undefined, y: undefined};
    var currentPos = {x : 0, y : 0};
    cy.on("position", "node:child", function(event) {
      var parent = event.target.parent();
      if(!parent.is("[class^='complex'], [class^='compartment']")) {
        return;
      }
      currentPos = parent.position();
      if (currentPos.x != oldPos.x || currentPos.y != oldPos.y){
          oldPos = {x : currentPos.x, y : currentPos.y};
          cy.trigger('noderesize.resizedrag', ['unknown', parent]);
      }
    });

    // update background image style when data changes
    cy.on('data', 'node', function(event) {
      var node = event.target;

      if(!node || !node.isNode())
        return;

      var keys = ['background-image', 'background-fit', 'background-image-opacity',
        'background-position-x', 'background-position-y', 'background-height', 'background-width'];

      var opt = {};
      keys.forEach(function(key){
        opt[key] = node.data(key);
      });

      node.style(opt);
    });

    cy.on('tap', 'node', function(event) {
      var pos = event.position || event.cyPosition;
      var node = event.target || event.cyTarget;
      var ref; // used only for positioning
      var pan = cy.pan();
      var zoom = cy.zoom();

      var infobox = chiseInstance.classes.AuxiliaryUnit.checkPoint(pos.x, pos.y, node, 0);
      var tooltipContent;

      if (!infobox) {
        tooltipContent = node.data('tooltip');

        if ( tooltipContent == undefined ) {
          return;
        }

        ref = node.popperRef();
      }
      else {
        tooltipContent = infobox['tooltip'];

        if ( tooltipContent == undefined ) {
          return;
        }

        var modelPos = chiseInstance.classes.AuxiliaryUnit.getAbsoluteCoord(infobox, node.cy());
        var modelW = infobox.bbox.w;
        var modelH = infobox.bbox.h;
        var renderedW = modelW * zoom;
        var renderedH = modelH * zoom;
        modelPos.x -= modelW / 2;
        modelPos.y -= modelH / 2;
        var renderedPos = chiseInstance.elementUtilities.convertToRenderedPosition(modelPos, pan, zoom);

        var renderedDims = { w: renderedW, h: renderedH };

        ref = node.popperRef({
          renderedPosition: function() {
            return renderedPos;
          },
          renderedDimensions: function() {
            return renderedDims;
          }
        });
      }

      var placement = infobox ? infobox.anchorSide : 'bottom';
      var destroyTippy;

      var tippy = Tippy.one(ref, {
        content: (() => {
          var content = document.createElement('div');

          content.style['font-size'] = 12 * zoom + 'px';
          content.innerHTML = tooltipContent;

          return content;
        })(),
        trigger: 'manual',
        hideOnClick: true,
        arrow: true,
        placement,
        onHidden: function() {
          cy.off('pan zoom', destroyTippy);
          node.off('position', destroyTippy);
        }
      });

      destroyTippy = function(){
        tippy.destroy();
      };

      cy.on('pan zoom', destroyTippy);
      node.on('position', destroyTippy);

      setTimeout( () => tippy.show(), 0 );
    });
  }

  function updateInfoBox(node) {
    var locations = chiseInstance.elementUtilities.checkFit(node); //Fit all locations
    if (locations !== undefined && locations.length > 0) {
      var firstTime = true;
      for (var i = 0; i < locations.length; i++) {
        if( chiseInstance.classes.AuxUnitLayout.getCurrentGap(locations[i]) < chiseInstance.classes.AuxUnitLayout.unitGap) {
          firstTime = false;
          break;
        }
      }
      if (firstTime === true) {
        chiseInstance.fitUnits(node, locations); //Force fit
      }
      else {
        chiseInstance.elementUtilities.fitUnits(node, locations);
      }
    }
  }
};
