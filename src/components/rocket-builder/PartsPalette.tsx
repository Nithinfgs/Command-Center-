import React, { useState } from 'react';
import { Search, Plus } from 'lucide-react';
import { PARTS_CATALOG } from '../../physics/rocket-math';
import { useSimulation } from '../../context/SimulationContext';
import { PartThumbnail } from './PartThumbnail';

export const PartsPalette: React.FC = () => {
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
    <aside className="w-[280px] bg-[#121A26] border-r border-[#1C2938] flex flex-col h-full select-none shrink-0 z-20">
      {/* Search Header */}
      <div className="p-3 border-b border-[#1C2938] space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-[#E8EDF2] tracking-tight">Components</h2>
          <span className="text-[11px] font-mono-num text-[#64748B]">
            {filteredParts.length} items
          </span>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#64748B]" />
          <input
            type="text"
            placeholder="Search components..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-[#0B0F17] border border-[#263548] rounded-md pl-8 pr-2.5 py-1.5 text-xs text-[#E8EDF2] placeholder-[#64748B] focus:outline-none focus:border-[#38BDF8] transition-colors"
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
                    ? 'bg-[#172131] text-[#38BDF8] border border-[#38BDF8]/40'
                    : 'bg-[#0B0F17]/60 text-[#9AA9B8] hover:text-[#E8EDF2] hover:bg-[#172131]'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Component Cards List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
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
              className={`group p-2.5 rounded-lg border transition-all cursor-grab active:cursor-grabbing flex gap-2.5 items-center ${
                isSelected
                  ? 'bg-[#1A3040] border-[#38BDF8]/70 shadow-xs'
                  : 'bg-[#172131] border-[#263548]/50 hover:bg-[#1B2838] hover:border-[#263548]'
              }`}
            >
              <div className="w-12 h-12 rounded bg-[#0E1520] border border-[#263548]/40 flex items-center justify-center shrink-0 p-1">
                <PartThumbnail part={part} size={42} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h4 className="text-xs font-medium text-[#E8EDF2] truncate group-hover:text-[#38BDF8] transition-colors">
                    {part.name}
                  </h4>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      addPartToBlueprint(part.type, 0, 0);
                    }}
                    title="Add to blueprint"
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[#38BDF8] hover:text-[#0B0F17] text-[#9AA9B8] transition-all"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <p className="text-[11px] text-[#64748B] truncate mt-0.5">
                  {part.description}
                </p>

                <div className="flex items-center gap-2.5 mt-1.5 text-[10.5px] font-mono-num text-[#9AA9B8]">
                  <span>{totalMass.toFixed(1)} t</span>
                  <span className="text-[#263548]">│</span>
                  {part.thrust ? (
                    <span className="text-[#FBBF24]">{part.thrust} kN</span>
                  ) : part.category === 'fuel' ? (
                    <span>{part.fuelMass.toFixed(1)} t fuel</span>
                  ) : (
                    <span>Cd {part.dragCoeff}</span>
                  )}
                  <span className="text-[#263548]">│</span>
                  <span>{part.heatTolerance} K</span>
                </div>
              </div>
            </div>
          );
        })}

        {filteredParts.length === 0 && (
          <div className="p-8 text-center text-xs text-[#64748B]">
            No components match your search.
          </div>
        )}
      </div>

      <div className="p-2 border-t border-[#1C2938] bg-[#0E1520]/50 text-[11px] text-[#64748B] text-center">
        Drag component to canvas or double-click to add
      </div>
    </aside>
  );
};
