import * as assert from "assert";
import { Polygon } from "../models/polygon";
import { angle, convexPolygonDistance, direction } from "./convex-polygon-distance";

test('direction works', () => {
    let l = {
        from: { x: 0, y: 0 },
        to: { x: -10, y: 10 }
    };

    let p1 = { x: -10, y: 0 }, p2 = { x: 0, y: 10 };

    assert(direction(l, p1) > 0);
    assert(direction(l, p2) < 0);

    l = {
        from: l.to,
        to: l.from
    };

    assert(direction(l, p1) < 0);
    assert(direction(l, p2) > 0);
});

test('angle works', () => {
    assert.strictEqual(angle(
        { x: 0, y: 0 },
        { x: 5, y: -5 },
        { x: 5, y: 5 }
    ), Math.PI / 2);

    assert.strictEqual(angle(
        { x: 0, y: 0 },
        { x: 5, y: 5 },
        { x: 5, y: -5 },
    ), -Math.PI / 2);

    assert.strictEqual(angle(
        { x: 0, y: 0 },
        { x: -5, y: 5 },
        { x: -5, y: -5 }
    ), Math.PI / 2);

    assert.strictEqual(angle(
        { x: 0, y: 0 },
        { x: -5, y: -5 },
        { x: 5, y: -5 }
    ), Math.PI / 2);

    assert.strictEqual(angle(
        { x: 0, y: 0 },
        { x: 5, y: 0 },
        { x: -5, y: -5 },
    ), - 3 * Math.PI / 4);
});

test('convexPolygonDistance works', () => {
    let p = Polygon.fromPoints([
        { x:  0, y:  0 },
        { x:  5, y:  5 },
        { x:  5, y: -5 },
        { x: 10, y:  0 },
    ]);

    let q = Polygon.fromPoints([
        { x: 20, y:  0 },
        { x: 25, y:  5 },
        { x: 25, y: -5 },
        { x: 30, y:  0 },
    ]);

    assert.strictEqual(convexPolygonDistance(p, q).distance, 100);
});