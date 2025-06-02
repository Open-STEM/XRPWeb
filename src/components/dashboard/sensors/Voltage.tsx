import React, { useState, useEffect } from 'react';
import { FaBatteryHalf } from 'react-icons/fa';
import useSensorData from '../hooks/useSensorData';
import SensorCard from './SensorCard';
import { VoltageData } from '../utils/sensorParsers';
import { Dropdown, DropdownItem } from "flowbite-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// Define a type for timestamped battery data
interface TimestampedBatteryData {
  voltage: number;
  timestamp: number;
}

// Define color for voltage in the chart
const voltageColor = '#f59e0b'; // amber color for battery voltage

const Voltage: React.FC = () => {
  // State to store the history of battery readings
  const [batteryHistory, setBatteryHistory] = useState<TimestampedBatteryData[]>([]);
  const { getSensorData, requestSensors, stopSensor, sensorData } = useSensorData();
  const sensorName = 'battery';
  const batteryData = getSensorData<VoltageData>(sensorName);
  const lastUpdated = sensorData.get(sensorName)?.timestamp;
  const [sensorVisual, setSensorVisual] = useState<string>("Number");

  // Calculate battery percentage (assuming 3.3V is 100% and 2.5V is 0%)
  const minVoltage = 2.5;
  const maxVoltage = 3.3;
  const batteryPercentage = batteryData
    ? Math.max(0, Math.min(100, ((batteryData.voltage - minVoltage) / (maxVoltage - minVoltage)) * 100))
    : 0;

  // Determine battery status color based on voltage level
  const getBatteryColor = (percentage: number) => {
    if (percentage > 60) return '#10b981'; // green
    if (percentage > 30) return '#f59e0b'; // amber
    return '#ef4444'; // red
  };

  // Effect to update history when new data arrives
  useEffect(() => {
    if (batteryData && lastUpdated) {
      // Make sure timestamp is a number
      const timestampAsNumber = typeof lastUpdated === 'string'
        ? Number(lastUpdated)
        : lastUpdated;
      // Create a new reading with the properly typed timestamp
      const newReading: TimestampedBatteryData = {
        voltage: batteryData.voltage,
        timestamp: timestampAsNumber
      };
      // Add new reading to history
      setBatteryHistory(prev => [...prev, newReading]);
    }
  }, [batteryData, lastUpdated]);

  const handleStart = () => {
    // Clear history when starting new readings
    setBatteryHistory([]);
    requestSensors([sensorName]);
  };

  const handleStop = () => {
    stopSensor(sensorName);
  };

  const sensorCardProps = {
    title: "Battery Voltage",
    icon: <FaBatteryHalf size={20} />,
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
    if (batteryHistory.length > MAX_HISTORY_SIZE) {
      setBatteryHistory(prev => prev.slice(prev.length - MAX_HISTORY_SIZE));
    }
  }, [batteryHistory]);

  return (
    <SensorCard {...sensorCardProps}>
      <div className="absolute top-4 right-4">
        <Dropdown label={sensorVisual} className="font-bold flex items-center text-sm border border-gray-300 rounded">
          <DropdownItem onClick={() => handleAction('graph')}>Graph</DropdownItem>
          <DropdownItem onClick={() => handleAction('number')}>Number</DropdownItem>
        </Dropdown>
      </div>
      {!batteryData ? (
        <div className="flex items-center justify-center w-full h-full">
          <div className="text-gray-500">No Data Available</div>
        </div>
      ) : (
        <div className="flex flex-col w-full h-full relative pt-12">
          {sensorVisual === "Graph" ? (
            batteryHistory.length > 0 && (
              <div className="mt-4 w-full h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={batteryHistory.slice(-50)}>
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
                      dataKey="voltage"
                      stroke={voltageColor}
                      dot={false}
                      name="Voltage"
                    />
                  </LineChart>
                </ResponsiveContainer>
                <div className="text-xs text-gray-500 text-center mt-2">
                  {batteryHistory.length} readings stored
                </div>
              </div>
            )
          ) : (
            <div className="flex flex-col items-center p-4 flex-grow">
              {/* Battery visual representation */}
              <div className="relative mb-4">
                <div className="w-16 h-32 border-2 border-gray-400 rounded-lg bg-white">
                  {/* Battery fill level */}
                  <div
                    className="w-full rounded-lg transition-all duration-300"
                    style={{
                      height: `${batteryPercentage}%`,
                      backgroundColor: getBatteryColor(batteryPercentage),
                      marginTop: `${100 - batteryPercentage}%`
                    }}
                  ></div>
                </div>
                {/* Battery terminal */}
                <div className="absolute top-[-4px] left-1/2 transform -translate-x-1/2 w-6 h-2 bg-gray-400 rounded-t"></div>
              </div>

              {/* Voltage bar */}
              <div className="w-full h-4 bg-gray-200 rounded-full mb-4">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${batteryPercentage}%`,
                    backgroundColor: getBatteryColor(batteryPercentage)
                  }}
                ></div>
              </div>

              {/* Voltage display */}
              <div className="text-center">
                <div
                  className="text-3xl font-bold mb-1"
                  style={{ color: getBatteryColor(batteryPercentage) }}
                >
                  {batteryData.voltage.toFixed(2)}V
                </div>
                <div className="text-lg font-semibold mb-1" style={{ color: voltageColor }}>
                  {batteryPercentage.toFixed(0)}%
                </div>
                <div className="text-sm text-gray-500">
                  {batteryPercentage > 60 ? 'Good' :
                    batteryPercentage > 30 ? 'Low' : 'Critical'}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </SensorCard>
  );
};

export default Voltage;