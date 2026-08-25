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

export type SatelliteCategory = 'all' | 'stations' | 'comm' | 'navigation' | 'earth_obs' | 'deep_space' | 'debris';

export interface LiveTrackedSatellite {
  id: string;
  name: string;
  noradId: number;
  category: 'stations' | 'comm' | 'navigation' | 'earth_obs' | 'deep_space' | 'debris';
  operator: string;
  country: string;
  launchYear: number;
  altitudeKm: number;
  inclinationDeg: number;
  raanDeg: number;
  meanAnomaly0Deg: number;
  eccentricity: number;
  periodMin: number;
  velocityKmS: number;
  description: string;
  coverageRadiusKm: number;
  color: string;
  massKg: number;
  powerWatts: number;
  frequencyBand: string;
}

export const REAL_TIME_SATELLITES: LiveTrackedSatellite[] = [
  // 1. Space Stations & Science
  {
    id: 'iss',
    name: 'ISS (International Space Station)',
    noradId: 25544,
    category: 'stations',
    operator: 'NASA / Roscosmos / ESA / JAXA',
    country: 'International',
    launchYear: 1998,
    altitudeKm: 420,
    inclinationDeg: 51.6,
    raanDeg: 45.0,
    meanAnomaly0Deg: 120.0,
    eccentricity: 0.0006,
    periodMin: 92.9,
    velocityKmS: 7.66,
    description: 'Continuously inhabited microgravity research laboratory with 7 astronaut crew members.',
    coverageRadiusKm: 2200,
    color: '#38BDF8',
    massKg: 450000,
    powerWatts: 120000,
    frequencyBand: 'S-band / Ku-band (TDRSS)'
  },
  {
    id: 'tiangong',
    name: 'Tiangong Space Station (CSS)',
    noradId: 48274,
    category: 'stations',
    operator: 'CNSA (China Space Agency)',
    country: 'China',
    launchYear: 2021,
    altitudeKm: 390,
    inclinationDeg: 41.5,
    raanDeg: 110.0,
    meanAnomaly0Deg: 280.0,
    eccentricity: 0.0004,
    periodMin: 92.3,
    velocityKmS: 7.68,
    description: 'Modular Chinese space station hosting 3 taikonauts in permanent LEO orbital operations.',
    coverageRadiusKm: 2150,
    color: '#F43F5E',
    massKg: 100000,
    powerWatts: 27000,
    frequencyBand: 'Ka-band / S-band'
  },
  {
    id: 'hubble',
    name: 'Hubble Space Telescope (HST)',
    noradId: 20580,
    category: 'stations',
    operator: 'NASA / ESA / STScI',
    country: 'USA / Europe',
    launchYear: 1990,
    altitudeKm: 535,
    inclinationDeg: 28.5,
    raanDeg: 195.0,
    meanAnomaly0Deg: 40.0,
    eccentricity: 0.0003,
    periodMin: 95.4,
    velocityKmS: 7.59,
    description: 'Historic 2.4-meter ultraviolet/optical observatory uncovering cosmic dark energy & nebulae.',
    coverageRadiusKm: 2500,
    color: '#60A5FA',
    massKg: 11110,
    powerWatts: 2800,
    frequencyBand: 'S-band / Multiple Relay'
  },
  {
    id: 'jwst',
    name: 'James Webb Space Telescope (JWST)',
    noradId: 50463,
    category: 'stations',
    operator: 'NASA / ESA / CSA',
    country: 'International',
    launchYear: 2021,
    altitudeKm: 1500000,
    inclinationDeg: 5.3,
    raanDeg: 0,
    meanAnomaly0Deg: 0,
    eccentricity: 0.05,
    periodMin: 259200,
    velocityKmS: 0.25,
    description: 'Premier 6.5m infrared space observatory stationed at the Sun-Earth L2 Lagrange halo orbit.',
    coverageRadiusKm: 1500000,
    color: '#FBBF24',
    massKg: 6500,
    powerWatts: 2000,
    frequencyBand: 'Ka-band (DSN 34m/70m)'
  },

  // 2. Mega-Constellations & Broadband
  {
    id: 'starlink_3012',
    name: 'Starlink V2-Mini 3012',
    noradId: 57801,
    category: 'comm',
    operator: 'SpaceX',
    country: 'USA',
    launchYear: 2023,
    altitudeKm: 550,
    inclinationDeg: 53.0,
    raanDeg: 60.0,
    meanAnomaly0Deg: 15.0,
    eccentricity: 0.0001,
    periodMin: 95.6,
    velocityKmS: 7.59,
    description: 'High-capacity phased array broadband satellite with E-band inter-satellite optical laser links.',
    coverageRadiusKm: 940,
    color: '#34D399',
    massKg: 800,
    powerWatts: 4200,
    frequencyBand: 'Ku / Ka / E-band Laser'
  },
  {
    id: 'starlink_3013',
    name: 'Starlink V2-Mini 3013',
    noradId: 57802,
    category: 'comm',
    operator: 'SpaceX',
    country: 'USA',
    launchYear: 2023,
    altitudeKm: 550,
    inclinationDeg: 53.0,
    raanDeg: 60.0,
    meanAnomaly0Deg: 195.0,
    eccentricity: 0.0001,
    periodMin: 95.6,
    velocityKmS: 7.59,
    description: 'SpaceX Starlink LEO constellation node delivering ultra-low-latency global internet.',
    coverageRadiusKm: 940,
    color: '#34D399',
    massKg: 800,
    powerWatts: 4200,
    frequencyBand: 'Ku / Ka / E-band Laser'
  },
  {
    id: 'oneweb_0142',
    name: 'OneWeb 0142 (Polar Shell)',
    noradId: 51044,
    category: 'comm',
    operator: 'Eutelsat OneWeb',
    country: 'UK / France',
    launchYear: 2022,
    altitudeKm: 1200,
    inclinationDeg: 87.9,
    raanDeg: 280.0,
    meanAnomaly0Deg: 90.0,
    eccentricity: 0.0012,
    periodMin: 109.4,
    velocityKmS: 7.24,
    description: 'Near-polar orbital communications satellite delivering connectivity to maritime & aviation routes.',
    coverageRadiusKm: 1750,
    color: '#A7F3D0',
    massKg: 147,
    powerWatts: 900,
    frequencyBand: 'Ku / Ka-band'
  },
  {
    id: 'kuiper_proto1',
    name: 'Project Kuiper Proto-1',
    noradId: 58004,
    category: 'comm',
    operator: 'Amazon Kuiper Systems',
    country: 'USA',
    launchYear: 2023,
    altitudeKm: 590,
    inclinationDeg: 51.9,
    raanDeg: 15.0,
    meanAnomaly0Deg: 310.0,
    eccentricity: 0.0002,
    periodMin: 96.5,
    velocityKmS: 7.56,
    description: 'Amazon Kuiper optical laser linked testbed vehicle for global consumer satellite broadband.',
    coverageRadiusKm: 1050,
    color: '#6EE7B7',
    massKg: 700,
    powerWatts: 3500,
    frequencyBand: 'Ka-band / Laser'
  },

  // 3. Global Navigation & Positioning (GNSS)
  {
    id: 'gps_sv05',
    name: 'GPS III Space Vehicle 05 (Neil Armstrong)',
    noradId: 48859,
    category: 'navigation',
    operator: 'US Space Force / DoD',
    country: 'USA',
    launchYear: 2021,
    altitudeKm: 20200,
    inclinationDeg: 55.0,
    raanDeg: 35.0,
    meanAnomaly0Deg: 85.0,
    eccentricity: 0.0005,
    periodMin: 717.9,
    velocityKmS: 3.87,
    description: 'Next-gen military & civilian positioning satellite featuring anti-jamming M-code & L5 safety signals.',
    coverageRadiusKm: 8500,
    color: '#FBBF24',
    massKg: 4350,
    powerWatts: 4400,
    frequencyBand: 'L1 / L2 / L5 (1.575 GHz)'
  },
  {
    id: 'galileo_24',
    name: 'Galileo GSAT0224 (Ellen)',
    noradId: 43564,
    category: 'navigation',
    operator: 'European Union / ESA / EUSPA',
    country: 'European Union',
    launchYear: 2018,
    altitudeKm: 23222,
    inclinationDeg: 56.0,
    raanDeg: 155.0,
    meanAnomaly0Deg: 220.0,
    eccentricity: 0.0003,
    periodMin: 844.4,
    velocityKmS: 3.67,
    description: 'European civilian GNSS constellation node equipped with passive hydrogen maser atomic clocks.',
    coverageRadiusKm: 9200,
    color: '#F59E0B',
    massKg: 715,
    powerWatts: 1900,
    frequencyBand: 'E1 / E5 / E6 (1.2-1.5 GHz)'
  },
  {
    id: 'glonass_k1',
    name: 'GLONASS-K1 No. 705',
    noradId: 46805,
    category: 'navigation',
    operator: 'Roscosmos Space Troops',
    country: 'Russia',
    launchYear: 2020,
    altitudeKm: 19100,
    inclinationDeg: 64.8,
    raanDeg: 275.0,
    meanAnomaly0Deg: 140.0,
    eccentricity: 0.0008,
    periodMin: 675.7,
    velocityKmS: 3.95,
    description: 'Russian dual-use navigation satellite in high-inclination MEO orbital shell with CDMA signals.',
    coverageRadiusKm: 8200,
    color: '#D97706',
    massKg: 935,
    powerWatts: 1600,
    frequencyBand: 'L1 / L2 / L3 (FDMA/CDMA)'
  },
  {
    id: 'beidou_3',
    name: 'BeiDou-3 M19 (Compass)',
    noradId: 43647,
    category: 'navigation',
    operator: 'CNSA China Satellite Navigation',
    country: 'China',
    launchYear: 2018,
    altitudeKm: 21500,
    inclinationDeg: 55.0,
    raanDeg: 330.0,
    meanAnomaly0Deg: 45.0,
    eccentricity: 0.0004,
    periodMin: 773.0,
    velocityKmS: 3.78,
    description: 'Chinese global positioning spacecraft with inter-satellite crosslinks and two-way short message comms.',
    coverageRadiusKm: 8800,
    color: '#B45309',
    massKg: 1010,
    powerWatts: 2200,
    frequencyBand: 'B1 / B2 / B3'
  },

  // 4. Earth Observation & Meteorology
  {
    id: 'landsat_9',
    name: 'Landsat 9 (USGS OLI-2)',
    noradId: 49260,
    category: 'earth_obs',
    operator: 'NASA / USGS',
    country: 'USA',
    launchYear: 2021,
    altitudeKm: 705,
    inclinationDeg: 98.2,
    raanDeg: 140.0,
    meanAnomaly0Deg: 330.0,
    eccentricity: 0.0001,
    periodMin: 98.8,
    velocityKmS: 7.50,
    description: 'Sun-synchronous multispectral optical & thermal land surface imaging satellite for climate monitoring.',
    coverageRadiusKm: 185,
    color: '#C084FC',
    massKg: 2711,
    powerWatts: 1550,
    frequencyBand: 'X-band Direct Downlink'
  },
  {
    id: 'sentinel_2a',
    name: 'Sentinel-2A (Copernicus)',
    noradId: 40697,
    category: 'earth_obs',
    operator: 'ESA Copernicus Programme',
    country: 'European Union',
    launchYear: 2015,
    altitudeKm: 786,
    inclinationDeg: 98.6,
    raanDeg: 210.0,
    meanAnomaly0Deg: 75.0,
    eccentricity: 0.0001,
    periodMin: 100.6,
    velocityKmS: 7.46,
    description: 'High-resolution 13-band optical Earth scanner tracking global vegetation, forestry, and water security.',
    coverageRadiusKm: 290,
    color: '#A855F7',
    massKg: 1140,
    powerWatts: 1700,
    frequencyBand: 'X-band / EDRS Laser'
  },
  {
    id: 'goes_18',
    name: 'GOES-18 (Geostationary Weather)',
    noradId: 51850,
    category: 'earth_obs',
    operator: 'NOAA / NASA',
    country: 'USA',
    launchYear: 2022,
    altitudeKm: 35786,
    inclinationDeg: 0.0,
    raanDeg: 0,
    meanAnomaly0Deg: 223.0,
    eccentricity: 0.0001,
    periodMin: 1436.1,
    velocityKmS: 3.07,
    description: 'Geostationary advanced baseline imager providing real-time lightning mapping & hurricane forecasting.',
    coverageRadiusKm: 10000,
    color: '#E879F9',
    massKg: 5192,
    powerWatts: 4000,
    frequencyBand: 'L-band / X-band'
  },
  {
    id: 'terrasar_x',
    name: 'TerraSAR-X (X-Band Radar)',
    noradId: 31698,
    category: 'earth_obs',
    operator: 'DLR / Airbus Defence & Space',
    country: 'Germany',
    launchYear: 2007,
    altitudeKm: 514,
    inclinationDeg: 97.4,
    raanDeg: 350.0,
    meanAnomaly0Deg: 180.0,
    eccentricity: 0.0002,
    periodMin: 94.8,
    velocityKmS: 7.61,
    description: 'Synthetic aperture radar (SAR) satellite capable of millimeter-precision interferometric topographic scans.',
    coverageRadiusKm: 100,
    color: '#D946EF',
    massKg: 1230,
    powerWatts: 1800,
    frequencyBand: 'X-band (9.65 GHz)'
  },

  // 5. Deep Space & Lunar Probes
  {
    id: 'lro',
    name: 'Lunar Reconnaissance Orbiter (LRO)',
    noradId: 35315,
    category: 'deep_space',
    operator: 'NASA Goddard',
    country: 'USA',
    launchYear: 2009,
    altitudeKm: 384400,
    inclinationDeg: 90.0,
    raanDeg: 90.0,
    meanAnomaly0Deg: 0,
    eccentricity: 0.02,
    periodMin: 113.0,
    velocityKmS: 1.60,
    description: 'Lunar polar mapping orbiter characterizing Shackleton crater water-ice and Artemis landing sites.',
    coverageRadiusKm: 300,
    color: '#E2E8F0',
    massKg: 1916,
    powerWatts: 1850,
    frequencyBand: 'Ka-band Lunar DSN'
  },
  {
    id: 'dscovr',
    name: 'DSCOVR (Sun-Earth L1 Observatory)',
    noradId: 40390,
    category: 'deep_space',
    operator: 'NOAA / NASA / USAF',
    country: 'USA',
    launchYear: 2015,
    altitudeKm: 1500000,
    inclinationDeg: 4.8,
    raanDeg: 0,
    meanAnomaly0Deg: 0,
    eccentricity: 0.04,
    periodMin: 259200,
    velocityKmS: 0.28,
    description: 'Deep Space Climate Observatory capturing EPIC full-disk Earth images and coronal mass ejection alerts.',
    coverageRadiusKm: 1500000,
    color: '#FDE047',
    massKg: 570,
    powerWatts: 600,
    frequencyBand: 'S-band / X-band'
  },

  // 6. Orbital Debris & Spent Upper Stages
  {
    id: 'sl16_stage',
    name: 'SL-16 R/B (Zenit-2 Spent Booster)',
    noradId: 22285,
    category: 'debris',
    operator: 'Defunct Soviet Space Program',
    country: 'USSR / Ukraine',
    launchYear: 1992,
    altitudeKm: 840,
    inclinationDeg: 71.0,
    raanDeg: 120.0,
    meanAnomaly0Deg: 210.0,
    eccentricity: 0.0085,
    periodMin: 101.8,
    velocityKmS: 7.42,
    description: 'Derelict 9-ton rocket upper stage tracked by Space Surveillance Network as high-risk collision debris.',
    coverageRadiusKm: 0,
    color: '#EF4444',
    massKg: 9000,
    powerWatts: 0,
    frequencyBand: 'Defunct (Passive Radar Return)'
  },
  {
    id: 'cosmos1408_frag',
    name: 'Cosmos 1408 Debris Fragment #49863',
    noradId: 49863,
    category: 'debris',
    operator: 'Orbital Debris Tracking',
    country: 'Russia (ASAT Test)',
    launchYear: 1982,
    altitudeKm: 480,
    inclinationDeg: 82.5,
    raanDeg: 40.0,
    meanAnomaly0Deg: 315.0,
    eccentricity: 0.0052,
    periodMin: 94.2,
    velocityKmS: 7.63,
    description: 'High-velocity kinetic fragment from ASAT missile destruction posing collision threat to LEO assets.',
    coverageRadiusKm: 0,
    color: '#F87171',
    massKg: 12,
    powerWatts: 0,
    frequencyBand: 'Passive Fragment'
  }
];

