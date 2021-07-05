var generalUtils = {};
var polyominoPacking = require('./polyomino-packing');
const { Point } = require('./polyomino-packing');


//a function to remove duplicate object in array
generalUtils.uniqueArray = function (ar) {
  var j = {};
  ar.forEach(function (v) {
    j[v + '::' + typeof v] = v;
  });
  return Object.keys(j).map(function (v) {
    return j[v];
  });
};

//a function to determine the grid cells where a line between point p0 and p1 pass through
generalUtils.LineSuperCover = function (p0, p1) {
  var dx = p1.x - p0.x, dy = p1.y - p0.y;
  var nx = Math.floor(Math.abs(dx)), ny = Math.floor(Math.abs(dy));
  var sign_x = dx > 0 ? 1 : -1, sign_y = dy > 0 ? 1 : -1;

  var p = new polyominoPacking.Point(p0.x, p0.y);
  var points = [new polyominoPacking.Point(p.x, p.y)];
  for (var ix = 0, iy = 0; ix < nx || iy < ny;) {
    if ((0.5 + ix) / nx == (0.5 + iy) / ny) {
      // next step is diagonal
      p.x += sign_x;
      p.y += sign_y;
      ix++;
      iy++;
    } else if ((0.5 + ix) / nx < (0.5 + iy) / ny) {
      // next step is horizontal
      p.x += sign_x;
      ix++;
    } else {
      // next step is vertical
      p.y += sign_y;
      iy++;
    }
    points.push(new polyominoPacking.Point(p.x, p.y));
  }
  return points;
};

/**
 * finds the current center of components
 * @param { Array } components 
 */
generalUtils.getCenter = function (components) {
  // In case the platform doesn't have flatMap function
  if (typeof Array.prototype['flatMap'] === 'undefined') {
    Array.prototype['flatMap'] = function (f) {
      const concat = (x, y) => x.concat(y);
      const flatMap = (f, xs) => xs.map(f).reduce(concat, []);

      return flatMap(f, this);
    };
  }

  // @ts-ignore
  let bounds = components.flatMap(component => component.nodes)
    .map(node => ({
      left: node.x,
      top: node.y,
      right: node.x + node.width - 1,
      bottom: node.y + node.height - 1,
    }))
    .reduce((bounds, currNode) => ({
        left: Math.min(currNode.left, bounds.left),
        right: Math.max(currNode.right, bounds.right),
        top: Math.min(currNode.top, bounds.top),
        bottom: Math.max(currNode.bottom, bounds.bottom)
    }), {
      left: Number.MAX_VALUE,
      right: -Number.MAX_VALUE,
      top: Number.MAX_VALUE,
      bottom: -Number.MAX_VALUE
    });

  return new Point((bounds.left + bounds.right) / 2, (bounds.top + bounds.bottom) / 2);
};

module.exports = generalUtils;