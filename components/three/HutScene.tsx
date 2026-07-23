"use client";

import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  useGLTF,
  Environment,
  Lightformer,
  AdaptiveDpr,
  ContactShadows,
} from "@react-three/drei";
import * as THREE from "three";

/* ============================================================================
 *  HUT SCENE — Baba Yaga's Hut
 *
 *  This is an INLINE canvas (not fixed full-screen like Hero/Guts).
 *  The hut sits centered in the Projects section as the visual centrepiece.
 *
 *  Camera: slow auto-orbit — the hut slowly reveals itself from all sides.
 *  Lighting: warm golden torchlight from below, cold forest moonlight from above,
 *            subtle ambient fill. Atmospheric fog for depth.
 *
 *  The hut IS the door to the arena. Standing before it, you enter or you don't.
 * ============================================================================ */

const HUT_MODEL = "/models/baba_yagas_hut.glb";

function HutModel() {
  const { scene }   = useGLTF(HUT_MODEL);
  const groupRef    = useRef<THREE.Group>(null);
  const normalised  = useRef(false);
  const angle       = useRef(0);

  /* ── Normalise & scale ──────────────────────────────────────────────────── */
  useMemo(() => {
    if (normalised.current) return;

    scene.scale.set(1, 1, 1);
    scene.position.set(0, 0, 0);

    const bbox   = new THREE.Box3().setFromObject(scene);
    const dims   = bbox.getSize(new THREE.Vector3());
    const centre = bbox.getCenter(new THREE.Vector3());
    const maxDim = Math.max(dims.x, dims.y, dims.z) || 1;
    const s      = 4.5 / maxDim;

    scene.scale.setScalar(s);
    scene.position.set(-centre.x * s, -centre.y * s + 0.1, -centre.z * s);

    scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow    = true;
        mesh.receiveShadow = true;
      }
    });

    normalised.current = true;
  }, [scene]);

  /* ── Slow orbit + gentle breath ─────────────────────────────────────────── */
  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Slow continuous rotation — 1 full revolution per ~60 seconds
    angle.current += delta * 0.018;
    groupRef.current.rotation.y = angle.current;

    // Gentle float — 4px amplitude, 3-second period
    const t = state.clock.elapsedTime;
    groupRef.current.position.y = Math.sin(t * 0.55) * 0.06;
  });

  return (
    <group ref={groupRef}>
      <primitive object={scene} />
    </group>
  );
}

export default function HutScene() {
  return (
    <Canvas
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
      camera={{ position: [0, 1.0, 7], fov: 42 }}
      shadows
      style={{ width: "100%", height: "100%" }}
    >
      <AdaptiveDpr pixelated />

      {/* Atmospheric fog */}
      <fogExp2 attach="fog" args={["#0e1a0f", 0.045]} />

      {/* ── Lighting — warm golden torchlight + cold forest moon ──────────
       *  Key: warm gold from below-front (torch in the hut window)
       *  Fill: cool forest moonlight from above-left (forest canopy)
       *  Rim: subtle amber from behind (fireflies / embers)
       *  Ambient: barely there — let the scene breathe in shadow
       * ─────────────────────────────────────────────────────────────── */}
      <ambientLight intensity={0.12} color="#1a2e18" />

      {/* Main torch key — warm gold, below-front */}
      <directionalLight
        position={[1, -1, 5]}
        intensity={3.5}
        color="#e8a83a"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      {/* Forest moon — cold blue-green, above-left */}
      <directionalLight
        position={[-4, 6, -2]}
        intensity={1.8}
        color="#7ab8a0"
      />
      {/* Ember rim — warm amber, behind */}
      <directionalLight
        position={[0, 2, -5]}
        intensity={1.2}
        color="#c8911a"
      />
      {/* Ground warm bounce */}
      <directionalLight
        position={[0, -4, 2]}
        intensity={0.5}
        color="#6b4a15"
      />

      <Suspense fallback={null}>
        <HutModel />

        {/* Soft shadow on the ground */}
        <ContactShadows
          position={[0, -2.4, 0]}
          opacity={0.5}
          scale={12}
          blur={3}
          far={8}
          color="#050e05"
        />

        <Environment resolution={256}>
          {/* Warm interior light spilling from hut windows */}
          <Lightformer intensity={5} position={[0, 0, 3]}  scale={[3, 3, 1]} color="#e8901a" />
          {/* Forest canopy — cool green-blue */}
          <Lightformer intensity={2} position={[-5, 5, -3]} scale={[6, 6, 1]} color="#4a8a6a" />
          {/* Ground ember glow */}
          <Lightformer intensity={1} position={[0, -3, 0]}  scale={[8, 2, 1]} color="#8b5e1a" />
        </Environment>
      </Suspense>
    </Canvas>
  );
}

useGLTF.preload(HUT_MODEL);
