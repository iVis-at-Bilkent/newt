/**
 * Annotation Layers System
 * 
 * This module manages annotation layers that can contain independent sets of elements
 * like rectangles, arrows, text, and images. Each layer can be shown/hidden and
 * provides isolation between different sets of annotations.
 * 
 * @author Newt Editor
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
  
  var LayerModel = function(id, name, visible = true) {
    console.log('Creating layer:', id, name, visible);
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
        console.log('Cytoscape is ready, initializing annotation layers');
        
        // Create default layer (Layer 0)
        self.addLayer('Layer 0', true);
        
        self.bindEvents();
        self.updateAnnotationToolStates();
        
        console.log('Annotation Layers System initialized');
      } else {
        console.log('Waiting for cytoscape to be ready...');
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
      self.handleCanvasMouseDown(e, this);
    });
    
    $(document).on('mousemove', '[id^="annotation-canvas-layer-"]', function(e) {
      self.handleCanvasMouseMove(e, this);
    });
    
    $(document).on('mouseup', '[id^="annotation-canvas-layer-"]', function(e) {
      self.handleCanvasMouseUp(e, this);
    });

    // Prevent context menu on canvas
    $(document).on('contextmenu', '[id^="annotation-canvas-layer-"]', function(e) {
      e.preventDefault();
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
    
    console.log('Layer added:', layer);
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
    console.log('Layer deleted:', deletedLayer);
    
    return true;
  };
  
  /**
   * Enable or disable annotation tool buttons based on selected layer
   */
  self.updateAnnotationToolStates = function() {
    console.log('Updating annotation tool states');
    var currentLayer = self.getCurrentLayer();
    var disable = currentLayer && currentLayer.isCytoscapeLayer;
    console.log('Current layer:', currentLayer);
    console.log('Disable:', disable);
    console.log("")
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
    
    currentLayerId = layerId;
    self.renderLayerList();
    self.updateAnnotationToolStates();
    
    console.log('Layer selected:', layer);
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
    
    console.log('Layer visibility toggled:', layer);
    
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
          <button type="button" 
                  class="btn btn-xs btn-default layer-visibility-btn" 
                  data-layer-id="${layer.id}"
                  title="${layer.visible ? 'Hide' : 'Show'} Layer">
            <i class="fa ${visibilityIcon}"></i>
          </button>
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
    console.log('Creating canvas for layer:', layerId);
    
    var canvas = document.createElement('canvas');
    canvas.id = 'annotation-canvas-layer-' + layerId;
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'auto';  // Enable mouse events
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
    
    console.log('Found cytoscape container:', cyContainer);
    console.log('Container dimensions:', cyContainer.offsetWidth, 'x', cyContainer.offsetHeight);
    
    cyContainer.appendChild(canvas);
    
    // Resize canvas to match container
    var resizeSuccess = annotationUtil.resizeCanvas(canvas);
    console.log('Canvas resize success:', resizeSuccess);
    console.log('Canvas dimensions:', canvas.width, 'x', canvas.height);
    
    // Handle window resize
    $(window).on('resize', function() {
      annotationUtil.resizeCanvas(canvas);
      self.redrawLayer(layerId);
    });
    
    console.log('Canvas created for layer:', layerId, 'in container:', cyContainer);
    return canvas;
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
    
    console.log('Adding annotation element:', layerId, elementType, elementData);
    
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
    return annotationUtil.redrawLayer(ctx, layer.elements);
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
    
    console.log('Element removed:', elementId);
    return true;
  };
  
  /**
   * Select an annotation tool
   * @param {string} toolName - Name of the tool (matches button title)
   */
  self.selectTool = function(toolName) {
    var currentLayer = self.getCurrentLayer();
    if (!currentLayer || currentLayer.isCytoscapeLayer) {
      console.log('Cannot use annotation tools on cytoscape layer');
      return false;
    }

    // If clicking the same tool, deselect it
    if (currentTool === toolName) {
      self.deselectTool();
      return true;
    }

    // Update button states
    $('.annotation-layers-controls button').removeClass('active');
    $('.annotation-layers-controls button[title="' + toolName + '"]').addClass('active');
    
    // Set current tool
    currentTool = toolName;
    console.log('Tool selected:', toolName);
    
    // Update cursor based on tool
    self.updateCanvasCursor();
    
    return true;
  };

  /**
   * Deselect the current tool
   */
  self.deselectTool = function() {
    // Remove active state from all buttons
    $('.annotation-layers-controls button').removeClass('active');
    
    // Clear current tool
    currentTool = null;
    console.log('Tool deselected');
    
    // Update cursor to default
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
   * Handle mouse down events on annotation canvas
   */
  self.handleCanvasMouseDown = function(event, canvas) {
    console.log('Mouse down on canvas:', canvas.id, 'Tool:', currentTool);
    
    if (!currentTool || currentTool !== 'Add Rectangle') {
      console.log('No rectangle tool active, ignoring mouse down');
      return;
    }
    
    var currentLayer = self.getCurrentLayer();
    if (!currentLayer || !currentLayer.isAnnotationLayer) {
      console.log('No annotation layer selected, ignoring mouse down');
      return;
    }
    
    isDrawing = true;
    startCoords = annotationUtil.getCanvasCoordinates(canvas, event);
    
    console.log('Starting rectangle draw at:', startCoords);
  };

  /**
   * Handle mouse move events on annotation canvas (for live preview)
   */
  self.handleCanvasMouseMove = function(event, canvas) {
    if (!isDrawing || !startCoords || currentTool !== 'Add Rectangle') return;
    
    var currentCoords = annotationUtil.getCanvasCoordinates(canvas, event);
    var layerId = parseInt(canvas.id.match(/annotation-canvas-layer-(\d+)/)[1]);
    
    console.log('Mouse move on canvas:', canvas.id, 'Coords:', currentCoords);
    
    // Create preview rectangle data
    var rectData = annotationUtil.createRectangleData(
      startCoords.x, startCoords.y, 
      currentCoords.x, currentCoords.y
    );
    
    // Redraw layer with preview
    self.redrawLayerWithPreview(layerId, rectData);
  };

  /**
   * Handle mouse up events on annotation canvas
   */
  self.handleCanvasMouseUp = function(event, canvas) {
    console.log('Mouse up on canvas:', canvas.id);
    
    if (!isDrawing || !startCoords || currentTool !== 'Add Rectangle') {
      console.log('Not drawing or wrong tool, ignoring mouse up');
      return;
    }
    
    var currentCoords = annotationUtil.getCanvasCoordinates(canvas, event);
    var layerId = parseInt(canvas.id.match(/annotation-canvas-layer-(\d+)/)[1]);
    
    // Create final rectangle data
    var rectData = annotationUtil.createRectangleData(
      startCoords.x, startCoords.y, 
      currentCoords.x, currentCoords.y
    );
    
    console.log('Final rectangle data:', rectData);
    
    // Only add if rectangle has meaningful size
    if (rectData.width > 5 && rectData.height > 5) {
      self.addAnnotationElement(layerId, 'rectangle', rectData);
      
      // Deselect the tool after successfully drawing a rectangle
      self.deselectTool();
    }
    
    // Reset drawing state
    isDrawing = false;
    startCoords = null;
    previewElement = null;
    
    console.log('Rectangle drawing completed');
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
    
    // Redraw existing elements
    annotationUtil.redrawLayer(ctx, layer.elements);
    
    // Draw preview with different style
    var previewStyles = {
      strokeColor: '#0066cc',
      fillColor: 'rgba(0, 102, 204, 0.2)',
      lineDash: [5, 5]
    };
    
    annotationUtil.drawRectangle(ctx, previewData, previewStyles);
  };

  /**
   * Get annotation canvas for a specific layer
   */
  self.getAnnotationCanvas = function(layerId) {
    return document.getElementById('annotation-canvas-layer-' + layerId);
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
    redrawLayer: self.redrawLayer
  };
};

var annotationLayers = new AnnotationLayers();

module.exports = annotationLayers; 