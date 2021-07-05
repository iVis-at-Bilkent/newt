"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Noise = void 0;
var Factory_1 = require("../Factory");
var Node_1 = require("../Node");
var Validators_1 = require("../Validators");
var Noise = function (imageData) {
    var amount = this.noise() * 255, data = imageData.data, nPixels = data.length, half = amount / 2, i;
    for (i = 0; i < nPixels; i += 4) {
        data[i + 0] += half - 2 * half * Math.random();
        data[i + 1] += half - 2 * half * Math.random();
        data[i + 2] += half - 2 * half * Math.random();
    }
};
exports.Noise = Noise;
Factory_1.Factory.addGetterSetter(Node_1.Node, 'noise', 0.2, Validators_1.getNumberValidator(), Factory_1.Factory.afterSetFilter);
