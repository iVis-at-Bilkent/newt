"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Threshold = void 0;
var Factory_1 = require("../Factory");
var Node_1 = require("../Node");
var Validators_1 = require("../Validators");
var Threshold = function (imageData) {
    var level = this.threshold() * 255, data = imageData.data, len = data.length, i;
    for (i = 0; i < len; i += 1) {
        data[i] = data[i] < level ? 0 : 255;
    }
};
exports.Threshold = Threshold;
Factory_1.Factory.addGetterSetter(Node_1.Node, 'threshold', 0.5, Validators_1.getNumberValidator(), Factory_1.Factory.afterSetFilter);
