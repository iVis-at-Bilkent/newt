var N3 = require('n3');

var ns = {};

ns.prefixes = {	rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
			    bqmodel: "http://biomodels.net/model-qualifiers/",
			    bqbiol: "http://biomodels.net/biology-qualifiers/",
			    sio: "http://semanticscience.org/resource/",
			    eisbm: "http://www.eisbm.org/"};

// pure shortcut function
ns.expandPrefix = function(prefix) {
	return N3.Util.expandPrefixedName(prefix, ns.prefixes)
};

// commonly used strings
str_sio223 = "sio:SIO_000223";
str_sio223exp = ns.expandPrefix(str_sio223);
str_sio116 = "sio:SIO_000116";
str_sio116exp = ns.expandPrefix(str_sio116);
str_rdfvalue = "rdf:value";
str_rdfvalueexp = ns.expandPrefix(str_rdfvalue);
str_rdftype = "rdf:type";
str_rdftypeexp = ns.expandPrefix(str_rdftype);
str_rdfbag = "rdf:Bag";
str_rdfbagexp = ns.expandPrefix(str_rdfbag);

controlledVocabularyList = [
	"bqmodel:is",
	"bqmodel:isDerivedFrom",
	"bqmodel:isDescribedBy",
	"bqmodel:isInstanceOf",
	"bqmodel:hasInstance",

	"bqbiol:is",
	"bqbiol:encodes",
	"bqbiol:hasPart",
	"bqbiol:hasProperty",
	"bqbiol:hasVersion",
	"bqbiol:isDescribedBy",
	"bqbiol:isEncodedBy",
	"bqbiol:isHomologTo",
	"bqbiol:isPartOf",
	"bqbiol:isPropertyOf",
	"bqbiol:isVersionOf",
	"bqbiol:occursIn",
	"bqbiol:hasTaxon",

	"sio:SIO_000223"
];

ns.isControlledVocabulary = {};
for(var i=0; i<controlledVocabularyList.length; i++) {
	var term = controlledVocabularyList[i];
	ns.isControlledVocabulary[ns.expandPrefix(term)] = true;
}

ns.reducePrefix = function (expandedString) {
	for (var key in ns.prefixes) {
		var completePrefix = ns.prefixes[key];
		if (expandedString.startsWith(completePrefix)) {
			return expandedString.replace(completePrefix, key+':');
		}
	}
	// no prefix could be recognized
	return expandedString;
};

ns.getCustomPropertiesOfId = function (graph, id) {
	var kvresult = {};
	//console.log(graph.getTriples());
	var propBags = graph.getTriples(id, str_sio223, null);
	//console.log(propBags);
	for(var i=0; i<propBags.length; i++) {
		var propBag = propBags[i].object;
		//console.log(propBag);
		var propertyContainers = graph.getTriples(propBag, null, null);
		//console.log(propertyContainers);
		for(var j=0; j<propertyContainers.length; j++) {
			var propertyContainer = propertyContainers[j].object;
			if(propertyContainer == str_rdfbagexp) {
				continue;
			}
			//console.log("container", propertyContainer);
			var value = graph.getObjects(propertyContainer, str_rdfvalueexp, null)[0];
			value = N3.Util.getLiteralValue(value);
			var key = graph.getObjects(propertyContainer, str_sio116exp, null)[0];
			key = N3.Util.getLiteralValue(key);
			//console.log(key, value);
			kvresult[key] = value;
		}
	}
	return kvresult;
};

ns.getAllIds = function (graph) {
	var result = [];
	var all = graph.getSubjects();
	//console.log(graph.getTriples());
	//console.log(all);
	for(var i=0; i<all.length; i++) {
		if(! N3.Util.isBlank(all[i])) {
			var subject = all[i]; // potential IDs
			// now check if they aren't used as object of other triples
			var idAsObject = graph.countTriples(null, null, subject);
			if (idAsObject == 0) { // nothing is over this id, true id
				result.push(subject);
			}
		}
	}
	return result;
};

/**
 * will add triples to represent key/value properties attached to the id
 * kvObject can have one or multiple properties
 */
