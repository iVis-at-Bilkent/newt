var introJs = require('intro.js');

var tutorial = {};

// method for introducing Newt at the opening and also from Help->Quick Tutorial menu 
tutorial.introduction = function(checkCookie){ 
  // assign introCookie(cookie for "don't show again")
  var introCookie = (getCookie("showIntro") != "" ? true : false);
  
  // if we need to check cookie existance and introCookie is set to true, don't show intro  
  if(checkCookie && introCookie){
    return;
  }
  
  var intro = introJs();
 
  // set the current step
  var currentStep = 0;
  if(getCookie("stepNo") != ""){
    currentStep = parseInt(getCookie("stepNo"));
  }

  // necessary style changes before starting introduction
  setStyleBeforeIntroduction();

  // introduction content
  intro.setOptions({
    steps: [
      { 
        intro: '<h2 style="text-align:center; margin-top: 10px;"><b style="vertical-align:middle; color:#0B9BCD;">Welcome to  </b><img src="app/img/newt-logo.png"> </h2>\n\
                <hr style="margin:10px auto;">\n\
                <iframe style="border: 1px solid #0B9BCD; box-sizing: content-box" width="560" height="315" src="https://www.youtube-nocookie.com/embed/FUf-aqKO0_g" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe> \n\
                <br><p style="text-align:center; margin: 0px; font-size: 12px;">Newt Basics</p>'

      },
      { 
        intro: '<h2 style="text-align:center; margin-top: 10px;"><b style="vertical-align:middle; color:#0B9BCD;">Welcome to  </b><img src="app/img/newt-logo.png"> </h2>\n\
                <hr style="margin:10px auto;">\n\
                <iframe style="border: 1px solid #0B9BCD; box-sizing: content-box" width="560" height="315" src="https://www.youtube-nocookie.com/embed/BQ8RDtpzLsw" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe> \n\
                <br><p style="text-align:center; margin: 0px; font-size: 12px;">Newt Advanced</p>'
      },
      {
        intro: '<h2 style="text-align:center; margin-top: 10px;"><b style="vertical-align:middle; color:#0B9BCD;">Welcome to  </b><img src="app/img/newt-logo.png"> </h2>\n\
                <hr style="margin:10px auto;">\n\
                <iframe style="border: 1px solid #0B9BCD; box-sizing: content-box" width="560" height="315" src="https://www.youtube-nocookie.com/embed/LmTGgluJN0U" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe> \n\
                <br><p style="text-align:center; margin: 0px; font-size: 12px;">Newt Complexity Management</p>'               
      },
      {
        intro: '<h2 style="text-align:center; margin-top: 10px;"><b style="vertical-align:middle; color:#0B9BCD;">Welcome to  </b><img src="app/img/newt-logo.png"> </h2>\n\
                <hr style="margin:10px auto;">\n\
                <iframe style="border: 1px solid #0B9BCD; box-sizing: content-box" width="560" height="315" src="https://www.youtube-nocookie.com/embed/Ie8tjLjJk8k" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe> \n\
                <br><p style="text-align:center; margin: 0px; font-size: 12px;">Newt Layout</p>'               
      }
    ],
    showStepNumbers: false,
    overlayOpacity: 0.5
  });

  // start the introduction
  intro.goToStepNumber(currentStep+1).start();  
  
  // necessary style changes at the beginning of the introduction
  setStyleDuringIntroduction(intro, introCookie);

  // set cookies accordingly before exit
  intro.onbeforeexit(function() {
    if(document.getElementsByClassName('introCheck')[0].checked) {
      setCookie("showIntro", false, 180);
    }
    else {
      setCookie("showIntro", "", 180);
    }
    setCookie("stepNo", this._currentStep, 180);
  });
};

