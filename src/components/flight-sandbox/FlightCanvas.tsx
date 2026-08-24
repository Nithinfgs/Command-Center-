import React, { useRef, useEffect } from 'react';
import { useSimulation } from '../../context/SimulationContext';
import { PARTS_CATALOG, GRID_CELL_SIZE } from '../../physics/rocket-math';

interface FlameParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

interface DebrisPart {
  partType: string;
  x: number;
  y: number;
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

  // Keyboard shortcuts (Space = Stage/Launch, Z/X = Throttle, A/D = Pitch)
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
      } else if (e.code === 'ShiftLeft' || e.code === 'KeyW') {
        setFlightThrottle(Math.min(1.0, flightState.throttle + 0.1));
      } else if (e.code === 'ControlLeft' || e.code === 'KeyS') {
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

  // Detect stage separation and spawn jettisoned debris
  useEffect(() => {
    if (flightState.currentStageIndex > lastStageRef.current && flightState.isLaunched) {
      const droppedStage = lastStageRef.current;
      const droppedParts = blueprint.parts.filter(p => (p.stage || 1) === droppedStage);
      
      const pitchRad = ((flightState.pitch - 90) * Math.PI) / 180;
      const vxAft = -Math.sin(pitchRad) * 15;
      const vyAft = -Math.cos(pitchRad) * 15;

      droppedParts.forEach(p => {
        debrisRef.current.push({
          partType: p.partType,
          x: p.x * GRID_CELL_SIZE,
          y: p.y * GRID_CELL_SIZE,
          vx: flightState.velocity.vx * 0.8 + vxAft + (Math.random() - 0.5) * 8,
          vy: flightState.velocity.vy * 0.8 + vyAft + (Math.random() - 0.5) * 8,
          rotation: p.rotation || 0,
          rotSpeed: (Math.random() - 0.5) * 45,
          life: 0
        });
      });
    }
    lastStageRef.current = flightState.currentStageIndex;
  }, [flightState.currentStageIndex, flightState.isLaunched, blueprint]);

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
      const altNorm = Math.min(1, alt / 100000);

      // Dynamic Aerospace Atmospheric Gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      if (altNorm < 0.15) {
        // Lower Troposphere (0 - 15km)
        skyGrad.addColorStop(0, '#0D1B2A');
        skyGrad.addColorStop(0.4, '#1B263B');
        skyGrad.addColorStop(0.8, '#415A77');
        skyGrad.addColorStop(1, '#6495ED');
      } else if (altNorm < 0.5) {
        // Stratosphere & Mesosphere (15 - 50km)
        skyGrad.addColorStop(0, '#020408');
        skyGrad.addColorStop(0.5, '#0B132B');
        skyGrad.addColorStop(1, '#1C2541');
      } else {
        // Exosphere & Low Earth Orbit (> 50km)
        skyGrad.addColorStop(0, '#010204');
        skyGrad.addColorStop(0.7, '#050811');
        skyGrad.addColorStop(1, '#0A0E1A');
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

      // Atmospheric Limb / Horizon Glow in Orbit
      if (alt > 35000) {
        const glowHeight = Math.min(height * 0.4, (alt / 150000) * height * 0.5);
        const atmoGlow = ctx.createLinearGradient(0, height - glowHeight, 0, height);
        atmoGlow.addColorStop(0, 'rgba(56, 189, 248, 0)');
        atmoGlow.addColorStop(0.4, 'rgba(56, 189, 248, 0.25)');
        atmoGlow.addColorStop(0.8, 'rgba(14, 165, 233, 0.5)');
        atmoGlow.addColorStop(1, 'rgba(30, 58, 138, 0.8)');
        ctx.fillStyle = atmoGlow;
        ctx.fillRect(0, height - glowHeight, width, glowHeight);
      }

      // Camera Frame Geometry
      let camScale = 1.0;
      let rocketScreenX = width * 0.5;
      let rocketScreenY = height * 0.75;

      if (flightState.isLaunched) {
        if (alt < 300) {
          // Launchpad close-up
          camScale = 1.0;
          rocketScreenX = width * 0.5;
          rocketScreenY = height * 0.75 - (alt * 0.4);
        } else if (alt < 5000) {
          // Low ascent
          camScale = 0.85;
          rocketScreenX = width * 0.5;
          rocketScreenY = height * 0.55;
        } else if (alt < 30000) {
          // Transonic / Max-Q
          camScale = 0.75;
          rocketScreenX = width * 0.48;
          rocketScreenY = height * 0.52;
        } else {
          // High altitude / Orbit
          camScale = 0.65;
          rocketScreenX = width * 0.45;
          rocketScreenY = height * 0.5;
        }
      }

      // Launchpad Ground & Platform
      if (alt < 2000) {
        const groundScreenY = rocketScreenY + (flightState.isLaunched ? alt * (camScale * 0.8) : 55);
        if (groundScreenY < height + 80) {
          ctx.fillStyle = '#172131';
          ctx.fillRect(0, groundScreenY, width, height - groundScreenY + 100);
          ctx.strokeStyle = '#263548';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(0, groundScreenY, width, 4);

          // Launch tower & umbilical arm
          ctx.fillStyle = '#1E293B';
          ctx.fillRect(rocketScreenX - 55, groundScreenY - 95, 20, 95);
          ctx.strokeStyle = '#38BDF8';
          ctx.lineWidth = 1;
          ctx.strokeRect(rocketScreenX - 55, groundScreenY - 95, 20, 95);

          // Umbilical swing arm
          ctx.strokeStyle = '#64748B';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(rocketScreenX - 35, groundScreenY - 70);
          ctx.lineTo(rocketScreenX - (flightState.isLaunched ? 22 : 12), groundScreenY - 70);
          ctx.stroke();
        }
      }

      // ==========================================
      // RENDER ACTIVE ROCKET VEHICLE
      // ==========================================
      const pitchRad = ((flightState.pitch - 90) * Math.PI) / 180;

      ctx.save();
      ctx.translate(rocketScreenX, rocketScreenY);
      ctx.rotate(pitchRad);
      ctx.scale(camScale, camScale);

      const cellSize = GRID_CELL_SIZE;

      for (const part of blueprint.parts) {
        const partStage = part.stage || 1;
        // Don't draw dropped stages on the main vehicle
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

          // Supersonic Plasma Compression Glow
          if (flightState.speed > 800 && alt < 50000) {
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

          // ENGINE THRUST EXHAUST PLUME
          if (
            flightState.isLaunched && 
            flightState.throttle > 0 && 
            partStage === flightState.currentStageIndex &&
            flightState.fuelMassRemaining > 0.01
          ) {
            // Vacuum plume expansion
            const vacExpansion = alt > 30000 ? 1.7 : 1.0;
            const flameLen = (65 * flightState.throttle + Math.sin(time * 0.08) * 8);
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

            // Spawn smoke and exhaust particles
            if (flameParticlesRef.current.length < 150) {
              flameParticlesRef.current.push({
                x: rocketScreenX + Math.sin(pitchRad) * (ph / 2),
                y: rocketScreenY + Math.cos(pitchRad) * (ph / 2 + 10),
                vx: -Math.sin(pitchRad) * (90 + Math.random() * 80) + (Math.random() - 0.5) * 30,
                vy: Math.cos(pitchRad) * (90 + Math.random() * 80) + (Math.random() - 0.5) * 30,
                life: 0,
                maxLife: 25 + Math.random() * 20,
                size: 2 + Math.random() * 3.5,
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
      // RENDER JETTISONED STAGE DEBRIS
      // ==========================================
      const debris = debrisRef.current;
      for (let i = debris.length - 1; i >= 0; i--) {
        const d = debris[i];
        d.x += (d.vx - flightState.velocity.vx * 0.4) * dt;
        d.y += (d.vy - flightState.velocity.vy * 0.4) * dt;
        d.rotation += d.rotSpeed * dt;
        d.life += dt;

        if (d.life > 12) {
          debris.splice(i, 1);
          continue;
        }

        const def = PARTS_CATALOG[d.partType];
        if (!def) continue;

        ctx.save();
        ctx.translate(rocketScreenX + d.x, rocketScreenY + d.y);
        ctx.rotate((d.rotation * Math.PI) / 180);
        ctx.scale(camScale * 0.9, camScale * 0.9);

        ctx.fillStyle = '#475569';
        ctx.fillRect(-def.width * cellSize * 0.5, -def.height * cellSize * 0.5, def.width * cellSize, def.height * cellSize);
        ctx.strokeStyle = '#0B0F17';
        ctx.strokeRect(-def.width * cellSize * 0.5, -def.height * cellSize * 0.5, def.width * cellSize, def.height * cellSize);
        ctx.restore();
      }

      // Exhaust Particles
      const particles = flameParticlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life += 1;
        p.size += 0.35;

        if (p.life > p.maxLife) {
          particles.splice(i, 1);
          continue;
        }

        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // ==========================================
      // MINI ORBITAL TRAJECTORY RADAR MAP
      // ==========================================
      const mapW = 220;
      const mapH = 130;
      const mapX = width - mapW - 14;
      const mapY = 14;

      ctx.fillStyle = 'rgba(18, 26, 38, 0.92)';
      ctx.strokeStyle = '#263548';
      ctx.lineWidth = 1;
      ctx.fillRect(mapX, mapY, mapW, mapH);
      ctx.strokeRect(mapX, mapY, mapW, mapH);

      // Earth Curvature
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(mapX + mapW / 2, mapY + mapH + 60, 95, Math.PI * 1.25, Math.PI * 1.75);
      ctx.stroke();

      // Karman Line 100km
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(mapX + mapW / 2, mapY + mapH + 60, 115, Math.PI * 1.25, Math.PI * 1.75);
      ctx.stroke();
      ctx.setLineDash([]);

      if (flightState.trajectoryHistory.length > 1) {
        ctx.strokeStyle = '#FBBF24';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < flightState.trajectoryHistory.length; i++) {
          const pt = flightState.trajectoryHistory[i];
          const tx = mapX + 25 + (pt.x / 400000) * (mapW - 50);
          const ty = mapY + mapH - 22 - (pt.y / 200000) * (mapH - 35);
          if (i === 0) ctx.moveTo(tx, ty);
          else ctx.lineTo(tx, ty);
        }
        ctx.stroke();
      }

      ctx.fillStyle = '#9AA9B8';
      ctx.font = '600 10px sans-serif';
      ctx.fillText('ORBITAL TRAJECTORY RADAR', mapX + 8, mapY + 15);

      ctx.restore();

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [blueprint, flightState]);

  return (
    <div className="relative flex-1 h-full bg-[#0E1520] overflow-hidden select-none">
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Quick Mission Control Shortcut Strip */}
      <div className="absolute bottom-3 left-3 bg-[#121A26]/90 border border-[#263548] px-3.5 py-1.5 rounded-lg text-xs font-mono text-[#9AA9B8] flex items-center gap-4 shadow-md">
        <span>SPACE: <strong className="text-[#38BDF8]">Ignition / Stage</strong></span>
        <span>Z/X: <strong className="text-[#34D399]">Full / Cutoff</strong></span>
        <span>A/D: <strong className="text-[#FBBF24]">Pitch Steering</strong></span>
        <span>Karman Line: <strong className="text-[#38BDF8]">100 km</strong></span>
      </div>
    </div>
  );
};
