"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { XR, createXRStore, useXRHitTest, XRDomOverlay } from "@react-three/xr";
import * as THREE from "three";
import ProductMesh from "./ProductMesh";
import type { Product, ARSessionStatus } from "@/types/ar";

/**
 * Real WebXR "immersive-ar" viewer: hit-test driven placement plus
 * drag-to-move and press-and-drag rotate/scale controls, rendered through a
 * WebXR DOM Overlay so the buttons sit on top of the live camera feed. Kept
 * fully separate from `ModelViewer`, which only ever runs a plain 3D canvas.
 */

const store = createXRStore({
  // Force hit-test to be required: some browsers silently grant it as
  // optional-but-unavailable, which makes surface detection hang forever
  // with no error. Requiring it makes session start fail loudly instead,
  // which we already surface via the enterAR() catch block below.
  hitTest: "required",
});

const ROTATE_SENSITIVITY = 0.012; // radians per px dragged
const SCALE_SENSITIVITY = 0.004; // scale units per px dragged
const MIN_SCALE = 0.4;
const MAX_SCALE = 2.2;

interface ARViewerProps {
  product: Product;
  onExit: () => void;
}

interface DragState {
  pointerId: number;
  mode: "move" | "rotate" | "scale";
  startX: number;
  startRotationY: number;
  startScale: number;
}

function CameraCapture({ cameraRef }: { cameraRef: MutableRefObject<THREE.Camera | null> }) {
  const { camera } = useThree((s) => ({ camera: s.camera }));
  useEffect(() => {
    cameraRef.current = camera;
  }, [camera, cameraRef]);
  return null;
}

