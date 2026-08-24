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
    <aside className="w-[300px] bg-[#121A26] border-r border-[#1C2938] flex flex-col h-full select-none text-xs shrink-0 z-20">
      <div className="p-3 border-b border-[#1C2938] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Orbit className="w-4 h-4 text-[#38BDF8]" />
          <h2 className="font-semibold text-[#E8EDF2] text-xs tracking-tight">N-Body Gravitation</h2>
        </div>
        <span className="text-[10px] text-[#38BDF8] bg-[#38BDF8]/10 px-2 py-0.5 rounded font-medium">
          RK4 Active
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Time Control */}
        <div className="bg-[#172131]/60 border border-[#263548]/40 rounded-lg p-3 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-medium">
            <span className="text-[#9AA9B8]">Time Warp</span>
            <span className="text-[#38BDF8] font-mono-num font-semibold">{timeWarp}x</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsCelestialPaused(!isCelestialPaused)}
              className={`p-2 rounded-md font-medium border transition-colors flex-1 flex items-center justify-center gap-1.5 ${
                isCelestialPaused
                  ? 'bg-[#FBBF24]/15 border-[#FBBF24]/40 text-[#FBBF24]'
                  : 'bg-[#121A26] border-[#263548] text-[#E8EDF2] hover:bg-[#1B2838]'
              }`}
            >
              {isCelestialPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              <span>{isCelestialPaused ? 'Resume' : 'Pause'}</span>
            </button>

            {[1, 5, 25, 100].map(warp => (
              <button
                key={warp}
                onClick={() => { setTimeWarp(warp); setIsCelestialPaused(false); }}
                className={`px-2 py-1.5 rounded-md font-mono-num text-xs border transition-colors ${
                  timeWarp === warp && !isCelestialPaused
                    ? 'bg-[#38BDF8] text-[#0B0F17] border-[#38BDF8] font-semibold'
                    : 'bg-[#121A26] border-[#263548]/60 text-[#9AA9B8] hover:text-[#E8EDF2]'
                }`}
              >
                {warp}x
              </button>
            ))}
          </div>
        </div>

        {/* Diagnostic Overlays */}
        <div className="bg-[#172131]/60 border border-[#263548]/40 rounded-lg p-3 space-y-2">
          <label className="text-[#64748B] text-[11px] font-semibold uppercase tracking-wider block mb-1">
            Display Diagnostics
          </label>
          <button
            onClick={() => setShowSpacetimeGrid(!showSpacetimeGrid)}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md border transition-colors ${
              showSpacetimeGrid
                ? 'bg-[#1A3040] border-[#38BDF8]/60 text-[#38BDF8]'
                : 'bg-[#121A26] border-[#263548]/40 text-[#9AA9B8]'
            }`}
          >
            <div className="flex items-center gap-2">
              <Grid className="w-3.5 h-3.5" />
              <span>3D Spacetime Grid</span>
            </div>
            <span className="text-[10px] font-medium">{showSpacetimeGrid ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={() => setShowOrbitalTrails(!showOrbitalTrails)}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md border transition-colors ${
              showOrbitalTrails
                ? 'bg-[#1A3040] border-[#38BDF8]/60 text-[#38BDF8]'
                : 'bg-[#121A26] border-[#263548]/40 text-[#9AA9B8]'
            }`}
          >
            <div className="flex items-center gap-2">
              <Orbit className="w-3.5 h-3.5" />
              <span>Keplerian Trails</span>
            </div>
            <span className="text-[10px] font-medium">{showOrbitalTrails ? 'ON' : 'OFF'}</span>
          </button>
        </div>

        {/* Celestial Bodies List */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[#64748B] text-[11px] font-semibold uppercase tracking-wider">
              Bodies in System ({celestialBodies.length})
            </label>
            <button
              onClick={() => setShowForgeModal(true)}
              className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#38BDF8] text-[#0B0F17] font-semibold text-[10px] transition-colors"
            >
              <Plus className="w-3 h-3" />
              <span>Forge Body</span>
            </button>
          </div>

          <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
            {celestialBodies.map(body => {
              const isSelected = selectedBodyId === body.id;
              return (
                <div
                  key={body.id}
                  onClick={() => setSelectedBodyId(body.id)}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-md border cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-[#1A3040] border-[#38BDF8]/60 text-[#E8EDF2]'
                      : 'bg-[#172131] border-[#263548]/40 text-[#9AA9B8] hover:text-[#E8EDF2] hover:bg-[#1B2838]'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span 
                      className="w-2.5 h-2.5 rounded-full shrink-0" 
                      style={{ backgroundColor: body.color }} 
                    />
                    <span className="font-medium truncate">{body.name}</span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <span className="text-[10px] text-[#64748B] capitalize">{body.type.replace('_', ' ')}</span>
                    {!body.isFixed && celestialBodies.length > 2 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeCelestialBody(body.id);
                        }}
                        className="p-0.5 text-[#64748B] hover:text-[#F43F5E] ml-1"
                        title="Delete body"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Body Inspector */}
        {selectedBody && (
          <div className="bg-[#172131]/60 border border-[#263548]/40 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-[#1C2938]">
              <span className="font-semibold text-[#E8EDF2] text-xs">{selectedBody.name}</span>
              <span className="text-[10px] text-[#38BDF8]">Orbital Parameters</span>
            </div>

            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <div className="bg-[#121A26] p-1.5 rounded border border-[#263548]/40">
                <span className="text-[#64748B] block">Mass</span>
                <span className="text-[#E8EDF2] font-mono-num font-medium text-xs mt-0.5 block">{(selectedBody.mass).toExponential(2)} kg</span>
              </div>
              <div className="bg-[#121A26] p-1.5 rounded border border-[#263548]/40">
                <span className="text-[#64748B] block">Radius</span>
                <span className="text-[#FBBF24] font-mono-num font-medium text-xs mt-0.5 block">{selectedBody.radius.toLocaleString()} km</span>
              </div>

              {orbital && (
                <>
                  <div className="bg-[#121A26] p-1.5 rounded border border-[#263548]/40">
                    <span className="text-[#64748B] block">Semi-Major (a)</span>
                    <span className="text-[#38BDF8] font-mono-num font-medium text-xs mt-0.5 block">{orbital.semiMajorAxis} AU</span>
                  </div>
                  <div className="bg-[#121A26] p-1.5 rounded border border-[#263548]/40">
                    <span className="text-[#64748B] block">Eccentricity (e)</span>
                    <span className="text-[#34D399] font-mono-num font-medium text-xs mt-0.5 block">{orbital.eccentricity}</span>
                  </div>
                  <div className="bg-[#121A26] p-1.5 rounded border border-[#263548]/40">
                    <span className="text-[#64748B] block">Velocity</span>
                    <span className="text-[#E8EDF2] font-mono-num font-medium text-xs mt-0.5 block">{orbital.currentSpeed} km/s</span>
                  </div>
                  <div className="bg-[#121A26] p-1.5 rounded border border-[#263548]/40">
                    <span className="text-[#64748B] block">Escape Velocity</span>
                    <span className="text-[#F43F5E] font-mono-num font-medium text-xs mt-0.5 block">{orbital.escapeVelocity} km/s</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* System Presets */}
        <div className="space-y-1.5">
          <label className="text-[#64748B] text-[11px] font-semibold uppercase tracking-wider block">
            Calibrated Systems
          </label>
          <div className="space-y-1">
            {CELESTIAL_PRESETS.map(preset => (
              <button
                key={preset.id}
                onClick={() => loadCelestialPreset(preset.id)}
                className="w-full text-left px-2.5 py-1.5 rounded-md bg-[#172131] hover:bg-[#1B2838] border border-[#263548]/40 text-[#9AA9B8] hover:text-[#E8EDF2] text-xs truncate transition-colors"
              >
                {preset.name}
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
