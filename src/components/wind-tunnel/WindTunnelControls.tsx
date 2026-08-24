import React from 'react';
import { Wind, Compass, RotateCcw } from 'lucide-react';
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

  const rocketPitch = windTunnelState.rocketPitch || 0;
  const windAngle = windTunnelState.windAngle || 0;
  const effectiveAoA = windAngle - rocketPitch;

  return (
    <aside className="w-[300px] bg-[#121A26] border-r border-[#1C2938] flex flex-col h-full select-none text-xs shrink-0 z-20">
      <div className="p-3 border-b border-[#1C2938] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wind className="w-4 h-4 text-[#38BDF8]" />
          <h2 className="font-semibold text-[#E8EDF2] text-xs tracking-tight">Wind Tunnel Simulation</h2>
        </div>
        <span className="text-[10px] text-[#34D399] bg-[#34D399]/10 px-2 py-0.5 rounded font-medium">
          Active
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Diagnostic Mode */}
        <div className="space-y-1.5">
          <label className="text-[#64748B] text-[11px] font-semibold uppercase tracking-wider block">
            Visualization Field
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { id: 'streamlines', label: 'CFD Streamlines' },
              { id: 'thermal', label: 'Thermal Heatmap' },
              { id: 'pressure', label: 'Pressure Field' },
              { id: 'shockwaves', label: 'Schlieren Shock' },
              { id: 'turbulence', label: 'Vortex Eddies' }
            ].map(mode => (
              <button
                key={mode.id}
                onClick={() => setWindTunnelState({ visualizationMode: mode.id as any })}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium border transition-all text-left truncate ${
                  windTunnelState.visualizationMode === mode.id
                    ? 'bg-[#1A3040] border-[#38BDF8]/60 text-[#38BDF8]'
                    : 'bg-[#172131] border-[#263548]/40 text-[#9AA9B8] hover:text-[#E8EDF2] hover:bg-[#1B2838]'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        {/* 2 INDEPENDENT CONTROLS: ROCKET DIRECTION & WIND DIRECTION */}
        <div className="bg-[#172131]/60 border border-[#263548]/40 rounded-lg p-3 space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-[#1C2938]">
            <span className="font-medium text-[#E8EDF2] text-xs">Vector & Attitude Controls</span>
            <button
              onClick={() => setWindTunnelState({ rocketPitch: 0, windAngle: 0 })}
              title="Reset Angles to 0°"
              className="p-1 rounded hover:bg-[#1B2838] text-[#64748B] hover:text-[#38BDF8] transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>

          {/* Control 1: Rocket Pitch Attitude */}
          <div>
            <div className="flex items-center justify-between text-xs font-medium mb-1">
              <span className="text-[#9AA9B8] flex items-center gap-1">
                <Compass className="w-3.5 h-3.5 text-[#38BDF8]" />
                <span>Rocket Direction</span>
              </span>
              <span className="text-[#38BDF8] font-mono-num font-semibold">
                {rocketPitch > 0 ? `+${rocketPitch}°` : `${rocketPitch}°`}
              </span>
            </div>
            <input
              type="range"
              min="-35"
              max="35"
              step="1"
              value={rocketPitch}
              onChange={e => setWindTunnelState({ rocketPitch: parseInt(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-[#64748B] mt-0.5">
              <span>-35° Pitch Down</span>
              <span>0° Level</span>
              <span>+35° Pitch Up</span>
            </div>
          </div>

          {/* Control 2: Wind Inflow Direction */}
          <div className="border-t border-[#1C2938] pt-2.5">
            <div className="flex items-center justify-between text-xs font-medium mb-1">
              <span className="text-[#9AA9B8] flex items-center gap-1">
                <Wind className="w-3.5 h-3.5 text-[#34D399]" />
                <span>Wind Direction</span>
              </span>
              <span className="text-[#34D399] font-mono-num font-semibold">
                {windAngle > 0 ? `+${windAngle}°` : `${windAngle}°`}
              </span>
            </div>
            <input
              type="range"
              min="-35"
              max="35"
              step="1"
              value={windAngle}
              onChange={e => setWindTunnelState({ windAngle: parseInt(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-[#64748B] mt-0.5">
              <span>-35° Flow Down</span>
              <span>0° Horizontal</span>
              <span>+35° Flow Up</span>
            </div>
          </div>

          {/* Effective Relative Angle of Attack Badge */}
          <div className="bg-[#121A26] p-2 rounded border border-[#263548] flex items-center justify-between text-xs font-mono-num">
            <span className="text-[#64748B]">Effective AoA (α):</span>
            <span className={`font-semibold ${effectiveAoA === 0 ? 'text-[#34D399]' : 'text-[#FBBF24]'}`}>
              {effectiveAoA > 0 ? `+${effectiveAoA}°` : `${effectiveAoA}°`}
            </span>
          </div>
        </div>

        {/* Freestream Airspeed & Altitude */}
        <div className="bg-[#172131]/60 border border-[#263548]/40 rounded-lg p-3 space-y-3">
          <div className="flex items-center justify-between text-xs font-medium">
            <span className="text-[#9AA9B8]">Freestream Airspeed</span>
            <span className="text-[#38BDF8] font-mono-num font-semibold">Mach {windTunnelState.mach.toFixed(2)}</span>
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
          <div className="flex justify-between text-[10px] text-[#64748B]">
            <span>Subsonic (0.1)</span>
            <span>Transonic (1.0)</span>
            <span>Hypersonic (15.0)</span>
          </div>

          <div className="border-t border-[#1C2938] pt-2.5">
            <div className="flex items-center justify-between text-xs font-medium mb-1">
              <span className="text-[#9AA9B8]">Simulated Altitude</span>
              <span className="text-[#38BDF8] font-mono-num font-semibold">{(windTunnelState.altitude / 1000).toFixed(1)} km</span>
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
            <div className="flex justify-between text-[10px] text-[#64748B] mt-1">
              <span>Sea Level (0km)</span>
              <span>Stratosphere (30km)</span>
              <span>Mesosphere (90km)</span>
            </div>
          </div>
        </div>

        {/* Fin Control Deflection */}
        <div className="bg-[#172131]/60 border border-[#263548]/40 rounded-lg p-3 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-medium">
            <span className="text-[#9AA9B8]">Fin Deflection (δ)</span>
            <span className="text-[#38BDF8] font-mono-num font-semibold">
              {windTunnelState.finDeflectionAngle > 0 ? `+${windTunnelState.finDeflectionAngle}°` : `${windTunnelState.finDeflectionAngle}°`}
            </span>
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
        </div>

        {/* Nozzle Test Bench */}
        <div className="bg-[#172131]/60 border border-[#263548]/40 rounded-lg p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-medium text-[#E8EDF2] text-xs">Engine Hot-Fire Test</span>
            <button
              onClick={() => setWindTunnelState({ engineTestActive: !windTunnelState.engineTestActive })}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                windTunnelState.engineTestActive
                  ? 'bg-[#F43F5E] text-[#0B0F17]'
                  : 'bg-[#172131] border border-[#263548] text-[#9AA9B8]'
              }`}
            >
              {windTunnelState.engineTestActive ? 'Active' : 'Idle'}
            </button>
          </div>

          {windTunnelState.engineTestActive && (
            <div className="space-y-2 pt-1 border-t border-[#1C2938]">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#9AA9B8]">Chamber Pressure</span>
                <span className="text-[#FBBF24] font-mono-num font-semibold">{windTunnelState.nozzleChamberPressure} MPa</span>
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
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#9AA9B8]">Throttle</span>
                <span className="text-[#34D399] font-mono-num font-semibold">{Math.round(windTunnelState.engineThrottle * 100)}%</span>
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

        {/* Flight Regime Presets */}
        <div className="space-y-1.5">
          <label className="text-[#64748B] text-[11px] font-semibold uppercase tracking-wider block">
            Calibrated Regimes
          </label>
          <div className="space-y-1">
            {presets.map(p => (
              <button
                key={p.name}
                onClick={() => setWindTunnelState({ mach: p.mach, altitude: p.alt })}
                className="w-full text-left px-2.5 py-1.5 rounded-md bg-[#172131] hover:bg-[#1B2838] border border-[#263548]/40 text-[#9AA9B8] hover:text-[#E8EDF2] text-xs truncate transition-colors"
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
};
