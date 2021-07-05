var chai = require('chai');
var should = chai.should();
chai.use(require('chai-string'));
var sbgnjs = require('../src/libsbgn');
var renderExt = require('../src/libsbgn-render');
var checkParams = require('../src/utilities').checkParams;
var pkg = require('..');
var annot = sbgnjs.annot;
var N3 = require('n3');
var xml2js = require('xml2js');
var util = require('util');


describe('package', function() {
	it('should expose code correctly', function() {
		pkg.should.have.ownProperty('Sbgn');
		pkg.should.have.ownProperty('render');
		pkg.render.should.have.ownProperty('ColorDefinition');
	});
});

describe('utilities', function() {
	describe('checkParams', function() {
		it('should return empty object if undefined or null', function() {
			checkParams(undefined, []).should.deep.equal({});
			checkParams(null, []).should.deep.equal({});
		});
		it('should populate object with given args if undefined or null', function() {
			checkParams(undefined, ['a', 'b']).should.deep.equal({'a': null, 'b': null});
			checkParams(null, ['a', 'b']).should.deep.equal({'a': null, 'b': null});
		});
		it('should throw error if param is not an object and not undefined or null', function() {
			var test1 = function(){checkParams('', [])};
			var test2 = function(){checkParams(0, [])};
			var test3 = function(){checkParams({}, [])};
			test1.should.throw(Error);
			test2.should.throw(Error);
			test3.should.not.throw(Error);
		});
		it('should give back params as they are passed', function() {
			checkParams({
				'a': 1,
				'b': 'test',
				'c': null,
				'd': NaN},
				['a', 'b', 'c', 'd']).should.deep.equal({
					'a': 1,
					'b': 'test',
					'c': null,
					'd': NaN,
				});
		});
	});
});

