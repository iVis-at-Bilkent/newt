import { IPoint, IRectangle } from '../../models/common';
import { Polygon } from '../../models/polygon';
import { IDistanceDetection } from './idistance-detection';
/**
 * TODO: test
 */
export declare class GridSquareDistanceDetection implements IDistanceDetection<Polygon> {
    private mPolygons;
    private mFrame;
    private mGrid;
    private mWidth;
    private mHeight;
    private mGridLength;
    private currentPadding;
    constructor(mPolygons: Polygon[], mFrame: IRectangle);
    getSquare(i: number, j: number): number[];
    expandGrid(): void;
    getNeighbours(polygon: Polygon): {
        collisions: number[];
        neighbours: number[];
    };
    move(index: number, displacement: IPoint): void;
    get gridHLen(): number;
    get gridVLen(): number;
    getGridRange(rect: IRectangle): IRectangle;
    fillGridRange(range: IRectangle, value: number): void;
    removeGridRange(range: IRectangle, value: number): void;
    expand(gridSquare: IRectangle): IRectangle;
}
