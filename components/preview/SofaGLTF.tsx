"use client";

import { useMemo, useRef, useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

interface SofaGLTFProps {
  modelPath: string;
  fabricColor: string;
  frameColor: string;
  fabricType?: string;
}

export function SofaGLTF({ modelPath, fabricColor, frameColor }: SofaGLTFProps) {
  const { scene, materials } = useGLTF(modelPath);
  const orig = Object.values(materials)[0] as THREE.MeshStandardMaterial | undefined;

  const uFabric = useRef<THREE.IUniform<THREE.Color>>({ value: new THREE.Color(fabricColor) });
  const uFrame  = useRef<THREE.IUniform<THREE.Color>>({ value: new THREE.Color(frameColor)  });

  useEffect(() => { uFabric.current.value.set(fabricColor); }, [fabricColor]);
  useEffect(() => { uFrame.current.value.set(frameColor);   }, [frameColor]);

  const mat = useMemo(() => {
    const m = new THREE.MeshPhysicalMaterial({
      // White base so the zone shader receives (1,1,1) — we do all colouring ourselves
      color: new THREE.Color(0xffffff),
      // Keep surface maps from the original model
      normalMap:    orig?.normalMap    ?? null,
      normalScale:  orig?.normalScale?.clone() ?? new THREE.Vector2(1, 1),
      // roughnessMap stays so Three.js exposes `roughnessMap` in the shader
      roughnessMap: orig?.roughnessMap ?? null,
      // roughness = 1 so roughnessFactor == raw map value (no extra multiply)
      roughness: 1.0,
      metalness: 0,
      envMapIntensity: 0.9,
    });

    m.onBeforeCompile = (shader) => {
      shader.uniforms.uFabric = uFabric.current;
      shader.uniforms.uFrame  = uFrame.current;

      // Declare uniforms at the top of the fragment shader
      shader.fragmentShader =
        `uniform vec3 uFabric;\nuniform vec3 uFrame;\n` +
        // After roughnessmap_fragment, roughnessFactor holds the raw map value (0..1).
        // Fabric / upholstery zones are high-roughness (0.6–1.0).
        // Leather frame / base zones are lower-roughness (0.0–0.5).
        // We use that as a clean spatial mask between the two user colours.
        shader.fragmentShader.replace(
          "#include <roughnessmap_fragment>",
          /* glsl */ `
          #include <roughnessmap_fragment>

          float zoneMask = smoothstep(0.45, 0.70, roughnessFactor);
          diffuseColor.rgb = mix(uFrame, uFabric, zoneMask);
          `
        );
    };

    m.customProgramCacheKey = () => "mallory-roughness-zone";
    return m;
  }, [orig]);

  const cloned = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        mesh.material = mat;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
    return clone;
  }, [scene, mat]);

  return <primitive object={cloned} />;
}
