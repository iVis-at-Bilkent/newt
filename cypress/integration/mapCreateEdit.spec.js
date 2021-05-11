import { loadSample, URL } from './constants';

context('Map creation/editing', () => {
  beforeEach(() => {
    cy.visit(URL);
    // click to dismiss button
    cy.get('a#dismissButton').click();
    // click to hide 
    cy.get('body').click(10, 10);
  });

  function expandCollapse(btnSelector, waitMs = 2000) {
    cy.get('a.dropdown-toggle').contains('View').click();
    cy.contains('a.dropdown-toggle', 'Collapse/Expand').realHover();
    cy.get(btnSelector).should('be.visible').click();
    cy.wait(waitMs);
  }

  //  drag and drop on map is problematic!
  it.skip('TC1: Add process with convenient edges', () => {

    cy.get('div#pd-node-palette').children().children().children('img[title="Macromolecule"]').should('be.visible').click();
    cy.get('body').click(500, 500);
    cy.get('div#pd-node-palette').children().children().children('img[title="Simple Chemical"]').should('be.visible').click();
    cy.get('body').click(500, 600);

    cy.get('div#pd-node-palette').children().children().children('img[title="Process"]').should('be.visible').click();

  });

  it('TC2: Expand/Collapse operations', () => {
    loadSample('Neuronal muscle signaling');
    cy.window().then((win) => {
      win.cy.nodes("[label='synaptic cleft']").select();
    });
    // collapse selected
    expandCollapse('a#collapse-selected');
    cy.window().then((win) => {
      expect(win.cy.nodes().length == 42).to.eq(true);
      expect(win.cy.edges().length == 33).to.eq(true);
    });

    // expand selected
    expandCollapse('a#expand-selected');
    cy.window().then((win) => {
      expect(win.cy.nodes().length == 48).to.eq(true);
      expect(win.cy.edges().length == 38).to.eq(true);
    });

    // Collapse Complexes
    expandCollapse('a#collapse-complexes');
    cy.window().then((win) => {
      expect(win.cy.nodes().length == 41).to.eq(true);
      expect(win.cy.edges().length == 38).to.eq(true);
    });

    // Expand Complexes
    expandCollapse('a#expand-complexes');
    cy.window().then((win) => {
      expect(win.cy.nodes().length == 48).to.eq(true);
      expect(win.cy.edges().length == 38).to.eq(true);
    });

    // Collapse all
    expandCollapse('a#collapse-all');
    cy.window().then((win) => {
      expect(win.cy.nodes().length == 3).to.eq(true);
      expect(win.cy.edges().length == 4).to.eq(true);
    });

    // Collapse all
    expandCollapse('a#expand-all');
    cy.window().then((win) => {
      expect(win.cy.nodes().length == 48).to.eq(true);
      expect(win.cy.edges().length == 38).to.eq(true);
    });
  });

});