"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { Environment, Float, Lightformer, OrbitControls, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import VFringeNecklace, { NECKLACE_BOUNDS } from "./VFringeNecklace";

const FOV = 34;
const TARGET_Y = (NECKLACE_BOUNDS.minY + NECKLACE_BOUNDS.maxY) / 2;
const HALF_HEIGHT = (NECKLACE_BOUNDS.maxY - NECKLACE_BOUNDS.minY) / 2 + 1;
const HALF_WIDTH = NECKLACE_BOUNDS.halfWidth + 1;

function ShowcaseControls() {
  const size = useThree((s) => s.size);
  const aspect = size.width / Math.max(size.height, 1);
  const tanHalf = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
  // Fit the whole piece whether the canvas is a tall phone column or a wide desktop panel.
  const distance = Math.max(HALF_HEIGHT / tanHalf, HALF_WIDTH / (tanHalf * aspect));

  return (
    <OrbitControls
      makeDefault
      target={[0, TARGET_Y, 0]}
      enableZoom={false}
      enablePan={false}
      enableDamping
      autoRotate
      autoRotateSpeed={0.7}
      rotateSpeed={0.55}
      minDistance={distance}
      maxDistance={distance}
      minPolarAngle={Math.PI / 2 - 0.35}
      maxPolarAngle={Math.PI / 2 + 0.2}
    />
  );
}

export default function NecklaceShowcase() {
  return (
    <Canvas
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true }}
      camera={{ position: [0, TARGET_Y, 40], fov: FOV, near: 1, far: 200 }}
    >
      <ambientLight intensity={0.35} />
      <directionalLight position={[6, 10, 14]} intensity={1.6} />
      <directionalLight position={[-9, 2, 6]} intensity={0.6} color="#fff1d6" />

      <Float speed={1.1} rotationIntensity={0.12} floatIntensity={0.35}>
        <VFringeNecklace />
      </Float>

      <Sparkles
        count={36}
        scale={[22, 20, 10]}
        position={[0, TARGET_Y, -2]}
        size={2.2}
        speed={0.25}
        opacity={0.55}
        color="#E5CFA8"
      />

      {/* Studio reflections generated in-scene, so no HDR file has to be fetched. */}
      <Environment resolution={256}>
        <Lightformer form="rect" intensity={3} position={[0, 6, 12]} scale={[22, 6, 1]} />
        <Lightformer form="rect" intensity={2} position={[-12, 0, 4]} rotation-y={Math.PI / 2} scale={[12, 12, 1]} color="#fff1d6" />
        <Lightformer form="rect" intensity={1.6} position={[12, 0, 4]} rotation-y={-Math.PI / 2} scale={[12, 12, 1]} />
        <Lightformer form="ring" intensity={4} position={[0, 10, -8]} scale={7} />
        {/* dim wrap-around fill so off-axis metal never mirrors pure black */}
        <Lightformer form="rect" intensity={0.8} position={[0, -12, 0]} rotation-x={-Math.PI / 2} scale={[40, 40, 1]} color="#f3ead9" />
        <Lightformer form="rect" intensity={0.6} position={[0, 0, -16]} scale={[40, 30, 1]} color="#f3ead9" />
      </Environment>

      <ShowcaseControls />
    </Canvas>
  );
}
