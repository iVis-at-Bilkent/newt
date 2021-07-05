

module.exports = function() {

    var jsonToSbgnml, elementUtilities, cy;
  
    function cdToSbgnml(param) {
      jsonToSbgnml = param.jsonToSbgnmlConverter;
      elementUtilities = param.elementUtilities;
      cy = param.sbgnCyInstance.getCy();
    }
  
 
    cdToSbgnml.convert = function (xml,callback) {

        $.ajax({
            type: 'post',
            url: "http://web.newteditor.org:8080/cd2sbgnml",
            data: xml,
            success: function (data) {
                callback(data);
            },
            error: function (error) {
             callback(null);
            }
        })
    }

    return cdToSbgnml;
  
  }
  

