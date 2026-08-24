import type { FlightState, RocketBlueprint } from '../types';
import { calculateRocketProperties, PARTS_CATALOG } from './rocket-math';
import { calculateAtmosphere } from './aerodynamics';

export const G_EARTH = 9.80665;
export const EARTH_RADIUS = 6371000; // meters (realistic scale)
export const MU_EARTH = 3.986004418e14; // m^3/s^2

export interface DebrisObject {
  id: string;
  partType: string;
  worldX: number;
  worldY: number;
  vx: number;
  vy: number;
  rotation: number;
  rotSpeed: number;
  life: number;
}

export function initFlightState(blueprint: RocketBlueprint): FlightState {
  const props = calculateRocketProperties(blueprint);
  
  let minStage = 1;
  if (blueprint.parts.length > 0) {
    const stages = blueprint.parts.map(p => p.stage || 1);
    minStage = Math.min(...stages);
  }

  const initialStageInfo = calculateCurrentStageMassAndThrust(blueprint, minStage, 0);

  return {
    isActive: false,
    isLaunched: false,
    isPaused: false,
    altitude: 0,
    downrange: 0,
    velocity: { vx: 0, vy: 0 },
    speed: 0,
    verticalSpeed: 0,
    horizontalSpeed: 0,
    pitch: 90,
    throttle: 1.0,
    gForce: 1.0,
    currentStageIndex: minStage,
    fuelMassRemaining: initialStageInfo.stageFuelMassTons > 0 ? initialStageInfo.stageFuelMassTons : props.fuelMass,
    burnTimeRemaining: props.stagesDeltaV[0]?.burnTime || 60,
    dynamicPressure: 0,
    maxQReached: 0,
    apoapsis: 0,
    periapsis: 0,
    orbitalSpeedNeeded: 7800,
    trajectoryHistory: [{ x: 0, y: 0 }],
    targetPlanetId: 'earth',
    aborted: false,
    inOrbit: false
  };
}

export function calculateCurrentStageMassAndThrust(
  blueprint: RocketBlueprint,
  currentStageIndex: number,
  altitude: number
): {
  stageDryMassTons: number;
  stageFuelMassTons: number;
  activeVehicleDryMassTons: number;
  thrustN: number;
  isp: number;
  activePartsCount: number;
} {
  const atm = calculateAtmosphere(altitude);
  const atmFactor = Math.min(1, Math.max(0, atm.density / 1.225));

  let activeVehicleDryMass = 0;
  let stageFuelMass = 0;
  let stageDryMass = 0;
  let thrustN = 0;
  let weightedIsp = 0;
  let activePartsCount = 0;

  for (const part of blueprint.parts) {
    const def = PARTS_CATALOG[part.partType];
    if (!def) continue;

    const partStage = part.stage || 1;

    // Only include parts that belong to current active stage or future upper stages
    if (partStage >= currentStageIndex) {
      activeVehicleDryMass += def.dryMass;
      activePartsCount++;

      if (partStage === currentStageIndex) {
        stageDryMass += def.dryMass;
        stageFuelMass += def.fuelMass * ((part.fuelPercentage ?? 100) / 100);

        if (def.thrust && def.thrust > 0) {
          const seaThrust = (def.seaLevelThrust || def.thrust * 0.85) * 1000;
          const vacThrust = def.thrust * 1000;
          const engineThrust = seaThrust * atmFactor + vacThrust * (1 - atmFactor);
          const effectiveIsp = (def.ispAtm || 280) * atmFactor + (def.ispVac || 320) * (1 - atmFactor);

          thrustN += engineThrust;
          weightedIsp += effectiveIsp * engineThrust;
        }
      }
    }
  }

  const avgIsp = thrustN > 0 ? weightedIsp / thrustN : 300;

  return {
    stageDryMassTons: stageDryMass,
    stageFuelMassTons: stageFuelMass,
    activeVehicleDryMassTons: Math.max(0.2, activeVehicleDryMass),
    thrustN,
    isp: avgIsp,
    activePartsCount
  };
}

