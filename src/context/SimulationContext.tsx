import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { 
  AppTab, 
  RocketBlueprint, 
  PlacedPart, 
  WindTunnelState, 
  CelestialBody, 
  AsteroidConfig, 
  ImpactTelemetry, 
  FlightState,
  SymmetryMode,
  GeographicTarget
} from '../types';
import { ROCKET_PRESETS, getSymmetricPlacements } from '../physics/rocket-math';
import { CELESTIAL_PRESETS, stepNBodySimulation } from '../physics/n-body';
import { calculateImpactPhysics, ASTEROID_DENSITIES } from '../physics/impact-physics';
import { initFlightState, stepFlightPhysics, calculateCurrentStageMassAndThrust } from '../physics/flight-dynamics';
import { calculateAtmosphere } from '../physics/aerodynamics';
import { soundEngine } from '../audio/soundEngine';
import { type GlobalStore, createInitialState } from '../store/simulationStore';

const SimulationContext = createContext<GlobalStore | null>(null);

export const SimulationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initial = createInitialState();

  const getInitialTab = (): AppTab => {
    const hash = window.location.hash.replace('#', '') as AppTab;
    const validTabs: AppTab[] = ['rocket-builder', 'wind-tunnel', 'flight-sandbox', 'celestial-sim', 'asteroid-impact', 'constellation', 'rover-surface'];
    return validTabs.includes(hash) ? hash : 'rocket-builder';
  };

  const [activeTab, setActiveTabState] = useState<AppTab>(getInitialTab);

  const setActiveTab = useCallback((tab: AppTab) => {
    setActiveTabState(tab);
    window.location.hash = tab;
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') as AppTab;
      const validTabs: AppTab[] = ['rocket-builder', 'wind-tunnel', 'flight-sandbox', 'celestial-sim', 'asteroid-impact', 'constellation', 'rover-surface'];
      if (validTabs.includes(hash)) {
        setActiveTabState(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  
  // Rocket Builder & Undo/Redo History
  const [blueprint, setBlueprintState] = useState<RocketBlueprint>(initial.blueprint);
  const [history, setHistory] = useState<RocketBlueprint[]>([initial.blueprint]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  const [selectedPartInstanceId, setSelectedPartInstanceId] = useState<string | null>(null);
  const [selectedCatalogPartType, setSelectedCatalogPartType] = useState<string | null>('tank_med_2m');
  const [symmetryMode, setSymmetryMode] = useState<SymmetryMode>('1x');

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
  const [guidanceMode, setGuidanceMode] = useState<'manual' | 'auto'>('manual');

  // Push new blueprint state with Undo/Redo history tracking & localStorage persistence
  const updateBlueprint = useCallback((newBlueprint: RocketBlueprint | ((prev: RocketBlueprint) => RocketBlueprint)) => {
    setBlueprintState(prev => {
      const next = typeof newBlueprint === 'function' ? newBlueprint(prev) : newBlueprint;
      
      // Update history stack
      setHistory(h => {
        const truncated = h.slice(0, historyIndex + 1);
        return [...truncated, next];
      });
      setHistoryIndex(i => i + 1);

      // Auto-save to localStorage
      try {
        localStorage.setItem('mission_control_blueprint', JSON.stringify(next));
      } catch (e) {}

      return next;
    });
  }, [historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const targetIndex = historyIndex - 1;
      const targetBlueprint = history[targetIndex];
      setHistoryIndex(targetIndex);
      setBlueprintState(targetBlueprint);
      try {
        localStorage.setItem('mission_control_blueprint', JSON.stringify(targetBlueprint));
      } catch {}
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const targetIndex = historyIndex + 1;
      const targetBlueprint = history[targetIndex];
      setHistoryIndex(targetIndex);
      setBlueprintState(targetBlueprint);
      try {
        localStorage.setItem('mission_control_blueprint', JSON.stringify(targetBlueprint));
      } catch {}
    }
  }, [history, historyIndex]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // Auto-sync vehicle to flight sandbox whenever blueprint changes
  useEffect(() => {
    if (!flightState.isLaunched) {
      setFlightState(initFlightState(blueprint));
    }
  }, [blueprint, flightState.isLaunched]);

  // =====================
  // ROCKET BUILDER ACTIONS
  // =====================
  const addPartToBlueprint = useCallback((partType: string, x: number, y: number, stage: number = 1) => {
    const placements = getSymmetricPlacements(partType, x, y, 0, symmetryMode);
    
    const newParts: PlacedPart[] = placements.map(pl => ({
      instanceId: `p_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      partType: pl.partType,
      x: Math.round(pl.x),
      y: Math.round(pl.y),
      rotation: pl.rotation,
      stage,
      fuelPercentage: 100
    }));

    updateBlueprint(prev => ({
      ...prev,
      parts: [...prev.parts, ...newParts]
    }));

    if (newParts.length > 0) {
      setSelectedPartInstanceId(newParts[0].instanceId);
    }
  }, [symmetryMode, updateBlueprint]);

  const removePartFromBlueprint = useCallback((instanceId: string) => {
    updateBlueprint(prev => ({
      ...prev,
      parts: prev.parts.filter(p => p.instanceId !== instanceId)
    }));
    setSelectedPartInstanceId(prev => prev === instanceId ? null : prev);
  }, [updateBlueprint]);

  const movePartInBlueprint = useCallback((instanceId: string, x: number, y: number) => {
    updateBlueprint(prev => ({
      ...prev,
      parts: prev.parts.map(p => p.instanceId === instanceId ? { ...p, x: Math.round(x), y: Math.round(y) } : p)
    }));
  }, [updateBlueprint]);

  const rotatePartInBlueprint = useCallback((instanceId: string, angleStep: number = 90) => {
    updateBlueprint(prev => ({
      ...prev,
      parts: prev.parts.map(p => {
        if (p.instanceId === instanceId) {
          const nextRot = (p.rotation + angleStep) % 360;
          return { ...p, rotation: nextRot };
        }
        return p;
      })
    }));
  }, [updateBlueprint]);

  const duplicatePartInBlueprint = useCallback((instanceId: string) => {
    const part = blueprint.parts.find(p => p.instanceId === instanceId);
    if (!part) return;

    const cloned: PlacedPart = {
      ...part,
      instanceId: `p_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      x: part.x + 2,
      y: part.y
    };

    updateBlueprint(prev => ({
      ...prev,
      parts: [...prev.parts, cloned]
    }));
    setSelectedPartInstanceId(cloned.instanceId);
  }, [blueprint.parts, updateBlueprint]);

  const setPartStage = useCallback((instanceId: string, stage: number) => {
    updateBlueprint(prev => ({
      ...prev,
      parts: prev.parts.map(p => p.instanceId === instanceId ? { ...p, stage } : p)
    }));
  }, [updateBlueprint]);

  const loadRocketPreset = useCallback((presetId: string) => {
    const preset = ROCKET_PRESETS.find(p => p.id === presetId);
    if (preset) {
      updateBlueprint(preset);
      setSelectedPartInstanceId(null);
    }
  }, [updateBlueprint]);

  const clearRocketBlueprint = useCallback(() => {
    updateBlueprint({
      id: `custom_${Date.now()}`,
      name: 'New Custom Launch Vehicle',
      parts: [],
      staging: []
    });
    setSelectedPartInstanceId(null);
  }, [updateBlueprint]);

  // =====================
  // WIND TUNNEL ACTIONS
  // =====================
  const setWindTunnelState = useCallback((updater: Partial<WindTunnelState> | ((prev: WindTunnelState) => WindTunnelState)) => {
    setWindTunnelStateRaw(prev => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      const atm = calculateAtmosphere(next.altitude);
      const speedOfSound = atm.speedOfSound;
      const freestreamSpeed = next.mach * speedOfSound;
      const dynamicPressure = 0.5 * atm.density * Math.pow(freestreamSpeed, 2);

      const rocketP = next.rocketPitch || 0;
      const windA = next.windAngle || 0;
      const effectiveAoA = windA - rocketP;

      return {
        ...next,
        airDensity: atm.density,
        airTemperature: atm.temperature,
        freestreamSpeed,
        dynamicPressure,
        angleToGo: effectiveAoA
      };
    });
  }, []);

  const transferRocketToWindTunnel = useCallback(() => {
    setActiveTab('wind-tunnel');
  }, [setActiveTab]);

  // =====================
  // CELESTIAL SIMULATOR ACTIONS
  // =====================
  const loadCelestialPreset = useCallback((presetId: string) => {
    const preset = CELESTIAL_PRESETS.find(p => p.id === presetId);
    if (preset) {
      setCelestialBodies(preset.bodies);
      setSelectedBodyId(preset.bodies[0]?.id || null);
    }
  }, []);

  const addCustomCelestialBody = useCallback((body: Omit<CelestialBody, 'id' | 'trail'>) => {
    const newBody: CelestialBody = {
      ...body,
      id: `body_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      trail: [{ ...body.position }]
    };
    setCelestialBodies(prev => [...prev, newBody]);
    setSelectedBodyId(newBody.id);
  }, []);

  const removeCelestialBody = useCallback((id: string) => {
    setCelestialBodies(prev => prev.filter(b => b.id !== id));
    setSelectedBodyId(prev => prev === id ? null : prev);
  }, []);

  const updateCelestialBody = useCallback((id: string, updates: Partial<CelestialBody>) => {
    setCelestialBodies(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  }, []);

  // RK4 Celestial N-Body Simulation Loop
  useEffect(() => {
    if (activeTab !== 'celestial-sim' || isCelestialPaused) return;

    let animFrame: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = Math.min(0.08, (time - lastTime) / 1000) * timeWarp;
      lastTime = time;

      setCelestialBodies(prev => stepNBodySimulation(prev, dt));
      animFrame = requestAnimationFrame(loop);
    };

    animFrame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrame);
  }, [activeTab, isCelestialPaused, timeWarp]);

  // =====================
  // ASTEROID IMPACT ACTIONS
  // =====================
  const setAsteroidConfig = useCallback((updater: Partial<AsteroidConfig> | ((prev: AsteroidConfig) => AsteroidConfig)) => {
    setAsteroidConfigRaw(prev => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      if (updater && 'composition' in updater && updater.composition) {
        next.density = ASTEROID_DENSITIES[updater.composition] || next.density;
      }
      setImpactTelemetry(calculateImpactPhysics(next));
      return next;
    });
  }, []);

  const setGeographicTarget = useCallback((target: GeographicTarget) => {
    setAsteroidConfigRaw(prev => {
      const next: AsteroidConfig = {
        ...prev,
        targetAreaType: 'custom_geo',
        targetSurfaceType: target.isOcean ? 'water_ocean' : 'sedimentary_rock',
        geographicTarget: target
      };
      setImpactTelemetry(calculateImpactPhysics(next));
      return next;
    });
  }, []);

  const triggerImpactSimulation = useCallback(() => {
    setIsImpactSimulating(true);
    setImpactTriggerCounter(prev => prev + 1);
  }, []);

  const resetImpactSimulation = useCallback(() => {
    setIsImpactSimulating(false);
    setImpactTriggerCounter(0);
  }, []);

  // =====================
  // FLIGHT SANDBOX ACTIONS
  // =====================
  const launchFlight = useCallback(() => {
    soundEngine.speak('Ignition sequence start... 3, 2, 1... Liftoff!');
    setFlightState(prev => ({
      ...prev,
      isLaunched: true,
      isActive: true,
      isPaused: false,
      throttle: 1.0
    }));
  }, []);

  const triggerStaging = useCallback(() => {
    soundEngine.playStageSeparation();
    soundEngine.speak('Stage separation confirmed');
    setFlightState(prev => {
      const maxStage = Math.max(1, ...blueprint.parts.map(p => p.stage || 1));
      if (prev.currentStageIndex >= maxStage) {
        return prev;
      }

      const nextStageIndex = prev.currentStageIndex + 1;
      const nextStageInfo = calculateCurrentStageMassAndThrust(blueprint, nextStageIndex, prev.altitude);

      return {
        ...prev,
        currentStageIndex: nextStageIndex,
        fuelMassRemaining: nextStageInfo.stageFuelMassTons,
        burnTimeRemaining: 60
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
    soundEngine.speak('Emergency launch abort initiated');
    setFlightState(prev => ({
      ...prev,
      aborted: true,
      throttle: 0
    }));
  }, []);

  const resetFlight = useCallback(() => {
    soundEngine.stopEngineAudio();
    setFlightState(initFlightState(blueprint));
  }, [blueprint]);

  const transferRocketToFlight = useCallback(() => {
    setFlightState(initFlightState(blueprint));
    setActiveTab('flight-sandbox');
  }, [blueprint, setActiveTab]);

  // RK4 Flight Physics Loop & Audio Engine Sync (120 FPS Capable with Throttled React Dispatch)
  useEffect(() => {
    if (activeTab !== 'flight-sandbox') {
      soundEngine.stopEngineAudio();
      return;
    }

    let animFrame: number;
    let lastTime = performance.now();
    let frameTick = 0;

    const loop = (time: number) => {
      const dt = Math.min(0.033, (time - lastTime) / 1000);
      lastTime = time;
      frameTick++;

      setFlightState(prev => {
        const next = stepFlightPhysics(prev, blueprint, dt, guidanceMode);
        // Audio synthesis update
        soundEngine.updateEngineSound(next.throttle, next.altitude, next.dynamicPressure);
        return next;
      });

      animFrame = requestAnimationFrame(loop);
    };

    animFrame = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animFrame);
      soundEngine.stopEngineAudio();
    };
  }, [activeTab, blueprint, guidanceMode]);

  // Global Keyboard Shortcuts (Hotkeys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      // Rocket Builder Undo/Redo
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          redo();
        } else {
          e.preventDefault();
          undo();
        }
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
        return;
      }

      // Flight Sandbox Hotkeys
      if (activeTab === 'flight-sandbox') {
        if (e.code === 'Space') {
          e.preventDefault();
          if (!flightState.isLaunched) launchFlight();
          else triggerStaging();
        } else if (e.code === 'KeyZ') {
          e.preventDefault();
          setFlightThrottle(1.0);
        } else if (e.code === 'KeyX') {
          e.preventDefault();
          setFlightThrottle(0);
        } else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
          setFlightThrottle(Math.min(1.0, flightState.throttle + 0.1));
        } else if (e.code === 'ControlLeft' || e.code === 'ControlRight') {
          setFlightThrottle(Math.max(0.0, flightState.throttle - 0.1));
        } else if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
          setFlightPitch(Math.min(90, flightState.pitch + 2));
        } else if (e.code === 'KeyD' || e.code === 'ArrowRight') {
          setFlightPitch(Math.max(0, flightState.pitch - 2));
        } else if (e.code === 'KeyR') {
          resetFlight();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, flightState.isLaunched, flightState.pitch, flightState.throttle, launchFlight, redo, resetFlight, setFlightPitch, setFlightThrottle, triggerStaging, undo]);

  const value: GlobalStore = {
    activeTab,
    isSidebarOpen,
    setActiveTab,
    toggleSidebar: () => setIsSidebarOpen(prev => !prev),
    blueprint,
    selectedPartInstanceId,
    selectedCatalogPartType,
    symmetryMode,
    canUndo,
    canRedo,
    undo,
    redo,
    setSymmetryMode,
    setSelectedPartInstanceId,
    setSelectedCatalogPartType,
    addPartToBlueprint,
    removePartFromBlueprint,
    movePartInBlueprint,
    rotatePartInBlueprint,
    duplicatePartInBlueprint,
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
    updateCelestialBody,
    asteroidConfig,
    impactTelemetry,
    isImpactSimulating,
    impactTriggerCounter,
    setAsteroidConfig,
    setGeographicTarget,
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
  };

  return (
    <SimulationContext.Provider value={value}>
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
