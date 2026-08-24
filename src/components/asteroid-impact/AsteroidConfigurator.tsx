import React from 'react';
import { 
  Target, 
  Play, 
  Users, 
  Skull, 
  Waves
} from 'lucide-react';
import { useSimulation } from '../../context/SimulationContext';
import { 
  TARGET_SURFACES, 
  IMPACT_PRESETS, 
  POPULATION_AREAS 
} from '../../physics/impact-physics';
import type { AsteroidComposition } from '../../types';

export const AsteroidConfigurator: React.FC = () => {
  const {
    asteroidConfig,
    impactTelemetry,
    setAsteroidConfig,
    triggerImpactSimulation
  } = useSimulation();

  const isOcean = asteroidConfig.targetSurfaceType === 'water_ocean' || asteroidConfig.targetAreaType === 'ocean_deep';

  return (
    <aside className="w-[320px] bg-[#121A26] border-r border-[#1C2938] flex flex-col h-full select-none text-xs shrink-0 z-20">
      <div className="p-3 border-b border-[#1C2938] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-[#F43F5E]" />
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
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md bg-[#F43F5E] hover:bg-[#e12d4d] text-[#0B0F17] font-semibold text-xs transition-all active:scale-98 shadow-sm"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Simulate Kinetic Impact</span>
          </button>
        </div>

        {/* Casualty & Lethality Prediction Card */}
        <div className="bg-[#172131]/80 border border-[#F43F5E]/30 rounded-lg p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[#E8EDF2] font-semibold flex items-center gap-1.5">
              <Skull className="w-3.5 h-3.5 text-[#F43F5E]" />
              <span>Projected Casualties</span>
            </span>
            <span className="text-[10px] font-mono-num px-1.5 py-0.5 rounded bg-[#F43F5E]/15 text-[#F43F5E] font-medium">
              {impactTelemetry.targetPopulation > 0
                ? `${((impactTelemetry.estimatedFatalities / impactTelemetry.targetPopulation) * 100).toFixed(1)}% Mortality`
                : '0% (Uninhabited)'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-[#121A26] p-2 rounded border border-[#263548]">
              <span className="text-[#64748B] text-[10px] block">Estimated Deaths</span>
              <span className="text-[#F43F5E] font-mono-num font-bold text-sm mt-0.5 block">
                {impactTelemetry.estimatedFatalities.toLocaleString()}
              </span>
            </div>
            <div className="bg-[#121A26] p-2 rounded border border-[#263548]">
              <span className="text-[#64748B] text-[10px] block">Injuries / Trauma</span>
              <span className="text-[#FBBF24] font-mono-num font-bold text-sm mt-0.5 block">
                {impactTelemetry.estimatedInjuries.toLocaleString()}
              </span>
            </div>
          </div>

          {isOcean ? (
            <div className="bg-[#0E1520] p-2 rounded border border-[#38BDF8]/40 space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#38BDF8] flex items-center gap-1 font-medium">
                  <Waves className="w-3.5 h-3.5" />
                  <span>Megatsunami Wave</span>
                </span>
                <span className="text-[#E8EDF2] font-mono-num font-semibold">
                  {impactTelemetry.tsunamiWaveHeightAtImpactM}m
                </span>
              </div>
              <div className="flex justify-between text-[10px] text-[#9AA9B8]">
                <span>100km Coast Wave: <strong className="text-[#38BDF8]">{impactTelemetry.tsunamiWaveHeightAt100kmM}m</strong></span>
                <span>Inundation: <strong className="text-[#FBBF24]">{impactTelemetry.tsunamiRunupInundationKm}km</strong></span>
              </div>
            </div>
          ) : (
            <div className="text-[10px] text-[#9AA9B8] flex items-center justify-between pt-1 border-t border-[#1C2938]">
              <span>Thermal Ignition Zone:</span>
              <span className="text-[#FBBF24] font-mono-num font-medium">{impactTelemetry.thermalIgnitionRadius} km</span>
            </div>
          )}
        </div>

        {/* Target Area & Population Density Selector */}
        <div className="bg-[#172131]/60 border border-[#263548]/40 rounded-lg p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-[#64748B] text-[11px] font-semibold uppercase tracking-wider block flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span>Target Population Area</span>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {Object.values(POPULATION_AREAS).map(area => (
              <button
                key={area.id}
                onClick={() => {
                  setAsteroidConfig({
                    targetAreaType: area.id,
                    targetSurfaceType: area.defaultSurface,
                    customPopulation: area.population
                  });
                }}
                className={`p-2 rounded text-left border transition-all ${
                  asteroidConfig.targetAreaType === area.id
                    ? 'bg-[#1A3040] border-[#38BDF8] text-[#E8EDF2]'
                    : 'bg-[#121A26] border-[#263548] text-[#9AA9B8] hover:text-[#E8EDF2]'
                }`}
              >
                <div className="font-medium text-[11px] line-clamp-1">{area.name}</div>
                <div className="text-[10px] text-[#64748B] font-mono-num mt-0.5">
                  {area.population > 0 ? `${(area.population / 1000).toLocaleString()}k pop` : 'Uninhabited'}
                </div>
              </button>
            ))}
          </div>

          <div className="border-t border-[#1C2938] pt-2">
            <div className="flex items-center justify-between text-xs font-medium mb-1">
              <span className="text-[#9AA9B8]">Custom Population Value</span>
              <span className="text-[#38BDF8] font-mono-num font-semibold">
                {(asteroidConfig.customPopulation ?? POPULATION_AREAS[asteroidConfig.targetAreaType || 'dense_metro'].population).toLocaleString()}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="15000000"
              step="50000"
              value={asteroidConfig.customPopulation ?? POPULATION_AREAS[asteroidConfig.targetAreaType || 'dense_metro'].population}
              onChange={e => setAsteroidConfig({ customPopulation: parseInt(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-[#64748B] mt-1">
              <span>0 (Desert)</span>
              <span>1M (City)</span>
              <span>15M (Megacity)</span>
            </div>
          </div>
        </div>

        {/* Bolide Geometry & Specifications */}
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
              Composition & Density
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
          </div>

          <div className="border-t border-[#1C2938] pt-2.5">
            <label className="text-[#9AA9B8] text-xs font-medium block mb-1">
              Target Surface Material
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

        {/* Historical Impact Presets */}
        <div className="space-y-1.5">
          <label className="text-[#64748B] text-[11px] font-semibold uppercase tracking-wider block">
            Impact Event Presets
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
                    targetSurfaceType: preset.targetSurfaceType,
                    targetAreaType: preset.targetAreaType,
                    customPopulation: POPULATION_AREAS[preset.targetAreaType]?.population
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
