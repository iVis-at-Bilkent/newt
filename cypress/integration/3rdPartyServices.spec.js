context('Other third party services', () => {
  beforeEach(() => {
    cy.visit('http://ivis.cs.bilkent.edu.tr/');
    // click to dismiss button
    cy.get('a#dismissButton').click();
    // click to hide 
    cy.get('body').click(10, 10);
  });

  function loadSample(name, waitMs = 1000) {
    cy.get('a.dropdown-toggle').contains('File').click();
    cy.contains('a.dropdown-toggle', 'Samples').realHover();
    cy.contains('a.dropdown-toggle', 'Samples').realHover();
    cy.contains('a', name).should('be.visible').click();
    cy.wait(waitMs);

    cy.window().then((win) => {
      expect(win.cy.nodes().length > 0).to.eq(true);
    });
  }

  it('TC1: Select macromolecule with label “ChAT”', () => {
    loadSample('Neuronal muscle signaling');

    cy.window().then((win) => {
      win.cy.nodes("[label='ChAT']").select();
    });

    cy.contains('button.btn.btn-default', 'ChAT').should('be.visible').click();

  });

});