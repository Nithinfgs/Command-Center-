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

      // Subtle boundary walls
      ctx.fillStyle = '#121A26';
      ctx.fillRect(0, 0, width, 20);
      ctx.fillRect(0, height - 20, width, 20);
      ctx.strokeStyle = '#1C2938';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, 0, width, 20);
      ctx.strokeRect(0, height - 20, width, 20);

      // Subtle engineering grid
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
      const relativeAoARad = windAngleRad - rocketPitchRad;

      const mach = windTunnelState.mach;

      const noseTipOffset = (vehicleGeometry.noseY - vehicleGeometry.centerY) * cellSize;
      const tailOffset = (vehicleGeometry.tailY - vehicleGeometry.centerY) * cellSize;

      const noseWorldX = rocketX - Math.abs(noseTipOffset) * Math.cos(rocketPitchRad);
      const noseWorldY = rocketY - Math.abs(noseTipOffset) * Math.sin(rocketPitchRad);

      const speedPx = 280 + mach * 120;
      animPulseOffset += dt * speedPx;

      // Exact body hull profile function R(x_b)
      const getBodyRadius = (xb: number): { rUpper: number; rLower: number; dR: number } => {
        if (xb < noseTipOffset) {
          const dist = noseTipOffset - xb;
          const noseR = 12;
          const taper = Math.max(0, 1 - dist / 28);
          const r = noseR * Math.sqrt(taper);
          return { rUpper: r, rLower: r, dR: 0.5 };
        }
        if (xb > tailOffset) {
          const dist = xb - tailOffset;
          const tailR = 20;
          const taper = Math.max(0, 1 - dist / 150);
          const r = tailR * Math.pow(taper, 1.3);
          return { rUpper: r, rLower: r, dR: -0.2 };
        }

        const gridY = vehicleGeometry.centerY + xb / cellSize;
        let maxUpper = 14;
        let maxLower = 14;

        for (const p of vehicleGeometry.parts) {
          const def = p.def;
          if (!def) continue;

          const partMinY = p.y - p.hh;
          const partMaxY = p.y + p.hh;

          if (gridY >= partMinY - 0.15 && gridY <= partMaxY + 0.15) {
            const normY = Math.max(0, Math.min(1, (gridY - partMinY) / (def.height || 1)));
            let widthPx = def.width * cellSize;

            if (def.texturePattern === 'cone') {
              widthPx = (def.width * cellSize) * Math.sqrt(normY);
            } else if (def.texturePattern === 'fin') {
              widthPx = (def.width * cellSize) * (0.3 + 0.7 * normY);
            } else if (def.texturePattern === 'engine-bell') {
              widthPx = (def.width * cellSize) * (0.6 + 0.4 * normY);
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

      // Flow Velocity Calculation (Stable Freestream Inflow + Body Interaction)
      const getFlowVelocityAt = (wx: number, wy: number): { u: number; v: number; speedNorm: number; tempK: number; cp: number; machLocal: number } => {
        // Base incoming freestream vector from windAngle
        let u = Math.cos(windAngleRad);
        let v = Math.sin(windAngleRad);

        const dx = wx - rocketX;
        const dy = wy - rocketY;

        // Transform into vehicle body frame aligned with rocketPitch
        const xb = dx * Math.cos(-rocketPitchRad) - dy * Math.sin(-rocketPitchRad);
        const yb = dx * Math.sin(-rocketPitchRad) + dy * Math.cos(-rocketPitchRad);

        const profile = getBodyRadius(xb);
        const isUpper = yb >= 0;
        const bodyR = isUpper ? profile.rUpper : profile.rLower;
        const distFromAxis = Math.abs(yb);
        const distFromSurface = distFromAxis - bodyR;

        let speedFactor = 1.0;
        let tempK = windTunnelState.airTemperature;
        let bodyDeflectNorm = 0;
        let cpLocal = 0;

        const relAoASin = Math.sin(relativeAoARad);
        const aoaEffect = Math.abs(relAoASin) * (yb < 0 ? 1 : -1) * Math.sign(relAoASin || 1);

        if (xb < noseTipOffset) {
          // Flow approaching nose tip
          const distToNose = Math.hypot(xb - noseTipOffset, yb);
          const noseInfluenceRadius = 45;

          if (distToNose < noseInfluenceRadius) {
            const frac = 1 - distToNose / noseInfluenceRadius;
            const pushDir = yb >= 0 ? 1 : -1;

            speedFactor *= Math.max(0.15, 1 - Math.pow(frac, 1.2) * 0.85);
            tempK = windTunnelState.airTemperature + (aero.stagnationTemperature - windTunnelState.airTemperature) * Math.pow(frac, 1.4);
            cpLocal = Math.pow(frac, 1.2);

            bodyDeflectNorm += pushDir * Math.pow(frac, 1.3) * 0.75;
          }
        } else if (xb >= noseTipOffset && xb <= tailOffset) {
          // Flow along fuselage boundary layer
          const influenceRange = 75;
          if (distFromSurface < influenceRange) {
            const normDist = Math.max(0, distFromSurface / influenceRange);
            const wallProximity = Math.exp(-normDist * 2.8);
            const pushDir = yb >= 0 ? 1 : -1;

            bodyDeflectNorm += pushDir * (profile.dR * 0.45 * wallProximity);

            const shoulderDist = Math.abs(xb - noseTipOffset);
            if (shoulderDist < 30) {
              speedFactor *= (1.0 + (1 - shoulderDist / 30) * 0.25 * wallProximity);
              cpLocal = -0.35 * (1 - shoulderDist / 30) * wallProximity;
            } else {
              speedFactor *= (1.0 + wallProximity * 0.08);
              cpLocal = 0.02 * wallProximity;
            }

            if (Math.abs(relAoASin) > 0.001) {
              const aoaPressureShift = aoaEffect * 0.75 * wallProximity;
              cpLocal += aoaPressureShift;
              speedFactor *= (1.0 - aoaPressureShift * 0.2);
            }

            const boundaryLayerTemp = windTunnelState.airTemperature + (aero.stagnationTemperature - windTunnelState.airTemperature) * 0.65 * wallProximity;
            tempK = Math.max(tempK, boundaryLayerTemp + (aoaEffect > 0 ? aoaEffect * 80 : 0));

            if (windTunnelState.finDeflectionAngle !== 0 && xb > tailOffset - 45) {
              const finRad = (windTunnelState.finDeflectionAngle * Math.PI) / 180;
              bodyDeflectNorm += Math.sin(finRad) * wallProximity * 0.8;
              cpLocal += Math.sin(finRad) * 0.4 * wallProximity;
            }
          }
        } else {
          // Base wake & recirculation
          const wakeDist = xb - tailOffset;
          if (wakeDist < 200 && distFromAxis < bodyR + wakeDist * 0.25) {
            const wakeDecay = Math.max(0, 1 - wakeDist / 200);
            const vortexFreq = time * 0.008 + wakeDist * 0.035;
            const vortexSign = yb >= 0 ? 1 : -1;

            bodyDeflectNorm += Math.sin(vortexFreq) * 0.3 * wakeDecay * vortexSign;
            speedFactor *= (0.75 + 0.25 * (1 - wakeDecay));
            cpLocal = -0.35 * wakeDecay;
          }
        }

        // Supersonic Shock Front Interaction
        if (mach >= 1.0) {
          const shockAngleRad = (aero.shockwaveAngle * Math.PI) / 180;
          const standOff = Math.max(6, 20 / Math.pow(mach, 0.75));
          const shockFrontX = (noseWorldX - standOff * Math.cos(windAngleRad)) + Math.abs(wy - noseWorldY) / Math.tan(shockAngleRad);

          if (wx >= shockFrontX - 6 && wx <= shockFrontX + 12) {
            speedFactor *= 0.8;
            tempK = Math.max(tempK, windTunnelState.airTemperature + (mach - 1) * 110);
            cpLocal = Math.max(cpLocal, 0.55);
          }
        }

        // Combine freestream vector with body deflection
        const uDeflected = u * speedFactor - bodyDeflectNorm * Math.sin(rocketPitchRad);
        const vDeflected = v * speedFactor + bodyDeflectNorm * Math.cos(rocketPitchRad);

        const speedMag = Math.hypot(uDeflected, vDeflected);
        const speedNorm = Math.min(1, Math.max(0, (speedMag - 0.25) / 1.35));
        const localMach = mach * speedMag;

        return {
          u: uDeflected,
          v: vDeflected,
          speedNorm,
          tempK,
          cp: cpLocal,
          machLocal: localMach
        };
      };

      // 48 Continuous Flow Streamlines from the Wind Tunnel Inlet
      const NUM_STREAMLINES = 48;
      const rakeTop = 26;
      const rakeBottom = height - 26;
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

      // Draw Supersonic Bow Shock
      if (mach >= 1.0) {
        ctx.save();
        const shockAngleRad = (aero.shockwaveAngle * Math.PI) / 180;
        const standOffDist = Math.max(6, 20 / Math.pow(mach, 0.75));

        const shockApexX = noseWorldX - standOffDist * Math.cos(windAngleRad);
        const shockApexY = noseWorldY - standOffDist * Math.sin(windAngleRad);

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

      // RENDER ROCKET IN CONTROLLED PITCH ATTITUDE
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

          ctx.fillStyle = partSurfaceGrad;
          ctx.beginPath();
          ctx.moveTo(-pw / 2, -ph / 2);
          ctx.lineTo(pw / 2, 0);
          ctx.lineTo(pw / 2, ph / 2);
          ctx.lineTo(-pw / 2, ph / 2);
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

      // Force Vectors (Drag parallel to wind, Lift perpendicular to wind)
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
          <span className="text-[10px] text-[#38BDF8] bg-[#38BDF8]/10 px-2 py-0.5 rounded font-medium capitalize">
            {windTunnelState.visualizationMode}
          </span>
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
    </div>
  );
};
