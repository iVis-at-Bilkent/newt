'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Node = require('./node');

var Statement = function () {
  function Statement(subject, predicate, object, graph) {
    _classCallCheck(this, Statement);

    this.subject = Node.fromValue(subject);
    this.predicate = Node.fromValue(predicate);
    this.object = Node.fromValue(object);
    this.why = graph; // property currently used by rdflib
  }

  _createClass(Statement, [{
    key: 'equals',
    value: function equals(other) {
      return other.subject.equals(this.subject) && other.predicate.equals(this.predicate) && other.object.equals(this.object) && other.graph.equals(this.graph);
    }
  }, {
    key: 'substitute',
    value: function substitute(bindings) {
      var y = new Statement(this.subject.substitute(bindings), this.predicate.substitute(bindings), this.object.substitute(bindings), this.why.substitute(bindings)); // 2016
      console.log('@@@ statement substitute:' + y);
      return y;
    }
  }, {
    key: 'toCanonical',
    value: function toCanonical() {
      var terms = [this.subject.toCanonical(), this.predicate.toCanonical(), this.object.toCanonical()];
      if (this.graph && this.graph.termType !== 'DefaultGraph') {
        terms.push(this.graph.toCanonical());
      }
      return terms.join(' ') + ' .';
    }
  }, {
    key: 'toNT',
    value: function toNT() {
      return [this.subject.toNT(), this.predicate.toNT(), this.object.toNT()].join(' ') + ' .';
    }
  }, {
    key: 'toString',
    value: function toString() {
      return this.toNT();
    }
  }, {
    key: 'graph',
    get: function get() {
      return this.why;
    },
    set: function set(g) {
      this.why = g;
    }
  }]);

  return Statement;
}();

module.exports = Statement;