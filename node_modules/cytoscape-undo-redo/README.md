cytoscape-undo-redo
================================================================================

## Description
 A Cytsocape.js extension to control actions on Cytoscape.js graph, also providing built-in functionalities for common Cytoscape.js operations like dragging nodes, adding/removing nodes, etc. distributed under [The MIT License](https://opensource.org/licenses/MIT).

Please cite the following paper when using this extension:

U. Dogrusoz , A. Karacelik, I. Safarli, H. Balci, L. Dervishi, and M.C. Siper, "[Efficient methods and readily customizable libraries for managing complexity of large networks](https://doi.org/10.1371/journal.pone.0197238)", PLoS ONE, 13(5): e0197238, 2018.

Here is a demo:
<p align="center">
<a href="https://raw.githack.com/iVis-at-Bilkent/cytoscape.js-undo-redo/master/demo.html"><img src="https://www.cs.bilkent.edu.tr/~ivis/images/demo1.png" height=42px></a>
</p>
 
## API

```javascript
    var cy = cytoscape({...});

    var ur = cy.undoRedo(options);

```


`cy.undoRedo(options, dontInit)`
Sets options. Also, dontInit can be left blank and is to be used in extensions to set default actions of an extension.

`ur.action( actionName, actionFunction, undoFunction)`
Register action with its undo function & action name. actionFunction's return value will be used to call undoFunction by argument and vice versa. This function is chainable: `ur.action(...).action(...)`


`ur.do(actionName, args)`
Calls registered function with action name actionName via actionFunction(args)
* `args.firstTime` is reserved. The reason behind is on first call of actionFunction 
takes a parameter with property `args.firstTime = true` (if args is object or array). After first call, it's set to false.

`ur.undo()`
Undo last action. Returns arguments that are passed to redo.

`ur.redo()`
Redo last action. Returns arguments that are passed to undo.

`ur.undoAll()`
Undo all actions in undo stack.

`ur.redoAll()`
Redo all actions in redo stack.

`cy.on("undo", function(actionName, args){} )`
Calls registered function with action name actionName via actionFunction(args)

`cy.on("redo", function(actionName, args){} )`
Calls registered function with action name actionName via actionFunction(args)
*Note that args are returned from opposite action like (undo => redo || redo => undo)

`ur.isUndoStackEmpty()`
Get whether undo stack is empty (namely is undoable)

`ur.isRedoStackEmpty()`
Get whether undo stack is empty (namely is redoable)

`ur.getUndoStack()`
Gets actions (with their args) in undo stack

`ur.getRedoStack()`
Gets actions (with their args) in redo stack

`ur.reset(undos, redos)`
If arguments are provided, overrides undo and redo stacks. Otherwise, undo and redo stacks are cleared.


## Default Options
```javascript
      var options = {
            isDebug: false, // Debug mode for console messages
            actions: {},// actions to be added
            undoableDrag: true, // Whether dragging nodes are undoable can be a function as well
            stackSizeLimit: undefined, // Size limit of undo stack, note that the size of redo stack cannot exceed size of undo stack
            ready: function () { // callback when undo-redo is ready

            }
        }
        
       var ur = cy.undoRedo(options); // Can also be set whenever wanted.
```


## Events

Parameters:<br>
actionName: Name of the action.<br>
args: Arguments passed to the action.<br>
res: The value returned when the function is executed. This value is to be passed to redo function in afterUndo case and it will be passed to undo function in afterDo/afterRedo cases.<br>

 `.on("beforeUndo", function(event, actionName, args){ })` 
 
 `.on("afterUndo", function(event, actionName, args, res){ })` 
 
 `.on("beforeRedo", function(event, actionName, args){ })` 
 
 `.on("afterRedo", function(event, actionName, args, res){ })` 
 
 `.on("beforeDo", function(event, actionName, args){ })` 
 
 `.on("afterDo", function(event, actionName, args, res){ })` 
 


## Default Actions (Undoable/Redoable)
 * Default actions can be run by the same way like `ur.do("remove", "#spec")`
 * Undoable dragging can be disabled through options `undoableDrag: false`
 
 `.do("add", eleObj)` http://js.cytoscape.org/#cy.add
 
 `.do("remove", eles/selector)` http://js.cytoscape.org/#cy.remove
 
 `.do("layout", args)` http://js.cytoscape.org/#core/layout
 
 ```javascript
    var args = {
        options: {}, // layout options
        eles: null // if not null eles.layout will be called.
        }
 ```

 `.do("changeParent", args)` http://js.cytoscape.org/#eles.move (Just for the nodes and regards the new positions of the nodes as well)

 ```javascript
    var args = {
        parentData: parentData, // It keeps the newParentId (Just an id for each nodes for the first time)
        nodes: nodes, // Nodes to move the new parent
        posDiffX: diffX, // How the positions of the nodes will change in 'X' axis after they are moved the new parent
        posDiffY: diffY, // How the positions of the nodes will change in 'Y' axis after they are moved the new parent
        callback: function(eles) {} // optional - a function to be called after the change has occured, on the newly created elements
        }
 ```
 
 * Following actions take argument(s) instead of extending
 
 `.do("restore", eles/selector)` http://js.cytoscape.org/#eles.restore
 
 `.do("clone", eles/selector)` http://js.cytoscape.org/#eles.restore
 
 `.do("select", eles/selector)` http://js.cytoscape.org/#eles.select
 
 `.do("unselect", eles/selector)` http://js.cytoscape.org/#eles.unselect
 
 `.do("move", args)` http://js.cytoscape.org/#eles.move 
 
 ```javascript
    var args = {
        eles: ..., // eles/selector
        location: ... // as is in docs
        }
 ```
 
 * The `batch` action can execute several actions at the same time. Those actions can then be undone as a whole.
 
 `.do("batch", actionList)`
 
 ```javascript
    var actionList = [{
	name: ..., // name of the action
	param: ... // object containing the parameters as you would pass them to said action
	},
	{...}, // a second action to be executed
	...
    ]
 ```

## Example
 ```javascript
    function deleteEles(eles){
        return eles.remove();
    }
    function restoreEles(eles){
        return eles.restore();
    }
    ur.action("deleteEles", deleteEles, restoreEles); // register
    
    var selecteds = cy.$(":selected");
    ur.do("deleteEles", selecteds); // 
    
    ur.undo();
    ur.redo();
 ```
  * Note that default `remove` default action above has the same functionality and also supports string selectors like `#spec`.
 

## Dependencies

 * Cytoscape.js ^3.3.0
 
 

## Usage instructions

Download the library:
 * via npm: `npm install cytoscape-undo-redo`,
 * via bower: `bower install cytoscape-undo-redo`, or
 * via direct download in the repository (probably from a tag).

`require()` the library as appropriate for your project:

CommonJS:
```js
var cytoscape = require('cytoscape');
var undoRedo = require('cytoscape-undo-redo');

undoRedo( cytoscape ); // register extension
```

AMD:
```js
require(['cytoscape', 'cytoscape-undo-redo'], function( cytoscape, undoRedo ){
  undoRedo( cytoscape ); // register extension
});
```

Plain HTML/JS has the extension registered for you automatically, because no `require()` is needed.



## Publishing instructions

This project is set up to automatically be published to npm and bower.  To publish:

1. Set the version number environment variable: `export VERSION=1.2.3`
1. Publish: `gulp publish`
1. If publishing to bower for the first time, you'll need to run `bower register cytoscape-undo-redo https://github.com/iVis-at-Bilkent/cytoscape.js-undo-redo.git`

## Team

  * [Hasan Balci](https://github.com/hasanbalci), [Ugur Dogrusoz](https://github.com/ugurdogrusoz) of [i-Vis at Bilkent University](http://www.cs.bilkent.edu.tr/~ivis)

### Alumni

  * [Selim Firat Yilmaz](https://github.com/mrsfy), [Metin Can Siper](https://github.com/metincansiper)
