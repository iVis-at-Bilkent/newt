(function(){
  var sbgnviz = function(_options) {

    var param = {}; // The parameter to be passed to all utilities instances related to this sbgnviz instance

    var optionUtilities = require('./utilities/option-utilities-factory')();
    var options = optionUtilities.extendOptions(_options);

    var sbgnCyInstance = require('./sbgn-extensions/sbgn-cy-instance-factory')();

    // Utilities whose functions will be exposed seperately
    var uiUtilities = require('./utilities/ui-utilities-factory')();
    var fileUtilities = require('./utilities/file-utilities-factory')();
    var graphUtilities = require('./utilities/graph-utilities-factory')();
    var mainUtilities = require('./utilities/main-utilities-factory')();
    var keyboardInputUtilities = require('./utilities/keyboard-input-utilities-factory')(); // require keybord input utilities
    var experimentalDataOverlay = require('./utilities/experimental-data-overlay')();
    // Utilities to be exposed as is
    var elementUtilities = require('./utilities/element-utilities-factory')();
    var undoRedoActionFunctions = require('./utilities/undo-redo-action-functions-factory')();

    // Other utilities
    var jsonToSbgnmlConverter = require('./utilities/json-to-sbgnml-converter-factory')();
    var jsonToNwtConverter = require('./utilities/json-to-nwt-converter-factory')();
    var sbgnmlToJsonConverter = require('./utilities/sbgnml-to-json-converter-factory')();
    var nwtToJsonConverter = require('./utilities/nwt-to-json-converter-factory')();
    var tdToJsonConverter = require('./utilities/tab-delimited-to-json-converter-factory')();
    var sifToJsonConverter = require('./utilities/sif-to-json-converter-factory')();
    var jsonToSifConverter = require('./utilities/json-to-sif-converter-factory')();
    var classes = require('./utilities/classes');
    var tdParser = require('./utilities/tab-delimeted-parser');
    var layoutLoader = require('./utilities/layout-loader-factory')();
    var layoutToText = require('./utilities/layout-to-text-factory')();
    var cdToSbgnmlConverter = require('./utilities/cd-to-sbgnml-converter-factory')();
    var sbgnmlToCdConverter = require('./utilities/sbgnml-to-cd-converter-factory')();
    var sbgnmlToSbmlConverter = require('./utilities/sbgnml-to-sbml-converter-factory')();
    var sbmlToSbgnmlConverter = require('./utilities/sbml-to-sbgnml-converter-factory')();
    // Fill param object to use it utilities internally
    
    param.optionUtilities = optionUtilities;
    param.sbgnCyInstance = sbgnCyInstance;
    param.uiUtilities = uiUtilities;
    param.fileUtilities = fileUtilities;
    param.graphUtilities = graphUtilities;
    param.mainUtilities = mainUtilities;
    param.keyboardInputUtilities = keyboardInputUtilities;
    param.elementUtilities = elementUtilities;
    param.undoRedoActionFunctions = undoRedoActionFunctions;
    param.jsonToSbgnmlConverter = jsonToSbgnmlConverter;
    param.jsonToNwtConverter = jsonToNwtConverter;
    param.sbgnmlToJsonConverter = sbgnmlToJsonConverter;
    param.nwtToJsonConverter = nwtToJsonConverter;
    param.tdToJsonConverter = tdToJsonConverter;
    param.sifToJsonConverter = sifToJsonConverter;
    param.classes = classes;
    param.layoutLoader = layoutLoader;
    param.layoutToText = layoutToText;
    param.jsonToSifConverter = jsonToSifConverter;
    param.cdToSbgnmlConverter = cdToSbgnmlConverter;
    param.sbgnmlToCdConverter = sbgnmlToCdConverter;
    param.sbgnmlToSbmlConverter = sbgnmlToSbmlConverter;
    param.sbmlToSbgnmlConverter = sbmlToSbgnmlConverter;
    param.experimentalDataOverlay = experimentalDataOverlay;

    // call constructors of objects with param
    
    sbgnCyInstance(param);
    optionUtilities(param);
    uiUtilities(param);
    fileUtilities(param);
    graphUtilities(param);
    mainUtilities(param);
    keyboardInputUtilities(param);
    elementUtilities(param);
    undoRedoActionFunctions(param);
    jsonToSbgnmlConverter(param);
    jsonToNwtConverter(param);
    sbgnmlToJsonConverter(param);
    nwtToJsonConverter(param);
    tdToJsonConverter(param);
    sifToJsonConverter(param);
    layoutLoader(param);
    layoutToText(param);
    jsonToSifConverter(param);
    cdToSbgnmlConverter(param);
    sbgnmlToCdConverter(param);
    sbgnmlToSbmlConverter(param);
    sbmlToSbgnmlConverter(param);
    experimentalDataOverlay(param);

    // set scratch pad for sbgnviz and init sbgnvizParams inside it
    sbgnCyInstance.getCy().scratch('_sbgnviz', {});
    sbgnCyInstance.getCy().scratch('_sbgnviz').sbgnvizParams = param;

    // Expose the api
    var api = {};

    // Expose elementUtilities and undoRedoActionFunctions as is, most users will not need these
    api.elementUtilities = elementUtilities;
    api.undoRedoActionFunctions = undoRedoActionFunctions;
    //api.experimentalDataOverlay = experimentalDataOverlay;
    
    //expose utility of experimental data-overlay
    for (var prop in experimentalDataOverlay) {
      api[prop] = experimentalDataOverlay[prop];
    }

    // Expose each main utility seperately
    for (var prop in mainUtilities) {
      api[prop] = mainUtilities[prop];
    }

    // Expose each file utility seperately
    for (var prop in fileUtilities) {
      api[prop] = fileUtilities[prop];
    }

    // Expose each file utility seperately
    for (var prop in uiUtilities) {
      api[prop] = uiUtilities[prop];
    }

    // Expose each sbgn graph utility seperately
    for (var prop in graphUtilities) {
      api[prop] = graphUtilities[prop];
    }

    // Expose get cy function to enable accessing related cy instance
    api.getCy = sbgnCyInstance.getCy;

    // Expose some utilities directly here
    api.classes = classes;
    api.tdParser = tdParser;

    return api;
  };

  sbgnviz.validMapProperties = require('./utilities/validMapProperties');

  sbgnviz.register = function (_libs) {

    var libs = {};
    libs.jQuery = _libs.jQuery || jQuery;
    libs.cytoscape = _libs.cytoscape || cytoscape;
    libs.saveAs = _libs.filesaver ? _libs.filesaver.saveAs : saveAs;
    libs.tippy = _libs.tippy || Tippy;

    // Set the libraries to access them from any file
    var libUtilities = require('./utilities/lib-utilities');
    libUtilities.setLibs(libs);

    var sbgnRenderer = require('./sbgn-extensions/sbgn-cy-renderer');
    sbgnRenderer();
  };

  if ( typeof module !== 'undefined' && module.exports ) {
    module.exports = sbgnviz;
  }
})();
