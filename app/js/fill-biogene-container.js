var jquery = $ = require('jquery');
var _ = require('underscore');
var BioGeneView = require('./backbone-views').BioGeneView;

/*
 * Copyright 2013 Memorial-Sloan Kettering Cancer Center.
 *
 * This file is part of PCViz.
 *
 * PCViz is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * PCViz is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with PCViz. If not, see <http://www.gnu.org/licenses/>.
 */

var fillBioGeneContainer = function (node) {
  var geneClass = node.data('class');
  if (geneClass != 'macromolecule' && geneClass != 'nucleic acid feature' &&
          geneClass != 'unspecified entity') {
    $("#biogene-container").html("");
    return;
  }

  var queryScriptURL = "http://www.pathwaycommons.org/biogene/retrieve.do";
  var geneName = node.data('label');

  // set the query parameters
  var queryParams = {
    query: geneName,
    org: "human",
    format: "json",
  };

  $.ajax({
    type: 'get',
    url: "/utilities/testURL",
    data: {url: queryScriptURL, qs: queryParams},
    success: function(data){
      if (!data.error && data.response.statusCode == 200 && data.response.body && 
        queryParams.query != "" && typeof queryParams.query != 'undefined') {
        
        var json = JSON.parse(data.response.body);
        if(json.count > 0){
          new BioGeneView({
            el: '#biogene-container',
            model: json.geneInfo[0]
          }).render();
        }
      }
      else {
        $('#biogene-container').html("<span style='padding-left: 3px;'>No additional information available for the selected node!</span>");
      }
    },
    error: function(xhr, options, err){
      $('#biogene-container').html("<span style='padding-left: 3px;'>Error retrieving data: " + err + "</span>");
    }
  });
  $('#biogene-title').html("<b>" + node.data('label') + "</b>");
};

module.exports = fillBioGeneContainer;
