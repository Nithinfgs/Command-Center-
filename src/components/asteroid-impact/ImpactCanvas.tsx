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

      // High-DPI Scaling (Retina / 4K Crispness)
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.save();
      ctx.scale(dpr, dpr);

      const groundY = height * 0.72;
      const impactX = width * 0.5;

      // Atmospheric Deep Gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, groundY);
      skyGrad.addColorStop(0, '#020409');
      skyGrad.addColorStop(0.6, '#090f1d');
      skyGrad.addColorStop(1, '#152238');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, groundY);

      // Planet Crust Ground
      const groundGrad = ctx.createLinearGradient(0, groundY, 0, height);
      groundGrad.addColorStop(0, '#1c1917');
      groundGrad.addColorStop(0.3, '#292524');
      groundGrad.addColorStop(1, '#080605');
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, groundY, width, height - groundY);

      // Crust Surface Line
      ctx.strokeStyle = '#57534e';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(width, groundY);
      ctx.stroke();

      // Atmospheric Grid & Scale Lines
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.12)';
      ctx.lineWidth = 1;
      for (let y = 50; y < groundY; y += 60) {
        ctx.beginPath();
        ctx.moveTo(Math.round(0) + 0.5, Math.round(y) + 0.5);
        ctx.lineTo(Math.round(width) + 0.5, Math.round(y) + 0.5);
        ctx.stroke();
        const altKm = Math.round(((groundY - y) / groundY) * 100);
        ctx.fillStyle = 'rgba(0, 229, 255, 0.5)';
        ctx.font = 'bold 9.5px monospace';
        ctx.fillText(`${altKm} km`, 12, y - 5);
      }

      const st = simState.current;

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
        trailGrad.addColorStop(0.7, '#ffb703');
        trailGrad.addColorStop(1, '#ffffff');

        ctx.strokeStyle = trailGrad;
        ctx.lineWidth = Math.min(9, Math.max(3, asteroidConfig.diameter * 0.006));
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(currentX, currentY);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(currentX, currentY, Math.min(14, Math.max(4, asteroidConfig.diameter * 0.005)), 0, Math.PI * 2);
        ctx.fill();

        const auraGrad = ctx.createRadialGradient(currentX, currentY, 2, currentX, currentY, 25);
        auraGrad.addColorStop(0, '#ffffff');
        auraGrad.addColorStop(0.4, 'rgba(255, 183, 3, 0.8)');
        auraGrad.addColorStop(1, 'rgba(255, 51, 102, 0)');
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
              color: Math.random() > 0.5 ? '#ffb703' : '#ff3366'
            };
          });
        }
      }

      if (st.phase === 'detonation' || st.phase === 'expansion' || st.phase === 'settled') {
        const elapsed = (time - st.startTime) / 1000;

        if (elapsed < 0.25) {
          ctx.fillStyle = `rgba(255, 255, 255, ${0.95 - elapsed * 3.5})`;
          ctx.fillRect(0, 0, width, height);
        }

        const maxFireballPx = Math.min(width * 0.45, impactTelemetry.fireballRadius * 14 + 25);
        const currentFireball = maxFireballPx * Math.min(1, elapsed * 2.5);

        if (currentFireball > 0) {
          const fireballGrad = ctx.createRadialGradient(impactX, groundY, 5, impactX, groundY, currentFireball);
          fireballGrad.addColorStop(0, '#ffffff');
          fireballGrad.addColorStop(0.3, 'rgba(255, 183, 3, 0.95)');
          fireballGrad.addColorStop(0.7, 'rgba(255, 51, 102, 0.7)');
          fireballGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

          ctx.fillStyle = fireballGrad;
          ctx.beginPath();
          ctx.arc(impactX, groundY, currentFireball, Math.PI, 0, false);
          ctx.fill();
        }

        const shockSpeed = 280;
        const maxShockRadius = width * 0.49;
        const currentShock = Math.min(maxShockRadius, elapsed * shockSpeed);

        if (currentShock > 10) {
          // 20 PSI Ring
          ctx.strokeStyle = '#ff3366';
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.arc(impactX, groundY, currentShock * 0.4, Math.PI, 0, false);
          ctx.stroke();

          // 5 PSI Ring
          ctx.strokeStyle = '#ffb703';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(impactX, groundY, currentShock * 0.7, Math.PI, 0, false);
          ctx.stroke();

          // 1 PSI Ring
          ctx.strokeStyle = '#00e5ff';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.arc(impactX, groundY, currentShock, Math.PI, 0, false);
          ctx.stroke();
        }

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

        ctx.strokeStyle = '#ffb703';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Molten impact melt lake
        ctx.fillStyle = 'rgba(255, 51, 102, 0.75)';
        ctx.beginPath();
        ctx.ellipse(impactX, groundY + craterDepthPx * 0.75, craterScale * 0.35, craterDepthPx * 0.18, 0, 0, Math.PI * 2);
        ctx.fill();

        const gravityPx = 240;
        for (let i = 0; i < st.ejecta.length; i++) {
          const p = st.ejecta[i];
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vy += gravityPx * dt;
          p.life += 1;

          if (p.y < groundY && p.life < p.maxLife) {
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
  }, [asteroidConfig, impactTelemetry]);

  return (
    <div className="relative flex-1 h-full bg-[#020409] overflow-hidden select-none">
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Real-time Scientific Telemetry Dossier */}
      <div className="absolute top-3 right-3 bg-[#090f1d]/95 border-2 border-[#ff3366]/60 rounded-xl p-3.5 text-xs font-mono shadow-2xl w-84 space-y-2.5 backdrop-blur-md">
        <div className="flex items-center justify-between pb-2 border-b border-[#1e2d42]">
          <span className="font-bold text-slate-100 text-sm">KINETIC DESTRUCTION DOSSIER</span>
          <span className="text-[10px] text-[#ff3366] bg-[#ff3366]/15 px-2 py-0.5 rounded font-black uppercase">
            COLLINS MODEL
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="bg-[#03060f] p-2 rounded-lg border border-[#1a2638]">
            <div className="text-slate-500 font-bold">KINETIC ENERGY</div>
            <div className="text-[#ffb703] font-bold text-sm mt-0.5">{impactTelemetry.kineticEnergyMegatons.toLocaleString()} Mt TNT</div>
          </div>
          <div className="bg-[#03060f] p-2 rounded-lg border border-[#1a2638]">
            <div className="text-slate-500 font-bold">HIROSHIMA EQUIV</div>
            <div className="text-[#ff3366] font-bold text-sm mt-0.5">{impactTelemetry.tntEquivalentHiroshimas.toLocaleString()}x</div>
          </div>
          <div className="bg-[#03060f] p-2 rounded-lg border border-[#1a2638]">
            <div className="text-slate-500 font-bold">FINAL CRATER DIA</div>
            <div className="text-[#00e5ff] font-bold text-sm mt-0.5">
              {impactTelemetry.finalCraterDiameter >= 1000
                ? `${(impactTelemetry.finalCraterDiameter / 1000).toFixed(2)} km`
                : `${impactTelemetry.finalCraterDiameter} m`}
            </div>
          </div>
          <div className="bg-[#03060f] p-2 rounded-lg border border-[#1a2638]">
            <div className="text-slate-500 font-bold">CRATER DEPTH</div>
            <div className="text-cyan-400 font-bold text-sm mt-0.5">{impactTelemetry.craterDepth.toLocaleString()} m</div>
          </div>
          <div className="bg-[#03060f] p-2 rounded-lg border border-[#1a2638]">
            <div className="text-slate-500 font-bold">FIREBALL RADIUS</div>
            <div className="text-[#ff3366] font-bold text-sm mt-0.5">{impactTelemetry.fireballRadius} km</div>
          </div>
          <div className="bg-[#03060f] p-2 rounded-lg border border-[#1a2638]">
            <div className="text-slate-500 font-bold">SEISMIC Mw</div>
            <div className="text-purple-400 font-bold text-sm mt-0.5">M {impactTelemetry.seismicMagnitude}</div>
          </div>
        </div>

        <div className="bg-[#03060f] p-2.5 rounded-lg border border-[#1a2638] space-y-1.5 text-[10px]">
          <div className="text-slate-400 font-bold uppercase tracking-wider">OVERPRESSURE DEVASTATION RADII:</div>
          <div className="flex justify-between text-slate-200">
            <span className="text-[#ff3366] font-bold">20 PSI (Total Demolition):</span>
            <strong>{impactTelemetry.overpressure20psiRadius} km</strong>
          </div>
          <div className="flex justify-between text-slate-200">
            <span className="text-[#ffb703] font-bold">5 PSI (Structural Collapse):</span>
            <strong>{impactTelemetry.overpressure5psiRadius} km</strong>
          </div>
          <div className="flex justify-between text-slate-200">
            <span className="text-[#00e5ff] font-bold">1 PSI (Glass Breakage):</span>
            <strong>{impactTelemetry.overpressure1psiRadius} km</strong>
          </div>
        </div>

        <div className="p-2 bg-[#1a080d] border border-[#ff3366]/40 rounded-lg text-[10.5px] text-rose-200 leading-tight">
          <strong className="block text-[#ff3366] mb-0.5 uppercase font-bold">Atmospheric Assessment:</strong>
          {impactTelemetry.atmosphericDisruptionDescription}
        </div>
      </div>

      <div className="absolute bottom-3 left-3 bg-[#090f1d]/90 border border-[#1e2d42] px-3.5 py-1.5 rounded-lg text-[11px] font-mono text-slate-300 flex items-center gap-4 shadow-xl">
        <span>BOLIDE: <strong className="text-[#00e5ff]">{asteroidConfig.diameter}m ({asteroidConfig.composition})</strong></span>
        <span>VELOCITY: <strong className="text-[#ffb703]">{asteroidConfig.velocity} km/s</strong></span>
        <span>ANGLE: <strong className="text-cyan-400">{asteroidConfig.entryAngle}°</strong></span>
      </div>
    </div>
  );
};
