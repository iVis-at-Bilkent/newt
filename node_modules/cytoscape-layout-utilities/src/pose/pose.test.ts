import * as assert from 'assert';
import { Polygon } from './models/polygon';
import { constructEdges, getFrame } from "./pose";

test('getFrame works', () => {
    const polys = [
        Polygon.fromPoints([
            { x: 0, y: 0 },
            { x: 10, y: -50 },
            { x: 10, y: 10 },
            { x: 533, y: 100 }
        ]),
        Polygon.fromPoints([
            { x: -50, y: 0 },
            { x: 10, y: -50 },
            { x: 10, y: 10 },
            { x: 533, y: 10 }
        ]),
    ];

    const frame = getFrame(polys);

    assert.deepStrictEqual(frame, { minX: -50, maxX: 533, minY: -50, maxY: 100 });
});

test('constructEdges works', () => {
    const polygons = [
        Polygon.fromPoints([ { x: 0, y: 0 } ]),
        Polygon.fromPoints([ { x: 10, y: 0 } ]),
        Polygon.fromPoints([ { x: 20, y: 0 } ]),
        Polygon.fromPoints([ { x: 0, y: 10 } ]),
        Polygon.fromPoints([ { x: 10, y: 10 } ]),
        Polygon.fromPoints([ { x: 0, y: 20 } ]),
    ];

    const edges = constructEdges(polygons);
    
    // console.log(edges);
});