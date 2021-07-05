import * as assert from "assert";
import { anglePositive, direction, inRange, length, shortestPointLineToLine } from "./utils";

test('anglePositive works', () => {

    let angle = anglePositive(5, 5);
    assert.strictEqual(angle, Math.PI / 4);


    angle = anglePositive(5, -5);
    assert.strictEqual(angle, 3 * Math.PI / 4);


    angle = anglePositive(-5, -5);
    assert.strictEqual(angle, 5 * Math.PI / 4);


    angle = anglePositive(-5, 5);
    assert.strictEqual(angle, 7 * Math.PI / 4);
});

test('inRange works', () => {

    let l = { from: { x: 5, y: 5 }, to: { x: 10, y: 10 } };
    let p = { x: 0, y: 0 };

    assert(!inRange(p, l));

    p = { x: 5, y: 10 };

    assert(inRange(p, l));

    l = { from: { x: 0, y: 0 }, to: { x: 10, y: 0 } };
    p = { x: 15, y: 5 };

    assert(!inRange(p, l));
});

test('shortestPair works', () => {

    const l1 = { from: { x: 0, y: 0 }, to: { x: 5, y: 5 } };
    const l2 = { from: { x: 10, y: 0 }, to: { x: 10, y: 5 } };

    assert.deepStrictEqual(shortestPointLineToLine(l1, l2), [l1.to, l2.to]);

    const l3 = { from: { x: 0, y: -5 }, to: { x: 5, y: -5 } };

    assert.deepStrictEqual(shortestPointLineToLine(l1, l3), [l1.from, l3.from]);

    const l4 = { from: { x: 3, y: 0 }, to: { x: 8, y: 0 } };

    assert.deepStrictEqual(shortestPointLineToLine(l1, l4), [{ x: 1.5, y: 1.5 }, l4.from]);

});

const line = { from: { x: 0, y: 0 }, to: { x: 4, y: 3 } };

test('length works', () => {
    assert.strictEqual(Math.sqrt(length(line)), 5);
});

test('direction works', () => {    
    assert.deepStrictEqual(direction(line), { x: 4 / 5, y: 3 / 5 });

    const line2 = { from: { x: 4, y: 3 }, to: { x: 0, y: 0 } };

    assert.deepStrictEqual(direction(line2), { x: -4 / 5, y: -3 / 5 });
})