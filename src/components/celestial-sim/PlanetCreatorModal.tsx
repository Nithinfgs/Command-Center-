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
    <div className="fixed inset-0 bg-[#090A0D]/85 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-[#151820] border border-[#353D4A] rounded-lg max-w-xl w-full p-4 shadow-2xl font-mono text-xs max-h-[90vh] overflow-y-auto select-none">
        <div className="flex items-center justify-between pb-3 border-b border-[#252B36]">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#FF8A1F]" />
            <span className="font-bold text-[#E6E8EB] text-xs uppercase tracking-wider">CELESTIAL FORGE - CREATE BODY</span>
          </div>
          <button onClick={onClose} className="text-[#69717E] hover:text-[#E6E8EB] text-xs font-mono p-1 rounded hover:bg-[#1B1F28]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3.5 my-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[#69717E] text-[10px] uppercase font-bold block mb-1">Body Designation</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-[#0E1015] border border-[#252B36] rounded px-3 py-1.5 text-[#E6E8EB] focus:outline-none focus:border-[#FF8A1F]"
              />
            </div>
            <div>
              <label className="text-[#69717E] text-[10px] uppercase font-bold block mb-1">Classification</label>
              <select
                value={type}
                onChange={e => setType(e.target.value as CelestialBodyType)}
                className="w-full bg-[#0E1015] border border-[#252B36] rounded px-3 py-1.5 text-[#E6E8EB] focus:outline-none focus:border-[#FF8A1F]"
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

          <div className="bg-[#1B1F28]/70 border border-[#252B36] rounded p-3 space-y-3">
            <div>
              <div className="flex justify-between text-[#A4ABB6] font-bold mb-1">
                <span>PLANETARY MASS (10^{massExponent.toFixed(1)} kg)</span>
                <span className="text-[#79AFC1]">
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
              <div className="flex justify-between text-[#A4ABB6] font-bold mb-1">
                <span>VOLUMETRIC RADIUS</span>
                <span className="text-[#FF8A1F]">{radiusKm.toLocaleString()} km</span>
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
              <label className="text-[#69717E] text-[10px] uppercase font-bold block mb-1">Primary Surface Tint</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={color}
                  onChange={e => setColor(e.target.value)}
                  className="w-8 h-8 rounded border border-[#252B36] cursor-pointer bg-transparent"
                />
                <span className="text-[#E6E8EB] font-bold">{color}</span>
              </div>
            </div>

            <div>
              <label className="text-[#69717E] text-[10px] uppercase font-bold block mb-1">Secondary Feature Tint</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={e => setSecondaryColor(e.target.value)}
                  className="w-8 h-8 rounded border border-[#252B36] cursor-pointer bg-transparent"
                />
                <span className="text-[#E6E8EB] font-bold">{secondaryColor}</span>
              </div>
            </div>
          </div>

          <div className="bg-[#1B1F28]/70 border border-[#252B36] rounded p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-[#A4ABB6] font-bold">ATMOSPHERE ENVELOPE</label>
              <span className="text-[#79AFC1] font-bold">{atmosphereDensity.toFixed(2)} atm</span>
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

            <div className="flex items-center justify-between pt-2 border-t border-[#252B36]">
              <label className="flex items-center gap-2 text-[#A4ABB6] cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasRings}
                  onChange={e => setHasRings(e.target.checked)}
                  className="rounded border-[#252B36] text-[#FF8A1F]"
                />
                <span>Generate Planetary Ring System</span>
              </label>

              {hasRings && (
                <input
                  type="color"
                  value={ringColor}
                  onChange={e => setRingColor(e.target.value)}
                  className="w-6 h-6 rounded border border-[#252B36] cursor-pointer bg-transparent"
                />
              )}
            </div>
          </div>

          <div className="bg-[#1B1F28]/70 border border-[#252B36] rounded p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#A4ABB6]">ORBITAL INSERTION DISTANCE</span>
              <span className="text-[#FF8A1F] font-bold">{distanceFromCenter} AU/Scale</span>
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

            <div className="flex items-center justify-between text-[11px] text-[#69717E] pt-1">
              <span>CIRCULAR INSERTION VELOCITY:</span>
              <strong className="text-[#55B982]">{vCirc.toFixed(2)} km/s</strong>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#252B36]">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-[#1B1F28] hover:bg-[#222733] border border-[#252B36] text-[#A4ABB6] hover:text-[#E6E8EB] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-[#FF8A1F] hover:bg-[#FFA24A] text-[#090A0D] font-bold transition-colors shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>FORGE & INJECT BODY</span>
          </button>
        </div>
      </div>
    </div>
  );
};
