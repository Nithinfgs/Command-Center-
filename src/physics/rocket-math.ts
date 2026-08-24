import type { PartDefinition, PlacedPart, RocketAeroProperties, RocketBlueprint, SymmetryMode } from '../types';

export const GRID_CELL_SIZE = 20;

export const PARTS_CATALOG: Record<string, PartDefinition> = {
  'pod_mk1': {
    type: 'pod_mk1',
    category: 'command',
    name: 'Mk1 Command Capsule',
    description: 'Single-occupant aerodynamic re-entry capsule with integrated reaction wheels and telemetry avionics.',
    width: 2,
    height: 2,
    dryMass: 1.2,
    fuelMass: 0.1,
    dragCoeff: 0.28,
    heatTolerance: 2400,
    color: '#cbd5e1',
    texturePattern: 'cone',
    connectionPoints: [
      { id: 'top', type: 'top', x: 0, y: -1 },
      { id: 'bottom', type: 'bottom', x: 0, y: 1 }
    ]
  },
  'crew_heavy': {
    type: 'crew_heavy',
    category: 'command',
    name: 'Titan Heavy Crew Module',
    description: 'Heavy 5m command section with reinforced titanium heat shielding and deep space avionics bus.',
    width: 4,
    height: 3,
    dryMass: 4.5,
    fuelMass: 0.5,
    dragCoeff: 0.32,
    heatTolerance: 3000,
    color: '#94a3b8',
    texturePattern: 'cone',
    connectionPoints: [
      { id: 'top', type: 'top', x: 0, y: -1.5 },
      { id: 'bottom', type: 'bottom', x: 0, y: 1.5 },
      { id: 'left', type: 'left', x: -2, y: 0 },
      { id: 'right', type: 'right', x: 2, y: 0 }
    ]
  },
  'probe_core_hex': {
    type: 'probe_core_hex',
    category: 'command',
    name: 'Hex Autonomous Avionics Core',
    description: 'Ultra-lightweight autonomous guidance computer for unmanned payloads and upper stages.',
    width: 2,
    height: 1,
    dryMass: 0.3,
    fuelMass: 0,
    dragCoeff: 0.22,
    heatTolerance: 1800,
    color: '#64748b',
    texturePattern: 'tiled',
    connectionPoints: [
      { id: 'top', type: 'top', x: 0, y: -0.5 },
      { id: 'bottom', type: 'bottom', x: 0, y: 0.5 }
    ]
  },
  'tank_small_2m': {
    type: 'tank_small_2m',
    category: 'fuel',
    name: 'Kerolox Tank T-200 (2m)',
    description: 'Standard 2-meter diameter pressurized propellant tank for light upper stages.',
    width: 2,
    height: 3,
    dryMass: 0.5,
    fuelMass: 4.5,
    dragCoeff: 0.15,
    heatTolerance: 1600,
    color: '#e2e8f0',
    texturePattern: 'ribbed',
    connectionPoints: [
      { id: 'top', type: 'top', x: 0, y: -1.5 },
      { id: 'bottom', type: 'bottom', x: 0, y: 1.5 },
      { id: 'left', type: 'left', x: -1, y: 0 },
      { id: 'right', type: 'right', x: 1, y: 0 }
    ]
  },
  'tank_med_2m': {
    type: 'tank_med_2m',
    category: 'fuel',
    name: 'Kerolox Tank T-400 (2m)',
    description: 'Extended 2m medium propellant tank with internal slosh baffles.',
    width: 2,
    height: 6,
    dryMass: 1.0,
    fuelMass: 9.0,
    dragCoeff: 0.16,
    heatTolerance: 1600,
    color: '#e2e8f0',
    texturePattern: 'ribbed',
    connectionPoints: [
      { id: 'top', type: 'top', x: 0, y: -3 },
      { id: 'bottom', type: 'bottom', x: 0, y: 3 },
      { id: 'left', type: 'left', x: -1, y: 0 },
      { id: 'right', type: 'right', x: 1, y: 0 }
    ]
  },
  'tank_heavy_4m': {
    type: 'tank_heavy_4m',
    category: 'fuel',
    name: 'Heavy Core Tank (4m)',
    description: 'Heavy 4-meter diameter cryogenic main stage propellant tank for booster cores.',
    width: 4,
    height: 8,
    dryMass: 3.2,
    fuelMass: 28.0,
    dragCoeff: 0.18,
    heatTolerance: 1700,
    color: '#f1f5f9',
    texturePattern: 'ribbed',
    connectionPoints: [
      { id: 'top', type: 'top', x: 0, y: -4 },
      { id: 'bottom', type: 'bottom', x: 0, y: 4 },
      { id: 'left', type: 'left', x: -2, y: 0 },
      { id: 'right', type: 'right', x: 2, y: 0 }
    ]
  },
  'tank_titan_4m': {
    type: 'tank_titan_4m',
    category: 'fuel',
    name: 'Titan Core Booster Tank (4m)',
    description: 'Super-tall 4-meter booster stage core for heavy orbital lift systems.',
    width: 4,
    height: 10,
    dryMass: 4.5,
    fuelMass: 42.0,
    dragCoeff: 0.20,
    heatTolerance: 1800,
    color: '#f8fafc',
    texturePattern: 'ribbed',
    connectionPoints: [
      { id: 'top', type: 'top', x: 0, y: -5 },
      { id: 'bottom', type: 'bottom', x: 0, y: 5 },
      { id: 'left', type: 'left', x: -2, y: 0 },
      { id: 'right', type: 'right', x: 2, y: 0 }
    ]
  },
  'engine_merlin': {
    type: 'engine_merlin',
    category: 'engine',
    name: 'Vortex-1D Kerolox Engine',
    description: 'High thrust-to-weight ratio gas-generator cycle engine for booster and core stages.',
    width: 2,
    height: 2,
    dryMass: 0.65,
    fuelMass: 0,
    thrust: 850,
    seaLevelThrust: 760,
    ispVac: 311,
    ispAtm: 282,
    dragCoeff: 0.35,
    heatTolerance: 2800,
    gimbalAngle: 5,
    color: '#475569',
    texturePattern: 'engine-bell',
    connectionPoints: [
      { id: 'top', type: 'top', x: 0, y: -1 }
    ]
  },
  'engine_raptor': {
    type: 'engine_raptor',
    category: 'engine',
    name: 'Apex Full-Flow Methalox Engine',
    description: 'Advanced full-flow staged combustion engine with extreme chamber pressure and vacuum Isp.',
    width: 2,
    height: 3,
    dryMass: 1.5,
    fuelMass: 0,
    thrust: 2200,
    seaLevelThrust: 2000,
    ispVac: 363,
    ispAtm: 330,
    dragCoeff: 0.38,
    heatTolerance: 3300,
    gimbalAngle: 8,
    color: '#334155',
    texturePattern: 'engine-bell',
    connectionPoints: [
      { id: 'top', type: 'top', x: 0, y: -1.5 }
    ]
  },
  'engine_vacuum_expand': {
    type: 'engine_vacuum_expand',
    category: 'engine',
    name: 'Nebula Vacuum Hydrolox Engine',
    description: 'High-expansion vacuum nozzle optimized for orbital transfer and lunar excursion burns.',
    width: 2,
    height: 2.5,
    dryMass: 0.45,
    fuelMass: 0,
    thrust: 110,
    seaLevelThrust: 35,
    ispVac: 452,
    ispAtm: 180,
    dragCoeff: 0.42,
    heatTolerance: 2200,
    gimbalAngle: 4,
    color: '#64748b',
    texturePattern: 'engine-bell',
    connectionPoints: [
      { id: 'top', type: 'top', x: 0, y: -1.25 }
    ]
  },
  'engine_cluster_quad': {
    type: 'engine_cluster_quad',
    category: 'engine',
    name: 'Titan Quad Heavy Engine Cluster',
    description: '4x clustered heavy booster engines for super-heavy orbital payload liftoff.',
    width: 4,
    height: 3,
    dryMass: 4.2,
    fuelMass: 0,
    thrust: 6800,
    seaLevelThrust: 6100,
    ispVac: 320,
    ispAtm: 290,
    dragCoeff: 0.48,
    heatTolerance: 3400,
    gimbalAngle: 6,
    color: '#1e293b',
    texturePattern: 'engine-bell',
    connectionPoints: [
      { id: 'top', type: 'top', x: 0, y: -1.5 }
    ]
  },
  'srb_heavy': {
    type: 'srb_heavy',
    category: 'engine',
    name: 'Castor Solid Rocket Booster',
    description: 'Strap-on high-thrust solid booster providing intense liftoff impulse during maximum dynamic pressure.',
    width: 2,
    height: 8,
    dryMass: 3.5,
    fuelMass: 22.0,
    thrust: 3400,
    seaLevelThrust: 3100,
    ispVac: 268,
    ispAtm: 242,
    dragCoeff: 0.22,
    heatTolerance: 2600,
    color: '#e2e8f0',
    texturePattern: 'ribbed',
    connectionPoints: [
      { id: 'radial', type: 'radial', x: 0, y: 0 },
      { id: 'top', type: 'top', x: 0, y: -4 }
    ]
  },
  'decoupler_stack_2m': {
    type: 'decoupler_stack_2m',
    category: 'staging',
    name: 'Pneumatic Stack Decoupler (2m)',
    description: 'Pneumatically-actuated 2m interstage separation ring with redundant explosive bolts.',
    width: 2,
    height: 1,
    dryMass: 0.15,
    fuelMass: 0,
    dragCoeff: 0.12,
    heatTolerance: 2000,
    color: '#eab308',
    texturePattern: 'tiled',
    connectionPoints: [
      { id: 'top', type: 'top', x: 0, y: -0.5 },
      { id: 'bottom', type: 'bottom', x: 0, y: 0.5 }
    ]
  },
  'decoupler_stack_4m': {
    type: 'decoupler_stack_4m',
    category: 'staging',
    name: 'Heavy Stage Decoupler (4m)',
    description: 'Heavy 4m pneumatic interstage ring for primary booster separation.',
    width: 4,
    height: 1,
    dryMass: 0.4,
    fuelMass: 0,
    dragCoeff: 0.14,
    heatTolerance: 2200,
    color: '#eab308',
    texturePattern: 'tiled',
    connectionPoints: [
      { id: 'top', type: 'top', x: 0, y: -0.5 },
      { id: 'bottom', type: 'bottom', x: 0, y: 0.5 }
    ]
  },
  'decoupler_radial': {
    type: 'decoupler_radial',
    category: 'staging',
    name: 'Hydraulic Radial Decoupler',
    description: 'Outward-pushing hydraulic piston bracket for side booster jettison.',
    width: 1,
    height: 2,
    dryMass: 0.08,
    fuelMass: 0,
    dragCoeff: 0.18,
    heatTolerance: 1900,
    color: '#ca8a04',
    texturePattern: 'smooth',
    connectionPoints: [
      { id: 'left', type: 'left', x: -0.5, y: 0 },
      { id: 'right', type: 'right', x: 0.5, y: 0 }
    ]
  },
  'nosecone_2m': {
    type: 'nosecone_2m',
    category: 'aerodynamics',
    name: 'Aerodynamic Ogive Nose Cone (2m)',
    description: 'Low-drag ogive fairing tip minimizing transonic wave drag and shock wave detachment.',
    width: 2,
    height: 2,
    dryMass: 0.2,
    fuelMass: 0,
    dragCoeff: 0.06,
    heatTolerance: 2400,
    color: '#f8fafc',
    texturePattern: 'cone',
    connectionPoints: [
      { id: 'bottom', type: 'bottom', x: 0, y: 1 }
    ]
  },
  'nosecone_slant_left': {
    type: 'nosecone_slant_left',
    category: 'aerodynamics',
    name: 'Slanted Radial Nose Cone (Left)',
    description: 'Asymmetric outward-deflecting nose cone for strapped booster stages.',
    width: 2,
    height: 2,
    dryMass: 0.2,
    fuelMass: 0,
    dragCoeff: 0.08,
    heatTolerance: 2200,
    color: '#f8fafc',
    texturePattern: 'cone',
    connectionPoints: [
      { id: 'bottom', type: 'bottom', x: 0, y: 1 }
    ]
  },
  'nosecone_slant_right': {
    type: 'nosecone_slant_right',
    category: 'aerodynamics',
    name: 'Slanted Radial Nose Cone (Right)',
    description: 'Asymmetric outward-deflecting nose cone for strapped booster stages.',
    width: 2,
    height: 2,
    dryMass: 0.2,
    fuelMass: 0,
    dragCoeff: 0.08,
    heatTolerance: 2200,
    color: '#f8fafc',
    texturePattern: 'cone',
    connectionPoints: [
      { id: 'bottom', type: 'bottom', x: 0, y: 1 }
    ]
  },
  'fin_delta': {
    type: 'fin_delta',
    category: 'aerodynamics',
    name: 'Delta Stabilizer Fin',
    description: 'Passive aerodynamic fin creating restorative pitching and yawing moment during ascent.',
    width: 2,
    height: 3,
    dryMass: 0.12,
    fuelMass: 0,
    dragCoeff: 0.04,
    heatTolerance: 2100,
    color: '#e2e8f0',
    texturePattern: 'fin',
    connectionPoints: [
      { id: 'radial', type: 'radial', x: 0, y: 0 }
    ]
  },
  'fin_grid_titanium': {
    type: 'fin_grid_titanium',
    category: 'aerodynamics',
    name: 'Hypersonic Titanium Grid Fin',
    description: 'Actuated lattice grid fin providing extreme 3-axis control authority from Mach 4 to touchdown.',
    width: 1.5,
    height: 2,
    dryMass: 0.18,
    fuelMass: 0,
    dragCoeff: 0.12,
    heatTolerance: 2900,
    color: '#475569',
    texturePattern: 'tiled',
    connectionPoints: [
      { id: 'radial', type: 'radial', x: 0, y: 0 }
    ]
  },
  'heatshield_2m': {
    type: 'heatshield_2m',
    category: 'aerodynamics',
    name: 'Ablative Heatshield (2m)',
    description: 'Phenolic-impregnated carbon ablative heatshield capable of surviving 3,500K atmospheric entry.',
    width: 2,
    height: 1,
    dryMass: 0.35,
    fuelMass: 0,
    dragCoeff: 0.65,
    heatTolerance: 3800,
    color: '#451a03',
    texturePattern: 'smooth',
    connectionPoints: [
      { id: 'top', type: 'top', x: 0, y: -0.5 },
      { id: 'bottom', type: 'bottom', x: 0, y: 0.5 }
    ]
  },
  'rcs_quad_block': {
    type: 'rcs_quad_block',
    category: 'utility',
    name: 'RCS Quad Attitude Thruster',
    description: '4-way cold gas reaction control system for precision 3-axis rotation and docking in vacuum.',
    width: 1,
    height: 1,
    dryMass: 0.04,
    fuelMass: 0,
    thrust: 2.0,
    ispVac: 260,
    dragCoeff: 0.1,
    heatTolerance: 1700,
    color: '#cbd5e1',
    texturePattern: 'tiled',
    connectionPoints: [
      { id: 'radial', type: 'radial', x: 0, y: 0 }
    ]
  },
  'landing_leg_heavy': {
    type: 'landing_leg_heavy',
    category: 'utility',
    name: 'Hydraulic Carbon Landing Leg',
    description: 'Shock-absorbing deployable landing strut for vertical booster recovery.',
    width: 1,
    height: 3,
    dryMass: 0.18,
    fuelMass: 0,
    dragCoeff: 0.12,
    heatTolerance: 2200,
    color: '#334155',
    texturePattern: 'smooth',
    connectionPoints: [
      { id: 'radial', type: 'radial', x: 0, y: 0 }
    ]
  }
};

