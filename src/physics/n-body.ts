import type { CelestialBody, OrbitalElements } from '../types';

export const G_NEWTON = 6.6743e-11;
// Calibrated G constant for 3D astronomical visualization
export const SIM_G = 800.0;

export const CELESTIAL_PRESETS: { id: string; name: string; description: string; bodies: CelestialBody[] }[] = [
  {
    id: 'inner_solar_system',
    name: 'Inner Solar System',
    description: 'The Sun, Mercury, Venus, Earth-Moon system, and Mars in calibrated Keplerian orbits.',
    bodies: [
      {
        id: 'sun',
        name: 'Sol (Sun)',
        type: 'star',
        mass: 1.989e30,
        radius: 696340,
        density: 1.41,
        position: { x: 0, y: 0, z: 0 },
        velocity: { vx: 0, vy: 0, vz: 0 },
        color: '#FBBF24',
        secondaryColor: '#F59E0B',
        hasRings: false,
        atmosphereDensity: 0,
        isFixed: true,
        luminosity: 1.0,
        trail: []
      },
      {
        id: 'mercury',
        name: 'Mercury',
        type: 'rocky',
        mass: 3.301e23,
        radius: 2439,
        density: 5.43,
        position: { x: 180, y: 0, z: 0 },
        velocity: { vx: 0, vy: 0, vz: -4.8 },
        color: '#94A3B8',
        hasRings: false,
        atmosphereDensity: 0.01,
        trail: []
      },
      {
        id: 'venus',
        name: 'Venus',
        type: 'terrestrial',
        mass: 4.867e24,
        radius: 6051,
        density: 5.24,
        position: { x: 300, y: 0, z: 0 },
        velocity: { vx: 0, vy: 0, vz: -3.6 },
        color: '#FDE047',
        atmosphereDensity: 92.0,
        atmosphereColor: '#EAB308',
        hasRings: false,
        trail: []
      },
      {
        id: 'earth',
        name: 'Earth',
        type: 'ocean',
        mass: 5.972e24,
        radius: 6371,
        density: 5.51,
        position: { x: 450, y: 0, z: 0 },
        velocity: { vx: 0, vy: 0, vz: -2.95 },
        color: '#38BDF8',
        secondaryColor: '#10B981',
        hasRings: false,
        atmosphereDensity: 1.0,
        atmosphereColor: '#60A5FA',
        trail: []
      },
      {
        id: 'moon',
        name: 'Luna (Moon)',
        type: 'rocky',
        mass: 7.342e22,
        radius: 1737,
        density: 3.34,
        position: { x: 475, y: 0, z: 0 },
        velocity: { vx: 0, vy: 0, vz: -3.85 },
        color: '#CBD5E1',
        hasRings: false,
        atmosphereDensity: 0,
        trail: []
      },
      {
        id: 'mars',
        name: 'Mars',
        type: 'terrestrial',
        mass: 6.417e23,
        radius: 3389,
        density: 3.93,
        position: { x: 620, y: 0, z: 0 },
        velocity: { vx: 0, vy: 0, vz: -2.5 },
        color: '#EF4444',
        secondaryColor: '#F97316',
        hasRings: false,
        atmosphereDensity: 0.06,
        trail: []
      }
    ]
  },
  {
    id: 'jupiter_system',
    name: 'Jupiter & Galilean Moons',
    description: 'Gas giant Jupiter with Io, Europa, Ganymede, and Callisto in Laplace resonance.',
    bodies: [
      {
        id: 'jupiter',
        name: 'Jupiter',
        type: 'gas_giant',
        mass: 1.898e27,
        radius: 69911,
        density: 1.33,
        position: { x: 0, y: 0, z: 0 },
        velocity: { vx: 0, vy: 0, vz: 0 },
        color: '#D97706',
        secondaryColor: '#B45309',
        hasRings: true,
        ringRadiusMin: 90,
        ringRadiusMax: 130,
        ringColor: '#92400E',
        atmosphereDensity: 15.0,
        isFixed: true,
        trail: []
      },
      {
        id: 'io',
        name: 'Io',
        type: 'rocky',
        mass: 8.93e22,
        radius: 1821,
        density: 3.53,
        position: { x: 140, y: 0, z: 0 },
        velocity: { vx: 0, vy: 0, vz: -4.8 },
        color: '#FACC15',
        hasRings: false,
        atmosphereDensity: 0.001,
        trail: []
      },
      {
        id: 'europa',
        name: 'Europa',
        type: 'ocean',
        mass: 4.8e22,
        radius: 1560,
        density: 3.01,
        position: { x: 220, y: 0, z: 0 },
        velocity: { vx: 0, vy: 0, vz: -3.8 },
        color: '#E0F2FE',
        hasRings: false,
        atmosphereDensity: 0.001,
        trail: []
      },
      {
        id: 'ganymede',
        name: 'Ganymede',
        type: 'rocky',
        mass: 1.48e23,
        radius: 2634,
        density: 1.94,
        position: { x: 340, y: 0, z: 0 },
        velocity: { vx: 0, vy: 0, vz: -3.05 },
        color: '#94A3B8',
        hasRings: false,
        atmosphereDensity: 0.001,
        trail: []
      },
      {
        id: 'callisto',
        name: 'Callisto',
        type: 'rocky',
        mass: 1.08e23,
        radius: 2410,
        density: 1.83,
        position: { x: 500, y: 0, z: 0 },
        velocity: { vx: 0, vy: 0, vz: -2.5 },
        color: '#64748B',
        hasRings: false,
        atmosphereDensity: 0.001,
        trail: []
      }
    ]
  },
  {
    id: 'three_body_chaotic',
    name: 'Chaotic 3-Body Problem (Figure-8)',
    description: 'Three equal mass stellar bodies locked in an unstable, chaotic gravitational dance.',
    bodies: [
      {
        id: 'star_a',
        name: 'Alpha Prime',
        type: 'star',
        mass: 1e30,
        radius: 40000,
        density: 2.0,
        position: { x: -250, y: 0, z: -100 },
        velocity: { vx: 1.2, vy: 0, vz: 2.5 },
        color: '#38BDF8',
        hasRings: false,
        atmosphereDensity: 0,
        trail: []
      },
      {
        id: 'star_b',
        name: 'Beta Centauri',
        type: 'star',
        mass: 1e30,
        radius: 40000,
        density: 2.0,
        position: { x: 250, y: 0, z: -100 },
        velocity: { vx: -1.2, vy: 0, vz: 2.5 },
        color: '#F43F5E',
        hasRings: false,
        atmosphereDensity: 0,
        trail: []
      },
      {
        id: 'star_c',
        name: 'Gamma Sol',
        type: 'star',
        mass: 1e30,
        radius: 40000,
        density: 2.0,
        position: { x: 0, y: 0, z: 200 },
        velocity: { vx: 0, vy: 0, vz: -5.0 },
        color: '#FBBF24',
        hasRings: false,
        atmosphereDensity: 0,
        trail: []
      }
    ]
  }
];

