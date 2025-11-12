import Accelerometer from "./sensors/Accelerometer";
import Current from "./sensors/Current";
import Encoder from "./sensors/Encoder";
import Gyroscope from "./sensors/Gyroscope";
import Rangefinder from "./sensors/Rangefinder";
import Reflectance from "./sensors/Reflectance";
import Voltage from "./sensors/Voltage";
import { GridStackOptions } from "gridstack";
import AddWidgets from "./AddWidget";
import {
  GridStackProvider,
  GridStackRender,
  GridStackRenderProvider,
} from "./lib";
// import "gridstack/dist/gridstack.css";
// import { ComponentProps, useState } from "react";
import { useTranslation } from "react-i18next";

const CELL_HEIGHT = 50;
const BREAKPOINTS = [
  { c: 1, w: 700 },
  { c: 3, w: 850 },
  { c: 6, w: 950 },
  { c: 8, w: 1100 },
];

const COMPONENT_MAP = {
  Current: () => <Current />,
  Accelerometer: () => <Accelerometer />,
  Gyroscope: () => <Gyroscope />,
  Encoder: () => <Encoder />,
  Reflectance: () => <Reflectance />,
  Voltage: () => <Voltage />,
  Rangefinder: () => <Rangefinder />
};


const gridOptions: GridStackOptions = {
  acceptWidgets: true,
  cellHeight: CELL_HEIGHT,
  removable: '#trash',
  columnOpts: {
    breakpointForWindow: true,
    breakpoints: BREAKPOINTS,
    layout: "moveScale",
    columnMax: 12,
  },
  margin: 3,
  draggable: {
    // handle: '.grid-stack-item-content', // Drag handle
    scroll: true,                  // Allow scrolling while dragging
    // containment: 'parent'          // Constrains dragging to parent container
  },
  float: true,
  children: [


  ],
};


export default function XRPDashboard() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto px-4 pb-10 bg-slate-100 min-h-screen dark:bg-mountain-mist-950">
      <GridStackProvider initialOptions={gridOptions}>
        <div className="flex justify-between items-center mb-2 pt-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-600 dark:text-gray-300">{t('sensors')}</h1>
          </div>
          <AddWidgets />
        </div>

        <div className="relative top-35 border-t-4 border-gray-300">

          <GridStackRenderProvider>
            <GridStackRender componentMap={COMPONENT_MAP} />
          </GridStackRenderProvider>
        </div>
      </GridStackProvider>
    </div>

  );
}

