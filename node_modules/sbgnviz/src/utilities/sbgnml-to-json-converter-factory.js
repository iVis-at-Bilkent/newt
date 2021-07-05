var libsbgnjs = require('libsbgn.js');
var parseString = require('xml2js').parseString;
var libUtilities = require('./lib-utilities');
var libs = libUtilities.getLibs();
var jQuery = $ = libs.jQuery;
var classes = require('./classes');

module.exports = function () {
  var elementUtilities, graphUtilities, handledElements,mainUtilities;

  function sbgnmlToJson (param) {
    optionUtilities = param.optionUtilities;
    options = optionUtilities.getOptions();
    elementUtilities = param.elementUtilities;
    graphUtilities = param.graphUtilities;
    mainUtilities = param.mainUtilities;

    handledElements = {};

    elementUtilities.elementTypes.forEach( function( type ) {
      handledElements[ type ] = true;
    } );
  }

  sbgnmlToJson.insertedNodes = {};

  sbgnmlToJson.map = undefined;
  sbgnmlToJson.calculatedCompoundPadding = undefined;

  sbgnmlToJson.getAllCompartments = function (glyphList) {
    var compartments = [];

    for (var i = 0; i < glyphList.length; i++) {
      if (glyphList[i].class_ == 'compartment') {
        var compartment = glyphList[i];
        var bbox = compartment.bbox;
        compartments.push({
          'x': parseFloat(bbox.x),
          'y': parseFloat(bbox.y),
          'w': parseFloat(bbox.w),
          'h': parseFloat(bbox.h),
          'id': compartment.id
        });
      }
    }

    compartments.sort(function (c1, c2) {
      if (c1.h * c1.w < c2.h * c2.w) {
        return -1;
      }
      if (c1.h * c1.w > c2.h * c2.w) {
        return 1;
      }
      return 0;
    });

    return compartments;
  };

  sbgnmlToJson.isInBoundingBox = function (bbox1, bbox2) {
    if (bbox1.x > bbox2.x &&
        bbox1.y > bbox2.y &&
        bbox1.x + bbox1.w < bbox2.x + bbox2.w &&
        bbox1.y + bbox1.h < bbox2.y + bbox2.h) {
      return true;
    }
    return false;
  };

  sbgnmlToJson.bboxProp = function (ele) {

    if(ele.bboxCalculated){
      return ele.bbox;
    }

    ele.bboxCalculated = true;
    var childNodes = ele.glyphMembers;
    //exclude state variables and units of information from child members
    childNodes = childNodes.filter(function(child){ return child.class_ != "state variable" && child.class_ != "unit of information"});
    var bbox = {};
    bbox.x = ele.bbox.x;
    bbox.y = ele.bbox.y;
    bbox.w = ele.bbox.w;
    bbox.h = ele.bbox.h;
    //if it is simple node return bbox
    if(childNodes.length <= 0){
      bbox.x = parseFloat(bbox.x) + parseFloat(bbox.w) / 2;
      bbox.y = parseFloat(bbox.y) + parseFloat(bbox.h) / 2;
     
      return bbox;
    }else if (ele.extension && ele.extension.has('extraInfo')) {// if newt file then extrainfo on the compound node exists
        var xml = ele.extension.get('extraInfo');
        var extraInfo;
        parseString(xml, function (err, result) {
           extraInfo = result.extraInfo;
        });
        ele.originalW= bbox.w;
        ele.originalH = bbox.h;
        bbox.x = parseFloat(bbox.x) + parseFloat(bbox.w) / 2;
        bbox.y = parseFloat(bbox.y) + parseFloat(bbox.h) / 2;
        bbox.w = parseFloat(extraInfo.w);
        bbox.h = parseFloat(extraInfo.h);       
        ele.minWidth = parseFloat(extraInfo.minW);
        ele.minHeight = parseFloat(extraInfo.minH);
        ele.minWidthBiasLeft = parseFloat(extraInfo.WLBias);
        ele.minWidthBiasRight = parseFloat(extraInfo.WRBias);
        ele.minHeightBiasBottom = parseFloat(extraInfo.HBBias);
        ele.minHeightBiasTop = parseFloat(extraInfo.HTBias);
        
        return bbox;

        
     }else{

     /*  var styles;
      if (this.map.extension && this.map.extension.has('renderInformation')) { // render extension was found
        styles = this.map.extension.get('renderInformation').listOfStyles;
        if(styles  !== undefined){
          styles = styles.styles;
        }
      }
 */
     /*  var compoundPadding = parseFloat(mapProperties.compoundPadding);
      var extraCompartmentPadding = parseFloat(mapProperties.extraCompartmentPadding); */
      
     
      var padding = this.calculateElementPadding(ele);
      if(ele.class_ == "complex"){
        ele.complexCalculatedPadding = padding;
      }
      
      var minLeft, maxRight, minTop, maxBottom, childrenBboxW, childrenBboxH,minLeftBorder,maxRightBorder,minTopBorder,maxBottomBorder; 
      var fromInfoBox = false;
      // Traverse the other children and update the extreme values
      for (var i = 0; i < childNodes.length; i++) {
        var childNode = childNodes[i];
      
        var childNodeBbox = this.bboxProp(childNode);
       
        childNode.bbox = childNodeBbox;
        var borderWidth = elementUtilities.getDefaultProperties(childNode.class_)["border-width"]; 
        var childPadding = this.calculateElementPadding(childNode);
        //var childStyle = styles.filter(style =>{ return style.idList == childNode.id});
       
       /*  if(childStyle.length > 0 && childStyle[0].renderGroup !== undefined){
          borderWidth = childStyle[0].renderGroup.strokeWidth;
        } */

        var left = childNodeBbox.x - childNodeBbox.w/2 - childPadding ;
        var right = childNodeBbox.x + childNodeBbox.w/2 + childPadding;
        var top = childNodeBbox.y  - childNodeBbox.h/2 - childPadding;
        var bottom = childNodeBbox.y + childNodeBbox.h/2 + childPadding;
        var stateAndInfos = childNode.glyphMembers.filter(function(child){ return child.class_ == "state variable" || child.class_ == "unit of information"});
        if(stateAndInfos.length > 0){
            for(var k = 0 ; k<stateAndInfos.length; k++){
                var stateBbox = stateAndInfos[k].bbox;
                if(minLeft === undefined || stateBbox.x < minLeft){
                  minLeft = stateBbox.x;
                  fromInfoBox = true;
                  minLeftBorder = 0;
                }

                if(maxRight === undefined || stateBbox.x + stateBbox.w > maxRight){
                  maxRight = stateBbox.x + stateBbox.w;
                  fromInfoBox = true;
                  maxRightBorder = 0;
                }

                if(minTop === undefined || stateBbox.y < minTop){
                  minTop = stateBbox.y;
                  fromInfoBox = true;
                  minTopBorder = 0;
                }

                if(maxBottom === undefined || stateBbox.y + stateBbox.h > maxBottom){
                  maxBottom = stateBbox.y + stateBbox.h;
                  fromInfoBox = true;
                  maxBottomBorder = 0;
                }


            }
        }

        if (minLeft === undefined || left < minLeft) {
          minLeft = left;
          fromInfoBox = false;
          minLeftBorder = borderWidth;
        }

        if (maxRight === undefined || right > maxRight) {
          maxRight = right;
          fromInfoBox = false;
          maxRightBorder = borderWidth;
        }

        if (minTop === undefined || top < minTop) {
          minTop = top;
          fromInfoBox = false;
          minTopBorder = borderWidth;
        }

        if (maxBottom === undefined || bottom > maxBottom) {
          maxBottom = bottom;
          fromInfoBox = false;
          maxBottomBorder = borderWidth;
        }
      }

      var averageBorderWidthW =  (minLeftBorder + maxRightBorder)/2;
      var averageBorderWidthH = (minTopBorder + maxBottomBorder)/2;
      // The sizes of children bbox are determined by the difference between the extreme coordinates
      childrenBboxW = maxRight - minLeft + 2; // 2 is from cytoscape internal implementation of infoboxes
      childrenBboxH = maxBottom - minTop + 2;
     
     
    
      // If children bbox width is less than node bbox width + paddings set minWidth, and horizontal biases
      if (Number((childrenBboxW + 2 * padding + averageBorderWidthW + (fromInfoBox ?  2 * borderWidth : 0)).toFixed(2)) < Number(bbox.w.toFixed(2))) {

        //ele.minWidth = bbox.w - 2 padding  calculate badding first
        ele.minWidth =  bbox.w - 2 * padding;
        var extraLeft =  Number((minLeft - bbox.x  - padding - minLeftBorder/2 -1).toFixed(2)) ;
        var extraRight = Number(((bbox.x + bbox.w) - maxRight  - padding - maxRightBorder/2 - 1).toFixed(2)) ;

       
        ele.minWidthBiasLeft = extraLeft / (extraLeft + extraRight) * 100;
        ele.minWidthBiasRight = 100 - ele.minWidthBiasLeft;
      }

      // If children bbox height is bigger than node bbox height set minHeight, and vertical biases
      if (Number((childrenBboxH + 2 * padding + averageBorderWidthH + (fromInfoBox ?  2 * borderWidth : 0)).toFixed(2)) < Number(bbox.h.toFixed(2))) {
        ele.minHeight = bbox.h - 2 * padding;
        var extraTop = Number((minTop - bbox.y - padding - minTopBorder/2 - 1).toFixed(2));
        var extraBottom = Number(((bbox.y + bbox.h) - maxBottom - padding - maxBottomBorder/2 - 1).toFixed(2));        

        ele.minHeightBiasTop = extraTop / (extraTop + extraBottom) * 100;
        ele.minHeightBiasBottom = 100 - ele.minHeightBiasTop;
      }
      

      // set positions as center

      bbox.x = parseFloat(bbox.x) + parseFloat(bbox.w) / 2;
      bbox.y = parseFloat(bbox.y) + parseFloat(bbox.h) / 2;
       //bbox.x = (minLeft + maxRight) /2;
     // bbox.y = (minTop + maxBottom) / 2;
      bbox.w = bbox.w - 2 * padding - averageBorderWidthW;
      bbox.h = bbox.h - 2 * padding - averageBorderWidthH;
      bbox.w = bbox.w < 0 ? 0 : bbox.w;
      bbox.h = bbox.h < 0 ? 0 : bbox.h;

      return bbox;
     }
    
  };

  sbgnmlToJson.stateAndInfoBboxProp = function (ele, parentBbox) {
    // don't copy directly ele.box because it contains other things than x y w h
    var bbox = {};

    if(ele.bbox != null){
      bbox.x = ele.bbox.x ;
      bbox.y = ele.bbox.y;
      bbox.w = ele.bbox.w;
      bbox.h = ele.bbox.h;
    }else{
      bbox.x = 0 ;
      bbox.y = 0;
      bbox.w = 12;
      bbox.h = 12;
    }
   
   


    return bbox;
  };
  sbgnmlToJson.calculateElementPadding = function(ele){
      var padding = 0 ;
     
      var childNodes = ele.glyphMembers;
    //exclude state variables and units of information from child members
      childNodes = childNodes.filter(function(child){ return child.class_ != "state variable" && child.class_ != "unit of information"});
      if(childNodes.length <= 0 ) return 0;
      var compoundPadding = typeof options.compoundPadding === 'function' ? options.compoundPadding.call() : options.compoundPadding;
     // } 
      if(ele.class_ == "complex"){
        var complexPadding = 0;
        var extraComplexPadding = typeof options.extraComplexPadding === 'function' ? options.extraComplexPadding.call() : options.extraComplexPadding;
        complexPadding = compoundPadding < 5 ? 5 : compoundPadding;       

        var stateAndInfos = ele.glyphMembers.filter(function(child){ return child.class_ == "state variable" || child.class_ == "unit of information"});
            
        if(ele.label != undefined && ele.label.text != undefined && ele.label.text.length > 0){ 
         
              complexPadding = complexPadding + 0.5 * extraComplexPadding;
              var hasTopBottomInfo = false;
              stateAndInfos.forEach(function(stateAndInfo){
                if(Number((stateAndInfo.bbox.y + stateAndInfo.bbox.h/2).toFixed(2)) == Number((ele.bbox.y + ele.bbox.h).toFixed(2))){
                  hasTopBottomInfo = true;
                }
              });
  
              if(hasTopBottomInfo){
                complexPadding = complexPadding + 0.5 * extraComplexPadding;
              }
          
        }else if(stateAndInfos.length > 0){
          complexPadding += 2;
        }

        padding = complexPadding;

      }else{
        var extraCompartmentPadding = typeof options.extraCompartmentPadding === 'function' ? options.extraCompartmentPadding.call() : options.extraCompartmentPadding;
        padding = extraCompartmentPadding +  compoundPadding;
      }

      return padding;
      
  };
  sbgnmlToJson.findChildNodes = function (ele, childTagName) {
    // find child nodes at depth level of 1 relative to the element
    var children = [];
    for (var i = 0; i < ele.childNodes.length; i++) {
      var child = ele.childNodes[i];
      if (child.nodeType === 1 && child.tagName === childTagName) {
        children.push(child);
      }
    }
    return children;
  };

  sbgnmlToJson.findChildNode = function (ele, childTagName) {
    var nodes = this.findChildNodes(ele, childTagName);
    return nodes.length > 0 ? nodes[0] : undefined;
  };

  sbgnmlToJson.stateAndInfoProp = function (ele, parent) {
    var self = this;
    var parentBbox = parent.bbox;
    var stateAndInfoArray = [];

    var childGlyphs = ele.glyphMembers; // this.findChildNodes(ele, 'glyph');

    // if a biological activity node has no unit of info, it must be a BA plain
    if(parent.class == "biological activity" && childGlyphs.length == 0) {
      parent.class = "BA plain";
    }

    for (var i = 0; i < childGlyphs.length; i++) {
      var glyph = childGlyphs[i];

      if (glyph.class_ !== 'unit of information' && glyph.class_ !== 'state variable') {
        continue;
      }

      var info = {};
      var infobox;
      var infoboxId = glyph.id;

      if (glyph.class_ === 'unit of information') {
        infobox = classes.UnitOfInformation.construct(undefined, undefined, infoboxId);
        if(glyph.entity) {
          // change the parent class according to its true class of biological activity
          switch(glyph.entity.name) {
            case 'unspecified entity':    parent.class = "BA unspecified entity"; break;
            case 'simple chemical':       parent.class = "BA simple chemical"; break;
            case 'macromolecule':         parent.class = "BA macromolecule"; break;
            case 'nucleic acid feature':  parent.class = "BA nucleic acid feature"; break;
            case 'perturbation':          parent.class = "BA perturbing agent"; break;
            case 'complex':               parent.class = "BA complex"; break;
          }
        }
        infobox.label = {
          'text': (glyph.label && glyph.label.text) || undefined
        };
      } else if (glyph.class_ === 'state variable') {
        infobox = classes.StateVariable.construct(undefined, undefined, undefined, infoboxId);

        var state = glyph.state;
        infobox.state.value = (state && state.value) || undefined;
        infobox.state.variable = (state && state.variable) || undefined;
      }
      //var bboxAndAnchorResult = getAuxUnitClass(infobox).setAnchorSideAndBbox();

      infobox.bbox = self.stateAndInfoBboxProp(glyph, parentBbox);
      infobox.style = self.getDefaultStateAndInfoStyle(glyph, parent.class);
      //classes.StateVariable.setAnchorSide(infobox);
      stateAndInfoArray.push(infobox);
    }

    return stateAndInfoArray;
  };

  sbgnmlToJson.getDefaultStateAndInfoStyle = function(gylph, parentClass) {
    return elementUtilities.getDefaultInfoboxStyle( parentClass, gylph.class_ );
  };

  sbgnmlToJson.addParentInfoToNode = function (ele, nodeObj, parent, compartments) {
    var self = this;
    var compartmentRef = ele.compartmentRef;

    var inferNestingOnLoad = options.inferNestingOnLoad;
    inferNestingOnLoad = typeof inferNestingOnLoad === 'function' ? inferNestingOnLoad.call() : inferNestingOnLoad;

    if (parent) {
      nodeObj.parent = parent;
    } else if (compartmentRef) {
      nodeObj.parent = compartmentRef;
    } else if(inferNestingOnLoad) {
      nodeObj.parent = '';

      // add compartment according to geometry
      for (var i = 0; i < compartments.length; i++) {
        var bbox = {
          'x': parseFloat(ele.bbox.x),
          'y': parseFloat(ele.bbox.y),
          'w': parseFloat(ele.bbox.w),
          'h': parseFloat(ele.bbox.h),
          'id': ele.id
        };
        if (self.isInBoundingBox(bbox, compartments[i])) {
          nodeObj.parent = compartments[i].id;
          break;
        }
      }
    }
  };

  sbgnmlToJson.addCytoscapeJsNode = function (ele, jsonArray, parent, compartments) {
    var self = this;
    var nodeObj = {};
    var styleObj = {};

    // add id information
    nodeObj.id = ele.id;
    // add node bounding box information
    nodeObj.bbox = self.bboxProp(ele);    

    if (ele.minWidth) {
      nodeObj.minWidth = ele.minWidth;
      nodeObj.minWidthBiasLeft = ele.minWidthBiasLeft;
      nodeObj.minWidthBiasRight = ele.minWidthBiasRight;
    }

    if (ele.minHeight) {
      nodeObj.minHeight = ele.minHeight;
      nodeObj.minHeightBiasTop = ele.minHeightBiasTop;
      nodeObj.minHeightBiasBottom = ele.minHeightBiasBottom;
    }
    if(ele.originalW){
      nodeObj.originalW = ele.originalW;
    }
    if(ele.originalH){
      nodeObj.originalH = ele.originalH;
    }

    if(ele.complexCalculatedPadding){
      nodeObj.complexCalculatedPadding = ele.complexCalculatedPadding;
    }

    // add class information
    if (ele.class_ === "source and sink" || ele.class_ === "emptyset") {
      nodeObj.class = "empty set";
    }
    else {
      nodeObj.class = ele.class_;
    }
    // add label information
    nodeObj.label = (ele.label && ele.label.text) || undefined;
    if(nodeObj.label != undefined){
      nodeObj.label = ""+ nodeObj.label;
    }
    // add state and info box information
    nodeObj.statesandinfos = self.stateAndInfoProp(ele, nodeObj);
    // adding parent information
    self.addParentInfoToNode(ele, nodeObj, parent, compartments);


    // add language info, this will always be the mapType if not hybrid
    var mapType = elementUtilities.mapType;
    if(mapType == 'PD' || mapType == 'AF' || mapType == 'SIF'){
      nodeObj.language = elementUtilities.mapType;
    }else if(mapType == 'HybridSbgn'){
      if(nodeObj.class == 'delay' || nodeObj.class.startsWith("BA")){
        nodeObj.language = 'AF';
      }else{
        nodeObj.language = 'PD';
      }
    }else{//maptype == HybridAny
      if(nodeObj.class.startsWith("SIF")){
        nodeObj.language = 'SIF';
      }else if(nodeObj.class == 'delay' || nodeObj.class.startsWith("BA")){
        nodeObj.language = 'AF';
      }else{
        nodeObj.language = 'PD';
      }
    }
   
    // add default properties of the node type to element data
    // these props would be overriden by style properties of element
    // stored in the file
    elementUtilities.extendNodeDataWithClassDefaults( nodeObj, nodeObj.class );

    // add clone information
    if (ele.clone) {
      nodeObj.clonemarker = true;
    } else {
      nodeObj.clonemarker = undefined;
    }

    // add port information
    var ports = [];
    var portElements = ele.ports;

    for (var i = 0; i < portElements.length; i++) {
      var portEl = portElements[i];
      var id = portEl.id;
      var relativeXPos = parseFloat(portEl.x) - nodeObj.bbox.x;
      var relativeYPos = parseFloat(portEl.y) - nodeObj.bbox.y;

      relativeXPos = relativeXPos / parseFloat(nodeObj.bbox.w) * 100;
      relativeYPos = relativeYPos / parseFloat(nodeObj.bbox.h) * 100;
      
      // In case port position is not vertically/horizontally aligned with the node center, decide a direction
      if(Math.abs(relativeXPos) > 0 && Math.abs(relativeYPos) > 0) {
        if(Math.abs(relativeXPos) >= Math.abs(relativeYPos))
          relativeYPos = 0;
        else
          relativeXPos = 0;
      }

      // We assume that ports are not inside the node shape.
      // Therefore, abs. value of their relative x and y coordinates (relative to node center) should be bigger than 50.
      if (Math.abs(relativeXPos) < 50) {
        relativeXPos = 0;
      }

      if (Math.abs(relativeYPos) < 50) {
        relativeYPos = 0;
      }

      if (relativeXPos === 0 && relativeYPos === 0) {
        continue;
      }
      
      // If port length is longer than the node size (for example, some sbgn files generated from Reactome database has very long ports),
      // set the port length to 70 which is default in sbgnviz
      if(Math.abs(relativeXPos) > 150 || Math.abs(relativeYPos) > 150) {
        if(Math.abs(relativeXPos) > 150)
          relativeXPos = relativeXPos / Math.abs(relativeXPos) * 70;
        else
          relativeYPos = relativeYPos / Math.abs(relativeYPos) * 70;
      }      

      ports.push({
        id: id,
        x: relativeXPos,
        y: relativeYPos
      });
    }

    nodeObj.ports = ports;

    var _class = nodeObj.class;
    // If the node can have ports and it has exactly 2 ports then it should be represented by a bigger bbox.
    // This is because we represent it as a polygon and so the whole shape including the ports are rendered in the node bbox.
    if (elementUtilities.canHavePorts(_class)) {
      if (graphUtilities.portsEnabled && ports.length === 2) {
        // We assume that the ports are symmetric to the node center so using just one of the ports is enough
        var port = ports[0];
        var orientation = port.x === 0 ? 'vertical' : 'horizontal';
        // This is the ratio of the area occupied with ports over without ports
        var ratio = orientation === 'vertical' ? Math.abs(port.y) / 50 : Math.abs(port.x) / 50;
        // Multiply the bbox with the calculated ratio
        nodeObj.bbox.w = parseFloat(nodeObj.bbox.w) * ratio;
        nodeObj.bbox.h = parseFloat(nodeObj.bbox.h) * ratio;
      }
    }

    if (ele.extension && ele.extension.has('annotation')) { // annotation extension was found
      var rdfElement = ele.extension.get('annotation').rdfElement;
      nodeObj = self.handleAnnotations(nodeObj, rdfElement);
    }

    if (ele.extension && ele.extension.has("sbgnviz")){
      parseString(ele.extension.get("sbgnviz"), function (err, result) {
        if (result.sbgnviz.hidden){
          styleObj.display = "none";
        }
        if (result.sbgnviz.hasHiddenNeighbour){
          nodeObj.thickBorder = true;
        }
        if (result.sbgnviz.collapsed){
          nodeObj.positionBeforeSaving = {x : Number(result.sbgnviz.positionBeforeSaving[0].$.x),
              y: Number(result.sbgnviz.positionBeforeSaving[0].$.y)};
          nodeObj.collapse = true;
        }
      });
    }

    var cytoscapeJsNode = {data: nodeObj, style: styleObj};
    jsonArray.push(cytoscapeJsNode);
  };

  /**
  * given a future cy object, and the corresponding element's libsbgnjs' extension, populates the annotations field
  */
  sbgnmlToJson.handleAnnotations = function(cyObject, rdfElement) {
    // local utility function
    function dbFromUrl(url) {
      var regexp = /^http:\/\/identifiers.org\/(.+?)\/.+$/;
      return url.replace(regexp, '$1');
    }

    function fillElementDataAnnotation(cyObject, annotationIndex, status, selectedDB, selectedRelation, annotationValue) {
      if(!cyObject.annotations) {
        cyObject.annotations = {};
      }
      var annotId = cyObject.id+"-annot-"+annotationIndex;

      cyObject.annotations[annotId] = {
        // The following may be hazardous. But setting it as unchecked leave the annotation out if the file is saved.
        // This would lead to the user losing annotations without knowing it.
        status: status, // <-- we trust that what's been loaded is valid.
        selectedDB: selectedDB,
        selectedRelation: selectedRelation,
        annotationValue: annotationValue
      };
      return cyObject;
    }

    // we assume that the id of the rdf:about field is the one of the current node, and that there's only 1 description
    var id = rdfElement.getAllIds()[0];
    var resources = rdfElement.getResourcesOfId(id);
    var customProperties = rdfElement.getCustomPropertiesOfId(id);

    var globalAnnotIndex = 0;
    // handle controlled properties
    for (var fullQualifier in resources) {
      var relation = libsbgnjs.annot.Util.reducePrefix(fullQualifier);
      for(var i=0; i<resources[fullQualifier].length; i++) {
        var value = resources[fullQualifier][i];
        var selectedDB = dbFromUrl(value);
        cyObject = fillElementDataAnnotation(cyObject, globalAnnotIndex, "validated", selectedDB, relation, value);
        globalAnnotIndex++;
      }
    }
    // handle custom properties
    for (var key in customProperties) {
      var value = customProperties[key];
      cyObject = fillElementDataAnnotation(cyObject, globalAnnotIndex, "validated", key, "sio:SIO_000223", value);
      globalAnnotIndex++;
    }

    return cyObject;
  };

  sbgnmlToJson.traverseNodes = function (ele, jsonArray, parent, compartments) {
    var elId = ele.id; 

    // Workaround: In application we use class 'empty set' but on read write we use 'source and sink'
    // SBGN-ML files can also have 'emptyset' class  
    if (!handledElements[ele.class_] && ele.class_ !== "source and sink" && ele.class_ !== "emptyset") {
      return;
    }
    this.insertedNodes[elId] = true;
    var self = this;
    // add complex nodes here

    var eleClass = ele.class_;

    if (eleClass === 'complex' || eleClass === 'complex multimer' || eleClass === 'submap' || eleClass === 'topology group') {
      self.addCytoscapeJsNode(ele, jsonArray, parent, compartments);

      var childGlyphs = ele.glyphMembers;
      for (var i = 0; i < childGlyphs.length; i++) {
        var glyph = childGlyphs[i];
        var glyphClass = glyph.class_;
        if (glyphClass !== 'state variable' && glyphClass !== 'unit of information') {
          if (glyph.compartmentRef && glyph.compartmentRef != elId && eleClass == 'submap') {
            self.traverseNodes(glyph, jsonArray, glyph.compartmentRef, compartments);
          }
          else {
            self.traverseNodes(glyph, jsonArray, elId, compartments);
          }
        }
      }
    } else {
      self.addCytoscapeJsNode(ele, jsonArray, parent, compartments);
    }
  };

  sbgnmlToJson.getPorts = function (xmlObject) {
    return ( xmlObject._cachedPorts = xmlObject._cachedPorts || xmlObject.querySelectorAll('port'));
  };

  sbgnmlToJson.getGlyphs = function (xmlObject) {
    var glyphs = xmlObject._cachedGlyphs;

    if (!glyphs) {
      glyphs = xmlObject._cachedGlyphs = xmlObject._cachedGlyphs || xmlObject.querySelectorAll('glyph');

      var id2glyph = xmlObject._id2glyph = {};

      for ( var i = 0; i < glyphs.length; i++ ) {
        var g = glyphs[i];
        var id = g.getAttribute('id');

        id2glyph[ id ] = g;
      }
    }

    return glyphs;
  };

  sbgnmlToJson.getArcs = function (xmlObject) {
    var arcs = xmlObject._cachedArcs;

    if (!arcs) {
      arcs = xmlObject._cachedArcs = xmlObject._cachedArcs || xmlObject.querySelectorAll('arc');

      var id2arc = xmlObject._id2arc = {};

      for ( var i = 0; i < arcs.length; i++ ) {
        var arc = arcs[i];
        var id = arc.getAttribute('id');

        id2arc[ id ] = arc;
      }
    }

    return arcs;
  };

  sbgnmlToJson.getGlyphById = function (xmlObject, id) {
    this.getGlyphs(xmlObject); // make sure cache is built

    return xmlObject._id2glyph[id];
  };

  sbgnmlToJson.getArcById = function (xmlObject, id) {
    this.getArcs(xmlObject); // make sure cache is built

    return xmlObject._id2arc[id];
  };

  sbgnmlToJson.getArcSourceAndTarget = function (arc, xmlObject) {
    // source and target can be inside of a port
    var source = arc.source;
    var target = arc.target;
    var sourceNodeId;
    var targetNodeId;

    var sourceExists = this.getGlyphById(xmlObject, source);
    var targetExists = this.getGlyphById(xmlObject, target);

    if (sourceExists) {
      sourceNodeId = source;
    }

    if (targetExists) {
      targetNodeId = target;
    }


    var i;
    var portEls = this.getPorts(xmlObject);
    var port;
    if (sourceNodeId === undefined) {
      for (i = 0; i < portEls.length; i++ ) {
        port = portEls[i];
        if (port.getAttribute('id') === source) {
          sourceNodeId = port.parentElement.getAttribute('id');
        }
      }
    }

    if (targetNodeId === undefined) {
      for (i = 0; i < portEls.length; i++) {
        port = portEls[i];
        if (port.getAttribute('id') === target) {
          targetNodeId = port.parentElement.getAttribute('id');
        }
      }
    }

    return {'source': sourceNodeId, 'target': targetNodeId};
  };

  sbgnmlToJson.getArcAnchorPointPositions = function (ele) {
    var anchorPointPositions = [];

    var children = ele.nexts;

    for (var i = 0; i < children.length; i++) {
      var posX = children[i].x;
      var posY = children[i].y;

      anchorPointPositions.push({
        x: posX,
        y: posY
      });
    }

    return anchorPointPositions;
  };

  sbgnmlToJson.addCytoscapeJsEdge = function (ele, jsonArray, xmlObject) {
    if (!handledElements[ele.class_]) {
      return;
    }

    var self = this;
    var sourceAndTarget = self.getArcSourceAndTarget(ele, xmlObject);

    if (!this.insertedNodes[sourceAndTarget.source] || !this.insertedNodes[sourceAndTarget.target]) {
      return;
    }

    var edgeObj = {};
    var styleObj = {};
    var anchorPointPositions = [];
    if (sourceAndTarget.source !== sourceAndTarget.target) {
      anchorPointPositions = self.getArcAnchorPointPositions(ele);
    }

    edgeObj.id = ele.id || undefined;
    edgeObj.class = ele.class_;

    // bezier edge is the default edge style
    // change if the file being loaded has curveStyle field
    var curveStyle = "bezier";
    if (ele.extension && ele.extension.has("curveStyle")) {
      parseString(ele.extension.get("curveStyle"), function (err, result) {
        curveStyle = result.curveStyle;
      })
    }
    if (curveStyle == "unbundled-bezier") {
      edgeObj.controlPointPositions = anchorPointPositions;
    }
    else {
      edgeObj.bendPointPositions = anchorPointPositions;
    }

    var isSifMetaEdge;
    if (ele.extension && ele.extension.has("sifMetaEdge")) {
      parseString(ele.extension.get("sifMetaEdge"), function (err, result) {
        isSifMetaEdge = result.sifMetaEdge;
      });
    }
    if (isSifMetaEdge) {
      edgeObj["sif-meta"] = true;
    }

    // add language info, this will always be the mapType if not hybrid
    var PdEdges = ["consumption","production","modulation","stimulation","catalysis","inhibition","necessary stimulation","logic arc","equivalence arc"];
    var AfEdges = ["positive influence","negative influence","unknown influence"];  
    var mapType = elementUtilities.mapType;
    if(mapType == 'PD' || mapType == 'AF' || mapType == 'SIF'){
      edgeObj.language = elementUtilities.mapType;
    }else if(mapType == 'HybridSbgn'){
      if(PdEdges.indexOf(edgeObj.class) > -1){
        edgeObj.language = 'PD';
      }else{
        edgeObj.language = 'AF';
      }
    }else{//maptype == HybridAny
      if(PdEdges.indexOf(edgeObj.class) > -1){
        edgeObj.language = 'PD';
      }else if(AfEdges.indexOf(edgeObj.class) > -1){
        edgeObj.language = 'AF';
      }else{
        edgeObj.language = 'SIF';
      }
    }

    elementUtilities.extendEdgeDataWithClassDefaults( edgeObj, edgeObj.class );

    edgeObj.cardinality = 0;
    if (ele.glyphs.length > 0) {
      for (var i = 0; i < ele.glyphs.length; i++) {
        if (ele.glyphs[i].class_ === 'cardinality' || ele.glyphs[i].class_ === 'stoichiometry') {
          var label = ele.glyphs[i].label;
          edgeObj.cardinality = label.text || undefined;
        }
      }
    }

    edgeObj.source = sourceAndTarget.source;
    edgeObj.target = sourceAndTarget.target;

    edgeObj.portsource = ele.source;
    edgeObj.porttarget = ele.target;

    if (ele.extension && ele.extension.has('annotation')) { // annotation extension was found
      var rdfElement = ele.extension.get('annotation').rdfElement;
      edgeObj = self.handleAnnotations(edgeObj, rdfElement);
    }

    if (ele.extension && ele.extension.has("sbgnviz")){
      parseString(ele.extension.get("sbgnviz"), function (err, result) {
        if (result.sbgnviz.hidden){
          styleObj.display = "none";
        }
      });
    }

    var cytoscapeJsEdge = {data: edgeObj, style: styleObj};
    jsonArray.push(cytoscapeJsEdge);
  };

  sbgnmlToJson.applyStyle = function (renderInformation, nodes, edges) {
    // get all color id references to their value
    if (renderInformation.listOfColorDefinitions) {
      var colorList = renderInformation.listOfColorDefinitions.colorDefinitions;
      var colorIDToValue = {};
      for (var i=0; i < colorList.length; i++) {
        colorIDToValue[colorList[i].id] = colorList[i].value;
      }
    }
    // get all background image id references to their value
    if(renderInformation.listOfBackgroundImages){
      var imageList = renderInformation.listOfBackgroundImages.backgroundImages;
      var imageIDToValue = {};
      for (var i=0; i < imageList.length; i++) {
        imageIDToValue[imageList[i].id] = imageList[i].value;
      }
    }

    // convert style list to elementId-indexed object pointing to style
    // also convert color references to color values
    var styleList = renderInformation.listOfStyles.styles;
    var memberIDToStyle = {};
    for (var i=0; i < styleList.length; i++) {
      var style = styleList[i];
      var renderGroup = style.renderGroup;

      // convert color references
      if (renderGroup.stroke != null && colorIDToValue) {
        renderGroup.stroke = colorIDToValue[renderGroup.stroke];
      }
      if (renderGroup.fill != null && colorIDToValue) {
        renderGroup.fill = colorIDToValue[renderGroup.fill];
      }
      // convert background image references
      if (renderGroup.backgroundImage != null && imageIDToValue) {
        renderGroup.backgroundImage = imageIDToValue[renderGroup.backgroundImage];
      }

      var idList = style.idList.split(' ');
      for (var j=0; j < idList.length; j++) {
        var id = idList[j];
        memberIDToStyle[id] = renderGroup;
      }
    }

    function hexToDecimal (hex) {
      return Math.round(parseInt('0x'+hex) / 255 * 100) / 100;
    }

    function convertHexColor (hex) {
      if (hex.length == 7) { // no opacity provided
        return {opacity: null, color: hex};
      }
      else { // length of 9
        var color = hex.slice(0,7);
        var opacity = hexToDecimal(hex.slice(-2));
        return {opacity: opacity, color: color};
      }
    }

    var nodePropMap = {
      'background-color': 'fill',
      'background-opacity': 'backgroundOpacity',
      'border-color': 'stroke',
      'border-width': 'strokeWidth',
      'font-size': 'fontSize',
      'font-family': 'fontFamily',
      'font-style': 'fontStyle',
      'font-weight': 'fontWeight',
      'color': 'fontColor',
      'text-halign': 'textAnchor',
      'text-valign': 'vtextAnchor',
      'background-image': 'backgroundImage',
      'background-fit': 'backgroundFit',
      'background-position-x': 'backgroundPosX',
      'background-position-y': 'backgroundPosY',
      'background-width': 'backgroundWidth',
      'background-height': 'backgroundHeight',
      'background-image-opacity': 'backgroundImageOpacity',
      
    };

    var edgePropMap = {
      'line-color': 'stroke',
      'width': 'strokeWidth'
    };

    var infoboxPropMap = {
      'background-color': 'fill',
      'border-color': 'stroke',
      'border-width': 'strokeWidth',
      'font-size': 'fontSize',
      'font-weight': 'fontWeight',
      'font-style': 'fontStyle',
      'font-family': 'fontFamily',
      'font-color': 'fontColor'
    };

    var nodePropDetails = {
      'background-color': {
        'converter': convertHexColor,
        'extra-field': 'color'
      },
     /*  'background-opacity': {
        'converter': convertHexColor,
        'extra-field': 'opacity'
      }, */
      'border-color': {
        'converter': convertHexColor,
        'extra-field': 'color'
      }
    };

    var edgePropDetails = {
      'line-color': {
        'converter': convertHexColor,
        'extra-field': 'color'
      }
    };

    var infoboxPropDetails = {
      'font-color': {
        'converter': convertHexColor,
        'extra-field': 'color'
      },
      'border-color': {
        'converter': convertHexColor,
        'extra-field': 'color'
      }
    };

    function getElementId( ele ) {
      return ele.data.id;
    }

    function getInfoboxId( infobox ) {
      return infobox.id;
    }

    function setElementStyleProp( ele, name, value ) {
      ele.data[ name ] = value;
    }

    function setInfoboxStyleProp( infobox, name, value ) {
      infobox.style[ name ] = value;
    }

    // apply the style to list and overwrite the default style
    function overrideStyleProperties( list, propMap, propDetails, getId, setStyleProp ) {
      for (var i=0; i < list.length; i++) {
        var member = list[i];
        var memberStyle = memberIDToStyle[ getId( member ) ];

        if (!memberStyle) {
          return;
        }

        Object.keys( propMap ).forEach( function( propName ) {
          var fieldName = propMap[ propName ];
          var fieldVal = memberStyle[ fieldName ];
          if ( fieldVal !== undefined && fieldVal !== null ) {
            var details = propDetails && propDetails[ propName ];
            if ( details ) {
              if ( details[ 'converter' ] ) {
                fieldVal = details[ 'converter' ]( fieldVal );
              }

              if ( details[ 'extra-field' ] ) {
                fieldVal = fieldVal[ details[ 'extra-field' ] ];
              }
            }

            setStyleProp( member, propName, fieldVal );
          }
        } );

        // if the member is a node
        if ( member.data && member.data.statesandinfos ) {
          overrideStyleProperties( member.data.statesandinfos, infoboxPropMap, infoboxPropDetails, getInfoboxId, setInfoboxStyleProp );
        }
      }
    }

    overrideStyleProperties( nodes, nodePropMap, nodePropDetails, getElementId, setElementStyleProp );
    overrideStyleProperties( edges, edgePropMap, edgePropDetails, getElementId, setElementStyleProp );
  };

  sbgnmlToJson.mapPropertiesToObj = function() {
    if (this.map.extension && this.map.extension.has('mapProperties')) { // render extension was found
       var xml = this.map.extension.get('mapProperties');
       var obj;
       parseString(xml, function (err, result) {
          obj = result;
       });
       return obj;
    }else{
        
          return {mapProperties : {compoundPadding : mainUtilities.getCompoundPadding()}};
        }
     

    
  };

  sbgnmlToJson.convert = function (xmlObject, urlParams) {
    var self = this;
    var cytoscapeJsNodes = [];
    var cytoscapeJsEdges = [];
    var compartmentChildrenMap = {}; // Map compartments children temporarily
    elementUtilities.fileFormat = 'sbgnml';

    var sbgn;
    try {
      var xmlString = new XMLSerializer().serializeToString(xmlObject);
      sbgn = libsbgnjs.Sbgn.fromXML(xmlString);
    }
    catch (err) {
      throw new Error("Could not parse sbgnml. "+ err);
    }

    var map;
    if(sbgn.maps.length < 1) { // empty sbgn
      return {nodes: [], edges: []};
    }
    else {
      map = sbgn.maps[0]; // take first map of the file as the main map
    }

    this.map = map;
    elementUtilities.mapType = elementUtilities.languageToMapType(map.language);

    var compartments = self.getAllCompartments(map.glyphs);

    var glyphs = map.glyphs;
    var arcs = map.arcs;

    var i;
    for (i = 0; i < glyphs.length; i++) {
      var glyph = glyphs[i];

      // libsbgn library lists the glyphs of complexes in ele.glyphMembers but it does not store the glyphs of compartments
      // store glyph members of compartments here.
      var compartmentRef = glyph.compartmentRef;

      if (glyph.class_ === 'compartment') {
        if (compartmentChildrenMap[glyph.id] === undefined) {
          compartmentChildrenMap[glyph.id] = glyph.glyphMembers;
        }

        glyph.glyphMembers = compartmentChildrenMap[glyph.id];
      }

      if (compartmentRef) {
        if (compartmentChildrenMap[compartmentRef] === undefined) {
          compartmentChildrenMap[compartmentRef] = [];
        }
        compartmentChildrenMap[compartmentRef].push(glyph);
      }
    }

    var minDistanceToChildren = Number.MAX_SAFE_INTEGER;

    if(urlParams && urlParams.compoundPadding) {
      mainUtilities.setCompoundPadding(Number(urlParams.compoundPadding));
    }
    else if (!map.extension) {
      for (var i = 0; i < glyphs.length; i++) {
        var glyph = glyphs[i];

        childNodes = glyph.glyphMembers.filter(function(child){ return child.class_ != "state variable" && child.class_ != "unit of information"});
        if(childNodes.length > 0){ // compound node
          var hasMin = false;
          for (var j = 0; j < childNodes.length; j++) {           
            var childNode = childNodes[j];
            const childClass = childNode.class_;
            if (childClass === "source and sink" || childClass === "emptyset") {
              childClass = "empty set";
            }
            var borderWidth = elementUtilities.getDefaultProperties(childClass)["border-width"];
            var stateAndInfos = childNode.glyphMembers.filter(function(child){ return child.class_ == "state variable" || child.class_ == "unit of information"});
            if(stateAndInfos.length > 0){
              for(var k = 0 ; k<stateAndInfos.length; k++){
                var stateBbox = stateAndInfos[k].bbox;
                if(stateBbox.y - glyph.bbox.y < minDistanceToChildren){
                  minDistanceToChildren = stateBbox.y - glyph.bbox.y - borderWidth;
                  hasMin = true;
                }
                if(stateBbox.x - glyph.bbox.x < minDistanceToChildren){
                  minDistanceToChildren = stateBbox.x - glyph.bbox.x - borderWidth;
                  hasMin = true;
                }

                if(glyph.bbox.y +  glyph.bbox.h - (stateBbox.y + stateBbox.h)  < minDistanceToChildren){
                  minDistanceToChildren = glyph.bbox.y +  glyph.bbox.h - (stateBbox.y + stateBbox.h) - borderWidth;
                  hasMin = true;
                }
                if(glyph.bbox.x +  glyph.bbox.w - (stateBbox.x + stateBbox.w)  < minDistanceToChildren){
                  minDistanceToChildren = glyph.bbox.x +  glyph.bbox.w - (stateBbox.x + stateBbox.w) - borderWidth;
                  hasMin = true;
                }
              }
            }
            var childNodeBbox = childNode.bbox; 
            
            
            var left =childNodeBbox.x - glyph.bbox.x - borderWidth/2;
            var right =  (glyph.bbox.x + glyph.bbox.w) - (childNodeBbox.x + childNodeBbox.w) - borderWidth/2;
            var top = childNodeBbox.y - glyph.bbox.y - borderWidth/2;
            var bottom = (glyph.bbox.y + glyph.bbox.h) - (childNodeBbox.y + childNodeBbox.h) - borderWidth/2;
            
            if(left < minDistanceToChildren){
              minDistanceToChildren = left;
              hasMin = true;
            }
            if(right < minDistanceToChildren){
              minDistanceToChildren = right;
              hasMin = true;
            }
            if(top < minDistanceToChildren){
              minDistanceToChildren = top;
              hasMin = true;
            }
            if(bottom < minDistanceToChildren){
              minDistanceToChildren = bottom;
              hasMin = true;
            }           
          }

          if(hasMin){
            if(glyph.class_ == "complex"){
              var stateAndInfos = glyph.glyphMembers.filter(function(child){ return child.class_ == "state variable" || child.class_ == "unit of information"});
              var extraComplexPadding = typeof options.extraComplexPadding === 'function' ? options.extraComplexPadding.call() : options.extraComplexPadding;
              if(glyph.label != undefined && glyph.label.text != undefined && glyph.label.text.length > 0){
               
                    minDistanceToChildren = minDistanceToChildren - 0.5 * extraComplexPadding;
                    var hasTopBottomInfo = false;
                    stateAndInfos.forEach(function(stateAndInfo){
                      if( Number((stateAndInfo.bbox.y + stateAndInfo.bbox.h/2).toFixed(2)) == Number((glyph.bbox.y + glyph.bbox.h).toFixed(2))){
                        hasTopBottomInfo = true;
                      }
                    });
    
                    if(hasTopBottomInfo){
                      minDistanceToChildren = minDistanceToChildren - 0.5 * extraComplexPadding;
                    }
                 
               
              }else if(stateAndInfos.length > 0){
                minDistanceToChildren -= 2;
              }
  
  
  
            }else{
              var extraCompartmentPadding = typeof options.extraCompartmentPadding === 'function' ? options.extraCompartmentPadding.call() : options.extraCompartmentPadding;
              minDistanceToChildren = minDistanceToChildren - extraCompartmentPadding;
            }
          }
          

        }
      }   
        minDistanceToChildren = Math.round(minDistanceToChildren);
        var newPadding = minDistanceToChildren - 1; // comes from cytoscape internal implementation of bounding box which is outerwidth + 1 (on each side)
        if(newPadding < 0 || minDistanceToChildren == Math.round(Number.MAX_SAFE_INTEGER)){
          newPadding = 0;
        }
        mainUtilities.setCompoundPadding(newPadding);
      
     
    }else{
      mainUtilities.setCompoundPadding(Number(self.mapPropertiesToObj().mapProperties.compoundPadding));
    }

    

    for (i = 0; i < glyphs.length; i++) {
      var glyph = glyphs[i];
      self.traverseNodes(glyph, cytoscapeJsNodes, '', compartments,minDistanceToChildren);
    }

    for (i = 0; i < arcs.length; i++) {
      var arc = arcs[i];
      self.addCytoscapeJsEdge(arc, cytoscapeJsEdges, xmlObject);
    }

    if (map.extension && map.extension.has('renderInformation')) { // render extension was found
      self.applyStyle(map.extension.get('renderInformation'), cytoscapeJsNodes, cytoscapeJsEdges);
    }

    var cytoscapeJsGraph = {};
    cytoscapeJsGraph.nodes = cytoscapeJsNodes;
    cytoscapeJsGraph.edges = cytoscapeJsEdges;

    this.insertedNodes = {};


    var shouldDisablePorts = false;
    cytoscapeJsGraph.nodes.forEach(function(node) {
      if((node.data.bbox.w == 0 || isNaN(node.data.bbox.w)) && (node.data.bbox.h == 0 || isNaN(node.data.bbox.h))){
        node.data.bbox.w = elementUtilities.getDefaultProperties(node.data.class).width;
        node.data.bbox.h = elementUtilities.getDefaultProperties(node.data.class).height;     
       // node.data.bbox.x = 15;     
       // node.data.bbox.y = 10; 
      } 
      node.data.ports.forEach(function(port){
        if (isNaN(port.x) || isNaN(port.y)){
          shouldDisablePorts = true;
        }
      });     
    }); 

      if(shouldDisablePorts){      
      graphUtilities.disablePorts();
    }
    //getDefaultProperties
    //elementUtilities.nodeTypes.forEach(function(type){
    //  console.log(elementUtilities.getDefaultProperties(type));
    //});
    
    //console.log(cytoscapeJsGraph);
    //console.log( elementUtilities.nodeTypes);
    return cytoscapeJsGraph;
  };
  
    sbgnmlToJson.doValidation = function(xmlString) {
   	var errors = [];
	    try {
      		 errors = libsbgnjs.Sbgn.doValidation(xmlString);
   	   }
    	  catch (err) {
      		throw new Error("Could not do validation. "+ err);
    	  }
	  return errors;
  };

  return sbgnmlToJson;
};

