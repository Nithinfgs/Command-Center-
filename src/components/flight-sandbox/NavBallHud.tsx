import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  RotateCcw, 
  Play, 
  Layers,
  Flame,
  FileText,
  AlertOctagon,
  FlameKindling,
  Keyboard
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

  useEffect(() => {
    if (flightState.aborted || flightState.isCrashed) {
      setIsReportOpen(true);
    }
  }, [flightState.aborted, flightState.isCrashed]);

  const currentStageInfo = calculateCurrentStageMassAndThrust(
    blueprint,
    flightState.currentStageIndex,
    flightState.altitude
  );

  const maxStage = Math.max(1, ...blueprint.parts.map(p => p.stage || 1));
  const hasMoreStages = flightState.currentStageIndex < maxStage;

  return (
    <>
      <aside className="w-[270px] 2xl:w-[300px] bg-[#151820] border-r border-[#252B36] flex flex-col h-full select-none text-xs shrink-0 z-20">
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
              flightState.isCrashed
                ? 'bg-[#D95757]/20 text-[#D95757] border border-[#D95757]/40'
                : flightState.aborted
                ? 'bg-[#D95757]/15 text-[#D95757]'
                : flightState.inOrbit 
                ? 'bg-[#55B982]/15 text-[#55B982]' 
                : flightState.isLaunched 
                ? 'bg-[#E6B84D]/15 text-[#E6B84D]' 
                : 'bg-[#1B1F28] text-[#A4ABB6]'
            }`}>
              {flightState.isCrashed
                ? '● VEHICLE IMPACT'
                : flightState.aborted 
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
          {/* Crash / Abort Notice */}
          {flightState.isCrashed && (
            <div className="p-2.5 bg-[#D95757]/15 border border-[#D95757]/40 rounded-lg flex items-center justify-between text-[#D95757]">
              <span className="flex items-center gap-1.5 font-semibold text-xs">
                <AlertOctagon className="w-4 h-4" />
                <span>STRUCTURAL FAILURE</span>
              </span>
              <button
                onClick={() => setIsReportOpen(true)}
                className="px-2 py-1 rounded bg-[#D95757] hover:bg-[#bf4343] text-[#090A0D] font-semibold text-[11px] transition-colors"
              >
                Report
              </button>
            </div>
          )}

          {/* Re-entry Heating Warning */}
          {flightState.vehicleSkinTempK > 800 && (
            <div className="p-2 bg-[#FF8A1F]/15 border border-[#FF8A1F]/40 rounded-lg flex items-center justify-between text-[#FF8A1F] text-[11px]">
              <span className="flex items-center gap-1 font-medium">
                <FlameKindling className="w-3.5 h-3.5 text-[#FF8A1F]" />
                <span>Plasma Compression:</span>
              </span>
              <span className="font-mono-num font-bold">{flightState.vehicleSkinTempK} K</span>
            </div>
          )}

          {/* Ignition & Abort Controls */}
          <div className="space-y-2">
            {!flightState.isLaunched ? (
              <button
                onClick={launchFlight}
                disabled={blueprint.parts.length === 0}
                className="w-full py-2.5 px-3 rounded-lg bg-[#FF8A1F] hover:bg-[#FFA24A] text-[#090A0D] font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 disabled:opacity-40"
              >
                <Play className="w-4 h-4 fill-current" />
                <span className="tracking-wide">IGNITION & LAUNCH (SPACE)</span>
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={triggerStaging}
                  disabled={!hasMoreStages || flightState.aborted}
                  className={`py-2 px-3 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all border ${
                    hasMoreStages && !flightState.aborted
                      ? 'bg-[#1B1F28] hover:bg-[#222733] border-[#79AFC1]/50 text-[#79AFC1]'
                      : 'bg-[#151820] border-[#252B36] text-[#69717E] cursor-not-allowed opacity-50'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Stage ({flightState.currentStageIndex}/{maxStage})</span>
                </button>

                <button
                  onClick={abortFlight}
                  disabled={flightState.aborted}
                  className="py-2 px-3 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all bg-[#D95757]/15 hover:bg-[#D95757]/25 text-[#D95757] border border-[#D95757]/40 disabled:opacity-40"
                >
                  <AlertOctagon className="w-3.5 h-3.5" />
                  <span>Abort</span>
                </button>
              </div>
            )}

            <button
              onClick={resetFlight}
              className="w-full py-1.5 px-3 rounded bg-[#1B1F28] hover:bg-[#222733] border border-[#252B36] text-[#A4ABB6] hover:text-[#E6E8EB] flex items-center justify-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#69717E]" />
              <span>Reset Vehicle to Pad (R)</span>
            </button>
          </div>

          {/* Guidance Mode */}
          <div className="bg-[#1B1F28]/70 border border-[#252B36] rounded-lg p-3 space-y-2">
            <span className="text-[#69717E] text-[10px] font-semibold uppercase tracking-wider block">
              Guidance & Trajectory Control
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => setGuidanceMode('manual')}
                className={`py-1.5 px-2 rounded text-center font-medium border transition-colors ${
                  guidanceMode === 'manual'
                    ? 'bg-[#151820] border-[#FF8A1F] text-[#E6E8EB]'
                    : 'bg-[#0E1015] border-[#252B36] text-[#A4ABB6] hover:text-[#E6E8EB]'
                }`}
              >
                Manual SAS (A/D)
              </button>
              <button
                onClick={() => setGuidanceMode('auto')}
                className={`py-1.5 px-2 rounded text-center font-medium border transition-colors ${
                  guidanceMode === 'auto'
                    ? 'bg-[#151820] border-[#FF8A1F] text-[#E6E8EB]'
                    : 'bg-[#0E1015] border-[#252B36] text-[#A4ABB6] hover:text-[#E6E8EB]'
                }`}
              >
                Prograde Turn
              </button>
            </div>
          </div>

          {/* Throttle Controls */}
          <div className="bg-[#1B1F28]/70 border border-[#252B36] rounded-lg p-3 space-y-3">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-[#A4ABB6] flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-[#FF8A1F]" />
                <span>Throttle</span>
              </span>
              <span className="text-[#FF8A1F] font-mono-num font-semibold">
                {Math.round(flightState.throttle * 100)}%
              </span>
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

          {/* Guidance Autopilot Mode */}
          <div className="bg-[#1B1F28]/70 border border-[#252B36] rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between pb-1 border-b border-[#252B36]">
              <span className="font-medium text-[#E6E8EB] text-xs uppercase tracking-wider text-[11px]">Guidance Mode</span>
              <span className="text-[10px] font-mono-num text-[#55B982]">SAS Active</span>
            </div>

            <div className="grid grid-cols-3 gap-1">
              {[
                { id: 'manual', label: 'Manual' },
                { id: 'auto', label: 'Gravity Turn' },
                { id: 'booster_recovery', label: 'Hoverslam' }
              ].map(m => (
                <button
                  key={m.id}
                  onClick={() => setGuidanceMode(m.id as any)}
                  className={`py-1 px-1.5 rounded text-[10px] font-medium border transition-all text-center ${
                    guidanceMode === m.id
                      ? 'bg-[#FF8A1F] text-[#090A0D] border-[#FF8A1F] font-bold'
                      : 'bg-[#0E1015] border-[#252B36] text-[#A4ABB6] hover:bg-[#1B1F28] hover:text-[#E6E8EB]'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Bidirectional Pitch Steering & Artificial Horizon */}
          <div className="bg-[#1B1F28]/70 border border-[#252B36] rounded-lg p-3 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-[#A4ABB6]">Pitch Steering (Bidirectional)</span>
              <span className="text-[#FF8A1F] font-mono-num font-semibold">
                {flightState.pitch}° {flightState.pitch === 90 ? '(Vertical)' : flightState.pitch < 90 ? '(East / Right)' : '(West / Left)'}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="180"
              step="1"
              value={flightState.pitch}
              onChange={e => setFlightPitch(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-[#69717E]">
              <span className="text-[#79AFC1]">0° (East Horiz →)</span>
              <span>45° (East)</span>
              <span className="text-[#34D399] font-medium">90° (Zenith ↑)</span>
              <span>135° (West)</span>
              <span className="text-[#E6B84D]">180° (← West / Retro)</span>
            </div>

            {/* Quick Angle Preset Buttons */}
            <div className="grid grid-cols-5 gap-1 pt-1">
              <button
                type="button"
                onClick={() => setFlightPitch(Math.min(180, flightState.pitch + 5))}
                className="py-1 px-1 rounded text-[10px] font-medium bg-[#0E1015] border border-[#252B36] text-[#A4ABB6] hover:text-[#E6E8EB] hover:bg-[#1B1F28] transition-colors"
                title="Nudge Left / West (+5°)"
              >
                +5° W
              </button>
              <button
                type="button"
                onClick={() => setFlightPitch(135)}
                className={`py-1 px-1 rounded text-[10px] font-medium border transition-colors ${
                  flightState.pitch === 135
                    ? 'bg-[#FF8A1F] text-[#090A0D] border-[#FF8A1F] font-bold'
                    : 'bg-[#0E1015] border-[#252B36] text-[#A4ABB6] hover:text-[#E6E8EB]'
                }`}
                title="135° West Pitch"
              >
                135° W
              </button>
              <button
                type="button"
                onClick={() => setFlightPitch(90)}
                className={`py-1 px-1 rounded text-[10px] font-medium border transition-colors ${
                  flightState.pitch === 90
                    ? 'bg-[#34D399] text-[#090A0D] border-[#34D399] font-bold'
                    : 'bg-[#0E1015] border-[#252B36] text-[#A4ABB6] hover:text-[#E6E8EB]'
                }`}
                title="90° Vertical SAS"
              >
                90° UP
              </button>
              <button
                type="button"
                onClick={() => setFlightPitch(45)}
                className={`py-1 px-1 rounded text-[10px] font-medium border transition-colors ${
                  flightState.pitch === 45
                    ? 'bg-[#FF8A1F] text-[#090A0D] border-[#FF8A1F] font-bold'
                    : 'bg-[#0E1015] border-[#252B36] text-[#A4ABB6] hover:text-[#E6E8EB]'
                }`}
                title="45° East Orbit Pitch"
              >
                45° E
              </button>
              <button
                type="button"
                onClick={() => setFlightPitch(Math.max(0, flightState.pitch - 5))}
                className="py-1 px-1 rounded text-[10px] font-medium bg-[#0E1015] border border-[#252B36] text-[#A4ABB6] hover:text-[#E6E8EB] hover:bg-[#1B1F28] transition-colors"
                title="Nudge Right / East (-5°)"
              >
                -5° E
              </button>
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
                  {flightState.isEscapeTrajectory || !isFinite(flightState.apoapsis)
                    ? '∞ (Escape)'
                    : `${(flightState.apoapsis / 1000).toFixed(1)} km`}
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
                <span className="text-[#FF8A1F] font-mono-num font-semibold">{(flightState.dynamicPressure / 1000).toFixed(1)} kPa</span>
              </div>
              <div className="w-full bg-[#0E1015] h-1.5 rounded-full overflow-hidden border border-[#252B36]">
                <div
                  className="bg-[#FF8A1F] h-full transition-all duration-150"
                  style={{ width: `${Math.min(100, (flightState.dynamicPressure / 40000) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Keybindings Legend */}
          <div className="bg-[#0E1015] border border-[#252B36] rounded-lg p-2.5 text-[10px] text-[#69717E] space-y-1">
            <div className="flex items-center gap-1 text-[#A4ABB6] font-semibold mb-1">
              <Keyboard className="w-3 h-3 text-[#79AFC1]" />
              <span>Flight Hotkeys</span>
            </div>
            <div className="flex justify-between"><span>Space</span><span className="text-[#E6E8EB]">Launch / Staging</span></div>
            <div className="flex justify-between"><span>Z / X</span><span className="text-[#E6E8EB]">100% / Cutoff Throttle</span></div>
            <div className="flex justify-between"><span>A / D (← / →)</span><span className="text-[#E6E8EB]">Pitch Steering</span></div>
            <div className="flex justify-between"><span>Shift / Ctrl</span><span className="text-[#E6E8EB]">Throttle Up / Down</span></div>
          </div>
        </div>
      </aside>

      <FlightReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
      />
    </>
  );
};
