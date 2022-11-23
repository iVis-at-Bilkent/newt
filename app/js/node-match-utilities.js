var jquery = ($ = require("jquery"));
var neo4j = require("neo4j-driver");
var _ = require("underscore");

var nodeMatchUtilities = {
  match: function (
    nodeData,
    name,
    matchID,
    matchLabel,
    matchMultimer,
    matchCloneMarker,
    matchCloneLabel,
    matchStateVariable,
    matchUnitInformation
  ) {
    //Here we will call all the match conditions
    console.log("nodeData", nodeData);
    query = ``;
    and_or = ` and `;
    if (matchID) {
      query = query + nodeMatchUtilities.matchWithID(name, nodeData);
    }
    if (matchLabel) {
      query = query + nodeMatchUtilities.matchWithLabel(name, nodeData);
    }
    if (matchMultimer) {
      query = query + nodeMatchUtilities.matchWithMultimer(name, nodeData);
    }
    if (matchCloneMarker) {
      query =
        query +
        and_or +
        nodeMatchUtilities.matchWithCloneMarker(name, nodeData);
    }
    if (matchCloneLabel) {
      query =
        query + and_or + nodeMatchUtilities.matchWithCloneLabel(name, nodeData);
    }
    if (matchStateVariable) {
      query =
        query +
        and_or +
        nodeMatchUtilities.matchWithStateVariables(name, nodeData);
    }
    if (matchUnitInformation) {
      query =
        query +
        and_or +
        nodeMatchUtilities.matchWithUnitInformation(name, nodeData);
    }

    return query;
  },
  matchWithID: function (name, nodeData) {
    return `${name}.newtId = ${nodeData}.newtID`;
  },
  matchWithLabel: function (name, nodeData) {
    if (nodeData.class == "process") {
      return false;
    }
    return `${name}.entityName = ${nodeData}.entityName`;
  },
  matchWithMultimer: function (name, nodeData) {
    return `${name}.multimer = ${nodeData}.multimer`;
  },
  matchWithCloneMarker: function (name, nodeData) {
    return `${name}.cloneMarker = ${nodeData}.cloneMarker`;
  },
  matchWithCloneLabel: function (name, nodeData) {
    return `${name}.cloneLabel = ${nodeData}.cloneLabel`;
  },
  matchWithStateVariables: function (name, nodeData) {
    return `size(${name}.stateVariables) = ${nodeData.stateVariables.length}`;
  },
  matchWithUnitInformation: function (name, nodeData) {
    return `size(${name}.unitsOfInformation) = ${nodeData.unitsOfInformation.length}`;
  },
};

module.exports = nodeMatchUtilities;
