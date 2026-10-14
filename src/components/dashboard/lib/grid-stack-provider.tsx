import type { GridStack, GridStackOptions, GridStackWidget } from "gridstack";
import { type PropsWithChildren, useCallback, useState, useEffect, useRef } from "react";
import { GridStackContext } from "./grid-stack-context";

const STORAGE_KEY = 'xrp-dashboard-config';
const STORAGE_VERSION = '1.4';
const LEGACY_STORAGE_VERSIONS = ['1.0', '1.1', '1.2', '1.3'];
/** Matches AddWidget defaults: 4 cells so three rows fit a laptop dashboard. */
const COMPACT_H = 4;
const COMPACT_MIN_H = 3;
/** Every card uses the voltage width so they stay equal as the pane scales. */
const CARD_W = 3;
const WIDTH_BY_NAME: Record<string, number> = {
  Accelerometer: CARD_W,
  Gyroscope: CARD_W,
  Encoder: CARD_W,
  Current: CARD_W,
  Reflectance: CARD_W,
  Rangefinder: CARD_W,
  Voltage: CARD_W,
  CustomVariable: CARD_W,
  CustomSensor: CARD_W,
};

interface StoredConfig {
  version: string;
  widgets: GridStackWidget[];
  timestamp: number;
}

interface GridStackProviderProps {
  initialOptions: GridStackOptions;
  enablePersistence?: boolean;
  storageKey?: string;
}

/**
 * Older layouts used tall cells (rangefinder h=8, voltage h=6) that overflow a
 * laptop dashboard. Repack them at the voltage card width.
 */
function widgetName(widget: GridStackWidget): string {
  try {
    return (JSON.parse(widget.content ?? '{}') as { name?: string }).name ?? '';
  } catch {
    return '';
  }
}

function compactLegacyWidgets(widgets: GridStackWidget[]): GridStackWidget[] {
  const sorted = [...widgets].sort(
    (a, b) => (a.y ?? 0) - (b.y ?? 0) || (a.x ?? 0) - (b.x ?? 0),
  );
  let x = 0;
  let y = 0;
  return sorted.map((widget) => {
    const w = WIDTH_BY_NAME[widgetName(widget)] ?? CARD_W;
    if (x + w > 12) {
      y += COMPACT_H;
      x = 0;
    }
    const placed: GridStackWidget = {
      ...widget,
      x,
      y,
      w,
      h: COMPACT_H,
      minW: 2,
      minH: COMPACT_MIN_H,
    };
    x += w;
    return placed;
  });
}

// Load configuration from localStorage
function loadStoredConfig(storageKey: string): GridStackWidget[] | null {
  try {
    const stored = localStorage.getItem(storageKey);
    if (!stored) {
      console.log('[GridStack] No stored config found');
      return null;
    }

    const config: StoredConfig = JSON.parse(stored);

    if (config.version !== STORAGE_VERSION && !LEGACY_STORAGE_VERSIONS.includes(config.version)) {
      console.warn('[GridStack] Config version mismatch, using defaults');
      return null;
    }

    // Validate widgets have required fields
    const validWidgets = config.widgets.filter(w => w.content);

    if (validWidgets.length === 0) {
      console.warn('[GridStack] No valid widgets in stored config');
      return null;
    }

    const widgets = LEGACY_STORAGE_VERSIONS.includes(config.version)
      ? compactLegacyWidgets(validWidgets)
      : validWidgets;

    console.log('[GridStack] Loaded', widgets.length, 'widgets from storage');
    return widgets;
  } catch (error) {
    console.error('[GridStack] Error loading config:', error);
    return null;
  }
}

// Get initial options with stored widgets
function getInitialOptionsWithStorage(
  initialOptions: GridStackOptions,
  storageKey: string,
  enablePersistence: boolean
): GridStackOptions {
  if (!enablePersistence) {
    return initialOptions;
  }

  const storedWidgets = loadStoredConfig(storageKey);

  if (storedWidgets && storedWidgets.length > 0) {
    return {
      ...initialOptions,
      children: storedWidgets,
    };
  }

  return initialOptions;
}

