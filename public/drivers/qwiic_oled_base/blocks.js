import * as Blockly from 'blockly/core';
import { pythonGenerator } from 'blockly/python';

/* --------------------- OLED CONNECT BLOCK --------------------- */

Blockly.Blocks['OLED_connect'] = {
  init: function () {
    this.appendDummyInput()
      .appendField("OLED Connect")
      .appendField("address")
      .appendField(new Blockly.FieldDropdown([
        ["0x3D (default)", "0x3D"],
        ["0x3C (alt)", "0x3C"]
      ]), "ADDRESS");

    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#7b5ba5");
    this.setTooltip("Initialize the Qwiic OLED display.");
    this.setHelpUrl("");
  }
};

/* Python generator helper */
function ensureOledSetup(addr) {
  pythonGenerator.definitions_ = pythonGenerator.definitions_ || {};
  pythonGenerator.definitions_['import_qwiic_oled'] = 'import qwiic_oled';

  // Only set up once
  if (!pythonGenerator.definitions_['oled_setup']) {
    pythonGenerator.definitions_['oled_setup'] =
      'oled = qwiic_oled.QwiicOledBase(address=' + addr + ')\n' +
      'oled.begin()\n' +
      'oled.clear(oled.ALL)\n' +
      'oled.display()';
  }
}

pythonGenerator.forBlock['OLED_connect'] = function (block) {
  var addr = block.getFieldValue('ADDRESS') || "0x3D";
  ensureOledSetup(addr);
  return ''; // nothing to append; setup occurs in definitions
};

/* --------------------- OLED CLEAR BLOCK --------------------- */

Blockly.Blocks['OLED_clear'] = {
  init: function () {
    this.appendDummyInput()
      .appendField("OLED Clear Screen");

    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#7b5ba5");
    this.setTooltip("Clear the entire OLED display.");
    this.setHelpUrl("");
  }
};

pythonGenerator.forBlock['OLED_clear'] = function (block) {
  return 'oled.clear(oled.ALL)\n' +
         'oled.display()\n';
};

/* --------------------- OLED WRITE (MULTI-LINE) --------------------- */

Blockly.Blocks['OLED_write'] = {
  init: function () {
    this.setColour("#7b5ba5");
    this.appendDummyInput().appendField("OLED Write");

    // Mutator for dynamic number of lines
    this.appendValueInput("LINE0")
      .setCheck(null)
      .appendField("line");

    this.setInputsInline(false);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);

    this.setTooltip("Write one or more lines of text to the OLED. Overwrites previous content.");
    this.setHelpUrl("");

    this.lineCount_ = 1;
    this.setMutator(new Blockly.Mutator(['OLED_write_line']));
  },

  mutationToDom: function () {
    var container = document.createElement('mutation');
    container.setAttribute('line_count', this.lineCount_);
    return container;
  },

  domToMutation: function (xmlElement) {
    this.lineCount_ = parseInt(xmlElement.getAttribute('line_count'), 10);
    this.updateShape_();
  },

  decompose: function (workspace) {
    var containerBlock = workspace.newBlock('OLED_write_container');
    containerBlock.initSvg();
    var connection = containerBlock.getInput('STACK').connection;

    for (let i = 1; i < this.lineCount_; i++) {
      var itemBlock = workspace.newBlock('OLED_write_line');
      itemBlock.initSvg();
      connection.connect(itemBlock.previousConnection);
      connection = itemBlock.nextConnection;
    }

    return containerBlock;
  },

  compose: function (containerBlock) {
    var itemBlock = containerBlock.getInputTargetBlock('STACK');

    var connections = [];
    while (itemBlock) {
      connections.push(itemBlock.valueConnection_);
      itemBlock = itemBlock.nextConnection &&
                  itemBlock.nextConnection.targetBlock();
    }

    this.lineCount_ = connections.length + 1;
    this.updateShape_();

    for (let i = 0; i < this.lineCount_; i++) {
      if (connections[i]) {
        this.getInput("LINE" + i).connection.connect(connections[i]);
      }
    }
  },

  saveConnections: function (containerBlock) {
    var itemBlock = containerBlock.getInputTargetBlock('STACK');
    var i = 1;
    while (itemBlock) {
      var input = this.getInput("LINE" + i);
      itemBlock.valueConnection_ = input && input.connection.targetConnection;
      i++;
      itemBlock = itemBlock.nextConnection &&
                  itemBlock.nextConnection.targetBlock();
    }
  },

  updateShape_: function () {
    // Remove old inputs
    let i = 0;
    while (this.getInput("LINE" + i)) {
      this.removeInput("LINE" + i);
      i++;
    }

    // Re-add inputs
    for (let j = 0; j < this.lineCount_; j++) {
      this.appendValueInput("LINE" + j)
        .setCheck(null)
        .appendField("line");
    }
  }
};

/* Mutator container block */
Blockly.Blocks['OLED_write_container'] = {
  init: function () {
    this.appendDummyInput().appendField("add/remove lines");
    this.appendStatementInput("STACK");
    this.setColour("#7777aa");
    this.setTooltip("Add or remove lines for OLED Write.");
    this.contextMenu = false;
  }
};

/* Mutator line block */
Blockly.Blocks['OLED_write_line'] = {
  init: function () {
    this.appendDummyInput().appendField("line");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#7777aa");
    this.contextMenu = false;
  }
};

/* Python generator for OLED_write */

pythonGenerator.forBlock['OLED_write'] = function (block) {
  let code = "";

  // Clear only page buffer (not full hardware)
  code += "oled.clear(oled.PAGE)\n";

  // Loop through all lines
  for (let i = 0; i < block.lineCount_; i++) {
    let text = pythonGenerator.valueToCode(block, "LINE" + i, pythonGenerator.ORDER_NONE) || "''";

    code +=
      "oled.set_cursor(0, oled.font_height * " + i + ")\n" +
      "oled.print(str(" + text + "))\n";
  }

  code += "oled.display()\n";

  return code;
};