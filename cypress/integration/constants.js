export const URL = 'http://localhost';

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