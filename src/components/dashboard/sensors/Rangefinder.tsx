import React, { useState, useEffect } from 'react';
import { BsRulers } from 'react-icons/bs';
import useSensorData from '../hooks/useSensorData';
import SensorCard from './SensorCard';
import { RangefinderData } from '@/utils/sensorParsers';
import { Dropdown, DropdownItem } from "flowbite-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// Define a type for timestamped rangefinder data
interface TimestampedRangeData {
  distance: number;
  timestamp: number;
}

// Define color for distance in the chart
const distanceColor = '#10b981'; // green to match existing UI

const Rangefinder: React.FC = () => {
  // State to store the history of rangefinder readings
  const [rangeHistory, setRangeHistory] = useState<TimestampedRangeData[]>([]);
  const { getSensorData, requestSensors, stopSensor, isConnected, sensorData } = useSensorData();
  const sensorName = 'rangefinder';
  const rangeData = getSensorData<RangefinderData>(sensorName);
  const lastUpdated = sensorData.get(sensorName)?.timestamp;
  const [sensorVisual, setSensorVisual] = useState<string>("Number");

  // Calculate a percentage for distance visualization
  // Assuming max distance is 400cm as per your simulator code
  const distancePercentage = rangeData ? (rangeData.distance / 400) * 100 : 0;

  // Effect to update history when new data arrives
  useEffect(() => {
    if (rangeData && lastUpdated) {
      // Make sure timestamp is a number
      const timestampAsNumber = typeof lastUpdated === 'string'
        ? Number(lastUpdated)
        : lastUpdated;

      // Create a new reading with the properly typed timestamp
      const newReading: TimestampedRangeData = {
        distance: rangeData.distance,
        timestamp: timestampAsNumber
      };

      // Add new reading to history
      setRangeHistory(prev => [...prev, newReading]);
    }
  }, [rangeData, lastUpdated]);

  const handleStart = () => {
    // Clear history when starting new readings
    setRangeHistory([]);
    requestSensors([sensorName]);
  };

  const handleStop = () => {
    stopSensor(sensorName);
  };

  const sensorCardProps = {
    title: "Rangefinder",
    icon: <BsRulers size={20} />,
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
    if (rangeHistory.length > MAX_HISTORY_SIZE) {
      setRangeHistory(prev => prev.slice(prev.length - MAX_HISTORY_SIZE));
    }
  }, [rangeHistory]);

  return (
    <SensorCard {...sensorCardProps}>
      <div className="absolute top-4 right-4">
        <Dropdown label={sensorVisual} className="font-bold flex items-center text-sm border border-gray-300 rounded">
          <DropdownItem onClick={() => handleAction('graph')}>Graph</DropdownItem>
          <DropdownItem onClick={() => handleAction('number')}>Number</DropdownItem>
        </Dropdown>
      </div>
      {!rangeData ? (
        <div className="flex items-center justify-center w-full h-full">
          <div className="text-gray-500">No Data Available</div>
        </div>
      ) : (
        <div className="flex flex-col w-full h-full relative pt-12">
          {sensorVisual === "Graph" ? (
            rangeHistory.length > 0 && (
              <div className="mt-4 w-full h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={rangeHistory.slice(-50)}>
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
                    <Line
                      type="monotone"
                      dataKey="distance"
                      stroke={distanceColor}
                      dot={false}
                      name="Distance"
                    />
                  </LineChart>
                </ResponsiveContainer>
                <div className="text-xs text-gray-500 text-center mt-2">
                  {rangeHistory.length} readings stored
                </div>
              </div>
            )
          ) : (
            <div className="flex flex-col items-center p-4 flex-grow">
              {/* Distance visualization */}
              <div className="w-full h-4 bg-gray-200 rounded-full mb-3">
                <div
                  className="h-full bg-green-500 rounded-full"
                  style={{ width: `${Math.min(100, distancePercentage)}%` }}
                ></div>
              </div>

              <div className="flex items-center justify-center">
                <div className="relative w-24 h-24 mb-2">
                  {/* Radar-like animation */}
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    {/* Background circles */}
                    {[45, 30, 15].map(radius => (
                      <circle
                        key={radius}
                        cx="50"
                        cy="50"
                        r={radius}
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="1"
                      />
                    ))}

                    {/* Radar sweep animation */}
                    <g className="radar-sweep">
                      <path
                        d="M50,50 L50,5 A45,45 0 0,1 95,50 Z"
                        fill="rgba(16, 185, 129, 0.2)"
                        stroke="rgba(16, 185, 129, 0.6)"
                        strokeWidth="1"
                      />
                    </g>

                    {/* Center dot */}
                    <circle cx="50" cy="50" r="3" fill="#10b981" />

                    {/* Distance marker */}
                    <circle
                      cx="50"
                      cy="50"
                      r={Math.min(45, (rangeData.distance / 400) * 45)}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2"
                      strokeDasharray="3,3"
                    />
                  </svg>
                </div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-semibold mb-1" style={{ color: distanceColor }}>
                  {rangeData.distance.toFixed(1)}
                </div>
                <div className="text-sm text-gray-500">
                  centimeters
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </SensorCard>
  );
};

export default Rangefinder;