"use client";

import type { ModuleId, SofaModule } from "@/types/configurator";

// ─── Color helpers ────────────────────────────────────────────────────────────

function parseHex(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function lighten(hex: string, amount: number) {
  const [r, g, b] = parseHex(hex);
  return `rgb(${Math.min(255, r + amount)},${Math.min(255, g + amount)},${Math.min(255, b + amount)})`;
}

function darken(hex: string, amount: number) {
  const [r, g, b] = parseHex(hex);
  return `rgb(${Math.max(0, r - amount)},${Math.max(0, g - amount)},${Math.max(0, b - amount)})`;
}

// ─── SVG illustrations ────────────────────────────────────────────────────────

// Shared sofa SVG — adjustable cushion count and width
function SofaSVG({ color, cushions = 3, scale = 1 }: { color: string; cushions?: number; scale?: number }) {
  const base  = color;
  const dark  = darken(color, 40);
  const light = lighten(color, 30);
  const W     = 130 * scale;
  const startX = (180 - W) / 2;
  const cw    = (W - 28) / cushions;

  return (
    <svg viewBox="0 0 180 130" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Shadow */}
      <ellipse cx="90" cy="122" rx={W / 2 + 8} ry="6" fill="rgba(0,0,0,0.12)" />

      {/* Base frame */}
      <rect x={startX - 2} y="84" width={W + 4} height="13" rx="2" fill={dark} />

      {/* Seat cushions */}
      {Array.from({ length: cushions }, (_, i) => (
        <rect key={i}
          x={startX + 6 + cw * i + (i > 0 ? 2 : 0)}
          y="66" width={cw - (i > 0 ? 4 : 2)} height="20"
          rx="3" fill={base}
        />
      ))}

      {/* Back support */}
      <rect x={startX - 2} y="28" width={W + 4} height="40" rx="2" fill={dark} />

      {/* Back cushions */}
      {Array.from({ length: cushions }, (_, i) => (
        <rect key={i}
          x={startX + 4 + cw * i + (i > 0 ? 3 : 0)}
          y="31" width={cw - (i > 0 ? 5 : 3)} height="34"
          rx="4" fill={light}
        />
      ))}

      {/* Left armrest */}
      <rect x={startX - 12} y="28" width="12" height="58" rx="2" fill={dark} />
      <rect x={startX - 14} y="24" width="16" height="6" rx="2" fill={base} />

      {/* Right armrest */}
      <rect x={startX + W} y="28" width="12" height="58" rx="2" fill={dark} />
      <rect x={startX + W - 2} y="24" width="16" height="6" rx="2" fill={base} />

      {/* Legs */}
      {[startX, startX + W / 3, startX + (W * 2) / 3, startX + W - 5].slice(0, cushions > 2 ? 4 : 2).map((lx, i) => (
        <rect key={i} x={lx + 2} y="97" width="5" height="10" rx="1.5" fill="#6B4E37" />
      ))}
    </svg>
  );
}

function ChaiseSVG({ color }: { color: string }) {
  const base  = color;
  const dark  = darken(color, 40);
  const light = lighten(color, 30);

  return (
    <svg viewBox="0 0 200 130" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="105" cy="122" rx="85" ry="6" fill="rgba(0,0,0,0.12)" />

      {/* Main sofa body */}
      <rect x="65" y="82" width="100" height="13" rx="2" fill={dark} />
      {/* Seat cushion main */}
      <rect x="70" y="65" width="92" height="19" rx="3" fill={base} />
      {/* Back support */}
      <rect x="63" y="27" width="102" height="40" rx="2" fill={dark} />
      {/* Back cushions (2) */}
      <rect x="67" y="30" width="46" height="34" rx="4" fill={light} />
      <rect x="116" y="30" width="46" height="34" rx="4" fill={light} />
      {/* Right armrest */}
      <rect x="165" y="27" width="11" height="68" rx="2" fill={dark} />
      <rect x="163" y="23" width="15" height="6" rx="2" fill={base} />

      {/* Extended chaise section (left) */}
      <rect x="20" y="65" width="50" height="30" rx="3" fill={base} />
      <rect x="20" y="95" width="50" height="11" rx="2" fill={dark} />
      {/* Chaise divider */}
      <rect x="66" y="65" width="4" height="30" rx="1" fill={dark} />

      {/* Left armrest (short, at front of chaise) */}
      <rect x="16" y="55" width="8" height="10" rx="2" fill={dark} />
      <rect x="14" y="51" width="12" height="6" rx="2" fill={base} />

      {/* Legs */}
      <rect x="22" y="106" width="5" height="10" rx="1.5" fill="#6B4E37" />
      <rect x="60" y="95" width="5" height="10" rx="1.5" fill="#6B4E37" />
      <rect x="75" y="95" width="5" height="10" rx="1.5" fill="#6B4E37" />
      <rect x="160" y="95" width="5" height="10" rx="1.5" fill="#6B4E37" />
    </svg>
  );
}

