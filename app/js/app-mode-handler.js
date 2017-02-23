var modeHandler = {
  mode: "selection-mode",
  sustainMode: false,
  selectedNodeType: "macromolecule",
  selectedEdgeType: "consumption",
  // Initilize mode handler
  initilize: function () {
    $('#select-mode-icon').addClass('selected-mode'); // Initial mode is selection mode.
    // Node/edge palettes should be initialized with the first members of them and they should have dashed borders.
    $('.node-palette img').addClass('dashed-border');
    $('.edge-palette img').addClass('dashed-border');
    $('.node-palette img').first().addClass('selected-mode');
    $('.edge-palette img').first().addClass('selected-mode');
  },
  // Set the current mode to add node mode, if nodeType is specified than switch the current node type to the given value,
  // if the nodeType will remain same, add node mode is already enabled and sustain mode is not set before, then set the sustain mode
  // so that users will be able to add the current node type in a sustainable way.
  setAddNodeMode: function (nodeType) {
    var typeChange = nodeType && nodeType != modeHandler.selectedNodeType; // See if the type will change
    
    // Handle sustainable mode
    $('.selected-mode-sustainable').removeClass('selected-mode-sustainable');
    if (!typeChange && modeHandler.mode == "add-node-mode" && !modeHandler.sustainMode) {
      modeHandler.sustainMode = true;
      $('#add-node-mode-icon').addClass('selected-mode-sustainable');
    }
    else {
      modeHandler.sustainMode = false;
    }
    
    if (modeHandler.mode != "add-node-mode") {
      cy.elements().unselect();
      modeHandler.mode = "add-node-mode";

      $('#select-mode-icon').removeClass('selected-mode');
      $('#add-edge-mode-icon').removeClass('selected-mode');
      $('#add-node-mode-icon').addClass('selected-mode');
      $('.node-palette img').removeClass('dashed-border');
      $('.edge-palette img').addClass('dashed-border');

      modeHandler.autoEnableMenuItems(false);

      cy.autolock(true);
      cy.autounselectify(true);

      cy.edgehandles('drawoff');
    }
    
    // Check if there is a needed type change if there is perform it.
    if ( typeChange ) {
      modeHandler.selectedNodeType = nodeType;
    }
  },
  // Set the current mode to add edge mode, if edgeType is specified than switch the current edge type to the given value,
  // if the edgeType will remain same, add edge mode is already enabled and sustain mode is not set before, then set the sustain mode
  // so that users will be able to add the current edge type in a sustainable way.
  setAddEdgeMode: function (edgeType) {
    var typeChange = edgeType && edgeType != modeHandler.selectedEdgeType; // See if the type will change
    
    // Handle sustainable mode
    $('.selected-mode-sustainable').removeClass('selected-mode-sustainable');
    if (!typeChange && modeHandler.mode == "add-edge-mode" && !modeHandler.sustainMode) {
      modeHandler.sustainMode = true;
      $('#add-edge-mode-icon').addClass('selected-mode-sustainable');
    }
    else {
      modeHandler.sustainMode = false;
    }
    
    if (modeHandler.mode != "add-edge-mode") {
      cy.elements().unselect();
      modeHandler.mode = "add-edge-mode";

      $('#select-mode-icon').removeClass('selected-mode');
      $('#add-edge-mode-icon').addClass('selected-mode');
      $('#add-node-mode-icon').removeClass('selected-mode');
      $('.node-palette img').addClass('dashed-border');
      $('.edge-palette img').removeClass('dashed-border');

      modeHandler.autoEnableMenuItems(false);

      cy.autolock(true);
      cy.autounselectify(true);

      cy.edgehandles('drawon');
    }
    
    // Check if there is a needed type change if there is perform it.
    if ( typeChange ) {
      modeHandler.selectedEdgeType = edgeType;
    }
  },
  // Set selection mode, disables sustainable mode.
  setSelectionMode: function () {
    if (modeHandler.mode != "selection-mode") {
      $('#select-mode-icon').addClass('selected-mode');
      $('#add-edge-mode-icon').removeClass('selected-mode');
      $('#add-node-mode-icon').removeClass('selected-mode');
      $('.node-palette img').addClass('dashed-border');
      $('.edge-palette img').addClass('dashed-border');

      modeHandler.autoEnableMenuItems(true);

      modeHandler.mode = "selection-mode";
      cy.autolock(false);
      cy.autounselectify(false);

      cy.edgehandles('drawoff');
    }
    
    $('.selected-mode-sustainable').removeClass('selected-mode-sustainable');
    modeHandler.sustainMode = false;
  },
  autoEnableMenuItems: function (enable) {
    if (enable) {
      $("#expand-selected").parent("li").removeClass("disabled");
      $("#collapse-selected").parent("li").removeClass("disabled");
      $("#expand-all").parent("li").removeClass("disabled");
      $("#collapse-all").parent("li").removeClass("disabled");
      $("#perform-layout").parent("li").removeClass("disabled");
      $("#delete-selected-simple").parent("li").removeClass("disabled");
      $("#delete-selected-smart").parent("li").removeClass("disabled");
      $("#hide-selected").parent("li").removeClass("disabled");
      $("#show-selected").parent("li").removeClass("disabled");
      $("#show-all").parent("li").removeClass("disabled");
      $("#make-compound-complex").parent("li").removeClass("disabled");
      $("#make-compound-compartment").parent("li").removeClass("disabled");
      $("#neighbors-of-selected").parent("li").removeClass("disabled");
      $("#processes-of-selected").parent("li").removeClass("disabled");
      $("#remove-highlights").parent("li").removeClass("disabled");
    }
    else{
      $("#expand-selected").parent("li").addClass("disabled");
      $("#collapse-selected").parent("li").addClass("disabled");
      $("#expand-all").parent("li").addClass("disabled");
      $("#collapse-all").parent("li").addClass("disabled");
      $("#perform-layout").parent("li").addClass("disabled");
      $("#delete-selected-simple").parent("li").addClass("disabled");
      $("#delete-selected-smart").parent("li").addClass("disabled");
      $("#hide-selected").parent("li").addClass("disabled");
      $("#show-selected").parent("li").addClass("disabled");
      $("#show-all").parent("li").addClass("disabled");
      $("#make-compound-complex").parent("li").addClass("disabled");
      $("#make-compound-compartment").parent("li").addClass("disabled");
      $("#neighbors-of-selected").parent("li").addClass("disabled");
      $("#processes-of-selected").parent("li").addClass("disabled");
      $("#remove-highlights").parent("li").addClass("disabled");
    }
  }
};

module.exports = modeHandler;