full-convex-hull
=========
Computes the convex hull of a set of (possibly degenerate points).

For most inputs, this module is equivalent to `convex-hull`, except if the point set is degenerate, it will return the convex hull of the lower dimensional subset instead of an empty hull.

Handling these degeneracies is more expensive, so if you don't need this behavior you should use the regular `convex-hull` module.

# Example

```javascript
var convexHull = require('full-convex-hull')

var points = [[1,0,0], [0,1,0], [1,1,0], [5,-3,0]]

console.log(convexHull(points))
```

# Install

```
npm install full-convex-hull
```

# API

#### `require('full-convex-hull')(points)`
Computes the convex hull of `points` with degeneracies.

* `points` is an array of points.

**Returns** The convex hull of the point set, handling all degeneracies

# Credits
(c) 2014 Mikola Lysenko. MIT License