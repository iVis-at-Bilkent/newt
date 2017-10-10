var jquery = $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var chroma = require('chroma-js');

var appUtilities = require('./app-utilities');
var setFileContent = appUtilities.setFileContent.bind(appUtilities);
//var annotationsHandler = require('./annotations-handler');

/**
 * Backbone view for the BioGene information.
 */
var BioGeneView = Backbone.View.extend({
  /*
   * Copyright 2013 Memorial-Sloan Kettering Cancer Center.
   *
   * This file is part of PCViz.
   *
   * PCViz is free software: you can redistribute it and/or modify
   * it under the terms of the GNU Lesser General Public License as published by
   * the Free Software Foundation, either version 3 of the License, or
   * (at your option) any later version.
   *
   * PCViz is distributed in the hope that it will be useful,
   * but WITHOUT ANY WARRANTY; without even the implied warranty of
   * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   * GNU Lesser General Public License for more details.
   *
   * You should have received a copy of the GNU Lesser General Public License
   * along with PCViz. If not, see <http://www.gnu.org/licenses/>.
   */

  render: function () {
    // pass variables in using Underscore.js template
    var variables = {
      geneDescription: this.model.geneDescription,
      geneAliases: this.parseDelimitedInfo(this.model.geneAliases, ":", ",", null),
      geneDesignations: this.parseDelimitedInfo(this.model.geneDesignations, ":", ",", null),
      geneLocation: this.model.geneLocation,
      geneMim: this.model.geneMim,
      geneId: this.model.geneId,
      geneUniprotId: this.extractFirstUniprotId(this.model.geneUniprotMapping),
      geneUniprotLinks: this.generateUniprotLinks(this.model.geneUniprotMapping),
      geneSummary: this.model.geneSummary
    };

    // compile the template using underscore
    var template = _.template($("#biogene-template").html());
    template = template(variables);

    // load the compiled HTML into the Backbone "el"
    this.$el.html(template);

    // format after loading
    this.format(this.model);

    return this;
  },
  format: function ()
  {
    // hide rows with undefined data
    if (this.model.geneDescription == undefined)
      this.$el.find(".biogene-description").hide();

    if (this.model.geneAliases == undefined)
      this.$el.find(".biogene-aliases").hide();

    if (this.model.geneDesignations == undefined)
      this.$el.find(".biogene-designations").hide();

    if (this.model.geneChromosome == undefined)
      this.$el.find(".biogene-chromosome").hide();

    if (this.model.geneLocation == undefined)
      this.$el.find(".biogene-location").hide();

    if (this.model.geneMim == undefined)
      this.$el.find(".biogene-mim").hide();

    if (this.model.geneId == undefined)
      this.$el.find(".biogene-id").hide();

    if (this.model.geneUniprotMapping == undefined)
      this.$el.find(".biogene-uniprot-links").hide();

    if (this.model.geneSummary == undefined)
      this.$el.find(".node-details-summary").hide();

    var expanderOpts = {slicePoint: 150,
      expandPrefix: ' ',
      expandText: ' (...)',
      userCollapseText: ' (show less)',
      moreClass: 'expander-read-more',
      lessClass: 'expander-read-less',
      detailClass: 'expander-details',
      // do not use default effects
      // (see https://github.com/kswedberg/jquery-expander/issues/46)
      expandEffect: 'fadeIn',
      collapseEffect: 'fadeOut'};

    $(".biogene-info .expandable").expander(expanderOpts);

    expanderOpts.slicePoint = 2; // show comma and the space
    expanderOpts.widow = 0; // hide everything else in any case
  },
  generateUniprotLinks: function (mapping) {
    var formatter = function (id) {
      return _.template($("#uniprot-link-template").html(), {id: id});
    };

    if (mapping == undefined || mapping == null)
    {
      return "";
    }

    // remove first id (assuming it is already processed)
    if (mapping.indexOf(':') < 0)
    {
      return "";
    }
    else
    {
      mapping = mapping.substring(mapping.indexOf(':') + 1);
      return ', ' + this.parseDelimitedInfo(mapping, ':', ',', formatter);
    }
  },
  extractFirstUniprotId: function (mapping) {
    if (mapping == undefined || mapping == null)
    {
      return "";
    }

    var parts = mapping.split(":");

    if (parts.length > 0)
    {
      return parts[0];
    }

    return "";
  },
  parseDelimitedInfo: function (info, delimiter, separator, formatter) {
    // do not process undefined or null values
    if (info == undefined || info == null)
    {
      return info;
    }

    var text = "";
    var parts = info.split(delimiter);

    if (parts.length > 0)
    {
      if (formatter)
      {
        text = formatter(parts[0]);
      }
      else
      {
        text = parts[0];
      }
    }

    for (var i = 1; i < parts.length; i++)
    {
      text += separator + " ";

      if (formatter)
      {
        text += formatter(parts[i]);
      }
      else
      {
        text += parts[i];
      }
    }

    return text;
  }
});

/**
 * SBGN Layout view for the Sample Application.
 */
var LayoutPropertiesView = Backbone.View.extend({
  initialize: function () {
    var self = this;
    self.copyProperties();

    self.template = _.template($("#layout-settings-template").html());
    self.template = self.template(appUtilities.currentLayoutProperties);
  },
  copyProperties: function () {
    appUtilities.currentLayoutProperties = _.clone(appUtilities.defaultLayoutProperties);
  },
  applyLayout: function (preferences, notUndoable) {
    if (preferences === undefined) {
      preferences = {};
    }
    var options = $.extend({}, appUtilities.currentLayoutProperties, preferences);
    var verticalPaddingPercent = options.tilingPaddingVertical;
    var horizontalPaddingPercent = options.tilingPaddingHorizontal;
    // In dialog properties we keep tiling padding vertical/horizontal percentadges to be displayed
    // in dialog, in layout options we use a function using these values
    options.tilingPaddingVertical = function () {
      return chise.calculatePaddings(verticalPaddingPercent);
    };
    options.tilingPaddingHorizontal = function () {
      return chise.calculatePaddings(horizontalPaddingPercent);
    };
    chise.performLayout(options, notUndoable);
  },
  render: function () {
    var self = this;

    self.template = _.template($("#layout-settings-template").html());
    self.template = self.template(appUtilities.currentLayoutProperties);
    $(self.el).html(self.template);

    $(self.el).modal('show');

    $(document).off("click", "#save-layout").on("click", "#save-layout", function (evt) {
      appUtilities.currentLayoutProperties.nodeRepulsion = Number(document.getElementById("node-repulsion").value);
      appUtilities.currentLayoutProperties.idealEdgeLength = Number(document.getElementById("ideal-edge-length").value);
      appUtilities.currentLayoutProperties.edgeElasticity = Number(document.getElementById("edge-elasticity").value);
      appUtilities.currentLayoutProperties.nestingFactor = Number(document.getElementById("nesting-factor").value);
      appUtilities.currentLayoutProperties.gravity = Number(document.getElementById("gravity").value);
      appUtilities.currentLayoutProperties.numIter = Number(document.getElementById("num-iter").value);
      appUtilities.currentLayoutProperties.tile = document.getElementById("tile").checked;
      appUtilities.currentLayoutProperties.animate = document.getElementById("animate").checked ? 'during' : 'end';
      appUtilities.currentLayoutProperties.randomize = !document.getElementById("incremental").checked;
      appUtilities.currentLayoutProperties.gravityRangeCompound = Number(document.getElementById("gravity-range-compound").value);
      appUtilities.currentLayoutProperties.gravityCompound = Number(document.getElementById("gravity-compound").value);
      appUtilities.currentLayoutProperties.gravityRange = Number(document.getElementById("gravity-range").value);
      appUtilities.currentLayoutProperties.tilingPaddingVertical = Number(document.getElementById("tiling-padding-vertical").value);
      appUtilities.currentLayoutProperties.tilingPaddingHorizontal = Number(document.getElementById("tiling-padding-horizontal").value);
      appUtilities.currentLayoutProperties.initialEnergyOnIncremental = Number(document.getElementById("incremental-cooling-factor").value);
      appUtilities.currentLayoutProperties.improveFlow = document.getElementById("improve-flow").checked;
	
      $(self.el).modal('toggle');
      $(document).trigger('saveLayout');
    });

    $(document).off("click", "#default-layout").on("click", "#default-layout", function (evt) {
      self.copyProperties();

      self.template = _.template($("#layout-settings-template").html());
      self.template = self.template(appUtilities.currentLayoutProperties);
      $(self.el).html(self.template);
    });

    return this;
  }
});


