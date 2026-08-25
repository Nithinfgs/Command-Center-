import * as THREE from 'three';

/**
 * Creates procedural canvas textures for planetary bodies without external image assets.
 */
export function createEarthTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Deep Ocean Gradient
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, 512);
  oceanGrad.addColorStop(0, '#0F2C59');
  oceanGrad.addColorStop(0.5, '#1E40AF');
  oceanGrad.addColorStop(1, '#0F2C59');
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, 1024, 512);

  // Continents (Africa, Eurasia, Americas, Australia, Antarctica)
  ctx.fillStyle = '#166534'; // Green vegetation

  // North America
  ctx.beginPath();
  ctx.ellipse(220, 140, 90, 60, -0.2, 0, Math.PI * 2);
  ctx.fill();
  // South America
  ctx.beginPath();
  ctx.ellipse(320, 320, 60, 90, 0.3, 0, Math.PI * 2);
  ctx.fill();
  // Eurasia
  ctx.beginPath();
  ctx.ellipse(650, 150, 160, 80, 0.1, 0, Math.PI * 2);
  ctx.fill();
  // Africa
  ctx.fillStyle = '#854D0E'; // Savanna / desert
  ctx.beginPath();
  ctx.ellipse(540, 260, 70, 90, 0.05, 0, Math.PI * 2);
  ctx.fill();
  // Australia
  ctx.fillStyle = '#B45309';
  ctx.beginPath();
  ctx.ellipse(820, 360, 50, 40, -0.1, 0, Math.PI * 2);
  ctx.fill();

  // Desert Saharan Band
  ctx.fillStyle = '#D97706';
  ctx.beginPath();
  ctx.ellipse(540, 210, 60, 25, 0, 0, Math.PI * 2);
  ctx.fill();
  // Arabia & Middle East
  ctx.beginPath();
  ctx.ellipse(620, 200, 35, 25, 0.2, 0, Math.PI * 2);
  ctx.fill();

  // Polar Ice Caps
  ctx.fillStyle = '#F8FAFC';
  ctx.fillRect(0, 0, 1024, 28);
  ctx.fillRect(0, 478, 1024, 34);

  // Cloud / atmospheric swirls
  ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
  for (let i = 0; i < 18; i++) {
    ctx.beginPath();
    const cx = (i * 65 + 30) % 1024;
    const cy = 80 + (i * 37) % 340;
    ctx.ellipse(cx, cy, 70 + (i % 5) * 15, 12 + (i % 3) * 6, (i * 0.4), 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

export function createMoonTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.fillStyle = '#71717A';
  ctx.fillRect(0, 0, 512, 256);

  // Lunar Maria (Dark basaltic plains)
  ctx.fillStyle = '#3F3F46';
  ctx.beginPath();
  ctx.ellipse(180, 100, 60, 45, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(260, 90, 50, 40, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(210, 150, 40, 35, -0.1, 0, Math.PI * 2);
  ctx.fill();

  // Impact Craters
  ctx.fillStyle = '#A1A1AA';
  for (let i = 0; i < 30; i++) {
    const x = (i * 37 + 23) % 512;
    const y = (i * 19 + 17) % 256;
    const r = 3 + (i % 5) * 2;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  return new THREE.CanvasTexture(canvas);
}

export function createMarsTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.fillStyle = '#C2410C'; // Iron Oxide Red
  ctx.fillRect(0, 0, 512, 256);

  // Dark Basaltic Highlands
  ctx.fillStyle = '#7C2D12';
  ctx.beginPath();
  ctx.ellipse(220, 140, 90, 35, 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(380, 120, 60, 30, -0.1, 0, Math.PI * 2);
  ctx.fill();

  // Polar Ice Caps
  ctx.fillStyle = '#FEF2F2';
  ctx.fillRect(0, 0, 512, 14);
  ctx.fillRect(0, 242, 512, 14);

  return new THREE.CanvasTexture(canvas);
}

export function createJupiterTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const colors = ['#D97706', '#FEF3C7', '#B45309', '#FDE68A', '#92400E', '#FBBF24', '#78350F'];
  const bandHeight = 256 / colors.length;
  colors.forEach((c, idx) => {
    ctx.fillStyle = c;
    ctx.fillRect(0, idx * bandHeight, 512, bandHeight);
  });

  // Great Red Spot
  ctx.fillStyle = '#DC2626';
  ctx.beginPath();
  ctx.ellipse(320, 160, 24, 14, -0.05, 0, Math.PI * 2);
  ctx.fill();

  return new THREE.CanvasTexture(canvas);
}
