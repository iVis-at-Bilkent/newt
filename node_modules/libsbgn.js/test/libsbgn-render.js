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

describe('libsbgn-render', function() {
	describe('colorDefinition', function() {
		it('should parse empty', function() {
			var colordef = renderExt.ColorDefinition.fromXML("<colorDefinition />");
			colordef.should.have.ownProperty('id');
			should.equal(colordef.id, null);
			colordef.should.have.ownProperty('value');
			should.equal(colordef.value, null);
		});
		it('should parse complete', function() {
			var colordef = renderExt.ColorDefinition.fromXML("<colorDefinition id='blue' value='#123456' />");
			should.exist(colordef.id);
			colordef.id.should.equal('blue');
			should.exist(colordef.value);
			colordef.value.should.equal('#123456');
		});
		it('should write empty', function() {
			var colordef = new renderExt.ColorDefinition();
			colordef.toXML().should.equal('<colorDefinition/>');
		});
		it('should write complete', function() {
			var colordef = new renderExt.ColorDefinition({id: 'blue', value: '#123456'});
			colordef.toXML().should.equal('<colorDefinition id="blue" value="#123456"/>');
		});
	});

	describe('listOfColorDefinitions', function() {
		describe('parse from XML', function() {
			it('should parse empty', function() {
				var listof = renderExt.ListOfColorDefinitions.fromXML("<listOfColorDefinitions></listOfColorDefinitions>");
				listof.should.have.ownProperty('colorDefinitions');
				listof.colorDefinitions.should.be.a('array');
				listof.colorDefinitions.should.have.lengthOf(0);
			});
			it('should parse color', function() {
				var listof = renderExt.ListOfColorDefinitions.fromXML("<listOfColorDefinitions><colorDefinition /><colorDefinition /></listOfColorDefinitions>");
				listof.should.have.ownProperty('colorDefinitions');
				listof.colorDefinitions.should.be.a('array');
				listof.colorDefinitions.should.have.lengthOf(2);
				listof.colorDefinitions[0].should.be.instanceOf(renderExt.ColorDefinition);
				listof.colorDefinitions[1].should.be.instanceOf(renderExt.ColorDefinition);
			});
		});
		describe('write to XML', function() {
			it('should write empty listOfColorDefinitions', function() {
				var listof = new renderExt.ListOfColorDefinitions();
				listof.toXML().should.equal("<listOfColorDefinitions/>");
			});
			it('should write complete list with empty colorDefinitions', function() {
				var listof = new renderExt.ListOfColorDefinitions();
				listof.addColorDefinition(new renderExt.ColorDefinition());
				listof.addColorDefinition(new renderExt.ColorDefinition());
				listof.toXML().should.equal("<listOfColorDefinitions><colorDefinition/><colorDefinition/></listOfColorDefinitions>");
			});
		});
		describe('utilities', function() {
			var listof;
			beforeEach('build listOfColorDefinitions variable', function() {
				listof = new renderExt.ListOfColorDefinitions();
				listof.addColorDefinition(new renderExt.ColorDefinition({id: "id1", value: "#FFFFFF"}));
				listof.addColorDefinition(new renderExt.ColorDefinition({id: "id2", value: "#000000"}));
			});
			it('should maintain color index', function() {
				listof.should.have.ownProperty('colorIndex');
				listof.colorIndex.should.be.a('object');
				listof.colorIndex["id1"].should.equal("#FFFFFF");
				listof.colorIndex["id2"].should.equal("#000000");
			});
			it('getColorById should return the right color', function() {
				listof.getColorById("id1").should.equal("#FFFFFF");
				listof.getColorById("id2").should.equal("#000000");
			});
			it('getAllColors should return array of all colors', function() {
				listof.getAllColors().should.deep.equal(["#FFFFFF", "#000000"]);
			});
		});
	});

	describe('renderGroup', function() {
		it('should parse empty', function() {
			var g = renderExt.RenderGroup.fromXML("<g />");
			g.should.have.ownProperty('id');
			should.equal(g.id, null);
			g.should.have.ownProperty('fontSize');
			should.equal(g.fontSize, null);
			g.should.have.ownProperty('fontFamily');
			should.equal(g.fontFamily, null);
			g.should.have.ownProperty('fontWeight');
			should.equal(g.fontWeight, null);
			g.should.have.ownProperty('fontStyle');
			should.equal(g.fontStyle, null);
			g.should.have.ownProperty('textAnchor');
			should.equal(g.textAnchor, null);
			g.should.have.ownProperty('vtextAnchor');
			should.equal(g.vtextAnchor, null);
			g.should.have.ownProperty('fill');
			should.equal(g.fill, null);
			g.should.have.ownProperty('stroke');
			should.equal(g.stroke, null);
			g.should.have.ownProperty('strokeWidth');
			should.equal(g.strokeWidth, null);
		});
		it('should parse complete', function() {
			var g = renderExt.RenderGroup.fromXML("<g id='id' fontSize='12' fontFamily='Comic' fontWeight='not bold'"+
															" fontStyle='style' textAnchor='on top of the top' vtextAnchor='left'"+
															" fill='#123456' stroke='blue' strokeWidth='2' />");
			should.exist(g.id);
			g.id.should.equal('id');
			should.exist(g.fontSize);
			g.fontSize.should.equal(12);
			should.exist(g.fontFamily);
			g.fontFamily.should.equal('Comic');
			should.exist(g.fontWeight);
			g.fontWeight.should.equal('not bold');
			should.exist(g.fontStyle);
			g.fontStyle.should.equal('style');
			should.exist(g.textAnchor);
			g.textAnchor.should.equal('on top of the top');
			should.exist(g.vtextAnchor);
			g.vtextAnchor.should.equal('left');
			should.exist(g.fill);
			g.fill.should.equal('#123456');
			should.exist(g.stroke);
			g.stroke.should.equal('blue');
			should.exist(g.strokeWidth);
			g.strokeWidth.should.equal(2);
		});
		it('should write empty', function() {
			var g = new renderExt.RenderGroup();
			g.toXML().should.equal('<g/>');
		});
		it('should write complete', function() {
			var g = new renderExt.RenderGroup({	id: 'id', fontSize: '12', fontFamily: 'Comic', fontWeight: 'not bold',
												fontStyle:'style', textAnchor: 'on top of the top', vtextAnchor: 'left', 
												fill: '#123456', stroke: 'blue', strokeWidth: '2'});
			g.toXML().should.equal(	'<g id="id" fontSize="12" fontFamily="Comic" fontWeight="not bold"'+
									' fontStyle="style" textAnchor="on top of the top" vtextAnchor="left"'+
									' stroke="blue" strokeWidth="2" fill="#123456"/>');
		});
	});

	describe('style', function() {
		describe('parse from XML', function() {
			it('should parse empty', function() {
				var style = renderExt.Style.fromXML("<style></style>");
				style.should.have.ownProperty('id');
				should.equal(style.id, null);
				style.should.have.ownProperty('name');
				should.equal(style.name, null);
				style.should.have.ownProperty('idList');
				should.equal(style.idList, null);
				style.should.have.ownProperty('renderGroup');
				should.equal(style.renderGroup, null);
			});
			it('should parse complete', function() {
				var style = renderExt.Style.fromXML("<style id='id' name='myStyle' idList='a b c'><g /></style>");
				should.exist(style.id);
				style.id.should.equal('id');
				should.exist(style.name);
				style.name.should.equal('myStyle');
				should.exist(style.idList);
				style.idList.should.equal('a b c');
				should.exist(style.renderGroup);
				style.renderGroup.should.be.a('object');
				style.renderGroup.should.be.instanceOf(renderExt.RenderGroup);
			});
		});
		describe('write to XML', function() {
			it('should write empty style', function() {
				var style = new renderExt.Style();
				style.toXML().should.equal("<style/>");
			});
			it('should write complete style with empty renderGroup', function() {
				var style = new renderExt.Style({id: 'id', name: 'myName', idList:'a b c'});
				style.setRenderGroup(new renderExt.RenderGroup());
				style.toXML().should.equal('<style id="id" name="myName" idList="a b c"><g/></style>');
			});
		});
		describe('test utilities function', function() {
			it('getIdListAsArray', function() {
				var style = new renderExt.Style({idList: 'a b c'});
				var array = style.getIdListAsArray();
				should.exist(array);
				array.should.be.a('array');
				array.should.deep.equal(['a', 'b', 'c']);
			});
			it('setIdListFromArray', function() {
				var style = new renderExt.Style();
				style.setIdListFromArray(['a', 'b', 'c']);
				should.exist(style.idList);
				style.idList.should.be.a('string');
				style.idList.should.equal('a b c');
			});
			it('getStyleMap', function() {
				var style = new renderExt.Style({idList: 'a b c', renderGroup: new renderExt.RenderGroup({stroke: 'red'})});
				var styleIndex = style.getStyleMap();
				Object.keys(styleIndex).should.deep.equal(['a', 'b', 'c']);
				styleIndex['a'].stroke.should.equal('red');
			});
		});
	});

	describe('listOfStyles', function() {
		describe('parse from XML', function() {
			it('should parse empty', function() {
				var listof = renderExt.ListOfStyles.fromXML("<listOfStyles></listOfStyles>");
				listof.should.have.ownProperty('styles');
				listof.styles.should.be.a('array');
				listof.styles.should.have.lengthOf(0);
			});
			it('should parse style', function() {
				var listof = renderExt.ListOfStyles.fromXML("<listOfStyles><style></style><style></style></listOfStyles>");
				listof.should.have.ownProperty('styles');
				listof.styles.should.be.a('array');
				listof.styles.should.have.lengthOf(2);
				listof.styles[0].should.be.instanceOf(renderExt.Style);
				listof.styles[1].should.be.instanceOf(renderExt.Style);
			});
		});
		describe('write to XML', function() {
			it('should write empty listOfStyles', function() {
				var listof = new renderExt.ListOfStyles();
				listof.toXML().should.equal("<listOfStyles/>");
			});
			it('should write complete list with empty colorDefinitions', function() {
				var listof = new renderExt.ListOfStyles();
				listof.addStyle(new renderExt.Style());
				listof.addStyle(new renderExt.Style());
				listof.toXML().should.equal("<listOfStyles><style/><style/></listOfStyles>");
			});
		});
		describe('test utilities function', function() {
			it('getStyleMap', function() {
				var style = new renderExt.Style({idList: 'a b c', renderGroup: new renderExt.RenderGroup({stroke: 'red'})});
				var style2 = new renderExt.Style({idList: 'd e f', renderGroup: new renderExt.RenderGroup({stroke: 'yellow'})});
				var listOf = new renderExt.ListOfStyles();
				listOf.addStyle(style);
				listOf.addStyle(style2);
				var styleIndex = listOf.getStyleMap();
				Object.keys(styleIndex).should.deep.equal(['a', 'b', 'c', 'd', 'e', 'f']);
				styleIndex['a'].stroke.should.equal('red');
				styleIndex['b'].stroke.should.equal('red');
				styleIndex['e'].stroke.should.equal('yellow');
			});
		});
	});

	describe('renderInformation', function() {
		describe('parse from XML', function() {
			it('should parse empty', function() {
				var renderInformation = renderExt.RenderInformation.fromXML("<renderInformation></renderInformation>");
				renderInformation.should.have.ownProperty('id');
				should.equal(renderInformation.id, null);
				renderInformation.should.have.ownProperty('name');
				should.equal(renderInformation.name, null);
				renderInformation.should.have.ownProperty('programName');
				should.equal(renderInformation.programName, null);
				renderInformation.should.have.ownProperty('programVersion');
				should.equal(renderInformation.programVersion, null);
				renderInformation.should.have.ownProperty('backgroundColor');
				should.equal(renderInformation.backgroundColor, null);
				renderInformation.should.have.ownProperty('listOfColorDefinitions');
				should.equal(renderInformation.listOfColorDefinitions, null);
				renderInformation.should.have.ownProperty('listOfStyles');
				should.equal(renderInformation.listOfStyles, null);
			});
			it('should parse attributes', function() {
				var renderInfo = renderExt.RenderInformation.fromXML(	"<renderInformation id='a' name='name' programName='prog' "+
																"programVersion='2.0.1a' backgroundColor='#FFFFFF'></renderInformation>");
				should.exist(renderInfo.id);
				renderInfo.id.should.equal('a');
				should.exist(renderInfo.name);
				renderInfo.name.should.equal('name');
				should.exist(renderInfo.programName);
				renderInfo.programName.should.equal('prog');
				should.exist(renderInfo.programVersion);
				renderInfo.programVersion.should.equal('2.0.1a');
				should.exist(renderInfo.backgroundColor);
				renderInfo.backgroundColor.should.equal('#FFFFFF');
			});
			it('should parse children', function() {
				var renderInfo = renderExt.RenderInformation.fromXML("<renderInformation>"+
													"<listOfColorDefinitions></listOfColorDefinitions>"+
													"<listOfStyles></listOfStyles></renderInformation>");
				should.exist(renderInfo.listOfColorDefinitions);
				renderInfo.listOfColorDefinitions.should.be.a('object');
				renderInfo.listOfColorDefinitions.should.be.instanceOf(renderExt.ListOfColorDefinitions);
				should.exist(renderInfo.listOfStyles);
				renderInfo.listOfStyles.should.be.a('object');
				renderInfo.listOfStyles.should.be.instanceOf(renderExt.ListOfStyles);
			});
		});
		describe('write to XML', function() {
			it('should write empty renderInfo', function() {
				var renderInfo = new renderExt.RenderInformation();
				renderInfo.toXML().should.equal('<renderInformation xmlns="http://www.sbml.org/sbml/level3/version1/render/version1"/>');
			});
			it('should write complete renderInformation with empty children', function() {
				var renderInfo = new renderExt.RenderInformation({id: 'id', name: 'name', programName: 'prog',
																	programVersion: '0.0.0', backgroundColor: 'blue'});
				renderInfo.setListOfColorDefinitions(new renderExt.ListOfColorDefinitions());
				renderInfo.setListOfStyles(new renderExt.ListOfStyles());
				renderInfo.toXML().should.equal('<renderInformation xmlns="http://www.sbml.org/sbml/level3/version1/render/version1"'+
												' id="id" name="name" programName="prog" programVersion="0.0.0" backgroundColor="blue">'+
												"<listOfColorDefinitions/>"+
												"<listOfStyles/>"+
												"</renderInformation>");
			});
		});
	});
	describe('full test', function() {
		it('should parse renderInformation from extension', function() {
			var xml = "<extension>"+
			"<renderInformation id='renderInformation' programName='sbgnviz' programVersion='3.1.0' backgroundColor='#ffffff' xmlns='http://www.sbml.org/sbml/level3/version1/render/version1'>"+
			"<listOfColorDefinitions>"+
			"<colorDefinition id='color_1' value='#ffffff7f' />"+
			"<colorDefinition id='color_2' value='#555555' />"+
			"</listOfColorDefinitions>"+
			"<listOfStyles>"+
			"<style id='nodeffffff0.55553.2511normalnormalHelvetica' idList='_82f19e9e-6aa2-42b3-8b5e-8cee17197085 _9007194d-c2e6-4939-a795-be71ae35a60d e95a1256-8a47-4aaf-b3d8-7d8387d5a31d _23d436e2-6633-42f2-98d0-00dbb962ac3d'>"+
			"<g fontSize='14' fontFamily='Helvetica' fontWeight='normal' fontStyle='normal' stroke='color_2' strokeWidth='3.25' fill='color_1' />"+
			"</style>"+
			"</listOfStyles>"+
			"</renderInformation>"+
			"</extension>";
			var extension = new sbgnjs.Extension.fromXML(xml);
			extension.should.be.instanceOf(sbgnjs.Extension);
			extension.has('renderInformation').should.equal(true);

			var renderInfo = extension.get('renderInformation');
			renderInfo.should.be.instanceOf(renderExt.RenderInformation);
			renderInfo.listOfColorDefinitions.should.be.instanceOf(renderExt.ListOfColorDefinitions);
			renderInfo.listOfStyles.should.be.instanceOf(renderExt.ListOfStyles);

			var listOfColors = renderInfo.listOfColorDefinitions;
			listOfColors.colorDefinitions.should.have.lengthOf(2);
			var c1 = listOfColors.colorDefinitions[0];
			c1.should.be.instanceOf(renderExt.ColorDefinition);
			c1.id.should.equal('color_1');
			c1.value.should.equal('#ffffff7f');

			var styles = renderInfo.listOfStyles.styles;
			styles.should.have.lengthOf(1);
			styles[0].should.be.instanceOf(renderExt.Style);
			styles[0].id.should.equal('nodeffffff0.55553.2511normalnormalHelvetica');
			styles[0].renderGroup.should.be.instanceOf(renderExt.RenderGroup);
			styles[0].renderGroup.fontSize.should.equal(14);
		});
	});

	describe('different namespace', function () {
    it('should parse attributes', function () {
      var renderInfo = renderExt.RenderInformation.fromXML("<ns2:renderInformation " +
        "ns2:id='a' ns2:name='name' ns2:programName='prog' " +
        "ns2:programVersion='2.0.1a' ns2:backgroundColor='#FFFFFF'>" +
        "</ns2:renderInformation>");
      should.exist(renderInfo.id);
      renderInfo.id.should.equal('a');
      should.exist(renderInfo.name);
      renderInfo.name.should.equal('name');
      should.exist(renderInfo.programName);
      renderInfo.programName.should.equal('prog');
      should.exist(renderInfo.programVersion);
      renderInfo.programVersion.should.equal('2.0.1a');
      should.exist(renderInfo.backgroundColor);
      renderInfo.backgroundColor.should.equal('#FFFFFF');
    });
    it('should parse listOfColorDefinitions', function () {
      var xml =
        "<ns2:renderInformation>" +
        "<ns2:listOfColorDefinitions>" +
        "<ns2:colorDefinition ns2:id='color_1' ns2:value='#ffffff7f' />" +
        "<ns2:colorDefinition ns2:id='color_2' ns2:value='#555555' />" +
        "</ns2:listOfColorDefinitions>" +
        "</ns2:renderInformation>";
      var renderInfo = renderExt.RenderInformation.fromXML(xml);

      renderInfo.should.be.instanceOf(renderExt.RenderInformation);
      renderInfo.listOfColorDefinitions.should.be.instanceOf(renderExt.ListOfColorDefinitions);

      var listOfColors = renderInfo.listOfColorDefinitions;
      listOfColors.colorDefinitions.should.have.lengthOf(2);
      var c1 = listOfColors.colorDefinitions[0];
      c1.should.be.instanceOf(renderExt.ColorDefinition);
      c1.id.should.equal('color_1');
      c1.value.should.equal('#ffffff7f');

    });
    it('should parse listOfStyles', function () {
      var xml = "<ns2:renderInformation>" +
        "<ns2:listOfStyles>" +
        "<ns2:style ns2:id='xxx' ns2:idList='_82f19e9e-6aa2-42b3-8b5e-8cee17197085'>" +
        "<ns2:g ns2:fontSize='14' ns2:fontFamily='Helvetica' ns2:fontWeight='normal' ns2:fontStyle='normal' ns2:strokeWidth='3.25' />" +
        "</ns2:style>" +
        "</ns2:listOfStyles>" +
        "</ns2:renderInformation>";

      var renderInfo = renderExt.RenderInformation.fromXML(xml);

      var styles = renderInfo.listOfStyles.styles;
      styles.should.have.lengthOf(1);
      styles[0].should.be.instanceOf(renderExt.Style);
      styles[0].id.should.equal('xxx');
      styles[0].renderGroup.should.be.instanceOf(renderExt.RenderGroup);
      styles[0].renderGroup.fontSize.should.equal(14);
    });

  });

});