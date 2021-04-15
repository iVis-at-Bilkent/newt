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

    cy.contains('button.btn.btn-default', 'ChAT').should('be.visible').invoke('attr', 'onclick')
      .should('eq', "window.open('https://www.genecards.org/cgi-bin/carddisp.pl?gene=ChAT', '_blank')")

  });

  it('TC2: Select simple chemical with label “ADP”', () => {
    loadSample('Neuronal muscle signaling');

    cy.window().then((win) => {
      win.cy.nodes("[label='ADP']").select();
    });

    cy.get('tr.chemical-info.chebi-name').children('td').contains('ADP').should('be.visible');
    cy.get('tr.chemical-info.chemical-description.node-details-summary').children('td').contains("A purine ribonucleoside 5'-diphosphate having adenine as the nucleobase").should('be.visible');
    cy.get('tr.chemical-info.chebi-id').children('td').contains("16761").should('be.visible');
  });

});