describe('libsbgn', function() {
	describe('sbgn', function() {
		describe('parse from XML', function() {
			it('should parse empty', function() {
				var sbgn = sbgnjs.Sbgn.fromXML("<sbgn></sbgn>");
				sbgn.should.have.ownProperty('xmlns');
				should.equal(sbgn.xmlns, null);
				sbgn.should.have.ownProperty('maps');
				sbgn.maps.should.have.length(0);
			});
			it('should parse xmlns', function() {
				var sbgn = sbgnjs.Sbgn.fromXML("<sbgn xmlns='a'></sbgn>");
				should.exist(sbgn.xmlns);
				sbgn.xmlns.should.equal('a');
			});
			it('should parse map', function() {
				var sbgn = sbgnjs.Sbgn.fromXML("<sbgn><map></map></sbgn>");
				should.exist(sbgn.maps);
				sbgn.maps.should.be.a('array');
				sbgn.maps.should.have.length(1);
				sbgn.maps[0].should.be.instanceOf(sbgnjs.Map);
			});
			it('should parse 2 maps', function() {
				var sbgn = sbgnjs.Sbgn.fromXML("<sbgn><map id='m1'></map><map id='m2'></map></sbgn>");
				should.exist(sbgn.maps);
				sbgn.maps.should.be.a('array');
				sbgn.maps.should.have.length(2);
				sbgn.maps[0].should.be.instanceOf(sbgnjs.Map);
				sbgn.maps[0].id.should.equal("m1");
				sbgn.maps[1].should.be.instanceOf(sbgnjs.Map);
				sbgn.maps[1].id.should.equal("m2");
			});
		});
		describe('write to XML', function() {
			it('should write empty sbgn', function() {
				var sbgn = new sbgnjs.Sbgn();
				sbgn.toXML().should.equal("<sbgn/>");
			});
			it('should write complete sbgn with empty map', function() {
				var sbgn = new sbgnjs.Sbgn({'xmlns': "a"});
				sbgn.addMap(new sbgnjs.Map());
				sbgn.toXML().should.equal('<sbgn xmlns="a"><map/></sbgn>');
			});
			it('edge case should consider xmlns of 0', function() {
				var sbgn = new sbgnjs.Sbgn({'xmlns': 0});
				sbgn.addMap(new sbgnjs.Map());
				sbgn.toXML().should.equal('<sbgn xmlns="0"><map/></sbgn>');
			});
		});
		describe('check features inherited from SBGNBase', function () {
			describe('extension', function() {
				it('should parse extension', function(){
					var sbgn = sbgnjs.Sbgn.fromXML("<sbgn><map></map><extension><renderInformation></renderInformation></extension></sbgn>");
					should.exist(sbgn.extension);
					sbgn.extension.should.be.a('object');
					sbgn.extension.should.be.instanceOf(sbgnjs.Extension);
					sbgn.extension.has('renderInformation').should.equal(true);
				});
				it('should write extension', function(){
					var sbgn = new sbgnjs.Sbgn();
					sbgn.setExtension(new sbgnjs.Extension());
					sbgn.extension.add(new renderExt.RenderInformation());
					sbgn.addMap(new sbgnjs.Map());
					sbgn.toXML().should.equal("<sbgn><extension>"+
								'<renderInformation xmlns="http://www.sbml.org/sbml/level3/version1/render/version1"/>'+
								"</extension><map/></sbgn>");
				});
			})
			describe('notes', function() {
				it('should parse notes', function(){
					var sbgn = sbgnjs.Sbgn.fromXML("<sbgn><map></map><notes><p>test</p></notes></sbgn>");
					should.exist(sbgn.notes);
					sbgn.notes.should.be.a('object');
					sbgn.notes.should.be.instanceOf(sbgnjs.Notes);
					sbgn.notes.content.should.equal("<p>test</p>");
				});
				it('should write notes', function(){
					var sbgn = new sbgnjs.Sbgn();
					sbgn.setNotes(new sbgnjs.Notes());
					sbgn.notes.setContent("<p>test</p>");
					sbgn.addMap(new sbgnjs.Map());
					sbgn.toXML().should.equal("<sbgn><notes>"+
								'<p>test</p>'+
								"</notes><map/></sbgn>");
				});
			})
		})
	});

	describe('map', function() {
		describe('parse from XML', function() {
			it('should parse empty', function() {
				var map = sbgnjs.Map.fromXML("<map></map>");
				map.should.have.ownProperty('id');
				should.equal(map.id, null);
				map.should.have.ownProperty('language');
				should.equal(map.language, null);
				map.should.have.ownProperty('version');
				should.equal(map.version, null);
				map.should.have.ownProperty('extension');
				should.equal(map.extension, null);
				map.should.have.ownProperty('glyphs');
				map.glyphs.should.have.length(0);
				map.should.have.ownProperty('arcs');
				map.arcs.should.have.length(0);
				map.should.have.ownProperty('bbox');
				should.equal(map.bbox, null);
				map.should.have.ownProperty('arcgroups');
				map.arcs.should.have.length(0);
			});
			it('should parse id', function() {
				var map = sbgnjs.Map.fromXML("<map id='a'></map>");
				should.exist(map.id);
				map.id.should.equal('a');
			});
			it('should parse language', function() {
				var map = sbgnjs.Map.fromXML("<map language='a'></map>");
				should.exist(map.language);
				map.language.should.equal('a');
			});
			it('should parse version', function() {
				var map = sbgnjs.Map.fromXML("<map version='http://identifiers.org/combine.specifications/sbgn.pd.level-1.version-1.3'></map>");
				should.exist(map.version);
				map.version.should.equal('http://identifiers.org/combine.specifications/sbgn.pd.level-1.version-1.3');
			});
			it('should parse extension', function() {
				var map = sbgnjs.Map.fromXML("<map><extension></extension></map>");
				should.exist(map.extension);
				map.extension.should.be.a('object');
				map.extension.should.be.instanceOf(sbgnjs.Extension);
			});
			it('should parse bbox', function() {
				var map = sbgnjs.Map.fromXML("<map><bbox></bbox></map>");
				should.exist(map.bbox);
				map.bbox.should.be.a('object');
				map.bbox.should.be.instanceOf(sbgnjs.Bbox);
			});
			it('parse 2 empty glyphs', function() {
				var map = sbgnjs.Map.fromXML("<map><glyph></glyph><glyph></glyph></map>");
				map.glyphs.should.have.length(2);
				should.exist(map.glyphs[0]);
				map.glyphs[0].should.be.instanceOf(sbgnjs.Glyph);
				should.exist(map.glyphs[1]);
				map.glyphs[1].should.be.instanceOf(sbgnjs.Glyph);
			});
			it('parse 2 empty arcs', function() {
				var map = sbgnjs.Map.fromXML("<map><arc></arc><arc></arc></map>");
				map.arcs.should.have.length(2);
				should.exist(map.arcs[0]);
				map.arcs[0].should.be.instanceOf(sbgnjs.Arc);
				should.exist(map.arcs[1]);
				map.arcs[1].should.be.instanceOf(sbgnjs.Arc);
			});
			it('should parse arcgroup', function() {
				var map = sbgnjs.Map.fromXML("<map><arcgroup></arcgroup></map>");
				should.exist(map.arcgroups);
				map.arcgroups.should.be.a('array');
				map.arcgroups.should.have.length(1);
				map.arcgroups[0].should.be.instanceOf(sbgnjs.Arcgroup);
			});
		});
		describe('write to XML', function() {
			it('should write empty map', function() {
				var map = new sbgnjs.Map();
				map.toXML().should.equal("<map/>");
			});
			it('should write complete map with empty stuff', function() {
				var map = new sbgnjs.Map({id: "id", language: "language", version: "version"});
				map.setExtension(new sbgnjs.Extension());
				map.addGlyph(new sbgnjs.Glyph());
				map.addArc(new sbgnjs.Arc());
				map.setBbox(new sbgnjs.Bbox());
				map.addArcgroup(new sbgnjs.Arcgroup());
				map.toXML().should.equal('<map id="id" language="language" version="version"><extension/><bbox/><glyph/><arc/><arcgroup/></map>');
			});
		});
		describe('utilities', function() {
			it('getGlyphsByClass', function() {
				var map = new sbgnjs.Map({id: "id", language: "language"});
				map.addGlyph(new sbgnjs.Glyph({id: "1", class_ : "compartment"}));
				map.addGlyph(new sbgnjs.Glyph({id: "2", class_ : "compartment"}));
				map.addGlyph(new sbgnjs.Glyph({id: "3", class_ : "macromolecule"}));
				map.getGlyphsByClass('fgh').should.deep.equal([]);
				var compartments = map.getGlyphsByClass("compartment");
				compartments.length.should.equal(2);
				compartments[0].id.should.equal("1");
				var macromolecules = map.getGlyphsByClass("macromolecule");
				macromolecules.length.should.equal(1);
				macromolecules[0].id.should.equal("3");
			});
		});

		describe('prefix management', function() {
			it('should allow prefixes', function() {
				var map = sbgnjs.Map.fromXML('<sbgn:map xmlns:sbgn="http://sbgn.org/libsbgn/0.2"></sbgn:map>');
				map.should.have.ownProperty('id');
				should.equal(map.id, null);
				map.should.have.ownProperty('language');
				should.equal(map.language, null);
				map.should.have.ownProperty('extension');
				should.equal(map.extension, null);
				map.should.have.ownProperty('glyphs');
				map.glyphs.should.have.length(0);
				map.should.have.ownProperty('arcs');
				map.arcs.should.have.length(0);
			});
		});
	});
	describe('extension', function() {
		describe('parse from XML', function() {
			it('should parse empty', function () {
				var extension = sbgnjs.Extension.fromXML('<extension></extension>');
				extension.should.have.ownProperty('list');
				extension.list.should.be.a('object');
			});
			it('should parse 1 unknown extensions', function() {
				var extension = sbgnjs.Extension.fromXML('<extension><b><test v="2"></test></b></extension>');
				extension.list.should.have.ownProperty('b');
			});
			it('should parse 2 extensions', function() {
				var extension = sbgnjs.Extension.fromXML('<extension><renderInformation></renderInformation><b></b></extension>');
				extension.list.should.have.ownProperty('renderInformation');
				extension.list.should.have.ownProperty('b');
			});
		});
		describe('test extension functions', function() {
			it('add new unknown extension', function() {
				var extension = sbgnjs.Extension.fromXML('<extension></extension>');
				var extA = '<a></a>';
				extension.add(extA);
				extension.list.should.have.ownProperty('a');
				extension.list.a.should.equal(extA);
			});
			it('add new renderInformation extension', function() {
				var extension = sbgnjs.Extension.fromXML('<extension></extension>');
				var render = renderExt.RenderInformation.fromXML('<renderInformation></renderInformation>');
				extension.add(render);
				extension.list.should.have.ownProperty('renderInformation');
				extension.list.renderInformation.should.be.instanceOf(renderExt.RenderInformation);
				extension.list.renderInformation.should.equal(render);
			});
			it('add new renderInformation unparsed extension', function() {
				var extension = sbgnjs.Extension.fromXML('<extension></extension>');
				var renderXmlObj = '<renderInformation></renderInformation>';
				extension.add(renderXmlObj);
				extension.list.should.have.ownProperty('renderInformation');
				extension.list.renderInformation.should.be.instanceOf(renderExt.RenderInformation);
			});
			it('get extension', function() {
				var extension = sbgnjs.Extension.fromXML('<extension><a></a><renderInformation></renderInformation></extension>');
				should.exist(extension.get('a'));
				should.exist(extension.get('renderInformation'));
			});
			it('has extension', function() {
				var extension = sbgnjs.Extension.fromXML('<extension><a></a><renderInformation></renderInformation></extension>');
				extension.has('a').should.equal(true);
				extension.has('renderInformation').should.equal(true);
			});
		});
		describe('write to XML', function () {
			it('should write empty extension', function () {
				var extension = new sbgnjs.Extension();
				extension.toXML().should.equal("<extension/>");
			});
			it('should write 1 unknown extension', function () {
				var extension = new sbgnjs.Extension();
				extension.add('<x></x>');
				extension.toXML().should.equal("<extension><x/></extension>");
			});
			it('should write multiple extensions', function () {
				var extension = new sbgnjs.Extension();
				extension.add('<x></x>');
				extension.add('<c></c>');
				extension.toXML().should.equal("<extension><x/><c/></extension>");
			});
			it('should write supported and unsupported extensions', function () {
				var extension = new sbgnjs.Extension();
				extension.add('<x></x>');
				extension.add('<c></c>');
				extension.add('<renderInformation></renderInformation>');
				extension.toXML().should.equal('<extension><x/><c/><renderInformation xmlns="'+renderExt.xmlns+'"/></extension>');
			});
			it('should overwrite extension if same tag provided twice', function () {
				var extension = new sbgnjs.Extension();
				extension.add('<x attr="test1"></x>');
				extension.add('<c></c>');
				extension.add('<x attr="test2"></x>');
				extension.toXML().should.equal('<extension><x attr="test2"/><c/></extension>');
			});
			it('should keep unsupported extensions as is', function () {
				var extension = new sbgnjs.Extension();
				extension.add('<x attr="test1"><nested><evenmorenested/></nested></x>');
				extension.toXML().should.equal('<extension><x attr="test1"><nested><evenmorenested/></nested></x></extension>');
			});
			it('should write render extension', function() {
				var extension = new sbgnjs.Extension();
				extension.add(renderExt.RenderInformation.fromXML('<renderInformation></renderInformation>'));
				extension.toXML().should.equal('<extension><renderInformation xmlns="'+renderExt.xmlns+'"/></extension>');
			});
		});
	});
	describe('notes', function() {
		describe('parse from XML', function() {
			it('should parse empty', function () {
				var notes = sbgnjs.Notes.fromXML('<notes></notes>');
				notes.should.have.ownProperty('content');
				notes.content.should.be.a('string');
			});
			it('should parse with some content', function () {
				var notes = sbgnjs.Notes.fromXML('<notes><p style="font-size:72pt">random content</p></notes>');
				notes.should.have.ownProperty('content');
				notes.content.should.be.a('string');
				notes.content.should.equal('<p style="font-size:72pt">random content</p>');
			});
		});
		describe('test notes functions', function() {
			it('set content', function () {
				var notes = new sbgnjs.Notes();
				notes.setContent("<p>test</p>")
				notes.content.should.equal("<p>test</p>");
				notes.setContent("<p>test2</p>")
				notes.content.should.equal("<p>test2</p>");
			});
			it('append content', function () {
				var notes = new sbgnjs.Notes();
				notes.setContent("<p>test</p>")
				notes.content.should.equal("<p>test</p>");
				notes.appendContent("<p>test2</p>")
				notes.content.should.equal("<p>test</p><p>test2</p>");
			});
		});
		describe('write to XML', function () {
			it('should write empty notes', function () {
				var notes = new sbgnjs.Notes();
				notes.toXML().should.equal("<notes/>");
			});
			it('should write notes with content', function () {
				var notes = new sbgnjs.Notes();
				notes.setContent("<span>test</span>")
				notes.toXML().should.equal("<notes><span>test</span></notes>");
			});
		});
	});
	describe('label', function() {
		it('should parse empty', function() {
			var label = sbgnjs.Label.fromXML("<label/>");
			label.should.have.ownProperty('text');
			should.equal(label.text, null);
		});
		it('should parse complete', function() {
			var label = sbgnjs.Label.fromXML('<label text="some text"><bbox/></label>');
			should.exist(label.text);
			label.text.should.equal('some text');
			should.exist(label.bbox);
			label.bbox.should.be.instanceOf(sbgnjs.Bbox);
		});
		it('should write empty', function() {
			var label = new sbgnjs.Label();
			label.toXML().should.equal('<label text=""/>');
		});
		it('should write complete', function() {
			var label = new sbgnjs.Label({text: 'some text', bbox: new sbgnjs.Bbox()});
			label.toXML().should.equal('<label text="some text"><bbox/></label>');
		});
		it('should read and write newline in attributes', function() {
			sbgnjs.Label.fromXML('<label text="some &#10;text"/>').text.should.equal("some \ntext");
			sbgnjs.Label.fromXML('<label text="some &#xA;text"/>').text.should.equal("some \ntext");
			sbgnjs.Label.fromXML('<label text="some \ntext"/>').text.should.equal("some \ntext");

			// ----- this should not happen, should be encoded as &#xA; xml2js doesn't do it------ //
			//new sbgnjs.Label({text: "some \ntext"}).toXML().should.equal('<label text="some \ntext"/>');
			new sbgnjs.Label({text: "some \ntext"}).toXML().should.equal('<label text="some &#xA;text"/>');
			new sbgnjs.Label({text: "some \n more \n text"}).toXML().should.equal('<label text="some &#xA; more &#xA; text"/>');
		});
		it('should read and write UTF8 characters', function() {
			var label = new sbgnjs.Label({text: 'some têxt Ʃ ڝ ஹ.'});
			label.toXML().should.equal('<label text="some têxt Ʃ ڝ ஹ."/>');
			var label2 = sbgnjs.Label.fromXML(label.toXML());
			label2.text.should.equal('some têxt Ʃ ڝ ஹ.');
			label2.toXML().should.equal('<label text="some têxt Ʃ ڝ ஹ."/>');
		});
		it('should parse extension', function() {
			var label = sbgnjs.Label.fromXML("<label text='text'><extension/></label>");
			should.exist(label.text);
			label.text.should.equal('text');
			should.exist(label.extension);
			label.extension.should.be.a('object');
			label.extension.should.be.instanceOf(sbgnjs.Extension);
		});
		it('should write extension', function() {
			var label = new sbgnjs.Label({text: 'text', extension: new sbgnjs.Extension()});
			label.toXML().should.equal('<label text="text"><extension/></label>');
		});
	});
	describe('bbox', function() {
		it('should parse empty', function() {
			var bbox = sbgnjs.Bbox.fromXML("<bbox/>");
			bbox.should.have.ownProperty('x');
			bbox.x.should.be.NaN;
			bbox.should.have.ownProperty('y');
			bbox.y.should.be.NaN;
			bbox.should.have.ownProperty('w');
			bbox.w.should.be.NaN;
			bbox.should.have.ownProperty('h');
			bbox.h.should.be.NaN;
		});
		it('should parse complete', function() {
			var bbox = sbgnjs.Bbox.fromXML('<bbox x="1" y="2" w="3.1416" h="4"/>');
			should.exist(bbox.x);
			bbox.x.should.equal(1);
			should.exist(bbox.y);
			bbox.y.should.equal(2);
			should.exist(bbox.w);
			bbox.w.should.equal(3.1416);
			should.exist(bbox.h);
			bbox.h.should.equal(4);
		});
		it('should write empty', function() {
			var bbox = new sbgnjs.Bbox();
			bbox.toXML().should.equal('<bbox/>');
		});
		it('should write complete', function() {
			var bbox = new sbgnjs.Bbox({x: 1, y: 2, w: 3.1416, h: 4});
			bbox.toXML().should.equal('<bbox x="1" y="2" w="3.1416" h="4"/>');
		});
	});
	describe('state', function() {
		it('should parse empty', function() {
			var state = sbgnjs.State.fromXML("<state/>");
			state.should.have.ownProperty('value');
			state.should.have.ownProperty('variable');
			should.equal(state.value, null);
			should.equal(state.variable, null);
		});
		it('should parse complete', function() {
			var state = sbgnjs.State.fromXML('<state value="some value" variable="v"/>');
			should.exist(state.value);
			state.value.should.equal('some value');
			should.exist(state.variable);
			state.variable.should.equal('v');
		});
		it('should be backward compatible with deprecated name', function() {
			var state = sbgnjs.StateType.fromXML('<state value="some value" variable="v"/>');
			should.exist(state.value);
			state.value.should.equal('some value');
			should.exist(state.variable);
			state.variable.should.equal('v');
		});
		it('should write empty', function() {
			var state = new sbgnjs.State();
			state.toXML().should.equal('<state/>');
		});
		it('should write complete', function() {
			var state = new sbgnjs.State({value: 'some value', variable: 'variable'});
			state.toXML().should.equal('<state value="some value" variable="variable"/>');
		});
	});
	describe('clone', function() {
		it('should parse empty', function() {
			var clone = sbgnjs.Clone.fromXML("<clone/>");
			clone.should.have.ownProperty('label');
			should.equal(clone.label, null);
		});
		it('should parse complete', function() {
			var clone = sbgnjs.Clone.fromXML('<clone><label text="some label"/></clone>');
			should.exist(clone.label);
			clone.label.should.be.instanceOf(sbgnjs.Label);
			clone.label.text.should.equal('some label');
		});
		it('should be backward compatible with deprecated name', function() {
			var clone = sbgnjs.CloneType.fromXML('<clone><label text="some label"/></clone>');
			should.exist(clone.label);
			clone.label.should.be.instanceOf(sbgnjs.Label);
			clone.label.text.should.equal('some label');
		});
		it('should write empty', function() {
			var clone = new sbgnjs.Clone();
			clone.toXML().should.equal('<clone/>');
		});
		it('should write complete', function() {
			var clone = new sbgnjs.Clone({label: new sbgnjs.Label({text: 'some label'})});
			clone.toXML().should.equal('<clone><label text="some label"/></clone>');
		});
	});
	describe('entity', function() {
		it('should parse empty', function() {
			var entity = sbgnjs.Entity.fromXML("<entity/>");
			entity.should.have.ownProperty('name');
			should.equal(entity.name, null);
		});
		it('should parse complete', function() {
			var entity = sbgnjs.Entity.fromXML('<entity name="some name"/>');
			should.exist(entity.name);
			entity.name.should.equal('some name');
		});
		it('should be backward compatible with deprecated name', function() {
			var entity = sbgnjs.EntityType.fromXML('<entity name="some name"/>');
			should.exist(entity.name);
			entity.name.should.equal('some name');
		});
		it('should write empty', function() {
			var entity = new sbgnjs.Entity();
			entity.toXML().should.equal('<entity/>');
		});
		it('should write complete', function() {
			var entity = new sbgnjs.Entity({name: 'some name'});
			entity.toXML().should.equal('<entity name="some name"/>');
		});
	});
	describe('port', function() {
		it('should parse empty', function() {
			var port = sbgnjs.Port.fromXML("<port/>");
			port.should.have.ownProperty('id');
			should.equal(port.id, null);
			port.should.have.ownProperty('x');
			port.x.should.be.NaN;
			port.should.have.ownProperty('y');
			port.y.should.be.NaN;
		});
		it('should parse complete', function() {
			var port = sbgnjs.Port.fromXML('<port id="id" x="1.25" y="2"/>');
			should.exist(port.id);
			port.id.should.equal('id');
			should.exist(port.x);
			port.x.should.equal(1.25);
			should.exist(port.y);
			port.y.should.equal(2);
		});
		it('should write empty', function() {
			var port = new sbgnjs.Port();
			port.toXML().should.equal('<port/>');
		});
		it('should write complete', function() {
			var port = new sbgnjs.Port({id: 'id', x: 2, y: 3.1416});
			port.toXML().should.equal('<port id="id" x="2" y="3.1416"/>');
		});
	});
	describe('start type', function() {
		it('should parse empty', function() {
			var start = sbgnjs.Start.fromXML("<start/>");
			start.should.have.ownProperty('x');
			start.x.should.be.NaN;
			start.should.have.ownProperty('y');
			start.y.should.be.NaN;
		});
		it('should parse complete', function() {
			var start = sbgnjs.Start.fromXML('<start x="1" y="2"/>');
			should.exist(start.x);
			start.x.should.equal(1);
			should.exist(start.y);
			start.y.should.equal(2);
		});
		it('should be backwardcompatible with deprecated name', function() {
			var start = sbgnjs.StartType.fromXML('<start x="1" y="2"/>');
			should.exist(start.x);
			start.x.should.equal(1);
			should.exist(start.y);
			start.y.should.equal(2);
		});
		it('should write empty', function() {
			var start = new sbgnjs.Start();
			start.toXML().should.equal('<start/>');
		});
		it('should write complete', function() {
			var start = new sbgnjs.Start({x: 1, y: 2});
			start.toXML().should.equal('<start x="1" y="2"/>');
		});
	});
	describe('end type', function() {
		it('should parse empty', function() {
			var end = sbgnjs.End.fromXML("<end/>");
			end.should.have.ownProperty('x');
			end.x.should.be.NaN;
			end.should.have.ownProperty('y');
			end.y.should.be.NaN;
		});
		it('should parse complete', function() {
			var end = sbgnjs.End.fromXML('<end x="1" y="2"/>');
			should.exist(end.x);
			end.x.should.equal(1);
			should.exist(end.y);
			end.y.should.equal(2);
		});
		it('should be backward compatible with deprecated name', function() {
			var end = sbgnjs.EndType.fromXML('<end x="1" y="2"/>');
			should.exist(end.x);
			end.x.should.equal(1);
			should.exist(end.y);
			end.y.should.equal(2);
		});
		it('should write empty', function() {
			var end = new sbgnjs.End();
			end.toXML().should.equal('<end/>');
		});
		it('should write complete', function() {
			var end = new sbgnjs.End({x: 1, y: 2});
			end.toXML().should.equal('<end x="1" y="2"/>');
		});
	});
	describe('next type', function() {
		it('should parse empty', function() {
			var next = sbgnjs.Next.fromXML("<next/>");
			next.should.have.ownProperty('x');
			next.x.should.be.NaN;
			next.should.have.ownProperty('y');
			next.y.should.be.NaN;
		});
		it('should parse complete', function() {
			var next = sbgnjs.Next.fromXML('<next x="1" y="2"/>');
			should.exist(next.x);
			next.x.should.equal(1);
			should.exist(next.y);
			next.y.should.equal(2);
		});
		it('should be backward compatible with deprecated name', function() {
			var next = sbgnjs.NextType.fromXML('<next x="1" y="2"/>');
			should.exist(next.x);
			next.x.should.equal(1);
			should.exist(next.y);
			next.y.should.equal(2);
		});
		it('should write empty', function() {
			var next = new sbgnjs.Next();
			next.toXML().should.equal('<next/>');
		});
		it('should write complete', function() {
			var next = new sbgnjs.Next({x: 1, y: 2});
			next.toXML().should.equal('<next x="1" y="2"/>');
		});
	});
	describe('point', function() {
		it('should parse empty', function() {
			var point = sbgnjs.Point.fromXML("<point/>");
			point.should.have.ownProperty('x');
			point.x.should.be.NaN;
			point.should.have.ownProperty('y');
			point.y.should.be.NaN;
		});
		it('should parse complete', function() {
			var point = sbgnjs.Point.fromXML('<point x="1" y="2"/>');
			should.exist(point.x);
			point.x.should.equal(1);
			should.exist(point.y);
			point.y.should.equal(2);
		});
		it('should write empty', function() {
			var point = new sbgnjs.Point();
			point.toXML().should.equal('<point/>');
		});
		it('should write complete', function() {
			var point = new sbgnjs.Point({x: 1, y: 2});
			point.toXML().should.equal('<point x="1" y="2"/>');
		});
		it('should parse extension', function() {
			var point = sbgnjs.Point.fromXML("<point><extension/></point>");
			should.exist(point.extension);
			point.extension.should.be.a('object');
			point.extension.should.be.instanceOf(sbgnjs.Extension);
		});
		it('should write extension', function() {
			var point = new sbgnjs.Point({extension: new sbgnjs.Extension()});
			point.toXML().should.equal('<point><extension/></point>');
		});
	});

	describe('callout', function() {
		it('should parse empty', function() {
			var callout = sbgnjs.Callout.fromXML("<callout/>");
			callout.should.have.ownProperty('target');
			should.equal(callout.target, null);
			callout.should.have.ownProperty('point');
			should.equal(callout.point, null);
		});
		it('should parse complete', function() {
			var callout = sbgnjs.Callout.fromXML('<callout target="ref"><point x="1" y="2"/></callout>');
			should.exist(callout.target);
			callout.target.should.equal("ref");
			should.exist(callout.point);
			callout.point.should.be.instanceOf(sbgnjs.Point);
			callout.point.should.deep.equal(new sbgnjs.Point({x: 1, y: 2}));
		});
		it('should write empty', function() {
			var callout = new sbgnjs.Callout();
			callout.toXML().should.equal('<callout/>');
		});
		it('should write complete', function() {
			var callout = new sbgnjs.Callout({target: "ref", point: new sbgnjs.Point({x: 1, y: 2})});
			callout.toXML().should.equal('<callout target="ref"><point x="1" y="2"/></callout>');
		});
	});

	describe('arcgroup', function() {
		it('should parse empty', function() {
			var arcgroup = sbgnjs.Arcgroup.fromXML("<arcgroup/>");
			arcgroup.should.have.ownProperty('class_');
			should.equal(arcgroup.class_, null);
			arcgroup.should.have.ownProperty('glyphs');
			arcgroup.glyphs.should.have.length(0);
			arcgroup.should.have.ownProperty('arcs');
			arcgroup.arcs.should.have.length(0);
		});
		it('should parse complete', function() {
			var arcgroup = sbgnjs.Arcgroup.fromXML('<arcgroup class="class"><glyph/><arc/><arc/></arcgroup>');
			should.exist(arcgroup.class_);
			arcgroup.class_.should.equal("class");
			arcgroup.glyphs.should.have.length(1);
			arcgroup.glyphs[0].should.be.instanceOf(sbgnjs.Glyph);
			arcgroup.arcs.should.have.length(2);
			arcgroup.arcs[0].should.be.instanceOf(sbgnjs.Arc);
			arcgroup.arcs[1].should.be.instanceOf(sbgnjs.Arc);
		});
		it('should write empty', function() {
			var arcgroup = new sbgnjs.Arcgroup();
			arcgroup.toXML().should.equal('<arcgroup/>');
		});
		it('should write complete', function() {
			var arcgroup = new sbgnjs.Arcgroup({class_: "class"});
			arcgroup.toXML().should.equal('<arcgroup class="class"/>');
			arcgroup.addGlyph(new sbgnjs.Glyph());
			arcgroup.addArc(new sbgnjs.Arc());
			arcgroup.toXML().should.equal('<arcgroup class="class"><glyph/><arc/></arcgroup>');
		});
	});

	describe('glyph', function() {
		describe('parse from XML', function() {
			it('should parse empty', function() {
				var glyph = sbgnjs.Glyph.fromXML("<glyph></glyph>");
				glyph.should.have.ownProperty('id');
				should.equal(glyph.id, null);
				glyph.should.have.ownProperty('class_');
				should.equal(glyph.class_, null);
				glyph.should.have.ownProperty('compartmentRef');
				should.equal(glyph.compartmentRef, null);
				glyph.should.have.ownProperty('compartmentOrder');
				glyph.compartmentOrder.should.be.NaN;
				glyph.should.have.ownProperty('mapRef');
				should.equal(glyph.mapRef, null);
				glyph.should.have.ownProperty('tagRef');
				should.equal(glyph.tagRef, null);
				glyph.should.have.ownProperty('orientation');
				should.equal(glyph.orientation, null);

				glyph.should.have.ownProperty('label');
				should.equal(glyph.label, null);
				glyph.should.have.ownProperty('bbox');
				should.equal(glyph.bbox, null);
				glyph.should.have.ownProperty('clone');
				should.equal(glyph.clone, null);
				glyph.should.have.ownProperty('callout');
				should.equal(glyph.callout, null);
				glyph.should.have.ownProperty('glyphMembers');
				glyph.glyphMembers.should.have.length(0);
				glyph.should.have.ownProperty('ports');
				glyph.ports.should.have.length(0);
			});
			it('should parse attributes', function() {
				var glyph = sbgnjs.Glyph.fromXML("<glyph id='id' class='class' compartmentRef='ref'"+
					" compartmentOrder='2' mapRef='mapRef' tagRef='tagRef' orientation='vertical'></glyph>");
				should.exist(glyph.id);
				glyph.id.should.equal('id');
				should.exist(glyph.class_);
				glyph.class_.should.equal('class');
				should.exist(glyph.compartmentRef);
				glyph.compartmentRef.should.equal('ref');
				should.exist(glyph.compartmentOrder);
				glyph.compartmentOrder.should.equal(2);
				should.exist(glyph.mapRef);
				glyph.mapRef.should.equal('mapRef');
				should.exist(glyph.tagRef);
				glyph.tagRef.should.equal('tagRef');
				should.exist(glyph.orientation);
				glyph.orientation.should.equal('vertical');
			});
			it('should parse empty label child', function() {
				var glyph = sbgnjs.Glyph.fromXML("<glyph><label></label></glyph>");
				should.exist(glyph.label);
				glyph.label.should.be.a('object');
				glyph.label.should.be.instanceOf(sbgnjs.Label);
			});
			it('should parse complete label child', function() {
				var glyph = sbgnjs.Glyph.fromXML("<glyph><label text='some text'></label></glyph>");
				should.exist(glyph.label);
				glyph.label.should.be.a('object');
				glyph.label.should.be.instanceOf(sbgnjs.Label);
				should.exist(glyph.label.text);
				glyph.label.text.should.equal('some text');
			});
			it('should parse state child', function() {
				var glyph = sbgnjs.Glyph.fromXML("<glyph><state /></glyph>");
				should.exist(glyph.state);
				glyph.state.should.be.a('object');
				glyph.state.should.be.instanceOf(sbgnjs.State);
			});
			it('should parse bbox child', function() {
				var glyph = sbgnjs.Glyph.fromXML("<glyph><bbox></bbox></glyph>");
				should.exist(glyph.bbox);
				glyph.bbox.should.be.a('object');
				glyph.bbox.should.be.instanceOf(sbgnjs.Bbox);
			});
			it('should parse clone child', function() {
				var glyph = sbgnjs.Glyph.fromXML("<glyph><clone /></glyph>");
				should.exist(glyph.clone);
				glyph.clone.should.be.a('object');
				glyph.clone.should.be.instanceOf(sbgnjs.Clone);
			});
			it('should parse callout child', function() {
				var glyph = sbgnjs.Glyph.fromXML("<glyph><callout target='truc'/></glyph>");
				should.exist(glyph.callout);
				glyph.callout.should.be.a('object');
				glyph.callout.should.be.instanceOf(sbgnjs.Callout);
				glyph.callout.target.should.equal("truc");
			});
			it('should parse entity child', function() {
				var glyph = sbgnjs.Glyph.fromXML("<glyph><entity name='test'/></glyph>");
				should.exist(glyph.entity);
				glyph.entity.should.be.a('object');
				glyph.entity.should.be.instanceOf(sbgnjs.Entity);
				glyph.entity.name.should.equal('test');
			});
			it('should parse nested glyph child', function() {
				var glyph = sbgnjs.Glyph.fromXML("<glyph><glyph></glyph></glyph>");
				should.exist(glyph.glyphMembers);
				glyph.glyphMembers.should.be.a('array');
				glyph.glyphMembers.should.have.lengthOf(1);
				glyph.glyphMembers[0].should.be.instanceOf(sbgnjs.Glyph);
			});
			it('should parse nested glyph child 2 levels', function() {
				var glyph = sbgnjs.Glyph.fromXML("<glyph><glyph><glyph></glyph></glyph></glyph>");
				should.exist(glyph.glyphMembers);
				glyph.glyphMembers.should.be.a('array');
				glyph.glyphMembers.should.have.lengthOf(1);
				glyph.glyphMembers[0].should.be.instanceOf(sbgnjs.Glyph);
				should.exist(glyph.glyphMembers[0].glyphMembers);
				glyph.glyphMembers[0].glyphMembers.should.be.a('array');
				glyph.glyphMembers[0].glyphMembers.should.have.lengthOf(1);
				glyph.glyphMembers[0].glyphMembers[0].should.be.instanceOf(sbgnjs.Glyph);
			});
			it('should parse port child', function() {
				var glyph = sbgnjs.Glyph.fromXML("<glyph><port></port></glyph>");
				should.exist(glyph.ports);
				glyph.ports.should.be.a('array');
				glyph.ports.should.have.lengthOf(1);
				glyph.ports[0].should.be.instanceOf(sbgnjs.Port);
			});
		});
		describe('write to XML', function() {
			it('should write empty glyph', function() {
				var glyph = new sbgnjs.Glyph();
				glyph.toXML().should.equal("<glyph/>");
			});
			it('should write complete glyph', function() {
				var glyph = new sbgnjs.Glyph({id: "id", class_: "a_class", compartmentRef: "a_compartment_id",
											compartmentOrder: 1.5, mapRef: "mapRef", tagRef: "tagRef", orientation: "vertical"});
				glyph.setLabel(new sbgnjs.Label());
				glyph.setState(new sbgnjs.State());
				glyph.setBbox(new sbgnjs.Bbox());
				glyph.setClone(new sbgnjs.Clone());
				glyph.setCallout(new sbgnjs.Callout());
				glyph.setEntity(new sbgnjs.Entity());
				glyph.addGlyphMember(new sbgnjs.Glyph());
				glyph.addPort(new sbgnjs.Port());
				glyph.toXML().should.equal('<glyph id="id" class="a_class" compartmentRef="a_compartment_id" '+
												'compartmentOrder="1.5" mapRef="mapRef" tagRef="tagRef" orientation="vertical">'+
												'<label text=""/>'+
												"<state/>"+
												"<clone/>"+
												"<callout/>"+
												"<entity/>"+
												"<bbox/>"+
												"<glyph/>"+
												"<port/>"+
											"</glyph>");
			});
		});
	});

	describe('arc', function() {
		describe('parse from XML', function() {
			it('should parse empty', function() {
				var arc = sbgnjs.Arc.fromXML("<arc></arc>");
				arc.should.have.ownProperty('id');
				should.equal(arc.id, null);
				arc.should.have.ownProperty('class_');
				should.equal(arc.class_, null);
				arc.should.have.ownProperty('source');
				should.equal(arc.source, null);
				arc.should.have.ownProperty('target');
				should.equal(arc.target, null);

				arc.should.have.ownProperty('start');
				should.equal(arc.start, null);
				arc.should.have.ownProperty('end');
				should.equal(arc.end, null);
				arc.should.have.ownProperty('nexts');
				arc.nexts.should.have.length(0);
				arc.should.have.ownProperty('glyphs');
				arc.glyphs.should.have.length(0);
			});
			it('should parse attributes', function() {
				var arc = sbgnjs.Arc.fromXML("<arc id='id' class='class' source='source' target='target'></arc>");
				should.exist(arc.id);
				arc.id.should.equal('id');
				should.exist(arc.class_);
				arc.class_.should.equal('class');
				should.exist(arc.source);
				arc.source.should.equal('source');
				should.exist(arc.target);
				arc.target.should.equal('target');
			});
			it('should parse start child', function() {
				var arc = sbgnjs.Arc.fromXML("<arc><start /></arc>");
				should.exist(arc.start);
				arc.start.should.be.a('object');
				arc.start.should.be.instanceOf(sbgnjs.Start);
			});
			it('should parse end child', function() {
				var arc = sbgnjs.Arc.fromXML("<arc><end /></arc>");
				should.exist(arc.end);
				arc.end.should.be.a('object');
				arc.end.should.be.instanceOf(sbgnjs.End);
			});
			it('should parse next child', function() {
				var arc = sbgnjs.Arc.fromXML("<arc><next /></arc>");
				should.exist(arc.nexts);
				arc.nexts.should.be.a('array');
				arc.nexts.should.have.lengthOf(1);
				arc.nexts[0].should.be.instanceOf(sbgnjs.Next);
			});
			it('should parse glyphs child', function() {
				var arc = sbgnjs.Arc.fromXML("<arc><glyph></glyph></arc>");
				should.exist(arc.glyphs);
				arc.glyphs.should.be.a('array');
				arc.glyphs.should.have.lengthOf(1);
				arc.glyphs[0].should.be.instanceOf(sbgnjs.Glyph);
			});
			it('should parse complete', function() {
				var arc = sbgnjs.Arc.fromXML("<arc id='id' class='class' source='source' target='target'><start /><next /><next /><end /><glyph></glyph></arc>");
				should.exist(arc.id);
				arc.id.should.equal('id');
				should.exist(arc.class_);
				arc.class_.should.equal('class');
				should.exist(arc.source);
				arc.source.should.equal('source');
				should.exist(arc.target);
				arc.target.should.equal('target');
				should.exist(arc.start);
				arc.start.should.be.a('object');
				arc.start.should.be.instanceOf(sbgnjs.Start);
				should.exist(arc.nexts);
				arc.nexts.should.be.a('array');
				arc.nexts.should.have.lengthOf(2);
				arc.nexts[0].should.be.instanceOf(sbgnjs.Next);
				arc.nexts[1].should.be.instanceOf(sbgnjs.Next);
				should.exist(arc.end);
				arc.end.should.be.a('object');
				arc.end.should.be.instanceOf(sbgnjs.End);
				should.exist(arc.glyphs);
				arc.glyphs.should.be.a('array');
				arc.glyphs.should.have.lengthOf(1);
				arc.glyphs[0].should.be.instanceOf(sbgnjs.Glyph);
			});
		});
		describe('write to XML', function() {
			it('should write empty arc', function() {
				var arc = new sbgnjs.Arc();
				arc.toXML().should.equal("<arc/>");
			});
			it('should write complete arc', function() {
				var arc = new sbgnjs.Arc({id: "id", class_: "a_class", source: "source", target: "target"});
				arc.setStart(new sbgnjs.Start());
				arc.setEnd(new sbgnjs.End());
				arc.addNext(new sbgnjs.Next());
				arc.addNext(new sbgnjs.Next());
				arc.addGlyph(new sbgnjs.Glyph());
				arc.toXML().should.equal('<arc id="id" class="a_class" source="source" target="target">'+
												"<glyph/>"+
												"<start/>"+
												"<next/>"+
												"<next/>"+
												"<end/>"+
											"</arc>");
			});
		});
	});
	describe('complete tests', function() {
		it('should parse full test', function() {
			var sbgn = sbgnjs.Sbgn.fromXML(
				"<?xml version='1.0' encoding='UTF-8' standalone='yes'?>\n"+
				"<sbgn xmlns='http://sbgn.org/libsbgn/0.3'>\n"+
				"<map language='process description' id='mapID'>\n"+
				"<extension>\n"+
					"<renderInformation id='renderInformation' programName='sbgnviz' programVersion='3.1.0' backgroundColor='#ffffff' xmlns='http://www.sbml.org/sbml/level3/version1/render/version1'>\n"+
					"</renderInformation>\n"+
				"</extension>\n"+

				"<glyph id='_82f19e9e-6aa2-42b3-8b5e-8cee17197085' class='compartment'  >\n"+
					"<label text='synaptic button' />\n"+
					"<bbox y='236.9443994213774' x='163.55225216049354' w='263.29323174695764' h='297.15583352545445' />\n"+
				"</glyph>\n"+
				"<glyph id='_66737d5c-5193-43a2-baa6-094aa1c21654' class='macromolecule' compartmentRef='_82f19e9e-6aa2-42b3-8b5e-8cee17197085' >\n"+
					"<label text='CHT1' />\n"+
					"<state value='val' variable='var' />\n"+
					"<bbox y='497.47523294683185' x='300.32877164779546' w='70' h='35' />\n"+
					"<clone><label text='clone label' /></clone>\n"+
				"</glyph>\n"+

				"<arc id='id' class='production' source='source' target='target'>\n"+
					"<start y='353' x='208.35'/>\n"+
					"<next y='1' x='2.35'/>\n"+
					"<next y='3' x='4.35'/>\n"+
					"<end y='5' x='6.35'/>\n"+
				"</arc>\n"+
				"<arc id='id2' class='consumption' source='source2' target='target2'>\n"+
					"<start y='9' x='8'/>\n"+
					"<end y='3' x='2'/>\n"+
					"<glyph id='cardi' class='cardinality' >\n"+
						"<label text='2' />\n"+
					"</glyph>\n"+
				"</arc>\n"+
				"</map>\n"+
				"</sbgn>\n"
			);

			should.exist(sbgn);
			sbgn.should.be.instanceOf(sbgnjs.Sbgn);
			sbgn.xmlns.should.equal('http://sbgn.org/libsbgn/0.3');
			// map
			should.exist(sbgn.maps);
			sbgn.maps[0].should.be.instanceOf(sbgnjs.Map);
			sbgn.maps[0].language.should.equal('process description');
			sbgn.maps[0].id.should.equal('mapID');
			// extension
			should.exist(sbgn.maps[0].extension);
			sbgn.maps[0].extension.should.be.instanceOf(sbgnjs.Extension);
			sbgn.maps[0].extension.list.should.have.ownProperty('renderInformation');
			sbgn.maps[0].extension.list.renderInformation.should.be.instanceOf(renderExt.RenderInformation);
			// glyphs
			sbgn.maps[0].glyphs.should.have.lengthOf(2);
			// glyph 1
			var glyph1 = sbgn.maps[0].glyphs[0];
			glyph1.id.should.equal('_82f19e9e-6aa2-42b3-8b5e-8cee17197085');
			glyph1.class_.should.equal('compartment');
			should.exist(glyph1.label);
			glyph1.label.should.be.instanceOf(sbgnjs.Label);
			glyph1.label.text.should.equal('synaptic button');
			should.exist(glyph1.bbox);
			glyph1.bbox.should.be.instanceOf(sbgnjs.Bbox);
			glyph1.bbox.y.should.equal(236.9443994213774);
			glyph1.bbox.x.should.equal(163.55225216049354);
			glyph1.bbox.w.should.equal(263.29323174695764);
			glyph1.bbox.h.should.equal(297.15583352545445);
			// glyph 2
			var glyph2 = sbgn.maps[0].glyphs[1];
			glyph2.id.should.equal('_66737d5c-5193-43a2-baa6-094aa1c21654');
			glyph2.class_.should.equal('macromolecule');
			should.exist(glyph2.label);
			glyph2.label.should.be.instanceOf(sbgnjs.Label);
			glyph2.label.text.should.equal('CHT1');
			should.exist(glyph2.state);
			glyph2.state.should.be.instanceOf(sbgnjs.State);
			glyph2.state.value.should.equal('val');
			glyph2.state.variable.should.equal('var');
			should.exist(glyph2.bbox);
			glyph2.bbox.should.be.instanceOf(sbgnjs.Bbox);
			glyph2.bbox.y.should.equal(497.47523294683185);
			glyph2.bbox.x.should.equal(300.32877164779546);
			glyph2.bbox.w.should.equal(70);
			glyph2.bbox.h.should.equal(35);
			should.exist(glyph2.clone);
			glyph2.clone.should.be.instanceOf(sbgnjs.Clone);
			glyph2.clone.label.text.should.equal('clone label');
			// arcs
			sbgn.maps[0].arcs.should.have.lengthOf(2);
			// arc1
			var arc1 = sbgn.maps[0].arcs[0];
			arc1.id.should.equal('id');
			arc1.class_.should.equal('production');
			arc1.source.should.equal('source');
			arc1.target.should.equal('target');
			should.exist(arc1.start);
			arc1.start.should.be.instanceOf(sbgnjs.Start);
			arc1.start.x.should.equal(208.35);
			arc1.start.y.should.equal(353);
			should.exist(arc1.end);
			arc1.end.should.be.instanceOf(sbgnjs.End);
			arc1.end.x.should.equal(6.35);
			arc1.end.y.should.equal(5);
			arc1.nexts.should.have.lengthOf(2);
			arc1.nexts[0].should.be.instanceOf(sbgnjs.Next);
			arc1.nexts[0].x.should.equal(2.35);
			arc1.nexts[0].y.should.equal(1);
			arc1.nexts[1].should.be.instanceOf(sbgnjs.Next);
			arc1.nexts[1].x.should.equal(4.35);
			arc1.nexts[1].y.should.equal(3);
			// arc2
			var arc2 = sbgn.maps[0].arcs[1];
			arc2.id.should.equal('id2');
			arc2.class_.should.equal('consumption');
			arc2.source.should.equal('source2');
			arc2.target.should.equal('target2');
			should.exist(arc2.start);
			arc2.start.should.be.instanceOf(sbgnjs.Start);
			arc2.start.x.should.equal(8);
			arc2.start.y.should.equal(9);
			should.exist(arc2.end);
			arc2.end.should.be.instanceOf(sbgnjs.End);
			arc2.end.x.should.equal(2);
			arc2.end.y.should.equal(3);
			arc2.nexts.should.have.lengthOf(0);
			should.exist(arc2.glyphs);
			arc2.glyphs.should.be.a('array');
			arc2.glyphs.should.have.lengthOf(1);
			arc2.glyphs[0].should.be.instanceOf(sbgnjs.Glyph);
			arc2.glyphs[0].id.should.equal('cardi');
			arc2.glyphs[0].class_.should.equal('cardinality');
			should.exist(arc2.glyphs[0].label);
			arc2.glyphs[0].label.should.be.instanceOf(sbgnjs.Label);
			arc2.glyphs[0].label.text.should.equal(2);
		});
		it('should parse prefix and namespace full test', function() {
			var sbgn = sbgnjs.Sbgn.fromXML(
				'<?xml version="1.0" encoding="UTF-8"?><sbgn xmlns:sbgn="http://sbgn.org/libsbgn/0.2">\n'+
				    '<sbgn:map xmlns:sbgn="http://sbgn.org/libsbgn/0.2" language="process description">\n'+
				        '<sbgn:glyph xmlns:sbgn="http://sbgn.org/libsbgn/0.2" class="macromolecule" id="g1">\n'+
				            '<sbgn:label xmlns:sbgn="http://sbgn.org/libsbgn/0.2" text="LABEL"/>\n'+
				            '<sbgn:bbox xmlns:sbgn="http://sbgn.org/libsbgn/0.2" w="380." h="210." x="90." y="160."/>\n'+
				        '</sbgn:glyph>\n'+
				        '<sbgn:glyph xmlns:sbgn="http://sbgn.org/libsbgn/0.2" class="annotation" id="g2">\n'+
				            '<sbgn:label xmlns:sbgn="http://sbgn.org/libsbgn/0.2" text="INFO"/>\n'+
				            '<sbgn:callout xmlns:sbgn="http://sbgn.org/libsbgn/0.2" target="g1">\n'+
				                '<sbgn:point xmlns:sbgn="http://sbgn.org/libsbgn/0.2" x="160." y="200."/>\n'+
				            '</sbgn:callout>\n'+
				            '<sbgn:bbox xmlns:sbgn="http://sbgn.org/libsbgn/0.2" w="220." h="125." x="5." y="5."/>\n'+
				        '</sbgn:glyph>\n'+
				    '</sbgn:map>\n'+
				'</sbgn>\n'
			);
			should.exist(sbgn);
			sbgn.should.be.instanceOf(sbgnjs.Sbgn);
			should.exist(sbgn.xmlns);
			sbgn.xmlns.should.equal('http://sbgn.org/libsbgn/0.2');
			// map
			should.exist(sbgn.maps);
			sbgn.maps[0].should.be.instanceOf(sbgnjs.Map);
			sbgn.maps[0].language.should.equal('process description');
			//sbgn.map.id.should.equal('mapID');
			sbgn.maps[0].glyphs.should.have.lengthOf(2);
			// glyph 1
			var glyph1 = sbgn.maps[0].glyphs[0];
			glyph1.id.should.equal('g1');
			glyph1.class_.should.equal('macromolecule');
			should.exist(glyph1.label);
			glyph1.label.should.be.instanceOf(sbgnjs.Label);
			glyph1.label.text.should.equal('LABEL');
			should.exist(glyph1.bbox);
			glyph1.bbox.should.be.instanceOf(sbgnjs.Bbox);
			glyph1.bbox.y.should.equal(160);
			glyph1.bbox.x.should.equal(90);
			glyph1.bbox.w.should.equal(380);
			glyph1.bbox.h.should.equal(210);
			// glyph 2
			var glyph2 = sbgn.maps[0].glyphs[1];
			glyph2.id.should.equal('g2');
			glyph2.class_.should.equal('annotation');
			should.exist(glyph2.label);
			glyph2.label.should.be.instanceOf(sbgnjs.Label);
			glyph2.label.text.should.equal('INFO');
			should.exist(glyph2.bbox);
			glyph2.bbox.should.be.instanceOf(sbgnjs.Bbox);
			glyph2.bbox.y.should.equal(5);
			glyph2.bbox.x.should.equal(5);
			glyph2.bbox.w.should.equal(220);
			glyph2.bbox.h.should.equal(125);
			// MISSING CALLOUTS HERE TODO		
		});
	});
});

