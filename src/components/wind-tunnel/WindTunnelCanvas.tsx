import React, { useRef, useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { useSimulation } from '../../context/SimulationContext';
import { PARTS_CATALOG, GRID_CELL_SIZE, calculateRocketProperties } from '../../physics/rocket-math';
import { calculateAeroTelemetry, calculateNozzlePlume } from '../../physics/aerodynamics';
import { ExportReportModal } from './ExportReportModal';

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

interface FlowParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  alpha: number;
}

export const WindTunnelCanvas: React.FC = () => {
  const { blueprint, windTunnelState } = useSimulation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);

  const [mouseProbe, setMouseProbe] = useState<ProbeData | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);

  const aero = calculateAeroTelemetry(windTunnelState);
  const plume = calculateNozzlePlume(
    windTunnelState.nozzleChamberPressure,
    windTunnelState.airDensity * 287 * windTunnelState.airTemperature
  );
  const rocketProps = calculateRocketProperties(blueprint);

  // Precompute individual part bounding geometry & physics properties
  const vehicleGeometry = React.useMemo(() => {
    if (blueprint.parts.length === 0) {
      return {
        centerX: 0,
        centerY: 0,
        noseY: -4,
        tailY: 4,
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

    // Pool of live flowing air particles
    const particles: FlowParticle[] = [];
    const NUM_PARTICLES = 160;

    for (let i = 0; i < NUM_PARTICLES; i++) {
      particles.push({
        x: Math.random() * 800,
        y: 25 + Math.random() * 550,
        vx: 0,
        vy: 0,
        life: Math.random() * 100,
        maxLife: 80 + Math.random() * 60,
        size: 1.2 + Math.random() * 1.5,
        alpha: 0.2 + Math.random() * 0.5
      });
    }

    // Standard Scientific CFD Turbo/Jet Colormap
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

    // Scientific Thermal Colormap
    const getThermalColor = (tempK: number, alpha: number = 0.85): string => {
      if (tempK < 320) {
        return `rgba(56, 189, 248, ${alpha})`;
      } else if (tempK < 500) {
        const t = (tempK - 320) / 180;
        return `rgba(${Math.round(250 * t)}, ${Math.round(180 + 40 * t)}, 50, ${alpha})`;
      } else if (tempK < 900) {
        const t = (tempK - 500) / 400;
        return `rgba(255, ${Math.round(180 * (1 - t * 0.7))}, 0, ${alpha})`;
      } else if (tempK < 1600) {
        const t = (tempK - 900) / 700;
        return `rgba(255, ${Math.round(60 + 140 * t)}, ${Math.round(80 * t)}, ${alpha})`;
      } else {
        return `rgba(255, 255, 255, ${alpha})`;
      }
    };

    // Symmetric Pressure Colormap (Cp)
    const getPressureColor = (cp: number, alpha: number = 0.85): string => {
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

      // Clean aerospace CAD canvas background
      ctx.fillStyle = '#0E1520';
      ctx.fillRect(0, 0, width, height);

      // Boundary walls
      ctx.fillStyle = '#121A26';
      ctx.fillRect(0, 0, width, 20);
      ctx.fillRect(0, height - 20, width, 20);
      ctx.strokeStyle = '#1C2938';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, 0, width, 20);
      ctx.strokeRect(0, height - 20, width, 20);

      // Subtle engineering inspection grid
      ctx.strokeStyle = '#141C2B';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(Math.round(x) + 0.5, 0);
        ctx.lineTo(Math.round(x) + 0.5, height);
        ctx.stroke();
      }
      for (let y = 20; y < height - 20; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, Math.round(y) + 0.5);
        ctx.lineTo(width, Math.round(y) + 0.5);
        ctx.stroke();
      }

      const scale = 1.45;
      const cellSize = GRID_CELL_SIZE * scale;
      const rocketX = width * 0.44;
      const rocketY = height * 0.5;

      const rocketPitchDeg = windTunnelState.rocketPitch || 0;
      const windAngleDeg = windTunnelState.windAngle || 0;

      const rocketPitchRad = (rocketPitchDeg * Math.PI) / 180;
      const windAngleRad = (windAngleDeg * Math.PI) / 180;

      const mach = windTunnelState.mach;
      const speedPx = 280 + mach * 120;
      animPulseOffset += dt * speedPx;

      // Base incoming wind direction vector
      const uWind = Math.cos(windAngleRad);
      const vWind = Math.sin(windAngleRad);

      // =====================================================================
      // MULTI-PART EXACT 2D SIGNED DISTANCE & INTERACTION FIELD (SDF)
      // Every placed part in the blueprint acts as an individual solid obstacle
      // =====================================================================
      const getMultiPartDistance = (wx: number, wy: number): {
        minDist: number;
        nx: number;
        ny: number;
        nearestPart: typeof vehicleGeometry.parts[0] | null;
        isInside: boolean;
        inWake: boolean;
        wakeIntensity: number;
      } => {
        let minDist = 9999;
        let nx = 0;
        let ny = 0;
        let nearestPart: typeof vehicleGeometry.parts[0] | null = null;
        let isInside = false;
        let inWake = false;
        let wakeIntensity = 0;

        // Transform world point into rocket body coordinate frame
        const dxRocket = wx - rocketX;
        const dyRocket = wy - rocketY;

        const xbGlobal = dxRocket * Math.cos(-rocketPitchRad) - dyRocket * Math.sin(-rocketPitchRad);
        const ybGlobal = dxRocket * Math.sin(-rocketPitchRad) + dyRocket * Math.cos(-rocketPitchRad);

        for (const p of vehicleGeometry.parts) {
          const def = p.def;
          if (!def) continue;

          // Part center in body frame
          const pCenterY = (p.y - vehicleGeometry.centerY) * cellSize;
          const pCenterX = (p.x - vehicleGeometry.centerX) * cellSize;
          const pw = def.width * cellSize;
          const ph = def.height * cellSize;

          // Local coordinate relative to part center
          const lx = xbGlobal - pCenterY;
          const ly = ybGlobal - pCenterX;

          // Compute exact signed distance to this specific part shape
          let dPart = 0;
          let partNx = 0;
          let partNy = 0;

          if (def.texturePattern === 'cone') {
            // Conical ogive nose / fairing
            const hw = pw / 2;
            const hh = ph / 2;
            if (lx < -hh) {
              dPart = Math.hypot(lx + hh, ly);
              partNx = (lx + hh) / (dPart || 1);
              partNy = ly / (dPart || 1);
            } else if (lx > hh) {
              dPart = Math.hypot(lx - hh, Math.max(0, Math.abs(ly) - hw));
              partNx = 1;
              partNy = ly >= 0 ? 1 : -1;
            } else {
              const normY = Math.max(0, Math.min(1, (lx + hh) / ph));
              const localR = hw * Math.sqrt(normY);
              dPart = Math.abs(ly) - localR;
              partNx = (1 - normY) * -0.5;
              partNy = ly >= 0 ? 1 : -1;
            }
          } else if (def.texturePattern === 'fin') {
            // Swept delta fin shape
            const hw = pw / 2;
            const hh = ph / 2;
            const isRight = p.x > 0;
            const rootLy = isRight ? -hw : hw;
            const tipLy = isRight ? hw : -hw;

            const normX = Math.max(0, Math.min(1, (lx + hh) / ph));
            const finEdge = rootLy + (tipLy - rootLy) * Math.min(1, normX * 1.6);
            
            if (lx >= -hh && lx <= hh) {
              if (isRight) {
                dPart = (ly < rootLy ? rootLy - ly : ly > finEdge ? ly - finEdge : -1);
              } else {
                dPart = (ly > rootLy ? ly - rootLy : ly < finEdge ? finEdge - ly : -1);
              }
              partNx = -0.4;
              partNy = isRight ? 1 : -1;
            } else {
              dPart = Math.hypot(Math.abs(lx) - hh, Math.abs(ly) - hw);
              partNx = lx > 0 ? 1 : -1;
              partNy = ly >= 0 ? 1 : -1;
            }
          } else {
            // Rectangular or cylindrical tank / module / engine
            const hw = pw / 2;
            const hh = ph / 2;
            const qx = Math.abs(lx) - hh;
            const qy = Math.abs(ly) - hw;
            const extDist = Math.hypot(Math.max(0, qx), Math.max(0, qy));
            const intDist = Math.min(0, Math.max(qx, qy));
            dPart = extDist + intDist;

            if (qx > qy) {
              partNx = lx >= 0 ? 1 : -1;
              partNy = 0;
            } else {
              partNx = 0;
              partNy = ly >= 0 ? 1 : -1;
            }
          }

          // Check wake region behind this individual part
          if (lx > ph / 2 && Math.abs(ly) < pw / 2 + 10) {
            const wakeDist = lx - ph / 2;
            if (wakeDist < 90) {
              inWake = true;
              wakeIntensity = Math.max(wakeIntensity, 1 - wakeDist / 90);
            }
          }

          if (dPart < minDist) {
            minDist = dPart;
            nearestPart = p;
            isInside = dPart <= 0;

            // Transform normal back to world coordinates
            const worldNx = partNx * Math.cos(rocketPitchRad) - partNy * Math.sin(rocketPitchRad);
            const worldNy = partNx * Math.sin(rocketPitchRad) + partNy * Math.cos(rocketPitchRad);
            nx = worldNx;
            ny = worldNy;
          }
        }

        return {
          minDist,
          nx,
          ny,
          nearestPart,
          isInside,
          inWake,
          wakeIntensity
        };
      };

      // Flow Velocity Calculation Engine based on Multi-Obstacle Vector Interaction
      const getFlowVelocityAt = (wx: number, wy: number): {
        u: number;
        v: number;
        speedNorm: number;
        tempK: number;
        cp: number;
        machLocal: number;
      } => {
        let u = uWind;
        let v = vWind;

        const sdf = getMultiPartDistance(wx, wy);
        let speedFactor = 1.0;
        let tempK = windTunnelState.airTemperature;
        let cpLocal = 0;

        const influenceRadius = 45;

        if (sdf.isInside) {
          // Inside a solid part
          return {
            u: 0,
            v: 0,
            speedNorm: 0,
            tempK: windTunnelState.airTemperature + (aero.stagnationTemperature - windTunnelState.airTemperature) * 0.5,
            cp: 0.1,
            machLocal: 0
          };
        }

        if (sdf.minDist < influenceRadius) {
          const normDist = sdf.minDist / influenceRadius;
          const proximity = Math.pow(1 - normDist, 1.4);

          // Dot product with incoming wind determines stagnation (windward) vs expansion (leeward)
          const dotInflow = uWind * sdf.nx + vWind * sdf.ny;

          if (dotInflow < -0.1) {
            // Forward stagnation compression
            const stagProximity = Math.abs(dotInflow) * proximity;
            speedFactor *= Math.max(0.15, 1 - stagProximity * 0.85);
            tempK = windTunnelState.airTemperature + (aero.stagnationTemperature - windTunnelState.airTemperature) * stagProximity;
            cpLocal = Math.min(1.0, stagProximity * 1.1);
          } else {
            // Tangential flow acceleration around boundary / expansion
            speedFactor *= (1.0 + proximity * 0.25);
            cpLocal = -0.25 * proximity;
            tempK = windTunnelState.airTemperature + (aero.stagnationTemperature - windTunnelState.airTemperature) * 0.3 * proximity;
          }

          // Deflect velocity vector tangentially along the obstacle surface
          const normalMag = u * sdf.nx + v * sdf.ny;
          if (normalMag < 0) {
            // Project out normal inward component
            u = u - normalMag * sdf.nx * proximity;
            v = v - normalMag * sdf.ny * proximity;
          }

          // Push flow slightly outward around the obstacle boundary
          u += sdf.nx * proximity * 0.5;
          v += sdf.ny * proximity * 0.5;
        }

        // Local part wake vortex shedding
        if (sdf.inWake) {
          const vortexFreq = time * 0.009 + (wx * 0.05);
          const vortexOffset = Math.sin(vortexFreq) * 0.35 * sdf.wakeIntensity;
          v += vortexOffset;
          speedFactor *= (0.75 + 0.25 * (1 - sdf.wakeIntensity));
          cpLocal -= 0.3 * sdf.wakeIntensity;
        }

        // Supersonic bow shock compression
        if (mach >= 1.0) {
          const shockAngleRad = (aero.shockwaveAngle * Math.PI) / 180;
          const standOff = Math.max(6, 18 / Math.pow(mach, 0.75));
          const noseOffset = (vehicleGeometry.noseY - vehicleGeometry.centerY) * cellSize;
          const noseApexX = rocketX - Math.abs(noseOffset) * Math.cos(rocketPitchRad);
          const noseApexY = rocketY - Math.abs(noseOffset) * Math.sin(rocketPitchRad);

          const shockApexX = noseApexX - standOff * Math.cos(windAngleRad);
          const shockApexY = noseApexY - standOff * Math.sin(windAngleRad);

          const shockFrontX = shockApexX + Math.abs(wy - shockApexY) / Math.tan(shockAngleRad);
          if (wx >= shockFrontX - 6 && wx <= shockFrontX + 12) {
            speedFactor *= 0.8;
            tempK = Math.max(tempK, windTunnelState.airTemperature + (mach - 1) * 110);
            cpLocal = Math.max(cpLocal, 0.55);
          }
        }

        const uFinal = u * speedFactor;
        const vFinal = v * speedFactor;
        const speedMag = Math.hypot(uFinal, vFinal);
        const speedNorm = Math.min(1, Math.max(0, (speedMag - 0.2) / 1.3));
        const machLocal = mach * speedMag;

        return {
          u: uFinal,
          v: vFinal,
          speedNorm,
          tempK,
          cp: cpLocal,
          machLocal
        };
      };

      // 48 Continuous Flow Streamlines
      const NUM_STREAMLINES = 48;
      const rakeTop = 26;
      const rakeBottom = height - 26;
      const rakeSpacing = (rakeBottom - rakeTop) / (NUM_STREAMLINES - 1);

      const streamlines: { points: { x: number; y: number; speedNorm: number; tempK: number; cp: number }[] }[] = [];

      for (let s = 0; s < NUM_STREAMLINES; s++) {
        let currX = 0;
        let currY = rakeTop + s * rakeSpacing;
        const pts: { x: number; y: number; speedNorm: number; tempK: number; cp: number }[] = [];

        const stepSize = 7.0;
        let steps = 0;

        while (currX <= width + 15 && currY >= 20 && currY <= height - 20 && steps < 220) {
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

      // Draw continuous CFD Streamlines
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
          } else {
            ctx.strokeStyle = getCfdColor(pt1.speedNorm, 0.88);
            ctx.lineWidth = 1.7;
          }

          ctx.beginPath();
          ctx.moveTo(pt1.x, pt1.y);
          ctx.lineTo(pt2.x, pt2.y);
          ctx.stroke();
        }

        // Animated particles along streamlines
        ctx.save();
        ctx.setLineDash([16, 24]);
        ctx.lineDashOffset = -animPulseOffset * (0.85 + 0.3 * (s % 4));
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let p = 1; p < pts.length; p++) {
          ctx.lineTo(pts[p].x, pts[p].y);
        }
        ctx.stroke();
        ctx.restore();
      }

      // LIVE INTERACTIVE AIRFLOW PARTICLES (Weave through gaps and around models)
      ctx.save();
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const flow = getFlowVelocityAt(p.x, p.y);

        p.vx = flow.u * (speedPx * 0.9);
        p.vy = flow.v * (speedPx * 0.9);

        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life += dt * 30;

        if (p.x > width + 10 || p.x < -10 || p.y < 20 || p.y > height - 20 || p.life >= p.maxLife) {
          // Respawn at wind tunnel inlet
          p.x = -5;
          p.y = 25 + Math.random() * (height - 50);
          p.life = 0;
          p.maxLife = 60 + Math.random() * 80;
        }

        const alpha = Math.min(1, Math.sin((p.life / p.maxLife) * Math.PI)) * p.alpha;
        ctx.fillStyle = `rgba(56, 189, 248, ${alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Supersonic Bow Shock
      if (mach >= 1.0) {
        ctx.save();
        const shockAngleRad = (aero.shockwaveAngle * Math.PI) / 180;
        const standOffDist = Math.max(6, 18 / Math.pow(mach, 0.75));

        const noseOffset = (vehicleGeometry.noseY - vehicleGeometry.centerY) * cellSize;
        const noseApexX = rocketX - Math.abs(noseOffset) * Math.cos(rocketPitchRad);
        const noseApexY = rocketY - Math.abs(noseOffset) * Math.sin(rocketPitchRad);

        const shockApexX = noseApexX - standOffDist * Math.cos(windAngleRad);
        const shockApexY = noseApexY - standOffDist * Math.sin(windAngleRad);

        const shockLength = Math.max(380, width * 0.6);
        const shockGrad = ctx.createLinearGradient(shockApexX, shockApexY, shockApexX + shockLength, shockApexY);
        shockGrad.addColorStop(0, '#38BDF8');
        shockGrad.addColorStop(0.3, '#FBBF24');
        shockGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');

        ctx.strokeStyle = shockGrad;
        ctx.lineWidth = Math.min(4.0, 1.6 + mach * 0.4);

        ctx.beginPath();
        for (let dist = 0; dist <= 300; dist += 6) {
          const lx = dist;
          const ly = -dist * Math.tan(shockAngleRad);
          const wx = shockApexX + lx * Math.cos(windAngleRad) - ly * Math.sin(windAngleRad);
          const wy = shockApexY + lx * Math.sin(windAngleRad) + ly * Math.cos(windAngleRad);
          if (dist === 0) ctx.moveTo(wx, wy);
          else ctx.lineTo(wx, wy);
        }
        ctx.stroke();

        ctx.beginPath();
        for (let dist = 0; dist <= 300; dist += 6) {
          const lx = dist;
          const ly = dist * Math.tan(shockAngleRad);
          const wx = shockApexX + lx * Math.cos(windAngleRad) - ly * Math.sin(windAngleRad);
          const wy = shockApexY + lx * Math.sin(windAngleRad) + ly * Math.cos(windAngleRad);
          if (dist === 0) ctx.moveTo(wx, wy);
          else ctx.lineTo(wx, wy);
        }
        ctx.stroke();

        ctx.restore();
      }

      // RENDER ALL INDIVIDUAL ROCKET PARTS IN CONTROLLED PITCH ATTITUDE
      ctx.save();
      ctx.translate(rocketX, rocketY);
      ctx.rotate(-Math.PI / 2 + rocketPitchRad);

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
        const effAoA = windAngleDeg - rocketPitchDeg;

        let partSurfaceGrad: CanvasGradient;

        if (windTunnelState.visualizationMode === 'thermal') {
          const maxT = aero.stagnationTemperature;
          if (isNose) {
            partSurfaceGrad = ctx.createLinearGradient(0, -ph / 2, 0, ph / 2);
            partSurfaceGrad.addColorStop(0, maxT > 1400 ? '#ffffff' : maxT > 800 ? '#FBBF24' : '#F43F5E');
            partSurfaceGrad.addColorStop(0.35, maxT > 900 ? '#F43F5E' : '#FBBF24');
            partSurfaceGrad.addColorStop(0.7, '#1E293B');
            partSurfaceGrad.addColorStop(1, '#0F172A');
          } else {
            partSurfaceGrad = ctx.createLinearGradient(-pw / 2, 0, pw / 2, 0);
            if (effAoA > 2) {
              partSurfaceGrad.addColorStop(0, '#F43F5E');
              partSurfaceGrad.addColorStop(0.4, '#FBBF24');
              partSurfaceGrad.addColorStop(1, '#1E293B');
            } else if (effAoA < -2) {
              partSurfaceGrad.addColorStop(0, '#1E293B');
              partSurfaceGrad.addColorStop(0.6, '#FBBF24');
              partSurfaceGrad.addColorStop(1, '#F43F5E');
            } else {
              partSurfaceGrad.addColorStop(0, '#1E293B');
              partSurfaceGrad.addColorStop(0.5, maxT > 600 ? '#FBBF24' : '#334155');
              partSurfaceGrad.addColorStop(1, '#1E293B');
            }
          }
        } else if (windTunnelState.visualizationMode === 'pressure') {
          if (isNose) {
            partSurfaceGrad = ctx.createLinearGradient(0, -ph / 2, 0, ph / 2);
            partSurfaceGrad.addColorStop(0, '#F43F5E');
            partSurfaceGrad.addColorStop(0.4, '#FBBF24');
            partSurfaceGrad.addColorStop(0.85, '#38BDF8');
            partSurfaceGrad.addColorStop(1, '#1E3A8A');
          } else {
            partSurfaceGrad = ctx.createLinearGradient(-pw / 2, 0, pw / 2, 0);
            if (effAoA > 2) {
              partSurfaceGrad.addColorStop(0, '#F43F5E');
              partSurfaceGrad.addColorStop(0.4, '#34D399');
              partSurfaceGrad.addColorStop(1, '#1E3A8A');
            } else if (effAoA < -2) {
              partSurfaceGrad.addColorStop(0, '#1E3A8A');
              partSurfaceGrad.addColorStop(0.6, '#34D399');
              partSurfaceGrad.addColorStop(1, '#F43F5E');
            } else {
              partSurfaceGrad.addColorStop(0, '#1E3A8A');
              partSurfaceGrad.addColorStop(0.5, '#34D399');
              partSurfaceGrad.addColorStop(1, '#1E3A8A');
            }
          }
        } else {
          if (isNose) {
            partSurfaceGrad = ctx.createLinearGradient(0, -ph / 2, 0, ph / 2);
            partSurfaceGrad.addColorStop(0, '#F43F5E');
            partSurfaceGrad.addColorStop(0.3, '#FBBF24');
            partSurfaceGrad.addColorStop(0.7, '#38BDF8');
            partSurfaceGrad.addColorStop(1, '#1E293B');
          } else if (isFin) {
            partSurfaceGrad = ctx.createLinearGradient(-pw / 2, 0, pw / 2, 0);
            partSurfaceGrad.addColorStop(0, '#38BDF8');
            partSurfaceGrad.addColorStop(0.5, '#1E293B');
            partSurfaceGrad.addColorStop(1, '#38BDF8');
          } else {
            partSurfaceGrad = ctx.createLinearGradient(-pw / 2, 0, pw / 2, 0);
            partSurfaceGrad.addColorStop(0, '#0F172A');
            partSurfaceGrad.addColorStop(0.25, def.color || '#334155');
            partSurfaceGrad.addColorStop(0.5, '#475569');
            partSurfaceGrad.addColorStop(0.75, def.color || '#334155');
            partSurfaceGrad.addColorStop(1, '#0F172A');
          }
        }

        if (def.texturePattern === 'cone') {
          ctx.fillStyle = partSurfaceGrad;
          ctx.beginPath();
          ctx.moveTo(-pw / 2, ph / 2);
          ctx.quadraticCurveTo(0, -ph / 2 - 10 * scale, pw / 2, ph / 2);
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = '#0B0F17';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          if (aero.stagnationTemperature > 450) {
            const stagT = aero.stagnationTemperature;
            const glowRadius = Math.min(42, 10 + (mach * 2.8));
            const glowGrad = ctx.createRadialGradient(0, -ph / 2 - 4, 1, 0, -ph / 2 - 4, glowRadius);
            glowGrad.addColorStop(0, stagT > 1400 ? '#ffffff' : stagT > 800 ? '#FEF08A' : '#FBBF24');
            glowGrad.addColorStop(0.35, stagT > 900 ? '#FBBF24' : '#F43F5E');
            glowGrad.addColorStop(0.75, 'rgba(244, 63, 94, 0.4)');
            glowGrad.addColorStop(1, 'rgba(244, 63, 94, 0)');
            ctx.fillStyle = glowGrad;
            ctx.beginPath();
            ctx.arc(0, -ph / 2 - 4, glowRadius, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (def.texturePattern === 'engine-bell') {
          ctx.fillStyle = '#1E293B';
          ctx.fillRect(-pw * 0.35, -ph / 2, pw * 0.7, ph * 0.35);

          const bellGrad = ctx.createLinearGradient(-pw / 2, 0, pw / 2, 0);
          bellGrad.addColorStop(0, '#0F172A');
          bellGrad.addColorStop(0.3, '#334155');
          bellGrad.addColorStop(0.7, '#334155');
          bellGrad.addColorStop(1, '#0F172A');

          ctx.fillStyle = bellGrad;
          ctx.beginPath();
          ctx.moveTo(-pw * 0.2, -ph / 2 + ph * 0.45);
          ctx.lineTo(pw * 0.2, -ph / 2 + ph * 0.45);
          ctx.lineTo(pw / 2, ph / 2);
          ctx.lineTo(-pw / 2, ph / 2);
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = '#0F172A';
          ctx.lineWidth = 1.2;
          ctx.stroke();

          if (windTunnelState.engineTestActive) {
            const plumeLength = 140 * scale * windTunnelState.engineThrottle;
            const plumeWidth = pw * 0.85 * (plume.plumeState === 'underexpanded' ? 1.8 : 0.95);

            ctx.save();
            ctx.translate(0, ph / 2);

            const plumeGrad = ctx.createLinearGradient(0, 0, 0, plumeLength);
            plumeGrad.addColorStop(0, '#ffffff');
            plumeGrad.addColorStop(0.15, '#38BDF8');
            plumeGrad.addColorStop(0.6, '#FBBF24');
            plumeGrad.addColorStop(1, 'rgba(244, 63, 94, 0)');

            ctx.fillStyle = plumeGrad;
            ctx.beginPath();
            ctx.moveTo(-pw * 0.4, 0);
            ctx.lineTo(-plumeWidth / 2, plumeLength * 0.4);
            ctx.lineTo(0, plumeLength);
            ctx.lineTo(plumeWidth / 2, plumeLength * 0.4);
            ctx.lineTo(pw * 0.4, 0);
            ctx.closePath();
            ctx.fill();

            ctx.restore();
          }
        } else if (def.texturePattern === 'fin') {
          ctx.save();
          if (windTunnelState.finDeflectionAngle !== 0) {
            ctx.rotate((windTunnelState.finDeflectionAngle * Math.PI) / 180);
          }

          const isRightSide = part.x > 0;
          ctx.fillStyle = partSurfaceGrad;
          ctx.beginPath();
          if (isRightSide) {
            ctx.moveTo(-pw / 2, -ph / 2);
            ctx.lineTo(pw / 2, ph * 0.2);
            ctx.lineTo(pw / 2, ph / 2);
            ctx.lineTo(-pw / 2, ph / 2);
          } else {
            ctx.moveTo(pw / 2, -ph / 2);
            ctx.lineTo(-pw / 2, ph * 0.2);
            ctx.lineTo(-pw / 2, ph / 2);
            ctx.lineTo(pw / 2, ph / 2);
          }
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = '#0B0F17';
          ctx.lineWidth = 1.2;
          ctx.stroke();

          ctx.restore();
        } else {
          ctx.fillStyle = partSurfaceGrad;
          ctx.fillRect(-pw / 2, -ph / 2, pw, ph);

          ctx.strokeStyle = '#0B0F17';
          ctx.lineWidth = 1.2;
          ctx.strokeRect(-pw / 2, -ph / 2, pw, ph);
        }

        ctx.restore();
      }

      ctx.restore();

      // Force Vectors (Drag & Lift)
      ctx.save();
      ctx.translate(rocketX, rocketY);

      const dragLen = Math.min(130, Math.max(15, aero.dragForce * 0.22));
      const dragDx = dragLen * Math.cos(windAngleRad);
      const dragDy = dragLen * Math.sin(windAngleRad);

      ctx.strokeStyle = '#F43F5E';
      ctx.fillStyle = '#F43F5E';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(dragDx, dragDy);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(dragDx + 8 * Math.cos(windAngleRad), dragDy + 8 * Math.sin(windAngleRad));
      ctx.lineTo(dragDx - 4 * Math.sin(windAngleRad), dragDy + 4 * Math.cos(windAngleRad));
      ctx.lineTo(dragDx + 4 * Math.sin(windAngleRad), dragDy - 4 * Math.cos(windAngleRad));
      ctx.closePath();
      ctx.fill();

      ctx.font = '500 11px monospace';
      ctx.fillText(`Drag: ${aero.dragForce} kN`, dragDx + 12, dragDy + 4);

      const liftLen = aero.liftForce * 0.25;
      if (Math.abs(liftLen) > 2) {
        const liftDx = liftLen * Math.sin(windAngleRad);
        const liftDy = -liftLen * Math.cos(windAngleRad);

        ctx.strokeStyle = '#34D399';
        ctx.fillStyle = '#34D399';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(liftDx, liftDy);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(liftDx, liftDy, 3.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillText(`Lift: ${aero.liftForce} kN`, liftDx + 8, liftDy - 4);
      }

      ctx.restore();

      // Interactive Mouse Telemetry Probe
      if (mouseProbe) {
        ctx.save();
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);

        ctx.beginPath();
        ctx.arc(mouseProbe.screenX, mouseProbe.screenY, 14, 0, Math.PI * 2);
        ctx.moveTo(mouseProbe.screenX - 18, mouseProbe.screenY);
        ctx.lineTo(mouseProbe.screenX + 18, mouseProbe.screenY);
        ctx.moveTo(mouseProbe.screenX, mouseProbe.screenY - 18);
        ctx.lineTo(mouseProbe.screenX, mouseProbe.screenY + 18);
        ctx.stroke();
        ctx.setLineDash([]);

        const probeBoxX = Math.min(width - 180, Math.max(10, mouseProbe.screenX + 20));
        const probeBoxY = Math.min(height - 100, Math.max(30, mouseProbe.screenY - 40));

        ctx.fillStyle = 'rgba(18, 26, 38, 0.95)';
        ctx.strokeStyle = '#263548';
        ctx.lineWidth = 1;
        ctx.fillRect(probeBoxX, probeBoxY, 160, 80);
        ctx.strokeRect(probeBoxX, probeBoxY, 160, 80);

        ctx.fillStyle = '#38BDF8';
        ctx.font = '600 10px sans-serif';
        ctx.fillText('CFD SENSOR PROBE', probeBoxX + 8, probeBoxY + 14);

        ctx.fillStyle = '#9AA9B8';
        ctx.font = '500 10px monospace';
        ctx.fillText(`Mach: ${mouseProbe.localMach.toFixed(2)}`, probeBoxX + 8, probeBoxY + 30);
        ctx.fillText(`Temp: ${mouseProbe.tempK} K (${mouseProbe.tempC}°C)`, probeBoxX + 8, probeBoxY + 44);
        ctx.fillText(`Press: ${mouseProbe.pressureKpa.toFixed(1)} kPa`, probeBoxX + 8, probeBoxY + 58);
        ctx.fillText(`Speed: ${Math.round(mouseProbe.speedMs)} m/s`, probeBoxX + 8, probeBoxY + 72);

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

    const rocketPitchRad = ((windTunnelState.rocketPitch || 0) * Math.PI) / 180;
    const windAngleRad = ((windTunnelState.windAngle || 0) * Math.PI) / 180;
    const relAoARad = windAngleRad - rocketPitchRad;
    const mach = windTunnelState.mach;

    const dx = mx - rocketX;
    const dy = my - rocketY;
    const xb = dx * Math.cos(-rocketPitchRad) - dy * Math.sin(-rocketPitchRad);
    const yb = dx * Math.sin(-rocketPitchRad) + dy * Math.cos(-rocketPitchRad);

    const noseTipOffset = (vehicleGeometry.noseY - vehicleGeometry.centerY) * cellSize;
    const distToNose = Math.hypot(xb - noseTipOffset, yb);

    let speedFactor = 1.0;
    let tempK = windTunnelState.airTemperature;
    let cp = 0;

    if (distToNose < 50) {
      const frac = 1 - distToNose / 50;
      speedFactor *= Math.max(0.2, 1 - Math.pow(frac, 1.2) * 0.8);
      tempK += (aero.stagnationTemperature - windTunnelState.airTemperature) * frac;
      cp = frac;
    } else {
      tempK = windTunnelState.airTemperature + mach * 20;
      cp = (Math.abs(Math.sin(relAoARad)) * 0.4) * (yb < 0 ? 1 : -1);
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
      className="relative flex-1 h-full bg-[#0E1520] overflow-hidden select-none cursor-crosshair"
    >
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Real-time Engineering Telemetry Overlay */}
      <div className="absolute top-3 right-3 bg-[#121A26]/95 border border-[#263548] rounded-lg p-3 text-xs shadow-lg w-72 space-y-2">
        <div className="flex items-center justify-between pb-1.5 border-b border-[#1C2938]">
          <span className="font-semibold text-[#E8EDF2] text-xs">Aerodynamic Metrics</span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#172131] hover:bg-[#1B2838] border border-[#263548] text-[#38BDF8] hover:text-[#E8EDF2] text-[10px] font-medium transition-colors"
              title="Export Telemetry Data"
            >
              <Download className="w-2.5 h-2.5" />
              <span>Export</span>
            </button>
            <span className="text-[10px] text-[#38BDF8] bg-[#38BDF8]/10 px-1.5 py-0.5 rounded font-medium capitalize">
              {windTunnelState.visualizationMode}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="bg-[#172131] p-2 rounded border border-[#263548]/40">
            <span className="text-[#64748B] block">Drag (Cd)</span>
            <span className="text-[#F43F5E] font-mono-num font-semibold text-xs mt-0.5 block">{aero.dragCoefficient}</span>
          </div>
          <div className="bg-[#172131] p-2 rounded border border-[#263548]/40">
            <span className="text-[#64748B] block">Lift (Cl)</span>
            <span className="text-[#34D399] font-mono-num font-semibold text-xs mt-0.5 block">{aero.liftCoefficient}</span>
          </div>
          <div className="bg-[#172131] p-2 rounded border border-[#263548]/40">
            <span className="text-[#64748B] block">L/D Efficiency</span>
            <span className="text-[#38BDF8] font-mono-num font-semibold text-xs mt-0.5 block">{aero.liftToDragRatio}</span>
          </div>
          <div className="bg-[#172131] p-2 rounded border border-[#263548]/40">
            <span className="text-[#64748B] block">Stagnation Temp</span>
            <span className="text-[#FBBF24] font-mono-num font-semibold text-xs mt-0.5 block">{aero.stagnationTemperature} K</span>
          </div>
          <div className="bg-[#172131] p-2 rounded border border-[#263548]/40">
            <span className="text-[#64748B] block">Heat Flux</span>
            <span className="text-[#F43F5E] font-mono-num font-semibold text-xs mt-0.5 block">{aero.maxHeatFlux} kW/m²</span>
          </div>
          <div className="bg-[#172131] p-2 rounded border border-[#263548]/40">
            <span className="text-[#64748B] block">Shock Angle (β)</span>
            <span className="text-[#E8EDF2] font-mono-num font-semibold text-xs mt-0.5 block">{aero.shockwaveAngle}°</span>
          </div>
        </div>
      </div>

      {/* Dynamic Mode Legend */}
      <div className="absolute top-3 left-3 bg-[#121A26]/90 border border-[#263548] px-3 py-2 rounded-lg text-[10px] text-[#9AA9B8] shadow-md space-y-1">
        <span className="font-semibold text-[#E8EDF2] tracking-tight block">
          {windTunnelState.visualizationMode === 'thermal' && 'Thermal Stagnation Map'}
          {windTunnelState.visualizationMode === 'pressure' && 'Pressure Coefficient (Cp) Map'}
          {windTunnelState.visualizationMode === 'shockwaves' && 'Schlieren Density Gradient'}
          {windTunnelState.visualizationMode === 'turbulence' && 'Turbulent Vorticity Field'}
          {windTunnelState.visualizationMode === 'streamlines' && 'CFD Velocity Field'}
        </span>
        
        {windTunnelState.visualizationMode === 'thermal' && (
          <>
            <div className="w-36 h-2 rounded-full overflow-hidden bg-gradient-to-r from-blue-500 via-yellow-400 to-white shadow-inner" />
            <div className="flex justify-between text-[9px] text-[#64748B]">
              <span>300 K</span>
              <span>1200 K</span>
              <span>2500+ K</span>
            </div>
          </>
        )}

        {windTunnelState.visualizationMode === 'pressure' && (
          <>
            <div className="w-36 h-2 rounded-full overflow-hidden bg-gradient-to-r from-blue-600 via-emerald-400 to-red-600 shadow-inner" />
            <div className="flex justify-between text-[9px] text-[#64748B]">
              <span>Suction (-0.6)</span>
              <span>0 (Freestream)</span>
              <span>Compression (+1.0)</span>
            </div>
          </>
        )}

        {(windTunnelState.visualizationMode === 'streamlines' || windTunnelState.visualizationMode === 'shockwaves' || windTunnelState.visualizationMode === 'turbulence') && (
          <>
            <div className="w-36 h-2 rounded-full overflow-hidden bg-gradient-to-r from-blue-600 via-cyan-400 via-amber-400 to-red-600 shadow-inner" />
            <div className="flex justify-between text-[9px] text-[#64748B]">
              <span>Stagnation (0)</span>
              <span>Freestream (1.0)</span>
              <span>Max-Q</span>
            </div>
          </>
        )}
      </div>

      {/* Bottom Status Readout */}
      <div className="absolute bottom-3 left-3 bg-[#121A26]/90 border border-[#263548] px-3 py-1.5 rounded-lg text-xs text-[#9AA9B8] flex items-center gap-4 shadow-sm">
        <span>Rocket Pitch: <strong className="text-[#38BDF8] font-mono-num">{windTunnelState.rocketPitch || 0}°</strong></span>
        <span>Wind Vector: <strong className="text-[#34D399] font-mono-num">{windTunnelState.windAngle || 0}°</strong></span>
        <span>AoA (α): <strong className="text-[#FBBF24] font-mono-num">{(windTunnelState.windAngle || 0) - (windTunnelState.rocketPitch || 0)}°</strong></span>
        <span>Freestream: <strong className="text-[#E8EDF2] font-mono-num">{Math.round(windTunnelState.freestreamSpeed)} m/s</strong></span>
      </div>

      <ExportReportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        canvasRef={canvasRef}
      />
    </div>
  );
};
