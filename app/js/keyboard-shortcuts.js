var Mousetrap = require('mousetrap');
var appUtilities = require('./app-utilities');
var modeHandler = require('./app-mode-handler');

module.exports = function () {
  var mt = new Mousetrap();

  mt.bind(["ctrl+z", "command+z"], function () {
    cy.undoRedo().undo();
  });
  mt.bind(["ctrl+y", "command+y"], function () {
    cy.undoRedo().redo();

    // return false to prevent default browser behavior
    // and stop event from bubbling
    // on chrome -> cmd+y opens history in a new tab
    return false;
  });
  mt.bind(["ctrl+c", "command+c"], function () {
    chise.copyElements(cy.$(":selected"));
  });
  mt.bind(["ctrl+v", "command+v"], function () {
    chise.pasteElements();
  });
  mt.bind(["ctrl+a", "command+a"], function () {
    cy.elements().select();
    
    // return false to prevent default browser behavior
    // and stop event from bubbling
    return false;
  });
  mt.bind(["del", "backspace"], function () {
    chise.deleteElesSimple(cy.elements(':selected'));
    
    // return false to prevent default browser behavior
    // and stop event from bubbling
    return false;
  });
  mt.bind(["ctrl", "command"], function () {
    appUtilities.ctrlKeyDown = true;
  }, "keydown");
  mt.bind(["ctrl", "command"], function () {
    appUtilities.ctrlKeyDown = null;
    appUtilities.disableDragAndDropMode();
  }, "keyup");
  mt.bind(["esc"], function () {
    modeHandler.setSelectionMode();
    cy.elements().unselect();
  });
};
