import React, { useState } from 'react';
import { 
  Wind, 
  Compass, 
  RotateCcw, 
  FolderOpen, 
  ArrowRight, 
  ShieldCheck, 
  AlertTriangle 
} from 'lucide-react';
import { useSimulation } from '../../context/SimulationContext';
import { calculateRocketProperties, ROCKET_PRESETS } from '../../physics/rocket-math';

export const RocketMetricsHud: React.FC = () => {
  const { 
    blueprint, 
    loadRocketPreset, 
    clearRocketBlueprint, 
    transferRocketToWindTunnel, 
    transferRocketToFlight 
  } = useSimulation();

  const [showPresetModal, setShowPresetModal] = useState<boolean>(false);
  const metrics = calculateRocketProperties(blueprint);

  return (
    <div className="bg-[#050914] border-t border-[#1a2638] px-4 py-2.5 flex flex-col md:flex-row items-center justify-between gap-3 text-xs font-mono select-none">
      {/* Telemetry Stat Strip */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-slate-500 uppercase text-[10px]">WET / DRY MASS</span>
          <span className="text-slate-200 font-bold">
            {metrics.totalMass}t <span className="text-slate-500 font-normal">/ {metrics.dryMass}t</span>
          </span>
        </div>

        <div className="w-[1px] h-4 bg-[#1a2638] hidden sm:block" />

        <div className="flex items-center gap-2">
          <span className="text-slate-500 uppercase text-[10px]">TOTAL THRUST</span>
          <span className="text-[#ffb703] font-bold">{metrics.totalThrust} kN</span>
        </div>

        <div className="w-[1px] h-4 bg-[#1a2638] hidden sm:block" />

        <div className="flex items-center gap-2">
          <span className="text-slate-500 uppercase text-[10px]">LIFTOFF TWR</span>
          <span className={`font-bold ${metrics.maxTWR >= 1.2 ? 'text-[#00f59b]' : 'text-[#ff3366]'}`}>
            {metrics.maxTWR > 0 ? metrics.maxTWR.toFixed(2) : '0.00'}
          </span>
        </div>

        <div className="w-[1px] h-4 bg-[#1a2638] hidden sm:block" />

        <div className="flex items-center gap-2">
          <span className="text-slate-500 uppercase text-[10px]">TOTAL \Delta v</span>
          <span className="text-[#00e5ff] font-bold text-sm">{metrics.totalDeltaV} m/s</span>
        </div>

        <div className="w-[1px] h-4 bg-[#1a2638] hidden sm:block" />

        <div className="flex items-center gap-1.5">
          {metrics.aerodynamicStabilityMargin > 0 ? (
            <ShieldCheck className="w-3.5 h-3.5 text-[#00f59b]" />
          ) : (
            <AlertTriangle className="w-3.5 h-3.5 text-[#ff3366]" />
          )}
          <span className="text-slate-500 uppercase text-[10px]">AERO STABILITY:</span>
          <span className={metrics.aerodynamicStabilityMargin > 0 ? 'text-[#00f59b] font-bold' : 'text-[#ff3366] font-bold'}>
            {metrics.aerodynamicStabilityMargin > 0 ? `+${metrics.aerodynamicStabilityMargin}m (STABLE)` : `${metrics.aerodynamicStabilityMargin}m (FLIP RISK)`}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowPresetModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#0e1626] hover:bg-[#162238] text-slate-300 border border-[#1a2638] font-bold transition-colors shadow-sm"
        >
          <FolderOpen className="w-3.5 h-3.5 text-[#00e5ff]" />
          <span>PRESETS</span>
        </button>

        <button
          onClick={clearRocketBlueprint}
          title="Clear all parts (Reset Canvas)"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-[#0e1626] hover:bg-[#ff3366]/20 text-slate-400 hover:text-[#ff3366] border border-[#1a2638] transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="text-[10px] font-bold uppercase">CLEAR ALL</span>
        </button>

        <button
          onClick={transferRocketToWindTunnel}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-[#0088cc] hover:bg-[#00a2f5] text-white font-bold transition-all shadow-md active:scale-95"
        >
          <Wind className="w-3.5 h-3.5" />
          <span>WIND TUNNEL CFD</span>
          <ArrowRight className="w-3 h-3 ml-0.5" />
        </button>

        <button
          onClick={transferRocketToFlight}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-[#00b06f] hover:bg-[#00d486] text-slate-950 font-black transition-all shadow-md active:scale-95"
        >
          <Compass className="w-3.5 h-3.5" />
          <span>LAUNCH FLIGHT</span>
        </button>
      </div>

      {showPresetModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a1122] border-2 border-[#00e5ff] rounded-xl max-w-lg w-full p-4 shadow-2xl font-mono">
            <div className="flex items-center justify-between pb-3 border-b border-[#1a2638]">
              <span className="font-bold text-slate-100 text-sm">SELECT VEHICLE BLUEPRINT</span>
              <button 
                onClick={() => setShowPresetModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 my-4 max-h-80 overflow-y-auto pr-1">
              {ROCKET_PRESETS.map(preset => (
                <div
                  key={preset.id}
                  onClick={() => {
                    loadRocketPreset(preset.id);
                    setShowPresetModal(false);
                  }}
                  className={`p-3 rounded-lg border transition-all cursor-pointer ${
                    blueprint.id === preset.id
                      ? 'bg-[#101e36] border-[#00e5ff]'
                      : 'bg-[#060a14] border-[#1a2638] hover:border-slate-500 hover:bg-[#0b1322]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200">{preset.name}</span>
                    <span className="text-[10px] text-[#00e5ff] bg-[#0c1526] border border-[#00e5ff]/30 px-2 py-0.5 rounded font-bold">
                      {preset.parts.length} PARTS
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Pre-calibrated aerospace assembly ready for supersonic aero-thermal testing and orbital flight.
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-[#1a2638]">
              <button
                onClick={() => setShowPresetModal(false)}
                className="px-4 py-1.5 rounded bg-[#101c30] hover:bg-[#1a2b48] text-slate-200 text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
