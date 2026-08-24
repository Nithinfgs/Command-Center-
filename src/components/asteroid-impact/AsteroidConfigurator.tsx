import React from 'react';
import { Target, Play } from 'lucide-react';
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
    <aside className="w-[300px] bg-[#121A26] border-r border-[#1C2938] flex flex-col h-full select-none text-xs shrink-0 z-20">
      <div className="p-3 border-b border-[#1C2938] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-[#38BDF8]" />
          <h2 className="font-semibold text-[#E8EDF2] text-xs tracking-tight">Kinetic Impact Dynamics</h2>
        </div>
        <span className="text-[10px] text-[#F43F5E] bg-[#F43F5E]/10 px-2 py-0.5 rounded font-medium">
          Ready
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Simulate Action Button */}
        <div>
          <button
            onClick={triggerImpactSimulation}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md bg-[#F43F5E] hover:bg-[#e12d4d] text-[#0B0F17] font-semibold text-xs transition-all active:scale-98"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Simulate Kinetic Impact</span>
          </button>
        </div>

        {/* Bolide Specifications */}
        <div className="bg-[#172131]/60 border border-[#263548]/40 rounded-lg p-3 space-y-3">
          <label className="text-[#64748B] text-[11px] font-semibold uppercase tracking-wider block">
            Bolide Geometry & Mass
          </label>

          <div>
            <div className="flex items-center justify-between text-xs font-medium mb-1">
              <span className="text-[#9AA9B8]">Impact Diameter</span>
              <span className="text-[#38BDF8] font-mono-num font-semibold">
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
            <div className="flex justify-between text-[10px] text-[#64748B] mt-1">
              <span>10m (Meteor)</span>
              <span>1km (Regional)</span>
              <span>20km (Extinction)</span>
            </div>
          </div>

          <div className="border-t border-[#1C2938] pt-2.5">
            <label className="text-[#9AA9B8] text-xs font-medium block mb-1">
              Composition & Mineralogy
            </label>
            <select
              value={asteroidConfig.composition}
              onChange={e => setAsteroidConfig({ composition: e.target.value as AsteroidComposition })}
              className="w-full bg-[#121A26] border border-[#263548] rounded-md px-2.5 py-1.5 text-xs text-[#E8EDF2] focus:outline-none focus:border-[#38BDF8]"
            >
              <option value="rubble">Porous Rubble Pile (1,500 kg/m³)</option>
              <option value="carbonaceous">Carbonaceous Chondrite (2,200 kg/m³)</option>
              <option value="silicate">Dense Silicate Rock (3,000 kg/m³)</option>
              <option value="iron_nickel">Metallic Iron-Nickel Core (7,800 kg/m³)</option>
              <option value="cometary_ice">Cometary Volatile Ice (1,000 kg/m³)</option>
            </select>
          </div>
        </div>

        {/* Kinematics */}
        <div className="bg-[#172131]/60 border border-[#263548]/40 rounded-lg p-3 space-y-3">
          <label className="text-[#64748B] text-[11px] font-semibold uppercase tracking-wider block">
            Kinematic Entry State
          </label>

          <div>
            <div className="flex items-center justify-between text-xs font-medium mb-1">
              <span className="text-[#9AA9B8]">Impact Velocity</span>
              <span className="text-[#FBBF24] font-mono-num font-semibold">{asteroidConfig.velocity} km/s</span>
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
            <div className="flex justify-between text-[10px] text-[#64748B] mt-1">
              <span>11.2 km/s (Min Escape)</span>
              <span>30 km/s</span>
              <span>72 km/s</span>
            </div>
          </div>

          <div className="border-t border-[#1C2938] pt-2.5">
            <div className="flex items-center justify-between text-xs font-medium mb-1">
              <span className="text-[#9AA9B8]">Entry Angle (θ)</span>
              <span className="text-[#38BDF8] font-mono-num font-semibold">{asteroidConfig.entryAngle}°</span>
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
            <div className="flex justify-between text-[10px] text-[#64748B] mt-1">
              <span>10° Grazing</span>
              <span>45° Typical</span>
              <span>90° Vertical</span>
            </div>
          </div>

          <div className="border-t border-[#1C2938] pt-2.5">
            <label className="text-[#9AA9B8] text-xs font-medium block mb-1">
              Target Crustal Layer
            </label>
            <select
              value={asteroidConfig.targetSurfaceType}
              onChange={e => setAsteroidConfig({ targetSurfaceType: e.target.value as any })}
              className="w-full bg-[#121A26] border border-[#263548] rounded-md px-2.5 py-1.5 text-xs text-[#E8EDF2] focus:outline-none focus:border-[#38BDF8]"
            >
              {Object.entries(TARGET_SURFACES).map(([key, val]) => (
                <option key={key} value={key}>{val.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Presets */}
        <div className="space-y-1.5">
          <label className="text-[#64748B] text-[11px] font-semibold uppercase tracking-wider block">
            Historical Events
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
                className="w-full text-left p-2 rounded-md bg-[#172131] hover:bg-[#1B2838] border border-[#263548]/40 text-[#9AA9B8] hover:text-[#E8EDF2] transition-colors"
              >
                <div className="font-medium text-[#E8EDF2] text-xs">{preset.name}</div>
                <div className="text-[11px] text-[#64748B] line-clamp-1 mt-0.5">{preset.description}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
};
