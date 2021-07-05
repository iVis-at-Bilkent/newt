import { pointToArray } from '../helpers/turf';
import { IEdge, ILine, IPoint, IRectangle } from '../models/common';
import { Delaunay } from 'd3-delaunay';

export const findNeighbors = (frame: IRectangle, centers: IPoint[]): number[][] => {
    
    const centersMapped = centers.map(pointToArray);

    // console.log(JSON.stringify(centersMapped));
    // console.log(JSON.stringify(frame));

    const neighbors: number[][] = Array.from({ length: centers.length },
        () => []);

    const delaunay = Delaunay.from(centersMapped);
    const voronoi = delaunay.voronoi([Number.MIN_SAFE_INTEGER, Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER]);

    for (let i = 0; i < centers.length; ++i) {
        for (const neighbor of voronoi.neighbors(i)) {
            neighbors[i].push(neighbor);
        }
    }

    // console.log(JSON.stringify(neighbors));

    return neighbors;
}

const rectToBbox = (_: IRectangle) => 
    ({
        xl: Number.MIN_SAFE_INTEGER, xr: Number.MAX_SAFE_INTEGER,
        yl: Number.MIN_SAFE_INTEGER, yr: Number.MAX_SAFE_INTEGER,
    });