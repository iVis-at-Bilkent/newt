var nodeMatchUtilities = require("./node-match-utilities");
var graphALgos = require("./graph-algos");
var appUtilities = require("./app-utilities");
const { ActiveTabPushSuccessView } = require("./backbone-views");
const { merge } = require("jquery");

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
  not:'logical'
};

var epnCriterias= {
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
  }
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

  pushActiveContentToDatabase: async function (activeTabContent, flag) {
    var nodesData = [];
    var edgesData = [];
    await databaseUtilities.processNodesData(nodesData, activeTabContent);
    await databaseUtilities.processEdgesData(edgesData, activeTabContent);
    await databaseUtilities.processData(nodesData, edgesData);
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
        nodesMap[edgesData[i].target].class != "compartment" &&
        nodesMap[edgesData[i].target].class != "submap" &&
        nodesMap[edgesData[i].target].class != "complex"
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
  },

  pushEPNToLocalDatabase: async function (ids,list, mergeflag,epnMatchingPercentage) {
    console.log(ids,list,mergeflag,epnMatchingPercentage/100);

    integrationQuery=``;
    if(mergeflag){
      integrationQuery = `
          UNWIND $nodesData AS data
          WITH data, apoc.map.get($epnCriterias, data.class, {}) AS criteria
          CALL custom.matchAndPushEPN(
              data, 
              criteria,  // ✅ Sends only the relevant epnCriteria
              $epnMatchingPercentage
          ) YIELD result
          RETURN result;
          `;
    }
    // else{
    //   integrationQuery=`
    //   unwind $nodesData as data
    //   call apoc.do.when(

    //     exists{match (n) where n.category="EPN" and n.entityName=data.entityName and n.parent=data.parent return n},
    //     'call apoc.cypher.doIt(
    //       "
    //         match(n) 
    //         where n.category=\\\\"EPN\\\\" and n.entityName=data.entityName
    //         SET n.parent = data.parent,
    //             n.unitsOfInformation = data.unitsOfInformation,
    //             n.language = data.language,
    //             n.inDb = data.inDb,
    //             n.stateVariables = data.stateVariables,
    //             n.isSpecial = data.isSpecial,
    //             n.entityName = data.entityName,
    //             n.cloneMarker = data.cloneMarker,
    //             n.multimer = data.multimer,
    //             n.category = data.category,
    //             n.cloneLabel = data.cloneLabel,
    //             n.class = data.class
    //         RETURN {incoming: data.newtId,existing:n.newtId} AS result
    //       ",
    //       {data:data}
    //     )YIELD value RETURN value.result AS result'
    //     ,
    //     'call apoc.cypher.doIt(
    //       "
    //         CALL apoc.create.node([data.category],data)yield node set node.processed=0 
    //         return {incoming:data.newtId,existing:node.newtId} as result
    //       "
    //       ,
    //       {data:data}
    //     ) 
    //     yield value return value.result as result'
    //   ,
    //   {data:data}
    //   ) yield value return value.result as result;
    //   `;
    // }
    
    var data = {
      query: integrationQuery,
      queryData: { nodesData: list, flag: mergeflag, epnCriterias:epnCriterias, epnMatchingPercentage:epnMatchingPercentage/100},
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
          console.log(map);
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
  pushProcessToLocalDatabase: async function (list, ids, flag,processIncomingContribution,processOutgoingContribution,processAgentContribution,overallProcessPercentage) {
    console.log(list,ids);
    list = list.map((pr) => {
      const sourceNewtIds = Object.keys(pr)
        .filter((key) => key.startsWith("source_"))
        .map((key) => ids[pr[key][6]]) // Assuming index 6 is the newtId
        .filter((id) => id !== "none"); // Remove any 'none' values

      // Extract target newtIds
      const targetNewtIds = Object.keys(pr)
        .filter((key) => key.startsWith("target_"))
        .map((key) => ids[pr[key][6]]) // Assuming index 6 is the newtId
        .filter((id) => id !== "none"); // Remove any 'none' values
      
      // Extract modifier newtIds
      const modifierNewtIds = Object.keys(pr)
        .filter((key) => key.startsWith("modifier_"))
        .map((key) => ids[pr[key][6]]) // Assuming index 6 is the newtId
        .filter((id) => id !== "none"); // Remove any 'none' values

      var process = Object.assign({}, pr);
      process.sourceNewtIds = sourceNewtIds;
      process.targetNewtIds = targetNewtIds;
      process.modifierNewtIds = modifierNewtIds;
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
        sourceThreshold: processIncomingContribution/100,
        targetThreshold: processOutgoingContribution/100,
        modifierThreshold: processAgentContribution/100,
        overallThreshold: overallProcessPercentage/100
      }
    };
    // var integrationQuery=`
    //   UNWIND $processes as process
    //   CALL apoc.do.when(
    //   EXISTS {
    //     MATCH (p:process)
    //     WHERE p.category = 'process'
    //       AND p.class = process.class
    //       AND size(p.sourceNewtIds) = size(process.sourceNewtIds)
    //       AND all(sourceId IN process.sourceNewtIds WHERE sourceId IN p.sourceNewtIds)
    //       AND size(p.targetNewtIds) = size(process.targetNewtIds)
    //       AND all(targetId IN process.targetNewtIds WHERE targetId IN p.targetNewtIds)
    //   },
    //       "MATCH (p:process)
    //   WHERE p.category = 'process'
    //     AND p.class = data.class
    //     AND size(p.sourceNewtIds) = size(data.sourceNewtIds)
    //     AND all(sourceId IN data.sourceNewtIds WHERE sourceId IN p.sourceNewtIds)
    //     AND size(p.targetNewtIds) = size(data.targetNewtIds)
    //     AND all(targetId IN data.targetNewtIds WHERE targetId IN p.targetNewtIds)
    //   RETURN {incoming: data.newtId, existing: p.newtId} AS result",
    //   'CALL apoc.cypher.doIt(
    //       "CALL apoc.create.node([data.category], data) YIELD node SET node.processed = 0 RETURN {incoming: data.newtId, existing: node.newtId} AS result",
    //       {data: data}
    //     ) YIELD value RETURN value.result AS result',
    //   {data: process}
    // ) YIELD value
    // RETURN value.result as result;
    // `;
    // var data = { query: integrationQuery, queryData: { processes: list } };
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

  pushEdgesToLocalDatabase: async function (list, ids, flag) {
    for (let i = 0; i < list.length; i++) {
      list[i].source = ids[list[i].source];
      list[i].target = ids[list[i].target];
    }

    const query = `
    UNWIND $edges AS edge
    MATCH (sourceNode {newtId: edge.source}), (targetNode {newtId: edge.target})
    CALL apoc.do.when(
      EXISTS {
        MATCH (sourceNode)-[r]->(targetNode)
        WHERE type(r) = edge.class
      },
      'RETURN null',
      'CALL apoc.create.relationship(sourceNode, edge.class, {}, targetNode) YIELD rel RETURN rel',
      {sourceNode: sourceNode, targetNode: targetNode, edge: edge}
    ) YIELD value
    RETURN value;
    `;
   
    var data = { query, queryData: { edges: list } };
    await $.ajax({
      type: "post",
      url: "/utilities/runDatabaseQuery",
      contentType: "application/json; charset=utf-8",
      data: JSON.stringify(data),
      success: function (response) {
        console.log(response);
        // const {records}=response;
        // for(let record of records){
        //   console.log(record);
        //   const map = record._fields[0];
        //   ids[map.incoming]=map.existing;
        // }
      },
      error: function (req, status, err) {
        errorCheck = {status,err}
        console.error("Error running query", status, err);
      },
    });
  },

  pushCompartmentsToDatabase: async function(ids,compartments){
    console.log('pushing compartments');
    var integrationQuery = `
    unwind $nodesData as data
    call apoc.do.when(
      exists{match (n) where n.class="compartment" and n.entityName=data.entityName return n},
      "match (n) where n.entityName=data.entityName return {incoming:data.newtId,existing:n.newtId} as result",
      'call apoc.cypher.doIt("CALL apoc.create.node([data.class],data)yield node set node.processed=0 return {incoming:data.newtId,existing:node.newtId} as result",{data:data}) yield value return value.result as result',
      {data:data}
    ) yield value return value.result as result;
    `;
    var data={
      query: integrationQuery,
      queryData:{nodesData:compartments},
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

  pushSubmapsToDatabase: async function(ids,submaps){
    console.log('pushing submaps');
    var integrationQuery = `
    unwind $nodesData as data
    call apoc.do.when(
      exists{match (n) where n.class="submap" and n.entityName=data.entityName return n},
      "match (n) where n.entityName=data.entityName return {incoming:data.newtId,existing:n.newtId} as result",
      'call apoc.cypher.doIt("CALL apoc.create.node([data.class],data)yield node set node.processed=0 return {incoming:data.newtId,existing:node.newtId} as result",{data:data}) yield value return value.result as result',
      {data:data}
    ) yield value return value.result as result;
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

  pushComplexesToDatabase: async function(complexes, epns) {
    // Associate each complex with its children
    for (let complex of complexes) {
      let children = [];
      for (let i = 0; i < epns.length; i++) {
        let epn = epns[i];
        if (epn.parent === complex.newtId) {
          children.push(epn);
          epns.splice(i, 1);
          i--;
        }
      }
      complex.children = children;
    }
  
    // Build the query to call our stored procedure
    const data = {
      query: "CALL custom.pushComplexes($complexes, $epnCriteria, $threshold) YIELD result RETURN result",
      queryData: {
        complexes: complexes,
        epnCriteria: epnCriterias,
        threshold: 1
      }
    };
  
    let ids = {};
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
        // Each record's first field is the result mapping from our stored procedure.
        const map = record._fields[0];
        // map.incoming is the incoming complex newtId
        // map.existing is an object with keys: "complex" and "children"
        ids[map.incoming] = map.existing.complex;
        
        // Process the children – they might be an array of mappings or a list of newtId strings.
        if (Array.isArray(map.existing.children)) {
          for (let child of map.existing.children) {
            if (typeof child === "object") {
              // When reusing an existing complex, each child is a mapping {incoming, existing}
              ids[child.incoming] = child.existing;
            } else {
              // When a new complex is created, children is simply a list of newtIds
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
  


  // pushComplexesToDatabase: async function(complexes,epns){
  //   for(let node of complexes){
  //     let children = [];
  //     for(let i=0;i<epns.length;i++){
  //       let epn = epns[i];
  //       if(epn.parent===node.newtId){
  //         children.push(epn);
  //         epns.splice(i,1);
  //         i--;
  //       }
  //     }
  //     node.children = children;
  //   }
  //   var ids={};
  //   var integrationQuery = `
  //     UNWIND $complexes AS incomingComplex // Unwind the array of incoming complexes
  //     match (c:complex {entityName:incomingComplex.entityName})<-[:belongs_to_complex]-(children:EPN)
  //     with c,incomingComplex,collect(children.entityName) as existingChildren, [child IN incomingComplex.children | child.entityName] AS expectedChildren, collect(children) as dbChildren
  //     where size(existingChildren) = size(expectedChildren) and 
  //           all(ch in existingChildren where ch in expectedChildren) and
  //           all(ch in expectedChildren where ch in existingChildren)
  //     with
  //         c,
  //         incomingComplex,
  //         [child in incomingComplex.children|
  //             {
  //               incoming: child.newtId,
  //               existing: case when child.entityName in existingChildren then [dbChild in dbChildren where dbChild.entityName = child.entityName][0].newtId else null end
  //             }
  //         ] as childrenOutput
  //     return {
  //       incoming: incomingComplex.newtId,
  //       existing: c.newtId,
  //       children: childrenOutput
  //     }
  //   `;
  //   var data={
  //     query: integrationQuery,
  //     queryData:{complexes:complexes},
  //   };
  //   await $.ajax({
  //     type: "post",
  //     url: "/utilities/runDatabaseQuery",
  //     contentType: "application/json; charset=utf-8",
  //     data: JSON.stringify(data),
  //     success: async function (response) {
  //       const { records } = await response;
  //       if(records.length===0){
  //         const createQuery=`
  //           UNWIND $complexes AS incomingComplex
  //           WITH apoc.map.removeKeys(incomingComplex, ['children']) AS mappedComplexData, incomingComplex
  //           call apoc.create.node(["complex"],mappedComplexData) yield node as newComplex
  //           with newComplex, incomingComplex
  //           unwind incomingComplex.children as childData
  //           call apoc.create.node(["EPN"], childData) yield node as newChild
  //           call apoc.create.relationship(newChild,"belongs_to_complex",{},newComplex) yield rel
  //           with incomingComplex,newComplex,collect(childData.newtId) as childrenIds
  //           return {
  //             incoming:incomingComplex.newtId,
  //             existing:newComplex.newtId,
  //             children:childrenIds
  //           } as result
  //         `;

  //         var d={query:createQuery,queryData:{complexes:complexes}};
  //         await $.ajax({
  //           type: "post",
  //           url: "/utilities/runDatabaseQuery",
  //           contentType: "application/json; charset=utf-8",
  //           data: JSON.stringify(d),
  //           success: function (response) {
  //             const { records } = response;
  //             for(let record of records){
  //               const map = record._fields[0];
  //               ids[map.incoming] = map.existing;
  //               for(let child of map.children){
  //                 ids[child]=child;
  //               }
  //             }
  //             return ids;
  //           },
  //           error: function (req, status, err) {
  //             console.log("Error running query", status, err);
  //             errorCheck = {status,err}
  //             console.error("Error running query", status, err);
  //           },
  //         });
  //       }
        
  //       for (let record of records) {
  //         const map = record._fields[0];
  //         ids[map.incoming] = map.existing;
  //         for(let child of map.children){
  //           ids[child.incoming] = child.existing;
  //         }
  //       }
  //       return ids;
  //     },
  //     error: function (req, status, err) {
  //       errorCheck = {status,err}
  //       console.error("Error running query", status, err);
  //     },
  //   });
  //   return ids;
  // },



  pushLogicalsToLocalDatabase: async function (list, ids,edges, flag) {
    list = list.map((logical)=>{
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
    console.log(nodesData, edgesData, flag);
    var epns = nodesData.filter((node) => node.category === "EPN" && node.class!=='complex');
    var complexes = nodesData.filter((node)=>node.class==='complex');
    var createdComplexesIds = await databaseUtilities.pushComplexesToDatabase(complexes,epns);
    if(errorCheck!==null)return errorCheck;
    const submaps = nodesData.filter((node)=>node.class==='submap');
    const submapIds = await this.pushSubmapsToDatabase(createdComplexesIds,submaps);
    if(errorCheck!==null)return errorCheck;
    const compartments = nodesData.filter((node)=>node.class==='compartment');
    const compartmentIds = await this.pushCompartmentsToDatabase(submapIds,compartments);
    if(errorCheck!==null)return errorCheck;
    var processes = nodesData.filter((node) => node.category === "process");
    var logicals = nodesData.filter((node)=>node.category==='logical');
    // console.log(compartmentIds,epns,processes);
    const mergeFlag = flag === "MERGE";
    const {epnMatchingPercentage,processIncomingContribution,processOutgoingContribution,processAgentContribution,overallProcessPercentage} = appUtilities.localDbSettings;
    console.log(epnMatchingPercentage,processIncomingContribution,processOutgoingContribution,processAgentContribution,overallProcessPercentage);
    const epn_ids = await databaseUtilities.pushEPNToLocalDatabase(
      compartmentIds,
      epns,
      mergeFlag,
      epnMatchingPercentage
    );
    if(errorCheck!==null)return errorCheck;
    const node_ids = await databaseUtilities.pushProcessToLocalDatabase(
      processes,
      epn_ids,
      mergeFlag,
      processIncomingContribution,
      processOutgoingContribution,
      processAgentContribution,
      overallProcessPercentage
    );
    if(errorCheck!==null)return errorCheck;
    const logical_ids = await databaseUtilities.pushLogicalsToLocalDatabase(
      logicals,
      node_ids,
      edgesData,
      mergeFlag
    );
    if(errorCheck!==null)return errorCheck;
    await databaseUtilities.pushEdgesToLocalDatabase(
      edgesData,
      logical_ids,
      mergeFlag
    );




    // if(errorCheck!==null)return errorCheck;
    // await databaseUtilities.pushProcessToLocalDatabase(processes);

    // var createOneNode =`call apoc.create.node([data.class],data) yield node set node.processed=0 return node as node`;
    // var createOneEdge = `call apoc.create.relationship(n,data.class,data,m) yield rel with rel set rel.processed=0 return rel as edge`;
    // var inDbNode = `CALL apoc.cypher.doIt('
    // MATCH (u)
    // WHERE  u.newtId = data.newtId and id(u) = data.idInDb
    // SET u = data
    // RETURN u as node', {data:data})
    // YIELD value
    // RETURN value.node as node`;

    // var inDbEdge= `MATCH (n)-[r]->(m)
    // WHERE id(r) = data.idInDb
    // SET r.source =  data.source, r.target = data.target
    // RETURN r as rel`;
    // var createNodesQuery=`
    // call apoc.cypher.doIt(\\"${createOneNode}\\",{data:data})
    // yield value return value.node as node`;

    // var checkNodeQuery=`
    // call apoc.do.when(data.isSpecial,
    // 'match (u) where ${nodeMatchUtilities.matchProcessNodes("data","u",true,true,true,true)} return count(u) as cnt set u.newtId=data.newtId',
    // '${createNodesQuery}',
    // {data:data}
    // )yield value return value
    // `;

    // var pushNodesQuery=`unwind $nodesData as data
    // call apoc.do.when(data.inDb,
    // "${inDbNode}","${checkNodeQuery}",{data:data})
    // yield value return value.node as node`;

    // var createEdgesQuery = `match (n) where n.newtId =data.source
    // optional match (m) where m.newtId = data.target
    // with distinct n,m,data
    // ${createOneEdge}
    // `;

    // var pushEdgesQuery=`unwind $edgesData as data
    // call apoc.do.when(data.inDb,"${inDbEdge}","${createEdgesQuery}",{data:data})
    // yield value return value as edge`;

    // const runDBQuery=async (data)=>{
    //   return $.ajax({
    //     type: "post",
    //     url: "/utilities/runDatabaseQuery",
    //     contentType: "application/json; charset=utf-8",
    //     data: JSON.stringify(data),
    //     success: function (response) {
    //       console.log('got response for nodes/edges:',response);

    //       const {records} = response;
    //       console.log(records,response);
    //       for(let i=0;i<records.length;i++){
    //         if(records[i].keys[0]=='node'){
    //           console.log('found a node:',records[i])
    //           var node = records[i]._fields[0];
    //           if(node.properties){
    //             databaseUtilities.nodesInDB[node.properties.newtId] =node.identity.low;
    //           }
    //           else if (node.newtId){
    //             databaseUtilities.nodesInDB[node.newtId] =node.identity.low;
    //           }
    //         }
    //         else if(records[i].keys[0]==='edge'){
    //           var {edge} = records[i]._fields[0];
    //           console.log('found an edge:',edge)
    //           if(edge.properties!==null){
    //             databaseUtilities.edgesInDB[
    //                 [
    //                 edge.properties.source,
    //                 edge.properties.target,
    //                 edge.properties.class,
    //                 ]
    //                 ] = edge.identity.low;
    //           }
    //         }
    //       }
    //     },
    //     error: function (req, status, err) {
    //       console.error("Error running query", status, err);
    //     },
    //   });
    // };

    // console.log('nodeData:',nodesData);
    // const macros = nodesData.filter((node)=>!node.isSpecial);
    // const specials = nodesData.filter((node)=>node.isSpecial);
    // console.log('macros:',macros,'specials:',specials);
    // console.log('edgesData:',edgesData);
    // console.log("flag:",flag);
    // console.log("test:",nodeMatchUtilities.matchEdges("r", "data", true, true));
    // var matchClass = true;
    // var matchLabel = true;
    // var matchId = false;
    // var matchMultimer = true;
    // var matchCloneMarker = true;
    // var matchCloneLabel = true;
    // var matchStateVariable = true;
    // var matchUnitInformation = true;
    // var matchParent = true;

    // // var integrationQuery=`${createNodesQuery}`;
    // var data = { query: pushNodesQuery, queryData: {nodesData} };
    // var result = await runDBQuery(data);
    // if(result.records.length>0){
    //   var data = { query: pushEdgesQuery, queryData: {edgesData} };
    //   var result = await runDBQuery(data);
    // }

    // var queryData = { nodesData: nodesData, edgesData: edgesData };
    // var data = { query: createEdgesQuery, queryData: queryData };
    // console.log('final data:',data)
    // await runDBQuery(data);

    // var integrationQuery=`UNWIND $nodesData as data
    // CALL apoc.cypher.doIt(
    // 'CALL apoc.create.node([data.class], data)'
    // ,{data:data})
    // YIELD node
    // SET node.processed = 0
    // RETURN node as node)
    // `

    // var integrationQuery = `UNWIND $nodesData as data
    // CALL apoc.do.when( data.inDb,
    //   "CALL
    //     apoc.cypher.doIt('
    //       MATCH (u)
    //       WHERE  u.newtId = data.newtId and id(u) = data.idInDb
    //       SET u = data
    //       RETURN u as node', {data:data})
    //     YIELD value
    //     RETURN value.node as node",
    //   "CALL
    //     apoc.cypher.doIt('
    //       CALL apoc.do.when( data.isSpecial,
    //         \\"MATCH (u)
    //         WHERE ${nodeMatchUtilities.matchProcessNodes(
    //           "data",
    //           "u",
    //           true,
    //           true,
    //           true,
    //           true
    //         )}
    //         RETURN COUNT(u) as cnt\\",
    //         \\"MATCH (u)
    //         WHERE  ${nodeMatchUtilities.match(
    //           "data",
    //           "u",
    //           matchId,
    //           matchClass,
    //           false,
    //           matchMultimer,
    //           matchCloneMarker,
    //           matchCloneLabel,
    //           matchStateVariable,
    //           matchUnitInformation,
    //           true,
    //           matchParent
    //         )}
    //         RETURN COUNT(u) as cnt\\",
    //       {data:data})
    //       YIELD value
    //       RETURN value.cnt as cnt', {data: data})
    //       YIELD value
    //     WITH value.cnt as cnt, data
    //     CALL
    //     apoc.cypher.doIt('
    //       CALL apoc.do.when( cnt > 0, \\"MATCH (u) WHERE ${nodeMatchUtilities.match(
    //         "data",
    //         "u",
    //         matchId,
    //         matchClass,
    //         false,
    //         matchMultimer,
    //         matchCloneMarker,
    //         matchCloneLabel,
    //         matchStateVariable,
    //         matchUnitInformation,
    //         true,
    //         matchParent
    //       )} RETURN u.newtId as id \\", \\"RETURN null as id\\",
    //             {data:data, cnt: cnt})
    //             YIELD value
    //             RETURN value.id as id',
    //       {data:data, cnt: cnt} )
    //     YIELD value
    //     WITH value.id as id, data
    //     CALL
    //     apoc.cypher.doIt('
    //           CALL apoc.do.when(id is not null , \\"
    //           MATCH (n)
    //           WHERE n.newtId = id
    //           SET n.newtId = data.newtId\\",
    //           \\"CALL apoc.create.node([data.class], data)
    //           YIELD node
    //           SET node.processed = 0
    //           RETURN node as node\\", {data: data, id:id})
    //           YIELD value
    //           RETURN value.node as node
    //         ', {data:data, id: id})
    //         YIELD value
    //         RETURN value.node as node",
    //   {data:data})
    // YIELD value
    // WITH collect(value.node) as nodes
    // CALL
    // apoc.cypher.doIt("
    //   UNWIND $edgesData AS data
    //   CALL apoc.do.when(data.inDb,
    //     'MATCH (n)-[r]->(m)
    //      WHERE id(r) = data.idInDb
    //      SET r.source =  data.source, r.target = data.target
    //      RETURN r as rel',
    //     'CALL  apoc.cypher.doIt(\\"MATCH (a)-[r]->(b)
    //       WHERE ${nodeMatchUtilities.matchEdges("r", "data", true, true)}
    //       RETURN COUNT(r) as cnt \\", {data:data})
    //       YIELD value
    //     WITH value.cnt as cnt, data
    //     CALL apoc.do.when(cnt>0 , \\" MATCH (r)
    //      WHERE ${nodeMatchUtilities.matchEdges("r", "data", true, true)}
    //      SET r.source = data.source, r.target = data.target
    //      RETURN r as rel\\",
    //           \\"MATCH (n {newtId: data.source}), (m { newtId: data.target})
    //            WITH DISTINCT n, m, data
    //           CALL apoc.create.relationship(n,data.class,data,m) YIELD rel
    //            WITH rel
    //       SET rel.processed = 0
    //       RETURN rel as rel \\", {data:data})
    //      YIELD value
    //      RETURN value.rel as rel',
    //     {data: data}
    //   )
    //   YIELD value
    //   RETURN collect(value.rel) as rel
    //   ",
    //   {edgesData: $edgesData})
    // YIELD value
    // RETURN nodes as nodes, value.rel as edges`;

    // $.ajax({
    //   type: "post",
    //   url: "/utilities/runDatabaseQuery",
    //   contentType: "application/json; charset=utf-8",
    //   data: JSON.stringify(data),
    //   success: function (data) {
    //     let nodes = data.records[0]._fields[0];
    //     let edges = data.records[0]._fields[1];

    //     if (nodes) {
    //       for (let i = 0; i < nodes.length; i++) {
    //         if (nodes[i].properties) {
    //           databaseUtilities.nodesInDB[nodes[i].properties.newtId] =
    //             nodes[i].identity.low;
    //         } else if (nodes[i].newtId) {
    //           databaseUtilities.nodesInDB[nodes[i].newtId] =
    //             nodes[i].identity.low;
    //         }
    //       }
    //     }
    //     // console.log('data',data);
    //     if (edges) {
    //       for (let i = 0; i < edges.length; i++) {
    //         if(edges[i].properties){
    //           databaseUtilities.edgesInDB[
    //             [
    //               edges[i].properties.source,
    //               edges[i].properties.target,
    //               edges[i].properties.class,
    //             ]
    //           ] = edges[i].identity.low;
    //         }
    //       }
    //     }
    //     // console.log("hiii");
    //     // new PromptInvalidQueryView({el: '#prompt-invalidQuery-table'}).render();
    //     // new ActiveTabPushSuccessView({
    //     //   el:'#prompt-confirmation-table',
    //     //   }).render();
    //     // console.log("hiii2");
    //   },
    //   error: function (req, status, err) {
    //     console.error("Error running query", status, err);
    //   },
    // });
  },
  convertLabelToClass: function (label) {
    var repl = label.replace("_", " ");
    return repl;
  },

  getNodesRecursively: function (nodesToAdd) {
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
            databaseUtilities.getNodesRecursively(parents).then(() => {
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
      if (!databaseUtilities.nodesInDB[new_node.properties.newtId]) {
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

        if (new_node.properties.entityName) {
          chiseInstance.changeNodeLabel(node, new_node.properties.entityName);
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

  addNodesEdgesToCy: async function (nodes, edges, source, target) {
    return new Promise((resolve) => {
      var chiseInstance = appUtilities.getActiveChiseInstance();
      let nodesToHighlight = [];
      let edgesToHighlight = [];
      let edgesToAdd = [];
      let nodesToAdd = [];

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
      console.log("edges to add:", edges);
      databaseUtilities
        .getNodesRecursively(nodesToAdd)
        .then(async function () {
          return databaseUtilities.pushEdges(edgesToAdd);
        })
        .then(function () {
          //Add color scheme for map
          $("#map-color-scheme_greyscale").click();
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

          //Run layout
          databaseUtilities.performLayout();
        });

      return {
        nodesToHighlight: nodesToHighlight,
        edgesToHighlight: edgesToHighlight,
      };
    });
  },
  pushEdges: async function (edgesToAdd) {
    return new Promise((resolve) => {
      var chiseInstance = appUtilities.getActiveChiseInstance();
      for (let i = 0; i < edgesToAdd.length; i++) {
        if (
          edgesToAdd[i].properties.class != "belongs_to_submap" &&
          edgesToAdd[i].properties.class != "belongs_to_compartment" &&
          edgesToAdd[i].properties.class != "belongs_to_complex"
        )
          console.log(
            "sending to add Edge:",
            edgesToAdd[i].properties.source,
            edgesToAdd[i].properties.target,
            databaseUtilities.convertLabelToClass(
              edgesToAdd[i].properties.class
            )
          );
        console.log(
          "source:",
          chiseInstance.getCy().getElementById(edgesToAdd[i].properties.source)
        );
        console.log(
          "target:",
          chiseInstance.getCy().getElementById(edgesToAdd[i].properties.target)
        );
        var new_edge = chiseInstance.addEdge(
          edgesToAdd[i].properties.target,
          edgesToAdd[i].properties.source,
          databaseUtilities.convertLabelToClass(edgesToAdd[i].properties.class),
          undefined,
          undefined
        );
        var cy = appUtilities.getActiveCy();
        var vu = cy.viewUtilities("get");
      }
      resolve();
    });
  },

  performLayout: function () {
    $("#perform-static-layout, #perform-static-layout-icon").click();
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
};
module.exports = databaseUtilities;
