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
