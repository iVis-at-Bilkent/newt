'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var ClassOrder = require('./class-order');
var Node = require('./node');

var BlankNode = function (_Node) {
  _inherits(BlankNode, _Node);

  function BlankNode(id) {
    _classCallCheck(this, BlankNode);

    var _this = _possibleConstructorReturn(this, (BlankNode.__proto__ || Object.getPrototypeOf(BlankNode)).call(this));

    _this.termType = BlankNode.termType;
    _this.id = BlankNode.nextId++;
    _this.value = id || _this.id.toString();
    return _this;
  }

  _createClass(BlankNode, [{
    key: 'compareTerm',
    value: function compareTerm(other) {
      if (this.classOrder < other.classOrder) {
        return -1;
      }
      if (this.classOrder > other.classOrder) {
        return +1;
      }
      if (this.id < other.id) {
        return -1;
      }
      if (this.id > other.id) {
        return +1;
      }
      return 0;
    }
  }, {
    key: 'copy',
    value: function copy(formula) {
      // depends on the formula
      var bnodeNew = new BlankNode();
      formula.copyTo(this, bnodeNew);
      return bnodeNew;
    }
  }, {
    key: 'toCanonical',
    value: function toCanonical() {
      return '_:' + this.value;
    }
  }, {
    key: 'toString',
    value: function toString() {
      return BlankNode.NTAnonymousNodePrefix + this.id;
    }
  }]);

  return BlankNode;
}(Node);

BlankNode.nextId = 0;
BlankNode.termType = 'BlankNode';
BlankNode.NTAnonymousNodePrefix = '_:n';
BlankNode.prototype.classOrder = ClassOrder['BlankNode'];
BlankNode.prototype.isBlank = 1;
BlankNode.prototype.isVar = 1;

module.exports = BlankNode;