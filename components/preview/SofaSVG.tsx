"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { FurnitureType, DimensionSize, LegType } from "@/types/configurator";
import { legMaterialColors } from "@/lib/furniture-data";

interface SofaSVGProps {
  fabricColor: string;
  legType: LegType;
  legMaterial: string;
  furnitureType: FurnitureType;
  dimension: DimensionSize;
  hasLumbar: boolean;
  hasThrow: boolean;
}

const t = { duration: 0.45, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] };

const ISO = (ix: number, iy: number, iz: number, ox = 200, oy = 260) => ({
  x: ox + (ix - iy) * 0.866,
  y: oy + (ix + iy) * 0.5 - iz,
});

function pt(ix: number, iy: number, iz: number, ox = 200, oy = 260) {
  const p = ISO(ix, iy, iz, ox, oy);
  return `${p.x},${p.y}`;
}

function poly(points: string, fill: string, stroke?: string, opacity = 1) {
  return (
    <polygon points={points} fill={fill} stroke={stroke ?? fill} strokeWidth="0.5" opacity={opacity} />
  );
}

function darken(hex: string, amount = 20) {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, (num >> 16) - amount);
  const g = Math.max(0, ((num >> 8) & 0xff) - amount);
  const b = Math.max(0, (num & 0xff) - amount);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

function lighten(hex: string, amount = 20) {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, (num >> 16) + amount);
  const g = Math.min(255, ((num >> 8) & 0xff) + amount);
  const b = Math.min(255, (num & 0xff) + amount);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

interface IsoLegProps { bx: number; by: number; lh: number; color: string; legType: LegType; ox?: number; oy?: number; }

function IsoLeg({ bx, by, lh, color, legType, ox = 200, oy = 260 }: IsoLegProps) {
  const p = (ix: number, iy: number, iz: number) => pt(ix, iy, iz, ox, oy);
  const iso = (ix: number, iy: number, iz: number) => ISO(ix, iy, iz, ox, oy);
  const w = 5;

  if (legType === "hairpin") {
    return (
      <>
        <line x1={iso(bx-1,by-1,0).x} y1={iso(bx-1,by-1,0).y} x2={iso(bx-3,by-3,lh).x} y2={iso(bx-3,by-3,lh).y} stroke={color} strokeWidth="2" strokeLinecap="round" />
        <line x1={iso(bx+1,by+1,0).x} y1={iso(bx+1,by+1,0).y} x2={iso(bx+1,by+1,lh).x} y2={iso(bx+1,by+1,lh).y} stroke={color} strokeWidth="2" strokeLinecap="round" />
      </>
    );
  }
  if (legType === "bun") {
    const c = iso(bx, by, lh / 2);
    return <ellipse cx={c.x} cy={c.y} rx={w} ry={lh * 0.6} fill={color} />;
  }
  return (
    <>
      {poly(`${p(bx,by,lh)} ${p(bx+w,by,lh)} ${p(bx+w,by+w,lh)} ${p(bx,by+w,lh)}`, color)}
      {poly(`${p(bx+w,by,0)} ${p(bx+w,by,lh)} ${p(bx+w,by+w,lh)} ${p(bx+w,by+w,0)}`, darken(color,25))}
      {poly(`${p(bx,by+w,0)} ${p(bx+w,by+w,0)} ${p(bx+w,by+w,lh)} ${p(bx,by+w,lh)}`, darken(color,40))}
    </>
  );
}


