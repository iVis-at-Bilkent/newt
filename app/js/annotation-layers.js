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

var AnnotationLayers = function() {
  var self = this;
  
  var layers = [];
  var currentLayerId = 0;
  var nextLayerId = 1;
  var layerListContainer = null;
  
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
    
    // Create default layer (Layer 0)
    self.addLayer('Layer 0', true);
    
    self.bindEvents();
    self.updateAnnotationToolStates();
    
    console.log('Annotation Layers System initialized');
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
      console.log('Tool selected:', tool, '(not implemented yet)');
      // TODO: Implement tool selection logic
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
    
    // TODO: Hide/show all elements in this layer
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
    var canvas = document.createElement('canvas');
    canvas.id = 'annotation-canvas-layer-' + layerId;
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = (1000 + layerId).toString();
    
    var cyContainer = $('.sbgn-network-panel');
    cyContainer.append(canvas);
    
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
    
    var ctx = canvas.getContext('2d');
    switch(elementType) {
      case 'rectangle':
        self.drawRectangle(ctx, elementData);
        break;
      case 'arrow':
        self.drawArrow(ctx, elementData);
        break;
      case 'text':
        self.drawText(ctx, elementData);
        break;
      case 'image':
        self.drawImage(ctx, elementData);
        break;
    }
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
  };
};

var annotationLayers = new AnnotationLayers();

module.exports = annotationLayers; 