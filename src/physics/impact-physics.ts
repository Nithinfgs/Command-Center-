import type { AsteroidConfig, ImpactTelemetry } from '../types';

export const ASTEROID_DENSITIES: Record<string, number> = {
  rubble: 1500,
  carbonaceous: 2200,
  silicate: 3000,
  iron_nickel: 7800,
  cometary_ice: 1000
};

export const TARGET_SURFACES: Record<string, { density: number; name: string }> = {
  crystalline_rock: { density: 2750, name: 'Crystalline Continental Crust' },
  sedimentary_rock: { density: 2400, name: 'Sedimentary Rock Strata' },
  water_ocean: { density: 1000, name: 'Deep Ocean Water (4km depth)' },
  ice_sheet: { density: 917, name: 'Glacial Polar Ice Sheet' }
};

export const JOULES_PER_MEGATON = 4.184e15;
export const HIROSHIMA_ENERGY_JOULES = 6.3e13;

export function calculateImpactPhysics(config: AsteroidConfig): ImpactTelemetry {
  const radiusMeters = config.diameter / 2;
  const volumeM3 = (4 / 3) * Math.PI * Math.pow(radiusMeters, 3);
  const massKg = volumeM3 * config.density;
  const velocityMps = config.velocity * 1000;
  const angleRad = (config.entryAngle * Math.PI) / 180;

  const kineticEnergyJoules = 0.5 * massKg * Math.pow(velocityMps, 2);
  const kineticEnergyMegatons = kineticEnergyJoules / JOULES_PER_MEGATON;
  const hiroshimaEquiv = kineticEnergyJoules / HIROSHIMA_ENERGY_JOULES;

  const targetDensity = TARGET_SURFACES[config.targetSurfaceType]?.density || 2750;
  const g = 9.80665;

  const transientCrater =
    1.161 *
    Math.pow(config.density / targetDensity, 1 / 3) *
    Math.pow(config.diameter, 0.78) *
    Math.pow(velocityMps, 0.44) *
    Math.pow(g, -0.22) *
    Math.pow(Math.sin(angleRad), 1 / 3);

  const dSimpleComplex = 3200;
  let finalCraterDiameter = transientCrater;
  let craterDepth = transientCrater / 3;

  if (transientCrater > dSimpleComplex) {
    finalCraterDiameter = 1.17 * Math.pow(transientCrater, 1.13) / Math.pow(dSimpleComplex, 0.13);
    craterDepth = 1040 * Math.pow(finalCraterDiameter / 1000, 0.301);
  } else {
    finalCraterDiameter = 1.25 * transientCrater;
    craterDepth = finalCraterDiameter / 4.5;
  }

  const craterVolume = (Math.PI / 8) * Math.pow(finalCraterDiameter, 2) * craterDepth;

  const fireballRadiusKm = Math.max(0.1, (0.002 * Math.pow(kineticEnergyJoules, 1 / 3)) / 1000);
  const thermalIgnitionRadiusKm = fireballRadiusKm * 3.8;

  const r20psiKm = Math.max(0.1, 0.28 * Math.pow(kineticEnergyMegatons, 1 / 3));
  const r5psiKm = Math.max(0.2, 0.82 * Math.pow(kineticEnergyMegatons, 1 / 3));
  const r1psiKm = Math.max(0.5, 2.4 * Math.pow(kineticEnergyMegatons, 1 / 3));

  const ejectaRadiusKm = (finalCraterDiameter * 2.5) / 1000;

  const seismicEnergy = kineticEnergyJoules * 1e-4;
  const richterMagnitude = Math.min(13.5, Math.max(1.0, 0.67 * Math.log10(Math.max(1, seismicEnergy)) - 5.87));

  const soundDb = Math.min(240, Math.max(40, 120 + 20 * Math.log10(Math.max(1, kineticEnergyMegatons)) - 20 * Math.log10(100)));

  let atmosphereText = 'Localized low-altitude pressure shock; minimal stratospheric dust injection.';
  if (kineticEnergyMegatons > 1e6) {
    atmosphereText = 'GLOBAL EXTINCTION EVENT: Stratospheric sulfate/soot veil blocking 99% sunlight for years, nuclear winter, global acid rain, collapse of photosynthesis.';
  } else if (kineticEnergyMegatons > 10000) {
    atmosphereText = 'CONTINENTAL COLLAPSE: Global ozone layer depletion by 70%, multi-year agricultural failure, hemispheric shockwave circling planet multiple times.';
  } else if (kineticEnergyMegatons > 100) {
    atmosphereText = 'REGIONAL CATASTROPHE: Stratospheric dust injection causing regional cooling (-4°C), severe global infrasound detection, regional wildfires.';
  } else if (kineticEnergyMegatons > 1) {
    atmosphereText = 'METROPOLITAN DEVASTATION: High-altitude fireball, severe blast overpressure demolishing all structures across city radius, regional fallout.';
  }

  return {
    kineticEnergyJoules,
    kineticEnergyMegatons: parseFloat(kineticEnergyMegatons.toFixed(2)),
    tntEquivalentHiroshimas: Math.round(hiroshimaEquiv),
    transientCraterDiameter: Math.round(transientCrater),
    finalCraterDiameter: Math.round(finalCraterDiameter),
    craterDepth: Math.round(craterDepth),
    craterVolume: Math.round(craterVolume),
    ejectaBlanketRadius: parseFloat(ejectaRadiusKm.toFixed(2)),
    fireballRadius: parseFloat(fireballRadiusKm.toFixed(2)),
    thermalIgnitionRadius: parseFloat(thermalIgnitionRadiusKm.toFixed(2)),
    overpressure20psiRadius: parseFloat(r20psiKm.toFixed(2)),
    overpressure5psiRadius: parseFloat(r5psiKm.toFixed(2)),
    overpressure1psiRadius: parseFloat(r1psiKm.toFixed(2)),
    seismicMagnitude: parseFloat(richterMagnitude.toFixed(1)),
    soundDecibelsAt100km: Math.round(soundDb),
    atmosphericDisruptionDescription: atmosphereText
  };
}

