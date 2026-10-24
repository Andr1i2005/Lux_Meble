"use client";

import { Suspense, useMemo, useState, useRef, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Environment,
  OrbitControls,
  RoundedBox,
  ContactShadows,
  Lightformer,
  Line,
  Html,
} from "@react-three/drei";
import * as THREE from "three";
import type { FurnitureType, DimensionSize, LegType } from "@/types/configurator";
import { SofaGLTF } from "./SofaGLTF";
import { KivikGLTF } from "./KivikGLTF";

// ─── Material helpers ─────────────────────────────────────────────────────────

type FKey = "velvet" | "linen" | "leather" | "bouclé";
interface FP { roughness: number; sheen: number; sheenR: number; cc: number; ccR: number }

const FABRIC: Record<FKey, FP> = {
  velvet:  { roughness: 0.92, sheen: 1.0, sheenR: 0.78, cc: 0,   ccR: 0   },
  linen:   { roughness: 0.88, sheen: 0.6, sheenR: 0.85, cc: 0,   ccR: 0   },
  "bouclé":{ roughness: 0.95, sheen: 0.8, sheenR: 0.90, cc: 0,   ccR: 0   },
  leather: { roughness: 0.38, sheen: 0,   sheenR: 0,    cc: 0.5, ccR: 0.3 },
};

const LEG_M: Record<string, { color: string; roughness: number; metalness: number; cc: number }> = {
  walnut:        { color: "#5C3D1E", roughness: 0.65, metalness: 0.0,  cc: 0.30 },
  oak:           { color: "#C8A96E", roughness: 0.60, metalness: 0.0,  cc: 0.22 },
  "matte-black": { color: "#1A1A1A", roughness: 0.92, metalness: 0.18, cc: 0    },
  brass:         { color: "#B8960C", roughness: 0.22, metalness: 0.90, cc: 0    },
};

function FM({ color, type, s = 1 }: { color: string; type: string; s?: number }) {
  const k  = (type in FABRIC ? type : "velvet") as FKey;
  const p  = FABRIC[k];
  const c  = useMemo(() => new THREE.Color(color).multiplyScalar(s).getStyle(),        [color, s]);
  const sh = useMemo(() => new THREE.Color(color).multiplyScalar(s * 1.15).getStyle(), [color, s]);
  return (
    <meshPhysicalMaterial
      color={c} roughness={p.roughness} metalness={0}
      sheen={p.sheen} sheenColor={sh} sheenRoughness={p.sheenR}
      clearcoat={p.cc} clearcoatRoughness={p.ccR}
    />
  );
}

// ─── Legs ─────────────────────────────────────────────────────────────────────

type LP = { x: number; z: number; m: typeof LEG_M[string] };

const TaperedLeg = ({ x, z, m }: LP) => (
  <mesh position={[x, -0.285, z]} castShadow>
    <cylinderGeometry args={[0.020, 0.013, 0.07, 8]} />
    <meshPhysicalMaterial color={m.color} roughness={m.roughness} metalness={m.metalness} clearcoat={m.cc} clearcoatRoughness={0.4} />
  </mesh>
);
const HairpinLeg = ({ x, z, m }: LP) => (
  <group position={[x, -0.27, z]}>
    {[0.14, -0.14].map((a, i) => (
      <mesh key={i} rotation={[0.15, 0, a]} castShadow>
        <cylinderGeometry args={[0.007, 0.007, 0.10, 8]} />
        <meshPhysicalMaterial color={m.color} roughness={m.roughness} metalness={m.metalness} />
      </mesh>
    ))}
  </group>
);
const BunLeg = ({ x, z, m }: LP) => (
  <mesh position={[x, -0.295, z]} castShadow>
    <sphereGeometry args={[0.032, 14, 14]} />
    <meshPhysicalMaterial color={m.color} roughness={m.roughness} metalness={m.metalness} clearcoat={m.cc} />
  </mesh>
);
const BlockLeg = ({ x, z, m }: LP) => (
  <mesh position={[x, -0.28, z]} castShadow>
    <boxGeometry args={[0.048, 0.08, 0.048]} />
    <meshPhysicalMaterial color={m.color} roughness={m.roughness} metalness={m.metalness} />
  </mesh>
);

const LEGS: Record<LegType, React.ComponentType<LP>> = {
  tapered: TaperedLeg, hairpin: HairpinLeg, bun: BunLeg, block: BlockLeg,
};

