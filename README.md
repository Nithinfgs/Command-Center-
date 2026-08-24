# ◈ MISSION CONTROL — Aerospace & Celestial Simulation Suite

> **Mission Control** is an advanced aerospace engineering, computational fluid dynamics (CFD), orbital mechanics, 2D flight dynamics, and planetary impact simulation platform. Built with a high-contrast industrial **Midnight + Signal Orange** aesthetic inspired by modern aerospace command centers and instrumentation.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-loquacious--dango--5e5843.netlify.app-FF8A1F?style=for-the-badge&logo=netlify)](https://loquacious-dango-5e5843.netlify.app)
[![GitHub Repo](https://img.shields.io/badge/GitHub-Nithinfgs%2FCommand--Center--181717?style=for-the-badge&logo=github)](https://github.com/Nithinfgs/Command-Center-)

---

## 🌐 Live Interactive Demo

👉 **[https://loquacious-dango-5e5843.netlify.app](https://loquacious-dango-5e5843.netlify.app)**

---

## 🚀 Simulation Modules

### 1. 🛠️ Rocket Builder & Staging Architect
- **Component Palette**: Engines (Kerolox, Hydrolox, Methalox, Solid Boosters), Fuel Tanks (Small to Titan Core), Decouplers, Fairings, Titanium Grid Fins, RCS Thrusters, and Landing Legs.
- **Snap-Grid Assembly**: 2D modular placement with auto-aligned connection nodes.
- **Real-Time Physics Engine**:
  - **Tsiolkovsky Rocket Equation** ($\Delta V = I_{sp} \cdot g_0 \cdot \ln(m_0 / m_f)$) per-stage calculations.
  - Center of Mass ($CoM$), Center of Pressure ($CoP$), and Center of Thrust ($CoT$).
  - Dynamic **Aerodynamic Stability Margin** (aerodynamic flip-risk warnings).
  - Thrust-to-Weight Ratio ($TWR$) and Stage burn-time analytics.
- **Staging Sequencer**: Multi-stage separation sequencing with live $\Delta V$ contribution tracking.

---

### 2. 💨 CFD Wind Tunnel & Aerodynamic Diagnostics
- **Independent 2-Axis Vectoring**:
  - **Vehicle Pitch Attitude**: $-35^\circ$ to $+35^\circ$ (Nose Up / Nose Down).
  - **Freestream Wind Inflow**: $-35^\circ$ to $+35^\circ$ (Updraft / Downdraft).
  - Calculates true **Effective Angle of Attack** ($\alpha = \text{Wind} - \text{Pitch}$).
- **Flow Visualizations**:
  - CFD Streamlines & Velocity Vector Field.
  - Stagnation Temperature & Thermal Heatmap ($T_0 = T_\infty [1 + \frac{\gamma - 1}{2} M^2]$).
  - Dynamic Pressure Gradient & Isosurfaces ($q = \frac{1}{2} \rho v^2$).
  - Supersonic Schlieren Shock Cones & Bow Shockwaves ($\mu = \arcsin(1/M)$).
  - Boundary layer separation & turbulent vortex shedding.
- **Data Export Suite**:
  - CSV & JSON telemetry export.
  - Multi-point Angle-of-Attack ($-30^\circ \to +30^\circ$) **Polar Curve Sweep**.
  - Markdown summary report and High-DPI PNG canvas snapshots.

---

### 3. 🪐 2D Spaceflight Simulator (SFS Mechanics)
- **Flight Kinematics**:
  - True 2D rigid-body orbital mechanics with spherical gravity ($g = \frac{GM}{(R + h)^2}$).
  - Instant throttle cutoff ($0\% \to 100\%$) and inertia/momentum coasting in vacuum.
  - True heading rotation: turns vehicle downrange (East) towards $+X$.
- **Interactive Camera System**:
  - Mouse wheel zoom ($1.5\times$ down to $0.0001\times$) and click-and-drag world panning.
- **Celestial Sky Elements**:
  - Moon (with surface craters & halo), Mars, Jupiter (cloud bands & Galilean moons), and Saturn (ring system).
- **Engine Staging & Exhaust Particles**: Realistic particle emission reflecting throttle and vacuum plume expansion.
- **Mission Abort Suite & Post-Flight Report**:
  - Instant vehicle abort telemetry logs.
  - Detailed telemetry report modal with CSV/JSON dataset export.

---

### 4. 🌌 N-Body Gravitational Physics (Keplerian Orbitals)
- **Symplectic RK4 Integrator**: Accurate 4th-order Runge-Kutta orbital integration.
- **Spacetime Curvature Grid**: Real-time gravitational well visualization.
- **Keplerian Orbital Elements**: Calculates Semi-Major Axis ($a$), Eccentricity ($e$), Apoapsis ($r_a$), and Periapsis ($r_p$).
- **Celestial Forge**: Custom body creation (Terrestrial, Gas Giant, Black Hole, Star) with ring systems and atmospheric envelopes.
- **Time Warp Controls**: $1\times$ to $100\times$ acceleration with system architecture presets.

---

### 5. ☄️ Meteor / Asteroid Impact & Megatsunami Simulation
- **Kinetic Energy Engine**:
  - Computes projectile mass, entry angle, and total kinetic yield in Megatons of TNT and Hiroshima equivalents.
  - Calculates transient & final crater dimensions, volume, and depth.
  - Seismic Richter scale magnitude ($M_w$) and sonic decibels at $100\text{ km}$.
- **Population Area Toggle & Casualty Model**:
  - Target areas: **Mega-Metropolis (10M)**, **Major City (1M)**, **Suburban (250k)**, **Small Town (100k)**, **Rural (10k)**, **Uninhabited (0)**, and Custom Population.
  - Mathematical casualty breakdown: Direct thermal fireball vaporization, 20 PSI blast demolition, and 5 PSI collapse trauma.
- **Deep Ocean Impact & Megatsunami Waves**:
  - Ocean water impact mode displaying abyssal seabed ($4,000\text{ m}$ depth).
  - Superheated steam & vapor ejecta column exploding into the stratosphere.
  - Animated **Megatsunami Ripple Waves** surging outwards with wave height indicators.
  - Runup distance ($H_{\text{runup}}$) and coastal community flood casualties.

---

## 🎨 Design System: Midnight + Signal Orange

The interface uses a dark control room palette:

| Token | Hex Code | Purpose |
| :--- | :--- | :--- |
| **Void** | `#090A0D` | Deep background |
| **Mission Black** | `#0E1015` | Secondary panels & toolbars |
| **Control Surface** | `#151820` | Primary sidebars & modal containers |
| **Panel Raised** | `#1B1F28` | Cards & item containers |
| **Signal Orange** | `#FF8A1F` | Identity accent, active tabs, launch buttons, thrust values |
| **Nominal Green** | `#55B982` | System nominal status (`● VEHICLE NOMINAL`) |
| **Warning Amber** | `#E6B84D` | Caution & non-lethal warnings |
| **Critical Red** | `#D95757` | Abort, aerodynamic stall, fatalities |
| **Telemetry Steel** | `#79AFC1` | Telemetry readouts, graphs, scientific data |

---

## ⚡ Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0.0 or higher)
- `npm` or `pnpm`

### Installation & Run

```bash
# 1. Clone repository
git clone https://github.com/Nithinfgs/Command-Center-.git

# 2. Enter directory
cd Command-Center-

# 3. Install dependencies
npm install

# 4. Start development server
npm run dev
```

Open your browser and navigate to:  
👉 **`http://localhost:5173/`**

### Production Build

```bash
npm run build
npm run preview
```

---

## ⌨️ Flight Controls & Keybindings

| Key / Action | Function |
| :--- | :--- |
| `Space` | Ignition & Launch / Stage Separation |
| `Z` | Instant Throttle to 100% |
| `X` | Instant Throttle Cutoff (0%) |
| `W` / `S` | Pitch Vehicle Up / Down |
| `Scroll Wheel` | Zoom Camera In / Out |
| `Click + Drag` | Pan Camera in World Space |

---

## 📂 Project Architecture

```
├── public/                 # Static assets
├── src/
│   ├── components/
│   │   ├── layout/         # Mission Control TopBar & Navigation
│   │   ├── rocket-builder/ # Grid Canvas, Parts Palette, Staging, HUD
│   │   ├── wind-tunnel/    # CFD Canvas, Vector Controls, Export Modal
│   │   ├── flight-sandbox/ # 2D Physics Canvas, NavBall HUD, Report Modal
│   │   ├── celestial-sim/  # 3D Three.js N-Body Canvas, Celestial Forge
│   │   └── asteroid-impact/# 2D Impact Canvas, Population Selector
│   ├── context/            # Global SimulationContext & State Providers
│   ├── physics/            # Pure physics engines:
│   │   ├── aerodynamics.ts # Navier-Stokes & Compressible Aerodynamics
│   │   ├── flight-dynamics.ts# 2D SFS Orbital & Rigid-Body Dynamics
│   │   ├── impact-physics.ts # Crater, Fireball, Casualty & Megatsunami
│   │   ├── n-body.ts       # Runge-Kutta RK4 Gravitational Physics
│   │   └── rocket-math.ts  # Tsiolkovsky, Aerodynamic Center & Staging
│   ├── store/              # State store definitions
│   └── types/              # Comprehensive TypeScript interfaces
├── package.json
└── vite.config.ts
```

---

## 📜 License
MIT License. Created for advanced aerospace simulation and interactive mission operations.
