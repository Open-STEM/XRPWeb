import { useEffect, useRef, useState } from "react";
import useSensorData from "./hooks/useSensorData";
import ColorSensor from "./sensors/ColorSensor";
import Accelerometer from "./sensors/Accelerometer";
import Gyroscope from "./sensors/Gyroscope";
import Temperature from "./sensors/Temperature";
import LED from "./sensors/LED";
import Servo from "./sensors/Servo";
import Motor from "./sensors/Motor";
import Rangefinder from "./sensors/Rangefinder";
import GridPersistence from "./GridPersistence";
import AddWidgets from "./AddWidget";

import {
  GridStackProvider,
  GridStackRender,
  GridStackRenderProvider,
} from "../../lib";
import "gridstack/dist/gridstack.css";
import "../../assets/css/gridstack.css";
import { GridStackOptions } from "gridstack";
import { FaTrash } from "react-icons/fa";
import { Constants } from "@/utils/constants";

const COMPONENT_MAP = {
  ColorSensor,
  Accelerometer,
  Gyroscope,
  LED,
  Servo,
  Temperature,
  Rangefinder,
  Motor,
};

const gridOptions: GridStackOptions = {
  acceptWidgets: true,
  cellHeight: Constants.CELL_HEIGHT,
  removable: "#trash",
  columnOpts: {
    breakpointForWindow: true,
    breakpoints: Constants.BREAKPOINTS,
    layout: "moveScale",
    columnMax: 12,
  },
  margin: 3,
  draggable: {
    scroll: true, // Allow scrolling while dragging
  },
  float: true,
  children: [
    {
      id: "accelerometer",
      h: 4,
      w: 4,
      x: 0,
      y: 0, // Top-left corner
      content: JSON.stringify({
        name: "Accelerometer",
        props: {
          isActive: true,
        },
      }),
    },
    {
      id: "gyroscope",
      h: 4,
      w: 4,
      x: 4,
      y: 0, // Aligned to the right of Accelerometer
      content: JSON.stringify({
        name: "Gyroscope",
        props: {
          isActive: false,
        },
      }),
    },
    {
      id: "colorsensor",
      h: 4,
      w: 4,
      x: 8,
      y: 0, // Aligned to the right of Gyroscope
      content: JSON.stringify({
        name: "ColorSensor",
        props: {
          isActive: false,
        },
      }),
    },
    // {
    //   id: "led",
    //   h: 4,
    //   w: 4,
    //   x: 0,
    //   y: 4, // Below Accelerometer
    //   content: JSON.stringify({
    //     name: "LED",
    //     props: {
    //       isActive: false,
    //     },
    //   }),
    // },
    // {
    //   id: "motor",
    //   h: 4,
    //   w: 4,
    //   x: 4,
    //   y: 4, // Below Gyroscope
    //   content: JSON.stringify({
    //     name: "Motor",
    //     props: {
    //       isActive: false,
    //     },
    //   }),
    // },
    // {
    //   id: "temperature",
    //   h: 4,
    //   w: 4,
    //   x: 8,
    //   y: 4, // Below ColorSensor
    //   content: JSON.stringify({
    //     name: "Temperature",
    //     props: {
    //       isActive: false,
    //     },
    //   }),
    // },
    // {
    //   id: "rangefinder",
    //   h: 4,
    //   w: 4,
    //   x: 0,
    //   y: 8, // Below LED
    //   content: JSON.stringify({
    //     name: "Rangefinder",
    //     props: {
    //       isActive: false,
    //     },
    //   }),
    // },
    // {
    //   id: "servo",
    //   h: 4,
    //   w: 4,
    //   x: 4,
    //   y: 8, // Below Motor
    //   content: JSON.stringify({
    //     name: "Servo",
    //     props: {
    //       isActive: false,
    //     },
    //   }),
    // },
  ],
};

const getIntitialOptions = () => {
  const layout = localStorage.getItem(Constants.STORAGE_KEY);
  if (layout) {
    return JSON.parse(layout);
  }
  return gridOptions;
};

export default function XRPDashboard() {
  const { isConnected, startDataStreaming, stopDataStreaming } = useSensorData();
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const gridStackRef = useRef<HTMLDivElement>(null);
  const gridInstanceRef = useRef<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any

  // Stop all sensors at once
  const stopAllSensors = () => {
    setIsStreaming(false);
    stopDataStreaming();
  };

  const handleStart = () => {
    if (!isStreaming) {
      startDataStreaming();
      setIsStreaming(true);
      console.log('Start');
    }
  };

  const resetLayout = () => {
    if (gridInstanceRef.current) {
      localStorage.removeItem(Constants.STORAGE_KEY);
      window.location.reload();
    }
  };

  useEffect(() => {
    // Short delay to ensure grid is fully initialized
    const timer = setTimeout(() => {
      if (gridStackRef.current) {
        // In GridStack, once initialized, there's a gridstack property on the element
        // or you can use GridStack.getGridElement(gridStackRef.current)
        const gridElement = gridStackRef.current.querySelector('.grid-stack');
        if (gridElement && (gridElement as any).gridstack) { // eslint-disable-line @typescript-eslint/no-explicit-any
          gridInstanceRef.current = (gridElement as any).gridstack; // eslint-disable-line @typescript-eslint/no-explicit-any
          console.log('Grid initialized:', gridInstanceRef.current);
        }
      }
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="mx-auto px-4 pb-10 bg-slate-100 min-h-screen flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pt-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Sensor Dashboard</h1>
        </div>

        <div className="mt-4 sm:mt-0 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={handleStart}
              className="bg-blue-500 hover:bg-blue-700 border-4 border-blue-700 text-white font-bold py-2 px-4 rounded">{isStreaming ? 'Started' : 'Start'}</button>
            <button
              onClick={stopAllSensors}
              className="bg-red-500 hover:bg-red-700 border-4 border-red-700 text-white font-bold py-2 px-4 rounded">Stop All</button>
                <button
              onClick={resetLayout}
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
            >
              Reset Layout
            </button>
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>

        </div>

      </div >
      <div id="trash">
        <button
          className="bg-red-500 hover:bg-red-700 border-4 border-red-700 text-white font-bold py-2 px-2 right-4 rounded h-32 w-32 flex items-center justify-center absolute"
          aria-label="Delete"
        >
          <FaTrash size={72} />
        </button>
      </div>
      <div ref={gridStackRef}>
        <GridStackProvider initialOptions={getIntitialOptions()}>
          <AddWidgets />
          <GridPersistence />
          <div className="relative top-40 border-t-4 border-gray-300">
            <GridStackRenderProvider>
              <GridStackRender componentMap={COMPONENT_MAP} />
            </GridStackRenderProvider>
          </div>

        </GridStackProvider>

      </div >
    </div >
  );
}