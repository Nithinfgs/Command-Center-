import React, { useState } from 'react';
import { Wind, Compass, RotateCcw, Download } from 'lucide-react';
import { useSimulation } from '../../context/SimulationContext';
import { calculateAeroTelemetry } from '../../physics/aerodynamics';
import { ExportReportModal } from './ExportReportModal';

interface WindTunnelControlsProps {
  onClose?: () => void;
}

export const WindTunnelControls: React.FC<WindTunnelControlsProps> = ({ onClose }) => {
  const { windTunnelState, setWindTunnelState } = useSimulation();
  const [showExportModal, setShowExportModal] = useState(false);

  const liveAero = calculateAeroTelemetry(windTunnelState);

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
    <aside className="w-full lg:w-[300px] bg-[#151820] border-r border-[#252B36] flex flex-col h-full select-none text-xs shrink-0 z-20">
      <div className="p-3 border-b border-[#252B36] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wind className="w-4 h-4 text-[#FF8A1F]" />
          <h2 className="font-semibold text-[#E6E8EB] text-xs tracking-tight uppercase">CFD Aerodynamics</h2>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-1 px-2 py-1 rounded bg-[#1B1F28] hover:bg-[#222733] border border-[#252B36] text-[#79AFC1] hover:text-[#E6E8EB] text-[10px] font-medium transition-colors"
            title="Export Telemetry Data (CSV / JSON / Polar Curve)"
          >
            <Download className="w-3 h-3" />
            <span>Export</span>
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-1 rounded bg-[#1B1F28] text-[#A4ABB6] hover:text-[#E6E8EB] text-xs font-bold px-2 py-0.5"
            >
              ✕ Done
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Diagnostic Mode */}
        <div className="space-y-1.5">
          <label className="text-[#69717E] text-[11px] font-semibold uppercase tracking-wider block">
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
                className={`px-2.5 py-1.5 rounded text-xs font-medium border transition-all text-left truncate ${
                  windTunnelState.visualizationMode === mode.id
                    ? 'bg-[#1B1F28] border-[#FF8A1F] text-[#E6E8EB] font-semibold shadow-xs'
                    : 'bg-[#1B1F28]/60 border-[#252B36] text-[#A4ABB6] hover:text-[#E6E8EB] hover:bg-[#222733]'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        {/* 2 INDEPENDENT CONTROLS: ROCKET DIRECTION & WIND DIRECTION */}
        <div className="bg-[#1B1F28]/70 border border-[#252B36] rounded-lg p-3 space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-[#252B36]">
            <span className="font-medium text-[#E6E8EB] text-xs uppercase tracking-wider text-[11px]">Vector & Attitude Controls</span>
            <button
              onClick={() => setWindTunnelState({ rocketPitch: 0, windAngle: 0 })}
              title="Reset Angles to 0°"
              className="p-1 rounded hover:bg-[#222733] text-[#69717E] hover:text-[#FF8A1F] transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>

          {/* Control 1: Rocket Pitch Attitude */}
          <div>
            <div className="flex items-center justify-between text-xs font-medium mb-1">
              <span className="text-[#A4ABB6] flex items-center gap-1">
                <Compass className="w-3.5 h-3.5 text-[#FF8A1F]" />
                <span>Rocket Direction</span>
              </span>
              <span className="text-[#FF8A1F] font-mono-num font-semibold">
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
            <div className="flex justify-between text-[10px] text-[#69717E] mt-0.5">
              <span>-35° (Nose Down)</span>
              <span>0° (Level)</span>
              <span>+35° (Nose Up)</span>
            </div>
          </div>

          {/* Control 2: Wind Stream Angle */}
          <div className="border-t border-[#252B36] pt-2.5">
            <div className="flex items-center justify-between text-xs font-medium mb-1">
              <span className="text-[#A4ABB6] flex items-center gap-1">
                <Wind className="w-3.5 h-3.5 text-[#79AFC1]" />
                <span>Wind Vector</span>
              </span>
              <span className="text-[#79AFC1] font-mono-num font-semibold">
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
            <div className="flex justify-between text-[10px] text-[#69717E] mt-0.5">
              <span>-35° (Down Inflow)</span>
              <span>0° (Horizontal)</span>
              <span>+35° (Up Inflow)</span>
            </div>
          </div>

          {/* Effective AoA Result Badge */}
          <div className="bg-[#0E1015] p-2 rounded border border-[#252B36] flex items-center justify-between">
            <span className="text-[#69717E] text-[11px]">Effective AoA (α):</span>
            <span className={`font-mono-num font-bold text-xs ${
              Math.abs(effectiveAoA) > 18 ? 'text-[#D95757]' : Math.abs(effectiveAoA) > 10 ? 'text-[#E6B84D]' : 'text-[#55B982]'
            }`}>
              {effectiveAoA > 0 ? `+${effectiveAoA}°` : `${effectiveAoA}°`}
              <span className="text-[10px] font-normal ml-1 text-[#69717E]">
                {Math.abs(effectiveAoA) > 18 ? '(Stall Regime)' : '(Attached Flow)'}
              </span>
            </span>
          </div>
        </div>

        {/* Speed & Mach Slider */}
        <div className="bg-[#1B1F28]/70 border border-[#252B36] rounded-lg p-3 space-y-3">
          <div>
            <div className="flex items-center justify-between text-xs font-medium mb-1">
              <span className="text-[#A4ABB6]">Freestream Velocity</span>
              <span className="text-[#79AFC1] font-mono-num font-semibold">Mach {windTunnelState.mach.toFixed(2)}</span>
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
            <div className="flex justify-between text-[10px] text-[#69717E] mt-0.5">
              <span>Subsonic (0.4)</span>
              <span>Transonic (1.0)</span>
              <span>Mach 15</span>
            </div>
          </div>

          <div className="border-t border-[#252B36] pt-2.5">
            <div className="flex items-center justify-between text-xs font-medium mb-1">
              <span className="text-[#A4ABB6]">Altitude (Atmospheric Density)</span>
              <span className="text-[#E6E8EB] font-mono-num font-semibold">{(windTunnelState.altitude / 1000).toFixed(1)} km</span>
            </div>
            <input
              type="range"
              min="0"
              max="80000"
              step="1000"
              value={windTunnelState.altitude}
              onChange={e => setWindTunnelState({ altitude: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>
        </div>

        {/* Live Aerodynamic Telemetry */}
        <div className="bg-[#1B1F28]/70 border border-[#252B36] rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between pb-1 border-b border-[#252B36]">
            <span className="font-medium text-[#E6E8EB] text-xs uppercase tracking-wider text-[11px]">Aerodynamic Telemetry</span>
            <span className="text-[10px] font-mono-num text-[#79AFC1]">Real-time</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="bg-[#0E1015] p-2 rounded border border-[#252B36]">
              <span className="text-[#69717E] block text-[10px] uppercase">Drag Force</span>
              <span className="text-[#FF8A1F] font-mono-num font-semibold text-xs mt-0.5 block">
                {liveAero.dragForce} kN
              </span>
            </div>
            <div className="bg-[#0E1015] p-2 rounded border border-[#252B36]">
              <span className="text-[#69717E] block text-[10px] uppercase">Lift Force</span>
              <span className="text-[#79AFC1] font-mono-num font-semibold text-xs mt-0.5 block">
                {liveAero.liftForce} kN
              </span>
            </div>
            <div className="bg-[#0E1015] p-2 rounded border border-[#252B36]">
              <span className="text-[#69717E] block text-[10px] uppercase">Dynamic Pressure (q)</span>
              <span className="text-[#E6E8EB] font-mono-num font-semibold text-xs mt-0.5 block">
                {(windTunnelState.dynamicPressure / 1000).toFixed(1)} kPa
              </span>
            </div>
            <div className="bg-[#0E1015] p-2 rounded border border-[#252B36]">
              <span className="text-[#69717E] block text-[10px] uppercase">Peak Temp</span>
              <span className="text-[#E6E8EB] font-mono-num font-semibold text-xs mt-0.5 block">
                {liveAero.stagnationTemperature} K
              </span>
            </div>
          </div>
        </div>

        {/* Engine Plume Chemistry */}
        <div className="bg-[#1B1F28]/70 border border-[#252B36] rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between pb-1 border-b border-[#252B36]">
            <span className="font-medium text-[#E6E8EB] text-xs uppercase tracking-wider text-[11px]">Plume Chemistry</span>
            <span className="text-[10px] font-mono-num text-[#FF8A1F]">Hot Fire</span>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {[
              { id: 'kerolox', name: 'Kerolox (RP-1)' },
              { id: 'methalox', name: 'Methalox (CH4)' },
              { id: 'hydrolox', name: 'Hydrolox (LH2)' },
              { id: 'solid', name: 'Solid Motor' }
            ].map(fuel => (
              <button
                key={fuel.id}
                onClick={() => setWindTunnelState({ propellantChemistry: fuel.id as any })}
                className={`py-1 px-2 rounded text-[10px] font-medium border transition-all ${
                  (windTunnelState.propellantChemistry || 'kerolox') === fuel.id
                    ? 'bg-[#FF8A1F] text-[#090A0D] border-[#FF8A1F] font-bold'
                    : 'bg-[#0E1015] border-[#252B36] text-[#A4ABB6] hover:bg-[#1B1F28] hover:text-[#E6E8EB]'
                }`}
              >
                {fuel.name}
              </button>
            ))}
          </div>
        </div>

        {/* Flight Condition Presets */}
        <div className="space-y-1.5">
          <label className="text-[#69717E] text-[11px] font-semibold uppercase tracking-wider block">
            Flight Regimes
          </label>
          <div className="space-y-1">
            {presets.map((p, idx) => (
              <button
                key={idx}
                onClick={() => setWindTunnelState({ mach: p.mach, altitude: p.alt })}
                className="w-full text-left p-2 rounded bg-[#1B1F28]/60 hover:bg-[#222733] border border-[#252B36] text-[#A4ABB6] hover:text-[#E6E8EB] transition-colors"
              >
                <div className="font-medium text-xs text-[#E6E8EB]">{p.name}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <ExportReportModal 
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
      />
    </aside>
  );
};
