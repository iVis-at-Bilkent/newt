context('Import / Export', () => {
  beforeEach(() => {
    cy.visit('http://localhost');
  });

  function isLoading() {
    const spinnerClasses = 'fa fa-spinner fa-spin fa-3x fa-fw';
  }

  it('File -> Import -> Simple AF', () => {

    // click to dismiss button
    cy.get('a#dismissButton').click();
    // click to hide 
    cy.get('body').click(10, 10);

    cy.get('a.dropdown-toggle').contains('File').click();

    cy.contains('a.dropdown-toggle', 'Import')
      .realHover();                                       // from cypress-real-events

    cy.contains('a#import-simple-af-file', 'Simple AF')
      .should('be.visible')                               // add a visibility retry here
      .click();

    cy.get('input#simple-af-file-input').attachFile('Newt_AF_sample_input.txt');

    cy.wait(1000);

    cy.window().then((win) => {
      // call whatever you want on your app's window
      // so your app methods must be exposed somehow
      expect(win.cy.nodes().length > 0).to.eq(true);
    })

  });
});