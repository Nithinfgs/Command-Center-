import type { FlightState, RocketBlueprint } from '../types';
import { calculateRocketProperties, PARTS_CATALOG } from './rocket-math';
import { calculateAtmosphere } from './aerodynamics';

export const G_EARTH = 9.80665;
export const EARTH_RADIUS = 6371000; // meters
export const MU_EARTH = 3.986004418e14; // m^3/s^2

export interface JettisonedStage {
  id: string;
  stageNumber: number;
  parts: { partType: string; x: number; y: number; rotation: number }[];
  worldX: number;
  worldY: number;
  vx: number;
  vy: number;
  rotation: number;
  angularVelocity: number;
  life: number;
}

export function initFlightState(blueprint: RocketBlueprint): FlightState {
  const props = calculateRocketProperties(blueprint);
  
  let minStage = 1;
  if (blueprint.parts.length > 0) {
    const stages = blueprint.parts.map(p => p.stage || 1);
    minStage = Math.min(...stages);
  }

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
    fuelMassRemaining: props.fuelMass,
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

    // Only include parts that have not been dropped yet (partStage >= currentStageIndex)
    if (partStage >= currentStageIndex) {
      activeVehicleDryMass += def.dryMass;
      activePartsCount++;

      // If part belongs to current active burning stage
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
    activeVehicleDryMassTons: Math.max(0.5, activeVehicleDryMass),
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

  // Automatic Gravity Turn Guidance if enabled or pitch steering
  let pitch = state.pitch;
  if (guidanceMode === 'auto') {
    if (state.altitude > 1000 && state.altitude < 75000) {
      const turnFraction = Math.min(1, (state.altitude - 1000) / 55000);
      const targetPitch = Math.max(5, 90 - turnFraction * 85);
      pitch = pitch + (targetPitch - pitch) * dt * 0.35;
    }
  }

  // Engine Throttle & Fuel Consumption
  const throttle = state.throttle;
  let currentFuel = Math.max(0, state.fuelMassRemaining);

  let engineThrustN = stageInfo.thrustN;
  if (currentFuel <= 0.001) {
    engineThrustN = 0;
  }

  if (engineThrustN > 0 && throttle > 0) {
    const mdot = (engineThrustN * throttle) / (stageInfo.isp * G_EARTH); // kg/s
    currentFuel = Math.max(0, currentFuel - (mdot * dt) / 1000);
  }

  // Total Instantaneous Vehicle Mass
  const currentTotalMassKg = (stageInfo.activeVehicleDryMassTons + currentFuel) * 1000;

  // Pitch Angle: 90 = Straight Up (+Y), 0 = Horizontal Downrange (+X)
  const pitchRad = (pitch * Math.PI) / 180;
  const thrustX = engineThrustN * throttle * Math.cos(pitchRad);
  const thrustY = engineThrustN * throttle * Math.sin(pitchRad);

  // Aerodynamic Drag Force
  const currentSpeed = Math.hypot(state.velocity.vx, state.velocity.vy);
  const q = 0.5 * atm.density * currentSpeed * currentSpeed;
  const frontalArea = Math.max(1.5, Math.min(12, blueprint.parts.length * 0.4));
  const cd = 0.26;
  const dragMagnitude = cd * q * frontalArea;

  const dragX = currentSpeed > 0.05 ? -dragMagnitude * (state.velocity.vx / currentSpeed) : 0;
  const dragY = currentSpeed > 0.05 ? -dragMagnitude * (state.velocity.vy / currentSpeed) : 0;

  // True Radial Gravity Force
  const rCurrent = EARTH_RADIUS + state.altitude;
  const localG = MU_EARTH / (rCurrent * rCurrent);
  const gravityForceY = -currentTotalMassKg * localG;

  // Net Forces and Accelerations
  const netFx = thrustX + dragX;
  const netFy = thrustY + dragY + (state.altitude <= 0 && (thrustY + gravityForceY < 0) ? -gravityForceY : gravityForceY);

  const ax = netFx / currentTotalMassKg;
  let ay = netFy / currentTotalMassKg;

  // Ground collision / launchpad support
  if (state.altitude <= 0 && ay < 0) {
    ay = 0;
  }

  const gTotal = Math.sqrt(ax * ax + (ay + localG) * (ay + localG)) / G_EARTH;

  // Integrate Velocity & Position
  const newVx = state.velocity.vx + ax * dt;
  let newVy = state.velocity.vy + ay * dt;
  if (state.altitude <= 0 && newVy < 0) {
    newVy = 0;
  }

  const newDownrange = state.downrange + newVx * dt;
  const newAltitude = Math.max(0, state.altitude + newVy * dt);
  const newSpeed = Math.hypot(newVx, newVy);

  // Orbital Mechanics & Trajectory Prediction (Apoapsis & Periapsis)
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

    if (periapsis >= 80000 && newAltitude >= 80000) {
      inOrbit = true;
    }
  } else if (newSpeed > 0) {
    // Hyperbolic escape trajectory
    apoapsis = 999999;
    periapsis = Math.max(0, newAltitude);
  }

  const maxQ = Math.max(state.maxQReached, q);

  // Trajectory history trail
  const history = [...state.trajectoryHistory];
  const lastPoint = history[history.length - 1];
  if (!lastPoint || Math.hypot(newDownrange - lastPoint.x, newAltitude - lastPoint.y) > 150) {
    history.push({ x: newDownrange, y: newAltitude });
    if (history.length > 600) history.shift();
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
