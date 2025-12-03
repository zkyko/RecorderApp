import React from 'react';
import { Jira } from './Jira';

/**
 * Jira Screen
 * Full-page screen for Jira integration
 */
const JiraScreen: React.FC = () => {
  return (
    <div style={{ height: '100vh', width: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Jira />
    </div>
  );
};

export default JiraScreen;

