import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useSimulation } from '../../context/SimulationContext';
import { calculateSpacetimeDepression, calculateLagrangePoints } from '../../physics/n-body';
import type { CelestialBody } from '../../types';

export const CelestialCanvas3D: React.FC = () => {
  const {
    celestialBodies,
    selectedBodyId,
    showSpacetimeGrid,
    showOrbitalTrails
  } = useSimulation();

  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const bodiesMeshesRef = useRef<Map<string, THREE.Group>>(new Map());
  const trailsLinesRef = useRef<Map<string, THREE.Line>>(new Map());
  const lagrangeGroupRef = useRef<THREE.Group | null>(null);
  const gridMeshRef = useRef<THREE.Mesh | null>(null);

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
    scene.background = new THREE.Color('#090A0D');
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 30000);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Starfield Background
    const starCount = 3500;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPos[i] = (Math.random() - 0.5) * 10000;
      starPos[i + 1] = (Math.random() - 0.5) * 10000;
      starPos[i + 2] = (Math.random() - 0.5) * 10000;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ color: '#A4ABB6', size: 1.6, transparent: true, opacity: 0.8 });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    const ambientLight = new THREE.AmbientLight('#222733', 1.0);
    scene.add(ambientLight);

    const sunLight = new THREE.PointLight('#ffffff', 3.0, 15000);
    sunLight.position.set(0, 0, 0);
    scene.add(sunLight);

    // Spacetime Metric Curvature Grid
    const gridSize = 1800;
    const gridDivs = 48;
    const gridPlaneGeo = new THREE.PlaneGeometry(gridSize, gridSize, gridDivs, gridDivs);
    gridPlaneGeo.rotateX(-Math.PI / 2);

    const gridWireMat = new THREE.MeshBasicMaterial({
      color: '#79AFC1',
      wireframe: true,
      transparent: true,
      opacity: 0.25
    });
    const gridMesh = new THREE.Mesh(gridPlaneGeo, gridWireMat);
    gridMesh.position.y = -70;
    scene.add(gridMesh);
    gridMeshRef.current = gridMesh;

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
      const zoomSpeed = 0.0015;
      cameraState.current.radius = Math.max(
        60,
        Math.min(4500, cameraState.current.radius * (1 + e.deltaY * zoomSpeed))
      );
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    dom.addEventListener('wheel', handleWheel, { passive: false });

    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      // Camera Orbit Position
      const { radius, theta, phi, target } = cameraState.current;
      camera.position.x = target.x + radius * Math.sin(phi) * Math.sin(theta);
      camera.position.y = target.y + radius * Math.cos(phi);
      camera.position.z = target.z + radius * Math.sin(phi) * Math.cos(theta);
      camera.lookAt(target);

      const bodies = bodiesRef.current;

      // Update Spacetime Deformation Grid
      if (gridMeshRef.current) {
        gridMeshRef.current.visible = showGridRef.current;
        if (showGridRef.current) {
          const geo = gridMeshRef.current.geometry as THREE.PlaneGeometry;
          const posAttr = geo.attributes.position;
          const v = new THREE.Vector3();

          for (let i = 0; i < posAttr.count; i++) {
            v.fromBufferAttribute(posAttr, i);
            const dep = calculateSpacetimeDepression(v.x, v.z, bodies);
            posAttr.setY(i, dep);
          }
          posAttr.needsUpdate = true;
        }
      }

      // Sync Body Meshes
      const existingMeshes = bodiesMeshesRef.current;

      bodies.forEach(body => {
        let group = existingMeshes.get(body.id);

        if (!group) {
          group = new THREE.Group();

          const visualRadius = Math.max(3, Math.log10(body.radius) * 2.2);
          const sphereGeo = new THREE.SphereGeometry(visualRadius, 32, 32);
          const sphereMat = new THREE.MeshStandardMaterial({
            color: body.color,
            roughness: body.type === 'star' ? 0.1 : 0.7,
            metalness: 0.1,
            emissive: body.type === 'star' ? new THREE.Color(body.color) : new THREE.Color(0x000000),
            emissiveIntensity: body.type === 'star' ? 0.8 : 0.0
          });
          const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
          group.add(sphereMesh);

          // Rings
          if (body.hasRings) {
            const ringMin = visualRadius * 1.5;
            const ringMax = visualRadius * 2.5;
            const ringGeo = new THREE.RingGeometry(ringMin, ringMax, 48);
            ringGeo.rotateX(Math.PI / 2);
            const ringMat = new THREE.MeshBasicMaterial({
              color: body.ringColor || body.color,
              side: THREE.DoubleSide,
              transparent: true,
              opacity: 0.7
            });
            const ringMesh = new THREE.Mesh(ringGeo, ringMat);
            group.add(ringMesh);
          }

          scene.add(group);
          existingMeshes.set(body.id, group);
        }

        group.position.set(body.position.x, body.position.y, body.position.z);

        // Sync Orbital Trail
        let trailLine = trailsLinesRef.current.get(body.id);
        if (!trailLine) {
          const maxPts = 1200;
          const trailGeo = new THREE.BufferGeometry();
          const positions = new Float32Array(maxPts * 3);
          trailGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
          trailGeo.setDrawRange(0, 0);

          const trailMat = new THREE.LineBasicMaterial({
            color: body.color,
            transparent: true,
            opacity: 0.6
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
      });

      // Update 3D Lagrange Points (L1 to L5)
      const primary = bodies.find(b => b.isFixed) || bodies[0];
      const secondary = bodies.find(b => b.id === selectedIdRef.current && !b.isFixed) || bodies.find(b => !b.isFixed);

      if (primary && secondary && showTrailsRef.current) {
        if (!lagrangeGroupRef.current) {
          const lGroup = new THREE.Group();
          for (let k = 1; k <= 5; k++) {
            const geo = new THREE.OctahedronGeometry(2.5, 0);
            const mat = new THREE.MeshBasicMaterial({
              color: k <= 3 ? '#E6B84D' : '#55B982',
              wireframe: true
            });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.name = `l_${k}`;
            lGroup.add(mesh);
          }
          scene.add(lGroup);
          lagrangeGroupRef.current = lGroup;
        }

        const lPoints = calculateLagrangePoints(primary, secondary);
        lPoints.forEach((lp, idx) => {
          const mesh = lagrangeGroupRef.current?.children[idx];
          if (mesh) {
            mesh.position.set(lp.x, lp.y, lp.z);
            mesh.rotation.y += 0.02;
            mesh.rotation.x += 0.01;
          }
        });
      } else if (lagrangeGroupRef.current) {
        lagrangeGroupRef.current.visible = false;
      }

      // Cleanup disposed meshes & free GPU VRAM
      existingMeshes.forEach((mesh, id) => {
        if (!bodies.some(b => b.id === id)) {
          mesh.traverse(obj => {
            if (obj instanceof THREE.Mesh) {
              obj.geometry.dispose();
              if (Array.isArray(obj.material)) {
                obj.material.forEach(m => m.dispose());
              } else {
                obj.material.dispose();
              }
            }
          });
          scene.remove(mesh);
          existingMeshes.delete(id);

          const tLine = trailsLinesRef.current.get(id);
          if (tLine) {
            tLine.geometry.dispose();
            (tLine.material as THREE.Material).dispose();
            scene.remove(tLine);
            trailsLinesRef.current.delete(id);
          }
        }
      });

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
      dom.removeEventListener('wheel', handleWheel);
      window.removeEventListener('resize', handleResize);

      // Full Scene Disposal on Unmount
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
  }, []);

  return (
    <div className="relative flex-1 h-full bg-[#090A0D] overflow-hidden select-none">
      <div ref={mountRef} className="w-full h-full block" />

      <div className="absolute bottom-3 left-3 bg-[#151820]/80 border border-[#252B36] px-3 py-1.5 rounded text-[11px] font-mono-num text-[#A4ABB6] flex items-center gap-4">
        <span>LEFT DRAG: <strong className="text-[#E6E8EB]">Orbit 3D</strong></span>
        <span>RIGHT DRAG: <strong className="text-[#E6E8EB]">Pan</strong></span>
        <span>SCROLL: <strong className="text-[#FF8A1F]">Zoom</strong></span>
      </div>
    </div>
  );
};