// method for introducing the user interface of Newt. Can be opened from Help->UI Guide menu 
tutorial.UIGuide = function(){
  var intro = introJs();
  
  // necessary style changes before starting UIGuide
  setStyleBeforeUIGuide();
  
  // UIGuide content
  intro.setOptions({
    steps: [
      { 
        intro: '<h2 style="text-align:center; margin-top: 10px;"><b style="vertical-align:middle; color: #0B9BCD;">UI Guide</b></h2>\n\
                <p style="text-align:center; font-size:12px; margin: 30px 0px">This is a step-by-step UI guide for Newt.'
      },
      {
        element: document.getElementsByClassName('nav navbar-nav navbar-left')[0],
        intro: '<p style="font-size:12px; margin:0px;">Menubar</p><hr style="margin: 5px auto;">\n\
                <p style="font-size:12px; margin:0px;">Menubar located at the top of the Newt editor is where all capabilities of the tool is assembled in an organized manner.</p>'
      },
      {
        element: document.getElementsByClassName('inside-menu')[0],
        intro: '<p style="font-size:12px; margin:0px;">This group is for file operations</p><hr style="margin: 5px auto;">\n\
                <p style="font-size:12px; margin:0px;"><b>- New File<br>- Load File<br>- Save File</b></p>'
      },
      {
        element: document.getElementsByClassName('inside-menu')[1],
        intro: '<p style="font-size:12px; margin:0px;">This group is for edit operations</p><hr style="margin: 5px auto;">\n\
                <p style="font-size:12px; margin:0 0 5px;">Newt can be in one of the following modes at any given time:<br>\n\
                <b>- Select/Edit: </b>Select a particular object to edit its properties.<br>\n\
                <b>- Add Node: </b>Create a new node with type that is currently selected in the palette.<br>\n\
                <b>- Add Edge: </b>Create a new edge with type that is currently selected in the palette.<br>\n\
                <b>- Activate Marquee Zoom: </b>Mark the zoom area by using Shift + left click and drag.</p>\n\
                <p style="font-size:12px; margin:0px;">Remaining edit operations:<br>\n\
                <b>- Delete Selected Simple</b><br>\n\
                <b>- Delete Selected Smart: </b>Perform deletion on selected objects and associated neighbors, leaving the map intact w.r.t. the map type.<br>\n\
                <b>- Validate Map</b><br>\n\
                <b>- Undo</b><br>\n\
                <b>- Redo</b></p>'             
      },
      {
        element: document.getElementsByClassName('inside-menu')[2],
        intro: '<p style="font-size:12px; margin:0px;">This group is for view operations</p><hr style="margin: 5px auto;">\n\
                <p style="font-size:12px; margin:0px;"><b>- Hide Selected<br>- Show Selected<br>- Collapse Selected<br>- Expand Selected<br>\n\
                - Align to First Selected<br>- Enable Grid<br>- Enable Guidelines<br>- Map Properties</b></p>'
      },
      {
        element: document.getElementsByClassName('inside-menu')[3],
        intro: '<p style="font-size:12px; margin:0px;">This group is for highlight operations</p><hr style="margin: 5px auto;">\n\
                <p style="font-size:12px; margin:0px;"><b>- Search<br>\n\
                - Highlight Selected<br>- Remove Highlights</b></p>'
      },
      {
        element: document.getElementsByClassName('inside-menu')[4],
        intro: '<p style="font-size:12px; margin:0px;">This group is for layout operations</p><hr style="margin: 5px auto;">\n\
                <p style="font-size:12px; margin:0px;"><b>- Perform Layout<br>- Perform Static Layout<br>- Layout Properties</b></p>'
      },
      {
        element: document.getElementsByClassName('inside-menu')[5],
        intro: '<p style="font-size:12px; margin:0px;">This group is for query operations</p><hr style="margin: 5px auto;">\n\
                <p style="font-size:12px; margin:0px;"><b>- Perform PC Query: </b>Perform a PathwayCommons query to get a map of interest between specified genes.'
      },
      {
        element: document.getElementsByClassName('inside-menu')[6],
        intro: '<p style="font-size:12px; margin:0px;">This group is for getting help</p><hr style="margin: 5px auto;">\n\
                <p style="font-size:12px; margin:0px;"><b>- Quick Help<br>- About</b></p>'
      },
      {
        element: document.getElementById('sbgn-inspector'),
        intro: '<p style="font-size:12px; margin:0px;">Object Properties</p><hr style="margin: 5px auto;">\n\
                <p style="font-size:12px; margin:0px;">This tab is activated when a particular object is selected by left-clicking on it, \n\
                enabling inspection and editing of the style of the underlying object from border color to font type and size to state variables and custom annotations.\n\
                Multiple objects can be selected and edited simultaneously.</p>'
      },
      {
        element: document.getElementById('sbgn-inspector'),
        intro: '<p style="font-size:12px; margin:0px;">Map Properties</p><hr style="margin: 5px auto;">\n\
                <p style="font-size:12px; margin:0px;">Map tab is for configuring the drawing of the map. Numerous settings of a map from general \n\
                properties like compound paddings to label related settings such as whether to fit labels to nodes, to color scheme can be set using this tab. \n\
                Name and description of the map can also be set using this panel. Experiment data may be viewed and manipulated via this panel as well.</p>'
      },
      {
        element: document.getElementById('sbgn-inspector'),
        intro: '<p style="font-size:12px; margin:0px;">Palette</p><hr style="margin: 5px auto;">\n\
                <p style="font-size:12px; margin:0px;">  \n\
                Clicking on a node or an edge puts you in node/edge creation mode, and upon creation of the node/edge, Newt returns to selection (Select / Edit) mode. \n\
                Clicking twice on a tool, on the other hand, puts you in sustained mode so that the user can create multiple objects of that type in a row.\n\
                When in Select / Edit mode, nodes can also be created by simply clicking on a particular node/edge and dragging onto the canvas.</p><br >\n\
                <p style="font-size:12px; margin:0px;">\n\
                A Console tab is shown on demand for operations such as map validation.</p>'
      }
    ],
    showStepNumbers: false,
    disableInteraction: true,
    overlayOpacity: 0.5
  });
  
  // some necessary changes between steps
  intro.onafterchange(function () {  
    if(this._currentStep == 0){
      var element = document.getElementsByClassName("introjs-tooltip")[0];
      element.style.border = "15px solid white"; 
      element.style.borderRadius = "6px"; 
      element.style.boxShadow = "inset 0px 0px 0px 2px #0B9BCD"; 
    } 
    if(this._currentStep == 1){
      var element = document.getElementsByClassName("introjs-tooltip")[0];
      element.style.border = "0px"; 
      element.style.borderRadius = "4px";
      element.style.boxShadow = "rgba(0, 0, 0, 0.4) 0px 1px 10px"; 
    } 
    if(this._currentStep == 9){
      if (!$('#inspector-style-tab').hasClass('active')) {
        $('#inspector-style-tab a').tab('show');
      }    
    } 
    if(this._currentStep == 10){
      if (!$('#inspector-map-tab').hasClass('active')) {
        $('#inspector-map-tab a').tab('show');
      }    
    }     
    if(this._currentStep == 11){
      if (!$('#inspector-palette-tab').hasClass('active')) {
        $('#inspector-palette-tab a').tab('show');
      } 
    }
  });
  // start the UIGuide
  intro.start();
};

