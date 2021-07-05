"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Posterize = void 0;
var Factory_1 = require("../Factory");
var Node_1 = require("../Node");
var Validators_1 = require("../Validators");
var Posterize = function (imageData) {
    var levels = Math.round(this.levels() * 254) + 1, data = imageData.data, len = data.length, scale = 255 / levels, i;
    for (i = 0; i < len; i += 1) {
        data[i] = Math.floor(data[i] / scale) * scale;
    }
};
exports.Posterize = Posterize;
Factory_1.Factory.addGetterSetter(Node_1.Node, 'levels', 0.5, Validators_1.getNumberValidator(), Factory_1.Factory.afterSetFilter);
