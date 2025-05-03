import React from 'react';
import { MdColorLens } from 'react-icons/md';
import useSensorData from '../hooks/useSensorData';
import SensorCard from './SensorCard';
import { ColorSensorData } from '@/utils/sensorParsers';

const ColorSensor: React.FC = () => {
  const { getSensorData, requestSensors, stopSensor, isConnected, sensorData } = useSensorData();
  const sensorName = 'color_sensor';
  const colorData = getSensorData<ColorSensorData>(sensorName);
  const lastUpdated = sensorData.get(sensorName)?.timestamp;

  const handleStart = () => {
    requestSensors([sensorName]);
  };

  const handleStop = () => {
    stopSensor(sensorName);
  };

  const sensorCardProps = {
    title: "Color Sensor",
    icon: <MdColorLens size={20} />,
    onStart: handleStart,
    onStop: handleStop,
    isConnected: isConnected,
    lastUpdated: lastUpdated
  };


  return (
    <SensorCard {...sensorCardProps}>
      {!colorData ? (
        <div className="flex items-center justify-center w-full">
          <div className="text-gray-500">No Data Available</div>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <div
            className="w-16 h-16 rounded-full mb-2"
            style={{
              backgroundColor: `rgb(${colorData.r}, ${colorData.g}, ${colorData.b})`
            }}
          ></div>
          <div className="grid grid-cols-3 gap-2 w-full text-center">
            {(['r', 'g', 'b'] as const).map((color) => (
              <div key={color} className="flex flex-col">
                <span className="text-xs text-gray-500">{color.toUpperCase()}</span>
                <span className="font-mono">{colorData[color]}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </SensorCard>
  );
};

export default ColorSensor;