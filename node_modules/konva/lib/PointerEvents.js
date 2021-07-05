"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.releaseCapture = exports.setPointerCapture = exports.hasPointerCapture = exports.createEvent = exports.getCapturedShape = void 0;
var Global_1 = require("./Global");
var Captures = new Map();
var SUPPORT_POINTER_EVENTS = Global_1.Konva._global['PointerEvent'] !== undefined;
function getCapturedShape(pointerId) {
    return Captures.get(pointerId);
}
exports.getCapturedShape = getCapturedShape;
function createEvent(evt) {
    return {
        evt: evt,
        pointerId: evt.pointerId
    };
}
exports.createEvent = createEvent;
function hasPointerCapture(pointerId, shape) {
    return Captures.get(pointerId) === shape;
}
exports.hasPointerCapture = hasPointerCapture;
function setPointerCapture(pointerId, shape) {
    releaseCapture(pointerId);
    var stage = shape.getStage();
    if (!stage)
        return;
    Captures.set(pointerId, shape);
    if (SUPPORT_POINTER_EVENTS) {
        shape._fire('gotpointercapture', createEvent(new PointerEvent('gotpointercapture')));
    }
}
exports.setPointerCapture = setPointerCapture;
function releaseCapture(pointerId, target) {
    var shape = Captures.get(pointerId);
    if (!shape)
        return;
    var stage = shape.getStage();
    if (stage && stage.content) {
    }
    Captures.delete(pointerId);
    if (SUPPORT_POINTER_EVENTS) {
        shape._fire('lostpointercapture', createEvent(new PointerEvent('lostpointercapture')));
    }
}
exports.releaseCapture = releaseCapture;
