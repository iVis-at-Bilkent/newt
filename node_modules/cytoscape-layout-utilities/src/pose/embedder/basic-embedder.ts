import { ILine, IPoint, IRectangle } from "../models/common";
import { Polygon } from "../models/polygon";
import { EmbedderOptions, LayoutFn, PolyGraph } from "./iembedder";
import { convexPolygonDistance } from "../algorithms/convex-polygon-distance";
import { direction, lengthFromOrigin, slope } from '../utils';
import { turfPoly } from '../helpers/turf';
import intersection from '@turf/intersect';
import { constructEdges, DistanceDetectionType } from "../pose";

enum ForceType {
    Normal,
    Intersection,
}

export const basicEmbed: LayoutFn = (components: PolyGraph, options: EmbedderOptions) => {
    const ATTRACTIVE_CONSTANT = options.componentSpacing, REPULSIVE_CONSTANT = options.componentSpacing ** 2;
    const CONVERGENCE_THRESHOLD = 1;
    const EDGE_THRESHOLD = 5;
    const MAX_FORCE = ATTRACTIVE_CONSTANT;

    const makeForce = (multiplier: (n: number) => number) => {
        return (p1: Polygon, p2: Polygon) => {
            const { distance, unitVector } = convexPolygonDistance(p1, p2);

            // console.log(`distance: ${distance}`);

            const calculatedForce = multiplier(distance);
            const force = Math.abs(calculatedForce) < MAX_FORCE ?
                calculatedForce :
                MAX_FORCE * Math.sign(calculatedForce);
            
            return { x: unitVector.x * force, y: unitVector.y * force };
        };
    };

    const attractiveForce = makeForce(n => 3 * Math.log2(Math.sqrt(n) / ATTRACTIVE_CONSTANT));
    
    const repulsiveForce = makeForce(n => -((REPULSIVE_CONSTANT / n) - 1));

    /**
     * Adds the intersection case
     * @param f displacement function without considering intersection
     */
    const displacementWrapper = (p1Index: number, p2Index: number, f: (p1: Polygon, p2: Polygon) => IPoint): { force: IPoint, type: ForceType } => {
        const [p1, p2] = [components.nodes[p1Index], components.nodes[p2Index]];
        const intersectionPoly = intersection(turfPoly(p1), turfPoly(p2));
        
        if (intersectionPoly === null) {
            return { force: f(p1, p2), type: ForceType.Normal };
        } else {
            // console.log(`intersection between ${p1Index} and ${p2Index}`);
            // Always move 5 units if intersection occurs
            const minForce = options.componentSpacing;

            const centerLine = { from: p1.center, to: p2.center };
            const dir = direction(centerLine);

            return { 
                force: { x: -dir.x * minForce, y: -dir.y * minForce },
                type: ForceType.Intersection,
            };
        }
    }

    const applyAttractiveForces = (components: PolyGraph, forces: IPoint[], intersectionForces: IPoint[]) => {
        for (let [from, neighbors] of components.edges.entries()) {
            for (let to of neighbors) {        
                const { force, type } = displacementWrapper(from, to, attractiveForce);

                const forceArray = type === ForceType.Normal ? forces : intersectionForces;
        
                forceArray[from].x += force.x;
                forceArray[from].y += force.y;
        
                forceArray[to].x -= force.x;
                forceArray[to].y -= force.y;
            }
        }
    };

    const applyRepulsiveForces = (components: PolyGraph, forces: IPoint[], intersectionForces: IPoint[]) => {
        if (options.type === DistanceDetectionType.BASIC) {
            const nodesLen = components.nodes.length; 
            
            for (let i = 0; i < nodesLen; ++i) {
                for (let j = i + 1; j < nodesLen; ++j) {
                    // Not connected
                    if (components.edges[i].find(n => n === j) !== undefined) {                        
                        const { force, type } = displacementWrapper(i, j, repulsiveForce);
        
                        const forceArray = type === ForceType.Normal ? forces : intersectionForces;
        
                        forceArray[i].x += force.x;
                        forceArray[i].y += force.y;
                
                        forceArray[j].x -= force.x;
                        forceArray[j].y -= force.y;
                    }
                }
            }
        } else {            
            throw new Error('Not implemented');
        }
    };

    const moveFn = options.type === DistanceDetectionType.GRID_SQUARE ?
        options.detection.move :
        (index: number, displacement: IPoint) => { components.nodes[index].move(displacement); };

    const turnForces = Array.from({ length: components.nodes.length }, () => ({ x: 0, y: 0 }));
    const intersectionForces: IPoint[] = Array.from({ length: components.nodes.length }, () => ({ x: 0, y: 0 }));

    const singleStep = () => {
        const hasIntersectionForce = (i: number): boolean =>
            intersectionForces[i].x !== 0 || intersectionForces[i].y !== 0;

        applyAttractiveForces(components, turnForces, intersectionForces);
        
        applyRepulsiveForces(components, turnForces, intersectionForces);
        
        let turnTotalForce = 0;

        // console.log(`forces: ${JSON.stringify(turnForces)}`);

        for (let i = 0; i < components.nodes.length; ++i) {
            const force = hasIntersectionForce(i) ? intersectionForces[i] : turnForces[i];

            moveFn(i, force);
            turnTotalForce += lengthFromOrigin(force);

            turnForces[i].x = 0;
            turnForces[i].y = 0;

            intersectionForces[i].x = 0;
            intersectionForces[i].y = 0;
        }

        const averageForce = turnTotalForce / components.nodes.length;

        return averageForce;
    };

    if (options.step !== undefined) {
        const step = options.step;
        for (let i = 0; i < step; ++i) {
            singleStep();
        }
    } else {
        let edgeCounter = 0;

        const ITERATION = 100;

        for (let i = 0; i < ITERATION; i += 1) {
            const averageForce = singleStep();
    
            // console.log(`Average force: ${averageForce}`);

            edgeCounter += 1;
    
            /* if (!hasIntersection && averageForce <= CONVERGENCE_THRESHOLD) {
                return;
            } */

            if (edgeCounter >= EDGE_THRESHOLD) {
                // console.log("Recalculating edges...");
                components.edges = constructEdges(components.nodes);
                edgeCounter = 0;
            }
        }
    }
};

