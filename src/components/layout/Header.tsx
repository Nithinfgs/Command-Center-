import React, { useState } from 'react';
import { 
  Rocket, 
  Wind, 
  Orbit, 
  Target, 
  Play, 
  FolderOpen, 
  Save, 
  Share2, 
  CheckCircle2,
  ChevronDown
} from 'lucide-react';
import { useSimulation } from '../../context/SimulationContext';
import { ROCKET_PRESETS } from '../../physics/rocket-math';
import type { AppTab } from '../../types';

export const Header: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    blueprint, 
    loadRocketPreset, 
    transferRocketToFlight 
  } = useSimulation();

  const [showPresetModal, setShowPresetModal] = useState(false);
  const [savedNotification, setSavedNotification] = useState(false);

  const navTabs: { id: AppTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'rocket-builder', label: 'Rocket Builder', icon: Rocket },
    { id: 'wind-tunnel', label: 'Simulation & CFD', icon: Wind },
    { id: 'flight-sandbox', label: 'Flight Test', icon: Play },
    { id: 'celestial-sim', label: 'Orbital Mechanics', icon: Orbit },
    { id: 'asteroid-impact', label: 'Impact Physics', icon: Target },
  ];

  const handleSave = () => {
    localStorage.setItem('aero_orbit_saved_blueprint', JSON.stringify(blueprint));
    setSavedNotification(true);
    setTimeout(() => setSavedNotification(false), 2000);
  };

  return (
    <header className="bg-[#0E1015] border-b border-[#252B36] px-4 h-13 flex items-center justify-between select-none z-30 shrink-0">
      {/* Brand & Active Vehicle Subtitle */}
      <div className="flex items-center gap-3.5">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#FF8A1F]" />
            <span className="font-bold text-xs tracking-wider text-[#E6E8EB] uppercase">
              Mission Control
            </span>
          </div>
          <button 
            onClick={() => setShowPresetModal(true)}
            className="flex items-center gap-1 text-[11px] text-[#A4ABB6] hover:text-[#FF8A1F] transition-colors text-left font-mono-num"
          >
            <span className="uppercase tracking-tight font-medium">{blueprint.name}</span>
            <span className="text-[10px] text-[#69717E]">({blueprint.parts.length} parts)</span>
            <ChevronDown className="w-2.5 h-2.5 text-[#69717E]" />
          </button>
        </div>
      </div>

      {/* Primary Mode Navigation with Thin Orange Line */}
      <nav className="flex items-center h-full gap-5">
        {navTabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-1.5 h-full text-xs transition-colors ${
                isActive
                  ? 'text-[#E6E8EB] font-semibold'
                  : 'text-[#A4ABB6] hover:text-[#E6E8EB] font-medium'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#FF8A1F]' : 'text-[#69717E]'}`} />
              <span className="tracking-tight uppercase text-[11px]">{tab.label}</span>
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#FF8A1F]" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Action Suite & Launch Primary Button */}
      <div className="flex items-center gap-2 text-xs">
        <button
          onClick={() => setShowPresetModal(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[#151820] hover:bg-[#1B1F28] border border-[#252B36] text-[#A4ABB6] hover:text-[#E6E8EB] transition-colors font-medium text-[11px]"
        >
          <FolderOpen className="w-3.5 h-3.5 text-[#69717E]" />
          <span>Presets</span>
        </button>

        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[#151820] hover:bg-[#1B1F28] border border-[#252B36] text-[#A4ABB6] hover:text-[#E6E8EB] transition-colors font-medium text-[11px]"
        >
          {savedNotification ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-[#55B982]" />
              <span className="text-[#55B982]">Saved</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5 text-[#69717E]" />
              <span>Save</span>
            </>
          )}
        </button>

        <button
          onClick={() => {
            navigator.clipboard.writeText(window.location.href);
            alert('Mission configuration link copied.');
          }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[#151820] hover:bg-[#1B1F28] border border-[#252B36] text-[#A4ABB6] hover:text-[#E6E8EB] transition-colors font-medium text-[11px]"
          title="Share Configuration"
        >
          <Share2 className="w-3.5 h-3.5 text-[#69717E]" />
          <span>Share</span>
        </button>

        {activeTab !== 'flight-sandbox' && (
          <button
            onClick={transferRocketToFlight}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#FF8A1F] hover:bg-[#FFA24A] text-[#090A0D] font-semibold text-[11px] transition-all active:scale-98 shadow-sm"
          >
            <Play className="w-3 h-3 fill-current" />
            <span className="tracking-tight uppercase">Launch Simulation</span>
          </button>
        )}
      </div>

      {/* Preset Modal */}
      {showPresetModal && (
        <div className="fixed inset-0 bg-[#090A0D]/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[#151820] border border-[#353D4A] rounded-lg max-w-md w-full p-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#252B36]">
              <div className="flex items-center gap-2">
                <Rocket className="w-4 h-4 text-[#FF8A1F]" />
                <h3 className="font-semibold text-xs text-[#E6E8EB] uppercase tracking-wider">Flight Vehicle Library</h3>
              </div>
              <button 
                onClick={() => setShowPresetModal(false)}
                className="text-[#69717E] hover:text-[#E6E8EB] text-xs font-mono"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1.5 my-3 max-h-72 overflow-y-auto pr-1">
              {ROCKET_PRESETS.map(preset => (
                <button
                  key={preset.id}
                  onClick={() => {
                    loadRocketPreset(preset.id);
                    setShowPresetModal(false);
                  }}
                  className={`w-full text-left p-2.5 rounded border transition-all ${
                    blueprint.id === preset.id
                      ? 'bg-[#1B1F28] border-[#FF8A1F] text-[#E6E8EB]'
                      : 'bg-[#0E1015] border-[#252B36] text-[#A4ABB6] hover:bg-[#1B1F28] hover:text-[#E6E8EB]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-xs text-[#E6E8EB]">{preset.name}</span>
                    <span className="text-[10px] text-[#FF8A1F] font-mono-num">{preset.parts.length} parts</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="pt-2 border-t border-[#252B36] flex justify-end">
              <button
                onClick={() => setShowPresetModal(false)}
                className="px-3 py-1.5 rounded bg-[#1B1F28] hover:bg-[#222733] border border-[#252B36] text-[#A4ABB6] hover:text-[#E6E8EB] text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