/**
 * Validates the structural attachment graph of the vehicle.
 * Ensures every placed part is physically adjacent / connected to the vehicle root tree.
 */
export function validateStructuralConnectivity(parts: PlacedPart[]): {
  connectedIds: Set<string>;
  disconnectedIds: string[];
  isFullyConnected: boolean;
} {
  if (parts.length === 0) {
    return { connectedIds: new Set(), disconnectedIds: [], isFullyConnected: true };
  }

  // Find root candidates (Command pods, probes, or bottom center booster tanks)
  const rootPart = parts.find(p => {
    const def = PARTS_CATALOG[p.partType];
    return def && (def.category === 'command' || p.x === 0);
  }) || parts[0];

  const connectedIds = new Set<string>();
  connectedIds.add(rootPart.instanceId);

  // Adjacency graph expansion
  let changed = true;
  while (changed) {
    changed = false;
    for (const part of parts) {
      if (connectedIds.has(part.instanceId)) continue;
      const def = PARTS_CATALOG[part.partType];
      if (!def) continue;

      const partLeft = part.x - def.width / 2;
      const partRight = part.x + def.width / 2;
      const partTop = part.y - def.height / 2;
      const partBottom = part.y + def.height / 2;

      // Check if physically adjacent / touching any already connected part
      for (const connId of Array.from(connectedIds)) {
        const other = parts.find(p => p.instanceId === connId);
        if (!other) continue;
        const otherDef = PARTS_CATALOG[other.partType];
        if (!otherDef) continue;

        const otherLeft = other.x - otherDef.width / 2;
        const otherRight = other.x + otherDef.width / 2;
        const otherTop = other.y - otherDef.height / 2;
        const otherBottom = other.y + otherDef.height / 2;

        const isXOverlap = partLeft < otherRight + 0.3 && partRight > otherLeft - 0.3;
        const isYOverlap = partTop < otherBottom + 0.3 && partBottom > otherTop - 0.3;

        // Bounding box adjacency tolerance
        if (isXOverlap && isYOverlap) {
          connectedIds.add(part.instanceId);
          changed = true;
          break;
        }
      }
    }
  }

  const disconnectedIds = parts.filter(p => !connectedIds.has(p.instanceId)).map(p => p.instanceId);
  return {
    connectedIds,
    disconnectedIds,
    isFullyConnected: disconnectedIds.length === 0
  };
}

