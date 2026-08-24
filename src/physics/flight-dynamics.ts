import type { FlightState, RocketBlueprint } from '../types';
import { calculateRocketProperties, PARTS_CATALOG } from './rocket-math';
import { calculateAtmosphere } from './aerodynamics';

export const G_EARTH = 9.80665;
export const EARTH_RADIUS = 6371000;

export function initFlightState(blueprint: RocketBlueprint): FlightState {
  const props = calculateRocketProperties(blueprint);
  const initialStage = props.stagesDeltaV.length > 0 ? props.stagesDeltaV[0].stage : 1;

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
    currentStageIndex: initialStage,
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

export function stepFlightPhysics(
  state: FlightState,
  blueprint: RocketBlueprint,
  dt: number,
  userPitchInput?: number,
  userThrottleInput?: number
): FlightState {
  if (!state.isLaunched || state.isPaused || state.aborted) {
    return state;
  }

  const props = calculateRocketProperties(blueprint);
  const atm = calculateAtmosphere(state.altitude);

  let pitch = state.pitch;
  if (userPitchInput !== undefined) {
    pitch = Math.max(0, Math.min(90, pitch + userPitchInput * dt * 15));
  } else {
    if (state.altitude > 1500 && state.altitude < 60000) {
      const turnProgress = (state.altitude - 1500) / 45000;
      const targetPitch = Math.max(10, 90 - turnProgress * 75);
      pitch = pitch + (targetPitch - pitch) * dt * 0.4;
    }
  }

  const throttle = userThrottleInput !== undefined ? Math.max(0, Math.min(1, userThrottleInput)) : state.throttle;

  let currentFuel = Math.max(0, state.fuelMassRemaining);
  const totalMass = (props.dryMass + currentFuel) * 1000;

  let currentStageThrustN = 0;
  let currentStageIsp = 300;

  for (const part of blueprint.parts) {
    if (part.stage === state.currentStageIndex) {
      const def = PARTS_CATALOG[part.partType];
      if (def && def.thrust) {
        const atmFactor = Math.min(1, atm.density / 1.225);
        const effectiveIsp = (def.ispAtm || 280) * atmFactor + (def.ispVac || 320) * (1 - atmFactor);
        const seaThrust = (def.seaLevelThrust || def.thrust * 0.85) * 1000;
        const vacThrust = def.thrust * 1000;
        const thrustN = seaThrust * atmFactor + vacThrust * (1 - atmFactor);

        currentStageThrustN += thrustN;
        currentStageIsp = effectiveIsp;
      }
    }
  }

  if (currentFuel <= 0) {
    currentStageThrustN = 0;
  }

  if (currentStageThrustN > 0 && throttle > 0) {
    const mdot = (currentStageThrustN * throttle) / (currentStageIsp * G_EARTH);
    currentFuel = Math.max(0, currentFuel - (mdot * dt) / 1000);
  }

  const pitchRad = (pitch * Math.PI) / 180;
  const thrustX = currentStageThrustN * throttle * Math.cos(pitchRad);
  const thrustY = currentStageThrustN * throttle * Math.sin(pitchRad);

  const currentSpeed = Math.sqrt(state.velocity.vx * state.velocity.vx + state.velocity.vy * state.velocity.vy);
  const q = 0.5 * atm.density * currentSpeed * currentSpeed;
  const frontalArea = 3.14;
  const cd = 0.28;
  const dragMagnitude = cd * q * frontalArea;

  const dragX = currentSpeed > 0.1 ? -dragMagnitude * (state.velocity.vx / currentSpeed) : 0;
  const dragY = currentSpeed > 0.1 ? -dragMagnitude * (state.velocity.vy / currentSpeed) : 0;

  const rRatio = EARTH_RADIUS / (EARTH_RADIUS + state.altitude);
  const localG = G_EARTH * rRatio * rRatio;
  const gravityForceY = -totalMass * localG;

  const netFx = thrustX + dragX;
  const netFy = thrustY + dragY + gravityForceY;

  const ax = netFx / Math.max(100, totalMass);
  const ay = netFy / Math.max(100, totalMass);

  const gTotal = Math.sqrt(ax * ax + (ay + localG) * (ay + localG)) / G_EARTH;

  const newVx = state.velocity.vx + ax * dt;
  const newVy = state.velocity.vy + ay * dt;
  const newDownrange = state.downrange + newVx * dt;
  const newAltitude = Math.max(0, state.altitude + newVy * dt);

  const newSpeed = Math.sqrt(newVx * newVx + newVy * newVy);

  const rCurrent = EARTH_RADIUS + newAltitude;
  const mu = 3.986004418e14;
  const specificEnergy = (newSpeed * newSpeed) / 2 - mu / rCurrent;
  
  let apoapsis = newAltitude;
  let periapsis = 0;
  let inOrbit = false;

  if (specificEnergy < 0) {
    const semiMajorAxis = -mu / (2 * specificEnergy);
    const angularMomentum = rCurrent * Math.abs(newVx);
    const eccSq = Math.max(0, 1 - (angularMomentum * angularMomentum) / (mu * semiMajorAxis));
    const ecc = Math.sqrt(eccSq);

    apoapsis = Math.max(newAltitude, semiMajorAxis * (1 + ecc) - EARTH_RADIUS);
    periapsis = Math.max(0, semiMajorAxis * (1 - ecc) - EARTH_RADIUS);

    if (periapsis > 120000 && newAltitude > 120000) {
      inOrbit = true;
    }
  }

  const maxQ = Math.max(state.maxQReached, q);

  const history = [...state.trajectoryHistory];
  if (history.length === 0 || Math.hypot(newDownrange - history[history.length - 1].x, newAltitude - history[history.length - 1].y) > 200) {
    history.push({ x: newDownrange, y: newAltitude });
    if (history.length > 500) history.shift();
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
    throttle,
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
