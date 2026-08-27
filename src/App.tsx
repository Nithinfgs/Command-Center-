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

  // Mobile-specific layout states (< 1024px)
  const [mobileBuilderTab, setMobileBuilderTab] = React.useState<'canvas' | 'parts' | 'staging'>('canvas');
  const [mobileShowControls, setMobileShowControls] = React.useState(false);

  // Auto-close mobile drawer when switching tabs
  React.useEffect(() => {
    setMobileShowControls(false);
    setMobileBuilderTab('canvas');
  }, [activeTab]);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#090A0D] text-[#E6E8EB] overflow-hidden select-none">
      {/* Universal Command Center Telemetry Header */}
      <Header />

      {/* Main Simulation Viewport */}
      <main className="flex-1 flex flex-col overflow-hidden relative" role="main" aria-label="Simulation Viewport">
        {/* ===================== ROCKET BUILDER ===================== */}
        {activeTab === 'rocket-builder' && (
          <ErrorBoundary fallbackTitle="Rocket Builder Module">
            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
              {/* Mobile Builder View Switcher (< 1024px) */}
              <div className="lg:hidden flex items-center justify-between px-3 py-1.5 bg-[#151820] border-b border-[#252B36] z-20 shrink-0">
                <div className="flex items-center gap-1 bg-[#0E1015] p-1 rounded-lg border border-[#252B36] w-full justify-around">
                  <button
                    onClick={() => setMobileBuilderTab('canvas')}
                    className={`flex-1 py-1 px-2 rounded text-xs font-semibold transition-all text-center ${
                      mobileBuilderTab === 'canvas' ? 'bg-[#FF8A1F] text-[#090A0D]' : 'text-[#A4ABB6] hover:text-[#E6E8EB]'
                    }`}
                  >
                    📐 Rocket View
                  </button>
                  <button
                    onClick={() => setMobileBuilderTab('parts')}
                    className={`flex-1 py-1 px-2 rounded text-xs font-semibold transition-all text-center ${
                      mobileBuilderTab === 'parts' ? 'bg-[#FF8A1F] text-[#090A0D]' : 'text-[#A4ABB6] hover:text-[#E6E8EB]'
                    }`}
                  >
                    🎨 Parts Library
                  </button>
                  <button
                    onClick={() => setMobileBuilderTab('staging')}
                    className={`flex-1 py-1 px-2 rounded text-xs font-semibold transition-all text-center ${
                      mobileBuilderTab === 'staging' ? 'bg-[#FF8A1F] text-[#090A0D]' : 'text-[#A4ABB6] hover:text-[#E6E8EB]'
                    }`}
                  >
                    🚀 Staging Order
                  </button>
                </div>
              </div>

              {/* Viewport Content */}
              <div className="flex-1 flex overflow-hidden relative">
                {/* Parts Palette: Always on desktop, conditional on mobile */}
                <div className={`h-full ${mobileBuilderTab === 'parts' ? 'absolute inset-0 z-30 flex w-full bg-[#151820]' : 'hidden lg:flex'}`}>
                  <PartsPalette />
                </div>

                {/* Main Canvas: Takes full width on mobile unless parts/staging is active */}
                <div className={`flex-1 flex h-full overflow-hidden ${mobileBuilderTab !== 'canvas' ? 'hidden lg:flex' : 'flex'}`}>
                  <RocketBuilderCanvas />
                </div>

                {/* Staging Panel: Always on desktop, conditional on mobile */}
                <div className={`h-full ${mobileBuilderTab === 'staging' ? 'absolute inset-0 z-30 flex w-full bg-[#151820]' : 'hidden lg:flex'}`}>
                  <StagingPanel />
                </div>
              </div>

              {/* Metrics HUD at Bottom */}
              <RocketMetricsHud />
            </div>
          </ErrorBoundary>
        )}

        {/* ===================== CFD WIND TUNNEL ===================== */}
        {activeTab === 'wind-tunnel' && (
          <ErrorBoundary fallbackTitle="CFD Wind Tunnel Module">
            <div className="flex-1 flex h-full overflow-hidden relative">
              {/* Mobile Controls Toggle Button */}
              <button
                onClick={() => setMobileShowControls(!mobileShowControls)}
                className="lg:hidden absolute bottom-4 left-4 z-30 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#FF8A1F] text-[#090A0D] font-bold text-xs shadow-lg shadow-[#FF8A1F]/30 active:scale-95 transition-all"
              >
                <span>⚙️</span>
                <span>{mobileShowControls ? 'Hide Controls' : 'CFD Controls & Mach'}</span>
              </button>

              {/* Controls Panel */}
              <div className={`h-full z-20 ${mobileShowControls ? 'absolute inset-y-0 left-0 max-w-[85vw] shadow-2xl bg-[#151820] flex' : 'hidden lg:flex'}`}>
                <WindTunnelControls />
              </div>

              {/* Supersonic Streamlines Canvas */}
              <WindTunnelCanvas />
            </div>
          </ErrorBoundary>
        )}

        {/* ===================== CELESTIAL SIMULATOR ===================== */}
        {activeTab === 'celestial-sim' && (
          <ErrorBoundary fallbackTitle="Celestial N-Body Simulator">
            <div className="flex-1 flex h-full overflow-hidden relative">
              {/* Mobile Controls Toggle Button */}
              <button
                onClick={() => setMobileShowControls(!mobileShowControls)}
                className="lg:hidden absolute bottom-4 left-4 z-30 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#38BDF8] text-[#090A0D] font-bold text-xs shadow-lg shadow-[#38BDF8]/30 active:scale-95 transition-all"
              >
                <span>🪐</span>
                <span>{mobileShowControls ? 'Hide Orbits Panel' : 'Planets & Maneuvers'}</span>
              </button>

              {/* Controls Panel */}
              <div className={`h-full z-20 ${mobileShowControls ? 'absolute inset-y-0 left-0 max-w-[85vw] shadow-2xl bg-[#151820] flex' : 'hidden lg:flex'}`}>
                <CelestialControls />
              </div>

              {/* 3D Photorealistic Celestial Canvas */}
              <CelestialCanvas3D />
            </div>
          </ErrorBoundary>
        )}

        {/* ===================== ASTEROID IMPACT ===================== */}
        {activeTab === 'asteroid-impact' && (
          <ErrorBoundary fallbackTitle="Kinetic Impact Simulator">
            <div className="flex-1 flex h-full overflow-hidden relative">
              {/* Mobile Controls Toggle Button */}
              <button
                onClick={() => setMobileShowControls(!mobileShowControls)}
                className="lg:hidden absolute bottom-4 left-4 z-30 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F87171] text-[#090A0D] font-bold text-xs shadow-lg shadow-[#F87171]/30 active:scale-95 transition-all"
              >
                <span>☄️</span>
                <span>{mobileShowControls ? 'Hide Impact Setup' : 'Impact Configurator'}</span>
              </button>

              {/* Configurator Panel */}
              <div className={`h-full z-20 ${mobileShowControls ? 'absolute inset-y-0 left-0 max-w-[85vw] shadow-2xl bg-[#151820] flex' : 'hidden lg:flex'}`}>
                <AsteroidConfigurator />
              </div>

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

        {/* ===================== FLIGHT SANDBOX ===================== */}
        {activeTab === 'flight-sandbox' && (
          <ErrorBoundary fallbackTitle="Flight Dynamics Sandbox">
            <div className="flex-1 flex h-full overflow-hidden relative">
              {/* Mobile Flight Controls Toggle Button */}
              <button
                onClick={() => setMobileShowControls(!mobileShowControls)}
                className="lg:hidden absolute bottom-4 left-4 z-30 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#55B982] text-[#090A0D] font-bold text-xs shadow-lg shadow-[#55B982]/30 active:scale-95 transition-all"
              >
                <span>🚀</span>
                <span>{mobileShowControls ? 'Hide Flight HUD' : 'NavBall & Throttle'}</span>
              </button>

              {/* NavBall HUD Panel */}
              <div className={`h-full z-20 ${mobileShowControls ? 'absolute inset-y-0 left-0 max-w-[90vw] shadow-2xl bg-[#151820] flex' : 'hidden lg:flex'}`}>
                <NavBallHud />
              </div>

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

        {/* ===================== CONSTELLATIONS ===================== */}
        {activeTab === 'constellation' && (
          <ErrorBoundary fallbackTitle="Satellite Constellations">
            <ConstellationView />
          </ErrorBoundary>
        )}

        {/* ===================== ROVER EXPLORATION ===================== */}
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
