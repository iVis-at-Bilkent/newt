"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Konva = void 0;
var Global_1 = require("./Global");
var Util_1 = require("./Util");
var Node_1 = require("./Node");
var Container_1 = require("./Container");
var Stage_1 = require("./Stage");
var Layer_1 = require("./Layer");
var FastLayer_1 = require("./FastLayer");
var Group_1 = require("./Group");
var DragAndDrop_1 = require("./DragAndDrop");
var Shape_1 = require("./Shape");
var Animation_1 = require("./Animation");
var Tween_1 = require("./Tween");
var Context_1 = require("./Context");
var Canvas_1 = require("./Canvas");
exports.Konva = Util_1.Util._assign(Global_1.Konva, {
    Collection: Util_1.Collection,
    Util: Util_1.Util,
    Transform: Util_1.Transform,
    Node: Node_1.Node,
    ids: Node_1.ids,
    names: Node_1.names,
    Container: Container_1.Container,
    Stage: Stage_1.Stage,
    stages: Stage_1.stages,
    Layer: Layer_1.Layer,
    FastLayer: FastLayer_1.FastLayer,
    Group: Group_1.Group,
    DD: DragAndDrop_1.DD,
    Shape: Shape_1.Shape,
    shapes: Shape_1.shapes,
    Animation: Animation_1.Animation,
    Tween: Tween_1.Tween,
    Easings: Tween_1.Easings,
    Context: Context_1.Context,
    Canvas: Canvas_1.Canvas
});
