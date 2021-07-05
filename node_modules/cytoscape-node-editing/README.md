cytoscape-node-editing
================================================================================

## Description
A Cytoscape.js extension to provide certain node editing functionality as follows:
- grapples to resize nodes,
- a visual cue to resize node to its label, and
- ability to move selected nodes with arrow keys (accelerator keys *Alt* and *Shift* result in slower and faster moves, respectively),
distributed under [The MIT License](https://opensource.org/licenses/MIT).

<img src="node-editing-animated-demo.gif" width="340">

Please cite the following paper when using this extension:

U. Dogrusoz , A. Karacelik, I. Safarli, H. Balci, L. Dervishi, and M.C. Siper, "[Efficient methods and readily customizable libraries for managing complexity of large networks](https://doi.org/10.1371/journal.pone.0197238)", PLoS ONE, 13(5): e0197238, 2018.

## Demo

Here are demos: **simple** and **undoable**, respectively:
<p align="center">
<a href="https://raw.githack.com/iVis-at-Bilkent/cytoscape.js-node-editing/unstable/demo.html" title="Simple"><img src="https://www.cs.bilkent.edu.tr/~ivis/images/demo1.png" height=42px></a> &emsp;
<a href="https://raw.githack.com/iVis-at-Bilkent/cytoscape.js-node-editing/unstable/undoable_demo.html" title="Undoable"><img src="https://www.cs.bilkent.edu.tr/~ivis/images/demo2.png" height=42px></a>
</p>

## Default Options

```js
            cy.nodeEditing({
                padding: 5, // spacing between node and grapples/rectangle
                undoable: true, // and if cy.undoRedo exists
    
                grappleSize: 8, // size of square dots
                grappleColor: "green", // color of grapples
                inactiveGrappleStroke: "inside 1px blue",               
                boundingRectangleLineDash: [4, 8], // line dash of bounding rectangle
                boundingRectangleLineColor: "red",
                boundingRectangleLineWidth: 1.5,
                zIndex: 999,
    
                minWidth: function (node) {
                    var data = node.data("resizeMinWidth");
                    return data ? data : 15;
                }, // a function returns min width of node
                minHeight: function (node) {
                    var data = node.data("resizeMinHeight");
                    return data ? data : 15;
                }, // a function returns min height of node

                // Getters for some style properties the defaults returns ele.css('property-name')
                // you are encouraged to override these getters
                getCompoundMinWidth: function(node) { 
                  return node.css('min-width'); 
                },
                getCompoundMinHeight: function(node) { 
                  return node.css('min-height'); 
                },
                getCompoundMinWidthBiasRight: function(node) {
                  return node.css('min-width-bias-right');
                },
                getCompoundMinWidthBiasLeft: function(node) { 
                  return node.css('min-width-bias-left');
                },
                getCompoundMinHeightBiasTop: function(node) {
                  return node.css('min-height-bias-top');
                },
                getCompoundMinHeightBiasBottom: function(node) { 
                  return node.css('min-height-bias-bottom');
                },

                // These optional functions will be executed to set the width/height of a node in this extension
                // Using node.css() is not a recommended way (http://js.cytoscape.org/#eles.style) to do this. Therefore,
                // overriding these defaults so that a data field or something like that will be used to set node dimentions
                // instead of directly calling node.css() is highly recommended (Of course this will require a proper 
                // setting in the stylesheet).
                setWidth: function(node, width) { 
                    node.css('width', width);
                },
                setHeight: function(node, height) {
                    node.css('height', height);
                },
    
                isFixedAspectRatioResizeMode: function (node) { return node.is(".fixedAspectRatioResizeMode") },// with only 4 active grapples (at corners)
                isNoResizeMode: function (node) { return node.is(".noResizeMode, :parent") }, // no active grapples
                isNoControlsMode: function (node) { return node.is(".noControlsMode") }, // no controls - do not draw grapples
    
                cursors: { // See http://www.w3schools.com/cssref/tryit.asp?filename=trycss_cursor
                    // May take any "cursor" css property
                    default: "default", // to be set after resizing finished or mouseleave
                    inactive: "not-allowed",
                    nw: "nw-resize",
                    n: "n-resize",
                    ne: "ne-resize",
                    e: "e-resize",
                    se: "se-resize",
                    s: "s-resize",
                    sw: "sw-resize",
                    w: "w-resize"
                }

                // enable resize content cue according to the node
                resizeToContentCueEnabled: function (node) {
                  return true;
                },
                // handle resize to content with given function
                // default function resizes node according to the label
                resizeToContentFunction: undefined,
                // select position of the resize to content cue
                // options: 'top-left', 'top-right', 'bottom-left', 'bottom-right'
                resizeToContentCuePosition: 'bottom-right',
                // relative path of the resize to content cue image
                resizeToContentCueImage: '/node_modules/cytoscape-node-editing/resizeCue.svg',
                enableMovementWithArrowKeys: true,
                autoRemoveResizeToContentCue: false,
             });
```

## API

  `var api = cy.nodeEditing('get')`
   To get the extension instance after initialization.

  `api.refreshGrapples()`
   Refresh rendered node grapples if any. It is an expensive operation and is supposed to be called in rare cases (When it is really needed).

  `api.removeGrapples()`
   Remove grapples while node is selected. This is useful when a node is selected but no need to show grapples. 


## Dependencies

 * Cytoscape.js ^3.2.0
 * jquery ^1.7.0 || ^2.0.0 || ^3.0.0
 * konva ^7.0.3
 * cytoscape-undo-redo ^1.0.10 (optional)


## Usage instructions

Download the library:
 * via npm: `npm install cytoscape-node-editing`,
 * via bower: `bower install cytoscape-node-editing`, or
 * via direct download in the repository (probably from a tag).

`require()` the library as appropriate for your project:

CommonJS:
```js
var cytoscape = require('cytoscape');
var nodeEditing = require('cytoscape-node-editing');
var konva = require('konva');

nodeEditing( cytoscape, jQuery, konva ); // register extension
```

AMD:
```js
require(['cytoscape', 'cytoscape-node-editing', 'jquery', 'konva'], function( cytoscape, nodeEditing, jQuery, konva ){
  nodeEditing( cytoscape, jQuery, konva ); // register extension
});
```

Plain HTML/JS has the extension registered for you automatically, because no `require()` is needed.


## Emitted Events
`cy.on("nodeediting.resizestart", function(e, type, node){ })`

`cy.on("nodeediting.resizeend", function(e, type, node){ })`

`cy.on("nodeediting.resizedrag", function(e, type, node){ })`

`cy.on("nodeediting.resizetocontent", function(e, node){ })`

`type` param can be `topleft`, `topcenter`, `topright`, `centerright`, 
`bottomright`, `bottomcenter`, `bottomleft`, `centerleft`

`node` param corresponds to currently resizing node.

## Build targets

* `npm run build` : Build `./src/**` into `cytoscape-edge-editing.js` in production environment and minimize the file.
* `npm run build:dev` :  Build `./src/**` into `cytoscape-edge-editing.js` in development environment without minimizing the file.

## Publishing instructions

This project is set up to automatically be published to npm and bower.  To publish:

1. Build the extension : `npm run build`
1. Commit the build : `git commit -am "Build for release"`
1. Bump the version number and tag: `npm version major|minor|patch`
1. Push to origin: `git push && git push --tags`
1. Publish to npm: `npm publish .`
1. If publishing to bower for the first time, you'll need to run `bower register cytoscape-edge-editing https://github.com/iVis-at-Bilkent/cytoscape.js-edge-editing.git`

## Team

  * [Muhammed Salih Altun](https://github.com/msalihaltun), [Ugur Dogrusoz](https://github.com/ugurdogrusoz) of [i-Vis at Bilkent University](http://www.cs.bilkent.edu.tr/~ivis)

### Alumni

  * [Metin Can Siper](https://github.com/metincansiper), [Ahmet Candiroglu](https://github.com/ahmetcandiroglu), [Selim Firat Yilmaz](https://github.com/mrsfy)
