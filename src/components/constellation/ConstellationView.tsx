import React, { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { 
  CONSTELLATION_PRESETS, 
  generateWalkerConstellation, 
  GROUND_STATIONS, 
  type ConstellationConfig, 
  type SatelliteNode 
} from '../../physics/constellations';
import { Radio, Sliders } from 'lucide-react';

export const ConstellationView: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [selectedPresetKey, setSelectedPresetKey] = useState<string>('starlink_shell1');
  const [activeConfig, setActiveConfig] = useState<ConstellationConfig>(CONSTELLATION_PRESETS.starlink_shell1);
  const [showCustomSliders, setShowCustomSliders] = useState<boolean>(false);

  const satellitesRef = useRef<SatelliteNode[]>([]);
  const timeRef = useRef<number>(0);

  const handlePresetSelect = (key: string) => {
    setSelectedPresetKey(key);
    if (CONSTELLATION_PRESETS[key]) {
      setActiveConfig(CONSTELLATION_PRESETS[key]);
    }
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#090A0D');

    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 50000);
    camera.position.set(0, 12000, 24000);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight('#334155', 1.0);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight('#ffffff', 2.5);
    sunLight.position.set(40000, 10000, 30000);
    scene.add(sunLight);

    // 3D Earth Globe
    const earthRadiusKm = 6371;
    const earthGeo = new THREE.SphereGeometry(earthRadiusKm, 48, 48);
    const earthMat = new THREE.MeshStandardMaterial({ color: '#1E3A8A', roughness: 0.8, metalness: 0.1 });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    scene.add(earthMesh);

    // Earth Grid Wire Overlay
    const wireGeo = new THREE.WireframeGeometry(new THREE.SphereGeometry(earthRadiusKm * 1.002, 24, 12));
    const wireMat = new THREE.LineBasicMaterial({ color: '#38BDF8', transparent: true, opacity: 0.2 });
    earthMesh.add(new THREE.LineSegments(wireGeo, wireMat));

    // Satellite Point Meshes
    const satGroup = new THREE.Group();
    scene.add(satGroup);

    // Laser Crosslink Line Segments
    const laserMat = new THREE.LineBasicMaterial({ color: '#55B982', transparent: true, opacity: 0.7 });
    const laserGeo = new THREE.BufferGeometry();
    const laserLines = new THREE.LineSegments(laserGeo, laserMat);
    scene.add(laserLines);

    // Ground Station Uplink Lines
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
      timeRef.current += 0.015;

      const satellites = generateWalkerConstellation(activeConfig, timeRef.current);
      satellitesRef.current = satellites;

      // Update Satellites
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
        const mesh = satGroup.children[i];
        if (mesh) mesh.position.set(sat.position.x, sat.position.y, sat.position.z);
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

        // Find closest visible satellite
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

      earthMesh.rotation.y += 0.0005;
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
  }, [activeConfig]);

  return (
    <div className="relative flex-1 h-full bg-[#090A0D] overflow-hidden select-none font-mono-num">
      <div ref={mountRef} className="w-full h-full block" />

      {/* Top Left Constellation Info Dashboard */}
      <div className="absolute top-3 left-3 bg-[#151820]/90 border border-[#252B36] p-3 rounded-xl shadow-xl space-y-2 max-w-sm backdrop-blur-sm">
        <div className="flex items-center justify-between text-[#FF8A1F] font-bold text-xs uppercase">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4" />
            <span>{activeConfig.name}</span>
          </div>
          <button
            onClick={() => setShowCustomSliders(s => !s)}
            className="p-1 rounded bg-[#1B1F28] hover:bg-[#252B36] text-[#A4ABB6] hover:text-[#E6E8EB]"
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

        {/* Dynamic Walker (T/P/F) Slider Inputs */}
        {showCustomSliders && (
          <div className="pt-2 border-t border-[#252B36] space-y-2 text-xs">
            <div>
              <div className="flex justify-between text-[10px] text-[#A4ABB6]">
                <span>Total Satellites (T):</span>
                <strong className="text-[#38BDF8]">{activeConfig.totalSatellites}</strong>
              </div>
              <input
                type="range"
                min="6"
                max="64"
                step="2"
                value={activeConfig.totalSatellites}
                onChange={(e) => setActiveConfig(c => ({ ...c, totalSatellites: parseInt(e.target.value) }))}
                className="w-full h-1 bg-[#252B36] rounded accent-[#FF8A1F] cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-[10px] text-[#A4ABB6]">
                <span>Planes (P):</span>
                <strong className="text-[#38BDF8]">{activeConfig.planesCount}</strong>
              </div>
              <input
                type="range"
                min="2"
                max="16"
                step="1"
                value={activeConfig.planesCount}
                onChange={(e) => setActiveConfig(c => ({ ...c, planesCount: parseInt(e.target.value) }))}
                className="w-full h-1 bg-[#252B36] rounded accent-[#FF8A1F] cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-[10px] text-[#A4ABB6]">
                <span>Altitude (km):</span>
                <strong className="text-[#38BDF8]">{activeConfig.altitudeKm} km</strong>
              </div>
              <input
                type="range"
                min="300"
                max="22000"
                step="100"
                value={activeConfig.altitudeKm}
                onChange={(e) => setActiveConfig(c => ({ ...c, altitudeKm: parseInt(e.target.value) }))}
                className="w-full h-1 bg-[#252B36] rounded accent-[#FF8A1F] cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-[10px] text-[#A4ABB6]">
                <span>Inclination:</span>
                <strong className="text-[#38BDF8]">{activeConfig.inclinationDeg}°</strong>
              </div>
              <input
                type="range"
                min="0"
                max="98"
                step="1"
                value={activeConfig.inclinationDeg}
                onChange={(e) => setActiveConfig(c => ({ ...c, inclinationDeg: parseInt(e.target.value) }))}
                className="w-full h-1 bg-[#252B36] rounded accent-[#FF8A1F] cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>

      {/* Top Right Preset Selector */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-[#151820]/90 border border-[#252B36] p-1.5 rounded-xl shadow-xl text-xs backdrop-blur-sm">
        {Object.entries(CONSTELLATION_PRESETS).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => handlePresetSelect(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedPresetKey === key
                ? 'bg-[#FF8A1F] text-[#090A0D] shadow-sm'
                : 'text-[#A4ABB6] hover:text-[#E6E8EB] hover:bg-[#1B1F28]'
            }`}
          >
            {cfg.name.split(' ')[0]}
          </button>
        ))}
      </div>

      {/* Bottom Legend */}
      <div className="absolute bottom-3 left-3 bg-[#151820]/80 border border-[#252B36] px-3 py-1.5 rounded-lg text-[11px] text-[#A4ABB6] flex items-center gap-4">
        <span>GREEN: <strong className="text-[#55B982]">Laser Crosslinks</strong></span>
        <span>ORANGE: <strong className="text-[#FF8A1F]">Ground Uplink</strong></span>
        <span>DRAG: <strong className="text-[#E6E8EB]">Rotate 3D</strong></span>
      </div>
    </div>
  );
};
