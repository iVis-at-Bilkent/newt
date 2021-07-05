/*
 *  Extend default options and get current options by using this file
 */

module.exports = function () {
  // default options
  var defaults = {
    // The path of core library images when sbgnviz is required from npm and the index html
    // file and node_modules are under the same folder then using the default value is fine
    imgPath: 'node_modules/sbgnviz/src/img',
    // Whether to fit labels to nodes
    fitLabelsToNodes: function () {
      return false;
    },
    fitLabelsToInfoboxes: function () {
      return false;
    },
    // dynamic label size it may be 'small', 'regular', 'large'
    dynamicLabelSize: function () {
      return 'regular';
    },
    // Whether to infer parent node on load 
    inferNestingOnLoad: function () {
      return false;
    },
    // intial compound padding for all compound nodes 
    compoundPadding: function () {
      return 0;
    },
    improveFlow: function () {
        return true;
    },
    // Whether to adjust node label font size automatically.
    // If this option return false do not adjust label sizes according to node height uses node.data('font-size')
    // instead of doing it.
    adjustNodeLabelFontSizeAutomatically: function() {
      return true;
    },
    // extra padding for compound nodes except for complexes
    extraCompartmentPadding: 14,

    //extra padding for complex compound nodes, refer to elementUtilities.getComplexPadding function to see details
    extraComplexPadding: 10,
    // Wether to display the complex's labels, like compartments.
    // Will also increase the paddings by extraCompoundPadding to make room for the name.
    showComplexName: true,
    // The selector of the component containing the sbgn network
    networkContainerSelector: '#sbgn-network-container',
    // Whether the actions are undoable, requires cytoscape-undo-redo extension
    undoable: true
  };

  var optionUtilities = function (param) {
  };

  // Extend the defaults options with the user options
  optionUtilities.extendOptions = function (options) {
    var result = {};

    for (var prop in defaults) {
      result[prop] = defaults[prop];
    }

    for (var prop in options) {
      result[prop] = options[prop];
    }

    optionUtilities.options = result;

    return options;
  };

  optionUtilities.getOptions = function () {
    return optionUtilities.options;
  };

  return optionUtilities;
};
