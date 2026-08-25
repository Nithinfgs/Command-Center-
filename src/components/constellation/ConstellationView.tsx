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
  Radio, 
  Sliders, 
  Satellite, 
  Search, 
  Play, 
  Pause 
} from 'lucide-react';

export const ConstellationView: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  
  // Mode: 'live_tracker' (Real-time live satellites) or 'constellation_mesh' (Walker Delta builder)
  const [viewMode, setViewMode] = useState<'live_tracker' | 'constellation_mesh'>('live_tracker');
  
  // Live Satellite Tracking States
  const [selectedCategory, setSelectedCategory] = useState<SatelliteCategory>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSatelliteId, setSelectedSatelliteId] = useState<string>('iss');
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

  // Real-time telemetry state for selected satellite
  const [liveTelemetry, setLiveTelemetry] = useState(() => propagateLiveSatellite(activeSelectedSat, 0));

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#07090E');

    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 100000);
    camera.position.set(0, 14000, 26000);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight('#334155', 1.2);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight('#ffffff', 2.8);
    sunLight.position.set(40000, 15000, 30000);
    scene.add(sunLight);

    // 3D Earth Globe
    const earthRadiusKm = 6371;
    const earthGeo = new THREE.SphereGeometry(earthRadiusKm, 64, 64);
    
    // Procedural Atmosphere & Continental Land/Ocean Shader Material
    const earthMat = new THREE.MeshStandardMaterial({
      color: '#1D4ED8',
      roughness: 0.75,
      metalness: 0.15
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    scene.add(earthMesh);

    // Atmosphere Glow Halo
    const atmoGeo = new THREE.SphereGeometry(earthRadiusKm * 1.015, 48, 48);
    const atmoMat = new THREE.MeshBasicMaterial({
      color: '#38BDF8',
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide
    });
    const atmoMesh = new THREE.Mesh(atmoGeo, atmoMat);
    scene.add(atmoMesh);

    // Earth Grid Wire Overlay
    const wireGeo = new THREE.WireframeGeometry(new THREE.SphereGeometry(earthRadiusKm * 1.002, 36, 18));
    const wireMat = new THREE.LineBasicMaterial({ color: '#38BDF8', transparent: true, opacity: 0.18 });
    earthMesh.add(new THREE.LineSegments(wireGeo, wireMat));

    // Ground Stations Meshes
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

      if (viewMode === 'live_tracker') {
        // Hide Walker mode lasers
        laserLines.visible = false;
        uplinkLines.visible = false;
        orbitRingLine.visible = showOrbitRings;
        footprintMesh.visible = showGroundFootprint;

        // Render Real-World Satellites
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
  }, [viewMode, activeConfig, isTimePaused, timeWarp, showOrbitRings, showGroundFootprint]);

  return (
    <div className="relative flex-1 h-full bg-[#07090E] overflow-hidden select-none font-mono-num">
      <div ref={mountRef} className="w-full h-full block" />

      {/* Mode Switcher Tabs */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-[#121620]/95 border border-[#252B36] p-1 rounded-xl shadow-2xl flex items-center gap-1 z-20 backdrop-blur-md">
        <button
          onClick={() => setViewMode('live_tracker')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            viewMode === 'live_tracker'
              ? 'bg-[#38BDF8] text-[#090A0D] shadow-md font-bold'
              : 'text-[#A4ABB6] hover:text-[#E6E8EB] hover:bg-[#1B212D]'
          }`}
        >
          <Satellite className="w-3.5 h-3.5" />
          <span>Real-Time Live Satellites</span>
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
          <span>Walker Constellation Mesh</span>
        </button>
      </div>

      {/* LIVE SATELLITE TRACKER UI */}
      {viewMode === 'live_tracker' && (
        <>
          {/* Top Left: Selected Satellite Telemetry Dossier */}
          <div className="absolute top-16 left-3 bg-[#121620]/95 border border-[#252B36] p-3.5 rounded-xl shadow-2xl space-y-3 max-w-sm backdrop-blur-md z-10">
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

            {/* Real-Time Orbital Telemetry Grid */}
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

            {/* Satellite Mission Details */}
            <p className="text-[10px] text-[#A4ABB6] leading-relaxed bg-[#0A0D14] p-2 rounded border border-[#1F2633]">
              {activeSelectedSat.description}
            </p>

            <div className="flex items-center justify-between text-[10px] text-[#69717E] pt-1">
              <span>Transponder: <strong className="text-[#E6E8EB]">{activeSelectedSat.frequencyBand}</strong></span>
              <span>Power: <strong className="text-[#FBBF24]">{activeSelectedSat.powerWatts}W</strong></span>
            </div>
          </div>

          {/* Right Side: Interactive Satellite Browser & Filter Directory */}
          <div className="absolute top-16 right-3 bg-[#121620]/95 border border-[#252B36] p-3 rounded-xl shadow-2xl space-y-2.5 w-80 max-h-[calc(100%-80px)] flex flex-col backdrop-blur-md z-10">
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
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2 py-1 rounded whitespace-nowrap font-medium transition-colors ${
                    selectedCategory === cat
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
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-96">
              {filteredSatellites.map(sat => {
                const isSelected = sat.id === selectedSatelliteId;
                return (
                  <button
                    key={sat.id}
                    onClick={() => setSelectedSatelliteId(sat.id)}
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
          {/* Top Left Constellation Dashboard */}
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

            {/* Custom Walker Delta (T/P/F) Parameter Sliders */}
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

          {/* Top Right Constellation Preset Selectors */}
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

      {/* Bottom Floating Controls (Time Warp, Orbits, Ground Tracks) */}
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

        {viewMode === 'live_tracker' && (
          <div className="flex items-center gap-3 text-[11px]">
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
              <span>Ground Footprint</span>
            </label>
          </div>
        )}

        {viewMode === 'constellation_mesh' && (
          <div className="flex items-center gap-3 text-[10px]">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#55B982]" /> Laser Crosslinks</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#FF8A1F]" /> Ground DSN Uplink</span>
          </div>
        )}

        <div className="h-4 w-[1px] bg-[#252B36]" />
        <span className="text-[10px] text-[#69717E]">DRAG: Rotate 3D Globe</span>
      </div>
    </div>
  );
};
