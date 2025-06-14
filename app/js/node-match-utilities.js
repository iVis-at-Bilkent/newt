var jquery = ($ = require("jquery"));
var neo4j = require("neo4j-driver");
var _ = require("underscore");

var nodeMatchUtilities = {
  match: function (
    nodeData,
    name,
    matchID,
    macthClass,
    matchLabelForCnt,
    matchMultimer,
    matchCloneMarker,
    matchCloneLabel,
    matchStateVariable,
    matchUnitInformation,
    matchLabel,
    matchParent
  ) {
    //Here we will call all the match conditions
    query = ``;
    and_or = ` and `;
    if (matchID) {
      query = query + nodeMatchUtilities.matchWithID(name, nodeData);
    }
    if (matchLabelForCnt) {
      query =
        query + nodeMatchUtilities.matchWithLabelForCounting(name, nodeData);
    }
    if (matchLabel) {
      query = query + nodeMatchUtilities.matchWithLabel(name, nodeData);
    }
    if (matchMultimer) {
      query =
        query + and_or + nodeMatchUtilities.matchWithMultimer(name, nodeData);
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
    if (matchParent) {
      query =
        query + and_or + nodeMatchUtilities.matchWithParent(name, nodeData);
    }
    if (macthClass) {
      query =
        query + and_or + nodeMatchUtilities.matchWithClass(name, nodeData);
    }

    return query;
  },
  matchProcessNodes: function (
    name,
    nodeData,
    matchSource,
    matchTarget,
    matchModifier,
    matchParent
  ) {
    query = ``;
    and_or = ` or `;
    if (matchParent) {
      query = nodeMatchUtilities.matchWithParent(name, nodeData);
    }
    if (matchParent && (matchSource || matchTarget || matchModifier)) {
      query = query + " and (";
    }
    if (matchParent && matchSource) {
      query =
        query + nodeMatchUtilities.matchProcessNodesSource(name, nodeData);
    }
    if (matchTarget) {
      query =
        query +
        and_or +
        nodeMatchUtilities.matchProcessNodesTarget(name, nodeData);
    }
    if (matchModifier) {
      query =
        query +
        and_or +
        nodeMatchUtilities.matchProcessNodesModifier(name, nodeData);
    }
    query = query + ")";
    return query;
  },
  matchEdges: function (name, nodeData, matchSource, matchTarget) {
    query = ``;
    and_or = ` and `;
    if (matchSource) {
      query = query + nodeMatchUtilities.matchEdgesSource(name, nodeData);
    }
    if (matchTarget) {
      query =
        query + and_or + nodeMatchUtilities.matchEdgesTarget(name, nodeData);
    }
    return query;
  },
  matchWithID: function (name, nodeData) {
    return `${name}.newtId = ${nodeData}.newtID`;
  },
  matchWithLabelForCounting: function (name, nodeData) {
    return `${name}.entityName = ${nodeData}.entityName and not (${nodeData}.class = \\"process\\" or ${nodeData}.class = \\"association\\"  or ${nodeData}.class = \\"dissociation\\")`;
  },
  matchWithLabel: function (name, nodeData) {
    return `${name}.entityName = ${nodeData}.entityName and not (${nodeData}.class = \\\\'process\\\\')`;
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
    return `${name}.stateVariables = ${nodeData}.stateVariables`;
  },
  matchWithUnitInformation: function (name, nodeData) {
    return `${name}.unitsOfInformation = ${nodeData}.unitsOfInformation`;
  },
  matchWithParent: function (name, nodeData) {
    return `${name}.parent = ${nodeData}.parent`;
  },
  matchWithClass: function (name, nodeData) {
    return `${name}.class = ${nodeData}.class`;
  },
  matchProcessNodesSource: function (name, nodeData) {
    return `( ${name}.source_0 = ${nodeData}.source_0) and ((${name}.source_1 ) IS NULL or ${name}.source_1 = ${nodeData}.source_1)`;
  },
  matchProcessNodesTarget: function (name, nodeData) {
    return `( ${name}.target_0 = ${nodeData}.target_0) and ((${name}.target_1 ) IS NULL or ${name}.target_1 = ${nodeData}.target_1)`;
  },
  matchProcessNodesModifier: function (name, nodeData) {
    return `( ${name}.modifier_0 = ${nodeData}.modifier_0) and ((${name}.modifier_1 ) IS NULL or ${name}.modifier_1 = ${nodeData}.modifier_1)`;
  },
  matchEdgesSource: function (name, nodeData) {
    return `${name}.source = ${nodeData}.source`;
  },
  matchEdgesTarget: function (name, nodeData) {
    return `${name}.target = ${nodeData}.target`;
  },
};

module.exports = nodeMatchUtilities;