function CornerSVG({ color, flip = false }: { color: string; flip?: boolean }) {
  const base  = color;
  const dark  = darken(color, 40);
  const light = lighten(color, 30);

  const content = (
    <>
      <ellipse cx="100" cy="122" rx="90" ry="6" fill="rgba(0,0,0,0.12)" />

      {/* Main horizontal sofa (bottom) */}
      <rect x="30" y="78" width="120" height="12" rx="2" fill={dark} />
      <rect x="33" y="62" width="56" height="18" rx="3" fill={base} />
      <rect x="92" y="62" width="55" height="18" rx="3" fill={base} />
      {/* Back (main) */}
      <rect x="28" y="25" width="122" height="38" rx="2" fill={dark} />
      <rect x="32" y="28" width="56" height="32" rx="4" fill={light} />
      <rect x="91" y="28" width="56" height="32" rx="4" fill={light} />

      {/* Left armrest (main) */}
      <rect x="18" y="25" width="12" height="65" rx="2" fill={dark} />
      <rect x="16" y="21" width="16" height="6" rx="2" fill={base} />

      {/* Corner piece */}
      <rect x="148" y="25" width="38" height="67" rx="2" fill={base} />
      <rect x="148" y="78" width="38" height="12" rx="2" fill={dark} />
      <rect x="150" y="28" width="34" height="47" rx="3" fill={light} />

      {/* Right arm of corner (vertical section top) */}
      <rect x="148" y="13" width="38" height="13" rx="2" fill={dark} />
      <rect x="184" y="25" width="12" height="65" rx="2" fill={dark} />

      {/* Legs */}
      <rect x="22" y="90" width="5" height="10" rx="1.5" fill="#6B4E37" />
      <rect x="80" y="90" width="5" height="10" rx="1.5" fill="#6B4E37" />
      <rect x="143" y="90" width="5" height="10" rx="1.5" fill="#6B4E37" />
      <rect x="180" y="90" width="5" height="10" rx="1.5" fill="#6B4E37" />
    </>
  );

  return (
    <svg viewBox="0 0 200 130" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={flip ? { transform: "scaleX(-1)" } : undefined}
    >
      {content}
    </svg>
  );
}

function OttomanSVG({ color }: { color: string }) {
  const base  = color;
  const dark  = darken(color, 40);
  const light = lighten(color, 25);

  return (
    <svg viewBox="0 0 180 110" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="90" cy="102" rx="55" ry="6" fill="rgba(0,0,0,0.12)" />
      {/* Base */}
      <rect x="40" y="72" width="100" height="14" rx="3" fill={dark} />
      {/* Top cushion */}
      <rect x="36" y="40" width="108" height="34" rx="8" fill={base} />
      {/* Button tufts */}
      <circle cx="68" cy="57" r="4" fill={dark} />
      <circle cx="90" cy="57" r="4" fill={dark} />
      <circle cx="112" cy="57" r="4" fill={dark} />
      {/* Top face highlight */}
      <rect x="50" y="40" width="80" height="8" rx="4" fill={light} opacity="0.4" />
      {/* Legs */}
      <rect x="46" y="86" width="6" height="10" rx="2" fill="#6B4E37" />
      <rect x="128" y="86" width="6" height="10" rx="2" fill="#6B4E37" />
    </svg>
  );
}

