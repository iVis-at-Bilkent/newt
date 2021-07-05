import { Feature, Properties, Polygon as TurfPoly, LineString, Point, FeatureCollection, BBox } from '@turf/helpers';
import { ILine, IPoint, IRectangle } from '../models/common';
import { Polygon } from '../models/polygon';
export declare const pointToArray: (point: IPoint) => [number, number];
export declare const arrayToPoint: ([x, y]: [number, number]) => {
    x: number;
    y: number;
};
/**
 * converts [ { x, y } ] to [x, y] form
 * @param points
 */
export declare const toGeoJSON: (points: IPoint[]) => [number, number][];
export declare const turfLine: (line: ILine) => Feature<LineString, Properties>;
export declare const turfPoly: (poly: Polygon) => Feature<TurfPoly, Properties>;
export declare const turfBboxToRectangle: (turfBbox: BBox) => IRectangle;
export declare const fromTurfLine: (turfLine: FeatureCollection<Point>) => ILine | null;
export declare const fromTurfPoint: (turfPoint: Feature<Point>) => IPoint;
