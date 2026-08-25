import React, { useState } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Rocket, 
  Clock, 
  Zap, 
  Crosshair, 
  Play, 
  RotateCcw 
} from 'lucide-react';
import { useSimulation } from '../../context/SimulationContext';
import { 
  DART_DEFAULT_MISSION, 
  calculatePlanetaryDeflection, 
  type InterceptorMissionConfig 
} from '../../physics/planetary-defense';
import { soundEngine } from '../../audio/soundEngine';

export const PlanetaryDefensePanel: React.FC = () => {
  const { asteroidConfig } = useSimulation();
  const [mission, setMission] = useState<InterceptorMissionConfig>(DART_DEFAULT_MISSION);
  const [hasFired, setHasFired] = useState<boolean>(false);

  const defenseResult = calculatePlanetaryDeflection(asteroidConfig, mission);

  const handleLaunchInterceptor = () => {
    setHasFired(true);
    soundEngine.playSonicBoom();
    if (defenseResult.isDiverted) {
      soundEngine.speak('Kinetic impact confirmed. Asteroid trajectory successfully deflected.');
    } else {
      soundEngine.speak('Kinetic impact confirmed. Warning, deflection insufficient to prevent Earth strike.');
    }
  };

  const handleReset = () => {
    setHasFired(false);
    setMission(DART_DEFAULT_MISSION);
  };

  return (
    <div className="bg-[#151820] border border-[#252B36] rounded-xl p-4 space-y-4 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#252B36]">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-[#FF8A1F]" />
          <div>
            <h3 className="font-semibold text-xs text-[#E6E8EB] uppercase tracking-wider">
              DART Kinetic Planetary Defense
            </h3>
            <p className="text-[11px] text-[#A4ABB6]">
              Hypervelocity Impactor Interception & Momentum Deflection
            </p>
          </div>
        </div>

        <button
          onClick={handleReset}
          className="p-1.5 rounded hover:bg-[#1B1F28] text-[#A4ABB6] hover:text-[#E6E8EB] transition-colors"
          title="Reset Interceptor"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Interceptor Configuration Sliders */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        {/* Craft Mass */}
        <div className="space-y-1.5 bg-[#0E1015] p-2.5 rounded-lg border border-[#252B36]">
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-[#A4ABB6] flex items-center gap-1">
              <Rocket className="w-3 h-3 text-[#79AFC1]" />
              Impactor Mass
            </span>
            <span className="font-mono-num font-semibold text-[#E6E8EB]">{mission.craftMassKg} kg</span>
          </div>
          <input
            type="range"
            min={200}
            max={5000}
            step={50}
            value={mission.craftMassKg}
            onChange={e => setMission({ ...mission, craftMassKg: Number(e.target.value) })}
            className="w-full h-1.5 bg-[#252B36] rounded-lg appearance-none cursor-pointer accent-[#FF8A1F]"
          />
        </div>

        {/* Intercept Speed */}
        <div className="space-y-1.5 bg-[#0E1015] p-2.5 rounded-lg border border-[#252B36]">
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-[#A4ABB6] flex items-center gap-1">
              <Crosshair className="w-3 h-3 text-[#FF8A1F]" />
              Impact Velocity
            </span>
            <span className="font-mono-num font-semibold text-[#E6E8EB]">{mission.impactSpeedKmS} km/s</span>
          </div>
          <input
            type="range"
            min={3.0}
            max={25.0}
            step={0.5}
            value={mission.impactSpeedKmS}
            onChange={e => setMission({ ...mission, impactSpeedKmS: Number(e.target.value) })}
            className="w-full h-1.5 bg-[#252B36] rounded-lg appearance-none cursor-pointer accent-[#FF8A1F]"
          />
        </div>

        {/* Lead Time Before Impact */}
        <div className="space-y-1.5 bg-[#0E1015] p-2.5 rounded-lg border border-[#252B36]">
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-[#A4ABB6] flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#E6B84D]" />
              Lead Time
            </span>
            <span className="font-mono-num font-semibold text-[#E6E8EB]">{mission.leadTimeDays} days</span>
          </div>
          <input
            type="range"
            min={30}
            max={1825}
            step={15}
            value={mission.leadTimeDays}
            onChange={e => setMission({ ...mission, leadTimeDays: Number(e.target.value) })}
            className="w-full h-1.5 bg-[#252B36] rounded-lg appearance-none cursor-pointer accent-[#FF8A1F]"
          />
        </div>

        {/* Beta Ejecta Factor */}
        <div className="space-y-1.5 bg-[#0E1015] p-2.5 rounded-lg border border-[#252B36]">
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-[#A4ABB6] flex items-center gap-1">
              <Zap className="w-3 h-3 text-[#55B982]" />
              Recoil Beta (β)
            </span>
            <span className="font-mono-num font-semibold text-[#E6E8EB]">{mission.betaMomentumFactor}x</span>
          </div>
          <input
            type="range"
            min={1.0}
            max={4.0}
            step={0.1}
            value={mission.betaMomentumFactor}
            onChange={e => setMission({ ...mission, betaMomentumFactor: Number(e.target.value) })}
            className="w-full h-1.5 bg-[#252B36] rounded-lg appearance-none cursor-pointer accent-[#FF8A1F]"
          />
        </div>
      </div>

      {/* Launch Action */}
      <button
        onClick={handleLaunchInterceptor}
        className="w-full py-2 px-3 rounded-lg bg-[#FF8A1F] hover:bg-[#FFA24A] text-[#090A0D] font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-98"
      >
        <Play className="w-3.5 h-3.5 fill-current" />
        <span>Launch Kinetic Interceptor Mission</span>
      </button>

      {/* Real-Time Defense Telemetry Output */}
      {hasFired && (
        <div className={`p-3 rounded-lg border text-xs space-y-2.5 ${
          defenseResult.status === 'SAFE_DEFLECTION'
            ? 'bg-[#55B982]/10 border-[#55B982]/40 text-[#55B982]'
            : defenseResult.status === 'MARGINAL_CLEARANCE'
            ? 'bg-[#E6B84D]/10 border-[#E6B84D]/40 text-[#E6B84D]'
            : 'bg-[#D95757]/10 border-[#D95757]/40 text-[#D95757]'
        }`}>
          <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-[11px]">
            {defenseResult.isDiverted ? (
              <ShieldCheck className="w-4 h-4 text-[#55B982]" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-[#D95757]" />
            )}
            <span>{defenseResult.status.replace('_', ' ')}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono-num text-[#E6E8EB] pt-1 border-t border-[#252B36]">
            <div>
              <span className="text-[#A4ABB6] block text-[10px]">ΔV Imparted:</span>
              <strong>{defenseResult.deltaVMps.toFixed(2)} mm/s</strong>
            </div>
            <div>
              <span className="text-[#A4ABB6] block text-[10px]">Miss Distance:</span>
              <strong>{Math.round(defenseResult.deflectionDistanceKm).toLocaleString()} km</strong>
            </div>
            <div>
              <span className="text-[#A4ABB6] block text-[10px]">Impulse Transferred:</span>
              <strong>{(defenseResult.momentumTransferredNs / 1e6).toFixed(2)} MN·s</strong>
            </div>
            <div>
              <span className="text-[#A4ABB6] block text-[10px]">Clearance Factor:</span>
              <strong>{(defenseResult.deflectionDistanceKm / 6371).toFixed(1)} Earth Radii</strong>
            </div>
          </div>

          <p className="text-[11px] text-[#A4ABB6] leading-relaxed pt-1">
            {defenseResult.summaryDescription}
          </p>
        </div>
      )}
    </div>
  );
};
