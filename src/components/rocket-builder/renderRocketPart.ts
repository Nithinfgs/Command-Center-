import type { PartDefinition, PlacedPart } from '../../types';

interface RenderPartOptions {
  ctx: CanvasRenderingContext2D;
  part: PlacedPart;
  def: PartDefinition;
  pw: number;
  ph: number;
  zoom: number;
  isSelected?: boolean;
  isHovered?: boolean;
  customSurfaceStyle?: string | CanvasGradient;
  isWindTunnel?: boolean;
}

/**
 * High-fidelity aerospace engineering part renderer.
 * Produces crisp, CAD-accurate visuals for all 25+ vehicle modules.
 */
export function drawAerospacePart(options: RenderPartOptions): void {
  const { ctx, part, def, pw, ph, zoom, isSelected, isHovered, customSurfaceStyle } = options;

  // Base metallic cylindrical gradient
  const createMetallicGrad = (baseColor: string = def.color) => {
    const grad = ctx.createLinearGradient(-pw / 2, 0, pw / 2, 0);
    grad.addColorStop(0, '#0F172A');
    grad.addColorStop(0.18, '#1E293B');
    grad.addColorStop(0.35, baseColor);
    grad.addColorStop(0.55, '#FFFFFF');
    grad.addColorStop(0.72, baseColor);
    grad.addColorStop(0.88, '#1E293B');
    grad.addColorStop(1, '#0F172A');
    return grad;
  };

  const isFin = def.texturePattern === 'fin';
  const isRightSide = part.x > 0;

  // 1. COMMAND MODULES & CAPSULES
  if (def.category === 'command') {
    if (def.type === 'pod_mk1') {
      // Re-entry Conical Capsule
      const capGrad = customSurfaceStyle || createMetallicGrad('#CBD5E1');
      ctx.fillStyle = capGrad;
      ctx.beginPath();
      ctx.moveTo(-pw / 2, ph / 2);
      ctx.lineTo(-pw * 0.22, -ph / 2);
      ctx.lineTo(pw * 0.22, -ph / 2);
      ctx.lineTo(pw / 2, ph / 2);
      ctx.closePath();
      ctx.fill();

      // PICA-X Ablative Heat Shield Base
      ctx.fillStyle = '#1E293B';
      ctx.beginPath();
      ctx.ellipse(0, ph / 2 - 1, pw / 2, 3.5 * zoom, 0, 0, Math.PI * 2);
      ctx.fill();

      // Top docking collar
      ctx.fillStyle = '#475569';
      ctx.fillRect(-pw * 0.2, -ph / 2 - 2, pw * 0.4, 3);

      // Crew Viewport Window
      ctx.fillStyle = '#38BDF8';
      ctx.beginPath();
      ctx.arc(0, -ph * 0.08, Math.max(3, 4 * zoom), 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1;
      ctx.stroke();

      // RCS Thruster Blisters
      ctx.fillStyle = '#64748B';
      ctx.fillRect(-pw * 0.38, 0, 3, 4);
      ctx.fillRect(pw * 0.38 - 3, 0, 3, 4);

    } else if (def.type === 'crew_heavy') {
      // Heavy Habitat / Orion-style Module
      const modGrad = customSurfaceStyle || createMetallicGrad('#94A3B8');
      ctx.fillStyle = modGrad;
      ctx.beginPath();
      ctx.moveTo(-pw / 2, ph / 2);
      ctx.lineTo(-pw * 0.35, -ph / 2);
      ctx.lineTo(pw * 0.35, -ph / 2);
      ctx.lineTo(pw / 2, ph / 2);
      ctx.closePath();
      ctx.fill();

      // Multiple Crew Viewports
      ctx.fillStyle = '#38BDF8';
      [-pw * 0.15, 0, pw * 0.15].forEach(wx => {
        ctx.beginPath();
        ctx.arc(wx, -ph * 0.1, 3.5 * zoom, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#E2E8F0';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      });

      // Structural end rings
      ctx.fillStyle = '#334155';
      ctx.fillRect(-pw / 2, ph / 2 - 3, pw, 3);
      ctx.fillRect(-pw * 0.35, -ph / 2, pw * 0.7, 3);

    } else {
      // Octagonal Probe Avionics Bus
      ctx.fillStyle = customSurfaceStyle || '#F59E0B';
      ctx.beginPath();
      ctx.moveTo(-pw * 0.3, -ph / 2);
      ctx.lineTo(pw * 0.3, -ph / 2);
      ctx.lineTo(pw / 2, 0);
      ctx.lineTo(pw * 0.3, ph / 2);
      ctx.lineTo(-pw * 0.3, ph / 2);
      ctx.lineTo(-pw / 2, 0);
      ctx.closePath();
      ctx.fill();

      // Gold MLI foil crosshatch
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.lineWidth = 1;
      ctx.strokeRect(-pw * 0.3, -ph * 0.3, pw * 0.6, ph * 0.6);

      // Optics sensor eye
      ctx.fillStyle = '#38BDF8';
      ctx.beginPath();
      ctx.arc(0, 0, 3 * zoom, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = isSelected ? '#38BDF8' : isHovered ? '#94A3B8' : '#263548';
    ctx.lineWidth = isSelected ? 2 : 1.2;
    ctx.stroke();

  // 2. ENGINES & PROPULSION
  } else if (def.category === 'engine') {
    // Turbopump / Gimbal Powerhead Dome
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(-pw * 0.35, -ph / 2, pw * 0.7, ph * 0.3);

    // High pressure propellant feed pipes
    ctx.strokeStyle = '#FBBF24';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-pw * 0.25, -ph / 2 + 2);
    ctx.lineTo(-pw * 0.25, -ph / 2 + ph * 0.35);
    ctx.moveTo(pw * 0.25, -ph / 2 + 2);
    ctx.lineTo(pw * 0.25, -ph / 2 + ph * 0.35);
    ctx.stroke();

    // Gimbal Actuator Ring
    ctx.fillStyle = '#475569';
    ctx.fillRect(-pw * 0.25, -ph / 2 + ph * 0.25, pw * 0.5, ph * 0.1);

    if (def.type === 'engine_cluster_quad') {
      // 4-Nozzle Heavy Cluster Puck
      const bellW = pw * 0.42;
      [-pw * 0.24, pw * 0.24].forEach(bx => {
        const bellGrad = ctx.createLinearGradient(bx - bellW / 2, 0, bx + bellW / 2, 0);
        bellGrad.addColorStop(0, '#0F172A');
        bellGrad.addColorStop(0.3, '#334155');
        bellGrad.addColorStop(0.7, '#334155');
        bellGrad.addColorStop(1, '#0F172A');

        ctx.fillStyle = bellGrad;
        ctx.beginPath();
        ctx.moveTo(bx - bellW * 0.2, -ph / 2 + ph * 0.4);
        ctx.lineTo(bx + bellW * 0.2, -ph / 2 + ph * 0.4);
        ctx.lineTo(bx + bellW / 2, ph / 2);
        ctx.lineTo(bx - bellW / 2, ph / 2);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Circumferential hat-band rings
        ctx.strokeStyle = '#64748B';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(bx - bellW * 0.38, ph / 2 - 4);
        ctx.lineTo(bx + bellW * 0.38, ph / 2 - 4);
        ctx.stroke();
      });
    } else {
      // Single High-Expansion / Sea-Level Bell
      const bellGrad = ctx.createLinearGradient(-pw / 2, 0, pw / 2, 0);
      bellGrad.addColorStop(0, '#0F172A');
      bellGrad.addColorStop(0.25, def.color || '#334155');
      bellGrad.addColorStop(0.55, '#475569');
      bellGrad.addColorStop(0.75, def.color || '#334155');
      bellGrad.addColorStop(1, '#0F172A');

      ctx.fillStyle = bellGrad;
      ctx.beginPath();
      const throatW = def.type === 'engine_vacuum_expand' ? pw * 0.18 : pw * 0.25;
      ctx.moveTo(-throatW, -ph / 2 + ph * 0.35);
      ctx.lineTo(throatW, -ph / 2 + ph * 0.35);
      ctx.lineTo(pw / 2, ph / 2);
      ctx.lineTo(-pw / 2, ph / 2);
      ctx.closePath();
      ctx.fill();

      // Nozzle Throat Hot Zone
      ctx.fillStyle = '#F43F5E';
      ctx.fillRect(-throatW * 0.8, -ph / 2 + ph * 0.35, throatW * 1.6, 2.5 * zoom);

      // Stiffening hat-bands
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1;
      [0.6, 0.8].forEach(hFrac => {
        const yLine = -ph / 2 + ph * hFrac;
        const wLine = pw * (hFrac * 0.8);
        ctx.beginPath();
        ctx.moveTo(-wLine / 2, yLine);
        ctx.lineTo(wLine / 2, yLine);
        ctx.stroke();
      });
    }

    ctx.strokeStyle = isSelected ? '#38BDF8' : isHovered ? '#94A3B8' : '#263548';
    ctx.lineWidth = isSelected ? 2 : 1;
    ctx.strokeRect(-pw * 0.35, -ph / 2, pw * 0.7, ph * 0.3);

  // 3. AERODYNAMICS, NOSECONES & FINS
  } else if (def.category === 'aerodynamics') {
    if (def.texturePattern === 'cone') {
      // Parabolic Ogive Nose Fairing
      const coneGrad = customSurfaceStyle || createMetallicGrad(def.color || '#F1F5F9');
      ctx.fillStyle = coneGrad;
      ctx.beginPath();

      if (def.type === 'nosecone_slant_left') {
        ctx.moveTo(-pw / 2, ph / 2);
        ctx.lineTo(pw / 2, ph / 2);
        ctx.lineTo(pw / 2, -ph / 2);
      } else if (def.type === 'nosecone_slant_right') {
        ctx.moveTo(-pw / 2, ph / 2);
        ctx.lineTo(pw / 2, ph / 2);
        ctx.lineTo(-pw / 2, -ph / 2);
      } else {
        ctx.moveTo(-pw / 2, ph / 2);
        ctx.quadraticCurveTo(0, -ph / 2 - 10 * zoom, pw / 2, ph / 2);
      }
      ctx.closePath();
      ctx.fill();

      // Pitot Static Tip Probe
      ctx.strokeStyle = '#94A3B8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, -ph / 2 - 1);
      ctx.lineTo(0, -ph / 2 - 8 * zoom);
      ctx.stroke();

      // Transverse panel lines
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-pw * 0.35, ph * 0.1);
      ctx.lineTo(pw * 0.35, ph * 0.1);
      ctx.stroke();

      ctx.strokeStyle = isSelected ? '#38BDF8' : isHovered ? '#94A3B8' : '#263548';
      ctx.lineWidth = isSelected ? 2 : 1.2;
      ctx.stroke();

    } else if (isFin) {
      // Swept Delta Stabilizer / Grid Fin
      ctx.fillStyle = customSurfaceStyle || def.color;
      ctx.beginPath();
      if (isRightSide) {
        // Right fin: attached at root left (-pw/2), tip at right (+pw/2)
        ctx.moveTo(-pw / 2, -ph / 2);
        ctx.lineTo(pw / 2, ph * 0.2);
        ctx.lineTo(pw / 2, ph / 2);
        ctx.lineTo(-pw / 2, ph / 2);
      } else {
        // Left fin: attached at root right (+pw/2), tip at left (-pw/2)
        ctx.moveTo(pw / 2, -ph / 2);
        ctx.lineTo(-pw / 2, ph * 0.2);
        ctx.lineTo(-pw / 2, ph / 2);
        ctx.lineTo(pw / 2, ph / 2);
      }
      ctx.closePath();
      ctx.fill();

      // Aerodynamic Beveled Leading Edge
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      if (isRightSide) {
        ctx.moveTo(-pw / 2, -ph / 2);
        ctx.lineTo(pw / 2, ph * 0.2);
      } else {
        ctx.moveTo(pw / 2, -ph / 2);
        ctx.lineTo(-pw / 2, ph * 0.2);
      }
      ctx.stroke();

      // Grid fin crosshatch mesh (if titanium grid fin)
      if (def.type === 'fin_grid_titanium') {
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1;
        for (let gx = -pw * 0.3; gx <= pw * 0.3; gx += 4) {
          ctx.beginPath();
          ctx.moveTo(gx, -ph * 0.3);
          ctx.lineTo(gx, ph * 0.3);
          ctx.stroke();
        }
      }

      ctx.strokeStyle = isSelected ? '#38BDF8' : isHovered ? '#94A3B8' : '#263548';
      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.stroke();

    } else if (def.type === 'heatshield_2m') {
      // Ablative PICA-X Thermal Shield Bowl
      ctx.fillStyle = '#0F172A';
      ctx.beginPath();
      ctx.moveTo(-pw / 2, -ph / 2);
      ctx.quadraticCurveTo(0, ph / 2 + 4, pw / 2, -ph / 2);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = isSelected ? '#38BDF8' : '#334155';
      ctx.lineWidth = isSelected ? 2 : 1.5;
      ctx.stroke();
    }

  // 4. FUEL TANKS & PROPELLANT MODULES
  } else if (def.category === 'fuel') {
    const isFoamOrange = def.type === 'tank_heavy_4m';
    const tankGrad = customSurfaceStyle || (isFoamOrange 
      ? createMetallicGrad('#D97706')
      : createMetallicGrad(def.color || '#E2E8F0'));

    ctx.fillStyle = tankGrad;
    ctx.fillRect(-pw / 2, -ph / 2, pw, ph);

    // Circumferential Weld Seams / Ribs
    ctx.strokeStyle = isFoamOrange ? 'rgba(180, 83, 9, 0.6)' : 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 1;
    const ribCount = Math.max(2, Math.floor(def.height * 1.5));
    for (let r = 1; r < ribCount; r++) {
      const ry = -ph / 2 + (r * ph) / ribCount;
      ctx.beginPath();
      ctx.moveTo(-pw / 2, ry);
      ctx.lineTo(pw / 2, ry);
      ctx.stroke();
    }

    // LOX / Liquid Methane External Feedline Conduit
    ctx.fillStyle = '#475569';
    ctx.fillRect(pw * 0.32, -ph / 2, pw * 0.08, ph);
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 0.8;
    ctx.strokeRect(pw * 0.32, -ph / 2, pw * 0.08, ph);

    // Roll-Alignment Black/White Quarter Markings
    if (def.height >= 4) {
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(-pw / 2, -ph / 2, pw * 0.15, 6);
      ctx.fillRect(pw * 0.35, -ph / 2, pw * 0.15, 6);
    }

    // Interstage top & bottom structural end-rings
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(-pw / 2, -ph / 2, pw, 2.5);
    ctx.fillRect(-pw / 2, ph / 2 - 2.5, pw, 2.5);

    ctx.strokeStyle = isSelected ? '#38BDF8' : isHovered ? '#94A3B8' : '#263548';
    ctx.lineWidth = isSelected ? 2 : 1;
    ctx.strokeRect(-pw / 2, -ph / 2, pw, ph);

  // 5. STAGING, DECOUPLERS & STRUCTURAL RINGS
  } else if (def.category === 'staging') {
    // Decoupler Ring Body
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(-pw / 2, -ph / 2, pw, ph);

    // Yellow & Black Diagonal Explosive Hazard Stripes
    const stripeW = 6;
    for (let sx = -pw / 2 - ph; sx < pw / 2 + ph; sx += stripeW * 2) {
      ctx.fillStyle = '#FBBF24';
      ctx.beginPath();
      ctx.moveTo(sx, -ph / 2);
      ctx.lineTo(sx + stripeW, -ph / 2);
      ctx.lineTo(sx + stripeW - ph, ph / 2);
      ctx.lineTo(sx - ph, ph / 2);
      ctx.closePath();
      ctx.fill();
    }

    // Outer clamp collar
    ctx.strokeStyle = isSelected ? '#38BDF8' : '#475569';
    ctx.lineWidth = isSelected ? 2 : 1.2;
    ctx.strokeRect(-pw / 2, -ph / 2, pw, ph);

  // 6. UTILITY, SOLAR & GEAR
  } else {
    if (def.type === 'solar_array_gigantor') {
      // Photovoltaic Deep-Blue Crystalline Solar Panel
      ctx.fillStyle = '#1E3A8A';
      ctx.fillRect(-pw / 2, -ph / 2, pw, ph);

      // Gold Busbar Gridlines
      ctx.strokeStyle = '#FBBF24';
      ctx.lineWidth = 1;
      const cols = 4;
      const rows = 6;
      for (let c = 1; c < cols; c++) {
        ctx.beginPath();
        ctx.moveTo(-pw / 2 + (c * pw) / cols, -ph / 2);
        ctx.lineTo(-pw / 2 + (c * pw) / cols, ph / 2);
        ctx.stroke();
      }
      for (let r = 1; r < rows; r++) {
        ctx.beginPath();
        ctx.moveTo(-pw / 2, -ph / 2 + (r * ph) / rows);
        ctx.lineTo(pw / 2, -ph / 2 + (r * ph) / rows);
        ctx.stroke();
      }
    } else if (def.type === 'landing_leg_heavy') {
      // Articulated Hydraulic Oleo Landing Strut
      ctx.fillStyle = '#334155';
      ctx.fillRect(-pw * 0.2, -ph / 2, pw * 0.4, ph * 0.7);

      // Hydraulic piston arm
      ctx.strokeStyle = '#CBD5E1';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(isRightSide ? pw * 0.4 : -pw * 0.4, ph / 2);
      ctx.stroke();

      // Footpad
      ctx.fillStyle = '#1E293B';
      ctx.fillRect(isRightSide ? pw * 0.25 : -pw * 0.45, ph / 2 - 2, pw * 0.2, 4);
    } else {
      ctx.fillStyle = customSurfaceStyle || createMetallicGrad(def.color);
      ctx.fillRect(-pw / 2, -ph / 2, pw, ph);
    }

    ctx.strokeStyle = isSelected ? '#38BDF8' : isHovered ? '#94A3B8' : '#263548';
    ctx.lineWidth = isSelected ? 2 : 1;
    ctx.strokeRect(-pw / 2, -ph / 2, pw, ph);
  }
}
