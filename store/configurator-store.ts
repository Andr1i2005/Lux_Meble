import { create } from "zustand";
import type { SofaModule, FabricOption, LegOption } from "@/types/configurator";
import { fabricOptions, legOptions, sofaModules } from "@/lib/furniture-data";

const DEFAULT_MODULE = sofaModules[1]; // 3-seater

interface State {
  selectedModule: SofaModule;
  selectedFabric: FabricOption;
  selectedLeg: LegOption;
  selectedExtras: string[];
  showDimensions: boolean;
  furnitureType: SofaModule["furnitureType"];
  dimension: SofaModule["dimension"];
  // Second material zone: frame / leather base (used by GLTF models)
  frameColor: string;
  // Active product variant (e.g. 2-seater / 3-seater / corner).
  selectedVariantId: string | null;
}

interface Actions {
  setModule: (module: SofaModule) => void;
  setFabric: (fabric: FabricOption) => void;
  setLeg: (leg: LegOption) => void;
  setFrameColor: (color: string) => void;
  setVariant: (id: string | null) => void;
  setExtras: (ids: string[]) => void;
  setDimensions: (show: boolean) => void;
  toggleExtra: (id: string) => void;
  toggleDimensions: () => void;
}

export const useConfiguratorStore = create<State & Actions>((set) => ({
  selectedModule:    DEFAULT_MODULE,
  selectedFabric:    fabricOptions[0],
  selectedLeg:       legOptions[0],
  selectedExtras:    [],
  showDimensions:    true,
  furnitureType:     DEFAULT_MODULE.furnitureType,
  dimension:         DEFAULT_MODULE.dimension,
  frameColor:        "#1A1A1A", // default dark leather frame
  selectedVariantId: null,

  setModule: (selectedModule) =>
    set({
      selectedModule,
      furnitureType: selectedModule.furnitureType,
      dimension: selectedModule.dimension,
    }),

  setFabric:      (selectedFabric) => set({ selectedFabric }),
  setLeg:         (selectedLeg)    => set({ selectedLeg }),
  setFrameColor:  (frameColor)     => set({ frameColor }),
  setVariant:     (selectedVariantId) => set({ selectedVariantId }),
  setExtras:      (selectedExtras) => set({ selectedExtras }),
  setDimensions:  (showDimensions) => set({ showDimensions }),

  toggleExtra: (id) =>
    set((s) => ({
      selectedExtras: s.selectedExtras.includes(id)
        ? s.selectedExtras.filter((e) => e !== id)
        : [...s.selectedExtras, id],
    })),

  toggleDimensions: () =>
    set((s) => ({ showDimensions: !s.showDimensions })),
}));
