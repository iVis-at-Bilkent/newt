var jquery = $ = require('jquery');
var BackboneViews = require('./backbone-views');
var appUtilities = require('./app-utilities');
var appUndoActionsFactory = require('./app-undo-actions-factory');
var modeHandler = require('./app-mode-handler');
var keyboardShortcuts = require('./keyboard-shortcuts');
var inspectorUtilities = require('./inspector-utilities');
var _ = require('underscore');

// Handle sbgnviz menu functions which are to be triggered on events
module.exports = function() {
  var dynamicResize = appUtilities.dynamicResize.bind(appUtilities);

  var layoutPropertiesView, generalPropertiesView, pathsBetweenQueryView, pathsByURIQueryView,  promptSaveView, promptConfirmationView,
        promptMapTypeView, promptInvalidFileView, promptInvalidURIWarning, reactionTemplateView, gridPropertiesView, fontPropertiesView, fileSaveView;

  function validateSBGNML(xml) {
    $.ajax({
      type: 'post',
      url: "/utilities/validateSBGNML",
      data: {sbgnml: xml},
      success: function(data){
        if(data.length == 0) {
          console.log("Xsd validation OK");
        }
        else {
          console.error("Xsd validation failed. Errors:", data);
        }
      },
      error: function(req, status, err) {
        console.error("Error during file validation", status, err);
      }
    });
  }
  
  function loadSample(filename) {

    // use the active chise instance
    var chiseInstance = appUtilities.getActiveChiseInstance();

    var textXml = (new XMLSerializer()).serializeToString(chiseInstance.loadXMLDoc("app/samples/"+filename));
    validateSBGNML(textXml);
    return chiseInstance.loadSample(filename, 'app/samples/');
  }

  console.log('init the sbgnviz template/page');

  $(window).on('resize', _.debounce(dynamicResize, 100));

  dynamicResize();

  layoutPropertiesView = appUtilities.layoutPropertiesView = new BackboneViews.LayoutPropertiesView({el: '#layout-properties-table'});
  colorSchemeInspectorView = appUtilities.colorSchemeInspectorView = new BackboneViews.ColorSchemeInspectorView({el: '#color-scheme-template-container'});
  //generalPropertiesView = appUtilities.generalPropertiesView = new BackboneViews.GeneralPropertiesView({el: '#general-properties-table'});
  mapTabGeneralPanel = appUtilities.mapTabGeneralPanel = new BackboneViews.MapTabGeneralPanel({el: '#map-tab-general-container'});
  mapTabLabelPanel = appUtilities.mapTabLabelPanel = new BackboneViews.MapTabLabelPanel({el: '#map-tab-label-container'});
  mapTabRearrangementPanel = appUtilities.mapTabRearrangementPanel = new BackboneViews.MapTabRearrangementPanel({el: '#map-tab-rearrangement-container'});
  pathsBetweenQueryView = appUtilities.pathsBetweenQueryView = new BackboneViews.PathsBetweenQueryView({el: '#query-pathsbetween-table'});
  pathsByURIQueryView = appUtilities.pathsByURIQueryView = new BackboneViews.PathsByURIQueryView({el: '#query-pathsbyURI-table'});
  //promptSaveView = appUtilities.promptSaveView = new BackboneViews.PromptSaveView({el: '#prompt-save-table'}); // see PromptSaveView in backbone-views.js
  fileSaveView = appUtilities.fileSaveView = new BackboneViews.FileSaveView({el: '#file-save-table'});
  promptConfirmationView = appUtilities.promptConfirmationView = new BackboneViews.PromptConfirmationView({el: '#prompt-confirmation-table'});
  promptMapTypeView = appUtilities.promptMapTypeView = new BackboneViews.PromptMapTypeView({el: '#prompt-mapType-table'});
  promptInvalidFileView = appUtilities.promptInvalidFileView = new BackboneViews.PromptInvalidFileView({el: '#prompt-invalidFile-table'});
  reactionTemplateView = appUtilities.reactionTemplateView = new BackboneViews.ReactionTemplateView({el: '#reaction-template-table'});
  gridPropertiesView = appUtilities.gridPropertiesView = new BackboneViews.GridPropertiesView({el: '#grid-properties-table'});
  fontPropertiesView = appUtilities.fontPropertiesView = new BackboneViews.FontPropertiesView({el: '#font-properties-table'});
  promptInvalidURIView = appUtilities.promptInvalidURIView = new BackboneViews.PromptInvalidURIView({el: '#prompt-invalidURI-table'});
  promptInvalidURIWarning = appUtilities.promptInvalidURIWarning = new BackboneViews.PromptInvalidURIWarning({el: '#prompt-invalidURI-table'});
  promptInvalidURLWarning = appUtilities.promptInvalidURLWarning = new BackboneViews.PromptInvalidURLWarning({el: '#prompt-invalidURL-table'});
  toolbarButtonsAndMenu();

  keyboardShortcuts();

  // Events triggered by sbgnviz module
  $(document).on('sbgnvizLoadSample sbgnvizLoadFile', function(event, filename, cy) {

    // check if the event is triggered for the active instance
    var isActiveInstance = ( cy == appUtilities.getActiveCy() );

    // set the current file name for cy
    appUtilities.setScratch(cy, 'currentFileName', filename);

    //clean and reset things
    cy.elements().unselect();

    // if the event is triggered for the active instance do the followings
    if ( isActiveInstance ) {

      // set file content accordingly
      appUtilities.setFileContent(filename);

      if (!$('#inspector-map-tab').hasClass('active')) {
        $('#inspector-map-tab a').tab('show');
      }

    }

  });

  $(document).on('updateGraphEnd', function(event, cy) {
    appUtilities.resetUndoRedoButtons();
    modeHandler.setSelectionMode(cy);
  });

  $(document).on('sbgnvizLoadFileEnd sbgnvizLoadSampleEnd', function(event, filename, cy) {

    // check if the event is triggered for the active instance
    var isActiveInstance = ( cy == appUtilities.getActiveCy() );

    // get chise instance for cy
    var chiseInstance = appUtilities.getChiseInstance(cy);

    // Do the followings if the event is triggered for the active instance
    if ( isActiveInstance ) {

      // select appropriate palette depending on the map
      if(chiseInstance.elementUtilities.mapType == "AF") {
        if(! $("#PD-palette-heading").hasClass("collapsed")) { // collapse PD
          $("#PD-palette-heading").click();
        }
        if($("#AF-palette-heading").hasClass("collapsed")) { // expand AF
          $("#AF-palette-heading").click();
        }
      }
      else if(chiseInstance.elementUtilities.mapType == "PD"){
        if($("#PD-palette-heading").hasClass("collapsed")) { // expand PD
          $("#PD-palette-heading").click();
        }
        if(! $("#AF-palette-heading").hasClass("collapsed")) { // collapse AF
          $("#AF-palette-heading").click();
        }
      }

    }

  });

  function toolbarButtonsAndMenu() {

    // menu behavior: on first click, triggers the other menus on hover.
    var isMenuHoverMode = false;
    $('ul.navbar-nav > li.dropdown').on('mouseenter', function(e){
      if (isMenuHoverMode) {
        if ($(this).is('.open')) {
          return;
        }
        $(this).find('> a.dropdown-toggle').trigger('click');
      }
    });
    $(document.body).on('click', function (e) {
      if ($(e.target).is('ul.navbar-nav > li.dropdown > a.dropdown-toggle')) {
        isMenuHoverMode = true;
      }
      else {
        isMenuHoverMode = false;
      }
    });

    $("#node-label-textbox").keyup(function (e) {
      if (e.which === 13 && !e.shiftKey) {
        e.preventDefault();
      }
    });

    $("#node-label-textbox").keydown(function (e) {

      // use active cy instance
      var cy = appUtilities.getActiveCy();

      if (e.which === 13 && !e.shiftKey) {
        $("#node-label-textbox").blur();
        cy.nodes().unselect();
        $('#inspector-palette-tab a').tab('show');
      }
    });

    $("#node-label-textbox").blur(function () {
      $("#node-label-textbox").hide();
      $("#node-label-textbox").removeData("node");
    });

    $("#node-label-textbox").on('change', function () {

      // use the active chise instance
      var chiseInstance = appUtilities.getActiveChiseInstance();

      var node = $(this).data('node');
      var lines = $(this).val();

      if ($(this).val().includes("\\n")){
        lines = $(this).val().split("\\n");
        lines = $.map(lines, function(x) {
          x = x.trim();
          if (x) return (x);
        });
        lines = lines.join("\n")
      }

      chiseInstance.changeNodeLabel(node, lines);
      inspectorUtilities.handleSBGNInspector();

    });

    $("#new-file, #new-file-icon").click(function () {

      appUtilities.createNewNetwork();

    });

    // close the active file
    $("#close-file").click(function () {

      // use the active chise instance
      var chiseInstance = appUtilities.getActiveChiseInstance();

      // use cy instance for active chise instance
      var cy = chiseInstance.getCy();

      if(cy.elements().length != 0) {
        promptConfirmationView.render(appUtilities.closeActiveNetwork.bind(appUtilities));
      }
      else {
        appUtilities.closeActiveNetwork();
      }
    });

    $("#load-file, #load-file-icon").click(function () {
      $("#file-input").trigger('click');
    });

    $("#file-input").change(function () {

      // use the active chise instance
      var chiseInstance = appUtilities.getActiveChiseInstance();

      // use cy instance assocated with chise instance
      var cy = appUtilities.getActiveCy();

      if ($(this).val() != "") {
        var file = this.files[0];
        var loadCallbackSBGNMLValidity = function (text) {
          validateSBGNML(text);
        }      
        var loadCallbackInvalidityWarning  = function () {
          promptInvalidFileView.render();
        }
        if(cy.elements().length != 0) {
          promptConfirmationView.render(function(){chiseInstance.loadSBGNMLFile(file, loadCallbackSBGNMLValidity, loadCallbackInvalidityWarning)});
        }
        else {
          chiseInstance.loadSBGNMLFile(file, loadCallbackSBGNMLValidity, loadCallbackInvalidityWarning);
        }
        $(this).val("");
      }
    });

    $("#import-simple-af-file").click(function () {
      $("#simple-af-file-input").trigger('click');
    });   

    $("#simple-af-file-input").change(function () {
      var chiseInstance = appUtilities.getActiveChiseInstance();

      // use cy instance assocated with chise instance
      var cy = appUtilities.getActiveCy();

      var loadCallbackInvalidityWarning  = function () {
        promptInvalidFileView.render();
      }
      
      if ($(this).val() != "") {
        var file = this.files[0];

        if( cy.elements().length != 0)
          promptConfirmationView.render( function(){ chiseInstance.loadTDFile(file, loadCallbackInvalidityWarning); })
        else
          chiseInstance.loadTDFile(file, loadCallbackInvalidityWarning);

        $(this).val("");
      }
    });


    // get and set map properties from file
    $( document ).on( "sbgnvizLoadFileEnd sbgnvizLoadSampleEnd", function(evt, filename, cy){

      // check if the event is triggered for the active instance
      var isActiveInstance = ( cy == appUtilities.getActiveCy() );

      // get chise instance for cy
      var chiseInstance = appUtilities.getChiseInstance(cy);

      // get current general properties for cy
      var currentGeneralProperties = appUtilities.getScratch(cy, 'currentGeneralProperties');

      // needing an appUndoActions instance here is something unexpected
      // but since appUndoActions.refreshColorSchemeMenu is used below in an unfortunate way we need an instance of it
      // that uses cy instance here
      var appUndoActions = appUndoActionsFactory(cy);

      // get the network id for cy
      var networkId = cy.container().id;

      // reset map name and description
      // default map name should be a string that contains the network id
      currentGeneralProperties.mapName = appUtilities.getDefaultMapName(networkId);
      currentGeneralProperties.mapDescription = appUtilities.defaultGeneralProperties.mapDescription;

      // set recalculate layout on complexity management based on map size
      if (cy.nodes().length > 1250){
        currentGeneralProperties.recalculateLayoutOnComplexityManagement = false;
      }

      // get and set properties from file
      var properties = chiseInstance.getMapProperties();

      // some operations are to be performed if properties.mapProperties exists
      var mapPropertiesExist = ( properties && properties.mapProperties );

      if (mapPropertiesExist) {
          appUtilities.setMapProperties(properties.mapProperties);
      }

      // some operations are to be done if the event is triggered for the active instance
      if ( isActiveInstance ) {
        // update map panel
        mapTabGeneralPanel.render();
        mapTabRearrangementPanel.render();
        mapTabLabelPanel.render();

        if (mapPropertiesExist){
          // update map panel
          appUndoActions.refreshColorSchemeMenu({value: currentGeneralProperties.mapColorScheme, self: colorSchemeInspectorView});
        }
      }

      if (mapPropertiesExist) {

        // set default colors according to the color scheme
        for(var nodeClass in appUtilities.mapColorSchemes[currentGeneralProperties.mapColorScheme]['values']){
          classBgColor = appUtilities.mapColorSchemes[currentGeneralProperties.mapColorScheme]['values'][nodeClass];
          // nodeClass may not be defined in the defaultProperties (for edges, for example)
          if(nodeClass in chiseInstance.elementUtilities.defaultProperties){
            chiseInstance.undoRedoActionFunctions.setDefaultProperty({class: nodeClass, name: 'background-color', value: classBgColor});
          }
        }
      };

      // reset current general properties at the scratch pad of cy
      appUtilities.setScratch(cy, 'currentGeneralProperties', currentGeneralProperties);
    });

    $("#PD-legend").click(function (e) {
      e.preventDefault();
      $("#PD_legend_modal").modal('show');
    });

    $("#AF-legend").click(function (e) {
      e.preventDefault();
      $("#AF_legend_modal").modal('show');
    });

    $("#quick-help, #quick-help-icon").click(function (e) {
      e.preventDefault();
      $("#quick_help_modal").modal('show');
    });

    $("#about, #about-icon").click(function (e) {
      e.preventDefault();
      $("#about_modal").modal('show');
    });
    
    $(".title").click(function(e){
      e.stopPropagation();    
    });

    var selectorToSampleFileName = {
      "#load-sample1" : 'neuronal_muscle_signaling.xml',
      "#load-sample2" : 'cam-camk_dependent_signaling_to_the_nucleus.xml',
      "#load-sample3" : 'atm_mediated_phosphorylation_of_repair_proteins.xml',
      "#load-sample4" : 'activated_stat1alpha_induction_of_the_irf1_gene.xml',
      "#load-sample5" : 'vitamins_b6_activation_to_pyridoxal_phosphate.xml',
      "#load-sample6" : 'insulin-like_growth_factor_signaling.xml',
      "#load-sample7" : 'polyq_proteins_interference.xml',
      "#load-sample8" : 'glycolysis.xml',
      "#load-sample9" : 'mapk_cascade.xml',
      "#load-sample10" : 'transforming_growth_factor_beta_signaling.xml',
      "#load-sample11" : 'repressilator.xml',
      "#load-sample12" : 'epidermal_growth_factor_receptor.xml',
      "#load-sample13" : 'regulation_of_tgfbeta-induced_metastasis.xml'
    };

    for ( var selector in selectorToSampleFileName ) {
      (function(selector){
        $(selector).click(function (e) {

          // use active cy instance
          var cy = appUtilities.getActiveCy();

          if(cy.elements().length != 0) {
            promptConfirmationView.render(function(){loadSample(selectorToSampleFileName[selector])});
          }
          else {
            loadSample(selectorToSampleFileName[selector]);  
          }
        });
      })(selector);
    }

    $("#select-all").click(function(e) {

      // use active cy instance
      var cy = appUtilities.getActiveCy();

      cy.elements().unselect();
      cy.elements().select();
    });

    $("#select-all-nodes").click(function(e) {

      // use active cy instance
      var cy = appUtilities.getActiveCy();

      cy.elements().unselect();
      cy.nodes().select();
    });

    $("#select-all-edges").click(function(e) {

      // use active cy instance
      var cy = appUtilities.getActiveCy();

      cy.elements().unselect();
      cy.edges().select();
    });
    
    $("#hide-selected, #hide-selected-icon").click(function(e) {

      // use active cy instance
      var cy = appUtilities.getActiveCy();

      appUtilities.hideNodesSmart(cy.nodes(":selected"));
      $('#inspector-palette-tab a').tab('show');
    });

    $("#show-selected, #show-selected-icon").click(function(e) {

      // use the active chise instance
      var chiseInstance = appUtilities.getActiveChiseInstance();

      // use cy instance associated with chise instance
      var cy = chiseInstance.getCy();

      if (cy.nodes(":selected").length === 0)
          return;
      var nodes = cy.nodes(":selected");
      var allNodes = cy.elements();
      var nodesToShow = chiseInstance.elementUtilities.extendNodeList(nodes);
      var nodesToHide = allNodes.not(nodesToShow);
      appUtilities.hideNodesSmart(nodesToHide);
    });

    $("#show-hidden-neighbors-of-selected").click(function(e) {

      // use the active chise instance
      var chiseInstance = appUtilities.getActiveChiseInstance();

      // use cy instance associated with chise instance
      var cy = chiseInstance.getCy();

      appUtilities.showHiddenNeighbors(cy.elements(':selected'));
    });

    $("#show-all").click(function (e) {
      appUtilities.showAll();
    });

    $("#delete-selected-smart, #delete-selected-smart-icon").click(function (e) {

      // use active chise instance
      var chiseInstance = appUtilities.getActiveChiseInstance();

      // use cy instance associated with chise instance
      var cy = chiseInstance.getCy();

      chiseInstance.deleteNodesSmart(cy.nodes(':selected'));
      $('#inspector-palette-tab a').tab('show');
    });

    $("#highlight-neighbors-of-selected").click(function (e) {

      // use active chise instance
      var chiseInstance = appUtilities.getActiveChiseInstance();

      // use cy instance associated with chise instance
      var cy = chiseInstance.getCy();

      chiseInstance.highlightNeighbours(cy.nodes(':selected'));
    });

    $("#search-by-label-icon").click(function (e) {

      // use active chise instance
      var chiseInstance = appUtilities.getActiveChiseInstance();

      var label = $("#search-by-label-text-box").val().toLowerCase();
      chiseInstance.searchByLabel(label);
    });

    $("#search-by-label-text-box").keydown(function (e) {
      if (e.which === 13) {
        $("#search-by-label-icon").trigger('click');
      }
    });

    $("#highlight-search-menu-item").click(function (e) {
      $("#search-by-label-text-box").focus();
    });
    
    $("#highlight-selected, #highlight-selected-icon").click(function (e) {

      // use active chise instance
      var chiseInstance = appUtilities.getActiveChiseInstance();

      // use cy instance associated with chise instance
      var cy = chiseInstance.getCy();

      chiseInstance.highlightSelected(cy.elements(':selected'));
    });

    $("#highlight-processes-of-selected").click(function (e) {

      // use active chise instance
      var chiseInstance = appUtilities.getActiveChiseInstance();

      // use cy instance associated with chise instance
      var cy = chiseInstance.getCy();

      chiseInstance.highlightProcesses(cy.nodes(':selected'));
    });

    $("#remove-highlights, #remove-highlights-icon").click(function (e) {

      // use active chise instance
      var chiseInstance = appUtilities.getActiveChiseInstance();

      chiseInstance.removeHighlights();
    });

    $("#layout-properties, #layout-properties-icon").click(function (e) {
      layoutPropertiesView.render();
    });

    $("#delete-selected-simple, #delete-selected-simple-icon").click(function (e) {

      // use active chise instance
      var chiseInstance = appUtilities.getActiveChiseInstance();

      // use cy instance associated with chise instance
      var cy = chiseInstance.getCy();

      chiseInstance.deleteElesSimple(cy.elements(':selected'));
      $('#inspector-palette-tab a').tab('show');
    });

    $("#general-properties, #properties-icon").click(function (e) {
      // Go to inspector map tab
      if (!$('#inspector-map-tab').hasClass('active')) {
        $('#inspector-map-tab a').tab('show');
      }
    });

    $("#query-pathsbetween, #query-pathsbetween-icon").click(function (e) {
      pathsBetweenQueryView.render();
    });

    $("#query-pathsbyURI").click(function (e) {
        pathsByURIQueryView.render();
    });

    $("#grid-properties").click(function (e) {
      gridPropertiesView.render();
    });

    $("#collapse-selected,#collapse-selected-icon").click(function (e) {

      // use active chise instance
      var chiseInstance = appUtilities.getActiveChiseInstance();

      // use cy instance associated with chise instance
      var cy = chiseInstance.getCy();

      chiseInstance.collapseNodes(cy.nodes(":selected"));
    });

    $("#expand-selected,#expand-selected-icon").click(function (e) {

      // use active chise instance
      var chiseInstance = appUtilities.getActiveChiseInstance();

      // use cy instance associated with chise instance
      var cy = chiseInstance.getCy();

      chiseInstance.expandNodes(cy.nodes(":selected"));
    });

    $("#collapse-complexes").click(function (e) {

      // use active chise instance
      var chiseInstance = appUtilities.getActiveChiseInstance();

      chiseInstance.collapseComplexes();
    });

    $("#expand-complexes").click(function (e) {

      // use active chise instance
      var chiseInstance = appUtilities.getActiveChiseInstance();

      chiseInstance.expandComplexes();
    });


    $("#toggle-grid-snapping-icon").click(function(){

      // use active cy instance
      var cy = appUtilities.getActiveCy();

      // Toggle show grid and snap to grid, if not initialized yet initialize by false
      var toggleShowGridEnableSnap = appUtilities.getScratch(cy, 'toggleShowGridEnableSnap') || false;

      // get current grid properties for cy
      var currentGridProperties = appUtilities.getScratch(cy, 'currentGridProperties');

      // get toggleEnableGuidelineAndSnap for cy
      var toggleEnableGuidelineAndSnap = appUtilities.getScratch(cy, 'toggleEnableGuidelineAndSnap');

      if (toggleEnableGuidelineAndSnap){
        $("#toggle-guidelines-snapping-icon").click();
      }

      toggleShowGridEnableSnap = !toggleShowGridEnableSnap;
      currentGridProperties.showGrid = toggleShowGridEnableSnap;
      currentGridProperties.snapToGridDuringDrag = toggleShowGridEnableSnap;

      cy.gridGuide({
        drawGrid: currentGridProperties.showGrid,
        snapToGridDuringDrag: currentGridProperties.snapToGridDuringDrag,
      });

      if (toggleShowGridEnableSnap){
        $('#toggle-grid-snapping-icon').addClass('toggle-mode-sustainable');
      }
      else{
         $('#toggle-grid-snapping-icon').removeClass('toggle-mode-sustainable');
      }

      // update 'toggleShowGridEnableSnap' and 'currentGridProperties' for cy
      appUtilities.setScratch(cy, 'toggleShowGridEnableSnap', toggleShowGridEnableSnap);
      appUtilities.setScratch(cy, 'currentGridProperties', currentGridProperties);

    });


    $("#toggle-guidelines-snapping-icon").click(function(){

      // use the active chise instance
      var chiseInstance = appUtilities.getActiveChiseInstance();

      // use cy instance associated with chise instance
      var cy = chiseInstance.getCy();

      // Toggle guidelines and snap to alignment location, if not initialized yet initialize by false
      var toggleEnableGuidelineAndSnap = appUtilities.getScratch(cy, 'toggleEnableGuidelineAndSnap') || false;

      // get current grid properties for cy
      var currentGridProperties = appUtilities.getScratch(cy, 'currentGridProperties');

      // get toggleShowGridEnableSnap for cy
      var toggleShowGridEnableSnap = appUtilities.getScratch(cy, 'toggleShowGridEnableSnap');

      if (toggleShowGridEnableSnap){
        $("#toggle-grid-snapping-icon").click();
      }

      toggleEnableGuidelineAndSnap = !toggleEnableGuidelineAndSnap;
      currentGridProperties.showGeometricGuidelines = toggleEnableGuidelineAndSnap;
      currentGridProperties.showDistributionGuidelines = toggleEnableGuidelineAndSnap;
      currentGridProperties.snapToAlignmentLocationDuringDrag = toggleEnableGuidelineAndSnap;

      cy.gridGuide({
        geometricGuideline: currentGridProperties.showGeometricGuidelines,
        initPosAlignment: currentGridProperties.showInitPosAlignment,
        distributionGuidelines: currentGridProperties.showDistributionGuidelines,
        snapToAlignmentLocationDuringDrag: currentGridProperties.snapToAlignmentLocationDuringDrag,
      });

      if (toggleEnableGuidelineAndSnap){
        $('#toggle-guidelines-snapping-icon').addClass('toggle-mode-sustainable');
      }
      else{
        $('#toggle-guidelines-snapping-icon').removeClass('toggle-mode-sustainable');
      }

      // update 'toggleEnableGuidelineAndSnap' and 'currentGridProperties' for cy
      appUtilities.setScratch(cy, 'toggleEnableGuidelineAndSnap', toggleEnableGuidelineAndSnap);
      appUtilities.setScratch(cy, 'currentGridProperties', currentGridProperties);
    });

    $("#collapse-all").click(function (e) {

      // use active chise instance
      var chiseInstance = appUtilities.getActiveChiseInstance();

      chiseInstance.collapseAll();
    });

    $("#expand-all").click(function (e) {

      // use active chise instance
      var chiseInstance = appUtilities.getActiveChiseInstance();

      chiseInstance.expandAll();
    });

    $("#zoom-to-selected").click( function(e){
      // use the active chise instance
      var cy = appUtilities.getActiveCy();

      var viewUtilities = cy.viewUtilities('get');

      viewUtilities.zoomToSelected(cy.$(':selected'));
    });

    $("#perform-layout, #perform-layout-icon").click(function (e) {

      // use active chise instance
      var chiseInstance = appUtilities.getActiveChiseInstance();

      // use the associated cy instance
      var cy = chiseInstance.getCy();

      // get current general properties for cy
      var currentGeneralProperties = appUtilities.getScratch(cy, 'currentGeneralProperties');

      // get current layout properties for cy
      var currentLayoutProperties = appUtilities.getScratch(cy, 'currentLayoutProperties');

      // TODO think whether here is the right place to start the spinner
      chiseInstance.startSpinner("layout-spinner");

      // If 'animate-on-drawing-changes' is false then animate option must be 'end' instead of false
      // If it is 'during' use it as is
      var preferences = {
        animate: currentGeneralProperties.animateOnDrawingChanges ? 'end' : false
      };
      if (currentLayoutProperties.animate == 'during') {
        delete preferences.animate;
      }
      layoutPropertiesView.applyLayout(preferences);
    });

    $("#undo-last-action, #undo-icon").click(function (e) {

      // use active cy instance
      var cy = appUtilities.getActiveCy();

      cy.undoRedo().undo();
    });

    $("#redo-last-action, #redo-icon").click(function (e) {

      // use active cy instance
      var cy = appUtilities.getActiveCy();

      cy.undoRedo().redo();
    });

    $("#save-as-png").click(function (evt) {

      // use active chise instance
      var chiseInstance = appUtilities.getActiveChiseInstance();

      var filename = document.getElementById('file-name').innerHTML;
      filename = filename.substring(0,filename.lastIndexOf('.')) + ".png";
      chiseInstance.saveAsPng(filename); // the default filename is 'network.png'
    });

    $("#save-as-jpg").click(function (evt) {

      // use active chise instance
      var chiseInstance = appUtilities.getActiveChiseInstance();

      var filename = document.getElementById('file-name').innerHTML;
      filename = filename.substring(0,filename.lastIndexOf('.')) + ".jpg";
      chiseInstance.saveAsJpg(filename); // the default filename is 'network.jpg'
    });

    $("#save-as-svg").click(function (evt) {

      // use active chise instance
      var chiseInstance = appUtilities.getActiveChiseInstance();

      var filename = document.getElementById('file-name').innerHTML;
      filename = filename.substring(0,filename.lastIndexOf('.')) + ".svg";
      chiseInstance.saveAsSvg(filename); // the default filename is 'network.jpg'
    });

    //TODO: could simply keep/store original input SBGN-ML data and use it here instead of converting from JSON
    $("#save-as-sbgnml, #save-icon").click(function (evt) {
      //var filename = document.getElementById('file-name').innerHTML;
      //chise.saveAsSbgnml(filename);
      fileSaveView.render("sbgnml", "0.3");
    });

    $("#export-as-sbgnml2-file").click(function (evt) {
      fileSaveView.render("sbgnml", "0.2");
    });

    $("#add-complex-for-selected").click(function (e) {

      // use active chise instance
      var chiseInstance = appUtilities.getActiveChiseInstance();

      // use cy instance associated with chise instance
      var cy = chiseInstance.getCy();

      chiseInstance.createCompoundForGivenNodes(cy.nodes(':selected'), 'complex');
    });

    $("#add-compartment-for-selected").click(function (e) {

      // use active chise instance
      var chiseInstance = appUtilities.getActiveChiseInstance();

      // use cy instance associated with chise instance
      var cy = chiseInstance.getCy();

      chiseInstance.createCompoundForGivenNodes(cy.nodes(':selected'), 'compartment');
    });

    $("#add-submap-for-selected").click(function (e) {

      // use active chise instance
      var chiseInstance = appUtilities.getActiveChiseInstance();

      // use cy instance associated with chise instance
      var cy = chiseInstance.getCy();

      chiseInstance.createCompoundForGivenNodes(cy.nodes(':selected'), 'submap');
    });

    $("#create-reaction-template").click(function (e) {
      reactionTemplateView.render();
    });

    $("#clone-selected").click(function (e) {

      // use active chise instance
      var chiseInstance = appUtilities.getActiveChiseInstance();

      // use cy instance associated with chise instance
      var cy = chiseInstance.getCy();

      chiseInstance.cloneElements(cy.nodes(':selected'));
    });

    /*
     * Align selected nodes w.r.t the first selected node start
     */
    $('#align-horizontal-top,#align-horizontal-top-icon').click(function (e) {

      // use active chise instance
      var chiseInstance = appUtilities.getActiveChiseInstance();

      // use cy instance associated with chise instance
      var cy = chiseInstance.getCy();

      chiseInstance.align(cy.nodes(":selected"), "top", "none", appUtilities.firstSelectedNode);
    });

    $('#align-horizontal-middle,#align-horizontal-middle-icon').click(function (e) {

      // use active chise instance
      var chiseInstance = appUtilities.getActiveChiseInstance();

      // use cy instance associated with chise instance
      var cy = chiseInstance.getCy();

      chiseInstance.align(cy.nodes(":selected"), "center", "none", appUtilities.firstSelectedNode);
    });

    $('#align-horizontal-bottom,#align-horizontal-bottom-icon').click(function (e) {

      // use active chise instance
      var chiseInstance = appUtilities.getActiveChiseInstance();

      // use cy instance associated with chise instance
      var cy = chiseInstance.getCy();

      chiseInstance.align(cy.nodes(":selected"), "bottom", "none", appUtilities.firstSelectedNode);
    });

    $('#align-vertical-left,#align-vertical-left-icon').click(function (e) {

      // use active chise instance
      var chiseInstance = appUtilities.getActiveChiseInstance();

      // use cy instance associated with chise instance
      var cy = chiseInstance.getCy();

      chiseInstance.align(cy.nodes(":selected"), "none", "left", appUtilities.firstSelectedNode);
    });

    $('#align-vertical-center,#align-vertical-center-icon').click(function (e) {

      // use active chise instance
      var chiseInstance = appUtilities.getActiveChiseInstance();

      // use cy instance associated with chise instance
      var cy = chiseInstance.getCy();

      chiseInstance.align(cy.nodes(":selected"), "none", "center", appUtilities.firstSelectedNode);
    });

    $('#align-vertical-right,#align-vertical-right-icon').click(function (e) {

      // use active chise instance
      var chiseInstance = appUtilities.getActiveChiseInstance();

      // use cy instance associated with chise instance
      var cy = chiseInstance.getCy();

      chiseInstance.align(cy.nodes(":selected"), "none", "right", appUtilities.firstSelectedNode);
    });

    /*
     * Align selected nodes w.r.t the first selected node end
     */

    // Mode handler related menu items

    var dragAndDropPlacement = false;
    // Listen to click event and possible drag and drop on img tags under a node palette
    $(document).on('mousedown', '.node-palette img', function (e) {
      e.preventDefault(); // needed for dragging, otherwise the mouse release event cannot be fired on another element
      dragAndDropPlacement = true;
      appUtilities.addDragImage($(this).attr('value')+".svg", $(this).css('width'), $(this).css('height'));

      $('.node-palette img').removeClass('selected-mode'); // Make any image inside node palettes non selected
      $(this).addClass('selected-mode'); // Make clicked element selected
      var elementType = $(this).attr('value').replace(/-/gi, ' '); // Html values includes '-' instead of ' '
      var language = $(this).attr('language');

      modeHandler.setAddNodeMode(elementType, language); // Set add node mode and set selected node type

      // Update the some attributes of add node mode icon
      var src = $(this).attr('src');
      var title = "Create a new " + $(this).attr('title');
      $('#add-node-mode-icon').attr('src', src);
      $('#add-node-mode-icon').attr('title', title);
    });

    // Listen to click event on img tags under an edge palette
    $(document).on('mousedown', '.edge-palette img', function (e) {
      // we don't want to have the icons following the mouse on drag (default browser behavior),
      // this would confuse the user as edges are not draggable.
      e.preventDefault();
      $('.edge-palette img').removeClass('selected-mode');// Make any image inside edge palettes non selected
      $(this).addClass('selected-mode'); // Make clicked element selected
      var elementType = $(this).attr('value').replace(/-/gi, ' '); // Html values includes '-' instead of ' '
      var language = $(this).attr('language');
      modeHandler.setAddEdgeMode(elementType, language); // Set add edge mode and set selected edge type

      // Update the some attributes of add edge mode icon
      var src = $(this).attr('src');
      var title = "Create a new " + $(this).attr('title');
      $('#add-edge-mode-icon').attr('src', src);
      $('#add-edge-mode-icon').attr('title', title);
    });

    // cancel the possible dragging move
    $(document).on('mouseup', function (e) {
      dragAndDropPlacement = false;
      appUtilities.removeDragImage();
    });

    $('#select-mode-icon').click(function (e) {
      modeHandler.setSelectionMode();
    });

    $('#marquee-zoom-mode-icon').click(function(e){
      modeHandler.setMarqueeZoomMode();
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

    $(document).on("click", ".biogene-info .expandable .network-panel", function (evt) {

      // get the recently active tab
      var activeTab = appUtilities.getActiveNetworkPanel();

      // if the event is not triggered for the active tab return directly
      if ( $(this).attr('id') !== activeTab.id ) {
        return;
      }

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

    // this is used to detect a drag and drop of nodes from the palette
    // cy doesn't provide a clean way to handle events from the outside of cy
    // so here we need to go through the container and fire events down the chain manually to cy
    $(document).on("mouseup", ".network-panel", function (evt) {

      // get the recently active tab
      var activeTab = appUtilities.getActiveNetworkPanel();

      // if the event is not triggered for the active tab return directly
      if ( $(this).attr('id') !== activeTab.id ) {
        return;
      }

      // use active cy instance
      var cy = appUtilities.getActiveCy();

      if (dragAndDropPlacement) {
        var parentOffset = $(activeTab).offset();
        var relX = evt.pageX - parentOffset.left;
        var relY = evt.pageY - parentOffset.top;
        // the following event doesn't contain all the necessary information that cytoscape usually provide
        // see: http://stackoverflow.com/questions/34409733/find-element-at-x-y-position-in-cytoscape-js
        cy.trigger('tapend', {x: relX, y: relY});
      }
    });

    // on active network tab change
    $(document).on('shown.bs.tab', '#network-tabs-list  a[data-toggle="tab"]', function (e) {
      var target = $(e.target).attr("href"); // activated tab
      console.log(target);
      appUtilities.setActiveNetwork(target);
    });
  }
};
