'use client';

import React, { useEffect, useState } from 'react';
import DemoApp from './DemoApp';

/**
 * Demo page - renders the real QA Studio UI
 * BackendProvider is set up in layout.tsx
 * Client-only rendering to avoid SSR issues with shared UI components
 */
export default function DemoPage() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div style={{ 
        width: '100%', 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: 'white',
        backgroundColor: '#0b1020'
      }}>
        <div>Loading QA Studio Demo...</div>
      </div>
    );
  }

  return <DemoApp />;
}

// Force dynamic rendering to avoid SSR issues
export const dynamic = 'force-dynamic';

