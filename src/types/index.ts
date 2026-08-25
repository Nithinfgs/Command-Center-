export type AppTab = 'rocket-builder' | 'wind-tunnel' | 'flight-sandbox' | 'celestial-sim' | 'asteroid-impact' | 'constellation' | 'rover-surface';

// ==========================================
// ROCKET BUILDER TYPES (SFS-STYLE GRID ASSEMBLY)
// ==========================================

export type PartCategory = 'command' | 'fuel' | 'engine' | 'aerodynamics' | 'staging' | 'utility';
export type SymmetryMode = '1x' | '2x_mirror' | '2x_radial' | '3x' | '4x' | '6x' | '8x';

export interface PartConnectionPoint {
  id: string;
  type: 'top' | 'bottom' | 'left' | 'right' | 'radial';
  x: number; // relative to part center
  y: number; // relative to part center
  connectedToPartId?: string;
  connectedToSocketId?: string;
}

export interface PartDefinition {
  type: string;
  category: PartCategory;
  name: string;
  description: string;
  width: number; // grid units (1 unit = 20px)
  height: number;
  dryMass: number; // tons
  fuelMass: number; // tons
  thrust?: number; // kN (vacuum)
  seaLevelThrust?: number; // kN
  ispVac?: number; // seconds
  ispAtm?: number; // seconds
  dragCoeff: number;
  heatTolerance: number; // Kelvin
  gimbalAngle?: number; // degrees
  color: string;
  texturePattern?: 'ribbed' | 'smooth' | 'tiled' | 'engine-bell' | 'cone' | 'solar' | 'fin';
  connectionPoints: PartConnectionPoint[];
}

export interface PlacedPart {
  instanceId: string;
  partType: string;
  x: number; // Grid coordinates
  y: number;
  rotation: number; // in degrees: 0, 15, 30, 45, 90, 180...
  stage: number; // 1, 2, 3...
  fuelPercentage: number; // 0 to 100
  isActivated?: boolean;
  parentInstanceId?: string; // Attachment tree graph parent
  isDisconnected?: boolean; // True if part is floating without physical attachment
}

export interface RocketBlueprint {
  id: string;
  name: string;
  parts: PlacedPart[];
  staging: number[][]; // Array of stages containing instanceIds
  crossfeedEnabled?: boolean;
}

export interface RocketAeroProperties {
  totalMass: number; // tons (wet)
  dryMass: number; // tons
  fuelMass: number;
  totalThrust: number; // kN
  centerOfMass: { x: number; y: number };
  centerOfPressure: { x: number; y: number };
  centerOfThrust: { x: number; y: number };
  stagesDeltaV: { stage: number; deltaV: number; twr: number; burnTime: number }[];
  totalDeltaV: number;
  maxTWR: number;
  minTWR: number;
  aerodynamicStabilityMargin: number; // distance between CoM and CoP (positive = stable)
  disconnectedPartsCount: number;
  isStructurallySound: boolean;
}

// ==========================================
// AERODYNAMICS & WIND TUNNEL TYPES
// ==========================================

export type FlowRegime = 'subsonic' | 'transonic' | 'supersonic' | 'hypersonic';

export interface WindTunnelState {
  mach: number; // 0.1 to 15.0
  rocketPitch?: number; // Vehicle pitch attitude in degrees (-35 to +35)
  windAngle?: number; // Inflow wind direction in degrees (-35 to +35)
  angleToGo: number; // Effective Angle of Attack in degrees (-45 to 45)
  altitude: number; // meters (0 to 100,000m)
  airDensity: number; // kg/m^3
  airTemperature: number; // Kelvin
  freestreamSpeed: number; // m/s
  dynamicPressure: number; // Pa (q)
  visualizationMode: 'streamlines' | 'thermal' | 'shockwaves' | 'pressure' | 'turbulence';
  showVectorField: boolean;
  smokeDensity: number;
  finDeflectionAngle: number; // fin control surface angle in degrees
  engineTestActive: boolean;
  engineThrottle: number; // 0 to 1
  nozzleChamberPressure: number; // MPa
  propellantChemistry?: 'kerolox' | 'methalox' | 'hydrolox' | 'solid';
}

export interface AeroTelemetry {
  mach: number;
  dragForce: number; // kN
  liftForce: number; // kN
  dragCoefficient: number; // Cd
  liftCoefficient: number; // Cl
  liftToDragRatio: number; // L/D
  stagnationTemperature: number; // Kelvin
  maxHeatFlux: number; // kW/m^2
  boundaryLayerThickness: number; // mm
  shockwaveAngle: number; // degrees
  aerodynamicMoment: number; // kN*m (pitching moment)
  finControlEffectiveness: number;
  reynoldsNumber: number;
  skinFrictionCoefficient: number;
  isStalled: boolean;
}

// ==========================================
// CELESTIAL SIMULATOR & N-BODY TYPES
// ==========================================

export type CelestialBodyType = 'rocky' | 'terrestrial' | 'ocean' | 'gas_giant' | 'ice_giant' | 'star' | 'black_hole';

