import type { AeroTelemetry, WindTunnelState } from '../types';

export const GAMMA = 1.4;
export const R_AIR = 287.058;
export const STEFAN_BOLTZMANN = 5.670374e-8;
export const SEA_LEVEL_DENSITY = 1.225;
export const SEA_LEVEL_TEMP = 288.15;
export const SCALE_HEIGHT = 8500;

export function calculateAtmosphere(altitudeMeters: number): { density: number; temperature: number; pressure: number; speedOfSound: number } {
  const h = Math.max(0, altitudeMeters);
  
  let T: number;
  if (h < 11000) {
    T = SEA_LEVEL_TEMP - 0.0065 * h;
  } else if (h < 25000) {
    T = 216.65;
  } else if (h < 47000) {
    T = 216.65 + 0.0028 * (h - 25000);
  } else {
    T = Math.max(180, 270.65 - 0.0028 * (h - 47000));
  }

  const density = SEA_LEVEL_DENSITY * Math.exp(-h / SCALE_HEIGHT);
  const pressure = density * R_AIR * T;
  const speedOfSound = Math.sqrt(GAMMA * R_AIR * T);

  return { density, temperature: T, pressure, speedOfSound };
}

export function calculateAeroTelemetry(
  state: WindTunnelState,
  baseCd: number = 0.25,
  frontalAreaM2: number = 3.14,
  lengthMeters: number = 20.0
): AeroTelemetry {
  const { mach, angleToGo, airDensity, airTemperature } = state;
  const radAoA = (angleToGo * Math.PI) / 180;
  const speedOfSound = Math.sqrt(GAMMA * R_AIR * airTemperature);
  const freestreamV = mach * speedOfSound;
  const q = 0.5 * airDensity * freestreamV * freestreamV;

  let waveDragCoeff = 0;
  if (mach >= 0.8 && mach <= 1.2) {
    waveDragCoeff = 0.25 * Math.sin(((mach - 0.8) / 0.4) * Math.PI);
  } else if (mach > 1.2) {
    waveDragCoeff = 0.15 / Math.sqrt(mach * mach - 1);
  }

  const cdInduced = 1.2 * Math.sin(radAoA) * Math.sin(radAoA);
  const totalCd = baseCd + waveDragCoeff + cdInduced;

  const bodyCl = 0.5 * Math.sin(2 * radAoA);
  const finControlFactor = Math.sin((state.finDeflectionAngle * Math.PI) / 180) * 0.4;
  const totalCl = bodyCl + finControlFactor;

  const dragForce = (totalCd * q * frontalAreaM2) / 1000;
  const liftForce = (totalCl * q * frontalAreaM2) / 1000;
  const liftToDragRatio = totalCd > 0.001 ? totalCl / totalCd : 0;

  const recoveryFactor = 0.9;
  const stagTemp = airTemperature * (1 + recoveryFactor * ((GAMMA - 1) / 2) * mach * mach);

  const noseRadiusM = 0.5;
  const kSutton = 1.7415e-4;
  let heatFluxKwM2 = 0;
  if (freestreamV > 200 && airDensity > 0.0001) {
    heatFluxKwM2 = (kSutton * Math.sqrt(airDensity / noseRadiusM) * Math.pow(freestreamV, 3)) / 1000;
  }

  const kinematicViscosity = 1.5e-5;
  const reynoldsNum = Math.max(1000, (freestreamV * lengthMeters) / kinematicViscosity);
  const boundaryLayerThicknessMm = (0.37 * lengthMeters * 1000) / Math.pow(reynoldsNum, 0.2);

  let shockwaveAngle = 90;
  if (mach > 1.0) {
    shockwaveAngle = (Math.asin(1 / mach) * 180) / Math.PI;
  }

  const stabilityMargin = 1.5;
  const aeroMoment = -liftForce * stabilityMargin;

  return {
    mach: parseFloat(mach.toFixed(2)),
    dragForce: parseFloat(dragForce.toFixed(2)),
    liftForce: parseFloat(liftForce.toFixed(2)),
    dragCoefficient: parseFloat(totalCd.toFixed(3)),
    liftCoefficient: parseFloat(totalCl.toFixed(3)),
    liftToDragRatio: parseFloat(liftToDragRatio.toFixed(2)),
    stagnationTemperature: Math.round(stagTemp),
    maxHeatFlux: Math.round(heatFluxKwM2),
    boundaryLayerThickness: parseFloat(boundaryLayerThicknessMm.toFixed(1)),
    shockwaveAngle: parseFloat(shockwaveAngle.toFixed(1)),
    aerodynamicMoment: parseFloat(aeroMoment.toFixed(2)),
    finControlEffectiveness: parseFloat((Math.abs(finControlFactor) * 100).toFixed(1))
  };
}

export function calculateNozzlePlume(chamberPressureMpa: number, ambientPressurePa: number, expansionRatio: number = 16) {
  const chamberPressurePa = chamberPressureMpa * 1e6;
  const exitPressurePa = chamberPressurePa / Math.pow(expansionRatio, 1.3);
  const pressureRatio = exitPressurePa / Math.max(1, ambientPressurePa);

  let plumeState: 'underexpanded' | 'ideally_expanded' | 'overexpanded';
  if (pressureRatio > 1.15) {
    plumeState = 'underexpanded';
  } else if (pressureRatio < 0.85) {
    plumeState = 'overexpanded';
  } else {
    plumeState = 'ideally_expanded';
  }

  const exitMach = 3.2;
  const diamondSpacing = 1.34 * Math.sqrt(exitMach * exitMach - 1);

  return {
    exitPressurePa,
    pressureRatio: parseFloat(pressureRatio.toFixed(2)),
    plumeState,
    diamondSpacing
  };
}
