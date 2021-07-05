/// <reference types="node" />

type Points = number[][];

declare module 'convex-minkowski-sum' {
    function convexMinkowskiSum(A: Points, B: Points): Points;
    export = convexMinkowskiSum;

   /*  export function faces(A: Points, B: Points): Points;

    export function pairs(A: Points, B: Points): Points; */
}