/**
 * Satellite Constellation Mechanics & Inter-Satellite Laser CommNet.
 * Generates Walker Delta (T/P/F) constellations, solves raycasted line-of-sight
 * crosslinks, ground station downlinks, and speed-of-light propagation latency.
 */

export interface SatelliteNode {
  id: string;
  name: string;
  planeIndex: number;
  satIndex: number;
  altitudeKm: number;
  inclinationDeg: number;
  position: { x: number; y: number; z: number }; // ECI Cartesian coordinates (km)
  velocity: { vx: number; vy: number; vz: number };
  crosslinks: string[]; // IDs of connected neighbor satellites
  isSunlit: boolean;
}

export interface GroundStation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  connectedSatId: string | null;
  latencyMs: number;
}

export const GROUND_STATIONS: GroundStation[] = [
  { id: 'ksc', name: 'Kennedy Space Center (USA)', latitude: 28.5721, longitude: -80.6480, connectedSatId: null, latencyMs: 0 },
  { id: 'svalbard', name: 'Svalbard Arctic Station (Norway)', latitude: 78.2232, longitude: 15.6267, connectedSatId: null, latencyMs: 0 },
  { id: 'goldstone', name: 'Goldstone DSN Complex (USA)', latitude: 35.4267, longitude: -116.8900, connectedSatId: null, latencyMs: 0 },
  { id: 'madrid', name: 'Madrid DSN Station (Spain)', latitude: 40.4273, longitude: -4.2497, connectedSatId: null, latencyMs: 0 },
  { id: 'canberra', name: 'Canberra DSN Station (Australia)', latitude: -35.4014, longitude: 148.9817, connectedSatId: null, latencyMs: 0 }
];

export interface ConstellationConfig {
  name: string;
  totalSatellites: number; // T
  planesCount: number; // P
  phasing: number; // F
  altitudeKm: number;
  inclinationDeg: number;
}

export const CONSTELLATION_PRESETS: Record<string, ConstellationConfig> = {
  starlink_shell1: {
    name: 'Starlink Gen2 LEO Shell',
    totalSatellites: 32,
    planesCount: 8,
    phasing: 1,
    altitudeKm: 550,
    inclinationDeg: 53.0
  },
  gps_block_iii: {
    name: 'GPS Block III MEO Constellation',
    totalSatellites: 24,
    planesCount: 6,
    phasing: 2,
    altitudeKm: 20200,
    inclinationDeg: 55.0
  },
  iridium_next: {
    name: 'Iridium NEXT Polar CommNet',
    totalSatellites: 30,
    planesCount: 6,
    phasing: 1,
    altitudeKm: 780,
    inclinationDeg: 86.4
  }
};

export function generateWalkerConstellation(config: ConstellationConfig, timeSec: number = 0): SatelliteNode[] {
  const { totalSatellites, planesCount, phasing, altitudeKm, inclinationDeg } = config;
  const satsPerPlane = Math.floor(totalSatellites / planesCount);
  const r = 6371 + altitudeKm;
  const incRad = (inclinationDeg * Math.PI) / 180;
  const mu = 398600.4418; // km^3/s^2
  const orbitalPeriod = 2 * Math.PI * Math.sqrt(Math.pow(r, 3) / mu);
  const meanMotion = (2 * Math.PI) / orbitalPeriod;

  const satellites: SatelliteNode[] = [];

  for (let p = 0; p < planesCount; p++) {
    // RAAN (Right Ascension of the Ascending Node) for each plane
    const raan = (p * (2 * Math.PI)) / planesCount;

    for (let s = 0; s < satsPerPlane; s++) {
      // In-plane anomaly with Walker phasing: nu = (2*pi*s / S) + (2*pi*F*p / T)
      const phaseOffset = (2 * Math.PI * phasing * p) / totalSatellites;
      const trueAnomaly = (s * (2 * Math.PI)) / satsPerPlane + phaseOffset + meanMotion * timeSec;

      // Position in orbital plane
      const xp = r * Math.cos(trueAnomaly);
      const yp = r * Math.sin(trueAnomaly);

      // Rotate by inclination and RAAN into ECI frame
      const x = xp * Math.cos(raan) - yp * Math.cos(incRad) * Math.sin(raan);
      const y = xp * Math.sin(raan) + yp * Math.cos(incRad) * Math.cos(raan);
      const z = yp * Math.sin(incRad);

      const vMag = Math.sqrt(mu / r);
      const vx = -vMag * Math.sin(trueAnomaly) * Math.cos(raan);
      const vy = -vMag * Math.sin(trueAnomaly) * Math.sin(raan);
      const vz = vMag * Math.cos(trueAnomaly) * Math.sin(incRad);

      satellites.push({
        id: `sat_${p}_${s}`,
        name: `SAT-P${p + 1}-${s + 1}`,
        planeIndex: p,
        satIndex: s,
        altitudeKm,
        inclinationDeg,
        position: { x: parseFloat(x.toFixed(1)), y: parseFloat(y.toFixed(1)), z: parseFloat(z.toFixed(1)) },
        velocity: { vx: parseFloat(vx.toFixed(2)), vy: parseFloat(vy.toFixed(2)), vz: parseFloat(vz.toFixed(2)) },
        crosslinks: [],
        isSunlit: x > -2000 // Simple day/night shadow check
      });
    }
  }

  // Solve Line-of-Sight Laser Crosslinks between neighbor satellites
  const earthRadius = 6371;
  for (let i = 0; i < satellites.length; i++) {
    const s1 = satellites[i];
    s1.crosslinks = [];

    for (let j = i + 1; j < satellites.length; j++) {
      const s2 = satellites[j];

      // Distance between satellites
      const dx = s2.position.x - s1.position.x;
      const dy = s2.position.y - s1.position.y;
      const dz = s2.position.z - s1.position.z;
      const dist = Math.hypot(dx, dy, dz);

      // Limit laser crosslink range (max 5,000 km for LEO)
      if (dist > (altitudeKm < 2000 ? 4500 : 45000)) continue;

      // Line of sight raycast against Earth sphere:
      // Ray from s1 to s2, find closest approach distance to Earth origin (0, 0, 0)
      const dot = -(s1.position.x * dx + s1.position.y * dy + s1.position.z * dz) / (dist * dist);
      const t = Math.max(0, Math.min(1, dot));
      const closestX = s1.position.x + t * dx;
      const closestY = s1.position.y + t * dy;
      const closestZ = s1.position.z + t * dz;
      const rayEarthDist = Math.hypot(closestX, closestY, closestZ);

      // If ray clears Earth atmosphere (+ 80 km), line of sight is open
      if (rayEarthDist > earthRadius + 80) {
        s1.crosslinks.push(s2.id);
      }
    }
  }

  return satellites;
}
