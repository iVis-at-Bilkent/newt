import { IPoint, IGraph, IRectangle } from './common';
/**
 * TODO: test if bbox working correctly after move
 */
export declare class Polygon {
    private mPoints;
    private mBase;
    /** Cache center of the vertices */
    private mVerticeCenter;
    private mVerticesBbox;
    private constructor();
    static fromGraph(graph: IGraph): Polygon;
    static fromPoints(points: IPoint[]): Polygon;
    /**
     * Initializes a polygon without converting points to a convex hull
     * Use only when you are sure that `points` are convex
     */
    static fromPointsUnsafe(points: IPoint[]): Polygon;
    private withBase;
    move(disposition: IPoint): void;
    /** Sorted by angle. Counterclockwise direction */
    get points(): IPoint[];
    get pointCount(): number;
    /**
     * Origin of the vertices
     */
    get base(): IPoint;
    get center(): IPoint;
    negative(): Polygon;
    getSafeIndex(index: number): number;
    getPoint(index: number): IPoint;
    getPrevPoint(index: number): IPoint;
    getNextPoint(index: number): IPoint;
    get boundingBox(): IRectangle;
    private static convexHull;
    private static removeDuplicates;
    private static topLeft;
}
