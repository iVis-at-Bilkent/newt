module.exports = function () {

    var jsonToSbgnml, elementUtilities, cy;

    function sbgnmlToSbml(param) {
        jsonToSbgnml = param.jsonToSbgnmlConverter;
        elementUtilities = param.elementUtilities;
        cy = param.sbgnCyInstance.getCy();
    }


    sbgnmlToSbml.convert = function (xml, callback) {
        var conversionApiUrl = "https://minerva-service.lcsb.uni.lu/minerva/api/convert/SBGN-ML:SBML";

        return $.ajax({
            type: 'post',
            url: conversionApiUrl,
            contentType: "text/xml; charset=UTF-8",
            data: xml,
            dataType: "text",
            success: function (data, textStatus, xhr) {
                if (xhr.status !== 200) {
                    callback({result: false, error: data, message: "Invalid response code: " + xhr.status});
                } else {
                    callback({result: true, message: data, error: ""});
                }
            },
            error: function (error) {
                callback({result: false, error: error, message: ""});
            },
            fail: function (error) {
                callback({result: false, error: error, message: ""});
            },
        })
    }

    return sbgnmlToSbml;

}
  