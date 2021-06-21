var jquery = $ = require('jquery');
var neo4j = require('neo4j-driver')

var databaseUtilities = {
  enableDatabase: true,

  calculateClass: function (entitysClass) {
    var classArray = entitysClass.split(" ");
    var classArray = classArray.filter((string) => string !== "multimer");
    var finalClass = classArray.join("_") ;
    return finalClass;
  },

  checkIfMultimer: function (entitysClass) {
    return entitysClass.includes("multimer");
  },

  calculateState: function (statesAndInfos) {
    var states = statesAndInfos.filter((item) => item.clazz === "state variable");
    var refinedStates = [];
    for(let i = 0; i < states.length; i++) {
      var value = states[i].state.value || "";
      var variable = states[i].state.variable || "";
      refinedStates.push(value + "@" + variable);
    }
    return refinedStates;
  },

  calculateInfo: function (statesAndInfos) {
    var infos = statesAndInfos.filter((item) => item.clazz == "unit of information");
    var refinedInfos = [];
    for(let i = 0; i < infos.length; i++) {
      refinedInfos.push(infos[i].label.text);
    }
    return refinedInfos;
  },

  processPdNode: function (currentNode, data){
    currentNode.newtId = data.id;
    currentNode.entityName = data.label || ""
    currentNode.language = data.language;
    currentNode.class = databaseUtilities.calculateClass(data.class);
    currentNode.multimer = databaseUtilities.checkIfMultimer(data.class)
    currentNode.stateVariable = databaseUtilities.calculateState(data.statesandinfos);
    currentNode.unitsOfInformation = databaseUtilities.calculateInfo(data.statesandinfos);
    currentNode.cloneMarker = data.clonemarker || false;
    currentNode.cloneLabel = "";
    if (data.hasOwnProperty('parent')) {
      currentNode.parent = data.parent
    }
  },

  processAfNode: function (currentNode, data){
    currentNode.newtId = data.id;
    currentNode.class = databaseUtilities.calculateClass(data.class);
    currentNode.entityName = data.label || ""
    currentNode.language = data.language;
    currentNode.unitsOfInformation = databaseUtilities.calculateInfo(data.statesandinfos);
    if (data.hasOwnProperty('parent')) {
      currentNode.parent = data.parent
    }
  },

  processPdEdge: function (currentEdge, data) {
    currentEdge.stoichiometry = data.cardinality || 0;
    currentEdge.class = databaseUtilities.calculateClass(data.class);
    currentEdge.source = data.source;
    currentEdge.target = data.target;
  },

  processAfEdge: function (currentEdge, data) {
    currentEdge.stoichiometry = data.cardinality || 0;
    currentEdge.class = databaseUtilities.calculateClass(data.class);
    currentEdge.source = data.source;
    currentEdge.target = data.target;      
  },

  processNodesData: function (nodesData, activeTabContent) {
    for(let i = 0; i < activeTabContent.nodes.length; i++){
      var currentNode = {}
      var data = activeTabContent.nodes[i].data;
      if (data.language == "PD"){
        databaseUtilities.processPdNode(currentNode, data);
      }
      else if (data.language == "AF") {
        databaseUtilities.processAfNode(currentNode, data);
      }
      nodesData.push(currentNode)
    }
  },

  processEdgesData: function(edgesData, activeTabContent) {
    for(let i = 0; i < activeTabContent.edges.length; i++){
      var currentEdge = {}
      var data = activeTabContent.edges[i].data;
      if (data.language == "PD"){
        databaseUtilities.processPdEdge(currentEdge, data);
      }
      else if (data.language == "AF") {
        databaseUtilities.processAfEdge(currentEdge, data);
      }
      edgesData.push(currentEdge)
    }
  },

  pushActiveContentToDatabase: function(nodesData, edgesData) {

    var query = ` CALL {
        UNWIND $nodesData as data
        CALL apoc.create.node([data.class], data) YIELD node
        WITH count(node) as nodeCount // needed to protect against empty parameter list
        RETURN nodeCount // subqueries must return something
      }
      WITH nodeCount // only a single row at this point from the earlier aggregation
      CALL {
        UNWIND $edgesData AS data  
        // you should be using labels or this will be really really slow!
        MATCH (n {newtId: data.source}), (m { newtId: data.target})  
        WITH n, m, data
        CALL apoc.create.relationship(n,data.class,data,m) YIELD rel  
        WITH rel
        REMOVE rel.source, rel.target
        WITH count(rel) as relCount
        RETURN relCount
      }
      WITH relCount
      CALL {
        MATCH (n) WHERE EXISTS (n.parent)
        WITH n as childNode
        MATCH (parentNode)
        // get the parent node of a particular node
        WHERE parentNode.newtId = childNode.parent
        // create relationship of type PARENT_OF with weight 0
        CALL apoc.create.relationship(childNode, "belongs_to_" + parentNode.class, {language:"PD"}, parentNode) 
        YIELD rel  
        WITH count(rel) as parentRel
        RETURN parentRel
      }
      WITH parentRel
      CALL {
        MATCH (n) WHERE EXISTS (n.newtId)
        REMOVE n.newtId, n.parent
        RETURN count(n) as processedNodes
      }
      WITH processedNodes
      CALL {
        MATCH ()-[r]->() WHERE EXISTS (r.source)
        REMOVE r.source, r.target
        RETURN count(r) as processedRels
      }
      RETURN processedRels
        `
    var queryData = { nodesData: nodesData, edgesData: edgesData }
    var data = { query: query, queryData: queryData }

    $.ajax({
      type: 'post',
      url: "/utilities/runDatabaseQuery",
      contentType: "application/json; charset=utf-8",
      data: JSON.stringify(data),
      success: function(data){
        console.log(data);
      },
      error: function(req, status, err) {
        console.error("Error running query", status, err);
      }
    });
  }
}

module.exports = databaseUtilities;