// ─── Procedural Sofa ──────────────────────────────────────────────────────────

const ARM_W = 0.22;
const DEPTH = 0.92;
const FLOOR = -0.32;
const BACK_TOP = 0.51;
const ARM_TOP  = 0.30;

interface SofaProps {
  fabricColor: string; fabricType: string;
  legType: LegType; legMaterial: string;
  width: number; hasLumbar: boolean; hasThrow: boolean;
}

function Sofa({ fabricColor: fc, fabricType: ft, legType, legMaterial, width: W, hasLumbar, hasThrow }: SofaProps) {
  const lm  = LEG_M[legMaterial] ?? LEG_M.walnut;
  const Leg = LEGS[legType];

  const n      = W >= 1.7 ? 3 : 2;
  const innerW = W - ARM_W * 2;
  const gap    = 0.022;
  const cw     = (innerW - gap * (n - 1)) / n;

  const legXs = [-W / 2 + ARM_W * 0.5, W / 2 - ARM_W * 0.5];
  const legZs = [-DEPTH / 2 + 0.10, DEPTH / 2 - 0.10];

  const armH    = ARM_TOP - FLOOR;
  const armCenY = (FLOOR + ARM_TOP) / 2;

  const seatH     = 0.15;
  const SEAT_TOP  = FLOOR + 0.45;
  const baseH     = SEAT_TOP - FLOOR - seatH;
  const baseCenY  = FLOOR + baseH / 2;

  const seatDepth = 0.62;
  const seatZ     = -DEPTH / 2 + seatDepth / 2;
  const seatCenY  = FLOOR + baseH + seatH / 2;

  const bpH    = BACK_TOP - (FLOOR + baseH);
  const bpCenY = (FLOOR + baseH) + bpH / 2;
  const bpZ    = DEPTH / 2 - 0.020;

  const bcH     = 0.46;
  const bcDepth = 0.26;
  const bcCenY  = (FLOOR + 0.45) + bcH / 2 - 0.06;
  const bcCenZ  = DEPTH / 2 - 0.12;

  return (
    <group>
      {legXs.flatMap(x => legZs.map(z => <Leg key={`${x}${z}`} x={x} z={z} m={lm} />))}

      {([-1, 1] as const).map((side) => (
        <RoundedBox key={side}
          args={[ARM_W, armH, DEPTH]}
          radius={0.028}
          position={[side * (W / 2 - ARM_W / 2), armCenY, 0]}
          castShadow receiveShadow
        >
          <FM color={fc} type={ft} s={0.72} />
        </RoundedBox>
      ))}

      <RoundedBox args={[innerW, baseH, DEPTH]} radius={0.018}
        position={[0, baseCenY, 0]} castShadow receiveShadow>
        <FM color={fc} type={ft} s={0.66} />
      </RoundedBox>

      {Array.from({ length: n }, (_, i) => {
        const cx = -innerW / 2 + cw / 2 + i * (cw + gap);
        return (
          <RoundedBox key={i} args={[cw, seatH, seatDepth]} radius={0.032}
            position={[cx, seatCenY, seatZ]} castShadow>
            <FM color={fc} type={ft} s={0.90} />
          </RoundedBox>
        );
      })}

      <RoundedBox args={[innerW - 0.01, bpH, 0.055]} radius={0.008}
        position={[0, bpCenY, bpZ]} castShadow>
        <FM color={fc} type={ft} s={0.52} />
      </RoundedBox>

      {Array.from({ length: n }, (_, i) => {
        const cx = -innerW / 2 + cw / 2 + i * (cw + gap);
        return (
          <RoundedBox key={i} args={[cw, bcH, bcDepth]} radius={0.046}
            rotation={[0.16, 0, 0]}
            position={[cx, bcCenY, bcCenZ]} castShadow>
            <FM color={fc} type={ft} s={0.95} />
          </RoundedBox>
        );
      })}

      {hasLumbar && (
        <RoundedBox args={[0.38, 0.24, 0.14]} radius={0.065}
          rotation={[0.16, 0, 0]}
          position={[0, FLOOR + 0.54, bcCenZ - 0.06]} castShadow>
          <FM color={fc} type={ft} s={0.74} />
        </RoundedBox>
      )}

      {hasThrow && (
        <RoundedBox args={[0.44, 0.055, 0.50]} radius={0.020}
          rotation={[0.16, 0, 0.06]}
          position={[W / 2 - ARM_W - 0.18, seatCenY + seatH / 2 + 0.026, seatZ]} castShadow>
          <meshPhysicalMaterial
            color={new THREE.Color(fc).lerp(new THREE.Color("#ffffff"), 0.35).getStyle()}
            roughness={0.97} metalness={0} sheen={0.4} sheenRoughness={0.95}
          />
        </RoundedBox>
      )}
    </group>
  );
}

