"use client";

import { motion } from "framer-motion";

interface RoomSceneProps {
  fabricColor: string;
  children: React.ReactNode;
}

export default function RoomScene({ fabricColor, children }: RoomSceneProps) {
  return (
    <div className="relative w-full" style={{ aspectRatio: "16/10" }}>
      <svg
        viewBox="0 0 800 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* ── Room surfaces ── */}

        {/* Floor */}
        <polygon points="80,300 400,480 720,300 400,120" fill="#E8E2D9" />

        {/* Floor tiles */}
        {[
          // row 1
          "80,300 240,390 320,345 160,255",
          "240,390 400,480 480,435 320,345",
          "400,480 560,390 640,435 480,435",
          "560,390 720,300 640,255 480,345",
          // row 2
          "160,255 320,345 400,300 240,210",
          "320,345 480,435 560,390 400,300",
          "480,435 640,345 720,300 560,255",
          "240,210 400,300 480,255 320,165",
          "400,300 560,390 640,345 480,255",
          "560,255 720,165 640,120 480,210",
          // row 3
          "320,165 480,255 560,210 400,120",
          "480,255 640,345 720,300 560,210",
        ].map((pts, i) => (
          <polygon
            key={i}
            points={pts}
            fill="none"
            stroke="#D4CEC4"
            strokeWidth="1"
            opacity="0.7"
          />
        ))}

        {/* Left wall */}
        <polygon points="80,300 80,80 400,80 400,120 160,255" fill="#F2EDE6" />

        {/* Right wall */}
        <polygon points="400,120 720,80 720,300 400,480" fill="#EAE4DB" />

        {/* Ceiling edge left */}
        <line x1="80" y1="80" x2="400" y2="80" stroke="#D8D2C8" strokeWidth="1.5" />
        {/* Ceiling edge right */}
        <line x1="400" y1="80" x2="720" y2="80" stroke="#D0CAC0" strokeWidth="1.5" />

        {/* Left wall baseboard */}
        <polygon points="80,285 80,300 160,255 160,240" fill="#DDD8CE" opacity="0.8" />

        {/* Right wall baseboard */}
        <polygon points="720,285 720,300 400,480 400,465" fill="#D5CFC5" opacity="0.8" />

        {/* Left wall window */}
        <rect x="120" y="120" width="160" height="110" rx="2" fill="#C8DDE8" opacity="0.6" />
        <rect x="120" y="120" width="160" height="110" rx="2" fill="none" stroke="#BDB8AE" strokeWidth="2" />
        {/* Window cross */}
        <line x1="200" y1="120" x2="200" y2="230" stroke="#BDB8AE" strokeWidth="1.5" />
        <line x1="120" y1="175" x2="280" y2="175" stroke="#BDB8AE" strokeWidth="1.5" />
        {/* Window light */}
        <polygon points="120,120 280,120 280,230 120,230" fill="url(#windowLight)" opacity="0.3" />

        {/* Right wall artwork */}
        <rect x="490" y="110" width="140" height="100" rx="2" fill="#E8E0D5" stroke="#C8C2B8" strokeWidth="1.5" />
        {/* Artwork content – abstract lines */}
        <rect x="498" y="118" width="124" height="84" rx="1" fill="#F0EBE2" />
        <line x1="510" y1="140" x2="610" y2="140" stroke="#C4A882" strokeWidth="1.5" opacity="0.6" />
        <line x1="510" y1="155" x2="585" y2="155" stroke="#C4A882" strokeWidth="1" opacity="0.4" />
        <ellipse cx="548" cy="168" rx="20" ry="12" fill="#C4A882" opacity="0.2" />

        {/* Right wall floor lamp */}
        <line x1="670" y1="280" x2="670" y2="160" stroke="#8A8078" strokeWidth="3" strokeLinecap="round" />
        <ellipse cx="670" cy="280" rx="12" ry="4" fill="#6A6058" />
        <ellipse cx="670" cy="155" rx="18" ry="8" fill="#D4CEC4" />
        <ellipse cx="670" cy="155" rx="18" ry="8" fill="none" stroke="#B8B2A8" strokeWidth="1.5" />
        {/* Lamp glow */}
        <motion.ellipse
          cx="670" cy="160" rx="40" ry="20"
          fill="#FFF8E8"
          opacity="0"
          animate={{ opacity: [0.12, 0.2, 0.12] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Ambient glow from fabric */}
        <motion.ellipse
          cx="400" cy="370"
          rx="120" ry="40"
          fill={fabricColor}
          animate={{ fill: fabricColor }}
          transition={{ duration: 0.6 }}
          opacity="0.08"
        />

        <defs>
          <linearGradient id="windowLight" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>
      </svg>

      {/* Furniture sits on the floor at the center-bottom of the diamond */}
      <div className="absolute inset-0 flex items-end justify-center" style={{ paddingBottom: "8%" }}>
        {children}
      </div>
    </div>
  );
}
