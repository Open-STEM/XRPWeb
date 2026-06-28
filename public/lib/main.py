import os
x = os.dupterm(None, 0)
if(x == None):
   import ble.blerepl
else:
   os.dupterm(x,0)

# Start PuppetPassthrough background timers. Returns immediately — the REPL
# and all user programs run normally alongside these timers, exactly like
# the existing Dashboard and Gamepad machinery.
try:
    from XRPLib.puppet_passthrough import PuppetPassthrough
    PuppetPassthrough.get_default().start()
except Exception as e:
    print("PuppetPassthrough init error:", e)
