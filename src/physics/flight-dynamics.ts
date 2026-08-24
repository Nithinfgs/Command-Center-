import type { FlightState, RocketBlueprint } from '../types';
import { calculateRocketProperties, PARTS_CATALOG } from './rocket-math';
import { calculateAtmosphere, STEFAN_BOLTZMANN } from './aerodynamics';

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
    inOrbit: false,
    isEscapeTrajectory: false,
    reentryHeatFlux: 0,
    plasmaTemperatureK: 300,
    vehicleSkinTempK: 300,
    isCrashed: false,
    isDisintegrated: false,
    crashImpactSpeed: 0
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

/**
 * Calculates acceleration vector at state (altitude, downrange, vx, vy)
 */
function getFlightAccelerations(
  alt: number,
  vx: number,
  vy: number,
  pitchDeg: number,
  engineThrustN: number,
  totalMassKg: number,
  blueprint: RocketBlueprint
): { ax: number; ay: number; q: number; dragX: number; dragY: number; localG: number } {
  const atm = calculateAtmosphere(alt);
  const speed = Math.hypot(vx, vy);

  // Aerodynamic Drag
  const q = 0.5 * atm.density * speed * speed;
  const frontalArea = Math.max(1.5, Math.min(12, blueprint.parts.length * 0.45));
  const cd = 0.25;
  const dragMagnitude = cd * q * frontalArea;

  const dragX = speed > 0.01 ? -dragMagnitude * (vx / speed) : 0;
  const dragY = speed > 0.01 ? -dragMagnitude * (vy / speed) : 0;

  // Thrust Vector
  const pitchRad = (pitchDeg * Math.PI) / 180;
  const thrustX = engineThrustN * Math.cos(pitchRad);
  const thrustY = engineThrustN * Math.sin(pitchRad);

  // Spherical Newtonian Gravity
  const rCurrent = EARTH_RADIUS + Math.max(0, alt);
  const localG = MU_EARTH / (rCurrent * rCurrent);
  const gravityForceY = -totalMassKg * localG;

  const netFx = thrustX + dragX;
  let netFy = thrustY + dragY + gravityForceY;

  if (alt <= 0 && netFy < 0) {
    netFy = 0; // Ground support on launchpad
  }

  return {
    ax: netFx / totalMassKg,
    ay: netFy / totalMassKg,
    q,
    dragX,
    dragY,
    localG
  };
}

/**
 * High-Precision 4th-Order Runge-Kutta (RK4) Flight Physics Integrator
 */