export default function SofaSVG({ fabricColor, legType, legMaterial, dimension, hasLumbar, hasThrow }: SofaSVGProps) {
  const legColor = legMaterialColors[legMaterial] ?? "#5C3D1E";
  const top = lighten(fabricColor, 18);
  const front = darken(fabricColor, 10);
  const side = darken(fabricColor, 28);
  const dark = darken(fabricColor, 45);
  const mid = darken(fabricColor, 18);

  // Width based on dimension
  const W = dimension === "small" ? 110 : dimension === "medium" ? 150 : 190;
  const D = 70; // depth
  const H = 38; // seat height
  const BH = 58; // back height
  const LH = 18; // leg height
  const AW = 16; // armrest width

  // Sofa base origin
  const ox = 200, oy = 260;

  const p = (ix: number, iy: number, iz: number) => pt(ix, iy, iz, ox, oy);

  return (
    <svg viewBox="0 0 400 360" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" style={{ filter: "drop-shadow(0 16px 32px rgba(0,0,0,0.18))" }}>

      {/* ── Legs ── */}
      <motion.g key={`legs-${legType}-${legMaterial}`} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={t}>
        <IsoLeg bx={AW} by={2} lh={LH} color={legColor} legType={legType} />
        <IsoLeg bx={W - AW - 6} by={2} lh={LH} color={legColor} legType={legType} />
        <IsoLeg bx={AW} by={D - 10} lh={LH} color={legColor} legType={legType} />
        <IsoLeg bx={W - AW - 6} by={D - 10} lh={LH} color={legColor} legType={legType} />
      </motion.g>

      {/* ── Sofa body ── */}
      <motion.g key={`body-${fabricColor}-${dimension}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={t}>

        {/* Platform top */}
        {poly(`${p(0,0,H)} ${p(W,0,H)} ${p(W,D,H)} ${p(0,D,H)}`, top)}
        {/* Platform front face */}
        {poly(`${p(W,0,0)} ${p(W,0,H)} ${p(0,0,H)} ${p(0,0,0)}`, front)}
        {/* Platform right face */}
        {poly(`${p(W,0,0)} ${p(W,D,0)} ${p(W,D,H)} ${p(W,0,H)}`, side)}

        {/* Seat cushion top (slightly recessed) */}
        {poly(`${p(AW,4,H)} ${p(W-AW,4,H)} ${p(W-AW,D-2,H)} ${p(AW,D-2,H)}`, mid)}

        {/* Cushion divider lines on top */}
        {dimension !== "small" && (
          <>
            <line
              x1={ISO(W * 0.38, 4, H, ox, oy).x} y1={ISO(W * 0.38, 4, H, ox, oy).y}
              x2={ISO(W * 0.38, D - 2, H, ox, oy).x} y2={ISO(W * 0.38, D - 2, H, ox, oy).y}
              stroke={dark} strokeWidth="1" opacity="0.35"
            />
            {dimension === "large" && (
              <line
                x1={ISO(W * 0.65, 4, H, ox, oy).x} y1={ISO(W * 0.65, 4, H, ox, oy).y}
                x2={ISO(W * 0.65, D - 2, H, ox, oy).x} y2={ISO(W * 0.65, D - 2, H, ox, oy).y}
                stroke={dark} strokeWidth="1" opacity="0.35"
              />
            )}
          </>
        )}

        {/* Left armrest */}
        {poly(`${p(0,0,H)} ${p(AW,0,H)} ${p(AW,D,H)} ${p(0,D,H)}`, top)}
        {poly(`${p(0,0,H+BH-6)} ${p(AW,0,H+BH-6)} ${p(AW,D,H+BH-6)} ${p(0,D,H+BH-6)}`, lighten(fabricColor, 22))}
        {poly(`${p(0,0,H)} ${p(0,0,H+BH-6)} ${p(AW,0,H+BH-6)} ${p(AW,0,H)}`, front)}
        {poly(`${p(AW,0,H)} ${p(AW,D,H)} ${p(AW,D,H+BH-6)} ${p(AW,0,H+BH-6)}`, darken(fabricColor, 15))}
        {poly(`${p(0,D,H)} ${p(AW,D,H)} ${p(AW,D,H+BH-6)} ${p(0,D,H+BH-6)}`, side)}
        {/* Arm cap front face */}
        {poly(`${p(0,0,H+BH-6)} ${p(AW,0,H+BH-6)} ${p(AW,0,H+BH)} ${p(0,0,H+BH)}`, darken(front, 5))}
        {/* Arm cap top */}
        {poly(`${p(0,0,H+BH)} ${p(AW,0,H+BH)} ${p(AW,D,H+BH)} ${p(0,D,H+BH)}`, lighten(fabricColor, 28))}
        {/* Arm cap side */}
        {poly(`${p(0,D,H+BH-6)} ${p(AW,D,H+BH-6)} ${p(AW,D,H+BH)} ${p(0,D,H+BH)}`, darken(side, 5))}

        {/* Right armrest */}
        {poly(`${p(W-AW,0,H)} ${p(W,0,H)} ${p(W,D,H)} ${p(W-AW,D,H)}`, top)}
        {poly(`${p(W-AW,0,H+BH-6)} ${p(W,0,H+BH-6)} ${p(W,D,H+BH-6)} ${p(W-AW,D,H+BH-6)}`, lighten(fabricColor, 22))}
        {poly(`${p(W-AW,0,H)} ${p(W,0,H)} ${p(W,0,H+BH-6)} ${p(W-AW,0,H+BH-6)}`, front)}
        {poly(`${p(W,0,H)} ${p(W,D,H)} ${p(W,D,H+BH-6)} ${p(W,0,H+BH-6)}`, side)}
        {poly(`${p(W-AW,D,H)} ${p(W,D,H)} ${p(W,D,H+BH-6)} ${p(W-AW,D,H+BH-6)}`, side)}
        {poly(`${p(W-AW,0,H+BH-6)} ${p(W,0,H+BH-6)} ${p(W,0,H+BH)} ${p(W-AW,0,H+BH)}`, darken(front, 5))}
        {poly(`${p(W-AW,0,H+BH)} ${p(W,0,H+BH)} ${p(W,D,H+BH)} ${p(W-AW,D,H+BH)}`, lighten(fabricColor, 28))}
        {poly(`${p(W-AW,D,H+BH-6)} ${p(W,D,H+BH-6)} ${p(W,D,H+BH)} ${p(W-AW,D,H+BH)}`, darken(side, 5))}

        {/* Backrest top */}
        {poly(`${p(AW,D-12,H)} ${p(W-AW,D-12,H)} ${p(W-AW,D,H)} ${p(AW,D,H)}`, top)}
        {/* Backrest front face (visible top strip) */}
        {poly(`${p(AW,D-12,H)} ${p(W-AW,D-12,H)} ${p(W-AW,D-12,H+BH)} ${p(AW,D-12,H+BH)}`, lighten(fabricColor, 8))}
        {/* Backrest top face */}
        {poly(`${p(AW,D-12,H+BH)} ${p(W-AW,D-12,H+BH)} ${p(W-AW,D,H+BH)} ${p(AW,D,H+BH)}`, lighten(fabricColor, 25))}
        {/* Backrest side (right) */}
        {poly(`${p(W-AW,D-12,H)} ${p(W-AW,D,H)} ${p(W-AW,D,H+BH)} ${p(W-AW,D-12,H+BH)}`, side)}
        {/* Backrest back face */}
        {poly(`${p(AW,D,H)} ${p(W-AW,D,H)} ${p(W-AW,D,H+BH)} ${p(AW,D,H+BH)}`, darken(fabricColor, 35))}

      </motion.g>

      {/* ── Lumbar pillow ── */}
      <AnimatePresence>
        {hasLumbar && (
          <motion.g initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={t}>
            {poly(
              `${p(W*0.3,D-14,H+BH*0.35)} ${p(W*0.7,D-14,H+BH*0.35)} ${p(W*0.7,D-14,H+BH*0.7)} ${p(W*0.3,D-14,H+BH*0.7)}`,
              darken(fabricColor, 5), dark, 0.92
            )}
            {poly(
              `${p(W*0.3,D-14,H+BH*0.7)} ${p(W*0.7,D-14,H+BH*0.7)} ${p(W*0.7,D-10,H+BH*0.7)} ${p(W*0.3,D-10,H+BH*0.7)}`,
              darken(fabricColor, 20), dark, 0.85
            )}
          </motion.g>
        )}
      </AnimatePresence>

      {/* ── Throw blanket ── */}
      <AnimatePresence>
        {hasThrow && (
          <motion.g initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} transition={t}>
            {poly(
              `${p(W*0.6,2,H+4)} ${p(W*0.85,2,H+4)} ${p(W*0.85,D*0.5,H+4)} ${p(W*0.6,D*0.5,H+4)}`,
              lighten(fabricColor, 15), undefined, 0.78
            )}
            {poly(
              `${p(W*0.85,2,H)} ${p(W*0.85,2,H+4)} ${p(W*0.85,D*0.5,H+4)} ${p(W*0.85,D*0.5,H)}`,
              darken(fabricColor, 5), undefined, 0.7
            )}
          </motion.g>
        )}
      </AnimatePresence>

    </svg>
  );
}