// ─── Procedural Armchair ──────────────────────────────────────────────────────

interface ArmchairProps {
  fabricColor: string; fabricType: string;
  legType: LegType; legMaterial: string;
  hasLumbar: boolean; hasThrow: boolean;
}

function Armchair({ fabricColor: fc, fabricType: ft, legType, legMaterial, hasLumbar, hasThrow }: ArmchairProps) {
  const lm  = LEG_M[legMaterial] ?? LEG_M.walnut;
  const Leg = LEGS[legType];
  const legPos: [number, number][] = [[-0.27, -0.31], [0.27, -0.31], [-0.27, 0.31], [0.27, 0.31]];

  return (
    <group>
      {legPos.map(([x, z]) => <Leg key={`${x}${z}`} x={x} z={z} m={lm} />)}
      {([-1, 1] as const).map((side) => (
        <RoundedBox key={side} args={[0.20, 0.62, 0.72]} radius={0.014}
          position={[side * 0.30, -0.01, 0]} castShadow receiveShadow>
          <FM color={fc} type={ft} s={0.70} />
        </RoundedBox>
      ))}
      <RoundedBox args={[0.40, 0.31, 0.72]} radius={0.014}
        position={[0, -0.165, 0]} castShadow receiveShadow>
        <FM color={fc} type={ft} s={0.58} />
      </RoundedBox>
      <RoundedBox args={[0.42, 0.16, 0.52]} radius={0.038}
        position={[0, 0.13, -0.10]} castShadow>
        <FM color={fc} type={ft} s={0.85} />
      </RoundedBox>
      <RoundedBox args={[0.42, 0.46, 0.065]} radius={0.012}
        position={[0, 0.16, 0.40]} castShadow>
        <FM color={fc} type={ft} s={0.56} />
      </RoundedBox>
      <RoundedBox args={[0.40, 0.48, 0.28]} radius={0.06}
        rotation={[0.22, 0, 0]} position={[0, 0.36, 0.32]} castShadow>
        <FM color={fc} type={ft} s={0.98} />
      </RoundedBox>
      {hasLumbar && (
        <RoundedBox args={[0.28, 0.24, 0.12]} radius={0.06}
          rotation={[0.22, 0, 0]} position={[0, 0.44, 0.26]} castShadow>
          <FM color={fc} type={ft} s={0.72} />
        </RoundedBox>
      )}
      {hasThrow && (
        <RoundedBox args={[0.28, 0.052, 0.44]} radius={0.02}
          rotation={[0.18, 0, 0.06]} position={[0.18, 0.44, -0.08]} castShadow>
          <meshPhysicalMaterial
            color={new THREE.Color(fc).lerp(new THREE.Color("#ffffff"), 0.35).getStyle()}
            roughness={0.97} metalness={0} sheen={0.4} sheenRoughness={0.95}
          />
        </RoundedBox>
      )}
    </group>
  );
}

// ─── Intro animation ──────────────────────────────────────────────────────────

function easeOutExpo(t: number): number { return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t); }
function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3); }


function SceneIntro({ children, started }: { children: React.ReactNode; started: React.RefObject<boolean> }) {
  const ref = useRef<THREE.Group>(null);
  const progress = useRef(0);
  useFrame((_, delta) => {
    if (!ref.current || progress.current >= 1 || !started.current) return;
    progress.current = Math.min(progress.current + delta / 1.5, 1);
    const ease = easeOutExpo(progress.current);
    ref.current.scale.setScalar(0.82 + ease * 0.18);
    ref.current.rotation.y = (1 - ease) * (-Math.PI * 0.067);
  });
  return (
    <group ref={ref} scale={0.82} rotation={[0, -Math.PI * 0.067, 0]}>
      {children}
    </group>
  );
}

