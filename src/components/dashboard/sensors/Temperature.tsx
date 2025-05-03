import React, { useState, useEffect } from 'react';
import { FaTemperatureHigh } from 'react-icons/fa';
import useSensorData from '../hooks/useSensorData';
import SensorCard from './SensorCard';
import { TemperatureData } from '@/utils/sensorParsers';
import { Dropdown, DropdownItem } from "flowbite-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// Define a type for timestamped temperature data
interface TimestampedTempData {
  celsius: number;
  fahrenheit: number;
  timestamp: number;
}

// Define colors to use consistently across the UI
const tempColors = {
  celsius: '#ef4444',    // red
  fahrenheit: '#fb923c'  // orange
};

const Temperature: React.FC = () => {
  // State to store the history of temperature readings
  const [tempHistory, setTempHistory] = useState<TimestampedTempData[]>([]);
  const { getSensorData, requestSensors, stopSensor, isConnected, sensorData } = useSensorData();
  const sensorName = 'temperature';
  const tempData = getSensorData<TemperatureData>(sensorName);
  const lastUpdated = sensorData.get(sensorName)?.timestamp;
  const [sensorVisual, setSensorVisual] = useState<string>("Number");

  // Convert to Fahrenheit for display
  const fahrenheit = tempData ? (tempData.celsius * 9 / 5) + 32 : null;

  // Effect to update history when new data arrives
  useEffect(() => {
    if (tempData && lastUpdated && fahrenheit !== null) {
      // Make sure timestamp is a number
      const timestampAsNumber = typeof lastUpdated === 'string'
        ? Number(lastUpdated)
        : lastUpdated;

      // Create a new reading with the properly typed timestamp
      const newReading: TimestampedTempData = {
        celsius: tempData.celsius,
        fahrenheit: fahrenheit,
        timestamp: timestampAsNumber
      };

      // Add new reading to history
      setTempHistory(prev => [...prev, newReading]);
    }
  }, [tempData, lastUpdated, fahrenheit]);

  const handleStart = () => {
    // Clear history when starting new readings
    setTempHistory([]);
    requestSensors([sensorName]);
  };

  const handleStop = () => {
    stopSensor(sensorName);
  };

  const sensorCardProps = {
    title: "Temperature",
    icon: <FaTemperatureHigh size={20} />,
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
    if (tempHistory.length > MAX_HISTORY_SIZE) {
      setTempHistory(prev => prev.slice(prev.length - MAX_HISTORY_SIZE));
    }
  }, [tempHistory]);

  return (
    <SensorCard {...sensorCardProps}>
      <div className="absolute top-4 right-4">
        <Dropdown label={sensorVisual} className="font-bold flex items-center text-sm border border-gray-300 rounded">
          <DropdownItem onClick={() => handleAction('graph')}>Graph</DropdownItem>
          <DropdownItem onClick={() => handleAction('number')}>Number</DropdownItem>
        </Dropdown>
      </div>
      {!tempData ? (
        <div className="flex items-center justify-center w-full h-full">
          <div className="text-gray-500">No Data Available</div>
        </div>
      ) : (
        <div className="flex flex-col w-full h-full relative pt-12">
          {sensorVisual === "Graph" ? (
            tempHistory.length > 0 && (
              <div className="mt-4 w-full h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={tempHistory.slice(-50)}>
                    <XAxis
                      dataKey="timestamp"
                      tick={false}
                      label="Time"
                    />
                    <YAxis yAxisId="celsius" domain={['auto', 'auto']} />
                    <YAxis yAxisId="fahrenheit" orientation="right" domain={['auto', 'auto']} hide />
                    <Tooltip
                      labelFormatter={(value) => new Date(value).toLocaleTimeString()}
                      formatter={(value, name) => {
                        if (name === 'celsius') return `${Number(value).toFixed(1)}°C`;
                        if (name === 'fahrenheit') return `${Number(value).toFixed(1)}°F`;
                        return value;
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="celsius"
                      stroke={tempColors.celsius}
                      dot={false}
                      name="Celsius"
                      yAxisId="celsius"
                    />
                    <Line
                      type="monotone"
                      dataKey="fahrenheit"
                      stroke={tempColors.fahrenheit}
                      dot={false}
                      name="Fahrenheit"
                      yAxisId="fahrenheit"
                    />
                  </LineChart>
                </ResponsiveContainer>
                <div className="text-xs text-gray-500 text-center mt-2">
                  {tempHistory.length} readings stored
                </div>
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center p-4 flex-grow">
              {/* Thermometer visualization */}
              <div className="relative w-6 h-24 bg-gray-200 rounded-full mb-4 overflow-hidden">
                <div
                  className="absolute bottom-0 w-full bg-gradient-to-t from-red-500 to-orange-400 rounded-full"
                  style={{
                    height: `${Math.min(100, Math.max(0, ((tempData.celsius + 10) / 50) * 100))}%`
                  }}
                ></div>
                <div className="absolute bottom-0 left-1/2 w-2 h-2 bg-gray-600 rounded-full transform -translate-x-1/2 -translate-y-1"></div>
              </div>

              <div className="text-3xl font-semibold mb-1" style={{ color: tempColors.celsius }}>
                {tempData.celsius.toFixed(1)}°C
              </div>
              <div className="text-xl font-medium" style={{ color: tempColors.fahrenheit }}>
                {fahrenheit?.toFixed(1)}°F
              </div>
            </div>
          )}
        </div>
      )}
    </SensorCard>
  );
};

export default Temperature;