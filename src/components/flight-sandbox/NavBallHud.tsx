import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  RotateCcw, 
  Play, 
  Layers,
  Flame,
  Sparkles,
  FileText,
  AlertOctagon
} from 'lucide-react';
import { useSimulation } from '../../context/SimulationContext';
import { calculateCurrentStageMassAndThrust } from '../../physics/flight-dynamics';
import { FlightReportModal } from './FlightReportModal';

export const NavBallHud: React.FC = () => {
  const {
    blueprint,
    flightState,
    guidanceMode,
    setGuidanceMode,
    launchFlight,
    triggerStaging,
    setFlightThrottle,
    setFlightPitch,
    abortFlight,
    resetFlight
  } = useSimulation();

  const [isReportOpen, setIsReportOpen] = useState(false);

  // Automatically open report modal when mission is aborted
  useEffect(() => {
    if (flightState.aborted) {
      setIsReportOpen(true);
    }
  }, [flightState.aborted]);

  const currentStageInfo = calculateCurrentStageMassAndThrust(
    blueprint,
    flightState.currentStageIndex,
    flightState.altitude
  );

  // Maximum stage number in vehicle
  const maxStage = Math.max(1, ...blueprint.parts.map(p => p.stage || 1));
  const hasMoreStages = flightState.currentStageIndex < maxStage;

  return (
    <>
      <aside className="w-[300px] bg-[#151820] border-r border-[#252B36] flex flex-col h-full select-none text-xs shrink-0 z-20">
        <div className="p-3 border-b border-[#252B36] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-[#FF8A1F]" />
            <h2 className="font-semibold text-[#E6E8EB] text-xs tracking-tight uppercase">Flight Dynamics</h2>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsReportOpen(true)}
              className="p-1 rounded bg-[#1B1F28] hover:bg-[#222733] border border-[#252B36] text-[#79AFC1] hover:text-[#E6E8EB]"
              title="Mission Report / Incident Telemetry"
            >
              <FileText className="w-3.5 h-3.5 text-[#79AFC1]" />
            </button>
            <span className={`text-[10px] px-2 py-0.5 rounded font-mono-num font-semibold ${
              flightState.aborted
                ? 'bg-[#D95757]/15 text-[#D95757]'
                : flightState.inOrbit 
                ? 'bg-[#55B982]/15 text-[#55B982]' 
                : flightState.isLaunched 
                ? 'bg-[#E6B84D]/15 text-[#E6B84D]' 
                : 'bg-[#1B1F28] text-[#A4ABB6]'
            }`}>
              {flightState.aborted 
                ? '● ABORTED' 
                : flightState.inOrbit 
                ? '● STABLE ORBIT' 
                : flightState.isLaunched 
                ? '● ASCENT PHASE' 
                : '● PAD STANDBY'}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* Abort Banner Notice */}
          {flightState.aborted && (
            <div className="p-2.5 bg-[#D95757]/10 border border-[#D95757]/30 rounded-lg flex items-center justify-between text-[#D95757]">
              <span className="flex items-center gap-1.5 font-semibold text-xs">
                <AlertOctagon className="w-4 h-4" />
                <span>MISSION ABORTED</span>
              </span>
              <button
                onClick={() => setIsReportOpen(true)}
                className="px-2 py-1 rounded bg-[#D95757] hover:bg-[#bf4343] text-[#090A0D] font-semibold text-[11px] transition-colors"
              >
                View Report
              </button>
            </div>
          )}

          {/* Launch / Staging Primary Action */}
          <div className="space-y-2">
            {!flightState.isLaunched ? (
              <button
                onClick={launchFlight}
                className="w-full py-2.5 rounded bg-[#FF8A1F] hover:bg-[#FFA24A] text-[#090A0D] font-semibold text-xs transition-all active:scale-98 flex items-center justify-center gap-2 shadow-sm uppercase tracking-tight"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Ignition & Launch (Space)</span>
              </button>
            ) : (
              <button
                onClick={triggerStaging}
                disabled={!hasMoreStages || flightState.aborted}
                className={`w-full py-2.5 rounded font-semibold text-xs transition-all active:scale-98 flex items-center justify-center gap-2 uppercase tracking-tight ${
                  hasMoreStages && !flightState.aborted
                    ? 'bg-[#79AFC1] hover:bg-[#689fb0] text-[#090A0D]'
                    : 'bg-[#1B1F28] text-[#69717E] border border-[#252B36] cursor-not-allowed'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>
                  {hasMoreStages 
                    ? `Stage ${flightState.currentStageIndex} → ${flightState.currentStageIndex + 1} (Space)` 
                    : 'Final Stage Active'}
                </span>
              </button>
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={resetFlight}
                className="flex-1 py-1.5 rounded bg-[#1B1F28] hover:bg-[#222733] border border-[#252B36] text-[#A4ABB6] hover:text-[#E6E8EB] flex items-center justify-center gap-1.5 transition-colors text-[11px]"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Pad</span>
              </button>
              <button
                onClick={() => {
                  abortFlight();
                  setIsReportOpen(true);
                }}
                disabled={!flightState.isLaunched || flightState.aborted}
                className={`px-3 py-1.5 rounded font-medium transition-colors text-[11px] ${
                  flightState.isLaunched && !flightState.aborted
                    ? 'bg-[#D95757]/15 hover:bg-[#D95757] text-[#D95757] hover:text-[#090A0D] border border-[#D95757]/30 cursor-pointer'
                    : 'bg-[#1B1F28] text-[#69717E] border border-[#252B36] cursor-not-allowed'
                }`}
                title="Abort Mission"
              >
                Abort
              </button>
            </div>
          </div>

          {/* Guidance Mode Selector */}
          <div className="bg-[#1B1F28]/70 border border-[#252B36] rounded-lg p-2.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#A4ABB6]">Flight Guidance Mode</span>
              <span className="text-[10px] text-[#FF8A1F] capitalize font-medium">{guidanceMode}</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => setGuidanceMode('manual')}
                className={`py-1 rounded text-xs font-medium border transition-colors ${
                  guidanceMode === 'manual'
                    ? 'bg-[#222733] border-[#FF8A1F] text-[#E6E8EB] font-semibold'
                    : 'bg-[#0E1015] border-[#252B36] text-[#A4ABB6] hover:text-[#E6E8EB]'
                }`}
              >
                Manual Steering
              </button>
              <button
                onClick={() => setGuidanceMode('auto')}
                className={`py-1 rounded text-xs font-medium border transition-colors flex items-center justify-center gap-1 ${
                  guidanceMode === 'auto'
                    ? 'bg-[#222733] border-[#FF8A1F] text-[#E6E8EB] font-semibold'
                    : 'bg-[#0E1015] border-[#252B36] text-[#A4ABB6] hover:text-[#E6E8EB]'
                }`}
              >
                <Sparkles className="w-3 h-3 text-[#FF8A1F]" />
                <span>Auto Gravity Turn</span>
              </button>
            </div>
          </div>

          {/* Throttle & Propellant */}
          <div className="bg-[#1B1F28]/70 border border-[#252B36] rounded-lg p-3 space-y-3">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-[#A4ABB6] flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-[#FF8A1F]" />
                <span>Engine Throttle</span>
              </span>
              <span className="text-[#FF8A1F] font-mono-num font-semibold">{Math.round(flightState.throttle * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={flightState.throttle}
              onChange={e => setFlightThrottle(parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between gap-1 text-[10px]">
              <button
                onClick={() => setFlightThrottle(0)}
                className="flex-1 py-1 rounded bg-[#0E1015] hover:bg-[#222733] border border-[#252B36] text-[#A4ABB6] text-center"
              >
                Cutoff (X)
              </button>
              <button
                onClick={() => setFlightThrottle(0.5)}
                className="flex-1 py-1 rounded bg-[#0E1015] hover:bg-[#222733] border border-[#252B36] text-[#A4ABB6] text-center"
              >
                50%
              </button>
              <button
                onClick={() => setFlightThrottle(1.0)}
                className="flex-1 py-1 rounded bg-[#0E1015] hover:bg-[#222733] border border-[#252B36] text-[#FF8A1F] font-medium text-center"
              >
                100% (Z)
              </button>
            </div>

            <div className="border-t border-[#252B36] pt-2.5">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-[#A4ABB6]">Stage Fuel Remaining</span>
                <span className={`font-mono-num font-semibold ${flightState.fuelMassRemaining < 0.5 ? 'text-[#D95757]' : 'text-[#E6E8EB]'}`}>
                  {flightState.fuelMassRemaining.toFixed(1)} t
                </span>
              </div>
              <div className="w-full bg-[#0E1015] h-1.5 rounded-full overflow-hidden border border-[#252B36]">
                <div
                  className={`h-full transition-all duration-150 ${
                    flightState.fuelMassRemaining < 1.0 ? 'bg-[#D95757]' : 'bg-[#79AFC1]'
                  }`}
                  style={{
                    width: `${Math.min(
                      100,
                      (flightState.fuelMassRemaining / Math.max(1, currentStageInfo.stageFuelMassTons || 10)) * 100
                    )}%`
                  }}
                />
              </div>
            </div>
          </div>

          {/* Pitch Steering & Artificial Horizon */}
          <div className="bg-[#1B1F28]/70 border border-[#252B36] rounded-lg p-3 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-[#A4ABB6]">Pitch Angle (Steering)</span>
              <span className="text-[#FF8A1F] font-mono-num font-semibold">{flightState.pitch}°</span>
            </div>
            <input
              type="range"
              min="0"
              max="90"
              step="1"
              value={flightState.pitch}
              onChange={e => setFlightPitch(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-[#69717E]">
              <span>0° (Horizontal LEO)</span>
              <span>45° (Gravity Turn)</span>
              <span>90° (Vertical)</span>
            </div>
          </div>

          {/* Live Flight Telemetry HUD */}
          <div className="bg-[#1B1F28]/70 border border-[#252B36] rounded-lg p-3 space-y-2.5">
            <div className="flex items-center justify-between pb-1.5 border-b border-[#252B36]">
              <span className="font-medium text-[#E6E8EB] text-xs uppercase tracking-wider text-[11px]">Ascent Telemetry</span>
              <span className="text-[10px] font-mono-num text-[#79AFC1]">
                {flightState.altitude > 0 ? 'Active' : 'Standby'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="bg-[#0E1015] p-2 rounded border border-[#252B36]">
                <span className="text-[#69717E] block text-[10px] uppercase">Altitude</span>
                <span className="text-[#79AFC1] font-mono-num font-semibold text-xs mt-0.5 block">
                  {flightState.altitude >= 1000
                    ? `${(flightState.altitude / 1000).toFixed(2)} km`
                    : `${Math.round(flightState.altitude)} m`}
                </span>
              </div>
              <div className="bg-[#0E1015] p-2 rounded border border-[#252B36]">
                <span className="text-[#69717E] block text-[10px] uppercase">Speed</span>
                <span className="text-[#E6E8EB] font-mono-num font-semibold text-xs mt-0.5 block">
                  {Math.round(flightState.speed)} m/s
                </span>
              </div>
              <div className="bg-[#0E1015] p-2 rounded border border-[#252B36]">
                <span className="text-[#69717E] block text-[10px] uppercase">Vertical Speed</span>
                <span className="text-[#E6E8EB] font-mono-num font-semibold text-xs mt-0.5 block">
                  {flightState.verticalSpeed} m/s
                </span>
              </div>
              <div className="bg-[#0E1015] p-2 rounded border border-[#252B36]">
                <span className="text-[#69717E] block text-[10px] uppercase">Acceleration</span>
                <span className="text-[#FF8A1F] font-mono-num font-semibold text-xs mt-0.5 block">
                  {flightState.gForce} G
                </span>
              </div>
              <div className="bg-[#0E1015] p-2 rounded border border-[#252B36]">
                <span className="text-[#69717E] block text-[10px] uppercase">Apoapsis (Ap)</span>
                <span className="text-[#79AFC1] font-mono-num font-semibold text-xs mt-0.5 block">
                  {(flightState.apoapsis / 1000).toFixed(1)} km
                </span>
              </div>
              <div className="bg-[#0E1015] p-2 rounded border border-[#252B36]">
                <span className="text-[#69717E] block text-[10px] uppercase">Periapsis (Pe)</span>
                <span className="text-[#79AFC1] font-mono-num font-semibold text-xs mt-0.5 block">
                  {(flightState.periapsis / 1000).toFixed(1)} km
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#252B36]">
              <div className="flex justify-between text-[10px] text-[#A4ABB6] mb-1">
                <span>Dynamic Pressure (q)</span>
                <span className="text-[#D95757] font-mono-num font-semibold">{(flightState.dynamicPressure / 1000).toFixed(1)} kPa</span>
              </div>
              <div className="w-full bg-[#0E1015] h-1.5 rounded-full overflow-hidden border border-[#252B36]">
                <div
                  className="bg-[#D95757] h-full transition-all duration-150"
                  style={{ width: `${Math.min(100, (flightState.dynamicPressure / 40000) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Post-Flight Incident & Mission Telemetry Report Modal */}
      <FlightReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
      />
    </>
  );
};
