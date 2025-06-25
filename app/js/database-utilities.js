var nodeMatchUtilities = require("./node-match-utilities");
var graphALgos = require("./graph-algos");
var appUtilities = require("./app-utilities");
const { merge, cleanData } = require("jquery");
const { handleSBGNInspector } = require("./inspector-utilities");
const { LayoutPropertiesView } = require("./backbone-views");

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
    multimer:{
      contribution:0.0,
      type:"boolean"
    },
    stateVariables:{
      contribution:0,
      type:"array"
    },
    unitsOfInformation:{
      contribution:0,
      type:"array"
    },
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
var databaseUtilities = {
  enableDatabase: true,
  nodesInDB: {},
  edgesInDB: {},

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

  processPdEdge: function (data) {
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
      if (data.language == "AF") {
        databaseUtilities.processAFNode(currentNode, data);
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
      edgesData.push(processed);
    }
  },

  pushActiveContentToDatabase: async function (activeTabContent, flag) {
    var nodes = [];
    var edges = [];
    await databaseUtilities.processNodesData(nodes, activeTabContent);
    await databaseUtilities.processEdgesData(edges, activeTabContent);
    console.log('UnProcessed data:',nodes,edges);
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
      if (
        databaseUtilities.edgesInDB[
          [edgesData[i].source, edgesData[i].target, edgesData[i].class]
        ]
      ) {
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
        edgesData[i].class != "belongs_to_compartment" &&
        edgesData[i].class != "belongs_to_submap" &&
        edgesData[i].class != "belongs_to_complex"
      ) {
        console.log(edgesData[i])
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
    // var filtered_list = await databaseUtilities.validateEdges(list);
    var filtered_list = list;
    filtered_list = await Promise.all(filtered_list.map((edge) => {
      edge.source = ids[edge.source];
      edge.target = ids[edge.target];
      return edge;
    }));

    
    console.log("list after",filtered_list);
    const query = `
    UNWIND $edges AS edge
    MATCH (sourceNode {newtId: edge.source}), (targetNode {newtId: edge.target})
    CALL apoc.do.when(
      EXISTS {
        MATCH (sourceNode)-[r]->(targetNode)
        WHERE type(r) = edge.class
      },
      'RETURN null',
      'CALL apoc.create.relationship(sourceNode, edge.class, edge, targetNode) YIELD rel RETURN rel',
      {sourceNode: sourceNode, targetNode: targetNode, edge: edge}
    ) YIELD value
    RETURN value;
    `;
   
    var data = { query, queryData: { edges: filtered_list } };
    await $.ajax({
      type: "post",
      url: "/utilities/runDatabaseQuery",
      contentType: "application/json; charset=utf-8",
      data: JSON.stringify(data),
      success: function (response) {
        console.log(response);
        const {records}=response;
        for(let record of records){
          const map = record._fields[0];
          ids[map.incoming]=map.existing;
        }
      },
      error: function (req, status, err) {
        errorCheck = {status,err}
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
    for (let complex of complexes) {
      let children = [];
      complex.parent = ids[complex.parent] || complexIds[complex.parent] || complex.parent;
      for (let i = 0; i < epns.length; i++) {
        let epn = epns[i];
        if (epn.parent === complex.newtId) {
          children.push(stripComplexProps(epn));
          epns.splice(i, 1);
          i--;
        }
      }
      complex.children = children;
    }
  
    console.log("The new modified complexes after sanitization", complexes);
  
    // Build the query to call our stored procedure
    const data = {
      query: "CALL custom.pushComplexes($complexes, $epnCriteria, $threshold) YIELD result RETURN result",
      queryData: {
        complexes: complexes,
        epnCriteria: epnCriterias,
        threshold: threshold,
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

  pushLogicalsToLocalDatabase: async function (list, ids,edges) {
    let logicals = {};
    list = list.map((logical)=>{
      logical.parent = ids[logical.parent] || logicals[logical.parent] || logical.parent;
      logical.source=[];
      logical.target=[];
      for(let edge of edges){
        if(edge.source===logical.newtId){
          logical.target.push(edge.target);
        }
        if(edge.target===logical.newtId){
          logical.source.push(edge.source);
        }
      }
      return logical;
    });

    var integrationQuery=`
      UNWIND $logicals as logical
      CALL apoc.do.when(
      EXISTS {
        MATCH (p:logical)
        WHERE p.category = 'logical'
          AND p.class = logical.class
          AND size(p.source) = size(logical.source)
          AND all(sourceId IN logical.source WHERE sourceId IN p.source)
          AND size(p.target) = size(logical.target)
          AND all(targetId IN logical.target WHERE targetId IN p.target)
      },
          "MATCH (p:logical)
      WHERE p.category = 'logical'
        AND p.class = data.class
        AND size(p.source) = size(data.source)
        AND all(sourceId IN data.source WHERE sourceId IN p.source)
        AND size(p.target) = size(data.target)
        AND all(targetId IN data.target WHERE targetId IN p.target)
      RETURN {incoming: data.newtId, existing: p.newtId} AS result",
      'CALL apoc.cypher.doIt(
          "CALL apoc.create.node([data.category], data) YIELD node SET node.processed = 0 RETURN {incoming: data.newtId, existing: node.newtId} AS result",
          {data: data}
        ) YIELD value RETURN value.result AS result',
      {data: logical}
    ) YIELD value
    RETURN value.result as result;
    `;
    var data = { query: integrationQuery, queryData: { logicals: list } };
    await $.ajax({
      type: "post",
      url: "/utilities/runDatabaseQuery",
      contentType: "application/json; charset=utf-8",
      data: JSON.stringify(data),
      success: function (response) {
        const { records } = response;
        for (let record of records) {
          console.log(record);
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

  pushActiveNodesEdgesToDatabase: async function (nodesData, edgesData, flag) {
    if(flag === "REPLACE"){
      await this.cleanDatabase();
    }
    const {epnMatchingPercentage,processIncomingContribution,processOutgoingContribution,processAgentContribution,overallProcessPercentage,complexMatchPercentage} = appUtilities.localDbSettings;
    console.log(nodesData, edgesData, flag);
    var epns = nodesData.filter((node) => node.category === "EPN" && node.class!=='complex');
    var complexes = nodesData.filter((node)=>node.class==='complex');
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
    const logical_ids = await databaseUtilities.pushLogicalsToLocalDatabase(
      logicals,
      node_ids,
      edgesData
    );
    if(errorCheck!==null)return errorCheck;
    await databaseUtilities.pushEdgesToLocalDatabase(
      edgesData,
      logical_ids,
      false,
    );
  },
  getNeighboringNodes: async function(nodeId) {
    const query = `
      CALL custom.getNeighbors($id)
        YIELD node, rel
      RETURN node, rel
    `;
    const data = { query, queryData: { id: nodeId } };
  
    await $.ajax({
      type: "post",
      url: "/utilities/runDatabaseQuery",
      contentType: "application/json; charset=utf-8",
      data: JSON.stringify(data),
      success: async function(response) {
        
        const recs      = response.records;
        let nodesArr = [];
        let edgesArr = [];
        recs.forEach(r => {
          const node = r._fields[0];
          const rel  = r._fields[1];
          nodesArr.push(node);
          edgesArr.push(rel);
          });
        await databaseUtilities.addNodesEdgesToCy(nodesArr, edgesArr);
        databaseUtilities.performLayout();
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

  pushNode: function (new_node) {
    return new Promise((resolve) => {
      if (!(new_node.properties.newtId in databaseUtilities.nodesInDB)) {
        var chiseInstance = appUtilities.getActiveChiseInstance();
        var nodeParams = {
          class: databaseUtilities.convertLabelToClass(
            new_node.properties.class
          ),
          language: "PD",
          label: "smth",
        };
        var node = chiseInstance.addNode(
          0,
          0,
          nodeParams,
          new_node.properties.newtId,
          new_node.properties.parent
        );

        chiseInstance.setMultimerStatus(node,new_node.properties.multimer);
        chiseInstance.setCloneMarkerStatus(node, new_node.properties.cloneMarker);

        if (new_node.properties.entityName) {
          chiseInstance.changeNodeLabel(node, new_node.properties.entityName);
        }

        if(new_node.properties.stateVariables.length>0){
          for(let i=0;i<new_node.properties.stateVariables.length;i++){
            var obj = appUtilities.getDefaultEmptyInfoboxObj( 'state variable' );
            chiseInstance.addStateOrInfoBox(node, obj);
            const [value, variable] = new_node.properties.stateVariables[i].split("@");
            chiseInstance.changeStateOrInfoBox(node, i, value,"value");
            chiseInstance.changeStateOrInfoBox(node, i, variable,"variable");
          }
        }

        // ✅ Set unitsOfInformation as a Cytoscape data field
        if (new_node.properties.unitsOfInformation.length > 0) {
          for(let i=0;i<new_node.properties.unitsOfInformation.length;i++){
            console.log("unit of information",new_node.properties.unitsOfInformation[i]);
            var uoi_obj = appUtilities.getDefaultEmptyInfoboxObj( 'unit of information' );
            chiseInstance.addStateOrInfoBox(node, uoi_obj);
        //     console.log("unit of information:",new_node.properties.unitsOfInformation[i]);
            chiseInstance.changeStateOrInfoBox(node, new_node.properties.stateVariables.length + i, new_node.properties.unitsOfInformation[i],"value");
          }
        }

        databaseUtilities.nodesInDB[new_node.properties.newtId] =
          new_node.identity.low;
        var el = cy.getElementById(new_node.properties.newtId);
        var vu = cy.viewUtilities("get");
        // vu.highlight(el, 3);
      }
      resolve();
    });
  },

  //Queries
  getIdOfLabeledNodes: async function (labelOfNodes, idOfNodes, newtIdOfNodes) {
    var query = `UNWIND $labelOfNodes as label
                   MATCH (u)
                   WHERE u.entityName = label
                   RETURN id(u), u.newtId`;
    var queryData = { labelOfNodes: labelOfNodes };

    var data = { query: query, queryData: queryData };
    var idNodes = [];
    await $.ajax({
      type: "post",
      url: "/utilities/runDatabaseQuery",
      contentType: "application/json; charset=utf-8",
      data: JSON.stringify(data),
      success: function (data) {
        for (var i = 0; i < data.records.length; i++) {
          idOfNodes.push(data.records[i]._fields[0].low);
          newtIdOfNodes.push(data.records[i]._fields[1]);
        }
      },
      error: function (req, status, err) {
        console.error("Error running query", status, err);
      },
    });
  },

  batchAddNodesEdgesToCy: async function (nodes, edges, source, target) {
    var chiseInstance = appUtilities.getActiveChiseInstance();
    await chiseInstance.addNodesEdges(nodes,edges).then(async function(){
      $("#map-color-scheme_opposed_red_blue").click();
      $("#color-scheme-inspector-style-select").val("3D");
      $("#color-scheme-inspector-style-select").change();
    });
    databaseUtilities.performLayout();
  },

  addNodesEdgesToCy: async function (nodes, edges, source, target) {
    console.log("Edges in here:",edges);
    return new Promise((resolve) => {
      var chiseInstance = appUtilities.getActiveChiseInstance();
      let nodesToHighlight = [];
      let edgesToHighlight = [];
      let edgesToAdd = [];
      let nodesToAdd = [];
      databaseUtilities.nodesInDB = {};
      databaseUtilities.edgesInDB = {};
      for (let i = 0; i < nodes.length; i++) {
        if (!databaseUtilities.nodesInDB[nodes[i].properties.newtId]) {
          nodesToAdd.push(nodes[i]);
        }
        nodesToHighlight.push(nodes[i]);
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
              vu.highlight(el, 5);
            }
          }
          var cy = appUtilities.getActiveCy();
          databaseUtilities.performLayout();
        });
      
      return {
        nodesToHighlight: nodesToHighlight,
        edgesToHighlight: edgesToHighlight,
      };
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
        if (!notAllowedEdges){            
          var new_edge = chiseInstance.addEdge(
            edgesToAdd[i].properties.target,
            edgesToAdd[i].properties.source,
            databaseUtilities.convertLabelToClass(edgesToAdd[i].properties.class),
            undefined,
            undefined
          );
        }
      }
      resolve();
    });
  },

  performLayout: function () {
    appUtilities.triggerLayout(cy, true,true);
  },

  runPathsFromTo: async function (sourceArray, targetArray, limit) {
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

    //Check if any nodes with such labels
    if (sourceId.length == 0 && targetId > 0) {
      var errMessage = {
        err: "Invalid input",
        message: "No such source nodes",
      };
      return errMessage;
    }
    if (sourceId.length > 0 && targetId == 0) {
      var errMessage = {
        err: "Invalid input",
        message: "No such target nodes",
      };
      return errMessage;
    }
    if (sourceId.length == 0 && targetId == 0) {
      var errMessage = {
        err: "Invalid input",
        message: "No such source and target nodes",
      };
      return errMessage;
    }
    query = graphALgos.pathsFromTo(limit);
    var queryData = { sourceArray: sourceId, targetArray: targetId };
    var data = { query: query, queryData: queryData };

    await $.ajax({
      type: "post",
      url: "/utilities/runDatabaseQuery",
      contentType: "application/json; charset=utf-8",
      data: JSON.stringify(data),
      success: async function (data) {
        if (data.records.length == 0) {
          result.err = { err: "Invalid input", message: "No data returned" };
          return;
        }
        var nodes = [];
        var edges = [];
        var nodesSet = new Set();
        var edgesMap = new Map();
        var records = data.records;
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
        databaseUtilities.addNodesEdgesToCy(
          nodes,
          edges,
          sourceNewt,
          targetNewt
        );
      },
      error: function (req, status, err) {
        console.error("Error running query", status, err);
      },
    });
  },

  runPathBetween: async function (labelOfNodes, lengthLimit) {
    var idOfNodes = [];
    var newtIdOfNodes = [];
    await databaseUtilities.getIdOfLabeledNodes(
      labelOfNodes,
      idOfNodes,
      newtIdOfNodes
    );

    //Check if label of nodes are valid
    if (idOfNodes.length == 0) {
      var errMessage = {
        err: "Invalid input",
        message: "No such nodes with given labels",
      };
      return errMessage;
    }

    var query = graphALgos.pathsBetween(lengthLimit);
    var queryData = { idList: idOfNodes };

    var data = { query: query, queryData: queryData };
    console.log("data being sent:", data);
    console.log(query);
    var result = {};
    result.highlight = {};
    result.add = {};
    await $.ajax({
      type: "post",
      url: "/utilities/runDatabaseQuery",
      contentType: "application/json; charset=utf-8",
      data: JSON.stringify(data),
      success: async function (data) {
        //Check if any data returned
        if (data.records.length == 0) {
          result.err = { err: "Invalid input", message: "No data returned" };
          return;
        }
        console.log("returned data:", data);
        var nodes = [];
        var edges = [];
        var nodesSet = new Set();
        var edgesMap = new Map();
        var records = data.records;
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
        console.log("data:", nodes, edges, newtIdOfNodes);
        await databaseUtilities.addNodesEdgesToCy(nodes, edges, newtIdOfNodes);
      },
      error: function (req, status, err) {
        console.error("Error running query", status, err);
      },
    });
    return result;
  },
  runNeighborhood: async function (labelOfNodes, lengthLimit) {
    var idList = [];
    var newtIdList = [];
    await databaseUtilities.getIdOfLabeledNodes(
      labelOfNodes,
      idList,
      newtIdList
    );
    var setOfSources = new Set(newtIdList);

    if (idList.length == 0) {
      var errMessage = {
        err: "Invalid input",
        message: "No such nodes with given labels",
      };
      return errMessage;
    }

    var query = graphALgos.neighborhood(lengthLimit);
    var queryData = { idList: idList };

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
        console.log("data:", data);
        if (data.records.length == 0) {
          result.err = {
            err: "Invalid input",
            message: "No such nodes with given labels",
          };
          return;
        }
        var nodes = [];
        var edges = [];
        var targetNodes = [];
        var nodesSet = new Set();
        var edgesMap = new Map();
        var records = data.records;
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
        console.log(nodes, edges, newtIdList, targetNodes);
        await databaseUtilities.addNodesEdgesToCy(
          nodes,
          edges,
          newtIdList,
          targetNodes
        );
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

    if (idOfNodes.length == 0) {
      var errMessage = {
        err: "Invalid input",
        message: "No such nodes with given labels",
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
        if (data.records.length == 0) {
          result.err = { err: "Invalid input", message: "No data returned" };
          return;
        }
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
    

  getAllNodesAndEdgesFromDatabase: async function(enableCloning = false, cloneThreshold = 0) {
    console.log("Fetching all nodes and edges from the database...", enableCloning, cloneThreshold);
  
    // 1) Fetch everything
    const query = `
      MATCH (n)
      OPTIONAL MATCH (n)-[r]->(m)
        WHERE NOT type(r) STARTS WITH 'belongs_to_'
      RETURN
        collect(DISTINCT n) AS nodes,
        collect(DISTINCT r) AS edges
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
        const [ nodesArray, edgesArray ] = response.records[0]._fields;
        console.log("edges:",edgesArray);
        const nodes = [], edges = [];
        const nodesSet = new Set();
        const edgesMap = new Map();
        
        // 3) Separate out all simple_chemical nodes
        const simpleChemMap = new Map();
        for (let n of nodesArray) {
          if (n.properties.class === "simple_chemical") {
            simpleChemMap.set(n.properties.newtId, n);
            n.properties.cloned = true;              // mark it so we know it’s special
          } else {
            // add every non-simple_chemical once
            if (!nodesSet.has(n.properties.newtId)) {
              nodes.push(n);
              nodesSet.add(n.properties.newtId);
            }
          }
        }
  
        // 4) Pre-count arcs touching each simple_chemical (if cloning enabled)
        const arcCounts = {};
        if (enableCloning) {
          for (let e of edgesArray) {
            for (let end of ["source", "target"]) {
              const id = e.properties[end];
              if (simpleChemMap.has(id)) {
                arcCounts[id] = (arcCounts[id] || 0) + 1;
              }
            }
          }
        }
  
        // 5) Re-add originals for which we’re NOT cloning (or cloning is off)
        for (let [id, orig] of simpleChemMap.entries()) {
          if (!enableCloning || arcCounts[id] <= cloneThreshold) {
            if (!nodesSet.has(id)) {
              nodes.push(orig);
              nodesSet.add(id);
            }
          }
        }
  
        // 6) Process each edge, cloning endpoints as needed
        for (let i = 0; i < edgesArray.length; i++) {
          const raw = edgesArray[i].properties;
  
          if (enableCloning) {
            for (let end of ["source", "target"]) {
              const id = raw[end];
              // only clone if it’s a simple_chemical and exceeds threshold
              if (simpleChemMap.has(id) && arcCounts[id] > cloneThreshold) {
                const orig = simpleChemMap.get(id);
                const clone = JSON.parse(JSON.stringify(orig));
                clone.properties.newtId = `${orig.properties.newtId}_${i}_${end}`;
                clone.properties.cloneMarker = true; // mark it as cloned
                nodes.push(clone);
                nodesSet.add(clone.properties.newtId);
                raw[end] = clone.properties.newtId;
              }
            }
          }
  
          // build minimal edge object
          edges.push({
            properties: {
              source: raw.source,
              target: raw.target,
              class:  raw.class
            },
            identity: { low: edgesArray[i].identity.low }
          });
  
          // avoid duplicates if you need to check
          if (!edgesMap.has(raw.source)) edgesMap.set(raw.source, new Set());
          edgesMap.get(raw.source).add(raw.target);
          // console.log(MapTabLabelPanel);
        }
  
        // 7) Render in Cytoscape
        await appUtilities.createNewNetwork();
        await databaseUtilities.batchAddNodesEdgesToCy(nodes, edges);
        // await databaseUtilities.addNodesEdgesToCy(nodes, edges);
      },
      error: (req, status, err) => {
        console.error("Error fetching nodes/edges:", status, err);
      }
    });
  },  
};
module.exports = databaseUtilities;
