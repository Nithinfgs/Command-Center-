import type { AsteroidConfig, ImpactTelemetry, TargetAreaType, GeographicTarget } from '../types';

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

export interface PopulationAreaConfig {
  id: TargetAreaType;
  name: string;
  description: string;
  population: number;
  densityPerKm2: number;
  radiusKm: number;
  defaultSurface: 'crystalline_rock' | 'sedimentary_rock' | 'water_ocean' | 'ice_sheet';
}

export const POPULATION_AREAS: Record<TargetAreaType, PopulationAreaConfig> = {
  dense_metro: {
    id: 'dense_metro',
    name: 'Mega-Metropolis (10M)',
    description: 'High-density urban core (e.g., Tokyo, NYC, Mumbai) with 10,000,000 residents',
    population: 10000000,
    densityPerKm2: 8500,
    radiusKm: 20,
    defaultSurface: 'sedimentary_rock'
  },
  major_city: {
    id: 'major_city',
    name: 'Major City Core (1M)',
    description: 'Major regional capital with 1,000,000 residents and high-rise commercial structures',
    population: 1000000,
    densityPerKm2: 3000,
    radiusKm: 12,
    defaultSurface: 'sedimentary_rock'
  },
  urban_suburbs: {
    id: 'urban_suburbs',
    name: 'Suburban County (250k)',
    description: 'Residential suburban county and industrial parks with 250,000 residents',
    population: 250000,
    densityPerKm2: 600,
    radiusKm: 15,
    defaultSurface: 'sedimentary_rock'
  },
  small_town: {
    id: 'small_town',
    name: 'Small Town (100k)',
    description: 'Township / small urban settlement with 100,000 residents',
    population: 100000,
    densityPerKm2: 250,
    radiusKm: 12,
    defaultSurface: 'crystalline_rock'
  },
  rural_plains: {
    id: 'rural_plains',
    name: 'Rural Plains (10k)',
    description: 'Sparse agricultural farmlands and villages with 10,000 residents',
    population: 10000,
    densityPerKm2: 12,
    radiusKm: 25,
    defaultSurface: 'crystalline_rock'
  },
  uninhabited: {
    id: 'uninhabited',
    name: 'Remote Desert (0 Pop)',
    description: 'Uninhabited desert/polar tundra with 0 permanent civilian casualties',
    population: 0,
    densityPerKm2: 0,
    radiusKm: 50,
    defaultSurface: 'crystalline_rock'
  },
  ocean_deep: {
    id: 'ocean_deep',
    name: 'Deep Ocean & Coastal Basin',
    description: 'Open sea impact generating megatsunami threatening 2,000,000 coastal residents',
    population: 2000000,
    densityPerKm2: 450,
    radiusKm: 75,
    defaultSurface: 'water_ocean'
  },
  custom_geo: {
    id: 'custom_geo',
    name: 'Interactive GIS Location',
    description: 'Custom coordinates chosen from interactive Earth map',
    population: 1500000,
    densityPerKm2: 2500,
    radiusKm: 20,
    defaultSurface: 'sedimentary_rock'
  }
};

