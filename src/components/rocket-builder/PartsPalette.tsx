import React, { useState } from 'react';
import { Search, Plus } from 'lucide-react';
import { PARTS_CATALOG } from '../../physics/rocket-math';
import { useSimulation } from '../../context/SimulationContext';
import { PartThumbnail } from './PartThumbnail';

interface PartsPaletteProps {
  onClose?: () => void;
}

export const PartsPalette: React.FC<PartsPaletteProps> = ({ onClose }) => {
  const { selectedCatalogPartType, setSelectedCatalogPartType, addPartToBlueprint } = useSimulation();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories: { id: string; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'engine', label: 'Engines' },
    { id: 'fuel', label: 'Fuel Tanks' },
    { id: 'staging', label: 'Structure' },
    { id: 'aerodynamics', label: 'Aero' },
    { id: 'command', label: 'Command' },
    { id: 'utility', label: 'Utility' },
  ];

  const filteredParts = Object.values(PARTS_CATALOG).filter(part => {
    const matchesCat = activeCategory === 'all' || part.category === activeCategory;
    const matchesSearch = searchQuery === '' || 
      part.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      part.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <aside className="w-full lg:w-[280px] bg-[#151820] border-r border-[#252B36] flex flex-col h-full select-none shrink-0 z-20">
      {/* Search Header */}
      <div className="p-3 border-b border-[#252B36] space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-semibold text-[#E6E8EB] tracking-tight uppercase">Component Library</h2>
            <span className="text-[11px] font-mono-num text-[#69717E]">
              ({filteredParts.length})
            </span>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-1 rounded bg-[#1B1F28] text-[#A4ABB6] hover:text-[#E6E8EB] text-xs font-bold px-2 py-0.5"
            >
              ✕ Done
            </button>
          )}
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#69717E]" />
          <input
            type="text"
            placeholder="Search components..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-[#0E1015] border border-[#252B36] rounded px-2.5 pl-8 py-1.5 text-xs text-[#E6E8EB] placeholder-[#69717E] focus:outline-none focus:border-[#FF8A1F] transition-colors"
          />
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-1">
          {categories.map(cat => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                  isActive
                    ? 'bg-[#222733] text-[#FF8A1F] border border-[#FF8A1F]/50 font-semibold'
                    : 'bg-[#0E1015] text-[#A4ABB6] hover:text-[#E6E8EB] hover:bg-[#1B1F28] border border-[#252B36]'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Component Cards List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
        {filteredParts.map(part => {
          const isSelected = selectedCatalogPartType === part.type;
          const totalMass = part.dryMass + part.fuelMass;

          return (
            <div
              key={part.type}
              onClick={() => setSelectedCatalogPartType(part.type)}
              onDoubleClick={() => addPartToBlueprint(part.type, 0, 0)}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', part.type);
                setSelectedCatalogPartType(part.type);
              }}
              className={`group p-2.5 rounded border transition-all cursor-grab active:cursor-grabbing flex gap-2.5 items-center ${
                isSelected
                  ? 'bg-[#1B1F28] border-[#FF8A1F] shadow-xs'
                  : 'bg-[#1B1F28]/60 border-[#252B36] hover:bg-[#222733] hover:border-[#353D4A]'
              }`}
            >
              <div className="w-11 h-11 rounded bg-[#0E1015] border border-[#252B36] flex items-center justify-center shrink-0 p-1">
                <PartThumbnail part={part} size={38} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h4 className="text-xs font-medium text-[#E6E8EB] truncate group-hover:text-[#FF8A1F] transition-colors">
                    {part.name}
                  </h4>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      addPartToBlueprint(part.type, 0, 0);
                    }}
                    title="Add to blueprint"
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[#FF8A1F] hover:text-[#090A0D] text-[#A4ABB6] transition-all"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <p className="text-[11px] text-[#69717E] truncate mt-0.5">
                  {part.description}
                </p>

                <div className="flex items-center gap-2 mt-1 text-[10.5px] font-mono-num text-[#A4ABB6]">
                  <span>{totalMass.toFixed(1)} t</span>
                  <span className="text-[#353D4A]">│</span>
                  {part.thrust ? (
                    <span className="text-[#FF8A1F]">{part.thrust} kN</span>
                  ) : part.category === 'fuel' ? (
                    <span className="text-[#79AFC1]">{part.fuelMass.toFixed(1)} t fuel</span>
                  ) : (
                    <span>Cd {part.dragCoeff}</span>
                  )}
                  <span className="text-[#353D4A]">│</span>
                  <span>{part.heatTolerance} K</span>
                </div>
              </div>
            </div>
          );
        })}

        {filteredParts.length === 0 && (
          <div className="p-8 text-center text-xs text-[#69717E]">
            No components match your search.
          </div>
        )}
      </div>

      <div className="p-2 border-t border-[#252B36] bg-[#0E1015] text-[11px] text-[#69717E] text-center">
        Drag component to canvas or double-click to add
      </div>
    </aside>
  );
};