var ColorSchemeInspectorView = Backbone.View.extend({
  initialize: function () {
    var self = this;
    var defaultColorScheme = appUtilities.defaultGeneralProperties.mapColorScheme;
    var currentScheme = appUtilities.currentGeneralProperties.mapColorScheme;
    var schemes = appUtilities.mapColorSchemes;
    var invertedScheme = {}; // key: scheme_id, value: scheme that is inverse of another scheme
    for(var id in schemes) {
      var previewColors = schemes[id].preview;
      if(invertedScheme[id]) { // this scheme is the complement of a previous one
        schemes[id].isDisplayed = false;
      }
      else if (schemes[id].invert) { // this scheme has a complement
        invertedScheme[schemes[id].invert] = id;
        schemes[id].isDisplayed = true;
      }
      else { // scheme has no complement, display it normally
        schemes[id].isDisplayed = true;
      }

      var colorCount = previewColors.length;
      var html = "";
      for(var i=0; i < colorCount; i++) {
        var color = chroma(previewColors[i]);
        // apply default alpha of elements backgrounds, to make it look more like reality
        color = color.alpha(0.5);
        var prct = 100/colorCount;
        html += "<div style='float:left; width:"+prct+"%; height:100%; background-color:"+color.css()+"'></div>";
      }
      schemes[id].previewHtml = html;
    }
    this.schemes = schemes;

    // attach events
    $(document).on("click", "div.color-scheme-choice", function (evt) {
      var raw_id = $(this).attr('id');
      var scheme_id = raw_id.replace("map-color-scheme_", "");

      currentScheme = scheme_id;
      appUtilities.applyMapColorScheme(scheme_id);
    });

    $(document).on("click", "div.color-scheme-invert-button", function (evt) {
      var raw_id = $(this).attr('id');
      var scheme_id = raw_id.replace("map-color-scheme_invert_", "");
      var inverted_id = schemes[scheme_id].invert;

      currentScheme = inverted_id;
      appUtilities.applyMapColorScheme(inverted_id, self);
    });

    $(document).on("click", "#map-color-scheme-default-button", function (evt) {
      appUtilities.applyMapColorScheme(defaultColorScheme);
      currentScheme = defaultColorScheme;
    });

  },
  render: function () {
    this.template = _.template($("#color-scheme-inspector-template").html());
    this.$el.empty();
    this.$el.html(this.template({schemes: this.schemes}));
    return this;
  }
});

// provide common functions for different views tied to 
// inspector map panels
var GeneralPropertiesParentView = Backbone.View.extend({
  // Apply the properties as they are set
  applyUpdate: function() {
    chise.setShowComplexName(appUtilities.currentGeneralProperties.showComplexName);
    chise.refreshPaddings(); // Refresh/recalculate paddings

    if (appUtilities.currentGeneralProperties.enablePorts) {
      chise.enablePorts();
    }
    else {
      chise.disablePorts();
    }

    if (appUtilities.currentGeneralProperties.allowCompoundNodeResize) {
      chise.considerCompoundSizes();
    }
    else {
      chise.omitCompoundSizes();
    }

    // Refresh resize grapples
    cy.nodeResize('get').refreshGrapples();

    cy.style().update();

    $(document).trigger('saveGeneralProperties');
  },
  setPropertiesToDefault: function () {
    appUtilities.currentGeneralProperties = _.clone(appUtilities.defaultGeneralProperties);
  }
});

// inherit from GeneralPropertiesParentView
var MapTabGeneralPanel = GeneralPropertiesParentView.extend({
  initialize: function() {
    var self = this;
    self.setPropertiesToDefault();
    // initialize undo-redo parameters
    self.params = {};
    self.params.compoundPadding = {id: "compound-padding", type: "text",
      property: "currentGeneralProperties.compoundPadding", update: self.applyUpdate};

    self.params.arrowScale = {id: "arrow-scale", type: "range",
      property: "currentGeneralProperties.arrowScale"};

    self.params.allowCompoundNodeResize = {id: "allow-compound-node-resize", type: "checkbox",
      property: "currentGeneralProperties.allowCompoundNodeResize", update: self.applyUpdate};

    self.params.enablePorts = {id: "enable-ports", type: "checkbox",
      property: "currentGeneralProperties.enablePorts", update: self.applyUpdate};

    self.params.mapName = {id: "map-name", type: "text",
      property: "currentGeneralProperties.mapName"};

    self.params.mapDescription = {id: "map-description", type: "text",
      property: "currentGeneralProperties.mapDescription"};

    // general properties part
    $(document).on("change", "#map-name", function (evt) {
      self.params.mapName.value = $('#map-name').val();
      cy.undoRedo().do("changeMenu", self.params.mapName);
      $('#map-name').blur();
    });

    $(document).on("change", "#map-description", function (evt) {
      self.params.mapDescription.value = $('#map-description').val();
      cy.undoRedo().do("changeMenu", self.params.mapDescription);
      $('#map-description').blur();
    });

    $(document).on("change", "#compound-padding", function (evt) {
      self.params.compoundPadding.value = Number($('#compound-padding').val());
      cy.undoRedo().do("changeMenu", self.params.compoundPadding);
      $('#compound-padding').blur();
    });

    $(document).on("change", "#arrow-scale", function (evt) {
      self.params.arrowScale.value = Number($('#arrow-scale').val());
      var ur = cy.undoRedo();
      var actions = [];
      actions.push({name: "changeMenu", param: self.params.arrowScale});
      actions.push({name: "changeCss", param: { eles: cy.edges(), name: "arrow-scale",
          valueMap: self.params.arrowScale.value}});
      ur.do("batch", actions);
      $('#arrow-scale').blur();
    });

    $(document).on("change", "#allow-compound-node-resize", function (evt) {
      self.params.allowCompoundNodeResize.value = $('#allow-compound-node-resize').prop('checked');
      cy.undoRedo().do("changeMenu", self.params.allowCompoundNodeResize);
      $('#allow-compound-node-resize').blur();
    });

    $(document).on("change", "#enable-ports", function (evt) {
      self.params.enablePorts.value = $('#enable-ports').prop('checked');
      cy.undoRedo().do("changeMenu", self.params.enablePorts);
      $('#enable-ports').blur();
    });

    $(document).on("click", "#inspector-map-tab", function (evt) {
      document.getElementById('map-type').value = chise.getMapType() ? chise.getMapType() : "Unknown";
    });
    $(document).on("shown.bs.tab", "#inspector-map-tab", function (evt) {
      document.getElementById('map-type').value = chise.getMapType() ? chise.getMapType() : "Unknown";
    });
    $(document).on("click", "#map-general-default-button", function (evt) {
      var ur = cy.undoRedo();
      var actions = [];

      self.params.allowCompoundNodeResize.value = appUtilities.defaultGeneralProperties.allowCompoundNodeResize;
      self.params.enablePorts.value = appUtilities.defaultGeneralProperties.enablePorts;
      self.params.compoundPadding.value = appUtilities.defaultGeneralProperties.compoundPadding;
      self.params.arrowScale.value = appUtilities.defaultGeneralProperties.arrowScale;
      actions.push({name: "changeMenu", param: self.params.allowCompoundNodeResize});
      actions.push({name: "changeMenu", param: self.params.enablePorts});
      actions.push({name: "changeMenu", param: self.params.compoundPadding});
      actions.push({name: "changeMenu", param: self.params.arrowScale});
      actions.push({name: "changeCss", param: { eles: cy.edges(), name: "arrow-scale",
          valueMap: self.params.arrowScale.value}});
      ur.do("batch", actions);
    });
  },
  render: function() {
    this.template = _.template($("#map-tab-general-template").html());
    this.$el.empty();
    this.$el.html(this.template(appUtilities.currentGeneralProperties));
    return this;
  }
});

