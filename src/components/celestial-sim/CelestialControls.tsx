import React, { useState } from 'react';
import { 
  Orbit, 
  Play, 
  Pause, 
  Plus, 
  Trash2, 
  Grid, 
  Zap, 
  Compass, 
  Sparkles, 
  ArrowUpRight, 
  ArrowDownRight, 
  Activity, 
  RotateCw,
  HelpCircle,
  ChevronRight
} from 'lucide-react';
import { useSimulation } from '../../context/SimulationContext';
import { CELESTIAL_PRESETS, calculateOrbitalElements } from '../../physics/n-body';
import { PlanetCreatorModal } from './PlanetCreatorModal';

export const PLANET_PHOTOS: Record<string, { image: string; icon: string; bg: string; border: string }> = {
  sun: { image: '/textures/planets/sun.jpg', icon: '☀️', bg: 'bg-amber-500/20', border: 'border-amber-500' },
  mercury: { image: '/textures/planets/mercury.jpg', icon: '🌑', bg: 'bg-slate-500/20', border: 'border-slate-400' },
  venus: { image: '/textures/planets/venus.jpg', icon: '🟡', bg: 'bg-yellow-500/20', border: 'border-yellow-400' },
  earth: { image: '/textures/planets/earth.jpg', icon: '🌍', bg: 'bg-blue-500/20', border: 'border-blue-400' },
  moon: { image: '/textures/planets/moon.jpg', icon: '🌕', bg: 'bg-slate-400/20', border: 'border-slate-300' },
  mars: { image: '/textures/planets/mars.jpg', icon: '🔴', bg: 'bg-red-500/20', border: 'border-red-500' },
  jupiter: { image: '/textures/planets/jupiter.jpg', icon: '🪐', bg: 'bg-orange-500/20', border: 'border-orange-400' },
  saturn: { image: '/textures/planets/saturn.jpg', icon: '🪐', bg: 'bg-yellow-600/20', border: 'border-yellow-500' },
  black_hole: { image: '', icon: '🕳️', bg: 'bg-purple-900/30', border: 'border-purple-500' }
};

interface CelestialControlsProps {
  onClose?: () => void;
}

