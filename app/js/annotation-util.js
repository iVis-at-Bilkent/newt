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
      strokeColor: 'rgba(128,0,128,1)',
      fillColor: 'rgba(255,255,255,0.6)',
      lineWidth: 2,
      lineDash: []
    },
    text: {
      fontSize: 14,
      fontFamily: 'Arial, sans-serif',
      color: 'rgba(0,0,0,1)',
      fillColor: 'rgba(255,255,255,0.6)'
    },
    arrow: {
      strokeColor: 'rgba(255,0,0,1)',
      lineWidth: 7,
      headSize: 20,
    },
    image: {
      strokeColor: 'rgba(0,102,204,1)',
      lineWidth: 2,
      lineDash: [5, 5]
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
    // Patch for github issue #867
    if (data.styles) {
      ['lineDash', 'lineWidth'].forEach(key => delete data.styles[key]);
    }
    var { x, y, width, height } = data;
    if (x === undefined || y === undefined || width === undefined || height === undefined) {
      console.error('Missing required rectangle properties:', data);
      return false;
    }

    try {
      ctx.save();
      
      ctx.strokeStyle = rectStyles.strokeColor;
      
      var lineWidth = rectStyles.lineWidth || 2;
      var zoom = 1;
      
      if (typeof window.annotationLayers !== 'undefined' && window.annotationLayers.getViewportState) {
        var viewportState = window.annotationLayers.getViewportState();
        if (viewportState && viewportState.zoom) {
          zoom = viewportState.zoom;
        }
      }
      
      var scaledLineWidth = lineWidth * zoom;
      ctx.lineWidth = scaledLineWidth;
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
    ctx.fillStyle = 'rgba(255,255,255,1)';
    ctx.strokeStyle = 'rgba(0,102,204,1)';
    
    // Scale line width by zoom level if available
    var lineWidth = 2;
    var zoom = 1;
    
    if (typeof window.annotationLayers !== 'undefined' && window.annotationLayers.getViewportState) {
      var viewportState = window.annotationLayers.getViewportState();
      if (viewportState && viewportState.zoom) {
        zoom = viewportState.zoom;
      }
    }
    
    var scaledLineWidth = lineWidth * zoom;
    ctx.lineWidth = scaledLineWidth;
    
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
      styles: Object.assign({}, defaultStyles.rectangle),
      id: 'rect_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date()
    };
  };

  /**
   * Draw a text box on the canvas
   * @param {CanvasRenderingContext2D} ctx - The canvas context
   * @param {Object} data - Text box data
   * @param {Object} [styles] - Custom styles for the text box
   * @param {number} [exportScale] - Optional export scale override (for PNG/JPG exports)
   */
  self.drawTextBox = function(ctx, data, styles, exportScale) {
    if (!ctx || !data) {
      console.error('Invalid canvas context or data for text box drawing');
      return false;
    }

    var textBoxStyles = Object.assign({}, defaultStyles.text, styles || {});
    
    var { x, y, width, height, text } = data;
    if (x === undefined || y === undefined || width === undefined || height === undefined) {
      console.error('Missing required text box properties:', data);
      return false;
    }

    var fillColor = textBoxStyles.fillColor || 'rgba(255,255,255,0.6)';
    var borderColor = textBoxStyles.strokeColor || 'rgba(128,0,128,1)';

    try {
      ctx.save();
      ctx.fillStyle = fillColor;
      ctx.fillRect(x, y, width, height);
      ctx.strokeStyle = borderColor;
      
      var lineWidth = 1;
      var scale = 1;
      
      // Use exportScale if provided (for PNG/JPG exports), otherwise use viewport zoom
      if (exportScale !== undefined) {
        scale = exportScale;
      } else if (typeof window.annotationLayers !== 'undefined' && window.annotationLayers.getViewportState) {
        var viewportState = window.annotationLayers.getViewportState();
        if (viewportState && viewportState.zoom) {
          scale = viewportState.zoom;
        }
      }
      
      var scaledLineWidth = lineWidth * scale;
      ctx.lineWidth = scaledLineWidth;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(x, y, width, height);
      if (text && text.trim()) {
        ctx.fillStyle = textBoxStyles.color;
        
        var fontSize = textBoxStyles.fontSize || 12;
        var scaledFontSize = fontSize * scale;
        
        ctx.font = (textBoxStyles.fontStyle || 'normal') + ' ' +
                   (textBoxStyles.fontWeight || 'normal') + ' ' +
                   scaledFontSize + 'px ' +
                   textBoxStyles.fontFamily;
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
        var lineHeight = scaledFontSize + 2;
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
    ctx.fillStyle = 'rgba(255,255,255,1)';
    ctx.strokeStyle = 'rgba(0,102,204,1)';
    
    // Scale line width by zoom level if available
    var lineWidth = 2;
    var zoom = 1;
    
    if (typeof window.annotationLayers !== 'undefined' && window.annotationLayers.getViewportState) {
      var viewportState = window.annotationLayers.getViewportState();
      if (viewportState && viewportState.zoom) {
        zoom = viewportState.zoom;
      }
    }
    
    var scaledLineWidth = lineWidth * zoom;
    ctx.lineWidth = scaledLineWidth;
    
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
      styles: Object.assign({}, defaultStyles.text, { fillColor: 'rgba(255,255,255,0.6)', strokeColor: 'rgba(0,153,255,1)' }),
      id: 'textbox_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date()
    };
  };

  /**
   * Draw an arrow on the canvas
   * @param {CanvasRenderingContext2D} ctx - The canvas context
   * @param {Object} data - Arrow data
   * @param {number} data.startX - X coordinate of arrow start
   * @param {number} data.startY - Y coordinate of arrow start
   * @param {number} data.endX - X coordinate of arrow end
   * @param {number} data.endY - Y coordinate of arrow end
   * @param {Object} [styles] - Custom styles for the arrow
   */
  self.drawArrow = function(ctx, data, styles) {
    if (!ctx || !data) {
      console.error('Invalid canvas context or data for arrow drawing');
      return false;
    }

    var arrowStyles = Object.assign({}, defaultStyles.arrow, styles || {});
    
    var { startX, startY, endX, endY } = data;
    if (startX === undefined || startY === undefined || endX === undefined || endY === undefined) {
      console.error('Missing required arrow properties:', data);
      return false;
    }

    try {
      ctx.save();
      
      ctx.strokeStyle = arrowStyles.strokeColor;
      
      // Scale line width and head size by zoom level if available
      var lineWidth = arrowStyles.lineWidth || 7;
      var headSize = arrowStyles.headSize || 20;
      var zoom = 1;
      
      if (typeof window.annotationLayers !== 'undefined' && window.annotationLayers.getViewportState) {
        var viewportState = window.annotationLayers.getViewportState();
        if (viewportState && viewportState.zoom) {
          zoom = viewportState.zoom;
        }
      }
      
      var scaledLineWidth = lineWidth * zoom;
      var scaledHeadSize = headSize * zoom;
      
      ctx.lineWidth = scaledLineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      
      var angle = Math.atan2(endY - startY, endX - startX);
      var headLength = scaledHeadSize;
      
      var headAngle1 = angle - Math.PI / 6;
      var headAngle2 = angle + Math.PI / 6;
      
      var head1X = endX - headLength * Math.cos(headAngle1);
      var head1Y = endY - headLength * Math.sin(headAngle1);
      var head2X = endX - headLength * Math.cos(headAngle2);
      var head2Y = endY - headLength * Math.sin(headAngle2);
      
      ctx.beginPath();
      ctx.moveTo(endX, endY);
      ctx.lineTo(head1X, head1Y);
      ctx.moveTo(endX, endY);
      ctx.lineTo(head2X, head2Y);
      ctx.stroke();
      
      ctx.restore();
      
      return true;
    } catch (error) {
      console.error('Error drawing arrow:', error);
      return false;
    }
  };

  /**
   * Draw selection handles for an arrow (head and tail)
   * @param {CanvasRenderingContext2D} ctx - The canvas context
   * @param {Object} arrowData - Arrow data
   * @param {number} handleSize - Size of the selection handles
   */
  self.drawArrowSelectionHandles = function(ctx, arrowData, handleSize = 8) {
    if (!ctx || !arrowData) return false;
    
    var { startX, startY, endX, endY } = arrowData;
    var halfHandle = handleSize / 2;
    
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,1)';
    ctx.strokeStyle = 'rgba(0,102,204,1)';
    
    var lineWidth = 2;
    var zoom = 1;
    
    if (typeof window.annotationLayers !== 'undefined' && window.annotationLayers.getViewportState) {
      var viewportState = window.annotationLayers.getViewportState();
      if (viewportState && viewportState.zoom) {
        zoom = viewportState.zoom;
      }
    }
    
    var scaledLineWidth = lineWidth * zoom;
    ctx.lineWidth = scaledLineWidth;
    
    // Draw handles at start and end points
    var handles = [
      { x: startX, y: startY, type: 'tail' },
      { x: endX, y: endY, type: 'head' }
    ];
    
    handles.forEach(function(handle) {
      ctx.fillRect(handle.x - halfHandle, handle.y - halfHandle, handleSize, handleSize);
      ctx.strokeRect(handle.x - halfHandle, handle.y - halfHandle, handleSize, handleSize);
    });
    
    ctx.restore();
    return true;
  };

  /**
   * Check if a point is on an arrow (within a certain tolerance)
   * @param {number} pointX - X coordinate of the point
   * @param {number} pointY - Y coordinate of the point
   * @param {Object} arrowData - Arrow data
   * @param {number} tolerance - Distance tolerance for hit detection
   * @returns {boolean} True if point is on arrow
   */
  self.isPointOnArrow = function(pointX, pointY, arrowData, tolerance = 5) {
    if (!arrowData) return false;
    
    var { startX, startY, endX, endY } = arrowData;
    
    var A = pointX - startX;
    var B = pointY - startY;
    var C = endX - startX;
    var D = endY - startY;
    
    var dot = A * C + B * D;
    var lenSq = C * C + D * D;
    
    if (lenSq === 0) return false;
    
    var param = dot / lenSq;
    
    var xx, yy;
    if (param < 0) {
      xx = startX;
      yy = startY;
    } else if (param > 1) {
      xx = endX;
      yy = endY;
    } else {
      xx = startX + param * C;
      yy = startY + param * D;
    }
    
    var dx = pointX - xx;
    var dy = pointY - yy;
    var distance = Math.sqrt(dx * dx + dy * dy);
    
    return distance <= tolerance;
  };

  /**
   * Get the handle type at a given point for an arrow
   * @param {number} pointX - X coordinate of the point
   * @param {number} pointY - Y coordinate of the point
   * @param {Object} arrowData - Arrow data
   * @param {number} handleSize - Size of the selection handles
   * @returns {string|null} Handle type ('head', 'tail') or null if not on a handle
   */
  self.getArrowHandleAtPoint = function(pointX, pointY, arrowData, handleSize = 8) {
    if (!arrowData) return null;
    
    var { startX, startY, endX, endY } = arrowData;
    var halfHandle = handleSize / 2;
    
    var handles = [
      { type: 'tail', x: startX, y: startY },
      { type: 'head', x: endX, y: endY }
    ];
    
    for (var i = 0; i < handles.length; i++) {
      var handle = handles[i];
      if (pointX >= handle.x - halfHandle && pointX <= handle.x + halfHandle &&
          pointY >= handle.y - halfHandle && pointY <= handle.y + halfHandle) {
        return handle.type;
      }
    }
    
    return null;
  };

  /**
   * Create arrow data from mouse coordinates
   * @param {number} startX - Starting X coordinate
   * @param {number} startY - Starting Y coordinate
   * @param {number} endX - Ending X coordinate
   * @param {number} endY - Ending Y coordinate
   * @returns {Object} Arrow data object
   */
  self.createArrowData = function(startX, startY, endX, endY) {
    return {
      type: 'arrow',
      startX: startX,
      startY: startY,
      endX: endX,
      endY: endY,
      styles: Object.assign({}, defaultStyles.arrow),
      id: 'arrow_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date()
    };
  };

  /**
   * Draw an image on the canvas
   * @param {CanvasRenderingContext2D} ctx - The canvas context
   * @param {Object} data - Image data
   * @param {number} data.x - X coordinate of top-left corner
   * @param {number} data.y - Y coordinate of top-left corner
   * @param {number} data.width - Width of the image
   * @param {number} data.height - Height of the image
   * @param {string} data.imageData - Image data path
   * @param {Object} [styles] - Custom styles for the image
   */
  self.drawImage = function(ctx, data, styles) {
    if (!ctx || !data) {
      console.error('Invalid canvas context or data for image drawing');
      return false;
    }

    var imageStyles = Object.assign({}, defaultStyles.image, styles || {});
    
    var { x, y, width, height, imageData } = data;
    if (x === undefined || y === undefined || width === undefined || height === undefined || !imageData) {
      console.error('Missing required image properties:', data);
      return false;
    }

    try {
      ctx.save();
      
      // Create image element if not already created
      if (!data._imageElement) {
        data._imageElement = new Image();
        data._imageElement.onload = function() {
          // Redraw the layer when image loads
          if (data._redrawCallback) {
            data._redrawCallback();
          } else {
            var canvas = ctx.canvas;
            if (canvas) {
              var layerId = canvas.id.match(/annotation-canvas-layer-(\d+)/);
              if (layerId && window.annotationLayers) {
                window.annotationLayers.redrawLayer(parseInt(layerId[1]));
              }
            }
          }
        };
        data._imageElement.onerror = function(e) {
          console.error('Error loading image for element:', data.id, e);
          if (!data._retryCount) {
            data._retryCount = 1;
            setTimeout(function() {
              console.log('Retrying image load for element:', data.id);
              data._imageElement = null; // Force recreation
              if (data._redrawCallback) {
                data._redrawCallback();
              }
            }, 1000);
          } else {
            console.error('Image failed to load after retry for element:', data.id);
          }
        };
        data._imageElement.src = imageData;
      }
      
      // Draw the image
      if (data._imageElement.complete && data._imageElement.naturalWidth > 0) {
        ctx.drawImage(data._imageElement, x, y, width, height);
      } else {
        // Draw placeholder while image is loading
        ctx.strokeStyle = imageStyles.strokeColor;
        
        // Scale line width by zoom level if available
        var lineWidth = imageStyles.lineWidth || 2;
        var zoom = 1;
        
        if (typeof window.annotationLayers !== 'undefined' && window.annotationLayers.getViewportState) {
          var viewportState = window.annotationLayers.getViewportState();
          if (viewportState && viewportState.zoom) {
            zoom = viewportState.zoom;
          }
        }
        
        var scaledLineWidth = lineWidth * zoom;
        ctx.lineWidth = scaledLineWidth;
        ctx.setLineDash(imageStyles.lineDash);
        ctx.strokeRect(x, y, width, height);
        
        ctx.fillStyle = 'rgba(102,102,102,1)'; 
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Loading...', x + width/2, y + height/2);
      }
      
      ctx.restore();
      
      return true;
    } catch (error) {
      console.error('Error drawing image:', error);
      return false;
    }
  };

  /**
   * Draw selection handles around an image
   * @param {CanvasRenderingContext2D} ctx - The canvas context
   * @param {Object} imageData - Image data
   * @param {number} handleSize - Size of the selection handles
   */
  self.drawImageSelectionHandles = function(ctx, imageData, handleSize = 8) {
    if (!ctx || !imageData) return false;
    
    var { x, y, width, height } = imageData;
    var halfHandle = handleSize / 2;
    
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,1)';
    ctx.strokeStyle = 'rgba(0,102,204,1)';
    
    var lineWidth = 2;
    var zoom = 1;
    
    if (typeof window.annotationLayers !== 'undefined' && window.annotationLayers.getViewportState) {
      var viewportState = window.annotationLayers.getViewportState();
      if (viewportState && viewportState.zoom) {
        zoom = viewportState.zoom;
      }
    }
    
    var scaledLineWidth = lineWidth * zoom;
    ctx.lineWidth = scaledLineWidth;
    
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
   * Check if a point is inside an image
   * @param {number} pointX - X coordinate of the point
   * @param {number} pointY - Y coordinate of the point
   * @param {Object} imageData - Image data
   * @returns {boolean} True if point is inside image
   */
  self.isPointInImage = function(pointX, pointY, imageData) {
    if (!imageData) return false;
    
    var { x, y, width, height } = imageData;
    return pointX >= x && pointX <= x + width && 
           pointY >= y && pointY <= y + height;
  };

  /**
   * Create image data from mouse coordinates and file
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {File} file - Image file
   * @returns {Object} Image data object
   */
  self.createImageData = function(x, y, file) {
    return {
      type: 'image',
      x: x,
      y: y,
      width: 100, // Default width
      height: 100, // Default height
      imageData: null, // Will be set when file is processed
      originalFile: file,
      styles: Object.assign({}, defaultStyles.image),
      id: 'image_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date()
    };
  };

  /**
   * Process image file and convert to data URL
   * @param {File} file - Image file
   * @param {Function} callback - Callback function with data URL
   */
  self.processImageFile = function(file, callback) {
    if (!file || !file.type.startsWith('image/')) {
      console.error('Invalid image file:', file);
      callback(null);
      return;
    }

    var reader = new FileReader();
    reader.onload = function(e) {
      callback(e.target.result);
    };
    reader.onerror = function() {
      console.error('Error reading image file');
      callback(null);
    };
    reader.readAsDataURL(file);
  };

  /**
   * Update arrow position when dragging a handle
   * @param {Object} arrowData - Original arrow data
   * @param {string} handleType - Type of handle being dragged ('head' or 'tail')
   * @param {number} newX - New X coordinate
   * @param {number} newY - New Y coordinate
   * @returns {Object} Updated arrow data
   */
  self.updateArrowPosition = function(arrowData, handleType, newX, newY) {
    var updatedArrow = Object.assign({}, arrowData);
    
    if (handleType === 'head') {
      updatedArrow.endX = newX;
      updatedArrow.endY = newY;
    } else if (handleType === 'tail') {
      updatedArrow.startX = newX;
      updatedArrow.startY = newY;
    }
    
    return updatedArrow;
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
        case 'textbox':
          self.drawTextBox(ctx, element, element.styles);
          break;
        case 'arrow':
          self.drawArrow(ctx, element, element.styles);
          break;
        case 'image':
          self.drawImage(ctx, element, element.styles);
          break;
        default:
          console.warn('Unknown element type:', element.type);
      }
    });
    
    return true;
  };

  /**
   * Convert an annotation element to SVG
   * @param {Object} element - The annotation element
   * @param {Document} svgDoc - The SVG document to create elements in
   * @param {number} [scale=1] - Scale factor for font size (used for export)
   * @returns {SVGElement|null}
   */
  self.elementToSvg = function(element, svgDoc, scale) {
    var svgNS = 'http://www.w3.org/2000/svg';
    var xlinkNS = 'http://www.w3.org/1999/xlink';
    if (!element || !svgDoc) return null;
    
    // Default scale to 1 if not provided
    scale = scale || 1;
    
    // Helper function to handle RGBA colors properly for SVG
    function setSvgColor(element, attrName, colorValue) {
      if (colorValue && colorValue.indexOf('rgba') !== -1) {
        // Separate alpha value, since some SVG viewers can't handle rgba
        var regex = /rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d?\.?\d*)\s*\)/gi;
        var matches = regex.exec(colorValue);
        if (matches) {
          element.setAttribute(attrName, 'rgb(' + matches[1] + ',' + matches[2] + ',' + matches[3] + ')');
          element.setAttribute(attrName + '-opacity', matches[4]);
        } else {
          element.setAttribute(attrName, colorValue);
        }
      } else {
        element.setAttribute(attrName, colorValue);
      }
    }
    
    if (element.type === 'rectangle') {
      var rect = svgDoc.createElementNS(svgNS, 'rect');
      rect.setAttribute('x', element.x);
      rect.setAttribute('y', element.y);
      rect.setAttribute('width', element.width);
      rect.setAttribute('height', element.height);
      var styles = Object.assign({}, defaultStyles.rectangle, element.styles || {});
      setSvgColor(rect, 'stroke', styles.strokeColor || 'rgba(128,0,128,1)');
      rect.setAttribute('stroke-width', styles.lineWidth || 2);
      if (styles.lineDash && styles.lineDash.length > 0) {
        rect.setAttribute('stroke-dasharray', styles.lineDash.join(','));
      }
      setSvgColor(rect, 'fill', styles.fillColor || 'none');
      return rect;
    } else if (element.type === 'textbox') {
      var group = svgDoc.createElementNS(svgNS, 'g');
      var boxStyles = element.styles || {};
      var borderColor = boxStyles.strokeColor || 'rgba(0,153,255,1)';
      var fillColor = boxStyles.fillColor || 'rgba(255,255,255,0)';
      var rect = svgDoc.createElementNS(svgNS, 'rect');
      rect.setAttribute('x', element.x);
      rect.setAttribute('y', element.y);
      rect.setAttribute('width', element.width);
      rect.setAttribute('height', element.height);
      setSvgColor(rect, 'stroke', borderColor);
      rect.setAttribute('stroke-width', 1);
      setSvgColor(rect, 'fill', fillColor);
      rect.setAttribute('stroke-dasharray', '5,5');
      group.appendChild(rect);
      if (element.text && element.text.trim()) {
        var textStyles = Object.assign({}, defaultStyles.text, element.styles || {});
        var scaledFontSize = (textStyles.fontSize || 14) * scale;
        var textElem = svgDoc.createElementNS(svgNS, 'text');
        textElem.setAttribute('x', element.x + 5);
        // Match canvas textBaseline='top' positioning exactly
        textElem.setAttribute('y', element.y + 5);
        textElem.setAttribute('font-size', scaledFontSize);
        textElem.setAttribute('font-family', textStyles.fontFamily);
        textElem.setAttribute('font-weight', textStyles.fontWeight || 'normal');
        textElem.setAttribute('font-style', textStyles.fontStyle || 'normal');
        setSvgColor(textElem, 'fill', textStyles.color || 'rgba(0,0,0,1)');
        // Set dominant-baseline to 'hanging' to match canvas textBaseline='top'
        textElem.setAttribute('dominant-baseline', 'hanging');
        
        // Word wrap - match canvas logic exactly
        var maxWidth = element.width - 10;
        var words = element.text.split(' ');
        var lines = [];
        var currentLine = '';
        
        // Create a temporary SVG element for text measurement with exact same font settings
        var tempSvg = svgDoc.createElementNS(svgNS, 'text');
        tempSvg.setAttribute('font-size', scaledFontSize);
        tempSvg.setAttribute('font-family', textStyles.fontFamily);
        tempSvg.setAttribute('font-weight', textStyles.fontWeight || 'normal');
        tempSvg.setAttribute('font-style', textStyles.fontStyle || 'normal');
        tempSvg.setAttribute('dominant-baseline', 'hanging');
        
        // Helper function to measure text width reliably
        function measureTextWidth(text) {
          tempSvg.textContent = text;
          group.appendChild(tempSvg);
          var svgWidth = tempSvg.getComputedTextLength ? tempSvg.getComputedTextLength() : 0;
          group.removeChild(tempSvg);
          
          if (svgWidth <= 0) {
            var canvas = document.createElement('canvas');
            var ctx = canvas.getContext('2d');
            ctx.font = (textStyles.fontStyle || 'normal') + ' ' +
                      (textStyles.fontWeight || 'normal') + ' ' +
                      scaledFontSize + 'px ' +
                      textStyles.fontFamily;
            return ctx.measureText(text).width;
          }
          
          return svgWidth;
        }
        
        for (var i = 0; i < words.length; i++) {
          var testLine = currentLine + (currentLine ? ' ' : '') + words[i];
          var testWidth = measureTextWidth(testLine);
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
        
        var lineHeight = scaledFontSize + 2;
        for (var j = 0; j < lines.length; j++) {
          var lineY = element.y + 5 + j * lineHeight;
          if (lineY + lineHeight <= element.y + element.height) {
            var tspan = svgDoc.createElementNS(svgNS, 'tspan');
            tspan.setAttribute('x', element.x + 5);
            tspan.setAttribute('y', lineY);
            tspan.textContent = lines[j];
            textElem.appendChild(tspan);
          } else {
            break;
          }
        }
        group.appendChild(textElem);
      }
      return group;
    } else if (element.type === 'arrow') {
      var group = svgDoc.createElementNS(svgNS, 'g');
      var styles = Object.assign({}, defaultStyles.arrow, element.styles || {});
      var line = svgDoc.createElementNS(svgNS, 'line');
      line.setAttribute('x1', element.startX);
      line.setAttribute('y1', element.startY);
      line.setAttribute('x2', element.endX);
      line.setAttribute('y2', element.endY);
      setSvgColor(line, 'stroke', styles.strokeColor || 'rgba(255,0,0,1)');
      line.setAttribute('stroke-width', styles.lineWidth || 7);
      line.setAttribute('stroke-linecap', 'round');
      line.setAttribute('stroke-linejoin', 'round');
      group.appendChild(line);
      // Arrowhead
      var headSize = styles.headSize || 20;
      var angle = Math.atan2(element.endY - element.startY, element.endX - element.startX);
      var arrowhead1 = svgDoc.createElementNS(svgNS, 'line');
      arrowhead1.setAttribute('x1', element.endX);
      arrowhead1.setAttribute('y1', element.endY);
      arrowhead1.setAttribute('x2', element.endX - headSize * Math.cos(angle - Math.PI / 6));
      arrowhead1.setAttribute('y2', element.endY - headSize * Math.sin(angle - Math.PI / 6));
      setSvgColor(arrowhead1, 'stroke', styles.strokeColor || 'rgba(255,0,0,1)');
      arrowhead1.setAttribute('stroke-width', styles.lineWidth || 7);
      arrowhead1.setAttribute('stroke-linecap', 'round');
      group.appendChild(arrowhead1);
      var arrowhead2 = svgDoc.createElementNS(svgNS, 'line');
      arrowhead2.setAttribute('x1', element.endX);
      arrowhead2.setAttribute('y1', element.endY);
      arrowhead2.setAttribute('x2', element.endX - headSize * Math.cos(angle + Math.PI / 6));
      arrowhead2.setAttribute('y2', element.endY - headSize * Math.sin(angle + Math.PI / 6));
      setSvgColor(arrowhead2, 'stroke', styles.strokeColor || 'rgba(255,0,0,1)');
      arrowhead2.setAttribute('stroke-width', styles.lineWidth || 7);
      arrowhead2.setAttribute('stroke-linecap', 'round');
      group.appendChild(arrowhead2);
      return group;
    } else if (element.type === 'image') {
      var img = svgDoc.createElementNS(svgNS, 'image');
      img.setAttribute('x', element.x);
      img.setAttribute('y', element.y);
      img.setAttribute('width', element.width);
      img.setAttribute('height', element.height);
      img.setAttributeNS(xlinkNS, 'xlink:href', element.imageData);
      return img;
    }
    return null;
  };

  return {
    drawRectangle: self.drawRectangle,
    drawTextBox: self.drawTextBox,
    drawArrow: self.drawArrow,
    drawImage: self.drawImage,
    createRectangleData: self.createRectangleData,
    createTextBoxData: self.createTextBoxData,
    createArrowData: self.createArrowData,
    createImageData: self.createImageData,
    processImageFile: self.processImageFile,
    getCanvasCoordinates: self.getCanvasCoordinates,
    resizeCanvas: self.resizeCanvas,
    clearCanvas: self.clearCanvas,
    redrawLayer: self.redrawLayer,
    drawSelectionHandles: self.drawSelectionHandles,
    drawTextBoxSelectionHandles: self.drawTextBoxSelectionHandles,
    drawArrowSelectionHandles: self.drawArrowSelectionHandles,
    drawImageSelectionHandles: self.drawImageSelectionHandles,
    isPointInRectangle: self.isPointInRectangle,
    isPointInTextBox: self.isPointInTextBox,
    isPointOnArrow: self.isPointOnArrow,
    isPointInImage: self.isPointInImage,
    getHandleAtPoint: self.getHandleAtPoint,
    getArrowHandleAtPoint: self.getArrowHandleAtPoint,
    calculateResizedRectangle: self.calculateResizedRectangle,
    updateArrowPosition: self.updateArrowPosition,
    defaultStyles: defaultStyles,
    elementToSvg: self.elementToSvg
  };
};

module.exports = new AnnotationUtil(); 