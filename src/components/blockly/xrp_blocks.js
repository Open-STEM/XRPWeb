import * as Blockly from 'blockly/core';
/*
    This file creates each Block item for Blockly.
    Labels and tooltips use Blockly.Msg keys merged from i18n in blockly-locales.ts.
*/

/** @param {string} key */
function xrpMsg(key) {
    return Blockly.Msg[key] ?? key;
}

function motorDropdown() {
    return [
        [xrpMsg('XRP_LEFT'), '1'],
        [xrpMsg('XRP_RIGHT'), '2'],
        ['3', '3'],
        ['4', '4'],
    ];
}

function directionDropdown() {
    return [
        [xrpMsg('XRP_REVERSE'), 'True'],
        [xrpMsg('XRP_FORWARD'), 'False'],
    ];
}

function servoDropdown() {
    return [['1', '1'], ['2', '2']];
}

function gamepadButtonDropdown() {
    return [
        ['A', 'BUTTON_A'],
        ['B', 'BUTTON_B'],
        ['X', 'BUTTON_X'],
        ['Y', 'BUTTON_Y'],
        [xrpMsg('XRP_BUMPER_LEFT'), 'BUMPER_L'],
        [xrpMsg('XRP_BUMPER_RIGHT'), 'BUMPER_R'],
        [xrpMsg('XRP_TRIGGER_LEFT'), 'TRIGGER_L'],
        [xrpMsg('XRP_TRIGGER_RIGHT'), 'TRIGGER_R'],
        [xrpMsg('XRP_BACK'), 'BACK'],
        [xrpMsg('XRP_START'), 'START'],
        [xrpMsg('XRP_DPAD_UP'), 'DPAD_UP'],
        [xrpMsg('XRP_DPAD_DOWN'), 'DPAD_DN'],
        [xrpMsg('XRP_DPAD_LEFT'), 'DPAD_L'],
        [xrpMsg('XRP_DPAD_RIGHT'), 'DPAD_R'],
    ];
}

// Individual Motors
Blockly.Blocks['xrp_motor_effort'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(xrpMsg('XRP_MOTOR'))
            .appendField(new Blockly.FieldDropdown(motorDropdown), 'MOTOR')
            .appendField(xrpMsg('XRP_EFFORT'));
        this.appendValueInput('effort')
            .setCheck('Number');
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(352);
        this.setTooltip(xrpMsg('XRP_MOTOR_EFFORT_TOOLTIP'));
        this.setHelpUrl('');
    },
};

Blockly.Blocks['xrp_motor_speed'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(xrpMsg('XRP_MOTOR'))
            .appendField(new Blockly.FieldDropdown(motorDropdown), 'MOTOR')
            .appendField(xrpMsg('XRP_SPEED'));
        this.appendValueInput('speed')
            .setCheck('Number');
        this.appendDummyInput()
            .appendField(xrpMsg('XRP_RPM'));
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(352);
        this.setTooltip(xrpMsg('XRP_MOTOR_SPEED_TOOLTIP'));
        this.setHelpUrl('');
    },
};

Blockly.Blocks['xrp_motor_direction'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(xrpMsg('XRP_MOTOR'))
            .appendField(new Blockly.FieldDropdown(motorDropdown), 'MOTOR')
            .appendField(xrpMsg('XRP_DIRECTION'))
            .appendField(new Blockly.FieldDropdown(directionDropdown), 'DIRECTION');
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(352);
        this.setTooltip(xrpMsg('XRP_MOTOR_DIRECTION_TOOLTIP'));
        this.setHelpUrl('');
    },
};

Blockly.Blocks['xrp_motor_get_speed'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(xrpMsg('XRP_MOTOR'))
            .appendField(new Blockly.FieldDropdown(motorDropdown), 'MOTOR')
            .appendField(xrpMsg('XRP_SPEED'));
        this.setOutput(true, null);
        this.setColour(352);
        this.setTooltip(xrpMsg('XRP_MOTOR_GET_SPEED_TOOLTIP'));
        this.setHelpUrl('');
    },
};

