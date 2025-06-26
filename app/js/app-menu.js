var jquery = $ = require('jquery');
var BackboneViews = require('./backbone-views');
var appUtilities = require('./app-utilities');
var appUndoActionsFactory = require('./app-undo-actions-factory');
var modeHandler = require('./app-mode-handler');
var keyboardShortcuts = require('./keyboard-shortcuts');
var inspectorUtilities = require('./inspector-utilities');
var tutorial = require('./tutorial');
var sifStyleFactory = require('./sif-style-factory');
var _ = require('underscore');
var databaseUtilities = require('./database-utilities');
require('dotenv').config();

var IS_LOCAL_DATABASE = window.__ENV__.LOCAL_DATABASE==='true';

// Handle sbgnviz menu functions which are to be triggered on events
module.exports = function() {
  var dynamicResize = appUtilities.dynamicResize.bind(appUtilities);

  var layoutPropertiesView, generalPropertiesView, neighborhoodQueryView, pathsBetweenQueryView, pathsFromToQueryView, PathsFromToQueryViewLocalDB, commonStreamQueryView, pathsByURIQueryView, mapByWPIDQueryView, mapByReactomeIDQueryView, promptSaveView, promptConfirmationView,
        promptMapTypeView, promptInvalidTypeWarning, promtErrorPD2AF, promptInvalidFileView, promptFileConversionErrorView, promptInvalidURIWarning, reactionTemplateView, gridPropertiesView, fontPropertiesView, fileSaveView,saveUserPreferencesView, loadUserPreferencesView, sifMapWarning;

  // checking if the user is using a local database
  
  
  const showDatabaseMenu=()=>{  
    console.log('IS_LOCAL_DATABASE', IS_LOCAL_DATABASE);
    if (IS_LOCAL_DATABASE) {
      $('#database-function').show();
      $('#local-db-panel').show();
    } else {
      $('#database-function').hide();
      $('#local-db-panel').hide();
    }
  };
  showDatabaseMenu();

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
 
  function loadSample(filename, callback) {
    var chiseInstance = appUtilities.getActiveChiseInstance();
    var textXml = (new XMLSerializer()).serializeToString(chiseInstance.loadXMLDoc("app/samples/"+filename));
    validateSBGNML(textXml);
    return chiseInstance.loadSample(filename, 'app/samples/', callback);
  }

  function updatePalette(mapType) {

    if(mapType === "AF") {
      if($("#AF-palette-heading").hasClass("collapsed")) { // expand AF
        $("#AF-palette-heading").click();
      }        
      if(! $("#PD-palette-heading").hasClass("collapsed")) { // collapse PD
        $("#PD-palette-heading").click();
      }
      if(! $("#SIF-palette-heading").hasClass("collapsed")) { // collapse SIF
        $("#SIF-palette-heading").click();
      }  
      if(! $("#SBML-palette-heading").hasClass("collapsed")) { // collapse SBML
        $("#SBML-palette-heading").click();
      }      
    }
    else if(mapType === "PD"){
      if($("#PD-palette-heading").hasClass("collapsed")) { // expand PD
        $("#PD-palette-heading").click();
      }
      if(! $("#AF-palette-heading").hasClass("collapsed")) { // collapse AF
        $("#AF-palette-heading").click();
      }
      if(! $("#SIF-palette-heading").hasClass("collapsed")) { // collapse SIF
        $("#SIF-palette-heading").click();
      } 
      if(! $("#SBML-palette-heading").hasClass("collapsed")) { // collapse SBML
        $("#SBML-palette-heading").click();
      }        
    }
    else if(mapType === "SIF"){
      if($("#SIF-palette-heading").hasClass("collapsed")) { // expand SIF
        $("#SIF-palette-heading").click();
      }
      if(! $("#PD-palette-heading").hasClass("collapsed")) { // collapse PD
        $("#PD-palette-heading").click();
      }        
      if(! $("#AF-palette-heading").hasClass("collapsed")) { // collapse AF
        $("#AF-palette-heading").click();
      }
      if(! $("#SBML-palette-heading").hasClass("collapsed")) { // collapse SBML
        $("#SBML-palette-heading").click();
      } 
    }
    else if (mapType === "HybridSbgn") {
      if($("#PD-palette-heading").hasClass("collapsed")) { // expand PD
        $("#PD-palette-heading").click();
      }
      if($("#AF-palette-heading").hasClass("collapsed")) { // expand AF
        $("#AF-palette-heading").click();
      }
      if(! $("#SIF-palette-heading").hasClass("collapsed")) { // collapse SIF
        $("#SIF-palette-heading").click();
      }
      if(! $("#SBML-palette-heading").hasClass("collapsed")) { // collapse SBML
        $("#SBML-palette-heading").click();
      } 
    }
    else if (mapType === "SBML"){
      if(!$("#PD-palette-heading").hasClass("collapsed")) { // collapse PD
        $("#PD-palette-heading").click();
      }
      if(!$("#AF-palette-heading").hasClass("collapsed")) { // collapse AF
        $("#AF-palette-heading").click();
      }
      if(! $("#SIF-palette-heading").hasClass("collapsed")) { // collapse SIF
        $("#SIF-palette-heading").click();
      }
      if( $("#SBML-palette-heading").hasClass("collapsed")) { // expand SBML
        $("#SBML-palette-heading").click();
      } 
    }
    else if (mapType === "HybridAny") {
      if($("#PD-palette-heading").hasClass("collapsed")) { // expand PD
        $("#PD-palette-heading").click();
      }
      if($("#AF-palette-heading").hasClass("collapsed")) { // expand AF
        $("#AF-palette-heading").click();
      }
      if($("#SIF-palette-heading").hasClass("collapsed")) { // expand SIF
        $("#SIF-palette-heading").click();
      }
      if($("#SBML-palette-heading").hasClass("collapsed")) { // expand SBML
        $("#SBML-palette-heading").click();
      } 
    }
    else {
      console.warn('invalid map type!');
    }
  }
  
  console.log('init the sbgnviz template/page');

  $(window).on('resize', _.debounce(dynamicResize, 100));

  dynamicResize();
  databasePropertiesView = appUtilities.databasePropertiesView = new BackboneViews.DatabasePropertiesView({el: '#database-properties-table'});
  pushActiveTabsView = appUtilities.pushActiveTabsView = new BackboneViews.PushActiveTabsView({el: '#push-active-tabs-table'});
  layoutPropertiesView = appUtilities.layoutPropertiesView = new BackboneViews.LayoutPropertiesView({el: '#layout-properties-table'});
  colorSchemeInspectorView = appUtilities.colorSchemeInspectorView = new BackboneViews.ColorSchemeInspectorView({el: '#color-scheme-template-container'});
  //generalPropertiesView = appUtilities.generalPropertiesView = new BackboneViews.GeneralPropertiesView({el: '#general-properties-table'});
  mapTabGeneralPanel = appUtilities.mapTabGeneralPanel = new BackboneViews.MapTabGeneralPanel({el: '#map-tab-general-container'});
  mapTabLabelPanel = appUtilities.mapTabLabelPanel = new BackboneViews.MapTabLabelPanel({el: '#map-tab-label-container'});
  mapTabLocalDBSettings = appUtilities.mapTabLocalDBSettings = new BackboneViews.MapTabLocalDBSettings({el: '#map-tab-local-db-container'});
  mapTabRearrangementPanel = appUtilities.mapTabRearrangementPanel = new BackboneViews.MapTabRearrangementPanel({el: '#map-tab-rearrangement-container'});
  experimentTabPanel = appUtilities.experimentTabPanel = new BackboneViews.experimentTabPanel({el: '#map-tab-experiment-container'});
  neighborhoodQueryView = appUtilities.neighborhoodQueryView = new BackboneViews.NeighborhoodQueryView({el: '#query-neighborhood-table'});
  neighborhoodQueryViewLocalDB = appUtilities.neighborhoodQueryViewLocalDB = new BackboneViews.NeighborhoodQueryViewLocalDB({el: '#query-neighborhood-localdatabase-table'});
  pathsBetweenQueryView = appUtilities.pathsBetweenQueryView = new BackboneViews.PathsBetweenQueryView({el: '#query-pathsbetween-table'});
  pathsBetweenQueryViewLocalDB = appUtilities.pathsBetweenQueryViewLocalDB = new BackboneViews.PathsBetweenQueryViewLocalDB({el: '#query-pathsbetween-localdatabase-table'});
  pathsFromToQueryView = appUtilities.pathsFromToQueryView = new BackboneViews.PathsFromToQueryView({el: '#query-pathsfromto-table'});
  PathsFromToQueryViewLocalDB = appUtilities.PathsFromToQueryViewLocalDB = new BackboneViews.PathsFromToQueryViewLocalDB({el: '#query-pathsfromto-localdatabase-table'});
  commonStreamQueryView = appUtilities.commonStreamQueryView = new BackboneViews.CommonStreamQueryView({el: '#query-commonstream-table'});
  commonStreamQueryViewLocalDB = appUtilities.commonStreamQueryViewLocalDB = new BackboneViews.CommonStreamQueryViewLocalDB({el: '#query-commonstream-localdatabase-table'});
  upStreamQueryViewLocalDB = appUtilities.upStreamQueryViewLocalDB = new BackboneViews.UpStreamQueryViewLocalDB({el: '#query-upstream-localdatabase-table'});
  downStreamQueryViewLocalDB = appUtilities.downStreamQueryViewLocalDB = new BackboneViews.DownStreamQueryViewLocalDB({el: '#query-downstream-localdatabase-table'});
  pathsByURIQueryView = appUtilities.pathsByURIQueryView = new BackboneViews.PathsByURIQueryView({el: '#query-pathsbyURI-table'});
  mapByWPIDQueryView = appUtilities.mapByWPIDQueryView = new BackboneViews.MapByWPIDQueryView({el: '#query-mapbyWPID-table'});
  mapByReactomeIDQueryView = appUtilities.mapByReactomeIDQueryView = new BackboneViews.MapByReactomeIDQueryView({el: '#query-mapbyReactomeID-table'});
  //promptSaveView = appUtilities.promptSaveView = new BackboneViews.PromptSaveView({el: '#prompt-save-table'}); // see PromptSaveView in backbone-views.js
  fileSaveView = appUtilities.fileSaveView = new BackboneViews.FileSaveView({el: '#file-save-table'});
  saveUserPreferencesView =  appUtilities.saveUserPreferencesView = new BackboneViews.SaveUserPreferencesView({el: '#user-preferences-save-table'});
  loadUserPreferencesView =  appUtilities.loadUserPreferencesView = new BackboneViews.LoadUserPreferencesView({el: '#user-preferences-load-table'});
  promptConfirmationView = appUtilities.promptConfirmationView = new BackboneViews.PromptConfirmationView({el: '#prompt-confirmation-table'});
  promptMapTypeView = appUtilities.promptMapTypeView = new BackboneViews.PromptMapTypeView({el: '#prompt-mapType-table'});
  promptInvalidFileView = appUtilities.promptInvalidFileView = new BackboneViews.PromptInvalidFileView({el: '#prompt-invalidFile-table'});
  promptInvalidTypeWarning = appUtilities.promptInvalidTypeWarning = new BackboneViews.PromptInvalidTypeWarning({el: '#prompt-errorInvalidType-table'});
  sifMapWarning = appUtilities.sifMapWarning = new BackboneViews.SifMapWarning({el: '#errorSifMap-table'});
  promtErrorPD2AF = appUtilities.promtErrorPD2AF = new BackboneViews.PromtErrorPD2AF({el: '#prompt-errorPD2AF-table'});
  promptFileConversionErrorView = appUtilities.promptFileConversionErrorView = new BackboneViews.PromptFileConversionErrorView({el: '#prompt-fileConversionError-table'});
  reactionTemplateView = appUtilities.reactionTemplateView = new BackboneViews.ReactionTemplateView({el: '#sbgn-bricks-table'});
  gridPropertiesView = appUtilities.gridPropertiesView = new BackboneViews.GridPropertiesView({el: '#grid-properties-table'});
  fontPropertiesView = appUtilities.fontPropertiesView = new BackboneViews.FontPropertiesView({el: '#font-properties-table'});
  infoboxPropertiesView = appUtilities.infoboxPropertiesView = new BackboneViews.InfoboxPropertiesView({el: '#infobox-properties-table'});
  promptInvalidURIView = appUtilities.promptInvalidURIView = new BackboneViews.PromptInvalidURIView({el: '#prompt-invalidURI-table'});
  promptInvalidWPIDView = appUtilities.promptInvalidWPIDView = new BackboneViews.PromptInvalidWPIDView({el: '#prompt-invalidWPID-table'});
  promptInvalidReactomeIDView = appUtilities.promptInvalidReactomeIDView = new BackboneViews.PromptInvalidReactomeIDView({el: '#prompt-invalidReactomeID-table'});
  promptInvalidURIWarning = appUtilities.promptInvalidURIWarning = new BackboneViews.PromptInvalidURIWarning({el: '#prompt-invalidURI-table'});
  promptInvalidReactomeIDWarning = appUtilities.promptInvalidReactomeIDWarning = new BackboneViews.PromptInvalidReactomeIDWarning({el: '#prompt-invalidReactomeID-table'});
  promptInvalidWPIDWarning = appUtilities.promptInvalidWPIDWarning = new BackboneViews.PromptInvalidWPIDWarning({el: '#prompt-invalidWPID-table'});
  promptInvalidURLWarning = appUtilities.promptInvalidURLWarning = new BackboneViews.PromptInvalidURLWarning({el: '#prompt-invalidURL-table'});
  promptInvalidImageWarning = appUtilities.promptInvalidImageWarning = new BackboneViews.PromptInvalidImageWarning({el: '#prompt-invalidImage-table'});
  promptInvalidEdgeWarning = appUtilities.promptInvalidEdgeWarning = new BackboneViews.PromptInvalidEdgeWarning({el: '#prompt-invalidEdge-table'});
  exportErrorView = appUtilities.ExportErrorView = new BackboneViews.ExportErrorView({el: "#exportError-table",});
  toolbarButtonsAndMenu();
  keyboardShortcuts();
  // Events triggered by sbgnviz module
  $(document).on('sbgnvizLoadSample sbgnvizLoadFile', function(event, filename, cy) {

    // check if the event is triggered for the active instance
    var isActiveInstance = ( cy == appUtilities.getActiveCy() );

    var chiseInstance = appUtilities.getChiseInstance(cy);

    // set the current file name for cy
    appUtilities.setScratch(cy, 'currentFileName', filename);
    //clean and reset things
    cy.elements().unselect();
    appUtilities.disableInfoBoxRelocation();

    // a new file is being loaded clear the applied flag of topologyGrouping
    var topologyGrouping = chiseInstance.sifTopologyGrouping;
    topologyGrouping.clearAppliedFlag();

    // unlock graph topology in case it is locked
    chiseInstance.elementUtilities.unlockGraphTopology();    

    // if the event is triggered for the active instance do the followings
    if ( isActiveInstance ) {

      // set file content accordingly
      appUtilities.setFileContent(filename);

      if (!$('#inspector-map-tab').hasClass('active')) {
        $('#inspector-map-tab a').tab('show');
      }
      
      if ($('#inspector-console-tab')[0].style.display == "block") {
        $('#inspector-console-tab')[0].style.display = "none";
      }
    }
  });
  
  // Event triggered before file loaded by URL/URI
  $(document).on('sbgnvizLoadFromURL sbgnvizLoadFromURI', function(event, filename, cy) {
    //alert("getting the file")

    var chiseInstance = appUtilities.getChiseInstance(cy);    
  
    var urlParams = appUtilities.getScratch(cy, 'urlParams');
    
    // get current general properties for cy
    var currentGeneralProperties = appUtilities.getScratch(cy, 'currentGeneralProperties');    
    var sbmlProperty  = {}

    // inferNestingOnLoad and compoundPadding must be set before file loaded
    if (urlParams) {
      // filter map properties from the url parameters
      var mapPropsFromUrl = appUtilities.filterMapProperties(urlParams);

      var sbgnORsbml = appUtilities.filterMapTypeProperty(urlParams);
      if(sbgnORsbml == "true")
      {
        sbmlProperty.sbmlMap = true
      }
      else
      {
        sbmlProperty.sbmlMap = false
      }
      
      
      if("inferNestingOnLoad" in mapPropsFromUrl) {
        currentGeneralProperties.inferNestingOnLoad = (mapPropsFromUrl.inferNestingOnLoad == 'true');
      }
      else {
        currentGeneralProperties.inferNestingOnLoad = false;
      }     
      
      if("compoundPadding" in mapPropsFromUrl){
        currentGeneralProperties.compoundPadding = Number(mapPropsFromUrl.compoundPadding);
        chiseInstance.setCompoundPadding(Number(mapPropsFromUrl.compoundPadding));
      }
      else {
        currentGeneralProperties.compoundPadding = 0;
        chiseInstance.setCompoundPadding(currentGeneralProperties.compoundPadding);
      }
    }

    // set 'currentGeneralProperties' on scratchpad of cy
    appUtilities.setScratch(cy, 'currentGeneralProperties', currentGeneralProperties);    
    appUtilities.setScratch(cy, 'sbmlProperty', sbmlProperty); 
    
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
      updatePalette(chiseInstance.elementUtilities.mapType)

    }
    cy.fit( cy.elements(":visible"), 20 );

    var mapType = chiseInstance.getMapType();
    if (mapType === "SBML") {
      // make the first SBML sample to have 3D style
      if (filename === 'RUNX1_regulates_transcription_of_genes_involved_in_WNT_signaling.nwt') {
        appUtilities.applyMapColorScheme("cell_designer", "3D", appUtilities.colorSchemeInspectorView);
      } else {
        appUtilities.applyMapColorScheme("cell_designer", "solid", appUtilities.colorSchemeInspectorView);
      }
    } else if (mapType !== "SBML") {
      appUtilities.applyMapColorScheme("black_white", "solid", appUtilities.colorSchemeInspectorView);
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

      const connectedEdges = node.connectedEdges();
      let oldNodeId = node.data('id');
      let newId = elementUtilities.generateNodeId();
      const x = node.position().x;
      const y = node.position().y;
      const nodeData = node.data();
      const nodeParams = {
        class:nodeData.class,
        language:nodeData.language,
      };
      const parent = nodeData.parent;
      const visibility = node.data('visibility');
      const newNode = chiseInstance.addNode(x,y,nodeParams,newId,parent,visibility);
      for (const [property, value] of Object.entries(nodeData)) {
        newNode.data(property,value);
      }
      chiseInstance.changeNodeLabel(newNode, lines);
      let children = node.children();
      chiseInstance.changeParent(children, newNode, 0, 0);
      connectedEdges.forEach((edge)=>{
        let source =edge.data('source'),target=edge.data('target');
        let connectedProcess = null;
        if(source===oldNodeId){
          source = newId;
          connectedProcess = cy.getElementById(target);
        }
        if(target===oldNodeId){
          target = newId;
          connectedProcess = cy.getElementById(source);
        }

        let connectedNodeX = connectedProcess.position().x;
        let connectedNodeY = connectedProcess.position().y;
        let connectedProcessData = connectedProcess.data();
        const connectedProcessParams={
          class:connectedProcessData.class,
          language:connectedProcessData.language,
        };
        const connectedProcessParent = connectedProcessData.parent;
        const connectedProcessVisibility = connectedProcess.data('visibility');
        let newConnectedProcess = chiseInstance.addNode(connectedNodeX,connectedNodeY,connectedProcessParams,undefined,connectedProcessParent,connectedProcessVisibility); 
        
        for (const [property, value] of Object.entries(connectedProcessData)) {
          newConnectedProcess.data(property,value);
        }

        const connectedProcessEdges = connectedProcess.connectedEdges();
        connectedProcessEdges.forEach((connectedEdge)=>{
          let connectedEdgeSource = connectedEdge.data('source');
          let connectedEdgeTarget = connectedEdge.data('target');
          if(connectedEdgeSource===connectedProcess.id()){
            connectedEdgeSource=newConnectedProcess.id();
          }
          if(connectedEdgeTarget===connectedProcess.id()){
            connectedEdgeTarget=newConnectedProcess.id();
          }
          if(connectedEdgeSource===oldNodeId){
            connectedEdgeSource=newNode.id();
          }
          if(connectedEdgeTarget===oldNodeId){
            connectedEdgeTarget=newNode.id();
          }

          const edgeData = connectedEdge.data();
          const edgeParams = {
            class:edgeData.class,
            language:edgeData.language,
          }
          const edgeVisibility = connectedEdge.data('visibility');
          const groupId = edgeData.groupID;
          let newConnectedEdge = chiseInstance.addEdge(connectedEdgeSource,connectedEdgeTarget,edgeParams,undefined,edgeVisibility,groupId);
          for (const [property, value] of Object.entries(edgeData)) {
            newConnectedEdge.data(property, value);
          } 

          newConnectedEdge.data("cyedgebendeditingDistances", connectedEdge.data("cyedgebendeditingDistances"));
          newConnectedEdge.data("cyedgebendeditingWeights", connectedEdge.data("cyedgebendeditingWeights"));
          newConnectedEdge.data("cyedgecontroleditingDistances", connectedEdge.data("cyedgecontroleditingDistances"));
          newConnectedEdge.data("cyedgecontroleditingWeigths", connectedEdge.data("cyedgecontroleditingWeigths"));
          newConnectedEdge._private.classes._obj = connectedEdge._private.classes._obj;
          connectedEdge.remove();
        });
        connectedProcess.remove();
      });
      connectedEdges.remove();
      node.remove();
      cy.style().update(); 
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

    $('#load-from-file').click(function(){
      $('#input-file').trigger('click');
    });

    $('#input-file').change(function(e,fileObject){
      // use the active chise instance
      var chiseInstance = appUtilities.getActiveChiseInstance();

      // use cy instance assocated with chise instance
      var cy = appUtilities.getActiveCy();
      if($(this).val()===''&&!fileObject){
        console.log("There was some problem with the file");
        return;
      }
      var file = this.files[0] || fileObject;
      var fileExtension = file.name.split('.').pop();
      var loadCallbackInvalidityWarning=()=>{promptInvalidFileView.render()};
      
      if(fileExtension==='nwt'){
        var loadCallbackSBGNMLValidity = function (text) {
          //validateSBGNML(text);
        }
        params = [loadCallbackSBGNMLValidity, loadCallbackInvalidityWarning,,(e)=>{
          pushActiveTabsView.render(e,"Push From File");
        }];
        caller = chiseInstance.loadFileToLocal;
      }

      if(cy.elements().length != 0) {
        promptConfirmationView.render(() => {
          setTimeout(() => caller(file, ...params), 150);
        });
      }
      else {
        caller(file, ...params);
      }
      $(this).val("");
    });

    $("#load-file, #load-file-icon").click(function () {
      $("#file-input").trigger('click');
    });

    $("#file-input").change(function (e, fileObject) {
      

      // use the active chise instance
      var chiseInstance = appUtilities.getActiveChiseInstance();

      // use cy instance assocated with chise instance
      var cy = appUtilities.getActiveCy();

      if ($(this).val() != "" || fileObject) {
        var file = this.files[0] || fileObject;
        console.log('file:',file);
        var params, caller;
        var fileExtension = file.name.split('.').pop();

        var loadCallbackInvalidityWarning  = function () {
          promptInvalidFileView.render();
        }

        if(fileExtension == 'sif'){
          var layoutBy = function() {
            appUtilities.triggerLayout( cy, true );
          };
          params = [layoutBy, loadCallbackInvalidityWarning];
          caller = chiseInstance.loadSIFFile;
        }
        else if(fileExtension == 'sbml'){
          var layoutBy = function() {
            appUtilities.triggerLayout( cy, true );
          };
          var success = function(data){
            chiseInstance.loadSBMLText(data.message, false, file.name, cy);
          }; 
          var error = function(data){
            promptFileConversionErrorView.render();          
            document.getElementById("file-conversion-error-message").innerText = "Conversion failed.";         
          },
          caller = chiseInstance.loadSbmlForSBML; 
          params = [success, error, layoutBy];
        }
        else if(fileExtension == 'xml'){
          appUtilities.setFileContent(file.name); 
          var success = function(data){
            chiseInstance.loadSBGNMLText(data, true, file.name, cy);
          };
          var error = function(data){
            promptFileConversionErrorView.render();          
            document.getElementById("file-conversion-error-message").innerText = "Conversion failed.";  
          };
          caller = chiseInstance.loadCellDesigner;
          params = [success, error];
        }
        else if(fileExtension == 'gpml'){
          appUtilities.setFileContent(file.name);
          var success = function(data){
            chiseInstance.loadSBGNMLText(data.message, false, file.name, cy);
          };
          var error = function(data){
            promptFileConversionErrorView.render();          
            document.getElementById("file-conversion-error-message").innerText = "Conversion failed.";
            
          };
          caller = chiseInstance.loadGpml;
          params = [success, error];
        }
        else{
          var loadCallbackSBGNMLValidity = function (text) {
            //validateSBGNML(text);
          }
          params = [loadCallbackSBGNMLValidity, loadCallbackInvalidityWarning];
          caller = chiseInstance.loadNwtFile;
        }

        if(cy.elements().length != 0) {
          promptConfirmationView.render(() => {
            setTimeout(() => caller(file, ...params), 150);
          });
        }
        else {
          caller(file, ...params);
        }
        $(this).val("");
      }
    });

    $('#import-celldesigner-file').click(function (){
        $("#celldesigner-file-input").trigger('click');
    });

    $('#celldesigner-file-input').change(function (e, fileObject) {
      var chiseInstance = appUtilities.getActiveChiseInstance();
      var cy = appUtilities.getActiveCy();
      if ($(this).val() != "") {
        var file = this.files[0];
        appUtilities.setFileContent(file.name);
        chiseInstance.loadCellDesigner(file, 
        success = function(data){
          if (cy.elements().length !== 0) {
            promptConfirmationView.render(function () {
              chiseInstance.loadSBGNMLText(data, true, file.name, cy);
            });
          }
          else {
            chiseInstance.loadSBGNMLText(data, true, file.name, cy);
          }
        },
        error = function(data){
          promptFileConversionErrorView.render();          
          document.getElementById("file-conversion-error-message").innerText = "Conversion failed.";  
        });
       
        $(this).val("");
      }  
    });

    $("#import-experimental-data").click(function () {
      $("#overlay-data").trigger('click');
    });

    $("#import-SBML-file").click(function () {
      $("#sbml-file").trigger('click');
    });

    $("#import-simple-af-file").click(function () {
      $("#simple-af-file-input").trigger('click');
    });

    $("#import-sif-file").click(function () {
      $("#sif-file-input").trigger('click');
    });

    $("#import-sif-style").click(function () {
      //Check if current map type is SIF
      var mapType = appUtilities.getActiveChiseInstance().elementUtilities.mapType;
      if (mapType != "SIF") {
        sifMapWarning.render();
        return;
      }
      $("#sif-style-input").trigger('click');
    });

    $("#import-sif-layout").click(function () {
      //Check if current map type is SIF
      var mapType = appUtilities.getActiveChiseInstance().elementUtilities.mapType;
      if (mapType != "SIF") {
        sifMapWarning.render();
        return;
      }
      $("#sif-layout-input").trigger('click');
    });

    $("#import-GPML-file").click(function () {
      $("#gpml-file-input").trigger('click');
    });

    $("#overlay-data").change(function () {
      var chiseInstance = appUtilities.getActiveChiseInstance();
      var cy = appUtilities.getActiveCy();
      if ($(this).val() != "") {
        var file = this.files[0];
        var reader = new FileReader();

        reader.onload = function(e) {
          var data = this.result;
          var fileName = file.name;
          var errorCallback = function(){
          promptInvalidFileView.render();
        };
        var fileName = file.name;
        params = {data: data, fileName: fileName, errorCallback: errorCallback};
        experimentTabPanel.loadExperiment(params);
        experimentTabPanel.render();
      };

      reader.fileName = file.name;
      reader.readAsText( file );

      $(this).val("");
      }
    });

    $("#sample-experiment-data").click(function (){
      var chiseInstance = appUtilities.getActiveChiseInstance();
      var cy = appUtilities.getActiveCy();
      var overlayExperimentData  = function () {
        var chiseInstance = appUtilities.getActiveChiseInstance();
        var data ="name\tsample experiment data\r\ndescription\tAdenoid Cystic Carcinoma 2014 vs 2019\r\nel\t2014\t2019\r\nRB1\t36\t12\r\nTP53\t36\t72\r\nCDKN2A\t0\t14\r\nMDM2\t0\t5\r\nCCNE\t0\t7\r";
        var errorCallback = function(){
          promptInvalidFileView.render();
        };       
        params ={data: data, fileName: "acc_2014vs2019.txt", errorCallback: errorCallback, sampleExperiment: true};
        experimentTabPanel.loadExperiment(params);
        experimentTabPanel.render();
      };
      if(cy.elements().length != 0) {
        promptConfirmationView.render(
          function(){
            loadSample('tp53_rb_pathway.nwt', overlayExperimentData);
          });
      }
      else {
        loadSample('tp53_rb_pathway.nwt', overlayExperimentData);
      }

      $(this).val("");
      
    });
    
    $("#sbml-file").change(function () {
      var chiseInstance = appUtilities.getActiveChiseInstance();

      // use cy instance assocated with chise instance
      var cy = appUtilities.getActiveCy();


      if ($(this).val() != "") {
        var file = this.files[0];

        var loadFcn = function() {
          var layoutBy = function() {
            appUtilities.triggerLayout( cy, true );
          };
          chiseInstance.loadSbmlForSBML(file,  success = function(data){
              chiseInstance.loadSBMLText(data.message, false, file.name, cy);
          },  error = function(data){
            promptFileConversionErrorView.render();          
            document.getElementById("file-conversion-error-message").innerText = "Conversion failed.";
            
          }, layoutBy)
        };
        if( cy.elements().length != 0)
          promptConfirmationView.render( loadFcn );
        else
          loadFcn();

        $(this).val("");
      }
    });

    $("#gpml-file-input").change(function () {
     
      var chiseInstance = appUtilities.getActiveChiseInstance();
      var cy = appUtilities.getActiveCy();
      if ($(this).val() != "") {
        var file = this.files[0];
        appUtilities.setFileContent(file.name);
        chiseInstance.loadGpml(file,  success = function(data){
          if (cy.elements().length !== 0) {
            promptConfirmationView.render(function () {
              chiseInstance.loadSBGNMLText(data.message, false, file.name, cy);
            });
          }
          else {
            chiseInstance.loadSBGNMLText(data.message, false, file.name, cy);
          }
        },
        error = function(data){
          promptFileConversionErrorView.render();          
          document.getElementById("file-conversion-error-message").innerText = "Conversion failed.";
          
        });
       
        $(this).val("");
      }
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

    $("#sif-style-input").change(function () {
      if ($(this).val() != "") {
        var file = this.files[0];
        var reader = new FileReader();

        reader.onload = function(e) {
          //Get the text result of the file.
          var text = this.result;

          var chiseInstance = appUtilities.getActiveChiseInstance();
          var sifStyle = sifStyleFactory();
          sifStyle( chiseInstance );
          sifStyle.apply( text );
        };

        reader.readAsText( file );

        $(this).val("");
      }
    });

    $("#sif-layout-input").change(function () {
      if ($(this).val() != "") {
        var file = this.files[0];
        var reader = new FileReader();

        reader.onload = function(e) {
          //Get the text result of the file.
          var text = this.result;

          var chiseInstance = appUtilities.getActiveChiseInstance();
          chiseInstance.loadLayoutData( text, true );
        };

        reader.readAsText( file );

        $(this).val("");
      }
    });

    // TODO: eliminate code replication in similar functions.
    $("#sif-file-input").change(function () {
      var chiseInstance = appUtilities.getActiveChiseInstance();

      // use cy instance assocated with chise instance
      var cy = appUtilities.getActiveCy();

      var loadCallbackInvalidityWarning  = function () {
        promptInvalidFileView.render();
      }

      if ($(this).val() != "") {
        var file = this.files[0];

        var loadFcn = function() {
          var layoutBy = function() {
            appUtilities.triggerLayout( cy, true );
          };
          chiseInstance.loadSIFFile(file, layoutBy, loadCallbackInvalidityWarning);
        };
        if( cy.elements().length != 0)
          promptConfirmationView.render( loadFcn );
        else
          loadFcn();

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

      // unlock graph topolpgy in case it is locked
      chiseInstance.elementUtilities.unlockGraphTopology();
      // reset map name and description
      // default map name should be a string that contains the network id
      if(!currentGeneralProperties.mapPD2AFConverted) {// if the file don't have a specified map name from pd map to af map conversion
        currentGeneralProperties.mapName = appUtilities.getDefaultMapName(networkId);
        currentGeneralProperties.mapDescription = appUtilities.defaultGeneralProperties.mapDescription;
      }
      currentGeneralProperties.mapPD2AFConverted = false; // Map name loaded, when new map is loading to the canvas name should be change

      // set recalculate layout on complexity management based on map size
      if (cy.nodes().length > 1250){
        currentGeneralProperties.recalculateLayoutOnComplexityManagement = false;
      }
      if(currentGeneralProperties.inferNestingOrigin)
        currentGeneralProperties.inferNestingOnLoad = currentGeneralProperties.inferNestingOrigin;

      // get and set properties from file
      var properties = chiseInstance.getMapProperties();
      // init map properties
      var mapProperties = (properties && properties['nwt:mapProperties']) 
      ? properties['nwt:mapProperties'] 
      : (properties && properties.mapProperties) 
          ? properties.mapProperties 
          : {};
      var urlParams = appUtilities.getScratch(cy, 'urlParams');

      if (urlParams) {
        // clear urlParams from scratch
        appUtilities.setScratch(cy, 'urlParams', undefined);

        // filter map properties from the url parameters

        // get applyLayout value before map properties are filtered, apply layout
        // isn't really a map property so its not added to sbgnviz 
        // validMapProperties
        const applyLayout = urlParams.applyLayoutOnURL === "true";
        const fromURL = urlParams.url !== undefined;
        if (urlParams.compoundPadding) {
          const compoundPadding = urlParams.compoundPadding;
          chiseInstance.setCompoundPadding(Number(compoundPadding));
        }
        var mapPropsFromUrl = appUtilities.filterMapProperties(urlParams);
        
        if(!("inferNestingOnLoad" in mapPropsFromUrl)) {
          mapPropsFromUrl.inferNestingOnLoad = false;
        }   

        if(!("compoundPadding" in mapPropsFromUrl)){
          mapPropsFromUrl.compoundPadding = 0;
        }

        if (fromURL && applyLayout) {
          let currentLayoutProperties = appUtilities.getScratch(cy, 'currentLayoutProperties');

          // Below is copied from sbgnviz.graphUtilities.updateGraph
          let preferences = {};
          if(cy.nodes().length > 3000 || cy.edges().length > 3000) {
            preferences.quality = "draft";
          }
          preferences.animate = false;
          preferences.randomize = true;
          preferences = $.extend({}, currentLayoutProperties, preferences);
          layoutPropertiesView.applyLayout(preferences);
        }
        if (urlParams.mapColorScheme) {
          appUtilities.applyMapColorScheme(urlParams.mapColorScheme, currentGeneralProperties.mapColorSchemeStyle, appUtilities.colorSchemeInspectorView);
        }

        // merge the map properties coming from url into
        // the map properties read from file
        for ( var prop in mapPropsFromUrl ) {
          mapProperties[prop] = mapPropsFromUrl[prop];
        }
      }
      //BURAYA EKLE --
      // some operations are to be performed if there is any map property
      // that comes from URL or read from file
      var mapPropertiesExist = ( !$.isEmptyObject( mapProperties ) );

      if (mapPropertiesExist) {
          appUtilities.setMapProperties(mapProperties);
      }

      // some operations are to be done if the event is triggered for the active instance
      if ( isActiveInstance ) {
        // update map panel
        mapTabGeneralPanel.render();
        mapTabRearrangementPanel.render();
        mapTabLabelPanel.render();
        // mapTabLocalDBSettings.render();
        experimentTabPanel.render();
        if (mapPropertiesExist){
          // update map panel
          appUndoActions.refreshColorSchemeMenu({value: currentGeneralProperties.mapColorScheme, self: colorSchemeInspectorView, scheme_type: currentGeneralProperties.mapColorSchemeStyle});
        }
      }

      if (mapPropertiesExist) {

        // set default colors(or background images) according to the specified color scheme style
        if(currentGeneralProperties.mapColorSchemeStyle == 'solid'){
          for(var nodeClass in appUtilities.mapColorSchemes[currentGeneralProperties.mapColorScheme]['values']){
            classBgColor = appUtilities.mapColorSchemes[currentGeneralProperties.mapColorScheme]['values'][nodeClass];
            // nodeClass may not be defined in the defaultProperties (for edges, for example)
            
            var bgObj = chiseInstance.elementUtilities.getBackgroundImageObjs(cy.nodes());
            chiseInstance.removeBackgroundImage(cy.nodes(), bgObj);
            if(nodeClass in chiseInstance.elementUtilities.getDefaultProperties()){
              chiseInstance.undoRedoActionFunctions.setDefaultProperty({class: nodeClass, name: 'background-image', value: ''});
              chiseInstance.undoRedoActionFunctions.setDefaultProperty({class: nodeClass, name: 'background-color', value: classBgColor});
            }
          }
        }

        else{
          for(var nodeClass in appUtilities.mapColorSchemes[currentGeneralProperties.mapColorScheme]['values']){
            classBgColor = appUtilities.mapColorSchemes[currentGeneralProperties.mapColorScheme]['values'][nodeClass];
            classBgImg = currentGeneralProperties.mapColorSchemeStyle == 'gradient'
                       ? appUtilities.colorCodeToGradientImage[appUtilities.mapColorSchemes[currentGeneralProperties.mapColorScheme]['values'][nodeClass]]
                       : appUtilities.colorCodeTo3DImage[appUtilities.mapColorSchemes[currentGeneralProperties.mapColorScheme]['values'][nodeClass]];
            // nodeClass may not be defined in the defaultProperties (for edges, for example)
            if(nodeClass in chiseInstance.elementUtilities.getDefaultProperties()){
              chiseInstance.undoRedoActionFunctions.setDefaultProperty({class: nodeClass, name: 'background-color', value: '#ffffff'});
              chiseInstance.undoRedoActionFunctions.setDefaultProperty({class: nodeClass, name: 'background-fit', value: 'cover'});
              chiseInstance.undoRedoActionFunctions.setDefaultProperty({class: nodeClass, name: 'background-opacity', value: '1'});
              chiseInstance.undoRedoActionFunctions.setDefaultProperty({class: nodeClass, name: 'background-position-x', value: '50%'});
              chiseInstance.undoRedoActionFunctions.setDefaultProperty({class: nodeClass, name: 'background-position-y', value: '50%'});
              chiseInstance.undoRedoActionFunctions.setDefaultProperty({class: nodeClass, name: 'background-image', value: classBgImg});
              chiseInstance.undoRedoActionFunctions.setDefaultProperty({class: nodeClass, name: 'background-width', value: '100%'});
              chiseInstance.undoRedoActionFunctions.setDefaultProperty({class: nodeClass, name: 'background-height', value: '100%'});
            }
          }
        }

      };

      // reset current general properties at the scratch pad of cy
      appUtilities.setScratch(cy, 'currentGeneralProperties', currentGeneralProperties);

      var activeChiseId = appUtilities.networkIdsStack[appUtilities.networkIdsStack.length-1];
      $('#' + appUtilities.getMapTypeDivId(activeChiseId)).text(appUtilities.getTabLabelName(chiseInstance.getMapType()));

      cy.fit( cy.elements(":visible"), 20 );
    });

    $("#PD-legend").click(function (e) {
      e.preventDefault();
      $("#PD_legend_modal").modal('show');
    });

    $("#AF-legend").click(function (e) {
      e.preventDefault();
      $("#AF_legend_modal").modal('show');
    });

    $("#SIF-legend").click(function (e) {
      e.preventDefault();
      $("#SIF_legend_modal").modal('show');
    });

    $("#SBML-legend").click(function (e) {
      e.preventDefault();
      $("#SBML_legend_modal").modal('show');
    });

    $("#quick-help, #quick-help-icon").click(function (e) {
      e.preventDefault();
      $("#quick_help_modal").modal('show');
    });

    $("#quick-tutorial").click(function (e) {
      e.preventDefault();
      tutorial.introduction();
    });

    $("#ui-guide").click(function (e) {
      e.preventDefault();
      tutorial.UIGuide();
    });

    $("#database-properties").click(async function (e) {
      e.preventDefault();
      const nodeCount = await databaseUtilities.getAllNodeCount();
      console.log("nodeCount", nodeCount);
      databasePropertiesView.render(nodeCount);
    });

    $("#about, #about-icon").click(function (e) {
      e.preventDefault();
      $("#about_modal").modal('show');
    });

    $(".title").click(function(e){
      e.stopPropagation();
    });

    var selectorToSampleFileName = {
     "#load-sample1" : 'neuronal_muscle_signaling.nwt',
      "#load-sample2" : 'cam-camk_dependent_signaling_to_the_nucleus.nwt',
      "#load-sample3" : 'atm_mediated_phosphorylation_of_repair_proteins.nwt',
      "#load-sample4" : 'activated_stat1alpha_induction_of_the_irf1_gene.nwt',
      "#load-sample5" : 'vitamins_b6_activation_to_pyridoxal_phosphate.nwt',
      "#load-sample6" : 'insulin-like_growth_factor_signaling.nwt',
      "#load-sample7" : 'polyq_proteins_interference.nwt',
      "#load-sample8" : 'glycolysis.sbgn',
      "#load-sample9" : 'mapk_cascade.sbgn',
      "#load-sample10" : 'drosophila_cell_cycle.nwt',
      "#load-sample11" : 'mammalian_cholesterol.nwt',
      "#load-sample12" : 'two_gene_system_behavior.nwt',
      "#load-sample13" : 'transforming_growth_factor_beta_signaling.nwt',
      "#load-sample14" : 'repressilator.nwt',
      "#load-sample15" : 'epidermal_growth_factor_receptor.nwt',
      "#load-sample16" : 'regulation_of_tgfbeta-induced_metastasis.sbgn',
      "#load-sample17" : 'RTN4-controllers-and-binding-proteins.nwt',
      "#load-sample18" : 'signaling-downstream-of-AKT2-3.nwt',
      "#load-sample19" : 'pd_learners_card.nwt',
      "#load-sample20" : 'af_learners_card.nwt',
      "#load-sample21" : 'RUNX1_regulates_transcription_of_genes_involved_in_WNT_signaling.nwt',
      "#load-sample22" : 'PTK6_Activates_STAT3.nwt',
      "#load-sample23" : 'pharmacokinetics_of_PFOA_and_PFOS_in_the_monkey.nwt',
      "#load-sample24" : 'interaction_topologies_of_MAPK_cascade.nwt'
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

    $("#hide-selected-smart, #hide-selected-smart-icon").click(function(e) {

      // use active cy instance
      var cy = appUtilities.getActiveCy();

      appUtilities.hideNodesSmart(cy.nodes(":selected"));
      $('#inspector-palette-tab a').tab('show');
    });

    $("#hide-selected-simple, #hide-selected-simple-icon").click(function(e) {
      var cy = appUtilities.getActiveCy();
      
      appUtilities.hideElesSimple(cy.elements(":selected"));
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
      
      var selectedNodeSize = cy.nodes(':selected').length;

      appUtilities.deleteNodesSmart(cy.nodes(':selected'));
      if(!chiseInstance.elementUtilities.isGraphTopologyLocked() && selectedNodeSize > 0)
        $('#inspector-palette-tab a').tab('show');
    });

    $("#resize-nodes-to-content").click(function (e) {

        // use active chise instance
        var chiseInstance = appUtilities.getActiveChiseInstance();

        // use cy instance associated with chise instance
        var cy = chiseInstance.getCy();

        //Remove processes and other nodes which cannot be resized according to content
        var toBeResized = cy.nodes().difference('node[class*="process"],[class*="association"],[class*="dissociation"],[class="empty set"],[class="and"],[class="or"],[class="not"],[class="delay"],[class="degradation"],[class="unknown logical operator"],:parent');
        
        appUtilities.resizeNodesToContent(toBeResized);

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

    // PD map to AF map conversion 
    $("#highlight-errors-of-pd2af").click(function (e) {
    
      var chiseInstance = appUtilities.getActiveChiseInstance();
      var chiseSpinnerInstance = appUtilities.getActiveChiseInstance();
      var filename = document.getElementById('file-name').innerHTML;
      var fExt = 'sbgn';
      filename = filename.substring(0, filename.lastIndexOf('.')).concat(".").concat(fExt);

      // Get the map from the canvas
      
      var cy = chiseInstance.getCy();
      var nodes = cy.nodes().filter( function( node ) {
        return node.visible();
      } );
      
      var edges = cy.edges().filter( function( edge ) {
        return edge.visible();
      } );

      var renderInfo = appUtilities.getAllStyles(cy, nodes, edges);
      var properties = appUtilities.getScratch(appUtilities.getActiveCy(), 'currentGeneralProperties');

      var file = chiseInstance.getSbgnvizInstance().convertSbgn(filename, "plain", renderInfo, properties, nodes, edges, true);
      if(chiseInstance.getMapType() != 'PD'){
        promptInvalidTypeWarning.render();
        return;
      }

      if(nodes.length == 0 || edges.length == 0){
        promtErrorPD2AF.render("No visible map found!");
        return;
      }
      var currentGeneralProperties = appUtilities.getScratch(appUtilities.getActiveCy(), 'currentGeneralProperties');
      var inferNestingOrigin = currentGeneralProperties.inferNestingOnLoad;
      var mapColorScheme = currentGeneralProperties.mapColorScheme;
      var mapColorSchemeStyle = currentGeneralProperties.mapColorSchemeStyle;
      chiseSpinnerInstance.startSpinner("layout-spinner");

      // pd2af returns filename and file url
      $.ajax({
        // After deploying Bridge Server (pd2af-webservice) write the bridge server's URL but leave the /convert
        // url: "https://pd2afwebservice.herokuapp.com/convert",
        url: "http://139.179.21.94:4000/convert", //public server url
        type: "POST",
        ContentType: 'multipart/form-data; boundary=----WebKitFormBoundaryQzlzmdgbQfbawnvk',
        data: {
          'file': file,
          'filename': filename
        },
        success: function (data) {
          // If response returns error display the message
          if(data.name==='Error' || data.error || data.name==='error'){
            chiseSpinnerInstance.endSpinner("layout-spinner");
            promtErrorPD2AF.render(data.message);
          }else{
            chiseSpinnerInstance.endSpinner("layout-spinner");
            filename = data.filename;

            // Create new network 
            var current = appUtilities.getScratch(appUtilities.getActiveCy(), 'currentGeneralProperties');
            var networkName = current.mapName;
            var networkDescription = current.mapDescription;
            // If networkDescription itself is used to create the description text, original map description would also be changed
            if(networkDescription ){
              var st = JSON.stringify(networkDescription[0]);
              st = st.slice(1); // For removing " at the beginning
              st = "AF map of " + st.charAt(0).toLowerCase() + st.slice(1);
              st = st.slice(0,-1); // For removing " at the end
            }
            networkName += " AF";
            var newNetwork = appUtilities.createNewNetwork(networkName, st); // Create new network (new Newt tab)
            var currentGeneralProperties = appUtilities.getScratch(appUtilities.getActiveCy(), 'currentGeneralProperties');
            currentGeneralProperties.mapPD2AFConverted = true; // Set it to true so load will not overwrite the map name and description
            currentGeneralProperties.inferNestingOrigin = inferNestingOrigin;
            currentGeneralProperties.inferNestingOnLoad = true;
            
            currentGeneralProperties.mapColorSchemeStyle = mapColorSchemeStyle;
            currentGeneralProperties.mapColorScheme = mapColorScheme;
            appUtilities.setScratch(appUtilities.getActiveCy(), 'currentGeneralProperties', currentGeneralProperties);

            chiseInstance = appUtilities.getActiveChiseInstance();
            var fileExtension = filename.split('.');
            var fileToLoad = new File([data.body], filename, {
                      type: 'text/sbgn',
                      lastModified: Date.now()
            });

            setTimeout(function(){
              chiseInstance.loadSBGNMLFile(fileToLoad, ()=>{}, ()=>{}, data);
            }, 1000);
            appUtilities.setScratch(appUtilities.getActiveCy(), 'currentGeneralProperties', currentGeneralProperties);
            appUtilities.applyMapColorScheme(currentGeneralProperties.mapColorScheme, currentGeneralProperties.mapColorSchemeStyle, appUtilities.colorSchemeInspectorView);
          }
        },
        error: function (data) {
          chiseSpinnerInstance.endSpinner("layout-spinner");
          if(data.status == 0)
            promtErrorPD2AF.render("Server might be offline!");
          
          else
            promtErrorPD2AF.render(data.message);
        }
      });
    });
  
  $("#highlight-errors-of-validation, #highlight-errors-of-validation-icon").click(function (e) {
   modeHandler.enableReadMode();
    // use active chise instance
    var chiseInstance = appUtilities.getActiveChiseInstance();
    var cy = appUtilities.getActiveCy();
    var file = chiseInstance.getSbgnvizInstance().createSbgnml();
    if(chiseInstance.elementUtilities.mapType != "PD")
    {
        inspectorUtilities.handleSBGNConsole([],0,cy,file,true);
    }else 
    {
      var errors = chiseInstance.doValidation(file);
      inspectorUtilities.handleSBGNConsole(errors,0,cy,file,false);
    }
    
    var tabContents = document.getElementsByClassName('validation-mode-tab');
    for (var i = 0; i < tabContents.length; i++) {       
      $(tabContents[i]).removeClass('active');
      $($(tabContents[i]).children('a')[0]).removeAttr("data-toggle");
    } 

    $('#inspector-console-tab')[0].style.display = "block";
    if (!$('#inspector-console-tab').hasClass('active')) {
      $('#inspector-console-tab a').tab('show');
    }
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
      
      if(!chiseInstance.elementUtilities.isGraphTopologyLocked())
        $('#inspector-palette-tab a').tab('show');
    });

    $("#general-properties, #properties-icon").click(function (e) {
      // Go to inspector map tab
      if (!$('#inspector-map-tab').hasClass('active')) {
        $('#inspector-map-tab a').tab('show');
      }
    });

    $("#query-neighborhood").click(function (e) {
        neighborhoodQueryView.render();
    });
    $("#query-neighborhood-localdatabase").click(function (e) {
      neighborhoodQueryViewLocalDB.render();
  });

    $("#query-pathsbetween, #query-pathsbetween-icon").click(function (e) {
        pathsBetweenQueryView.render();
    });

    $("#query-pathsbetween-localdatabase, #query-pathsbetween-icon").click(function (e) {
      console.log("clicked")
      pathsBetweenQueryViewLocalDB.render();
  });

    $("#query-pathsfromto").click(function (e) {
        pathsFromToQueryView.render();
    });
    
    $("#query-pathsfromto-localdatabase").click(function (e) {
      PathsFromToQueryViewLocalDB.render();
  });

    $("#query-commonstream").click(function (e) {
        commonStreamQueryView.render();
    });
    $("#query-commonstream-localdatabase").click(function (e) {
      commonStreamQueryViewLocalDB.render();
  });

  $("#query-upstream-localdatabase").click(function (e) {
    upStreamQueryViewLocalDB.render();
  });

  $("#query-downstream-localdatabase").click(function (e) {
    console.log("clocked")
    downStreamQueryViewLocalDB.render();
  });

    $("#query-pathsbyURI").click(function (e) {
        pathsByURIQueryView.render();
    });

    $("#query-mapbyWPID").click(function (e) {
        mapByWPIDQueryView.render();
    });

    $("#query-mapbyReactomeID").click(function (e) {
      mapByReactomeIDQueryView.render();
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

    $("#perform-layout, #perform-layout-icon").click( function (e) {
      // use active chise instance
      var chiseInstance = appUtilities.getActiveChiseInstance();

      // if there is no element in the cy instance, then return directly
      var cy = chiseInstance.getCy();
      if(cy.elements().length == 0) {
        return;
      }
      chiseInstance.startSpinner("layout-spinner")

      setTimeout(() => {
      // get current general properties for cy
      var currentGeneralProperties = appUtilities.getScratch(cy, 'currentGeneralProperties');
      var preferences = {
        animate: (cy.nodes().length > 3000 || cy.edges().length > 3000) ? false : currentGeneralProperties.animateOnDrawingChanges
      };
      layoutPropertiesView.applyLayout(preferences);
    }, 0);
    });

    $("#perform-static-layout, #perform-static-layout-icon").click(function (e) {

      // use active chise instance
      var chiseInstance = appUtilities.getActiveChiseInstance();

      // if there is no element in the cy instance, then return directly
      var cy = chiseInstance.getCy();
      if(cy.elements().length == 0) {
        return;
      }
      chiseInstance.startSpinner("layout-spinner");

      setTimeout(() => {
      // get current general properties for cy
      var currentGeneralProperties = appUtilities.getScratch(cy, 'currentGeneralProperties');      
      var preferences = {
        quality: (cy.nodes().length > 3000 || cy.edges().length > 3000) ? "draft" : "default",
        animate: (cy.nodes().length > 3000 || cy.edges().length > 3000) ? false : currentGeneralProperties.animateOnDrawingChanges,
        randomize: true
      };

      layoutPropertiesView.applyLayout(preferences);
    }, 0);
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
      fileSaveView.render("png", null, null);
    });

    $("#save-as-jpg").click(function (evt) {
      fileSaveView.render("jpg", null, null);
    });

    $("#save-as-svg").click(function (evt) {
      fileSaveView.render("svg", null, null);
    });

    $("#save-as-nwt, #save-icon").click(function (evt) {
      //var filename = document.getElementById('file-name').innerHTML;
      //chise.saveAsSbgnml(filename);
      fileSaveView.render("nwt", "0.2");
    });
    
     $("#save-user-preferences").click(function (evt) {      
      saveUserPreferencesView.render();
    });

    $("#load-user-preferences").click(function () {
      $("#user-preferences-file-input").trigger('click');
    });

    $("#user-preferences-file-input").change(function () {

      if ($(this).val() != "") {
        var file = this.files[0];
        var reader = new FileReader();
        reader.addEventListener("loadend", function(e){
          var text = e.srcElement.result;
          var preferences = JSON.parse(text);  
          appUtilities.loadedUserPreferences = preferences;
          loadUserPreferencesView.render(preferences);
        });
        //start the reading process.
        reader.readAsText(file); 
        $(this).val("");
      }
    });

    $("#export-as-nwt3-file").click(function (evt) {
      fileSaveView.render("nwt", "0.3");
    });

    $("#export-as-celldesigner-file").click(function (evt) {
      fileSaveView.render("celldesigner", null, null);
      /*   var chiseInstance = appUtilities.getActiveChiseInstance();
        var sbgnml = chiseInstance.createSbgnml();
        sbgnml2cd(sbgnml); */
    });

    $("#export-to-sif-layout").click(function (evt) {
      fileSaveView.render("sifLayout", null, null);
    });

    $("#export-to-plain-sif").click(function (evt) {
      fileSaveView.render("sif", null, null);
    });

    $("#export-as-sbgnml-plain-file").click(function (evt) {
      fileSaveView.render("sbgn", "plain");
    });

    $("#export-as-sbgnml3-plain-file").click(function (evt) {
      fileSaveView.render("sbgn", "plain3");
    });

    $("#export-as-sbml").click(function (evt) {
      fileSaveView.render("sbml", null, null);
    });

    $("#export-as-gpml").click(function (evt) {
      fileSaveView.render("gpml", null, null);
    });    

    $("#add-complex-for-selected").click(function (e) {

      // use active chise instance
      var chiseInstance = appUtilities.getActiveChiseInstance();

      // use cy instance associated with chise instance
      var cy = chiseInstance.getCy();

      var mapType = chiseInstance.getMapType();

      if(mapType == "SBML"){
        chiseInstance.createCompoundForGivenNodes(cy.nodes(':selected'), 'complex sbml');
      }
      else{
        chiseInstance.createCompoundForGivenNodes(cy.nodes(':selected'), 'complex');
      }
      inspectorUtilities.handleSBGNInspector();
    });

    $("#add-compartment-for-selected").click(function (e) {

     
      // use active chise instance
      var chiseInstance = appUtilities.getActiveChiseInstance();

      var mapType = chiseInstance.getMapType();

      if(mapType == 'SIF'){
        return;
      }
      // use cy instance associated with chise instance
      var cy = chiseInstance.getCy();

      chiseInstance.createCompoundForGivenNodes(cy.nodes(':selected'), 'compartment');
      inspectorUtilities.handleSBGNInspector();
    });

    $("#add-submap-for-selected").click(function (e) {

      // use active chise instance
      var chiseInstance = appUtilities.getActiveChiseInstance();

      var mapType = chiseInstance.getMapType();

      if(mapType == 'SIF' || mapType == 'SBML'){
        return;
      }
      // use cy instance associated with chise instance
      var cy = chiseInstance.getCy();

      chiseInstance.createCompoundForGivenNodes(cy.nodes(':selected'), 'submap');
      inspectorUtilities.handleSBGNInspector();
    });

    $("#open-sbgn-bricks-modal").click(function (e) {

      var chiseInstance = appUtilities.getActiveChiseInstance();

      var mapType = chiseInstance.getMapType();

      if(mapType != 'PD' && mapType != 'HybridSbgn' && mapType != 'HybridAny' ){
        exportErrorView.render();          
        document.getElementById("export-error-message").innerText = "SBGN Bricks can only be used with PD maps!";
      }
      else
        reactionTemplateView.render();
    });

    $("#clone-selected").click(function (e) {

      // use active chise instance
      var chiseInstance = appUtilities.getActiveChiseInstance();

      // use cy instance associated with chise instance
      var cy = chiseInstance.getCy();

      //When the menu option is clicked paste at mouse location is false
      var pasteAtMouseLoc = false;
      chiseInstance.cloneElements(cy.nodes(':selected'), pasteAtMouseLoc);
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
      // var imgPath = appUtilities.getDragImagePath( $(this).attr('value') );
      var imgPath = $(this).attr('src');
      appUtilities.addDragImage(imgPath, $(this).css('width'), $(this).css('height'));

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

      var elementType = $(this).attr('value');
      var language = $(this).attr('language');

      // Html values includes '-' instead of ' ' while original
      // edge class names includes '-' for the languages except SIF
      if ( language !== 'SIF' ) {
        elementType = elementType.replace(/-/gi, ' ');
      }

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
	
	$('#lasso-mode-icon').click(function(e){
      modeHandler.setLassoMode();
    });

    $('#sbgn-bricks-icon').click(function() {
      reactionTemplateView.render();
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

    $('#network-tabs-list').on('mousedown', function(e) {
      if( e.which == 2 ) {
        if(e.target != this) return;
        appUtilities.createNewNetwork();
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
    
      $(document).on("keydown", function (event){
      if(!appUtilities.zoomShortcut){
        if(event.shiftKey){
          // meta key for command key
          if(event.ctrlKey || event.metaKey){
              //variable toggle to prevent multiple calls at the same time
              appUtilities.zoomShortcut = true; 
              //enable zoom shortcut mode      
               modeHandler.setShortcutZoomMode();
          }
        }
      }

    });

    // Update inspector on tab change
    $('#sbgn-inspector a[data-toggle="tab"]').on('shown.bs.tab', function () {
      inspectorUtilities.handleSBGNInspector();
    });

    // on active network tab change
    $(document).on('shown.bs.tab', '#network-tabs-list  a[data-toggle="tab"]', function (e) {
      var target = $(e.target).attr("href"); // activated tab
      appUtilities.setActiveNetwork(target);
      inspectorUtilities.handleSBGNInspector();
    });

    $(document).on("changeMapTypeFromMenu", function(event, newMapType) {
      updatePalette(newMapType);
      if (newMapType === "SBML") {
        appUtilities.applyMapColorScheme("cell_designer", "solid", appUtilities.colorSchemeInspectorView);
      } else if (newMapType !== "SBML") {
        appUtilities.applyMapColorScheme("black_white", "solid", appUtilities.colorSchemeInspectorView);
      }
    });

    $('#get-all-data').click(async function (e) {
      const allowCloning = appUtilities.localDbSettings.allowSimpleChemicalCloning;
      const cloningThreshold = appUtilities.localDbSettings.simpleChemicalCloningThreshold;
      await databaseUtilities.getAllNodesAndEdgesFromDatabase(allowCloning, cloningThreshold);
      cy.undoRedo().do("changeMenu", {
        id: "fit-labels-to-nodes",
        type: "checkbox",
        property: "currentGeneralProperties.fitLabelsToNodes",
        value: true
      });
    });



    //////////////////////////////////////////////////////////////////////////
    $("#push-active-tab-contents").click(function (e) {
      // use the active chise instance
      // var chiseInstance = appUtilities.getActiveChiseInstance();
      
      // var activeTabContent = chiseInstance.createJsonFromSBGN();

 
      // databaseUtilities.pushActiveContentToDatabase(activeTabContent)
      pushActiveTabsView.render();
    })
  }
};
