'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var ClassOrder = require('./class-order');
var Node = require('./node');
var Uri = require('./uri');

/**
 * Variables are placeholders used in patterns to be matched.
 * In cwm they are symbols which are the formula's list of quantified variables.
 * In sparql they are not visibly URIs.  Here we compromise, by having
 * a common special base URI for variables. Their names are uris,
 * but the ? notation has an implicit base uri of 'varid:'
 * @class Variable
 */

var Variable = function (_Node) {
  _inherits(Variable, _Node);

  function Variable() {
    var name = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

    _classCallCheck(this, Variable);

    var _this = _possibleConstructorReturn(this, (Variable.__proto__ || Object.getPrototypeOf(Variable)).call(this));

    _this.termType = Variable.termType;
    _this.value = name;
    _this.base = 'varid:';
    _this.uri = Uri.join(name, _this.base);
    return _this;
  }

  _createClass(Variable, [{
    key: 'equals',
    value: function equals(other) {
      if (!other) {
        return false;
      }
      return this.termType === other.termType && this.value === other.value;
    }
  }, {
    key: 'hashString',
    value: function hashString() {
      return this.toString();
    }
  }, {
    key: 'substitute',
    value: function substitute(bindings) {
      var ref;
      return (ref = bindings[this.toNT()]) != null ? ref : this;
    }
  }, {
    key: 'toString',
    value: function toString() {
      if (this.uri.slice(0, this.base.length) === this.base) {
        return '?' + this.uri.slice(this.base.length);
      }
      return '?' + this.uri;
    }
  }]);

  return Variable;
}(Node);

Variable.termType = 'Variable';
Variable.prototype.classOrder = ClassOrder['Variable'];
Variable.prototype.isVar = 1;

module.exports = Variable;