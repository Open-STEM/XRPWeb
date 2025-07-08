import React from "react";
import { useGridStackContext } from "./lib/grid-stack-context";
import { Dropdown, DropdownItem } from "flowbite-react";
import { MdSpeed } from 'react-icons/md';
import { FaBatteryHalf, FaBolt, FaCog, FaEye, FaGlobe, FaPlus } from 'react-icons/fa';
import { BsRulers } from 'react-icons/bs';
import i18n from "@/utils/i18n";

type ActionType = 'accelerometer' | 'current' | 'encoder' | 'gyroscope' | 'rangefinder' | 'reflectance' | 'voltage';

const AddWidgets: React.FC = () => {
  const { addWidget } = useGridStackContext();

  const handleAction = (action: ActionType) => {
    switch (action) {
      case 'accelerometer': {
        const node = () => ({
          // Remove custom id - let GridStack auto-generate
          h: 5,
          w: 4,
          x: 0,
          y: 2,
          minW: 2,
          minH: 5,
          content: JSON.stringify({
            name: i18n.t('accelerometer'),
            props: {
              isActive: true
              // Remove widgetId - we'll get it from GridStack
            },
          }),
        });
        addWidget(node);
        console.log('Accelerometer action triggered');
        break;
      }
      case 'current': {
        const node = () => ({
          h: 4,
          w: 4,
          x: 0,
          y: 2,
          minW: 1,
          minH: 5,
          content: JSON.stringify({
            name: i18n.t('current'),
            props: {
              isActive: true
            },
          }),
        });
        addWidget(node);
        console.log('Current sensor action triggered');
        break;
      }
      case 'gyroscope': {
        const node = () => ({
          h: 4,
          w: 4,
          x: 0,
          y: 2,
          minW: 2,
          minH: 5,
          content: JSON.stringify({
            name: i18n.t('gyroscope'),
            props: {
              isActive: true
            },
          }),
        });
        addWidget(node);
        console.log('Gyroscope action triggered');
        break;
      }
      case 'encoder': {
        const node = () => ({
          h: 5,
          w: 4,
          x: 0,
          y: 2,
          minW: 1,
          minH: 4,
          content: JSON.stringify({
            name: i18n.t('encoder'),
            props: {
              isActive: true
            },
          }),
        });
        addWidget(node);
        console.log('Encoder action triggered');
        break;
      }
      case 'reflectance': {
        const node = () => ({
          h: 5,
          w: 4,
          x: 0,
          y: 2,
          minW: 2,
          minH: 5,
          content: JSON.stringify({
            name: i18n.t('reflectance'),
            props: {
              isActive: true
            },
          }),
        });
        addWidget(node);
        console.log('Reflectance action triggered');
        break;
      }
      case 'voltage': {
        const node = () => ({
          h: 6,
          w: 4,
          x: 0,
          y: 2,
          minW: 2,
          minH: 6,
          content: JSON.stringify({
            name: i18n.t('voltage'),
            props: {
              isActive: true
            },
          }),
        });
        addWidget(node);
        console.log('Voltage action triggered');
        break;
      }
      case 'rangefinder': {
        const node = () => ({
          h: 8,
          w: 4,
          x: 0,
          y: 2,
          minW: 2,
          minH: 8,
          content: JSON.stringify({
            name: i18n.t('rangefinder'),
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
    <div className="flex items-center mt-4 sm:mt-0">
      <Dropdown label={<FaPlus size={20} />} className="flex items-center mt-4 sm:mt-0 ">
        <DropdownItem icon={MdSpeed} onClick={() => handleAction('accelerometer')}>Accelerometer</DropdownItem>
        <DropdownItem icon={FaBolt} onClick={() => handleAction('current')}>Current</DropdownItem>
        <DropdownItem icon={FaGlobe} onClick={() => handleAction('gyroscope')}>Gyroscope</DropdownItem>
        <DropdownItem icon={FaCog} onClick={() => handleAction('encoder')}>Encoder</DropdownItem>
        <DropdownItem icon={FaEye} onClick={() => handleAction('reflectance')}>Reflectance</DropdownItem>
        <DropdownItem icon={BsRulers} onClick={() => handleAction('rangefinder')}>Rangefinder</DropdownItem>
        <DropdownItem icon={FaBatteryHalf} onClick={() => handleAction('voltage')}>Voltage</DropdownItem>
      </Dropdown>
    </div>
  );
};

export default AddWidgets;