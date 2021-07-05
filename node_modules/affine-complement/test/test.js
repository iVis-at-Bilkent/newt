'use strict'

var tape = require('tape')
var orient = require('robust-orientation')
var acomp = require('../acomp')

tape('affine-complement', function(t) {

  function check(d, p) {
    var c = acomp(d, p)
    t.ok(orient.apply(void 0, p.concat(c)) !== 0, 'p:[' + p.join(']-[') + '] - c:[' + c.join(']-[') + ']')
  }

  check(1, [[1]])
  check(1, [[0]])
  check(1, [[-1]])
  t.equals(acomp(1, [[1], [1]]), null)

  check(2, [[1,1],[2,4]])
  check(2, [[1,1]])
  check(2, [[0,0]])
  check(2, [])
  t.equals(acomp(2, [[1,1], [1,1]]), null)

  check(3, [[1,1,1], [2,4,8], [3,9,27]])
  check(3, [[1,1,1], [2,4,8]])

  t.end()
})