export function stepFlightPhysics(
  state: FlightState,
  blueprint: RocketBlueprint,
  dt: number,
  guidanceMode: 'manual' | 'auto' = 'manual'
): FlightState {
  if (!state.isLaunched || state.isPaused || state.aborted || state.isCrashed) {
    return state;
  }

  const stageInfo = calculateCurrentStageMassAndThrust(
    blueprint,
    state.currentStageIndex,
    state.altitude
  );

  // Prograde-Aligned True Gravity Turn Algorithm
  let pitch = state.pitch;
  if (guidanceMode === 'auto') {
    if (state.altitude > 800 && state.altitude < 120000) {
      if (state.velocity.vx > 10 && state.velocity.vy > 0) {
        // True prograde angle matching vehicle velocity vector
        const progradeAngleDeg = (Math.atan2(state.velocity.vy, state.velocity.vx) * 180) / Math.PI;
        pitch = pitch + (progradeAngleDeg - pitch) * Math.min(1, dt * 1.5);
      } else {
        // Initial pitch kick towards East (+X)
        const turnFraction = Math.min(1, (state.altitude - 800) / 70000);
        const targetPitch = Math.max(0, 90 - turnFraction * 90);
        pitch = pitch + (targetPitch - pitch) * dt * 0.5;
      }
    }
  }

  // Throttle & Fuel Depletion
  const throttle = state.throttle;
  let currentFuel = Math.max(0, state.fuelMassRemaining);
  let engineThrustN = 0;

  if (throttle > 0 && currentFuel > 0.001) {
    engineThrustN = stageInfo.thrustN * throttle;
    const mdot = engineThrustN / (stageInfo.isp * G_EARTH); // kg/s
    currentFuel = Math.max(0, currentFuel - (mdot * dt) / 1000);
  }

  const totalMassKg = (stageInfo.activeVehicleDryMassTons + currentFuel) * 1000;

  // Runge-Kutta 4 Integration Stages
  const k1 = getFlightAccelerations(state.altitude, state.velocity.vx, state.velocity.vy, pitch, engineThrustN, totalMassKg, blueprint);

  const vHalfX1 = state.velocity.vx + 0.5 * dt * k1.ax;
  const vHalfY1 = state.velocity.vy + 0.5 * dt * k1.ay;
  const altHalf1 = state.altitude + 0.5 * dt * state.velocity.vy;
  const k2 = getFlightAccelerations(altHalf1, vHalfX1, vHalfY1, pitch, engineThrustN, totalMassKg, blueprint);

  const vHalfX2 = state.velocity.vx + 0.5 * dt * k2.ax;
  const vHalfY2 = state.velocity.vy + 0.5 * dt * k2.ay;
  const altHalf2 = state.altitude + 0.5 * dt * vHalfY1;
  const k3 = getFlightAccelerations(altHalf2, vHalfX2, vHalfY2, pitch, engineThrustN, totalMassKg, blueprint);

  const vEndX = state.velocity.vx + dt * k3.ax;
  const vEndY = state.velocity.vy + dt * k3.ay;
  const altEnd = state.altitude + dt * vHalfY2;
  const k4 = getFlightAccelerations(altEnd, vEndX, vEndY, pitch, engineThrustN, totalMassKg, blueprint);

  // Weighted sum
  const avgAx = (k1.ax + 2 * k2.ax + 2 * k3.ax + k4.ax) / 6;
  const avgAy = (k1.ay + 2 * k2.ay + 2 * k3.ay + k4.ay) / 6;

  let newVx = state.velocity.vx + avgAx * dt;
  let newVy = state.velocity.vy + avgAy * dt;
  let newDownrange = state.downrange + (state.velocity.vx + newVx) * 0.5 * dt;
  let newAltitude = state.altitude + (state.velocity.vy + newVy) * 0.5 * dt;

  let isCrashed = false;
  let isDisintegrated = false;
  let crashImpactSpeed = 0;

  // Ground Impact & Crash Dynamics
  if (newAltitude <= 0) {
    newAltitude = 0;
    if (newVy < -12 || state.velocity.vy < -12) {
      isCrashed = true;
      isDisintegrated = true;
      crashImpactSpeed = Math.hypot(newVx, newVy);
      newVx = 0;
      newVy = 0;
    } else {
      newVx = 0;
      newVy = 0;
    }
  }

  const newSpeed = Math.hypot(newVx, newVy);
  const gTotal = Math.sqrt(avgAx * avgAx + (avgAy + k1.localG) * (avgAy + k1.localG)) / G_EARTH;

  // Atmospheric Compression Re-Entry Heat Flux & Plasma
  const atm = calculateAtmosphere(newAltitude);
  const noseRadiusM = 0.5;
  const kSutton = 1.7415e-4;
  let heatFluxKwM2 = 0;
  if (newSpeed > 300 && atm.density > 0.0001) {
    heatFluxKwM2 = (kSutton * Math.sqrt(atm.density / noseRadiusM) * Math.pow(newSpeed, 3)) / 1000;
  }

  const emissivity = 0.85;
  const radSkinTempK = Math.min(4500, atm.temperature + Math.pow(Math.max(0, (heatFluxKwM2 * 1000) / (emissivity * STEFAN_BOLTZMANN)), 0.25));

  // Re-entry structural disintegration check
  if (radSkinTempK > 3900 && newAltitude > 10000) {
    isDisintegrated = true;
    isCrashed = true;
  }

  // Exact Keplerian Orbital Elements
  const rNew = EARTH_RADIUS + newAltitude;
  const specificEnergy = (newSpeed * newSpeed) / 2 - MU_EARTH / rNew;

  let apoapsis = newAltitude;
  let periapsis = 0;
  let inOrbit = false;
  let isEscapeTrajectory = false;

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
    isEscapeTrajectory = true;
    apoapsis = Infinity;
    periapsis = Math.max(0, newAltitude);
  }

  const maxQ = Math.max(state.maxQReached, k1.q);

  // Trajectory history
  const history = [...state.trajectoryHistory];
  const lastPoint = history[history.length - 1];
  if (!lastPoint || Math.hypot(newDownrange - lastPoint.x, newAltitude - lastPoint.y) > 120) {
    history.push({ x: newDownrange, y: newAltitude });
    if (history.length > 900) history.shift();
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
    dynamicPressure: Math.round(k1.q),
    maxQReached: Math.round(maxQ),
    apoapsis: isEscapeTrajectory ? Infinity : Math.round(apoapsis),
    periapsis: Math.round(periapsis),
    trajectoryHistory: history,
    inOrbit,
    isEscapeTrajectory,
    reentryHeatFlux: Math.round(heatFluxKwM2),
    plasmaTemperatureK: Math.round(radSkinTempK),
    vehicleSkinTempK: Math.round(radSkinTempK),
    isCrashed,
    isDisintegrated,
    crashImpactSpeed: Math.round(crashImpactSpeed),
    aborted: isCrashed || isDisintegrated ? true : state.aborted
  };
}
