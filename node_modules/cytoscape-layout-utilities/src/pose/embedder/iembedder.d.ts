import { IEdge } from "../models/common";
import { Polygon } from "../models/polygon";
import { LayoutOptions } from "../pose";
export declare type EmbedderOptions = LayoutOptions & {
    componentSpacing: number;
};
/**
 * Performs a single layout iteration
 * TODO: remove return type
 * @param components
 * @returns displacement correspond to each polygon
 */
export declare type LayoutFn = (components: PolyGraph, options: EmbedderOptions) => void;
export declare type AdjList<T = number> = T[][];
export declare type EmbedderEdge = IEdge<number>;
/**
 * Graph which nodes are shaped like polygons
 */
export declare type PolyGraph = {
    nodes: Polygon[];
    /** indexes+  */
    edges: AdjList;
};
