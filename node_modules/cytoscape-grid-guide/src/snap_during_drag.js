module.exports = function (cy, snap) {

    var snapToGridDuringDrag = {};

    var attachedNode;
    var draggedNodes;

    var startPos;
    var endPos;

    snapToGridDuringDrag.onTapStartNode = function (e) {
        // If user intends to do box selection, then return. Related issue #28
        if (e.originalEvent.altKey || e.originalEvent.ctrlKey
                || e.originalEvent.metaKey || e.originalEvent.shiftKey){
            return;
        }

        var cyTarget = e.target || e.cyTarget;
        if (cyTarget.selected())
            draggedNodes = e.cy.$(":selected");
        else
            draggedNodes = cyTarget;

        startPos = e.position || e.cyPosition;

        if (cyTarget.grabbable() && !cyTarget.locked()){
          attachedNode = cyTarget;
          attachedNode.lock();
          //attachedNode.trigger("grab");
          cy.on("tapdrag", onTapDrag);
          cy.on("tapend", onTapEndNode);
        }
    };

    var onTapEndNode = function (e) {
        //attachedNode.trigger("free");
        cy.off("tapdrag", onTapDrag);
        cy.off("tapend", onTapEndNode);
        attachedNode.unlock();
        e.preventDefault();
    };

    var getDist = function () {
        return {
            x: endPos.x - startPos.x,
            y: endPos.y - startPos.y
        }
    };

    var onTapDrag = function (e) {

        var nodePos = attachedNode.position();
        endPos = e.position || e.cyPosition;
        endPos = snap.snapPos(endPos);
        var dist = getDist();
        if (dist.x != 0 || dist.y != 0) {
            attachedNode.unlock();
            var nodes = draggedNodes.union(draggedNodes.descendants());

            nodes.filter(":childless").positions(function (node, i) {
                if(typeof node === "number") {
                  node = i;
                }
                var pos = node.position();
                return snap.snapPos({
                    x: pos.x + dist.x,
                    y: pos.y + dist.y
                });
            });

            startPos = endPos;
            attachedNode.lock();
            attachedNode.trigger("drag");
        }

    };

    return snapToGridDuringDrag;


};
