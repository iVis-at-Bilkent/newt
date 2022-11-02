var jquery = ($ = require("jquery"));
var neo4j = require("neo4j-driver");
var _ = require("underscore");

var databaseUtilities = {
  enableDatabase: true,

  calculateClass: function (entitysClass) {
    var classArray = entitysClass.split(" ");
    var classArray = classArray.filter((string) => string !== "multimer");
    var finalClass = classArray.join("_");
    return finalClass;
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
      } else if (data.language == "AF") {
        databaseUtilities.processAfNode(currentNode, data);
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
    console.log("about to push", nodesData);
    var parentChildRelationship = {};
    var parentNodes = {}
    var integrationQueryPD = ``;
    for (let i = 0; i < nodesData.length; i++) {
      integrationQueryPD =
        integrationQueryPD +
        `MERGE (n${i}:Node {id: '${nodesData[i].newtId}', class: '${nodesData[i].class}'}) `;
      if (nodesData[i].parent) {
        parentChildRelationship[nodesData[i].newtId] = nodesData[i].parent;
      }

      //Check if its a parent
      if (nodesData[i].class == "compartment" || nodesData[i].class == "complex" || nodesData[i].class == "submap")
      {
        if(nodesData[i].class == "compartment")
        {
          parentNodes[nodesData[i].newtId] = "belongs_to_compartment"
        }
        else if (nodesData[i].class == "complex")
        {
          parentNodes[nodesData[i].newtId] = "belongs_to_complex"
        }
        else if (nodesData[i].class == "submap")
        {
          parentNodes[nodesData[i].newtId] = "belongs_to_submap"
        }
      }
    }
    console.log("parentChildRelationship", parentChildRelationship);

    

    for (let i = 0; i < edgesData.length; i++) {
      if (i == 0) {
        integrationQueryPD = integrationQueryPD + "WITH true as pass ";
      }
      integrationQueryPD =
        integrationQueryPD +
        ` MATCH
                                                    (a${i}:Node),
                                                    (b${i}:Node)
                                                    WHERE a${i}.id = '${edgesData[i].source}' AND b${i}.id = '${edgesData[i].target}'
                                                    CREATE (a${i})-[r${i}:${edgesData[i].class}]->(b${i})`;
      if (i != edgesData.length - 1) {
        integrationQueryPD = integrationQueryPD + " WITH true as pass ";
      }
    }

    var i = 0
    if ( Object.keys(parentChildRelationship).length > 0)
    {
      integrationQueryPD = integrationQueryPD + " WITH true as pass ";

    }

    //Add the children and parents relationship
    for (var key in parentChildRelationship)
    {
        integrationQueryPD =
        integrationQueryPD +
        ` MATCH
        (a${i}:Node),
        (b${i}:Node)
        WHERE a${i}.id = '${key}' AND b${i}.id = '${parentChildRelationship[key]}'
        CREATE (a${i})-[r${i}:${parentNodes[parentChildRelationship[key]]}]->(b${i})`;
        if (i != Object.keys(parentChildRelationship).length -1 )
        {
          integrationQueryPD = integrationQueryPD + " WITH true as pass ";

        }
        i++;

    }

    var integrationQuery = integrationQueryPD;

    var queryData = { nodesData: nodesData, edgesData: edgesData };
    var data = { query: integrationQuery, queryData: queryData };

    console.log(JSON.stringify(data));

    $.ajax({
      type: "post",
      url: "/utilities/runDatabaseQuery",
      contentType: "application/json; charset=utf-8",
      data: JSON.stringify(data),
      success: function (data) {
        console.log(data);
      },
      error: function (req, status, err) {
        console.error("Error running query", status, err);
      },
    });
  },
};
module.exports = databaseUtilities;
