var appUtilities = require('./app-utilities');
var inspectorUtilities = {};
var fillBioGeneContainer = require('./fill-biogene-container');
var fillChemicalContainer = require('./fill-chemical-container');
var annotHandler = require('./annotations-handler');
var modeHandler = require('./app-mode-handler');
const colorPickerUtils = require('./color-picker-utils');

inspectorUtilities.updateInputBoxesFromSet = function( ele, fieldName, parentSelector, subId, width ) {

  var set = ele.data( fieldName );

  if ( !set ) {
    return;
  }

  var callback = function() {
    inspectorUtilities.updateInputBoxesFromSet( ele, fieldName, parentSelector, subId, width );
  };

  var chiseInstance = appUtilities.getActiveChiseInstance();

  var keys = Object.keys( set );
  var parentComponent = $( parentSelector );
  parentComponent.html('');

  keys.forEach( function( key, i ) {
    ( function( key, i ) {
      var id = "inspector-" + subId + "-" + i;
      var delId = "inspector-delete-" + subId + "-" + i;
      var memberHtml = "<div>";

      memberHtml += "<input"
          + " type='text'"
          + " id='" + id + "'"
          + " class='inspector-input-box'"
          + " style='width: " + width * 0.9 + "px;'"
          + " value='" + key + "'"
          + "/>";

      memberHtml += "<img"
          + " width='16px'"
          + " height='16px'"
          + " id='" + delId + "'"
          + " class='pointer-button'"
          + " src='app/img/toolbar/delete-simple.svg'"
          + ">"
          + "</img>";

      memberHtml += "</div>";

      parentComponent.append( memberHtml );

      $( '#' + delId ).unbind('click').click(function (event) {
        var oldVal = key;
        chiseInstance.updateSetField( ele, fieldName, oldVal, null, callback );
      });

      $( '#' + id ).unbind('change').on('change', function () {
        var oldVal = key;
        var newVal = $(this).val();
        chiseInstance.updateSetField( ele, fieldName, oldVal, newVal, callback );
      });
    })( key, i );
  } );

  var addId = "inspector-add-" + subId;
  parentComponent.append( "<img width='16px' height='16px' id='" + addId + "' src='app/img/add.svg' class='pointer-button'/>" );

  $( '#' + addId ).unbind('click').click(function (event) {
    chiseInstance.updateSetField( ele, fieldName, null, '', callback );
  });
};

inspectorUtilities.updatePCIDs = function(ele, width) {
  inspectorUtilities.updateInputBoxesFromSet( ele, 'pcIDSet', '#inspector-pc-ids', 'pc-ids', width );
};

inspectorUtilities.updateSiteLocations = function(ele, width) {
  inspectorUtilities.updateInputBoxesFromSet( ele, 'siteLocSet', '#inspector-site-locations', 'site-locations', width );
};

