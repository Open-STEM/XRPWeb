import * as Blockly from 'blockly/core';
import { pythonGenerator } from 'blockly/python';

//blocks
Blockly.Blocks['BME280_connect'] = {
  init: function() {
	this.appendDummyInput()
  	.appendField("BME280 Connect")
  	.appendField("address")
  	.appendField(new Blockly.FieldDropdown([
    	["0x77 (default)", "0x77"],
    	["0x76", "0x76"]
  	]), "ADDRESS");

	this.appendDummyInput()
  	.appendField("mode")
  	.appendField(new Blockly.FieldDropdown([
    	["normal", "3"],
    	["sleep", "0"],
    	["forced", "1"]
  	]), "MODE");

	this.appendDummyInput()
  	.appendField("standby")
  	.appendField(new Blockly.FieldDropdown([
    	["0: 0.5ms", "0"],
    	["1: 62.5ms", "1"],
    	["2: 125ms", "2"],
    	["3: 250ms", "3"],
    	["4: 500ms", "4"],
    	["5: 1000ms", "5"],
    	["6: 10ms", "6"],
    	["7: 20ms", "7"]
  	]), "STANDBY");

	this.appendDummyInput()
  	.appendField("filter")
  	.appendField(new Blockly.FieldDropdown([
    	["off", "0"],
    	["2x", "1"],
    	["4x", "2"],
    	["8x", "3"],
    	["16x", "4"]
  	]), "FILTER");

	this.appendDummyInput()
  	.appendField("oversample")
  	.appendField("temp")
  	.appendField(new Blockly.FieldDropdown([
    	["1x", "1"], ["2x", "2"], ["4x", "4"], ["8x", "8"], ["16x", "16"], ["off", "0"]
  	]), "OS_TEMP")
  	.appendField("press")
  	.appendField(new Blockly.FieldDropdown([
    	["1x", "1"], ["2x", "2"], ["4x", "4"], ["8x", "8"], ["16x", "16"], ["off", "0"]
  	]), "OS_PRESS")
  	.appendField("humid")
  	.appendField(new Blockly.FieldDropdown([
    	["1x", "1"], ["2x", "2"], ["4x", "4"], ["8x", "8"], ["16x", "16"], ["off", "0"]
  	]), "OS_HUM");

	this.setPreviousStatement(true, null);
	this.setNextStatement(true, null);
	this.setColour("#7b5ba5");
	this.setTooltip("Initialize/configure the SparkFun Qwiic BME280 (address, mode, standby time, filter, and oversampling).");
	this.setHelpUrl("");
  }
};

Blockly.Blocks['BME280_set_reference_pressure'] = {
  init: function() {
	this.appendValueInput("PRESS").setCheck("Number")
  	.appendField("BME280 Set reference pressure (Pa)");
	this.setPreviousStatement(true, null);
	this.setNextStatement(true, null);
	this.setColour("#7b5ba5");
	this.setTooltip("Set sea‑level reference pressure used to compute altitude. Default is 101325 Pa.");
	this.setHelpUrl("");
  }
};

Blockly.Blocks['BME280_read_temperature_c'] = {
  init: function() {
	this.appendDummyInput().appendField("BME280 Temperature (°C)");
	this.setOutput(true, "Number");
	this.setColour("#7b5ba5");
	this.setTooltip("Read temperature in °C.");
	this.setHelpUrl("");
  }
};

Blockly.Blocks['BME280_read_temperature_f'] = {
  init: function() {
	this.appendDummyInput().appendField("BME280 Temperature (°F)");
	this.setOutput(true, "Number");
	this.setColour("#7b5ba5");
	this.setTooltip("Read temperature in °F.");
	this.setHelpUrl("");
  }
};

Blockly.Blocks['BME280_read_humidity'] = {
  init: function() {
	this.appendDummyInput().appendField("BME280 Humidity (%RH)");
	this.setOutput(true, "Number");
	this.setColour("#7b5ba5");
	this.setTooltip("Read relative humidity in %RH.");
	this.setHelpUrl("");
  }
};

Blockly.Blocks['BME280_read_pressure_pa'] = {
  init: function() {
	this.appendDummyInput().appendField("BME280 Pressure (Pa)");
	this.setOutput(true, "Number");
	this.setColour("#7b5ba5");
	this.setTooltip("Read pressure in Pascals (Pa).");
	this.setHelpUrl("");
  }
};

Blockly.Blocks['BME280_read_altitude_m'] = {
  init: function() {
	this.appendDummyInput().appendField("BME280 Altitude (m)");
	this.setOutput(true, "Number");
	this.setColour("#7b5ba5");
	this.setTooltip("Compute altitude (meters) using current reference pressure.");
	this.setHelpUrl("");
  }
};

