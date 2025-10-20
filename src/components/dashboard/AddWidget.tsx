import React from "react";
import { useGridStackContext } from "./lib/grid-stack-context";
import { Dropdown, DropdownItem } from "flowbite-react";
import { MdSpeed } from 'react-icons/md';
import { FaBatteryHalf, FaBolt, FaCog, FaEye, FaGlobe, FaPlus } from 'react-icons/fa';
import { BsRulers } from 'react-icons/bs';
import { FlowBiteConstants } from "@/utils/constants";
import { useTranslation } from "react-i18next";

type ActionType = 'accelerometer' | 'current' | 'encoder' | 'gyroscope' | 'rangefinder' | 'reflectance' | 'voltage';

const AddWidgets: React.FC = () => {
  const { t } = useTranslation();
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
            name: 'Accelerometer',
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
            name: 'Current',
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
            name: 'Gyroscope',
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
            name: 'Encoder',
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
            name: 'Reflectance',
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
            name: 'Voltage',
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
            name: 'Rangefinder',
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
      <Dropdown label={<FaPlus size={20} />} inline={true} theme={FlowBiteConstants.DropdownTheme} className="flex items-center mt-4 sm:mt-0 ">
        <DropdownItem icon={MdSpeed} onClick={() => handleAction('accelerometer')}>{t('accelerometer')}</DropdownItem>
        <DropdownItem icon={FaBolt} onClick={() => handleAction('current')}>{t('current')}</DropdownItem>
        <DropdownItem icon={FaGlobe} onClick={() => handleAction('gyroscope')}>{t('gyroscope')}</DropdownItem>
        <DropdownItem icon={FaCog} onClick={() => handleAction('encoder')}>{t('encoders')}</DropdownItem>
        <DropdownItem icon={FaEye} onClick={() => handleAction('reflectance')}>{t('reflectance')}</DropdownItem>
        <DropdownItem icon={BsRulers} onClick={() => handleAction('rangefinder')}>{t('rangefinder')}</DropdownItem>
        <DropdownItem icon={FaBatteryHalf} onClick={() => handleAction('voltage')}>{t('voltage')}</DropdownItem>
      </Dropdown>
    </div>
  );
};

export default AddWidgets;