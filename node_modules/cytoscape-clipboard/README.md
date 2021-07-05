cytoscape-clipboard
================================================================================


## Description

A Cytoscape.js extension to provide copy-paste utilities, distributed under [The MIT License](https://opensource.org/licenses/MIT).

Here is a demo:
<p align="center">
<a href="https://raw.githack.com/iVis-at-Bilkent/cytoscape.js-clipboard/unstable/demo.html"><img src="https://www.cs.bilkent.edu.tr/~ivis/images/demo1.png" height=42px></a>
</p>

## API

```javascript
    var cy = cytoscape({...});

    var cb = cy.clipboard(options);

```


`cy.clipboard(options)`
Initializes extension & sets options.

`cb.copy(eles [, id])`
Copies eles and returns id of operation. If `id` is not specified, it will be assigned automatically.

`cb.paste([id])`
Pastes the copied elements which has `id`. If `id` is not specified, it will have the last operation's id.


## Default Options
```javascript
            var options = {

                // The following 4 options allow the user to provide custom behavior to
                // the extension. They can be used to maintain consistency of some data
                // when elements are duplicated.
                // These 4 options are set to null by default. The function prototypes
                // are provided below for explanation purpose only.

                // Function executed on the collection of elements being copied, before
                // they are serialized in the clipboard
                beforeCopy: function(eles) {},
                // Function executed on the clipboard just after the elements are copied.
                // clipboard is of the form: {nodes: json, edges: json}
                afterCopy: function(clipboard) {},
                // Function executed on the clipboard right before elements are pasted,
                // when they are still in the clipboard.
                beforePaste: function(clipboard) {},
                // Function executed on the collection of pasted elements, after they
                // are pasted.
                afterPaste: function(eles) {}
            };
```


## Default Undo Redo Actions
`ur.do("paste"[, { id: idOfOperation }])` 
Pastes operation. id is optional as is in `cb.paste()`


## Dependencies

 * Cytoscape.js ^2.6.12 || ^3.0.0
 * jQuery ^1.3.2 || ^2.0.0 || ^3.0.0
 * cytoscape-undo-redo ^1.0.8 (optional)


## Usage instructions

Download the library:
 * via npm: `npm install cytoscape-clipboard`,
 * via bower: `bower install cytoscape-clipboard`, or
 * via direct download in the repository (probably from a tag).

`require()` the library as appropriate for your project:

CommonJS:
```js
var cytoscape = require('cytoscape');
var jquery = require('jquery');
var clipboard = require('cytoscape-clipboard');

clipboard( cytoscape, jquery ); // register extension
```

AMD:
```js
require(['cytoscape', 'cytoscape-clipboard'], function( cytoscape, clipboard ){
  clipboard( cytoscape ); // register extension
});
```

Plain HTML/JS has the extension registered for you automatically, because no `require()` is needed.


## Publishing instructions

This project is set up to automatically be published to npm and bower.  To publish:

1. Set the version number environment variable: `export VERSION=1.2.3`
1. Publish: `gulp publish`
1. If publishing to bower for the first time, you'll need to run `bower register cytoscape-clipboard https://github.com/iVis-at-Bilkent/clipboard.git`

## Team

  * [Selim Firat Yilmaz](https://github.com/mrsfy), [Metin Can Siper](https://github.com/metincansiper), [Ugur Dogrusoz](https://github.com/ugurdogrusoz) of [i-Vis at Bilkent University](http://www.cs.bilkent.edu.tr/~ivis)
