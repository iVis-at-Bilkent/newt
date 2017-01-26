var inspectorUtilities = {};

// Define inspectorUtilities.fontProperties on document ready
$(document).ready(function () {
  inspectorUtilities.fontProperties = new FontProperties({
    el: '#font-properties-table'
  });
});

inspectorUtilities.fillInspectorStateAndInfos = function (nodes, stateAndInfos, width) {
  //first empty the state variables and infos data in inspector
  $("#inspector-state-variables").html("");
  $("#inspector-unit-of-informations").html("");
  
  for (var i = 0; i < stateAndInfos.length; i++) {
    var state = stateAndInfos[i];
    if (state.clazz == "state variable") {
      $("#inspector-state-variables").append("<div><input type='text' class='just-added-inspector-input inspector-state-variable-value inspector-input-box' style='width: "
              + width / 5 + "px;' value='" + (state.state.value || '') + "'/>"
              + "<span width='" + width / 5 + "'px>@</span>"
              + "<input type='text' class='just-added-inspector-input inspector-state-variable-variable inspector-input-box' style='width: "
              + width / 2.5 + "px;' value='" + (state.state.variable || '')
              + "'/><img width='12px' height='12px' class='just-added-inspector-input inspector-delete-state-and-info inspector-input-box' src='app/img/delete.png'></img></div>");

      $(".inspector-state-variable-value").unbind('change').on('change', function () {
        var param = {
          index: i + 0,
          value: $(this).val(),
          type: 'value',
          nodes: nodes,
          width: width
        };
        
        cy.undoRedo().do("changeStateOrInfoBox", param);
      });

      $(".inspector-state-variable-variable").unbind('change').on('change', function () {
        var param = {
          index: i + 0,
          value: $(this).val(),
          type: 'variable',
          nodes: nodes,
          width: width
        };
        
        cy.undoRedo().do("changeStateOrInfoBox", param);
      });
    }
    else if (state.clazz == "unit of information") {
      var total = width / 1.25;
      $("#inspector-unit-of-informations").append("<div><input type='text' class='just-added-inspector-input inspector-unit-of-information-label inspector-input-box' style='width: "
              + total + "px;' value='" + (state.label.text || '')
              + "'/><img width='12px' height='12px' class='just-added-inspector-input inspector-delete-state-and-info' src='app/img/delete.png'></img></div>");

      $(".inspector-unit-of-information-label").unbind('change').on('change', function () {
        var param = {
          index: i + 0,
          value: $(this).val(),
          nodes: nodes,
          width: width
        };
        
        cy.undoRedo().do("changeUnitOfInformation", param);
      });
    }

    $(".inspector-delete-state-and-info").unbind('click').click(function (event) {
      var param = {
        index: i + 0,
        nodes: nodes,
        width: width
      };
      
      cy.undoRedo().do("removeStateOrInfoBox", param);
    });

//    $(".just-added-inspector-input").data("state", state);
    $(".just-added-inspector-input").removeClass("just-added-inspector-input");
  }
  $("#inspector-state-variables").append("<img id='inspector-add-state-variable' src='app/img/add.png'/>");
  $("#inspector-unit-of-informations").append("<img id='inspector-add-unit-of-information' src='app/img/add.png'/>");

  $("#inspector-add-state-variable").click(function () {
    var obj = {};
    obj.clazz = "state variable";

    obj.state = {
      value: "",
      variable: ""
    };
    obj.bbox = {
      w: 53,
      h: 18
    };
    var param = {
      obj: obj,
      nodes: nodes,
      width: width
    };
    
    cy.undoRedo().do("addStateOrInfoBox", param);
  });

  $("#inspector-add-unit-of-information").click(function () {
    var obj = {};
    obj.clazz = "unit of information";
    obj.label = {
      text: ""
    };
    obj.bbox = {
      w: 53,
      h: 18
    };
    var param = {
      obj: obj,
      nodes: nodes,
      width: width
    };
    
    cy.undoRedo().do("addStateOrInfoBox", param);
  });
}

