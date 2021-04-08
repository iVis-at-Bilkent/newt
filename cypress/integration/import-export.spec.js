context('Import / Export', () => {
  beforeEach(() => {
    cy.visit('http://ivis.cs.bilkent.edu.tr/');
    // click to dismiss button
    cy.get('a#dismissButton').click();
    // click to hide 
    cy.get('body').click(10, 10);

  });

  it('TC1: File -> Import -> Simple AF', () => {
    cy.get('a.dropdown-toggle').contains('File').click();

    cy.contains('a.dropdown-toggle', 'Import')
      .realHover();                                       // from cypress-real-events

    cy.contains('a#import-simple-af-file', 'Simple AF')
      .should('be.visible')                               // add a visibility retry here
      .click();

    cy.get('input#simple-af-file-input').attachFile('Newt_AF_sample_input.txt');

    cy.wait(1000);

    cy.window().then((win) => {
      expect(win.cy.nodes().length > 0).to.eq(true);
    });
  });

  it('TC2: File -> Import -> SIF', () => {
    cy.get('a.dropdown-toggle').contains('File').click();

    cy.contains('a.dropdown-toggle', 'Import')
      .realHover();                                       // from cypress-real-events

    cy.contains('a#import-sif-file', 'SIF')
      .should('be.visible')                               // add a visibility retry here
      .click();

    cy.get('input#sif-file-input').attachFile('signaling-downstream-of-AKT2-3.nwt');

    cy.wait(1000);

    cy.window().then((win) => {
      expect(win.cy.nodes().length > 0).to.eq(true);
    });
  });


});