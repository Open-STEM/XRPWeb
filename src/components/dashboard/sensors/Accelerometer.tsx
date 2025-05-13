import React, { useState, useEffect } from 'react';
import { MdSpeed } from 'react-icons/md';
import useSensorData from '../hooks/useSensorData';
import SensorCard from './SensorCard';
import { AccelerometerData } from '../utils/sensorParsers';
import { Dropdown, DropdownItem } from "flowbite-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// Define a type for timestamped accelerometer data
interface TimestampedAccelData {
  x: number;
  y: number;
  z: number;
  timestamp: number;
}

// Define colors to use consistently across the UI
const axisColors = {
  x: '#3b82f6', // blue
  y: '#10b981', // green
  z: '#ef4444'  // red
};



const Accelerometer: React.FC = () => {
  // State to store the history of accelerometer readings
  const [accelHistory, setAccelHistory] = useState<TimestampedAccelData[]>([]);
  const { getSensorData, requestSensors, stopSensor, sensorData } = useSensorData();
  const sensorName = 'accelerometer';
  const accelData = getSensorData<AccelerometerData>(sensorName);
  const lastUpdated = sensorData.get(sensorName)?.timestamp;
  const [sensorVisual, setSensorVisual] = useState<string>("Number");

  // Effect to update history when new data arrives
  useEffect(() => {
    if (accelData && lastUpdated) {
      // Make sure timestamp is a number
      const timestampAsNumber = typeof lastUpdated === 'string'
        ? Number(lastUpdated)
        : lastUpdated;

      // Create a new reading with the properly typed timestamp
      const newReading: TimestampedAccelData = {
        x: accelData.x,
        y: accelData.y,
        z: accelData.z,
        timestamp: timestampAsNumber
      };

      // Add new reading to history
      setAccelHistory(prev => [...prev, newReading]);
    }
  }, [accelData, lastUpdated]);

  const handleStart = () => {
    // Clear history when starting new readings
    setAccelHistory([]);
    requestSensors([sensorName]);
  };

  const handleStop = () => {
    stopSensor(sensorName);
  };

  const sensorCardProps = {
    title: "Accelerometer",
    icon: <MdSpeed size={20} />,
    onStart: handleStart,
    onStop: handleStop,
    isConnected: true,
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
    requestSensors([sensorName]);
  }

  // Optional: Limit history size to prevent memory issues
  const MAX_HISTORY_SIZE = 1000;
  useEffect(() => {
    if (accelHistory.length > MAX_HISTORY_SIZE) {
      setAccelHistory(prev => prev.slice(prev.length - MAX_HISTORY_SIZE));
    }
  }, [accelHistory]);

  return (
    <SensorCard {...sensorCardProps}>
      <div className="absolute top-4 right-4">
        <Dropdown label={sensorVisual} className="font-bold flex items-center text-sm border border-gray-300 rounded">
          <DropdownItem onClick={() => handleAction('graph')}>Graph</DropdownItem>
          <DropdownItem onClick={() => handleAction('number')}>Number</DropdownItem>
        </Dropdown>
      </div>
      {!accelData ? (
        <div className="flex items-center justify-center w-full h-full">
          <div className="text-gray-500">No Data Available</div>
        </div>
      ) : (
        <div className="flex flex-col w-full h-full relative pt-2">

          {sensorVisual === "Graph" ? (
            accelHistory.length > 0 && (
              <div className="mt-4 w-full h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={accelHistory.slice(-50)}>
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
                    <Line type="monotone" dataKey="x" stroke={axisColors.x} dot={false} />
                    <Line type="monotone" dataKey="y" stroke={axisColors.y} dot={false} />
                    <Line type="monotone" dataKey="z" stroke={axisColors.z} dot={false} />
                  </LineChart>
                </ResponsiveContainer>

                <div className="text-xs text-gray-500 text-center mt-2">
                  {accelHistory.length} readings stored
                </div>
              </div>
            )
          ) : (
            <div className="grid grid-cols-3 gap-2 text-center mb-2 p-4 flex-grow">
              {(['x', 'y', 'z'] as const).map((axis) => (
                <div key={axis} className="flex flex-col items-center justify-center">
                  <span
                    className="text-xs font-medium"
                    style={{ color: axisColors[axis] }}
                  >
                    {axis.toUpperCase()}
                  </span>
                  <span className="font-mono text-lg">{accelData[axis].toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </SensorCard>
  );
};

export default Accelerometer;