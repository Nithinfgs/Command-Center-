import React, { useState, useEffect } from 'react';
import { 
  Rocket, 
  Wind, 
  Orbit, 
  Target, 
  Compass, 
  Cpu
} from 'lucide-react';
import { useSimulation } from '../../context/SimulationContext';
import type { AppTab } from '../../types';

export const Header: React.FC = () => {
  const { activeTab, setActiveTab, blueprint } = useSimulation();
  const [missionClock, setMissionClock] = useState<string>('00:00:00.00');

  useEffect(() => {
    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const hours = Math.floor(elapsed / 3600000).toString().padStart(2, '0');
      const minutes = Math.floor((elapsed % 3600000) / 60000).toString().padStart(2, '0');
      const seconds = Math.floor((elapsed % 60000) / 1000).toString().padStart(2, '0');
      const centis = Math.floor((elapsed % 1000) / 10).toString().padStart(2, '0');
      setMissionClock(`T+${hours}:${minutes}:${seconds}.${centis}`);
    }, 50);

    return () => clearInterval(timer);
  }, []);

  const navItems: { id: AppTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'rocket-builder', label: 'ROCKET BUILDER', icon: Rocket },
    { id: 'wind-tunnel', label: 'CFD WIND TUNNEL & HEAT', icon: Wind },
    { id: 'celestial-sim', label: 'N-BODY CELESTIAL SANDBOX', icon: Orbit },
    { id: 'asteroid-impact', label: 'ASTEROID IMPACT LAB', icon: Target },
    { id: 'flight-sandbox', label: 'FLIGHT LAUNCHPAD', icon: Compass }
  ];

  return (
    <header className="bg-[#090d16] border-b border-[#1e293b] px-4 py-2 flex flex-col md:flex-row items-center justify-between gap-3 select-none">
      {/* Brand & Mission Status */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 bg-[#1e293b] border border-[#38bdf8]/40 rounded text-[#38bdf8]">
          <Rocket className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-sm tracking-wider text-slate-100 uppercase">
              AERO-ORBIT COMMAND
            </span>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-950/80 border border-emerald-500/40 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              ONLINE
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
            <span>ACTIVE: <strong className="text-slate-200">{blueprint.name}</strong></span>
            <span>|</span>
            <span>PARTS: <strong className="text-[#38bdf8]">{blueprint.parts.length}</strong></span>
          </div>
        </div>
      </div>

      {/* Center Navigation Tabs */}
      <nav className="flex items-center bg-[#0d131f] p-1 border border-[#1e293b] rounded">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-mono font-semibold transition-colors duration-150 ${
                isActive
                  ? 'bg-[#1e293b] text-[#38bdf8] border border-[#38bdf8]/50 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#131b2c]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden lg:inline">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Right Telemetry Readouts */}
      <div className="flex items-center gap-4 text-xs font-mono">
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-[10px] text-slate-500 uppercase tracking-widest">MISSION CLOCK</span>
          <span className="text-slate-200 font-bold tracking-tight">{missionClock}</span>
        </div>
        <div className="flex items-center gap-2 px-2.5 py-1 bg-[#0d131f] border border-[#1e293b] rounded">
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[11px] text-slate-300">60.0 FPS</span>
        </div>
      </div>
    </header>
  );
};
