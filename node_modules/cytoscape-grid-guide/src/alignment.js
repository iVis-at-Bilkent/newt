module.exports = function (cytoscape, cy, apiRegistered) {

    // Needed because parent nodes cannot be moved in Cytoscape.js < v3.2
    function moveTopDown(node, dx, dy) {
        var nodes = node.union(node.descendants());

        nodes.filter(":childless").positions(function (node, i) {
            if(typeof node === "number") {
              node = i;
            }
            var pos = node.position();
            return {
                x: pos.x + dx,
                y: pos.y + dy
            };
        });
    }

    function getTopMostNodes(nodes) {
        var nodesMap = {};
        for (var i = 0; i < nodes.length; i++) {
            nodesMap[nodes[i].id()] = true;
        }
        var roots = nodes.filter(function (ele, i) {
            if(typeof ele === "number") {
              ele = i;
            }
            
            var parent = ele.parent()[0];
            while(parent != null){
                if(nodesMap[parent.id()]){
                    return false;
                }
                parent = parent.parent()[0];
            }
            return true;
        });

        return roots;
    }


    // If extension api functions are not registed to cytoscape yet register them here.
		// Note that ideally these functions should not be directly registered to core from cytoscape.js
		// extensions
    if ( !apiRegistered ) {

      cytoscape( "collection", "align", function (horizontal, vertical, alignTo) {

          var eles = getTopMostNodes(this.nodes(":visible"));

          var modelNode = alignTo ? alignTo : eles[0];

          eles = eles.not(modelNode);

          horizontal = horizontal ? horizontal : "none";
          vertical = vertical ? vertical : "none";


          // 0 for center
          var xFactor = 0;
          var yFactor = 0;

          if (vertical == "left")
              xFactor = -1;
          else if (vertical == "right")
              xFactor = 1;

          if (horizontal == "top")
              yFactor = -1;
          else if (horizontal == "bottom")
              yFactor = 1;


          for (var i = 0; i < eles.length; i++) {
              var node = eles[i];
              var oldPos = Object.assign({}, node.position());
              var newPos = Object.assign({}, node.position());

              if (vertical != "none")
                  newPos.x = modelNode.position("x") + xFactor * (modelNode.outerWidth() - node.outerWidth()) / 2;


              if (horizontal != "none")
                  newPos.y = modelNode.position("y") + yFactor * (modelNode.outerHeight() - node.outerHeight()) / 2;

              moveTopDown(node, newPos.x - oldPos.x, newPos.y - oldPos.y);
          }

          return this;
      });

    }


    if (cy.undoRedo) {
        function getNodePositions() {
            var positionsAndSizes = {};
            var nodes = cy.nodes();

            for (var i = 0; i < nodes.length; i++) {
                var ele = nodes[i];
                positionsAndSizes[ele.id()] = {
                    x: ele.position("x"),
                    y: ele.position("y")
                };
            }

            return positionsAndSizes;
        }

        function returnToPositions(nodesData) {
            var currentPositions = {};
            cy.nodes().not(":parent").positions(function (ele, i) {
                if(typeof ele === "number") {
                  ele = i;
                }
                currentPositions[ele.id()] = {
                    x: ele.position("x"),
                    y: ele.position("y")
                };
                var data = nodesData[ele.id()];
                return {
                    x: data.x,
                    y: data.y
                };
            });

            return currentPositions
        }

        var ur = cy.undoRedo(null, true);

        ur.action("align", function (args) {

            var nodesData;
            if (args.firstTime){
                nodesData = getNodePositions();
                args.nodes.align(args.horizontal, args.vertical, args.alignTo);
            }
            else
                nodesData = returnToPositions(args);

            return nodesData;

        }, function (nodesData) {
            return returnToPositions(nodesData);
        });

    }



};
