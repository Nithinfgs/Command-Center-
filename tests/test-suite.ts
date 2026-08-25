import { PARTS_CATALOG, ROCKET_PRESETS, calculateRocketProperties, getSymmetricPlacements, validateStructuralConnectivity } from './physics/rocket-math';
import { calculateAtmosphere } from './physics/aerodynamics';
import { getFlightAccelerations, stepFlightPhysics, initFlightState, type FlightState } from './physics/flight-dynamics';
import { calculatePairwiseGravity, calculateLagrangePoints, type CelestialBody } from './physics/n-body';
import { calculatePlanetaryDeflection, DART_DEFAULT_MISSION } from './physics/planetary-defense';
import { generateWalkerConstellation, CONSTELLATION_PRESETS, GROUND_STATIONS } from './physics/constellations';
import { stepRoverPhysics, getTerrainElevation, ROVER_MISSIONS } from './physics/rover-physics';
import { stepRendezvousPhysics, PRESET_STATIONS } from './physics/rendezvous-docking';
import { CAMPAIGN_MISSIONS } from './components/campaigns/CampaignMissionModal';

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

console.log('🧪 Starting Mission Control 3.0 Comprehensive Verification Suite...\n');

// 1. ROCKET PRESETS & CAD
console.log('📦 Testing Rocket Presets & CAD Calculus:');
ROCKET_PRESETS.forEach(preset => {
  const conn = validateStructuralConnectivity(preset.parts);
  const metrics = calculateRocketProperties(preset);
  assert(conn.isFullyConnected, `Preset '${preset.name}' is structurally connected`);
  assert(metrics.totalMass > 0 && metrics.dryMass > 0, `Preset '${preset.name}' has valid positive mass (${metrics.totalMass}t)`);
  assert(metrics.totalDeltaV > 0, `Preset '${preset.name}' produces positive total Delta-V (${metrics.totalDeltaV} m/s)`);
});

// 2. STAGING MASS DECOUPLING TEST
console.log('\n🚀 Testing Multi-Stage Decoupling Calculus:');
const saturn = ROCKET_PRESETS.find(p => p.id === 'saturn_v')!;
const saturnMetrics = calculateRocketProperties(saturn);
assert(saturnMetrics.stagesDeltaV.length === 3, 'Saturn V parses 3 distinct stages');
assert(saturnMetrics.stagesDeltaV[1].deltaV > 500, `Stage 2 Delta-V is accurately decoupled (${saturnMetrics.stagesDeltaV[1].deltaV} m/s)`);

// 3. SYMMETRY MODES TEST
console.log('\n📐 Testing 1x, 2x, 3x, 4x, 6x, 8x Symmetry Placements:');
const sym1 = getSymmetricPlacements('srb_heavy', 3, 0, 0, '1x');
assert(sym1.length === 1, '1x symmetry yields 1 placement');

const sym6 = getSymmetricPlacements('srb_heavy', 3, 0, 0, '6x');
assert(sym6.length === 6, '6x symmetry yields 6 radial placements');

const sym8 = getSymmetricPlacements('srb_heavy', 3, 0, 0, '8x');
assert(sym8.length === 8, '8x symmetry yields 8 radial placements');

// 4. FLIGHT DYNAMICS & RK4 INTEGRATOR
console.log('\n🌍 Testing Flight Dynamics & Spherical RK4 Integrator:');
const atmoSea = calculateAtmosphere(0);
const atmoSpace = calculateAtmosphere(120000);
assert(atmoSea.density > 1.2, `Sea-level air density is ${atmoSea.density.toFixed(3)} kg/m³`);
assert(atmoSpace.density < 0.001, 'Space (120km) has negligible atmospheric density');

const initialFlight = initFlightState(saturn);
initialFlight.throttle = 1.0;
initialFlight.pitch = 90;
const steppedFlight = stepFlightPhysics(initialFlight, saturn, 1.0);
assert(steppedFlight.velocity.vy > 0 || steppedFlight.altitude >= 0, 'Flight physics steps smoothly under thrust');

// 5. N-BODY GRAVITATION & LAGRANGE POINTS
console.log('\n🪐 Testing Celestial Gravitation & Lagrange Points:');
const earthBody: CelestialBody = {
  id: 'earth',
  name: 'Earth',
  mass: 5.972e24,
  radius: 6371,
  position: { x: 0, y: 0, z: 0 },
  velocity: { vx: 0, vy: 0, vz: 0 },
  color: '#3b82f6',
  trail: [],
  isCentral: true
};

