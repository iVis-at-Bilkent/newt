var jquery = $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var chroma = require('chroma-js');
var FileSaver = require('filesaverjs');

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
 * Backbone view for the Chemical information.
 */
var ChemicalView = Backbone.View.extend({
    render: function () {
        // pass variables in using Underscore.js template
        var variables = {
            chemicalDescription: this.model.description[0],
            chebiName: this.model.label,
            chebiID: this.model.obo_id.substring(6, this.model.obo_id.length) //Gets only the nr from ChEBI:15422 format
        };

        // compile the template using underscore
        var template = _.template($("#chemical-template").html());
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
        if (this.model.label == undefined)
            this.$el.find(".chebi-name").hide();

        if (this.model.description[0] == undefined)
            this.$el.find(".chemical-description").hide();

        if (this.model.obo_id == undefined)
            this.$el.find(".chebi-id").hide();

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

        $(".chemical-description .expandable").expander(expanderOpts);

        expanderOpts.slicePoint = 2; // show comma and the space
        expanderOpts.widow = 0; // hide everything else in any case
    }
});

/**
 * SBGN Layout view for the Sample Application.
 */
var LayoutPropertiesView = Backbone.View.extend({
  initialize: function () {
  },
  copyProperties: function () {

    // use active cy instance
    var cy = appUtilities.getActiveCy();

    // clone default layout props
    var clonedProp = _.clone(appUtilities.defaultLayoutProperties);

    // reset current layout props
    appUtilities.setScratch(cy, 'currentLayoutProperties', clonedProp);

    // return cloned props to make them accessible
    return clonedProp;
  },
  applyLayout: function (preferences, notUndoable, _chiseInstance) {

    // if chise instance param is not set use the recently active chise instance
    var chiseInstance = _chiseInstance || appUtilities.getActiveChiseInstance();

    // get associated cy instance
    var cy = chiseInstance.getCy();

    var currentLayoutProperties = appUtilities.getScratch(cy, 'currentLayoutProperties');

    // if preferences param is not set use an empty map not to override any layout option
    if (preferences === undefined) {
      preferences = {};
    }

    var options = $.extend({}, currentLayoutProperties, preferences);
    var verticalPaddingPercent = options.tilingPaddingVertical;
    var horizontalPaddingPercent = options.tilingPaddingHorizontal;

    // In dialog properties we keep tiling padding vertical/horizontal percentadges to be displayed
    // in dialog, in layout options we use a function using these values
    options.tilingPaddingVertical = function () {
      return chiseInstance.calculatePaddings(verticalPaddingPercent);
    };

    options.tilingPaddingHorizontal = function () {
      return chiseInstance.calculatePaddings(horizontalPaddingPercent);
    };

    chiseInstance.performLayout(options, notUndoable);
  },
  render: function () {
    var self = this;

    // use active cy instance
    var cy = appUtilities.getActiveCy();

    // get current layout props for cy
    var currentLayoutProperties = appUtilities.getScratch(cy, 'currentLayoutProperties');

    self.template = _.template($("#layout-settings-template").html());
    self.template = self.template(currentLayoutProperties);
    $(self.el).html(self.template);

    $(self.el).modal('show');

    $(document).off("click", "#save-layout").on("click", "#save-layout", function (evt) {

      // use active cy instance
      var cy = appUtilities.getActiveCy();

      // get current layout props for cy
      var currentLayoutProperties = appUtilities.getScratch(cy, 'currentLayoutProperties');

      currentLayoutProperties.nodeRepulsion = Number(document.getElementById("node-repulsion").value);
      currentLayoutProperties.idealEdgeLength = Number(document.getElementById("ideal-edge-length").value);
      currentLayoutProperties.edgeElasticity = Number(document.getElementById("edge-elasticity").value);
      currentLayoutProperties.nestingFactor = Number(document.getElementById("nesting-factor").value);
      currentLayoutProperties.gravity = Number(document.getElementById("gravity").value);
      currentLayoutProperties.numIter = Number(document.getElementById("num-iter").value);
      currentLayoutProperties.tile = document.getElementById("tile").checked;
      currentLayoutProperties.animate = document.getElementById("animate").checked ? 'during' : 'end';
      currentLayoutProperties.randomize = !document.getElementById("incremental").checked;
      currentLayoutProperties.gravityRangeCompound = Number(document.getElementById("gravity-range-compound").value);
      currentLayoutProperties.gravityCompound = Number(document.getElementById("gravity-compound").value);
      currentLayoutProperties.gravityRange = Number(document.getElementById("gravity-range").value);
      currentLayoutProperties.tilingPaddingVertical = Number(document.getElementById("tiling-padding-vertical").value);
      currentLayoutProperties.tilingPaddingHorizontal = Number(document.getElementById("tiling-padding-horizontal").value);
      currentLayoutProperties.initialEnergyOnIncremental = Number(document.getElementById("incremental-cooling-factor").value);
      currentLayoutProperties.improveFlow = document.getElementById("improve-flow").checked;

      // reset currentLayoutProperties in scratch pad
      appUtilities.setScratch(cy, currentLayoutProperties, 'currentLayoutProperties');

      $(self.el).modal('toggle');
      $(document).trigger('saveLayout', cy);
    });

    $(document).off("click", "#default-layout").on("click", "#default-layout", function (evt) {
      // reset current layout props for active cy instance and get new props
      var currentLayoutProperties = self.copyProperties();

      self.template = _.template($("#layout-settings-template").html());
      self.template = self.template(currentLayoutProperties);
      $(self.el).html(self.template);
    });

    return this;
  }
});


var ColorSchemeInspectorView = Backbone.View.extend({

  initialize: function () {
    var self = this;

    var schemes = appUtilities.mapColorSchemes;
    var schemes_gradient = Object.assign({}, schemes);
    var schemes_3D = Object.assign({}, schemes);
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
      else if(schemes[id].name == 'Pure White'){ // pure white is not an option for color scheme selection
        continue;
      }
      else { // scheme has no complement, display it normally
        schemes[id].isDisplayed = true;
      }

      schemes_gradient[id] = Object.assign({}, schemes[id]);
      schemes_3D[id] = Object.assign({}, schemes[id]);

      var colorCount = previewColors.length;
      var htmlS  = "";
      var htmlG  = "";
      var html3D = "";

      for(var i=0; i < colorCount; i++) {
        var color = chroma(previewColors[i]);
        // apply default alpha of elements backgrounds, to make it look more like reality
        color = color.alpha(0.5);
        var prct = 100/colorCount;
        htmlS += "<div style='float:left; width:"+prct+"%; height:100%; background-color:"+color.css()+"'></div>";
        htmlG += "<img style='float:left; width:"+prct+"%; height:100%;' src='" + appUtilities.colorCodeToGradientImage[previewColors[i]] + "'>";
        html3D += "<img style='float:left; width:"+prct+"%; height:100%;' src='" + appUtilities.colorCodeTo3DImage[previewColors[i]] + "'>";
      }

      schemes[id].previewHtml = htmlS;
      schemes_gradient[id].previewHtml = htmlG;
      schemes_3D[id].previewHtml = html3D;

    }

    this.schemes = schemes;
    this.schemes_gradient = schemes_gradient;
    this.schemes_3D = schemes_3D;

    // attach events
    $(document).on("click", "div.color-scheme-choice", function (evt) {
      var cy = appUtilities.getActiveCy();
      var scheme_type = appUtilities.getScratch(cy,'currentGeneralProperties').mapColorSchemeStyle;
      var raw_id = $(this).attr('id');
      var scheme_id = raw_id.replace("map-color-scheme_", "");
      appUtilities.applyMapColorScheme(scheme_id, scheme_type, self);
    });

    $(document).on("change", "#color-scheme-inspector-style-select", function (event) {
      var cy = appUtilities.getActiveCy();
      var current_scheme_id = appUtilities.getScratch(cy,'currentGeneralProperties').mapColorScheme;
      //change the currently displayed html element
      var selected_style = $('#color-scheme-inspector-style-select').val();
      //change to the color scheme choice to match current style
      appUtilities.applyMapColorScheme(current_scheme_id,selected_style,self);
    });

    $(document).on("click", "div.color-scheme-invert-button", function (evt) {
      var raw_id = $(this).attr('id');
      var cy = appUtilities.getActiveCy();
      var scheme_type = appUtilities.getScratch(cy,'currentGeneralProperties').mapColorSchemeStyle;
      var scheme_id = raw_id.replace("map-color-scheme_invert_", "");
      var inverted_id = schemes[scheme_id].invert;
      appUtilities.applyMapColorScheme(inverted_id, scheme_type, self);
    });

    $(document).on("click", "#map-color-scheme-default-button", function (evt) {
      var cy = appUtilities.getActiveCy();
      var defaultColorScheme = appUtilities.defaultGeneralProperties.mapColorScheme;
      var defaultColorSchemeStyle = appUtilities.defaultGeneralProperties.mapColorSchemeStyle;
      appUtilities.applyMapColorScheme(defaultColorScheme, defaultColorSchemeStyle, self); // default color scheme
    });
  },
  changeStyle: function(style) {
    if(style == 'solid'){
      $('#solid-color-scheme-display').show();
      $('#gradient-color-scheme-display').hide();
      $('#3D-color-scheme-display').hide();
      $("#color-scheme-inspector-style-select").val("solid");
    }
    else if(style == 'gradient'){
      $('#solid-color-scheme-display').hide();
      $('#gradient-color-scheme-display').show();
      $('#3D-color-scheme-display').hide();
      $("#color-scheme-inspector-style-select").val("gradient");
    }
    else if(style == '3D'){
      $('#solid-color-scheme-display').hide();
      $('#gradient-color-scheme-display').hide();
      $('#3D-color-scheme-display').show();
      $("#color-scheme-inspector-style-select").val("3D");
    }
  },
  render: function () {
    this.template = _.template($("#color-scheme-inspector-template").html());
    var cy = appUtilities.getActiveCy();
    // scheme_type and current_scheme are used to highlight the current color scheme with the javascript embedded to color-scheme-inspector-template div(line: 2337 in index.html)
    var scheme_type = $("#color-scheme-inspector-style-select").val();
    var current_scheme = appUtilities.getScratch(cy,'currentGeneralProperties').mapColorScheme;
    this.$el.empty();
    this.$el.html(this.template({schemes: this.schemes, schemes_gradient: this.schemes_gradient, schemes_3D: this.schemes_3D, scheme_type: scheme_type, current_scheme: current_scheme}));
    return this;
  }
});

// provide common functions for different views tied to
// inspector map panels
var GeneralPropertiesParentView = Backbone.View.extend({
  // Apply the properties as they are set
  applyUpdate: function() {

    // use active chise instance
    var chiseInstance = appUtilities.getActiveChiseInstance();

    // use the associated cy instance
    var cy = appUtilities.getActiveCy();

    // get currentGeneralProperties for cy
    var currentGeneralProperties = appUtilities.getScratch(cy, 'currentGeneralProperties');

    // get topologyGrouping instance for cy
    var topologyGrouping = chiseInstance.sifTopologyGrouping;

    chiseInstance.setShowComplexName(currentGeneralProperties.showComplexName);
    chiseInstance.refreshPaddings(); // Refresh/recalculate paddings

    if (currentGeneralProperties.enablePorts) {
      chiseInstance.enablePorts();
    }
    else {
      chiseInstance.disablePorts();
    }

    if (currentGeneralProperties.allowCompoundNodeResize) {
      chiseInstance.considerCompoundSizes();
    }
    else {
      chiseInstance.omitCompoundSizes();
    }

    // Refresh resize grapples
    cy.nodeResize('get').refreshGrapples();

    cy.style().update();

    $(document).trigger('saveGeneralProperties', cy);
  },
  setPropertiesToDefault: function () {
    var cy = appUtilities.getActiveCy();
    var clonedProps = _.clone(appUtilities.defaultGeneralProperties);
    appUtilities.setScratch(cy, 'currentGeneralProperties', clonedProps);
  }
});

