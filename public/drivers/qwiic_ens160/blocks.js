import * as Blockly from 'blockly/core';
import { pythonGenerator } from 'blockly/python'

//blocks
Blockly.Blocks['ENS160_connect'] = {
    init: function() {
        this.appendDummyInput()
            .appendField("ENS160 Connect")
            .appendField("address")
            .appendField(new Blockly.FieldDropdown([
                ["0x53 (default)", "0x53"],
                ["0x52 (closed)", "0x52"]
            ]), "ADDRESS");
        
        this.appendDummyInput()
            .appendField("operating mode")
            .appendField(new Blockly.FieldDropdown([
                ["standard", "0x02"],
                ["idle", "0x01"],
                ["deep sleep", "0x00"]
            ]), "MPDE");
        
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#7b5ba5");
        this.setTooltip("Initialize the Qwiic ENS160 and set its operating mode.");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['ENS160_set_temp_comp_c'] = {
    init: function() {
        this.appendValueInput("TEMP_C").setCheck("Number")
            .appendField("ENS160 Set temperature compensation (°C)");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#7b5ba5");
        this.setTooltip("Provide ambient temperature (°C) for ENS 160 compensation.");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['ENS160_set_rh_comp'] = {
    init: function() {
        this.appendValueInput("RH").setCheck("Number")
            .appendField("ENS160 Set relative humidity compensation (%RH)");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#7b5ba5");
        this.setTooltip("Provide ambient RH (%RH) for ENS160 compensation.");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['ENS160_read_aqi'] = {
    init: function() {
        this.appendDummyInput().appendField("ENS160 AQI (UBA 1-5");
        this.setOutput(true, "NUMBER");
        this.setColour("#7b5ba5");
        this.setTooltip("Read the UBA Air Quality Index (1-5).");
        this.setHelpUrl("");
    }
}

Blockly.Blocks['ENS160_read_tvoc'] = {
    init: function() {
        this.appendDummyInput().appendField("ENS160 TVOC (ppb)");
        this.setOutput(true, "Number");
        this.setColour("#7b5ba5");
        this.setTooltip("Read Total Volatile Organic Compounds in ppb.");
        this.setHelpUrl("");
    }
}

Blockly.Blocks['ENS160_read_eco2'] = {
  init: function() {
	this.appendDummyInput().appendField("ENS160 eCO₂ (ppm)");
	this.setOutput(true, "Number");
	this.setColour("#7b5ba5");
	this.setTooltip("Read equivalent CO₂ in ppm.");
	this.setHelpUrl("");
  }
};

Blockly.Blocks['ENS160_read_etoh'] = {
  init: function() {
	this.appendDummyInput().appendField("ENS160 Ethanol (ppb)");
	this.setOutput(true, "Number");
	this.setColour("#7b5ba5");
	this.setTooltip("Read ethanol concentration in ppb.");
	this.setHelpUrl("");
  }
};

Blockly.Blocks['ENS160_read_comp_temp_c'] = {
  init: function() {
	this.appendDummyInput().appendField("ENS160 Compensation temperature (°C)");
	this.setOutput(true, "Number");
	this.setColour("#7b5ba5");
	this.setTooltip("Read back the temperature compensation value (°C).");
	this.setHelpUrl("");
  }
};

Blockly.Blocks['ENS160_read_comp_rh'] = {
  init: function() {
	this.appendDummyInput().appendField("ENS160 Compensation RH (%RH)");
	this.setOutput(true, "Number");
	this.setColour("#7b5ba5");
	this.setTooltip("Read back the relative humidity compensation value (%RH).");
	this.setHelpUrl("");
  }
};

Blockly.Blocks['ENS160_get_flags'] = {
  init: function() {
	this.appendDummyInput().appendField("ENS160 flags (0=normal, 1=warm-up, 2=start-up, 3=invalid)");
	this.setOutput(true, "Number");
	this.setColour("#7b5ba5");
	this.setTooltip("Read validity flags (0 normal, 1 warm‑up, 2 start‑up, 3 invalid).");
	this.setHelpUrl("");
  }
};

Blockly.Blocks['ENS160_op_active'] = {
  init: function() {
	this.appendDummyInput().appendField("ENS160 operation active?");
	this.setOutput(true, "Boolean");
	this.setColour("#7b5ba5");
	this.setTooltip("True if a valid operating mode is running.");
	this.setHelpUrl("");
  }
};


//ensure setup
function ensureEnsSetup(addressLiteral) {
    pythonGenerator.definitions_ = pythonGenerator.definitions_ || {};
    pythonGenerator.definitions_['import_qwiic_ens160'] = 'imprort qwiic_ens160';
    const addr = addressLiteral || '0x53';
    if (!pythonGenerator.definitions_['ens160_setup']) {
        pythonGenerator.definitions_['ens160_setup'] = 
        'ens160 = qwiic_ens160.QwiicENS160(address=' + addr + ')\n' +
        'ens160.begin()\n';
    }
}

//generators
pythonGenerator.forBlock = pythonGenerator.forBlock || {};

pythonGenerator.forBlock['ENS160_connect'] = function(block) {
    const address = block.getFieldValue('ADDRESS') || ('0x53');
    const mode = block.getFieldValue('MODE') || '0x02';
    ensureEnsSetup(address);
    let code = '';
    code +='ens160.set_operating_mode(' + mode + ')\n';
    return code;
};

pythonGenerator.forBlock['ENS160_set_temp_comp_c'] = function(block) {
    ensureEnsSetup();
    const temp = pythonGenerator.valueToCode(block, 'TEMP_C', pythonGenerator.ORDER_NONE) || '25.0';
    return 'ens160.set_temp_compensation_celsius(' + temp + ')\n';
};

pythonGenerator.forBlock['ENS160_set_rh_comp'] = function(block) {
    ensureEnsSetup();
    const rh = pythonGenerator.valueToCode(block, 'RH', pythonGenerator.ORDER_NONE) || '50.0';
    return 'ens160.set_rh_compensation(' + rh + ')\n';
};

pythonGenerator.forBlock['ENS160_read_aqi'] = function(block) {
    ensureEnsSetup();
    const order = pythonGenerator.ORDER_FUNCTION_CALL || 0;
    return ['ens160.get_aqi()', order];
};

pythonGenerator.forBlock['ENS160_read_tvoc'] = function(block) {
    ensureEnsSetup();
    const order = pythonGenerator.ORDER_FUNCTION_CALL || 0;
    return ['ens160.get_tvoc()', order];
};

pythonGenerator.forBlock['ENS160_read_eco2'] = function(block) {
  ensureEnsSetup();
  const order = pythonGenerator.ORDER_FUNCTION_CALL || 0;
  return ['ens160.get_eco2()', order];
};

pythonGenerator.forBlock['ENS160_read_etoh'] = function(block) {
  ensureEnsSetup();
  const order = pythonGenerator.ORDER_FUNCTION_CALL || 0;
  return ['ens160.get_etoh()', order];
};

pythonGenerator.forBlock['ENS160_read_comp_temp_c'] = function(block) {
  ensureEnsSetup();
  const order = pythonGenerator.ORDER_FUNCTION_CALL || 0;
  return ['ens160.get_temp_celsius()', order];
};

pythonGenerator.forBlock['ENS160_read_comp_rh'] = function(block) {
  ensureEnsSetup();
  const order = pythonGenerator.ORDER_FUNCTION_CALL || 0;
  return ['ens160.get_rh()', order];
};

pythonGenerator.forBlock['ENS160_get_flags'] = function(block) {
  ensureEnsSetup();
  const order = pythonGenerator.ORDER_FUNCTION_CALL || 0;
  return ['ens160.get_flags()', order];
};

pythonGenerator.forBlock['ENS160_op_active'] = function(block) {
  ensureEnsSetup();
  const order = pythonGenerator.ORDER_FUNCTION_CALL || 0;
  return ['ens160.check_operation_status()', order];
};
