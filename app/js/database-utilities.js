var jquery = $ = require('jquery');
var neo4j = require('neo4j-driver')
var _ = require('underscore');

var databaseUtilities = {
  enableDatabase: true,

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

    processPdEdge: function (currentEdge, data) {
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
        edgesData.push(currentEdge)
        }
    },

    pushActiveContentToDatabase: function(nodesData, edgesData) {

        console.log("about to push")
        var integrationQueryPD = `CREATE (n:Person {name: 'Selbi', title: 'Developer'})`
        var integrationQuery = integrationQueryPD

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
}
module.exports = databaseUtilities;