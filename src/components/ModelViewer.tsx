"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, ContactShadows } from "@react-three/drei";
import ProductMesh from "./ProductMesh";
import type { Product } from "@/types/ar";

interface ModelViewerProps {
  product: Product;
}

function Loader() {
  return (
    <mesh>
      <boxGeometry args={[0.3, 0.3, 0.3]} />
      <meshStandardMaterial color="#d4d4d8" wireframe />
    </mesh>
  );
}

/**
 * Standard (non-AR) 3D preview: orbit/zoom/pan around the product with
 * studio lighting and a soft contact shadow. Fully self-contained so it can
 * be dynamically imported only on pages that need it.
 */
export default function ModelViewer({ product }: ModelViewerProps) {
  const targetHeight = product.footprint.height / 2;

  // Frame the camera relative to each product's real-world size so a small
  // item (e.g. a 0.16m ring) isn't left tiny in frame at the same fixed
  // distance tuned for ~1m furniture.
  const size = Math.max(product.footprint.width, product.footprint.depth, product.footprint.height);
  const distance = size * 2.6;
  const cameraPosition: [number, number, number] = [distance * 0.6, distance * 0.47, distance * 0.68];
  const minDistance = size * 0.9;
  const maxDistance = size * 8;
  const shadowScale = Math.max(size * 4, 1.5);
  const shadowFar = Math.max(size * 2, 1);

  return (
    <div className="absolute inset-0 touch-none">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: cameraPosition, fov: 40 }}
        className="!touch-none"
      >
        <color attach="background" args={["#f4f4f5"]} />
        <ambientLight intensity={0.7} />
        <directionalLight
          position={[3, 4, 2]}
          intensity={1.4}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <directionalLight position={[-3, 2, -2]} intensity={0.4} />
        <Suspense fallback={<Loader />}>
          <group position={[0, -targetHeight, 0]}>
            <ProductMesh productId={product.id} color={product.color} />
          </group>
          <ContactShadows
            position={[0, -targetHeight, 0]}
            opacity={0.5}
            scale={shadowScale}
            blur={2.4}
            far={shadowFar}
          />
        </Suspense>
        <OrbitControls
          makeDefault
          enablePan
          enableZoom
          enableRotate
          minDistance={minDistance}
          maxDistance={maxDistance}
          target={[0, 0, 0]}
        />
      </Canvas>
    </div>
  );
}
