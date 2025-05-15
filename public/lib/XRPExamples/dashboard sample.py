from XRPLib.defaults import *
from ble.blerepl import uart
from time import sleep
from micropython import const
import time
import struct

YAW = const(0)
ROLL = const(1)
PTICH = const(2)
ACCX = const(3)
ACCY = const(4)
ACCZ = const(5)
ENCL = const(6)
ENCR = const(7)
ENC3 = const(8)
ENC4 = const(9)
CURRL = const(10)
CURRR = const(11)
CURR3 = const(12)
CURR4 = const(13)
DIST = const(14)
REFLECTANCEL = const(15)
REFLECTANCER = const(16)
VOLTAGE = const(17)

def startDashboard():
    data = bytearray([0x46, 0])
    uart.write_data(data)

def sendIntValue(index, value):
    data = bytearray([0x45, 3, 0, 0, 0])
    data[3] = index
    data[4] = value
    uart.write_data(data)

def sendFloatValue(index, value):
    data = bytearray([0x45, 6, 1, 0, 0, 0, 0 ,0])
    data[3] = index
    data[4:] = struct.pack('<f', value)
    uart.write_data(data)

#--------------------------------------
# start of main program. Other parts will be in a libraries at some point
startDashboard()

print(time.time())

timeout = time.time() + 30
while True:
    sendFloatValue(YAW, imu.get_yaw())
    sendFloatValue(ROLL, imu.get_roll())
    sendFloatValue(PTICH, imu.get_pitch())
    sleep(0.3)
    if time.time() > timeout:
        break

print("done")

print("done")

    
