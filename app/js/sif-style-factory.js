var appUtilities = require('./app-utilities');
var memoize = require('lodash.memoize');

module.exports = function() {
  var cy, elementUtilities, tdParser;

  function sifStyle( chiseInstance ) {
    cy = chiseInstance.getCy();
    elementUtilities = chiseInstance.elementUtilities;
    tdParser = chiseInstance.tdParser;
  }

  sifStyle.initVariables = function() {
    sifStyle.newInfoboxCountMap = {};
  };

  sifStyle.apply = function( formatText ) {
    if ( elementUtilities.fileFormat != 'sif' ) {
      console.log( 'Map type must be sif to apply sif style!!!' );
      return;
    }

    if ( formatText == undefined ) {
      return;
    }

    sifStyle.initVariables();

    var lines = tdParser.getLinesArray( formatText );
    var actions = [];

    lines.forEach( function( line ) {
      var tabs = tdParser.getTabsArray( line );

      // either node or edge
      var eleType = tabs[ 0 ];
      // would be all-nodes, all-edges, or a node/edge name
      var eleSelector = tabs[ 1 ];
      // name and value pair
      var featureName = tabs[ 2 ];
      var featureVal = tabs[ 3 ];

      var selectedEles;

      if ( eleSelector === 'all-nodes' || eleSelector === 'all-edges' ) {
        selectedEles = eleType === 'node' ? cy.nodes() : cy.edges();
      }
      else {
        if ( eleType === 'node' ) {
          selectedEles = sifStyle.getNodesByName( eleSelector );
        }
        else if ( eleType === 'edge' ) {
          selectedEles = sifStyle.getEdgesByProps( eleSelector );
        }
      }

      var nameMapping = {
        node: {
          'color': 'background-color',
          'bordercolor': 'border-color',
          'borderwidth': 'border-width',
          'textcolor': 'font-color',
          'tooltip': 'tooltip'
        },
        edge: {
          'color': 'line-color',
          'width': 'width'
        }
      };

      var sanitizeFeatureVal = function( name, val ) {
        if ( name === 'border-width' ) {
          return parseInt( val );
        }
        else if ( name.endsWith( '-color' ) ) {
          var arr = val.split( ' ' );
          return rgbToHex( arr[ 0 ], arr[ 1 ], arr[ 2 ] );
          // return 'rgb(' + arr.join( ',' ) + ')';
        }

        // return the value directly by default
        return val;
      };

      var decimalToHex = function (dec) {
        var hex = Number(dec).toString(16);
        if (hex.length < 2) {
             hex = "0" + hex;
        }
        return hex;
      };

      var rgbToHex = function( r, g, b ) {
        var hexR = decimalToHex( r );
        var hexG = decimalToHex( g );
        var hexB = decimalToHex( b );

        return '#' + hexR + hexG + hexB;
      };

      if ( nameMapping[ eleType ][ featureName ] ) {
        var name = nameMapping[ eleType ][ featureName ];
        var val = sanitizeFeatureVal( name, featureVal );
        actions.push( {
          name: 'changeData',
          param: {
            eles: selectedEles,
            name,
            valueMap: val
          }
        } );
      }
      else if ( featureName === 'rppasite' ) {
        var infoboxFeatures = featureVal.split( '|' );

        var tooltip = infoboxFeatures[ 0 ] + ', ' + infoboxFeatures[ 4 ];
        var value = infoboxFeatures[ 1 ];

        var bgColor = sanitizeFeatureVal( 'background-color', infoboxFeatures[ 2 ] );
        var borderColor = sanitizeFeatureVal( 'border-color', infoboxFeatures[ 3 ] );
        var type = 'unit of information';

        selectedEles.forEach( function( ele ) {
          // the new infoboxes index is equal to the current number
          // of infoboxes plus the number of new infoboxes so far
          var index = ele.data('statesandinfos').length + sifStyle.getNewInfoboxCount( ele );
          sifStyle.incrementNewInfoboxCount( ele );

          var currentGeneralProperties = appUtilities.getScratch(cy, 'currentGeneralProperties');

          var obj = appUtilities.getDefaultEmptyInfoboxObj( 'unit of information' );

          actions.push( {
            name: 'addStateOrInfoBox',
            param: {
              nodes: ele,
              obj
            }
          } );

          actions.push( {
            name: 'updateInfoboxStyle',
            param: {
              node: ele,
              index,
              newProps: {
                'border-color': borderColor,
                'background-color': bgColor
              }
            }
          } );

          actions.push( {
            name: 'updateInfoboxObj',
            param: {
              node: ele,
              index,
              newProps: {
                tooltip
              }
            }
          } );

          actions.push( {
            name: 'changeStateOrInfoBox',
            param: {
              index,
              value,
              type,
              nodes: ele
            }
          } );
        } );

      }
    } );

    cy.startBatch();

    // TODO: do this in a way that considers 'undoable' flag
    var ur = cy.undoRedo();
    ur.do("batch", actions);

    cy.endBatch();
  };

  sifStyle.getNewInfoboxCount = function( ele ) {
    var id = ele.id();

    if ( !sifStyle.newInfoboxCountMap[ id ] ) {
      sifStyle.newInfoboxCountMap[ id ] = 0;
    }

    return sifStyle.newInfoboxCountMap[ id ];
  };

  sifStyle.incrementNewInfoboxCount = function( ele ) {
    var id = ele.id();

    if ( !sifStyle.newInfoboxCountMap[ id ] ) {
      sifStyle.newInfoboxCountMap[ id ] = 0;
    }

    sifStyle.newInfoboxCountMap[ id ]++;
  };

  sifStyle.getNodesByName = memoize( function( name ) {
    return cy.nodes().filter( '[label="' + name + '"]' );
  } );

  sifStyle.getEdgesByProps = memoize( function( propsStr ) {
    var props = propsStr.split( ' ' );
    var srcName = props[ 0 ];
    var type = props[ 1 ];
    var tgtName = props[ 2 ];
    var getId = function( node ) {
      return node.id();
    };

    var srcIds = sifStyle.getNodesByName( srcName ).map( getId );
    var tgtIds = sifStyle.getNodesByName( tgtName ).map( getId );

    var srcStr = srcIds.map( function( srcId ) {
      return '[source="' + srcId + '"]';
    } ).join( ',' );

    var tgtStr = tgtIds.map( function( tgtId ) {
      return '[target="' + tgtId + '"]';
    } ).join( ',' );

    return cy.edges().filter( srcStr )
                     .filter( tgtStr )
                     .filter( '[class="' + type + '"]' );
  } );

  return sifStyle;
};
