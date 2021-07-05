module.exports = function() {

  var jsonToSbgnml, elementUtilities, cy;

  function jsonToNwt(param) {
    jsonToSbgnml = param.jsonToSbgnmlConverter;
    elementUtilities = param.elementUtilities;
    cy = param.sbgnCyInstance.getCy();
  }

  function setToStr(set) {
    if (set) {
      return Object.keys(set).join(';');
    }

    return null;
  }

  var sifEdgePropHandlerMap = {
    'pcIDs': function(edge) {
      return setToStr( edge.data('pcIDSet') );
    },
    'siteLocations': function(edge) {
      return setToStr( edge.data('siteLocSet') );
    }
  };

  var sifNodePropHandlerMap = {
    'tooltip': function(node) {
      return node.data('tooltip');
    },
    'infoboxes': function(node, obj) {
      var sifInfoboxPropHandlerMap = {
        'tooltip': function(infobox) {
          return infobox.tooltip;
        }
      };

      var infoboxes = node.data('statesandinfos');
      var glyphs = obj.glyph;
      infoboxes.forEach( function(infobox, i) {
        Object.keys(sifInfoboxPropHandlerMap).forEach( function(propName) {
          var val = sifInfoboxPropHandlerMap[propName](infobox);
          if (val) {
            glyphs[i][propName] = val;
          }
        } );
      } );
    }
  };

  // objects consist of arcs or gylphs
  function extendObjectsData(objs, filterFcn, propHandlerMap) {
    if ( !objs ) {
      return;
    }

    objs.forEach( function( obj ) {
      if ( filterFcn( obj.$.class ) ) {
        var ele = cy.getElementById( obj.$.id );
        Object.keys( propHandlerMap ).forEach( function( propName ) {
          // does not have to return a value, maybe a void function as well
          var val = propHandlerMap[ propName ]( ele, obj );
          if ( val ) {
            obj[ propName ] = val;
          }
        } );
      }
    } );
  }

  function extendStylesData(toExtend, extendFrom) {
    if ( !toExtend || !extendFrom ) {
      return;
    }

    var styleNames = [ 'shapeName' ];
    var styleMap = {};

    Object.keys( extendFrom ).forEach( function( key ) {
      styleNames.forEach( function( name ) {
        var el = extendFrom[ key ];
        var props = el && el.properties;

        if ( props && props[ name ] ) {
          var val = props[ name ];
          var idList = el.idList;

          idList.forEach( function( id ) {
            styleMap[ id ] = styleMap[ id ] || {};
            styleMap[ id ][ name ] = val;
          } );
        }
      } );
    } );

    toExtend.forEach( function( style ) {
      var idList = style.$.idList.split(' ');

      styleNames.forEach( function( name ) {
        var val = null;

        idList.forEach( function( id ) {
          var currVal = styleMap[ id ] && styleMap[ id ][ name ];
          if ( currVal === undefined ) {
            return;
          }

          if ( val == null ) {
            val = currVal;
          }
          else if ( val !== currVal ) {
            console.warn( 'Shape name of some glyphs defined multiple times in render information!' );
          }
        } );

        if ( val !== null ) {
          style.g.$[ name ] = val;
        }
      } );
    } );
  }

  jsonToNwt.buildJsObj = function(filename, version, renderInfo, mapProperties, nodes, edges) {
    var jsObj = jsonToSbgnml.buildJsObj(filename, version, renderInfo, mapProperties, nodes, edges);

    if ( elementUtilities.mapType !== 'PD' && elementUtilities.mapType !== 'AF'  && elementUtilities.mapType !== 'HybridSbgn') {
      var map = jsObj.map[0];

      var arcs = map.arc;
      var glyphs = map.glyph;
      extendObjectsData(arcs, elementUtilities.isSIFEdge, sifEdgePropHandlerMap);
      extendObjectsData(glyphs, elementUtilities.isSIFNode, sifNodePropHandlerMap);

      var jsObjStyles = ( map && map.extension && map.extension.renderInformation
                            && map.extension.renderInformation.listOfStyles ).style;
      var appStyles = renderInfo && renderInfo.styles;

      extendStylesData(jsObjStyles, appStyles);
    }

    return jsObj;
  };

  jsonToNwt.createNwt = function(filename, version, renderInfo, mapProperties, nodes, edges) {
    var jsObj = jsonToNwt.buildJsObj(filename, version, renderInfo, mapProperties, nodes, edges);
    return jsonToSbgnml.buildString({sbgn: jsObj});
  };

  return jsonToNwt;
}
