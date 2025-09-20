/**
 * Annotation Layers System
 *
 * This module manages annotation layers that can contain independent sets of elements
 * (rectangles, arrows, text, and images). Each layer can be shown/hidden and
 * provides isolation between different sets of annotations.
 *
 */

var jquery = ($ = require("jquery"));
var _ = require("underscore");
var annotationUtil = require("./annotation-util");
var appUtilities = require("./app-utilities");
var colorPickerUtils = require("./color-picker-utils");

var AnnotationLayers = function () {
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
    height: 0,
  };

  var LayerModel = function (id, visible = true, customLayerName = "") {
    return {
      id: id,
      visible: visible,
      elements: [], // Will store rectangles, arrows, text, images
      createdAt: new Date(),
      zIndex: 500 + id,
      isCytoscapeLayer: id === 0, // Layer 0 = Cytoscape canvas
      isAnnotationLayer: id > 0, // Layers 1+ = HTML canvas
      customLayerName: customLayerName,
    };
  };

  /**
   * Initialize the annotation layers system
   */
  self.init = function () {
    layerListContainer = $(".annotation-layers-list");

    // Wait for cytoscape to be ready before creating layers
    var checkCyReady = function () {
      var activeCy = appUtilities.getActiveCy();
      if (activeCy && activeCy.container()) {
        // Create default layer (Layer 0)
        self.addLayer(true, "Map");

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
  self.reinitForNewNetwork = function () {
    // Wait for the new cytoscape instance to be ready
    var checkCyReady = function () {
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
  self.bindEvents = function () {
    // Add layer button
    $(document).on("click", ".add-layer-section button", function (e) {
      e.preventDefault();
      self.addLayer();
    });

    // Layer visibility toggle
    $(document).on("click", ".layer-visibility-btn", function (e) {
      e.preventDefault();
      e.stopPropagation();
      var layerId = parseInt($(this).data("layer-id"));
      self.toggleLayerVisibility(layerId);
    });

    // Delete layer
    $(document).on("click", ".layer-delete-btn", function (e) {
      e.preventDefault();
      e.stopPropagation();
      var layerId = parseInt($(this).data("layer-id"));
      self.deleteLayer(layerId);
    });

    // Layer selection
    $(document).on("click", ".layer-item", function (e) {
      if (!$(e.target).hasClass("btn")) {
        var layerId = parseInt($(this).data("layer-id"));
        self.selectLayer(layerId);
      }
    });

    // Annotation tool buttons
    $(document).on("click", ".annotation-layers-controls button", function (e) {
      e.preventDefault();
      var tool = $(this).attr("title");
      self.selectTool(tool);
    });

    // Delete selected element button
    $(document).on("click", "#delete-selected-element", function (e) {
      e.preventDefault();
      if (selectedElement) {
        self.deleteSelectedElement();
      }
    });

    // Support Delete key for deleting selected annotation element
    $(document).on("keydown", function (e) {
      // Only trigger if Delete key (key code 46 or e.key === 'Delete')
      // and not when focused on an input, textarea, or contenteditable
      var isInput = $(e.target).is('input, textarea, [contenteditable="true"]');
      if (!isInput && (e.key === "Delete" || e.keyCode === 46)) {
        if (selectedElement) {
          self.deleteSelectedElement();
          // Prevent default browser delete behavior (e.g., navigating back)
          e.preventDefault();
          e.stopImmediatePropagation();
        }
      }
    });

    // Canvas mouse events for drawing
    $(document).on(
      "mousedown",
      '[id^="annotation-canvas-layer-"]',
      function (e) {
        // Only prevent default if we're actively drawing, selecting, or moving
        if (currentTool || selectedElement) {
          e.preventDefault();
          e.stopPropagation();
        }
        self.handleCanvasMouseDown(e, this);
      },
    );

    $(document).on(
      "mousemove",
      '[id^="annotation-canvas-layer-"]',
      function (e) {
        // Only prevent default if we're actively drawing, selecting, or moving
        if (currentTool || selectedElement) {
          e.preventDefault();
          e.stopPropagation();
        }
        self.handleCanvasMouseMove(e, this);
        self.updateCursorOnMouseMove(e, this);
      },
    );

    $(document).on("mouseup", '[id^="annotation-canvas-layer-"]', function (e) {
      // Only prevent default if we're actively drawing, selecting, or moving
      if (currentTool || selectedElement) {
        e.preventDefault();
        e.stopPropagation();
      }
      self.handleCanvasMouseUp(e, this);
    });

    // Prevent context menu on canvas
    $(document).on(
      "contextmenu",
      '[id^="annotation-canvas-layer-"]',
      function (e) {
        e.preventDefault();
        e.stopPropagation();
      },
    );

    $(document).on(
      "dblclick",
      '[id^="annotation-canvas-layer-"]',
      function (e) {
        e.preventDefault();
        e.stopPropagation();
        self.handleCanvasDoubleClick(e, this);
      },
    );

    // Add Item button and menu logic
    $(document).on("click", "#annotation-add-item-btn", function (e) {
      e.preventDefault();
      var menu = $("#annotation-add-item-menu");
      var btn = $(this);
      if (menu.is(":visible")) {
        menu.hide();
        btn.removeClass("active");
      } else {
        // Hide any other open menus
        $(".annotation-add-item-menu").hide();
        menu.show();
        btn.addClass("active");
      }
      e.stopPropagation();
    });
    // Menu item click
    $(document).on("click", ".annotation-add-item-menu-entry", function (e) {
      e.preventDefault();
      var tool = $(this).data("tool");
      $("#annotation-add-item-menu").hide();
      $("#annotation-add-item-btn").removeClass("active");
      self.selectTool(tool);
    });
    // Hide menu on outside click
    $(document).on("click", function (e) {
      if (
        !$(e.target).closest("#annotation-add-item-btn").length &&
        !$(e.target).closest("#annotation-add-item-menu").length
      ) {
        $("#annotation-add-item-menu").hide();
        $("#annotation-add-item-btn").removeClass("active");
        self.deselectTool();
      }
    });
  };

  /**
   * Add a new layer
   * @param {boolean} isDefaultLayer - Whether this is the default Layer 0
   * @param {string} customLayerName - Optional user-defined label
   * @returns {number} The ID of the created layer
   */
  self.addLayer = function (
    isDefaultLayer = false,
    customLayerName = "",
  ) {
    var layerId = isDefaultLayer ? 0 : nextLayerId;
    var layer = LayerModel(layerId, true, customLayerName);
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
  self.deleteLayer = function (layerId) {
    var layer = self.getLayer(layerId);
    if (!layer) {
      console.error("Layer not found:", layerId);
      return false;
    }

    // Prevent deletion of the default Layer 0
    if (layer.isDefaultLayer) {
      alert("Layer 0 cannot be deleted. It is the default layer.");
      return false;
    }

    var layerIndex = layers.findIndex((l) => l.id === layerId);
    if (layerIndex === -1) {
      console.error("Layer not found:", layerId);
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
      var defaultLayer = layers.find((l) => l.isDefaultLayer);
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
  self.updateAnnotationToolStates = function () {
    var currentLayer = self.getCurrentLayer();
    var disable = currentLayer && currentLayer.isCytoscapeLayer;
    $(".annotation-layers-controls button")
      .prop("disabled", disable)
      .toggleClass("disabled", disable);

    // Update cursor when layer changes
    self.updateCanvasCursor();
  };

  /**
   * Select a layer as the current active layer
   * @param {number} layerId - The ID of the layer to select
   */
  self.selectLayer = function (layerId) {
    var layer = self.getLayer(layerId);
    if (!layer) {
      console.error("Layer not found:", layerId);
      return false;
    }

    // Deselect any selected elements when switching layers
    if (selectedElement) {
      self.deselectElement();
    }

    // If switching from Cytoscape layer (layer 0) to an annotation layer,
    //  clear Cytoscape selection
    var wasCytoscapeLayer = currentLayerId === 0;
    var isNowAnnotationLayer = layer.isAnnotationLayer;
    if (wasCytoscapeLayer && isNowAnnotationLayer) {
      var activeCy = appUtilities.getActiveCy && appUtilities.getActiveCy();
      if (activeCy && activeCy.elements) {
        activeCy.elements().unselect();
      }
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
  self.toggleLayerVisibility = function (layerId) {
    var layer = self.getLayer(layerId);
    if (!layer) return false;

    layer.visible = !layer.visible;
    self.renderLayerList();

    // Show/hide the canvas element for annotation layers
    if (layer.isAnnotationLayer) {
      var canvas = self.getAnnotationCanvas(layerId);
      if (canvas) {
        canvas.style.display = layer.visible ? "block" : "none";
      }
    }

    return layer.visible;
  };

  /**
   * Get a layer by ID
   * @param {number} layerId - The ID of the layer
   * @returns {Object|null} The layer object or null if not found
   */
  self.getLayer = function (layerId) {
    return layers.find((layer) => layer.id === layerId) || null;
  };

  /**
   * Get the currently selected layer
   * @returns {Object|null} The current layer object or null
   */
  self.getCurrentLayer = function () {
    return self.getLayer(currentLayerId);
  };

  /**
   * Get all layers
   * @returns {Array} Array of all layer objects
   */
  self.getAllLayers = function () {
    return [...layers];
  };

  /**
   * Render the layer list in the UI
   */
  self.renderLayerList = function () {
    if (!layerListContainer) return;

    layerListContainer.empty();

    // Sort layers by zIndex for consistent display order
    var sortedLayers = layers.slice().sort((a, b) => b.zIndex - a.zIndex);

    sortedLayers.forEach(function (layer) {
      var layerElement = self.createLayerElement(layer);
      layerListContainer.append(layerElement);
    });
  };

  /**
   * Create a layer element for the UI
   * @param {Object} layer - The layer object
   * @returns {jQuery} The layer element
   */
  self.createLayerElement = function (layer) {
    var isSelected = layer.id === currentLayerId;
    var visibilityIcon = layer.visible ? "fa-eye" : "fa-eye-slash";
    var isDefaultLayer = layer.isDefaultLayer;

    // Compose display name
    var displayName = "Layer " + layer.id;
    if (layer.customLayerName && layer.customLayerName.trim() !== "") {
      displayName += " (" + layer.customLayerName + ")";
    }
    // Use the highlight-selected.svg as the pen icon
    var penIconHtml = `<i class="fa fa-pencil-square-o layer-edit-pen" title="Edit layer name" style="margin-left:6px; cursor:pointer; vertical-align:middle; font-size:16px;"></i>`;
    var layerHtml = `
      <div class="layer-item ${isSelected ? "selected" : ""}" 
           data-layer-id="${layer.id}" 
           style="display: flex; align-items: center; padding: 8px; 
                  border: 1px solid ${isSelected ? "#337ab7" : "#ddd"}; 
                  border-radius: 4px; margin-bottom: 8px; 
                  background-color: ${isSelected ? "#e7f3ff" : "#f9f9f9"}; 
                  cursor: pointer;">
        <div style="flex: 1; display: flex; align-items: center;">
          <span class="layer-name-text" style="font-weight: ${isSelected ? "bold" : "normal"};">${displayName}</span>
          ${penIconHtml}
        </div>
        <div style="display: flex; gap: 5px;">
          ${
            !isDefaultLayer
              ? `
            <button type="button" 
                    class="btn btn-xs btn-default layer-visibility-btn" 
                    data-layer-id="${layer.id}"
                    title="${layer.visible ? "Hide" : "Show"} Layer">
              <img src="app/img/toolbar/${layer.visible ? "hide-selected-simple.svg" : "show-all.svg"}" alt="${layer.visible ? "Hide" : "Show"}" style="width:16px; height:16px; vertical-align:middle;" />
            </button>
          `
              : ""
          }
          ${
            !isDefaultLayer
              ? `
            <button type="button" 
                    class="btn btn-xs btn-default layer-delete-btn" 
                    data-layer-id="${layer.id}"
                    title="Delete Layer">
              <img src="app/img/toolbar/delete-simple.svg" alt="Delete" style="width:16px; height:16px; vertical-align:middle;" />
            </button>
          `
              : ""
          }
        </div>
      </div>
    `;
    var $el = $(layerHtml);
    // Pen icon click handler
    $el.find(".layer-edit-pen").on("click", function (e) {
      e.stopPropagation();
      var $nameSpan = $el.find(".layer-name-text");
      var currentName = layer.customLayerName || "";
      var $input = $(
        '<input type="text" class="layer-name-input" style="margin-left:4px; width: 120px; font-size: 13px;" />',
      ).val(currentName);
      $nameSpan.replaceWith($input);
      $input.focus();
      $input.select();
      var saveName = function () {
        var newName = $input.val().trim();
        layer.customLayerName = newName;
        self.renderLayerList();
      };
      $input.on("blur", saveName);
      $input.on("keydown", function (ev) {
        if (ev.key === "Enter") {
          $input.blur();
        } else if (ev.key === "Escape") {
          self.renderLayerList();
        }
      });
    });
    return $el;
  };

  /**
   * Create a canvas element for a specific annotation layer
   * @param {number} layerId - The ID of the annotation layer
   */
  self.createAnnotationCanvas = function (layerId) {
    var canvas = document.createElement("canvas");
    canvas.id = "annotation-canvas-layer-" + layerId;
    canvas.style.position = "absolute";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.pointerEvents = "none"; // Disable pointer events by default
    canvas.style.zIndex = (1000 + layerId).toString();

    // Find the active cytoscape container
    var activeCy = appUtilities.getActiveCy();
    if (!activeCy) {
      console.error("No active cytoscape instance found");
      return null;
    }

    var cyContainer = activeCy.container();
    if (!cyContainer) {
      console.error("No cytoscape container found");
      return null;
    }

    cyContainer.appendChild(canvas);

    // Resize canvas to match container
    var resizeSuccess = annotationUtil.resizeCanvas(canvas);

    // Handle window resize
    $(window).on("resize", function () {
      annotationUtil.resizeCanvas(canvas);
      self.redrawLayer(layerId);
    });

    return canvas;
  };

  /**
   * Enable pointer events on all annotation canvases
   */
  self.enablePointerEvents = function () {
    $('[id^="annotation-canvas-layer-"]').css("pointerEvents", "auto");
  };

  /**
   * Disable pointer events on all annotation canvases
   */
  self.disablePointerEvents = function () {
    $('[id^="annotation-canvas-layer-"]').css("pointerEvents", "none");
  };

  /**
   * Enable Cytoscape interactions (node/edge selection, pan, zoom)
   */
  self.enableCytoscapeInteractions = function () {
    var activeCy = appUtilities.getActiveCy();
    if (activeCy) {
      activeCy.panningEnabled(true);
      activeCy.zoomingEnabled(true);
      activeCy.elements().selectify();
      activeCy.boxSelectionEnabled(true);
    }
  };

  /**
   * Disable Cytoscape interactions (node/edge selection, pan, zoom)
   */
  self.disableCytoscapeInteractions = function () {
    var activeCy = appUtilities.getActiveCy();
    if (activeCy) {
      activeCy.panningEnabled(false);
      activeCy.zoomingEnabled(false);
      // activeCy.elements().unselect();
      activeCy.elements().unselectify();
      activeCy.elements().lock();
      activeCy.boxSelectionEnabled(false);
    }
  };

  /**
   * Set up viewport synchronization with Cytoscape
   * We listen for viewport changes and redraw the annotation layers
   * We also listen for resize events and redraw the annotation layers
   */
  self.setupViewportSynchronization = function () {
    var activeCy = appUtilities.getActiveCy();
    if (!activeCy) {
      console.error("No active cytoscape instance found for viewport sync");
      return;
    }

    activeCy.off("viewport");
    activeCy.off("resize");

    self.updateViewportState();

    activeCy.on("viewport", function () {
      self.updateViewportState();
      self.redrawAllAnnotationLayers();
    });

    activeCy.on("resize", function () {
      self.updateViewportState();
      layers.forEach(function (layer) {
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
  self.updateViewportState = function () {
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
      height: height,
    };
  };

  /**
   * Get the current viewport state
   * @returns {Object} The current viewport state
   */
  self.getViewportState = function () {
    return viewportState;
  };

  /**
   * Transform model coordinates to canvas coordinates
   * @param {number} modelX - X coordinate in Cytoscape model space
   * @param {number} modelY - Y coordinate in Cytoscape model space
   * @returns {Object} Canvas coordinates {x, y}
   */
  self.modelToCanvas = function (modelX, modelY) {
    return {
      x: modelX * viewportState.zoom + viewportState.pan.x,
      y: modelY * viewportState.zoom + viewportState.pan.y,
    };
  };

  /**
   * Transform canvas coordinates to model coordinates
   * @param {number} canvasX - X coordinate in canvas space
   * @param {number} canvasY - Y coordinate in canvas space
   * @returns {Object} Model coordinates {x, y}
   */
  self.canvasToModel = function (canvasX, canvasY) {
    return {
      x: (canvasX - viewportState.pan.x) / viewportState.zoom,
      y: (canvasY - viewportState.pan.y) / viewportState.zoom,
    };
  };

  /**
   * Transform an element from model coordinates to canvas coordinates
   * @param {Object} element - Element with x, y, width, height in model coordinates
   * @returns {Object} Element with x, y, width, height in canvas coordinates
   */
  self.transformElementToCanvas = function (element) {
    if (!element) return element;

    if (element.type === "rectangle" || element.type === "textbox") {
      var topLeft = self.modelToCanvas(element.x, element.y);
      var bottomRight = self.modelToCanvas(
        element.x + element.width,
        element.y + element.height,
      );

      return {
        ...element,
        x: topLeft.x,
        y: topLeft.y,
        width: bottomRight.x - topLeft.x,
        height: bottomRight.y - topLeft.y,
      };
    } else if (element.type === "arrow") {
      var startPoint = self.modelToCanvas(element.startX, element.startY);
      var endPoint = self.modelToCanvas(element.endX, element.endY);

      return {
        ...element,
        startX: startPoint.x,
        startY: startPoint.y,
        endX: endPoint.x,
        endY: endPoint.y,
      };
    } else if (element.type === "image") {
      var topLeft = self.modelToCanvas(element.x, element.y);
      var bottomRight = self.modelToCanvas(
        element.x + element.width,
        element.y + element.height,
      );

      return {
        ...element,
        x: topLeft.x,
        y: topLeft.y,
        width: bottomRight.x - topLeft.x,
        height: bottomRight.y - topLeft.y,
      };
    }

    return element;
  };

  /**
   * Redraw all annotation layers with viewport transformations
   */
  self.redrawAllAnnotationLayers = function () {
    layers.forEach(function (layer) {
      if (layer.isAnnotationLayer) {
        self.redrawLayer(layer.id);
      }
    });
  };

  /**
   * Set up layer isolation based on current layer
   * This function handles disabling/enabling interacting with
   * cytoscape nodes and edges.
   * selectify()/lock()/activate() are especially important
   * parts from cytoscape.js API
   *
   * We also have a part in app-cy.js that prevents double clicking on
   * nodes to edit labels if in annotation layer (layer 1+)
   * It is the block that starts with (line 1236):
   *     cy.on('doubleTap', 'node', function (event) {
   */
  self.setupLayerIsolation = function () {
    var currentLayer = self.getCurrentLayer();
    if (!currentLayer) return;
    // Disable Palette tab if in annotation layer, enable if in layer 0
    if (currentLayer.isAnnotationLayer) {
      $("#inspector-palette-tab").addClass("disabled");
      $("#inspector-palette-tab a").on("click.annotationDisable", function (e) {
        e.preventDefault();
        return false;
      });
    } else {
      $("#inspector-palette-tab").removeClass("disabled");
      $("#inspector-palette-tab a").off("click.annotationDisable");
    }

    // If an annotation element is selected, disable Cytoscape interactions
    // to prevent viewport panning when mouse is outside canvas
    if (selectedElement) {
      self.disableCytoscapeInteractions();
      self.enablePointerEvents();
      return;
    }

    var activeCy = appUtilities.getActiveCy();
    if (activeCy) {
      if (currentLayer.isCytoscapeLayer) {
        // Layer 0: unlock and selectify elements
        self.setCytoscapeActiveStyle(true);
        // Clear any lingering :active state on nodes/edges
        if (activeCy.elements().unactivate) {
          activeCy.elements().unactivate();
        } else {
          activeCy.elements().forEach(function (ele) {
            if (ele.active) ele.active(false);
          });
        }
        activeCy.elements().unlock();
        activeCy.elements().selectify();
        self.enableCytoscapeInteractions();
        self.disablePointerEvents();
      } else {
        // Annotation layers: lock and unselectify elements
        self.setCytoscapeActiveStyle(false);
        activeCy.elements().lock();
        activeCy.elements().unselectify();
        self.disableCytoscapeInteractions();
        self.enablePointerEvents();
      }
    }
  };

  /**
   * Set up smart pointer events for annotation layers
   * This allows Cytoscape interactions when not actively drawing/selecting
   */
  self.setupSmartPointerEvents = function () {
    // Initially disable pointer events to allow Cytoscape interactions
    self.disablePointerEvents();
  };

  /**
   * Add an annotation element to a specific layer
   * @param {number} layerId - The ID of the annotation layer
   * @param {string} elementType - Type of element ('rectangle', 'arrow', 'text', 'image')
   * @param {Object} elementData - Data for the element (e.g., { x: 100, y: 100, width: 50, height: 50 })
   */
  self.addAnnotationElement = function (layerId, elementType, elementData) {
    var layer = self.getLayer(layerId);
    if (!layer || !layer.isAnnotationLayer) {
      console.error("Invalid layer for annotations:", layerId);
      return false;
    }

    var canvas = self.getAnnotationCanvas(layerId);
    if (!canvas) {
      console.error("No canvas found for layer:", layerId);
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
  self.redrawLayer = function (layerId) {
    var layer = self.getLayer(layerId);
    if (!layer || !layer.isAnnotationLayer) return false;

    var canvas = self.getAnnotationCanvas(layerId);
    if (!canvas) return false;

    var ctx = canvas.getContext("2d");

    annotationUtil.clearCanvas(ctx);

    // Draw all elements with viewport transformations
    layer.elements.forEach(function (element) {
      var transformedElement = self.transformElementToCanvas(element);

      switch (element.type) {
        case "rectangle":
          annotationUtil.drawRectangle(ctx, transformedElement, element.styles);
          break;
        case "textbox":
          annotationUtil.drawTextBox(ctx, transformedElement, element.styles);
          break;
        case "arrow":
          annotationUtil.drawArrow(ctx, transformedElement, element.styles);
          break;
        case "image":
          annotationUtil.drawImage(ctx, transformedElement, element.styles);
          break;
        default:
          console.warn("Unknown element type:", element.type);
      }
    });

    // Draw selection handles for selected element (also transformed)
    if (selectedElement) {
      var transformedSelected = self.transformElementToCanvas(selectedElement);
      if (selectedElement.type === "rectangle") {
        annotationUtil.drawSelectionHandles(ctx, transformedSelected);
      } else if (selectedElement.type === "textbox") {
        annotationUtil.drawTextBoxSelectionHandles(ctx, transformedSelected);
      } else if (selectedElement.type === "arrow") {
        annotationUtil.drawArrowSelectionHandles(ctx, transformedSelected);
      } else if (selectedElement.type === "image") {
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
  self.removeAnnotationElement = function (layerId, elementId) {
    var layer = self.getLayer(layerId);
    if (!layer) return false;

    var elementIndex = layer.elements.findIndex((el) => el.id === elementId);
    if (elementIndex === -1) return false;

    layer.elements.splice(elementIndex, 1);
    self.redrawLayer(layerId);

    return true;
  };

  /**
   * Select an annotation tool
   * @param {string} toolName - Name of the tool (matches button title)
   */
  self.selectTool = function (toolName) {
    var currentLayer = self.getCurrentLayer();
    if (!currentLayer || currentLayer.isCytoscapeLayer) {
      return false;
    }

    // If clicking the same tool, deselect it
    if (currentTool === toolName) {
      self.deselectTool();
      return true;
    }

    $(".annotation-layers-controls button").removeClass("active");
    $('.annotation-layers-controls button[title="' + toolName + '"]').addClass(
      "active",
    );

    currentTool = toolName;

    // Enable pointer events immediately when a tool is selected
    self.enablePointerEvents();

    // Hide delete button when tool is selected
    $(".annotation-element-delete").hide();

    self.updateCanvasCursor();

    return true;
  };

  /**
   * Deselect the current tool
   */
  self.deselectTool = function () {
    $(".annotation-layers-controls button").removeClass("active");
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
   * Enable or disable Cytoscape :active style overlay
   * @param {boolean} enabled - true to show, false to hide
   */
  self.setCytoscapeActiveStyle = function (enabled) {
    var cy = appUtilities.getActiveCy();
    if (!cy) return;
    var style = cy.style();

    if (enabled) {
      // Restore the normal :active style (match your default, or reapply from sbgn-cy-instance-factory.js)
      style.selector("node:active").css({
        // "background-opacity": 0.7,
        // "overlay-color": "#89898a", // or your selectionColor
        // "overlay-padding": "14"
        "overlay-color": "black",
        "overlay-padding": 10,
        "overlay-opacity": 0.25,
      });
      style.selector("edge:active").css({
        // "background-opacity": 0.7,
        "overlay-color": "black",
        "overlay-padding": 10,
        "overlay-opacity": 0.25,
        // "overlay-color": "#89898a",
        // "overlay-padding": "8"
      });
    } else {
      // Hide the :active overlay
      style.selector("node:active").css({
        // "background-opacity": 1,
        "overlay-color": "black",
        "overlay-padding": 0,
        "overlay-opacity": 0.0,
        // "overlay-color": "rgba(255, 255, 255, 0)",
        // "overlay-padding": 0
      });
      style.selector("edge:active").css({
        // "background-opacity": 1,
        "overlay-color": "black",
        "overlay-padding": 0,
        "overlay-opacity": 0.0,
        // "overlay-color": "rgba(255, 255, 255, 0)",
        // "overlay-padding": 0
      });
    }
    style.update();
  };

  /**
   * Update cursor style for all annotation canvases
   */
  self.updateCanvasCursor = function () {
    var cursor = "default";
    if (currentTool === "Add Rectangle") {
      cursor = "crosshair";
    } else if (currentTool === "Add Text") {
      cursor = "crosshair";
    } else if (currentTool === "Add Arrow") {
      cursor = "crosshair";
    } else if (currentTool === "Add Image") {
      cursor = "crosshair";
    }

    $('[id^="annotation-canvas-layer-"]').css("cursor", cursor);
  };

  /**
   * Update cursor based on mouse position over canvas
   */
  self.updateCursorOnMouseMove = function (event, canvas) {
    var canvasCoords = annotationUtil.getCanvasCoordinates(canvas, event);
    var modelCoords = self.canvasToModel(canvasCoords.x, canvasCoords.y);
    var cursor = "default";

    var currentLayer = self.getCurrentLayer();
    var isOnAnnotationLayer = currentLayer && currentLayer.isAnnotationLayer;

    if (!isOnAnnotationLayer) {
      return;
    }

    var hoveredElement = self.getElementAtPoint(modelCoords.x, modelCoords.y);

    if (currentTool === "Add Rectangle") {
      cursor = "crosshair";
    } else if (currentTool === "Add Text") {
      cursor = "crosshair";
    } else if (currentTool === "Add Arrow") {
      cursor = "crosshair";
    } else if (currentTool === "Add Image") {
      cursor = "crosshair";
    } else if (
      selectedElement &&
      (selectedElement.type === "rectangle" ||
        selectedElement.type === "textbox")
    ) {
      var transformedSelected = self.transformElementToCanvas(selectedElement);
      var handleType = annotationUtil.getHandleAtPoint(
        canvasCoords.x,
        canvasCoords.y,
        transformedSelected,
      );
      if (handleType) {
        switch (handleType) {
          case "top-left":
          case "bottom-right":
            cursor = "nw-resize";
            break;
          case "top-right":
          case "bottom-left":
            cursor = "ne-resize";
            break;
          case "top":
          case "bottom":
            cursor = "ns-resize";
            break;
          case "left":
          case "right":
            cursor = "ew-resize";
            break;
        }
      } else {
        var isInside = false;
        if (selectedElement.type === "rectangle") {
          isInside = annotationUtil.isPointInRectangle(
            modelCoords.x,
            modelCoords.y,
            selectedElement,
          );
        } else if (selectedElement.type === "textbox") {
          isInside = annotationUtil.isPointInTextBox(
            modelCoords.x,
            modelCoords.y,
            selectedElement,
          );
        }

        if (isInside) {
          cursor = "move";
        }
      }
    } else if (selectedElement && selectedElement.type === "arrow") {
      var transformedSelected = self.transformElementToCanvas(selectedElement);
      var handleType = annotationUtil.getArrowHandleAtPoint(
        canvasCoords.x,
        canvasCoords.y,
        transformedSelected,
      );
      if (handleType) {
        cursor = handleType === "tail" ? "nw-resize" : "ne-resize";
      } else {
        var isOnArrow = annotationUtil.isPointOnArrow(
          modelCoords.x,
          modelCoords.y,
          selectedElement,
        );
        if (isOnArrow) {
          cursor = "move";
        }
      }
    } else if (selectedElement && selectedElement.type === "image") {
      var transformedSelected = self.transformElementToCanvas(selectedElement);
      var handleType = annotationUtil.getHandleAtPoint(
        canvasCoords.x,
        canvasCoords.y,
        transformedSelected,
      );
      if (handleType) {
        switch (handleType) {
          case "top-left":
          case "bottom-right":
            cursor = "nw-resize";
            break;
          case "top-right":
          case "bottom-left":
            cursor = "ne-resize";
            break;
          case "top":
          case "bottom":
            cursor = "ns-resize";
            break;
          case "left":
          case "right":
            cursor = "ew-resize";
            break;
        }
      } else {
        var isInside = annotationUtil.isPointInImage(
          modelCoords.x,
          modelCoords.y,
          selectedElement,
        );
        if (isInside) {
          cursor = "move";
        }
      }
    } else if (hoveredElement) {
      cursor = "move";
    }

    canvas.style.cursor = cursor;
  };

  /**
   * Handle mouse down events on annotation canvas
   */
  self.handleCanvasMouseDown = function (event, canvas) {
    var canvasCoords = annotationUtil.getCanvasCoordinates(canvas, event);
    var modelCoords = self.canvasToModel(canvasCoords.x, canvasCoords.y);
    var layerId = parseInt(canvas.id.match(/annotation-canvas-layer-(\d+)/)[1]);

    var currentLayer = self.getCurrentLayer();
    var isOnAnnotationLayer = currentLayer && currentLayer.isAnnotationLayer;

    if (!isOnAnnotationLayer) {
      return;
    }

    if (!currentTool) {
      if (
        selectedElement &&
        (selectedElement.type === "rectangle" ||
          selectedElement.type === "textbox")
      ) {
        var transformedSelected =
          self.transformElementToCanvas(selectedElement);
        var handleType = annotationUtil.getHandleAtPoint(
          canvasCoords.x,
          canvasCoords.y,
          transformedSelected,
        );
        if (handleType) {
          isResizing = true;
          resizeHandle = handleType;
          originalElementData = Object.assign({}, selectedElement);
          return;
        } else {
          var isInside = false;
          if (selectedElement.type === "rectangle") {
            isInside = annotationUtil.isPointInRectangle(
              modelCoords.x,
              modelCoords.y,
              selectedElement,
            );
          } else if (selectedElement.type === "textbox") {
            isInside = annotationUtil.isPointInTextBox(
              modelCoords.x,
              modelCoords.y,
              selectedElement,
            );
          }

          if (isInside) {
            isMoving = true;
            moveStartCoords = modelCoords;
            originalElementData = Object.assign({}, selectedElement);
            return;
          }
        }
      } else if (selectedElement && selectedElement.type === "arrow") {
        var transformedSelected =
          self.transformElementToCanvas(selectedElement);
        var handleType = annotationUtil.getArrowHandleAtPoint(
          canvasCoords.x,
          canvasCoords.y,
          transformedSelected,
        );
        if (handleType) {
          isResizing = true;
          resizeHandle = handleType;
          originalElementData = Object.assign({}, selectedElement);
          return;
        } else {
          var isOnArrow = annotationUtil.isPointOnArrow(
            modelCoords.x,
            modelCoords.y,
            selectedElement,
          );
          if (isOnArrow) {
            isMoving = true;
            moveStartCoords = modelCoords;
            originalElementData = Object.assign({}, selectedElement);
            return;
          }
        }
      } else if (selectedElement && selectedElement.type === "image") {
        var transformedSelected =
          self.transformElementToCanvas(selectedElement);
        var handleType = annotationUtil.getHandleAtPoint(
          canvasCoords.x,
          canvasCoords.y,
          transformedSelected,
        );
        if (handleType) {
          isResizing = true;
          resizeHandle = handleType;
          originalElementData = Object.assign({}, selectedElement);
          return;
        } else {
          var isInside = annotationUtil.isPointInImage(
            modelCoords.x,
            modelCoords.y,
            selectedElement,
          );
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

    if (currentTool === "Add Rectangle") {
      var currentLayer = self.getCurrentLayer();
      if (!currentLayer || !currentLayer.isAnnotationLayer) {
        return;
      }

      isDrawing = true;
      startCoords = modelCoords;
    }

    if (currentTool === "Add Text") {
      var currentLayer = self.getCurrentLayer();
      if (!currentLayer || !currentLayer.isAnnotationLayer) {
        return;
      }

      isDrawing = true;
      startCoords = modelCoords;
    }

    if (currentTool === "Add Arrow") {
      var currentLayer = self.getCurrentLayer();
      if (!currentLayer || !currentLayer.isAnnotationLayer) {
        return;
      }

      isDrawing = true;
      startCoords = modelCoords;
    }

    if (currentTool === "Add Image") {
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
  self.handleCanvasMouseMove = function (event, canvas) {
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
      if (
        selectedElement.type === "rectangle" ||
        selectedElement.type === "textbox"
      ) {
        var newRectData = annotationUtil.calculateResizedRectangle(
          resizeHandle,
          originalElementData,
          modelCoords.x,
          modelCoords.y,
        );

        selectedElement.x = newRectData.x;
        selectedElement.y = newRectData.y;
        selectedElement.width = newRectData.width;
        selectedElement.height = newRectData.height;
      } else if (selectedElement.type === "arrow") {
        var updatedArrow = annotationUtil.updateArrowPosition(
          originalElementData,
          resizeHandle,
          modelCoords.x,
          modelCoords.y,
        );

        selectedElement.startX = updatedArrow.startX;
        selectedElement.startY = updatedArrow.startY;
        selectedElement.endX = updatedArrow.endX;
        selectedElement.endY = updatedArrow.endY;
      } else if (selectedElement.type === "image") {
        var newRectData = annotationUtil.calculateResizedRectangle(
          resizeHandle,
          originalElementData,
          modelCoords.x,
          modelCoords.y,
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

      var canvasStartCoords = self.modelToCanvas(
        moveStartCoords.x,
        moveStartCoords.y,
      );
      var canvasDistance = Math.sqrt(
        Math.pow(canvasCoords.x - canvasStartCoords.x, 2) +
          Math.pow(canvasCoords.y - canvasStartCoords.y, 2),
      );

      // Only start moving if the mouse has moved a minimum distance (5 pixels in canvas space)
      if (canvasDistance > 5) {
        if (
          selectedElement.type === "rectangle" ||
          selectedElement.type === "textbox"
        ) {
          selectedElement.x = originalElementData.x + deltaX;
          selectedElement.y = originalElementData.y + deltaY;
        } else if (selectedElement.type === "arrow") {
          selectedElement.startX = originalElementData.startX + deltaX;
          selectedElement.startY = originalElementData.startY + deltaY;
          selectedElement.endX = originalElementData.endX + deltaX;
          selectedElement.endY = originalElementData.endY + deltaY;
        } else if (selectedElement.type === "image") {
          selectedElement.x = originalElementData.x + deltaX;
          selectedElement.y = originalElementData.y + deltaY;
        }

        self.redrawLayer(currentLayerId);
      }
      return;
    }

    // Handle drawing preview
    if (isDrawing && startCoords && currentTool === "Add Rectangle") {
      var rectData = annotationUtil.createRectangleData(
        startCoords.x,
        startCoords.y,
        modelCoords.x,
        modelCoords.y,
      );

      self.redrawLayerWithPreview(currentLayerId, rectData);
    }

    if (isDrawing && startCoords && currentTool === "Add Text") {
      var textBoxData = annotationUtil.createTextBoxData(
        startCoords.x,
        startCoords.y,
        modelCoords.x,
        modelCoords.y,
      );

      self.redrawLayerWithPreview(currentLayerId, textBoxData);
    }

    if (isDrawing && startCoords && currentTool === "Add Arrow") {
      var arrowData = annotationUtil.createArrowData(
        startCoords.x,
        startCoords.y,
        modelCoords.x,
        modelCoords.y,
      );

      self.redrawLayerWithPreview(currentLayerId, arrowData);
    }
  };

  /**
   * Handle mouse up events on annotation canvas
   */
  self.handleCanvasMouseUp = function (event, canvas) {
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
    if (isDrawing && startCoords && currentTool === "Add Rectangle") {
      // Create final rectangle data (in model coordinates)
      var rectData = annotationUtil.createRectangleData(
        startCoords.x,
        startCoords.y,
        modelCoords.x,
        modelCoords.y,
      );

      if (rectData.width > 5 && rectData.height > 5) {
        self.addAnnotationElement(currentLayerId, "rectangle", rectData);
      }

      startCoords = null;
      previewElement = null;

      // Dispatch a synthetic mouseup event to Cytoscape container to end any drag state
      var activeCy = appUtilities.getActiveCy();
      if (activeCy && activeCy.container()) {
        var cyContainer = activeCy.container();
        var mouseUpEvent = new MouseEvent("mouseup", {
          bubbles: true,
          cancelable: true,
          clientX: 0,
          clientY: 0,
        });
        cyContainer.dispatchEvent(mouseUpEvent);
      }

      self.deselectTool();
    }

    if (isDrawing && startCoords && currentTool === "Add Text") {
      var textBoxData = annotationUtil.createTextBoxData(
        startCoords.x,
        startCoords.y,
        modelCoords.x,
        modelCoords.y,
      );

      if (textBoxData.width > 5 && textBoxData.height > 5) {
        self.addAnnotationElement(currentLayerId, "textbox", textBoxData);
      }

      startCoords = null;
      previewElement = null;

      var activeCy = appUtilities.getActiveCy();
      if (activeCy && activeCy.container()) {
        var cyContainer = activeCy.container();
        var mouseUpEvent = new MouseEvent("mouseup", {
          bubbles: true,
          cancelable: true,
          clientX: 0,
          clientY: 0,
        });
        cyContainer.dispatchEvent(mouseUpEvent);
      }

      self.deselectTool();
    }

    if (isDrawing && startCoords && currentTool === "Add Arrow") {
      var arrowData = annotationUtil.createArrowData(
        startCoords.x,
        startCoords.y,
        modelCoords.x,
        modelCoords.y,
      );

      var distance = Math.sqrt(
        Math.pow(modelCoords.x - startCoords.x, 2) +
          Math.pow(modelCoords.y - startCoords.y, 2),
      );

      if (distance > 10) {
        self.addAnnotationElement(currentLayerId, "arrow", arrowData);
      }

      startCoords = null;
      previewElement = null;

      var activeCy = appUtilities.getActiveCy();
      if (activeCy && activeCy.container()) {
        var cyContainer = activeCy.container();
        var mouseUpEvent = new MouseEvent("mouseup", {
          bubbles: true,
          cancelable: true,
          clientX: 0,
          clientY: 0,
        });
        cyContainer.dispatchEvent(mouseUpEvent);
      }

      self.deselectTool();
    }
  };

  /**
   * Redraw a layer with a preview element
   */
  self.redrawLayerWithPreview = function (layerId, previewData) {
    var layer = self.getLayer(layerId);
    if (!layer) return;

    var canvas = self.getAnnotationCanvas(layerId);
    if (!canvas) return;

    var ctx = canvas.getContext("2d");

    annotationUtil.clearCanvas(ctx);

    layer.elements.forEach(function (element) {
      var transformedElement = self.transformElementToCanvas(element);
      switch (element.type) {
        case "rectangle":
          annotationUtil.drawRectangle(ctx, transformedElement, element.styles);
          break;
        case "textbox":
          annotationUtil.drawTextBox(ctx, transformedElement, element.styles);
          break;
        case "arrow":
          annotationUtil.drawArrow(ctx, transformedElement, element.styles);
          break;
        case "image":
          annotationUtil.drawImage(ctx, transformedElement, element.styles);
          break;
        default:
          console.warn("Unknown element type:", element.type);
      }
    });

    var transformedPreview = self.transformElementToCanvas(previewData);
    var previewStyles = {
      strokeColor: "rgba(0, 102, 204, 1)",
      fillColor: "rgba(0, 102, 204, 0.2)",
      lineDash: [5, 5],
    };

    if (previewData.type === "rectangle") {
      annotationUtil.drawRectangle(ctx, transformedPreview, previewStyles);
    } else if (previewData.type === "textbox") {
      annotationUtil.drawTextBox(ctx, transformedPreview, previewStyles);
    } else if (previewData.type === "arrow") {
      annotationUtil.drawArrow(ctx, transformedPreview, previewStyles);
    } else if (previewData.type === "image") {
      annotationUtil.drawImage(ctx, transformedPreview, previewStyles);
    }
  };

  /**
   * Get annotation canvas for a specific layer
   */
  self.getAnnotationCanvas = function (layerId) {
    return document.getElementById("annotation-canvas-layer-" + layerId);
  };

  /**
   * Select an element in the current layer
   * @param {Object} element - The element to select
   */
  self.selectElement = function (element) {
    selectedElement = element;
    self.disableCytoscapeInteractions();
    self.enablePointerEvents();
    self.redrawLayer(currentLayerId);
    $(".annotation-element-delete").show();
    // Hide Add Item button/menu when an item is selected
    $(".annotation-layers-controls").hide();
    // Focus on Map tab and expand Annotation Layers section when an item is selected
    if (window.$) {
      $("#inspector-map-tab a").tab("show");
      $("#sbgn-inspector-map-annotation-layers").collapse("show");
    }

    $("#annotation-font-size-container").remove();
    $("#annotation-rect-fillcolor-container").remove();
    $("#annotation-arrow-style-container").remove();
    $("#annotation-rect-bordercolor-container").remove();
    $("#annotation-textbox-bordercolor-container").remove();
    $("#annotation-textbox-fillcolor-container").remove();
    $("#annotation-element-properties-table").remove();

    var table = $(
      '<table id="annotation-element-properties-table" cellpadding="0" cellspacing="0" width="100%" class="table-condensed layout-table dialog-table map-panel-table object-panel-table" style="margin-top: 10px; margin-bottom: 10px;"></table>',
    );
    var width = 120;
    var buttonwidth = 50;

    if (selectedElement && selectedElement.type === "rectangle") {
      // Border color
      var borderColor =
        selectedElement.styles && selectedElement.styles.strokeColor
          ? selectedElement.styles.strokeColor
          : annotationUtil.defaultStyles.rectangle.strokeColor;
      var borderRow = $("<tr></tr>");
      borderRow.append(
        '<td style="width: ' +
          width +
          'px; text-align:right; padding-right: 5px;">Border Color</td>',
      );
      borderRow.append(
        '<td style="padding-left: 5px; text-align:left;">' +
          '<input id="annotation-rect-bordercolor-input" class="inspector-input-box" type="color" value="' +
          rgbToHex(borderColor) +
          '" style="width:' +
          buttonwidth +
          'px;">' +
          "</td>",
      );
      table.append(borderRow);
      // Fill color row
      var fillColor =
        selectedElement.styles && selectedElement.styles.fillColor
          ? selectedElement.styles.fillColor
          : "rgba(255,255,255,0)";
      var match = fillColor.match(
        /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d\.]+))?\)/,
      );
      var r = 255,
        g = 255,
        b = 255,
        a = 0;
      if (match) {
        r = parseInt(match[1]);
        g = parseInt(match[2]);
        b = parseInt(match[3]);
        a = match[4] !== undefined ? parseFloat(match[4]) : 1;
      }
      var hex =
        "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
      var fillColorRow = $("<tr></tr>");
      fillColorRow.append(
        '<td style="width: ' +
          width +
          'px; text-align:right; padding-right: 5px;">Fill Color</td>',
      );
      fillColorRow.append(
        '<td style="padding-left: 5px; text-align:left;">' +
          '<input id="annotation-rect-fillcolor-input" class="inspector-input-box" type="color" value="' +
          hex +
          '" style="width:' +
          buttonwidth +
          'px;">' +
          "</td>",
      );
      table.append(fillColorRow);
      // Transparency row
      var transparencyRow = $("<tr></tr>");
      transparencyRow.append(
        '<td style="width: ' +
          width +
          'px; text-align:right; padding-right: 5px;">Transparency</td>',
      );
      transparencyRow.append(
        '<td style="padding-left: 5px; text-align:left;">' +
          '<span style="display:inline-flex;align-items:center;">' +
          '<input id="annotation-rect-fillalpha-input" class="inspector-input-box" type="range" min="0" max="100" step="1" value="' +
          (1 - a) * 100 +
          '" style="width:80px; vertical-align:middle; margin-left:2px;">' +
          '<span id="annotation-rect-fillalpha-value" style="margin-left:8px; min-width:24px; display:inline-block; text-align:right;">' +
          Math.round((1 - a) * 100) +
          "</span></span></td>",
      );
      table.append(transparencyRow);
    }
    if (selectedElement && selectedElement.type === "textbox") {
      // Border color
      var borderColor =
        selectedElement.styles && selectedElement.styles.strokeColor
          ? selectedElement.styles.strokeColor
          : "rgba(0,153,255,1)";
      var borderRow = $("<tr></tr>");
      borderRow.append(
        '<td style="width: ' +
          width +
          'px; text-align:right; padding-right: 5px;">Border Color</td>',
      );
      borderRow.append(
        '<td style="padding-left: 5px; text-align:left;">' +
          '<input id="annotation-textbox-bordercolor-input" class="inspector-input-box" type="color" value="' +
          rgbToHex(borderColor) +
          '" style="width:' +
          buttonwidth +
          'px;">' +
          "</td>",
      );
      table.append(borderRow);
      // Fill color row
      var fillColor =
        selectedElement.styles && selectedElement.styles.fillColor
          ? selectedElement.styles.fillColor
          : "rgba(255,255,255,0)";
      var match = fillColor.match(
        /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d\.]+))?\)/,
      );
      var r = 255,
        g = 255,
        b = 255,
        a = 0;
      if (match) {
        r = parseInt(match[1]);
        g = parseInt(match[2]);
        b = parseInt(match[3]);
        a = match[4] !== undefined ? parseFloat(match[4]) : 1;
      }
      var hex =
        "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
      var fillColorRow = $("<tr></tr>");
      fillColorRow.append(
        '<td style="width: ' +
          width +
          'px; text-align:right; padding-right: 5px;">Fill Color</td>',
      );
      fillColorRow.append(
        '<td style="padding-left: 5px; text-align:left;">' +
          '<input id="annotation-textbox-fillcolor-input" class="inspector-input-box" type="color" value="' +
          hex +
          '" style="width:' +
          buttonwidth +
          'px;">' +
          "</td>",
      );
      table.append(fillColorRow);
      // Transparency row
      var transparencyRow = $("<tr></tr>");
      transparencyRow.append(
        '<td style="width: ' +
          width +
          'px; text-align:right; padding-right: 5px;">Transparency</td>',
      );
      transparencyRow.append(
        '<td style="padding-left: 5px; text-align:left;">' +
          '<span style="display:inline-flex;align-items:center;">' +
          '<input id="annotation-textbox-fillalpha-input" class="inspector-input-box" type="range" min="0" max="100" step="1" value="' +
          (1 - a) * 100 +
          '" style="width:80px; vertical-align:middle; margin-left:2px;">' +
          '<span id="annotation-textbox-fillalpha-value" style="margin-left:8px; min-width:24px; display:inline-block; text-align:right;">' +
          Math.round((1 - a) * 100) +
          "</span></span></td>",
      );
      table.append(transparencyRow);
      // Font settings row (three-dot label, inspector style)
      var fontSettingsRow = $("<tr></tr>");
      fontSettingsRow.append(
        '<td style="width: ' +
          width +
          'px; text-align:right; padding-right: 5px;">Font</td>',
      );
      fontSettingsRow.append(
        '<td style="padding-left: 5px;">' +
          '<label id="annotation-textbox-font" style="cursor: pointer; width: 50px;">...</label>' +
          "</td>",
      );
      table.append(fontSettingsRow);
    }
    if (selectedElement && selectedElement.type === "arrow") {
      var defaultArrowStyles = annotationUtil.defaultStyles.arrow || {
        strokeColor: "#ff0000",
        lineWidth: 7,
      };
      var strokeColor =
        selectedElement.styles && selectedElement.styles.strokeColor
          ? selectedElement.styles.strokeColor
          : defaultArrowStyles.strokeColor;
      var lineWidth =
        selectedElement.styles && selectedElement.styles.lineWidth
          ? selectedElement.styles.lineWidth
          : defaultArrowStyles.lineWidth;
      var colorRow = $("<tr></tr>");
      colorRow.append(
        '<td style="width: ' +
          width +
          'px; text-align:right; padding-right: 5px;">Arrow Color</td>',
      );
      colorRow.append(
        '<td style="padding-left: 5px; text-align:left;">' +
          '<input id="annotation-arrow-color-input" class="inspector-input-box" type="color" value="' +
          rgbToHex(strokeColor) +
          '" style="width:' +
          buttonwidth +
          'px;">' +
          "</td>",
      );
      table.append(colorRow);
      var widthRow = $("<tr></tr>");
      widthRow.append(
        '<td style="width: ' +
          width +
          'px; text-align:right; padding-right: 5px;">Arrow Width</td>',
      );
      widthRow.append(
        '<td style="padding-left: 5px; text-align:left;">' +
          '<input id="annotation-arrow-width-input" class="inspector-input-box" type="number" min="1" max="30" step="1" value="' +
          lineWidth +
          '" style="width:60px;"></td>',
      );
      table.append(widthRow);
    }
    if (selectedElement && selectedElement.type === "image") {
      var deleteRow = $("<tr></tr>");
      deleteRow.append(
        '<td colspan="2" style="text-align:center; padding-top: 10px;"><button type="button" class="btn btn-default btn-sm" id="delete-selected-element"><i class="fa fa-trash"></i> Delete Item</button></td>',
      );
      table.append(deleteRow);
    } else {
      var deleteRow = $("<tr></tr>");
      deleteRow.append(
        '<td colspan="2" style="text-align:center; padding-top: 10px;"><button type="button" class="btn btn-default btn-sm" id="delete-selected-element"><i class="fa fa-trash"></i> Delete Item</button></td>',
      );
      table.append(deleteRow);
    }
    // Insert table after annotation-layers-controls
    $(".annotation-layers-controls").after(table);
    // Hide old delete button
    $(".annotation-element-delete").hide();
    // Bind events
    colorPickerUtils.bindPicker2Input(
      "#annotation-rect-bordercolor-input",
      function () {
        var hex = $("#annotation-rect-bordercolor-input").val();
        var bigint = parseInt(hex.slice(1), 16);
        var r = (bigint >> 16) & 255;
        var g = (bigint >> 8) & 255;
        var b = bigint & 255;
        if (!selectedElement.styles) selectedElement.styles = {};
        selectedElement.styles.strokeColor =
          "rgba(" + r + "," + g + "," + b + ",1)";
        self.redrawLayer(currentLayerId);
      },
    );
    colorPickerUtils.bindPicker2Input(
      "#annotation-rect-fillcolor-input",
      function () {
        var hex = $("#annotation-rect-fillcolor-input").val();
        var alpha =
          1 - parseFloat($("#annotation-rect-fillalpha-input").val()) / 100;
        var bigint = parseInt(hex.slice(1), 16);
        var r = (bigint >> 16) & 255;
        var g = (bigint >> 8) & 255;
        var b = bigint & 255;
        if (!selectedElement.styles) selectedElement.styles = {};
        selectedElement.styles.fillColor =
          "rgba(" + r + "," + g + "," + b + "," + alpha + ")";
        self.redrawLayer(currentLayerId);
      },
    );
    $("#annotation-rect-fillalpha-input").on("input", function () {
      var hex = $("#annotation-rect-fillcolor-input").val();
      var alpha =
        1 - parseFloat($("#annotation-rect-fillalpha-input").val()) / 100;
      var bigint = parseInt(hex.slice(1), 16);
      var r = (bigint >> 16) & 255;
      var g = (bigint >> 8) & 255;
      var b = bigint & 255;
      if (!selectedElement.styles) selectedElement.styles = {};
      selectedElement.styles.fillColor =
        "rgba(" + r + "," + g + "," + b + "," + alpha + ")";
      $("#annotation-rect-fillalpha-value").text(
        $("#annotation-rect-fillalpha-input").val(),
      );
      self.redrawLayer(currentLayerId);
    });
    colorPickerUtils.bindPicker2Input(
      "#annotation-textbox-bordercolor-input",
      function () {
        var hex = $("#annotation-textbox-bordercolor-input").val();
        var bigint = parseInt(hex.slice(1), 16);
        var r = (bigint >> 16) & 255;
        var g = (bigint >> 8) & 255;
        var b = bigint & 255;
        if (!selectedElement.styles) selectedElement.styles = {};
        selectedElement.styles.strokeColor =
          "rgba(" + r + "," + g + "," + b + ",1)";
        self.redrawLayer(currentLayerId);
      },
    );
    colorPickerUtils.bindPicker2Input(
      "#annotation-textbox-fillcolor-input",
      function () {
        var hex = $("#annotation-textbox-fillcolor-input").val();
        var alpha =
          1 - parseFloat($("#annotation-textbox-fillalpha-input").val()) / 100;
        var bigint = parseInt(hex.slice(1), 16);
        var r = (bigint >> 16) & 255;
        var g = (bigint >> 8) & 255;
        var b = bigint & 255;
        if (!selectedElement.styles) selectedElement.styles = {};
        selectedElement.styles.fillColor =
          "rgba(" + r + "," + g + "," + b + "," + alpha + ")";
        self.redrawLayer(currentLayerId);
      },
    );
    $("#annotation-textbox-fillalpha-input").on("input", function () {
      var hex = $("#annotation-textbox-fillcolor-input").val();
      var alpha =
        1 - parseFloat($("#annotation-textbox-fillalpha-input").val()) / 100;
      var bigint = parseInt(hex.slice(1), 16);
      var r = (bigint >> 16) & 255;
      var g = (bigint >> 8) & 255;
      var b = bigint & 255;
      if (!selectedElement.styles) selectedElement.styles = {};
      selectedElement.styles.fillColor =
        "rgba(" + r + "," + g + "," + b + "," + alpha + ")";
      $("#annotation-textbox-fillalpha-value").text(
        $("#annotation-textbox-fillalpha-input").val(),
      );
      self.redrawLayer(currentLayerId);
    });
    colorPickerUtils.bindPicker2Input(
      "#annotation-arrow-color-input",
      function () {
        var hex = $("#annotation-arrow-color-input").val();
        var bigint = parseInt(hex.slice(1), 16);
        var r = (bigint >> 16) & 255;
        var g = (bigint >> 8) & 255;
        var b = bigint & 255;
        if (!selectedElement.styles) selectedElement.styles = {};
        selectedElement.styles.strokeColor =
          "rgba(" + r + "," + g + "," + b + ",1)";
        self.redrawLayer(currentLayerId);
      },
    );
    $("#annotation-arrow-width-input").on("input", function () {
      var val = parseInt($(this).val());
      if (!isNaN(val) && val > 0) {
        if (!selectedElement.styles) selectedElement.styles = {};
        selectedElement.styles.lineWidth = val;
        self.redrawLayer(currentLayerId);
      }
    });
    $("#delete-selected-element").on("click", function (e) {
      e.preventDefault();
      if (selectedElement) {
        self.deleteSelectedElement();
      }
    });
    // Font settings label logic (open font properties modal)
    $("#annotation-textbox-font").on("click", function (e) {
      e.preventDefault();
      showAnnotationFontModal(selectedElement);
    });
  };

  /**
   * Deselect the currently selected element
   */
  self.deselectElement = function () {
    selectedElement = null;
    // self.enableCytoscapeInteractions();
    var currentLayer = self.getCurrentLayer();
    if (currentLayer && currentLayer.isCytoscapeLayer) {
      self.disablePointerEvents();
    } else {
      self.enablePointerEvents();
    }
    self.redrawLayer(currentLayerId);
    $(".annotation-element-delete").hide();
    $("#annotation-font-size-container").remove();
    $("#annotation-rect-fillcolor-container").remove();
    $("#annotation-arrow-style-container").remove();
    $("#annotation-rect-bordercolor-container").remove();
    $("#annotation-textbox-bordercolor-container").remove();
    $("#annotation-textbox-fillcolor-container").remove();
    $("#annotation-element-properties-table").remove();
    // Show Add Item button/menu when no item is selected
    $(".annotation-layers-controls").show();
  };

  /**
   * Find an element at the given coordinates
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {Object|null} The element at the coordinates or null
   */
  self.getElementAtPoint = function (x, y) {
    var currentLayer = self.getCurrentLayer();
    if (!currentLayer || !currentLayer.isAnnotationLayer) {
      return null;
    }

    // Check elements in reverse order (top to bottom)
    for (var i = currentLayer.elements.length - 1; i >= 0; i--) {
      var element = currentLayer.elements[i];
      if (element.type === "rectangle") {
        if (annotationUtil.isPointInRectangle(x, y, element)) {
          return element;
        }
      } else if (element.type === "textbox") {
        if (annotationUtil.isPointInTextBox(x, y, element)) {
          return element;
        }
      } else if (element.type === "arrow") {
        if (annotationUtil.isPointOnArrow(x, y, element)) {
          return element;
        }
      } else if (element.type === "image") {
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
  self.updateElement = function (elementId, newData) {
    var currentLayer = self.getCurrentLayer();
    if (!currentLayer) return false;

    var elementIndex = currentLayer.elements.findIndex(
      (el) => el.id === elementId,
    );
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
  self.handleCanvasDoubleClick = function (event, canvas) {
    var canvasCoords = annotationUtil.getCanvasCoordinates(canvas, event);
    var modelCoords = self.canvasToModel(canvasCoords.x, canvasCoords.y);

    var currentLayer = self.getCurrentLayer();
    var isOnAnnotationLayer = currentLayer && currentLayer.isAnnotationLayer;

    if (!isOnAnnotationLayer) {
      return;
    }

    var element = self.getElementAtPoint(modelCoords.x, modelCoords.y);
    if (element && element.type === "textbox") {
      self.startTextEditing(element, canvas);
    }
  };

  /**
   * Start text editing for a text box
   * @param {Object} textBoxElement - The text box element to edit
   * @param {HTMLCanvasElement} canvas - The canvas element
   */
  self.startTextEditing = function (textBoxElement, canvas) {
    var transformedElement = self.transformElementToCanvas(textBoxElement);

    var input = document.createElement("textarea");
    input.className = "textbox-edit-input";
    input.style.position = "absolute";
    input.style.left = transformedElement.x + "px";
    input.style.top = transformedElement.y + "px";
    input.style.width = transformedElement.width + "px";
    input.style.height = transformedElement.height + "px";
    input.style.border = "2px solid #0066cc";
    input.style.padding = "5px";
    input.style.fontSize = "14px";
    input.style.fontFamily = "Arial, sans-serif";
    input.style.resize = "none";
    input.style.zIndex = "9999";
    input.style.backgroundColor = "rgba(255, 255, 255, 0.95)";
    input.value = textBoxElement.text || "";

    var cyContainer = canvas.parentElement;
    cyContainer.appendChild(input);

    input.focus();
    input.select();

    var handleInputComplete = function () {
      textBoxElement.text = input.value;
      input.remove();
      self.redrawLayer(currentLayerId);
      input.removeEventListener("blur", handleInputComplete);
      input.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("click", handleDocumentClick);
    };

    var handleKeyDown = function (e) {
      if (e.key === "Enter" && e.ctrlKey) {
        e.preventDefault();
        handleInputComplete();
      } else if (e.key === "Escape") {
        e.preventDefault();
        input.remove();
        input.removeEventListener("blur", handleInputComplete);
        input.removeEventListener("keydown", handleKeyDown);
        document.removeEventListener("click", handleDocumentClick);
      }
    };

    var handleDocumentClick = function (e) {
      if (!input.contains(e.target)) {
        handleInputComplete();
      }
    };

    input.addEventListener("blur", handleInputComplete);
    input.addEventListener("keydown", handleKeyDown);
    setTimeout(function () {
      document.addEventListener("click", handleDocumentClick);
    }, 100);
  };

  /**
   * Get annotation layers data for saving to file
   * @returns {Object} Annotation layers data
   */
  self.getAnnotationLayersData = function () {
    var layersData = [];

    layers.forEach(function (layer) {
      // Only save annotation layers (not the default cytoscape layer)
      if (layer.isAnnotationLayer) {
        layersData.push({
          id: layer.id,
          visible: layer.visible,
          elements: layer.elements,
          createdAt: layer.createdAt,
          zIndex: layer.zIndex,
          customLayerName: layer.customLayerName, // Save custom layer name
        });
      }
    });

    var data = {
      layerCount: layersData.length,
      layers: layersData,
    };

    return data;
  };

  /**
   * Reset annotation layers to initial state (only default cytoscape layer)
   */
  self.resetAnnotationLayers = function () {
    layers = layers.filter(function (layer) {
      return layer.isDefaultLayer;
    });

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
  self.loadAnnotationLayersData = function (annotationLayersData) {
    self.resetAnnotationLayers();

    // If no annotation data, we're done (layers are already reset)
    if (!annotationLayersData) {
      return;
    }

    if (
      annotationLayersData.layers &&
      Array.isArray(annotationLayersData.layers)
    ) {
      annotationLayersData.layers.forEach(function (layerData) {
        var layer = LayerModel(
          layerData.id,
          layerData.visible,
          layerData.customLayerName || "",
        );
        layer.elements = layerData.elements || [];
        layer.createdAt = new Date(layerData.createdAt);
        layer.zIndex = layerData.zIndex || layerData.id;
        layer.isAnnotationLayer = true;

        // Reinitialize image elements with proper callbacks
        layer.elements.forEach(function (element) {
          if (element.type === "image") {
            if (element.imageData && typeof element.imageData === "string") {
              if (!element.imageData.startsWith("data:image/")) {
                console.error(
                  "Invalid image data URL format for element:",
                  element.id,
                  element.imageData.substring(0, 50) + "...",
                );
                if (element.imageData.startsWith("data:")) {
                  console.log("Attempting to fix data URL format");
                } else {
                  console.error(
                    "Cannot fix image data URL, skipping element:",
                    element.id,
                  );
                  return;
                }
              }
              if (element.imageData.length < 100) {
                console.error(
                  "Image data URL appears to be truncated for element:",
                  element.id,
                  "length:",
                  element.imageData.length,
                );
                return;
              }
              if (
                element.imageData.includes("undefined") ||
                element.imageData.includes("null")
              ) {
                console.error(
                  "Image data URL contains invalid values for element:",
                  element.id,
                );
                return;
              }
            } else {
              console.error(
                "Missing or invalid imageData for element:",
                element.id,
              );
              return;
            }
            element._redrawCallback = function () {
              console.log("Redrawing layer", layer.id, "due to image load");
              self.redrawLayer(layer.id);
            };
            element._imageElement = null;
          }
        });

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
  self.triggerImageUpload = function (clickCoords) {
    var currentLayer = self.getCurrentLayer();
    if (!currentLayer || !currentLayer.isAnnotationLayer) {
      return;
    }

    var canvas = self.getAnnotationCanvas(currentLayer.id);
    if (!canvas) {
      console.error("No canvas found for image upload");
      return;
    }

    var activeCy = appUtilities.getActiveCy();
    if (activeCy && activeCy.container()) {
      var cyContainer = activeCy.container();
      var mouseUpEvent = new MouseEvent("mouseup", {
        bubbles: true,
        cancelable: true,
        clientX: 0,
        clientY: 0,
      });
      cyContainer.dispatchEvent(mouseUpEvent);
    }

    setTimeout(function () {
      var input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.style.display = "none";
      input.addEventListener("change", function (event) {
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
  self.calculateSmartImageDimensions = function (
    originalWidth,
    originalHeight,
  ) {
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
      height: Math.round(scaledHeight),
    };
  };

  /**
   * Process the uploaded image and add it as an annotation element
   * @param {File} file - The uploaded image file
   * @param {Object} clickCoords - The coordinates where the image was clicked (in model coordinates)
   */
  self.processImageUpload = function (file, clickCoords) {
    var currentLayer = self.getCurrentLayer();
    if (!currentLayer || !currentLayer.isAnnotationLayer) {
      return;
    }

    var canvas = self.getAnnotationCanvas(currentLayer.id);
    if (!canvas) {
      console.error("No canvas found for image upload processing");
      return;
    }

    var reader = new FileReader();
    reader.onload = function (event) {
      var img = new Image();
      img.onload = function () {
        var smartDimensions = self.calculateSmartImageDimensions(
          img.width,
          img.height,
        );
        var imageData = {
          x: clickCoords.x,
          y: clickCoords.y,
          width: smartDimensions.width,
          height: smartDimensions.height,
          imageData: event.target.result,
          type: "image",
          id:
            "image_" +
            Date.now() +
            "_" +
            Math.random().toString(36).substr(2, 9),
          createdAt: new Date(),
        };

        imageData._redrawCallback = function () {
          self.redrawLayer(currentLayer.id);
        };

        self.addAnnotationElement(currentLayer.id, "image", imageData);
        self.deselectTool();
      };
      img.onerror = function (e) {
        console.error("Error loading image:", e);
      };
      img.src = event.target.result;
    };
    reader.onerror = function (e) {
      console.error("Error reading image file:", e);
    };
    reader.readAsDataURL(file);
  };

  /**
   * Delete the currently selected element
   */
  self.deleteSelectedElement = function () {
    var currentLayer = self.getCurrentLayer();
    if (!currentLayer || !currentLayer.isAnnotationLayer) {
      return;
    }

    if (!selectedElement) {
      return;
    }

    var layerId = currentLayer.id;
    var elementId = selectedElement.id;

    self.removeAnnotationElement(layerId, elementId);
    self.deselectElement();
  };

  /**
   * Draw all elements of a layer onto a context, applying export scale and offset
   * @param {CanvasRenderingContext2D} ctx - The canvas context to draw on
   * @param {Object} layer - The annotation layer object
   * @param {number} scaleX - The X scale to apply
   * @param {number} scaleY - The Y scale to apply
   * @param {number} offsetX - The X offset to apply
   * @param {number} offsetY - The Y offset to apply
   */
  self.drawLayerForExport = function (
    ctx,
    layer,
    scaleX,
    scaleY,
    offsetX,
    offsetY,
  ) {
    if (!layer || !layer.isAnnotationLayer) return;
    ctx.save();
    ctx.setTransform(scaleX, 0, 0, scaleY, offsetX, offsetY);
    annotationUtil.clearCanvas(ctx);
    layer.elements.forEach(function (element) {
      // Use model coordinates directly
      switch (element.type) {
        case "rectangle":
          annotationUtil.drawRectangle(ctx, element, element.styles);
          break;
        case "textbox":
          annotationUtil.drawTextBox(ctx, element, element.styles, 1.0);
          break;
        case "arrow":
          annotationUtil.drawArrow(ctx, element, element.styles);
          break;
        case "image":
          annotationUtil.drawImage(ctx, element, element.styles);
          break;
        default:
          console.warn(
            "[drawLayerForExport] Unknown element type:",
            element.type,
          );
      }
    });
    ctx.restore();
  };

  /**
   * Calculate the maximum border width from all annotation elements
   * @param {Array} layers - Array of annotation layers
   * @returns {number} Maximum border width
   */
  self.calculateMaxBorderWidth = function (layers) {
    let maxBorderWidth = 0;

    layers.forEach((layer) => {
      if (layer.isAnnotationLayer && layer.visible) {
        layer.elements.forEach((el) => {
          if (el.styles) {
            // Check lineWidth for different element types
            if (
              el.type === "rectangle" ||
              el.type === "textbox" ||
              el.type === "image"
            ) {
              const lineWidth = el.styles.lineWidth || 2; // Default from annotation-util.js
              maxBorderWidth = Math.max(maxBorderWidth, lineWidth);
            } else if (el.type === "arrow") {
              const lineWidth = el.styles.lineWidth || 7; // Default from annotation-util.js
              const headSize = el.styles.headSize || 20; // Default from annotation-util.js
              // For arrows, consider both line width and head size
              maxBorderWidth = Math.max(maxBorderWidth, lineWidth, headSize);
            }
          }
        });
      }
    });

    return maxBorderWidth;
  };

  /**
   * Calculate individual padding for each side based on border widths
   * @param {Array} layers - Array of annotation layers
   * @param {Object} bbox - Current bounding box
   * @returns {Object} Padding for each side {top, right, bottom, left}
   */
  self.calculateBorderPadding = function (layers, bbox) {
    let maxTopPadding = 0,
      maxRightPadding = 0,
      maxBottomPadding = 0,
      maxLeftPadding = 0;

    layers.forEach((layer) => {
      if (layer.isAnnotationLayer && layer.visible) {
        layer.elements.forEach((el) => {
          if (el.styles) {
            let borderWidth = 0;

            if (
              el.type === "rectangle" ||
              el.type === "textbox" ||
              el.type === "image"
            ) {
              borderWidth = el.styles.lineWidth || 2;
            } else if (el.type === "arrow") {
              borderWidth = Math.max(
                el.styles.lineWidth || 7,
                el.styles.headSize || 20,
              );
            }

            if (borderWidth > 0) {
              // Calculate which sides of this element are at the edges of the bbox
              if (
                el.type === "rectangle" ||
                el.type === "textbox" ||
                el.type === "image"
              ) {
                const halfBorder = borderWidth / 2;

                // top edge
                if (Math.abs(el.y - bbox.y1) < 1) {
                  maxTopPadding = Math.max(maxTopPadding, halfBorder);
                }
                // bottom edge
                if (Math.abs(el.y + el.height - bbox.y2) < 1) {
                  maxBottomPadding = Math.max(maxBottomPadding, halfBorder);
                }
                // left edge
                if (Math.abs(el.x - bbox.x1) < 1) {
                  maxLeftPadding = Math.max(maxLeftPadding, halfBorder);
                }
                // right edge
                if (Math.abs(el.x + el.width - bbox.x2) < 1) {
                  maxRightPadding = Math.max(maxRightPadding, halfBorder);
                }
              } else if (el.type === "arrow") {
                const halfBorder = borderWidth / 2;
                const minX = Math.min(el.startX, el.endX);
                const maxX = Math.max(el.startX, el.endX);
                const minY = Math.min(el.startY, el.endY);
                const maxY = Math.max(el.startY, el.endY);

                // Check if arrow is at the edges
                if (Math.abs(minY - bbox.y1) < 1) {
                  maxTopPadding = Math.max(maxTopPadding, halfBorder);
                }
                if (Math.abs(maxY - bbox.y2) < 1) {
                  maxBottomPadding = Math.max(maxBottomPadding, halfBorder);
                }
                if (Math.abs(minX - bbox.x1) < 1) {
                  maxLeftPadding = Math.max(maxLeftPadding, halfBorder);
                }
                if (Math.abs(maxX - bbox.x2) < 1) {
                  maxRightPadding = Math.max(maxRightPadding, halfBorder);
                }
              }
            }
          }
        });
      }
    });

    return {
      top: maxTopPadding,
      right: maxRightPadding,
      bottom: maxBottomPadding,
      left: maxLeftPadding,
    };
  };

  /**
   * Compute the bounding box that includes all Cytoscape elements and all visible annotation items
   * @param {Object} activeCy - Active Cytoscape instance
   * @param {boolean} useIndividualPadding - Whether to calculate individual padding for each side
   * @returns {Object} {x1, y1, x2, y2}
   */
  self.getCombinedBoundingBox = function (
    activeCy,
    useIndividualPadding = false,
  ) {
    // Cytoscape bounding box
    const cyBBox = activeCy.elements().boundingBox();
    // Annotation bounding box
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    self.getAllLayers().forEach((layer) => {
      if (layer.isAnnotationLayer && layer.visible) {
        layer.elements.forEach((el) => {
          if (el.type === "arrow") {
            minX = Math.min(minX, el.startX, el.endX);
            minY = Math.min(minY, el.startY, el.endY);
            maxX = Math.max(maxX, el.startX, el.endX);
            maxY = Math.max(maxY, el.startY, el.endY);
          } else {
            minX = Math.min(minX, el.x);
            minY = Math.min(minY, el.y);
            maxX = Math.max(maxX, el.x + el.width);
            maxY = Math.max(maxY, el.y + el.height);
          }
        });
      }
    });
    let annBBox = null;
    if (minX !== Infinity) {
      annBBox = { x1: minX, y1: minY, x2: maxX, y2: maxY };
    }
    // Combine
    let bbox = cyBBox;
    if (annBBox) {
      bbox = {
        x1: Math.min(cyBBox.x1, annBBox.x1),
        y1: Math.min(cyBBox.y1, annBBox.y1),
        x2: Math.max(cyBBox.x2, annBBox.x2),
        y2: Math.max(cyBBox.y2, annBBox.y2),
      };
    }

    const allLayers = self.getAllLayers();

    if (useIndividualPadding) {
      const padding = self.calculateBorderPadding(allLayers, bbox);
      bbox.x1 -= padding.left;
      bbox.y1 -= padding.top;
      bbox.x2 += padding.right;
      bbox.y2 += padding.bottom;
    } else {
      const padding = self.calculateMaxBorderWidth(allLayers);
      // const padding = Math.max(maxBorderWidth / 2, 5);
      // const padding = maxBorderWidth;

      bbox.x1 -= padding;
      bbox.y1 -= padding;
      bbox.x2 += padding;
      bbox.y2 += padding;
    }

    return bbox;
  };

  /**
   * Export a composite image including Cytoscape and all visible annotation layers as PNG.
   * (Might be able to refactor with exportCompositeJpg)
   *
   * - Computes the combined bounding box of the Cytoscape graph and all visible annotation elements.
   * - Exports Cytoscape as a PNG at the correct scale and offset.
   * - Draws each annotation element onto the export canvas, transforming model coordinates to export coordinates.
   * - Combines everything into a single PNG and triggers download.
   */
  self.exportCompositePng = function (filename) {
    var activeCy = appUtilities.getActiveCy();
    if (!activeCy) {
      return;
    }
    var cyBBox = activeCy.elements().boundingBox();
    var cyWidth = cyBBox.x2 - cyBBox.x1;
    var cyHeight = cyBBox.y2 - cyBBox.y1;
    var combinedBBox = self.getCombinedBoundingBox(activeCy, true); // Use individual padding
    var combinedWidth = combinedBBox.x2 - combinedBBox.x1;
    var combinedHeight = combinedBBox.y2 - combinedBBox.y1;

    var cyScale = 2;
    var cyExportWidth = Math.round(cyWidth * cyScale);
    var cyExportHeight = Math.round(cyHeight * cyScale);

    var cyPngDataUrl = activeCy.png({
      full: true,
      scale: cyScale,
      bg: "transparent",
      output: "base64uri",
    });
    var cyImg = new window.Image();
    cyImg.src = cyPngDataUrl;
    cyImg.onload = function () {
      var exportWidth = Math.round(combinedWidth * cyScale);
      var exportHeight = Math.round(combinedHeight * cyScale);
      var exportCanvas = document.createElement("canvas");
      exportCanvas.width = exportWidth;
      exportCanvas.height = exportHeight;
      var ctx = exportCanvas.getContext("2d");

      // Commented out to maintain transparency in PNG export
      // ctx.save();
      // ctx.fillStyle = '#FFFFFF';
      // ctx.fillRect(0, 0, exportWidth, exportHeight);
      // ctx.restore();

      var offsetX = (cyBBox.x1 - combinedBBox.x1) * cyScale;
      var offsetY = (cyBBox.y1 - combinedBBox.y1) * cyScale;
      ctx.drawImage(cyImg, offsetX, offsetY, cyExportWidth, cyExportHeight);
      var scaleX = cyScale;
      var scaleY = cyScale;
      var annOffsetX = -combinedBBox.x1 * scaleX;
      var annOffsetY = -combinedBBox.y1 * scaleY;
      var allLayers = self.getAllLayers();
      allLayers.forEach(function (layer) {
        if (layer.isAnnotationLayer && layer.visible) {
          var tempCanvas = document.createElement("canvas");
          tempCanvas.width = exportWidth;
          tempCanvas.height = exportHeight;
          var tempCtx = tempCanvas.getContext("2d");
          tempCtx.setTransform(scaleX, 0, 0, scaleY, annOffsetX, annOffsetY);
          annotationUtil.clearCanvas(tempCtx);
          layer.elements.forEach(function (element) {
            switch (element.type) {
              case "rectangle":
                annotationUtil.drawRectangle(tempCtx, element, element.styles);
                break;
              case "textbox":
                annotationUtil.drawTextBox(
                  tempCtx,
                  element,
                  element.styles,
                  1.0,
                );
                break;
              case "arrow":
                annotationUtil.drawArrow(tempCtx, element, element.styles);
                break;
              case "image":
                annotationUtil.drawImage(tempCtx, element, element.styles);
                break;
            }
          });
          ctx.drawImage(tempCanvas, 0, 0, exportWidth, exportHeight);
        }
      });
      var finalDataUrl = exportCanvas.toDataURL("image/png");
      if (window.saveAs && typeof window.saveAs === "function") {
        var arr = finalDataUrl.split(","),
          mime = arr[0].match(/:(.*?);/)[1],
          bstr = atob(arr[1]),
          n = bstr.length,
          u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        var blob = new Blob([u8arr], { type: mime });
        window.saveAs(blob, filename || "network.png");
      } else {
        var link = document.createElement("a");
        link.href = finalDataUrl;
        link.download = filename || "network.png";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    };
    cyImg.onerror = function () {
      console.error("[exportCompositePNG] Failed to load Cytoscape image");
    };
  };

  /**
   * Export a composite image as JPG including Cytoscape and all visible annotation layers.
   * (Might be able to refactor with exportCompositePng)
   *
   * - Computes the combined bounding box of the Cytoscape graph and all visible annotation elements.
   * - Exports Cytoscape as a PNG at the correct scale and offset.
   * - Draws each annotation element onto the export canvas, transforming model coordinates to export coordinates.
   * - Combines everything into a single JPG and triggers download.
   * - JPEG quality can be specified (default 0.92).
   */
  self.exportCompositeJpg = function (filename, quality) {
    quality = typeof quality === "number" ? quality : 0.92;
    var activeCy = appUtilities.getActiveCy();
    if (!activeCy) {
      return;
    }
    var cyBBox = activeCy.elements().boundingBox();
    var cyWidth = cyBBox.x2 - cyBBox.x1;
    var cyHeight = cyBBox.y2 - cyBBox.y1;
    var combinedBBox = self.getCombinedBoundingBox(activeCy);
    var combinedWidth = combinedBBox.x2 - combinedBBox.x1;
    var combinedHeight = combinedBBox.y2 - combinedBBox.y1;

    var cyScale = 2;
    var cyExportWidth = Math.round(cyWidth * cyScale);
    var cyExportHeight = Math.round(cyHeight * cyScale);

    var cyPngDataUrl = activeCy.png({
      full: true,
      scale: cyScale,
      bg: "white",
      output: "base64uri",
    });
    var cyImg = new window.Image();
    cyImg.src = cyPngDataUrl;
    cyImg.onload = function () {
      var exportWidth = Math.round(combinedWidth * cyScale);
      var exportHeight = Math.round(combinedHeight * cyScale);
      var exportCanvas = document.createElement("canvas");
      exportCanvas.width = exportWidth;
      exportCanvas.height = exportHeight;
      var ctx = exportCanvas.getContext("2d");
      ctx.save();
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, exportWidth, exportHeight);
      ctx.restore();
      var offsetX = (cyBBox.x1 - combinedBBox.x1) * cyScale;
      var offsetY = (cyBBox.y1 - combinedBBox.y1) * cyScale;
      ctx.drawImage(cyImg, offsetX, offsetY, cyExportWidth, cyExportHeight);
      var scaleX = cyScale;
      var scaleY = cyScale;
      var annOffsetX = -combinedBBox.x1 * scaleX;
      var annOffsetY = -combinedBBox.y1 * scaleY;
      var allLayers = self.getAllLayers();
      allLayers.forEach(function (layer) {
        if (layer.isAnnotationLayer && layer.visible) {
          var tempCanvas = document.createElement("canvas");
          tempCanvas.width = exportWidth;
          tempCanvas.height = exportHeight;
          var tempCtx = tempCanvas.getContext("2d");
          tempCtx.setTransform(scaleX, 0, 0, scaleY, annOffsetX, annOffsetY);
          annotationUtil.clearCanvas(tempCtx);
          layer.elements.forEach(function (element) {
            switch (element.type) {
              case "rectangle":
                annotationUtil.drawRectangle(tempCtx, element, element.styles);
                break;
              case "textbox":
                annotationUtil.drawTextBox(
                  tempCtx,
                  element,
                  element.styles,
                  1.0,
                );
                break;
              case "arrow":
                annotationUtil.drawArrow(tempCtx, element, element.styles);
                break;
              case "image":
                annotationUtil.drawImage(tempCtx, element, element.styles);
                break;
            }
          });
          ctx.drawImage(tempCanvas, 0, 0, exportWidth, exportHeight);
        }
      });
      var finalDataUrl = exportCanvas.toDataURL("image/jpeg", quality);
      if (window.saveAs && typeof window.saveAs === "function") {
        var arr = finalDataUrl.split(","),
          mime = arr[0].match(/:(.*?);/)[1],
          bstr = atob(arr[1]),
          n = bstr.length,
          u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        var blob = new Blob([u8arr], { type: mime });
        window.saveAs(blob, filename || "network.jpg");
      } else {
        var link = document.createElement("a");
        link.href = finalDataUrl;
        link.download = filename || "network.jpg";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    };
    cyImg.onerror = function () {};
  };

  /**
   * Export a composite SVG including Cytoscape and all visible annotation layers.
   *
   * - Computes the combined bounding box of the Cytoscape graph and all visible annotation elements.
   * - Exports Cytoscape as SVG and inserts it into a new SVG document at the correct offset.
   * - Transforms all annotation elements from model coordinates to export coordinates (using export scale and offset),
   *   so their placement matches what is seen on the canvas.
   * - Appends all annotation elements as SVG elements to the export SVG.
   * - Triggers download of the resulting SVG file.
   */
  self.exportCompositeSvg = function (filename) {
    var activeCy = appUtilities.getActiveCy();
    if (!activeCy) {
      return;
    }
    var cyBBox = activeCy.elements().boundingBox();
    var cyWidth = cyBBox.x2 - cyBBox.x1;
    var cyHeight = cyBBox.y2 - cyBBox.y1;
    var combinedBBox = self.getCombinedBoundingBox(activeCy);
    var combinedWidth = combinedBBox.x2 - combinedBBox.x1;
    var combinedHeight = combinedBBox.y2 - combinedBBox.y1;
    var cySvgStr = activeCy.svg({ full: true, scale: 1 });
    var parser = new DOMParser();
    var cySvgDoc = parser.parseFromString(cySvgStr, "image/svg+xml");
    var cySvgRoot = cySvgDoc.documentElement;

    // Detect pixel ratio scaling by comparing expected vs actual SVG dimensions
    var actualSvgWidth = parseFloat(cySvgRoot.getAttribute("width")) || cyWidth;
    var actualSvgHeight =
      parseFloat(cySvgRoot.getAttribute("height")) || cyHeight;
    var detectedScaleX = actualSvgWidth / cyWidth;
    var detectedScaleY = actualSvgHeight / cyHeight;
    // Use the average scale factor (they should be the same for uniform scaling)
    var detectedScale = (detectedScaleX + detectedScaleY) / 2;

    var svgNS = "http://www.w3.org/2000/svg";
    var exportSvg = document.createElementNS(svgNS, "svg");
    exportSvg.setAttribute("width", combinedWidth);
    exportSvg.setAttribute("height", combinedHeight);
    exportSvg.setAttribute("viewBox", `0 0 ${combinedWidth} ${combinedHeight}`);
    var cyOffsetX = cyBBox.x1 - combinedBBox.x1;
    var cyOffsetY = cyBBox.y1 - combinedBBox.y1;
    var cyGroup = document.createElementNS(svgNS, "g");

    // Adjust the transform to account for detected scaling
    // If Cytoscape applied pixel ratio scaling, we need to counteract it
    if (Math.abs(detectedScale - 1) > 0.01) {
      // Cytoscape applied scaling, so we need to scale down and adjust offset
      var inverseScale = 1 / detectedScale;
      var scaledOffsetX = cyOffsetX;
      var scaledOffsetY = cyOffsetY;
      cyGroup.setAttribute(
        "transform",
        `translate(${scaledOffsetX},${scaledOffsetY}) scale(${inverseScale})`,
      );
    } else {
      // No scaling detected, use normal transform
      cyGroup.setAttribute("transform", `translate(${cyOffsetX},${cyOffsetY})`);
    }

    var cyChildren = Array.from(cySvgRoot.childNodes);
    cyChildren.forEach(function (child) {
      cyGroup.appendChild(child.cloneNode(true));
    });
    exportSvg.appendChild(cyGroup);
    var svgDoc = exportSvg.ownerDocument;
    var scaleX = combinedWidth / (combinedBBox.x2 - combinedBBox.x1);
    var scaleY = combinedHeight / (combinedBBox.y2 - combinedBBox.y1);
    var offsetX = -combinedBBox.x1 * scaleX;
    var offsetY = -combinedBBox.y1 * scaleY;
    self.getAllLayers().forEach(function (layer) {
      if (layer.isAnnotationLayer && layer.visible) {
        layer.elements.forEach(function (el) {
          var exportEl = self.transformElementForExport(
            el,
            scaleX,
            scaleY,
            offsetX,
            offsetY,
          );
          var svgElem = annotationUtil.elementToSvg(exportEl, svgDoc, scaleX);
          if (svgElem) {
            exportSvg.appendChild(svgElem);
          }
        });
      }
    });
    var serializer = new XMLSerializer();
    var svgString = serializer.serializeToString(exportSvg);
    var blob = new Blob([svgString], { type: "image/svg+xml" });
    if (window.saveAs) {
      window.saveAs(blob, filename);
    } else if (window.navigator.msSaveOrOpenBlob) {
      window.navigator.msSaveOrOpenBlob(blob, filename);
    } else {
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(function () {
        document.body.removeChild(a);
      }, 100);
    }
  };

  /**
   * Transform an element from model coordinates to export coordinates
   * @param {Object} element - The annotation element
   * @param {number} scaleX - X scale for export
   * @param {number} scaleY - Y scale for export
   * @param {number} offsetX - X offset for export
   * @param {number} offsetY - Y offset for export
   * @returns {Object} Transformed element
   */
  self.transformElementForExport = function (
    element,
    scaleX,
    scaleY,
    offsetX,
    offsetY,
  ) {
    if (!element) return element;
    if (
      element.type === "rectangle" ||
      element.type === "textbox" ||
      element.type === "image"
    ) {
      // Transform top-left and bottom-right
      var x1 = element.x * scaleX + offsetX;
      var y1 = element.y * scaleY + offsetY;
      var x2 = (element.x + element.width) * scaleX + offsetX;
      var y2 = (element.y + element.height) * scaleY + offsetY;
      return {
        ...element,
        x: x1,
        y: y1,
        width: x2 - x1,
        height: y2 - y1,
      };
    } else if (element.type === "arrow") {
      return {
        ...element,
        startX: element.startX * scaleX + offsetX,
        startY: element.startY * scaleY + offsetY,
        endX: element.endX * scaleX + offsetX,
        endY: element.endY * scaleY + offsetY,
      };
    }
    return element;
  };

  /**
   * Get all annotation items from all visible layers
   * @returns {Array} Array of all annotation items
   */
  self.getAllAnnotationItems = function () {
    var allItems = [];

    layers.forEach(function (layer) {
      // Only include items from visible layers
      if (layer.visible && layer.isAnnotationLayer) {
        allItems = allItems.concat(layer.elements || []);
      }
    });

    return allItems;
  };

  /**
   * Get annotation items from a specific layer
   * @param {number} layerId - The layer ID
   * @returns {Array} Array of annotation items from the layer
   */
  self.getAnnotationItemsFromLayer = function (layerId) {
    var layer = self.getLayer(layerId);
    if (layer && layer.isAnnotationLayer) {
      return layer.elements || [];
    }
    return [];
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
    calculateSmartImageDimensions: self.calculateSmartImageDimensions,
    deleteSelectedElement: self.deleteSelectedElement,
    getAnnotationCanvas: self.getAnnotationCanvas,
    exportCompositePng: self.exportCompositePng,
    drawLayerForExport: self.drawLayerForExport,
    getCombinedBoundingBox: self.getCombinedBoundingBox,
    exportCompositeJpg: self.exportCompositeJpg,
    exportCompositeSvg: self.exportCompositeSvg,
    getAllAnnotationItems: self.getAllAnnotationItems,
    getAnnotationItemsFromLayer: self.getAnnotationItemsFromLayer,
    getViewportState: self.getViewportState,
  };
};

var annotationLayers = new AnnotationLayers();

module.exports = annotationLayers;

// Helper function to convert color to hex
function rgbToHex(color) {
  // Accepts #rrggbb or rgb(r,g,b) or rgba(r,g,b,a)
  if (color[0] === "#") return color;
  var match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (match) {
    var r = parseInt(match[1]).toString(16).padStart(2, "0");
    var g = parseInt(match[2]).toString(16).padStart(2, "0");
    var b = parseInt(match[3]).toString(16).padStart(2, "0");
    return "#" + r + g + b;
  }
  return "#ff0000"; // fallback
}

// Custom modal for annotation text box font settings
function showAnnotationFontModal(element) {
  $("#annotation-font-modal").remove();

  const styles = Object.assign(
    {
      fontFamily: "Arial, sans-serif",
      fontSize: 14,
      fontWeight: "normal",
      fontStyle: "normal",
      color: "#000000",
    },
    element.styles || {},
  );

  // Modal HTML (copied mostly from inspectorFontView)
  const modalHtml = `
    <div class="modal fade" id="annotation-font-modal" tabindex="-1" role="dialog">
      <div class="modal-dialog modal-sm sbgn-modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <button type="button" class="close" data-dismiss="modal">&times;</button>
            <h4 class="modal-title">Font Properties</h4>
          </div>
          <div class="modal-body">
            <table class="table-condensed layout-table" style="width:100%">
              <tr>
                <td style="text-align:right; padding-right: 5px; width: 80px;">Family</td>
                <td style="padding-left: 5px;">
                  <select id="annotation-font-family-input" class="inspector-input-box">
                    <option value="Arial, sans-serif">Arial</option>
                    <option value="Helvetica, Arial, sans-serif">Helvetica</option>
                    <option value="Times New Roman, serif">Times New Roman</option>
                    <option value="Courier New, monospace">Courier New</option>
                    <option value="Verdana, Geneva, sans-serif">Verdana</option>
                    <option value="Tahoma, Geneva, sans-serif">Tahoma</option>
                  </select>
                </td>
              </tr>
              <tr>
                <td style="text-align:right; padding-right: 5px;">Size</td>
                <td style="padding-left: 5px;"><input id="annotation-font-size-input-modal" class="inspector-input-box" type="number" min="6" max="100" step="1" style="width:60px;" value="${styles.fontSize}"></td>
              </tr>
              <tr>
                <td style="text-align:right; padding-right: 5px;">Weight</td>
                <td style="padding-left: 5px;">
                  <select id="annotation-font-weight-input" class="inspector-input-box">
                    <option value="lighter">Lighter</option>
                    <option value="normal">Normal</option>
                    <option value="bold">Bold</option>
                    <option value="bolder">Bolder</option>
                  </select>
                </td>
              </tr>
              <tr>
                <td style="text-align:right; padding-right: 5px;">Style</td>
                <td style="padding-left: 5px;">
                  <select id="annotation-font-style-input" class="inspector-input-box">
                    <option value="normal">Normal</option>
                    <option value="italic">Italic</option>
                    <option value="oblique">Oblique</option>
                  </select>
                </td>
              </tr>
              <tr>
                <td style="text-align:right; padding-right: 5px;">Color</td>
                <td style="padding-left: 5px;"><input id="annotation-font-color-input" class="inspector-input-box" type="color" value="${styles.color}"></td>
              </tr>
            </table>
          </div>
          <div class="modal-footer" style="text-align: center">
            <button id="annotation-font-modal-set" class="btn btn-default">Set</button>
          </div>
        </div>
      </div>
    </div>
  `;
  $(document.body).append(modalHtml);

  $("#annotation-font-family-input").val(styles.fontFamily);
  $("#annotation-font-weight-input").val(styles.fontWeight);
  $("#annotation-font-style-input").val(styles.fontStyle);

  $("#annotation-font-modal").modal("show");

  $("#annotation-font-modal-set")
    .off("click")
    .on("click", function () {
      element.styles = element.styles || {};
      element.styles.fontFamily = $("#annotation-font-family-input").val();
      element.styles.fontSize = parseInt(
        $("#annotation-font-size-input-modal").val(),
      );
      element.styles.fontWeight = $("#annotation-font-weight-input").val();
      element.styles.fontStyle = $("#annotation-font-style-input").val();
      element.styles.color = $("#annotation-font-color-input").val();
      $("#annotation-font-modal").modal("hide");
      if (
        typeof window.annotationLayers !== "undefined" &&
        window.annotationLayers.redrawLayer
      ) {
        window.annotationLayers.redrawLayer(
          window.annotationLayers.getCurrentLayer().id,
        );
      } else if (typeof self !== "undefined" && self.redrawLayer) {
        self.redrawLayer(self.getCurrentLayer().id);
      }
    });
}

/**
 * Pad a bounding box to match a target aspect ratio (centered)
 * @param {Object} bbox - {x1, y1, x2, y2}
 * @param {number} targetAspect - width/height
 * @returns {Object} padded bbox
 */
function padBoundingBoxToAspect(bbox, targetAspect) {
  let width = bbox.x2 - bbox.x1;
  let height = bbox.y2 - bbox.y1;
  let aspect = width / height;
  if (aspect > targetAspect) {
    // Too wide, pad top/bottom
    let newHeight = width / targetAspect;
    let pad = (newHeight - height) / 2;
    return {
      x1: bbox.x1,
      x2: bbox.x2,
      y1: bbox.y1 - pad,
      y2: bbox.y2 + pad,
    };
  } else {
    // Too tall, pad left/right
    let newWidth = height * targetAspect;
    let pad = (newWidth - width) / 2;
    return {
      x1: bbox.x1 - pad,
      x2: bbox.x2 + pad,
      y1: bbox.y1,
      y2: bbox.y2,
    };
  }
}

