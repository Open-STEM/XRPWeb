import React from 'react';
import SensorWidget from './SensorWidget';
import type { DashboardViewMode } from './SensorWidget';
import {
  accelerometerConfig,
  gyroscopeConfig,
  currentConfig,
  encoderConfig,
  rangefinderConfig,
  reflectanceConfig,
  voltageConfig,
} from './configs';

type BuiltinSensorProps = {
  viewMode?: DashboardViewMode;
};

export const Accelerometer: React.FC<BuiltinSensorProps> = ({ viewMode = 'data' }) => (
  <SensorWidget config={accelerometerConfig} initialViewMode={viewMode} />
);

export const Gyroscope: React.FC<BuiltinSensorProps> = ({ viewMode = 'data' }) => (
  <SensorWidget config={gyroscopeConfig} initialViewMode={viewMode} />
);

export const Current: React.FC<BuiltinSensorProps> = ({ viewMode = 'data' }) => (
  <SensorWidget config={currentConfig} initialViewMode={viewMode} />
);

export const Encoder: React.FC<BuiltinSensorProps> = ({ viewMode = 'data' }) => (
  <SensorWidget config={encoderConfig} initialViewMode={viewMode} />
);

export const Rangefinder: React.FC<BuiltinSensorProps> = ({ viewMode = 'data' }) => (
  <SensorWidget config={rangefinderConfig} initialViewMode={viewMode} />
);

export const Reflectance: React.FC<BuiltinSensorProps> = ({ viewMode = 'data' }) => (
  <SensorWidget config={reflectanceConfig} initialViewMode={viewMode} />
);

export const Voltage: React.FC<BuiltinSensorProps> = ({ viewMode = 'data' }) => (
  <SensorWidget config={voltageConfig} initialViewMode={viewMode} />
);
