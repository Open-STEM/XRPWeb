import React, { useState, useEffect } from 'react';
import { FaEye } from 'react-icons/fa';
import useSensorData from '../hooks/useSensorData';
import SensorCard from './SensorCard';
import { ReflectanceData } from '../utils/sensorParsers';
import { Dropdown, DropdownItem } from "flowbite-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// Define a type for timestamped reflectance data
interface TimestampedReflectanceData {
  reflectanceL: number;
  reflectanceR: number;
  timestamp: number;
}

type SideType = 'reflectanceL' | 'reflectanceR';

// Define colors to use consistently across the UI
const sideColors: Record<SideType, string> = {
  reflectanceL: '#8b5cf6', // purple for left
  reflectanceR: '#06b6d4'  // cyan for right
};

const Reflectance: React.FC = () => {
  // State to store the history of reflectance readings
  const [reflectanceHistory, setReflectanceHistory] = useState<TimestampedReflectanceData[]>([]);
  const { getSensorData, requestSensors, stopSensor, sensorData } = useSensorData();
  const sensorName = 'reflectance';
  const reflectanceData = getSensorData<ReflectanceData>(sensorName);
  const lastUpdated = sensorData.get(sensorName)?.timestamp;
  const [sensorVisual, setSensorVisual] = useState<string>("Number");

  // Calculate percentages for visualization (assuming max reflectance is 1000)
  const maxReflectance = 1000;
  const leftPercentage = reflectanceData
    ? Math.min(100, (reflectanceData.reflectanceL / maxReflectance) * 100)
    : 0;
  const rightPercentage = reflectanceData
    ? Math.min(100, (reflectanceData.reflectanceR / maxReflectance) * 100)
    : 0;

  // Effect to update history when new data arrives
  useEffect(() => {
    if (reflectanceData && lastUpdated) {
      // Make sure timestamp is a number
      const timestampAsNumber = typeof lastUpdated === 'string'
        ? Number(lastUpdated)
        : lastUpdated;
      // Create a new reading with the properly typed timestamp
      const newReading: TimestampedReflectanceData = {
        reflectanceL: reflectanceData.reflectanceL,
        reflectanceR: reflectanceData.reflectanceR,
        timestamp: timestampAsNumber
      };
      // Add new reading to history
      setReflectanceHistory(prev => [...prev, newReading]);
    }
  }, [reflectanceData, lastUpdated]);

  const handleStart = () => {
    // Clear history when starting new readings
    setReflectanceHistory([]);
    requestSensors([sensorName]);
  };

  const handleStop = () => {
    stopSensor(sensorName);
  };

  const sensorCardProps = {
    title: "Reflectance Sensor",
    icon: <FaEye size={20} />,
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
    if (reflectanceHistory.length > MAX_HISTORY_SIZE) {
      setReflectanceHistory(prev => prev.slice(prev.length - MAX_HISTORY_SIZE));
    }
  }, [reflectanceHistory]);

  return (
    <SensorCard {...sensorCardProps}>
      <div className="absolute top-4 right-4">
        <Dropdown label={sensorVisual} className="font-bold flex items-center text-sm border border-gray-300 rounded">
          <DropdownItem onClick={() => handleAction('graph')}>Graph</DropdownItem>
          <DropdownItem onClick={() => handleAction('number')}>Number</DropdownItem>
        </Dropdown>
      </div>
      {!reflectanceData ? (
        <div className="flex items-center justify-center w-full h-full">
          <div className="text-gray-500">No Data Available</div>
        </div>
      ) : (
        <div className="flex flex-col w-full h-full relative pt-12">
          {sensorVisual === "Graph" ? (
            reflectanceHistory.length > 0 && (
              <div className="mt-4 w-full h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={reflectanceHistory.slice(-50)}>
                    <XAxis
                      dataKey="timestamp"
                      tick={false}
                      label="Time"
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(value) => new Date(value).toLocaleTimeString()}
                      formatter={(value) => typeof value === 'number' ? value.toFixed(0) : value}
                    />
                    <Line type="monotone" dataKey="reflectanceL" stroke={sideColors.reflectanceL} dot={false} name="Left" />
                    <Line type="monotone" dataKey="reflectanceR" stroke={sideColors.reflectanceR} dot={false} name="Right" />
                  </LineChart>
                </ResponsiveContainer>
                <div className="text-xs text-gray-500 text-center mt-2">
                  {reflectanceHistory.length} readings stored
                </div>
              </div>
            )
          ) : (
            <div className="flex flex-col p-4 flex-grow">
              {/* Visual representation of sensors */}
              <div className="flex justify-center items-center mb-6">
                <div className="flex space-x-8">
                  {/* Left sensor */}
                  <div className="flex flex-col items-center">
                    <div
                      className="w-12 h-12 rounded-full border-4 flex items-center justify-center mb-2"
                      style={{
                        borderColor: sideColors.reflectanceL,
                        backgroundColor: `rgba(139, 92, 246, ${leftPercentage / 100})`
                      }}
                    >
                      <div className="w-6 h-6 rounded-full bg-white opacity-80"></div>
                    </div>
                    <span className="text-xs font-medium" style={{ color: sideColors.reflectanceL }}>
                      LEFT
                    </span>
                  </div>

                  {/* Right sensor */}
                  <div className="flex flex-col items-center">
                    <div
                      className="w-12 h-12 rounded-full border-4 flex items-center justify-center mb-2"
                      style={{
                        borderColor: sideColors.reflectanceR,
                        backgroundColor: `rgba(6, 182, 212, ${rightPercentage / 100})`
                      }}
                    >
                      <div className="w-6 h-6 rounded-full bg-white opacity-80"></div>
                    </div>
                    <span className="text-xs font-medium" style={{ color: sideColors.reflectanceR }}>
                      RIGHT
                    </span>
                  </div>
                </div>
              </div>

              {/* Reflectance bars */}
              <div className="space-y-4 mb-4">
                {/* Left reflectance bar */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium" style={{ color: sideColors.reflectanceL }}>
                      Left
                    </span>
                    <span className="text-sm font-mono">
                      {reflectanceData.reflectanceL}
                    </span>
                  </div>
                  <div className="w-full h-3 bg-gray-200 rounded-full">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${leftPercentage}%`,
                        backgroundColor: sideColors.reflectanceL
                      }}
                    ></div>
                  </div>
                </div>

                {/* Right reflectance bar */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium" style={{ color: sideColors.reflectanceR }}>
                      Right
                    </span>
                    <span className="text-sm font-mono">
                      {reflectanceData.reflectanceR}
                    </span>
                  </div>
                  <div className="w-full h-3 bg-gray-200 rounded-full">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${rightPercentage}%`,
                        backgroundColor: sideColors.reflectanceR
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Summary display */}
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="flex flex-col items-center">
                  <span className="text-xs font-medium" style={{ color: sideColors.reflectanceL }}>
                    Left Reflectance
                  </span>
                  <span className="font-mono text-lg">{reflectanceData.reflectanceL}</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-xs font-medium" style={{ color: sideColors.reflectanceR }}>
                    Right Reflectance
                  </span>
                  <span className="font-mono text-lg">{reflectanceData.reflectanceR}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </SensorCard>
  );
};

export default Reflectance;