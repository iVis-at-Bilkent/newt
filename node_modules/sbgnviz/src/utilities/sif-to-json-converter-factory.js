var tdParser = require('./tab-delimeted-parser');

function strToSet( str, splitBy ) {
  var set = {};
  var list = str ? str.split( splitBy ) : [];

  list.forEach( function( member ) {
    set[ member ] = true;
  } );

  return set;
}

function getEmptyGraphData() {
  return { nodes: [], edges: [] };
}

module.exports = function() {

  var elementUtilities;

  function sifToJson(param) {
    elementUtilities = param.elementUtilities;
  }

  sifToJson.initGraphVariables = function() {
    sifToJson.graphData = getEmptyGraphData();
    sifToJson.nameToNode = {};
    sifToJson.keyToEdge = {};
    // set of nodes that are connected to an edge
    sifToJson.nodeWithSpecifiedClass = {};
  }

  sifToJson.defaultNodeType = 'SIF macromolecule';

  sifToJson.mergeGraphData = function() {
    return [ ...sifToJson.graphData.nodes, ...sifToJson.graphData.edges ];
  };

  sifToJson.convert = function( graphText ) {
    elementUtilities.fileFormat = 'sif';
    elementUtilities.mapType = 'SIF';

    sifToJson.initGraphVariables();

    if ( graphText == undefined ) {
      return sifToJson.graphData;
    }

    var lines = tdParser.getLinesArray( graphText.toString() );

    lines.forEach( function( line ) {
      var tabs = tdParser.getTabsArray( line );

      // line represents a node
      if ( tabs.length === 1 ) {
        var nodeName = tabs[ 0 ];
        // create the node if does not exist yet
        // if the node is just created it will have the default node class
        sifToJson.getOrCreateNode( nodeName );
      }
      // line represents an edge and the connected nodes
      else {
        var srcName = tabs[ 0 ];
        var edgeType = tabs[ 1 ];
        var tgtName = tabs[ 2 ];
        var pcIDSet = strToSet( tabs[ 3 ], /;| / );
        var siteLocSet = strToSet( tabs[ 4 ], ';' );

        var srcClass = sifToJson.getNodeClass( edgeType, 'src' );
        var tgtClass = sifToJson.getNodeClass( edgeType, 'tgt' );

        // create nodes if they do not exist yet
        // if the node already exists the node type and so the default values
        // will be updated
        sifToJson.getOrCreateNode( srcName, srcClass );
        sifToJson.getOrCreateNode( tgtName, tgtClass );

        // create the edge if it does not exist yet
        sifToJson.getOrCreateEdge( srcName, edgeType, tgtName, pcIDSet, siteLocSet );
      }
    } );

    return sifToJson.mergeGraphData();
  };

  sifToJson.getNodeByName = function( name ) {
    return sifToJson.nameToNode[ name ];
  };

  sifToJson.getEdgeByProps = function( srcName, type, tgtName ) {
    var key = sifToJson.calculateEdgeKey( srcName, type, tgtName );
    return sifToJson.keyToEdge[ key ];
  };

  sifToJson.mapNodeToName = function( node, name ) {
    sifToJson.nameToNode[ name ] = node;
  };

  sifToJson.mapEdgeToKey = function( edge, key ) {
    sifToJson.keyToEdge[ key ] = edge;
  };

  sifToJson.calculateEdgeKey = function( src, type, tgt ) {
    return [ src, type, tgt ].join( ' ' );
  };

  sifToJson.getOrCreateNode = function( name, className ) {
    // save if class name parameter is set
    var classNameSpecified = !!className;
    className = className || sifToJson.defaultNodeType;

    var node = sifToJson.getNodeByName( name );
    var defaults = elementUtilities.getDefaultProperties( className );

    var updateWithDefaults = function() {
      elementUtilities.extendNodeDataWithClassDefaults( node.data, className );
      node.data.bbox.h = defaults.height;

      if ( elementUtilities.canHaveSBGNLabel( className ) ) {
        var isDynamicLabel = sifToJson.getMapProperty( 'adjustNodeLabelFontSizeAutomatically' );

        var fontSize;
        var fontFamily = node.data[ 'font-family' ];

        if ( isDynamicLabel ) {
          var dynamicLabelSize = sifToJson.getMapProperty( 'dynamicLabelSize' );
          var coeff = elementUtilities.getDynamicLabelSizeCoefficient( dynamicLabelSize );
          var obj = {
            height: node.data.bbox.h,
            class: className
          };
          fontSize = elementUtilities.getDynamicLabelTextSize( obj, coeff );
        }
        else {
          fontSize = node.data[ 'font-size' ];
        }

        var max = 250;
        node.data.bbox.w = elementUtilities.getWidthByContent( name, fontFamily, fontSize, { max } );
      }
      else {
        node.data.bbox.w = defaults.width;
      }
    };

    if ( node == undefined ) {
      var uid = elementUtilities.generateNodeId();
      node = {};

      node.data = {
        id: uid,
        label: name,
        class: className,
        bbox: {
          x: 0,
          y: 0
        },
        statesandinfos: [],
        ports: []
      };

      updateWithDefaults();

      sifToJson.mapNodeToName( node, name );
      sifToJson.graphData.nodes.push( node );
    }
    // if class name parameter is set and the already existing node has a different
    // class name check if the existing node has a specified class or just used the
    // default one because it was not coming from an edge.
    // In first case give a warning and do not update the class,
    // in second case update the class and the node data with defaults
    else if ( classNameSpecified && node.data.class !== className ) {
      if ( sifToJson.nodeWithSpecifiedClass[ name ] ) {
        console.warn( 'Type of node ' + name + ' cannot be updated as '
                    + className + ' because it was already specified as ' + node.data.class );
      }
      else {
        node.data.class = className;
        updateWithDefaults();
      }
    }

    if ( classNameSpecified ) {
      sifToJson.nodeWithSpecifiedClass[ name ] = true;
    }

    return node;
  };

  sifToJson.getOrCreateEdge = function( srcName, type, tgtName, pcIDSet, siteLocSet ) {
    var edge = sifToJson.getEdgeByProps( srcName, type, tgtName );

    if ( edge == undefined ) {
      var uid = elementUtilities.generateEdgeId();
      var source = sifToJson.getNodeByName( srcName ).data.id;
      var target = sifToJson.getNodeByName( tgtName ).data.id;
      edge = {};
      edge.data = {
        id: uid,
        pcIDSet,
        siteLocSet,
        source,
        target,
        class: type
      };

      elementUtilities.extendEdgeDataWithClassDefaults( edge.data, type );

      var key = sifToJson.calculateEdgeKey( srcName, type, tgtName );
      sifToJson.mapEdgeToKey( edge, key );
      sifToJson.graphData.edges.push( edge );
    }

    return edge;
  };

  sifToJson.getNodeClass = function( edgeType, role ) {
    var type;

    switch (edgeType) {
      case 'controls-production-of':
      case 'controls-transport-of-chemical':
        type = ( role === 'src' ? 'SIF macromolecule' : 'SIF simple chemical' );
        break;
      case 'consumption-controled-by':
      case 'chemical-affects':
        type = ( role === 'src' ? 'SIF simple chemical' : 'SIF macromolecule' );
        break;
      case 'reacts-with':
      case 'used-to-produce':
        type = 'SIF simple chemical';
        break;
      default:
        type = 'SIF macromolecule';
        break;
    }

    return type;
  };

  sifToJson.getMapProperty = function( propName ) {
    return sifToJson.mapPropertiesToObj()[ 'mapProperties' ][ propName ];
  };

  sifToJson.mapPropertiesToObj = function() {
    return {
      mapProperties: {
        dynamicLabelSize: 'large',
        adjustNodeLabelFontSizeAutomatically: true
      }
    };
  };

  return sifToJson;
};
