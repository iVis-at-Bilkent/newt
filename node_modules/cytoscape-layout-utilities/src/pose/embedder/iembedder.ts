import { IEdge } from "../models/common";
import { Polygon } from "../models/polygon";
import { LayoutOptions } from "../pose";

export type EmbedderOptions = LayoutOptions & { componentSpacing: number };

/**
 * Performs a single layout iteration
 * TODO: remove return type
 * @param components 
 * @returns displacement correspond to each polygon
 */
export type LayoutFn = (components: PolyGraph, options: EmbedderOptions) => void;

export type AdjList<T = number> = T[][];

export type EmbedderEdge = IEdge<number>;

/**
 * Graph which nodes are shaped like polygons
 */
export type PolyGraph = {
    nodes: Polygon[],
    /** indexes+  */
    edges: AdjList,
};