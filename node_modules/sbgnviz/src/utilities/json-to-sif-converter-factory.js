module.exports = function() {

  var elementUtilities, cy;

  function jsonToSif(param) {
    elementUtilities = param.elementUtilities;
    cy = param.sbgnCyInstance.getCy();
  }

  function isValidEnd(node) {
    return elementUtilities.isSIFNode( node ) || node.data('class') == 'topology group';
  }

  jsonToSif.convert = function() {
    var lines = [];

    var edges = cy.edges().filter( function( edge ) {
      return elementUtilities.isSIFEdge( edge )
        && isValidEnd( edge.source() )
        && isValidEnd( edge.target() );
    } );

    var nodes = cy.nodes().filter( function( node ) {
      return elementUtilities.isSIFNode( node );
    } );

    nodes = nodes.not( edges.connectedNodes() );

    var setToStr = function(set) {
      if (!set) {
        return '';
      }

      return Object.keys(set).join(';');
    };

    var getLabel = function(node) {
      return node.data('label');
    };

    var isValidLabel = function(label){
      return !!label;
    }

    edges.forEach( function( edge ) {
      var srcNames, tgtNames;

      var getNames = function(node) {
        var names;

        if (node.isParent()) {
          names =  node.children().map( getLabel );
        }
        else {
            names = [ getLabel(node) ];
        }

        return names && names.filter( isValidLabel );
      };

      var srcNames = getNames(edge.source());
      var tgtNames = getNames(edge.target());

      if ( !srcNames || !tgtNames || srcNames.length == 0 || tgtNames.length == 0 ) {
        return;
      }

      var type = edge.data('class');
      var pcIDSet = edge.data('pcIDSet');
      var siteLocSet = edge.data('siteLocSet');
      var pcIDs = setToStr( pcIDSet );
      var siteLocations = setToStr( siteLocSet );

      srcNames.forEach( srcName => {
        tgtNames.forEach( tgtName => {
          var line = [ srcName, type, tgtName, pcIDs, siteLocations ].join( '\t' );
          lines.push( line );
        } );
      } );
    } );

    nodes.forEach( function( node ) {
      var label = getLabel( node );

      if ( label ) {
        lines.push( label );
      }
    } );

    var text = lines.join( '\n' );
    return text;
  };

  return jsonToSif;
};
