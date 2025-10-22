import React, { useState, useEffect, useRef } from 'react';
import { FaEye } from 'react-icons/fa';
import useSensorData from '../hooks/useSensorData';
import SensorCard from './SensorCard';
import { ReflectanceData } from '../utils/sensorParsers';
import { Dropdown, DropdownItem } from "flowbite-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { FaChartLine, FaHashtag, FaCog, FaTrash } from 'react-icons/fa';
import { useGridStackContext } from '../lib/grid-stack-context';
import { FlowBiteConstants } from '@/utils/constants';
import { useTranslation } from 'react-i18next';


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
  const { t } = useTranslation();
  const [reflectanceHistory, setReflectanceHistory] = useState<TimestampedReflectanceData[]>([]);
  const { getSensorData, requestSensors, stopSensor, sensorData } = useSensorData();
  const { removeWidget } = useGridStackContext();
  const widgetIdRef = useRef<string | null>(null);
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

  // Get the GridStack auto-generated ID when component mounts
  useEffect(() => {
    const findGridStackId = () => {
      // Find all grid stack items
      const gridItems = document.querySelectorAll('.grid-stack-item');

      for (const item of gridItems) {
        // Check if this grid item contains our reflectance component
        // Look for the specific title that identifies this component
        const sensorCard = item.querySelector('.sensor-card');
        const titleElement = sensorCard?.querySelector('h3');

        if (titleElement?.textContent === t('reflectance')) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const node = (item as any).gridstackNode;
          if (node && node.id) {
            widgetIdRef.current = node.id;
            console.log('Reflectance sensor found GridStack ID:', node.id);
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

  const handleDelete = () => {
    if (widgetIdRef.current && removeWidget) {
      console.log('Deleting reflectance sensor widget with ID:', widgetIdRef.current);
      removeWidget(widgetIdRef.current);
    } else {
      console.error('Could not find reflectance sensor widget ID for deletion');
    }
  };

  const sensorCardProps = {
    title: t('reflectance'),
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
      {!reflectanceData ? (
        <div className="flex items-center justify-center w-full h-full">
          <div className="text-gray-500 dark:text-gray-400">{t('no-data-available')}</div>
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
                      label={t('time')}
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(value) => new Date(value).toLocaleTimeString()}
                      formatter={(value) => typeof value === 'number' ? value.toFixed(0) : value}
                    />
                    <Line type="monotone" dataKey="reflectanceL" stroke={sideColors.reflectanceL} dot={false} name={t('left')} />
                    <Line type="monotone" dataKey="reflectanceR" stroke={sideColors.reflectanceR} dot={false} name={t('right')} />
                  </LineChart>
                </ResponsiveContainer>
                <div className="text-xs text-gray-500 text-center mt-2 dark:text-gray-400">
                  {reflectanceHistory.length} {t('readings-stored')}
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
                      {t('left')}
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
                      {t('right')}
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
                      {t('left')}
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
                      {t('right')}
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
                    {t('left-reflectance')}
                  </span>
                  <span className="font-mono text-lg">{reflectanceData.reflectanceL}</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-xs font-medium" style={{ color: sideColors.reflectanceR }}>
                    {t('right-reflectance')}
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