function AnimatedGroup({ children, started }: { children: React.ReactNode; started: React.RefObject<boolean> }) {
  const ref = useRef<THREE.Group>(null);
  const progress = useRef(0);
  useFrame((_, delta) => {
    if (!ref.current || progress.current >= 1 || !started.current) return;
    progress.current = Math.min(progress.current + delta / 1.5, 1);
    ref.current.position.y = (1 - easeOutCubic(progress.current)) * -0.06;
  });
  return <group ref={ref} position={[0, -0.06, 0]}>{children}</group>;
}

const INTRO_DURATION = 1.5;
const SHADOW_FADE    = 0.5;

function ShadowFadeIn({ started, floorY }: { started: React.RefObject<boolean>; floorY: number }) {
  const elapsed  = useRef(0);
  const opRef    = useRef(0);
  const [opacity, setOpacity] = useState(0);
  useFrame((_, delta) => {
    if (!started.current) return;
    elapsed.current += delta;
    const t = Math.min((elapsed.current - INTRO_DURATION) / SHADOW_FADE, 1);
    if (t <= 0) return;
    const next = easeOutCubic(t) * 0.72;
    if (Math.abs(next - opRef.current) > 0.004) { opRef.current = next; setOpacity(next); }
  });
  return (
    <ContactShadows position={[0, floorY, 0]} opacity={opacity} scale={10}
      blur={4.5} far={1.6} frames={Infinity} color="#0d0a08" />
  );
}

// ─── Dimension annotations ────────────────────────────────────────────────────

const PILL: React.CSSProperties = {
  display: "inline-flex", alignItems: "center",
  padding: "2px 6px", background: "#111111", color: "#ffffff",
  fontSize: "6.5px", fontWeight: 600, fontFamily: "system-ui, -apple-system, sans-serif",
  borderRadius: "10px", whiteSpace: "nowrap", letterSpacing: "0.01em",
  userSelect: "none", pointerEvents: "none", boxShadow: "0 1px 4px rgba(0,0,0,0.22)",
};

interface DimProps {
  half: number;      // half-width  (X)
  frontZ: number;    // +Z face of model
  backZ: number;     // -Z face of model
  floorY: number;    // bottom Y
  topY: number;      // top Y
  dims: { w: number; d: number; h: number };
  showDimensions: boolean;
}