export interface CelestialBody {
  id: string;
  name: string;
  type: CelestialBodyType;
  mass: number; // kg (scientific scale)
  radius: number; // km
  density: number; // g/cm^3
  position: { x: number; y: number; z: number }; // Astronomical units or scaled km
  velocity: { vx: number; vy: number; vz: number }; // km/s
  color: string;
  secondaryColor?: string;
  hasRings: boolean;
  ringRadiusMin?: number;
  ringRadiusMax?: number;
  ringColor?: string;
  atmosphereDensity: number; // relative to Earth (1.0 = Earth)
  atmosphereColor?: string;
  isFixed?: boolean;
  luminosity?: number;
  trail: { x: number; y: number; z: number }[];
}

export interface ManeuverNode {
  id: string;
  targetBodyId: string;
  timeToNodeSeconds: number;
  deltaVPrograde: number; // m/s (+prograde / -retrograde)
  deltaVNormal: number; // m/s (+normal / -antinormal)
  deltaVRadial: number; // m/s (+radial out / -radial in)
  totalDeltaV: number; // m/s
  predictedApoapsisKm: number;
  predictedPeriapsisKm: number;
}

export interface OrbitalElements {
  semiMajorAxis: number; // km
  eccentricity: number;
  apoapsis: number; // km
  periapsis: number; // km
  orbitalPeriod: number; // seconds
  currentSpeed: number; // km/s
  escapeVelocity: number; // km/s
  isEscapeTrajectory: boolean;
  hyperbolicExcessSpeed?: number; // km/s
}

// ==========================================
// ASTEROID IMPACT TYPES
// ==========================================

export type AsteroidComposition = 'rubble' | 'carbonaceous' | 'silicate' | 'iron_nickel' | 'cometary_ice';
export type TargetAreaType = 'dense_metro' | 'major_city' | 'urban_suburbs' | 'small_town' | 'rural_plains' | 'uninhabited' | 'ocean_deep' | 'custom_geo';

export interface GeographicTarget {
  latitude: number; // -90 to +90
  longitude: number; // -180 to +180
  name: string;
  elevationM: number;
  populationDensityPerKm2: number;
  isOcean: boolean;
  oceanDepthM?: number;
}

export interface AsteroidConfig {
  diameter: number; // meters (10m to 50,000m)
  composition: AsteroidComposition;
  density: number; // kg/m^3
  velocity: number; // km/s (11 to 72 km/s)
  entryAngle: number; // degrees (10 to 90)
  targetBodyId: string;
  targetSurfaceType: 'crystalline_rock' | 'sedimentary_rock' | 'water_ocean' | 'ice_sheet';
  targetAreaType: TargetAreaType;
  customPopulation?: number;
  geographicTarget?: GeographicTarget;
}

export interface ImpactTelemetry {
  kineticEnergyJoules: number;
  kineticEnergyMegatons: number;
  tntEquivalentHiroshimas: number;
  transientCraterDiameter: number; // meters
  finalCraterDiameter: number; // meters
  craterDepth: number; // meters
  craterVolume: number; // m^3
  ejectaBlanketRadius: number; // km
  fireballRadius: number; // km
  thermalIgnitionRadius: number; // km
  overpressure20psiRadius: number; // km (total devastation)
  overpressure5psiRadius: number; // km (residential destruction)
  overpressure1psiRadius: number; // km (glass breakage)
  seismicMagnitude: number; // Richter scale Mw
  soundDecibelsAt100km: number; // dB
  atmosphericDisruptionDescription: string;
  targetPopulation: number;
  estimatedFatalities: number;
  estimatedInjuries: number;
  isOceanImpact: boolean;
  tsunamiWaveHeightAtImpactM: number;
  tsunamiWaveHeightAt100kmM: number;
  tsunamiRunupInundationKm: number;
  tsunamiTravelSpeedKmh: number;
}

// ==========================================
// FLIGHT SANDBOX TYPES
// ==========================================

export interface FlightState {
  isActive: boolean;
  isLaunched: boolean;
  isPaused: boolean;
  altitude: number; // meters
  downrange: number; // meters
  velocity: { vx: number; vy: number }; // m/s
  speed: number; // m/s
  verticalSpeed: number;
  horizontalSpeed: number;
  pitch: number; // degrees (90 = vertical up)
  throttle: number; // 0 to 1
  gForce: number;
  currentStageIndex: number;
  fuelMassRemaining: number;
  burnTimeRemaining: number;
  dynamicPressure: number; // Pa
  maxQReached: number; // Pa
  apoapsis: number; // meters
  periapsis: number; // meters
  orbitalSpeedNeeded: number; // m/s
  trajectoryHistory: { x: number; y: number }[];
  targetPlanetId: string;
  aborted: boolean;
  inOrbit: boolean;
  isEscapeTrajectory: boolean;
  reentryHeatFlux: number; // kW/m^2
  plasmaTemperatureK: number;
  vehicleSkinTempK: number;
  isCrashed: boolean;
  isDisintegrated: boolean;
  crashImpactSpeed: number;
}