// inherit from GeneralPropertiesParentView
var MapTabLabelPanel = GeneralPropertiesParentView.extend({
  initialize: function() {
    var self = this;
    self.setPropertiesToDefault();
    // initialize undo-redo parameters
    self.params = {};
    self.params.dynamicLabelSize = {id: "dynamic-label-size-select", type: "select",
      property: "currentGeneralProperties.dynamicLabelSize"};

    self.params.showComplexName = {id: "show-complex-name", type: "checkbox",
      property: "currentGeneralProperties.showComplexName", update: self.applyUpdate};

    self.params.adjustAutomatically = {id: "adjust-node-label-font-size-automatically", type: "checkbox",
      property: "currentGeneralProperties.adjustNodeLabelFontSizeAutomatically"};

    self.params.fitLabelsToNodes = {id: "fit-labels-to-nodes", type: "checkbox",
      property: "currentGeneralProperties.fitLabelsToNodes"};

    self.params.fitLabelsToInfoboxes = {id: "fit-labels-to-infoboxes", type: "checkbox",
      property: "currentGeneralProperties.fitLabelsToInfoboxes"};

    $(document).on("change", 'select[name="dynamic-label-size"]', function (evt) {
      self.params.dynamicLabelSize.value = $('#dynamic-label-size-select option:selected').val();
      cy.undoRedo().do("changeMenu", self.params.dynamicLabelSize);
      $('#dynamic-label-size-select').blur();
      self.applyUpdate();
    });

    $(document).on("change", "#show-complex-name", function (evt) {
      self.params.showComplexName.value = $('#show-complex-name').prop('checked');
      cy.undoRedo().do("changeMenu", self.params.showComplexName);
      $('#show-complex-name').blur();
    });

    $(document).on("change", "#adjust-node-label-font-size-automatically", function (evt) {
      self.params.adjustAutomatically.value = $('#adjust-node-label-font-size-automatically').prop('checked');
      cy.undoRedo().do("changeMenu", self.params.adjustAutomatically);
      $('#adjust-node-label-font-size-automatically').blur();
      self.applyUpdate();
    });

    $(document).on("change", "#fit-labels-to-nodes", function (evt) {
      self.params.fitLabelsToNodes.value = $('#fit-labels-to-nodes').prop('checked');
      cy.undoRedo().do("changeMenu", self.params.fitLabelsToNodes);
      $('#fit-labels-to-nodes').blur();
      self.applyUpdate();
    });

    $(document).on("change", "#fit-labels-to-infoboxes", function (evt) {
      self.params.fitLabelsToInfoboxes.value = $('#fit-labels-to-infoboxes').prop('checked');
      cy.undoRedo().do("changeMenu", self.params.fitLabelsToInfoboxes);
      $('#fit-labels-to-infoboxes').blur();
      self.applyUpdate();
    });
    $(document).on("click", "#map-label-default-button", function (evt) {
      var ur = cy.undoRedo();
      var actions = [];
      self.params.dynamicLabelSize.value = appUtilities.defaultGeneralProperties.dynamicLabelSize;
      self.params.adjustAutomatically.value = appUtilities.defaultGeneralProperties.adjustNodeLabelFontSizeAutomatically;
      self.params.fitLabelsToNodes.value = appUtilities.defaultGeneralProperties.fitLabelsToNodes;
      self.params.fitLabelsToInfoboxes.value = appUtilities.defaultGeneralProperties.fitLabelsToInfoboxes;
      self.params.showComplexName.value = appUtilities.defaultGeneralProperties.showComplexName;

      actions.push({name: "changeMenu", param: self.params.dynamicLabelSize});
      actions.push({name: "changeMenu", param: self.params.adjustAutomatically});
      actions.push({name: "changeMenu", param: self.params.fitLabelsToNodes});
      actions.push({name: "changeMenu", param: self.params.fitLabelsToInfoboxes});
      actions.push({name: "changeMenu", param: self.params.showComplexName});
      ur.do("batch", actions);
    });
  },
  render: function() {
    this.template = _.template($("#map-tab-label-template").html());
    this.$el.empty();
    this.$el.html(this.template(appUtilities.currentGeneralProperties));
    return this;
  }
});

// inherit from GeneralPropertiesParentView
var MapTabRearrangementPanel = GeneralPropertiesParentView.extend({
  initialize: function() {
    var self = this;
    self.setPropertiesToDefault();
    // initialize undo-redo parameters
    self.params = {};
    self.params.rearrangeAfterExpandCollapse = {id: "rearrange-after-expand-collapse", type: "checkbox",
      property: "currentGeneralProperties.rearrangeAfterExpandCollapse"};

    self.params.animateOnDrawingChanges = {id: "animate-on-drawing-changes", type: "checkbox",
      property: "currentGeneralProperties.animateOnDrawingChanges"};

    $(document).on("change", "#rearrange-after-expand-collapse", function (evt) {
      self.params.rearrangeAfterExpandCollapse.value = $('#rearrange-after-expand-collapse').prop('checked');
      cy.undoRedo().do("changeMenu", self.params.rearrangeAfterExpandCollapse);
      $('#rearrange-after-expand-collapse').blur();
    });

    $(document).on("change", "#animate-on-drawing-changes", function (evt) {
      self.params.animateOnDrawingChanges.value = $('#animate-on-drawing-changes').prop('checked');
      cy.undoRedo().do("changeMenu", self.params.animateOnDrawingChanges);
      $('#animate-on-drawing-changes').blur();
    });

    $(document).on("click", "#map-rearrangement-default-button", function (evt) {
      var ur = cy.undoRedo();
      var actions = [];
      self.params.rearrangeAfterExpandCollapse.value = appUtilities.defaultGeneralProperties.rearrangeAfterExpandCollapse;
      self.params.animateOnDrawingChanges.value = appUtilities.defaultGeneralProperties.animateOnDrawingChanges;
      actions.push({name: "changeMenu", param: self.params.rearrangeAfterExpandCollapse});
      actions.push({name: "changeMenu", param: self.params.animateOnDrawingChanges});
      ur.do("batch", actions);
    });
  },
  render: function() {
    this.template = _.template($("#map-tab-rearrangement-template").html());
    this.$el.empty();
    this.$el.html(this.template(appUtilities.currentGeneralProperties));

    return this;
  }
});

