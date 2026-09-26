import type { Product, ProductId } from "@/types/ar";

export const PRODUCTS: Product[] = [
  {
    id: "chair",
    name: "Chair",
    description: "A simple accent chair to test scale and placement.",
    color: "#c2884f",
    footprint: { width: 0.5, depth: 0.5, height: 0.9 },
    mode: "surface",
  },
  {
    id: "table",
    name: "Table",
    description: "A compact side table with four legs.",
    color: "#8a5a34",
    footprint: { width: 1.1, depth: 0.65, height: 0.75 },
    mode: "surface",
  },
  {
    id: "plant",
    name: "Plant",
    description: "A potted plant to check how greenery fits your space.",
    color: "#3f7d3a",
    footprint: { width: 0.45, depth: 0.45, height: 0.85 },
    mode: "surface",
  },
  {
    id: "jewelry",
    name: "Ring",
    description: "A ring on a display stand to preview jewelry placement.",
    color: "#38bdf8",
    footprint: { width: 0.11, depth: 0.11, height: 0.16 },
    mode: "surface",
  },
  {
    id: "necklace",
    name: "V-Fringe Necklace",
    description: "A gold V-collar necklace with diamond-pavé fringe drops, try it on live using face tracking.",
    color: "#d4b06f",
    footprint: { width: 0.14, depth: 0.12, height: 0.18 },
    mode: "face",
  },
];

export function getProduct(id: string | undefined | null): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

export function isProductId(id: string): id is ProductId {
  return PRODUCTS.some((p) => p.id === id);
}
