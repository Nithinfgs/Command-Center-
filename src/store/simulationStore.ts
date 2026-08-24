import type { 
  AppTab, 
  RocketBlueprint, 
  WindTunnelState, 
  CelestialBody, 
  AsteroidConfig, 
  ImpactTelemetry, 
  FlightState,
  SymmetryMode,
  GeographicTarget
} from '../types';
import { ROCKET_PRESETS } from '../physics/rocket-math';
import { CELESTIAL_PRESETS } from '../physics/n-body';
import { calculateImpactPhysics, ASTEROID_DENSITIES, GEOGRAPHIC_TARGETS } from '../physics/impact-physics';
import { initFlightState } from '../physics/flight-dynamics';
import { calculateAtmosphere } from '../physics/aerodynamics';

export interface GlobalStore {
  // Navigation & Responsive
  activeTab: AppTab;
  isSidebarOpen: boolean;
  setActiveTab: (tab: AppTab) => void;
  toggleSidebar: () => void;

  // Rocket Builder
  blueprint: RocketBlueprint;
  selectedPartInstanceId: string | null;
  selectedCatalogPartType: string | null;
  symmetryMode: SymmetryMode;
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  setSymmetryMode: (mode: SymmetryMode) => void;
  setSelectedPartInstanceId: (id: string | null) => void;
  setSelectedCatalogPartType: (type: string | null) => void;
  addPartToBlueprint: (partType: string, x: number, y: number, stage?: number) => void;
  removePartFromBlueprint: (instanceId: string) => void;
  movePartInBlueprint: (instanceId: string, x: number, y: number) => void;
  rotatePartInBlueprint: (instanceId: string, angleStep?: number) => void;
  duplicatePartInBlueprint: (instanceId: string) => void;
  setPartStage: (instanceId: string, stage: number) => void;
  loadRocketPreset: (presetId: string) => void;
  clearRocketBlueprint: () => void;

  // Wind Tunnel & CFD
  windTunnelState: WindTunnelState;
  setWindTunnelState: (updater: Partial<WindTunnelState> | ((prev: WindTunnelState) => WindTunnelState)) => void;
  transferRocketToWindTunnel: () => void;

  // Celestial Simulator
  celestialBodies: CelestialBody[];
  selectedBodyId: string | null;
  timeWarp: number;
  showSpacetimeGrid: boolean;
  showOrbitalTrails: boolean;
  isCelestialPaused: boolean;
  setSelectedBodyId: (id: string | null) => void;
  setTimeWarp: (warp: number) => void;
  setShowSpacetimeGrid: (show: boolean) => void;
  setShowOrbitalTrails: (show: boolean) => void;
  setIsCelestialPaused: (paused: boolean) => void;
  loadCelestialPreset: (presetId: string) => void;
  addCustomCelestialBody: (body: Omit<CelestialBody, 'id' | 'trail'>) => void;
  removeCelestialBody: (id: string) => void;

  // Asteroid Impact Simulator
  asteroidConfig: AsteroidConfig;
  impactTelemetry: ImpactTelemetry;
  isImpactSimulating: boolean;
  impactTriggerCounter: number;
  setAsteroidConfig: (updater: Partial<AsteroidConfig> | ((prev: AsteroidConfig) => AsteroidConfig)) => void;
  setGeographicTarget: (target: GeographicTarget) => void;
  triggerImpactSimulation: () => void;
  resetImpactSimulation: () => void;

  // Flight Sandbox
  flightState: FlightState;
  guidanceMode: 'manual' | 'auto';
  setGuidanceMode: (mode: 'manual' | 'auto') => void;
  launchFlight: () => void;
  triggerStaging: () => void;
  setFlightThrottle: (throttle: number) => void;
  setFlightPitch: (pitch: number) => void;
  abortFlight: () => void;
  resetFlight: () => void;
  transferRocketToFlight: () => void;
}

export function createInitialState() {
  // Try loading saved blueprint from localStorage
  let savedBlueprint = ROCKET_PRESETS[0];
  try {
    const raw = localStorage.getItem('mission_control_blueprint');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.parts) && parsed.parts.length > 0) {
        savedBlueprint = parsed;
      }
    }
  } catch (e) {
    // fallback
  }

  const initialBodies = CELESTIAL_PRESETS[0].bodies;
  
  const initialAsteroidConfig: AsteroidConfig = {
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

  const initialAtm = calculateAtmosphere(0);

  const initialWindTunnel: WindTunnelState = {
    mach: 1.5,
    rocketPitch: 0,
    windAngle: 0,
    angleToGo: 0,
    altitude: 10000,
    airDensity: initialAtm.density,
    airTemperature: initialAtm.temperature,
    freestreamSpeed: 1.5 * initialAtm.speedOfSound,
    dynamicPressure: 0.5 * initialAtm.density * Math.pow(1.5 * initialAtm.speedOfSound, 2),
    visualizationMode: 'streamlines',
    showVectorField: true,
    smokeDensity: 0.8,
    finDeflectionAngle: 0,
    engineTestActive: false,
    engineThrottle: 1.0,
    nozzleChamberPressure: 20.0
  };

  const initialImpactTelemetry = calculateImpactPhysics(initialAsteroidConfig);
  const initialFlight = initFlightState(savedBlueprint);

  return {
    blueprint: savedBlueprint,
    bodies: initialBodies,
    asteroidConfig: initialAsteroidConfig,
    windTunnel: initialWindTunnel,
    impactTelemetry: initialImpactTelemetry,
    flight: initialFlight
  };
}
