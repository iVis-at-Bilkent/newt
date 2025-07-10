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
    if (!element || element.type !== 'rectangle') return element;

    var topLeft = self.modelToCanvas(element.x, element.y);
    var bottomRight = self.modelToCanvas(element.x + element.width, element.y + element.height);

    return {
      ...element,
      x: topLeft.x,
      y: topLeft.y,
      width: bottomRight.x - topLeft.x,
      height: bottomRight.y - topLeft.y
    };
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
        default:
          console.warn('Unknown element type:', element.type);
      }
    });
    
    // Draw selection handles for selected element (also transformed)
    if (selectedElement && selectedElement.type === 'rectangle') {
      var transformedSelected = self.transformElementToCanvas(selectedElement);
      annotationUtil.drawSelectionHandles(ctx, transformedSelected);
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
    
    // Get current layer to check if we're on an annotation layer
    var currentLayer = self.getCurrentLayer();
    var isOnAnnotationLayer = currentLayer && currentLayer.isAnnotationLayer;
    
    // Only handle cursor updates on annotation layers
    if (!isOnAnnotationLayer) {
      return;
    }
    
    // Check if we're hovering over an existing annotation
    var hoveredElement = self.getElementAtPoint(modelCoords.x, modelCoords.y);
    
    if (currentTool === 'Add Rectangle') {
      cursor = 'crosshair';
    } else if (selectedElement && selectedElement.type === 'rectangle') {
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
      } else if (annotationUtil.isPointInRectangle(modelCoords.x, modelCoords.y, selectedElement)) {
        cursor = 'move';
      }
    } else if (hoveredElement) {
      cursor = 'pointer';
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
    
    // Check if we're on an annotation layer
    var currentLayer = self.getCurrentLayer();
    var isOnAnnotationLayer = currentLayer && currentLayer.isAnnotationLayer;
    
    // If not on annotation layer, don't handle the event
    if (!isOnAnnotationLayer) {
      return;
    }
    
    if (!currentTool) {
      if (selectedElement && selectedElement.type === 'rectangle') {
        var transformedSelected = self.transformElementToCanvas(selectedElement);
        var handleType = annotationUtil.getHandleAtPoint(canvasCoords.x, canvasCoords.y, transformedSelected);
        if (handleType) {
          isResizing = true;
          resizeHandle = handleType;
          originalElementData = Object.assign({}, selectedElement);
          return;
        } else {
          // Check if clicking inside the selected rectangle (for moving)
          if (annotationUtil.isPointInRectangle(modelCoords.x, modelCoords.y, selectedElement)) {
            isMoving = true;
            moveStartCoords = modelCoords;
            originalElementData = Object.assign({}, selectedElement);
            return;
          }
        }
      }
      
      // Try to select an element at the point
      var element = self.getElementAtPoint(modelCoords.x, modelCoords.y);
      if (element) {
        self.selectElement(element);
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
  };

  /**
   * Handle mouse move events on annotation canvas (for live preview)
   */
  self.handleCanvasMouseMove = function(event, canvas) {
    var canvasCoords = annotationUtil.getCanvasCoordinates(canvas, event);
    var modelCoords = self.canvasToModel(canvasCoords.x, canvasCoords.y);
    var layerId = parseInt(canvas.id.match(/annotation-canvas-layer-(\d+)/)[1]);
    
    // Check if we're on an annotation layer
    var currentLayer = self.getCurrentLayer();
    var isOnAnnotationLayer = currentLayer && currentLayer.isAnnotationLayer;
    
    // If not on annotation layer, don't handle the event
    if (!isOnAnnotationLayer) {
      return;
    }
    
    // Handle resizing
    if (isResizing && selectedElement && resizeHandle) {
      var newRectData = annotationUtil.calculateResizedRectangle(
        resizeHandle, originalElementData, modelCoords.x, modelCoords.y
      );
      
      selectedElement.x = newRectData.x;
      selectedElement.y = newRectData.y;
      selectedElement.width = newRectData.width;
      selectedElement.height = newRectData.height;
      
      self.redrawLayer(currentLayerId);
      return;
    }
    
    // Handle moving
    if (isMoving && selectedElement && moveStartCoords) {
      var deltaX = modelCoords.x - moveStartCoords.x;
      var deltaY = modelCoords.y - moveStartCoords.y;
      
      selectedElement.x = originalElementData.x + deltaX;
      selectedElement.y = originalElementData.y + deltaY;
      
      self.redrawLayer(currentLayerId);
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
  };

  /**
   * Handle mouse up events on annotation canvas
   */
  self.handleCanvasMouseUp = function(event, canvas) {
    
    var canvasCoords = annotationUtil.getCanvasCoordinates(canvas, event);
    var modelCoords = self.canvasToModel(canvasCoords.x, canvasCoords.y);
    
    // Check if we're on an annotation layer
    var currentLayer = self.getCurrentLayer();
    var isOnAnnotationLayer = currentLayer && currentLayer.isAnnotationLayer;
    
    // If not on annotation layer, don't handle the event
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
      
      // Then deselect the tool (this will re-enable Cytoscape interactions)
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
    
    annotationUtil.drawRectangle(ctx, transformedPreview, previewStyles);
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
    // Re-enable Cytoscape interactions when no element is selected
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
    redrawAllAnnotationLayers: self.redrawAllAnnotationLayers
  };
};

var annotationLayers = new AnnotationLayers();

module.exports = annotationLayers; 