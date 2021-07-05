/*
 * Text utilities for common usage
 */

var textUtilities = {
  // same purpose as previous one, but with clearer responsibility
  truncate: function(text, font, width) {
    text = text + "";
    var context = document.createElement('canvas').getContext("2d");
    context.font = font;
    // check trivial case first, when entire text is already small enough
    if(context.measureText(text).width < width) {
      return text;
    }
    else {
      var ellipsis = "..";
      // if ellipsis alone is already too large
      if(context.measureText(ellipsis).width > width) {
        return "";
      }

      var finalLength; // this should always have a value after the loop
      for(var i=0; i < text.length; i++) {
        var subtext = text.substring(0, i) + ellipsis;
        if (context.measureText(subtext).width > width) { // we're too far, take the previous index
          finalLength = i > 0 ? i-1 : 0;
          break;
        }
      }
      return text.substring(0, finalLength) + ellipsis;
    }
  },

  // ensure that returned string follows xsd:ID standard
  // should follow r'^[a-zA-Z_][\w.-]*$'
  getXMLValidId: function(originalId) {
    var newId = "";
    var xmlValidRegex = /^[a-zA-Z_][\w.-]*$/;
    if (! xmlValidRegex.test(originalId)) { // doesn't comply
      newId = originalId;
      newId = newId.replace(/[^\w.-]/g, "");
      if (! xmlValidRegex.test(newId)) { // still doesn't comply
        newId = "_" + newId;
        if (! xmlValidRegex.test(newId)) { // normally we should never enter this
          // if for some obscure reason we still don't comply, throw error.
          throw new Error("Can't make identifer comply to xsd:ID requirements: "+newId);
        }
      }
      return newId;
    }
    else {
      return originalId;
    }
  },

  getWidthByContent( content, fontFamily, fontSize, options ) {
    var DEFAULT_MARGIN = 5;
    var lines = content.split("\n");
    var context = document.createElement('canvas').getContext('2d');
    // should not make type check so '===' should not be used here
    var shouldAppend = parseFloat( fontSize ) == fontSize;
    var validFontSize = shouldAppend ? fontSize + 'px' : fontSize;
    context.font = validFontSize + ' ' + fontFamily;

    var width = 0;

    lines.forEach( function( line ) {
      var w = context.measureText(line).width;
      if ( w > width ) {
        width = w;
      }
    });

    var margin = options && options.margin;
    if ( margin == null ) {
      margin = DEFAULT_MARGIN;
    }

    width += 2 * margin;

    var min = options && options.min;
    var max = options && options.max;

    if ( min != null && width < min ) {
      width = min;
    }
    else if ( max != null && width > max ) {
      width = max;
    }

    return width;
  },

  FromKebabToCamelCase : function(input){
    return input.replace(/(-\w)/g, function(m){
      return m[1].toUpperCase();
    });
  },

  FromCamelToKebabCase : function(input){
    return input.replace(/[\w]([A-Z])/g, function(m) {
      return m[0] + "-" + m[1];
    }).toLowerCase();
  }

};

module.exports = textUtilities;
