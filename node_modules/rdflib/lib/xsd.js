'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var NamedNode = require('./named-node');

var XSD = function XSD() {
  _classCallCheck(this, XSD);
};

XSD.boolean = new NamedNode('http://www.w3.org/2001/XMLSchema#boolean');
XSD.dateTime = new NamedNode('http://www.w3.org/2001/XMLSchema#dateTime');
XSD.decimal = new NamedNode('http://www.w3.org/2001/XMLSchema#decimal');
XSD.double = new NamedNode('http://www.w3.org/2001/XMLSchema#double');
XSD.integer = new NamedNode('http://www.w3.org/2001/XMLSchema#integer');
XSD.langString = new NamedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#langString');
XSD.string = new NamedNode('http://www.w3.org/2001/XMLSchema#string');

module.exports = XSD;