export const CelestialControls: React.FC<CelestialControlsProps> = ({ onClose }) => {
  const {
    celestialBodies,
    selectedBodyId,
    setSelectedBodyId,
    timeWarp,
    setTimeWarp,
    showSpacetimeGrid,
    setShowSpacetimeGrid,
    showOrbitalTrails,
    setShowOrbitalTrails,
    isCelestialPaused,
    setIsCelestialPaused,
    loadCelestialPreset,
    removeCelestialBody,
    updateCelestialBody
  } = useSimulation();

  const [showForgeModal, setShowForgeModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [controlTab, setControlTab] = useState<'maneuvers' | 'telemetry'>('maneuvers');

  const selectedBody = celestialBodies.find(b => b.id === selectedBodyId);
  const primaryBody = celestialBodies.find(b => b.isFixed || b.type === 'star' || b.type === 'black_hole') || celestialBodies[0];
  const orbital = selectedBody && primaryBody && selectedBody.id !== primaryBody.id
    ? calculateOrbitalElements(selectedBody, primaryBody)
    : null;

  // One-Click Orbital Maneuver Functions
  const applyProgradeBurn = (multiplier: number = 1.15) => {
    if (!selectedBody || selectedBody.isFixed) return;
    updateCelestialBody(selectedBody.id, {
      velocity: {
        vx: selectedBody.velocity.vx * multiplier,
        vy: selectedBody.velocity.vy * multiplier,
        vz: selectedBody.velocity.vz * multiplier
      }
    });
  };

  const circularizeOrbit = () => {
    if (!selectedBody || !primaryBody || selectedBody.isFixed) return;
    const dx = selectedBody.position.x - primaryBody.position.x;
    const dz = selectedBody.position.z - primaryBody.position.z;
    const r = Math.hypot(dx, dz) || 1;
    const speed = Math.max(1.8, Math.min(8.0, 75 / Math.sqrt(r)));

    updateCelestialBody(selectedBody.id, {
      velocity: {
        vx: (dz / r) * speed,
        vy: 0,
        vz: -(dx / r) * speed
      }
    });
  };

  const applyHohmannTransfer = () => {
    if (!selectedBody || !primaryBody || selectedBody.isFixed) return;
    applyProgradeBurn(1.25);
  };

  return (
    <aside className="w-full lg:w-[330px] bg-[#10131B] border-r border-[#252B36] flex flex-col h-full select-none text-xs shrink-0 z-20 font-mono-num">
      {/* Header with Quick Guide Button */}
      <div className="p-3 border-b border-[#252B36] flex items-center justify-between bg-[#0B0D13]">
        <div className="flex items-center gap-2">
          <Orbit className="w-4 h-4 text-[#FF8A1F]" />
          <h2 className="font-semibold text-[#E6E8EB] text-xs tracking-tight uppercase">Orbital Mechanics</h2>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowGuideModal(true)}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#38BDF8]/15 border border-[#38BDF8]/40 text-[#38BDF8] text-[10px] font-semibold hover:bg-[#38BDF8]/25 transition-all"
            title="Explain how orbits work in plain English"
          >
            <HelpCircle className="w-3 h-3" />
            <span>Guide</span>
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-1 rounded bg-[#1B1F28] text-[#A4ABB6] hover:text-[#E6E8EB] text-xs font-bold px-2 py-0.5"
            >
              ✕ Done
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3.5">
        {/* Time Control & Speed */}
        <div className="bg-[#161B26] border border-[#252B36] rounded-xl p-3 space-y-2.5 shadow-lg">
          <div className="flex items-center justify-between text-xs font-medium">
            <span className="text-[#A4ABB6] flex items-center gap-1.5">
              <span>Simulation Speed</span>
            </span>
            <span className="text-[#FF8A1F] font-bold text-xs">{timeWarp}x Speed</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsCelestialPaused(!isCelestialPaused)}
              className={`p-2 rounded-lg font-semibold border transition-all flex-1 flex items-center justify-center gap-1.5 ${
                isCelestialPaused
                  ? 'bg-[#E6B84D]/20 border-[#E6B84D] text-[#E6B84D]'
                  : 'bg-[#0A0D14] border-[#252B36] text-[#E6E8EB] hover:bg-[#1E2534]'
              }`}
            >
              {isCelestialPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              <span>{isCelestialPaused ? 'Resume Orbit' : 'Pause Orbit'}</span>
            </button>

            {[1, 5, 25, 100].map(warp => (
              <button
                key={warp}
                onClick={() => { setTimeWarp(warp); setIsCelestialPaused(false); }}
                className={`px-2 py-1.5 rounded-lg text-xs border transition-all font-bold ${
                  timeWarp === warp && !isCelestialPaused
                    ? 'bg-[#FF8A1F] text-[#090A0D] border-[#FF8A1F]'
                    : 'bg-[#0A0D14] border-[#252B36] text-[#A4ABB6] hover:text-[#E6E8EB]'
                }`}
              >
                {warp}x
              </button>
            ))}
          </div>
        </div>

        {/* Navigation & Maneuver Tabs */}
        <div className="flex items-center gap-1 bg-[#0A0D14] p-1 rounded-xl border border-[#252B36]">
          <button
            onClick={() => setControlTab('maneuvers')}
            className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition-all flex items-center justify-center gap-1.5 ${
              controlTab === 'maneuvers'
                ? 'bg-[#38BDF8] text-[#090A0D] shadow-md font-bold'
                : 'text-[#A4ABB6] hover:text-[#E6E8EB]'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Interactive Maneuvers</span>
          </button>

          <button
            onClick={() => setControlTab('telemetry')}
            className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition-all flex items-center justify-center gap-1.5 ${
              controlTab === 'telemetry'
                ? 'bg-[#FF8A1F] text-[#090A0D] shadow-md font-bold'
                : 'text-[#A4ABB6] hover:text-[#E6E8EB]'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Astrodynamics</span>
          </button>
        </div>

        {/* TAB 1: ONE-CLICK ORBITAL MANEUVERS & PRESETS */}
        {controlTab === 'maneuvers' && (
          <div className="space-y-3">
            {/* Active Selected Body Actions */}
            {selectedBody && (
              <div className="bg-[#161B26] border border-[#252B36] rounded-xl p-3 space-y-2.5 shadow-lg">
                <div className="flex items-center justify-between pb-2 border-b border-[#252B36]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-[#38BDF8] flex-shrink-0 bg-[#0A0D14] flex items-center justify-center shadow-md">
                      {PLANET_PHOTOS[selectedBody.id]?.image ? (
                        <img 
                          src={PLANET_PHOTOS[selectedBody.id].image} 
                          alt={selectedBody.name} 
                          className="w-full h-full object-cover" 
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <span className="text-base">{PLANET_PHOTOS[selectedBody.id]?.icon || '🪐'}</span>
                      )}
                    </div>
                    <div>
                      <span className="font-bold text-[#E6E8EB] text-xs block">{selectedBody.name}</span>
                      <span className="text-[10px] text-[#69717E] uppercase">{selectedBody.type.replace('_', ' ')}</span>
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    selectedBody.isFixed ? 'bg-[#94A3B8]/20 text-[#94A3B8]' : 'bg-[#10B981]/20 text-[#10B981]'
                  }`}>
                    {selectedBody.isFixed ? 'Central Anchor' : 'Orbiting'}
                  </span>
                </div>

                {!selectedBody.isFixed ? (
                  <div className="space-y-2 pt-1">
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={() => applyProgradeBurn(1.15)}
                        className="p-2.5 rounded-xl bg-[#0A0D14] border border-[#252B36] hover:border-[#10B981] hover:bg-[#10B981]/10 text-[#E6E8EB] flex flex-col items-start gap-1 transition-all group"
                      >
                        <div className="flex items-center gap-1.5 text-[#10B981] font-bold">
                          <ArrowUpRight className="w-4 h-4" />
                          <span>Speed Up (+15%)</span>
                        </div>
                        <span className="text-[9px] text-[#69717E] group-hover:text-[#A4ABB6]">
                          Pushes orbit higher (raises Ap)
                        </span>
                      </button>

                      <button
                        onClick={() => applyProgradeBurn(0.85)}
                        className="p-2.5 rounded-xl bg-[#0A0D14] border border-[#252B36] hover:border-[#EF4444] hover:bg-[#EF4444]/10 text-[#E6E8EB] flex flex-col items-start gap-1 transition-all group"
                      >
                        <div className="flex items-center gap-1.5 text-[#EF4444] font-bold">
                          <ArrowDownRight className="w-4 h-4" />
                          <span>Slow Down (-15%)</span>
                        </div>
                        <span className="text-[9px] text-[#69717E] group-hover:text-[#A4ABB6]">
                          Lowers orbit bottom (drops Pe)
                        </span>
                      </button>

                      <button
                        onClick={circularizeOrbit}
                        className="p-2.5 rounded-xl bg-[#0A0D14] border border-[#252B36] hover:border-[#38BDF8] hover:bg-[#38BDF8]/10 text-[#E6E8EB] flex flex-col items-start gap-1 transition-all group"
                      >
                        <div className="flex items-center gap-1.5 text-[#38BDF8] font-bold">
                          <RotateCw className="w-4 h-4" />
                          <span>Make Round</span>
                        </div>
                        <span className="text-[9px] text-[#69717E] group-hover:text-[#A4ABB6]">
                          Circularize orbit (e = 0)
                        </span>
                      </button>

                      <button
                        onClick={applyHohmannTransfer}
                        className="p-2.5 rounded-xl bg-[#0A0D14] border border-[#252B36] hover:border-[#FBBF24] hover:bg-[#FBBF24]/10 text-[#E6E8EB] flex flex-col items-start gap-1 transition-all group"
                      >
                        <div className="flex items-center gap-1.5 text-[#FBBF24] font-bold">
                          <Sparkles className="w-4 h-4" />
                          <span>Hohmann Jump</span>
                        </div>
                        <span className="text-[9px] text-[#69717E] group-hover:text-[#A4ABB6]">
                          Boost to outer planet orbit
                        </span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-[#A4ABB6] leading-relaxed bg-[#0A0D14] p-2.5 rounded-xl border border-[#252B36]">
                    This is the central gravitational anchor star. Select an orbiting planet or satellite to execute burns.
                  </p>
                )}
              </div>
            )}

            {/* Scenario Presets Selector */}
            <div className="bg-[#161B26] border border-[#252B36] rounded-xl p-3 space-y-2 shadow-lg">
              <label className="text-[#69717E] text-[10px] font-semibold uppercase tracking-wider block">
                Solar System & Physics Presets
              </label>
              <div className="space-y-1.5">
                {CELESTIAL_PRESETS.map(preset => (
                  <button
                    key={preset.id}
                    onClick={() => loadCelestialPreset(preset.id)}
                    className="w-full text-left p-2.5 rounded-xl bg-[#0A0D14] border border-[#252B36] hover:bg-[#1E2534] hover:border-[#38BDF8] transition-all flex items-center justify-between group"
                  >
                    <div>
                      <span className="font-bold text-[#E6E8EB] block text-xs group-hover:text-[#38BDF8]">{preset.name}</span>
                      <span className="text-[10px] text-[#69717E] line-clamp-1 mt-0.5">{preset.description}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#69717E] group-hover:text-[#38BDF8]" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ASTRODYNAMICS & KEPLERIAN TELEMETRY */}
        {controlTab === 'telemetry' && (
          <div className="space-y-3">
            {orbital ? (
              <div className="bg-[#161B26] border border-[#252B36] rounded-xl p-3 space-y-2.5 shadow-lg">
                <div className="flex items-center justify-between border-b border-[#252B36] pb-2">
                  <div>
                    <span className="text-[#FF8A1F] font-bold text-xs block">Keplerian Elements</span>
                    <span className="text-[10px] text-[#69717E]">Relative to {primaryBody.name}</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#38BDF8]/15 text-[#38BDF8]">
                    {orbital.isEscapeTrajectory ? 'Escape Velocity' : 'Bound Orbit'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                  <div className="bg-[#0A0D14] p-2 rounded-xl border border-[#252B36]">
                    <span className="text-[#69717E] block text-[9px] uppercase">Apoapsis (Ap) • Highest Peak</span>
                    <strong className="text-[#F59E0B] text-xs">{(orbital.apoapsis * 0.001).toFixed(1)}k km</strong>
                  </div>

                  <div className="bg-[#0A0D14] p-2 rounded-xl border border-[#252B36]">
                    <span className="text-[#69717E] block text-[9px] uppercase">Periapsis (Pe) • Lowest Point</span>
                    <strong className="text-[#38BDF8] text-xs">{(orbital.periapsis * 0.001).toFixed(1)}k km</strong>
                  </div>

                  <div className="bg-[#0A0D14] p-2 rounded-xl border border-[#252B36]">
                    <span className="text-[#69717E] block text-[9px] uppercase">Orbit Shape (Eccentricity)</span>
                    <strong className={`text-xs font-bold ${orbital.eccentricity < 0.1 ? 'text-[#10B981]' : orbital.eccentricity < 0.8 ? 'text-[#FBBF24]' : 'text-[#EF4444]'}`}>
                      {orbital.eccentricity < 0.05 ? 'Round (Circle)' : orbital.eccentricity < 0.9 ? `Oval (e=${orbital.eccentricity.toFixed(2)})` : 'Hyperbolic Escape'}
                    </strong>
                  </div>

                  <div className="bg-[#0A0D14] p-2 rounded-xl border border-[#252B36]">
                    <span className="text-[#69717E] block text-[9px] uppercase">Orbital Speed</span>
                    <strong className="text-[#34D399] text-xs">{orbital.currentSpeed.toFixed(2)} km/s</strong>
                  </div>

                  <div className="bg-[#0A0D14] p-2 rounded-xl border border-[#252B36] col-span-2">
                    <span className="text-[#69717E] block text-[9px] uppercase">Orbital Period (Time for 1 Lap)</span>
                    <strong className="text-[#E6E8EB] text-xs">{orbital.orbitalPeriod.toFixed(1)} seconds</strong>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-[#161B26] border border-[#252B36] rounded-xl p-4 text-center text-[#69717E] text-[11px] leading-relaxed">
                Click any orbiting planet or satellite from the list below to view its orbital elements and metrics.
              </div>
            )}
          </div>
        )}

        {/* Display Toggles */}
        <div className="bg-[#161B26] border border-[#252B36] rounded-xl p-3 space-y-2 shadow-lg">
          <label className="text-[#69717E] text-[10px] font-semibold uppercase tracking-wider block">
            Visual Overlays
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => setShowSpacetimeGrid(!showSpacetimeGrid)}
              className={`p-2 rounded-xl border text-center transition-all font-semibold flex items-center justify-center gap-1.5 ${
                showSpacetimeGrid
                  ? 'bg-[#38BDF8]/20 border-[#38BDF8] text-[#38BDF8]'
                  : 'bg-[#0A0D14] border-[#252B36] text-[#A4ABB6] hover:text-[#E6E8EB]'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Gravity Grid</span>
            </button>

            <button
              onClick={() => setShowOrbitalTrails(!showOrbitalTrails)}
              className={`p-2 rounded-xl border text-center transition-all font-semibold flex items-center justify-center gap-1.5 ${
                showOrbitalTrails
                  ? 'bg-[#10B981]/20 border-[#10B981] text-[#10B981]'
                  : 'bg-[#0A0D14] border-[#252B36] text-[#A4ABB6] hover:text-[#E6E8EB]'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Orbit Trails</span>
            </button>
          </div>
        </div>

        {/* Celestial Fleet List with Real Planet Badges */}
        <div className="bg-[#161B26] border border-[#252B36] rounded-xl p-3 space-y-2 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[#69717E] text-[10px] font-semibold uppercase tracking-wider">
              Celestial Fleet ({celestialBodies.length})
            </span>
            <button
              onClick={() => setShowForgeModal(true)}
              className="px-2 py-1 rounded-lg bg-[#38BDF8] text-[#090A0D] hover:bg-[#38BDF8]/80 font-bold flex items-center gap-1 text-[10px]"
              title="Spawn Custom Planet / Star"
            >
              <Plus className="w-3 h-3" />
              <span>Add Body</span>
            </button>
          </div>

          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {celestialBodies.map(body => {
              const isSelected = body.id === selectedBodyId;
              const photo = PLANET_PHOTOS[body.id];

              return (
                <div
                  key={body.id}
                  onClick={() => setSelectedBodyId(body.id)}
                  className={`flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#1B283D] border-[#38BDF8] text-[#E6E8EB] shadow-md'
                      : 'bg-[#0A0D14] border-[#252B36] text-[#A4ABB6] hover:bg-[#151C28] hover:text-[#E6E8EB]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-full overflow-hidden border border-[#38BDF8]/40 flex-shrink-0 bg-[#0A0D14] flex items-center justify-center">
                      {photo?.image ? (
                        <img 
                          src={photo.image} 
                          alt={body.name} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <span className="text-xs">{photo?.icon || '🪐'}</span>
                      )}
                    </div>
                    <div>
                      <span className="font-bold text-xs text-[#E6E8EB] block">{body.name}</span>
                      <span className="text-[9px] text-[#69717E]">
                        {body.isFixed ? 'Central Anchor' : `Mass: ${(body.mass / 1e24).toFixed(2)} Yg`}
                      </span>
                    </div>
                  </div>

                  {!body.isFixed && (
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        removeCelestialBody(body.id);
                      }}
                      className="text-[#69717E] hover:text-[#EF4444] p-1.5 rounded-lg hover:bg-[#EF4444]/15 transition-colors"
                      title="Remove Body"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {showForgeModal && <PlanetCreatorModal isOpen={showForgeModal} onClose={() => setShowForgeModal(false)} />}

      {/* HOW ORBITS WORK (INTERACTIVE EXPLAINER GUIDE MODAL) */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#090A0D]/80 backdrop-blur-sm p-4">
          <div className="bg-[#161B26] border border-[#252B36] rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-[#252B36] pb-3">
              <div className="flex items-center gap-2 text-[#38BDF8]">
                <HelpCircle className="w-5 h-5" />
                <h3 className="font-bold text-sm text-[#E6E8EB]">How Orbital Mechanics Work (Plain English Guide)</h3>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="text-[#A4ABB6] hover:text-[#E6E8EB] p-1 rounded-lg hover:bg-[#252B36]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#A4ABB6] leading-relaxed">
              <div className="bg-[#0A0D14] p-3 rounded-xl border border-[#252B36] space-y-1">
                <strong className="text-[#38BDF8] block font-bold">1. What is an Orbit?</strong>
                <p>An orbit is when an object moves sideways so fast that as gravity pulls it down toward the Sun or Earth, the ground curves away beneath it at the exact same rate. It is literally <em>falling around</em> the star forever!</p>
              </div>

              <div className="bg-[#0A0D14] p-3 rounded-xl border border-[#252B36] space-y-1">
                <strong className="text-[#10B981] block font-bold">2. Prograde (Speed Up) vs Retrograde (Slow Down)</strong>
                <p><strong>• Prograde (Speeding Up):</strong> When you fire thrusters in the direction of motion, you add energy. This pushes the <em>opposite side</em> of your orbit outward, raising your peak (Apoapsis).</p>
                <p><strong>• Retrograde (Slowing Down):</strong> When you fire thrusters against your motion, you remove energy. This drops the opposite side of your orbit lower (Periapsis).</p>
              </div>

              <div className="bg-[#0A0D14] p-3 rounded-xl border border-[#252B36] space-y-1">
                <strong className="text-[#FBBF24] block font-bold">3. Apoapsis ($Ap$) and Periapsis ($Pe$)</strong>
                <p><strong>• $Ap$ (Apoapsis):</strong> The highest / farthest point in an elliptical orbit.</p>
                <p><strong>• $Pe$ (Periapsis):</strong> The lowest / closest point in an elliptical orbit.</p>
              </div>

              <div className="bg-[#0A0D14] p-3 rounded-xl border border-[#252B36] space-y-1">
                <strong className="text-[#E6B84D] block font-bold">4. Hohmann Transfer Arc</strong>
                <p>To travel from Earth to Mars, you fire a prograde burn at Earth to stretch your Apoapsis all the way out to Mars's orbital path!</p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowGuideModal(false)}
                className="px-4 py-2 rounded-xl bg-[#38BDF8] text-[#090A0D] font-bold text-xs hover:bg-[#38BDF8]/90"
              >
                Got It, Let's Fly!
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
