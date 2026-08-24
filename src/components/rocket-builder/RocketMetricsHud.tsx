import React from 'react';
import { Play, Wind, RotateCcw, AlertTriangle, CheckCircle2 } from 'lucide-react';
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

  return (
    <footer className="bg-[#0E1015] border-t border-[#252B36] px-4 h-11 flex items-center justify-between text-xs select-none shrink-0 z-20 overflow-x-auto">
      {/* Primary Engineering Metrics Strip */}
      <div className="flex items-center gap-5">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[#69717E] text-[11px] uppercase tracking-wider">Mass</span>
          <span className="font-mono-num font-semibold text-[#E6E8EB] text-sm">
            {metrics.totalMass.toFixed(1)} t
          </span>
          <span className="text-[10px] text-[#69717E]">({metrics.dryMass.toFixed(1)} t dry)</span>
        </div>

        <div className="h-3.5 w-[1px] bg-[#252B36]" />

        <div className="flex items-baseline gap-1.5">
          <span className="text-[#69717E] text-[11px] uppercase tracking-wider">Thrust</span>
          <span className="font-mono-num font-semibold text-[#FF8A1F] text-sm">
            {metrics.totalThrust.toLocaleString()} kN
          </span>
        </div>

        <div className="h-3.5 w-[1px] bg-[#252B36]" />

        <div className="flex items-baseline gap-1.5">
          <span className="text-[#69717E] text-[11px] uppercase tracking-wider">ΔV</span>
          <span className="font-mono-num font-semibold text-[#79AFC1] text-sm">
            {metrics.totalDeltaV.toLocaleString()} m/s
          </span>
        </div>

        <div className="h-3.5 w-[1px] bg-[#252B36]" />

        <div className="flex items-baseline gap-1.5">
          <span className="text-[#69717E] text-[11px] uppercase tracking-wider">TWR</span>
          <span className={`font-mono-num font-semibold text-sm ${metrics.maxTWR >= 1.0 ? 'text-[#55B982]' : 'text-[#D95757]'}`}>
            {metrics.maxTWR > 0 ? metrics.maxTWR.toFixed(2) : '0.00'}
          </span>
        </div>

        <div className="h-3.5 w-[1px] bg-[#252B36]" />

        <div className="flex items-baseline gap-1.5">
          <span className="text-[#69717E] text-[11px] uppercase tracking-wider">Stability</span>
          <span className={`font-mono-num font-semibold text-xs ${metrics.aerodynamicStabilityMargin >= 0 ? 'text-[#55B982]' : 'text-[#D95757]'}`}>
            {metrics.aerodynamicStabilityMargin >= 0 ? `+${metrics.aerodynamicStabilityMargin.toFixed(1)} m` : `${metrics.aerodynamicStabilityMargin.toFixed(1)} m`}
          </span>
        </div>

        <div className="h-3.5 w-[1px] bg-[#252B36]" />

        <div className="flex items-baseline gap-1.5">
          <span className="text-[#69717E] text-[11px] uppercase tracking-wider">Stages</span>
          <span className="font-mono-num font-semibold text-[#E6E8EB] text-sm">
            {stageCount}
          </span>
        </div>

        <div className="h-3.5 w-[1px] bg-[#252B36]" />

        <div className="flex items-center gap-1.5 text-[11px]">
          {metrics.isStructurallySound ? (
            <span className="text-[#55B982] flex items-center gap-1 font-semibold tracking-wider text-[10px] uppercase">
              <CheckCircle2 className="w-3 h-3" />
              <span>NOMINAL</span>
            </span>
          ) : (
            <span className="text-[#D95757] flex items-center gap-1 font-semibold tracking-wider text-[10px] uppercase">
              <AlertTriangle className="w-3 h-3" />
              <span>{metrics.disconnectedPartsCount} FLOATING</span>
            </span>
          )}
        </div>
      </div>

      {/* Quick Launch & Testing Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={clearRocketBlueprint}
          title="Reset canvas"
          className="p-1.5 rounded hover:bg-[#1B1F28] text-[#69717E] hover:text-[#D95757] transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={transferRocketToWindTunnel}
          className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#151820] hover:bg-[#1B1F28] border border-[#252B36] text-[#A4ABB6] hover:text-[#E6E8EB] font-medium text-[11px] transition-colors"
        >
          <Wind className="w-3.5 h-3.5 text-[#79AFC1]" />
          <span>CFD Tunnel</span>
        </button>

        <button
          onClick={transferRocketToFlight}
          disabled={blueprint.parts.length === 0}
          className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#FF8A1F] hover:bg-[#FFA24A] text-[#090A0D] font-semibold text-[11px] transition-all active:scale-98 shadow-sm disabled:opacity-50"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span className="uppercase tracking-tight">Launch Flight</span>
        </button>
      </div>
    </footer>
  );
};
