import React, { useRef, useState, useEffect } from 'react';
import { useSimulation } from '../../context/SimulationContext';
import { PARTS_CATALOG, GRID_CELL_SIZE, calculateRocketProperties } from '../../physics/rocket-math';
import { calculateAeroTelemetry, calculateNozzlePlume } from '../../physics/aerodynamics';

interface ProbeData {
  worldX: number;
  worldY: number;
  screenX: number;
  screenY: number;
  localMach: number;
  speedMs: number;
  tempK: number;
  tempC: number;
  pressureKpa: number;
  cp: number;
  heatFluxKw: number;
}

export const WindTunnelCanvas: React.FC = () => {
  const { blueprint, windTunnelState } = useSimulation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);

  const [mouseProbe, setMouseProbe] = useState<ProbeData | null>(null);

  const aero = calculateAeroTelemetry(windTunnelState);
  const plume = calculateNozzlePlume(
    windTunnelState.nozzleChamberPressure,
    windTunnelState.airDensity * 287 * windTunnelState.airTemperature
  );
  const rocketProps = calculateRocketProperties(blueprint);

  const vehicleGeometry = React.useMemo(() => {
    if (blueprint.parts.length === 0) {
      return {
        centerX: 0,
        centerY: 0,
        noseY: -4,
        tailY: 4,
        width: 4,
        height: 8,
        parts: []
      };
    }

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    const partsWithBounds = blueprint.parts.map(p => {
      const def = PARTS_CATALOG[p.partType];
      const hw = (def?.width || 2) / 2;
      const hh = (def?.height || 2) / 2;
      minX = Math.min(minX, p.x - hw);
      maxX = Math.max(maxX, p.x + hw);
      minY = Math.min(minY, p.y - hh);
      maxY = Math.max(maxY, p.y + hh);
      return { ...p, def, hw, hh };
    });

    return {
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2,
      noseY: minY,
      tailY: maxY,
      width: Math.max(1, maxX - minX),
      height: Math.max(1, maxY - minY),
      parts: partsWithBounds
    };
  }, [blueprint]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animPulseOffset = 0;
    let lastTime = performance.now();

    // Turbo / Jet Rainbow CFD Colormap
    const getCfdColor = (valNorm: number, alpha: number = 0.85): string => {
      const val = Math.max(0, Math.min(1, valNorm));
      let r = 0, g = 0, b = 0;
      if (val < 0.25) {
        const t = val / 0.25;
        r = 0;
        g = Math.round(180 * t + 50);
        b = 255;
      } else if (val < 0.5) {
        const t = (val - 0.25) / 0.25;
        r = 0;
        g = 230;
        b = Math.round(255 * (1 - t) + 80);
      } else if (val < 0.75) {
        const t = (val - 0.5) / 0.25;
        r = Math.round(255 * t);
        g = Math.round(230 - 30 * t);
        b = 0;
      } else {
        const t = (val - 0.75) / 0.25;
        r = 255;
        g = Math.round(200 * (1 - t));
        b = 0;
      }
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    // Thermal Temperature Colormap (Blackbody Radiation Glow)
    const getThermalColor = (tempK: number, alpha: number = 0.85): string => {
      // 200K (Deep Blue) -> 300K (Ambient Cyan/Green) -> 600K (Amber) -> 1200K (Cherry Red) -> 2200K+ (Incandescent White)
      if (tempK < 300) {
        return `rgba(0, 180, 255, ${alpha})`;
      } else if (tempK < 500) {
        const t = (tempK - 300) / 200;
        return `rgba(${Math.round(255 * t)}, 220, 50, ${alpha})`;
      } else if (tempK < 1000) {
        const t = (tempK - 500) / 500;
        return `rgba(255, ${Math.round(180 * (1 - t * 0.6))}, 0, ${alpha})`;
      } else if (tempK < 1800) {
        const t = (tempK - 1000) / 800;
        return `rgba(255, ${Math.round(80 + 120 * t)}, ${Math.round(80 * t)}, ${alpha})`;
      } else {
        return `rgba(255, 255, 255, ${alpha})`;
      }
    };

    // Pressure Colormap (Red = High Compression, Blue = Suction)
    const getPressureColor = (cp: number, alpha: number = 0.85): string => {
      // cp ranges from -0.8 (suction) to +1.0 (stagnation compression)
      const norm = Math.max(0, Math.min(1, (cp + 0.6) / 1.6));
      return getCfdColor(norm, alpha);
    };

    const render = (time: number) => {
      const dt = Math.min(0.04, (time - lastTime) / 1000);
      lastTime = time;

      const width = canvas.parentElement?.clientWidth || 800;
      const height = canvas.parentElement?.clientHeight || 600;

      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.save();
      ctx.scale(dpr, dpr);

      // Deep Aerodynamic Command Center Dark Background
      ctx.fillStyle = '#03060f';
      ctx.fillRect(0, 0, width, height);

      // Diagnostic Mode Background Shading
      if (windTunnelState.visualizationMode === 'shockwaves' && windTunnelState.mach >= 1.0) {
        // Optical Schlieren / Shadowgraph Grayscale Amber Field
        const schlierenGrad = ctx.createRadialGradient(width * 0.44, height * 0.5, 40, width * 0.5, height * 0.5, width * 0.65);
        schlierenGrad.addColorStop(0, '#101622');
        schlierenGrad.addColorStop(0.5, '#070b14');
        schlierenGrad.addColorStop(1, '#020409');
        ctx.fillStyle = schlierenGrad;
        ctx.fillRect(0, 0, width, height);
      } else {
        const bgGrad = ctx.createLinearGradient(0, 0, width, 0);
        bgGrad.addColorStop(0, '#040914');
        bgGrad.addColorStop(0.4, '#060f22');
        bgGrad.addColorStop(1, '#030712');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);
      }

      // Wind Tunnel Boundary Walls (Fixed horizontal top & bottom)
      ctx.fillStyle = '#080e1a';
      ctx.fillRect(0, 0, width, 22);
      ctx.fillRect(0, height - 22, width, 22);
      ctx.strokeStyle = '#1e2d42';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(0, 0, width, 22);
      ctx.strokeRect(0, height - 22, width, 22);

      // Tunnel Static Inspection Grid
      ctx.strokeStyle = 'rgba(14, 28, 48, 0.35)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(Math.round(x) + 0.5, 0);
        ctx.lineTo(Math.round(x) + 0.5, height);
        ctx.stroke();
      }
      for (let y = 22; y < height - 22; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, Math.round(y) + 0.5);
        ctx.lineTo(width, Math.round(y) + 0.5);
        ctx.stroke();
      }

      const scale = 1.45;
      const cellSize = GRID_CELL_SIZE * scale;
      const rocketX = width * 0.44;
      const rocketY = height * 0.5;
      const aoaRad = (windTunnelState.angleToGo * Math.PI) / 180;
      const mach = windTunnelState.mach;

      // Axial limits of vehicle in body frame
      const noseTipOffset = (vehicleGeometry.noseY - vehicleGeometry.centerY) * cellSize;
      const tailOffset = (vehicleGeometry.tailY - vehicleGeometry.centerY) * cellSize;

      const noseWorldX = rocketX + noseTipOffset * Math.cos(aoaRad);
      const noseWorldY = rocketY + noseTipOffset * Math.sin(aoaRad);

      const speedPx = 260 + mach * 110;
      animPulseOffset += dt * speedPx;

      // =========================================================================
      // 1. EXACT LOCAL HULL PROFILE R(xb) IN VEHICLE BODY COORDINATES
      // =========================================================================
      const getBodyRadius = (xb: number): { rUpper: number; rLower: number; dR: number } => {
        if (xb < noseTipOffset) {
          const dist = noseTipOffset - xb;
          const noseR = 14;
          const taper = Math.max(0, 1 - dist / 30);
          const r = noseR * Math.sqrt(taper);
          return { rUpper: r, rLower: r, dR: 0.6 };
        }
        if (xb > tailOffset) {
          const dist = xb - tailOffset;
          const tailR = 24;
          const taper = Math.max(0, 1 - dist / 160);
          const r = tailR * Math.pow(taper, 1.4);
          return { rUpper: r, rLower: r, dR: -0.3 };
        }

        const gridY = vehicleGeometry.centerY + xb / cellSize;
        let maxUpper = 12;
        let maxLower = 12;

        for (const p of vehicleGeometry.parts) {
          const def = p.def;
          if (!def) continue;

          const partMinY = p.y - p.hh;
          const partMaxY = p.y + p.hh;

          if (gridY >= partMinY - 0.25 && gridY <= partMaxY + 0.25) {
            const normY = Math.max(0, Math.min(1, (gridY - partMinY) / (def.height || 1)));
            let widthPx = def.width * cellSize;

            if (def.texturePattern === 'cone') {
              widthPx = (def.width * cellSize) * Math.sqrt(normY);
            } else if (def.texturePattern === 'fin') {
              widthPx = (def.width * cellSize) * (0.35 + 0.65 * normY);
            } else if (def.texturePattern === 'engine-bell') {
              widthPx = (def.width * cellSize) * (0.55 + 0.45 * normY);
            }

            const halfW = widthPx / 2;
            const centerOffset = (p.x - vehicleGeometry.centerX) * cellSize;

            maxUpper = Math.max(maxUpper, halfW - centerOffset);
            maxLower = Math.max(maxLower, halfW + centerOffset);
          }
        }

        const delta = 2.0;
        const gridYPlus = vehicleGeometry.centerY + (xb + delta) / cellSize;
        let nextUpper = maxUpper;
        for (const p of vehicleGeometry.parts) {
          if (gridYPlus >= p.y - p.hh && gridYPlus <= p.y + p.hh) {
            nextUpper = Math.max(nextUpper, (p.def.width * cellSize) / 2);
          }
        }
        const dR = (nextUpper - maxUpper) / delta;

        return { rUpper: maxUpper, rLower: maxLower, dR };
      };

      // =========================================================================
      // 2. TRUE 2D AERODYNAMIC FLOW VECTOR FIELD (Velocity, Pressure, Temperature)
      // =========================================================================
      const getFlowVelocityAt = (wx: number, wy: number): { u: number; v: number; speedNorm: number; tempK: number; cp: number; machLocal: number } => {
        const u = 1.0;

        const dx = wx - rocketX;
        const dy = wy - rocketY;

        const xb = dx * Math.cos(-aoaRad) - dy * Math.sin(-aoaRad);
        const yb = dx * Math.sin(-aoaRad) + dy * Math.cos(-aoaRad);

        const profile = getBodyRadius(xb);
        const isUpper = yb >= 0;
        const bodyR = isUpper ? profile.rUpper : profile.rLower;
        const distFromAxis = Math.abs(yb);
        const distFromSurface = distFromAxis - bodyR;

        let speedFactor = 1.0;
        let tempK = windTunnelState.airTemperature;
        let bodyDeflectY = 0;
        let cpLocal = 0; // Pressure coefficient Cp

        // Windward / Leeward AoA pressure differential
        const aoaSideSign = (aoaRad > 0 ? (yb < 0 ? 1 : -1) : (yb > 0 ? 1 : -1));
        const aoaIntensity = Math.abs(Math.sin(aoaRad));

        if (xb < noseTipOffset) {
          const distToNose = Math.hypot(xb - noseTipOffset, yb);
          const noseInfluenceRadius = 60;

          if (distToNose < noseInfluenceRadius) {
            const frac = 1 - distToNose / noseInfluenceRadius;
            const pushDir = yb >= 0 ? 1 : -1;

            speedFactor *= Math.max(0.2, 1 - Math.pow(frac, 1.2) * 0.8);
            
            // Stagnation Temperature Jump: T0 = T_inf * (1 + 0.9 * (gamma-1)/2 * M^2)
            tempK = windTunnelState.airTemperature + (aero.stagnationTemperature - windTunnelState.airTemperature) * Math.pow(frac, 1.5);
            cpLocal = Math.pow(frac, 1.2); // Cp -> 1.0 at stagnation point

            bodyDeflectY += pushDir * Math.pow(frac, 1.3) * 0.85;
          }
        } else if (xb >= noseTipOffset && xb <= tailOffset) {
          const influenceRange = 90;
          if (distFromSurface < influenceRange) {
            const normDist = Math.max(0, distFromSurface / influenceRange);
            const wallProximity = Math.exp(-normDist * 2.5);
            const pushDir = yb >= 0 ? 1 : -1;

            bodyDeflectY += pushDir * (wallProximity * 0.45 + profile.dR * 0.4 * wallProximity);
            speedFactor *= (1.0 + wallProximity * 0.3);

            // Dynamic Surface Temperature based on boundary layer recovery & Mach
            const boundaryLayerTemp = windTunnelState.airTemperature + (aero.stagnationTemperature - windTunnelState.airTemperature) * 0.75 * wallProximity;
            tempK = Math.max(tempK, boundaryLayerTemp);

            // Pressure field: Compression windward (+Cp) vs Expansion leeward (-Cp)
            cpLocal = (aoaSideSign * aoaIntensity * 0.8 * wallProximity) - (profile.dR * 0.4 * wallProximity);

            if (windTunnelState.finDeflectionAngle !== 0 && xb > tailOffset - 45) {
              const finRad = (windTunnelState.finDeflectionAngle * Math.PI) / 180;
              bodyDeflectY += Math.sin(finRad) * wallProximity * 0.85;
              cpLocal += Math.sin(finRad) * 0.5 * wallProximity;
            }
          }
        } else {
          const wakeDist = xb - tailOffset;
          if (wakeDist < 240 && distFromAxis < bodyR + wakeDist * 0.3) {
            const wakeDecay = Math.max(0, 1 - wakeDist / 240);
            const vortexFreq = time * 0.009 + wakeDist * 0.04;
            const vortexSign = yb >= 0 ? 1 : -1;

            bodyDeflectY += Math.sin(vortexFreq) * 0.35 * wakeDecay * vortexSign;
            speedFactor *= (0.7 + 0.3 * (1 - wakeDecay));
            cpLocal = -0.45 * wakeDecay; // Base suction low pressure
          }
        }

        // Supersonic Shockwave Jump (Mach >= 1.0)
        if (mach >= 1.0) {
          const shockAngleRad = (aero.shockwaveAngle * Math.PI) / 180;
          const standOff = Math.max(8, 26 / Math.pow(mach, 0.75));
          const shockFrontX = (noseWorldX - standOff * Math.cos(aoaRad)) + Math.abs(wy - noseWorldY) / Math.tan(shockAngleRad);

          if (wx >= shockFrontX - 8 && wx <= shockFrontX + 16) {
            speedFactor *= 0.75;
            tempK = Math.max(tempK, windTunnelState.airTemperature + (mach - 1) * 120);
            cpLocal = Math.max(cpLocal, 0.65);
          }
        }

        const uBody = u * speedFactor;
        const vBody = bodyDeflectY;

        const uWorld = uBody * Math.cos(aoaRad) - vBody * Math.sin(aoaRad);
        const vWorld = uBody * Math.sin(aoaRad) + vBody * Math.cos(aoaRad);

        const speedMag = Math.hypot(uWorld, vWorld);
        const speedNorm = Math.min(1, Math.max(0, (speedMag - 0.25) / 1.35));
        const localMach = mach * speedMag;

        return {
          u: uWorld,
          v: vWorld,
          speedNorm,
          tempK,
          cp: cpLocal,
          machLocal: localMach
        };
      };

      // =========================================================================
      // 3. RUNGE-KUTTA STREAMLINE INTEGRATION (Horizontal Inlet -> Horizontal Outlet)
      // =========================================================================
      const NUM_STREAMLINES = 48;
      const rakeTop = 28;
      const rakeBottom = height - 28;
      const rakeSpacing = (rakeBottom - rakeTop) / (NUM_STREAMLINES - 1);

      const streamlines: { points: { x: number; y: number; speedNorm: number; tempK: number; cp: number }[] }[] = [];

      for (let s = 0; s < NUM_STREAMLINES; s++) {
        let currX = 0;
        let currY = rakeTop + s * rakeSpacing;
        const pts: { x: number; y: number; speedNorm: number; tempK: number; cp: number }[] = [];

        const stepSize = 7.5;
        let steps = 0;

        while (currX <= width + 15 && currY >= 20 && currY <= height - 20 && steps < 200) {
          steps++;
          const flow = getFlowVelocityAt(currX, currY);
          pts.push({
            x: currX,
            y: currY,
            speedNorm: flow.speedNorm,
            tempK: flow.tempK,
            cp: flow.cp
          });

          const mag1 = Math.hypot(flow.u, flow.v) || 1;
          const k1x = (flow.u / mag1) * stepSize;
          const k1y = (flow.v / mag1) * stepSize;

          const midFlow = getFlowVelocityAt(currX + k1x * 0.5, currY + k1y * 0.5);
          const midMag = Math.hypot(midFlow.u, midFlow.v) || 1;

          currX += (midFlow.u / midMag) * stepSize;
          currY += (midFlow.v / midMag) * stepSize;
        }

        if (pts.length > 2) {
          streamlines.push({ points: pts });
        }
      }

      // =========================================================================
      // 4. DRAW STREAMLINES IN CURRENT DIAGNOSTIC MODE
      // =========================================================================
      for (let s = 0; s < streamlines.length; s++) {
        const pts = streamlines[s].points;
        if (pts.length < 2) continue;

        for (let p = 0; p < pts.length - 1; p++) {
          const pt1 = pts[p];
          const pt2 = pts[p + 1];

          if (windTunnelState.visualizationMode === 'thermal') {
            ctx.strokeStyle = getThermalColor(pt1.tempK, 0.88);
            ctx.lineWidth = 1.8;
          } else if (windTunnelState.visualizationMode === 'pressure') {
            ctx.strokeStyle = getPressureColor(pt1.cp, 0.88);
            ctx.lineWidth = 1.8;
          } else if (windTunnelState.visualizationMode === 'shockwaves') {
            ctx.strokeStyle = 'rgba(255, 183, 3, 0.45)';
            ctx.lineWidth = 1.2;
          } else if (windTunnelState.visualizationMode === 'turbulence') {
            const isTurb = Math.abs(pt1.cp) > 0.3 || (pt1.x > rocketX + 80);
            ctx.strokeStyle = isTurb ? '#ff3366' : 'rgba(0, 229, 255, 0.4)';
            ctx.lineWidth = isTurb ? 2.2 : 1.2;
          } else {
            ctx.strokeStyle = getCfdColor(pt1.speedNorm, 0.88);
            ctx.lineWidth = 1.7;
          }

          ctx.beginPath();
          ctx.moveTo(pt1.x, pt1.y);
          ctx.lineTo(pt2.x, pt2.y);
          ctx.stroke();
        }

        // Animated glowing tracer pulse along each stream
        ctx.save();
        ctx.setLineDash([16, 24]);
        ctx.lineDashOffset = -animPulseOffset * (0.85 + 0.3 * (s % 4));
        ctx.strokeStyle = windTunnelState.visualizationMode === 'thermal' ? '#ffedd5' : '#ffffff';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let p = 1; p < pts.length; p++) {
          ctx.lineTo(pts[p].x, pts[p].y);
        }
        ctx.stroke();
        ctx.restore();
      }

      // =========================================================================
      // 5. SUPERSONIC SCHLIEREN SHOCKWAVE CONES (Mach >= 1.0)
      // =========================================================================
      if (mach >= 1.0) {
        ctx.save();
        const shockAngleRad = (aero.shockwaveAngle * Math.PI) / 180;
        const standOffDist = Math.max(8, 26 / Math.pow(mach, 0.75));

        const shockApexX = noseWorldX - standOffDist * Math.cos(aoaRad);
        const shockApexY = noseWorldY - standOffDist * Math.sin(aoaRad);

        const shockLength = Math.max(380, width * 0.6);
        const shockGrad = ctx.createLinearGradient(shockApexX, shockApexY, shockApexX + shockLength, shockApexY);
        shockGrad.addColorStop(0, '#00e5ff');
        shockGrad.addColorStop(0.25, '#ff3366');
        shockGrad.addColorStop(0.75, '#ffb703');
        shockGrad.addColorStop(1, 'rgba(0, 229, 255, 0)');

        ctx.strokeStyle = shockGrad;
        ctx.lineWidth = Math.min(5.5, 2.0 + mach * 0.6);

        // Top Bow Shock Arc
        ctx.beginPath();
        for (let dist = 0; dist <= 300; dist += 6) {
          const lx = dist;
          const ly = -dist * Math.tan(shockAngleRad);
          const wx = shockApexX + lx * Math.cos(aoaRad) - ly * Math.sin(aoaRad);
          const wy = shockApexY + lx * Math.sin(aoaRad) + ly * Math.cos(aoaRad);
          if (dist === 0) ctx.moveTo(wx, wy);
          else ctx.lineTo(wx, wy);
        }
        ctx.stroke();

        // Bottom Bow Shock Arc
        ctx.beginPath();
        for (let dist = 0; dist <= 300; dist += 6) {
          const lx = dist;
          const ly = dist * Math.tan(shockAngleRad);
          const wx = shockApexX + lx * Math.cos(aoaRad) - ly * Math.sin(aoaRad);
          const wy = shockApexY + lx * Math.sin(aoaRad) + ly * Math.cos(aoaRad);
          if (dist === 0) ctx.moveTo(wx, wy);
          else ctx.lineTo(wx, wy);
        }
        ctx.stroke();

        ctx.restore();
      }

      // =========================================================================
      // 6. RENDER ROTATED ROCKET VEHICLE (Dynamic Surface Shading in All Modes)
      // =========================================================================
      ctx.save();
      ctx.translate(rocketX, rocketY);
      ctx.rotate(-Math.PI / 2 + aoaRad);

      for (const part of vehicleGeometry.parts) {
        const def = part.def;
        if (!def) continue;

        const px = (part.x - vehicleGeometry.centerX) * cellSize;
        const py = (part.y - vehicleGeometry.centerY) * cellSize;
        const pw = def.width * cellSize;
        const ph = def.height * cellSize;

        ctx.save();
        ctx.translate(px, py);
        ctx.rotate((part.rotation * Math.PI) / 180);

        const isNose = def.category === 'command' || def.texturePattern === 'cone';
        const isFin = def.category === 'aerodynamics' || def.texturePattern === 'fin';

        let cfdSurfaceGrad: CanvasGradient;

        if (windTunnelState.visualizationMode === 'thermal') {
          // Dynamic Thermal Heatmap on Hull
          const maxT = aero.stagnationTemperature;
          if (isNose) {
            cfdSurfaceGrad = ctx.createLinearGradient(0, -ph / 2, 0, ph / 2);
            cfdSurfaceGrad.addColorStop(0, maxT > 1200 ? '#ffffff' : maxT > 600 ? '#ef4444' : '#f59e0b');
            cfdSurfaceGrad.addColorStop(0.3, maxT > 800 ? '#ef4444' : '#f59e0b');
            cfdSurfaceGrad.addColorStop(0.7, '#f59e0b');
            cfdSurfaceGrad.addColorStop(1, '#06b6d4');
          } else if (isFin) {
            cfdSurfaceGrad = ctx.createLinearGradient(-pw / 2, 0, pw / 2, 0);
            cfdSurfaceGrad.addColorStop(0, '#f59e0b');
            cfdSurfaceGrad.addColorStop(0.5, '#06b6d4');
            cfdSurfaceGrad.addColorStop(1, '#3b82f6');
          } else {
            cfdSurfaceGrad = ctx.createLinearGradient(-pw / 2, 0, pw / 2, 0);
            cfdSurfaceGrad.addColorStop(0, '#f59e0b');
            cfdSurfaceGrad.addColorStop(0.3, '#06b6d4');
            cfdSurfaceGrad.addColorStop(0.7, '#3b82f6');
            cfdSurfaceGrad.addColorStop(1, '#1e3a8a');
          }
        } else if (windTunnelState.visualizationMode === 'pressure') {
          // Dynamic Pressure Distribution on Hull (Windward vs Leeward)
          const aoaP = windTunnelState.angleToGo;
          if (isNose) {
            cfdSurfaceGrad = ctx.createLinearGradient(0, -ph / 2, 0, ph / 2);
            cfdSurfaceGrad.addColorStop(0, '#ef4444'); // Stagnation High Pressure
            cfdSurfaceGrad.addColorStop(0.4, '#f59e0b');
            cfdSurfaceGrad.addColorStop(0.8, '#06b6d4');
            cfdSurfaceGrad.addColorStop(1, '#3b82f6');
          } else {
            cfdSurfaceGrad = ctx.createLinearGradient(-pw / 2, 0, pw / 2, 0);
            // Windward compression vs leeward expansion
            if (aoaP > 0) {
              cfdSurfaceGrad.addColorStop(0, '#ef4444');
              cfdSurfaceGrad.addColorStop(0.5, '#10b981');
              cfdSurfaceGrad.addColorStop(1, '#1e3a8a');
            } else if (aoaP < 0) {
              cfdSurfaceGrad.addColorStop(0, '#1e3a8a');
              cfdSurfaceGrad.addColorStop(0.5, '#10b981');
              cfdSurfaceGrad.addColorStop(1, '#ef4444');
            } else {
              cfdSurfaceGrad.addColorStop(0, '#10b981');
              cfdSurfaceGrad.addColorStop(0.5, '#06b6d4');
              cfdSurfaceGrad.addColorStop(1, '#10b981');
            }
          }
        } else {
          // CFD Standard Rainbow / Velocity Mode
          if (isNose) {
            cfdSurfaceGrad = ctx.createLinearGradient(0, -ph / 2, 0, ph / 2);
            cfdSurfaceGrad.addColorStop(0, '#ef4444');
            cfdSurfaceGrad.addColorStop(0.3, '#f59e0b');
            cfdSurfaceGrad.addColorStop(0.7, '#eab308');
            cfdSurfaceGrad.addColorStop(1, '#06b6d4');
          } else if (isFin) {
            cfdSurfaceGrad = ctx.createLinearGradient(-pw / 2, 0, pw / 2, 0);
            cfdSurfaceGrad.addColorStop(0, '#eab308');
            cfdSurfaceGrad.addColorStop(0.5, '#10b981');
            cfdSurfaceGrad.addColorStop(1, '#06b6d4');
          } else {
            cfdSurfaceGrad = ctx.createLinearGradient(-pw / 2, 0, pw / 2, 0);
            cfdSurfaceGrad.addColorStop(0, '#eab308');
            cfdSurfaceGrad.addColorStop(0.25, '#84cc16');
            cfdSurfaceGrad.addColorStop(0.5, '#06b6d4');
            cfdSurfaceGrad.addColorStop(0.75, '#3b82f6');
            cfdSurfaceGrad.addColorStop(1, '#6366f1');
          }
        }

        if (def.texturePattern === 'cone') {
          ctx.fillStyle = cfdSurfaceGrad;
          ctx.beginPath();
          ctx.moveTo(-pw / 2, ph / 2);
          ctx.quadraticCurveTo(0, -ph / 2 - 12 * scale, pw / 2, ph / 2);
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = '#020617';
          ctx.lineWidth = 1.8;
          ctx.stroke();

          // Dynamic Thermal Stagnation Glow (Hypersonic Incandescence)
          if (aero.stagnationTemperature > 400) {
            const stagT = aero.stagnationTemperature;
            const glowRadius = Math.min(50, 15 + (mach * 3.5));
            const glowGrad = ctx.createRadialGradient(0, -ph / 2 - 4, 1, 0, -ph / 2 - 4, glowRadius);
            glowGrad.addColorStop(0, stagT > 1500 ? '#ffffff' : stagT > 800 ? '#fef08a' : '#ffb703');
            glowGrad.addColorStop(0.35, stagT > 1000 ? '#ffb703' : '#ef4444');
            glowGrad.addColorStop(0.75, 'rgba(239, 68, 68, 0.6)');
            glowGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
            ctx.fillStyle = glowGrad;
            ctx.beginPath();
            ctx.arc(0, -ph / 2 - 4, glowRadius, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (def.texturePattern === 'engine-bell') {
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(-pw * 0.35, -ph / 2, pw * 0.7, ph * 0.35);

          const bellGrad = ctx.createLinearGradient(-pw / 2, 0, pw / 2, 0);
          bellGrad.addColorStop(0, '#0f172a');
          bellGrad.addColorStop(0.3, '#334155');
          bellGrad.addColorStop(0.7, '#334155');
          bellGrad.addColorStop(1, '#0f172a');

          ctx.fillStyle = bellGrad;
          ctx.beginPath();
          ctx.moveTo(-pw * 0.2, -ph / 2 + ph * 0.45);
          ctx.lineTo(pw * 0.2, -ph / 2 + ph * 0.45);
          ctx.lineTo(pw / 2, ph / 2);
          ctx.lineTo(-pw / 2, ph / 2);
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 1.2;
          ctx.stroke();

          if (windTunnelState.engineTestActive) {
            const plumeLength = 140 * scale * windTunnelState.engineThrottle;
            const plumeWidth = pw * 0.85 * (plume.plumeState === 'underexpanded' ? 1.8 : 0.95);

            ctx.save();
            ctx.translate(0, ph / 2);

            const plumeGrad = ctx.createLinearGradient(0, 0, 0, plumeLength);
            plumeGrad.addColorStop(0, '#ffffff');
            plumeGrad.addColorStop(0.15, '#00e5ff');
            plumeGrad.addColorStop(0.6, '#ffb703');
            plumeGrad.addColorStop(1, 'rgba(255, 51, 102, 0)');

            ctx.fillStyle = plumeGrad;
            ctx.beginPath();
            ctx.moveTo(-pw * 0.4, 0);
            ctx.lineTo(-plumeWidth / 2, plumeLength * 0.4);
            ctx.lineTo(0, plumeLength);
            ctx.lineTo(plumeWidth / 2, plumeLength * 0.4);
            ctx.lineTo(pw * 0.4, 0);
            ctx.closePath();
            ctx.fill();

            if (plume.plumeState === 'overexpanded' || plume.plumeState === 'ideally_expanded') {
              ctx.fillStyle = '#ffffff';
              const numDiamonds = 4;
              for (let d = 1; d <= numDiamonds; d++) {
                const dy = (d * plumeLength) / (numDiamonds + 1);
                const dw = 8 * scale;
                const dh = 12 * scale;

                ctx.beginPath();
                ctx.moveTo(0, dy - dh / 2);
                ctx.lineTo(dw / 2, dy);
                ctx.lineTo(0, dy + dh / 2);
                ctx.lineTo(-dw / 2, dy);
                ctx.closePath();
                ctx.fill();
              }
            }

            ctx.restore();
          }
        } else if (def.texturePattern === 'fin') {
          ctx.save();
          if (windTunnelState.finDeflectionAngle !== 0) {
            ctx.rotate((windTunnelState.finDeflectionAngle * Math.PI) / 180);
          }

          ctx.fillStyle = cfdSurfaceGrad;
          ctx.beginPath();
          ctx.moveTo(-pw / 2, -ph / 2);
          ctx.lineTo(pw / 2, 0);
          ctx.lineTo(pw / 2, ph / 2);
          ctx.lineTo(-pw / 2, ph / 2);
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = '#020617';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.restore();
        } else {
          ctx.fillStyle = cfdSurfaceGrad;
          ctx.fillRect(-pw / 2, -ph / 2, pw, ph);

          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 1.2;
          ctx.strokeRect(-pw / 2, -ph / 2, pw, ph);
        }

        ctx.restore();
      }

      ctx.restore();

      // Telemetry Force Vectors
      ctx.save();
      ctx.translate(rocketX, rocketY);

      const dragLen = Math.min(130, Math.max(15, aero.dragForce * 0.22));
      ctx.strokeStyle = '#ff3366';
      ctx.fillStyle = '#ff3366';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(dragLen, 0);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(dragLen + 10, 0);
      ctx.lineTo(dragLen - 4, -6);
      ctx.lineTo(dragLen - 4, 6);
      ctx.closePath();
      ctx.fill();

      ctx.font = 'bold 11px monospace';
      ctx.fillText(`DRAG: ${aero.dragForce} kN`, dragLen + 14, 4);

      const liftLen = aero.liftForce * 0.25;
      if (Math.abs(liftLen) > 2) {
        ctx.strokeStyle = '#00f59b';
        ctx.fillStyle = '#00f59b';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -liftLen);
        ctx.stroke();

        ctx.beginPath();
        const arrowDir = liftLen > 0 ? -1 : 1;
        ctx.moveTo(0, -liftLen + arrowDir * 8);
        ctx.lineTo(-6, -liftLen - arrowDir * 4);
        ctx.lineTo(6, -liftLen - arrowDir * 4);
        ctx.closePath();
        ctx.fill();

        ctx.fillText(`LIFT: ${aero.liftForce} kN`, 12, -liftLen);
      }

      ctx.restore();

      // =========================================================================
      // 7. INTERACTIVE MOUSE TELEMETRY PROBE RETICLE
      // =========================================================================
      if (mouseProbe) {
        ctx.save();
        ctx.strokeStyle = '#00e5ff';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([4, 4]);

        // Reticle crosshair
        ctx.beginPath();
        ctx.arc(mouseProbe.screenX, mouseProbe.screenY, 16, 0, Math.PI * 2);
        ctx.moveTo(mouseProbe.screenX - 22, mouseProbe.screenY);
        ctx.lineTo(mouseProbe.screenX + 22, mouseProbe.screenY);
        ctx.moveTo(mouseProbe.screenX, mouseProbe.screenY - 22);
        ctx.lineTo(mouseProbe.screenX, mouseProbe.screenY + 22);
        ctx.stroke();
        ctx.setLineDash([]);

        // Floating Telemetry Readout
        const probeBoxX = Math.min(width - 190, Math.max(10, mouseProbe.screenX + 24));
        const probeBoxY = Math.min(height - 110, Math.max(30, mouseProbe.screenY - 45));

        ctx.fillStyle = 'rgba(9, 15, 29, 0.95)';
        ctx.strokeStyle = '#00e5ff';
        ctx.lineWidth = 1.5;
        ctx.fillRect(probeBoxX, probeBoxY, 175, 90);
        ctx.strokeRect(probeBoxX, probeBoxY, 175, 90);

        ctx.fillStyle = '#00e5ff';
        ctx.font = 'bold 10px monospace';
        ctx.fillText('CFD SENSOR PROBE', probeBoxX + 8, probeBoxY + 14);

        ctx.fillStyle = '#e2e8f0';
        ctx.font = '10px monospace';
        ctx.fillText(`MACH: ${mouseProbe.localMach.toFixed(2)}`, probeBoxX + 8, probeBoxY + 30);
        ctx.fillText(`TEMP: ${mouseProbe.tempK} K (${mouseProbe.tempC}°C)`, probeBoxX + 8, probeBoxY + 44);
        ctx.fillText(`PRESS: ${mouseProbe.pressureKpa.toFixed(1)} kPa (Cp: ${mouseProbe.cp.toFixed(2)})`, probeBoxX + 8, probeBoxY + 58);
        ctx.fillText(`SPEED: ${Math.round(mouseProbe.speedMs)} m/s`, probeBoxX + 8, probeBoxY + 72);

        ctx.restore();
      }

      ctx.restore();

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [blueprint, windTunnelState, aero, plume, vehicleGeometry, rocketProps, mouseProbe]);

  // Handle Interactive Mouse Movement for Flow Probing
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const scale = 1.45;
    const cellSize = GRID_CELL_SIZE * scale;
    const rocketX = rect.width * 0.44;
    const rocketY = rect.height * 0.5;
    const aoaRad = (windTunnelState.angleToGo * Math.PI) / 180;
    const mach = windTunnelState.mach;

    const dx = mx - rocketX;
    const dy = my - rocketY;
    const xb = dx * Math.cos(-aoaRad) - dy * Math.sin(-aoaRad);
    const yb = dx * Math.sin(-aoaRad) + dy * Math.cos(-aoaRad);

    const noseTipOffset = (vehicleGeometry.noseY - vehicleGeometry.centerY) * cellSize;
    const distToNose = Math.hypot(xb - noseTipOffset, yb);

    let speedFactor = 1.0;
    let tempK = windTunnelState.airTemperature;
    let cp = 0;

    if (distToNose < 60) {
      const frac = 1 - distToNose / 60;
      speedFactor *= Math.max(0.2, 1 - Math.pow(frac, 1.2) * 0.8);
      tempK += (aero.stagnationTemperature - windTunnelState.airTemperature) * frac;
      cp = frac;
    } else {
      tempK = windTunnelState.airTemperature + mach * 25;
      cp = (Math.abs(Math.sin(aoaRad)) * 0.4) * (yb < 0 ? 1 : -1);
    }

    const speedMs = windTunnelState.freestreamSpeed * speedFactor;
    const localMach = mach * speedFactor;
    const pressureKpa = (windTunnelState.dynamicPressure * cp + windTunnelState.airDensity * 287 * tempK) / 1000;

    setMouseProbe({
      worldX: Math.round(mx),
      worldY: Math.round(my),
      screenX: mx,
      screenY: my,
      localMach,
      speedMs,
      tempK: Math.round(tempK),
      tempC: Math.round(tempK - 273.15),
      pressureKpa: Math.max(0.1, pressureKpa),
      cp,
      heatFluxKw: aero.maxHeatFlux
    });
  };

  const handleMouseLeave = () => {
    setMouseProbe(null);
  };

  return (
    <div 
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative flex-1 h-full bg-[#03060f] overflow-hidden select-none cursor-crosshair"
    >
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Real-time Telemetry Overlay */}
      <div className="absolute top-3 right-3 bg-[#090f1d]/95 border-2 border-[#00e5ff]/60 rounded-xl p-3.5 text-xs font-mono shadow-2xl w-80 space-y-2.5 backdrop-blur-md">
        <div className="flex items-center justify-between pb-2 border-b border-[#1e2d42]">
          <span className="font-bold text-slate-100 text-sm">CFD TELEMETRY MATRIX</span>
          <span className="text-[10px] text-[#00e5ff] bg-[#00e5ff]/15 px-2 py-0.5 rounded font-black uppercase">
            {windTunnelState.visualizationMode}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="bg-[#03060f] p-2 rounded-lg border border-[#1a2638]">
            <div className="text-slate-500 font-bold">DRAG COEFF (C_d)</div>
            <div className="text-[#ff3366] font-bold text-sm mt-0.5">{aero.dragCoefficient}</div>
          </div>
          <div className="bg-[#03060f] p-2 rounded-lg border border-[#1a2638]">
            <div className="text-slate-500 font-bold">LIFT COEFF (C_l)</div>
            <div className="text-[#00f59b] font-bold text-sm mt-0.5">{aero.liftCoefficient}</div>
          </div>
          <div className="bg-[#03060f] p-2 rounded-lg border border-[#1a2638]">
            <div className="text-slate-500 font-bold">L/D EFFICIENCY</div>
            <div className="text-[#00e5ff] font-bold text-sm mt-0.5">{aero.liftToDragRatio}</div>
          </div>
          <div className="bg-[#03060f] p-2 rounded-lg border border-[#1a2638]">
            <div className="text-slate-500 font-bold">STAG TEMP (T_0)</div>
            <div className="text-[#ffb703] font-bold text-sm mt-0.5">{aero.stagnationTemperature} K ({aero.stagnationTemperature - 273}°C)</div>
          </div>
          <div className="bg-[#03060f] p-2 rounded-lg border border-[#1a2638]">
            <div className="text-slate-500 font-bold">HEAT FLUX (q_s)</div>
            <div className="text-[#ff3366] font-bold text-sm mt-0.5">{aero.maxHeatFlux} kW/m²</div>
          </div>
          <div className="bg-[#03060f] p-2 rounded-lg border border-[#1a2638]">
            <div className="text-slate-500 font-bold">SHOCK ANGLE (\beta)</div>
            <div className="text-purple-400 font-bold text-sm mt-0.5">{aero.shockwaveAngle}°</div>
          </div>
        </div>

        {windTunnelState.engineTestActive && (
          <div className="pt-2 border-t border-[#1e2d42] text-[10px]">
            <div className="flex justify-between text-slate-400">
              <span>PLUME EXPANSION:</span>
              <strong className="text-[#ffb703] uppercase font-bold">{plume.plumeState.replace('_', ' ')}</strong>
            </div>
            <div className="flex justify-between text-slate-400 mt-0.5">
              <span>PRESSURE RATIO (P_e/P_a):</span>
              <strong className="text-slate-100 font-bold">{plume.pressureRatio}</strong>
            </div>
          </div>
        )}
      </div>

      {/* Dynamic Mode Legend */}
      <div className="absolute top-3 left-3 bg-[#090f1d]/90 border border-[#1e2d42] px-3 py-2 rounded-lg text-[10px] font-mono text-slate-300 shadow-xl space-y-1">
        <div className="font-bold text-slate-200 uppercase tracking-wider">
          {windTunnelState.visualizationMode === 'thermal' && 'THERMAL STAGNATION HEATMAP'}
          {windTunnelState.visualizationMode === 'pressure' && 'PRESSURE COEFFICIENT (Cp) MAP'}
          {windTunnelState.visualizationMode === 'shockwaves' && 'SCHLIEREN DENSITY GRADIENTS'}
          {windTunnelState.visualizationMode === 'turbulence' && 'TURBULENT VORTICITY FIELD'}
          {windTunnelState.visualizationMode === 'streamlines' && 'CFD VELOCITY & MACH FIELD'}
        </div>
        
        {windTunnelState.visualizationMode === 'thermal' && (
          <>
            <div className="w-44 h-2.5 rounded-full overflow-hidden bg-gradient-to-r from-blue-500 via-cyan-400 via-yellow-400 via-red-600 to-white shadow-inner" />
            <div className="flex justify-between text-[9px] text-slate-400">
              <span>Ambient (300K)</span>
              <span>1000K</span>
              <span>Plasma (2500K+)</span>
            </div>
          </>
        )}

        {windTunnelState.visualizationMode === 'pressure' && (
          <>
            <div className="w-44 h-2.5 rounded-full overflow-hidden bg-gradient-to-r from-blue-700 via-cyan-400 via-emerald-400 via-amber-400 to-red-600 shadow-inner" />
            <div className="flex justify-between text-[9px] text-slate-400">
              <span>Suction (-0.6)</span>
              <span>Ambient (0)</span>
              <span>Max Compression (+1.0)</span>
            </div>
          </>
        )}

        {(windTunnelState.visualizationMode === 'streamlines' || windTunnelState.visualizationMode === 'shockwaves' || windTunnelState.visualizationMode === 'turbulence') && (
          <>
            <div className="w-44 h-2.5 rounded-full overflow-hidden bg-gradient-to-r from-blue-600 via-cyan-400 via-emerald-400 via-amber-400 to-red-600 shadow-inner" />
            <div className="flex justify-between text-[9px] text-slate-400">
              <span>Stagnation (0)</span>
              <span>Freestream (1.0)</span>
              <span>Max Velocity (1.5+)</span>
            </div>
          </>
        )}
      </div>

      {/* Bottom Status Bar */}
      <div className="absolute bottom-3 left-3 bg-[#090f1d]/90 border border-[#1e2d42] px-3.5 py-1.5 rounded-lg text-[11px] font-mono text-slate-300 flex items-center gap-4 shadow-xl">
        <span>FREESTREAM: <strong className="text-[#00e5ff]">{Math.round(windTunnelState.freestreamSpeed)} m/s</strong></span>
        <span>DYNAMIC PRESSURE (q): <strong className="text-[#ffb703]">{(windTunnelState.dynamicPressure / 1000).toFixed(1)} kPa</strong></span>
        <span>MOMENT: <strong className={aero.aerodynamicMoment <= 0 ? 'text-[#00f59b]' : 'text-[#ff3366]'}>{aero.aerodynamicMoment} kN·m</strong></span>
        <span className="text-slate-500">| HOVER FLOW TO PROBE TELEMETRY</span>
      </div>
    </div>
  );
};
