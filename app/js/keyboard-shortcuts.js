var Mousetrap = require('mousetrap');

module.exports = function() {
  var mt = new Mousetrap();

  mt.bind(["ctrl+z", "command+z"], function () {
    console.log('undo called');
    cy.undoRedo().undo();
  });
  mt.bind(["ctrl+y", "command+y"], function () {
    cy.undoRedo().redo();
  });
  mt.bind(["ctrl+c", "command+c"], function () {
    chise.copyElements(cy.$(":selected"));
  });
  mt.bind(["ctrl+v", "command+v"], function () {
    chise.pasteElements();
  });
  mt.bind(["ctrl+a", "command+a"], function () {
    cy.elements().select();
  });
  mt.bind(["del"], function () {
    chise.deleteElesSimple(cy.elements(':selected'));
  });
  /*  mt.bind(["ctrl", "command"], function () {
   window.ctrlKeyDown = true;
   }, "keydown");
   mt.bind(["ctrl", "command"], function () {
   window.ctrlKeyDown = null;
   disableDragAndDropMode();
   }, "keyup");*/
};