/**
 * Propagates real-time Keplerian state vector into 3D ECI Cartesian space and Geodetic Lat/Lon.
 */
export function propagateLiveSatellite(sat: LiveTrackedSatellite, timeSec: number) {
  const r = 6371 + sat.altitudeKm;
  const incRad = (sat.inclinationDeg * Math.PI) / 180;
  const raanRad = (sat.raanDeg * Math.PI) / 180;

  const orbitalPeriodSec = sat.periodMin * 60;
  const meanMotion = (2 * Math.PI) / Math.max(1, orbitalPeriodSec);
  const trueAnomaly = ((sat.meanAnomaly0Deg * Math.PI) / 180) + meanMotion * timeSec;

  // Position in orbital plane
  const xp = r * Math.cos(trueAnomaly);
  const yp = r * Math.sin(trueAnomaly);

  // Rotate by inclination and RAAN into ECI coordinates
  const x = xp * Math.cos(raanRad) - yp * Math.cos(incRad) * Math.sin(raanRad);
  const y = xp * Math.sin(raanRad) + yp * Math.cos(incRad) * Math.cos(raanRad);
  const z = yp * Math.sin(incRad);

  const speedKmS = sat.velocityKmS;

  // Geodetic sub-satellite latitude & longitude (accounting for Earth's rotation)
  const earthRotRate = (2 * Math.PI) / 86164.0905; // rad/s
  const gha = earthRotRate * timeSec; // Greenwich Hour Angle offset

  const subLatRad = Math.asin(z / r);
  const subLatDeg = (subLatRad * 180) / Math.PI;

  const rawLonRad = Math.atan2(y, x) - gha;
  let subLonDeg = ((rawLonRad * 180) / Math.PI) % 360;
  if (subLonDeg > 180) subLonDeg -= 360;
  if (subLonDeg < -180) subLonDeg += 360;

  return {
    position: { x, y, z },
    lat: parseFloat(subLatDeg.toFixed(2)),
    lon: parseFloat(subLonDeg.toFixed(2)),
    altKm: Math.round(sat.altitudeKm),
    speedKmS: parseFloat(speedKmS.toFixed(2)),
    speedMach: Math.round((speedKmS * 1000) / 340)
  };
}

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
      const dot = -(s1.position.x * dx + s1.position.y * dy + s1.position.z * dz) / (dist * dist);
      const t = Math.max(0, Math.min(1, dot));
      const closestX = s1.position.x + t * dx;
      const closestY = s1.position.y + t * dy;
      const closestZ = s1.position.z + t * dz;
      const rayEarthDist = Math.hypot(closestX, closestY, closestZ);

      if (rayEarthDist > earthRadius + 80) {
        s1.crosslinks.push(s2.id);
      }
    }
  }

  return satellites;
}
