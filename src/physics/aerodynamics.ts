import type { AeroTelemetry, WindTunnelState } from '../types';

export const GAMMA = 1.4;
export const R_AIR = 287.058;
export const STEFAN_BOLTZMANN = 5.670374e-8;
export const SEA_LEVEL_DENSITY = 1.225;
export const SEA_LEVEL_TEMP = 288.15;
export const SCALE_HEIGHT = 8500;

export function calculateAtmosphere(altitudeMeters: number): {
  density: number;
  temperature: number;
  pressure: number;
  speedOfSound: number;
} {
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

/**
 * Solves the supersonic Theta-Beta-Mach oblique shock wave equation:
 * tan(theta) = 2 cot(beta) * (M1^2 sin^2(beta) - 1) / (M1^2 (gamma + cos(2 beta)) + 2)
 */
export function solveObliqueShockBeta(M: number, thetaDeg: number): number {
  if (M <= 1.0) return 90;
  const thetaRad = Math.max(0.01, (Math.abs(thetaDeg) * Math.PI) / 180);
  const mu = Math.asin(1 / M);

  // Initial estimate with weak shock branch
  let beta = mu + 0.2;
  for (let iter = 0; iter < 12; iter++) {
    const sinB = Math.sin(beta);
    const cosB = Math.cos(beta);
    const cotB = cosB / sinB;
    const sin2B = sinB * sinB;
    const cos2B = Math.cos(2 * beta);

    const num = M * M * sin2B - 1;
    const den = M * M * (GAMMA + cos2B) + 2;
    const f = 2 * cotB * (num / den) - Math.tan(thetaRad);

    // Approximate derivative df/dbeta
    const delta = 1e-4;
    const sinBp = Math.sin(beta + delta);
    const cosBp = Math.cos(beta + delta);
    const cotBp = cosBp / sinBp;
    const numP = M * M * sinBp * sinBp - 1;
    const denP = M * M * (GAMMA + Math.cos(2 * (beta + delta))) + 2;
    const fp = 2 * cotBp * (numP / denP) - Math.tan(thetaRad);
    const df = (fp - f) / delta;

    if (Math.abs(df) < 1e-6) break;
    const step = f / df;
    beta -= step;
    if (beta < mu || beta > Math.PI / 2) {
      beta = Math.min(Math.PI / 2, Math.max(mu, beta));
      break;
    }
  }

  return (beta * 180) / Math.PI;
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

  // Reynolds number and skin friction calculation
  const kinematicViscosity = 1.5e-5;
  const reynoldsNum = Math.max(1000, (freestreamV * lengthMeters) / kinematicViscosity);
  const skinFrictionCoeff = 0.074 / Math.pow(reynoldsNum, 0.2); // Turbulent Prandtl-Schlichting

  // Transonic & Supersonic Wave Drag
  let waveDragCoeff = 0;
  if (mach >= 0.8 && mach <= 1.2) {
    waveDragCoeff = 0.28 * Math.sin(((mach - 0.8) / 0.4) * Math.PI);
  } else if (mach > 1.2) {
    waveDragCoeff = 0.16 / Math.sqrt(mach * mach - 1);
  }

  // Stall dynamics for high angles of attack
  const isStalled = Math.abs(angleToGo) > 16.0;
  const stallFactor = isStalled ? 1.8 + Math.pow((Math.abs(angleToGo) - 16) / 10, 2) : 1.0;

  const cdInduced = 1.25 * Math.sin(radAoA) * Math.sin(radAoA) * stallFactor;
  const totalCd = (baseCd + skinFrictionCoeff * 8 + waveDragCoeff + cdInduced) * (isStalled ? 1.5 : 1.0);

  // Lift: linear regime + non-linear crossflow separation
  const clLinear = 0.55 * Math.sin(2 * radAoA);
  const clCrossflow = 1.2 * Math.sin(radAoA) * Math.abs(Math.sin(radAoA));
  const finControlFactor = Math.sin((state.finDeflectionAngle * Math.PI) / 180) * 0.45;
  const totalCl = isStalled ? (clLinear * 0.4 + finControlFactor) : (clLinear + clCrossflow + finControlFactor);

  const dragForce = (totalCd * q * frontalAreaM2) / 1000;
  const liftForce = (totalCl * q * frontalAreaM2) / 1000;
  const liftToDragRatio = totalCd > 0.001 ? totalCl / totalCd : 0;

  // Stagnation Temperature & Sutton-Graves Heat Flux
  const recoveryFactor = 0.89;
  const stagTemp = airTemperature * (1 + recoveryFactor * ((GAMMA - 1) / 2) * mach * mach);

  const noseRadiusM = 0.5;
  const kSutton = 1.7415e-4;
  let heatFluxKwM2 = 0;
  if (freestreamV > 180 && airDensity > 0.0001) {
    heatFluxKwM2 = (kSutton * Math.sqrt(airDensity / noseRadiusM) * Math.pow(freestreamV, 3)) / 1000;
  }

  const boundaryLayerThicknessMm = (0.37 * lengthMeters * 1000) / Math.pow(reynoldsNum, 0.2);

  // Accurate Oblique Shock Conical Angle
  const coneHalfAngle = 15.0; // standard nose cone angle
  const shockwaveAngle = mach > 1.0 ? solveObliqueShockBeta(mach, coneHalfAngle) : 90;

  const stabilityMargin = 1.6;
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
    finControlEffectiveness: parseFloat((Math.abs(finControlFactor) * 100).toFixed(1)),
    reynoldsNumber: Math.round(reynoldsNum),
    skinFrictionCoefficient: parseFloat(skinFrictionCoeff.toFixed(4)),
    isStalled
  };
}

export function calculateNozzlePlume(
  chamberPressureMpa: number,
  ambientPressurePa: number,
  expansionRatio: number = 16
) {
  const chamberPressurePa = chamberPressureMpa * 1e6;
  const exitPressurePa = (chamberPressurePa / Math.pow(expansionRatio, 1.3)) * 0.12;
  const pressureRatio = ambientPressurePa > 0 ? exitPressurePa / ambientPressurePa : 10;

  // Underexpanded vs Overexpanded Shock Diamond Cell Spacing
  const exitMach = 3.2;
  const diamondCellSpacingM = 1.3 * 1.5 * Math.sqrt(Math.max(0.1, exitMach * exitMach - 1));

  return {
    exitPressurePa,
    pressureRatio: parseFloat(pressureRatio.toFixed(2)),
    isUnderExpanded: pressureRatio > 1.0,
    isOverExpanded: pressureRatio < 1.0,
    diamondCellSpacingM: parseFloat(diamondCellSpacingM.toFixed(2))
  };
}