ns.addCustomProperty = function (graph, id, kvObject) {
	var sio223Element = ns.getRelationship(graph, id, str_sio223)[0]; // doesn't matter if more than one
	//console.log("add kv to", hasPropElement);
	for(var key in kvObject) {
		// using elemnt count as index may be dangerous if previous manipulation of
		// the elements has happened. Like removing one. 
		var propIndex = ns.countBagElements(graph, sio223Element) + 1;
		//console.log("elements in bag:", propIndex);
		var newBlank = graph.createBlankNode();
		//console.log("expand list element", ns.expandPrefix("rdf:_"+propIndex));
		graph.addTriple(sio223Element, ns.expandPrefix("rdf:_"+propIndex), newBlank);
		graph.addTriple(newBlank, str_sio116exp, N3.Util.createLiteral(key));
		graph.addTriple(newBlank, str_rdfvalueexp, N3.Util.createLiteral(kvObject[key]));
		//console.log("added", key, kvObject[key]);
	}
};

ns.hasRelationship = function (graph, id, relationship) {
	var countProp = graph.countTriples(id, relationship, null);
	return countProp > 0;
};

ns.countBagElements = function(graph, subject) {
	return graph.countTriples(subject, null, null) - 1;
};

ns.getResourcesOfId = function(graph, id) {
	var result = {};
	graph.forEach(function(init_triple){ // iterate over all id relationships
		// we want everything that is not a simpel key/value property
		if(init_triple.predicate != str_sio223exp) {
			var relation = init_triple.predicate;
			// initialize relation array if never encountered before
			if(!result.hasOwnProperty(relation)) {
				result[relation] = [];
			}

			// if multiple resources specified, or a single element with several attributes,
			// blank node is involved, possibly with a bag attribute
			if(N3.Util.isBlank(init_triple.object)) {
				var resourceContainer = init_triple.object;
				graph.forEach(function(triple){ // iterate over the elements of the relationship
					// relationship may be a bag, and thus contains undesirable rdf:type bag line
					if(triple.object != str_rdfbagexp) {
						var resource = triple.object;
						result[relation].push(resource);
					}
				}, resourceContainer, null, null);
			}
			else { 
				// simple case, no bag, only 1 resource is linked with 1 attribute
				var resource = init_triple.object;
				result[relation].push(resource);
			}
		}
	}, id, null, null);
	return result;
};

/**
 * returns the id of a newly created blank node representing the HasProperty predicate
 * if one already exists, returns its id
 * returns array, potentially several SIO223 present
 */
ns.getRelationship = function (graph, id, relationship) {
	if (ns.hasRelationship(graph, id, relationship)) {
		var object = graph.getObjects(id, relationship, null)[0]; // careful here
		if (!N3.Util.isBlank(object)){
			// object of relationship isn't a bag. Need to turn it into a bag.
			var newBag = ns.createBag(graph, id, relationship);
			graph.addTriple(id, relationship, newBag);
			graph.addTriple(newBag, ns.expandPrefix("rdf:_1"), object);
			return [newBag];
		}
		else {
			return graph.getObjects(id, relationship, null);
		}
	}
	else {
		return [ns.createBag(graph, id, relationship)];
	}
};

ns.createBag = function (graph, id, relationship) {
	var newBlank = graph.createBlankNode();
	graph.addTriple(id, ns.expandPrefix(relationship), newBlank);
	graph.addTriple(newBlank, str_rdftypeexp, str_rdfbagexp);
	return newBlank;
};

/**
 * kvobject contains biology qualifier as key and miriam resource as value
 */
ns.addResource = function (graph, id, kvObject) {
	for(var relation in kvObject) {
		//console.log("relation", relation);
		var relationElement = ns.getRelationship(graph, id, relation)[0]; // doesn't matter if more than one
		//console.log("after get relation",relationElement, graph.getTriples(id, relation));
		//console.log("after get realtion", graph.getTriples());
		// using elemnt count as index may be dangerous if previous manipulation of
		// the elements has happened. Like removing one. 
		var propIndex = ns.countBagElements(graph, relationElement) + 1;
		//console.log("elements in bag:", propIndex);
		//console.log("new blank node", graph.getTriples());
		//console.log("Will add", relationElement, ns.expandPrefix("rdf:_"+propIndex), kvObject[relation]);
		graph.addTriple(relationElement, ns.expandPrefix("rdf:_"+propIndex), kvObject[relation]);
		//console.log("end result", graph.getTriples());
		//console.log("added", relation, kvObject[relation]);
	}
};

module.exports = ns;