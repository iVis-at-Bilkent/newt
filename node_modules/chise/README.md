# ChiSE

ChiSE is a library with an API based on [SBGNViz.js](https://github.com/iVis-at-Bilkent/sbgnviz.js), which in turn is based on [Cytoscape.js](http://cytoscape.github.io/cytoscape.js/), to visualize and edit the pathway models represented by process description (PD) and activity flow (AF) languages of [SBGN](http://sbgn.org) or in [simple interaction format (SIF)](https://www.pathwaycommons.org/pc/sif_interaction_rules.do). 

It accepts the pathway models represented in enriched [SBGN-ML](https://github.com/sbgn/sbgn/wiki/SBGN_ML) format, and can save edited pathways back to the same format, including layout, style, and annotation information, as well as static image formats (PNG, JPEG, and SVG). It can also import from and export to various formats from SIF to SBML to CellDesigner.
<br/>

## Software

ChiSE is distributed under [GNU Lesser General Public License](http://www.gnu.org/licenses/lgpl.html). 

**A sample application using ChiSE** can be found [here](http://newteditor.org/).

Please cite the following when you use ChiSE.js:

M. Sari, I. Bahceci, U. Dogrusoz, S.O. Sumer, B.A. Aksoy, O. Babur, E. Demir, "[SBGNViz: a tool for visualization and complexity management of SBGN process description maps](http://journals.plos.org/plosone/article?id=10.1371/journal.pone.0128985)", PLoS ONE, 10(6), e0128985, 2015.

## Default Options
```javascript
    var options = {
        // The path of core library images when sbgnviz is required from npm and the index html 
        // file and node_modules are under the same folder then using the default value is fine
        imgPath: 'node_modules/sbgnviz/src/img',
        // Whether to fit labels to nodes
        fitLabelsToNodes: function () {
          return false;
        },
        // dynamic label size it may be 'small', 'regular', 'large'
        dynamicLabelSize: function () {
          return 'regular';
        },
         // Whether to adjust labels to fit automatically.
        fitLabelsToInfoboxes: function () {
          return false;
        },
        // Whether to infer nesting on load 
        inferNestingOnLoad: function () {
          return false;
        },
        // percentage used to calculate compound paddings
        compoundPadding: function () {
          return 10;
        },       
        // The selector of the component containing the sbgn network
        networkContainerSelector: '#sbgn-network-container',
        // Whether the actions are undoable, requires cytoscape-undo-redo extension
        undoable: true,
        // Whether to have undoable drag feature in undo/redo extension. This option will be passed to undo/redo extension.
        undoableDrag: true
      };
```

## ChiSE Specific Data
```javascript
// Nodes specific data.
node.data('id'); // Id of a node. (Specific to cytoscape.js)
node.data('label'); // Label of a node. 'content' of elements are controlled by this data.
node.data('parent'); // Parent id of a node. (Specific to cytoscape.js)
node.data('class'); // SBGN specific class of a node. If it ends with 'multimer' it means that this node is a multimer.
node.data('clonemarker'); // Whether the node is cloned.
node.data('bbox'); // Bounding box of a node includes bbox.x, bbox.y, bbox.w, bbox.h. 'width' and 'height' style of elements are mapped by bbox.w and bbox.h
node.data('ports'); // Ports list of a node. A node port includes port.id, port.x, port.y where port.x and port.y are percentages relative to node position and size.
node.data('statesandinfos'); // Includes state and information boxes list of a node.
node.data('font-size'); // If the font sizes of the nodes are not automatically adjusted (controlled by adjustNodeLabelFontSizeAutomatically option) their 'font-size' style is adjusted by this data.
node.data('font-family');// 'font-family' style of nodes are controlled by this data.
node.data('font-style');// 'font-style' style of nodes are controlled by this data.
node.data('font-weight');// 'font-weight' style of nodes are controlled by this data.
node.data('background-color');// 'background-color' style of nodes are controlled by this data.
node.data('background-opacity');// 'background-opacity' style of nodes are controlled by this data.
node.data('border-color');// 'border-color' style of nodes are controlled by this data.
node.data('border-width');// 'border-width' style of nodes are controlled by this data.
// A stateorinfobox includes the followings.
var stateorinfobox = node.data('statesandinfos')[i];
stateorinfobox.id; // Id of that box.
stateorinfobox.clazz; // See whether that box is related to a 'unit of information' or a 'state variable'.
stateorinfobox.bbox; // Bbox of that box. Includes bbox.x, bbox.y, bbox.w, bbox.h where bbox.x and bbox.y are percentages relative to node position and size.
stateorinfobox.state; // Just included in state variables. Includes state.value and state.variable.
stateorinfobox.label; // Just included in units of information includes label.text.
// Edges specific data.
edge.data('id'); // Id of an edge. (Specific to cytoscape.js)
edge.data('source'); // Id of source node. (Specific to cytoscape.js)
edge.data('target'); // Id of target node. (Specific to cytoscape.js)
edge.data('class'); // SBGN specific class of an edge.
edge.data('cardinality'); // SBGN cardinality of an edge.
edge.data('portsource'); // This is set if the edge is connected to its source node by a specific port of that node.
edge.data('porttarget'); // This is set if the edge is connected to its target node by a specific port of that node.
edge.data('bendPointPositions'); // Bend point positions of an edge. Includes x and y coordinates. This data is to be passed to edgeEditing extension.
edge.data('controlPointPositions'); // Control point positions of an edge. Includes x and y coordinates. This data is to be passed to edgeEditing extension.
edge.data('width');// 'width' style of edges are controlled by this data.
edge.data('line-color');// 'line-color' style of edges are controlled by this data.
```

## API
ChiSE.js is built at the top of SBGNViz.js and any method exposed by SBGNViz.js is exposed in ChiSE.js as well ([SBGNViz.js API](https://github.com/iVis-at-Bilkent/sbgnviz.js#api)). Other ChiSE.js API is presented below.

`chise.register(libs)`
Register with libraries before creating instances

`var instance = chise(options)`
Creates an extension instance with the given options

`instance.getSbgnvizInstance()`
Get the Sbgnviz.js instance created for this Chise.js instance.

`instance.getCy()`
Get the Cytoscape.js instance created for this Chise.js instance.

`instance.addNode(x, y , nodeclass, id, parent, visibility)`
Adds a new node with the given class and at the given coordinates. Optionally you can set the id, parent and visibility of the node. Considers undoable option.

`instance.addEdge(source, target , edgeclass, id, visibility)`
Adds a new edge with the given class and having the given source and target ids. Optionally you can set the id and visibility of the node. Considers undoable option.

`instance.saveUnits(node)`
Saves old aux units of given node. Considers undoable option.

`instance.restoreUnits(node)`
Restores aux units from given data. Considers undoable option.

`instance.modifyUnits(node, ele, anchorSide)`
Modify aux unit layouts. Considers undoable option.

`instance.fitUnits(node, locations)`
Arranges information boxes. If force check is true, it rearranges all information boxes. Considers undoable option.

`instance.setDefaultProperty (_class, name, value)`
Sets the default property of elements with given class. Considers undoable option.

`instance.updateInfoboxObj (node, index, newProps)`
Updates the infobox at the given index in the given node with given properties. Considers undoable option.

`instance.addProcessWithConvenientEdges(source, target , processType)`
Adds a process with convenient edges. For more information please see 'https://github.com/iVis-at-Bilkent/newt/issues/9'. Considers undoable option.

`instance.cloneElements(eles)`
Clone given elements. Considers undoable option. Requires cytoscape-clipboard extension.

`instance.copyElements(eles)`
Copy given elements to clipboard. Requires cytoscape-clipboard extension.

`instance.pasteElements(eles)`
Paste the elements copied to clipboard. Considers undoable option. Requires cytoscape-clipboard extension.

`instance.align(nodes, horizontal, vertical, alignTo)`
Aligns given nodes in given horizontal and vertical order. Horizontal and vertical parameters may be 'none' or undefined.<br>
`alignTo`: indicates the leading node. Requires cytoscape-grid-guide extension and considers undoable option.

`instance.createCompoundForGivenNodes(nodes, compoundType)`
Create compound for given nodes. compoundType may be 'complex' or 'compartment'. This method considers undoable option.

`instance.changeParent(nodes, newParent, posDiffX, posDiffY)`
Move the nodes to a new parent and change their position if possDiff params are set. Considers undoable option and checks if the operation is valid.

`instance.createTemplateReaction(templateType, macromoleculeList, complexName, processPosition, tilingPaddingVertical, tilingPaddingHorizontal, edgeLength, layoutParam)`
Creates a template reaction with given parameters. Requires a layout to tile the free macromolecules included in the complex.
Considers undoable option. Parameters are explained below.<br>
`templateType`: The type of the template reaction. It may be 'association' or 'dissociation' for now.<br>
`macromoleculeList`: The list of the names of macromolecules which will involve in the reaction.<br>
`complexName`: The name of the complex in the reaction.<br>
`processPosition`: The modal position of the process in the reaction. The default value is the center of the canvas.<br>
`tilingPaddingVertical`: This option will be passed to the layout with the same name. The default value is 15.<br>
`tilingPaddingHorizontal`: This option will be passed to the layout with the same name. The default value is 15.<br>
`edgeLength`: The distance between the process and the macromolecules at the both sides.<br>
`layoutParam`: An object with key 'name' (e.g. { name: 'fcose' }) that indicates the name of the layout to be used.<br>

`instance.createActivationReaction(proteinName, processPosition, edgeLength, reverse)`
Creates an activation or deactivation type reaction (using the parameter `reverse`) for the given protein.

`instance.createMetabolicCatalyticActivity(inputNodeList, outputNodeList, catalystName, catalystType, processPosition, tilingPaddingVertical, tilingPaddingHorizontal, edgeLength)`
Creates a metabolic catalytic activity reaction.

`instance.createTranscriptionReaction(geneName, mRnaName, processPosition, edgeLength)`
Creates a transcription reaction.

`instance.createTranslationReaction(mRnaName, proteinName, processPosition, edgeLength)`
Creates a translation reaction.

`instance.resizeNodes(nodes, newParent, posDiffX, posDiffY)`
Resize given nodes if `useAspectRatio` is truthy one of width or height should not be set. Considers undoable option.

`instance.changeNodeLabel(nodes, label)`
Changes the label of the given nodes to the given label. Considers undoable option.

`instance.changeFontProperties(nodes, data)`
Change font properties for given nodes use the given font data. Considers undoable option.

`instance.changeStateOrInfoBox(nodes, index, value, type)`
Change state value or unit of information box of given nodes with given index. Considers undoable option.<br>
`type` indicates whether to change value or variable, it is valid if the box at the given index is a state variable.<br>
`value` parameter is the new value to set.<br>
It returns the old value of the changed data (we assume that the old value of the changed data was the same for all nodes).

`instance.addStateOrInfoBox(nodes, obj)`
Add a new state or info box to given `nodes`. The box is represented by the parameter `obj`. Considers undoable option.

`instance.removeStateOrInfoBox(nodes, index)`
Remove the state or info boxes of the given `nodes` at given `index`. Considers undoable option.

`instance.setMultimerStatus(nodes, status)`
Set multimer status of the given `nodes` to the given `status`. Considers undoable option.

`instance.setCloneMarkerStatus(nodes, status)`
Set clone marker status of given `nodes` to the given `status`. Considers undoable option.

`instance.changeCss(eles, name, value)`
Change style/css of given `eles` by setting given property `name` to the given `value/values (Note that `value` parameter may be a single string or an id to value map). Considers undoable option. (From cytoscape.js documentation: 'You should use this function very sparingly, because it overrides the style of an element, despite the state and classes that it has.')

`instance.changeData(eles, name, value)`
Change data of given `eles` by setting given property `name` to the given value/values (Note that `value` parameter may be a single string or an id to value map). Considers undoable option.

`instance.showAndPerformLayout(eles, layoutparam)`
Unhide given `eles` and perform given layout afterward. `layoutparam` parameter may be layout options or a function to call.
Requires `viewUtilities` extension and considers undoable option.

`instance.hideAndPerformLayout(eles, layoutparam)`
Extend the given list of `eles` in a smart way to leave the map intact, hide the extended list of elements and and perform the given layout afterward. `layoutparam` parameter may be layout options or a function to call.
Requires `viewUtilities` extension and considers undoable option.

`instance.deleteAndPerformLayout(eles, layoutparam)`
Delete the given list of `eles` and perform given layout afterward. `layoutparam` parameter may be layout options or a function to call.
Requires `viewUtilities` extension and considers undoable option.

`instance.showAllAndPerformLayout(eles, layoutparam)`
Unhide all elements and perform given layout afterward. `layoutparam` parameter may be layout options or a function to call.
Requires `viewUtilities` extension and considers undoable option.

`instance.closeUpElements(mainEle, hiddenEles)`
Moves the hidden elements close to the nodes whose neighbors will be shown. Considers undoable option.

`instance.highlightProcesses(_nodes)`
Overrides highlightProcesses from SBGNVIZ - does not highlight any nodes when the map type is AF.

`instance.updateInfoboxStyle(node, index, newProps)`
Extends the style of infobox that is at the given index of the given node by newProps. Considers undoable option.

`instance.updateSetField(ele, fieldName, toDelete, toAdd, callback)`
From the data of given ele updates the field recognized by the fieldName. The field is supposed to represent a set. Deletes 'toDelete' and adds 'toAdd' to the set if they exists.

`instance.resetMapType()`
Resets map type to undefined

`instance.getMapType()`
Gets map type.

`instance.setMapType(newMapType)`
Sets map type.

`instance.addBackgroundImage(nodes, bgObj, updateInfo, promptInvalidImage, validateURL)`
Adds the given background image to the given nodes. Considers undoable option.

`instance.removeBackgroundImage(nodes, bgObj)`
Removes the given background image from the given nodes. Considers undoable option.

`instance.updateBackgroundImage(nodes, bgObj)`
Updates the given background image on the given node. Considers undoable option.

`instance.changeBackgroundImage(nodes, oldImg, newImg, updateInfo, promptInvalidImage, validateURL)`
Replaces the given old background image with the new given one on the given nodes. Considers undoable option.

`instance.elementUtilities`
General and sbgn specific utilities for cytoscape elements. Extends `sbgnviz.elementUtilities`, you can find the ChiSE extensions for `sbgnviz.elementUtilities` below.

 * `addNode(x, y, sbgnclass, id, parent, visibility)` Similar to `instance.addNode()` but do not considers undoable option.
 * `addEdge(source, target, sbgnclass, id, visibility)` Similar to `instance.addEdge()` but do not considers undoable option.
 * `addProcessWithConvenientEdges(source, target, processType)` Similar to `instance.addProcessWithConvenientEdges()` but do not considers undoable option.
 * `createCompoundForGivenNodes(nodesToMakeCompound, compoundType)` Similar to `instance.createCompoundForGivenNodes()` but do not considers undoable option.
 * `changeParent(nodes, newParent, posDiffX, posDiffY)` Similar to `instance.changeParent()` but do not considers undoable option.
 * `resizeNodes(nodes, width, height, useAspectRatio)` Similar to `instance.resizeNodes()` but do not considers undoable option.
 * `relocateStateAndInfos(ele)` Relocates the state and info boxes of the given node.
 * `changeStateOrInfoBox(nodes, index, value, type)` Similar to `instance.changeStateOrInfoBox()` but do not considers undoable option.
 * `addStateOrInfoBox(nodes, obj)` Similar to `instance.addStateOrInfoBox()` but do not considers undoable option.
 * `removeStateOrInfoBox(nodes, index)` Similar to `instance.removeStateOrInfoBox()` but do not considers undoable option.
 * `setMultimerStatus(nodes, status)` Similar to `instance.setMultimerStatus()` but do not considers undoable option.
 * `setCloneMarkerStatus(nodes, status)` Similar to `instance.setCloneMarkerStatus()` but do not considers undoable option.
 * `changeFontProperties(nodes, data)` Similar to `instance.changeFontProperties()` but do not considers undoable option.
 * `validateArrowEnds(edge, source, target)`  This function gets an edge, and ends of that edge (Optionally it may take just the classes of these elements as well) as parameters.
    It may return 'valid' (that ends is valid for that edge), 'reverse' (that ends is not valid for that edge but they would be valid 
    if you reverse the source and target), 'invalid' (that ends are totally invalid for that edge).
 * `showAndPerformLayout(eles, layoutparam)` Similar to `instance.showAndPerformLayout()` but do not considers undoable option.
 * `updateInfoboxStyle(node, index, newProps)` Similar to `instance.updateInfoboxStyle()` but do not considers undoable option.
 * `updateSetField(ele, fieldName, toDelete, toAdd, callback)` Similar to `instance.updateSetField()` but do not considers undoable option.

`instance.undoRedoActionFunctions`
Functions to be utilized in defining new actions for `cytoscape.js-undo-redo` extension. These are exposed for the users who builds
an extension library of chise. Extends `sbgnvizInstance.undoRedoActionFunctions`, you can find the ChiSE extensions for `sbgnvizInstance.undoRedoActionFunctions` below.

 * `addNode(param)` Do/Redo function for 'addNode' undo redo command.
 * `addEdge(param)` Do/Redo function for 'addEdge' undo redo command.
 * `addProcessWithConvenientEdges(param)` Do/Redo function for 'addProcessWithConvenientEdges' undo redo command.
 * `createCompoundForGivenNodes(param)` Do/Undo/Redo function for 'createCompoundForGivenNodes' undo redo command.
 * `createTemplateReaction(param)` Do/Redo function for 'createTemplateReaction' undo redo command.
 * `createActivationReaction(param)` Do/Redo function for 'createActivationReaction' undo redo command.
 * `createMetabolicCatalyticActivity(param)` Do/Redo function for 'createMetabolicCatalyticActivity' undo redo command.
 * `createTranscriptionReaction(param)` Do/Redo function for 'createTranscriptionReaction' undo redo command.
 * `createTranslationReaction(param)` Do/Redo function for 'createTranslationReaction' undo redo command.
 * `resizeNodes(param)` Do/Undo/Redo function for 'resizeNodes' undo redo command.
 * `changeNodeLabel(param)` Do/Undo/Redo function for 'changeNodeLabel' undo redo command.
 * `changeData(param)` Do/Undo/Redo function for 'changeData' undo redo command.
 * `changeCss(param)` Do/Undo/Redo function for 'changeCss' undo redo command.
 * `changeFontProperties(param)` Do/Undo/Redo function for 'changeFontProperties' undo redo command.
 * `showAndPerformLayout(param)` Do/Redo function for 'showAndPerformLayout' undo redo command.
 * `hideAndPerformLayout(param)` Undo/ function for 'hideAndPerformLayout' undo redo command.
 * `updateInfoboxStyle(param)` Do/Redo function for 'updateInfoboxStyle' undo redo command.
 * `updateSetField(param)` Do/Redo function for 'updateSetField' undo redo command.
 * `changeStateOrInfoBox(param)` Do/Undo/Redo function for 'changeStateOrInfoBox' undo redo command.
 * `addStateOrInfoBox(param)` Do/Redo function for 'addStateOrInfoBox' undo redo command (Also Undo function for 'removeStateOrInfoBox' undo redo command).
 * `removeStateOrInfoBox(param)` Do/Redo function for 'removeStateOrInfoBox' undo redo command (Also Undo function for 'addStateOrInfoBox' undo redo command).
 * `setMultimerStatus(param)` Do/Undo/Redo function for 'setMultimerStatus' undo redo command.
 * `setCloneMarkerStatus(param)` Do/Undo/Redo function for 'setCloneMarkerStatus' undo redo command.
 * `addBackgroundImage(param)` Do/Undo/Redo function for 'addBackgroundImage' undo redo command.
 * `removeBackgroundImage(param)` Do/Undo/Redo function for 'removeBackgroundImage' undo redo command.
 * `updateBackgroundImage(param)` Do/Undo/Redo function for 'updateBackgroundImage' undo redo command.
 * `changeBackgroundImage(param)` Do/Undo/Redo function for 'changeBackgroundImage' undo redo command.
 * `updateInfoboxObj(param)` Do/Undo/Redo function for 'updateInfoboxObj' undo redo command.
 * `fitUnits(param)` Do/Undo/Redo function for 'fitUnits' undo redo command.
 * `changeMapType(param)` Do/Undo/Redo function for 'setMapType' and 'getMapType' functionalities.
 

 * `cloneHighDegreeNode(node)` It creates a number of clones of the given node corrosponding to all node edges. Useful when there are many edges connected to the node (high degree node) 

## Events
`$(document).on('sbgnvizLoadSample', function(event, filename, cy) { ... });` Triggered when a sample is being loaded

`$(document).on('sbgnvizLoadFile', function(event, filename, cy) { ... });` Triggered when an external sbgnml file is being loaded

`$(document).on('updateGraphStart', function(event, cy) { ... });` Triggered when the graph update is just started

`$(document).on('updateGraphEnd', function(event, cy) { ... });` Triggered when the graph update is ended

## Dependencies

 * cytoscape
 * jQuery
 * file-saver
 * tippy.js
 * sbgnviz
 * lodash.isequal

for exact versions of dependencies refer to [package.json](https://github.com/iVis-at-Bilkent/chise.js/blob/master/package.json)

## Optional Dependencies
The following extensions are used by this library if they are registered.
 * cytoscape-undo-redo
 * cytoscape-expand-collapse
 * cytoscape-edge-editing
 * cytoscape-view-utilities

for exact versions of dependencies refer to [package.json](https://github.com/iVis-at-Bilkent/chise.js/blob/master/package.json)

## Usage instructions
Download the library (we recommend the use of LTS version 10.x.x of node.js):
 * via npm: `npm install chise` or
 * via direct download in the repository (probably from a tag).

`require()` the library as appropriate for your project:

CommonJS:
```js
var sbgnviz = require('sbgnviz');
var cytoscape = require('cytoscape-for-sbgnviz');
var jQuery = require('jQuery');
var filesaver = require('file-saver');
var sbgnviz = require('sbgnviz');
var tippy = require('tippy.js');

var options = {
};

var libs = {
    cytoscape: cytoscape,
    jQuery: jQuery,
    filesaver: filesaver,
    sbgnviz: sbgnviz,
    tippy = tippy
};

// Register chise with libs
chise.register(libs);

// Create a new chise.js instance
var chiseInstance = chise(options);
```

In plain JS you do not need to require the libraries you just need to register chise with the options.

## Publishing instructions

This project is set up to automatically be published to npm and bower.  To publish:

1. Build : `npm run build`
1. Commit the build : `git commit -am "Build for release"`
1. Bump the version number and tag: `npm version major|minor|patch`
1. Push to origin: `git push && git push --tags`
1. Publish to npm: `npm publish .`
1. If publishing to bower for the first time, you'll need to run `bower register chise.js https://github.com/iVis-at-Bilkent/chise.js.git`

## Team

Chise.js has been developed by [i-Vis at Bilkent University](http://www.cs.bilkent.edu.tr/~ivis).
