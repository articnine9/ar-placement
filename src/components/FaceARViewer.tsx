"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
} from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { FaceLandmarker } from "@mediapipe/tasks-vision";
import type { FaceARStatus, Product } from "@/types/ar";

/**
 * Real face-tracked "try it on" viewer for products worn on the body (e.g. a
 * necklace). This is NOT WebXR — phones don't expose face tracking through
 * WebXR — so instead it runs the front camera through MediaPipe's
 * FaceLandmarker (on-device, WASM/GPU) and rigidly attaches the model to the
 * detected face transform every frame. Kept fully separate from ARViewer,
 * which only ever does WebXR surface hit-testing on the rear camera.
 */

interface FaceARViewerProps {
  product: Product;
  onExit: () => void;
}

const WASM_BASE = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

// MediaPipe's facial transformation matrix lives in its canonical face
// model's own coordinate space, documented as roughly centimeter-scale
// around the face center. These offsets were eyeballed from that
// convention (not measured on a live face) to land around the base of the
// neck/collar. If the necklace sits too high/low, adjust NECK_OFFSET; if
// the pendant ends up behind the neck instead of in front, flip FRONT_Z.
const NECK_OFFSET = new THREE.Vector3(0, -19, 2);
const FRONT_Z = 1;

function NecklaceModel({ color }: { color: string }) {
  const gold = "#d4af37";
  return (
    <group>
      {/* chain loop, sized to hang around a neck in this cm-scale space */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} scale={[1, 1, 0.6]}>
        <torusGeometry args={[7.5, 0.45, 16, 48]} />
        <meshStandardMaterial color={gold} roughness={0.25} metalness={0.9} />
      </mesh>
      {/* pendant drop, hanging on the front-facing side */}
      <mesh position={[0, -0.9, FRONT_Z * 6]}>
        <cylinderGeometry args={[0.12, 0.12, 1.6, 8]} />
        <meshStandardMaterial color={gold} roughness={0.3} metalness={0.85} />
      </mesh>
      <mesh position={[0, -2.1, FRONT_Z * 6]}>
        <octahedronGeometry args={[1.1, 0]} />
        <meshStandardMaterial
          color={color}
          roughness={0.05}
          metalness={0.2}
          emissive={color}
          emissiveIntensity={0.2}
        />
      </mesh>
    </group>
  );
}

function FaceAnchoredNecklace({
  matrixRef,
  visibleRef,
  color,
}: {
  matrixRef: MutableRefObject<Float32Array | null>;
  visibleRef: MutableRefObject<boolean>;
  color: string;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const faceMatrix = useRef(new THREE.Matrix4()).current;
  const offsetMatrix = useRef(
    new THREE.Matrix4().makeTranslation(NECK_OFFSET.x, NECK_OFFSET.y, NECK_OFFSET.z)
  ).current;

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;
    const data = matrixRef.current;
    if (!data || !visibleRef.current) {
      group.visible = false;
      return;
    }
    group.visible = true;
    faceMatrix.fromArray(data);
    faceMatrix.multiply(offsetMatrix);
    faceMatrix.decompose(group.position, group.quaternion, group.scale);
  });

  return (
    <group ref={groupRef} visible={false}>
      <NecklaceModel color={color} />
    </group>
  );
}

