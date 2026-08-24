import type { CelestialBody, OrbitalElements } from '../types';

export const G_SCALE = 6.6743e-11;
export const SIM_G = 1500;

export const CELESTIAL_PRESETS: { id: string; name: string; description: string; bodies: CelestialBody[] }[] = [
  {
    id: 'inner_solar_system',
    name: 'Inner Solar System',
    description: 'The Sun, Mercury, Venus, Earth-Moon system, and Mars in calibrated coplanar orbits.',
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
        color: '#fbbf24',
        secondaryColor: '#f59e0b',
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
        velocity: { vx: 0, vy: 0, vz: -4.2 },
        color: '#94a3b8',
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
        velocity: { vx: 0, vy: 0, vz: -3.2 },
        color: '#fde047',
        atmosphereDensity: 92.0,
        atmosphereColor: '#eab308',
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
        velocity: { vx: 0, vy: 0, vz: -2.6 },
        color: '#38bdf8',
        secondaryColor: '#10b981',
        hasRings: false,
        atmosphereDensity: 1.0,
        atmosphereColor: '#60a5fa',
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
        velocity: { vx: 0, vy: 0, vz: -3.3 },
        color: '#cbd5e1',
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
        velocity: { vx: 0, vy: 0, vz: -2.2 },
        color: '#ef4444',
        secondaryColor: '#f97316',
        hasRings: false,
        atmosphereDensity: 0.06,
        atmosphereColor: '#fca5a5',
        trail: []
      }
    ]
  },
  {
    id: 'jupiter_system',
    name: 'Jupiter & Galilean Moons',
    description: 'Gas giant Jupiter with orbital dance of Io, Europa, Ganymede, and Callisto in orbital resonance.',
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
        color: '#d97706',
        secondaryColor: '#fef3c7',
        hasRings: true,
        ringRadiusMin: 80,
        ringRadiusMax: 140,
        ringColor: '#b45309',
        atmosphereDensity: 20.0,
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
        position: { x: 160, y: 0, z: 0 },
        velocity: { vx: 0, vy: 0, vz: -4.0 },
        color: '#eab308',
        hasRings: false,
        atmosphereDensity: 0.01,
        trail: []
      },
      {
        id: 'europa',
        name: 'Europa',
        type: 'ocean',
        mass: 4.80e22,
        radius: 1560,
        density: 3.01,
        position: { x: 240, y: 0, z: 0 },
        velocity: { vx: 0, vy: 0, vz: -3.3 },
        color: '#e2e8f0',
        hasRings: false,
        atmosphereDensity: 0.02,
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
        velocity: { vx: 0, vy: 0, vz: -2.8 },
        color: '#94a3b8',
        hasRings: false,
        atmosphereDensity: 0,
        trail: []
      }
    ]
  },
  {
    id: 'three_body_chaos',
    name: 'Chaotic 3-Body System',
    description: 'Three stellar masses interacting in non-linear chaotic gravitational dance.',
    bodies: [
      {
        id: 'star_alpha',
        name: 'Star Alpha',
        type: 'star',
        mass: 1.5e30,
        radius: 400000,
        density: 1.2,
        position: { x: -250, y: 0, z: 0 },
        velocity: { vx: 0, vy: 0, vz: 1.8 },
        color: '#38bdf8',
        hasRings: false,
        atmosphereDensity: 0,
        luminosity: 1.2,
        trail: []
      },
      {
        id: 'star_beta',
        name: 'Star Beta',
        type: 'star',
        mass: 1.5e30,
        radius: 400000,
        density: 1.2,
        position: { x: 250, y: 0, z: 0 },
        velocity: { vx: 0, vy: 0, vz: -1.8 },
        color: '#f43f5e',
        hasRings: false,
        atmosphereDensity: 0,
        luminosity: 1.2,
        trail: []
      },
      {
        id: 'star_gamma',
        name: 'Star Gamma',
        type: 'star',
        mass: 1.5e30,
        radius: 400000,
        density: 1.2,
        position: { x: 0, y: 0, z: 350 },
        velocity: { vx: -1.5, vy: 0, vz: 0 },
        color: '#facc15',
        hasRings: false,
        atmosphereDensity: 0,
        luminosity: 1.0,
        trail: []
      }
    ]
  },
  {
    id: 'black_hole_singularity',
    name: 'Supermassive Singularity',
    description: 'Centrally collapsed gravitational singularity with extreme spacetime metric curvature.',
    bodies: [
      {
        id: 'singularity',
        name: 'Singularity Sagittarius-0',
        type: 'black_hole',
        mass: 8.0e30,
        radius: 50000,
        density: 1e8,
        position: { x: 0, y: 0, z: 0 },
        velocity: { vx: 0, vy: 0, vz: 0 },
        color: '#000000',
        secondaryColor: '#38bdf8',
        hasRings: true,
        ringRadiusMin: 40,
        ringRadiusMax: 120,
        ringColor: '#60a5fa',
        atmosphereDensity: 0,
        isFixed: true,
        trail: []
      },
      {
        id: 'relic_world',
        name: 'Relic Iron Core',
        type: 'rocky',
        mass: 8.0e24,
        radius: 5000,
        density: 7.8,
        position: { x: 280, y: 0, z: 0 },
        velocity: { vx: 0, vy: 0, vz: -6.5 },
        color: '#e2e8f0',
        hasRings: false,
        atmosphereDensity: 0,
        trail: []
      },
      {
        id: 'frozen_comet',
        name: 'Relativistic Comet',
        type: 'ice_giant',
        mass: 1.0e22,
        radius: 1200,
        density: 1.0,
        position: { x: 500, y: 0, z: -100 },
        velocity: { vx: 2.0, vy: 0, vz: -4.8 },
        color: '#38bdf8',
        hasRings: false,
        atmosphereDensity: 0,
        trail: []
      }
    ]
  }
];

