var nodeMatchUtilities = require("./node-match-utilities");
var graphALgos = require("./graph-algos");
var appUtilities = require("./app-utilities");
const { merge, cleanData, type } = require("jquery");
const { handleSBGNInspector } = require("./inspector-utilities");
const { LayoutPropertiesView } = require("./backbone-views");
const chise = require("chise");

var errorCheck =null;

const categories = {
  macromolecule: "EPN",
  simple_chemical: "EPN",
  unspecified_entity: "EPN",
  nucleic_acid_feature: "EPN",
  perturbing_agent: "EPN",
  empty_set: "EPN",
  complex: "EPN",
  process: "process",
  omitted_process: "process",
  uncertain_process: "process",
  association: "process",
  dissociation: "process",
  phenotype: "process",
  and:'logical',
  or:'logical',
  not:'logical',
  compartment: "compartment",
  submap: "submap",
  tag: "tag",

  // AF nodes
  BA_plain: "EPN",
  BA_macromolecule: "EPN",
  BA_simple_chemical: "EPN",
  BA_nucleic_acid_feature: "EPN",
  BA_unspecified_entity: "EPN",
  BA_perturbing_agent: "EPN",
  BA_complex: "EPN",
  delay:"logical",

  // SIF nodes
  SIF_macromolecule: "EPN",
  SIF_simple_chemical: "EPN",

  // SBML nodes
  gene : "EPN",
  rna : "EPN",
  antisense_rna: "EPN",
  protein : "EPN",
  truncated_protein: "EPN",
  ion_channel: "EPN",
  receptor: "EPN",
  ion: "EPN",
  simple_molecule: "EPN",
  unknown_molecule: "EPN",
  degradation: "EPN",
  drug: "EPN",
  phenotype_sbml: "EPN",
  complex_sbml: "EPN",
};

var epnCriterias= {
  BA_plain:{
    unitsOfInformation:{
      contribution:1,
      type:"array"
    },
  },
  macromolecule:{
    multimer:{
      contribution:0.3,
      type:"boolean"
    },
    stateVariables:{
      contribution:0.3,
      type:"array"
    },
    unitsOfInformation:{
      contribution:0.4,
      type:"array"
    },
  },
  simple_chemical:{
    multimer:{
      contribution:0.0,
      type:"boolean"
    },
    stateVariables:{
      contribution:0.5,
      type:"array"
    },
    unitsOfInformation:{
      contribution:0.5,
      type:"array"
    },
  },
  unspecified_entity:{
    entityName:{
      contribution:1,
      type:"string"
    }
  },
  nucleic_acid_feature:{
    multimer:{
      contribution:0.3,
      type:"boolean"
    },
    stateVariables:{
      contribution:0.3,
      type:"array"
    },
    unitsOfInformation:{
      contribution:0.4,
      type:"array"
    },
  },
  perturbing_agent:{
    entityName:{
      contribution:1,
      type:"string"
    }
  },
  tag:{
    entityName:{
      contribution:1,
      type:"string"
    }
  },
  empty_set:{
    multimer:{
      contribution:0.3,
      type:"boolean"
    },
    stateVariables:{
      contribution:0.3,
      type:"array"
    },
    unitsOfInformation:{
      contribution:0.4,
      type:"array"
    },
  },
  complex:{
    multimer:{
      contribution:0.3,
      type:"boolean"
    },
    stateVariables:{
      contribution:0.3,
      type:"array"
    },
    unitsOfInformation:{
      contribution:0.4,
      type:"array"
    },
  },
};

