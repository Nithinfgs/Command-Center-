import React, { useState } from 'react';
import { 
  FileCode, 
  Copy, 
  CheckCircle2, 
  X, 
  AlertOctagon, 
  RotateCcw, 
  Download,
  Activity
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
    ? 'text-[#F43F5E] bg-[#F43F5E]/10 border-[#F43F5E]/30' 
    : isCrashed 
    ? 'text-[#FBBF24] bg-[#FBBF24]/10 border-[#FBBF24]/30' 
    : isOrbit 
    ? 'text-[#34D399] bg-[#34D399]/10 border-[#34D399]/30' 
    : 'text-[#38BDF8] bg-[#38BDF8]/10 border-[#38BDF8]/30';

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
        fuelRemainingTons: flightState.fuelMassRemaining,
        trajectoryPointsCount: flightState.trajectoryHistory.length,
        trajectoryTrail: flightState.trajectoryHistory
      }
    };

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(reportData, null, 2))}`;
    const link = document.createElement('a');
    link.setAttribute('href', jsonString);
    link.setAttribute('download', `Flight_Telemetry_${blueprint.name.replace(/\s+/g, '_')}_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyMarkdown = () => {
    const markdownTable = `
### Mission Flight & Incident Telemetry Report — ${blueprint.name}
**Status**: **${statusTitle}** | **Target**: Low Earth Orbit (LEO)

| Parameter | Value | Unit |
| :--- | :--- | :--- |
| **Peak Altitude (Apoapsis)** | \`${(flightState.apoapsis / 1000).toFixed(2)} km\` | km |
| **Downrange Distance** | \`${(flightState.downrange / 1000).toFixed(2)} km\` | km |
| **Peak Velocity** | \`${Math.round(flightState.speed)} m/s\` | m/s |
| **Vertical Speed** | \`${flightState.verticalSpeed} m/s\` | m/s |
| **Peak Dynamic Pressure (Max-Q)** | \`${(flightState.maxQReached / 1000).toFixed(1)} kPa\` | kPa |
| **Peak Acceleration** | \`${flightState.gForce} G\` | G |
| **Current Stage** | \`Stage ${flightState.currentStageIndex}\` | — |
| **Propellant Remaining** | \`${flightState.fuelMassRemaining.toFixed(2)} t\` | t |
| **Orbital Status** | \`${flightState.inOrbit ? 'Stable Orbit' : 'Sub-Orbital'}\` | — |
    `.trim();

    navigator.clipboard.writeText(markdownTable);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 bg-[#0B0F17]/85 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-[#121A26] border border-[#263548] rounded-xl max-w-xl w-full p-4 shadow-2xl flex flex-col max-h-[85vh] select-none text-xs">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#1C2938]">
          <div className="flex items-center gap-2.5">
            <AlertOctagon className="w-5 h-5 text-[#F43F5E]" />
            <div>
              <h3 className="font-semibold text-[#E8EDF2] text-sm">Post-Flight Mission Report</h3>
              <p className="text-[11px] text-[#9AA9B8]">
                Vehicle telemetry review, trajectory parameters, and incident export
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-[#64748B] hover:text-[#E8EDF2] p-1 rounded hover:bg-[#172131]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Strip */}
        <div className={`mt-3 p-2.5 rounded-lg border flex items-center justify-between font-semibold ${statusColor}`}>
          <span className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            <span>{statusTitle}</span>
          </span>
          <span className="text-[11px] font-mono-num font-normal opacity-90">
            {blueprint.name}
          </span>
        </div>

        {/* Telemetry Metrics Grid */}
        <div className="flex-1 overflow-y-auto my-3 space-y-3 pr-1">
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-[#172131] p-2.5 rounded-lg border border-[#263548]/40">
              <span className="text-[#64748B] block text-[11px]">Peak Altitude (Ap)</span>
              <span className="text-[#38BDF8] font-mono-num font-semibold text-sm mt-0.5 block">
                {(flightState.apoapsis / 1000).toFixed(1)} km
              </span>
            </div>
            <div className="bg-[#172131] p-2.5 rounded-lg border border-[#263548]/40">
              <span className="text-[#64748B] block text-[11px]">Peak Velocity</span>
              <span className="text-[#34D399] font-mono-num font-semibold text-sm mt-0.5 block">
                {Math.round(flightState.speed)} m/s
              </span>
            </div>
            <div className="bg-[#172131] p-2.5 rounded-lg border border-[#263548]/40">
              <span className="text-[#64748B] block text-[11px]">Downrange</span>
              <span className="text-[#FBBF24] font-mono-num font-semibold text-sm mt-0.5 block">
                {(flightState.downrange / 1000).toFixed(1)} km
              </span>
            </div>
          </div>

          <div className="bg-[#172131]/60 border border-[#263548]/40 rounded-lg overflow-hidden">
            <table className="w-full text-left font-mono-num text-xs">
              <thead className="bg-[#172131] border-b border-[#263548]/60 text-[#9AA9B8] text-[11px]">
                <tr>
                  <th className="p-2">Telemetry Parameter</th>
                  <th className="p-2">Recorded Value</th>
                  <th className="p-2">Unit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1C2938] text-[#E8EDF2]">
                <tr>
                  <td className="p-2 text-[#9AA9B8]">Final Altitude</td>
                  <td className="p-2 font-medium">{(flightState.altitude / 1000).toFixed(2)}</td>
                  <td className="p-2 text-[#64748B]">km</td>
                </tr>
                <tr>
                  <td className="p-2 text-[#9AA9B8]">Max-Q Dynamic Pressure</td>
                  <td className="p-2 font-medium text-[#F43F5E]">{(flightState.maxQReached / 1000).toFixed(1)}</td>
                  <td className="p-2 text-[#64748B]">kPa</td>
                </tr>
                <tr>
                  <td className="p-2 text-[#9AA9B8]">Peak Acceleration</td>
                  <td className="p-2 font-medium text-[#FBBF24]">{flightState.gForce.toFixed(2)}</td>
                  <td className="p-2 text-[#64748B]">G</td>
                </tr>
                <tr>
                  <td className="p-2 text-[#9AA9B8]">Active Stage Index</td>
                  <td className="p-2 font-medium text-[#38BDF8]">Stage {flightState.currentStageIndex}</td>
                  <td className="p-2 text-[#64748B]">—</td>
                </tr>
                <tr>
                  <td className="p-2 text-[#9AA9B8]">Propellant Mass Remaining</td>
                  <td className="p-2 font-medium">{flightState.fuelMassRemaining.toFixed(2)}</td>
                  <td className="p-2 text-[#64748B]">t</td>
                </tr>
                <tr>
                  <td className="p-2 text-[#9AA9B8]">Periapsis (Pe)</td>
                  <td className="p-2 font-medium">{(flightState.periapsis / 1000).toFixed(1)}</td>
                  <td className="p-2 text-[#64748B]">km</td>
                </tr>
                <tr>
                  <td className="p-2 text-[#9AA9B8]">Trajectory Waypoints</td>
                  <td className="p-2 font-medium text-[#38BDF8]">{flightState.trajectoryHistory.length}</td>
                  <td className="p-2 text-[#64748B]">points</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#1C2938]">
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

            <button
              onClick={() => {
                resetFlight();
                onClose();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#172131] hover:bg-[#1B2838] border border-[#263548] text-[#9AA9B8] hover:text-[#E8EDF2] font-medium transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset & Re-Fly</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJSON}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#172131] hover:bg-[#1B2838] border border-[#263548] text-[#E8EDF2] font-medium transition-colors"
            >
              <FileCode className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span>JSON Data</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-[#34D399] hover:bg-[#2fc08a] text-[#0B0F17] font-semibold transition-all active:scale-98"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV Report</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
