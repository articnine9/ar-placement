"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";

/**
 * Procedural model of the V-fringe diamond necklace: a sculpted V collar set
 * with pavé, polished gold bar sections, graduated fringe rods ending in
 * diamond-pavé rhombus drops, and a chain that loops behind the neck.
 *
 * Units are centimeters. Origin is the center of the neck at collar height,
 * +Y up, +Z toward the viewer. That makes it drop straight onto the face
 * tracker (also ~cm-scale); other callers scale it by 0.01 to get meters.
 */

const BAND_TOP = new THREE.Vector3(-6.2, -1.0, 3.2);
const BAND_CTRL = new THREE.Vector3(-5.4, -5.8, 4.4);
const V_POINT = new THREE.Vector3(0, -8.0, 5.4);

const DROPS_PER_SIDE = 17;
const BAND_RADIUS = 0.1;
const GOLD_BAR_RANGES: [number, number][] = [
  [0.1, 0.3],
  [0.5, 0.68],
];

export const NECKLACE_BOUNDS = { minY: -15.2, maxY: 2.7, halfWidth: 6.7, minZ: -6.3, maxZ: 5.7 };

class SubCurve extends THREE.Curve<THREE.Vector3> {
  constructor(
    private readonly base: THREE.Curve<THREE.Vector3>,
    private readonly from: number,
    private readonly to: number
  ) {
    super();
  }

  getPoint(t: number, target = new THREE.Vector3()) {
    return this.base.getPoint(this.from + (this.to - this.from) * t, target);
  }
}

function mirrorX(v: THREE.Vector3) {
  return new THREE.Vector3(-v.x, v.y, v.z);
}

function inGoldBar(t: number) {
  return GOLD_BAR_RANGES.some(([a, b]) => t >= a - 0.015 && t <= b + 0.015);
}

function makePaveTexture() {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#b9bfc8";
  ctx.fillRect(0, 0, size, size);
  const cell = size / 4;
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      const x = col * cell + (row % 2 ? cell / 2 : 0);
      const y = row * cell;
      const g = ctx.createRadialGradient(x - 3, y - 3, 1, x, y, cell * 0.46);
      g.addColorStop(0, "#ffffff");
      g.addColorStop(0.55, "#f3f5f8");
      g.addColorStop(1, "#d3d8df");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, cell * 0.44, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(10, 10);
  return texture;
}

function makeRhombusShape(width: number, height: number) {
  const shape = new THREE.Shape();
  shape.moveTo(0, height / 2);
  shape.lineTo(width / 2, 0);
  shape.lineTo(0, -height / 2);
  shape.lineTo(-width / 2, 0);
  shape.closePath();
  return shape;
}

interface Layout {
  rods: THREE.Matrix4[];
  rhombuses: THREE.Matrix4[];
  diamonds: THREE.Matrix4[];
  bails: THREE.Matrix4[];
}

