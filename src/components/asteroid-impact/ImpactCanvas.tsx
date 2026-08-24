import React, { useRef, useEffect } from 'react';
import { useSimulation } from '../../context/SimulationContext';

interface EjectaParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

export const ImpactCanvas: React.FC = () => {
  const {
    asteroidConfig,
    impactTelemetry,
    impactTriggerCounter
  } = useSimulation();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);

  const isOcean = asteroidConfig.targetSurfaceType === 'water_ocean' || asteroidConfig.targetAreaType === 'ocean_deep';

  const simState = useRef({
    phase: 'idle' as 'idle' | 'entry' | 'detonation' | 'expansion' | 'settled',
    startTime: 0,
    asteroidPos: { x: 0, y: 0 },
    blastRadius: 0,
    ejecta: [] as EjectaParticle[]
  });

  useEffect(() => {
    if (impactTriggerCounter === 0) return;

    simState.current = {
      phase: 'entry',
      startTime: performance.now(),
      asteroidPos: { x: 100, y: 50 },
      blastRadius: 0,
      ejecta: []
    };
  }, [impactTriggerCounter]);

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

      const groundY = height * 0.72;
      const impactX = width * 0.5;

      // Atmospheric Sky Gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, groundY);
      skyGrad.addColorStop(0, '#020409');
      skyGrad.addColorStop(0.6, '#090F1D');
      skyGrad.addColorStop(1, isOcean ? '#0C1B33' : '#152238');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, groundY);

      // Environment Surface: Ocean vs Land
      if (isOcean) {
        // Deep Ocean Water Layer
        const oceanGrad = ctx.createLinearGradient(0, groundY, 0, height);
        oceanGrad.addColorStop(0, '#0284C7');
        oceanGrad.addColorStop(0.3, '#0369A1');
        oceanGrad.addColorStop(0.7, '#082F49');
        oceanGrad.addColorStop(1, '#020617');
        ctx.fillStyle = oceanGrad;
        ctx.fillRect(0, groundY, width, height - groundY);

        // Water surface waves
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(0, groundY);
        for (let x = 0; x <= width; x += 15) {
          const waveY = groundY + Math.sin(x * 0.05 + time * 0.003) * 2;
          ctx.lineTo(x, waveY);
        }
        ctx.stroke();

        // Seabed Floor Line
        const seabedY = height * 0.94;
        ctx.fillStyle = '#1C1917';
        ctx.fillRect(0, seabedY, width, height - seabedY);
        ctx.strokeStyle = '#44403C';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, seabedY, width, 2);

        ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.font = '500 9.5px monospace';
        ctx.fillText('ABYSSAL SEABED (4,000m depth)', 14, seabedY + 14);
      } else {
        // Continental Crust Ground
        const groundGrad = ctx.createLinearGradient(0, groundY, 0, height);
        groundGrad.addColorStop(0, '#1C1917');
        groundGrad.addColorStop(0.3, '#292524');
        groundGrad.addColorStop(1, '#080605');
        ctx.fillStyle = groundGrad;
        ctx.fillRect(0, groundY, width, height - groundY);

        ctx.strokeStyle = '#57534E';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(0, groundY);
        ctx.lineTo(width, groundY);
        ctx.stroke();

        // City Skyline Silhouette if urban/metro area
        if (asteroidConfig.targetAreaType !== 'uninhabited') {
          ctx.fillStyle = '#0F172A';
          // Draw left city cluster
          [
            { x: impactX - 280, w: 22, h: 45 },
            { x: impactX - 255, w: 18, h: 65 },
            { x: impactX - 232, w: 28, h: 50 },
            { x: impactX - 200, w: 24, h: 75 },
            { x: impactX - 172, w: 16, h: 35 },
            // Draw right city cluster
            { x: impactX + 160, w: 20, h: 40 },
            { x: impactX + 185, w: 26, h: 70 },
            { x: impactX + 215, w: 18, h: 55 },
            { x: impactX + 238, w: 30, h: 80 },
            { x: impactX + 272, w: 22, h: 48 }
          ].forEach(b => {
            ctx.fillRect(b.x, groundY - b.h, b.w, b.h);
            ctx.strokeStyle = '#1E293B';
            ctx.strokeRect(b.x, groundY - b.h, b.w, b.h);
          });
        }
      }

      // Atmospheric Grid & Scale Lines
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.12)';
      ctx.lineWidth = 1;
      for (let y = 50; y < groundY; y += 60) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
        const altKm = Math.round(((groundY - y) / groundY) * 100);
        ctx.fillStyle = 'rgba(0, 229, 255, 0.45)';
        ctx.font = '500 9px monospace';
        ctx.fillText(`${altKm} km`, 12, y - 5);
      }

      const st = simState.current;

      // ==========================================
      // PHASE 1: ATMOSPHERIC ENTRY
      // ==========================================
      if (st.phase === 'entry') {
        const elapsed = (time - st.startTime) / 1000;
        const entryDuration = 1.2;
        const tNorm = Math.min(1, elapsed / entryDuration);

        const angleRad = (asteroidConfig.entryAngle * Math.PI) / 180;
        const startX = impactX - Math.cos(angleRad) * 650;
        const startY = groundY - Math.sin(angleRad) * 650;

        const currentX = startX + (impactX - startX) * tNorm;
        const currentY = startY + (groundY - startY) * tNorm;
        st.asteroidPos = { x: currentX, y: currentY };

        const trailGrad = ctx.createLinearGradient(startX, startY, currentX, currentY);
        trailGrad.addColorStop(0, 'rgba(255, 51, 102, 0)');
        trailGrad.addColorStop(0.7, '#FBBF24');
        trailGrad.addColorStop(1, '#FFFFFF');

        ctx.strokeStyle = trailGrad;
        ctx.lineWidth = Math.min(9, Math.max(3, asteroidConfig.diameter * 0.006));
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(currentX, currentY);
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(currentX, currentY, Math.min(14, Math.max(4, asteroidConfig.diameter * 0.005)), 0, Math.PI * 2);
        ctx.fill();

        const auraGrad = ctx.createRadialGradient(currentX, currentY, 2, currentX, currentY, 25);
        auraGrad.addColorStop(0, '#FFFFFF');
        auraGrad.addColorStop(0.4, 'rgba(251, 191, 36, 0.8)');
        auraGrad.addColorStop(1, 'rgba(244, 63, 94, 0)');
        ctx.fillStyle = auraGrad;
        ctx.beginPath();
        ctx.arc(currentX, currentY, 25, 0, Math.PI * 2);
        ctx.fill();

        if (tNorm >= 1) {
          st.phase = 'detonation';
          st.startTime = time;

          const count = 300;
          st.ejecta = Array.from({ length: count }, () => {
            const ejectaAngle = -Math.PI + Math.random() * Math.PI;
            const speed = 160 + Math.random() * 500;
            return {
              x: impactX,
              y: groundY,
              vx: Math.cos(ejectaAngle) * speed,
              vy: Math.sin(ejectaAngle) * speed,
              life: 0,
              maxLife: 80 + Math.random() * 80,
              size: 2 + Math.random() * 3.5,
              color: isOcean
                ? Math.random() > 0.4 ? '#38BDF8' : '#FFFFFF'
                : Math.random() > 0.5 ? '#FBBF24' : '#F43F5E'
            };
          });
        }
      }

      // ==========================================
      // PHASE 2: DETONATION & EXPANSION
      // ==========================================
      if (st.phase === 'detonation' || st.phase === 'expansion' || st.phase === 'settled') {
        const elapsed = (time - st.startTime) / 1000;

        // Initial flash
        if (elapsed < 0.25) {
          ctx.fillStyle = `rgba(255, 255, 255, ${0.95 - elapsed * 3.5})`;
          ctx.fillRect(0, 0, width, height);
        }

        // Fireball / Steam Vapor Plume
        const maxFireballPx = Math.min(width * 0.45, impactTelemetry.fireballRadius * 14 + 25);
        const currentFireball = maxFireballPx * Math.min(1, elapsed * 2.5);

        if (currentFireball > 0) {
          const fireballGrad = ctx.createRadialGradient(impactX, groundY, 5, impactX, groundY, currentFireball);
          if (isOcean) {
            fireballGrad.addColorStop(0, '#FFFFFF');
            fireballGrad.addColorStop(0.3, 'rgba(56, 189, 248, 0.9)');
            fireballGrad.addColorStop(0.7, 'rgba(2, 132, 199, 0.6)');
            fireballGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          } else {
            fireballGrad.addColorStop(0, '#FFFFFF');
            fireballGrad.addColorStop(0.3, 'rgba(251, 191, 36, 0.95)');
            fireballGrad.addColorStop(0.7, 'rgba(244, 63, 94, 0.7)');
            fireballGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          }

          ctx.fillStyle = fireballGrad;
          ctx.beginPath();
          ctx.arc(impactX, groundY, currentFireball, Math.PI, 0, false);
          ctx.fill();
        }

        // Shockwave Overpressure Waves / Rings
        const shockSpeed = 280;
        const maxShockRadius = width * 0.49;
        const currentShock = Math.min(maxShockRadius, elapsed * shockSpeed);

        if (currentShock > 10) {
          // 20 PSI Ring
          ctx.strokeStyle = '#F43F5E';
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.arc(impactX, groundY, currentShock * 0.4, Math.PI, 0, false);
          ctx.stroke();

          // 5 PSI Ring
          ctx.strokeStyle = '#FBBF24';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(impactX, groundY, currentShock * 0.7, Math.PI, 0, false);
          ctx.stroke();

          // 1 PSI Ring
          ctx.strokeStyle = '#38BDF8';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.arc(impactX, groundY, currentShock, Math.PI, 0, false);
          ctx.stroke();
        }

        // ==========================================
        // MEGATSUNAMI WAVES (FOR OCEAN IMPACTS)
        // ==========================================
        if (isOcean) {
          const waveSpeed = 160;
          const waveRadius = Math.min(width * 0.48, elapsed * waveSpeed);
          const initialWaveH = Math.min(120, (impactTelemetry.tsunamiWaveHeightAtImpactM / 10) * 3 + 15);

          if (waveRadius > 15) {
            const waveDecay = Math.max(0.15, 1 - waveRadius / (width * 0.48));
            const currentWaveH = initialWaveH * waveDecay;

            // Right expanding wave
            ctx.fillStyle = 'rgba(2, 132, 199, 0.85)';
            ctx.beginPath();
            ctx.moveTo(impactX + waveRadius - 30, groundY);
            ctx.quadraticCurveTo(impactX + waveRadius, groundY - currentWaveH, impactX + waveRadius + 15, groundY);
            ctx.lineTo(impactX + waveRadius - 30, groundY);
            ctx.closePath();
            ctx.fill();

            // Left expanding wave
            ctx.beginPath();
            ctx.moveTo(impactX - waveRadius + 30, groundY);
            ctx.quadraticCurveTo(impactX - waveRadius, groundY - currentWaveH, impactX - waveRadius - 15, groundY);
            ctx.lineTo(impactX - waveRadius + 30, groundY);
            ctx.closePath();
            ctx.fill();

            // Wave foam crest
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(impactX + waveRadius - 10, groundY - currentWaveH + 2);
            ctx.lineTo(impactX + waveRadius + 8, groundY - currentWaveH + 2);
            ctx.moveTo(impactX - waveRadius + 10, groundY - currentWaveH + 2);
            ctx.lineTo(impactX - waveRadius - 8, groundY - currentWaveH + 2);
            ctx.stroke();

            // Wave height label
            ctx.fillStyle = '#38BDF8';
            ctx.font = 'bold 10px monospace';
            ctx.fillText(
              `TSUNAMI: ${Math.round(impactTelemetry.tsunamiWaveHeightAtImpactM * waveDecay)}m`,
              impactX + waveRadius + 10,
              groundY - currentWaveH - 8
            );
          }
        } else {
          // Land Impact Crater Excavation
          const craterScale = Math.min(200, (impactTelemetry.finalCraterDiameter / 1000) * 9 + 18);
          const craterDepthPx = craterScale * 0.38;

          ctx.fillStyle = '#080605';
          ctx.beginPath();
          ctx.moveTo(impactX - craterScale, groundY);
          ctx.lineTo(impactX - craterScale * 0.9, groundY - craterScale * 0.12);
          ctx.quadraticCurveTo(impactX, groundY + craterDepthPx, impactX + craterScale * 0.9, groundY - craterScale * 0.12);
          ctx.lineTo(impactX + craterScale, groundY);
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = '#FBBF24';
          ctx.lineWidth = 2.5;
          ctx.stroke();

          // Molten impact melt lake
          ctx.fillStyle = 'rgba(244, 63, 94, 0.75)';
          ctx.beginPath();
          ctx.ellipse(impactX, groundY + craterDepthPx * 0.75, craterScale * 0.35, craterDepthPx * 0.18, 0, 0, Math.PI * 2);
          ctx.fill();
        }

        // Particle dynamics
        const gravityPx = 240;
        for (let i = 0; i < st.ejecta.length; i++) {
          const p = st.ejecta[i];
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vy += gravityPx * dt;
          p.life += 1;

          if (p.life < p.maxLife) {
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      ctx.restore();

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [asteroidConfig, impactTelemetry, isOcean]);

  return (
    <div className="relative flex-1 h-full bg-[#080E18] overflow-hidden select-none">
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Target Status Banner */}
      <div className="absolute top-3 left-3 bg-[#121A26]/90 border border-[#263548] px-3.5 py-1.5 rounded-lg text-xs font-mono text-[#9AA9B8] flex items-center gap-3 shadow-md">
        <span>Target Area: <strong className="text-[#38BDF8] capitalize">{asteroidConfig.targetAreaType.replace('_', ' ')}</strong></span>
        <span>Surface: <strong className="text-[#FBBF24]">{isOcean ? 'Deep Ocean' : 'Continental Crust'}</strong></span>
        <span>Pop At Risk: <strong className="text-[#F43F5E]">{(asteroidConfig.customPopulation ?? impactTelemetry.targetPopulation).toLocaleString()}</strong></span>
      </div>
    </div>
  );
};
