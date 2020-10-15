const AColorPicker = require('a-color-picker');
let pickedColors = [];
let activeColorInputElemId = '';
let picker = null;

function init() {
  if (picker) {
    picker[0].palette = pickedColors;
    return;
  }
  const pickerElemId = '#color-picker-div';
  // generate color picker
  picker = AColorPicker.from(pickerElemId, { palette: pickedColors });
  picker.off('change');
  picker.on('change', function (_, color) {
    $(activeColorInputElemId).val(AColorPicker.parseColor(color, 'hex'));
  });
  picker.off('coloradd');
  picker.on('coloradd', function (_, color) {
    pickedColors.push(AColorPicker.parseColor(color, 'hex'));
  });
  picker.off('colorremove');
  picker.on('colorremove', function (_, color) {
    pickedColors.pop(AColorPicker.parseColor(color, 'hex'));
  });
}

/**
 * @date 2019-10-01
 * @param {string} inputElemId - example: '#inspector-color' 
 * @param {function} onModalClosed - called when color picker modal closed 
 * @returns {void}
 */
exports.bindPicker2Input = function (inputElemId, onModalClosed) {
  init();

  const modalId = '#color_picker_modal';
  $(inputElemId).off('click');
  $(inputElemId).on('click', function (e) {
    activeColorInputElemId = inputElemId;
    picker[0].color = $(inputElemId).val();
    // do not open OS dependent color picker
    e.preventDefault();
    $(modalId).modal('show');
    $(modalId).off('hidden.bs.modal');
    $(modalId).on('hidden.bs.modal', function () {
      if (onModalClosed) {
        onModalClosed();
      }
    });
  });
};

