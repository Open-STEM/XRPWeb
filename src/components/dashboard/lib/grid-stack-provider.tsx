import type { GridStack, GridStackOptions, GridStackWidget } from "gridstack";
import { type PropsWithChildren, useCallback, useState } from "react";
import { GridStackContext } from "./grid-stack-context";

export function GridStackProvider({
  children,
  initialOptions,
}: PropsWithChildren<{ initialOptions: GridStackOptions }>) {
  const [gridStack, setGridStack] = useState<GridStack | null>(null);
  const [rawWidgetMetaMap, setRawWidgetMetaMap] = useState(() => {
    const map = new Map<string, GridStackWidget>();
    const deepFindNodeWithContent = (obj: GridStackWidget) => {
      if (obj.id && obj.content) {
        map.set(obj.id, obj);
      }
      if (obj.subGridOpts?.children) {
        obj.subGridOpts.children.forEach((child: GridStackWidget) => {
          deepFindNodeWithContent(child);
        });
      }
    };
    initialOptions.children?.forEach((child: GridStackWidget) => {
      deepFindNodeWithContent(child);
    });
    return map;
  });

  const addWidget = useCallback(
    (fn: (id: string) => Omit<GridStackWidget, "id">) => {
      const newId = `widget-${Math.random().toString(36).substring(2, 15)}`;
      const widget = fn(newId);
      gridStack?.addWidget({ ...widget, id: newId });
      setRawWidgetMetaMap((prev) => {
        const newMap = new Map<string, GridStackWidget>(prev);
        newMap.set(newId, widget);
        return newMap;
      });
    },
    [gridStack]
  );

  const addSubGrid = useCallback(
    (
      fn: (
        id: string,
        withWidget: (w: Omit<GridStackWidget, "id">) => GridStackWidget
      ) => Omit<GridStackWidget, "id">
    ) => {
      const newId = `sub-grid-${Math.random().toString(36).substring(2, 15)}`;
      const subWidgetIdMap = new Map<string, GridStackWidget>();

      const widget = fn(newId, (w) => {
        const subWidgetId = `widget-${Math.random()
          .toString(36)
          .substring(2, 15)}`;
        subWidgetIdMap.set(subWidgetId, w);
        return { ...w, id: subWidgetId };
      });

      gridStack?.addWidget({ ...widget, id: newId });

      setRawWidgetMetaMap((prev) => {
        const newMap = new Map<string, GridStackWidget>(prev);
        subWidgetIdMap.forEach((meta, id) => {
          newMap.set(id, meta);
        });
        return newMap;
      });
    },
    [gridStack]
  );

  const removeWidget = useCallback(
    (id: string) => {
      if (!gridStack) {
        console.error('GridStack instance not available');
        return;
      }

      try {
        console.log('Removing widget with GridStack ID:', id);

        // Get all grid items and find the one with the matching auto-generated ID
        const gridItems = gridStack.getGridItems();

        for (const item of gridItems) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const node = (item as any).gridstackNode;

          if (node && node.id === id) {
            console.log('Found widget, removing...');
            gridStack.removeWidget(item, true);

            // Clean up from widget meta map using the GridStack ID
            setRawWidgetMetaMap((prev) => {
              const newMap = new Map<string, GridStackWidget>(prev);
              newMap.delete(id);
              return newMap;
            });

            console.log('Widget removed successfully');
            return;
          }
        }

        console.error('Could not find widget with GridStack ID:', id);

      } catch (error) {
        console.error('Error removing widget:', error);
      }
    },
    [gridStack]
  );

  const saveOptions = useCallback(() => {
    return gridStack?.save(true, true, (_, widget) => widget);
  }, [gridStack]);

  return (
    <GridStackContext.Provider
      value={{
        initialOptions,
        gridStack,

        addWidget,
        removeWidget,
        addSubGrid,
        saveOptions,

        _gridStack: {
          value: gridStack,
          set: setGridStack,
        },
        _rawWidgetMetaMap: {
          value: rawWidgetMetaMap,
          set: setRawWidgetMetaMap,
        },
      }}
    >
      {children}
    </GridStackContext.Provider>
  );
}