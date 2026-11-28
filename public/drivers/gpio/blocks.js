import * as Blockly from 'blockly/core';
import { pythonGenerator } from 'blockly/python';

// RP2350 GPIOs on the XRP Controller 2x20 expansion headers.
// Spec: https://docs.sparkfun.com/SparkFun_XRP_Controller/hardware_overview/
const PIN_OPTIONS = [
  ['GPIO0 (DIST Trigger)', '0'],
  ['GPIO1 (DIST Echo)', '1'],
  ['GPIO2 (Motor 4 Enc A)', '2'],
  ['GPIO3 (Motor 4 Enc B)', '3'],
  ['GPIO4 (Qwiic 0 SDA)', '4'],
  ['GPIO5 (Qwiic 0 SCL)', '5'],
  ['GPIO6 (Servo 1)', '6'],
  ['GPIO7 (Servo 3)', '7'],
  ['GPIO8 (Servo 4)', '8'],
  ['GPIO9 (Servo 2)', '9'],
  ['GPIO10 (Motor 4 Phase)', '10'],
  ['GPIO11 (Motor 4 Enable)', '11'],
  ['GPIO12 (Available)', '12'],
  ['GPIO13 (Available)', '13'],
  ['GPIO14 (Available)', '14'],
  ['GPIO15 (Available)', '15'],
  ['GPIO16 (Available)', '16'],
  ['GPIO17 (Available)', '17'],
  ['GPIO18 (Available)', '18'],
  ['GPIO19 (Available)', '19'],
  ['GPIO20 (Motor 3 Phase)', '20'],
  ['GPIO21 (Motor 3 Enable)', '21'],
  ['GPIO22 (Motor 3 Enc A)', '22'],
  ['GPIO23 (Motor 3 Enc B)', '23'],
  ['GPIO24 (Motor R Enc A)', '24'],
  ['GPIO25 (Motor R Enc B)', '25'],
  ['GPIO30 (Motor L Enc A)', '30'],
  ['GPIO31 (Motor L Enc B)', '31'],
  ['GPIO32 (Motor R Phase)', '32'],
  ['GPIO33 (Motor R Enable)', '33'],
  ['GPIO34 (Motor L Phase)', '34'],
  ['GPIO35 (Motor L Enable)', '35'],
  ['GPIO36 (User Button)', '36'],
  ['GPIO37 (RGB LED)', '37'],
  ['GPIO38 (Qwiic 1 SDA)', '38'],
  ['GPIO39 (Qwiic 1 SCL)', '39'],
  ['GPIO40 (Motor L Current)', '40'],
  ['GPIO41 (Motor 3 Current)', '41'],
  ['GPIO42 (Motor 4 Current)', '42'],
  ['GPIO43 (Motor R Current)', '43'],
  ['GPIO44 (Line Left)', '44'],
  ['GPIO45 (Line Right)', '45'],
  ['GPIO46 (VIN Measure)', '46'],
];

Blockly.common.defineBlocksWithJsonArray([
  {
    type: 'gpio_set_value',
    message0: 'set GPIO %1 to %2',
    args0: [
      {
        type: 'field_dropdown',
        name: 'PIN',
        options: PIN_OPTIONS,
      },
      {
        type: 'input_value',
        name: 'VALUE',
        check: ['Number', 'Boolean'],
      },
    ],
    inputsInline: true,
    previousStatement: null,
    nextStatement: null,
    colour: '#7b5ba5',
    tooltip: 'Set a header GPIO pin high (1) or low (0).',
    helpUrl: 'https://docs.sparkfun.com/SparkFun_XRP_Controller/hardware_overview/',
  },
  {
    type: 'gpio_get_value',
    message0: 'get GPIO %1',
    args0: [
      {
        type: 'field_dropdown',
        name: 'PIN',
        options: PIN_OPTIONS,
      },
    ],
    output: 'Number',
    colour: '#7b5ba5',
    tooltip: 'Read a header GPIO pin. The pin is initialized as input with pull-up.',
    helpUrl: 'https://docs.sparkfun.com/SparkFun_XRP_Controller/hardware_overview/',
  },
]);

function ensureMachinePinImport() {
  pythonGenerator.definitions_['import_machine_pin'] = 'from machine import Pin';
}

pythonGenerator.forBlock['gpio_set_value'] = function (block) {
  ensureMachinePinImport();
  const pin = block.getFieldValue('PIN') || '12';
  const variableName = `gpio_${pin}_out`;
  pythonGenerator.definitions_[`${variableName}_setup`] =
    `${variableName} = Pin(${pin}, Pin.OUT)`;
  const value =
    pythonGenerator.valueToCode(block, 'VALUE', pythonGenerator.ORDER_NONE) || '0';
  return `${variableName}.value(${value})\n`;
};

pythonGenerator.forBlock['gpio_get_value'] = function (block) {
  ensureMachinePinImport();
  const pin = block.getFieldValue('PIN') || '12';
  const variableName = `gpio_${pin}_in`;
  pythonGenerator.definitions_[`${variableName}_setup`] =
    `${variableName} = Pin(${pin}, Pin.IN, Pin.PULL_UP)`;
  return [`${variableName}.value()`, pythonGenerator.ORDER_FUNCTION_CALL];
};
