import { useRef } from 'react';
import './App.css'
import Navbar from './components/navbar';
import XRPLayout from './components/xrplayout';

function App() {
  const xrpLayoutRef = useRef();
  
  return (
    <>
      <header className='bg-[#2980b9]'>
        <Navbar layoutref={xrpLayoutRef}/>
      </header>
      <main className='relative h-[calc(100vh-56px)]'>
        <XRPLayout forwardedref={xrpLayoutRef} />
      </main>

    </>
  )
}

export default App
