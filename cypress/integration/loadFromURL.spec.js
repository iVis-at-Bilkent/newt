import { URL } from '../constants';

context('Load from URI/URL', () => {

  it('TC1: URI=http://identifiers.org/reactome/R-HSA-6803211', () => {
    cy.visit(URL + '?URI=http://identifiers.org/reactome/R-HSA-6803211');
    cy.wait(2000);
    cy.window().then((win) => {
      expect(win.cy.nodes().length == 47).to.eq(true);
      expect(win.cy.edges().length == 27).to.eq(true);
    });
  });

  it('TC2: URL=https://raw.githubusercontent.com/iVis-at-Bilkent/newt/master/app/samples/polyq_proteins_interference.nwt', () => {
    cy.visit(URL + '?URL=https://raw.githubusercontent.com/iVis-at-Bilkent/newt/master/app/samples/polyq_proteins_interference.nwt');
    cy.wait(2000);
    cy.window().then((win) => {
      expect(win.cy.nodes().length == 47).to.eq(true);
      expect(win.cy.edges().length == 30).to.eq(true);
    });
  });

});