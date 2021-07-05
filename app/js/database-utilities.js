var jquery = $ = require('jquery');
var neo4j = require('neo4j-driver')
var _ = require('underscore');

var databaseUtilities = {
  enableDatabase: true,

  processNodeTypes: ["process", "association", "dissociation", "omitted process", "uncertain process", "phenotype"],

  calculateClass: function (entitysClass) {
    var classArray = entitysClass.split(" ");
    var classArray = classArray.filter((string) => string !== "multimer");
    var finalClass = classArray.join("_") ;
    return finalClass;
  },

  calculateNewtClass: function (entitysClass) {
    var classArray = entitysClass.split("_");
    // var classArray = classArray.filter((string) => string !== "multimer");
    var finalClass = classArray.join(" ") ;
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
    return refinedStates.sort();
  },

  calculateInfo: function (statesAndInfos) {
    var infos = statesAndInfos.filter((item) => item.clazz == "unit of information");
    var refinedInfos = [];
    for(let i = 0; i < infos.length; i++) {
      refinedInfos.push(infos[i].label.text);
    }
    return refinedInfos.sort();
  },

  processPdNode: function (currentNode, data){
    currentNode.newtId = data.id;
    currentNode.entityName = data.label || ""
    currentNode.language = data.language;
    currentNode.class = databaseUtilities.calculateClass(data.class);
    currentNode.multimer = databaseUtilities.checkIfMultimer(data.class)
    currentNode.stateVariables = databaseUtilities.calculateState(data.statesandinfos);
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
        WITH rel, parentNode, childNode
        SET childNode.parent = id(parentNode)
        WITH count(rel) as parentRel
        RETURN parentRel
      }
      WITH parentRel
      CALL {
        MATCH (n) WHERE EXISTS (n.newtId)
        REMOVE n.newtId, n.class
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
  },

  checkIfArrayIsSubarrayOfAnother: function ( edgeTypes, connectedEdgeTypes ) {
    const result = edgeTypes.every(val => connectedEdgeTypes.includes(val) 
      && edgeTypes.filter(el => el === val).length
       <=
       connectedEdgeTypes.filter(el => el === val).length
    );

    return result;
  },

  compareProcessNodeLabel: function ( connectedNodeLabel, neighboringNodesTypes ) {

  },

  getCorrespondingProcessNodeInNewt: function ( queryNode, connectedEdgesDB, neighboringNodesDB, cy) {
    console.log("whye here")
    var connectedEdgeTypes = [], neighboringNodesTypes = [];
    for(let i = 0; i < connectedEdgesDB.length; i++) {
      connectedEdgeTypes.push(connectedEdgesDB[i].class);
    }
    connectedEdgeTypes.sort();

    for(let i = 0; i < neighboringNodesDB.length; i++) {
      neighboringNodesTypes.push(neighboringNodesDB[i].label);
    }
    neighboringNodesTypes.sort();

    console.log("connectedEdgetypes", connectedEdgeTypes);
    // get all the process nodes of the required label
    var processNodes = cy.nodes().filter(function(ele){
      return ele.data('class') == queryNode.class;
    });

    // get the process node which has the same connectedEdges
    var filteredProcessNodesWithGivenEdges = processNodes.filter(function(ele){
      console.log("inside process node", ele);
      var edgesData = ele._private.edges;
      var edgesType = [];
      for (let i = 0; i < edgesData.length; i++) {
        edgesType.push(edgesData[i]._private.data.class);
      }
      edgesType.sort();

      // return _.isEqual( edgesType, connectedEdgeTypes );
      return databaseUtilities.checkIfArrayIsSubarrayOfAnother( edgesType, connectedEdgeTypes );
    });

    var filteredProcessNodesWithGivenNeighbors = filteredProcessNodesWithGivenEdges.filter(function(ele){
      var connectedEdges = ele.connectedEdges();
      var connectedNodes = connectedEdges.connectedNodes();
      // var connectedNodes = ele.connectedNodes();
      console.log("connectedNodes", connectedNodes);

      console.log("connectedEdges", connectedEdges);
      var connectedNodeLabels = [];
      for(let i =0; i < connectedNodes.length; i++) {
        var connectedNodeLabel = connectedNodes[i]._private.data.label;
        if (connectedNodeLabel) {
          connectedNodeLabels.push(connectedNodeLabel);
        }
      }
      connectedNodeLabels.sort();
      console.log("connectedNodeLabels", connectedNodeLabels)
      console.log("isEqual", _.isEqual(connectedNodeLabels, neighboringNodesTypes))
      return _.isEqual(connectedNodeLabels, neighboringNodesTypes);
    }); 
    console.log("neighboringNodesTypes", neighboringNodesTypes);
    console.log("filteredProcessNodesWithGivenEdges", filteredProcessNodesWithGivenEdges)
    console.log("filteredProcessNodesWithGivenNeighbors", filteredProcessNodesWithGivenNeighbors);

    // if a match of process node is found return that node exits i.e. true
    return filteredProcessNodesWithGivenNeighbors.length;
  },

  checkIfNodeExists: function ( queriedNode, queriedParentNode, cy ) {
    var filterByLabel = cy.nodes().filter(function( ele ){
      return ele.data('label') == queriedNode.label;
    });
    var filterByClass = filterByLabel.filter(function(ele) {
      return ele.data('class') == queriedNode.class;
    })
    var filterByStatesAndInfo = filterByClass.filter(function(ele) {
      var stateorinfoboxes = ele.data('statesandinfos');
      var stateVariables = [], unitsOfInformation = [];

      for(let i = 0; i < stateorinfoboxes.length; i++) {
        var data = stateorinfoboxes[i];

        if(data.clazz == "state variable") {
          var value = data.state.value || "";
          var variable = data.state.variable || "";
          stateVariables.push(value + "@" + variable);
        }

        if(data.clazz == "unit of information") {
          unitsOfInformation.push(data.label.text)
        }

      }
      stateVariables.sort();
      unitsOfInformation.sort();

      return _.isEqual(stateVariables, queriedNode.stateVariables) &&
              _.isEqual(unitsOfInformation, queriedNode.unitsOfInformation);
    })
    console.log("filterByStatesAndInfo", filterByStatesAndInfo)
    console.log(filterByClass.length)
    for(let i = 0; i < filterByClass.length; i++) {
      var data = filterByStatesAndInfo[i]._private;
      // console.log("data", data);
      // if there is no parent but a node exists with given props return true
      if (data.parent === null && queriedParentNode === null) {
        return true;
      }
      var parentData = data.parent._private.data;
      // console.log("parentdata", parentData);

      var parentNodeClass = databaseUtilities.calculateClass(parentData.class);
      var parentNodeLabel = parentData.label;
      var parentNodeStateVariables =  databaseUtilities.calculateState(parentData.statesandinfos);
      var parentNodeUnitOfInformation = databaseUtilities.calculateInfo(parentData.statesandinfos);

      console.log(parentNodeClass, queriedParentNode.class)
      console.log(parentNodeLabel, queriedParentNode)
      console.log(parentNodeStateVariables, queriedParentNode.stateVariables)
      console.log(parentNodeUnitOfInformation, queriedParentNode.unitsOfInformation)
      if (_.isEqual(parentNodeClass, queriedParentNode.class) && _.isEqual(parentNodeLabel, queriedParentNode.label)
          && _.isEqual(parentNodeStateVariables, queriedParentNode.stateVariables)
          && _.isEqual(parentNodeUnitOfInformation, queriedParentNode.unitsOfInformation)) {
            console.log("true")
            return true;
          }
    }
    console.log(false)
    return false;
  },

  checkIfProcessNodeExists: function( queryNode, queryNodes, queryEdges, cy ) {
    console.log("checkIfProcessNodeExists")
    var processNodeId = queryNode.id;
    var connectedEdgesDB = [], neighboringNodesDB = [];
    var connectedEdgesNewt = [], connectedEdgesNewt = [];
    // get the connected edges in db
    for(let i = 0; i < queryEdges.length; i++) {
      if ( queryEdges[i].source == processNodeId || queryEdges[i].target == processNodeId ) {
        connectedEdgesDB.push(queryEdges[i]);
      }
    }

    // get the neighboring nodes in db
    for(let i = 0; i < connectedEdgesDB.length; i++) {
      for(let j = 0; j < queryNodes.length; j++) {
        if( queryNodes[j].id == processNodeId ) {
          continue;
        }
        if(connectedEdgesDB[i].source == queryNodes[j].id || connectedEdgesDB[i].target == queryNodes[j].id) {
          neighboringNodesDB.push(queryNodes[j]);
        }
      }
    }

    console.log("neighboringNodesDB", neighboringNodesDB )

    return databaseUtilities.getCorrespondingProcessNodeInNewt( queryNode, connectedEdgesDB, neighboringNodesDB, cy);
  }
}

module.exports = databaseUtilities;