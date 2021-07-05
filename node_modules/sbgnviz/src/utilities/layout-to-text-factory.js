module.exports = function() {
  var cy;

  function layoutToText( param ) {
    cy = param.sbgnCyInstance.getCy();
  }

  layoutToText.convert = function( byName ) {
    var nodes = cy.nodes();
    var lines = [];

    nodes.map( function( node ) {
      var idOrName = byName ? node.data('label') : node.id();
      var posX = node.position('x');
      var posY = node.position('y');

      var line = [ idOrName, posX, posY ].join( '\t' );
      lines.push( line );
    } );

    var text = lines.join( '\n' );
    return text;
  };

  return layoutToText;
};
