"""GPIO helpers for XRP Controller expansion-header pins.

Pin numbers match the SparkFun XRP Controller hardware overview:
https://docs.sparkfun.com/SparkFun_XRP_Controller/hardware_overview/
"""

from machine import Pin

# RP2350 GPIOs brought out on the 2x20 expansion headers.
HEADER_PINS = (
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
    12, 13, 14, 15, 16, 17, 18, 19,
    20, 21, 22, 23, 24, 25,
    30, 31, 32, 33, 34, 35, 36, 37, 38, 39,
    40, 41, 42, 43, 44, 45, 46,
)


def set_value(pin, value):
    """Initialize the pin as an output and write 0 or 1."""
    Pin(int(pin), Pin.OUT).value(1 if value else 0)


def get_value(pin):
    """Initialize the pin as an input with pull-up and return 0 or 1."""
    return Pin(int(pin), Pin.IN, Pin.PULL_UP).value()
