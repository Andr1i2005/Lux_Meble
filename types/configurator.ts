export type FurnitureType = "sofa" | "armchair" | "sectional";

export type FabricType = "velvet" | "linen" | "leather" | "bouclé";

export type LegType = "tapered" | "hairpin" | "bun" | "block";

export type DimensionSize = "small" | "medium" | "large";

export type ModuleId =
  | "sofa-2"
  | "sofa-3"
  | "chaise"
  | "corner-l"
  | "corner-r"
  | "ottoman"
  | "sofa-bed";

export interface SofaModule {
  id: ModuleId;
  name: string;
  basePrice: number;
  dimensions: { w: number; d: number; h: number };
  furnitureType: FurnitureType;
  dimension: DimensionSize;
}

export interface FabricOption {
  id: string;
  name: string;
  fabric: FabricType;
  color: string;
  hex: string;
  textureClass: string;
}

export interface LegOption {
  id: string;
  name: string;
  type: LegType;
  material: "walnut" | "oak" | "matte-black" | "brass";
}

export interface Extra {
  id: string;
  name: string;
  description: string;
  price: number;
}

// ConfiguratorState is inferred from the store — kept for reference only
export interface ConfiguratorState {
  selectedModule: SofaModule;
  selectedFabric: FabricOption;
  selectedLeg: LegOption;
  selectedExtras: string[];
  showDimensions: boolean;
  furnitureType: FurnitureType;
  dimension: DimensionSize;
  setModule: (module: SofaModule) => void;
  setFabric: (fabric: FabricOption) => void;
  setLeg: (leg: LegOption) => void;
  toggleExtra: (id: string) => void;
  toggleDimensions: () => void;
}
