import React, { useState, useEffect } from 'react';
import { FaGlobe } from 'react-icons/fa';
import useSensorData from '../hooks/useSensorData';
import SensorCard from './SensorCard';
import { GyroscopeData } from '@/utils/sensorParsers';
import { Dropdown, DropdownItem } from "flowbite-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// Define a type for timestamped gyroscope data
interface TimestampedGyroData {
  pitch: number;
  roll: number;
  yaw: number;
  timestamp: number;
}

type AxisType = 'pitch' | 'roll' | 'yaw';

// Define colors to use consistently across the UI
const axisColors: Record<AxisType, string> = {
  pitch: '#3b82f6', // blue
  roll: '#10b981',  // green
  yaw: '#ef4444'    // red
};

const Gyroscope: React.FC = () => {
  // State to store the history of gyroscope readings
  const [gyroHistory, setGyroHistory] = useState<TimestampedGyroData[]>([]);
  const { getSensorData, requestSensors, stopSensor, isConnected, sensorData } = useSensorData();
  const sensorName = 'gyroscope';
  const gyroData = getSensorData<GyroscopeData>(sensorName);
  const lastUpdated = sensorData.get(sensorName)?.timestamp;
  const [sensorVisual, setSensorVisual] = useState<string>("Number");

  // Effect to update history when new data arrives
  useEffect(() => {
    if (gyroData && lastUpdated) {
      // Make sure timestamp is a number
      const timestampAsNumber = typeof lastUpdated === 'string'
        ? Number(lastUpdated)
        : lastUpdated;
      // Create a new reading with the properly typed timestamp
      const newReading: TimestampedGyroData = {
        pitch: gyroData.pitch,
        roll: gyroData.roll,
        yaw: gyroData.yaw,
        timestamp: timestampAsNumber
      };
      // Add new reading to history
      setGyroHistory(prev => [...prev, newReading]);
    }
  }, [gyroData, lastUpdated]);

  const handleStart = () => {
    // Clear history when starting new readings
    setGyroHistory([]);
    requestSensors([sensorName]);
  };

  const handleStop = () => {
    stopSensor(sensorName);
  };

  const sensorCardProps = {
    title: "Gyroscope",
    icon: <FaGlobe size={20} />,
    onStart: handleStart,
    onStop: handleStop,
    isConnected: isConnected,
    lastUpdated: lastUpdated
  };

  type ActionType = 'graph' | 'number';
  const handleAction = (action: ActionType) => {
    switch (action) {
      case 'number': {
        setSensorVisual("Number");
        break;
      }
      case 'graph': {
        setSensorVisual("Graph");
        break;
      }
    }
  }

  // Optional: Limit history size to prevent memory issues
  const MAX_HISTORY_SIZE = 1000;
  useEffect(() => {
    if (gyroHistory.length > MAX_HISTORY_SIZE) {
      setGyroHistory(prev => prev.slice(prev.length - MAX_HISTORY_SIZE));
    }
  }, [gyroHistory]);

  return (
    <SensorCard {...sensorCardProps}>
      <div className="absolute top-4 right-4">
        <Dropdown label={sensorVisual} className="font-bold flex items-center text-sm border border-gray-300 rounded">
          <DropdownItem onClick={() => handleAction('graph')}>Graph</DropdownItem>
          <DropdownItem onClick={() => handleAction('number')}>Number</DropdownItem>
        </Dropdown>
      </div>
      {!gyroData ? (
        <div className="flex items-center justify-center w-full h-full">
          <div className="text-gray-500">No Data Available</div>
        </div>
      ) : (
        <div className="flex flex-col w-full h-full relative pt-12">
          {sensorVisual === "Graph" ? (
            gyroHistory.length > 0 && (
              <div className="mt-4 w-full h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={gyroHistory.slice(-50)}>
                    <XAxis
                      dataKey="timestamp"
                      tick={false}
                      label="Time"
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(value) => new Date(value).toLocaleTimeString()}
                      formatter={(value) => typeof value === 'number' ? value.toFixed(2) : value}
                    />
                    <Line type="monotone" dataKey="pitch" stroke={axisColors.pitch} dot={false} />
                    <Line type="monotone" dataKey="roll" stroke={axisColors.roll} dot={false} />
                    <Line type="monotone" dataKey="yaw" stroke={axisColors.yaw} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
                <div className="text-xs text-gray-500 text-center mt-2">
                  {gyroHistory.length} readings stored
                </div>
              </div>
            )
          ) : (
            <div className="grid grid-cols-3 gap-2 text-center mb-2 p-4 flex-grow">
              {(['pitch', 'roll', 'yaw'] as const).map((axis) => (
                <div key={axis} className="flex flex-col items-center justify-center">
                  <span
                    className="text-xs font-medium"
                    style={{ color: axisColors[axis] }}
                  >
                    {axis.charAt(0).toUpperCase() + axis.slice(1)}
                  </span>
                  <span className="font-mono text-lg">{gyroData[axis].toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </SensorCard>
  );
};

export default Gyroscope;