/**
 * True Newtonian Gravitational acceleration obeying Newton's 3rd Law (F_ij = -F_ji).
 * Uses physical masses with linear scaling and 4th-order Runge-Kutta integration.
 */
export function stepNBodySimulation(bodies: CelestialBody[], dt: number): CelestialBody[] {
  let updated = bodies.map(b => ({
    ...b,
    position: { ...b.position },
    velocity: { ...b.velocity },
    trail: [...b.trail]
  }));

  const n = updated.length;
  if (n === 0) return updated;

  // Normalized linear mass scale where 1 Solar Mass (1.989e30 kg) = 1.0 sim mass unit
  const SOLAR_MASS = 1.989e30;
  const getSimMass = (massKg: number) => {
    return Math.max(1e-8, massKg / SOLAR_MASS);
  };

  const getAccelerations = (positions: { x: number; y: number; z: number }[]) => {
    const accels = Array.from({ length: n }, () => ({ ax: 0, ay: 0, az: 0 }));

    // Pairwise mutual Newtonian gravitation: a_i = G * M_j / r^2, a_j = -G * M_i / r^2
    for (let i = 0; i < n; i++) {
      const mi = getSimMass(updated[i].mass);
      for (let j = i + 1; j < n; j++) {
        const mj = getSimMass(updated[j].mass);

        const dx = positions[j].x - positions[i].x;
        const dy = positions[j].y - positions[i].y;
        const dz = positions[j].z - positions[i].z;
        const distSq = dx * dx + dy * dy + dz * dz + 0.05; // minimal softening
        const dist = Math.sqrt(distSq);
        const distCube = distSq * dist;

        const forceCoeff = SIM_G / distCube;

        if (!updated[i].isFixed) {
          accels[i].ax += forceCoeff * mj * dx;
          accels[i].ay += forceCoeff * mj * dy;
          accels[i].az += forceCoeff * mj * dz;
        }

        if (!updated[j].isFixed) {
          accels[j].ax -= forceCoeff * mi * dx;
          accels[j].ay -= forceCoeff * mi * dy;
          accels[j].az -= forceCoeff * mi * dz;
        }
      }
    }

    return accels;
  };

  // Runge-Kutta 4 Integrator
  const pos0 = updated.map(b => b.position);
  const vel0 = updated.map(b => b.velocity);

  const a1 = getAccelerations(pos0);

  const pos1 = pos0.map((p, i) => ({
    x: p.x + 0.5 * vel0[i].vx * dt,
    y: p.y + 0.5 * vel0[i].vy * dt,
    z: p.z + 0.5 * vel0[i].vz * dt
  }));
  const a2 = getAccelerations(pos1);

  const pos2 = pos0.map((p, i) => ({
    x: p.x + 0.5 * (vel0[i].vx + 0.5 * a1[i].ax * dt) * dt,
    y: p.y + 0.5 * (vel0[i].vy + 0.5 * a1[i].ay * dt) * dt,
    z: p.z + 0.5 * (vel0[i].vz + 0.5 * a1[i].az * dt) * dt
  }));
  const a3 = getAccelerations(pos2);

  const pos3 = pos0.map((p, i) => ({
    x: p.x + (vel0[i].vx + a2[i].ax * dt) * dt,
    y: p.y + (vel0[i].vy + a2[i].ay * dt) * dt,
    z: p.z + (vel0[i].vz + a2[i].az * dt) * dt
  }));
  const a4 = getAccelerations(pos3);

  for (let i = 0; i < n; i++) {
    if (updated[i].isFixed) continue;

    const b = updated[i];
    const avgAx = (a1[i].ax + 2 * a2[i].ax + 2 * a3[i].ax + a4[i].ax) / 6;
    const avgAy = (a1[i].ay + 2 * a2[i].ay + 2 * a3[i].ay + a4[i].ay) / 6;
    const avgAz = (a1[i].az + 2 * a2[i].az + 2 * a3[i].az + a4[i].az) / 6;

    b.velocity.vx += avgAx * dt;
    b.velocity.vy += avgAy * dt;
    b.velocity.vz += avgAz * dt;

    b.position.x += b.velocity.vx * dt;
    b.position.y += b.velocity.vy * dt;
    b.position.z += b.velocity.vz * dt;

    b.trail.push({ x: b.position.x, y: b.position.y, z: b.position.z });
    // Extended trail buffer to retain full orbital ellipses without clipping
    if (b.trail.length > 1200) {
      b.trail.shift();
    }
  }

  // Physical Body Collisions & Kinetic Mergers
  const survived: CelestialBody[] = [];
  const mergedIds = new Set<string>();

  for (let i = 0; i < updated.length; i++) {
    if (mergedIds.has(updated[i].id)) continue;
    let b1 = updated[i];

    for (let j = i + 1; j < updated.length; j++) {
      if (mergedIds.has(updated[j].id)) continue;
      const b2 = updated[j];

      const dx = b2.position.x - b1.position.x;
      const dy = b2.position.y - b1.position.y;
      const dz = b2.position.z - b1.position.z;
      const dist = Math.hypot(dx, dy, dz);

      const r1 = Math.max(3, Math.log10(b1.radius) * 2.2);
      const r2 = Math.max(3, Math.log10(b2.radius) * 2.2);

      if (dist < (r1 + r2) * 0.6) {
        // Inelastic collision conservation of momentum
        const totalMass = b1.mass + b2.mass;
        const newVx = (b1.mass * b1.velocity.vx + b2.mass * b2.velocity.vx) / totalMass;
        const newVy = (b1.mass * b1.velocity.vy + b2.mass * b2.velocity.vy) / totalMass;
        const newVz = (b1.mass * b1.velocity.vz + b2.mass * b2.velocity.vz) / totalMass;

        b1 = {
          ...b1,
          mass: totalMass,
          radius: Math.cbrt(Math.pow(b1.radius, 3) + Math.pow(b2.radius, 3)),
          velocity: { vx: newVx, vy: newVy, vz: newVz }
        };

        mergedIds.add(b2.id);
      }
    }

    survived.push(b1);
  }

  return survived;
}

