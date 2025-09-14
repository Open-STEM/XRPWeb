import React, { useState, useEffect, useRef } from 'react';
import useSensorData from '../hooks/useSensorData';
import SensorCard from './SensorCard';
import { EncoderData } from '../utils/sensorParsers';
import { Dropdown, DropdownItem } from "flowbite-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { FaChartLine, FaHashtag, FaCog, FaTrash } from 'react-icons/fa';
import { useGridStackContext } from '../lib/grid-stack-context';
import i18n from '@utils/i18n'; // Adjust the path if your i18n setup file is elsewhere
import { FlowBiteConstants } from '@/utils/constants';


// Define a type for timestamped encoder data
interface TimestampedEncoderData {
  encL: number;
  encR: number;
  enc3: number;
  enc4: number;
  timestamp: number;
}

type ChannelType = 'encL' | 'encR' | 'enc3' | 'enc4';

// Define colors to use consistently across the UI
const channelColors: Record<ChannelType, string> = {
  encL: '#8b5cf6',  // purple for left
  encR: '#06b6d4',  // cyan for right
  enc3: '#10b981',  // green for encoder 3
  enc4: '#f59e0b'   // amber for encoder 4
};

const channelLabels: Record<ChannelType, string> = {
  encL: 'Left',
  encR: 'Right',
  enc3: 'Enc 3',
  enc4: 'Enc 4'
};

