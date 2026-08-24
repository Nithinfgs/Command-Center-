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
    <header className="bg-[#0B0F17] border-b border-[#1C2938] px-4 h-12 flex items-center justify-between select-none z-30 shrink-0">
      {/* Brand & Active Vehicle */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[#38BDF8] text-base font-semibold">◈</span>
          <span className="font-semibold text-sm tracking-tight text-[#E8EDF2]">
            Mission Control
          </span>
        </div>

        <div className="h-4 w-[1px] bg-[#1C2938]" />

        <button 
          onClick={() => setShowPresetModal(true)}
          className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#121A26] hover:bg-[#172131] border border-[#263548]/60 text-xs text-[#9AA9B8] hover:text-[#E8EDF2] transition-colors"
        >
          <span className="text-[#E8EDF2] font-medium">{blueprint.name}</span>
          <span className="text-[10px] text-[#64748B]">({blueprint.parts.length} parts)</span>
          <ChevronDown className="w-3 h-3 text-[#64748B]" />
        </button>
      </div>

      {/* Primary Mode Navigation */}
      <nav className="flex items-center gap-1 bg-[#121A26] p-0.5 border border-[#1C2938] rounded-lg">
        {navTabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                isActive
                  ? 'bg-[#172131] text-[#38BDF8] shadow-xs'
                  : 'text-[#9AA9B8] hover:text-[#E8EDF2] hover:bg-[#172131]/50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Secondary Actions & Launch */}
      <div className="flex items-center gap-2 text-xs">
        <button
          onClick={() => setShowPresetModal(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#121A26] hover:bg-[#172131] border border-[#263548]/60 text-[#9AA9B8] hover:text-[#E8EDF2] transition-colors font-medium"
        >
          <FolderOpen className="w-3.5 h-3.5" />
          <span>Presets</span>
        </button>

        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#121A26] hover:bg-[#172131] border border-[#263548]/60 text-[#9AA9B8] hover:text-[#E8EDF2] transition-colors font-medium"
        >
          {savedNotification ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-[#34D399]" />
              <span className="text-[#34D399]">Saved</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              <span>Save</span>
            </>
          )}
        </button>

        <button
          onClick={() => {
            navigator.clipboard.writeText(window.location.href);
            alert('Blueprint URL copied to clipboard.');
          }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#121A26] hover:bg-[#172131] border border-[#263548]/60 text-[#9AA9B8] hover:text-[#E8EDF2] transition-colors font-medium"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Share</span>
        </button>

        <div className="h-4 w-[1px] bg-[#1C2938]" />

        {activeTab === 'rocket-builder' ? (
          <button
            onClick={transferRocketToFlight}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#34D399] hover:bg-[#2fc08a] text-[#0B0F17] font-semibold text-xs transition-all shadow-xs active:scale-98"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Launch Simulation</span>
          </button>
        ) : (
          <button
            onClick={() => setActiveTab('rocket-builder')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#38BDF8] hover:bg-[#2ea8dd] text-[#0B0F17] font-semibold text-xs transition-all shadow-xs active:scale-98"
          >
            <Rocket className="w-3.5 h-3.5 fill-current" />
            <span>Edit Vehicle</span>
          </button>
        )}
      </div>

      {/* Preset Modal */}
      {showPresetModal && (
        <div className="fixed inset-0 bg-[#0B0F17]/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[#121A26] border border-[#263548] rounded-xl max-w-md w-full p-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#1C2938]">
              <div>
                <h3 className="font-semibold text-[#E8EDF2] text-sm">Vehicle Blueprints</h3>
                <p className="text-xs text-[#9AA9B8]">Select a pre-configured aerospace configuration</p>
              </div>
              <button 
                onClick={() => setShowPresetModal(false)}
                className="text-[#64748B] hover:text-[#E8EDF2] text-sm p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 my-4 max-h-72 overflow-y-auto pr-1">
              {ROCKET_PRESETS.map(preset => (
                <div
                  key={preset.id}
                  onClick={() => {
                    loadRocketPreset(preset.id);
                    setShowPresetModal(false);
                  }}
                  className={`p-3 rounded-lg border transition-all cursor-pointer ${
                    blueprint.id === preset.id
                      ? 'bg-[#1A3040] border-[#38BDF8]/60 text-[#E8EDF2]'
                      : 'bg-[#172131] border-[#263548]/40 hover:bg-[#1B2838] text-[#9AA9B8] hover:text-[#E8EDF2]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-xs text-[#E8EDF2]">{preset.name}</span>
                    <span className="text-[11px] font-mono-num text-[#38BDF8] bg-[#121A26] px-1.5 py-0.5 rounded border border-[#263548]">
                      {preset.parts.length} parts
                    </span>
                  </div>
                  <p className="text-[11px] text-[#64748B] mt-1 line-clamp-1">
                    Multi-stage calibrated rocket configuration with balanced TWR and aerodynamics.
                  </p>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-[#1C2938]">
              <button
                onClick={() => setShowPresetModal(false)}
                className="px-3 py-1.5 rounded-md bg-[#172131] hover:bg-[#1B2838] border border-[#263548] text-[#E8EDF2] text-xs font-medium"
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
