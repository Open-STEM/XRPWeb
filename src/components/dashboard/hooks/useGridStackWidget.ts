import { useCallback } from 'react';
import { useGridStackContext } from '../lib/grid-stack-context';
import { useGridStackWidgetContext } from '../lib/grid-stack-widget-context';

/**
 * Hook that provides widget deletion using the existing GridStackWidgetContext.
 * No DOM traversal needed — the widget ID is already available via context.
 */
export function useGridStackWidget() {
  const { removeWidget } = useGridStackContext();
  const { widget } = useGridStackWidgetContext();

  const handleDelete = useCallback(() => {
    if (widget.id && removeWidget) {
      removeWidget(widget.id);
    } else {
      console.error('Could not delete widget — missing ID or removeWidget');
    }
  }, [widget.id, removeWidget]);

  return { widgetId: widget.id, handleDelete };
}
