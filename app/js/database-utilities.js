var jquery = ($ = require("jquery"));
var neo4j = require("neo4j-driver");
var _ = require("underscore");
var nodeMatchUtilities = require("./node-match-utilities");

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

  pushActiveContentToDatabase: function (nodesData, edgesData) {
    var parentChildRelationship = {};
    var parentNodes = {};
    databaseUtilities.pushActiveNodesToDatabase(
      nodesData,
      edgesData,
      parentChildRelationship,
      parentNodes
    );
    /*
    setTimeout(() => {
      databaseUtilities.pushActiveEdgesToDatabase(
        nodesData,
        edgesData,
        parentChildRelationship,
        parentNodes
      );
    }, 7000);
    */
  },

  pushActiveNodesToDatabase: function (
    nodesData,
    edgesData,
    parentChildRelationship,
    parentNodes
  ) {
    console.log("about to push", nodesData);

    var integrationQueryPD = ``;

    //Add nodes
    for (let i = 0; i < nodesData.length; i++) {
      nodesData[i].inDb = false;
      if (databaseUtilities.nodesInDB[nodesData[i].newtId]) {
        nodesData[i].inDb = true;
        nodesData[i].idInDb = databaseUtilities.nodesInDB[nodesData[i].newtId];
      }
    }

    for (let i = 0; i < edgesData.length; i++) {
      edgesData[i].inDb = false;
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
    console.log("edges", edgesData);
    var integrationQueryPD = `
      UNWIND $nodesData as data
        CALL apoc.do.when( data.inDb
          , 'CALL
            {
              WITH data
              MATCH (u)
              WHERE  u.newtId = data.newtId and id(u) = data.idInDb
              SET u = data
              RETURN u as node
            }
            RETURN node as node
            ',  
            'CALL
            {
              WITH data
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
                false
              )}
              RETURN COUNT(u) as cnt
            }
            WITH cnt, data
            CALL
            {
              WITH cnt, data
              CALL apoc.do.when( cnt > 0, "MATCH (u) WHERE ${nodeMatchUtilities.match(
                "data",
                "u",
                false,
                true,
                false,
                false,
                false,
                false,
                false
              )} RETURN u.newtId as id", "RETURN null as id", {data:data} )
              YIELD value
              RETURN value.id as id
            }
            WITH id, data
            CALL
            {
              WITH id, data
              CALL apoc.do.when(id is not null, "RETURN 1 as node",
              "CALL apoc.create.node([data.class], data)
              YIELD node
              SET node.processed = 0
              RETURN node as node", {data: data})
              YIELD value
              RETURN value.node as node
            }
            RETURN node as node
            ', {data:data} )
          YIELD value
          WITH collect(value.node) as node
          CALL {
            UNWIND $edgesData AS data 
            CALL apoc.do.when(data.inDb,
              'RETURN null as rel',
              'MATCH (n {newtId: data.source}), (m { newtId: data.target})  
                WITH DISTINCT n, m, data
                CALL apoc.create.relationship(n,data.class,data,m) YIELD rel  
                WITH rel
                SET rel.processed = 0
                RETURN rel as rel',
              {data: data}
            )
            YIELD value
            RETURN collect(value.rel) as rel
      }
      RETURN node as nodes, rel as edges
`;

    var integrationQuery = integrationQueryPD;

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

        for (let i = 0; i < nodes.length; i++) {
          databaseUtilities.nodesInDB[nodes[i].properties.newtId] =
            nodes[i].identity.low;
        }

        for (let i = 0; i < edges.length; i++) {
          databaseUtilities.edgesInDB[
            [
              edges[i].properties.source,
              edges[i].properties.target,
              edges[i].properties.class,
            ]
          ] = edges[i].identity.low;
        }
        console.log(databaseUtilities.nodesInDB);
        console.log(databaseUtilities.edgesInDB);
      },
      error: function (req, status, err) {
        console.error("Error running query", status, err);
      },
    });
  },

  pushActiveEdgesToDatabase: function (
    nodesData,
    edgesData,
    parentChildRelationship,
    parentNodes
  ) {
    //Add edges

    var integrationQueryPD = `CALL 
                              {
                                UNWIND $edgesData AS data 
                                CALL apoc.do.when(data.inDb,
                                  'RETURN null as rel',
                                  'MATCH (n {newtId: data.source}), (m { newtId: data.target})  
                                    WITH DISTINCT n, m, data
                                    CALL apoc.create.relationship(n,data.class,data,m) YIELD rel  
                                    WITH rel
                                    SET rel.processed = 0
                                    RETURN rel as rel',
                                  {data: data}
                                )
                                YIELD value
                                RETURN value.rel as rel
                              }
                              RETURN  rel as edges`;

    /*
    var i = 0;
    if (Object.keys(parentChildRelationship).length > 0) {
      integrationQueryPD = integrationQueryPD + " WITH true as pass ";
    }

    //Add the children and parents relationship
    for (var key in parentChildRelationship) {
      integrationQueryPD =
        integrationQueryPD +
        ` MATCH
        (a${i}),
        (b${i})
        WHERE a${i}.id = '${key}' AND b${i}.id = '${
          parentChildRelationship[key]
        }'
        MERGE (a${i})-[r${i}:${
          parentNodes[parentChildRelationship[key]]
        }]->(b${i})`;
      if (i != Object.keys(parentChildRelationship).length - 1) {
        integrationQueryPD = integrationQueryPD + " WITH true as pass ";
      }
      i++;
    }
    integrationQueryPD = integrationQueryPD + " RETURN  true";
    */

    console.log("adding edges", integrationQueryPD);
    var integrationQuery = integrationQueryPD;

    var queryData = { nodesData: nodesData, edgesData: edgesData };
    var data = { query: integrationQuery, queryData: queryData };

    $.ajax({
      type: "post",
      url: "/utilities/runDatabaseQuery",
      contentType: "application/json; charset=utf-8",
      data: JSON.stringify(data),
      success: function (data) {},
      error: function (req, status, err) {
        console.error("Error running query", status, err);
      },
    });
  },
};
module.exports = databaseUtilities;
