declare module 'voronoi' {

    type Site = {
        x: number, 
        y: number,
    };
    
    type Diagram = {
        edges: Edge[],
    };

    type Edge = {
        lSite: Site,
        rSite: Site,
    };

    class Voronoi {
        new(): Voronoi;

        compute(sites: Site[], bbox: { xl: number, xr: number, yl: number, yr: number }): Diagram;
    }

    export default Voronoi;
}