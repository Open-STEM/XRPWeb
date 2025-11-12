import {pythonGenerator} from 'blockly/python';

//Individual Motors
pythonGenerator.forBlock['xrp_motor_effort'] = function (block) {
  pythonGenerator.definitions_['import_motor'] = 'from XRPLib.encoded_motor import EncodedMotor';
  var index = block.getFieldValue("MOTOR");
  pythonGenerator.definitions_[`motor${index}_setup`] = `motor${index} = EncodedMotor.get_default_encoded_motor(${index})`;
  var value_effort = pythonGenerator.valueToCode(block, 'effort', pythonGenerator.ORDER_ATOMIC);
  var code = `motor${index}.set_effort(${value_effort})\n`;
  return code;
};

pythonGenerator.forBlock['xrp_motor_speed'] = function (block) {
  pythonGenerator.definitions_['import_motor'] = 'from XRPLib.encoded_motor import EncodedMotor';
  var index = block.getFieldValue("MOTOR");
  pythonGenerator.definitions_[`motor${index}_setup`] = `motor${index} = EncodedMotor.get_default_encoded_motor(${index})`;
  var value_speed = pythonGenerator.valueToCode(block, 'speed', pythonGenerator.ORDER_ATOMIC);
  if(value_speed == 0) value_speed = "";
  var code = `motor${index}.set_speed(${value_speed})\n`;
  return code;
};

pythonGenerator.forBlock['xrp_motor_get_speed'] = function (block) {
  pythonGenerator.definitions_['import_motor'] = 'from XRPLib.encoded_motor import EncodedMotor';
  var index = block.getFieldValue("MOTOR");
  pythonGenerator.definitions_[`motor${index}_setup`] = `motor${index} = EncodedMotor.get_default_encoded_motor(${index})`;
  var code = `motor${index}.get_speed()`;
  return [code, pythonGenerator.ORDER_NONE];
};

pythonGenerator.forBlock['xrp_motor_direction'] = function (block) {
  pythonGenerator.definitions_['import_motor'] = 'from XRPLib.encoded_motor import EncodedMotor';
  var index = block.getFieldValue("MOTOR");
  pythonGenerator.definitions_[`motor${index}_setup`] = `motor${index} = EncodedMotor.get_default_encoded_motor(${index})`;
  var value_direction = block.getFieldValue("DIRECTION");
  var code = `motor${index}._motor.flip_dir = (${value_direction})\n`;
  return code;
};

pythonGenerator.forBlock['xrp_motor_get_position'] = function (block) {
  pythonGenerator.definitions_['import_motor'] = 'from XRPLib.encoded_motor import EncodedMotor';
  var index = block.getFieldValue("MOTOR");
  pythonGenerator.definitions_[`motor${index}_setup`] = `motor${index} = EncodedMotor.get_default_encoded_motor(${index})`;
  var code = `motor${index}.get_position()`;
  return [code, pythonGenerator.ORDER_NONE];
};

pythonGenerator.forBlock['xrp_motor_get_count'] = function (block) {
  pythonGenerator.definitions_['import_motor'] = 'from XRPLib.encoded_motor import EncodedMotor';
  var index = block.getFieldValue("MOTOR");
  pythonGenerator.definitions_[`motor${index}_setup`] = `motor${index} = EncodedMotor.get_default_encoded_motor(${index})`;
  var code = `motor${index}.get_position_counts()`;
  return [code, pythonGenerator.ORDER_NONE];
};

pythonGenerator.forBlock['xrp_motor_reset_position'] = function (block) {
  pythonGenerator.definitions_['import_motor'] = 'from XRPLib.encoded_motor import EncodedMotor';
  var index = block.getFieldValue("MOTOR");
  pythonGenerator.definitions_[`motor${index}_setup`] = `motor${index} = EncodedMotor.get_default_encoded_motor(${index})`;
  var code = `motor${index}.reset_encoder_position()\n`;
  return code;
};

//DriveTrain
pythonGenerator.forBlock['xrp_straight_effort'] = function (block) {
  pythonGenerator.definitions_['import_drivetrain'] = 'from XRPLib.differential_drive import DifferentialDrive';
  pythonGenerator.definitions_[`drietrain_setup`] = `differentialDrive = DifferentialDrive.get_default_differential_drive()`;
  var value_dist = pythonGenerator.valueToCode(block, 'dist', pythonGenerator.ORDER_ATOMIC);
  var value_effort = pythonGenerator.valueToCode(block, 'effort', pythonGenerator.ORDER_ATOMIC);
  var code = `differentialDrive.straight(${value_dist}, ${value_effort})\n`;
  return code;
};

