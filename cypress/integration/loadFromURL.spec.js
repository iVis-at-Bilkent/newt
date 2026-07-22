import { URL } from '../constants';

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
      expect(win.cy.nodes().length >0).to.eq(true);
      expect(win.cy.edges().length >0).to.eq(true);
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