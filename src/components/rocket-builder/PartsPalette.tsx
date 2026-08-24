import React, { useState } from 'react';
import { 
  Shield, 
  Fuel, 
  Flame, 
  Wind, 
  Layers, 
  Wrench, 
  Plus, 
  Search,
  CheckCircle2,
  ChevronRight,
  Info
} from 'lucide-react';
import { PARTS_CATALOG } from '../../physics/rocket-math';
import type { PartCategory } from '../../types';
import { useSimulation } from '../../context/SimulationContext';
import { PartThumbnail } from './PartThumbnail';

export const PartsPalette: React.FC = () => {
  const { selectedCatalogPartType, setSelectedCatalogPartType, addPartToBlueprint } = useSimulation();
  const [activeCategory, setActiveCategory] = useState<PartCategory>('fuel');
  const [searchQuery, setSearchQuery] = useState('');

  const categories: { id: PartCategory; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'command', label: 'Command & Pods', icon: Shield },
    { id: 'fuel', label: 'Fuel Tanks', icon: Fuel },
    { id: 'engine', label: 'Engines & SRBs', icon: Flame },
    { id: 'aerodynamics', label: 'Aero & Fins', icon: Wind },
    { id: 'staging', label: 'Staging & Rings', icon: Layers },
    { id: 'utility', label: 'Utility & Gear', icon: Wrench },
  ];

  const filteredParts = Object.values(PARTS_CATALOG).filter(part => {
    const matchesCat = part.category === activeCategory;
    const matchesSearch = searchQuery === '' || 
      part.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      part.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <aside className="w-88 bg-[#080d1a] border-r border-[#1a2638] flex flex-col h-full select-none shadow-2xl">
      {/* Category Header */}
      <div className="p-3 border-b border-[#1a2638] bg-[#050914]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono font-bold text-slate-200 uppercase tracking-widest flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#00e5ff] shadow-[0_0_8px_#00e5ff]" />
            PARTS CATALOG
          </span>
          <span className="text-[10px] font-mono text-[#00e5ff] bg-[#0c1526] border border-[#00e5ff]/30 px-2 py-0.5 rounded font-bold">
            {Object.keys(PARTS_CATALOG).length} VEHICLE MODULES
          </span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search parts by name or role..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-[#03060f] border border-[#1e2d42] rounded pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 font-mono focus:outline-none focus:border-[#00e5ff] transition-colors"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="grid grid-cols-3 gap-1 p-2 border-b border-[#1a2638] bg-[#060a15]">
        {categories.map(cat => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex flex-col items-center justify-center p-2 rounded text-[10px] font-mono transition-all ${
                isActive
                  ? 'bg-[#101c30] text-[#00e5ff] border border-[#00e5ff]/60 font-bold shadow-[0_0_12px_rgba(0,229,255,0.15)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#0c1322] border border-transparent'
              }`}
            >
              <Icon className="w-4 h-4 mb-1" />
              <span className="truncate w-full text-center">{cat.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>

      {/* Parts Grid Cards */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5">
        {filteredParts.map(part => {
          const isSelected = selectedCatalogPartType === part.type;
          return (
            <div
              key={part.type}
              onClick={() => setSelectedCatalogPartType(part.type)}
              className={`group p-2.5 rounded-lg border transition-all cursor-pointer flex gap-3 ${
                isSelected
                  ? 'bg-[#0d182b] border-[#00e5ff] shadow-[0_0_16px_rgba(0,229,255,0.2)]'
                  : 'bg-[#090f1d] border-[#1a2638] hover:border-slate-500 hover:bg-[#0c1426]'
              }`}
            >
              {/* High-res Part Thumbnail Visual Graphic */}
              <div className="shrink-0 flex flex-col items-center gap-1">
                <PartThumbnail part={part} size={64} />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    addPartToBlueprint(part.type, 0, 0);
                  }}
                  title="Add directly to blueprint grid"
                  className="w-full py-1 rounded bg-[#00e5ff]/20 hover:bg-[#00e5ff] text-[#00e5ff] hover:text-slate-950 border border-[#00e5ff]/50 text-[10px] font-mono font-bold flex items-center justify-center gap-0.5 transition-all shadow-sm active:scale-95"
                >
                  <Plus className="w-3 h-3" />
                  <span>ADD</span>
                </button>
              </div>

              {/* Part Specs & Info */}
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-mono font-bold text-slate-100 group-hover:text-[#00e5ff] transition-colors leading-tight">
                      {part.name}
                    </span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#00e5ff] shrink-0" />}
                  </div>
                  <p className="text-[10.5px] text-slate-400 leading-snug mt-1 line-clamp-2">
                    {part.description}
                  </p>
                </div>

                {/* Engineering Badges */}
                <div className="grid grid-cols-3 gap-1 mt-2 pt-1.5 border-t border-[#1a2638] text-[9.5px] font-mono">
                  <div className="bg-[#040711] px-1.5 py-0.5 rounded border border-[#141e2e]">
                    <span className="text-slate-500 block">MASS</span>
                    <strong className="text-slate-200">{(part.dryMass + part.fuelMass).toFixed(1)}t</strong>
                  </div>

                  {part.thrust ? (
                    <div className="bg-[#040711] px-1.5 py-0.5 rounded border border-[#141e2e]">
                      <span className="text-slate-500 block">THRUST</span>
                      <strong className="text-[#ffb703]">{part.thrust}kN</strong>
                    </div>
                  ) : (
                    <div className="bg-[#040711] px-1.5 py-0.5 rounded border border-[#141e2e]">
                      <span className="text-slate-500 block">DRAG</span>
                      <strong className="text-[#00e5ff]">{part.dragCoeff}</strong>
                    </div>
                  )}

                  {part.ispVac ? (
                    <div className="bg-[#040711] px-1.5 py-0.5 rounded border border-[#141e2e]">
                      <span className="text-slate-500 block">ISP</span>
                      <strong className="text-[#00f59b]">{part.ispVac}s</strong>
                    </div>
                  ) : (
                    <div className="bg-[#040711] px-1.5 py-0.5 rounded border border-[#141e2e]">
                      <span className="text-slate-500 block">HEAT</span>
                      <strong className="text-[#ff3366]">{part.heatTolerance}K</strong>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredParts.length === 0 && (
          <div className="p-8 text-center text-xs font-mono text-slate-500">
            No aerospace parts matched your search.
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-2.5 bg-[#050914] border-t border-[#1a2638] text-[11px] font-mono text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-slate-400">
          <Info className="w-3.5 h-3.5 text-[#00e5ff]" />
          <span>Click <strong>ADD</strong> or Double-Click grid</span>
        </div>
        <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
      </div>
    </aside>
  );
};
