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
      var text = infos[i].label.text || "";
      refinedInfos.push(text);

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

    var integrationQueryPD = ` CALL {
      UNWIND $nodesData as data
      CALL apoc.create.node([data.class], data) YIELD node
      SET node.processed = 0
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
      SET rel.processed = 0
      // REMOVE rel.source, rel.target
      WITH count(rel) as relCount
      RETURN relCount
    }
    WITH relCount
    CALL {
      MATCH (n) WHERE EXISTS (n.parent) AND n.processed = 0
      WITH n as childNode
      MATCH (parentNode)
      // get the parent node of a particular node
      WHERE parentNode.newtId = childNode.parent
      // create relationship of type PARENT_OF with weight 0
      CALL apoc.create.relationship(childNode, "belongs_to_" + parentNode.class, {language:"PD"}, parentNode) 
      YIELD rel
      WITH rel, parentNode, childNode
      SET rel.processed = 0, rel.source = childNode.newtId, rel.target = parentNode.newtId
      WITH rel, parentNode, childNode
      SET childNode.parent = id(parentNode)
      WITH count(rel) as parentRel
      RETURN parentRel
    }
    // RETURN parentRel
    WITH parentRel
    CALL {
      // get all the relationships, r for G1
      MATCH ()-[r]->()
      WHERE r.processed = 0
      WITH r
      // RETURN count(r) as rcnt
      // RETURN r.source as rsource, r.target as rtarget
      MATCH (sourceNodeG1 {newtId:r.source, processed:0}),
          (targetNodeG1 {newtId:r.target, processed:0})
      WITH sourceNodeG1, targetNodeG1, r
      // get the identical nodes from G2 which correspond to sourceNodeG1 and targetNodeG1 respectively
      // sourceNodeG2 and targetNodeG2 can be null as nodes present in G1 might not always be present in G2
      OPTIONAL MATCH (sourceNodeG2 {entityName:sourceNodeG1.entityName, processed:1}) WHERE labels(sourceNodeG2) = labels(sourceNodeG1)
      OPTIONAL MATCH (targetNodeG2 {entityName:targetNodeG1.entityName, processed:1}) WHERE labels(targetNodeG2) = labels(targetNodeG1)
      WITH sourceNodeG2, targetNodeG2, sourceNodeG1, targetNodeG1,
        r, type(r) as relType
      // RETURN count(sourceNodeG2) as sg2, count(targetNodeG2) as tg2, count(sourceNodeG1) as sg1 , count(targetNodeG1) as tg1, count(r) as cr
      // Depending of the case relationships need to be generated, total of six cases
      CALL apoc.do.case([
      // case (i) and (ii) and (iii)
      sourceNodeG2 is not null and targetNodeG2 is not null,
      'CALL apoc.cypher.run("MATCH (sourceNodeG2)-[rels:" + $relType + "]->(targetNodeG2)
        RETURN count(rels) as cnt",
        {sourceNodeG2:sourceNodeG2, targetNodeG2:targetNodeG2, relType:relType})
        YIELD value
        WITH value.cnt as relCount, sourceNodeG2 as sourceNodeG2,
            targetNodeG2 as targetNodeG2, r as r, relType as relType
        CALL apoc.do.case([
            relCount = 0,
            "CALL apoc.create.relationship(sourceNodeG2, relType, r, targetNodeG2)
            YIELD rel
            //SET rel.source = sourceNodeG2.newtId, rel.target = targetNodeG2.newtId
            RETURN rel"],
        "", {relCount:relCount, sourceNodeG2:sourceNodeG2,
            targetNodeG2:targetNodeG2, r:r, relType:relType})
        YIELD value RETURN value',
      // case (v)
      sourceNodeG2 is not null and targetNodeG2 is null,
      'CALL apoc.create.relationship(sourceNodeG2, relType, r, targetNodeG1)
        YIELD rel
        //SET rel.source = sourceNodeG2.newtId, rel.target = targetNodeG1.newtId
        RETURN rel',
      // case (vi)
      sourceNodeG2 is null and targetNodeG2 is not null,
      'CALL apoc.create.relationship(sourceNodeG1, relType, r, targetNodeG2)
        YIELD rel
        //SET rel.source = sourceNodeG1.newtId, rel.target = targetNodeG2.newtId
        RETURN rel',
      // case (iv)
      sourceNodeG2 is null and targetNodeG2 is null,
      'RETURN r'
      ], '', {sourceNodeG2:sourceNodeG2, targetNodeG2:targetNodeG2, sourceNodeG1:sourceNodeG1, targetNodeG1:targetNodeG1, r:r, relType:relType}
      ) yield value
      WITH count(value) as valCnt
      // RETURN valCnt

      // delete nodes from G1 which are common with G2
      // also deletes the relationship coming to or directed away from the node
      MATCH (n { processed:1}), (m { processed:0})
      WHERE n.entityName = m.entityName AND labels(n) = labels(m)
      DETACH DELETE (m)
      WITH valCnt
      // set processed property to 0
      MATCH (nn { processed: 0})
      SET nn.processed = 1
      // WITH count(value) as valueCount
      RETURN count(nn) as ncnt
    }
    // RETURN rsource, rtarget
    WITH ncnt
    CALL {
      MATCH (n) WHERE EXISTS (n.newtId)
      REMOVE n.newtId, n.class
      SET n.processed = 1
      RETURN count(n) as processedNodes
    }
    WITH processedNodes
    CALL {
      MATCH ()-[r]->()
      // MATCH ()-[r]->() WHERE EXISTS (r.source)
      REMOVE r.source, r.target
      SET r.processed = 1
      RETURN count(r) as processedRels
    }
    WITH processedRels
    CALL {
      MATCH (n)-[:belongs_to_complex|:belongs_to_compartment|:belongs_to_submap]->(m)
      SET n.parent = id(m)
      RETURN ["1"] as rndVal
    }
    // RETURN processedRels
      // RETURN sg2, tg2, sg1, tg1, cr
    // }
      RETURN rndVal
      `

    var integrationQueryAF = ` CALL {
      UNWIND $nodesData as data
      CALL apoc.create.node([data.class], data) YIELD node
      SET node.processed = 0
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
      SET rel.processed = 0
      // REMOVE rel.source, rel.target
      WITH count(rel) as relCount
      RETURN relCount
    }
    WITH relCount
    CALL {
      MATCH (n) WHERE EXISTS (n.parent) AND n.processed = 0
      WITH n as childNode
      MATCH (parentNode)
      // get the parent node of a particular node
      WHERE parentNode.newtId = childNode.parent
      // create relationship of type PARENT_OF with weight 0
      CALL apoc.create.relationship(childNode, "belongs_to_" + parentNode.class, {language:"PD"}, parentNode) 
      YIELD rel
      WITH rel, parentNode, childNode
      SET rel.processed = 0, rel.source = childNode.newtId, rel.target = parentNode.newtId
      WITH rel, parentNode, childNode
      SET childNode.parent = id(parentNode)
      WITH count(rel) as parentRel
      RETURN parentRel
    }
    // RETURN parentRel
    WITH parentRel
    CALL {
      // get all the relationships, r for G1
      MATCH ()-[r]->()
      WHERE r.processed = 0
      WITH r
      // RETURN count(r) as rcnt
      // RETURN r.source as rsource, r.target as rtarget
      MATCH (sourceNodeG1 {newtId:r.source, processed:0}),
          (targetNodeG1 {newtId:r.target, processed:0})
      WITH sourceNodeG1, targetNodeG1, r
      // get the identical nodes from G2 which correspond to sourceNodeG1 and targetNodeG1 respectively
      // sourceNodeG2 and targetNodeG2 can be null as nodes present in G1 might not always be present in G2
      // OPTIONAL MATCH (sourceNodeG2 {entityName:sourceNodeG1.entityName, processed:1}) WHERE labels(sourceNodeG2) = labels(sourceNodeG1)
      // OPTIONAL MATCH (targetNodeG2 {entityName:targetNodeG1.entityName, processed:1}) WHERE labels(targetNodeG2) = labels(targetNodeG1)
      CALL integrateAFMap(sourceNodeG1, targetNodeG1) YIELD matchingSourceNode, matchingTargetNode
        WITH matchingSourceNode as sourceNodeG2, matchingTargetNode as targetNodeG2, sourceNodeG1, targetNodeG1,
        r, type(r) as relType
      // RETURN count(sourceNodeG2) as sg2, count(targetNodeG2) as tg2, count(sourceNodeG1) as sg1 , count(targetNodeG1) as tg1, count(r) as cr
      // Depending of the case relationships need to be generated, total of six cases
      CALL apoc.do.case([
      // case (i) and (ii) and (iii)
      sourceNodeG2 is not null and targetNodeG2 is not null,
      'CALL apoc.cypher.run("MATCH (sourceNodeG2)-[rels:" + $relType + "]->(targetNodeG2)
        RETURN count(rels) as cnt",
        {sourceNodeG2:sourceNodeG2, targetNodeG2:targetNodeG2, relType:relType})
        YIELD value
        WITH value.cnt as relCount, sourceNodeG2 as sourceNodeG2,
            targetNodeG2 as targetNodeG2, r as r, relType as relType
        CALL apoc.do.case([
            relCount = 0,
            "CALL apoc.create.relationship(sourceNodeG2, relType, r, targetNodeG2)
            YIELD rel
            //SET rel.source = sourceNodeG2.newtId, rel.target = targetNodeG2.newtId
            RETURN rel"],
        "", {relCount:relCount, sourceNodeG2:sourceNodeG2,
            targetNodeG2:targetNodeG2, r:r, relType:relType})
        YIELD value RETURN value',
      // case (v)
      sourceNodeG2 is not null and targetNodeG2 is null,
      'CALL apoc.create.relationship(sourceNodeG2, relType, r, targetNodeG1)
        YIELD rel
        //SET rel.source = sourceNodeG2.newtId, rel.target = targetNodeG1.newtId
        RETURN rel',
      // case (vi)
      sourceNodeG2 is null and targetNodeG2 is not null,
      'CALL apoc.create.relationship(sourceNodeG1, relType, r, targetNodeG2)
        YIELD rel
        //SET rel.source = sourceNodeG1.newtId, rel.target = targetNodeG2.newtId
        RETURN rel',
      // case (iv)
      sourceNodeG2 is null and targetNodeG2 is null,
      'RETURN r'
      ], '', {sourceNodeG2:sourceNodeG2, targetNodeG2:targetNodeG2, sourceNodeG1:sourceNodeG1, targetNodeG1:targetNodeG1, r:r, relType:relType}
      ) yield value
      WITH count(value) as valCnt
      // RETURN valCnt

      // delete nodes from G1 which are common with G2
      // also deletes the relationship coming to or directed away from the node
      MATCH (n { processed:1}), (m { processed:0})
      WHERE n.entityName = m.entityName AND labels(n) = labels(m)
      DETACH DELETE (m)
      WITH valCnt
      // set processed property to 0
      MATCH (nn { processed: 0})
      SET nn.processed = 1
      // WITH count(value) as valueCount
      RETURN count(nn) as ncnt
    }
    // RETURN rsource, rtarget
    WITH ncnt
    CALL {
      MATCH (n) WHERE EXISTS (n.newtId)
      REMOVE n.newtId, n.class
      SET n.processed = 1
      RETURN count(n) as processedNodes
    }
    WITH processedNodes
    CALL {
      MATCH ()-[r]->()
      // MATCH ()-[r]->() WHERE EXISTS (r.source)
      REMOVE r.source, r.target
      SET r.processed = 1
      RETURN count(r) as processedRels
    }
    WITH processedRels
    CALL {
      MATCH (n)-[:belongs_to_complex|:belongs_to_compartment|:belongs_to_submap]->(m)
      SET n.parent = id(m)
      RETURN ["1"] as rndVal
    }
    // RETURN processedRels
      // RETURN sg2, tg2, sg1, tg1, cr
    // }
      RETURN rndVal
      `

    var integrationQuery = integrationQueryAF

    var queryData = { nodesData: nodesData, edgesData: edgesData }
    var data = { query: integrationQuery, queryData: queryData }

    console.log(JSON.stringify(data));

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

  checkIfArrayIsSubarrayOfAnother: function ( subarray, mainArray ) {
    const result = subarray.every(val => mainArray.includes(val) 
      && subarray.filter(el => el === val).length
       <=
       mainArray.filter(el => el === val).length
    );

    return result;
  },

  // used while add a new node to chiseInstance in newt
  getNewtIdOfParentNodePD: function ( queryNode, queryParentNode ) {
    if ( !queryParentNode ) {
      return null;
    }
    var filterByLabel = cy.nodes().filter(function( ele ){
      return ele.data('label') == queryParentNode.label;
    });
    var filterByClass = filterByLabel.filter(function(ele) {
      return ele.data('class') == queryParentNode.class;
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

      return _.isEqual(stateVariables, queryParentNode.stateVariables) &&
              _.isEqual(unitsOfInformation, queryParentNode.unitsOfInformation);
    });
    return filterByStatesAndInfo.length ? filterByStatesAndInfo[0]._private.data.id : queryNode.parent;
  },

  getCorrespondingProcessNodeInNewt: function ( queryNode, connectedEdgesDB, neighboringNodesDB, cy, nodeIdRelation, queryParentNode ) {
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
      console.log(databaseUtilities.checkIfArrayIsSubarrayOfAnother(connectedNodeLabels, neighboringNodesTypes))
      // return _.isEqual(connectedNodeLabels, neighboringNodesTypes);
      return databaseUtilities.checkIfArrayIsSubarrayOfAnother(connectedNodeLabels, neighboringNodesTypes);
    }); 
    console.log("neighboringNodesTypes", neighboringNodesTypes);
    console.log("filteredProcessNodesWithGivenEdges", filteredProcessNodesWithGivenEdges)
    console.log("filteredProcessNodesWithGivenNeighbors", filteredProcessNodesWithGivenNeighbors);
    
    var exists = filteredProcessNodesWithGivenNeighbors.length;

    if ( !exists ) {
      return false;
    }

    // var data;
    
    // console.log("filteredProcessNodesWithGivenNeighbors loop")
    // check if the node has same parent in both db and newt
    for(let i = 0; i < filteredProcessNodesWithGivenNeighbors.length; i++) {
      var data = filteredProcessNodesWithGivenNeighbors[i]._private;
      var processNodeParent = filteredProcessNodesWithGivenNeighbors[i]._private.parent;

      // handle the case when both nodes have no parent
      if ( queryParentNode == null && processNodeParent == null) {
        nodeIdRelation[data.data.id] = queryNode.id;
        nodeIdRelation[queryNode.id] = data.data.id;
        return true;
      }
      if ( queryParentNode == null || processNodeParent == null ) {
        continue;
      }
      var parentData = processNodeParent._private.data;
      var parentLabel = parentData.label;
      var parentClass = parentData.class;
      // console.log(parentClass, queryParentNode.class, parentLabel, queryParentNode.label)

      if ( parentClass == queryParentNode.class && parentLabel == queryParentNode.label ) {
        nodeIdRelation[data.data.id] = queryNode.id;
        nodeIdRelation[queryNode.id] = data.data.id;
        return true;
      }
    }

    // if a match of process node is not found return that node exits i.e. false
    return false;
  },

  checkIfProcessNodeExists: function( queryNode, queryNodes, queryEdges, cy, nodeIdRelation, queryParentNode ) {
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

    return databaseUtilities.getCorrespondingProcessNodeInNewt( queryNode, connectedEdgesDB, neighboringNodesDB, cy, nodeIdRelation, queryParentNode );
  },

  checkIfPDNodeExists: function ( queriedNode, queriedParentNode, cy, nodeIdRelation ) {
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
          var text = data.label.text || "";
          unitsOfInformation.push(text)
        }

      }
      stateVariables.sort();
      unitsOfInformation.sort();

      return _.isEqual(stateVariables, queriedNode.stateVariables) &&
              _.isEqual(unitsOfInformation, queriedNode.unitsOfInformation);
    })
    console.log("filterByStatesAndInfo", filterByStatesAndInfo)
    console.log(filterByClass.length)
    for(let i = 0; i < filterByStatesAndInfo.length; i++) {
      var data = filterByStatesAndInfo[i]._private;
      // console.log("data", data);
      // if there is no parent but a node exists with given props in both database and newt return true
      if (data.parent === null && queriedParentNode === null) {
        nodeIdRelation[data.data.id] = queriedNode.id;
        nodeIdRelation[queriedNode.id] = data.data.id;
        return true;
      }

      // if node's parent in newt is null but not null in DB continue
      if ( data.parent === null || queriedParentNode === null) {
        continue;
      }
      console.log("data.parent", data.parent);
      console.log("queriedParentNode", queriedParentNode);
      var parentData = data.parent._private.data;
      // console.log("parentdata", parentData);
      parentNodeNewtId = parentData.id;
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
            // node exists in newt
            nodeIdRelation[data.data.id] = queriedNode.id;
            nodeIdRelation[queriedNode.id] = data.data.id;
            return true;
          }
    }
    console.log(false)
    // node does not exist in newt
    return false;
  },

  checkIfAFNodeExists: function ( queriedNode, queriedParentNode, cy, nodeIdRelation ) {
    var filterByLabel = cy.nodes().filter(function( ele ){
      return ele.data('label') == queriedNode.label;
    });
    var filterByClass = filterByLabel.filter(function(ele) {
      return ele.data('class') == queriedNode.class;
    })
    var filterByStatesAndInfo = filterByClass.filter(function(ele) {
      var stateorinfoboxes = ele.data('statesandinfos');
      var unitsOfInformation = [];

      for(let i = 0; i < stateorinfoboxes.length; i++) {
        var data = stateorinfoboxes[i];

        if(data.clazz == "unit of information") {
          var text = data.label.text || "";
          unitsOfInformation.push(text);
        }

      }
      unitsOfInformation.sort();

      return _.isEqual(unitsOfInformation, queriedNode.unitsOfInformation);
    })
    console.log("filterByStatesAndInfo", filterByStatesAndInfo)
    console.log(filterByClass.length)
    for(let i = 0; i < filterByStatesAndInfo.length; i++) {
      var data = filterByStatesAndInfo[i]._private;
      // console.log("data", data);
      // if there is no parent but a node exists with given props in both database and newt return true
      if (data.parent === null && queriedParentNode === null) {
        nodeIdRelation[data.data.id] = queriedNode.id;
        nodeIdRelation[queriedNode.id] = data.data.id;
        return true;
      }

      // if node's parent in newt is null but not null in DB continue
      if ( data.parent === null || queriedParentNode === null) {
        continue;
      }
      console.log("data.parent", data.parent);
      console.log("queriedParentNode", queriedParentNode);
      var parentData = data.parent._private.data;
      // console.log("parentdata", parentData);
      parentNodeNewtId = parentData.id;
      var parentNodeClass = databaseUtilities.calculateClass(parentData.class);
      var parentNodeLabel = parentData.label;
      var parentNodeUnitOfInformation = databaseUtilities.calculateInfo(parentData.statesandinfos);

      console.log(parentNodeClass, queriedParentNode.class)
      console.log(parentNodeLabel, queriedParentNode)
      console.log(parentNodeUnitOfInformation, queriedParentNode.unitsOfInformation)
      if (_.isEqual(parentNodeClass, queriedParentNode.class) && _.isEqual(parentNodeLabel, queriedParentNode.label)
          && _.isEqual(parentNodeUnitOfInformation, queriedParentNode.unitsOfInformation)) {
            console.log("true")
            // node exists in newt
            nodeIdRelation[data.data.id] = queriedNode.id;
            nodeIdRelation[queriedNode.id] = data.data.id;
            return true;
          }
    }
    console.log(false)
    // node does not exist in newt
    return false;
  },

  // used while add a new node to chiseInstance in newt
  getNewtIdOfParentNodeAF: function ( queryNode, queryParentNode ) {
    if ( !queryParentNode ) {
      return null;
    }
    var filterByLabel = cy.nodes().filter(function( ele ){
      return ele.data('label') == queryParentNode.label;
    });
    var filterByClass = filterByLabel.filter(function(ele) {
      return ele.data('class') == queryParentNode.class;
    })
    var filterByStatesAndInfo = filterByClass.filter(function(ele) {
      var stateorinfoboxes = ele.data('statesandinfos');
      var unitsOfInformation = [];

      for(let i = 0; i < stateorinfoboxes.length; i++) {
        var data = stateorinfoboxes[i];

        if(data.clazz == "unit of information") {
          unitsOfInformation.push(data.label.text)
        }

      }
      unitsOfInformation.sort();

      return _.isEqual(unitsOfInformation, queryParentNode.unitsOfInformation);
    });
    return filterByStatesAndInfo.length ? filterByStatesAndInfo[0]._private.data.id : queryNode.parent;
  },
  
}

module.exports = databaseUtilities;