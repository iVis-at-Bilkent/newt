'use strict'

var tape = require('tape')
var convexHull = require('../fullhull')

tape('convex-hull-no-degen', function(t) {

  console.log(convexHull([
      [1,0,0],
      [0,0,0],
      [0,1,0],
      [1,1,0]
    ]))

  console.log(convexHull([
      [0,0,0],
      [1,0,0],
      [2,0,0],
      [3,0,0]
    ]))

  console.log(convexHull([
      [0,0,0]
    ]))

  t.end()
})