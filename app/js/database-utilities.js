var nodeMatchUtilities = require("./node-match-utilities");
var graphALgos = require("./graph-algos");
var appUtilities = require("./app-utilities");
const { ActiveTabPushSuccessView } = require("./backbone-views");

var databaseUtilities = {
  enableDatabase: true,
  nodesInDB: {},
  edgesInDB: {},

  cleanNodesAndEdgesInDB: function()
  {
    databaseUtilities.nodesInDB = {};
    databaseUtilities.edgesInDB= {};
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

  pushActiveContentToDatabase: async function (activeTabContent) {
    var nodesData = [];
    var edgesData = [];
    await databaseUtilities.processNodesData(nodesData, activeTabContent)
    await databaseUtilities.processEdgesData(edgesData, activeTabContent);
    await databaseUtilities.processData(nodesData, edgesData);
    console.log("nodes and edge shave been processed");
    databaseUtilities.pushActiveNodesEdgesToDatabase(nodesData, edgesData);
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

  pushActiveNodesEdgesToDatabase: function (nodesData, edgesData) {
    var matchClass = true;
    var matchLabel = true;
    var matchId = false;
    var matchMultimer = true;
    var matchCloneMarker = true;
    var matchCloneLabel = true;
    var matchStateVariable = true;
    var matchUnitInformation = true;
    var matchParent = true;

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
          CALL apoc.do.when( data.isSpecial, 
            \\"MATCH (u)
            WHERE ${nodeMatchUtilities.matchProcessNodes(
              "data",
              "u",
              true,
              true,
              true,
              true
            )}
            RETURN COUNT(u) as cnt\\",
            \\"MATCH (u)
            WHERE  ${nodeMatchUtilities.match(
              "data",
              "u",
              matchId,
              matchClass,
              false,
              matchMultimer,
              matchCloneMarker,
              matchCloneLabel,
              matchStateVariable,
              matchUnitInformation,
              true,
              matchParent
            )}
            RETURN COUNT(u) as cnt\\", 
          {data:data}) 
          YIELD value
          RETURN value.cnt as cnt', {data: data})
          YIELD value
        WITH value.cnt as cnt, data
        CALL
        apoc.cypher.doIt('
          CALL apoc.do.when( cnt > 0, \\"MATCH (u) WHERE ${nodeMatchUtilities.match(
            "data",
            "u",
            matchId,
            matchClass,
            false,
            matchMultimer,
            matchCloneMarker,
            matchCloneLabel,
            matchStateVariable,
            matchUnitInformation,
            true,
            matchParent
          )} RETURN u.newtId as id \\", \\"RETURN null as id\\",
                {data:data, cnt: cnt}) 
                YIELD value
                RETURN value.id as id', 
          {data:data, cnt: cnt} )
        YIELD value
        WITH value.id as id, data
        CALL
        apoc.cypher.doIt('
              CALL apoc.do.when(id is not null , \\"
              MATCH (n)
              WHERE n.newtId = id
              SET n.newtId = data.newtId\\",
              \\"CALL apoc.create.node([data.class], data)
              YIELD node
              SET node.processed = 0
              RETURN node as node\\", {data: data, id:id})
              YIELD value
              RETURN value.node as node
            ', {data:data, id: id})
            YIELD value
            RETURN value.node as node",
      {data:data})
    YIELD value
    WITH collect(value.node) as nodes
    CALL 
    apoc.cypher.doIt("
      UNWIND $edgesData AS data 
      CALL apoc.do.when(data.inDb,
        'RETURN null as rel',
        'CALL  apoc.cypher.doIt(\\"MATCH (a)-[r]->(b)
          WHERE ${nodeMatchUtilities.matchEdges("r", "data", true, true)}
          RETURN COUNT(r) as cnt \\", {data:data})
          YIELD value
        WITH value.cnt as cnt, data
        CALL apoc.do.when(cnt>0 , \\" RETURN 1 as rel\\",
              \\"MATCH (n {newtId: data.source}), (m { newtId: data.target})  
               WITH DISTINCT n, m, data
              CALL apoc.create.relationship(n,data.class,data,m) YIELD rel  
               WITH rel
          SET rel.processed = 0
          RETURN rel as rel \\", {data:data})
         YIELD value
         RETURN value.rel as rel',
        {data: data}
      )
      YIELD value
      RETURN collect(value.rel) as rel
      ",
      {edgesData: $edgesData})
    YIELD value
    RETURN nodes as nodes, value.rel as edges`;

    var queryData = { nodesData: nodesData, edgesData: edgesData };
    var data = { query: integrationQuery, queryData: queryData };
    console.log('hiii');
    $.ajax({
      type: "post",
      url: "/utilities/runDatabaseQuery",
      contentType: "application/json; charset=utf-8",
      data: JSON.stringify(data),
      success: function (data) {
        let nodes = data.records[0]._fields[0];
        let edges = data.records[0]._fields[1];

        if (nodes) {
          for (let i = 0; i < nodes.length; i++) {
            if (nodes[i].properties) {
              databaseUtilities.nodesInDB[nodes[i].properties.newtId] =
                nodes[i].identity.low;
            } else if (nodes[i].newtId) {
              databaseUtilities.nodesInDB[nodes[i].newtId] =
                nodes[i].identity.low;
            }
          }
        }
        // console.log('data',data);
        if (edges) {
          for (let i = 0; i < edges.length; i++) {
            if(edges[i].properties){
              databaseUtilities.edgesInDB[
                [
                  edges[i].properties.source,
                  edges[i].properties.target,
                  edges[i].properties.class,
                ]
              ] = edges[i].identity.low;
            }
          }
        }
        console.log("hiii");
        // new PromptInvalidQueryView({el: '#prompt-invalidQuery-table'}).render();
        // new ActiveTabPushSuccessView({
        //   el:'#prompt-confirmation-table',
        //   }).render();
        console.log("hiii2");
      },
      error: function (req, status, err) {
        console.error("Error running query", status, err);
      },
    });
  },
  convertLabelToClass: function(label)
  {
    var repl =label.replace("_"," ")
    return repl
  },

  getNodesRecursively:  function(nodesToAdd)
  {
    return new Promise(async function(resolve, reject) {
    
    var parentsToGet = new Set()
    var children = [];
    for (let i = 0; i < nodesToAdd.length; i++)
    {
      if (nodesToAdd[i].properties.parent && nodesToAdd[i].properties.parent != 'none' )
      {
        parentsToGet.add(nodesToAdd[i].properties.parent)
        children.push(nodesToAdd[i])
      }
      else
      {
        await databaseUtilities.pushNode(nodesToAdd[i])
      }
    }

    parentsToGet = [...parentsToGet]
    
    var queryData = { parentsToGet: parentsToGet };

    var query = `UNWIND $parentsToGet as parent
                  MATCH (u)
                  WHERE u.newtId = parent
                  RETURN u`
    var data = { query: query, queryData: queryData };

     $.ajax({
      type: "post",
      url: "/utilities/runDatabaseQuery",
      contentType: "application/json; charset=utf-8",
      data: JSON.stringify(data),
      success: async function (data) {
        if (data.records.length == 0)
        {
          resolve();
        }
        let counter = 0;
        for(let i = 0; i < data.records.length; i++)
        {
          var fields = data.records[i]._fields
          var parents = []
          parents.push(fields[0])
          databaseUtilities.getNodesRecursively(parents).then(() => {
            counter ++;
            if (counter == data.records.length)
            {
              for(let i = 0; i < children.length; i++)
              {
                databaseUtilities.pushNode(children[i])
              }
              resolve();
            }
           
          })
        }
       
      },
      error: function (req, status, err) {
        console.error("Error running query", status, err);
      },
      
    })
    
  });

  },
  
  pushNode:  function(new_node)
  {
    return new Promise(resolve => {

    if (!databaseUtilities.nodesInDB[new_node.properties.newtId])
    {
    var chiseInstance = appUtilities.getActiveChiseInstance();

      var nodeParams = {
        class: databaseUtilities.convertLabelToClass(new_node.properties.class),
        language: "PD",
        label: "smth"
      };


      var node =   chiseInstance.addNode(
        0,
        0,
        nodeParams,
        new_node.properties.newtId,
        new_node.properties.parent
      );

      if(new_node.properties.entityName)
      {
        chiseInstance.changeNodeLabel(node, new_node.properties.entityName);
      }

      databaseUtilities.nodesInDB[new_node.properties.newtId] =
      new_node.identity.low;
      var el = cy.getElementById(new_node.properties.newtId)
      var vu = cy.viewUtilities('get');
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
          newtIdOfNodes.push(data.records[i]._fields[1])
        }
      },
      error: function (req, status, err) {
        console.error("Error running query", status, err);
      },
    });
  },

  addNodesEdgesToCy: async function (nodes, edges,source, target) {
    return new Promise(resolve => {
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

    databaseUtilities.getNodesRecursively(nodesToAdd).then(async function() {
      return databaseUtilities.pushEdges(edgesToAdd);
    }).then(function() {

      //Add color scheme for map
      $("#map-color-scheme_greyscale").click()
      $("#color-scheme-inspector-style-select").val('3D')
      $("#color-scheme-inspector-style-select").change()


      //Add highlights
      if (source != null)
      {
        for (let i = 0; i < source.length; i++)
        {
          var cy = appUtilities.getActiveCy();
          var el = cy.getElementById(source[i])
          var vu = cy.viewUtilities('get');
          vu.highlight(el, 3);
        }
      }

      if ( target != null)
      {
        for (let i = 0; i < target.length; i++)
        {
          var cy = appUtilities.getActiveCy();
          var el = cy.getElementById(target[i])
          var vu = cy.viewUtilities('get');
          vu.highlight(el, 5);
        }
      }
       
      //Run layout
      databaseUtilities.performLayout();
    });

  
 
     return {nodesToHighlight: nodesToHighlight, edgesToHighlight: edgesToHighlight}
  });
  },
  pushEdges: async function(edgesToAdd)
  {
    return new Promise(resolve => {
 
      var chiseInstance = appUtilities.getActiveChiseInstance();
    for (let i = 0; i < edgesToAdd.length; i++) {
      if (
        edgesToAdd[i].properties.class != "belongs_to_submap" &&
        edgesToAdd[i].properties.class != "belongs_to_compartment" &&
        edgesToAdd[i].properties.class != "belongs_to_complex"
      )
        var new_edge = chiseInstance.addEdge(
          edgesToAdd[i].properties.source,
          edgesToAdd[i].properties.target,
          databaseUtilities.convertLabelToClass(edgesToAdd[i].properties.class),
          undefined,
          undefined
        );
        var cy = appUtilities.getActiveCy();
        var vu = cy.viewUtilities('get');
        vu.highlight(new_edge, 4);

    }
      resolve();
    });
    
  },

  performLayout: function()
  {
    $("#perform-static-layout, #perform-static-layout-icon").click()
  },

  runPathsFromTo: async function (sourceArray, targetArray, limit) {
    var sourceId = []
    var sourceNewt = []
    await databaseUtilities.getIdOfLabeledNodes(sourceArray, sourceId, sourceNewt);

    var targetId = []
    var targetNewt = []
    await databaseUtilities.getIdOfLabeledNodes(targetArray, targetId, targetNewt);

    //Check if any nodes with such labels
    if (sourceId.length == 0 && targetId > 0)
    {
      var errMessage = {err: "Invalid input", message: "No such source nodes"}
      return errMessage;
    }
    if (sourceId.length > 0 && targetId == 0)
    {
      var errMessage = {err: "Invalid input", message: "No such target nodes"}
      return errMessage;
    }
    if (sourceId.length == 0 && targetId == 0)
    {
      var errMessage = {err: "Invalid input", message: "No such source and target nodes"}
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
        if (data.records.length == 0)
       {
         result.err = {err: "Invalid input", message: "No data returned"}
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
       databaseUtilities.addNodesEdgesToCy(nodes, edges, sourceNewt, targetNewt)
      
        
      },
      error: function (req, status, err) {
        console.error("Error running query", status, err);
      },
    });
  },

  runPathBetween: async function (labelOfNodes, lengthLimit) {

    var idOfNodes = [];
    var newtIdOfNodes = [];
    await databaseUtilities.getIdOfLabeledNodes(labelOfNodes, idOfNodes, newtIdOfNodes);
    
    //Check if label of nodes are valid
    if (idOfNodes.length == 0)
    {
      var errMessage = {err: "Invalid input", message: "No such nodes with given labels"}
      return errMessage
    } 

    var query = graphALgos.pathsBetween( lengthLimit);
    var queryData = { idList: idOfNodes };

    var data = { query: query, queryData: queryData };
    console.log("data being sent:",data);
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
       if (data.records.length == 0)
       {
         result.err = {err: "Invalid input", message: "No data returned"}
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
    var newtIdList = []
    await databaseUtilities.getIdOfLabeledNodes(labelOfNodes, idList, newtIdList);
    var setOfSources = new Set(newtIdList);

    if (idList.length == 0)
    {
      var errMessage = {err: "Invalid input", message: "No such nodes with given labels"}
      return errMessage
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
        if (data.records.length == 0)
       {
         result.err = {err: "Invalid input", message: "No such nodes with given labels"}
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
              if (!setOfSources.has(fields[0][j].properties.newtId) && !fields[0][j].properties.class.startsWith("process"))
              {
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
        await databaseUtilities.addNodesEdgesToCy(nodes, edges, newtIdList, targetNodes);
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

    if (idOfNodes.length == 0)
    {
      var errMessage = {err: "Invalid input", message: "No such nodes with given labels"}
      return errMessage
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
        if (data.records.length == 0)
       {
         result.err = {err: "Invalid input", message: "No data returned"}
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

