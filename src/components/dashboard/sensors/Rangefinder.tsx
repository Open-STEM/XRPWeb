import React, { useState, useEffect, useRef } from 'react';
import { BsRulers } from 'react-icons/bs';
import useSensorData from '../hooks/useSensorData';
import SensorCard from './SensorCard';
import { RangefinderData } from '../utils/sensorParsers';
import { Dropdown, DropdownItem } from "flowbite-react";
import { FaChartLine, FaHashtag, FaCog, FaTrash } from 'react-icons/fa';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useGridStackContext } from '../lib/grid-stack-context';
import i18n from '@utils/i18n';
import { FlowBiteConstants } from '@/utils/constants';


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
  const { getSensorData, requestSensors, stopSensor, sensorData } = useSensorData();
  const { removeWidget } = useGridStackContext();
  const widgetIdRef = useRef<string | null>(null);
  const sensorName = 'rangefinder';
  const rangeData = getSensorData<RangefinderData>(sensorName);
  const lastUpdated = sensorData.get(sensorName)?.timestamp;
  const [sensorVisual, setSensorVisual] = useState<string>("Number");

  // Calculate a percentage for distance visualization
  // Assuming max distance is 400cm as per your simulator code
  const distancePercentage = rangeData ? (rangeData.distance / 400) * 100 : 0;

  // Get the GridStack auto-generated ID when component mounts
  useEffect(() => {
    const findGridStackId = () => {
      // Find all grid stack items
      const gridItems = document.querySelectorAll('.grid-stack-item');

      for (const item of gridItems) {
        // Check if this grid item contains our rangefinder component
        // Look for the specific title that identifies this component
        const sensorCard = item.querySelector('.sensor-card');
        const titleElement = sensorCard?.querySelector('h3');

        if (titleElement?.textContent === 'Rangefinder') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const node = (item as any).gridstackNode;
          if (node && node.id) {
            widgetIdRef.current = node.id;
            console.log('Rangefinder found GridStack ID:', node.id);
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

  const handleDelete = () => {
    if (widgetIdRef.current && removeWidget) {
      console.log('Deleting rangefinder widget with ID:', widgetIdRef.current);
      removeWidget(widgetIdRef.current);
    } else {
      console.error('Could not find rangefinder widget ID for deletion');
    }
  };

  const sensorCardProps = {
    title: "Rangefinder",
    icon: <BsRulers size={20} />,
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
    if (rangeHistory.length > MAX_HISTORY_SIZE) {
      setRangeHistory(prev => prev.slice(prev.length - MAX_HISTORY_SIZE));
    }
  }, [rangeHistory]);

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
      {!rangeData ? (
        <div className="flex items-center justify-center w-full h-full">
          <div className="text-gray-500 dark:text-gray-400">{i18n.t('no-data-available')}</div>
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
                      label={i18n.t('time')}
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
                      name={i18n.t('distance')}
                    />
                  </LineChart>
                </ResponsiveContainer>
                <div className="text-xs text-gray-500 text-center mt-2 dark:text-gray-400">
                  {rangeHistory.length} {i18n.t('readings-stored')}
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
                  {i18n.t('distance-units')}
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