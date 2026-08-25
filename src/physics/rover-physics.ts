/**
 * Planetary Surface Rover & Terrain Vehicle Dynamics.
 * Models 4-wheel rocker-bogie suspension, terrain slope traction,
 * solar panel charging, battery drainage, and surface sample drilling.
 */

export interface PlanetaryRoverState {
  posX: number; // Surface distance along terrain (meters)
  altitude: number; // Elevation above datum (meters)
  vx: number; // m/s
  vy: number;
  pitchDeg: number; // Body inclination along slope
  batteryPercent: number; // 0 to 100%
  solarPowerWatts: number;
  sampleCount: number;
  maxSamples: number;
  flagsPlanted: Array<{ x: number; label: string; planetId: string }>;
  isDrilling: boolean;
  drillProgress: number; // 0 to 100%
  surfacePlanetId: 'moon' | 'mars' | 'titan';
}

export function getTerrainElevation(x: number, planetId: string): { elevation: number; slopeRad: number } {
  const scale = planetId === 'moon' ? 0.008 : 0.012;
  const h1 = Math.sin(x * scale) * 16;
  const h2 = Math.sin(x * scale * 2.5 + 1.2) * 5;
  const h3 = Math.cos(x * scale * 0.35) * 25;
  const elevation = h1 + h2 + h3;

  const dx = 0.5;
  const eNext = Math.sin((x + dx) * scale) * 16 + Math.sin((x + dx) * scale * 2.5 + 1.2) * 5 + Math.cos((x + dx) * scale * 0.35) * 25;
  const slopeRad = Math.atan2(eNext - elevation, dx);

  return { elevation, slopeRad };
}

export function stepRoverPhysics(
  rover: PlanetaryRoverState,
  throttleInput: number, // -1 (reverse) to +1 (forward)
  isBraking: boolean,
  dt: number
): PlanetaryRoverState {
  const gSurface = rover.surfacePlanetId === 'moon' ? 1.62 : rover.surfacePlanetId === 'mars' ? 3.72 : 1.35;
  const { elevation, slopeRad } = getTerrainElevation(rover.posX, rover.surfacePlanetId);

  let vx = rover.vx;
  let battery = rover.batteryPercent;
  let isDrilling = rover.isDrilling;
  let drillProg = rover.drillProgress;
  let sampleCount = rover.sampleCount;

  // Drilling operation
  if (isDrilling) {
    drillProg += dt * 35;
    battery = Math.max(0, battery - dt * 2.0);
    if (drillProg >= 100) {
      isDrilling = false;
      drillProg = 0;
      sampleCount = Math.min(rover.maxSamples, sampleCount + 1);
    }
    return {
      ...rover,
      vx: 0,
      altitude: elevation,
      batteryPercent: parseFloat(battery.toFixed(1)),
      isDrilling,
      drillProgress: Math.min(100, drillProg),
      sampleCount
    };
  }

  // Solar generation
  const solarGen = rover.surfacePlanetId === 'moon' ? 240 : rover.surfacePlanetId === 'mars' ? 140 : 50;
  battery = Math.min(100, battery + (solarGen / 1000) * dt * 3.5);

  // High-Torque Wheel Motor Traction
  if (battery > 0.5 && !isBraking && throttleInput !== 0) {
    const motorAcc = throttleInput * 8.5; // High responsiveness
    vx += motorAcc * dt;
    battery = Math.max(0, battery - Math.abs(throttleInput) * dt * 0.8);
  } else if (isBraking) {
    vx *= Math.pow(0.5, dt * 60); // Strong braking
  } else {
    // Natural friction rolling resistance
    vx *= Math.pow(0.92, dt * 60);
  }

  // Gravity slope component (natural downhill acceleration)
  const slopeGravityAcc = -gSurface * Math.sin(slopeRad) * 0.6;
  vx += slopeGravityAcc * dt;

  // Clamped speed limit
  vx = Math.max(-12, Math.min(18, vx));

  const newPosX = rover.posX + vx * dt;
  const targetSlopeDeg = (slopeRad * 180) / Math.PI;
  const newPitch = rover.pitchDeg + (targetSlopeDeg - rover.pitchDeg) * Math.min(1, dt * 10);

  return {
    ...rover,
    posX: parseFloat(newPosX.toFixed(2)),
    altitude: parseFloat(elevation.toFixed(2)),
    vx: parseFloat(vx.toFixed(2)),
    pitchDeg: parseFloat(newPitch.toFixed(1)),
    batteryPercent: parseFloat(battery.toFixed(1)),
    solarPowerWatts: Math.round(solarGen),
    isDrilling,
    drillProgress: drillProg,
    sampleCount
  };
}

