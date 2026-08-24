import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useSimulation } from '../../context/SimulationContext';
import { calculateSpacetimeDepression } from '../../physics/n-body';
import type { CelestialBody } from '../../types';

export const CelestialCanvas3D: React.FC = () => {
  const {
    celestialBodies,
    selectedBodyId,
    setSelectedBodyId,
    showSpacetimeGrid,
    showOrbitalTrails
  } = useSimulation();

  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const bodiesMeshesRef = useRef<Map<string, THREE.Group>>(new Map());
  const trailsLinesRef = useRef<Map<string, THREE.Line>>(new Map());
  const gridMeshRef = useRef<THREE.LineSegments | null>(null);

  const cameraState = useRef({
    radius: 900,
    theta: Math.PI / 4,
    phi: Math.PI / 6,
    target: new THREE.Vector3(0, 0, 0),
    isDragging: false,
    isPanning: false,
    prevMouse: { x: 0, y: 0 }
  });

  const bodiesRef = useRef<CelestialBody[]>(celestialBodies);
  bodiesRef.current = celestialBodies;

  const showGridRef = useRef(showSpacetimeGrid);
  showGridRef.current = showSpacetimeGrid;

  const showTrailsRef = useRef(showOrbitalTrails);
  showTrailsRef.current = showOrbitalTrails;

  const selectedIdRef = useRef(selectedBodyId);
  selectedIdRef.current = selectedBodyId;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#030712');
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 20000);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const starCount = 3000;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPos[i] = (Math.random() - 0.5) * 8000;
      starPos[i + 1] = (Math.random() - 0.5) * 8000;
      starPos[i + 2] = (Math.random() - 0.5) * 8000;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ color: '#94a3b8', size: 1.8, transparent: true, opacity: 0.8 });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    const ambientLight = new THREE.AmbientLight('#334155', 0.8);
    scene.add(ambientLight);

    const sunLight = new THREE.PointLight('#ffffff', 3.0, 10000);
    sunLight.position.set(0, 0, 0);
    scene.add(sunLight);

    const gridSize = 1600;
    const gridDivs = 40;
    const gridPlaneGeo = new THREE.PlaneGeometry(gridSize, gridSize, gridDivs, gridDivs);
    gridPlaneGeo.rotateX(-Math.PI / 2);

    const gridWireMat = new THREE.MeshBasicMaterial({
      color: '#1e3a8a',
      wireframe: true,
      transparent: true,
      opacity: 0.35
    });
    const gridMesh = new THREE.Mesh(gridPlaneGeo, gridWireMat);
    gridMesh.position.y = -60;
    scene.add(gridMesh);
    gridMeshRef.current = gridMesh as any;

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) cameraState.current.isDragging = true;
      if (e.button === 2 || e.button === 1) cameraState.current.isPanning = true;
      cameraState.current.prevMouse = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - cameraState.current.prevMouse.x;
      const dy = e.clientY - cameraState.current.prevMouse.y;
      cameraState.current.prevMouse = { x: e.clientX, y: e.clientY };

      if (cameraState.current.isDragging) {
        cameraState.current.theta -= dx * 0.005;
        cameraState.current.phi = Math.max(0.05, Math.min(Math.PI / 2 - 0.05, cameraState.current.phi + dy * 0.005));
      } else if (cameraState.current.isPanning) {
        const panSpeed = cameraState.current.radius * 0.001;
        cameraState.current.target.x -= dx * panSpeed;
        cameraState.current.target.z -= dy * panSpeed;
      }
    };

    const handleMouseUp = () => {
      cameraState.current.isDragging = false;
      cameraState.current.isPanning = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY > 0 ? 1.15 : 0.85;
      cameraState.current.radius = Math.max(80, Math.min(4000, cameraState.current.radius * zoomFactor));
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    dom.addEventListener('wheel', handleWheel, { passive: false });
    dom.addEventListener('contextmenu', e => e.preventDefault());

    const raycaster = new THREE.Raycaster();
    const mouseVec = new THREE.Vector2();

    const handleClick = (e: MouseEvent) => {
      const rect = dom.getBoundingClientRect();
      mouseVec.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseVec.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouseVec, camera);
      const meshes: THREE.Object3D[] = [];
      bodiesMeshesRef.current.forEach(group => meshes.push(...group.children));

      const intersects = raycaster.intersectObjects(meshes, true);
      if (intersects.length > 0) {
        let parentGroup: THREE.Object3D | null = intersects[0].object;
        while (parentGroup && !parentGroup.userData.bodyId) {
          parentGroup = parentGroup.parent;
        }
        if (parentGroup && parentGroup.userData.bodyId) {
          setSelectedBodyId(parentGroup.userData.bodyId);
        }
      }
    };
    dom.addEventListener('click', handleClick);

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      const { radius, theta, phi, target } = cameraState.current;
      camera.position.x = target.x + radius * Math.cos(phi) * Math.sin(theta);
      camera.position.y = target.y + radius * Math.sin(phi);
      camera.position.z = target.z + radius * Math.cos(phi) * Math.cos(theta);
      camera.lookAt(target);

      const bodies = bodiesRef.current;
      const existingMeshes = bodiesMeshesRef.current;

      if (gridMeshRef.current) {
        gridMeshRef.current.visible = showGridRef.current;
        if (showGridRef.current) {
          const planeGeo = (gridMeshRef.current as any).geometry as THREE.PlaneGeometry;
          const posAttr = planeGeo.attributes.position;
          for (let i = 0; i < posAttr.count; i++) {
            const vx = posAttr.getX(i);
            const vz = posAttr.getZ(i);
            const depth = calculateSpacetimeDepression(vx, vz, bodies);
            posAttr.setY(i, depth);
          }
          posAttr.needsUpdate = true;
        }
      }

      for (const body of bodies) {
        let group = existingMeshes.get(body.id);
        const radiusScale = Math.max(3, Math.min(30, Math.log10(body.radius) * 4));

        if (!group) {
          group = new THREE.Group();
          group.userData = { bodyId: body.id };

          const sphereGeo = new THREE.SphereGeometry(radiusScale, 32, 32);
          let sphereMat: THREE.Material;

          if (body.type === 'star') {
            sphereMat = new THREE.MeshBasicMaterial({ color: body.color });
            const glowGeo = new THREE.SphereGeometry(radiusScale * 1.3, 16, 16);
            const glowMat = new THREE.MeshBasicMaterial({
              color: body.color,
              transparent: true,
              opacity: 0.35,
              side: THREE.BackSide
            });
            const glow = new THREE.Mesh(glowGeo, glowMat);
            group.add(glow);
          } else if (body.type === 'black_hole') {
            sphereMat = new THREE.MeshBasicMaterial({ color: '#000000' });
            const diskGeo = new THREE.RingGeometry(radiusScale * 1.5, radiusScale * 4, 32);
            diskGeo.rotateX(Math.PI / 2);
            const diskMat = new THREE.MeshBasicMaterial({
              color: '#38bdf8',
              side: THREE.DoubleSide,
              transparent: true,
              opacity: 0.8
            });
            const disk = new THREE.Mesh(diskGeo, diskMat);
            group.add(disk);
          } else {
            sphereMat = new THREE.MeshStandardMaterial({
              color: body.color,
              roughness: 0.7,
              metalness: 0.1
            });
          }

          const sphere = new THREE.Mesh(sphereGeo, sphereMat);
          group.add(sphere);

          if (body.hasRings) {
            const ringGeo = new THREE.RingGeometry(radiusScale * 1.5, radiusScale * 2.8, 32);
            ringGeo.rotateX(Math.PI / 2);
            const ringMat = new THREE.MeshBasicMaterial({
              color: body.ringColor || '#d97706',
              side: THREE.DoubleSide,
              transparent: true,
              opacity: 0.7
            });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            group.add(ring);
          }

          scene.add(group);
          existingMeshes.set(body.id, group);
        }

        group.position.set(body.position.x, body.position.y, body.position.z);

        let trailLine = trailsLinesRef.current.get(body.id);
        if (!trailLine) {
          const trailGeo = new THREE.BufferGeometry();
          const trailMat = new THREE.LineBasicMaterial({
            color: body.color,
            transparent: true,
            opacity: 0.5
          });
          trailLine = new THREE.Line(trailGeo, trailMat);
          scene.add(trailLine);
          trailsLinesRef.current.set(body.id, trailLine);
        }

        trailLine.visible = showTrailsRef.current;
        if (showTrailsRef.current && body.trail.length > 2) {
          const trailPts = body.trail.map(t => new THREE.Vector3(t.x, t.y, t.z));
          trailLine.geometry.setFromPoints(trailPts);
        }
      }

      existingMeshes.forEach((mesh, id) => {
        if (!bodies.some(b => b.id === id)) {
          scene.remove(mesh);
          existingMeshes.delete(id);
          const tLine = trailsLinesRef.current.get(id);
          if (tLine) {
            scene.remove(tLine);
            trailsLinesRef.current.delete(id);
          }
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      dom.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      dom.removeEventListener('click', handleClick);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(dom)) container.removeChild(dom);
    };
  }, []);

  return (
    <div className="relative flex-1 h-full bg-[#030712] overflow-hidden select-none">
      <div ref={mountRef} className="w-full h-full block" />

      <div className="absolute bottom-3 left-3 bg-[#0c121d]/80 border border-[#1e293b] px-3 py-1.5 rounded text-[11px] font-mono text-slate-400 flex items-center gap-4">
        <span>LEFT DRAG: <strong>Orbit 3D</strong></span>
        <span>RIGHT DRAG: <strong>Pan</strong></span>
        <span>SCROLL: <strong>Zoom</strong></span>
        <span>CLICK: <strong>Select Body</strong></span>
      </div>
    </div>
  );
};
