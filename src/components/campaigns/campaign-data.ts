import type { AppTab } from '../../types';

export interface CampaignMission {
  id: string;
  title: string;
  agency: string;
  year: string;
  category: 'lunar' | 'interplanetary' | 'defense' | 'reusable';
  description: string;
  objectives: string[];
  targetTab: Extract<AppTab, 'flight-sandbox' | 'celestial-sim' | 'asteroid-impact' | 'rocket-builder'>;
  presetId?: string;
}

export const CAMPAIGN_MISSIONS: CampaignMission[] = [
  {
    id: 'apollo_11',
    title: 'Apollo 11: First Lunar Landing',
    agency: 'NASA',
    year: '1969',
    category: 'lunar',
    description: 'Launch the three-stage Saturn V rocket, perform Translunar Injection (TLI), and execute the Eagle lunar descent to the Sea of Tranquility.',
    objectives: [
      'Reach 185 km Low Earth Parking Orbit',
      'Execute TLI burn to lunar trajectory',
      'Touch down the lunar module below 2.0 m/s'
    ],
    targetTab: 'flight-sandbox',
    presetId: 'saturn_v'
  },
  {
    id: 'voyager_tour',
    title: 'Voyager Grand Tour: Gravity Slingshot',
    agency: 'NASA / JPL',
    year: '1977',
    category: 'interplanetary',
    description: 'Use a rare planetary alignment for consecutive gravity assists at Jupiter and Saturn, building enough speed for an interstellar escape trajectory.',
    objectives: [
      'Execute a Jupiter hyperbolic flyby',
      'Use the Oberth effect to increase heliocentric speed',
      'Attain a hyperbolic escape trajectory'
    ],
    targetTab: 'celestial-sim'
  },
  {
    id: 'artemis_surface',
    title: 'Artemis: Lunar South Pole Science',
    agency: 'NASA / ESA / JAXA',
    year: 'Program',
    category: 'lunar',
    description: 'Model a crewed lunar mission architecture, then investigate low-gravity surface mobility and permanently shadowed ice deposits.',
    objectives: [
      'Model translunar injection and lunar rendezvous',
      'Descend toward the Shackleton crater region',
      'Collect simulated ice samples in low gravity'
    ],
    targetTab: 'flight-sandbox',
    presetId: 'starship_superheavy'
  },
  {
    id: 'falcon_heavy_dual',
    title: 'Falcon Heavy: Reusable Booster Recovery',
    agency: 'SpaceX',
    year: '2018',
    category: 'reusable',
    description: 'Compare ascent performance with the propellant and stability demands of recovering two side boosters.',
    objectives: [
      'Separate side boosters after maximum dynamic pressure',
      'Model the boostback and entry burns',
      'Control touchdown speed with a final landing burn'
    ],
    targetTab: 'flight-sandbox',
    presetId: 'falcon_heavy'
  },
  {
    id: 'dart_defense',
    title: 'DART: Planetary Asteroid Deflection',
    agency: 'NASA / Johns Hopkins APL',
    year: '2022',
    category: 'defense',
    description: 'Model a hypervelocity kinetic impactor and study how a very small velocity change grows into a safe miss distance over time.',
    objectives: [
      'Configure a 600 kg kinetic impactor',
      'Calculate momentum transfer at 6.6 km/s',
      'Compare warning time with final deflection distance'
    ],
    targetTab: 'asteroid-impact'
  }
];
