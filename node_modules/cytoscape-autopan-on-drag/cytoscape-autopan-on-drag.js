;(function(){ 'use strict';

  // registers the extension on a cytoscape lib ref
  var register = function( cytoscape ){

    if( !cytoscape ){ return; } // can't register if cytoscape unspecified

    // Default options
    var defaults = {
      enabled: true, // Whether the extension is enabled on register
      selector: 'node', // Which elements will be affected by this extension
      speed: 1 // Speed of panning when elements exceed canvas bounds
    };

    // Merge default options with the ones coming from parameter
    function extend(defaults, options) {
      var obj = {};

      for (var i in defaults) {
        obj[i] = defaults[i];
      }

      for (var i in options) {
        obj[i] = options[i];
      }

      return obj;
    };

    // Get scratch pad reserved for this extension on the given element or the core if 'name' parameter is not set,
    // if the 'name' parameter is set then return the related property in the scratch instead of the whole scratchpad
    function getScratch (eleOrCy, name) {

        if (eleOrCy.scratch("_autopanOnDrag") === undefined) {
            eleOrCy.scratch("_autopanOnDrag", {});
        }

        var scratchPad = eleOrCy.scratch("_autopanOnDrag");

        return ( name === undefined ) ? scratchPad : scratchPad[name];
    }

    // Set the a field (described by 'name' parameter) of scratchPad (that is reserved for this extension
    // on an element or the core) to the given value (by 'val' parameter)
    function setScratch (eleOrCy, name, val) {

        var scratchPad = getScratch(eleOrCy);
        scratchPad[name] = val;
        eleOrCy.scratch("_autopanOnDrag", scratchPad);
    }

    function bindCyEvents (cy, options) {

      // check if the extension is enabled if it is return directly
      var enabled = getScratch(cy, 'enabled');

      if (enabled) {
        return;
      }

      // get eventFcns from the scratch pad, this object is empty
      // or each property of it will be overridden inside this function
      var eventFcns = getScratch(cy, 'eventFcns');

      // get user options from the scratch pad
      var options = getScratch(cy, 'options');

      cy.on('tapstart', options.selector, eventFcns.tapstartFcn = function() {
        var node = this;
        
        var renderedPosition = node.renderedPosition();
        var renderedWidth = node.renderedWidth();
        var renderedHeight = node.renderedHeight();
        
        var maxRenderedX = cy.width();
        var maxRenderedY = cy.height();
        
        var topLeftRenderedPosition = {
          x: renderedPosition.x - renderedWidth / 2,
          y: renderedPosition.y - renderedHeight / 2
        };

        var bottomRightRenderedPosition = {
          x: renderedPosition.x + renderedWidth / 2,
          y: renderedPosition.y + renderedHeight / 2
        };
        
        var exceed = false;
        
        if( ( bottomRightRenderedPosition.x >= maxRenderedX ) || ( topLeftRenderedPosition.x <= 0 )
                || ( bottomRightRenderedPosition.y >= maxRenderedY ) || ( topLeftRenderedPosition.y <= 0 ) ){
          exceed = true;
        }
        
        if( !exceed ) {
          // save the node who is currently being dragged to the scratch pad
          setScratch(cy, 'currentNode', node);
        }
        
      });

      cy.on('tapdrag', eventFcns.tapdragFcn = function() {

        // get the node who is currently being dragged from scratch pad
        var currentNode = getScratch(cy, 'currentNode');

        if(currentNode === undefined) {
          return;
        }
        
        var newRenderedPosition = currentNode.renderedPosition();
        var renderedWidth = currentNode.renderedWidth();
        var renderedHeight = currentNode.renderedHeight();
        
        var maxRenderedX = cy.width();
        var maxRenderedY = cy.height();

        var topLeftRenderedPosition = {
          x: newRenderedPosition.x - renderedWidth / 2,
          y: newRenderedPosition.y - renderedHeight / 2
        };

        var bottomRightRenderedPosition = {
          x: newRenderedPosition.x + renderedWidth / 2,
          y: newRenderedPosition.y + renderedHeight / 2
        };
       
        var exceedX;
        var exceedY;
        
        if(bottomRightRenderedPosition.x >= maxRenderedX) {
          exceedX = -bottomRightRenderedPosition.x + maxRenderedX;
        }
        
        if(topLeftRenderedPosition.x <= 0) {
          exceedX = -topLeftRenderedPosition.x;
        }
        
        if(bottomRightRenderedPosition.y >= maxRenderedY ) {
          exceedY = -bottomRightRenderedPosition.y + maxRenderedY;
        }
        
        if(topLeftRenderedPosition.y <= 0) {
          exceedY = -topLeftRenderedPosition.y;
        }
        
        if(exceedX) {
          cy.panBy({x: exceedX * options.speed});
        }
        
        if(exceedY) {
          cy.panBy({y: exceedY * options.speed});
        }
      });

      cy.on('tapend', eventFcns.tapendFcn = function() {
        // unset the currently dragged node on scratch pad
        setScratch(cy, 'currentNode', undefined);
      });

      // save the eventFcns on scratch pad
      setScratch(cy, 'eventFcns', eventFcns);

      // mark that the extension is enabled now
      setScratch(cy, 'enabled', true);
    }

    function unbindCyEvents (cy) {

      // check if the extension is enabled if it is not return directly
      var enabled = getScratch(cy, 'enabled');

      if (!enabled) {
        return;
      }

      var eventFcns = getScratch(cy, 'eventFcns');
      var options = getScratch(cy, 'options');

      cy.off('tapstart', options.selector, eventFcns.tapstartFcn);
      cy.off('tapdrag', eventFcns.tapdragFcn);
      cy.off('tapend', eventFcns.tapendFcn);

      // mark that the extension is disabled now
      setScratch(cy, 'enabled', undefined);
    }
    
    cytoscape( 'core', 'autopanOnDrag', function(opts){

      var cy = this;

      // use the existing eventFcns if exists or create a new object for them
      var eventFcns = getScratch(cy, 'eventFcns') || {};

      // save eventFcns on scratch pad
      setScratch(cy, 'eventFcns', eventFcns);

      if(opts !== 'get') {
        // merge the options with existing ones
        var options = extend(defaults, opts);

        // save options to the scratch pad
        setScratch(cy, 'options', options);

        // if enabled option is set bind events for the cy instance
        if(options.enabled) {

          // bind the events
          bindCyEvents(cy);

          // mark that the extension is enabled
          setScratch(cy, 'enabled', true);
        }
      }

      // return the extension api
      return {
        enable: function() {
          bindCyEvents(cy);
        },
        disable: function() {
          unbindCyEvents(cy);
        }
      };

    });

  };

  if( typeof module !== 'undefined' && module.exports ){ // expose as a commonjs module
    module.exports = register;
  }

  if( typeof define !== 'undefined' && define.amd ){ // expose as an amd/requirejs module
    define('cytoscape-context-menus', function(){
      return register;
    });
  }

  if( typeof cytoscape !== 'undefined' ){ // expose to global cytoscape (i.e. window.cytoscape)
    register( cytoscape );
  }

})();