pythonGenerator.forBlock['xrp_turn_effort'] = function (block) {
  pythonGenerator.definitions_['import_drivetrain'] = 'from XRPLib.differential_drive import DifferentialDrive';
  pythonGenerator.definitions_[`drietrain_setup`] = `differentialDrive = DifferentialDrive.get_default_differential_drive()`;
  var value_angle = pythonGenerator.valueToCode(block, 'degrees', pythonGenerator.ORDER_ATOMIC);
  var value_effort = pythonGenerator.valueToCode(block, 'effort', pythonGenerator.ORDER_ATOMIC);
  var code = `differentialDrive.turn(${value_angle}, ${value_effort})\n`;
  return code;
};

pythonGenerator.forBlock['xrp_seteffort'] = function (block) {
  pythonGenerator.definitions_['import_drivetrain'] = 'from XRPLib.differential_drive import DifferentialDrive';
  pythonGenerator.definitions_[`drietrain_setup`] = `differentialDrive = DifferentialDrive.get_default_differential_drive()`;
  var value_l = pythonGenerator.valueToCode(block, 'LEFT', pythonGenerator.ORDER_ATOMIC);
  var value_r = pythonGenerator.valueToCode(block, 'RIGHT', pythonGenerator.ORDER_ATOMIC);
  var code = `differentialDrive.set_effort(${value_l}, ${value_r})\n`;
  return code;
};

pythonGenerator.forBlock['xrp_speed'] = function (block) {
  pythonGenerator.definitions_['import_drivetrain'] = 'from XRPLib.differential_drive import DifferentialDrive';
  pythonGenerator.definitions_[`drietrain_setup`] = `differentialDrive = DifferentialDrive.get_default_differential_drive()`;
  var value_l = pythonGenerator.valueToCode(block, 'LEFT', pythonGenerator.ORDER_ATOMIC);
  var value_r = pythonGenerator.valueToCode(block, 'RIGHT', pythonGenerator.ORDER_ATOMIC)
  var code = `differentialDrive.set_speed(${value_l}, ${value_r})\n`;
  return code;
};

pythonGenerator.forBlock['xrp_arcade'] = function (block) {
  pythonGenerator.definitions_['import_drivetrain'] = 'from XRPLib.differential_drive import DifferentialDrive';
  pythonGenerator.definitions_[`drietrain_setup`] = `differentialDrive = DifferentialDrive.get_default_differential_drive()`;
  var value_s = pythonGenerator.valueToCode(block, 'STRAIGHT', pythonGenerator.ORDER_ATOMIC);
  var value_t = pythonGenerator.valueToCode(block, 'TURN', pythonGenerator.ORDER_ATOMIC);
  var code = `differentialDrive.arcade(${value_s}, ${value_t})\n`;
  return code;
};

pythonGenerator.forBlock['xrp_stop_motors'] = function (block) {
  pythonGenerator.definitions_['import_drivetrain'] = 'from XRPLib.differential_drive import DifferentialDrive';
  pythonGenerator.definitions_[`drietrain_setup`] = `differentialDrive = DifferentialDrive.get_default_differential_drive()`;
  var code = `differentialDrive.stop()\n`;
  return code;
};

pythonGenerator.forBlock['xrp_resetencoders'] = function (block) {
  pythonGenerator.definitions_['import_drivetrain'] = 'from XRPLib.differential_drive import DifferentialDrive';
  pythonGenerator.definitions_[`drietrain_setup`] = `differentialDrive = DifferentialDrive.get_default_differential_drive()`;
  var value_degrees = pythonGenerator.valueToCode(block, 'degrees', pythonGenerator.ORDER_ATOMIC);
  var code = `differentialDrive.reset_encoder_position()\n`;
  return code;
};

pythonGenerator.forBlock['xrp_getleftencoder'] = function (block) {
  pythonGenerator.definitions_['import_drivetrain'] = 'from XRPLib.differential_drive import DifferentialDrive';
  pythonGenerator.definitions_[`drietrain_setup`] = `differentialDrive = DifferentialDrive.get_default_differential_drive()`;
  var code = `differentialDrive.get_left_encoder_position()`;
  return [code, pythonGenerator.ORDER_NONE];
};