inspectorUtilities.fillInspectorStateAndInfos = function (nodes, stateAndInfos, width) {

  // use the active chise instance
  var chiseInstance = appUtilities.getActiveChiseInstance();

  // get the associated cy instance
  var cy = chiseInstance.getCy();

  //first empty the state variables and infos data in inspector
  $("#inspector-state-variables").html("");
  $("#inspector-unit-of-informations").html("");

  function get_text_width(txt, font) {
    this.element = document.createElement('canvas');
    this.context = this.element.getContext("2d");
    this.context.font = font;
    return this.context.measureText(txt).width;
  };

  function sanitizeInfoboxVal(value) {
    return (value || '').toString().replace(/'/g, "&#039;");
  }

  function getInfoboxDetailsBtnHtml(index) {
    var html = "<label id='inspector-infobox-" + index + "' style='cursor: pointer;font: 10pt Helvetica; font-weight:bold !important; margin:5px !important;'>" + "..." + "</label>";

    return html;
  }

  for (var i = 0; i < stateAndInfos.length; i++) {
    (function(i){
      var state = stateAndInfos[i];
      if (state.clazz == "state variable") {
        $("#inspector-state-variables").append(
            "<div>"
            // state variable - value
            + "<input type='text' id='inspector-state-variable-value" + i + "' class='inspector-input-box' style='width: "
            + width / 5 + "px;' value='" + sanitizeInfoboxVal(state.state.value) + "'/>"

            + "<span style='font: 10pt Helvetica;'>@</span>"

            // state variable - variable
            + "<input type='text' id='inspector-state-variable-variable" + i + "' class='inspector-input-box' style='width: "
            + width / 2.5 + "px;' value='" + sanitizeInfoboxVal(state.state.variable) + "'/>"

            + getInfoboxDetailsBtnHtml( i )

            + "<img width='16px' height='16px' id='inspector-delete-state-and-info" + i + "' class='pointer-button' src='app/img/toolbar/delete-simple.svg'></img>"
            + "</div>"
        );

        $("#inspector-state-variable-value" + i).unbind('change').on('change', function () {
          chiseInstance.changeStateOrInfoBox(nodes, i, $(this).val(), 'value');
        });

        $("#inspector-state-variable-variable" + i).unbind('change').on('change', function () {
          chiseInstance.changeStateOrInfoBox(nodes, i, $(this).val(), 'variable');
        });
      }
      else if (state.clazz == "unit of information") {

        var total = 0.6 * width + get_text_width("@", "10pt Helvetica");

        var uioHtml = "<div><input type='text' id='inspector-unit-of-information-label" + i + "' class='inspector-input-box' style='width: "
                + total + "px;' value='" + sanitizeInfoboxVal(state.label.text) + "'/>";

        uioHtml += getInfoboxDetailsBtnHtml( i );

        if (chiseInstance.elementUtilities.canHaveMultipleUnitOfInformation(nodes)) {
          uioHtml += "<img width='16px' height='16px' id='inspector-delete-state-and-info"
                + i + "' class='pointer-button' src='app/img/toolbar/delete-simple.svg'></img>";
        }

        uioHtml += "</div>";

        $('#inspector-unit-of-informations').append( uioHtml );

        $("#inspector-unit-of-information-label" + i).unbind('change').on('change', function () {
          chiseInstance.changeStateOrInfoBox(nodes[0], i, $(this).val());
        });
      }

      $("#inspector-delete-state-and-info" + i).unbind('click').click(function (event) {
        chiseInstance.removeStateOrInfoBox(nodes, i);
        inspectorUtilities.handleSBGNInspector();
      });

      $("#inspector-infobox-" + i).unbind('click').on('click', function () {
        appUtilities.infoboxPropertiesView.render( nodes, i );
      });
    })(i);
  }
  $("#inspector-state-variables").append("<img width='16px' height='16px' id='inspector-add-state-variable' src='app/img/add.svg' class='pointer-button'/>");

  if (chiseInstance.elementUtilities.canHaveMultipleUnitOfInformation(nodes)){
    $("#inspector-unit-of-informations").append("<img width='16px' height='16px' id='inspector-add-unit-of-information' src='app/img/add.svg' class='pointer-button'/>");
  };
  $("#inspector-add-state-variable").click(function () {

    var obj = appUtilities.getDefaultEmptyInfoboxObj( 'state variable' );

    chiseInstance.addStateOrInfoBox(nodes, obj);
    inspectorUtilities.handleSBGNInspector();
  });

  $("#inspector-add-unit-of-information").click(function () {

    var obj = appUtilities.getDefaultEmptyInfoboxObj( 'unit of information' );

    chiseInstance.addStateOrInfoBox(nodes, obj);
    inspectorUtilities.handleSBGNInspector();
  });
}

inspectorUtilities.handleSBGNInspector = function () {

  // use the active chise instance
  var chiseInstance = appUtilities.getActiveChiseInstance();

  // get the associated cy instance
  var cy = chiseInstance.getCy();

  var selectedEles = cy.elements(":selected");

  $("#sbgn-inspector-style-panel-group").html("");

  if(selectedEles.length == 0){
    return;
  }

  var width = $("#sbgn-inspector").width() * 0.45;

  var allNodes = chiseInstance.elementUtilities.trueForAllElements(selectedEles, function(ele) {
    return ele.isNode();
  });
  var allEdges = chiseInstance.elementUtilities.trueForAllElements(selectedEles, function(ele) {
    return ele.isEdge();
  });

  if (allNodes || allEdges) {
    var sbgnlabel = chiseInstance.elementUtilities.getCommonProperty(selectedEles, "label", "data");
    if (sbgnlabel == null) {
      sbgnlabel = "";
    } else if (sbgnlabel.includes("\n")) {
      sbgnlabel = sbgnlabel.replace(new RegExp("\n", "g"), " \\n ");
    }

    var classInfo = chiseInstance.elementUtilities.getCommonProperty(selectedEles, function(ele) {
      return ele.data('class').replace(' multimer', '');
    }) || "";

    classInfo = appUtilities.transformClassInfo( classInfo );

    var title = classInfo=="" ? "Visual Properties":classInfo + " Visual Properties";

    var buttonwidth = width;
    if (buttonwidth > 50) {
      buttonwidth = 50;
    }

    var html = "";

    html += "<div  class='panel-heading' data-toggle='collapse' data-target='#inspector-style-properties-toggle'><p class='panel-title accordion-toggle'>" + title + "</p></div>"

    html += "<div id='inspector-style-properties-toggle' class='panel-collapse collapse in'>";
    html += "<div class='panel-body'>";
    html += "<table cellpadding='0' cellspacing='0' width='100%' align= 'center'>";
    var type;
    var fillStateAndInfos;
    var fillPCIDs;
    var fillSiteLocations;
    var multimerCheck;
    var clonedCheck;
    var commonIsMultimer;
    var commonIsCloned;
    var commonStateAndInfos;
    var commonSBGNCardinality;
    var imageFromURL;
    var imageURL;

    if (allNodes) {
      type = "node";

      var borderColor = chiseInstance.elementUtilities.getCommonProperty(selectedEles, "border-color", "data");
      borderColor = borderColor?borderColor:'#FFFFFF';

      var backgroundColor = chiseInstance.elementUtilities.getCommonProperty(selectedEles, "background-color", "data");
      backgroundColor = backgroundColor?backgroundColor:'#FFFFFF';

      var borderWidth = chiseInstance.elementUtilities.getCommonProperty(selectedEles, "border-width", "data");

      var backgroundOpacity = chiseInstance.elementUtilities.getCommonProperty(selectedEles, "background-opacity", "data");
      if(!backgroundOpacity && backgroundOpacity !== 0)
        backgroundOpacity = 0;

      var nodeWidth = chiseInstance.elementUtilities.getCommonProperty(selectedEles, function(ele) {
        return ele.width();
      });

      var nodeHeight = chiseInstance.elementUtilities.getCommonProperty(selectedEles, function(ele) {
        return ele.height();
      });

      if (chiseInstance.elementUtilities.trueForAllElements(selectedEles, chiseInstance.elementUtilities.canHaveSBGNLabel)) {
        html += "<tr><td style='width: " + width + "px; text-align:right; padding-right: 5px;'>" + "<font class='sbgn-label-font'>Label</font>" + "</td><td style='padding-left: 5px;'>"
              + "<textarea id='inspector-label'  cols='8' rows='1' style='min-width: " + width / 1.5 + "px;' class='inspector-input-box'>" + sbgnlabel.replace(/'/g, "&#039;") 
              + "</textarea>" + "</td></tr>";
      }

      // if at least one node is a parent node don't show width and height editing fields
      if( selectedEles.filter(':parent').length < 1 ) {
        html += "<tr><td style='width: " + width + "px; text-align:right; padding-right: 5px;'>" + "<font class='sbgn-label-font'>Width</font>" + "</td><td style='padding-left: 5px;'>"
                + "<input id='inspector-node-width' class='inspector-input-box' type='number' min='0' style='width: " + buttonwidth + "px;'";

        if (nodeWidth) {
          html += " value='" + parseFloat(nodeWidth.toFixed(2)) + "'";
        }

        html += "/>" + "</td></tr>";

        html += "<tr><td style='width: " + width + "px; text-align:right; padding-right: 5px;'>" + "<font class='sbgn-label-font'>Height</font>" + "</td><td style='padding-left: 5px;'>"
                + "<input id='inspector-node-height' class='inspector-input-box' type='number' min='0' style='width: " + buttonwidth + "px;'";

        if (nodeHeight) {
          html += " value='" + parseFloat(nodeHeight.toFixed(2)) + "'";
        }

        html += "/>";

        if( chiseInstance.elementUtilities.someMustNotBeSquare(selectedEles) ) {
          var imageName;
          var title;
          if(appUtilities.nodeResizeUseAspectRatio) {
            imageName = "lock.svg";
            title = "Unlock aspect ratio";
          }
          else {
            imageName = "open-lock.svg";
            title = "Lock aspect ratio";
          }

          html += "<img width='16px' height='16x' id='inspector-node-sizes-aspect-ratio' style='vertical-align: top; margin-left: 5px;' class='pointer-button' src='app/img/";
          html += imageName;
          html += "'";

          html += "title='";
          html += title;
          html += "'";

          html += "></img>";
        }

        html += "</td></tr>";
      }

      // borderColor = '#555555';
      html += `<tr><td style='width: ${width}px; text-align:right; padding-right: 5px;'> <font class='sbgn-label-font'>Border Color</font> </td><td style='padding-left: 5px;'>
      <input id='inspector-border-color' class='inspector-input-box' type='color' style='width: ${buttonwidth}px;' value='${borderColor}'/>
      </td></tr>`;
      html += `<tr><td style='width: ${width} px; text-align:right; padding-right: 5px;'><font class='sbgn-label-font'>Fill Color</font></td><td style='padding-left: 5px;'>
      <input id='inspector-fill-color' class='inspector-input-box' type='color' style='width: ${buttonwidth}px;' value='${backgroundColor}'/>
      </td></tr>`;
      html += "<tr><td style='width: " + width + "px; text-align:right; padding-right: 5px;'>" + "<font class='sbgn-label-font'>Border Width</font>" + "</td><td style='padding-left: 5px;'>"
        + "<input id='inspector-border-width' class='inspector-input-box' type='number' min='0' style='width: " + buttonwidth + "px;'";

      if (borderWidth) {
        html += " value='" + parseFloat(borderWidth) + "'";
      }

      html += "/>" + "</td></tr>";
      const bgOpacity = parseFloat(backgroundOpacity);
      html += `<tr><td style='width: ${width}px; text-align:right; padding-right: 5px;'> <font class='sbgn-label-font'>Fill Opacity</font> </td><td style='padding-left: 5px;'>
      <input id='inspector-background-opacity' class='inspector-input-box' type='range' step='0.01' min='0' max='1' style='width: ${buttonwidth}px; display: inline;' value='${bgOpacity}'/>
      <input id='inspector-background-opacity-val' class='inspector-input-box' type='number' value='${bgOpacity}' style="width: 50px; display: inline; margin-left: 5px;" />
      </td></tr>`;

      if (chiseInstance.elementUtilities.trueForAllElements(selectedEles, chiseInstance.elementUtilities.canHaveSBGNLabel)) {
        html += "<tr><td style='width: " + width + "px; text-align:right; padding-right: 5px;'>" + "<font class='sbgn-label-font'>Font</font>" + "</td><td style='padding-left: 5px;'>"
              + "<label id='inspector-font' style='cursor: pointer;width: " + buttonwidth + "px;'>"
              + "..." + "<label/>" + "</td></tr>";
      }

      if(selectedEles.length > 0){

        var hasBackgroundImage = chiseInstance.elementUtilities.anyHasBackgroundImage(selectedEles);
        var display = hasBackgroundImage ? "" : 'display: none;';

        var removeBtn = "<img id='inspector-delete-bg' width='16px' height='16px' class='pointer-button' "
                      + 'style="' + display + '"'
                      + "src='app/img/toolbar/delete-simple.svg'>";

        var options = '<option value="none">None</option>'
                    + '<option value="fit" selected>Fit</option>'
                    + '<option value="cover">Cover</option>'
                    + '<option value="contain">Contain</option>';

        if(hasBackgroundImage){
          var tmp = chiseInstance.elementUtilities.getBackgroundFitOptions(selectedEles);
          options = tmp ? tmp : options;
        }

        var fitSelection = '<select id="inspector-fit-selector" style="margin-right: 3px; margin-bottom: 2px;'
                        + display + '">'
                        + options
                        + '</select>';

        html += "<tr><td style='width: " + width + "px; text-align:right; padding-right: 5px;'>" + "<font class='sbgn-label-font'>Image</font>" + "</td><td style='padding-left: 5px;'>"
              + "<div><button id='inspector-image-file' class='btn btn-default' style='width: "
              + width / 1.5 + "px;padding:2px;margin-bottom:2px;padding-bottom=0.5px;padding-top=0.5px;'>Choose...</button>"
              + "<input id='inspector-image-url' class='inspector-input-box' type='text' style='display: none; width: " + width / 1.5 + "px;' placeholder='Enter a URL...'/>"
              + "<label class='sbgn-label-font' style='font-weight: initial;'>"
              + "<input type='checkbox' id='inspector-image-from-url' style='margin: 0px 1px 0px 5px; vertical-align:text-bottom;'>URL</label>"
              + fitSelection
              + removeBtn
              + "</td></tr><input id='inspector-image-load' type='file' style='display:none;'>";
      }

      commonStateAndInfos = chiseInstance.elementUtilities.getCommonProperty(selectedEles, "statesandinfos", "data");

      if(commonStateAndInfos){
        if (chiseInstance.elementUtilities.trueForAllElements(selectedEles, chiseInstance.elementUtilities.canHaveStateVariable)) {
          fillStateAndInfos = true;

          html += "<tr><td colspan='2'><hr class='inspector-divider'></td></tr>";
          html += "<tr><td style='width: " + width + "px; text-align:right; padding-right: 5px;'>" + "<font class='sbgn-label-font'>State Variables</font>" + "</td>"
                  + "<td id='inspector-state-variables' style='padding-left: 5px; width: '" + width + "'></td></tr>";
        }

        if (chiseInstance.elementUtilities.canHaveUnitOfInformation(selectedEles)) {
          fillStateAndInfos = true;

          var unit = chiseInstance.elementUtilities.canHaveMultipleUnitOfInformation(selectedEles) ? "Units" : "Unit";
          html += "<tr><td colspan='2'><hr class='inspector-divider'></td></tr>";
          html += "<tr><td style='width: " + width + "px; text-align:right; padding-right: 5px;'>" + "<font class='sbgn-label-font'>" + unit + " of Information</font>" + "</td>"
                  + "<td id='inspector-unit-of-informations' style='padding-left: 5px; width: '" + width + "'></td></tr>";
        }
      }

      commonIsMultimer = chiseInstance.elementUtilities.getCommonProperty(selectedEles, function(ele){
        return ele.data('class').endsWith(' multimer');
      });
      commonIsCloned = chiseInstance.elementUtilities.getCommonProperty(selectedEles, function(ele){
        return ele.data('clonemarker') === true;
      });

      multimerCheck = chiseInstance.elementUtilities.trueForAllElements(selectedEles, chiseInstance.elementUtilities.canBeMultimer);
      clonedCheck = chiseInstance.elementUtilities.trueForAllElements(selectedEles, chiseInstance.elementUtilities.canBeCloned);

      multimerCheck = multimerCheck?multimerCheck:false;
      clonedCheck = clonedCheck?clonedCheck:false;

      if (multimerCheck || clonedCheck) {
        html += "<tr><td colspan='2'><hr class='inspector-divider'></td></tr>";
      }

      if (multimerCheck) {
        html += "<tr><td style='width: " + width + "px; text-align:right; padding-right: 5px;'>" + "<font class='sbgn-label-font'>Multimer</font>" + "</td>"
                + "<td style='padding-left: 5px; width: '" + width + "'><input type='checkbox' id='inspector-is-multimer'></td></tr>";
      }

      if (clonedCheck) {
        html += "<tr><td style='width: " + width + "px; text-align:right; padding-right: 5px;'>" + "<font class='sbgn-label-font'>Cloned</font>" + "</td>"
                + "<td style='padding-left: 5px; width: '" + width + "'><input type='checkbox' id='inspector-is-clone-marker'></td></tr>";
      }

      /*
       * If all selected elements can have ports add a selectbox to enable setting their ports ordering.
       */
      if ( chiseInstance.elementUtilities.trueForAllElements(selectedEles, chiseInstance.elementUtilities.canHavePorts.bind(chiseInstance.elementUtilities)) ) {
        html += "<tr><td style='width: " + width + "px; text-align:right; padding-right: 5px;'>" + "<font class='sbgn-label-font'>Ports</font>" + "</td>"
                + "<td style='padding-left: 5px; width: '" + width + "'>";

        html += "<select id='inspector-ports-ordering-select' class='input-medium layout-text' name='inspector-ports-ordering-select'>";

        var optionsStr = "";

        // Get the common ordering of the nodes
        var commonOrdering = chiseInstance.elementUtilities.getCommonProperty(selectedEles, function(ele) {
          return chiseInstance.elementUtilities.getPortsOrdering(ele);
        });

        var commonOrderingVal = commonOrdering || "empty"; // If there is no common ordering we should use "empty" for common ordering value

        var orderings = ["", "None", "Left-to-right", "Right-to-left", "Top-to-bottom", "Bottom-to-top"]; // The orderings to be displayed on screen
        var values = ["empty", "none", "L-to-R", "R-to-L", "T-to-B", "B-to-T"]; // The values for the orderings

        // For all possible values create an option str and append it to options str
        for ( var i = 0; i < orderings.length; i++ ) {
          var ordering = orderings[i];
          var optionVal = values[i];
          var optionId = "inspector-ports-ordering-" + optionVal; // Option id is generated from option value
          var optionStr = "<option id='" + optionId + "'"
                  + " value='" + optionVal + "'";

          if ( optionVal === commonOrderingVal ) {
            optionStr += " selected";
          }

          optionStr += "> ";
          optionStr += ordering;
          optionStr += " </option>";

          optionsStr += optionStr;
        }

        html += optionsStr; // The string to represent this option in selectbox

        html += "</select>";

        html += "</td></tr>";
      }
    }
    else {
      type = "edge";

      var commonLineColor = chiseInstance.elementUtilities.getCommonProperty(selectedEles, "line-color", "data");
      commonLineColor = commonLineColor?commonLineColor:'#FFFFFF';

      var commonLineWidth = chiseInstance.elementUtilities.getCommonProperty(selectedEles, "width", "data");

      html += "<tr><td style='width: " + width + "px; text-align:right; padding-right: 5px;'>" + "<font class='sbgn-label-font'>Fill Color</font>" + "</td><td style='padding-left: 5px;'>"
          + "<input id='inspector-line-color' class='inspector-input-box' type='color' style='width: " + buttonwidth + "px;' value='" + commonLineColor
          + "'/>" + "</td></tr>";

      html += "<tr><td style='width: " + width + "px; text-align:right; padding-right: 5px;'>" + "<font class='sbgn-label-font'>Width</font>" + "</td><td style='padding-left: 5px;'>"
          + "<input id='inspector-edge-width' class='inspector-input-box' type='number' min='0' style='width: " + buttonwidth + "px;'";
      if(commonLineWidth){
          html += " value='" + parseFloat(commonLineWidth) + "'";
      }
      html += "/>" + "</td></tr>";

      if (chiseInstance.elementUtilities.canHaveSBGNCardinality(selectedEles)) {
        var cardinality = chiseInstance.elementUtilities.getCommonProperty(selectedEles, "cardinality", "data");
        commonSBGNCardinality = cardinality;

        if (cardinality <= 0) {
          cardinality = undefined;
        }
        html += "<tr><td style='width: " + width + "px; text-align:right; padding-right: 5px;'>" + "<font class='sbgn-label-font'>Cardinality</font>" + "</td><td style='padding-left: 5px;'>"
                + "<input id='inspector-cardinality' class='inspector-input-box integer-input' type='text' min='0' style='width: " + buttonwidth + "px;'";

        if(cardinality != null) {
          html += "value='" + cardinality + "'/>";
        }

        html += "</td></tr>";
      }

      var sbgnclass = selectedEles.data('class');
      if (selectedEles.length === 1 && ( sbgnclass == 'phosphorylates' || sbgnclass == 'dephosphorylates' )) {
        fillPCIDs = true;
        fillSiteLocations = true;

        html += "<tr><td colspan='2'><hr class='inspector-divider'></td></tr>";

        html += "<tr><td style='width: " + width + "px; text-align:right; padding-right: 5px;'>" + "<font class='sbgn-label-font'>PC IDs</font>" + "</td>"
                + "<td id='inspector-pc-ids' style='padding-left: 5px; width: '" + width + "'>"
                // + inspectorUtilities.generateSetToInputBoxes( selectedEles.data('pcIDSet'), 'pc-ids', 0.8 * width )
                + "</td></tr>";

        html += "<tr><td colspan='2'><hr class='inspector-divider'></td></tr>";

        html += "<tr><td style='width: " + width + "px; text-align:right; padding-right: 5px;'>" + "<font class='sbgn-label-font'>Site Locations</font>" + "</td>"
                + "<td id='inspector-site-locations' style='padding-left: 5px; width: '" + width + "'>"
                // + inspectorUtilities.generateSetToInputBoxes( selectedEles.data('siteLocSet'), 'site-locations', 0.8 * width )
                + "</td></tr>";

        html += "<tr><td colspan='2'><hr class='inspector-divider'></td></tr>";
      }

    }
    html += "</table></div>";

    if(selectedEles.length == 1){
      var setAsDefaultTitle = "Set as Default for " + classInfo;
      html += "<div style='text-align: center; margin-top: 5px;'><button class='btn btn-default' style='align: center;' id='inspector-set-as-default-button'"
            + ">" + setAsDefaultTitle + "</button></div>";
    }

    // html += "<hr class='inspector-divider' style='border-width: 3px;'>";
    html += "</div>";

    $('#sbgn-inspector-style-panel-group').append('<div id="sbgn-inspector-style-properties-panel" class="panel" ></div>');
    $("#sbgn-inspector-style-properties-panel").html(html);

    colorPickerUtils.bindPicker2Input('#inspector-fill-color', function() {
      chiseInstance.changeData(selectedEles, 'background-color', $('#inspector-fill-color').val());
    });
    colorPickerUtils.bindPicker2Input('#inspector-border-color', function() {
      chiseInstance.changeData(selectedEles, 'border-color', $('#inspector-border-color').val());
    });
    colorPickerUtils.bindPicker2Input('#inspector-line-color', function() {
      chiseInstance.changeData(selectedEles, "line-color", $("#inspector-line-color").val());
    });

    if (selectedEles.length === 1) {
      var geneClass = selectedEles[0]._private.data.class;

      function addCollapsibleSection(identifier, title, hasSubtitleSection, openByDefault) {

        var panelHeadingClass = openByDefault ? "panel-heading" : "panel-heading collapsed";
        var panelHeadingId = identifier + "-heading";
        var collapsibleClass = openByDefault ? "panel-collapse collapse in" : "panel-collapse collapse";
        var collapsibleId = identifier + "-collapsible";

        html = "<div id='" + panelHeadingId + "' class='" + panelHeadingClass +"' data-toggle='collapse' data-target='#"+ collapsibleId + "'>" +
               "<p class='panel-title accordion-toggle'>" + title + "</p> </div>" +
               "<div style='margin-top: 5px;align: center;text-align: center;'" + 
               " id='" + collapsibleId + "' class='" + collapsibleClass + "'>";

        if (hasSubtitleSection) {
          html += "<div class='panel-body' style='padding-top: 3px; padding-left: 3px;' id='"+identifier+"-title'></div>";
        }
        html += "<div id='"+identifier+"-container'></div>"+
                "</div>";

        $('#sbgn-inspector-style-panel-group').append('<div id="sbgn-inspector-style-'+identifier+'-panel" class="panel" ></div>');
        $("#sbgn-inspector-style-"+identifier+"-panel").html(html);
      }

      if (geneClass === 'macromolecule' || geneClass === 'nucleic acid feature' ||
          geneClass === 'unspecified entity' || geneClass === 'BA plain' || 
          geneClass === 'BA macromolecule' || geneClass === 'BA nucleic acid feature' ||
          geneClass === 'BA unspecified entity' || geneClass === 'SIF macromolecule') {

          addCollapsibleSection("biogene", "Properties from GeneCards", true, true);
          fillBioGeneContainer(selectedEles[0]);
      }
      if (geneClass === 'simple chemical' || geneClass === 'BA simple chemical' || geneClass === 'SIF simple chemical')
      {
          addCollapsibleSection("chemical", "Properties from ChEBI", true, false);
          fillChemicalContainer(selectedEles[0], function () { //callback on successful fetch, auto open collapsed panel
            $("#chemical-collapsible").removeClass("collapse");
            $("#chemical-collapsible").addClass("collapse in");
            $("#chemical-heading").removeClass("collapsed");
          });
      }
     
      
      // annotations handling part
      addCollapsibleSection("annotations", "Custom Properties", false, false);
      annotHandler.fillAnnotationsContainer(selectedEles[0]);
    }

    if (type == "node") {
      if (fillStateAndInfos) {
        inspectorUtilities.fillInspectorStateAndInfos(selectedEles, commonStateAndInfos, width);
      }

      if (multimerCheck && commonIsMultimer) {
        $('#inspector-is-multimer').attr('checked', true);
      }

      if (clonedCheck && commonIsCloned) {
        $('#inspector-is-clone-marker').attr('checked', true);
      }

      if(imageFromURL){
        $('#inspector-image-from-url').attr('checked', true);
      }

      function updateBackgroundDeleteInfo(){
        var hasBackgroundImage = chiseInstance.elementUtilities.anyHasBackgroundImage(selectedEles);

        if(!hasBackgroundImage){
          $('#inspector-delete-bg').hide();
          $('#inspector-fit-selector').hide();
          $('#inspector-image-url').val('');
        }
        else{
          $('#inspector-delete-bg').show();
          $('#inspector-fit-selector').show();
          imageURL = chiseInstance.elementUtilities.getBackgroundImageURL(selectedEles);
          imageURL = imageURL ? imageURL : "";
          $('#inspector-image-url').val(imageURL);
        }
      }

      function promptInvalidImage(msg){
        appUtilities.promptInvalidImageWarning.render(msg);
      }

      $('#inspector-image-from-url').on('click', function() {
        imageFromURL = !imageFromURL;
        if(imageFromURL){
          imageURL = chiseInstance.elementUtilities.getBackgroundImageURL(selectedEles);
          imageURL = imageURL ? imageURL : "";

          $('#inspector-image-url').val(imageURL);
          $('#inspector-image-url').show();
          $('#inspector-image-file').hide();
        }
        else{
          $('#inspector-image-url').hide();
          $('#inspector-image-file').show();
        }
      });

      $('#inspector-delete-bg').on('click', function () {
        var bgObj = chiseInstance.elementUtilities.getBackgroundImageObjs(selectedEles);
        chiseInstance.removeBackgroundImage(selectedEles, bgObj);
        updateBackgroundDeleteInfo();
      });

      $('#inspector-fit-selector').on('change', function () {
        var fit = $("#inspector-fit-selector").val();
        if(!fit){
          return;
        }

        var bgObj = chiseInstance.elementUtilities.getBackgroundImageObjs(selectedEles);
        if(bgObj === undefined){
          return;
        }

        var bgWidth = "auto";
        var bgHeight = "auto";
        var bgFit = "none";

        if(fit === "fit"){
          bgWidth = "100%";
          bgHeight = "100%";
          bgFit = "none"
        }
        else if(fit){
          bgFit = fit;
        }

        selectedEles.forEach(function(ele){
          if(bgObj[ele.data('id')]){
            var obj = bgObj[ele.data('id')];
            obj['background-fit'] = bgFit;
            obj['background-width'] = bgWidth;
            obj['background-height'] = bgHeight;
          }
        });

        chiseInstance.updateBackgroundImage(selectedEles, bgObj);
        updateBackgroundDeleteInfo();
      });

      function validateBgImageURL(node, bgObj, applyBackground, promptInvalidImage){
        var url = bgObj['background-image'];
        var extension = (url.split(/[?#]/)[0]).split(".").pop();
        var validExtensions = ["png", "svg", "jpg", "jpeg"];

        if(!validExtensions.includes(extension)){
          if(typeof promptInvalidImage === 'function')
            promptInvalidImage("Invalid URL is given!");
          return;
        }

        $.ajax({
          url: "/utilities/testURL",
          type: 'GET',
          data: {url: url},
          success: function(data){
            console.log(data);
            // here we can get 404 as well, for example, so there are still error cases to handle
            if (!data.error && data.response.statusCode == 200 && typeof applyBackground === 'function')
              applyBackground(node, bgObj);
            else if(typeof promptInvalidImage === 'function')
              promptInvalidImage("Invalid URL is given!");
          },
          error: function(jqXHR, status, error) {
            if(typeof promptInvalidImage === 'function')
              promptInvalidImage("Invalid URL is given!");
          }
        });
      }

      $("#inspector-image-url").on('change', function () {
        var url = $(this).val().trim();
        imageURL = chiseInstance.elementUtilities.getBackgroundImageURL(selectedEles);

        if (url && imageURL !== url){
          var fit = $("#inspector-fit-selector").val();
          var bgWidth = "auto";
          var bgHeight = "auto";
          var bgFit = "none";

          if(fit === "fit"){
            bgWidth = "100%";
            bgHeight = "100%";
            bgFit = "none"
          }
          else if(fit)
            bgFit = fit;

          var bgObj = {
            'background-image' : url,
            'background-fit' : bgFit,
            'background-image-opacity' : '1',
            'background-position-x' : '50%',
            'background-position-y' : '50%',
            'background-width' : bgWidth,
            'background-height' : bgHeight,
            'fromFile' : false
          };

          var obj = {};
          for(var i = 0; i < selectedEles.length; i++){
            var node = selectedEles[i];
            if(node.isNode()){
                bgObj['background-image-opacity'] = node.data('background-opacity');
                obj[node.data('id')] = bgObj;
            }

          }

          // If there is a background image change it, don't add
          var oldObj = chiseInstance.elementUtilities.getBackgroundImageObjs(selectedEles);
          if(oldObj !== undefined)
            chiseInstance.changeBackgroundImage(selectedEles, oldObj, obj, updateBackgroundDeleteInfo, promptInvalidImage, validateBgImageURL);
          else
            chiseInstance.addBackgroundImage(selectedEles, obj, updateBackgroundDeleteInfo, promptInvalidImage, validateBgImageURL);
        }
      });

      $("#inspector-image-file").on('click', function () {
        $('#inspector-image-load').trigger('click');
      });

      $('#inspector-image-load').on('change', function (e, fileObject) {

        if ($(this).val() != "" || fileObject) {
          var file = this.files[0] || fileObject;
          var fit = $("#inspector-fit-selector").val();
          var bgWidth = "auto";
          var bgHeight = "auto";
          var bgFit = "none";

          if(fit === "fit"){
            bgWidth = "100%";
            bgHeight = "100%";
            bgFit = "none"
          }
          else if(fit){
            bgFit = fit;
          }

          var bgObj = {
            'background-image' : file,
            'background-fit' : bgFit,
            'background-image-opacity' : '1',
            'background-position-x' : '50%',
            'background-position-y' : '50%',
            'background-width' : bgWidth,
            'background-height' : bgHeight,
            'fromFile' : true
          };

          var obj = {};
          for(var i = 0; i < selectedEles.length; i++){
            var node = selectedEles[i];
            if(node.isNode()){
              bgObj['background-image-opacity'] = node.data('background-opacity');
              obj[node.data('id')] = bgObj;
            }

          }

          // If there is a background image change it, don't add
          var oldObj = chiseInstance.elementUtilities.getBackgroundImageObjs(selectedEles);
          if(oldObj !== undefined)
            chiseInstance.changeBackgroundImage(selectedEles, oldObj, obj, updateBackgroundDeleteInfo, promptInvalidImage);
          else
            chiseInstance.addBackgroundImage(selectedEles, obj, updateBackgroundDeleteInfo, promptInvalidImage);
          $(this).val("");
        }
      });

      $('#inspector-set-as-default-button').on('click', function () {
        var multimer;
        var selected = selectedEles[0];
        var sbgnclass = selected.data('class');
        if (sbgnclass.endsWith(' multimer')) {
          sbgnclass = sbgnclass.replace(' multimer', '');
          multimer = true;
        }
        else {
          multimer = false;        
        }

        var nameToVal = {
          'width': selected.width(),
          'height': selected.height(),
          'border-width': selected.data('border-width'),
          'border-color': selected.data('border-color'),
          'background-color': selected.data('background-color'),
          'background-opacity': selected.data('background-opacity'),
          'background-image': selected.data('background-image'),
          'background-fit': selected.data('background-fit'),
          'background-position-x': selected.data('background-position-x'),
          'background-position-y': selected.data('background-position-y'),
          'background-width': selected.data('background-width'),
          'background-height': selected.data('background-height'),
          'background-image-opacity': selected.data('background-image-opacity')
        };

        // Push this action if the node can be multimer
        if (chiseInstance.elementUtilities.canBeMultimer(sbgnclass)) {
          nameToVal['multimer'] = multimer;
        }

        // Push this action if the node can be cloned
        if (chiseInstance.elementUtilities.canBeCloned(sbgnclass)) {
          nameToVal['clonemarker'] = selected.data('clonemarker') ? true: false;
        }

        // Push this action if the node can have label
        if (chiseInstance.elementUtilities.canHaveSBGNLabel(sbgnclass)) {
          var fontProps = ['font-size', 'font-family', 'font-weight', 'font-style', 'color'];
          fontProps.forEach( function(name) {
            nameToVal[name] = selected.data(name);
          } );
        }

        // Push this action if the node can have ports
        if (chiseInstance.elementUtilities.canHavePorts(sbgnclass)) {
          nameToVal['ports-ordering'] = chiseInstance.elementUtilities.getPortsOrdering(selected);
        }

        if (appUtilities.undoable) {
          var ur = cy.undoRedo();
          var actions = [];
                    //check if staged default element styles is set
          if (typeof appUtilities.stagedElementStyles === 'undefined') {
            appUtilities.stagedElementStyles = [];
          } 
          var elementStyles = [];
          Object.keys(nameToVal).forEach( function(name) {
            var value = nameToVal[name];
            actions.push({name: "setDefaultProperty", param: {class: sbgnclass, name: name, value: value}});
            elementStyles.push({name: name, value: value})
          } );
          //push the staged defaults 
          var  stagedElement =  appUtilities.stagedElementStyles.find(b => b.element === sbgnclass);
          if(stagedElement){
            stagedElement.styles = elementStyles;
          }else{
            appUtilities.stagedElementStyles.push({element : sbgnclass, type: "node",styles: elementStyles, infoBoxStyles:[]});
          }

          ur.do("batch", actions);
        }
        else {
          chiseInstance.elementUtilities.setDefaultProperties( sbgnclass, nameToVal );
        }
      });

      $("#inspector-ports-ordering-select").on('change', function() {
        var ordering = this.value;
        chiseInstance.setPortsOrdering( selectedEles, ordering );
      });

      $("#inspector-node-width, #inspector-node-height").change( function () {
        var w = parseFloat($("#inspector-node-width").val());
        var h = parseFloat($("#inspector-node-height").val());

        if( $(this).attr('id') === 'inspector-node-width' ) {
          h = undefined;
        }
        else {
          w = undefined;
        }

        var useAspectRatio = appUtilities.nodeResizeUseAspectRatio;
        
        chiseInstance.resizeNodes(selectedEles, w, h, useAspectRatio);
        
        // if aspect ratio used, must correctly update the other side length
        if(useAspectRatio){
          if( $(this).attr('id') === 'inspector-node-width' ) {
            var nodeHeight = chiseInstance.elementUtilities.getCommonProperty(selectedEles, function(ele) {
              return ele.height();
            });
            $("#inspector-node-height").val(nodeHeight);
          }
          else {
            var nodeWidth = chiseInstance.elementUtilities.getCommonProperty(selectedEles, function(ele) {
              return ele.width();
            });
            $("#inspector-node-width").val(nodeWidth);
          }
        }


      });

      $('#inspector-node-sizes-aspect-ratio').on('click', function() {
        if(appUtilities.nodeResizeUseAspectRatio == null) {
          appUtilities.nodeResizeUseAspectRatio = false;
        }

        appUtilities.nodeResizeUseAspectRatio = !appUtilities.nodeResizeUseAspectRatio;

        // refresh image
        if (appUtilities.nodeResizeUseAspectRatio) {
          imageName = "lock.svg";
          title = "Unlock aspect ratio";
        }
        else {
          imageName = "open-lock.svg";
          title = "Lock aspect ratio";
        }

        $(this).attr('src', 'app/img/' + imageName);
        $(this).attr('title', title);

        //Refresh grapples when the lock icon is clicked
        cy.nodeEditing('get').refreshGrapples();
      });

      $('#inspector-is-multimer').on('click', function () {
        chiseInstance.setMultimerStatus(selectedEles, $('#inspector-is-multimer').prop('checked'));
      });

      $('#inspector-is-clone-marker').on('click', function () {
        chiseInstance.setCloneMarkerStatus(selectedEles, $('#inspector-is-clone-marker').prop('checked'));
      });

      $("#inspector-label").on('change', function () {
        var lines = $(this).val().trim();
        var current_label_data;
        if (typeof selectedEles.data('label') == 'undefined')
          current_label_data = "";
        else
          current_label_data = selectedEles.data('label').replace(new RegExp("\n", "g"), " \\n ").trim();
        if (current_label_data !== lines){
          lines = lines.split("\\n");
          lines = $.map(lines, function(x) {
            x = x.trim();
            if (x) return (x);
          });
          lines = lines.join("\n");

          chiseInstance.changeNodeLabel(selectedEles, lines);
          inspectorUtilities.handleSBGNInspector();
        }
      });

      $("#inspector-label").on('keydown', function (e) {
        var current_insp_lable = $(this).val();
        if (e.keyCode == 13 && e.shiftKey) {
          var cursor_position = $(this)[0].selectionStart;
          var tmp = $(this).val().substring(0, cursor_position) + " \\n " + $(this).val().substring(cursor_position);
          $(this).val(tmp);
        } else if (e.keyCode == 13 && !e.shiftKey) {
          $(this).trigger("change");
        }
      });

      function callChise2ChangeBgOpacity(v) {
        v = parseFloat(v);
        if (isNaN(v)) {
          v = 1;
        }
        if (v < 0) {
          v = 0;
        }
        if (v > 1) {
          v = 1;
        }

        var actions = [];
        actions.push({name: "changeData", param: {eles: selectedEles, name: 'background-opacity', valueMap: v}});
        actions.push({name: "changeData", param: {eles: selectedEles, name: 'background-image-opacity', valueMap: v}});

        cy.undoRedo().do("batch", actions);
        
       // chiseInstance.changeData(selectedEles, "background-opacity", v);
        //chiseInstance.changeData(selectedEles, "background-image-opacity", v);
      }

      $("#inspector-background-opacity").on('change', function () {
        const v = $("#inspector-background-opacity").val();
        $('#inspector-background-opacity-val').val(v);
        callChise2ChangeBgOpacity(v);
      });

      $('#inspector-background-opacity-val').keyup(function (e) {
        if (e.keyCode == 13) {
          let v = parseFloat($("#inspector-background-opacity-val").val());
          if (isNaN(v)) {
            v = 1;
          }
          if (v <= 0) {
            $("#inspector-background-opacity-val").val(0);
          }
          if (v >= 1) {
            $("#inspector-background-opacity-val").val(1);
          }
          $('#inspector-background-opacity').val(v);
          callChise2ChangeBgOpacity(v);
        }
      });

      $("#inspector-border-width").change( function () {
        var inputVal = $("#inspector-border-width").val();
        if(inputVal || inputVal === 0)
          chiseInstance.changeData(selectedEles, "border-width", inputVal);
      });

      // Open font properties dialog
      $("#inspector-font").on('click', function () {
        appUtilities.fontPropertiesView.render(selectedEles);
      });
    }
    else {
      if ( fillPCIDs ) {
        inspectorUtilities.updatePCIDs( selectedEles, width );
      }

      if ( fillSiteLocations ) {
        inspectorUtilities.updateSiteLocations( selectedEles, width );
      }

      $('#inspector-set-as-default-button').on('click', function () {
        var sbgnclass = selectedEles.data('class');

        if (appUtilities.undoable) {
          var ur = cy.undoRedo();
          var actions = [];
          //push the default styles of edges
          if (typeof appUtilities.stagedElementStyles === 'undefined') {
            appUtilities.stagedElementStyles = [];
          } 
          var elementStyles = [];
          elementStyles.push({name:  'width', value: selectedEles.data('width')})
          elementStyles.push({name: 'line-color', value: selectedEles.data('line-color')})
          appUtilities.stagedElementStyles.push({element : sbgnclass, type:"edge",styles: elementStyles});
          actions.push({name: "setDefaultProperty", param: {class: sbgnclass, name: 'width', value: selectedEles.data('width')}});
          actions.push({name: "setDefaultProperty", param: {class: sbgnclass, name: 'line-color', value: selectedEles.data('line-color')}});
          ur.do("batch", actions);
        }
        else {
          var defaults = chiseInstance.elementUtilities.getDefaultProperties( sbgnclass );
          defaults['width'] = selectedEles.data('width');
          defaults['line-color'] = selectedEles.data('line-color');
        }
      });

      $("#inspector-cardinality").change( function () {
        var data = Math.round($("#inspector-cardinality").val());

        if (data < 0) {
          if (commonSBGNCardinality == 0) {
            inspectorUtilities.handleSBGNInspector();
            return;
          }
          data = 0;
        }

        chiseInstance.changeData(selectedEles, "cardinality", data);
      });

      $("#inspector-edge-width").change( function () {
        chiseInstance.changeData(selectedEles, "width", $("#inspector-edge-width").val());
      });
    }
  }
};

inspectorUtilities.handleRadioButtons = function (errorCode,html,eles,cy,params) {
  if(errorCode == "pd10104")          
      var connectedEdges = eles.connectedEdges().filter('[class="consumption"]');
  else if(errorCode == "pd10108") 
      var connectedEdges = eles.connectedEdges().filter('[class="production"]');
  else if(errorCode == "pd10111")
      var connectedEdges = cy.edges('[source = "' + eles.id() +'"]');
  else if(errorCode == "pd10126")
      var connectedEdges = eles.connectedEdges().filter('[class="logic arc"]');
  else if(errorCode == "pd10112"){
      var compartments = cy.nodes('[class= "compartment"]');
      var listedNodes = [];
      for(var i =0;i<compartments.length;i++ ) {
          if(compartments[i].parent().length ==0)
              listedNodes.push(compartments[i]);
      }
  }
  else {
      var chiseInstance = appUtilities.getActiveChiseInstance();
      var sourcePosX = eles.source().position().x;
      var targetPosX = eles.target().position().x;
      var sourcePosY = eles.source().position().y;
      var targetPosY = eles.target().position().y;
      var minX = Math.min(sourcePosX,targetPosX)-150;
      var maxX = Math.max(sourcePosX,targetPosX)+150;
      var minY = Math.min(sourcePosY,targetPosY)-150;
      var maxY = Math.max(sourcePosY,targetPosY)+150;
      var nodes = cy.nodes();
      var listedNodes = [];
      var groupEPN = ["pd10109","pd10124"];
      var typeGroup = ["tag","submap","terminal"];
      for(var i=0;i<nodes.length;i++) {
          if(nodes[i].position().x >= minX && nodes[i].position().x<=maxX && nodes[i].position().y>=minY && nodes[i].position().y<=maxY)
                  if(groupEPN.includes(errorCode) && eles.target().data().id != nodes[i].data().id ){
                   
                    if(chiseInstance.elementUtilities.isEPNClass(nodes[i])){
                      listedNodes.unshift(nodes[i]);
                    }else if(chiseInstance.elementUtilities.isLogicalOperator(nodes[i])){
                       listedNodes.push(nodes[i]);
                    }                      
                  }
                       
                  else if(errorCode == "pd10110" && chiseInstance.elementUtilities.isPNClass(nodes[i]))
                       listedNodes.push(nodes[i]);
                  else if(errorCode == "pd10125" && chiseInstance.elementUtilities.isLogicalOperator(nodes[i]))
                       listedNodes.push(nodes[i]);  
                 else if (errorCode == "pd10128" && typeGroup.includes(nodes[i].data().class))
                        listedNodes.push(nodes[i]); 
          }
   }
  var instance = cy.viewUtilities('get');
  if(errorCode == "pd10104" || errorCode == "pd10108" || errorCode == "pd10111" || errorCode == "pd10126"){
       for(var i=0; i<connectedEdges.length;i++) {
          if (i == connectedEdges.length-1) {
              instance.highlight(connectedEdges[i], 1);
          }
          if (i == 0) {
               if(errorCode == "pd10104")
                      html+="<p style=\"text-align:center\" > To fix, choose a consumption glyph connected to the dissociation glyph: </p>  " ;
               else if(errorCode == "pd10108")
                   html+="<p style=\"text-align:center\" > To fix, choose a production glyph connected to the association glyph: </p> " ;
               else if(errorCode == "pd10111")
                  html+="<p style=\"text-align:center\" > To fix, choose an arcs whose source is " + eles.data().class.toUpperCase() + ":</p>  " ;
              else if(errorCode == "pd10126")
                   html+="<p style=\"text-align:center\" > To fix, choose a logic arc connected to the logical operator: </p>  " ;
               html+="<div style=\"margin: 0 auto;width: auto;text-align: left; display: table;\" class=\"radio validation-error-radio\" id=\"errors"+ errorCode +"\">";
           }
          if(errorCode == "pd10104")
             html+="<label class=\"radio\"><input type=\"radio\" name=\"optpd10104\" value=\""+ connectedEdges[i].source().data().label + "\" checked>" + connectedEdges[i].source().data().label + " to dissociation </label>";
          else if(errorCode == "pd10111")
             html+="<label class=\"radio\"><input type=\"radio\" name=\"optpd10111\" value=\""+ connectedEdges[i].target().id() + "\" checked>" + eles.data().class.toUpperCase()  + " to " + connectedEdges[i].target().data().class.charAt(0).toUpperCase() + connectedEdges[i].target().data().class.slice(1) + " </label>" ;
          else if(errorCode == "pd10126")
             html+="<label class=\"radio\"><input  type=\"radio\" name=\"optpd10126\" value=\""+ connectedEdges[i].id() + "\" checked>" + connectedEdges[i].source().data().label  + " to " + eles.data().class.toUpperCase() + " </label>" ;
          else
             html+="<label class=\"radio\"><input type=\"radio\" name=\"optpd10108\" value=\""+ connectedEdges[i].target().data().label + "\" checked> Association to " + connectedEdges[i].target().data().label + " </label>";
      }
      if(connectedEdges.length > 0) 
          html+="</div>";
      else
          params.handled = false;
    } else if (errorCode == "pd10142") {
        if((chiseInstance.elementUtilities.isPNClass(eles.target())  && chiseInstance.elementUtilities.isEPNClass(eles.source()))  || (chiseInstance.elementUtilities.isPNClass(eles.source())  && chiseInstance.elementUtilities.isEPNClass(eles.target()))){
          html+="<p style=\"text-align:center\" > To fix, choose correct arc type: </p> " ;
          html+="<div style=\"margin: 0 auto;width: auto;text-align: left; display: table;\" class=\"radio validation-error-radio\" id=\"errors"+ errorCode +"\">";
          html+="<label class=\"radio\"><input type=\"radio\" name=\"optpd10142\" value=\"consumption\"> consumption </label>";
          html+="<label class=\"radio\"><input type=\"radio\" name=\"optpd10142\" value=\"production\" checked> production </label>";
        }else{
          params.handled = false;
        }
      
      }else {
        for(var i=0; i<listedNodes.length;i++) {
          if(i==0){
                  if(errorCode == "pd10109")
                      html+="<p style=\"text-align:center\" > To fix, choose a glyph of EPN class or a logical operator as a source reference to "+ eles.data().class +": </p>  " ;
                   else if(errorCode == "pd10112")
                      html+="<p style=\"text-align:center\" > To fix, choose a compartment to place top level glyph inside: </p>  " ;
                    else if(errorCode == "pd10124")
                      html+="<p style=\"text-align:center\" > To fix, choose a glyph of EPN class as a source reference to the logic arc: </p>  " ;
                    else if(errorCode == "pd10125")
                      html+="<p style=\"text-align:center\" > To fix, choose a logical operator as a target reference to the logic arc: </p>  " ;
                  else if(errorCode == "pd10128")
                      html+="<p style=\"text-align:center\" > To fix, choose a glyph of tag, submap or terminal class as a target reference to the equivalence arc: </p>  " ;
                   else if(errorCode == "pd10127")
                      html+="<p style=\"text-align:center\" > To fix, choose a glyph of EPN class as a source reference to the equivalence arc: </p>  " ;
                  else
                      html+="<p style=\"text-align:center\" > To fix, choose a glyph of PN class as a target reference to the "+ eles.data().class +": </p> " ;
                   html+="<div style=\"margin: 0 auto;width: auto;text-align: left; display: table;\"class=\"radio validation-error-radio\" id=\"errors"+ errorCode +"\">";

           }
          if (errorCode != "pd10112" ) {
              if (i == listedNodes.length-1) {
                  instance.highlight(listedNodes[i], 1);
              }
              if(errorCode == "pd10110" || errorCode == "pd10128")
                  html+="<label  class=\"radio\">  <input type=\"radio\" name=\"optradio\" value=\""+ listedNodes[i].id() + "\" checked>" + listedNodes[i].data().class.charAt(0).toUpperCase() + listedNodes[i].data().class.slice(1) + " </label>"
              else if(errorCode == "pd10125")
                  html+="<label class=\"radio\"><input type=\"radio\" name=\"optradio\" value=\""+ listedNodes[i].id() + "\" checked>" + listedNodes[i].data().class.toUpperCase() + " </label>"
              else{
                var radioText = chiseInstance.elementUtilities.isLogicalOperator(listedNodes[i])? listedNodes[i].data().class.toUpperCase() : listedNodes[i].data().label;
                html+="<label class=\"radio\"> <input type=\"radio\" name=\"optradio\" value=\""+ listedNodes[i].id() + "\" checked>" + radioText + " </label>"
              }
          }
          else 
               html+="<label class=\"radio\"> <input type=\"radio\" name=\"optradio\" value=\""+ listedNodes[i].id() + "\" checked>" + listedNodes[i].data().label + " </label>"
      }
      if(listedNodes.length > 0) 
          html+="</div>";
      else
          params.handled = false;
    }
   return html;
}

inspectorUtilities.fixRadioButtons = function (errorCode,eles,cy) {
  var errorFixParam = {};
  errorFixParam.errorCode = errorCode;
    if(errorCode == "pd10104") {  
        errorFixParam.nodes = []; 
        errorFixParam.edges = [];      
         var radioChecked = $('#errorspd10104 input:radio:checked').val();
         var connectedEdges = eles.connectedEdges().filter('[class="consumption"]');
         for(var i=0; i<connectedEdges.length;i++) { 
            if(connectedEdges[i].source().data().label != radioChecked){
              errorFixParam.nodes.push(connectedEdges[i].source()); 
              errorFixParam.edges.push(connectedEdges[i]);
            }
        }
     }
     else if(errorCode == "pd10108"){
      errorFixParam.nodes = []; 
      errorFixParam.edges = []; 
         var radioChecked = $('#errorspd10108 input:radio:checked').val();
         var connectedEdges = eles.connectedEdges().filter('[class="production"]');
         for(var i=0; i<connectedEdges.length;i++) { 
              if(connectedEdges[i].target().data().label != radioChecked) {
                errorFixParam.nodes.push(connectedEdges[i].target());
                errorFixParam.edges.push(connectedEdges[i]);
              }               
         }
     } else if(errorCode == "pd10111"){
      errorFixParam.edges = []; 
         var radioChecked = $('#errorspd10111 input:radio:checked').val();
         var connectedEdges = cy.edges('[source = "' + eles.id() +'"]');
         for(var i=0; i<connectedEdges.length;i++) { 
              if(connectedEdges[i].target().id() != radioChecked){
                errorFixParam.edges.push(connectedEdges[i]);
              }
              
         }
     }else if(errorCode == "pd10126"){
        errorFixParam.edges = []; 
        errorFixParam.nodes = []; 
         var radioChecked = $('#errorspd10126 input:radio:checked').val();
         var connectedEdges =  eles.connectedEdges().filter('[class="logic arc"]');
         for(var i=0; i<connectedEdges.length;i++) { 
              if(connectedEdges[i].id() != radioChecked){     
                errorFixParam.edges.push(connectedEdges[i]);
                errorFixParam.nodes.push(connectedEdges[i].source());
            }
         }
     } else {
        if(errorCode == "pd10109" || errorCode == "pd10124" || errorCode == "pd10127") {
            var radioChecked = $('#errors'+errorCode+ ' input:radio:checked').val();
            var node = cy.nodes('[id = "' + radioChecked +'"]');
            errorFixParam.newTarget = eles.target().id();
            errorFixParam.newSource = node.id();
            errorFixParam.edge = eles;
            errorFixParam.portsource = node.id();           
        }
        else if(errorCode == "pd10112") {
            var radioChecked = $('#errorspd10112 input:radio:checked').val();
            var compartment = cy.nodes('[id = "' + radioChecked +'"]');
            errorFixParam.nodes = eles
            errorFixParam.parentData = compartment.id();
            errorFixParam.posDiffX = 0;
            errorFixParam.posDiffY = 0;
            errorFixParam.firstTime = true;
            
        }
        else if(errorCode == "pd10125") {
            var radioChecked = $('#errorspd10125 input:radio:checked').val();
             var edgeParams = {class : eles.data().class, language :eles.data().language};
            var promptInvalidEdge = function(){
                appUtilities.promptInvalidEdgeWarning.render();
            }
            var chiseInstance = appUtilities.getActiveChiseInstance();
            var source = eles.source();
            var target =  cy.nodes('[id = "' + radioChecked +'"]');

            errorFixParam.edge = eles;
            errorFixParam.newEdge = {source:source.id(),target:target.id(),edgeParams:edgeParams};
           
       }
         else if(errorCode == "pd10142") {
            var radioChecked = $('#errorspd10142 input:radio:checked').val();
            var edgeParams = {class : radioChecked, language :eles.data().language};
            var promptInvalidEdge = function(){
                appUtilities.promptInvalidEdgeWarning.render();
            }
            var source = eles.source();
            var target = eles.target();
            errorFixParam.edge = eles;
           
            if(target.data().class != 'process')
                target = cy.nodes('[class = "process"]');
            errorFixParam.newEdge = {source:source.id(),target:target.id(),edgeParams:edgeParams}  ; 
            
        
           
       }
        else {
            var radioChecked = $('#errors'+errorCode+ ' input:radio:checked').val();
            var node = cy.nodes('[id = "' + radioChecked +'"]');            

           errorFixParam.newTarget = node.id();
           errorFixParam.newSource = eles.source().id();
           errorFixParam.edge = eles;
           errorFixParam.porttarget = node.id();        
        }        
    
     }
     cy.undoRedo().do("fixError", errorFixParam);
 } 
  inspectorUtilities.handleSBGNConsole = function ( errors,currentPage,cy,data,notPD) {
	var html = "";
        var handled = true;
        var dismiss = "Dismiss";
        var radioButtonRules = ["pd10104","pd10108","pd10109","pd10110","pd10111","pd10112","pd10124","pd10125","pd10126","pd10127","pd10128","pd10142"];
        var radioButtonChangeEvent = ["pd10104","pd10108","pd10110","pd10111","pd10109","pd10124","pd10125","pd10126","pd10127","pd10128"];      

        var viewUtilitilesInstance = cy.viewUtilities('get');
        var chiseInstance = appUtilities.getActiveChiseInstance();
        viewUtilitilesInstance.removeHighlights();
        if(errors.length !=0 && !notPD) {
            var id=errors[currentPage].role; 
            var unhighlighted = ["pd10107"];
            var eles =  cy.elements('[id="' + id + '"]');
            if( !unhighlighted.includes(errors[currentPage].pattern)) {
               viewUtilitilesInstance.highlight(eles, 1);
           }

           
           if(errors[currentPage].pattern == "pd10109" || (errors[currentPage].pattern == 'pd10110')){
            var elesClass = eles.data().class;
            errors[currentPage].text[0] = errors[currentPage].text[0].replace(new RegExp("modulation", 'i'), elesClass.charAt(0).toUpperCase() + elesClass.slice(1));
           }
          
          
          html += "<b><p class='panel-body' style=\"color:red; text-align:center;\" > Map is Invalid</p></b>";
          html += "<p style=\"text-align:center\" >" + errors[currentPage].text + "</p>";
          html+="<table style=\"width:100%\"> <tr> <td style=\"width:90% text-align:center;\">";
          if(errors[currentPage].pattern == "pd10101") {
              html += "<p style=\"text-\align:center\" > To fix, reverse the consumption edge:</p>" ;
            }
          /*   else if(errors[currentPage].pattern == "pd10102") {
                     html +="<p style=\"text-align:center\" > To fix, reverse the consumption arc:</p>";
            }  */
            else if(errors[currentPage].pattern == "pd10103") {
                     html += "<p style=\"text-align:center\" > To fix, split the <i>source and sink</i> glyph for each consumption arc:</p> ";       
            }else if(radioButtonRules.includes(errors[currentPage].pattern)) {
                    var params = { handled: handled };
                    html= inspectorUtilities.handleRadioButtons(errors[currentPage].pattern,html,eles,cy,params);
                    handled = params.handled;
            }else if(errors[currentPage].pattern == "pd10105" || errors[currentPage].pattern == "pd10106") {
                if(chiseInstance.elementUtilities.isPNClass(eles.target()) && chiseInstance.elementUtilities.isEPNClass(eles.source())) {
                  html += "<p style=\"text-align:center\" > To fix, reverse the production arc:</p>";
                }else{
                  handled = false;
                }
                    
            }
            else if(errors[currentPage].pattern == "pd10107") {
                     html += "<p style=\"text-align:center\" > To fix, split the <i>source and sink</i> glyph for each production arc:</p>";
                       var connectedEdges = eles.connectedEdges().filter('[class="production"]');
                       for (var i = 0; i < connectedEdges.length; i++) {
                           viewUtilitilesInstance.highlight(connectedEdges[i], 1);
                     }
                     viewUtilitilesInstance.highlight(eles, 1);
           }else if(errors[currentPage].pattern == "pd10140") {
                     html += "<p style=\"text-align:center\" > To fix, delete the glyph:</p>";
            }
           else
               handled = false;
           if(handled)
                html+="</td> <td style=\"width:10% text-align: right; vertical-align:middle;\"><img id=\"fix-errors-of-validation-icon\" class=\"sbgn-toolbar-element\" style=\"text-align: right; vertical-align:middle;opacity: 0.7;filter: alpha(opacity=70);\"src=\"app/img/fix-error.svg\" title=\"Execute\"width=\"24\"></div>";
           html+="</td></tr></table>";
           var next = "Next";
           if(currentPage == 0) {
                if(errors.length !=1) {
                    html += "<div id = 'altItems' style='text-align: center; margin-top: 5px; '><button class='btn btn-default' style='align: center;' id='inspector-next-button'"
                    + ">" + next + "</button> <button class='btn btn-default' style='align: center;' id='inspector-dismiss-button'"
                    + ">" + dismiss + "</button> </div>";
                }else {
                     html += "<div id = 'altItems' style='text-align: center; margin-top: 5px;  ' ><button class='btn btn-default' style='align: center;' id='inspector-dismiss-button'"
                    + ">" + dismiss + "</button> </div>";
                } 
            }else { 
               var back = "Previous";
               if(currentPage + 1 !== errors.length) {
                     html += "<div id = 'altItems' style='text-align: center; margin-top: 5px;  ' >\n\
                   <button class='btn btn-default' style='align: center;' id='inspector-back-button'"
                    + ">" + back + "</button> <button class='btn btn-default' style='align: center;' id='inspector-next-button'"
                    + ">" + next + "</button> <button class='btn btn-default' style='align: center;' id='inspector-dismiss-button'"
                    + ">" + dismiss + "</button> </div>"; 
               }
               else {
                     html += "<div id = 'altItems' style='text-align: center; margin-top: 5px; ' ><button class='btn btn-default' style='align: center;' id='inspector-back-button'"
                   + ">" + back + "</button> <button class='btn btn-default' style='align: center;' id='inspector-dismiss-button'"
                   + ">" + dismiss + "</button> </div>"; 
               }

            }
           inspectorUtilities.handleNavigate (cy,eles);
    } else if (notPD) {
        html += "<b><p class='panel-body' style=\"color:red; text-align:center\" > Can only validate maps of type PD</p></b>";
           html += "<div id = 'altItems' style='text-align: center; margin-top: 5px;  ' ><button class='btn btn-default' style='align: center;' id='inspector-dismiss-button'"
                 + ">" + dismiss + "</button> </div>";
    }
    else {
          html += "<b><p class='panel-body' style=\"color:green; text-align:center\" > Map is Valid</p></b>";
           html += "<div id = 'altItems' style='text-align: center; margin-top: 5px;  ' ><button class='btn btn-default' style='align: center;' id='inspector-dismiss-button'"
                 + ">" + dismiss + "</button> </div>";
      }
    $("#sbgn-inspector-console-panel-group").html(html);
    $('#inspector-next-button').on('click', function () {
              currentPage = currentPage + 1;
              var cy = appUtilities.getActiveCy();
              inspectorUtilities.handleSBGNConsole(errors,currentPage,cy,data,false);
      });
     $('#inspector-back-button').on('click', function () {
              currentPage = currentPage - 1;
              var cy = appUtilities.getActiveCy();
              inspectorUtilities.handleSBGNConsole(errors,currentPage,cy,data,false);
      });
      
        $('#fix-errors-of-validation-icon').on('click', function () {
             
              var actions = [];
              var errorFixParam = {};
              errorFixParam.errorCode = errors[currentPage].pattern;
               var cy = appUtilities.getActiveCy();
               var chiseInstance = appUtilities.getActiveChiseInstance();
               viewUtilitilesInstance.removeHighlights();
               var errorsNew = [];
               if(errors[currentPage].pattern == "pd10101") {
                var targetTmp = eles.target(); 
                   if(chiseInstance.elementUtilities.isEPNClass(targetTmp)) {
                      errorFixParam.edge = eles;
                                     
                   }
               }else if(errors[currentPage].pattern == "pd10103" ||  errors[currentPage].pattern == "pd10107"){
                        errorFixParam.newEdges = [];
                        errorFixParam.newNodes = [];
                        errorFixParam.oldEdges = [];
                        errorFixParam.node = eles; 
                        var edges = cy.nodes('[id = "' + id +'"]').connectedEdges();
                  
                        var addedNodeNum = edges.length;
                        var promptInvalidEdge = function(){
                            appUtilities.promptInvalidEdgeWarning.render();
                        }
                        var nodeParams = {class : eles.data().class, language : eles.data().language};
                        for (var i = 0 ; i<addedNodeNum;i++){ 
                           var edgeParams = {class : edges[i].data().class, language : edges[i].data().language};
                           var shiftX = 22;
                           var shiftY = 22;
                           var target = edges[i].target();
                           var source = edges[i].source();
                           var x = edges[i].sourceEndpoint().x;
                           var y = edges[i].sourceEndpoint().y;
                           if(edges[i].data().class != 'consumption'){
                                x = edges[i].targetEndpoint().x;
                                y = edges[i].targetEndpoint().y;
                           }
                               
                           var xdiff = Math.abs(edges[i].targetEndpoint().x-edges[i].sourceEndpoint().x);
                           var ydiff = Math.abs(edges[i].targetEndpoint().y-edges[i].sourceEndpoint().y);
                           var ratio = ydiff/xdiff;
                           if(xdiff ==0){
                               shiftX =0;
                               shiftY = 22;
                           }
                           else if(ydiff==0){
                               shiftY=0;
                               shiftX=22;
                           }
                           else {
                                var result = 22*22;
                                var ratiosquare = ratio * ratio;
                                var dx = Math.sqrt(result/(ratiosquare+1));
                                shiftX = dx;
                                shiftY = shiftX*ratio;
                           }
                           if(edges[i].data().class == 'consumption'){
                                if(eles.position().x > target.position().x)
                                    shiftX *= -1;
                                if(eles.position().y> target.position().y)
                                    shiftY *= -1;
                           }else {
                                if(eles.position().x > source.position().x)
                                    shiftX *= -1;
                                if(eles.position().y> source.position().y)
                                    shiftY *= -1;
                           }
                            var cX = x+shiftX;
                            var cY =y+shiftY;

                            errorFixParam.newNodes.push({x:cX,y:cY,class:nodeParams,id:"node"+i});  
                            if(edges[i].data().class == 'consumption'){
                              errorFixParam.newEdges.push({source:"node"+i, target: target.id(),class:edgeParams,property:'porttarget', value:edges[i].data().porttarget});
                            }
                            else{
                              errorFixParam.newEdges.push({source:source.id(), target: "node"+i,class:edgeParams,property:'portsource', value:edges[i].data().portsource});
                              
                            }
                            errorFixParam.oldEdges.push(edges[i]); 
                        }
                       

               }else if(errors[currentPage].pattern == "pd10105" || errors[currentPage].pattern == "pd10106") {
                   var targetTmp = eles.target();
                   var sourceTmp = eles.source();
                   var chiseInstance = appUtilities.getActiveChiseInstance();
                   if(chiseInstance.elementUtilities.isPNClass(targetTmp) && chiseInstance.elementUtilities.isEPNClass(sourceTmp)) {
                      errorFixParam.edge = eles;
                      
                   }
               }else if(errors[currentPage].pattern == "pd10140" ) {
                  errorFixParam.node = eles;
                  
               }
               


               if(radioButtonRules.includes(errors[currentPage].pattern)){
                inspectorUtilities.fixRadioButtons(errors[currentPage].pattern ,eles,cy);                       
               }else{
                cy.undoRedo().do("fixError", errorFixParam);
               }
               var file = chiseInstance.createSbgnml();
               errorsNew = chiseInstance.doValidation(file);
               viewUtilitilesInstance.removeHighlights(eles);
               if(errorsNew.length ==0){
                    cy.animate({
                      duration: 100,
                      easing: 'ease',
                      fit :{eles:{},padding:20}
                   });
               }
               inspectorUtilities.handleSBGNConsole(errorsNew,0,cy,file,false);

      });
        
     $('#inspector-dismiss-button').on('click', function () {
            var cy = appUtilities.getActiveCy();
            if(errors.length!=0) {
                cy.animate({
                 duration: 100,
                 easing: 'ease',
                 fit :{eles:{},padding:20}, 
                 complete: function(){
                      viewUtilitilesInstance.removeHighlights();
                 }
              });
            }
             $("#sbgn-inspector-console-panel-group").html("");
             $('#inspector-console-tab')[0].style.display = "none";

             var tabContents = document.getElementsByClassName('validation-mode-tab');
             for (var i = 0; i < tabContents.length; i++) {
               $(tabContents[i]).removeClass('active');
               $($(tabContents[i]).children('a')[0]).attr("data-toggle", "tab");   
              } 
              modeHandler.disableReadMode();
              $('#inspector-map-tab a').click();
            
             
          
      });
      $('input[type=radio]').change(function() {
          if(!radioButtonChangeEvent.includes(errors[currentPage].pattern))
              return;
          viewUtilitilesInstance.removeHighlights();
          var group = ["pd10109","pd10110","pd10124","pd10127","pd10125","pd10128"];
          var instance = cy.viewUtilities('get');
          instance.highlight(eles, 1);
          if(errors[currentPage].pattern == "pd10104" ){
            var connectedEdges = eles.connectedEdges().filter('[class="consumption"]');
            for(var i=0; i<connectedEdges.length;i++) {
                if(connectedEdges[i].source().data().label == this.value){
                    instance.highlight(connectedEdges[i], 1);
                }
            }
          }
          else if(errors[currentPage].pattern == "pd10108" ) {
              var connectedEdges = eles.connectedEdges().filter('[class="production"]');
              for(var i=0; i<connectedEdges.length;i++) {
                if(connectedEdges[i].target().data().label == this.value){
                    instance.highlight(connectedEdges[i], 1);
                }
            }
         }
         else if(errors[currentPage].pattern == "pd10126" ) {
              var connectedEdges = eles.connectedEdges().filter('[class="logic arc"]');
              for(var i=0; i<connectedEdges.length;i++) {
                if(connectedEdges[i].id() == this.value){
                    instance.highlight(connectedEdges[i], 1);
                }
            }
         }
         else if(group.includes(errors[currentPage].pattern)) {
              var node = cy.nodes('[id = "' + this.value +'"]');
              instance.highlight(node, 1);
              if(errors[currentPage].pattern == "pd10124"){
                    var zoomLevel = 4 ;
                    if(zoomLevel<cy.zoom())
                        zoomLevel = cy.zoom();
                    cy.animate({
                      duration: 1400,
                      center: {eles:node},
                      easing: 'ease',
                      zoom :zoomLevel
                  });
              }
         }
         else if(errors[currentPage].pattern == "pd10111" ) {
              var connectedEdges = cy.edges('[source = "' + eles.id() +'"]');
               for(var i=0; i<connectedEdges.length;i++) {
                if(connectedEdges[i].target().id() == this.value){
                    instance.highlight(connectedEdges[i], 1);
                }
            }
         }
         
      });


}; 
inspectorUtilities.handleNavigate = function (cy,eles) {
          var zoomLevel = 4 ;
          if(zoomLevel<cy.zoom())
              zoomLevel = cy.zoom();
          cy.animate({
            duration: 1400,
            center: {eles:eles},
            easing: 'ease',
            zoom :zoomLevel,
            complete: function(){
                var exceed = false;
                if(eles.isEdge()){
                    var source_node = eles.source();
                    var target_node = eles.target();
                    var source_loc = Math.pow(source_node._private.position.x, 2) + Math.pow(source_node._private.position.y, 2);
                    var target_loc = Math.pow(target_node._private.position.x, 2) + Math.pow(target_node._private.position.y, 2);
                    var source_to_target = source_loc < target_loc;
                    var start_node = source_to_target ? source_node : target_node;
                    var end_node = source_to_target ? target_node : source_node;
                    var renderedStartPosition = start_node.renderedPosition();
                    var renderedEndPosition = end_node.renderedPosition();
                    var maxRenderedX = cy.width();
                    var maxRenderedY = cy.height();
                    if( ( renderedEndPosition.x >= maxRenderedX ) || ( renderedStartPosition.x <= 0 )
                           || ( renderedEndPosition.y >= maxRenderedY ) || ( renderedStartPosition.y <= 0 ) ){
                      exceed = true;
                    }
                   if( exceed ) {
                       // save the node who is currently being dragged to the scratch pad
                       cy.fit(eles);
                   }
                }
                else {
                     var renderedPosition = eles.renderedPosition();
                     var renderedWidth = eles.renderedWidth();
                     var renderedHeight = eles.renderedHeight();

                     var maxRenderedX = cy.width();
                     var maxRenderedY = cy.height();

                     var topLeftRenderedPosition = {
                       x: renderedPosition.x - renderedWidth / 2,
                       y: renderedPosition.y - renderedHeight / 2
                     };

                     var bottomRightRenderedPosition = {
                       x: renderedPosition.x + renderedWidth / 2,
                       y: renderedPosition.y + renderedHeight / 2
                     };
                     if( ( bottomRightRenderedPosition.x >= maxRenderedX ) || ( topLeftRenderedPosition.x <= 0 )
                             || ( bottomRightRenderedPosition.y >= maxRenderedY ) || ( topLeftRenderedPosition.y <= 0 ) ){
                       exceed = true;
                     } 
                     if( exceed ) {
                       // save the node who is currently being dragged to the scratch pad
                       cy.fit(eles);
                     }
                }
                    }
                });
     
};
module.exports = inspectorUtilities;
