var chai = require('chai');
var assert = chai.assert;

var factory = require('../../src/utilities/sbgnml-to-sbml-converter-factory')();

global.$ = jQuery = require('jquery');

describe('sbgnmlToSbml', function () {
    it('error handling', function () {
        var invalidSbgn = "<?xml version='1.0' encoding='UTF-8' standalone='yes'?><bla/>";
        var result = undefined

        function callback(param) {
            result = param;
        }

        return Promise.resolve(factory.convert(invalidSbgn, callback).then(function () {
            assert.isOk(result);
            assert.isNotOk(result.result);
        })).catch(function () {
            assert.isOk(result);
            assert.isNotOk(result.result);
        });
    });
    it('proper conversion', function () {
        var result = undefined
        var validSbgn = "<?xml version='1.0' encoding='UTF-8' standalone='yes'?>\n" +
            "<sbgn xmlns=\"http://sbgn.org/libsbgn/0.2\">\n" +
            "  <map language=\"process description\">\n" +
            "  </map>\n" +
            "</sbgn>";

        function callback(param) {
            result = param;
        }

        return factory.convert(validSbgn, callback).then(function () {
            assert.isOk(result);
            assert.isOk(result.result);
        });
    });
});