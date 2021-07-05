
import * as assert from 'assert';
import { IPoint, IRectangle } from '../../models/common';
import { Polygon } from '../../models/polygon';
import { area } from '../../utils';
import { IDistanceDetection } from './idistance-detection';

/**
 * TODO: test
 */
export class GridSquareDistanceDetection implements IDistanceDetection<Polygon> {
    // Maybe we can use set for faster find
    private mGrid: number[][][]; // value is the index of the polygon
    private mWidth: number;
    private mHeight: number;
    private mGridLength: number;
    private currentPadding: number;

    constructor(private mPolygons: Polygon[], private mFrame: IRectangle) {
        // console.log(`frame: ${JSON.stringify(mFrame)}`);

        this.mWidth = mFrame.maxX - mFrame.minX + 1;
        this.mHeight = mFrame.maxY - mFrame.minY + 1;

        assert(this.mWidth > 0 && this.mHeight > 0, "width and height must be positive");

        const squareArea = area(mFrame) / mPolygons.length;
        this.mGridLength = 2 * Math.sqrt(squareArea);   
        

        this.currentPadding = 0;

        this.mGrid = Array.from({ length: this.gridVLen }, () =>
            Array.from({ length: this.gridHLen } , () => []));

        // console.log(`grid Width: ${this.gridHLen}, grid Height: ${this.gridVLen}`);

        for (const [index, poly] of mPolygons.entries()) {
            const gridSquares = this.getGridRange(poly.boundingBox);

            for (let i = gridSquares.minY; i <= gridSquares.maxY; ++i) {
                for (let j = gridSquares.minX; j <= gridSquares.maxX; ++j) {
                    this.getSquare(i, j).push(index);
                }
            }
        }

        this.move = this.move.bind(this);
    }

    getSquare(i: number, j: number): number[] {
        const transX = i + this.currentPadding;
        const transY = j + this.currentPadding;

        if (transX < 0 || transX >= this.mGrid[0].length || 
            transY < 0 || transY >= this.mGrid.length)
        {
            const newPadding = Math.max(
                -transX, -transY,
                transY - this.mGrid.length + 1,
                transX - this.mGrid[0].length + 1,
            );
            // Expand grid
            this.currentPadding += newPadding;

            const newArray = Array.from({ length: this.gridVLen + (2 * this.currentPadding) }, () =>
                Array.from({ length: this.gridHLen + (2 * this.currentPadding) } , () => ([] as number[])));

            for (let i = 0; i < this.mGrid.length; ++i) {
                for (let j = 0; j < this.mGrid[0].length; ++j) {
                    newArray[i + this.currentPadding][j + this.currentPadding] =
                        this.mGrid[i][j];
                }
            }

            this.mGrid = newArray;
        }

        return this.mGrid
            [i + this.currentPadding]
            [j + this.currentPadding];
    }

    expandGrid() {

    }

    getNeighbours(polygon: Polygon): { collisions: number[], neighbours: number[] } {
        const result = { collisions: [] as number[], neighbours: [] as number[] };
        const isAdded = (pi: number) => result.collisions.find(p => p === pi) || result.neighbours.find(p => p === pi);

        const gridSquares = this.expand(this.getGridRange(polygon.boundingBox));

        for (let i = gridSquares.minY; i <= gridSquares.maxY; ++i) {
            for (let j = gridSquares.minX; j <= gridSquares.maxX; ++j) {
                for (const polyIndex of this.mGrid[i][j]) {
                    const otherPoly = this.mPolygons[polyIndex];
                    if (polygon !== otherPoly) {
                        if ((
                            (   i !== gridSquares.minY &&
                                i !== gridSquares.maxY) ||
                            (   j !== gridSquares.minX &&
                                j !== gridSquares.maxX))) 
                        {
                            if (result.collisions.find(p => p === polyIndex) === undefined) {
                                result.collisions.push(polyIndex);
                                // If there is collision no repulsive force 
                                let i = result.neighbours.findIndex(p => p === polyIndex);
                                if (i !== -1) {
                                    result.neighbours.splice(i, 1);
                                }
                            } 
                        } else {
                            if (!isAdded(polyIndex)) {
                                result.neighbours.push(polyIndex);
                            }
                        }
                    }
                }
            }
        }

        return result;
    }

    move(index: number, displacement: IPoint): void {
        const polygon = this.mPolygons[index];
        const currentSquares = this.getGridRange(polygon.boundingBox);
        
        this.removeGridRange(currentSquares, index);

        polygon.move(displacement);

        const newSquares = this.getGridRange(polygon.boundingBox);

        this.fillGridRange(newSquares, index);
    }

    get gridHLen() {
        return Math.ceil(this.mWidth / this.mGridLength);
    }

    get gridVLen() {
        return Math.ceil(this.mHeight / this.mGridLength);
    }

    getGridRange(rect: IRectangle): IRectangle {
        // This may not work correctly with expand

        return {
            minX: Math.floor((rect.minX - this.mFrame.minX) / this.mGridLength),
            maxX: Math.floor((rect.maxX - this.mFrame.minX) / this.mGridLength),
            minY: Math.floor((rect.minY - this.mFrame.minY) / this.mGridLength),
            maxY: Math.floor((rect.maxY - this.mFrame.maxY) / this.mGridLength),
        };
    }

    fillGridRange(range: IRectangle, value: number): void {
        for (let i = range.minY; i <= range.maxY; ++i) {
            for (let j = range.minX; j <= range.maxX; ++j) {
                this.getSquare(i, j).push(value);
            }
        }
    }

    removeGridRange(range: IRectangle, value: number): void {
        for (let i = range.minY; i <= range.maxY; ++i) {
            for (let j = range.minX; j <= range.maxX; ++j) {
                const index = this.getSquare(i, j).findIndex(p => p === value);

                this.getSquare(i, j).splice(index, 1);
            }
        }
    }

    expand(gridSquare: IRectangle): IRectangle {
        return {
            minX: Math.max(gridSquare.minX - 1, 0),
            maxX: Math.min(gridSquare.maxX + 1, this.gridHLen - 1),
            minY: Math.max(gridSquare.minY - 1, 0),
            maxY: Math.min(gridSquare.maxY + 1, this.gridVLen - 1),
        };
    }
}