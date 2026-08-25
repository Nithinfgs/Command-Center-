/**
 * Relative Orbital Mechanics & 6-DoF Spacecraft Docking Physics.
 * Solves Clohessy-Wiltshire (Hill's) equations for orbital rendezvous
 * and models magnetic capture port latching for space station assembly.
 */

export interface DockingTarget {
  id: string;
  name: string;
  stationType: 'iss' | 'lunar_gateway' | 'orbital_fuel_depot' | 'custom_station';
  orbitAltitudeKm: number;
  relativePos: { x: number; y: number; z: number }; // Relative coordinates in LVLH frame (meters)
  relativeVel: { vx: number; vy: number; vz: number }; // m/s
  dockingPortOffset: { x: number; y: number; z: number };
  alignmentAngleDeg: number;
  isDocked: boolean;
  captureDistanceM: number;
  modules: Array<{ name: string; massKg: number; color: string }>;
}

export const PRESET_STATIONS: DockingTarget[] = [
  {
    id: 'iss_core',
    name: 'International Space Station (ISS)',
    stationType: 'iss',
    orbitAltitudeKm: 420,
    relativePos: { x: 120, y: 35, z: 0 },
    relativeVel: { vx: -1.2, vy: -0.4, vz: 0 },
    dockingPortOffset: { x: 0, y: 0, z: 0 },
    alignmentAngleDeg: 12,
    isDocked: false,
    captureDistanceM: 2.5,
    modules: [
      { name: 'Zarya FGB Core', massKg: 19300, color: '#94A3B8' },
      { name: 'Unity Node 1', massKg: 11600, color: '#CBD5E1' },
      { name: 'Destiny Laboratory', massKg: 14500, color: '#E2E8F0' },
      { name: 'Truss & Solar Arrays', massKg: 45000, color: '#38BDF8' }
    ]
  },
  {
    id: 'gateway_lunar',
    name: 'Lunar Gateway Station',
    stationType: 'lunar_gateway',
    orbitAltitudeKm: 1500,
    relativePos: { x: 350, y: 80, z: 0 },
    relativeVel: { vx: -2.5, vy: -0.8, vz: 0 },
    dockingPortOffset: { x: 0, y: 0, z: 0 },
    alignmentAngleDeg: 28,
    isDocked: false,
    captureDistanceM: 2.0,
    modules: [
      { name: 'PPE Power & Propulsion', massKg: 8500, color: '#FBBF24' },
      { name: 'HALO Habitation Module', massKg: 6200, color: '#E2E8F0' },
      { name: 'Lunar Airlock', massKg: 4800, color: '#94A3B8' }
    ]
  }
];

export function stepRendezvousPhysics(
  target: DockingTarget,
  rcsTranslation: { fx: number; fy: number; fz: number },
  rcsTorque: number,
  dt: number
): DockingTarget {
  if (target.isDocked) return target;

  const n = Math.sqrt(3.986004418e14 / Math.pow((target.orbitAltitudeKm + 6371) * 1000, 3)); // Mean orbital motion

  // Clohessy-Wiltshire relative orbital acceleration:
  // a_x = 2*n*v_y + 3*n^2*x + F_x/m
  // a_y = -2*n*v_x + F_y/m
  // a_z = -n^2*z + F_z/m
  const ax = 2 * n * target.relativeVel.vy + 3 * n * n * target.relativePos.x + rcsTranslation.fx;
  const ay = -2 * n * target.relativeVel.vx + rcsTranslation.fy;
  const az = -n * n * target.relativePos.z + rcsTranslation.fz;

  let newVx = target.relativeVel.vx + ax * dt;
  let newVy = target.relativeVel.vy + ay * dt;
  let newVz = target.relativeVel.vz + az * dt;

  let newX = target.relativePos.x + newVx * dt;
  let newY = target.relativePos.y + newVy * dt;
  let newZ = target.relativePos.z + newVz * dt;

  let newAngle = target.alignmentAngleDeg + rcsTorque * dt * 15;
  newAngle = ((newAngle + 180) % 360) - 180;

  const distance = Math.hypot(newX, newY, newZ);
  const closingSpeed = Math.hypot(newVx, newVy, newVz);

  // Magnetic Docking Port Latch
  let isDocked = false;
  if (distance <= target.captureDistanceM && closingSpeed < 0.6 && Math.abs(newAngle) < 8) {
    isDocked = true;
    newX = 0;
    newY = 0;
    newZ = 0;
    newVx = 0;
    newVy = 0;
    newVz = 0;
    newAngle = 0;
  }

  return {
    ...target,
    relativePos: { x: parseFloat(newX.toFixed(2)), y: parseFloat(newY.toFixed(2)), z: parseFloat(newZ.toFixed(2)) },
    relativeVel: { vx: parseFloat(newVx.toFixed(3)), vy: parseFloat(newVy.toFixed(3)), vz: parseFloat(newVz.toFixed(3)) },
    alignmentAngleDeg: parseFloat(newAngle.toFixed(1)),
    isDocked
  };
}
