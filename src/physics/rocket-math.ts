import type { PartDefinition, PlacedPart, RocketAeroProperties, RocketBlueprint } from '../types';

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
    name: 'Cryogenic Booster Tank B-800 (4m)',
    description: 'High-capacity 4-meter liquid oxygen/liquid hydrogen tank with thermal insulation foam.',
    width: 4,
    height: 6,
    dryMass: 2.8,
    fuelMass: 24.0,
    dragCoeff: 0.18,
    heatTolerance: 1800,
    color: '#d97706',
    texturePattern: 'smooth',
    connectionPoints: [
      { id: 'top', type: 'top', x: 0, y: -3 },
      { id: 'bottom', type: 'bottom', x: 0, y: 3 },
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
    thrust: 845,
    seaLevelThrust: 760,
    ispVac: 311,
    ispAtm: 282,
    dragCoeff: 0.45,
    heatTolerance: 2800,
    gimbalAngle: 5.0,
    color: '#475569',
    texturePattern: 'engine-bell',
    connectionPoints: [
      { id: 'top', type: 'top', x: 0, y: -1 }
    ]
  },
  'engine_raptor': {
    type: 'engine_raptor',
    category: 'engine',
    name: 'Raptor Full-Flow Staged Engine',
    description: 'Deep-throttling methalox full-flow staged combustion engine with supreme chamber pressure (300 bar).',
    width: 2,
    height: 3,
    dryMass: 1.5,
    fuelMass: 0,
    thrust: 2200,
    seaLevelThrust: 2000,
    ispVac: 363,
    ispAtm: 327,
    dragCoeff: 0.42,
    heatTolerance: 3400,
    gimbalAngle: 7.0,
    color: '#334155',
    texturePattern: 'engine-bell',
    connectionPoints: [
      { id: 'top', type: 'top', x: 0, y: -1.5 }
    ]
  },
  'engine_vacuum_expand': {
    type: 'engine_vacuum_expand',
    category: 'engine',
    name: 'Aero-Vac High-Expansion Upper Engine',
    description: 'Gigantic niobium-alloy expansion bell nozzle optimized strictly for vacuum delta-V efficiency.',
    width: 2,
    height: 3,
    dryMass: 0.9,
    fuelMass: 0,
    thrust: 980,
    seaLevelThrust: 350,
    ispVac: 380,
    ispAtm: 200,
    dragCoeff: 0.65,
    heatTolerance: 2600,
    gimbalAngle: 3.5,
    color: '#1e293b',
    texturePattern: 'engine-bell',
    connectionPoints: [
      { id: 'top', type: 'top', x: 0, y: -1.5 }
    ]
  },
  'engine_cluster_quad': {
    type: 'engine_cluster_quad',
    category: 'engine',
    name: 'Quad-Cluster Titan Core Thruster',
    description: 'Heavy 4-chamber booster cluster generating massive liftoff thrust for 4m stages.',
    width: 4,
    height: 3,
    dryMass: 4.2,
    fuelMass: 0,
    thrust: 7500,
    seaLevelThrust: 6800,
    ispVac: 305,
    ispAtm: 275,
    dragCoeff: 0.55,
    heatTolerance: 3200,
    gimbalAngle: 4.0,
    color: '#1e293b',
    texturePattern: 'engine-bell',
    connectionPoints: [
      { id: 'top', type: 'top', x: 0, y: -1.5 }
    ]
  },
  'srb_heavy': {
    type: 'srb_heavy',
    category: 'engine',
    name: 'Solid Rocket Booster Titan-Castor',
    description: 'Heavy solid rocket booster. High initial thrust, constant burn profile, non-throttleable.',
    width: 1,
    height: 8,
    dryMass: 3.0,
    fuelMass: 18.0,
    thrust: 2800,
    seaLevelThrust: 2500,
    ispVac: 270,
    ispAtm: 250,
    dragCoeff: 0.30,
    heatTolerance: 2200,
    color: '#e2e8f0',
    texturePattern: 'ribbed',
    connectionPoints: [
      { id: 'radial_left', type: 'left', x: -0.5, y: 0 },
      { id: 'radial_right', type: 'right', x: 0.5, y: 0 },
      { id: 'top', type: 'top', x: 0, y: -4 }
    ]
  },
  'nosecone_2m': {
    type: 'nosecone_2m',
    category: 'aerodynamics',
    name: 'Aerodynamic Ogive Nosecone (2m)',
    description: 'Low-drag parabolic nose fairing for minimizing supersonic wave drag and Max-Q pressure.',
    width: 2,
    height: 2,
    dryMass: 0.15,
    fuelMass: 0,
    dragCoeff: 0.08,
    heatTolerance: 2200,
    color: '#f1f5f9',
    texturePattern: 'cone',
    connectionPoints: [
      { id: 'bottom', type: 'bottom', x: 0, y: 1 }
    ]
  },
  'nosecone_slant_left': {
    type: 'nosecone_slant_left',
    category: 'aerodynamics',
    name: 'Slanted Booster Cap (Left)',
    description: 'Canted aerodynamic cap designed specifically for radial booster attachment.',
    width: 1,
    height: 2,
    dryMass: 0.1,
    fuelMass: 0,
    dragCoeff: 0.12,
    heatTolerance: 2000,
    color: '#e2e8f0',
    texturePattern: 'cone',
    connectionPoints: [
      { id: 'bottom', type: 'bottom', x: 0, y: 1 },
      { id: 'right', type: 'right', x: 0.5, y: 0 }
    ]
  },
  'nosecone_slant_right': {
    type: 'nosecone_slant_right',
    category: 'aerodynamics',
    name: 'Slanted Booster Cap (Right)',
    description: 'Canted aerodynamic cap designed specifically for radial booster attachment.',
    width: 1,
    height: 2,
    dryMass: 0.1,
    fuelMass: 0,
    dragCoeff: 0.12,
    heatTolerance: 2000,
    color: '#e2e8f0',
    texturePattern: 'cone',
    connectionPoints: [
      { id: 'bottom', type: 'bottom', x: 0, y: 1 },
      { id: 'left', type: 'left', x: -0.5, y: 0 }
    ]
  },
  'fin_delta': {
    type: 'fin_delta',
    category: 'aerodynamics',
    name: 'Delta Stabilizer Fin',
    description: 'Large fixed delta wing surface providing passive aerodynamic stability and restoring moment.',
    width: 2,
    height: 2,
    dryMass: 0.08,
    fuelMass: 0,
    dragCoeff: 0.05,
    heatTolerance: 2000,
    color: '#38bdf8',
    texturePattern: 'fin',
    connectionPoints: [
      { id: 'radial', type: 'radial', x: 0, y: 0 }
    ]
  },
  'fin_grid_titanium': {
    type: 'fin_grid_titanium',
    category: 'aerodynamics',
    name: 'Titanium Grid Fin (Hypersonic)',
    description: 'Active steerable grid fin providing aerodynamic control authority through supersonic & hypersonic regimes.',
    width: 1,
    height: 2,
    dryMass: 0.12,
    fuelMass: 0,
    dragCoeff: 0.14,
    heatTolerance: 3100,
    color: '#64748b',
    texturePattern: 'fin',
    connectionPoints: [
      { id: 'radial', type: 'radial', x: 0, y: 0 }
    ]
  },
  'heatshield_2m': {
    type: 'heatshield_2m',
    category: 'aerodynamics',
    name: 'Ablative Heat Shield (2m PICA-X)',
    description: 'Carbon-phenolic thermal protection shield rated for extreme hypersonic stagnation heating.',
    width: 2,
    height: 1,
    dryMass: 0.4,
    fuelMass: 0,
    dragCoeff: 0.85,
    heatTolerance: 3800,
    color: '#1e293b',
    texturePattern: 'tiled',
    connectionPoints: [
      { id: 'top', type: 'top', x: 0, y: -0.5 },
      { id: 'bottom', type: 'bottom', x: 0, y: 0.5 }
    ]
  },
  'fairing_payload_4m': {
    type: 'fairing_payload_4m',
    category: 'aerodynamics',
    name: 'Aerodynamic Payload Fairing (4m)',
    description: 'Jettisonable composite aerodynamic shroud protecting satellites during atmospheric ascent.',
    width: 4,
    height: 5,
    dryMass: 0.8,
    fuelMass: 0,
    dragCoeff: 0.11,
    heatTolerance: 2400,
    color: '#f8fafc',
    texturePattern: 'smooth',
    connectionPoints: [
      { id: 'bottom', type: 'bottom', x: 0, y: 2.5 }
    ]
  },
  'decoupler_stack_2m': {
    type: 'decoupler_stack_2m',
    category: 'staging',
    name: 'Stack Decoupler TR-18A (2m)',
    description: 'Pneumatic explosive separation ring for staging rocket sections.',
    width: 2,
    height: 1,
    dryMass: 0.1,
    fuelMass: 0,
    dragCoeff: 0.15,
    heatTolerance: 1800,
    color: '#f59e0b',
    texturePattern: 'ribbed',
    connectionPoints: [
      { id: 'top', type: 'top', x: 0, y: -0.5 },
      { id: 'bottom', type: 'bottom', x: 0, y: 0.5 }
    ]
  },
  'decoupler_stack_4m': {
    type: 'decoupler_stack_4m',
    category: 'staging',
    name: 'Heavy Interstage Decoupler (4m)',
    description: 'Heavy-duty ring decoupler for 4m booster stage separation.',
    width: 4,
    height: 1,
    dryMass: 0.25,
    fuelMass: 0,
    dragCoeff: 0.18,
    heatTolerance: 1800,
    color: '#f59e0b',
    texturePattern: 'ribbed',
    connectionPoints: [
      { id: 'top', type: 'top', x: 0, y: -0.5 },
      { id: 'bottom', type: 'bottom', x: 0, y: 0.5 }
    ]
  },
  'decoupler_radial': {
    type: 'decoupler_radial',
    category: 'staging',
    name: 'Radial Booster Decoupler TT-70',
    description: 'Side-mounted explosive bolts with outward push-springs to jettison booster tanks safely away.',
    width: 1,
    height: 2,
    dryMass: 0.05,
    fuelMass: 0,
    dragCoeff: 0.15,
    heatTolerance: 1800,
    color: '#d97706',
    texturePattern: 'ribbed',
    connectionPoints: [
      { id: 'left', type: 'left', x: -0.5, y: 0 },
      { id: 'right', type: 'right', x: 0.5, y: 0 }
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
      aerodynamicStabilityMargin: 0
    };
  }

  let totalMass = 0;
  let dryMass = 0;
  let totalFuel = 0;
  let momentX = 0;
  let momentY = 0;
  let totalArea = 0;
  let areaMomentX = 0;
  let areaMomentY = 0;
  let totalThrust = 0;
  let thrustMomentX = 0;
  let thrustMomentY = 0;

  const stagePartsMap = new Map<number, PlacedPart[]>();

  for (const part of blueprint.parts) {
    const def = PARTS_CATALOG[part.partType];
    if (!def) continue;

    const currentFuel = def.fuelMass * (part.fuelPercentage / 100);
    const partTotalMass = def.dryMass + currentFuel;
    totalMass += partTotalMass;
    dryMass += def.dryMass;
    totalFuel += currentFuel;

    momentX += part.x * partTotalMass;
    momentY += part.y * partTotalMass;

    const area = def.width * def.height * def.dragCoeff;
    totalArea += area;
    areaMomentX += part.x * area;
    areaMomentY += part.y * area;

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

  const copX = totalArea > 0 ? areaMomentX / totalArea : 0;
  const copY = totalArea > 0 ? areaMomentY / totalArea : 0;

  const cotX = totalThrust > 0 ? thrustMomentX / totalThrust : comX;
  const cotY = totalThrust > 0 ? thrustMomentY / totalThrust : comY;

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
    aerodynamicStabilityMargin: parseFloat(stabilityMargin.toFixed(2))
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
  },
  {
    id: 'preset_aero_dart',
    name: 'Mach-15 Hypersonic Dart',
    parts: [
      { instanceId: 'd1', partType: 'nosecone_2m', x: 0, y: -5, rotation: 0, stage: 1, fuelPercentage: 100 },
      { instanceId: 'd2', partType: 'tank_small_2m', x: 0, y: -2.5, rotation: 0, stage: 1, fuelPercentage: 100 },
      { instanceId: 'd3', partType: 'tank_med_2m', x: 0, y: 2, rotation: 0, stage: 1, fuelPercentage: 100 },
      { instanceId: 'd4', partType: 'engine_raptor', x: 0, y: 6.5, rotation: 0, stage: 1, fuelPercentage: 100 },
      { instanceId: 'd5', partType: 'fin_grid_titanium', x: -1.5, y: -1, rotation: 0, stage: 1, fuelPercentage: 100 },
      { instanceId: 'd6', partType: 'fin_grid_titanium', x: 1.5, y: -1, rotation: 0, stage: 1, fuelPercentage: 100 },
      { instanceId: 'd7', partType: 'fin_delta', x: -2, y: 4, rotation: 0, stage: 1, fuelPercentage: 100 },
      { instanceId: 'd8', partType: 'fin_delta', x: 2, y: 4, rotation: 0, stage: 1, fuelPercentage: 100 }
    ],
    staging: [[1]]
  }
];
