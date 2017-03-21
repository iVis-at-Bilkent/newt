var jquery = $ = require('jquery');

var appUndoActions = {};

appUndoActions.test = function (param) {
	console.log("test");
};

appUndoActions.changeDataDirty = function (param) {
  var result = {
  };
  var eles = param.eles; // a pure array of nodes, not a cy collection
  result.name = param.name;
  result.valueMap = {};
  result.eles = eles;

  for (var i = 0; i < eles.length; i++) {
    var ele = eles[i];
    result.valueMap[ele.id()] = ele._private.data[param.name];
  }

  //elementUtilities.changeData(param.eles, param.name, param.valueMap);
  if ( typeof param.valueMap === 'object' ) {
    cy.startBatch();
    for (var i = 0; i < eles.length; i++) {
      var ele = eles[i];
      ele._private.data[param.name] = param.valueMap[ele.id()];
    }
    cy.endBatch();
  }
  else {
    eles._private.data[param.name] = param.valueMap;
  }

  return result;
};




module.exports = appUndoActions;