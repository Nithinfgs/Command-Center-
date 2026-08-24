import React from 'react';
import type { PartDefinition } from '../../types';

interface Props {
  part: PartDefinition;
  size?: number;
}

export const PartThumbnail: React.FC<Props> = ({ part, size = 64 }) => {
  const { type, color, texturePattern, width: gridW, height: gridH, category } = part;

  // ViewBox coordinates
  const svgWidth = 80;
  const svgHeight = 80;
  const cx = svgWidth / 2;
  const cy = svgHeight / 2;

  // Scale part to fit nicely in 60x60 inner box
  const maxDim = Math.max(gridW, gridH, 2.5);
  const scale = 50 / (maxDim * 12);
  const w = gridW * 12 * scale;
  const h = gridH * 12 * scale;

  return (
    <div 
      className="flex items-center justify-center bg-[#070b14] border border-[#1e293b] rounded p-1 shadow-inner relative overflow-hidden group-hover:border-[#00e5ff]/50 transition-colors"
      style={{ width: size, height: size }}
    >
      <svg 
        viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
        className="w-full h-full drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
      >
        <defs>
          <linearGradient id={`grad_${type}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="25%" stopColor={color} />
            <stop offset="70%" stopColor={color} />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
          <linearGradient id={`engine_plume_${type}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.8" />
            <stop offset="60%" stopColor="#ffb703" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#ff3366" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Command Capsule Shape */}
        {texturePattern === 'cone' && category === 'command' && (
          <g>
            <path
              d={`M ${cx - w/2} ${cy + h/2} Q ${cx} ${cy - h/2 - 4} ${cx + w/2} ${cy + h/2} Z`}
              fill={`url(#grad_${type})`}
              stroke="#00e5ff"
              strokeWidth="1.5"
            />
            {/* Heatshield base */}
            <rect x={cx - w/2} y={cy + h/2 - 3} width={w} height={3} rx="1" fill="#0f172a" stroke="#475569" strokeWidth="0.8" />
            {/* Window */}
            <circle cx={cx} cy={cy} r={3} fill="#00e5ff" stroke="#ffffff" strokeWidth="0.8" />
          </g>
        )}

        {/* Nosecone Shape */}
        {texturePattern === 'cone' && category !== 'command' && (
          <g>
            <path
              d={`M ${cx - w/2} ${cy + h/2} Q ${cx} ${cy - h/2 - 6} ${cx + w/2} ${cy + h/2} Z`}
              fill={`url(#grad_${type})`}
              stroke="#00e5ff"
              strokeWidth="1.5"
            />
            {/* Aerodynamic panel line */}
            <line x1={cx} y1={cy - h/2} x2={cx} y2={cy + h/2} stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" strokeDasharray="2 2" />
          </g>
        )}

        {/* Engine Bell Shape */}
        {texturePattern === 'engine-bell' && (
          <g>
            {/* Powerhead / Turbopump dome */}
            <rect x={cx - w*0.3} y={cy - h/2} width={w*0.6} height={h*0.3} rx="1" fill="#475569" stroke="#94a3b8" strokeWidth="1" />
            {/* Gimbal actuator ring */}
            <rect x={cx - w*0.2} y={cy - h/2 + h*0.3} width={w*0.4} height={h*0.1} fill="#ffb703" />
            {/* Nozzle Bell Cone */}
            <path
              d={`M ${cx - w*0.18} ${cy - h/2 + h*0.4} L ${cx + w*0.18} ${cy - h/2 + h*0.4} L ${cx + w/2} ${cy + h/2} L ${cx - w/2} ${cy + h/2} Z`}
              fill={`url(#grad_${type})`}
              stroke="#00e5ff"
              strokeWidth="1.5"
            />
            {/* Glow at throat */}
            <ellipse cx={cx} cy={cy - h/2 + h*0.42} rx={w*0.12} ry={1.5} fill="#ff3366" />
          </g>
        )}

        {/* Fin Shape */}
        {texturePattern === 'fin' && (
          <g>
            <path
              d={`M ${cx - w/2} ${cy - h/2} L ${cx + w/2} ${cy} L ${cx + w/2} ${cy + h/2} L ${cx - w/2} ${cy + h/2} Z`}
              fill={`url(#grad_${type})`}
              stroke="#00e5ff"
              strokeWidth="1.5"
            />
            {/* Structural rib */}
            <line x1={cx - w/2} y1={cy} x2={cx + w/2} y2={cy} stroke="#38bdf8" strokeWidth="1" />
          </g>
        )}

        {/* Tank / Decoupler / Module Shape */}
        {texturePattern !== 'cone' && texturePattern !== 'engine-bell' && texturePattern !== 'fin' && (
          <g>
            {/* Main Tank Body */}
            <rect
              x={cx - w/2}
              y={cy - h/2}
              width={w}
              height={h}
              rx="2"
              fill={`url(#grad_${type})`}
              stroke="#00e5ff"
              strokeWidth="1.5"
            />
            {/* Internal Ribs / Panels */}
            {h > 15 && (
              <>
                <line x1={cx - w/2} y1={cy - h/4} x2={cx + w/2} y2={cy - h/4} stroke="rgba(0,0,0,0.35)" strokeWidth="1" />
                <line x1={cx - w/2} y1={cy + h/4} x2={cx + w/2} y2={cy + h/4} stroke="rgba(0,0,0,0.35)" strokeWidth="1" />
                <line x1={cx} y1={cy - h/2} x2={cx} y2={cy + h/2} stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" />
              </>
            )}
            {/* Decoupler yellow chevron stripe */}
            {category === 'staging' && (
              <rect x={cx - w/2} y={cy - 2} width={w} height={4} fill="#ffb703" />
            )}
          </g>
        )}
      </svg>
    </div>
  );
};