const Encoder: React.FC = () => {
  // State to store the history of encoder readings
  const [encoderHistory, setEncoderHistory] = useState<TimestampedEncoderData[]>([]);
  const { getSensorData, requestSensors, stopSensor, sensorData } = useSensorData();
  const { removeWidget } = useGridStackContext();
  const widgetIdRef = useRef<string | null>(null);
  const sensorName = 'encoders';
  const encoderData = getSensorData<EncoderData>(sensorName);
  const lastUpdated = sensorData.get(sensorName)?.timestamp;
  const [sensorVisual, setSensorVisual] = useState<string>("Number");

  // Calculate rotation percentage for visual representation (mod 360 for degrees)
  const getRotationDegrees = (ticks: number) => (Math.abs(ticks) % 360);

  // Get the GridStack auto-generated ID when component mounts
  useEffect(() => {
    const findGridStackId = () => {
      // Find all grid stack items
      const gridItems = document.querySelectorAll('.grid-stack-item');

      for (const item of gridItems) {
        // Check if this grid item contains our encoder component
        // Look for the specific title that identifies this component
        const sensorCard = item.querySelector('.sensor-card');
        const titleElement = sensorCard?.querySelector('h3');

        if (titleElement?.textContent === 'Encoders') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const node = (item as any).gridstackNode;
          if (node && node.id) {
            widgetIdRef.current = node.id;
            console.log('Encoder found GridStack ID:', node.id);
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
    if (encoderData && lastUpdated) {
      // Make sure timestamp is a number
      const timestampAsNumber = typeof lastUpdated === 'string'
        ? Number(lastUpdated)
        : lastUpdated;
      // Create a new reading with the properly typed timestamp
      const newReading: TimestampedEncoderData = {
        encL: encoderData.encL,
        encR: encoderData.encR,
        enc3: encoderData.enc3,
        enc4: encoderData.enc4,
        timestamp: timestampAsNumber
      };
      // Add new reading to history
      setEncoderHistory(prev => [...prev, newReading]);
    }
  }, [encoderData, lastUpdated]);

  const handleStart = () => {
    // Clear history when starting new readings
    setEncoderHistory([]);
    requestSensors([sensorName]);
  };

  const handleStop = () => {
    stopSensor(sensorName);
  };

  const handleDelete = () => {
    if (widgetIdRef.current && removeWidget) {
      console.log('Deleting encoder widget with ID:', widgetIdRef.current);
      removeWidget(widgetIdRef.current);
    } else {
      console.error('Could not find encoder widget ID for deletion');
    }
  };

  const sensorCardProps = {
    title: "Encoders",
    icon: <FaCog size={20} />,
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
    if (encoderHistory.length > MAX_HISTORY_SIZE) {
      setEncoderHistory(prev => prev.slice(prev.length - MAX_HISTORY_SIZE));
    }
  }, [encoderHistory]);

  return (
    <SensorCard {...sensorCardProps}>
      <div className="absolute top-4 right-4 flex items-center space-x-2">
        <Dropdown label={<FaCog size={16} />} inline={true} theme={FlowBiteConstants.DropdownTheme} className="font-bold flex items-center text-sm border border-gray-300 rounded">
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
      {!encoderData ? (
        <div className="flex items-center justify-center w-full h-full">
          <div className="text-gray-500 dark:text-gray-400">{i18n.t('no-data-available')}</div>
        </div>
      ) : (
        <div className="flex flex-col w-full h-full relative pt-12">
          {sensorVisual === "Graph" ? (
            encoderHistory.length > 0 && (
              <div className="mt-4 w-full h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={encoderHistory.slice(-50)}>
                    <XAxis
                      dataKey="timestamp"
                      tick={false}
                      label={i18n.t('time')}
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(value) => new Date(value).toLocaleTimeString()}
                      formatter={(value) => typeof value === 'number' ? `${value} ticks` : value}
                    />
                    <Line type="monotone" dataKey="encL" stroke={channelColors.encL} dot={false} name="Left" />
                    <Line type="monotone" dataKey="encR" stroke={channelColors.encR} dot={false} name="Right" />
                    <Line type="monotone" dataKey="enc3" stroke={channelColors.enc3} dot={false} name="Enc 3" />
                    <Line type="monotone" dataKey="enc4" stroke={channelColors.enc4} dot={false} name="Enc 4" />
                  </LineChart>
                </ResponsiveContainer>
                <div className="text-xs text-gray-500 text-center mt-2 dark:text-gray-400">
                  {encoderHistory.length} {i18n.t('readings-stored')}
                </div>
              </div>
            )
          ) : (
            <div className="flex flex-col p-4 flex-grow">
              {/* Encoder wheels visualization */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                {(['encL', 'encR', 'enc3', 'enc4'] as const).map((channel) => {
                  const value = encoderData[channel];
                  const rotationDegrees = getRotationDegrees(value);
                  return (
                    <div key={channel} className="flex flex-col items-center">
                      <span className="text-xs font-medium mb-2" style={{ color: channelColors[channel] }}>
                        {channelLabels[channel]}
                      </span>
                      {/* Rotating wheel visualization */}
                      <div className="relative w-12 h-12 mb-2">
                        <svg viewBox="0 0 48 48" className="w-full h-full">
                          {/* Outer wheel */}
                          <circle
                            cx="24"
                            cy="24"
                            r="20"
                            fill="none"
                            stroke={channelColors[channel]}
                            strokeWidth="3"
                          />
                          {/* Inner circle */}
                          <circle
                            cx="24"
                            cy="24"
                            r="12"
                            fill="none"
                            stroke={channelColors[channel]}
                            strokeWidth="1"
                            opacity="0.5"
                          />
                          {/* Rotation indicator */}
                          <g transform={`rotate(${rotationDegrees} 24 24)`}>
                            <line
                              x1="24"
                              y1="24"
                              x2="24"
                              y2="8"
                              stroke={channelColors[channel]}
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                            <circle
                              cx="24"
                              cy="10"
                              r="2"
                              fill={channelColors[channel]}
                            />
                          </g>
                          {/* Center dot */}
                          <circle
                            cx="24"
                            cy="24"
                            r="3"
                            fill={channelColors[channel]}
                          />
                        </svg>
                      </div>
                      <span className="font-mono text-sm">{value}</span>
                      <span className="text-xs text-gray-500">{i18n.t('ticks')}</span>
                    </div>
                  );
                })}
              </div>

              {/* Encoder values in a compact grid */}
              <div className="grid grid-cols-2 gap-3 text-center">
                {(['encL', 'encR', 'enc3', 'enc4'] as const).map((channel) => (
                  <div key={channel} className="p-2 bg-gray-50 rounded">
                    <div className="text-xs font-medium" style={{ color: channelColors[channel] }}>
                      {channelLabels[channel]}
                    </div>
                    <div className="font-mono text-lg">{encoderData[channel]}</div>
                    <div className="text-xs text-gray-500">
                      {(encoderData[channel] / 360).toFixed(1)} rot
                    </div>
                  </div>
                ))}
              </div>

              {/* Total ticks display */}
              <div className="mt-4 pt-4 border-t border-gray-200 text-center">
                <div className="text-sm text-gray-600 mb-1">Total Ticks</div>
                <div className="text-xl font-bold text-gray-800">
                  {(encoderData.encL + encoderData.encR +
                    encoderData.enc3 + encoderData.enc4)}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </SensorCard>
  );
};

export default Encoder;