/**
 * Calculates symmetric counterpart positions for builder tools.
 */
export function getSymmetricPlacements(
  partType: string,
  x: number,
  y: number,
  rotation: number,
  symmetry: SymmetryMode
): { x: number; y: number; rotation: number; partType: string }[] {
  if (symmetry === '1x' || x === 0) {
    return [{ x, y, rotation, partType }];
  }

  const results: { x: number; y: number; rotation: number; partType: string }[] = [
    { x, y, rotation, partType }
  ];

  if (symmetry === '2x_mirror') {
    // Mirrored across central axis X = 0
    let mirrorType = partType;
    if (partType === 'nosecone_slant_left') mirrorType = 'nosecone_slant_right';
    else if (partType === 'nosecone_slant_right') mirrorType = 'nosecone_slant_left';

    results.push({
      x: -x,
      y,
      rotation: (360 - rotation) % 360,
      partType: mirrorType
    });
  } else if (symmetry === '2x_radial') {
    results.push({ x: -x, y, rotation, partType });
  } else if (symmetry === '3x') {
    const r = Math.sqrt(x * x + y * y);
    const angle = Math.atan2(y, x);
    results.push(
      { x: Math.round(r * Math.cos(angle + (2 * Math.PI) / 3) * 10) / 10, y: Math.round(r * Math.sin(angle + (2 * Math.PI) / 3) * 10) / 10, rotation, partType },
      { x: Math.round(r * Math.cos(angle + (4 * Math.PI) / 3) * 10) / 10, y: Math.round(r * Math.sin(angle + (4 * Math.PI) / 3) * 10) / 10, rotation, partType }
    );
  } else if (symmetry === '4x') {
    results.push(
      { x: -x, y, rotation, partType },
      { x: -y, y: x, rotation: (rotation + 90) % 360, partType },
      { x: y, y: -x, rotation: (rotation + 270) % 360, partType }
    );
  }

  return results;
}

