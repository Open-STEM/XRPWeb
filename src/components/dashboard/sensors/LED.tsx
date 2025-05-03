import React from 'react';
import { MdLightbulb } from 'react-icons/md';
import useSensorData from '../hooks/useSensorData';
import SensorCard from './SensorCard';
import { LEDData } from '@/utils/sensorParsers';

const LED: React.FC = () => {
  const { getSensorData, requestSensors, stopSensor, isConnected, sensorData } = useSensorData();
  const sensorName = 'LED';
  const ledData = getSensorData<LEDData>(sensorName);
  const lastUpdated = sensorData.get(sensorName)?.timestamp;

  const handleStart = () => {
    requestSensors([sensorName]);
  };

  const handleStop = () => {
    stopSensor(sensorName);
  };

  const sensorCardProps = {
    title: "LED",
    icon: <MdLightbulb size={20} />,
    onStart: handleStart,
    onStop: handleStop,
    isConnected: isConnected,
    lastUpdated: lastUpdated
  };

  return (
    <SensorCard {...sensorCardProps}>
      {!ledData ? (
        <div className="flex items-center justify-center w-full">
          <div className="text-gray-500">No Data Available</div>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <div className={`text-4xl ${ledData.state === 'on' ? 'text-yellow-400' : 'text-gray-400'}`}>
            <MdLightbulb />
          </div>
          <div className="mt-2 font-medium">
            {ledData.state === 'on' ? 'ON' : 'OFF'}
          </div>
        </div>
      )}
    </SensorCard>
  );
};

export default LED;