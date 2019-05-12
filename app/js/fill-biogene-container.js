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
    type: "GET", //"POST",
    url: queryScriptURL,
    async: true,
    data: queryParams,
  })
          .then(function (queryResult) {
            // - json parse is not required when no PHP involved
            if (queryResult.count > 0 && queryParams.query != "" && typeof queryParams.query != 'undefined')
            {
              var info = (new BioGeneView(
                      {
                        el: '#biogene-container',
                        model: queryResult.geneInfo[0]
                      })).render();
            }
            else {
              $('#biogene-container').html("<span style='padding-left: 3px;'>No additional information available for the selected node!</span>");
            }
          }, function (xhr, status, error) {
            $('#biogene-container').html("<span style='padding-left: 3px;'>Error retrieving data: " + error + "</span>");
          });
  $('#biogene-title').html("<b>" + node.data('label') + "</b>");
};

module.exports = fillBioGeneContainer;