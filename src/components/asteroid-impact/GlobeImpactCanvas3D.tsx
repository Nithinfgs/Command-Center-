import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useSimulation } from '../../context/SimulationContext';

export const GlobeImpactCanvas3D: React.FC = () => {
  const { asteroidConfig, impactTelemetry } = useSimulation();
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#090A0D');
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 5, 14);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Ambient and Sun Lights
    const ambientLight = new THREE.AmbientLight('#1E293B', 1.2);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight('#ffffff', 2.5);
    sunLight.position.set(20, 10, 20);
    scene.add(sunLight);

    // 3D Earth Globe with NASA Photorealistic Texture Maps
    const textureLoader = new THREE.TextureLoader();
    const earthDayMap = textureLoader.load('/textures/earth_day.jpg');
    const earthNormalMap = textureLoader.load('/textures/earth_normal.jpg');
    const earthSpecularMap = textureLoader.load('/textures/earth_specular.jpg');
    const earthCloudsMap = textureLoader.load('/textures/earth_clouds.png');

    const globeRadius = 4.5;
    const earthGeo = new THREE.SphereGeometry(globeRadius, 64, 64);
    const earthMat = new THREE.MeshPhongMaterial({
      map: earthDayMap,
      normalMap: earthNormalMap,
      normalScale: new THREE.Vector2(0.8, 0.8),
      specularMap: earthSpecularMap,
      specular: new THREE.Color('#38BDF8'),
      shininess: 15
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    scene.add(earthMesh);

    // Weather Clouds Layer
    const cloudsGeo = new THREE.SphereGeometry(globeRadius * 1.008, 64, 64);
    const cloudsMat = new THREE.MeshStandardMaterial({
      map: earthCloudsMap,
      transparent: true,
      opacity: 0.8,
      blending: THREE.NormalBlending
    });
    const cloudsMesh = new THREE.Mesh(cloudsGeo, cloudsMat);
    scene.add(cloudsMesh);

    // Atmospheric Glow Halo
    const atmoGeo = new THREE.SphereGeometry(globeRadius * 1.06, 32, 32);
    const atmoMat = new THREE.MeshBasicMaterial({
      color: '#38BDF8',
      transparent: true,
      opacity: 0.2,
      side: THREE.BackSide
    });
    const atmoMesh = new THREE.Mesh(atmoGeo, atmoMat);
    scene.add(atmoMesh);

    // Pinpoint Impact Target Coordinates (Lat, Lon)
    const lat = asteroidConfig.geographicTarget?.latitude || 35.6762;
    const lon = asteroidConfig.geographicTarget?.longitude || 139.6503;
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);

    const targetX = -(globeRadius * Math.sin(phi) * Math.cos(theta));
    const targetY = globeRadius * Math.cos(phi);
    const targetZ = globeRadius * Math.sin(phi) * Math.sin(theta);

    // Epicenter Blast Ring
    const blastRingGeo = new THREE.RingGeometry(0.1, 0.4, 32);
    const blastRingMat = new THREE.MeshBasicMaterial({ color: '#D95757', side: THREE.DoubleSide });
    const blastRing = new THREE.Mesh(blastRingGeo, blastRingMat);
    blastRing.position.set(targetX, targetY, targetZ);
    blastRing.lookAt(0, 0, 0);
    scene.add(blastRing);

    // Tsunami Expanding Ripple Ring
    const rippleGeo = new THREE.RingGeometry(0.5, 0.6, 48);
    const rippleMat = new THREE.MeshBasicMaterial({ color: '#38BDF8', transparent: true, opacity: 0.8, side: THREE.DoubleSide });
    const rippleMesh = new THREE.Mesh(rippleGeo, rippleMat);
    rippleMesh.position.set(targetX, targetY, targetZ);
    rippleMesh.lookAt(0, 0, 0);
    if (impactTelemetry.isOceanImpact) {
      scene.add(rippleMesh);
    }

    // Atmospheric Re-Entry Fireball Trail
    const trailGeo = new THREE.BufferGeometry();
    const trailPoints = [
      new THREE.Vector3(targetX * 2.2 + 2, targetY * 2.2 + 3, targetZ * 2.2 + 1),
      new THREE.Vector3(targetX * 1.5, targetY * 1.5, targetZ * 1.5),
      new THREE.Vector3(targetX, targetY, targetZ)
    ];
    trailGeo.setFromPoints(trailPoints);
    const trailMat = new THREE.LineBasicMaterial({ color: '#FF8A1F', linewidth: 3 });
    const trailLine = new THREE.Line(trailGeo, trailMat);
    scene.add(trailLine);

    // Interactive Drag Controls
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

      earthMesh.rotation.y += dx * 0.005;
      earthMesh.rotation.x += dy * 0.005;
      blastRing.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), dx * 0.005);
      if (rippleMesh) rippleMesh.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), dx * 0.005);
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    let animId: number;
    let rippleScale = 1.0;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      // Auto slow rotation
      earthMesh.rotation.y += 0.001;
      cloudsMesh.rotation.y += 0.0013;

      // Animate Tsunami Ripple
      if (impactTelemetry.isOceanImpact && rippleMesh) {
        rippleScale += 0.02;
        if (rippleScale > 3.5) rippleScale = 1.0;
        rippleMesh.scale.set(rippleScale, rippleScale, rippleScale);
        rippleMat.opacity = Math.max(0, 1.0 - rippleScale / 3.5);
      }

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
          if (Array.isArray(obj.material)) {
            obj.material.forEach(m => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });
      renderer.dispose();
      if (container.contains(dom)) container.removeChild(dom);
    };
  }, [asteroidConfig, impactTelemetry]);

  return (
    <div className="relative flex-1 h-full bg-[#090A0D] overflow-hidden select-none">
      <div ref={mountRef} className="w-full h-full block" />

      <div className="absolute top-3 left-3 bg-[#151820]/85 border border-[#252B36] p-2.5 rounded-lg text-xs font-mono-num text-[#E6E8EB] space-y-1 shadow-lg backdrop-blur-sm">
        <div className="text-[#FF8A1F] font-bold uppercase text-[11px]">3D Planetary GIS Viewport</div>
        <div>Target: <strong>{asteroidConfig.geographicTarget?.name || 'Tokyo Metropolis'}</strong></div>
        <div className="text-[#A4ABB6] text-[10px]">
          Lat: {(asteroidConfig.geographicTarget?.latitude || 35.67).toFixed(2)}° | Lon: {(asteroidConfig.geographicTarget?.longitude || 139.65).toFixed(2)}°
        </div>
      </div>

      <div className="absolute bottom-3 left-3 bg-[#151820]/80 border border-[#252B36] px-3 py-1.5 rounded text-[11px] font-mono-num text-[#A4ABB6] flex items-center gap-4">
        <span>LEFT DRAG: <strong className="text-[#E6E8EB]">Rotate Earth Globe</strong></span>
        <span>LOCATION: <strong className="text-[#D95757]">Epicenter Pin</strong></span>
      </div>
    </div>
  );
};