export default function FaceARViewer({ product, onExit }: FaceARViewerProps) {
  const [status, setStatus] = useState<FaceARStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [videoSize, setVideoSize] = useState<{ width: number; height: number } | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const landmarkerRef = useRef<FaceLandmarker | null>(null);
  const rafRef = useRef<number | null>(null);
  const matrixRef = useRef<Float32Array | null>(null);
  const visibleRef = useRef(false);

  const stopEverything = useCallback(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    landmarkerRef.current?.close();
    landmarkerRef.current = null;
  }, []);

  useEffect(() => stopEverything, [stopEverything]);

  const handleStart = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setStatus("error");
      setErrorMessage("Camera access isn't available in this browser. Make sure you're using HTTPS.");
      return;
    }

    setErrorMessage(null);
    setStatus("requesting-permission");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;

      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play();
      setVideoSize({ width: video.videoWidth, height: video.videoHeight });

      setStatus("loading-model");
      const { FaceLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision");
      const filesetResolver = await FilesetResolver.forVisionTasks(WASM_BASE);

      const baseOptions = { modelAssetPath: MODEL_URL };
      let landmarker: FaceLandmarker;
      try {
        landmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: { ...baseOptions, delegate: "GPU" },
          runningMode: "VIDEO",
          numFaces: 1,
          outputFacialTransformationMatrixes: true,
          outputFaceBlendshapes: false,
        });
      } catch {
        // Some devices/browsers can't initialize the GPU delegate; fall back to CPU.
        landmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: { ...baseOptions, delegate: "CPU" },
          runningMode: "VIDEO",
          numFaces: 1,
          outputFacialTransformationMatrixes: true,
          outputFaceBlendshapes: false,
        });
      }
      landmarkerRef.current = landmarker;

      setStatus("tracking");

      const loop = () => {
        const v = videoRef.current;
        const lm = landmarkerRef.current;
        if (v && lm && v.readyState >= 2) {
          const result = lm.detectForVideo(v, performance.now());
          const matrix = result.facialTransformationMatrixes[0];
          if (matrix) {
            matrixRef.current = Float32Array.from(matrix.data);
            visibleRef.current = true;
            setFaceDetected((prev) => (prev ? prev : true));
          } else {
            visibleRef.current = false;
            setFaceDetected((prev) => (prev ? false : prev));
          }
        }
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
    } catch (err) {
      const error = err as DOMException;
      setStatus("error");
      if (error?.name === "NotAllowedError") {
        setErrorMessage("Camera permission was denied. Allow camera access and try again.");
      } else if (error?.name === "NotFoundError") {
        setErrorMessage("No front-facing camera was found on this device.");
      } else if (error?.name === "NotReadableError") {
        setErrorMessage("The camera is already in use by another app.");
      } else {
        setErrorMessage(error?.message || "Couldn't start face tracking. Check your connection and try again.");
      }
      stopEverything();
    }
  }, [stopEverything]);

  const handleExit = useCallback(() => {
    stopEverything();
    onExit();
  }, [stopEverything, onExit]);

  const fovDeg = useMemo(() => {
    if (!videoSize) return 50;
    // Focal length in pixels is assumed ~= image width, the same convention
    // MediaPipe uses internally when it computes the transformation matrix.
    return 2 * Math.atan(0.5 * videoSize.height / videoSize.width) * (180 / Math.PI);
  }, [videoSize]);

  const showStartScreen = status === "idle" || status === "requesting-permission" || status === "error";

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      {/* Mirror both the camera feed and the overlay together, like a mirror. */}
      <div className="absolute inset-0" style={{ transform: "scaleX(-1)" }}>
        <video
          ref={videoRef}
          playsInline
          muted
          className="absolute inset-0 h-full w-full object-cover"
        />
        {videoSize && (status === "tracking" || status === "loading-model") && (
          <div className="absolute inset-0">
            <Canvas
              gl={{ alpha: true, antialias: true }}
              dpr={[1, 2]}
              camera={{ position: [0, 0, 0], fov: fovDeg, near: 1, far: 500 }}
            >
              <ambientLight intensity={1.2} />
              <directionalLight position={[0, 5, 10]} intensity={0.7} />
              <FaceAnchoredNecklace matrixRef={matrixRef} visibleRef={visibleRef} color={product.color} />
            </Canvas>
          </div>
        )}
      </div>

      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
        <div className="flex justify-end p-4">
          <button
            type="button"
            onClick={handleExit}
            className="pointer-events-auto rounded-full bg-black/60 px-4 py-2 text-sm font-semibold text-white backdrop-blur"
          >
            Exit
          </button>
        </div>

        {status === "tracking" && (
          <div className="flex flex-col items-center gap-2 pb-10">
            <p className="rounded-full bg-black/60 px-4 py-2 text-center text-sm text-white">
              {faceDetected
                ? `Trying on the ${product.name.toLowerCase()}`
                : "Center your face in the frame"}
            </p>
          </div>
        )}
      </div>

      {status === "loading-model" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70 text-white">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-600 border-t-white" />
          <p className="text-sm text-white/70">Loading face tracking…</p>
        </div>
      )}

      {showStartScreen && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black px-6 text-center text-white">
          <p className="text-lg font-semibold">Try on the {product.name.toLowerCase()}?</p>
          <p className="max-w-xs text-sm text-white/70">
            Uses your front camera and on-device face tracking. Nothing is uploaded or recorded.
          </p>
          <button
            type="button"
            onClick={handleStart}
            disabled={status === "requesting-permission"}
            className="rounded-full bg-white px-8 py-4 text-base font-bold text-black disabled:opacity-60"
          >
            {status === "requesting-permission" ? "Starting…" : "Start Try-On"}
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
