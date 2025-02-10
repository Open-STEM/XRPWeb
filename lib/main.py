import os
x = os.dupterm(None, 0)
if(x == None):
   import ble.blerepl
else:
   os.dupterm(x,0)
