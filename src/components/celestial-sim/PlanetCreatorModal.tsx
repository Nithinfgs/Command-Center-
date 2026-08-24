import React, { useState } from 'react';
import { X, Globe, Sparkles } from 'lucide-react';
import { useSimulation } from '../../context/SimulationContext';
import type { CelestialBodyType } from '../../types';
import { SIM_G } from '../../physics/n-body';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const PlanetCreatorModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { addCustomCelestialBody, celestialBodies, selectedBodyId } = useSimulation();

  const [name, setName] = useState('New Exoplanet Proxima-X');
  const [type, setType] = useState<CelestialBodyType>('terrestrial');
  const [massExponent, setMassExponent] = useState(24.8);
  const [radiusKm, setRadiusKm] = useState(6400);
  const [color, setColor] = useState('#38bdf8');
  const [secondaryColor, setSecondaryColor] = useState('#10b981');
  const [hasRings, setHasRings] = useState(false);
  const [ringColor, setRingColor] = useState('#d97706');
  const [atmosphereDensity, setAtmosphereDensity] = useState(1.0);
  const [isFixed] = useState(false);

  const [distanceFromCenter, setDistanceFromCenter] = useState(400);
  const [inclinationAngle] = useState(0);

  if (!isOpen) return null;

  const massKg = Math.pow(10, massExponent);
  const density = parseFloat(((massKg / ((4 / 3) * Math.PI * Math.pow(radiusKm * 1000, 3))) / 1000).toFixed(2));

  const primary = celestialBodies.find(b => b.id === (selectedBodyId || 'sun')) || celestialBodies[0];
  const centralMass = primary ? primary.mass : 1.989e30;
  const centralMassFactor = Math.log10(Math.max(1e20, centralMass)) / 30;
  const vCirc = Math.sqrt((SIM_G * centralMassFactor) / Math.max(10, distanceFromCenter));

  const handleCreate = () => {
    const radInc = (inclinationAngle * Math.PI) / 180;
    const posX = distanceFromCenter * Math.cos(radInc);
    const posY = distanceFromCenter * Math.sin(radInc);
    const posZ = 0;

    const velX = 0;
    const velY = 0;
    const velZ = -vCirc;

    addCustomCelestialBody({
      name,
      type,
      mass: massKg,
      radius: radiusKm,
      density: isNaN(density) || density <= 0 ? 5.5 : density,
      position: { x: posX, y: posY, z: posZ },
      velocity: { vx: velX, vy: velY, vz: velZ },
      color,
      secondaryColor,
      hasRings,
      ringRadiusMin: radiusKm * 0.02,
      ringRadiusMax: radiusKm * 0.04,
      ringColor,
      atmosphereDensity,
      atmosphereColor: '#60a5fa',
      isFixed
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0d1422] border border-[#1e293b] rounded-lg max-w-xl w-full p-5 shadow-2xl font-mono text-xs max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-[#1e293b]">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#38bdf8]" />
            <span className="font-bold text-slate-100 text-sm uppercase">CELESTIAL FORGE - CREATE BODY</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 my-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 text-[10px] uppercase font-bold block mb-1">Body Designation</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-[#080c14] border border-[#1e293b] rounded px-3 py-1.5 text-slate-200 focus:outline-none focus:border-[#38bdf8]"
              />
            </div>
            <div>
              <label className="text-slate-400 text-[10px] uppercase font-bold block mb-1">Classification</label>
              <select
                value={type}
                onChange={e => setType(e.target.value as CelestialBodyType)}
                className="w-full bg-[#080c14] border border-[#1e293b] rounded px-3 py-1.5 text-slate-200 focus:outline-none focus:border-[#38bdf8]"
              >
                <option value="terrestrial">Terrestrial Planet</option>
                <option value="ocean">Ocean World</option>
                <option value="rocky">Rocky Barren Moon</option>
                <option value="gas_giant">Gas Giant</option>
                <option value="ice_giant">Ice Giant</option>
                <option value="star">Luminous Star</option>
                <option value="black_hole">Black Hole Singularity</option>
              </select>
            </div>
          </div>

          <div className="bg-[#080c14] border border-[#1e293b] rounded p-3 space-y-3">
            <div>
              <div className="flex justify-between text-slate-300 font-bold mb-1">
                <span>PLANETARY MASS (10^{massExponent.toFixed(1)} kg)</span>
                <span className="text-[#38bdf8]">
                  {massKg < 1e25 ? `${(massKg / 1e24).toFixed(2)} M_Earth` : `${(massKg / 1.989e30).toFixed(4)} M_Sun`}
                </span>
              </div>
              <input
                type="range"
                min="20"
                max="30.5"
                step="0.1"
                value={massExponent}
                onChange={e => setMassExponent(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 font-bold mb-1">
                <span>VOLUMETRIC RADIUS</span>
                <span className="text-amber-400">{radiusKm.toLocaleString()} km</span>
              </div>
              <input
                type="range"
                min="500"
                max="100000"
                step="500"
                value={radiusKm}
                onChange={e => setRadiusKm(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 text-[10px] uppercase font-bold block mb-1">Primary Surface Tint</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={color}
                  onChange={e => setColor(e.target.value)}
                  className="w-8 h-8 rounded border border-[#1e293b] cursor-pointer bg-transparent"
                />
                <span className="text-slate-300 font-bold">{color}</span>
              </div>
            </div>

            <div>
              <label className="text-slate-400 text-[10px] uppercase font-bold block mb-1">Secondary Feature Tint</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={e => setSecondaryColor(e.target.value)}
                  className="w-8 h-8 rounded border border-[#1e293b] cursor-pointer bg-transparent"
                />
                <span className="text-slate-300 font-bold">{secondaryColor}</span>
              </div>
            </div>
          </div>

          <div className="bg-[#080c14] border border-[#1e293b] rounded p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-slate-300 font-bold">ATMOSPHERE ENVELOPE</label>
              <span className="text-cyan-400 font-bold">{atmosphereDensity.toFixed(2)} atm</span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              step="0.1"
              value={atmosphereDensity}
              onChange={e => setAtmosphereDensity(parseFloat(e.target.value))}
              className="w-full"
            />

            <div className="flex items-center justify-between pt-2 border-t border-[#1e293b]">
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasRings}
                  onChange={e => setHasRings(e.target.checked)}
                  className="rounded border-[#1e293b] text-[#38bdf8]"
                />
                <span>Generate Planetary Ring System</span>
              </label>

              {hasRings && (
                <input
                  type="color"
                  value={ringColor}
                  onChange={e => setRingColor(e.target.value)}
                  className="w-6 h-6 rounded border border-[#1e293b] cursor-pointer bg-transparent"
                />
              )}
            </div>
          </div>

          <div className="bg-[#080c14] border border-[#1e293b] rounded p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-300">ORBITAL INSERTION DISTANCE</span>
              <span className="text-purple-400 font-bold">{distanceFromCenter} AU/Scale</span>
            </div>
            <input
              type="range"
              min="80"
              max="900"
              step="10"
              value={distanceFromCenter}
              onChange={e => setDistanceFromCenter(parseInt(e.target.value))}
              className="w-full"
            />

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span>CIRCULAR INSERTION VELOCITY:</span>
              <strong className="text-emerald-400">{vCirc.toFixed(2)} km/s</strong>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1e293b]">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-[#182334] hover:bg-[#22324b] text-slate-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>FORGE & INJECT BODY</span>
          </button>
        </div>
      </div>
    </div>
  );
};
