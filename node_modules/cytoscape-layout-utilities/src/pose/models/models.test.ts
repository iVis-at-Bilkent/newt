import * as assert from "assert";
import { slopeAngle } from '../utils';
import { IPoint } from "./common";
import { Polygon } from "./polygon";

const shuffle = <T>(arr: T[]) => {
    for (let i = 0; i < arr.length; i += 1) {
        let j = Math.round(Math.random() * (arr.length - 1));

        let temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;
    }
}


test('slope works correctly', () => {
    // sorted in ascending polar angle
    let sortedPoints = [
        { x: -10, y: 0 },
        { x: 0, y: -10 },
        { x: 10, y: 0 },
    ];

    let points: IPoint[] = Array.from(sortedPoints);

    // shuffle
    shuffle(points);

    const topLeft = { x: 0, y: 10 };

    points.sort((a, b) => slopeAngle(topLeft, a) - slopeAngle(topLeft, b));

    // Sorted in descending order
    expect(points).toMatchObject(sortedPoints);
});

test('convex polygon should be create as it is', () => {
    let points: IPoint[] = [
        { x: 0, y: -10 },
        { x: 10, y: 0 },
        { x: 0, y: 10 },
        { x: -10, y: 0 },
    ];

    let pointsClone: IPoint[] = JSON.parse(JSON.stringify(points));

    // shuffle
    shuffle(pointsClone);

    let polygon = Polygon.fromPoints(pointsClone);

    expect(polygon.points).toMatchObject(points);
});

test('convex polygon should remove inside points', () => {
    let points = [
        { x: 0  , y: -10 },
        { x: 5  , y: -5  },
        { x: 10 , y: 0   },
        { x: 5  , y: 0   },
        { x: 0  , y: 10  },
        { x: -5 , y: 0   },
        { x: -10, y: 0   },
        { x: -5 , y: -5  },
    ];

    shuffle(points);

    let polygon = Polygon.fromPoints(points);

    expect(polygon.points).toMatchObject([
        { x: 0  , y: -10 },
        { x: 10 , y: 0   },
        { x: 0  , y: 10  },
        { x: -10, y: 0   },
    ]);
});

test('convex polygon shouldn\'t have (0, 0)', () => {
    let points = Array.from(
        { length: 10 },
        () => ({ x: Math.random() * 10 + 1, y: Math.random() * 10 + 1 })
    );

    let poly = Polygon.fromPoints(points);

    expect(poly.points.filter(q => q.x !== 0 || q.y !== 0).length === 0);
});

test('getPoint works', () => {
    let points = Array.from(
        { length: 10 },
        () => ({ x: Math.random() * 10 + 1, y: Math.random() * 10 + 1 })
    );

    let poly = Polygon.fromPoints(points);

    const len = poly.points.length;

    const p = poly.getPoint(1);
    
    assert.deepStrictEqual(p, poly.points[1]);

    for (let i = -10; i < 10; ++i) {
        const index = 1 + (i * len);

        assert.deepStrictEqual(p, poly.getPoint(index));
    }
});

test('center works', () => {
    const vertices = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 }
    ];

    const poly = Polygon.fromPointsUnsafe(vertices);

    assert.deepStrictEqual(poly.center, { x: 5, y: 5 });

    poly.move({ x: -5, y: -5 });

    assert.deepStrictEqual(poly.center, { x: 0, y: 0 });
});

test('Polygon.boundingBox works', () => {
    const vertices = [
        { x: 0, y: 0 },
        { x: 10, y: -50 },
        { x: 10, y: 10 },
        { x: 533, y: 10 }
    ];

    const poly = Polygon.fromPoints(vertices);

    assert.deepStrictEqual(poly.boundingBox, { minX: 0, maxX: 533, minY: -50, maxY: 10 });
});