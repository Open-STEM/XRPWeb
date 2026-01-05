import { useState, useEffect, useCallback } from 'react';
import { AccelerometerData, GyroscopeData, RangefinderData, VoltageData, ReflectanceData, CurrentData, EncoderData, SensorData } from '../utils/sensorParsers';
import AppMgr, { EventType } from '@/managers/appmgr';
import { NetworkTable } from '@/managers/tablemgr';

const useSensorData = () => {
  const [sensorData, setSensorData] = useState<Map<string, SensorData>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const [activeSensors, setActiveSensors] = useState<Set<string>>(new Set());

  const handleSensorData = useCallback((data: string) => {
    //console.log('Received sensor data:', data);
    try {
      const parsedData = JSON.parse(data) as NetworkTable;

      // fill in the sensor data parsing logic here
      for (const sensor of activeSensors) {
        switch (sensor) {
          case 'color_sensor':
            break;
          case 'accelerometer':
            {
              const accelValues: AccelerometerData = {
                x: parsedData.accelerometer.accX,
                y: parsedData.accelerometer.accY,
                z: parsedData.accelerometer.accZ
              };
              const accelData: SensorData = {
                sensorType: sensor,
                value: accelValues,
                timestamp: new Date().toISOString(),
              };
              setSensorData(prev => {
                const newMap = new Map(prev);
                newMap.set(sensor, accelData);
                return newMap;
              });
            }
            break;
          case 'gyroscope':
            {
              const gyroValues: GyroscopeData = {
                pitch: parsedData.gyro.pitch,
                roll: parsedData.gyro.roll,
                yaw: parsedData.gyro.yaw
              };
              const gyroData: SensorData = {
                sensorType: sensor,
                value: gyroValues,
                timestamp: new Date().toISOString(),
              }
              setSensorData(prev => {
                const newMap = new Map(prev);
                newMap.set(sensor, gyroData);
                return newMap;
              });
            }
            break;
          case 'rangefinder':
            {
              const rangefinderValues: RangefinderData = {
                distance: parsedData.distance
              };
              const rangefinderData: SensorData = {
                sensorType: sensor,
                value: rangefinderValues,
                timestamp: new Date().toISOString(),
              };
              setSensorData(prev => {
                const newMap = new Map(prev);
                newMap.set(sensor, rangefinderData);
                return newMap;
              });
            }
            break;
          case 'battery':
            {
              const batteryValues: VoltageData = {
                voltage: parsedData.voltage
              };
              const batteryData: SensorData = {
                sensorType: sensor,
                value: batteryValues,
                timestamp: new Date().toISOString(),
              };
              setSensorData(prev => {
                const newMap = new Map(prev);
                newMap.set(sensor, batteryData);
                return newMap;
              });
            }
            break;
          case 'reflectance':
            {
              const reflectanceValues: ReflectanceData = {

                reflectanceL: parsedData.reflectance.reflectanceL,
                reflectanceR: parsedData.reflectance.reflectanceR

              };
              const reflectanceData: SensorData = {
                sensorType: sensor,
                value: reflectanceValues,
                timestamp: new Date().toISOString(),
              };
              setSensorData(prev => {
                const newMap = new Map(prev);
                newMap.set(sensor, reflectanceData);
                return newMap;
              });
            }
            break;
          case 'current':
            {
              const currentValues: CurrentData = {

                currL: parsedData.current.currL,
                currR: parsedData.current.currR,
                curr3: parsedData.current.curr3,
                curr4: parsedData.current.curr4

              };
              const currentData: SensorData = {
                sensorType: sensor,
                value: currentValues,
                timestamp: new Date().toISOString(),
              };
              setSensorData(prev => {
                const newMap = new Map(prev);
                newMap.set(sensor, currentData);
                return newMap;
              });
            }
            break;
          case 'encoders':
            {
              const encoderValues: EncoderData = {
                encL: parsedData.encoders.encL,
                encR: parsedData.encoders.encR,
                enc3: parsedData.encoders.enc3,
                enc4: parsedData.encoders.enc4

              };
              const encoderData: SensorData = {
                sensorType: sensor,
                value: encoderValues,
                timestamp: new Date().toISOString(),
              };
              setSensorData(prev => {
                const newMap = new Map(prev);
                newMap.set(sensor, encoderData);
                return newMap;
              });
            }
            break;
        }
      }
    } catch (err) {
      console.error('Error handling sensor data:', err);
      setError('Error handling sensor data');
    }
  }, [activeSensors]);

  useEffect(() => {
    // subscribe to sensor data updates
    AppMgr.getInstance().on(EventType.EVENT_DASHBOARD_DATA, handleSensorData);

  }, [handleSensorData]);


  // Stop a specific sensor
  const stopSensor = (sensor: string) => {
    setActiveSensors(prev => {
      const newSet = new Set(prev);
      newSet.delete(sensor);
      return newSet;
    });
  };

  // Get data for a specific sensor
  const getSensorData = <T>(sensor: string): T | null => {
    const data = sensorData.get(sensor);
    return data ? data.value as T : null;
  };

  // Request data from specific sensors
  const requestSensors = (sensors: string[]) => {
    // Update active sensors
    setActiveSensors(prev => {
      const newSet = new Set(prev);
      sensors.forEach(sensor => newSet.add(sensor));
      return newSet;
    });
  };

  return {
    sensorData,
    getSensorData,
    error,
    requestSensors,
    stopSensor,
    activeSensors: Array.from(activeSensors)
  };
};

export default useSensorData;