var jquery = $ = require('jquery');
var _ = require('underscore');
var ChemicalView = require('./backbone-views').ChemicalView;


var fillChemicalContainer = function (node) {
  var geneClass = node.data('class');
  if (geneClass != 'simple chemical') {
    $("#chemical-container").html("");
    return;
  }

  var queryScriptURL = "https://www.ebi.ac.uk/ols/api/search";
  var geneName = node.data('label');

  if (geneName == "" || geneName == undefined)
  {
      $('#chemical-title').html("<b>" + node.data('label') + "</b>");
      $('#chemical-container').html("<span style='padding-left: 3px;'>No additional information available for the selected node!</span>");
      return;
  }

  // set the query parameters
  var queryParams = {
    ontology: 'chebi',
    exact: 'true',
    queryFields: 'label',
    q: geneName
  };
  
  $.ajax({
    type: "GET", //"POST",
    url: queryScriptURL,
    async: true,
    data: queryParams,
  })
          .then(
              function (queryResult) {
            // - json parse is not required when no PHP involved
            if (queryResult.response.numFound > 0)
            {
              var info = (new ChemicalView(
                      {
                        el: '#chemical-container',
                        model: queryResult.response.docs[0]
                      })).render();
            }
            else {
              $('#chemical-container').html("<span style='padding-left: 3px;'>No additional information available for the selected node!</span>");
            }
          },
          function (xhr, status, error) {
            $('#chemical-container').html("<span style='padding-left: 3px;'>Error retrieving data: " + error + "</span>");
          }
          );
  $('#chemical-title').html("<b>" + node.data('label') + "</b>");
};

module.exports = fillChemicalContainer;