function DimensionLines({ half, frontZ, backZ, floorY, topY, dims, showDimensions }: DimProps) {
  const { camera } = useThree();
  const [sideX, setSideX] = useState<1 | -1>(1);
  const [sideZ, setSideZ] = useState<1 | -1>(1);
  const [tickAxis, setTickAxis] = useState<"x" | "z">("x");
  const wantX  = useRef<1 | -1>(1);
  const wantZ  = useRef<1 | -1>(1);
  const wantTA = useRef<"x" | "z">("x");
  const opRef   = useRef(showDimensions ? 1 : 0);
  const showRef = useRef(showDimensions);
  const [opacity, setOpacity] = useState(showDimensions ? 1 : 0);
  useEffect(() => { showRef.current = showDimensions; }, [showDimensions]);

  useFrame((_, delta) => {
    const x = camera.position.x;
    const z = camera.position.z;
    const DEAD = 0.2;
    const newSX: 1 | -1 = x > DEAD ? 1 : x < -DEAD ? -1 : wantX.current;
    const newSZ: 1 | -1 = z > DEAD ? 1 : z < -DEAD ? -1 : wantZ.current;
    const newTA: "x" | "z" = Math.abs(x) > Math.abs(z) ? "z" : "x";
    if (newSX !== wantX.current || newSZ !== wantZ.current || newTA !== wantTA.current) {
      wantX.current = newSX; wantZ.current = newSZ; wantTA.current = newTA;
      setSideX(newSX); setSideZ(newSZ); setTickAxis(newTA);
    }
    const targetOp = showRef.current ? 1 : 0;
    const cur = opRef.current;
    const next = THREE.MathUtils.lerp(cur, targetOp, Math.min(delta * 40, 1));
    if (Math.abs(next - cur) > 0.001) { opRef.current = next; setOpacity(next); }
  });

  const tkDX = tickAxis === "x" ? 1 : 0;
  const tkDZ = tickAxis === "z" ? 1 : 0;
  const col = "#111111"; const lw = 1.6; const tk = 0.055;
  // Side rulers (height + depth) need extra lateral clearance: armrests
  // overhang the base, so at the nominal side offset they tuck under the arm.
  const offX = 0.34; const offZ = 0.22;
  const hX = sideX * (half + offX);
  const wZ = sideZ * (frontZ + offZ);
  const dX = sideX * (half + offX);
  const hZ = -sideZ * (frontZ + offZ);
  const labelStyle: React.CSSProperties = { ...PILL, opacity };

  return (
    <>
      {/* HEIGHT */}
      <Line points={[[hX, floorY, hZ], [hX, topY, hZ]]} color={col} lineWidth={lw} transparent opacity={opacity} />
      <Line points={[[hX - tkDX*tk, floorY, hZ - tkDZ*tk], [hX + tkDX*tk, floorY, hZ + tkDZ*tk]]} color={col} lineWidth={lw} transparent opacity={opacity} />
      <Line points={[[hX - tkDX*tk, topY,   hZ - tkDZ*tk], [hX + tkDX*tk, topY,   hZ + tkDZ*tk]]} color={col} lineWidth={lw} transparent opacity={opacity} />
      <Html position={[hX + sideX * 0.14, (floorY + topY) / 2, hZ]} center distanceFactor={7} zIndexRange={[10, 0]}>
        <div style={labelStyle}>{dims.h} cm</div>
      </Html>
      {/* WIDTH */}
      <Line points={[[-half, floorY, wZ], [half, floorY, wZ]]} color={col} lineWidth={lw} transparent opacity={opacity} />
      <Line points={[[-half, floorY, wZ - tk], [-half, floorY, wZ + tk]]} color={col} lineWidth={lw} transparent opacity={opacity} />
      <Line points={[[ half, floorY, wZ - tk], [ half, floorY, wZ + tk]]} color={col} lineWidth={lw} transparent opacity={opacity} />
      <Html position={[0, floorY - 0.12, wZ]} center distanceFactor={7} zIndexRange={[10, 0]}>
        <div style={labelStyle}>{dims.w} cm</div>
      </Html>
      {/* DEPTH */}
      <Line points={[[dX, floorY, frontZ], [dX, floorY, backZ]]} color={col} lineWidth={lw} transparent opacity={opacity} />
      <Line points={[[dX - tk, floorY, frontZ], [dX + tk, floorY, frontZ]]} color={col} lineWidth={lw} transparent opacity={opacity} />
      <Line points={[[dX - tk, floorY, backZ],  [dX + tk, floorY, backZ]]}  color={col} lineWidth={lw} transparent opacity={opacity} />
      <Html position={[dX + sideX * 0.13, floorY, (frontZ + backZ) / 2]} center distanceFactor={7} zIndexRange={[10, 0]}>
        <div style={labelStyle}>{dims.d} cm</div>
      </Html>
    </>
  );
}

// ─── Scene ────────────────────────────────────────────────────────────────────


interface Scene3DProps {
  furnitureType: FurnitureType;
  dimension: DimensionSize;
  fabricColor: string;
  fabricType: string;
  legType: LegType;
  legMaterial: string;
  hasLumbar: boolean;
  hasThrow: boolean;
  hasOttoman: boolean;
  showDimensions: boolean;
  dims: { w: number; d: number; h: number };
  modelPath?: string;
  frameColor?: string;
  variantId?: string;
  onReady?: () => void;
  startAnimation?: boolean;
}

const SOFA_W: Record<DimensionSize, number> = { small: 1.3, medium: 1.8, large: 2.3 };

function ReadySignal({ onReady }: { onReady?: () => void }) {
  useEffect(() => { onReady?.(); }, [onReady]);
  return null;
}