/**
 * Calculates physical, aerodynamic, staging, and mass properties of the assembled rocket.
 * Incorporates aerodynamic body occlusion and structural connectivity graph validation.
 */
export function calculateRocketProperties(blueprint: RocketBlueprint): RocketAeroProperties {
  if (!blueprint.parts.length) {
    return {
      totalMass: 0,
      dryMass: 0,
      fuelMass: 0,
      totalThrust: 0,
      centerOfMass: { x: 0, y: 0 },
      centerOfPressure: { x: 0, y: 0 },
      centerOfThrust: { x: 0, y: 0 },
      stagesDeltaV: [],
      totalDeltaV: 0,
      maxTWR: 0,
      minTWR: 0,
      aerodynamicStabilityMargin: 0,
      disconnectedPartsCount: 0,
      isStructurallySound: true
    };
  }

  const connectivity = validateStructuralConnectivity(blueprint.parts);

  let totalMass = 0;
  let dryMass = 0;
  let totalFuel = 0;
  let momentX = 0;
  let momentY = 0;
  let totalThrust = 0;
  let thrustMomentX = 0;
  let thrustMomentY = 0;

  const stagePartsMap = new Map<number, PlacedPart[]>();

  // Sort parts from top to bottom for aerodynamic shading calculation
  const sortedByY = [...blueprint.parts].sort((a, b) => a.y - b.y);

  let totalExposedArea = 0;
  let aeroMomentX = 0;
  let aeroMomentY = 0;

  // Track the widest cross-section upstream at each lateral X column
  const upstreamWidthMap: { x: number; width: number; y: number }[] = [];

  for (const part of sortedByY) {
    const def = PARTS_CATALOG[part.partType];
    if (!def) continue;

    const currentFuel = def.fuelMass * (part.fuelPercentage / 100);
    const partTotalMass = def.dryMass + currentFuel;
    totalMass += partTotalMass;
    dryMass += def.dryMass;
    totalFuel += currentFuel;

    momentX += part.x * partTotalMass;
    momentY += part.y * partTotalMass;

    // Aerodynamic Occlusion Model:
    // If a part is behind a wider upstream nosecone or tank, reduce its direct frontal drag area
    let shieldingFactor = 1.0;
    for (const upstream of upstreamWidthMap) {
      if (Math.abs(upstream.x - part.x) < 0.5 && upstream.y < part.y) {
        if (upstream.width >= def.width) {
          shieldingFactor = 0.25; // 75% shaded by upstream body
          break;
        }
      }
    }
    upstreamWidthMap.push({ x: part.x, width: def.width, y: part.y });

    const effectiveDragArea = def.width * def.height * def.dragCoeff * shieldingFactor;
    totalExposedArea += effectiveDragArea;
    aeroMomentX += part.x * effectiveDragArea;
    aeroMomentY += part.y * effectiveDragArea;

    if (def.thrust && def.thrust > 0) {
      totalThrust += def.thrust;
      thrustMomentX += part.x * def.thrust;
      thrustMomentY += (part.y + def.height / 2) * def.thrust;
    }

    const stageNum = part.stage || 1;
    if (!stagePartsMap.has(stageNum)) {
      stagePartsMap.set(stageNum, []);
    }
    stagePartsMap.get(stageNum)!.push(part);
  }

  const comX = totalMass > 0 ? momentX / totalMass : 0;
  const comY = totalMass > 0 ? momentY / totalMass : 0;

  const copX = totalExposedArea > 0 ? aeroMomentX / totalExposedArea : 0;
  const copY = totalExposedArea > 0 ? aeroMomentY / totalExposedArea : 0;

  const cotX = totalThrust > 0 ? thrustMomentX / totalThrust : comX;
  const cotY = totalThrust > 0 ? thrustMomentY / totalThrust : comY;

  // Staging delta-V calculation (Tsiolkovsky rocket equation per stage)
  const sortedStages = Array.from(stagePartsMap.keys()).sort((a, b) => a - b);
  const stagesDeltaV: { stage: number; deltaV: number; twr: number; burnTime: number }[] = [];
  let cumulativeMass = totalMass;
  let totalDeltaV = 0;

  for (const stageNum of sortedStages) {
    const stageParts = stagePartsMap.get(stageNum) || [];
    let stageThrust = 0;
    let weightedIsp = 0;
    let stageFuelMass = 0;

    for (const part of stageParts) {
      const def = PARTS_CATALOG[part.partType];
      if (!def) continue;
      const fuel = def.fuelMass * (part.fuelPercentage / 100);
      stageFuelMass += fuel;

      if (def.thrust && def.ispVac) {
        stageThrust += def.thrust;
        weightedIsp += def.ispVac * def.thrust;
      }
    }

    const effectiveIsp = stageThrust > 0 ? weightedIsp / stageThrust : 300;
    const m0 = cumulativeMass;
    const mf = Math.max(0.001, cumulativeMass - stageFuelMass);

    let stageDV = 0;
    if (m0 > mf && stageThrust > 0) {
      stageDV = effectiveIsp * 9.80665 * Math.log(m0 / mf);
    }

    const twr = cumulativeMass > 0 ? stageThrust / (cumulativeMass * 9.80665) : 0;
    const massFlowRate = stageThrust > 0 ? (stageThrust * 1000) / (effectiveIsp * 9.80665) / 1000 : 0.01;
    const burnTime = massFlowRate > 0 ? stageFuelMass / massFlowRate : 0;

    stagesDeltaV.push({
      stage: stageNum,
      deltaV: Math.round(stageDV),
      twr: parseFloat(twr.toFixed(2)),
      burnTime: Math.round(burnTime)
    });

    totalDeltaV += stageDV;
    cumulativeMass = mf;
  }

  // Aerodynamic Stability Margin: CoP should be behind CoM (higher Y in screen space) for static stability
  const stabilityMargin = copY - comY;

  return {
    totalMass: parseFloat(totalMass.toFixed(2)),
    dryMass: parseFloat(dryMass.toFixed(2)),
    fuelMass: parseFloat(totalFuel.toFixed(2)),
    totalThrust: Math.round(totalThrust),
    centerOfMass: { x: parseFloat(comX.toFixed(2)), y: parseFloat(comY.toFixed(2)) },
    centerOfPressure: { x: parseFloat(copX.toFixed(2)), y: parseFloat(copY.toFixed(2)) },
    centerOfThrust: { x: parseFloat(cotX.toFixed(2)), y: parseFloat(cotY.toFixed(2)) },
    stagesDeltaV,
    totalDeltaV: Math.round(totalDeltaV),
    maxTWR: stagesDeltaV.length > 0 ? Math.max(...stagesDeltaV.map(s => s.twr)) : 0,
    minTWR: stagesDeltaV.length > 0 ? Math.min(...stagesDeltaV.map(s => s.twr)) : 0,
    aerodynamicStabilityMargin: parseFloat(stabilityMargin.toFixed(2)),
    disconnectedPartsCount: connectivity.disconnectedIds.length,
    isStructurallySound: connectivity.isFullyConnected
  };
}

