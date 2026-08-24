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
      <aside className="w-[300px] bg-[#121A26] border-r border-[#1C2938] flex flex-col h-full select-none text-xs shrink-0 z-20">
        <div className="p-3 border-b border-[#1C2938] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-[#38BDF8]" />
            <h2 className="font-semibold text-[#E8EDF2] text-xs tracking-tight">Flight Telemetry</h2>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsReportOpen(true)}
              className="p-1 rounded bg-[#172131] hover:bg-[#1B2838] border border-[#263548] text-[#9AA9B8] hover:text-[#E8EDF2]"
              title="Mission Report / Incident Telemetry"
            >
              <FileText className="w-3.5 h-3.5 text-[#38BDF8]" />
            </button>
            <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${
              flightState.aborted
                ? 'bg-[#F43F5E]/15 text-[#F43F5E]'
                : flightState.inOrbit 
                ? 'bg-[#34D399]/15 text-[#34D399]' 
                : flightState.isLaunched 
                ? 'bg-[#FBBF24]/15 text-[#FBBF24]' 
                : 'bg-[#172131] text-[#9AA9B8]'
            }`}>
              {flightState.aborted 
                ? 'Aborted' 
                : flightState.inOrbit 
                ? 'Stable Orbit' 
                : flightState.isLaunched 
                ? 'Ascent Phase' 
                : 'Pad Standby'}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* Abort Banner Notice */}
          {flightState.aborted && (
            <div className="p-2.5 bg-[#F43F5E]/10 border border-[#F43F5E]/30 rounded-lg flex items-center justify-between text-[#F43F5E]">
              <span className="flex items-center gap-1.5 font-semibold text-xs">
                <AlertOctagon className="w-4 h-4" />
                <span>Mission Aborted</span>
              </span>
              <button
                onClick={() => setIsReportOpen(true)}
                className="px-2 py-1 rounded bg-[#F43F5E] hover:bg-[#e11d48] text-[#0B0F17] font-semibold text-[11px] transition-colors"
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
                className="w-full py-2.5 rounded-md bg-[#34D399] hover:bg-[#2fc08a] text-[#0B0F17] font-semibold text-xs transition-all active:scale-98 flex items-center justify-center gap-2 shadow-sm"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Ignition & Launch (Space)</span>
              </button>
            ) : (
              <button
                onClick={triggerStaging}
                disabled={!hasMoreStages || flightState.aborted}
                className={`w-full py-2.5 rounded-md font-semibold text-xs transition-all active:scale-98 flex items-center justify-center gap-2 ${
                  hasMoreStages && !flightState.aborted
                    ? 'bg-[#38BDF8] hover:bg-[#2ea8dd] text-[#0B0F17]'
                    : 'bg-[#172131] text-[#64748B] border border-[#263548] cursor-not-allowed'
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
                className="flex-1 py-1.5 rounded-md bg-[#172131] hover:bg-[#1B2838] border border-[#263548] text-[#9AA9B8] hover:text-[#E8EDF2] flex items-center justify-center gap-1.5 transition-colors"
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
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  flightState.isLaunched && !flightState.aborted
                    ? 'bg-[#F43F5E]/15 hover:bg-[#F43F5E] text-[#F43F5E] hover:text-[#0B0F17] border border-[#F43F5E]/30 cursor-pointer'
                    : 'bg-[#172131] text-[#64748B] border border-[#263548] cursor-not-allowed'
                }`}
                title="Abort Mission"
              >
                Abort
              </button>
            </div>
          </div>

        {/* Guidance Mode Selector */}
        <div className="bg-[#172131]/60 border border-[#263548]/40 rounded-lg p-2.5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#9AA9B8]">Flight Guidance Mode</span>
            <span className="text-[10px] text-[#38BDF8] capitalize font-medium">{guidanceMode}</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => setGuidanceMode('manual')}
              className={`py-1 rounded text-xs font-medium border transition-colors ${
                guidanceMode === 'manual'
                  ? 'bg-[#1A3040] border-[#38BDF8]/60 text-[#38BDF8]'
                  : 'bg-[#172131] border-[#263548] text-[#9AA9B8] hover:text-[#E8EDF2]'
              }`}
            >
              Manual Steering
            </button>
            <button
              onClick={() => setGuidanceMode('auto')}
              className={`py-1 rounded text-xs font-medium border transition-colors flex items-center justify-center gap-1 ${
                guidanceMode === 'auto'
                  ? 'bg-[#1A3040] border-[#38BDF8]/60 text-[#38BDF8]'
                  : 'bg-[#172131] border-[#263548] text-[#9AA9B8] hover:text-[#E8EDF2]'
              }`}
            >
              <Sparkles className="w-3 h-3 text-[#FBBF24]" />
              <span>Auto Gravity Turn</span>
            </button>
          </div>
        </div>

        {/* Throttle & Propellant */}
        <div className="bg-[#172131]/60 border border-[#263548]/40 rounded-lg p-3 space-y-3">
          <div className="flex items-center justify-between text-xs font-medium">
            <span className="text-[#9AA9B8] flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-[#FBBF24]" />
              <span>Engine Throttle</span>
            </span>
            <span className="text-[#34D399] font-mono-num font-semibold">{Math.round(flightState.throttle * 100)}%</span>
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
              className="flex-1 py-1 rounded bg-[#172131] hover:bg-[#1B2838] border border-[#263548] text-[#9AA9B8] text-center"
            >
              Cutoff (X)
            </button>
            <button
              onClick={() => setFlightThrottle(0.5)}
              className="flex-1 py-1 rounded bg-[#172131] hover:bg-[#1B2838] border border-[#263548] text-[#9AA9B8] text-center"
            >
              50%
            </button>
            <button
              onClick={() => setFlightThrottle(1.0)}
              className="flex-1 py-1 rounded bg-[#172131] hover:bg-[#1B2838] border border-[#263548] text-[#34D399] font-medium text-center"
            >
              100% (Z)
            </button>
          </div>

          <div className="border-t border-[#1C2938] pt-2.5">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-[#9AA9B8]">Stage Fuel Remaining</span>
              <span className={`font-mono-num font-semibold ${flightState.fuelMassRemaining < 0.5 ? 'text-[#F43F5E]' : 'text-[#E8EDF2]'}`}>
                {flightState.fuelMassRemaining.toFixed(1)} t
              </span>
            </div>
            <div className="w-full bg-[#121A26] h-1.5 rounded-full overflow-hidden border border-[#263548]">
              <div
                className={`h-full transition-all duration-150 ${
                  flightState.fuelMassRemaining < 1.0 ? 'bg-[#F43F5E]' : 'bg-[#38BDF8]'
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
        <div className="bg-[#172131]/60 border border-[#263548]/40 rounded-lg p-3 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-medium">
            <span className="text-[#9AA9B8]">Pitch Angle (Steering)</span>
            <span className="text-[#38BDF8] font-mono-num font-semibold">{flightState.pitch}°</span>
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
          <div className="flex justify-between text-[10px] text-[#64748B]">
            <span>0° (Horizontal LEO)</span>
            <span>45° (Gravity Turn)</span>
            <span>90° (Vertical)</span>
          </div>
        </div>

        {/* Live Flight Telemetry HUD */}
        <div className="bg-[#172131]/60 border border-[#263548]/40 rounded-lg p-3 space-y-2.5">
          <div className="flex items-center justify-between pb-1.5 border-b border-[#1C2938]">
            <span className="font-medium text-[#E8EDF2] text-xs">Ascent Telemetry</span>
            <span className="text-[10px] font-mono-num text-[#38BDF8]">
              {flightState.altitude > 0 ? 'Active' : 'Standby'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="bg-[#121A26] p-2 rounded border border-[#263548]/40">
              <span className="text-[#64748B] block">Altitude</span>
              <span className="text-[#38BDF8] font-mono-num font-semibold text-xs mt-0.5 block">
                {flightState.altitude >= 1000
                  ? `${(flightState.altitude / 1000).toFixed(2)} km`
                  : `${Math.round(flightState.altitude)} m`}
              </span>
            </div>
            <div className="bg-[#121A26] p-2 rounded border border-[#263548]/40">
              <span className="text-[#64748B] block">Speed</span>
              <span className="text-[#34D399] font-mono-num font-semibold text-xs mt-0.5 block">
                {Math.round(flightState.speed)} m/s
              </span>
            </div>
            <div className="bg-[#121A26] p-2 rounded border border-[#263548]/40">
              <span className="text-[#64748B] block">Vertical Speed</span>
              <span className="text-[#E8EDF2] font-mono-num font-semibold text-xs mt-0.5 block">
                {flightState.verticalSpeed} m/s
              </span>
            </div>
            <div className="bg-[#121A26] p-2 rounded border border-[#263548]/40">
              <span className="text-[#64748B] block">Acceleration</span>
              <span className="text-[#FBBF24] font-mono-num font-semibold text-xs mt-0.5 block">
                {flightState.gForce} G
              </span>
            </div>
            <div className="bg-[#121A26] p-2 rounded border border-[#263548]/40">
              <span className="text-[#64748B] block">Apoapsis (Ap)</span>
              <span className="text-[#E8EDF2] font-mono-num font-semibold text-xs mt-0.5 block">
                {(flightState.apoapsis / 1000).toFixed(1)} km
              </span>
            </div>
            <div className="bg-[#121A26] p-2 rounded border border-[#263548]/40">
              <span className="text-[#64748B] block">Periapsis (Pe)</span>
              <span className="text-[#E8EDF2] font-mono-num font-semibold text-xs mt-0.5 block">
                {(flightState.periapsis / 1000).toFixed(1)} km
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-[#1C2938]">
            <div className="flex justify-between text-[10px] text-[#9AA9B8] mb-1">
              <span>Dynamic Pressure (q)</span>
              <span className="text-[#F43F5E] font-mono-num font-semibold">{(flightState.dynamicPressure / 1000).toFixed(1)} kPa</span>
            </div>
            <div className="w-full bg-[#121A26] h-1.5 rounded-full overflow-hidden border border-[#263548]">
              <div
                className="bg-[#F43F5E] h-full transition-all duration-150"
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
