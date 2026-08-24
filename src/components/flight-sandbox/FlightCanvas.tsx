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

export const FlightCanvas: React.FC = () => {
  const { blueprint, flightState } = useSimulation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const flameParticlesRef = useRef<FlameParticle[]>([]);

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

      // High-DPI Scaling (Retina / 4K Crispness)
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.save();
      ctx.scale(dpr, dpr);

      const altNorm = Math.min(1, flightState.altitude / 100000);

      // Deep Dynamic Sky Gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      if (altNorm < 0.2) {
        skyGrad.addColorStop(0, '#090f1d');
        skyGrad.addColorStop(0.5, '#152b52');
        skyGrad.addColorStop(1, '#0284c7');
      } else if (altNorm < 0.6) {
        skyGrad.addColorStop(0, '#020409');
        skyGrad.addColorStop(0.6, '#090f1d');
        skyGrad.addColorStop(1, '#152b52');
      } else {
        skyGrad.addColorStop(0, '#010206');
        skyGrad.addColorStop(1, '#060a14');
      }
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // Starfield in upper atmosphere
      if (altNorm > 0.25) {
        const starAlpha = Math.min(1, (altNorm - 0.25) * 2.2);
        ctx.fillStyle = `rgba(255, 255, 255, ${starAlpha * 0.9})`;
        for (let i = 0; i < 140; i++) {
          const sx = (Math.sin(i * 99) * 0.5 + 0.5) * width;
          const sy = (Math.cos(i * 77) * 0.5 + 0.5) * height * 0.75;
          ctx.fillRect(sx, sy, 1.5, 1.5);
        }
      }

      const groundY = height * 0.85;
      const camScale = Math.max(0.4, 1.0 - altNorm * 0.5);

      const rocketScreenX = width * 0.4;
      const rocketScreenY = flightState.isLaunched
        ? Math.max(height * 0.3, groundY - flightState.altitude * 0.05 * camScale)
        : groundY - 50;

      // Ground & Launch Platform
      if (rocketScreenY > -200) {
        const currentGroundY = rocketScreenY + (flightState.isLaunched ? flightState.altitude * 0.05 * camScale : 50);
        if (currentGroundY < height + 100) {
          ctx.fillStyle = '#1c1917';
          ctx.fillRect(0, currentGroundY, width, height - currentGroundY + 100);

          // Launch tower & pad
          ctx.fillStyle = '#334155';
          ctx.fillRect(rocketScreenX - 50, currentGroundY - 75, 18, 75);
          ctx.strokeStyle = '#64748b';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(rocketScreenX - 50, currentGroundY - 75, 18, 75);
        }
      }

      // ==========================================
      // ROCKET DRAWING
      // ==========================================
      const pitchRad = ((flightState.pitch - 90) * Math.PI) / 180;

      ctx.save();
      ctx.translate(rocketScreenX, rocketScreenY);
      ctx.rotate(pitchRad);
      ctx.scale(camScale * 0.95, camScale * 0.95);

      const cellSize = GRID_CELL_SIZE;

      for (const part of blueprint.parts) {
        if (flightState.isLaunched && part.stage < flightState.currentStageIndex) {
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
        ctx.rotate((part.rotation * Math.PI) / 180);

        if (def.texturePattern === 'cone') {
          const coneGrad = ctx.createLinearGradient(-pw / 2, 0, pw / 2, 0);
          coneGrad.addColorStop(0, '#1e293b');
          coneGrad.addColorStop(0.3, def.color);
          coneGrad.addColorStop(0.7, def.color);
          coneGrad.addColorStop(1, '#0f172a');

          ctx.fillStyle = coneGrad;
          ctx.beginPath();
          ctx.moveTo(-pw / 2, ph / 2);
          ctx.quadraticCurveTo(0, -ph / 2 - 12, pw / 2, ph / 2);
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = '#020617';
          ctx.lineWidth = 1.8;
          ctx.stroke();
        } else if (def.texturePattern === 'engine-bell') {
          ctx.fillStyle = '#334155';
          ctx.fillRect(-pw * 0.35, -ph / 2, pw * 0.7, ph * 0.35);

          ctx.fillStyle = def.color;
          ctx.beginPath();
          ctx.moveTo(-pw * 0.2, -ph / 2 + ph * 0.45);
          ctx.lineTo(pw * 0.2, -ph / 2 + ph * 0.45);
          ctx.lineTo(pw / 2, ph / 2);
          ctx.lineTo(-pw / 2, ph / 2);
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 1.2;
          ctx.stroke();

          // ==========================================
          // ENGINE THRUST FLAME & PLUME
          // ==========================================
          if (flightState.isLaunched && flightState.throttle > 0 && part.stage === flightState.currentStageIndex) {
            const flameLen = 50 * flightState.throttle + (Math.sin(time * 0.05) * 6);
            const flameGrad = ctx.createLinearGradient(0, ph / 2, 0, ph / 2 + flameLen);
            flameGrad.addColorStop(0, '#ffffff');
            flameGrad.addColorStop(0.15, '#00e5ff');
            flameGrad.addColorStop(0.6, '#ffb703');
            flameGrad.addColorStop(1, 'rgba(255, 51, 102, 0)');

            ctx.fillStyle = flameGrad;
            ctx.beginPath();
            ctx.moveTo(-pw * 0.35, ph / 2);
            ctx.lineTo(pw * 0.35, ph / 2);
            ctx.lineTo(0, ph / 2 + flameLen);
            ctx.closePath();
            ctx.fill();

            if (flameParticlesRef.current.length < 160) {
              flameParticlesRef.current.push({
                x: rocketScreenX + Math.sin(pitchRad) * (ph / 2),
                y: rocketScreenY + Math.cos(pitchRad) * (ph / 2 + 10),
                vx: (Math.random() - 0.5) * 25,
                vy: 45 + Math.random() * 90,
                life: 0,
                maxLife: 30 + Math.random() * 20,
                size: 2 + Math.random() * 4,
                color: altNorm < 0.3 ? 'rgba(203, 213, 225, 0.45)' : 'rgba(255, 183, 3, 0.7)'
              });
            }
          }
        } else if (def.texturePattern === 'fin') {
          ctx.fillStyle = def.color;
          ctx.beginPath();
          ctx.moveTo(-pw / 2, -ph / 2);
          ctx.lineTo(pw / 2, 0);
          ctx.lineTo(pw / 2, ph / 2);
          ctx.lineTo(-pw / 2, ph / 2);
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = '#020617';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        } else {
          ctx.fillStyle = def.color;
          ctx.fillRect(-pw / 2, -ph / 2, pw, ph);

          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 1.2;
          ctx.strokeRect(-pw / 2, -ph / 2, pw, ph);
        }

        ctx.restore();
      }

      ctx.restore();

      // Exhaust Particles
      const particles = flameParticlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life += 1;
        p.size += 0.25;

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
      const mapX = width - mapW - 16;
      const mapY = 16;

      ctx.fillStyle = 'rgba(9, 15, 29, 0.92)';
      ctx.fillRect(mapX, mapY, mapW, mapH);
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(mapX, mapY, mapW, mapH);

      // Earth Curvature
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(mapX + mapW / 2, mapY + mapH + 60, 90, Math.PI * 1.25, Math.PI * 1.75);
      ctx.stroke();

      // Karman Line 100km
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.45)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(mapX + mapW / 2, mapY + mapH + 60, 110, Math.PI * 1.25, Math.PI * 1.75);
      ctx.stroke();
      ctx.setLineDash([]);

      if (flightState.trajectoryHistory.length > 1) {
        ctx.strokeStyle = '#ffb703';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < flightState.trajectoryHistory.length; i++) {
          const pt = flightState.trajectoryHistory[i];
          const tx = mapX + 30 + (pt.x / 400000) * (mapW - 60);
          const ty = mapY + mapH - 25 - (pt.y / 200000) * (mapH - 40);
          if (i === 0) ctx.moveTo(tx, ty);
          else ctx.lineTo(tx, ty);
        }
        ctx.stroke();
      }

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 9.5px monospace';
      ctx.fillText('ORBITAL TRAJECTORY RADAR', mapX + 10, mapY + 16);

      ctx.restore(); // restore dpr

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [blueprint, flightState]);

  return (
    <div className="relative flex-1 h-full bg-[#010206] overflow-hidden select-none">
      <canvas ref={canvasRef} className="w-full h-full block" />

      <div className="absolute bottom-3 left-3 bg-[#090f1d]/90 border border-[#1e2d42] px-3.5 py-1.5 rounded-lg text-[11px] font-mono text-slate-300 flex items-center gap-4 shadow-xl">
        <span>SPACE: <strong className="text-[#00e5ff]">Launch / Stage</strong></span>
        <span>SLIDERS: <strong className="text-[#ffb703]">Throttle & Pitch Steering</strong></span>
        <span>KARMAN LINE: <strong className="text-cyan-400">100 km</strong></span>
      </div>
    </div>
  );
};
