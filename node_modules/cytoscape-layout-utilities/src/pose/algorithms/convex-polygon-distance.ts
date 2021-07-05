import { Polygon } from '../models/polygon';
import { IPoint, ILine } from '../models/common';
import { lengthFromOrigin, shortestPointLineToPoint } from '../utils';
import { convexMinkowskiSum } from './minkowski-sum';

export enum DistanceCalculationStrategy {
    BruteForce,
    Linear, // TODO
    Logarithmic // TODO
}

/**
 * Returns the squared distance between two polygon and the direction
 */
export const convexPolygonDistance = (p: Polygon, q: Polygon, strategy: DistanceCalculationStrategy = DistanceCalculationStrategy.BruteForce)
: {
    distance: number,
    unitVector: IPoint,
} => {
    const qNeg = q.negative();

    switch (strategy) {
        case DistanceCalculationStrategy.BruteForce:
            const msum = convexMinkowskiSum(p, qNeg);

            // console.log(`minkowski sum: ${JSON.stringify(msum)}`);

            // Convert to polygon so points become sorted
            const poly = Polygon.fromPoints(msum);

            const distancesWithDirections = poly.points.map((p, i) => {
                const line = { from: p, to: poly.getNextPoint(i) };

                const shortestPoints = shortestPointLineToPoint(line, { x: 0, y: 0 });
                const distance = lengthFromOrigin(shortestPoints[0]);
                const sqrtDistance = Math.sqrt(distance);
                const unitVector = { 
                    x: (shortestPoints[1].x - shortestPoints[0].x) / sqrtDistance,
                    y: (shortestPoints[1].y - shortestPoints[0].y) / sqrtDistance,
                };

                return { distance, unitVector };
            });

            return distancesWithDirections
                .reduce((min, dist) => dist.distance < min.distance ? dist : min);
        default:
            throw new Error(`Strategy ${strategy} has not implemented yet`);
    }
}

export const angle = (from: IPoint, to1: IPoint, to2: IPoint): number => {
    const   dy1 = to1.y - from.y,
            dx1 = to1.x - from.x,
            dy2 = to2.y - from.y,
            dx2 = to2.x - from.x;

    const doty = dy1 * dy2;
    const dotx = dx1 * dx2;
    const len1 = Math.sqrt((dy1 * dy1) + (dx1 * dx1));
    const len2 = Math.sqrt((dy2 * dy2) + (dx2 * dx2));
    
    const ang = Math.acos((dotx + doty) / (len1 * len2));

    return above({ from, to: to1 }, to2) ? ang : -ang;
}

/**
 * returns positive number if point `p` is left of line `l`
 */
export const direction = (l: ILine, p: IPoint): number =>
    ((l.to.x - l.from.x) * (p.y - l.from.y)) -
    ((p.x - l.from.x) * (l.to.y - l.from.y));

export const above = (l: ILine, p: IPoint) => direction(l, p) > 0;
export const below = (l: ILine, p: IPoint) => direction(l, p) < 0;