/**
 * SBGN Properties view for the Sample Application.
 */
/*var GeneralPropertiesView = Backbone.View.extend({
  initialize: function () {
    var self = this;
    self.setPropertiesToDefault();

    $(document).on("click", "#default-sbgn", function (evt) {
      self.setPropertiesToDefault();
      self.applyUpdate();
      self.render();
    });

  },
  // Apply the properties as they are set
  applyUpdate: function() {
    chise.setShowComplexName(appUtilities.currentGeneralProperties.showComplexName);
    var compoundPaddingValue = chise.refreshPaddings(); // Refresh/recalculate paddings
    appUtilities.currentLayoutProperties.paddingCompound = appUtilities.defaultLayoutProperties.paddingCompound + (compoundPaddingValue - 5);

    if (appUtilities.currentGeneralProperties.enablePorts) {
      chise.enablePorts();
    }
    else {
      chise.disablePorts();
    }

    cy.style().update();

    $(document).trigger('saveGeneralProperties');
  },
  setPropertiesToDefault: function () {
    appUtilities.currentGeneralProperties = _.clone(appUtilities.defaultGeneralProperties);
  },
  render: function () {
    console.log("render general", appUtilities.currentGeneralProperties);
    this.template = _.template($("#general-properties-template").html());
    this.$el.empty();
    this.$el.html(this.template(appUtilities.currentGeneralProperties));

    return this;
  }
});*/

/**
 * Paths Between Query view for the Sample Application.
 */
var PathsBetweenQueryView = Backbone.View.extend({
  defaultQueryParameters: {
    geneSymbols: "",
    lengthLimit: 1
  },
  currentQueryParameters: null,
  initialize: function () {
    var self = this;
    self.copyProperties();
    self.template = _.template($("#query-pathsbetween-template").html());
    self.template = self.template(self.currentQueryParameters);
  },
  copyProperties: function () {
    this.currentQueryParameters = _.clone(this.defaultQueryParameters);
  },
  render: function () {
    var self = this;
    self.template = _.template($("#query-pathsbetween-template").html());
    self.template = self.template(self.currentQueryParameters);
    $(self.el).html(self.template);

    $(self.el).modal('show');

    $(document).off("click", "#save-query-pathsbetween").on("click", "#save-query-pathsbetween", function (evt) {

      self.currentQueryParameters.geneSymbols = document.getElementById("query-pathsbetween-gene-symbols").value;
      self.currentQueryParameters.lengthLimit = Number(document.getElementById("query-pathsbetween-length-limit").value);

      var geneSymbols = self.currentQueryParameters.geneSymbols.trim();
      if (geneSymbols.length === 0) {
          document.getElementById("query-pathsbetween-gene-symbols").focus();
          return;
      }
      // geneSymbols is cleaned up from undesired characters such as #,$,! etc. and spaces put before and after the string
      geneSymbols = geneSymbols.replace(/[^a-zA-Z0-9\n\t ]/g, "").trim();
      if (geneSymbols.length === 0) {
        $(self.el).modal('toggle');
        new PromptInvalidQueryView({el: '#prompt-invalidQuery-table'}).render();
        return;
      }
      if (self.currentQueryParameters.lengthLimit > 3) {
        $(self.el).modal('toggle');
        new PromptInvalidLengthLimitView({el: '#prompt-invalidLengthLimit-table'}).render();
        document.getElementById("query-pathsbetween-length-limit").focus();
        return;
      }

      var queryURL = "http://www.pathwaycommons.org/pc2/graph?format=SBGN&kind=PATHSBETWEEN&limit="
          + self.currentQueryParameters.lengthLimit;
      var geneSymbolsArray = geneSymbols.replace("\n", " ").replace("\t", " ").split(" ");

      var filename = "";
      var sources = "";
      for (var i = 0; i < geneSymbolsArray.length; i++) {
        var currentGeneSymbol = geneSymbolsArray[i];
        if (currentGeneSymbol.length == 0 || currentGeneSymbol == ' '
            || currentGeneSymbol == '\n' || currentGeneSymbol == '\t') {
            continue;
        }
        sources = sources + "&source=" + currentGeneSymbol;

        if (filename == '') {
            filename = currentGeneSymbol;
        } else {
            filename = filename + '_' + currentGeneSymbol;
        }
      }
      filename = filename + '_PATHSBETWEEN.sbgnml';

      chise.startSpinner('paths-between-spinner');
      queryURL = queryURL + sources;

      $.ajax({
        url: queryURL,
        type: 'GET',
        success: function (data) {
            if (data == null)
            {
                new PromptInvalidQueryView({el: '#prompt-invalidQuery-table'}).render();
                chise.endSpinner('paths-between-spinner');
            }
            else
            {
                $(document).trigger('sbgnvizLoadFile', filename);
                chise.updateGraph(chise.convertSbgnmlToJson(data));
                chise.endSpinner('paths-between-spinner');
                $(document).trigger('sbgnvizLoadFileEnd');
            }
        }
      });
      $(self.el).modal('toggle');
    });

    $(document).off("click", "#cancel-query-pathsbetween").on("click", "#cancel-query-pathsbetween", function (evt) {
      $(self.el).modal('toggle');
    });

    return this;
  }
});

/**
 * Paths By URI Query view for the Sample Application.
 */
var PathsByURIQueryView = Backbone.View.extend({
  defaultQueryParameters: {
      URI: ""
  },
  currentQueryParameters: null,
  initialize: function () {
    var self = this;
    self.copyProperties();
    self.template = _.template($("#query-pathsbyURI-template").html());
    self.template = self.template(self.currentQueryParameters);
  },
  copyProperties: function () {
    this.currentQueryParameters = _.clone(this.defaultQueryParameters);
  },
  render: function () {
    var self = this;
    self.template = _.template($("#query-pathsbyURI-template").html());
    self.template = self.template(self.currentQueryParameters);
    $(self.el).html(self.template);

    $(self.el).modal('show');

      $(document).off("click", "#save-query-pathsbyURI").on("click", "#save-query-pathsbyURI", function (evt) {

      self.currentQueryParameters.URI = document.getElementById("query-pathsbyURI-URI").value;
      var uri = self.currentQueryParameters.URI.trim();

      if (uri.length === 0) {
          document.getElementById("query-pathsbyURI-URI").focus();
          return;
      }
      // uri is cleaned up from undesired characters such as #,$,! etc. and spaces put before and after the string
      uri = uri.replace(/[^a-zA-Z0-9\n\t ]/g, "").trim();
      if (uri.length === 0) {
          $(self.el).modal('toggle');
          new PromptInvalidURIView({el: '#prompt-invalidURI-table'}).render();
          return;
      }

      var queryURL = "http://www.pathwaycommons.org/pc2/get?uri="
          + uri + "&format=SBGN";

      var filename = "";

      if (filename == '') {
          filename = uri;
      } else {
          filename = filename + '_' + uri;
      }

      filename = filename + '_URI.sbgnml';

      chise.startSpinner('paths-byURI-spinner');

      $.ajax({
        url: queryURL,
        type: 'GET',
        success: function (data) {
          if (data == null)
          {
            new PromptInvalidURIView({el: '#prompt-invalidURI-table'}).render();
            chise.endSpinner('paths-byURI-spinner');
          }
          else
          {
            $(document).trigger('sbgnvizLoadFile', filename);
            chise.updateGraph(chise.convertSbgnmlToJson(data));
            chise.endSpinner('paths-byURI-spinner');
            $(document).trigger('sbgnvizLoadFileEnd');
          }
        }
      });
      $(self.el).modal('toggle');
  });

    $(document).off("click", "#cancel-query-pathsbyURI").on("click", "#cancel-query-pathsbyURI", function (evt) {
        $(self.el).modal('toggle');
    });

    return this;
  }
});

