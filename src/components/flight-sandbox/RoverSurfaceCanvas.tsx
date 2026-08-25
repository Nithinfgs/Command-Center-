import React, { useRef, useState, useEffect } from 'react';
import { 
  stepRoverPhysics, 
  getTerrainElevation, 
  type PlanetaryRoverState 
} from '../../physics/rover-physics';
import { soundEngine } from '../../audio/soundEngine';
import { Battery, Sun, Flag, Disc, ArrowLeft, ArrowRight, Hand, RotateCcw } from 'lucide-react';

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

  // Unified Physics + 60 FPS Canvas Render Loop
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

      // 1. Step Physics
      roverRef.current = stepRoverPhysics(
        roverRef.current,
        throttleInputRef.current,
        isBrakingRef.current,
        dt
      );

      // Update UI state periodically (every ~6 frames for optimal React performance)
      uiUpdateCounter++;
      if (uiUpdateCounter % 6 === 0) {
        setUiRover({ ...roverRef.current });
      }

      // 2. Render Canvas
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (canvas.width !== width * window.devicePixelRatio || canvas.height !== height * window.devicePixelRatio) {
        canvas.width = width * window.devicePixelRatio;
        canvas.height = height * window.devicePixelRatio;
      }

      ctx.save();
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      ctx.clearRect(0, 0, width, height);

      const currentRover = roverRef.current;

      // Sky Background
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      if (currentRover.surfacePlanetId === 'mars') {
        skyGrad.addColorStop(0, '#1E120B');
        skyGrad.addColorStop(0.65, '#451A03');
        skyGrad.addColorStop(1, '#7C2D12');
      } else if (currentRover.surfacePlanetId === 'moon') {
        skyGrad.addColorStop(0, '#030712');
        skyGrad.addColorStop(1, '#0F172A');
      } else {
        skyGrad.addColorStop(0, '#064E3B');
        skyGrad.addColorStop(1, '#065F46');
      }
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      const groundBaseY = height * 0.68;
      const viewCenterX = width / 2;

      // Draw Terrain Profile
      ctx.fillStyle = currentRover.surfacePlanetId === 'mars' ? '#991B1B' : currentRover.surfacePlanetId === 'moon' ? '#475569' : '#047857';
      ctx.beginPath();
      ctx.moveTo(0, height);

      for (let screenX = 0; screenX <= width; screenX += 4) {
        const worldX = currentRover.posX + (screenX - viewCenterX);
        const { elevation } = getTerrainElevation(worldX, currentRover.surfacePlanetId);
        const screenY = groundBaseY - elevation;
        if (screenX === 0) ctx.lineTo(screenX, screenY);
        else ctx.lineTo(screenX, screenY);
      }
      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fill();

      // Terrain Ridge Highlight Line
      ctx.strokeStyle = currentRover.surfacePlanetId === 'mars' ? '#EF4444' : currentRover.surfacePlanetId === 'moon' ? '#94A3B8' : '#10B981';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Draw Surface Flags
      currentRover.flagsPlanted.forEach(flag => {
        const flagScreenX = viewCenterX + (flag.x - currentRover.posX);
        if (flagScreenX > -50 && flagScreenX < width + 50) {
          const { elevation } = getTerrainElevation(flag.x, flag.planetId);
          const flagScreenY = groundBaseY - elevation;

          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(flagScreenX, flagScreenY);
          ctx.lineTo(flagScreenX, flagScreenY - 32);
          ctx.stroke();

          ctx.fillStyle = '#FF8A1F';
          ctx.fillRect(flagScreenX, flagScreenY - 32, 22, 14);
          ctx.fillStyle = '#090A0D';
          ctx.font = 'bold 8px sans-serif';
          ctx.fillText('BASE', flagScreenX + 2, flagScreenY - 22);
        }
      });

      // Draw Rover Vehicle
      ctx.save();
      ctx.translate(viewCenterX, groundBaseY - currentRover.altitude);
      ctx.rotate((currentRover.pitchDeg * Math.PI) / 180);

      // Chassis Body
      ctx.fillStyle = '#E2E8F0';
      ctx.fillRect(-24, -18, 48, 14);
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 2;
      ctx.strokeRect(-24, -18, 48, 14);

      // Mastcam Sensor Head
      ctx.fillStyle = '#475569';
      ctx.fillRect(10, -32, 4, 14);
      ctx.fillStyle = '#38BDF8';
      ctx.beginPath();
      ctx.arc(12, -34, 4, 0, Math.PI * 2);
      ctx.fill();

      // Solar Panel Deck
      ctx.fillStyle = '#1E3A8A';
      ctx.fillRect(-22, -21, 42, 3);

      // Drill Arm animation
      if (currentRover.isDrilling) {
        ctx.strokeStyle = '#FBBF24';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(20, -10);
        ctx.lineTo(26, 6);
        ctx.stroke();

        ctx.fillStyle = '#F59E0B';
        for (let s = 0; s < 5; s++) {
          ctx.fillRect(26 + (Math.random() - 0.5) * 10, 6 + (Math.random() - 0.5) * 6, 2, 2);
        }
      }

      // 4 Wheels
      [-18, -6, 6, 18].forEach(wx => {
        ctx.fillStyle = '#1E293B';
        ctx.beginPath();
        ctx.arc(wx, 2, 6.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#94A3B8';
        ctx.lineWidth = 1.5;
        ctx.stroke();
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
          className="px-4 py-2.5 rounded-xl bg-[#1B1F28] hover:bg-[#252B36] text-[#E6E8EB] font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-all shadow-sm"
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
          className="px-4 py-2.5 rounded-xl bg-[#D95757]/20 hover:bg-[#D95757]/30 border border-[#D95757]/50 text-[#D95757] font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-all shadow-sm"
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
          className="px-5 py-2.5 rounded-xl bg-[#FF8A1F] hover:bg-[#FFA24A] text-[#090A0D] font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-all shadow-md"
          title="Drive Forward (D / Right Arrow)"
        >
          <span>Drive Forward</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-6 bg-[#252B36] mx-1" />

        <button
          onClick={handleStartDrill}
          disabled={uiRover.isDrilling || uiRover.sampleCount >= uiRover.maxSamples}
          className="px-3.5 py-2.5 rounded-xl bg-[#38BDF8]/20 hover:bg-[#38BDF8]/30 border border-[#38BDF8]/50 text-[#38BDF8] font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-all disabled:opacity-40"
        >
          <Disc className="w-4 h-4" />
          <span>{uiRover.isDrilling ? `Drilling ${uiRover.drillProgress.toFixed(0)}%` : 'Drill Sample'}</span>
        </button>

        <button
          onClick={handlePlantFlag}
          className="px-3.5 py-2.5 rounded-xl bg-[#55B982]/20 hover:bg-[#55B982]/30 border border-[#55B982]/50 text-[#55B982] font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-all"
        >
          <Flag className="w-4 h-4" />
          <span>Plant Flag</span>
        </button>
      </div>
    </div>
  );
};
