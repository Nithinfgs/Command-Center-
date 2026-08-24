/**
 * 2D Lattice Boltzmann Method (LBM D2Q9) Incompressible Fluid Flow Solver.
 * Implements BGK collision operator, non-equilibrium bounce-back solid boundaries,
 * and macroscopic velocity/vorticity/streamline extraction for aerospace CFD.
 */
export class LBMFluidSolver2D {
  public nx: number;
  public ny: number;
  private tau: number;
  private f: Float32Array; // Distribution functions (9 * nx * ny)
  public rho: Float32Array; // Macroscopic density
  public ux: Float32Array;  // Velocity X field
  public uy: Float32Array;  // Velocity Y field
  public curl: Float32Array; // Vorticity field (curl = dv/dx - du/dy)
  public solid: Uint8Array; // Solid obstacle mask (1 = solid wall, 0 = fluid)

  // D2Q9 Discrete Lattice Velocities
  // 0: Rest, 1: East, 2: North, 3: West, 4: South, 5: NE, 6: NW, 7: SW, 8: SE
  private readonly cx = [0, 1, 0, -1, 0, 1, -1, -1, 1];
  private readonly cy = [0, 0, 1, 0, -1, 1, 1, -1, -1];
  private readonly w  = [4/9, 1/9, 1/9, 1/9, 1/9, 1/36, 1/36, 1/36, 1/36];
  private readonly opposite = [0, 3, 4, 1, 2, 7, 8, 5, 6];

  constructor(nx = 140, ny = 70, tau = 0.58) {
    this.nx = nx;
    this.ny = ny;
    this.tau = Math.max(0.51, tau);
    const size = nx * ny;
    this.f = new Float32Array(9 * size);
    this.rho = new Float32Array(size).fill(1.0);
    this.ux = new Float32Array(size);
    this.uy = new Float32Array(size);
    this.curl = new Float32Array(size);
    this.solid = new Uint8Array(size);
    this.initializeInflow(0.08);
  }

  public initializeInflow(uInflow: number = 0.08) {
    const { nx, ny, cx, w } = this;
    const size = nx * ny;

    for (let y = 0; y < ny; y++) {
      for (let x = 0; x < nx; x++) {
        const idx = y * nx + x;
        this.rho[idx] = 1.0;
        this.ux[idx] = this.solid[idx] ? 0 : uInflow;
        this.uy[idx] = 0;

        const u2 = uInflow * uInflow;
        for (let i = 0; i < 9; i++) {
          const eu = cx[i] * uInflow;
          const feq = 1.0 * w[i] * (1.0 + 3.0 * eu + 4.5 * eu * eu - 1.5 * u2);
          this.f[i * size + idx] = feq;
        }
      }
    }
  }

  public step(uInflow: number = 0.08) {
    this.collideAndStream();
    this.applyBoundaryConditions(uInflow);
    this.computeMacroscopic();
    this.computeVorticity();
  }

  private collideAndStream() {
    const { nx, ny, tau, cx, cy, w } = this;
    const size = nx * ny;
    const omega = 1.0 / tau;

    const fNew = new Float32Array(9 * size);

    for (let y = 0; y < ny; y++) {
      for (let x = 0; x < nx; x++) {
        const idx = y * nx + x;
        if (this.solid[idx]) continue;

        const d = this.rho[idx];
        const vx = this.ux[idx];
        const vy = this.uy[idx];
        const u2 = vx * vx + vy * vy;

        for (let i = 0; i < 9; i++) {
          const eu = cx[i] * vx + cy[i] * vy;
          const feq = d * w[i] * (1.0 + 3.0 * eu + 4.5 * eu * eu - 1.5 * u2);
          const fPost = this.f[i * size + idx] * (1.0 - omega) + feq * omega;

          const nextX = (x + cx[i] + nx) % nx;
          const nextY = (y + cy[i] + ny) % ny;
          const nextIdx = nextY * nx + nextX;
          fNew[i * size + nextIdx] = fPost;
        }
      }
    }

    this.f.set(fNew);
  }

  private applyBoundaryConditions(uInflow: number) {
    const { nx, ny, cx, cy, w, opposite } = this;
    const size = nx * ny;

    // Solid Obstacle Bounce-Back
    for (let y = 0; y < ny; y++) {
      for (let x = 0; x < nx; x++) {
        const idx = y * nx + x;
        if (!this.solid[idx]) continue;

        for (let i = 1; i < 9; i++) {
          const prevX = x - cx[i];
          const prevY = y - cy[i];
          if (prevX >= 0 && prevX < nx && prevY >= 0 && prevY < ny) {
            const fluidIdx = prevY * nx + prevX;
            if (!this.solid[fluidIdx]) {
              this.f[opposite[i] * size + fluidIdx] = this.f[i * size + idx];
            }
          }
        }
      }
    }

    // Inflow Dirichlet Boundary (Left inlet x = 0)
    for (let y = 0; y < ny; y++) {
      const idx = y * nx + 0;
      if (this.solid[idx]) continue;

      const d = 1.0;
      const vx = uInflow;
      const u2 = vx * vx;

      for (let i = 0; i < 9; i++) {
        const eu = cx[i] * vx;
        this.f[i * size + idx] = d * w[i] * (1.0 + 3.0 * eu + 4.5 * eu * eu - 1.5 * u2);
      }
    }

    // Outflow Neumann Boundary (Right outlet x = nx - 1)
    for (let y = 0; y < ny; y++) {
      const idxOut = y * nx + (nx - 1);
      const idxPrev = y * nx + (nx - 2);
      for (let i = 0; i < 9; i++) {
        this.f[i * size + idxOut] = this.f[i * size + idxPrev];
      }
    }
  }

  private computeMacroscopic() {
    const { nx, ny, cx, cy } = this;
    const size = nx * ny;

    for (let idx = 0; idx < size; idx++) {
      if (this.solid[idx]) {
        this.ux[idx] = 0;
        this.uy[idx] = 0;
        continue;
      }

      let d = 0;
      let sx = 0;
      let sy = 0;

      for (let i = 0; i < 9; i++) {
        const val = this.f[i * size + idx];
        d += val;
        sx += val * cx[i];
        sy += val * cy[i];
      }

      this.rho[idx] = d;
      this.ux[idx] = d > 0 ? sx / d : 0;
      this.uy[idx] = d > 0 ? sy / d : 0;
    }
  }

  private computeVorticity() {
    const { nx, ny } = this;

    for (let y = 1; y < ny - 1; y++) {
      for (let x = 1; x < nx - 1; x++) {
        const idx = y * nx + x;
        if (this.solid[idx]) {
          this.curl[idx] = 0;
          continue;
        }

        const dv_dx = (this.uy[y * nx + (x + 1)] - this.uy[y * nx + (x - 1)]) * 0.5;
        const du_dy = (this.ux[(y + 1) * nx + x] - this.ux[(y - 1) * nx + x]) * 0.5;
        this.curl[idx] = dv_dx - du_dy;
      }
    }
  }

  public setSolidMask(mask: Uint8Array) {
    this.solid.set(mask);
  }

  public getFlowState() {
    return {
      nx: this.nx,
      ny: this.ny,
      ux: this.ux,
      uy: this.uy,
      rho: this.rho,
      curl: this.curl,
      solid: this.solid
    };
  }
}
