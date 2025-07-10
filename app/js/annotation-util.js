/**
 * Utilities for the annotation layer system
 */

var AnnotationUtil = function() {
  var self = this;
  
  /**
   * Default styles for annotation elements
   */
  var defaultStyles = {
    rectangle: {
      strokeColor: '#000000',
      fillColor: 'rgba(255, 255, 0, 0.3)',
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

    var rectStyles = Object.assign({}, defaultStyles.rectangle, styles || {});
    
    var { x, y, width, height } = data;
    if (x === undefined || y === undefined || width === undefined || height === undefined) {
      console.error('Missing required rectangle properties:', data);
      return false;
    }

    try {
      ctx.save();
      
      ctx.strokeStyle = rectStyles.strokeColor;
      ctx.lineWidth = rectStyles.lineWidth;
      ctx.setLineDash(rectStyles.lineDash);
      
      ctx.fillStyle = rectStyles.fillColor;
      
      ctx.fillRect(x, y, width, height);
      ctx.strokeRect(x, y, width, height);
      
      ctx.restore();
      
      return true;
    } catch (error) {
      console.error('Error drawing rectangle:', error);
      return false;
    }
  };

  /**
   * Draw selection handles around a rectangle
   * @param {CanvasRenderingContext2D} ctx - The canvas context
   * @param {Object} rectData - Rectangle data
   * @param {number} handleSize - Size of the selection handles
   */
  self.drawSelectionHandles = function(ctx, rectData, handleSize = 8) {
    if (!ctx || !rectData) return false;
    
    var { x, y, width, height } = rectData;
    var halfHandle = handleSize / 2;
    
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#0066cc';
    ctx.lineWidth = 2;
    
    var corners = [
      { x: x, y: y },
      { x: x + width, y: y },
      { x: x + width, y: y + height },
      { x: x, y: y + height }
    ];
    
    var edges = [
      { x: x + width/2, y: y },
      { x: x + width, y: y + height/2 },
      { x: x + width/2, y: y + height },
      { x: x, y: y + height/2 }
    ];
    
    var allHandles = corners.concat(edges);
    allHandles.forEach(function(handle) {
      ctx.fillRect(handle.x - halfHandle, handle.y - halfHandle, handleSize, handleSize);
      ctx.strokeRect(handle.x - halfHandle, handle.y - halfHandle, handleSize, handleSize);
    });
    
    ctx.restore();
    return true;
  };

  /**
   * Check if a point is inside a rectangle
   * @param {number} pointX - X coordinate of the point
   * @param {number} pointY - Y coordinate of the point
   * @param {Object} rectData - Rectangle data
   * @returns {boolean} True if point is inside rectangle
   */
  self.isPointInRectangle = function(pointX, pointY, rectData) {
    if (!rectData) return false;
    
    var { x, y, width, height } = rectData;
    return pointX >= x && pointX <= x + width && 
           pointY >= y && pointY <= y + height;
  };

  /**
   * Get the handle type at a given point
   * @param {number} pointX - X coordinate of the point
   * @param {number} pointY - Y coordinate of the point
   * @param {Object} rectData - Rectangle data
   * @param {number} handleSize - Size of the selection handles
   * @returns {string|null} Handle type or null if not on a handle
   */
  self.getHandleAtPoint = function(pointX, pointY, rectData, handleSize = 8) {
    if (!rectData) return null;
    
    var { x, y, width, height } = rectData;
    var halfHandle = handleSize / 2;
    
    var corners = [
      { type: 'top-left', x: x, y: y },
      { type: 'top-right', x: x + width, y: y },
      { type: 'bottom-right', x: x + width, y: y + height },
      { type: 'bottom-left', x: x, y: y + height }
    ];
    
    var edges = [
      { type: 'top', x: x + width/2, y: y },
      { type: 'right', x: x + width, y: y + height/2 },
      { type: 'bottom', x: x + width/2, y: y + height },
      { type: 'left', x: x, y: y + height/2 }
    ];
    
    var allHandles = corners.concat(edges);
    
    for (var i = 0; i < allHandles.length; i++) {
      var handle = allHandles[i];
      if (pointX >= handle.x - halfHandle && pointX <= handle.x + halfHandle &&
          pointY >= handle.y - halfHandle && pointY <= handle.y + halfHandle) {
        return handle.type;
      }
    }
    
    return null;
  };

  /**
   * Calculate new rectangle dimensions when resizing
   * @param {string} handleType - Type of handle being dragged
   * @param {Object} originalRect - Original rectangle data
   * @param {number} newX - New X coordinate
   * @param {number} newY - New Y coordinate
   * @returns {Object} Updated rectangle data
   */
  self.calculateResizedRectangle = function(handleType, originalRect, newX, newY) {
    var { x, y, width, height } = originalRect;
    var newRect = { x: x, y: y, width: width, height: height };
    
    switch (handleType) {
      case 'top-left':
        newRect.width = x + width - newX;
        newRect.height = y + height - newY;
        newRect.x = newX;
        newRect.y = newY;
        break;
      case 'top-right':
        newRect.width = newX - x;
        newRect.height = y + height - newY;
        newRect.y = newY;
        break;
      case 'bottom-right':
        newRect.width = newX - x;
        newRect.height = newY - y;
        break;
      case 'bottom-left':
        newRect.width = x + width - newX;
        newRect.height = newY - y;
        newRect.x = newX;
        break;
      case 'top':
        newRect.height = y + height - newY;
        newRect.y = newY;
        break;
      case 'right':
        newRect.width = newX - x;
        break;
      case 'bottom':
        newRect.height = newY - y;
        break;
      case 'left':
        newRect.width = x + width - newX;
        newRect.x = newX;
        break;
    }
    
    newRect.width = Math.max(newRect.width, 10);
    newRect.height = Math.max(newRect.height, 10);
    
    return newRect;
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
   * Draw a text box on the canvas
   * @param {CanvasRenderingContext2D} ctx - The canvas context
   * @param {Object} data - Text box data
   * @param {number} data.x - X coordinate of top-left corner
   * @param {number} data.y - Y coordinate of top-left corner
   * @param {number} data.width - Width of the text box
   * @param {number} data.height - Height of the text box
   * @param {string} data.text - Text content
   * @param {Object} [styles] - Custom styles for the text box
   */
  self.drawTextBox = function(ctx, data, styles) {
    if (!ctx || !data) {
      console.error('Invalid canvas context or data for text box drawing');
      return false;
    }

    var textStyles = Object.assign({}, defaultStyles.text, styles || {});
    
    var { x, y, width, height, text } = data;
    if (x === undefined || y === undefined || width === undefined || height === undefined) {
      console.error('Missing required text box properties:', data);
      return false;
    }

    try {
      ctx.save();
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.fillRect(x, y, width, height);
      ctx.strokeRect(x, y, width, height);
      
      if (text && text.trim()) {
        ctx.fillStyle = textStyles.color;
        ctx.font = textStyles.fontSize + 'px ' + textStyles.fontFamily;
        ctx.textBaseline = 'top';
        
        var textX = x + 5;
        var textY = y + 5;
        
        var maxWidth = width - 10;
        var words = text.split(' ');
        var lines = [];
        var currentLine = '';
        
        for (var i = 0; i < words.length; i++) {
          var testLine = currentLine + (currentLine ? ' ' : '') + words[i];
          var testWidth = ctx.measureText(testLine).width;
          
          if (testWidth > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = words[i];
          } else {
            currentLine = testLine;
          }
        }
        if (currentLine) {
          lines.push(currentLine);
        }
        
        var lineHeight = textStyles.fontSize + 2;
        for (var j = 0; j < lines.length; j++) {
          if (textY + j * lineHeight + lineHeight <= y + height) {
            ctx.fillText(lines[j], textX, textY + j * lineHeight);
          } else {
            break;
          }
        }
      }
      
      ctx.restore();
      
      return true;
    } catch (error) {
      console.error('Error drawing text box:', error);
      return false;
    }
  };

  /**
   * Draw selection handles around a text box
   * @param {CanvasRenderingContext2D} ctx - The canvas context
   * @param {Object} textBoxData - Text box data
   * @param {number} handleSize - Size of the selection handles
   */
  self.drawTextBoxSelectionHandles = function(ctx, textBoxData, handleSize = 8) {
    if (!ctx || !textBoxData) return false;
    
    var { x, y, width, height } = textBoxData;
    var halfHandle = handleSize / 2;
    
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#0066cc';
    ctx.lineWidth = 2;
    
    var corners = [
      { x: x, y: y },
      { x: x + width, y: y },
      { x: x + width, y: y + height },
      { x: x, y: y + height }
    ];
    
    var edges = [
      { x: x + width/2, y: y },
      { x: x + width, y: y + height/2 },
      { x: x + width/2, y: y + height },
      { x: x, y: y + height/2 }
    ];
    
    var allHandles = corners.concat(edges);
    allHandles.forEach(function(handle) {
      ctx.fillRect(handle.x - halfHandle, handle.y - halfHandle, handleSize, handleSize);
      ctx.strokeRect(handle.x - halfHandle, handle.y - halfHandle, handleSize, handleSize);
    });
    
    ctx.restore();
    return true;
  };

  /**
   * Check if a point is inside a text box
   * @param {number} pointX - X coordinate of the point
   * @param {number} pointY - Y coordinate of the point
   * @param {Object} textBoxData - Text box data
   * @returns {boolean} True if point is inside text box
   */
  self.isPointInTextBox = function(pointX, pointY, textBoxData) {
    if (!textBoxData) return false;
    
    var { x, y, width, height } = textBoxData;
    return pointX >= x && pointX <= x + width && 
           pointY >= y && pointY <= y + height;
  };

  /**
   * Create text box data from mouse coordinates
   * @param {number} startX - Starting X coordinate
   * @param {number} startY - Starting Y coordinate
   * @param {number} endX - Ending X coordinate
   * @param {number} endY - Ending Y coordinate
   * @returns {Object} Text box data object
   */
  self.createTextBoxData = function(startX, startY, endX, endY) {
    var x = Math.min(startX, endX);
    var y = Math.min(startY, endY);
    var width = Math.abs(endX - startX);
    var height = Math.abs(endY - startY);
    
    return {
      type: 'textbox',
      x: x,
      y: y,
      width: width,
      height: height,
      text: 'Double-click to edit',
      id: 'textbox_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
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
    
    self.clearCanvas(ctx);
    
    elements.forEach(function(element) {
      switch (element.type) {
        case 'rectangle':
          self.drawRectangle(ctx, element, element.styles);
          break;
        default:
          console.warn('Unknown element type:', element.type);
      }
    });
    
    return true;
  };

  return {
    drawRectangle: self.drawRectangle,
    drawTextBox: self.drawTextBox,
    createRectangleData: self.createRectangleData,
    createTextBoxData: self.createTextBoxData,
    getCanvasCoordinates: self.getCanvasCoordinates,
    resizeCanvas: self.resizeCanvas,
    clearCanvas: self.clearCanvas,
    redrawLayer: self.redrawLayer,
    drawSelectionHandles: self.drawSelectionHandles,
    drawTextBoxSelectionHandles: self.drawTextBoxSelectionHandles,
    isPointInRectangle: self.isPointInRectangle,
    isPointInTextBox: self.isPointInTextBox,
    getHandleAtPoint: self.getHandleAtPoint,
    calculateResizedRectangle: self.calculateResizedRectangle,
    defaultStyles: defaultStyles
  };
};

module.exports = new AnnotationUtil(); 