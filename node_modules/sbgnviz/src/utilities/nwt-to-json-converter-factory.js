module.exports = function() {

  var sbgnmlToJson, elementUtilities;

  function nwtToJson(param) {
    sbgnmlToJson = param.sbgnmlToJsonConverter;
    elementUtilities = param.elementUtilities;
  }

  function strToSet( str, splitBy ) {
    var set = {};
    var list = str ? str.split( splitBy ) : [];

    list.forEach( function( member ) {
      set[ member ] = true;
    } );

    return set;
  }

  function getFirstByTagName(arc, tagName) {
    var els = arc.getElementsByTagName(tagName);
    var val = els.length > 0 ? els[0].innerHTML : null;

    return val;
  }

  var sifEdgePropHandlerMap = {
    'pcIDSet': function(arc) {
      var val = getFirstByTagName( arc, 'pcIDs' );
      return strToSet( val, /;| / );
    },
    'siteLocSet': function(arc) {
      var val = getFirstByTagName( arc, 'siteLocations' );
      return strToSet( val, ';' );
    }
  };

  var sifNodePropHandlerMap = {
    'tooltip': function(glyph) {
      var val = getFirstByTagName( glyph, 'tooltip' );
      return val;
    },
    'infoboxes': function(glyph, data) {
      var sifInfoboxPropHandlerMap = {
        'tooltip': function(glyph) {
          var val = getFirstByTagName( glyph, 'tooltip' );
          return val;
        }
      };

      var infoboxGlyphs = glyph.getElementsByTagName('glyph');
      for ( var i = 0; i <  infoboxGlyphs.length; i++ ) {
        var infoboxGlyph = infoboxGlyphs[ i ];
        Object.keys(sifInfoboxPropHandlerMap).forEach( function( propName ) {
          var val = sifInfoboxPropHandlerMap[ propName ](infoboxGlyph);
          if ( val ) {
            data.statesandinfos[i][propName] = val;
          }
        } );
      }
    }
  };

  function extendElementsData( elesData, filterFcn, getXMLEleById, propHandlerMap, xmlObject ) {
    elesData.forEach( function( obj ) {
      var data = obj.data;
      if ( filterFcn( data.class ) ) {
        var xmlEle = getXMLEleById( xmlObject, data.id );
        Object.keys(propHandlerMap).forEach( function( propName ) {
          // does not have to return a value, maybe a void function as well
          var val = propHandlerMap[ propName ](xmlEle, data);
          if ( val ) {
            data[ propName ] = val;
          }
        } );
      }
    } );
  }

  function getElMap( graphData ) {
    var map = {
      nodes: {},
      edges: {},
      infoboxes: {}
    };

    graphData.edges.forEach( function( edge ) {
      map.edges[ edge.data.id ] = edge;
    } );

    graphData.nodes.forEach( function( node ) {
      map.nodes[ node.data.id ] = node;

      var infoboxes = node.data.statesandinfos;

      infoboxes.forEach( function( infobox ) {
        map.infoboxes[ infobox.id ] = infobox;
      } );
    } );

    return map;
  }

  function applyExtraStylesData( graphData, xmlObject ) {
    var listOfStyles = xmlObject.querySelector('listOfStyles')
    var styles = listOfStyles && listOfStyles.querySelectorAll('style');

    if (!styles || styles.length === 0) {
      return;
    }

    var attrToProp = {
      'shapeName': 'shape-name'
    };
    var elMap = getElMap( graphData );

    styles.forEach( function( style ) {
      var idList = style.getAttribute('idList').split(' ');

      Object.keys( attrToProp ).forEach( function( attrName ) {
        var g = style.querySelector('g');
        var val = g.getAttribute( attrName );

        if ( val ) {
          var propName = attrToProp[ attrName ];

          idList.forEach( function( id ) {
            if ( elMap.nodes[ id ] || elMap.edges[ id ] ) {
              var el = elMap.nodes[ id ] || elMap.edges[ id ];
              el.data[ propName ] = val;
            }
            else if ( elMap.infoboxes[ id ] ) {
              var el = elMap.infoboxes[ id ];
              el.style[ propName ] = val;
            }
          } );
        }
      } );
    } );
  }

  nwtToJson.convert = function(xmlObject, urlParams) {
    var graphData = sbgnmlToJson.convert(xmlObject, urlParams);
    var mapType = elementUtilities.mapType;

    if (mapType !== 'PD' && mapType !== 'AF' && elementUtilities.mapType !== 'HybridSbgn') {
      elementUtilities.fileFormat = 'nwt';
      // extend edges data with sif specific features
      extendElementsData( graphData.edges, elementUtilities.isSIFEdge, sbgnmlToJson.getArcById.bind(sbgnmlToJson), sifEdgePropHandlerMap, xmlObject );
      extendElementsData( graphData.nodes, elementUtilities.isSIFNode, sbgnmlToJson.getGlyphById.bind(sbgnmlToJson), sifNodePropHandlerMap, xmlObject );
    }

    // apply the style data that is not applied because of restrictions of libsbgn
    applyExtraStylesData( graphData, xmlObject );

    return graphData;
  };

  nwtToJson.mapPropertiesToObj = function() {
    return sbgnmlToJson.mapPropertiesToObj();
  };

  return nwtToJson;
};
