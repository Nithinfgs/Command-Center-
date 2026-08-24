import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { 
  AppTab, 
  RocketBlueprint, 
  PlacedPart, 
  WindTunnelState, 
  CelestialBody, 
  AsteroidConfig, 
  ImpactTelemetry, 
  FlightState 
} from '../types';
import { ROCKET_PRESETS } from '../physics/rocket-math';
import { CELESTIAL_PRESETS, stepNBodySimulation } from '../physics/n-body';
import { calculateImpactPhysics, ASTEROID_DENSITIES } from '../physics/impact-physics';
import { initFlightState, stepFlightPhysics, calculateCurrentStageMassAndThrust } from '../physics/flight-dynamics';
import { calculateAtmosphere } from '../physics/aerodynamics';
import { type GlobalStore, createInitialState } from '../store/simulationStore';

const SimulationContext = createContext<GlobalStore | null>(null);

export const SimulationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initial = createInitialState();

  const [activeTab, setActiveTab] = useState<AppTab>('rocket-builder');
  
  // Rocket Builder
  const [blueprint, setBlueprint] = useState<RocketBlueprint>(initial.blueprint);
  const [selectedPartInstanceId, setSelectedPartInstanceId] = useState<string | null>(null);
  const [selectedCatalogPartType, setSelectedCatalogPartType] = useState<string | null>('tank_med_2m');

  // Wind Tunnel
  const [windTunnelState, setWindTunnelStateRaw] = useState<WindTunnelState>(initial.windTunnel);

  // Celestial Simulator
  const [celestialBodies, setCelestialBodies] = useState<CelestialBody[]>(initial.bodies);
  const [selectedBodyId, setSelectedBodyId] = useState<string | null>('earth');
  const [timeWarp, setTimeWarp] = useState<number>(1);
  const [showSpacetimeGrid, setShowSpacetimeGrid] = useState<boolean>(true);
  const [showOrbitalTrails, setShowOrbitalTrails] = useState<boolean>(true);
  const [isCelestialPaused, setIsCelestialPaused] = useState<boolean>(false);

  // Asteroid Impact
  const [asteroidConfig, setAsteroidConfigRaw] = useState<AsteroidConfig>(initial.asteroidConfig);
  const [impactTelemetry, setImpactTelemetry] = useState<ImpactTelemetry>(initial.impactTelemetry);
  const [isImpactSimulating, setIsImpactSimulating] = useState<boolean>(false);
  const [impactTriggerCounter, setImpactTriggerCounter] = useState<number>(0);

  // Flight Sandbox
  const [flightState, setFlightState] = useState<FlightState>(initial.flight);

  // =====================
  // ROCKET BUILDER ACTIONS
  // =====================
  const addPartToBlueprint = useCallback((partType: string, x: number, y: number, stage: number = 1) => {
    const newPart: PlacedPart = {
      instanceId: `p_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      partType,
      x: Math.round(x),
      y: Math.round(y),
      rotation: 0,
      stage,
      fuelPercentage: 100
    };

    setBlueprint(prev => ({
      ...prev,
      parts: [...prev.parts, newPart]
    }));
    setSelectedPartInstanceId(newPart.instanceId);
  }, []);

  const removePartFromBlueprint = useCallback((instanceId: string) => {
    setBlueprint(prev => ({
      ...prev,
      parts: prev.parts.filter(p => p.instanceId !== instanceId)
    }));
    setSelectedPartInstanceId(prev => prev === instanceId ? null : prev);
  }, []);

  const movePartInBlueprint = useCallback((instanceId: string, x: number, y: number) => {
    setBlueprint(prev => ({
      ...prev,
      parts: prev.parts.map(p => p.instanceId === instanceId ? { ...p, x: Math.round(x), y: Math.round(y) } : p)
    }));
  }, []);

  const rotatePartInBlueprint = useCallback((instanceId: string) => {
    setBlueprint(prev => ({
      ...prev,
      parts: prev.parts.map(p => {
        if (p.instanceId === instanceId) {
          const nextRot = (p.rotation + 90) % 360;
          return { ...p, rotation: nextRot };
        }
        return p;
      })
    }));
  }, []);

  const setPartStage = useCallback((instanceId: string, stage: number) => {
    setBlueprint(prev => ({
      ...prev,
      parts: prev.parts.map(p => p.instanceId === instanceId ? { ...p, stage } : p)
    }));
  }, []);

  const loadRocketPreset = useCallback((presetId: string) => {
    const preset = ROCKET_PRESETS.find(p => p.id === presetId);
    if (preset) {
      setBlueprint(JSON.parse(JSON.stringify(preset)));
      setSelectedPartInstanceId(null);
    }
  }, []);

  const clearRocketBlueprint = useCallback(() => {
    setBlueprint({
      id: `custom_${Date.now()}`,
      name: 'Custom Launcher',
      parts: [],
      staging: [[1]]
    });
    setSelectedPartInstanceId(null);
  }, []);

  // =====================
  // WIND TUNNEL ACTIONS
  // =====================
  const setWindTunnelState = useCallback((updater: Partial<WindTunnelState> | ((prev: WindTunnelState) => WindTunnelState)) => {
    setWindTunnelStateRaw(prev => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      const atm = calculateAtmosphere(next.altitude);
      const soundSpeed = atm.speedOfSound;
      const speed = next.mach * soundSpeed;
      const q = 0.5 * atm.density * speed * speed;
      const effectiveAoA = (next.windAngle ?? prev.windAngle ?? 0) - (next.rocketPitch ?? prev.rocketPitch ?? 0);
      return {
        ...next,
        angleToGo: effectiveAoA,
        airDensity: atm.density,
        airTemperature: atm.temperature,
        freestreamSpeed: speed,
        dynamicPressure: q
      };
    });
  }, []);

  const transferRocketToWindTunnel = useCallback(() => {
    setActiveTab('wind-tunnel');
  }, []);

  // =====================
  // CELESTIAL ACTIONS
  // =====================
  const loadCelestialPreset = useCallback((presetId: string) => {
    const preset = CELESTIAL_PRESETS.find(p => p.id === presetId);
    if (preset) {
      setCelestialBodies(JSON.parse(JSON.stringify(preset.bodies)));
      setSelectedBodyId(preset.bodies[0]?.id || null);
    }
  }, []);

  const addCustomCelestialBody = useCallback((newBodyData: Omit<CelestialBody, 'id' | 'trail'>) => {
    const body: CelestialBody = {
      ...newBodyData,
      id: `body_${Date.now()}`,
      trail: []
    };
    setCelestialBodies(prev => [...prev, body]);
    setSelectedBodyId(body.id);
  }, []);

  const removeCelestialBody = useCallback((id: string) => {
    setCelestialBodies(prev => prev.filter(b => b.id !== id));
    setSelectedBodyId(prev => prev === id ? null : prev);
  }, []);

  // N-Body animation loop
  useEffect(() => {
    if (activeTab !== 'celestial-sim' || isCelestialPaused) return;

    const interval = setInterval(() => {
      setCelestialBodies(prev => {
        const dt = 0.04 * timeWarp;
        return stepNBodySimulation(prev, dt);
      });
    }, 16);

    return () => clearInterval(interval);
  }, [activeTab, isCelestialPaused, timeWarp]);

  // =====================
  // ASTEROID IMPACT ACTIONS
  // =====================
  const setAsteroidConfig = useCallback((updater: Partial<AsteroidConfig> | ((prev: AsteroidConfig) => AsteroidConfig)) => {
    setAsteroidConfigRaw(prev => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      const density = ASTEROID_DENSITIES[next.composition] || next.density;
      const updatedConfig = { ...next, density };
      setImpactTelemetry(calculateImpactPhysics(updatedConfig));
      return updatedConfig;
    });
  }, []);

  const triggerImpactSimulation = useCallback(() => {
    setIsImpactSimulating(true);
    setImpactTriggerCounter(c => c + 1);
  }, []);

  const resetImpactSimulation = useCallback(() => {
    setIsImpactSimulating(false);
  }, []);

  // =====================
  // FLIGHT SANDBOX ACTIONS
  // =====================
  const [guidanceMode, setGuidanceMode] = useState<'manual' | 'auto'>('manual');

  const launchFlight = useCallback(() => {
    setFlightState(prev => {
      const stageInfo = calculateCurrentStageMassAndThrust(blueprint, prev.currentStageIndex, 0);
      return {
        ...prev,
        isLaunched: true,
        isActive: true,
        isPaused: false,
        throttle: prev.throttle > 0 ? prev.throttle : 1.0,
        fuelMassRemaining: stageInfo.stageFuelMassTons > 0 ? stageInfo.stageFuelMassTons : prev.fuelMassRemaining
      };
    });
  }, [blueprint]);

  const triggerStaging = useCallback(() => {
    setFlightState(prev => {
      const nextStage = prev.currentStageIndex + 1;
      const stageInfo = calculateCurrentStageMassAndThrust(blueprint, nextStage, prev.altitude);
      return {
        ...prev,
        currentStageIndex: nextStage,
        fuelMassRemaining: stageInfo.stageFuelMassTons
      };
    });
  }, [blueprint]);

  const setFlightThrottle = useCallback((throttle: number) => {
    setFlightState(prev => ({ ...prev, throttle: Math.max(0, Math.min(1, throttle)) }));
  }, []);

  const setFlightPitch = useCallback((pitch: number) => {
    setFlightState(prev => ({ ...prev, pitch: Math.max(0, Math.min(90, pitch)) }));
  }, []);

  const abortFlight = useCallback(() => {
    setFlightState(prev => ({ ...prev, aborted: true, throttle: 0 }));
  }, []);

  const resetFlight = useCallback(() => {
    const init = initFlightState(blueprint);
    const initialStageInfo = calculateCurrentStageMassAndThrust(blueprint, init.currentStageIndex, 0);
    init.fuelMassRemaining = initialStageInfo.stageFuelMassTons;
    setFlightState(init);
  }, [blueprint]);

  const transferRocketToFlight = useCallback(() => {
    const init = initFlightState(blueprint);
    const initialStageInfo = calculateCurrentStageMassAndThrust(blueprint, init.currentStageIndex, 0);
    init.fuelMassRemaining = initialStageInfo.stageFuelMassTons;
    setFlightState(init);
    setActiveTab('flight-sandbox');
  }, [blueprint]);

  // Flight simulation step loop
  useEffect(() => {
    if (activeTab !== 'flight-sandbox' || !flightState.isLaunched || flightState.isPaused) return;

    const interval = setInterval(() => {
      setFlightState(prev => stepFlightPhysics(prev, blueprint, 0.04, guidanceMode));
    }, 40);

    return () => clearInterval(interval);
  }, [activeTab, flightState.isLaunched, flightState.isPaused, blueprint, guidanceMode]);

  return (
    <SimulationContext.Provider
      value={{
        activeTab,
        setActiveTab,
        blueprint,
        selectedPartInstanceId,
        selectedCatalogPartType,
        setSelectedPartInstanceId,
        setSelectedCatalogPartType,
        addPartToBlueprint,
        removePartFromBlueprint,
        movePartInBlueprint,
        rotatePartInBlueprint,
        setPartStage,
        loadRocketPreset,
        clearRocketBlueprint,
        windTunnelState,
        setWindTunnelState,
        transferRocketToWindTunnel,
        celestialBodies,
        selectedBodyId,
        timeWarp,
        showSpacetimeGrid,
        showOrbitalTrails,
        isCelestialPaused,
        setSelectedBodyId,
        setTimeWarp,
        setShowSpacetimeGrid,
        setShowOrbitalTrails,
        setIsCelestialPaused,
        loadCelestialPreset,
        addCustomCelestialBody,
        removeCelestialBody,
        asteroidConfig,
        impactTelemetry,
        isImpactSimulating,
        impactTriggerCounter,
        setAsteroidConfig,
        triggerImpactSimulation,
        resetImpactSimulation,
        flightState,
        guidanceMode,
        setGuidanceMode,
        launchFlight,
        triggerStaging,
        setFlightThrottle,
        setFlightPitch,
        abortFlight,
        resetFlight,
        transferRocketToFlight
      }}
    >
      {children}
    </SimulationContext.Provider>
  );
};

export const useSimulation = () => {
  const context = useContext(SimulationContext);
  if (!context) {
    throw new Error('useSimulation must be used within a SimulationProvider');
  }
  return context;
};
