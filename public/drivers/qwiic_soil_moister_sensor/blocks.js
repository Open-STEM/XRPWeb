import * as Blockly from 'blockly/core';
import { pythonGenerator } from 'blockly/python';

/* ---------------------------------------------------------
   Helper: Ensure Soil Moisture Sensor Setup Occurs Once
--------------------------------------------------------- */
function ensureSoilSetup(addressLiteral) {
  pythonGenerator.definitions_ = pythonGenerator.definitions_ || {};
  pythonGenerator.definitions_['import_soil'] = 'import qwiic_soil_moisture';

  let addr = addressLiteral || '0x28';

  if (!pythonGenerator.definitions_['soil_setup']) {
    pythonGenerator.definitions_['soil_setup'] =
      'soil = qwiic_soil_moisture.QwiicSoilMoistureSensor(address=' + addr + ')\n' +
      'soil.begin()';
  }
}

/* ---------------------------------------------------------
   BLOCK: Soil_connect
--------------------------------------------------------- */
Blockly.Blocks['Soil_connect'] = {
  init: function () {
    this.appendDummyInput()
      .appendField("Soil Moisture Connect")
      .appendField("address")
      .appendField(new Blockly.FieldDropdown([
        ["0x28 (default)", "0x28"],
        ["0x08", "0x08"], ["0x09", "0x09"], ["0x0A", "0x0A"], ["0x0B", "0x0B"],
        ["0x0C", "0x0C"], ["0x0D", "0x0D"], ["0x0E", "0x0E"], ["0x0F", "0x0F"],
        ["0x10", "0x10"], ["0x11", "0x11"], ["0x12", "0x12"], ["0x13", "0x13"],
        ["0x14", "0x14"], ["0x15", "0x15"], ["0x16", "0x16"], ["0x17", "0x17"],
        ["0x18", "0x18"], ["0x19", "0x19"], ["0x1A", "0x1A"], ["0x1B", "0x1B"],
        ["0x1C", "0x1C"], ["0x1D", "0x1D"], ["0x1E", "0x1E"], ["0x1F", "0x1F"],
        ["0x20", "0x20"], ["0x21", "0x21"], ["0x22", "0x22"], ["0x23", "0x23"],
        ["0x24", "0x24"], ["0x25", "0x25"], ["0x26", "0x26"], ["0x27", "0x27"],
        ["0x29", "0x29"], ["0x2A", "0x2A"], ["0x2B", "0x2B"], ["0x2C", "0x2C"],
        ["0x2D", "0x2D"], ["0x2E", "0x2E"], ["0x2F", "0x2F"], ["0x30", "0x30"],
        ["0x31", "0x31"], ["0x32", "0x32"], ["0x33", "0x33"], ["0x34", "0x34"],
        ["0x35", "0x35"], ["0x36", "0x36"], ["0x37", "0x37"], ["0x38", "0x38"],
        ["0x39", "0x39"], ["0x3A", "0x3A"], ["0x3B", "0x3B"], ["0x3C", "0x3C"],
        ["0x3D", "0x3D"], ["0x3E", "0x3E"], ["0x3F", "0x3F"]
      ]), "ADDRESS");

    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#7b5ba5");
    this.setTooltip("Initialize the Qwiic Soil Moisture Sensor.");
    this.setHelpUrl("");
  }
};

pythonGenerator.forBlock['Soil_connect'] = function (block) {
  var address = block.getFieldValue('ADDRESS') || "0x28";
  ensureSoilSetup(address);
  return '';  // Setup lives in definitions
};

/* ---------------------------------------------------------
   BLOCK: Soil_read (output number)
--------------------------------------------------------- */
Blockly.Blocks['Soil_read'] = {
  init: function () {
    this.appendDummyInput().appendField("Soil Moisture Read");
    this.setOutput(true, "Number");
    this.setColour("#7b5ba5");
    this.setTooltip("Read the soil moisture value.");
    this.setHelpUrl("");
  }
};

pythonGenerator.forBlock['Soil_read'] = function (block) {
  ensureSoilSetup();
  let order = pythonGenerator.ORDER_FUNCTION_CALL || 0;
  return [
    "(soil.read_moisture_level() or soil.level)", 
    order
  ];
};