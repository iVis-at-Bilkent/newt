export type IPoint = {
    x: number,
    y: number
};

export type ILine = {
    from: IPoint,
    to: IPoint,
};

export type IRectangle = {
    minX: number,
    maxX: number,
    minY: number,
    maxY: number,
};

export type INode = {
    min: IPoint,
    max: IPoint,
};

export type IEdge<T = IPoint> = {
    from: T,
    to: T,
};

export type IGraph = {
    nodes: INode[],
    edges: IEdge[];
};