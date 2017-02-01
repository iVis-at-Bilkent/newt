var jQuery = $ = require('jQuery');
var BackboneViews = require('./backbone-views');
var appUtilities = require('./app-utilities');
var modeHandler = require('./app-mode-handler');

// Handle sbgnviz menu functions which are to be triggered on events
module.exports = function () {
  var dynamicResize = appUtilities.dynamicResize.bind(appUtilities);
  
  var layoutPropertiesView, generalPropertiesView, pathsBetweenQueryView, promptSaveView;

  function loadSample(filename) {
    return chise.loadSample(filename, 'app/samples/');
  }

  $(document).ready(function ()
  {
    console.log('init the sbgnviz template/page');
    
    $(window).on('resize', dynamicResize);
    dynamicResize();

    layoutPropertiesView = appUtilities.layoutPropertiesView = new BackboneViews.LayoutPropertiesView({el: '#layout-properties-table'});
    generalPropertiesView = appUtilities.generalPropertiesView = new BackboneViews.GeneralPropertiesView({el: '#general-properties-table'});
    pathsBetweenQueryView = appUtilities.pathsBetweenQueryView = new BackboneViews.PathsBetweenQueryView({el: '#query-pathsbetween-table'});
    promptSaveView = appUtilities.promptSaveView = new BackboneViews.PromptSaveView({el: '#prompt-save-table'});

    toolbarButtonsAndMenu();
    modeHandler.initilize();

    // loadSample is called before the container is resized in dynamicResize function, so we need to wait
    // wait until it is resized before loading the default sample. As the current solution we set a 100 ms 
    // time out before loading the default sample. 
    // TODO search for a better way.
    setTimeout(function(){
      loadSample('neuronal_muscle_signalling.xml');
    }, 100);
  });
  
  // Events triggered by sbgnviz module
  $(document).on('sbgnvizLoadSample sbgnvizLoadFile', function(event, filename) {
    appUtilities.setFileContent(filename);
  });
  
  $(document).on('updateGraphEnd', function(event) {
    appUtilities.resetUndoRedoButtons();
    modeHandler.setSelectionMode();
  });

  function toolbarButtonsAndMenu() {

    $("#new-file, #new-file-icon").click(function () {
      var createNewFile = function () {
        appUtilities.setFileContent("new_file.sbgnml");
        
        chise.updateGraph({
          nodes: [],
          edges: []
        });
      };

      promptSaveView.render(createNewFile);
    });

    $("#load-file, #load-file-icon").click(function () {
      $("#file-input").trigger('click');
    });

    $("#file-input").change(function () {
      if ($(this).val() != "") {
        var file = this.files[0];
        chise.loadSBGNMLFile(file);
        $(this).val("");
      }
    });

    $("#node-legend").click(function (e) {
      e.preventDefault();
      $("#node_legend_modal").modal('show');
    });

    $("#edge-legend").click(function (e) {
      e.preventDefault();
      $("#edge_legend_modal").modal('show');
    });

    $("#quick-help").click(function (e) {
      e.preventDefault();
      $("#quick_help_modal").modal('show');
    });

    $("#about").click(function (e) {
      e.preventDefault();
      $("#about_modal").modal('show');
    });

    var selectorToSampleFileName = {
      "#load-sample1" : 'neuronal_muscle_signalling.xml',
      "#load-sample2" : 'CaM-CaMK_dependent_signaling_to_the_nucleus.xml',
      "#load-sample3" : 'activated_stat1alpha_induction_of_the_irf1_gene.xml',
      "#load-sample4" : 'glycolysis.xml',
      "#load-sample5" : 'mapk_cascade.xml',
      "#load-sample6" : 'polyq_proteins_interference.xml',
      "#load-sample7" : 'insulin-like_growth_factor_signaling.xml',
      "#load-sample8" : 'atm_mediated_phosphorylation_of_repair_proteins.xml',
      "#load-sample9" : 'vitamins_b6_activation_to_pyridoxal_phosphate.xml'
    };

    for ( var selector in selectorToSampleFileName ) {
      (function(selector){
        $(selector).click(function (e) {
          loadSample(selectorToSampleFileName[selector]);
        });
      })(selector);
    }

    $("#hide-selected, #hide-selected-icon").click(function(e) {
      chise.hideNodesSmart(cy.nodes(":selected"));
    });
    
    $("#show-selected, #show-selected-icon").click(function(e) {
      chise.showNodesSmart(cy.nodes(":selected"));
    });

    $("#show-all").click(function (e) {
      chise.showAll();
    });

    $("#delete-selected-smart, #delete-selected-smart-icon").click(function (e) {
      chise.deleteNodesSmart(cy.nodes(':selected'));
    });

    $("#highlight-neighbors-of-selected, #highlight-neighbors-of-selected-icon").click(function (e) {
      chise.highlightNeighbours(cy.nodes(':selected'));
    });

    $("#search-by-label-icon").click(function (e) {
      var label = $("#search-by-label-text-box").val().toLowerCase();
      chise.searchByLabel(label);
    });

    $("#search-by-label-text-box").keydown(function (e) {
      if (e.which === 13) {
        $("#search-by-label-icon").trigger('click');
      }
    });

    $("#highlight-search-menu-item").click(function (e) {
      $("#search-by-label-text-box").focus();
    });

    $("#highlight-processes-of-selected").click(function (e) {
      chise.highlightProcesses(cy.nodes(':selected'));
    });

    $("#remove-highlights, #remove-highlights-icon").click(function (e) {
      chise.removeHighlights();
    });

    $("#layout-properties, #layout-properties-icon").click(function (e) {
      layoutPropertiesView.render();
    });

    $("#delete-selected-simple, #delete-selected-simple-icon").click(function (e) {
      chise.deleteElesSimple(cy.elements(':selected'));
    });

    $("#general-properties, #properties-icon").click(function (e) {
      generalPropertiesView.render();
    });

    $("#query-pathsbetween").click(function (e) {
      pathsBetweenQueryView.render();
    });

    $("#collapse-selected,#collapse-selected-icon").click(function (e) {
      chise.collapseNodes(cy.nodes(":selected"));
    });

    $("#expand-selected,#expand-selected-icon").click(function (e) {
      chise.expandNodes(cy.nodes(":selected"));
    });

    $("#collapse-complexes").click(function (e) {
      chise.collapseComplexes();
    });
    $("#expand-complexes").click(function (e) {
      chise.expandComplexes();
    });

    $("#collapse-all").click(function (e) {
      chise.collapseAll();
    });

    $("#expand-all").click(function (e) {
      chise.expandAll();
    });

    $("#perform-layout, #perform-layout-icon").click(function (e) {
      // TODO think whether here is the right place to start the spinner
      chise.startSpinner("layout-spinner"); 
      
      // If 'animate-on-drawing-changes' is false then animate option must be 'end' instead of false
      // If it is 'during' use it as is 
      var preferences = {
        animate: appUtilities.getGeneralProperties().animateOnDrawingChanges ? 'end' : false
      };
      if (appUtilities.getLayoutProperties().animate == 'during') {
        delete preferences.animate;
      }
      layoutPropertiesView.applyLayout(preferences);
    });

    $("#undo-last-action, #undo-icon").click(function (e) {
      cy.undoRedo().undo();
    });

    $("#redo-last-action, #redo-icon").click(function (e) {
      cy.undoRedo().redo();
    });

    $("#save-as-png").click(function (evt) {
      chise.saveAsPng(); // the default filename is 'network.png'
    });

    $("#save-as-jpg").click(function (evt) {
      chise.saveAsJpg(); // the default filename is 'network.jpg'
    });

    //TODO: could simply keep/store original input SBGN-ML data and use it here instead of converting from JSON
    $("#save-as-sbgnml, #save-icon").click(function (evt) {
      var filename = document.getElementById('file-name').innerHTML;
      chise.saveAsSbgnml(filename);
    });
    
    $("#add-complex-for-selected").click(function (e) {
      chise.createCompoundForGivenNodes(cy.nodes(':selected'), 'complex');
    });
    
    $("#add-compartment-for-selected").click(function (e) {
      chise.createCompoundForGivenNodes(cy.nodes(':selected'), 'compartment');
    });
    
    // Mode handler related menu items
    $('.add-node-menu-item').click(function (e) {
      if (!modeHandler.mode != "add-node-mode") {
        modeHandler.setAddNodeMode();
      }
      var value = $(this).attr('name');
      modeHandler.selectedNodeType = value;
      modeHandler.setSelectedIndexOfSelector("add-node-mode", value);
      modeHandler.setSelectedMenuItem("add-node-mode", value);
    });

    $('.add-edge-menu-item').click(function (e) {
      if (!modeHandler.mode != "add-edge-mode") {
        modeHandler.setAddEdgeMode();
      }
      var value = $(this).attr('name');
      modeHandler.selectedEdgeType = value;
      modeHandler.setSelectedIndexOfSelector("add-edge-mode", value);
      modeHandler.setSelectedMenuItem("add-edge-mode", value);
    });

    $('.node-dd-list-menu-item').click(function (e) {
      if (!modeHandler.mode != "add-node-mode") {
        modeHandler.setAddNodeMode();
      }
      var value = $('img', this).attr('value');
      modeHandler.selectedNodeType = value;
      modeHandler.setSelectedIndexOfSelector("add-node-mode", value);
      modeHandler.setSelectedMenuItem("add-node-mode", value);
    });

    $('.edge-dd-list-menu-item').click(function (e) {
      if (!modeHandler.mode != "add-edge-mode") {
        modeHandler.setAddEdgeMode();
      }
      var value = $('img', this).attr('value');
      modeHandler.selectedEdgeType = value;
      modeHandler.setSelectedIndexOfSelector("add-edge-mode", value);
      modeHandler.setSelectedMenuItem("add-edge-mode", value);
    });

    $('#node-dd-list-set-mode-btn').click(function (e) {
      if (modeHandler.mode != "add-node-mode") {
        modeHandler.setAddNodeMode();
      }
      else {
        modeHandler.sustainMode = !modeHandler.sustainMode;
        $('#node-dd-list').toggleClass('selected-mode-sustainable');
      }
    });

    $('#edge-dd-list-set-mode-btn').click(function (e) {
      if (modeHandler.mode != "add-edge-mode") {
        modeHandler.setAddEdgeMode();
      }
      else {
        modeHandler.sustainMode = !modeHandler.sustainMode;
        $('#edge-dd-list').toggleClass('selected-mode-sustainable');
      }
    });

    $('#select-icon').click(function (e) {
      modeHandler.setSelectionMode();
    });

    $('#select-edit').click(function (e) {
      modeHandler.setSelectionMode();
    });

    appUtilities.sbgnNetworkContainer.on("click", ".biogene-info .expandable", function (evt) {
      var expanderOpts = {slicePoint: 150,
        expandPrefix: ' ',
        expandText: ' (...)',
        userCollapseText: ' (show less)',
        moreClass: 'expander-read-more',
        lessClass: 'expander-read-less',
        detailClass: 'expander-details',
        expandEffect: 'fadeIn',
        collapseEffect: 'fadeOut'
      };
      $(".biogene-info .expandable").expander(expanderOpts);
      expanderOpts.slicePoint = 2;
      expanderOpts.widow = 0;
    });
  }
};