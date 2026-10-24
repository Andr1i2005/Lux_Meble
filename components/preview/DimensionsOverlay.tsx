"use client";

import { motion, AnimatePresence } from "framer-motion";

interface Dims { w: number; d: number; h: number }

interface Props {
  show: boolean;
  dims: Dims;
}

// Badge component for dimension labels
function DimBadge({ x, y, label, anchor = "center" }: {
  x: string; y: string; label: string; anchor?: "center" | "right" | "left"
}) {
  const tx = anchor === "right" ? "-100%" : anchor === "left" ? "0%" : "-50%";
  return (
    <g>
      <foreignObject
        x={x} y={y}
        width="85" height="28"
        style={{ overflow: "visible" }}
      >
        <div
          style={{
            transform: `translateX(${tx}) translateY(-50%)`,
            display: "inline-flex",
            alignItems: "center",
            padding: "3px 10px",
            background: "#111111",
            color: "#ffffff",
            fontSize: "12px",
            fontWeight: 500,
            fontFamily: "inherit",
            borderRadius: "20px",
            whiteSpace: "nowrap",
            letterSpacing: "0.02em",
            lineHeight: 1.4,
          }}
        >
          {label}
        </div>
      </foreignObject>
    </g>
  );
}

export default function DimensionsOverlay({ show, dims }: Props) {
  const strokeProps = {
    stroke: "#1a1a1a",
    strokeWidth: "1.5",
    strokeLinecap: "round" as const,
    markerEnd: "url(#arrow)",
    markerStart: "url(#arrow-r)",
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <svg
            viewBox="0 0 1000 700"
            preserveAspectRatio="xMidYMid meet"
            className="w-full h-full"
            style={{ overflow: "visible" }}
          >
            <defs>
              {/* Arrowhead pointing right/down */}
              <marker id="arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 Z" fill="#1a1a1a" />
              </marker>
              {/* Arrowhead pointing left/up */}
              <marker id="arrow-r" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto-start-reverse">
                <path d="M0,0 L6,3 L0,6 Z" fill="#1a1a1a" />
              </marker>
            </defs>

            {/* ── Width line (horizontal, below sofa) ── */}
            {/* Vertical tick — left */}
            <line x1="205" y1="562" x2="205" y2="598" stroke="#1a1a1a" strokeWidth="1.5" strokeLinecap="round" />
            {/* Vertical tick — right */}
            <line x1="688" y1="562" x2="688" y2="598" stroke="#1a1a1a" strokeWidth="1.5" strokeLinecap="round" />
            {/* Horizontal arrow line */}
            <line x1="218" y1="585" x2="675" y2="585" {...strokeProps} />
            {/* Width label */}
            <DimBadge x="448" y="585" label={`${dims.w} cm`} />

            {/* ── Depth line (diagonal, front-right) ── */}
            {/* Tick at right-front corner */}
            <line x1="688" y1="562" x2="730" y2="540" stroke="#1a1a1a" strokeWidth="1.5" strokeLinecap="round" />
            {/* Tick at right-back corner */}
            <line x1="760" y1="438" x2="800" y2="415" stroke="#1a1a1a" strokeWidth="1.5" strokeLinecap="round" />
            {/* Diagonal arrow */}
            <line x1="725" y1="552" x2="793" y2="428" {...strokeProps} />
            {/* Depth label */}
            <DimBadge x="760" y="495" label={`${dims.d} cm`} anchor="left" />

            {/* ── Height line (vertical, right side) ── */}
            {/* Top horizontal tick */}
            <line x1="716" y1="218" x2="750" y2="218" stroke="#1a1a1a" strokeWidth="1.5" strokeLinecap="round" />
            {/* Bottom horizontal tick */}
            <line x1="716" y1="550" x2="750" y2="550" stroke="#1a1a1a" strokeWidth="1.5" strokeLinecap="round" />
            {/* Vertical arrow */}
            <line x1="735" y1="232" x2="735" y2="536" {...strokeProps} />
            {/* Height label */}
            <DimBadge x="735" y="388" label={`${dims.h} cm`} anchor="left" />
          </svg>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
