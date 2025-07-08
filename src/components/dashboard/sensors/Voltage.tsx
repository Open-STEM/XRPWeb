/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef } from 'react';
import { FaBatteryHalf } from 'react-icons/fa';
import useSensorData from '../hooks/useSensorData';
import SensorCard from './SensorCard';
import { VoltageData } from '../utils/sensorParsers';
import { Dropdown, DropdownItem } from "flowbite-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { FaChartLine, FaHashtag, FaCog, FaTrash } from 'react-icons/fa';
import { useGridStackContext } from '../lib/grid-stack-context';
import i18n from '@utils/i18n';

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
  const { removeWidget } = useGridStackContext();
  const widgetIdRef = useRef<string | null>(null);
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

  // Get the GridStack auto-generated ID when component mounts
  useEffect(() => {
    const findGridStackId = () => {
      // Find all grid stack items
      const gridItems = document.querySelectorAll('.grid-stack-item');

      for (const item of gridItems) {
        // Check if this grid item contains our voltage component
        // Look for the specific title that identifies this component
        const sensorCard = item.querySelector('.sensor-card');
        const titleElement = sensorCard?.querySelector('h3');

        if (titleElement?.textContent === 'Battery Voltage') {
          const node = (item as any).gridstackNode;
          if (node && node.id) {
            widgetIdRef.current = node.id;
            console.log('Voltage sensor found GridStack ID:', node.id);
            return;
          }
        }
      }
    };

    // Try to find the ID immediately
    findGridStackId();

    // If not found, try again after a short delay
    if (!widgetIdRef.current) {
      const timeout = setTimeout(findGridStackId, 100);
      return () => clearTimeout(timeout);
    }
  }, []);

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

  const handleDelete = () => {
    if (widgetIdRef.current && removeWidget) {
      console.log('Deleting voltage sensor widget with ID:', widgetIdRef.current);
      removeWidget(widgetIdRef.current);
    } else {
      console.error('Could not find voltage sensor widget ID for deletion');
    }
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
      <div className="absolute top-4 right-4 flex items-center space-x-2">
        <Dropdown label={<FaCog size={16} />} className="font-bold flex items-center text-sm border border-gray-300 rounded">
          <DropdownItem onClick={() => handleAction('graph')}>
            <div className="flex items-center space-x-2">
              <FaChartLine size={16} />
              <span>{i18n.t('graph')}</span>
            </div>
          </DropdownItem>
          <DropdownItem onClick={() => handleAction('number')}>
            <div className="flex items-center space-x-2">
              <FaHashtag size={16} />
              <span>{i18n.t('number')}</span>
            </div>
          </DropdownItem>
        </Dropdown>

        <button
          onClick={handleDelete}
          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors duration-200"
          title="Delete widget"
        >
          <FaTrash size={24} />
        </button>
      </div>
      {!batteryData ? (
        <div className="flex items-center justify-center w-full h-full">
          <div className="text-gray-500 dark:text-gray-400">{i18n.t('no-data-available')}</div>
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
                <div className="text-xs text-gray-500 text-center mt-2 dark:text-gray-400">
                  {batteryHistory.length} {i18n.t('readings-stored')}
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