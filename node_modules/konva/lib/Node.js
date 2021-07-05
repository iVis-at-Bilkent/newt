"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Node = exports._removeName = exports._addName = exports._removeId = exports.names = exports.ids = void 0;
var Util_1 = require("./Util");
var Factory_1 = require("./Factory");
var Canvas_1 = require("./Canvas");
var Global_1 = require("./Global");
var DragAndDrop_1 = require("./DragAndDrop");
var Validators_1 = require("./Validators");
exports.ids = {};
exports.names = {};
var _addId = function (node, id) {
    if (!id) {
        return;
    }
    exports.ids[id] = node;
};
var _removeId = function (id, node) {
    if (!id) {
        return;
    }
    if (exports.ids[id] !== node) {
        return;
    }
    delete exports.ids[id];
};
exports._removeId = _removeId;
var _addName = function (node, name) {
    if (name) {
        if (!exports.names[name]) {
            exports.names[name] = [];
        }
        exports.names[name].push(node);
    }
};
exports._addName = _addName;
var _removeName = function (name, _id) {
    if (!name) {
        return;
    }
    var nodes = exports.names[name];
    if (!nodes) {
        return;
    }
    for (var n = 0; n < nodes.length; n++) {
        var no = nodes[n];
        if (no._id === _id) {
            nodes.splice(n, 1);
        }
    }
    if (nodes.length === 0) {
        delete exports.names[name];
    }
};
exports._removeName = _removeName;
var ABSOLUTE_OPACITY = 'absoluteOpacity', ALL_LISTENERS = 'allEventListeners', ABSOLUTE_TRANSFORM = 'absoluteTransform', ABSOLUTE_SCALE = 'absoluteScale', CANVAS = 'canvas', CHANGE = 'Change', CHILDREN = 'children', KONVA = 'konva', LISTENING = 'listening', MOUSEENTER = 'mouseenter', MOUSELEAVE = 'mouseleave', NAME = 'name', SET = 'set', SHAPE = 'Shape', SPACE = ' ', STAGE = 'stage', TRANSFORM = 'transform', UPPER_STAGE = 'Stage', VISIBLE = 'visible', TRANSFORM_CHANGE_STR = [
    'xChange.konva',
    'yChange.konva',
    'scaleXChange.konva',
    'scaleYChange.konva',
    'skewXChange.konva',
    'skewYChange.konva',
    'rotationChange.konva',
    'offsetXChange.konva',
    'offsetYChange.konva',
    'transformsEnabledChange.konva',
].join(SPACE), SCALE_CHANGE_STR = ['scaleXChange.konva', 'scaleYChange.konva'].join(SPACE);
var emptyChildren = new Util_1.Collection();
var idCounter = 1;
var Node = (function () {
    function Node(config) {
        this._id = idCounter++;
        this.eventListeners = {};
        this.attrs = {};
        this.index = 0;
        this._allEventListeners = null;
        this.parent = null;
        this._cache = new Map();
        this._attachedDepsListeners = new Map();
        this._lastPos = null;
        this._batchingTransformChange = false;
        this._needClearTransformCache = false;
        this._filterUpToDate = false;
        this._isUnderCache = false;
        this.children = emptyChildren;
        this._dragEventId = null;
        this._shouldFireChangeEvents = false;
        this.setAttrs(config);
        this._shouldFireChangeEvents = true;
    }
    Node.prototype.hasChildren = function () {
        return false;
    };
    Node.prototype.getChildren = function () {
        return emptyChildren;
    };
    Node.prototype._clearCache = function (attr) {
        if ((attr === TRANSFORM || attr === ABSOLUTE_TRANSFORM) &&
            this._cache.get(attr)) {
            this._cache.get(attr).dirty = true;
        }
        else if (attr) {
            this._cache.delete(attr);
        }
        else {
            this._cache.clear();
        }
    };
    Node.prototype._getCache = function (attr, privateGetter) {
        var cache = this._cache.get(attr);
        var isTransform = attr === TRANSFORM || attr === ABSOLUTE_TRANSFORM;
        var invalid = cache === undefined || (isTransform && cache.dirty === true);
        if (invalid) {
            cache = privateGetter.call(this);
            this._cache.set(attr, cache);
        }
        return cache;
    };
    Node.prototype._calculate = function (name, deps, getter) {
        var _this = this;
        if (!this._attachedDepsListeners.get(name)) {
            var depsString = deps.map(function (dep) { return dep + 'Change.konva'; }).join(SPACE);
            this.on(depsString, function () {
                _this._clearCache(name);
            });
            this._attachedDepsListeners.set(name, true);
        }
        return this._getCache(name, getter);
    };
    Node.prototype._getCanvasCache = function () {
        return this._cache.get(CANVAS);
    };
    Node.prototype._clearSelfAndDescendantCache = function (attr, forceEvent) {
        this._clearCache(attr);
        if (forceEvent && attr === ABSOLUTE_TRANSFORM) {
            this.fire('_clearTransformCache');
        }
        if (this.isCached()) {
            return;
        }
        if (this.children) {
            this.children.each(function (node) {
                node._clearSelfAndDescendantCache(attr, true);
            });
        }
    };
    Node.prototype.clearCache = function () {
        this._cache.delete(CANVAS);
        this._clearSelfAndDescendantCache();
        return this;
    };
    Node.prototype.cache = function (config) {
        var conf = config || {};
        var rect = {};
        if (conf.x === undefined ||
            conf.y === undefined ||
            conf.width === undefined ||
            conf.height === undefined) {
            rect = this.getClientRect({
                skipTransform: true,
                relativeTo: this.getParent(),
            });
        }
        var width = Math.ceil(conf.width || rect.width), height = Math.ceil(conf.height || rect.height), pixelRatio = conf.pixelRatio, x = conf.x === undefined ? rect.x : conf.x, y = conf.y === undefined ? rect.y : conf.y, offset = conf.offset || 0, drawBorder = conf.drawBorder || false;
        if (!width || !height) {
            Util_1.Util.error('Can not cache the node. Width or height of the node equals 0. Caching is skipped.');
            return;
        }
        width += offset * 2;
        height += offset * 2;
        x -= offset;
        y -= offset;
        var cachedSceneCanvas = new Canvas_1.SceneCanvas({
            pixelRatio: pixelRatio,
            width: width,
            height: height,
        }), cachedFilterCanvas = new Canvas_1.SceneCanvas({
            pixelRatio: pixelRatio,
            width: 0,
            height: 0,
        }), cachedHitCanvas = new Canvas_1.HitCanvas({
            pixelRatio: 1,
            width: width,
            height: height,
        }), sceneContext = cachedSceneCanvas.getContext(), hitContext = cachedHitCanvas.getContext();
        cachedHitCanvas.isCache = true;
        cachedSceneCanvas.isCache = true;
        this._cache.delete('canvas');
        this._filterUpToDate = false;
        if (conf.imageSmoothingEnabled === false) {
            cachedSceneCanvas.getContext()._context.imageSmoothingEnabled = false;
            cachedFilterCanvas.getContext()._context.imageSmoothingEnabled = false;
        }
        sceneContext.save();
        hitContext.save();
        sceneContext.translate(-x, -y);
        hitContext.translate(-x, -y);
        this._isUnderCache = true;
        this._clearSelfAndDescendantCache(ABSOLUTE_OPACITY);
        this._clearSelfAndDescendantCache(ABSOLUTE_SCALE);
        this.drawScene(cachedSceneCanvas, this);
        this.drawHit(cachedHitCanvas, this);
        this._isUnderCache = false;
        sceneContext.restore();
        hitContext.restore();
        if (drawBorder) {
            sceneContext.save();
            sceneContext.beginPath();
            sceneContext.rect(0, 0, width, height);
            sceneContext.closePath();
            sceneContext.setAttr('strokeStyle', 'red');
            sceneContext.setAttr('lineWidth', 5);
            sceneContext.stroke();
            sceneContext.restore();
        }
        this._cache.set(CANVAS, {
            scene: cachedSceneCanvas,
            filter: cachedFilterCanvas,
            hit: cachedHitCanvas,
            x: x,
            y: y,
        });
        return this;
    };
    Node.prototype.isCached = function () {
        return this._cache.has('canvas');
    };
    Node.prototype.getClientRect = function (config) {
        throw new Error('abstract "getClientRect" method call');
    };
    Node.prototype._transformedRect = function (rect, top) {
        var points = [
            { x: rect.x, y: rect.y },
            { x: rect.x + rect.width, y: rect.y },
            { x: rect.x + rect.width, y: rect.y + rect.height },
            { x: rect.x, y: rect.y + rect.height },
        ];
        var minX, minY, maxX, maxY;
        var trans = this.getAbsoluteTransform(top);
        points.forEach(function (point) {
            var transformed = trans.point(point);
            if (minX === undefined) {
                minX = maxX = transformed.x;
                minY = maxY = transformed.y;
            }
            minX = Math.min(minX, transformed.x);
            minY = Math.min(minY, transformed.y);
            maxX = Math.max(maxX, transformed.x);
            maxY = Math.max(maxY, transformed.y);
        });
        return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY,
        };
    };
    Node.prototype._drawCachedSceneCanvas = function (context) {
        context.save();
        context._applyOpacity(this);
        context._applyGlobalCompositeOperation(this);
        var canvasCache = this._getCanvasCache();
        context.translate(canvasCache.x, canvasCache.y);
        var cacheCanvas = this._getCachedSceneCanvas();
        var ratio = cacheCanvas.pixelRatio;
        context.drawImage(cacheCanvas._canvas, 0, 0, cacheCanvas.width / ratio, cacheCanvas.height / ratio);
        context.restore();
    };
    Node.prototype._drawCachedHitCanvas = function (context) {
        var canvasCache = this._getCanvasCache(), hitCanvas = canvasCache.hit;
        context.save();
        context.translate(canvasCache.x, canvasCache.y);
        context.drawImage(hitCanvas._canvas, 0, 0);
        context.restore();
    };
    Node.prototype._getCachedSceneCanvas = function () {
        var filters = this.filters(), cachedCanvas = this._getCanvasCache(), sceneCanvas = cachedCanvas.scene, filterCanvas = cachedCanvas.filter, filterContext = filterCanvas.getContext(), len, imageData, n, filter;
        if (filters) {
            if (!this._filterUpToDate) {
                var ratio = sceneCanvas.pixelRatio;
                filterCanvas.setSize(sceneCanvas.width / sceneCanvas.pixelRatio, sceneCanvas.height / sceneCanvas.pixelRatio);
                try {
                    len = filters.length;
                    filterContext.clear();
                    filterContext.drawImage(sceneCanvas._canvas, 0, 0, sceneCanvas.getWidth() / ratio, sceneCanvas.getHeight() / ratio);
                    imageData = filterContext.getImageData(0, 0, filterCanvas.getWidth(), filterCanvas.getHeight());
                    for (n = 0; n < len; n++) {
                        filter = filters[n];
                        if (typeof filter !== 'function') {
                            Util_1.Util.error('Filter should be type of function, but got ' +
                                typeof filter +
                                ' instead. Please check correct filters');
                            continue;
                        }
                        filter.call(this, imageData);
                        filterContext.putImageData(imageData, 0, 0);
                    }
                }
                catch (e) {
                    Util_1.Util.error('Unable to apply filter. ' +
                        e.message +
                        ' This post my help you https://konvajs.org/docs/posts/Tainted_Canvas.html.');
                }
                this._filterUpToDate = true;
            }
            return filterCanvas;
        }
        return sceneCanvas;
    };
    Node.prototype.on = function (evtStr, handler) {
        this._cache && this._cache.delete(ALL_LISTENERS);
        if (arguments.length === 3) {
            return this._delegate.apply(this, arguments);
        }
        var events = evtStr.split(SPACE), len = events.length, n, event, parts, baseEvent, name;
        for (n = 0; n < len; n++) {
            event = events[n];
            parts = event.split('.');
            baseEvent = parts[0];
            name = parts[1] || '';
            if (!this.eventListeners[baseEvent]) {
                this.eventListeners[baseEvent] = [];
            }
            this.eventListeners[baseEvent].push({
                name: name,
                handler: handler,
            });
        }
        return this;
    };
    Node.prototype.off = function (evtStr, callback) {
        var events = (evtStr || '').split(SPACE), len = events.length, n, t, event, parts, baseEvent, name;
        this._cache && this._cache.delete(ALL_LISTENERS);
        if (!evtStr) {
            for (t in this.eventListeners) {
                this._off(t);
            }
        }
        for (n = 0; n < len; n++) {
            event = events[n];
            parts = event.split('.');
            baseEvent = parts[0];
            name = parts[1];
            if (baseEvent) {
                if (this.eventListeners[baseEvent]) {
                    this._off(baseEvent, name, callback);
                }
            }
            else {
                for (t in this.eventListeners) {
                    this._off(t, name, callback);
                }
            }
        }
        return this;
    };
    Node.prototype.dispatchEvent = function (evt) {
        var e = {
            target: this,
            type: evt.type,
            evt: evt,
        };
        this.fire(evt.type, e);
        return this;
    };
    Node.prototype.addEventListener = function (type, handler) {
        this.on(type, function (evt) {
            handler.call(this, evt.evt);
        });
        return this;
    };
    Node.prototype.removeEventListener = function (type) {
        this.off(type);
        return this;
    };
    Node.prototype._delegate = function (event, selector, handler) {
        var stopNode = this;
        this.on(event, function (evt) {
            var targets = evt.target.findAncestors(selector, true, stopNode);
            for (var i = 0; i < targets.length; i++) {
                evt = Util_1.Util.cloneObject(evt);
                evt.currentTarget = targets[i];
                handler.call(targets[i], evt);
            }
        });
    };
    Node.prototype.remove = function () {
        if (this.isDragging()) {
            this.stopDrag();
        }
        DragAndDrop_1.DD._dragElements.delete(this._id);
        this._remove();
        return this;
    };
    Node.prototype._clearCaches = function () {
        this._clearSelfAndDescendantCache(ABSOLUTE_TRANSFORM);
        this._clearSelfAndDescendantCache(ABSOLUTE_OPACITY);
        this._clearSelfAndDescendantCache(ABSOLUTE_SCALE);
        this._clearSelfAndDescendantCache(STAGE);
        this._clearSelfAndDescendantCache(VISIBLE);
        this._clearSelfAndDescendantCache(LISTENING);
    };
    Node.prototype._remove = function () {
        this._clearCaches();
        var parent = this.getParent();
        if (parent && parent.children) {
            parent.children.splice(this.index, 1);
            parent._setChildrenIndices();
            this.parent = null;
        }
    };
    Node.prototype.destroy = function () {
        exports._removeId(this.id(), this);
        var names = (this.name() || '').split(/\s/g);
        for (var i = 0; i < names.length; i++) {
            var subname = names[i];
            exports._removeName(subname, this._id);
        }
        this.remove();
        return this;
    };
    Node.prototype.getAttr = function (attr) {
        var method = 'get' + Util_1.Util._capitalize(attr);
        if (Util_1.Util._isFunction(this[method])) {
            return this[method]();
        }
        return this.attrs[attr];
    };
    Node.prototype.getAncestors = function () {
        var parent = this.getParent(), ancestors = new Util_1.Collection();
        while (parent) {
            ancestors.push(parent);
            parent = parent.getParent();
        }
        return ancestors;
    };
    Node.prototype.getAttrs = function () {
        return this.attrs || {};
    };
    Node.prototype.setAttrs = function (config) {
        var _this = this;
        this._batchTransformChanges(function () {
            var key, method;
            if (!config) {
                return _this;
            }
            for (key in config) {
                if (key === CHILDREN) {
                    continue;
                }
                method = SET + Util_1.Util._capitalize(key);
                if (Util_1.Util._isFunction(_this[method])) {
                    _this[method](config[key]);
                }
                else {
                    _this._setAttr(key, config[key]);
                }
            }
        });
        return this;
    };
    Node.prototype.isListening = function () {
        return this._getCache(LISTENING, this._isListening);
    };
    Node.prototype._isListening = function (relativeTo) {
        var listening = this.listening();
        if (!listening) {
            return false;
        }
        var parent = this.getParent();
        if (parent && parent !== relativeTo && this !== relativeTo) {
            return parent._isListening(relativeTo);
        }
        else {
            return true;
        }
    };
    Node.prototype.isVisible = function () {
        return this._getCache(VISIBLE, this._isVisible);
    };
    Node.prototype._isVisible = function (relativeTo) {
        var visible = this.visible();
        if (!visible) {
            return false;
        }
        var parent = this.getParent();
        if (parent && parent !== relativeTo && this !== relativeTo) {
            return parent._isVisible(relativeTo);
        }
        else {
            return true;
        }
    };
    Node.prototype.shouldDrawHit = function (top, skipDragCheck) {
        if (skipDragCheck === void 0) { skipDragCheck = false; }
        if (top) {
            return this._isVisible(top) && this._isListening(top);
        }
        var layer = this.getLayer();
        var layerUnderDrag = false;
        DragAndDrop_1.DD._dragElements.forEach(function (elem) {
            if (elem.dragStatus !== 'dragging') {
                return;
            }
            else if (elem.node.nodeType === 'Stage') {
                layerUnderDrag = true;
            }
            else if (elem.node.getLayer() === layer) {
                layerUnderDrag = true;
            }
        });
        var dragSkip = !skipDragCheck && !Global_1.Konva.hitOnDragEnabled && layerUnderDrag;
        return this.isListening() && this.isVisible() && !dragSkip;
    };
    Node.prototype.show = function () {
        this.visible(true);
        return this;
    };
    Node.prototype.hide = function () {
        this.visible(false);
        return this;
    };
    Node.prototype.getZIndex = function () {
        return this.index || 0;
    };
    Node.prototype.getAbsoluteZIndex = function () {
        var depth = this.getDepth(), that = this, index = 0, nodes, len, n, child;
        function addChildren(children) {
            nodes = [];
            len = children.length;
            for (n = 0; n < len; n++) {
                child = children[n];
                index++;
                if (child.nodeType !== SHAPE) {
                    nodes = nodes.concat(child.getChildren().toArray());
                }
                if (child._id === that._id) {
                    n = len;
                }
            }
            if (nodes.length > 0 && nodes[0].getDepth() <= depth) {
                addChildren(nodes);
            }
        }
        if (that.nodeType !== UPPER_STAGE) {
            addChildren(that.getStage().getChildren());
        }
        return index;
    };
    Node.prototype.getDepth = function () {
        var depth = 0, parent = this.parent;
        while (parent) {
            depth++;
            parent = parent.parent;
        }
        return depth;
    };
    Node.prototype._batchTransformChanges = function (func) {
        this._batchingTransformChange = true;
        func();
        this._batchingTransformChange = false;
        if (this._needClearTransformCache) {
            this._clearCache(TRANSFORM);
            this._clearSelfAndDescendantCache(ABSOLUTE_TRANSFORM, true);
        }
        this._needClearTransformCache = false;
    };
    Node.prototype.setPosition = function (pos) {
        var _this = this;
        this._batchTransformChanges(function () {
            _this.x(pos.x);
            _this.y(pos.y);
        });
        return this;
    };
    Node.prototype.getPosition = function () {
        return {
            x: this.x(),
            y: this.y(),
        };
    };
    Node.prototype.getAbsolutePosition = function (top) {
        var haveCachedParent = false;
        var parent = this.parent;
        while (parent) {
            if (parent.isCached()) {
                haveCachedParent = true;
                break;
            }
            parent = parent.parent;
        }
        if (haveCachedParent && !top) {
            top = true;
        }
        var absoluteMatrix = this.getAbsoluteTransform(top).getMatrix(), absoluteTransform = new Util_1.Transform(), offset = this.offset();
        absoluteTransform.m = absoluteMatrix.slice();
        absoluteTransform.translate(offset.x, offset.y);
        return absoluteTransform.getTranslation();
    };
    Node.prototype.setAbsolutePosition = function (pos) {
        var origTrans = this._clearTransform();
        this.attrs.x = origTrans.x;
        this.attrs.y = origTrans.y;
        delete origTrans.x;
        delete origTrans.y;
        this._clearCache(TRANSFORM);
        var it = this._getAbsoluteTransform().copy();
        it.invert();
        it.translate(pos.x, pos.y);
        pos = {
            x: this.attrs.x + it.getTranslation().x,
            y: this.attrs.y + it.getTranslation().y,
        };
        this._setTransform(origTrans);
        this.setPosition({ x: pos.x, y: pos.y });
        this._clearCache(TRANSFORM);
        this._clearSelfAndDescendantCache(ABSOLUTE_TRANSFORM);
        return this;
    };
    Node.prototype._setTransform = function (trans) {
        var key;
        for (key in trans) {
            this.attrs[key] = trans[key];
        }
    };
    Node.prototype._clearTransform = function () {
        var trans = {
            x: this.x(),
            y: this.y(),
            rotation: this.rotation(),
            scaleX: this.scaleX(),
            scaleY: this.scaleY(),
            offsetX: this.offsetX(),
            offsetY: this.offsetY(),
            skewX: this.skewX(),
            skewY: this.skewY(),
        };
        this.attrs.x = 0;
        this.attrs.y = 0;
        this.attrs.rotation = 0;
        this.attrs.scaleX = 1;
        this.attrs.scaleY = 1;
        this.attrs.offsetX = 0;
        this.attrs.offsetY = 0;
        this.attrs.skewX = 0;
        this.attrs.skewY = 0;
        return trans;
    };
    Node.prototype.move = function (change) {
        var changeX = change.x, changeY = change.y, x = this.x(), y = this.y();
        if (changeX !== undefined) {
            x += changeX;
        }
        if (changeY !== undefined) {
            y += changeY;
        }
        this.setPosition({ x: x, y: y });
        return this;
    };
    Node.prototype._eachAncestorReverse = function (func, top) {
        var family = [], parent = this.getParent(), len, n;
        if (top && top._id === this._id) {
            return;
        }
        family.unshift(this);
        while (parent && (!top || parent._id !== top._id)) {
            family.unshift(parent);
            parent = parent.parent;
        }
        len = family.length;
        for (n = 0; n < len; n++) {
            func(family[n]);
        }
    };
    Node.prototype.rotate = function (theta) {
        this.rotation(this.rotation() + theta);
        return this;
    };
    Node.prototype.moveToTop = function () {
        if (!this.parent) {
            Util_1.Util.warn('Node has no parent. moveToTop function is ignored.');
            return false;
        }
        var index = this.index;
        this.parent.children.splice(index, 1);
        this.parent.children.push(this);
        this.parent._setChildrenIndices();
        return true;
    };
    Node.prototype.moveUp = function () {
        if (!this.parent) {
            Util_1.Util.warn('Node has no parent. moveUp function is ignored.');
            return false;
        }
        var index = this.index, len = this.parent.getChildren().length;
        if (index < len - 1) {
            this.parent.children.splice(index, 1);
            this.parent.children.splice(index + 1, 0, this);
            this.parent._setChildrenIndices();
            return true;
        }
        return false;
    };
    Node.prototype.moveDown = function () {
        if (!this.parent) {
            Util_1.Util.warn('Node has no parent. moveDown function is ignored.');
            return false;
        }
        var index = this.index;
        if (index > 0) {
            this.parent.children.splice(index, 1);
            this.parent.children.splice(index - 1, 0, this);
            this.parent._setChildrenIndices();
            return true;
        }
        return false;
    };
    Node.prototype.moveToBottom = function () {
        if (!this.parent) {
            Util_1.Util.warn('Node has no parent. moveToBottom function is ignored.');
            return false;
        }
        var index = this.index;
        if (index > 0) {
            this.parent.children.splice(index, 1);
            this.parent.children.unshift(this);
            this.parent._setChildrenIndices();
            return true;
        }
        return false;
    };
    Node.prototype.setZIndex = function (zIndex) {
        if (!this.parent) {
            Util_1.Util.warn('Node has no parent. zIndex parameter is ignored.');
            return this;
        }
        if (zIndex < 0 || zIndex >= this.parent.children.length) {
            Util_1.Util.warn('Unexpected value ' +
                zIndex +
                ' for zIndex property. zIndex is just index of a node in children of its parent. Expected value is from 0 to ' +
                (this.parent.children.length - 1) +
                '.');
        }
        var index = this.index;
        this.parent.children.splice(index, 1);
        this.parent.children.splice(zIndex, 0, this);
        this.parent._setChildrenIndices();
        return this;
    };
    Node.prototype.getAbsoluteOpacity = function () {
        return this._getCache(ABSOLUTE_OPACITY, this._getAbsoluteOpacity);
    };
    Node.prototype._getAbsoluteOpacity = function () {
        var absOpacity = this.opacity();
        var parent = this.getParent();
        if (parent && !parent._isUnderCache) {
            absOpacity *= parent.getAbsoluteOpacity();
        }
        return absOpacity;
    };
    Node.prototype.moveTo = function (newContainer) {
        if (this.getParent() !== newContainer) {
            this._remove();
            newContainer.add(this);
        }
        return this;
    };
    Node.prototype.toObject = function () {
        var obj = {}, attrs = this.getAttrs(), key, val, getter, defaultValue, nonPlainObject;
        obj.attrs = {};
        for (key in attrs) {
            val = attrs[key];
            nonPlainObject =
                Util_1.Util.isObject(val) && !Util_1.Util._isPlainObject(val) && !Util_1.Util._isArray(val);
            if (nonPlainObject) {
                continue;
            }
            getter = typeof this[key] === 'function' && this[key];
            delete attrs[key];
            defaultValue = getter ? getter.call(this) : null;
            attrs[key] = val;
            if (defaultValue !== val) {
                obj.attrs[key] = val;
            }
        }
        obj.className = this.getClassName();
        return Util_1.Util._prepareToStringify(obj);
    };
    Node.prototype.toJSON = function () {
        return JSON.stringify(this.toObject());
    };
    Node.prototype.getParent = function () {
        return this.parent;
    };
    Node.prototype.findAncestors = function (selector, includeSelf, stopNode) {
        var res = [];
        if (includeSelf && this._isMatch(selector)) {
            res.push(this);
        }
        var ancestor = this.parent;
        while (ancestor) {
            if (ancestor === stopNode) {
                return res;
            }
            if (ancestor._isMatch(selector)) {
                res.push(ancestor);
            }
            ancestor = ancestor.parent;
        }
        return res;
    };
    Node.prototype.isAncestorOf = function (node) {
        return false;
    };
    Node.prototype.findAncestor = function (selector, includeSelf, stopNode) {
        return this.findAncestors(selector, includeSelf, stopNode)[0];
    };
    Node.prototype._isMatch = function (selector) {
        if (!selector) {
            return false;
        }
        if (typeof selector === 'function') {
            return selector(this);
        }
        var selectorArr = selector.replace(/ /g, '').split(','), len = selectorArr.length, n, sel;
        for (n = 0; n < len; n++) {
            sel = selectorArr[n];
            if (!Util_1.Util.isValidSelector(sel)) {
                Util_1.Util.warn('Selector "' +
                    sel +
                    '" is invalid. Allowed selectors examples are "#foo", ".bar" or "Group".');
                Util_1.Util.warn('If you have a custom shape with such className, please change it to start with upper letter like "Triangle".');
                Util_1.Util.warn('Konva is awesome, right?');
            }
            if (sel.charAt(0) === '#') {
                if (this.id() === sel.slice(1)) {
                    return true;
                }
            }
            else if (sel.charAt(0) === '.') {
                if (this.hasName(sel.slice(1))) {
                    return true;
                }
            }
            else if (this.className === sel || this.nodeType === sel) {
                return true;
            }
        }
        return false;
    };
    Node.prototype.getLayer = function () {
        var parent = this.getParent();
        return parent ? parent.getLayer() : null;
    };
    Node.prototype.getStage = function () {
        return this._getCache(STAGE, this._getStage);
    };
    Node.prototype._getStage = function () {
        var parent = this.getParent();
        if (parent) {
            return parent.getStage();
        }
        else {
            return undefined;
        }
    };
    Node.prototype.fire = function (eventType, evt, bubble) {
        if (evt === void 0) { evt = {}; }
        evt.target = evt.target || this;
        if (bubble) {
            this._fireAndBubble(eventType, evt);
        }
        else {
            this._fire(eventType, evt);
        }
        return this;
    };
    Node.prototype.getAbsoluteTransform = function (top) {
        if (top) {
            return this._getAbsoluteTransform(top);
        }
        else {
            return this._getCache(ABSOLUTE_TRANSFORM, this._getAbsoluteTransform);
        }
    };
    Node.prototype._getAbsoluteTransform = function (top) {
        var at;
        if (top) {
            at = new Util_1.Transform();
            this._eachAncestorReverse(function (node) {
                var transformsEnabled = node.transformsEnabled();
                if (transformsEnabled === 'all') {
                    at.multiply(node.getTransform());
                }
                else if (transformsEnabled === 'position') {
                    at.translate(node.x() - node.offsetX(), node.y() - node.offsetY());
                }
            }, top);
            return at;
        }
        else {
            at = this._cache.get(ABSOLUTE_TRANSFORM) || new Util_1.Transform();
            if (this.parent) {
                this.parent.getAbsoluteTransform().copyInto(at);
            }
            else {
                at.reset();
            }
            var transformsEnabled = this.transformsEnabled();
            if (transformsEnabled === 'all') {
                at.multiply(this.getTransform());
            }
            else if (transformsEnabled === 'position') {
                var x = this.attrs.x || 0;
                var y = this.attrs.y || 0;
                var offsetX = this.attrs.offsetX || 0;
                var offsetY = this.attrs.offsetY || 0;
                at.translate(x - offsetX, y - offsetY);
            }
            at.dirty = false;
            return at;
        }
    };
    Node.prototype.getAbsoluteScale = function (top) {
        var parent = this;
        while (parent) {
            if (parent._isUnderCache) {
                top = parent;
            }
            parent = parent.getParent();
        }
        var transform = this.getAbsoluteTransform(top);
        var attrs = transform.decompose();
        return {
            x: attrs.scaleX,
            y: attrs.scaleY,
        };
    };
    Node.prototype.getAbsoluteRotation = function () {
        return this.getAbsoluteTransform().decompose().rotation;
    };
    Node.prototype.getTransform = function () {
        return this._getCache(TRANSFORM, this._getTransform);
    };
    Node.prototype._getTransform = function () {
        var _a, _b;
        var m = this._cache.get(TRANSFORM) || new Util_1.Transform();
        m.reset();
        var x = this.x(), y = this.y(), rotation = Global_1.Konva.getAngle(this.rotation()), scaleX = (_a = this.attrs.scaleX) !== null && _a !== void 0 ? _a : 1, scaleY = (_b = this.attrs.scaleY) !== null && _b !== void 0 ? _b : 1, skewX = this.attrs.skewX || 0, skewY = this.attrs.skewY || 0, offsetX = this.attrs.offsetX || 0, offsetY = this.attrs.offsetY || 0;
        if (x !== 0 || y !== 0) {
            m.translate(x, y);
        }
        if (rotation !== 0) {
            m.rotate(rotation);
        }
        if (skewX !== 0 || skewY !== 0) {
            m.skew(skewX, skewY);
        }
        if (scaleX !== 1 || scaleY !== 1) {
            m.scale(scaleX, scaleY);
        }
        if (offsetX !== 0 || offsetY !== 0) {
            m.translate(-1 * offsetX, -1 * offsetY);
        }
        m.dirty = false;
        return m;
    };
    Node.prototype.clone = function (obj) {
        var attrs = Util_1.Util.cloneObject(this.attrs), key, allListeners, len, n, listener;
        for (key in obj) {
            attrs[key] = obj[key];
        }
        var node = new this.constructor(attrs);
        for (key in this.eventListeners) {
            allListeners = this.eventListeners[key];
            len = allListeners.length;
            for (n = 0; n < len; n++) {
                listener = allListeners[n];
                if (listener.name.indexOf(KONVA) < 0) {
                    if (!node.eventListeners[key]) {
                        node.eventListeners[key] = [];
                    }
                    node.eventListeners[key].push(listener);
                }
            }
        }
        return node;
    };
    Node.prototype._toKonvaCanvas = function (config) {
        config = config || {};
        var box = this.getClientRect();
        var stage = this.getStage(), x = config.x !== undefined ? config.x : box.x, y = config.y !== undefined ? config.y : box.y, pixelRatio = config.pixelRatio || 1, canvas = new Canvas_1.SceneCanvas({
            width: config.width || box.width || (stage ? stage.width() : 0),
            height: config.height || box.height || (stage ? stage.height() : 0),
            pixelRatio: pixelRatio,
        }), context = canvas.getContext();
        context.save();
        if (x || y) {
            context.translate(-1 * x, -1 * y);
        }
        this.drawScene(canvas);
        context.restore();
        return canvas;
    };
    Node.prototype.toCanvas = function (config) {
        return this._toKonvaCanvas(config)._canvas;
    };
    Node.prototype.toDataURL = function (config) {
        config = config || {};
        var mimeType = config.mimeType || null, quality = config.quality || null;
        var url = this._toKonvaCanvas(config).toDataURL(mimeType, quality);
        if (config.callback) {
            config.callback(url);
        }
        return url;
    };
    Node.prototype.toImage = function (config) {
        if (!config || !config.callback) {
            throw 'callback required for toImage method config argument';
        }
        var callback = config.callback;
        delete config.callback;
        Util_1.Util._urlToImage(this.toDataURL(config), function (img) {
            callback(img);
        });
    };
    Node.prototype.setSize = function (size) {
        this.width(size.width);
        this.height(size.height);
        return this;
    };
    Node.prototype.getSize = function () {
        return {
            width: this.width(),
            height: this.height(),
        };
    };
    Node.prototype.getClassName = function () {
        return this.className || this.nodeType;
    };
    Node.prototype.getType = function () {
        return this.nodeType;
    };
    Node.prototype.getDragDistance = function () {
        if (this.attrs.dragDistance !== undefined) {
            return this.attrs.dragDistance;
        }
        else if (this.parent) {
            return this.parent.getDragDistance();
        }
        else {
            return Global_1.Konva.dragDistance;
        }
    };
    Node.prototype._off = function (type, name, callback) {
        var evtListeners = this.eventListeners[type], i, evtName, handler;
        for (i = 0; i < evtListeners.length; i++) {
            evtName = evtListeners[i].name;
            handler = evtListeners[i].handler;
            if ((evtName !== 'konva' || name === 'konva') &&
                (!name || evtName === name) &&
                (!callback || callback === handler)) {
                evtListeners.splice(i, 1);
                if (evtListeners.length === 0) {
                    delete this.eventListeners[type];
                    break;
                }
                i--;
            }
        }
    };
    Node.prototype._fireChangeEvent = function (attr, oldVal, newVal) {
        this._fire(attr + CHANGE, {
            oldVal: oldVal,
            newVal: newVal,
        });
    };
    Node.prototype.setId = function (id) {
        var oldId = this.id();
        exports._removeId(oldId, this);
        _addId(this, id);
        this._setAttr('id', id);
        return this;
    };
    Node.prototype.setName = function (name) {
        var oldNames = (this.name() || '').split(/\s/g);
        var newNames = (name || '').split(/\s/g);
        var subname, i;
        for (i = 0; i < oldNames.length; i++) {
            subname = oldNames[i];
            if (newNames.indexOf(subname) === -1 && subname) {
                exports._removeName(subname, this._id);
            }
        }
        for (i = 0; i < newNames.length; i++) {
            subname = newNames[i];
            if (oldNames.indexOf(subname) === -1 && subname) {
                exports._addName(this, subname);
            }
        }
        this._setAttr(NAME, name);
        return this;
    };
    Node.prototype.addName = function (name) {
        if (!this.hasName(name)) {
            var oldName = this.name();
            var newName = oldName ? oldName + ' ' + name : name;
            this.setName(newName);
        }
        return this;
    };
    Node.prototype.hasName = function (name) {
        if (!name) {
            return false;
        }
        var fullName = this.name();
        if (!fullName) {
            return false;
        }
        var names = (fullName || '').split(/\s/g);
        return names.indexOf(name) !== -1;
    };
    Node.prototype.removeName = function (name) {
        var names = (this.name() || '').split(/\s/g);
        var index = names.indexOf(name);
        if (index !== -1) {
            names.splice(index, 1);
            this.setName(names.join(' '));
        }
        return this;
    };
    Node.prototype.setAttr = function (attr, val) {
        var func = this[SET + Util_1.Util._capitalize(attr)];
        if (Util_1.Util._isFunction(func)) {
            func.call(this, val);
        }
        else {
            this._setAttr(attr, val);
        }
        return this;
    };
    Node.prototype._setAttr = function (key, val, skipFire) {
        if (skipFire === void 0) { skipFire = false; }
        var oldVal = this.attrs[key];
        if (oldVal === val && !Util_1.Util.isObject(val)) {
            return;
        }
        if (val === undefined || val === null) {
            delete this.attrs[key];
        }
        else {
            this.attrs[key] = val;
        }
        if (this._shouldFireChangeEvents) {
            this._fireChangeEvent(key, oldVal, val);
        }
    };
    Node.prototype._setComponentAttr = function (key, component, val) {
        var oldVal;
        if (val !== undefined) {
            oldVal = this.attrs[key];
            if (!oldVal) {
                this.attrs[key] = this.getAttr(key);
            }
            this.attrs[key][component] = val;
            this._fireChangeEvent(key, oldVal, val);
        }
    };
    Node.prototype._fireAndBubble = function (eventType, evt, compareShape) {
        if (evt && this.nodeType === SHAPE) {
            evt.target = this;
        }
        var shouldStop = (eventType === MOUSEENTER || eventType === MOUSELEAVE) &&
            ((compareShape &&
                (this === compareShape ||
                    (this.isAncestorOf && this.isAncestorOf(compareShape)))) ||
                (this.nodeType === 'Stage' && !compareShape));
        if (!shouldStop) {
            this._fire(eventType, evt);
            var stopBubble = (eventType === MOUSEENTER || eventType === MOUSELEAVE) &&
                compareShape &&
                compareShape.isAncestorOf &&
                compareShape.isAncestorOf(this) &&
                !compareShape.isAncestorOf(this.parent);
            if (((evt && !evt.cancelBubble) || !evt) &&
                this.parent &&
                this.parent.isListening() &&
                !stopBubble) {
                if (compareShape && compareShape.parent) {
                    this._fireAndBubble.call(this.parent, eventType, evt, compareShape);
                }
                else {
                    this._fireAndBubble.call(this.parent, eventType, evt);
                }
            }
        }
    };
    Node.prototype._getProtoListeners = function (eventType) {
        var listeners = this._cache.get(ALL_LISTENERS);
        if (!listeners) {
            listeners = {};
            var obj = Object.getPrototypeOf(this);
            while (obj) {
                if (!obj.eventListeners) {
                    obj = Object.getPrototypeOf(obj);
                    continue;
                }
                for (var event in obj.eventListeners) {
                    var newEvents = obj.eventListeners[event];
                    var oldEvents = listeners[event] || [];
                    listeners[event] = newEvents.concat(oldEvents);
                }
                obj = Object.getPrototypeOf(obj);
            }
            this._cache.set(ALL_LISTENERS, listeners);
        }
        return listeners[eventType];
    };
    Node.prototype._fire = function (eventType, evt) {
        evt = evt || {};
        evt.currentTarget = this;
        evt.type = eventType;
        var topListeners = this._getProtoListeners(eventType);
        if (topListeners) {
            for (var i = 0; i < topListeners.length; i++) {
                topListeners[i].handler.call(this, evt);
            }
        }
        var selfListeners = this.eventListeners[eventType];
        if (selfListeners) {
            for (var i = 0; i < selfListeners.length; i++) {
                selfListeners[i].handler.call(this, evt);
            }
        }
    };
    Node.prototype.draw = function () {
        this.drawScene();
        this.drawHit();
        return this;
    };
    Node.prototype._createDragElement = function (evt) {
        var pointerId = evt ? evt.pointerId : undefined;
        var stage = this.getStage();
        var ap = this.getAbsolutePosition();
        var pos = stage._getPointerById(pointerId) ||
            stage._changedPointerPositions[0] ||
            ap;
        DragAndDrop_1.DD._dragElements.set(this._id, {
            node: this,
            startPointerPos: pos,
            offset: {
                x: pos.x - ap.x,
                y: pos.y - ap.y,
            },
            dragStatus: 'ready',
            pointerId: pointerId,
        });
    };
    Node.prototype.startDrag = function (evt, bubbleEvent) {
        if (bubbleEvent === void 0) { bubbleEvent = true; }
        if (!DragAndDrop_1.DD._dragElements.has(this._id)) {
            this._createDragElement(evt);
        }
        var elem = DragAndDrop_1.DD._dragElements.get(this._id);
        elem.dragStatus = 'dragging';
        this.fire('dragstart', {
            type: 'dragstart',
            target: this,
            evt: evt && evt.evt,
        }, bubbleEvent);
    };
    Node.prototype._setDragPosition = function (evt, elem) {
        var pos = this.getStage()._getPointerById(elem.pointerId);
        if (!pos) {
            return;
        }
        var newNodePos = {
            x: pos.x - elem.offset.x,
            y: pos.y - elem.offset.y,
        };
        var dbf = this.dragBoundFunc();
        if (dbf !== undefined) {
            var bounded = dbf.call(this, newNodePos, evt);
            if (!bounded) {
                Util_1.Util.warn('dragBoundFunc did not return any value. That is unexpected behavior. You must return new absolute position from dragBoundFunc.');
            }
            else {
                newNodePos = bounded;
            }
        }
        if (!this._lastPos ||
            this._lastPos.x !== newNodePos.x ||
            this._lastPos.y !== newNodePos.y) {
            this.setAbsolutePosition(newNodePos);
            if (this.getLayer()) {
                this.getLayer().batchDraw();
            }
            else if (this.getStage()) {
                this.getStage().batchDraw();
            }
        }
        this._lastPos = newNodePos;
    };
    Node.prototype.stopDrag = function (evt) {
        var elem = DragAndDrop_1.DD._dragElements.get(this._id);
        if (elem) {
            elem.dragStatus = 'stopped';
        }
        DragAndDrop_1.DD._endDragBefore(evt);
        DragAndDrop_1.DD._endDragAfter(evt);
    };
    Node.prototype.setDraggable = function (draggable) {
        this._setAttr('draggable', draggable);
        this._dragChange();
    };
    Node.prototype.isDragging = function () {
        var elem = DragAndDrop_1.DD._dragElements.get(this._id);
        return elem ? elem.dragStatus === 'dragging' : false;
    };
    Node.prototype._listenDrag = function () {
        this._dragCleanup();
        this.on('mousedown.konva touchstart.konva', function (evt) {
            var _this = this;
            var shouldCheckButton = evt.evt['button'] !== undefined;
            var canDrag = !shouldCheckButton || Global_1.Konva.dragButtons.indexOf(evt.evt['button']) >= 0;
            if (!canDrag) {
                return;
            }
            if (this.isDragging()) {
                return;
            }
            var hasDraggingChild = false;
            DragAndDrop_1.DD._dragElements.forEach(function (elem) {
                if (_this.isAncestorOf(elem.node)) {
                    hasDraggingChild = true;
                }
            });
            if (!hasDraggingChild) {
                this._createDragElement(evt);
            }
        });
    };
    Node.prototype._dragChange = function () {
        if (this.attrs.draggable) {
            this._listenDrag();
        }
        else {
            this._dragCleanup();
            var stage = this.getStage();
            if (!stage) {
                return;
            }
            var dragElement = DragAndDrop_1.DD._dragElements.get(this._id);
            var isDragging = dragElement && dragElement.dragStatus === 'dragging';
            var isReady = dragElement && dragElement.dragStatus === 'ready';
            if (isDragging) {
                this.stopDrag();
            }
            else if (isReady) {
                DragAndDrop_1.DD._dragElements.delete(this._id);
            }
        }
    };
    Node.prototype._dragCleanup = function () {
        this.off('mousedown.konva');
        this.off('touchstart.konva');
    };
    Node.create = function (data, container) {
        if (Util_1.Util._isString(data)) {
            data = JSON.parse(data);
        }
        return this._createNode(data, container);
    };
    Node._createNode = function (obj, container) {
        var className = Node.prototype.getClassName.call(obj), children = obj.children, no, len, n;
        if (container) {
            obj.attrs.container = container;
        }
        if (!Global_1._NODES_REGISTRY[className]) {
            Util_1.Util.warn('Can not find a node with class name "' +
                className +
                '". Fallback to "Shape".');
            className = 'Shape';
        }
        var Class = Global_1._NODES_REGISTRY[className];
        no = new Class(obj.attrs);
        if (children) {
            len = children.length;
            for (n = 0; n < len; n++) {
                no.add(Node._createNode(children[n]));
            }
        }
        return no;
    };
    return Node;
}());
exports.Node = Node;
Node.prototype.nodeType = 'Node';
Node.prototype._attrsAffectingSize = [];
Node.prototype.eventListeners = {};
Node.prototype.on.call(Node.prototype, TRANSFORM_CHANGE_STR, function () {
    if (this._batchingTransformChange) {
        this._needClearTransformCache = true;
        return;
    }
    this._clearCache(TRANSFORM);
    this._clearSelfAndDescendantCache(ABSOLUTE_TRANSFORM);
});
Node.prototype.on.call(Node.prototype, 'visibleChange.konva', function () {
    this._clearSelfAndDescendantCache(VISIBLE);
});
Node.prototype.on.call(Node.prototype, 'listeningChange.konva', function () {
    this._clearSelfAndDescendantCache(LISTENING);
});
Node.prototype.on.call(Node.prototype, 'opacityChange.konva', function () {
    this._clearSelfAndDescendantCache(ABSOLUTE_OPACITY);
});
var addGetterSetter = Factory_1.Factory.addGetterSetter;
addGetterSetter(Node, 'zIndex');
addGetterSetter(Node, 'absolutePosition');
addGetterSetter(Node, 'position');
addGetterSetter(Node, 'x', 0, Validators_1.getNumberValidator());
addGetterSetter(Node, 'y', 0, Validators_1.getNumberValidator());
addGetterSetter(Node, 'globalCompositeOperation', 'source-over', Validators_1.getStringValidator());
addGetterSetter(Node, 'opacity', 1, Validators_1.getNumberValidator());
addGetterSetter(Node, 'name', '', Validators_1.getStringValidator());
addGetterSetter(Node, 'id', '', Validators_1.getStringValidator());
addGetterSetter(Node, 'rotation', 0, Validators_1.getNumberValidator());
Factory_1.Factory.addComponentsGetterSetter(Node, 'scale', ['x', 'y']);
addGetterSetter(Node, 'scaleX', 1, Validators_1.getNumberValidator());
addGetterSetter(Node, 'scaleY', 1, Validators_1.getNumberValidator());
Factory_1.Factory.addComponentsGetterSetter(Node, 'skew', ['x', 'y']);
addGetterSetter(Node, 'skewX', 0, Validators_1.getNumberValidator());
addGetterSetter(Node, 'skewY', 0, Validators_1.getNumberValidator());
Factory_1.Factory.addComponentsGetterSetter(Node, 'offset', ['x', 'y']);
addGetterSetter(Node, 'offsetX', 0, Validators_1.getNumberValidator());
addGetterSetter(Node, 'offsetY', 0, Validators_1.getNumberValidator());
addGetterSetter(Node, 'dragDistance', null, Validators_1.getNumberValidator());
addGetterSetter(Node, 'width', 0, Validators_1.getNumberValidator());
addGetterSetter(Node, 'height', 0, Validators_1.getNumberValidator());
addGetterSetter(Node, 'listening', true, Validators_1.getBooleanValidator());
addGetterSetter(Node, 'preventDefault', true, Validators_1.getBooleanValidator());
addGetterSetter(Node, 'filters', null, function (val) {
    this._filterUpToDate = false;
    return val;
});
addGetterSetter(Node, 'visible', true, Validators_1.getBooleanValidator());
addGetterSetter(Node, 'transformsEnabled', 'all', Validators_1.getStringValidator());
addGetterSetter(Node, 'size');
addGetterSetter(Node, 'dragBoundFunc');
addGetterSetter(Node, 'draggable', false, Validators_1.getBooleanValidator());
Factory_1.Factory.backCompat(Node, {
    rotateDeg: 'rotate',
    setRotationDeg: 'setRotation',
    getRotationDeg: 'getRotation',
});
Util_1.Collection.mapMethods(Node);
