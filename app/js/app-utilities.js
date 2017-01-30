var jQuery = $ = require('jQuery');

var appUtilities = {
  sbgnNetworkContainer: undefined,
  layoutPropertiesView: undefined,
  generalPropertiesView: undefined,
  pathsBetweenQueryView: undefined,
  getLayoutProperties: function() {
    if (this.layoutPropertiesView === undefined) {
      return undefined;
    }
    return this.layoutPropertiesView.currentLayoutProperties;
  },
  getGeneralProperties: function() {
    if (this.generalPropertiesView === undefined) {
      return undefined;
    }
    return this.generalPropertiesView.currentSBGNProperties;
  },
  setFileContent: function (fileName) {
    var span = document.getElementById('file-name');
    while (span.firstChild) {
      span.removeChild(span.firstChild);
    }
    span.appendChild(document.createTextNode(fileName));
  },
  triggerIncrementalLayout: function () {
    // If 'animate-on-drawing-changes' is false then animate option must be 'end' instead of false
    // If it is 'during' use it as is. Set 'randomize' and 'fit' options to false
    var preferences = {
      randomize: false,
      animate: this.getGeneralProperties().animateOnDrawingChanges ? 'end' : false,
      fit: false
    };
    if (this.layoutPropertiesView.currentLayoutProperties.animate === 'during') {
      delete preferences.animate;
    }

    this.layoutPropertiesView.applyLayout(preferences, true); // layout must not be undoable
  },
  getExpandCollapseOptions: function () {
    var self = this;
    return {
      fisheye: function () {
        return self.getGeneralProperties().rearrangeAfterExpandCollapse;
      },
      animate: function () {
        return self.getGeneralProperties().animateOnDrawingChanges;
      },
      layoutBy: function () {
        if (!self.getGeneralProperties().rearrangeAfterExpandCollapse) {
          return;
        }

        self.triggerIncrementalLayout();
      }
    };
  },
  dynamicResize: function () {
    var win = $(window);//$(this); //this = window

    var windowWidth = win.width();
    var windowHeight = win.height();
    var canvasWidth = 1000;
    var canvasHeight = 680;
    if (windowWidth > canvasWidth)
    {
      var w = windowWidth * 0.9;
      $("#sbgn-network-container").width(w);
      $(".nav-menu").width(w);
      $(".navbar").width(w);
      $("#sbgn-toolbar").width(w);
    }

    if (windowHeight > canvasHeight)
    {
      $("#sbgn-network-container").height(windowHeight * 0.85);
    }
  },
  nodeQtipFunction: function (node) {
    if (node.renderedStyle("label") == node.data("label") && node.data("statesandinfos").length == 0 && node.data("class") != "complex") {
      return;
    }
    
    var qtipContent = chise.getQtipContent(node);
    
    if (!qtipContent) {
      return;
    }
    
    node.qtip({
      content: function () {
        return qtipContent;
      },
      show: {
        ready: true
      },
      position: {
        my: 'top center',
        at: 'bottom center',
        adjust: {
          cyViewport: true
        }
      },
      style: {
        classes: 'qtip-bootstrap',
        tip: {
          width: 16,
          height: 8
        }
      }
    });
  },
  refreshUndoRedoButtonsStatus: function () {
    var ur = cy.undoRedo();
    if (ur.isUndoStackEmpty()) {
      $("#undo-last-action").parent("li").addClass("disabled");
    }
    else {
      $("#undo-last-action").parent("li").removeClass("disabled");
    }

    if (ur.isRedoStackEmpty()) {
      $("#redo-last-action").parent("li").addClass("disabled");
    }
    else {
      $("#redo-last-action").parent("li").removeClass("disabled");
    }
  },
  resetUndoRedoButtons: function () {
    $("#undo-last-action").parent("li").addClass("disabled");
    $("#redo-last-action").parent("li").addClass("disabled");
  }
};

module.exports = appUtilities;