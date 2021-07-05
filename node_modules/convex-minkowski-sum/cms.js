'use strict'

module.exports = convexMinkowskiSum
module.exports.faces = convexMinkowskiSumFaces
module.exports.pairs = convexMinkowskiSumPairs

var convexHull = require('full-convex-hull')
var uniq = require('uniq')

function embed(d, P, w, res) {
  for(var i=0, n=P.length; i<n; ++i) {
    var p = P[i]
      , q = new Array(d+1)
    for(var j=0; j<d; ++j) {
      q[j] = p[j]
    }
    q[d] = w
    res.push(q)
  }
}

function comparePair(a,b) {
  var d = a[0] - b[0]
  if(d) {
    return d
  }
  return a[1] - b[1]
}

function convexMinkowskiSumHull(A, B) {
  var n = A.length
  var m = B.length
  if(n === 0 || m === 0) {
    return []
  }
  var d = A[0].length
  var pts = []
  embed(d, A, -1, pts)
  embed(d, B,  1, pts)
  return convexHull(pts)
}

function convexMinkowskiSumFaces(A, B) {
  var hull = convexMinkowskiSumHull(A, B)
  var result = []
  var n = A.length
  for(var i=0, h=hull.length; i<h; ++i) {
    var c = hull[i]
    var fA = []
    var fB = []
    for(var j=0, d=c.length; j<d; ++j) {
      var v = c[j]
      if(v < n) {
        fA.push(v)
      } else {
        fB.push(v-n)
      }
    }
    if(fA.length > 0 && fB.length > 0) {
      result.push([fA, fB])
    }
  }
  return result
}


function convexMinkowskiSumPairs(A, B) {
  var hull = convexMinkowskiSumHull(A, B)
  if(hull.length === 0) {
    return []
  }
  var result = []
  var n = A.length
  for(var i=0,nh=hull.length; i<nh; ++i) {
    var c = hull[i]
    for(var j=0,d=c.length; j<d; ++j) {
      var a = c[j]
      for(var k=0; k<j; ++k) {
        var b = c[k]
        var l = Math.min(a,b)
        var h = Math.max(a,b)
        if(l < n && h >= n) {
          result.push([l,h-n])
        }
      }
    }
  }
  return uniq(result, comparePair)
}

function convexMinkowskiSum(A, B) {
  var pairs = convexMinkowskiSumPairs(A,B)
  if(pairs.length === 0) {
    return []
  }
  var np = pairs.length
  var points = new Array(np)
  var d = A[0].length
  for(var i=0; i<np; ++i) {
    var p = pairs[i]
    var a = A[p[0]]
    var b = B[p[1]]
    var q = new Array(d)
    for(var j=0; j<d; ++j) {
      q[j] = a[j] + b[j]
    }
    points[i] = q
  }
  return points
}