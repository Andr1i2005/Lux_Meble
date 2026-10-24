# Two-Zone GLTF Material: Roughness-Mask Approach

## Problem

Single-mesh GLTF furniture models (e.g. Mallory Tufted Sectional) have one material for the entire model. To show realistic fabric + leather-frame combinations we need to split the surface into two colour zones without modifying the model geometry.

## What does NOT work

- `map` (baseColor texture) as a mask — Mallory's baked texture is very dark (~lum 0.05–0.2); multiplying any colour by it produces near-black results.
- Luminance of baseColor texture as smoothstep mask — too low contrast between frame and fabric zones.
- Adding `sheen` / `clearcoat` on top of the original material — overexposure / blown highlights because the PBR maps already encode surface detail.
- Separate lighting rigs per model type — unnecessary complexity, dark/broken results.

## What WORKS ✅

Use the **roughnessMap** (G-channel of the ORM texture) as the spatial mask between two user-controlled colours.

- Fabric / upholstery zones → baked as **high roughness** (0.6–1.0)
- Leather frame / base zones → baked as **lower roughness** (0.0–0.5)

### Implementation

```tsx
// components/preview/SofaGLTF.tsx

const uFabric = useRef<THREE.IUniform<THREE.Color>>({ value: new THREE.Color(fabricColor) });
const uFrame  = useRef<THREE.IUniform<THREE.Color>>({ value: new THREE.Color(frameColor)  });

// Mutate in-place on colour change — no shader recompile needed
useEffect(() => { uFabric.current.value.set(fabricColor); }, [fabricColor]);
useEffect(() => { uFrame.current.value.set(frameColor);   }, [frameColor]);

const mat = useMemo(() => {
  const m = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0xffffff), // white — all colouring done in shader
    normalMap:    orig?.normalMap    ?? null,
    normalScale:  orig?.normalScale?.clone() ?? new THREE.Vector2(1, 1),
    roughnessMap: orig?.roughnessMap ?? null,
    roughness: 1.0,   // must be 1.0 so roughnessFactor == raw map value
    metalness: 0,
    envMapIntensity: 0.9,
  });

  m.onBeforeCompile = (shader) => {
    shader.uniforms.uFabric = uFabric.current;
    shader.uniforms.uFrame  = uFrame.current;

    shader.fragmentShader =
      `uniform vec3 uFabric;\nuniform vec3 uFrame;\n` +
      shader.fragmentShader.replace(
        "#include <roughnessmap_fragment>",
        `
        #include <roughnessmap_fragment>
        // roughnessFactor == raw ORM-map value because roughness=1.0
        // Fabric zones are high-roughness (0.6–1.0), frame zones are low (0.0–0.5)
        float zoneMask = smoothstep(0.45, 0.70, roughnessFactor);
        diffuseColor.rgb = mix(uFrame, uFabric, zoneMask);
        `
      );
  };

  m.customProgramCacheKey = () => "mallory-roughness-zone";
  return m;
}, [orig]);
```

### Why this injection point

`#include <roughnessmap_fragment>` — at this point both `roughnessFactor` and `diffuseColor` are defined in the Three.js shader, making it safe to read one and write the other.

### Threshold calibration

`smoothstep(0.45, 0.70, roughnessFactor)` worked for the Mallory model.  
Adjust if zone separation looks wrong on a different model:
- Raise lower bound → more surface gets "fabric" colour
- Lower upper bound → sharper transition

## Scene lighting

Keep the **same lighting rig** for both procedural and GLTF models. Do NOT create separate lighting paths — it causes dark or blown results.

## UI wiring

- **Cover / Fabric** colour picker → `fabricColor` in Zustand store → `uFabric` uniform
- **Frame / Base** colour picker → `frameColor` in Zustand store → `uFrame` uniform
- Show the Frame row only when `product.modelType === "gltf"`

## Relevant files

| File | Role |
|------|------|
| `components/preview/SofaGLTF.tsx` | GLTF component with the shader |
| `store/configurator-store.ts` | `frameColor` state + `setFrameColor` action |
| `components/ConfiguratorPage.tsx` | `FrameRow` component + conditional render |
| `lib/product-catalog.ts` | `ProductConfig` with `modelType: "gltf"` flag |
