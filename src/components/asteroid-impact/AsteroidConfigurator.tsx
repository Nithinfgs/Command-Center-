import React from 'react';
import { Target, Bomb } from 'lucide-react';
import { useSimulation } from '../../context/SimulationContext';
import { TARGET_SURFACES, IMPACT_PRESETS } from '../../physics/impact-physics';
import type { AsteroidComposition } from '../../types';

export const AsteroidConfigurator: React.FC = () => {
  const {
    asteroidConfig,
    setAsteroidConfig,
    triggerImpactSimulation
  } = useSimulation();

  return (
    <div className="w-84 bg-[#0c121d] border-r border-[#1e293b] flex flex-col h-full select-none text-xs font-mono">
      <div className="p-3 border-b border-[#1e293b] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-[#38bdf8]" />
          <span className="font-bold text-slate-200 uppercase tracking-wider">IMPACT DYNAMICS LAB</span>
        </div>
        <span className="text-[10px] text-rose-400 bg-rose-950/60 border border-rose-500/40 px-2 py-0.5 rounded font-semibold">
          TARGET LOCKED
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        <div>
          <button
            onClick={triggerImpactSimulation}
            className="w-full flex items-center justify-center gap-2 py-3 rounded bg-rose-600 hover:bg-rose-500 text-white font-black text-sm uppercase tracking-wider shadow-lg transition-all active:scale-[0.98]"
          >
            <Bomb className="w-4 h-4" />
            <span>SIMULATE KINETIC IMPACT</span>
          </button>
        </div>

        <div className="bg-[#090d16] border border-[#1e293b] rounded p-3 space-y-3">
          <label className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
            BOLIDE SPECIFICATIONS
          </label>

          <div>
            <div className="flex items-center justify-between text-slate-300 font-bold mb-1">
              <span>ASTEROID DIAMETER</span>
              <span className="text-[#38bdf8] font-bold text-sm">
                {asteroidConfig.diameter >= 1000 ? `${(asteroidConfig.diameter / 1000).toFixed(1)} km` : `${asteroidConfig.diameter} m`}
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="20000"
              step="10"
              value={asteroidConfig.diameter}
              onChange={e => setAsteroidConfig({ diameter: parseInt(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>10m (Meteor)</span>
              <span>1km (City)</span>
              <span>20km (Extinction)</span>
            </div>
          </div>

          <div className="border-t border-[#1e293b] pt-2.5">
            <label className="text-slate-400 text-[10px] uppercase font-bold block mb-1">
              COMPOSITION & MINERALOGY
            </label>
            <select
              value={asteroidConfig.composition}
              onChange={e => setAsteroidConfig({ composition: e.target.value as AsteroidComposition })}
              className="w-full bg-[#0c121d] border border-[#1e293b] rounded px-3 py-1.5 text-slate-200 focus:outline-none focus:border-[#38bdf8]"
            >
              <option value="rubble">Porous Rubble Pile (1,500 kg/m³)</option>
              <option value="carbonaceous">Carbonaceous Chondrite (2,200 kg/m³)</option>
              <option value="silicate">Dense Silicate Rock (3,000 kg/m³)</option>
              <option value="iron_nickel">Metallic Iron-Nickel Core (7,800 kg/m³)</option>
              <option value="cometary_ice">Cometary Volatile Ice (1,000 kg/m³)</option>
            </select>
          </div>
        </div>

        <div className="bg-[#090d16] border border-[#1e293b] rounded p-3 space-y-3">
          <label className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
            ENTRY KINEMATICS
          </label>

          <div>
            <div className="flex items-center justify-between text-slate-300 font-bold mb-1">
              <span>IMPACT VELOCITY</span>
              <span className="text-amber-400 font-bold">{asteroidConfig.velocity} km/s</span>
            </div>
            <input
              type="range"
              min="11"
              max="72"
              step="1"
              value={asteroidConfig.velocity}
              onChange={e => setAsteroidConfig({ velocity: parseInt(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>11.2 km/s (Min Escape)</span>
              <span>30 km/s</span>
              <span>72 km/s (Retrograde)</span>
            </div>
          </div>

          <div className="border-t border-[#1e293b] pt-2.5">
            <div className="flex items-center justify-between text-slate-300 font-bold mb-1">
              <span>ENTRY ANGLE (\theta)</span>
              <span className="text-cyan-400 font-bold">{asteroidConfig.entryAngle}°</span>
            </div>
            <input
              type="range"
              min="10"
              max="90"
              step="5"
              value={asteroidConfig.entryAngle}
              onChange={e => setAsteroidConfig({ entryAngle: parseInt(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>10° Grazing Entry</span>
              <span>45° Typical</span>
              <span>90° Direct Vertical</span>
            </div>
          </div>

          <div className="border-t border-[#1e293b] pt-2.5">
            <label className="text-slate-400 text-[10px] uppercase font-bold block mb-1">
              TARGET CRUSTAL GEOLOGY
            </label>
            <select
              value={asteroidConfig.targetSurfaceType}
              onChange={e => setAsteroidConfig({ targetSurfaceType: e.target.value as any })}
              className="w-full bg-[#0c121d] border border-[#1e293b] rounded px-3 py-1.5 text-slate-200 focus:outline-none focus:border-[#38bdf8]"
            >
              {Object.entries(TARGET_SURFACES).map(([key, val]) => (
                <option key={key} value={key}>{val.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block mb-1.5">
            HISTORICAL IMPACT PRESETS
          </label>
          <div className="space-y-1">
            {IMPACT_PRESETS.map(preset => (
              <button
                key={preset.id}
                onClick={() => {
                  setAsteroidConfig({
                    diameter: preset.diameter,
                    composition: preset.composition,
                    velocity: preset.velocity,
                    entryAngle: preset.entryAngle,
                    targetSurfaceType: preset.targetSurfaceType
                  });
                }}
                className="w-full text-left p-2 rounded bg-[#090d16] hover:bg-[#131b2b] border border-[#1e293b] text-slate-300 transition-colors"
              >
                <div className="font-bold text-slate-200">{preset.name}</div>
                <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{preset.description}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
