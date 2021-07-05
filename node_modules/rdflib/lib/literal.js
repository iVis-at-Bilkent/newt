'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var ClassOrder = require('./class-order');
var NamedNode = require('./named-node');
var Node = require('./node');
var XSD = require('./xsd');

var Literal = function (_Node) {
  _inherits(Literal, _Node);

  function Literal(value, language, datatype) {
    _classCallCheck(this, Literal);

    var _this = _possibleConstructorReturn(this, (Literal.__proto__ || Object.getPrototypeOf(Literal)).call(this));

    _this.termType = Literal.termType;
    _this.value = value;
    if (language) {
      _this.lang = language;
      datatype = XSD.langString;
    }
    // If not specified, a literal has the implied XSD.string default datatype
    if (datatype) {
      _this.datatype = NamedNode.fromValue(datatype);
    }
    return _this;
  }

  _createClass(Literal, [{
    key: 'copy',
    value: function copy() {
      return new Literal(this.value, this.lang, this.datatype);
    }
  }, {
    key: 'equals',
    value: function equals(other) {
      if (!other) {
        return false;
      }
      return this.termType === other.termType && this.value === other.value && this.language === other.language && (!this.datatype && !other.datatype || this.datatype && this.datatype.equals(other.datatype));
    }
  }, {
    key: 'toNT',
    value: function toNT() {
      if (typeof this.value === 'number') {
        return this.toString();
      } else if (typeof this.value !== 'string') {
        throw new Error('Value of RDF literal is not string or number: ' + this.value);
      }
      var str = this.value;
      str = str.replace(/\\/g, '\\\\');
      str = str.replace(/\"/g, '\\"');
      str = str.replace(/\n/g, '\\n');
      str = '"' + str + '"';

      if (this.language) {
        str += '@' + this.language;
      } else if (!this.datatype.equals(XSD.string)) {
        // Only add datatype if it's not a string
        str += '^^' + this.datatype.toCanonical();
      }
      return str;
    }
  }, {
    key: 'toString',
    value: function toString() {
      return '' + this.value;
    }
    /**
     * @method fromBoolean
     * @static
     * @param value {Boolean}
     * @return {Literal}
     */

  }, {
    key: 'language',
    get: function get() {
      return this.lang;
    },
    set: function set(language) {
      this.lang = language || '';
    }
  }], [{
    key: 'fromBoolean',
    value: function fromBoolean(value) {
      var strValue = value ? '1' : '0';
      return new Literal(strValue, null, XSD.boolean);
    }
    /**
     * @method fromDate
     * @static
     * @param value {Date}
     * @return {Literal}
     */

  }, {
    key: 'fromDate',
    value: function fromDate(value) {
      if (!(value instanceof Date)) {
        throw new TypeError('Invalid argument to Literal.fromDate()');
      }
      var d2 = function d2(x) {
        return ('' + (100 + x)).slice(1, 3);
      };
      var date = '' + value.getUTCFullYear() + '-' + d2(value.getUTCMonth() + 1) + '-' + d2(value.getUTCDate()) + 'T' + d2(value.getUTCHours()) + ':' + d2(value.getUTCMinutes()) + ':' + d2(value.getUTCSeconds()) + 'Z';
      return new Literal(date, null, XSD.dateTime);
    }
    /**
     * @method fromNumber
     * @static
     * @param value {Number}
     * @return {Literal}
     */

  }, {
    key: 'fromNumber',
    value: function fromNumber(value) {
      if (typeof value !== 'number') {
        throw new TypeError('Invalid argument to Literal.fromNumber()');
      }
      var datatype = void 0;
      var strValue = value.toString();
      if (strValue.indexOf('e') < 0 && Math.abs(value) <= Number.MAX_SAFE_INTEGER) {
        datatype = Number.isInteger(value) ? XSD.integer : XSD.decimal;
      } else {
        datatype = XSD.double;
      }
      return new Literal(strValue, null, datatype);
    }
    /**
     * @method fromValue
     * @param value
     * @return {Literal}
     */

  }, {
    key: 'fromValue',
    value: function fromValue(value) {
      if (typeof value === 'undefined' || value === null) {
        return value;
      }
      if ((typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object' && value.termType) {
        // this is a Node instance
        return value;
      }
      switch (typeof value === 'undefined' ? 'undefined' : _typeof(value)) {
        case 'object':
          if (value instanceof Date) {
            return Literal.fromDate(value);
          }
        case 'boolean':
          return Literal.fromBoolean(value);
        case 'number':
          return Literal.fromNumber(value);
        case 'string':
          return new Literal(value);
      }
      throw new Error("Can't make literal from " + value + ' of type ' + (typeof value === 'undefined' ? 'undefined' : _typeof(value)));
    }
  }]);

  return Literal;
}(Node);

Literal.termType = 'Literal';
Literal.prototype.classOrder = ClassOrder['Literal'];
Literal.prototype.datatype = XSD.string;
Literal.prototype.lang = '';
Literal.prototype.isVar = 0;

module.exports = Literal;