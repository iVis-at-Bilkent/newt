/*
* File Utilities: To be used on read/write file operation
*/

var libUtilities = require('./lib-utilities');
var libs = libUtilities.getLibs();
var jQuery = $ = libs.jQuery;
var saveAs = libs.saveAs;
var textUtilities = require('./text-utilities');

module.exports = function () {
 // Helper functions Start
 // see http://stackoverflow.com/questions/16245767/creating-a-blob-from-a-base64-string-in-javascript
 function b64toBlob(b64Data, contentType, sliceSize) {
   contentType = contentType || '';
   sliceSize = sliceSize || 512;

   var byteCharacters = atob(b64Data);
   var byteArrays = [];

   for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
     var slice = byteCharacters.slice(offset, offset + sliceSize);

     var byteNumbers = new Array(slice.length);
     for (var i = 0; i < slice.length; i++) {
       byteNumbers[i] = slice.charCodeAt(i);
     }

     var byteArray = new Uint8Array(byteNumbers);

     byteArrays.push(byteArray);
   }

   var blob = new Blob(byteArrays, {type: contentType});
   return blob;
 }

 function loadTextDoc(fullFilePath) {
   if (window.XMLHttpRequest) {
     xhttp = new XMLHttpRequest();
   }
   else {
     xhttp = new ActiveXObject("Microsoft.XMLHTTP");
   }
   xhttp.overrideMimeType('application/text');
   xhttp.open("GET", fullFilePath, false);
   xhttp.send();
   return xhttp.responseText;
 }

 function loadXMLDoc(fullFilePath) {
  if (window.XMLHttpRequest) {
    xhttp = new XMLHttpRequest();
  }
  else {
    xhttp = new ActiveXObject("Microsoft.XMLHTTP");
  }
  xhttp.overrideMimeType('application/xml');
  xhttp.open("GET", fullFilePath, false);
  xhttp.send();
  return xhttp.responseXML;
}

 // Should this be exposed or should this be moved to the helper functions section?
 function textToXmlObject(text) {
   if (window.ActiveXObject) {
     var doc = new ActiveXObject('Microsoft.XMLDOM');
     doc.async = 'false';
     doc.loadXML(text);
   } else {
     var parser = new DOMParser();
     var doc = parser.parseFromString(text, 'text/xml');
   }
   return doc;
 }
 // Helper functions End

 var sbgnmlToJson, jsonToSbgnml, jsonToNwt, uiUtilities, tdToJson,
     sifToJson, graphUtilities, layoutToText, nwtToJson, jsonToSif,sbgnmlToCd,cdToSbgnml,sbgnmlToSbml,sbmlToSbgnml;
 var updateGraph;
 var options, cy;

 function fileUtilities (param) {
   sbgnmlToJson = param.sbgnmlToJsonConverter;
   nwtToJson = param.nwtToJsonConverter;
   jsonToSbgnml = param.jsonToSbgnmlConverter;
   jsonToNwt = param.jsonToNwtConverter;
   jsonToSif = param.jsonToSifConverter;
   uiUtilities = param.uiUtilities;
   tdToJson = param.tdToJsonConverter;
   sifToJson = param.sifToJsonConverter;
   layoutToText = param.layoutToText;
   graphUtilities = param.graphUtilities;
   updateGraph = graphUtilities.updateGraph.bind(graphUtilities);
   options = param.optionUtilities.getOptions();
   cy = param.sbgnCyInstance.getCy();
   sbgnmlToCd = param.sbgnmlToCdConverter;
   cdToSbgnml = param.cdToSbgnmlConverter;
   sbgnmlToSbml = param.sbgnmlToSbmlConverter;
   sbmlToSbgnml = param.sbmlToSbgnmlConverter;
 }

 fileUtilities.loadXMLDoc = loadXMLDoc;

 fileUtilities.textToXmlObject = textToXmlObject;

 fileUtilities.saveAsPng = function(filename, scale, bg, maxWidth, maxHeight) {
   if(maxWidth || maxHeight) {
     var pngContent = cy.png({
       full: true, bg: bg, 
       maxWidth: maxWidth, maxHeight: maxHeight
     });
   }
   else {
     var pngContent = cy.png({
       scale: scale || 3, full: true, bg: bg
     });
   }

   // this is to remove the beginning of the pngContent: data:img/png;base64,
   var b64data = pngContent.substr(pngContent.indexOf(",") + 1);

   // lower quality when response is empty
   if(!b64data || b64data === ""){
     pngContent = cy.png({maxWidth: 15000, maxHeight: 15000, full: true, bg: bg});
     b64data = pngContent.substr(pngContent.indexOf(",") + 1);
   }

   saveAs(b64toBlob(b64data, "image/png"), filename || "network.png");
 };

 fileUtilities.saveAsJpg = function(filename, scale, bg, maxWidth, maxHeight, quality) {
   if(maxWidth || maxHeight) {
     var jpgContent = cy.jpg({
       full: true, bg: bg, 
       maxWidth: maxWidth, maxHeight: maxHeight, 
       quality: quality
     });
   }
   else {
     var jpgContent = cy.jpg({
       scale: scale || 3, full: true, bg: bg, 
       quality: quality
     });
   }
   
   // this is to remove the beginning of the pngContent: data:img/png;base64,
   var b64data = jpgContent.substr(jpgContent.indexOf(",") + 1);

   // lower quality when response is empty
   if(!b64data || b64data === ""){
     jpgContent = cy.jpg({maxWidth: 15000, maxHeight: 15000, full: true, bg: bg});
     b64data = jpgContent.substr(jpgContent.indexOf(",") + 1);
   }

   saveAs(b64toBlob(b64data, "image/jpg"), filename || "network.jpg");
 };

 fileUtilities.saveAsSvg = function(filename, scale, bg, maxWidth, maxHeight) {
   if (maxWidth || maxHeight) {
     var svgContent = cy.svg({
       full: true, bg: bg, 
       maxWidth: maxWidth, maxHeight: maxHeight
     });
   }
   else {
     var svgContent = cy.svg({scale: scale || 1, full: true, bg: bg});
   }
   saveAs(new Blob([svgContent], {type:"image/svg+xml;charset=utf-8"}), filename || "network.svg");
 };

 fileUtilities.loadSample = function(filename, folderpath, callback) {
   var file = (folderpath || 'sample-app/samples/') + filename;

   uiUtilities.startSpinner("load-spinner");
   // Users may want to do customized things while a sample is being loaded
   // Trigger an event for this purpose and specify the 'filename' as an event parameter
   $(document).trigger( "sbgnvizLoadSample", [ filename, cy ] ); // Aliases for sbgnvizLoadSampleStart
   $(document).trigger( "sbgnvizLoadSampleStart", [ filename, cy ] );
   var text = loadTextDoc(file);
   var matchResult = text.match("<renderInformation[^]*</renderInformation>");
   if(matchResult != null){
     var renderInfoString = matchResult[0];
     var renderInfoStringCopy = (' ' + renderInfoString).slice(1);
     const regex = /\s([\S]+)([\s]*)=/g;
     var result;
     var matches = []; 
     while(result = regex.exec(renderInfoString)) {
       matches.push(result[0]);
     };
     matches.forEach(function(match){
       renderInfoString = renderInfoString.replace(match , textUtilities.FromKebabToCamelCase(match));
     });      
     text = text.replace(renderInfoStringCopy, renderInfoString);
    }
      var xmlObject = textToXmlObject(text);
      setTimeout(function () {
        updateGraph(nwtToJson.convert(xmlObject));
        fileUtilities.collapseMarkedNodes();
        uiUtilities.endSpinner("load-spinner");
        $(document).trigger( "sbgnvizLoadSampleEnd", [ filename, cy ] ); // Trigger an event signaling that a sample is loaded
        if (typeof callback !== 'undefined') {
         callback(); }
      },0);
 };

 fileUtilities.loadSIFFile = function(file, layoutBy, callback) {
   var convert = function( text ) {
     return sifToJson.convert(text);
   };

   var runLayout = function() {
     if ( layoutBy ) {
       if ( typeof layoutBy === 'function' ) {
         layoutBy();
       }
       else {
         var layout = cy.layout( layoutBy );

         // for backward compatibility need to make this if check
         if ( layout && layout.run ) {
           layout.run();
         }
       }
     }

     cy.fit( cy.elements(":visible"), 20 );

   };

   fileUtilities.loadFile( file, convert, undefined, callback, undefined, runLayout );
 };

 fileUtilities.loadTDFile = function functionName(file, callback) {
   var convert = function( text ) {
     return tdToJson.convert(text);
   };

   fileUtilities.loadFile( file, convert, undefined, callback );
 };

 fileUtilities.loadSBGNMLFile = function(file, callback1, callback2) {
   var convert = function( text ) {
     return sbgnmlToJson.convert(textToXmlObject(text));
   };

   fileUtilities.loadFile( file, convert, callback1, callback2, fileUtilities.collapseMarkedNodes );
 };

 fileUtilities.loadNwtFile = function(file, callback1, callback2, urlParams) {
   var convert = function( text ) {
     return nwtToJson.convert(textToXmlObject(text), urlParams);
   };

   fileUtilities.loadFile( file, convert, callback1, callback2, fileUtilities.collapseMarkedNodes );
 };

 // collapse the nodes whose collapse data field is set
 fileUtilities.collapseMarkedNodes = function() {
   // collapse nodes
   var nodesToCollapse = cy.nodes("[collapse]");
   if (nodesToCollapse.length > 0 ){
     cy.expandCollapse('get').collapse(nodesToCollapse, {layoutBy: null});

     nodesToCollapse.forEach(function(ele, i, eles){
       ele.position(ele.data("positionBeforeSaving"));
     });
     nodesToCollapse.removeData("positionBeforeSaving");
   }
 };

 /*
   callback is a function remotely defined to add specific behavior that isn't implemented here.
   it is completely optional.
   signature: callback(textXml)
 */
 fileUtilities.loadFile = function(file, convertFcn, callback1, callback2, callback3, callback4) {
   var self = this;
   uiUtilities.startSpinner("load-file-spinner");

   var textType = /text.*/;

   var reader = new FileReader();

   reader.onload = function (e) {
     var text = this.result;
    var matchResult = text.match("<renderInformation[^]*</renderInformation>");
    if(matchResult != null){
    var imagesElementMatch = text.match("<listOfBackgroundImages[^]*</listOfBackgroundImages>");
    var imagesElement;
    if(imagesElementMatch != null){
      imagesElement = imagesElementMatch[0];
    }
    var renderInfoString = matchResult[0];
    var renderInfoStringCopy = (' ' + renderInfoString).slice(1);
      const regex = /\s([\S]+)([\s]*)=/g;
      var result;
      var matches = []; 
      while(result = regex.exec(renderInfoString)) {
        matches.push(result[0]);
      };
      matches.forEach(function(match){
        renderInfoString = renderInfoString.replace(match , textUtilities.FromKebabToCamelCase(match));
      });      
      text = text.replace(renderInfoStringCopy, renderInfoString);
      var imagesElementMatchDirty = text.match("<listOfBackgroundImages[^]*</listOfBackgroundImages>");
      if(imagesElementMatchDirty != null){
        text = text.replace(imagesElementMatchDirty[0],imagesElement);
      }
    }

     setTimeout(function () {

       if (typeof callback1 !== 'undefined') callback1(text);

       var cyGraph;
       try {
         cyGraph = convertFcn( text );
         // Users may want to do customized things while an external file is being loaded
         // Trigger an event for this purpose and specify the 'filename' as an event parameter
         $(document).trigger( "sbgnvizLoadFile", [ file.name, cy ] ); // Aliases for sbgnvizLoadFileStart
         $(document).trigger( "sbgnvizLoadFileStart", [ file.name, cy ] );
       }
       catch (err) {
         uiUtilities.endSpinner("load-file-spinner");
         console.log(err);
         if (typeof callback2 !== 'undefined') callback2();
         return;
       }

       updateGraph(cyGraph);

       if (typeof callback3 !== 'undefined') {
         callback3();
       }

       uiUtilities.endSpinner("load-file-spinner");
       $(document).trigger( "sbgnvizLoadFileEnd", [ file.name, cy ] ); // Trigger an event signaling that a file is loaded

       if (typeof callback4 !== 'undefined') {
         callback4();
       }
     }, 0);
   };

   reader.readAsText(file);
 };

 fileUtilities.loadSBGNMLText = function(textData, tileInfoBoxes, filename, cy, urlParams){
     setTimeout(function () {
         updateGraph(sbgnmlToJson.convert(textToXmlObject(textData), urlParams), undefined, undefined, tileInfoBoxes);
         $(document).trigger("sbgnvizLoadFileEnd",  [filename, cy]);
         uiUtilities.endSpinner("load-file-spinner");
     }, 0);

 };

 // supported versions are either 0.2 or 0.3
 fileUtilities.saveAsSbgnml = function(filename, version, renderInfo, mapProperties, nodes, edges) {
   var sbgnmlText = jsonToSbgnml.createSbgnml(filename, version, renderInfo, mapProperties, nodes, edges);
   var blob = new Blob([sbgnmlText], {
     type: "text/plain;charset=utf-8;",
   });
   saveAs(blob, filename);
 };

 // supported versions are either 0.2 or 0.3
 fileUtilities.saveAsNwt = function(filename, version, renderInfo, mapProperties, nodes, edges) {
   var sbgnmlText = jsonToNwt.createNwt(filename, version, renderInfo, mapProperties, nodes, edges);
   var blob = new Blob([sbgnmlText], {
     type: "text/plain;charset=utf-8;",
   });
   saveAs(blob, filename);
 };

 fileUtilities.saveAsCellDesigner = function(filename, errorCallback){
  uiUtilities.startSpinner("load-spinner");
  var sbgnml = jsonToSbgnml.createSbgnml(); 
  this.convertSbgnmlToCD(sbgnml, function(data){
    if(data == null){
      errorCallback();
    }else{
      var blob = new Blob([data], {
        type: "text/plain;charset=utf-8;",
      });
      saveAs(blob, filename); 
    }
    uiUtilities.endSpinner("load-spinner");
    
  });
  

 }

 fileUtilities.loadCellDesigner = function(file, successCallback, errorCallback){
  var reader = new FileReader();

  reader.onload = function (e) { 
  
    this.convertCDToSbgnml(e.target.result, function(data){
      uiUtilities.endSpinner("load-spinner");
      if(data == null){
        errorCallback();
      }else{
        successCallback(data);
      }
    });
  }.bind(this);
  uiUtilities.startSpinner("load-spinner");
  reader.readAsText(file);
 }

 fileUtilities.saveAsSbml = function(filename,errorCallback){
  uiUtilities.startSpinner("load-spinner");
  var sbgnml = this.convertSbgn();
  
  this.convertSbgnmlToSbml(sbgnml, function(data){
    
    if(!data.result){
      errorCallback(sbgnml,data.error);
    }else if( data.message.indexOf("Internal server error") !== -1)
    {
      errorCallback(sbgnml,data.message);
    }else{    
      var blob = new Blob([data.message], {
        type: "text/plain;charset=utf-8;",
      });
      saveAs(blob, filename); 
      
    }

    uiUtilities.endSpinner("load-spinner");
    
  });

 }

 fileUtilities.loadSbml = function(file, successCallback, errorCallback){
  var reader = new FileReader();

  reader.onload = function (e) { 
    
    this.convertSbmlToSbgnml(e.target.result, function(data){
      uiUtilities.endSpinner("load-spinner");
      if(data == null){
        errorCallback();
      }else{
        successCallback(data);
      }
    });
  }.bind(this);
  uiUtilities.startSpinner("load-spinner");
  reader.readAsText(file);

 }


 fileUtilities.convertSbgn= function(filename, version, renderInfo, mapProperties, nodes, edges) {
  var sbgnmlText = jsonToSbgnml.createSbgnml(filename, "plain", renderInfo, mapProperties, nodes, edges);
 
  return sbgnmlText;
};

 fileUtilities.exportLayoutData = function(filename, byName) {
   var layoutText = layoutToText.convert( byName );

   var blob = new Blob([layoutText], {
     type: "text/plain;charset=utf-8;",
   });
   saveAs(blob, filename);
 };

 fileUtilities.saveAsPlainSif = function(filename) {
   var text = jsonToSif.convert();

   var blob = new Blob([text], {
     type: "text/plain;charset=utf-8;",
   });
   saveAs(blob, filename);
 };

 fileUtilities.convertSbgnmlTextToJson = function(sbgnmlText){
     return sbgnmlToJson.convert(textToXmlObject(sbgnmlText));
 };

 fileUtilities.convertSifTextToJson = function(sifText){
        return sifToJson.convert(sifText);
 };
 
fileUtilities.createJsonFromSBGN = function(){


    var sbgnmlText = jsonToSbgnml.createSbgnml();
    return sbgnmlToJson.convert(textToXmlObject(sbgnmlText));
};

fileUtilities.createJsonFromSif = function(){

    var sifText = jsonToSif.convert();
    return sifToJson.convert(sifText);
    
};

fileUtilities.convertSbgnmlToCD = function(sbgnml, callback){
   
  return sbgnmlToCd.convert(sbgnml,callback);
};

fileUtilities.convertSbgnmlToSbml = function(sbgnml, callback){
   
  return sbgnmlToSbml.convert(sbgnml,callback);
};

fileUtilities.convertSbmlToSbgnml = function(sbml, callback){
  return sbmlToSbgnml.convert(sbml,callback);
}
fileUtilities.convertCDToSbgnml = function(xml,callback){
  return cdToSbgnml.convert(xml,callback);
}


 return fileUtilities;
};