export const IMPACT_PRESETS = [
  {
    id: 'chelyabinsk',
    name: 'Chelyabinsk Airburst (2013)',
    description: '20-meter chondrite meteor airburst at 29km altitude.',
    diameter: 20,
    composition: 'silicate' as const,
    density: 3300,
    velocity: 19,
    entryAngle: 18,
    targetSurfaceType: 'crystalline_rock' as const
  },
  {
    id: 'tunguska',
    name: 'Tunguska Event (1908)',
    description: '60-meter stony asteroid flattening 2,150 sq km of Siberian taiga.',
    diameter: 60,
    composition: 'silicate' as const,
    density: 3000,
    velocity: 27,
    entryAngle: 30,
    targetSurfaceType: 'crystalline_rock' as const
  },
  {
    id: 'meteor_crater',
    name: 'Barringer Meteor Crater (Arizona)',
    description: '50-meter dense nickel-iron meteorite impacting at cosmic speed.',
    diameter: 50,
    composition: 'iron_nickel' as const,
    density: 7800,
    velocity: 12.8,
    entryAngle: 45,
    targetSurfaceType: 'sedimentary_rock' as const
  },
  {
    id: 'apophis_close',
    name: 'Asteroid 99942 Apophis',
    description: '340-meter near-Earth asteroid direct city-destroyer impact scenario.',
    diameter: 340,
    composition: 'silicate' as const,
    density: 3200,
    velocity: 30.7,
    entryAngle: 45,
    targetSurfaceType: 'crystalline_rock' as const
  },
  {
    id: 'chicxulub_dinosaur',
    name: 'Chicxulub Dinosaur Extinction (66 Ma)',
    description: '10-kilometer carbonaceous chondrite causing the Cretaceous-Paleogene extinction.',
    diameter: 10000,
    composition: 'carbonaceous' as const,
    density: 2500,
    velocity: 20,
    entryAngle: 60,
    targetSurfaceType: 'water_ocean' as const
  }
];