export const expandLine = (line: ILine, bbox: IRectangle): ILine => {
    if (line.from.x !== line.to.x) {
        const lineSlope = slope(line);

        if (line.from.x < line.to.x) {
            const leftP = line.from;
            const rightP = line.to;

            return {
                from: bbox.minX < leftP.x ?
                    ((() => {
                        const newX = bbox.minX;
                        const newY = line.to.y - lineSlope * (line.to.x - newX);

                        return { x: newX, y: newY };
                    })()) :
                    leftP,
                to: bbox.maxX > rightP.x ?
                    ((() => {
                        const newX = bbox.maxX;
                        const newY = line.from.y + lineSlope * (newX - line.from.x);

                        return { x: newX, y: newY };
                    })()) :
                    rightP,
            };
        } else {
            const leftP = line.to;
            const rightP = line.from;

            return {
                from: bbox.maxX > rightP.x ?
                    ((() => {
                        const newX = bbox.maxX;
                        const newY = line.to.y - lineSlope * (line.to.x - newX);

                        return { x: newX, y: newY };
                    })()) :
                    rightP,
                to: bbox.minX < leftP.x ?
                    ((() => {
                        const newX = bbox.minX;
                        const newY = line.from.y + lineSlope * (newX - line.from.x);

                        return { x: newX, y: newY };
                    })()) :
                    leftP,
            };
        }
    } else {
        // Edge case, if line is vertical, must expand vertically

        if (line.from.y < line.to.y) {
            const minYP = line.from;
            const maxYP = line.to;

            return {
                from: bbox.minY < minYP.y ?
                    { x: minYP.x, y: bbox.minY } :
                    minYP,
                to: bbox.maxY > maxYP.y ?
                    { x: maxYP.x, y: bbox.maxY } :
                    maxYP,
            };
        } else {
            const minYP = line.to;
            const maxYP = line.from;

            return {
                from: bbox.maxY > maxYP.y ? 
                    { x: maxYP.x, y: bbox.maxY } :
                    maxYP,
                to: bbox.minY < minYP.y ?
                    { x: minYP.x, y: bbox.minY } :
                    minYP,
            };
        }
    }
};