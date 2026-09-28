var Mousetrap = require('mousetrap');
var appUtilities = require('./app-utilities');
var modeHandler = require('./app-mode-handler');

var arrowKeyCombos = [
  "left", "right", "up", "down",
  "shift+left", "shift+right", "shift+up", "shift+down",
  "alt+left", "alt+right", "alt+up", "alt+down",
  "ctrl+left", "ctrl+right", "ctrl+up", "ctrl+down",
  "command+left", "command+right", "command+up", "command+down"
];

function getTopMostNodes(nodes) {
  var nodesMap = Object.create(null);
  var roots = [];

  for (var i = 0; i < nodes.length; i++) {
    nodesMap[nodes[i].id()] = true;
  }

  for (var j = 0; j < nodes.length; j++) {
    var parent = nodes[j].parent()[0];
    while (parent && !nodesMap[parent.id()]) {
      parent = parent.parent()[0];
    }
    // A selected ancestor already moves this node through its descendants.
    if (!parent) {
      roots.push(nodes[j]);
    }
  }

  return nodes.cy().collection(roots);
}

function moveNodes(positionDiff, nodes, notCalcTopMostNodes) {
  if (!notCalcTopMostNodes) {
    nodes = getTopMostNodes(nodes);
  }

  for (var i = 0; i < nodes.length; i++) {
    var node = nodes[i];

    if (node.isParent()) {
      moveNodes(positionDiff, node.children(), true);
    }
    else {
      var position = node.position();
      node.position({
        x: position.x + positionDiff.x,
        y: position.y + positionDiff.y
      });
    }
  }
}

function getReferenceNode(nodes) {
  var topMostNodes = getTopMostNodes(nodes);

  for (var i = 0; i < topMostNodes.length; i++) {
    if (!topMostNodes[i].isParent()) {
      return topMostNodes[i];
    }

    var child = topMostNodes[i].descendants().filter(function (ele) {
      return ele.isNode() && !ele.isParent();
    })[0];

    if (child) {
      return child;
    }
  }

  return topMostNodes[0];
}

function snapPosition(cy, position, gridProperties) {
  var gridGuide = cy.gridGuide ? cy.gridGuide('get') : null;
  var phase = gridProperties.snapToGridDuringDrag ? 'drag' : 'onRelease';

  if (gridGuide && gridGuide.snapPosition) {
    return gridGuide.snapPosition(position, phase);
  }

  var gridSize = Number(gridProperties.gridSize) || 1;
  return {
    x: Math.round(position.x / gridSize) * gridSize,
    y: Math.round(position.y / gridSize) * gridSize
  };
}

function getKeyboardMoveDiff(cy, referencePosition, direction, shouldSnapToGrid, gridProperties, moveSpeed) {
  var gridSize = Number(gridProperties.gridSize) || 1;
  // Keep the original 3/10-unit speeds, rounded to whole grid steps when snapping.
  var step = shouldSnapToGrid ? gridSize * Math.max(1, Math.round(moveSpeed / 3)) : moveSpeed;
  var requestedDiff = { x: 0, y: 0 };

  if (direction === "left") {
    requestedDiff.x = -step;
  }
  else if (direction === "right") {
    requestedDiff.x = step;
  }
  else if (direction === "up") {
    requestedDiff.y = -step;
  }
  else if (direction === "down") {
    requestedDiff.y = step;
  }

  if (!shouldSnapToGrid) {
    return requestedDiff;
  }

  if (!referencePosition) {
    return requestedDiff;
  }

  // Align first, then move by whole grid steps, using the same snap as dragging.
  var snappedPosition = snapPosition(cy, referencePosition, gridProperties);

  return {
    x: snappedPosition.x + requestedDiff.x - referencePosition.x,
    y: snappedPosition.y + requestedDiff.y - referencePosition.y
  };
}

