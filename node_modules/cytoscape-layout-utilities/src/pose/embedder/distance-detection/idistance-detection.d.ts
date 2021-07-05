import { IPoint } from '../../models/common';
export declare type ForceFn<T> = (value1: T, value2: T) => any;
export interface IDistanceDetection<T> {
    getNeighbours(value: T): {
        collisions: number[];
        neighbours: number[];
    };
    move(index: number, displacement: IPoint): void;
}
