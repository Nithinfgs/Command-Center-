import React, { useRef, useState, useEffect, useCallback } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Trash2, 
  Crosshair, 
  Copy,
  X
} from 'lucide-react';
import { useSimulation } from '../../context/SimulationContext';
import { PARTS_CATALOG, GRID_CELL_SIZE, calculateRocketProperties } from '../../physics/rocket-math';
import type { PlacedPart } from '../../types';

export const RocketBuilderCanvas: React.FC = () => {
  const {
    blueprint,
    selectedPartInstanceId,
    setSelectedPartInstanceId,
    movePartInBlueprint,
    rotatePartInBlueprint,
    removePartFromBlueprint,
    addPartToBlueprint,
    selectedCatalogPartType,
    setPartStage
  } = useSimulation();

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [zoom, setZoom] = useState<number>(1.2);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 50 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const [draggingPartId, setDraggingPartId] = useState<string | null>(null);
  const [partDragOffset, setPartDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isHoveringTrash, setIsHoveringTrash] = useState<boolean>(false);

  const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number; partId: string } | null>(null);

  const [showCoM, setShowCoM] = useState<boolean>(true);
  const [showCoP, setShowCoP] = useState<boolean>(true);
  const [showCoT, setShowCoT] = useState<boolean>(true);

  const metrics = calculateRocketProperties(blueprint);

  const screenToWorld = useCallback((screenX: number, screenY: number) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.width / 2 + pan.x;
    const centerY = rect.height / 2 + pan.y;
    const worldX = (screenX - rect.left - centerX) / (zoom * GRID_CELL_SIZE);
    const worldY = (screenY - rect.top - centerY) / (zoom * GRID_CELL_SIZE);
    return { x: worldX, y: worldY };
  }, [pan, zoom]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.12 : 0.88;
    setZoom(prev => Math.max(0.35, Math.min(3.5, prev * zoomFactor)));
  };

  const findPartAtWorld = (worldX: number, worldY: number): PlacedPart | null => {
    for (let i = blueprint.parts.length - 1; i >= 0; i--) {
      const part = blueprint.parts[i];
      const def = PARTS_CATALOG[part.partType];
      if (!def) continue;

      const halfW = def.width / 2;
      const halfH = def.height / 2;
      if (
        worldX >= part.x - halfW &&
        worldX <= part.x + halfW &&
        worldY >= part.y - halfH &&
        worldY <= part.y + halfH
      ) {
        return part;
      }
    }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    setContextMenu(null);
    const worldPos = screenToWorld(e.clientX, e.clientY);
    const clickedPart = findPartAtWorld(worldPos.x, worldPos.y);

    if (clickedPart) {
      if (e.button === 0) {
        setSelectedPartInstanceId(clickedPart.instanceId);
        setDraggingPartId(clickedPart.instanceId);
        setPartDragOffset({
          x: worldPos.x - clickedPart.x,
          y: worldPos.y - clickedPart.y
        });
      }
    } else {
      if (e.button === 0 || e.button === 1) {
        setIsPanning(true);
        setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
        setSelectedPartInstanceId(null);
      }
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;
    const worldPos = screenToWorld(e.clientX, e.clientY);
    const clickedPart = findPartAtWorld(worldPos.x, worldPos.y);

    if (clickedPart) {
      setSelectedPartInstanceId(clickedPart.instanceId);
      const rect = containerRef.current.getBoundingClientRect();
      setContextMenu({
        visible: true,
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        partId: clickedPart.instanceId
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    } else if (draggingPartId) {
      const worldPos = screenToWorld(e.clientX, e.clientY);
      let targetX = Math.round(worldPos.x - partDragOffset.x);
      let targetY = Math.round(worldPos.y - partDragOffset.y);

      // Magnetic Part Attachment Snapping
      const draggingPart = blueprint.parts.find(p => p.instanceId === draggingPartId);
      const draggingDef = draggingPart ? PARTS_CATALOG[draggingPart.partType] : null;

      if (draggingDef) {
        const thisH = draggingDef.height;
        const thisW = draggingDef.width;

        for (const other of blueprint.parts) {
          if (other.instanceId === draggingPartId) continue;
          const otherDef = PARTS_CATALOG[other.partType];
          if (!otherDef) continue;
          const otherH = otherDef.height;
          const otherW = otherDef.width;

          // Vertical stack snap (Top attachment)
          if (Math.abs(targetX - other.x) <= 1.2 && Math.abs(targetY - (other.y - (otherH + thisH) / 2)) <= 1.5) {
            targetX = other.x;
            targetY = other.y - (otherH + thisH) / 2;
            break;
          }
          // Vertical stack snap (Bottom attachment)
          if (Math.abs(targetX - other.x) <= 1.2 && Math.abs(targetY - (other.y + (otherH + thisH) / 2)) <= 1.5) {
            targetX = other.x;
            targetY = other.y + (otherH + thisH) / 2;
            break;
          }
          // Radial side snap (Left / Right boosters and fins)
          if (Math.abs(targetY - other.y) <= 1.0) {
            if (Math.abs(targetX - (other.x - (otherW + thisW) / 2)) <= 1.2) {
              targetX = other.x - (otherW + thisW) / 2;
              targetY = other.y;
              break;
            }
            if (Math.abs(targetX - (other.x + (otherW + thisW) / 2)) <= 1.2) {
              targetX = other.x + (otherW + thisW) / 2;
              targetY = other.y;
              break;
            }
          }
        }
      }

      movePartInBlueprint(draggingPartId, targetX, targetY);

      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const trashX = rect.width - 120;
        const trashY = rect.height - 120;
        setIsHoveringTrash(mouseX > trashX && mouseY > trashY);
      }
    }
  };

  const handleMouseUp = () => {
    if (draggingPartId && isHoveringTrash) {
      removePartFromBlueprint(draggingPartId);
    }
    setIsPanning(false);
    setDraggingPartId(null);
    setIsHoveringTrash(false);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (selectedCatalogPartType) {
      const worldPos = screenToWorld(e.clientX, e.clientY);
      addPartToBlueprint(selectedCatalogPartType, Math.round(worldPos.x), Math.round(worldPos.y));
    }
  };

  const handleDuplicate = (partId: string) => {
    const part = blueprint.parts.find(p => p.instanceId === partId);
    if (part) {
      addPartToBlueprint(part.partType, part.x + 2, part.y, part.stage);
      setContextMenu(null);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedPartInstanceId) return;
      if (e.key === 'Delete' || e.key === 'Backspace' || e.key.toLowerCase() === 'x') {
        e.preventDefault();
        removePartFromBlueprint(selectedPartInstanceId);
      } else if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        rotatePartInBlueprint(selectedPartInstanceId);
      } else if (e.key.toLowerCase() === 'd') {
        e.preventDefault();
        handleDuplicate(selectedPartInstanceId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPartInstanceId, removePartFromBlueprint, rotatePartInBlueprint]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !containerRef.current) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.scale(dpr, dpr);

    const centerX = width / 2 + pan.x;
    const centerY = height / 2 + pan.y;
    const cellSize = GRID_CELL_SIZE * zoom;

    ctx.fillStyle = '#040711';
    ctx.fillRect(0, 0, width, height);

    // Minor grid
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(15, 42, 82, 0.45)';
    const startX = (centerX % cellSize);
    const startY = (centerY % cellSize);

    ctx.beginPath();
    for (let x = startX; x < width; x += cellSize) {
      ctx.moveTo(Math.round(x) + 0.5, 0);
      ctx.lineTo(Math.round(x) + 0.5, height);
    }
    for (let y = startY; y < height; y += cellSize) {
      ctx.moveTo(0, Math.round(y) + 0.5);
      ctx.lineTo(width, Math.round(y) + 0.5);
    }
    ctx.stroke();

    // Major grid lines
    const majorCellSize = cellSize * 5;
    const majorStartX = (centerX % majorCellSize);
    const majorStartY = (centerY % majorCellSize);

    ctx.strokeStyle = 'rgba(0, 229, 255, 0.22)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let x = majorStartX; x < width; x += majorCellSize) {
      ctx.moveTo(Math.round(x) + 0.5, 0);
      ctx.lineTo(Math.round(x) + 0.5, height);
    }
    for (let y = majorStartY; y < height; y += majorCellSize) {
      ctx.moveTo(0, Math.round(y) + 0.5);
      ctx.lineTo(width, Math.round(y) + 0.5);
    }
    ctx.stroke();

    // Centerline
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(Math.round(centerX) + 0.5, 0);
    ctx.lineTo(Math.round(centerX) + 0.5, height);
    ctx.stroke();
    ctx.setLineDash([]);

    // Parts
    for (const part of blueprint.parts) {
      const def = PARTS_CATALOG[part.partType];
      if (!def) continue;

      const isSelected = selectedPartInstanceId === part.instanceId;
      const px = centerX + part.x * cellSize;
      const py = centerY + part.y * cellSize;
      const pw = def.width * cellSize;
      const ph = def.height * cellSize;

      ctx.save();
      ctx.translate(px, py);
      ctx.rotate((part.rotation * Math.PI) / 180);

      ctx.shadowColor = isSelected ? 'rgba(0, 229, 255, 0.5)' : 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = isSelected ? 16 : 8;

      if (def.texturePattern === 'cone') {
        const coneGrad = ctx.createLinearGradient(-pw / 2, 0, pw / 2, 0);
        coneGrad.addColorStop(0, '#1e293b');
        coneGrad.addColorStop(0.3, def.color);
        coneGrad.addColorStop(0.7, def.color);
        coneGrad.addColorStop(1, '#0f172a');

        ctx.fillStyle = coneGrad;
        ctx.beginPath();
        ctx.moveTo(-pw / 2, ph / 2);
        ctx.quadraticCurveTo(0, -ph / 2 - 12 * zoom, pw / 2, ph / 2);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = isSelected ? '#00e5ff' : '#475569';
        ctx.lineWidth = isSelected ? 2.5 : 1.5;
        ctx.stroke();

        if (def.category === 'command') {
          ctx.fillStyle = '#00e5ff';
          ctx.beginPath();
          ctx.arc(0, 0, 4.5 * zoom, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      } else if (def.texturePattern === 'engine-bell') {
        ctx.fillStyle = '#334155';
        ctx.fillRect(-pw * 0.35, -ph / 2, pw * 0.7, ph * 0.35);

        ctx.fillStyle = '#ffb703';
        ctx.fillRect(-pw * 0.25, -ph / 2 + ph * 0.35, pw * 0.5, ph * 0.1);

        const bellGrad = ctx.createLinearGradient(-pw / 2, 0, pw / 2, 0);
        bellGrad.addColorStop(0, '#1e293b');
        bellGrad.addColorStop(0.3, def.color);
        bellGrad.addColorStop(0.7, def.color);
        bellGrad.addColorStop(1, '#0f172a');

        ctx.fillStyle = bellGrad;
        ctx.beginPath();
        ctx.moveTo(-pw * 0.2, -ph / 2 + ph * 0.45);
        ctx.lineTo(pw * 0.2, -ph / 2 + ph * 0.45);
        ctx.lineTo(pw / 2, ph / 2);
        ctx.lineTo(-pw / 2, ph / 2);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = isSelected ? '#00e5ff' : '#475569';
        ctx.lineWidth = isSelected ? 2.5 : 1.5;
        ctx.stroke();

        ctx.fillStyle = '#ff3366';
        ctx.fillRect(-pw * 0.15, -ph / 2 + ph * 0.45, pw * 0.3, 3 * zoom);
      } else if (def.texturePattern === 'fin') {
        ctx.fillStyle = def.color;
        ctx.beginPath();
        ctx.moveTo(-pw / 2, -ph / 2);
        ctx.lineTo(pw / 2, 0);
        ctx.lineTo(pw / 2, ph / 2);
        ctx.lineTo(-pw / 2, ph / 2);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = isSelected ? '#00e5ff' : '#334155';
        ctx.lineWidth = isSelected ? 2.5 : 1.5;
        ctx.stroke();
      } else {
        const tankGrad = ctx.createLinearGradient(-pw / 2, 0, pw / 2, 0);
        tankGrad.addColorStop(0, '#1e293b');
        tankGrad.addColorStop(0.25, def.color);
        tankGrad.addColorStop(0.75, def.color);
        tankGrad.addColorStop(1, '#0f172a');

        ctx.fillStyle = tankGrad;
        ctx.fillRect(-pw / 2, -ph / 2, pw, ph);

        if (def.texturePattern === 'ribbed') {
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
          ctx.lineWidth = 1.2;
          const ribCount = Math.floor(def.height * 2);
          for (let r = 1; r < ribCount; r++) {
            const ry = -ph / 2 + (r * ph) / ribCount;
            ctx.beginPath();
            ctx.moveTo(-pw / 2, ry);
            ctx.lineTo(pw / 2, ry);
            ctx.stroke();
          }
        }

        ctx.strokeStyle = isSelected ? '#00e5ff' : '#334155';
        ctx.lineWidth = isSelected ? 2.5 : 1.5;
        ctx.strokeRect(-pw / 2, -ph / 2, pw, ph);
      }

      ctx.shadowBlur = 0;

      // Stage Tag
      ctx.fillStyle = '#050914';
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 1;
      const stageBadgeX = pw / 2 - 16;
      const stageBadgeY = -ph / 2 + 2;
      ctx.fillRect(stageBadgeX, stageBadgeY, 15, 11);
      ctx.strokeRect(stageBadgeX, stageBadgeY, 15, 11);

      ctx.fillStyle = '#00e5ff';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`S${part.stage}`, stageBadgeX + 7.5, stageBadgeY + 5.5);

      if (isSelected) {
        ctx.strokeStyle = '#00e5ff';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 4]);
        ctx.strokeRect(-pw / 2 - 5, -ph / 2 - 5, pw + 10, ph + 10);
        ctx.setLineDash([]);
      }

      ctx.restore();
    }

    // Physics Markers
    if (blueprint.parts.length > 0) {
      if (showCoM) {
        const comScreenX = centerX + metrics.centerOfMass.x * cellSize;
        const comScreenY = centerY + metrics.centerOfMass.y * cellSize;

        ctx.save();
        ctx.translate(comScreenX, comScreenY);

        ctx.fillStyle = '#040711';
        ctx.beginPath();
        ctx.arc(0, 0, 11, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffb703';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, 11, 0, Math.PI / 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, 11, Math.PI, Math.PI * 1.5);
        ctx.fill();

        ctx.strokeStyle = '#ffb703';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#ffb703';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('CoM', 15, 4);

        ctx.restore();
      }

      if (showCoP) {
        const copScreenX = centerX + metrics.centerOfPressure.x * cellSize;
        const copScreenY = centerY + metrics.centerOfPressure.y * cellSize;

        ctx.save();
        ctx.translate(copScreenX, copScreenY);

        ctx.strokeStyle = '#00e5ff';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(0, 0, 9, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(-14, 0);
        ctx.lineTo(14, 0);
        ctx.moveTo(0, -14);
        ctx.lineTo(0, 14);
        ctx.stroke();

        ctx.fillStyle = '#00e5ff';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('CoP', 15, 4);

        ctx.restore();
      }

      if (showCoT && metrics.totalThrust > 0) {
        const cotScreenX = centerX + metrics.centerOfThrust.x * cellSize;
        const cotScreenY = centerY + metrics.centerOfThrust.y * cellSize;

        ctx.save();
        ctx.translate(cotScreenX, cotScreenY);

        ctx.strokeStyle = '#ff3366';
        ctx.fillStyle = '#ff3366';
        ctx.lineWidth = 3;

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -30);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, -36);
        ctx.lineTo(-7, -26);
        ctx.lineTo(7, -26);
        ctx.closePath();
        ctx.fill();

        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('CoT', 15, -12);

        ctx.restore();
      }
    }
  }, [blueprint, selectedPartInstanceId, zoom, pan, showCoM, showCoP, showCoT, metrics]);

  const selectedPart = blueprint.parts.find(p => p.instanceId === selectedPartInstanceId);
  const selectedPartDef = selectedPart ? PARTS_CATALOG[selectedPart.partType] : null;

  return (
    <div 
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onContextMenu={handleContextMenu}
      onDoubleClick={handleDoubleClick}
      className="relative flex-1 h-full bg-[#040711] overflow-hidden cursor-crosshair select-none"
    >
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Top Floating View Controls */}
      <div 
        onMouseDown={e => e.stopPropagation()} 
        onClick={e => e.stopPropagation()}
        className="absolute top-3 left-3 flex items-center gap-1.5 bg-[#090f1d]/95 backdrop-blur-md border border-[#1e2d42] p-1.5 rounded-lg shadow-2xl text-xs font-mono"
      >
        <button
          onClick={() => setZoom(z => Math.min(3.5, z * 1.15))}
          title="Zoom In (+)"
          className="p-1.5 rounded hover:bg-[#152238] text-slate-300 hover:text-[#00e5ff] transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoom(z => Math.max(0.35, z / 1.15))}
          title="Zoom Out (-)"
          className="p-1.5 rounded hover:bg-[#152238] text-slate-300 hover:text-[#00e5ff] transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={() => { setPan({ x: 0, y: 50 }); setZoom(1.2); }}
          title="Reset Viewport"
          className="p-1.5 rounded hover:bg-[#152238] text-slate-300 hover:text-[#00e5ff] transition-colors"
        >
          <Crosshair className="w-4 h-4" />
        </button>
        <div className="w-[1px] h-4 bg-[#1e2d42] mx-1" />
        
        <button
          onClick={() => setShowCoM(v => !v)}
          className={`px-2 py-1 rounded text-[11px] font-bold flex items-center gap-1 transition-all ${
            showCoM ? 'bg-[#ffb703]/20 border border-[#ffb703] text-[#ffb703]' : 'text-slate-500 hover:bg-[#152238]'
          }`}
        >
          CoM
        </button>
        <button
          onClick={() => setShowCoP(v => !v)}
          className={`px-2 py-1 rounded text-[11px] font-bold flex items-center gap-1 transition-all ${
            showCoP ? 'bg-[#00e5ff]/20 border border-[#00e5ff] text-[#00e5ff]' : 'text-slate-500 hover:bg-[#152238]'
          }`}
        >
          CoP
        </button>
        <button
          onClick={() => setShowCoT(v => !v)}
          className={`px-2 py-1 rounded text-[11px] font-bold flex items-center gap-1 transition-all ${
            showCoT ? 'bg-[#ff3366]/20 border border-[#ff3366] text-[#ff3366]' : 'text-slate-500 hover:bg-[#152238]'
          }`}
        >
          CoT
        </button>
      </div>

      {/* Selected Part Action Bar with Guaranteed Stop-Propagation */}
      {selectedPart && selectedPartDef && (
        <div 
          onMouseDown={e => e.stopPropagation()}
          onClick={e => e.stopPropagation()}
          className="absolute top-3 right-3 bg-[#0a1122]/95 border-2 border-[#00e5ff] p-3.5 rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.9)] text-xs font-mono w-80 backdrop-blur-md z-40"
        >
          <div className="flex items-center justify-between pb-2 border-b border-[#1e2d42]">
            <span className="font-bold text-slate-100 text-sm truncate">{selectedPartDef.name}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedPartInstanceId(null);
              }}
              className="text-slate-400 hover:text-white p-0.5 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 my-2.5 text-[11px]">
            <div>
              <span className="text-slate-400 font-bold block mb-1">STAGE</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4].map(st => (
                  <button
                    key={st}
                    onClick={(e) => {
                      e.stopPropagation();
                      setPartStage(selectedPart.instanceId, st);
                    }}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                      selectedPart.stage === st
                        ? 'bg-[#00e5ff] text-slate-950 shadow-[0_0_10px_#00e5ff]'
                        : 'bg-[#152238] text-slate-400 hover:text-white'
                    }`}
                  >
                    S{st}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-slate-400 font-bold block mb-1">ROTATION</span>
              <div className="text-[#ffb703] font-bold text-sm">{selectedPart.rotation}°</div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2.5 border-t border-[#1e2d42]">
            <button
              onClick={(e) => {
                e.stopPropagation();
                rotatePartInBlueprint(selectedPart.instanceId);
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded bg-[#152238] hover:bg-[#1e3252] text-slate-200 border border-[#2b4166] font-bold transition-colors shadow-sm"
            >
              <RotateCw className="w-4 h-4 text-[#00e5ff]" />
              <span>Rotate (R)</span>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDuplicate(selectedPart.instanceId);
              }}
              className="flex items-center justify-center gap-1 px-3 py-2 rounded bg-[#152238] hover:bg-[#1e3252] text-slate-200 border border-[#2b4166] font-bold transition-colors shadow-sm"
              title="Duplicate (D)"
            >
              <Copy className="w-4 h-4 text-[#ffb703]" />
              <span>Copy</span>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                removePartFromBlueprint(selectedPart.instanceId);
              }}
              className="flex items-center justify-center gap-1.5 px-4 py-2 rounded bg-[#ff3366] hover:bg-[#ff1a53] text-white font-black transition-all shadow-[0_0_15px_rgba(255,51,102,0.6)] active:scale-95 cursor-pointer"
              title="Delete Part"
            >
              <Trash2 className="w-4 h-4" />
              <span>DELETE</span>
            </button>
          </div>
        </div>
      )}

      {/* Right-Click Context Menu */}
      {contextMenu && (
        <div
          onMouseDown={e => e.stopPropagation()}
          onClick={e => e.stopPropagation()}
          className="absolute z-50 bg-[#090f1d] border-2 border-[#00e5ff] rounded-lg shadow-2xl p-1 font-mono text-xs w-48 backdrop-blur-md"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            onClick={() => rotatePartInBlueprint(contextMenu.partId)}
            className="w-full text-left px-3 py-2 rounded hover:bg-[#152238] text-slate-200 flex items-center gap-2"
          >
            <RotateCw className="w-3.5 h-3.5 text-[#00e5ff]" />
            <span>Rotate 90° (R)</span>
          </button>
          <button
            onClick={() => handleDuplicate(contextMenu.partId)}
            className="w-full text-left px-3 py-2 rounded hover:bg-[#152238] text-slate-200 flex items-center gap-2"
          >
            <Copy className="w-3.5 h-3.5 text-[#ffb703]" />
            <span>Duplicate Part (D)</span>
          </button>
          <div className="h-[1px] bg-[#1e2d42] my-1" />
          <button
            onClick={() => {
              removePartFromBlueprint(contextMenu.partId);
              setContextMenu(null);
            }}
            className="w-full text-left px-3 py-2 rounded bg-[#ff3366]/20 hover:bg-[#ff3366] text-[#ff3366] hover:text-white font-black flex items-center gap-2 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Part</span>
          </button>
        </div>
      )}

      {/* Trash Drop Zone */}
      <div 
        onMouseDown={e => e.stopPropagation()}
        onClick={e => e.stopPropagation()}
        className={`absolute bottom-4 right-4 p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1.5 font-mono text-xs ${
          isHoveringTrash
            ? 'bg-[#ff3366]/40 border-[#ff3366] scale-110 shadow-[0_0_30px_#ff3366] text-white'
            : 'bg-[#090f1d]/90 border-[#1e2d42] text-slate-400 hover:border-slate-500'
        }`}
      >
        <Trash2 className={`w-6 h-6 ${isHoveringTrash ? 'text-white animate-bounce' : 'text-slate-500'}`} />
        <span className="text-[10px] font-bold uppercase tracking-wider">
          {isHoveringTrash ? 'RELEASE TO DELETE' : 'DRAG HERE TO DELETE'}
        </span>
      </div>

      {/* Footer */}
      <div 
        onMouseDown={e => e.stopPropagation()}
        className="absolute bottom-3 left-3 bg-[#090f1d]/90 border border-[#1e2d42] px-3.5 py-1.5 rounded-lg text-[11px] font-mono text-slate-300 flex items-center gap-4 shadow-xl"
      >
        <span>GRID: <strong className="text-[#00e5ff]">20px (1m scale)</strong></span>
        <span>ZOOM: <strong className="text-slate-100">{(zoom * 100).toFixed(0)}%</strong></span>
        <span>AERO: <strong className={metrics.aerodynamicStabilityMargin > 0 ? 'text-[#00f59b]' : 'text-[#ff3366]'}>
          {metrics.aerodynamicStabilityMargin > 0 ? 'STABLE' : 'UNSTABLE'} ({metrics.aerodynamicStabilityMargin}m)
        </strong></span>
      </div>
    </div>
  );
};
