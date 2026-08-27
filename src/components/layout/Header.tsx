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
  Info
} from 'lucide-react';
import { useSimulation } from '../../context/SimulationContext';
import { ROCKET_PRESETS } from '../../physics/rocket-math';
import { soundEngine } from '../../audio/soundEngine';
import { CampaignMissionModal } from '../campaigns/CampaignMissionModal';
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
  const [showDisclosureModal, setShowDisclosureModal] = useState(false);
  const [savedNotification, setSavedNotification] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);

  const navTabs: { id: AppTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'rocket-builder', label: 'Rocket Builder', icon: Rocket },
    { id: 'wind-tunnel', label: 'CFD Aero', icon: Wind },
    { id: 'flight-sandbox', label: 'Flight Test', icon: Play },
    { id: 'celestial-sim', label: 'Orbital Mech', icon: Orbit },
    { id: 'asteroid-impact', label: 'Impact Physics', icon: Target },
    { id: 'constellation', label: 'Constellations', icon: Radio },
    { id: 'rover-surface', label: 'Surface Rover', icon: Compass },
  ];

  const handleSave = () => {
    localStorage.setItem('mission_control_blueprint', JSON.stringify(blueprint));
    setSavedNotification(true);
    setTimeout(() => setSavedNotification(false), 2000);
  };

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showPresetModal) {
        setShowPresetModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showPresetModal]);

  return (
    <header className="bg-[#0E1015] border-b border-[#252B36] px-3 sm:px-4 h-13 flex items-center justify-between select-none z-30 shrink-0 gap-2 overflow-x-auto no-scrollbar" role="banner">
      {/* Brand & Active Vehicle Subtitle */}
      <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
        <img 
          src="/logo.jpg" 
          alt="Rocket Command Center Logo" 
          className="w-7 h-7 rounded-lg border border-[#FF8A1F]/40 shadow-sm shadow-[#FF8A1F]/20 object-cover"
        />
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF8A1F] animate-pulse" />
            <span className="font-bold text-xs tracking-wider text-[#E6E8EB] uppercase whitespace-nowrap">
              Rocket Command Center
            </span>
          </div>
          <button 
            onClick={() => setShowPresetModal(true)}
            aria-label="Select Rocket Preset"
            className="flex items-center gap-1 text-[11px] text-[#A4ABB6] hover:text-[#FF8A1F] transition-colors text-left font-mono-num"
          >
            <span className="uppercase tracking-tight font-medium truncate max-w-[120px] sm:max-w-[180px]">{blueprint.name}</span>
            <span className="text-[10px] text-[#69717E] hidden sm:inline">({blueprint.parts.length}p)</span>
            <ChevronDown className="w-2.5 h-2.5 text-[#69717E]" />
          </button>
        </div>
      </div>

      {/* Primary Mode Navigation with Horizontal Swipe Support */}
      <nav className="flex items-center h-full gap-2.5 sm:gap-4 md:gap-5 overflow-x-auto no-scrollbar px-1 shrink-0" aria-label="Main Navigation">
        {navTabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex items-center gap-1.5 h-full text-xs transition-colors shrink-0 px-1 ${
                isActive
                  ? 'text-[#E6E8EB] font-semibold'
                  : 'text-[#A4ABB6] hover:text-[#E6E8EB] font-medium'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#FF8A1F]' : 'text-[#69717E]'}`} />
              <span className="tracking-tight uppercase text-[11px] whitespace-nowrap">{tab.label}</span>
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#FF8A1F]" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Action Suite & Launch Primary Button */}
      <div className="flex items-center gap-1.5 sm:gap-2 text-xs shrink-0">
        <button
          onClick={() => setShowCampaignModal(true)}
          className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded bg-[#151820] hover:bg-[#1B1F28] border border-[#FF8A1F]/40 text-[#FF8A1F] hover:text-[#FFA24A] transition-colors font-semibold text-[11px] whitespace-nowrap"
        >
          <Trophy className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Campaigns</span>
        </button>

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
          title="Save Configuration to Browser Storage"
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
          className="flex items-center gap-1 px-2 py-1.5 rounded bg-[#151820] hover:bg-[#1B1F28] border border-[#38BDF8]/30 text-[#38BDF8] hover:text-[#7DD3FC] transition-colors font-medium text-[11px]"
          title="Terms of Service, Legal Protection & Educational Disclosures"
        >
          <Info className="w-3.5 h-3.5" />
          <span>Legal & Terms</span>
        </button>

        <button
          onClick={() => {
            navigator.clipboard.writeText(window.location.href);
            alert('Mission Control configuration URL copied to clipboard.');
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

      {/* Terms of Service, Privacy & Legal Disclosures Modal */}
      {showDisclosureModal && (
        <div 
          onClick={() => setShowDisclosureModal(false)}
          className="fixed inset-0 bg-[#090A0D]/85 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div 
            onClick={e => e.stopPropagation()}
            className="bg-[#151820] border border-[#353D4A] rounded-xl max-w-2xl w-full p-5 shadow-2xl space-y-4 max-h-[90vh] flex flex-col"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#252B36] shrink-0">
              <div className="flex items-center gap-2 text-[#38BDF8]">
                <Info className="w-5 h-5" />
                <h3 className="font-bold text-xs text-[#E6E8EB] uppercase tracking-wider">
                  Terms of Service, Legal Protection & System Disclosures
                </h3>
              </div>
              <button 
                onClick={() => setShowDisclosureModal(false)}
                className="text-[#69717E] hover:text-[#E6E8EB] p-1 rounded hover:bg-[#1B1F28]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#A4ABB6] leading-relaxed overflow-y-auto pr-1">
              {/* 1. Sole Ownership, Intellectual Property & Anti-Plagiarism Protection */}
              <div className="bg-[#1B1F28] p-3.5 rounded-lg border border-[#FF8A1F]/60 space-y-1.5 shadow-md shadow-[#FF8A1F]/10">
                <span className="font-bold text-[#FF8A1F] block text-xs uppercase tracking-wide flex items-center gap-1.5">
                  <span>👑</span> 1. Sole Ownership, Authorship & Anti-Plagiarism Protection
                </span>
                <p className="text-[#E6E8EB] font-medium">
                  <strong>Nithin Selvaraj</strong> is the <strong>sole author, creator, architect, and exclusive intellectual property owner</strong> of Rocket Command Center (&ldquo;the Application&rdquo;).
                </p>
                <p>
                  &bull; <strong>Mandatory Attribution:</strong> Any reference, educational presentation, or permitted display must explicitly credit <strong>Nithin Selvaraj</strong> as the sole creator and developer.
                </p>
                <p>
                  &bull; <strong>Replication & Submission Prohibition:</strong> This application, its source code, physics engines, UI architectures, mathematical models, and CAD systems are the original work of Nithin Selvaraj. It is <strong>strictly prohibited</strong> for any other individual, team, institution, or third party to replicate, duplicate, clone, misattribute, or submit this project (in whole or in part) under any different name or authorship for competitions, hackathons, academic grading, or commercial distribution.
                </p>
              </div>

              {/* 2. Educational Disclaimer */}
              <div className="bg-[#0E1015] p-3 rounded-lg border border-[#252B36] space-y-1">
                <span className="font-bold text-[#38BDF8] block text-[11px] uppercase tracking-wide">
                  2. Educational Mathematical Simulation & Non-Certified Notice
                </span>
                <p>
                  This software is an <strong>educational mathematical simulator</strong> designed for academic instruction, orbital mechanics exploration, and aerospace concepts. It is <strong>NOT</strong> flight-certified, safety-certified, or peer-reviewed for actual avionics, spacecraft navigation, or real-world launch vehicle operations. All numerical solvers (RK4 spherical flight dynamics, Rankine-Hugoniot shock relations, Collins & Ames crater scaling) are educational approximations.
                </p>
              </div>

              {/* 3. Inaccuracy Disclaimer & Absolute Zero Liability */}
              <div className="bg-[#0E1015] p-3 rounded-lg border border-[#F87171]/40 space-y-1.5">
                <span className="font-bold text-[#F87171] block text-[11px] uppercase tracking-wide">
                  ⚠️ 3. Non-Accuracy Notice & Absolute ZERO Liability (0% Liability)
                </span>
                <p>
                  <strong>ATTENTION:</strong> All calculations, numerical outputs, telemetry readouts, aerodynamic approximations, staging metrics, trajectory integrations, and impact estimates generated by this simulator <strong>MAY NOT BE FULLY ACCURATE, EXACT, OR ERROR-FREE</strong>. They are theoretical mathematical approximations solely for educational demonstration.
                </p>
                <p className="text-[#E6E8EB] font-medium">
                  <strong>ZERO LIABILITY:</strong> Under no circumstances shall <strong>Nithin Selvaraj</strong>, the creators, or contributors bear any liability (<strong>0% liability</strong>) for any inaccuracies, computational discrepancies, physical damage, real-world reliance, or decisions made using this application. THE ENTIRE RISK AS TO ACCURACY AND USE IS BORNE BY THE USER.
                </p>
              </div>

              {/* 4. Non-Proliferation & ITAR/EAR Exemption */}
              <div className="bg-[#0E1015] p-3 rounded-lg border border-[#252B36] space-y-1">
                <span className="font-bold text-[#FBBF24] block text-[11px] uppercase tracking-wide">
                  4. Non-Proliferation & Public Domain Academic Exemption
                </span>
                <p>
                  All equations, staging models, aerodynamic relations, and orbital parameters implemented in this software are derived strictly from publicly available textbooks, NASA technical reports, and open educational literature. This application contains zero classified, export-controlled, or ITAR/EAR-restricted missile guidance technology.
                </p>
              </div>

              {/* 5. Client-Side Privacy Policy */}
              <div className="bg-[#0E1015] p-3 rounded-lg border border-[#252B36] space-y-1">
                <span className="font-bold text-[#55B982] block text-[11px] uppercase tracking-wide">
                  5. Privacy Policy & 100% Client-Side Data Protection
                </span>
                <p>
                  Rocket Command Center is <strong>100% self-contained and client-side</strong>. It does NOT collect, track, or transmit personal data, telemetry, cookies, or user identifiers to external servers. All rocket designs and configurations are stored solely in your local browser storage (<code className="text-[#38BDF8]">localStorage</code>).
                </p>
              </div>

              {/* 6. Attributions & Open Science */}
              <div className="bg-[#0E1015] p-3 rounded-lg border border-[#252B36] space-y-1">
                <span className="font-bold text-[#A78BFA] block text-[11px] uppercase tracking-wide">
                  6. Attributions & Open Science Datasets
                </span>
                <p>
                  Planetary textures, topographic normal maps, and Keplerian orbital elements are provided courtesy of NASA Goddard Space Flight Center, NASA Jet Propulsion Laboratory (JPL), and the United States Geological Survey (USGS).
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-[#252B36] flex items-center justify-between shrink-0">
              <span className="text-[10px] text-[#A4ABB6]">
                &copy; {new Date().getFullYear()} <strong>Nithin Selvaraj</strong> &bull; All Rights Reserved &bull; Sole Creator
              </span>
              <button
                onClick={() => setShowDisclosureModal(false)}
                className="px-4 py-1.5 rounded-lg bg-[#FF8A1F] text-[#090A0D] font-bold text-xs hover:bg-[#FFA24A] transition-all"
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
