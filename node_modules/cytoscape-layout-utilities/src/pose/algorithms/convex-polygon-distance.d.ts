import { Polygon } from '../models/polygon';
import { IPoint, ILine } from '../models/common';
export declare enum DistanceCalculationStrategy {
    BruteForce = 0,
    Linear = 1,
    Logarithmic = 2
}
/**
 * Returns the squared distance between two polygon and the direction
 */
export declare const convexPolygonDistance: (p: Polygon, q: Polygon, strategy?: DistanceCalculationStrategy) => {
    distance: number;
    unitVector: IPoint;
};
export declare const angle: (from: IPoint, to1: IPoint, to2: IPoint) => number;
/**
 * returns positive number if point `p` is left of line `l`
 */
export declare const direction: (l: ILine, p: IPoint) => number;
export declare const above: (l: ILine, p: IPoint) => boolean;
export declare const below: (l: ILine, p: IPoint) => boolean;
