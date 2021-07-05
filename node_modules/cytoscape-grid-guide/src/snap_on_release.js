module.exports = function (cy, gridSpacing, gridSpacingOffset) {

    var snap = { };

    snap.changeOptions = function (opts) {
        gridSpacing = opts.gridSpacing;
        gridSpacingOffset = opts.snapToGridCenter ? 0.5 : 0;
    };

    var getScratch = function (node) {
        if (!node.scratch("_gridGuide"))
            node.scratch("_gridGuide", {});

        return node.scratch("_gridGuide");
    };

    snap.snapPos = function (pos) {
        var xPosition = gridSpacingOffset ? Math.floor(pos.x / gridSpacing) : Math.round(pos.x / gridSpacing);
        var yPosition = gridSpacingOffset ? Math.floor(pos.y / gridSpacing) : Math.round(pos.y / gridSpacing);
        var newPos = {
            x: (xPosition + gridSpacingOffset) * gridSpacing,
            y: (yPosition + gridSpacingOffset) * gridSpacing
        };

        return newPos;
    };

    snap.snapNode = function (node) {

        var pos = node.position();
        var newPos = snap.snapPos(pos);

        node.position(newPos);
    };

    snap.snapNodesTopDown = function (nodes) {
        // getTOpMostNodes -> nodes
        cy.startBatch();
        nodes.union(nodes.descendants()).filter(":childless").positions(function (node, i) {
            if(typeof node === "number") {
              node = i;
            }
            var pos = node.position();
            return snap.snapPos(pos);
        });
        cy.endBatch();
    };

    snap.onFreeNode = function (e) {
        var nodes;
        var cyTarget = e.target || e.cyTarget;
        if (cyTarget.selected())
            nodes = e.cy.$(":selected");
        else
            nodes = cyTarget;

        snap.snapNodesTopDown(nodes);

    };


    snap.recoverSnapNode = function (node) {
        var snapScratch = getScratch(node).snap;
        if (snapScratch) {
            node.position(snapScratch.oldPos);
        }
    };

    return snap;





};
