import { IPoint } from '../models/common';
import { Polygon } from '../models/polygon';

export function convexMinkowskiSum(A: Polygon, B: Polygon): IPoint[] {
    const points: IPoint[] = [];

    for (let p1 of A.points) {
        for (let p2 of B.points) {
            const sumP = { x: p1.x + p2.x, y: p1.y + p2.y }; 
            
            points.push(sumP);
        }
    }

    return points;
}

