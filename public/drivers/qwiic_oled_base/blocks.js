import * as Blockly from 'blockly/core';
import { pythonGenerator } from 'blockly/python';

// blocks
Blockly.Blocks['oled_connect'] = {
    init: function() {
        this.appendDummyInput()
            .appendField("OLED Connect")
            .appendField("address")
            .appendField(new Blockly.FieldDropdown([
                ["0x3D (default)", "0x3D"],
                ["0x3C (closed)", "0x3C"]
            ]), "ADDRESS");
        this.appendDummyInput()
            .appendField("resolution")
            .appendField(new Blockly.FieldDropdown([
                ["64x48 (Micro OLED)", "64x48"],
                ["128x32", "128x32"],
                ["128x64", "128x0064"]
            ]), "RES");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#7b5ba5");
        this.setTooltip("Create a Qwiic SSD1306 OLED instance and initialize it.");
        this.setHelpUrl("");
    }
};

// setup
function ensureOLEDSetup(addressLiteral, widthLiteral, heightLiteral) {
    pythonGenerator.definitions_ = pythonGenerator.definitions_ || {};
    pythonGenerator.definitions_['import_qwiic_oled_base'] = 'import_qwiic_oled_base';
    const addr = addressLiteral || '0x3D';
    const w = widthLiteral || '64';
    const h = heightLiteral || '48';
    if (!pythonGenerator.definitions_['oled_setup']) {
        pythonGenerator.definitions_['oled_setup'] =
        'oled = qwiic_oled_base.QwiicOledBase(address=' + addr +
        ', pixel_width=' + w + ', pixel_height=' + h + ')\n' +
        'oled.begin()\n';
    }
}

// generators

pythonGenerator.forBlock = pythonGenerator.forBlock || {};