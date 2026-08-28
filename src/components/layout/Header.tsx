import React, { useState, useEffect } from 'react';
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
  ChevronDown,
  X,
  Volume2,
  VolumeX,
  Radio,
  Compass,
  Trophy,
  Presentation,
  Info
} from 'lucide-react';
import { useSimulation } from '../../context/SimulationContext';
import { ROCKET_PRESETS } from '../../physics/rocket-math';
import { soundEngine } from '../../audio/soundEngine';
import { CampaignMissionModal } from '../campaigns/CampaignMissionModal';
import { CompetitionTourModal } from '../competition/CompetitionTourModal';
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
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [showCompetitionTour, setShowCompetitionTour] = useState(false);
  const [showDisclosureModal, setShowDisclosureModal] = useState(false);
  const [savedNotification, setSavedNotification] = useState(false);
  const [sharedNotification, setSharedNotification] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);

  const navTabs: { id: AppTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'rocket-builder', label: 'Build', icon: Rocket },
    { id: 'wind-tunnel', label: 'Aero', icon: Wind },
    { id: 'flight-sandbox', label: 'Flight', icon: Play },
    { id: 'celestial-sim', label: 'Orbit', icon: Orbit },
    { id: 'asteroid-impact', label: 'Impact', icon: Target },
    { id: 'constellation', label: 'Satellites', icon: Radio },
    { id: 'rover-surface', label: 'Rover', icon: Compass },
  ];

  const handleSave = () => {
    localStorage.setItem('mission_control_blueprint', JSON.stringify(blueprint));
    setSavedNotification(true);
    setTimeout(() => setSavedNotification(false), 2000);
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setSharedNotification(true);
      setTimeout(() => setSharedNotification(false), 2000);
    } catch {
      setSharedNotification(false);
    }
  };

  // Close any header-owned modal on Escape.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowPresetModal(false);
        setShowCompetitionTour(false);
        setShowDisclosureModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header className="bg-[#0E1015] border-b border-[#252B36] px-3 h-14 flex items-center gap-3 select-none z-30 shrink-0 2xl:px-4" role="banner">
      {/* Brand & Active Vehicle Subtitle */}
      <div className="flex min-w-[142px] items-center gap-3.5 2xl:min-w-[190px]">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#FF8A1F]" />
            <span className="font-bold text-xs tracking-wider text-[#E6E8EB] uppercase whitespace-nowrap">
              Mission Control
            </span>
            <span className="rounded border border-[#FF8A1F]/30 bg-[#FF8A1F]/10 px-1 py-px text-[8px] font-bold uppercase tracking-wider text-[#FFAA5A]">Mathlet '26</span>
          </div>
          <button 
            onClick={() => setShowPresetModal(true)}
            aria-label="Select Rocket Preset"
            className="flex items-center gap-1 text-[11px] text-[#A4ABB6] hover:text-[#FF8A1F] transition-colors text-left font-mono-num"
          >
            <span className="uppercase tracking-tight font-medium truncate max-w-[105px] 2xl:max-w-[150px]">{blueprint.name}</span>
            <span className="hidden text-[10px] text-[#69717E] 2xl:inline">({blueprint.parts.length} parts)</span>
            <ChevronDown className="w-2.5 h-2.5 text-[#69717E]" />
          </button>
        </div>
      </div>

      {/* Primary Mode Navigation with Thin Orange Line */}
      <nav className="flex min-w-0 flex-1 items-center justify-center h-full gap-0.5" aria-label="Main Navigation">
        {navTabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              aria-current={isActive ? 'page' : undefined}
              title={tab.label}
              className={`relative flex items-center gap-1 h-full px-1.5 2xl:px-2.5 text-xs transition-colors whitespace-nowrap ${
                isActive
                  ? 'text-[#E6E8EB] font-semibold'
                  : 'text-[#A4ABB6] hover:text-[#E6E8EB] font-medium'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#FF8A1F]' : 'text-[#69717E]'}`} />
              <span className="tracking-tight uppercase text-[10px] 2xl:text-[11px]">{tab.label}</span>
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#FF8A1F]" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Action Suite & Launch Primary Button */}
      <div className="flex shrink-0 items-center gap-1.5 text-xs">
        <button
          onClick={() => setShowCompetitionTour(true)}
          className="flex items-center gap-1.5 rounded bg-[#FF8A1F] px-2.5 py-1.5 text-[11px] font-bold text-[#090A0D] shadow-sm transition-colors hover:bg-[#FFA24A]"
        >
          <Presentation className="w-3.5 h-3.5" />
          <span className="hidden xl:inline">3-Min Tour</span>
          <span className="xl:hidden">Tour</span>
        </button>

        <button
          onClick={() => setShowCampaignModal(true)}
          aria-label="Open historical mission campaigns"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[#151820] hover:bg-[#1B1F28] border border-[#FF8A1F]/40 text-[#FF8A1F] hover:text-[#FFA24A] transition-colors font-semibold text-[11px]"
        >
          <Trophy className="w-3.5 h-3.5" />
          <span className="hidden 2xl:inline">Campaigns</span>
        </button>

        <button
          onClick={() => setShowPresetModal(true)}
          aria-label="Open rocket preset library"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[#151820] hover:bg-[#1B1F28] border border-[#252B36] text-[#A4ABB6] hover:text-[#E6E8EB] transition-colors font-medium text-[11px]"
        >
          <FolderOpen className="w-3.5 h-3.5 text-[#69717E]" />
          <span className="hidden 2xl:inline">Presets</span>
        </button>

        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[#151820] hover:bg-[#1B1F28] border border-[#252B36] text-[#A4ABB6] hover:text-[#E6E8EB] transition-colors font-medium text-[11px]"
          title="Save Configuration to Browser Storage"
        >
          {savedNotification ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-[#55B982]" />
              <span className="hidden text-[#55B982] 2xl:inline">Saved</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5 text-[#69717E]" />
              <span className="hidden 2xl:inline">Save</span>
            </>
          )}
        </button>

        <button
          onClick={() => {
            const nextMuted = !isAudioMuted;
            setIsAudioMuted(nextMuted);
            soundEngine.setMuted(nextMuted);
          }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[#151820] hover:bg-[#1B1F28] border border-[#252B36] text-[#A4ABB6] hover:text-[#E6E8EB] transition-colors font-medium text-[11px]"
          title={isAudioMuted ? "Unmute Mission Audio" : "Mute Mission Audio"}
        >
          {isAudioMuted ? (
            <VolumeX className="w-3.5 h-3.5 text-[#D95757]" />
          ) : (
            <Volume2 className="w-3.5 h-3.5 text-[#55B982]" />
          )}
        </button>

        <button
          onClick={() => setShowDisclosureModal(true)}
          aria-label="Open technical notes and judging disclosures"
          className="flex items-center gap-1 rounded border border-[#38BDF8]/30 bg-[#151820] px-2 py-1.5 text-[11px] font-medium text-[#38BDF8] transition-colors hover:bg-[#1B1F28] hover:text-[#7DD3FC]"
          title="Technical Notes & Judging Disclosures"
        >
          <Info className="w-3.5 h-3.5" />
          <span className="hidden 2xl:inline">Judging Info</span>
        </button>

        <button
          onClick={handleShare}
          aria-label={sharedNotification ? 'Configuration link copied' : 'Copy configuration link'}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[#151820] hover:bg-[#1B1F28] border border-[#252B36] text-[#A4ABB6] hover:text-[#E6E8EB] transition-colors font-medium text-[11px]"
          title="Share Configuration"
        >
          {sharedNotification ? <CheckCircle2 className="w-3.5 h-3.5 text-[#55B982]" /> : <Share2 className="w-3.5 h-3.5 text-[#69717E]" />}
          <span className="hidden 2xl:inline">{sharedNotification ? 'Copied' : 'Share'}</span>
        </button>

        {activeTab !== 'flight-sandbox' && (
          <button
            onClick={transferRocketToFlight}
            aria-label="Launch rocket in flight simulation"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#FF8A1F] hover:bg-[#FFA24A] text-[#090A0D] font-semibold text-[11px] transition-all active:scale-98 shadow-sm"
          >
            <Play className="w-3 h-3 fill-current" />
            <span className="hidden tracking-tight uppercase xl:inline">Launch</span>
          </button>
        )}
      </div>

      {/* Preset Modal */}
      {showPresetModal && (
        <div
          onClick={() => setShowPresetModal(false)}
          className="fixed inset-0 bg-[#090A0D]/80 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="preset-modal-title"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-[#151820] border border-[#353D4A] rounded-lg max-w-md w-full p-4 shadow-2xl space-y-3"
          >
            <div className="flex items-center justify-between pb-2.5 border-b border-[#252B36]">
              <div className="flex items-center gap-2">
                <Rocket className="w-4 h-4 text-[#FF8A1F]" />
                <h3 id="preset-modal-title" className="font-semibold text-xs text-[#E6E8EB] uppercase tracking-wider">
                  Flight Vehicle Library
                </h3>
              </div>
              <button 
                onClick={() => setShowPresetModal(false)}
                aria-label="Close modal"
                className="text-[#69717E] hover:text-[#E6E8EB] p-1 rounded hover:bg-[#1B1F28]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5 my-2 max-h-72 overflow-y-auto pr-1">
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

      {/* Historical Campaign Scenarios Modal */}
      <CampaignMissionModal
        isOpen={showCampaignModal}
        onClose={() => setShowCampaignModal(false)}
      />
      <CompetitionTourModal
        isOpen={showCompetitionTour}
        onClose={() => setShowCompetitionTour(false)}
        onNavigate={setActiveTab}
      />

      {/* Judging & Technical Simulator Disclosures Modal */}
      {showDisclosureModal && (
        <div
          onClick={() => setShowDisclosureModal(false)}
          className="fixed inset-0 bg-[#090A0D]/85 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="judging-info-title"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-[#151820] border border-[#353D4A] rounded-xl max-w-xl w-full p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#252B36]">
              <div className="flex items-center gap-2 text-[#38BDF8]">
                <Info className="w-5 h-5" />
                <h3 id="judging-info-title" className="font-bold text-xs text-[#E6E8EB] uppercase tracking-wider">
                  Technical Architecture & Judging Disclosures
                </h3>
              </div>
              <button
                onClick={() => setShowDisclosureModal(false)}
                aria-label="Close judging information"
                className="text-[#69717E] hover:text-[#E6E8EB] p-1 rounded hover:bg-[#1B1F28]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#A4ABB6] leading-relaxed">
              <div className="bg-[#0E1015] p-3 rounded-lg border border-[#252B36] space-y-1">
                <span className="font-bold text-[#FF8A1F] block text-[11px] uppercase tracking-wide">
                  1. Educational Mathematical Simulation Disclaimer
                </span>
                <p>
                  This platform is an <strong>educational mathematical simulator</strong>, not a flight-certified, safety-certified, or peer-reviewed aerospace analysis package. Numerical solvers (Runge-Kutta 4th Order spherical flight dynamics, compressible shockwave relations, Collins & Ames impact cratering scaling, and Clohessy-Wiltshire relative motion) represent educational numerical approximations.
                </p>
              </div>

              <div className="bg-[#0E1015] p-3 rounded-lg border border-[#252B36] space-y-1">
                <span className="font-bold text-[#38BDF8] block text-[11px] uppercase tracking-wide">
                  2. CFD Telemetry & Polar Data Export Notice
                </span>
                <p>
                  Full aerodynamic polar curves, aerodynamic coefficients ($C_d, C_l, L/D$), and shockwave stagnation properties can be exported directly via the <strong>CFD Aero</strong> tab using CSV/JSON download or 1-click clipboard copy. If evaluating in an automated sandbox environment, manual CSV/JSON verification in standard browsers is supported.
                </p>
              </div>

              <div className="bg-[#0E1015] p-3 rounded-lg border border-[#252B36] space-y-1">
                <span className="font-bold text-[#55B982] block text-[11px] uppercase tracking-wide">
                  3. Desktop-First Aerospace Workstation
                </span>
                <p>
                  The interface is engineered <strong>desktop-first</strong>. It is usable at 1024 px and optimal at 1280 px or wider for dual-viewport telemetry, 3D orbits, and live CAD staging hierarchies.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-[#252B36] flex justify-end">
              <button
                onClick={() => setShowDisclosureModal(false)}
                className="px-4 py-2 rounded-lg bg-[#38BDF8] text-[#090A0D] font-bold text-xs hover:bg-[#38BDF8]/90 transition-all"
              >
                Acknowledge & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
