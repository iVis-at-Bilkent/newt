var jquery = $ = require('jquery');
var appUtilities = require('./app-utilities');
var modeHandler = require('./app-mode-handler');
var inspectorUtilities = require('./inspector-utilities');
var appUndoActions = require('./app-undo-actions');
var _ = require('underscore');

module.exports = function () {
  var getExpandCollapseOptions = appUtilities.getExpandCollapseOptions.bind(appUtilities);
  var nodeQtipFunction = appUtilities.nodeQtipFunction.bind(appUtilities);
  var refreshUndoRedoButtonsStatus = appUtilities.refreshUndoRedoButtonsStatus.bind(appUtilities);

  $(document).ready(function ()
  {
    appUtilities.sbgnNetworkContainer = $('#sbgn-network-container');
    // register extensions and bind events when cy is ready
    cy.ready(function () {
      cytoscapeExtensionsAndContextMenu();
      bindCyEvents();
      cy.style().selector('core').style({'active-bg-opacity': 0});
      // If undo extension, register undo/redo actions
      if (cy.undoRedo()) {
        registerUndoRedoActions();
      }
    });
  });

  function registerUndoRedoActions() { // only if undoRedo is set
    var ur = cy.undoRedo();
    ur.action("changeDataDirty", appUndoActions.changeDataDirty, appUndoActions.changeDataDirty);
  }
  
  function cytoscapeExtensionsAndContextMenu() {
    cy.expandCollapse(getExpandCollapseOptions());

    var contextMenus = cy.contextMenus({
    });
    
    cy.autopanOnDrag();

    cy.edgeBendEditing({
      // this function specifies the positions of bend points
      bendPositionsFunction: function (ele) {
        return ele.data('bendPointPositions');
      },
      // whether the bend editing operations are undoable (requires cytoscape-undo-redo.js)
      undoable: true,
      // title of remove bend point menu item
      removeBendMenuItemTitle: "Delete Bend Point",
      // whether to initilize bend points on creation of this extension automatically
      initBendPointsAutomatically: false
    });

    contextMenus.appendMenuItems([
      {
        id: 'ctx-menu-general-properties',
        title: 'Properties...',
        coreAsWell: true,
        onClickFunction: function (event) {
          $("#general-properties").trigger("click");
        }
      },
      {
        id: 'ctx-menu-delete',
        title: 'Delete',
        selector: 'node, edge',
        onClickFunction: function (event) {
          cy.undoRedo().do("deleteElesSimple", {
            eles: event.cyTarget
          });
        }
      },
      {
        id: 'ctx-menu-delete-selected',
        title: 'Delete Selected',
        onClickFunction: function () {
          $("#delete-selected-simple").trigger('click');
        },
        coreAsWell: true // Whether core instance have this item on cxttap
      },
      {
        id: 'ctx-menu-hide-selected',
        title: 'Hide Selected',
        onClickFunction: function () {
          $("#hide-selected").trigger('click');
        },
        coreAsWell: true // Whether core instance have this item on cxttap
      },
      {
        id: 'ctx-menu-show-all',
        title: 'Show All',
        onClickFunction: function () {
          $("#show-all").trigger('click');
        },
        coreAsWell: true // Whether core instance have this item on cxttap
      },
      {
        id: 'ctx-menu-expand', // ID of menu item
        title: 'Expand', // Title of menu item
        // Filters the elements to have this menu item on cxttap
        // If the selector is not truthy no elements will have this menu item on cxttap
        selector: 'node.cy-expand-collapse-collapsed-node',
        onClickFunction: function (event) { // The function to be executed on click
          cy.undoRedo().do("expand", {
            nodes: event.cyTarget
          });
        }
      },
      {
        id: 'ctx-menu-collapse',
        title: 'Collapse',
        selector: 'node:parent',
        onClickFunction: function (event) {
          cy.undoRedo().do("collapse", {
            nodes: event.cyTarget
          });
        }
      },
      {
        id: 'ctx-menu-perform-layout',
        title: 'Perform Layout',
        onClickFunction: function () {
          $("#perform-layout").trigger('click');
        },
        coreAsWell: true // Whether core instance have this item on cxttap
      },
      {
        id: 'ctx-menu-select-all-object-of-this-type',
        title: 'Select Objects of This Type',
        selector: 'node, edge',
        onClickFunction: function (event) {
          var cyTarget = event.cyTarget;
          var sbgnclass = cyTarget.data('class');

          cy.elements().unselect();
          cy.elements('[class="' + sbgnclass + '"]').select();
        }
      },
      {
        id: 'ctx-menu-show-hidden-neighbors',
        title: 'Show Hidden Neighbors',
        selector: 'node',
        onClickFunction: function (event) {
          var cyTarget = event.cyTarget;
          appUtilities.showAndPerformIncrementalLayout(cyTarget);
//          chise.showAndPerformLayout(chise.elementUtilities.extendNodeList(cyTarget), appUtilities.triggerIncrementalLayout.bind(appUtilities));
        }
      }
    ]);

    cy.clipboard({
      clipboardSize: 5, // Size of clipboard. 0 means unlimited. If size is exceeded, first added item in clipboard will be removed.
      shortcuts: {
        enabled: true, // Whether keyboard shortcuts are enabled
        undoable: true // and if undoRedo extension exists
      }
    });

    cy.viewUtilities({
      node: {
        highlighted: {
          'border-width': '10px'
        }, // styles for when nodes are highlighted.
        unhighlighted: {// styles for when nodes are unhighlighted.
          'opacity': function (ele) {
            return ele.css('opacity');
          }
        }
      },
      edge: {
        highlighted: {
          'width': '10px'
        }, // styles for when edges are highlighted.
        unhighlighted: {// styles for when edges are unhighlighted.
          'opacity': function (ele) {
            return ele.css('opacity');
          }
        }
      },
      neighbor: function(node){ //select and return process-based neighbors
        node.select();
        var neighbors = chise.elementUtilities.extendNodeList(node);   
        return neighbors;
      },
      neighborSelectTime: 1000 //ms 
    });
    
    cy.nodeResize({
      padding: 2, // spacing between node and grapples/rectangle
      undoable: true, // and if cy.undoRedo exists

      grappleSize: 7, // size of square dots
      grappleColor: "#d67614", // color of grapples
      inactiveGrappleStroke: "inside 1px #d67614",
      boundingRectangle: true, // enable/disable bounding rectangle
      boundingRectangleLineDash: [1.5, 1.5], // line dash of bounding rectangle
      boundingRectangleLineColor: "darkgray",
      boundingRectangleLineWidth: 1.5,
      zIndex: 999,
      minWidth: function (node) {
        var data = node.data("resizeMinWidth");
        return data ? data : 10;
      }, // a function returns min width of node
      minHeight: function (node) {
        var data = node.data("resizeMinHeight");
        return data ? data : 10;
      }, // a function returns min height of node

      isFixedAspectRatioResizeMode: function (node) {
        var sbgnclass = node.data("class");
        return chise.elementUtilities.mustBeSquare(sbgnclass);
      }, // with only 4 active grapples (at corners)
      isNoResizeMode: function (node) {
        return node.is(".noResizeMode, :parent")
      }, // no active grapples

      cursors: {// See http://www.w3schools.com/cssref/tryit.asp?filename=trycss_cursor
        // May take any "cursor" css property
        default: "default", // to be set after resizing finished or mouseleave
        inactive: "not-allowed",
        nw: "nw-resize",
        n: "n-resize",
        ne: "ne-resize",
        e: "e-resize",
        se: "se-resize",
        s: "s-resize",
        sw: "sw-resize",
        w: "w-resize"
      }
    });
    
    //For adding edges interactively
    cy.edgehandles({
      // fired when edgehandles is done and entities are added
      complete: function (sourceNode, targetNodes, addedEntities) {
        if (!targetNodes) {
          return;
        }
        
        // We need to remove interactively added entities because we should add the edge with the chise api
        addedEntities.remove();
        
        /*
         * If in add edge mode create an edge
         */
        if (modeHandler.mode === 'add-edge-mode') {
          // fired when edgehandles is done and entities are added
          var source = sourceNode.id();
          var target = targetNodes[0].id();
          var edgeclass = modeHandler.selectedEdgeType;

          chise.addEdge(source, target, edgeclass);
          
          // If not in sustain mode set selection mode
          if (!modeHandler.sustainMode) {
            modeHandler.setSelectionMode();
          }
        }

      },
      loopAllowed: function( node ) {
        // for the specified node, return whether edges from itself to itself are allowed
        return false;
      },
      toggleOffOnLeave: true, // whether an edge is cancelled by leaving a node (true), or whether you need to go over again to cancel (false; allows multiple edges in one pass)
      handleSize: 0 // the size of the edge handle put on nodes (Note that it is 0 because we do not want to see the handle)
    });

    cy.edgehandles('drawoff');
    
    var gridProperties = appUtilities.currentGridProperties;
    
    cy.gridGuide({
      drawGrid: gridProperties.showGrid,
      snapToGrid: gridProperties.snapToGrid,
      discreteDrag: gridProperties.discreteDrag,
      gridSpacing: gridProperties.gridSize,
      resize: gridProperties.autoResizeNodes,
      guidelines: gridProperties.showAlignmentGuidelines,
      guidelinesTolerance: gridProperties.guidelineTolerance,
      geometricGuideline: gridProperties.showGeometricGuidelines,
      initPosAlignment: gridProperties.showInitPosAlignment,
      distributionGuidelines: gridProperties.showDistributionGuidelines,
	  snapToAlignmentLocation: gridProperties.snapToAlignmentLocation,
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
        range: gridProperties.distributionAlignmentRange
      }
    });

    var panProps = ({
      fitPadding: 10,
      fitSelector: ':visible',
      animateOnFit: function () {
        return appUtilities.currentGeneralProperties.animateOnDrawingChanges;
      },
      animateOnZoom: function () {
        return appUtilities.currentGeneralProperties.animateOnDrawingChanges;
      }
    });

    appUtilities.sbgnNetworkContainer.cytoscapePanzoom(panProps);
  }

  function bindCyEvents() {
    cy.on("afterDo", function (event, actionName, args, res) {
      refreshUndoRedoButtonsStatus();
    });

    cy.on("afterUndo", function (event, actionName, args, res) {
      refreshUndoRedoButtonsStatus();
      cy.style().update();
      inspectorUtilities.handleSBGNInspector();
    });

    cy.on("afterRedo", function (event, actionName, args, res) {
      refreshUndoRedoButtonsStatus();
      cy.style().update();
      inspectorUtilities.handleSBGNInspector();
    });
    
    cy.on("mousedown", "node", function (event) {
      var self = this;
      if (modeHandler.mode == 'selection-mode' && appUtilities.ctrlKeyDown) {
        appUtilities.enableDragAndDropMode();
        appUtilities.nodesToDragAndDrop = self.union(cy.nodes(':selected'));
        appUtilities.dragAndDropStartPosition = event.cyPosition;
      }
    });
    
    cy.on("mouseup", function (event) {
      var self = event.cyTarget;
      if (appUtilities.dragAndDropModeEnabled) {
        var newParent;
        if (self != cy) {
          newParent = self;

          if (newParent.data("class") != "complex" && newParent.data("class") != "compartment") {
            newParent = newParent.parent()[0];
          }
        }
        var nodes = appUtilities.nodesToDragAndDrop;

        appUtilities.disableDragAndDropMode();

        chise.changeParent(nodes, newParent, event.cyPosition.x - appUtilities.dragAndDropStartPosition.x, 
                              event.cyPosition.y - appUtilities.dragAndDropStartPosition.y);

        appUtilities.dragAndDropStartPosition = null;
        appUtilities.nodesToDragAndDrop = null;
      }

      // make palette tab active if no element is selected
      // cannot be done on unselect event because it causes conflict with the select trigger
      // when nodes are selected one after another
      // after tests, seems better to do it here
      if (cy.elements(':selected').length == 0){
        // edge case when the properties tab is already selected (and shown empty)
        // and an element is selected, the property tab gets shown and the palette tab is concatenated after it
        // we need to wait a bit before triggering the following, and check again if everything is unselected
        // that is really dirty...
        setTimeout(function () {
          if (cy.elements(':selected').length == 0){
            if (!$('#inspector-palette-tab').hasClass('active')) {
              $('#inspector-palette-tab a').tab('show');
              $('#inspector-style-tab a').blur();
            }
          }
        }, 20);
      }
    });

    cy.on('mouseover', 'node', function (event) {
      var node = this;

      $(".qtip").remove();

      if (event.originalEvent.shiftKey)
        return;

      node.qtipTimeOutFcn = setTimeout(function () {
        nodeQtipFunction(node);
      }, 1000);
    });

    cy.on('mouseout', 'node', function (event) {
      if (this.qtipTimeOutFcn != null) {
        clearTimeout(this.qtipTimeOutFcn);
        this.qtipTimeOutFcn = null;
      }
    });
    
    // Indicates whether creating a process with convenient edges
    var convenientProcessSource;
    
    // If mouesdown in add-node-mode and selected node type is a PN draw on edge handles and mark that creating a convenient process
    cy.on('mousedown', 'node', function() {
      var node = this;
      if (modeHandler.mode === 'add-node-mode' && chise.elementUtilities.isPNClass(modeHandler.selectedNodeType) && chise.elementUtilities.isEPNClass(node) && !convenientProcessSource) {
        convenientProcessSource = node;
        cy.edgehandles('drawon');
      }
    });

    cy.on('tapend', function (event, relPos) {
      relPos = relPos || false;
      $('input').blur();
      var cyTarget;
      if (relPos){ // drag and drop case
        var nodesAtRelpos = chise.elementUtilities.getNodesAt(relPos);
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
        cyTarget = event.cyTarget;
      }
      
      
      // If in add node mode do the followings conditionally,
      // If selected node type is a PN create a process and source and target nodes are EPNs with convenient edges,
      // else just create a new node with the current selected node type
      if (modeHandler.mode === "add-node-mode") {
        var nodeType = modeHandler.selectedNodeType;

        if( convenientProcessSource && cyTarget.isNode && cyTarget.isNode()
                && cyTarget.id() !== convenientProcessSource.id()
                && chise.elementUtilities.isPNClass(nodeType)
                && chise.elementUtilities.isEPNClass(cyTarget) 
                && chise.elementUtilities.isEPNClass(convenientProcessSource) ) {

          chise.addProcessWithConvenientEdges(convenientProcessSource, cyTarget, nodeType);
        }
        else {
          var cyPosX;
          var cyPosY;
          if (relPos) {
            modelPos = chise.elementUtilities.convertToModelPosition(relPos);
            cyPosX = modelPos.x;
            cyPosY = modelPos.y;
          }
          else {
            cyPosX = event.cyPosition.x;
            cyPosY = event.cyPosition.y;
          }
          

          var parent, parentId, parentClass;
          
          // If cyTarget is a node determine the parent of new node
          if (cyTarget.isNode && cyTarget.isNode()) {
            if (cyTarget.data('class') === 'complex' || cyTarget.data('class') === 'compartment' ) {
              parent = cyTarget;
            }
            else {
              parent = cyTarget.parent()[0];
            }
          }
          
          // If parent is defined get parentId and parentClass
          if (parent) {
            parentId = parent.id();
            parentClass = parent.data('class');
          }
          
          // If the parent class is valid for the node type then add the node
          if (chise.elementUtilities.isValidParent(nodeType, parentClass)) {
            chise.addNode(cyPosX, cyPosY, nodeType, undefined, parentId);
          }
        }
        
        // If not in sustainable mode set selection mode
        if (!modeHandler.sustainMode) {
          modeHandler.setSelectionMode();
        }
      }
      
      // Signal that creation of convenient process is finished 
      if (convenientProcessSource) {
        // After tap is performed drawoff edgehandles
        convenientProcessSource = undefined;
        cy.edgehandles('drawoff');
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

      $(".qtip").remove();

      if (event.originalEvent.shiftKey)
        return;

      if (node.qtipTimeOutFcn != null) {
        clearTimeout(node.qtipTimeOutFcn);
        node.qtipTimeOutFcn = null;
      }

      nodeQtipFunction(node);
    });
    
    cy.on('doubleTap', 'node', function (event) {
      if (modeHandler.mode == 'selection-mode') {
        var node = this;

        if (!chise.elementUtilities.canHaveSBGNLabel(node)) {
          return;
        }
        
        var nodeLabelTextbox = $("#node-label-textbox");
        var containerPos = $(cy.container()).position();
        var left = containerPos.left + this.renderedPosition().x;
        left -= nodeLabelTextbox.width() / 2;
        left = left.toString() + 'px';
        var top = containerPos.top + this.renderedPosition().y;
        top -= nodeLabelTextbox.height() / 2;
        top = top.toString() + 'px';

        nodeLabelTextbox.css('left', left);
        nodeLabelTextbox.css('top', top);
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
      }
    });
    
    cy.on('unselect', function() {
      handleInspectorThrottled();
    });
    
    /*
     * Set/unset the first selected node on select/unselect node events to align w.r.t that node when needed
     */
    cy.on('select', 'node', function() {
      if (!appUtilities.firstSelectedNode) {
        appUtilities.firstSelectedNode = this;
      }
    });
    
    cy.on('unselect', 'node', function() {
      if (appUtilities.firstSelectedNode && appUtilities.firstSelectedNode.id() === this.id()) {
        appUtilities.firstSelectedNode = undefined;
      }
    });
  }
};
