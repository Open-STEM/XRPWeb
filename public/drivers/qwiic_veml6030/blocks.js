import * as Blockly from 'blockly/core';
import { pythonGenerator } from 'blockly/python';

Blockly.Blocks['VEML6030_connect'] = {
  init: function() {
    this.appendDummyInput()
      .appendField("VEML6030 Connect")
      .appendField("address")
      .appendField(new Blockly.FieldDropdown([
        ["0x48 (default)", "0x48"],
        ["0x10 (closed)", "0x10"]
      ]), "ADDRESS");

    this.appendDummyInput()
      .appendField("gain")
      .appendField(new Blockly.FieldDropdown([
        ["1/8x", "0.125"],
        ["1/4x", "0.25"],
        ["1x", "1.0"],
        ["2x", "2.0"]
      ]), "GAIN");

    this.appendDummyInput()
      .appendField("integration (ms)")
      .appendField(new Blockly.FieldDropdown([
        ["25", "25"],
        ["50", "50"],
        ["100", "100"],
        ["200", "200"],
        ["400", "400"],
        ["800", "800"]
      ]), "INTEG");

    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#7b5ba5");
    this.setTooltip("Initialize the VEML6030 ambient light sensor (address, gain, and integration time).");
    this.setHelpUrl("")
  }
};

Blockly.Blocks['VEML6030_read'] = {
  init: function () {
    this.appendDummyInput().appendField("VEML6030 Read (lux)");
    this.setOutput(true, "Number");
    this.setColour("#7b5ba5");
    this.setTooltip("Read the current ambient light level in lux from the VEML6030.");
    this.setHelpUrl("");
  }
};

function ensureVemlSetup(addressLiteral) {
  pythonGenerator.definitions_ = pythonGenerator.definitions_ || {};
  pythonGenerator.definitions_['import_qwiic_veml6030'] = 'import qwiic_veml6030';
  var addr = addressLiteral || '0x48';
  var setupKey = 'veml6030_setup';
  if (!pythonGenerator.definitions_[setupKey]) {
    pythonGenerator.definitions_[setupKey] = 
      'veml6030 = qwiic_veml6030.QwiicVEML6030(address=' + addr + ')\n' +
      'veml6030.begin()';
  }
}

pythonGenerator.forBlock = pythonGenerator.forBlock || {};

pythonGenerator.forBlock['VEML6030_connect'] = function (block) {
  var address = block.getFieldValue('ADDRESS') || '0x48';
  var gain = block.getFieldValue('GAIN') || '1.0';
  var integ = block.getFieldValue('INTEG') || '100';
  ensureVemlSetup(address);
  return (
    'veml6030.set_gain(' + gain + ')\n' + 
    'veml6030.set_integ_time(' + integ + ')\n'
  );
};

pythonGenerator.forBlock['VEML6030_read'] = function (block) {
  ensureVemlSetup();
  var order = pythonGenerator.ORDER_FUNCTION_CALL || 0;
  return ['veml6030.read_light()', order];
}