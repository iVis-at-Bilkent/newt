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
    }

    //Add child parent relationships if any
    for (let i = 0; i < nodesData.length; i++) {
      if (nodesData[i].parent) {
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
    }
  },

  pushActiveNodesToDatabase: function (nodesData, edgesData) {
    console.log("about to push nodes", nodesData);
    console.log("about to push edges", edgesData);

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
            MATCH (u)
            WHERE  ${nodeMatchUtilities.match(
              "data",
              "u",
              false,
              true,
              false,
              false,
              false,
              false,
              false,
              false
            )}
            RETURN COUNT(u) as cnt', {data:data}) 
        YIELD value
        WITH value.cnt as cnt, data
        CALL
        apoc.cypher.doIt('
          CALL apoc.do.when( cnt > 0, \\"MATCH (u) WHERE ${nodeMatchUtilities.match(
            "data",
            "u",
            false,
            false,
            false,
            false,
            false,
            false,
            false,
            true
          )} RETURN u.newtId as id \\", \\"RETURN null as id\\",
                {data:data, cnt: cnt}) 
                YIELD value
                RETURN value.id as id', 
          {data:data, cnt: cnt} )
        YIELD value
        WITH value.id as id, data
        CALL
        apoc.cypher.doIt('
              CALL apoc.do.when(id is not null, \\"RETURN 1 as node\\",
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
    WITH collect(value.node) as node
    CALL 
    apoc.cypher.doIt('
      UNWIND $edgesData AS data 
      CALL apoc.do.when(data.inDb,
        \\"RETURN null as rel\\",
        \\"MATCH (n {newtId: data.source}), (m { newtId: data.target})  
          WITH DISTINCT n, m, data
          CALL apoc.create.relationship(n,data.class,data,m) YIELD rel  
          WITH rel
          SET rel.processed = 0
          RETURN rel as rel\\",
        {data: data}
      )
      YIELD value
      RETURN collect(value.rel) as rel
      ',{edgesData: $edgesData})
    YIELD value
    RETURN node as nodes, value.rel as edges`;

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
        console.log(nodes);
        console.log(edges);

        if (nodes) {
          for (let i = 0; i < nodes.length; i++) {
            databaseUtilities.nodesInDB[nodes[i].properties.newtId] =
              nodes[i].identity.low;
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

  runPathsFromTo: function (sourceArray, targetArray, limit) {
    query = graphALgos.pathsFromTo(sourceArray, targetArray, limit);
    var queryData = { sourceArray: sourceArray, targetArray: targetArray };
    var data = { query: query, queryData: queryData };

    $.ajax({
      type: "post",
      url: "/utilities/runDatabaseQuery",
      contentType: "application/json; charset=utf-8",
      data: JSON.stringify(data),
      success: function (data) {
        console.log(data);
        var chiseInstance = appUtilities.getActiveChiseInstance();
        let nodes = [];
        let edges = [];
        for (let i = 0; i < data.records.length; i++) {
          nodes.push(data.records[i]._fields[0]);
          nodes.push(data.records[i]._fields[1]);

          databaseUtilities.nodesInDB[
            data.records[i]._fields[0].properties.newtId
          ] = data.records[i]._fields[0].identity.low;
          databaseUtilities.nodesInDB[
            data.records[i]._fields[1].properties.newtId
          ] = data.records[i]._fields[1].identity.low;

          for (let j = 0; j < data.records[i]._fields[2].segments.length; j++) {
            if (
              !databaseUtilities.nodesInDB[
                data.records[i]._fields[2].segments[j].end.properties.newtId
              ]
            ) {
              nodes.push(data.records[i]._fields[2].segments[j].end);
              databaseUtilities.nodesInDB[
                data.records[i]._fields[2].segments[j].end.properties.newtId
              ] = data.records[i]._fields[2].segments[j].end.identity.low;
            }
            if (
              !databaseUtilities.nodesInDB[
                data.records[i]._fields[2].segments[j].start.properties.newtId
              ]
            ) {
              nodes.push(data.records[i]._fields[2].segments[j].start);
              databaseUtilities.nodesInDB[
                data.records[i]._fields[2].segments[j].start.properties.newtId
              ] = data.records[i]._fields[2].segments[j].start.identity.low;
            }
            edges.push(data.records[i]._fields[2].segments[j].relationship);
          }
        }
        console.log("nodes got", nodes);
        console.log("edges got", edges);
        for (let i = 0; i < nodes.length; i++) {
          chiseInstance.addNode(
            0,
            0,
            nodes[i].properties.class,
            nodes[i].properties.newtId,
            undefined,
            undefined
          );
          //chiseInstance.changeNodeLabel(nodes[i].properties.newtId, nodes[i].properties.entityName);
        }
        for (let i = 0; i < edges.length; i++) {
          chiseInstance.addEdge(
            edges[i].properties.source,
            edges[i].properties.target,
            edges[i].properties.class,
            undefined,
            undefined
          );
        }
        // chiseInstance.performLayout(options, notUndoable);
      },
      error: function (req, status, err) {
        console.error("Error running query", status, err);
      },
    });
  },
  getIdOfLabeledNodes: async function (labelOfNodes, idOfNodes) {
    var query = `UNWIND $labelOfNodes as label
                   MATCH (u)
                   WHERE u.entityName = label
                   RETURN id(u)`;
    var queryData = { labelOfNodes: labelOfNodes};

    var data = { query: query, queryData: queryData };
    var idNodes = []
    await $.ajax({
      type: "post",
      url: "/utilities/runDatabaseQuery",
      contentType: "application/json; charset=utf-8",
      data: JSON.stringify(data),
      success: function (data) {
        console.log(data);

        for (var i = 0; i< data.records.length; i++)
        {
          console.log("hree")
          idOfNodes.push(data.records[i]._fields[0].low)
        }
        console.log("idNodes",idNodes)
      },
      error: function (req, status, err) {
        console.error("Error running query", status, err);
      },
    });
  },
  runPathBetween: async function (labelOfNodes, lengthLimit) {
    console.log("labelOfNodes",labelOfNodes)
    console.log("lengthLimit",lengthLimit)
    var idOfNodes = [];
    await databaseUtilities.getIdOfLabeledNodes(labelOfNodes, idOfNodes)
    var query = graphALgos.pathsBetween(idOfNodes,lengthLimit)
    console.log('idOfNodes in runpaths',idOfNodes)

    var data = { query: query, queryData: null };
    var result = {}
    result.highlight = {}
    result.add = {}
    await $.ajax({
      type: "post",
      url: "/utilities/runDatabaseQuery",
      contentType: "application/json; charset=utf-8",
      data: JSON.stringify(data),
      success: function (data) {
        console.log(data);
        var chiseInstance = appUtilities.getActiveChiseInstance();

        //Get the nodes
        result.highlight.nodes = []
        result.add.nodes = {}
        for (var i = 0; i < data.records[0]._fields[0].length; i++)
        {
          result.highlight.nodes.push(data.records[0]._fields[0][i].properties)

          //Check if node already exists in map
          if(!databaseUtilities.nodesInDB[data.records[0]._fields[0][i].properties.newtId]) 
          {
            result.add.nodes[data.records[0]._fields[0][i].identity.low] =  data.records[0]._fields[0][i].properties
            databaseUtilities.nodesInDB[data.records[0]._fields[0][i].properties.newtId] = data.records[0]._fields[0][i].identity.low
          }
        }

        //Get the edges
        result.highlight.edges = []
        result.add.edges = []
        for (var i = 0; i < data.records[0]._fields[4].length; i++)
        {
          result.highlight.edges.push(data.records[0]._fields[0][i].properties)


          //Check if edge already exists in map
          if(!databaseUtilities.edgesInDB[[
            data.records[0]._fields[0][i].properties.source,
            data.records[0]._fields[0][i].properties.target,
            data.records[0]._fields[0][i].properties.class,
          ]]) 
          {
            result.add.edges[data.records[0]._fields[4][i].identity.low] =  data.records[0]._fields[0][i].properties
            databaseUtilities.edgesInDB[[
              data.records[0]._fields[0][i].properties.source,
              data.records[0]._fields[0][i].properties.target,
              data.records[0]._fields[0][i].properties.class,
            ]]  = data.records[0]._fields[4][i].identity.low
          }
        }


        console.log("result.add.nodes.length",result.add.nodes)
        for (let i = 0; i <  result.highlight.nodes.length; i++) {
          chiseInstance.addNode(
            0,
            0,
            result.highlight.nodes[i].class,
            result.highlight.nodes[i].newtId,
            undefined,
            undefined
          );
          //chiseInstance.changeNodeLabel(nodes[i].properties.newtId, nodes[i].properties.entityName);
        }
        console.log("result.add.edges",result.add.edges)
        for (let i = 0; i <  result.highlight.edges.length; i++) {
          chiseInstance.addEdge(
            result.highlight.edges[i].source,
            result.highlight.edges[i].target,
            result.highlight.edges[i].class,
            undefined,
            undefined
          );
        }

      },
      error: function (req, status, err) {
        console.error("Error running query", status, err);
      },
    });
    return result


  },
};
module.exports = databaseUtilities;
