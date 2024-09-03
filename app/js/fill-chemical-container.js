var jquery = $ = require('jquery');
var _ = require('underscore');
var ChemicalView = require('./backbone-views').ChemicalView;


var fillChemicalContainer = function (node, dataFetchSuccessCallback) {
  var geneClass = node.data('class');
  if (geneClass != 'simple chemical' && geneClass != 'BA simple chemical' && geneClass != 'SIF simple chemical') {
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
    type: 'get',
    url: "/utilities/testURL",
    data: {url: queryScriptURL, qs: queryParams},
    success: function(data){
      if (!data.error && data.response.statusCode == 200 && data.response.body) {
        var json = JSON.parse(data.response.body);
        if(json.response.numFound > 0){
          new ChemicalView({
            el: '#chemical-container',
            model: json.response.docs[0]
          }).render();
        }
        else {
          $('#chemical-container').html("<span style='padding-left: 3px;'>No information found!</span>");
        }
        dataFetchSuccessCallback();
      }
      else {
        $('#chemical-container').html("<span style='padding-left: 3px;'>No additional information available for the selected node!</span>");
      }
    },
    error: function(xhr, options, err){
      $('#chemical-container').html("<span style='padding-left: 3px;'>Error retrieving data: " + err + "</span>");
    }
  });
  $('#chemical-title').html("<b>" + node.data('label') + "</b>");
};

module.exports = fillChemicalContainer;