/*
  There was a side effect of using this modal prompt when clicking on New.
  If the user would click on save, then the save box asking for the filename (FileSaveView) would appear
  but the map was already wiped at this point, so after setting the filename and clicking on save
  the user would end up saving an empty map.
  So this PromptSaveView isn't used for now, replaced by PromptConfirmationView.
*/
var PromptSaveView = Backbone.View.extend({
  
  initialize: function () {
    var self = this;
    self.template = _.template($("#prompt-save-template").html());
  },
  render: function (afterFunction) {
    var self = this;
    self.template = _.template($("#prompt-save-template").html());
    $(self.el).html(self.template);

    $(self.el).modal('show');

    $(document).off("click", "#prompt-save-accept").on("click", "#prompt-save-accept", function (evt) {
      $("#save-as-sbgnml").trigger('click');
      afterFunction();
      $(self.el).modal('toggle');
    });
    
    $(document).off("click", "#prompt-save-reject").on("click", "#prompt-save-reject", function (evt) {
      afterFunction();
      $(self.el).modal('toggle');
    });
    
    $(document).off("click", "#prompt-save-cancel").on("click", "#prompt-save-cancel", function (evt) {
      $(self.el).modal('toggle');
    });

    return this;
  }
});

/*
  Ask for filename before saving and triggering the actual browser download popup.
*/
var FileSaveView = Backbone.View.extend({
  initialize: function () {
    var self = this;
    self.template = _.template($("#file-save-template").html());
  },
  render: function () {
    var self = this;
    self.template = _.template($("#file-save-template").html());

    $(self.el).html(self.template);
    $(self.el).modal('show');

    var filename = document.getElementById('file-name').innerHTML;
    $("#file-save-filename").val(filename);

    $(document).off("click", "#file-save-accept").on("click", "#file-save-accept", function (evt) {
      filename = $("#file-save-filename").val();
      appUtilities.setFileContent(filename);
      var renderInfo = appUtilities.getAllStyles();
      var properties = jquery.extend(true, {}, appUtilities.currentGeneralProperties);
      delete properties.mapType; // already stored in sbgn file, no need to store in extension as property
      chise.saveAsSbgnml(filename, renderInfo, properties);
      $(self.el).modal('toggle');
    });

    $(document).off("click", "#file-save-cancel").on("click", "#file-save-cancel", function (evt) {
      $(self.el).modal('toggle');
    });

    return this;
  }
});

/*
  Simple Yes/No confirmation modal box. See PromptSaveView.
*/
var PromptConfirmationView = Backbone.View.extend({
  initialize: function () {
    var self = this;
    self.template = _.template($("#prompt-confirmation-template").html());
  },
  render: function (afterFunction) {
    var self = this;
    self.template = _.template($("#prompt-confirmation-template").html());

    $(self.el).html(self.template);
    $(self.el).modal('show');

    $(document).off("click", "#prompt-confirmation-accept").on("click", "#prompt-confirmation-accept", function (evt) { 
      afterFunction();
      $(self.el).modal('toggle');
    });

    $(document).off("click", "#prompt-confirmation-cancel").on("click", "#prompt-confirmation-cancel", function (evt) {
      $(self.el).modal('toggle');
    });

    return this;
  }
});

var PromptMapTypeView = Backbone.View.extend({
  initialize: function () {
    var self = this;
    self.template = _.template($("#prompt-mapType-template").html());
  },
  render: function (afterFunction) {
    var self = this;
    self.template = _.template($("#prompt-mapType-template").html());

    $(self.el).html(self.template);
    $(self.el).modal('show');

    $(document).off("click", "#prompt-mapType-accept").on("click", "#prompt-mapType-accept", function (evt) {
      afterFunction();
      $(self.el).modal('toggle');
    });

    $(document).off("click", "#prompt-mapType-cancel").on("click", "#prompt-mapType-cancel", function (evt) {
      $(self.el).modal('toggle');
    });

    return this;
  }
});

var PromptInvalidQueryView = Backbone.View.extend({
  initialize: function () {
      var self = this;
      self.template = _.template($("#prompt-invalidQuery-template").html());
  },
  render: function () {
      var self = this;
      self.template = _.template($("#prompt-invalidQuery-template").html());

      $(self.el).html(self.template);
      $(self.el).modal('show');

      $(document).off("click", "#prompt-invalidQuery-confirm").on("click", "#prompt-invalidQuery-confirm", function (evt) {
          $(self.el).modal('toggle');
          appUtilities.pathsBetweenQueryView.render();
      });

      return this;
  }
});

var PromptInvalidLengthLimitView = Backbone.View.extend({
    initialize: function () {
        var self = this;
        self.template = _.template($("#prompt-invalidLengthLimit-template").html());
    },
    render: function () {
        var self = this;
        self.template = _.template($("#prompt-invalidLengthLimit-template").html());

        $(self.el).html(self.template);
        $(self.el).modal('show');

        $(document).off("click", "#prompt-invalidLengthLimit-confirm").on("click", "#prompt-invalidLengthLimit-confirm", function (evt) {
            $(self.el).modal('toggle');
            appUtilities.pathsBetweenQueryView.render();
        });

        return this;
    }
});

var PromptInvalidURIView = Backbone.View.extend({
    initialize: function () {
        var self = this;
        self.template = _.template($("#prompt-invalidURI-template").html());
    },
    render: function () {
        var self = this;
        self.template = _.template($("#prompt-invalidURI-template").html());

        $(self.el).html(self.template);
        $(self.el).modal('show');

        $(document).off("click", "#prompt-invalidURI-confirm").on("click", "#prompt-invalidURI-confirm", function (evt) {
            $(self.el).modal('toggle');
            appUtilities.pathsByURIQueryView.render();
        });

        return this;
    }
});

var PromptInvalidFileView = Backbone.View.extend({
  initialize: function () {
    var self = this;
    self.template = _.template($("#prompt-invalidFile-template").html());
  },
  render: function () {
    var self = this;
    self.template = _.template($("#prompt-invalidFile-template").html());

    $(self.el).html(self.template);
    $(self.el).modal('show');
    
    $(document).off("click", "#prompt-invalidFile-confirm").on("click", "#prompt-invalidFile-confirm", function (evt) {
      $(self.el).modal('toggle');
    });
    
    return this;
  }
});

