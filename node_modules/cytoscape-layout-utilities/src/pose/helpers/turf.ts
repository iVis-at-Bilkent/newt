import { Feature, lineString, polygon, Properties, Polygon as TurfPoly, LineString, Point, FeatureCollection, BBox } from '@turf/helpers';
import assert from 'assert';
import { ILine, IPoint, IRectangle } from '../models/common';
import { Polygon } from '../models/polygon';

export const pointToArray = (point: IPoint): [number, number] =>
    [ point.x, point.y ];

export const arrayToPoint = ([ x, y ]: [number, number]) =>
    ({ x, y });

/**
 * converts [ { x, y } ] to [x, y] form
 * @param points 
 */
export const toGeoJSON = (points: IPoint[]): [number, number][] => 
    points.map(pointToArray);

export const turfLine = (line: ILine) =>
    lineString([ pointToArray(line.from), pointToArray(line.to) ]);

export const turfPoly  = (poly: Polygon) => {
    const pPoints = poly.points;
    // For some reason poly.getPoint(0) is different then poly.points[0]
    return polygon([ toGeoJSON([ ...pPoints, pPoints[0] ]) ]);
}

export const turfBboxToRectangle = (turfBbox: BBox): IRectangle =>
    ({ 
        minX: turfBbox[0], minY: turfBbox[1],
        maxX: turfBbox[2], maxY: turfBbox[3],
    });

export const fromTurfLine = (turfLine: FeatureCollection<Point>): ILine | null => {
    const coordinates = turfLine.features;

    if (coordinates.length < 2) {
        return null;
    }

    const fromCoord = coordinates[0].geometry?.coordinates as [number, number] | undefined;
    const toCoord = coordinates[1].geometry?.coordinates as [number, number] | undefined;

    if (fromCoord && toCoord) {
        return { 
            from: arrayToPoint(fromCoord), 
            to: arrayToPoint(toCoord), 
        };
    } else {
        throw new Error('turfLine has null points');   
    }
}

export const fromTurfPoint = (turfPoint: Feature<Point>): IPoint => {
    const coordinates = turfPoint.geometry?.coordinates;

    if (coordinates) {
        return { x: coordinates[0], y: coordinates[1] };
    } else {
        throw new Error('turfPoint.geometry is null');
    }
}