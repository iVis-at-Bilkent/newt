var modeHandler = {
  mode: "selection-mode",
  sustainMode: false,
  selectedNodeType: "macromolecule",
  selectedEdgeType: "consumption",
  elementsHTMLNameToName: {
    //nodes
    "macromolecule": "macromolecule",
    "simple-chemical": "simple chemical",
    "complex": "complex",
    "process": "process",
    "omitted-process": "omitted process",
    "uncertain-process": "uncertain process",
    "association": "association",
    "dissociation": "dissociation",
    "phenotype": "phenotype",
    "compartment": "compartment",
    "unspecified-entity": "unspecified entity",
    "nucleic-acid-feature": "nucleic acid feature",
    "source-and-sink": "source and sink",
    "perturbing-agent": "perturbing agent",
    "tag": "tag",
    "and": "and",
    "or": "or",
    "not": "not",
    //edges
    "consumption": "consumption",
    "production": "production",
    "modulation": "modulation",
    "stimulation": "stimulation",
    "catalysis": "catalysis",
    "inhibition": "inhibition",
    "necessary-stimulation": "necessary stimulation",
    "logic-arc": "logic arc",
    "equivalence-arc": "equivalence arc"
  },
  initilize: function () {
    $('#select-icon').addClass('selected-mode');
    $("#first-sbgn-select-node-item").addClass("selected-dd-item");
    $("#first-sbgn-select-edge-item").addClass("selected-dd-item");
    this.setSelectedMenuItem("selection-mode");
  },
  setAddNodeMode: function () {
    if (modeHandler.mode != "add-node-mode") {
      $('#node-dd-list').addClass('selected-mode');

      cy.elements().unselect();

      modeHandler.setSelectedMenuItem("add-node-mode", modeHandler.selectedNodeType);
      modeHandler.mode = "add-node-mode";

      $('#select-icon').removeClass('selected-mode');

      $('#edge-dd-list').removeClass('selected-mode');

      modeHandler.autoEnableMenuItems(false);

      cy.autolock(true);
      cy.autounselectify(true);

      cy.edgehandles('drawoff');
    }
    
    $('.selected-mode-sustainable').removeClass('selected-mode-sustainable');
    modeHandler.sustainMode = false;
  },
  setAddEdgeMode: function () {
    if (modeHandler.mode != "add-edge-mode") {
      $('#edge-dd-list').addClass('selected-mode');
      
      cy.elements().unselect();
      
      modeHandler.setSelectedMenuItem("add-edge-mode", modeHandler.selectedEdgeType);
      modeHandler.mode = "add-edge-mode";

      $('#select-icon').removeClass('selected-mode');
      $('#node-dd-list').removeClass('selected-mode');

      modeHandler.autoEnableMenuItems(false);

      cy.autolock(true);
      cy.autounselectify(true);

      cy.edgehandles('drawon');
    }
    
    $('.selected-mode-sustainable').removeClass('selected-mode-sustainable');
    modeHandler.sustainMode = false;
  },
  setSelectionMode: function () {
    if (modeHandler.mode != "selection-mode") {
      $('#select-icon').addClass('selected-mode');
      modeHandler.setSelectedMenuItem("selection-mode");

      $('#edge-dd-list').removeClass('selected-mode');
      $('#node-dd-list').removeClass('selected-mode');

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
  },
  setSelectedIndexOfSelector: function (mode, value) {
    if(mode == "add-node-mode"){
      $(".selected-mode").removeClass("selected-mode");
      $("#node-dd-list").addClass("selected-mode");
      $("#node-dd-list li").removeClass("selected-dd-item");;
      var ele = $("#node-dd-list [value=" + value + "]");
      var text = $(ele).parent('a').text();
      var src = $(ele).attr('src');
      $("#node-dd-list-set-mode-btn").attr("title", "Create a new " + text);
//      $('#sbgn-selected-node-text').text(text);
      $('#sbgn-selected-node-img').attr('src', src);
      $(ele).parent('a').parent('li').addClass("selected-dd-item");
    }
    else if(mode == "add-edge-mode"){
      $(".selected-mode").removeClass("selected-mode");
      $("#edge-dd-list").addClass("selected-mode");
      $("#edge-dd-list li").removeClass("selected-dd-item");
      var ele = $("#edge-dd-list [value=" + value + "]");
      var text = $(ele).parent('a').text();
      var src = $(ele).attr('src');
      $("#edge-dd-list-set-mode-btn").attr("title", "Create a new " + text);
//      $('#sbgn-selected-edge-text').text(text);
      $('#sbgn-selected-edge-img').attr('src', src);
      $(ele).parent('a').parent('li').addClass("selected-dd-item");
    }
  },
  
  setSelectedMenuItem: function (mode, name) {
    $(".selected-menu-item").removeClass("selected-menu-item");

    if (mode == "selection-mode") {
      $('#select-edit').addClass('selected-menu-item');
    }
    else if (mode == "add-node-mode") {
      $('#add-node-menu-option').addClass('selected-menu-item');
      var menuItem = $("#add-node-submenu [name=" + name + "]");
      menuItem.addClass("selected-menu-item");
      if (menuItem.hasClass("process-type")) {
        $('#process-menu-option').addClass("selected-menu-item");
      }
      if (menuItem.hasClass("logical-operator-type")) {
        $('#logical-operator-menu-option').addClass("selected-menu-item");
      }
    }
    else if (mode == "add-edge-mode") {
      $('#add-edge-menu-option').addClass('selected-menu-item');
      var menuItem = $("#add-edge-submenu [name=" + name + "]");
      menuItem.addClass("selected-menu-item");
    }
  }
};

module.exports = modeHandler;