var ReactionTemplateView = Backbone.View.extend({
  addMacromolecule: function (i) {
    var html = "<tr><td>"
        + "<input type='text' class='template-reaction-textbox sbgn-input-medium layout-text' name='"
        + i + "' value=''></input>"
        + "</td><td><img style='vertical-align: text-bottom;' class='template-reaction-delete-button' width='16px' height='16px' name='" + i + "' src='app/img/toolbar/delete-simple.svg'/></td></tr>";

    $('#template-reaction-dissociated-table :input.template-reaction-textbox').last().closest('tr').after(html);
    return html;
  },
  removeMacromolecule: function (i) {
    $('#template-reaction-dissociated-table :input.template-reaction-textbox[name="'+i+'"]').closest('tr').remove();
  },
  switchInputOutput: function () {
    var saveHtmlContent = $("#reaction-template-left-td").html();
    $("#reaction-template-left-td").html($("#reaction-template-right-td").html());
    $("#reaction-template-right-td").html(saveHtmlContent);
  },
  getAllParameters: function () {
    var templateType = $('#reaction-template-type-select').val();
    var templateReactionComplexName = $('#template-reaction-complex-name').val();
    var macromoleculeList = $('#template-reaction-dissociated-table :input.template-reaction-textbox').map(function(){
        return $(this).val()
      }).toArray();
    // enable complex name only if the user provided something
    var templateReactionEnableComplexName = $.trim(templateReactionComplexName).length != 0;

    return {
      templateType: templateType,
      templateReactionComplexName: templateReactionComplexName,
      macromoleculeList: macromoleculeList,
      templateReactionEnableComplexName: templateReactionEnableComplexName
    }
  },
  disableDeleteButtonStyle: function () {
    $("img.template-reaction-delete-button").css("opacity", 0.2);
    $("img.template-reaction-delete-button").css("cursor", "default");
  },
  enableDeleteButtonStyle: function() {
    $("img.template-reaction-delete-button").css("opacity",1);
    $("img.template-reaction-delete-button").css("cursor", "pointer");
  },
  initialize: function() {
    var self = this;
    self.template = _.template($("#reaction-template-template").html());

    $(document).on('change', '#reaction-template-type-select', function (e) {
      var valueSelected = $(this).val();
      self.switchInputOutput();
    });

    $(document).on("change", "#template-reaction-complex-name", function(e){
      var value = $(this).val();
      $(this).attr('value', value); // set the value in the html tag, so it is remembered when switched
    });

    $(document).on("click", "#template-reaction-add-button", function (event) {
      // get the last input name and add 1
      var nextIndex = parseInt($('#template-reaction-dissociated-table :input.template-reaction-textbox').last().attr('name')) + 1;
      self.addMacromolecule(nextIndex);
      self.enableDeleteButtonStyle();
    });

    $(document).on('change', ".template-reaction-textbox", function () {
      var value = $(this).val();
      $(this).attr('value', value); // set the value in the html tag, so it is remembered when switched
    });

    $(document).on("click", ".template-reaction-delete-button", function (event) {
      if($('#template-reaction-dissociated-table :input.template-reaction-textbox').length <= 2){
        return;
      }
      var index = parseInt($(this).attr('name'));
      self.removeMacromolecule(index);
      if($('#template-reaction-dissociated-table :input.template-reaction-textbox').length <= 2){
        self.disableDeleteButtonStyle();
      }
    });

    $(document).on("click", "#create-template", function (evt) {
      var params = self.getAllParameters();

      var templateType = params.templateType;
      var macromoleculeList = params.macromoleculeList;
      var complexName = params.templateReactionEnableComplexName ? params.templateReactionComplexName : undefined;
      var tilingPaddingVertical = chise.calculatePaddings(appUtilities.currentLayoutProperties.tilingPaddingVertical);
      var tilingPaddingHorizontal = chise.calculatePaddings(appUtilities.currentLayoutProperties.tilingPaddingHorizontal);

      chise.createTemplateReaction(templateType, macromoleculeList, complexName, undefined, tilingPaddingVertical, tilingPaddingHorizontal);

      $(self.el).modal('toggle');
    });

    $(document).on("click", "#cancel-template", function (evt) {
      $(self.el).modal('toggle');
    });
  },
  render: function() {
    var self = this;
    self.template = _.template($("#reaction-template-template").html());
    $(self.el).html(self.template);
    self.disableDeleteButtonStyle();

    $(self.el).modal('show');

    return this;
  }
});

var GridPropertiesView = Backbone.View.extend({
  initialize: function () {
    var self = this;
    self.copyProperties();
    self.template = _.template($("#grid-properties-template").html());
    self.template = self.template(appUtilities.currentGridProperties);
  },
  copyProperties: function () {
    appUtilities.currentGridProperties = _.clone(appUtilities.defaultGridProperties);
  },
  render: function () {
    var self = this;
    self.template = _.template($("#grid-properties-template").html());
    self.template = self.template(appUtilities.currentGridProperties);
    $(self.el).html(self.template);

    $(self.el).modal('show');

    // The following functions give Snap Policy row a radio button functionality
    // and enable Show Grid when Snap to Grid is enabled
    $(document).off("change", "#snap-to-grid").on("change", "#snap-to-grid", function(event){
      $("#show-grid").prop('checked', true);
      $("#snap-to-alignment-location").val("disabled");

      if ($("#snap-to-grid").val() == "disabled" && $("#snap-to-alignment-location").val() == "disabled")
        $("#no-snap").prop('checked', true);
      else
        $("#no-snap").prop('checked', false);
    });

    $(document).off("change", "#snap-to-alignment-location").on("change", "#snap-to-alignment-location", function(event){
      $("#snap-to-grid").val("disabled");
      if ($("#snap-to-grid").val() == "disabled" && $("#snap-to-alignment-location").val() == "disabled")
        $("#no-snap").prop('checked', true);
      else
        $("#no-snap").prop('checked', false);
    });

    $(document).off("click", "#no-snap").on("click", "#no-snap", function(event){
      $("#snap-to-grid").val("disabled");
      $("#snap-to-alignment-location").val("disabled");
    });

    $(document).off("click", "#save-grid").on("click", "#save-grid", function (evt) {
      appUtilities.currentGridProperties.showGrid = document.getElementById("show-grid").checked;
      appUtilities.currentGridProperties.snapToGridOnRelease = $("#snap-to-grid").val() == "onRelease";
      appUtilities.currentGridProperties.snapToGridDuringDrag = $("#snap-to-grid").val() == "duringDrag";
      appUtilities.currentGridProperties.snapToAlignmentLocationOnRelease = $("#snap-to-alignment-location").val() == "onRelease";
      appUtilities.currentGridProperties.snapToAlignmentLocationDuringDrag = $("#snap-to-alignment-location").val() == "duringDrag";
      appUtilities.currentGridProperties.gridSize = Number(document.getElementById("grid-size").value);
      appUtilities.currentGridProperties.gridColor = document.getElementById("grid-color").value;
      appUtilities.currentGridProperties.autoResizeNodes = document.getElementById("auto-resize-nodes").checked;
      appUtilities.currentGridProperties.showGeometricGuidelines = document.getElementById("show-geometric-guidelines").checked;
      appUtilities.currentGridProperties.showDistributionGuidelines = document.getElementById("show-distribution-guidelines").checked;
      appUtilities.currentGridProperties.showInitPosAlignment = document.getElementById("show-init-Pos-Alignment").checked;
      appUtilities.currentGridProperties.guidelineTolerance = Number(document.getElementById("guideline-tolerance").value);
      appUtilities.currentGridProperties.guidelineColor = document.getElementById("geometric-guideline-color").value;
      appUtilities.currentGridProperties.horizontalGuidelineColor = document.getElementById("horizontal-guideline-color").value;
      appUtilities.currentGridProperties.verticalGuidelineColor = document.getElementById("vertical-guideline-color").value;
      appUtilities.currentGridProperties.initPosAlignmentColor = document.getElementById("init-Pos-Alignment-Color").value;
      appUtilities.currentGridProperties.geometricAlignmentRange = Number(document.getElementById("geometric-alignment-range").value);
      appUtilities.currentGridProperties.distributionAlignmentRange = Number(document.getElementById("distribution-alignment-range").value);

	  // Line styles for guidelines
      appUtilities.currentGridProperties.initPosAlignmentLine = $('select[name="init-Pos-Alignment-Line"] option:selected').val().split(',').map(Number);
      appUtilities.currentGridProperties.lineDash = $('select[id="geometric-Alignment-Line"] option:selected').val().split(',').map(Number),
      appUtilities.currentGridProperties.horizontalDistLine = $('select[name="horizontal-Dist-Alignment-Line"] option:selected').val().split(',').map(Number);
      appUtilities.currentGridProperties.verticalDistLine = $('select[name="vertical-Dist-Alignment-Line"] option:selected').val().split(',').map(Number);
      cy.gridGuide({
        drawGrid: appUtilities.currentGridProperties.showGrid,
        gridColor: appUtilities.currentGridProperties.gridColor,
        snapToGridOnRelease: appUtilities.currentGridProperties.snapToGriOnReleased,
        snapToGridDuringDrag: appUtilities.currentGridProperties.snapToGridDuringDrag,
        snapToAlignmentLocationOnRelease: appUtilities.currentGridProperties.snapToAlignmentLocationOnRelease,
        snapToAlignmentLocationDuringDrag: appUtilities.currentGridProperties.snapToAlignmentLocationDuringDrag,
        gridSpacing: appUtilities.currentGridProperties.gridSize,
        resize: appUtilities.currentGridProperties.autoResizeNodes,
        geometricGuideline: appUtilities.currentGridProperties.showGeometricGuidelines,
        distributionGuidelines: appUtilities.currentGridProperties.showDistributionGuidelines,
        initPosAlignment: appUtilities.currentGridProperties.showInitPosAlignment,
        guidelinesTolerance: appUtilities.currentGridProperties.guidelineTolerance,
        guidelinesStyle: {
		  initPosAlignmentLine: appUtilities.currentGridProperties.initPosAlignmentLine,
		  lineDash: appUtilities.currentGridProperties.lineDash,
		  horizontalDistLine: appUtilities.currentGridProperties.horizontalDistLine,
		  verticalDistLine: appUtilities.currentGridProperties.verticalDistLine,
          strokeStyle: appUtilities.currentGridProperties.guidelineColor,
		  horizontalDistColor: appUtilities.currentGridProperties.horizontalGuidelineColor,
		  verticalDistColor: appUtilities.currentGridProperties.verticalGuidelineColor,
		  initPosAlignmentColor: appUtilities.currentGridProperties.initPosAlignmentColor,
          geometricGuidelineRange: appUtilities.currentGridProperties.geometricAlignmentRange,
          range: appUtilities.currentGridProperties.distributionAlignmentRange
        }
      });
      
      $(self.el).modal('toggle');
      $(document).trigger('saveGridProperties');
    });

    $(document).off("click", "#default-grid").on("click", "#default-grid", function (evt) {
      self.copyProperties();
      self.template = _.template($("#grid-properties-template").html());
      self.template = self.template(appUtilities.currentGridProperties);
      $(self.el).html(self.template);
    });

    return this;
  }
});

