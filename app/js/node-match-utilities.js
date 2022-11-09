var jquery = ($ = require("jquery"));
var neo4j = require("neo4j-driver");
var _ = require("underscore");

var nodeMatchUtilities = {
  match: function (nodeData, i, matchNodeType, matchID, matchLabel) {
    //Here we will call all the match conditions
    query = ``;
    if (matchNodeType) {
      query = query + `n${i}:${nodeData.class} {`;
    } else {
      query = query + `n${i} {`;
    }
    if (matchID) {
      query = query + nodeMatchUtilities.matchWithID(nodeData);
    }
    if (matchLabel) {
      query = query + ", " + nodeMatchUtilities.matchWithLabel(nodeData);
    }
    query = query + `}`;
    return query;
  },
  matchWithID: function (nodeData) {
    return `id= '${nodeData.newtId}'`;
  },
  matchWithLabel: function (nodeData) {
    return `label= '${nodeData.entityName}'`;
  },
};

module.exports = nodeMatchUtilities;
