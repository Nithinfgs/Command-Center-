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
import { CockpitHudView } from './components/flight-sandbox/CockpitHudView';
import { RoverSurfaceCanvas } from './components/flight-sandbox/RoverSurfaceCanvas';
import { ConstellationView } from './components/constellation/ConstellationView';
import { GlobeImpactCanvas3D } from './components/asteroid-impact/GlobeImpactCanvas3D';

const MainLayout: React.FC = () => {
  const { activeTab } = useSimulation();
  const [use3DGlobe, setUse3DGlobe] = React.useState(false);
  const [isCockpitMode, setIsCockpitMode] = React.useState(false);

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
            <div className="flex-1 flex h-full overflow-hidden relative">
              <AsteroidConfigurator />
              <div className="flex-1 flex flex-col h-full relative">
                <div className="absolute top-3 right-3 z-30 flex items-center bg-[#151820]/90 border border-[#252B36] p-1 rounded-lg text-xs">
                  <button
                    onClick={() => setUse3DGlobe(false)}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
                      !use3DGlobe ? 'bg-[#FF8A1F] text-[#090A0D]' : 'text-[#A4ABB6] hover:text-[#E6E8EB]'
                    }`}
                  >
                    2D Blast Map
                  </button>
                  <button
                    onClick={() => setUse3DGlobe(true)}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
                      use3DGlobe ? 'bg-[#FF8A1F] text-[#090A0D]' : 'text-[#A4ABB6] hover:text-[#E6E8EB]'
                    }`}
                  >
                    3D Earth Globe
                  </button>
                </div>
                {use3DGlobe ? <GlobeImpactCanvas3D /> : <ImpactCanvas />}
              </div>
            </div>
          </ErrorBoundary>
        )}

        {activeTab === 'flight-sandbox' && (
          <ErrorBoundary fallbackTitle="Flight Dynamics Sandbox">
            <div className="flex-1 flex h-full overflow-hidden relative">
              <NavBallHud />
              <div className="flex-1 flex flex-col h-full relative">
                <div className="absolute top-3 right-3 z-30 flex items-center bg-[#151820]/90 border border-[#252B36] p-1 rounded-lg text-xs">
                  <button
                    onClick={() => setIsCockpitMode(false)}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
                      !isCockpitMode ? 'bg-[#FF8A1F] text-[#090A0D]' : 'text-[#A4ABB6] hover:text-[#E6E8EB]'
                    }`}
                  >
                    Chase Camera
                  </button>
                  <button
                    onClick={() => setIsCockpitMode(true)}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
                      isCockpitMode ? 'bg-[#FF8A1F] text-[#090A0D]' : 'text-[#A4ABB6] hover:text-[#E6E8EB]'
                    }`}
                  >
                    Cockpit HUD
                  </button>
                </div>
                {isCockpitMode ? <CockpitHudView /> : <FlightCanvas />}
              </div>
            </div>
          </ErrorBoundary>
        )}

        {activeTab === 'constellation' && (
          <ErrorBoundary fallbackTitle="Satellite Constellations">
            <ConstellationView />
          </ErrorBoundary>
        )}

        {activeTab === 'rover-surface' && (
          <ErrorBoundary fallbackTitle="Planetary Surface Exploration">
            <RoverSurfaceCanvas />
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
