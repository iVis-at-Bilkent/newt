var msum = require('../cms')

//A is a triangle in 3D
var A = [[1,0,0], [0,1,0], [1,1,0]]

//B is a line segment
var B = [[0,0,-1], [0,0,1]]

console.log(msum(A,B))