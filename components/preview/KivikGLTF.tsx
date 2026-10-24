"use client";

import { useMemo, useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

// Nodes already carry scale=0.001 (mm→m baked in). Model bottom ~Y=-0.415m world.
const FLOOR_Y         = 0.42;
// Armrest legs min Y = -261mm → posY = 0.261 puts them on the floor.
const ARMREST_FLOOR_Y = 0.25;
const ARMREST_PATH = "/models/kivik/kivik-armrest.glb";

// Armrest model: inner mounting face at local X=+0.132m, outer (fabric) face at X=-0.122m.
// Right arm: scale X=-1 so fabric faces outward → posX = sofa_maxX + 0.132
// Left arm:  no X flip, fabric naturally faces outward → posX = sofa_minX - 0.132
// Values derived from bounding-box inspection of each variant GLB.
const ARMREST_X: Record<string, [right: number, left: number] | null> = {
  "kivik-2seater": [0.843, -0.832],
  "kivik-3seater": [1.022, -1.012],
  "kivik-corner":  null,           // corner is assembled separately (see below)
};

function tintFabric(root: THREE.Object3D, hex: string) {
  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    const mat = obj.material as THREE.MeshStandardMaterial;
    if (!mat || !(mat.normalMap || mat.aoMap)) return;
    if (!obj.userData.matCloned) {
      obj.material = mat.clone();
      obj.userData.matCloned = true;
    }
    const m = obj.material as THREE.MeshStandardMaterial;
    m.map = null;
    m.color.set(hex);
    m.side = THREE.DoubleSide;
    m.needsUpdate = true;
  });
}

function prepareScene(scene: THREE.Object3D): THREE.Object3D {
  const clone = scene.clone(true);
  clone.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    mats.forEach((m: THREE.Material) => { m.side = THREE.DoubleSide; m.needsUpdate = true; });
  });
  return clone;
}

interface KivikGLTFProps {
  modelPath: string;
  fabricColor: string;
}

const EXT_PATH = "/models/kivik/kivik-3seater.glb";

// ── Corner L-shape assembly ──────────────────────────────────────────────
// The corner GLB is a straight run (corner seat at left, two seats to the
// right) with an open connecting face at the front of the corner seat. A
// proper L attaches a 3-seat module perpendicular there (extending in +Z),
// plus an armrest on each outer end. The whole assembly is offset by `center`
// so its footprint is symmetric about the origin — this lets the (centered)
// dimension-line math in Scene3D wrap the L correctly.
const CORNER = {
  // recenters the asymmetric L footprint (x[-1.17,1.42], z[-0.47,2.52]) on origin
  center:   [-0.125, 0, -1.03] as [number, number, number],
  // perpendicular 3-seat: rotateY(+90°) → backrest faces -X (outer left).
  // Tucked toward the corner just enough to close the gap without overlapping.
  extPos:   [-0.70, FLOOR_Y, 1.35] as [number, number, number],
  extRotY:  Math.PI / 2,
  // armrest capping the right end of the main run (nudged ~1.5cm into the seat)
  rightArmX: 1.285,
  // armrest capping the front (+Z) end of the perpendicular run — tucked ~1.5cm
  // into the 3-seat open face so the seam reads tight.
  frontArmPos: [-0.70, ARMREST_FLOOR_Y, 2.375] as [number, number, number],
  frontArmRotY: Math.PI / 2,
};

export function KivikGLTF({ modelPath, fabricColor }: KivikGLTFProps) {
  const { scene: sofaScene }     = useGLTF(modelPath);
  const { scene: armrestScene }  = useGLTF(ARMREST_PATH);
  const { scene: extScene }      = useGLTF(EXT_PATH);

  const isCorner = modelPath.includes("kivik-corner");

  const sofa         = useMemo(() => prepareScene(sofaScene),    [sofaScene]);
  const armrestRight = useMemo(() => prepareScene(armrestScene), [armrestScene]);
  const armrestLeft  = useMemo(() => prepareScene(armrestScene), [armrestScene]);
  // dedicated clone for the rotated corner front arm — never share with
  // armrestLeft, since <primitive> doesn't reset rotation between layouts.
  const armrestFront = useMemo(() => prepareScene(armrestScene), [armrestScene]);
  const cornerExt    = useMemo(() => prepareScene(extScene),     [extScene]);

  useEffect(() => { tintFabric(sofa,         fabricColor); }, [sofa,         fabricColor]);
  useEffect(() => { tintFabric(armrestRight, fabricColor); }, [armrestRight, fabricColor]);
  useEffect(() => { tintFabric(armrestLeft,  fabricColor); }, [armrestLeft,  fabricColor]);
  useEffect(() => { tintFabric(armrestFront, fabricColor); }, [armrestFront, fabricColor]);
  useEffect(() => { tintFabric(cornerExt,    fabricColor); }, [cornerExt,    fabricColor]);

  const variantKey   = Object.keys(ARMREST_X).find((k) => modelPath.includes(k));
  const armrestPos   = variantKey ? ARMREST_X[variantKey] : null;

  if (isCorner) {
    return (
      <group position={CORNER.center}>
        <primitive object={sofa} position={[0, FLOOR_Y, 0]} />
        <primitive object={cornerExt} position={CORNER.extPos} rotation={[0, CORNER.extRotY, 0]} />
        {/* right end of main run */}
        <primitive object={armrestRight} position={[CORNER.rightArmX, ARMREST_FLOOR_Y, 0]} scale={[-1, 1, 1]} />
        {/* front end of perpendicular run */}
        <primitive object={armrestFront} position={CORNER.frontArmPos} rotation={[0, CORNER.frontArmRotY, 0]} />
      </group>
    );
  }

  return (
    <>
      <primitive object={sofa} position={[0, FLOOR_Y, 0]} />
      {armrestPos && (
        <>
          <primitive
            object={armrestRight}
            position={[armrestPos[0], ARMREST_FLOOR_Y, 0]}
            scale={[-1, 1, 1]}
          />
          <primitive
            object={armrestLeft}
            position={[armrestPos[1], ARMREST_FLOOR_Y, 0]}
          />
        </>
      )}
    </>
  );
}

useGLTF.preload("/models/kivik/kivik-3seater.glb");
useGLTF.preload("/models/kivik/kivik-2seater.glb");
useGLTF.preload("/models/kivik/kivik-corner.glb");
useGLTF.preload(ARMREST_PATH);
