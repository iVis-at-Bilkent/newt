import { URL } from '../constants';

Cypress.on('uncaught:exception', (err) => {
  console.log('UNCAUGHT ERROR:', err.message);
  console.log(err.stack);

  throw err;
});

context('Load from URI/URL', () => {

  it('TC1: URI=http://bioregistry.io/reactome:R-HSA-6803211', () => {
    cy.visit(URL + '?URI=http://bioregistry.io/reactome:R-HSA-6803211');
    cy.wait(2000);
    cy.window().then((win) => {
      expect(win.cy.nodes().length >0).to.eq(true);
      expect(win.cy.edges().length >0).to.eq(true);
    });
  });

  it('TC2: URI=http://bioregistry.io/reactome:R-HSA-70171', () => {
    cy.visit(URL + '?URI=http://bioregistry.io/reactome:R-HSA-70171');
    cy.wait(2000);
    cy.window().then((win) => {
      expect(win.cy.nodes().length > 0).to.eq(true);
      expect(win.cy.edges().length > 0).to.eq(true);
    });
  });

  it('TC3: URL=https://raw.githubusercontent.com/iVis-at-Bilkent/newt/unstable/app/samples/polyq_proteins_interference.nwt', () => {
    cy.visit(URL + '?URL=https://raw.githubusercontent.com/iVis-at-Bilkent/newt/unstable/app/samples/polyq_proteins_interference.nwt');
    cy.wait(2000);
    cy.window().then((win) => {
      cy.log('After 2s - readyState: ' + win.document.readyState);
      cy.log('After 2s - window.cy exists: ' + Boolean(win.cy));
    });

    cy.wait(8000);

    cy.window().then((win) => {
      cy.log('After 10s - readyState: ' + win.document.readyState);
      cy.log('After 10s - window.cy exists: ' + Boolean(win.cy));

      expect(win.cy, 'window.cy after 10 seconds').to.exist;

      expect(win.cy.nodes().length, 'node count').to.be.greaterThan(0);
      expect(win.cy.edges().length, 'edge count').to.be.greaterThan(0);
    });
  });

  it('TC4: URL=https://reactome.org/ContentService/exporter/event/R-HSA-71403.sbgn', () => {
    cy.visit(URL + '?URL=https://reactome.org/ContentService/exporter/event/R-HSA-71403.sbgn');
    cy.wait(2000);
    cy.window().then((win) => {
      expect(win.cy.nodes().length > 0).to.eq(true);
      expect(win.cy.edges().length > 0).to.eq(true);
    });
  });

  it('TC5: URL=https://www.ebi.ac.uk/biomodels/model/download/BIOMD0000000206?filename=BIOMD0000000206_url.xml', () => {
    cy.visit(URL + '?URL=https://www.ebi.ac.uk/biomodels/model/download/BIOMD0000000206?filename=BIOMD0000000206_url.xml');
    cy.wait(2000);
    cy.window().then((win) => {
      expect(win.cy.nodes().length > 0).to.eq(true);
      expect(win.cy.edges().length > 0).to.eq(true);
    });
  });

  it('TC6: URL=https://www.ebi.ac.uk/biomodels/model/download/BIOMD0000000001?filename=BIOMD0000000001_url.xml', () => {
    cy.visit(URL + '?URL=https://www.ebi.ac.uk/biomodels/model/download/BIOMD0000000001?filename=BIOMD0000000001_url.xml');
    cy.wait(2000);
    cy.window().then((win) => {
      expect(win.cy.nodes().length > 0).to.eq(true);
      expect(win.cy.edges().length > 0).to.eq(true);
    });
  });
});