import React, { useState, useEffect } from 'react';
import { GiElectric } from 'react-icons/gi';
import useSensorData from '../hooks/useSensorData';
import SensorCard from './SensorCard';
import { MotorData } from '@/utils/sensorParsers';
import { Dropdown, DropdownItem } from "flowbite-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// Define a type for timestamped motor data
interface TimestampedMotorData {
  speed: number;
  position: number;
  count: number;
  timestamp: number;
}

// Define colors to use consistently across the UI
const propertyColors = {
  speed: '#3b82f6',    // blue
  position: '#f59e0b', // amber
  count: '#8b5cf6'     // purple
};

const Motor: React.FC = () => {
  // State to store the history of motor readings
  const [motorHistory, setMotorHistory] = useState<TimestampedMotorData[]>([]);
  const { getSensorData, requestSensors, stopSensor, isConnected, sensorData } = useSensorData();
  const sensorName = 'motor';
  const motorData = getSensorData<MotorData>(sensorName);
  const lastUpdated = sensorData.get(sensorName)?.timestamp;
  const [sensorVisual, setSensorVisual] = useState<string>("Number");

  // Calculate a percentage for the speed gauge
  const speedPercentage = motorData ? (motorData.speed / 100) * 100 : 0;

  // Effect to update history when new data arrives
  useEffect(() => {
    if (motorData && lastUpdated) {
      // Make sure timestamp is a number
      const timestampAsNumber = typeof lastUpdated === 'string'
        ? Number(lastUpdated)
        : lastUpdated;

      // Create a new reading with the properly typed timestamp
      const newReading: TimestampedMotorData = {
        speed: motorData.speed,
        position: motorData.position,
        count: motorData.count,
        timestamp: timestampAsNumber
      };

      // Add new reading to history
      setMotorHistory(prev => [...prev, newReading]);
    }
  }, [motorData, lastUpdated]);

  const handleStart = () => {
    // Clear history when starting new readings
    setMotorHistory([]);
    requestSensors([sensorName]);
  };

  const handleStop = () => {
    stopSensor(sensorName);
  };

  const sensorCardProps = {
    title: "Motor",
    icon: <GiElectric size={20} />,
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
    if (motorHistory.length > MAX_HISTORY_SIZE) {
      setMotorHistory(prev => prev.slice(prev.length - MAX_HISTORY_SIZE));
    }
  }, [motorHistory]);

  return (
    <SensorCard {...sensorCardProps}>
      <div className="absolute top-4 right-4">
        <Dropdown label={sensorVisual} className="font-bold flex items-center text-sm border border-gray-300 rounded">
          <DropdownItem onClick={() => handleAction('graph')}>Graph</DropdownItem>
          <DropdownItem onClick={() => handleAction('number')}>Number</DropdownItem>
        </Dropdown>
      </div>
      {!motorData ? (
        <div className="flex items-center justify-center w-full h-full">
          <div className="text-gray-500">No Data Available</div>
        </div>
      ) : (
        <div className="flex flex-col w-full h-full relative pt-12">
          {sensorVisual === "Graph" ? (
            motorHistory.length > 0 && (
              <div className="mt-4 w-full h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={motorHistory.slice(-50)}>
                    <XAxis
                      dataKey="timestamp"
                      tick={false}
                      label="Time"
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(value) => new Date(value).toLocaleTimeString()}
                      formatter={(value, name) => {
                        if (name === 'count') return value;
                        return typeof value === 'number' ? value.toFixed(2) : value;
                      }}
                    />
                    <Legend iconType="circle" />
                    <Line
                      type="monotone"
                      dataKey="speed"
                      stroke={propertyColors.speed}
                      dot={false}
                      name="Speed"
                    />
                    <Line
                      type="monotone"
                      dataKey="position"
                      stroke={propertyColors.position}
                      dot={false}
                      name="Position"
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke={propertyColors.count}
                      dot={false}
                      name="Count"
                    />
                  </LineChart>
                </ResponsiveContainer>
                <div className="text-xs text-gray-500 text-center mt-2">
                  {motorHistory.length} readings stored
                </div>
              </div>
            )
          ) : (
            <div className="flex flex-col items-center p-4 flex-grow">
              {/* Speed gauge visualization */}
              <div className="w-full h-4 bg-gray-200 rounded-full mb-2">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${Math.min(100, speedPercentage)}%` }}
                ></div>
              </div>

              <div className="grid grid-cols-3 gap-2 w-full text-center mb-2">
                {[
                  { key: 'speed', label: 'Speed', value: motorData.speed.toFixed(1) },
                  { key: 'position', label: 'Position', value: motorData.position.toFixed(1) },
                  { key: 'count', label: 'Count', value: motorData.count }
                ].map(({ key, label, value }) => (
                  <div key={key} className="flex flex-col items-center justify-center">
                    <span
                      className="text-xs font-medium"
                      style={{ color: propertyColors[key as keyof typeof propertyColors] }}
                    >
                      {label}
                    </span>
                    <span className="font-mono text-lg">{value}</span>
                  </div>
                ))}
              </div>

              {/* Rotation animation */}
              <div className="mt-2 relative w-12 h-12">
                <svg
                  className="w-full h-full"
                  viewBox="0 0 24 24"
                  style={{
                    animation: `spin ${Math.max(0.1, 2 - motorData.speed / 50)}s linear infinite`
                  }}
                >
                  <path
                    fill={propertyColors.speed}
                    d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,10.5A1.5,1.5 0 0,0 10.5,12A1.5,1.5 0 0,0 12,13.5A1.5,1.5 0 0,0 13.5,12A1.5,1.5 0 0,0 12,10.5M7.5,12A1.5,1.5 0 0,0 9,10.5A1.5,1.5 0 0,0 7.5,9A1.5,1.5 0 0,0 6,10.5A1.5,1.5 0 0,0 7.5,12M16.5,12A1.5,1.5 0 0,0 18,10.5A1.5,1.5 0 0,0 16.5,9A1.5,1.5 0 0,0 15,10.5A1.5,1.5 0 0,0 16.5,12Z"
                  />
                </svg>
              </div>
            </div>
          )}
        </div>
      )}
    </SensorCard>
  );
};

export default Motor;