function neoInt(x) {
  return (x && typeof x === "object" && x.low != null) ? x.low : x;
}
var databaseUtilities = {
  enableDatabase: true,
  nodesInDB: {},
  edgesInDB: {},


  _isDBEmpty: function() {
    const tabKey = databaseUtilities._currentActiveNetworkID();
    const nodes = this.nodesInDB[tabKey] || {};
    const edges = this.edgesInDB[tabKey] || {};
    return Object.keys(nodes).length === 0 && Object.keys(edges).length === 0;
  },

  _currentActiveNetworkID: function(){
    var chiseInstance = appUtilities.getActiveChiseInstance();
    return chiseInstance && chiseInstance.getCy() && chiseInstance.getCy().container().id;
  },

  _getCurrentTabLocalDBMatchingOptions: function (params) {
    var cy = appUtilities.getActiveCy();
    var generalProperties = appUtilities.getScratch(
      cy,
      "currentGeneralProperties"
    );

    return {
      epnMatchingPercentage:generalProperties.epnMatchingPercentage,
      processIncomingContribution:generalProperties.processIncomingContribution,
      processOutgoingContribution:generalProperties.processOutgoingContribution,
      processAgentContribution:generalProperties.processAgentContribution,
      overallProcessPercentage:generalProperties.overallProcessPercentage,
      complexMatchPercentage:generalProperties.complexMatchPercentage,
      allowSimpleChemicalCloning: generalProperties.allowSimpleChemicalCloning,
      simpleChemicalCloningThreshold: generalProperties.simpleChemicalCloningThreshold,
    }
  },
  
  storeGraph:async function (nodes=[],edges=[]) {
    const tabKey = databaseUtilities._currentActiveNetworkID();
    let tempNodesInDB = Object.assign({}, databaseUtilities.nodesInDB[tabKey]);
    let tempEdgesInDB = Object.assign({}, databaseUtilities.edgesInDB[tabKey]);
    for(let i=0;i<nodes.length;i++){
      if(!tempNodesInDB[nodes[i].properties.newtId]){
        tempNodesInDB[nodes[i].properties.newtId] = nodes[i];
      }
    }
    for(let j=0;j<edges.length;j++){
      tempEdgesInDB[
        [
          edges[j].properties.source,
          edges[j].properties.target,
          edges[j].properties.class,
        ].join("|")
      ] = edges[j];
    };
    return {nodes: tempNodesInDB, edges: tempEdgesInDB};
  },

  updateDBMaps: function (nodesInDB, edgesInDB) {
    const tabKey = databaseUtilities._currentActiveNetworkID();
    databaseUtilities.nodesInDB[tabKey] = nodesInDB;
    databaseUtilities.edgesInDB[tabKey] = edgesInDB;
  },

  cleanNodesAndEdgesInDB: function () {
    databaseUtilities.nodesInDB = {};
    databaseUtilities.edgesInDB = {};
  },

  calculateClass: function (entitysClass) {
    var classArray = entitysClass.split(" ");
    var classArray = classArray.filter((string) => string !== "multimer");
    var finalClass = classArray.join("_");
    return finalClass;
  },
  getMapValue: function (val) {
    return databaseUtilities.nodesInDB[tabKey][val] || null;
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
      if(value === "" && variable === "") continue;
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

  processAFNode: function (currentNode, data) {
    currentNode.newtId = data.id;
    currentNode.entityName = data.label || "";
    currentNode.language = data.language;
    currentNode.class = databaseUtilities.calculateClass(data.class);
    currentNode.category = categories[currentNode.class];
    currentNode.unitsOfInformation = databaseUtilities.calculateInfo(
      data.statesandinfos
    );
    if (data.hasOwnProperty("parent")) {
      currentNode.parent = data.parent;
    }
  },

  processSIFNode: function (currentNode, data) {
    currentNode.newtId = data.id;
    currentNode.entityName = data.label || "";
    currentNode.language = data.language;
    currentNode.class = databaseUtilities.calculateClass(data.class);
    currentNode.category = categories[currentNode.class];
    currentNode.unitsOfInformation = databaseUtilities.calculateInfo(
      data.statesandinfos
    );
    if (data.hasOwnProperty("parent")) {
      currentNode.parent = data.parent;
    }
  },
  
  processSBMLNode: function (currentNode, data) {
    currentNode.newtId = data.id;
    currentNode.entityName = data.label || "";
    currentNode.language = data.language;
    currentNode.class = databaseUtilities.calculateClass(data.class);
    currentNode.category = categories[currentNode.class];
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

  processPdNode: function (currentNode, data) {
    currentNode.newtId = data.id;
    currentNode.entityName = data.label || "";
    currentNode.language = data.language;
    currentNode.class = databaseUtilities.calculateClass(data.class);
    currentNode.category = categories[currentNode.class];
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

  processAfEdge: function (data) {
    return {
      stoichiometry: data.cardinality || 0,
      class: databaseUtilities.calculateClass(data.class),
      source: data.source,
      target: data.target,
      inDb: false,
    }
  },

  processSifEdge: function (data) {
    return {
      stoichiometry: data.cardinality || 0,
      class: databaseUtilities.calculateClass(data.class),
      source: data.source,
      target: data.target,
      inDb: false,
    }
  },

  processPdEdge: function (data) {
    return {
      stoichiometry: data.cardinality || 0,
      class: databaseUtilities.calculateClass(data.class),
      source: data.source,
      target: data.target,
      inDb: false,
    };
  },

  processSBMLEdge: function (data) {
    return {
      stoichiometry: data.cardinality || 0,
      class: databaseUtilities.calculateClass(data.class),
      source: data.source,
      target: data.target,
      inDb: false,
    };
  },

  processNodesData: async function (nodesData, activeTabContent) {
    for (let i = 0; i < activeTabContent.nodes.length; i++) {
      var currentNode = {};
      var data = activeTabContent.nodes[i].data;
      if (data.language == "PD") {
        databaseUtilities.processPdNode(currentNode, data);
      }
      else if (data.language == "AF") {
        databaseUtilities.processAFNode(currentNode, data);
      }
      else if (data.language == "SIF") {
        // if its a topology group, we need to skip it
        // if (data.class === "topology group") continue;
        databaseUtilities.processSIFNode(currentNode, data);
      }
      else if (data.language == "SBML") {
        databaseUtilities.processSBMLNode(currentNode, data);
      }
      nodesData.push(currentNode);
    }
  },

  processEdgesData: async function (edgesData, activeTabContent) {
    for (let i = 0; i < activeTabContent.edges.length; i++) {
      let processed= {};
      var data = activeTabContent.edges[i].data;
      if (data.language == "PD") {
        processed = databaseUtilities.processPdEdge(data);
      }
      else if (data.language == "AF") {
        processed = databaseUtilities.processAfEdge(data);
      }
      else if (data.language == "SIF") {
        processed = databaseUtilities.processSifEdge(data);
      }
      else if (data.language == "SBML") {
        processed = databaseUtilities.processSBMLEdge(data);
      }
      edgesData.push(processed);
    }
  },

  pushActiveContentToDatabase: async function (activeTabContent, flag) {    
    var nodes = [];
    var edges = [];
    console.log('UnProcessed data:',activeTabContent);    
    await databaseUtilities.processNodesData(nodes, activeTabContent);
    await databaseUtilities.processEdgesData(edges, activeTabContent);
    console.log('UnProcessed data 2:',nodes,edges);
    let {nodesData,edgesData} = await databaseUtilities.processData(nodes, edges);
    console.log('Processed data:',nodesData,edgesData);
    return await databaseUtilities.pushActiveNodesEdgesToDatabase(
      nodesData,
      edgesData,
      flag
    );
  },

  processData: async function (nodesData, edgesData) {
    var parentChildRelationship = {};
    var parentNodes = {};
    var nodesMap = {};
    var specialNodes = {};
    var topologyGroups = {};
    var tabKey = databaseUtilities._currentActiveNetworkID();
    // specialNodes map with be in this format (newtId or process Node): [[sourceClass, sourceCloneLab, sourceCloneMarker, sourceEntityName,
    //sourceMultimer, sourceParent, sourceStateVariable1,.., sourceStateVariableN, sourceUnitInformation1,..sourceUnitInformationN],
    //[targetClass, targetCloneLab, targetCloneMarker, targetEntityName, targeteMultimer, targetParent, targetStateVariable1,..,targetStateVariableN, targetUnitInformation1,...targetUnitInformationN],
    //[modifierClass, modifierCloneLab, modifierCloneMarker, modifierEntityName, modifierMultimer, modifierParent, modifierStateVariable1,..,modifierStateVariableN, modifierUnitInformation1,...,modifierUnitInformationN],

    //Check if node is already pushed

    for (let i = 0; i < nodesData.length; i++) {
      nodesData[i].inDb = false;
      if (databaseUtilities.nodesInDB[tabKey] && databaseUtilities.nodesInDB[tabKey][nodesData[i].newtId]) {
        nodesData[i].inDb = true;
        nodesData[i].idInDb = databaseUtilities.nodesInDB[tabKey][nodesData[i].newtId];
      }
      //And keep track of complex, compartment, submap
      if (
        nodesData[i].class == "complex" ||
        nodesData[i].class == "compartment" ||
        nodesData[i].class == "submap" ||
        nodesData[i].class == "complex_sbml"
      ) {
        parentNodes[nodesData[i].newtId] = nodesData[i].class;
      }
      // Check if node is a topology group
      if(nodesData[i].class === "topology_group") {
         topologyGroups[nodesData[i].newtId] = [];
      }

      
      if (!nodesData[i].parent) {
        nodesData[i].parent = "none";
      }

      // if the nodes's parent is in the topology then add it to the array
      if( nodesData[i].parent && topologyGroups[nodesData[i].parent]) {
        topologyGroups[nodesData[i].parent].push(nodesData[i].newtId);  
        nodesData[i].parent = "none"; // reset the parent to none
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
    //Add child parent relationships if any
    for (let i = 0; i < nodesData.length; i++) {
      console.log("Node parent", nodesData[i].newtId, nodesData[i].parent);
      if (nodesData[i].parent != "none" && parentNodes[nodesData[i].parent]!=='complex_sbml') {
        var newEdge = {
          source: nodesData[i].newtId,
          target: nodesData[i].parent,
          class: "belongs_to_" + parentNodes[nodesData[i].parent],
        };
        edgesData.push(newEdge);
      }
    }

    // extending relationships from topology groups node's children to other nodes that are connected to the topology group
    for(let i=0;i<edgesData.length;i++){
      let edge = edgesData[i];
      let source = edge.source;
      let target = edge.target
      let edgeClass = edge.class;
      if(topologyGroups[source] || topologyGroups[target]){
        let children = topologyGroups[source]?topologyGroups[source]:topologyGroups[target];
        for(let i=0;i<children.length;i++){
          let child = children[i];
          let src = topologyGroups[source]?child:source;
          let trg = topologyGroups[target]?child:target;
          var newEdge = {
            source: src,
            target: trg,
            class: edgeClass
          };
          edgesData.push(newEdge);
        }
      }
    }
    edgesData = edgesData.filter((edge)=>{
      let source = edge.source;
      let target = edge.target
      if(topologyGroups[source] || topologyGroups[target])return false;
      return true;
    });
    nodesData = nodesData.filter((node)=>node.class!=="topology_group");

    for (let i = 0; i < edgesData.length; i++) {
      edgesData[i].inDb = false;
      if (
        databaseUtilities.edgesInDB[tabKey] && 
        databaseUtilities.edgesInDB[tabKey][
          [edgesData[i].source, edgesData[i].target, edgesData[i].class]
        ]
      ) {
        edgesData[i].inDb = true;
        edgesData[i].idInDb =
          databaseUtilities.edgesInDB[tabKey][
            databaseUtilities.edgesInDB[tabKey][
              (edgesData[i].source, edgesData[i].target, edgesData[i].class)
            ]
          ];
      }
      edgesData[i].sourceClass = nodesMap[edgesData[i].source].class;
      edgesData[i].targetClass = nodesMap[edgesData[i].target].class;

      //Process process nodes
      if (
        specialNodes[edgesData[i].source] &&
        edgesData[i].class != "belongs_to_compartment" &&
        edgesData[i].class != "belongs_to_submap" &&
        edgesData[i].class != "belongs_to_complex"
      ) {
        var targetId = edgesData[i].target;
        var target = nodesMap[targetId];
        var len = specialNodes[edgesData[i].source][1].length;
        specialNodes[edgesData[i].source][1].push([
          target.class,
          target.cloneLabel.toString(),
          target.cloneMarker.toString(),
          target.entityName,
          target.multimer.toString(),
          target.parent,
          target.newtId,
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
            source.newtId,
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
            source.newtId,
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

    let updatedNodes = [];
    //Remove tag nodes if they are disconnected
    for(let i = 0; i < nodesData.length; i++) {
      if (nodesData[i].class === "tag") {
        // Check if the node has any edges
        let hasEdge = false;
        for (let j = 0; j < edgesData.length; j++) {
          if (edgesData[j].source === nodesData[i].newtId || edgesData[j].target === nodesData[i].newtId) {
            hasEdge = true;
            break;
          }
        }
        if (hasEdge) {
          updatedNodes.push(nodesData[i]);
        }
      } else {
        updatedNodes.push(nodesData[i]);
      }
    }
    nodesData = updatedNodes;
    return {
      nodesData: updatedNodes,edgesData: edgesData}
  },
  cleanDatabase: async function () {
    var integrationQuery = `call custom.clearDatabase();`;
    var data = { query: integrationQuery, queryData: {} };
    await $.ajax({
      type: "post",
      url: "/utilities/runDatabaseQuery",
      contentType: "application/json; charset=utf-8",
      data: JSON.stringify(data),
      success: function (response) {
      },
      error: function (req, status, err) {
        errorCheck = {status,err}
        console.error("Error running query", status, err);
      },
    });
  },

  mergeCompartmentsToDatabase: async function (payload) {
    const integrationQuery = `
      CALL custom.mergeCompartments($payload)
      YIELD result
      RETURN result
    `;
    const data = { query: integrationQuery, queryData: { payload } };

    const response = await $.ajax({
      type: "post",
      url: "/utilities/runDatabaseQuery",
      contentType: "application/json; charset=utf-8",
      data: JSON.stringify(data)
    });

    if (!response.records || response.records.length === 0) return null;
    const map = response.records[0]._fields[0];
    return { result: map };
  },

  runSearchNodesWithPaths: async function (payload, enableCloning, cloneThreshold) {
    const integrationQuery = `
      CALL custom.searchNodesWithPaths($classType, $label, $matchMode, $options)
      YIELD result
      RETURN result
    `;

    const data = {
      query: integrationQuery,
      queryData: {
        classType: payload.classType,
        label: payload.label,
        matchMode: payload.matchMode,
        options: payload.options || {}
      }
    };
    console.log("Running searchNodesWithPaths with data:", data);
    try {
      const response = await $.ajax({
        type: "post",
        url: "/utilities/runDatabaseQuery",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(data)
      });

      if (!response.records || !response.records.length) {
        console.warn("No result from custom.searchNodesWithPaths");
        return null;
      }
      if(!payload.mergeMode){
        var cy = appUtilities.getActiveCy();
        cy.elements().remove();
        databaseUtilities.cleanNodesAndEdgesInDB();
      }
      var map = response.records[0]._fields[0] || {};
      var nodesArray = map.nodes || [];
      var edgesArray = map.edges || [];

      console.log("Normalized searchNodesWithPaths result:", { nodes: nodesArray, edges: edgesArray });
      const {nodes:nodesArr,edges:edgesArr} = await databaseUtilities.storeGraph(nodesArray, edgesArray);
      const {nodes, edges, originalsToMark} = databaseUtilities.cloneSimpleChemicals(Object.values(nodesArr), Object.values(edgesArr), enableCloning, cloneThreshold);
      nodesArray = await databaseUtilities.deduplicateExistingNodes(nodes);
      edgesArray = await databaseUtilities.deduplicateExistingEdges(edges);
      await databaseUtilities.batchAddNodesEdgesToCy(nodesArray, edgesArray,originalsToMark);
      console.log('DB nodes after runSearch:',databaseUtilities.nodesInDB);
      databaseUtilities.updateDBMaps(nodesArr, edgesArr);
    } catch (err) {
      console.error("Error running custom.searchNodesWithPaths:", err);
      return null;
    }
  },


  getCompartmentMembers: async function (compartmentNewtId, enableCloning, cloneThreshold) {
    const integrationQuery = `
      CALL custom.getCompartmentMembers($compartmentNewtId)
      YIELD node, rel
      RETURN node, rel
    `;
    const data = {
      query: integrationQuery,
      queryData: { compartmentNewtId }
    };
    const response = await $.ajax({
      type: "post",
      url: "/utilities/runDatabaseQuery",
      contentType: "application/json; charset=utf-8",
      data: JSON.stringify(data)
    });
    console.log("Compartment members response:", response);
    
    if (!response.records || response.records.length === 0){
      // new EmptyMemberContentView({ el: "#empty-local-database-output-table" }).render();
      return null;
    }

    const recs      = response.records;
    let nodesArr = [];
    let edgesArr = [];
    recs.forEach(r => {
      const node = r._fields[0];
      const rel  = r._fields[1];
      nodesArr.push(node);
      edgesArr.push(rel);
      });
    edgesArr = edgesArr.filter(edge=>edge!=null);
    edgesArr = await databaseUtilities.deduplicateExistingEdges(edgesArr);
    const {nodes: nodesArray, edges: edgesArray, originalsToMark} = databaseUtilities.cloneSimpleChemicals(nodesArr, edgesArr, enableCloning, cloneThreshold);
    console.log(edgesArray);
    await databaseUtilities.batchAddNodesEdgesToCy(nodesArray, edgesArray,originalsToMark);
  },
    pushMergedNodeToDatabase: async function (mergedPayload) {
      console.log("Pushing merged node to database:", mergedPayload);

      const integrationQuery = `
        CALL custom.mergeNodes($payload)
        YIELD result
        RETURN result
      `;

      const data = {
        query: integrationQuery,
        queryData: {
          payload: mergedPayload
        }
      };

      try {
        const response = await $.ajax({
          type: "post",
          url: "/utilities/runDatabaseQuery",
          contentType: "application/json; charset=utf-8",
          data: JSON.stringify(data)
        });

        console.log("Merge result:", response);

        // Unpack the response
        if (!response.records || response.records.length === 0) {
          console.warn("No merge result returned.");
          return null;
        }

        const map = response.records[0]._fields[0];
        console.log("Parsed merge result:", map);
        return { result: map }; // contains mergedNodeId, deletedNodes, rewiredEdges
      } catch (err) {
        console.error("Error running custom.mergeNodes:", err);
        return null;
      }
    },

  mergeComplexesToDatabase: async function (payload) {
    const integrationQuery = `
      CALL custom.mergeComplexes($payload)
      YIELD result
      RETURN result
    `;
    const data = { query: integrationQuery, queryData: { payload } };

    const response = await $.ajax({
      type: "post",
      url: "/utilities/runDatabaseQuery",
      contentType: "application/json; charset=utf-8",
      data: JSON.stringify(data)
    });

    if (!response.records || response.records.length === 0) return null;
    const map = response.records[0]._fields[0];
    return { result: map };
  },



  pushEPNToLocalDatabase: async function (ids,list,epnMatchingPercentage) {
    // console.log(ids,list,mergeflag,epnMatchingPercentage/100);
    list = list.map((epn) => {
      var newEPN = Object.assign({}, epn);
      newEPN.parent = ids[epn.parent] || epn.parent;
      return newEPN;
    });
    var integrationQuery = `
        UNWIND $nodesData AS data
        WITH data, apoc.map.get($epnCriterias, data.class, {}) AS criteria
        CALL custom.matchAndPushEPN(
            data, 
            criteria,  // ✅ Sends only the relevant epnCriteria
            $epnMatchingPercentage
        ) YIELD result
        RETURN result;
        `;
    
    var data = {
      query: integrationQuery,
      queryData: { nodesData: list, epnCriterias:epnCriterias, epnMatchingPercentage:epnMatchingPercentage/100},
    };
    console.log(data);
    await $.ajax({
      type: "post",
      url: "/utilities/runDatabaseQuery",
      contentType: "application/json; charset=utf-8",
      data: JSON.stringify(data),
      success: function (response) {
        console.log(response)
        const { records } = response;
        for (let record of records) {
          const map = record._fields[0];
          // console.log(map);
          if(map.existing==null){
            ids[map.incoming] = map.incoming;
          }
          else{
            ids[map.incoming] = map.existing;
          }
        }
        return ids;
      },
      error: function (req, status, err) {
        errorCheck = {status,err}
        console.error("Error running query", status, err);
      },
    });

    return ids;
  },
  pushProcessToLocalDatabase: async function (list, ids, processIncomingContribution,processOutgoingContribution,processAgentContribution,overallProcessPercentage) {
    // console.log(list,ids);
    list = list.map((pr) => {
      const sourceNewtIds = Object.keys(pr)
        .filter((key) => key.startsWith("source_"))
        .map((key) => {
          // console.log(key,pr[key][6],ids[pr[key][6]]);
          return ids[pr[key][6]]
        }) // Assuming index 6 is the newtId
        .filter((id) => id !== "none" && id!==undefined); // Remove any 'none' values

      // Extract target newtIds
      const targetNewtIds = Object.keys(pr)
        .filter((key) => key.startsWith("target_"))
        .map((key) => ids[pr[key][6]]) // Assuming index 6 is the newtId
        .filter((id) => id !== "none" && id!==undefined); // Remove any 'none' values
      
      // Extract modifier newtIds
      const modifierNewtIds = Object.keys(pr)
        .filter((key) => key.startsWith("modifier_"))
        .map((key) => ids[pr[key][6]]) // Assuming index 6 is the newtId
        .filter((id) => id !== "none" && id!==undefined); // Remove any 'none' values

      var process = Object.assign({}, pr);
      process.sourceNewtIds = sourceNewtIds;
      process.targetNewtIds = targetNewtIds;
      process.modifierNewtIds = modifierNewtIds;
      process.parent = ids[pr.parent]||pr.parent;
      return process;
    });
    console.log(list);
    var integrationQuery = `
      CALL custom.pushProcess(
        $processes,
        $sourceThreshold,
        $targetThreshold,
        $modifierThreshold,
        $overallThreshold
      )
      YIELD result
      RETURN result
    `;

    var data = {
      query: integrationQuery,
      queryData: {
        processes: list,
        sourceThreshold: processIncomingContribution,
        targetThreshold: processOutgoingContribution,
        modifierThreshold: processAgentContribution,
        overallThreshold: overallProcessPercentage
      }
    };
    await $.ajax({
      type: "post",
      url: "/utilities/runDatabaseQuery",
      contentType: "application/json; charset=utf-8",
      data: JSON.stringify(data),
      success: function (response) {
        const { records } = response;
        console.log(records);
        for (let record of records) {
          const map = record._fields[0];
          ids[map.incoming] = map.existing;
        }
      },
      error: function (req, status, err) {
        errorCheck = {status,err}
        console.error("Error running query", status, err);
      },
    });

    return ids;
  },

  pushEdgesToLocalDatabase: async function (list, ids) {
    // 1) rewrite endpoints with fallback
    let filtered_list = list.map(e => {
      const edge = Object.assign({}, e);
      edge.source = ids[edge.source] || edge.source;
      edge.target = ids[edge.target] || edge.target;
      return edge;
    });

    // 2) drop invalid + self-loop edges (self-loop can appear after merges)
    filtered_list = filtered_list.filter(e =>
      e.source && e.target &&
      e.source !== "none" && e.target !== "none" &&
      e.source !== e.target
    );

    // 3) IMPORTANT: dedupe AFTER mapping
    filtered_list = databaseUtilities._dedupeEdgesByTriple(filtered_list);

    const query = `
      UNWIND $edges AS edge
      MATCH (sourceNode {newtId: edge.source})
      MATCH (targetNode {newtId: edge.target})
      CALL apoc.do.when(
        EXISTS { MATCH (sourceNode)-[r]->(targetNode) WHERE type(r) = edge.class },
        'RETURN false AS created, null AS rel',
        'CALL apoc.create.relationship(sourceNode, edge.class, edge, targetNode) YIELD rel RETURN true AS created, rel AS rel',
        {sourceNode: sourceNode, targetNode: targetNode, edge: edge}
      ) YIELD value
      RETURN value;
    `;

    const data = { query, queryData: { edges: filtered_list } };

    await $.ajax({
      type: "post",
      url: "/utilities/runDatabaseQuery",
      contentType: "application/json; charset=utf-8",
      data: JSON.stringify(data),
      success: function (response) {
        console.log(response);
        // Count inserted vs existed: value is null when relation already existed
        let inserted = 0;
        for (const rec of response.records || []) {
          const v = rec._fields[0]; // "value"
          if (v && v.rel!=null) inserted++;      // depends on APOC shape
        }
      },
      error: function (req, status, err) {
        errorCheck = { status, err };
        console.error("Error running query", status, err);
      },
    });
  },


  pushCompartmentsToDatabase: async function(compartments){
    console.log('pushing compartments',compartments);
    var integrationQuery = `    
        CALL custom.pushCompartments($nodesData)
        YIELD result return result
    `;
    var data={
      query: integrationQuery,
      queryData:{nodesData:compartments},
    };
    let ids = {};
    await $.ajax({
      type: "post",
      url: "/utilities/runDatabaseQuery",
      contentType: "application/json; charset=utf-8",
      data: JSON.stringify(data),
      success: function (response) {
        console.log('compartment:',response);
        const { records } = response;
        for (let record of records) {
          const map = record._fields[0];
          ids[map.incoming] = map.existing;
        }
        return ids;
      },
      error: function (req, status, err) {
        errorCheck = {status,err}
        console.error("Error running query", status, err);
      },
    });
    return ids;
  },

  pushSubmapsToDatabase: async function(ids,submaps){
    var chiseInstance = appUtilities.getActiveChiseInstance();
    submaps = submaps.map((submap) => {
      var newSubmap = Object.assign({}, submap);
      newSubmap.parent = ids[submap.parent] || submap.parent;
      return newSubmap;
    });
    // var integrationQuery = `
    // unwind $nodesData as data
    // call apoc.do.when(
    //   exists{match (n) where n.class="submap" and n.entityName=data.entityName return n},
    //   "match (n) where n.entityName=data.entityName return {incoming:data.newtId,existing:n.newtId} as result",
    //   'call apoc.cypher.doIt("CALL apoc.create.node([data.class],data)yield node set node.processed=0 return {incoming:data.newtId,existing:node.newtId} as result",{data:data}) yield value return value.result as result',
    //   {data:data}
    // ) yield value return value.result as result;
    // `;
    var integrationQuery = `
      CALL custom.pushSubmaps($nodesData)
      YIELD result
      RETURN result;
    `;
    var data={
      query: integrationQuery,
      queryData:{nodesData:submaps},
    };
    await $.ajax({
      type: "post",
      url: "/utilities/runDatabaseQuery",
      contentType: "application/json; charset=utf-8",
      data: JSON.stringify(data),
      success: function (response) {
        const { records } = response;
        for (let record of records) {
          const map = record._fields[0];
          ids[map.incoming] = map.existing;
        }
        return ids;
      },
      error: function (req, status, err) {
        errorCheck = {status,err}
        console.error("Error running query", status, err);
      },
    });
    return ids;
  },

  pushComplexesToDatabase: async function (ids,complexes, epns, threshold) {
    // Helper to sanitize EPNs by removing nested object properties
    function stripComplexProps(obj) {
      const result = {};
      for (const key in obj) {
        const val = obj[key];
        if (typeof val !== "object" || val === null || Array.isArray(val)) {
          result[key] = val;
        }
      }
      return result;
    }
  
    // Associate each complex with its children and parent (stripped)
    let complexIds = {};
    // console.log("epns:",JSON.parse(JSON.stringify(epns)));
    for (let complex of complexes) {
      let children = [];
      complex.parent = ids[complex.parent] || complexIds[complex.parent] || complex.parent;
      // console.log("Complex parent", complex.newtId);
      for (let i = 0; i < epns.length; i++) {
        let epn = epns[i];
        // console.log("Epn", epn);
        if (epn.parent === complex.newtId) {
          children.push(stripComplexProps(epn));
          epns.splice(i, 1);
          i--;
        }
      }
      complex.children = children;
    }
  
    console.log("The new modified complexes after sanitization", JSON.parse(JSON.stringify(complexes)));
  
    // Build the query to call our stored procedure
    const data = {
      query: "CALL custom.pushComplexes($complexes, $epnCriteria, $complexThreshold, $epnThreshold) YIELD result RETURN result",
      queryData: {
        complexes: complexes,
        epnCriteria: epnCriterias,
        complexThreshold: complexThreshold/100,
        epnThreshold: epnThreshold/100,
      }
    };
  
    // let ids = {};
    try {
      const response = await $.ajax({
        type: "post",
        url: "/utilities/runDatabaseQuery",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(data)
      });
  
      const { records } = response;
      console.log(records);
      for (let record of records) {
        const map = record._fields[0];
        ids[map.incoming] = map.existing.complex;
  
        if (Array.isArray(map.existing.children)) {
          for (let child of map.existing.children) {
            if (typeof child === "object") {
              ids[child.incoming] = child.existing;
            } else {
              ids[child] = child;
            }
          }
        }
      }
      return ids;
    } catch (err) {
      console.error("Error running pushComplexes query", err);
      return {};
    }
  },

  pushLogicalNodesToDatabase: async function (logicals, ids) {
    // map parent first so matching is consistent
    const payload = logicals.map(l => {
      const n =Object.assign({}, l);
      n.parent = ids[n.parent] || n.parent || "none";
      return n;
    });

    const integrationQuery = `
      CALL custom.pushLogicalNodes($logicalNodes)
      YIELD result
      RETURN result
    `;

    const data = { query: integrationQuery, queryData: { logicalNodes: payload } };

    await $.ajax({
      type: "post",
      url: "/utilities/runDatabaseQuery",
      contentType: "application/json; charset=utf-8",
      data: JSON.stringify(data),
      success: function (response) {
        const { records } = response;
        for (const record of records) {
          const map = record._fields[0]; // {incoming, existing}
          ids[map.incoming] = map.existing || map.incoming;
        }
      },
      error: function (req, status, err) {
        errorCheck = { status, err };
        console.error("Error running query", status, err);
      }
    });

    return ids;
  },

  pushActiveNodesEdgesToDatabase: async function (nodesData, edgesData, flag) {
    if(flag === "REPLACE"){
      await this.cleanDatabase();
    }
    const {epnMatchingPercentage,processIncomingContribution,processOutgoingContribution,processAgentContribution,overallProcessPercentage,complexMatchPercentage} =databaseUtilities._getCurrentTabLocalDBMatchingOptions();
    console.log(epnMatchingPercentage,processIncomingContribution,processOutgoingContribution,processAgentContribution,overallProcessPercentage,complexMatchPercentage);
    console.log(nodesData, edgesData, flag);
    var epns = nodesData.filter((node) => node.category === "EPN" && node.class!=='complex' && node.class!=='complex_sbml');
    var complexes = nodesData.filter((node)=>node.class==='complex' || node.class==='complex_sbml');
  
    var tags = nodesData.filter((node)=>node.class==='tag');
    const compartments = nodesData.filter((node)=>node.class==='compartment');
    var compartmentIds = await this.pushCompartmentsToDatabase(compartments);
    var createdComplexesIds = await databaseUtilities.pushComplexesToDatabase(compartmentIds,complexes,epns,complexMatchPercentage/100);
    if(errorCheck!==null)return errorCheck;
    const submaps = nodesData.filter((node)=>node.class==='submap');
    const submapIds = await this.pushSubmapsToDatabase(createdComplexesIds,submaps);
    if(errorCheck!==null)return errorCheck;
    var processes = nodesData.filter((node) => node.category === "process");
    var logicals = nodesData.filter((node)=>node.category==='logical');
    const tag_ids = await databaseUtilities.pushEPNToLocalDatabase(
      submapIds,
      tags,
      epnMatchingPercentage
    );
    console.log("Pushing EPNs:", epns);
    const epn_ids = await databaseUtilities.pushEPNToLocalDatabase(
      tag_ids,
      epns,
      epnMatchingPercentage
    );

    if(errorCheck!==null)return errorCheck;
    const node_ids = await databaseUtilities.pushProcessToLocalDatabase(
      processes,
      epn_ids,
      processIncomingContribution,
      processOutgoingContribution,
      processAgentContribution,
      overallProcessPercentage
    );
    if(errorCheck!==null)return errorCheck;
    const logical_ids = await databaseUtilities.pushLogicalNodesToDatabase(logicals, node_ids);

    if(errorCheck!==null)return errorCheck;
    await databaseUtilities.pushEdgesToLocalDatabase(
      edgesData,
      logical_ids,
      false
    );
  },

  _dedupeEdgesByTriple: function(edges) {
    const seen = new Set();
    const out = [];
    for (const e of edges) {
      const key = `${e.source}|${e.class}|${e.target}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(e);
    }
    return out;
  },
  getNeighboringNodes: async function(nodeId, enableCloning, cloneThreshold) {
    console.log("DB nodes are:",databaseUtilities.nodesInDB);
    const query = `
      CALL custom.getNeighbors($id)
        YIELD node, rel
      RETURN node, rel
    `;
    const data = { query, queryData: { id: nodeId } };
    console.log(data);
    await $.ajax({
      type: "post",
      url: "/utilities/runDatabaseQuery",
      contentType: "application/json; charset=utf-8",
      data: JSON.stringify(data),
      success: async function(response) {
        console.log(response);
        const recs      = response.records;
        let nodesArr = [];
        let edgesArr = [];
        recs.forEach(r => {
          const node = r._fields[0];
          const rel  = r._fields[1];
          nodesArr.push(node);
          edgesArr.push(rel);
          });
        edgesArr = edgesArr.filter(edge=>edge!=null);
        const {nodes,edges} = await databaseUtilities.storeGraph(nodesArr, edgesArr);
        const {nodes: nodesArray, edges: edgesArray,originalsToMark} = databaseUtilities.cloneSimpleChemicals(Object.values(nodes), Object.values(edges), enableCloning, cloneThreshold);
        nodesArr = await databaseUtilities.deduplicateExistingNodes(nodesArray);
        edgesArr = await databaseUtilities.deduplicateExistingEdges(edgesArray);
        await databaseUtilities.batchAddNodesEdgesToCy(nodesArr, edgesArr,originalsToMark);
        const emptyCanvas = await databaseUtilities.canvasEmpty();
        databaseUtilities.performLayout(emptyCanvas);
        databaseUtilities.updateDBMaps(nodes, edges);
      },
      error: (req, status, err) =>
        console.error("Error running getNeighbors", status, err)
    });
  },

  convertLabelToClass: function (label) {
    var repl = label.replaceAll("_", " ");
    return repl;
  },

  getNodesRecursively: async function (nodesToAdd) {
    
    return new Promise(async function (resolve, reject) {
      var parentsToGet = new Set();
      var children = [];
      for (let i = 0; i < nodesToAdd.length; i++) {
        if (
          nodesToAdd[i].properties.parent &&
          nodesToAdd[i].properties.parent != "none"
        ) {
          parentsToGet.add(nodesToAdd[i].properties.parent);
          children.push(nodesToAdd[i]);
        } else {
          await databaseUtilities.pushNode(nodesToAdd[i]);
        }
      }

      parentsToGet = [...parentsToGet];

      var queryData = { parentsToGet: parentsToGet };

      var query = `UNWIND $parentsToGet as parent
                  MATCH (u)
                  WHERE u.newtId = parent
                  RETURN u`;
      var data = { query: query, queryData: queryData };

      $.ajax({
        type: "post",
        url: "/utilities/runDatabaseQuery",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(data),
        success: async function (data) {
          if (data.records.length == 0) {
            resolve();
          }
          let counter = 0;
          for (let i = 0; i < data.records.length; i++) {
            var fields = data.records[i]._fields;
            var parents = [];
            parents.push(fields[0]);
            await databaseUtilities.getNodesRecursively(parents).then(() => {
              counter++;
              if (counter == data.records.length) {
                for (let i = 0; i < children.length; i++) {
                  databaseUtilities.pushNode(children[i]);
                }
                resolve();
              }
            });
          }
        },
        error: function (req, status, err) {
          console.error("Error running query", status, err);
        },
      });
    });
  },

  pushNode: function (new_node,x=0,y=0) {
    console.log("new_node:",new_node);
    return new Promise((resolve) => {
      const tabKey = databaseUtilities._currentActiveNetworkID();
      if (!(new_node.properties.newtId in databaseUtilities.nodesInDB[tabKey])) {
        var chiseInstance = appUtilities.getActiveChiseInstance();
        var nodeParams = {
          class: databaseUtilities.convertLabelToClass(
            new_node.properties.class
          ),
          language: "PD",
          label: "smth",
        };
        var node = chiseInstance.addNode(
          x,
          y,
          nodeParams,
          new_node.properties.newtId,
          new_node.properties.parent
        );

        chiseInstance.setMultimerStatus(node,new_node.properties.multimer);
        chiseInstance.setCloneMarkerStatus(node, new_node.properties.cloneMarker);

        if (new_node.properties.entityName) {
          chiseInstance.changeNodeLabel(node, new_node.properties.entityName);
        }

        if(new_node.properties.stateVariables && new_node.properties.stateVariables.length>0){
          for(let i=0;i<new_node.properties.stateVariables.length;i++){
            var obj = appUtilities.getDefaultEmptyInfoboxObj( 'state variable' );
            // console.log("adding state variable:",new_node.properties.stateVariables[i]);
            chiseInstance.addStateOrInfoBox(node, obj);
            const [value, variable] = new_node.properties.stateVariables[i].split("@");
            chiseInstance.changeStateOrInfoBox(node, i, value,"value");
            chiseInstance.changeStateOrInfoBox(node, i, variable,"variable");
          }
        }

        // ✅ Set unitsOfInformation as a Cytoscape data field
        if (new_node.properties.unitsOfInformation && new_node.properties.unitsOfInformation.length > 0) {
          for(let i=0;i<new_node.properties.unitsOfInformation.length;i++){
            // console.log("unit of information",new_node.properties.unitsOfInformation[i]);
            var uoi_obj = appUtilities.getDefaultEmptyInfoboxObj( 'unit of information' );
            chiseInstance.addStateOrInfoBox(node, uoi_obj);
        //     console.log("unit of information:",new_node.properties.unitsOfInformation[i]);
            chiseInstance.changeStateOrInfoBox(node, new_node.properties.stateVariables.length + i, new_node.properties.unitsOfInformation[i],"value");
          }
        }

        // databaseUtilities.nodesInDB[new_node.properties.newtId] =
        //   new_node.identity.low;
        // var el = cy.getElementById(new_node.properties.newtId);
        // var vu = cy.viewUtilities("get");
        // vu.highlight(el, 3);
      }
      resolve();
    });
  },

  //Queries
  getIdOfLabeledNodes: async function (labelOfNodes, idOfNodes, newtIdOfNodes) {
    console.log(labelOfNodes, idOfNodes)
    var query = `UNWIND $labelOfNodes as label
                   MATCH (u)
                   WHERE u.entityName = label
                   RETURN elementId(u), u.newtId`;
    var queryData = { labelOfNodes: labelOfNodes };

    var data = { query: query, queryData: queryData };
    await $.ajax({
      type: "post",
      url: "/utilities/runDatabaseQuery",
      contentType: "application/json; charset=utf-8",
      data: JSON.stringify(data),
      success: function (data) {
        for (var i = 0; i < data.records.length; i++) {
          idOfNodes.push(data.records[i]._fields[0]);
          if(newtIdOfNodes)newtIdOfNodes.push(data.records[i]._fields[1]);
        }
      },
      error: function (req, status, err) {
        console.error("Error running query", status, err);
      },
    });
  },

  batchAddNodesEdgesToCy: async function (nodes, edges, originalsToMark=[]) {
    var chiseInstance = appUtilities.getActiveChiseInstance();
    const emptyCanvas = await databaseUtilities.canvasEmpty();
    await chiseInstance.addNodesEdges(nodes,edges,false).then(async function(){
      $("#map-color-scheme_opposed_red_blue").click();  
      $("#color-scheme-inspector-style-select").val("3D");
      $("#color-scheme-inspector-style-select").change();
      databaseUtilities.performLayout(emptyCanvas);

      //Mark originals elements as cloned
      console.log('the originals:',originalsToMark);
      var cy = appUtilities.getActiveCy();
      for (var mi = 0; mi < originalsToMark.length; mi++) {
        var id = originalsToMark[mi];
        // This only works if cytoscape node id == newtId
        var col = cy.getElementById(id);
        if (col && col.length) {
          chiseInstance.setCloneMarkerStatus(col[0], true);
        }
      }

    });
  },

  addNodesEdgesToCy: async function (nodes, edges=[], source, target) {
    console.log("Edges in here:",edges);
    
    return new Promise((resolve) => {
      var chiseInstance = appUtilities.getActiveChiseInstance();
      let nodesToHighlight = [];
      let edgesToHighlight = [];
      let edgesToAdd = [];
      let nodesToAdd = [];
      databaseUtilities.updateDBMaps([],[]);
      // databaseUtilities.nodesInDB = {};
      const emptyCanvas = databaseUtilities.canvasEmpty();
      // databaseUtilities.edgesInDB = {};
      const tabKey = databaseUtilities._currentActiveNetworkID();
      for (let i = 0; i < nodes.length; i++) {
        if (!databaseUtilities.nodesInDB[tabKey][nodes[i].properties.newtId]) {
          nodesToAdd.push(nodes[i]);
        }
        nodesToHighlight.push(nodes[i]);
      }
      

      for (let j = 0; j < edges.length; j++) {
        //Check if edge already exists in map
        if (
          !databaseUtilities.edgesInDB[tabKey][
            [
              edges[j].properties.source,
              edges[j].properties.target,
              edges[j].properties.class,
            ].join("|")
          ]
        ) {
          edgesToAdd.push(edges[j]);
          databaseUtilities.edgesInDB[tabKey][
            [
              edges[j].properties.source,
              edges[j].properties.target,
              edges[j].properties.class,
            ].join("|")
          ] = [
              edges[j].properties.source,
              edges[j].properties.target,
              edges[j].properties.class,
            ].join("|");
        }
        edgesToHighlight.push(edges[j]);
      }
      console.log("edges to Add",edgesToAdd);
      databaseUtilities
        .getNodesRecursively(nodesToAdd)
        .then(async function () {
          return databaseUtilities.pushEdges(edgesToAdd);
        })
        .then(function () {
          //Add color scheme for map
          // $("#map-color-scheme_greyscale").click();
          $("#map-color-scheme_opposed_red_blue").click();
          $("#color-scheme-inspector-style-select").val("3D");
          $("#color-scheme-inspector-style-select").change();

          //Add highlights
          if (source != null) {
            for (let i = 0; i < source.length; i++) {
              var cy = appUtilities.getActiveCy();
              var el = cy.getElementById(source[i]);
              var vu = cy.viewUtilities("get");
              vu.highlight(el, 3);
            }
          }

          if (target != null) {
            for (let i = 0; i < target.length; i++) {
              var cy = appUtilities.getActiveCy();
              var el = cy.getElementById(target[i]);
              var vu = cy.viewUtilities("get");
              vu.highlight(el, 3);
            }
          }
          var cy = appUtilities.getActiveCy();
          databaseUtilities.performLayout(emptyCanvas);

          resolve({
            nodesToHighlight: nodesToHighlight,
            edgesToHighlight: edgesToHighlight,
          });
        });
    });
  },

  validateEdges: async function (edges) {
    var chiseInstance = appUtilities.getActiveChiseInstance();
    const validityChecks = await Promise.all(
    edges.map(async (edge) => {
      return chiseInstance.validateArrowEnds(
          databaseUtilities.convertLabelToClass(edge.class),
          edge.source,
          edge.target,
      )==="valid";
      })
    );
    return await Promise.all(edges.filter((_, idx) => validityChecks[idx]));
  },
  pushEdges: async function (edgesToAdd) {
    return new Promise((resolve) => {
      var chiseInstance = appUtilities.getActiveChiseInstance();
      for (let i = 0; i < edgesToAdd.length; i++) {
        const notAllowedEdges = 
          edgesToAdd[i].properties.class === "belongs_to_submap" || 
          edgesToAdd[i].properties.class === "belongs_to_compartment" ||
          edgesToAdd[i].properties.class === "belongs_to_complex";
        if (!notAllowedEdges && edgesToAdd[i].properties.source && edgesToAdd[i].properties.target && edgesToAdd[i].properties.class) {            
          // console.log(edgesToAdd[i],edgesToAdd[i].properties,edgesToAdd[i].properties.class)
          var new_edge = chiseInstance.addEdge(
            edgesToAdd[i].properties.source,
            edgesToAdd[i].properties.target,
            databaseUtilities.convertLabelToClass(edgesToAdd[i].properties.class),
            undefined,
            undefined
          );
        }
      }
      resolve();
    });
  },

  performLayout: async function (static=false) {
    const cy = appUtilities.getActiveCy();
    await appUtilities.waitForCyReady(cy);
    appUtilities.triggerLayout(cy, false,static,static);
  },

  runPathsFromTo: async function (sourceArray, targetArray, limit,enableCloning,cloneThreshold) {
    var sourceId = [];
    var sourceNewt = [];
    await databaseUtilities.getIdOfLabeledNodes(
      sourceArray,
      sourceId,
      sourceNewt
    );

    var targetId = [];
    var targetNewt = [];
    await databaseUtilities.getIdOfLabeledNodes(
      targetArray,
      targetId,
      targetNewt
    );
    sourceId = sourceId.map((id) => parseInt(id.split(":")[2]));
    targetId = targetId.map((id) => parseInt(id.split(":")[2]));
    console.log("sourceId:", sourceId, "targetId:", targetId);
    var err=null;
    if (sourceId.length == 0 && targetId > 0) {
      var errMessage = {
        err: "Invalid input",
        message: "No such source nodes",
      };
      return errMessage;
    }
    if (sourceId.length > 0 && targetId.length == 0) {
      var errMessage = {
        err: "Invalid input",
        message: "No such target nodes",
      };
      return errMessage;
    }
    if (sourceId.length == 0 && targetId.length == 0) {
      var errMessage = {
        err: "Invalid input",
        message: "No such source and target nodes",
      };
      return errMessage;
    }
    // query = graphALgos.pathsFromTo(limit,enableCloning?cloneThreshold:1000000);
    query = `
      CALL pathsFromTo($idList, $limit, $simpleChemicalDegreeThreshold)
      YIELD nodes, relationships, language
      RETURN nodes, relationships, language
    `;

    var idList = [...new Set([...sourceId, ...targetId])];
    var queryData = { idList: idList, limit: limit, simpleChemicalDegreeThreshold: 1000000 };

    console.log("queryData:", queryData);
    var data = { query: query, queryData: queryData };
    var result = null 
    try{
      result = await $.ajax({
        type: "post",
        url: "/utilities/runDatabaseQuery",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(data),
      });
    }
    catch (err) {
      console.error("Error running query",err);
    }

    if (!result || !result.records || result.records.length == 0 || result.records[0]._fields[0].length == 0) {
      result = result || {};
      result.err = { err: "Invalid input", message: "No data returned" };
      err = result.err;
      return err;
    }
    var nodes = [];
    var edges = [];
    var nodesSet = new Set();
    var edgesMap = new Map();
    var records = result.records;
    var language = records[0]._fields[2];
    for (let i = 0; i < records.length; i++) {
      var fields = records[i]._fields;
      for (let j = 0; j < fields[0].length; j++) {
        if (!nodesSet.has(fields[0][j].properties.newtId)) {
          nodes.push(fields[0][j]);
          nodesSet.add(fields[0][j].properties.newtId);
        }
      }

      for (let j = 0; j < fields[1].length; j++) {
        if (
          !edgesMap.get(fields[1][j].properties.source) ||
          !edgesMap.get(fields[1][j].properties.source).has(fields[1][j].properties.target)
        ) {
          var edge = {};
          edge.properties = {};
          edge.identity = {};
          edge.properties.source = fields[1][j].properties.source;
          edge.properties.target = fields[1][j].properties.target;
          edge.properties.class = fields[1][j].properties.class;
          edge.identity.low = fields[1][j].identity.low;
          edges.push(edge);
          if (!edgesMap.get(fields[1][j].properties.source)) {
            var newSet = new Set();
            edgesMap.set(fields[1][j].properties.source, newSet);
          }
          edgesMap.get(fields[1][j].properties.source).add(fields[1][j].properties.target);
        }
      }
    }
    const {nodes: nodesArray, edges: edgesArray} = databaseUtilities.cloneSimpleChemicals(nodes, edges, enableCloning, cloneThreshold);
    appUtilities.getActiveChiseInstance().elementUtilities.setMapType(language);
    var cy = appUtilities.getActiveCy();
    cy.elements().remove();
    databaseUtilities.cleanNodesAndEdgesInDB();
    databaseUtilities.addNodesEdgesToCy(
      nodesArray,
      edgesArray,
      sourceNewt,
      targetNewt
    );
  },

  runPathBetween: async function (labelOfNodes, lengthLimit,enableCloning,cloneThreshold) {
    var idOfNodes = [],newtIdOfNodes = [];
    await databaseUtilities.getIdOfLabeledNodes(
      labelOfNodes,
      idOfNodes,
      newtIdOfNodes
    );
    idOfNodes = idOfNodes.map((id) => parseInt(id.split(":")[2]));

    console.log("idOfNodes:", idOfNodes);
    //Check if label of nodes are valid
    if (idOfNodes.length == 0) {
      var errMessage = {
        err: "Invalid input",
        message: "No such nodes with given symbol",
      };
      return errMessage;
    }

    var query = `
      CALL pathsBetween($idList, $lengthLimit, $simpleChemDegreeThreshold)
      YIELD nodes, relationships, language
      RETURN nodes, relationships, language
    `;
    var queryData = { idList: idOfNodes, lengthLimit: lengthLimit, simpleChemDegreeThreshold:  1000000 };

    var data = { query: query, queryData: queryData };
    console.log("data being sent:", data);
    console.log(query);
    var result = {};
    result.highlight = {};
    result.add = {};
    var output = null;
    try {
      output = await $.ajax({
        type: "post",
        url: "/utilities/runDatabaseQuery",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(data)
      });
    } catch (error) {
      console.error("Error running query", error);
    }
    console.log("output:", output);
    if (!output || !output.records || output.records[0].length == 0 || output.records[0]._fields[0].length == 0) {
      result.err = { err: "Invalid input", message: "No data returned" };
      err = result.err;
      return err;
    }

    console.log("returned data:", data);
    var nodes = [];
    var edges = [];
    var nodesSet = new Set();
    var edgesMap = new Map();
    var records = output.records;
    var language = records[0]._fields[2];
    appUtilities.getActiveChiseInstance().elementUtilities.setMapType(language);
    for (let i = 0; i < records.length; i++) {
      var fields = records[i]._fields;
      for (let j = 0; j < fields[0].length; j++) {
        if (!nodesSet.has(fields[0][j].properties.newtId)) {
          nodes.push(fields[0][j]);
          nodesSet.add(fields[0][j].properties.newtId);
        }
      }

      for (let j = 0; j < fields[1].length; j++) {
        if (
          !edgesMap.get(fields[1][j].properties.source) ||
          !edgesMap
            .get(fields[1][j].properties.source)
            .has(fields[1][j].properties.target)
        ) {
          var edge = {};
          edge.properties = {};
          edge.identity = {};
          edge.properties.source = fields[1][j].properties.source;
          edge.properties.target = fields[1][j].properties.target;
          edge.properties.class = fields[1][j].properties.class;
          edge.identity.low = fields[1][j].identity.low;
          edges.push(edge);
          if (!edgesMap.get(fields[1][j].properties.source)) {
            var newSet = new Set();
            edgesMap.set(fields[1][j].properties.source, newSet);
          }
          edgesMap
            .get(fields[1][j].properties.source)
            .add(fields[1][j].properties.target);
        }
      }
    }
    console.log("data:", nodes, edges, newtIdOfNodes,language);
    const {nodes: nodesArray, edges: edgesArray}= databaseUtilities.cloneSimpleChemicals(nodes, edges, enableCloning, cloneThreshold);
    var cy = appUtilities.getActiveCy();
    cy.elements().remove();
    databaseUtilities.cleanNodesAndEdgesInDB();
    const abc = await databaseUtilities.addNodesEdgesToCy(nodesArray, edgesArray, newtIdOfNodes);
    console.log("abc:", abc);
    return null;
  },
  runNeighborhood: async function (labelOfNodes, lengthLimit,enableCloning,cloneThreshold) {
    var idList = [];
    var newtIdList = [];
    await databaseUtilities.getIdOfLabeledNodes(
      labelOfNodes,
      idList,
      newtIdList
    );
    idList = idList.map((id)=>Number.parseInt(id.split(":")[2]));
    var setOfSources = new Set(newtIdList);
    console.log("idList:", idList, "newtIdList:", newtIdList);
    if (idList.length == 0) {
      var errMessage = {
        err: "Invalid input",
        message: "No such nodes with given symbol",
      };
      return errMessage;
    }

  var query = `
    CALL neighborhoodFromIds($idList, $limit, $simpleChemicalDegreeThreshold)
    YIELD nodes, relationships, language
    RETURN nodes, relationships, language
  `;
  var queryData = { idList: idList, limit: lengthLimit, simpleChemicalDegreeThreshold: 1000000 };

  var data = { query: query, queryData: queryData };
  var result = {};
  result.highlight = {};
  result.add = {};

  await $.ajax({
    type: "post",
    url: "/utilities/runDatabaseQuery",
    contentType: "application/json; charset=utf-8",
    data: JSON.stringify(data),
    success: async function (data) {
      console.log("data being returned:", data);
      console.log("data:", data);
      if (data.records.length == 0) {
        result.err = {
          err: "Invalid input",
          message: "No such nodes with given symbol",
        };
        return;
      }

      var nodes = [];
      var edges = [];
      var targetNodes = [];
      var nodesSet = new Set();
      var edgesMap = new Map();
      var records = data.records;
      var language = records[0]._fields[2];
      for (let i = 0; i < records.length; i++) {
        var fields = records[i]._fields;
        for (let j = 0; j < fields[0].length; j++) {
          if (!nodesSet.has(fields[0][j].properties.newtId)) {
            nodes.push(fields[0][j]);
            nodesSet.add(fields[0][j].properties.newtId);
            if (
              !setOfSources.has(fields[0][j].properties.newtId) &&
              !fields[0][j].properties.class.startsWith("process")
            ) {
              targetNodes.push(fields[0][j].properties.newtId);
            }
          }
        }

        for (let j = 0; j < fields[1].length; j++) {
          if (
            !edgesMap.get(fields[1][j].properties.source) ||
            !edgesMap
              .get(fields[1][j].properties.source)
              .has(fields[1][j].properties.target)
          ) {
            if(fields[1][j].type.startsWith("belongs_to"))continue;
            var edge = {};
            edge.properties = {};
            edge.identity = {};
            edge.properties.source = fields[1][j].properties.source;
            edge.properties.target = fields[1][j].properties.target;
            edge.properties.class = fields[1][j].properties.class;
            edge.identity.low = fields[1][j].identity.low;
            edges.push(edge);
            if (!edgesMap.get(fields[1][j].properties.source)) {
              var newSet = new Set();
              edgesMap.set(fields[1][j].properties.source, newSet);
            }
            edgesMap
              .get(fields[1][j].properties.source)
              .add(fields[1][j].properties.target);
          }
        }
      }

      const { nodes: nodesArray, edges: edgesArray, originalsToMark } = databaseUtilities.cloneSimpleChemicals(nodes, edges, enableCloning, cloneThreshold);
      const deduplicatedNodes = await databaseUtilities.deduplicateExistingNodes(nodesArray);
      const deduplicatedEdges = await databaseUtilities.deduplicateExistingEdges(edgesArray);
      appUtilities.getActiveChiseInstance().elementUtilities.setMapType(language);
      var cy = appUtilities.getActiveCy();
      cy.elements().remove();
      await databaseUtilities.batchAddNodesEdgesToCy(deduplicatedNodes, deduplicatedEdges, originalsToMark);
    },
    error: function (req, status, err) {
      console.error("Error running query", status, err);
    },
  });

  return result;
},

  runCommonStream: async function (labelOfNodes, lengthLimit, direction,enableCloning,cloneThreshold) {
    var idOfNodes = [];
    console.log("labelOfNodes:", labelOfNodes, "lengthLimit:", lengthLimit, "direction:", direction);
    await databaseUtilities.getIdOfLabeledNodes(labelOfNodes, idOfNodes);
    if (idOfNodes.length == 0) {
      var errMessage = {
        err: "Invalid input",
        message: "No such nodes with given symbol",
      };
      return errMessage;
    }
    var query = "";
    if (direction == -1) {
      query = graphALgos.commonStream(idOfNodes, lengthLimit);
    } else if (direction == 1) {
      query = graphALgos.upstream(idOfNodes, lengthLimit);
    } else {
      query = graphALgos.downstream(idOfNodes, lengthLimit);
    }
    console.log("query:", query);
    var data = { query: query, queryData: null };
    var result = {};
    result.highlight = {};
    result.add = {};
    var output = null;
    try {
      output = await $.ajax({
        type: "post",
        url: "/utilities/runDatabaseQuery",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(data),
      });
    } catch (err) {
      console.error("Error running query",err);
    }
    console.log("data:", output);
    if (!output || !output.records || output.records.length == 0) {
      result.err = { err: "Warning", message: "No results found!" };
      return;
    }
    var nodes = [];
    var edges = [];
    var records = output.records;
    for (let i = 0; i < records.length; i++) {
      var fields = records[i]._fields;
      for (let j = 0; j < fields[1].length; j++) {
        nodes.push(fields[1][j]);
      }
      for (let j = 0; j < fields[5].length; j++) {
        const edgeClass = fields[5][j].properties.class;
        if(!edgeClass || edgeClass.startsWith("belongs_to_")){
          continue; // Skip edges that are not relevant
        }
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
    console.log("nodes:", nodes, "edges:", edges);
    const { nodes: nodesArray, edges: edgesArray,originalsToMark } = databaseUtilities.cloneSimpleChemicals(nodes, edges, enableCloning, cloneThreshold);
    const deduplicatedNodes = await databaseUtilities.deduplicateExistingNodes(nodesArray);
    const deduplicateEdges = await databaseUtilities.deduplicateExistingEdges(edgesArray);
    console.log("nodes:", nodesArray, "edges:", edgesArray);
    appUtilities.getActiveChiseInstance().elementUtilities.setMapType(await databaseUtilities.getLanguage(output));
    // Clean the canvas
    var cy = appUtilities.getActiveCy();
    cy.elements().remove();
    databaseUtilities.cleanNodesAndEdgesInDB();
    await databaseUtilities.addNodesEdgesToCy(nodesArray,edgesArray);
    return result;
  },

  getLanguage: async function (output) {
    const nodes      = [];
    const edges      = [];
    const languages  = new Set();                    // <‑‑ language aggregator

    output.records.forEach(rec => {
      const nodeField = rec._fields[1];              // nodes list
      const edgeField = rec._fields[5];              // relationships list

      /* ---- nodes ---- */
      nodeField.forEach(n => {
        nodes.push(n);
        if (n.properties && n.properties.language) {
          languages.add(n.properties.language);      // collect language
        }
      });

      /* ---- edges ---- */
      edgeField.forEach(e => {
        const edgeClass = e.properties.class;
        if (!edgeClass || edgeClass.startsWith("belongs_to_")) return; // skip bookkeeping edges

        edges.push({
          identity   : { low : e.identity.low },
          properties : {
            source : e.properties.source,
            target : e.properties.target,
            class  : edgeClass
          }
        });
      });
    });
    if (languages.size === 1) return Array.from(languages)[0]; // single language
    return "HybridAny"; // mixed languages or no languages found
  },

  getAllNodeCount: async function () {
    var query = `CALL custom.countNodeAndEdgeClasses()`; // updated procedure
    var data = { query: query, queryData: {} };
    var result = [];
  
    await $.ajax({
      type: "post",
      url: "/utilities/runDatabaseQuery",
      contentType: "application/json; charset=utf-8",
      data: JSON.stringify(data),
      success: function (data) {
        if (data.records.length == 0) {
          result.err = { err: "Invalid input", message: "No data returned" };
          return;
        }
  
        const { records } = data;
        for (let i = 0; i < records.length; i++) {
          const fields = records[i]._fields;
          const classType = fields[0];
          const count = fields[1].low;
          const entryType = fields[2]; // 'node' or 'edge'
          if(!(classType == "belongs_to_submap" || classType == "belongs_to_compartment" || classType == "belongs_to_complex")){
            result.push({ class: classType, count: count, type: entryType });
          }
        }
      },
      error: function (req, status, err) {
        console.error("Error running query", status, err);
      },
    });
  
    return result;
  },


  cloneSimpleChemicals: function(nodesArray, edgesArray, enableCloning, cloneThreshold) {
    if (nodesArray === undefined || edgesArray === undefined || nodesArray === null || edgesArray === null) {
      return { nodes: [], edges: [], originalsToMark: [] }; // CHANGED
    }

    // defaults
    nodesArray = nodesArray || [];
    edgesArray = edgesArray || [];
    enableCloning = !!enableCloning;
    cloneThreshold = cloneThreshold || 0;

    var nodes = [];
    var edges = [];
    var nodesSet = new Set();
    var edgesMap = new Map();
    var simpleChemMap = new Map();

    var originalsToMark = [];

    // 1) Separate out simple_chemical nodes
    for (var i = 0; i < nodesArray.length; i++) {
      var n = nodesArray[i];
      if (n && n.properties && n.properties.class === "simple_chemical") {
        simpleChemMap.set(n.properties.newtId, n);
      } else {
        if (n && n.properties && n.properties.newtId && !nodesSet.has(n.properties.newtId)) {
          nodes.push(n);
          nodesSet.add(n.properties.newtId);
        }
      }
    }

    // 2) Pre-count arcs for simple chemicals
    var arcCounts = {};
    if (enableCloning) {
      for (var ei = 0; ei < edgesArray.length; ei++) {
        var e = edgesArray[ei];
        var p = e && e.properties ? e.properties : null;
        if (!p) continue;

        var sId = p.source;
        var tId = p.target;

        if (simpleChemMap.has(sId)) arcCounts[sId] = (arcCounts[sId] || 0) + 1;
        if (simpleChemMap.has(tId)) arcCounts[tId] = (arcCounts[tId] || 0) + 1;
      }
    }
    // 3) Always add originals exactly once (so original is part of final count)
    simpleChemMap.forEach(function(orig, id) {
      if (!nodesSet.has(id)) {
        
        var eligible = enableCloning && ((arcCounts[id] || 0) >= cloneThreshold);
        // keep your optional info
        if (orig && orig.properties) {
          orig.properties.cloneEligible = eligible;
          orig.properties.cloneMarker = false;
        }

        if (eligible) {
          originalsToMark.push(id);
        }
        nodes.push(orig);
        nodesSet.add(id);
      }
    });

    // 4) Clone per-usage: first usage keeps original, later usages get clones
    var useCount = {};

    for (var j = 0; j < edgesArray.length; j++) {
      var e2 = edgesArray[j];
      var p0 = e2 && e2.properties ? e2.properties : null;
      if (!p0) continue;

      var raw = {};
      for (var k in p0) {
        if (Object.prototype.hasOwnProperty.call(p0, k)) raw[k] = p0[k];
      }

      if (enableCloning) {
        var ends = ["source", "target"];
        for (var ei2 = 0; ei2 < ends.length; ei2++) {
          var end = ends[ei2];
          var id2 = raw[end];

          var degree = arcCounts[id2] || 0;
          var shouldClone = simpleChemMap.has(id2) && (degree >= cloneThreshold);
          if (!shouldClone) continue;

          useCount[id2] = (useCount[id2] || 0) + 1;

          // First time: keep original id
          if (useCount[id2] === 1) continue;

          // Next times: clone
          var orig2 = simpleChemMap.get(id2);
          var clone = JSON.parse(JSON.stringify(orig2));

          if (!clone.properties) clone.properties = {};
          clone.properties.newtId = orig2.properties.newtId + "_clone_" + (useCount[id2] - 1) + "_" + j + "_" + end;
          clone.properties.cloneMarker = true;
          clone.properties.cloneEligible = true;

          if (!nodesSet.has(clone.properties.newtId)) {
            nodes.push(clone);
            nodesSet.add(clone.properties.newtId);
          }

          raw[end] = clone.properties.newtId;
        }
      }

      edges.push({
        properties: {
          source: raw.source,
          target: raw.target,
          class: raw.class
        }
      });

      if (!edgesMap.has(raw.source)) edgesMap.set(raw.source, new Set());
      edgesMap.get(raw.source).add(raw.target);
    }

    return { nodes: nodes, edges: edges, originalsToMark: originalsToMark };
  },

    

  getAllNodesAndEdgesFromDatabase: async function(enableCloning = false, cloneThreshold = 0) {
    console.log("Fetching all nodes and edges from the database...", enableCloning, cloneThreshold);
  
    // 1) Fetch everything
    const query = `
      MATCH (n)
      OPTIONAL MATCH (n)-[r]->(m)
        WHERE NOT type(r) STARTS WITH 'belongs_to_'
      WITH
        collect(DISTINCT n)            AS nodes,
        collect(DISTINCT r)            AS edges,          // ← comma here
        collect(DISTINCT n.language)   AS languages
      RETURN
        nodes,                                           // ← nodes, not node
        edges,
        CASE
          WHEN size(languages) > 1 THEN 'HybridAny'
          ELSE head(languages)
        END AS language
    `;
    const data = { query, queryData: {} };
  
    await $.ajax({
      type: "post",
      url: "/utilities/runDatabaseQuery",
      contentType: "application/json; charset=utf-8",
      data: JSON.stringify(data),
      success: async (response) => {
        if (!response.records.length) return console.log("No data returned");
        var cy = appUtilities.getActiveCy();
        // 2) Unpack
        console.log(response.records);
        const [ nodesArray, edgesArray,language ] = response.records[0]._fields;
        const {nodes, edges, originalsToMark } = databaseUtilities.cloneSimpleChemicals(nodesArray, edgesArray, enableCloning, cloneThreshold);
        console.log("Unpacked nodes and edges:", nodes, edges,originalsToMark);
        // 7) Render in Cytoscape
        // await appUtilities.createNewNetwork();
        // let chiseInstance = appUtilities.getActiveChiseInstance();
        // chiseInstance.elementUtilities.setMapType(language);
        const deduplicatedNodes = await databaseUtilities.deduplicateExistingNodes(nodes);
        const deduplicatedEdges = await databaseUtilities.deduplicateExistingEdges(edges);
        await databaseUtilities.batchAddNodesEdgesToCy(deduplicatedNodes, deduplicatedEdges, originalsToMark);
      },
      error: (req, status, err) => {
        console.error("Error fetching nodes/edges:", status, err);
      }
    });
  },

  deduplicateExistingNodes:async function(nodes) {
    const filteredNodes = [];
    for(let i=0;i<nodes.length;i++){
      let node = nodes[i];
      filteredNodes.push(node);
    }
    return filteredNodes;
  },
  deduplicateExistingEdges :async function(edges) {
    const cyInstance = appUtilities.getActiveCy();
    const canvasEdges = cyInstance.edges();
    if(canvasEdges.length===0)return edges;
    const filteredEdges = [];
    
    if(canvasEdges.length>0){
      for(let i=0;i<edges.length;i++){
        let exists=false;
        let edge = edges[i];
        let edgeKey =  [
              edge.properties.source,
              edge.properties.target,
              edge.properties.class,
            ].join("|");
        for(let j=0;j<canvasEdges.length;j++){
          let canvasEdge = canvasEdges[j].data();
          const canvasEdgekey = [canvasEdge.source,
                  canvasEdge.target,
                  canvasEdge.class.split(' ').join('_'),
                ].join("|");
          if(edgeKey===canvasEdgekey){
            exists=true;
            break;
          }
        }
        if(!exists){
          filteredEdges.push(edge);
        }
      }
    }
    return filteredEdges;
  },

  canvasEmpty: async function() {
    const cyInstance = appUtilities.getActiveCy();
    return cyInstance.nodes().length === 0;
  },
};
module.exports = databaseUtilities;
