var jquery = ($ = require("jquery"));
var neo4j = require("neo4j-driver");
var _ = require("underscore");
var nodeMatchUtilities = require("./node-match-utilities");
var graphALgos = require("./graph-algos");
var chise = require("chise");
var appUtilities = require("./app-utilities");

var databaseUtilities = {
  enableDatabase: true,
  nodesInDB: {},
  edgesInDB: {},

  calculateClass: function (entitysClass) {
    var classArray = entitysClass.split(" ");
    var classArray = classArray.filter((string) => string !== "multimer");
    var finalClass = classArray.join("_");
    return finalClass;
  },
  getMapValue: function (val) {
    return databaseUtilities.nodesInDB[val] || null;
  },
  checkIfMultimer: function (entitysClass) {
    return entitysClass.includes("multimer");
  },

  calculateState: function (statesAndInfos) {
    var states = statesAndInfos.filter(
      (item) => item.clazz === "state variable"
    );
    var refinedStates = [];
    for (let i = 0; i < states.length; i++) {
      var value = states[i].state.value || "";
      var variable = states[i].state.variable || "";
      refinedStates.push(value + "@" + variable);
    }
    return refinedStates.sort();
  },

  calculateInfo: function (statesAndInfos) {
    var infos = statesAndInfos.filter(
      (item) => item.clazz == "unit of information"
    );
    var refinedInfos = [];
    for (let i = 0; i < infos.length; i++) {
      var text = infos[i].label.text || "";
      refinedInfos.push(text);
    }
    return refinedInfos.sort();
  },

  processPdNode: function (currentNode, data) {
    currentNode.newtId = data.id;
    currentNode.entityName = data.label || "";
    currentNode.language = data.language;
    currentNode.class = databaseUtilities.calculateClass(data.class);
    currentNode.multimer = databaseUtilities.checkIfMultimer(data.class);
    currentNode.stateVariables = databaseUtilities.calculateState(
      data.statesandinfos
    );
    currentNode.unitsOfInformation = databaseUtilities.calculateInfo(
      data.statesandinfos
    );
    currentNode.cloneMarker = data.clonemarker || false;
    currentNode.cloneLabel = "";
    if (data.hasOwnProperty("parent")) {
      currentNode.parent = data.parent;
    }
  },

  processPdEdge: function (currentEdge, data) {
    currentEdge.stoichiometry = data.cardinality || 0;
    currentEdge.class = databaseUtilities.calculateClass(data.class);
    currentEdge.source = data.source;
    currentEdge.target = data.target;
  },
  processNodesData: function (nodesData, activeTabContent) {
    for (let i = 0; i < activeTabContent.nodes.length; i++) {
      var currentNode = {};
      var data = activeTabContent.nodes[i].data;
      if (data.language == "PD") {
        databaseUtilities.processPdNode(currentNode, data);
      }
      nodesData.push(currentNode);
    }
  },

  processEdgesData: function (edgesData, activeTabContent) {
    for (let i = 0; i < activeTabContent.edges.length; i++) {
      var currentEdge = {};
      var data = activeTabContent.edges[i].data;
      if (data.language == "PD") {
        databaseUtilities.processPdEdge(currentEdge, data);
      }
      edgesData.push(currentEdge);
    }
  },

  pushActiveContentToDatabase: async function (nodesData, edgesData) {
    await databaseUtilities.processData(nodesData, edgesData);
    databaseUtilities.pushActiveNodesToDatabase(nodesData, edgesData);
  },

  processData: async function (nodesData, edgesData) {
    var parentChildRelationship = {};
    var parentNodes = {};
    var nodesMap = {};
    var specialNodes = {};
    console.log("nodesData", nodesData);
    console.log("edgesData", edgesData);

    // specialNodes map with be in this format (newtId or process Node): [[sourceClass, sourceCloneLab, sourceCloneMarker, sourceEntityName,
    //sourceMultimer, sourceParent, sourceStateVariable1,.., sourceStateVariableN, sourceUnitInformation1,..sourceUnitInformationN],
    //[targetClass, targetCloneLab, targetCloneMarker, targetEntityName, targeteMultimer, targetParent, targetStateVariable1,..,targetStateVariableN, targetUnitInformation1,...targetUnitInformationN],
    //[modifierClass, modifierCloneLab, modifierCloneMarker, modifierEntityName, modifierMultimer, modifierParent, modifierStateVariable1,..,modifierStateVariableN, modifierUnitInformation1,...,modifierUnitInformationN],

    //Check if node is already pushed
    for (let i = 0; i < nodesData.length; i++) {
      nodesData[i].inDb = false;
      if (databaseUtilities.nodesInDB[nodesData[i].newtId]) {
        nodesData[i].inDb = true;
        nodesData[i].idInDb = databaseUtilities.nodesInDB[nodesData[i].newtId];
      }
      //And keep track of complex, compartment, submap
      if (
        nodesData[i].class == "complex" ||
        nodesData[i].class == "compartment" ||
        nodesData[i].class == "submap"
      ) {
        parentNodes[nodesData[i].newtId] = nodesData[i].class;
      }
      if (!nodesData[i].parent) {
        nodesData[i].parent = "none";
      }
      if (
        nodesData[i].class.endsWith("process") ||
        nodesData[i].class == "association" ||
        nodesData[i].class == "dissociation"
      ) {
        specialNodes[nodesData[i].newtId] = [[], [], []];
      }
      nodesMap[nodesData[i].newtId] = nodesData[i];
    }

    console.log("specialNodes before", specialNodes);

    //Add child parent relationships if any
    for (let i = 0; i < nodesData.length; i++) {
      if (nodesData[i].parent != "none") {
        //Add to edgesData
        var newEdge = {
          source: nodesData[i].newtId,
          target: nodesData[i].parent,
          class: "belongs_to_" + parentNodes[nodesData[i].parent],
        };
        edgesData.push(newEdge);
      }
    }

    for (let i = 0; i < edgesData.length; i++) {
      edgesData[i].inDb = false;
      console.log([
        edgesData[i].source,
        edgesData[i].target,
        edgesData[i].class,
      ]);
      if (
        databaseUtilities.edgesInDB[
          [edgesData[i].source, edgesData[i].target, edgesData[i].class]
        ]
      ) {
        console.log("edge in db");
        edgesData[i].inDb = true;
        edgesData[i].idInDb =
          databaseUtilities.edgesInDB[
            databaseUtilities.edgesInDB[
              (edgesData[i].source, edgesData[i].target, edgesData[i].class)
            ]
          ];
      }
      edgesData[i].sourceClass = nodesMap[edgesData[i].source].class;
      edgesData[i].targetClass = nodesMap[edgesData[i].target].class;

      //Process process nodes
      if (
        specialNodes[edgesData[i].source] &&
        nodesMap[edgesData[i].target].class != "compartment" &&
        nodesMap[edgesData[i].target].class != "submap" &&
        nodesMap[edgesData[i].target].class != "complex"
      ) {
        var targetId = edgesData[i].target;
        var target = nodesMap[targetId];
        console.log("seen as source", specialNodes[edgesData[i].source][1]);
        var len = specialNodes[edgesData[i].source][1].length;
        specialNodes[edgesData[i].source][1].push([
          target.class,
          target.cloneLabel.toString(),
          target.cloneMarker.toString(),
          target.entityName,
          target.multimer.toString(),
          target.parent,
        ]);
        specialNodes[edgesData[i].source][1][len].push(
          ...target.stateVariables
        );
        specialNodes[edgesData[i].source][1][len].push(
          ...target.unitsOfInformation
        );
      } else if (specialNodes[edgesData[i].target]) {
        var sourceId = edgesData[i].source;
        var source = nodesMap[sourceId];
        console.log("seen as target", source);
        var len_0 = specialNodes[edgesData[i].target][0].length;
        var len_2 = specialNodes[edgesData[i].target][2].length;
        //Not a modifier
        if (
          edgesData[i].class != "modulation" &&
          edgesData[i].class != "stimulation" &&
          edgesData[i].class != "catalysis" &&
          edgesData[i].class != "inhibition" &&
          edgesData[i].class != "necessary_stimulation"
        ) {
          specialNodes[edgesData[i].target][0].push([
            source.class,
            source.cloneLabel.toString(),
            source.cloneMarker.toString(),
            source.entityName,
            source.multimer.toString(),
            source.parent,
          ]);
          specialNodes[edgesData[i].target][0][len_0].push(
            ...source.stateVariables
          );
          specialNodes[edgesData[i].target][0][len_0].push(
            ...source.unitsOfInformation
          );
        } else {
          specialNodes[edgesData[i].target][2].push([
            source.class,
            source.cloneLabel.toString(),
            source.cloneMarker.toString(),
            source.entityName,
            source.multimer.toString(),
            source.parent,
          ]);
          specialNodes[edgesData[i].target][2][len_2].push(
            ...source.stateVariables
          );
          specialNodes[edgesData[i].target][2][len_2].push(
            ...source.unitsOfInformation
          );
        }
      }
    }

    //Update specialNodes
    console.log("specialNodes", specialNodes);
    for (let i = 0; i < nodesData.length; i++) {
      if (
        nodesData[i].class.endsWith("process") ||
        nodesData[i].class == "association" ||
        nodesData[i].class == "dissociation"
      ) {
        for (let j = 0; j < specialNodes[nodesData[i].newtId][0].length; j++) {
          nodesData[i]["source_" + j] = specialNodes[nodesData[i].newtId][0][j];
        }

        for (let j = 0; j < specialNodes[nodesData[i].newtId][1].length; j++) {
          nodesData[i]["target_" + j] = specialNodes[nodesData[i].newtId][1][j];
        }

        for (let j = 0; j < specialNodes[nodesData[i].newtId][2].length; j++) {
          nodesData[i]["modifier_" + j] =
            specialNodes[nodesData[i].newtId][2][j];
        }
        nodesData[i].isSpecial = true;
      } else {
        nodesData[i].isSpecial = false;
      }
    }
  },

  pushActiveNodesToDatabase: function (nodesData, edgesData) {
    console.log("about to push nodes", nodesData);
    console.log("about to push edges", edgesData);
    var matchClass = true;
    var matchLabel = true;
    var matchId = false;
    var matchMultimer = true;
    var matchCloneMarker = true;
    var matchCloneLabel = true;
    var matchStateVariable = true;
    var matchUnitInformation = true;
    var matchParent = true;

    var integrationQuery = `UNWIND $nodesData as data 
    CALL apoc.do.when( data.inDb, 
      "CALL
        apoc.cypher.doIt('
          MATCH (u)
          WHERE  u.newtId = data.newtId and id(u) = data.idInDb
          SET u = data
          RETURN u as node', {data:data})  
        YIELD value 
        RETURN value.node as node", 
      "CALL
        apoc.cypher.doIt('
          CALL apoc.do.when( data.isSpecial, 
            \\"MATCH (u)
            WHERE ${nodeMatchUtilities.matchProcessNodes(
              "data",
              "u",
              true,
              true,
              true,
              true
            )}
            RETURN COUNT(u) as cnt\\",
            \\"MATCH (u)
            WHERE  ${nodeMatchUtilities.match(
              "data",
              "u",
              matchId,
              matchClass,
              false,
              matchMultimer,
              matchCloneMarker,
              matchCloneLabel,
              matchStateVariable,
              matchUnitInformation,
              true,
              matchParent
            )}
            RETURN COUNT(u) as cnt\\", 
          {data:data}) 
          YIELD value
          RETURN value.cnt as cnt', {data: data})
          YIELD value
        WITH value.cnt as cnt, data
        CALL
        apoc.cypher.doIt('
          CALL apoc.do.when( cnt > 0, \\"MATCH (u) WHERE ${nodeMatchUtilities.match(
            "data",
            "u",
            matchId,
            matchClass,
            false,
            matchMultimer,
            matchCloneMarker,
            matchCloneLabel,
            matchStateVariable,
            matchUnitInformation,
            true,
            matchParent
          )} RETURN u.newtId as id \\", \\"RETURN null as id\\",
                {data:data, cnt: cnt}) 
                YIELD value
                RETURN value.id as id', 
          {data:data, cnt: cnt} )
        YIELD value
        WITH value.id as id, data
        CALL
        apoc.cypher.doIt('
              CALL apoc.do.when(id is not null , \\"RETURN 1 as node\\",
              \\"CALL apoc.create.node([data.class], data)
              YIELD node
              SET node.processed = 0
              RETURN node as node\\", {data: data})
              YIELD value
              RETURN value.node as node
            ', {data:data, id: id})
            YIELD value
            RETURN value.node as node",
      {data:data})
    YIELD value
    WITH collect(value.node) as nodes
    CALL 
    apoc.cypher.doIt("
      UNWIND $edgesData AS data 
      CALL apoc.do.when(data.inDb,
        'RETURN null as rel',
        'CALL  apoc.cypher.doIt(\\"MATCH (a)-[r]->(b)
          WHERE ${nodeMatchUtilities.matchEdges("r", "data", true, true)}
          RETURN COUNT(r) as cnt \\", {data:data})
          YIELD value
        WITH value.cnt as cnt, data
        CALL apoc.do.when(cnt>0 , \\" RETURN 1 as rel\\",
              \\"MATCH (n {newtId: data.source}), (m { newtId: data.target})  
               WITH DISTINCT n, m, data
              CALL apoc.create.relationship(n,data.class,data,m) YIELD rel  
               WITH rel
          SET rel.processed = 0
          RETURN rel as rel \\", {data:data})
         YIELD value
         RETURN value.rel as rel',
        {data: data}
      )
      YIELD value
      RETURN collect(value.rel) as rel
      ",
      {edgesData: $edgesData})
    YIELD value
    RETURN nodes as nodes, value.rel as edges`;

    var queryData = { nodesData: nodesData, edgesData: edgesData };
    var data = { query: integrationQuery, queryData: queryData };

    $.ajax({
      type: "post",
      url: "/utilities/runDatabaseQuery",
      contentType: "application/json; charset=utf-8",
      data: JSON.stringify(data),
      success: function (data) {
        console.log(data);
        let nodes = data.records[0]._fields[0];
        let edges = data.records[0]._fields[1];
        console.log("After pushing nodes", nodes);
        console.log("After pushing edges", edges);

        if (nodes) {
          for (let i = 0; i < nodes.length; i++) {
            if (nodes[i].properties) {
              databaseUtilities.nodesInDB[nodes[i].properties.newtId] =
                nodes[i].identity.low;
            } else if (nodes[i].newtId) {
              databaseUtilities.nodesInDB[nodes[i].newtId] =
                nodes[i].identity.low;
            }
          }
        }

        if (edges) {
          for (let i = 0; i < edges.length; i++) {
            databaseUtilities.edgesInDB[
              [
                edges[i].properties.source,
                edges[i].properties.target,
                edges[i].properties.class,
              ]
            ] = edges[i].identity.low;
          }
        }

        console.log(databaseUtilities.nodesInDB);
        console.log(databaseUtilities.edgesInDB);
      },
      error: function (req, status, err) {
        console.error("Error running query", status, err);
      },
    });
  },

  //Queries
  getIdOfLabeledNodes: async function (labelOfNodes, idOfNodes) {
    var query = `UNWIND $labelOfNodes as label
                   MATCH (u)
                   WHERE u.entityName = label
                   RETURN id(u)`;
    var queryData = { labelOfNodes: labelOfNodes };

    var data = { query: query, queryData: queryData };
    var idNodes = [];
    await $.ajax({
      type: "post",
      url: "/utilities/runDatabaseQuery",
      contentType: "application/json; charset=utf-8",
      data: JSON.stringify(data),
      success: function (data) {
        console.log(data);

        for (var i = 0; i < data.records.length; i++) {
          console.log("hree");
          idOfNodes.push(data.records[i]._fields[0].low);
        }
        console.log("idNodes", idNodes);
      },
      error: function (req, status, err) {
        console.error("Error running query", status, err);
      },
    });
  },

  addNodesEdgesToCy: function (nodes, edges) {
    var chiseInstance = appUtilities.getActiveChiseInstance();
    let nodesToHighlight = [];
    let edgesToHighlight = [];
    let edgesToAdd = [];
    let nodesToAdd = [];

    console.log("nodes about to add", nodes);
    console.log("edges about to add", edges);
    for (let i = 0; i < nodes.length; i++) {
      for (let j = 0; j < nodes.length; j++) {
        if (!databaseUtilities.nodesInDB[nodes[j].properties.newtId]) {
          databaseUtilities.nodesInDB[nodes[j].properties.newtId] =
            nodes[j].identity.low;
          nodesToAdd.push(nodes[j]);
        }
        nodesToHighlight.push(nodes[j]);
      }

      for (let j = 0; j < edges.length; j++) {
        //Check if edge already exists in map
        if (
          !databaseUtilities.edgesInDB[
            [
              edges[j].properties.source,
              edges[j].properties.target,
              edges[j].properties.class,
            ]
          ]
        ) {
          edgesToAdd.push(edges[j]);
          databaseUtilities.edgesInDB[
            [
              edges[j].properties.source,
              edges[j].properties.target,
              edges[j].properties.class,
            ]
          ] = edges[j].identity.low;
        }
        edgesToHighlight.push(edges[j]);
      }
    }

    console.log("nodes to add", nodesToAdd);
    console.log("edges to add", edgesToAdd);
    console.log("nodes to high", nodesToHighlight);
    console.log("edges to high", edgesToHighlight);

    //Add nodes without any parents first
    for (let i = 0; i < nodesToAdd.length; i++) {
      if (!nodesToAdd[i].properties.parent) {
        var nodeParams = {
          class: nodesToAdd[i].properties.class,
          language: "PD",
        };
        chiseInstance.addNode(
          0,
          0,
          nodeParams,
          nodesToAdd[i].properties.newtId,
          undefined
        );
      }
      //chiseInstance.changeNodeLabel(nodesToAdd[i].properties.newtId, nodesToAdd[i].properties.entityName);
    }

    //Then add children
    for (let i = 0; i < nodesToAdd.length; i++) {
      console.log("parent", nodesToAdd[i].properties.parent);

      if (nodesToAdd[i].properties.parent) {
        var nodeParams = {
          class: nodesToAdd[i].properties.class,
          language: "PD",
        };
        chiseInstance.addNode(
          0,
          0,
          nodeParams,
          nodesToAdd[i].properties.newtId,
          nodesToAdd[i].properties.parent
        );
      }
      //chiseInstance.changeNodeLabel(nodesToAdd[i].properties.newtId, nodesToAdd[i].properties.entityName);
    }

    for (let i = 0; i < edges.length; i++) {
      if (
        edgesToAdd[i].properties.class != "belongs_to_submap" &&
        edgesToAdd[i].properties.class != "belongs_to_compartment" &&
        edgesToAdd[i].properties.class != "belongs_to_complex"
      )
        chiseInstance.addEdge(
          edgesToAdd[i].properties.source,
          edgesToAdd[i].properties.target,
          edgesToAdd[i].properties.class,
          undefined,
          undefined
        );
    }
    // chiseInstance.performLayout(options, notUndoable);
  },

  runPathsFromTo: async function (sourceArray, targetArray, limit) {
    query = graphALgos.pathsFromTo(sourceArray, targetArray, limit);
    var queryData = { sourceArray: sourceArray, targetArray: targetArray };
    var data = { query: query, queryData: queryData };

    await $.ajax({
      type: "post",
      url: "/utilities/runDatabaseQuery",
      contentType: "application/json; charset=utf-8",
      data: JSON.stringify(data),
      success: async function (data) {
        console.log("data", data);
        var fields = data.records[0]._fields;
        var nodes = [];
        var edges = [];
        for (let i = 0; i < fields.length; i++) {
          if (!fields[i].start) {
            nodes.push(fields[i]);
          } else {
            var edge = {};
            edge.properties = {};
            edge.identity = {};
            edge.properties.source = fields[i].start.properties.newtId;
            edge.properties.target = fields[i].end.properties.newtId;
            edge.properties.class = fields[i].segments[0].relationship.type;
            edge.identity.low = fields[i].segments[0].relationship.identity.low;
            edges.push(edge);
          }
        }
        await databaseUtilities.addNodesEdgesToCy(nodes, edges);
      },
      error: function (req, status, err) {
        console.error("Error running query", status, err);
      },
    });
  },

  runPathBetween: async function (labelOfNodes, lengthLimit) {
    console.log("labelOfNodes", labelOfNodes);
    console.log("lengthLimit", lengthLimit);
    var idOfNodes = [];
    await databaseUtilities.getIdOfLabeledNodes(labelOfNodes, idOfNodes);
    var query = graphALgos.pathsBetween(idOfNodes, lengthLimit);
    console.log("idOfNodes in runpaths", idOfNodes);

    var data = { query: query, queryData: null };
    var result = {};
    result.highlight = {};
    result.add = {};
    await $.ajax({
      type: "post",
      url: "/utilities/runDatabaseQuery",
      contentType: "application/json; charset=utf-8",
      data: JSON.stringify(data),
      success: async function (data) {
        console.log("data", data);
        var nodes = [];
        var edges = [];
        var records = data.records;
        for (let i = 0; i < records.length; i++) {
          var fields = records[i]._fields;
          for (let j = 0; j < fields[0].length; j++) {
            nodes.push(fields[0][j]);
          }
          for (let j = 0; j < fields[4].length; j++) {
            var edge = {};
            edge.properties = {};
            edge.identity = {};
            edge.properties.source = fields[4][j].properties.source;
            edge.properties.target = fields[4][j].properties.target;
            edge.properties.class = fields[4][j].properties.class;
            edge.identity.low = fields[4][j].identity.low;
            edges.push(edge);
          }
        }

        await databaseUtilities.addNodesEdgesToCy(nodes, edges);
      },
      error: function (req, status, err) {
        console.error("Error running query", status, err);
      },
    });
    return result;
  },
  runNeighborhood: async function (labelOfNodes, lengthLimit) {
    var idOfNodes = [];
    await databaseUtilities.getIdOfLabeledNodes(labelOfNodes, idOfNodes);
    var query = graphALgos.neighborhood(idOfNodes, lengthLimit);
    console.log("idOfNodes in runpaths", idOfNodes);

    var data = { query: query, queryData: null };
    var result = {};
    result.highlight = {};
    result.add = {};
    await $.ajax({
      type: "post",
      url: "/utilities/runDatabaseQuery",
      contentType: "application/json; charset=utf-8",
      data: JSON.stringify(data),
      success: async function (data) {
        console.log("data", data);
        var nodes = [];
        var edges = [];
        var records = data.records;
        for (let i = 0; i < records.length; i++) {
          var fields = records[i]._fields;
          for (let j = 0; j < fields[0].length; j++) {
            nodes.push(fields[0][j]);
          }
          for (let j = 0; j < fields[4].length; j++) {
            var edge = {};
            edge.properties = {};
            edge.identity = {};
            edge.properties.source = fields[4][j].properties.source;
            edge.properties.target = fields[4][j].properties.target;
            edge.properties.class = fields[4][j].properties.class;
            edge.identity.low = fields[4][j].identity.low;
            edges.push(edge);
          }
        }
        await databaseUtilities.addNodesEdgesToCy(nodes, edges);
      },
      error: function (req, status, err) {
        console.error("Error running query", status, err);
      },
    });
    return result;
  },

  runCommonStream: async function (labelOfNodes, lengthLimit, direction) {
    var idOfNodes = [];
    await databaseUtilities.getIdOfLabeledNodes(labelOfNodes, idOfNodes);
    var query = "";
    if (direction == -1) {
      query = graphALgos.commonStream(idOfNodes, lengthLimit);
    } else if (direction == 1) {
      query = graphALgos.upstream(idOfNodes, lengthLimit);
    } else {
      query = graphALgos.downstream(idOfNodes, lengthLimit);
    }

    console.log("idOfNodes in runpaths", idOfNodes);

    var data = { query: query, queryData: null };
    var result = {};
    result.highlight = {};
    result.add = {};
    await $.ajax({
      type: "post",
      url: "/utilities/runDatabaseQuery",
      contentType: "application/json; charset=utf-8",
      data: JSON.stringify(data),
      success: async function (data) {
        console.log("data", data);
        var nodes = [];
        var edges = [];
        var records = data.records;
        for (let i = 0; i < records.length; i++) {
          var fields = records[i]._fields;
          for (let j = 0; j < fields[1].length; j++) {
            nodes.push(fields[1][j]);
          }
          for (let j = 0; j < fields[5].length; j++) {
            var edge = {};
            edge.properties = {};
            edge.identity = {};
            edge.properties.source = fields[5][j].properties.source;
            edge.properties.target = fields[5][j].properties.target;
            edge.properties.class = fields[5][j].properties.class;
            edge.identity.low = fields[5][j].identity.low;
            edges.push(edge);
          }
        }
        await databaseUtilities.addNodesEdgesToCy(data);
      },
      error: function (req, status, err) {
        console.error("Error running query", status, err);
      },
    });
    return result;
  },
};
module.exports = databaseUtilities;
