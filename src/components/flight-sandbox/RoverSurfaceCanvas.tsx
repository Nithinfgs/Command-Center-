import React, { useRef, useState, useEffect } from 'react';
import { 
  stepRoverPhysics, 
  getTerrainElevation, 
  ROVER_MISSIONS,
  type PlanetaryRoverState,
  type RoverMissionLevel 
} from '../../physics/rover-physics';
import { soundEngine } from '../../audio/soundEngine';
import { 
  Battery, 
  Sun, 
  Flag, 
  Disc, 
  ArrowLeft, 
  ArrowRight, 
  Hand, 
  RotateCcw, 
  Trophy, 
  Clock, 
  XCircle,
  Play
} from 'lucide-react';

const PPM = 8.0; // Pixels per meter

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

  const [activeMission, setActiveMission] = useState<RoverMissionLevel | null>(ROVER_MISSIONS[0]);
  const [missionTimer, setMissionTimer] = useState<number>(ROVER_MISSIONS[0].timeLimitSec);
  const [missionState, setMissionState] = useState<'playing' | 'victory' | 'failed'>('playing');

  const initialElevation = getTerrainElevation(0, activeMission ? activeMission.planetId : 'mars').elevation;

  const roverRef = useRef<PlanetaryRoverState>({
    posX: 0,
    altitude: initialElevation,
    vx: 0,
    vy: 0,
    pitchDeg: 0,
    batteryPercent: 100,
    solarPowerWatts: 140,
    sampleCount: 0,
    maxSamples: activeMission ? activeMission.requiredSamples : 5,
    flagsPlanted: [],
    isDrilling: false,
    drillProgress: 0,
    surfacePlanetId: activeMission ? activeMission.planetId : 'mars'
  });

  const [uiRover, setUiRover] = useState<PlanetaryRoverState>(roverRef.current);
  const throttleInputRef = useRef<number>(0);
  const isBrakingRef = useRef<boolean>(false);
  const dustParticlesRef = useRef<DustParticle[]>([]);

  // Select Level / Free Roam
  const startLevel = (mission: RoverMissionLevel | null) => {
    setActiveMission(mission);
    setMissionState('playing');
    const planet = mission ? mission.planetId : 'mars';
    const el = getTerrainElevation(0, planet).elevation;

    roverRef.current = {
      posX: 0,
      altitude: el,
      vx: 0,
      vy: 0,
      pitchDeg: 0,
      batteryPercent: 100,
      solarPowerWatts: planet === 'moon' ? 240 : planet === 'mars' ? 140 : 50,
      sampleCount: 0,
      maxSamples: mission ? mission.requiredSamples : 5,
      flagsPlanted: [],
      isDrilling: false,
      drillProgress: 0,
      surfacePlanetId: planet
    };

    setMissionTimer(mission ? mission.timeLimitSec : 999);
    setUiRover({ ...roverRef.current });
    if (mission) {
      soundEngine.speak(`Mission started: ${mission.title}`);
    }
  };

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

  // Mission Timer countdown loop
  useEffect(() => {
    if (!activeMission || missionState !== 'playing') return;

    const timerInterval = setInterval(() => {
      setMissionTimer(prev => {
        if (prev <= 1) {
          setMissionState('failed');
          soundEngine.speak('Mission failed. Time limit expired.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [activeMission, missionState]);

  // Check Victory Condition
  useEffect(() => {
    if (!activeMission || missionState !== 'playing') return;

    const hasEnoughSamples = uiRover.sampleCount >= activeMission.requiredSamples;
    const hasReachedOutpost = uiRover.posX >= activeMission.outpostTargetX - 10;
    const hasPlantedFlag = uiRover.flagsPlanted.length > 0;

    if (hasEnoughSamples && hasReachedOutpost && hasPlantedFlag) {
      setMissionState('victory');
      soundEngine.speak('Mission accomplished! All planetary science objectives completed.');
    }
  }, [uiRover, activeMission, missionState]);

  // 60 FPS Physics & Canvas Render Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();
    let uiCounter = 0;

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
      if (missionState !== 'victory' && missionState !== 'failed') {
        roverRef.current = stepRoverPhysics(
          roverRef.current,
          throttleInputRef.current,
          isBrakingRef.current,
          dt
        );
      }

      const currentRover = roverRef.current;

      // 2. Spawn Tire Dust Particles
      if (Math.abs(currentRover.vx) > 0.4 && Math.random() < 0.65) {
        const dir = currentRover.vx > 0 ? -1 : 1;
        dustParticlesRef.current.push({
          x: currentRover.posX + (dir * 2.2),
          y: currentRover.altitude - 0.5,
          vx: dir * (1.5 + Math.random() * 2),
          vy: 0.8 + Math.random() * 1.5,
          alpha: 0.8,
          size: Math.max(1, 2 + Math.random() * 3)
        });
      }

      dustParticlesRef.current.forEach(p => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.alpha -= dt * 1.2;
      });
      dustParticlesRef.current = dustParticlesRef.current.filter(p => p.alpha > 0.05);

      // React UI state sync
      uiCounter++;
      if (uiCounter % 4 === 0) {
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

      // Sky Background
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

      // Parallax Distant Mountains
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

      // Foreground Terrain Profile
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

      // Ridge Highlight
      ctx.strokeStyle = currentRover.surfacePlanetId === 'mars' ? '#F43F5E' : currentRover.surfacePlanetId === 'moon' ? '#94A3B8' : '#10B981';
      ctx.lineWidth = 3.0;
      ctx.stroke();

      // Surface Rocks
      const minRockWorldX = Math.floor(currentRover.posX - (viewCenterX / PPM) - 10);
      const maxRockWorldX = Math.ceil(currentRover.posX + (viewCenterX / PPM) + 10);

      ctx.fillStyle = currentRover.surfacePlanetId === 'mars' ? '#4C0519' : currentRover.surfacePlanetId === 'moon' ? '#1E293B' : '#022C22';
      ctx.strokeStyle = currentRover.surfacePlanetId === 'mars' ? '#FB7185' : '#CBD5E1';
      ctx.lineWidth = 1;

      for (let rx = minRockWorldX; rx <= maxRockWorldX; rx += 4) {
        const hash = Math.sin(rx * 997.13) * 10000;
        const hasRock = (hash - Math.floor(hash)) > 0.45;
        if (!hasRock) continue;

        const rockScreenX = viewCenterX + (rx - currentRover.posX) * PPM;
        const { elevation } = getTerrainElevation(rx, currentRover.surfacePlanetId);
        const rockScreenY = groundBaseY - elevation * PPM;

        const rockRadius = Math.max(1.5, 2.5 + Math.abs((hash * 13) % 4));
        ctx.beginPath();
        ctx.arc(rockScreenX, rockScreenY + 1, rockRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      // Mission Science Anomaly Beacons (Glowing Hologram Pillars)
      if (activeMission) {
        activeMission.anomalySites.forEach((siteX, idx) => {
          const beaconScreenX = viewCenterX + (siteX - currentRover.posX) * PPM;
          if (beaconScreenX > -60 && beaconScreenX < width + 60) {
            const { elevation } = getTerrainElevation(siteX, activeMission.planetId);
            const beaconScreenY = groundBaseY - elevation * PPM;

            // Holographic Vertical Light Column
            const colGrad = ctx.createLinearGradient(beaconScreenX, beaconScreenY, beaconScreenX, beaconScreenY - 80);
            colGrad.addColorStop(0, 'rgba(56, 189, 248, 0.7)');
            colGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
            ctx.fillStyle = colGrad;
            ctx.fillRect(beaconScreenX - 8, beaconScreenY - 80, 16, 80);

            // Floating Diamond Anomaly Icon
            const floatY = Math.sin(time * 0.005 + idx) * 6;
            ctx.save();
            ctx.translate(beaconScreenX, beaconScreenY - 45 + floatY);
            ctx.fillStyle = '#38BDF8';
            ctx.beginPath();
            ctx.moveTo(0, -9);
            ctx.lineTo(8, 0);
            ctx.lineTo(0, 9);
            ctx.lineTo(-8, 0);
            ctx.closePath();
            ctx.fill();
            ctx.restore();

            ctx.fillStyle = '#E0F2FE';
            ctx.font = 'bold 9px sans-serif';
            ctx.fillText(`ANOMALY #${idx + 1}`, beaconScreenX - 25, beaconScreenY - 60);
          }
        });

        // Target Outpost Finish Line Flagpole Marker
        const targetScreenX = viewCenterX + (activeMission.outpostTargetX - currentRover.posX) * PPM;
        if (targetScreenX > -80 && targetScreenX < width + 80) {
          const { elevation } = getTerrainElevation(activeMission.outpostTargetX, activeMission.planetId);
          const targetScreenY = groundBaseY - elevation * PPM;

          // Outpost Holo Dome Target
          ctx.strokeStyle = '#55B982';
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.arc(targetScreenX, targetScreenY, 35, Math.PI, 0);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.fillStyle = '#55B982';
          ctx.font = 'bold 10px sans-serif';
          ctx.fillText('OUTPOST BASE TARGET', targetScreenX - 55, targetScreenY - 45);
        }
      }

      // Planted Flags
      currentRover.flagsPlanted.forEach(flag => {
        const flagScreenX = viewCenterX + (flag.x - currentRover.posX) * PPM;
        if (flagScreenX > -50 && flagScreenX < width + 50) {
          const { elevation } = getTerrainElevation(flag.x, flag.planetId);
          const flagScreenY = groundBaseY - elevation * PPM;

          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(flagScreenX, flagScreenY);
          ctx.lineTo(flagScreenX, flagScreenY - 38);
          ctx.stroke();

          ctx.fillStyle = '#FF8A1F';
          ctx.fillRect(flagScreenX, flagScreenY - 38, 26, 16);
          ctx.fillStyle = '#090A0D';
          ctx.font = 'bold 9px sans-serif';
          ctx.fillText('BASE', flagScreenX + 3, flagScreenY - 26);
        }
      });

      // Tire Dust Particles
      dustParticlesRef.current.forEach(p => {
        const px = viewCenterX + (p.x - currentRover.posX) * PPM;
        const py = groundBaseY - p.y * PPM;
        ctx.fillStyle = currentRover.surfacePlanetId === 'mars' 
          ? `rgba(244, 63, 94, ${p.alpha})` 
          : `rgba(203, 213, 225, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(px, py, Math.max(1, p.size), 0, Math.PI * 2);
        ctx.fill();
      });

      // Rover Vehicle Chassis & Articulated Rocker-Bogie Suspension
      const roverScreenY = groundBaseY - currentRover.altitude * PPM;

      // 1. Calculate individual wheel terrain contact points for rocker-bogie multi-body kinematics
      const wheelOffsets = [-22, -8, 8, 22];
      const wheelContacts = wheelOffsets.map(wx => {
        const worldX = currentRover.posX + wx / PPM;
        const { elevation } = getTerrainElevation(worldX, currentRover.surfacePlanetId);
        const wy = groundBaseY - elevation * PPM;
        return { wx, wy: Math.min(roverScreenY + 12, wy) };
      });

      // 2. Draw Articulated Rocker-Bogie Linkages
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Rear Bogie Link (between wheel 0 and wheel 1)
      ctx.beginPath();
      ctx.moveTo(viewCenterX + wheelContacts[0].wx, wheelContacts[0].wy);
      ctx.lineTo(viewCenterX + (wheelContacts[0].wx + wheelContacts[1].wx) / 2, roverScreenY - 4);
      ctx.lineTo(viewCenterX + wheelContacts[1].wx, wheelContacts[1].wy);
      ctx.stroke();

      // Main Rocker Link (from rear bogie pivot to front wheel 3)
      const rearBogiePivotX = viewCenterX + (wheelContacts[0].wx + wheelContacts[1].wx) / 2;
      const rearBogiePivotY = roverScreenY - 4;
      const mainChassisPivotX = viewCenterX;
      const mainChassisPivotY = roverScreenY - 8;

      ctx.strokeStyle = '#64748B';
      ctx.beginPath();
      ctx.moveTo(rearBogiePivotX, rearBogiePivotY);
      ctx.lineTo(mainChassisPivotX, mainChassisPivotY);
      ctx.lineTo(viewCenterX + wheelContacts[3].wx, wheelContacts[3].wy);
      ctx.stroke();

      // Intermediate Front Bogie Link (wheel 2)
      ctx.beginPath();
      ctx.moveTo(mainChassisPivotX + 6, mainChassisPivotY);
      ctx.lineTo(viewCenterX + wheelContacts[2].wx, wheelContacts[2].wy);
      ctx.stroke();

      // 3. Draw 4 Independent Wheels with Rotating Spokes
      const wheelRadius = 8.0;
      const wheelRotation = (currentRover.posX * PPM) / wheelRadius;

      wheelContacts.forEach((wc) => {
        ctx.save();
        ctx.translate(viewCenterX + wc.wx, wc.wy);
        ctx.rotate(wheelRotation);

        // Outer Rubber Tread
        ctx.fillStyle = '#0F172A';
        ctx.beginPath();
        ctx.arc(0, 0, wheelRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#94A3B8';
        ctx.lineWidth = 2.0;
        ctx.stroke();

        // 4 Spoke Crosshairs
        ctx.strokeStyle = '#F8FAFC';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(-wheelRadius + 1, 0);
        ctx.lineTo(wheelRadius - 1, 0);
        ctx.moveTo(0, -wheelRadius + 1);
        ctx.lineTo(0, wheelRadius - 1);
        ctx.stroke();

        // Hubcap Axle Pin
        ctx.fillStyle = '#FF8A1F';
        ctx.beginPath();
        ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      });

      // 4. Draw Rover Chassis Body on Top of Differential Suspension
      ctx.save();
      ctx.translate(viewCenterX, roverScreenY);
      ctx.rotate((currentRover.pitchDeg * Math.PI) / 180);

      // Chassis Body
      ctx.fillStyle = '#F1F5F9';
      ctx.fillRect(-28, -20, 56, 16);
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(-28, -20, 56, 16);

      // Insignia
      ctx.fillStyle = '#FF8A1F';
      ctx.fillRect(-18, -17, 16, 6);

      // Mastcam Sensor Head
      ctx.fillStyle = '#475569';
      ctx.fillRect(12, -36, 5, 16);
      ctx.fillStyle = '#38BDF8';
      ctx.beginPath();
      ctx.arc(14.5, -38, 4.5, 0, Math.PI * 2);
      ctx.fill();

      // Solar Panel Deck
      ctx.fillStyle = '#1E3A8A';
      ctx.fillRect(-26, -24, 52, 4);

      // Drill Arm
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

      ctx.restore();
      ctx.restore();
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [activeMission, missionState]);

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

  return (
    <div ref={containerRef} className="relative flex-1 h-full bg-[#090A0D] overflow-hidden select-none font-mono-num">
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Top Left: Rover Telemetry Dashboard */}
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

      {/* Top Center: Mission Level HUD & Countdown Clock */}
      {activeMission && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-[#151820]/95 border border-[#38BDF8]/40 p-2.5 rounded-xl text-xs shadow-2xl backdrop-blur-md flex items-center gap-5">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-[#FF8A1F]" />
            <div>
              <span className="font-bold text-[#E6E8EB] block text-xs">{activeMission.title}</span>
              <span className="text-[10px] text-[#A4ABB6]">{activeMission.hazard}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-[#0E1015] px-2.5 py-1 rounded-lg border border-[#252B36]">
            <Clock className={`w-3.5 h-3.5 ${missionTimer < 15 ? 'text-[#D95757] animate-pulse' : 'text-[#79AFC1]'}`} />
            <span className={`font-bold font-mono-num ${missionTimer < 15 ? 'text-[#D95757]' : 'text-[#E6E8EB]'}`}>
              {missionTimer}s
            </span>
          </div>

          <div className="text-[11px] text-[#CBD5E1]">
            Target Outpost: <strong>{Math.max(0, Math.round(activeMission.outpostTargetX - uiRover.posX))}m ahead</strong>
          </div>
        </div>
      )}

      {/* Top Right: Mission Levels & Free Roam Switcher */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-[#151820]/90 border border-[#252B36] p-1.5 rounded-xl text-xs shadow-xl">
        <button
          onClick={() => startLevel(null)}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
            !activeMission ? 'bg-[#FF8A1F] text-[#090A0D]' : 'text-[#A4ABB6] hover:text-[#E6E8EB]'
          }`}
        >
          Free Roam
        </button>

        {ROVER_MISSIONS.map((m, idx) => (
          <button
            key={m.id}
            onClick={() => startLevel(m)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeMission?.id === m.id
                ? 'bg-[#FF8A1F] text-[#090A0D] shadow-sm'
                : 'text-[#A4ABB6] hover:text-[#E6E8EB] hover:bg-[#1B1F28]'
            }`}
          >
            Lvl {idx + 1}
          </button>
        ))}

        <button
          onClick={() => startLevel(activeMission)}
          className="p-1.5 rounded-lg text-[#A4ABB6] hover:text-[#E6E8EB] hover:bg-[#1B1F28] ml-1"
          title="Restart Mission"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Bottom Rover Action & Drive Controls */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-[#151820]/95 border border-[#252B36] p-2.5 rounded-2xl shadow-2xl backdrop-blur-md z-20">
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

      {/* Mission Victory Modal */}
      {missionState === 'victory' && activeMission && (
        <div className="absolute inset-0 bg-[#090A0D]/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#151820] border border-[#55B982] rounded-2xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="w-14 h-14 rounded-full bg-[#55B982]/20 border border-[#55B982] flex items-center justify-center mx-auto text-[#55B982]">
              <Trophy className="w-7 h-7" />
            </div>

            <div>
              <span className="text-[11px] text-[#55B982] font-bold uppercase tracking-wider block">Mission Accomplished!</span>
              <h2 className="text-base font-bold text-[#E6E8EB] mt-1">{activeMission.title}</h2>
              <p className="text-xs text-[#A4ABB6] mt-2">
                All geological science drill cores extracted and outpost successfully established.
              </p>
            </div>

            <div className="bg-[#0E1015] p-3 rounded-xl border border-[#252B36] space-y-1.5 text-xs text-left">
              <div className="flex justify-between">
                <span className="text-[#A4ABB6]">Award:</span>
                <strong className="text-[#FF8A1F]">{activeMission.rewardBadge}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A4ABB6]">Samples Collected:</span>
                <strong className="text-[#38BDF8]">{uiRover.sampleCount}/{activeMission.requiredSamples}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A4ABB6]">Time Remaining:</span>
                <strong className="text-[#55B982]">{missionTimer}s</strong>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  const currIdx = ROVER_MISSIONS.findIndex(m => m.id === activeMission.id);
                  if (currIdx < ROVER_MISSIONS.length - 1) {
                    startLevel(ROVER_MISSIONS[currIdx + 1]);
                  } else {
                    startLevel(null);
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#55B982] hover:bg-[#62C991] text-[#090A0D] font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Next Mission Level</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mission Failed Modal */}
      {missionState === 'failed' && activeMission && (
        <div className="absolute inset-0 bg-[#090A0D]/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#151820] border border-[#D95757] rounded-2xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="w-14 h-14 rounded-full bg-[#D95757]/20 border border-[#D95757] flex items-center justify-center mx-auto text-[#D95757]">
              <XCircle className="w-7 h-7" />
            </div>

            <div>
              <span className="text-[11px] text-[#D95757] font-bold uppercase tracking-wider block">Mission Incomplete</span>
              <h2 className="text-base font-bold text-[#E6E8EB] mt-1">{activeMission.title}</h2>
              <p className="text-xs text-[#A4ABB6] mt-2">
                Time limit expired before reaching the target outpost or collecting required samples.
              </p>
            </div>

            <button
              onClick={() => startLevel(activeMission)}
              className="w-full py-2.5 rounded-xl bg-[#FF8A1F] hover:bg-[#FFA24A] text-[#090A0D] font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry Mission</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