export const ROCKET_PRESETS: RocketBlueprint[] = [
  {
    id: 'preset_falcon_orbit',
    name: 'Falcon Orbital Heavy',
    parts: [
      { instanceId: 'p1', partType: 'pod_mk1', x: 0, y: -7, rotation: 0, stage: 3, fuelPercentage: 100 },
      { instanceId: 'p2', partType: 'tank_small_2m', x: 0, y: -4.5, rotation: 0, stage: 3, fuelPercentage: 100 },
      { instanceId: 'p3', partType: 'engine_vacuum_expand', x: 0, y: -1.5, rotation: 0, stage: 3, fuelPercentage: 100 },
      { instanceId: 'p4', partType: 'decoupler_stack_2m', x: 0, y: 0.5, rotation: 0, stage: 2, fuelPercentage: 100 },
      { instanceId: 'p5', partType: 'tank_titan_4m', x: 0, y: 6, rotation: 0, stage: 1, fuelPercentage: 100 },
      { instanceId: 'p6', partType: 'engine_cluster_quad', x: 0, y: 12.5, rotation: 0, stage: 1, fuelPercentage: 100 },
      { instanceId: 'p7', partType: 'fin_grid_titanium', x: -2.5, y: 2, rotation: 0, stage: 1, fuelPercentage: 100 },
      { instanceId: 'p8', partType: 'fin_grid_titanium', x: 2.5, y: 2, rotation: 0, stage: 1, fuelPercentage: 100 },
      { instanceId: 'p9', partType: 'landing_leg_heavy', x: -2.5, y: 11, rotation: 0, stage: 1, fuelPercentage: 100 },
      { instanceId: 'p10', partType: 'landing_leg_heavy', x: 2.5, y: 11, rotation: 0, stage: 1, fuelPercentage: 100 }
    ],
    staging: [[1], [2], [3]]
  },
  {
    id: 'preset_saturn_lunar',
    name: 'Saturn Lunar Excursion V',
    parts: [
      { instanceId: 's1', partType: 'crew_heavy', x: 0, y: -10, rotation: 0, stage: 3, fuelPercentage: 100 },
      { instanceId: 's2', partType: 'heatshield_2m', x: 0, y: -8, rotation: 0, stage: 3, fuelPercentage: 100 },
      { instanceId: 's3', partType: 'decoupler_stack_4m', x: 0, y: -7, rotation: 0, stage: 2, fuelPercentage: 100 },
      { instanceId: 's4', partType: 'tank_heavy_4m', x: 0, y: -3.5, rotation: 0, stage: 2, fuelPercentage: 100 },
      { instanceId: 's5', partType: 'engine_raptor', x: 0, y: 1, rotation: 0, stage: 2, fuelPercentage: 100 },
      { instanceId: 's6', partType: 'decoupler_stack_4m', x: 0, y: 3, rotation: 0, stage: 1, fuelPercentage: 100 },
      { instanceId: 's7', partType: 'tank_titan_4m', x: 0, y: 8.5, rotation: 0, stage: 1, fuelPercentage: 100 },
      { instanceId: 's8', partType: 'engine_cluster_quad', x: 0, y: 15, rotation: 0, stage: 1, fuelPercentage: 100 },
      { instanceId: 's9', partType: 'srb_heavy', x: -3, y: 8.5, rotation: 0, stage: 1, fuelPercentage: 100 },
      { instanceId: 's10', partType: 'nosecone_slant_left', x: -3, y: 3.5, rotation: 0, stage: 1, fuelPercentage: 100 },
      { instanceId: 's11', partType: 'srb_heavy', x: 3, y: 8.5, rotation: 0, stage: 1, fuelPercentage: 100 },
      { instanceId: 's12', partType: 'nosecone_slant_right', x: 3, y: 3.5, rotation: 0, stage: 1, fuelPercentage: 100 },
      { instanceId: 's13', partType: 'fin_delta', x: -4, y: 14, rotation: 0, stage: 1, fuelPercentage: 100 },
      { instanceId: 's14', partType: 'fin_delta', x: 4, y: 14, rotation: 0, stage: 1, fuelPercentage: 100 }
    ],
    staging: [[1], [2], [3]]
  }
];