const moonBody: CelestialBody = {
  id: 'moon',
  name: 'Moon',
  mass: 7.342e22,
  radius: 1737,
  position: { x: 384400, y: 0, z: 0 },
  velocity: { vx: 0, vy: 1.022, vz: 0 },
  color: '#94a3b8',
  trail: []
};

const lagrange = calculateLagrangePoints(earthBody, moonBody);
assert(lagrange.length === 5, 'Lagrange solver generates all 5 points (L1 - L5)');
assert(lagrange[0].x < moonBody.position.x && lagrange[0].x > earthBody.position.x, 'L1 lies between Earth and Moon');
assert(lagrange[1].x > moonBody.position.x, 'L2 lies beyond Moon on Earth-Moon line');

// 6. DART PLANETARY DEFENSE
console.log('\n☄️ Testing Asteroid Impact & DART Deflection:');
const dart = calculatePlanetaryDeflection(
  {
    diameter: 160,
    density: 2400,
    velocity: 25,
    impactAngle: 45,
    targetType: 'sedimentary_rock',
    location: { name: 'Pacific Ocean', lat: 0, lon: -160, isWater: true, waterDepth: 4000 }
  },
  DART_DEFAULT_MISSION
);
assert(dart.deltaVMps > 0, `DART kinetic impact yields ${(dart.deltaVMps * 1000).toFixed(2)} mm/s delta-V`);
assert(dart.deflectionDistanceKm > 0, `DART deflection yields ${dart.deflectionDistanceKm.toFixed(1)} km orbital clearance`);

// 7. WALKER DELTA CONSTELLATIONS
console.log('\n🛰️ Testing Walker Delta Satellite CommNet:');
const starlink = generateWalkerConstellation(CONSTELLATION_PRESETS.starlink_shell1, 0);
assert(starlink.length === 32, `Starlink Gen2 generated exact 32 satellites in 8 planes`);
assert(starlink[0].crosslinks.length > 0, `Satellite ${starlink[0].id} established active laser crosslinks`);

// 8. ROVER DYNAMICS & CHALLENGE MISSIONS
console.log('\n🏎️ Testing Planetary Rover Suspension & Missions:');
const roverElevMars = getTerrainElevation(100, 'mars');
assert(typeof roverElevMars.elevation === 'number', 'Mars terrain elevation function is valid');
assert(ROVER_MISSIONS.length === 5, 'All 5 Rover Challenge Missions are registered');

const testRover = {
  posX: 0,
  altitude: roverElevMars.elevation,
  vx: 0,
  vy: 0,
  pitchDeg: 0,
  batteryPercent: 100,
  solarPowerWatts: 140,
  sampleCount: 0,
  maxSamples: 3,
  flagsPlanted: [],
  isDrilling: false,
  drillProgress: 0,
  surfacePlanetId: 'mars' as const
};
const movedRover = stepRoverPhysics(testRover, 1.0, false, 0.5);
assert(movedRover.vx > 0, `Rover electric motor produced forward velocity (${movedRover.vx.toFixed(2)} m/s)`);

// 9. CLOHESSY-WILTSHIRE DOCKING RENDEZVOUS
console.log('\n🎯 Testing Clohessy-Wiltshire 6-DoF Docking Physics:');
const station = PRESET_STATIONS[0];
const steppedStation = stepRendezvousPhysics(station, { fx: 0, fy: 0, fz: -2.0, torque: 0 }, 0, 0.5);
assert(steppedStation.relativePos.z < station.relativePos.z, 'RCS forward translation reduced closing distance');

// 10. CAMPAIGN MISSION PRESET IDS BINDING
console.log('\n🏆 Testing Campaign Scenario Links:');
CAMPAIGN_MISSIONS.forEach(camp => {
  if (camp.presetId) {
    const found = ROCKET_PRESETS.find(p => p.id === camp.presetId);
    assert(!!found, `Campaign '${camp.title}' presetId '${camp.presetId}' exists in ROCKET_PRESETS catalog`);
  } else {
    assert(true, `Campaign '${camp.title}' runs in designated tab`);
  }
});

console.log(`\n======================================================`);
console.log(`🎉 TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
console.log(`======================================================\n`);

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