export function stepFlightPhysics(
  state: FlightState,
  blueprint: RocketBlueprint,
  dt: number,
  guidanceMode: 'manual' | 'auto' = 'manual'
): FlightState {
  if (!state.isLaunched || state.isPaused || state.aborted) {
    return state;
  }

  const stageInfo = calculateCurrentStageMassAndThrust(
    blueprint,
    state.currentStageIndex,
    state.altitude
  );

  const atm = calculateAtmosphere(state.altitude);

  // Automatic Gravity Turn Guidance or Manual Pitch
  let pitch = state.pitch;
  if (guidanceMode === 'auto') {
    if (state.altitude > 1000 && state.altitude < 80000) {
      const turnFraction = Math.min(1, (state.altitude - 1000) / 60000);
      const targetPitch = Math.max(0, 90 - turnFraction * 90);
      pitch = pitch + (targetPitch - pitch) * dt * 0.4;
    }
  }

  // SFS-Style Instant Throttle & Fuel Depletion
  const throttle = state.throttle;
  let currentFuel = Math.max(0, state.fuelMassRemaining);

  let engineThrustN = 0;
  if (throttle > 0 && currentFuel > 0.001) {
    engineThrustN = stageInfo.thrustN * throttle;
    const mdot = engineThrustN / (stageInfo.isp * G_EARTH); // kg/s
    currentFuel = Math.max(0, currentFuel - (mdot * dt) / 1000);
  }

  // Instantaneous Vehicle Mass (kg)
  const currentTotalMassKg = (stageInfo.activeVehicleDryMassTons + currentFuel) * 1000;

  // Pitch Angle Orientation (90 deg = Vertical Up, 0 deg = Horizontal Downrange)
  const pitchRad = (pitch * Math.PI) / 180;
  const thrustX = engineThrustN * Math.cos(pitchRad);
  const thrustY = engineThrustN * Math.sin(pitchRad);

  // True Kinematic Speeds
  const vx = state.velocity.vx;
  const vy = state.velocity.vy;
  const currentSpeed = Math.hypot(vx, vy);

  // Aerodynamic Drag
  const q = 0.5 * atm.density * currentSpeed * currentSpeed;
  const frontalArea = Math.max(1.5, Math.min(12, blueprint.parts.length * 0.45));
  const cd = 0.25;
  const dragMagnitude = cd * q * frontalArea;

  const dragX = currentSpeed > 0.01 ? -dragMagnitude * (vx / currentSpeed) : 0;
  const dragY = currentSpeed > 0.01 ? -dragMagnitude * (vy / currentSpeed) : 0;

  // True Spherical Gravity Vector
  const rCurrent = EARTH_RADIUS + state.altitude;
  const localG = MU_EARTH / (rCurrent * rCurrent);
  const gravityForceY = -currentTotalMassKg * localG;

  // Net Forces
  const netFx = thrustX + dragX;
  let netFy = thrustY + dragY + gravityForceY;

  // Ground Support Reaction on Launchpad
  if (state.altitude <= 0 && netFy < 0) {
    netFy = 0;
  }

  // Accelerations
  const ax = netFx / currentTotalMassKg;
  const ay = netFy / currentTotalMassKg;

  const gTotal = Math.sqrt(ax * ax + (ay + localG) * (ay + localG)) / G_EARTH;

  // Velocity Integration
  let newVx = vx + ax * dt;
  let newVy = vy + ay * dt;

  // Altitude & Downrange Integration
  let newDownrange = state.downrange + newVx * dt;
  let newAltitude = state.altitude + newVy * dt;

  // Ground Collision / Landing Detection
  if (newAltitude <= 0) {
    newAltitude = 0;
    if (newVy < -12) {
      // Hard crash
      newVy = 0;
      newVx = 0;
    } else {
      // Soft touchdown / sitting on pad
      newVy = 0;
      newVx = 0;
    }
  }

  const newSpeed = Math.hypot(newVx, newVy);

  // Keplerian Orbital Elements Calculation (Ap & Pe)
  const rNew = EARTH_RADIUS + newAltitude;
  const specificEnergy = (newSpeed * newSpeed) / 2 - MU_EARTH / rNew;
  
  let apoapsis = newAltitude;
  let periapsis = 0;
  let inOrbit = false;

  if (specificEnergy < 0) {
    const semiMajorAxis = -MU_EARTH / (2 * specificEnergy);
    const angularMomentum = rNew * Math.abs(newVx);
    const eccSq = Math.max(0, 1 - (angularMomentum * angularMomentum) / (MU_EARTH * semiMajorAxis));
    const ecc = Math.sqrt(eccSq);

    apoapsis = Math.max(newAltitude, semiMajorAxis * (1 + ecc) - EARTH_RADIUS);
    periapsis = Math.max(0, semiMajorAxis * (1 - ecc) - EARTH_RADIUS);

    if (periapsis >= 70000 && newAltitude >= 70000) {
      inOrbit = true;
    }
  } else if (newSpeed > 0) {
    apoapsis = 999999;
    periapsis = Math.max(0, newAltitude);
  }

  const maxQ = Math.max(state.maxQReached, q);

  // Trajectory history trail
  const history = [...state.trajectoryHistory];
  const lastPoint = history[history.length - 1];
  if (!lastPoint || Math.hypot(newDownrange - lastPoint.x, newAltitude - lastPoint.y) > 100) {
    history.push({ x: newDownrange, y: newAltitude });
    if (history.length > 800) history.shift();
  }

  return {
    ...state,
    altitude: parseFloat(newAltitude.toFixed(1)),
    downrange: parseFloat(newDownrange.toFixed(1)),
    velocity: { vx: parseFloat(newVx.toFixed(2)), vy: parseFloat(newVy.toFixed(2)) },
    speed: parseFloat(newSpeed.toFixed(1)),
    verticalSpeed: parseFloat(newVy.toFixed(1)),
    horizontalSpeed: parseFloat(newVx.toFixed(1)),
    pitch: parseFloat(pitch.toFixed(1)),
    gForce: parseFloat(gTotal.toFixed(2)),
    fuelMassRemaining: parseFloat(currentFuel.toFixed(2)),
    dynamicPressure: Math.round(q),
    maxQReached: Math.round(maxQ),
    apoapsis: Math.round(apoapsis),
    periapsis: Math.round(periapsis),
    trajectoryHistory: history,
    inOrbit
  };
}
