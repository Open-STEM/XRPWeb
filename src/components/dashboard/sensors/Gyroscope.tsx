import React, { useState, useEffect, useRef } from 'react';
import { FaGlobe } from 'react-icons/fa';
import useSensorData from '../hooks/useSensorData';
import SensorCard from './SensorCard';
import { GyroscopeData } from '../utils/sensorParsers';
import { Dropdown, DropdownItem } from "flowbite-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { FaChartLine, FaHashtag, FaCog, FaTrash } from 'react-icons/fa';
import { useGridStackContext } from '../lib/grid-stack-context';
import { FlowBiteConstants } from '@/utils/constants';
import { useTranslation } from 'react-i18next';


// Define a type for timestamped gyroscope data
interface TimestampedGyroData {
  pitch: number;
  roll: number;
  yaw: number;
  timestamp: number;
}

type AxisType = 'pitch' | 'roll' | 'yaw';

// Define colors to use consistently across the UI
const axisColors: Record<AxisType, string> = {
  pitch: '#3b82f6', // blue
  roll: '#10b981',  // green
  yaw: '#ef4444'    // red
};

const Gyroscope: React.FC = () => {
  // State to store the history of gyroscope readings
  const { t } = useTranslation();
  const [gyroHistory, setGyroHistory] = useState<TimestampedGyroData[]>([]);
  const { getSensorData, requestSensors, stopSensor, sensorData } = useSensorData();
  const { removeWidget } = useGridStackContext();
  const widgetIdRef = useRef<string | null>(null);
  const sensorName = 'gyroscope';
  const gyroData = getSensorData<GyroscopeData>(sensorName);
  const lastUpdated = sensorData.get(sensorName)?.timestamp;
  const [sensorVisual, setSensorVisual] = useState<string>("Number");

  // Get the GridStack auto-generated ID when component mounts
  useEffect(() => {
    const findGridStackId = () => {
      // Find all grid stack items
      const gridItems = document.querySelectorAll('.grid-stack-item');

      for (const item of gridItems) {
        // Check if this grid item contains our gyroscope component
        // Look for the specific title that identifies this component
        const sensorCard = item.querySelector('.sensor-card');
        const titleElement = sensorCard?.querySelector('h3');

        if (titleElement?.textContent === t('gyroscope')) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const node = (item as any).gridstackNode;
          if (node && node.id) {
            widgetIdRef.current = node.id;
            console.log('Gyroscope found GridStack ID:', node.id);
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
    if (gyroData && lastUpdated) {
      // Make sure timestamp is a number
      const timestampAsNumber = typeof lastUpdated === 'string'
        ? Number(lastUpdated)
        : lastUpdated;
      // Create a new reading with the properly typed timestamp
      const newReading: TimestampedGyroData = {
        pitch: gyroData.pitch,
        roll: gyroData.roll,
        yaw: gyroData.yaw,
        timestamp: timestampAsNumber
      };
      // Add new reading to history
      setGyroHistory(prev => [...prev, newReading]);
    }
  }, [gyroData, lastUpdated]);

  const handleStart = () => {
    // Clear history when starting new readings
    setGyroHistory([]);
    requestSensors([sensorName]);
  };

  const handleStop = () => {
    stopSensor(sensorName);
  };

  const handleDelete = () => {
    if (widgetIdRef.current && removeWidget) {
      console.log('Deleting gyroscope widget with ID:', widgetIdRef.current);
      removeWidget(widgetIdRef.current);
    } else {
      console.error('Could not find gyroscope widget ID for deletion');
    }
  };

  const sensorCardProps = {
    title: t('gyroscope'),
    icon: <FaGlobe size={20} />,
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
    if (gyroHistory.length > MAX_HISTORY_SIZE) {
      setGyroHistory(prev => prev.slice(prev.length - MAX_HISTORY_SIZE));
    }
  }, [gyroHistory]);

  return (
    <SensorCard {...sensorCardProps}>
      <div className="absolute top-4 right-4 flex items-center space-x-2">
        <Dropdown label={<FaCog size={16} />} inline={true} theme={FlowBiteConstants.DropdownTheme} className="font-bold flex items-center text-sm border border-gray-300 rounded">
          <DropdownItem onClick={() => handleAction('graph')}>
            <div className="flex items-center space-x-2">
              <FaChartLine size={16} />
              <span>{t('graph')}</span>
            </div>
          </DropdownItem>
          <DropdownItem onClick={() => handleAction('number')}>
            <div className="flex items-center space-x-2">
              <FaHashtag size={16} />
              <span>{t('number')}</span>
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
      {!gyroData ? (
        <div className="flex items-center justify-center w-full h-full">
          <div className="text-gray-500 dark:text-gray-400">{t('no-data-available')}</div>
        </div>
      ) : (
        <div className="flex flex-col w-full h-full relative pt-12">
          {sensorVisual === "Graph" ? (
            gyroHistory.length > 0 && (
              <div className="mt-4 w-full h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={gyroHistory.slice(-50)}>
                    <XAxis
                      dataKey="timestamp"
                      tick={false}
                      label={t('time')}
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(value) => new Date(value).toLocaleTimeString()}
                      formatter={(value) => typeof value === 'number' ? value.toFixed(2) : value}
                    />
                    <Line type="monotone" dataKey="pitch" stroke={axisColors.pitch} dot={false} />
                    <Line type="monotone" dataKey="roll" stroke={axisColors.roll} dot={false} />
                    <Line type="monotone" dataKey="yaw" stroke={axisColors.yaw} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
                <div className="text-xs text-gray-500 text-center mt-2 dark:text-gray-400">
                  {gyroHistory.length} {t('readings-stored')}
                </div>
              </div>
            )
          ) : (
            <div className="grid grid-cols-3 gap-2 text-center mb-2 p-4 flex-grow">
              {(['pitch', 'roll', 'yaw'] as const).map((axis) => (
                <div key={axis} className="flex flex-col items-center justify-center">
                  <span
                    className="text-xs font-medium"
                    style={{ color: axisColors[axis] }}
                  >
                    {axis.charAt(0).toUpperCase() + axis.slice(1)}
                  </span>
                  <span className="font-mono text-lg">{gyroData[axis].toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </SensorCard>
  );
};

export default Gyroscope;