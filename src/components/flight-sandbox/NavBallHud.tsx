import React from 'react';
import { 
  Compass, 
  RotateCcw, 
  Play, 
  Layers
} from 'lucide-react';
import { useSimulation } from '../../context/SimulationContext';

export const NavBallHud: React.FC = () => {
  const {
    flightState,
    launchFlight,
    triggerStaging,
    setFlightThrottle,
    setFlightPitch,
    abortFlight,
    resetFlight
  } = useSimulation();

  return (
    <aside className="w-[300px] bg-[#121A26] border-r border-[#1C2938] flex flex-col h-full select-none text-xs shrink-0 z-20">
      <div className="p-3 border-b border-[#1C2938] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-[#38BDF8]" />
          <h2 className="font-semibold text-[#E8EDF2] text-xs tracking-tight">Flight Telemetry</h2>
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${
          flightState.inOrbit 
            ? 'bg-[#34D399]/15 text-[#34D399]' 
            : flightState.isLaunched 
            ? 'bg-[#FBBF24]/15 text-[#FBBF24]' 
            : 'bg-[#172131] text-[#9AA9B8]'
        }`}>
          {flightState.inOrbit ? 'Stable Orbit' : flightState.isLaunched ? 'Ascent Phase' : 'Pad Standby'}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Launch / Staging Action */}
        <div className="space-y-2">
          {!flightState.isLaunched ? (
            <button
              onClick={launchFlight}
              className="w-full py-2.5 rounded-md bg-[#34D399] hover:bg-[#2fc08a] text-[#0B0F17] font-semibold text-xs transition-all active:scale-98 flex items-center justify-center gap-2"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Ignition & Launch</span>
            </button>
          ) : (
            <button
              onClick={triggerStaging}
              className="w-full py-2.5 rounded-md bg-[#38BDF8] hover:bg-[#2ea8dd] text-[#0B0F17] font-semibold text-xs transition-all active:scale-98 flex items-center justify-center gap-2"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Trigger Staging (Stage {flightState.currentStageIndex})</span>
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
              onClick={abortFlight}
              className="px-3 py-1.5 rounded-md bg-[#F43F5E]/15 hover:bg-[#F43F5E] text-[#F43F5E] hover:text-[#0B0F17] border border-[#F43F5E]/30 font-medium transition-colors"
              title="Abort Mission"
            >
              Abort
            </button>
          </div>
        </div>

        {/* Throttle Control */}
        <div className="bg-[#172131]/60 border border-[#263548]/40 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between text-xs font-medium">
            <span className="text-[#9AA9B8]">Engine Throttle</span>
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
          <div className="flex justify-between text-[10px] text-[#64748B]">
            <span>Cutoff (0%)</span>
            <span>50%</span>
            <span>Max (100%)</span>
          </div>
        </div>

        {/* Pitch Control */}
        <div className="bg-[#172131]/60 border border-[#263548]/40 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between text-xs font-medium">
            <span className="text-[#9AA9B8]">Pitch Attitude</span>
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
            <span>0° (Horizontal)</span>
            <span>45° (Gravity Turn)</span>
            <span>90° (Vertical)</span>
          </div>
        </div>

        {/* Telemetry Readouts */}
        <div className="bg-[#172131]/60 border border-[#263548]/40 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between pb-1.5 border-b border-[#1C2938]">
            <span className="font-medium text-[#E8EDF2] text-xs">Live Telemetry</span>
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
              <span className="text-[#64748B] block">Velocity</span>
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
  );
};
