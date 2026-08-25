import React, { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { 
  CONSTELLATION_PRESETS, 
  generateWalkerConstellation, 
  GROUND_STATIONS, 
  type ConstellationConfig, 
  type SatelliteNode 
} from '../../physics/constellations';
import { Radio } from 'lucide-react';

export const ConstellationView: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [selectedPresetKey, setSelectedPresetKey] = useState<string>('starlink_shell1');
  const [activeConfig, setActiveConfig] = useState<ConstellationConfig>(CONSTELLATION_PRESETS.starlink_shell1);

  const satellitesRef = useRef<SatelliteNode[]>([]);
  const timeRef = useRef<number>(0);

  useEffect(() => {
    setActiveConfig(CONSTELLATION_PRESETS[selectedPresetKey] || CONSTELLATION_PRESETS.starlink_shell1);
  }, [selectedPresetKey]);

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

    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouse = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - prevMouse.x;
      const dy = e.clientY - prevMouse.y;
      prevMouse = { x: e.clientX, y: e.clientY };

      scene.rotation.y += dx * 0.004;
      scene.rotation.x += dy * 0.004;
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      timeRef.current += 1.5;

      const sats = generateWalkerConstellation(activeConfig, timeRef.current);
      satellitesRef.current = sats;

      // Update Satellite Mesh Positions
      while (satGroup.children.length < sats.length) {
        const satMesh = new THREE.Mesh(
          new THREE.BoxGeometry(220, 220, 220),
          new THREE.MeshBasicMaterial({ color: '#FBBF24' })
        );
        satGroup.add(satMesh);
      }
      while (satGroup.children.length > sats.length) {
        satGroup.remove(satGroup.children[satGroup.children.length - 1]);
      }

      const satMap = new Map<string, SatelliteNode>();
      sats.forEach((sat, idx) => {
        satMap.set(sat.id, sat);
        const mesh = satGroup.children[idx];
        if (mesh) mesh.position.set(sat.position.x, sat.position.y, sat.position.z);
      });

      // Build Laser Crosslink Geometry
      const laserPts: THREE.Vector3[] = [];
      sats.forEach(s1 => {
        s1.crosslinks.forEach(cId => {
          const s2 = satMap.get(cId);
          if (s2) {
            laserPts.push(new THREE.Vector3(s1.position.x, s1.position.y, s1.position.z));
            laserPts.push(new THREE.Vector3(s2.position.x, s2.position.y, s2.position.z));
          }
        });
      });
      laserGeo.setFromPoints(laserPts);

      // Build Ground Station Uplinks
      const uplinkPts: THREE.Vector3[] = [];
      GROUND_STATIONS.forEach(gs => {
        const phi = (90 - gs.latitude) * (Math.PI / 180);
        const theta = (gs.longitude + 180) * (Math.PI / 180);
        const gx = -(earthRadiusKm * Math.sin(phi) * Math.cos(theta));
        const gy = earthRadiusKm * Math.cos(phi);
        const gz = earthRadiusKm * Math.sin(phi) * Math.sin(theta);

        let closestSat: SatelliteNode | null = null;
        let minDist = Infinity;
        sats.forEach(sat => {
          const d = Math.hypot(sat.position.x - gx, sat.position.y - gy, sat.position.z - gz);
          if (d < minDist) {
            minDist = d;
            closestSat = sat;
          }
        });

        if (closestSat && minDist < 2800) {
          uplinkPts.push(new THREE.Vector3(gx, gy, gz));
          uplinkPts.push(new THREE.Vector3((closestSat as any).position.x, (closestSat as any).position.y, (closestSat as any).position.z));
        }
      });
      uplinkGeo.setFromPoints(uplinkPts);

      earthMesh.rotation.y += 0.0005;
      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      dom.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('resize', handleResize);

      scene.traverse(obj => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
          else obj.material.dispose();
        }
      });
      renderer.dispose();
      if (container.contains(dom)) container.removeChild(dom);
    };
  }, [activeConfig]);

  return (
    <div className="relative flex-1 h-full bg-[#090A0D] overflow-hidden select-none font-mono-num">
      <div ref={mountRef} className="w-full h-full block" />

      {/* Top Left Constellation Info Dashboard */}
      <div className="absolute top-3 left-3 bg-[#151820]/90 border border-[#252B36] p-3 rounded-xl shadow-xl space-y-2 max-w-sm">
        <div className="flex items-center gap-2 text-[#FF8A1F] font-bold text-xs uppercase">
          <Radio className="w-4 h-4" />
          <span>{activeConfig.name}</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px] text-[#E6E8EB] pt-1 border-t border-[#252B36]">
          <div>
            <span className="text-[#69717E] block text-[10px]">Satellites:</span>
            <strong>{activeConfig.totalSatellites} Spacecraft</strong>
          </div>
          <div>
            <span className="text-[#69717E] block text-[10px]">Orbital Planes:</span>
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
      </div>

      {/* Top Right Preset Selector */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-[#151820]/90 border border-[#252B36] p-1.5 rounded-xl shadow-xl text-xs">
        {Object.entries(CONSTELLATION_PRESETS).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => setSelectedPresetKey(key)}
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
