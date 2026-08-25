import React, { useRef, useState, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { 
  CONSTELLATION_PRESETS, 
  generateWalkerConstellation, 
  GROUND_STATIONS, 
  REAL_TIME_SATELLITES,
  propagateLiveSatellite,
  type ConstellationConfig, 
  type SatelliteNode,
  type SatelliteCategory
} from '../../physics/constellations';
import { 
  createJupiterTexture 
} from '../../utils/planet-textures';
import { 
  Radio, 
  Sliders, 
  Satellite, 
  Search, 
  Play, 
  Pause, 
  Globe, 
  Sparkles, 
  Compass 
} from 'lucide-react';

export interface CelestialBodyRef {
  id: string;
  name: string;
  type: 'planet' | 'moon' | 'star';
  diameterKm: number;
  realDistanceKm: string;
  distanceAU: string;
  lightTravelTime: string;
  color: string;
  description: string;
}

export const CELESTIAL_BODIES: CelestialBodyRef[] = [
  {
    id: 'moon',
    name: 'Moon (Luna)',
    type: 'moon',
    diameterKm: 3474,
    realDistanceKm: '384,400 km',
    distanceAU: '0.00257 AU',
    lightTravelTime: '1.28 sec',
    color: '#CBD5E1',
    description: "Earth's only natural satellite in synchronous tidal lock with water-ice at polar craters."
  },
  {
    id: 'sun',
    name: 'The Sun (Sol)',
    type: 'star',
    diameterKm: 1392700,
    realDistanceKm: '149,600,000 km',
    distanceAU: '1.00 AU',
    lightTravelTime: '8 min 20 sec',
    color: '#FBBF24',
    description: 'G-type main-sequence star containing 99.86% of Solar System mass powering planetary climate.'
  },
  {
    id: 'mars',
    name: 'Mars (The Red Planet)',
    type: 'planet',
    diameterKm: 6779,
    realDistanceKm: '78,340,000 km',
    distanceAU: '0.52 - 2.52 AU',
    lightTravelTime: '4 min 21 sec',
    color: '#EF4444',
    description: 'Terrestrial planet with thin CO2 atmosphere, Olympus Mons volcano, and prime robotic exploration targets.'
  },
  {
    id: 'venus',
    name: 'Venus (Evening Star)',
    type: 'planet',
    diameterKm: 12104,
    realDistanceKm: '41,400,000 km',
    distanceAU: '0.28 - 1.72 AU',
    lightTravelTime: '2 min 18 sec',
    color: '#FDE047',
    description: 'Volcanic sister planet experiencing runaway greenhouse effect with 465°C surface heat and sulfuric clouds.'
  },
  {
    id: 'jupiter',
    name: 'Jupiter (Gas Giant)',
    type: 'planet',
    diameterKm: 139820,
    realDistanceKm: '628,730,000 km',
    distanceAU: '4.20 - 6.20 AU',
    lightTravelTime: '34 min 56 sec',
    color: '#F59E0B',
    description: 'Largest planet with 95 moons, immense magnetosphere, and the iconic Great Red Spot storm.'
  },
  {
    id: 'saturn',
    name: 'Saturn (Ringed World)',
    type: 'planet',
    diameterKm: 116460,
    realDistanceKm: '1,277,400,000 km',
    distanceAU: '8.54 - 10.54 AU',
    lightTravelTime: '1 hr 11 min',
    color: '#EAB308',
    description: 'Magnificent ringed gas giant composed of icy debris particles with ocean world moon Enceladus.'
  }
];

export const ConstellationView: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  
  // Mode: 'live_tracker' | 'constellation_mesh'
  const [viewMode, setViewMode] = useState<'live_tracker' | 'constellation_mesh'>('live_tracker');
  
  // Camera Scale Scope: 'earth_leo' | 'solar_system'
  const [cameraScope, setCameraScope] = useState<'earth_leo' | 'solar_system'>('earth_leo');
  const [showPlanets, setShowPlanets] = useState<boolean>(true);
  const [showMoon, setShowMoon] = useState<boolean>(true);

  // Selected Target (Satellite or Planet)
  const [selectedSatelliteId, setSelectedSatelliteId] = useState<string>('iss');
  const [selectedCelestialId, setSelectedCelestialId] = useState<string | null>(null);

  // Live Satellite Tracking States
  const [selectedCategory, setSelectedCategory] = useState<SatelliteCategory>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isTimePaused, setIsTimePaused] = useState<boolean>(false);
  const [timeWarp, setTimeWarp] = useState<number>(1);
  const [showOrbitRings, setShowOrbitRings] = useState<boolean>(true);
  const [showGroundFootprint, setShowGroundFootprint] = useState<boolean>(true);

  // Walker Delta Constellation States
  const [selectedPresetKey, setSelectedPresetKey] = useState<string>('starlink_shell1');
  const [activeConfig, setActiveConfig] = useState<ConstellationConfig>(CONSTELLATION_PRESETS.starlink_shell1);
  const [showCustomSliders, setShowCustomSliders] = useState<boolean>(false);

  const timeRef = useRef<number>(0);
  const selectedSatRef = useRef<string>('iss');
  selectedSatRef.current = selectedSatelliteId;

  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  // Filtered Satellites List
  const filteredSatellites = useMemo(() => {
    return REAL_TIME_SATELLITES.filter(sat => {
      const matchCategory = selectedCategory === 'all' || sat.category === selectedCategory;
      const matchSearch = searchQuery.trim() === '' || 
        sat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sat.operator.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sat.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sat.noradId.toString().includes(searchQuery);
      return matchCategory && matchSearch;
    });
  }, [selectedCategory, searchQuery]);

  const activeSelectedSat = useMemo(() => {
    return REAL_TIME_SATELLITES.find(s => s.id === selectedSatelliteId) || REAL_TIME_SATELLITES[0];
  }, [selectedSatelliteId]);

  const activeSelectedCelestial = useMemo(() => {
    return CELESTIAL_BODIES.find(b => b.id === selectedCelestialId) || null;
  }, [selectedCelestialId]);

  // Real-time telemetry state for selected satellite
  const [liveTelemetry, setLiveTelemetry] = useState(() => propagateLiveSatellite(activeSelectedSat, 0));

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#04060A');

    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 300000);
    if (cameraScope === 'solar_system') {
      camera.position.set(0, 45000, 75000);
    } else {
      camera.position.set(0, 14000, 26000);
    }
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight('#334155', 1.4);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight('#ffffff', 3.0);
    sunLight.position.set(50000, 15000, 40000);
    scene.add(sunLight);

    // ==========================================
    // 3D PHOTOREALISTIC NASA SATELLITE EARTH GLOBE
    // ==========================================
    const textureLoader = new THREE.TextureLoader();
    const earthDayMap = textureLoader.load('/textures/earth_day.jpg');
    const earthNormalMap = textureLoader.load('/textures/earth_normal.jpg');
    const earthSpecularMap = textureLoader.load('/textures/earth_specular.jpg');
    const earthCloudsMap = textureLoader.load('/textures/earth_clouds.png');
    const moonMap = textureLoader.load('/textures/moon.jpg');
    const marsMap = textureLoader.load('/textures/mars.jpg');

    const earthRadiusKm = 6371;
    const earthGeo = new THREE.SphereGeometry(earthRadiusKm, 64, 64);
    
    // Photorealistic Earth Surface Material
    const earthMat = new THREE.MeshPhongMaterial({
      map: earthDayMap,
      normalMap: earthNormalMap,
      normalScale: new THREE.Vector2(0.8, 0.8),
      specularMap: earthSpecularMap,
      specular: new THREE.Color('#38BDF8'),
      shininess: 12
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    scene.add(earthMesh);

    // Dynamic Weather Cloud Atmosphere Layer
    const cloudsGeo = new THREE.SphereGeometry(earthRadiusKm * 1.008, 64, 64);
    const cloudsMat = new THREE.MeshStandardMaterial({
      map: earthCloudsMap,
      transparent: true,
      opacity: 0.8,
      blending: THREE.NormalBlending
    });
    const cloudsMesh = new THREE.Mesh(cloudsGeo, cloudsMat);
    scene.add(cloudsMesh);

    // Rayleigh Scattering Atmosphere Rim Glow Halo
    const atmoGeo = new THREE.SphereGeometry(earthRadiusKm * 1.025, 48, 48);
    const atmoMat = new THREE.MeshBasicMaterial({
      color: '#38BDF8',
      transparent: true,
      opacity: 0.22,
      side: THREE.BackSide
    });
    const atmoMesh = new THREE.Mesh(atmoGeo, atmoMat);
    scene.add(atmoMesh);

    // ==========================================
    // CELESTIAL BODIES (MOON, MARS, VENUS, JUPITER, SATURN, SUN)
    // ==========================================
    const planetsGroup = new THREE.Group();
    scene.add(planetsGroup);

    // 1. The Moon (Luna)
    const moonRadius = 1737;
    const moonDist = 28000; // Scaled visual distance relative to Earth
    const moonGeo = new THREE.SphereGeometry(moonRadius, 32, 32);
    const moonMat = new THREE.MeshStandardMaterial({ map: moonMap, roughness: 0.9 });
    const moonMesh = new THREE.Mesh(moonGeo, moonMat);
    planetsGroup.add(moonMesh);

    // Moon Orbit Ring
    const moonOrbitPts: THREE.Vector3[] = [];
    for (let i = 0; i <= 64; i++) {
      const theta = (i / 64) * Math.PI * 2;
      moonOrbitPts.push(new THREE.Vector3(Math.cos(theta) * moonDist, Math.sin(theta) * (moonDist * 0.15), Math.sin(theta) * moonDist));
    }
    const moonOrbitLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(moonOrbitPts),
      new THREE.LineBasicMaterial({ color: '#94A3B8', transparent: true, opacity: 0.35 })
    );
    planetsGroup.add(moonOrbitLine);

    // 2. Mars
    const marsRadius = 3389 * 0.75;
    const marsDist = 48000;
    const marsGeo = new THREE.SphereGeometry(marsRadius, 32, 32);
    const marsMat = new THREE.MeshStandardMaterial({ map: marsMap, roughness: 0.8 });
    const marsMesh = new THREE.Mesh(marsGeo, marsMat);
    planetsGroup.add(marsMesh);

    // 3. Venus
    const venusRadius = 6051 * 0.7;
    const venusDist = 38000;
    const venusGeo = new THREE.SphereGeometry(venusRadius, 32, 32);
    const venusMat = new THREE.MeshStandardMaterial({ color: '#FDE047', roughness: 0.5 });
    const venusMesh = new THREE.Mesh(venusGeo, venusMat);
    planetsGroup.add(venusMesh);

    // 4. Jupiter
    const jupiterRadius = 8000;
    const jupiterDist = 65000;
    const jupiterGeo = new THREE.SphereGeometry(jupiterRadius, 32, 32);
    const jupiterTex = createJupiterTexture();
    const jupiterMat = new THREE.MeshStandardMaterial({ map: jupiterTex, roughness: 0.6 });
    const jupiterMesh = new THREE.Mesh(jupiterGeo, jupiterMat);
    planetsGroup.add(jupiterMesh);

    // 5. Saturn with Rings
    const saturnRadius = 6800;
    const saturnDist = 80000;
    const saturnGeo = new THREE.SphereGeometry(saturnRadius, 32, 32);
    const saturnMat = new THREE.MeshStandardMaterial({ color: '#EAB308', roughness: 0.7 });
    const saturnMesh = new THREE.Mesh(saturnGeo, saturnMat);
    
    // Saturn Rings
    const saturnRingGeo = new THREE.RingGeometry(8500, 16000, 32);
    const saturnRingMat = new THREE.MeshBasicMaterial({ color: '#CA8A04', side: THREE.DoubleSide, transparent: true, opacity: 0.6 });
    const saturnRingMesh = new THREE.Mesh(saturnRingGeo, saturnRingMat);
    saturnRingMesh.rotation.x = Math.PI * 0.4;
    saturnMesh.add(saturnRingMesh);
    planetsGroup.add(saturnMesh);

    // 6. The Sun (Directional radiant sphere)
    const sunRadius = 9000;
    const sunDist = 95000;
    const sunSphereGeo = new THREE.SphereGeometry(sunRadius, 32, 32);
    const sunSphereMat = new THREE.MeshBasicMaterial({ color: '#FBBF24' });
    const sunSphereMesh = new THREE.Mesh(sunSphereGeo, sunSphereMat);
    sunSphereMesh.position.set(sunDist * 0.7, sunDist * 0.2, sunDist * 0.7);
    planetsGroup.add(sunSphereMesh);

    // Sun Corona Glow
    const sunGlowGeo = new THREE.SphereGeometry(sunRadius * 1.35, 24, 24);
    const sunGlowMat = new THREE.MeshBasicMaterial({ color: '#F59E0B', transparent: true, opacity: 0.35 });
    sunSphereMesh.add(new THREE.Mesh(sunGlowGeo, sunGlowMat));

    // Ground Stations
    const gsGroup = new THREE.Group();
    scene.add(gsGroup);
    GROUND_STATIONS.forEach(gs => {
      const latRad = (gs.latitude * Math.PI) / 180;
      const lonRad = (gs.longitude * Math.PI) / 180;
      const gx = earthRadiusKm * Math.cos(latRad) * Math.cos(lonRad);
      const gy = earthRadiusKm * Math.sin(latRad);
      const gz = earthRadiusKm * Math.cos(latRad) * Math.sin(lonRad);

      const pinGeo = new THREE.CylinderGeometry(40, 10, 180, 8);
      const pinMat = new THREE.MeshBasicMaterial({ color: '#FF8A1F' });
      const pin = new THREE.Mesh(pinGeo, pinMat);
      pin.position.set(gx, gy, gz);
      pin.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(gx, gy, gz).normalize());
      gsGroup.add(pin);
    });

    // Satellite Meshes Group
    const satGroup = new THREE.Group();
    scene.add(satGroup);

    // Selection Ring Mesh
    const selRingGeo = new THREE.RingGeometry(180, 260, 32);
    const selRingMat = new THREE.MeshBasicMaterial({ color: '#FBBF24', side: THREE.DoubleSide, transparent: true, opacity: 0.9 });
    const selRingMesh = new THREE.Mesh(selRingGeo, selRingMat);
    scene.add(selRingMesh);

    // Orbit Ring Curve for Selected Satellite
    const orbitRingMat = new THREE.LineBasicMaterial({ color: '#FBBF24', transparent: true, opacity: 0.65 });
    const orbitRingGeo = new THREE.BufferGeometry();
    const orbitRingLine = new THREE.Line(orbitRingGeo, orbitRingMat);
    scene.add(orbitRingLine);

    // Footprint Ground Swath Cone
    const footprintGeo = new THREE.RingGeometry(100, 1200, 32);
    const footprintMat = new THREE.MeshBasicMaterial({ color: '#38BDF8', transparent: true, opacity: 0.25, side: THREE.DoubleSide });
    const footprintMesh = new THREE.Mesh(footprintGeo, footprintMat);
    scene.add(footprintMesh);

    // Walker Mode Laser Lines & Ground Uplinks
    const laserMat = new THREE.LineBasicMaterial({ color: '#55B982', transparent: true, opacity: 0.7 });
    const laserGeo = new THREE.BufferGeometry();
    const laserLines = new THREE.LineSegments(laserGeo, laserMat);
    scene.add(laserLines);

    const uplinkMat = new THREE.LineBasicMaterial({ color: '#FF8A1F', transparent: true, opacity: 0.85 });
    const uplinkGeo = new THREE.BufferGeometry();
    const uplinkLines = new THREE.LineSegments(uplinkGeo, uplinkMat);
    scene.add(uplinkLines);

    let isDragging = false;
    let prevMouse = { x: 0, y: 0 };

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouse = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - prevMouse.x;
      const dy = e.clientY - prevMouse.y;
      prevMouse = { x: e.clientX, y: e.clientY };

      scene.rotation.y += dx * 0.005;
      scene.rotation.x += dy * 0.005;
    };

    const onMouseUp = () => { isDragging = false; };
    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      if (!isTimePaused) {
        timeRef.current += 0.02 * timeWarp;
      }

      const currentTime = timeRef.current;

      // Update Celestial Planets Positions & Rotations
      if (showPlanets || showMoon) {
        planetsGroup.visible = true;

        // Moon Orbit
        const moonAngle = currentTime * 0.12;
        moonMesh.position.set(
          Math.cos(moonAngle) * moonDist,
          Math.sin(moonAngle) * (moonDist * 0.15),
          Math.sin(moonAngle) * moonDist
        );
        moonMesh.rotation.y += 0.005;

        // Mars Position (Relative bearing)
        const marsAngle = 0.8 + currentTime * 0.04;
        marsMesh.position.set(Math.cos(marsAngle) * marsDist, 6000, Math.sin(marsAngle) * marsDist);
        marsMesh.rotation.y += 0.008;

        // Venus Position
        const venusAngle = 2.2 + currentTime * 0.07;
        venusMesh.position.set(Math.cos(venusAngle) * venusDist, -4000, Math.sin(venusAngle) * venusDist);
        venusMesh.rotation.y += 0.004;

        // Jupiter Position
        const jupAngle = 3.6 + currentTime * 0.015;
        jupiterMesh.position.set(Math.cos(jupAngle) * jupiterDist, 10000, Math.sin(jupAngle) * jupiterDist);
        jupiterMesh.rotation.y += 0.012;

        // Saturn Position
        const satAngle = 5.0 + currentTime * 0.008;
        saturnMesh.position.set(Math.cos(satAngle) * saturnDist, -8000, Math.sin(satAngle) * saturnDist);
        saturnMesh.rotation.y += 0.01;
      } else {
        planetsGroup.visible = false;
      }

      if (viewMode === 'live_tracker') {
        laserLines.visible = false;
        uplinkLines.visible = false;
        orbitRingLine.visible = showOrbitRings;
        footprintMesh.visible = showGroundFootprint;

        while (satGroup.children.length > REAL_TIME_SATELLITES.length) {
          satGroup.remove(satGroup.children[satGroup.children.length - 1]);
        }
        while (satGroup.children.length < REAL_TIME_SATELLITES.length) {
          const satSphere = new THREE.Mesh(
            new THREE.SphereGeometry(150, 12, 12),
            new THREE.MeshBasicMaterial({ color: '#38BDF8' })
          );
          satGroup.add(satSphere);
        }

        let currentSelectedPos: THREE.Vector3 | null = null;

        REAL_TIME_SATELLITES.forEach((sat, i) => {
          const state = propagateLiveSatellite(sat, currentTime);
          const mesh = satGroup.children[i] as THREE.Mesh;
          if (mesh) {
            mesh.position.set(state.position.x, state.position.y, state.position.z);
            (mesh.material as THREE.MeshBasicMaterial).color.set(sat.color || '#38BDF8');

            const isSelected = sat.id === selectedSatRef.current;
            mesh.scale.setScalar(isSelected ? 2.2 : 1.0);

            if (isSelected) {
              currentSelectedPos = mesh.position.clone();
              setLiveTelemetry(state);
            }
          }
        });

        // Update Selection Target Ring
        if (currentSelectedPos) {
          selRingMesh.visible = true;
          selRingMesh.position.copy(currentSelectedPos);
          selRingMesh.lookAt(0, 0, 0);

          // Update Orbit Ellipse Ring
          const targetSat = REAL_TIME_SATELLITES.find(s => s.id === selectedSatRef.current);
          if (targetSat && showOrbitRings) {
            const orbitPts: THREE.Vector3[] = [];
            const numPts = 72;
            for (let k = 0; k <= numPts; k++) {
              const tStep = (k / numPts) * (targetSat.periodMin * 60);
              const pState = propagateLiveSatellite(targetSat, currentTime + tStep);
              orbitPts.push(new THREE.Vector3(pState.position.x, pState.position.y, pState.position.z));
            }
            orbitRingGeo.setFromPoints(orbitPts);
          }

          // Update Ground Footprint Swath
          if (showGroundFootprint) {
            const subNorm = (currentSelectedPos as THREE.Vector3).clone().normalize();
            footprintMesh.position.copy(subNorm.clone().multiplyScalar(earthRadiusKm * 1.005));
            footprintMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), subNorm);
          }
        } else {
          selRingMesh.visible = false;
        }

      } else {
        // Walker Delta Mode
        laserLines.visible = true;
        uplinkLines.visible = true;
        orbitRingLine.visible = false;
        footprintMesh.visible = false;
        selRingMesh.visible = false;

        const satellites = generateWalkerConstellation(activeConfig, currentTime);

        while (satGroup.children.length > satellites.length) {
          satGroup.remove(satGroup.children[satGroup.children.length - 1]);
        }
        while (satGroup.children.length < satellites.length) {
          const satMesh = new THREE.Mesh(
            new THREE.SphereGeometry(140, 8, 8),
            new THREE.MeshBasicMaterial({ color: '#38BDF8' })
          );
          satGroup.add(satMesh);
        }

        satellites.forEach((sat: SatelliteNode, i: number) => {
          const mesh = satGroup.children[i] as THREE.Mesh;
          if (mesh) {
            mesh.position.set(sat.position.x, sat.position.y, sat.position.z);
            (mesh.material as THREE.MeshBasicMaterial).color.set('#38BDF8');
            mesh.scale.setScalar(1.0);
          }
        });

        // Update Laser Links
        const laserPositions: number[] = [];
        satellites.forEach((sat: SatelliteNode) => {
          sat.crosslinks.forEach((targetId: string) => {
            const targetSat = satellites.find((s: SatelliteNode) => s.id === targetId);
            if (targetSat) {
              laserPositions.push(
                sat.position.x, sat.position.y, sat.position.z,
                targetSat.position.x, targetSat.position.y, targetSat.position.z
              );
            }
          });
        });
        laserGeo.setAttribute('position', new THREE.Float32BufferAttribute(laserPositions, 3));

        // Update Ground Station Uplinks
        const uplinkPositions: number[] = [];
        GROUND_STATIONS.forEach(ground => {
          const latRad = (ground.latitude * Math.PI) / 180;
          const lonRad = (ground.longitude * Math.PI) / 180;
          const gx = earthRadiusKm * Math.cos(latRad) * Math.cos(lonRad);
          const gy = earthRadiusKm * Math.sin(latRad);
          const gz = earthRadiusKm * Math.cos(latRad) * Math.sin(lonRad);

          let closestSat: SatelliteNode | null = null;
          let minD = Infinity;
          satellites.forEach(s => {
            const d = Math.hypot(s.position.x - gx, s.position.y - gy, s.position.z - gz);
            if (d < minD && d < 3500) {
              minD = d;
              closestSat = s;
            }
          });

          if (closestSat) {
            const cs: SatelliteNode = closestSat;
            uplinkPositions.push(gx, gy, gz, cs.position.x, cs.position.y, cs.position.z);
          }
        });
        uplinkGeo.setAttribute('position', new THREE.Float32BufferAttribute(uplinkPositions, 3));
      }

      earthMesh.rotation.y += 0.0004;
      cloudsMesh.rotation.y += 0.00055;
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      renderer.dispose();
      if (container.contains(dom)) container.removeChild(dom);
    };
  }, [viewMode, activeConfig, isTimePaused, timeWarp, showOrbitRings, showGroundFootprint, cameraScope, showPlanets, showMoon]);

  return (
    <div className="relative flex-1 h-full bg-[#04060A] overflow-hidden select-none font-mono-num">
      <div ref={mountRef} className="w-full h-full block" />

      {/* Top Center: View Mode & Camera Scope Switchers */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
        <div className="bg-[#121620]/95 border border-[#252B36] p-1 rounded-xl shadow-2xl flex items-center gap-1 backdrop-blur-md">
          <button
            onClick={() => setViewMode('live_tracker')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'live_tracker'
                ? 'bg-[#38BDF8] text-[#090A0D] shadow-md font-bold'
                : 'text-[#A4ABB6] hover:text-[#E6E8EB] hover:bg-[#1B212D]'
            }`}
          >
            <Satellite className="w-3.5 h-3.5" />
            <span>Real-Time Satellites</span>
          </button>

          <button
            onClick={() => setViewMode('constellation_mesh')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'constellation_mesh'
                ? 'bg-[#FF8A1F] text-[#090A0D] shadow-md font-bold'
                : 'text-[#A4ABB6] hover:text-[#E6E8EB] hover:bg-[#1B212D]'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Walker Mesh</span>
          </button>
        </div>

        {/* Camera Scope View Switcher */}
        <div className="bg-[#121620]/95 border border-[#252B36] p-1 rounded-xl shadow-2xl flex items-center gap-1 backdrop-blur-md">
          <button
            onClick={() => setCameraScope('earth_leo')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              cameraScope === 'earth_leo'
                ? 'bg-[#10B981] text-[#090A0D] shadow-md font-bold'
                : 'text-[#A4ABB6] hover:text-[#E6E8EB] hover:bg-[#1B212D]'
            }`}
            title="Focus close-up on Earth and LEO Spacecraft"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Earth (LEO)</span>
          </button>

          <button
            onClick={() => setCameraScope('solar_system')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              cameraScope === 'solar_system'
                ? 'bg-[#8B5CF6] text-[#FFFFFF] shadow-md font-bold'
                : 'text-[#A4ABB6] hover:text-[#E6E8EB] hover:bg-[#1B212D]'
            }`}
            title="Pull back to view Solar System planets relative to Earth"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Planets View</span>
          </button>
        </div>
      </div>

      {/* LIVE SATELLITE TRACKER UI */}
      {viewMode === 'live_tracker' && (
        <>
          {/* Top Left: Selected Target Telemetry (Satellite or Celestial Body) */}
          <div className="absolute top-16 left-3 bg-[#121620]/95 border border-[#252B36] p-3.5 rounded-xl shadow-2xl space-y-3 max-w-sm backdrop-blur-md z-10">
            {activeSelectedCelestial ? (
              // Celestial Planet Dossier
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2 border-b border-[#252B36] pb-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: activeSelectedCelestial.color }} />
                      <span className="text-[#E6E8EB] font-bold text-xs">{activeSelectedCelestial.name}</span>
                    </div>
                    <span className="text-[#69717E] text-[10px] block mt-0.5">
                      Celestial Reference Object • {activeSelectedCelestial.type.toUpperCase()}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedCelestialId(null)}
                    className="text-[10px] px-2 py-0.5 rounded bg-[#1B212D] text-[#A4ABB6] hover:text-[#E6E8EB]"
                  >
                    Back to Sats
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-[#E6E8EB]">
                  <div className="bg-[#0A0D14] p-2 rounded border border-[#1F2633]">
                    <span className="text-[#69717E] text-[9px] uppercase block">Distance to Earth</span>
                    <strong className="text-[#38BDF8] text-xs">{activeSelectedCelestial.realDistanceKm}</strong>
                  </div>
                  <div className="bg-[#0A0D14] p-2 rounded border border-[#1F2633]">
                    <span className="text-[#69717E] text-[9px] uppercase block">Astronomical Units</span>
                    <strong className="text-[#34D399] text-xs">{activeSelectedCelestial.distanceAU}</strong>
                  </div>
                  <div className="bg-[#0A0D14] p-2 rounded border border-[#1F2633]">
                    <span className="text-[#69717E] text-[9px] uppercase block">Physical Diameter</span>
                    <strong className="text-[#FBBF24] text-xs">{activeSelectedCelestial.diameterKm.toLocaleString()} km</strong>
                  </div>
                  <div className="bg-[#0A0D14] p-2 rounded border border-[#1F2633]">
                    <span className="text-[#69717E] text-[9px] uppercase block">Light Travel Time</span>
                    <strong className="text-[#E6E8EB] text-xs">{activeSelectedCelestial.lightTravelTime}</strong>
                  </div>
                </div>

                <p className="text-[10px] text-[#A4ABB6] leading-relaxed bg-[#0A0D14] p-2 rounded border border-[#1F2633]">
                  {activeSelectedCelestial.description}
                </p>
              </div>
            ) : (
              // Satellite Telemetry Dossier
              <>
                <div className="flex items-start justify-between gap-2 border-b border-[#252B36] pb-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: activeSelectedSat.color }} />
                      <span className="text-[#E6E8EB] font-bold text-xs">{activeSelectedSat.name}</span>
                    </div>
                    <span className="text-[#69717E] text-[10px] block mt-0.5">
                      NORAD #{activeSelectedSat.noradId} • {activeSelectedSat.operator}
                    </span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1B212D] border border-[#252B36] text-[#38BDF8] font-semibold uppercase">
                    {activeSelectedSat.category.replace('_', ' ')}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-[#E6E8EB]">
                  <div className="bg-[#0A0D14] p-2 rounded border border-[#1F2633]">
                    <span className="text-[#69717E] text-[9px] uppercase block">Sub-Sat Coordinates</span>
                    <strong className="text-[#38BDF8] text-xs">
                      {liveTelemetry.lat >= 0 ? `${liveTelemetry.lat}° N` : `${Math.abs(liveTelemetry.lat)}° S`},{' '}
                      {liveTelemetry.lon >= 0 ? `${liveTelemetry.lon}° E` : `${Math.abs(liveTelemetry.lon)}° W`}
                    </strong>
                  </div>

                  <div className="bg-[#0A0D14] p-2 rounded border border-[#1F2633]">
                    <span className="text-[#69717E] text-[9px] uppercase block">Altitude</span>
                    <strong className="text-[#34D399] text-xs">{liveTelemetry.altKm.toLocaleString()} km</strong>
                  </div>

                  <div className="bg-[#0A0D14] p-2 rounded border border-[#1F2633]">
                    <span className="text-[#69717E] text-[9px] uppercase block">Orbital Velocity</span>
                    <strong className="text-[#FBBF24] text-xs">
                      {liveTelemetry.speedKmS} km/s <span className="text-[9px] text-[#69717E]">({(liveTelemetry.speedKmS * 3600).toFixed(0)} km/h)</span>
                    </strong>
                  </div>

                  <div className="bg-[#0A0D14] p-2 rounded border border-[#1F2633]">
                    <span className="text-[#69717E] text-[9px] uppercase block">Orbital Period</span>
                    <strong className="text-[#E6E8EB] text-xs">{activeSelectedSat.periodMin} min</strong>
                  </div>
                </div>

                <p className="text-[10px] text-[#A4ABB6] leading-relaxed bg-[#0A0D14] p-2 rounded border border-[#1F2633]">
                  {activeSelectedSat.description}
                </p>

                <div className="flex items-center justify-between text-[10px] text-[#69717E] pt-1">
                  <span>Transponder: <strong className="text-[#E6E8EB]">{activeSelectedSat.frequencyBand}</strong></span>
                  <span>Power: <strong className="text-[#FBBF24]">{activeSelectedSat.powerWatts}W</strong></span>
                </div>
              </>
            )}
          </div>

          {/* Right Side: Interactive Satellite & Celestial Objects Directory */}
          <div className="absolute top-16 right-3 bg-[#121620]/95 border border-[#252B36] p-3 rounded-xl shadow-2xl space-y-2.5 w-84 max-h-[calc(100%-80px)] flex flex-col backdrop-blur-md z-10">
            {/* Celestial Planets Quick Bar */}
            <div className="bg-[#0A0D14] p-2 rounded-lg border border-[#1F2633] space-y-1.5">
              <div className="flex items-center justify-between text-[10px] text-[#A4ABB6]">
                <span className="flex items-center gap-1 font-semibold text-[#FF8A1F]">
                  <Compass className="w-3 h-3" />
                  <span>Solar System References</span>
                </span>
                <span className="text-[#69717E]">Relative to Earth</span>
              </div>
              <div className="grid grid-cols-3 gap-1 text-[10px]">
                {CELESTIAL_BODIES.map(body => (
                  <button
                    key={body.id}
                    onClick={() => setSelectedCelestialId(body.id)}
                    className={`px-1.5 py-1 rounded text-left border flex items-center gap-1 transition-colors ${
                      selectedCelestialId === body.id
                        ? 'bg-[#1B283D] border-[#38BDF8] text-[#E6E8EB]'
                        : 'bg-[#121620] border-[#252B36] text-[#A4ABB6] hover:text-[#E6E8EB]'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: body.color }} />
                    <span className="truncate">{body.name.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#69717E] absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search satellite, operator, NORAD..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-[#0A0D14] border border-[#252B36] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#E6E8EB] placeholder-[#69717E] focus:outline-none focus:border-[#38BDF8]"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none text-[10px]">
              {(['all', 'stations', 'comm', 'navigation', 'earth_obs', 'deep_space', 'debris'] as SatelliteCategory[]).map(cat => (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setSelectedCelestialId(null);
                  }}
                  className={`px-2 py-1 rounded whitespace-nowrap font-medium transition-colors ${
                    selectedCategory === cat && !selectedCelestialId
                      ? 'bg-[#38BDF8] text-[#090A0D] font-bold'
                      : 'bg-[#1B212D] text-[#A4ABB6] hover:text-[#E6E8EB]'
                  }`}
                >
                  {cat === 'all' && 'All Types'}
                  {cat === 'stations' && 'Stations & Science'}
                  {cat === 'comm' && 'Starlink & Comm'}
                  {cat === 'navigation' && 'GPS & GNSS'}
                  {cat === 'earth_obs' && 'Earth Obs'}
                  {cat === 'deep_space' && 'Deep Space'}
                  {cat === 'debris' && 'Debris'}
                </button>
              ))}
            </div>

            {/* Scrollable Satellite Fleet List */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-72">
              {filteredSatellites.map(sat => {
                const isSelected = sat.id === selectedSatelliteId && !selectedCelestialId;
                return (
                  <button
                    key={sat.id}
                    onClick={() => {
                      setSelectedSatelliteId(sat.id);
                      setSelectedCelestialId(null);
                    }}
                    className={`w-full text-left p-2 rounded-lg border transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#1B283D] border-[#38BDF8] text-[#E6E8EB] shadow-md'
                        : 'bg-[#0A0D14] border-[#1F2633] text-[#A4ABB6] hover:bg-[#141A26] hover:text-[#E6E8EB]'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: sat.color }} />
                        <span className="font-semibold text-xs text-[#E6E8EB]">{sat.name}</span>
                      </div>
                      <div className="text-[10px] text-[#69717E]">
                        {sat.operator} • Alt: {sat.altitudeKm} km
                      </div>
                    </div>
                    <span className="text-[10px] font-mono-num font-semibold text-[#38BDF8]">
                      {sat.inclinationDeg}°
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* WALKER CONSTELLATION MESH UI */}
      {viewMode === 'constellation_mesh' && (
        <>
          <div className="absolute top-16 left-3 bg-[#121620]/95 border border-[#252B36] p-3.5 rounded-xl shadow-2xl space-y-2.5 max-w-sm backdrop-blur-md z-10">
            <div className="flex items-center justify-between text-[#FF8A1F] font-bold text-xs uppercase">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4" />
                <span>{activeConfig.name}</span>
              </div>
              <button
                onClick={() => setShowCustomSliders(s => !s)}
                className="p-1 rounded bg-[#1B212D] hover:bg-[#252B36] text-[#A4ABB6] hover:text-[#E6E8EB]"
                title="Toggle Custom (T/P/F) Controls"
              >
                <Sliders className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] text-[#E6E8EB] pt-1 border-t border-[#252B36]">
              <div>
                <span className="text-[#69717E] block text-[10px]">Satellites (T):</span>
                <strong>{activeConfig.totalSatellites} Spacecraft</strong>
              </div>
              <div>
                <span className="text-[#69717E] block text-[10px]">Planes (P):</span>
                <strong>{activeConfig.planesCount} Planes</strong>
              </div>
              <div>
                <span className="text-[#69717E] block text-[10px]">Altitude:</span>
                <strong>{activeConfig.altitudeKm} km</strong>
              </div>
              <div>
                <span className="text-[#69717E] block text-[10px]">Inclination:</span>
                <strong>{activeConfig.inclinationDeg}°</strong>
              </div>
            </div>

            {showCustomSliders && (
              <div className="pt-2 border-t border-[#252B36] space-y-2 text-xs">
                <span className="text-[#FF8A1F] font-semibold block text-[10px] uppercase">Walker Delta Parameters</span>
                <div>
                  <div className="flex justify-between text-[10px] text-[#A4ABB6]">
                    <span>Total Satellites (T):</span>
                    <strong>{activeConfig.totalSatellites}</strong>
                  </div>
                  <input
                    type="range"
                    min="6"
                    max="72"
                    step="2"
                    value={activeConfig.totalSatellites}
                    onChange={e => setActiveConfig(c => ({ ...c, totalSatellites: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[10px] text-[#A4ABB6]">
                    <span>Orbital Planes (P):</span>
                    <strong>{activeConfig.planesCount}</strong>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="12"
                    step="1"
                    value={activeConfig.planesCount}
                    onChange={e => setActiveConfig(c => ({ ...c, planesCount: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[10px] text-[#A4ABB6]">
                    <span>Altitude:</span>
                    <strong>{activeConfig.altitudeKm} km</strong>
                  </div>
                  <input
                    type="range"
                    min="300"
                    max="36000"
                    step="100"
                    value={activeConfig.altitudeKm}
                    onChange={e => setActiveConfig(c => ({ ...c, altitudeKm: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="absolute top-16 right-3 flex items-center gap-1.5 bg-[#121620]/95 border border-[#252B36] p-1.5 rounded-xl shadow-xl backdrop-blur-md z-10">
            {Object.keys(CONSTELLATION_PRESETS).map(key => (
              <button
                key={key}
                onClick={() => {
                  setSelectedPresetKey(key);
                  setActiveConfig(CONSTELLATION_PRESETS[key]);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedPresetKey === key
                    ? 'bg-[#FF8A1F] text-[#090A0D] font-bold shadow-md'
                    : 'bg-[#1B212D] text-[#A4ABB6] hover:text-[#E6E8EB]'
                }`}
              >
                {CONSTELLATION_PRESETS[key].name.split(' ')[0]}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Bottom Floating Controls (Time Warp, Orbits, Ground Tracks, Celestial Toggles) */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-[#121620]/95 border border-[#252B36] px-4 py-2 rounded-xl shadow-2xl flex items-center gap-4 text-xs text-[#A4ABB6] backdrop-blur-md z-20">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsTimePaused(p => !p)}
            className="p-1.5 rounded bg-[#1B212D] hover:bg-[#252B36] text-[#E6E8EB] transition-colors"
            title={isTimePaused ? 'Play' : 'Pause'}
          >
            {isTimePaused ? <Play className="w-3.5 h-3.5 text-[#34D399]" /> : <Pause className="w-3.5 h-3.5 text-[#FF8A1F]" />}
          </button>

          <div className="flex items-center gap-1 text-[11px]">
            {[1, 5, 25, 100].map(warp => (
              <button
                key={warp}
                onClick={() => setTimeWarp(warp)}
                className={`px-1.5 py-0.5 rounded font-mono-num font-semibold text-[10px] ${
                  timeWarp === warp ? 'bg-[#38BDF8] text-[#090A0D]' : 'bg-[#1B212D] text-[#A4ABB6] hover:text-[#E6E8EB]'
                }`}
              >
                {warp}x
              </button>
            ))}
          </div>
        </div>

        <div className="h-4 w-[1px] bg-[#252B36]" />

        <div className="flex items-center gap-3 text-[11px]">
          <label className="flex items-center gap-1.5 cursor-pointer hover:text-[#E6E8EB]">
            <input
              type="checkbox"
              checked={showPlanets}
              onChange={e => setShowPlanets(e.target.checked)}
              className="rounded bg-[#1B212D] border-[#252B36] text-[#8B5CF6]"
            />
            <span>Show Planets</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer hover:text-[#E6E8EB]">
            <input
              type="checkbox"
              checked={showMoon}
              onChange={e => setShowMoon(e.target.checked)}
              className="rounded bg-[#1B212D] border-[#252B36] text-[#CBD5E1]"
            />
            <span>Show Moon</span>
          </label>

          {viewMode === 'live_tracker' && (
            <>
              <label className="flex items-center gap-1.5 cursor-pointer hover:text-[#E6E8EB]">
                <input
                  type="checkbox"
                  checked={showOrbitRings}
                  onChange={e => setShowOrbitRings(e.target.checked)}
                  className="rounded bg-[#1B212D] border-[#252B36] text-[#38BDF8]"
                />
                <span>Orbit Ring</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer hover:text-[#E6E8EB]">
                <input
                  type="checkbox"
                  checked={showGroundFootprint}
                  onChange={e => setShowGroundFootprint(e.target.checked)}
                  className="rounded bg-[#1B212D] border-[#252B36] text-[#38BDF8]"
                />
                <span>Footprint</span>
              </label>
            </>
          )}
        </div>

        <div className="h-4 w-[1px] bg-[#252B36]" />
        <span className="text-[10px] text-[#69717E]">DRAG: Rotate 3D Space</span>
      </div>
    </div>
  );
};
