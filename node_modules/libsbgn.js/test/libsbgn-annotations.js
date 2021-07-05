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

describe('libsbgn-annotations', function() {
	describe('utilities', function () {
		var simplest, empty, emptyDescription, emptyRelation, emptyBag, inline;
		var doubleDescription, doubleRelation;
		var testID = "http://local/anID000001";
		var testID2 = "http://local/anID000002";
		var testRelation = "http://biomodels.net/model-qualifiers/is";
		var testRelation2 = "http://biomodels.net/model-qualifiers/has";
		var testObject = "http://identifiers.org/biomodels.db/BIOMD0000000004";
		var testObject2 = "http://identifiers.org/biomodels.db/BIOMD0000000005";
		var header = 
					'<annotation>'+
					'<rdf:RDF '+
					'xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" '+
				    'xmlns:bqmodel="http://biomodels.net/model-qualifiers/">';
		var footer = '</rdf:RDF></annotation>';
		var headerRDF = '<rdf:RDF '+
					'xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" '+
				    'xmlns:bqmodel="http://biomodels.net/model-qualifiers/">';
		var footerRDF = '</rdf:RDF>';
		var simplestString =
					'<rdf:Description rdf:about="http://local/anID000001">'+
						'<bqmodel:is>'+
							'<rdf:Bag>'+
								'<rdf:li rdf:resource="http://identifiers.org/biomodels.db/BIOMD0000000004" />'+
							'</rdf:Bag>'+
						'</bqmodel:is>'+
					'</rdf:Description>';
		var emptyDescriptionString =
					'<rdf:Description rdf:about="http://local/anID000001">'+
					'</rdf:Description>';
		var emptyRelationString =
					'<rdf:Description rdf:about="http://local/anID000001">'+
					'<bqmodel:is>'+
					'</bqmodel:is>' +
					'</rdf:Description>';
		var emptyBagString =
					'<rdf:Description rdf:about="http://local/anID000001">'+
					'<bqmodel:is>'+
					'<rdf:Bag>'+
					'</rdf:Bag>'+
					'</bqmodel:is>'+
					'</rdf:Description>';
		var inlineString =
					'<rdf:Description rdf:about="http://local/anID000001">'+
						'<bqmodel:is rdf:resource="http://identifiers.org/biomodels.db/BIOMD0000000004" />'+
					'</rdf:Description>';
		var doubleDescriptionString = simplestString +
					'<rdf:Description rdf:about="http://local/anID000002">'+
						'<bqmodel:is>'+
							'<rdf:Bag>'+
								'<rdf:li rdf:resource="http://identifiers.org/biomodels.db/BIOMD0000000005" />'+
							'</rdf:Bag>'+
						'</bqmodel:is>'+
					'</rdf:Description>';
		var doubleRelationString =
					'<rdf:Description rdf:about="http://local/anID000001">'+
						'<bqmodel:is>'+
							'<rdf:Bag>'+
								'<rdf:li rdf:resource="http://identifiers.org/biomodels.db/BIOMD0000000004" />'+
							'</rdf:Bag>'+
						'</bqmodel:is>'+
						'<bqmodel:has>'+
							'<rdf:Bag>'+
								'<rdf:li rdf:resource="http://identifiers.org/biomodels.db/BIOMD0000000005" />'+
							'</rdf:Bag>'+
						'</bqmodel:has>'+
					'</rdf:Description>';


		beforeEach('build necessary RDF store from different test inputs', function() {
			simplest = annot.Annotation.fromXML(header+simplestString+footer);
			empty = annot.Annotation.fromXML(header+footer).rdfElement;
			emptyDescription = annot.Annotation.fromXML(header+emptyDescriptionString+footer).rdfElement;
			emptyRelation = annot.Annotation.fromXML(header+emptyRelationString+footer).rdfElement;
			emptyBag = annot.Annotation.fromXML(header+emptyBagString+footer).rdfElement;
			inline = annot.Annotation.fromXML(header+inlineString+footer).rdfElement;
			doubleDescription = annot.Annotation.fromXML(header+doubleDescriptionString+footer).rdfElement;
			doubleRelation = annot.Annotation.fromXML(header+doubleRelationString+footer).rdfElement;

		});

		it('should parse and write xml as is, ignore white space', function(){
			simplest.toXML().should.equalIgnoreSpaces("<annotation>"+headerRDF+simplestString+footerRDF+"</annotation>");
			empty.toXML().should.equalIgnoreSpaces('<rdf:RDF '+
					'xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" ></rdf:RDF>');
			emptyDescription.toXML().should.equalIgnoreSpaces('<rdf:RDF '+
					'xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" ></rdf:RDF>');
			emptyRelation.toXML().should.equalIgnoreSpaces(headerRDF+emptyRelationString+footerRDF);
			emptyBag.toXML().should.equalIgnoreSpaces(headerRDF+emptyBagString+footerRDF);
			inline.toXML().should.equalIgnoreSpaces(headerRDF+inlineString+footerRDF);
		});

		describe('getAllIds', function() {
			it('should return empty list if no ids', function() {
				empty.getAllIds().should.deep.equal([]);
				emptyDescription.getAllIds().should.deep.equal([]);
			});
			it('should return array of ids if elements are present', function() {
				simplest.rdfElement.getAllIds().should.deep.equal([testID]);
				emptyRelation.getAllIds().should.deep.equal([testID]);
				emptyBag.getAllIds().should.deep.equal([testID]);
				inline.getAllIds().should.deep.equal([testID]);
				var doubleRes = doubleDescription.getAllIds();
				doubleRes.should.include(testID);
				doubleRes.should.include(testID2);
			});
		});
		describe('getResourcesOfId', function() {
			it('should return empty list if no resources', function() {
				empty.getResourcesOfId(testID).should.deep.equal({});
				emptyDescription.getResourcesOfId(testID).should.deep.equal({});
			});
			it('should return a single property if only one relation', function() {
				var res = simplest.rdfElement.getResourcesOfId(testID);
				res.should.have.ownProperty(testRelation);
				res[testRelation].should.deep.equal([testObject]);
				//emptyDescription.getResourcesOfId(testID).should.deep.equal({});
			});
		});
	});


	/*it('test', function() {
		var annot = require('../src/libsbgn-annotations');
		// SIO has property !!  "http://semanticscience.org/resource/SIO_000223"
		// SIO name SIO_000116 + rdf:value
		var input1 = '<annotation><rdf:RDF '+
		'xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" '+
	    'xmlns:bqmodel="http://biomodels.net/model-qualifiers/" '+
	    'xmlns:bqbiol="http://biomodels.net/biology-qualifiers/" '+
	    'xmlns:sio="http://semanticscience.org/resource/"> '+
		'<rdf:Description rdf:about="http://local/anID000001">  '+
		'	<bqmodel:is> '+
		'		<rdf:Bag> '+
		'			<rdf:li rdf:resource="http://identifiers.org/biomodels.db/BIOMD0000000004" /> '+
		'		</rdf:Bag> '+
		'	</bqmodel:is> '+

'			<bqmodel:isDescribedBy> '+
'				<rdf:Bag> '+
'					<rdf:li rdf:resource="http://identifiers.org/pubmed/1833774" /> '+
'			</rdf:Bag> '+
'			</bqmodel:isDescribedBy> '+

'			<sio:SIO_000223> '+
	'			<rdf:Bag> '+
	'					<rdf:li sio:SIO_000116="data" rdf:value="42" /> '+
	'					<rdf:li sio:SIO_000116="data2" rdf:value="1.23" /> '+
'				</rdf:Bag> '+
'			</sio:SIO_000223> '+

'		</rdf:Description> '+
'	</rdf:RDF></annotation>';
		var input2 = '<annotation><rdf:RDF '+
		'xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" '+
	    'xmlns:bqmodel="http://biomodels.net/model-qualifiers/" '+
	    'xmlns:bqbiol="http://biomodels.net/biology-qualifiers/" '+
	    'xmlns:sio="http://semanticscience.org/resource/"> '+
		'<rdf:Description rdf:about="http://local/anID000002">  '+
		'	<bqmodel:is> '+
		'		<rdf:Bag> '+
		'			<rdf:li rdf:resource="http://identifiers.org/biomodels.db/BIOMD00000000115" /> '+
		'		</rdf:Bag> '+
		'			<rdf:li rdf:resource="http://identifiers.org/biomodels.db/BIOMD00000000115" /> '+
		'	</bqmodel:is> '+
		'<bqmodel:is rdf:resource="http://identifiers.org/biomodels.db/BIOMD00000000115" /> '+

'			<bqmodel:isDescribedBy> '+
'				<rdf:Bag> '+
'					<rdf:li rdf:resource="http://identifiers.org/pubmed/PUBMEDID" /> '+
'			</rdf:Bag> '+
'			</bqmodel:isDescribedBy> '+

'			<sio:SIO_000223> '+
	'			<rdf:Bag> '+
	'					<rdf:li sio:SIO_000116="myConstant" rdf:value="42" /> '+
	'					<rdf:li sio:SIO_000116="aProp" rdf:value="123.456" /> '+
'				</rdf:Bag> '+
'			</sio:SIO_000223> '+

'		</rdf:Description> '+
'	</rdf:RDF></annotation>';
		//console.log(input);
		var annotation = annot.Annotation.fromXML(getXmlObj(input1));
		var annotation2 = annot.Annotation.fromXML(getXmlObj(input2));
		var globalStore = new annot.GlobalRdfStore();
		globalStore.load([annotation, annotation2]);
		//console.log(annotation.toXML());
		var rdf = annotation.rdfElements[0];
		//console.log(rdf.toXML());
		
		//rdf.test();
		//globalStore.test();

	});*/
});
