/**
 * This module is responsible for managing annotations of elements, passing the data to the backbone view,
 * validating them.
 * Annotations are attached to elements through data('annotations'), which contains a list of objects.
 */

var jquery = $ = require('jquery');
var AnnotationListView = require('./backbone-views').AnnotationListView;
var AnnotationElementView = require('./backbone-views').AnnotationElementView;
var Backbone = require('backbone');
/*var localStorage = require('backbone.localstorage');
var LocalStorage = localStorage.LocalStorage;*/

var ns = {};

var prefixes = {	rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
				    bqmodel: "http://biomodels.net/model-qualifiers/",
				    bqbiol: "http://biomodels.net/biology-qualifiers/",
				    sio: "http://semanticscience.org/resource/"};

var identifiersURL = "http://identifiers.org/";
var validateRESTURL = "http://identifiers.org/rest/identifiers/validate/";

ns.vocabulary = {
	// bqmodel
	"bqmodel:is": {
		label: "bqmodel:is",
		controlled: true,
		description: 	"The modelling object represented by the model element is identical with "+
						"the subject of the referenced resource. "+
						"For instance, this qualifier might be used to link an encoded model "+
						"to a database of models."
	},
	"bqmodel:isDerivedFrom": {
		label: "bqmodel:isDerivedFrom",
		controlled: true,
		description: 	"The modelling object represented by the model element is derived from the "+
						"modelling object represented by the referenced resource. This relation may "+
						"be used, for instance, to express a refinement or adaptation in usage for a "+
						"previously described modelling component."
	},
	"bqmodel:isDescribedBy": {
		label: "bqmodel:isDescribedBy",
		controlled: true,
		description: 	"The modelling object represented by the model element is described by "+
						"the subject of the referenced resource. This relation might be used to "+
						"link a model or a kinetic law to the literature that describes it."
	},
	"bqmodel:isInstanceOf": {
		label: "bqmodel:isInstanceOf",
		controlled: true,
		description: 	"The modelling object represented by the model element is an instance of "+
						"the subject of the referenced resource. For instance, this qualifier "+
						"might be used to link a specific model with its generic form."
	},
	"bqmodel:hasInstance": {
		label: "bqmodel:hasInstance",
		controlled: true,
		description: 	"The modelling object represented by the model element has for instance "+
						"(is a class of) the subject of the referenced resource. For instance, "+
						"this qualifier might be used to link a generic model with its specific "+
						"forms."
	},

	// bqbiol
	"bqbiol:is": {
		label: "bqbiol:is",
		controlled: true,
		description: 	"The biological entity represented by the model element has identity with "+
						"the subject of the referenced resource. This relation might be used to "+
						"link a reaction to its exact counterpart in a database, for instance."
	},
	"bqbiol:encodes": {
		label: "bqbiol:encodes",
		controlled: true,
		description: 	"The biological entity represented by the model element encodes, directly "+
						"or transitively, the subject of the referenced resource. "+
						"This relation may be used to express, for example, that a "+
						"specific DNA sequence encodes a particular protein."
	},
	"bqbiol:hasPart": {
		label: "bqbiol:hasPart",
		controlled: true,
		description: 	"The biological entity represented by the model element includes the "+
						"subject of the referenced resource, either physically or logically. This "+
						"relation might be used to link a complex to the description of its "+
						"components."
	},
	"bqbiol:hasProperty": {
		label: "bqbiol:hasProperty",
		controlled: true,
		description: 	"The subject of the referenced resource is a property of the biological "+
						"entity represented by the model element. This relation might be used "+
						"when a biological entity exhibits a certain enzymatic activity or exerts "+
						"a specific function."
	},
	"bqbiol:hasVersion": {
		label: "bqbiol:hasVersion",
		controlled: true,
		description: 	"The subject of the referenced resource is a version or an instance of "+
						"the biological entity represented by the model element. This relation "+
						"may be used to represent an isoform or modified form of a biological "+
						"entity. "
	},
	"bqbiol:isDescribedBy": {
		label: "bqbiol:isDescribedBy",
		controlled: true,
		description: 	"The biological entity represented by the model element is described by "+
						"the subject of the referenced resource. This relation should be used, "+
						"for instance, to link a species or a parameter to the literature that "+
						"describes the concentration of that species or the value of that parameter."
	},
	"bqbiol:isEncodedBy": {
		label: "bqbiol:isEncodedBy",
		controlled: true,
		description: 	"The biological entity represented by the model element is encoded, "+
						"directly or transitively, by the subject of the referenced resource. "+
						"This relation may be used to express, for example, that a protein is "+
						"encoded by a specific DNA sequence."
	},
	"bqbiol:isHomologTo": {
		label: "bqbiol:isHomologTo",
		controlled: true,
		description: 	"The biological entity represented by the model element is homologous to "+
						"the subject of the referenced resource. This relation can be used to "+
						"represent biological entities that share a common ancestor."
	},
	"bqbiol:isPartOf": {
		label: "bqbiol:isPartOf",
		controlled: true,
		description: 	"The biological entity represented by the model element is a physical or "+
						"logical part of the subject of the referenced resource. This relation "+
						"may be used to link a model component to a description of the complex "+
						"in which it is a part."
	},
	"bqbiol:isPropertyOf": {
		label: "bqbiol:isPropertyOf",
		controlled: true,
		description: 	"The biological entity represented by the model element is a property of "+
						"the referenced resource."
	},
	"bqbiol:isVersionOf": {
		label: "bqbiol:isVersionOf",
		controlled: true,
		description: 	"The biological entity represented by the model element is a version or "+
						"an instance of the subject of the referenced resource. This relation may "+
						"be used to represent, for example, the 'superclass' or 'parent' form of "+
						"a particular biological entity."
	},
	"bqbiol:occursIn": {
		label: "bqbiol:occursIn",
		controlled: true,
		description: 	"The biological entity represented by the model element is physically "+
						"limited to a location, which is the subject of the referenced resource. "+
						"This relation may be used to ascribe a compartmental location, within "+
						"which a reaction takes place."
	},
	"bqbiol:hasTaxon": {
		label: "bqbiol:hasTaxon",
		controlled: true,
		description: 	"The biological entity represented by the model element is taxonomically "+
						"restricted, where the restriction is the subject of the referenced "+
						"resource. This relation may be used to ascribe a species restriction "+
						"to a biochemical reaction."
	},

	// other
	"sio:SIO_000223": {
		label: "Has custom property",
		controlled: false,
		description: 	"Attach a custom property to the entity. You can freely specify the name "+
						"and value of the property in the following fields. None of the two fields "+
						"will be checked for validation."
	}

};