var FontPropertiesView = Backbone.View.extend({
  defaultFontProperties: {
    fontFamily: "",
    fontSize: "",
    fontWeight: "",
    fontStyle: ""
  },
  currentFontProperties: undefined,
  copyProperties: function () {
    this.currentFontProperties = _.clone(this.defaultFontProperties);
  },
  fontFamilies: ["", "Helvetica", "Arial", "Calibri", "Cambria", "Comic Sans MS", "Consolas", "Corsiva"
    ,"Courier New" ,"Droid Sans", "Droid Serif", "Georgia", "Impact" 
    ,"Lato", "Roboto", "Source Sans Pro", "Syncopate", "Times New Roman"
    ,"Trebuchet MS", "Ubuntu", "Verdana"],
  getOptionIdByFontFamily: function(fontfamily) {
    var id = "font-properties-font-family-" + fontfamily;
    return id;
  },
  getFontFamilyByOptionId: function(id) {
    var lastIndex = id.lastIndexOf("-");
    var fontfamily = id.substr(lastIndex + 1);
    return fontfamily;
  },
  getFontFamilyHtml: function(self) {
    if(self == null){
      self = this;
    }
    
    var fontFamilies = self.fontFamilies;
    
    var html = "";
    html += "<select id='font-properties-select-font-family' class='input-medium layout-text' name='font-family-select'>";
    
    var optionsStr = "";
    
    for ( var i = 0; i < fontFamilies.length; i++ ) {
      var fontFamily = fontFamilies[i];
      var optionId = self.getOptionIdByFontFamily(fontFamily);
      var optionStr = "<option id='" + optionId + "'" 
              + " value='" + fontFamily + "' style='" + "font-family: " + fontFamily + "'";
      
      if (fontFamily === self.currentFontProperties.fontFamily) {
        optionStr += " selected";
      }
      
      optionStr += "> ";
      optionStr += fontFamily;
      optionStr += " </option>";
      
      optionsStr += optionStr;
    }
    
    html += optionsStr;
    
    html += "</select>";
    
    return html;
  },
  initialize: function () {
    var self = this;
    self.defaultFontProperties.getFontFamilyHtml = function(){
      return self.getFontFamilyHtml(self);
    };
    self.copyProperties();
    self.template = _.template($("#font-properties-template").html());
    self.template = self.template(self.defaultFontProperties);
  },
  extendProperties: function (eles) {
    var self = this;
    var commonProperties = {};
    
    // Get common properties. Note that we check the data field for labelsize property and css field for other properties.
    var commonFontSize = parseInt(chise.elementUtilities.getCommonProperty(eles, "font-size", "data"));
    var commonFontWeight = chise.elementUtilities.getCommonProperty(eles, "font-weight", "data");
    var commonFontFamily = chise.elementUtilities.getCommonProperty(eles, "font-family", "data");
    var commonFontStyle = chise.elementUtilities.getCommonProperty(eles, "font-style", "data");
    
    if( commonFontSize != null ) {
      commonProperties.fontSize = commonFontSize;
    }
    
    if( commonFontWeight != null ) {
      commonProperties.fontWeight = commonFontWeight;
    }
    
    if( commonFontFamily != null ) {
      commonProperties.fontFamily = commonFontFamily;
    }
    
    if( commonFontStyle != null ) {
      commonProperties.fontStyle = commonFontStyle;
    }
    
    self.currentFontProperties = $.extend({}, this.defaultFontProperties, commonProperties);
  },
  render: function (eles) {
    var self = this;
    self.extendProperties(eles);
    self.template = _.template($("#font-properties-template").html());
    self.template = self.template(self.currentFontProperties);
    $(self.el).html(self.template);

    $(self.el).modal('show');

    $(document).off("click", "#set-font-properties").on("click", "#set-font-properties", function (evt) {
      var data = {};
      
      var fontsize = $('#font-properties-font-size').val();
      var fontfamily = $('select[name="font-family-select"] option:selected').val();
      var fontweight = $('select[name="font-weight-select"] option:selected').val();
      var fontstyle = $('select[name="font-style-select"] option:selected').val();
      
      if ( fontsize != '' ) {
        data['font-size'] = parseInt(fontsize);
      }
      
      if ( fontfamily != '' ) {
        data['font-family'] = fontfamily;
      }
      
      if ( fontweight != '' ) {
        data['font-weight'] = fontweight;
      }
      
      if ( fontstyle != '' ) {
        data['font-style'] = fontstyle;
      }
      
      var keys = Object.keys(data);
      
      if(keys.length === 0) {
        return;
      }
      
      var validAction = false; // If there is nothing to change the action is not valid
      
      for ( var i = 0; i < eles.length; i++ ) {
        var ele = eles[i];
        
        keys.forEach(function(key, idx) {
          // If there is some property to change signal that the action is valid.
          if (data[key] != ele.data(key)){
            validAction = true;
          }
        }); 
        
        if ( validAction ) {
          break;
        }
      }
      
      if ( validAction === false ) {
        $(self.el).modal('toggle');
        return;
      }
      
      chise.changeFontProperties(eles, data);
      
      self.copyProperties();
	    
     
      $(self.el).modal('toggle');
	    $(document).trigger('saveFontProperties');
    });

    return this;
  }
});

