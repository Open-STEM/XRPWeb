import { GridStackOptions } from "gridstack";
import {
  ComponentDataType,
  ComponentMap,
  GridStackProvider,
  GridStackRender,
  GridStackRenderProvider,
} from "./lib";
// import "gridstack/dist/gridstack.css";
import { ComponentProps, useState } from "react";

const CELL_HEIGHT = 50;
const BREAKPOINTS = [
  { c: 1, w: 700 },
  { c: 3, w: 850 },
  { c: 6, w: 950 },
  { c: 8, w: 1100 },
];

function Text({ content }: { content: string }) {
  return <div className="w-full h-full">{content}</div>;
}

const CompponentMaps: ComponentMap = {
  Text,
};

const gridOptions: GridStackOptions = {
  acceptWidgets: true,
  columnOpts: {
    breakpointForWindow: true,
    breakpoints: BREAKPOINTS,
    layout: "moveScale",
    columnMax: 12,
  },
  margin: 8,
  cellHeight: CELL_HEIGHT,
  subGridOpts: {
    acceptWidgets: true,
    columnOpts: {
      breakpoints: BREAKPOINTS,
      layout: "moveScale",
    },
    margin: 8,
    minRow: 2,
    cellHeight: CELL_HEIGHT,
  },
  children: [
    {
      id: "item1",
      h: 2,
      w: 2,
      x: 0,
      y: 0,
      content: JSON.stringify({
        name: "Text",
        props: { content: "Item 1" },
      } satisfies ComponentDataType<ComponentProps<typeof Text>>), // if need type check
    },
    {
      id: "item2",
      h: 2,
      w: 2,
      x: 2,
      y: 0,
      content: JSON.stringify({
        name: "Text",
        props: { content: "Item 2" },
      }),
    },
    ],
  };

export default function XRPDashboard() {
    const [initialOptions] = useState(gridOptions);
  return (
    <GridStackProvider initialOptions={initialOptions}>

      <GridStackRenderProvider>
        <GridStackRender componentMap={CompponentMaps} />
      </GridStackRenderProvider>

    </GridStackProvider>
  );
}