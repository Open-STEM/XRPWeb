import  { Component } from 'react'
import Image from 'next/image';
import logo from '@/app/assets/images/xrpstickerbot.png';
import fileadd from '@/app/assets/images/file_add.svg';
import fileupload from '@/app/assets/images/upload_file.svg';
import fileexport from '@/app/assets/images/fileexport.svg';
import filesave from '@/app/assets/images/file_save.svg';
import filesaveas from '@/app/assets/images/save_as.svg';
import fontplus from '@/app/assets/images/text_increase.svg';
import fontminus from '@/app/assets/images/text_decrease.svg';
import userguide from '@/app/assets/images/developer_guide.svg';
import apilink from '@/app/assets/images/api.svg';
import autocomplete from '@/app/assets/images/prompt_suggestion.svg';
import python from '@/app/assets/images/python.svg';
import convert from '@/app/assets/images/convert.svg';
import { TiArrowSortedDown } from "react-icons/ti";
import Link from 'next/link';

type NavItem = {
    label: string;
    link?: string;
    iconImage?: string;
    clicked?: () => void;
    children?: NavItem[];
    childrenExt?: NavItem[];
}

function MenuItem({item}) {
    return (
      <>
        { /** menu item */}
        {item.link ?
          <Link href={item.link ?? "#"} target="_blank">
            <div className='flex flex-row gap-1'>
              { /** Image */}
              {item.iconImage && (
                <Image src={item.iconImage} alt='menu-icon' />
              )}
              <span className='whitespace-nowrap pl-2'>{item.label}</span>
            </div>
          </Link>
          : 
          <div className='flex flex-row gap-1'>
            { /** Image */}
            {item.iconImage && (
              <Image src={item.iconImage} alt='menu-icon' />
            )}
            <span className='whitespace-nowrap pl-2'>{item.label}</span>
          </div>
        }
      </>
    )
}

function NavBar() {
    /**
     * NewFile - create either a new Python or Blockly file
     */
    function NewFile() {
      console.log("New File")
    }

    /**
     * UploadFile - upload a file to XRP
     */
    function UploadFile() {
      console.log("Upload file to XRP")
    }

    /**
     * ExportToPC - export the file to PC
     */
    function ExportToPC() {
      console.log("Export File to PC")
    }

    /**
     * SaveFile - Save file to XRP
     */
    function SaveFile() {
      console.log("Save File to XRP")
    }

    /**
     * SaveFileAs - save the current file as to the XRP
     */
    function SaveFileAs() {
      console.log("Save File as")
    }

    /**
     * ViewPythonFile - view the Python file
     */
    function ViewPythonFile() {
      console.log("View Python File")
    }

    /**
     * ConvertToPython - convert the current blockly file to Python
     */
    function ConvertToPython() {
      console.log("Convert to Python")
    }

    /**
     * FontPlusPlus - increase font in the current window
     */
    function FontPlusPlus() {
      console.log("Increase Font")
    }

    /**
     * FontMinus - decrease font in the current window
     */
    function FontMinus() {
      console.log("Decrease Font")
    }

    /**
     * ToggleAutoComplete - toggle autocomplete
     */
    function ToggleAutoComplete() {
      console.log("Toggle Autocomplete")
    }

    const navItems : NavItem[] = [
      {
        label: 'File',
        children: [
          {
            label: 'New File',
            iconImage: fileadd,
            clicked: NewFile
          },
          {
            label: 'Upload to XRP',
            iconImage: fileupload,
            clicked: UploadFile
          },
          {
            label: 'Export to PC',
            iconImage: fileexport,
            clicked: ExportToPC
          },
          {
            label: 'Save to XRP',
            iconImage: filesave,
            clicked: SaveFile
          },
          {
            label: 'Sas As to XRP',
            iconImage: filesaveas,
            clicked: SaveFileAs
          }
        ]
      },
      {
        label: 'View',
        children: [
          {
            label: 'View Python',
            iconImage: python,
            clicked: ViewPythonFile
          },
          {
            label: 'Convert To Python',
            iconImage: convert,
            clicked: ConvertToPython
          }
        ],
        childrenExt: [
          {
            label: 'Increase Font',
            iconImage: fontplus,
            clicked: FontPlusPlus
          },
          {
            label: 'Descrease Font',
            iconImage: fontminus,
            clicked: FontMinus
          },
          {
            label: 'Toggle Autocomplete',
            iconImage: autocomplete,
            clicked: ToggleAutoComplete
          }
        ]
      },
      {
        label: 'Help',
        children: [
          {
            label: 'User Guide',
            iconImage: userguide,
            link: "https://xrpusersguide.readthedocs.io/en/latest/course/introduction.html"
          },
          {
            label: 'API',
            iconImage: apilink,
            link: "https://open-stem.github.io/XRP_MicroPython/"
          }
        ]
      }
    ];
  
    return (
      <div className='p-1 px-10 flex justify-between items-center'>
          <div className='flex flex-row gap-4 transition-all'>
            { /** Logo */}
            <Image src={logo} alt="logo" width='100' height='50'/>
            { navItems.map((item, index) => (
              <div
                key={index}
                className='relative group transition-all'
              >
                <p className='flex ml-2 mt-4 cursor-pointer text-neutral-200 group-hover:bg-blue-500'>
                  <span>{item.label}</span>
                  {item.children && (
                    <TiArrowSortedDown className='mt-1 rotate-180 transition-all group-hover:rotate-0'/>
                  )}
                </p>
                {item.children && (
                  <div className='absolute left-2 top-[52] hidden mx-auto flex-col py-3 bg-[#4984ac] shadow-md transition-all group-hover:flex z-[100]'>
                    <ul id="pythonId" className='flex flex-col cursor-pointer'>
                      { item.children.map((child, ci) => (
                        <li
                          key={ci}
                          className='py-1 pl-4 pr-10 text-neutral-200 hover:bg-[#3a6989]'
                        >
                          <MenuItem item={child} />
                        </li>
                      ))}
                    </ul>
                    { item.childrenExt && (
                      <ul id="blockId" className='flex-col cursor-pointer hidden'>
                      { item.childrenExt?.map((child, ci) => 
                        <li
                          key={ci}
                          className='py-1 pl-4 pr-10 text-neutral-200 hover:bg-[#3a6989] '
                          >
                          { /** menu item */}
                          <MenuItem item={child} />
                        </li>
                      )}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          { /** connect */}
          <button className='p-1 border-2 rounded-md h-full w-[200] flex items-center justify-center gap-2 bg-white hover:bg-green-100'>
              <svg width="20" height="20" viewBox="0 0 20 20"><polygon points="11 4 12 4 12 8 16 8 16 9 11 9"></polygon><polygon points="4 11 9 11 9 16 8 16 8 12 4 12"></polygon><path fill="none" stroke="#000" strokeWidth="1.1" d="M12,8 L18,2"></path><path fill="none" stroke="#000" strokeWidth="1.1" d="M2,18 L8,12"></path></svg>
              <span>CONNECT XRP</span>
          </button>
      </div>
    )
}

export default NavBar;