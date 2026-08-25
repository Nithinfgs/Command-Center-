import React from 'react';
import { Trophy, X, Play } from 'lucide-react';
import { useSimulation } from '../../context/SimulationContext';
import { soundEngine } from '../../audio/soundEngine';
import { CAMPAIGN_MISSIONS, type CampaignMission } from './campaign-data';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const CampaignMissionModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { setActiveTab, loadRocketPreset } = useSimulation();

  if (!isOpen) return null;

  const handleStartMission = (mission: CampaignMission) => {
    soundEngine.speak(`Commencing historical mission: ${mission.title}`);
    if (mission.presetId) {
      loadRocketPreset(mission.presetId);
    }
    setActiveTab(mission.targetTab);
    onClose();
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 bg-[#090A0D]/85 backdrop-blur-xs z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="campaign-modal-title"
    >
      <div 
        onClick={e => e.stopPropagation()}
        className="bg-[#151820] border border-[#353D4A] rounded-xl max-w-2xl w-full p-5 shadow-2xl space-y-4 max-h-[85vh] flex flex-col"
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#252B36]">
          <div className="flex items-center gap-2.5">
            <Trophy className="w-5 h-5 text-[#FF8A1F]" />
            <div>
              <h2 id="campaign-modal-title" className="font-bold text-sm text-[#E6E8EB] uppercase tracking-wider">
                Historical Spaceflight Campaigns
              </h2>
              <p className="text-[11px] text-[#A4ABB6]">
                Iconic Aerospace Flight Objectives & Planetary Defense Scenarios
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            aria-label="Close campaign library"
            className="p-1.5 rounded-lg hover:bg-[#1B1F28] text-[#69717E] hover:text-[#E6E8EB]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {CAMPAIGN_MISSIONS.map(m => (
            <div 
              key={m.id}
              className="bg-[#0E1015] border border-[#252B36] hover:border-[#FF8A1F]/60 rounded-xl p-3.5 transition-all space-y-2 text-xs group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-[#1B1F28] border border-[#252B36] text-[10px] font-mono-num text-[#FF8A1F] font-semibold">
                    {m.year} • {m.agency}
                  </span>
                  <h3 className="font-semibold text-[#E6E8EB] text-xs group-hover:text-[#FF8A1F] transition-colors">
                    {m.title}
                  </h3>
                </div>

                <button
                  onClick={() => handleStartMission(m)}
                  className="px-3 py-1.5 rounded-lg bg-[#FF8A1F] hover:bg-[#FFA24A] text-[#090A0D] font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Launch Campaign</span>
                </button>
              </div>

              <p className="text-[11px] text-[#A4ABB6] leading-relaxed">
                {m.description}
              </p>

              <div className="bg-[#151820] p-2 rounded-lg border border-[#252B36] space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#69717E] block">Mission Objectives:</span>
                {m.objectives.map((obj, i) => (
                  <div key={i} className="text-[11px] text-[#CBD5E1] flex items-center gap-2 font-mono-num">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8]" />
                    <span>{obj}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