ns.dbList = {
	chebi: {
		id: "chebi",
		label: "ChEBI"
	},
	pubmed: {
		id: "pubmed",
		label: "PubMed"
	},
	hgnc: {
		id: "hgnc",
		label: "HGNC"
	},
	ncbigene: { // Entrez
		id: "ncbigene",
		label: "NCBI Gene"
	},
	uniprot: {
		id: "uniprot",
		label: "UniProtKB"
	},
	reactome: {
		id: "reactome",
		label: "Reactome"
	},
	go: {
		id: "go",
		label: "Gene Ontology"
	},
	ec: {
		id: "ec-code",
		label: "Enzyme Nomenclature"
	},
	interpro: {
		id: "interpro",
		label: "InterPro"
	},
	pubchem: {
		id: "pubchem.compound",
		label: "PubChem-compound"
	},
	mesh: {
		id: "mesh",
		label: "MeSH"
	},
	wikipathways: {
		id: "wikipathways",
		label: "WikiPathways"
	},
	kegg: {
		id: "kegg",
		label: "KEGG"
	}
};

ns.expandPrefix = function (string) {
	for(var prefix in prefixes) {
		if(string.startsWith(prefix)) {
			return string.replace(new Regexp(prefix+':'), prefixes[prefix]);
		}
	}
	return string;
};

ns.fillAnnotationsContainer = function (element) {

	/*var element = new AnnotationElementView({model: {vocabulary: vocabulary, dbList: dbList, status: "validated", index: 0}});
	var element2 = new AnnotationElementView({model: {vocabulary: vocabulary, dbList: dbList, status: "error", index: 1}});

	var info = new AnnotationListView({
		el: '#annotations-container',
		model: {elements: [element, element2]}
	}).render();*/
	//$('#annotations-container').html("<span>"+ns.getElementAnnotations(element)+"</span>");

	var annotationsModel;
	if(element.data('annotationsModel')) {
		console.log("get previous model");
		annotationsModel = element.data('annotationsModel');
	}
	else {
		console.log("create new model");
		annotationsModel = new ns.AnnotationList([], {cyParent: element});
		element.data('annotationsModel', annotationsModel);
	}
	var listView = new AnnotationListView({model: annotationsModel});

	//test validation
	//ns.validateAnnotation("pubmed", "163333295");
	//ns.validateAnnotation("uniprot", "62158");
};

ns.getElementAnnotations = function(element) {
	var annotations = element.data('annotations');
	return annotations ? annotations : {};
};