// inherit from GeneralPropertiesParentView
var MapTabGeneralPanel = GeneralPropertiesParentView.extend({
  initialize: function() {
    var self = this;
    // initialize undo-redo parameters
    self.params = {};
    self.params.compoundPadding = {id: "compound-padding", type: "text",
      property: "currentGeneralProperties.compoundPadding", update: self.applyUpdate};

    self.params.arrowScale = {id: "arrow-scale", type: "range",
      property: "currentGeneralProperties.arrowScale"};

    self.params.allowCompoundNodeResize = {id: "allow-compound-node-resize", type: "checkbox",
      property: "currentGeneralProperties.allowCompoundNodeResize", update: self.applyUpdate};

    self.params.inferNestingOnLoad = {id: "infer-nesting-on-load", type: "checkbox",
      property: "currentGeneralProperties.inferNestingOnLoad"};

    self.params.enablePorts = {id: "enable-ports", type: "checkbox",
      property: "currentGeneralProperties.enablePorts", update: self.applyUpdate};

    self.params.enableSIFTopologyGrouping = {id: "enable-sif-topology-grouping", type: "checkbox",
      property: "currentGeneralProperties.enableSIFTopologyGrouping", update: self.applyUpdate};

    self.params.mapName = {id: "map-name", type: "text",
      property: "currentGeneralProperties.mapName"};

    self.params.mapDescription = {id: "map-description", type: "text",
      property: "currentGeneralProperties.mapDescription"};

    // general properties part
    $(document).on("change", "#map-name", function (evt) {

      // use active cy instance
      var cy = appUtilities.getActiveCy();

      self.params.mapName.value = $('#map-name').val();

      // TODO while making such calls appUtilities.undoable flag should be checked
      // if it is not true then the operation should not be undoable
      cy.undoRedo().do("changeMenu", self.params.mapName);

      // use the panel id as the network key
      var networkKey = cy.container().id;

      // update the network tab description as the map name is just changed
      appUtilities.updateNetworkTabDesc(networkKey);

      $('#map-name').blur();
    });

    $(document).on("change", "#map-description", function (evt) {

      // use active cy instance
      var cy = appUtilities.getActiveCy();

      self.params.mapDescription.value = $('#map-description').val();
      cy.undoRedo().do("changeMenu", self.params.mapDescription);
      $('#map-description').blur();
    });

    $(document).on("change", "#compound-padding", function (evt) {

      // use active cy instance
      var cy = appUtilities.getActiveCy();

      self.params.compoundPadding.value = Number($('#compound-padding').val());
      cy.undoRedo().do("changeMenu", self.params.compoundPadding);
      $('#compound-padding').blur();
    });

    $(document).on("change", "#arrow-scale", function (evt) {

      // use active cy instance
      var cy = appUtilities.getActiveCy();

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

      // use active cy instance
      var cy = appUtilities.getActiveCy();

      self.params.allowCompoundNodeResize.value = $('#allow-compound-node-resize').prop('checked');
      cy.undoRedo().do("changeMenu", self.params.allowCompoundNodeResize);
      $('#allow-compound-node-resize').blur();
    });

    $(document).on("change", "#infer-nesting-on-load", function (evt) {

      // use active cy instance
      var cy = appUtilities.getActiveCy();

      self.params.inferNestingOnLoad.value = $('#infer-nesting-on-load').prop('checked');
      cy.undoRedo().do("changeMenu", self.params.inferNestingOnLoad);
      $('#infer-nesting-on-load').blur();
    });

    $(document).on("change", "#enable-ports", function (evt) {

      // use active cy instance
      var cy = appUtilities.getActiveCy();

      self.params.enablePorts.value = $('#enable-ports').prop('checked');
      cy.undoRedo().do("changeMenu", self.params.enablePorts);
      $('#enable-ports').blur();
    });

    $(document).on("change", "#enable-sif-topology-grouping", function (evt) {

      // use active cy instance
      var cy = appUtilities.getActiveCy();
      var actions = [];

      self.params.enableSIFTopologyGrouping.value = $('#enable-sif-topology-grouping').prop('checked');
      var apply = self.params.enableSIFTopologyGrouping.value;

      actions.push({name: "changeMenu", param: self.params.enableSIFTopologyGrouping});
      actions.push({name: "applySIFTopologyGrouping", param: { apply }});
      cy.undoRedo().do("batch", actions);
      // cy.undoRedo().do("changeMenu", self.params.enableSIFTopologyGrouping);
      $('#enable-sif-topology-grouping').blur();
    });

    $(document).on("click", "#inspector-map-tab", function (evt) {
      var chiseInstance = appUtilities.getActiveChiseInstance();
      document.getElementById('map-type').value = chiseInstance.getMapType() ? chiseInstance.getMapType() : "Unknown";
    });

    $(document).on("shown.bs.tab", "#inspector-map-tab", function (evt) {
      var chiseInstance = appUtilities.getActiveChiseInstance();
      document.getElementById('map-type').value = chiseInstance.getMapType() ? chiseInstance.getMapType() : "Unknown";
    });

    $(document).on("click", "#map-general-default-button", function (evt) {

      // use active cy instance
      var cy = appUtilities.getActiveCy();

      var ur = cy.undoRedo();
      var actions = [];

      self.params.allowCompoundNodeResize.value = appUtilities.defaultGeneralProperties.allowCompoundNodeResize;
      self.params.inferNestingOnLoad.value = appUtilities.defaultGeneralProperties.inferNestingOnLoad;
      self.params.enablePorts.value = appUtilities.defaultGeneralProperties.enablePorts;
      self.params.enableSIFTopologyGrouping.value = appUtilities.defaultGeneralProperties.enableSIFTopologyGrouping;
      self.params.compoundPadding.value = appUtilities.defaultGeneralProperties.compoundPadding;
      self.params.arrowScale.value = appUtilities.defaultGeneralProperties.arrowScale;
      actions.push({name: "changeMenu", param: self.params.allowCompoundNodeResize});
      actions.push({name: "changeMenu", param: self.params.inferNestingOnLoad});
      actions.push({name: "changeMenu", param: self.params.enablePorts});
      actions.push({name: "changeMenu", param: self.params.enableSIFTopologyGrouping});
      actions.push({name: "applySIFTopologyGrouping", param: { apply: self.params.enableSIFTopologyGrouping.value }});
      actions.push({name: "changeMenu", param: self.params.compoundPadding});
      actions.push({name: "changeMenu", param: self.params.arrowScale});
      actions.push({name: "changeCss", param: { eles: cy.edges(), name: "arrow-scale",
          valueMap: self.params.arrowScale.value}});
      ur.do("batch", actions);
    });
  },
  render: function() {

    // use active cy instance
    var cy = appUtilities.getActiveCy();

    // get current general properties for cy
    var currentGeneralProperties = appUtilities.getScratch(cy, 'currentGeneralProperties');

    this.template = _.template($("#map-tab-general-template").html());
    this.$el.empty();
    this.$el.html(this.template(currentGeneralProperties));
    return this;
  }
});

// inherit from GeneralPropertiesParentView
var MapTabLabelPanel = GeneralPropertiesParentView.extend({
  initialize: function() {
    var self = this;
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

      // use active cy instance
      var cy = appUtilities.getActiveCy();

      self.params.dynamicLabelSize.value = $('#dynamic-label-size-select option:selected').val();
      cy.undoRedo().do("changeMenu", self.params.dynamicLabelSize);
      $('#dynamic-label-size-select').blur();
      self.applyUpdate();
    });

    $(document).on("change", "#show-complex-name", function (evt) {

      // use active cy instance
      var cy = appUtilities.getActiveCy();

      self.params.showComplexName.value = $('#show-complex-name').prop('checked');
      cy.undoRedo().do("changeMenu", self.params.showComplexName);
      $('#show-complex-name').blur();
    });

    $(document).on("change", "#adjust-node-label-font-size-automatically", function (evt) {

      // use active cy instance
      var cy = appUtilities.getActiveCy();

      self.params.adjustAutomatically.value = $('#adjust-node-label-font-size-automatically').prop('checked');
      cy.undoRedo().do("changeMenu", self.params.adjustAutomatically);
      $('#adjust-node-label-font-size-automatically').blur();
      self.applyUpdate();
    });

    $(document).on("change", "#fit-labels-to-nodes", function (evt) {

      // use active cy instance
      var cy = appUtilities.getActiveCy();

      self.params.fitLabelsToNodes.value = $('#fit-labels-to-nodes').prop('checked');
      cy.undoRedo().do("changeMenu", self.params.fitLabelsToNodes);
      $('#fit-labels-to-nodes').blur();
      self.applyUpdate();
    });

    $(document).on("change", "#fit-labels-to-infoboxes", function (evt) {

      // use active cy instance
      var cy = appUtilities.getActiveCy();

      self.params.fitLabelsToInfoboxes.value = $('#fit-labels-to-infoboxes').prop('checked');
      cy.undoRedo().do("changeMenu", self.params.fitLabelsToInfoboxes);
      $('#fit-labels-to-infoboxes').blur();
      self.applyUpdate();
    });
    $(document).on("click", "#map-label-default-button", function (evt) {

      // use active cy instance
      var cy = appUtilities.getActiveCy();

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

    // use the active cy instance
    var cy = appUtilities.getActiveCy();

    // get current general properties of cy
    var currentGeneralProperties = appUtilities.getScratch(cy, 'currentGeneralProperties');

    this.template = _.template($("#map-tab-label-template").html());
    this.$el.empty();
    this.$el.html(this.template(currentGeneralProperties));
    return this;
  }
});

