import React from 'react';
import { useSimulation } from '../../context/SimulationContext';
import { Compass, Flame, ShieldAlert, Crosshair } from 'lucide-react';

export const CockpitHudView: React.FC = () => {
  const { flightState } = useSimulation();

  const alt = flightState.altitude;
  const speed = flightState.speed;
  const pitch = flightState.pitch;
  const gForce = flightState.gForce;
  const skinTemp = flightState.vehicleSkinTempK || 300;

  return (
    <div className="relative flex-1 h-full bg-[#05070A] overflow-hidden select-none font-mono-num text-[#E6E8EB] flex items-center justify-center">
      {/* Cockpit Canopy Window Frame & Rivets */}
      <div className="absolute inset-0 border-[24px] border-[#0E1015] pointer-events-none z-30 shadow-inner">
        <div className="absolute inset-0 border-2 border-[#252B36] rounded-2xl opacity-40" />
      </div>

      {/* Atmospheric Re-Entry Thermal Glow Vignette */}
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
          {/* Blue Sky / Ground Horizon Split */}
          <div className="w-full h-1/2 bg-[#1E3A8A]/30 border-b-2 border-[#38BDF8]" />
          <div className="w-full h-1/2 bg-[#78350F]/30" />

          {/* Pitch Degree Ticks */}
          {[90, 75, 60, 45, 30, 15, 0].map(deg => (
            <div key={deg} className="absolute flex items-center gap-2 text-[10px] text-[#38BDF8]" style={{ top: `${(90 - deg) * 6}px` }}>
              <div className="w-6 h-[1px] bg-[#38BDF8]" />
              <span>{deg}°</span>
              <div className="w-6 h-[1px] bg-[#38BDF8]" />
            </div>
          ))}
        </div>

        {/* Fixed Aircraft Waterline Reticle */}
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

      {/* Bottom Docking Alignment Radar */}
      <div className="absolute bottom-8 flex items-center gap-4 bg-[#0E1015]/90 border border-[#252B36] px-4 py-2 rounded-xl text-xs shadow-xl">
        <Crosshair className="w-4 h-4 text-[#38BDF8]" />
        <span>Rendezvous Radar: <strong className="text-[#55B982]">LOCKED (ISS Core)</strong></span>
        <span className="text-[#A4ABB6] text-[11px]">Range: <strong>120 m</strong> | Closing: <strong>-1.2 m/s</strong></span>
      </div>
    </div>
  );
};