Blockly.Blocks['xrp_motor_get_position'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(xrpMsg('XRP_MOTOR'))
            .appendField(new Blockly.FieldDropdown(motorDropdown), 'MOTOR')
            .appendField(xrpMsg('XRP_POSITION'));
        this.setOutput(true, null);
        this.setColour(352);
        this.setTooltip(xrpMsg('XRP_MOTOR_GET_POSITION_TOOLTIP'));
        this.setHelpUrl('');
    },
};

Blockly.Blocks['xrp_motor_get_count'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(xrpMsg('XRP_MOTOR'))
            .appendField(new Blockly.FieldDropdown(motorDropdown), 'MOTOR')
            .appendField(xrpMsg('XRP_ENCODER_COUNT'));
        this.setOutput(true, null);
        this.setColour(352);
        this.setTooltip(xrpMsg('XRP_MOTOR_GET_COUNT_TOOLTIP'));
        this.setHelpUrl('');
    },
};

Blockly.Blocks['xrp_motor_reset_position'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(xrpMsg('XRP_MOTOR'))
            .appendField(new Blockly.FieldDropdown(motorDropdown), 'MOTOR')
            .appendField(xrpMsg('XRP_RESET_ENCODER'));
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(352);
        this.setTooltip(xrpMsg('XRP_MOTOR_RESET_POSITION_TOOLTIP'));
        this.setHelpUrl('');
    },
};

// DriveTrain
Blockly.Blocks['xrp_straight_effort'] = {
    init: function () {
        this.appendValueInput('dist')
            .setCheck('Number')
            .appendField(xrpMsg('XRP_STRAIGHT'))
            .appendField(xrpMsg('XRP_CM'));
        this.appendValueInput('effort')
            .setCheck('Number')
            .appendField(xrpMsg('XRP_EFFORT'));
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(10);
        this.setTooltip('');
        this.setHelpUrl('');
    },
};

Blockly.Blocks['xrp_turn_effort'] = {
    init: function () {
        this.appendValueInput('degrees')
            .setCheck('Number')
            .appendField(xrpMsg('XRP_TURN_DEG'));
        this.appendValueInput('effort')
            .setCheck('Number')
            .appendField(xrpMsg('XRP_EFFORT'));
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(10);
        this.setTooltip('');
        this.setHelpUrl('');
    },
};

Blockly.Blocks['xrp_seteffort'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(xrpMsg('XRP_SET_EFFORT'));
        this.appendValueInput('LEFT')
            .setCheck('Number')
            .appendField(xrpMsg('XRP_LEFT') + ':');
        this.appendValueInput('RIGHT')
            .setCheck('Number')
            .appendField(xrpMsg('XRP_RIGHT') + ':');
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(10);
        this.setTooltip('');
        this.setHelpUrl('');
    },
};

Blockly.Blocks['xrp_speed'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(xrpMsg('XRP_SET_SPEED'));
        this.appendValueInput('LEFT')
            .setCheck(null)
            .appendField(xrpMsg('XRP_LEFT') + ':');
        this.appendValueInput('RIGHT')
            .setCheck(null)
            .appendField(xrpMsg('XRP_CM_S'))
            .appendField(xrpMsg('XRP_RIGHT') + ':');
        this.appendDummyInput()
            .appendField(xrpMsg('XRP_CM_S'));
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(10);
        this.setTooltip(xrpMsg('XRP_SET_SPEED_TOOLTIP'));
        this.setHelpUrl('');
    },
};

Blockly.Blocks['xrp_arcade'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(xrpMsg('XRP_ARCADE'));
        this.appendValueInput('STRAIGHT')
            .setCheck('Number')
            .appendField(xrpMsg('XRP_STRAIGHT_LABEL'));
        this.appendValueInput('TURN')
            .setCheck('Number')
            .appendField(xrpMsg('XRP_TURN'));
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(10);
        this.setTooltip('');
        this.setHelpUrl('');
    },
};

