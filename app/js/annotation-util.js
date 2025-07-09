/**
 * Annotation Utilities
 * 
 * This module contains utility functions for drawing various annotation elements
 * on HTML5 canvas elements. It provides reusable drawing functions that can be
 * called from the annotation layers system.
 * 
 * @author Newt Editor
 */

var AnnotationUtil = function() {
  var self = this;
  
  /**
   * Default styles for annotation elements
   */
  var defaultStyles = {
    rectangle: {
      strokeColor: '#000000',
      fillColor: 'rgba(255, 255, 0, 0.3)', // Semi-transparent yellow
      lineWidth: 2,
      lineDash: []
    },
    text: {
      fontSize: 14,
      fontFamily: 'Arial, sans-serif',
      color: '#000000'
    },
    arrow: {
      strokeColor: '#000000',
      lineWidth: 2,
      headSize: 10
    }
  };

  /**
   * Draw a rectangle on the canvas
   * @param {CanvasRenderingContext2D} ctx - The canvas context
   * @param {Object} data - Rectangle data
   * @param {number} data.x - X coordinate of top-left corner
   * @param {number} data.y - Y coordinate of top-left corner
   * @param {number} data.width - Width of the rectangle
   * @param {number} data.height - Height of the rectangle
   * @param {Object} [styles] - Custom styles for the rectangle
   */
  self.drawRectangle = function(ctx, data, styles) {
    if (!ctx || !data) {
      console.error('Invalid canvas context or data for rectangle drawing');
      return false;
    }

    // Merge custom styles with defaults
    var rectStyles = Object.assign({}, defaultStyles.rectangle, styles || {});
    
    // Validate required properties
    var { x, y, width, height } = data;
    if (x === undefined || y === undefined || width === undefined || height === undefined) {
      console.error('Missing required rectangle properties:', data);
      return false;
    }

    try {
      ctx.save();
      
      // Set stroke style
      ctx.strokeStyle = rectStyles.strokeColor;
      ctx.lineWidth = rectStyles.lineWidth;
      ctx.setLineDash(rectStyles.lineDash);
      
      // Set fill style
      ctx.fillStyle = rectStyles.fillColor;
      
      // Draw the rectangle
      ctx.fillRect(x, y, width, height);
      ctx.strokeRect(x, y, width, height);
      
      ctx.restore();
      
      console.log('Rectangle drawn:', data, rectStyles);
      return true;
    } catch (error) {
      console.error('Error drawing rectangle:', error);
      return false;
    }
  };

  /**
   * Create rectangle data from mouse coordinates
   * @param {number} startX - Starting X coordinate
   * @param {number} startY - Starting Y coordinate
   * @param {number} endX - Ending X coordinate
   * @param {number} endY - Ending Y coordinate
   * @returns {Object} Rectangle data object
   */
  self.createRectangleData = function(startX, startY, endX, endY) {
    var x = Math.min(startX, endX);
    var y = Math.min(startY, endY);
    var width = Math.abs(endX - startX);
    var height = Math.abs(endY - startY);
    
    return {
      type: 'rectangle',
      x: x,
      y: y,
      width: width,
      height: height,
      id: 'rect_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date()
    };
  };

  /**
   * Get canvas coordinates from mouse event
   * @param {HTMLCanvasElement} canvas - The canvas element
   * @param {MouseEvent} event - The mouse event
   * @returns {Object} Coordinates object with x and y properties
   */
  self.getCanvasCoordinates = function(canvas, event) {
    var rect = canvas.getBoundingClientRect();
    var scaleX = canvas.width / rect.width;
    var scaleY = canvas.height / rect.height;
    
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY
    };
  };

  /**
   * Resize canvas to match its container
   * @param {HTMLCanvasElement} canvas - The canvas element
   * @returns {boolean} Success status
   */
  self.resizeCanvas = function(canvas) {
    try {
      var container = canvas.parentElement;
      if (!container) return false;
      
      var rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      
      return true;
    } catch (error) {
      console.error('Error resizing canvas:', error);
      return false;
    }
  };

  /**
   * Clear the entire canvas
   * @param {CanvasRenderingContext2D} ctx - The canvas context
   */
  self.clearCanvas = function(ctx) {
    if (!ctx || !ctx.canvas) return false;
    
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    return true;
  };

  /**
   * Redraw all elements in a layer
   * @param {CanvasRenderingContext2D} ctx - The canvas context
   * @param {Array} elements - Array of annotation elements
   */
  self.redrawLayer = function(ctx, elements) {
    if (!ctx || !Array.isArray(elements)) return false;
    
    // Clear the canvas first
    self.clearCanvas(ctx);
    
    // Redraw each element
    elements.forEach(function(element) {
      switch (element.type) {
        case 'rectangle':
          self.drawRectangle(ctx, element, element.styles);
          break;
        // Future cases for other element types will go here
        default:
          console.warn('Unknown element type:', element.type);
      }
    });
    
    return true;
  };

  return {
    drawRectangle: self.drawRectangle,
    createRectangleData: self.createRectangleData,
    getCanvasCoordinates: self.getCanvasCoordinates,
    resizeCanvas: self.resizeCanvas,
    clearCanvas: self.clearCanvas,
    redrawLayer: self.redrawLayer,
    defaultStyles: defaultStyles
  };
};

module.exports = new AnnotationUtil(); 