pythonGenerator.forBlock['xrp_getrightencoder'] = function (block) {
  pythonGenerator.definitions_['import_drivetrain'] = 'from XRPLib.differential_drive import DifferentialDrive';
  pythonGenerator.definitions_[`drietrain_setup`] = `differentialDrive = DifferentialDrive.get_default_differential_drive()`;
  var code = `differentialDrive.get_right_encoder_position()`;
  return [code, pythonGenerator.ORDER_NONE];
};

//Servo
pythonGenerator.forBlock['xrp_servo_deg'] = function (block) {
  pythonGenerator.definitions_['import_servo'] = 'from XRPLib.servo import Servo';
  var index = block.getFieldValue("SERVO");
  if(index == 1){
    pythonGenerator.definitions_[`servo_setup`] = `servo1 = Servo.get_default_servo(1)`;
  }
  else {
    pythonGenerator.definitions_[`servo2_setup`] = `servo2 = Servo.get_default_servo(2)`;
  }
  var value_degrees = pythonGenerator.valueToCode(block, 'degrees', pythonGenerator.ORDER_ATOMIC);
  var code = `servo${index}.set_angle(${value_degrees})\n`;
  return code;
};

//Distance
pythonGenerator.forBlock['xrp_getsonardist'] = function (block) {
  pythonGenerator.definitions_['import_rangefinder'] = 'from XRPLib.rangefinder import Rangefinder';
  pythonGenerator.definitions_[`rangefinder_setup`] = `rangefinder = Rangefinder.get_default_rangefinder()`;
  var code = `rangefinder.distance()`;
  return [code, pythonGenerator.ORDER_NONE];
};

//reflectance
pythonGenerator.forBlock['xrp_l_refl'] = function (block) {
  pythonGenerator.definitions_['import_reflectance'] = 'from XRPLib.reflectance import Reflectance';
  pythonGenerator.definitions_[`reflectance_setup`] = `reflectance = Reflectance.get_default_reflectance()`;
  var code = `reflectance.get_left()`;
  return [code, pythonGenerator.ORDER_NONE];
};

pythonGenerator.forBlock['xrp_r_refl'] = function (block) {
  pythonGenerator.definitions_['import_reflectance'] = 'from XRPLib.reflectance import Reflectance';
  pythonGenerator.definitions_[`reflectance_setup`] = `reflectance = Reflectance.get_default_reflectance()`;
  var code = `reflectance.get_right()`;
  return [code, pythonGenerator.ORDER_NONE];
};

//Gyro
pythonGenerator.forBlock['xrp_yaw'] = function (block) {
  pythonGenerator.definitions_['import_imu'] = 'from XRPLib.imu import IMU';
  pythonGenerator.definitions_[`imu_setup`] = `imu = IMU.get_default_imu()\nimu.calibrate(1)`;
  var code = `imu.get_yaw()`;
  return [code, pythonGenerator.ORDER_NONE];
};

pythonGenerator.forBlock['xrp_roll'] = function (block) {
  pythonGenerator.definitions_['import_imu'] = 'from XRPLib.imu import IMU';
  pythonGenerator.definitions_[`imu_setup`] = `imu = IMU.get_default_imu()\nimu.calibrate(1)`;
  var code = `imu.get_roll()`;
  return [code, pythonGenerator.ORDER_NONE];
};

pythonGenerator.forBlock['xrp_pitch'] = function (block) {
  pythonGenerator.definitions_['import_imu'] = 'from XRPLib.imu import IMU';
  pythonGenerator.definitions_[`imu_setup`] = `imu = IMU.get_default_imu()\nimu.calibrate(1)`;
  var code = `imu.get_pitch()`;
  return [code, pythonGenerator.ORDER_NONE];
};

//Accelerometer
pythonGenerator.forBlock['xrp_acc_x'] = function (block) {
  pythonGenerator.definitions_['import_imu'] = 'from XRPLib.imu import IMU';
  pythonGenerator.definitions_[`imu_setup`] = `imu = IMU.get_default_imu()\nimu.calibrate(1)`;
  var code = `imu.get_acc_x()`;
  return [code, pythonGenerator.ORDER_NONE];
};

