import type { AsteroidConfig } from '../types';

export interface InterceptorMissionConfig {
  craftMassKg: number; // e.g. 600 kg (DART spacecraft mass)
  impactSpeedKmS: number; // e.g. 6.1 km/s
  betaMomentumFactor: number; // 1.0 (pure inelastic) to 4.0 (porous rubble ejecta recoil)
  leadTimeDays: number; // Days before Earth impact (e.g. 365 days = 1 year)
  launchVehicle: string;
}

export interface PlanetaryDefenseResult {
  asteroidMassKg: number;
  momentumTransferredNs: number;
  deltaVMps: number; // Millimeters/second velocity change
  deflectionDistanceKm: number; // Earth miss distance at closest approach
  earthRadiusKm: number;
  isDiverted: boolean;
  divergencePercentage: number;
  status: 'SAFE_DEFLECTION' | 'MARGINAL_CLEARANCE' | 'IMPACT_UNAVOIDABLE';
  summaryDescription: string;
}

export const DART_DEFAULT_MISSION: InterceptorMissionConfig = {
  craftMassKg: 610,
  impactSpeedKmS: 6.6,
  betaMomentumFactor: 2.4,
  leadTimeDays: 180,
  launchVehicle: 'Falcon 9 / Atlas V'
};

export function calculatePlanetaryDeflection(
  asteroidConfig: AsteroidConfig,
  interceptor: InterceptorMissionConfig
): PlanetaryDefenseResult {
  const radiusM = (asteroidConfig.diameter || 100) / 2;
  const volumeM3 = (4 / 3) * Math.PI * Math.pow(radiusM, 3);
  const asteroidMassKg = volumeM3 * (asteroidConfig.density || 3000);

  const craftSpeedMps = interceptor.impactSpeedKmS * 1000;
  const rawImpulseNs = interceptor.craftMassKg * craftSpeedMps;
  // Enhanced momentum transfer with ejecta recoil: Delta_P = beta * m * v
  const totalMomentumTransferredNs = interceptor.betaMomentumFactor * rawImpulseNs;

  // Delta-V imparted to asteroid (m/s)
  const deltaVMps = totalMomentumTransferredNs / Math.max(1, asteroidMassKg);

  // Deflection distance: Delta_x = Delta_v * t_lead
  const leadTimeSeconds = interceptor.leadTimeDays * 86400;
  const deflectionDistanceM = deltaVMps * leadTimeSeconds;
  const deflectionDistanceKm = deflectionDistanceM / 1000;

  const earthRadiusKm = 6371;
  const safeMarginKm = 25000; // Safe clearance beyond geostationary orbit

  let status: 'SAFE_DEFLECTION' | 'MARGINAL_CLEARANCE' | 'IMPACT_UNAVOIDABLE' = 'IMPACT_UNAVOIDABLE';
  let isDiverted = false;

  if (deflectionDistanceKm >= safeMarginKm) {
    status = 'SAFE_DEFLECTION';
    isDiverted = true;
  } else if (deflectionDistanceKm >= earthRadiusKm) {
    status = 'MARGINAL_CLEARANCE';
    isDiverted = true;
  }

  const divergencePercentage = Math.min(100, (deflectionDistanceKm / safeMarginKm) * 100);

  let summaryDescription = '';
  if (status === 'SAFE_DEFLECTION') {
    summaryDescription = `SUCCESSFUL DEFLECTION: Asteroid trajectory perturbed by ${(deltaVMps * 1000).toFixed(2)} mm/s. Earth miss distance is ${Math.round(deflectionDistanceKm).toLocaleString()} km (safe orbital clearance).`;
  } else if (status === 'MARGINAL_CLEARANCE') {
    summaryDescription = `MARGINAL PASS: Trajectory shifted ${Math.round(deflectionDistanceKm).toLocaleString()} km. Asteroid grazes outer exosphere but avoids direct surface collision.`;
  } else {
    summaryDescription = `INSUFFICIENT DEFLECTION: Kinetic impulse only shifted path by ${Math.round(deflectionDistanceKm).toLocaleString()} km (less than Earth radius 6,371 km). High-mass or late lead-time requires nuclear standoff or gravity tractor.`;
  }

  return {
    asteroidMassKg,
    momentumTransferredNs: totalMomentumTransferredNs,
    deltaVMps: deltaVMps * 1000, // Return in mm/s for readability
    deflectionDistanceKm: parseFloat(deflectionDistanceKm.toFixed(1)),
    earthRadiusKm,
    isDiverted,
    divergencePercentage: parseFloat(divergencePercentage.toFixed(1)),
    status,
    summaryDescription
  };
}