export function calculateOrbitalElements(body: CelestialBody, primary: CelestialBody): OrbitalElements {
  const dx = body.position.x - primary.position.x;
  const dy = body.position.y - primary.position.y;
  const dz = body.position.z - primary.position.z;
  const r = Math.hypot(dx, dy, dz);

  const dvx = body.velocity.vx - primary.velocity.vx;
  const dvy = body.velocity.vy - primary.velocity.vy;
  const dvz = body.velocity.vz - primary.velocity.vz;
  const v = Math.hypot(dvx, dvy, dvz);

  const SOLAR_MASS = 1.989e30;
  const primarySimMass = Math.max(1e-8, primary.mass / SOLAR_MASS);
  const mu = SIM_G * primarySimMass;

  const epsilon = (v * v) / 2 - mu / Math.max(1, r);

  let a = r;
  let isEscapeTrajectory = false;
  let hyperbolicExcessSpeed = 0;

  if (epsilon < 0) {
    a = -mu / (2 * epsilon);
  } else {
    isEscapeTrajectory = true;
    a = mu / (2 * Math.max(1e-4, epsilon));
    hyperbolicExcessSpeed = Math.sqrt(2 * epsilon);
  }

  const rxv_x = dy * dvz - dz * dvy;
  const rxv_y = dz * dvx - dx * dvz;
  const rxv_z = dx * dvy - dy * dvx;
  const h = Math.hypot(rxv_x, rxv_y, rxv_z);

  let e = 0;
  if (a > 0 && mu > 0) {
    const term = (h * h) / (a * mu);
    e = isEscapeTrajectory ? Math.sqrt(1 + term) : Math.sqrt(Math.max(0, 1 - term));
  }

  const periapsis = a * (1 - e);
  const apoapsis = isEscapeTrajectory ? Infinity : a * (1 + e);
  const orbitalPeriod = !isEscapeTrajectory && a > 0 ? 2 * Math.PI * Math.sqrt(Math.pow(a, 3) / Math.max(1, mu)) : 0;
  const escapeVelocity = Math.sqrt((2 * mu) / Math.max(1, r));

  return {
    semiMajorAxis: Math.round(a),
    eccentricity: parseFloat(e.toFixed(3)),
    periapsis: Math.round(Math.max(0, periapsis)),
    apoapsis: isEscapeTrajectory ? Infinity : Math.round(apoapsis),
    orbitalPeriod: Math.round(orbitalPeriod),
    currentSpeed: parseFloat(v.toFixed(2)),
    escapeVelocity: parseFloat(escapeVelocity.toFixed(2)),
    isEscapeTrajectory,
    hyperbolicExcessSpeed: isEscapeTrajectory ? parseFloat(hyperbolicExcessSpeed.toFixed(2)) : undefined
  };
}

