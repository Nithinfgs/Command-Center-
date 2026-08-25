import React, { useRef, useState, useEffect } from 'react';
import { 
  stepRoverPhysics, 
  getTerrainElevation, 
  type PlanetaryRoverState 
} from '../../physics/rover-physics';
import { soundEngine } from '../../audio/soundEngine';
import { Battery, Sun, Flag, Disc, ArrowLeft, ArrowRight, Hand } from 'lucide-react';

export const RoverSurfaceCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [rover, setRover] = useState<PlanetaryRoverState>({
    posX: 0,
    altitude: 0,
    vx: 0,
    vy: 0,
    pitchDeg: 0,
    batteryPercent: 95,
    solarPowerWatts: 140,
    sampleCount: 0,
    maxSamples: 5,
    flagsPlanted: [],
    isDrilling: false,
    drillProgress: 0,
    surfacePlanetId: 'mars'
  });

  const [inputThrottle, setInputThrottle] = useState<number>(0);
  const [isBraking, setIsBraking] = useState<boolean>(false);

  // Keyboard controls for Rover (A/D or Arrows to drive, Space to brake)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') setInputThrottle(1.0);
      else if (e.code === 'KeyA' || e.code === 'ArrowLeft') setInputThrottle(-1.0);
      else if (e.code === 'Space') setIsBraking(true);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'KeyD' || e.code === 'ArrowRight' || e.code === 'KeyA' || e.code === 'ArrowLeft') {
        setInputThrottle(0);
      } else if (e.code === 'Space') {
        setIsBraking(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Rover Physics Stepper Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = Math.min(0.04, (time - lastTime) / 1000);
      lastTime = time;

      setRover(prev => stepRoverPhysics(prev, inputThrottle, isBraking, dt));
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [inputThrottle, isBraking]);

  // Canvas 2D Terrain & Rover Visualizer
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    ctx.clearRect(0, 0, width, height);

    // Sky gradient based on planet
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
    if (rover.surfacePlanetId === 'mars') {
      skyGrad.addColorStop(0, '#1E120B');
      skyGrad.addColorStop(0.7, '#451A03');
      skyGrad.addColorStop(1, '#7C2D12');
    } else {
      skyGrad.addColorStop(0, '#030712');
      skyGrad.addColorStop(1, '#0F172A');
    }
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);

    const groundBaseY = height * 0.7;
    const viewCenterX = width / 2;

    // Draw Terrain Surface Profile
    ctx.fillStyle = rover.surfacePlanetId === 'mars' ? '#991B1B' : '#64748B';
    ctx.beginPath();
    ctx.moveTo(0, height);

    for (let screenX = 0; screenX <= width; screenX += 5) {
      const worldX = rover.posX + (screenX - viewCenterX);
      const { elevation } = getTerrainElevation(worldX, rover.surfacePlanetId);
      const screenY = groundBaseY - elevation;
      if (screenX === 0) ctx.lineTo(screenX, screenY);
      else ctx.lineTo(screenX, screenY);
    }
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fill();

    // Terrain Surface Rock Line
    ctx.strokeStyle = rover.surfacePlanetId === 'mars' ? '#DC2626' : '#94A3B8';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Planted Surface Flags
    rover.flagsPlanted.forEach(flag => {
      const flagScreenX = viewCenterX + (flag.x - rover.posX);
      if (flagScreenX > -50 && flagScreenX < width + 50) {
        const { elevation } = getTerrainElevation(flag.x, flag.planetId);
        const flagScreenY = groundBaseY - elevation;

        // Flagpole
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(flagScreenX, flagScreenY);
        ctx.lineTo(flagScreenX, flagScreenY - 35);
        ctx.stroke();

        // Flag cloth
        ctx.fillStyle = '#FF8A1F';
        ctx.fillRect(flagScreenX, flagScreenY - 35, 20, 12);
        ctx.fillStyle = '#090A0D';
        ctx.font = 'bold 8px sans-serif';
        ctx.fillText('BASE', flagScreenX + 2, flagScreenY - 26);
      }
    });

    // Draw Planetary Rover Chassis
    ctx.save();
    ctx.translate(viewCenterX, groundBaseY - rover.altitude);
    ctx.rotate((rover.pitchDeg * Math.PI) / 180);

    // Rover Main Body Box
    ctx.fillStyle = '#E2E8F0';
    ctx.fillRect(-22, -18, 44, 14);
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2;
    ctx.strokeRect(-22, -18, 44, 14);

    // Mastcam & Science Sensor Head
    ctx.fillStyle = '#475569';
    ctx.fillRect(10, -32, 4, 14);
    ctx.fillStyle = '#38BDF8';
    ctx.beginPath();
    ctx.arc(12, -34, 4, 0, Math.PI * 2);
    ctx.fill();

    // Solar Panel Array Deck
    ctx.fillStyle = '#1E3A8A';
    ctx.fillRect(-20, -21, 38, 3);

    // Robotic Drill Arm
    if (rover.isDrilling) {
      ctx.strokeStyle = '#FBBF24';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(18, -10);
      ctx.lineTo(24, 6);
      ctx.stroke();

      // Drilling Dust Sparks
      ctx.fillStyle = '#F59E0B';
      for (let s = 0; s < 5; s++) {
        ctx.fillRect(24 + (Math.random() - 0.5) * 8, 6 + (Math.random() - 0.5) * 4, 2, 2);
      }
    }

    // Rocker-Bogie Suspension & 4 Wheels
    [-18, -6, 6, 18].forEach(wx => {
      ctx.fillStyle = '#1E293B';
      ctx.beginPath();
      ctx.arc(wx, 2, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#94A3B8';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });

    ctx.restore();
  }, [rover]);

  const handlePlantFlag = () => {
    soundEngine.speak('Surface flag planted. Outpost established.');
    setRover(prev => ({
      ...prev,
      flagsPlanted: [...prev.flagsPlanted, { x: prev.posX, label: 'Outpost Alpha', planetId: prev.surfacePlanetId }]
    }));
  };

  const handleStartDrill = () => {
    if (rover.sampleCount >= rover.maxSamples || rover.batteryPercent < 10) return;
    soundEngine.speak('Science drill active. Extracting core regolith sample.');
    setRover(prev => ({ ...prev, isDrilling: true, drillProgress: 0 }));
  };

  return (
    <div ref={containerRef} className="relative flex-1 h-full bg-[#090A0D] overflow-hidden select-none font-mono-num">
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Top Rover Status Dashboard */}
      <div className="absolute top-3 left-3 flex items-center gap-4 bg-[#151820]/85 border border-[#252B36] p-2.5 rounded-xl text-xs shadow-lg backdrop-blur-sm">
        <div className="flex items-center gap-1.5 text-[#55B982]">
          <Battery className="w-4 h-4" />
          <span>{rover.batteryPercent}%</span>
        </div>
        <div className="flex items-center gap-1.5 text-[#FBBF24]">
          <Sun className="w-4 h-4" />
          <span>{rover.solarPowerWatts} W</span>
        </div>
        <div className="flex items-center gap-1.5 text-[#38BDF8]">
          <Disc className="w-4 h-4" />
          <span>Samples: <strong>{rover.sampleCount}/{rover.maxSamples}</strong></span>
        </div>
        <div className="text-[#E6E8EB]">
          Speed: <strong>{rover.vx.toFixed(1)} m/s</strong>
        </div>
      </div>

      {/* Planet Surface Selector */}
      <div className="absolute top-3 right-3 flex items-center gap-1 bg-[#151820]/85 border border-[#252B36] p-1 rounded-lg text-xs shadow-lg">
        {(['moon', 'mars', 'titan'] as const).map(p => (
          <button
            key={p}
            onClick={() => setRover(prev => ({ ...prev, surfacePlanetId: p, posX: 0, flagsPlanted: [] }))}
            className={`px-2.5 py-1 rounded text-[11px] uppercase transition-all ${
              rover.surfacePlanetId === p
                ? 'bg-[#FF8A1F] text-[#090A0D] font-bold'
                : 'text-[#A4ABB6] hover:text-[#E6E8EB]'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Bottom Rover Action Controls */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-[#151820]/90 border border-[#252B36] p-2 rounded-xl shadow-2xl">
        <button
          onMouseDown={() => setInputThrottle(-1.0)}
          onMouseUp={() => setInputThrottle(0)}
          className="p-2 rounded bg-[#1B1F28] hover:bg-[#222733] text-[#E6E8EB] active:scale-95"
          title="Drive Reverse (A)"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <button
          onMouseDown={() => setIsBraking(true)}
          onMouseUp={() => setIsBraking(false)}
          className="px-3 py-1.5 rounded bg-[#D95757]/20 border border-[#D95757]/40 text-[#D95757] font-semibold text-xs active:scale-95"
          title="Handbrake (Space)"
        >
          <Hand className="w-3.5 h-3.5" />
        </button>

        <button
          onMouseDown={() => setInputThrottle(1.0)}
          onMouseUp={() => setInputThrottle(0)}
          className="p-2 rounded bg-[#1B1F28] hover:bg-[#222733] text-[#E6E8EB] active:scale-95"
          title="Drive Forward (D)"
        >
          <ArrowRight className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-5 bg-[#252B36] mx-1" />

        <button
          onClick={handleStartDrill}
          disabled={rover.isDrilling || rover.sampleCount >= rover.maxSamples}
          className="px-3 py-1.5 rounded bg-[#38BDF8]/20 border border-[#38BDF8]/40 text-[#38BDF8] font-semibold text-xs flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
        >
          <Disc className="w-3.5 h-3.5" />
          <span>{rover.isDrilling ? `Drilling ${rover.drillProgress.toFixed(0)}%` : 'Drill Sample'}</span>
        </button>

        <button
          onClick={handlePlantFlag}
          className="px-3 py-1.5 rounded bg-[#FF8A1F] text-[#090A0D] font-bold text-xs flex items-center gap-1.5 active:scale-95"
        >
          <Flag className="w-3.5 h-3.5" />
          <span>Plant Flag</span>
        </button>
      </div>
    </div>
  );
};
