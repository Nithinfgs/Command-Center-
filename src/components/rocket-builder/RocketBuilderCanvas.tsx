import React, { useRef, useState, useEffect, useCallback } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Trash2, 
  Copy,
  Maximize2
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
    selectedCatalogPartType
  } = useSimulation();

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [zoom, setZoom] = useState<number>(1.2);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 50 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const [draggingPartId, setDraggingPartId] = useState<string | null>(null);
  const [partDragOffset, setPartDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoveredPartId, setHoveredPartId] = useState<string | null>(null);

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

  const worldToScreen = useCallback((worldX: number, worldY: number) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.width / 2 + pan.x;
    const centerY = rect.height / 2 + pan.y;
    const screenX = centerX + worldX * zoom * GRID_CELL_SIZE;
    const screenY = centerY + worldY * zoom * GRID_CELL_SIZE;
    return { x: screenX, y: screenY };
  }, [pan, zoom]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
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

  const handleMouseMove = (e: React.MouseEvent) => {
    const worldPos = screenToWorld(e.clientX, e.clientY);
    const hovered = findPartAtWorld(worldPos.x, worldPos.y);
    setHoveredPartId(hovered?.instanceId || null);

    if (isPanning) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    } else if (draggingPartId) {
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
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingPartId(null);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (selectedCatalogPartType) {
      const worldPos = screenToWorld(e.clientX, e.clientY);
      addPartToBlueprint(selectedCatalogPartType, Math.round(worldPos.x), Math.round(worldPos.y));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const partType = e.dataTransfer.getData('text/plain');
    if (partType) {
      const worldPos = screenToWorld(e.clientX, e.clientY);
      addPartToBlueprint(partType, Math.round(worldPos.x), Math.round(worldPos.y));
    }
  };

  const handleFitView = () => {
    if (blueprint.parts.length === 0) {
      setPan({ x: 0, y: 50 });
      setZoom(1.2);
      return;
    }

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const p of blueprint.parts) {
      const def = PARTS_CATALOG[p.partType];
      const hw = (def?.width || 2) / 2;
      const hh = (def?.height || 2) / 2;
      minX = Math.min(minX, p.x - hw);
      maxX = Math.max(maxX, p.x + hw);
      minY = Math.min(minY, p.y - hh);
      maxY = Math.max(maxY, p.y + hh);
    }

    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;
    const spanY = Math.max(10, maxY - minY + 4);
    
    if (containerRef.current) {
      const height = containerRef.current.clientHeight;
      const targetZoom = Math.min(2.0, Math.max(0.5, (height * 0.75) / (spanY * GRID_CELL_SIZE)));
      setZoom(targetZoom);
      setPan({ x: -midX * targetZoom * GRID_CELL_SIZE, y: -midY * targetZoom * GRID_CELL_SIZE });
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedPartInstanceId) return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        removePartFromBlueprint(selectedPartInstanceId);
      } else if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        rotatePartInBlueprint(selectedPartInstanceId);
      } else if (e.key.toLowerCase() === 'escape') {
        setSelectedPartInstanceId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPartInstanceId, removePartFromBlueprint, rotatePartInBlueprint, setSelectedPartInstanceId]);

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

    ctx.save();
    ctx.scale(dpr, dpr);

    const centerX = width / 2 + pan.x;
    const centerY = height / 2 + pan.y;
    const cellSize = GRID_CELL_SIZE * zoom;

    // Open, restrained aerospace CAD workspace background
    ctx.fillStyle = '#0E1520';
    ctx.fillRect(0, 0, width, height);

    // Subtle Engineering Grid
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#141C2B';
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

    // Major Grid Lines (every 5 cells = 100px)
    const majorCellSize = cellSize * 5;
    const majorStartX = (centerX % majorCellSize);
    const majorStartY = (centerY % majorCellSize);

    ctx.strokeStyle = '#1C293D';
    ctx.lineWidth = 1;
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

    // Subtle Engineering Vertical Centerline
    ctx.strokeStyle = '#263548';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(Math.round(centerX) + 0.5, 0);
    ctx.lineTo(Math.round(centerX) + 0.5, height);
    ctx.stroke();
    ctx.setLineDash([]);

    // Render Rocket Assembly Parts
    for (const part of blueprint.parts) {
      const def = PARTS_CATALOG[part.partType];
      if (!def) continue;

      const isSelected = selectedPartInstanceId === part.instanceId;
      const isHovered = hoveredPartId === part.instanceId && !isSelected;
      const px = centerX + part.x * cellSize;
      const py = centerY + part.y * cellSize;
      const pw = def.width * cellSize;
      const ph = def.height * cellSize;

      ctx.save();
      ctx.translate(px, py);
      ctx.rotate((part.rotation * Math.PI) / 180);

      // Subtle shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 2;

      if (def.texturePattern === 'cone') {
        const coneGrad = ctx.createLinearGradient(-pw / 2, 0, pw / 2, 0);
        coneGrad.addColorStop(0, '#1E293B');
        coneGrad.addColorStop(0.35, def.color);
        coneGrad.addColorStop(0.65, def.color);
        coneGrad.addColorStop(1, '#0F172A');

        ctx.fillStyle = coneGrad;
        ctx.beginPath();
        ctx.moveTo(-pw / 2, ph / 2);
        ctx.quadraticCurveTo(0, -ph / 2 - 10 * zoom, pw / 2, ph / 2);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = isSelected ? '#38BDF8' : isHovered ? '#64748B' : '#263548';
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.stroke();

        if (def.category === 'command') {
          ctx.fillStyle = '#38BDF8';
          ctx.beginPath();
          ctx.arc(0, 0, 3.5 * zoom, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (def.texturePattern === 'engine-bell') {
        ctx.fillStyle = '#1E293B';
        ctx.fillRect(-pw * 0.35, -ph / 2, pw * 0.7, ph * 0.35);

        const bellGrad = ctx.createLinearGradient(-pw / 2, 0, pw / 2, 0);
        bellGrad.addColorStop(0, '#0F172A');
        bellGrad.addColorStop(0.35, def.color);
        bellGrad.addColorStop(0.65, def.color);
        bellGrad.addColorStop(1, '#0F172A');

        ctx.fillStyle = bellGrad;
        ctx.beginPath();
        ctx.moveTo(-pw * 0.2, -ph / 2 + ph * 0.45);
        ctx.lineTo(pw * 0.2, -ph / 2 + ph * 0.45);
        ctx.lineTo(pw / 2, ph / 2);
        ctx.lineTo(-pw / 2, ph / 2);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = isSelected ? '#38BDF8' : isHovered ? '#64748B' : '#263548';
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.stroke();
      } else if (def.texturePattern === 'fin') {
        const isRightSide = part.x > 0;
        ctx.fillStyle = def.color;
        ctx.beginPath();
        if (isRightSide) {
          // Right fin: root at left (-pw/2), tip at right (+pw/2)
          ctx.moveTo(-pw / 2, -ph / 2);
          ctx.lineTo(pw / 2, ph * 0.2);
          ctx.lineTo(pw / 2, ph / 2);
          ctx.lineTo(-pw / 2, ph / 2);
        } else {
          // Left fin: root at right (+pw/2), tip at left (-pw/2)
          ctx.moveTo(pw / 2, -ph / 2);
          ctx.lineTo(-pw / 2, ph * 0.2);
          ctx.lineTo(-pw / 2, ph / 2);
          ctx.lineTo(pw / 2, ph / 2);
        }
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = isSelected ? '#38BDF8' : isHovered ? '#64748B' : '#263548';
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.stroke();
      } else {
        const tankGrad = ctx.createLinearGradient(-pw / 2, 0, pw / 2, 0);
        tankGrad.addColorStop(0, '#1E293B');
        tankGrad.addColorStop(0.25, def.color);
        tankGrad.addColorStop(0.75, def.color);
        tankGrad.addColorStop(1, '#0F172A');

        ctx.fillStyle = tankGrad;
        ctx.fillRect(-pw / 2, -ph / 2, pw, ph);

        if (def.texturePattern === 'ribbed') {
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
          ctx.lineWidth = 1;
          const ribCount = Math.floor(def.height * 2);
          for (let r = 1; r < ribCount; r++) {
            const ry = -ph / 2 + (r * ph) / ribCount;
            ctx.beginPath();
            ctx.moveTo(-pw / 2, ry);
            ctx.lineTo(pw / 2, ry);
            ctx.stroke();
          }
        }

        ctx.strokeStyle = isSelected ? '#38BDF8' : isHovered ? '#64748B' : '#263548';
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.strokeRect(-pw / 2, -ph / 2, pw, ph);
      }

      // Stage Tag
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#121A26';
      ctx.strokeStyle = '#263548';
      ctx.lineWidth = 1;
      const stageBadgeX = pw / 2 - 15;
      const stageBadgeY = -ph / 2 + 2;
      ctx.fillRect(stageBadgeX, stageBadgeY, 14, 11);
      ctx.strokeRect(stageBadgeX, stageBadgeY, 14, 11);

      ctx.fillStyle = '#9AA9B8';
      ctx.font = '500 9px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`S${part.stage}`, stageBadgeX + 7, stageBadgeY + 5.5);

      if (isSelected) {
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 3]);
        ctx.strokeRect(-pw / 2 - 4, -ph / 2 - 4, pw + 8, ph + 8);
        ctx.setLineDash([]);
      }

      ctx.restore();
    }

    // Physics Markers (CoM, CoP, CoT)
    if (blueprint.parts.length > 0) {
      if (showCoM) {
        const comScreenX = centerX + metrics.centerOfMass.x * cellSize;
        const comScreenY = centerY + metrics.centerOfMass.y * cellSize;

        ctx.save();
        ctx.translate(comScreenX, comScreenY);

        ctx.fillStyle = '#121A26';
        ctx.beginPath();
        ctx.arc(0, 0, 9, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FBBF24';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, 9, 0, Math.PI / 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, 9, Math.PI, Math.PI * 1.5);
        ctx.fill();

        ctx.strokeStyle = '#FBBF24';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#FBBF24';
        ctx.font = '500 10px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('CoM', 13, 3.5);

        ctx.restore();
      }

      if (showCoP) {
        const copScreenX = centerX + metrics.centerOfPressure.x * cellSize;
        const copScreenY = centerY + metrics.centerOfPressure.y * cellSize;

        ctx.save();
        ctx.translate(copScreenX, copScreenY);

        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(-11, 0);
        ctx.lineTo(11, 0);
        ctx.moveTo(0, -11);
        ctx.lineTo(0, 11);
        ctx.stroke();

        ctx.fillStyle = '#38BDF8';
        ctx.font = '500 10px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('CoP', 13, 3.5);

        ctx.restore();
      }

      if (showCoT && metrics.totalThrust > 0) {
        const cotScreenX = centerX + metrics.centerOfThrust.x * cellSize;
        const cotScreenY = centerY + metrics.centerOfThrust.y * cellSize;

        ctx.save();
        ctx.translate(cotScreenX, cotScreenY);

        ctx.strokeStyle = '#F43F5E';
        ctx.fillStyle = '#F43F5E';
        ctx.lineWidth = 2.5;

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -22);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, -28);
        ctx.lineTo(-5, -20);
        ctx.lineTo(5, -20);
        ctx.closePath();
        ctx.fill();

        ctx.font = '500 10px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('CoT', 13, -10);

        ctx.restore();
      }
    }

    ctx.restore();
  }, [blueprint, selectedPartInstanceId, hoveredPartId, zoom, pan, showCoM, showCoP, showCoT, metrics]);

  const selectedPart = blueprint.parts.find(p => p.instanceId === selectedPartInstanceId);
  const selectedPartDef = selectedPart ? PARTS_CATALOG[selectedPart.partType] : null;

  const selectedScreenPos = selectedPart 
    ? worldToScreen(selectedPart.x, selectedPart.y) 
    : null;

  return (
    <div 
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onDoubleClick={handleDoubleClick}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="relative flex-1 h-full bg-[#0E1520] overflow-hidden select-none"
    >
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Top Left Minimal CAD Toolbar */}
      <div 
        onMouseDown={e => e.stopPropagation()} 
        className="absolute top-3 left-3 flex items-center gap-1 bg-[#121A26] border border-[#263548]/70 p-1 rounded-lg shadow-sm text-xs z-10"
      >
        <button
          onClick={() => setZoom(z => Math.min(3.5, z * 1.15))}
          title="Zoom In"
          className="p-1.5 rounded hover:bg-[#172131] text-[#9AA9B8] hover:text-[#E8EDF2] transition-colors"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => setZoom(z => Math.max(0.35, z / 1.15))}
          title="Zoom Out"
          className="p-1.5 rounded hover:bg-[#172131] text-[#9AA9B8] hover:text-[#E8EDF2] transition-colors"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={handleFitView}
          title="Fit View"
          className="p-1.5 rounded hover:bg-[#172131] text-[#9AA9B8] hover:text-[#E8EDF2] transition-colors"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>

        <div className="w-[1px] h-3.5 bg-[#263548] mx-0.5" />

        <button
          onClick={() => setShowCoM(v => !v)}
          className={`px-2 py-1 rounded text-[11px] font-mono-num transition-colors ${
            showCoM 
              ? 'bg-[#172131] text-[#FBBF24] font-medium' 
              : 'text-[#64748B] hover:text-[#9AA9B8]'
          }`}
        >
          CoM
        </button>

        <button
          onClick={() => setShowCoP(v => !v)}
          className={`px-2 py-1 rounded text-[11px] font-mono-num transition-colors ${
            showCoP 
              ? 'bg-[#172131] text-[#38BDF8] font-medium' 
              : 'text-[#64748B] hover:text-[#9AA9B8]'
          }`}
        >
          CoP
        </button>

        <button
          onClick={() => setShowCoT(v => !v)}
          className={`px-2 py-1 rounded text-[11px] font-mono-num transition-colors ${
            showCoT 
              ? 'bg-[#172131] text-[#F43F5E] font-medium' 
              : 'text-[#64748B] hover:text-[#9AA9B8]'
          }`}
        >
          CoT
        </button>
      </div>

      {/* Contextual Action Overlay near Selected Component */}
      {selectedPart && selectedPartDef && selectedScreenPos && (
        <div
          onMouseDown={e => e.stopPropagation()}
          className="absolute z-30 flex items-center gap-1 bg-[#121A26] border border-[#263548] p-1 rounded-md shadow-lg"
          style={{
            left: Math.max(10, Math.min((containerRef.current?.clientWidth || 600) - 150, selectedScreenPos.x - 70)),
            top: Math.max(50, selectedScreenPos.y - (selectedPartDef.height * zoom * GRID_CELL_SIZE) / 2 - 38)
          }}
        >
          <span className="text-[11px] font-medium text-[#E8EDF2] px-1.5 truncate max-w-[100px]">
            {selectedPartDef.name}
          </span>

          <div className="w-[1px] h-3 bg-[#263548]" />

          <button
            onClick={() => rotatePartInBlueprint(selectedPart.instanceId)}
            title="Rotate 90° (R)"
            className="p-1 rounded hover:bg-[#172131] text-[#9AA9B8] hover:text-[#38BDF8] transition-colors"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => addPartToBlueprint(selectedPart.partType, selectedPart.x + 1, selectedPart.y)}
            title="Duplicate"
            className="p-1 rounded hover:bg-[#172131] text-[#9AA9B8] hover:text-[#38BDF8] transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => removePartFromBlueprint(selectedPart.instanceId)}
            title="Delete (Del)"
            className="p-1 rounded hover:bg-[#F43F5E]/20 text-[#64748B] hover:text-[#F43F5E] transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Scale & Coordinate Indicator in Bottom Left */}
      <div className="absolute bottom-3 left-3 text-[11px] font-mono-num text-[#64748B] flex items-center gap-3">
        <span>Grid: 1.0 m</span>
        <span>Zoom: {(zoom * 100).toFixed(0)}%</span>
        <span>Parts: {blueprint.parts.length}</span>
      </div>
    </div>
  );
};
