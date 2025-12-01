import React from 'react';
import { BrowserStackTM } from './BrowserStackTM';

/**
 * BrowserStack Test Management Screen
 * Full-page screen for BrowserStack TM integration
 */
const BrowserStackTMScreen: React.FC = () => {
  return (
    <div style={{ height: '100vh', width: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <BrowserStackTM />
    </div>
  );
};

export default BrowserStackTMScreen;

