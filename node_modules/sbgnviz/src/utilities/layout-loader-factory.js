var tdParser = require('./tab-delimeted-parser');

module.exports = function() {
  var cy, mainUtilities;

  function layoutLoader( param ) {
    cy = param.sbgnCyInstance.getCy();
    mainUtilities = param.mainUtilities;
  }

  layoutLoader.load = function( layoutText, byName ) {
    var lines = tdParser.getLinesArray( layoutText );
    var posMap = {};

    lines.forEach( function( line ) {
      var tabs = tdParser.getTabsArray( line );

      var nodeId;

      if ( byName ) {
        var matchingNodes = layoutLoader.getNodesByName( tabs[ 0 ] );
        if ( matchingNodes.length === 0 ) {
          return;
        }

        // ideally there is only one matching node
        // use the first one in any case
        nodeId = matchingNodes.id();
      }
      else {
        nodeId = tabs[ 0 ];
      }

      var posX = parseFloat( tabs[ 1 ] );
      var posY = parseFloat( tabs[ 2 ] );

      posMap[ nodeId ] = { x: posX, y: posY };
    } );

    var options = {
      name: 'preset',
      positions: posMap,
      fit: false
    };

    mainUtilities.performLayout( options );
  };

  layoutLoader.getNodesByName = function( name ) {
    return cy.nodes().filter( '[label="' + name + '"]' );
  };

  return layoutLoader;
};
