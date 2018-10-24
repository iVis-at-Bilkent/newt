var appUtilities = require('./app-utilities');
var memoize = require('lodash.memoize');

module.exports = function() {
  var cy, elementUtilities, tdParser;

  function sifFormat( chiseInstance ) {
    cy = chiseInstance.getCy();
    elementUtilities = chiseInstance.elementUtilities;
    tdParser = chiseInstance.tdParser;
  }

  sifFormat.apply = function( formatText ) {
    if ( elementUtilities.fileFormat != 'sif' ) {
      console.log( 'Map type must be sif to apply sif style!!!' );
      return;
    }

    if ( formatText == undefined ) {
      return;
    }

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
          selectedEles = sifFormat.getNodesByName( eleSelector );
        }
        else if ( eleType === 'edge' ) {
          selectedEles = sifFormat.getEdgesByProps( eleSelector );
        }
      }

      var nameMapping = {
        'color': 'background-color',
        'bordercolor': 'border-color',
        'borderwidth': 'border-width',
        'textcolor': 'font-color',
        // TODO: check possible shape options from file
      };

      var sanitizeFeatureVal = function( name, val ) {
        if ( name === 'border-width' ) {
          return parseInt( val );
        }
        else if ( name.endsWith( '-color' ) ) {
          var arr = val.split( ' ' );
          return 'rgb(' + arr.join( ',' ) + ')';
        }
      };

      if ( nameMapping[ featureName ] ) {
        var name = nameMapping[ featureName ];
        var val = sanitizeFeatureVal( name, featureVal );
        // console.log( name, val );
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

        // we are not able to use every feature now
        var value = infoboxFeatures[ 1 ];
        var bgColor = infoboxFeatures[ 2 ];
        var borderColor = infoboxFeatures[ 3 ];
        var type = 'unit of information';

        selectedEles.forEach( function( ele ) {
          // the new infoboxes index is equal to the current number
          // of infoboxes
          var index = ele.data('statesandinfos').length;

          var currentGeneralProperties = appUtilities.getScratch(cy, 'currentGeneralProperties');

          // TODO: make a refactoring to share this code with add menu function
          var obj = {};
          obj.clazz = type;
          obj.label = {
            text: ""
          };
          obj.bbox = {
            w: currentGeneralProperties.defaultInfoboxWidth,
            h: currentGeneralProperties.defaultInfoboxHeight
          };

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

    var ur = cy.undoRedo();
    ur.do("batch", actions);
  };

  sifFormat.getNodesByName = memoize( function( name ) {
    return cy.nodes().filter( '[label="' + name + '"]' );
  } );

  sifFormat.getEdgesByProps = memoize( function( propsStr ) {
    var props = propsStr.split( ' ' );
    var srcName = props[ 0 ];
    var type = props[ 1 ];
    var tgtName = props[ 2 ];
    var getId = function( node ) {
      return node.id();
    };

    var srcIds = sifFormat.getNodesByName( srcName ).map( getId );
    var tgtIds = sifFormat.getNodesByName( tgtName ).map( getId );

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

  return sifFormat;
};
