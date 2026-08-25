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
  // Procedural multi-frequency sine terrain
  const scale = planetId === 'moon' ? 0.008 : 0.012;
  const h1 = Math.sin(x * scale) * 18;
  const h2 = Math.sin(x * scale * 2.8 + 1.2) * 6;
  const h3 = Math.cos(x * scale * 0.4) * 35;
  const elevation = h1 + h2 + h3;

  // Numerical slope derivative dh/dx
  const dx = 0.5;
  const eNext = Math.sin((x + dx) * scale) * 18 + Math.sin((x + dx) * scale * 2.8 + 1.2) * 6 + Math.cos((x + dx) * scale * 0.4) * 35;
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
    drillProg += dt * 30;
    battery = Math.max(0, battery - dt * 2.5);
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
  const solarGen = rover.surfacePlanetId === 'moon' ? 240 : rover.surfacePlanetId === 'mars' ? 140 : 40;
  battery = Math.min(100, battery + (solarGen / 1000) * dt * 4);

  // Wheel Motor Traction
  if (battery > 1 && !isBraking && throttleInput !== 0) {
    const motorAcc = throttleInput * 2.5;
    vx += motorAcc * dt;
    battery = Math.max(0, battery - Math.abs(throttleInput) * dt * 1.2);
  } else if (isBraking || throttleInput === 0) {
    // Rolling resistance & braking
    vx *= Math.pow(0.85, dt * 60);
  }

  // Gravity slope component (accelerates downhill)
  const slopeGravityAcc = -gSurface * Math.sin(slopeRad) * 0.8;
  vx += slopeGravityAcc * dt;

  // Max rover speed limit
  vx = Math.max(-8, Math.min(12, vx));

  const newPosX = rover.posX + vx * dt;
  const targetSlopeDeg = (slopeRad * 180) / Math.PI;
  const newPitch = rover.pitchDeg + (targetSlopeDeg - rover.pitchDeg) * Math.min(1, dt * 8);

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
