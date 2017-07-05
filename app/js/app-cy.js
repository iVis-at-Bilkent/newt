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
      if (appUtilities.undoable) {
        registerUndoRedoActions();
      }
    });
  });

  function registerUndoRedoActions() { // only if undoRedo is set
    var ur = cy.undoRedo();
    ur.action("changeDataDirty", appUndoActions.changeDataDirty, appUndoActions.changeDataDirty);
    ur.action("changeMenu", appUndoActions.changeMenu, appUndoActions.changeMenu);
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
      undoable: appUtilities.undoable,
      // title of remove bend point menu item
      removeBendMenuItemTitle: "Delete Bend Point",
      // whether to initilize bend points on creation of this extension automatically
      initBendPointsAutomatically: false
    });

    contextMenus.appendMenuItems([
      {
        id: 'ctx-menu-general-properties',
        content: 'Properties...',
        coreAsWell: true,
        onClickFunction: function (event) {
          $("#general-properties").trigger("click");
        }
      },
      {
        id: 'ctx-menu-delete',
        content: 'Delete',
        selector: 'node, edge',
        onClickFunction: function (event) {
          cy.undoRedo().do("deleteElesSimple", {
            eles: event.target || event.cyTarget
          });
        }
      },
      {
        id: 'ctx-menu-delete-selected',
        content: 'Delete Selected',
        onClickFunction: function () {
          $("#delete-selected-simple").trigger('click');
        },
        coreAsWell: true // Whether core instance have this item on cxttap
      },
      {
        id: 'ctx-menu-hide-selected',
        content: 'Hide Selected',
        onClickFunction: function () {
          $("#hide-selected").trigger('click');
        },
        coreAsWell: true // Whether core instance have this item on cxttap
      },
      {
        id: 'ctx-menu-show-all',
        content: 'Show All',
        onClickFunction: function () {
          $("#show-all").trigger('click');
        },
        coreAsWell: true // Whether core instance have this item on cxttap
      },
      {
        id: 'ctx-menu-expand', // ID of menu item
        content: 'Expand', // Title of menu item
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
        selector: 'node:parent',
        onClickFunction: function (event) {
          cy.undoRedo().do("collapse", {
            nodes: event.target || event.cyTarget
          });
        }
      },
      {
        id: 'ctx-menu-perform-layout',
        content: 'Perform Layout',
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
        selector: 'node',
        onClickFunction: function (event) {
          var cyTarget = event.target || event.cyTarget;
          var nodesWithHiddenNeighbor = cy.edges(":hidden").connectedNodes(':visible');
          if(appUtilities.undoable){
            var actions = [];
            nodesWithHiddenNeighbor.forEach(function( ele ){
              var defaultBorderWidth = Number(chise.elementUtilities.getCommonProperty(ele, "border-width", "data"));
              actions.push({name:"changeData", param:{eles: ele, name: "border-width", valueMap: (defaultBorderWidth - 2)}});
            });
            cy.undoRedo().do("batch", actions);
          }
          else{
            nodesWithHiddenNeighbor.forEach(function( ele ){
              var defaultBorderWidth = Number(chise.elementUtilities.getCommonProperty(ele, "border-width", "data"));
              chise.changeData(ele, 'border-width', defaultBorderWidth - 2);
            });  
          }
          appUtilities.showAndPerformIncrementalLayout(cyTarget);   
          nodesWithHiddenNeighbor = cy.edges(":hidden").connectedNodes(':visible');
          if(appUtilities.undoable){
            actions = [];
            nodesWithHiddenNeighbor.forEach(function( ele ){
              var defaultBorderWidth = Number(chise.elementUtilities.getCommonProperty(ele, "border-width", "data"));
              actions.push({name:"changeData", param:{eles: ele, name: "border-width", valueMap: (defaultBorderWidth + 2)}});
            });
            cy.undoRedo().do("batch", actions);
          }
          else{
            nodesWithHiddenNeighbor.forEach(function( ele ){
              var defaultBorderWidth = Number(chise.elementUtilities.getCommonProperty(ele, "border-width", "data"));
              chise.changeData(ele, 'border-width', defaultBorderWidth + 2);
            });
          }
//          chise.showAndPerformLayout(chise.elementUtilities.extendNodeList(cyTarget), appUtilities.triggerIncrementalLayout.bind(appUtilities));
        }
      }
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

          // maintain consistency of layouts, and infoboxes through them
          // we need to replace the layouts contained in ele by new cloned layouts
          var globalInfoboxCount = 0;
          for(var side in ele.data('auxunitlayouts')) {
            var layout = ele.data('auxunitlayouts')[side];
            var newLayout = layout.copy(ele); // get a new layout

            // copy each infobox of the layout
            for(var i=0; i < layout.units.length; i++) {
              var auxunit = layout.units[i];
              // keep the new infobox at exactly the same position in the statesandinfos list 
              var statesandinfosIndex = ele.data('statesandinfos').indexOf(auxunit);

              // copy the current infobox
              var newAuxunit = auxunit.copy(ele, ele.data('id') + "_" + globalInfoboxCount);
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
            return parseFloat(ele.data('border-width')) + 2;
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
        if(chise.elementUtilities.isPNClass(node) || chise.elementUtilities.isLogicalOperator(node)){
            nodesToSelect = nodesToSelect.union(node.openNeighborhood());
        }
        node.openNeighborhood().forEach(function(ele){
            if(chise.elementUtilities.isPNClass(ele) || chise.elementUtilities.isLogicalOperator(ele)){
                nodesToSelect = nodesToSelect.union(ele.closedNeighborhood());
                ele.openNeighborhood().forEach(function(ele2){
                    if(chise.elementUtilities.isPNClass(ele2) || chise.elementUtilities.isLogicalOperator(ele2)){
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
        var sbgnclass = node.data("class");
        return chise.elementUtilities.mustBeSquare(sbgnclass);
      }, // with only 4 active grapples (at corners)
      isNoResizeMode: function (node) {
        return node.is(':parent') && !appUtilities.currentGeneralProperties.allowCompoundNodeResize;
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
          var edgeParams = {class : modeHandler.selectedEdgeType, language : modeHandler.selectedLanguage};

          // if added edge changes map type, warn user
          if (chise.getMapType() && chise.getMapType() != "Unknown" && edgeParams.language != chise.getMapType()){
            appUtilities.promptMapTypeView.render(function(){
                chise.addEdge(source, target, edgeParams);});
          }
          else{
            chise.addEdge(source, target, edgeParams);
          }
          
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
      handleSize: 0, // the size of the edge handle put on nodes (Note that it is 0 because we do not want to see the handle)
      handleHitThreshold: 0,
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
        range: gridProperties.distributionAlignmentRange,
        minDistRange: gridProperties.minDistributionAlignmentRange
      }
    });

    var panProps = {
      fitPadding: 10,
      fitSelector: ':visible',
      animateOnFit: function () {
        return appUtilities.currentGeneralProperties.animateOnDrawingChanges;
      },
      animateOnZoom: function () {
        return appUtilities.currentGeneralProperties.animateOnDrawingChanges;
      }
    };

    cy.panzoom(panProps);
  }

  function bindCyEvents() {
    cy.on('layoutstart', function(event) {
      if (event.layout.options.name !== 'preset') {
        appUtilities.currentGeneralProperties.enablePorts = false;
      }
    });
    
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
    cy.on("expandcollapse.aftercollapse expandcollapse.afterexpand", function(e, type, node) {
      cy.nodeResize('get').refreshGrapples();
    });
    
    cy.on("afterDo", function (event, actionName, args, res) {
      refreshUndoRedoButtonsStatus();

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
      refreshUndoRedoButtonsStatus();
      cy.style().update();
      inspectorUtilities.handleSBGNInspector();

      if(actionName == "resize") {
        var node = res.node;
        // ensure consistency of infoboxes through resizing
        if(node.data('statesandinfos').length > 0) {
          updateInfoBox(node);
        }
      }
    });

    cy.on("afterRedo", function (event, actionName, args, res) {
      refreshUndoRedoButtonsStatus();
      cy.style().update();
      inspectorUtilities.handleSBGNInspector();

      if(actionName == "resize") {
        var node = res.node;
        // ensure consistency of infoboxes through resizing
        if(node.data('statesandinfos').length > 0) {
          updateInfoBox(node);
        }
      }
    });
    
    cy.on("mousedown", "node", function (event) {
      var self = this;
      if (modeHandler.mode == 'selection-mode' && appUtilities.ctrlKeyDown) {
        appUtilities.enableDragAndDropMode();
        appUtilities.nodesToDragAndDrop = self.union(cy.nodes(':selected'));
        appUtilities.dragAndDropStartPosition = event.position || event.cyPosition;
      }
    });
    
    cy.on("mouseup", function (event) {
      var self = event.target || event.cyTarget;
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
        
        var pos = event.position || event.cyPosition;
        chise.changeParent(nodes, newParent, pos.x - appUtilities.dragAndDropStartPosition.x, 
                              pos.y - appUtilities.dragAndDropStartPosition.y);

        appUtilities.dragAndDropStartPosition = null;
        appUtilities.nodesToDragAndDrop = null;
      }

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
    
    // Indicates whether creating a process with convenient edges
    var convenientProcessSource;
    // cyTarget will be selected after 'tap' event is ended by cy core. We do not want this behaviour.
    // Therefore we need to set node to unselect on 'tapend' event (this may be changed as 'tap' event later),
    //  which is to be unselected on 'select' event.
    var nodeToUnselect;
    
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
        cyTarget = event.target || event.cyTarget;
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
            var pos = event.position || event.cyPosition;
            cyPosX = pos.x;
            cyPosY = pos.y;
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
            
            // Set nodeToUnselect here
            nodeToUnselect = cyTarget;
          }
          
          // If parent is defined get parentId and parentClass
          if (parent) {
            parentId = parent.id();
            parentClass = parent.data('class');
          }
          
          // If the parent class is valid for the node type then add the node
          if (chise.elementUtilities.isValidParent(nodeType, parentClass)) {
            var nodeParams = {class : nodeType, language : modeHandler.selectedLanguage};

            // if added node changes map type, warn user
            if (chise.getMapType() && chise.getMapType() != "Unknown" && nodeParams.language != chise.getMapType()){
              appUtilities.promptMapTypeView.render(function(){
                  chise.addNode(cyPosX, cyPosY, nodeParams, undefined, parentId);});
            }
            else{
              chise.addNode(cyPosX, cyPosY, nodeParams, undefined, parentId);
            }

            // If the node will not be added to the root then the parent node may be resized and the top left corner pasition may change after
            // the node is added. Therefore, we may need to clear the expand collapse viusal cue.
            if (parent) {
              cy.expandCollapse('get').clearVisualCue();
            }
          }
        }
        
        // If not in sustainable mode set selection mode
        if (!modeHandler.sustainMode) {
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

        //For complexes and compartments move the textarea to the bottom
        var nodeType = node.data('class');
        if (nodeType == "compartment" || nodeType.startsWith("complex") )
            top += (node.outerHeight() / 2 * cy.zoom() );

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
        $('#inspector-map-tab a').blur();
      }
    });
    
    cy.on('unselect', function() {
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

    // if the position of compund changes by repositioning its children's
    // Note: position event for compound is not triggered in this case
    // edge case: when moving a complex, it triggers the position change of the children,
    // which then triggers the event below.
    var oldPos = {x: undefined, y: undefined};
    var currentPos = {x : 0, y : 0};
    cy.on("position", "node:child[class!='complex']", function(event) {
      var parent = event.target.parent();
      if(!parent.is("[class^='complex']")) {
        return;
      }
      currentPos = parent.position();
      if (currentPos.x != oldPos.x || currentPos.y != oldPos.y){
          oldPos = {x : currentPos.x, y : currentPos.y};
          cy.trigger('noderesize.resizedrag', ['unknown', parent]);
      }
    });
  }

  function updateInfoBox(node) {
    for(var location in node.data('auxunitlayouts')) {
      node.data('auxunitlayouts')[location].update();
    }
  }
};
