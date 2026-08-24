import React, { useState } from 'react';
import { 
  Trash2, 
  Copy, 
  RotateCw, 
  ChevronUp, 
  ChevronDown, 
  CheckCircle2, 
  AlertTriangle,
  X
} from 'lucide-react';
import { useSimulation } from '../../context/SimulationContext';
import { calculateRocketProperties, PARTS_CATALOG } from '../../physics/rocket-math';

export const StagingPanel: React.FC = () => {
  const { 
    blueprint, 
    setPartStage, 
    removePartFromBlueprint, 
    setSelectedPartInstanceId, 
    selectedPartInstanceId,
    rotatePartInBlueprint,
    addPartToBlueprint
  } = useSimulation();

  const metrics = calculateRocketProperties(blueprint);

  // Group parts by stage
  const stageGroups: Record<number, typeof blueprint.parts> = {};
  for (const part of blueprint.parts) {
    const s = part.stage || 1;
    if (!stageGroups[s]) stageGroups[s] = [];
    stageGroups[s].push(part);
  }

  const [expandedStages, setExpandedStages] = useState<Record<number, boolean>>({
    1: true,
    2: true,
    3: true,
    4: true
  });

  const toggleStage = (stageNum: number) => {
    setExpandedStages(prev => ({ ...prev, [stageNum]: !prev[stageNum] }));
  };

  const selectedPart = blueprint.parts.find(p => p.instanceId === selectedPartInstanceId);
  const selectedPartDef = selectedPart ? PARTS_CATALOG[selectedPart.partType] : null;

  return (
    <aside className="w-[320px] bg-[#121A26] border-l border-[#1C2938] flex flex-col h-full select-none shrink-0 z-20">
      {/* Dynamic Header */}
      <div className="p-3 border-b border-[#1C2938] flex items-center justify-between">
        <h2 className="text-xs font-semibold text-[#E8EDF2] tracking-tight uppercase">
          {selectedPart ? 'Component Inspector' : 'Vehicle Overview'}
        </h2>
        {selectedPart && (
          <button
            onClick={() => setSelectedPartInstanceId(null)}
            className="text-[#64748B] hover:text-[#E8EDF2] p-1 rounded hover:bg-[#172131]"
            title="Deselect"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {selectedPart && selectedPartDef ? (
          /* ================================================================= */
          /* 1. SELECTED COMPONENT PROPERTIES VIEW                             */
          /* ================================================================= */
          <div className="space-y-4">
            <div className="bg-[#172131] border border-[#263548]/60 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#E8EDF2]">{selectedPartDef.name}</span>
                <span className="text-[10px] uppercase font-semibold text-[#38BDF8] bg-[#121A26] px-2 py-0.5 rounded border border-[#263548]">
                  {selectedPartDef.category}
                </span>
              </div>
              <p className="text-[11px] text-[#9AA9B8] mt-1.5 leading-relaxed">
                {selectedPartDef.description}
              </p>
            </div>

            {/* Engineering Specifications */}
            <div className="space-y-2">
              <h3 className="text-[11px] font-semibold text-[#9AA9B8] uppercase tracking-wider">
                Engineering Properties
              </h3>
              
              <div className="bg-[#172131]/60 border border-[#263548]/40 rounded-lg divide-y divide-[#1C2938] text-xs">
                <div className="p-2 flex items-center justify-between">
                  <span className="text-[#9AA9B8]">Total Mass</span>
                  <span className="font-mono-num font-medium text-[#E8EDF2]">
                    {(selectedPartDef.dryMass + selectedPartDef.fuelMass).toFixed(2)} t
                  </span>
                </div>

                {selectedPartDef.thrust && (
                  <>
                    <div className="p-2 flex items-center justify-between">
                      <span className="text-[#9AA9B8]">Vacuum Thrust</span>
                      <span className="font-mono-num font-medium text-[#FBBF24]">
                        {selectedPartDef.thrust} kN
                      </span>
                    </div>
                    <div className="p-2 flex items-center justify-between">
                      <span className="text-[#9AA9B8]">Specific Impulse (Isp)</span>
                      <span className="font-mono-num font-medium text-[#34D399]">
                        {selectedPartDef.ispVac} s
                      </span>
                    </div>
                  </>
                )}

                {selectedPartDef.category === 'fuel' && (
                  <div className="p-2 flex items-center justify-between">
                    <span className="text-[#9AA9B8]">Propellant Mass</span>
                    <span className="font-mono-num font-medium text-[#38BDF8]">
                      {selectedPartDef.fuelMass.toFixed(2)} t
                    </span>
                  </div>
                )}

                <div className="p-2 flex items-center justify-between">
                  <span className="text-[#9AA9B8]">Drag Coefficient (Cd)</span>
                  <span className="font-mono-num font-medium text-[#E8EDF2]">
                    {selectedPartDef.dragCoeff}
                  </span>
                </div>

                <div className="p-2 flex items-center justify-between">
                  <span className="text-[#9AA9B8]">Thermal Tolerance</span>
                  <span className="font-mono-num font-medium text-[#E8EDF2]">
                    {selectedPartDef.heatTolerance} K
                  </span>
                </div>
              </div>
            </div>

            {/* Position & Staging Assignment */}
            <div className="space-y-2">
              <h3 className="text-[11px] font-semibold text-[#9AA9B8] uppercase tracking-wider">
                Geometry & Staging
              </h3>

              <div className="bg-[#172131]/60 border border-[#263548]/40 rounded-lg p-2.5 space-y-2.5 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-[#64748B] block">Grid X</span>
                    <span className="font-mono-num font-medium text-[#E8EDF2]">{selectedPart.x * 20} mm</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#64748B] block">Grid Y</span>
                    <span className="font-mono-num font-medium text-[#E8EDF2]">{selectedPart.y * 20} mm</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#1C2938]">
                  <span className="text-[#9AA9B8]">Assigned Stage</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4].map(st => (
                      <button
                        key={st}
                        onClick={() => setPartStage(selectedPart.instanceId, st)}
                        className={`w-6 h-6 rounded text-[11px] font-mono-num font-medium transition-colors ${
                          (selectedPart.stage || 1) === st
                            ? 'bg-[#38BDF8] text-[#0B0F17]'
                            : 'bg-[#121A26] hover:bg-[#1B2838] text-[#9AA9B8]'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Component Quick Actions */}
            <div className="flex gap-2 pt-2 border-t border-[#1C2938]">
              <button
                onClick={() => rotatePartInBlueprint(selectedPart.instanceId)}
                className="flex-1 py-1.5 px-2 rounded-md bg-[#172131] hover:bg-[#1B2838] border border-[#263548] text-[#E8EDF2] text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
              >
                <RotateCw className="w-3.5 h-3.5 text-[#38BDF8]" />
                <span>Rotate 90°</span>
              </button>

              <button
                onClick={() => addPartToBlueprint(selectedPart.partType, selectedPart.x + 1, selectedPart.y)}
                className="flex-1 py-1.5 px-2 rounded-md bg-[#172131] hover:bg-[#1B2838] border border-[#263548] text-[#E8EDF2] text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
              >
                <Copy className="w-3.5 h-3.5 text-[#38BDF8]" />
                <span>Duplicate</span>
              </button>

              <button
                onClick={() => removePartFromBlueprint(selectedPart.instanceId)}
                className="py-1.5 px-2.5 rounded-md bg-[#F43F5E]/10 hover:bg-[#F43F5E] text-[#F43F5E] hover:text-[#0B0F17] border border-[#F43F5E]/30 text-xs font-medium transition-colors"
                title="Delete Component"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          /* ================================================================= */
          /* 2. OVERALL VEHICLE OVERVIEW & STAGES VIEW                          */
          /* ================================================================= */
          <div className="space-y-4">
            {/* Engineering Metrics Summary Cards */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-[#172131] border border-[#263548]/40 rounded-lg p-2.5">
                <span className="text-[11px] text-[#64748B] block">Total Mass</span>
                <span className="font-mono-num text-sm font-semibold text-[#E8EDF2] mt-0.5 block">
                  {metrics.totalMass} t
                </span>
                <span className="text-[10px] text-[#64748B]">Dry: {metrics.dryMass} t</span>
              </div>

              <div className="bg-[#172131] border border-[#263548]/40 rounded-lg p-2.5">
                <span className="text-[11px] text-[#64748B] block">Total Thrust</span>
                <span className="font-mono-num text-sm font-semibold text-[#FBBF24] mt-0.5 block">
                  {metrics.totalThrust} kN
                </span>
                <span className="text-[10px] text-[#64748B]">TWR: {metrics.maxTWR > 0 ? metrics.maxTWR.toFixed(2) : '0.00'}</span>
              </div>

              <div className="bg-[#172131] border border-[#263548]/40 rounded-lg p-2.5">
                <span className="text-[11px] text-[#64748B] block">Total Delta-V</span>
                <span className="font-mono-num text-sm font-semibold text-[#38BDF8] mt-0.5 block">
                  {metrics.totalDeltaV} m/s
                </span>
                <span className="text-[10px] text-[#64748B]">Vacuum efficiency</span>
              </div>

              <div className="bg-[#172131] border border-[#263548]/40 rounded-lg p-2.5">
                <span className="text-[11px] text-[#64748B] block">Stability Margin</span>
                <span className={`font-mono-num text-sm font-semibold mt-0.5 block ${metrics.aerodynamicStabilityMargin > 0 ? 'text-[#34D399]' : 'text-[#F43F5E]'}`}>
                  {metrics.aerodynamicStabilityMargin > 0 ? `+${metrics.aerodynamicStabilityMargin} m` : `${metrics.aerodynamicStabilityMargin} m`}
                </span>
                <span className="text-[10px] text-[#64748B]">
                  {metrics.aerodynamicStabilityMargin > 0 ? 'Aerodynamically Stable' : 'Flip Risk'}
                </span>
              </div>
            </div>

            {/* Stages Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-semibold text-[#9AA9B8] uppercase tracking-wider">
                  Staging Sequence
                </h3>
                <span className="text-[10px] font-mono-num text-[#64748B]">
                  {Object.keys(stageGroups).length} Active Stages
                </span>
              </div>

              <div className="space-y-2">
                {[1, 2, 3, 4].filter(s => stageGroups[s]?.length).map(stageNum => {
                  const parts = stageGroups[stageNum] || [];
                  const isExpanded = expandedStages[stageNum] !== false;
                  const stageMetric = metrics.stagesDeltaV.find(s => s.stage === stageNum);

                  return (
                    <div
                      key={stageNum}
                      className="bg-[#172131] border border-[#263548]/50 rounded-lg overflow-hidden transition-all"
                    >
                      <div 
                        onClick={() => toggleStage(stageNum)}
                        className="p-2.5 flex items-center justify-between cursor-pointer hover:bg-[#1B2838] transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono-num font-semibold text-[#38BDF8] bg-[#121A26] px-1.5 py-0.5 rounded border border-[#263548]">
                            0{stageNum}
                          </span>
                          <span className="text-xs font-medium text-[#E8EDF2]">
                            {stageNum === 1 ? 'Booster' : stageNum === 2 ? 'Upper Stage' : `Stage ${stageNum}`}
                          </span>
                          <span className="text-[11px] text-[#64748B]">
                            ({parts.length} components)
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {stageMetric && (
                            <span className="font-mono-num text-xs font-medium text-[#34D399]">
                              +{stageMetric.deltaV} m/s
                            </span>
                          )}
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5 text-[#64748B]" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-[#64748B]" />
                          )}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="p-2 pt-0 space-y-1 border-t border-[#1C2938]/60">
                          {parts.map(p => {
                            const def = PARTS_CATALOG[p.partType];
                            if (!def) return null;
                            const isSelected = selectedPartInstanceId === p.instanceId;

                            return (
                              <div
                                key={p.instanceId}
                                onClick={() => setSelectedPartInstanceId(p.instanceId)}
                                className={`px-2 py-1.5 rounded text-xs flex items-center justify-between cursor-pointer transition-colors ${
                                  isSelected
                                    ? 'bg-[#1A3040] text-[#38BDF8] font-medium'
                                    : 'text-[#9AA9B8] hover:text-[#E8EDF2] hover:bg-[#121A26]'
                                }`}
                              >
                                <span className="truncate">{def.name}</span>
                                <div className="flex items-center gap-1 shrink-0 ml-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removePartFromBlueprint(p.instanceId);
                                    }}
                                    className="opacity-0 hover:opacity-100 p-0.5 text-[#64748B] hover:text-[#F43F5E]"
                                    title="Remove"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}

                {blueprint.parts.length === 0 && (
                  <div className="p-6 text-center text-xs text-[#64748B] border border-dashed border-[#263548] rounded-lg">
                    No components assembled yet. Add parts from the library to begin.
                  </div>
                )}
              </div>
            </div>

            {/* Vehicle Validation Summary */}
            <div className="space-y-2 pt-2 border-t border-[#1C2938]">
              <h3 className="text-[11px] font-semibold text-[#9AA9B8] uppercase tracking-wider">
                Vehicle Check
              </h3>

              <div className="space-y-1.5 text-xs text-[#9AA9B8]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#34D399] shrink-0" />
                  <span>All stages connected</span>
                </div>
                <div className="flex items-center gap-2">
                  {metrics.maxTWR >= 1.0 ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#34D399] shrink-0" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 text-[#FBBF24] shrink-0" />
                  )}
                  <span>
                    {metrics.maxTWR >= 1.0 
                      ? `Positive thrust-to-weight ratio (${metrics.maxTWR.toFixed(2)})` 
                      : 'Insufficient thrust-to-weight ratio'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#34D399] shrink-0" />
                  <span>Fuel capacity valid</span>
                </div>
                <div className="flex items-center gap-2">
                  {metrics.aerodynamicStabilityMargin > 0 ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#34D399] shrink-0" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 text-[#FBBF24] shrink-0" />
                  )}
                  <span>
                    {metrics.aerodynamicStabilityMargin > 0 
                      ? 'Aerodynamic stability margin verified' 
                      : 'Centre of pressure requires review'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