function buildLayout(bands: THREE.Curve<THREE.Vector3>[]): Layout {
  const rods: THREE.Matrix4[] = [];
  const rhombuses: THREE.Matrix4[] = [];
  const diamonds: THREE.Matrix4[] = [];
  const bails: THREE.Matrix4[] = [];
  const q = new THREE.Quaternion();

  const place = (list: THREE.Matrix4[], pos: THREE.Vector3, scale: THREE.Vector3) =>
    list.push(new THREE.Matrix4().compose(pos, q, scale));

  const addDrop = (anchor: THREE.Vector3, length: number, pendantYs: number[], pendantScale: number[]) => {
    const top = anchor.y - BAND_RADIUS;
    place(bails, new THREE.Vector3(anchor.x, top, anchor.z), new THREE.Vector3(1, 1, 1));
    place(rods, new THREE.Vector3(anchor.x, top - length / 2, anchor.z), new THREE.Vector3(1, length, 1));
    pendantYs.forEach((y, i) => {
      const s = pendantScale[i];
      place(rhombuses, new THREE.Vector3(anchor.x, top - y, anchor.z), new THREE.Vector3(s, s, s));
    });
    if (pendantYs.length === 1 && length > 1.2) {
      place(diamonds, new THREE.Vector3(anchor.x, top - length * 0.45, anchor.z + 0.02), new THREE.Vector3(0.07, 0.07, 0.07));
    }
  };

  bands.forEach((band) => {
    // pavé row set into the front of the collar
    for (let i = 0; i <= 46; i++) {
      const t = i / 46;
      if (inGoldBar(t)) continue;
      const p = band.getPoint(t);
      place(diamonds, new THREE.Vector3(p.x, p.y, p.z + BAND_RADIUS * 0.75), new THREE.Vector3(0.075, 0.075, 0.075));
    }

    // graduated fringe
    for (let i = 0; i < DROPS_PER_SIDE; i++) {
      const t = 0.06 + (i * 0.9) / (DROPS_PER_SIDE - 1);
      const anchor = band.getPoint(t);
      if (t < 0.28) {
        addDrop(anchor, 0.28, [0.28 + 0.26], [0.72]);
        continue;
      }
      const u = (t - 0.28) / (0.96 - 0.28);
      let length = 0.9 + 4.6 * Math.pow(u, 1.3);
      if (i % 2 === 1) length *= 0.62;
      const ys = [length + 0.39];
      const scales = [1];
      if (length > 2.4) {
        ys.unshift(length * 0.5);
        scales.unshift(0.72);
      }
      addDrop(anchor, length, ys, scales);
    }
  });

  // longest centerpiece drop at the V point
  const centerLength = 6.2;
  addDrop(V_POINT, centerLength, [centerLength * 0.3, centerLength * 0.62, centerLength + 0.39], [0.72, 0.85, 1.1]);

  return { rods, rhombuses, diamonds, bails };
}

function InstancedGroup({
  geometry,
  material,
  matrices,
}: {
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  matrices: THREE.Matrix4[];
}) {
  const ref = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    matrices.forEach((m, i) => mesh.setMatrixAt(i, m));
    mesh.instanceMatrix.needsUpdate = true;
  }, [matrices]);

  return (
    <instancedMesh
      ref={ref}
      args={[geometry, material, matrices.length]}
      frustumCulled={false}
      castShadow
    />
  );
}