module.exports = function () {
  var mt = new Mousetrap();

  mt.bind(["ctrl+z", "command+z"], function () {

    // use active cy instance
    var cy = appUtilities.getActiveCy();

    cy.undoRedo().undo();

    // return false to prevent default browser behavior
    // and stop event from bubbling
    return false;
  });
  mt.bind(["ctrl+y", "command+y"], function () {

    // use active cy instance
    var cy = appUtilities.getActiveCy();

    cy.undoRedo().redo();

    // return false to prevent default browser behavior
    // and stop event from bubbling
    // on chrome -> cmd+y opens history in a new tab
    return false;
  });
  mt.bind(["ctrl+c", "command+c"], function () {

    // use active chise instance
    var chiseInstance = appUtilities.getActiveChiseInstance();

    // get cy associated with active chise instance
    var cy = chiseInstance.getCy();

    chiseInstance.copyElements(cy.$(":selected"));
  });
  mt.bind(["ctrl+v", "command+v"], function () {

    // use active chise instance
    var chiseInstance = appUtilities.getActiveChiseInstance();

    chiseInstance.pasteElements();
  });
  mt.bind(["ctrl+a", "command+a"], function () {

    // use active cy instance
    var cy = appUtilities.getActiveCy();

    cy.elements().select();
    
    // return false to prevent default browser behavior
    // and stop event from bubbling
    return false;
  });
  mt.bind(["del", "backspace"], function () {
    // use active chise instance
    var chiseInstance = appUtilities.getActiveChiseInstance();

    // get cy associated with active chise instance
    var cy = chiseInstance.getCy();

    var currentGeneralProperties = appUtilities.getScratch(cy, "currentGeneralProperties");
    var currentMapType = chiseInstance.getMapType();

    // Check if SIF topology grouping is enabled and map type is SIF, and show warning if it is
    if (
      currentMapType === "SIF" &&
      currentGeneralProperties.enableSIFTopologyGrouping
    ) {
      appUtilities.promptSIFTopologyGroupingWarning.render();
    }
  
    chiseInstance.deleteElesSimple(cy.elements(':selected'));
    
    
    if(!chiseInstance.elementUtilities.isGraphTopologyLocked())
    $('#inspector-palette-tab a').tab('show');
    // return false to prevent default browser behavior
    // and stop event from bubbling
    return false;
  });
  mt.bind(["ctrl", "command"], function () {
    appUtilities.ctrlKeyDown = true;
  }, "keydown");
  mt.bind(["ctrl", "command"], function () {
    appUtilities.ctrlKeyDown = null;
    // when cy param is not specified uses active cy instance
    appUtilities.disableDragAndDropMode();
  }, "keyup");

  mt.bind("alt", function() {
    appUtilities.altKeyDown = true;
  }, "keydown");

  mt.bind("alt", function () {
    appUtilities.altKeyDown = null;
  }, "keyup");

  mt.bind(arrowKeyCombos, function (event, keyCombo) {
    var cy = appUtilities.getActiveCy();
    if (!cy) {
      return true;
    }

    var selectedNodes = cy.nodes(":visible:selected");
    var direction = keyCombo.split("+").pop();
    var gridProperties = appUtilities.getScratch(cy, 'currentGridProperties') || {};
    var bypassGridSnap = event.ctrlKey || event.metaKey || event.altKey;
    var moveSpeed = event.altKey ? 1 : (event.shiftKey ? 10 : 3);
    var shouldSnapToGrid = !bypassGridSnap &&
      (gridProperties.snapToGridOnRelease || gridProperties.snapToGridDuringDrag);
    if (selectedNodes.empty()) {
      // Preserve edge-editing's rule: move anchors only for one selected edge.
      var selectedEdges = cy.edges(":visible:selected");
      if (selectedEdges.length !== 1 || cy.elements(":selected").length !== 1) {
        return true;
      }
      var edgeEditing = cy.edgeEditing('get');
      var edge = selectedEdges[0];
      var anchors = edgeEditing.getAnchorsAsArray(edge);
      if (!anchors || anchors.length < 2) {
        return true;
      }
      var type = edgeEditing.getEdgeType(edge);
      var anchorDiff = getKeyboardMoveDiff(cy, { x: anchors[0], y: anchors[1] },
        direction, shouldSnapToGrid && type === 'bend', gridProperties, moveSpeed);
      var positions = [];
      for (var i = 0; i < anchors.length; i += 2) {
        positions.push({ x: anchors[i] + anchorDiff.x, y: anchors[i + 1] + anchorDiff.y });
      }
      edge.data(type === 'bend' ? 'bendPointPositions' : 'controlPointPositions', positions);
      edgeEditing.initAnchorPoints(selectedEdges);
      if (appUtilities.undoable && cy.undoRedo) {
        // This action records an already-applied move on its first execution.
        cy.undoRedo().do("moveAnchorPoints", {
          edges: selectedEdges,
          positionDiff: { x: -anchorDiff.x, y: -anchorDiff.y }
        });
      }
      return false;
    }

    var referenceNode = getReferenceNode(selectedNodes);
    var positionDiff = getKeyboardMoveDiff(cy, referenceNode && referenceNode.position(),
      direction, shouldSnapToGrid, gridProperties, moveSpeed);

    if (positionDiff.x === 0 && positionDiff.y === 0) {
      return false;
    }

    cy.startBatch();
    moveNodes(positionDiff, selectedNodes);
    cy.endBatch();

    if (cy.undoRedo) {
      cy.undoRedo().do("drag", {
        positionDiff: positionDiff,
        nodes: selectedNodes,
        move: false
      });
    }

    // return false to prevent default browser behavior
    // and stop event from bubbling
    return false;
  });

  mt.bind(["esc"], function () {

    // use active cy instance
    var cy = appUtilities.getActiveCy();

    modeHandler.setSelectionMode();
    cy.elements().unselect();
  });
};