Blockly.Blocks['xrp_stop_motors'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(xrpMsg('XRP_STOP_MOTORS'));
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(10);
        this.setTooltip('');
        this.setHelpUrl('');
    },
};

Blockly.Blocks['xrp_resetencoders'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(xrpMsg('XRP_RESET_ENCODERS'));
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(10);
        this.setTooltip('');
        this.setHelpUrl('');
    },
};

Blockly.Blocks['xrp_getleftencoder'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(xrpMsg('XRP_LEFT_ENCODER'));
        this.setOutput(true, null);
        this.setColour(10);
        this.setTooltip('');
        this.setHelpUrl('');
    },
};

Blockly.Blocks['xrp_getrightencoder'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(xrpMsg('XRP_RIGHT_ENCODER'));
        this.setOutput(true, null);
        this.setColour(10);
        this.setTooltip('');
        this.setHelpUrl('');
    },
};

// Servo
Blockly.Blocks['xrp_servo_deg'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(xrpMsg('XRP_SERVO'))
            .appendField(new Blockly.FieldDropdown(servoDropdown), 'SERVO')
            .appendField(xrpMsg('XRP_DEG'));
        this.appendValueInput('degrees')
            .setCheck('Number');
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(300);
        this.setTooltip('');
        this.setHelpUrl('');
    },
};

// Sensors - Sonar
Blockly.Blocks['xrp_getsonardist'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(xrpMsg('XRP_SONAR_DISTANCE'));
        this.setOutput(true, null);
        this.setColour(90);
        this.setTooltip('');
        this.setHelpUrl('');
    },
};

// Sensors - Reflectance
Blockly.Blocks['xrp_l_refl'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(xrpMsg('XRP_LEFT_REFLECTANCE'));
        this.setOutput(true, null);
        this.setColour(90);
        this.setTooltip('');
        this.setHelpUrl('');
    },
};

Blockly.Blocks['xrp_r_refl'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(xrpMsg('XRP_RIGHT_REFLECTANCE'));
        this.setOutput(true, null);
        this.setColour(90);
        this.setTooltip('');
        this.setHelpUrl('');
    },
};

Blockly.Blocks['xrp_m_refl'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(xrpMsg('XRP_MIDDLE_REFLECTANCE'));
        this.setOutput(true, null);
        this.setColour(90);
        this.setTooltip('');
        this.setHelpUrl('');
    },
};

// Sensors - Gyro
Blockly.Blocks['xrp_yaw'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(xrpMsg('XRP_YAW'));
        this.setOutput(true, null);
        this.setColour(90);
        this.setTooltip('');
        this.setHelpUrl(xrpMsg('XRP_YAW_HELP'));
    },
};

Blockly.Blocks['xrp_roll'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(xrpMsg('XRP_ROLL'));
        this.setOutput(true, null);
        this.setColour(90);
        this.setTooltip(xrpMsg('XRP_ROLL_TOOLTIP'));
        this.setHelpUrl('');
    },
};

Blockly.Blocks['xrp_pitch'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(xrpMsg('XRP_PITCH'));
        this.setOutput(true, null);
        this.setColour(90);
        this.setTooltip('');
        this.setHelpUrl(xrpMsg('XRP_PITCH_HELP'));
    },
};

// Sensors - Accelerometer
Blockly.Blocks['xrp_acc_x'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(xrpMsg('XRP_ACC_X'));
        this.setOutput(true, null);
        this.setColour(90);
        this.setTooltip('');
        this.setHelpUrl(xrpMsg('XRP_ACC_X_HELP'));
    },
};

Blockly.Blocks['xrp_acc_y'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(xrpMsg('XRP_ACC_Y'));
        this.setOutput(true, null);
        this.setColour(90);
        this.setTooltip('');
        this.setHelpUrl(xrpMsg('XRP_ACC_Y_HELP'));
    },
};