export interface RoverMissionLevel {
  id: string;
  title: string;
  planetId: 'moon' | 'mars' | 'titan';
  targetDistanceM: number;
  requiredSamples: number;
  timeLimitSec: number;
  description: string;
  hazard: string;
  rewardBadge: string;
  anomalySites: number[];
  outpostTargetX: number;
}

export const ROVER_MISSIONS: RoverMissionLevel[] = [
  {
    id: 'lvl_1_moon_ice',
    title: 'Level 1: Shackleton Ice Extraction',
    planetId: 'moon',
    targetDistanceM: 160,
    requiredSamples: 2,
    timeLimitSec: 90,
    description: 'Traverse the rugged crater rim, locate volatile water-ice anomalies in the shadowed floor, drill 2 samples, and plant the Artemis Base Flag at 160m.',
    hazard: 'Low Lunar Gravity (1.62 m/s²) causes long wheel slip upon high speed braking.',
    rewardBadge: 'Lunar Hydro-Prospector Badge',
    anomalySites: [50, 110],
    outpostTargetX: 160
  },
  {
    id: 'lvl_2_mars_jezero',
    title: 'Level 2: Jezero Delta Microfossil Search',
    planetId: 'mars',
    targetDistanceM: 280,
    requiredSamples: 3,
    timeLimitSec: 120,
    description: 'Cross the ancient dried riverbed dunes, collect 3 clay biosignature core samples, and establish Outpost Perseverance at 280m.',
    hazard: 'Dust storm haze limits solar charging efficiency to 70W.',
    rewardBadge: 'Astrobiology Pioneer Badge',
    anomalySites: [65, 140, 220],
    outpostTargetX: 280
  },
  {
    id: 'lvl_3_mars_olympus',
    title: 'Level 3: Olympus Mons Ridge Climb',
    planetId: 'mars',
    targetDistanceM: 400,
    requiredSamples: 3,
    timeLimitSec: 140,
    description: 'Scale the high-altitude volcanic scarp slopes, drill basaltic mantle samples, and reach the high ridge summit at 400m.',
    hazard: 'Steep 22° incline slope gravity can roll you backwards down cliffs.',
    rewardBadge: 'Olympus Summit Shield',
    anomalySites: [90, 210, 330],
    outpostTargetX: 400
  },
  {
    id: 'lvl_4_titan_kraken',
    title: 'Level 4: Kraken Mare Cryo-Survey',
    planetId: 'titan',
    targetDistanceM: 500,
    requiredSamples: 4,
    timeLimitSec: 160,
    description: 'Navigate hydrocarbon ice dunes along the liquid methane shoreline, extract 4 cryogenic organic samples, and deploy Dragonfly Outpost at 500m.',
    hazard: 'Dim sunlight produces low solar generation (50W) — manage power carefully.',
    rewardBadge: 'Outer Solar Explorer Gold Pin',
    anomalySites: [80, 190, 320, 440],
    outpostTargetX: 500
  },
  {
    id: 'lvl_5_moon_speedrun',
    title: 'Level 5: Artemis Lunar Rally Grand Prix',
    planetId: 'moon',
    targetDistanceM: 350,
    requiredSamples: 1,
    timeLimitSec: 45,
    description: 'High-speed time-attack rally across crater ridges! Collect 1 fast sample and reach the finish outpost in under 45 seconds.',
    hazard: 'Extreme speed risk: crashing or rolling over disables rover.',
    rewardBadge: 'Lunar Grand Prix Gold Trophy',
    anomalySites: [150],
    outpostTargetX: 350
  }
];
