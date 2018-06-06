var appUtilities = require('./app-utilities');
var inspectorUtilities = {};
var fillBioGeneContainer = require('./fill-biogene-container');
var annotHandler = require('./annotations-handler');

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
  
  for (var i = 0; i < stateAndInfos.length; i++) {
    (function(i){
      var state = stateAndInfos[i];
      if (state.clazz == "state variable") {
        $("#inspector-state-variables").append("<div><input type='text' id='inspector-state-variable-value" + i + "' class='inspector-input-box' style='width: "
                + width / 5 + "px;' value='" + (state.state.value || '') + "'/>"
                + "<span style='font: 10pt Helvetica;'>@</span>"
                + "<input type='text' id='inspector-state-variable-variable" + i + "' class='inspector-input-box' style='width: "
                + width / 2.5 + "px;' value='" + (state.state.variable || '')
                + "'/><img width='16px' height='16px' id='inspector-delete-state-and-info" + i + "' class='pointer-button' src='app/img/toolbar/delete-simple.svg'></img></div>");

        $("#inspector-state-variable-value" + i).unbind('change').on('change', function () {
          chiseInstance.changeStateOrInfoBox(nodes, i, $(this).val(), 'value');
        });

        $("#inspector-state-variable-variable" + i).unbind('change').on('change', function () {
          chiseInstance.changeStateOrInfoBox(nodes, i, $(this).val(), 'variable');
        });
      }
      else if (state.clazz == "unit of information") {
        var total = 0.6 * width + get_text_width("@", "10pt Helvetica");
        if (chiseInstance.elementUtilities.canHaveMultipleUnitOfInformation(nodes)){
          $("#inspector-unit-of-informations").append("<div><input type='text' id='inspector-unit-of-information-label" + i + "' class='inspector-input-box' style='width: "
                  + total + "px;' value='" + (state.label.text || '')
			  + "'/><img width='16px' height='16px' id='inspector-delete-state-and-info" + i + "' class='pointer-button' src='app/img/toolbar/delete-simple.svg'></img></div>");
        } else {
          $("#inspector-unit-of-informations").append("<div><input type='text' id='inspector-unit-of-information-label" + i + "' class='inspector-input-box' style='width: "
                  + total + "px;' value='" + (state.label.text || '') + "'/></div>");
        }

        $("#inspector-unit-of-information-label" + i).unbind('change').on('change', function () {
          chiseInstance.changeStateOrInfoBox(nodes, i, $(this).val());
        });
      }
      
      $("#inspector-delete-state-and-info" + i).unbind('click').click(function (event) {
        chiseInstance.removeStateOrInfoBox(nodes, i);
        inspectorUtilities.handleSBGNInspector();
      });
    })(i);
  }
  $("#inspector-state-variables").append("<img width='16px' height='16px' id='inspector-add-state-variable' src='app/img/add.svg' class='pointer-button'/>");

  if (chiseInstance.elementUtilities.canHaveMultipleUnitOfInformation(nodes)){
    $("#inspector-unit-of-informations").append("<img width='16px' height='16px' id='inspector-add-unit-of-information' src='app/img/add.svg' class='pointer-button'/>");
  };
  $("#inspector-add-state-variable").click(function () {

    // access current general properties for active instance
    var currentGeneralProperties = appUtilities.getScratch(cy, 'currentGeneralProperties');

    var obj = {};
    obj.clazz = "state variable";

    obj.state = {
      value: "",
      variable: ""
    };
    obj.bbox = {
      w: currentGeneralProperties.defaultInfoboxWidth,
      h: currentGeneralProperties.defaultInfoboxHeight
    };

    chiseInstance.addStateOrInfoBox(nodes, obj);
    inspectorUtilities.handleSBGNInspector();
  });

  $("#inspector-add-unit-of-information").click(function () {

    // access current general properties for active instance
    var currentGeneralProperties = appUtilities.getScratch(cy, 'currentGeneralProperties');

    var obj = {};
    obj.clazz = "unit of information";
    obj.label = {
      text: ""
    };
    obj.bbox = {
      w: currentGeneralProperties.defaultInfoboxWidth,
      h: currentGeneralProperties.defaultInfoboxHeight
    };

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
    if (classInfo == 'and' || classInfo == 'or' || classInfo == 'not') {
      classInfo = classInfo.toUpperCase();
    }
    else {
      classInfo = classInfo.replace(/\w\S*/g, function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
      });
      classInfo = classInfo.replace(' Of ', ' of ');
      classInfo = classInfo.replace(' And ', ' and ');
      classInfo = classInfo.replace(' Or ', ' or ');
      classInfo = classInfo.replace(' Not ', ' not ');
    }

    if (classInfo == "Ba Plain"){
      classInfo = "BA";
    }
    else if (classInfo.includes("Ba ")){
      classInfo = "BA " + classInfo.substr(3);
    }

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
    var multimerCheck;
    var clonedCheck;
    var commonIsMultimer;
    var commonIsCloned;
    var commonStateAndInfos;
    var commonSBGNCardinality;
    var imageFromURL;
    var imageURL;
    var hasBackgroundImage;

    if (allNodes) {
      type = "node";

      var borderColor = chiseInstance.elementUtilities.getCommonProperty(selectedEles, "border-color", "data");
      borderColor = borderColor?borderColor:'#FFFFFF';

      var backgroundColor = chiseInstance.elementUtilities.getCommonProperty(selectedEles, "background-color", "data");
      backgroundColor = backgroundColor?backgroundColor:'#FFFFFF';

      var borderWidth = chiseInstance.elementUtilities.getCommonProperty(selectedEles, "border-width", "data");

      var backgroundOpacity = chiseInstance.elementUtilities.getCommonProperty(selectedEles, "background-opacity", "data");
      backgroundOpacity = backgroundOpacity?backgroundOpacity:0.5;

      var nodeWidth = chiseInstance.elementUtilities.getCommonProperty(selectedEles, function(ele) {
        return ele.width();
      });

      var nodeHeight = chiseInstance.elementUtilities.getCommonProperty(selectedEles, function(ele) {
        return ele.height();
      });

      if (chiseInstance.elementUtilities.trueForAllElements(selectedEles, chiseInstance.elementUtilities.canHaveSBGNLabel)) {
        html += "<tr><td style='width: " + width + "px; text-align:right; padding-right: 5px;'>" + "<font class='sbgn-label-font'>Label</font>" + "</td><td style='padding-left: 5px;'>"
              + "<input id='inspector-label' class='inspector-input-box' type='text' style='width: " + width / 1.5 + "px;' value='" + sbgnlabel
              + "'/>" + "</td></tr>";
      }
      
      // if at least one node is not a non-resizable parent node
      if( selectedEles.filter(':parent').length != selectedEles.length ) {
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
      
      
      html += "<tr><td style='width: " + width + "px; text-align:right; padding-right: 5px;'>" + "<font class='sbgn-label-font'>Border Color</font>" + "</td><td style='padding-left: 5px;'>"
              + "<input id='inspector-border-color' class='inspector-input-box' type='color' style='width: " + buttonwidth + "px;' value='" + borderColor
              + "'/>" + "</td></tr>";
      html += "<tr><td style='width: " + width + "px; text-align:right; padding-right: 5px;'>" + "<font class='sbgn-label-font'>Fill Color</font>" + "</td><td style='padding-left: 5px;'>"
              + "<input id='inspector-fill-color' class='inspector-input-box' type='color' style='width: " + buttonwidth + "px;' value='" + backgroundColor
              + "'/>" + "</td></tr>";
      html += "<tr><td style='width: " + width + "px; text-align:right; padding-right: 5px;'>" + "<font class='sbgn-label-font'>Border Width</font>" + "</td><td style='padding-left: 5px;'>"
              + "<input id='inspector-border-width' class='inspector-input-box' type='number' min='0' style='width: " + buttonwidth + "px;'";
      
      if(borderWidth){
        html += " value='" + parseFloat(borderWidth) + "'";
      }
      
      html += "/>" + "</td></tr>";
      
      html += "<tr><td style='width: " + width + "px; text-align:right; padding-right: 5px;'>" + "<font class='sbgn-label-font'>Fill Opacity</font>" + "</td><td style='padding-left: 5px;'>"
              + "<input id='inspector-background-opacity' class='inspector-input-box' type='range' step='0.01' min='0' max='1' style='width: " + buttonwidth + "px;' value='" + parseFloat(backgroundOpacity)
              + "'/>" + "</td></tr>";

      if (chiseInstance.elementUtilities.trueForAllElements(selectedEles, chiseInstance.elementUtilities.canHaveSBGNLabel)) {
        html += "<tr><td style='width: " + width + "px; text-align:right; padding-right: 5px;'>" + "<font class='sbgn-label-font'>Font</font>" + "</td><td style='padding-left: 5px;'>"
              + "<label id='inspector-font' style='cursor: pointer;width: " + buttonwidth + "px;'>"
              + "..." + "<label/>" + "</td></tr>"; 
      }

      if(selectedEles.length == 1){
        var removeBtn = "<img id='inspector-delete-bg' width='16px' height='16px' class='pointer-button' src='app/img/toolbar/delete-simple.svg'>";
        hasBackgroundImage = chiseInstance.elementUtilities.hasBackgroundImage(selectedEles[0]);
        if(!hasBackgroundImage){
          removeBtn = "<img id='inspector-delete-bg' width='16px' style='display: none' height='16px' class='pointer-button' src='app/img/toolbar/delete-simple.svg'>";
        }

        html += "<tr><td style='width: " + width + "px; text-align:right; padding-right: 5px;'>" + "<font class='sbgn-label-font'>Image</font>" + "</td><td style='padding-left: 5px;'>"
              + "<div><button id='inspector-image-file' class='btn btn-default' style='width: "
              + width / 1.5 + "px;padding:2px;margin-bottom:2px;'>Choose...</button>" 
              + "<input id='inspector-image-url' class='inspector-input-box' type='text' style='display: none; width: " + width / 1.5 + "px;' placeholder='Enter a URL...'/>"
              + "&nbsp;<input type='checkbox' id='inspector-image-from-url'>" 
              + "<font class='sbgn-label-font'>URL</font></div>"
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
          + "<input id='inspector-edge-width' class='inspector-input-box float-input' type='text' min='0' style='width: " + buttonwidth + "px;'";
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

    }
    html += "</table></div>";
    
    if(selectedEles.length == 1){
      var setAsDefaultTitle = "Set as Default for " + classInfo;
      html += "<div style='text-align: center; margin-top: 5px;'><button class='btn btn-default' style='align: center;' id='inspector-set-as-default-button'"
            + ">" + setAsDefaultTitle + "</button></div>";
    }
    
//    html += "<hr class='inspector-divider' style='border-width: 3px;'>";
    html += "</div>";
    
    $('#sbgn-inspector-style-panel-group').append('<div id="sbgn-inspector-style-properties-panel" class="panel" ></div>');
    $("#sbgn-inspector-style-properties-panel").html(html);
    
    if (selectedEles.length === 1) {
      var geneClass = selectedEles[0]._private.data.class;
      
      function addCollapsibleSection(identifier, title, hasSubtitleSection) {
        html =  "<div  class='panel-heading collapsed' data-toggle='collapse' data-target='#"+identifier+"-collapsable'>"+
                  "<p class='panel-title accordion-toggle'>"+title+"</p>"+
                "</div>"+
                "<div style='margin-top: 5px;align: center;text-align: center;' id='"+identifier+"-collapsable' class='panel-collapse collapse'>";
        if (hasSubtitleSection) {
          html += "<div class='panel-body' style='padding-top: 3px; padding-left: 3px;' id='"+identifier+"-title'></div>";
        }
        html += "<div id='"+identifier+"-container'></div>"+
                "</div>";

        $('#sbgn-inspector-style-panel-group').append('<div id="sbgn-inspector-style-'+identifier+'-panel" class="panel" ></div>');
        $("#sbgn-inspector-style-"+identifier+"-panel").html(html);
      }

      if (geneClass === 'macromolecule' || geneClass === 'nucleic acid feature' ||
          geneClass === 'unspecified entity') {

          addCollapsibleSection("biogene", "Properties from EntrezGene", true);
          fillBioGeneContainer(selectedEles[0]);
      }

      // annotations handling part
      addCollapsibleSection("annotations", "Custom Properties", false);
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
        hasBackgroundImage = chiseInstance.elementUtilities.hasBackgroundImage(selectedEles[0]);
        if(!hasBackgroundImage)
          $('#inspector-delete-bg').hide();
        else
          $('#inspector-delete-bg').show();
      }

      $('#inspector-image-from-url').on('click', function() {
        imageFromURL = !imageFromURL;
        if(imageFromURL){
          imageURL = chiseInstance.elementUtilities.getBackgroundImageURL(selectedEles[0]);
          imageURL = imageURL ? imageURL : "";
          
          $('#inspector-image-url').val(imageURL);
          $('#inspector-image-url').show();
          $('#inspector-image-file').hide();

        }
        else{
          $('#inspector-image-url').hide();
          $('#inspector-image-file').show();
        }

        updateBackgroundDeleteInfo();
      });

      $('#inspector-delete-bg').on('click', function () {
        chiseInstance.changeCss(selectedEles[0], 'background-image', '');
        updateBackgroundDeleteInfo();
      });

      $("#inspector-image-url").on('change', function () {
        var url = $(this).val().trim();
        imageURL = chiseInstance.elementUtilities.getBackgroundImageURL(selectedEles[0]);
        
        if (url && imageURL !== url){
          chiseInstance.changeCss(selectedEles[0], 'background-image', url);
          chiseInstance.changeCss(selectedEles[0], 'background-fit', 'contain');
          chiseInstance.changeCss(selectedEles[0], 'background-image-opacity', '0.7px');
          updateBackgroundDeleteInfo();
        }
      });

      $("#inspector-image-url").on('keydown', function (e) {
        if (e.keyCode == 13 ){
          $(this).trigger("change");
        }
      });

      $("#inspector-image-file").on('click', function () {
        $('#inspector-image-load').trigger('click');  
      });

      $('#inspector-image-load').on('change', function (e, fileObject) {
        
        if ($(this).val() != "" || fileObject) {
          var file = this.files[0] || fileObject;
          chiseInstance.loadBackgroundImage(selectedEles[0], file);
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
        if (chiseInstance.elementUtilities.defaultProperties[sbgnclass] == null) {
          chiseInstance.elementUtilities.defaultProperties[sbgnclass] = {};
        }

        if (appUtilities.undoable) {
          var ur = cy.undoRedo();
          var actions = [];
          
          actions.push({name: "setDefaultProperty", param: {class: sbgnclass, name: 'width', value: selected.width()}});
          actions.push({name: "setDefaultProperty", param: {class: sbgnclass, name: 'height', value: selected.height()}});
          actions.push({name: "setDefaultProperty", param: {class: sbgnclass, name: 'border-width', value: selected.data('border-width')}});
          actions.push({name: "setDefaultProperty", param: {class: sbgnclass, name: 'border-color', value: selected.data('border-color')}});
          actions.push({name: "setDefaultProperty", param: {class: sbgnclass, name: 'background-color', value: selected.data('background-color')}});
          actions.push({name: "setDefaultProperty", param: {class: sbgnclass, name: 'background-opacity', value: selected.data('background-opacity')}});
          
          // Push this action if the node can be multimer
          if (chiseInstance.elementUtilities.canBeMultimer(sbgnclass)) {
            actions.push({name: "setDefaultProperty", param: {class: sbgnclass, name: 'multimer', value: multimer}});
          }
          
          // Push this action if the node can be cloned
          if (chiseInstance.elementUtilities.canBeCloned(sbgnclass)) {
            actions.push({name: "setDefaultProperty", param: {class: sbgnclass, name: 'clonemarker', value: selected._private.data.clonemarker}});
          }
          
          // Push this action if the node can have label
          if (chiseInstance.elementUtilities.canHaveSBGNLabel(sbgnclass)) {
            actions.push({name: "setDefaultProperty", param: {class: sbgnclass, name: 'font-size', value: selected.data('font-size')}});
            actions.push({name: "setDefaultProperty", param: {class: sbgnclass, name: 'font-family', value: selected.data('font-family')}});
            actions.push({name: "setDefaultProperty", param: {class: sbgnclass, name: 'font-weight', value: selected.data('font-weight')}});
            actions.push({name: "setDefaultProperty", param: {class: sbgnclass, name: 'font-style', value: selected.data('font-style')}});
          }
          
          // Push this action if the node can have ports
          if (chiseInstance.elementUtilities.canHavePorts(selected)) {
            actions.push({name: "setDefaultProperty", param: {class: sbgnclass, name: 'ports-ordering', value: chiseInstance.elementUtilities.getPortsOrdering(selected)}});
          }
          
          ur.do("batch", actions);
        }
        else {
          var defaults = chiseInstance.elementUtilities.defaultProperties[sbgnclass];
          defaults['width'] = selected.width();
          defaults['height'] = selected.height();
          defaults['border-width'] = selected.data('border-width');
          defaults['border-color'] = selected.data('border-color');
          defaults['background-color'] = selected.data('background-color');
          defaults['background-opacity'] = selected.data('background-opacity');

          // Set this if the node can be multimer
          if (chiseInstance.elementUtilities.canBeMultimer(sbgnclass)) {
            defaults['multimer'] = multimer;
          }
          
          // Set this if the node can be cloned
          if (chiseInstance.elementUtilities.canBeCloned(sbgnclass)) {
            defaults['clonemarker'] = selected._private.data.clonemarker;
          }
          
          // Set this if the node can have label
          if (chiseInstance.elementUtilities.canHaveSBGNLabel(sbgnclass)) {
            defaults['font-size'] = selected.data('font-size');
            defaults['font-family'] = selected.data('font-family');
            defaults['font-weight'] = selected.data('font-weight');
            defaults['font-style'] = selected.data('font-style');
          }
          
          // Set this if the node can have ports
          if (chiseInstance.elementUtilities.canHavePorts(selected)) {
            defaults['ports-ordering'] = chiseInstance.elementUtilities.getPortsOrdering(selected);
          }
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
        
        // trigger resize event accordingly
        selectedEles.forEach(function(node) {
          cy.trigger('noderesize.resizestart', [null, node]);
          chiseInstance.resizeNodes(node, w, h, useAspectRatio);
          cy.trigger('noderesize.resizeend', [null, node]);
        });

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
      });

      $('#inspector-is-multimer').on('click', function () {
        chiseInstance.setMultimerStatus(selectedEles, $('#inspector-is-multimer').prop('checked'));
      });

      $('#inspector-is-clone-marker').on('click', function () {
        chiseInstance.setCloneMarkerStatus(selectedEles, $('#inspector-is-clone-marker').prop('checked'));
      });

      $("#inspector-border-color").on('change', function () {
        chiseInstance.changeData(selectedEles, "border-color", $("#inspector-border-color").val());
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

      $("#inspector-background-opacity").on('change', function () {
        chiseInstance.changeData(selectedEles, "background-opacity", $("#inspector-background-opacity").val());
      });

      $("#inspector-fill-color").on('change', function () {
        chiseInstance.changeData(selectedEles, "background-color", $("#inspector-fill-color").val());
      });

      $("#inspector-border-width").change( function () {
        chiseInstance.changeData(selectedEles, "border-width", $("#inspector-border-width").val());
      });
      
      // Open font properties dialog
      $("#inspector-font").on('click', function () {
        appUtilities.fontPropertiesView.render(selectedEles);
      });
    }
    else {
      $('#inspector-set-as-default-button').on('click', function () {
        var sbgnclass = selectedEles.data('class');
        if (chiseInstance.elementUtilities.defaultProperties[sbgnclass] == null) {
          chiseInstance.elementUtilities.defaultProperties[sbgnclass] = {};
        }

        if (appUtilities.undoable) {
          var ur = cy.undoRedo();
          var actions = [];
          actions.push({name: "setDefaultProperty", param: {class: sbgnclass, name: 'width', value: selectedEles.data('width')}});
          actions.push({name: "setDefaultProperty", param: {class: sbgnclass, name: 'line-color', value: selectedEles.data('line-color')}});
          ur.do("batch", actions);
        }
        else {
          var defaults = chiseInstance.elementUtilities.defaultProperties[sbgnclass];
          defaults['width'] = selectedEles.data('width');
          defaults['line-color'] = selectedEles.data('line-color');
        }
      });

      $("#inspector-line-color").on('change', function () {
        chiseInstance.changeData(selectedEles, "line-color", $("#inspector-line-color").val());
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

module.exports = inspectorUtilities;
