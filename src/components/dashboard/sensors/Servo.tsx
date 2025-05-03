import React, { useState, useEffect } from 'react';
import { GiPositionMarker } from 'react-icons/gi';
import useSensorData from '../hooks/useSensorData';
import SensorCard from './SensorCard';
import { ServoData } from '@/utils/sensorParsers';
import { Dropdown, DropdownItem } from "flowbite-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// Define a type for timestamped servo data
interface TimestampedServoData {
  angle: number;
  timestamp: number;
}

// Define color for angle in the chart
const angleColor = '#3b82f6'; // blue to match existing UI

const Servo: React.FC = () => {
  // State to store the history of servo readings
  const [servoHistory, setServoHistory] = useState<TimestampedServoData[]>([]);
  const { getSensorData, requestSensors, stopSensor, isConnected, sensorData } = useSensorData();
  const sensorName = 'servo';
  const servoData = getSensorData<ServoData>(sensorName);
  const lastUpdated = sensorData.get(sensorName)?.timestamp;
  const [sensorVisual, setSensorVisual] = useState<string>("Number");

  // Calculate position on a semicircle for visualization
  const angle = servoData ? servoData.angle : 0;
  const normalizedAngle = Math.min(200, Math.max(0, angle)) / 200; // Normalize to 0-1 range
  const radians = normalizedAngle * Math.PI;
  const x = 50 + 40 * Math.cos(radians);
  const y = 50 - 40 * Math.sin(radians);

  // Effect to update history when new data arrives
  useEffect(() => {
    if (servoData && lastUpdated) {
      // Make sure timestamp is a number
      const timestampAsNumber = typeof lastUpdated === 'string'
        ? Number(lastUpdated)
        : lastUpdated;

      // Create a new reading with the properly typed timestamp
      const newReading: TimestampedServoData = {
        angle: servoData.angle,
        timestamp: timestampAsNumber
      };

      // Add new reading to history
      setServoHistory(prev => [...prev, newReading]);
    }
  }, [servoData, lastUpdated]);

  const handleStart = () => {
    // Clear history when starting new readings
    setServoHistory([]);
    requestSensors([sensorName]);
  };

  const handleStop = () => {
    stopSensor(sensorName);
  };

  const sensorCardProps = {
    title: "Servo",
    icon: <GiPositionMarker size={20} />,
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
    if (servoHistory.length > MAX_HISTORY_SIZE) {
      setServoHistory(prev => prev.slice(prev.length - MAX_HISTORY_SIZE));
    }
  }, [servoHistory]);

  return (
    <SensorCard {...sensorCardProps}>
      <div className="absolute top-4 right-4">
        <Dropdown label={sensorVisual} className="font-bold flex items-center text-sm border border-gray-300 rounded">
          <DropdownItem onClick={() => handleAction('graph')}>Graph</DropdownItem>
          <DropdownItem onClick={() => handleAction('number')}>Number</DropdownItem>
        </Dropdown>
      </div>
      {!servoData ? (
        <div className="flex items-center justify-center w-full h-full">
          <div className="text-gray-500">No Data Available</div>
        </div>
      ) : (
        <div className="flex flex-col w-full h-full relative pt-12">
          {sensorVisual === "Graph" ? (
            servoHistory.length > 0 && (
              <div className="mt-4 w-full h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={servoHistory.slice(-50)}>
                    <XAxis
                      dataKey="timestamp"
                      tick={false}
                      label="Time"
                    />
                    <YAxis domain={[0, 200]} />
                    <Tooltip
                      labelFormatter={(value) => new Date(value).toLocaleTimeString()}
                      formatter={(value) => `${Number(value).toFixed(1)}°`}
                    />
                    <Line
                      type="monotone"
                      dataKey="angle"
                      stroke={angleColor}
                      dot={false}
                      name="Angle"
                    />
                  </LineChart>
                </ResponsiveContainer>
                <div className="text-xs text-gray-500 text-center mt-2">
                  {servoHistory.length} readings stored
                </div>
              </div>
            )
          ) : (
            <div className="flex flex-col items-center p-4 flex-grow">
              <svg width="100" height="80" viewBox="0 0 100 60" className="mb-2">
                {/* Semicircle background */}
                <path
                  d="M10,50 A40,40 0 0,1 90,50"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="2"
                />

                {/* Position marker */}
                <line
                  x1="50"
                  y1="50"
                  x2={x}
                  y2={y}
                  stroke={angleColor}
                  strokeWidth="2"
                />

                <circle cx="50" cy="50" r="3" fill={angleColor} />
                <circle cx={x} cy={y} r="5" fill={angleColor} />
              </svg>

              <div className="text-2xl font-semibold" style={{ color: angleColor }}>
                {servoData.angle.toFixed(1)}°
              </div>
            </div>
          )}
        </div>
      )}
    </SensorCard>
  );
};

export default Servo;