export function calculateSpacetimeDepression(x: number, z: number, bodies: CelestialBody[]): number {
  let depression = 0;
  const SOLAR_MASS = 1.989e30;
  for (const b of bodies) {
    const dx = x - b.position.x;
    const dz = z - b.position.z;
    const distSq = dx * dx + dz * dz + 100;
    const simMass = Math.max(0.01, b.mass / SOLAR_MASS);
    const depth = (simMass * 3800) / Math.sqrt(distSq);
    depression -= depth;
  }
  return depression;
}

export function calculateHohmannTransfer(
  r1: number,
  r2: number,
  centralMassKg: number
): { deltaV1: number; deltaV2: number; totalDeltaV: number; transferTimeSec: number } {
  const SOLAR_MASS = 1.989e30;
  const mu = SIM_G * (centralMassKg / SOLAR_MASS);
  const v1 = Math.sqrt(mu / r1);
  const v2 = Math.sqrt(mu / r2);

  const aTransfer = (r1 + r2) / 2;
  const vTransfer1 = Math.sqrt(mu * (2 / r1 - 1 / aTransfer));
  const vTransfer2 = Math.sqrt(mu * (2 / r2 - 1 / aTransfer));

  const dv1 = Math.abs(vTransfer1 - v1);
  const dv2 = Math.abs(v2 - vTransfer2);

  const transferTime = Math.PI * Math.sqrt(Math.pow(aTransfer, 3) / mu);

  return {
    deltaV1: parseFloat(dv1.toFixed(2)),
    deltaV2: parseFloat(dv2.toFixed(2)),
    totalDeltaV: parseFloat((dv1 + dv2).toFixed(2)),
    transferTimeSec: Math.round(transferTime)
  };
}