pythonGenerator.forBlock['xrp_acc_y'] = function (block) {
  pythonGenerator.definitions_['import_imu'] = 'from XRPLib.imu import IMU';
  pythonGenerator.definitions_[`imu_setup`] = `imu = IMU.get_default_imu()\nimu.calibrate(1)`;
  var code = `imu.get_acc_y()`;
  return [code, pythonGenerator.ORDER_NONE];
};

pythonGenerator.forBlock['xrp_acc_z'] = function (block) {
  pythonGenerator.definitions_['import_imu'] = 'from XRPLib.imu import IMU';
  pythonGenerator.definitions_[`imu_setup`] = `imu = IMU.get_default_imu()\nimu.calibrate(1)`;
  var code = `imu.get_acc_z()`;
  return [code, pythonGenerator.ORDER_NONE];
};

//Control Board
pythonGenerator.forBlock['xrp_led_on'] = function (block) {
  pythonGenerator.definitions_['import_board'] = 'from XRPLib.board import Board';
  pythonGenerator.definitions_[`board_setup`] = `board = Board.get_default_board()`;
  var code = `board.led_on()\n`;
  return code;
};

pythonGenerator.forBlock['xrp_led_off'] = function (block) {
  pythonGenerator.definitions_['import_board'] = 'from XRPLib.board import Board';
  pythonGenerator.definitions_[`board_setup`] = `board = Board.get_default_board()`;
  var code = `board.led_off()\n`;
  return code;
};

pythonGenerator.forBlock['xrp_button_pressed'] = function (block) {
  pythonGenerator.definitions_['import_board'] = 'from XRPLib.board import Board';
  pythonGenerator.definitions_[`board_setup`] = `board = Board.get_default_board()`;
  var code = `board.is_button_pressed()`;
  return [code, pythonGenerator.ORDER_NONE];
};

pythonGenerator.forBlock['xrp_wait_for_button_press'] = function (block) {
  pythonGenerator.definitions_['import_board'] = 'from XRPLib.board import Board';
  pythonGenerator.definitions_[`board_setup`] = `board = Board.get_default_board()`;
  var code = `board.wait_for_button()\n`
  return code;
};

//Web Server
var nextFunc = 0;
function getFuncName(){
  nextFunc++;
  return "func" + nextFunc;
}

pythonGenerator.forBlock['xrp_ws_forward_button'] = function (block) {
  pythonGenerator.definitions_['import_webserver'] = 'from XRPLib.webserver import Webserver';
  pythonGenerator.definitions_[`webserver_setup`] = `webserver = Webserver.get_default_webserver()`;
  var func = pythonGenerator.statementToCode(block, 'func');
  var funcName = getFuncName();
  var code = `\ndef ${funcName}():\n${func}\n`
  code += `webserver.registerForwardButton(${funcName})\n`
  return code;
};

pythonGenerator.forBlock['xrp_ws_back_button'] = function (block) {
  pythonGenerator.definitions_['import_webserver'] = 'from XRPLib.webserver import Webserver';
  pythonGenerator.definitions_[`webserver_setup`] = `webserver = Webserver.get_default_webserver()`;
  var func = pythonGenerator.statementToCode(block, 'func');
  var funcName = getFuncName();
  var code = `\ndef ${funcName}():\n${func}\n`
  code += `webserver.registerBackwardButton(${funcName})\n`
  return code;
};

pythonGenerator.forBlock['xrp_ws_left_button'] = function (block) {
  pythonGenerator.definitions_['import_webserver'] = 'from XRPLib.webserver import Webserver';
  pythonGenerator.definitions_[`webserver_setup`] = `webserver = Webserver.get_default_webserver()`;
  var func = pythonGenerator.statementToCode(block, 'func');
  var funcName = getFuncName();
  var code = `\ndef ${funcName}():\n${func}\n`
  code += `webserver.registerLeftButton(${funcName})\n`
  return code;
};

pythonGenerator.forBlock['xrp_ws_right_button'] = function (block) {
  pythonGenerator.definitions_['import_webserver'] = 'from XRPLib.webserver import Webserver';
  pythonGenerator.definitions_[`webserver_setup`] = `webserver = Webserver.get_default_webserver()`;
  var func = pythonGenerator.statementToCode(block, 'func');
  var funcName = getFuncName();
  var code = `\ndef ${funcName}():\n${func}\n`
  code += `webserver.registerRightButton(${funcName})\n`
  return code;
};

