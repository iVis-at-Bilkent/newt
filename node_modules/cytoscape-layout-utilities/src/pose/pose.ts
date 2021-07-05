import { basicEmbed } from "./embedder/basic-embedder";
import { IPoint, IRectangle } from "./models/common";
import { Polygon } from "./models/polygon";
import { AdjList, EmbedderOptions } from "./embedder/iembedder";
import { area, boundingBox, distance } from "./utils";
import { GridSquareDistanceDetection } from './embedder/distance-detection/gridsquare-distance-detection';
import { findNeighbors } from './algorithms/voronoi';

export enum DistanceDetectionType {
    BASIC = "BASIC",
    GRID_SQUARE = "GRID_SQUARE",
}

export type DistanceDetectionArgs = 
    { 
        type: DistanceDetectionType.BASIC,
    } |
    { 
        type: DistanceDetectionType.GRID_SQUARE, 
        detection: GridSquareDistanceDetection,
    };

export type LayoutOptions = 
    {
        step?: number,
        componentSpacing?: number,
    } &
    DistanceDetectionArgs;

export const DEFAULT_OPTIONS: LayoutOptions = {
    type: DistanceDetectionType.BASIC,
    componentSpacing: 50,
};

type PackResult = {
    shifts: { dx: number, dy: number }[],
    fullness: number,
};

/**
 * Packs regular disconnected graph components
 * @param components each component represents a connected graph in itself
 * @param options 
 */
export const packComponents = (components: Component[], options: LayoutOptions = DEFAULT_OPTIONS): PackResult => {
    if (options !== DEFAULT_OPTIONS) {
        options = { 
            ...DEFAULT_OPTIONS, 
            ...options, 
        };
    }

    const embedderOptions: EmbedderOptions = { 
        ...options, 
        componentSpacing: options.componentSpacing !== undefined ? options.componentSpacing : calculateIdealDistance(components) 
    };

    // console.log(`component spacing: ${embedderOptions.componentSpacing}`);

    // console.log(`ideal distance: ${options.componentDistance}`);

    const polygons = components.map(c => componentToPolygon(c));

    const edges = constructEdges(polygons);
    // console.log(JSON.stringify(edges));

    const polyGraph = {
        nodes: polygons,
        edges,
    };

    basicEmbed(polyGraph, embedderOptions);

    const shifts = polyGraph.nodes.map(p => {
        const base = p.base;
        return { dx: base.x, dy: base.y };
    });

    return { shifts, fullness: calculateFullness(polygons) };
};

type Node = {
    x: number, 
    y: number, 
    width: number, 
    height: number, 
};

export type Shape = IPoint[];

type ComponentEdge = {
    startX: number,
    startY: number,
    endX: number,
    endY: number,
};

type Component = {
    nodes: Node[],
    edges: ComponentEdge[];
};

const componentToPolygon = (component: Component): Polygon => {
    const vertices: IPoint[] = [];

    for (const node of component.nodes) {

        vertices.push({ x: node.x, y: node.y });
        vertices.push({ x: node.x + node.width, y: node.y });
        vertices.push({ x: node.x, y: node.y + node.height });
        vertices.push({ x: node.x + node.width, y: node.y + node.height });
    }

    return Polygon.fromPoints(vertices);
};

export const getFrame = (polygons: Polygon[]): IRectangle => {
    const bbox = {
        minX: Number.MAX_SAFE_INTEGER,
        maxX: Number.MIN_SAFE_INTEGER,
        minY: Number.MAX_SAFE_INTEGER,
        maxY: Number.MIN_SAFE_INTEGER,
    };

    for (const p of polygons) {
        const pBbox = p.boundingBox;
        if (pBbox.minX < bbox.minX) {
            bbox.minX = pBbox.minX;
        }
        if (pBbox.maxX > bbox.maxX) {
            bbox.maxX = pBbox.maxX;
        }
        if (pBbox.minY < bbox.minY) {
            bbox.minY = pBbox.minY;
        }
        if (pBbox.maxY > bbox.maxY) {
            bbox.maxY = pBbox.maxY;
        }
    }

    return bbox;
}

/**
 * Takes an array of polygons and returns which ones should be attractive to each other based on their center's voronoi diagrams
 * @param polygons 
 */
export const constructEdges = (polygons: Polygon[]): AdjList => {
    const edges: AdjList = Array.from({ length: polygons.length }, () => []);

    // Bounding box of the polygons are their frame
    const bbox = boundingBox(polygons.map(p => p.boundingBox));
    const centers = polygons.map(p => p.center);

    // console.log(`centers: ${JSON.stringify(centers)}`);

    const neighbors = findNeighbors(bbox, centers);

    for (let i = 0; i < neighbors.length; ++i) {
        // Neighbor of i-th polygon
        for (const neighbor of neighbors[i]) {
            // Only add bigger ones so we add only one for each
            if (neighbor > i) {
                edges[i].push(neighbor);
                // edges.push({ from: i, to: neighbor });                
            }
        }
    }

    return edges;
};

const calculateIdealDistance = (components: Component[]): number => {
    let avgDistance = 0;
    let len = 0;

    for (const component of components) {
        // Choose first edge of first node from each component
        if (component.edges.length > 0) {
            len += 1;

            const edge = component.edges[0];

            const edgeLength = Math.sqrt(distance({ x: edge.startX, y: edge.startY }, { x: edge.endX, y: edge.endY }));
    
            // console.log(`distance: ${edgeLength}`);
    
            avgDistance += edgeLength;
        }

        /* // Single components
        if (edge.length > 0) {
            len += 1;

            const node1 = component.nodes[0];
            const node2 = component.nodes[edge[0]];
    
            const nodeDistance = Math.sqrt(distance(node1, node2)); 
    
            // console.log(`distance: ${nodeDistance}`);
            
            avgDistance += nodeDistance;
        } */
    }

    // TODO: if all components are single 
    // console.log(avgDistance / len);

    return (avgDistance / len) * 1.5;
};

const calculateFullness = (polygons: Polygon[]): number => {
    const polygonBboxes = polygons.map(p => p.boundingBox);

    const bbox = boundingBox(polygonBboxes);

    return (
        polygonBboxes.map(bb => area(bb))
            .reduce((a, s) => a + s) 
        / area(bbox)
    ) * 100;
};