// inherit from GeneralPropertiesParentView
var MapTabRearrangementPanel = GeneralPropertiesParentView.extend({
  initialize: function() {
    var self = this;
    // initialize undo-redo parameters
    self.params = {};
    self.params.recalculateLayoutOnComplexityManagement = {id: "recalculate-layout-on-complexity-management", type: "checkbox",
      property: "currentGeneralProperties.recalculateLayoutOnComplexityManagement"};

    self.params.rearrangeOnComplexityManagement = {id: "rearrange-on-complexity-management", type: "checkbox",
      property: "currentGeneralProperties.rearrangeOnComplexityManagement"};

    self.params.animateOnDrawingChanges = {id: "animate-on-drawing-changes", type: "checkbox",
      property: "currentGeneralProperties.animateOnDrawingChanges"};

    $(document).on("change", "#recalculate-layout-on-complexity-management", function (evt) {

      // use active cy instance
      var cy = appUtilities.getActiveCy();

      self.params.recalculateLayoutOnComplexityManagement.value = $('#recalculate-layout-on-complexity-management').prop('checked');
      cy.undoRedo().do("changeMenu", self.params.recalculateLayoutOnComplexityManagement);
      $('#recalculate-layout-on-complexity-management').blur();
    });

    $(document).on("change", "#rearrange-on-complexity-management", function (evt) {

      // use active cy instance
      var cy = appUtilities.getActiveCy();

      self.params.rearrangeOnComplexityManagement.value = $('#rearrange-on-complexity-management').prop('checked');
      cy.undoRedo().do("changeMenu", self.params.rearrangeOnComplexityManagement);
      $('#rearrange-on-complexity-management').blur();
    });

    $(document).on("change", "#animate-on-drawing-changes", function (evt) {

      // use active cy instance
      var cy = appUtilities.getActiveCy();

      self.params.animateOnDrawingChanges.value = $('#animate-on-drawing-changes').prop('checked');
      cy.undoRedo().do("changeMenu", self.params.animateOnDrawingChanges);
      $('#animate-on-drawing-changes').blur();
    });

    $(document).on("click", "#map-rearrangement-default-button", function (evt) {

      // use active cy instance
      var cy = appUtilities.getActiveCy();

      var ur = cy.undoRedo();
      var actions = [];
      self.params.recalculateLayoutOnComplexityManagement.value = appUtilities.defaultGeneralProperties.recalculateLayoutOnComplexityManagement;
      self.params.rearrangeOnComplexityManagement.value = appUtilities.defaultGeneralProperties.rearrangeOnComplexityManagement;
      self.params.animateOnDrawingChanges.value = appUtilities.defaultGeneralProperties.animateOnDrawingChanges;
      actions.push({name: "changeMenu", param: self.params.recalculateLayoutOnComplexityManagement});
      actions.push({name: "changeMenu", param: self.params.rearrangeOnComplexityManagement});
      actions.push({name: "changeMenu", param: self.params.animateOnDrawingChanges});
      ur.do("batch", actions);
    });
  },
  render: function() {

    // use the active cy instance
    var cy = appUtilities.getActiveCy();

    // get current general properties of cy
    var currentGeneralProperties = appUtilities.getScratch(cy, 'currentGeneralProperties');

    this.template = _.template($("#map-tab-rearrangement-template").html());
    this.$el.empty();
    this.$el.html(this.template(currentGeneralProperties));

    return this;
  }
});

/**
 * SBGN Properties view for the Sample Application.
 */
/*var GeneralPropertiesView = Backbone.View.extend({
  initialize: function () {
    var self = this;

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


String.prototype.replaceAll = function(search, replace)
{
    //if replace is not sent, return original string otherwise it will
    //replace search string with 'undefined'.
    if (replace === undefined) {
        return this.toString();
    }

    return this.replace(new RegExp('[' + search + ']', 'g'), replace);
};

//Global variable used to check which PathwayCommon dialog was open recently
//Clicking Ok in Error dialog will redirect to opening of that certain dialog again
var PCdialog = "";

/**
 * Neighborhood Query view for the Sample Application.
 */
var NeighborhoodQueryView = Backbone.View.extend({
  defaultQueryParameters: {
    geneSymbols: "",
    lengthLimit: 1
  },
  currentQueryParameters: null,
  initialize: function () {
    var self = this;
    self.copyProperties();
    self.template = _.template($("#query-neighborhood-template").html());
    self.template = self.template(self.currentQueryParameters);
  },
  copyProperties: function () {
    this.currentQueryParameters = _.clone(this.defaultQueryParameters);
  },
  render: function () {

    var self = this;
    self.template = _.template($("#query-neighborhood-template").html());
    self.template = self.template(self.currentQueryParameters);
    $(self.el).html(self.template);

    $(self.el).modal('show');
    PCdialog = "Neighborhood";

    $(document).off("click", "#save-query-neighborhood").on("click", "#save-query-neighborhood", function (evt) {

      // use active chise instance
      var chiseInstance = appUtilities.getActiveChiseInstance();

      // use the associated cy instance
      var cy = chiseInstance.getCy();

      self.currentQueryParameters.geneSymbols = document.getElementById("query-neighborhood-gene-symbols").value;
      self.currentQueryParameters.lengthLimit = Number(document.getElementById("query-neighborhood-length-limit").value);

      var geneSymbols = self.currentQueryParameters.geneSymbols.trim();
      if (geneSymbols.length === 0) {
          document.getElementById("query-neighborhood-gene-symbols").focus();
          return;
      }
      // geneSymbols is cleaned up from undesired characters such as #,$,! etc. and spaces put before and after the string
      geneSymbols = geneSymbols.replace(/[^a-zA-Z0-9\n\t ]/g, "").trim();
      if (geneSymbols.length === 0) {
        $(self.el).modal('toggle');
        new PromptInvalidQueryView({el: '#prompt-invalidQuery-table'}).render();
        return;
      }
      if (self.currentQueryParameters.lengthLimit > 2) {
        $(self.el).modal('toggle');
        new PromptInvalidLengthLimitView({el: '#prompt-invalidLengthLimit-table'}).render();
        document.getElementById("query-neighborhood-length-limit").focus();
        return;
      }

      var queryURL = "http://www.pathwaycommons.org/pc2/graph?format=SBGN&kind=NEIGHBORHOOD&limit="
          + self.currentQueryParameters.lengthLimit;
      var geneSymbolsArray = geneSymbols.replaceAll("\n", " ").replaceAll("\t", " ").split(" ");

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
      filename = filename + '_NEIGHBORHOOD.sbgnml';
      queryURL = queryURL + sources;

      if(cy.nodes().length == 0){

        chiseInstance.startSpinner('neighborhood-spinner');
        var currentGeneralProperties = appUtilities.getScratch(cy, 'currentGeneralProperties');
        var currentInferNestingOnLoad = currentGeneralProperties.inferNestingOnLoad;

        $.ajax({
          type: 'get',
          url: "/utilities/testURL",
          data: {url: queryURL},
          success: function(data){
            if (!data.error && data.response.statusCode == 200 && data.response.body) {
              var xml = $.parseXML(data.response.body);
              $(document).trigger('sbgnvizLoadFile', [ filename, cy ]);
              currentGeneralProperties.inferNestingOnLoad = false;
              chiseInstance.updateGraph(chiseInstance.convertSbgnmlToJson(xml), undefined, true);
              currentGeneralProperties.inferNestingOnLoad = currentInferNestingOnLoad;
              chiseInstance.endSpinner('neighborhood-spinner');
              $(document).trigger('sbgnvizLoadFileEnd', [ filename, cy ]);
            }
            else {
              new PromptInvalidQueryView({el: '#prompt-invalidQuery-table'}).render();
              chiseInstance.endSpinner('neighborhood-spinner');
            }
          },
          error: function(xhr, options, err){
            new PromptInvalidQueryView({el: '#prompt-invalidQuery-table'}).render();
            chiseInstance.endSpinner('neighborhood-spinner');
          }
        });

        $(self.el).modal('toggle');

      }
      else{

        new PromptConfirmationView({el: '#prompt-confirmation-table'}).render(function(){

          chiseInstance.startSpinner('neighborhood-spinner');
          var currentGeneralProperties = appUtilities.getScratch(cy, 'currentGeneralProperties');
          var currentInferNestingOnLoad = currentGeneralProperties.inferNestingOnLoad;

          $.ajax({
            type: 'get',
            url: "/utilities/testURL",
            data: {url: queryURL},
            success: function(data){
              if (!data.error && data.response.statusCode == 200 && data.response.body) {
                var xml = $.parseXML(data.response.body);
                $(document).trigger('sbgnvizLoadFile', [ filename, cy ]);
                currentGeneralProperties.inferNestingOnLoad = false;
                chiseInstance.updateGraph(chiseInstance.convertSbgnmlToJson(xml), undefined, true);
                currentGeneralProperties.inferNestingOnLoad = currentInferNestingOnLoad;
                chiseInstance.endSpinner('neighborhood-spinner');
                $(document).trigger('sbgnvizLoadFileEnd', [ filename, cy ]);
              }
              else {
                new PromptInvalidQueryView({el: '#prompt-invalidQuery-table'}).render();
                chiseInstance.endSpinner('neighborhood-spinner');
              }
            },
            error: function(xhr, options, err){
              new PromptInvalidQueryView({el: '#prompt-invalidQuery-table'}).render();
              chiseInstance.endSpinner('neighborhood-spinner');
            }
          });

          $(self.el).modal('toggle');

        });

      }

    });

    $(document).off("click", "#cancel-query-neighborhood").on("click", "#cancel-query-neighborhood", function (evt) {
      $(self.el).modal('toggle');
    });

    return this;
  }
});

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
        PCdialog = "PathsBetween";

        $(document).off("click", "#save-query-pathsbetween").on("click", "#save-query-pathsbetween", function (evt) {

            // use active chise instance
            var chiseInstance = appUtilities.getActiveChiseInstance();

            // use the associated cy instance
            var cy = chiseInstance.getCy();

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
            var geneSymbolsArray = geneSymbols.replaceAll("\n", " ").replaceAll("\t", " ").split(" ");

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
            queryURL = queryURL + sources;

            if(cy.nodes().length == 0){

              chiseInstance.startSpinner('paths-between-spinner');
              var currentGeneralProperties = appUtilities.getScratch(cy, 'currentGeneralProperties');
              var currentInferNestingOnLoad = currentGeneralProperties.inferNestingOnLoad;

              $.ajax({
                type: 'get',
                url: "/utilities/testURL",
                data: {url: queryURL},
                success: function(data){
                  if (!data.error && data.response.statusCode == 200 && data.response.body) {
                    var xml = $.parseXML(data.response.body);
                    $(document).trigger('sbgnvizLoadFile', [ filename, cy ]);
                    currentGeneralProperties.inferNestingOnLoad = false;
                    chiseInstance.updateGraph(chiseInstance.convertSbgnmlToJson(xml), undefined, true);
                    currentGeneralProperties.inferNestingOnLoad = currentInferNestingOnLoad;
                    chiseInstance.endSpinner('paths-between-spinner');
                    $(document).trigger('sbgnvizLoadFileEnd', [ filename, cy ]);
                  }
                  else {
                    new PromptInvalidQueryView({el: '#prompt-invalidQuery-table'}).render();
                    chiseInstance.endSpinner('paths-between-spinner');
                  }
                },
                error: function(xhr, options, err){
                  new PromptInvalidQueryView({el: '#prompt-invalidQuery-table'}).render();
                  chiseInstance.endSpinner('paths-between-spinner');
                }
              });

              $(self.el).modal('toggle');

            }
            else{

              new PromptConfirmationView({el: '#prompt-confirmation-table'}).render(function(){

                chiseInstance.startSpinner('paths-between-spinner');
                var currentGeneralProperties = appUtilities.getScratch(cy, 'currentGeneralProperties');
                var currentInferNestingOnLoad = currentGeneralProperties.inferNestingOnLoad;

                $.ajax({
                  type: 'get',
                  url: "/utilities/testURL",
                  data: {url: queryURL},
                  success: function(data){
                    if (!data.error && data.response.statusCode == 200 && data.response.body) {
                      var xml = $.parseXML(data.response.body);
                      $(document).trigger('sbgnvizLoadFile', [ filename, cy ]);
                      currentGeneralProperties.inferNestingOnLoad = false;
                      chiseInstance.updateGraph(chiseInstance.convertSbgnmlToJson(xml), undefined, true);
                      currentGeneralProperties.inferNestingOnLoad = currentInferNestingOnLoad;
                      chiseInstance.endSpinner('paths-between-spinner');
                      $(document).trigger('sbgnvizLoadFileEnd', [ filename, cy ]);
                    }
                    else {
                      new PromptInvalidQueryView({el: '#prompt-invalidQuery-table'}).render();
                      chiseInstance.endSpinner('paths-between-spinner');
                    }
                  },
                  error: function(xhr, options, err){
                    new PromptInvalidQueryView({el: '#prompt-invalidQuery-table'}).render();
                    chiseInstance.endSpinner('paths-between-spinner');
                  }
                });

                $(self.el).modal('toggle');

              });

            }

        });

        $(document).off("click", "#cancel-query-pathsbetween").on("click", "#cancel-query-pathsbetween", function (evt) {
            $(self.el).modal('toggle');
        });

        return this;
    }
});

