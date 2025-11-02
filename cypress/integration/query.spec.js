import { skipIntro } from '../constants';

context('Query', () => {
  beforeEach(skipIntro);

  function pathwaycommons(btnSelector, btnTxt, waitMs = 750) {
    cy.get('a.dropdown-toggle').contains('Database').click();
    cy.get('a#query-pathwaycommons').realHover();
    cy.contains(btnSelector, btnTxt).should('be.visible').click();
    cy.wait(waitMs);
  }

  it('TC1: Query -> Pathway Commons -> Paths Between...', () => {
    pathwaycommons('a#query-pathsbetween', 'Paths Between...');

    cy.get('textarea#query-pathsbetween-gene-symbols').type('BRCA1 BRCA2');
    cy.get('button#save-query-pathsbetween').click();
    cy.wait(7000);
    cy.window().then((win) => {
      expect(win.cy.nodes().length == 421).to.eq(true);
      expect(win.cy.edges().length == 176).to.eq(true);
    });
  });

  it('TC2: Query -> Pathway Commons -> Paths From To...', () => {
    pathwaycommons('a#query-pathsfromto', 'Paths From To...');

    cy.get('textarea#query-pathsfromto-source-symbols').type('BRCA1');
    cy.get('textarea#query-pathsfromto-target-symbols').type('BRCA2');
    cy.get('button#save-query-pathsfromto').click();
    cy.wait(6000);

    cy.window().then((win) => {
      expect(win.cy.nodes().length == 421).to.eq(true);
      expect(win.cy.edges().length == 176).to.eq(true);
    });
  });

  it('TC3: Query -> Pathway Commons -> Common Stream...', () => {
    pathwaycommons('a#query-commonstream', 'Common Stream...');

    cy.get('textarea#query-commonstream-gene-symbols').type('BRCA1 BRCA2');
    cy.get('button#save-query-commonstream').click();
    cy.wait(6000);
    cy.window().then((win) => {
      console.log(win.cy.nodes().length);
      console.log(win.cy.edges().length);
      expect(win.cy.nodes().length == 860).to.eq(true);
      expect(win.cy.edges().length == 284).to.eq(true);
    });
  });

  it('TC4: Query -> Pathway Commons -> Neighborhood...', () => {
    pathwaycommons('a#query-neighborhood', 'Neighborhood...');

    cy.get('textarea#query-neighborhood-gene-symbols').type('BAMBI');
    cy.get('button#save-query-neighborhood').click();
    cy.wait(30000);

    cy.window().then((win) => {
      expect(win.cy.nodes().length == 7156).to.eq(true);
      expect(win.cy.edges().length == 15178).to.eq(true);
    });
  });

  it('TC5: Query -> Pathway Commons -> By URI...', () => {
    pathwaycommons('a#query-pathsbyURI', 'By URI...');

    cy.get('input#query-pathsbyURI-URI').type('http://bioregistry.io/reactome:R-HSA-6803211');
    cy.get('button#save-query-pathsbyURI').click();
    cy.wait(5000);

    cy.window().then((win) => {
      expect(win.cy.nodes().length == 44).to.eq(true);
      expect(win.cy.edges().length == 27).to.eq(true);
    });
  });

});