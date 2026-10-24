import type {
  FabricOption,
  LegOption,
  Extra,
  SofaModule,
  FabricType,
} from "@/types/configurator";

export const fabricOptions: FabricOption[] = [
  { id: "pebble-weave",    name: "Pebble",   fabric: "linen",   color: "Pebble Grey",     hex: "#A6A096", textureClass: "texture-linen"   },
  { id: "oatmeal-linen",   name: "Oatmeal",  fabric: "linen",   color: "Oatmeal",         hex: "#C9BBA1", textureClass: "texture-linen"   },
  { id: "charcoal-weave",  name: "Charcoal", fabric: "linen",   color: "Charcoal",        hex: "#44464A", textureClass: "texture-linen"   },
  { id: "denim-velvet",    name: "Denim",    fabric: "velvet",  color: "Denim Blue",      hex: "#566A7B", textureClass: "texture-velvet"  },
  { id: "moss-velvet",     name: "Moss",     fabric: "velvet",  color: "Moss Green",      hex: "#6B6F50", textureClass: "texture-velvet"  },
  { id: "clay-linen",      name: "Clay",     fabric: "linen",   color: "Clay",            hex: "#A9745B", textureClass: "texture-linen"   },
  { id: "sand-weave",      name: "Sand",     fabric: "linen",   color: "Sand Beige",      hex: "#B9A584", textureClass: "texture-linen"   },
  { id: "taupe-velvet",    name: "Taupe",    fabric: "velvet",  color: "Mushroom Taupe",  hex: "#8B7F72", textureClass: "texture-velvet"  },
  { id: "dove-velvet",     name: "Dove",     fabric: "velvet",  color: "Dove Grey",       hex: "#979A9E", textureClass: "texture-velvet"  },
  { id: "petrol-velvet",   name: "Petrol",   fabric: "velvet",  color: "Petrol Teal",     hex: "#3C5559", textureClass: "texture-velvet"  },
  { id: "cognac-leather",  name: "Cognac",   fabric: "leather", color: "Cognac Leather",  hex: "#8A5634", textureClass: "texture-leather" },
  { id: "ivory-boucle",    name: "Ivory",    fabric: "bouclé",  color: "Ivory Bouclé",    hex: "#E7DFD1", textureClass: "texture-boucle"  },
];

export const legOptions: LegOption[] = [
  { id: "tapered-walnut",  name: "Walnut Tapered",     type: "tapered", material: "walnut"      },
  { id: "hairpin-black",   name: "Matte Black Hairpin", type: "hairpin", material: "matte-black" },
  { id: "bun-oak",         name: "Oak Bun",             type: "bun",     material: "oak"         },
  { id: "block-brass",     name: "Brass Block",         type: "block",   material: "brass"       },
];

export const extraOptions: Extra[] = [
  { id: "ottoman",         name: "Ottoman",         description: "Matching tufted pouf, same fabric & frame", price: 449 },
  { id: "lumbar-pillow",   name: "Lumbar Pillow",   description: "Matching fabric lumbar cushion",      price: 89  },
  { id: "throw-blanket",   name: "Throw Blanket",   description: "Cashmere throw, complementary tone", price: 145 },
  { id: "tray",            name: "Oak Tray",        description: "Solid oak arm tray, brass inlay",     price: 75  },
  { id: "storage",         name: "Storage Drawer",  description: "Hidden under-seat storage drawer",    price: 199 },
];

export const sofaModules: SofaModule[] = [
  {
    id: "sofa-2",
    name: "2-Seater Sofa",
    basePrice: 1299,
    dimensions: { w: 150, d: 92, h: 83 },
    furnitureType: "sofa",
    dimension: "small",
  },
  {
    id: "sofa-3",
    name: "3-Seater Sofa",
    basePrice: 1799,
    dimensions: { w: 228, d: 95, h: 83 },
    furnitureType: "sofa",
    dimension: "medium",
  },
  {
    id: "chaise",
    name: "Chaise Lounge",
    basePrice: 1599,
    dimensions: { w: 245, d: 155, h: 83 },
    furnitureType: "sofa",
    dimension: "medium",
  },
  {
    id: "corner-l",
    name: "Corner Left",
    basePrice: 2499,
    dimensions: { w: 285, d: 165, h: 83 },
    furnitureType: "sectional",
    dimension: "large",
  },
  {
    id: "corner-r",
    name: "Corner Right",
    basePrice: 2499,
    dimensions: { w: 285, d: 165, h: 83 },
    furnitureType: "sectional",
    dimension: "large",
  },
  {
    id: "ottoman",
    name: "Ottoman",
    basePrice: 549,
    dimensions: { w: 80, d: 80, h: 45 },
    furnitureType: "armchair",
    dimension: "small",
  },
  {
    id: "sofa-bed",
    name: "Sofa Bed",
    basePrice: 2099,
    dimensions: { w: 215, d: 102, h: 83 },
    furnitureType: "sofa",
    dimension: "medium",
  },
];

const FABRIC_PRICE_MULTIPLIER: Record<FabricType, number> = {
  velvet:  1.0,
  linen:   0.9,
  leather: 1.35,
  "bouclé": 1.2,
};

const LEG_PRICE_ADD: Record<string, number> = {
  walnut:        0,
  oak:           50,
  "matte-black": 80,
  brass:         180,
};

export function calculateTotalPrice(
  basePrice: number,
  fabric: FabricOption,
  leg: LegOption | null,
  extras: Extra[]
): number {
  const base = basePrice * FABRIC_PRICE_MULTIPLIER[fabric.fabric];
  const legAdd = leg ? (LEG_PRICE_ADD[leg.material] ?? 0) : 0;
  const extrasTotal = extras.reduce((sum, e) => sum + e.price, 0);
  return Math.round(base + legAdd + extrasTotal);
}

export const legMaterialColors: Record<string, string> = {
  walnut:        "#5C3D1E",
  oak:           "#C8A96E",
  "matte-black": "#1A1A1A",
  brass:         "#B5860D",
};
