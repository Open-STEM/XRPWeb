#!/usr/bin/env python
#-------------------------------------------------------------------------------
# webserver_demo.py
#
# Example demo showing how to integrate AgXRPSensorKit with AgXRPWebServer.
# This demonstrates the full use case: create sensor kit, get sensor data,
# and pass it to the webserver.
#
# Note: This demo uses random data mode. For real sensors, you'll need to
# use uasyncio to run the server and sensor updates concurrently since
# server.run() is blocking.
#-------------------------------------------------------------------------------

import time
import uasyncio
from lib.AgXRPLib.agxrp_sensor_kit import AgXRPSensorKit
from lib.AgXRPLib.agxrp_webserver import AgXRPWebServer
from lib.AgXRPLib.agxrp_controller import AgXRPController

def main():
    """!
    Main function demonstrating sensor kit and webserver integration.
    """
    print("Initializing AgXRP Sensor Kit, Controller, and Web Server...")
    
    # For testing with random data, set use_random_data=True
    # For real sensor data, set use_random_data=False
    USE_RANDOM_DATA = False # Set to False when using real sensors
    
    # Create sensor kit (only if not using random data)
    agxrp = None
    controller = None
    
    if not USE_RANDOM_DATA:
        # Initialize sensor kit: bus 0 only (sda=4, scl=5).
        # Enabling bus 1 creates a second I2C and can break bus 0 on some boards; keep it disabled.
        agxrp = AgXRPSensorKit(bus0_enabled=True, bus1_enabled=True, i2c_freq=100000)
        
        # Register capacitive soil sensors first (same order as test scripts
        # so they see a clean bus; other devices can leave the bus in a state that breaks it)
        agxrp.register_soil_sensor(1, bus=0)
        agxrp.register_soil_sensor(2, bus=1)  # Second sensor needs different I2C address
        # OLED display
        #agxrp.register_screen(bus=0)
        # CO2 (SCD4x)
        #agxrp.register_co2_sensor(bus=0)
        # Light intensity (VEML)
        #agxrp.register_light_sensor(bus=0)
        
        # Initial update to stabilize sensors
        agxrp.update()
        time.sleep(2)
        agxrp.update()
        
        # Create controller with sensor kit
        controller = AgXRPController(agxrp)
        
        # Two water pumps
        controller.register_water_pump(1, csv_filename="water_pump_1_log.csv")
        controller.register_water_pump(2, csv_filename="water_pump_2_log.csv")
        
        # Plant system 1: capacitive sensor 1 -> pump 1
        # Threshold in pF; water when below threshold (dry soil)
        controller.register_plant_system(
            sensor_index=1,
            pump_index=1,
            interval_minutes=5.0,
            threshold=300.0,  # Water when soil moisture below 300 pF (adjust for your sensor)
            duration_seconds=3.0,
            enabled=True
        )
        
        # Plant system 2: capacitive sensor 2 -> pump 2
        controller.register_plant_system(
            sensor_index=2,
            pump_index=2,
            interval_minutes=5.0,
            threshold=300.0,  # Water when soil moisture below 300 pF (adjust for your sensor)
            duration_seconds=3.0,
            enabled=True
        )
        
        # Start the automatic control loop
        controller.start_control_loop()
        print("Controller started with automatic watering enabled")
    
    # Create webserver
    webserver = AgXRPWebServer()
    
    # Register controller with webserver (if we have one)
    if controller:
        webserver.register_controller(controller)
    
    # Register sensors that will be displayed on the web page
    # webserver.register_temperature()
    # webserver.register_humidity()
    # webserver.register_co2()
    # webserver.register_light_intensity()
    webserver.register_soil_moisture_sensor_1()
    webserver.register_soil_moisture_sensor_2()
    
    # Start access point
    if not webserver.start_access_point(ssid="AgXRP_SensorKit_2", password="sensor123", use_random_data=USE_RANDOM_DATA):
        print("ERROR: Failed to start access point")
        return
    
    print(f"Access point started. Connect to 'AgXRP_SensorKit_2' and visit http://{webserver.get_ip_address()}")
    
    # Start web server
    # Note: server.run() is blocking, so for real sensors you would need
    # to use uasyncio to run sensor updates concurrently
    print("Starting web server...")
    print("Press Ctrl+C to stop")
    
    try:
        if USE_RANDOM_DATA:
            # For random data mode, the update endpoint will generate new data
            # when the Update button is clicked
            webserver.run()
        else:
            # For real sensors, use uasyncio to run sensor updates concurrently
            async def update_sensors():
                while True:
                    agxrp.update()
                    data = {}
                    if agxrp.co2_sensor and agxrp.co2_sensor.is_connected():
                        data["temperature"] = agxrp.co2_sensor.get_temperature()
                        data["humidity"] = agxrp.co2_sensor.get_humidity()
                        data["co2"] = agxrp.co2_sensor.get_co2()
                    if agxrp.light_sensor and agxrp.light_sensor.is_connected():
                        data["light_intensity"] = agxrp.light_sensor.get_ambient_light()
                    for idx in [1, 2]:
                        if idx in agxrp.soil_sensors:
                            sensor = agxrp.soil_sensors[idx]
                            if sensor and sensor.is_connected():
                                data[f"soil_moisture_{idx}"] = sensor.get_moisture()
                    webserver.update_sensor_data(data)
                    await uasyncio.sleep(2)
            
            loop = uasyncio.get_event_loop()
            loop.create_task(update_sensors())
            webserver.run()
                
    except KeyboardInterrupt:
        print("\nShutting down...")
        if controller:
            controller.stop_control_loop()
            print("Controller stopped")
        if agxrp:
            print("Sensor kit stopped")
        print("Web server stopped")

if __name__ == "__main__":
    main()