describe('usage examples', function() {
	function example1() {
		var libsbgnjs = sbgnjs; // require('libsbgn.js');

		var sbgn = new libsbgnjs.Sbgn({xmlns: 'http://sbgn.org/libsbgn/0.3'});

		var map = new libsbgnjs.Map({id: 'mymap', language: 'process description'});
		sbgn.addMap(map);

		var glyph1 = new libsbgnjs.Glyph({id: 'glyph1', class_: 'macromolecule'});
		glyph1.setLabel(new libsbgnjs.Label({text: 'entity A'}));
		glyph1.setBbox(new libsbgnjs.Bbox({x: 0, y: 0, w:10, h:10}));
		map.addGlyph(glyph1);

		var glyph2 = new libsbgnjs.Glyph({id: 'glyph2', class_: 'macromolecule'});
		glyph2.setLabel(new libsbgnjs.Label({text: 'entity B'}));
		glyph2.setBbox(new libsbgnjs.Bbox({x: 20, y: 0, w:10, h:10}));
		map.addGlyph(glyph2);

		var processGlyph = new libsbgnjs.Glyph({id: 'process1', class_: 'process'});
		processGlyph.setBbox(new libsbgnjs.Bbox({x: 10, y: 0, w:10, h:10}));
		map.addGlyph(processGlyph);

		var arc1 = new libsbgnjs.Arc({id:'arc1', class_:'consumption', source:'glyph1', target:'process1'});
		arc1.setStart(new libsbgnjs.Start({x:0, y:0}));
		arc1.setEnd(new libsbgnjs.End({x:10, y:0}));
		map.addArc(arc1);

		var arc2 = new libsbgnjs.Arc({id:'arc2', class_:'production', source:'process1', target:'glyph2'});
		arc2.setStart(new libsbgnjs.Start({x:10, y:0}));
		arc2.setEnd(new libsbgnjs.End({x:20, y:0}));
		map.addArc(arc2);

		var xmlString = sbgn.toXML();

		/*
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
		*/
		return xmlString;
	}
});
