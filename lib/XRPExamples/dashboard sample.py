from XRPLib.defaults import *
from ble.blerepl import uart
from time import sleep
from micropython import const
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
#sendIntValue(0, 3)
sendFloatValue(PTICH, 4.256)

print("done")

    