function setStyleBeforeIntroduction(){
  var ss = document.styleSheets;
  for (var i=0; i<ss.length; i++) {
    var rules = ss[i].cssRules || ss[i].rules;
    for (var j=0; j<rules.length; j++) {
      if (rules[j].selectorText === ".introjs-overlay") {
        rules[j].style.background = "#000";
      }
      if (rules[j].selectorText === ".introjs-tooltip") {
        rules[j].style.maxWidth = "600px";
        rules[j].style.borderRadius = "4px"; 
        rules[j].style.boxShadow = "rgba(0, 0, 0, 0.4) 0px 1px 10px";
      }
      if (rules[j].selectorText === ".introjs-tooltipbuttons") {
        rules[j].style.textAlign = "right";
      }
      if (rules[j].selectorText === ".introjs-button") {
        rules[j].style.font = "12px/normal sans-serif";
      }
      if (rules[j].selectorText === ".introjsFloatingElement") {
        rules[j].style.top = "50%";
      }
    }
  }
  
  setStyleRule('.introjs-tooltip', 'opacity: 1 !important');
  setStyleRule('.introjs-tooltip', 'display: block !important');
  setStyleRule('.introjs-tooltip', 'border: 0px solid white');
  setStyleRule('.introjsFloatingElement', 'margin-top:0px !important');
};

