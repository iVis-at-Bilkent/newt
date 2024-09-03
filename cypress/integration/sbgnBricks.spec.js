import { skipIntro } from '../constants';

context('SBGN Bricks', () => {
  beforeEach(skipIntro);

  function openSBGNBricksModal() {
    cy.get('a.dropdown-toggle').contains('Edit').click();
    cy.get('a#open-sbgn-bricks-modal').should('be.visible').click();
    cy.wait(750);
  }

  function switchToBrick(brickName) {
    cy.get('select#brick-type-select').select(brickName);
  }

  function regulatorCheckboxAssertions(brickId) {
    cy.get(`#${brickId}-regulator-type`).should('be.disabled');
    cy.get(`#${brickId}-regulator-name`).should('be.disabled');
    cy.get(`#${brickId}-multimer-checkbox`).should('be.disabled');
    cy.get(`#${brickId}-multimer-cardinality`).should('be.disabled');

    cy.get(`input#${brickId}-regulator-checkbox`).first().should('be.visible').click();

    cy.wait(500);

    cy.get(`#${brickId}-regulator-type`).should('be.enabled');
    cy.get(`#${brickId}-regulator-name`).should('be.enabled');
    cy.get(`#${brickId}-multimer-checkbox`).should('be.enabled');
  }
  
  it('Render SBGN Bricks Modal', () => {
    
    openSBGNBricksModal();
    
    cy.get('div#sbgn-bricks-table').should('be.visible');
    cy.get('div#sbgn-brick-preview-cy-div').should('be.visible');

    cy.wait(1000);

    cy.get('div#sbgn-brick-preview-cy-div').children().children('canvas').should('be.visible');
    
  });

  it('Add/delete input/output for metabolic reaction', () => {

    openSBGNBricksModal();

    cy.get('img#metabolic-reaction-add-input').click();
    cy.get('img#metabolic-reaction-add-output').click();

    cy.get('table#metabolic-reaction-input-table').children().children().should('have.length', 3);
    cy.get('table#metabolic-reaction-output-table').children().children().should('have.length', 3);
  });

  it('Open metabolic reaction help link', () => {
    
    openSBGNBricksModal();

    const url = 'http://www.sbgnbricks.org/BKO/full/entry/all/BKO:0000585/';

    cy.get('img#sbgn-bricks-help').should('be.visible');

    cy.request(url).then((response) => {
      expect(response.status).to.eq(200);
    });
  });

  it('Create metabolic reaction', () => {
    openSBGNBricksModal();

    cy.get('img#metabolic-reaction-add-input').click();
    cy.get('img#metabolic-reaction-add-output').click();

    cy.get('button#create-sbgn-brick').should('be.visible').click();

    cy.wait(500);

    cy.window().then((win) => {
      expect(win.cy.nodes("[class='simple chemical']").length === 4).to.eq(true);
      expect(win.cy.nodes("[class='process']").length === 1).to.eq(true);
      expect(win.cy.edges("[class='consumption']").length === 2).to.eq(true);
      expect(win.cy.edges("[class='production']").length === 2).to.eq(true);
    });
  });

  it('Create reversible metabolic reaction', () => {
    openSBGNBricksModal();

    cy.get('img#metabolic-reaction-add-input').should('be.visible').click();
    cy.get('img#metabolic-reaction-add-output').should('be.visible').click();
    cy.get('input#metabolic-reaction-reversible-checkbox').should('be.visible').click();

    cy.get('button#create-sbgn-brick').should('be.visible').click();

    cy.wait(500);

    cy.window().then((win) => {
      expect(win.cy.nodes("[class='simple chemical']").length === 4).to.eq(true);
      expect(win.cy.nodes("[class='process']").length === 1).to.eq(true);
      expect(win.cy.edges("[class='production']").length === 4).to.eq(true);
    });
  });
  it('Regulator checkbox is responsive', () => {
    openSBGNBricksModal();

    const brickNames = ["Metabolic Reaction", "Post-Translational Modification", "Multimerization", "Association", "Dissociation"];
    const bricksWithRegulator = ["metabolic-reaction", "conversion", "multimerization", "association", "dissociation"];

    bricksWithRegulator.forEach((id, index) => {
      switchToBrick(brickNames[index]);
      regulatorCheckboxAssertions(id);
    })
  })

});