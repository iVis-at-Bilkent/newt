import bbox from '@turf/bbox';
import { featureCollection, point, polygon } from '@turf/helpers';
import * as assert from 'assert';
import { Polygon } from '../models/polygon';
import { fromTurfLine, pointToArray, turfBboxToRectangle, turfLine, turfPoly } from "./turf";

test('fromTurfLine works', () => {
    const line = { from: { x: -3, y: -2 }, to: { x: 5, y: 7 } };

    const turfL = featureCollection([ point(pointToArray(line.from)), point(pointToArray(line.to)) ]);

    assert.deepStrictEqual(fromTurfLine(turfL), line);
});

test('turfPoly works', () => {
    const poly = Polygon.fromPoints([
        { x: 0, y: 0 },
        { x: 5, y: 0 },
        { x: 5, y: 5 },
        { x: 0, y: 5 },
    ]);

    const turlP = turfPoly(poly);

    
});

test('turfBboxToRectangle works', () => {
    const poly = polygon([[[5, 5], [0, 0], [-5, 5], [0, 10], [5, 5]]]);

    const polyBbox = bbox(poly);

    const rect = turfBboxToRectangle(polyBbox);

    assert.deepStrictEqual(rect, {
        minX: -5, maxX: 5,
        minY: 0, maxY: 10,
    });
});