import React, { useState } from 'react';
import { 
  Download, 
  FileSpreadsheet, 
  FileCode, 
  Camera, 
  Copy, 
  CheckCircle2, 
  X, 
  TrendingUp,
  Table
} from 'lucide-react';
import { useSimulation } from '../../context/SimulationContext';
import { calculateAeroTelemetry } from '../../physics/aerodynamics';
import { calculateRocketProperties } from '../../physics/rocket-math';

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  canvasRef?: React.RefObject<HTMLCanvasElement | null>;
}

export const ExportReportModal: React.FC<ExportReportModalProps> = ({
  isOpen,
  onClose,
  canvasRef
}) => {
  const { blueprint, windTunnelState } = useSimulation();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'current' | 'polar'>('current');

  if (!isOpen) return null;

  const currentAero = calculateAeroTelemetry(windTunnelState);
  const rocketProps = calculateRocketProperties(blueprint);
  const effectiveAoA = (windTunnelState.windAngle || 0) - (windTunnelState.rocketPitch || 0);

  // Generate multi-point AoA Polar Sweep (-30° to +30° in 5° steps)
  const polarSweepData = React.useMemo(() => {
    const sweep = [];
    for (let aoa = -30; aoa <= 30; aoa += 5) {
      const mockState = {
        ...windTunnelState,
        angleToGo: aoa,
        windAngle: aoa,
        rocketPitch: 0
      };
      const telemetry = calculateAeroTelemetry(mockState);
      sweep.push({
        aoa,
        mach: windTunnelState.mach,
        altitudeKm: (windTunnelState.altitude / 1000).toFixed(1),
        dragCoeff: telemetry.dragCoefficient,
        liftCoeff: telemetry.liftCoefficient,
        ldRatio: telemetry.liftToDragRatio,
        dragKn: telemetry.dragForce,
        liftKn: telemetry.liftForce,
        stagTempK: telemetry.stagnationTemperature,
        heatFluxKw: telemetry.maxHeatFlux,
        pitchMoment: telemetry.aerodynamicMoment
      });
    }
    return sweep;
  }, [windTunnelState]);

  // Export current state as CSV
  const handleExportCSV = () => {
    const rows = [
      ['METRIC', 'VALUE', 'UNIT'],
      ['Vehicle Name', blueprint.name, ''],
      ['Vehicle Mass (Total)', rocketProps.totalMass.toFixed(2), 't'],
      ['Vehicle Mass (Dry)', rocketProps.dryMass.toFixed(2), 't'],
      ['Components Count', blueprint.parts.length.toString(), ''],
      ['Freestream Mach', windTunnelState.mach.toFixed(2), 'M'],
      ['Freestream Airspeed', windTunnelState.freestreamSpeed.toFixed(1), 'm/s'],
      ['Simulated Altitude', (windTunnelState.altitude / 1000).toFixed(2), 'km'],
      ['Air Density', windTunnelState.airDensity.toFixed(4), 'kg/m^3'],
      ['Air Temperature', windTunnelState.airTemperature.toFixed(1), 'K'],
      ['Dynamic Pressure (q)', (windTunnelState.dynamicPressure / 1000).toFixed(2), 'kPa'],
      ['Rocket Pitch Attitude', (windTunnelState.rocketPitch || 0).toString(), 'deg'],
      ['Wind Inflow Angle', (windTunnelState.windAngle || 0).toString(), 'deg'],
      ['Effective Angle of Attack (alpha)', effectiveAoA.toString(), 'deg'],
      ['Fin Deflection Angle', windTunnelState.finDeflectionAngle.toString(), 'deg'],
      ['Drag Coefficient (Cd)', currentAero.dragCoefficient.toString(), ''],
      ['Lift Coefficient (Cl)', currentAero.liftCoefficient.toString(), ''],
      ['Lift-to-Drag Ratio (L/D)', currentAero.liftToDragRatio.toString(), ''],
      ['Total Aerodynamic Drag', currentAero.dragForce.toString(), 'kN'],
      ['Total Aerodynamic Lift', currentAero.liftForce.toString(), 'kN'],
      ['Stagnation Temperature', currentAero.stagnationTemperature.toString(), 'K'],
      ['Peak Stagnation Heat Flux', currentAero.maxHeatFlux.toString(), 'kW/m^2'],
      ['Shockwave Angle (beta)', currentAero.shockwaveAngle.toString(), 'deg'],
      ['Pitching Moment (My)', currentAero.aerodynamicMoment.toString(), 'kN*m']
    ];

    const csvContent = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `CFD_Telemetry_${blueprint.name.replace(/\s+/g, '_')}_Mach${windTunnelState.mach}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export polar curve sweep as CSV
  const handleExportPolarCSV = () => {
    const headers = [
      'AoA_deg',
      'Mach',
      'Altitude_km',
      'Drag_Cd',
      'Lift_Cl',
      'L_D_Ratio',
      'Drag_kN',
      'Lift_kN',
      'Stagnation_Temp_K',
      'Heat_Flux_kW_m2',
      'Pitch_Moment_kNm'
    ];

    const rows = polarSweepData.map(p => [
      p.aoa,
      p.mach,
      p.altitudeKm,
      p.dragCoeff,
      p.liftCoeff,
      p.ldRatio,
      p.dragKn,
      p.liftKn,
      p.stagTempK,
      p.heatFluxKw,
      p.pitchMoment
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Aerodynamic_Polar_Sweep_${blueprint.name.replace(/\s+/g, '_')}_Mach${windTunnelState.mach}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export full JSON dataset
  const handleExportJSON = () => {
    const reportData = {
      reportType: 'Mission Control Aerospace CFD Telemetry Export',
      timestamp: new Date().toISOString(),
      vehicle: {
        id: blueprint.id,
        name: blueprint.name,
        totalMassTons: rocketProps.totalMass,
        dryMassTons: rocketProps.dryMass,
        partsCount: blueprint.parts.length,
        components: blueprint.parts
      },
      flightCondition: {
        mach: windTunnelState.mach,
        airspeedMs: windTunnelState.freestreamSpeed,
        altitudeM: windTunnelState.altitude,
        airDensityKgM3: windTunnelState.airDensity,
        airTemperatureK: windTunnelState.airTemperature,
        dynamicPressurePa: windTunnelState.dynamicPressure,
        rocketPitchDeg: windTunnelState.rocketPitch || 0,
        windAngleDeg: windTunnelState.windAngle || 0,
        effectiveAoADeg: effectiveAoA,
        finDeflectionDeg: windTunnelState.finDeflectionAngle,
        engineHotFireActive: windTunnelState.engineTestActive,
        nozzleChamberPressureMpa: windTunnelState.nozzleChamberPressure
      },
      aerodynamicResults: currentAero,
      polarSweepCurve: polarSweepData
    };

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(reportData, null, 2))}`;
    const link = document.createElement('a');
    link.setAttribute('href', jsonString);
    link.setAttribute('download', `CFD_Dataset_${blueprint.name.replace(/\s+/g, '_')}_Mach${windTunnelState.mach}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download high-resolution PNG snapshot of the CFD canvas
  const handleDownloadSnapshot = () => {
    if (!canvasRef?.current) return;
    const canvas = canvasRef.current;
    const image = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.setAttribute('href', image);
    link.setAttribute('download', `CFD_Snapshot_${blueprint.name.replace(/\s+/g, '_')}_Mach${windTunnelState.mach}.png`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyMarkdown = () => {
    const markdownTable = `
### Aerodynamic CFD Telemetry Report — ${blueprint.name}
**Mach**: ${windTunnelState.mach.toFixed(2)} | **Altitude**: ${(windTunnelState.altitude / 1000).toFixed(1)} km | **AoA (α)**: ${effectiveAoA}°

| Metric | Measured Value | Unit |
| :--- | :--- | :--- |
| **Drag Coefficient ($C_d$)** | \`${currentAero.dragCoefficient}\` | — |
| **Lift Coefficient ($C_l$)** | \`${currentAero.liftCoefficient}\` | — |
| **L/D Efficiency** | \`${currentAero.liftToDragRatio}\` | — |
| **Total Drag Force** | \`${currentAero.dragForce} kN\` | kN |
| **Total Lift Force** | \`${currentAero.liftForce} kN\` | kN |
| **Stagnation Temperature** | \`${currentAero.stagnationTemperature} K\` | K |
| **Heat Flux** | \`${currentAero.maxHeatFlux} kW/m²\` | kW/m² |
| **Shockwave Angle (β)** | \`${currentAero.shockwaveAngle}°\` | deg |
| **Pitching Moment ($M_y$)** | \`${currentAero.aerodynamicMoment} kN·m\` | kN·m |
| **Dynamic Pressure ($q$)** | \`${(windTunnelState.dynamicPressure / 1000).toFixed(1)} kPa\` | kPa |
    `.trim();

    navigator.clipboard.writeText(markdownTable);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 bg-[#0B0F17]/85 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-[#121A26] border border-[#263548] rounded-xl max-w-2xl w-full p-4 shadow-2xl flex flex-col max-h-[85vh] select-none text-xs">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#1C2938]">
          <div>
            <h3 className="font-semibold text-[#E8EDF2] text-sm flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-[#38BDF8]" />
              <span>Export Simulation Telemetry</span>
            </h3>
            <p className="text-xs text-[#9AA9B8] mt-0.5">
              Export aerodynamic coefficients, thermal flux, and polar curves
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-[#64748B] hover:text-[#E8EDF2] p-1 rounded hover:bg-[#172131]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex gap-2 my-3">
          <button
            onClick={() => setActiveTab('current')}
            className={`px-3 py-1.5 rounded-md font-medium text-xs transition-colors flex items-center gap-1.5 ${
              activeTab === 'current'
                ? 'bg-[#172131] text-[#38BDF8] border border-[#38BDF8]/40'
                : 'bg-[#0B0F17] text-[#9AA9B8] hover:text-[#E8EDF2]'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Current Test Point</span>
          </button>

          <button
            onClick={() => setActiveTab('polar')}
            className={`px-3 py-1.5 rounded-md font-medium text-xs transition-colors flex items-center gap-1.5 ${
              activeTab === 'polar'
                ? 'bg-[#172131] text-[#38BDF8] border border-[#38BDF8]/40'
                : 'bg-[#0B0F17] text-[#9AA9B8] hover:text-[#E8EDF2]'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>AoA Polar Curve Sweep (-30° to +30°)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {activeTab === 'current' ? (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-[#172131] p-2.5 rounded-lg border border-[#263548]/40">
                  <span className="text-[#64748B] block text-[11px]">Mach & Airspeed</span>
                  <span className="text-[#38BDF8] font-mono-num font-semibold text-sm mt-0.5 block">
                    M {windTunnelState.mach.toFixed(2)} ({Math.round(windTunnelState.freestreamSpeed)} m/s)
                  </span>
                </div>
                <div className="bg-[#172131] p-2.5 rounded-lg border border-[#263548]/40">
                  <span className="text-[#64748B] block text-[11px]">Effective AoA (α)</span>
                  <span className="text-[#FBBF24] font-mono-num font-semibold text-sm mt-0.5 block">
                    {effectiveAoA > 0 ? `+${effectiveAoA}°` : `${effectiveAoA}°`}
                  </span>
                </div>
                <div className="bg-[#172131] p-2.5 rounded-lg border border-[#263548]/40">
                  <span className="text-[#64748B] block text-[11px]">Aerodynamic L/D</span>
                  <span className="text-[#34D399] font-mono-num font-semibold text-sm mt-0.5 block">
                    {currentAero.liftToDragRatio}
                  </span>
                </div>
              </div>

              {/* Data Table */}
              <div className="bg-[#172131]/60 border border-[#263548]/40 rounded-lg overflow-hidden">
                <table className="w-full text-left font-mono-num text-xs">
                  <thead className="bg-[#172131] border-b border-[#263548]/60 text-[#9AA9B8] text-[11px]">
                    <tr>
                      <th className="p-2">Parameter</th>
                      <th className="p-2">Value</th>
                      <th className="p-2">Unit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1C2938] text-[#E8EDF2]">
                    <tr>
                      <td className="p-2 text-[#9AA9B8]">Drag Coefficient (Cd)</td>
                      <td className="p-2 font-medium text-[#F43F5E]">{currentAero.dragCoefficient}</td>
                      <td className="p-2 text-[#64748B]">—</td>
                    </tr>
                    <tr>
                      <td className="p-2 text-[#9AA9B8]">Lift Coefficient (Cl)</td>
                      <td className="p-2 font-medium text-[#34D399]">{currentAero.liftCoefficient}</td>
                      <td className="p-2 text-[#64748B]">—</td>
                    </tr>
                    <tr>
                      <td className="p-2 text-[#9AA9B8]">Aerodynamic Drag Force</td>
                      <td className="p-2 font-medium text-[#F43F5E]">{currentAero.dragForce}</td>
                      <td className="p-2 text-[#64748B]">kN</td>
                    </tr>
                    <tr>
                      <td className="p-2 text-[#9AA9B8]">Aerodynamic Lift Force</td>
                      <td className="p-2 font-medium text-[#34D399]">{currentAero.liftForce}</td>
                      <td className="p-2 text-[#64748B]">kN</td>
                    </tr>
                    <tr>
                      <td className="p-2 text-[#9AA9B8]">Stagnation Temperature</td>
                      <td className="p-2 font-medium text-[#FBBF24]">{currentAero.stagnationTemperature}</td>
                      <td className="p-2 text-[#64748B]">K</td>
                    </tr>
                    <tr>
                      <td className="p-2 text-[#9AA9B8]">Stagnation Heat Flux</td>
                      <td className="p-2 font-medium text-[#F43F5E]">{currentAero.maxHeatFlux}</td>
                      <td className="p-2 text-[#64748B]">kW/m²</td>
                    </tr>
                    <tr>
                      <td className="p-2 text-[#9AA9B8]">Shockwave Conical Angle</td>
                      <td className="p-2 font-medium text-[#38BDF8]">{currentAero.shockwaveAngle}</td>
                      <td className="p-2 text-[#64748B]">deg</td>
                    </tr>
                    <tr>
                      <td className="p-2 text-[#9AA9B8]">Pitching Moment (My)</td>
                      <td className="p-2 font-medium">{currentAero.aerodynamicMoment}</td>
                      <td className="p-2 text-[#64748B]">kN·m</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-[#172131]/60 border border-[#263548]/40 rounded-lg overflow-x-auto">
                <table className="w-full text-left font-mono-num text-xs">
                  <thead className="bg-[#172131] border-b border-[#263548]/60 text-[#9AA9B8] text-[11px]">
                    <tr>
                      <th className="p-2">AoA (α)</th>
                      <th className="p-2">Cd</th>
                      <th className="p-2">Cl</th>
                      <th className="p-2">L/D</th>
                      <th className="p-2">Drag (kN)</th>
                      <th className="p-2">Lift (kN)</th>
                      <th className="p-2">Moment (kN·m)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1C2938] text-[#E8EDF2]">
                    {polarSweepData.map(p => (
                      <tr key={p.aoa} className={p.aoa === effectiveAoA ? 'bg-[#1A3040] font-semibold' : ''}>
                        <td className="p-2 font-medium text-[#38BDF8]">{p.aoa > 0 ? `+${p.aoa}°` : `${p.aoa}°`}</td>
                        <td className="p-2 text-[#F43F5E]">{p.dragCoeff}</td>
                        <td className="p-2 text-[#34D399]">{p.liftCoeff}</td>
                        <td className="p-2">{p.ldRatio}</td>
                        <td className="p-2 text-[#F43F5E]">{p.dragKn}</td>
                        <td className="p-2 text-[#34D399]">{p.liftKn}</td>
                        <td className="p-2">{p.pitchMoment}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#1C2938] mt-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyMarkdown}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#172131] hover:bg-[#1B2838] border border-[#263548] text-[#E8EDF2] font-medium transition-colors"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#34D399]" />
                  <span className="text-[#34D399]">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#38BDF8]" />
                  <span>Copy Markdown</span>
                </>
              )}
            </button>

            {canvasRef && (
              <button
                onClick={handleDownloadSnapshot}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#172131] hover:bg-[#1B2838] border border-[#263548] text-[#E8EDF2] font-medium transition-colors"
              >
                <Camera className="w-3.5 h-3.5 text-[#FBBF24]" />
                <span>CFD Snapshot (PNG)</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJSON}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#172131] hover:bg-[#1B2838] border border-[#263548] text-[#E8EDF2] font-medium transition-colors"
            >
              <FileCode className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span>JSON Dataset</span>
            </button>

            <button
              onClick={activeTab === 'current' ? handleExportCSV : handleExportPolarCSV}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-[#34D399] hover:bg-[#2fc08a] text-[#0B0F17] font-semibold transition-all active:scale-98"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{activeTab === 'current' ? 'Export CSV (.csv)' : 'Export Polar Curve (.csv)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