ns.validateAnnotation = function(dbKey, resourceID, callback) {
	console.log("validate", dbKey, resourceID);

	function testURL(url, callback) {
		$.ajax({
			type: 'get',
			url: "/utilities/testURL",
			data: {url: url},
			success: function(data){
				console.log("validation resource", data);
				// here we can get 404 as well, for example, so there are still error cases to handle
				if (data.response.statusCode == 200) {
					callback(null, url);
				}
				else {
					callback(new Error("Testing availability of url "+url+" failed. Request status: "+data.response.statusCode+" Error: "+data.error));
				}
			},
			error: function(jqXHR, status, error) {
				console.log("could not validate resource", status, error);
				callback(new Error("Testing availability of url "+url+" failed. Request status: "+status+" Error: "+error));
			}
	    });
	}

	if(resourceID.startsWith("http://identifiers.org/")) {
		testURL(resourceID, callback);
	}
	else {
		var validateURL = ns.IDToValidateURL(dbKey, resourceID);
		console.log("URL", validateURL);
		// validate url syntax
		$.ajax({ 
			type: "GET",
			dataType: "json",
			url: validateURL,
			success: function(data){
				console.log("validated syntax", data);
				// validate url content
			    testURL(ns.IDToRetrieveURL(dbKey, resourceID), callback);
			},
			error: function(jqXHR, status, error) {
				console.log("could not validate", status, error);
				callback(new Error("Validating syntax of url "+validateURL+" failed. Request status: "+status+" Error: "+error));
			}
		});
	}
};

ns.IDToValidateURL = function (dbKey, id) {
	var dbID = ns.dbList[dbKey].id;
	console.log("transform to URL", dbID, id);
	return validateRESTURL + dbID + ":" + id;
};

ns.IDToRetrieveURL = function (dbKey, id) {
	var dbID = ns.dbList[dbKey].id;
	console.log("transform to retrieveURL", dbID, id);
	return identifiersURL + dbID + "/" + id;
};

/*ns.getResourceAccessURL = function (miriamID, resourceID) {
	var identifierResourceURL = "http://identifiers.org/rest/resources/";
	var url = identifierResourceURL + miriamID;
	$.ajax({
		type: "GET",
		dataType: "json",
		url: url,
		success: function(data){
			console.log("resource data", data);
			var retrievableURL = data.accessURL.replace(/\$id/, resourceID);
			console.log("end URL", retrievableURL);
			ns.testURL(retrievableURL);
		},
		error: function(jqXHR, status, error) {
			console.log("could not get resource data", status, error);
		}
	});
};

ns.testURL = function (url) {
	// retrieve URL to check that content exists
	$.ajax({
		type: "GET",
		dataType: "html",
		url: url,
		success: function(data){
			console.log("retrieve", data);
		},
		error: function(jqXHR, status, error) {
			console.log("could not retrieve", status, error);
		}
	});
};*/

/* <******* backbone part *******> */

ns.Annotation = Backbone.Model.extend({
	defaults: {
		status: "unchecked",
		selectedDB: "chebi", // db selected if under controlled vocabulary
		selectedRelation: "bqmodel:is", // vocabulary choice
		annotationValue: null, // the identifiers or value of the key-value property
		annotationKey: null, // the key if key-value property is chosen
		cyParent: null,
		validateAnnotation: ns.validateAnnotation
	},
	/**
	 *	Here we override the default backbone's behavior to store the model in data('annotations')
	 *	property of each concerned cytoscape element
	 */
	sync: function(method, model, options) {
		switch(method) {
			case 'delete':
				console.log("delete");
				delete model.get('cyParent').data('annotations')[model.cid];
				break;
			case 'read':
				console.log("read");
				var annotationData = model.get('cyParent').data('annotations')[model.cid];
				model.set('status', annotationData.status);
				model.set('selectedDB', annotationData.selectedDB);
				model.set('selectedRelation', annotationData.selectedRelation);
				model.set('annotationValue', annotationData.annotationValue);
				model.set('annotationKey', annotationData.annotationKey);
				break;
			case 'update':
				console.log("update", options);
				model.get('cyParent').data('annotations')[model.cid] = model.toJSON();
				break;
			case 'create':
				console.log("create model", model, options);
				console.log("whitelist attributes", ns.Annotation.stringifiableAttr);
				if(!model.get('cyParent').data('annotations')) {
					model.get('cyParent').data('annotations', {}); // ensure annotations has been init
				}
				model.get('cyParent').data('annotations')[model.cid] = model.toJSON();
				model.set('id', model.get('cyParent').data('id')+'-annot-'+model.collection.indexOf(model));
				//JSON.parse(JSON.stringify(model, ns.Annotation.stringifiableAttr));
				break;
		}
	}
}, {
	dbList: ns.dbList,
	vocabulary: ns.vocabulary,
	stringifiableAttr: ['status', 'selectedDB', 'selectedRelation', 'annotationValue', 'annotationKey']
});

ns.AnnotationList = Backbone.Collection.extend({
	model: ns.Annotation,
	initialize: function(models, options) {
		options || (options = {});
        if (options.cyParent) {
            this.cyParent = options.cyParent;
        };
	}
});



module.exports = ns;