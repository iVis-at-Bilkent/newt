'use strict'

module.exports = fullHull

var convexHull = require('convex-hull')
var affineHull = require('affine-hull')
var affineComplement = require('affine-complement')
var sc = require('simplicial-complex')

function fullHull(pts) {
  if(pts.length === 0) {
    return []
  }
  var hull = convexHull(pts)
  if(hull.length > 0) {
    return hull
  }

  //Degenerate hull, add extra points to cover gap
  var d     = pts[0].length
  var aff   = affineHull(pts)
  var dim   = aff.length
  var basis = new Array(dim)
  for(var i=0; i<dim; ++i) {
    basis[i] = pts[i]
  }
  var co   = affineComplement(d, basis)
  if(!co) {
    return []
  }
  var cod  = co.length
  var eop  = pts.length
  var npts = co.concat(pts)

  //Re-run convex hull
  hull = convexHull(npts)

  //Filter out faces
  var filtered = []
  for(var i=0, h=hull.length; i<h; ++i) {
    var f = hull[i]
    var c = []
    for(var j=0; j<f.length; ++j) {
      var v = f[j]
      if(v >= cod) {
        c.push(v - cod)
      }
    }
    if(c.length === dim) {
      filtered.push(c)
    }
  }
  return sc.unique(sc.normalize(filtered))
}