Blockly.Blocks['xrp_acc_z'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(xrpMsg('XRP_ACC_Z'));
        this.setOutput(true, null);
        this.setColour(90);
        this.setTooltip('');
        this.setHelpUrl(xrpMsg('XRP_ACC_Z_HELP'));
    },
};

// Control Board
Blockly.Blocks['xrp_led_on'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(xrpMsg('XRP_LED_ON'));
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(150);
        this.setTooltip('');
        this.setHelpUrl('');
    },
};

Blockly.Blocks['xrp_led_off'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(xrpMsg('XRP_LED_OFF'));
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(150);
        this.setTooltip('');
        this.setHelpUrl('');
    },
};

Blockly.Blocks['xrp_button_pressed'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(xrpMsg('XRP_USER_BUTTON'));
        this.setOutput(true, null);
        this.setColour(150);
        this.setTooltip('');
        this.setHelpUrl('');
    },
};

Blockly.Blocks['xrp_wait_for_button_press'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(xrpMsg('XRP_WAIT_FOR_BUTTON'));
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(150);
        this.setTooltip('');
        this.setHelpUrl('');
    },
};

// Web Server
Blockly.Blocks['xrp_ws_forward_button'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(xrpMsg('XRP_WEB_FORWARD'));
        this.appendStatementInput('func')
            .appendField(xrpMsg('XRP_FUNCTION'));
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(190);
        this.setTooltip('');
        this.setHelpUrl('');
    },
};

Blockly.Blocks['xrp_ws_back_button'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(xrpMsg('XRP_WEB_BACK'));
        this.appendStatementInput('func')
            .appendField(xrpMsg('XRP_FUNCTION'));
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(190);
        this.setTooltip('');
        this.setHelpUrl('');
    },
};

Blockly.Blocks['xrp_ws_left_button'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(xrpMsg('XRP_WEB_LEFT'));
        this.appendStatementInput('func')
            .appendField(xrpMsg('XRP_FUNCTION'));
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(190);
        this.setTooltip('');
        this.setHelpUrl('');
    },
};

Blockly.Blocks['xrp_ws_right_button'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(xrpMsg('XRP_WEB_RIGHT'));
        this.appendStatementInput('func')
            .appendField(xrpMsg('XRP_FUNCTION'));
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(190);
        this.setTooltip('');
        this.setHelpUrl('');
    },
};

Blockly.Blocks['xrp_ws_stop_button'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(xrpMsg('XRP_WEB_STOP'));
        this.appendStatementInput('func')
            .appendField(xrpMsg('XRP_FUNCTION'));
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(190);
        this.setTooltip('');
        this.setHelpUrl('');
    },
};

Blockly.Blocks['xrp_ws_add_button'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(xrpMsg('XRP_WEB_ADD'))
            .appendField(new Blockly.FieldTextInput('name'), 'TEXT');
        this.appendStatementInput('func')
            .appendField(xrpMsg('XRP_FUNCTION'));
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(190);
        this.setTooltip('');
        this.setHelpUrl('');
    },
};

Blockly.Blocks['xrp_ws_log_data'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(xrpMsg('XRP_WEB_LOG'));
        this.appendValueInput('log_name')
            .appendField(xrpMsg('XRP_LABEL'))
            .setCheck('String');
        this.appendValueInput('DATA')
            .appendField(xrpMsg('XRP_DATA'));
        this.setInputsInline(false);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(190);
        this.setTooltip('');
        this.setHelpUrl('');
    },
};

Blockly.Blocks['xrp_ws_start_server'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(xrpMsg('XRP_START_WEB_SERVER'));
        this.appendValueInput('server_ssid')
            .appendField(xrpMsg('XRP_NAME'))
            .setCheck('String');
        this.appendValueInput('server_pwd')
            .appendField(xrpMsg('XRP_PASSWORD'))
            .setCheck('String');
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(190);
        this.setTooltip(xrpMsg('XRP_START_WEB_SERVER_TOOLTIP'));
        this.setHelpUrl('');
    },
};

