/*
* Commonly needed UI Utilities
*/

var libUtilities = require('./lib-utilities');
var libs = libUtilities.getLibs();
var jQuery = $ = libs.jQuery;

module.exports = function () {

 var optionUtilities;
 var options;

 function uiUtilities (param) {
   optionUtilities = param.optionUtilities;
   options = optionUtilities.getOptions();
 }

 uiUtilities.startSpinner = function (className) {
   if (!className) {
     className = 'default-class';
   }

   if ($('.' + className).length === 0) {
     var containerWidth = $(options.networkContainerSelector).width();
     var containerHeight = $(options.networkContainerSelector).height();
     $(options.networkContainerSelector + ':parent').prepend('<i style="position: absolute; z-index: 9999999; left: ' + containerWidth / 2 + 'px; top: ' + containerHeight / 2 + 'px;" class="fa fa-spinner fa-spin fa-3x fa-fw ' + className + '"></i>');
   }
 };

 uiUtilities.endSpinner = function (className) {
   if (!className) {
     className = 'default-class';
   }

   if ($('.' + className).length > 0) {
     $('.' + className).remove();
   }
 };

 return uiUtilities;
};