export default function Scene3D({
  furnitureType, dimension, fabricColor, fabricType,
  legType, legMaterial, hasLumbar, hasThrow, hasOttoman,
  showDimensions, dims, modelPath, frameColor = "#1A1A1A", variantId, onReady, startAnimation = false,
}: Scene3DProps) {
  const isGLTF   = !!modelPath;
  const isKivik  = isGLTF && modelPath!.includes("/kivik/");
  const sofaWidth = SOFA_W[dimension];
  const started  = useRef(false);
  useEffect(() => { if (startAnimation) started.current = true; }, [startAnimation]);

  const camPos   = isGLTF ? ([2.5, 1.8, 5.5] as const) : ([1.8, 1.4, 4.8] as const);
  const orbitTgt = isGLTF ? ([0, 0.44, 0] as const)    : ([0, 0.10, 0] as const);
  const floorY   = isGLTF ? 0 : FLOOR;

  // Kivik dimension lines: model is in mm, scaled 0.001, so 1810mm wide → 0.905m half
  // Approximate: half=0.91, frontZ=0.42, backZ=-0.42, topY=0.62
  const kivikDimHalf  = dims.w  / 200;   // cm → m half-width
  const kivikDimFront = dims.d  / 200;   // cm → m half-depth
  const kivikDimTop   = dims.h  / 100;   // cm → m height

  return (
    <Canvas
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.08,
        outputColorSpace: THREE.SRGBColorSpace,
      }}
      camera={{ position: [...camPos], fov: isGLTF ? 44 : 38 }}
      style={{ background: "transparent" }}
    >
      <Suspense fallback={null}>
        <ReadySignal onReady={onReady} />
        <ambientLight intensity={0.45} color="#fff8f2" />
        <directionalLight position={[0.9, 6, 2.4]} intensity={2.4} color="#fff2e8" castShadow
          shadow-mapSize={[1024, 1024]} shadow-camera-far={20} />
        <directionalLight position={[5, 3, 2]}  intensity={0.55} color="#dceaff" />
        <directionalLight position={[0, 1, 6]}  intensity={0.30} color="#ffffff" />
        <Environment resolution={256} background={false}>
          <Lightformer form="ring"  intensity={0.5}  rotation={[Math.PI / 2, 0, 0]} position={[0, 6, 0]}   scale={[12, 12, 1]} color="#fff8f0" />
          <Lightformer form="rect"  intensity={1.6}  rotation={[0, Math.PI / 2, 0]} position={[-6, 2, 0]}  scale={[4, 3, 1]}   color="#c0dcff" />
          <Lightformer form="rect"  intensity={0.30} rotation={[0, Math.PI, 0]}     position={[0, 1, 7]}   scale={[5, 4, 1]}   color="#ffffff" />
        </Environment>

        <ShadowFadeIn started={started} floorY={floorY} />

        <SceneIntro started={started}>
          <AnimatedGroup started={started}>
            {isKivik ? (
              <KivikGLTF
                modelPath={modelPath!}
                fabricColor={fabricColor}
              />
            ) : isGLTF ? (
              <SofaGLTF
                modelPath={modelPath!}
                fabricColor={fabricColor}
                fabricType={fabricType}
                frameColor={frameColor}
              />
            ) : (
              <group rotation={[0, Math.PI, 0]}>
                {furnitureType === "armchair" ? (
                  <Armchair
                    fabricColor={fabricColor} fabricType={fabricType}
                    legType={legType} legMaterial={legMaterial}
                    hasLumbar={hasLumbar} hasThrow={hasThrow}
                  />
                ) : (
                  <Sofa
                    fabricColor={fabricColor} fabricType={fabricType}
                    legType={legType} legMaterial={legMaterial}
                    width={sofaWidth} hasLumbar={hasLumbar} hasThrow={hasThrow}
                  />
                )}
              </group>
            )}
          </AnimatedGroup>

          {isKivik ? (
            <DimensionLines
              half={kivikDimHalf} frontZ={kivikDimFront} backZ={-kivikDimFront}
              floorY={0} topY={kivikDimTop}
              dims={dims} showDimensions={showDimensions}
            />
          ) : isGLTF ? (
            <DimensionLines
              half={1.37} frontZ={1.045} backZ={-1.045}
              floorY={0} topY={0.87}
              dims={dims} showDimensions={showDimensions}
            />
          ) : (
            <DimensionLines
              half={sofaWidth / 2} frontZ={DEPTH / 2} backZ={-DEPTH / 2}
              floorY={FLOOR} topY={BACK_TOP}
              dims={dims} showDimensions={showDimensions}
            />
          )}
        </SceneIntro>

        <OrbitControls
          enablePan={false}
          minPolarAngle={Math.PI / 2 - 20 * Math.PI / 180}
          maxPolarAngle={Math.PI / 2 - 20 * Math.PI / 180}
          minDistance={isGLTF ? 3.5 : 2.5}
          maxDistance={isGLTF ? 9   : 7}
          target={[...orbitTgt]}
          enableDamping
          dampingFactor={0.06}
        />
      </Suspense>
    </Canvas>
  );
}