inspectorUtilities.handleSBGNInspector = function () {
  var selectedEles = cy.elements(":selected");
  
  if(selectedEles.length == 0){
    $("#sbgn-inspector").html("");
    return;
  }
  
  var width = $("#sbgn-inspector").width() * 0.45;
  
  var allNodes = elementUtilities.allAreNode(selectedEles);
  var allEdges = elementUtilities.allAreEdge(selectedEles);
  
  if (allNodes || allEdges) {
    var sbgnlabel = elementUtilities.getCommonLabel(selectedEles);
    if (sbgnlabel == null) {
      sbgnlabel = "";
    }

    var classInfo = elementUtilities.getCommonSBGNClass(selectedEles);
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

    var title = classInfo=="" ? "Visual Properties":classInfo + " Visual Properties";

    var buttonwidth = width;
    if (buttonwidth > 50) {
      buttonwidth = 50;
    }

    var html = "<div width='100%' style='text-align: center; color: black; font-weight: bold; margin-bottom: 5px;'>" + title + "</div><table cellpadding='0' cellspacing='0' width='100%' align= 'center'>";
    var type;
    var fillStateAndInfos;
    var multimerCheck;
    var clonedCheck;
    var commonIsMultimer;
    var commonIsCloned;
    var commonStateAndInfos;
    var commonSBGNCardinality;
    
    if (allNodes) {
      type = "node";
      
      var borderColor = elementUtilities.getCommonBorderColor(selectedEles);
      borderColor = borderColor?borderColor:'#FFFFFF';
      
      var backgroundColor = elementUtilities.getCommonFillColor(selectedEles);
      backgroundColor = backgroundColor?backgroundColor:'#FFFFFF';
      
      var borderWidth = elementUtilities.getCommonBorderWidth(selectedEles);
      
      var backgroundOpacity = elementUtilities.getCommonBackgroundOpacity(selectedEles);
      backgroundOpacity = backgroundOpacity?backgroundOpacity:0.5;
      
      var nodeWidth = elementUtilities.getCommonNodeWidth(selectedEles);

      var nodeHeight = elementUtilities.getCommonNodeHeight(selectedEles);
      
      if (elementUtilities.allCanHaveSBGNLabel(selectedEles)) {
        html += "<tr><td style='width: " + width + "px; text-align:right; padding-right: 5px;'>" + "<font class='sbgn-label-font'>Label</font>" + "</td><td style='padding-left: 5px;'>"
              + "<input id='inspector-label' class='inspector-input-box' type='text' style='width: " + width / 1.25 + "px;' value='" + sbgnlabel
              + "'/>" + "</td></tr>";
      }
      
      if( selectedEles.filter(':parent').length > 0 ) {
        html += "<tr><td style='width: " + width + "px; text-align:right; padding-right: 5px;'>" + "<font class='sbgn-label-font'>Width</font>" + "</td><td style='padding-left: 5px;'>"
                + "<input id='inspector-node-width' class='inspector-input-box float-input' type='text' min='0' style='width: " + buttonwidth + "px;'";

        if (nodeWidth) {
          html += " value='" + nodeWidth + "'";
        }

        html += "/>" + "</td></tr>";

        html += "<tr><td style='width: " + width + "px; text-align:right; padding-right: 5px;'>" + "<font class='sbgn-label-font'>Height</font>" + "</td><td style='padding-left: 5px;'>"
                + "<input id='inspector-node-height' class='inspector-input-box float-input' type='text' min='0' style='width: " + buttonwidth + "px;'";

        if (nodeHeight) {
          html += " value='" + nodeHeight + "'";
        }

        html += "/>";
        
        if( elementUtilities.someMustNotBeSquare(selectedEles) ) {
          var imageName;
          var title;
          if(window.nodeResizeUseAspectRatio) {
            imageName = "lock.png";
            title = "unlock aspect ratio";
          }
          else {
            imageName = "open-lock.png";
            title = "lock aspect ratio";
          }
          
          html += "<img id='inspector-node-sizes-aspect-ratio' style='vertical-align: top; margin-left: 5px;' src='app/img/";
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
              + "<input id='inspector-border-width' class='inspector-input-box float-input' type='text' min='0' style='width: " + buttonwidth + "px;'";
      
      if(borderWidth){
        html += " value='" + parseFloat(borderWidth) + "'";
      }
      
      html += "/>" + "</td></tr>";
      
      html += "<tr><td style='width: " + width + "px; text-align:right; padding-right: 5px;'>" + "<font class='sbgn-label-font'>Fill Opacity</font>" + "</td><td style='padding-left: 5px;'>"
              + "<input id='inspector-background-opacity' class='inspector-input-box' type='range' step='0.01' min='0' max='1' style='width: " + buttonwidth + "px;' value='" + parseFloat(backgroundOpacity)
              + "'/>" + "</td></tr>"; 
      
      if (elementUtilities.allCanHaveSBGNLabel(selectedEles)) {
        html += "<tr><td style='width: " + width + "px; text-align:right; padding-right: 5px;'>" + "<font class='sbgn-label-font'>Font</font>" + "</td><td style='padding-left: 5px;'>"
              + "<label id='inspector-font' class='inspector-input-box' style='width: " + buttonwidth + "px;'>"
              + "..." + "<label/>" + "</td></tr>"; 
      }
      
      commonStateAndInfos = elementUtilities.getCommonStateAndInfos(selectedEles);
      
      if(commonStateAndInfos){
        if (elementUtilities.allCanHaveStateVariable(selectedEles)) {
          fillStateAndInfos = true;
          
          html += "<tr><td colspan='2'><hr class='inspector-divider'></td></tr>";
          html += "<tr><td style='width: " + width + "px; text-align:right; padding-right: 5px;'>" + "<font class='sbgn-label-font'>State Variables</font>" + "</td>"
                  + "<td id='inspector-state-variables' style='padding-left: 5px; width: '" + width + "'></td></tr>";
        }

        if (elementUtilities.canHaveUnitOfInformation(selectedEles)) {
          fillStateAndInfos = true;
          
          html += "<tr><td colspan='2'><hr class='inspector-divider'></td></tr>";
          html += "<tr><td style='width: " + width + "px; text-align:right; padding-right: 5px;'>" + "<font class='sbgn-label-font'>Units of Information</font>" + "</td>"
                  + "<td id='inspector-unit-of-informations' style='padding-left: 5px; width: '" + width + "'></td></tr>";
        }
      }
      
      commonIsMultimer = elementUtilities.getCommonIsMultimer(selectedEles);
      commonIsCloned = elementUtilities.getCommonIsCloned(selectedEles);
//      multimerCheck = ( commonIsMultimer !== null ) && elementUtilities.allCanBeMultimer(selectedEles);
//      clonedCheck = ( commonIsCloned !== null ) && elementUtilities.allCanBeCloned(selectedEles);
      multimerCheck = elementUtilities.allCanBeMultimer(selectedEles);
      clonedCheck = elementUtilities.allCanBeCloned(selectedEles);
      
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
    }
    else {
      type = "edge";
      
      var commonLineColor = elementUtilities.getCommonLineColor(selectedEles);
      commonLineColor = commonLineColor?commonLineColor:'#FFFFFF';
      
      var commonLineWidth = elementUtilities.getCommonLineWidth(selectedEles);
      
      html += "<tr><td style='width: " + width + "px; text-align:right; padding-right: 5px;'>" + "<font class='sbgn-label-font'>Fill Color</font>" + "</td><td style='padding-left: 5px;'>"
              + "<input id='inspector-line-color' class='inspector-input-box' type='color' style='width: " + buttonwidth + "px;' value='" + commonLineColor
              + "'/>" + "</td></tr>";

      html += "<tr><td style='width: " + width + "px; text-align:right; padding-right: 5px;'>" + "<font class='sbgn-label-font'>Width</font>" + "</td><td style='padding-left: 5px;'>"
              + "<input id='inspector-width' class='inspector-input-box float-input' type='text' min='0' style='width: " + buttonwidth + "px;'";
      
      if(commonLineWidth){
        html += " value='" + parseFloat(commonLineWidth) + "'";
      }
      
      html += "/>" + "</td></tr>";
      
      if (elementUtilities.canHaveSBGNCardinality(selectedEles)) {
        var cardinality = elementUtilities.getCommonSBGNCardinality(selectedEles);
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
    html += "</table>";
    
    if(selectedEles.length == 1){
      var setAsDefaultTitle = "Set as Default for " + classInfo;
      html += "<div style='text-align: center; margin-top: 5px;'><button style='align: center;' id='inspector-set-as-default-button'"
            + ">" + setAsDefaultTitle + "</button></div>";
    }
    
    html += "<hr class='inspector-divider' style='border-width: 3px;'>";
    
    if (selectedEles.length === 1) {
      var geneClass = selectedEles[0]._private.data.sbgnclass;
      
      if (geneClass === 'macromolecule' || geneClass === 'nucleic acid feature' ||
          geneClass === 'unspecified entity') {
    
          html += "<div style='align: center;text-align: center;'><a style='color: black; font-weight: bold;' class='accordion-toggle collapsed' data-toggle='collapse' data-target='#biogene-collapsable'>Properties from EntrezGene</a></div>"
    
          html += "<div style='margin-top: 5px;align: center;text-align: center;' id='biogene-collapsable' class='collapse'>";
          html += "<div style='padding-left: 3px;' id='biogene-title'></div>";
          html += "<div id='biogene-container'></div>";
          html += "</div>";
          html += "<hr class='inspector-divider'>";
      }
    }
    
    $("#sbgn-inspector").html(html);
    if(selectedEles.length === 1) {
      fillBioGeneContainer(selectedEles[0]);
    }

    if (type == "node") {
      if (fillStateAndInfos) {
        this.fillInspectorStateAndInfos(selectedEles, commonStateAndInfos, width);
      }

      if (multimerCheck && commonIsMultimer) {
        $('#inspector-is-multimer').attr('checked', true);
      }

      if (clonedCheck && commonIsCloned) {
        $('#inspector-is-clone-marker').attr('checked', true);
      }

      $('#inspector-set-as-default-button').on('click', function () {
        var multimer;
        var selected = selectedEles[0];
        var sbgnclass = selected.data('sbgnclass');
        if (sbgnclass.endsWith(' multimer')) {
          sbgnclass = sbgnclass.replace(' multimer', '');
          multimer = true;
        }
        if (elementUtilities.defaultSizes[sbgnclass] == null) {
          elementUtilities.defaultSizes[sbgnclass] = {};
        }
        var defaults = elementUtilities.defaultSizes[sbgnclass];
        defaults.width = selected.width();
        defaults.height = selected.height();
        defaults.sbgnclonemarker = selected._private.data.sbgnclonemarker;
        defaults.multimer = multimer;
        defaults['border-width'] = selected.css('border-width');
        defaults['border-color'] = selected.data('borderColor');
        defaults['background-color'] = selected.css('background-color');
//        defaults['font-size'] = selected.css('font-size');
        defaults['background-opacity'] = selected.css('background-opacity');
        defaults.labelsize = selected.data('labelsize');
        defaults.fontfamily = selected.data('fontfamily');
        defaults.fontweight = selected.data('fontweight');
        defaults.fontstyle = selected.data('fontstyle');
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
        
        var useAspectRatio = window.nodeResizeUseAspectRatio;

        var param = {
          nodes: selectedEles,
          width: w,
          height: h,
          useAspectRatio: useAspectRatio,
          performOperation: true
        };
        
        cy.undoRedo().do("resizeNodes", param);
      });

      $('#inspector-node-sizes-aspect-ratio').on('click', function() {
        if(window.nodeResizeUseAspectRatio == null) {
          window.nodeResizeUseAspectRatio = false;
        }
        
        window.nodeResizeUseAspectRatio = !window.nodeResizeUseAspectRatio;
        
        // refresh image
        if (window.nodeResizeUseAspectRatio) {
          imageName = "lock.png";
          title = "unlock aspect ratio";
        }
        else {
          imageName = "open-lock.png";
          title = "lock aspect ratio";
        }
        
        $(this).attr('src', 'app/img/' + imageName);
        $(this).attr('title', title);
        
        cy.style().update();
      });

      $('#inspector-is-multimer').on('click', function () {
        var param = {
          status: $('#inspector-is-multimer').prop('checked'),
          nodes: selectedEles,
          firstTime: true
        };
        
        cy.undoRedo().do("setMultimerStatus", param);
      });

      $('#inspector-is-clone-marker').on('click', function () {
        var param = {
          status: $('#inspector-is-clone-marker').prop('checked'),
          nodes: selectedEles,
          firstTime: true
        };
        
        cy.undoRedo().do("setCloneMarkerStatus", param);
      });

      $("#inspector-border-color").on('change', function () {
        var param = {
          eles: selectedEles,
          value: $("#inspector-border-color").val(),
          name: "border-color",
          firstTime: true
        };
        
        cy.undoRedo().do("changeCss", param);
      });

      $("#inspector-label").on('change', function () {
        var param = {
          nodes: selectedEles,
          label: $(this).val(),
          firstTime: true
        };
        
        cy.undoRedo().do("changeNodeLabel", param);
      });

      $("#inspector-background-opacity").on('change', function () {
        var param = {
          eles: selectedEles,
          value: $("#inspector-background-opacity").val(),
          name: "background-opacity",
          firstTime: true
        };
        
        cy.undoRedo().do("changeCss", param);
      });

      $("#inspector-fill-color").on('change', function () {
        var param = {
          eles: selectedEles,
          value: $("#inspector-fill-color").val(),
          name: "background-color",
          firstTime: true
        };
        
        cy.undoRedo().do("changeCss", param);
      });

      $("#inspector-border-width").change( function () {
        var param = {
          eles: selectedEles,
          value: $("#inspector-border-width").val(),
          name: "border-width",
          firstTime: true
        };
        
        cy.undoRedo().do("changeCss", param);
      });
      
      $("#inspector-font").on('click', function () {
        inspectorUtilities.fontProperties.render(selectedEles);
      });
    }
    else {
      $('#inspector-set-as-default-button').on('click', function () {
        if (elementUtilities.defaultSizes[selected.data('sbgnclass')] == null) {
          elementUtilities.defaultSizes[selected.data('sbgnclass')] = {};
        }
        var defaults = elementUtilities.defaultSizes[selected.data('sbgnclass')];
        defaults['line-color'] = selected.data('lineColor');
        defaults['width'] = selected.css('width');
      });

      $("#inspector-line-color").on('change', function () {
        var param = {
          eles: selectedEles,
          value: $("#inspector-line-color").val(),
          name: "line-color",
          firstTime: true
        };
        
        cy.undoRedo().do("changeCss", param);
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
        var param = {
          eles: selectedEles,
          value: data,
          name: "cardinality",
          firstTime: true
        };
        
        cy.undoRedo().do("changeData", param);
      });

      $("#inspector-width").change( function () {
        var param = {
          eles: selectedEles,
          value: $("#inspector-width").val(),
          name: "width",
          firstTime: true
        };
        
        cy.undoRedo().do("changeCss", param);
      });
    }
  }
  else {
    $("#sbgn-inspector").html("");
  }
};