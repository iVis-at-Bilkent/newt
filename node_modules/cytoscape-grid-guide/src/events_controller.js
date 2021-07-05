module.exports = function (cy, snap, resize, snapToGridDuringDrag, drawGrid, guidelines, parentPadding, opts) {

	var feature = function (func) {
		return function (enable) {
			func(enable);
		};
	};

	var controller = {
		snapToGridDuringDrag: new feature(setDiscreteDrag),
		resize: new feature(setResize),
		snapToGridOnRelease: new feature(setSnapToGrid),
		drawGrid: new feature(setDrawGrid),
		guidelines: new feature(setGuidelines),
		parentPadding: new feature(setParentPadding)
	};

	function applyToCyTarget(func, allowParent) {
		return function (e) {
            var cyTarget = e.target || e.cyTarget;
			if (!cyTarget.is(":parent") || allowParent)
				func(cyTarget);
		}
	}

	function applyToAllNodesButNoParent(func) {
		return function () {
			cy.nodes().not(":parent").each(function (ele, i) {
                if(typeof ele === "number") {
                  ele = i;
                }
                
				func(ele);
			});
		};
	}
	function applyToAllNodes(func) {
		return function () {
			cy.nodes().each(function (ele, i) {
                if(typeof ele === "number") {
                  ele = i;
                }
                
				func(ele);
			});
		};
	}

	function eventStatus(enable) {
		return enable ? "on" : "off";
	}


	// Discrete Drag
	function setDiscreteDrag(enable) {
		cy[eventStatus(enable)]("tapstart", "node", snapToGridDuringDrag.onTapStartNode);
	}

	// Resize
	var resizeAllNodes = applyToAllNodesButNoParent(resize.resizeNode);
	var resizeNode = applyToCyTarget(resize.resizeNode);
	var recoverAllNodeDimensions = applyToAllNodesButNoParent(resize.recoverNodeDimensions);

	function setResize(enable) {
		cy[eventStatus(enable)]("ready", resizeAllNodes);
		//  cy[eventStatus(enable)]("style", "node", resizeNode);
		enable ? resizeAllNodes() : recoverAllNodeDimensions();
	}

	// Snap To Grid
	var snapAllNodes = applyToAllNodes(snap.snapNodesTopDown);
	var recoverSnapAllNodes = applyToAllNodes(snap.recoverSnapNode);
	var snapCyTarget = applyToCyTarget(snap.snapNode, true);

	function setSnapToGrid(enable) {
		cy[eventStatus(enable)]("add", "node", snapCyTarget);
		cy[eventStatus(enable)]("ready", snapAllNodes);

		cy[eventStatus(enable)]("free", "node", snap.onFreeNode);

		if (enable) {
			snapAllNodes();
		} else {
			recoverSnapAllNodes();
		}
	}

	// Draw Grid
	var drawGridOnZoom = function () {
		if (currentOptions.zoomDash) drawGrid.drawGrid()
	};
	var drawGridOnPan = function () {
		if (currentOptions.panGrid) drawGrid.drawGrid()
	};

	function setDrawGrid(enable) {
		cy[eventStatus(enable)]('zoom', drawGridOnZoom);
		cy[eventStatus(enable)]('pan', drawGridOnPan);

		if (enable) {
			drawGrid.initCanvas();
      cy.on('resize', drawGrid.resizeCanvas);
		} else {
			drawGrid.clearCanvas();
			drawGrid.resetCanvas();
      cy.off('resize', drawGrid.resizeCanvas);
		}
	}

	// Guidelines
	var activeTopMostNodes = null;
	var guidelinesGrabHandler = function(e){
        var cyTarget = e.target || e.cyTarget;
		var nodes = cyTarget.selected() ? e.cy.$(":selected") : cyTarget;
		activeTopMostNodes = guidelines.getTopMostNodes(nodes.nodes());
		guidelines.lines.init(activeTopMostNodes);
	}
	var guidelinesDragHandler = function(e){
		if (this.id() == activeTopMostNodes.id()){
			guidelines.lines.update(activeTopMostNodes);

			if (currentOptions.snapToAlignmentLocationDuringDrag)
				guidelines.lines.snapToAlignmentLocation(activeTopMostNodes);
		}
	};
	var guidelinesFreeHandler = function(e){
		if (currentOptions.snapToAlignmentLocationOnRelease)
			guidelines.lines.snapToAlignmentLocation(activeTopMostNodes);

		guidelines.lines.destroy();
		activeTopMostNodes = null;
	};
	var guidelinesWindowResizeHandler = function(e){
		guidelines.lines.resize();
	};
	var guidelinesTapHandler = function(e){
		guidelines.getMousePos(e);
	};
	var guidelinesPanHandler = function(e){
		if (activeTopMostNodes){
			guidelines.setMousePos(cy.pan());
			guidelines.lines.init(activeTopMostNodes);
		}
	}
	function setGuidelines(enable) {
		if (enable){
			guidelines.resizeCanvas();
			cy.on("tapstart", "node", guidelinesTapHandler);
			cy.on("grab", guidelinesGrabHandler);
			cy.on("pan", guidelinesPanHandler);
			cy.on("drag", "node", guidelinesDragHandler);
			cy.on("free", guidelinesFreeHandler);
			window.addEventListener('resize', guidelinesWindowResizeHandler);
		}
		else{
			cy.off("tapstart", "node", guidelinesTapHandler);
			cy.off("grab", guidelinesGrabHandler);
			cy.off("pan", guidelinesPanHandler);
			cy.off("drag", "node", guidelinesDragHandler);
			cy.off("free", guidelinesFreeHandler);
			guidelines.resetCanvas();
			window.removeEventListener('resize', guidelinesWindowResizeHandler);
		}
	}

	// Parent Padding
	var setAllParentPaddings = function (enable) {
		parentPadding.setPaddingOfParent(cy.nodes(":parent"), enable);
	};
	var enableParentPadding = function (node) {
		parentPadding.setPaddingOfParent(node, true);
	};


	function setParentPadding(enable) {

		setAllParentPaddings(enable);

		cy[eventStatus(enable)]('ready', setAllParentPaddings);
		cy[eventStatus(enable)]("add", "node:parent", applyToCyTarget(enableParentPadding, true));
	}

	// Sync with options: Enables/disables changed via options.
	var latestOptions = {};
	var currentOptions;

	var specialOpts = {
		drawGrid: ["gridSpacing", "zoomDash", "panGrid", "gridStackOrder", "gridColor", "lineWidth", "lineDash"],
		guidelines: ["gridSpacing", "guidelinesStackOrder", "guidelinesTolerance", "guidelinesStyle", "distributionGuidelines", "range", "minDistRange",  "geometricGuidelineRange"],
		resize: ["gridSpacing"],
		parentPadding: ["gridSpacing", "parentSpacing"],
		snapToGridOnRelease: ["gridSpacing", "snapToGridCenter"]
	};

	function syncWithOptions(options) {
		currentOptions = Object.extend({}, options);
		options.guidelines = options.initPosAlignment ||  options.distributionGuidelines || options.geometricGuideline;
		for (var key in options)
			if (latestOptions[key] != options[key])
				if (controller.hasOwnProperty(key)) {
					controller[key](options[key]);
				} else {
					for (var optsKey in specialOpts) {
						var opts = specialOpts[optsKey];
						if (opts.indexOf(key) >= 0) {
							if(optsKey == "drawGrid") {
								drawGrid.changeOptions(options);
								if (options.drawGrid)
									drawGrid.resizeCanvas();
							}

							if (optsKey == "snapToGridOnRelease"){
								snap.changeOptions(options);
								if (options.snapToGridOnRelease)
									snapAllNodes();
							}

							if(optsKey == "guidelines")
								guidelines.changeOptions(options);

							if (optsKey == "resize") {
								resize.changeOptions(options);
								if (options.resize)
									resizeAllNodes();
							}

							if (optsKey == "parentPadding")
								parentPadding.changeOptions(options);


						}
					}
				}
		latestOptions = Object.extend({}, latestOptions, options);
	}

	return {
		init: syncWithOptions,
		syncWithOptions: syncWithOptions
	};

};
