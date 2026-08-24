import React from 'react';
import { 
  Target, 
  Play, 
  Users, 
  Skull, 
  Waves,
  Globe
} from 'lucide-react';
import { useSimulation } from '../../context/SimulationContext';
import { 
  IMPACT_PRESETS, 
  POPULATION_AREAS,
  GEOGRAPHIC_TARGETS 
} from '../../physics/impact-physics';
import type { AsteroidComposition } from '../../types';

export const AsteroidConfigurator: React.FC = () => {
  const {
    asteroidConfig,
    impactTelemetry,
    setAsteroidConfig,
    setGeographicTarget,
    triggerImpactSimulation
  } = useSimulation();

  const isOcean = asteroidConfig.targetSurfaceType === 'water_ocean' || asteroidConfig.targetAreaType === 'ocean_deep' || asteroidConfig.geographicTarget?.isOcean === true;

  return (
    <aside className="w-[320px] bg-[#151820] border-r border-[#252B36] flex flex-col h-full select-none text-xs shrink-0 z-20">
      <div className="p-3 border-b border-[#252B36] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-[#FF8A1F]" />
          <h2 className="font-semibold text-[#E6E8EB] text-xs tracking-tight uppercase">Kinetic Impact Dynamics</h2>
        </div>
        <span className="text-[10px] text-[#FF8A1F] bg-[#FF8A1F]/10 px-2 py-0.5 rounded font-mono-num font-medium">
          Ready
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Simulate Action Button */}
        <div>
          <button
            onClick={triggerImpactSimulation}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded bg-[#FF8A1F] hover:bg-[#FFA24A] text-[#090A0D] font-semibold text-xs transition-all active:scale-98 shadow-sm uppercase tracking-tight"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Simulate Kinetic Impact</span>
          </button>
        </div>

        {/* Casualty & Lethality Prediction Card */}
        <div className="bg-[#1B1F28] border border-[#D95757]/30 rounded-lg p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[#E6E8EB] font-semibold flex items-center gap-1.5 uppercase text-[11px]">
              <Skull className="w-3.5 h-3.5 text-[#D95757]" />
              <span>Projected Casualties</span>
            </span>
            <span className="text-[10px] font-mono-num px-1.5 py-0.5 rounded bg-[#D95757]/15 text-[#D95757] font-semibold">
              {impactTelemetry.targetPopulation > 0
                ? `${((impactTelemetry.estimatedFatalities / impactTelemetry.targetPopulation) * 100).toFixed(1)}% Mortality`
                : '0% (Uninhabited)'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-[#0E1015] p-2 rounded border border-[#252B36]">
              <span className="text-[#69717E] text-[10px] uppercase block">Estimated Deaths</span>
              <span className="text-[#D95757] font-mono-num font-bold text-sm mt-0.5 block">
                {impactTelemetry.estimatedFatalities.toLocaleString()}
              </span>
            </div>
            <div className="bg-[#0E1015] p-2 rounded border border-[#252B36]">
              <span className="text-[#69717E] text-[10px] uppercase block">Injuries / Trauma</span>
              <span className="text-[#E6B84D] font-mono-num font-bold text-sm mt-0.5 block">
                {impactTelemetry.estimatedInjuries.toLocaleString()}
              </span>
            </div>
          </div>

          {isOcean ? (
            <div className="bg-[#0E1015] p-2 rounded border border-[#252B36] space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#79AFC1] flex items-center gap-1 font-medium">
                  <Waves className="w-3.5 h-3.5" />
                  <span>Megatsunami Wave</span>
                </span>
                <span className="text-[#E6E8EB] font-mono-num font-semibold">
                  {impactTelemetry.tsunamiWaveHeightAtImpactM}m
                </span>
              </div>
              <div className="flex justify-between text-[10px] text-[#A4ABB6]">
                <span>100km Coast: <strong className="text-[#79AFC1]">{impactTelemetry.tsunamiWaveHeightAt100kmM}m</strong></span>
                <span>Inundation: <strong className="text-[#E6B84D]">{impactTelemetry.tsunamiRunupInundationKm}km</strong></span>
              </div>
            </div>
          ) : (
            <div className="text-[10px] text-[#A4ABB6] flex items-center justify-between pt-1 border-t border-[#252B36]">
              <span>Thermal Ignition Zone:</span>
              <span className="text-[#E6B84D] font-mono-num font-medium">{impactTelemetry.thermalIgnitionRadius} km</span>
            </div>
          )}
        </div>

        {/* Real-World GIS Geographic Coordinate Selector */}
        <div className="bg-[#1B1F28]/70 border border-[#252B36] rounded-lg p-3 space-y-2">
          <label className="text-[#69717E] text-[11px] font-semibold uppercase tracking-wider block flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-[#79AFC1]" />
            <span>Interactive GIS Target Location</span>
          </label>

          <select
            value={asteroidConfig.geographicTarget?.name || GEOGRAPHIC_TARGETS[0].name}
            onChange={e => {
              const target = GEOGRAPHIC_TARGETS.find(t => t.name === e.target.value);
              if (target) setGeographicTarget(target);
            }}
            className="w-full bg-[#0E1015] border border-[#252B36] rounded px-2.5 py-1.5 text-xs text-[#E6E8EB] focus:outline-none focus:border-[#FF8A1F]"
          >
            {GEOGRAPHIC_TARGETS.map(geo => (
              <option key={geo.name} value={geo.name}>
                {geo.name} ({geo.latitude.toFixed(1)}°, {geo.longitude.toFixed(1)}°)
              </option>
            ))}
          </select>

          {asteroidConfig.geographicTarget && (
            <div className="flex justify-between text-[10px] text-[#A4ABB6] bg-[#0E1015] p-2 rounded border border-[#252B36]">
              <span>Density: <strong className="text-[#E6E8EB]">{asteroidConfig.geographicTarget.populationDensityPerKm2.toLocaleString()}/km²</strong></span>
              <span>Elevation: <strong className="text-[#79AFC1]">{asteroidConfig.geographicTarget.elevationM}m</strong></span>
            </div>
          )}
        </div>

        {/* Target Population Area Presets */}
        <div className="bg-[#1B1F28]/70 border border-[#252B36] rounded-lg p-3 space-y-2.5">
          <label className="text-[#69717E] text-[11px] font-semibold uppercase tracking-wider block flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-[#FF8A1F]" />
            <span>Target Population Presets</span>
          </label>

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
                    ? 'bg-[#222733] border-[#FF8A1F] text-[#E6E8EB] font-medium shadow-xs'
                    : 'bg-[#0E1015] border-[#252B36] text-[#A4ABB6] hover:text-[#E6E8EB] hover:bg-[#1B1F28]'
                }`}
              >
                <div className="font-medium text-[11px] line-clamp-1">{area.name}</div>
                <div className="text-[10px] text-[#69717E] font-mono-num mt-0.5">
                  {area.population > 0 ? `${(area.population / 1000).toLocaleString()}k pop` : 'Uninhabited'}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Bolide Geometry & Mass */}
        <div className="bg-[#1B1F28]/70 border border-[#252B36] rounded-lg p-3 space-y-3">
          <label className="text-[#69717E] text-[11px] font-semibold uppercase tracking-wider block">
            Bolide Geometry & Mass
          </label>

          <div>
            <div className="flex items-center justify-between text-xs font-medium mb-1">
              <span className="text-[#A4ABB6]">Impact Diameter</span>
              <span className="text-[#FF8A1F] font-mono-num font-semibold">
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
          </div>

          <div className="border-t border-[#252B36] pt-2.5">
            <label className="text-[#A4ABB6] text-xs font-medium block mb-1">
              Composition & Density
            </label>
            <select
              value={asteroidConfig.composition}
              onChange={e => setAsteroidConfig({ composition: e.target.value as AsteroidComposition })}
              className="w-full bg-[#0E1015] border border-[#252B36] rounded px-2.5 py-1.5 text-xs text-[#E6E8EB] focus:outline-none focus:border-[#FF8A1F]"
            >
              <option value="rubble">Porous Rubble Pile (1,500 kg/m³)</option>
              <option value="carbonaceous">Carbonaceous Chondrite (2,200 kg/m³)</option>
              <option value="silicate">Dense Silicate Rock (3,000 kg/m³)</option>
              <option value="iron_nickel">Metallic Iron-Nickel (7,800 kg/m³)</option>
              <option value="cometary_ice">Cometary Volatile Ice (1,000 kg/m³)</option>
            </select>
          </div>

          <div className="border-t border-[#252B36] pt-2.5">
            <div className="flex items-center justify-between text-xs font-medium mb-1">
              <span className="text-[#A4ABB6]">Impact Velocity</span>
              <span className="text-[#FF8A1F] font-mono-num font-semibold">{asteroidConfig.velocity} km/s</span>
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
          </div>
        </div>

        {/* Historical Impact Presets */}
        <div className="space-y-1.5">
          <label className="text-[#69717E] text-[11px] font-semibold uppercase tracking-wider block">
            Historical & Benchmark Events
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
                    targetAreaType: preset.targetAreaType
                  });
                }}
                className="w-full text-left p-2 rounded bg-[#1B1F28]/60 hover:bg-[#222733] border border-[#252B36] text-[#A4ABB6] hover:text-[#E6E8EB] transition-colors"
              >
                <div className="font-medium text-[11px] text-[#E6E8EB]">{preset.name}</div>
                <div className="text-[10px] text-[#69717E] line-clamp-1 mt-0.5">{preset.description}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
};
