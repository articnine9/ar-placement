"use client";

import * as THREE from "three";
import type { ProductId } from "@/types/ar";
import VFringeNecklace, { NECKLACE_BOUNDS } from "./jewelry/VFringeNecklace";

/**
 * Procedural placeholder geometry for each demo product. No GLB assets are
 * bundled for this POC, so every model is built from primitive Three.js
 * geometry, scaled to real-world meters so AR placement reads at true size.
 * Each group's origin sits at floor level (y = 0) so it lines up with the
 * AR hit-test surface or the ground plane in the 3D viewer.
 */

interface ProductMeshProps {
  productId: ProductId;
  color: string;
}

function Chair({ color }: { color: string }) {
  const wood = new THREE.Color(color);
  const legMaterial = <meshStandardMaterial color={wood.clone().multiplyScalar(0.8)} roughness={0.7} />;
  return (
    <group>
      {/* seat */}
      <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.45, 0.05, 0.45]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      {/* backrest */}
      <mesh position={[0, 0.68, -0.2]} castShadow receiveShadow>
        <boxGeometry args={[0.45, 0.45, 0.05]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      {/* legs */}
      {[
        [-0.19, -0.19],
        [0.19, -0.19],
        [-0.19, 0.19],
        [0.19, 0.19],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.225, z]} castShadow>
          <cylinderGeometry args={[0.02, 0.02, 0.45, 12]} />
          {legMaterial}
        </mesh>
      ))}
    </group>
  );
}

function Table({ color }: { color: string }) {
  const wood = new THREE.Color(color);
  const legMaterial = <meshStandardMaterial color={wood.clone().multiplyScalar(0.75)} roughness={0.65} />;
  return (
    <group>
      {/* tabletop */}
      <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.1, 0.05, 0.65]} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>
      {/* legs */}
      {[
        [-0.5, -0.27],
        [0.5, -0.27],
        [-0.5, 0.27],
        [0.5, 0.27],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.365, z]} castShadow>
          <boxGeometry args={[0.05, 0.73, 0.05]} />
          {legMaterial}
        </mesh>
      ))}
    </group>
  );
}

function Plant({ color }: { color: string }) {
  const foliage = new THREE.Color(color);
  const potColor = "#a8693f";
  return (
    <group>
      {/* pot */}
      <mesh position={[0, 0.125, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.16, 0.13, 0.25, 24]} />
        <meshStandardMaterial color={potColor} roughness={0.8} />
      </mesh>
      {/* trunk */}
      <mesh position={[0, 0.35, 0]} castShadow>
        <cylinderGeometry args={[0.02, 0.025, 0.2, 8]} />
        <meshStandardMaterial color="#5a3b25" roughness={0.9} />
      </mesh>
      {/* foliage cluster */}
      {[
        [0, 0.65, 0, 0.22],
        [0.12, 0.55, 0.08, 0.15],
        [-0.13, 0.58, -0.05, 0.16],
        [0.05, 0.75, -0.1, 0.14],
        [-0.08, 0.72, 0.1, 0.13],
      ].map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y, z]} castShadow>
          <icosahedronGeometry args={[r, 1]} />
          <meshStandardMaterial color={foliage} roughness={0.85} flatShading />
        </mesh>
      ))}
    </group>
  );
}

function Jewelry({ color }: { color: string }) {
  const gold = "#d4af37";
  return (
    <group>
      {/* display pedestal */}
      <mesh position={[0, 0.0125, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.05, 0.055, 0.025, 32]} />
        <meshStandardMaterial color="#27272a" roughness={0.4} metalness={0.3} />
      </mesh>
      {/* post */}
      <mesh position={[0, 0.05, 0]} castShadow>
        <cylinderGeometry args={[0.006, 0.006, 0.05, 12]} />
        <meshStandardMaterial color={gold} roughness={0.25} metalness={0.9} />
      </mesh>
      {/* ring band */}
      <mesh position={[0, 0.11, 0]} castShadow>
        <torusGeometry args={[0.03, 0.006, 16, 48]} />
        <meshStandardMaterial color={gold} roughness={0.2} metalness={0.9} />
      </mesh>
      {/* gem */}
      <mesh position={[0, 0.146, 0]} castShadow>
        <octahedronGeometry args={[0.014, 0]} />
        <meshStandardMaterial
          color={color}
          roughness={0.05}
          metalness={0.2}
          emissive={color}
          emissiveIntensity={0.15}
        />
      </mesh>
    </group>
  );
}

function Necklace() {
  // The shared model is in centimeters with its origin at the neck; convert to
  // meters and lift it so the lowest drop rests at y = 0 like the other products.
  return (
    <group position={[0, -NECKLACE_BOUNDS.minY * 0.01, 0]} scale={0.01}>
      <VFringeNecklace />
    </group>
  );
}

export default function ProductMesh({ productId, color }: ProductMeshProps) {
  switch (productId) {
    case "chair":
      return <Chair color={color} />;
    case "table":
      return <Table color={color} />;
    case "plant":
      return <Plant color={color} />;
    case "necklace":
      return <Necklace />;
    case "jewelry":
      return <Jewelry color={color} />;
    default:
      return null;
  }
}
