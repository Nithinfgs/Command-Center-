import React, { useState } from 'react';
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
import { PlusCircle, Layers, Sliders, Activity, Compass, Settings, BarChart2 } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { activeTab, blueprint } = useSimulation();
  const [use3DGlobe, setUse3DGlobe] = useState(false);
  const [isCockpitMode, setIsCockpitMode] = useState(false);

  // Mobile Drawer State
  const [mobileDrawer, setMobileDrawer] = useState<'parts' | 'staging' | 'controls' | null>(null);
  const [showMobileMetrics, setShowMobileMetrics] = useState(false);

  const closeMobileDrawer = () => setMobileDrawer(null);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#090A0D] text-[#E6E8EB] overflow-hidden select-none">
      {/* Universal Command Center Telemetry Header */}
      <Header />

      {/* Main Simulation Viewport */}
      <main className="flex-1 flex flex-col overflow-hidden relative" role="main" aria-label="Simulation Viewport">
        {activeTab === 'rocket-builder' && (
          <ErrorBoundary fallbackTitle="Rocket Builder Module">
            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
              <div className="flex-1 flex overflow-hidden relative">
                {/* Desktop Side-by-Side: Parts */}
                <div className="hidden lg:flex h-full">
                  <PartsPalette />
                </div>

                {/* 100% Width Canvas for Mobile & Desktop */}
                <div className="flex-1 h-full relative overflow-hidden">
                  <RocketBuilderCanvas />
                </div>

                {/* Desktop Side-by-Side: Staging */}
                <div className="hidden lg:flex h-full">
                  <StagingPanel />
                </div>
              </div>

              {/* Desktop Metrics HUD / Optional Mobile HUD */}
              <div className={`shrink-0 ${showMobileMetrics ? 'block' : 'hidden lg:block'}`}>
                <RocketMetricsHud />
              </div>

              {/* Mobile Phone Floating Action Bar */}
              <div className="lg:hidden absolute bottom-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 bg-[#151820]/95 backdrop-blur-md border border-[#353D4A] px-2 py-1.5 rounded-full shadow-2xl">
                <button
                  onClick={() => setMobileDrawer('parts')}
                  className="flex items-center gap-1 px-3 py-1 rounded-full bg-[#FF8A1F] text-[#090A0D] text-xs font-bold shadow-sm"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Parts (28)</span>
                </button>
                <button
                  onClick={() => setMobileDrawer('staging')}
                  className="flex items-center gap-1 px-3 py-1 rounded-full bg-[#1B1F28] hover:bg-[#252B36] text-[#E6E8EB] text-xs font-semibold border border-[#252B36]"
                >
                  <Layers className="w-3.5 h-3.5 text-[#38BDF8]" />
                  <span>Staging ({blueprint.parts.length})</span>
                </button>
                <button
                  onClick={() => setShowMobileMetrics(!showMobileMetrics)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                    showMobileMetrics 
                      ? 'bg-[#38BDF8]/20 border-[#38BDF8] text-[#38BDF8]' 
                      : 'bg-[#1B1F28] border-[#252B36] text-[#A4ABB6]'
                  }`}
                  title="Toggle Delta-V & TWR Metrics"
                >
                  <BarChart2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Mobile Drawers (Parts & Staging) */}
              {mobileDrawer === 'parts' && (
                <div 
                  onClick={closeMobileDrawer}
                  className="lg:hidden fixed inset-0 bg-[#090A0D]/85 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
                >
                  <div 
                    onClick={e => e.stopPropagation()}
                    className="w-full sm:max-w-md h-[80vh] bg-[#151820] border-t sm:border border-[#353D4A] rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl flex flex-col"
                  >
                    <PartsPalette onClose={closeMobileDrawer} />
                  </div>
                </div>
              )}

              {mobileDrawer === 'staging' && (
                <div 
                  onClick={closeMobileDrawer}
                  className="lg:hidden fixed inset-0 bg-[#090A0D]/85 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
                >
                  <div 
                    onClick={e => e.stopPropagation()}
                    className="w-full sm:max-w-md h-[80vh] bg-[#151820] border-t sm:border border-[#353D4A] rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl flex flex-col"
                  >
                    <StagingPanel onClose={closeMobileDrawer} />
                  </div>
                </div>
              )}
            </div>
          </ErrorBoundary>
        )}

        {activeTab === 'wind-tunnel' && (
          <ErrorBoundary fallbackTitle="CFD Wind Tunnel Module">
            <div className="flex-1 flex h-full overflow-hidden relative">
              {/* Desktop Side-by-Side */}
              <div className="hidden lg:flex h-full">
                <WindTunnelControls />
              </div>

              {/* Full Width Streamlines Canvas */}
              <div className="flex-1 h-full relative overflow-hidden">
                <WindTunnelCanvas />
              </div>

              {/* Mobile Floating Action Button */}
              <div className="lg:hidden absolute bottom-3 left-1/2 -translate-x-1/2 z-30">
                <button
                  onClick={() => setMobileDrawer('controls')}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#FF8A1F] text-[#090A0D] text-xs font-bold shadow-2xl"
                >
                  <Sliders className="w-4 h-4" />
                  <span>Mach & Aero Controls</span>
                </button>
              </div>

              {/* Mobile Controls Drawer */}
              {mobileDrawer === 'controls' && (
                <div 
                  onClick={closeMobileDrawer}
                  className="lg:hidden fixed inset-0 bg-[#090A0D]/85 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
                >
                  <div 
                    onClick={e => e.stopPropagation()}
                    className="w-full sm:max-w-md h-[80vh] bg-[#151820] border-t sm:border border-[#353D4A] rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl flex flex-col"
                  >
                    <WindTunnelControls onClose={closeMobileDrawer} />
                  </div>
                </div>
              )}
            </div>
          </ErrorBoundary>
        )}

        {activeTab === 'celestial-sim' && (
          <ErrorBoundary fallbackTitle="Celestial N-Body Simulator">
            <div className="flex-1 flex h-full overflow-hidden relative">
              {/* Desktop Side-by-Side */}
              <div className="hidden lg:flex h-full">
                <CelestialControls />
              </div>

              {/* Full Width 3D Orbits Canvas */}
              <div className="flex-1 h-full relative overflow-hidden">
                <CelestialCanvas3D />
              </div>

              {/* Mobile Floating Action Button */}
              <div className="lg:hidden absolute bottom-3 left-1/2 -translate-x-1/2 z-30">
                <button
                  onClick={() => setMobileDrawer('controls')}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#38BDF8] text-[#090A0D] text-xs font-bold shadow-2xl"
                >
                  <Activity className="w-4 h-4" />
                  <span>Orbits & Maneuvers</span>
                </button>
              </div>

              {/* Mobile Controls Drawer */}
              {mobileDrawer === 'controls' && (
                <div 
                  onClick={closeMobileDrawer}
                  className="lg:hidden fixed inset-0 bg-[#090A0D]/85 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
                >
                  <div 
                    onClick={e => e.stopPropagation()}
                    className="w-full sm:max-w-md h-[80vh] bg-[#151820] border-t sm:border border-[#353D4A] rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl flex flex-col"
                  >
                    <CelestialControls onClose={closeMobileDrawer} />
                  </div>
                </div>
              )}
            </div>
          </ErrorBoundary>
        )}

        {activeTab === 'asteroid-impact' && (
          <ErrorBoundary fallbackTitle="Kinetic Impact Simulator">
            <div className="flex-1 flex h-full overflow-hidden relative">
              {/* Desktop Side-by-Side */}
              <div className="hidden lg:flex h-full">
                <AsteroidConfigurator />
              </div>

              {/* Full Width Impact Map / 3D Globe Canvas */}
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

              {/* Mobile Floating Action Button */}
              <div className="lg:hidden absolute bottom-3 left-1/2 -translate-x-1/2 z-30">
                <button
                  onClick={() => setMobileDrawer('controls')}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#FF8A1F] text-[#090A0D] text-xs font-bold shadow-2xl"
                >
                  <Settings className="w-4 h-4" />
                  <span>Asteroid Settings</span>
                </button>
              </div>

              {/* Mobile Controls Drawer */}
              {mobileDrawer === 'controls' && (
                <div 
                  onClick={closeMobileDrawer}
                  className="lg:hidden fixed inset-0 bg-[#090A0D]/85 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
                >
                  <div 
                    onClick={e => e.stopPropagation()}
                    className="w-full sm:max-w-md h-[80vh] bg-[#151820] border-t sm:border border-[#353D4A] rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl flex flex-col"
                  >
                    <AsteroidConfigurator onClose={closeMobileDrawer} />
                  </div>
                </div>
              )}
            </div>
          </ErrorBoundary>
        )}

        {activeTab === 'flight-sandbox' && (
          <ErrorBoundary fallbackTitle="Flight Dynamics Sandbox">
            <div className="flex-1 flex h-full overflow-hidden relative">
              {/* Desktop Side-by-Side */}
              <div className="hidden lg:flex h-full">
                <NavBallHud />
              </div>

              {/* Full Width Flight Simulation Canvas */}
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

              {/* Mobile Floating Action Button */}
              <div className="lg:hidden absolute bottom-3 left-1/2 -translate-x-1/2 z-30">
                <button
                  onClick={() => setMobileDrawer('controls')}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#FF8A1F] text-[#090A0D] text-xs font-bold shadow-2xl"
                >
                  <Compass className="w-4 h-4" />
                  <span>Flight Controls & Telemetry</span>
                </button>
              </div>

              {/* Mobile Controls Drawer */}
              {mobileDrawer === 'controls' && (
                <div 
                  onClick={closeMobileDrawer}
                  className="lg:hidden fixed inset-0 bg-[#090A0D]/85 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
                >
                  <div 
                    onClick={e => e.stopPropagation()}
                    className="w-full sm:max-w-md h-[80vh] bg-[#151820] border-t sm:border border-[#353D4A] rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl flex flex-col"
                  >
                    <NavBallHud onClose={closeMobileDrawer} />
                  </div>
                </div>
              )}
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
