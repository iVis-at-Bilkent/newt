/* // This file is only for testing automated way of generating images from EBI biomodels
context('This is not for testing!. Generate images programmatically', () => {

  function fileExport(btnSelector, btnTxt, waitMs = 1000, fileName = 'new_file') {
    cy.get('a.dropdown-toggle').contains('File').click();
    cy.contains('a.dropdown-toggle', 'Export as Image').realHover();

    cy.contains(btnSelector, btnTxt).should('be.visible').click();
    cy.wait(waitMs);

    cy.get('input#file-save-filename').clear();
    cy.get('input#file-save-filename').type(fileName);
    cy.get('button#file-save-accept').contains('Save').click();
    cy.wait(waitMs);
  }

  it('TC1: Select macromolecule with label “ChAT”', () => {
    const newtUrl = 'http://ivis.cs.bilkent.edu.tr/?URL=';
    const ebiUrls = [
      'https://www.ebi.ac.uk/biomodels/model/download/BIOMD0000000168.2?filename=BIOMD0000000168_url.xml',
      'https://www.ebi.ac.uk/biomodels/model/download/BIOMD0000000827.3?filename=Ito2019+-+gefitnib+resistance+of+lung+adenocarcinoma+caused+by+MET+amplification.xml'];
    const newtParams = '&inferNestingOnLoad=true&applyLayoutOnURL=true';

    for (let i = 0; i < ebiUrls.length; i++) {
      const url = newtUrl + ebiUrls[i] + newtParams;
      cy.visit(url);
      cy.wait(3000);
      fileExport('a#save-as-png', 'PNG', 1000, 'file_' + i + '.png');
    }
  });
});

*/