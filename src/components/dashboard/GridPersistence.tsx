import React, { useEffect } from "react";
import { useGridStackContext } from "../../lib/grid-stack-context";
import { Constants } from "@/utils/constants";

const GridPersistence: React.FC = () => {
  const { saveOptions, gridStack } = useGridStackContext();

  useEffect(() => {
    if (!gridStack) return;

    const saveLayout = () => {
      const layout = saveOptions();
      console.log('Layout saved:', layout);
      localStorage.setItem(Constants.STORAGE_KEY, JSON.stringify(layout));
    };
    
    // Save layout whenever the grid changes
    gridStack.on('change', saveLayout);
    
    return () => {
      gridStack.off('change');
    };
  }, [gridStack, saveOptions]);
  
  return null; // This component doesn't render anything
};

export default GridPersistence;