export const GEOGRAPHIC_TARGETS: GeographicTarget[] = [
  { name: 'Tokyo Metropolis, Japan', latitude: 35.6762, longitude: 139.6503, elevationM: 40, populationDensityPerKm2: 6300, isOcean: false },
  { name: 'New York City, USA', latitude: 40.7128, longitude: -74.0060, elevationM: 10, populationDensityPerKm2: 11000, isOcean: false },
  { name: 'London, United Kingdom', latitude: 51.5074, longitude: -0.1278, elevationM: 11, populationDensityPerKm2: 5700, isOcean: false },
  { name: 'Paris, France', latitude: 48.8566, longitude: 2.3522, elevationM: 35, populationDensityPerKm2: 20000, isOcean: false },
  { name: 'Pacific Ocean (Mariana Basin)', latitude: 11.3493, longitude: 142.1996, elevationM: -8000, populationDensityPerKm2: 0, isOcean: true, oceanDepthM: 6000 },
  { name: 'Atlantic Ocean (Mid-Ridge)', latitude: 25.0000, longitude: -45.0000, elevationM: -4000, populationDensityPerKm2: 0, isOcean: true, oceanDepthM: 4500 },
  { name: 'Cairo, Egypt', latitude: 30.0444, longitude: 31.2357, elevationM: 23, populationDensityPerKm2: 19000, isOcean: false },
  { name: 'Sydney, Australia', latitude: -33.8688, longitude: 151.2093, elevationM: 19, populationDensityPerKm2: 2100, isOcean: false }
];

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

  const isOcean = config.targetSurfaceType === 'water_ocean' || config.targetAreaType === 'ocean_deep' || config.geographicTarget?.isOcean === true;
  const targetDensity = TARGET_SURFACES[isOcean ? 'water_ocean' : config.targetSurfaceType]?.density || 2750;
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
    finalCraterDiameter = (1.17 * Math.pow(transientCrater, 1.13)) / Math.pow(dSimpleComplex, 0.13);
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

  // Atmospheric disruption text
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

  // ==========================================
  // CASUALTY & FATALITY ESTIMATION MODEL
  // ==========================================
  const areaConfig = POPULATION_AREAS[config.targetAreaType || 'dense_metro'] || POPULATION_AREAS.dense_metro;
  const totalPop = config.customPopulation !== undefined
    ? config.customPopulation
    : config.geographicTarget
    ? config.geographicTarget.populationDensityPerKm2 * Math.PI * Math.pow(25, 2)
    : areaConfig.population;

  const popDensity = config.geographicTarget
    ? config.geographicTarget.populationDensityPerKm2
    : areaConfig.densityPerKm2;

  let estimatedFatalities = 0;
  let estimatedInjuries = 0;

  // Shallow water wave amplification via Green's Law: H1 / H0 = (h0 / h1)^(1/4)
  const initialDeepWaveM = Math.round(Math.max(15, craterDepth * 0.45));
  const deepDepthM = config.geographicTarget?.oceanDepthM || 4000;
  const shallowCoastDepthM = 20;
  const greensAmplification = Math.pow(deepDepthM / shallowCoastDepthM, 0.25);

  const waveDecayed100km = initialDeepWaveM * Math.pow(Math.max(1, finalCraterDiameter / 2) / 100000, 0.72);
  const tsunamiWaveHeightAt100kmM = parseFloat(Math.min(500, waveDecayed100km * (isOcean ? greensAmplification * 0.5 : 1)).toFixed(1));
  const tsunamiRunupInundationKm = parseFloat((tsunamiWaveHeightAt100kmM * 0.35).toFixed(2));
  const tsunamiTravelSpeedKmh = Math.round(Math.sqrt(9.81 * deepDepthM) * 3.6);

  if (totalPop > 0) {
    if (isOcean) {
      if (tsunamiWaveHeightAt100kmM > 25) {
        estimatedFatalities = Math.round(totalPop * 0.85);
        estimatedInjuries = Math.round(totalPop * 0.12);
      } else if (tsunamiWaveHeightAt100kmM > 10) {
        estimatedFatalities = Math.round(totalPop * 0.55);
        estimatedInjuries = Math.round(totalPop * 0.35);
      } else if (tsunamiWaveHeightAt100kmM > 2) {
        estimatedFatalities = Math.round(totalPop * 0.2);
        estimatedInjuries = Math.round(totalPop * 0.45);
      } else {
        estimatedFatalities = Math.round(totalPop * 0.02);
        estimatedInjuries = Math.round(totalPop * 0.1);
      }
    } else {
      const lethalRadius = Math.max(thermalIgnitionRadiusKm * 0.9, r20psiKm);
      const lethalArea = Math.PI * Math.pow(lethalRadius, 2);
      const fatalitiesDirect = Math.min(totalPop, Math.round(lethalArea * popDensity));

      const r5psiArea = Math.PI * Math.pow(r5psiKm, 2);
      const ring5psiArea = Math.max(0, r5psiArea - lethalArea);
      const fatalities5psi = Math.min(totalPop - fatalitiesDirect, Math.round(ring5psiArea * popDensity * 0.6));

      const r1psiArea = Math.PI * Math.pow(r1psiKm, 2);
      const ring1psiArea = Math.max(0, r1psiArea - r5psiArea);
      const fatalities1psi = Math.min(totalPop - fatalitiesDirect - fatalities5psi, Math.round(ring1psiArea * popDensity * 0.12));

      estimatedFatalities = Math.min(totalPop, fatalitiesDirect + fatalities5psi + fatalities1psi);
      const remainingPop = Math.max(0, totalPop - estimatedFatalities);
      estimatedInjuries = Math.min(remainingPop, Math.round(ring1psiArea * popDensity * 0.65 + fatalitiesDirect * 0.3));
    }
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
    atmosphericDisruptionDescription: atmosphereText,
    targetPopulation: Math.round(totalPop),
    estimatedFatalities,
    estimatedInjuries,
    isOceanImpact: isOcean,
    tsunamiWaveHeightAtImpactM: initialDeepWaveM,
    tsunamiWaveHeightAt100kmM,
    tsunamiRunupInundationKm,
    tsunamiTravelSpeedKmh
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
    targetSurfaceType: 'crystalline_rock' as const,
    targetAreaType: 'small_town' as TargetAreaType
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
    targetSurfaceType: 'crystalline_rock' as const,
    targetAreaType: 'uninhabited' as TargetAreaType
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
    targetSurfaceType: 'sedimentary_rock' as const,
    targetAreaType: 'rural_plains' as TargetAreaType
  },
  {
    id: 'apophis_metro',
    name: 'Apophis Metro Direct Hit',
    description: '340-meter near-Earth asteroid impacting dense 10M population metropolis.',
    diameter: 340,
    composition: 'silicate' as const,
    density: 3200,
    velocity: 30.7,
    entryAngle: 45,
    targetSurfaceType: 'sedimentary_rock' as const,
    targetAreaType: 'dense_metro' as TargetAreaType
  },
  {
    id: 'ocean_megatsunami',
    name: 'Deep Ocean Megatsunami Impact',
    description: '1-kilometer asteroid oceanic impact triggering 300m megatsunami waves.',
    diameter: 1000,
    composition: 'silicate' as const,
    density: 3000,
    velocity: 25,
    entryAngle: 45,
    targetSurfaceType: 'water_ocean' as const,
    targetAreaType: 'ocean_deep' as TargetAreaType
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
    targetSurfaceType: 'water_ocean' as const,
    targetAreaType: 'ocean_deep' as TargetAreaType
  }
];
