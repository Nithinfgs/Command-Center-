import React from 'react';
import { Layers, Flame, ChevronUp, ChevronDown, Split, Trash2 } from 'lucide-react';
import { useSimulation } from '../../context/SimulationContext';
import { calculateRocketProperties, PARTS_CATALOG } from '../../physics/rocket-math';

export const StagingPanel: React.FC = () => {
  const { blueprint, setPartStage, removePartFromBlueprint, setSelectedPartInstanceId, selectedPartInstanceId } = useSimulation();
  const metrics = calculateRocketProperties(blueprint);

  const stageGroups: Record<number, typeof blueprint.parts> = {};
  for (const part of blueprint.parts) {
    const s = part.stage || 1;
    if (!stageGroups[s]) stageGroups[s] = [];
    stageGroups[s].push(part);
  }

  const allStages = [1, 2, 3, 4].filter(s => stageGroups[s] && stageGroups[s].length > 0);

  return (
    <div className="w-80 bg-[#080d1a] border-l border-[#1a2638] flex flex-col h-full select-none text-xs font-mono shadow-2xl">
      <div className="p-3 border-b border-[#1a2638] bg-[#050914] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#00e5ff]" />
          <span className="font-bold text-slate-200 uppercase tracking-wider">STAGING SEQUENCE</span>
        </div>
        <span className="text-[10px] text-[#00e5ff] bg-[#0c1526] border border-[#00e5ff]/30 px-2 py-0.5 rounded font-bold">
          {allStages.length} STAGES
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {allStages.length === 0 ? (
          <div className="p-6 text-center text-slate-500">
            No parts placed yet. Click <strong>ADD</strong> on any part in the catalog to begin assembly.
          </div>
        ) : (
          allStages.map(stageNum => {
            const partsInStage = stageGroups[stageNum] || [];
            const stageMetric = metrics.stagesDeltaV.find(s => s.stage === stageNum);

            return (
              <div
                key={stageNum}
                className="bg-[#0b1322] border border-[#1a2638] rounded-lg p-3 relative overflow-hidden shadow-md"
              >
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#1a2638]">
                  <div className="flex items-center gap-2">
                    <span className="bg-[#00e5ff] text-slate-950 px-2 py-0.5 rounded font-black text-[11px]">
                      STAGE {stageNum}
                    </span>
                    <span className="text-slate-300 font-semibold">{partsInStage.length} Parts</span>
                  </div>

                  {stageMetric && (
                    <span className="text-[#00f59b] font-bold">
                      +{stageMetric.deltaV} m/s
                    </span>
                  )}
                </div>

                {stageMetric && (
                  <div className="grid grid-cols-2 gap-2 mb-2.5 text-[10px]">
                    <div className="bg-[#040711] p-1.5 rounded border border-[#141e2e]">
                      <div className="text-slate-500">THRUST / WEIGHT</div>
                      <div className="text-[#ffb703] font-bold mt-0.5">{stageMetric.twr} TWR</div>
                    </div>
                    <div className="bg-[#040711] p-1.5 rounded border border-[#141e2e]">
                      <div className="text-slate-500">BURN TIME</div>
                      <div className="text-cyan-400 font-bold mt-0.5">{stageMetric.burnTime}s</div>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  {partsInStage.map(p => {
                    const def = PARTS_CATALOG[p.partType];
                    if (!def) return null;
                    const isEngine = def.category === 'engine';
                    const isDecoupler = def.category === 'staging';
                    const isSelected = selectedPartInstanceId === p.instanceId;

                    return (
                      <div
                        key={p.instanceId}
                        onClick={() => setSelectedPartInstanceId(p.instanceId)}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded border text-[11px] cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-[#15233c] border-[#00e5ff] text-white shadow-sm'
                            : 'bg-[#060a14] border-[#141e2e] text-slate-300 hover:border-slate-600 hover:bg-[#090f1e]'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          {isEngine && <Flame className="w-3.5 h-3.5 text-[#ffb703] shrink-0" />}
                          {isDecoupler && <Split className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                          <span className="truncate font-semibold">{def.name}</span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0 ml-2">
                          <button
                            disabled={stageNum <= 1}
                            onClick={(e) => {
                              e.stopPropagation();
                              setPartStage(p.instanceId, stageNum - 1);
                            }}
                            className="p-1 rounded hover:bg-[#1a2638] text-slate-400 disabled:opacity-20"
                            title="Move to earlier stage"
                          >
                            <ChevronUp className="w-3 h-3" />
                          </button>
                          <button
                            disabled={stageNum >= 4}
                            onClick={(e) => {
                              e.stopPropagation();
                              setPartStage(p.instanceId, stageNum + 1);
                            }}
                            className="p-1 rounded hover:bg-[#1a2638] text-slate-400 disabled:opacity-20"
                            title="Move to later stage"
                          >
                            <ChevronDown className="w-3 h-3" />
                          </button>

                          {/* DIRECT DELETE BUTTON IN STAGING TREE */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removePartFromBlueprint(p.instanceId);
                            }}
                            className="p-1 rounded hover:bg-[#ff3366] text-slate-400 hover:text-white transition-colors ml-1"
                            title="Delete this part"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-[#ff3366] hover:text-white" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="p-3 bg-[#050914] border-t border-[#1a2638]">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-slate-400 font-bold">TOTAL MISSION \Delta v</span>
          <span className="text-[#00e5ff] font-bold text-sm">{metrics.totalDeltaV} m/s</span>
        </div>
        <div className="w-full bg-[#101c30] h-2 rounded-full overflow-hidden border border-[#1a2638]">
          <div 
            className="bg-[#00e5ff] h-full transition-all duration-300 shadow-[0_0_10px_#00e5ff]"
            style={{ width: `${Math.min(100, (metrics.totalDeltaV / 9400) * 100)}%` }}
          />
        </div>
        <div className="text-[10px] text-slate-500 mt-1.5 flex justify-between">
          <span>Suborbital (3,500 m/s)</span>
          <span>LEO Orbit (9,400 m/s)</span>
        </div>
      </div>
    </div>
  );
};
