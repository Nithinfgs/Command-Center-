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
    setFlightPitch,
    abortFlight,
    resetFlight
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

  // Keyboard controls (<Space>, Z, X, Shift, Ctrl, A, D, W, S, R, Backspace)
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
      } else if (e.code === 'KeyR') {
        resetFlight();
      } else if (e.code === 'Backspace') {
        abortFlight();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [flightState, launchFlight, triggerStaging, setFlightThrottle, setFlightPitch, resetFlight, abortFlight]);

  // Stage separation debris spawning
  useEffect(() => {
    if (flightState.currentStageIndex > lastStageRef.current && flightState.isLaunched) {
      const droppedStage = lastStageRef.current;
      const droppedParts = blueprint.parts.filter(p => (p.stage || 1) === droppedStage);
      
      const truePitchRad = (flightState.pitch * Math.PI) / 180;
      const vxAft = -Math.cos(truePitchRad) * 14;
      const vyAft = -Math.sin(truePitchRad) * 14;

      droppedParts.forEach(p => {
        debrisRef.current.push({
          partType: p.partType,
          worldX: flightState.downrange + p.x * 0.5,
          worldY: flightState.altitude - p.y * 0.5,
          vx: flightState.velocity.vx * 0.7 + vxAft + (Math.random() - 0.5) * 6,
          vy: flightState.velocity.vy * 0.7 + vyAft + (Math.random() - 0.5) * 6,
          rotation: p.rotation || 0,
          rotSpeed: (Math.random() - 0.5) * 60,
          life: 0
        });
      });
    }
    lastStageRef.current = flightState.currentStageIndex;
  }, [flightState.currentStageIndex, flightState.isLaunched, blueprint, flightState.pitch, flightState.downrange, flightState.altitude, flightState.velocity]);

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
      if (altNorm > 0.15) {
        const starAlpha = Math.min(1, (altNorm - 0.15) * 2.5);
        ctx.fillStyle = `rgba(255, 255, 255, ${starAlpha * 0.85})`;
        for (let i = 0; i < 180; i++) {
          const sx = (Math.sin(i * 127.1) * 0.5 + 0.5) * width;
          const sy = (Math.cos(i * 311.7) * 0.5 + 0.5) * height * 0.85;
          const sz = (i % 3 === 0) ? 1.5 : 1.0;
          ctx.fillRect(sx, sy, sz, sz);
        }

        // ==========================================
        // PLANETS IN THE SKY (Moon, Mars, Jupiter, Saturn)
        // ==========================================
        const planetAlpha = Math.min(1, (altNorm - 0.15) * 3.0);

        // 1. The Moon (Top Right)
        const moonX = width * 0.82;
        const moonY = height * 0.18;
        const moonR = 26;

        ctx.save();
        ctx.globalAlpha = planetAlpha;

        // Lunar glow
        const moonGlow = ctx.createRadialGradient(moonX, moonY, moonR * 0.6, moonX, moonY, moonR * 2.2);
        moonGlow.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
        moonGlow.addColorStop(0.5, 'rgba(226, 232, 240, 0.15)');
        moonGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = moonGlow;
        ctx.beginPath();
        ctx.arc(moonX, moonY, moonR * 2.2, 0, Math.PI * 2);
        ctx.fill();

        // Moon Body with Craters
        ctx.fillStyle = '#E2E8F0';
        ctx.beginPath();
        ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
        ctx.fill();

        // Craters
        ctx.fillStyle = '#CBD5E1';
        [
          { cx: moonX - 8, cy: moonY - 6, r: 5 },
          { cx: moonX + 6, cy: moonY + 7, r: 6 },
          { cx: moonX + 9, cy: moonY - 9, r: 4 },
          { cx: moonX - 5, cy: moonY + 9, r: 4.5 },
          { cx: moonX, cy: moonY, r: 3 }
        ].forEach(c => {
          ctx.beginPath();
          ctx.arc(c.cx, c.cy, c.r, 0, Math.PI * 2);
          ctx.fill();
        });

        // Crescent shadow
        ctx.fillStyle = 'rgba(15, 23, 42, 0.55)';
        ctx.beginPath();
        ctx.arc(moonX + 7, moonY, moonR * 0.95, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#94A3B8';
        ctx.font = '500 9px monospace';
        ctx.fillText('MOON (384,400 km)', moonX - 42, moonY + moonR + 14);

        // 2. Mars (Red Planet, Top Left)
        const marsX = width * 0.22;
        const marsY = height * 0.15;
        const marsR = 10;

        const marsGlow = ctx.createRadialGradient(marsX, marsY, marsR * 0.4, marsX, marsY, marsR * 2.0);
        marsGlow.addColorStop(0, 'rgba(239, 68, 68, 0.4)');
        marsGlow.addColorStop(1, 'rgba(239, 68, 68, 0)');
        ctx.fillStyle = marsGlow;
        ctx.beginPath();
        ctx.arc(marsX, marsY, marsR * 2.0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#DC2626';
        ctx.beginPath();
        ctx.arc(marsX, marsY, marsR, 0, Math.PI * 2);
        ctx.fill();

        // Polar ice cap
        ctx.fillStyle = '#F8FAFC';
        ctx.beginPath();
        ctx.arc(marsX, marsY - marsR + 2, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#EF4444';
        ctx.font = '500 8.5px monospace';
        ctx.fillText('MARS', marsX - 10, marsY + marsR + 12);

        // 3. Jupiter & Moons (Far Upper Center)
        const jupX = width * 0.48;
        const jupY = height * 0.08;
        const jupR = 14;

        ctx.fillStyle = '#D97706';
        ctx.beginPath();
        ctx.arc(jupX, jupY, jupR, 0, Math.PI * 2);
        ctx.fill();

        // Bands
        ctx.fillStyle = '#92400E';
        ctx.fillRect(jupX - jupR + 1, jupY - 3, jupR * 2 - 2, 2.5);
        ctx.fillRect(jupX - jupR + 2, jupY + 3, jupR * 2 - 4, 2);

        // Great Red Spot
        ctx.fillStyle = '#B45309';
        ctx.beginPath();
        ctx.arc(jupX + 4, jupY + 4, 2, 0, Math.PI * 2);
        ctx.fill();

        // Galilean moons
        ctx.fillStyle = '#FEF3C7';
        ctx.fillRect(jupX - 22, jupY - 1, 1.5, 1.5);
        ctx.fillRect(jupX - 16, jupY + 1, 1.5, 1.5);
        ctx.fillRect(jupX + 18, jupY, 1.5, 1.5);
        ctx.fillRect(jupX + 26, jupY - 2, 1.5, 1.5);

        ctx.fillStyle = '#F59E0B';
        ctx.font = '500 8.5px monospace';
        ctx.fillText('JUPITER', jupX - 18, jupY + jupR + 12);

        // 4. Saturn with Rings (Mid Right)
        const satX = width * 0.92;
        const satY = height * 0.38;
        const satR = 8;

        // Rings behind
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.6)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.ellipse(satX, satY, satR * 2.4, satR * 0.7, -Math.PI / 6, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#FDE68A';
        ctx.beginPath();
        ctx.arc(satX, satY, satR, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FBBF24';
        ctx.font = '500 8px monospace';
        ctx.fillText('SATURN', satX - 14, satY + satR + 12);

        ctx.restore();
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
      // GROUND SURFACE & SLEEK LAUNCH PAD
      // ==========================================
      const groundOrigin = worldToScreen(0, 0);
      const cellSize = GRID_CELL_SIZE;

      // Calculate lowest part boundary (engine nozzle base) in vehicle local pixels
      let maxLocalY = 0;
      for (const part of blueprint.parts) {
        const def = PARTS_CATALOG[part.partType];
        if (def) {
          const partBottomY = part.y * cellSize + (def.height * cellSize) / 2;
          if (partBottomY > maxLocalY) {
            maxLocalY = partBottomY;
          }
        }
      }
      const rocketBaseOffset = maxLocalY;

      if (groundOrigin.sy < height + 400) {
        // Flat Earth ground terrain
        ctx.fillStyle = '#111827';
        ctx.fillRect(0, groundOrigin.sy, width, height - groundOrigin.sy + 400);

        ctx.strokeStyle = '#1F2937';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, groundOrigin.sy);
        ctx.lineTo(width, groundOrigin.sy);
        ctx.stroke();

        // Sleek Launch Pad Base & Mount at (0, 0)
        const padScreen = worldToScreen(0, 0);
        const padScale = currentZoom * 12;
        const padWidthPx = 16 * padScale;
        const padHeightPx = 4 * padScale;

        if (padScreen.sx > -300 && padScreen.sx < width + 300) {
          // Flame Trench Hole Deflector
          ctx.fillStyle = '#0B0F17';
          ctx.fillRect(padScreen.sx - padWidthPx * 0.35, groundOrigin.sy, padWidthPx * 0.7, padHeightPx * 2);

          // Angled Flame Deflector Ramp
          ctx.fillStyle = '#1E293B';
          ctx.beginPath();
          ctx.moveTo(padScreen.sx, groundOrigin.sy + 2);
          ctx.lineTo(padScreen.sx - padWidthPx * 0.45, groundOrigin.sy + padHeightPx * 1.8);
          ctx.lineTo(padScreen.sx + padWidthPx * 0.45, groundOrigin.sy + padHeightPx * 1.8);
          ctx.closePath();
          ctx.fill();

          // Main Launch Table Stand
          ctx.fillStyle = '#1E293B';
          ctx.fillRect(padScreen.sx - padWidthPx / 2, groundOrigin.sy - padHeightPx, padWidthPx, padHeightPx);
          ctx.strokeStyle = '#38BDF8';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(padScreen.sx - padWidthPx / 2, groundOrigin.sy - padHeightPx, padWidthPx, padHeightPx);

          // Yellow/Black Hazard Striping on pad deck
          ctx.fillStyle = '#FBBF24';
          for (let hx = padScreen.sx - padWidthPx / 2; hx < padScreen.sx + padWidthPx / 2 - 4; hx += 8) {
            ctx.fillRect(hx, groundOrigin.sy - padHeightPx, 3, 2);
          }

          // Hold-down Support Clamps (left & right)
          const clampOpenAngle = flightState.isLaunched ? 0.45 : 0;
          
          // Left clamp
          ctx.save();
          ctx.translate(padScreen.sx - 8 * padScale * 0.4, groundOrigin.sy - padHeightPx);
          ctx.rotate(-clampOpenAngle);
          ctx.fillStyle = '#475569';
          ctx.fillRect(-2, -8 * padScale * 0.35, 4, 8 * padScale * 0.35);
          ctx.fillStyle = '#94A3B8';
          ctx.fillRect(-3, -8 * padScale * 0.35, 6, 2);
          ctx.restore();

          // Right clamp
          ctx.save();
          ctx.translate(padScreen.sx + 8 * padScale * 0.4, groundOrigin.sy - padHeightPx);
          ctx.rotate(clampOpenAngle);
          ctx.fillStyle = '#475569';
          ctx.fillRect(-2, -8 * padScale * 0.35, 4, 8 * padScale * 0.35);
          ctx.fillStyle = '#94A3B8';
          ctx.fillRect(-3, -8 * padScale * 0.35, 6, 2);
          ctx.restore();

          // Umbilical Service Tower (Standing to the left)
          const towerX = padScreen.sx - padWidthPx * 0.7;
          const towerW = 4 * padScale;
          const towerH = 22 * padScale;

          if (towerH > 8) {
            // Steel truss tower column
            ctx.fillStyle = '#1E293B';
            ctx.fillRect(towerX - towerW / 2, groundOrigin.sy - towerH, towerW, towerH);
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 1;
            ctx.strokeRect(towerX - towerW / 2, groundOrigin.sy - towerH, towerW, towerH);

            // Truss cross bracing lines
            ctx.strokeStyle = '#475569';
            ctx.lineWidth = 0.75;
            for (let ty = groundOrigin.sy - towerH; ty < groundOrigin.sy - 6; ty += 10) {
              ctx.beginPath();
              ctx.moveTo(towerX - towerW / 2, ty);
              ctx.lineTo(towerX + towerW / 2, ty + 10);
              ctx.stroke();
            }

            // Swing Umbilical Arms (Upper & Lower)
            const armAngle = flightState.isLaunched ? -0.8 : 0;
            
            // Lower arm
            ctx.save();
            ctx.translate(towerX + towerW / 2, groundOrigin.sy - towerH * 0.45);
            ctx.rotate(armAngle);
            ctx.strokeStyle = '#38BDF8';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(padWidthPx * 0.6, 0);
            ctx.stroke();
            ctx.restore();

            // Upper arm
            ctx.save();
            ctx.translate(towerX + towerW / 2, groundOrigin.sy - towerH * 0.82);
            ctx.rotate(armAngle);
            ctx.strokeStyle = '#38BDF8';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(padWidthPx * 0.55, 0);
            ctx.stroke();
            ctx.restore();
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
      const pitchRad = ((90 - flightState.pitch) * Math.PI) / 180;
      const truePitchRad = (flightState.pitch * Math.PI) / 180;
      const exhaustDirX = -Math.cos(truePitchRad);
      const exhaustDirY = -Math.sin(truePitchRad);

      ctx.save();
      ctx.translate(rocketScreen.sx, rocketScreen.sy);
      ctx.rotate(pitchRad);
      ctx.scale(currentZoom * 0.9, currentZoom * 0.9);
      ctx.translate(0, -rocketBaseOffset);

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
                worldX: rocketWorldX + exhaustDirX * 3,
                worldY: rocketWorldY + exhaustDirY * 3,
                vx: exhaustDirX * (80 * flightState.throttle) + (Math.random() - 0.5) * 20,
                vy: exhaustDirY * (80 * flightState.throttle) + (Math.random() - 0.5) * 20,
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
