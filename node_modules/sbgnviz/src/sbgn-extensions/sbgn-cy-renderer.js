/*
 * Render sbgn specific shapes which are not supported by cytoscape.js core
 */

var libs = require('../utilities/lib-utilities').getLibs();
var jQuery = $ = libs.jQuery;
var cytoscape = libs.cytoscape;

var cyMath = math = cytoscape.math;
var cyBaseNodeShapes = cytoscape.baseNodeShapes;
var cyStyleProperties = cytoscape.styleProperties;

var classes = require('../utilities/classes');

module.exports = function () {
  var $$ = cytoscape;

  /*
  * Taken from cytoscape.js and modified so that it can be utilized from sbgnviz
  * in a flexable way. It is needed because the sbgnviz shapes would need to stroke
  * border more than once as they would have infoboxes, multimers etc.
  * Extends the style properties of node with the given ones then strokes the border.
  * Would needed to be slightly updated during cytoscape upgrades if related function in
  * Cytoscape.js is updated. Information about where is the related function is located
  * can be found in the file that list the changes done in ivis cytoscape fork.
  */
  $$.sbgn.drawBorder = function({ context, node, borderWidth, borderColor, borderStyle, borderOpacity }) {

    borderWidth = borderWidth || ( node && parseFloat( node.css( 'border-width' ) ) );

    if( borderWidth > 0 ){
      var parentOpacity = ( node && node.effectiveOpacity() ) || 1;

      borderStyle = borderStyle || ( node && node.css( 'border-style' ) );
      borderColor = borderColor || ( node && node.css( 'border-color' ) );
      borderOpacity = (
          borderOpacity || ( node && node.css( 'border-opacity' ) )
        ) * parentOpacity;

      var propsToRestore = [ 'lineWidth', 'lineCap', 'strokeStyle', 'globalAlpha' ];
      var initialProps = {};

      propsToRestore.forEach( function( propName ) {
        initialProps[ propName ] = context[ propName ];
      } );

      context.lineWidth = borderWidth;
      context.lineCap = 'butt';
      context.strokeStyle = borderColor;
      context.globalAlpha = borderOpacity;

      if( context.setLineDash ){ // for very outofdate browsers
        switch( borderStyle ){
          case 'dotted':
            context.setLineDash( [ 1, 1 ] );
            break;

          case 'dashed':
            context.setLineDash( [ 4, 2 ] );
            break;

          case 'solid':
          case 'double':
            context.setLineDash( [ ] );
            break;
        }
      }

      context.stroke();

      if( borderStyle === 'double' ){
        context.lineWidth = borderWidth / 3;

        let gco = context.globalCompositeOperation;
        context.globalCompositeOperation = 'destination-out';

        context.stroke();

        context.globalCompositeOperation = gco;
      }

      // reset in case we changed the border style
      if( context.setLineDash ){ // for very outofdate browsers
        context.setLineDash( [ ] );
      }

      propsToRestore.forEach( function( propName ) {
        context[ propName ] = initialProps[ propName ];
      } );
    }
  };

  // Taken from cytoscape.js and modified
  var drawRoundRectanglePath = $$.sbgn.drawRoundRectanglePath = function(
    context, x, y, width, height, radius ){

    var halfWidth = width / 2;
    var halfHeight = height / 2;
    var cornerRadius = radius || cyMath.getRoundRectangleRadius( width, height );

    if( context.beginPath ){ context.beginPath(); }

    // Start at top middle
    context.moveTo( x, y - halfHeight );
    // Arc from middle top to right side
    context.arcTo( x + halfWidth, y - halfHeight, x + halfWidth, y, cornerRadius );
    // Arc from right side to bottom
    context.arcTo( x + halfWidth, y + halfHeight, x, y + halfHeight, cornerRadius );
    // Arc from bottom to left side
    context.arcTo( x - halfWidth, y + halfHeight, x - halfWidth, y, cornerRadius );
    // Arc from left side to topBorder
    context.arcTo( x - halfWidth, y - halfHeight, x, y - halfHeight, cornerRadius );
    // Join line
    context.lineTo( x, y - halfHeight );


    context.closePath();
  };
  
  // Taken from cytoscape.js
  var drawPolygonPath = function(
    context, x, y, width, height, points ){

    var halfW = width / 2;
    var halfH = height / 2;

    if( context.beginPath ){ context.beginPath(); }

    context.moveTo( x + halfW * points[0], y + halfH * points[1] );

    for( var i = 1; i < points.length / 2; i++ ){
      context.lineTo( x + halfW * points[ i * 2], y + halfH * points[ i * 2 + 1] );
    }

    context.closePath();
  };
  
  var sbgnShapes = $$.sbgn.sbgnShapes = {
    'empty set': true,
    'nucleic acid feature': true,
    'complex': true,
    'macromolecule': true,
    'simple chemical': true,
    'biological activity': true,
    'compartment': true
  };

  var totallyOverridenNodeShapes = $$.sbgn.totallyOverridenNodeShapes = {
    'macromolecule': true,
    'nucleic acid feature': true,
    'simple chemical': true,
    'complex': true,
    'biological activity': true,
    'compartment': true
  };

  var canHaveInfoBoxShapes = $$.sbgn.canHaveInfoBoxShapes = {
    'simple chemical': true,
    'macromolecule': true,
    'nucleic acid feature': true,
    'complex': true,
    'biological activity': true,
    'compartment': true
  };

  var canBeMultimerShapes = $$.sbgn.canBeMultimerShapes = {
    'macromolecule': true,
    'complex': true,
    'nucleic acid feature': true,
    'simple chemical': true
  };

  cyMath.calculateDistance = function (point1, point2) {
    var distance = Math.pow(point1[0] - point2[0], 2) + Math.pow(point1[1] - point2[1], 2);
    return Math.sqrt(distance);
  };

  $$.sbgn.colors = {
    clone: "#838383"
  };

  $$.sbgn.getDefaultComplexCornerLength = function() {
    return 24;
  };

  $$.sbgn.drawStateAndInfos = function (node, context, centerX, centerY) {
    var layouts = node.data('auxunitlayouts');

    for (var side in layouts) {
      var layout = layouts[side];
      classes.AuxUnitLayout.draw(layout, node.cy(), context);
    }
    context.beginPath();
    context.closePath();
  };

  $$.sbgn.drawInfoBox = function(context, x, y, width, height, shapeName) {
    switch (shapeName) {
      case 'roundrectangle':
        cyBaseNodeShapes['roundrectangle'].draw(context, x, y, width, height);
        break;
      case 'bottomroundrectangle':
        $$.sbgn.drawBottomRoundRectangle(context, x, y, width, height);
        break;
      case 'ellipse':
        cyBaseNodeShapes['ellipse'].draw(context, x, y, width, height);
        break;
      case 'complex':
        $$.sbgn.drawComplex( context, x, y, width, height, height / 2 );
        break;
      case 'perturbing agent':
        var points = $$.sbgn.generatePerturbingAgentPoints();
        drawPolygonPath(context, x, y, width, height, points);
        break;
      case 'rectangle':
        cyBaseNodeShapes['rectangle'].draw(context, x, y, width, height);
        break;
      case 'stadium':
        $$.sbgn.drawRoundRectanglePath(context, x, y, width, height, Math.min(width / 2, height / 2, 15));
        break;
    }
  };

  // $$.sbgn.AfShapeArgsFn = function (self){
	//   return [self.bbox.w, self.bbox.h, classes.getAuxUnitClass(self).getParent(self).data("class")];
  // }


  $$.sbgn.nucleicAcidCheckPoint = function (x, y, padding, width, height, centerX, centerY, points, cornerRadius) {

    //check rectangle at top
    if (cyMath.pointInsidePolygon(x, y, points,
            centerX, centerY - cornerRadius / 2, width, height - cornerRadius / 3, [0, -1],
            padding)) {
      return true;
    }

    //check rectangle at bottom
    if (cyMath.pointInsidePolygon(x, y, points,
            centerX, centerY + height / 2 - cornerRadius / 2, width - 2 * cornerRadius, cornerRadius, [0, -1],
            padding)) {
      return true;
    }

    //check ellipses
    var checkInEllipse = function (x, y, centerX, centerY, width, height, padding) {
      x -= centerX;
      y -= centerY;

      x /= (width / 2 + padding);
      y /= (height / 2 + padding);

      return (Math.pow(x, 2) + Math.pow(y, 2) <= 1);
    }

    // Check bottom right quarter circle
    if (checkInEllipse(x, y,
            centerX + width / 2 - cornerRadius,
            centerY + height / 2 - cornerRadius,
            cornerRadius * 2, cornerRadius * 2, padding)) {

      return true;
    }

    // Check bottom left quarter circle
    if (checkInEllipse(x, y,
            centerX - width / 2 + cornerRadius,
            centerY + height / 2 - cornerRadius,
            cornerRadius * 2, cornerRadius * 2, padding)) {

      return true;
    }

    return false;
  };

  //we need to force opacity to 1 since we might have state and info boxes.
  //having opaque nodes which have state and info boxes gives unpleasent results.
  $$.sbgn.forceOpacityToOne = function (node, context) {
    var parentOpacity = node.effectiveOpacity();
    if (parentOpacity === 0) {
      return;
    }

    context.fillStyle = "rgba("
            + node._private.style["background-color"].value[0] + ","
            + node._private.style["background-color"].value[1] + ","
            + node._private.style["background-color"].value[2] + ","
            + (1 * node.css('opacity') * parentOpacity) + ")";
  };

  $$.sbgn.drawSimpleChemicalPath = function (
          context, x, y, width, height) {

    var halfWidth = width / 2;
    var halfHeight = height / 2;
    //var cornerRadius = $$.math.getRoundRectangleRadius(width, height);
    var cornerRadius = Math.min(halfWidth, halfHeight);

    context.beginPath();

    // Start at top middle
    context.moveTo(x, y-halfHeight);
    // Arc from middle top to right side
    context.arcTo(x+halfWidth, y-halfHeight, x+halfWidth, y, cornerRadius);
    // Arc from right side to bottom
    context.arcTo(x+halfWidth, y+halfHeight, x, y+halfHeight, cornerRadius);
    // Arc from bottom to left side
    context.arcTo(x-halfWidth, y+halfHeight, x-halfWidth, y, cornerRadius);
    // Arc from left side to topBorder
    context.arcTo(x-halfWidth, y-halfHeight, x, y-halfHeight, cornerRadius);
    // Join line
    context.lineTo(x, y-halfHeight);

    context.closePath();

  };

  $$.sbgn.drawSimpleChemical = function (
          context, x, y, width, height) {
    $$.sbgn.drawSimpleChemicalPath(context, x, y, width, height);
    context.fill();
  };

  function simpleChemicalLeftClone(context, centerX, centerY,
          width, height, cloneMarker, opacity) {
    if (cloneMarker != null) {
      var oldGlobalAlpha = context.globalAlpha;
      context.globalAlpha = opacity;
      var oldStyle = context.fillStyle;
      context.fillStyle = $$.sbgn.colors.clone;

      context.beginPath();

      var markerBeginX = centerX - width/2 * Math.sin(Math.PI / 3);
      var markerBeginY = centerY + height/2 * Math.cos(Math.PI / 3);
      var markerEndX = centerX;
      var markerEndY = markerBeginY;

      context.moveTo(markerBeginX, markerBeginY);
      context.lineTo(markerEndX, markerEndY);
      context.arc(centerX, centerY, width/2, 3 * Math.PI / 6, 5 * Math.PI / 6);

      context.closePath();

      context.fill();
      context.fillStyle = oldStyle;
      context.globalAlpha = oldGlobalAlpha;
    }
  };

  function simpleChemicalRightClone(context, centerX, centerY,
          width, height, cloneMarker, opacity) {
    if (cloneMarker != null) {
      var oldGlobalAlpha = context.globalAlpha;
      context.globalAlpha = opacity;
      var oldStyle = context.fillStyle;
      context.fillStyle = $$.sbgn.colors.clone;

      context.beginPath();

      var markerBeginX = centerX;
      var markerBeginY = centerY + height/2 * Math.cos(Math.PI / 3);
      var markerEndX = centerX + width/2 * Math.sin(Math.PI / 3);
      var markerEndY = markerBeginY;

      context.moveTo(markerBeginX, markerBeginY);
      context.lineTo(markerEndX, markerEndY);
      context.arc(centerX, centerY, width/2, Math.PI / 6, 3 * Math.PI / 6);

      context.closePath();

      context.fill();
      context.fillStyle = oldStyle;
      context.globalAlpha = oldGlobalAlpha;
    }
  };

  $$.sbgn.drawEllipsePath = function (context, x, y, width, height) {
    cyBaseNodeShapes['ellipse'].drawPath(context, x, y, width, height);
  };

  $$.sbgn.drawBarrel = function (context, x, y, width, height) {
    cyBaseNodeShapes['barrel'].draw(context, x, y, width, height);
    context.fill();
  };

  $$.sbgn.drawBottomRoundRectangle = function (context, x, y, width, height) {
    cyBaseNodeShapes['bottomroundrectangle'].draw(context, x, y, width, height);
    context.fill();
  };

  // The old draw implementation for nucleic acid feature
  // now only used for clone marker drawing of nucleic acid feature
  // and macromolecule shapes because 'bottomroundrectangle' function
  // of cytoscape.js did not fit well for this purpose.
  // Did not change the name yet directly as drawNucAcidFeatureClone etc.
  // because it actually draws a nucleic acid feature in a different way.
  $$.sbgn.drawNucAcidFeature2 = function (context, centerX, centerY,
          width, height, cornerRadius) {
    cornerRadius = cornerRadius || cyMath.getRoundRectangleRadius(width, height);
    var halfWidth = width / 2;
    var halfHeight = height / 2;
    var left = centerX - halfWidth, right = centerX + halfWidth;
    var bottom = centerY - halfHeight, top = centerY + halfHeight;
    context.beginPath();

    context.moveTo(left, bottom);
    context.lineTo(right, bottom);
    context.lineTo(right, centerY);
    context.arcTo(right, top, centerX, top, cornerRadius);
    context.arcTo(left, top, left, centerY, cornerRadius);
    context.lineTo(left, bottom);

    context.closePath();
    context.fill();
  };

  /*
   * Code taken from https://jsperf.com/string-prototype-endswith
   * Direct implementation seems to work better.
   * Using this improves isMultimer() performance.
   * Makes it take 0.1 or 0.2% less time from the whole
   * loading process, down from ~0.4% initially.
   */
  function endsWith(str, pattern) {
    for (var i = pattern.length, l = str.length; i--;) {
      if (str.charAt(--l) != pattern.charAt(i)) {
        return false;
      }
    }
    return true;
  }

  $$.sbgn.isMultimer = function (node) {
    var sbgnClass = node._private.data.class;
    if (sbgnClass && endsWith(sbgnClass, "multimer"))
      return true;
    return false;
  };

  //this function is created to have same corner length when
  //complex's width or height is changed
  $$.sbgn.generateComplexShapePoints = function (cornerLength, width, height) {
    //cp stands for corner proportion
    var cpX = Math.min(cornerLength, 0.5 * width) / width;
    var cpY = Math.min(cornerLength, 0.5 * height) / height;

    var complexPoints = [-1 + cpX, -1, -1, -1 + cpY, -1, 1 - cpY, -1 + cpX,
      1, 1 - cpX, 1, 1, 1 - cpY, 1, -1 + cpY, 1 - cpX, -1];

    return complexPoints;
  };

  $$.sbgn.generatePerturbingAgentPoints = function() {
    return [-1, -1,   -0.5, 0,  -1, 1,   1, 1,   0.5, 0, 1, -1];
  };

  $$.sbgn.getDefaultMultimerPadding = function() {
    return 5;
  };

  // draw background image of nodes
  $$.sbgn.drawImage = function( context, imgObj ) {
    if(imgObj){
      context.clip();
      context.drawImage(imgObj.img, 0, 0, imgObj.imgW, imgObj.imgH, imgObj.x, imgObj.y, imgObj.w, imgObj.h );
      context.restore();
    }
  };

  cyStyleProperties.types.nodeShape.enums.push(
    'empty set', 'nucleic acid feature', 'complex', 'macromolecule',
    'simple chemical', 'biological activity', 'compartment'
  );

  $$.sbgn.registerSbgnNodeShapes = function () {

    function generateDrawFcn( { plainDrawFcn, extraDrawFcn, canBeMultimer, cloneMarkerFcn,
      canHaveInfoBox, multimerPadding } ) {

      return function( context, node, imgObj ) {

        var borderWidth = parseFloat(node.css('border-width'));
        var width = node.outerWidth() - borderWidth;
        var height = node.outerHeight() - borderWidth;
        var centerX = node._private.position.x;
        var centerY = node._private.position.y;
        var bgOpacity = node.css('background-opacity');
        var isCloned = cloneMarkerFcn != null && node._private.data.clonemarker;

        if ( canBeMultimer && $$.sbgn.isMultimer( node ) ) {
          //add multimer shape
          plainDrawFcn( context, centerX + multimerPadding,
                  centerY + multimerPadding, width, height );

          $$.sbgn.drawBorder( { context, node } );

          if ( extraDrawFcn ) {
            extraDrawFcn( context, centerX + multimerPadding,
                    centerY + multimerPadding, width, height );


            $$.sbgn.drawBorder( { context, node } );
          }

          if ( isCloned ) {
            cloneMarkerFcn(context,
                    centerX + multimerPadding, centerY + multimerPadding,
                    width - borderWidth, height - borderWidth, isCloned, true, bgOpacity);
          }
        }

        plainDrawFcn( context, centerX, centerY, width, height );

        $$.sbgn.drawBorder( { context, node } );
        $$.sbgn.drawImage( context, imgObj );

        if ( extraDrawFcn ) {
            extraDrawFcn( context, centerX, centerY, width, height );

            $$.sbgn.drawBorder( { context, node } );
        }

        if ( isCloned ) {
          cloneMarkerFcn(context, centerX, centerY, width - borderWidth,
                    height - borderWidth, isCloned, false, bgOpacity);
        }

        if ( canHaveInfoBox ) {
          var oldStyle = context.fillStyle;
          $$.sbgn.forceOpacityToOne(node, context);
          $$.sbgn.drawStateAndInfos(node, context, centerX, centerY);
          context.fillStyle = oldStyle;
        }
      };
    }

    function generateIntersectLineFcn( { plainIntersectLineFcn, canBeMultimer, cloneMarkerFcn,
      canHaveInfoBox, multimerPadding } ) {

      return function( node, x, y ) {
        var borderWidth = parseFloat(node.css('border-width'));
        var padding = borderWidth / 2;
        var width = node.outerWidth() - borderWidth;
        var height = node.outerHeight() - borderWidth;
        var centerX = node._private.position.x;
        var centerY = node._private.position.y;

        var intersections = [];

        if ( canHaveInfoBox ) {
          var stateAndInfoIntersectLines = $$.sbgn.intersectLineStateAndInfoBoxes(
                  node, x, y);

          intersections = intersections.concat( stateAndInfoIntersectLines );
        }

        var nodeIntersectLines = plainIntersectLineFcn(centerX, centerY, width,
                height, x, y, padding);

        intersections = intersections.concat( nodeIntersectLines );

        if ( canBeMultimer && $$.sbgn.isMultimer(node) ) {
          var multimerIntersectionLines = plainIntersectLineFcn(
                  centerX + multimerPadding, centerY + multimerPadding, width,
                  height, x, y, padding);

          intersections = intersections.concat( multimerIntersectionLines );
        }

        return $$.sbgn.closestIntersectionPoint([x, y], intersections);
      };
    }

    function generateCheckPointFcn( { plainCheckPointFcn, canBeMultimer, cloneMarkerFcn,
      canHaveInfoBox, multimerPadding } ) {

      return function( x, y, node, threshold ) {

        threshold = threshold || 0;
        var borderWidth = parseFloat(node.css('border-width'));
        var width = node.outerWidth() - borderWidth + 2 * threshold;
        var height = node.outerHeight() - borderWidth + 2 * threshold;
        var centerX = node._private.position.x;
        var centerY = node._private.position.y;
        var padding = borderWidth / 2;

        var nodeCheck = function() {
          return plainCheckPointFcn( x, y, padding, width, height, centerX, centerY );
        };

        var stateAndInfoCheck = function() {
          return canHaveInfoBox && $$.sbgn.checkPointStateAndInfoBoxes(x, y, node, threshold);
        };

        var multimerCheck = function() {
          return canBeMultimer && $$.sbgn.isMultimer(node)
                  && plainCheckPointFcn( x, y, padding, width, height,
                                          centerX + multimerPadding,
                                          centerY + multimerPadding );
        };

        return nodeCheck() || stateAndInfoCheck() || multimerCheck();
      };
    }

    var shapeNames = [ "simple chemical", "macromolecule", "complex",
      "nucleic acid feature", "empty set", "biological activity",
      "compartment", "oldCompartment"
    ];

    shapeNames.forEach( function( shapeName ) {
      var plainDrawFcn = $$.sbgn.plainDraw[ shapeName ];
      var plainIntersectLineFcn = $$.sbgn.plainIntersectLine[ shapeName ];
      var plainCheckPointFcn = $$.sbgn.plainCheckPoint[ shapeName ];
      var canBeMultimer = $$.sbgn.canBeMultimerShapes[ shapeName ];
      var cloneMarkerFcn = $$.sbgn.cloneMarker[ shapeName ];
      var canHaveInfoBox = $$.sbgn.canHaveInfoBoxShapes[ shapeName ];
      var multimerPadding = $$.sbgn.getDefaultMultimerPadding();
      var extraDrawFcn = $$.sbgn.extraDraw[ shapeName ];

      var draw = generateDrawFcn( { plainDrawFcn, canBeMultimer, cloneMarkerFcn,
        canHaveInfoBox, multimerPadding, extraDrawFcn
      } );

      var intersectLine = totallyOverridenNodeShapes[ shapeName ] ?
        generateIntersectLineFcn( { plainIntersectLineFcn, canBeMultimer, cloneMarkerFcn,
          canHaveInfoBox, multimerPadding
        } ) : plainIntersectLineFcn;

      var checkPoint = totallyOverridenNodeShapes[ shapeName ] ?
        generateCheckPointFcn( { plainCheckPointFcn, canBeMultimer, cloneMarkerFcn,
          canHaveInfoBox, multimerPadding
        } ) : plainCheckPointFcn;

      var shape = { draw, intersectLine, checkPoint, multimerPadding };

      cyBaseNodeShapes[ shapeName ] = shape;
    } );
  };

  $$.sbgn.drawEllipse = function (context, x, y, width, height) {
    //$$.sbgn.drawEllipsePath(context, x, y, width, height);
    //context.fill();
    cyBaseNodeShapes['ellipse'].draw(context, x, y, width, height);
  };

  $$.sbgn.drawComplex = function( context, x, y, width, height, cornerLength ) {
    cornerLength = cornerLength || $$.sbgn.getDefaultComplexCornerLength();
    var points = $$.sbgn.generateComplexShapePoints(cornerLength, width, height);

    drawPolygonPath(context, x, y, width, height, points);

    context.fill();
  };

  $$.sbgn.drawCrossLine = function( context, x, y, width, height ) {
    var points = cyMath.generateUnitNgonPoints(4, 0);

    context.beginPath();
    var scaleX = width * Math.sqrt(2) / 2, scaleY =  height * Math.sqrt(2) / 2;

    context.moveTo(x + scaleX * points[2], y + scaleY * points[3]);
    context.lineTo(x + scaleX * points[6], y + scaleY * points[7]);
    context.closePath();
  };

  $$.sbgn.drawBiologicalActivity = function( context, x, y, width, height ) {
    var points = $$.sbgn.generateBiologicalActivityPoints();
    drawPolygonPath(context,
            x, y, width, height, points);
    context.fill();
  };

  $$.sbgn.drawRoundRectangle = function( context, x, y, width, height ) {
    drawRoundRectanglePath( context, x, y, width, height );
    context.fill();
  };

  $$.sbgn.generateNucleicAcidPoints = function() {
    return cyMath.generateUnitNgonPointsFitToSquare(4, 0);
  };

  $$.sbgn.generateBiologicalActivityPoints = function() {
    return cyMath.generateUnitNgonPointsFitToSquare(4, 0);
  };

  $$.sbgn.generateCompartmentPoints = function() {
    return math.generateUnitNgonPointsFitToSquare(4, 0);
  };

  $$.sbgn.plainDraw = {
    "simple chemical": $$.sbgn.drawSimpleChemical,
    "macromolecule": $$.sbgn.drawRoundRectangle,
    "complex": $$.sbgn.drawComplex,
    "nucleic acid feature": $$.sbgn.drawBottomRoundRectangle,
    "empty set": $$.sbgn.drawEllipse,
    "biological activity": $$.sbgn.drawBiologicalActivity,
    "compartment": $$.sbgn.drawBarrel,
    "oldCompartment": $$.sbgn.drawRoundRectangle
  };

  // To define an extra drawing for the node that is rendered at the very end,
  // even after the node background image is drawn.
  // E.g. cross lines of "empty set" nodes.
  $$.sbgn.extraDraw = {
    "empty set": $$.sbgn.drawCrossLine
  };

  $$.sbgn.plainIntersectLine = {
    "simple chemical": function( centerX, centerY, width, height, x, y, padding ) {
      return cyBaseNodeShapes["ellipse"].intersectLine( centerX, centerY, width, height, x, y, padding );
    },
    "macromolecule": function( centerX, centerY, width, height, x, y, padding ) {
      return $$.sbgn.roundRectangleIntersectLine( x, y, centerX, centerY, centerX, centerY,
        width, height,
        cyMath.getRoundRectangleRadius(width, height), padding
      );
    },
    "complex": function( centerX, centerY, width, height, x, y, padding ) {
      var points = $$.sbgn.generateComplexShapePoints( $$.sbgn.getDefaultComplexCornerLength(), width, height );
      return cyMath.polygonIntersectLine(
        x, y, points, centerX, centerY, width / 2, height / 2, padding
      );
    },
    "nucleic acid feature": function( centerX, centerY, width, height, x, y, padding ) {
      return cyBaseNodeShapes["bottomroundrectangle"].intersectLine( centerX, centerY, width, height, x, y, padding );
    },
    "empty set": function( centerX, centerY, width, height, x, y, padding ) {
      return cyBaseNodeShapes["ellipse"].intersectLine( centerX, centerY, width, height, x, y, padding );
    },
    "biological activity": function( centerX, centerY, width, height, x, y, padding ) {
      var points = $$.sbgn.generateBiologicalActivityPoints();
      return cyMath.polygonIntersectLine(
        x, y, points, centerX, centerY, width / 2, height / 2, padding
      );
    },
    "compartment": function( centerX, centerY, width, height, x, y, padding ) {
      return cyBaseNodeShapes["barrel"].intersectLine( centerX, centerY, width, height, x, y, padding );
    },
    "oldCompartment": function( centerX, centerY, width, height, x, y, padding ) {
      return cyMath.roundRectangleIntersectLine(
        x, y, centerX, centerY, width, height, padding
      );
    }
  };

  $$.sbgn.plainCheckPoint = {
    "simple chemical": function( x, y, padding, width, height, centerX, centerY ) {

      var points = cyMath.generateUnitNgonPointsFitToSquare( 4, 0 );
      var halfWidth = width / 2;
      var halfHeight = height / 2;
    //var cornerRadius = $$.math.getRoundRectangleRadius(width, height);
      var cornerRadius = Math.min(halfWidth, halfHeight);
      //var cornerRadius = math.getRoundRectangleRadius( width, height );
      var diam = cornerRadius * 2;

      // Check hBox
      if( cyMath.pointInsidePolygon( x, y, points,
        centerX, centerY, width, height - diam, [0, -1], padding ) ){
        return true;
      }

      // Check vBox
      if( cyMath.pointInsidePolygon( x, y, points,
        centerX, centerY, width - diam, height, [0, -1], padding ) ){
        return true;
      }

      // Check top left quarter circle
      if( cyMath.checkInEllipse( x, y,
        diam, diam,
        centerX - width / 2 + cornerRadius,
        centerY - height / 2 + cornerRadius,
        padding ) ){

        return true;
      }

      // Check top right quarter circle
      if( cyMath.checkInEllipse( x, y,
        diam, diam,
        centerX + width / 2 - cornerRadius,
        centerY - height / 2 + cornerRadius,
        padding ) ){

        return true;
      }

      // Check bottom right quarter circle
      if( cyMath.checkInEllipse( x, y,
        diam, diam,
        centerX + width / 2 - cornerRadius,
        centerY + height / 2 - cornerRadius,
        padding ) ){

        return true;
      }

      // Check bottom left quarter circle
      if( cyMath.checkInEllipse( x, y,
        diam, diam,
        centerX - width / 2 + cornerRadius,
        centerY + height / 2 - cornerRadius,
        padding ) ){

        return true;
      }
      return false;
      //return cyBaseNodeShapes["ellipse"].checkPoint( x, y, padding, width, height, centerX, centerY );
    },
    "macromolecule": function( x, y, padding, width, height, centerX, centerY ) {
      return cyBaseNodeShapes["roundrectangle"].checkPoint( x, y, padding, width, height, centerX, centerY );
    },
    "complex": function( x, y, padding, width, height, centerX, centerY ) {
      var points = $$.sbgn.generateComplexShapePoints( $$.sbgn.getDefaultComplexCornerLength(), width, height );
      return cyMath.pointInsidePolygon(
        x, y, points, centerX, centerY, width, height, [0, -1], padding);
    },
    "nucleic acid feature": function( x, y, padding, width, height, centerX, centerY ) {
      return cyBaseNodeShapes["bottomroundrectangle"].checkPoint( x, y, padding, width, height, centerX, centerY );
    },
    "empty set": function( x, y, padding, width, height, centerX, centerY ) {
      return cyBaseNodeShapes["ellipse"].checkPoint( x, y, padding, width, height, centerX, centerY );
    },
    "biological activity": function( x, y, padding, width, height, centerX, centerY ) {
      return cyBaseNodeShapes["rectangle"].checkPoint( x, y, padding, width, height, centerX, centerY );
    },
    "compartment": function( x, y, padding, width, height, centerX, centerY ) {
      return cyBaseNodeShapes["barrel"].checkPoint( x, y, padding, width, height, centerX, centerY );
    },
    "oldCompartment": function( x, y, padding, width, height, centerX, centerY ) {
      return cyBaseNodeShapes["roundrectangle"].checkPoint( x, y, padding, width, height, centerX, centerY );
    }
  };

  $$.sbgn.cloneMarker = {
    "simple chemical": function (context, centerX, centerY,
            width, height, cloneMarker, isMultimer, opacity) {
      if (cloneMarker != null) {
        var cornerRadius = Math.min(width / 2, height / 2);

        var firstCircleCenterX = centerX - width / 2 + cornerRadius;
        var firstCircleCenterY = centerY;
        var secondCircleCenterX = centerX + width / 2 - cornerRadius;
        var secondCircleCenterY = centerY;
        var bottomCircleCenterX = centerX;
        var bottomCircleCenterY = centerY + height/2 - cornerRadius;

        if (width < height) {
          simpleChemicalLeftClone(context, bottomCircleCenterX, bottomCircleCenterY,
              2 * cornerRadius, 2 * cornerRadius, cloneMarker, opacity);
          simpleChemicalRightClone(context, bottomCircleCenterX, bottomCircleCenterY,
              2 * cornerRadius, 2 * cornerRadius, cloneMarker, opacity);
        }
        else {
          simpleChemicalLeftClone(context, firstCircleCenterX, firstCircleCenterY,
              2 * cornerRadius, 2 * cornerRadius, cloneMarker, opacity);
          simpleChemicalRightClone(context, secondCircleCenterX, secondCircleCenterY,
              2 * cornerRadius, 2 * cornerRadius, cloneMarker, opacity);
        }

        var oldStyle = context.fillStyle;
        context.fillStyle = $$.sbgn.colors.clone;
        var oldGlobalAlpha = context.globalAlpha;
        context.globalAlpha = opacity;

        var recPoints = cyMath.generateUnitNgonPointsFitToSquare(4, 0);
        var cloneX = centerX;
        var cloneY = centerY + 3 / 4 * cornerRadius;
        var cloneWidth = width - 2 * cornerRadius;
        var cloneHeight = cornerRadius / 2;

        drawPolygonPath(context, cloneX, cloneY, cloneWidth, cloneHeight, recPoints);
        context.fill();
        context.fillStyle = oldStyle;
        context.globalAlpha = oldGlobalAlpha;
      }
    },
    "nucleic acid feature": function (context, centerX, centerY,
            width, height, cloneMarker, isMultimer, opacity) {
      if (cloneMarker != null) {
        var cloneWidth = width;
        var cloneHeight = height / 4;
        var cloneX = centerX;
        var cloneY = centerY + 3 * height / 8;

        var oldStyle = context.fillStyle;
        context.fillStyle = $$.sbgn.colors.clone;
        var oldGlobalAlpha = context.globalAlpha;
        context.globalAlpha = opacity;

        var cornerRadius = cyMath.getRoundRectangleRadius(width, height);

        $$.sbgn.drawNucAcidFeature2(context, cloneX, cloneY,
                cloneWidth, cloneHeight, cornerRadius);

        context.fillStyle = oldStyle;
        context.globalAlpha = oldGlobalAlpha;
      }
    },
    "macromolecule": function (context, centerX, centerY,
            width, height, cloneMarker, isMultimer, opacity) {
      $$.sbgn.cloneMarker["nucleic acid feature"](context, centerX, centerY,
              width, height, cloneMarker, isMultimer, opacity);
    },
    "complex": function (context, centerX, centerY,
            width, height, cloneMarker, isMultimer, opacity) {
      if (cloneMarker != null) {
        var cornerLength = $$.sbgn.getDefaultComplexCornerLength();
        var cpX = (width >= 50) ? cornerLength / width : cornerLength / 50;
        var cpY = (height >= 50) ? cornerLength / height : cornerLength / 50;
        var cloneWidth = width;
        var cloneHeight = height * cpY / 2;
        var cloneX = centerX;
        var cloneY = centerY + height / 2 - cloneHeight / 2;

        var markerPoints = [-1, -1, 1, -1, 1 - cpX, 1, -1 + cpX, 1];

        var oldStyle = context.fillStyle;
        context.fillStyle = $$.sbgn.colors.clone;
        var oldGlobalAlpha = context.globalAlpha;
        context.globalAlpha = opacity;

        drawPolygonPath(context,
                cloneX, cloneY,
                cloneWidth, cloneHeight, markerPoints);
        context.fill();

        context.fillStyle = oldStyle;
        context.globalAlpha = oldGlobalAlpha;

      }
    }
  };

  $$.sbgn.closestIntersectionPoint = function (point, intersections) {
    if (intersections.length <= 0)
      return [];

    var closestIntersection = [];
    var minDistance = Number.MAX_VALUE;

    for (var i = 0; i < intersections.length; i = i + 2) {
      var checkPoint = [intersections[i], intersections[i + 1]];
      var distance = cyMath.calculateDistance(point, checkPoint);

      if (distance < minDistance) {
        minDistance = distance;
        closestIntersection = checkPoint;
      }
    }

    return closestIntersection;
  };

  $$.sbgn.nucleicAcidIntersectionLine = function (x, y, nodeX, nodeY, width, height, cornerRadius, padding) {
    // var nodeX = node._private.position.x;
    // var nodeY = node._private.position.y;
    // var width = node.width();
    // var height = node.height();
    // var padding = parseInt(node.css('border-width')) / 2;

    var halfWidth = width / 2;
    var halfHeight = height / 2;

    var straightLineIntersections;

    // Top segment, left to right
    {
      var topStartX = nodeX - halfWidth - padding;
      var topStartY = nodeY - halfHeight - padding;
      var topEndX = nodeX + halfWidth + padding;
      var topEndY = topStartY;

      straightLineIntersections = cyMath.finiteLinesIntersect(
              x, y, nodeX, nodeY, topStartX, topStartY, topEndX, topEndY, false);

      if (straightLineIntersections.length > 0) {
        return straightLineIntersections;
      }
    }

    // Right segment, top to bottom
    {
      var rightStartX = nodeX + halfWidth + padding;
      var rightStartY = nodeY - halfHeight - padding;
      var rightEndX = rightStartX;
      var rightEndY = nodeY + halfHeight - cornerRadius + padding;

      straightLineIntersections = cyMath.finiteLinesIntersect(
              x, y, nodeX, nodeY, rightStartX, rightStartY, rightEndX, rightEndY, false);

      if (straightLineIntersections.length > 0) {
        return straightLineIntersections;
      }
    }

    // Bottom segment, left to right
    {
      var bottomStartX = nodeX - halfWidth + cornerRadius - padding;
      var bottomStartY = nodeY + halfHeight + padding;
      var bottomEndX = nodeX + halfWidth - cornerRadius + padding;
      var bottomEndY = bottomStartY;

      straightLineIntersections = cyMath.finiteLinesIntersect(
              x, y, nodeX, nodeY, bottomStartX, bottomStartY, bottomEndX, bottomEndY, false);

      if (straightLineIntersections.length > 0) {
        return straightLineIntersections;
      }
    }

    // Left segment, top to bottom
    {
      var leftStartX = nodeX - halfWidth - padding;
      var leftStartY = nodeY - halfHeight - padding;
      var leftEndX = leftStartX;
      var leftEndY = nodeY + halfHeight - cornerRadius + padding;

      straightLineIntersections = cyMath.finiteLinesIntersect(
              x, y, nodeX, nodeY, leftStartX, leftStartY, leftEndX, leftEndY, false);

      if (straightLineIntersections.length > 0) {
        return straightLineIntersections;
      }
    }

    // Check intersections with arc segments, we have only two arcs for
    //nucleic acid features
    var arcIntersections;

    // Bottom Right
    {
      var bottomRightCenterX = nodeX + halfWidth - cornerRadius;
      var bottomRightCenterY = nodeY + halfHeight - cornerRadius
      arcIntersections = cyMath.intersectLineCircle(
              x, y, nodeX, nodeY,
              bottomRightCenterX, bottomRightCenterY, cornerRadius + padding);

      // Ensure the intersection is on the desired quarter of the circle
      if (arcIntersections.length > 0
              && arcIntersections[0] >= bottomRightCenterX
              && arcIntersections[1] >= bottomRightCenterY) {
        return [arcIntersections[0], arcIntersections[1]];
      }
    }

    // Bottom Left
    {
      var bottomLeftCenterX = nodeX - halfWidth + cornerRadius;
      var bottomLeftCenterY = nodeY + halfHeight - cornerRadius
      arcIntersections = cyMath.intersectLineCircle(
              x, y, nodeX, nodeY,
              bottomLeftCenterX, bottomLeftCenterY, cornerRadius + padding);

      // Ensure the intersection is on the desired quarter of the circle
      if (arcIntersections.length > 0
              && arcIntersections[0] <= bottomLeftCenterX
              && arcIntersections[1] >= bottomLeftCenterY) {
        return [arcIntersections[0], arcIntersections[1]];
      }
    }
    return []; // if nothing
  };

  //this function gives the intersections of any line with the upper half of perturbing agent
  $$.sbgn.perturbingAgentIntersectLine = function (
          x1, y1, x2, y2, nodeX, nodeY, width, height, padding) {

    var halfWidth = width / 2;
    var halfHeight = height / 2;

    // Check intersections with straight line segments
    var straightLineIntersections = [];

    // Top segment, left to right
    {
      var topStartX = nodeX - halfWidth - padding;
      var topStartY = nodeY - halfHeight - padding;
      var topEndX = nodeX + halfWidth + padding;
      var topEndY = topStartY;

      var intersection = cyMath.finiteLinesIntersect(
              x1, y1, x2, y2, topStartX, topStartY, topEndX, topEndY, false);

      if (intersection.length > 0) {
        straightLineIntersections = straightLineIntersections.concat(intersection);
      }
    }

    // Right segment, top to bottom
    {
      var rightStartX = nodeX + halfWidth + padding;
      var rightStartY = nodeY - halfHeight - padding;
      var rightEndX = rightStartX - halfWidth/2;
      var rightEndY = nodeY + padding;

      var intersection = cyMath.finiteLinesIntersect(
              x1, y1, x2, y2, rightStartX, rightStartY, rightEndX, rightEndY, false);

      if (intersection.length > 0) {
        straightLineIntersections = straightLineIntersections.concat(intersection);
      }
    }

    // Left segment, top to bottom
    {
      var leftStartX = nodeX - halfWidth - padding;
      var leftStartY = nodeY - halfHeight - padding;
      var leftEndX = leftStartX + halfWidth/2;
      var leftEndY = nodeY + padding;

      var intersection = cyMath.finiteLinesIntersect(
              x1, y1, x2, y2, leftStartX, leftStartY, leftEndX, leftEndY, false);

      if (intersection.length > 0) {
        straightLineIntersections = straightLineIntersections.concat(intersection);
      }
    }

    return straightLineIntersections;
  };

  //this function gives the intersections of any line with a round rectangle
  $$.sbgn.roundRectangleIntersectLine = function (
          x1, y1, x2, y2, nodeX, nodeY, width, height, cornerRadius, padding) {

    var halfWidth = width / 2;
    var halfHeight = height / 2;

    // Check intersections with straight line segments
    var straightLineIntersections = [];
    // Top segment, left to right
    {
      var topStartX = nodeX - halfWidth + cornerRadius - padding;
      var topStartY = nodeY - halfHeight - padding;
      var topEndX = nodeX + halfWidth - cornerRadius + padding;
      var topEndY = topStartY;

      var intersection = cyMath.finiteLinesIntersect(
              x1, y1, x2, y2, topStartX, topStartY, topEndX, topEndY, false);

      if (intersection.length > 0) {
        straightLineIntersections = straightLineIntersections.concat(intersection);
      }
    }

    // Right segment, top to bottom
    {
      var rightStartX = nodeX + halfWidth + padding;
      var rightStartY = nodeY - halfHeight + cornerRadius - padding;
      var rightEndX = rightStartX;
      var rightEndY = nodeY + halfHeight - cornerRadius + padding;

      var intersection = cyMath.finiteLinesIntersect(
              x1, y1, x2, y2, rightStartX, rightStartY, rightEndX, rightEndY, false);

      if (intersection.length > 0) {
        straightLineIntersections = straightLineIntersections.concat(intersection);
      }
    }

    // Bottom segment, left to right
    {
      var bottomStartX = nodeX - halfWidth + cornerRadius - padding;
      var bottomStartY = nodeY + halfHeight + padding;
      var bottomEndX = nodeX + halfWidth - cornerRadius + padding;
      var bottomEndY = bottomStartY;

      var intersection = cyMath.finiteLinesIntersect(
              x1, y1, x2, y2, bottomStartX, bottomStartY, bottomEndX, bottomEndY, false);

      if (intersection.length > 0) {
        straightLineIntersections = straightLineIntersections.concat(intersection);
      }
    }

    // Left segment, top to bottom
    {
      var leftStartX = nodeX - halfWidth - padding;
      var leftStartY = nodeY - halfHeight + cornerRadius - padding;
      var leftEndX = leftStartX;
      var leftEndY = nodeY + halfHeight - cornerRadius + padding;

      var intersection = cyMath.finiteLinesIntersect(
              x1, y1, x2, y2, leftStartX, leftStartY, leftEndX, leftEndY, false);

      if (intersection.length > 0) {
        straightLineIntersections = straightLineIntersections.concat(intersection);
      }
    }

    // Check intersections with arc segments
    var arcIntersections;

    // Top Left
    {
      var topLeftCenterX = nodeX - halfWidth + cornerRadius;
      var topLeftCenterY = nodeY - halfHeight + cornerRadius
      arcIntersections = cyMath.intersectLineCircle(
              x1, y1, x2, y2,
              topLeftCenterX, topLeftCenterY, cornerRadius + padding);

      // Ensure the intersection is on the desired quarter of the circle
      if (arcIntersections.length > 0
              && arcIntersections[0] <= topLeftCenterX
              && arcIntersections[1] <= topLeftCenterY) {
        straightLineIntersections = straightLineIntersections.concat(arcIntersections);
      }
    }

    // Top Right
    {
      var topRightCenterX = nodeX + halfWidth - cornerRadius;
      var topRightCenterY = nodeY - halfHeight + cornerRadius
      arcIntersections = cyMath.intersectLineCircle(
              x1, y1, x2, y2,
              topRightCenterX, topRightCenterY, cornerRadius + padding);

      // Ensure the intersection is on the desired quarter of the circle
      if (arcIntersections.length > 0
              && arcIntersections[0] >= topRightCenterX
              && arcIntersections[1] <= topRightCenterY) {
        straightLineIntersections = straightLineIntersections.concat(arcIntersections);
      }
    }

    // Bottom Right
    {
      var bottomRightCenterX = nodeX + halfWidth - cornerRadius;
      var bottomRightCenterY = nodeY + halfHeight - cornerRadius
      arcIntersections = cyMath.intersectLineCircle(
              x1, y1, x2, y2,
              bottomRightCenterX, bottomRightCenterY, cornerRadius + padding);

      // Ensure the intersection is on the desired quarter of the circle
      if (arcIntersections.length > 0
              && arcIntersections[0] >= bottomRightCenterX
              && arcIntersections[1] >= bottomRightCenterY) {
        straightLineIntersections = straightLineIntersections.concat(arcIntersections);
      }
    }

    // Bottom Left
    {
      var bottomLeftCenterX = nodeX - halfWidth + cornerRadius;
      var bottomLeftCenterY = nodeY + halfHeight - cornerRadius
      arcIntersections = cyMath.intersectLineCircle(
              x1, y1, x2, y2,
              bottomLeftCenterX, bottomLeftCenterY, cornerRadius + padding);

      // Ensure the intersection is on the desired quarter of the circle
      if (arcIntersections.length > 0
              && arcIntersections[0] <= bottomLeftCenterX
              && arcIntersections[1] >= bottomLeftCenterY) {
        straightLineIntersections = straightLineIntersections.concat(arcIntersections);
      }
    }

    if (straightLineIntersections.length > 0)
      return straightLineIntersections;
    return []; // if nothing
  };

  $$.sbgn.intersectLineEllipse = function (
          x1, y1, x2, y2, centerX, centerY, width, height, padding) {

    var w = width / 2 + padding;
    var h = height / 2 + padding;
    var an = centerX;
    var bn = centerY;

    var d = [x2 - x1, y2 - y1];

    var m = d[1] / d[0];
    var n = -1 * m * x2 + y2;
    var a = h * h + w * w * m * m;
    var b = -2 * an * h * h + 2 * m * n * w * w - 2 * bn * m * w * w;
    var c = an * an * h * h + n * n * w * w - 2 * bn * w * w * n +
            bn * bn * w * w - h * h * w * w;

    var discriminant = b * b - 4 * a * c;

    if (discriminant < 0) {
      return [];
    }

    var t1 = (-b + Math.sqrt(discriminant)) / (2 * a);
    var t2 = (-b - Math.sqrt(discriminant)) / (2 * a);

    var xMin = Math.min(t1, t2);
    var xMax = Math.max(t1, t2);

    var yMin = m * xMin - m * x2 + y2;
    var yMax = m * xMax - m * x2 + y2;

    return [xMin, yMin, xMax, yMax];
  };

  $$.sbgn.intersectLineStateAndInfoBoxes = function (node, x, y) {
    var centerX = node._private.position.x;
    var centerY = node._private.position.y;
    var padding = parseInt(node.css('border-width')) / 2;

    var stateAndInfos = node._private.data.statesandinfos;

    var intersections = [];

    for (var i = 0; i < stateAndInfos.length; i++) {
      var state = stateAndInfos[i];

      if ( !state.isDisplayed ) {
        continue;
      }

      var infoBoxWidth = state.bbox.w;
      var infoBoxHeight = state.bbox.h;

      var currIntersections = null;

      if ( state.clazz == "state variable" ) {
        var coord = classes.StateVariable.getAbsoluteCoord(state, node.cy());
        currIntersections = $$.sbgn.intersectLineEllipse(x, y, centerX, centerY,
                coord.x, coord.y, infoBoxWidth, infoBoxHeight, padding);
      }
      else if ( state.clazz == "unit of information" ) {
        var coord = classes.UnitOfInformation.getAbsoluteCoord(state, node.cy());
        if (node.data("class") == "BA macromolecule" || node.data("class") == "BA nucleic acid feature"
                || node.data("class") == "BA complex"){
          currIntersections = $$.sbgn.roundRectangleIntersectLine(x, y, centerX, centerY,
                coord.x, coord.y, infoBoxWidth, infoBoxHeight, 5, padding);
        }
        else if (node.data("class") == "BA unspecified entity"){
          currIntersections = $$.sbgn.intersectLineEllipse(x, y, centerX, centerY,
              coord.x, coord.y, infoBoxWidth, infoBoxHeight, padding);
        }
        else if (node.data("class") == "BA simple chemical"){
          currIntersections = cyMath.intersectLineCircle(
              x, y,
              centerX, centerY,
              coord.x,
              coord.y,
              infoBoxWidth / 4);
        }
        else if (node.data("class") == "BA perturbing agent"){
          currIntersections = $$.sbgn.perturbingAgentIntersectLine(x, y, centerX, centerY,
              coord.x, coord.y, infoBoxWidth, infoBoxHeight, padding);
        }
        else {
          currIntersections = $$.sbgn.roundRectangleIntersectLine(x, y, centerX, centerY,
                  coord.x, coord.y, infoBoxWidth, infoBoxHeight, 0, padding);
        }
      }

      intersections = intersections.concat( currIntersections );

    }

    return intersections;
  };

  $$.sbgn.checkPointStateAndInfoBoxes = function (x, y, node, threshold) {
    return classes.AuxiliaryUnit.checkPoint(x, y, node, threshold);
  };

  $$.sbgn.isNodeShapeTotallyOverriden = function (render, node) {
    if (totallyOverridenNodeShapes[render.getNodeShape(node)]) {
      return true;
    }

    return false;
  };
};