function setStyleDuringIntroduction(intro, isChecked) {
  // function to add "Don't show again" checkbox
  var addCheckbox = function(isChecked){
    var label = document.createElement("Label");
    label.style.fontWeight="initial";
    label.style.float="left";
    label.style.marginTop="10px";

    var checkbox = document.createElement("Input");
    checkbox.setAttribute("type", "checkbox");
    checkbox.style.verticalAlign="text-bottom";
    checkbox.classList.add("introCheck");

    label.appendChild(checkbox);
    var labelHTML = label.innerHTML;
    label.innerHTML = labelHTML + " Don't show again";
    label.style.fontSize = "12px";
    buttonLayer.insertBefore(label, buttonLayer.childNodes[0]);

    if(isChecked) {
      document.getElementsByClassName('introCheck')[0].checked = true;
    }
    else {
      document.getElementsByClassName('introCheck')[0].checked = false;     
    }
  };
  
  var buttonLayer = document.getElementsByClassName("introjs-tooltipbuttons")[0];
  var showWarning = (getCookie("showWarning") == "" ? true : false);
  // check whether we need to show cookie warning
  if(showWarning){
    buttonLayer.style.display = "none";
    var cookieWarningDiv = document.createElement('div');
    cookieWarningDiv.className = "introjs-tooltipbuttons";
    cookieWarningDiv.style.textAlign = "right";
    cookieWarningDiv.innerHTML = '<p style="font-size:11px; margin: 15px 0px 0px 0px; float:left;">\n\
                                  <b>Newt uses cookies to maintain progress on Quick Tutorial and for Google Analytics support.</b></p>\n\
                                  <a  id="dismissButton" class="introjs-button introjs-nextbutton" role="button" tabindex="0">Dismiss</a>';
    var tooltip = document.getElementsByClassName("introjs-tooltip")[0];
    tooltip.appendChild(cookieWarningDiv);
    intro.setOptions({
      exitOnEsc: false,
      exitOnOverlayClick: false
    });

    var dismissButton = document.getElementById("dismissButton");
    dismissButton.onclick = function() {
      buttonLayer.style.display = "block";
      buttonLayer.style.textAlign = "right";
      cookieWarningDiv.style.display = "none";
      setCookie("showWarning", false, 180);
      addCheckbox(isChecked);
      intro.setOptions({
        exitOnEsc: true,
        exitOnOverlayClick: true
      });
    };
  }
  else {
    addCheckbox(isChecked);
  }
 
};

function setStyleBeforeUIGuide(){
  var ss = document.styleSheets;
  for (var i=0; i<ss.length; i++) {
    var rules = ss[i].cssRules || ss[i].rules;
    for (var j=0; j<rules.length; j++) {
      if (rules[j].selectorText === ".introjs-overlay") {
        rules[j].style.background = "#000";
      }
      if (rules[j].selectorText === ".introjs-tooltip") {
        rules[j].style.maxWidth = "400px";
        rules[j].style.minWidth = "320px";
        rules[j].style.opacity = "";
        rules[j].style.display = "";
        rules[j].style.borderRadius = "6px"; 
        rules[j].style.boxShadow = "inset 0px 0px 0px 2px #0B9BCD";
      }
      if (rules[j].selectorText === ".introjs-tooltipbuttons") {
        rules[j].style.textAlign = "center";
      }
      if (rules[j].selectorText === ".introjs-button") {
        rules[j].style.font = "12px/normal sans-serif";
      }
      if (rules[j].selectorText === ".introjsFloatingElement") {
        rules[j].style.top = "0%";
      }
    }
  }

  setStyleRule('.introjsFloatingElement', 'margin-top:144px !important');
  setStyleRule('.introjs-tooltip', 'border: 15px solid white');
};

setStyleRule = function(selector, rule) {
  var stylesheet = document.styleSheets[(document.styleSheets.length - 1)];

  for( var i in document.styleSheets ){
    if( document.styleSheets[i].href && document.styleSheets[i].href.indexOf("introjs.css") ) {
      stylesheet = document.styleSheets[i];
      break;
    }
  }

  if( stylesheet.addRule ){
    stylesheet.addRule(selector, rule);
  } else if( stylesheet.insertRule ){
    stylesheet.insertRule(selector + ' { ' + rule + ' }', stylesheet.cssRules.length);
  }
};

function setCookie(cname, cvalue, exdays) {
  var d = new Date();
  d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
  var expires = "expires="+d.toUTCString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
  var name = cname + "=";
  var ca = document.cookie.split(';');
  for(var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') {
        c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
    }
  }
  return "";
}

module.exports = tutorial;