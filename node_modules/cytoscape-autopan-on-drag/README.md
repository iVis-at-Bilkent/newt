cytoscape-autopan-on-drag
================================================================================

## Description

A Cytsocape.js extension to automatically pan when nodes are out of canvas bounds distributed under [The MIT License](https://opensource.org/licenses/MIT).

Please cite the following paper when using this extension:

U. Dogrusoz , A. Karacelik, I. Safarli, H. Balci, L. Dervishi, and M.C. Siper, "[Efficient methods and readily customizable libraries for managing complexity of large networks](https://doi.org/10.1371/journal.pone.0197238)", PLoS ONE, 13(5): e0197238, 2018.

Here is a demo:
<p align="center">
<a href="https://raw.githack.com/iVis-at-Bilkent/cytoscape.js-autopan-on-drag/unstable/demo.html"><img src="https://www.cs.bilkent.edu.tr/~ivis/images/demo1.png" height=42px></a>
</p>

## Dependencies

 * Cytoscape.js ^2.7.0 || ^3.0.0"

## Usage instructions

Download the library:
 * via npm: `npm install cytoscape-autopan-on-drag`,
 * via bower: `bower install cytoscape-autopan-on-drag`, or
 * via direct download in the repository (probably from a tag).

`require()` the library as appropriate for your project:

CommonJS:
```js
var cytoscape = require('cytoscape');
var autopanOnDrag = require('cytoscape-autopan-on-drag');

autopanOnDrag( cytoscape ); // register extension
```

AMD:
```js
require(['cytoscape', 'cytoscape-autopan-on-drag'], function( cytoscape, autopanOnDrag ){
  autopanOnDrag( cytoscape ); // register extension
});
```

Plain HTML/JS has the extension registered for you automatically, because no `require()` is needed.

## Default Options

```js
var options = {
    enabled: true, // Whether the extension is enabled on register
    selector: 'node', // Which elements will be affected by this extension
    speed: 1 // Speed of panning when elements exceed canvas bounds
};
```

## API

```js
var instance = cy.autopanOnDrag( options );
```

An instance has a number of functions available:

```js
instance.enable(); // enable the instance

instance.disable(); // disable the instance
```

You can also get an existing instance:

```js
cy.autopanOnDrag('get');
```


## Publishing instructions

This project is set up to automatically be published to npm and bower.  To publish:

1. Set the version number environment variable: `export VERSION=1.2.3`
1. Publish: `gulp publish`
1. If publishing to bower for the first time, you'll need to run `bower register cytoscape-autopan-on-drag https://github.com/iVis-at-Bilkent/cytoscape.js-autopan-on-drag.git`

## Team

  * [Metin Can Siper](https://github.com/metincansiper), [Ugur Dogrusoz](https://github.com/ugurdogrusoz) of [i-Vis at Bilkent University](http://www.cs.bilkent.edu.tr/~ivis)
