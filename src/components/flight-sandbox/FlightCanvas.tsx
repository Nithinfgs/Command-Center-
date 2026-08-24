import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { useSimulation } from '../../context/SimulationContext';
import { PARTS_CATALOG, GRID_CELL_SIZE } from '../../physics/rocket-math';

interface FlameParticle {
  worldX: number;
  worldY: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

interface DebrisPart {
  partType: string;
  worldX: number;
  worldY: number;
  vx: number;
  vy: number;
  rotation: number;
  rotSpeed: number;
  life: number;
}

export const FlightCanvas: React.FC = () => {
  const { 
    blueprint, 
    flightState, 
    launchFlight, 
    triggerStaging, 
    setFlightThrottle, 
    setFlightPitch 
  } = useSimulation();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);

  const flameParticlesRef = useRef<FlameParticle[]>([]);
  const debrisRef = useRef<DebrisPart[]>([]);
  const lastStageRef = useRef<number>(flightState.currentStageIndex);

  // SFS-Style Interactive Camera (World-Space Coordinates)
  const [zoom, setZoom] = useState<number>(0.85);
  const [autoZoom, setAutoZoom] = useState<boolean>(true);
  const [camOffset, setCamOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const isDraggingRef = useRef<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Keyboard controls (<Space>, Z, X, Shift, Ctrl, A, D)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (!flightState.isLaunched) {
          launchFlight();
        } else {
          triggerStaging();
        }
      } else if (e.code === 'KeyZ') {
        setFlightThrottle(1.0);
      } else if (e.code === 'KeyX') {
        setFlightThrottle(0.0);
      } else if (e.code === 'ShiftLeft' || e.code === 'KeyW' || e.code === 'ArrowUp') {
        setFlightThrottle(Math.min(1.0, flightState.throttle + 0.1));
      } else if (e.code === 'ControlLeft' || e.code === 'KeyS' || e.code === 'ArrowDown') {
        setFlightThrottle(Math.max(0.0, flightState.throttle - 0.1));
      } else if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
        setFlightPitch(Math.max(0, flightState.pitch - 5));
      } else if (e.code === 'KeyD' || e.code === 'ArrowRight') {
        setFlightPitch(Math.min(90, flightState.pitch + 5));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [flightState, launchFlight, triggerStaging, setFlightThrottle, setFlightPitch]);

  // Stage separation debris spawning
  useEffect(() => {
    if (flightState.currentStageIndex > lastStageRef.current && flightState.isLaunched) {
      const droppedStage = lastStageRef.current;
      const droppedParts = blueprint.parts.filter(p => (p.stage || 1) === droppedStage);
      
      const pitchRad = ((flightState.pitch - 90) * Math.PI) / 180;
      const vxAft = -Math.sin(pitchRad) * 12;
      const vyAft = -Math.cos(pitchRad) * 12;

      droppedParts.forEach(p => {
        debrisRef.current.push({
          partType: p.partType,
          worldX: flightState.downrange + p.x * 0.5,
          worldY: flightState.altitude - p.y * 0.5,
          vx: flightState.velocity.vx + vxAft + (Math.random() - 0.5) * 6,
          vy: flightState.velocity.vy + vyAft + (Math.random() - 0.5) * 6,
          rotation: p.rotation || 0,
          rotSpeed: (Math.random() - 0.5) * 60,
          life: 0
        });
      });
    }
    lastStageRef.current = flightState.currentStageIndex;
  }, [flightState.currentStageIndex, flightState.isLaunched, blueprint]);

  // Mouse wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    setAutoZoom(false);
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    setZoom(z => Math.max(0.00008, Math.min(2.5, z * zoomFactor)));
  }, []);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button === 0) {
      isDraggingRef.current = true;
      dragStartRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDraggingRef.current) {
      setAutoZoom(false);
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      setCamOffset(prev => ({
        x: prev.x - dx / zoom,
        y: prev.y + dy / zoom
      }));
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  // Reset focus to rocket
  const handleFocusRocket = () => {
    setAutoZoom(true);
    setCamOffset({ x: 0, y: 0 });
    const alt = flightState.altitude;
    if (alt < 500) setZoom(0.85);
    else if (alt < 10000) setZoom(0.35);
    else if (alt < 60000) setZoom(0.08);
    else setZoom(0.005);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = performance.now();

    const render = (time: number) => {
      const dt = Math.min(0.05, (time - lastTime) / 1000);
      lastTime = time;

      const width = canvas.parentElement?.clientWidth || 800;
      const height = canvas.parentElement?.clientHeight || 600;

      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.save();
      ctx.scale(dpr, dpr);

      const alt = flightState.altitude;
      const altNorm = Math.min(1, alt / 80000);

      // Auto zoom adjustment if active
      let currentZoom = zoom;
      if (autoZoom) {
        if (alt < 200) currentZoom = 0.85;
        else if (alt < 5000) currentZoom = 0.5 - (alt / 5000) * 0.25;
        else if (alt < 35000) currentZoom = 0.25 - ((alt - 5000) / 30000) * 0.18;
        else if (alt < 100000) currentZoom = 0.07 - ((alt - 35000) / 65000) * 0.055;
        else currentZoom = 0.008;
      }

      // SFS Camera Transformation (World m -> Screen px)
      const rocketWorldX = flightState.downrange;
      const rocketWorldY = flightState.altitude;

      const camWorldX = rocketWorldX + camOffset.x;
      const camWorldY = rocketWorldY + camOffset.y;

      const worldToScreen = (wx: number, wy: number) => {
        return {
          sx: width / 2 + (wx - camWorldX) * currentZoom * 12,
          sy: height / 2 - (wy - camWorldY) * currentZoom * 12
        };
      };

      // Atmospheric Sky Gradient (Based on Camera World Altitude)
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      if (altNorm < 0.15) {
        skyGrad.addColorStop(0, '#0B1528');
        skyGrad.addColorStop(0.5, '#162C54');
        skyGrad.addColorStop(1, '#3B82F6');
      } else if (altNorm < 0.5) {
        skyGrad.addColorStop(0, '#020408');
        skyGrad.addColorStop(0.6, '#0B1528');
        skyGrad.addColorStop(1, '#1E3A8A');
      } else {
        skyGrad.addColorStop(0, '#010204');
        skyGrad.addColorStop(0.7, '#040711');
        skyGrad.addColorStop(1, '#090D1A');
      }
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // Starfield in upper atmosphere & space
      if (altNorm > 0.2) {
        const starAlpha = Math.min(1, (altNorm - 0.2) * 2.5);
        ctx.fillStyle = `rgba(255, 255, 255, ${starAlpha * 0.85})`;
        for (let i = 0; i < 180; i++) {
          const sx = (Math.sin(i * 127.1) * 0.5 + 0.5) * width;
          const sy = (Math.cos(i * 311.7) * 0.5 + 0.5) * height * 0.85;
          const sz = (i % 3 === 0) ? 1.5 : 1.0;
          ctx.fillRect(sx, sy, sz, sz);
        }
      }

      // Atmospheric Edge / Karman Line Curve in Space
      if (alt > 30000) {
        const karmanPos = worldToScreen(0, 100000);
        if (karmanPos.sy < height && karmanPos.sy > -100) {
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
          ctx.lineWidth = 1;
          ctx.setLineDash([6, 6]);
          ctx.beginPath();
          ctx.moveTo(0, karmanPos.sy);
          ctx.lineTo(width, karmanPos.sy);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = 'rgba(56, 189, 248, 0.6)';
          ctx.font = '500 10px monospace';
          ctx.fillText('KARMAN LINE (100 km)', 14, karmanPos.sy - 6);
        }
      }

      // ==========================================
      // GROUND SURFACE & LAUNCHPAD (SFS WORLD)
      // ==========================================
      const groundOrigin = worldToScreen(0, 0);

      if (groundOrigin.sy < height + 400) {
        // Flat Earth ground terrain
        ctx.fillStyle = '#172131';
        ctx.fillRect(0, groundOrigin.sy, width, height - groundOrigin.sy + 400);

        ctx.strokeStyle = '#263548';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, groundOrigin.sy);
        ctx.lineTo(width, groundOrigin.sy);
        ctx.stroke();

        // Launchpad structures at (0, 0)
        const padScreen = worldToScreen(0, 0);
        const padWidthPx = 40 * currentZoom * 12;
        const towerHeightPx = 60 * currentZoom * 12;

        if (padScreen.sx > -200 && padScreen.sx < width + 200) {
          // Launch pad base
          ctx.fillStyle = '#1E293B';
          ctx.fillRect(padScreen.sx - padWidthPx / 2, padScreen.sy - 4, padWidthPx, 8);
          ctx.strokeStyle = '#38BDF8';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(padScreen.sx - padWidthPx / 2, padScreen.sy - 4, padWidthPx, 8);

          // Tower structure
          if (towerHeightPx > 6) {
            ctx.fillStyle = '#0F172A';
            ctx.fillRect(padScreen.sx - padWidthPx * 0.45, padScreen.sy - towerHeightPx, 16, towerHeightPx);
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 1;
            ctx.strokeRect(padScreen.sx - padWidthPx * 0.45, padScreen.sy - towerHeightPx, 16, towerHeightPx);
          }
        }

        // Distance / Elevation Scale Markers along ground
        ctx.fillStyle = '#64748B';
        ctx.font = '500 10px monospace';
        for (let distM = -10000; distM <= 50000; distM += 5000) {
          if (distM === 0) continue;
          const markerPos = worldToScreen(distM, 0);
          if (markerPos.sx > 0 && markerPos.sx < width) {
            ctx.beginPath();
            ctx.moveTo(markerPos.sx, groundOrigin.sy - 5);
            ctx.lineTo(markerPos.sx, groundOrigin.sy + 5);
            ctx.stroke();
            ctx.fillText(`${distM / 1000}km`, markerPos.sx - 12, groundOrigin.sy + 18);
          }
        }
      }

      // ==========================================
      // REAL-TIME ORBITAL TRAJECTORY ARC
      // ==========================================
      if (flightState.isLaunched && flightState.trajectoryHistory.length > 1) {
        ctx.strokeStyle = '#FBBF24';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        for (let i = 0; i < flightState.trajectoryHistory.length; i++) {
          const pt = flightState.trajectoryHistory[i];
          const pos = worldToScreen(pt.x, pt.y);
          if (i === 0) ctx.moveTo(pos.sx, pos.sy);
          else ctx.lineTo(pos.sx, pos.sy);
        }
        ctx.stroke();

        // Apoapsis Pin (Ap)
        if (flightState.apoapsis > 500) {
          const apPos = worldToScreen(flightState.downrange + flightState.velocity.vx * 25, flightState.apoapsis);
          if (apPos.sx > 0 && apPos.sx < width && apPos.sy > 0 && apPos.sy < height) {
            ctx.fillStyle = '#38BDF8';
            ctx.beginPath();
            ctx.arc(apPos.sx, apPos.sy, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.font = '600 10px monospace';
            ctx.fillText(`Ap: ${(flightState.apoapsis / 1000).toFixed(1)} km`, apPos.sx + 8, apPos.sy + 3);
          }
        }
      }

      // ==========================================
      // RENDER ACTIVE ROCKET VEHICLE (SFS SPRITES)
      // ==========================================
      const rocketScreen = worldToScreen(rocketWorldX, rocketWorldY);
      const pitchRad = ((flightState.pitch - 90) * Math.PI) / 180;

      ctx.save();
      ctx.translate(rocketScreen.sx, rocketScreen.sy);
      ctx.rotate(pitchRad);
      ctx.scale(currentZoom * 0.9, currentZoom * 0.9);

      const cellSize = GRID_CELL_SIZE;

      for (const part of blueprint.parts) {
        const partStage = part.stage || 1;
        // Do not render dropped stages
        if (flightState.isLaunched && partStage < flightState.currentStageIndex) {
          continue;
        }

        const def = PARTS_CATALOG[part.partType];
        if (!def) continue;

        const px = part.x * cellSize;
        const py = part.y * cellSize;
        const pw = def.width * cellSize;
        const ph = def.height * cellSize;

        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(((part.rotation || 0) * Math.PI) / 180);

        if (def.texturePattern === 'cone') {
          const coneGrad = ctx.createLinearGradient(-pw / 2, 0, pw / 2, 0);
          coneGrad.addColorStop(0, '#1E293B');
          coneGrad.addColorStop(0.3, def.color || '#E2E8F0');
          coneGrad.addColorStop(0.7, def.color || '#E2E8F0');
          coneGrad.addColorStop(1, '#0F172A');

          ctx.fillStyle = coneGrad;
          ctx.beginPath();
          ctx.moveTo(-pw / 2, ph / 2);
          ctx.quadraticCurveTo(0, -ph / 2 - 10, pw / 2, ph / 2);
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = '#0B0F17';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Supersonic Plasma Glow
          if (flightState.speed > 750 && alt < 55000) {
            const plasmaGrad = ctx.createRadialGradient(0, -ph / 2 - 4, 1, 0, -ph / 2 - 4, 25);
            plasmaGrad.addColorStop(0, '#ffffff');
            plasmaGrad.addColorStop(0.4, '#FBBF24');
            plasmaGrad.addColorStop(1, 'rgba(244, 63, 94, 0)');
            ctx.fillStyle = plasmaGrad;
            ctx.beginPath();
            ctx.arc(0, -ph / 2 - 4, 25, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (def.texturePattern === 'engine-bell') {
          ctx.fillStyle = '#1E293B';
          ctx.fillRect(-pw * 0.35, -ph / 2, pw * 0.7, ph * 0.35);

          const bellGrad = ctx.createLinearGradient(-pw / 2, 0, pw / 2, 0);
          bellGrad.addColorStop(0, '#0F172A');
          bellGrad.addColorStop(0.3, '#334155');
          bellGrad.addColorStop(0.7, '#334155');
          bellGrad.addColorStop(1, '#0F172A');

          ctx.fillStyle = bellGrad;
          ctx.beginPath();
          ctx.moveTo(-pw * 0.2, -ph / 2 + ph * 0.45);
          ctx.lineTo(pw * 0.2, -ph / 2 + ph * 0.45);
          ctx.lineTo(pw / 2, ph / 2);
          ctx.lineTo(-pw / 2, ph / 2);
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = '#0F172A';
          ctx.lineWidth = 1.2;
          ctx.stroke();

          // SFS-STYLE ENGINE PLUME (CUTS OFF IMMEDIATELY AT THROTTLE = 0)
          if (
            flightState.isLaunched && 
            flightState.throttle > 0.01 && 
            partStage === flightState.currentStageIndex &&
            flightState.fuelMassRemaining > 0.001
          ) {
            const vacExpansion = alt > 30000 ? 1.6 : 1.0;
            const flameLen = (70 * flightState.throttle + Math.sin(time * 0.08) * 8);
            const flameW = pw * 0.7 * vacExpansion;

            const flameGrad = ctx.createLinearGradient(0, ph / 2, 0, ph / 2 + flameLen);
            flameGrad.addColorStop(0, '#ffffff');
            flameGrad.addColorStop(0.15, '#38BDF8');
            flameGrad.addColorStop(0.6, '#FBBF24');
            flameGrad.addColorStop(1, 'rgba(244, 63, 94, 0)');

            ctx.fillStyle = flameGrad;
            ctx.beginPath();
            ctx.moveTo(-pw * 0.35, ph / 2);
            ctx.lineTo(-flameW / 2, ph / 2 + flameLen * 0.4);
            ctx.lineTo(0, ph / 2 + flameLen);
            ctx.lineTo(flameW / 2, ph / 2 + flameLen * 0.4);
            ctx.lineTo(pw * 0.35, ph / 2);
            ctx.closePath();
            ctx.fill();

            // Spawn exhaust particles in world space
            if (flameParticlesRef.current.length < 160) {
              flameParticlesRef.current.push({
                worldX: rocketWorldX - Math.sin(pitchRad) * (ph * 0.05),
                worldY: rocketWorldY - Math.cos(pitchRad) * (ph * 0.05 + 1),
                vx: -Math.sin(pitchRad) * (80 * flightState.throttle) + (Math.random() - 0.5) * 20,
                vy: -Math.cos(pitchRad) * (80 * flightState.throttle) + (Math.random() - 0.5) * 20,
                life: 0,
                maxLife: 25 + Math.random() * 20,
                size: 2 + Math.random() * 3,
                color: alt < 25000 ? 'rgba(203, 213, 225, 0.4)' : 'rgba(251, 191, 36, 0.6)'
              });
            }
          }
        } else if (def.texturePattern === 'fin') {
          const isRight = part.x > 0;
          ctx.fillStyle = def.color || '#38BDF8';
          ctx.beginPath();
          if (isRight) {
            ctx.moveTo(-pw / 2, -ph / 2);
            ctx.lineTo(pw / 2, ph * 0.2);
            ctx.lineTo(pw / 2, ph / 2);
            ctx.lineTo(-pw / 2, ph / 2);
          } else {
            ctx.moveTo(pw / 2, -ph / 2);
            ctx.lineTo(-pw / 2, ph * 0.2);
            ctx.lineTo(-pw / 2, ph / 2);
            ctx.lineTo(pw / 2, ph / 2);
          }
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = '#0B0F17';
          ctx.lineWidth = 1.2;
          ctx.stroke();
        } else {
          const tankGrad = ctx.createLinearGradient(-pw / 2, 0, pw / 2, 0);
          tankGrad.addColorStop(0, '#0F172A');
          tankGrad.addColorStop(0.25, def.color || '#334155');
          tankGrad.addColorStop(0.75, def.color || '#334155');
          tankGrad.addColorStop(1, '#0F172A');

          ctx.fillStyle = tankGrad;
          ctx.fillRect(-pw / 2, -ph / 2, pw, ph);

          ctx.strokeStyle = '#0B0F17';
          ctx.lineWidth = 1.2;
          ctx.strokeRect(-pw / 2, -ph / 2, pw, ph);
        }

        ctx.restore();
      }

      ctx.restore();

      // ==========================================
      // RENDER JETTISONED DEBRIS IN WORLD SPACE
      // ==========================================
      const debris = debrisRef.current;
      for (let i = debris.length - 1; i >= 0; i--) {
        const d = debris[i];
        d.worldX += d.vx * dt;
        d.worldY += d.vy * dt;
        d.vy -= 9.81 * dt; // Gravity pulls debris down
        d.rotation += d.rotSpeed * dt;
        d.life += dt;

        // Ground collision for debris
        if (d.worldY <= 0) {
          d.worldY = 0;
          d.vx *= 0.5;
          d.vy = 0;
        }

        if (d.life > 30) {
          debris.splice(i, 1);
          continue;
        }

        const dScreen = worldToScreen(d.worldX, d.worldY);
        const def = PARTS_CATALOG[d.partType];
        if (!def) continue;

        ctx.save();
        ctx.translate(dScreen.sx, dScreen.sy);
        ctx.rotate((d.rotation * Math.PI) / 180);
        ctx.scale(currentZoom * 0.85, currentZoom * 0.85);

        ctx.fillStyle = '#334155';
        ctx.fillRect(-def.width * cellSize * 0.5, -def.height * cellSize * 0.5, def.width * cellSize, def.height * cellSize);
        ctx.strokeStyle = '#0B0F17';
        ctx.strokeRect(-def.width * cellSize * 0.5, -def.height * cellSize * 0.5, def.width * cellSize, def.height * cellSize);
        ctx.restore();
      }

      // Exhaust Particles in World Space
      const particles = flameParticlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.worldX += p.vx * dt;
        p.worldY += p.vy * dt;
        p.life += 1;
        p.size += 0.2;

        if (p.life > p.maxLife || p.worldY <= 0) {
          particles.splice(i, 1);
          continue;
        }

        const pScreen = worldToScreen(p.worldX, p.worldY);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(pScreen.sx, pScreen.sy, p.size * currentZoom * 0.9, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [blueprint, flightState, zoom, autoZoom, camOffset]);

  return (
    <div 
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className="relative flex-1 h-full bg-[#0E1520] overflow-hidden select-none cursor-grab active:cursor-grabbing"
    >
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Floating Viewport CAD Controls */}
      <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-[#121A26]/90 border border-[#263548] p-1 rounded-lg shadow-md">
        <button
          onClick={() => {
            setAutoZoom(false);
            setZoom(z => Math.min(2.5, z * 1.3));
          }}
          className="p-1.5 rounded hover:bg-[#172131] text-[#9AA9B8] hover:text-[#E8EDF2]"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => {
            setAutoZoom(false);
            setZoom(z => Math.max(0.00008, z / 1.3));
          }}
          className="p-1.5 rounded hover:bg-[#172131] text-[#9AA9B8] hover:text-[#E8EDF2]"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleFocusRocket}
          className={`px-2 py-1 rounded text-[11px] font-medium border flex items-center gap-1 transition-colors ${
            autoZoom 
              ? 'bg-[#1A3040] border-[#38BDF8]/60 text-[#38BDF8]' 
              : 'bg-[#172131] border-[#263548] text-[#9AA9B8] hover:text-[#E8EDF2]'
          }`}
          title="Recenter & Track Vehicle"
        >
          <Maximize2 className="w-3 h-3" />
          <span>Focus Rocket</span>
        </button>
      </div>

      {/* Quick Mission Control Shortcut Strip */}
      <div className="absolute bottom-3 left-3 bg-[#121A26]/90 border border-[#263548] px-3.5 py-1.5 rounded-lg text-xs font-mono text-[#9AA9B8] flex items-center gap-4 shadow-md">
        <span>SPACE: <strong className="text-[#38BDF8]">Ignition / Stage</strong></span>
        <span>Z / X: <strong className="text-[#34D399]">100% / 0% Throttle</strong></span>
        <span>A / D: <strong className="text-[#FBBF24]">Pitch Steering</strong></span>
        <span>SCROLL: <strong className="text-[#E8EDF2]">SFS World Zoom</strong></span>
      </div>
    </div>
  );
};
