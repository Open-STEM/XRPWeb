'use client';

import React from 'react';
import Header from '../app/components/header';
import XRPLayout from './components/xrplayout';

/**
 * Home page component
 */
export default function Home() {

  return (
    <React.StrictMode>
      <Header />
      <main className='relative h-[calc(100vh-56px)]'>
        <XRPLayout />
      </main>
    </React.StrictMode>
  )
}