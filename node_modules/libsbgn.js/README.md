# libsbgn.js

[![npm](https://img.shields.io/npm/v/libsbgn.js.svg)](https://www.npmjs.com/package/libsbgn.js)
[![Build Status](https://travis-ci.org/sbgn/libsbgn.js.svg?branch=master)](https://travis-ci.org/sbgn/libsbgn.js)

Documentation under construction.

API doc is located [here](https://sbgn.github.io/libsbgn.js/).
More detailed documentation can be found in the wiki.

## 1. Installation

```
npm install libsbgn.js
```

Run test:
```
npm test
```

Generate API doc:
```
npm run doc
```

## 2. Quick example

```javascript
var libsbgn = require('libsbgn.js');

var sbgn = new libsbgn.Sbgn({xmlns: 'http://sbgn.org/libsbgn/0.3'});

var map = new libsbgn.Map({id: 'mymap', language: 'process description'});
sbgn.addMap(map);

var glyph1 = new libsbgn.Glyph({id: 'glyph1', class_: 'macromolecule'});
glyph1.setLabel(new libsbgn.Label({text: 'entity A'}));
glyph1.setBbox(new libsbgn.Bbox({x: 0, y: 0, w:10, h:10}));
map.addGlyph(glyph1);

var glyph2 = new libsbgn.Glyph({id: 'glyph2', class_: 'macromolecule'});
glyph2.setLabel(new libsbgn.Label({text: 'entity B'}));
glyph2.setBbox(new libsbgn.Bbox({x: 20, y: 0, w:10, h:10}));
map.addGlyph(glyph2);

var processGlyph = new libsbgn.Glyph({id: 'process1', class_: 'process'});
processGlyph.setBbox(new libsbgn.Bbox({x: 10, y: 0, w:10, h:10}));
map.addGlyph(processGlyph);

var arc1 = new libsbgn.Arc({id:'arc1', class_:'consumption',
	source:'glyph1', target:'process1'});
arc1.setStart(new libsbgn.Start({x:0, y:0}));
arc1.setEnd(new libsbgn.End({x:10, y:0}));
map.addArc(arc1);

var arc2 = new libsbgn.Arc({id:'arc2', class_:'production',
	source:'process1', target:'glyph2'});
arc2.setStart(new libsbgn.Start({x:10, y:0}));
arc2.setEnd(new libsbgn.End({x:20, y:0}));
map.addArc(arc2);

var xmlString = sbgn.toXML();
```

xmlString contains the serialized raw XML, without any newline or indentation. A pretty version of xmlString would be:

```xml
<sbgn xmlns="http://sbgn.org/libsbgn/0.3">
	<map id="mymap" language="process description">
		<glyph id="glyph1" class="macromolecule">
			<label text="entity A"/>
			<bbox x="0" y="0" w="10" h="10"/>
		</glyph>
		<glyph id="glyph2" class="macromolecule">
			<label text="entity B"/>
			<bbox x="20" y="0" w="10" h="10"/>
		</glyph>
		<glyph id="process1" class="process">
			<bbox x="10" y="0" w="10" h="10"/>
		</glyph>

		<arc id="arc1" class="consumption" source="glyph1" target="process1">
			<start x="0" y="0"/>
			<end x="10" y="0"/>
		</arc>
		<arc id="arc2" class="production" source="process1" target="glyph2">
			<start x="10" y="0"/>
			<end x="20" y="0"/>
		</arc>
	</map>
</sbgn>
```
## 3.Schematron Validation Example 
Please place templatelibsbgn.xslt file your project structure
```javascript
var libsbgn = require('libsbgn.js');

var fs = require('file-system');

var file=fs.readFileSync('path-of-validated-file', 'utf8');

var errors = libsbgn.Sbgn.doValidation(file);

