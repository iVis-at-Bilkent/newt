var schematronValidator = require('./schematronValidator');
var fs = require('file-system');
var file=fs.readFileSync('pd10101-fail.sbgn.xml', 'utf8');
console.log(file);
var result = schematronValidator.SchematronValidation.isValid(file);
console.log(result.length > 0);
