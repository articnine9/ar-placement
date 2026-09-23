export type ProductId = "chair" | "table" | "plant" | "jewelry" | "necklace";

/**
 * How a product is tried on in AR.
 * - "surface": WebXR hit-test placement on a real-world floor/table (rear camera).
 * - "face": live face-tracked overlay worn on the neck (front/selfie camera).
 */
export type ARPlacementMode = "surface" | "face";

export interface Product {
  id: ProductId;
  name: string;
  description: string;
  /** Primary accent color for the procedural model and UI. */
  color: string;
  /** Real-world footprint in meters, used to size the AR placement helper. */
  footprint: {
    width: number;
    depth: number;
    height: number;
  };
  mode: ARPlacementMode;
}

export type ARSessionStatus =
  | "idle"
  | "requesting-permission"
  | "starting"
  | "searching-surface"
  | "placed"
  | "error"
  | "ended";

export interface ARSession {
  status: ARSessionStatus;
  error?: string;
}

export interface ARCapabilities {
  /** Whether the check has finished running. */
  checked: boolean;
  /** `navigator.xr` exists on this browser. */
  isWebXRAvailable: boolean;
  /** `navigator.xr.isSessionSupported('immersive-ar')` resolved true. */
  isARSupported: boolean;
  /** Page is served from a secure context (https or localhost). WebXR requires this. */
  isSecureContext: boolean;
  /** Friendly explanation when AR is not available. */
  reason?: string;
}

export interface PlacedTransform {
  position: [number, number, number];
  rotationY: number;
  scale: number;
}

export type FaceARStatus =
  | "idle"
  | "requesting-permission"
  | "loading-model"
  | "tracking"
  | "error"
  | "ended";

export interface FaceARSession {
  status: FaceARStatus;
  faceDetected: boolean;
  error?: string;
}
