"use client";

import { useCallback, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { useConfiguratorStore } from "@/store/configurator-store";
import { assetUrl } from "@/lib/asset-url";
import SceneLoader from "./SceneLoader";
import type { FurnitureType, DimensionSize } from "@/types/configurator";

const Scene3D = dynamic(() => import("./Scene3D"), { ssr: false });

const MIN_LOADER_MS = 1000;

interface FurniturePreviewProps {
  modelPath?: string;
  modelPathWithPillows?: string;
  overrideFurnitureType?: FurnitureType;
  overrideDimension?: DimensionSize;
  overrideDims?: { w: number; d: number; h: number };
  variantId?: string;
}

export default function FurniturePreview({
  modelPath,
  modelPathWithPillows,
  overrideFurnitureType,
  overrideDimension,
  overrideDims,
  variantId,
}: FurniturePreviewProps) {
  const {
    selectedModule, selectedFabric, selectedLeg,
    selectedExtras, showDimensions, frameColor,
  } = useConfiguratorStore();

  const hasLumbar  = selectedExtras.includes("lumbar-pillow");
  const hasThrow   = selectedExtras.includes("throw-blanket");
  const hasOttoman = selectedExtras.includes("ottoman");

  const resolvedModelPath = assetUrl(hasLumbar && modelPathWithPillows ? modelPathWithPillows : modelPath);

  const [isLoaded, setIsLoaded] = useState(false);
  const mountedAt = useRef<number>(Date.now());

  const handleReady = useCallback(() => {
    const elapsed = Date.now() - mountedAt.current;
    const remaining = Math.max(0, MIN_LOADER_MS - elapsed);
    setTimeout(() => setIsLoaded(true), remaining);
  }, []);

  return (
    <div className="relative w-full h-full">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 95% 85% at 50% 32%, #f6f4f1 0%, #ece9e4 48%, #dbd7d0 100%)",
        }}
      />

      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoaded ? 1 : 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      >
        <Scene3D
          furnitureType={overrideFurnitureType ?? selectedModule.furnitureType}
          dimension={overrideDimension ?? selectedModule.dimension}
          fabricColor={selectedFabric.hex}
          fabricType={selectedFabric.fabric}
          legType={selectedLeg.type}
          legMaterial={selectedLeg.material}
          hasLumbar={hasLumbar}
          hasThrow={hasThrow}
          hasOttoman={hasOttoman}
          showDimensions={showDimensions}
          dims={overrideDims ?? selectedModule.dimensions}
          modelPath={resolvedModelPath}
          frameColor={frameColor}
          variantId={variantId}
          onReady={handleReady}
          startAnimation={isLoaded}
        />
      </motion.div>

      <AnimatePresence>
        {!isLoaded && <SceneLoader key="loader" />}
      </AnimatePresence>
    </div>
  );
}
