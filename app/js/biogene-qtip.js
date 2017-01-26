var jQuery = $ = require('jQuery');
var _ = require('underscore');

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

var bioGeneQtip = function (node) {
  var BioGeneView = require('./backbone-views').BioGeneView;
  
  $(".qtip").remove();

  if (node.qtipTimeOutFcn != null) {
    clearTimeout(node.qtipTimeOutFcn);
    node.qtipTimeOutFcn = null;
  }

  var geneClass = node._private.data.class;
  if (geneClass != 'macromolecule' && geneClass != 'nucleic acid feature' &&
          geneClass != 'unspecified entity')
    return;

  // use a biogene proxy (no PHP) to enable CORS requests (AJAX)
  var queryScriptURL = "http://www.pathwaycommons.org/biogene/retrieve.do"; //="sampleapp-components/php/BioGeneQuery.php";
  var geneName = node._private.data.label;

  // set the query parameters
  var queryParams =
          {
            query: geneName,
            org: "human",
            format: "json",
          };

  cy.getElementById(node.id()).qtip({
    content: {
      text: function (event, api) {
        $.ajax({
          type: "GET", //"POST",
          url: queryScriptURL,
          async: true,
          data: queryParams
        }).then(function (queryResult) {
            // - json parse is not required when no PHP involved
            if (queryResult.count > 0 && queryParams.query)
            {
                var info = (new BioGeneView(
                    {
                        el: '#biogene-container',
                        model: queryResult.geneInfo[0]
                    })).render();
                var html = $('#biogene-container').html();
                api.set('content.text', html);
            }
            else {
                api.set('content.text', "No additional information available &#013; for the selected node!");
            }
        }, function (xhr, status, error) {
            api.set('content.text', "Error retrieving data: " + error);
        });
          api.set('content.title', node._private.data.label);
          return _.template($("#loading-small-template").html());
      }
    },
    show: {
      ready: true
    },
    position: {
      my: 'top center',
      at: 'bottom center',
      adjust: {
        cyViewport: true
      },
      effect: false
    },
    style: {
      classes: 'qtip-bootstrap',
      tip: {
        width: 16,
        height: 8
      }
    }
  });
};

module.exports = bioGeneQtip;