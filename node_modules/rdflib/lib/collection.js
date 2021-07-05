'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var BlankNode = require('./blank-node');
var ClassOrder = require('./class-order');
var Node = require('./node');

var Collection = function (_Node) {
  _inherits(Collection, _Node);

  function Collection(initial) {
    _classCallCheck(this, Collection);

    var _this = _possibleConstructorReturn(this, (Collection.__proto__ || Object.getPrototypeOf(Collection)).call(this));

    _this.termType = Collection.termType;
    _this.id = BlankNode.nextId++;
    _this.elements = [];
    _this.closed = false;
    if (initial && initial.length > 0) {
      initial.forEach(function (element) {
        _this.elements.push(Node.fromValue(element));
      });
    }
    return _this;
  }

  _createClass(Collection, [{
    key: 'append',
    value: function append(element) {
      return this.elements.push(element);
    }
  }, {
    key: 'close',
    value: function close() {
      this.closed = true;
      return this.closed;
    }
  }, {
    key: 'shift',
    value: function shift() {
      return this.elements.shift();
    }
  }, {
    key: 'substitute',
    value: function substitute(bindings) {
      var elementsCopy = this.elements.map(function (ea) {
        ea.substitute(bindings);
      });
      return new Collection(elementsCopy);
    }
  }, {
    key: 'toNT',
    value: function toNT() {
      return BlankNode.NTAnonymousNodePrefix + this.id;
    }
  }, {
    key: 'toString',
    value: function toString() {
      return '(' + this.elements.join(' ') + ')';
    }
  }, {
    key: 'unshift',
    value: function unshift(element) {
      return this.elements.unshift(element);
    }
  }]);

  return Collection;
}(Node);

Collection.termType = 'Collection';
Collection.prototype.classOrder = ClassOrder['Collection'];
Collection.prototype.compareTerm = BlankNode.prototype.compareTerm;
Collection.prototype.isVar = 0;

module.exports = Collection;