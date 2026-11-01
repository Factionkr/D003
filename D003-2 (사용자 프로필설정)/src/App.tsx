import React from 'react';
import { OnboardingContainer } from './components/OnboardingContainer';

export const App: React.FC = () => {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <OnboardingContainer />
    </div>
  );
};

export default App;
