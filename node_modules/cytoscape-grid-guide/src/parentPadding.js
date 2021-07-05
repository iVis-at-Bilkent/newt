module.exports = function (opts, cy) {

    var options = opts;
    var ppClass = "_gridParentPadding";
    var padding;

    function initPadding() {
        cy.style()
            .selector('.' + ppClass)
            .style("compound-sizing-wrt-labels", "exclude")
            .style("padding-left", padding)
            .style("padding-right", padding)
            .style("padding-top", padding)
            .style("padding-bottom", padding)
            .update();

    }

    function changeOptions(opts) {
        options = opts;
        padding = options.parentSpacing < 0 ? options.gridSpacing : options.parentSpacing;
        initPadding();
    }

    function setPaddingOfParent(node, enable) {
        if (enable)
            node.addClass(ppClass);
        else
            node.removeClass(ppClass);
    }

    return {
        changeOptions: changeOptions,
        setPaddingOfParent: setPaddingOfParent
    };
};