export function stepNBodySimulation(bodies: CelestialBody[], dt: number): CelestialBody[] {
  const n = bodies.length;
  if (n === 0) return bodies;

  const updated = bodies.map(b => ({
    ...b,
    position: { ...b.position },
    velocity: { ...b.velocity },
    trail: [...b.trail]
  }));

  const getAccelerations = (positions: { x: number; y: number; z: number }[]) => {
    const accels: { ax: number; ay: number; az: number }[] = [];

    for (let i = 0; i < n; i++) {
      let ax = 0;
      let ay = 0;
      let az = 0;

      if (!updated[i].isFixed) {
        for (let j = 0; j < n; j++) {
          if (i === j) continue;

          const dx = positions[j].x - positions[i].x;
          const dy = positions[j].y - positions[i].y;
          const dz = positions[j].z - positions[i].z;
          const distSq = dx * dx + dy * dy + dz * dz + 100;
          const dist = Math.sqrt(distSq);

          const massFactor = Math.log10(Math.max(1e20, updated[j].mass)) / 30;
          const f = (SIM_G * massFactor) / distSq;

          ax += f * (dx / dist);
          ay += f * (dy / dist);
          az += f * (dz / dist);
        }
      }

      accels.push({ ax, ay, az });
    }

    return accels;
  };

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
    if (b.trail.length > 250) {
      b.trail.shift();
    }
  }

  return updated;
}

export function calculateOrbitalElements(body: CelestialBody, primary: CelestialBody): OrbitalElements {
  const dx = body.position.x - primary.position.x;
  const dy = body.position.y - primary.position.y;
  const dz = body.position.z - primary.position.z;
  const r = Math.sqrt(dx * dx + dy * dy + dz * dz);

  const dvx = body.velocity.vx - primary.velocity.vx;
  const dvy = body.velocity.vy - primary.velocity.vy;
  const dvz = body.velocity.vz - primary.velocity.vz;
  const v = Math.sqrt(dvx * dvx + dvy * dvy + dvz * dvz);

  const mu = SIM_G * (Math.log10(Math.max(1e20, primary.mass)) / 30) * 1000;
  
  const epsilon = (v * v) / 2 - mu / Math.max(1, r);

  let a = r;
  if (Math.abs(epsilon) > 0.001) {
    a = -mu / (2 * epsilon);
  }

  const rxv_x = dy * dvz - dz * dvy;
  const rxv_y = dz * dvx - dx * dvz;
  const rxv_z = dx * dvy - dy * dvx;
  const h = Math.sqrt(rxv_x * rxv_x + rxv_y * rxv_y + rxv_z * rxv_z);

  let e = 0;
  if (a > 0 && mu > 0) {
    const term = (h * h) / (a * mu);
    e = Math.sqrt(Math.max(0, 1 - term));
  }

  const periapsis = a * (1 - e);
  const apoapsis = a * (1 + e);
  const orbitalPeriod = a > 0 ? 2 * Math.PI * Math.sqrt(Math.pow(a, 3) / Math.max(1, mu)) : 0;
  const escapeVelocity = Math.sqrt((2 * mu) / Math.max(1, r));

  return {
    semiMajorAxis: Math.round(a),
    eccentricity: parseFloat(e.toFixed(3)),
    periapsis: Math.round(periapsis),
    apoapsis: Math.round(apoapsis),
    orbitalPeriod: Math.round(orbitalPeriod),
    currentSpeed: parseFloat(v.toFixed(2)),
    escapeVelocity: parseFloat(escapeVelocity.toFixed(2))
  };
}

export function calculateSpacetimeDepression(x: number, z: number, bodies: CelestialBody[]): number {
  let depression = 0;
  for (const b of bodies) {
    const dx = x - b.position.x;
    const dz = z - b.position.z;
    const distSq = dx * dx + dz * dz + 400;
    const massFactor = Math.log10(Math.max(1e20, b.mass)) / 30;
    const depth = (massFactor * 4500) / Math.sqrt(distSq);
    depression -= depth;
  }
  return depression;
}
