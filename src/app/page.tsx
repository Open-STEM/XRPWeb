'use client';

import React, { useEffect, useRef } from 'react';
import XRPLayout from './components/xrplayout';
import Navbar from './components/navbar';

/**
 * Home page component
 */
export default function Home() {
  const xrpLayoutRef = useRef();

  useEffect(() => {
    console.log('Home', xrpLayoutRef.current)
  });

  return (
    <React.StrictMode>
      <header className='bg-[#2980b9]'>
        <Navbar layoutref={xrpLayoutRef}/>
      </header>
      <main className='relative h-[calc(100vh-56px)]'>
        <XRPLayout forwardedref={xrpLayoutRef} />
      </main>
    </React.StrictMode>
  )
}