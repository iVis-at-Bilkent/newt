export declare type IPoint = {
    x: number;
    y: number;
};
export declare type ILine = {
    from: IPoint;
    to: IPoint;
};
export declare type IRectangle = {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
};
export declare type INode = {
    min: IPoint;
    max: IPoint;
};
export declare type IEdge<T = IPoint> = {
    from: T;
    to: T;
};
export declare type IGraph = {
    nodes: INode[];
    edges: IEdge[];
};
