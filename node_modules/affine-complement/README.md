affine-complement
=================
Given a tuple of at most (d+1) points in d-dimensional affine space, find a basis for the affine complement of the point set.

# Example

```javascript
var points = [ [1, 0, 0], [0, 1, 0] ]
var copoints = require('affine-complement')(3, points)

console.log(copoints)
```

# Install

```
npm install affine-complement
```

# API

#### `var co = require('affine-complement')(d, points)`
Finds a basis for the affine complement of `points`

* `d` is the dimension of the ambient space
* `points` is an array of points in `d` dimensional affine space

**Returns** An array of `(d+1-points.length)` points which when combined with `points` spans d-dimensional affine space.  If no such points exist, then returns `null`.

**Note** These points are selected deterministically

# Credits
(c) 2014 Mikola Lysenko. MIT License