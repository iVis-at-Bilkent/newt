var sbgn = require('./sbgn');
var caller = {};

function getShape( render, node ) {
  return render.nodeShapes[ render.getNodeShape( node ) ];
}

caller.draw = function( context, node, imgObj, render ) {
  var shape = getShape( render, node );

  if( sbgn.sbgnShapes[ render.getNodeShape( node ) ] ) {
    shape.draw( context, node, imgObj );
  }
  else {
    var pos = node.position();
    shape.draw( context, pos.x, pos.y, node.outerWidth(), node.outerHeight() );
  }
};

caller.intersectLine = function( node, x, y, render ) {
  var intersect;
  var shape = getShape( render, node );

  if( sbgn.isNodeShapeTotallyOverriden( render, node ) ) {
    intersect = shape.intersectLine( node, x, y );
  }
  else {
    var pos = node.position();
    intersect = shape.intersectLine(
      pos.x, pos.y, node.outerWidth(), node.outerHeight(), x, y, 0
    );
  }

  return intersect;
};

caller.checkPoint = function( x, y, node, threshold, render ) {
  var cp;
  var shape = getShape( render, node );

  if( sbgn.isNodeShapeTotallyOverriden( render, node ) ) {
    cp = shape.checkPoint( x, y, node, threshold );
  }
  else {
    var pos = node.position();
    cp = shape.checkPoint( x, y, 0, node.outerWidth() + 2 * threshold, node.outerHeight() + 2 * threshold, pos.x, pos.y );
  }

  return cp;
};

module.exports = caller;
