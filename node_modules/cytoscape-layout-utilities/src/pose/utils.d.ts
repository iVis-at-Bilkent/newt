import { ILine, IPoint, IRectangle } from "./models/common";
export declare enum Orientation {
    /** orientation > 0 */
    LEFT = 0,
    /** orientation < 0 */
    RIGHT = 1,
    /** orientation = 0 */
    STRAIGHT = 2
}
/**
 * https://medium.com/@harshitsikchi/convex-hulls-explained-baab662c4e94
 * @param p
 * @param q
 * @param r
 */
export declare const orientation: (p: IPoint, q: IPoint, r: IPoint) => Orientation;
/**
 * Return always positive remainder
 */
export declare const mod: (n: number, m: number) => number;
/**
 * Always returns between [0, 2π]
 */
export declare const anglePositive: (y: number, x: number) => number;
/**
 * Returns true if p has an orthogonal projection into l
 */
export declare const inRange: (p: IPoint, l: ILine) => boolean;
/**
 * Converts -pi,pi range to 0,2pi
 */
export declare const negativeToAbsolute: (angle: number) => number;
export declare const shortestPointLineToPoint: (l: ILine, p: IPoint) => [IPoint, IPoint];
export declare const lineToPointDistance: (l: ILine, p: IPoint) => number;
export declare const shortestPointLineToLine: (l1: ILine, l2: ILine) => [IPoint, IPoint];
/**
 * Returns the squared length from origin
 */
export declare const lengthFromOrigin: (p: IPoint) => number;
/**
 * Squared length
 */
export declare const length: (l: ILine) => number;
/**
 * Combines two array elements as pairs \
 * **Example:** zip([a, b, c], [1, 2, 3]) = [ [ a, 1 ], [ b, 2 ], [ c, 3 ] ]
 */
export declare const zip: <K, T>(arr1: K[], arr2: T[]) => [K, T][];
export declare const direction: (l: ILine) => IPoint;
/**
 * Performs a deep copy on an object,
 * @param object object to be copied. Must not be recursive
 */
export declare const clone: <T>(object: T) => T;
/**
 * Do something with array without mutating
 * Useful for debug purposes
 */
export declare const inspect: <T>(arr: T[], action: (arg0: T) => void) => T[];
export declare const distance: (p0: IPoint, p1: IPoint) => number;
export declare const slope: (line: ILine) => number;
/**
 * @param from
 * @param to
 */
export declare const slopeAngle: (from: IPoint, to: IPoint) => number;
export declare const area: (rect: IRectangle) => number;
export declare const boundingBox: (rects: IRectangle[]) => IRectangle;
