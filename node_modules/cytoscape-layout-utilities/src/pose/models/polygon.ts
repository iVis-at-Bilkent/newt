import { IPoint, IGraph, IRectangle, } from './common';
import { orientation, Orientation, mod, distance, slopeAngle } from '../utils';
import { fromTurfPoint, turfPoly } from '../helpers/turf';
import centerOfMass from '@turf/center-of-mass';

/**
 * TODO: test if bbox working correctly after move
 */
export class Polygon {

    private mBase: IPoint;
    /** Cache center of the vertices */
    private mVerticeCenter: IPoint;
    private mVerticesBbox: IRectangle | null;

    private constructor(private mPoints: IPoint[]) {
        this.mBase = { x: 0, y: 0 };

        // No need to calculate center of mass if only single point
        // this.mVerticeCenter = mPoints.length > 1 ? fromTurfPoint(centerOfMass(turfPoly(this))) : mPoints[0];
        this.mVerticeCenter = { x: 0, y: 0 };

        for (const p of this.mPoints) {
            this.mVerticeCenter.x += p.x;
            this.mVerticeCenter.y += p.y;
        }

        this.mVerticeCenter.x /= this.mPoints.length;
        this.mVerticeCenter.y /= this.mPoints.length;

        this.mVerticesBbox = null;
    }   

    static fromGraph(graph: IGraph): Polygon {
        let points: IPoint[] = [];

        for (let node of graph.nodes) {
            points.push(node.min, node.max);
        }

        return this.fromPoints(points);
    }

    static fromPoints(points: IPoint[]): Polygon {
        return new Polygon(this.convexHull(points));
    }

    /**
     * Initializes a polygon without converting points to a convex hull
     * Use only when you are sure that `points` are convex
     */
    static fromPointsUnsafe(points: IPoint[]): Polygon {
        return new Polygon(points);
    }

    private withBase(point: IPoint): IPoint {
        if (this.base.x == 0 && this.base.y == 0) {
            return point;
        } else {
            return { x: point.x + this.base.x, y: point.y + this.base.y };
        }
    }

    public move(disposition: IPoint): void {
        this.mBase.x += disposition.x;
        this.mBase.y += disposition.y;
    }

    /** Sorted by angle. Counterclockwise direction */
    get points(): IPoint[] {
        if (this.base.x == 0 && this.base.y == 0) {
            return this.mPoints;
        } else {
            // TODO: cache this
            return this.mPoints.map(this.withBase.bind(this));
        }
    }

    get pointCount(): number {
        return this.mPoints.length;
    }

    /**
     * Origin of the vertices 
     */
    get base(): IPoint {
        return this.mBase;
    }

    get center(): IPoint {
        return { 
            x: this.base.x + this.mVerticeCenter.x,
            y: this.base.y + this.mVerticeCenter.y,
        };
    }

    negative(): Polygon {
        // Safe to use constructor because we know points are convex
        return new Polygon(this.points.map(
            p => ({ x: -p.x, y: -p.y })
        ));
    }

    getSafeIndex(index: number): number {
        return mod(index, this.points.length);
    }

    getPoint(index: number): IPoint {
        return this.withBase(this.points[this.getSafeIndex(index)]);
    }

    getPrevPoint(index: number): IPoint {
        return this.withBase(this.getPoint(index - 1));
    }

    getNextPoint(index: number): IPoint {
        return this.withBase(this.getPoint(index + 1));
    }

    get boundingBox(): IRectangle {
        if (this.mVerticesBbox === null) {
            const bbox = {
                minX: Number.MAX_SAFE_INTEGER,
                maxX: Number.MIN_SAFE_INTEGER,
                minY: Number.MAX_SAFE_INTEGER,
                maxY: Number.MIN_SAFE_INTEGER,
            };
    
            for (const p of this.mPoints) {
                if (p.x < bbox.minX) {
                    bbox.minX = p.x;
                } 
                if (p.x > bbox.maxX) {
                    bbox.maxX = p.x;
                }
                if (p.y < bbox.minY) {
                    bbox.minY = p.y;
                } 
                if (p.y > bbox.maxY) {
                    bbox.maxY = p.y;
                }
            }

            this.mVerticesBbox = bbox;
        }  

        const base = this.mBase;

        return {
            minX: this.mVerticesBbox.minX + base.x,
            maxX: this.mVerticesBbox.maxX + base.x,
            minY: this.mVerticesBbox.minY + base.y,
            maxY: this.mVerticesBbox.maxY + base.y,
        };
    }

    private static convexHull(points: IPoint[]): IPoint[] {
        let stack: IPoint[] = [];

        let topLeft: IPoint = Polygon.topLeft(points);

        stack.push(topLeft);

        // Remove top left
        points.splice(points.findIndex(p => p === topLeft), 1);

        // Sort by their angle
        points.sort((a, b) => slopeAngle(topLeft, a) - slopeAngle(topLeft, b));

        // Remove duplicates
        let uniques = this.removeDuplicates(points, topLeft);

        for (let point of uniques) {
            while (stack.length > 1 && orientation(stack[stack.length - 2], stack[stack.length - 1], point) === Orientation.LEFT) {
                stack.pop();
            }
            stack.push(point);
        }

        return stack;
    }

    private static removeDuplicates(points: IPoint[], topLeft: IPoint): IPoint[] {
        let uniques: IPoint[] = [];

        for (let i = 0; i < points.length;) {
            let p = points[i];
            let j = i + 1;

            while (j < points.length && slopeAngle(topLeft, p) - slopeAngle(topLeft, points[j]) === 0) {
                // Always keep the farthest point
                if (distance(topLeft, points[j]) > distance(topLeft, p)) {
                    p = points[j];
                }
                j += 1;
            }
            
            uniques.push(p);
            i = j;
        }

        return uniques;
    }

    private static topLeft(points: IPoint[]): IPoint {
        return points.reduce((topLeft, point) => {
            if (topLeft.y < point.y) {
                return topLeft
            } else if (topLeft.y == point.y) {
                return topLeft.x <= point.x ? topLeft : point;
            } else {
                return point;
            }
        }, { x: Number.MAX_VALUE, y: Number.MAX_VALUE });
    }
}