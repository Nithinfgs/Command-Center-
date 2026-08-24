import React, { useState } from 'react';
import { 
  FileCode, 
  Copy, 
  CheckCircle2, 
  RotateCcw, 
  Activity, 
  FileSpreadsheet 
} from 'lucide-react';
import { useSimulation } from '../../context/SimulationContext';
import { calculateRocketProperties } from '../../physics/rocket-math';

interface FlightReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FlightReportModal: React.FC<FlightReportModalProps> = ({
  isOpen,
  onClose
}) => {
  const { blueprint, flightState, resetFlight } = useSimulation();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const rocketProps = calculateRocketProperties(blueprint);

  // Status determined by state
  const isAborted = flightState.aborted;
  const isCrashed = flightState.isLaunched && flightState.altitude <= 0 && flightState.speed < 1 && !flightState.inOrbit;
  const isOrbit = flightState.inOrbit;

  const statusTitle = isAborted 
    ? 'MISSION ABORTED' 
    : isCrashed 
    ? 'VEHICLE IMPACT / MISSION END' 
    : isOrbit 
    ? 'ORBITAL INSERTION ACHIEVED' 
    : 'FLIGHT STATUS SUMMARY';

  const statusColor = isAborted 
    ? 'text-[#D95757] bg-[#D95757]/10 border-[#D95757]/30' 
    : isCrashed 
    ? 'text-[#E6B84D] bg-[#E6B84D]/10 border-[#E6B84D]/30' 
    : isOrbit 
    ? 'text-[#55B982] bg-[#55B982]/10 border-[#55B982]/30' 
    : 'text-[#79AFC1] bg-[#79AFC1]/10 border-[#79AFC1]/30';

  const handleExportCSV = () => {
    const rows = [
      ['PARAMETER', 'VALUE', 'UNIT'],
      ['Vehicle Name', blueprint.name, ''],
      ['Mission Status', statusTitle, ''],
      ['Maximum Altitude (Ap)', (flightState.apoapsis / 1000).toFixed(2), 'km'],
      ['Final Altitude', (flightState.altitude / 1000).toFixed(2), 'km'],
      ['Maximum Velocity', Math.round(flightState.speed).toString(), 'm/s'],
      ['Downrange Distance', (flightState.downrange / 1000).toFixed(2), 'km'],
      ['Peak Dynamic Pressure (Max-Q)', (flightState.maxQReached / 1000).toFixed(2), 'kPa'],
      ['Peak G-Force', flightState.gForce.toFixed(2), 'G'],
      ['Final Stage', flightState.currentStageIndex.toString(), ''],
      ['Fuel Remaining', flightState.fuelMassRemaining.toFixed(2), 't'],
      ['Orbital Status', flightState.inOrbit ? 'Stable Orbit Achieved' : 'Sub-Orbital', ''],
      ['Periapsis (Pe)', (flightState.periapsis / 1000).toFixed(2), 'km']
    ];

    const csvContent = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Flight_Report_${blueprint.name.replace(/\s+/g, '_')}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    const reportData = {
      reportType: 'Mission Control Launch Vehicle Post-Flight Incident Report',
      timestamp: new Date().toISOString(),
      vehicle: {
        id: blueprint.id,
        name: blueprint.name,
        totalMassTons: rocketProps.totalMass,
        dryMassTons: rocketProps.dryMass,
        componentsCount: blueprint.parts.length
      },
      flightTelemetry: {
        status: statusTitle,
        isAborted: flightState.aborted,
        inOrbit: flightState.inOrbit,
        finalAltitudeM: flightState.altitude,
        apoapsisM: flightState.apoapsis,
        periapsisM: flightState.periapsis,
        downrangeM: flightState.downrange,
        maxVelocityMs: flightState.speed,
        maxQReachedPa: flightState.maxQReached,
        peakGForce: flightState.gForce,
        finalStageIndex: flightState.currentStageIndex,
        fuelMassRemainingTons: flightState.fuelMassRemaining,
        trajectoryWaypointsCount: flightState.trajectoryHistory.length
      }
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Flight_Report_${blueprint.name.replace(/\s+/g, '_')}_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyMarkdown = () => {
    const md = `
# 🚀 Mission Control Post-Flight Report: ${blueprint.name}
**Status**: ${statusTitle}  
**Timestamp**: ${new Date().toUTCString()}  

### Flight Trajectory Summary
| Parameter | Value | Unit |
| :--- | :--- | :--- |
| **Max Altitude (Apoapsis)** | ${(flightState.apoapsis / 1000).toFixed(2)} | km |
| **Final Altitude** | ${(flightState.altitude / 1000).toFixed(2)} | km |
| **Max Velocity** | ${Math.round(flightState.speed)} | m/s |
| **Downrange Range** | ${(flightState.downrange / 1000).toFixed(2)} | km |
| **Peak Max-Q Pressure** | ${(flightState.maxQReached / 1000).toFixed(1)} | kPa |
| **Peak G-Force** | ${flightState.gForce.toFixed(2)} | G |
| **Orbital Condition** | ${flightState.inOrbit ? 'Stable Low Earth Orbit' : 'Sub-Orbital Trajectory'} | — |
| **Fuel Remaining** | ${flightState.fuelMassRemaining.toFixed(2)} | tons |
| **Active Stage** | Stage ${flightState.currentStageIndex} | — |
`;

    navigator.clipboard.writeText(md.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-[#090A0D]/85 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-[#151820] border border-[#353D4A] rounded-lg max-w-2xl w-full p-4 shadow-2xl flex flex-col max-h-[88vh] select-none text-xs">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#252B36]">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#FF8A1F]" />
            <div>
              <h3 className="font-semibold text-[#E6E8EB] text-xs uppercase tracking-wider">Mission Telemetry & Post-Flight Report</h3>
              <p className="text-[11px] text-[#69717E]">
                Recorded vehicle flight kinematics, staging history, and ascent trajectory
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-[#69717E] hover:text-[#E6E8EB] text-xs font-mono p-1 rounded hover:bg-[#1B1F28]"
          >
            ✕
          </button>
        </div>

        {/* Status Callout Banner */}
        <div className={`my-3 p-3 rounded-lg border flex items-center justify-between font-mono-num ${statusColor}`}>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider block">{statusTitle}</span>
            <span className="text-[11px] opacity-90 block mt-0.5">
              Vehicle: {blueprint.name} • Stage {flightState.currentStageIndex} Active
            </span>
          </div>
          <div className="text-right">
            <span className="text-sm font-bold block">
              {(flightState.apoapsis / 1000).toFixed(1)} km Ap
            </span>
            <span className="text-[10px] opacity-80 block">
              {Math.round(flightState.speed)} m/s peak
            </span>
          </div>
        </div>

        {/* Telemetry Metrics Grid */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="bg-[#1B1F28] p-2.5 rounded-lg border border-[#252B36]">
              <span className="text-[#69717E] block text-[10px] uppercase">Max Altitude (Ap)</span>
              <span className="text-[#79AFC1] font-mono-num font-semibold text-sm mt-0.5 block">
                {(flightState.apoapsis / 1000).toFixed(2)} km
              </span>
            </div>
            <div className="bg-[#1B1F28] p-2.5 rounded-lg border border-[#252B36]">
              <span className="text-[#69717E] block text-[10px] uppercase">Top Speed</span>
              <span className="text-[#E6E8EB] font-mono-num font-semibold text-sm mt-0.5 block">
                {Math.round(flightState.speed)} m/s
              </span>
            </div>
            <div className="bg-[#1B1F28] p-2.5 rounded-lg border border-[#252B36]">
              <span className="text-[#69717E] block text-[10px] uppercase">Downrange</span>
              <span className="text-[#E6E8EB] font-mono-num font-semibold text-sm mt-0.5 block">
                {(flightState.downrange / 1000).toFixed(2)} km
              </span>
            </div>
          </div>

          {/* Telemetry Data Table */}
          <div className="bg-[#1B1F28]/70 border border-[#252B36] rounded-lg overflow-hidden">
            <table className="w-full text-left font-mono-num text-xs">
              <thead className="bg-[#1B1F28] border-b border-[#252B36] text-[#A4ABB6] text-[11px]">
                <tr>
                  <th className="p-2">Telemetry Parameter</th>
                  <th className="p-2">Recorded Value</th>
                  <th className="p-2">Unit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#252B36] text-[#E6E8EB]">
                <tr>
                  <td className="p-2 text-[#A4ABB6]">Final Altitude</td>
                  <td className="p-2 font-medium">{(flightState.altitude / 1000).toFixed(2)}</td>
                  <td className="p-2 text-[#69717E]">km</td>
                </tr>
                <tr>
                  <td className="p-2 text-[#A4ABB6]">Max-Q Dynamic Pressure</td>
                  <td className="p-2 font-medium text-[#D95757]">{(flightState.maxQReached / 1000).toFixed(1)}</td>
                  <td className="p-2 text-[#69717E]">kPa</td>
                </tr>
                <tr>
                  <td className="p-2 text-[#A4ABB6]">Peak Acceleration</td>
                  <td className="p-2 font-medium text-[#FF8A1F]">{flightState.gForce.toFixed(2)}</td>
                  <td className="p-2 text-[#69717E]">G</td>
                </tr>
                <tr>
                  <td className="p-2 text-[#A4ABB6]">Active Stage Index</td>
                  <td className="p-2 font-medium text-[#79AFC1]">Stage {flightState.currentStageIndex}</td>
                  <td className="p-2 text-[#69717E]">—</td>
                </tr>
                <tr>
                  <td className="p-2 text-[#A4ABB6]">Propellant Mass Remaining</td>
                  <td className="p-2 font-medium">{flightState.fuelMassRemaining.toFixed(2)}</td>
                  <td className="p-2 text-[#69717E]">t</td>
                </tr>
                <tr>
                  <td className="p-2 text-[#A4ABB6]">Periapsis (Pe)</td>
                  <td className="p-2 font-medium">{(flightState.periapsis / 1000).toFixed(1)}</td>
                  <td className="p-2 text-[#69717E]">km</td>
                </tr>
                <tr>
                  <td className="p-2 text-[#A4ABB6]">Trajectory Waypoints</td>
                  <td className="p-2 font-medium text-[#79AFC1]">{flightState.trajectoryHistory.length}</td>
                  <td className="p-2 text-[#69717E]">points</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#252B36]">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyMarkdown}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#1B1F28] hover:bg-[#222733] border border-[#252B36] text-[#E6E8EB] font-medium text-xs transition-colors"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#55B982]" />
                  <span className="text-[#55B982]">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#79AFC1]" />
                  <span>Copy Markdown</span>
                </>
              )}
            </button>

            <button
              onClick={() => {
                resetFlight();
                onClose();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#1B1F28] hover:bg-[#222733] border border-[#252B36] text-[#A4ABB6] hover:text-[#E6E8EB] text-xs font-medium transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset & Re-Fly</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJSON}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#1B1F28] hover:bg-[#222733] border border-[#252B36] text-[#E6E8EB] font-medium text-xs transition-colors"
            >
              <FileCode className="w-3.5 h-3.5 text-[#79AFC1]" />
              <span>JSON Data</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-[#FF8A1F] hover:bg-[#FFA24A] text-[#090A0D] font-semibold text-xs transition-all active:scale-98 shadow-sm"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export CSV Report</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
