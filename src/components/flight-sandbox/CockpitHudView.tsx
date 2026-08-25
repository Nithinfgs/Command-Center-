import React, { useState, useEffect, useRef } from 'react';
import { useSimulation } from '../../context/SimulationContext';
import { 
  PRESET_STATIONS, 
  stepRendezvousPhysics, 
  type DockingTarget 
} from '../../physics/rendezvous-docking';
import { soundEngine } from '../../audio/soundEngine';
import { 
  Compass, 
  Flame, 
  ShieldAlert, 
  Crosshair, 
  RotateCcw,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';

export const CockpitHudView: React.FC = () => {
  const { flightState } = useSimulation();

  const [dockingTarget, setDockingTarget] = useState<DockingTarget>(PRESET_STATIONS[0]);
  const targetRef = useRef<DockingTarget>(dockingTarget);
  targetRef.current = dockingTarget;

  const rcsInputRef = useRef<{ fx: number; fy: number; fz: number; torque: number }>({
    fx: 0,
    fy: 0,
    fz: 0,
    torque: 0
  });

  const alt = flightState.altitude;
  const speed = flightState.speed;
  const pitch = flightState.pitch;
  const gForce = flightState.gForce;
  const skinTemp = flightState.vehicleSkinTempK || 300;

  // Keyboard 6-DoF RCS Docking Controls (I/K/J/L/H/N and Q/E)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.code === 'KeyI') rcsInputRef.current.fy = 1.5;
      else if (e.code === 'KeyK') rcsInputRef.current.fy = -1.5;
      else if (e.code === 'KeyJ') rcsInputRef.current.fx = -1.5;
      else if (e.code === 'KeyL') rcsInputRef.current.fx = 1.5;
      else if (e.code === 'KeyH') rcsInputRef.current.fz = -1.5;
      else if (e.code === 'KeyN') rcsInputRef.current.fz = 1.5;
      else if (e.code === 'KeyQ') rcsInputRef.current.torque = -1.0;
      else if (e.code === 'KeyE') rcsInputRef.current.torque = 1.0;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['KeyI', 'KeyK'].includes(e.code)) rcsInputRef.current.fy = 0;
      if (['KeyJ', 'KeyL'].includes(e.code)) rcsInputRef.current.fx = 0;
      if (['KeyH', 'KeyN'].includes(e.code)) rcsInputRef.current.fz = 0;
      if (['KeyQ', 'KeyE'].includes(e.code)) rcsInputRef.current.torque = 0;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Clohessy-Wiltshire 6-DoF Physics Stepper
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = Math.min(0.05, (time - lastTime) / 1000);
      lastTime = time;

      const next = stepRendezvousPhysics(
        targetRef.current,
        rcsInputRef.current,
        rcsInputRef.current.torque,
        dt
      );

      if (next.isDocked && !targetRef.current.isDocked) {
        soundEngine.speak('Docking latch confirmed. Hard capture complete. Welcome aboard.');
      }

      setDockingTarget(next);
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  const distance = Math.hypot(dockingTarget.relativePos.x, dockingTarget.relativePos.y, dockingTarget.relativePos.z);
  const closingRate = Math.hypot(dockingTarget.relativeVel.vx, dockingTarget.relativeVel.vy, dockingTarget.relativeVel.vz);

  // Crosshair pixel offsets
  const crosshairOffsetX = Math.max(-120, Math.min(120, dockingTarget.relativePos.x * 2));
  const crosshairOffsetY = Math.max(-120, Math.min(120, -dockingTarget.relativePos.y * 2));

  return (
    <div className="relative flex-1 h-full bg-[#05070A] overflow-hidden select-none font-mono-num text-[#E6E8EB] flex items-center justify-center">
      {/* Cockpit Canopy Window Frame */}
      <div className="absolute inset-0 border-[24px] border-[#0E1015] pointer-events-none z-30 shadow-inner">
        <div className="absolute inset-0 border-2 border-[#252B36] rounded-2xl opacity-40" />
      </div>

      {/* Atmospheric Re-Entry Thermal Glow */}
      {skinTemp > 900 && (
        <div 
          className="absolute inset-0 pointer-events-none z-20 transition-opacity duration-300"
          style={{
            background: 'radial-gradient(circle, rgba(244,63,94,0) 50%, rgba(244,63,94,0.35) 100%)',
            opacity: Math.min(1, (skinTemp - 900) / 2000)
          }}
        />
      )}

      {/* Center Primary Flight Display (PFD) Artificial Horizon */}
      <div className="relative w-[340px] h-[340px] rounded-full border-2 border-[#38BDF8]/40 flex items-center justify-center overflow-hidden bg-[#0A101D]/60 shadow-2xl">
        {/* Pitch Ladder */}
        <div 
          className="absolute w-full h-[600px] flex flex-col items-center justify-center transition-transform duration-75"
          style={{ transform: `translateY(${(pitch - 45) * 4}px)` }}
        >
          <div className="w-full h-1/2 bg-[#1E3A8A]/30 border-b-2 border-[#38BDF8]" />
          <div className="w-full h-1/2 bg-[#78350F]/30" />

          {[90, 75, 60, 45, 30, 15, 0].map(deg => (
            <div key={deg} className="absolute flex items-center gap-2 text-[10px] text-[#38BDF8]" style={{ top: `${(90 - deg) * 6}px` }}>
              <div className="w-6 h-[1px] bg-[#38BDF8]" />
              <span>{deg}°</span>
              <div className="w-6 h-[1px] bg-[#38BDF8]" />
            </div>
          ))}
        </div>

        {/* Dynamic Rendezvous Target Docking Crosshair */}
        <div 
          className="absolute z-20 pointer-events-none transition-transform duration-75 flex flex-col items-center"
          style={{ transform: `translate(${crosshairOffsetX}px, ${crosshairOffsetY}px)` }}
        >
          <div className={`w-8 h-8 rounded-full border-2 ${dockingTarget.isDocked ? 'border-[#55B982] bg-[#55B982]/20' : 'border-[#38BDF8]'} flex items-center justify-center animate-pulse`}>
            <div className="w-1.5 h-1.5 rounded-full bg-[#38BDF8]" />
          </div>
          <span className="text-[9px] text-[#38BDF8] mt-1 font-bold">
            {dockingTarget.isDocked ? 'CAPTURED' : `${distance.toFixed(1)}m`}
          </span>
        </div>

        {/* Fixed Waterline Reticle */}
        <div className="absolute z-10 flex items-center gap-2 pointer-events-none">
          <div className="w-8 h-[2px] bg-[#FF8A1F]" />
          <div className="w-3 h-3 rounded-full border-2 border-[#FF8A1F]" />
          <div className="w-8 h-[2px] bg-[#FF8A1F]" />
        </div>
      </div>

      {/* Left Speed Tape */}
      <div className="absolute left-10 top-1/2 -translate-y-1/2 bg-[#0E1015]/90 border border-[#252B36] p-3 rounded-xl w-24 text-center space-y-1 shadow-xl">
        <span className="text-[10px] text-[#69717E] uppercase block">Airspeed</span>
        <div className="text-base font-bold text-[#38BDF8]">{Math.round(speed)}</div>
        <span className="text-[10px] text-[#A4ABB6]">m/s</span>
        <div className="text-[10px] text-[#FF8A1F] border-t border-[#252B36] pt-1">
          M {(speed / 340).toFixed(2)}
        </div>
      </div>

      {/* Right Altitude Tape */}
      <div className="absolute right-10 top-1/2 -translate-y-1/2 bg-[#0E1015]/90 border border-[#252B36] p-3 rounded-xl w-28 text-center space-y-1 shadow-xl">
        <span className="text-[10px] text-[#69717E] uppercase block">Altitude</span>
        <div className="text-base font-bold text-[#55B982]">
          {alt >= 1000 ? `${(alt / 1000).toFixed(2)}` : Math.round(alt)}
        </div>
        <span className="text-[10px] text-[#A4ABB6]">{alt >= 1000 ? 'km' : 'm'}</span>
        <div className="text-[10px] text-[#79AFC1] border-t border-[#252B36] pt-1">
          VS: {Math.round(flightState.velocity.vy)} m/s
        </div>
      </div>

      {/* Top Telemetry Annunciator Bar */}
      <div className="absolute top-8 flex items-center gap-6 bg-[#0E1015]/90 border border-[#252B36] px-5 py-2 rounded-xl text-xs shadow-xl">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-[#FF8A1F]" />
          <span>Pitch: <strong>{pitch}°</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-[#E6B84D]" />
          <span>G-Force: <strong>{gForce.toFixed(2)} G</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-[#D95757]" />
          <span>Skin Temp: <strong>{Math.round(skinTemp)} K</strong></span>
        </div>
      </div>

      {/* Bottom Interactive Clohessy-Wiltshire 6-DoF Docking Dashboard */}
      <div className="absolute bottom-8 flex items-center gap-5 bg-[#0E1015]/95 border border-[#252B36] p-3 rounded-2xl text-xs shadow-2xl">
        <div className="flex items-center gap-2">
          <Crosshair className="w-5 h-5 text-[#38BDF8]" />
          <div>
            <span className="font-bold text-[#E6E8EB] block text-xs">
              {dockingTarget.isDocked ? 'DOCKING CAPTURE CONFIRMED' : 'CLOHESSY-WILTSHIRE RENDEZVOUS'}
            </span>
            <span className="text-[10px] text-[#A4ABB6]">
              Target: <strong className="text-[#38BDF8]">{dockingTarget.name}</strong> ({dockingTarget.orbitAltitudeKm} km)
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-[11px] bg-[#151820] p-2 rounded-xl border border-[#252B36]">
          <div>
            <span className="text-[#69717E] block text-[10px]">Range:</span>
            <strong className={distance < 5 ? 'text-[#55B982]' : 'text-[#E6E8EB]'}>
              {distance.toFixed(1)} m
            </strong>
          </div>
          <div>
            <span className="text-[#69717E] block text-[10px]">Closing Rate:</span>
            <strong className={closingRate < 0.5 ? 'text-[#55B982]' : 'text-[#E6B84D]'}>
              {closingRate.toFixed(2)} m/s
            </strong>
          </div>
          <div>
            <span className="text-[#69717E] block text-[10px]">Alignment Error:</span>
            <strong className={Math.abs(dockingTarget.alignmentAngleDeg) < 5 ? 'text-[#55B982]' : 'text-[#D95757]'}>
              {dockingTarget.alignmentAngleDeg.toFixed(1)}°
            </strong>
          </div>
        </div>

        {/* 6-DoF RCS Translation Pad */}
        <div className="flex items-center gap-1.5">
          <button
            onMouseDown={() => { rcsInputRef.current.fx = -1.5; }}
            onMouseUp={() => { rcsInputRef.current.fx = 0; }}
            className="p-1.5 rounded bg-[#1B1F28] hover:bg-[#252B36] text-[#A4ABB6] hover:text-[#E6E8EB] active:scale-95"
            title="RCS Translate Left (J)"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <div className="flex flex-col gap-1">
            <button
              onMouseDown={() => { rcsInputRef.current.fy = 1.5; }}
              onMouseUp={() => { rcsInputRef.current.fy = 0; }}
              className="p-1.5 rounded bg-[#1B1F28] hover:bg-[#252B36] text-[#A4ABB6] hover:text-[#E6E8EB] active:scale-95"
              title="RCS Translate Up (I)"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <button
              onMouseDown={() => { rcsInputRef.current.fy = -1.5; }}
              onMouseUp={() => { rcsInputRef.current.fy = 0; }}
              className="p-1.5 rounded bg-[#1B1F28] hover:bg-[#252B36] text-[#A4ABB6] hover:text-[#E6E8EB] active:scale-95"
              title="RCS Translate Down (K)"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
          </div>
          <button
            onMouseDown={() => { rcsInputRef.current.fx = 1.5; }}
            onMouseUp={() => { rcsInputRef.current.fx = 0; }}
            className="p-1.5 rounded bg-[#1B1F28] hover:bg-[#252B36] text-[#A4ABB6] hover:text-[#E6E8EB] active:scale-95"
            title="RCS Translate Right (L)"
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Target Switcher */}
        <select
          value={dockingTarget.id}
          onChange={(e) => {
            const found = PRESET_STATIONS.find(s => s.id === e.target.value);
            if (found) setDockingTarget(found);
          }}
          className="bg-[#151820] border border-[#252B36] text-[#E6E8EB] p-1.5 rounded-lg text-[11px] cursor-pointer"
        >
          {PRESET_STATIONS.map(s => (
            <option key={s.id} value={s.id}>{s.name.split(' ')[0]}</option>
          ))}
        </select>

        <button
          onClick={() => {
            const found = PRESET_STATIONS.find(s => s.id === dockingTarget.id) || PRESET_STATIONS[0];
            setDockingTarget({ ...found, isDocked: false });
          }}
          className="p-1.5 rounded-lg text-[#A4ABB6] hover:text-[#E6E8EB] hover:bg-[#1B1F28]"
          title="Reset Rendezvous Distance"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
