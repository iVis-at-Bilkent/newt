module.exports = function() {

    var jsonToSbgnml, elementUtilities, cy;
  
    function sbgnmlToCd(param) {
      jsonToSbgnml = param.jsonToSbgnmlConverter;
      elementUtilities = param.elementUtilities;
      cy = param.sbgnCyInstance.getCy();
    }
  
 
    sbgnmlToCd.convert = function (xml, callback) {

       $.ajax({
            type: 'post',             
            url: "http://web.newteditor.org:8080/sbgnml2cd",
            data: xml,
            success: function (data) {
                callback(data);              
            },
            error: function (XMLHttpRequest) {
                callback(null);                
            }
        });
       
        
    }

    return sbgnmlToCd;
  
  }
  