pythonGenerator.forBlock['xrp_ws_stop_button'] = function (block) {
  pythonGenerator.definitions_['import_webserver'] = 'from XRPLib.webserver import Webserver';
  pythonGenerator.definitions_[`webserver_setup`] = `webserver = Webserver.get_default_webserver()`;
  var func = pythonGenerator.statementToCode(block, 'func');
  var funcName = getFuncName();
  var code = `\ndef ${funcName}():\n${func}\n`
  code += `webserver.registerStopButton(${funcName})\n`
  return code;
};

pythonGenerator.forBlock['xrp_ws_add_button'] = function (block) {
  pythonGenerator.definitions_['import_webserver'] = 'from XRPLib.webserver import Webserver';
  pythonGenerator.definitions_[`webserver_setup`] = `webserver = Webserver.get_default_webserver()`;
  var name = block.getFieldValue("TEXT");
  var func = pythonGenerator.statementToCode(block, 'func');
  var funcName = getFuncName();
  var code = `\ndef ${funcName}():\n${func}\n`
  code += `webserver.add_button("${name}", ${funcName})\n`
  return code;
};

pythonGenerator.forBlock['xrp_ws_log_data'] = function (block) {
  pythonGenerator.definitions_['import_webserver'] = 'from XRPLib.webserver import Webserver';
  pythonGenerator.definitions_[`webserver_setup`] = `webserver = Webserver.get_default_webserver()`; 
  data = pythonGenerator.valueToCode(block, 'DATA', pythonGenerator.ORDER_ATOMIC);
  var label  = block.getInputTargetBlock("log_name").getFieldValue("TEXT");
  var code = `webserver.log_data("${label}", ${data})\n`
  return code;
};


pythonGenerator.forBlock['xrp_ws_connect_server'] = function (block) {
  pythonGenerator.definitions_['import_webserver'] = 'from XRPLib.webserver import Webserver';
  pythonGenerator.definitions_[`webserver_setup`] = `webserver = Webserver.get_default_webserver()`;
  var ssid = block.getInputTargetBlock("server_ssid").getFieldValue("TEXT");
  var pwd = block.getInputTargetBlock("server_pwd").getFieldValue("TEXT")
  var code = `webserver.connect_to_network(ssid="${ssid}", password="${pwd}")\nwebserver.start_server()\n`
  return code;
};

pythonGenerator.forBlock['xrp_ws_start_server'] = function (block) {
  pythonGenerator.definitions_['import_webserver'] = 'from XRPLib.webserver import Webserver';
  pythonGenerator.definitions_[`webserver_setup`] = `webserver = Webserver.get_default_webserver()`;
  var ssid = block.getInputTargetBlock("server_ssid").getFieldValue("TEXT");
  var pwd = block.getInputTargetBlock("server_pwd").getFieldValue("TEXT")
  var code = `webserver.start_network(ssid="${ssid}", password="${pwd}")\nwebserver.start_server()\n`
  return code;
};

// Gamepad

pythonGenerator.forBlock['xrp_gp_get_value'] = function (block) {
  pythonGenerator.definitions_['import_gamepad'] = 'from XRPLib.gamepad import *';
  pythonGenerator.definitions_[`gamepad_setup`] = `gp = Gamepad.get_default_gamepad()`;
  var value = block.getFieldValue("GPVALUE");
  var code = `gp.get_value(gp.${value})`;
  return [code , pythonGenerator.ORDER_NONE];
};

pythonGenerator.forBlock['xrp_gp_button_pressed'] = function (block) {
  pythonGenerator.definitions_['import_gamepad'] = 'from XRPLib.gamepad import *';
  pythonGenerator.definitions_[`gamepad_setup`] = `gp = Gamepad.get_default_gamepad()`;
  var value = block.getFieldValue("GPBUTTON");
  var code = `gp.is_button_pressed(gp.${value})`;
  return [code , pythonGenerator.ORDER_NONE];
};

//Logic
pythonGenerator.forBlock['xrp_sleep'] = function (block) {
  pythonGenerator.definitions_['import_time'] = 'import time';
  var number_time = pythonGenerator.valueToCode(block, 'TIME', pythonGenerator.ORDER_ATOMIC);
  var code = `time.sleep(${number_time})\n`;
  return code;
};

//Text
pythonGenerator.forBlock['comment'] = function(block) {
  var text = block.getFieldValue('TEXT');
  return '# ' + text + '\n';
};

