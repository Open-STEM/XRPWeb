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
  useGridStackContext,
} from "./lib";
// import "gridstack/dist/gridstack.css";
import { useTranslation } from "react-i18next";
import { FaUndo } from "react-icons/fa";

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
    scroll: true,
  },
  float: true,
  children: [],
};

// Separate component to access GridStack context
function DashboardHeader() {
  const { t } = useTranslation();
  const { clearStoredConfig } = useGridStackContext();

  const handleReset = () => {
    if (window.confirm(t('reset-dashboard-confirm') || 'Are you sure you want to reset the dashboard to default? This will remove all widgets and reload the page.')) {
      clearStoredConfig?.();
    }
  };

  return (
    <div className="flex justify-between items-center mb-2 pt-2">
      <div>
        <h1 className="text-2xl font-bold text-gray-600 dark:text-gray-300">{t('sensors')}</h1>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleReset}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-200"
          title={t('reset-dashboard') || 'Reset Dashboard'}
        >
          <FaUndo size={18} />
        </button>
        <AddWidgets />
      </div>
    </div>
  );
}

export default function XRPDashboard() {
  return (
    <div className="mx-auto px-4 pb-10 bg-slate-100 min-h-screen dark:bg-mountain-mist-950">
      <GridStackProvider
        initialOptions={gridOptions}
        enablePersistence={true}
        storageKey="xrp-dashboard-config"
      >
        <DashboardHeader />

        <div className="relative top-35 border-t-4 border-gray-300">
          <GridStackRenderProvider>
            <GridStackRender componentMap={COMPONENT_MAP} />
          </GridStackRenderProvider>
        </div>
      </GridStackProvider>
    </div>
  );
}