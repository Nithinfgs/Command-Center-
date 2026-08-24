import React, { useRef, useState, useEffect, useCallback } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Trash2, 
  Copy,
  Maximize2,
  Undo2,
  Redo2,
  AlertTriangle
} from 'lucide-react';
import { useSimulation } from '../../context/SimulationContext';
import { PARTS_CATALOG, GRID_CELL_SIZE, calculateRocketProperties, validateStructuralConnectivity } from '../../physics/rocket-math';
import type { PlacedPart, SymmetryMode } from '../../types';

export const RocketBuilderCanvas: React.FC = () => {
  const {
    blueprint,
    selectedPartInstanceId,
    setSelectedPartInstanceId,
    movePartInBlueprint,
    rotatePartInBlueprint,
    removePartFromBlueprint,
    addPartToBlueprint,
    duplicatePartInBlueprint,
    selectedCatalogPartType,
    symmetryMode,
    setSymmetryMode,
    canUndo,
    canRedo,
    undo,
    redo
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
  const connectivity = validateStructuralConnectivity(blueprint.parts);

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
        // Alt-drag to duplicate part
        if (e.altKey) {
          duplicatePartInBlueprint(clickedPart.instanceId);
          return;
        }

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
    setHoveredPartId(hovered ? hovered.instanceId : null);

    if (isPanning) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    } else if (draggingPartId) {
      let rawX = worldPos.x - partDragOffset.x;
      let rawY = worldPos.y - partDragOffset.y;

      let targetX = Math.round(rawX);
      let targetY = Math.round(rawY);

      // Intelligent Node & Boundary Snapping
      const draggingPart = blueprint.parts.find(p => p.instanceId === draggingPartId);
      const dragDef = draggingPart ? PARTS_CATALOG[draggingPart.partType] : null;

      if (dragDef) {
        const thisW = dragDef.width;
        const thisH = dragDef.height;

        for (const other of blueprint.parts) {
          if (other.instanceId === draggingPartId) continue;
          const otherDef = PARTS_CATALOG[other.partType];
          if (!otherDef) continue;

          const otherW = otherDef.width;
          const otherH = otherDef.height;

          // Vertical Stacking Snap
          if (Math.abs(targetX - other.x) <= 0.8) {
            // Stack on top
            if (Math.abs(targetY - (other.y - (otherH + thisH) / 2)) <= 1.0) {
              targetX = other.x;
              targetY = other.y - (otherH + thisH) / 2;
              break;
            }
            // Stack below
            if (Math.abs(targetY - (other.y + (otherH + thisH) / 2)) <= 1.0) {
              targetX = other.x;
              targetY = other.y + (otherH + thisH) / 2;
              break;
            }
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
        rotatePartInBlueprint(selectedPartInstanceId, e.shiftKey ? 15 : 90);
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

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    ctx.clearRect(0, 0, width, height);

    // Deep Void Background
    ctx.fillStyle = '#090A0D';
    ctx.fillRect(0, 0, width, height);

    const centerX = width / 2 + pan.x;
    const centerY = height / 2 + pan.y;

    // Draw Grid Lines
    const step = GRID_CELL_SIZE * zoom;
    const startX = ((centerX % step) + step) % step;
    const startY = ((centerY % step) + step) % step;

    ctx.strokeStyle = '#151820';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = startX; x < width; x += step) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    for (let y = startY; y < height; y += step) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();

    // Central Symmetry Centerline
    ctx.strokeStyle = '#FF8A1F';
    ctx.globalAlpha = 0.35;
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, height);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1.0;

    // Ground launch base line at bottom
    ctx.strokeStyle = '#353D4A';
    ctx.lineWidth = 2;
    const groundY = centerY + 18 * zoom * GRID_CELL_SIZE;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(width, groundY);
    ctx.stroke();

    // Render Placed Parts
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.scale(zoom * GRID_CELL_SIZE, zoom * GRID_CELL_SIZE);

    for (const part of blueprint.parts) {
      const def = PARTS_CATALOG[part.partType];
      if (!def) continue;

      const isSelected = part.instanceId === selectedPartInstanceId;
      const isHovered = part.instanceId === hoveredPartId;
      const isDisconnected = connectivity.disconnectedIds.includes(part.instanceId);

      ctx.save();
      ctx.translate(part.x, part.y);
      ctx.rotate((part.rotation * Math.PI) / 180);

      const hw = def.width / 2;
      const hh = def.height / 2;

      // Part Body Fill
      ctx.fillStyle = def.color;
      ctx.fillRect(-hw, -hh, def.width, def.height);

      // Part Border
      if (isSelected) {
        ctx.strokeStyle = '#FF8A1F'; // Signal Orange selection
        ctx.lineWidth = 0.15;
      } else if (isDisconnected) {
        ctx.strokeStyle = '#D95757'; // Critical Red Disconnected Warning
        ctx.lineWidth = 0.12;
      } else if (isHovered) {
        ctx.strokeStyle = '#79AFC1'; // Telemetry cyan hover
        ctx.lineWidth = 0.1;
      } else {
        ctx.strokeStyle = '#252B36';
        ctx.lineWidth = 0.05;
      }
      ctx.strokeRect(-hw, -hh, def.width, def.height);

      // Texture pattern / ribbing
      if (def.texturePattern === 'ribbed') {
        ctx.strokeStyle = '#1E293B';
        ctx.lineWidth = 0.04;
        for (let ry = -hh + 0.5; ry < hh; ry += 0.6) {
          ctx.beginPath();
          ctx.moveTo(-hw, ry);
          ctx.lineTo(hw, ry);
          ctx.stroke();
        }
      } else if (def.texturePattern === 'engine-bell') {
        // Engine bell nozzle taper
        ctx.fillStyle = '#0F172A';
        ctx.beginPath();
        ctx.moveTo(-hw * 0.4, -hh);
        ctx.lineTo(hw * 0.4, -hh);
        ctx.lineTo(hw * 0.9, hh);
        ctx.lineTo(-hw * 0.9, hh);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#FF8A1F';
        ctx.lineWidth = 0.04;
        ctx.stroke();
      } else if (def.texturePattern === 'cone') {
        // Ogive nosecone taper
        ctx.fillStyle = '#F8FAFC';
        ctx.beginPath();
        ctx.moveTo(0, -hh);
        ctx.lineTo(hw, hh);
        ctx.lineTo(-hw, hh);
        ctx.closePath();
        ctx.fill();
      }

      // Disconnected Warning Icon Outline
      if (isDisconnected) {
        ctx.fillStyle = '#D95757';
        ctx.font = 'bold 0.6px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚠️', 0, 0);
      }

      // Connection Nodes
      for (const node of def.connectionPoints) {
        ctx.fillStyle = isSelected ? '#FF8A1F' : '#79AFC1';
        ctx.beginPath();
        ctx.arc(node.x, node.y, 0.12, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    // CoM, CoP, CoT Markers
    if (blueprint.parts.length > 0) {
      if (showCoM) {
        ctx.save();
        ctx.translate(metrics.centerOfMass.x, metrics.centerOfMass.y);
        ctx.fillStyle = '#55B982';
        ctx.beginPath();
        ctx.arc(0, 0, 0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#090A0D';
        ctx.lineWidth = 0.08;
        ctx.stroke();
        ctx.restore();
      }

      if (showCoP) {
        ctx.save();
        ctx.translate(metrics.centerOfPressure.x, metrics.centerOfPressure.y);
        ctx.fillStyle = '#79AFC1';
        ctx.beginPath();
        ctx.arc(0, 0, 0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#090A0D';
        ctx.lineWidth = 0.08;
        ctx.stroke();
        ctx.restore();
      }

      if (showCoT && metrics.totalThrust > 0) {
        ctx.save();
        ctx.translate(metrics.centerOfThrust.x, metrics.centerOfThrust.y);
        ctx.fillStyle = '#FF8A1F';
        ctx.beginPath();
        ctx.arc(0, 0, 0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#090A0D';
        ctx.lineWidth = 0.08;
        ctx.stroke();
        ctx.restore();
      }
    }

    ctx.restore();
  }, [blueprint, selectedPartInstanceId, hoveredPartId, zoom, pan, showCoM, showCoP, showCoT, metrics, connectivity]);

  const selectedPart = blueprint.parts.find(p => p.instanceId === selectedPartInstanceId);
  const selectedPartDef = selectedPart ? PARTS_CATALOG[selectedPart.partType] : null;
  const selectedScreenPos = selectedPart ? worldToScreen(selectedPart.x, selectedPart.y) : null;

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
      className="relative flex-1 h-full bg-[#090A0D] overflow-hidden select-none"
    >
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Top Left CAD & History Toolbar */}
      <div 
        onMouseDown={e => e.stopPropagation()} 
        className="absolute top-3 left-3 flex items-center gap-1.5 bg-[#151820] border border-[#252B36] p-1.5 rounded-lg shadow-lg text-xs z-20"
      >
        {/* Undo / Redo */}
        <button
          onClick={undo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          className={`p-1.5 rounded transition-colors ${canUndo ? 'text-[#E6E8EB] hover:bg-[#1B1F28]' : 'text-[#69717E] cursor-not-allowed'}`}
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={redo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
          className={`p-1.5 rounded transition-colors ${canRedo ? 'text-[#E6E8EB] hover:bg-[#1B1F28]' : 'text-[#69717E] cursor-not-allowed'}`}
        >
          <Redo2 className="w-3.5 h-3.5" />
        </button>

        <div className="w-[1px] h-4 bg-[#252B36] mx-0.5" />

        {/* Symmetry Selector */}
        <div className="flex items-center gap-0.5 bg-[#0E1015] p-0.5 rounded border border-[#252B36]">
          {(['1x', '2x_mirror', '2x_radial', '3x', '4x'] as SymmetryMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => setSymmetryMode(mode)}
              title={`Symmetry Mode: ${mode}`}
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono-num transition-all ${
                symmetryMode === mode
                  ? 'bg-[#FF8A1F] text-[#090A0D] font-bold'
                  : 'text-[#A4ABB6] hover:text-[#E6E8EB]'
              }`}
            >
              {mode.replace('_', ' ').toUpperCase()}
            </button>
          ))}
        </div>

        <div className="w-[1px] h-4 bg-[#252B36] mx-0.5" />

        {/* Zoom & Fit */}
        <button
          onClick={() => setZoom(z => Math.min(3.5, z * 1.15))}
          title="Zoom In"
          className="p-1.5 rounded hover:bg-[#1B1F28] text-[#A4ABB6] hover:text-[#E6E8EB]"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => setZoom(z => Math.max(0.35, z / 1.15))}
          title="Zoom Out"
          className="p-1.5 rounded hover:bg-[#1B1F28] text-[#A4ABB6] hover:text-[#E6E8EB]"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={handleFitView}
          title="Fit View"
          className="p-1.5 rounded hover:bg-[#1B1F28] text-[#A4ABB6] hover:text-[#E6E8EB]"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>

        <div className="w-[1px] h-4 bg-[#252B36] mx-0.5" />

        {/* CoM / CoP / CoT Toggles */}
        <button
          onClick={() => setShowCoM(v => !v)}
          className={`px-2 py-0.5 rounded text-[10px] font-mono-num ${
            showCoM ? 'bg-[#1B1F28] text-[#55B982] border border-[#55B982]/40 font-semibold' : 'text-[#69717E]'
          }`}
        >
          CoM
        </button>

        <button
          onClick={() => setShowCoP(v => !v)}
          className={`px-2 py-0.5 rounded text-[10px] font-mono-num ${
            showCoP ? 'bg-[#1B1F28] text-[#79AFC1] border border-[#79AFC1]/40 font-semibold' : 'text-[#69717E]'
          }`}
        >
          CoP
        </button>

        <button
          onClick={() => setShowCoT(v => !v)}
          className={`px-2 py-0.5 rounded text-[10px] font-mono-num ${
            showCoT ? 'bg-[#1B1F28] text-[#FF8A1F] border border-[#FF8A1F]/40 font-semibold' : 'text-[#69717E]'
          }`}
        >
          CoT
        </button>
      </div>

      {/* Disconnected Parts Floating Warning Banner */}
      {!metrics.isStructurallySound && (
        <div className="absolute top-14 left-3 flex items-center gap-2 bg-[#D95757]/15 border border-[#D95757]/60 text-[#D95757] px-3 py-1.5 rounded-lg text-xs shadow-lg backdrop-blur-sm z-20">
          <AlertTriangle className="w-4 h-4 text-[#D95757]" />
          <span>
            <strong>{metrics.disconnectedPartsCount} Disconnected Parts:</strong> Floating components not attached to root vehicle.
          </span>
        </div>
      )}

      {/* Contextual Action Overlay near Selected Component */}
      {selectedPart && selectedPartDef && selectedScreenPos && (
        <div
          onMouseDown={e => e.stopPropagation()}
          className="absolute z-30 flex items-center gap-1 bg-[#151820] border border-[#353D4A] p-1.5 rounded-lg shadow-xl"
          style={{
            left: Math.max(10, Math.min((containerRef.current?.clientWidth || 600) - 220, selectedScreenPos.x - 90)),
            top: Math.max(60, selectedScreenPos.y - (selectedPartDef.height * zoom * GRID_CELL_SIZE) / 2 - 45)
          }}
        >
          <span className="text-[11px] font-medium text-[#E6E8EB] px-1.5 truncate max-w-[120px]">
            {selectedPartDef.name}
          </span>

          <div className="w-[1px] h-3 bg-[#252B36]" />

          <button
            onClick={() => rotatePartInBlueprint(selectedPart.instanceId, 90)}
            title="Rotate 90° (R)"
            className="p-1 rounded hover:bg-[#1B1F28] text-[#A4ABB6] hover:text-[#FF8A1F]"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => rotatePartInBlueprint(selectedPart.instanceId, 15)}
            title="Fine Rotate 15°"
            className="px-1 py-0.5 rounded hover:bg-[#1B1F28] text-[10px] font-mono-num text-[#79AFC1]"
          >
            +15°
          </button>

          <button
            onClick={() => duplicatePartInBlueprint(selectedPart.instanceId)}
            title="Duplicate (Alt+Drag)"
            className="p-1 rounded hover:bg-[#1B1F28] text-[#A4ABB6] hover:text-[#79AFC1]"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => removePartFromBlueprint(selectedPart.instanceId)}
            title="Delete (Del)"
            className="p-1 rounded hover:bg-[#D95757]/20 text-[#69717E] hover:text-[#D95757]"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Scale & Coordinate Indicator */}
      <div className="absolute bottom-3 left-3 text-[11px] font-mono-num text-[#A4ABB6] flex items-center gap-3 bg-[#151820]/80 border border-[#252B36] px-2.5 py-1 rounded-md">
        <span>Grid: 1.0 m</span>
        <span>Zoom: {(zoom * 100).toFixed(0)}%</span>
        <span>Parts: {blueprint.parts.length}</span>
        <span>Symmetry: {symmetryMode.toUpperCase()}</span>
      </div>
    </div>
  );
};
