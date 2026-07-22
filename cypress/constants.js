export const URL = 'http://localhost/';

export function loadSample(name, waitMs = 1500) {
  cy.get('a.dropdown-toggle').contains('File').click();
  cy.contains('a.dropdown-toggle', 'Samples').realHover();
  cy.contains('a.dropdown-toggle', 'Samples').realHover();
  cy.contains('a', name).should('be.visible').click();
  cy.wait(waitMs);

  cy.window().then((win) => {
    expect(win.cy.nodes().length > 0).to.eq(true);
  });
}

export function skipIntro() {
  cy.visit(URL);
  // click to dismiss button
  cy.get('a#dismissButton').click();
  // click to hide 
  cy.contains('a.introjs-button.introjs-skipbutton', 'Skip').click();
}