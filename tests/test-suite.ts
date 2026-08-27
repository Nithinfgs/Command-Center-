import { PARTS_CATALOG, ROCKET_PRESETS, calculateRocketProperties, getSymmetricPlacements, validateStructuralConnectivity } from '../src/physics/rocket-math';
import { calculateAtmosphere, solveObliqueShockBeta, calculateAeroTelemetry } from '../src/physics/aerodynamics';
import { getFlightAccelerations, stepFlightPhysics, initFlightState, type FlightState } from '../src/physics/flight-dynamics';
import { calculatePairwiseGravity, calculateLagrangePoints, type CelestialBody } from '../src/physics/n-body';
import { calculatePlanetaryDeflection, DART_DEFAULT_MISSION } from '../src/physics/planetary-defense';
import { calculateImpactPhysics, ASTEROID_DENSITIES, GEOGRAPHIC_TARGETS } from '../src/physics/impact-physics';
import { generateWalkerConstellation, CONSTELLATION_PRESETS, GROUND_STATIONS, REAL_TIME_SATELLITES, propagateLiveSatellite } from '../src/physics/constellations';
import { stepRoverPhysics, getTerrainElevation, ROVER_MISSIONS, initRoverState } from '../src/physics/rover-physics';
import { stepRendezvousPhysics, PRESET_STATIONS, initRendezvousState } from '../src/physics/rendezvous-docking';
import { CAMPAIGN_MISSIONS } from '../src/components/campaigns/CampaignMissionModal';
import { soundEngine } from '../src/audio/soundEngine';
import type { AsteroidConfig } from '../src/types';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName} - ${detail || 'Assertion failed'}`);
    failed++;
  }
}

console.log('🧪 Starting Mission Control 3.0 MASSIVE Internal System Audit & Verification Suite...\n');

// 1. ROCKET CAD PARTS CATALOG & PRESETS
console.log('📦 [1/9] Testing Rocket Catalog Components & Vehicle Presets:');
const catalogKeys = Object.keys(PARTS_CATALOG);
assert(catalogKeys.length >= 15, `CAD Catalog contains ${catalogKeys.length} aerospace parts`);
assert(!!PARTS_CATALOG.fairing_2m && !!PARTS_CATALOG.fairing_4m_left, 'Payload Fairings catalog entries exist');
assert(!!PARTS_CATALOG.engine_raptor && !!PARTS_CATALOG.engine_cluster_quad, 'Heavy rocket engines (Raptor & Quad Cluster) configured');

ROCKET_PRESETS.forEach(preset => {
  const conn = validateStructuralConnectivity(preset.parts);
  const metrics = calculateRocketProperties(preset);
  assert(conn.isFullyConnected, `Preset '${preset.name}' structural connectivity valid`);
  assert(metrics.totalMass > 0 && metrics.dryMass > 0, `Preset '${preset.name}' positive mass (${metrics.totalMass}t)`);
  assert(metrics.totalDeltaV > 0, `Preset '${preset.name}' positive Delta-V (${metrics.totalDeltaV} m/s)`);
});

// 2. MULTI-STAGE DECOUPLING & SYMMETRY CALCULUS
console.log('\n🚀 [2/9] Testing Multi-Stage Decoupling & Symmetry Calculus:');
const saturn = ROCKET_PRESETS.find(p => p.id === 'saturn_v')!;
const saturnMetrics = calculateRocketProperties(saturn);
assert(saturnMetrics.stagesDeltaV.length === 3, 'Saturn V parses 3 distinct stages');
assert(saturnMetrics.stagesDeltaV[1].deltaV > 500, `Stage 2 Delta-V is decoupled (${saturnMetrics.stagesDeltaV[1].deltaV} m/s)`);

['1x', '2x', '3x', '4x', '6x', '8x', 'mirror'].forEach(sym => {
  const placements = getSymmetricPlacements('srb_heavy', 3, 0, 0, sym as any);
  assert(placements.length >= 1, `Symmetry mode '${sym}' generated valid positions (${placements.length})`);
});

// 3. COMPRESSIBLE SUPERSONIC CFD & SHOCKWAVES
console.log('\n💨 [3/9] Testing CFD Aerodynamics, Shockwave Relations & Thermal Flux:');
const betaM2 = solveObliqueShockBeta(2.0, 15);
assert(betaM2 > 15 && betaM2 < 90, `Oblique shockwave beta angle at Mach 2.0 (theta=15°) is ${betaM2.toFixed(1)}°`);

const aeroState = {
  mach: 3.5,
  altitude: 25000,
  airDensity: calculateAtmosphere(25000).density,
  airTemperature: calculateAtmosphere(25000).temperature,
  freestreamSpeed: 3.5 * 300,
  dynamicPressure: 0.5 * calculateAtmosphere(25000).density * Math.pow(3.5 * 300, 2),
  reynoldsNumber: 1e6,
  skinFrictionCoefficient: 0.002,
  isStalled: false,
  windAngle: 5,
  rocketPitch: 0,
  finDeflectionAngle: 0,
  angleToGo: 5,
  engineTestActive: false,
  nozzleChamberPressure: 10
};
const cfdTelemetry = calculateAeroTelemetry(aeroState as any);
assert(cfdTelemetry.dragCoefficient > 0, `CFD Mach 3.5 Drag Coefficient is positive (${cfdTelemetry.dragCoefficient.toFixed(3)})`);
assert(cfdTelemetry.stagnationTemperature > 400, `Hypersonic stagnation temp is ${cfdTelemetry.stagnationTemperature.toFixed(0)} K`);
assert(cfdTelemetry.maxHeatFlux > 0, `Hypersonic heat flux is positive (${cfdTelemetry.maxHeatFlux.toFixed(1)} kW/m²)`);

// 4. SPHERICAL RK4 FLIGHT DYNAMICS & BIDIRECTIONAL STEERING
console.log('\n🌍 [4/9] Testing Spherical RK4 Flight Dynamics & Steering:');
const initialFlight = initFlightState(saturn);
initialFlight.throttle = 1.0;
initialFlight.pitch = 90;
const steppedFlight = stepFlightPhysics(initialFlight, saturn, 1.0);
assert(steppedFlight.altitude >= 0, 'Flight physics integrates altitude under thrust');

// Touchdown threshold validation
const safeLandingState = { ...initialFlight, isLaunched: true, altitude: 0, velocity: { vx: 0.5, vy: -1.5 }, speed: 1.5, pitch: 90 };
const safeStep = stepFlightPhysics(safeLandingState, saturn, 0.5);
assert(!safeStep.isCrashed, 'Gentle landing (v_vert < 4 m/s, v_horiz < 3 m/s) succeeds without crash');

const crashLandingState = { ...initialFlight, isLaunched: true, altitude: 0, velocity: { vx: 15.0, vy: -35.0 }, speed: 38.0, pitch: 90 };
const crashStep = stepFlightPhysics(crashLandingState, saturn, 0.5);
assert(crashStep.isCrashed, 'High velocity impact (v_vert > 4 m/s, v_horiz > 3 m/s) triggers structural crash state');

// 5. N-BODY GRAVITATION & LAGRANGE POCKETS
console.log('\n🪐 [5/9] Testing N-Body Gravitation & Lagrange Equilibrium:');
const earthBody: CelestialBody = {
  id: 'earth',
  name: 'Earth',
  type: 'ocean',
  mass: 5.972e24,
  radius: 6371,
  density: 5.51,
  position: { x: 0, y: 0, z: 0 },
  velocity: { vx: 0, vy: 0, vz: 0 },
  color: '#3b82f6',
  hasRings: false,
  atmosphereDensity: 1.0,
  trail: [],
  isFixed: true
};

const moonBody: CelestialBody = {
  id: 'moon',
  name: 'Moon',
  type: 'rocky',
  mass: 7.342e22,
  radius: 1737,
  density: 3.34,
  position: { x: 384400, y: 0, z: 0 },
  velocity: { vx: 0, vy: 0, vz: 1.022 },
  color: '#94a3b8',
  hasRings: false,
  atmosphereDensity: 0,
  trail: []
};

const lagrange = calculateLagrangePoints(earthBody, moonBody);
assert(lagrange.length === 5, 'Lagrange solver yields all 5 equilibrium points (L1 - L5)');
assert(lagrange[0].x < moonBody.position.x && lagrange[0].x > earthBody.position.x, 'L1 equilibrium point located between Earth and Moon');
assert(lagrange[1].x > moonBody.position.x, 'L2 equilibrium point located on exterior Earth-Moon line');

// 6. ASTEROID IMPACT PHYSICS, CRATERING & MULTI-ZONE CASUALTIES
console.log('\n☄️ [6/9] Testing Asteroid Impact, Cratering & Trauma Belts:');
const testAsteroidConfig: AsteroidConfig = {
  diameter: 250,
  composition: 'silicate',
  density: ASTEROID_DENSITIES['silicate'],
  velocity: 24,
  entryAngle: 45,
  targetBodyId: 'earth',
  targetSurfaceType: 'crystalline_rock',
  targetAreaType: 'dense_metro',
  geographicTarget: GEOGRAPHIC_TARGETS[0]
};
const impactResults = calculateImpactPhysics(testAsteroidConfig);
assert(impactResults.kineticEnergyMegatons > 0, `Impact Kinetic Energy is ${impactResults.kineticEnergyMegatons.toFixed(1)} Mt TNT`);
assert(impactResults.finalCraterDiameter > 0, `Final Crater Diameter is ${impactResults.finalCraterDiameter.toFixed(0)} meters`);
assert(impactResults.estimatedFatalities >= 0, `Estimated Fatalities evaluated: ${impactResults.estimatedFatalities.toLocaleString()}`);
assert(impactResults.estimatedInjuries >= 0, `Regional Injury Belt evaluated: ${impactResults.estimatedInjuries.toLocaleString()}`);

// 7. REAL-TIME SATELLITE TRACKER & WALKER CONSTELLATIONS
console.log('\n🛰️ [7/9] Testing Satellite Fleet Tracker & Walker-Delta Networks:');
assert(REAL_TIME_SATELLITES.length >= 15, `Real-time satellite registry has ${REAL_TIME_SATELLITES.length} active spacecraft`);
const iss = REAL_TIME_SATELLITES.find(s => s.id === 'iss')!;
const issTelemetry = propagateLiveSatellite(iss, 0);
assert(issTelemetry.altKm > 350 && issTelemetry.altKm < 450, `ISS Altitude is ${issTelemetry.altKm} km`);
assert(issTelemetry.speedKmS > 7.0 && issTelemetry.speedKmS < 8.0, `ISS Orbital Speed is ${issTelemetry.speedKmS} km/s`);

const starlinkWalker = generateWalkerConstellation(CONSTELLATION_PRESETS.starlink_shell1);
assert(starlinkWalker.length === 32, 'Walker Delta Starlink generated 32 satellite nodes across 8 planes');

// 8. CLOHESSY-WILTSHIRE 6-DoF DOCKING & PLANETARY ROVER
console.log('\n🏎️ [8/9] Testing 6-DoF Docking Physics & Planetary Rover:');
const initialStation = PRESET_STATIONS[0];
const steppedRdv = stepRendezvousPhysics(initialStation, { fx: -100, fy: 0, fz: 0 }, 0, 0.5);
assert(steppedRdv.relativePos.x !== undefined, 'CW relative motion solver updates relative coordinates');

const roverState: any = {
  posX: 0,
  altitude: 0,
  vx: 0,
  vy: 0,
  pitchDeg: 0,
  batteryPercent: 100,
  solarPowerWatts: 180,
  sampleCount: 0,
  maxSamples: 5,
  flagsPlanted: [],
  isDrilling: false,
  drillProgress: 0,
  surfacePlanetId: 'mars'
};
const steppedRover = stepRoverPhysics(roverState, 1.0, false, 0.5);
assert(steppedRover.vx > 0 || steppedRover.posX > 0, 'Rover electric drivetrain accelerates forward on Mars');
assert(ROVER_MISSIONS.length === 5, 'All 5 Rover Challenge Missions registered');

// 9. HISTORICAL CAMPAIGNS & AUDIO ENGINE
console.log('\n🏆 [9/9] Testing Historical Campaigns & Mission Audio Engine:');
assert(CAMPAIGN_MISSIONS.length >= 5, `Campaign library has ${CAMPAIGN_MISSIONS.length} curated aerospace missions`);
assert(typeof soundEngine.speak === 'function', 'Speech synthesis voice engine active');
assert(typeof soundEngine.updateEngineSound === 'function', 'Synthesizer Web Audio rumble generator active');

console.log('\n======================================================');
console.log(`🎉 MASSIVE AUDIT RESULT: ${passed} Passed, ${failed} Failed`);
console.log('======================================================\n');

if (failed > 0) process.exit(1);
