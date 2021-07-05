convex-minkowski-sum
====================
Computes the [Minkowski sum](https://en.wikipedia.org/wiki/Minkowski_addition) of two convex polytopes encoded as sets of points

# Example

```javascript
var msum = require('convex-minkowski-sum')

//A is a triangle in 3D
var A = [[1,0,0], [0,1,0], [1,1,0]]

//B is a line segment
var B = [[0,-1,0], [0,1,0]]

console.log(msum(A,B))
```

# Install

```sh
npm install convex-minkowski-sum
```

# API

```javascript
var msum = require('convex-minkowski-sum')
```

#### `msum(A,B)`
Computes the Minkowski sum of `A` and `B`

* `A` and `B` are both arrays of vertices encoded as d-tuples of points

**Returns** A set of points representing the Minkowski sum of `A` and `B`

#### `msum.pairs(A,B)`
Computes a set of pairs representing the vertices of the Minkowski sum of `A` and `B`

* `A` and `B` are arrays of points

**Returns** An array of pairs representing the vertices on the convex hull of the Minkowski sum of `A` and `B`

#### `msum.faces(A,B)`
Computes the faces of the Minkowski sum of `A` and `B`

* `A` and `B` are arrays of points

**Returns** An array of the faces of the Minkowski sum of `A` and `B` represented as pairs of lists of vertices in `A` and `B` respectively.

# Credits
(c) 2014 Mikola Lysenko. MIT License