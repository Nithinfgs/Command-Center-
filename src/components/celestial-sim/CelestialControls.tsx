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
    <div className="w-84 bg-[#0c121d] border-r border-[#1e293b] flex flex-col h-full select-none text-xs font-mono">
      <div className="p-3 border-b border-[#1e293b] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Orbit className="w-4 h-4 text-[#38bdf8]" />
          <span className="font-bold text-slate-200 uppercase tracking-wider">N-BODY GRAVITATION</span>
        </div>
        <span className="text-[10px] text-cyan-400 bg-cyan-950/60 border border-cyan-500/40 px-2 py-0.5 rounded font-semibold">
          RK4 ACTIVE
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        <div className="bg-[#090d16] border border-[#1e293b] rounded p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-bold uppercase text-[10px]">TIME ACCELERATION</span>
            <span className="text-[#38bdf8] font-bold">{timeWarp}x WARP</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsCelestialPaused(!isCelestialPaused)}
              className={`p-2 rounded font-bold border transition-colors flex-1 flex items-center justify-center gap-1.5 ${
                isCelestialPaused
                  ? 'bg-amber-950/70 border-amber-500 text-amber-300'
                  : 'bg-[#182334] border-[#1e293b] text-slate-300 hover:bg-[#22324b]'
              }`}
            >
              {isCelestialPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              <span>{isCelestialPaused ? 'RESUME' : 'PAUSE'}</span>
            </button>

            {[1, 5, 25, 100].map(warp => (
              <button
                key={warp}
                onClick={() => { setTimeWarp(warp); setIsCelestialPaused(false); }}
                className={`px-2 py-2 rounded font-bold text-[10px] border transition-colors ${
                  timeWarp === warp && !isCelestialPaused
                    ? 'bg-[#38bdf8] text-slate-950 border-[#38bdf8]'
                    : 'bg-[#090d16] border-[#1e293b] text-slate-400 hover:text-slate-200'
                }`}
              >
                {warp}x
              </button>
            ))}
          </div>
        </div>

        <div className="bg-[#090d16] border border-[#1e293b] rounded p-3 space-y-2">
          <label className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block mb-1">
            RELATIVISTIC DIAGNOSTICS
          </label>
          <button
            onClick={() => setShowSpacetimeGrid(!showSpacetimeGrid)}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded border transition-colors ${
              showSpacetimeGrid
                ? 'bg-[#182334] border-[#38bdf8] text-[#38bdf8]'
                : 'bg-[#0c121d] border-[#1e293b] text-slate-400'
            }`}
          >
            <div className="flex items-center gap-2">
              <Grid className="w-3.5 h-3.5" />
              <span>3D Spacetime Metric Grid</span>
            </div>
            <span className="text-[10px] font-bold">{showSpacetimeGrid ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={() => setShowOrbitalTrails(!showOrbitalTrails)}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded border transition-colors ${
              showOrbitalTrails
                ? 'bg-[#182334] border-[#38bdf8] text-[#38bdf8]'
                : 'bg-[#0c121d] border-[#1e293b] text-slate-400'
            }`}
          >
            <div className="flex items-center gap-2">
              <Orbit className="w-3.5 h-3.5" />
              <span>Keplerian Trajectory Trails</span>
            </div>
            <span className="text-[10px] font-bold">{showOrbitalTrails ? 'ON' : 'OFF'}</span>
          </button>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
              BODIES IN SYSTEM ({celestialBodies.length})
            </span>
            <button
              onClick={() => setShowForgeModal(true)}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold text-[10px] transition-colors"
            >
              <Plus className="w-3 h-3" />
              <span>FORGE BODY</span>
            </button>
          </div>

          <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
            {celestialBodies.map(body => {
              const isSelected = selectedBodyId === body.id;
              return (
                <div
                  key={body.id}
                  onClick={() => setSelectedBodyId(body.id)}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded border cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-[#182334] border-[#38bdf8] text-slate-100'
                      : 'bg-[#090d16] border-[#1e293b] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span 
                      className="w-2.5 h-2.5 rounded-full shrink-0" 
                      style={{ backgroundColor: body.color }} 
                    />
                    <span className="font-bold truncate">{body.name}</span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <span className="text-[10px] text-slate-500 uppercase">{body.type.replace('_', ' ')}</span>
                    {!body.isFixed && celestialBodies.length > 2 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeCelestialBody(body.id);
                        }}
                        className="p-0.5 text-slate-500 hover:text-rose-400 ml-1"
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

        {selectedBody && (
          <div className="bg-[#090d16] border border-[#1e293b] rounded p-3 space-y-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-[#1e293b]">
              <span className="font-bold text-slate-200">{selectedBody.name}</span>
              <span className="text-[10px] text-[#38bdf8] uppercase">ORBITAL METRICS</span>
            </div>

            <div className="grid grid-cols-2 gap-1.5 text-[10px]">
              <div className="bg-[#0c121d] p-1.5 rounded border border-[#1e293b]">
                <div className="text-slate-500">MASS</div>
                <div className="text-slate-200 font-bold mt-0.5">{(selectedBody.mass).toExponential(2)} kg</div>
              </div>
              <div className="bg-[#0c121d] p-1.5 rounded border border-[#1e293b]">
                <div className="text-slate-500">RADIUS</div>
                <div className="text-amber-400 font-bold mt-0.5">{selectedBody.radius.toLocaleString()} km</div>
              </div>

              {orbital && (
                <>
                  <div className="bg-[#0c121d] p-1.5 rounded border border-[#1e293b]">
                    <div className="text-slate-500">SEMI-MAJOR (a)</div>
                    <div className="text-[#38bdf8] font-bold mt-0.5">{orbital.semiMajorAxis} AU</div>
                  </div>
                  <div className="bg-[#0c121d] p-1.5 rounded border border-[#1e293b]">
                    <div className="text-slate-500">ECCENTRICITY (e)</div>
                    <div className="text-emerald-400 font-bold mt-0.5">{orbital.eccentricity}</div>
                  </div>
                  <div className="bg-[#0c121d] p-1.5 rounded border border-[#1e293b]">
                    <div className="text-slate-500">VELOCITY</div>
                    <div className="text-cyan-400 font-bold mt-0.5">{orbital.currentSpeed} km/s</div>
                  </div>
                  <div className="bg-[#0c121d] p-1.5 rounded border border-[#1e293b]">
                    <div className="text-slate-500">ESCAPE VEL</div>
                    <div className="text-rose-400 font-bold mt-0.5">{orbital.escapeVelocity} km/s</div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        <div>
          <label className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block mb-1.5">
            CALIBRATED GRAVITATIONAL SYSTEMS
          </label>
          <div className="space-y-1">
            {CELESTIAL_PRESETS.map(preset => (
              <button
                key={preset.id}
                onClick={() => loadCelestialPreset(preset.id)}
                className="w-full text-left px-2.5 py-1.5 rounded bg-[#090d16] hover:bg-[#131b2b] border border-[#1e293b] text-slate-300 text-[11px] truncate transition-colors"
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
    </div>
  );
};
