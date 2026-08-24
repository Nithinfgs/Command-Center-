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
    <div className="w-84 bg-[#0c121d] border-r border-[#1e293b] flex flex-col h-full select-none text-xs font-mono">
      <div className="p-3 border-b border-[#1e293b] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-[#38bdf8]" />
          <span className="font-bold text-slate-200 uppercase tracking-wider">FLIGHT COMMAND HUD</span>
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded font-semibold border ${
          flightState.inOrbit 
            ? 'bg-emerald-950/80 border-emerald-500 text-emerald-400' 
            : flightState.isLaunched 
            ? 'bg-amber-950/80 border-amber-500 text-amber-400' 
            : 'bg-[#182334] border-[#1e293b] text-slate-400'
        }`}>
          {flightState.inOrbit ? 'STABLE ORBIT' : flightState.isLaunched ? 'ASCENT PHASE' : 'ON LAUNCHPAD'}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        <div className="space-y-2">
          {!flightState.isLaunched ? (
            <button
              onClick={launchFlight}
              className="w-full py-3 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm uppercase tracking-wider shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" />
              <span>IGNITION & LAUNCH</span>
            </button>
          ) : (
            <button
              onClick={triggerStaging}
              className="w-full py-3 rounded bg-[#0284c7] hover:bg-[#0369a1] text-white font-black text-sm uppercase tracking-wider shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Layers className="w-4 h-4" />
              <span>TRIGGER STAGING (STAGE {flightState.currentStageIndex})</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={resetFlight}
              className="flex-1 py-1.5 rounded bg-[#182334] hover:bg-[#22324b] text-slate-300 border border-[#1e293b] flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>RESET LAUNCHPAD</span>
            </button>
            <button
              onClick={abortFlight}
              className="px-3 py-1.5 rounded bg-rose-950/70 hover:bg-rose-900 border border-rose-800 text-rose-300 font-bold"
              title="Abort Mission"
            >
              ABORT
            </button>
          </div>
        </div>

        <div className="bg-[#090d16] border border-[#1e293b] rounded p-3 space-y-2">
          <div className="flex items-center justify-between font-bold">
            <span className="text-slate-300">MAIN ENGINE THROTTLE</span>
            <span className="text-emerald-400 text-sm">{Math.round(flightState.throttle * 100)}%</span>
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
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>CUTOFF (0%)</span>
            <span>50%</span>
            <span>MAX THRUST (100%)</span>
          </div>
        </div>

        <div className="bg-[#090d16] border border-[#1e293b] rounded p-3 space-y-2">
          <div className="flex items-center justify-between font-bold">
            <span className="text-slate-300">VEHICLE PITCH ATTITUDE</span>
            <span className="text-[#38bdf8] text-sm">{flightState.pitch}°</span>
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
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>0° (Horizontal)</span>
            <span>45° (Gravity Turn)</span>
            <span>90° (Vertical)</span>
          </div>
        </div>

        <div className="bg-[#090d16] border border-[#1e293b] rounded p-3 space-y-2">
          <div className="flex items-center justify-between pb-1.5 border-b border-[#1e293b]">
            <span className="font-bold text-slate-200">TELEMETRY DOWNLINK</span>
            <span className="text-[10px] text-cyan-400">T+{flightState.altitude > 0 ? 'ACTIVE' : 'STANDBY'}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="bg-[#0c121d] p-1.5 rounded border border-[#1e293b]">
              <div className="text-slate-500">ALTITUDE</div>
              <div className="text-[#38bdf8] font-bold mt-0.5">
                {flightState.altitude >= 1000
                  ? `${(flightState.altitude / 1000).toFixed(2)} km`
                  : `${Math.round(flightState.altitude)} m`}
              </div>
            </div>
            <div className="bg-[#0c121d] p-1.5 rounded border border-[#1e293b]">
              <div className="text-slate-500">SPEED (v)</div>
              <div className="text-emerald-400 font-bold mt-0.5">{Math.round(flightState.speed)} m/s</div>
            </div>
            <div className="bg-[#0c121d] p-1.5 rounded border border-[#1e293b]">
              <div className="text-slate-500">VERTICAL VEL (V_y)</div>
              <div className="text-slate-200 font-bold mt-0.5">{flightState.verticalSpeed} m/s</div>
            </div>
            <div className="bg-[#0c121d] p-1.5 rounded border border-[#1e293b]">
              <div className="text-slate-500">ACCEL (G-FORCE)</div>
              <div className="text-amber-400 font-bold mt-0.5">{flightState.gForce} G</div>
            </div>
            <div className="bg-[#0c121d] p-1.5 rounded border border-[#1e293b]">
              <div className="text-slate-500">APOAPSIS (Ap)</div>
              <div className="text-purple-400 font-bold mt-0.5">{(flightState.apoapsis / 1000).toFixed(1)} km</div>
            </div>
            <div className="bg-[#0c121d] p-1.5 rounded border border-[#1e293b]">
              <div className="text-slate-500">PERIAPSIS (Pe)</div>
              <div className="text-cyan-400 font-bold mt-0.5">{(flightState.periapsis / 1000).toFixed(1)} km</div>
            </div>
          </div>

          <div className="pt-2 border-t border-[#1e293b]">
            <div className="flex justify-between text-[10px] text-slate-400 mb-1">
              <span>DYNAMIC PRESSURE (q)</span>
              <strong className="text-rose-400">{(flightState.dynamicPressure / 1000).toFixed(1)} kPa</strong>
            </div>
            <div className="w-full bg-[#1e293b] h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-rose-500 h-full transition-all duration-150"
                style={{ width: `${Math.min(100, (flightState.dynamicPressure / 40000) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
