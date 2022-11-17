var jquery = ($ = require("jquery"));
var neo4j = require("neo4j-driver");
var _ = require("underscore");
var nodeMatchUtilities = require("./node-match-utilities");

var databaseUtilities = {
  enableDatabase: true,
  nodesInDB: {},

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
    setTimeout(() => {
      databaseUtilities.pushActiveEdgesToDatabase(
        nodesData,
        edgesData,
        parentChildRelationship,
        parentNodes
      );
    }, 5000);
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
      //If statevaribale is undefined then make it empty array
      var stateVariable = nodesData[i].stateVariable;
      if (!stateVariable) {
        stateVariable = [];
      }

      //If unitInformation is undefined then make it empty array
      var unitsOfInformation = nodesData[i].unitsOfInformation;
      if (!unitsOfInformation) {
        unitsOfInformation = [];
      }

      /*
      integrationQueryPD =
        integrationQueryPD +
        `MATCH (u) 
        WHERE ${baseCaseMatch} ${nodeMatchUtilities.match(
          nodesData[i],
          "u",
          true,
          true,
          true,
          true,
          true
        )}
        WITH COUNT(u) as count
       WITH count
        CALL apoc.do.when(count > 0,
          "", "CREATE (n${i}:${nodesData[i].class} 
            {id: '${nodesData[i].newtId}', 
            label: '${nodesData[i].entityName}',
            multimer: '${nodesData[i].multimer}', 
            cloneMarker: '${nodesData[i].cloneMarker}',
            cloneLabel: '${nodesData[i].cloneLabel}',
            stateVariables: '${stateVariable}',
            unitsOfInformation:'${unitsOfInformation}' })", {}) 
          YIELD n${i}
          WITH n${i} AS node1x  
        `;

      console.log("integrationQueryPD", integrationQueryPD);
      if (nodesData[i].parent) {
        parentChildRelationship[nodesData[i].newtId] = nodesData[i].parent;
      }

      //Check if its a parent
      if (
        nodesData[i].class == "compartment" ||
        nodesData[i].class == "complex" ||
        nodesData[i].class == "submap"
      ) {
        if (nodesData[i].class == "compartment") {
          parentNodes[nodesData[i].newtId] = "belongs_to_compartment";
        } else if (nodesData[i].class == "complex") {
          parentNodes[nodesData[i].newtId] = "belongs_to_complex";
        } else if (nodesData[i].class == "submap") {
          parentNodes[nodesData[i].newtId] = "belongs_to_submap";
        }
      }
      */
    }
    //integrationQueryPD = integrationQueryPD + " RETURN  true";
    var baseCaseMatch = `u.newtId = data.newtId and u.entityName = data.entityName`;

    var integrationQueryPD = `
 CALL {
      UNWIND $nodesData as data
        CALL
        {
          WITH data
          MATCH (u)
          WHERE ${baseCaseMatch}
          RETURN COUNT(u) as cnt
        }
        WITH cnt, data
        CALL
        {
          WITH cnt, data
          CALL apoc.do.when( cnt > 0, "MATCH (u) WHERE ${baseCaseMatch} RETURN u.newtId as id", "RETURN null as id", {data:data} )
          YIELD value
          RETURN value.id as id
        }
        WITH id, data
        CALL
        {
          WITH id, data
          CALL apoc.do.when(id is not null and ${databaseUtilities.getMapValue(
            `id`
          )} is null, "RETURN 1 as node",
          "CALL apoc.create.node([data.class], data)
          YIELD node
          SET node.processed = 0
          RETURN node as node", {data: data})
          YIELD value
          RETURN value.node as node
        }
        RETURN node
      }
      RETURN node


`;
    /*
    `
      apoc.create.node([data.class], data) YIELD node
      SET node.processed = 0
      WITH node as nodeCount // needed to protect against empty parameter list
      RETURN nodeCount // subqueries must return something
    } RETURN nodeCount.newtId, id(nodeCount)`;
    */

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
        var nodes = {};
        var links = {};
        /*
        // parsing the output of neo4j rest api
        data.results[0].data.forEach(function (row) {
          row.graph.nodes.forEach(function (n) {
            if (idIndex(nodes, n.id) == null) {
              nodes.push({
                id: n.id,
                label: n.labels[0],
                title: n.properties.name,
              });
            }
          });
          links = links.concat(
            row.graph.relationships.map(function (r) {
              // the neo4j documents has an error : replace start with source and end with target
              return {
                source: idIndex(nodes, r.startNode),
                target: idIndex(nodes, r.endNode),
                type: r.type,
              };
            })
          );
        });
        */
        data.records.forEach(function (field) {
          field._fields.forEach(function (data) {
            if (data.properties) {
              databaseUtilities.nodesInDB[data.properties.newtId] =
                data.identity.low;
            }
          });
        });
        console.log(databaseUtilities.nodesInDB);
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

    var integrationQueryPD = ``;
    if (edgesData.length > 0) {
      integrationQueryPD = integrationQueryPD + " WITH true as pass ";
    }

    for (let i = 0; i < edgesData.length; i++) {
      integrationQueryPD =
        integrationQueryPD +
        ` MATCH
                                                    (a${i}),
                                                    (b${i})
                                                    WHERE a${i}.id = '${edgesData[i].source}' AND b${i}.id = '${edgesData[i].target}'
                                                    MERGE (a${i})-[r${i}:${edgesData[i].class}]->(b${i})`;
      if (i != edgesData.length - 1) {
        integrationQueryPD = integrationQueryPD + " WITH true as pass ";
      }
    }

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
