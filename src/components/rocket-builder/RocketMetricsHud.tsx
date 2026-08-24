import React from 'react';
import { Play, Wind, RotateCcw } from 'lucide-react';
import { useSimulation } from '../../context/SimulationContext';
import { calculateRocketProperties } from '../../physics/rocket-math';

export const RocketMetricsHud: React.FC = () => {
  const { 
    blueprint, 
    clearRocketBlueprint, 
    transferRocketToWindTunnel, 
    transferRocketToFlight 
  } = useSimulation();

  const metrics = calculateRocketProperties(blueprint);

  const stageCount = [1, 2, 3, 4].filter(s => blueprint.parts.some(p => (p.stage || 1) === s)).length;
  const isVehicleReady = blueprint.parts.length > 0 && metrics.maxTWR >= 1.0;

  return (
    <footer className="bg-[#0B0F17] border-t border-[#1C2938] px-4 h-11 flex items-center justify-between text-xs select-none shrink-0 z-20">
      {/* Primary Engineering Metrics Strip */}
      <div className="flex items-center gap-6">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[#64748B] text-[11px]">Mass</span>
          <span className="font-mono-num font-semibold text-[#E8EDF2] text-sm">
            {metrics.totalMass.toFixed(1)} t
          </span>
          <span className="text-[10px] text-[#64748B]">({metrics.dryMass.toFixed(1)} t dry)</span>
        </div>

        <div className="h-3.5 w-[1px] bg-[#1C2938]" />

        <div className="flex items-baseline gap-1.5">
          <span className="text-[#64748B] text-[11px]">Thrust</span>
          <span className="font-mono-num font-semibold text-[#FBBF24] text-sm">
            {metrics.totalThrust.toLocaleString()} kN
          </span>
        </div>

        <div className="h-3.5 w-[1px] bg-[#1C2938]" />

        <div className="flex items-baseline gap-1.5">
          <span className="text-[#64748B] text-[11px]">ΔV</span>
          <span className="font-mono-num font-semibold text-[#38BDF8] text-sm">
            {metrics.totalDeltaV.toLocaleString()} m/s
          </span>
        </div>

        <div className="h-3.5 w-[1px] bg-[#1C2938]" />

        <div className="flex items-baseline gap-1.5">
          <span className="text-[#64748B] text-[11px]">TWR</span>
          <span className={`font-mono-num font-semibold text-sm ${metrics.maxTWR >= 1.0 ? 'text-[#34D399]' : 'text-[#F43F5E]'}`}>
            {metrics.maxTWR > 0 ? metrics.maxTWR.toFixed(2) : '0.00'}
          </span>
        </div>

        <div className="h-3.5 w-[1px] bg-[#1C2938]" />

        <div className="flex items-baseline gap-1.5">
          <span className="text-[#64748B] text-[11px]">Stages</span>
          <span className="font-mono-num font-semibold text-[#E8EDF2] text-sm">
            {stageCount}
          </span>
        </div>

        <div className="h-3.5 w-[1px] bg-[#1C2938]" />

        <div className="flex items-center gap-1.5 text-[11px]">
          <span className={`w-2 h-2 rounded-full ${isVehicleReady ? 'bg-[#34D399]' : 'bg-[#FBBF24]'}`} />
          <span className={isVehicleReady ? 'text-[#34D399] font-medium' : 'text-[#9AA9B8]'}>
            {isVehicleReady ? 'Vehicle Ready' : 'Assembly Incomplete'}
          </span>
        </div>
      </div>

      {/* Quick Launch & Testing Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={clearRocketBlueprint}
          title="Reset canvas"
          className="p-1.5 rounded-md hover:bg-[#172131] text-[#64748B] hover:text-[#F43F5E] transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={transferRocketToWindTunnel}
          className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#121A26] hover:bg-[#172131] border border-[#263548] text-[#E8EDF2] font-medium transition-colors"
        >
          <Wind className="w-3.5 h-3.5 text-[#38BDF8]" />
          <span>CFD Wind Tunnel</span>
        </button>

        <button
          onClick={transferRocketToFlight}
          className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#34D399] hover:bg-[#2fc08a] text-[#0B0F17] font-semibold transition-all active:scale-98"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Launch Simulation</span>
        </button>
      </div>
    </footer>
  );
};
