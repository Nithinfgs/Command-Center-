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
  RotateCw 
} from 'lucide-react';
import { useSimulation } from '../../context/SimulationContext';
import { CELESTIAL_PRESETS, calculateOrbitalElements } from '../../physics/n-body';
import { PlanetCreatorModal } from './PlanetCreatorModal';

export const CelestialControls: React.FC = () => {
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

    // Tangent direction in XZ plane
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
    // Boost by 1.25x to send on an elliptical transfer arc to higher orbit
    applyProgradeBurn(1.25);
  };

  return (
    <aside className="w-[320px] bg-[#121620] border-r border-[#252B36] flex flex-col h-full select-none text-xs shrink-0 z-20 font-mono-num">
      {/* Header */}
      <div className="p-3 border-b border-[#252B36] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Orbit className="w-4 h-4 text-[#FF8A1F]" />
          <h2 className="font-semibold text-[#E6E8EB] text-xs tracking-tight uppercase">Orbital Mechanics</h2>
        </div>
        <span className="text-[10px] text-[#38BDF8] bg-[#38BDF8]/10 px-2 py-0.5 rounded font-medium">
          N-Body Gravitation
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3.5">
        {/* Time Control & Speed */}
        <div className="bg-[#181D28] border border-[#252B36] rounded-xl p-3 space-y-2.5 shadow-md">
          <div className="flex items-center justify-between text-xs font-medium">
            <span className="text-[#A4ABB6]">Orbital Time Warp</span>
            <span className="text-[#FF8A1F] font-bold">{timeWarp}x</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsCelestialPaused(!isCelestialPaused)}
              className={`p-2 rounded-lg font-medium border transition-colors flex-1 flex items-center justify-center gap-1.5 ${
                isCelestialPaused
                  ? 'bg-[#E6B84D]/15 border-[#E6B84D]/40 text-[#E6B84D]'
                  : 'bg-[#0A0D14] border-[#252B36] text-[#E6E8EB] hover:bg-[#202736]'
              }`}
            >
              {isCelestialPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              <span>{isCelestialPaused ? 'Resume' : 'Pause'}</span>
            </button>

            {[1, 5, 25, 100].map(warp => (
              <button
                key={warp}
                onClick={() => { setTimeWarp(warp); setIsCelestialPaused(false); }}
                className={`px-2 py-1.5 rounded-lg text-xs border transition-colors font-bold ${
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
        <div className="flex items-center gap-1 bg-[#0A0D14] p-1 rounded-lg border border-[#252B36]">
          <button
            onClick={() => setControlTab('maneuvers')}
            className={`flex-1 py-1.5 rounded-md text-[11px] font-semibold transition-all flex items-center justify-center gap-1 ${
              controlTab === 'maneuvers'
                ? 'bg-[#38BDF8] text-[#090A0D] shadow-md font-bold'
                : 'text-[#A4ABB6] hover:text-[#E6E8EB]'
            }`}
          >
            <Zap className="w-3 h-3" />
            <span>Maneuvers & Presets</span>
          </button>

          <button
            onClick={() => setControlTab('telemetry')}
            className={`flex-1 py-1.5 rounded-md text-[11px] font-semibold transition-all flex items-center justify-center gap-1 ${
              controlTab === 'telemetry'
                ? 'bg-[#FF8A1F] text-[#090A0D] shadow-md font-bold'
                : 'text-[#A4ABB6] hover:text-[#E6E8EB]'
            }`}
          >
            <Activity className="w-3 h-3" />
            <span>Astrodynamics</span>
          </button>
        </div>

        {/* TAB 1: ONE-CLICK ORBITAL MANEUVERS & PRESETS */}
        {controlTab === 'maneuvers' && (
          <div className="space-y-3">
            {/* Active Selected Body Actions */}
            {selectedBody && !selectedBody.isFixed && (
              <div className="bg-[#181D28] border border-[#252B36] rounded-xl p-3 space-y-2.5 shadow-md">
                <div className="flex items-center justify-between pb-1.5 border-b border-[#252B36]">
                  <span className="font-semibold text-[#E6E8EB] flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selectedBody.color }} />
                    <span>{selectedBody.name}</span>
                  </span>
                  <span className="text-[10px] text-[#38BDF8] font-bold">Orbit Active</span>
                </div>

                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  <button
                    onClick={() => applyProgradeBurn(1.15)}
                    className="p-2 rounded-lg bg-[#0A0D14] border border-[#252B36] hover:border-[#10B981] hover:text-[#10B981] text-[#E6E8EB] flex items-center gap-1.5 transition-colors"
                    title="Burn Prograde: Raise Apoapsis (+15% speed)"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5 text-[#10B981]" />
                    <span>Prograde (+15%)</span>
                  </button>

                  <button
                    onClick={() => applyProgradeBurn(0.85)}
                    className="p-2 rounded-lg bg-[#0A0D14] border border-[#252B36] hover:border-[#EF4444] hover:text-[#EF4444] text-[#E6E8EB] flex items-center gap-1.5 transition-colors"
                    title="Burn Retrograde: Lower Periapsis (-15% speed)"
                  >
                    <ArrowDownRight className="w-3.5 h-3.5 text-[#EF4444]" />
                    <span>Retrograde (-15%)</span>
                  </button>

                  <button
                    onClick={circularizeOrbit}
                    className="p-2 rounded-lg bg-[#0A0D14] border border-[#252B36] hover:border-[#38BDF8] hover:text-[#38BDF8] text-[#E6E8EB] flex items-center gap-1.5 transition-colors"
                    title="Circularize: Equalize orbit velocity (e = 0)"
                  >
                    <RotateCw className="w-3.5 h-3.5 text-[#38BDF8]" />
                    <span>Circularize (e=0)</span>
                  </button>

                  <button
                    onClick={applyHohmannTransfer}
                    className="p-2 rounded-lg bg-[#0A0D14] border border-[#252B36] hover:border-[#FBBF24] hover:text-[#FBBF24] text-[#E6E8EB] flex items-center gap-1.5 transition-colors"
                    title="Hohmann Transfer Arc: Expand to outer planetary orbit"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#FBBF24]" />
                    <span>Hohmann Arc</span>
                  </button>
                </div>
              </div>
            )}

            {/* Scenario Presets Selector */}
            <div className="bg-[#181D28] border border-[#252B36] rounded-xl p-3 space-y-2 shadow-md">
              <label className="text-[#69717E] text-[10px] font-semibold uppercase tracking-wider block">
                Astrophysical Scenarios
              </label>
              <div className="space-y-1.5">
                {CELESTIAL_PRESETS.map(preset => (
                  <button
                    key={preset.id}
                    onClick={() => loadCelestialPreset(preset.id)}
                    className="w-full text-left p-2 rounded-lg bg-[#0A0D14] border border-[#252B36] hover:bg-[#202736] hover:border-[#38BDF8] transition-all"
                  >
                    <span className="font-semibold text-[#E6E8EB] block text-xs">{preset.name}</span>
                    <span className="text-[10px] text-[#69717E] line-clamp-1 mt-0.5">{preset.description}</span>
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
              <div className="bg-[#181D28] border border-[#252B36] rounded-xl p-3 space-y-2 shadow-md">
                <div className="flex items-center justify-between border-b border-[#252B36] pb-1.5">
                  <span className="text-[#FF8A1F] font-semibold text-xs">Keplerian Elements</span>
                  <span className="text-[10px] text-[#69717E]">vs {primaryBody.name}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                  <div className="bg-[#0A0D14] p-1.5 rounded border border-[#252B36]">
                    <span className="text-[#69717E] block text-[9px] uppercase">Semi-Major Axis (a)</span>
                    <strong className="text-[#E6E8EB] text-xs">{(orbital.semiMajorAxis * 0.001).toFixed(1)}k km</strong>
                  </div>

                  <div className="bg-[#0A0D14] p-1.5 rounded border border-[#252B36]">
                    <span className="text-[#69717E] block text-[9px] uppercase">Eccentricity (e)</span>
                    <strong className={`text-xs ${orbital.eccentricity < 0.1 ? 'text-[#10B981]' : orbital.eccentricity < 0.8 ? 'text-[#FBBF24]' : 'text-[#EF4444]'}`}>
                      {orbital.eccentricity.toFixed(3)}
                    </strong>
                  </div>

                  <div className="bg-[#0A0D14] p-1.5 rounded border border-[#252B36]">
                    <span className="text-[#69717E] block text-[9px] uppercase">Apoapsis (Ap)</span>
                    <strong className="text-[#F59E0B] text-xs">{(orbital.apoapsis * 0.001).toFixed(1)}k km</strong>
                  </div>

                  <div className="bg-[#0A0D14] p-1.5 rounded border border-[#252B36]">
                    <span className="text-[#69717E] block text-[9px] uppercase">Periapsis (Pe)</span>
                    <strong className="text-[#38BDF8] text-xs">{(orbital.periapsis * 0.001).toFixed(1)}k km</strong>
                  </div>

                  <div className="bg-[#0A0D14] p-1.5 rounded border border-[#252B36] col-span-2">
                    <span className="text-[#69717E] block text-[9px] uppercase">Orbital Period (T)</span>
                    <strong className="text-[#34D399] text-xs">{orbital.orbitalPeriod.toFixed(1)} seconds (Simulated)</strong>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-[#181D28] border border-[#252B36] rounded-xl p-3 text-center text-[#69717E] text-[11px]">
                Select an orbiting satellite or planet to calculate Keplerian parameters.
              </div>
            )}
          </div>
        )}

        {/* Display Toggles */}
        <div className="bg-[#181D28] border border-[#252B36] rounded-xl p-3 space-y-2 shadow-md">
          <label className="text-[#69717E] text-[10px] font-semibold uppercase tracking-wider block">
            Visual Overlays
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => setShowSpacetimeGrid(!showSpacetimeGrid)}
              className={`p-2 rounded-lg border text-center transition-colors font-medium flex items-center justify-center gap-1 ${
                showSpacetimeGrid
                  ? 'bg-[#38BDF8]/15 border-[#38BDF8] text-[#38BDF8]'
                  : 'bg-[#0A0D14] border-[#252B36] text-[#A4ABB6] hover:text-[#E6E8EB]'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Gravity Grid</span>
            </button>

            <button
              onClick={() => setShowOrbitalTrails(!showOrbitalTrails)}
              className={`p-2 rounded-lg border text-center transition-colors font-medium flex items-center justify-center gap-1 ${
                showOrbitalTrails
                  ? 'bg-[#10B981]/15 border-[#10B981] text-[#10B981]'
                  : 'bg-[#0A0D14] border-[#252B36] text-[#A4ABB6] hover:text-[#E6E8EB]'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Orbit Trails</span>
            </button>
          </div>
        </div>

        {/* Celestial Fleet List */}
        <div className="bg-[#181D28] border border-[#252B36] rounded-xl p-3 space-y-2 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[#69717E] text-[10px] font-semibold uppercase tracking-wider">
              Tracked Bodies ({celestialBodies.length})
            </span>
            <button
              onClick={() => setShowForgeModal(true)}
              className="p-1 rounded bg-[#38BDF8] text-[#090A0D] hover:bg-[#38BDF8]/80 font-bold"
              title="Spawn Custom Planet / Star"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
            {celestialBodies.map(body => {
              const isSelected = body.id === selectedBodyId;
              return (
                <div
                  key={body.id}
                  onClick={() => setSelectedBodyId(body.id)}
                  className={`flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#1B283D] border-[#38BDF8] text-[#E6E8EB]'
                      : 'bg-[#0A0D14] border-[#252B36] text-[#A4ABB6] hover:bg-[#151C28]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: body.color }} />
                    <span className="font-semibold text-xs text-[#E6E8EB]">{body.name}</span>
                  </div>

                  {!body.isFixed && (
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        removeCelestialBody(body.id);
                      }}
                      className="text-[#69717E] hover:text-[#EF4444] p-1 transition-colors"
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

      <PlanetCreatorModal isOpen={showForgeModal} onClose={() => setShowForgeModal(false)} />
    </aside>
  );
};
