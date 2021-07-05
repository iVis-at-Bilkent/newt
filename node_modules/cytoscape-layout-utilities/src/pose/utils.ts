import { ILine, IPoint, IRectangle } from "./models/common";

export enum Orientation {
    /** orientation > 0 */
    LEFT,
    /** orientation < 0 */
    RIGHT,
    /** orientation = 0 */
    STRAIGHT,
}

/**
 * https://medium.com/@harshitsikchi/convex-hulls-explained-baab662c4e94
 * @param p 
 * @param q 
 * @param r 
 */
export const orientation = (p: IPoint, q: IPoint, r: IPoint): Orientation => {
    let value = (q.x * r.y) - (q.y * r.x) - (p.x * r.y) + (p.x * q.y) + (p.y * r.x) - (p.y * q.x);

    if (value < 0) {
        return Orientation.LEFT;
    } else if (value > 0) {
        return Orientation.RIGHT;
    } else {
        return Orientation.STRAIGHT;
    }
}

/**
 * Return always positive remainder
 */
export const mod = (n: number, m: number): number =>
    ((n % m) + m) % m;

/**
 * Always returns between [0, 2π]
 */
export const anglePositive = (y: number, x: number): number => {
    const angle = Math.atan2(y, x);

    return angle < 0 ?
        angle + (2 * Math.PI):
        angle;
}

/**
 * Returns true if p has an orthogonal projection into l
 */
export const inRange = (p: IPoint, l: ILine): boolean => {
    const dx = l.to.x - l.from.x;
    const dy = l.to.y - l.from.y;
    const innerProd = (p.x - l.from.x) * dx + (p.y - l.from.y) * dy;
    // console.log(`v.s: ${innerProd}, s.s: ${(dx * dx) + (dy * dy)}`);
    return 0 <= innerProd && innerProd <= (dx * dx) + (dy * dy);
}

/**
 * Converts -pi,pi range to 0,2pi
 */
export const negativeToAbsolute = (angle: number): number => {
    if (angle <= 0) {
        return (2 * Math.PI) + angle;
    } else {
        return angle;
    }
}

export const shortestPointLineToPoint = (l: ILine, p: IPoint): [IPoint, IPoint] => {
    const A = p.x - l.from.x,
          B = p.y - l.from.y,
          C = l.to.x - l.from.x,
          D = l.to.y - l.from.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) {
        param = dot / lenSq;
    }

    if (param < 0) {
        return [{ x: l.from.x, y: l.from.y}, p];
    } else if (param > 1) {
        return [{ x: l.to.x, y: l.to.y }, p];
    } else { // 0 <= param <= 1
        return [{ x: l.from.x + (param * C), y: l.from.y + (param * D) }, p];
    }
}

export const lineToPointDistance = (l: ILine, p: IPoint): number => {
    const [p1, p2] = shortestPointLineToPoint(l, p);

    return distance(p1, p2);
}

export const shortestPointLineToLine = (l1: ILine, l2: ILine): [IPoint, IPoint] => {
    const shortestPairs = [
        shortestPointLineToPoint(l1, l2.from),
        shortestPointLineToPoint(l1, l2.to),
        shortestPointLineToPoint(l2, l1.from),
        shortestPointLineToPoint(l2, l1.to),
    ];

    let minPair = shortestPairs[0];

    for (let [p, q] of shortestPairs) {
        if (distance(p, q) < distance(minPair[0], minPair[1])) {
            minPair = [p, q];
        }
    }

    return minPair;
}

/**
 * Returns the squared length from origin
 */
export const lengthFromOrigin = (p: IPoint): number => {
    return (p.x * p.x) + (p.y * p.y);
}

/**
 * Squared length
 */
export const length = (l: ILine): number => {
    const dx = l.to.x - l.from.x;
    const dy = l.to.y - l.from.y;

    return (dx * dx) + (dy * dy);
}

/**
 * Combines two array elements as pairs \
 * **Example:** zip([a, b, c], [1, 2, 3]) = [ [ a, 1 ], [ b, 2 ], [ c, 3 ] ]
 */
export const zip = <K, T>(arr1: K[], arr2: T[]): [K, T][] => 
    arr1.map((v, i) => [v, arr2[i]]);

export const direction = (l: ILine): IPoint => {
    const len = Math.sqrt(length(l));

    return { 
        x: (l.to.x - l.from.x) / len,
        y: (l.to.y - l.from.y) / len,
    };
};

/**
 * Performs a deep copy on an object,
 * @param object object to be copied. Must not be recursive
 */
export const clone = <T> (object: T): T => 
    JSON.parse(JSON.stringify(object));

/**
 * Do something with array without mutating
 * Useful for debug purposes
 */
export const inspect = <T> (arr: T[], action: (arg0: T) => void): T[] => {
    for (let item of arr) {
        action(item);
    }   

    return arr;
}

export const distance = (p0: IPoint, p1: IPoint): number => {
    let width = p0.x - p1.x;
    let height = p0.y - p1.y;

    return Math.pow(width, 2) + Math.pow(height, 2);
}

export const slope = (line: ILine): number => {
    let height = line.to.y - line.from.y;
    let width = line.to.x - line.from.x;

    return height / width;
}

/**
 * @param from 
 * @param to 
 */
export const slopeAngle = (from: IPoint, to: IPoint): number => {
    let height = to.y - from.y;
    let width = to.x - from.x;

    return Math.atan2(height, width);
};

export const area = (rect: IRectangle): number =>
    Math.abs((rect.maxX - rect.minX) * (rect.maxY - rect.minY)); 

export const boundingBox = (rects: IRectangle[]): IRectangle => {
    return rects.reduce((bbox, current) => ({
        minX: Math.min(bbox.minX, current.minX),
        maxX: Math.max(bbox.maxX, current.maxX),
        minY: Math.min(bbox.minY, current.minY),
        maxY: Math.max(bbox.maxY, current.maxY),
    }), {
        minX: Number.MAX_SAFE_INTEGER,
        maxX: Number.MIN_SAFE_INTEGER,
        minY: Number.MAX_SAFE_INTEGER,
        maxY: Number.MIN_SAFE_INTEGER,
    });
}