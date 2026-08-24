import React from 'react';
import type { PartDefinition } from '../../types';

interface Props {
  part: PartDefinition;
  size?: number;
}

export const PartThumbnail: React.FC<Props> = ({ part, size = 64 }) => {
  const { type, color, texturePattern, width: gridW, height: gridH, category } = part;

  const svgWidth = 80;
  const svgHeight = 80;
  const cx = svgWidth / 2;
  const cy = svgHeight / 2;

  const maxDim = Math.max(gridW, gridH, 2.5);
  const scale = 52 / (maxDim * 12);
  const w = gridW * 12 * scale;
  const h = gridH * 12 * scale;

  return (
    <div 
      className="flex items-center justify-center bg-[#0E1520] border border-[#263548]/60 rounded-md p-1 shadow-sm relative overflow-hidden group-hover:border-[#38BDF8]/60 transition-colors"
      style={{ width: size, height: size }}
    >
      <svg 
        viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
        className="w-full h-full drop-shadow-md"
      >
        <defs>
          <linearGradient id={`thumb_grad_${type}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0F172A" />
            <stop offset="25%" stopColor={color || '#94A3B8'} />
            <stop offset="55%" stopColor="#FFFFFF" />
            <stop offset="75%" stopColor={color || '#94A3B8'} />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>
        </defs>

        {/* 1. Command Capsule */}
        {category === 'command' && (
          <g>
            <path
              d={`M ${cx - w/2} ${cy + h/2} L ${cx - w*0.22} ${cy - h/2} L ${cx + w*0.22} ${cy - h/2} L ${cx + w/2} ${cy + h/2} Z`}
              fill={`url(#thumb_grad_${type})`}
              stroke="#263548"
              strokeWidth="1.2"
            />
            {/* Heatshield base */}
            <rect x={cx - w/2} y={cy + h/2 - 2.5} width={w} height={2.5} rx="1" fill="#1E293B" />
            {/* Viewport */}
            <circle cx={cx} cy={cy - h*0.08} r={3} fill="#38BDF8" stroke="#FFFFFF" strokeWidth="0.8" />
          </g>
        )}

        {/* 2. Nosecone */}
        {category === 'aerodynamics' && texturePattern === 'cone' && (
          <g>
            <path
              d={`M ${cx - w/2} ${cy + h/2} Q ${cx} ${cy - h/2 - 6} ${cx + w/2} ${cy + h/2} Z`}
              fill={`url(#thumb_grad_${type})`}
              stroke="#263548"
              strokeWidth="1.2"
            />
            {/* Pitot static probe */}
            <line x1={cx} y1={cy - h/2 - 2} x2={cx} y2={cy - h/2 - 8} stroke="#94A3B8" strokeWidth="1.5" />
          </g>
        )}

        {/* 3. Engine Bell */}
        {category === 'engine' && (
          <g>
            {/* Powerhead / Turbopump */}
            <rect x={cx - w*0.35} y={cy - h/2} width={w*0.7} height={h*0.3} rx="1" fill="#1E293B" stroke="#475569" strokeWidth="0.8" />
            {/* Feed pipe */}
            <line x1={cx - w*0.2} y1={cy - h/2} x2={cx - w*0.2} y2={cy - h/2 + h*0.3} stroke="#FBBF24" strokeWidth="1.2" />
            <line x1={cx + w*0.2} y1={cy - h/2} x2={cx + w*0.2} y2={cy - h/2 + h*0.3} stroke="#FBBF24" strokeWidth="1.2" />
            {/* Nozzle Bell */}
            <path
              d={`M ${cx - w*0.2} ${cy - h/2 + h*0.35} L ${cx + w*0.2} ${cy - h/2 + h*0.35} L ${cx + w/2} ${cy + h/2} L ${cx - w/2} ${cy + h/2} Z`}
              fill={`url(#thumb_grad_${type})`}
              stroke="#0F172A"
              strokeWidth="1.2"
            />
            {/* Throat hot ring */}
            <line x1={cx - w*0.18} y1={cy - h/2 + h*0.35} x2={cx + w*0.18} y2={cy - h/2 + h*0.35} stroke="#F43F5E" strokeWidth="1.5" />
          </g>
        )}

        {/* 4. Fin Shape */}
        {texturePattern === 'fin' && (
          <g>
            <path
              d={`M ${cx + w/2} ${cy - h/2} L ${cx - w/2} ${cy + h*0.2} L ${cx - w/2} ${cy + h/2} L ${cx + w/2} ${cy + h/2} Z`}
              fill={color || '#38BDF8'}
              stroke="#263548"
              strokeWidth="1.2"
            />
            {/* Leading edge bevel */}
            <line x1={cx + w/2} y1={cy - h/2} x2={cx - w/2} y2={cy + h*0.2} stroke="#FFFFFF" strokeWidth="1.2" />
          </g>
        )}

        {/* 5. Decoupler / Staging */}
        {category === 'staging' && (
          <g>
            <rect x={cx - w/2} y={cy - h/2} width={w} height={h} rx="1" fill="#1E293B" stroke="#263548" strokeWidth="1" />
            {/* Warning stripes */}
            <line x1={cx - w/2 + 2} y1={cy} x2={cx + w/2 - 2} y2={cy} stroke="#FBBF24" strokeWidth="2.5" strokeDasharray="4 3" />
          </g>
        )}

        {/* 6. Fuel Tank / General Body */}
        {category === 'fuel' && (
          <g>
            <rect
              x={cx - w/2}
              y={cy - h/2}
              width={w}
              height={h}
              rx="1.5"
              fill={`url(#thumb_grad_${type})`}
              stroke="#263548"
              strokeWidth="1.2"
            />
            {/* Weld seam ribs */}
            {h > 18 && (
              <>
                <line x1={cx - w/2} y1={cy - h/3} x2={cx + w/2} y2={cy - h/3} stroke="rgba(0,0,0,0.3)" strokeWidth="0.8" />
                <line x1={cx - w/2} y1={cy + h/3} x2={cx + w/2} y2={cy + h/3} stroke="rgba(0,0,0,0.3)" strokeWidth="0.8" />
              </>
            )}
            {/* External feedline */}
            <rect x={cx + w*0.3} y={cy - h/2} width={2.5} height={h} fill="#475569" />
          </g>
        )}

        {/* 7. Solar Array */}
        {type === 'solar_array_gigantor' && (
          <g>
            <rect x={cx - w/2} y={cy - h/2} width={w} height={h} rx="1" fill="#1E3A8A" stroke="#263548" strokeWidth="1.2" />
            <line x1={cx} y1={cy - h/2} x2={cx} y2={cy + h/2} stroke="#FBBF24" strokeWidth="0.8" />
            <line x1={cx - w/2} y1={cy} x2={cx + w/2} y2={cy} stroke="#FBBF24" strokeWidth="0.8" />
          </g>
        )}
      </svg>
    </div>
  );
};
