import React from "react";
import { useGridStackContext } from "../../lib/grid-stack-context";
import { Dropdown, DropdownItem } from "flowbite-react";
import { MdSpeed, MdColorLens, MdLightbulb } from 'react-icons/md';
import { FaGlobe, FaTemperatureHigh } from 'react-icons/fa';
import { GiElectric, GiPositionMarker } from 'react-icons/gi';
import { BsRulers } from 'react-icons/bs';


type ActionType = 'accelerometer' | 'color' | 'gyroscope' | 'led' | 'motor' | 'servo' | 'temperature' | 'rangefinder';

const AddWidgets: React.FC = () => {
  const { addWidget } = useGridStackContext();

  const handleAction = (action: ActionType) => {
    // if (!gridInstanceRef.current) {
    //   console.error('Grid not initialized');
    //   return;
    // }

    switch (action) {
      case 'accelerometer': {
        const node = () => ({
          id: `accelerometer-${Date.now()}`, // Add unique ID
          h: 5,
          w: 4,
          x: 0,
          y: 2,
          minW: 2,
          minH: 5,
          content: JSON.stringify({
            name: "Accelerometer",
            props: {
              isActive: true
            },
          }),
        });
        // gridInstanceRef.current.addWidget(node);
        addWidget(node);
        console.log('Accelerometer action triggered');
        break;
      }
      case 'color':
        {
          const node = () => ({
            id: `color-${Date.now()}`, // Add unique ID
            h: 4,
            w: 4,
            x: 0,
            y: 2,
            minW: 1,
            minH: 5,
            content: JSON.stringify({
              name: "ColorSensor",
              props: {
                isActive: true
              },
            }),
          });
          addWidget(node);
          console.log('Color sensor action triggered');
          break;
        }
      case 'gyroscope':
        {
          const node = () => ({
            id: `gyroscope-${Date.now()}`, // Add unique ID
            h: 4,
            w: 4,
            x: 0,
            y: 2,
            minW: 2,
            minH: 5,
            content: JSON.stringify({
              name: "Gyroscope",
              props: {
                isActive: true
              },
            }),
          });
          addWidget(node);
          console.log('Gyroscope action triggered');
          break;
        }
      case 'led':
        {
          const node = () => ({
            id: `led-${Date.now()}`, // Add unique ID
            h: 5,
            w: 4,
            x: 0,
            y: 2,
            minW: 1,
            minH: 4,
            content: JSON.stringify({
              name: "LED",
              props: {
                isActive: true
              },
            }),
          });
          addWidget(node);
          console.log('LED action triggered');
          break;
        }
      case 'motor':
        {
          const node = () => ({
            id: `motor-${Date.now()}`, // Add unique ID
            h: 5,
            w: 4,
            x: 0,
            y: 2,
            minW: 2,
            minH: 5,
            content: JSON.stringify({
              name: "Motor",
              props: {
                isActive: true
              },
            }),
          });
          addWidget(node);
          console.log('Motor action triggered');
          break;
        }
      case 'servo':
        {
          const node = () => ({
            id: `servo-${Date.now()}`, // Add unique ID
            h: 6,
            w: 4,
            x: 0,
            y: 2,
            minW: 2,
            minH: 6,
            content: JSON.stringify({
              name: "Servo",
              props: {
                isActive: true
              },
            }),
          });
          addWidget(node);
          console.log('Servo action triggered');
          break;
        }
      case 'temperature':
        {
          const node = () => ({
            id: `temperature-${Date.now()}`, // Add unique ID
            h: 7,
            w: 4,
            x: 0,
            y: 2,
            minW: 2,
            minH: 7,
            content: JSON.stringify({
              name: "Temperature",
              props: {
                isActive: true
              },
            }),
          });
          addWidget(node);
          console.log('Temperature action triggered');
          break;
        }
      case 'rangefinder':
        {
          const node = () => ({
            id: `rangefinder-${Date.now()}`, // Add unique ID
            h: 8,
            w: 4,
            x: 0,
            y: 2,
            minW: 2,
            minH: 8,
            content: JSON.stringify({
              name: "Rangefinder",
              props: {
                isActive: true
              },
            }),
          });
          addWidget(node);
          console.log('Rangefinder action triggered');
          break;
        }
    }
  };


  return (
    <div className="flex items-center gap-100 mt-4 sm:mt-0">
      <Dropdown label="Add New Component" className="flex items-center gap-2 mt-4 sm:mt-0">
        <DropdownItem icon={MdSpeed} onClick={() => handleAction('accelerometer')}>Accelerometer</DropdownItem>
        <DropdownItem icon={MdColorLens} onClick={() => handleAction('color')}>ColorSensor</DropdownItem>
        <DropdownItem icon={FaGlobe} onClick={() => handleAction('gyroscope')}>Gyroscope</DropdownItem>
        <DropdownItem icon={GiElectric} onClick={() => handleAction('motor')}>Motor</DropdownItem>
        <DropdownItem icon={MdLightbulb} onClick={() => handleAction('led')}>LED</DropdownItem>
        <DropdownItem icon={BsRulers} onClick={() => handleAction('rangefinder')}>Rangefinder</DropdownItem>
        <DropdownItem icon={GiPositionMarker} onClick={() => handleAction('servo')}>Servo</DropdownItem>
        <DropdownItem icon={FaTemperatureHigh} onClick={() => handleAction('temperature')}>Temperature</DropdownItem>
      </Dropdown>
    </div >
  );
}

export default AddWidgets;