/*
 * Listen document for keyboard inputs and exports the utilities that it makes use of
 */

var libUtilities = require('./lib-utilities');
var libs = libUtilities.getLibs();
var jQuery = $ = libs.jQuery;

module.exports = function () {

  function keyboardInputUtilities (param) {

    // Listen to events on network container
    $(document).on('keydown', '.integer-input', function(e){
      var value = $(this).attr('value');
      return keyboardInputUtilities.isIntegerFieldInput(value, e);
    });

    $(document).on('keydown', '.float-input', function(e){
      var value = $(this).attr('value');
      return keyboardInputUtilities.isFloatFieldInput(value, e);
    });

    $(document).on('change', '.integer-input,.float-input', function(e){
      var min   = $(this).attr('min');
      var max   = $(this).attr('max');
      var value = parseFloat($(this).val());

      if(min != null) {
        min = parseFloat(min);
      }

      if(max != null) {
        max = parseFloat(max);
      }

      if(min != null && value < min) {
        value = min;
      }
      else if(max != null && value > max) {
        value = max;
      }

      if(isNaN(value)) {
        if(min != null) {
          value = min;
        }
        else if(max != null) {
          value = max;
        }
        else {
          value = 0;
        }
      }

      $(this).val("" + value);
    });
  }

  keyboardInputUtilities.isNumberKey = function(e) {
    return ( e.keyCode >= 48 && e.keyCode <= 57 ) || ( e.keyCode >= 96 && e.keyCode <= 105 );
  };

  keyboardInputUtilities.isDotKey = function(e) {
    return e.keyCode === 190;
  };

  keyboardInputUtilities.isMinusSignKey = function(e) {
    return e.keyCode === 109 || e.keyCode === 189;
  };

  keyboardInputUtilities.isLeftKey = function(e) {
    return e.keyCode === 37;
  };

  keyboardInputUtilities.isRightKey = function(e) {
    return e.keyCode === 39;
  };

  keyboardInputUtilities.isBackspaceKey = function(e) {
    return e.keyCode === 8;
  };

  keyboardInputUtilities.isTabKey = function(e) {
    return e.keyCode === 9;
  };

  keyboardInputUtilities.isEnterKey = function(e) {
    return e.keyCode === 13;
  };

  keyboardInputUtilities.isIntegerFieldInput = function(value, e) {
    return this.isCtrlOrCommandPressed(e) || this.isMinusSignKey(e) || this.isNumberKey(e)
            || this.isBackspaceKey(e) || this.isTabKey(e) || this.isLeftKey(e) || this.isRightKey(e) || this.isEnterKey(e);
  };

  keyboardInputUtilities.isFloatFieldInput = function(value, e) {
    return this.isIntegerFieldInput(value, e) || this.isDotKey(e);
  };

  keyboardInputUtilities.isCtrlOrCommandPressed = function(e) {
    return e.ctrlKey || e.metaKey;
  };

  return keyboardInputUtilities;
};