var AnnotationListView = Backbone.View.extend({
  elements: [],
  el: '#annotations-container',
  initialize: function () {
    this.listenTo(this.model, 'add', this.addAnnotationElementView);
    this.listenTo(this.model, 'destroy', this.resetAndPopulate);
    this.resetAndPopulate();
  },
  events: {
    'click #annotations-add-button': 'createAnnotation'
  },
  resetAndPopulate: function() {
    this.elements = [];
    this.render();
    // populate from the model
    var self = this;
    this.model.forEach(function(item){
      self.addAnnotationElementView(item);
    });
  },
  createAnnotation: function(e) {
    var newAnnot = this.model.create({cyParent: this.model.cyParent});
  },
  addAnnotationElementView: function(annotationModel) {
    var view = new AnnotationElementView({model: annotationModel});
    this.elements.push(view);
    this.$el.find('p#annotations-small-helptext').remove();
    this.$el.children('div').first().append(view.render().el);
  },
  render: function () {
    this.template = _.template($("#annotation-list-template").html());
    this.$el.empty();
    var renderedElement = [];
    for(var i=0; i<this.elements.length; i++) {
      renderedElement.push(this.elements[i].render().$el.html());
    }
    this.$el.html(this.template({elements: renderedElement}));
    return this;
  }
});

var AnnotationElementView = Backbone.View.extend({
  //status is: unchecked, pending, validated, error
  previousSelectedRelation: null, // convenience variable, to check change in controlled vocabulary mode
  tagName: 'div',
  initialize: function () {
    /**
     * We need to debounce the text input, but if we do that when defining events normally, we lose the context (this)
     * So we need to bind this event manually here, after other events have been defined (this is done before initialize)
     * This is done through delegateEvents
     */
    var eventsHash = this.events; // get all defined events
    eventsHash["input .annotations-object-identifier"] = _.debounce(this.valueChangeHandler, 1000); // add the one that need debounce
    this.delegateEvents(eventsHash); // redefine all events with delegate

    /** bind events triggered on change of model */
    this.listenTo(this.model, 'change:status', this.statusChangeHandler);
  },
  events: {
    "change .annotations-db-list": 'dbChangeHandler',
    "change .annotations-vocabulary-list": 'vocabularyChangeHandler',
    "click .annotations-retry-validation": 'retryHandler',
    "click .delete-annotation": 'deleteHandler'
    //"input .annotations-object-identifier": "valueChangeHandler" <-- see initialize
  },
  dbChangeHandler: function(e) {
    var selectedDBkey = $(e.currentTarget).val();
    if (this.underControlledMode()) {
      this.model.set('selectedDB', selectedDBkey);
      this.model.save();
      this.launchValidation();
    }
    else {
      if (selectedDBkey && !(selectedDBkey.length === 0 || !selectedDBkey.trim())) {
        // real value provided
        var globalProp = this.model.constructor.userDefinedProperties;
        if (!_.contains(globalProp, selectedDBkey)) {
          globalProp.push(selectedDBkey);
        }
        this.model.set('selectedDB', selectedDBkey);
        this.model.save();
        this.render();
      }
    }
  },
  valueChangeHandler: function (e) {
    var identifier = $(e.currentTarget).val();
    this.model.set('annotationValue', identifier);
    this.model.save();
    if (this.underControlledMode()) {
      this.launchValidation();
    }
  },
  vocabularyChangeHandler: function(e) {
    var relation = $(e.currentTarget).val();
    var previouslyControlledMode = this.underControlledMode(this.previousSelectedRelation);
    var nowControlledMode = this.underControlledMode(relation);
    this.model.set('selectedRelation', relation);

    if (previouslyControlledMode && !nowControlledMode) {
      // went from controlled into uncontrolled mode, reset key
      this.model.set('selectedDB', null);
      // validation cannot be applied, considered always valid
      this.model.set('status', 'validated');
    }
    else if (!previouslyControlledMode && nowControlledMode) {
      // went from uncontrolled to controlled, select defaults db
      this.model.set('selectedDB', this.model.defaults.selectedDB);
      // reset validation status
      this.model.set('status', 'unchecked');
    }

    this.model.save();
    this.render();
  },
  retryHandler: function(e) {
    this.launchValidation();
  },
  statusChangeHandler: function(annotationModel) {
    this.render();
  },
  deleteHandler: function(e) {
    this.model.destroy();
    this.remove();
  },
  underControlledMode: function(relation) {
    if (relation) {
      return this.model.constructor.vocabulary[relation].controlled;
    }
    else {
      return this.model.constructor.vocabulary[this.model.get('selectedRelation')].controlled;
    }
  },
  render: function () {
    this.template = _.template($("#annotation-element-template").html());
    this.$el.empty();
    this.$el.html(this.template({
      vocabulary: this.model.constructor.vocabulary,
      dbList: this.model.constructor.dbList,
      userDefinedProperties: this.model.constructor.userDefinedProperties,
      status: this.model.get('status'),
      index: this.model.collection.indexOf(this.model),
      selectedDB: this.model.get('selectedDB'),
      selectedRelation: this.model.get('selectedRelation'),
      annotationValue: this.model.get('annotationValue')
    }));
    this.previousSelectedRelation = this.model.get('selectedRelation'); // save the value of relation, for comparison
    return this;
  },
  launchValidation: function () {
    var index = this.model.collection.indexOf(this.model);
    var selectedDBkey = this.model.get('selectedDB');
    var identifier = this.model.get('annotationValue');
    // we don't need to validate if the input is empty or blank
    if (identifier && !(identifier.length === 0 || !identifier.trim())) {
      this.model.set('status', 'pending');
      var validateAnnotation = this.model.get('validateAnnotation');
      var self = this;
      validateAnnotation(selectedDBkey, identifier, function(err, result) {
        if(err) {
          self.model.set('status', 'error');
          self.model.save();
          console.error("validation error", err);
          return;
        }
        // result contains the validated url
        self.model.set('status', 'validated');
        self.model.set('annotationValue', result);
        self.model.save();
        self.render();
      });
    }
  }
});

module.exports = {
  BioGeneView: BioGeneView,
  LayoutPropertiesView: LayoutPropertiesView,
  ColorSchemeInspectorView: ColorSchemeInspectorView,
  MapTabGeneralPanel: MapTabGeneralPanel,
  MapTabLabelPanel: MapTabLabelPanel,
  MapTabRearrangementPanel: MapTabRearrangementPanel,
  //GeneralPropertiesView: GeneralPropertiesView,
  PathsBetweenQueryView: PathsBetweenQueryView,
  PathsByURIQueryView: PathsByURIQueryView,
  PromptSaveView: PromptSaveView,
  FileSaveView: FileSaveView,
  PromptConfirmationView: PromptConfirmationView,
  PromptMapTypeView: PromptMapTypeView,
  PromptInvalidFileView: PromptInvalidFileView,
  ReactionTemplateView: ReactionTemplateView,
  GridPropertiesView: GridPropertiesView,
  FontPropertiesView: FontPropertiesView,
  AnnotationListView: AnnotationListView,
  AnnotationElementView: AnnotationElementView
};