/**
 * Paths From To Query view for the Sample Application.
 */
var PathsFromToQueryView = Backbone.View.extend({
    defaultQueryParameters: {
        sourceSymbols: "",
        targetSymbols: "",
        lengthLimit: 1
    },
    currentQueryParameters: null,
    initialize: function () {
        var self = this;
        self.copyProperties();
        self.template = _.template($("#query-pathsfromto-template").html());
        self.template = self.template(self.currentQueryParameters);
    },
    copyProperties: function () {
        this.currentQueryParameters = _.clone(this.defaultQueryParameters);
    },
    render: function () {

        var self = this;
        self.template = _.template($("#query-pathsfromto-template").html());
        self.template = self.template(self.currentQueryParameters);
        $(self.el).html(self.template);

        $(self.el).modal('show');
        PCdialog = "PathsFromTo";

        $(document).off("click", "#save-query-pathsfromto").on("click", "#save-query-pathsfromto", function (evt) {

            // use active chise instance
            var chiseInstance = appUtilities.getActiveChiseInstance();

            // use the associated cy instance
            var cy = chiseInstance.getCy();

            self.currentQueryParameters.sourceSymbols = document.getElementById("query-pathsfromto-source-symbols").value;
            self.currentQueryParameters.targetSymbols = document.getElementById("query-pathsfromto-target-symbols").value;
            self.currentQueryParameters.lengthLimit = Number(document.getElementById("query-pathsfromto-length-limit").value);

            var sourceSymbols = self.currentQueryParameters.sourceSymbols.trim();
            if (sourceSymbols.length === 0) {
                document.getElementById("query-pathsfromto-source-symbols").focus();
                return;
            }
            // sourceSymbols is cleaned up from undesired characters such as #,$,! etc. and spaces put before and after the string
            sourceSymbols = sourceSymbols.replace(/[^a-zA-Z0-9\n\t ]/g, "").trim();
            if (sourceSymbols.length === 0) {
                $(self.el).modal('toggle');
                new PromptInvalidQueryView({el: '#prompt-invalidQuery-table'}).render();
                return;
            }

            var targetSymbols = self.currentQueryParameters.targetSymbols.trim();
            if (targetSymbols.length === 0) {
                document.getElementById("query-pathsfromto-target-symbols").focus();
                return;
            }
            // targetSymbols is cleaned up from undesired characters such as #,$,! etc. and spaces put before and after the string
            targetSymbols = targetSymbols.replace(/[^a-zA-Z0-9\n\t ]/g, "").trim();
            if (targetSymbols.length === 0) {
                $(self.el).modal('toggle');
                new PromptInvalidQueryView({el: '#prompt-invalidQuery-table'}).render();
                return;
            }

            if (self.currentQueryParameters.lengthLimit > 3) {
                $(self.el).modal('toggle');
                new PromptInvalidLengthLimitView({el: '#prompt-invalidLengthLimit-table'}).render();
                document.getElementById("query-pathsfromto-length-limit").focus();
                return;
            }

            var queryURL = "http://www.pathwaycommons.org/pc2/graph?format=SBGN&kind=PATHSFROMTO&limit="
                + self.currentQueryParameters.lengthLimit;
            var sourceSymbolsArray = sourceSymbols.replaceAll("\n", " ").replaceAll("\t", " ").split(" ");
            var targetSymbolsArray = targetSymbols.replaceAll("\n", " ").replaceAll("\t", " ").split(" ");

            var filename = "";
            var sources = "";
            var targets = "";
            for (var i = 0; i < sourceSymbolsArray.length; i++) {
                var currentGeneSymbol = sourceSymbolsArray[i];
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
            for (var i = 0; i < targetSymbolsArray.length; i++) {
                var currentGeneSymbol = targetSymbolsArray[i];
                if (currentGeneSymbol.length == 0 || currentGeneSymbol == ' '
                    || currentGeneSymbol == '\n' || currentGeneSymbol == '\t') {
                    continue;
                }
                targets = targets + "&target=" + currentGeneSymbol;

                if (filename == '') {
                    filename = currentGeneSymbol;
                } else {
                    filename = filename + '_' + currentGeneSymbol;
                }
            }
            filename = filename + '_PATHSFROMTO.sbgnml';
            queryURL = queryURL + sources + targets;

            if(cy.nodes().length == 0){

              chiseInstance.startSpinner('paths-fromto-spinner');
              var currentGeneralProperties = appUtilities.getScratch(cy, 'currentGeneralProperties');
              var currentInferNestingOnLoad = currentGeneralProperties.inferNestingOnLoad;

              $.ajax({
                type: 'get',
                url: "/utilities/testURL",
                data: {url: queryURL},
                success: function(data){
                  if (!data.error && data.response.statusCode == 200 && data.response.body) {
                    var xml = $.parseXML(data.response.body);
                    $(document).trigger('sbgnvizLoadFile', [ filename, cy ]);
                    currentGeneralProperties.inferNestingOnLoad = false;
                    chiseInstance.updateGraph(chiseInstance.convertSbgnmlToJson(xml), undefined, true);
                    currentGeneralProperties.inferNestingOnLoad = currentInferNestingOnLoad;
                    chiseInstance.endSpinner('paths-fromto-spinner');
                    $(document).trigger('sbgnvizLoadFileEnd', [ filename, cy ]);
                  }
                  else {
                    new PromptInvalidQueryView({el: '#prompt-invalidQuery-table'}).render();
                    chiseInstance.endSpinner('paths-fromto-spinner');
                  }
                },
                error: function(xhr, options, err){
                  new PromptInvalidQueryView({el: '#prompt-invalidQuery-table'}).render();
                  chiseInstance.endSpinner('paths-fromto-spinner');
                }
              });

              $(self.el).modal('toggle');

            }
            else{

              new PromptConfirmationView({el: '#prompt-confirmation-table'}).render(function(){

                chiseInstance.startSpinner('paths-fromto-spinner');
                var currentGeneralProperties = appUtilities.getScratch(cy, 'currentGeneralProperties');
                var currentInferNestingOnLoad = currentGeneralProperties.inferNestingOnLoad;

                $.ajax({
                  type: 'get',
                  url: "/utilities/testURL",
                  data: {url: queryURL},
                  success: function(data){
                    if (!data.error && data.response.statusCode == 200 && data.response.body) {
                      var xml = $.parseXML(data.response.body);
                      $(document).trigger('sbgnvizLoadFile', [ filename, cy ]);
                      currentGeneralProperties.inferNestingOnLoad = false;
                      chiseInstance.updateGraph(chiseInstance.convertSbgnmlToJson(xml), undefined, true);
                      currentGeneralProperties.inferNestingOnLoad = currentInferNestingOnLoad;
                      chiseInstance.endSpinner('paths-fromto-spinner');
                      $(document).trigger('sbgnvizLoadFileEnd', [ filename, cy ]);
                    }
                    else {
                      new PromptInvalidQueryView({el: '#prompt-invalidQuery-table'}).render();
                      chiseInstance.endSpinner('paths-fromto-spinner');
                    }
                  },
                  error: function(xhr, options, err){
                    new PromptInvalidQueryView({el: '#prompt-invalidQuery-table'}).render();
                    chiseInstance.endSpinner('paths-fromto-spinner');
                  }
                });

                $(self.el).modal('toggle');

              });

            }

        });

        $(document).off("click", "#cancel-query-pathsfromto").on("click", "#cancel-query-pathsfromto", function (evt) {
            $(self.el).modal('toggle');
        });

        return this;
    }
});

/**
 * Common Stream Query view for the Sample Application.
 */
var CommonStreamQueryView = Backbone.View.extend({
    defaultQueryParameters: {
        geneSymbols: "",
        lengthLimit: 1
    },
    currentQueryParameters: null,
    initialize: function () {
        var self = this;
        self.copyProperties();
        self.template = _.template($("#query-commonstream-template").html());
        self.template = self.template(self.currentQueryParameters);
    },
    copyProperties: function () {
        this.currentQueryParameters = _.clone(this.defaultQueryParameters);
    },
    render: function () {

        var self = this;
        self.template = _.template($("#query-commonstream-template").html());
        self.template = self.template(self.currentQueryParameters);
        $(self.el).html(self.template);

        $(self.el).modal('show');
        PCdialog = "CommonStream";

        $(document).off("click", "#save-query-commonstream").on("click", "#save-query-commonstream", function (evt) {



            // use active chise instance
            var chiseInstance = appUtilities.getActiveChiseInstance();

            // use the associated cy instance
            var cy = chiseInstance.getCy();

            self.currentQueryParameters.geneSymbols = document.getElementById("query-commonstream-gene-symbols").value;
            self.currentQueryParameters.lengthLimit = Number(document.getElementById("query-commonstream-length-limit").value);

            var geneSymbols = self.currentQueryParameters.geneSymbols.trim();
            if (geneSymbols.length === 0) {
                document.getElementById("query-commonstream-gene-symbols").focus();
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
                document.getElementById("query-commonstream-length-limit").focus();
                return;
            }

            var queryURL = "http://www.pathwaycommons.org/pc2/graph?format=SBGN&kind=COMMONSTREAM&limit="
                + self.currentQueryParameters.lengthLimit;
            var geneSymbolsArray = geneSymbols.replaceAll("\n", " ").replaceAll("\t", " ").split(" ");

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
            filename = filename + '_COMMONSTREAM.sbgnml';
            queryURL = queryURL + sources;

            if(cy.nodes().length == 0){

              chiseInstance.startSpinner('common-stream-spinner');
              var currentGeneralProperties = appUtilities.getScratch(cy, 'currentGeneralProperties');
              var currentInferNestingOnLoad = currentGeneralProperties.inferNestingOnLoad;

              $.ajax({
                type: 'get',
                url: "/utilities/testURL",
                data: {url: queryURL},
                success: function(data){
                  if (!data.error && data.response.statusCode == 200 && data.response.body) {
                    var xml = $.parseXML(data.response.body);
                    $(document).trigger('sbgnvizLoadFile', [ filename, cy ]);
                    currentGeneralProperties.inferNestingOnLoad = false;
                    chiseInstance.updateGraph(chiseInstance.convertSbgnmlToJson(xml), undefined, true);
                    currentGeneralProperties.inferNestingOnLoad = currentInferNestingOnLoad;
                    chiseInstance.endSpinner('common-stream-spinner');
                    $(document).trigger('sbgnvizLoadFileEnd', [ filename, cy ]);
                  }
                  else {
                    new PromptInvalidQueryView({el: '#prompt-invalidQuery-table'}).render();
                    chiseInstance.endSpinner('common-stream-spinner');
                  }
                },
                error: function(xhr, options, err){
                  new PromptInvalidQueryView({el: '#prompt-invalidQuery-table'}).render();
                  chiseInstance.endSpinner('common-stream-spinner');
                }
              });

              $(self.el).modal('toggle');

            }
            else{

              new PromptConfirmationView({el: '#prompt-confirmation-table'}).render(function(){

                chiseInstance.startSpinner('common-stream-spinner');
                var currentGeneralProperties = appUtilities.getScratch(cy, 'currentGeneralProperties');
                var currentInferNestingOnLoad = currentGeneralProperties.inferNestingOnLoad;

                $.ajax({
                  type: 'get',
                  url: "/utilities/testURL",
                  data: {url: queryURL},
                  success: function(data){
                    if (!data.error && data.response.statusCode == 200 && data.response.body) {
                      var xml = $.parseXML(data.response.body);
                      $(document).trigger('sbgnvizLoadFile', [ filename, cy ]);
                      currentGeneralProperties.inferNestingOnLoad = false;
                      chiseInstance.updateGraph(chiseInstance.convertSbgnmlToJson(xml), undefined, true);
                      currentGeneralProperties.inferNestingOnLoad = currentInferNestingOnLoad;
                      chiseInstance.endSpinner('common-stream-spinner');
                      $(document).trigger('sbgnvizLoadFileEnd', [ filename, cy ]);
                    }
                    else {
                      new PromptInvalidQueryView({el: '#prompt-invalidQuery-table'}).render();
                      chiseInstance.endSpinner('common-stream-spinner');
                    }
                  },
                  error: function(xhr, options, err){
                    new PromptInvalidQueryView({el: '#prompt-invalidQuery-table'}).render();
                    chiseInstance.endSpinner('common-stream-spinner');
                  }
                });

                $(self.el).modal('toggle');

              });

            }
        });

        $(document).off("click", "#cancel-query-commonstream").on("click", "#cancel-query-commonstream", function (evt) {
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



      // use the active chise instance
      var chiseInstance = appUtilities.getActiveChiseInstance();

      // use the associated cy instance
      var cy = chiseInstance.getCy();

      self.currentQueryParameters.URI = document.getElementById("query-pathsbyURI-URI").value;
      var uri = self.currentQueryParameters.URI.trim();

      if (uri.length === 0) {
          document.getElementById("query-pathsbyURI-URI").focus();
          return;
      }
      // uri is cleaned up from undesired characters such as #,$,! etc. and spaces put before and after the string
      uri = uri.replace(/[^a-zA-Z0-9:/.\-\n\t ]/g, "").trim();
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

      if(cy.nodes().length == 0){

        chiseInstance.startSpinner('paths-byURI-spinner');
        var currentGeneralProperties = appUtilities.getScratch(cy, 'currentGeneralProperties');
        var currentInferNestingOnLoad = currentGeneralProperties.inferNestingOnLoad;

        $.ajax({
          type: 'get',
          url: "/utilities/testURL",
          data: {url: queryURL},
          success: function(data){
            if (!data.error && data.response.statusCode == 200 && data.response.body) {
              var xml = $.parseXML(data.response.body);
              $(document).trigger('sbgnvizLoadFile', [ filename, cy ]);
              currentGeneralProperties.inferNestingOnLoad = false;
              chiseInstance.updateGraph(chiseInstance.convertSbgnmlToJson(xml), undefined, true);
              currentGeneralProperties.inferNestingOnLoad = currentInferNestingOnLoad;
              chiseInstance.endSpinner('paths-byURI-spinner');
              $(document).trigger('sbgnvizLoadFileEnd', [ filename, cy ]);
            }
            else {
              new PromptInvalidURIView({el: '#prompt-invalidURI-table'}).render();
              chiseInstance.endSpinner('paths-byURI-spinner');
            }
          },
          error: function(xhr, options, err){
            new PromptInvalidURIView({el: '#prompt-invalidURI-table'}).render();
            chiseInstance.endSpinner('paths-byURI-spinner');
          }
        });

        $(self.el).modal('toggle');

      }
      else{

        new PromptConfirmationView({el: '#prompt-confirmation-table'}).render(function(){

          chiseInstance.startSpinner('paths-byURI-spinner');
          var currentGeneralProperties = appUtilities.getScratch(cy, 'currentGeneralProperties');
          var currentInferNestingOnLoad = currentGeneralProperties.inferNestingOnLoad;

          $.ajax({
            type: 'get',
            url: "/utilities/testURL",
            data: {url: queryURL},
            success: function(data){
              if (!data.error && data.response.statusCode == 200 && data.response.body) {
                var xml = $.parseXML(data.response.body);
                $(document).trigger('sbgnvizLoadFile', [ filename, cy ]);
                currentGeneralProperties.inferNestingOnLoad = false;
                chiseInstance.updateGraph(chiseInstance.convertSbgnmlToJson(xml), undefined, true);
                currentGeneralProperties.inferNestingOnLoad = currentInferNestingOnLoad;
                chiseInstance.endSpinner('paths-byURI-spinner');
                $(document).trigger('sbgnvizLoadFileEnd', [ filename, cy ]);
              }
              else {
                new PromptInvalidURIView({el: '#prompt-invalidURI-table'}).render();
                chiseInstance.endSpinner('paths-byURI-spinner');
              }
            },
            error: function(xhr, options, err){
              new PromptInvalidURIView({el: '#prompt-invalidURI-table'}).render();
              chiseInstance.endSpinner('paths-byURI-spinner');
            }
          });

          $(self.el).modal('toggle');

        });

      }

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
  /*
    possibility to use different export format here in the future
    fileformat: sbgnml
    version: for sbgnml: 0.2, 0.3
  */
  render: function (fileformat, version, text) {
    var self = this;
    self.template = _.template($("#file-save-template").html());

    $(self.el).html(self.template);
    $(self.el).modal('show');

    $("#file-save-table").keyup(function(e){
      if (e.which == 13 && $(self.el).data('bs.modal').isShown && !$("#file-save-accept").is(":focus") && !$("#file-save-cancel").is(":focus")){
        $("#file-save-accept").click();
      }
    });

    var filename = document.getElementById('file-name').innerHTML;
    var fExt;
    switch (fileformat) {
      case 'nwt':
        fExt = 'nwt';
        break;
      case 'sbgnml':
        fExt = 'sbgnml'
        break;
      case 'celldesigner':
      default:
        fExt = 'xml'
        break;
    }

    filename = filename.substring(0, filename.lastIndexOf('.')).concat(".").concat(fExt);
    $("#file-save-filename").val(filename);

    $(document).off("click", "#file-save-accept").on("click", "#file-save-accept", function (evt) {

      // use the active chise instance
      var chiseInstance = appUtilities.getActiveChiseInstance();

      // use the assocated cy instance
      var cy = chiseInstance.getCy();

      // get current general properties for cy
      var currentGeneralProperties = appUtilities.getScratch(cy, 'currentGeneralProperties');

      filename = $("#file-save-filename").val();
      appUtilities.setFileContent(filename);

      if(fileformat === "sbgnml" || fileformat === "nwt") {
        var renderInfo;
        var properties = jquery.extend(true, {}, currentGeneralProperties);
        delete properties.mapType; // already stored in sbgn file, no need to store in extension as property

        var saveAsFcn = chiseInstance.saveAsNwt;
        if ( fileformat === "sbgnml" ) {
          saveAsFcn = chiseInstance.saveAsSbgnml;
        }

        var nodes, edges;

        if ( fileformat === "sbgnml" ) {
          if (chiseInstance.elementUtilities.mapType === 'SIF') {
            properties.mapType = 'Unknown';
          }

          nodes = cy.nodes().filter( function( node ) {
            return !chiseInstance.elementUtilities.isSIFNode( node );
          } );

          edges = cy.edges().filter( function( edge ) {
            return !chiseInstance.elementUtilities.isSIFEdge( edge )
              && !chiseInstance.elementUtilities.isSIFNode( edge.data('source') )
              && !chiseInstance.elementUtilities.isSIFNode( edge.data('target') );
          } );
        }
        else if ( chiseInstance.elementUtilities.mapType === 'SIF' && properties.enableSIFTopologyGrouping ) {
          // get topologyGrouping instance for cy
          var topologyGrouping = chiseInstance.sifTopologyGrouping;
          var compoundGroups = topologyGrouping.getGroupCompounds();
          var metaEdges = topologyGrouping.getMetaEdges();

          nodes = cy.nodes().not( compoundGroups );
          edges = cy.edges().not( metaEdges );

          metaEdges.forEach( function( edge ) {
            edges = edges.union( edge.data('tg-to-restore') );
          } );
        }

        renderInfo = appUtilities.getAllStyles(cy, nodes, edges);

        // Exclude extensions if the version is plain
        if (version === "plain") {
          saveAsFcn(filename, version, undefined, undefined, nodes, edges);
        }
        else {
          saveAsFcn(filename, version, renderInfo, properties, nodes, edges);
        }
      }
      else if(fileformat === "celldesigner") {
        var blob = new Blob([text], {
            type: "text/plain;charset=utf-8;",
        });
        FileSaver.saveAs(blob, filename);
      }
      else { // invalid file format provided
        console.error("FileSaveView received unsupported file format: "+fileformat);
      }

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
          if (PCdialog == "Neighborhood")
            appUtilities.neighborhoodQueryView.render();
          else if (PCdialog == "PathsBetween")
              appUtilities.pathsBetweenQueryView.render();
          else if (PCdialog == "PathsFromTo")
              appUtilities.pathsFromToQueryView.render();
          else if (PCdialog == "CommonStream")
              appUtilities.commonStreamQueryView.render();
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
        if (PCdialog == "Neighborhood")
          document.getElementById("length-limit-constant").innerHTML = "Length limit can be at most 2.";
        else
            document.getElementById("length-limit-constant").innerHTML = "Length limit can be at most 3.";
        $(self.el).modal('show');

        $(document).off("click", "#prompt-invalidLengthLimit-confirm").on("click", "#prompt-invalidLengthLimit-confirm", function (evt) {
            $(self.el).modal('toggle');
            if (PCdialog == "Neighborhood")
                appUtilities.neighborhoodQueryView.render();
            else if (PCdialog == "PathsBetween")
                appUtilities.pathsBetweenQueryView.render();
            else if (PCdialog == "PathsFromTo")
                appUtilities.pathsFromToQueryView.render();
            else if (PCdialog == "CommonStream")
                appUtilities.commonStreamQueryView.render();
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

var PromptInvalidURIWarning = Backbone.View.extend({
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

var PromptFileConversionErrorView = Backbone.View.extend({
   initialize: function () {
     var self = this;
     self.template = _.template($("#prompt-fileConversionError-template").html());
   },
   render: function() {
     var self = this;
     self.template = _.template($("#prompt-fileConversionError-template").html());

     $(self.el).html(self.template);
     $(self.el).modal('show');

     $(document).off("click", "#prompt-fileConversionError-confirm").on("click", "#prompt-fileConversionError-confirm", function (evt) {
         $(self.el).modal('toggle');
     });

     return this;
   }
});

var PromptInvalidURLWarning = Backbone.View.extend({
  initialize: function () {
    var self = this;
    self.template = _.template($("#prompt-invalidURL-template").html());
  },
  render: function () {
    var self = this;
    self.template = _.template($("#prompt-invalidURL-template").html());

    $(self.el).html(self.template);
    $(self.el).modal('show');

    $(document).off("click", "#prompt-invalidURL-confirm").on("click", "#prompt-invalidURL-confirm", function (evt) {
      $(self.el).modal('toggle');
    });

    return this;
  }
});

var PromptInvalidImageWarning = Backbone.View.extend({
  initialize: function () {
    var self = this;
    self.template = _.template($("#prompt-invalidImage-template").html());
  },
  render: function (msg) {
    var self = this;
    var tmp = $("#prompt-invalidImage-template").html();
    var spanText = '<span class="add-on layout-text">';
    var s = tmp.indexOf(spanText)
    var e = tmp.indexOf('</span>');
    tmp = tmp.substring(0, s + spanText.length) + msg + tmp.substring(e);
    self.template = _.template(tmp);

    $(self.el).html(self.template);
    $(self.el).modal('show');

    $(document).off("click", "#prompt-invalidImage-confirm").on("click", "#prompt-invalidImage-confirm", function (evt) {
      $(self.el).modal('toggle');
    });

    return this;
  }
});

var PromptInvalidEdgeWarning = Backbone.View.extend({
  initialize: function () {
    var self = this;
    self.template = _.template($("#prompt-invalidEdge-template").html());
  },
  render: function () {
    var self = this;
    self.template = _.template($("#prompt-invalidEdge-template").html());

    $(self.el).html(self.template);
    $(self.el).modal('show');

    $(document).off("click", "#prompt-invalidEdge-confirm").on("click", "#prompt-invalidEdge-confirm", function (evt) {
      $(self.el).modal('toggle');
    });

    return this;
  }
});

var ReactionTemplateView = Backbone.View.extend({
  addMacromolecule: function (type, i) {
    var html = "<tr><td>"
        + "<input type='text' class='template-reaction-textbox sbgn-input-medium layout-text' name='"
        + i + "' value=''></input>"
        + "</td><td>";
    if( type == "reaction"){
      html +=  "<select class='template-reaction-molecule-type sbgn-output-medium layout-text' name='" + i + "' style='width: 120px'>"
             + "<option value='Macromolecule' selected> Macromolecule </option>"
             + "<option value='Simple Chemical'> Simple Chemical </option></td>";
      html +=  "<td><img style='vertical-align: text-bottom;' class='template-reaction-delete-button' width='16px' height='16px' name='" + i + "' src='app/img/toolbar/delete-simple.svg'style='margin-right: 30px'/></td></tr>";
      $('#template-reaction-dissociated-table :input.template-reaction-textbox').last().closest('tr').after(html);
    }
    else if( type == "left"){
      html +=  "<select class='template-reaction-molecule-type sbgn-output-medium layout-text' name='" + i + "' style='width: 120px'>"
             + "<option value='Macromolecule'> Macromolecule </option>"
             + "<option value='Simple Chemical' selected> Simple Chemical </option></td>";
      html += "<td><img style='vertical-align: text-bottom;' class='template-reversible-input-delete-button' width='16px' height='16px' name='" + i + "' src='app/img/toolbar/delete-simple.svg' style='margin-right: 30px'/></td></tr>";
      $('#template-reversible-input-table :input.template-reaction-textbox').last().closest('tr').after(html);
    }
    else{
      html +=  "<select class='template-reaction-molecule-type sbgn-output-medium layout-text' name='" + i + "' style='width: 120px'>"
             + "<option value='Macromolecule'> Macromolecule </option>"
             + "<option value='Simple Chemical' selected> Simple Chemical </option></td>";
      html += "<td><img style='vertical-align: text-bottom;' class='template-reversible-output-delete-button' width='16px' height='16px' name='" + i + "' src='app/img/toolbar/delete-simple.svg'/></td></tr>";
      $('#template-reversible-output-table :input.template-reaction-textbox').last().closest('tr').after(html);
    }
    return html;
  },
  removeMacromolecule: function (type, i) {
    if(type == "reaction"){
      $('#template-reaction-dissociated-table :input.template-reaction-textbox[name="'+i+'"]').closest('tr').remove();;
    }
    else if(type == "left"){
      $('#template-reversible-input-table :input.template-reaction-textbox[name="'+i+'"]').closest('tr').remove();
    }
    else{
      $('#template-reversible-output-table :input.template-reaction-textbox[name="'+i+'"]').closest('tr').remove();
    }
  },
  switchInputOutput: function (e) {
    var self = this;
    if(e == "association") {
      $('#reaction-template-left-td').html(self.associatedHTMLContent);
      $('#reaction-template-right-td').html(self.dissociatedHTMLContent);
    }
    else if(e == "dissociation"){
      $('#reaction-template-left-td').html(self.dissociatedHTMLContent);
      $('#reaction-template-right-td').html(self.associatedHTMLContent);
    }
    else{
      $('#reaction-template-left-td').html(self.reversibleInputHTMLContent);
      $('#reaction-template-right-td').html(self.reversibleOutputHTMLContent);
      self.disableDeleteButtonStyle("left");
      self.disableDeleteButtonStyle("right");
    }
  },
  getAllParameters: function () {
    var templateType = $('#reaction-template-type-select').val();
    var templateReactionComplexName = $('#template-reaction-complex-name').val();
    var nodeNames = $('#template-reaction-dissociated-table  :input.template-reaction-textbox').map(function(){
        return {
            name: $(this).val(),
            id: $(this).attr('name').charAt(0)
        };
    }).toArray();
    var nodeTypes = $('#template-reaction-dissociated-table  :input.template-reaction-molecule-type :selected').map(function(){
        return $(this).val();
    }).toArray();
    var nodeList = [];
    for( var i = 0; i < nodeNames.length; i++){
      nodeList.push(
        {
          "name": nodeNames[i].name,
          "type": nodeTypes[i],
          "id": nodeNames[i].id
        }
      );
    }
    var reversibleInputNodeNames = $('#template-reversible-input-table :input.template-reaction-textbox').map(function(){
      return $(this).val();
    }).toArray();
    var reversibleInputNodeTypes = $('#template-reversible-input-table :input.template-reaction-molecule-type :selected').map(function(){
      return $(this).val();
    }).toArray();
    var reversibleOutputNodeNames = $('#template-reversible-output-table :input.template-reaction-textbox').map(function(){
      return $(this).val();
    }).toArray();
    var reversibleOutputNodeTypes = $('#template-reversible-output-table :input.template-reaction-molecule-type :selected').map(function(){
      return $(this).val();
    }).toArray();
    var reversibleInputNodeList = [];
    for(var i = 0; i < reversibleInputNodeNames.length; i++){
      reversibleInputNodeList.push(
        {
          name: reversibleInputNodeNames[i],
          type: reversibleInputNodeTypes[i]
        }
      );
    }
    var reversibleOutputNodeList = [];
    for(var i = 0; i < reversibleOutputNodeNames.length; i++){
      reversibleOutputNodeList.push(
        {
          name: reversibleOutputNodeNames[i],
          type: reversibleOutputNodeTypes[i]
        }
      );
    }
    // enable complex name only if the user provided something
    var templateReactionEnableComplexName = $.trim(templateReactionComplexName).length != 0;

    return {
      templateType: templateType,
      templateReactionComplexName: templateReactionComplexName,
      nodeList: nodeList,
      reversibleInputNodeList: reversibleInputNodeList,
      reversibleOutputNodeList: reversibleOutputNodeList,
      templateReactionEnableComplexName: templateReactionEnableComplexName
    }
  },
  disableDeleteButtonStyle: function (type) {
    if(type == "reaction"){
      $("img.template-reaction-delete-button").css("opacity", 0.2);
      $("img.template-reaction-delete-button").css("cursor", "default");
    }
    else if(type == "left"){
      $("img.template-reversible-input-delete-button").css("opacity", 0.2);
      $("img.template-reversible-input-delete-button").css("cursor", "default");
    }
    else{
      $("img.template-reversible-output-delete-button").css("opacity", 0.2);
      $("img.template-reversible-output-delete-button").css("cursor", "default");
    }
  },
  enableDeleteButtonStyle: function(type) {
    if(type == "reaction"){
      $("img.template-reaction-delete-button").css("opacity",1);
      $("img.template-reaction-delete-button").css("cursor", "pointer");
    }
    else if(type == "left"){
      $("img.template-reversible-input-delete-button").css("opacity",1);
      $("img.template-reversible-input-delete-button").css("cursor", "pointer");
    }
    else{
      $("img.template-reversible-output-delete-button").css("opacity",1);
      $("img.template-reversible-output-delete-button").css("cursor", "pointer");
    }

  },
  initialize: function() {

    var self = this;
    self.template = _.template($("#reaction-template-template").html());


    $(document).on('change', '#reaction-template-type-select', function (e) {
      var valueSelected = $(this).val();
      self.switchInputOutput(valueSelected);
      self.disableDeleteButtonStyle("reaction");
    });

    $(document).on("change", "#template-reaction-complex-name", function(e){
      var value = $(this).val();
      $(this).attr('value', value); // set the value in the html tag, so it is remembered when switched
    });

    $(document).on("click", "#template-reaction-add-button", function (event) {
      // get the last input name and add 1
      var nextIndex = parseInt($('#template-reaction-dissociated-table :input.template-reaction-textbox').last().attr('name')) + 1;
      self.addMacromolecule("reaction",nextIndex);
      self.enableDeleteButtonStyle("reaction");
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
      self.removeMacromolecule("reaction",index);
      if($('#template-reaction-dissociated-table :input.template-reaction-textbox').length <= 2){
        self.disableDeleteButtonStyle("reaction");
      }
    });

    $(document).on("click", "#template-reversible-input-add-button", function(event){
      var nextIndex = parseInt($('#template-reversible-input-table :input.template-reaction-textbox').last().attr('name')) + 1;
      self.addMacromolecule( "left", nextIndex);
      self.enableDeleteButtonStyle("left");
    });

    $(document).on("click", "#template-reversible-output-add-button", function(event){
      var nextIndex = parseInt($('#template-reversible-output-table :input.template-reaction-textbox').last().attr('name')) + 1;
      self.addMacromolecule( "right", nextIndex);
      self.enableDeleteButtonStyle("right");
    });

    $(document).on("click", ".template-reversible-input-delete-button", function(event){
      if($('#template-reversible-input-table :input.template-reaction-textbox').length <= 1){
        return;
      }
      var index = parseInt($(this).attr('name'));
      self.removeMacromolecule("left",index);
      if($('#template-reversible-input-table :input.template-reaction-textbox').length <= 1){
        self.disableDeleteButtonStyle("left");
      }
    });

    $(document).on("click", ".template-reversible-output-delete-button", function(event){
      if($('#template-reversible-output-table :input.template-reaction-textbox').length <= 1){
        return;
      }
      var index = parseInt($(this).attr('name'));
      self.removeMacromolecule("right",index);
      if($('#template-reversible-output-table :input.template-reaction-textbox').length <= 1){
        self.disableDeleteButtonStyle("right");
      }
    });

    $(document).on("click", "#create-template", function (evt) {

      // use active chise instance
      var chiseInstance = appUtilities.getActiveChiseInstance();

      // use the assocated cy instance
      var cy = chiseInstance.getCy();

      // get current layout properties for cy
      var currentLayoutProperties = appUtilities.getScratch(cy, 'currentLayoutProperties');

      var params = self.getAllParameters();

      var templateType = params.templateType;
      var nodeList = params.nodeList;
      var complexName = params.templateReactionEnableComplexName ? params.templateReactionComplexName : undefined;
      var tilingPaddingVertical = chiseInstance.calculatePaddings(currentLayoutProperties.tilingPaddingVertical);
      var tilingPaddingHorizontal = chiseInstance.calculatePaddings(currentLayoutProperties.tilingPaddingHorizontal);
      if(templateType == "reversible"){
        nodeList = params.reversibleInputNodeList;
        complexName = params.reversibleOutputNodeList;
      }
      chiseInstance.createTemplateReaction(templateType, nodeList, complexName, undefined, tilingPaddingVertical, tilingPaddingHorizontal);

      //Update arrow-scale of newly added edges (newly added elements are selected so we just update selected edges)
      var currentArrowScale = Number($('#arrow-scale').val());
      cy.edges(":selected").style('arrow-scale', currentArrowScale);

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
    self.disableDeleteButtonStyle("reaction");

    $(self.el).modal('show');
    self.associatedHTMLContent = $('#reaction-template-left-td').html();
    self.dissociatedHTMLContent = $('#reaction-template-right-td').html();
    self.reversibleInputHTMLContent = $('#reversible-template-left-td').html();
    self.reversibleOutputHTMLContent = $('#reversible-template-right-td').html();
    return this;
  }
});

var GridPropertiesView = Backbone.View.extend({
  initialize: function () {
  },
  copyProperties: function () {
    // use active cy instance
    var cy = appUtilities.getActiveCy();

    // clone default props
    var clonedProps = _.clone(appUtilities.defaultGridProperties);

    // update the scratch pad of cy
    appUtilities.setScratch(cy, 'currentGridProperties', clonedProps);

    // return cloned props to make them accessible
    return clonedProps;
  },
  render: function () {

    // use active cy instance
    var cy = appUtilities.getActiveCy();

    // get current grid properties
    var currentGridProperties = appUtilities.getScratch(cy, 'currentGridProperties');

    var self = this;
    self.template = _.template($("#grid-properties-template").html());
    self.template = self.template(currentGridProperties);
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

      // use active cy instance
      var cy = appUtilities.getActiveCy();

      // get current grid properties
      var currentGridProperties = appUtilities.getScratch(cy, 'currentGridProperties');

      currentGridProperties.showGrid = document.getElementById("show-grid").checked;
      currentGridProperties.snapToGridOnRelease = $("#snap-to-grid").val() == "onRelease";
      currentGridProperties.snapToGridDuringDrag = $("#snap-to-grid").val() == "duringDrag";
      currentGridProperties.snapToAlignmentLocationOnRelease = $("#snap-to-alignment-location").val() == "onRelease";
      currentGridProperties.snapToAlignmentLocationDuringDrag = $("#snap-to-alignment-location").val() == "duringDrag";
      currentGridProperties.gridSize = Number(document.getElementById("grid-size").value);
      currentGridProperties.gridColor = document.getElementById("grid-color").value;
      currentGridProperties.autoResizeNodes = document.getElementById("auto-resize-nodes").checked;
      currentGridProperties.showGeometricGuidelines = document.getElementById("show-geometric-guidelines").checked;
      currentGridProperties.showDistributionGuidelines = document.getElementById("show-distribution-guidelines").checked;
      currentGridProperties.showInitPosAlignment = document.getElementById("show-init-Pos-Alignment").checked;
      currentGridProperties.guidelineTolerance = Number(document.getElementById("guideline-tolerance").value);
      currentGridProperties.guidelineColor = document.getElementById("geometric-guideline-color").value;
      currentGridProperties.horizontalGuidelineColor = document.getElementById("horizontal-guideline-color").value;
      currentGridProperties.verticalGuidelineColor = document.getElementById("vertical-guideline-color").value;
      currentGridProperties.initPosAlignmentColor = document.getElementById("init-Pos-Alignment-Color").value;
      currentGridProperties.geometricAlignmentRange = Number(document.getElementById("geometric-alignment-range").value);
      currentGridProperties.distributionAlignmentRange = Number(document.getElementById("distribution-alignment-range").value);

	  // Line styles for guidelines
      currentGridProperties.initPosAlignmentLine = $('select[name="init-Pos-Alignment-Line"] option:selected').val().split(',').map(Number);
      currentGridProperties.lineDash = $('select[id="geometric-Alignment-Line"] option:selected').val().split(',').map(Number),
      currentGridProperties.horizontalDistLine = $('select[name="horizontal-Dist-Alignment-Line"] option:selected').val().split(',').map(Number);
      currentGridProperties.verticalDistLine = $('select[name="vertical-Dist-Alignment-Line"] option:selected').val().split(',').map(Number);
      cy.gridGuide({
        drawGrid: currentGridProperties.showGrid,
        gridColor: currentGridProperties.gridColor,
        snapToGridOnRelease: currentGridProperties.snapToGridOnRelease,
        snapToGridDuringDrag: currentGridProperties.snapToGridDuringDrag,
        snapToAlignmentLocationOnRelease: currentGridProperties.snapToAlignmentLocationOnRelease,
        snapToAlignmentLocationDuringDrag: currentGridProperties.snapToAlignmentLocationDuringDrag,
        gridSpacing: currentGridProperties.gridSize,
        resize: currentGridProperties.autoResizeNodes,
        geometricGuideline: currentGridProperties.showGeometricGuidelines,
        distributionGuidelines: currentGridProperties.showDistributionGuidelines,
        initPosAlignment: currentGridProperties.showInitPosAlignment,
        guidelinesTolerance: currentGridProperties.guidelineTolerance,
        guidelinesStyle: {
		  initPosAlignmentLine: currentGridProperties.initPosAlignmentLine,
		  lineDash: currentGridProperties.lineDash,
		  horizontalDistLine: currentGridProperties.horizontalDistLine,
		  verticalDistLine: currentGridProperties.verticalDistLine,
          strokeStyle: currentGridProperties.guidelineColor,
		  horizontalDistColor: currentGridProperties.horizontalGuidelineColor,
		  verticalDistColor: currentGridProperties.verticalGuidelineColor,
		  initPosAlignmentColor: currentGridProperties.initPosAlignmentColor,
          geometricGuidelineRange: currentGridProperties.geometricAlignmentRange,
          range: currentGridProperties.distributionAlignmentRange
        }
      });

      // reset current grid properties in scracth pad of cy
      appUtilities.setScratch(cy, 'currentGridProperties', currentGridProperties);

      $(self.el).modal('toggle');
      $(document).trigger('saveGridProperties', cy);
    });

    $(document).off("click", "#default-grid").on("click", "#default-grid", function (evt) {
      var currentGridProperties = self.copyProperties();
      self.template = _.template($("#grid-properties-template").html());
      self.template = self.template(currentGridProperties);
      $(self.el).html(self.template);
    });

    return this;
  }
});

// If the value includes ' ' char/s replace them with '_' char
// to use it as part of html selector
function sanitizeForHtml( val ) {
  return val.replaceAll( ' ', '_' );
}

function getFontFamilyOptions() {
  return [
    { value: '', label: '' },
    { value: 'Helvetica', label: 'Helvetica' },
    { value: 'Arial', label: 'Arial' },
    { value: 'Calibri', label: 'Calibri' },
    { value: 'Cambria', label: 'Cambria' },
    { value: 'Comic Sans MS', label: 'Comic Sans MS' },
    { value: 'Consolas', label: 'Consolas' },
    { value: 'Corsiva', label: 'Corsiva' },
    { value: 'Courier New', label: 'Courier New' },
    { value: 'Droid Sans', label: 'Droid Sans' },
    { value: 'Droid Serif', label: 'Droid Serif' },
    { value: 'Georgia', label: 'Georgia' },
    { value: 'Impact', label: 'Impact' },
    { value: 'Lato', label: 'Lato' },
    { value: 'Roboto', label: 'Roboto' },
    { value: 'Source Sans Pro', label: 'Source Sans Pro' },
    { value: 'Syncopate', label: 'Syncopate' },
    { value: 'Times New Roman', label: 'Times New Roman' },
    { value: 'Trebuchet MS', label: 'Trebuchet MS' },
    { value: 'Ubuntu', label: 'Ubuntu' },
    { value: 'Verdana', label: 'Verdana' }
  ];
}

function getFontWeightOptions() {
  return [
    { value: '', label: '' },
    { value: 'lighter', label: 'Lighter' },
    { value: 'normal', label: 'Normal' },
    { value: 'bold', label: 'Bold' },
    { value: 'bolder', label: 'Bolder' }
  ];
}

function getFontStyleOptions() {
  return [
    { value: '', label: '' },
    { value: 'normal', label: 'Normal' },
    { value: 'italic', label: 'Italic' },
    { value: 'oblique', label: 'Oblique' }
  ];
}

function generateFontPropertiesRows(selectorPrefix, labelPrefix, properties) {
  var html = "";

  var familyOptStyle = [{
    name: 'font-family',
    value: function(ff) {
      return ff;
    }
  }];

  html += wrapToTr( [ generateLabelTd( 'Family', labelPrefix ),
          generateSelectListTd( getFontFamilyOptions(), properties.fontFamily, selectorPrefix, 'font-family', familyOptStyle ) ] );

  html += wrapToTr( [ generateLabelTd( 'Size', labelPrefix ),
          generateIntegerInputBoxTd( selectorPrefix, 'font-size', properties.fontSize ) ] );

  html += wrapToTr( [ generateLabelTd( 'Weight', labelPrefix  ),
          generateSelectListTd( getFontWeightOptions(), properties.fontWeight, selectorPrefix, 'font-weight' ) ] );

  html += wrapToTr( [ generateLabelTd( 'Type', labelPrefix ),
          generateSelectListTd( getFontStyleOptions(), properties.fontStyle, selectorPrefix, 'font-style' ) ] );

  html += wrapToTr( [ generateLabelTd( 'Color', labelPrefix ),
          generateColorInputBoxTd( selectorPrefix, 'font-color', properties.fontColor ) ] );

  return html;
}

function generateColorInputBoxTd(selectorPrefix, propName, value) {
  var id = generateInputId( propName, selectorPrefix );
  var html = '<input id="' + id + '"'
          + ' class="inspector-input-box"'
          + ' type="color"'
          + ' name="' + id + '"'
          + ' value="' + value +  '"'
          + '/>';

  return wrapToTd( html );
}

function generateIntegerInputBoxTd(selectorPrefix, propName, value) {
  var html = '<input id="' + generateInputId( propName, selectorPrefix ) + '"'
          + ' type="text"'
          + ' min="1"'
          + ' class="sbgn-input-small layout-text integer-input"'
          + ' value="' + value + '"'
          + '/>';

  return wrapToTd( html );
}

function generateInputId( propName, selectorPrefix, selectorPostfix ) {
  var pretext = selectorPrefix ? selectorPrefix + '-' : '';
  var posttext = selectorPostfix ? '-' + selectorPostfix : '';
  return pretext + propName + posttext;
}

function generateSelectBoxNameSelector( propName, selectorPrefix ) {
  var id = generateInputId( propName, selectorPrefix, 'select-box' );
  var selector = 'select[name="' + id + '"] option:selected';

  return selector;
}

function generateSelectListTd(options, selectedVal, selectorPrefix, propName, optionStyle) {
  var html = '';
  var selectboxId = generateInputId( propName, selectorPrefix, 'select-box' );
  var selectBoxOpenHtml = '<select id="' + selectboxId + '"'
    + ' class="input-medium layout-text"'
    + ' name="' + selectboxId + '"'
    + '>';

  html += selectBoxOpenHtml;

  var getSelectedStr = function( optionVal ) {
    return optionVal === selectedVal ? ' selected' : '';
  };

  options.forEach( function( option ) {
    var optionVal = option.value;
    var postfix = optionVal ? optionVal : 'none';
    postfix = sanitizeForHtml( postfix );
    var optionLabel = option.label;

    var styleStr = '';

    if ( optionStyle && optionStyle.length > 0 ) {
      var styleStr = ' style="';
      optionStyle.forEach( function( style ) {
        var val = typeof style.value == 'function' ?
                  style.value( optionVal ) : optionVal;
        styleStr += ( style.name + ': ' + val + ';' );
      } );
      styleStr += '"';
    }

    var optionId = generateInputId( propName, selectorPrefix, postfix );
    var optionHtml = '<option id="' + optionId + '"'
      + ' value="' + optionVal + '"'
      + styleStr
      + getSelectedStr( optionVal )
      + '>'
      + option.label
      + '</option>';

    html += optionHtml;
  } );

  html += '</select>';

  return wrapToTd( html );
}

function generateLabelTd(mainText, prefix, postfix) {
  prefix = prefix ? prefix + ' ' : '';
  postfix = postfix ? ' ' + postfix : '';
  label = prefix + mainText + postfix;

  return wrapToTd( '<span class="add-on layout-text">' + label + '</span>' );
}

function wrapToTd(innerHtml){
  var html = '<td>';
  html += innerHtml;
  html += '</td>';

  return html;
}

function wrapToTr(tdList) {
  var html = '<tr>';

  tdList.forEach( function( td ) {
    html += td;
  } );

  html += '</tr>';

  return html;
}

var FontPropertiesView = Backbone.View.extend({
  defaultFontProperties: {
    fontFamily: "",
    fontSize: "",
    fontWeight: "",
    fontStyle: "",
    fontColor: ""
  },
  currentFontProperties: undefined,
  selectorPrefix: 'font-properties',
  copyProperties: function () {
    this.currentFontProperties = _.clone(this.defaultFontProperties);
  },
  initialize: function () {
    var self = this;
    self.copyProperties();
    self.defaultFontProperties.generateFontPropertiesRows = function() {
      return generateFontPropertiesRows( self.selectorPrefix, '', self.currentFontProperties );
    };
    self.template = _.template($("#font-properties-template").html());
    self.template = self.template(self.defaultFontProperties);
  },
  extendProperties: function (eles) {

    var chiseInstance = appUtilities.getActiveChiseInstance();

    var self = this;
    var commonProperties = {};

    // Get common properties. Note that we check the data field for labelsize property and css field for other properties.
    var commonFontSize = parseInt(chiseInstance.elementUtilities.getCommonProperty(eles, "font-size", "data"));
    var commonFontWeight = chiseInstance.elementUtilities.getCommonProperty(eles, "font-weight", "data");
    var commonFontFamily = chiseInstance.elementUtilities.getCommonProperty(eles, "font-family", "data");
    var commonFontStyle = chiseInstance.elementUtilities.getCommonProperty(eles, "font-style", "data");
    var commonFontColor = chiseInstance.elementUtilities.getCommonProperty(eles, "color", "data");

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

    if (commonFontColor != null) {
      commonProperties.fontColor = commonFontColor;
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

      // use the active chise instance
      var chiseInstance = appUtilities.getActiveChiseInstance();

      // use the associated cy instance
      var cy = chiseInstance.getCy();

      var data = {};

      var fontsize = $( '#' + generateInputId( 'font-size', self.selectorPrefix ) ).val();
      var fontfamily = $( generateSelectBoxNameSelector( 'font-family', self.selectorPrefix ) ).val();
      var fontweight = $( generateSelectBoxNameSelector( 'font-weight', self.selectorPrefix ) ).val();
      var fontstyle = $( generateSelectBoxNameSelector( 'font-style', self.selectorPrefix ) ).val();
      var fontcolor = $( '#' + generateInputId( 'font-color', self.selectorPrefix ) ).val();

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

      if ( fontcolor != '') {
        data['color'] = fontcolor;
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

      chiseInstance.changeFontProperties(eles, data);

      self.copyProperties();


      $(self.el).modal('toggle');
	    $(document).trigger('saveFontProperties', cy);
    });

    return this;
  }
});

var InfoboxPropertiesView = Backbone.View.extend({
  currentProperties: null,
  initialize: function () {
  },
  propsMap: {
    'fontFamily': 'font-family',
    'fontSize': 'font-size',
    'fontWeight': 'font-weight',
    'fontStyle': 'font-style',
    'fontColor': 'font-color',
    'borderColor': 'border-color',
    'fillColor': 'background-color',
    'borderWidth': 'border-width',
    'shapeName': 'shape-name'
  },
  selectorPrefix: 'infobox-properties',
  fontLabelPrefix: 'Font ',
  updateCurrentProperties: function(infobox) {
    var self = this;
    var infoboxStyle = infobox.style;

    self.currentProperties = {};

    for ( var prop in this.propsMap ) {
      var mappedProp = this.propsMap[ prop ];
      self.currentProperties[ prop ] = infoboxStyle[ mappedProp ];
    }

    self.currentProperties.generateSelectShapeRow = function() {
      var chiseInstance = appUtilities.getActiveChiseInstance();
      var cy = appUtilities.getActiveCy();
      var elementUtilities = chiseInstance.elementUtilities;
      var parent = chiseInstance.classes.getAuxUnitClass(infobox).getParent(infobox, cy);
      var shapeListFcn;

      switch (infobox.clazz) {
        case 'state variable':
          shapeListFcn = elementUtilities.getStateVarShapeOptions;
          break;
        case 'unit of information':
          shapeListFcn = elementUtilities.getUnitOfInfoShapeOptions;
          break;
      }

      shapeList = shapeListFcn( parent.data( 'class' ) );

      if ( shapeList.length <= 1 ) {
        return "";
      }

      var options = [];

      shapeList.forEach( function( shapeName ) {
        options.push( {
          value: shapeName,
          label: shapeName
        } );
      } );

      return wrapToTr( [ generateLabelTd( 'Shape', null ),
              generateSelectListTd( options, self.currentProperties.shapeName, self.selectorPrefix, 'shape-name' ) ] );
    };

    self.currentProperties.generateFontPropertiesRows = function() {
      return generateFontPropertiesRows( self.selectorPrefix, self.fontLabelPrefix, self.currentProperties );
    };

    self.currentProperties.generateSetAsDefaultText = function() {
      var chiseInstance = appUtilities.getActiveChiseInstance();
      var cy = appUtilities.getActiveCy();
      var parent = chiseInstance.classes.getAuxUnitClass(infobox).getParent(infobox, cy);
      var classInfo = appUtilities.transformClassInfo( parent.data('class') );
      var infoboxInfoMap = {
        'state variable': 'State Variable',
        'unit of information': 'Unit of Information'
      };
      var infoboxInfo = infoboxInfoMap[ infobox.clazz ];

      return 'Set as Default for ' + infoboxInfo + ' of ' + classInfo;
    }
  },
  render: function (node, index) {
    var self = this;
    var infoboxObj = node.data('statesandinfos')[index];

    var inputTypes = {
      'font-size': 'regular',
      'font-family': 'selectbox',
      'font-weight': 'selectbox',
      'font-style': 'selectbox',
      'font-color': 'regular',
      'border-color': 'regular',
      'background-color': 'regular',
      'border-width': 'regular',
      'shape-name': 'selectbox'
    };

    self.updateCurrentProperties(infoboxObj);
    self.template = _.template($("#infobox-properties-template").html());
    self.template = self.template(self.currentProperties);
    $(self.el).html(self.template);

    $(self.el).modal('show');

    function readInfoboxProps() {
      var props = {};

      for ( prop in self.propsMap ) {
        var mappedProp = self.propsMap[ prop ];
        var val;

        if ( inputTypes[ mappedProp ] == 'regular' ) {
          val = $( '#' + generateInputId( mappedProp, self.selectorPrefix ) ).val();
        }
        else if ( inputTypes[ mappedProp ] == 'selectbox' ) {
          val = $( generateSelectBoxNameSelector( mappedProp, self.selectorPrefix ) ).val();
        }

        props[ mappedProp ] = val;
      }

      return props;
    }

    $(document).off("click", "#set-infobox-properties").on("click", "#set-infobox-properties", function( evt ) {
      var newProps = readInfoboxProps();

      appUtilities.getActiveChiseInstance().updateInfoboxStyle(node, index, newProps);

      $(self.el).modal('toggle');
    });

    $(document).off("click", "#set-as-default-infobox-properties").on("click", "#set-as-default-infobox-properties", function( evt ) {
      var chiseInstance = appUtilities.getActiveChiseInstance();
      var cy = appUtilities.getActiveCy();
      var parent = chiseInstance.classes.getAuxUnitClass(infoboxObj).getParent(infoboxObj, cy);
      var parentClass = parent.data('class');

      var updates = readInfoboxProps();
      var currentDefaults = chiseInstance.elementUtilities.getDefaultProperties( parentClass )[ infoboxObj.clazz ];
      var infoboxStyle = $.extend( {}, currentDefaults, updates );
      chiseInstance.setDefaultProperty( parentClass, infoboxObj.clazz, infoboxStyle );
    });
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
  ChemicalView: ChemicalView,
  LayoutPropertiesView: LayoutPropertiesView,
  ColorSchemeInspectorView: ColorSchemeInspectorView,
  MapTabGeneralPanel: MapTabGeneralPanel,
  MapTabLabelPanel: MapTabLabelPanel,
  MapTabRearrangementPanel: MapTabRearrangementPanel,
  //GeneralPropertiesView: GeneralPropertiesView,
  NeighborhoodQueryView: NeighborhoodQueryView,
  PathsBetweenQueryView: PathsBetweenQueryView,
  PathsFromToQueryView: PathsFromToQueryView,
  CommonStreamQueryView: CommonStreamQueryView,
  PathsByURIQueryView: PathsByURIQueryView,
  PromptSaveView: PromptSaveView,
  FileSaveView: FileSaveView,
  PromptConfirmationView: PromptConfirmationView,
  PromptMapTypeView: PromptMapTypeView,
  PromptInvalidFileView: PromptInvalidFileView,
  PromptFileConversionErrorView: PromptFileConversionErrorView,
  ReactionTemplateView: ReactionTemplateView,
  GridPropertiesView: GridPropertiesView,
  FontPropertiesView: FontPropertiesView,
  InfoboxPropertiesView: InfoboxPropertiesView,
  AnnotationListView: AnnotationListView,
  AnnotationElementView: AnnotationElementView,
  PromptInvalidURIView: PromptInvalidURIView,
  PromptInvalidURIWarning: PromptInvalidURIWarning,
  PromptInvalidURLWarning: PromptInvalidURLWarning,
  PromptInvalidImageWarning: PromptInvalidImageWarning,
  PromptInvalidEdgeWarning: PromptInvalidEdgeWarning,
};