function Reticle({
  reticleRef,
  onHitChange,
}: {
  reticleRef: MutableRefObject<THREE.Mesh | null>;
  onHitChange: (hit: boolean) => void;
}) {
  const geometry = useMemo(() => new THREE.RingGeometry(0.07, 0.09, 32).rotateX(-Math.PI / 2), []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const wasVisible = useRef(false);
  const matrixHelper = useRef(new THREE.Matrix4()).current;

  useXRHitTest((results, getWorldMatrix) => {
    const mesh = reticleRef.current;
    if (!mesh) return;
    if (results.length === 0) {
      if (wasVisible.current) {
        wasVisible.current = false;
        mesh.visible = false;
        onHitChange(false);
      }
      return;
    }
    const ok = getWorldMatrix(matrixHelper, results[0]);
    if (!ok) return;
    matrixHelper.decompose(mesh.position, mesh.quaternion, mesh.scale);
    mesh.visible = true;
    if (!wasVisible.current) {
      wasVisible.current = true;
      onHitChange(true);
    }
  }, "viewer");

  return (
    <mesh ref={reticleRef} geometry={geometry} visible={false}>
      <meshBasicMaterial color="#22d3ee" transparent opacity={0.9} side={THREE.DoubleSide} />
    </mesh>
  );
}

export default function ARViewer({ product, onExit }: ARViewerProps) {
  const [status, setStatus] = useState<ARSessionStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasHit, setHasHit] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [showScanTip, setShowScanTip] = useState(false);

  const cameraRef = useRef<THREE.Camera | null>(null);
  const reticleRef = useRef<THREE.Mesh | null>(null);
  const productGroupRef = useRef<THREE.Group | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);

  const initialTransformRef = useRef<{ position: THREE.Vector3; rotationY: number } | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const groundPlaneRef = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));

  useEffect(() => {
    const unsubscribe = store.subscribe((state) => {
      if (state.session) {
        setStatus((prev) => (prev === "placed" ? prev : "searching-surface"));
      } else {
        setPlaced(false);
        setHasHit(false);
        setStatus((prev) => (prev === "idle" || prev === "error" ? prev : "ended"));
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    return () => {
      store.getState().session?.end();
    };
  }, []);

  // If surface scanning drags on, nudge the user on how ARCore actually
  // finds a plane (it needs a few seconds of camera motion over texture).
  useEffect(() => {
    if (status !== "searching-surface" || hasHit) {
      return;
    }
    const timer = setTimeout(() => setShowScanTip(true), 8000);
    return () => {
      clearTimeout(timer);
      setShowScanTip(false);
    };
  }, [status, hasHit]);

  const handleEnterAR = useCallback(async () => {
    setErrorMessage(null);
    setStatus("requesting-permission");
    try {
      const session = await store.enterAR();
      if (!session) {
        setStatus("error");
        setErrorMessage("AR session could not be started.");
        return;
      }
      setStatus("searching-surface");
    } catch (err) {
      const error = err as DOMException;
      setStatus("error");
      if (error?.name === "NotAllowedError") {
        setErrorMessage("Camera permission was denied. Allow camera access in your browser settings and try again.");
      } else if (error?.name === "NotSupportedError") {
        setErrorMessage("This device doesn't support the AR features this demo needs.");
      } else if (error?.name === "SecurityError") {
        setErrorMessage("AR requires a secure (HTTPS) connection.");
      } else {
        setErrorMessage(error?.message || "Could not start the AR session.");
      }
    }
  }, []);

  const handlePlace = useCallback(() => {
    const reticle = reticleRef.current;
    const group = productGroupRef.current;
    if (!reticle || !reticle.visible || !group) return;

    group.position.copy(reticle.position);
    const rotationY = new THREE.Euler().setFromQuaternion(reticle.quaternion, "YXZ").y;
    group.rotation.set(0, rotationY, 0);
    group.scale.setScalar(1);

    groundPlaneRef.current.set(new THREE.Vector3(0, 1, 0), -reticle.position.y);
    initialTransformRef.current = { position: reticle.position.clone(), rotationY };

    setPlaced(true);
    setStatus("placed");
  }, []);

  const handleReset = useCallback(() => {
    const group = productGroupRef.current;
    const initial = initialTransformRef.current;
    if (!group || !initial) return;
    group.position.copy(initial.position);
    group.rotation.set(0, initial.rotationY, 0);
    group.scale.setScalar(1);
  }, []);

  const handleExit = useCallback(() => {
    store.getState().session?.end();
    onExit();
  }, [onExit]);

  const pointerToNDC = useCallback((clientX: number, clientY: number) => {
    const rect = overlayRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return null;
    return new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    );
  }, []);

  const handleSurfacePointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!placed || dragRef.current) return;
      dragRef.current = {
        pointerId: e.pointerId,
        mode: "move",
        startX: e.clientX,
        startRotationY: productGroupRef.current?.rotation.y ?? 0,
        startScale: productGroupRef.current?.scale.x ?? 1,
      };
      overlayRef.current?.setPointerCapture?.(e.pointerId);
    },
    [placed]
  );

  const handleOverlayPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== e.pointerId) return;
      const group = productGroupRef.current;
      if (!group) return;

      if (drag.mode === "move") {
        const camera = cameraRef.current;
        const ndc = pointerToNDC(e.clientX, e.clientY);
        if (!ndc || !camera) return;
        raycasterRef.current.setFromCamera(ndc, camera);
        const hit = new THREE.Vector3();
        if (raycasterRef.current.ray.intersectPlane(groundPlaneRef.current, hit)) {
          group.position.x = hit.x;
          group.position.z = hit.z;
        }
      } else {
        const deltaX = e.clientX - drag.startX;
        if (drag.mode === "rotate") {
          group.rotation.y = drag.startRotationY + deltaX * ROTATE_SENSITIVITY;
        } else {
          const next = THREE.MathUtils.clamp(
            drag.startScale + deltaX * SCALE_SENSITIVITY,
            MIN_SCALE,
            MAX_SCALE
          );
          group.scale.setScalar(next);
        }
      }
    },
    [pointerToNDC]
  );

  const endDrag = useCallback((e: ReactPointerEvent) => {
    if (dragRef.current?.pointerId === e.pointerId) {
      dragRef.current = null;
    }
  }, []);

  const startGestureDrag = useCallback(
    (mode: "rotate" | "scale") => (e: ReactPointerEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      dragRef.current = {
        pointerId: e.pointerId,
        mode,
        startX: e.clientX,
        startRotationY: productGroupRef.current?.rotation.y ?? 0,
        startScale: productGroupRef.current?.scale.x ?? 1,
      };
      overlayRef.current?.setPointerCapture?.(e.pointerId);
    },
    []
  );

  const inSession = status === "searching-surface" || status === "placed";

  return (
    <div className="relative h-full w-full bg-black">
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        camera={{ position: [0, 1.4, 1.4], fov: 60 }}
      >
        <XR store={store}>
          <CameraCapture cameraRef={cameraRef} />
          <ambientLight intensity={0.9} />
          <directionalLight position={[2, 4, 2]} intensity={1.1} castShadow />

          {!placed && <Reticle reticleRef={reticleRef} onHitChange={setHasHit} />}

          <group ref={productGroupRef} visible={placed}>
            <ProductMesh productId={product.id} color={product.color} />
          </group>

          <XRDomOverlay>
            <div
              ref={overlayRef}
              className="fixed inset-0 flex h-full w-full touch-none flex-col justify-between"
              onPointerDown={handleSurfacePointerDown}
              onPointerMove={handleOverlayPointerMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
            >
              <div className="flex justify-end p-4">
                <button
                  type="button"
                  onClick={handleExit}
                  className="pointer-events-auto rounded-full bg-black/60 px-4 py-2 text-sm font-semibold text-white backdrop-blur"
                >
                  Exit AR
                </button>
              </div>

              {!placed && (
                <div className="flex flex-col items-center gap-3 pb-10">
                  <p className="pointer-events-none max-w-xs rounded-full bg-black/60 px-4 py-2 text-center text-sm text-white">
                    {hasHit
                      ? `Tap "Place" to add the ${product.name.toLowerCase()}`
                      : showScanTip
                        ? "Still scanning — slowly move your phone over a well-lit, textured surface like a patterned floor or tabletop"
                        : "Move your phone to find a flat surface"}
                  </p>
                  <button
                    type="button"
                    disabled={!hasHit}
                    onClick={handlePlace}
                    className="pointer-events-auto rounded-full bg-white px-8 py-4 text-base font-bold text-black shadow-lg disabled:opacity-40"
                  >
                    Place {product.name}
                  </button>
                </div>
              )}

              {placed && (
                <div className="flex flex-col items-center gap-3 pb-8">
                  <p className="pointer-events-none rounded-full bg-black/60 px-3 py-1.5 text-center text-xs text-white/80">
                    Drag the {product.name.toLowerCase()} to move it
                  </p>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onPointerDown={startGestureDrag("rotate")}
                      onPointerUp={endDrag}
                      onPointerCancel={endDrag}
                      className="pointer-events-auto w-28 touch-none rounded-2xl bg-black/60 py-4 text-sm font-semibold text-white backdrop-blur active:bg-black/80"
                    >
                      ⟲ Rotate
                    </button>
                    <button
                      type="button"
                      onPointerDown={startGestureDrag("scale")}
                      onPointerUp={endDrag}
                      onPointerCancel={endDrag}
                      className="pointer-events-auto w-28 touch-none rounded-2xl bg-black/60 py-4 text-sm font-semibold text-white backdrop-blur active:bg-black/80"
                    >
                      ⤢ Scale
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="pointer-events-auto rounded-full bg-black/60 px-6 py-3 text-sm font-semibold text-white backdrop-blur"
                  >
                    Reset
                  </button>
                </div>
              )}
            </div>
          </XRDomOverlay>
        </XR>
      </Canvas>

      {!inSession && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black px-6 text-center text-white">
          <p className="text-lg font-semibold">Ready to place the {product.name.toLowerCase()}?</p>
          <p className="max-w-xs text-sm text-white/70">
            Point your camera at a flat surface like a floor or tabletop, then tap Start AR.
          </p>
          <button
            type="button"
            onClick={handleEnterAR}
            disabled={status === "requesting-permission"}
            className="rounded-full bg-white px-8 py-4 text-base font-bold text-black disabled:opacity-60"
          >
            {status === "requesting-permission" ? "Starting…" : "Start AR"}
          </button>
          {errorMessage && <p className="max-w-xs text-sm text-red-400">{errorMessage}</p>}
          <button type="button" onClick={onExit} className="text-sm text-white/60 underline">
            Back to preview
          </button>
        </div>
      )}
    </div>
  );
}
