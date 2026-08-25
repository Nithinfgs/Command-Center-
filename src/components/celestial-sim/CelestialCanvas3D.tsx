import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useSimulation } from '../../context/SimulationContext';
import { calculateSpacetimeDepression, calculateLagrangePoints, calculateOrbitalElements } from '../../physics/n-body';
import { createJupiterTexture } from '../../utils/planet-textures';
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
  const lagrangeGroupRef = useRef<THREE.Group | null>(null);
  const gridMeshRef = useRef<THREE.Mesh | null>(null);
  const nodesGroupRef = useRef<THREE.Group | null>(null);

  const cameraState = useRef({
    radius: 950,
    theta: Math.PI / 4,
    phi: Math.PI / 5,
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
    scene.background = new THREE.Color('#05070B');
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 50000);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // High-Resolution Texture Loaders
    const textureLoader = new THREE.TextureLoader();
    const earthDayMap = textureLoader.load('/textures/earth_day.jpg');
    const earthNormalMap = textureLoader.load('/textures/earth_normal.jpg');
    const earthSpecularMap = textureLoader.load('/textures/earth_specular.jpg');
    const earthCloudsMap = textureLoader.load('/textures/earth_clouds.png');
    const moonMap = textureLoader.load('/textures/moon.jpg');
    const marsMap = textureLoader.load('/textures/mars.jpg');
    const jupiterMap = createJupiterTexture();

    // Starfield Background (Deep Space)
    const starCount = 4500;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPos[i] = (Math.random() - 0.5) * 16000;
      starPos[i + 1] = (Math.random() - 0.5) * 16000;
      starPos[i + 2] = (Math.random() - 0.5) * 16000;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ color: '#E2E8F0', size: 1.8, transparent: true, opacity: 0.85 });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    const ambientLight = new THREE.AmbientLight('#334155', 1.2);
    scene.add(ambientLight);

    const sunLight = new THREE.PointLight('#ffffff', 3.5, 30000);
    sunLight.position.set(0, 0, 0);
    scene.add(sunLight);

    // Spacetime Metric Curvature Grid
    const gridSize = 2200;
    const gridDivs = 56;
    const gridPlaneGeo = new THREE.PlaneGeometry(gridSize, gridSize, gridDivs, gridDivs);
    gridPlaneGeo.rotateX(-Math.PI / 2);

    const gridWireMat = new THREE.MeshBasicMaterial({
      color: '#38BDF8',
      wireframe: true,
      transparent: true,
      opacity: 0.22
    });
    const gridMesh = new THREE.Mesh(gridPlaneGeo, gridWireMat);
    gridMesh.position.y = -60;
    scene.add(gridMesh);
    gridMeshRef.current = gridMesh;

    // Lagrange Points Overlay
    const lagrangeGroup = new THREE.Group();
    scene.add(lagrangeGroup);
    lagrangeGroupRef.current = lagrangeGroup;

    // Orbital Nodes & Apoapsis / Periapsis Badges Group
    const nodesGroup = new THREE.Group();
    scene.add(nodesGroup);
    nodesGroupRef.current = nodesGroup;

    // Raycasting & Mouse Interaction
    const raycaster = new THREE.Raycaster();
    const mouseVector = new THREE.Vector2();

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

    const handleClick = (e: MouseEvent) => {
      const rect = dom.getBoundingClientRect();
      mouseVector.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseVector.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouseVector, camera);
      const meshes: THREE.Object3D[] = [];
      bodiesMeshesRef.current.forEach((grp, id) => {
        const sphere = grp.children[0];
        if (sphere) {
          sphere.userData = { bodyId: id };
          meshes.push(sphere);
        }
      });

      const intersects = raycaster.intersectObjects(meshes);
      if (intersects.length > 0) {
        const hitId = intersects[0].object.userData.bodyId;
        if (hitId) setSelectedBodyId(hitId);
      }
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomSpeed = 0.0015;
      cameraState.current.radius = Math.max(
        50,
        Math.min(6000, cameraState.current.radius * (1 + e.deltaY * zoomSpeed))
      );
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    dom.addEventListener('click', handleClick);
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

          const visualRadius = Math.max(4, Math.log10(body.radius) * 2.8);
          const sphereGeo = new THREE.SphereGeometry(visualRadius, 32, 32);

          let sphereMat: THREE.Material;

          if (body.type === 'star') {
            sphereMat = new THREE.MeshBasicMaterial({ color: body.color });
            const glowGeo = new THREE.SphereGeometry(visualRadius * 1.35, 24, 24);
            const glowMat = new THREE.MeshBasicMaterial({ color: '#F59E0B', transparent: true, opacity: 0.35 });
            group.add(new THREE.Mesh(glowGeo, glowMat));
          } else if (body.id === 'earth') {
            sphereMat = new THREE.MeshPhongMaterial({
              map: earthDayMap,
              normalMap: earthNormalMap,
              specularMap: earthSpecularMap,
              specular: new THREE.Color('#38BDF8'),
              shininess: 15
            });
            // Clouds
            const cGeo = new THREE.SphereGeometry(visualRadius * 1.01, 32, 32);
            const cMat = new THREE.MeshStandardMaterial({
              map: earthCloudsMap,
              transparent: true,
              opacity: 0.75
            });
            const cMesh = new THREE.Mesh(cGeo, cMat);
            group.add(cMesh);
          } else if (body.id === 'moon') {
            sphereMat = new THREE.MeshStandardMaterial({ map: moonMap, roughness: 0.9 });
          } else if (body.id === 'mars') {
            sphereMat = new THREE.MeshStandardMaterial({ map: marsMap, roughness: 0.8 });
          } else if (body.id === 'jupiter') {
            sphereMat = new THREE.MeshStandardMaterial({ map: jupiterMap, roughness: 0.6 });
          } else {
            sphereMat = new THREE.MeshStandardMaterial({
              color: body.color,
              roughness: 0.7,
              metalness: 0.1
            });
          }

          const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
          group.add(sphereMesh);

          // Rings
          if (body.hasRings || body.id === 'saturn') {
            const ringMin = visualRadius * 1.5;
            const ringMax = visualRadius * 2.8;
            const ringGeo = new THREE.RingGeometry(ringMin, ringMax, 48);
            ringGeo.rotateX(Math.PI * 0.4);
            const ringMat = new THREE.MeshBasicMaterial({
              color: body.ringColor || '#CA8A04',
              side: THREE.DoubleSide,
              transparent: true,
              opacity: 0.75
            });
            const ringMesh = new THREE.Mesh(ringGeo, ringMat);
            group.add(ringMesh);
          }

          // Selection Indicator Ring
          const selRingGeo = new THREE.RingGeometry(visualRadius * 1.4, visualRadius * 1.65, 32);
          const selRingMat = new THREE.MeshBasicMaterial({ color: '#FBBF24', side: THREE.DoubleSide, transparent: true, opacity: 0.9 });
          const selRingMesh = new THREE.Mesh(selRingGeo, selRingMat);
          selRingMesh.name = 'selectionRing';
          selRingMesh.visible = false;
          group.add(selRingMesh);

          scene.add(group);
          existingMeshes.set(body.id, group);
        }

        group.position.set(body.position.x, body.position.y, body.position.z);
        group.rotation.y += 0.005;

        const selRing = group.getObjectByName('selectionRing');
        if (selRing) {
          selRing.visible = body.id === selectedIdRef.current;
          selRing.lookAt(camera.position);
        }

        // Sync Orbital Trail
        let trailLine = trailsLinesRef.current.get(body.id);
        if (!trailLine) {
          const maxTrailPoints = 300;
          const trailGeo = new THREE.BufferGeometry();
          const trailPos = new Float32Array(maxTrailPoints * 3);
          trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPos, 3));
          trailGeo.setDrawRange(0, 0);

          const trailMat = new THREE.LineBasicMaterial({
            color: body.color,
            transparent: true,
            opacity: 0.65
          });
          trailLine = new THREE.Line(trailGeo, trailMat);
          scene.add(trailLine);
          trailsLinesRef.current.set(body.id, trailLine);
        }

        trailLine.visible = showTrailsRef.current;

        if (showTrailsRef.current && body.trail && body.trail.length > 1) {
          const geo = trailLine.geometry as THREE.BufferGeometry;
          const pos = geo.attributes.position as THREE.BufferAttribute;
          const len = Math.min(body.trail.length, 300);

          for (let i = 0; i < len; i++) {
            const pt = body.trail[i];
            pos.setXYZ(i, pt.x, pt.y, pt.z);
          }
          pos.needsUpdate = true;
          geo.setDrawRange(0, len);
        }
      });

      // Cleanup removed bodies
      existingMeshes.forEach((mesh, id) => {
        if (!bodies.find(b => b.id === id)) {
          scene.remove(mesh);
          existingMeshes.delete(id);
          const tr = trailsLinesRef.current.get(id);
          if (tr) {
            scene.remove(tr);
            trailsLinesRef.current.delete(id);
          }
        }
      });

      // Render Lagrange Equilibrium Points
      if (lagrangeGroupRef.current) {
        const lGroup = lagrangeGroupRef.current;
        while (lGroup.children.length > 0) {
          lGroup.remove(lGroup.children[0]);
        }

        const primary = bodies.find(b => b.isFixed || b.type === 'star') || bodies[0];
        const secondary = bodies.find(b => b.id === selectedIdRef.current && b.id !== primary.id) ||
                          bodies.find(b => b.id !== primary.id);

        if (primary && secondary) {
          const lPoints = calculateLagrangePoints(primary, secondary);
          lPoints.forEach(lp => {
            const pGeo = new THREE.OctahedronGeometry(3.5, 0);
            const pMat = new THREE.MeshBasicMaterial({ color: '#A855F7', wireframe: true });
            const pMesh = new THREE.Mesh(pGeo, pMat);
            pMesh.position.set(lp.x, 0, lp.z);
            lGroup.add(pMesh);
          });
        }
      }

      // Render Apoapsis / Periapsis markers for selected body
      if (nodesGroupRef.current) {
        const nGroup = nodesGroupRef.current;
        while (nGroup.children.length > 0) {
          nGroup.remove(nGroup.children[0]);
        }

        const selBody = bodies.find(b => b.id === selectedIdRef.current);
        const prim = bodies.find(b => b.isFixed || b.type === 'star') || bodies[0];

        if (selBody && prim && selBody.id !== prim.id) {
          const elem = calculateOrbitalElements(selBody, prim);
          if (elem && elem.semiMajorAxis > 0) {
            // Apoapsis Marker (Amber)
            const apGeo = new THREE.SphereGeometry(3.0, 8, 8);
            const apMat = new THREE.MeshBasicMaterial({ color: '#F59E0B' });
            const apMesh = new THREE.Mesh(apGeo, apMat);
            const apDist = elem.apoapsis * 0.001; // Scaled
            const dirX = selBody.position.x - prim.position.x;
            const dirZ = selBody.position.z - prim.position.z;
            const len = Math.hypot(dirX, dirZ) || 1;
            apMesh.position.set(prim.position.x - (dirX / len) * apDist, 0, prim.position.z - (dirZ / len) * apDist);
            nGroup.add(apMesh);

            // Periapsis Marker (Cyan)
            const peGeo = new THREE.SphereGeometry(3.0, 8, 8);
            const peMat = new THREE.MeshBasicMaterial({ color: '#38BDF8' });
            const peMesh = new THREE.Mesh(peGeo, peMat);
            const peDist = elem.periapsis * 0.001;
            peMesh.position.set(prim.position.x + (dirX / len) * peDist, 0, prim.position.z + (dirZ / len) * peDist);
            nGroup.add(peMesh);
          }
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      dom.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      dom.removeEventListener('click', handleClick);
      dom.removeEventListener('wheel', handleWheel);
      renderer.dispose();
      if (container.contains(dom)) container.removeChild(dom);
    };
  }, [selectedBodyId]);

  return (
    <div className="relative flex-1 h-full bg-[#05070B] overflow-hidden select-none">
      <div ref={mountRef} className="w-full h-full block cursor-grab active:cursor-grabbing" />

      {/* Floating 3D Navigation Guide */}
      <div className="absolute bottom-3 right-3 bg-[#121620]/90 border border-[#252B36] px-3 py-1.5 rounded-lg text-[10px] text-[#69717E] pointer-events-none backdrop-blur-sm">
        LEFT DRAG: Orbit Camera • RIGHT DRAG: Pan • SCROLL: Zoom • CLICK: Select Body
      </div>
    </div>
  );
};
