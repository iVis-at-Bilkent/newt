var Mousetrap = require('mousetrap');
var appUtilities = require('./app-utilities');
var modeHandler = require('./app-mode-handler');

module.exports = function () {
  var mt = new Mousetrap();

  mt.bind(["ctrl+z", "command+z"], function () {

    // use active cy instance
    var cy = appUtilities.getActiveCy();

    cy.undoRedo().undo();

    // return false to prevent default browser behavior
    // and stop event from bubbling
    return false;
  });
  mt.bind(["ctrl+y", "command+y"], function () {

    // use active cy instance
    var cy = appUtilities.getActiveCy();

    cy.undoRedo().redo();

    // return false to prevent default browser behavior
    // and stop event from bubbling
    // on chrome -> cmd+y opens history in a new tab
    return false;
  });
  mt.bind(["ctrl+c", "command+c"], function () {

    // use active chise instance
    var chiseInstance = appUtilities.getActiveChiseInstance();

    // get cy associated with active chise instance
    var cy = chiseInstance.getCy();

    chiseInstance.copyElements(cy.$(":selected"));
  });
  mt.bind(["ctrl+v", "command+v"], function () {

    // use active chise instance
    var chiseInstance = appUtilities.getActiveChiseInstance();

    chiseInstance.pasteElements();
  });
  mt.bind(["ctrl+a", "command+a"], function () {

    // use active cy instance
    var cy = appUtilities.getActiveCy();

    cy.elements().select();
    
    // return false to prevent default browser behavior
    // and stop event from bubbling
    return false;
  });
  mt.bind(["del", "backspace"], function () {

    // use active chise instance
    var chiseInstance = appUtilities.getActiveChiseInstance();

    // get cy associated with active chise instance
    var cy = chiseInstance.getCy();

    chiseInstance.deleteElesSimple(cy.elements(':selected'));
    
    if(!chiseInstance.elementUtilities.isGraphTopologyLocked())
    $('#inspector-palette-tab a').tab('show');
    // return false to prevent default browser behavior
    // and stop event from bubbling
    return false;
  });
  mt.bind(["ctrl", "command"], function () {
    appUtilities.ctrlKeyDown = true;
  }, "keydown");
  mt.bind(["ctrl", "command"], function () {
    appUtilities.ctrlKeyDown = null;
    // when cy param is not specified uses active cy instance
    appUtilities.disableDragAndDropMode();
  }, "keyup");

  mt.bind("alt", function() {
    appUtilities.altKeyDown = true;
  }, "keydown");

  mt.bind("alt", function () {
    appUtilities.altKeyDown = null;
  }, "keyup");

  mt.bind(["esc"], function () {

    // use active cy instance
    var cy = appUtilities.getActiveCy();

    modeHandler.setSelectionMode();
    cy.elements().unselect();
  });
};
