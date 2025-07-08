import React, { useState, useEffect, useRef } from 'react';
import { FaBolt } from 'react-icons/fa';
import useSensorData from '../hooks/useSensorData';
import SensorCard from './SensorCard';
import { CurrentData } from '../utils/sensorParsers';
import { Dropdown, DropdownItem } from "flowbite-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { FaChartLine, FaHashtag, FaCog, FaTrash } from 'react-icons/fa';
import { useGridStackContext } from '../lib/grid-stack-context';
import i18n from '@/utils/i18n';

// Define a type for timestamped current data
interface TimestampedCurrentData {
  currL: number;
  currR: number;
  curr3: number;
  curr4: number;
  timestamp: number;
}

type ChannelType = 'currL' | 'currR' | 'curr3' | 'curr4';

// Define colors to use consistently across the UI
const channelColors: Record<ChannelType, string> = {
  currL: '#8b5cf6',  // purple for left
  currR: '#06b6d4',  // cyan for right
  curr3: '#10b981',  // green for channel 3
  curr4: '#f59e0b'   // amber for channel 4
};

const channelLabels: Record<ChannelType, string> = {
  currL: 'Left',
  currR: 'Right',
  curr3: 'Ch 3',
  curr4: 'Ch 4'
};

const Current: React.FC = () => {
  // State to store the history of current readings
  const [currentHistory, setCurrentHistory] = useState<TimestampedCurrentData[]>([]);
  const { getSensorData, requestSensors, stopSensor, sensorData } = useSensorData();
  const { removeWidget } = useGridStackContext();
  const widgetIdRef = useRef<string | null>(null);
  const sensorName = 'current';
  const currentData = getSensorData<CurrentData>(sensorName);
  const lastUpdated = sensorData.get(sensorName)?.timestamp;
  const [sensorVisual, setSensorVisual] = useState<string>("Number");

  // Calculate percentages for visualization (assuming max current is 2000mA)
  const maxCurrent = 2000;
  const getPercentage = (current: number) => Math.min(100, Math.abs(current / maxCurrent) * 100);

  // Get the GridStack auto-generated ID when component mounts
  useEffect(() => {
    const findGridStackId = () => {
      // Find all grid stack items
      const gridItems = document.querySelectorAll('.grid-stack-item');

      for (const item of gridItems) {
        // Check if this grid item contains our current sensor component
        // Look for the specific title that identifies this component
        const sensorCard = item.querySelector('.sensor-card');
        const titleElement = sensorCard?.querySelector('h3');

        if (titleElement?.textContent === 'Current') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const node = (item as any).gridstackNode;
          if (node && node.id) {
            widgetIdRef.current = node.id;
            console.log('Current sensor found GridStack ID:', node.id);
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
    if (currentData && lastUpdated) {
      // Make sure timestamp is a number
      const timestampAsNumber = typeof lastUpdated === 'string'
        ? Number(lastUpdated)
        : lastUpdated;
      // Create a new reading with the properly typed timestamp
      const newReading: TimestampedCurrentData = {
        currL: currentData.currL,
        currR: currentData.currR,
        curr3: currentData.curr3,
        curr4: currentData.curr4,
        timestamp: timestampAsNumber
      };
      // Add new reading to history
      setCurrentHistory(prev => [...prev, newReading]);
    }
  }, [currentData, lastUpdated]);

  const handleStart = () => {
    // Clear history when starting new readings
    setCurrentHistory([]);
    requestSensors([sensorName]);
  };

  const handleStop = () => {
    stopSensor(sensorName);
  };

  const handleDelete = () => {
    if (widgetIdRef.current && removeWidget) {
      console.log('Deleting current sensor widget with ID:', widgetIdRef.current);
      removeWidget(widgetIdRef.current);
    } else {
      console.error('Could not find current sensor widget ID for deletion');
    }
  };

  const sensorCardProps = {
    title: "Current",
    icon: <FaBolt size={20} />,
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
    if (currentHistory.length > MAX_HISTORY_SIZE) {
      setCurrentHistory(prev => prev.slice(prev.length - MAX_HISTORY_SIZE));
    }
  }, [currentHistory]);

  return (
    <SensorCard {...sensorCardProps}>
      <div className="absolute top-4 right-4 flex items-center space-x-2">
        {/* View toggle dropdown */}
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
      {!currentData ? (
        <div className="flex items-center justify-center w-full h-full">
          <div className="text-gray-500 dark:text-gray-400">{i18n.t('no-data-available')}</div>
        </div>
      ) : (
        <div className="flex flex-col w-full h-full relative pt-12">
          {sensorVisual === "Graph" ? (
            currentHistory.length > 0 && (
              <div className="mt-4 w-full h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={currentHistory.slice(-50)}>
                    <XAxis
                      dataKey="timestamp"
                      tick={false}
                      label="Time"
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(value) => new Date(value).toLocaleTimeString()}
                      formatter={(value) => typeof value === 'number' ? `${value.toFixed(0)} mA` : value}
                    />
                    <Line type="monotone" dataKey="currL" stroke={channelColors.currL} dot={false} name="Left" />
                    <Line type="monotone" dataKey="currR" stroke={channelColors.currR} dot={false} name="Right" />
                    <Line type="monotone" dataKey="curr3" stroke={channelColors.curr3} dot={false} name="Ch 3" />
                    <Line type="monotone" dataKey="curr4" stroke={channelColors.curr4} dot={false} name="Ch 4" />
                  </LineChart>
                </ResponsiveContainer>
                <div className="text-xs text-gray-500 text-center mt-2 dark:text-gray-400">
                  {currentHistory.length} {i18n.t('readings-stored')}
                </div>
              </div>
            )
          ) : (
            <div className="flex flex-col p-4 flex-grow">
              {/* Current bars */}
              <div className="space-y-3 mb-4">
                {(['currL', 'currR', 'curr3', 'curr4'] as const).map((channel) => {
                  const value = currentData[channel];
                  const percentage = getPercentage(value);
                  return (
                    <div key={channel}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium" style={{ color: channelColors[channel] }}>
                          {channelLabels[channel]}
                        </span>
                        <span className="text-sm font-mono">
                          {value.toFixed(0)} mA
                        </span>
                      </div>
                      <div className="w-full h-3 bg-gray-200 rounded-full">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: channelColors[channel]
                          }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Summary grid */}
              <div className="grid grid-cols-2 gap-4 text-center">
                {(['currL', 'currR', 'curr3', 'curr4'] as const).map((channel) => (
                  <div key={channel} className="flex flex-col items-center">
                    <span className="text-xs font-medium" style={{ color: channelColors[channel] }}>
                      {channelLabels[channel]}
                    </span>
                    <span className="font-mono text-lg">{currentData[channel].toFixed(0)}</span>
                    <span className="text-xs text-gray-500">mA</span>
                  </div>
                ))}
              </div>

              {/* Total current display */}
              <div className="mt-4 pt-4 border-t border-gray-200 text-center">
                <div className="text-sm text-gray-600 mb-1">Total Current</div>
                <div className="text-xl font-bold text-gray-800">
                  {(currentData.currL + currentData.currR +
                    currentData.curr3 + currentData.curr4).toFixed(0)} mA
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </SensorCard>
  );
};

export default Current;