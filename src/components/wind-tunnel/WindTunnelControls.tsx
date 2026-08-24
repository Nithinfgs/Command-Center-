import React from 'react';
import { Wind } from 'lucide-react';
import { useSimulation } from '../../context/SimulationContext';

export const WindTunnelControls: React.FC = () => {
  const { windTunnelState, setWindTunnelState } = useSimulation();

  const presets = [
    { name: 'Sea Level Subsonic (Mach 0.4)', mach: 0.4, alt: 0 },
    { name: 'Transonic Max-Q (Mach 1.2, 11km)', mach: 1.2, alt: 11000 },
    { name: 'Supersonic Booster (Mach 3.5, 30km)', mach: 3.5, alt: 30000 },
    { name: 'Hypersonic Re-entry (Mach 8.0, 60km)', mach: 8.0, alt: 60000 },
    { name: 'Extreme Orbit Decay (Mach 15.0, 80km)', mach: 15.0, alt: 80000 }
  ];

  return (
    <div className="w-84 bg-[#0c121d] border-r border-[#1e293b] flex flex-col h-full select-none text-xs font-mono">
      <div className="p-3 border-b border-[#1e293b] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wind className="w-4 h-4 text-[#38bdf8]" />
          <span className="font-bold text-slate-200 uppercase tracking-wider">WIND TUNNEL CFD</span>
        </div>
        <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded font-semibold">
          FLOW ACTIVE
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        <div>
          <label className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block mb-1.5">
            OPTICAL DIAGNOSTIC MODE
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { id: 'streamlines', label: 'CFD Streamlines' },
              { id: 'thermal', label: 'Thermal Heatmap' },
              { id: 'shockwaves', label: 'Schlieren Shock' },
              { id: 'pressure', label: 'Pressure Field' },
              { id: 'turbulence', label: 'Vortex Eddies' }
            ].map(mode => (
              <button
                key={mode.id}
                onClick={() => setWindTunnelState({ visualizationMode: mode.id as any })}
                className={`px-2 py-1.5 rounded text-[10px] font-semibold border transition-all text-left truncate ${
                  windTunnelState.visualizationMode === mode.id
                    ? 'bg-[#182334] border-[#38bdf8] text-[#38bdf8]'
                    : 'bg-[#090d16] border-[#1e293b] text-slate-400 hover:text-slate-200'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-[#090d16] border border-[#1e293b] rounded p-3 space-y-3">
          <div className="flex items-center justify-between text-slate-300 font-bold">
            <span>FREESTREAM AIRSPEED</span>
            <span className="text-[#38bdf8] text-sm">Mach {windTunnelState.mach.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="15.0"
            step="0.05"
            value={windTunnelState.mach}
            onChange={e => setWindTunnelState({ mach: parseFloat(e.target.value) })}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>Subsonic (0.1)</span>
            <span>Transonic (1.0)</span>
            <span>Hypersonic (15.0)</span>
          </div>

          <div className="border-t border-[#1e293b] pt-2.5">
            <div className="flex items-center justify-between text-slate-300 font-bold mb-1">
              <span>ANGLE OF ATTACK (\alpha)</span>
              <span className="text-amber-400">{windTunnelState.angleToGo > 0 ? `+${windTunnelState.angleToGo}°` : `${windTunnelState.angleToGo}°`}</span>
            </div>
            <input
              type="range"
              min="-35"
              max="35"
              step="1"
              value={windTunnelState.angleToGo}
              onChange={e => setWindTunnelState({ angleToGo: parseInt(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>-35° Pitch Down</span>
              <span>0° Prograde</span>
              <span>+35° Pitch Up</span>
            </div>
          </div>

          <div className="border-t border-[#1e293b] pt-2.5">
            <div className="flex items-center justify-between text-slate-300 font-bold mb-1">
              <span>SIMULATED ALTITUDE</span>
              <span className="text-cyan-400">{(windTunnelState.altitude / 1000).toFixed(1)} km</span>
            </div>
            <input
              type="range"
              min="0"
              max="90000"
              step="1000"
              value={windTunnelState.altitude}
              onChange={e => setWindTunnelState({ altitude: parseInt(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>Sea Level (0km)</span>
              <span>Stratosphere (30km)</span>
              <span>Mesosphere (90km)</span>
            </div>
          </div>
        </div>

        <div className="bg-[#090d16] border border-[#1e293b] rounded p-3 space-y-2.5">
          <div className="flex items-center justify-between text-slate-300 font-bold">
            <span>FIN DEFLECTION (\delta_{'{fin}'})</span>
            <span className="text-purple-400">{windTunnelState.finDeflectionAngle > 0 ? `+${windTunnelState.finDeflectionAngle}°` : `${windTunnelState.finDeflectionAngle}°`}</span>
          </div>
          <input
            type="range"
            min="-20"
            max="20"
            step="1"
            value={windTunnelState.finDeflectionAngle}
            onChange={e => setWindTunnelState({ finDeflectionAngle: parseInt(e.target.value) })}
            className="w-full"
          />
          <div className="text-[10px] text-slate-500">
            Dynamically adjust aerodynamic steering fin deflection to test restoring authority.
          </div>
        </div>

        <div className="bg-[#090d16] border border-[#1e293b] rounded p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-300">NOZZLE TEST BENCH</span>
            <button
              onClick={() => setWindTunnelState({ engineTestActive: !windTunnelState.engineTestActive })}
              className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                windTunnelState.engineTestActive
                  ? 'bg-rose-950/80 border-rose-500 text-rose-300'
                  : 'bg-[#182334] border-[#1e293b] text-slate-400'
              }`}
            >
              {windTunnelState.engineTestActive ? 'HOT FIRE (ON)' : 'IDLE (OFF)'}
            </button>
          </div>

          {windTunnelState.engineTestActive && (
            <div className="space-y-2 pt-1 border-t border-[#1e293b]">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">CHAMBER PRESSURE</span>
                <span className="text-amber-400 font-bold">{windTunnelState.nozzleChamberPressure} MPa</span>
              </div>
              <input
                type="range"
                min="5"
                max="30"
                step="1"
                value={windTunnelState.nozzleChamberPressure}
                onChange={e => setWindTunnelState({ nozzleChamberPressure: parseFloat(e.target.value) })}
                className="w-full"
              />
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">THROTTLE</span>
                <span className="text-emerald-400 font-bold">{Math.round(windTunnelState.engineThrottle * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.4"
                max="1.0"
                step="0.05"
                value={windTunnelState.engineThrottle}
                onChange={e => setWindTunnelState({ engineThrottle: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>
          )}
        </div>

        <div>
          <label className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block mb-1.5">
            CALIBRATED REGIMES
          </label>
          <div className="space-y-1">
            {presets.map(p => (
              <button
                key={p.name}
                onClick={() => setWindTunnelState({ mach: p.mach, altitude: p.alt })}
                className="w-full text-left px-2.5 py-1.5 rounded bg-[#090d16] hover:bg-[#131b2b] border border-[#1e293b] text-slate-300 text-[11px] truncate transition-colors"
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