Blockly.Blocks['BME280_read_altitude_ft'] = {
  init: function() {
	this.appendDummyInput().appendField("BME280 Altitude (ft)");
	this.setOutput(true, "Number");
	this.setColour("#7b5ba5");
	this.setTooltip("Compute altitude (feet) using current reference pressure.");
	this.setHelpUrl("");
  }
};

Blockly.Blocks['BME280_read_dewpoint_c'] = {
  init: function() {
	this.appendDummyInput().appendField("BME280 Dew point (°C)");
	this.setOutput(true, "Number");
	this.setColour("#7b5ba5");
	this.setTooltip("Compute dew point in °C.");
	this.setHelpUrl("");
  }
};

Blockly.Blocks['BME280_read_dewpoint_f'] = {
  init: function() {
	this.appendDummyInput().appendField("BME280 Dew point (°F)");
	this.setOutput(true, "Number");
	this.setColour("#7b5ba5");
	this.setTooltip("Compute dew point in °F.");
	this.setHelpUrl("");
  }
};

//ensure setup
function ensureBME280Setup(addressLiteral) {
  pythonGenerator.definitions_ = pythonGenerator.definitions_ || {};
  pythonGenerator.definitions_['import_qwiic_bme280'] = 'import qwiic_bme280';

  const addr = addressLiteral || '0x77';
  if (!pythonGenerator.definitions_['bme280_setup']) {
	pythonGenerator.definitions_['bme280_setup'] =
  	'bme280 = qwiic_bme280.QwiicBme280(address=' + addr + ')\n' +
  	'bme280.begin()\n';
  }
}

//python generators
pythonGenerator.forBlock = pythonGenerator.forBlock || {};

pythonGenerator.forBlock['BME280_connect'] = function(block) {
  const address = block.getFieldValue('ADDRESS') || '0x77';
  const mode = block.getFieldValue('MODE') || '3';
  const standby = block.getFieldValue('STANDBY') || '0';
  const filter = block.getFieldValue('FILTER') || '0';
  const osT = block.getFieldValue('OS_TEMP') || '1';
  const osP = block.getFieldValue('OS_PRESS') || '1';
  const osH = block.getFieldValue('OS_HUM') || '1';

  ensureBME280Setup(address);

  let code = '';
  code += 'bme280.set_standby_time(' + standby + ')\n';
  code += 'bme280.set_filter(' + filter + ')\n';
  code += 'bme280.set_tempature_oversample(' + osT + ')\n'; 	// (sic) matches library name
  code += 'bme280.set_pressure_oversample(' + osP + ')\n';
  code += 'bme280.set_humidity_oversample(' + osH + ')\n';
  code += 'bme280.set_mode(' + mode + ')\n';

  return code;
};

pythonGenerator.forBlock['BME280_set_reference_pressure'] = function(block) {
  ensureBME280Setup();
  const press = pythonGenerator.valueToCode(block, 'PRESS', pythonGenerator.ORDER_NONE) || '101325';
  return 'bme280.set_reference_pressure(' + press + ')\n';
};

pythonGenerator.forBlock['BME280_read_temperature_c'] = function(block) {
  ensureBME280Setup();
  const order = pythonGenerator.ORDER_FUNCTION_CALL || 0;
  return ['bme280.get_temperature_celsius()', order];
};

pythonGenerator.forBlock['BME280_read_temperature_f'] = function(block) {
  ensureBME280Setup();
  const order = pythonGenerator.ORDER_FUNCTION_CALL || 0;
  return ['bme280.get_temperature_fahrenheit()', order];
};

pythonGenerator.forBlock['BME280_read_humidity'] = function(block) {
  ensureBME280Setup();
  const order = pythonGenerator.ORDER_FUNCTION_CALL || 0;
  return ['bme280.read_humidity()', order];
};

pythonGenerator.forBlock['BME280_read_pressure_pa'] = function(block) {
  ensureBME280Setup();
  const order = pythonGenerator.ORDER_FUNCTION_CALL || 0;
  return ['bme280.read_pressure()', order];
};

pythonGenerator.forBlock['BME280_read_altitude_m'] = function(block) {
  ensureBME280Setup();
  const order = pythonGenerator.ORDER_FUNCTION_CALL || 0;
  return ['bme280.get_altitude_meters()', order];
};

pythonGenerator.forBlock['BME280_read_altitude_ft'] = function(block) {
  ensureBME280Setup();
  const order = pythonGenerator.ORDER_FUNCTION_CALL || 0;
  return ['bme280.get_altitude_feet()', order];
};

pythonGenerator.forBlock['BME280_read_dewpoint_c'] = function(block) {
  ensureBME280Setup();
  const order = pythonGenerator.ORDER_FUNCTION_CALL || 0;
  return ['bme280.get_dewpoint_celsius()', order];
};

pythonGenerator.forBlock['BME280_read_dewpoint_f'] = function(block) {
  ensureBME280Setup();
  const order = pythonGenerator.ORDER_FUNCTION_CALL || 0;
  return ['bme280.get_dewpoint_fahrenheit()', order];
};
