import React from 'react';
import { SimulationProvider, useSimulation } from './context/SimulationContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Header } from './components/layout/Header';
import { PartsPalette } from './components/rocket-builder/PartsPalette';
import { RocketBuilderCanvas } from './components/rocket-builder/RocketBuilderCanvas';
import { StagingPanel } from './components/rocket-builder/StagingPanel';
import { RocketMetricsHud } from './components/rocket-builder/RocketMetricsHud';
import { WindTunnelControls } from './components/wind-tunnel/WindTunnelControls';
import { WindTunnelCanvas } from './components/wind-tunnel/WindTunnelCanvas';
import { CelestialControls } from './components/celestial-sim/CelestialControls';
import { CelestialCanvas3D } from './components/celestial-sim/CelestialCanvas3D';
import { AsteroidConfigurator } from './components/asteroid-impact/AsteroidConfigurator';
import { ImpactCanvas } from './components/asteroid-impact/ImpactCanvas';
import { NavBallHud } from './components/flight-sandbox/NavBallHud';
import { FlightCanvas } from './components/flight-sandbox/FlightCanvas';

const MainLayout: React.FC = () => {
  const { activeTab } = useSimulation();

  return (
    <div className="flex flex-col h-screen w-screen bg-[#090A0D] text-[#E6E8EB] overflow-hidden select-none">
      {/* Universal Command Center Telemetry Header */}
      <Header />

      {/* Main Simulation Viewport */}
      <main className="flex-1 flex flex-col overflow-hidden relative" role="main" aria-label="Simulation Viewport">
        {activeTab === 'rocket-builder' && (
          <ErrorBoundary fallbackTitle="Rocket Builder Module">
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              <div className="flex-1 flex overflow-hidden">
                <PartsPalette />
                <RocketBuilderCanvas />
                <StagingPanel />
              </div>
              <RocketMetricsHud />
            </div>
          </ErrorBoundary>
        )}

        {activeTab === 'wind-tunnel' && (
          <ErrorBoundary fallbackTitle="CFD Wind Tunnel Module">
            <div className="flex-1 flex h-full overflow-hidden">
              <WindTunnelControls />
              <WindTunnelCanvas />
            </div>
          </ErrorBoundary>
        )}

        {activeTab === 'celestial-sim' && (
          <ErrorBoundary fallbackTitle="Celestial N-Body Simulator">
            <div className="flex-1 flex h-full overflow-hidden">
              <CelestialControls />
              <CelestialCanvas3D />
            </div>
          </ErrorBoundary>
        )}

        {activeTab === 'asteroid-impact' && (
          <ErrorBoundary fallbackTitle="Kinetic Impact Simulator">
            <div className="flex-1 flex h-full overflow-hidden">
              <AsteroidConfigurator />
              <ImpactCanvas />
            </div>
          </ErrorBoundary>
        )}

        {activeTab === 'flight-sandbox' && (
          <ErrorBoundary fallbackTitle="Flight Dynamics Sandbox">
            <div className="flex-1 flex h-full overflow-hidden">
              <NavBallHud />
              <FlightCanvas />
            </div>
          </ErrorBoundary>
        )}
      </main>
    </div>
  );
};

export default function App() {
  return (
    <SimulationProvider>
      <MainLayout />
    </SimulationProvider>
  );
}