function SofaBedSVG({ color }: { color: string }) {
  const base  = color;
  const dark  = darken(color, 40);
  const light = lighten(color, 30);

  return (
    <svg viewBox="0 0 200 130" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="100" cy="122" rx="88" ry="6" fill="rgba(0,0,0,0.12)" />

      {/* Base */}
      <rect x="20" y="82" width="155" height="13" rx="2" fill={dark} />
      {/* 2 seat cushions */}
      <rect x="24" y="64" width="72" height="20" rx="3" fill={base} />
      <rect x="99" y="64" width="72" height="20" rx="3" fill={base} />
      {/* Cushion divider */}
      <rect x="95" y="64" width="4" height="20" fill={dark} />
      {/* Back support */}
      <rect x="18" y="28" width="157" height="38" rx="2" fill={dark} />
      {/* 2 back cushions */}
      <rect x="22" y="31" width="72" height="32" rx="4" fill={light} />
      <rect x="97" y="31" width="72" height="32" rx="4" fill={light} />

      {/* Left armrest */}
      <rect x="8" y="28" width="12" height="67" rx="2" fill={dark} />
      <rect x="6" y="24" width="16" height="6" rx="2" fill={base} />
      {/* Right armrest */}
      <rect x="175" y="28" width="12" height="67" rx="2" fill={dark} />
      <rect x="173" y="24" width="16" height="6" rx="2" fill={base} />

      {/* Sofa-bed indicator icon (small) */}
      <rect x="158" y="12" width="22" height="14" rx="3" fill="#e5e5e5" />
      <rect x="161" y="15" width="7" height="8" rx="1.5" fill="#aaaaaa" />
      <rect x="170" y="15" width="7" height="8" rx="1.5" fill="#aaaaaa" />

      {/* Legs */}
      <rect x="14" y="95" width="6" height="10" rx="1.5" fill="#6B4E37" />
      <rect x="80" y="95" width="6" height="10" rx="1.5" fill="#6B4E37" />
      <rect x="107" y="95" width="6" height="10" rx="1.5" fill="#6B4E37" />
      <rect x="175" y="95" width="6" height="10" rx="1.5" fill="#6B4E37" />
    </svg>
  );
}

// ─── Module thumbnail card ────────────────────────────────────────────────────

const MODULE_SVG: Record<ModuleId, (color: string) => React.ReactNode> = {
  "sofa-2":    (c) => <SofaSVG color={c} cushions={2} scale={0.82} />,
  "sofa-3":    (c) => <SofaSVG color={c} cushions={3} scale={1.0}  />,
  "chaise":    (c) => <ChaiseSVG color={c} />,
  "corner-l":  (c) => <CornerSVG color={c} flip={false} />,
  "corner-r":  (c) => <CornerSVG color={c} flip={true}  />,
  "ottoman":   (c) => <OttomanSVG color={c} />,
  "sofa-bed":  (c) => <SofaBedSVG color={c} />,
};

interface ModuleThumbnailProps {
  module: SofaModule;
  fabricHex: string;
  isSelected: boolean;
  onClick: () => void;
}

export default function ModuleThumbnail({ module, fabricHex, isSelected, onClick }: ModuleThumbnailProps) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col items-center gap-2 text-left focus:outline-none"
      aria-pressed={isSelected}
    >
      <div
        className="w-full rounded-xl overflow-hidden transition-all"
        style={{
          background: "#f4f4f4",
          border: isSelected ? "2px solid #111111" : "2px solid transparent",
          padding: "10px 6px 6px",
          boxShadow: isSelected ? "0 0 0 1px #111111" : "none",
        }}
      >
        {MODULE_SVG[module.id]?.(fabricHex) ?? <SofaSVG color={fabricHex} />}
      </div>
      <span
        className="text-xs text-center leading-snug transition-colors"
        style={{
          color: isSelected ? "#111111" : "#6b7280",
          fontWeight: isSelected ? 500 : 400,
        }}
      >
        {module.name}
      </span>
    </button>
  );
}
