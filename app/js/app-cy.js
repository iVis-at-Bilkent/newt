var jquery = $ = require('jquery');
var appUtilities = require('./app-utilities');
var modeHandler = require('./app-mode-handler');
var inspectorUtilities = require('./inspector-utilities');
var appUndoActionsFactory = require('./app-undo-actions-factory');
var _ = require('underscore');
const databaseUtilities = require('./database-utilities');
var annotationLayers = require('./annotation-layers');
var IS_LOCAL_DATABASE = window.__ENV__.LOCAL_DATABASE==='true';
var submenuIcon = 'app/img/submenu-indicator-default.svg';

module.exports = function (chiseInstance) {
  var getExpandCollapseOptions = appUtilities.getExpandCollapseOptions.bind(appUtilities);
//  var nodeQtipFunction = appUtilities.nodeQtipFunction.bind(appUtilities);
  var refreshUndoRedoButtonsStatus = appUtilities.refreshUndoRedoButtonsStatus.bind(appUtilities);

  // use chise instance associated with chise instance
  var cy = chiseInstance.getCy();
  //("here");
  window.cy = cy;

  function logEdgeSnapshot(label, edge) {
    if (!edge || !edge.length) {
      console.log(label, null);
      return;
    }

    var source = edge.data("source");
    var target = edge.data("target");
    console.log(label, {
      id: edge.data("id"),
      source: source,
      target: target,
      class: edge.data("class"),
      language: edge.data("language"),
      width: edge.data("width"),
      cardinality: edge.data("cardinality"),
      lineColor: edge.data("line-color"),
      portsource: edge.data("portsource"),
      porttarget: edge.data("porttarget")
    });
  }

  function buildEdgeJson(edgeId, source, target, edgeParams, edgeExtraData) {
    var edgeJson = {
      group: "edges",
      data: {
        id: edgeId,
        source: source,
        target: target,
        class: edgeParams.class,
        language: edgeParams.language,
        width: edgeParams.width,
        "line-color": edgeParams.lineColor
      }
    };

    if (edgeExtraData) {
      if (edgeExtraData.portsource !== undefined) {
        edgeJson.data.portsource = edgeExtraData.portsource;
      }
      if (edgeExtraData.porttarget !== undefined) {
        edgeJson.data.porttarget = edgeExtraData.porttarget;
      }
      if (edgeExtraData.cardinality !== undefined) {
        edgeJson.data.cardinality = edgeExtraData.cardinality;
      }
      if (edgeExtraData.simulation !== undefined) {
        edgeJson.data.simulation = edgeExtraData.simulation;
      }
    }

    return edgeJson;
  }

  function logUndoRedoPayload(label, payload) {
    if (!payload) {
      console.log(label, payload);
      return;
    }

    console.log(label, {
      removeEdgeId: payload.removeEdge && payload.removeEdge.length ? payload.removeEdge.id() : null,
      addEdgeId: payload.addEdge && payload.addEdge.length ? payload.addEdge.id() : null,
      removeEdgeJsonId: payload.removeEdgeJson && payload.removeEdgeJson.data ? payload.removeEdgeJson.data.id : null,
      addEdgeJsonId: payload.addEdgeJson && payload.addEdgeJson.data ? payload.addEdgeJson.data.id : null,
      removeEdgeRemoved: payload.removeEdge && payload.removeEdge.length ? payload.removeEdge.removed() : null,
      addEdgeRemoved: payload.addEdge && payload.addEdge.length ? payload.addEdge.removed() : null
    });
  }

  function logNodeSnapshot(label, node) {
    if (!node || !node.length) {
      console.log(label, null);
      return;
    }

    var data = node.data();
    var bbox = data.bbox || {};
    var style = node.style ? node.style() : {};
    var statesAndInfos = data.statesandinfos || [];
    var auxUnitLayouts = data.auxunitlayouts || {};
    var connectedEdges = node.connectedEdges().map(function (edge) {
      return {
        id: edge.id(),
        class: edge.data("class"),
        language: edge.data("language"),
        source: edge.data("source"),
        target: edge.data("target"),
        portsource: edge.data("portsource"),
        porttarget: edge.data("porttarget"),
        width: edge.data("width"),
        lineColor: edge.data("line-color")
      };
    });

    console.log(label + " id:", data.id);
    console.log(label + " class:", data.class);
    console.log(label + " language:", data.language);
    console.log(label + " label:", data.label);
    console.log(label + " parent:", data.parent);
    console.log(label + " multimer:", data.multimer);
    console.log(label + " clonemarker:", data.clonemarker);
    console.log(label + " orientation:", data.orientation);
    console.log(label + " ports:", data.ports);
    console.log(label + " portOrdering:", data.portOrdering);
    console.log(label + " bbox:", {
      x: bbox.x,
      y: bbox.y,
      w: bbox.w,
      h: bbox.h
    });
    console.log(label + " position:", node.position());
    console.log(label + " renderedPosition:", node.renderedPosition());
    console.log(label + " size:", {
      width: node.width(),
      height: node.height()
    });
    console.log(label + " style:", {
      backgroundColor: style["background-color"],
      backgroundOpacity: style["background-opacity"],
      borderColor: style["border-color"],
      borderWidth: style["border-width"],
      borderStyle: style["border-style"],
      color: style["color"],
      textWrap: style["text-wrap"],
      fontFamily: style["font-family"],
      fontSize: style["font-size"],
      fontStyle: style["font-style"],
      fontWeight: style["font-weight"],
      shape: style["shape"],
      backgroundImage: style["background-image"],
      backgroundImageOpacity: style["background-image-opacity"]
    });
    console.log(label + " statesandinfos count:", statesAndInfos.length);
    console.log(label + " statesandinfos:", statesAndInfos);
    console.log(label + " auxunitlayouts keys:", Object.keys(auxUnitLayouts));
    console.log(label + " auxunitlayouts:", auxUnitLayouts);
    console.log(label + " connectedEdges count:", connectedEdges.length);
    console.log(label + " connectedEdges:", connectedEdges);
    console.log(label + " raw data:", data);
  }

  function logLogicalNodeDebug(label, node) {
    if (!node || !node.length) {
      console.log(label, null);
      return;
    }

    var nodeClass = node.data("class");
    var defaultProps = chiseInstance.elementUtilities.getDefaultProperties(nodeClass);
    var connectedEdges = node.connectedEdges().map(function (edge) {
      return {
        id: edge.id(),
        class: edge.data("class"),
        language: edge.data("language"),
        source: edge.data("source"),
        target: edge.data("target"),
        portsource: edge.data("portsource"),
        porttarget: edge.data("porttarget"),
        width: edge.data("width"),
        lineColor: edge.data("line-color")
      };
    });
    var style = node.style ? node.style() : {};

    console.log(label, {
      node: {
        id: node.id(),
        class: nodeClass,
        language: node.data("language"),
        parent: node.data("parent"),
        label: node.data("label"),
        position: node.position(),
        renderedPosition: node.renderedPosition(),
        bbox: node.data("bbox"),
        width: node.width(),
        height: node.height(),
        orientation: node.data("orientation"),
        ports: node.data("ports"),
        portOrdering: defaultProps["ports-ordering"],
        statesandinfos: node.data("statesandinfos"),
        auxunitlayouts: node.data("auxunitlayouts"),
        image: node.data("background-image"),
        clonemarker: node.data("clonemarker"),
        multimer: node.data("multimer")
      },
      visual: {
        borderColor: style["border-color"],
        borderWidth: style["border-width"],
        backgroundColor: style["background-color"],
        backgroundOpacity: style["background-opacity"],
        shape: style["shape"],
        width: style["width"],
        height: style["height"]
      },
      defaults: {
        width: defaultProps.width,
        height: defaultProps.height,
        borderColor: defaultProps["border-color"],
        borderWidth: defaultProps["border-width"],
        fillColor: defaultProps["background-color"],
        fillOpacity: defaultProps["background-opacity"],
        portsOrdering: defaultProps["ports-ordering"],
        shape: defaultProps.shape
      },
      connectedEdges: connectedEdges,
      rawData: node.data()
    });
    console.log(label + " full json", node.json());
  }

  function replaceEdgeWithBatch(cyTarget, newEdgeJson) {
    if (!cyTarget || !newEdgeJson) {
      return;
    }

    cy.undoRedo().do("batch", [
      { name: "remove", param: cyTarget },
      { name: "add", param: newEdgeJson }
    ]);
  }

  function replaceNodeWithBatch(cyTarget, toClass) {
    if (!cyTarget || !toClass) {
      return;
    }

    var nodeJson = cyTarget.json();
    var connectedEdgeJsons = cyTarget.connectedEdges().map(function (edge) {
      return edge.json();
    });

    nodeJson.data.class = toClass;

    var actions = [
      { name: "remove", param: cyTarget },
      { name: "add", param: nodeJson }
    ];

    connectedEdgeJsons.forEach(function (edgeJson) {
      actions.push({ name: "add", param: edgeJson });
    });

    cy.undoRedo().do("batch", actions);
  }

  function replaceAfAuxiliaryUnitWithBatch(cyTarget, toClass) {
    if (!cyTarget || !toClass) {
      return;
    }

    var currentJson = cyTarget.json();
    var connectedEdgeJsons = cyTarget.connectedEdges().map(function (edge) {
      return edge.json();
    });
    var auxUnitShapeNames = {
      'BA macromolecule': 'roundrectangle',
      'BA simple chemical': 'stadium',
      'BA nucleic acid feature': 'bottomroundrectangle',
      'BA unspecified entity': 'ellipse',
      'BA complex': 'complex',
      'BA perturbing agent': 'perturbing agent'
    };
    var nodeJson = {
      group: currentJson.group,
      data: $.extend(true, {}, currentJson.data),
      position: currentJson.position ? $.extend(true, {}, currentJson.position) : undefined,
      removed: currentJson.removed,
      selected: currentJson.selected,
      selectable: currentJson.selectable,
      locked: currentJson.locked,
      grabbable: currentJson.grabbable,
      pannable: currentJson.pannable,
      classes: currentJson.classes
    };
    var statesAndInfos = nodeJson.data.statesandinfos || [];
    var auxUnitLayouts = nodeJson.data.auxunitlayouts || {};

    nodeJson.data.class = toClass;

    statesAndInfos.forEach(function (unit) {
      if (unit && unit.style) {
        unit.style['shape-name'] = auxUnitShapeNames[toClass];
      }
    });

    Object.keys(auxUnitLayouts).forEach(function (side) {
      var layout = auxUnitLayouts[side];
      if (!layout || !layout.units) {
        return;
      }

      layout.units.forEach(function (unit) {
        if (unit && unit.style) {
          unit.style['shape-name'] = auxUnitShapeNames[toClass];
        }
      });
    });

    var actions = [
      { name: "remove", param: cyTarget },
      { name: "add", param: nodeJson }
    ];

    connectedEdgeJsons.forEach(function (edgeJson) {
      actions.push({ name: "add", param: edgeJson });
    });

    cy.undoRedo().do("batch", actions);
  }

  function replacePdNodeWithBatch(cyTarget, toClass) {
    if (!cyTarget || !toClass) {
      return;
    }

    var currentJson = cyTarget.json();
    var connectedEdgeJsons = cyTarget.connectedEdges().map(function (edge) {
      return edge.json();
    });
    var nodeJson = {
      group: currentJson.group,
      data: {
        id: currentJson.data.id,
        class: toClass,
        language: currentJson.data.language
      },
      position: currentJson.position ? $.extend(true, {}, currentJson.position) : undefined,
      removed: currentJson.removed,
      selected: currentJson.selected,
      selectable: currentJson.selectable,
      locked: currentJson.locked,
      grabbable: currentJson.grabbable,
      pannable: currentJson.pannable,
      classes: currentJson.classes
    };
    var keysToCopy = [
      'label',
      'parent',
      'boundaryParentId',
      'minHeight',
      'minHeightBiasTop',
      'minHeightBiasBottom',
      'minWidth',
      'minWidthBiasLeft',
      'minWidthBiasRight',
      'complexCalculatedPadding',
      'bbox',
      'width',
      'height',
      'orientation',
      'portOrdering',
      'border-color',
      'border-style',
      'background-color',
      'border-width',
      'background-opacity',
      'background-image-opacity',
      'color',
      'text-wrap',
      'font-family',
      'font-size',
      'font-style',
      'font-weight',
      'background-image',
      'image',
      'annotationsView'
    ];

    keysToCopy.forEach(function (key) {
      if (currentJson.data[key] !== undefined) {
        if (key === 'annotationsView') {
          nodeJson.data[key] = currentJson.data[key];
        }
        else if (currentJson.data[key] && typeof currentJson.data[key] === 'object') {
          nodeJson.data[key] = $.extend(true, Array.isArray(currentJson.data[key]) ? [] : {}, currentJson.data[key]);
        }
        else {
          nodeJson.data[key] = currentJson.data[key];
        }
      }
    });

    nodeJson.data.statesandinfos = currentJson.data.statesandinfos || [];
    if (currentJson.data.auxunitlayouts !== undefined) {
      nodeJson.data.auxunitlayouts = currentJson.data.auxunitlayouts;
    }
    nodeJson.data.ports = currentJson.data.ports || [];

    var actions = [
      { name: "remove", param: cyTarget },
      { name: "add", param: nodeJson }
    ];

    connectedEdgeJsons.forEach(function (edgeJson) {
      actions.push({ name: "add", param: edgeJson });
    });

    cy.undoRedo().do("batch", actions);

    if (nodeJson.data.boundaryParentId) {
      setTimeout(function () {
        var boundaryParent = cy.getElementById(nodeJson.data.boundaryParentId);
        var recreatedNode = cy.getElementById(nodeJson.data.id);
        if (boundaryParent.nonempty() && recreatedNode.nonempty()) {
          chiseInstance.elementUtilities.addNodeOnBoundary(boundaryParent, recreatedNode);
        }
      }, 0);
    }
  }

  function convertPdEdgeType(event, toClass, mode) {
    var cyEvent = cy.scratch('cycontextmenus') && cy.scratch('cycontextmenus').currentCyEvent;
    var cyTarget = (cyEvent && (cyEvent.target || cyEvent.cyTarget)) || event.target || event.cyTarget;

    if (!cyTarget) return;

    var source = cyTarget.data("source");
    var target = cyTarget.data("target");
    var edgeData = {
      source: source,
      target: target,
      language: cyTarget.data("language"),
      width: cyTarget.data("width"),
      lineColor: cyTarget.data("line-color")
    };
    if (mode === "IO") {
      edgeData.cardinality = cyTarget.data("cardinality");
    }
    var edgeParams = {
      class: toClass,
      language: edgeData.language,
      width: edgeData.width,
      lineColor: edgeData.lineColor
    };
    if (mode === "IO") {
      edgeParams.cardinality = edgeData.cardinality;
    }

    if (!source || !target) return;

    logEdgeSnapshot("Old edge before conversion:", cyTarget);
    chiseInstance.deleteElesSimple(cyTarget);

    var newEdge = chiseInstance.addEdge(edgeData.source, edgeData.target, edgeParams);
    logEdgeSnapshot("New edge after creation:", newEdge);

    if (newEdge && !newEdge.empty()) {
      newEdge.data("width", edgeData.width);
      newEdge.data("language", edgeData.language);
      newEdge.data("line-color", edgeData.lineColor);
      if (mode === "IO") {
        newEdge.data("cardinality", edgeData.cardinality);
      }
    }
  }

  function convertAfEdgeType(event, toClass) {
    var cyEvent = cy.scratch('cycontextmenus') && cy.scratch('cycontextmenus').currentCyEvent;
    var cyTarget = (cyEvent && (cyEvent.target || cyEvent.cyTarget)) || event.target || event.cyTarget;

    if (!cyTarget) {
      return;
    }

    var source = cyTarget.data("source");
    var target = cyTarget.data("target");
    var edgeData = {
      source: source,
      target: target,
      language: cyTarget.data("language"),
      width: cyTarget.data("width"),
      lineColor: cyTarget.data("line-color"),
      portsource: cyTarget.data("portsource"),
      porttarget: cyTarget.data("porttarget")
    };
    var edgeParams = {
      class: toClass,
      language: edgeData.language,
      width: edgeData.width,
      lineColor: edgeData.lineColor
    };

    if (!source || !target) {
      return;
    }

    var actionPayload = {
      removeEdgeJson: cyTarget.json(),
      addEdgeJson: buildEdgeJson(
        cyTarget.id(),
        edgeData.source,
        edgeData.target,
        edgeParams,
        {
          portsource: edgeData.portsource,
          porttarget: edgeData.porttarget
        }
      )
    };

    logEdgeSnapshot("Old AF edge before recreate swap:", cyTarget);
    logUndoRedoPayload("AF swap payload", actionPayload);
    replaceEdgeWithBatch(cyTarget, actionPayload.addEdgeJson);
    logEdgeSnapshot("New AF edge after recreate swap:", cy.getElementById(cyTarget.id()));
  }

  function createPdEdgeTypeIOMenu(fromClass, toClass) {
    return {
      id: 'ctx-menu-change-edge-type-pd-' + fromClass,
      content: 'Change Edge Type To',
      selector: 'edge[language="PD"][class="' + fromClass + '"]',
      submenu: [
        {
          id: 'ctx-submenu-change-edge-type-pd-' + fromClass + '-' + toClass,
          content: toClass.charAt(0).toUpperCase() + toClass.slice(1),
          onClickFunction: function (event) {
            var cyEvent = cy.scratch('cycontextmenus') && cy.scratch('cycontextmenus').currentCyEvent;
            var cyTarget = (cyEvent && (cyEvent.target || cyEvent.cyTarget)) || event.target || event.cyTarget;
            if (!cyTarget) {
              return;
            }

            logEdgeSnapshot("Change edge type", cyTarget);
            var source = cyTarget.data("source");
            var target = cyTarget.data("target");
            var newEdgeExtraData = {
              width: cyTarget.data("width"),
              language: cyTarget.data("language"),
              lineColor: cyTarget.data("line-color"),
              cardinality: cyTarget.data("cardinality")
            };

            if (fromClass === "consumption" && toClass === "production") {
              newEdgeExtraData.portsource = target + ".2";
              newEdgeExtraData.porttarget = source;
            }
            else if (fromClass === "production" && toClass === "consumption") {
              newEdgeExtraData.portsource = target;
              newEdgeExtraData.porttarget = source + ".1";
            }

            var actionPayload = {
              removeEdgeJson: cyTarget.json(),
              addEdgeJson: buildEdgeJson(
                cyTarget.id(),
                target,
                source,
                {
                class: toClass,
                language: cyTarget.data("language"),
                width: cyTarget.data("width"),
                lineColor: cyTarget.data("line-color")
                },
                newEdgeExtraData
              )
            };

            logUndoRedoPayload("PD IO swap payload", actionPayload);
            replaceEdgeWithBatch(cyTarget, actionPayload.addEdgeJson);
            logEdgeSnapshot("PD IO after recreate swap", cy.getElementById(cyTarget.id()));
          }
        }
      ]
    };
  }

  function createPdEdgeTypeModulatorsMenu(edgeClass, submenuItems) {
    return {
      id: 'ctx-menu-change-edge-type-pd-' + edgeClass,
      content: 'Change Edge Type To',
      selector: 'edge[language="PD"][class="' + edgeClass + '"]',
      submenu: submenuItems.map(function (item) {
        return {
          id: 'ctx-submenu-change-edge-type-pd-' + edgeClass + '-' + item.idSuffix,
          content: item.content,
          onClickFunction: function (event) {
            var cyEvent = cy.scratch('cycontextmenus') && cy.scratch('cycontextmenus').currentCyEvent;
            var cyTarget = (cyEvent && (cyEvent.target || cyEvent.cyTarget)) || event.target || event.cyTarget;
            if (!cyTarget) return;

            var currentEdgeJson = cyTarget.json();
            var actionPayload = {
              removeEdgeJson: currentEdgeJson,
              addEdgeJson: buildEdgeJson(
                cyTarget.id(),
                cyTarget.data("source"),
                cyTarget.data("target"),
                {
                  class: item.toClass,
                  language: cyTarget.data("language"),
                  width: cyTarget.data("width"),
                  lineColor: cyTarget.data("line-color")
                },
                {
                  portsource: cyTarget.data("portsource"),
                  porttarget: cyTarget.data("porttarget"),
                  cardinality: cyTarget.data("cardinality")
                }
              )
            };

            logEdgeSnapshot("PD modulator before recreate swap", cyTarget);
            logUndoRedoPayload("PD modulator swap payload", actionPayload);
            replaceEdgeWithBatch(cyTarget, actionPayload.addEdgeJson);
            logEdgeSnapshot("PD modulator after recreate swap", cy.getElementById(cyTarget.id()));
          }
        };
      })
    };
  }

  function createPdEdgeTypeModulatorsMenuItems() {
    var configs = [
      {
        edgeClass: 'modulation',
        submenuItems: [
          { idSuffix: 'stimulation', content: 'Stimulation Edge', toClass: 'stimulation' },
          { idSuffix: 'catalysis', content: 'Catalysis Edge', toClass: 'catalysis' },
          { idSuffix: 'inhibition', content: 'Inhibition Edge', toClass: 'inhibition' },
          { idSuffix: 'necessary-stimulation', content: 'Necessary Stimulation Edge', toClass: 'necessary stimulation' }
        ]
      },
      {
        edgeClass: 'stimulation',
        submenuItems: [
          { idSuffix: 'modulation', content: 'Modulation Edge', toClass: 'modulation' },
          { idSuffix: 'catalysis', content: 'Catalysis Edge', toClass: 'catalysis' },
          { idSuffix: 'inhibition', content: 'Inhibition Edge', toClass: 'inhibition' },
          { idSuffix: 'necessary-stimulation', content: 'Necessary Stimulation Edge', toClass: 'necessary stimulation' }
        ]
      },
      {
        edgeClass: 'catalysis',
        submenuItems: [
          { idSuffix: 'modulation', content: 'Modulation Edge', toClass: 'modulation' },
          { idSuffix: 'stimulation', content: 'Stimulation Edge', toClass: 'stimulation' },
          { idSuffix: 'inhibition', content: 'Inhibition Edge', toClass: 'inhibition' },
          { idSuffix: 'necessary-stimulation', content: 'Necessary Stimulation Edge', toClass: 'necessary stimulation' }
        ]
      },
      {
        edgeClass: 'inhibition',
        submenuItems: [
          { idSuffix: 'modulation', content: 'Modulation Edge', toClass: 'modulation' },
          { idSuffix: 'stimulation', content: 'Stimulation Edge', toClass: 'stimulation' },
          { idSuffix: 'catalysis', content: 'Catalysis Edge', toClass: 'catalysis' },
          { idSuffix: 'necessary-stimulation', content: 'Necessary Stimulation Edge', toClass: 'necessary stimulation' }
        ]
      },
      {
        edgeClass: 'necessary stimulation',
        submenuItems: [
          { idSuffix: 'modulation', content: 'Modulation Edge', toClass: 'modulation' },
          { idSuffix: 'stimulation', content: 'Stimulation Edge', toClass: 'stimulation' },
          { idSuffix: 'catalysis', content: 'Catalysis Edge', toClass: 'catalysis' },
          { idSuffix: 'inhibition', content: 'Inhibition Edge', toClass: 'inhibition' }
        ]
      }
    ];

    return configs.map(function (config) {
      return createPdEdgeTypeModulatorsMenu(config.edgeClass, config.submenuItems);
    });
  }

  function createSbmlEdgeTypeIOMenu(edgeClass, submenuItems) {
    return {
      id: 'ctx-menu-change-edge-type-sbml-' + edgeClass.replace(/\s+/g, '-'),
      content: 'Change Edge Type To',
      selector: 'edge[language="SBML"][class="' + edgeClass + '"]',
      submenu: submenuItems.map(function (item) {
        return {
          id: 'ctx-submenu-change-edge-type-sbml-' + edgeClass.replace(/\s+/g, '-') + '-' + item.idSuffix,
          content: item.content,
          onClickFunction: function (event) {
            var cyEvent = cy.scratch('cycontextmenus') && cy.scratch('cycontextmenus').currentCyEvent;
            var cyTarget = (cyEvent && (cyEvent.target || cyEvent.cyTarget)) || event.target || event.cyTarget;
            if (!cyTarget) {
              return;
            }

            var source = cyTarget.data("source");
            var target = cyTarget.data("target");
            var currentClass = cyTarget.data("class");
            var nextClass = item.toClass;
            var shouldReverse = isSbmlConsumptionLikeEdge(currentClass) !== isSbmlConsumptionLikeEdge(nextClass);
            var newEdgeSource = shouldReverse ? target : source;
            var newEdgeTarget = shouldReverse ? source : target;
            var newEdgeExtraData = {
              width: cyTarget.data("width"),
              language: cyTarget.data("language"),
              lineColor: cyTarget.data("line-color"),
              simulation: cyTarget.data("simulation")
            };

            if (isSbmlConsumptionLikeEdge(nextClass)) {
              newEdgeExtraData.portsource = newEdgeSource;
              newEdgeExtraData.porttarget = newEdgeTarget + ".1";
            }
            else if (isSbmlProductionLikeEdge(nextClass)) {
              newEdgeExtraData.portsource = newEdgeSource + ".2";
              newEdgeExtraData.porttarget = newEdgeTarget;
            }

            if (nextClass === "production" || nextClass === "consumption") {
              newEdgeExtraData.cardinality = cyTarget.data("cardinality");
            }

            var actionPayload = {
              removeEdgeJson: cyTarget.json(),
              addEdgeJson: buildEdgeJson(
                cyTarget.id(),
                newEdgeSource,
                newEdgeTarget,
                {
                  class: nextClass,
                  language: cyTarget.data("language"),
                  width: cyTarget.data("width"),
                  lineColor: cyTarget.data("line-color")
                },
                newEdgeExtraData
              )
            };

            logUndoRedoPayload("SBML IO swap payload", actionPayload);
            replaceEdgeWithBatch(cyTarget, actionPayload.addEdgeJson);
            logEdgeSnapshot("SBML IO after recreate swap", cy.getElementById(cyTarget.id()));
          }
        };
      })
    };
  }

  function isSbmlConsumptionLikeEdge(edgeClass) {
    return edgeClass === "consumption" ||
      edgeClass === "translation consumption" ||
      edgeClass === "transcription consumption";
  }

  function isSbmlProductionLikeEdge(edgeClass) {
    return edgeClass === "production" ||
      edgeClass === "transport" ||
      edgeClass === "translation production" ||
      edgeClass === "transcription production";
  }

  function createSbmlEdgeTypeIOMenuItems() {
    var edgeTypes = [
      'consumption',
      'production',
      'transcription consumption',
      'transcription production',
      'translation consumption',
      'translation production',
      'transport'
    ];

    return edgeTypes.map(function (edgeType) {
      return createSbmlEdgeTypeIOMenu(edgeType, edgeTypes.filter(function (candidate) {
        return candidate !== edgeType;
      }).map(function (candidate) {
        return {
          idSuffix: candidate.replace(/\s+/g, '-'),
          content: candidate.charAt(0).toUpperCase() + candidate.slice(1),
          toClass: candidate
        };
      }));
    });
  }

  function createSbmlEdgeTypeModulatorsMenu(edgeClass, submenuItems) {
    return {
      id: 'ctx-menu-change-edge-type-sbml-' + edgeClass.replace(/\s+/g, '-'),
      content: 'Change Edge Type To',
      selector: 'edge[language="SBML"][class="' + edgeClass + '"]',
      submenu: submenuItems.map(function (item) {
        return {
          id: 'ctx-submenu-change-edge-type-sbml-' + edgeClass.replace(/\s+/g, '-') + '-' + item.idSuffix,
          content: item.content,
          onClickFunction: function (event) {
            var cyEvent = cy.scratch('cycontextmenus') && cy.scratch('cycontextmenus').currentCyEvent;
            var cyTarget = (cyEvent && (cyEvent.target || cyEvent.cyTarget)) || event.target || event.cyTarget;
            if (!cyTarget) {
              return;
            }

            var actionPayload = {
              removeEdgeJson: cyTarget.json(),
              addEdgeJson: buildEdgeJson(
                cyTarget.id(),
                cyTarget.data("source"),
                cyTarget.data("target"),
                {
                  class: item.toClass,
                  language: cyTarget.data("language"),
                  width: cyTarget.data("width"),
                  lineColor: cyTarget.data("line-color")
                },
                {
                  portsource: cyTarget.data("portsource"),
                  porttarget: cyTarget.data("porttarget")
                }
              )
            };

            logUndoRedoPayload("SBML modulator swap payload", actionPayload);
            replaceEdgeWithBatch(cyTarget, actionPayload.addEdgeJson);
            logEdgeSnapshot("SBML modulator after recreate swap", cy.getElementById(cyTarget.id()));
          }
        };
      })
    };
  }

  function createSbmlEdgeTypeModulatorsMenuItems(edgeTypes) {
    return edgeTypes.map(function (edgeType) {
      return createSbmlEdgeTypeModulatorsMenu(edgeType, edgeTypes.filter(function (candidate) {
        return candidate !== edgeType;
      }).map(function (candidate) {
        return {
          idSuffix: candidate.replace(/\s+/g, '-'),
          content: candidate.charAt(0).toUpperCase() + candidate.slice(1),
          toClass: candidate
        };
      }));
    });
  }

  function createSbmlEdgeTypeModulators1MenuItems() {
    var edgeTypes = [
      'catalysis',
      'unknown catalysis',
      'inhibition',
      'unknown inhibition',
      'stimulation',
      'modulation',
      'trigger'
    ];

    return createSbmlEdgeTypeModulatorsMenuItems(edgeTypes);
  }

  function createSbmlEdgeTypeModulators2MenuItems() {
    var edgeTypes = [
      'positive influence sbml',
      'unknown positive influence',
      'negative influence',
      'unknown negative influence',
      'reduced stimulation',
      'unknown reduced stimulation',
      'reduced modulation',
      'unknown reduced modulation',
      'reduced trigger',
      'unknown reduced trigger'
    ];

    var configs = edgeTypes.map(function (edgeType) {
      return {
        edgeClass: edgeType,
        submenuItems: edgeTypes.filter(function (candidate) {
          return candidate !== edgeType;
        }).map(function (candidate) {
          return {
            idSuffix: candidate.replace(/\s+/g, '-'),
            content: candidate.charAt(0).toUpperCase() + candidate.slice(1),
            toClass: candidate
          };
        })
      };
    });

    return configs.map(function (config) {
      return createSbmlEdgeTypeModulatorsMenu(config.edgeClass, config.submenuItems);
    });
  }

  function convertPdNodeType(event, toClass) {
    var cyEvent = cy.scratch('cycontextmenus') && cy.scratch('cycontextmenus').currentCyEvent;
    var cyTarget = (cyEvent && (cyEvent.target || cyEvent.cyTarget)) || event.target || event.cyTarget;
    if (!cyTarget) {
      return;
    }

    console.log("Change PD node type", {
      fromClass: cyTarget.data("class"),
      toClass: toClass
    });
    logLogicalNodeDebug("Change PD node type before", cyTarget);
    replacePdNodeWithBatch(cyTarget, toClass);
    logLogicalNodeDebug("Change PD node type after", cy.getElementById(cyTarget.id()));
  }

  function createPdNodeTypeMenu(nodeClass, submenuItems) {
    return {
      id: 'ctx-menu-change-node-type-pd-' + nodeClass,
      content: 'Change Node Type',
      selector: 'node[class="' + nodeClass + '"]',
      submenu: submenuItems.map(function (item) {
        return {
          id: 'ctx-submenu-change-node-type-pd-' + nodeClass + '-' + item.idSuffix,
          content: item.content,
          onClickFunction: function (event) {
            convertPdNodeType(event, item.toClass);
          }
        };
      })
    };
  }

  function createPdNodeTypeMenuItems() {
    var nodeTypes = [
      'macromolecule',
      'simple chemical',
      'unspecified entity',
      'nucleic acid feature',
      'perturbing agent'
    ];

    return nodeTypes.map(function (nodeType) {
      return createPdNodeTypeMenu(nodeType, nodeTypes.filter(function (candidate) {
        return candidate !== nodeType;
      }).map(function (candidate) {
        return {
          idSuffix: candidate.replace(/\s+/g, '-'),
          content: candidate.charAt(0).toUpperCase() + candidate.slice(1) + ' Node',
          toClass: candidate
        };
      }));
    });
  }

  function createLogicalNodeTypeMenu(language, nodeClass, submenuItems) {
    return {
      id: 'ctx-menu-change-logical-node-type-' + language.toLowerCase() + '-' + nodeClass.replace(/\s+/g, '-'),
      content: 'Change Logical Node Type',
      selector: 'node[language="' + language + '"][class="' + nodeClass + '"]',
      submenu: submenuItems.map(function (item) {
        return {
          id: 'ctx-submenu-change-logical-node-type-' + language.toLowerCase() + '-' + nodeClass.replace(/\s+/g, '-') + '-' + item.idSuffix,
          content: item.content,
          onClickFunction: function (event) {
            var cyEvent = cy.scratch('cycontextmenus') && cy.scratch('cycontextmenus').currentCyEvent;
            var cyTarget = (cyEvent && (cyEvent.target || cyEvent.cyTarget)) || event.target || event.cyTarget;
            if (!cyTarget) {
              return;
            }

            replaceNodeWithBatch(cyTarget, item.toClass);
          }
        };
      })
    };
  }

  function createPdProcessNodeTypeMenu(nodeClass, submenuItems) {
    return {
      id: 'ctx-menu-change-process-node-type-' + nodeClass.replace(/\s+/g, '-'),
      content: 'Change Process Node Type',
      selector: 'node[language="PD"][class="' + nodeClass + '"]',
      submenu: submenuItems.map(function (item) {
        return {
          id: 'ctx-submenu-change-process-node-type-' + nodeClass.replace(/\s+/g, '-') + '-' + item.idSuffix,
          content: item.content,
          onClickFunction: function (event) {
            var cyEvent = cy.scratch('cycontextmenus') && cy.scratch('cycontextmenus').currentCyEvent;
            var cyTarget = (cyEvent && (cyEvent.target || cyEvent.cyTarget)) || event.target || event.cyTarget;
            if (!cyTarget) {
              return;
            }

            logLogicalNodeDebug('Change process node type before', cyTarget);
            replaceNodeWithBatch(cyTarget, item.toClass);
            logLogicalNodeDebug('Change process node type after', cy.getElementById(cyTarget.id()));
          }
        };
      })
    };
  }

  function createPdProcessNodeTypeMenuItems() {
    var nodeTypes = [
      'process',
      'omitted process',
      'uncertain process',
      'association',
      'dissociation'
    ];

    return nodeTypes.map(function (nodeType) {
      return createPdProcessNodeTypeMenu(nodeType, nodeTypes.filter(function (candidate) {
        return candidate !== nodeType;
      }).map(function (candidate) {
        return {
          idSuffix: candidate.replace(/\s+/g, '-'),
          content: candidate.charAt(0).toUpperCase() + candidate.slice(1),
          toClass: candidate
        };
      }));
    });
  }

  function createSbmlProcessNodeTypeMenu(nodeClass, submenuItems) {
    return {
      id: 'ctx-menu-change-process-node-type-sbml-' + nodeClass.replace(/\s+/g, '-'),
      content: 'Change Process Node Type',
      selector: 'node[language="SBML"][class="' + nodeClass + '"]',
      submenu: submenuItems.map(function (item) {
        return {
          id: 'ctx-submenu-change-process-node-type-sbml-' + nodeClass.replace(/\s+/g, '-') + '-' + item.idSuffix,
          content: item.content,
          onClickFunction: function (event) {
            var cyEvent = cy.scratch('cycontextmenus') && cy.scratch('cycontextmenus').currentCyEvent;
            var cyTarget = (cyEvent && (cyEvent.target || cyEvent.cyTarget)) || event.target || event.cyTarget;
            if (!cyTarget) {
              return;
            }

            logLogicalNodeDebug('Change process node type before', cyTarget);
            replaceNodeWithBatch(cyTarget, item.toClass);
            logLogicalNodeDebug('Change process node type after', cy.getElementById(cyTarget.id()));
          }
        };
      })
    };
  }

  function createSbmlProcessNodeTypeMenuItems() {
    var nodeTypes = [
      'process',
      'omitted process',
      'uncertain process',
      'truncated process',
      'association',
      'dissociation'
    ];

    return nodeTypes.map(function (nodeType) {
      return createSbmlProcessNodeTypeMenu(nodeType, nodeTypes.filter(function (candidate) {
        return candidate !== nodeType;
      }).map(function (candidate) {
        return {
          idSuffix: candidate.replace(/\s+/g, '-'),
          content: candidate.charAt(0).toUpperCase() + candidate.slice(1),
          toClass: candidate
        };
      }));
    });
  }

  function createAfAuxiliaryUnitTypeMenu(nodeClass, submenuItems) {
    return {
      id: 'ctx-menu-change-af-auxiliary-unit-type-' + nodeClass.replace(/\s+/g, '-'),
      content: 'Change AF Auxiliary Unit Type',
      selector: 'node[language="AF"][class="' + nodeClass + '"]',
      submenu: submenuItems.map(function (item) {
        return {
          id: 'ctx-submenu-change-af-auxiliary-unit-type-' + nodeClass.replace(/\s+/g, '-') + '-' + item.idSuffix,
          content: item.content,
          onClickFunction: function (event) {
            var cyEvent = cy.scratch('cycontextmenus') && cy.scratch('cycontextmenus').currentCyEvent;
            var cyTarget = (cyEvent && (cyEvent.target || cyEvent.cyTarget)) || event.target || event.cyTarget;
            if (!cyTarget) {
              return;
            }

            logLogicalNodeDebug('Change AF auxiliary unit type before', cyTarget);
            replaceAfAuxiliaryUnitWithBatch(cyTarget, item.toClass);
            logLogicalNodeDebug('Change AF auxiliary unit type after', cy.getElementById(cyTarget.id()));
          }
        };
      })
    };
  }

  function createAfAuxiliaryUnitTypeMenuItems() {
    var nodeTypes = [
      'BA macromolecule',
      'BA simple chemical',
      'BA nucleic acid feature',
      'BA unspecified entity',
      'BA complex',
      'BA perturbing agent'
    ];

    return nodeTypes.map(function (nodeType) {
      return createAfAuxiliaryUnitTypeMenu(nodeType, nodeTypes.filter(function (candidate) {
        return candidate !== nodeType;
      }).map(function (candidate) {
        return {
          idSuffix: candidate.replace(/\s+/g, '-'),
          content: candidate.replace(/^BA\s+/, '').replace(/\b\w/g, function (match) {
            return match.toUpperCase();
          }),
          toClass: candidate
        };
      }));
    });
  }

  function createPdLogicalNodeTypeMenuItems() {
    var nodeTypes = ['and', 'or', 'not'];

    return nodeTypes.map(function (nodeType) {
      return createLogicalNodeTypeMenu('PD', nodeType, nodeTypes.filter(function (candidate) {
        return candidate !== nodeType;
      }).map(function (candidate) {
        return {
          idSuffix: candidate.replace(/\s+/g, '-'),
          content: candidate.toUpperCase(),
          toClass: candidate
        };
      }));
    });
  }

  function createAfLogicalNodeTypeMenuItems() {
    var nodeTypes = ['and', 'or', 'not', 'delay'];

    return nodeTypes.map(function (nodeType) {
      return createLogicalNodeTypeMenu('AF', nodeType, nodeTypes.filter(function (candidate) {
        return candidate !== nodeType;
      }).map(function (candidate) {
        return {
          idSuffix: candidate.replace(/\s+/g, '-'),
          content: candidate.toUpperCase(),
          toClass: candidate
        };
      }));
    });
  }

  function createSbmlLogicalNodeTypeMenuItems() {
    var nodeTypes = ['and', 'or', 'not', 'unknown logical operator'];

    return nodeTypes.map(function (nodeType) {
      return createLogicalNodeTypeMenu('SBML', nodeType, nodeTypes.filter(function (candidate) {
        return candidate !== nodeType;
      }).map(function (candidate) {
        return {
          idSuffix: candidate.replace(/\s+/g, '-'),
          content: candidate === 'unknown logical operator' ? 'Unknown Logical Operator' : candidate.toUpperCase(),
          toClass: candidate
        };
      }));
    });
  }

  function replaceSifEdgeType(event, toClass) {
    var cyEvent = cy.scratch('cycontextmenus') && cy.scratch('cycontextmenus').currentCyEvent;
    var cyTarget = (cyEvent && (cyEvent.target || cyEvent.cyTarget)) || event.target || event.cyTarget;
    if (!cyTarget) {
      return;
    }

    var source = cyTarget.data("source");
    var target = cyTarget.data("target");
    if (!source || !target) {
      return;
    }

    function isSifChemicalToMacromolecule(edgeClass) {
      return edgeClass === "chemical-affects" || edgeClass === "consumption-controled-by";
    }

    function isSifMacromoleculeToChemical(edgeClass) {
      return edgeClass === "controls-production-of" || edgeClass === "controls-transport-of-chemical";
    }

    logEdgeSnapshot("SIF edge before change:", cyTarget);

    var newEdgeJson = cyTarget.json();
    var shouldSwapEnds =
      isSifChemicalToMacromolecule(cyTarget.data("class")) !== isSifChemicalToMacromolecule(toClass) &&
      (isSifChemicalToMacromolecule(cyTarget.data("class")) || isSifMacromoleculeToChemical(cyTarget.data("class"))) &&
      (isSifChemicalToMacromolecule(toClass) || isSifMacromoleculeToChemical(toClass));

    if (shouldSwapEnds) {
      newEdgeJson.data.source = target;
      newEdgeJson.data.target = source;
      if (newEdgeJson.data.portsource !== undefined) {
        newEdgeJson.data.portsource = target;
      }
      if (newEdgeJson.data.porttarget !== undefined) {
        newEdgeJson.data.porttarget = source;
      }
    }

    newEdgeJson.data.class = toClass;
    var defaultEdgeProps = chiseInstance.elementUtilities.getDefaultProperties(toClass);
    newEdgeJson.data["line-color"] = defaultEdgeProps["line-color"];

    var ur = cy.undoRedo();
    ur.do("batch", [
      { name: "remove", param: cyTarget },
      { name: "add", param: newEdgeJson }
    ]);

    logEdgeSnapshot("SIF edge after change:", cy.getElementById(cyTarget.id()));
  }

  function createSifEdgeTypeMenu(edgeClass, submenuItems) {
    return {
      id: 'ctx-menu-change-edge-type-sif-' + edgeClass.replace(/\s+/g, '-'),
      content: 'Change Edge Type To',
      selector: 'edge[language="SIF"][class="' + edgeClass + '"]',
      submenu: submenuItems.map(function (item) {
        return {
          id: 'ctx-submenu-change-edge-type-sif-' + edgeClass.replace(/\s+/g, '-') + '-' + item.idSuffix,
          content: item.content,
          onClickFunction: function (event) {
            replaceSifEdgeType(event, item.toClass);
          }
        };
      })
    };
  }

  function createSifChemicalChemicalEdgeTypeMenuItems() {
    var configs = [
      {
        edgeClass: 'reacts-with',
        submenuItems: [
          { idSuffix: 'used-to-produce', content: 'Used-to-produce Edge', toClass: 'used-to-produce' }
        ]
      },
      {
        edgeClass: 'used-to-produce',
        submenuItems: [
          { idSuffix: 'reacts-with', content: 'Reacts-with Edge', toClass: 'reacts-with' }
        ]
      }
    ];

    return configs.map(function (config) {
      return createSifEdgeTypeMenu(config.edgeClass, config.submenuItems);
    });
  }

  function createSifChemicalMacromoleculeEdgeTypeMenuItems() {
    var configs = [
      {
        edgeClass: 'controls-production-of',
        submenuItems: [
          { idSuffix: 'controls-transport-of-chemical', content: 'Controls-transport-of-chemical Edge', toClass: 'controls-transport-of-chemical' },
          { idSuffix: 'chemical-affects', content: 'Chemical-affects Edge', toClass: 'chemical-affects' },
          { idSuffix: 'consumption-controled-by', content: 'Consumption-controled-by Edge', toClass: 'consumption-controled-by' }
        ]
      },
      {
        edgeClass: 'controls-transport-of-chemical',
        submenuItems: [
          { idSuffix: 'controls-production-of', content: 'Controls-production-of Edge', toClass: 'controls-production-of' },
          { idSuffix: 'chemical-affects', content: 'Chemical-affects Edge', toClass: 'chemical-affects' },
          { idSuffix: 'consumption-controled-by', content: 'Consumption-controled-by Edge', toClass: 'consumption-controled-by' }
        ]
      },
      {
        edgeClass: 'chemical-affects',
        submenuItems: [
          { idSuffix: 'controls-production-of', content: 'Controls-production-of Edge', toClass: 'controls-production-of' },
          { idSuffix: 'controls-transport-of-chemical', content: 'Controls-transport-of-chemical Edge', toClass: 'controls-transport-of-chemical' },
          { idSuffix: 'consumption-controled-by', content: 'Consumption-controled-by Edge', toClass: 'consumption-controled-by' }
        ]
      },
      {
        edgeClass: 'consumption-controled-by',
        submenuItems: [
          { idSuffix: 'controls-production-of', content: 'Controls-production-of Edge', toClass: 'controls-production-of' },
          { idSuffix: 'controls-transport-of-chemical', content: 'Controls-transport-of-chemical Edge', toClass: 'controls-transport-of-chemical' },
          { idSuffix: 'chemical-affects', content: 'Chemical-affects Edge', toClass: 'chemical-affects' }
        ]
      }
    ];

    return configs.map(function (config) {
      return createSifEdgeTypeMenu(config.edgeClass, config.submenuItems);
    });
  }

  function createSifMacromoleculeMacromoleculeEdgeTypeMenuItems() {
    var edgeTypes = [
      'controls-state-change-of',
      'controls-transport-of',
      'controls-phosphorylation-of',
      'controls-expression-of',
      'catalysis-precedes',
      'in-complex-with',
      'interacts-with',
      'neighbor-of',
      'activates',
      'inhibits',
      'phosphorylates',
      'dephosphorylates',
      'upregulates-expression',
      'downregulates-expression',
      'acetylates',
      'deacetylates',
      'methylates',
      'demethylates',
      'activates-gtpase',
      'inhibits-gtpase'
    ];

    return edgeTypes.map(function (edgeType) {
      return createSifEdgeTypeMenu(edgeType, edgeTypes.filter(function (candidate) {
        return candidate !== edgeType;
      }).map(function (candidate) {
        return {
          idSuffix: candidate.replace(/\s+/g, '-'),
          content: candidate.charAt(0).toUpperCase() + candidate.slice(1),
          toClass: candidate
        };
      }));
    });
  }

  function createAfEdgeTypeMenu(edgeClass, submenuItems) {
    return {
      id: 'ctx-menu-change-edge-type-af-' + edgeClass,
      content: 'Change Edge Type To',
      selector: 'edge[language="AF"][class="' + edgeClass + '"]',
      submenu: submenuItems.map(function (item) {
        return {
          id: 'ctx-submenu-change-edge-type-af-' + edgeClass + '-' + item.idSuffix,
          content: item.content,
          onClickFunction: function (event) {
            convertAfEdgeType(event, item.toClass);
          }
        };
      })
    };
  }

  function createAfEdgeTypeMenuItems() {
    var configs = [
      {
        edgeClass: 'necessary stimulation',
        submenuItems: [
          { idSuffix: 'unknown-influence', content: 'Unknown Influence Edge', toClass: 'unknown influence' },
          { idSuffix: 'negative-influence', content: 'Negative Influence Edge', toClass: 'negative influence' },
          { idSuffix: 'positive-influence', content: 'Positive Influence Edge', toClass: 'positive influence' }
        ]
      },
      {
        edgeClass: 'unknown influence',
        submenuItems: [
          { idSuffix: 'necessary-stimulation', content: 'Necessary Stimulation Edge', toClass: 'necessary stimulation' },
          { idSuffix: 'negative-influence', content: 'Negative Influence Edge', toClass: 'negative influence' },
          { idSuffix: 'positive-influence', content: 'Positive Influence Edge', toClass: 'positive influence' }
        ]
      },
      {
        edgeClass: 'negative influence',
        submenuItems: [
          { idSuffix: 'necessary-stimulation', content: 'Necessary Stimulation Edge', toClass: 'necessary stimulation' },
          { idSuffix: 'unknown-influence', content: 'Unknown Influence Edge', toClass: 'unknown influence' },
          { idSuffix: 'positive-influence', content: 'Positive Influence Edge', toClass: 'positive influence' }
        ]
      },
      {
        edgeClass: 'positive influence',
        submenuItems: [
          { idSuffix: 'necessary-stimulation', content: 'Necessary Stimulation Edge', toClass: 'necessary stimulation' },
          { idSuffix: 'unknown-influence', content: 'Unknown Influence Edge', toClass: 'unknown influence' },
          { idSuffix: 'negative-influence', content: 'Negative Influence Edge', toClass: 'negative influence' }
        ]
      }
    ];

    return configs.map(function (config) {
      return createAfEdgeTypeMenu(config.edgeClass, config.submenuItems);
    });
  }

  // register extensions and bind events when cy is ready
  cy.ready(function () {
    cytoscapeExtensionsAndContextMenu();
    bindCyEvents();
    cy.style().selector('core').style({'active-bg-opacity': 0});
    // If undo extension, register undo/redo actions
    if (appUtilities.undoable) {
      registerUndoRedoActions();
    }
  });

  function registerUndoRedoActions() { // only if undoRedo is set
    // get ur extension instance for cy
    var ur = cy.undoRedo();

    // generate an instance of app undo actions with related cy
    var appUndoActions = appUndoActionsFactory(cy);

    // bind ur actions
    ur.action("changeDataDirty", appUndoActions.changeDataDirty, appUndoActions.changeDataDirty);
    ur.action("changeMenu", appUndoActions.changeMenu, appUndoActions.changeMenu);
    ur.action("refreshColorSchemeMenu", appUndoActions.refreshColorSchemeMenu, appUndoActions.refreshColorSchemeMenu);
    ur.action("relocateInfoBoxes", appUndoActions.relocateInfoBoxes, appUndoActions.relocateInfoBoxes);
    ur.action("updateExperimentPanel", appUndoActions.updateExperimentPanel, appUndoActions.updateExperimentPanel2);
    ur.action("updateExperimentPanel2", appUndoActions.updateExperimentPanel2, appUndoActions.updateExperimentPanel);
    ur.action("updateRemoveAll", appUndoActions.updateRemoveAll, appUndoActions.updateRestore);
    ur.action("updateRestore", appUndoActions.updateRestore, appUndoActions.updateRemoveAll);
    ur.action("unhideExperimentPanel", appUndoActions.unhideExperimentPanel, appUndoActions.hideExperimentPanel);
    ur.action("hideExperimentPanel", appUndoActions.hideExperimentPanel, appUndoActions.unhideExperimentPanel);
    ur.action("deleteFile", appUndoActions.expFileDel, appUndoActions.expFileUndoDel);
    ur.action("undodeleteFile", appUndoActions.expFileUndoDel, appUndoActions.expFileDel);
    ur.action("expOnLoad", appUndoActions.expOnLoad, appUndoActions.expOnLoad);
    ur.action("fileHide", appUndoActions.hideFileUI, appUndoActions.hideFileUIredo);
    ur.action("fileUnhide", appUndoActions.unhideFileUI, appUndoActions.unhideFileUIredo);
    ur.action("hideAll", appUndoActions.hideAllUI, appUndoActions.hideAllUIUndo);
    ur.action("unhideAll", appUndoActions.unhideAllUI, appUndoActions.unhideAllUIUndo);
    ur.action("loadExperiment", appUndoActions.loadExperimentData, appUndoActions.undoLoadExperiment);
    ur.action("loadMore", appUndoActions.loadMore, appUndoActions.loadMoreUndo);
    ur.action("annotationSetElement", appUndoActions.annotationSetElement, appUndoActions.annotationSetElement);
    ur.action("annotationSetLayer", appUndoActions.annotationSetLayer, appUndoActions.annotationSetLayer);
    ur.action("convertEdgeType", appUndoActions.convertEdgeType, appUndoActions.convertEdgeType);
  }

  function cytoscapeExtensionsAndContextMenu() {
    cy.expandCollapse(getExpandCollapseOptions(cy));

    var contextMenus = cy.contextMenus({
      submenuIndicator: {
        src: submenuIcon,
        width: 12,
        height: 12
      },
      menuItemClasses: ['custom-menu-item'],
    });

    cy.autopanOnDrag();

    cy.edgeEditing({
      // this function specifies the positions of bend points
      bendPositionsFunction: function (ele) {
        return ele.data('bendPointPositions');
      },
      // whether the bend editing operations are undoable (requires cytoscape-undo-redo.js)
      undoable: appUtilities.undoable,
      // whether to initilize bend points on creation of this extension automatically
      initAnchorsAutomatically: false,
      // function to validate edge source and target on reconnection
      validateEdge: function (edge, newSource, newTarget) {
        return chiseInstance.elementUtilities.validateArrowEnds(edge, newSource, newTarget, true);
      },
      // function to be called on invalid edge reconnection
      actOnUnsuccessfulReconnection: function () {
        if(appUtilities.promptInvalidEdgeWarning){
          appUtilities.promptInvalidEdgeWarning.render();
        }
      },
      // function that handles edge reconnection
      handleReconnectEdge: chiseInstance.elementUtilities.addEdge,
      zIndex: 999,
      enableMultipleAnchorRemovalOption: true,
    });
    var pdEdgeTypeModulatorsMenuItems = createPdEdgeTypeModulatorsMenuItems();
    var afEdgeTypeMenuItems = createAfEdgeTypeMenuItems();
    var pdNodeTypeMenuItems = createPdNodeTypeMenuItems();
    var sbmlEdgeTypeIOMenuItems = createSbmlEdgeTypeIOMenuItems();
    var sbmlEdgeTypeModulators1MenuItems = createSbmlEdgeTypeModulators1MenuItems();
    var sbmlEdgeTypeModulators2MenuItems = createSbmlEdgeTypeModulators2MenuItems();
    var sifChemicalChemicalEdgeTypeMenuItems = createSifChemicalChemicalEdgeTypeMenuItems();
    var sifChemicalMacromoleculeEdgeTypeMenuItems = createSifChemicalMacromoleculeEdgeTypeMenuItems();
    var sifMacromoleculeMacromoleculeEdgeTypeMenuItems = createSifMacromoleculeMacromoleculeEdgeTypeMenuItems();
    var pdLogicalNodeTypeMenuItems = createPdLogicalNodeTypeMenuItems();
    var pdProcessNodeTypeMenuItems = createPdProcessNodeTypeMenuItems();
    var afLogicalNodeTypeMenuItems = createAfLogicalNodeTypeMenuItems();
    var afAuxiliaryUnitTypeMenuItems = createAfAuxiliaryUnitTypeMenuItems();
    var sbmlLogicalNodeTypeMenuItems = createSbmlLogicalNodeTypeMenuItems();
    var sbmlProcessNodeTypeMenuItems = createSbmlProcessNodeTypeMenuItems();
    const contextMenuItems = [
      {
        id: 'ctx-menu-general-properties',
        content: 'Properties...',
        image: {src : "app/img/toolbar/settings.svg", width : 16, height : 16, x : 2, y : 3},
        coreAsWell: true,
        onClickFunction: function (event) {
          // take focus away from other tabs before showing properties tab
          $('a[data-toggle="tab"]').one('show.bs.tab', function (e) {
            e.relatedTarget.blur();
          });
          $("#general-properties").trigger("click");
        }
      },
      {
        id: 'ctx-menu-delete',
        content: 'Delete',
        image: {src : "app/img/toolbar/delete-simple.svg", width : 16, height : 16, x : 2, y : 3},
        selector: 'node, edge',
        onClickFunction: function (event) {
          var currentGeneralProperties = appUtilities.getScratch(cy, "currentGeneralProperties");
          var currentMapType = chiseInstance.getMapType();
          let eles = event.target || event.cyTarget;
          let connections = eles.connectedEdges();
          for (let i = 0; i < connections.length; i++) {
            let className = connections[i].data('class');
            let source = connections[i].source();
            let target = connections[i].target();
            delete databaseUtilities.edgesInDB[
            [
              source.id(),
              target.id(),
              className
            ]
            ];
            // console.log("source:",source.id(), "target:", target.id(), "className:", className);
          }
          // Check if SIF topology grouping is enabled and map type is SIF, and show warning if it is
          if (
            currentMapType === "SIF" &&
            currentGeneralProperties.enableSIFTopologyGrouping
          ) {
            appUtilities.promptSIFTopologyGroupingWarning.render();
          }
      
          delete databaseUtilities.nodesInDB[eles.id()];

          chiseInstance.deleteElesSimple(eles);
          
          if(!chiseInstance.elementUtilities.isGraphTopologyLocked())
            $('#inspector-palette-tab a').tab('show');
        }
      },
      {
        id: 'ctx-menu-delete-selected',
        content: 'Delete Selected',
        image: {src : "app/img/toolbar/delete-simple.svg", width : 16, height : 16, x : 2, y : 3},
        onClickFunction: function () {
          var currentGeneralProperties = appUtilities.getScratch(cy, "currentGeneralProperties");
          var currentMapType = chiseInstance.getMapType();
          // Check if SIF topology grouping is enabled and map type is SIF, and show warning if it is
          if (
            currentMapType === "SIF" &&
            currentGeneralProperties.enableSIFTopologyGrouping
          ) {
            appUtilities.promptSIFTopologyGroupingWarning.render();
          }
          $("#delete-selected-simple").trigger('click');
        },
        coreAsWell: true // Whether core instance have this item on cxttap
      },
      {
        id: 'ctx-menu-hide-selected',
        content: 'Hide Selected',
        image: {src : "app/img/toolbar/hide-selected-smart.svg", width : 16, height : 16, x : 2, y : 3},
        onClickFunction: function () {
          $("#hide-selected-smart").trigger('click');
        },
        coreAsWell: true // Whether core instance have this item on cxttap
      },
      {
        id: 'ctx-menu-show-all',
        content: 'Show All',
        image: {src : "app/img/toolbar/show-all.svg", width : 16, height : 16, x : 2, y : 3},
        onClickFunction: function () {
          $("#show-all").trigger('click');
        },
        coreAsWell: true // Whether core instance have this item on cxttap
      },
      {
        id: 'ctx-menu-pd2af',
        content: 'Convert PD map to AF map',
        onClickFunction: function () {
          $('#highlight-errors-of-pd2af').trigger('click');
        },
        coreAsWell: true // Whether core instance have this item on cxttap
      },
      {
        id: 'ctx-menu-collapse-complexes',
        content: 'Collapse Complexes',
        onClickFunction: function () {
          $("#collapse-complexes").trigger('click');
        },
        coreAsWell: true // Whether core instance have this item on cxttap
      },
      {
        id: 'ctx-menu-tile-all-information-boxes',
        content: 'Tile Information Boxes',
        onClickFunction: function () {
          var cy = appUtilities.getActiveCy();
          var eles = cy.nodes();   
          var ur = cy.undoRedo();
          var actions = [];

         eles.forEach(function(node){
          if (node.data('auxunitlayouts') !== undefined && node.data('statesandinfos').length > 0) {
            actions.push({name: "fitUnits", param: { node: node, locations:["top", "bottom", "right", "left"]}});
          }
         
         });
      
         ur.do("batch", actions);
         
        },
        coreAsWell: true // Whether core instance have this item on cxttap
      },
      {
        id: 'ctx-menu-highlight-selected',
        content: 'Highlight Selected',
        image: {src : "app/img/toolbar/highlight-selected.svg", width : 16, height : 16, x : 2, y : 3},
        onClickFunction: function () {
          $("#highlight-selected").trigger('click');
        },
        coreAsWell: true // Whether core instance have this item on cxttap
      },
      {
        id: 'ctx-menu-zoom-to-selected',
        content: 'Zoom to Selected',
        onClickFunction: function() {
          $("#zoom-to-selected").trigger('click');
        },
        coreAsWell: true
      },
      {
        id: 'ctx-menu-expand', // ID of menu item
        content: 'Expand', // Title of menu item
        image: {src : "app/img/toolbar/expand-selected.svg", width : 16, height : 16, x : 2, y : 3},
        // Filters the elements to have this menu item on cxttap
        // If the selector is not truthy no elements will have this menu item on cxttap
        selector: 'node.cy-expand-collapse-collapsed-node',
        onClickFunction: function (event) { // The function to be executed on click
          var node = event.target || event.cyTarget;
          chiseInstance.expandNodes(node);
        }
      },
      {
        id: 'ctx-menu-collapse',
        content: 'Collapse',
        image: {src : "app/img/toolbar/collapse-selected.svg", width : 16, height : 16, x : 2, y : 3},
        selector: 'node:parent',
        onClickFunction: function (event) {
          var node = event.target || event.cyTarget;
          chiseInstance.collapseNodes(node);
        }
      },
      {
        id: 'ctx-menu-perform-layout',
        content: 'Perform Layout',
        image: {src : "app/img/toolbar/layout-cose.svg", width : 16, height : 16, x : 2, y : 3},
        onClickFunction: function () {
          $("#perform-layout").trigger('click');
        },
        coreAsWell: true // Whether core instance have this item on cxttap
      },
      
      {
        id: 'ctx-menu-select-all-object-of-this-type',
        content: 'Select Objects of This Type',
        selector: 'node, edge',
        onClickFunction: function (event) {
          var cyTarget = event.target || event.cyTarget;
          appUtilities.selectAllElementsOfSameType(cyTarget);
        }
      },

      // This needs to be removed later one, this is only for the reference
      {
        id: 'ctx-menu-change-edge-type',
        content: 'Change Edge Type To',
        selector: 'edge',
        onClickFunction: function (event) {
          var cyEvent = cy.scratch('cycontextmenus') && cy.scratch('cycontextmenus').currentCyEvent;
          var cyTarget = (cyEvent && (cyEvent.target || cyEvent.cyTarget)) || event.target || event.cyTarget;
          if (!cyTarget) {
            return;
          }

          logEdgeSnapshot("Change edge type", cyTarget);
        }
      },
      {
        id: 'ctx-menu-change-logical-operator-type',
        content: 'Change Logical Node Type',
        selector: 'node[language="PD"][class="and"], node[language="PD"][class="or"], node[language="PD"][class="not"]',
        onClickFunction: function (event) {
          var cyEvent = cy.scratch('cycontextmenus') && cy.scratch('cycontextmenus').currentCyEvent;
          var cyTarget = (cyEvent && (cyEvent.target || cyEvent.cyTarget)) || event.target || event.cyTarget;
          if (!cyTarget) {
            return;
          }

          logLogicalNodeDebug("Change logical node type", cyTarget);
        }
      },
      // Change Edge Type Starts
      //// PD
      createPdEdgeTypeIOMenu("consumption", "production"),
      createPdEdgeTypeIOMenu("production", "consumption"),
      pdEdgeTypeModulatorsMenuItems[0],
      pdEdgeTypeModulatorsMenuItems[1],
      pdEdgeTypeModulatorsMenuItems[2],
      pdEdgeTypeModulatorsMenuItems[3],
      pdEdgeTypeModulatorsMenuItems[4],

      //// AF
      afEdgeTypeMenuItems[0],
      afEdgeTypeMenuItems[1],
      afEdgeTypeMenuItems[2],
      afEdgeTypeMenuItems[3],

      //// SBML
      sbmlEdgeTypeIOMenuItems[0],
      sbmlEdgeTypeIOMenuItems[1],
      sbmlEdgeTypeIOMenuItems[2],
      sbmlEdgeTypeIOMenuItems[3],
      sbmlEdgeTypeIOMenuItems[4],
      sbmlEdgeTypeIOMenuItems[5],
      sbmlEdgeTypeIOMenuItems[6],
      //// SBML Modulators
      //// SBML Modulators 1
      sbmlEdgeTypeModulators1MenuItems[0],
      sbmlEdgeTypeModulators1MenuItems[1],
      sbmlEdgeTypeModulators1MenuItems[2],
      sbmlEdgeTypeModulators1MenuItems[3],
      sbmlEdgeTypeModulators1MenuItems[4],
      sbmlEdgeTypeModulators1MenuItems[5],
      sbmlEdgeTypeModulators1MenuItems[6],
      //// SBML Modulators 2
      sbmlEdgeTypeModulators2MenuItems[0],
      sbmlEdgeTypeModulators2MenuItems[1],
      sbmlEdgeTypeModulators2MenuItems[2],
      sbmlEdgeTypeModulators2MenuItems[3],
      sbmlEdgeTypeModulators2MenuItems[4],
      sbmlEdgeTypeModulators2MenuItems[5],
      sbmlEdgeTypeModulators2MenuItems[6],
      sbmlEdgeTypeModulators2MenuItems[7],
      sbmlEdgeTypeModulators2MenuItems[8],
      sbmlEdgeTypeModulators2MenuItems[9],

      //// SIF
      sifChemicalChemicalEdgeTypeMenuItems[0],
      sifChemicalChemicalEdgeTypeMenuItems[1],
      sifChemicalMacromoleculeEdgeTypeMenuItems[0],
      sifChemicalMacromoleculeEdgeTypeMenuItems[1],
      sifChemicalMacromoleculeEdgeTypeMenuItems[2],
      sifChemicalMacromoleculeEdgeTypeMenuItems[3],
      sifMacromoleculeMacromoleculeEdgeTypeMenuItems[0],
      sifMacromoleculeMacromoleculeEdgeTypeMenuItems[1],
      sifMacromoleculeMacromoleculeEdgeTypeMenuItems[2],
      sifMacromoleculeMacromoleculeEdgeTypeMenuItems[3],
      sifMacromoleculeMacromoleculeEdgeTypeMenuItems[4],
      sifMacromoleculeMacromoleculeEdgeTypeMenuItems[5],
      sifMacromoleculeMacromoleculeEdgeTypeMenuItems[6],
      sifMacromoleculeMacromoleculeEdgeTypeMenuItems[7],
      sifMacromoleculeMacromoleculeEdgeTypeMenuItems[8],
      sifMacromoleculeMacromoleculeEdgeTypeMenuItems[9],
      sifMacromoleculeMacromoleculeEdgeTypeMenuItems[10],
      sifMacromoleculeMacromoleculeEdgeTypeMenuItems[11],
      sifMacromoleculeMacromoleculeEdgeTypeMenuItems[12],
      sifMacromoleculeMacromoleculeEdgeTypeMenuItems[13],
      sifMacromoleculeMacromoleculeEdgeTypeMenuItems[14],
      sifMacromoleculeMacromoleculeEdgeTypeMenuItems[15],
      sifMacromoleculeMacromoleculeEdgeTypeMenuItems[16],
      sifMacromoleculeMacromoleculeEdgeTypeMenuItems[17],
      sifMacromoleculeMacromoleculeEdgeTypeMenuItems[18],
      sifMacromoleculeMacromoleculeEdgeTypeMenuItems[19],
      // Change Edge Type Ends

      // Change Logical Node Type Starts
      //// PD Logical Operators
      pdLogicalNodeTypeMenuItems[0],
      pdLogicalNodeTypeMenuItems[1],
      pdLogicalNodeTypeMenuItems[2],
      //// AF Logical Operators
      afLogicalNodeTypeMenuItems[0],
      afLogicalNodeTypeMenuItems[1],
      afLogicalNodeTypeMenuItems[2],
      afLogicalNodeTypeMenuItems[3],
      //// SBML Logical Operators
      sbmlLogicalNodeTypeMenuItems[0],
      sbmlLogicalNodeTypeMenuItems[1],
      sbmlLogicalNodeTypeMenuItems[2],
      sbmlLogicalNodeTypeMenuItems[3],
      // Change Logical Node Type Ends

      // Change Process Node Type Starts
      //// PD Process Nodes
      pdProcessNodeTypeMenuItems[0],
      pdProcessNodeTypeMenuItems[1],
      pdProcessNodeTypeMenuItems[2],
      pdProcessNodeTypeMenuItems[3],
      pdProcessNodeTypeMenuItems[4],
      //// SBML Process Nodes
      sbmlProcessNodeTypeMenuItems[0],
      sbmlProcessNodeTypeMenuItems[1],
      sbmlProcessNodeTypeMenuItems[2],
      sbmlProcessNodeTypeMenuItems[3],
      sbmlProcessNodeTypeMenuItems[4],
      sbmlProcessNodeTypeMenuItems[5],
      // Change Process Node Type Ends

      // Change AF Auxiliary Unit Type Starts
      afAuxiliaryUnitTypeMenuItems[0],
      afAuxiliaryUnitTypeMenuItems[1],
      afAuxiliaryUnitTypeMenuItems[2],
      afAuxiliaryUnitTypeMenuItems[3],
      afAuxiliaryUnitTypeMenuItems[4],
      afAuxiliaryUnitTypeMenuItems[5],
      // Change AF Auxiliary Unit Type Ends
   
      //// PD Nodes
      pdNodeTypeMenuItems[0],
      pdNodeTypeMenuItems[1],
      pdNodeTypeMenuItems[2],
      pdNodeTypeMenuItems[3],
      pdNodeTypeMenuItems[4],


      {
        id: 'ctx-menu-show-hidden-neighbors',
        content: 'Show Hidden Neighbors',
        selector: 'node[thickBorder]',
        onClickFunction: function (event) {
          var cyTarget = event.target || event.cyTarget;
          appUtilities.showHiddenNeighbors(cyTarget, appUtilities.getChiseInstance(cy));
        }
      },
      {
        id: 'ctx-menu-highlight-neighbors',
        content: 'Highlight Neighbors',
        selector: 'node[class="process"],[class="omitted process"],[class="uncertain process"],[class="association"],[class="dissociation"]',
        onClickFunction: function (event) {
          var cyTarget = event.target || event.cyTarget;
          cyTarget.select();
          $("#highlight-neighbors-of-selected").trigger('click');
        }
      },
      {
        id: 'ctx-menu-highlight-processes',
        content: 'Highlight Processes',
        selector: 'node[class="unspecified entity"],[class^="simple chemical"],[class^="macromolecule"],[class^="nucleic acid feature"],[class^="complex"]',
        onClickFunction: function (event) {
          var cyTarget = event.target || event.cyTarget;
          cyTarget.select();
          $("#highlight-processes-of-selected").trigger('click');
        }
      },
      {
        id: 'ctx-menu-animate-edge',
        content: 'Navigate to Other End',
        selector: 'edge',
        onClickFunction: function (event) {
          var cyTarget = event.target || event.cyTarget;
          appUtilities.navigateToOtherEnd(cyTarget, event.renderedPosition, event.position);
        }
      },
      {
        id: 'ctx-menu-convert-into-reversible',
        content: 'Convert into Reversible Reaction',
        selector: 'node[class="process"]',
        onClickFunction: function (event) {
          var cyTarget = event.target || event.cyTarget;
          var consumptionEdges = cyTarget._private.edges.filter(edge => edge._private.data.class === "consumption");

          if (consumptionEdges.length > 0) {
            var ur = cy.undoRedo();
            ur.do("convertIntoReversibleReaction", {processId: cyTarget.id(), collection: consumptionEdges, mapType: "HybridAny"});
          }
          var currentArrowScale = Number($('#arrow-scale').val());
          cyTarget.connectedEdges().style('arrow-scale', currentArrowScale);
        }
      },
      {
        id: 'ctx-menu-relocate-info-boxes',
        content: 'Relocate Information Boxes',
        selector: 'node[class^="macromolecule"],[class^="complex"],[class^="simple chemical"],[class^="nucleic acid feature"],[class^="compartment"],[class="SIF macromolecule"],[class="SIF simple chemical"],'
        +'[class="gene"],[class="protein"],[class="rna"],[class="antisense rna"],[class="truncated protein"],[class="ion channel"],[class="ion"],[class="receptor"],[class="simple molecule"],[class="unknown molecule"],[class="degradation"],[class="drug"],[class="phenotype sbml"],[class="complex sbml"]',
        onClickFunction: function (event){
          var cyTarget = event.target || event.cyTarget;
          appUtilities.relocateInfoBoxes(cyTarget);
        }
      },
      {
        id: 'ctx-menu-tile-info-boxes',
        content: 'Tile Information Boxes',
        selector: 'node[class^="macromolecule"],[class^="complex"],[class^="simple chemical"],[class^="nucleic acid feature"],[class^="compartment"],[class="SIF macromolecule"],[class="SIF simple chemical"]',
        onClickFunction: function (event){
          var cyTarget = event.target || event.cyTarget;
          var locations = ["top", "bottom", "right", "left"]; //Fit all locations
          chiseInstance.fitUnits(cyTarget, locations); //Force fit
        }
      },
      {
        id: 'ctx-menu-fit-content-into-node',
        content: 'Resize Node to Content',
        selector: 'node[class^="macromolecule"],[class^="complex"],[class^="simple chemical"],[class^="nucleic acid feature"],' +
        '[class^="unspecified entity"], [class^="perturbing agent"],[class^="phenotype"],[class^="tag"],[class^="compartment"],[class^="submap"],[class^="BA"],[class="SIF macromolecule"],[class="SIF simple chemical"],[class^="gene"],[class^="rna"],[class^="antisense rna"],[class^="protein"],[class^="truncated protein"],[class^="ion"],[class^="receptor"],[class^="simple molecule"],[class^="unknown molecule"],[class^="drug"]',
        onClickFunction: function (event) {
            var cyTarget = event.target || event.cyTarget;
            //Collection holds the element and is used to generalize resizeNodeToContent function (which is used from Edit-> Menu)
            var collection = cy.collection();
            collection = collection.add(cyTarget);
            appUtilities.resizeNodesToContent(collection);
        }
      },
      {
        id: 'ctx-menu-query-pcids',
        content: 'Query PC IDs',
        selector: 'edge',
        onClickFunction: function (event) {
          var edge = event.target || event.cyTarget;
          var qUrl = 'http://www.pathwaycommons.org/pc2/get?';
          var pcIDSet = edge.data( 'pcIDSet' );

          for ( var pcID in pcIDSet ) {
            qUrl += ( 'uri=' + pcID + '&' );
          }

          qUrl += 'format=sbgn';

          $.ajax({
            type: 'get',
            url: "/utilities/testURL",
            data: { url: qUrl },
            success: function( data ) {
              if (!data.error && data.response.statusCode == 200 && data.response.body) {
                var xml = $.parseXML(data.response.body);
                appUtilities.createNewNetwork();
                var activeChise = appUtilities.getActiveChiseInstance();
                var currentLayoutProperties = appUtilities.getScratch(cy, 'currentLayoutProperties');
                activeChise.updateGraph(chiseInstance.convertSbgnmlToJson(xml), undefined, currentLayoutProperties);
              }
            },
            error: function(xhr, options, err){
              console.log( err );
            }
          });
        }
      },
      {
        id: 'ctx-menu-clone',
        content: 'Clone',
        selector: '[class="simple chemical"]'   ,
        onClickFunction: function (event) {
            var cyTarget = event.target || event.cyTarget;           
            if(cyTarget.connectedEdges().length  > 1){
              cy.undoRedo().do("cloneHighDegreeNode", cyTarget);
            }
        }
      }
    ];
    if(IS_LOCAL_DATABASE){
      contextMenuItems.push({
        id: 'ctx-menu-get-database-neighbors',
        content: 'Get Neighbors from Local Database',
        selector: 'node[class^="process"],node[class^="macromolecule"],[class^="complex"],[class^="simple chemical"],[class^="nucleic acid feature"],' +
        '[class^="unspecified entity"], [class^="perturbing agent"],[class^="phenotype"],[class^="tag"],[class^="compartment"],[class^="submap"],[class^="BA"],[class="SIF macromolecule"],[class="SIF simple chemical"],[class^="gene"],[class^="rna"],[class^="antisense rna"],[class^="protein"],[class^="truncated protein"],[class^="ion"],[class^="receptor"],[class^="simple molecule"],[class^="unknown molecule"],[class^="drug"]',
        onClickFunction: function (event) {
            var cyTarget = event.target || event.cyTarget;
            var generalProperties = appUtilities.getScratch(
              cy,
              "currentGeneralProperties"
            );
            const allowCloning = generalProperties.allowSimpleChemicalCloning;
            const cloningThreshold = generalProperties.simpleChemicalCloningThreshold;
            databaseUtilities.getNeighboringNodes(cyTarget.id(), allowCloning, cloningThreshold);
        }
      },
      {
        id: 'ctx-menu-get-database-member-contents',
        content: 'Get Contents from Local Database',
        selector: 'node[class^="compartment"]',
        onClickFunction: function (event) {
            var cyTarget = event.target || event.cyTarget;
            console.log("Getting contents for compartment:", cyTarget.id());
            var generalProperties = appUtilities.getScratch(
              cy,
              "currentGeneralProperties"
            );
            const allowCloning = generalProperties.allowSimpleChemicalCloning;
            const cloningThreshold = generalProperties.simpleChemicalCloningThreshold;
            databaseUtilities.getCompartmentMembers(cyTarget.id(), allowCloning, cloningThreshold);
            // databaseUtilities.getNeighboringNodes(cyTarget.id());
        }
      }
    );
    }
    contextMenus.appendMenuItems(contextMenuItems);

    cy.clipboard({
      clipboardSize: 5, // Size of clipboard. 0 means unlimited. If size is exceeded, first added item in clipboard will be removed.
      nodePrefix: "nwtN_", // Prefix to add to the IDs of pasted nodes 
      edgePrefix: "nwtE_", // Prefix to add to the IDs of pasted edges 
      shortcuts: {
        enabled: true, // Whether keyboard shortcuts are enabled
        undoable: appUtilities.undoable // and if undoRedo extension exists
      },
      afterPaste: function(eles) {

        // Boundary node handling part can be handled in the loop below, 
        // but it is implemented separately for now, for potential debugging purposes.
        var activeChiseInstance = appUtilities.getActiveChiseInstance();
        var mapType = activeChiseInstance.getMapType();
        if (mapType === 'PD' || mapType === 'AF' || mapType === 'HybridSbgn' || mapType === 'SBML') {
          var boundaryCandidates = eles.filter(function (ele) {
            return ele.isNode() && ele.data('boundaryParentId');
          });

          var parentCandidates = eles.filter(function (ele) {
            return ele.isNode() && ele.data('class') === 'compartment';
          });

          if (boundaryCandidates.nonempty() && parentCandidates.nonempty()) {
            var snapThreshold = appUtilities.getScratch(cy, 'currentGeneralProperties').boundarySnapThreshold;
            boundaryCandidates.forEach(function (boundaryCandidate) {
              parentCandidates.forEach(function (parentCandidate) {
                if (activeChiseInstance.elementUtilities.isNearBoundary(parentCandidate, boundaryCandidate.position(), snapThreshold)) {
                  activeChiseInstance.elementUtilities.addNodeOnBoundary(parentCandidate, boundaryCandidate);
                }
              });
            });

          }
        }

        eles.nodes().forEach(function(ele){
          // skip nodes without any auxiliary units
          if(!ele.data('statesandinfos') || ele.data('statesandinfos').length == 0) {
            return;
          }

          // Defined to get index of an auxilary unit in statesandinfos array.
          // Since during clone operation the reference of object is changed we cannot use .indexOf() method
          // Instead we compare the objects by stringifing them. However, string representation of the objects may be the same.
          // To prevent conflictions in such cases we need to keep used incdices here and pass the already used indices.
          var usedIndices = {};

          // maintain consistency of layouts, and infoboxes through them
          // we need to replace the layouts contained in ele by new cloned layouts
          var globalInfoboxCount = 0;
          for(var side in ele.data('auxunitlayouts')) {
            var layout = ele.data('auxunitlayouts')[side];
            var newLayout = chiseInstance.classes.AuxUnitLayout.copy(layout, cy, ele); // get a new layout

            // copy each infobox of the layout
            for(var i=0; i < layout.units.length; i++) {
              var auxunit = layout.units[i];
              var auxunitStr = JSON.stringify(auxunit);
              // keep the new infobox at exactly the same position in the statesandinfos list
              // var statesandinfosIndex = ele.data('statesandinfos').indexOf(auxunit);

              var statesandinfos = ele.data('statesandinfos');

              // keep the new infobox at exactly the same position in the statesandinfos list
              var statesandinfosIndex;

              // Go through the not used indices of statesandinfos to get the index of aucilary unit
              for (var j = 0; j < statesandinfos.length; j++) {
                // Already used pass it
                if (usedIndices[j]) {
                  continue;
                }

                var currentBox = statesandinfos[j];

                // Found out the correct index
                if (JSON.stringify(currentBox) === auxunitStr) {
                  usedIndices[j] = true;
                  statesandinfosIndex = j;
                  break;
                }
              }

              // copy the current infobox
              var newAuxunit = chiseInstance.classes.getAuxUnitClass(auxunit).copy(auxunit, cy, ele, ele.data('id') + "_" + globalInfoboxCount);
              // update statesandinfos list
              ele.data('statesandinfos')[statesandinfosIndex] = newAuxunit;
              // update layout's infobox list
              newLayout.units[i] = newAuxunit;
              globalInfoboxCount++;
            }
            // update layout
            ele.data('auxunitlayouts')[side] = newLayout;
          }
        });
      }
    });

    function getProcessBasedNeighbors(node) {
      var nodesToSelect = node;
      if(chiseInstance.elementUtilities.isPNClass(node) || chiseInstance.elementUtilities.isLogicalOperator(node)){
          nodesToSelect = nodesToSelect.union(node.openNeighborhood());
      }
      node.openNeighborhood().forEach(function(ele){
          if(chiseInstance.elementUtilities.isPNClass(ele) || chiseInstance.elementUtilities.isLogicalOperator(ele)){
              nodesToSelect = nodesToSelect.union(ele.closedNeighborhood());
              ele.openNeighborhood().forEach(function(ele2){
                  if(chiseInstance.elementUtilities.isPNClass(ele2) || chiseInstance.elementUtilities.isLogicalOperator(ele2)){
                      nodesToSelect = nodesToSelect.union(ele2.closedNeighborhood());
                  }
              });
          }
      });
      return nodesToSelect;
    }

    cy.viewUtilities({
      highlightStyles: [
        {
          node: { 'overlay-color': '#0b9bcd', 'overlay-opacity': 0.4, 'overlay-padding': 5 },
          edge: { 'overlay-color': '#0b9bcd', 'overlay-opacity': 0.4, 'overlay-padding': 5 },
        },
        {
          node: { 'overlay-color': '#bf0603', 'overlay-opacity': 0.2, 'overlay-padding': 5 },
          edge: { 'overlay-color': '#bf0603', 'overlay-opacity': 0.2, 'overlay-padding': 5 },
        },
        {
          node: { 'overlay-color': '#d67614', 'overlay-opacity': 0.2, 'overlay-padding': 5 },
          edge: { 'overlay-color': '#d67614', 'overlay-opacity': 0.2, 'overlay-padding': 5 },
        },
        {
          node: { 'overlay-color': '#04F06A', 'overlay-opacity': 0.2, 'overlay-padding': 5 },
          edge: { 'overlay-color': '#04F06A', 'overlay-opacity': 0.2, 'overlay-padding': 5 },
        },
      ],
      selectStyles: {
        node: { 'overlay-color': '#89898a', 'overlay-opacity': 0.2, 'overlay-padding': 5 },
        edge: { 'overlay-color': '#89898a', 'overlay-opacity': 0.2, 'overlay-padding': 5 },
      },
      neighbor: function(ele){ //select and return process-based neighbors
        if (ele.isNode()) {
          return getProcessBasedNeighbors(ele);
        }
        else if (ele.isEdge()) {
          var sourceNode = ele.source();
          var targetNode = ele.target();
          var elementsToSelect = getProcessBasedNeighbors(sourceNode)
                                .union(getProcessBasedNeighbors(targetNode));
          return elementsToSelect;
        }
      },
      neighborSelectTime: 500 //ms
    });
    
    cy.layoutUtilities({
      desiredAspectRatio: $(cy.container()).width() / $(cy.container()).height()
    });

    cy.nodeEditing({
      padding: 2, // spacing between node and grapples/rectangle
      undoable: appUtilities.undoable, // and if cy.undoRedo exists

      grappleSize: 7, // size of square dots
      grappleColor: "#d67614", // color of grapples
      inactiveGrappleStroke: "inside 1px #d67614",
      boundingRectangle: true, // enable/disable bounding rectangle
      boundingRectangleLineDash: [1.5, 1.5], // line dash of bounding rectangle
      boundingRectangleLineColor: "darkgray",
      boundingRectangleLineWidth: 1.5,
      zIndex: 999,
      getCompoundMinWidth: function(node) {
        return node.data('minWidth') || 0;
      },
      getCompoundMinHeight: function(node) {
        return node.data('minHeight') || 0;
      },
      getCompoundMinWidthBiasRight: function(node) {
        return node.data('minWidthBiasRight') || 0;
      },
      getCompoundMinWidthBiasLeft: function(node) {
        return node.data('minWidthBiasLeft') || 0;
      },
      getCompoundMinHeightBiasTop: function(node) {
        return node.data('minHeightBiasTop') || 0;
      },
      getCompoundMinHeightBiasBottom: function(node) {
        return node.data('minHeightBiasBottom') || 0;
      },
      setWidth: function(node, width) {
        var bbox = node.data('bbox');
        bbox.w = width;
        node.data('bbox', bbox);
      },
      setHeight: function(node, height) {
        var bbox = node.data('bbox');
        bbox.h = height;
        node.data('bbox', bbox);
      },
      setCompoundMinWidth: function(node, minWidth) {
        node.data('minWidth', minWidth);
      },
      setCompoundMinHeight: function(node, minHeight) {
        node.data('minHeight', minHeight);
      },
      setCompoundMinWidthBiasLeft: function(node, minWidthBiasLeft) {
        node.data('minWidthBiasLeft', minWidthBiasLeft);
      },
      setCompoundMinWidthBiasRight: function(node, minHeightBiasRight) {
        node.data('minWidthBiasRight', minHeightBiasRight);
      },
      setCompoundMinHeightBiasTop: function(node, minHeightBiasTop) {
        node.data('minHeightBiasTop', minHeightBiasTop);
      },
      setCompoundMinHeightBiasBottom: function(node, minHeightBiasBottom) {
        node.data('minHeightBiasBottom', minHeightBiasBottom);
      },
      minWidth: function (node) {
        var data = node.data("resizeMinWidth");
        return data ? data : 10;
      }, // a function returns min width of node
      minHeight: function (node) {
        var data = node.data("resizeMinHeight");
        return data ? data : 10;
      }, // a function returns min height of node

      isFixedAspectRatioResizeMode: function (node) {
        //Initially checks if Aspect ratio in Object properties is checked
        if (appUtilities.nodeResizeUseAspectRatio)
            return true;
        //Otherwise it checks 'processes', 'and', 'or' etc. which have fixedAspectRatio as default
        var sbgnclass = node.data("class");
        return chiseInstance.elementUtilities.mustBeSquare(sbgnclass);
      }, // with only 4 active grapples (at corners)
      isNoResizeMode: function (node) {
        var currentGeneralProperties = appUtilities.getScratch(cy, 'currentGeneralProperties');
        return node.is(':parent') && !currentGeneralProperties.allowCompoundNodeResize;
      }, // no active grapples

      cursors: {// See http://www.w3schools.com/cssref/tryit.asp?filename=trycss_cursor
        // May take any "cursor" css property
        default: "default", // to be set after resizing finished or mouseleave
        inactive: "url('app/img/cancel.svg') 6 6, not-allowed",
        nw: "nw-resize",
        n: "n-resize",
        ne: "ne-resize",
        e: "e-resize",
        se: "se-resize",
        s: "s-resize",
        sw: "sw-resize",
        w: "w-resize"
      },

      resizeToContentCueEnabled: function (node){
        var enabled_classes = ["macromolecule", "complex", "simple chemical", "nucleic acid feature",
          "unspecified entity", "perturbing agent", "phenotype", "tag", "compartment", "submap", "BA", "gene", "rna", "antisense rna", "protein", "ion channel", "receptor", "simple molecule", "unknown molecule", "drug"];
        var node_class = node.data('class');
        var result = false;

        enabled_classes.forEach(function(enabled_class){
          if(node_class.indexOf(enabled_class) > -1 || node_class == "ion")
            result = true;
        });

        return !node.data("onLayout") && result && !chiseInstance.elementUtilities.isResizedToContent(node) && (cy.zoom() > 0.5);
      },
      resizeToContentFunction: appUtilities.resizeNodesToContent,
      resizeToContentCuePosition: 'bottom-right',
    });

    //For adding edges interactively
    cy.edgehandles({
      // fired when edgehandles is done and entities are added
      complete: function (sourceNode, targetNodes, addedEntities) {
        if (!targetNodes) {
          return;
        }

        var modeProperties = appUtilities.getScratch(cy, 'modeProperties');
        var currentGeneralProperties = appUtilities.getScratch(cy, 'currentGeneralProperties');

        // We need to remove interactively added entities because we should add the edge with the chise api
        addedEntities.remove();

        /*
         * If in add edge mode create an edge
         */
        if (modeProperties.mode === 'add-edge-mode') {
          // fired when edgehandles is done and entities are added
          var source = sourceNode.id();
          var target = targetNodes[0].id();
          var edgeParams = {class : modeProperties.selectedEdgeType, language : modeProperties.selectedEdgeLanguage};
          var promptInvalidEdge = function(){
            appUtilities.promptInvalidEdgeWarning.render();
          }

          var isMapTypeValid = false;
          var currentMapType = chiseInstance.getMapType();
          if(currentMapType == "HybridAny"){
            isMapTypeValid = true;
          }else if(currentMapType == "HybridPDAF"){
              if(edgeParams.language == "PD" || edgeParams.language =="AF" || edgeParams.language =="HybridPDAF"){
                isMapTypeValid = true;
              }
          }else if(currentMapType == edgeParams.language){
            isMapTypeValid = true;
          }

          // if added edge changes map type, warn user
          if (chiseInstance.getMapType() && !isMapTypeValid){
         
            appUtilities.promptMapTypeView.render('You cannot add element of type '+ appUtilities.mapTypesToViewableText[edgeParams.language]  + ' to a map of type '+appUtilities.mapTypesToViewableText[currentMapType]+'!',"You can change map type from Map Properties.");;
           /*  appUtilities.promptMapTypeView.render(function(){
                chiseInstance.addEdge(source, target, edgeParams, promptInvalidEdge);
                var addedEdge = cy.elements()[cy.elements().length - 1];
                var currentArrowScale = Number($('#arrow-scale').val());
                addedEdge.style('arrow-scale', currentArrowScale);
            }); */
          }
          // Check if SIF topology grouping is enabled and map type is SIF, and show warning if it is
          else if (
            currentMapType === "SIF" &&
            currentGeneralProperties.enableSIFTopologyGrouping 
          ) 
          {
            appUtilities.promptSIFTopologyGroupingWarning.render();
          }
          else{
              chiseInstance.addEdge(source, target, edgeParams, promptInvalidEdge);
              var addedEdge = cy.elements()[cy.elements().length - 1];
              var currentArrowScale = Number($('#arrow-scale').val());
              addedEdge.style('arrow-scale', currentArrowScale);
          }

          // If not in sustain mode set selection mode
          if (!modeProperties.sustainMode) {
            modeHandler.setSelectionMode();
          }
        }

      },
      loopAllowed: function( node ) {
        // for the specified node, return whether edges from itself to itself are allowed
        return false;
      },
      toggleOffOnLeave: true, // whether an edge is cancelled by leaving a node (true), or whether you need to go over again to cancel (false; allows multiple edges in one pass)
      handleSize: 0, // the size of the edge handle put on nodes (Note that it is 0 because we do not want to see the handle)
      handleHitThreshold: 0,
    });

    cy.edgehandles('drawoff');

    var gridProperties = appUtilities.getScratch(cy, 'currentGridProperties');

    cy.gridGuide({
      drawGrid: gridProperties.showGrid,
      gridColor: gridProperties.gridColor,
      snapToGridOnRelease: gridProperties.snapToGridOnRelease,
      snapToGridDuringDrag: gridProperties.snapToGridDuringDrag,
      gridSpacing: gridProperties.gridSize,
      resize: gridProperties.autoResizeNodes,
      guidelines: gridProperties.showAlignmentGuidelines,
      guidelinesTolerance: gridProperties.guidelineTolerance,
      geometricGuideline: gridProperties.showGeometricGuidelines,
      initPosAlignment: gridProperties.showInitPosAlignment,
      distributionGuidelines: gridProperties.showDistributionGuidelines,
      snapToAlignmentLocationOnRelease: gridProperties.snapToAlignmentLocationOnRelease,
      snapToAlignmentLocationDuringDrag: gridProperties.snapToAlignmentLocationDuringDrag,
      lineWidth: gridProperties.lineWidth,
      guidelinesStyle: {
        initPosAlignmentLine: gridProperties.initPosAlignmentLine,
        lineDash: gridProperties.lineDash,
        horizontalDistLine: gridProperties.horizontalDistLine,
        strokeStyle: gridProperties.guidelineColor,
        horizontalDistColor: gridProperties.horizontalGuidelineColor,
        verticalDistColor: gridProperties.verticalGuidelineColor,
        initPosAlignmentColor: gridProperties.initPosAlignmentColor,
        geometricGuidelineRange: gridProperties.geometricAlignmentRange,
        range: gridProperties.distributionAlignmentRange,
        minDistRange: gridProperties.minDistributionAlignmentRange
      }
    });

    var panProps = {
      fitPadding: 20,
      fitSelector: ':visible',
      animateOnFit: function () {
        var currentGeneralProperties = appUtilities.getScratch(cy, 'currentGeneralProperties');
        return currentGeneralProperties.animateOnDrawingChanges;
      },
      animateOnZoom: function () {
        var currentGeneralProperties = appUtilities.getScratch(cy, 'currentGeneralProperties');
        return currentGeneralProperties.animateOnDrawingChanges;
      }
    };

    cy.panzoom(panProps);
    
    // Override panzoom reset functionality to include annotation items
    appUtilities.overridePanzoomReset(cy);
  }

  function bindCyEvents() {

    // Expand collapse extension is supposed to clear expand collapse cue on node position event.
    // If compounds are resized position event is not triggered though the position of the node is changed.
    // Therefore, we listen to nodeediting.resizedrag event here and if the node is a compound we need to call clearVisualCue() method of
    // expand collapse extension.
    cy.on("nodeediting.resizedrag", function(e, type, node){
        if (node.isParent()) {
            cy.expandCollapse('get').clearVisualCue();
        }
    });

    /*
     * Collapsing/expanding can change the nature of the node and change wether it's resizeable or not.
     * We need to refresh the resize grapples to ensure they are consistent with their parent's status.
     * (for instance: complexes)
     */
   /*  cy.on("fit-units-after-expandcollapse", function(event) {
      var nodesToConsider = cy.nodes().filter(function(node){
        var sbgnClass = node.data('class');
        if (sbgnClass == 'complex' || sbgnClass == 'complex multimer' || sbgnClass == 'compartment') {
          return true;
        }
      });
      nodesToConsider.forEach(function(ele){
        if(!ele.data('statesandinfos') || ele.data('statesandinfos').length == 0) {
          return;
        }
        var locations = chiseInstance.elementUtilities.checkFit(ele); //Fit all locations
        chiseInstance.elementUtilities.fitUnits(ele, locations); //Force fit
    });
      cy.style().update();
    }); */

    cy.on("expandcollapse.beforecollapse", function (e, type, node) {
      var targetNode = node || e.target;
      if (!targetNode) return;
      var activeChiseInstance = appUtilities.getActiveChiseInstance();
      var bNodes = cy.nodes().filter(function (ele) {
        return ele.data('boundaryParentId') === targetNode.id();
      });
      if (bNodes.length > 0) {
        bNodes.each(function (bNode) {
          activeChiseInstance.elementUtilities.freeNodeFromBoundary(targetNode, bNode);
          bNode.data("boundaryParentId", targetNode.id());
          activeChiseInstance.elementUtilities.changeParent(bNode, targetNode, undefined, undefined);
        });
      }
    });

    //Fixes info box locations after expand collapse
    cy.on("expandcollapse.aftercollapse expandcollapse.afterexpand", function(e, type, node) {
      cy.nodeEditing('get').refreshGrapples();
    });

    // Restore boundary nodes
    cy.on("expandcollapse.afterexpand", function (e, type, node) {
      var targetNode = node || e.target;
      if (!targetNode) return;
      var activeChiseInstance = appUtilities.getActiveChiseInstance();
      var bNodes = cy.nodes().filter(function (ele) {
        return ele.data('boundaryParentId') === targetNode.id();
      });
      if (bNodes.length > 0) {
        bNodes.each(function (bNode) {
          var changedNodes = activeChiseInstance.elementUtilities.changeParent(bNode, null, undefined, undefined);
          activeChiseInstance.elementUtilities.addNodeOnBoundary(targetNode, changedNodes[0]);
        });
      }
    });

    cy.on("expandcollapse.beforeexpand",function(event){
      var currentGeneralProperties = appUtilities.getScratch(cy, 'currentGeneralProperties');
      if(currentGeneralProperties.recalculateLayoutOnComplexityManagement){
        var node = cy.nodes(":selected");
        if(node.length == 1 && event.target.selected())
         node[0].data("onLayout", true);
      }
    });
    
    // To redraw expand/collapse cue after resize
    cy.on("nodeediting.resizeend", function (e, type, node) {
      if(node.isParent() && node.selected())
        node.trigger("select");
    });
       
   /*  cy.on("expandcollapse.afterexpand",function(event){
      var node = event.target;
     node.data("expanding", false);      
    }); */
    //Updates arrow-scale of edges after expand
    cy.on("expandcollapse.afterexpand", function(event) {
      var currentArrowScale = Number($('#arrow-scale').val());
      cy.edges().style('arrow-scale', currentArrowScale);
    });

    //Changes arrow-scale of pasted edges
    cy.on("pasteClonedElements", function(e) {
        var currentArrowScale = Number($('#arrow-scale').val());
        cy.edges(":selected").style('arrow-scale', currentArrowScale);
    });

    cy.on("afterDo", function (event, actionName, args, res) {
      refreshUndoRedoButtonsStatus(cy);

      if(actionName == "resize") {
        var node = res.node;
        // ensure consistency of infoboxes through resizing
       /*  if(node.data('statesandinfos').length > 0) {
          updateInfoBox(node);
        } */
        // ensure consistency of inspector properties through resizing
        inspectorUtilities.handleSBGNInspector();
      }
    });

    cy.on("afterUndo", function (event, actionName, args, res) {
      refreshUndoRedoButtonsStatus(cy);
      cy.style().update();
      inspectorUtilities.handleSBGNInspector();

      var chiseInstance = appUtilities.getActiveChiseInstance();
      if (chiseInstance.getMapType()) {
        document.getElementById('map-type').value = chiseInstance.getMapType();
      }

      if(actionName == "resize") {
        var node = res.node;
        // ensure consistency of infoboxes through resizing
       /*  if(node.data('statesandinfos').length > 0) {
          updateInfoBox(node);
        } */
      }
      else if ( actionName === "changeMenu" ) {

        // if map name is changed update the description of the related tab
        if (args.id === 'map-name') {

          // use the panel id as the network key
          var networkKey = cy.container().id;

          // update the network tab description as the map name is just changed
          appUtilities.updateNetworkTabDesc(networkKey);

        }

      }
      else if (actionName === "annotationSetElement" || actionName === "annotationSetLayer") {
        annotationLayers.syncUIAfterUndoRedo();
      }
    });

    cy.on("afterRedo", function (event, actionName, args, res) {
      refreshUndoRedoButtonsStatus(cy);
      cy.style().update();
      inspectorUtilities.handleSBGNInspector();

      var chiseInstance = appUtilities.getActiveChiseInstance();
      if (chiseInstance.getMapType()) {
        document.getElementById('map-type').value = chiseInstance.getMapType();
      }

      if(actionName == "resize") {
        var node = res.node;
        // ensure consistency of infoboxes through resizing
        /* if(node.data('statesandinfos').length > 0) {
         updateInfoBox(node);
        } */
      }
      else if ( actionName === "changeMenu" ) {

        // if map name is changed update the description of the related tab
        if (args.id === 'map-name') {

          // use the panel id as the network key
          var networkKey = cy.container().id;

          // update the network tab description as the map name is just changed
          appUtilities.updateNetworkTabDesc(networkKey);

        }

      }
      else if (actionName === "annotationSetElement" || actionName === "annotationSetLayer") {
        annotationLayers.syncUIAfterUndoRedo();
      }
    });

    cy.on("mousedown", "node", function (event) {

      var self = this;

      // get mode properties for cy
      var modeProperties = appUtilities.getScratch(cy, 'modeProperties');

      if (modeProperties.mode == 'selection-mode' && appUtilities.ctrlKeyDown) {

        if(appUtilities.zoomShortcut){
          return;
        }
        appUtilities.enableDragAndDropMode(cy);

        appUtilities.setScratch(cy, 'mouseDownNode', self);
        var nodesToDragAndDrop = self.union(cy.nodes(':selected'));
        appUtilities.setScratch(cy, 'nodesToDragAndDrop', nodesToDragAndDrop);

        var dragAndDropStartPosition = event.position || event.cyPosition;
        appUtilities.setScratch(cy, 'dragAndDropStartPosition', dragAndDropStartPosition);
      }
    });

    let _panStartPosition = null;
    let _hollowClickedNode = null;
    let _isGrabbing = false;
    let _isBackgroundPanning = false;

    cy.on('tapstart', function (event) {
      if (event.target === cy) {
        var isModifierDown = event.originalEvent && (event.originalEvent.shiftKey || event.originalEvent.ctrlKey || event.originalEvent.metaKey || event.originalEvent.altKey);
        var modeProperties = appUtilities.getScratch(cy, 'modeProperties');
        var isBoxMode = modeProperties && (modeProperties.mode === "marquee-zoom-mode" || modeProperties.mode === "lasso-mode");
        if (!isModifierDown && !isBoxMode) {
          _isBackgroundPanning = true;
        }
      }
    });

    cy.on('tapstart', 'node', function (event) {
      var node = this;
      if (node.isParent()) {
        var currentGeneralProperties = appUtilities.getScratch(cy, 'currentGeneralProperties');
        var defaultPadding = currentGeneralProperties.compoundPadding;
        if (node.data('class').includes('compartment'))
          defaultPadding += currentGeneralProperties.extraCompartmentPadding;
        if (node.data('class').includes('complex'))
          defaultPadding += currentGeneralProperties.extraComplexPadding;

        var p = event.position || event.cyPosition;
        var bb = node.boundingBox({ includeLabels: false, includeOverlays: false });

        var pLeft = parseFloat(node.style('padding-left')) || defaultPadding;
        var pRight = parseFloat(node.style('padding-right')) || defaultPadding;
        var pTop = parseFloat(node.style('padding-top')) || defaultPadding;
        var pBottom = parseFloat(node.style('padding-bottom')) || defaultPadding;

        var grabTolerance = 5;

        const isInsideCenter = (
          p.x > bb.x1 + pLeft + grabTolerance &&
          p.x < bb.x2 - pRight - grabTolerance &&
          p.y > bb.y1 + pTop + grabTolerance &&
          p.y < bb.y2 - pBottom - grabTolerance
        );

        var ctrlKeyDown = (event.originalEvent && (event.originalEvent.ctrlKey || event.originalEvent.metaKey)) || appUtilities.ctrlKeyDown;
        var shiftKeyDown = event.originalEvent && event.originalEvent.shiftKey;
        var modeProperties = appUtilities.getScratch(cy, 'modeProperties'); 
        var isAddEdgeMode = modeProperties && modeProperties.mode === "add-edge-mode";
        var isBoxMode = modeProperties && (modeProperties.mode === "marquee-zoom-mode" || modeProperties.mode === "lasso-mode");

        if (isInsideCenter && !ctrlKeyDown && !shiftKeyDown && !isAddEdgeMode && !isBoxMode) {
          node.unselect();
          node.ungrabify();
          node.scratch('_wasHollowClicked', true);
          _hollowClickedNode = node;
          _panStartPosition = {
            x: event.renderedPosition.x,
            y: event.renderedPosition.y
          }
        }
      }
    });

    cy.on('tapdrag', function (event) {
      if (_hollowClickedNode || _isBackgroundPanning) {
        if (!_isGrabbing) {
          $(cy.container()).find('canvas').addClass('grabbing-cursor');
          _isGrabbing = true;
        }
      }

      if (_hollowClickedNode && _panStartPosition) {
        var rx = event.renderedPosition.x;
        var ry = event.renderedPosition.y;
        var dx = rx - _panStartPosition.x;
        var dy = ry - _panStartPosition.y;

        var currentPan = cy.pan();
        cy.pan({
          x: currentPan.x + dx,
          y: currentPan.y + dy
        });
        _panStartPosition = { x: rx, y: ry };
      }
    });

    cy.on('tapend', function (event) {
      if (_isGrabbing) {
        $(cy.container()).find('canvas').removeClass('grabbing-cursor');
        _isGrabbing = false;
      }
      _isBackgroundPanning = false;
      if (_hollowClickedNode && _hollowClickedNode.scratch('_wasHollowClicked')) {
        _hollowClickedNode.grabify();
        _hollowClickedNode.removeScratch('_wasHollowClicked');
      }
      _hollowClickedNode = null;
      _panStartPosition = null;
    });

    cy.on("mouseup", function (event) {
      var self = event.target || event.cyTarget;

      // get chise instance for cy
      var chiseInstance = appUtilities.getChiseInstance(cy);

      if (appUtilities.getScratch(cy, 'dragAndDropModeEnabled')) {

        var nodes = appUtilities.getScratch(cy, 'nodesToDragAndDrop');

        if (appUtilities.ctrlKeyDown ) {

          var handledBoundaryAction = false;
          var mousePos = event.position || event.cyPosition;
          var activeChiseInstance = appUtilities.getActiveChiseInstance();
          var mapType = activeChiseInstance.getMapType();

          if (mapType === 'PD' || mapType === 'AF' || mapType === 'HybridSbgn' || mapType === 'SBML') {
            appUtilities.disableDragAndDropMode(cy);

            if (self !== cy && self.isNode() && self.data('class') === 'compartment') {

              var snapThreshold = appUtilities.getScratch(cy, 'currentGeneralProperties').boundarySnapThreshold;

              if (activeChiseInstance.elementUtilities.isNearBoundary(self, mousePos, snapThreshold)) {
                var actions = [];
                nodes.each(function (node) {
                  if (node.id() !== self.id() && (chiseInstance.elementUtilities.isEPNClass(node) || chiseInstance.elementUtilities.isPNClass(node)) || cy.scratch('_sbgnviz').sbgnvizParams.jsonToSbmlConverter.isSpecies(node.data('class'))) {
                    var boundaryNode = node;
                    var currentBoundaryParent = node.data('boundaryParentId') ? cy.getElementById(node.data('boundaryParentId')) : null;
                    var nextBoundaryParent = self;
                    var parentNode = node.parent().nonempty() ? node.parent() : null;
                    var currentPosition = { x: node.position().x, y: node.position().y };
                    var nextPosition = { x: mousePos.x, y: mousePos.y };
                    actions.push({
                      name: "addNodeOnBoundary", 
                      param: { boundaryNode: boundaryNode, currentBoundaryParent: currentBoundaryParent, nextBoundaryParent: nextBoundaryParent, parentNode: parentNode, currentPosition: currentPosition, nextPosition: nextPosition}
                    });
                  }
                });
                if (actions.length > 1) {
                  cy.undoRedo().do("batch", actions);
                } else if (actions.length === 1) {
                  activeChiseInstance.addNodeOnBoundary(actions[0].param.boundaryNode, actions[0].param.currentBoundaryParent, actions[0].param.nextBoundaryParent, actions[0].param.parentNode, actions[0].param.currentPosition, actions[0].param.nextPosition);
                } 
                handledBoundaryAction = true;
              }
            }

            if (!handledBoundaryAction) {
              var actions = [];
              nodes.each(function (node) {
                if (node.data('boundaryParentId')) {
                  var boundaryNode = node;
                  var currentBoundaryParent = node.data('boundaryParentId') ? cy.getElementById(node.data('boundaryParentId')) : null;
                  var nextBoundaryParent = null;
                  var parentNode = self != cy ? self : null;
                  var currentPosition = { x: node.position().x, y: node.position().y };
                  var nextPosition = { x: mousePos.x, y: mousePos.y };
                  actions.push({
                    name: "freeNodeFromBoundary", 
                    param: { boundaryNode: boundaryNode, currentBoundaryParent: currentBoundaryParent, nextBoundaryParent: nextBoundaryParent, parentNode: parentNode, currentPosition: currentPosition, nextPosition: nextPosition}
                  });
                }
              });
              if (actions.length > 1) {
                cy.undoRedo().do("batch", actions);
                handledBoundaryAction = true;
              } else if (actions.length === 1) {
                activeChiseInstance.freeNodeFromBoundary(actions[0].param.boundaryNode, actions[0].param.currentBoundaryParent, actions[0].param.nextBoundaryParent, actions[0].param.parentNode, actions[0].param.currentPosition, actions[0].param.nextPosition);
                handledBoundaryAction = true;
              }
            }
          }

          if (!handledBoundaryAction) {
            var newParent;
            if( self != cy) {
              newParent = self;
              nodes = nodes.difference(newParent);
              if (!newParent.data("class").startsWith("complex") && newParent.data("class") != "compartment" && newParent.data("class") != "submap") {
                newParent = newParent.parent()[0];
              }
            }

            appUtilities.disableDragAndDropMode(cy);

            var mouseDownNode = appUtilities.getScratch(cy, 'mouseDownNode');
            var pos = event.position || event.cyPosition;
            var dragAndDropStartPosition = appUtilities.getScratch(cy, 'dragAndDropStartPosition');

            if(self == cy ||(self != cy && mouseDownNode != self)) {
              chiseInstance.changeParent(nodes, newParent, pos.x - dragAndDropStartPosition.x, pos.y - dragAndDropStartPosition.y);
            }
          }

          if (handledBoundaryAction) {
            cy.one('free', 'node', function () {
              setTimeout(function () {
                var ur = cy.undoRedo();
                var stack = ur.getUndoStack();
                if (stack.length > 0 && stack[stack.length - 1].name === "drag") {
                  stack.pop();
                  appUtilities.refreshUndoRedoButtonsStatus(cy);
                }
              }, 0);
            });
          }

          appUtilities.setScratch(cy, 'dragAndDropStartPosition', null);
          appUtilities.setScratch(cy, 'nodesToDragAndDrop', null);
        }
        else {
          appUtilities.disableDragAndDropMode(cy);
          appUtilities.setScratch(cy, 'dragAndDropStartPosition', null);
          appUtilities.setScratch(cy, 'nodesToDragAndDrop', null);
        }

      }

      nodeToUnselect = undefined;

      /*  make palette tab active if no element is selected
          cannot be done on unselect event because it causes conflict with the select trigger
          when nodes are selected one after another
          after tests, seems better to do it here

          With the addition of the 3rd Map tab, we can probably keep the behavior
          when the user has the Object tab selected.
      */
      if (cy.elements(':selected').length == 0){
        /* edge case when the properties tab is already selected (and shown empty)
          and an element is selected, the property tab gets shown and the palette tab is concatenated after it
          we need to wait a bit before triggering the following, and check again if everything is unselected
          that is really dirty...
        */
        setTimeout(function () {
          if (cy.elements(':selected').length == 0){
            if ($('#inspector-style-tab').hasClass('active')) {
              $('#inspector-palette-tab a').tab('show');
              $('#inspector-style-tab a').blur();
              $('#inspector-map-tab a').blur();
            }
          }
        }, 20);
      }
    });
/*
    cy.on('mouseover', 'node', function (event) {
      var node = this;

      $(".qtip").remove();

      if (event.originalEvent.shiftKey)
        return;

      node.qtipTimeOutFcn = setTimeout(function () {
        nodeQtipFunction(node);
      }, 2500);
    });

    cy.on('mouseout', 'node', function (event) {
      if (this.qtipTimeOutFcn != null) {
        clearTimeout(this.qtipTimeOutFcn);
        this.qtipTimeOutFcn = null;
      }
    });
*/
    // Indicates whether creating a process with convenient edges
    var convenientProcessSource;
    // cyTarget will be selected after 'tap' event is ended by cy core. We do not want this behaviour.
    // Therefore we need to set node to unselect on 'tapend' event (this may be changed as 'tap' event later),
    //  which is to be unselected on 'select' event.
    var nodeToUnselect;

    // If mouesdown in add-node-mode and selected node type is a PN draw on edge handles and mark that creating a convenient process
    cy.on('mousedown', 'node', function() {
      var node = this;

      // get mode properties for cy
      var modeProperties = appUtilities.getScratch(cy, 'modeProperties');

      if (modeProperties.mode === 'add-node-mode' && chiseInstance.elementUtilities.isPNClass(modeProperties.selectedNodeType) && (chiseInstance.elementUtilities.isEPNClass(node) || chiseInstance.elementUtilities.isSBMLNode(node)) && !convenientProcessSource) {
        convenientProcessSource = node;
        cy.edgehandles('drawon');
      }
    });

    cy.on('tapend', function (event, relPos) {

      // This is a bit of a patch
      // Without this the alt + taphold shortcut for selection of objects of same type doesn't work
      // as all the elements except the original event target will be unselected without this
  
      if (altTapholdSelection) {
        setTimeout(function() {
          cy.autounselectify(false);
        }, 100);
        altTapholdSelection = null;
      }

      relPos = relPos || false;
      $('input').blur();

      var cyTarget;

      // get mode properties for cy
      var modeProperties = appUtilities.getScratch(cy, 'modeProperties');
      var currentGeneralProperties = appUtilities.getScratch(cy, "currentGeneralProperties");

      if (relPos){ // drag and drop case
        var nodesAtRelpos = chiseInstance.elementUtilities.getNodesAt(relPos);
        if (nodesAtRelpos.length == 0) { // when element is placed in the background
          cyTarget = cy;
        }
        else {
          // take last node as the parent one, as it seems that cy is behaving like this
          // caution, may not work some day, dirty hack
          cyTarget = nodesAtRelpos.pop();
        }
        // also be aware that not everything in the event may be correctly defined here
      }
      else { // normal click case
        cyTarget = event.target || event.cyTarget;
      }

      // If in add node mode do the followings conditionally,
      // If selected node type is a PN create a process and source and target nodes are EPNs with convenient edges,
      // else just create a new node with the current selected node type
      if (modeProperties.mode === "add-node-mode") {
        var nodeType = modeProperties.selectedNodeType;
        var nodeParams = {class : nodeType, language : modeProperties.selectedNodeLanguage};

        if( convenientProcessSource && cyTarget.isNode && cyTarget.isNode()
                && cyTarget.id() !== convenientProcessSource.id()
                && chiseInstance.elementUtilities.isPNClass(nodeType)
                && nodeType !== "phenotype"
                && ((chiseInstance.elementUtilities.isEPNClass(cyTarget) && chiseInstance.elementUtilities.isEPNClass(convenientProcessSource)) || (chiseInstance.elementUtilities.isSBMLNode(cyTarget) && chiseInstance.elementUtilities.isSBMLNode(convenientProcessSource)))
                && !(cyTarget.parent()[0] != undefined && (chiseInstance.elementUtilities.isEPNClass(cyTarget.parent()[0]) || chiseInstance.elementUtilities.isSBMLNode(cyTarget.parent()[0])) ||
                  convenientProcessSource.parent()[0] != undefined && (chiseInstance.elementUtilities.isEPNClass(convenientProcessSource.parent()[0]) || chiseInstance.elementUtilities.isSBMLNode(convenientProcessSource.parent()[0]))))
        {
          chiseInstance.addProcessWithConvenientEdges(convenientProcessSource, cyTarget, nodeParams);
          //Update arrow scale of the newly added edge
          var addedEdge = cy.elements()[cy.elements().length - 1];
          var currentArrowScale = Number($('#arrow-scale').val());
          addedEdge.style('arrow-scale', currentArrowScale);
        }
        else {
          var cyPosX;
          var cyPosY;
          if (relPos) {
            modelPos = chiseInstance.elementUtilities.convertToModelPosition(relPos);
            cyPosX = modelPos.x;
            cyPosY = modelPos.y;
          }
          else {
            var pos = event.position || event.cyPosition;
            cyPosX = pos.x;
            cyPosY = pos.y;
          }


          var parent, parentId, parentClass;

          // If cyTarget is a node determine the parent of new node
          if (cyTarget.isNode && cyTarget.isNode()) {
            if (cyTarget.data('class').startsWith('complex') || cyTarget.data('class') === 'compartment'
                ||  cyTarget.data('class') == 'submap') {
              parent = cyTarget;
            }
            else {
              parent = cyTarget.parent()[0];
            }

            // Set nodeToUnselect here
            nodeToUnselect = cyTarget;
          }

          // If parent is defined get parentId and parentClass
          if (parent) {
            parentId = parent.id();
            parentClass = parent.data('class');
          }

          // If the parent class is valid for the node type then add the node
          if (chiseInstance.elementUtilities.isValidParent(nodeType, parentClass)) {

            var isMapTypeValid = false;
           
            var currentMapType = chiseInstance.getMapType();
            if(currentMapType == "HybridAny"){
              isMapTypeValid = true;
            }else if((currentMapType == "HybridPDAF") &&
              (nodeParams.language == "PD" || nodeParams.language =="AF")){
              isMapTypeValid = true;
            }else if(currentMapType == nodeParams.language){
              isMapTypeValid = true;
            }else if(cy.elements().length == 0){ // if canvas is empty, change the map type and add node
                chiseInstance.elementUtilities.setMapType(nodeParams.language);
                $(document).trigger("changeMapTypeFromMenu", [nodeParams.language]);
                currentMapType = nodeParams.language;
                isMapTypeValid = true;
            }
            // if added node changes map type, warn user
            if (chiseInstance.getMapType() && !isMapTypeValid){

              appUtilities.promptMapTypeView.render("You cannot add element of type "+ appUtilities.mapTypesToViewableText[nodeParams.language]  + " to a map of type "+appUtilities.mapTypesToViewableText[currentMapType] +"!","You can change map type from Map Properties.");
            }
            // Check if SIF topology grouping is enabled and map type is SIF, and show warning if it is
            else if (currentMapType === "SIF" && 
              currentGeneralProperties.enableSIFTopologyGrouping){
                appUtilities.promptSIFTopologyGroupingWarning.render()
            }
            else{
              chiseInstance.addNode(cyPosX, cyPosY, nodeParams, undefined, parentId);
              if (nodeType === 'process' || nodeType === 'omitted process' || nodeType === 'uncertain process' || nodeType === 'association' || nodeType == 'truncated process' || nodeType == 'unknown logical operator' || nodeType === 'dissociation'  || nodeType === 'and'  || nodeType === 'or'  || nodeType === 'not' || nodeType === 'delay')
                {
                    var newEle = cy.nodes()[cy.nodes().length - 1];
                    var defaultPortsOrdering = chiseInstance.elementUtilities.getDefaultProperties(nodeType)['ports-ordering'];
                    chiseInstance.elementUtilities.setPortsOrdering(newEle, ( defaultPortsOrdering ? defaultPortsOrdering : 'L-to-R'));
                }
              
                if (nodeType === 'tag') {
                  var newEle = cy.nodes()[cy.nodes().length - 1];
                  if (!newEle.data('orientation')) {
                    newEle.data('orientation', 'right');
                  }
                }
                // If the node will not be added to the root then the parent node may be resized and the top left corner pasition may change after
                // the node is added. Therefore, we may need to clear the expand collapse viusal cue.
                if (parent) {
                  cy.expandCollapse('get').clearVisualCue();
                }
            }
          }
        }

        // If not in sustainable mode set selection mode
        if (!modeProperties.sustainMode) {
          modeHandler.setSelectionMode();
        }
      }

      // Signal that creation of convenient process is finished
      if (convenientProcessSource) {
        convenientProcessSource = undefined;
        // cy.edgehandles('drawoff'); call will set the autoungrabify state the value of autoungrabify before the drawon
        // however here we do not want to change that state here so we need to keep the current ungrabify state and return back to it
        // after cy.edgehandles('drawoff'); is called
        var currentUngrabifyState = cy.autoungrabify();
        // After tap is performed drawoff edgehandles
        cy.edgehandles('drawoff');
        // Return the current current ungrabify state (Do not let edge handles to change it)
        cy.autoungrabify(currentUngrabifyState);
      }

      appUtilities.removeDragImage();
    });

    var tappedBefore;

    cy.on('tap', 'node', function (event) {
      var node = this;

      var tappedNow = node;
      setTimeout(function () {
        tappedBefore = null;
      }, 300);
      if (tappedBefore && tappedBefore.id() === tappedNow.id()) {
        tappedNow.trigger('doubleTap');
        tappedBefore = null;
      } else {
        tappedBefore = tappedNow;
      }

//      $(".qtip").remove();

      if (event.originalEvent.shiftKey)
        return;
/*
      if (node.qtipTimeOutFcn != null) {
        clearTimeout(node.qtipTimeOutFcn);
        node.qtipTimeOutFcn = null;
      }

      nodeQtipFunction(node);
*/
    });

    cy.on('doubleTap', 'node', function (event) {
      // Prevent double click on nodes to edit label if in annotation layer (layer 1+)
      if (window.annotationLayers && window.annotationLayers.getCurrentLayer && window.annotationLayers.getCurrentLayer().isAnnotationLayer) {
        return;
      }
      // get mode properties for cy
      var modeProperties = appUtilities.getScratch(cy, 'modeProperties');

      if (modeProperties.mode == 'selection-mode') {
        var node = this;

        if (!chiseInstance.elementUtilities.canHaveSBGNLabel(node)) {
          return;
        }

        var nodeLabelTextbox = $("#node-label-textbox");
        var containerPos = $(cy.container()).position();
        var containerWidth = $(cy.container()).width();
        var containerHeight = $(cy.container()).height();

        // Adjust left of the textbox
        var left = containerPos.left + this.renderedPosition().x;
        left -= nodeLabelTextbox.width() / 2;
        // If textbox goes beyond the borders of container, "+5" is for better seperation
        if(left < containerPos.left){
          left = containerPos.left + 5;
        }
        if((left + nodeLabelTextbox.width()) > (containerPos.left + containerWidth)){
          left -= (left + nodeLabelTextbox.width()) - (containerPos.left + containerWidth) + 5;
        }

        left = left.toString() + 'px';

        // Adjust top of the textbox
        var top = containerPos.top + this.renderedPosition().y;
        top -= nodeLabelTextbox.height() / 2;

        //For complexes and compartments move the textarea to the bottom
        var nodeType = node.data('class');
        if (nodeType == "compartment" || nodeType.startsWith("complex") || nodeType == "submap")
            top += (node.outerHeight() / 2 * cy.zoom() );

        // If textbox goes beyond the borders of container, "+5" is for better seperation
        if(top < containerPos.top){
          top = containerPos.top + 5;
        }
        if((top + nodeLabelTextbox.height()) > (containerPos.top + containerHeight)){
          top -= (top + nodeLabelTextbox.height()) - (containerPos.top + containerHeight) + 5;
        }

        top = top.toString() + 'px';

        nodeLabelTextbox.css('left', left);
        nodeLabelTextbox.css('top', top);
        cy.nodes().unselect();
        nodeLabelTextbox.show();
        var sbgnlabel = this.data('label');
        if (sbgnlabel == null) {
          sbgnlabel = "";
        }
        nodeLabelTextbox.val(sbgnlabel);
        nodeLabelTextbox.data('node', this);
        nodeLabelTextbox.focus();
        nodeLabelTextbox.select();
      }
    });

    var handleInspectorThrottled = _.throttle(function() {
      inspectorUtilities.handleSBGNInspector();
    }, 200);

    // When we select/unselect many elements in one operation these 'select' / 'unselect' events called may times
    // and unfortunetaly the inspector is refreshed many times. This seriously decreases the performance. To handle this
    // problem we call the method used to refresh the inspector in a throttled way and decrease the number of calls.
    cy.on('select', function() {
      // Go to inspector style/properties tab when a node is selected
     // if (!$('#inspector-style-tab').hasClass('active')) {
        handleInspectorThrottled();  
        $('#inspector-style-tab a').tab('show');
        $('#inspector-palette-tab a').blur();
        $('#inspector-map-tab a').blur();
     // }
      //Remove grapples while node-label-textbox is visible
      if($("#node-label-textbox").is(":visible")){
        cy.nodeEditing('get').removeGrapples();
      }
    });

    cy.on('unselect', function() {
      if($("#node-label-textbox").is(":visible")){
        cy.nodes().unselect();
      }
      $("#node-label-textbox").blur();
      handleInspectorThrottled();
    });

    /*
     * Set/unset the first selected node on select/unselect node events to align w.r.t that node when needed
     */
    cy.on('select', 'node', function() {
      if (!appUtilities.firstSelectedNode) {
        appUtilities.firstSelectedNode = this;
      }

      // Unselect nodeToUnselect and then unset it here
      if (nodeToUnselect && nodeToUnselect.id() === this.id()) {
        nodeToUnselect.unselect();
        nodeToUnselect = undefined;
      }
    });

    cy.on('unselect', 'node', function() {
      if (appUtilities.firstSelectedNode && appUtilities.firstSelectedNode.id() === this.id()) {
        appUtilities.firstSelectedNode = undefined;
      }
    });

    // infobox refresh when resize happen, for simple nodes
    /* cy.on('nodeediting.resizedrag', function(e, type, node) {
      if(node.data('statesandinfos').length > 0) {
        updateInfoBox(node);
      }
    }); */
    
    cy.on("layoutstart",function(event){   
     var node = cy.nodes(":selected").nodes(":parent");
     if(node.length == 1)
      node[0].data("onLayout", true);
    });    

    cy.on('layoutstop', function (event) {
  		/*
  		* 'preset' layout is called to give the initial positions of nodes by sbgnviz.
  		* Seems like 'grid' layout is called by Cytoscape.js core in loading graphs.
  		* If the layout is not one of these (normally it is supposed to be 'cose-bilkent')
  		* stop layout spinner for the related chise instance.
  		*/
      if (event.layout.options.name !== 'preset' && event.layout.options.name !== 'grid')
      {
        appUtilities.getChiseInstance(cy).endSpinner('layout-spinner');
      }
    /*   var nodesToConsider = cy.nodes().filter(function(node){
        var sbgnClass = node.data('class');
        if (sbgnClass == 'complex' || sbgnClass == 'complex multimer' || sbgnClass == 'compartment') {
          return true;
        }
      });
      nodesToConsider.forEach(function(ele){
        // skip nodes without any auxiliary units
        if(!ele.data('statesandinfos') || ele.data('statesandinfos').length == 0) {
          return;
        }
        var locations = chiseInstance.elementUtilities.checkFit(ele); //Fit all locations
        chiseInstance.elementUtilities.fitUnits(ele, locations); //Force fit
      }); */

      cy.nodes("[?onLayout]").forEach(function(node){node.removeData("onLayout"); });
    });

    // if the position of compound changes by repositioning its children
    // Note: position event for compound is not triggered in this case
    // edge case: when moving a complex, it triggers the position change of the children,
    // which then triggers the event below.
    var oldPos = {x: undefined, y: undefined};
    var currentPos = {x : 0, y : 0};
    cy.on("position", "node:child", function(event) {
      var parent = event.target.parent();
      if(!parent.is("[class^='complex'], [class^='compartment']")) {
        return;
      }
      currentPos = parent.position();
      if (currentPos.x != oldPos.x || currentPos.y != oldPos.y){
          oldPos = {x : currentPos.x, y : currentPos.y};
          cy.trigger('nodeediting.resizedrag', ['unknown', parent]);
      }
    });

    // update background image style when data changes
    cy.on('data', 'node', function(event) {
      var node = event.target;

      if(!node || !node.isNode())
        return;

      var keys = ['background-image', 'background-fit', 'background-image-opacity',
        'background-position-x', 'background-position-y', 'background-height', 'background-width'];

      var opt = {};
      keys.forEach(function(key) {
        opt[key] =  node.data(key);
      });

      node.style(opt);
    });

    // Select elements of same type (sbgn class) on taphold + alt key down
    var altTapholdSelection;
    cy.on('taphold', 'node, edge', function (event) {
      if (appUtilities.altKeyDown) {
        var cyTarget = event.target || event.cyTarget;
        appUtilities.selectAllElementsOfSameType(cyTarget);
        cy.autounselectify(true);
        altTapholdSelection = true;
      }
    });

    /* removed coz of  complications 
    cy.on('remove', 'node', function(event) {
      if(cy.elements().length < 1){
        chiseInstance.resetMapType();
      }
    });
    */
  }

  function updateInfoBox(node) {
    var locations = chiseInstance.elementUtilities.checkFit(node); //Fit all locations
    if (locations !== undefined && locations.length > 0) {
      var firstTime = true;
      for (var i = 0; i < locations.length; i++) {
        if( chiseInstance.classes.AuxUnitLayout.getCurrentGap(locations[i]) < chiseInstance.classes.AuxUnitLayout.unitGap) {
          firstTime = false;
          break;
        }
      }
      if (firstTime === true) {
        chiseInstance.fitUnits(node, locations); //Force fit
      }
      else {
        chiseInstance.elementUtilities.fitUnits(node, locations);
      }
    }
  }
};


