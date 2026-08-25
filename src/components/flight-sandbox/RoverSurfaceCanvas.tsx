import React, { useRef, useState, useEffect } from 'react';
import { 
  stepRoverPhysics, 
  getTerrainElevation, 
  type PlanetaryRoverState 
} from '../../physics/rover-physics';
import { soundEngine } from '../../audio/soundEngine';
import { Battery, Sun, Flag, Disc, ArrowLeft, ArrowRight, Hand, RotateCcw } from 'lucide-react';

const PPM = 8.0; // Pixels per meter (crisp visible speed & responsive motion)

interface DustParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  size: number;
}

export const RoverSurfaceCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const initialElevation = getTerrainElevation(0, 'mars').elevation;

  const roverRef = useRef<PlanetaryRoverState>({
    posX: 0,
    altitude: initialElevation,
    vx: 0,
    vy: 0,
    pitchDeg: 0,
    batteryPercent: 100,
    solarPowerWatts: 140,
    sampleCount: 0,
    maxSamples: 5,
    flagsPlanted: [],
    isDrilling: false,
    drillProgress: 0,
    surfacePlanetId: 'mars'
  });

  const [uiRover, setUiRover] = useState<PlanetaryRoverState>(roverRef.current);
  const throttleInputRef = useRef<number>(0);
  const isBrakingRef = useRef<boolean>(false);
  const dustParticlesRef = useRef<DustParticle[]>([]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') {
        throttleInputRef.current = 1.0;
      } else if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
        throttleInputRef.current = -1.0;
      } else if (e.code === 'Space') {
        isBrakingRef.current = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'KeyD' || e.code === 'ArrowRight' || e.code === 'KeyA' || e.code === 'ArrowLeft') {
        throttleInputRef.current = 0;
      } else if (e.code === 'Space') {
        isBrakingRef.current = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Unified Physics & 60 FPS Canvas Render Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();
    let uiUpdateCounter = 0;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = (time: number) => {
      animId = requestAnimationFrame(render);

      const dt = Math.min(0.05, (time - lastTime) / 1000);
      lastTime = time;

      // Step Physics
      roverRef.current = stepRoverPhysics(
        roverRef.current,
        throttleInputRef.current,
        isBrakingRef.current,
        dt
      );

      // Spawn Tire Dust Particles when moving
      const currentRover = roverRef.current;
      if (Math.abs(currentRover.vx) > 0.4 && Math.random() < 0.65) {
        const dir = currentRover.vx > 0 ? -1 : 1;
        dustParticlesRef.current.push({
          x: currentRover.posX + (dir * 2.2),
          y: currentRover.altitude - 0.5,
          vx: dir * (1.5 + Math.random() * 2),
          vy: 0.8 + Math.random() * 1.5,
          alpha: 0.8,
          size: 2 + Math.random() * 3
        });
      }

      // Update Dust Particles
      dustParticlesRef.current.forEach(p => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.alpha -= dt * 1.2;
      });
      dustParticlesRef.current = dustParticlesRef.current.filter(p => p.alpha > 0.05);

      // React UI telemetry sync
      uiUpdateCounter++;
      if (uiUpdateCounter % 4 === 0) {
        setUiRover({ ...roverRef.current });
      }

      // Canvas dimensions
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (canvas.width !== width * window.devicePixelRatio || canvas.height !== height * window.devicePixelRatio) {
        canvas.width = width * window.devicePixelRatio;
        canvas.height = height * window.devicePixelRatio;
      }

      ctx.save();
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      ctx.clearRect(0, 0, width, height);

      // 1. Sky Gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      if (currentRover.surfacePlanetId === 'mars') {
        skyGrad.addColorStop(0, '#160B06');
        skyGrad.addColorStop(0.6, '#381403');
        skyGrad.addColorStop(1, '#662208');
      } else if (currentRover.surfacePlanetId === 'moon') {
        skyGrad.addColorStop(0, '#02040A');
        skyGrad.addColorStop(1, '#0B1120');
      } else {
        skyGrad.addColorStop(0, '#042F2E');
        skyGrad.addColorStop(1, '#064E3B');
      }
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      const groundBaseY = height * 0.65;
      const viewCenterX = width / 2;

      // 2. Parallax Distant Mountains Silhouette (0.15x parallax)
      const mtnOffset = currentRover.posX * 0.15 * PPM;
      ctx.fillStyle = currentRover.surfacePlanetId === 'mars' ? '#3B1106' : currentRover.surfacePlanetId === 'moon' ? '#1E293B' : '#064E3B';
      ctx.beginPath();
      ctx.moveTo(0, height);
      for (let sx = 0; sx <= width; sx += 20) {
        const mx = (sx + mtnOffset) * 0.005;
        const my = groundBaseY - 60 - Math.sin(mx) * 55 - Math.cos(mx * 2.3) * 25;
        ctx.lineTo(sx, my);
      }
      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fill();

      // 3. Foreground Terrain Surface Profile
      ctx.fillStyle = currentRover.surfacePlanetId === 'mars' ? '#881337' : currentRover.surfacePlanetId === 'moon' ? '#334155' : '#065F46';
      ctx.beginPath();
      ctx.moveTo(0, height);

      for (let screenX = 0; screenX <= width; screenX += 3) {
        const worldMetersX = currentRover.posX + (screenX - viewCenterX) / PPM;
        const { elevation } = getTerrainElevation(worldMetersX, currentRover.surfacePlanetId);
        const screenY = groundBaseY - elevation * PPM;
        ctx.lineTo(screenX, screenY);
      }
      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fill();

      // 4. Crust Highlight Ridge Line
      ctx.strokeStyle = currentRover.surfacePlanetId === 'mars' ? '#F43F5E' : currentRover.surfacePlanetId === 'moon' ? '#94A3B8' : '#10B981';
      ctx.lineWidth = 3.0;
      ctx.stroke();

      // 5. Procedural Surface Rocks & Boulders (Deterministically anchored in world space)
      const minRockWorldX = Math.floor(currentRover.posX - (viewCenterX / PPM) - 10);
      const maxRockWorldX = Math.ceil(currentRover.posX + (viewCenterX / PPM) + 10);

      ctx.fillStyle = currentRover.surfacePlanetId === 'mars' ? '#4C0519' : currentRover.surfacePlanetId === 'moon' ? '#1E293B' : '#022C22';
      ctx.strokeStyle = currentRover.surfacePlanetId === 'mars' ? '#FB7185' : '#CBD5E1';
      ctx.lineWidth = 1;

      for (let rx = minRockWorldX; rx <= maxRockWorldX; rx += 4) {
        // Pseudo-random deterministic rock check
        const hash = Math.sin(rx * 997.13) * 10000;
        const hasRock = (hash - Math.floor(hash)) > 0.45;
        if (!hasRock) continue;

        const rockScreenX = viewCenterX + (rx - currentRover.posX) * PPM;
        const { elevation } = getTerrainElevation(rx, currentRover.surfacePlanetId);
        const rockScreenY = groundBaseY - elevation * PPM;

        const rockRadius = 3 + ((hash * 13) % 4);
        ctx.beginPath();
        ctx.arc(rockScreenX, rockScreenY + 1, rockRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      // 6. Draw Planted Base Flags
      currentRover.flagsPlanted.forEach(flag => {
        const flagScreenX = viewCenterX + (flag.x - currentRover.posX) * PPM;
        if (flagScreenX > -50 && flagScreenX < width + 50) {
          const { elevation } = getTerrainElevation(flag.x, flag.planetId);
          const flagScreenY = groundBaseY - elevation * PPM;

          // Pole
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(flagScreenX, flagScreenY);
          ctx.lineTo(flagScreenX, flagScreenY - 38);
          ctx.stroke();

          // Cloth
          ctx.fillStyle = '#FF8A1F';
          ctx.fillRect(flagScreenX, flagScreenY - 38, 26, 16);
          ctx.fillStyle = '#090A0D';
          ctx.font = 'bold 9px sans-serif';
          ctx.fillText('BASE', flagScreenX + 3, flagScreenY - 26);
        }
      });

      // 7. Render Tire Dust Particles
      dustParticlesRef.current.forEach(p => {
        const px = viewCenterX + (p.x - currentRover.posX) * PPM;
        const py = groundBaseY - p.y * PPM;
        ctx.fillStyle = currentRover.surfacePlanetId === 'mars' 
          ? `rgba(244, 63, 94, ${p.alpha})` 
          : `rgba(203, 213, 225, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // 8. Draw Rover Vehicle Chassis & Rotating Spoked Wheels
      ctx.save();
      const roverScreenY = groundBaseY - currentRover.altitude * PPM;
      ctx.translate(viewCenterX, roverScreenY);
      ctx.rotate((currentRover.pitchDeg * Math.PI) / 180);

      // Chassis Body
      ctx.fillStyle = '#F1F5F9';
      ctx.fillRect(-28, -20, 56, 16);
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(-28, -20, 56, 16);

      // Mission Insignia Badge
      ctx.fillStyle = '#FF8A1F';
      ctx.fillRect(-18, -17, 16, 6);

      // Sensor Mastcam
      ctx.fillStyle = '#475569';
      ctx.fillRect(12, -36, 5, 16);
      ctx.fillStyle = '#38BDF8';
      ctx.beginPath();
      ctx.arc(14.5, -38, 4.5, 0, Math.PI * 2);
      ctx.fill();

      // Solar Panel Deck
      ctx.fillStyle = '#1E3A8A';
      ctx.fillRect(-26, -24, 52, 4);

      // Science Drill Arm
      if (currentRover.isDrilling) {
        ctx.strokeStyle = '#FBBF24';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(24, -12);
        ctx.lineTo(32, 10);
        ctx.stroke();

        ctx.fillStyle = '#F59E0B';
        for (let s = 0; s < 6; s++) {
          ctx.fillRect(32 + (Math.random() - 0.5) * 12, 10 + (Math.random() - 0.5) * 8, 2.5, 2.5);
        }
      }

      // 4 Wheels with Rotating Spokes
      const wheelRadius = 8.0;
      const wheelRotation = (currentRover.posX * PPM) / wheelRadius; // Exact rotational sync

      [-22, -8, 8, 22].forEach(wx => {
        ctx.save();
        ctx.translate(wx, 3);
        ctx.rotate(wheelRotation);

        // Tire Outer Rim
        ctx.fillStyle = '#0F172A';
        ctx.beginPath();
        ctx.arc(0, 0, wheelRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#94A3B8';
        ctx.lineWidth = 2.0;
        ctx.stroke();

        // 4 Rotating Spokes
        ctx.strokeStyle = '#F8FAFC';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(-wheelRadius + 1, 0);
        ctx.lineTo(wheelRadius - 1, 0);
        ctx.moveTo(0, -wheelRadius + 1);
        ctx.lineTo(0, wheelRadius - 1);
        ctx.stroke();

        // Center Hubcap
        ctx.fillStyle = '#FF8A1F';
        ctx.beginPath();
        ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      });

      ctx.restore();
      ctx.restore();
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, []);

  const handlePlantFlag = () => {
    soundEngine.speak('Surface flag planted. Planetary outpost established.');
    roverRef.current.flagsPlanted = [
      ...roverRef.current.flagsPlanted,
      { x: roverRef.current.posX, label: 'Outpost Alpha', planetId: roverRef.current.surfacePlanetId }
    ];
    setUiRover({ ...roverRef.current });
  };

  const handleStartDrill = () => {
    if (roverRef.current.sampleCount >= roverRef.current.maxSamples || roverRef.current.batteryPercent < 10) return;
    soundEngine.speak('Science drill active. Extracting core regolith sample.');
    roverRef.current.isDrilling = true;
    roverRef.current.drillProgress = 0;
    setUiRover({ ...roverRef.current });
  };

  const handleResetRover = () => {
    const el = getTerrainElevation(0, roverRef.current.surfacePlanetId).elevation;
    roverRef.current = {
      ...roverRef.current,
      posX: 0,
      altitude: el,
      vx: 0,
      pitchDeg: 0,
      batteryPercent: 100,
      flagsPlanted: []
    };
    setUiRover({ ...roverRef.current });
  };

  return (
    <div ref={containerRef} className="relative flex-1 h-full bg-[#090A0D] overflow-hidden select-none font-mono-num">
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Top Rover Status Dashboard */}
      <div className="absolute top-3 left-3 flex items-center gap-4 bg-[#151820]/90 border border-[#252B36] p-3 rounded-xl text-xs shadow-xl backdrop-blur-sm">
        <div className="flex items-center gap-1.5 text-[#55B982]">
          <Battery className="w-4 h-4" />
          <span>{uiRover.batteryPercent.toFixed(0)}%</span>
        </div>
        <div className="flex items-center gap-1.5 text-[#FBBF24]">
          <Sun className="w-4 h-4" />
          <span>{uiRover.solarPowerWatts} W</span>
        </div>
        <div className="flex items-center gap-1.5 text-[#38BDF8]">
          <Disc className="w-4 h-4" />
          <span>Samples: <strong>{uiRover.sampleCount}/{uiRover.maxSamples}</strong></span>
        </div>
        <div className="text-[#E6E8EB]">
          Speed: <strong className="text-[#FF8A1F]">{uiRover.vx.toFixed(1)} m/s</strong>
        </div>
        <div className="text-[#A4ABB6]">
          Distance: <strong>{Math.round(uiRover.posX)} m</strong>
        </div>
      </div>

      {/* Planet Surface Selector */}
      <div className="absolute top-3 right-3 flex items-center gap-1 bg-[#151820]/90 border border-[#252B36] p-1.5 rounded-xl text-xs shadow-xl">
        {(['moon', 'mars', 'titan'] as const).map(p => (
          <button
            key={p}
            onClick={() => {
              roverRef.current.surfacePlanetId = p;
              roverRef.current.posX = 0;
              roverRef.current.altitude = getTerrainElevation(0, p).elevation;
              roverRef.current.vx = 0;
              roverRef.current.flagsPlanted = [];
              setUiRover({ ...roverRef.current });
            }}
            className={`px-3 py-1.5 rounded-lg text-xs uppercase font-semibold transition-all ${
              uiRover.surfacePlanetId === p
                ? 'bg-[#FF8A1F] text-[#090A0D] shadow-sm'
                : 'text-[#A4ABB6] hover:text-[#E6E8EB] hover:bg-[#1B1F28]'
            }`}
          >
            {p}
          </button>
        ))}
        <button
          onClick={handleResetRover}
          className="p-1.5 rounded-lg text-[#A4ABB6] hover:text-[#E6E8EB] hover:bg-[#1B1F28] ml-1"
          title="Reset Rover to Origin"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Bottom Rover Action & Drive Controls */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-[#151820]/95 border border-[#252B36] p-2.5 rounded-2xl shadow-2xl backdrop-blur-md">
        <button
          onMouseDown={() => { throttleInputRef.current = -1.0; }}
          onMouseUp={() => { throttleInputRef.current = 0; }}
          onTouchStart={() => { throttleInputRef.current = -1.0; }}
          onTouchEnd={() => { throttleInputRef.current = 0; }}
          className="px-4 py-2.5 rounded-xl bg-[#1B1F28] hover:bg-[#252B36] text-[#E6E8EB] font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-all shadow-sm cursor-pointer"
          title="Drive Reverse (A / Left Arrow)"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Reverse</span>
        </button>

        <button
          onMouseDown={() => { isBrakingRef.current = true; }}
          onMouseUp={() => { isBrakingRef.current = false; }}
          onTouchStart={() => { isBrakingRef.current = true; }}
          onTouchEnd={() => { isBrakingRef.current = false; }}
          className="px-4 py-2.5 rounded-xl bg-[#D95757]/20 hover:bg-[#D95757]/30 border border-[#D95757]/50 text-[#D95757] font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-all shadow-sm cursor-pointer"
          title="Handbrake (Spacebar)"
        >
          <Hand className="w-4 h-4" />
          <span>Brake</span>
        </button>

        <button
          onMouseDown={() => { throttleInputRef.current = 1.0; }}
          onMouseUp={() => { throttleInputRef.current = 0; }}
          onTouchStart={() => { throttleInputRef.current = 1.0; }}
          onTouchEnd={() => { throttleInputRef.current = 0; }}
          className="px-5 py-2.5 rounded-xl bg-[#FF8A1F] hover:bg-[#FFA24A] text-[#090A0D] font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-all shadow-md cursor-pointer"
          title="Drive Forward (D / Right Arrow)"
        >
          <span>Drive Forward</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-6 bg-[#252B36] mx-1" />

        <button
          onClick={handleStartDrill}
          disabled={uiRover.isDrilling || uiRover.sampleCount >= uiRover.maxSamples}
          className="px-3.5 py-2.5 rounded-xl bg-[#38BDF8]/20 hover:bg-[#38BDF8]/30 border border-[#38BDF8]/50 text-[#38BDF8] font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-all disabled:opacity-40 cursor-pointer"
        >
          <Disc className="w-4 h-4" />
          <span>{uiRover.isDrilling ? `Drilling ${uiRover.drillProgress.toFixed(0)}%` : 'Drill Sample'}</span>
        </button>

        <button
          onClick={handlePlantFlag}
          className="px-3.5 py-2.5 rounded-xl bg-[#55B982]/20 hover:bg-[#55B982]/30 border border-[#55B982]/50 text-[#55B982] font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
        >
          <Flag className="w-4 h-4" />
          <span>Plant Flag</span>
        </button>
      </div>
    </div>
  );
};