Blockly.Blocks['xrp_ws_connect_server'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(xrpMsg('XRP_CONNECT_WEB_SERVER'));
        this.appendValueInput('server_ssid')
            .appendField(xrpMsg('XRP_NAME'))
            .setCheck('String');
        this.appendValueInput('server_pwd')
            .appendField(xrpMsg('XRP_PASSWORD'))
            .setCheck('String');
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(190);
        this.setTooltip(xrpMsg('XRP_CONNECT_WEB_SERVER_TOOLTIP'));
        this.setHelpUrl('');
    },
};

Blockly.Blocks['xrp_gp_get_value'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(xrpMsg('XRP_JOYSTICK'))
            .appendField(
                new Blockly.FieldDropdown([
                    ['X1', 'X1'],
                    ['X2', 'X2'],
                    ['Y1', 'Y1'],
                    ['Y2', 'Y2'],
                ]),
                'GPVALUE',
            );
        this.setOutput(true, null);
        this.setColour('#ff9248');
        this.setTooltip(xrpMsg('XRP_GP_GET_VALUE_TOOLTIP'));
        this.setHelpUrl('');
    },
};

Blockly.Blocks['xrp_gp_button_pressed'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(xrpMsg('XRP_BUTTON'))
            .appendField(new Blockly.FieldDropdown(gamepadButtonDropdown), 'GPBUTTON')
            .appendField(xrpMsg('XRP_PRESSED'));
        this.setOutput(true, null);
        this.setColour('#ff9248');
        this.setTooltip(xrpMsg('XRP_GP_BUTTON_TOOLTIP'));
        this.setHelpUrl('');
    },
};

// Logic
Blockly.Blocks['xrp_sleep'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(xrpMsg('XRP_SLEEP'));
        this.appendValueInput('TIME')
            .setCheck('Number');
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(200);
        this.setTooltip('');
        this.setHelpUrl('');
    },
};

// Dashboard
Blockly.Blocks['xrp_dashboard_start_all'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(xrpMsg('XRP_DASHBOARD_START_ALL'));
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour('#0080ff');
        this.setTooltip(xrpMsg('XRP_DASHBOARD_START_ALL_TOOLTIP'));
        this.setHelpUrl('');
    },
};

Blockly.Blocks['xrp_dashboard_stop_all'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(xrpMsg('XRP_DASHBOARD_STOP_ALL'));
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour('#0080ff');
        this.setTooltip(xrpMsg('XRP_DASHBOARD_STOP_ALL_TOOLTIP'));
        this.setHelpUrl('');
    },
};

Blockly.Blocks['xrp_dashboard_set_value'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(xrpMsg('XRP_DASHBOARD_SET_VALUE'));
        this.appendValueInput('var_name')
            .setCheck('String')
            .appendField(xrpMsg('XRP_NAME'));
        this.appendValueInput('value')
            .setCheck('Number')
            .appendField(xrpMsg('XRP_VALUE'));
        this.setInputsInline(false);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour('#0080ff');
        this.setTooltip(xrpMsg('XRP_DASHBOARD_SET_VALUE_TOOLTIP'));
        this.setHelpUrl('');
    },
};

Blockly.Blocks['xrp_dashboard_get_value'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(xrpMsg('XRP_DASHBOARD_GET_VALUE'));
        this.appendValueInput('var_name')
            .setCheck('String')
            .appendField(xrpMsg('XRP_NAME'));
        this.setInputsInline(false);
        this.setOutput(true, 'Number');
        this.setColour('#0080ff');
        this.setTooltip(xrpMsg('XRP_DASHBOARD_GET_VALUE_TOOLTIP'));
        this.setHelpUrl('');
    },
};

// Text
Blockly.Blocks['comment'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(xrpMsg('XRP_COMMENT'))
            .appendField(new Blockly.FieldTextInput(''), 'TEXT');
        this.setColour(60);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setTooltip(xrpMsg('XRP_COMMENT_TOOLTIP'));
        this.setHelpUrl('');
    },
};
