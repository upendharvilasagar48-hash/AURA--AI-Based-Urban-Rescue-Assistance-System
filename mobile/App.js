import React from 'react';
import { MobileAuraProvider } from './src/context/MobileAuraContext';
import DriverCockpitScreen from './src/screens/DriverCockpitScreen';

export default function App() {
  return (
    <MobileAuraProvider>
      <DriverCockpitScreen />
    </MobileAuraProvider>
  );
}