export function GridStackProvider({
  children,
  initialOptions,
  enablePersistence = true,
  storageKey = STORAGE_KEY,
}: PropsWithChildren<GridStackProviderProps>) {
  // Calculate effective options once before first render
  const [effectiveOptions] = useState<GridStackOptions>(() =>
    getInitialOptionsWithStorage(initialOptions, storageKey, enablePersistence)
  );

  const [gridStack, setGridStack] = useState<GridStack | null>(null);
  const [rawWidgetMetaMap, setRawWidgetMetaMap] = useState<Map<string, GridStackWidget>>(() => new Map());

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const listenersAttachedRef = useRef(false);

  // Sync rawWidgetMetaMap with GridStack's actual state
  const syncWidgetMap = useCallback(() => {
    if (!gridStack) return;

    const newMap = new Map<string, GridStackWidget>();
    const gridItems = gridStack.getGridItems();

    gridItems.forEach((item) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const node = (item as any).gridstackNode as GridStackWidget;
      if (node && node.id && node.content) {
        newMap.set(node.id, node);
      }
    });

    console.log('[GridStack] Synced widget map, found', newMap.size, 'widgets');
    setRawWidgetMetaMap(newMap);
  }, [gridStack]);

  // Save to localStorage (debounced)
  const saveToStorage = useCallback(() => {
    if (!enablePersistence || !gridStack) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      try {
        const widgets: GridStackWidget[] = [];
        const gridItems = gridStack.getGridItems();

        gridItems.forEach((item) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const node = (item as any).gridstackNode as GridStackWidget;
          if (node && node.content) {
            // Save all relevant properties
            widgets.push({
              id: node.id,
              x: node.x,
              y: node.y,
              w: node.w,
              h: node.h,
              minW: node.minW,
              minH: node.minH,
              maxW: node.maxW,
              maxH: node.maxH,
              content: node.content,
            });
          }
        });

        if (widgets.length === 0) {
          // If no widgets, remove the stored config
          localStorage.removeItem(storageKey);
          console.log('[GridStack] No widgets to save, cleared storage');
          return;
        }

        const config: StoredConfig = {
          version: STORAGE_VERSION,
          widgets,
          timestamp: Date.now(),
        };

        localStorage.setItem(storageKey, JSON.stringify(config));
        console.log('[GridStack] Saved', widgets.length, 'widgets to storage');
      } catch (error) {
        console.error('[GridStack] Error saving config:', error);
      }
    }, 300);
  }, [enablePersistence, gridStack, storageKey]);

  // Clear stored configuration
  const clearStoredConfig = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      console.log('[GridStack] Cleared storage');
      window.location.reload();
      return true;
    } catch (error) {
      console.error('[GridStack] Error clearing storage:', error);
      return false;
    }
  }, [storageKey]);

  // Persist a migrated layout so the next load does not pack the cards again.
  useEffect(() => {
    if (!gridStack || !enablePersistence) return;
    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) return;
      const config = JSON.parse(stored) as StoredConfig;
      if (config.version !== STORAGE_VERSION) {
        saveToStorage();
      }
    } catch {
      // Ignore a corrupt config; the next user edit will rewrite it.
    }
  }, [gridStack, enablePersistence, storageKey, saveToStorage]);

  // Set up event listeners when gridStack becomes available
  useEffect(() => {
    if (!gridStack || listenersAttachedRef.current) return;

    listenersAttachedRef.current = true;
    console.log('[GridStack] Attaching event listeners');

    // Initial sync after GridStack is ready
    // Use setTimeout to ensure GridStack has finished rendering
    setTimeout(() => {
      syncWidgetMap();
    }, 0);

    const handleAdded = (_event: Event, items: GridStackWidget[]) => {
      console.log('[GridStack] Widget(s) added:', items.length);
      syncWidgetMap();
      saveToStorage();
    };

    const handleRemoved = (_event: Event, items: GridStackWidget[]) => {
      console.log('[GridStack] Widget(s) removed:', items.length);
      syncWidgetMap();
      saveToStorage();
    };

    const handleChange = () => {
      console.log('[GridStack] Layout changed');
      saveToStorage();
    };

    gridStack.on('added', handleAdded);
    gridStack.on('removed', handleRemoved);
    gridStack.on('change', handleChange);

    return () => {
      gridStack.off('added');
      gridStack.off('removed');
      gridStack.off('change');
      listenersAttachedRef.current = false;

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [gridStack, syncWidgetMap, saveToStorage]);

  const addWidget = useCallback(
    (fn: (id: string) => Omit<GridStackWidget, "id">) => {
      if (!gridStack) return;

      const newId = `widget-${Math.random().toString(36).substring(2, 15)}`;
      const widget = fn(newId);

      console.log('[GridStack] Adding widget:', newId);
      gridStack.addWidget({ ...widget, id: newId });
      // syncWidgetMap and saveToStorage are called by the 'added' event handler
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
      if (!gridStack) return;

      const newId = `sub-grid-${Math.random().toString(36).substring(2, 15)}`;

      const widget = fn(newId, (w) => {
        const subWidgetId = `widget-${Math.random().toString(36).substring(2, 15)}`;
        return { ...w, id: subWidgetId };
      });

      gridStack.addWidget({ ...widget, id: newId });
    },
    [gridStack]
  );

  const removeWidget = useCallback(
    (id: string) => {
      if (!gridStack) {
        console.error('[GridStack] Cannot remove widget - no grid instance');
        return;
      }

      console.log('[GridStack] Removing widget:', id);
      const gridItems = gridStack.getGridItems();

      for (const item of gridItems) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const node = (item as any).gridstackNode;
        if (node && node.id === id) {
          gridStack.removeWidget(item, true);
          // syncWidgetMap and saveToStorage are called by the 'removed' event handler
          return;
        }
      }

      console.error('[GridStack] Widget not found:', id);
    },
    [gridStack]
  );

  const saveOptions = useCallback(() => {
    return gridStack?.save(true, true, (_, widget) => widget);
  }, [gridStack]);

  return (
    <GridStackContext.Provider
      value={{
        initialOptions: effectiveOptions,
        gridStack,

        addWidget,
        removeWidget,
        addSubGrid,
        saveOptions,
        clearStoredConfig,

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