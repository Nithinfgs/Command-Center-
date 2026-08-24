import React, { useState } from 'react';
import { 
  Orbit, 
  Play, 
  Pause, 
  Plus, 
  Trash2, 
  Grid
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
    removeCelestialBody
  } = useSimulation();

  const [showForgeModal, setShowForgeModal] = useState(false);

  const selectedBody = celestialBodies.find(b => b.id === selectedBodyId);
  const primaryBody = celestialBodies.find(b => b.isFixed || b.type === 'star' || b.type === 'black_hole') || celestialBodies[0];
  const orbital = selectedBody && primaryBody && selectedBody.id !== primaryBody.id
    ? calculateOrbitalElements(selectedBody, primaryBody)
    : null;

  return (
    <aside className="w-[300px] bg-[#151820] border-r border-[#252B36] flex flex-col h-full select-none text-xs shrink-0 z-20">
      <div className="p-3 border-b border-[#252B36] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Orbit className="w-4 h-4 text-[#FF8A1F]" />
          <h2 className="font-semibold text-[#E6E8EB] text-xs tracking-tight uppercase">Orbital Mechanics</h2>
        </div>
        <span className="text-[10px] text-[#79AFC1] bg-[#79AFC1]/10 px-2 py-0.5 rounded font-mono-num font-medium">
          RK4 Integrator
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Time Control */}
        <div className="bg-[#1B1F28]/70 border border-[#252B36] rounded-lg p-3 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-medium">
            <span className="text-[#A4ABB6]">Time Warp</span>
            <span className="text-[#FF8A1F] font-mono-num font-semibold">{timeWarp}x</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsCelestialPaused(!isCelestialPaused)}
              className={`p-2 rounded font-medium border transition-colors flex-1 flex items-center justify-center gap-1.5 ${
                isCelestialPaused
                  ? 'bg-[#E6B84D]/15 border-[#E6B84D]/40 text-[#E6B84D]'
                  : 'bg-[#0E1015] border-[#252B36] text-[#E6E8EB] hover:bg-[#222733]'
              }`}
            >
              {isCelestialPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              <span>{isCelestialPaused ? 'Resume' : 'Pause'}</span>
            </button>

            {[1, 5, 25, 100].map(warp => (
              <button
                key={warp}
                onClick={() => { setTimeWarp(warp); setIsCelestialPaused(false); }}
                className={`px-2 py-1.5 rounded font-mono-num text-xs border transition-colors ${
                  timeWarp === warp && !isCelestialPaused
                    ? 'bg-[#FF8A1F] text-[#090A0D] border-[#FF8A1F] font-bold'
                    : 'bg-[#0E1015] border-[#252B36] text-[#A4ABB6] hover:text-[#E6E8EB]'
                }`}
              >
                {warp}x
              </button>
            ))}
          </div>
        </div>

        {/* Diagnostic Overlays */}
        <div className="bg-[#1B1F28]/70 border border-[#252B36] rounded-lg p-3 space-y-2">
          <label className="text-[#69717E] text-[11px] font-semibold uppercase tracking-wider block mb-1">
            Display Diagnostics
          </label>
          <button
            onClick={() => setShowSpacetimeGrid(!showSpacetimeGrid)}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded border transition-colors ${
              showSpacetimeGrid
                ? 'bg-[#222733] border-[#FF8A1F] text-[#E6E8EB] font-medium'
                : 'bg-[#0E1015] border-[#252B36] text-[#A4ABB6] hover:text-[#E6E8EB]'
            }`}
          >
            <div className="flex items-center gap-2">
              <Grid className="w-3.5 h-3.5 text-[#79AFC1]" />
              <span>Spacetime Curvature Grid</span>
            </div>
            <span className={`text-[10px] font-mono-num ${showSpacetimeGrid ? 'text-[#FF8A1F]' : 'text-[#69717E]'}`}>
              {showSpacetimeGrid ? 'ON' : 'OFF'}
            </span>
          </button>

          <button
            onClick={() => setShowOrbitalTrails(!showOrbitalTrails)}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded border transition-colors ${
              showOrbitalTrails
                ? 'bg-[#222733] border-[#FF8A1F] text-[#E6E8EB] font-medium'
                : 'bg-[#0E1015] border-[#252B36] text-[#A4ABB6] hover:text-[#E6E8EB]'
            }`}
          >
            <div className="flex items-center gap-2">
              <Orbit className="w-3.5 h-3.5 text-[#79AFC1]" />
              <span>Keplerian Trajectory Trails</span>
            </div>
            <span className={`text-[10px] font-mono-num ${showOrbitalTrails ? 'text-[#FF8A1F]' : 'text-[#69717E]'}`}>
              {showOrbitalTrails ? 'ON' : 'OFF'}
            </span>
          </button>
        </div>

        {/* Selected Body Inspector */}
        {selectedBody && (
          <div className="bg-[#1B1F28] border border-[#252B36] rounded-lg p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#E6E8EB] text-xs uppercase">{selectedBody.name}</span>
              <span className="text-[10px] text-[#FF8A1F] capitalize font-medium">{selectedBody.type.replace('_', ' ')}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] text-[#A4ABB6]">
              <div className="bg-[#0E1015] p-2 rounded border border-[#252B36]">
                <span className="text-[#69717E] block text-[10px] uppercase">Mass</span>
                <span className="text-[#E6E8EB] font-mono-num font-semibold text-xs mt-0.5 block">
                  {selectedBody.mass.toExponential(2)} kg
                </span>
              </div>
              <div className="bg-[#0E1015] p-2 rounded border border-[#252B36]">
                <span className="text-[#69717E] block text-[10px] uppercase">Radius</span>
                <span className="text-[#E6E8EB] font-mono-num font-semibold text-xs mt-0.5 block">
                  {selectedBody.radius.toLocaleString()} km
                </span>
              </div>
            </div>

            {orbital && (
              <div className="space-y-1.5 pt-2 border-t border-[#252B36]">
                <div className="text-[10px] text-[#69717E] uppercase tracking-wider font-semibold">Keplerian Elements</div>
                <div className="grid grid-cols-2 gap-1.5 text-[10.5px]">
                  <div className="flex justify-between">
                    <span className="text-[#69717E]">Eccentricity:</span>
                    <span className="text-[#79AFC1] font-mono-num">{orbital.eccentricity.toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#69717E]">Semi-Major:</span>
                    <span className="text-[#E6E8EB] font-mono-num">{Math.round(orbital.semiMajorAxis).toLocaleString()} km</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#69717E]">Apoapsis:</span>
                    <span className="text-[#79AFC1] font-mono-num">{Math.round(orbital.apoapsis).toLocaleString()} km</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#69717E]">Periapsis:</span>
                    <span className="text-[#79AFC1] font-mono-num">{Math.round(orbital.periapsis).toLocaleString()} km</span>
                  </div>
                </div>
              </div>
            )}

            {!selectedBody.isFixed && (
              <button
                onClick={() => removeCelestialBody(selectedBody.id)}
                className="w-full py-1.5 rounded bg-[#D95757]/10 hover:bg-[#D95757] text-[#D95757] hover:text-[#090A0D] border border-[#D95757]/30 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 mt-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Body</span>
              </button>
            )}
          </div>
        )}

        {/* Celestial Body List */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[#69717E] text-[11px] font-semibold uppercase tracking-wider block">
              Active Bodies ({celestialBodies.length})
            </label>
            <button
              onClick={() => setShowForgeModal(true)}
              className="text-[#FF8A1F] hover:text-[#FFA24A] text-xs font-medium flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Forge Body</span>
            </button>
          </div>

          <div className="space-y-1 max-h-44 overflow-y-auto pr-1">
            {celestialBodies.map(body => (
              <button
                key={body.id}
                onClick={() => setSelectedBodyId(body.id)}
                className={`w-full flex items-center justify-between p-2 rounded border transition-colors ${
                  selectedBodyId === body.id
                    ? 'bg-[#222733] border-[#FF8A1F] text-[#E6E8EB] font-medium'
                    : 'bg-[#0E1015] border-[#252B36] text-[#A4ABB6] hover:text-[#E6E8EB] hover:bg-[#1B1F28]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: body.color }} />
                  <span className="text-xs">{body.name}</span>
                </div>
                <span className="text-[10px] text-[#69717E] font-mono-num capitalize">{body.type}</span>
              </button>
            ))}
          </div>
        </div>

        {/* System Presets */}
        <div className="space-y-1.5">
          <label className="text-[#69717E] text-[11px] font-semibold uppercase tracking-wider block">
            System Architecture Presets
          </label>
          <div className="space-y-1">
            {CELESTIAL_PRESETS.map(preset => (
              <button
                key={preset.id}
                onClick={() => loadCelestialPreset(preset.id)}
                className="w-full text-left p-2 rounded bg-[#1B1F28]/60 hover:bg-[#222733] border border-[#252B36] text-[#A4ABB6] hover:text-[#E6E8EB] transition-colors"
              >
                <div className="font-medium text-xs text-[#E6E8EB]">{preset.name}</div>
                <div className="text-[11px] text-[#69717E] line-clamp-1 mt-0.5">{preset.description}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <PlanetCreatorModal
        isOpen={showForgeModal}
        onClose={() => setShowForgeModal(false)}
      />
    </aside>
  );
};
