import { useState, useEffect, useCallback } from 'react';
import socketService from '../services/socketService';
import { SensorData } from '@/utils/sensorParsers';

interface UseSensorDataOptions {
  autoConnect?: boolean;
}

const useSensorData = (options: UseSensorDataOptions = {}) => {
  const { autoConnect = true } = options;

  const [sensorData, setSensorData] = useState<Map<string, SensorData>>(new Map());
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSensors, setActiveSensors] = useState<Set<string>>(new Set());

  // Handle data update from Socket.IO
  const handleDataUpdate = useCallback((data: SensorData) => {
    setSensorData(prevData => {
      const newData = new Map(prevData);
      newData.set(data.sensorType, data);
      return newData;
    });
  }, []);

  useEffect(() => {
    // Connect to the socket server if autoConnect is true
    if (autoConnect) {
      socketService.connect();
    }

    // Set up event listeners
    const connectUnsubscribe = socketService.on('connect', () => {
      setIsConnected(true);
      setError(null);

      // Request data for active sensors when reconnecting
      if (activeSensors.size > 0) {
        requestSensors(Array.from(activeSensors));
      }
    });

    const disconnectUnsubscribe = socketService.on('disconnect', () => {
      setIsConnected(false);
    });

    const errorUnsubscribe = socketService.on('error', () => {
      setError('Connection error. Please check your network connection.');
      setIsConnected(false);
    });

    const dataUpdateUnsubscribe = socketService.on('data_update', handleDataUpdate);

    // Set initial connection state
    setIsConnected(socketService.isConnected());

    // Clean up listeners on unmount
    return () => {
      connectUnsubscribe();
      disconnectUnsubscribe();
      errorUnsubscribe();
      dataUpdateUnsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoConnect, activeSensors, handleDataUpdate]);

  // Request data from specific sensors
  const requestSensors = (sensors: string[]) => {
    if (isConnected) {
      socketService.requestSensorData(sensors);

      // Update active sensors
      setActiveSensors(prev => {
        const newSet = new Set(prev);
        sensors.forEach(sensor => newSet.add(sensor));
        return newSet;
      });
    } else {
      setError('Cannot request sensor data: not connected');
    }
  };

  // Requesting random sensor data
  const startDataStreaming = () => {
    if (isConnected) {
      socketService.getRandomSensorData();
    } else {
      setError('Cannot request sensor data: not connected');
    }
  };

  // stopping data streaming
  const stopDataStreaming = () => {
    if (isConnected) {
      socketService.stopData();
    } else {
      setError('Cannot request sensor data: not connected');
    }
  };

  // Stop a specific sensor
  const stopSensor = (sensor: string) => {
    setActiveSensors(prev => {
      const newSet = new Set(prev);
      newSet.delete(sensor);
      return newSet;
    });
  };

  // Get data for a specific sensor
  const getSensorData = <T>(sensor: string): T | null => {
    const data = sensorData.get(sensor);
    return data ? data.value as T : null;
  };

  return {
    sensorData,
    getSensorData,
    isConnected,
    stopDataStreaming,
    error,
    requestSensors,
    stopSensor,
    startDataStreaming,
    activeSensors: Array.from(activeSensors)
  };
};

export default useSensorData;