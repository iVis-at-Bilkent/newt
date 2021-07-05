'use strict'

module.exports = affineComplement

var orient = require('robust-orientation')

function momentCurve(r, t, d) {
  for(var i=0; i<d; ++i) {
    r[i] = Math.pow(t, i+1)
  }
  return r
}

function affineComplement(d, pts) {
  var cod   = pts.length
  if(cod === d+1) {
    if(orient.apply(void 0, pts) === 0) {
      return null
    }
    return []
  } else if(cod > d+1) {
    return null
  }
  var frame = new Array(d+1)
  var t = 1.0
  for(var i=0; i<cod; ++i) {
    frame[i] = pts[i]
  }
  for(var i=cod; i<=d; ++i) {
    frame[i] = momentCurve(new Array(d), t++, d)
  }
  var ptr = 0
  for(var i=0; i<=d; ++i) {
    var o = orient.apply(void 0, frame)
    if(o !== 0) {
      return frame.slice(cod)
    }
    momentCurve(frame[ptr+cod], t++, d)
    ptr = (ptr + 1) % (d+1-cod)
  }
  return null
}