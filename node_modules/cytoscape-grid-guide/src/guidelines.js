module.exports = function (opts, cy, debounce) {


	var RBTree = require("functional-red-black-tree");

	var options = opts;

	var changeOptions = function (opts) {
		options = opts;

		// RBTree always returns null, when low == high
		// to avoid this:
		if (options.guidelinesTolerance == 0)
			options.guidelinesTolerance = 0.001;
	};

	var offset = function(elt) {
		var rect = elt.getBoundingClientRect();

		return {
			top: rect.top + document.documentElement.scrollTop,
			left: rect.left + document.documentElement.scrollLeft
		}
	};

	var getCyScratch = function () {
		var sc = cy.scratch("_guidelines");
		if (!sc)
			sc = cy.scratch("_guidelines", {});

		return sc;
	};

	/* Resize canvas */
	var resizeCanvas = debounce(function () {
		clearDrawing();
		$canvas.height = cy.height();
		$canvas.width = cy.width();
		$canvas.style.position = 'absolute';
		$canvas.style.top = 0;
		$canvas.style.left = 0;
		$canvas.style.zIndex = options.guidelinesStackOrder;

		setTimeout(function () {

			$canvas.height = cy.height();
			$canvas.width = cy.width();

			var canvasBb = offset($canvas);
			var containerBb = offset($container);
			$canvas.style.top = -(canvasBb.top - containerBb.top);
			$canvas.style.left = -(canvasBb.left - containerBb.left);
		}, 0);
	}, 250);

	/* Clear canvas */
	var clearDrawing = function () {
		var width = cy.width();
		var height = cy.height();
		ctx.clearRect(0, 0, width, height);
	};

	/* Create a canvas */
	var $canvas = document.createElement('canvas');
	var $container = cy.container();
	var ctx = $canvas.getContext('2d');
	$container.appendChild( $canvas );

	var resetCanvas = function () {
		$canvas.height = 0;
		$canvas.width = 0;
		$canvas.style.position = 'absolute';
		$canvas.style.top = 0;
		$canvas.style.left = 0;
		$canvas.style.zIndex = options.guidelinesStackOrder;
	};

	resetCanvas();

	/* Global variables */
	var VTree = null;
	var HTree = null;
	var nodeInitPos;
	var excludedNodes;
	var lines = {};
	var panInitPos = {};
	var alignedLocations = {"h" : null, "v" : null};

	/**
	 * Get positions of sides of a node
	 * @param node : a node
	 * @return : object of positions
	 */ 
	lines.getDims = function (node) {
		var pos = node.renderedPosition();
		var width = node.renderedWidth();
		var height = node.renderedHeight();
		var padding = {
			left: Number(node.renderedStyle("padding-left").replace("px", "")),
			right: Number(node.renderedStyle("padding-right").replace("px", "")),
			top: Number(node.renderedStyle("padding-top").replace("px", "")),
			bottom: Number(node.renderedStyle("padding-bottom").replace("px", ""))
		};

		return {
			horizontal: {
				center: (pos.x),
				left: Math.round(pos.x - (padding.left + width / 2)),
				right: Math.round(pos.x + (padding.right + width / 2))
			},
			vertical: {
				center: (pos.y),
				top: Math.round(pos.y - (padding.top + height / 2)),
				bottom: Math.round(pos.y + (padding.bottom + height / 2))
			}
		};
	};

	/**
	 * Initialize trees and initial position of node
	 * @param activeNodes : top most active nodes
	 */
	lines.init = function (activeNodes) {
		VTree = RBTree();
		HTree = RBTree();
		// TODO: seperate initialization of nodeInitPos
		// not necessary to init trees when geometric and distribution alignments are disabled,
		// but reference guideline is enables
		if (!nodeInitPos){
			panInitPos.x = cy.pan("x"); panInitPos.y = cy.pan("y");
			nodeInitPos = activeNodes.renderedPosition();
		}

		var nodes = cy.nodes(":visible");
		excludedNodes = activeNodes.union(activeNodes.ancestors());
		excludedNodes = excludedNodes.union(activeNodes.descendants());
		nodes.not(excludedNodes).each(function (node, i) {
			if(typeof node === "number") {
				node = i;
			}
			var dims = lines.getDims(node);

			["left", "center", "right"].forEach(function (val) {
				var hKey = dims.horizontal[val];
				if (HTree.get(hKey))
					HTree.get(hKey).push(node);
				else
					HTree = HTree.insert(hKey, [node]);
			});

			["top", "center", "bottom"].forEach(function (val) {
				var vKey = dims.vertical[val];
				if (VTree.get(vKey))
					VTree.get(vKey).push(node);
				else
					VTree = VTree.insert(vKey, [node]);
			});

		});
		ctx.lineWidth=options.lineWidth;
		lines.update(activeNodes);
	};

	/* Destroy gobal variables */
	lines.destroy = function () {
		lines.clear();
		VTree = null; HTree = null;
		nodeInitPos = null;
		mouseInitPos = {};
		alignedLocations = {"h" : null, "v" : null};
		if (nodeToAlign){
			nodeToAlign.unlock();
			nodeToAlign = undefined;
		}
	};

	lines.clear = clearDrawing;

	/**
	 * Draw straight line
	 * @param from : initial position
	 * @param to : final position
	 * @param color : color of the line
	 * @param lineStyle : whether line is solid or dashed
	 */
	lines.drawLine = function (from, to, color, lineStyle) {
		ctx.setLineDash(lineStyle);
		ctx.beginPath();
		ctx.moveTo(from.x, from.y);
		ctx.lineTo(to.x, to.y);
		ctx.strokeStyle = color;
		ctx.stroke();
	};

	/**
	 * Draw an arrow
	 * @param position : position of the arrow
	 * @param type : type/directşon of the arrow
	 */
	lines.drawArrow = function(position, type){
		if (type == "right"){
			// right arrow
			ctx.setLineDash([]);	
			ctx.beginPath();
			ctx.moveTo(position.x-5, position.y-5);
			ctx.lineTo(position.x, position.y);
			ctx.lineTo(position.x-5, position.y+5);
			ctx.stroke();
		}
		else if (type == "left"){
			// left arrow
			ctx.setLineDash([]);	
			ctx.beginPath();
			ctx.moveTo(position.x+5, position.y-5);
			ctx.lineTo(position.x, position.y);
			ctx.lineTo(position.x+5, position.y+5);
			ctx.stroke();
		}
		else if (type == "top"){
			// up arrow
			ctx.setLineDash([]);	
			ctx.beginPath();
			ctx.moveTo(position.x-5, position.y+5);
			ctx.lineTo(position.x, position.y);
			ctx.lineTo(position.x+5, position.y+5);
			ctx.stroke();
		}
		else if (type == "bottom"){
			// down arrow
			ctx.setLineDash([]);	
			ctx.beginPath();
			ctx.moveTo(position.x-5, position.y-5);
			ctx.lineTo(position.x, position.y);
			ctx.lineTo(position.x+5, position.y-5);
			ctx.stroke();
		}

	}

	/**
	 * Draw a cross - x
	 * @param position : position of the cross
	 */
	lines.drawCross = function(position){
		ctx.setLineDash([]);	
		ctx.beginPath();
		ctx.moveTo(position.x - 5, position.y + 5);
		ctx.lineTo(position.x + 5, position.y - 5);
		ctx.moveTo(position.x - 5, position.y - 5);
		ctx.lineTo(position.x + 5, position.y + 5);
		ctx.stroke();
	};

	/**
	 * Calculate the amount of offset for distribution guidelines
	 * @param nodes - list of nodes
	 * @param type - horizontal or vertical
	 */
	var calculateOffset = function(nodes, type){
		var minNode = nodes[0], min = lines.getDims(minNode)[type]["center"];
		var maxNode = nodes[0], max = lines.getDims(maxNode)[type]["center"];

		for (var i = 0; i < nodes.length; i++){
			var node = nodes[i];
			if (lines.getDims(node)[type]["center"] < min){
				min = lines.getDims(node)[type]["center"]; minNode = node;
			}
			if (lines.getDims(node)[type]["center"] > max){
				max = lines.getDims(node)[type]["center"]; maxNode = node;
			}
		}

		if (type == "horizontal")
			var offset = (min + max) / 2 < lines.getDims(nodes[1])[type]["center"] ? max + (0.5*maxNode.width() + options.guidelinesStyle.distGuidelineOffset)*cy.zoom() : min - (0.5*minNode.width() + options.guidelinesStyle.distGuidelineOffset)*cy.zoom();
		else
			var offset = (min + max) / 2 < lines.getDims(nodes[1])[type]["center"] ? max + (0.5*maxNode.height() + options.guidelinesStyle.distGuidelineOffset)*cy.zoom() : min - (0.5*minNode.height() + options.guidelinesStyle.distGuidelineOffset)*cy.zoom();

		return offset;
	}
	/** Guidelines for horizontally distributed alignment
	 * @param: node the node to be aligned
	 */
	lines.horizontalDistribution = function(node){
		// variables
		var leftNode = null, rightNode = null;
		var nodeDim = lines.getDims(node);
		var Xcenter = nodeDim["horizontal"]["center"];
		var Ycenter = nodeDim["vertical"]["center"];
		// Find nodes in range and check if they align
		HTree.forEach(function(key, nodes){

			for (var i = 0; i < nodes.length; i++){
				var left = nodes[i];
				var leftDim = lines.getDims(left);
				if (Math.abs(leftDim["vertical"]["center"] - nodeDim["vertical"]["center"]) < options.guidelinesStyle.range*cy.zoom()){
					if ((leftDim["horizontal"]["right"]) == key && 
						nodeDim["horizontal"]["left"] - leftDim["horizontal"]["right"] > options.guidelinesStyle.minDistRange){
						var ripo = Math.round(2*Xcenter)-key;
						HTree.forEach(function($, rightNodes){
							for (var j = 0; j < rightNodes.length; j++){
								var right = rightNodes[j];
								if (Math.abs(lines.getDims(right)["vertical"]["center"] - Ycenter) < options.guidelinesStyle.range*cy.zoom()){
									if (Math.abs(ripo - lines.getDims(right)["horizontal"]["left"]) < 2*options.guidelinesTolerance){
										leftNode = left; rightNode = right;
									}
								}
							}
						}, ripo - options.guidelinesTolerance, ripo + options.guidelinesTolerance);
					}
				}
			}
		}, Xcenter - options.guidelinesStyle.range*cy.zoom(), Xcenter);

		// Draw the lines
		if (leftNode){
			alignedLocations.hd = Xcenter - (lines.getDims(rightNode)["horizontal"]["left"] + lines.getDims(leftNode)["horizontal"]["right"]) / 2.0;
			if (!options.geometricGuideline || alignedLocations.h == null || Math.abs(alignedLocations.h) > Math.abs(alignedLocations.hd)){
				alignedLocations.h = alignedLocations.hd;
			}
			var offset = calculateOffset([leftNode, node, rightNode], "vertical");

			lines.drawLine({
				x: lines.getDims(leftNode)["horizontal"]["right"],
				y: offset
			}, {
				x: nodeDim["horizontal"]["left"],
				y: offset
			}, options.guidelinesStyle.horizontalDistColor, options.guidelinesStyle.horizontalDistLine);

			lines.drawLine({
				x: lines.getDims(rightNode)["horizontal"]["left"],
				y: offset
			}, {
				x: nodeDim["horizontal"]["right"],
				y: offset
			}, options.guidelinesStyle.horizontalDistColor, options.guidelinesStyle.horizontalDistLine);

			lines.drawLine({
				x: lines.getDims(leftNode)["horizontal"]["right"],
				y: offset
			}, {
				x: lines.getDims(leftNode)["horizontal"]["right"],
				y: lines.getDims(leftNode)["vertical"]["center"]
			}, options.guidelinesStyle.horizontalDistColor, options.guidelinesStyle.horizontalDistLine);

			lines.drawLine({
				x: lines.getDims(rightNode)["horizontal"]["left"],
				y: offset
			}, {
				x: lines.getDims(rightNode)["horizontal"]["left"],
				y: lines.getDims(rightNode)["vertical"]["center"]
			}, options.guidelinesStyle.horizontalDistColor, options.guidelinesStyle.horizontalDistLine);

			lines.drawLine({
				x: nodeDim["horizontal"]["left"],
				y: offset
			}, {
				x: nodeDim["horizontal"]["left"],
				y: Ycenter
			}, options.guidelinesStyle.horizontalDistColor, options.guidelinesStyle.horizontalDistLine);

			lines.drawLine({
				x: nodeDim["horizontal"]["right"],
				y: offset
			}, {
				x: nodeDim["horizontal"]["right"],
				y: Ycenter
			}, options.guidelinesStyle.horizontalDistColor, options.guidelinesStyle.horizontalDistLine);

			lines.drawArrow({
				x: lines.getDims(leftNode)["horizontal"]["right"],
				y: offset}, "left");

			lines.drawArrow({
				x: nodeDim["horizontal"]["left"],
				y: offset}, "right");

			lines.drawArrow({
				x: nodeDim["horizontal"]["right"],
				y: offset}, "left");

			lines.drawArrow({
				x: lines.getDims(rightNode)["horizontal"]["left"],
				y: offset}, "right");

		}
		else{
			var state = lines.horizontalDistributionNext(node,"left" );

			if (!state)  
				lines.horizontalDistributionNext(node,"right" );
		}
	}

	/** Guidelines for horizontally distributed alignment
	 * @param: node the node to be aligned
	 */
	lines.verticalDistribution = function(node){
		// variables
		var belowNode = null, aboveNode = null;
		var nodeDim = lines.getDims(node);
		var Xcenter = nodeDim["horizontal"]["center"];
		var Ycenter = nodeDim["vertical"]["center"];
		// Find nodes in range and check if they align
		VTree.forEach(function(key, nodes){

			for (var i = 0; i < nodes.length; i++){
				var below = nodes[i];
				var belowDim = lines.getDims(below);
				if (Math.abs(belowDim["horizontal"]["center"] - nodeDim["horizontal"]["center"]) < options.guidelinesStyle.range*cy.zoom()){
					if (belowDim["vertical"]["bottom"] == key &&
						nodeDim["vertical"]["top"] - belowDim["vertical"]["bottom"] > options.guidelinesStyle.minDistRange){
						var abpo = Math.round((2*Ycenter)-key);
						VTree.forEach(function($, aboveNodes){
							//if (aboveNodes){
							for (var j = 0; j < aboveNodes.length; j++){
								var above = aboveNodes[j];
								if (Math.abs(lines.getDims(above)["horizontal"]["center"] - Xcenter) < options.guidelinesStyle.range*cy.zoom()){
									if (Math.abs(abpo - lines.getDims(above)["vertical"]["top"]) < 2*options.guidelinesTolerance){
										belowNode = below; aboveNode = above;
									}
								}
							}
							//}
						}, abpo - options.guidelinesTolerance, abpo + options.guidelinesTolerance);
					}
				}
			}
		}, Ycenter - options.guidelinesStyle.range*cy.zoom(), Ycenter);

		if (belowNode){
			alignedLocations.vd = Ycenter - (lines.getDims(belowNode)["vertical"]["bottom"] + lines.getDims(aboveNode)["vertical"]["top"]) / 2.0;
			if (!options.geometricGuideline || alignedLocations.v == null || Math.abs(alignedLocations.v) > Math.abs(alignedLocations.vd)){
				alignedLocations.v = alignedLocations.vd;
			}
			var offset = calculateOffset([belowNode, node, aboveNode], "horizontal");
			lines.drawLine({
				y: lines.getDims(belowNode)["vertical"]["bottom"],//renderedPosition("x"),
				x: offset
			}, {
				y: nodeDim["vertical"]["top"],
				x: offset
			}, options.guidelinesStyle.verticalDistColor, options.guidelinesStyle.verticalDistLine);

			lines.drawLine({
				y: lines.getDims(aboveNode)["vertical"]["top"],//renderedPosition("x"),
				x: offset
			}, {
				y: nodeDim["vertical"]["bottom"],
				x: offset
			}, options.guidelinesStyle.verticalDistColor, options.guidelinesStyle.verticalDistLine);

			lines.drawLine({
				y: lines.getDims(belowNode)["vertical"]["bottom"],//renderedPosition("x"),
				x: offset
			}, {
				y: lines.getDims(belowNode)["vertical"]["bottom"],
				x: lines.getDims(belowNode)["horizontal"]["center"]
			}, options.guidelinesStyle.verticalDistColor, options.guidelinesStyle.verticalDistLine);

			lines.drawLine({
				y: lines.getDims(aboveNode)["vertical"]["top"],//renderedPosition("x"),
				x: offset
			}, {
				y: lines.getDims(aboveNode)["vertical"]["top"],
				x: lines.getDims(aboveNode)["horizontal"]["center"]
			}, options.guidelinesStyle.verticalDistColor, options.guidelinesStyle.verticalDistLine);

			lines.drawLine({
				y: nodeDim["vertical"]["bottom"],//renderedPosition("x"),
				x: offset
			}, {
				y: nodeDim["vertical"]["bottom"],//renderedPosition("x"),
				x: Xcenter
			}, options.guidelinesStyle.verticalDistColor, options.guidelinesStyle.verticalDistLine);

			lines.drawLine({
				y: nodeDim["vertical"]["top"],//renderedPosition("x"),
				x: offset
			}, {
				y: nodeDim["vertical"]["top"],//renderedPosition("x"),
				x: Xcenter
			}, options.guidelinesStyle.verticalDistColor, options.guidelinesStyle.verticalDistLine);

			lines.drawArrow({
				x: offset,
				y: lines.getDims(belowNode)["vertical"]["bottom"]}, "top");

			lines.drawArrow({
				x: offset,
				y: nodeDim["vertical"]["top"]}, "bottom");

			lines.drawArrow({
				x: offset,
				y: lines.getDims(aboveNode)["vertical"]["top"]}, "bottom");

			lines.drawArrow({
				x: offset,
				y: nodeDim["vertical"]["bottom"]}, "top");
		}
		else{
			var state = lines.verticalDistributionNext(node,"below" );

			if (!state)  
				lines.verticalDistributionNext(node,"above" );
		}
	}    

	/**
	 * Find geometric alignment lines and draw them
	 * @param type: horizontal or vertical
	 * @param node: the node to be aligned
	 */
	lines.searchForLine = function (type, node) {

		// variables
		var position, target, center, axis, otherAxis, Tree, closestKey;
		var dims = lines.getDims(node)[type];
		var targetKey = Number.MAX_SAFE_INTEGER;

		// initialize Tree
		if ( type == "horizontal"){
			Tree = HTree;
			axis = "y";
			otherAxis = "x";
			alignedLocations.h = null;
		} else{
			Tree = VTree;
			axis = "x";
			otherAxis = "y";
			alignedLocations.v = null;
		}

		center = node.renderedPosition(axis);
		// check if node aligned in any dimension:
		// {center, left, right} or {center, top, bottom}
		for (var dimKey in dims) {
			position = dims[dimKey];

			// find the closest alignment in range of tolerance
			Tree.forEach(function (exKey, nodes) {
				for (var i = 0; i < nodes.length; i++){
					var n = nodes[i];
					if (options.centerToEdgeAlignment || (dimKey != "center" && n.renderedPosition(otherAxis) != exKey) || (dimKey == "center" && n.renderedPosition(otherAxis) == exKey)){
						var dif = Math.abs(center - n.renderedPosition(axis));
						if ( dif < targetKey && dif < options.guidelinesStyle.geometricGuidelineRange*cy.zoom()){
							target = n;
							targetKey = dif;
							closestKey = exKey;
						}
					}
				}
			}, position - Number(options.guidelinesTolerance), position + Number(options.guidelinesTolerance));

			// if alignment found, draw lines and break
			if (target) {
				targetKey = lines.getDims(node)[type][dimKey];

				// Draw horizontal or vertical alignment line
				if (type == "horizontal") {
					alignedLocations.h = targetKey - closestKey;
					lines.drawLine({
						x: targetKey,
						y: node.renderedPosition("y")
					}, {
						x: targetKey,
						y: target.renderedPosition("y")
					}, options.guidelinesStyle.strokeStyle, options.guidelinesStyle.lineDash);
				} else {
					alignedLocations.v = targetKey - closestKey;
					lines.drawLine({
						x: node.renderedPosition("x"),
						y: targetKey
					}, {
						x: target.renderedPosition("x"),
						y: targetKey
					}, options.guidelinesStyle.strokeStyle, options.guidelinesStyle.lineDash);
				}
				break;
			}
		}
	};

	lines.horizontalDistributionNext = function(node, type){

		// variables
		var leftNode = null, rightNode = null;
		var nodeDim = lines.getDims(node);
		var Xcenter = nodeDim["horizontal"]["center"];
		var Ycenter = nodeDim["vertical"]["center"];
		var side = "right", otherSide = "left";
		var lowerBound = Xcenter;
		if (type == "left"){
			side = "left"; otherSide = "right";
			var lowerBound = Xcenter - options.guidelinesStyle.range*cy.zoom();
		}

		var compare = {
			"left": function (x, y) { return y - x > options.guidelinesStyle.minDistRange},
			"right": function (x, y) { return x - y > options.guidelinesStyle.minDistRange}
		}

		// Find nodes in range and check if they align
		HTree.forEach(function(key, nodes){
			for (var i = 0; i < nodes.length; i++){
				var left = nodes[i];
				var leftDim = lines.getDims(left);
				if (Math.abs(leftDim["vertical"]["center"] - nodeDim["vertical"]["center"]) < options.guidelinesStyle.range*cy.zoom()){
					if ((leftDim["horizontal"][otherSide]) == key && 
						compare[type](leftDim["horizontal"][otherSide], nodeDim["horizontal"][side])){
						var ll = leftDim["horizontal"][side]-(nodeDim["horizontal"][side] - key);
						HTree.forEach(function($, rightNodes){
							for (var j = 0; j < rightNodes.length; j++){
								var right = rightNodes[j];
								if (Math.abs(lines.getDims(right)["vertical"]["center"] - Ycenter) < options.guidelinesStyle.range*cy.zoom()){
									if (Math.abs(ll - lines.getDims(right)["horizontal"][otherSide]) < 2*options.guidelinesTolerance){
										leftNode = left; rightNode = right;
									}
								}
							}
						}, ll - options.guidelinesTolerance, ll + options.guidelinesTolerance);
					}
				}
			}
		}, lowerBound, lowerBound + options.guidelinesStyle.range*cy.zoom());

		// Draw the lines
		if (leftNode){
			alignedLocations.hd =(lines.getDims(node)["horizontal"][side] - lines.getDims(leftNode)["horizontal"][otherSide]) - (lines.getDims(leftNode)["horizontal"][side] - lines.getDims(rightNode)["horizontal"][otherSide]);
			if (!options.geometricGuideline || alignedLocations.h == null || Math.abs(alignedLocations.h) > Math.abs(alignedLocations.hd)){
				alignedLocations.h = alignedLocations.hd;
			}

			lines.drawDH(node, leftNode, rightNode, type);
			return true;
		}
		else if (!options.geometricGuideline){
			alignedLocations.h = null;
		}
		return false;

	}

	lines.drawDH = function(node, leftNode, rightNode, type){
		var Ycenter = lines.getDims(node)["vertical"]["center"];
		var side = "right", otherSide = "left";
		if (type == "left"){
			side = "left"; otherSide = "right";
		}
		var offset = calculateOffset([leftNode, node, rightNode], "vertical");

		lines.drawLine({
			x: lines.getDims(leftNode)["horizontal"][otherSide],
			y: offset
		}, {
			x: lines.getDims(node)["horizontal"][side],
			y: offset
		}, options.guidelinesStyle.horizontalDistColor, options.guidelinesStyle.horizontalDistLine);

		lines.drawLine({
			x: lines.getDims(node)["horizontal"][side],
			y: offset
		}, {
			x: lines.getDims(node)["horizontal"][side],
			y: Ycenter,//lines.getDims(leftNode)["vertical"]["center"]
		}, options.guidelinesStyle.horizontalDistColor, options.guidelinesStyle.horizontalDistLine);

		lines.drawLine({
			x: lines.getDims(rightNode)["horizontal"][otherSide],
			y: offset
		}, {
			x: lines.getDims(leftNode)["horizontal"][side],
			y: offset
		}, options.guidelinesStyle.horizontalDistColor, options.guidelinesStyle.horizontalDistLine);
		lines.drawLine({
			x: lines.getDims(rightNode)["horizontal"][otherSide],
			y: offset
		}, {
			x: lines.getDims(rightNode)["horizontal"][otherSide],
			y: lines.getDims(rightNode)["vertical"]["center"]
		}, options.guidelinesStyle.horizontalDistColor, options.guidelinesStyle.horizontalDistLine);

		lines.drawLine({
			x: lines.getDims(leftNode)["horizontal"][otherSide],
			y: offset
		}, {
			x: lines.getDims(leftNode)["horizontal"][otherSide],
			y: lines.getDims(leftNode)["vertical"]["center"]
		}, options.guidelinesStyle.horizontalDistColor, options.guidelinesStyle.horizontalDistLine);

		lines.drawLine({
			x: lines.getDims(leftNode)["horizontal"][side],
			y: offset
		}, {
			x: lines.getDims(leftNode)["horizontal"][side],
			y: lines.getDims(leftNode)["vertical"]["center"]
		}, options.guidelinesStyle.horizontalDistColor, options.guidelinesStyle.horizontalDistLine);


		lines.drawArrow({
			x: lines.getDims(node)["horizontal"][side],
			y: offset}, otherSide);

		lines.drawArrow({
			x: lines.getDims(leftNode)["horizontal"][otherSide],
			y: offset}, side);

		lines.drawArrow({
			x: lines.getDims(leftNode)["horizontal"][side],
			y: offset}, otherSide);

		lines.drawArrow({
			x: lines.getDims(rightNode)["horizontal"][otherSide],
			y: offset}, side);

	}

	lines.verticalDistributionNext = function(node, type){
		// variables
		var belowNode = null, aboveNode = null;
		var nodeDim = lines.getDims(node);
		var Xcenter = nodeDim["horizontal"]["center"];
		var Ycenter = nodeDim["vertical"]["center"];
		var side = "top", otherSide = "bottom";
		var lowerBound = Ycenter - options.guidelinesStyle.range*cy.zoom();
		if (type == "above"){
			side = "bottom"; otherSide = "top";
			lowerBound = Ycenter;
		}

		var compare = {
			"below": function (x, y) { return y - x > options.guidelinesStyle.minDistRange},
			"above": function (x, y) { return x - y > options.guidelinesStyle.minDistRange}
		}
		// Find nodes in range and check if they align
		VTree.forEach(function(key, nodes){
			for (var i = 0; i < nodes.length; i++){
				var below = nodes[i];
				var belowDim = lines.getDims(below);
				if (Math.abs(belowDim["horizontal"]["center"] - nodeDim["horizontal"]["center"]) < options.guidelinesStyle.range*cy.zoom()){
					if (belowDim["vertical"][otherSide] == key &&
						compare[type](belowDim["vertical"][otherSide], nodeDim["vertical"][side])){
						var ll = belowDim["vertical"][side]-(nodeDim["vertical"][side]-key);
						VTree.forEach(function($, aboveNodes){
							for (var j = 0; j < aboveNodes.length; j++){
								var above = aboveNodes[j];
								if (Math.abs(lines.getDims(above)["horizontal"]["center"] - Xcenter) < options.guidelinesStyle.range*cy.zoom()){
									if (Math.abs(ll - lines.getDims(above)["vertical"][otherSide]) < 2*options.guidelinesTolerance){
										belowNode = below; aboveNode = above;
									}
								}
							}
						}, ll - options.guidelinesTolerance, ll + options.guidelinesTolerance);
					}
				}
			}
		}, lowerBound, lowerBound+options.guidelinesStyle.range*cy.zoom());

		if (belowNode){
			alignedLocations.vd =(lines.getDims(node)["vertical"][side] - lines.getDims(belowNode)["vertical"][otherSide]) - (lines.getDims(belowNode)["vertical"][side] - lines.getDims(aboveNode)["vertical"][otherSide]);
			if (!options.geometricGuideline || alignedLocations.v == null || Math.abs(alignedLocations.v) > Math.abs(alignedLocations.vd)){
				alignedLocations.v = alignedLocations.vd;
			}
			lines.drawDV(node, belowNode, aboveNode, type);
			return true;
		}
		else if (!options.geometricGuideline){
			alignedLocations.v = null;
		}
		return false;
	}



	lines.drawDV = function(node, belowNode, aboveNode, type){
		var nodeDim = lines.getDims(node);
		var Xcenter = nodeDim["horizontal"]["center"];
		var side = "top", otherSide = "bottom";
		if (type == "above"){
			side = "bottom"; otherSide = "top";
		}

		var offset = calculateOffset([belowNode, node, aboveNode], "horizontal");
		lines.drawLine({
			x: offset,
			y: nodeDim["vertical"][side]
		}, {
			x: offset,
			y: lines.getDims(belowNode)["vertical"][otherSide]
		}, options.guidelinesStyle.verticalDistColor, options.guidelinesStyle.verticalDistLine);

		lines.drawLine({
			x: offset,
			y: lines.getDims(belowNode)["vertical"][side]
		}, {
			x: offset,
			y: lines.getDims(aboveNode)["vertical"][otherSide]
		}, options.guidelinesStyle.verticalDistColor, options.guidelinesStyle.verticalDistLine);

		lines.drawLine({
			x: Xcenter,
			y: nodeDim["vertical"][side]
		}, {
			x: offset,
			y: nodeDim["vertical"][side]
		}, options.guidelinesStyle.verticalDistColor, options.guidelinesStyle.verticalDistLine);

		lines.drawLine({
			x: lines.getDims(belowNode)["horizontal"]["center"],
			y: lines.getDims(belowNode)["vertical"][otherSide]
		}, {
			x: offset,
			y: lines.getDims(belowNode)["vertical"][otherSide]
		}, options.guidelinesStyle.verticalDistColor, options.guidelinesStyle.verticalDistLine);

		lines.drawLine({
			x: lines.getDims(belowNode)["horizontal"]["center"],
			y: lines.getDims(belowNode)["vertical"][side]
		}, {
			x: offset,
			y: lines.getDims(belowNode)["vertical"][side]
		}, options.guidelinesStyle.verticalDistColor, options.guidelinesStyle.verticalDistLine);

		lines.drawLine({
			x: offset,//lines.getDims(aboveNode)["horizontal"]["center"],
			y: lines.getDims(aboveNode)["vertical"][otherSide]
		}, {
			x: lines.getDims(aboveNode)["horizontal"]["center"],
			y: lines.getDims(aboveNode)["vertical"][otherSide]
		}, options.guidelinesStyle.verticalDistColor, options.guidelinesStyle.verticalDistLine);

		lines.drawArrow({
			x: offset,
			y: nodeDim["vertical"][side]}, otherSide);

		lines.drawArrow({
			x: offset,
			y: lines.getDims(belowNode)["vertical"][otherSide]}, side);

		lines.drawArrow({
			x: offset,
			y: lines.getDims(belowNode)["vertical"][side]}, otherSide);

		lines.drawArrow({
			x: offset,
			y: lines.getDims(aboveNode)["vertical"][otherSide]}, side);

	}
	lines.update = function (activeNodes) {
		lines.clear();

		if (options.initPosAlignment){
			mouseLine(activeNodes);
		}

		activeNodes.each(function (node, i) {
			if(typeof node === "number") {
				node = i;
			}
			if (options.geometricGuideline){
				lines.searchForLine("horizontal", node);
				lines.searchForLine("vertical", node);
			}

			if (options.distributionGuidelines){
				lines.horizontalDistribution(node);
				lines.verticalDistribution(node);
			}
		});

	};

	lines.resize = function () {
		resizeCanvas();
	};

	function getTopMostNodes(nodes) {
		var nodesMap = {};

		for (var i = 0; i < nodes.length; i++) {
			nodesMap[nodes[i].id()] = true;
		}

		var roots = nodes.filter(function (ele, i) {
			if(typeof ele === "number") {
				ele = i;
			}

			var parent = ele.parent()[0];
			while (parent != null) {
				if (nodesMap[parent.id()]) {
					return false;
				}
				parent = parent.parent()[0];
			}
			return true;
		});

		return roots;
	}

	var mouseInitPos = {};
	var mouseRelativePos = {};
	var getMousePos = function(e){
		mouseInitPos = e.renderedPosition || e.cyRenderedPosition;
		mouseRelativePos.x = mouseInitPos.x;
		mouseRelativePos.y = mouseInitPos.y;
	}
	var setMousePos = function(panCurrPos){
		mouseRelativePos.x += (panCurrPos.x - panInitPos.x);
		mouseRelativePos.y += (panCurrPos.y - panInitPos.y);
		panInitPos.x = panCurrPos.x; panInitPos.y = panCurrPos.y;
	};
	var mouseLine = function(node){
		var nodeCurrentPos = node.renderedPosition();	
		if (Math.abs(nodeInitPos.y - nodeCurrentPos.y) < options.guidelinesTolerance){
			lines.drawLine({
				"x" : mouseRelativePos.x,
				"y" : mouseInitPos.y
			}, {
				"x" : nodeCurrentPos.x,
				"y" : mouseInitPos.y
			}, options.guidelinesStyle.initPosAlignmentColor, options.guidelinesStyle.initPosAlignmentLine);
			if (mouseInitPos.y == mouseRelativePos.y){
				lines.drawCross(mouseRelativePos);
			}
			else{
				lines.drawCross(mouseInitPos);
			}
		}
		else if (Math.abs(nodeInitPos.x - nodeCurrentPos.x) < options.guidelinesTolerance){
			lines.drawLine({
				"x" : mouseInitPos.x,
				"y" : mouseRelativePos.y
			}, {
				"x" : mouseInitPos.x,
				"y" : nodeCurrentPos.y
			}, options.guidelinesStyle.initPosAlignmentColor, options.guidelinesStyle.initPosAlignmentLine);
			if (mouseInitPos.x == mouseRelativePos.x){
				lines.drawCross(mouseRelativePos);
			}
			else{
				lines.drawCross(mouseInitPos);
			}
		}
	}

	function moveNodes(positionDiff, nodes) {
		// Get the descendants of top most nodes. Note that node.position() can move just the simple nodes.
		var topMostNodes = getTopMostNodes(nodes);
		var nodesToMove = topMostNodes.union(topMostNodes.descendants());

		nodesToMove.filter(":childless").forEach(function(node, i) {
			if(typeof node === "number") {
				node = i;
			}
			var newPos = {x: positionDiff.x + node.renderedPosition("x"),
				y: positionDiff.y + node.renderedPosition("y")};

			node.renderedPosition(newPos);
		});
	}

	var tappedNode;
	cy.on("tapstart", "node", function(){tappedNode = this});

	var currMousePos, oldMousePos = {"x": 0, "y": 0};
	cy.on("mousemove", function(e){
		currMousePos = e.renderedPosition || e.cyRenderedPosition;
		if (nodeToAlign)
			nodeToAlign.each(function (node, i){
				if(typeof node === "number") {
					node = i;
				}
				if (node.locked() && (Math.abs(currMousePos.x - oldMousePos.x) > 2*options.guidelinesTolerance
					|| Math.abs(currMousePos.y - oldMousePos.y) > 2*options.guidelinesTolerance)){

					node.unlock();
					var diff = {};
					diff.x = currMousePos.x - tappedNode.renderedPosition("x");
					diff.y = currMousePos.y - tappedNode.renderedPosition("y");;
					moveNodes(diff, node);
				};
			});

	});
	var nodeToAlign;
	lines.snapToAlignmentLocation = function(activeNodes){
		nodeToAlign = activeNodes;
		activeNodes.each(function (node, i){
			if(typeof node === "number") {
				node = i;
			}
			var newPos = node.renderedPosition();
			if (alignedLocations.h){
				oldMousePos = currMousePos;
				newPos.x -= alignedLocations.h;
				node.renderedPosition(newPos);
			}
			if (alignedLocations.v){
				oldMousePos = currMousePos;
				newPos.y -= alignedLocations.v;
				node.renderedPosition(newPos);
			};
			if (alignedLocations.v || alignedLocations.h){
				alignedLocations.h = null;
				alignedLocations.v = null;
				nodeToAlign.lock();
			}
		});
		lines.update(activeNodes);
	}

	return {
		changeOptions: changeOptions,
		lines: lines,
		getTopMostNodes: getTopMostNodes,
		getMousePos: getMousePos,
		setMousePos: setMousePos,
		resizeCanvas: resizeCanvas,
		resetCanvas: resetCanvas,
	}
};
