import React from 'react';
import { SimulationProvider, useSimulation } from './context/SimulationContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Header } from './components/layout/Header';

const PartsPalette = React.lazy(() => import('./components/rocket-builder/PartsPalette').then(module => ({ default: module.PartsPalette })));
const RocketBuilderCanvas = React.lazy(() => import('./components/rocket-builder/RocketBuilderCanvas').then(module => ({ default: module.RocketBuilderCanvas })));
const StagingPanel = React.lazy(() => import('./components/rocket-builder/StagingPanel').then(module => ({ default: module.StagingPanel })));
const RocketMetricsHud = React.lazy(() => import('./components/rocket-builder/RocketMetricsHud').then(module => ({ default: module.RocketMetricsHud })));
const WindTunnelControls = React.lazy(() => import('./components/wind-tunnel/WindTunnelControls').then(module => ({ default: module.WindTunnelControls })));
const WindTunnelCanvas = React.lazy(() => import('./components/wind-tunnel/WindTunnelCanvas').then(module => ({ default: module.WindTunnelCanvas })));
const CelestialControls = React.lazy(() => import('./components/celestial-sim/CelestialControls').then(module => ({ default: module.CelestialControls })));
const CelestialCanvas3D = React.lazy(() => import('./components/celestial-sim/CelestialCanvas3D').then(module => ({ default: module.CelestialCanvas3D })));
const AsteroidConfigurator = React.lazy(() => import('./components/asteroid-impact/AsteroidConfigurator').then(module => ({ default: module.AsteroidConfigurator })));
const ImpactCanvas = React.lazy(() => import('./components/asteroid-impact/ImpactCanvas').then(module => ({ default: module.ImpactCanvas })));
const NavBallHud = React.lazy(() => import('./components/flight-sandbox/NavBallHud').then(module => ({ default: module.NavBallHud })));
const FlightCanvas = React.lazy(() => import('./components/flight-sandbox/FlightCanvas').then(module => ({ default: module.FlightCanvas })));
const CockpitHudView = React.lazy(() => import('./components/flight-sandbox/CockpitHudView').then(module => ({ default: module.CockpitHudView })));
const RoverSurfaceCanvas = React.lazy(() => import('./components/flight-sandbox/RoverSurfaceCanvas').then(module => ({ default: module.RoverSurfaceCanvas })));
const ConstellationView = React.lazy(() => import('./components/constellation/ConstellationView').then(module => ({ default: module.ConstellationView })));
const GlobeImpactCanvas3D = React.lazy(() => import('./components/asteroid-impact/GlobeImpactCanvas3D').then(module => ({ default: module.GlobeImpactCanvas3D })));

const ModuleLoading: React.FC = () => (
  <div className="flex h-full flex-1 items-center justify-center bg-[#090A0D]" role="status" aria-live="polite">
    <div className="flex items-center gap-3 rounded-lg border border-[#252B36] bg-[#151820] px-4 py-3 text-xs text-[#A4ABB6]">
      <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#FF8A1F]" />
      Loading mathematical model...
    </div>
  </div>
);

const MainLayout: React.FC = () => {
  const { activeTab } = useSimulation();
  const [use3DGlobe, setUse3DGlobe] = React.useState(false);
  const [isCockpitMode, setIsCockpitMode] = React.useState(false);

  return (
    <div className="flex h-[100dvh] w-full min-w-[1024px] flex-col overflow-hidden bg-[#090A0D] text-[#E6E8EB] select-none">
      {/* Universal Command Center Telemetry Header */}
      <Header />

      {/* Main Simulation Viewport */}
      <main className="flex-1 flex flex-col overflow-hidden relative" role="main" aria-label="Simulation Viewport">
        <React.Suspense fallback={<ModuleLoading />}>
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
                    aria-pressed={!use3DGlobe}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
                      !use3DGlobe ? 'bg-[#FF8A1F] text-[#090A0D]' : 'text-[#A4ABB6] hover:text-[#E6E8EB]'
                    }`}
                  >
                    2D Blast Map
                  </button>
                  <button
                    onClick={() => setUse3DGlobe(true)}
                    aria-pressed={use3DGlobe}
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
                    aria-pressed={!isCockpitMode}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
                      !isCockpitMode ? 'bg-[#FF8A1F] text-[#090A0D]' : 'text-[#A4ABB6] hover:text-[#E6E8EB]'
                    }`}
                  >
                    Chase Camera
                  </button>
                  <button
                    onClick={() => setIsCockpitMode(true)}
                    aria-pressed={isCockpitMode}
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
        </React.Suspense>
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
