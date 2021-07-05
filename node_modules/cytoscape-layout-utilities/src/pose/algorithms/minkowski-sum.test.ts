import * as assert from "assert";
import { Polygon } from "../models/polygon";
import { convexMinkowskiSum } from './minkowski-sum';

test('cms works', () => {
    let p1 = Polygon.fromPoints([
        { x:  0, y:  0 },
        { x: 10, y:  0 },
        { x:  0, y: 10 },
        { x: 10, y: 10 },
    ]);

    let p2 = Polygon.fromPoints([
        { x: 20, y:  0 },
        { x: 30, y:  0 },
        { x: 20, y: 10 },
        { x: 30, y: 10 }
    ]);

    const sum = convexMinkowskiSum(p1, p2);

    // console.log(sum);

    assert(sum.findIndex(
        p => JSON.stringify(p) === JSON.stringify({ x: 20, y:  0 })) >= 0);
    assert(sum.findIndex(
        p => JSON.stringify(p) === JSON.stringify({ x: 30, y:  0 })) > 0);
    assert(sum.findIndex(
        p => JSON.stringify(p) === JSON.stringify({ x: 20, y: 10 })) > 0);
    assert(sum.findIndex(
        p => JSON.stringify(p) === JSON.stringify({ x: 30, y: 10 })) > 0);
    
    assert(sum.findIndex(
        p => JSON.stringify(p) === JSON.stringify({ x: 30, y:  0 })) > 0);
    assert(sum.findIndex(
        p => JSON.stringify(p) === JSON.stringify({ x: 40, y:  0 })) > 0);
    assert(sum.findIndex(
        p => JSON.stringify(p) === JSON.stringify({ x: 30, y: 10 })) > 0);
    assert(sum.findIndex(
        p => JSON.stringify(p) === JSON.stringify({ x: 40, y: 10 })) > 0);
    
    assert(sum.findIndex(
        p => JSON.stringify(p) === JSON.stringify({ x: 20, y: 10 })) > 0);
    assert(sum.findIndex(
        p => JSON.stringify(p) === JSON.stringify({ x: 30, y: 10 })) > 0);
    assert(sum.findIndex(
        p => JSON.stringify(p) === JSON.stringify({ x: 20, y: 20 })) > 0);
    assert(sum.findIndex(
        p => JSON.stringify(p) === JSON.stringify({ x: 30, y: 20 })) > 0);
    
    assert(sum.findIndex(
        p => JSON.stringify(p) === JSON.stringify({ x: 30, y: 10 })) > 0);
    assert(sum.findIndex(
        p => JSON.stringify(p) === JSON.stringify({ x: 40, y: 10 })) > 0);
    assert(sum.findIndex(
        p => JSON.stringify(p) === JSON.stringify({ x: 30, y: 20 })) > 0);
    assert(sum.findIndex(
        p => JSON.stringify(p) === JSON.stringify({ x: 40, y: 20 })) > 0);
});