export default function VFringeNecklace() {
  const assets = useMemo(() => {
    const leftBand = new THREE.QuadraticBezierCurve3(BAND_TOP, BAND_CTRL, V_POINT);
    const rightBand = new THREE.QuadraticBezierCurve3(mirrorX(BAND_TOP), mirrorX(BAND_CTRL), V_POINT);
    const bands = [leftBand, rightBand];

    const chain = new THREE.CatmullRomCurve3(
      [
        [-6.2, -1.0, 3.2],
        [-6.55, 0.4, 2.1],
        [-6.2, 1.6, -1.2],
        [-4.0, 2.3, -4.6],
        [0, 2.6, -6.2],
        [4.0, 2.3, -4.6],
        [6.2, 1.6, -1.2],
        [6.55, 0.4, 2.1],
        [6.2, -1.0, 3.2],
      ].map(([x, y, z]) => new THREE.Vector3(x, y, z))
    );

    const gold = new THREE.MeshStandardMaterial({ color: "#e3b964", metalness: 1, roughness: 0.24 });
    const polishedGold = new THREE.MeshStandardMaterial({ color: "#eac47a", metalness: 1, roughness: 0.22 });
    // Small bevelled rims mostly face off-axis; a satin finish keeps them gold
    // instead of reflecting unlit (black) parts of the environment.
    const frameGold = new THREE.MeshStandardMaterial({ color: "#e3b964", metalness: 0.7, roughness: 0.32 });
    // Diamonds: low metalness plus a touch of emissive so they stay bright white
    // like pavé in a product photo, instead of mirroring dark parts of the room.
    const diamond = new THREE.MeshStandardMaterial({
      color: "#ffffff",
      metalness: 0.25,
      roughness: 0.1,
      emissive: "#ffffff",
      emissiveIntensity: 0.12,
      flatShading: true,
    });
    const paveTexture = makePaveTexture();
    const pave = new THREE.MeshStandardMaterial({
      color: "#ffffff",
      map: paveTexture,
      emissive: "#ffffff",
      emissiveMap: paveTexture,
      emissiveIntensity: 0.28,
      metalness: 0.2,
      roughness: 0.22,
    });

    const bandGeometries = bands.map((b) => new THREE.TubeGeometry(b, 64, BAND_RADIUS, 10, false));
    const barGeometries = bands.flatMap((b) =>
      GOLD_BAR_RANGES.map(([from, to]) => new THREE.TubeGeometry(new SubCurve(b, from, to), 24, BAND_RADIUS * 1.35, 12, false))
    );
    const chainGeometry = new THREE.TubeGeometry(chain, 220, 0.035, 6, false);
    const vCapGeometry = new THREE.SphereGeometry(BAND_RADIUS * 1.3, 16, 12);

    const rhombusShape = makeRhombusShape(0.5, 0.78);
    const rhombusFrame = new THREE.ExtrudeGeometry(rhombusShape, {
      depth: 0.1,
      bevelEnabled: true,
      bevelThickness: 0.025,
      bevelSize: 0.03,
      bevelSegments: 2,
    });
    rhombusFrame.center();
    const rhombusFace = new THREE.ShapeGeometry(makeRhombusShape(0.45, 0.7));
    rhombusFace.translate(0, 0, 0.078);

    const rodGeometry = new THREE.CylinderGeometry(0.028, 0.028, 1, 6);
    const diamondGeometry = new THREE.IcosahedronGeometry(1, 1);
    const bailGeometry = new THREE.SphereGeometry(0.06, 8, 8);

    return {
      layout: buildLayout(bands),
      materials: { gold, polishedGold, frameGold, diamond, pave },
      paveTexture,
      geometries: {
        bandGeometries,
        barGeometries,
        chainGeometry,
        vCapGeometry,
        rhombusFrame,
        rhombusFace,
        rodGeometry,
        diamondGeometry,
        bailGeometry,
      },
    };
  }, []);

  useEffect(() => {
    return () => {
      const { geometries, materials, paveTexture } = assets;
      [...geometries.bandGeometries, ...geometries.barGeometries].forEach((g) => g.dispose());
      [
        geometries.chainGeometry,
        geometries.vCapGeometry,
        geometries.rhombusFrame,
        geometries.rhombusFace,
        geometries.rodGeometry,
        geometries.diamondGeometry,
        geometries.bailGeometry,
      ].forEach((g) => g.dispose());
      Object.values(materials).forEach((m) => m.dispose());
      paveTexture.dispose();
    };
  }, [assets]);

  const { layout, materials, geometries } = assets;

  return (
    <group>
      {geometries.bandGeometries.map((g, i) => (
        <mesh key={`band-${i}`} geometry={g} material={materials.gold} castShadow />
      ))}
      {geometries.barGeometries.map((g, i) => (
        <mesh key={`bar-${i}`} geometry={g} material={materials.polishedGold} castShadow />
      ))}
      <mesh geometry={geometries.vCapGeometry} material={materials.gold} position={V_POINT} />
      <mesh geometry={geometries.chainGeometry} material={materials.gold} />

      <InstancedGroup geometry={geometries.rodGeometry} material={materials.gold} matrices={layout.rods} />
      <InstancedGroup geometry={geometries.bailGeometry} material={materials.gold} matrices={layout.bails} />
      <InstancedGroup geometry={geometries.rhombusFrame} material={materials.frameGold} matrices={layout.rhombuses} />
      <InstancedGroup geometry={geometries.rhombusFace} material={materials.pave} matrices={layout.rhombuses} />
      <InstancedGroup geometry={geometries.diamondGeometry} material={materials.diamond} matrices={layout.diamonds} />
    </group>
  );
}
