var chai = require('chai');
var assert = chai.assert;

var factory = require('../../src/utilities/sbml-to-sbgnml-converter-factory')();

global.$ = jQuery = require('jquery');

describe('sbmlToSbgnml', function () {
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
        var validSbgn = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n" +
            "<sbml xmlns=\"http://www.sbml.org/sbml/level2/version4\" level=\"2\" version=\"4\">\n" +
            "  <model id=\"TestGEN\">\n" +
            "    <annotation/>\n" +
            "    <listOfCompartments>\n" +
            "    </listOfCompartments>\n" +
            "    <listOfSpecies>\n" +
            "    </listOfSpecies>\n" +
            "  </model>\n" +
            "</sbml>";

        function callback(param) {
            result = param;
        }

        return factory.convert(validSbgn, callback).then(function () {
            assert.isOk(result);
            assert.isOk(result.result);
        });
    });
});