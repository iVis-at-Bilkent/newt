/**
 * Annotation Layers System
 * 
 * This module manages annotation layers that can contain independent sets of elements
 * (rectangles, arrows, text, and images). Each layer can be shown/hidden and
 * provides isolation between different sets of annotations.
 * 
 */

var jquery = $ = require('jquery');
var _ = require('underscore');
var annotationUtil = require('./annotation-util');
var appUtilities = require('./app-utilities');

var AnnotationLayers = function() {
  var self = this;
  
  var layers = [];
  var currentLayerId = 0;
  var nextLayerId = 1;
  var layerListContainer = null;
  var currentTool = null;
  var isDrawing = false;
  var startCoords = null;
  var previewElement = null;
  var selectedElement = null;
  var isResizing = false;
  var resizeHandle = null;
  var originalElementData = null;
  var isMoving = false;
  var moveStartCoords = null;
  
  // Viewport tracking for synchronization
  var viewportState = {
    pan: { x: 0, y: 0 },
    zoom: 1,
    width: 0,
    height: 0
  };
  
  var LayerModel = function(id, name, visible = true) {
    return {
      id: id,
      name: name,
      visible: visible,
      elements: [], // Will store rectangles, arrows, text, images
      createdAt: new Date(),
      zIndex: id,
      isCytoscapeLayer: id === 0,    // Layer 0 = Cytoscape canvas
      isAnnotationLayer: id > 0       // Layers 1+ = HTML canvas
    };
  };
  
  /**
   * Initialize the annotation layers system
   */
  self.init = function() {
    layerListContainer = $('.annotation-layers-list');
    
    // Wait for cytoscape to be ready before creating layers
    var checkCyReady = function() {
      var activeCy = appUtilities.getActiveCy();
      if (activeCy && activeCy.container()) {
    
    // Create default layer (Layer 0)
    self.addLayer('Layer 0', true);
    
    self.bindEvents();
    self.updateAnnotationToolStates();
    self.setupLayerIsolation();
    self.setupViewportSynchronization();
    
      } else {
        setTimeout(checkCyReady, 100);
      }
    };
    
    checkCyReady();
  };

  /**
   * Re-initialize annotation layers for a new network
   * This ensures proper setup for new Cytoscape instances
   */
  self.reinitForNewNetwork = function() {
    // Wait for the new cytoscape instance to be ready
    var checkCyReady = function() {
      var activeCy = appUtilities.getActiveCy();
      if (activeCy && activeCy.container()) {
        self.setupViewportSynchronization();
        self.updateViewportState();
        self.redrawAllAnnotationLayers();
      } else {
        setTimeout(checkCyReady, 100);
      }
    };
    
    checkCyReady();
  };
  
  /**
   * Bind UI event handlers
   */
  self.bindEvents = function() {
    // Add layer button
    $(document).on('click', '.add-layer-section button', function(e) {
      e.preventDefault();
      var layerName = 'Layer ' + (layers.length);
      self.addLayer(layerName);
    });
    
    // Layer visibility toggle
    $(document).on('click', '.layer-visibility-btn', function(e) {
      e.preventDefault();
      var layerId = parseInt($(this).data('layer-id'));
      self.toggleLayerVisibility(layerId);
    });
    
    // Delete layer
    $(document).on('click', '.layer-delete-btn', function(e) {
      e.preventDefault();
      var layerId = parseInt($(this).data('layer-id'));
      self.deleteLayer(layerId);
    });
    
    // Layer selection
    $(document).on('click', '.layer-item', function(e) {
      if (!$(e.target).hasClass('btn')) {
        var layerId = parseInt($(this).data('layer-id'));
        self.selectLayer(layerId);
      }
    });
    
    // Annotation tool buttons
    $(document).on('click', '.annotation-layers-controls button', function(e) {
      e.preventDefault();
      var tool = $(this).attr('title');
      self.selectTool(tool);
    });

    // Canvas mouse events for drawing
    $(document).on('mousedown', '[id^="annotation-canvas-layer-"]', function(e) {
      // Only prevent default if we're actively drawing, selecting, or moving
      if (currentTool || selectedElement) {
        e.preventDefault();
        e.stopPropagation();
      }
      self.handleCanvasMouseDown(e, this);
    });
    
    $(document).on('mousemove', '[id^="annotation-canvas-layer-"]', function(e) {
      // Only prevent default if we're actively drawing, selecting, or moving
      if (currentTool || selectedElement) {
        e.preventDefault();
        e.stopPropagation();
      }
      self.handleCanvasMouseMove(e, this);
      self.updateCursorOnMouseMove(e, this);
    });
    
    $(document).on('mouseup', '[id^="annotation-canvas-layer-"]', function(e) {
      // Only prevent default if we're actively drawing, selecting, or moving
      if (currentTool || selectedElement) {
        e.preventDefault();
        e.stopPropagation();
      }
      self.handleCanvasMouseUp(e, this);
    });

    // Prevent context menu on canvas
    $(document).on('contextmenu', '[id^="annotation-canvas-layer-"]', function(e) {
      e.preventDefault();
      e.stopPropagation();
    });
    
    $(document).on('dblclick', '[id^="annotation-canvas-layer-"]', function(e) {
      e.preventDefault();
      e.stopPropagation();
      self.handleCanvasDoubleClick(e, this);
    });
  };
  
  /**
   * Add a new layer
   * @param {string} name - The name of the layer
   * @param {boolean} isDefaultLayer - Whether this is the default Layer 0
   * @returns {number} The ID of the created layer
   */
  self.addLayer = function(name, isDefaultLayer = false) {
    var layerId = isDefaultLayer ? 0 : nextLayerId;
    var layer = LayerModel(layerId, name);
    layer.isDefaultLayer = isDefaultLayer;
    
    layers.push(layer);
    
    // Create HTML canvas for annotation layers only
    if (layer.isAnnotationLayer) {
      self.createAnnotationCanvas(layer.id);
    }
    
    self.renderLayerList();
    self.selectLayer(layerId);
    
    if (!isDefaultLayer) {
      nextLayerId++;
    }
    
    return layer.id;
  };
  
  /**
   * Delete a layer
   * @param {number} layerId - The ID of the layer to delete
   */
  self.deleteLayer = function(layerId) {
    var layer = self.getLayer(layerId);
    if (!layer) {
      console.error('Layer not found:', layerId);
      return false;
    }
    
    // Prevent deletion of the default Layer 0
    if (layer.isDefaultLayer) {
      alert('Layer 0 cannot be deleted. It is the default layer.');
      return false;
    }
    
    var layerIndex = layers.findIndex(l => l.id === layerId);
    if (layerIndex === -1) {
      console.error('Layer not found:', layerId);
      return false;
    }
    
    var deletedLayer = layers[layerIndex];
    layers.splice(layerIndex, 1);
    
    // Remove the canvas element
    if (deletedLayer.isAnnotationLayer) {
      var canvas = self.getAnnotationCanvas(layerId);
      if (canvas) {
        canvas.remove();
      }
    }
    
    // If the deleted layer was selected, select Layer 0
    if (currentLayerId === layerId) {
      var defaultLayer = layers.find(l => l.isDefaultLayer);
      if (defaultLayer) {
        self.selectLayer(defaultLayer.id);
      }
    }
    
    self.renderLayerList();
    
    return true;
  };
  
  /**
   * Enable or disable annotation tool buttons based on selected layer
   */
  self.updateAnnotationToolStates = function() {
    var currentLayer = self.getCurrentLayer();
    var disable = currentLayer && currentLayer.isCytoscapeLayer;
    $('.annotation-layers-controls button').prop('disabled', disable).toggleClass('disabled', disable);
    
    // Update cursor when layer changes
    self.updateCanvasCursor();
  };

  /**
   * Select a layer as the current active layer
   * @param {number} layerId - The ID of the layer to select
   */
  self.selectLayer = function(layerId) {
    var layer = self.getLayer(layerId);
    if (!layer) {
      console.error('Layer not found:', layerId);
      return false;
    }
    
    // Deselect any selected elements when switching layers
    if (selectedElement) {
      self.deselectElement();
    }
    
    currentLayerId = layerId;
    self.renderLayerList();
    self.updateAnnotationToolStates();
    self.setupLayerIsolation();
    
    return true;
  };
  
  /**
   * Toggle layer visibility
   * @param {number} layerId - The ID of the layer
   */
  self.toggleLayerVisibility = function(layerId) {
    var layer = self.getLayer(layerId);
    if (!layer) return false;
    
    layer.visible = !layer.visible;
    self.renderLayerList();
    
    // Show/hide the canvas element for annotation layers
    if (layer.isAnnotationLayer) {
      var canvas = self.getAnnotationCanvas(layerId);
      if (canvas) {
        canvas.style.display = layer.visible ? 'block' : 'none';
      }
    }
    
    return layer.visible;
  };
  
  /**
   * Get a layer by ID
   * @param {number} layerId - The ID of the layer
   * @returns {Object|null} The layer object or null if not found
   */
  self.getLayer = function(layerId) {
    return layers.find(layer => layer.id === layerId) || null;
  };
  
  /**
   * Get the currently selected layer
   * @returns {Object|null} The current layer object or null
   */
  self.getCurrentLayer = function() {
    return self.getLayer(currentLayerId);
  };
  
  /**
   * Get all layers
   * @returns {Array} Array of all layer objects
   */
  self.getAllLayers = function() {
    return [...layers];
  };
  
  /**
   * Render the layer list in the UI
   */
  self.renderLayerList = function() {
    if (!layerListContainer) return;
    
    layerListContainer.empty();
    
    // Sort layers by zIndex for consistent display order
    var sortedLayers = layers.slice().sort((a, b) => b.zIndex - a.zIndex);
    
    sortedLayers.forEach(function(layer) {
      var layerElement = self.createLayerElement(layer);
      layerListContainer.append(layerElement);
    });
  };
  
  /**
   * Create a layer element for the UI
   * @param {Object} layer - The layer object
   * @returns {jQuery} The layer element
   */
  self.createLayerElement = function(layer) {
    var isSelected = layer.id === currentLayerId;
    var visibilityIcon = layer.visible ? 'fa-eye' : 'fa-eye-slash';
    var isDefaultLayer = layer.isDefaultLayer;
    
    var layerHtml = `
      <div class="layer-item ${isSelected ? 'selected' : ''}" 
           data-layer-id="${layer.id}" 
           style="display: flex; align-items: center; padding: 8px; 
                  border: 1px solid ${isSelected ? '#337ab7' : '#ddd'}; 
                  border-radius: 4px; margin-bottom: 8px; 
                  background-color: ${isSelected ? '#e7f3ff' : '#f9f9f9'}; 
                  cursor: pointer;">
        <div style="flex: 1;">
          <span style="font-weight: ${isSelected ? 'bold' : 'normal'};">${layer.name}</span>
          ${isDefaultLayer ? '<small style="color: #666; margin-left: 8px;">(Default)</small>' : ''}
        </div>
        <div style="display: flex; gap: 5px;">
          ${!isDefaultLayer ? `
            <button type="button" 
                    class="btn btn-xs btn-default layer-visibility-btn" 
                    data-layer-id="${layer.id}"
                    title="${layer.visible ? 'Hide' : 'Show'} Layer">
              <i class="fa ${visibilityIcon}"></i>
            </button>
          ` : ''}
          ${!isDefaultLayer ? `
            <button type="button" 
                    class="btn btn-xs btn-danger layer-delete-btn" 
                    data-layer-id="${layer.id}"
                    title="Delete Layer">
              <i class="fa fa-times"></i>
            </button>
          ` : ''}
        </div>
      </div>
    `;
    
    return $(layerHtml);
  };

  /**
   * Create a canvas element for a specific annotation layer
   * @param {number} layerId - The ID of the annotation layer
   */
  self.createAnnotationCanvas = function(layerId) {
    
    var canvas = document.createElement('canvas');
    canvas.id = 'annotation-canvas-layer-' + layerId;
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';  // Disable pointer events by default
    canvas.style.zIndex = (1000 + layerId).toString();
    
    // Find the active cytoscape container
    var activeCy = appUtilities.getActiveCy();
    if (!activeCy) {
      console.error('No active cytoscape instance found');
      return null;
    }
    
    var cyContainer = activeCy.container();
    if (!cyContainer) {
      console.error('No cytoscape container found');
      return null;
    }
    
    cyContainer.appendChild(canvas);
    
    // Resize canvas to match container
    var resizeSuccess = annotationUtil.resizeCanvas(canvas);
    
    // Handle window resize
    $(window).on('resize', function() {
      annotationUtil.resizeCanvas(canvas);
      self.redrawLayer(layerId);
    });
    
    return canvas;
  };

  /**
   * Enable pointer events on all annotation canvases
   */
  self.enablePointerEvents = function() {
    $('[id^="annotation-canvas-layer-"]').css('pointerEvents', 'auto');
  };

  /**
   * Disable pointer events on all annotation canvases
   */
  self.disablePointerEvents = function() {
    $('[id^="annotation-canvas-layer-"]').css('pointerEvents', 'none');
  };

  /**
   * Enable Cytoscape interactions (node/edge selection, pan, zoom)
   */
  self.enableCytoscapeInteractions = function() {
    var activeCy = appUtilities.getActiveCy();
    if (activeCy) {
      activeCy.panningEnabled(true);
      activeCy.zoomingEnabled(true);
      activeCy.elements().selectable(true);
      activeCy.boxSelectionEnabled(true);
    }
  };

  /**
   * Disable Cytoscape interactions (node/edge selection, pan, zoom)
   */
  self.disableCytoscapeInteractions = function() {
    var activeCy = appUtilities.getActiveCy();
    if (activeCy) {
      activeCy.panningEnabled(false);
      activeCy.zoomingEnabled(false);
      activeCy.elements().unselect();
      activeCy.elements().selectable(false);
      activeCy.boxSelectionEnabled(false);
    }
  };

  /**
   * Set up viewport synchronization with Cytoscape
   * We listen for viewport changes and redraw the annotation layers
   * We also listen for resize events and redraw the annotation layers
   */
  self.setupViewportSynchronization = function() {
    var activeCy = appUtilities.getActiveCy();
    if (!activeCy) {
      console.error('No active cytoscape instance found for viewport sync');
      return;
    }

    activeCy.off('viewport');
    activeCy.off('resize');

    self.updateViewportState();

    activeCy.on('viewport', function() {
      self.updateViewportState();
      self.redrawAllAnnotationLayers();
    });

    activeCy.on('resize', function() {
      self.updateViewportState();
      layers.forEach(function(layer) {
        if (layer.isAnnotationLayer) {
          var canvas = self.getAnnotationCanvas(layer.id);
          if (canvas) {
            annotationUtil.resizeCanvas(canvas);
          }
        }
      });
      self.redrawAllAnnotationLayers();
    });

  };

  /**
   * Update the stored viewport state from Cytoscape
   */
  self.updateViewportState = function() {
    var activeCy = appUtilities.getActiveCy();
    if (!activeCy) return;

    var pan = activeCy.pan();
    var zoom = activeCy.zoom();
    var width = activeCy.width();
    var height = activeCy.height();

    viewportState = {
      pan: { x: pan.x, y: pan.y },
      zoom: zoom,
      width: width,
      height: height
    };

  };

  /**
   * Transform model coordinates to canvas coordinates
   * @param {number} modelX - X coordinate in Cytoscape model space
   * @param {number} modelY - Y coordinate in Cytoscape model space
   * @returns {Object} Canvas coordinates {x, y}
   */
  self.modelToCanvas = function(modelX, modelY) {
    return {
      x: modelX * viewportState.zoom + viewportState.pan.x,
      y: modelY * viewportState.zoom + viewportState.pan.y
    };
  };

  /**
   * Transform canvas coordinates to model coordinates
   * @param {number} canvasX - X coordinate in canvas space
   * @param {number} canvasY - Y coordinate in canvas space
   * @returns {Object} Model coordinates {x, y}
   */
  self.canvasToModel = function(canvasX, canvasY) {
    return {
      x: (canvasX - viewportState.pan.x) / viewportState.zoom,
      y: (canvasY - viewportState.pan.y) / viewportState.zoom
    };
  };

  /**
   * Transform an element from model coordinates to canvas coordinates
   * @param {Object} element - Element with x, y, width, height in model coordinates
   * @returns {Object} Element with x, y, width, height in canvas coordinates
   */
  self.transformElementToCanvas = function(element) {
    if (!element) return element;

    if (element.type === 'rectangle' || element.type === 'textbox') {
      var topLeft = self.modelToCanvas(element.x, element.y);
      var bottomRight = self.modelToCanvas(element.x + element.width, element.y + element.height);

      return {
        ...element,
        x: topLeft.x,
        y: topLeft.y,
        width: bottomRight.x - topLeft.x,
        height: bottomRight.y - topLeft.y
      };
    } else if (element.type === 'arrow') {
      var startPoint = self.modelToCanvas(element.startX, element.startY);
      var endPoint = self.modelToCanvas(element.endX, element.endY);

      return {
        ...element,
        startX: startPoint.x,
        startY: startPoint.y,
        endX: endPoint.x,
        endY: endPoint.y
      };
    } else if (element.type === 'image') {
      var topLeft = self.modelToCanvas(element.x, element.y);
      var bottomRight = self.modelToCanvas(element.x + element.width, element.y + element.height);

      return {
        ...element,
        x: topLeft.x,
        y: topLeft.y,
        width: bottomRight.x - topLeft.x,
        height: bottomRight.y - topLeft.y
      };
    }

    return element;
  };

  /**
   * Redraw all annotation layers with viewport transformations
   */
  self.redrawAllAnnotationLayers = function() {
    layers.forEach(function(layer) {
      if (layer.isAnnotationLayer) {
        self.redrawLayer(layer.id);
      }
    });
  };

  /**
   * Set up layer isolation based on current layer
   */
  self.setupLayerIsolation = function() {
    var currentLayer = self.getCurrentLayer();
    if (!currentLayer) return;
    
    // If an annotation element is selected, disable Cytoscape interactions
    // to prevent viewport panning when mouse is outside canvas
    if (selectedElement) {
      self.disableCytoscapeInteractions();
      self.enablePointerEvents();
      return;
    }
    
    // Always enable Cytoscape interactions when no element is selected
    self.enableCytoscapeInteractions();
    
    // For annotation layers, we need to manage pointer events more intelligently
    // to allow both Cytoscape interactions and annotation functionality
    if (currentLayer.isCytoscapeLayer) {
      self.disablePointerEvents();
    } else {
      // For annotation layers, enable pointer events to allow selection
      self.enablePointerEvents();
    }
  };

  /**
   * Set up smart pointer events for annotation layers
   * This allows Cytoscape interactions when not actively drawing/selecting
   */
  self.setupSmartPointerEvents = function() {
    // Initially disable pointer events to allow Cytoscape interactions
    self.disablePointerEvents();
  };

  /**
   * Add an annotation element to a specific layer
   * @param {number} layerId - The ID of the annotation layer
   * @param {string} elementType - Type of element ('rectangle', 'arrow', 'text', 'image')
   * @param {Object} elementData - Data for the element (e.g., { x: 100, y: 100, width: 50, height: 50 })
   */
  self.addAnnotationElement = function(layerId, elementType, elementData) {
    var layer = self.getLayer(layerId);
    if (!layer || !layer.isAnnotationLayer) {
      console.error('Invalid layer for annotations:', layerId);
      return false;
    }
    
    var canvas = self.getAnnotationCanvas(layerId);
    if (!canvas) {
      console.error('No canvas found for layer:', layerId);
      return false;
    }
    
    // Add element to layer data
    layer.elements.push(elementData);
    
    // Redraw the entire layer
    self.redrawLayer(layerId);
    
    return elementData.id;
  };

  /**
   * Redraw all elements in a specific layer
   * @param {number} layerId - The ID of the layer to redraw
   */
  self.redrawLayer = function(layerId) {
    var layer = self.getLayer(layerId);
    if (!layer || !layer.isAnnotationLayer) return false;
    
    var canvas = self.getAnnotationCanvas(layerId);
    if (!canvas) return false;
    
    var ctx = canvas.getContext('2d');
    
    annotationUtil.clearCanvas(ctx);
    
    // Draw all elements with viewport transformations
    layer.elements.forEach(function(element) {
      var transformedElement = self.transformElementToCanvas(element);
      
      switch (element.type) {
        case 'rectangle':
          annotationUtil.drawRectangle(ctx, transformedElement, element.styles);
          break;
        case 'textbox':
          annotationUtil.drawTextBox(ctx, transformedElement, element.styles);
          break;
        case 'arrow':
          annotationUtil.drawArrow(ctx, transformedElement, element.styles);
          break;
        case 'image':
          annotationUtil.drawImage(ctx, transformedElement, element.styles);
          break;
        default:
          console.warn('Unknown element type:', element.type);
      }
    });
    
    // Draw selection handles for selected element (also transformed)
    if (selectedElement) {
      var transformedSelected = self.transformElementToCanvas(selectedElement);
      if (selectedElement.type === 'rectangle') {
        annotationUtil.drawSelectionHandles(ctx, transformedSelected);
      } else if (selectedElement.type === 'textbox') {
        annotationUtil.drawTextBoxSelectionHandles(ctx, transformedSelected);
      } else if (selectedElement.type === 'arrow') {
        annotationUtil.drawArrowSelectionHandles(ctx, transformedSelected);
      } else if (selectedElement.type === 'image') {
        annotationUtil.drawImageSelectionHandles(ctx, transformedSelected);
      }
    }
    
    return true;
  };

  /**
   * Remove an annotation element from a layer
   * @param {number} layerId - The ID of the layer
   * @param {string} elementId - The ID of the element to remove
   */
  self.removeAnnotationElement = function(layerId, elementId) {
    var layer = self.getLayer(layerId);
    if (!layer) return false;
    
    var elementIndex = layer.elements.findIndex(el => el.id === elementId);
    if (elementIndex === -1) return false;
    
    layer.elements.splice(elementIndex, 1);
    self.redrawLayer(layerId);
    
    return true;
  };
  
  /**
   * Select an annotation tool
   * @param {string} toolName - Name of the tool (matches button title)
   */
  self.selectTool = function(toolName) {
    var currentLayer = self.getCurrentLayer();
    if (!currentLayer || currentLayer.isCytoscapeLayer) {
      return false;
    }

    // If clicking the same tool, deselect it
    if (currentTool === toolName) {
      self.deselectTool();
      return true;
    }

    $('.annotation-layers-controls button').removeClass('active');
    $('.annotation-layers-controls button[title="' + toolName + '"]').addClass('active');
    
    currentTool = toolName;
    
    // Enable pointer events immediately when a tool is selected
    self.enablePointerEvents();
    
    self.updateCanvasCursor();
    
    return true;
  };

  /**
   * Deselect the current tool
   */
  self.deselectTool = function() {
    $('.annotation-layers-controls button').removeClass('active');
    currentTool = null;
    
    isDrawing = false;
    startCoords = null;
    previewElement = null;
    
    // Only update pointer events for Cytoscape layer
    var currentLayer = self.getCurrentLayer();
    if (currentLayer && currentLayer.isCytoscapeLayer) {
      self.disablePointerEvents();
    }
    self.updateCanvasCursor();
  };

  /**
   * Update cursor style for all annotation canvases
   */
  self.updateCanvasCursor = function() {
    var cursor = 'default';
    if (currentTool === 'Add Rectangle') {
      cursor = 'crosshair';
    } else if (currentTool === 'Add Text') {
      cursor = 'crosshair';
    } else if (currentTool === 'Add Arrow') {
      cursor = 'crosshair';
    } else if (currentTool === 'Add Image') {
      cursor = 'crosshair';
    }
    
    $('[id^="annotation-canvas-layer-"]').css('cursor', cursor);
  };

  /**
   * Update cursor based on mouse position over canvas
   */
  self.updateCursorOnMouseMove = function(event, canvas) {
    var canvasCoords = annotationUtil.getCanvasCoordinates(canvas, event);
    var modelCoords = self.canvasToModel(canvasCoords.x, canvasCoords.y);
    var cursor = 'default';
    
    var currentLayer = self.getCurrentLayer();
    var isOnAnnotationLayer = currentLayer && currentLayer.isAnnotationLayer;
    
    if (!isOnAnnotationLayer) {
      return;
    }
    
    var hoveredElement = self.getElementAtPoint(modelCoords.x, modelCoords.y);
    
    if (currentTool === 'Add Rectangle') {
      cursor = 'crosshair';
    } else if (currentTool === 'Add Text') {
      cursor = 'crosshair';
    } else if (currentTool === 'Add Arrow') {
      cursor = 'crosshair';
    } else if (currentTool === 'Add Image') {
      cursor = 'crosshair';
    } else if (selectedElement && (selectedElement.type === 'rectangle' || selectedElement.type === 'textbox')) {
      var transformedSelected = self.transformElementToCanvas(selectedElement);
      var handleType = annotationUtil.getHandleAtPoint(canvasCoords.x, canvasCoords.y, transformedSelected);
      if (handleType) {
        switch (handleType) {
          case 'top-left':
          case 'bottom-right':
            cursor = 'nw-resize';
            break;
          case 'top-right':
          case 'bottom-left':
            cursor = 'ne-resize';
            break;
          case 'top':
          case 'bottom':
            cursor = 'ns-resize';
            break;
          case 'left':
          case 'right':
            cursor = 'ew-resize';
            break;
        }
      } else {
        var isInside = false;
        if (selectedElement.type === 'rectangle') {
          isInside = annotationUtil.isPointInRectangle(modelCoords.x, modelCoords.y, selectedElement);
        } else if (selectedElement.type === 'textbox') {
          isInside = annotationUtil.isPointInTextBox(modelCoords.x, modelCoords.y, selectedElement);
        }
        
        if (isInside) {
          cursor = 'move';
        }
      }
    } else if (selectedElement && selectedElement.type === 'arrow') {
      var transformedSelected = self.transformElementToCanvas(selectedElement);
      var handleType = annotationUtil.getArrowHandleAtPoint(canvasCoords.x, canvasCoords.y, transformedSelected);
      if (handleType) {
        cursor = handleType === 'tail' ? 'nw-resize' : 'ne-resize';
      } else {
        var isOnArrow = annotationUtil.isPointOnArrow(modelCoords.x, modelCoords.y, selectedElement);
        if (isOnArrow) {
          cursor = 'move';
        }
      }
    } else if (selectedElement && selectedElement.type === 'image') {
      var transformedSelected = self.transformElementToCanvas(selectedElement);
      var handleType = annotationUtil.getHandleAtPoint(canvasCoords.x, canvasCoords.y, transformedSelected);
      if (handleType) {
        switch (handleType) {
          case 'top-left':
          case 'bottom-right':
            cursor = 'nw-resize';
            break;
          case 'top-right':
          case 'bottom-left':
            cursor = 'ne-resize';
            break;
          case 'top':
          case 'bottom':
            cursor = 'ns-resize';
            break;
          case 'left':
          case 'right':
            cursor = 'ew-resize';
            break;
        }
      } else {
        var isInside = annotationUtil.isPointInImage(modelCoords.x, modelCoords.y, selectedElement);
        if (isInside) {
          cursor = 'move';
        }
      }
    } else if (hoveredElement) {
      cursor = 'move';
    }
    
    canvas.style.cursor = cursor;
  };

  /**
   * Handle mouse down events on annotation canvas
   */
  self.handleCanvasMouseDown = function(event, canvas) {
    var canvasCoords = annotationUtil.getCanvasCoordinates(canvas, event);
    var modelCoords = self.canvasToModel(canvasCoords.x, canvasCoords.y);
    var layerId = parseInt(canvas.id.match(/annotation-canvas-layer-(\d+)/)[1]);
    
    var currentLayer = self.getCurrentLayer();
    var isOnAnnotationLayer = currentLayer && currentLayer.isAnnotationLayer;
    
    if (!isOnAnnotationLayer) {
      return;
    }
    
    if (!currentTool) {
      if (selectedElement && (selectedElement.type === 'rectangle' || selectedElement.type === 'textbox')) {
        var transformedSelected = self.transformElementToCanvas(selectedElement);
        var handleType = annotationUtil.getHandleAtPoint(canvasCoords.x, canvasCoords.y, transformedSelected);
        if (handleType) {
          isResizing = true;
          resizeHandle = handleType;
          originalElementData = Object.assign({}, selectedElement);
          return;
        } else {
          var isInside = false;
          if (selectedElement.type === 'rectangle') {
            isInside = annotationUtil.isPointInRectangle(modelCoords.x, modelCoords.y, selectedElement);
          } else if (selectedElement.type === 'textbox') {
            isInside = annotationUtil.isPointInTextBox(modelCoords.x, modelCoords.y, selectedElement);
          }
          
          if (isInside) {
            isMoving = true;
            moveStartCoords = modelCoords;
            originalElementData = Object.assign({}, selectedElement);
            return;
          }
        }
      } else if (selectedElement && selectedElement.type === 'arrow') {
        var transformedSelected = self.transformElementToCanvas(selectedElement);
        var handleType = annotationUtil.getArrowHandleAtPoint(canvasCoords.x, canvasCoords.y, transformedSelected);
        if (handleType) {
          isResizing = true;
          resizeHandle = handleType;
          originalElementData = Object.assign({}, selectedElement);
          return;
        } else {
          var isOnArrow = annotationUtil.isPointOnArrow(modelCoords.x, modelCoords.y, selectedElement);
          if (isOnArrow) {
            isMoving = true;
            moveStartCoords = modelCoords;
            originalElementData = Object.assign({}, selectedElement);
            return;
          }
        }
      } else if (selectedElement && selectedElement.type === 'image') {
        var transformedSelected = self.transformElementToCanvas(selectedElement);
        var handleType = annotationUtil.getHandleAtPoint(canvasCoords.x, canvasCoords.y, transformedSelected);
        if (handleType) {
          isResizing = true;
          resizeHandle = handleType;
          originalElementData = Object.assign({}, selectedElement);
          return;
        } else {
          var isInside = annotationUtil.isPointInImage(modelCoords.x, modelCoords.y, selectedElement);
          if (isInside) {
            isMoving = true;
            moveStartCoords = modelCoords;
            originalElementData = Object.assign({}, selectedElement);
            return;
          }
        }
      }
      
      var element = self.getElementAtPoint(modelCoords.x, modelCoords.y);
      if (element) {
        if (!selectedElement || selectedElement.id !== element.id) {
          self.selectElement(element);
        }
        isMoving = true;
        moveStartCoords = modelCoords;
        originalElementData = Object.assign({}, element);
        return;
      } else {
        self.deselectElement();
        return;
      }
    }
    
    if (currentTool === 'Add Rectangle') {
      var currentLayer = self.getCurrentLayer();
      if (!currentLayer || !currentLayer.isAnnotationLayer) {
        return;
      }
      
      isDrawing = true;
      startCoords = modelCoords;
    }
    
    if (currentTool === 'Add Text') {
      var currentLayer = self.getCurrentLayer();
      if (!currentLayer || !currentLayer.isAnnotationLayer) {
        return;
      }
      
      isDrawing = true;
      startCoords = modelCoords;
    }
    
    if (currentTool === 'Add Arrow') {
      var currentLayer = self.getCurrentLayer();
      if (!currentLayer || !currentLayer.isAnnotationLayer) {
        return;
      }
      
      isDrawing = true;
      startCoords = modelCoords;
    }
    
    if (currentTool === 'Add Image') {
      var currentLayer = self.getCurrentLayer();
      if (!currentLayer || !currentLayer.isAnnotationLayer) {
        return;
      }
      
      // Trigger file upload for image
      self.triggerImageUpload(modelCoords);
    }
  };

  /**
   * Handle mouse move events on annotation canvas (for live preview)
   */
  self.handleCanvasMouseMove = function(event, canvas) {
    var canvasCoords = annotationUtil.getCanvasCoordinates(canvas, event);
    var modelCoords = self.canvasToModel(canvasCoords.x, canvasCoords.y);
    var layerId = parseInt(canvas.id.match(/annotation-canvas-layer-(\d+)/)[1]);
    
    var currentLayer = self.getCurrentLayer();
    var isOnAnnotationLayer = currentLayer && currentLayer.isAnnotationLayer;
    
    if (!isOnAnnotationLayer) {
      return;
    }
    
    // Handle resizing
    if (isResizing && selectedElement && resizeHandle) {
      if (selectedElement.type === 'rectangle' || selectedElement.type === 'textbox') {
        var newRectData = annotationUtil.calculateResizedRectangle(
          resizeHandle, originalElementData, modelCoords.x, modelCoords.y
        );
        
        selectedElement.x = newRectData.x;
        selectedElement.y = newRectData.y;
        selectedElement.width = newRectData.width;
        selectedElement.height = newRectData.height;
      } else if (selectedElement.type === 'arrow') {
        var updatedArrow = annotationUtil.updateArrowPosition(
          originalElementData, resizeHandle, modelCoords.x, modelCoords.y
        );
        
        selectedElement.startX = updatedArrow.startX;
        selectedElement.startY = updatedArrow.startY;
        selectedElement.endX = updatedArrow.endX;
        selectedElement.endY = updatedArrow.endY;
      } else if (selectedElement.type === 'image') {
        var newRectData = annotationUtil.calculateResizedRectangle(
          resizeHandle, originalElementData, modelCoords.x, modelCoords.y
        );
        
        selectedElement.x = newRectData.x;
        selectedElement.y = newRectData.y;
        selectedElement.width = newRectData.width;
        selectedElement.height = newRectData.height;
      }
      
      self.redrawLayer(currentLayerId);
      return;
    }
    
    // Handle moving
    if (isMoving && selectedElement && moveStartCoords) {
      var deltaX = modelCoords.x - moveStartCoords.x;
      var deltaY = modelCoords.y - moveStartCoords.y;
      
      var canvasStartCoords = self.modelToCanvas(moveStartCoords.x, moveStartCoords.y);
      var canvasDistance = Math.sqrt(
        Math.pow(canvasCoords.x - canvasStartCoords.x, 2) + 
        Math.pow(canvasCoords.y - canvasStartCoords.y, 2)
      );
      
      // Only start moving if the mouse has moved a minimum distance (5 pixels in canvas space)
      if (canvasDistance > 5) {
        if (selectedElement.type === 'rectangle' || selectedElement.type === 'textbox') {
          selectedElement.x = originalElementData.x + deltaX;
          selectedElement.y = originalElementData.y + deltaY;
        } else if (selectedElement.type === 'arrow') {
          selectedElement.startX = originalElementData.startX + deltaX;
          selectedElement.startY = originalElementData.startY + deltaY;
          selectedElement.endX = originalElementData.endX + deltaX;
          selectedElement.endY = originalElementData.endY + deltaY;
        } else if (selectedElement.type === 'image') {
          selectedElement.x = originalElementData.x + deltaX;
          selectedElement.y = originalElementData.y + deltaY;
        }
        
        self.redrawLayer(currentLayerId);
      }
      return;
    }
    
    // Handle drawing preview
    if (isDrawing && startCoords && currentTool === 'Add Rectangle') {
      
      var rectData = annotationUtil.createRectangleData(
        startCoords.x, startCoords.y, 
        modelCoords.x, modelCoords.y
      );
      
      self.redrawLayerWithPreview(currentLayerId, rectData);
    }

    if (isDrawing && startCoords && currentTool === 'Add Text') {
      
      var textBoxData = annotationUtil.createTextBoxData(
        startCoords.x, startCoords.y, 
        modelCoords.x, modelCoords.y
      );
      
      self.redrawLayerWithPreview(currentLayerId, textBoxData);
    }
    
    if (isDrawing && startCoords && currentTool === 'Add Arrow') {
      
      var arrowData = annotationUtil.createArrowData(
        startCoords.x, startCoords.y, 
        modelCoords.x, modelCoords.y
      );
      
      self.redrawLayerWithPreview(currentLayerId, arrowData);
    }
  };

  /**
   * Handle mouse up events on annotation canvas
   */
  self.handleCanvasMouseUp = function(event, canvas) {
    
    var canvasCoords = annotationUtil.getCanvasCoordinates(canvas, event);
    var modelCoords = self.canvasToModel(canvasCoords.x, canvasCoords.y);
    
    var currentLayer = self.getCurrentLayer();
    var isOnAnnotationLayer = currentLayer && currentLayer.isAnnotationLayer;
    
    if (!isOnAnnotationLayer) {
      return;
    }
    
    // Handle resizing completion
    if (isResizing && selectedElement && resizeHandle) {
      isResizing = false;
      resizeHandle = null;
      originalElementData = null;
      return;
    }
    
    // Handle moving completion
    if (isMoving && selectedElement && moveStartCoords) {
      isMoving = false;
      moveStartCoords = null;
      originalElementData = null;
      return;
    }
    
    // Handle drawing completion
    if (isDrawing && startCoords && currentTool === 'Add Rectangle') {
      
      // Create final rectangle data (in model coordinates)
      var rectData = annotationUtil.createRectangleData(
        startCoords.x, startCoords.y, 
        modelCoords.x, modelCoords.y
      );
      
      if (rectData.width > 5 && rectData.height > 5) {
        self.addAnnotationElement(currentLayerId, 'rectangle', rectData);
      }
      
      startCoords = null;
      previewElement = null;
      
      // Dispatch a synthetic mouseup event to Cytoscape container to end any drag state
      var activeCy = appUtilities.getActiveCy();
      if (activeCy && activeCy.container()) {
        var cyContainer = activeCy.container();
        var mouseUpEvent = new MouseEvent('mouseup', {
          bubbles: true,
          cancelable: true,
          clientX: 0,
          clientY: 0
        });
        cyContainer.dispatchEvent(mouseUpEvent);
      }
      
      self.deselectTool();
    }
    
    if (isDrawing && startCoords && currentTool === 'Add Text') {
      
      var textBoxData = annotationUtil.createTextBoxData(
        startCoords.x, startCoords.y, 
        modelCoords.x, modelCoords.y
      );
      
      if (textBoxData.width > 5 && textBoxData.height > 5) {
        self.addAnnotationElement(currentLayerId, 'textbox', textBoxData);
      }
      
      startCoords = null;
      previewElement = null;
      
      var activeCy = appUtilities.getActiveCy();
      if (activeCy && activeCy.container()) {
        var cyContainer = activeCy.container();
        var mouseUpEvent = new MouseEvent('mouseup', {
          bubbles: true,
          cancelable: true,
          clientX: 0,
          clientY: 0
        });
        cyContainer.dispatchEvent(mouseUpEvent);
      }
      
      self.deselectTool();
    }
    
    if (isDrawing && startCoords && currentTool === 'Add Arrow') {
      
      var arrowData = annotationUtil.createArrowData(
        startCoords.x, startCoords.y, 
        modelCoords.x, modelCoords.y
      );
      
      var distance = Math.sqrt(
        Math.pow(modelCoords.x - startCoords.x, 2) + 
        Math.pow(modelCoords.y - startCoords.y, 2)
      );
      
      if (distance > 10) {
        self.addAnnotationElement(currentLayerId, 'arrow', arrowData);
      }
      
      startCoords = null;
      previewElement = null;
      
      var activeCy = appUtilities.getActiveCy();
      if (activeCy && activeCy.container()) {
        var cyContainer = activeCy.container();
        var mouseUpEvent = new MouseEvent('mouseup', {
          bubbles: true,
          cancelable: true,
          clientX: 0,
          clientY: 0
        });
        cyContainer.dispatchEvent(mouseUpEvent);
      }
      
      self.deselectTool();
    }
  };

  /**
   * Redraw a layer with a preview element
   */
  self.redrawLayerWithPreview = function(layerId, previewData) {
    var layer = self.getLayer(layerId);
    if (!layer) return;
    
    var canvas = self.getAnnotationCanvas(layerId);
    if (!canvas) return;
    
    var ctx = canvas.getContext('2d');
    
    annotationUtil.clearCanvas(ctx);
    
    layer.elements.forEach(function(element) {
      var transformedElement = self.transformElementToCanvas(element);
      switch (element.type) {
        case 'rectangle':
          annotationUtil.drawRectangle(ctx, transformedElement, element.styles);
          break;
        case 'textbox':
          annotationUtil.drawTextBox(ctx, transformedElement, element.styles);
          break;
        case 'arrow':
          annotationUtil.drawArrow(ctx, transformedElement, element.styles);
          break;
        case 'image':
          annotationUtil.drawImage(ctx, transformedElement, element.styles);
          break;
        default:
          console.warn('Unknown element type:', element.type);
      }
    });
    
    var transformedPreview = self.transformElementToCanvas(previewData);
    var previewStyles = {
      strokeColor: '#0066cc',
      fillColor: 'rgba(0, 102, 204, 0.2)',
      lineDash: [5, 5]
    };
    
    if (previewData.type === 'rectangle') {
      annotationUtil.drawRectangle(ctx, transformedPreview, previewStyles);
    } else if (previewData.type === 'textbox') {
      annotationUtil.drawTextBox(ctx, transformedPreview, previewStyles);
    } else if (previewData.type === 'arrow') {
      annotationUtil.drawArrow(ctx, transformedPreview, previewStyles);
    } else if (previewData.type === 'image') {
      annotationUtil.drawImage(ctx, transformedPreview, previewStyles);
    }
  };

  /**
   * Get annotation canvas for a specific layer
   */
  self.getAnnotationCanvas = function(layerId) {
    return document.getElementById('annotation-canvas-layer-' + layerId);
  };
  
  /**
   * Select an element in the current layer
   * @param {Object} element - The element to select
   */
  self.selectElement = function(element) {
    selectedElement = element;
    // Disable Cytoscape interactions to prevent viewport panning
    // when mouse moves outside the canvas
    self.disableCytoscapeInteractions();
    self.enablePointerEvents();
    self.redrawLayer(currentLayerId);
  };

  /**
   * Deselect the currently selected element
   */
  self.deselectElement = function() {
    selectedElement = null;
    self.enableCytoscapeInteractions();
    
    // Update pointer events based on current layer
    var currentLayer = self.getCurrentLayer();
    if (currentLayer && currentLayer.isCytoscapeLayer) {
      self.disablePointerEvents();
    } else {
      // Keep pointer events enabled for annotation layers
      self.enablePointerEvents();
    }
    self.redrawLayer(currentLayerId);
  };

  /**
   * Find an element at the given coordinates
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {Object|null} The element at the coordinates or null
   */
  self.getElementAtPoint = function(x, y) {
    var currentLayer = self.getCurrentLayer();
    if (!currentLayer || !currentLayer.isAnnotationLayer) {
      return null;
    }
    
    // Check elements in reverse order (top to bottom)
    for (var i = currentLayer.elements.length - 1; i >= 0; i--) {
      var element = currentLayer.elements[i];
      if (element.type === 'rectangle') {
        if (annotationUtil.isPointInRectangle(x, y, element)) {
          return element;
        }
      } else if (element.type === 'textbox') {
        if (annotationUtil.isPointInTextBox(x, y, element)) {
          return element;
        }
      } else if (element.type === 'arrow') {
        if (annotationUtil.isPointOnArrow(x, y, element)) {
          return element;
        }
      } else if (element.type === 'image') {
        if (annotationUtil.isPointInImage(x, y, element)) {
          return element;
        }
      }
    }
    
    return null;
  };

  /**
   * Update an element in the current layer
   * @param {string} elementId - The ID of the element to update
   * @param {Object} newData - The new element data
   */
  self.updateElement = function(elementId, newData) {
    var currentLayer = self.getCurrentLayer();
    if (!currentLayer) return false;
    
    var elementIndex = currentLayer.elements.findIndex(el => el.id === elementId);
    if (elementIndex === -1) return false;
    
    newData.id = elementId;
    newData.type = currentLayer.elements[elementIndex].type;
    
    currentLayer.elements[elementIndex] = newData;
    self.redrawLayer(currentLayer.id);
    
    return true;
  };
  
  /**
   * Handle double-click events on annotation canvas for text editing
   */
  self.handleCanvasDoubleClick = function(event, canvas) {
    var canvasCoords = annotationUtil.getCanvasCoordinates(canvas, event);
    var modelCoords = self.canvasToModel(canvasCoords.x, canvasCoords.y);
    
    var currentLayer = self.getCurrentLayer();
    var isOnAnnotationLayer = currentLayer && currentLayer.isAnnotationLayer;
    
    if (!isOnAnnotationLayer) {
      return;
    }
    
    var element = self.getElementAtPoint(modelCoords.x, modelCoords.y);
    if (element && element.type === 'textbox') {
      self.startTextEditing(element, canvas);
    }
  };

  /**
   * Start text editing for a text box
   * @param {Object} textBoxElement - The text box element to edit
   * @param {HTMLCanvasElement} canvas - The canvas element
   */
  self.startTextEditing = function(textBoxElement, canvas) {
    var transformedElement = self.transformElementToCanvas(textBoxElement);

    var input = document.createElement('textarea');
    input.className = 'textbox-edit-input';
    input.style.position = 'absolute';
    input.style.left = transformedElement.x + 'px';
    input.style.top = transformedElement.y + 'px';
    input.style.width = transformedElement.width + 'px';
    input.style.height = transformedElement.height + 'px';
    input.style.border = '2px solid #0066cc';
    input.style.padding = '5px';
    input.style.fontSize = '14px';
    input.style.fontFamily = 'Arial, sans-serif';
    input.style.resize = 'none';
    input.style.zIndex = '9999';
    input.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
    input.value = textBoxElement.text || '';

    var cyContainer = canvas.parentElement;
    cyContainer.appendChild(input);

    input.focus();
    input.select();

    var handleInputComplete = function() {
      textBoxElement.text = input.value;
      input.remove();
      self.redrawLayer(currentLayerId);
      input.removeEventListener('blur', handleInputComplete);
      input.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('click', handleDocumentClick);
    };

    var handleKeyDown = function(e) {
      if (e.key === 'Enter' && e.ctrlKey) {
        e.preventDefault();
        handleInputComplete();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        input.remove();
        input.removeEventListener('blur', handleInputComplete);
        input.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('click', handleDocumentClick);
      }
    };

    var handleDocumentClick = function(e) {
      if (!input.contains(e.target)) {
        handleInputComplete();
      }
    };

    input.addEventListener('blur', handleInputComplete);
    input.addEventListener('keydown', handleKeyDown);
    setTimeout(function() {
      document.addEventListener('click', handleDocumentClick);
    }, 100);
  };
  
  /**
   * Get annotation layers data for saving to file
   * @returns {Object} Annotation layers data
   */
  self.getAnnotationLayersData = function() {
    var layersData = [];
    
    layers.forEach(function(layer) {
      // Only save annotation layers (not the default cytoscape layer)
      if (layer.isAnnotationLayer) {
        layersData.push({
          id: layer.id,
          name: layer.name,
          visible: layer.visible,
          elements: layer.elements,
          createdAt: layer.createdAt,
          zIndex: layer.zIndex
        });
      }
    });
    
    var data = {
      layerCount: layersData.length,
      layers: layersData
    };
    
    return data;
  };

  /**
   * Reset annotation layers to initial state (only default cytoscape layer)
   */
  self.resetAnnotationLayers = function() {
    layers = layers.filter(function(layer) {
      return layer.isDefaultLayer;
    });
    
    // Reset next layer ID
    nextLayerId = 1;
    
    $('[id^="annotation-canvas-layer-"]').remove();
    
    if (selectedElement) {
      self.deselectElement();
    }
    
    self.deselectTool();
    
    self.selectLayer(0);
    
    self.renderLayerList();
    self.updateAnnotationToolStates();
    
    self.setupViewportSynchronization();
  };

  /**
   * Load annotation layers data from loaded file
   * @param {Object} annotationLayersData - The annotation layers data from file
   */
  self.loadAnnotationLayersData = function(annotationLayersData) {
    self.resetAnnotationLayers();
    
    // If no annotation data, we're done (layers are already reset)
    if (!annotationLayersData) {
      return;
    }
    
    if (annotationLayersData.layers && Array.isArray(annotationLayersData.layers)) {
      
      annotationLayersData.layers.forEach(function(layerData) {
        
        var layer = LayerModel(layerData.id, layerData.name, layerData.visible);
        layer.elements = layerData.elements || [];
        layer.createdAt = new Date(layerData.createdAt);
        layer.zIndex = layerData.zIndex || layerData.id;
        layer.isAnnotationLayer = true;
        
        layers.push(layer);
                
        self.createAnnotationCanvas(layer.id);
        
        if (layerData.id >= nextLayerId) {
          nextLayerId = layerData.id + 1;
        }
      });
    }
    
    self.selectLayer(0);
    
    self.renderLayerList();
    
    // Re-establish viewport synchronization for the loaded network
    self.setupViewportSynchronization();
    self.updateViewportState();
    self.redrawAllAnnotationLayers();
  };

  /**
   * Trigger file upload for image annotation
   * @param {Object} clickCoords - The coordinates where the image was clicked (in model coordinates)
   */
  self.triggerImageUpload = function(clickCoords) {
    var currentLayer = self.getCurrentLayer();
    if (!currentLayer || !currentLayer.isAnnotationLayer) {
      return;
    }

    var canvas = self.getAnnotationCanvas(currentLayer.id);
    if (!canvas) {
      console.error('No canvas found for image upload');
      return;
    }

    var activeCy = appUtilities.getActiveCy();
    if (activeCy && activeCy.container()) {
      var cyContainer = activeCy.container();
      var mouseUpEvent = new MouseEvent('mouseup', {
        bubbles: true,
        cancelable: true,
        clientX: 0,
        clientY: 0
      });
      cyContainer.dispatchEvent(mouseUpEvent);
    }

    setTimeout(function() {
      var input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.style.display = 'none';
      input.addEventListener('change', function(event) {
        var file = event.target.files[0];
        if (file) {
          self.processImageUpload(file, clickCoords);
        }
        input.remove(); // Clean up the input element
      });

      document.body.appendChild(input);
      input.click();
    }, 10);
  };

  /**
   * Calculate smart default dimensions for uploaded images
   * @param {number} originalWidth - Original image width
   * @param {number} originalHeight - Original image height
   * @returns {Object} Smart dimensions {width, height}
   */
  self.calculateSmartImageDimensions = function(originalWidth, originalHeight) {
    var activeCy = appUtilities.getActiveCy();
    var viewportWidth = activeCy ? activeCy.width() : 800;
    var viewportHeight = activeCy ? activeCy.height() : 600;
    var maxWidthPercent = 0.4;
    var maxHeightPercent = 0.4;
    var minWidth = 50;
    var minHeight = 50;
    var maxWidth = Math.max(viewportWidth * maxWidthPercent, minWidth);
    var maxHeight = Math.max(viewportHeight * maxHeightPercent, minHeight);
    var aspectRatio = originalWidth / originalHeight;
    var scaledWidth, scaledHeight;
    if (aspectRatio > 1) {
      scaledWidth = Math.min(originalWidth, maxWidth);
      scaledHeight = scaledWidth / aspectRatio;
      if (scaledHeight > maxHeight) {
        scaledHeight = maxHeight;
        scaledWidth = scaledHeight * aspectRatio;
      }
    } else {
      scaledHeight = Math.min(originalHeight, maxHeight);
      scaledWidth = scaledHeight * aspectRatio;
      if (scaledWidth > maxWidth) {
        scaledWidth = maxWidth;
        scaledHeight = scaledWidth / aspectRatio;
      }
    }
    scaledWidth = Math.max(scaledWidth, minWidth);
    scaledHeight = Math.max(scaledHeight, minHeight);
    return {
      width: Math.round(scaledWidth),
      height: Math.round(scaledHeight)
    };
  };

  /**
   * Process the uploaded image and add it as an annotation element
   * @param {File} file - The uploaded image file
   * @param {Object} clickCoords - The coordinates where the image was clicked (in model coordinates)
   */
  self.processImageUpload = function(file, clickCoords) {
    var currentLayer = self.getCurrentLayer();
    if (!currentLayer || !currentLayer.isAnnotationLayer) {
      return;
    }

    var canvas = self.getAnnotationCanvas(currentLayer.id);
    if (!canvas) {
      console.error('No canvas found for image upload processing');
      return;
    }

    var reader = new FileReader();
    reader.onload = function(event) {
      var img = new Image();
      img.onload = function() {
        var smartDimensions = self.calculateSmartImageDimensions(img.width, img.height);
        var imageData = {
          x: clickCoords.x,
          y: clickCoords.y,
          width: smartDimensions.width,
          height: smartDimensions.height,
          imageData: event.target.result,
          type: 'image',
          id: 'image_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
          createdAt: new Date()
        };
        self.addAnnotationElement(currentLayer.id, 'image', imageData);
        self.deselectTool();
      };
      img.onerror = function(e) {
        console.error('Error loading image:', e);
      };
      img.src = event.target.result;
    };
    reader.onerror = function(e) {
      console.error('Error reading image file:', e);
    };
    reader.readAsDataURL(file);
  };

  return {
    init: self.init,
    addLayer: self.addLayer,
    deleteLayer: self.deleteLayer,
    selectLayer: self.selectLayer,
    toggleLayerVisibility: self.toggleLayerVisibility,
    getLayer: self.getLayer,
    getCurrentLayer: self.getCurrentLayer,
    getAllLayers: self.getAllLayers,
    selectTool: self.selectTool,
    addAnnotationElement: self.addAnnotationElement,
    removeAnnotationElement: self.removeAnnotationElement,
    redrawLayer: self.redrawLayer,
    selectElement: self.selectElement,
    deselectElement: self.deselectElement,
    getElementAtPoint: self.getElementAtPoint,
    updateElement: self.updateElement,
    enablePointerEvents: self.enablePointerEvents,
    disablePointerEvents: self.disablePointerEvents,
    setupViewportSynchronization: self.setupViewportSynchronization,
    updateViewportState: self.updateViewportState,
    modelToCanvas: self.modelToCanvas,
    canvasToModel: self.canvasToModel,
    transformElementToCanvas: self.transformElementToCanvas,
    redrawAllAnnotationLayers: self.redrawAllAnnotationLayers,
    startTextEditing: self.startTextEditing,
    getAnnotationLayersData: self.getAnnotationLayersData,
    loadAnnotationLayersData: self.loadAnnotationLayersData,
    resetAnnotationLayers: self.resetAnnotationLayers,
    reinitForNewNetwork: self.reinitForNewNetwork,
    triggerImageUpload: self.triggerImageUpload,
    calculateSmartImageDimensions: self.calculateSmartImageDimensions
  };
};

var annotationLayers = new AnnotationLayers();

module.exports = annotationLayers; 