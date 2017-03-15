var jquery = $ = require('jquery');
var BackboneViews = require('./backbone-views');
var appUtilities = require('./app-utilities');
var modeHandler = require('./app-mode-handler');
var keyboardShortcuts = require('./keyboard-shortcuts');
var inspectorUtilities = require('./inspector-utilities');
var _ = require('underscore');

// Handle sbgnviz menu functions which are to be triggered on events
module.exports = function () {
  var dynamicResize = appUtilities.dynamicResize.bind(appUtilities);
  
  var layoutPropertiesView, generalPropertiesView, pathsBetweenQueryView, promptSaveView, promptConfirmationView,
        reactionTemplateView, gridPropertiesView, fontPropertiesView, fileSaveView;

  function loadSample(filename) {
    return chise.loadSample(filename, 'app/samples/');
  }

  $(document).ready(function ()
  {
    console.log('init the sbgnviz template/page');
    
    $(window).on('resize', _.debounce(dynamicResize, 100));
    dynamicResize();

    layoutPropertiesView = appUtilities.layoutPropertiesView = new BackboneViews.LayoutPropertiesView({el: '#layout-properties-table'});
    generalPropertiesView = appUtilities.generalPropertiesView = new BackboneViews.GeneralPropertiesView({el: '#general-properties-table'});
    pathsBetweenQueryView = appUtilities.pathsBetweenQueryView = new BackboneViews.PathsBetweenQueryView({el: '#query-pathsbetween-table'});
    //promptSaveView = appUtilities.promptSaveView = new BackboneViews.PromptSaveView({el: '#prompt-save-table'}); // see PromptSaveView in backbone-views.js
    fileSaveView = appUtilities.fileSaveView = new BackboneViews.FileSaveView({el: '#file-save-table'});
    promptConfirmationView = appUtilities.promptConfirmationView = new BackboneViews.PromptConfirmationView({el: '#prompt-confirmation-table'});
    reactionTemplateView = appUtilities.reactionTemplateView = new BackboneViews.ReactionTemplateView({el: '#reaction-template-table'});
    gridPropertiesView = appUtilities.gridPropertiesView = new BackboneViews.GridPropertiesView({el: '#grid-properties-table'});
    fontPropertiesView = appUtilities.fontPropertiesView = new BackboneViews.FontPropertiesView({el: '#font-properties-table'});

    toolbarButtonsAndMenu();
    modeHandler.initilize();

    // loadSample is called before the container is resized in dynamicResize function, so we need to wait
    // wait until it is resized before loading the default sample. As the current solution we set a 100 ms 
    // time out before loading the default sample. 
    // TODO search for a better way.
    setTimeout(function(){
      loadSample('neuronal_muscle_signalling.xml');
      keyboardShortcuts();
    }, 100);
  });
  
  // Events triggered by sbgnviz module
  $(document).on('sbgnvizLoadSample sbgnvizLoadFile', function(event, filename) {
    appUtilities.setFileContent(filename);

    //clean and reset things
    cy.elements().unselect();
    if (!$('#inspector-palette-tab').hasClass('active')) {
      $('#inspector-palette-tab a').tab('show');
      $('#inspector-style-tab a').blur();
    }
  });
  
   /*
   * Listen updateGraphEnd event. 
   * Signal that the graph is being updated.
   */
  $(document).on('updateGraphStart', function(event) {
    appUtilities.updatingGraph = true;
  });
  
  /*
   * Listen updateGraphEnd event. 
   * Reset undo-redo buttons, set selection mode, set elements initial data(init borderColor and lineColorFor more information
   * please see the comments on appUtilities.setElementsData()) and signal that updating graph is finished.
   */
  $(document).on('updateGraphEnd', function(event) {
    appUtilities.resetUndoRedoButtons();
    modeHandler.setSelectionMode();
    appUtilities.setElementsData(cy.elements());
    appUtilities.updatingGraph = false;
  });
  
  /*
   * Called just once when the update graph event ends. We need to customize stylesheet on this event.
   * We need to set the border-color and line-color of the elements according to their data (For more information
   * please see the comments on appUtilities.setElementsData()).
   */
  $(document).one('updateGraphEnd', function(event) {
    cy.style()
    .selector("node[borderColor]")
    .style({
      'border-color': function(ele) {
        return ele.data('borderColor');
      }
    })
    .selector("edge[lineColor]")
    .style({
      'line-color': function(ele) {
        return ele.data('lineColor');
      },
      'source-arrow-color': function(ele) {
        return ele.data('lineColor');
      },
      'target-arrow-color': function(ele) {
        return ele.data('lineColor');
      }
    })
    .selector("node:selected")
    .style({
      'border-color': '#d67614',
      'target-arrow-color': '#000',
      'text-outline-color': '#000'
    })
    .selector("edge:selected")
    .style({
      'line-color': '#d67614',
      'source-arrow-color': '#d67614',
      'target-arrow-color': '#d67614'
    }).update();
  });

  function toolbarButtonsAndMenu() {
    
    $("#node-label-textbox").keydown(function (e) {
      if (e.which === 13) {
        $("#node-label-textbox").blur();
      }
    });
    
    $("#node-label-textbox").blur(function () {
      $("#node-label-textbox").hide();
      $("#node-label-textbox").data('node', undefined);
    });

    $("#node-label-textbox").on('change', function () {
      var node = $(this).data('node');
      chise.changeNodeLabel(node, $(this).val());
      inspectorUtilities.handleSBGNInspector();
    });

    $("#new-file, #new-file-icon").click(function () {
      var createNewFile = function () {
        appUtilities.setFileContent("new_file.sbgnml");

        //clean and reset things
        cy.elements().unselect();
        if (!$('#inspector-palette-tab').hasClass('active')) {
          $('#inspector-palette-tab a').tab('show');
          $('#inspector-style-tab a').blur();
        }
        
        chise.updateGraph({
          nodes: [],
          edges: []
        });
      };

      promptConfirmationView.render(createNewFile);
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
          promptConfirmationView.render(function(){loadSample(selectorToSampleFileName[selector])});
        });
      })(selector);
    }

    $("#select-all").click(function(e) {
      cy.elements().unselect();
      cy.elements().select();
    });

    $("#select-all-nodes").click(function(e) {
      cy.elements().unselect();
      cy.nodes().select();
    });

    $("#select-all-edges").click(function(e) {
      cy.elements().unselect();
      cy.edges().select();
    });

    $("#hide-selected, #hide-selected-icon").click(function(e) {
      chise.hideNodesSmart(cy.nodes(":selected"));
    });
    
    $("#show-selected, #show-selected-icon").click(function(e) {
      chise.showNodesSmart(cy.nodes(":selected"));
    });
    
    $("#show-hidden-neighbors-of-selected").click(function(e) {
      appUtilities.showAndPerformIncrementalLayout(cy.elements(':selected'));
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
    
    $("#grid-properties").click(function (e) {
      gridPropertiesView.render();
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
    // Toggle show grid and snap to grid
    var toggleShowGridEnableSnap = false;
    $("#toggle-grid-snapping-icon").click(function(){
      if (toggleEnableGuidelineAndSnap){
        $("#toggle-guidelines-snapping-icon").click();
      }
      toggleShowGridEnableSnap = !toggleShowGridEnableSnap;
      appUtilities.currentGridProperties.showGrid = toggleShowGridEnableSnap;
      appUtilities.currentGridProperties.snapToGrid = toggleShowGridEnableSnap; 

      cy.gridGuide({
        drawGrid: appUtilities.currentGridProperties.showGrid,
        snapToGrid: appUtilities.currentGridProperties.snapToGrid,
      });

      if (toggleShowGridEnableSnap){
        $('#toggle-grid-snapping-icon').addClass('toggle-mode-sustainable');
      }
      else{
         $('#toggle-grid-snapping-icon').removeClass('toggle-mode-sustainable');
      }
    });

    // Toggle guidelines and snap to alignment location
    var toggleEnableGuidelineAndSnap = false;
    $("#toggle-guidelines-snapping-icon").click(function(){
      if (toggleShowGridEnableSnap){
        $("#toggle-grid-snapping-icon").click();
      }
      toggleEnableGuidelineAndSnap = !toggleEnableGuidelineAndSnap;
      appUtilities.currentGridProperties.showGeometricGuidelines = toggleEnableGuidelineAndSnap;
      appUtilities.currentGridProperties.showDistributionGuidelines = toggleEnableGuidelineAndSnap;
      appUtilities.currentGridProperties.snapToAlignmentLocation = toggleEnableGuidelineAndSnap;

      cy.gridGuide({
        geometricGuideline: appUtilities.currentGridProperties.showGeometricGuidelines,
        initPosAlignment: appUtilities.currentGridProperties.showInitPosAlignment,
        distributionGuidelines: appUtilities.currentGridProperties.showDistributionGuidelines,
        snapToAlignmentLocation: appUtilities.currentGridProperties.snapToAlignmentLocation,
      });

      if (toggleEnableGuidelineAndSnap){
        $('#toggle-guidelines-snapping-icon').addClass('toggle-mode-sustainable');
      }
      else{
        $('#toggle-guidelines-snapping-icon').removeClass('toggle-mode-sustainable');
      }
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
        animate: appUtilities.currentGeneralProperties.animateOnDrawingChanges ? 'end' : false
      };
      if (appUtilities.currentLayoutProperties.animate == 'during') {
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
      //var filename = document.getElementById('file-name').innerHTML;
      //chise.saveAsSbgnml(filename);
      fileSaveView.render();
    });
    
    $("#add-complex-for-selected").click(function (e) {
      chise.createCompoundForGivenNodes(cy.nodes(':selected'), 'complex');
    });
    
    $("#add-compartment-for-selected").click(function (e) {
      chise.createCompoundForGivenNodes(cy.nodes(':selected'), 'compartment');
    });
    
    $("#create-reaction-template").click(function (e) {
      reactionTemplateView.render();
    });
    
    $("#clone-selected").click(function (e) {
      chise.cloneElements(cy.nodes(':selected'));
    });
    
    /*
     * Align selected nodes w.r.t the first selected node start
     */
    $('#align-horizontal-top,#align-horizontal-top-icon').click(function (e) {
      chise.align(cy.nodes(":selected"), "top", "none", appUtilities.firstSelectedNode);
    });

    $('#align-horizontal-middle,#align-horizontal-middle-icon').click(function (e) {
      chise.align(cy.nodes(":selected"), "center", "none", appUtilities.firstSelectedNode);
    });

    $('#align-horizontal-bottom,#align-horizontal-bottom-icon').click(function (e) {
      chise.align(cy.nodes(":selected"), "bottom", "none", appUtilities.firstSelectedNode);
    });

    $('#align-vertical-left,#align-vertical-left-icon').click(function (e) {
      chise.align(cy.nodes(":selected"), "none", "left", appUtilities.firstSelectedNode);
    });

    $('#align-vertical-center,#align-vertical-center-icon').click(function (e) {
      chise.align(cy.nodes(":selected"), "none", "center", appUtilities.firstSelectedNode);
    });

    $('#align-vertical-right,#align-vertical-right-icon').click(function (e) {
      chise.align(cy.nodes(":selected"), "none", "right", appUtilities.firstSelectedNode);
    });
    
    /*
     * Align selected nodes w.r.t the first selected node end
     */
    
    // Mode handler related menu items
    
    // Listen to click event on img tags under a node palette
    $(document).on('click', '.node-palette img', function (e) {
      $('.node-palette img').parent().removeClass('selected-mode'); // Make any image inside node palettes non selected
      $(this).parent().addClass('selected-mode'); // Make clicked element selected
      var elementType = $(this).attr('value').replace(/-/gi, ' '); // Html values includes '-' instead of ' '
      modeHandler.setAddNodeMode(elementType); // Set add node mode and set selected node type
      
      // Update the some attributes of add node mode icon
      var src = $(this).attr('src');
      var title = "Create a new " + $(this).attr('title');
      $('#add-node-mode-icon').attr('src', src);
      $('#add-node-mode-icon').attr('title', title);
    });
    
    // Listen to click event on img tags under an edge palette
    $(document).on('click', '.edge-palette img', function (e) {
      $('.edge-palette img').parent().removeClass('selected-mode');// Make any image inside edge palettes non selected
      $(this).parent().addClass('selected-mode'); // Make clicked element selected
      var elementType = $(this).attr('value').replace(/-/gi, ' '); // Html values includes '-' instead of ' '
      modeHandler.setAddEdgeMode(elementType); // Set add edge mode and set selected edge type
      
      // Update the some attributes of add edge mode icon
      var src = $(this).attr('src');
      var title = "Create a new " + $(this).attr('title');
      $('#add-edge-mode-icon').attr('src', src);
      $('#add-edge-mode-icon').attr('title', title);
    });

    $('#select-mode-icon').click(function (e) {
      modeHandler.setSelectionMode();
    });
    
    $('#add-node-mode-icon').click(function (e) {
      modeHandler.setAddNodeMode();
      
      // Go to inspector palette tab when the icon is clicked
      if (!$('#inspector-palette-tab').hasClass('active')) {
        $('#inspector-palette-tab a').tab('show');
      }
    });
    
    $('#add-edge-mode-icon').click(function (e) {
      modeHandler.setAddEdgeMode();
      
      // Go to inspector palette tab when the icon is clicked
      if (!$('#inspector-palette-tab').hasClass('active')) {
        $('#inspector-palette-tab a').tab('show');
      }
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
