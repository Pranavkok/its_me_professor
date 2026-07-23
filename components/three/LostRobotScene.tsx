"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, AdaptiveDpr } from "@react-three/drei";
import * as THREE from "three";

/* ============================================================================
 *  LOST ROBOT SCENE — scroll-driven cinematic camera
 *
 *  The Projects section is 300vh. As the user scrolls, camera travels
 *  through 5 keyframes — from far outside, sweeping inward to the robot's
 *  face, then tilting back up to the canopy.
 *
 *  Surprise events fire randomly every 4-9 seconds:
 *    • LURCH_IN   — snap toward the robot, slowly drift back
 *    • LOOK_AWAY  — sudden glance to the side, snap back
 *    • TILT_DOWN  — camera tilts nose-down, eerie descent feeling
 *    • SHAKE      — micro hand-shake burst (3-4 frames)
 * ============================================================================ */

const ROBOT_MODEL = "/models/lost_robot.glb";

/* ── Shared scroll progress (module-level, avoids React re-renders) ─────── */
let _scrollProgress = 0;

/* ── Camera keyframes — [pos, lookAt] ──────────────────────────────────── */
const KEYFRAMES: Array<{ pos: [number,number,number]; look: [number,number,number] }> = [
  /* 0.00  – Far approach: user enters section                         */
  { pos: [4.5,  1.8,  4.5 ], look: [0,  -0.2, 0  ] },
  /* 0.25  – Arc sweep, dropping low: world opens up around you       */
  { pos: [2.2, -0.6,  2.2 ], look: [0.1,-0.35, 0.1] },
  /* 0.50  – CLOSE: almost nose-to-nose with the robot                */
  { pos: [0.5, -0.2,  0.7 ], look: [0,  -0.05, 0  ] },
  /* 0.75  – Crane up: see the tree canopy from inside                */
  { pos: [-1.2, 1.4, -1.2 ], look: [0,   0.2,  0  ] },
  /* 1.00  – Wide pullback: the whole world in frame                  */
  { pos: [-3.0, 0.6, -3.0 ], look: [0,  -0.2,  0  ] },
];

/* Catmull-Rom style lerp across keyframes based on t ∈ [0, 1] */
function samplePath(t: number) {
  const n   = KEYFRAMES.length - 1;
  const idx = Math.min(Math.floor(t * n), n - 1);
  const f   = t * n - idx;
  const a   = KEYFRAMES[idx];
  const b   = KEYFRAMES[idx + 1];
  const lerp = (a: number, b: number) => a + (b - a) * smoothstep(f);
  return {
    pos:  [lerp(a.pos[0], b.pos[0]), lerp(a.pos[1], b.pos[1]), lerp(a.pos[2], b.pos[2])] as [number,number,number],
    look: [lerp(a.look[0], b.look[0]), lerp(a.look[1], b.look[1]), lerp(a.look[2], b.look[2])] as [number,number,number],
  };
}

function smoothstep(x: number) {
  x = Math.max(0, Math.min(1, x));
  return x * x * (3 - 2 * x);
}

/* ── Surprise event types ────────────────────────────────────────────── */
type SurpriseKind = "LURCH_IN" | "LOOK_AWAY" | "TILT_DOWN" | "SHAKE";

interface Surprise {
  kind:      SurpriseKind;
  startTime: number;
  duration:  number;
  dir:       THREE.Vector3; // used for look-away direction
}

function randomSurprise(now: number): Surprise {
  const kinds: SurpriseKind[] = ["LURCH_IN", "LOOK_AWAY", "TILT_DOWN", "SHAKE"];
  const kind = kinds[Math.floor(Math.random() * kinds.length)];
  const dir  = new THREE.Vector3(
    (Math.random() - 0.5) * 2,
    (Math.random() - 0.5) * 0.8,
    (Math.random() - 0.5) * 2,
  ).normalize();
  return { kind, startTime: now, duration: kind === "SHAKE" ? 0.4 : 1.6, dir };
}

/* ── Main world component ─────────────────────────────────────────────── */
function RobotWorld() {
  const { scene }  = useGLTF(ROBOT_MODEL);
  const { camera } = useThree();

  const normalised   = useRef(false);
  const elapsed      = useRef(0);
  const nextSurprise = useRef(5 + Math.random() * 5); // first surprise 5-10s in
  const surprise     = useRef<Surprise | null>(null);

  /* Smooth camera targets — we lerp toward these each frame */
  const targetPos  = useRef(new THREE.Vector3(...KEYFRAMES[0].pos));
  const targetLook = useRef(new THREE.Vector3(...KEYFRAMES[0].look));

  /* ── One-time normalise ──────────────────────────────────────────── */
  useMemo(() => {
    if (normalised.current) return;

    scene.scale.set(1, 1, 1);
    scene.position.set(0, 0, 0);

    const bbox   = new THREE.Box3().setFromObject(scene);
    const dims   = bbox.getSize(new THREE.Vector3());
    const centre = bbox.getCenter(new THREE.Vector3());
    const maxDim = Math.max(dims.x, dims.y, dims.z) || 1;

    const s = 16 / maxDim;
    scene.scale.setScalar(s);
    scene.position.set(-centre.x * s, -centre.y * s, -centre.z * s);

    scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow    = true;
        mesh.receiveShadow = true;
      }
    });

    normalised.current = true;
  }, [scene]);

  /* ── Frame loop ──────────────────────────────────────────────────── */
  useFrame((_, delta) => {
    elapsed.current += delta;
    const t = elapsed.current;

    /* -- 1. Scroll-driven base position -------------------------------- */
    const sp   = Math.max(0, Math.min(1, _scrollProgress));
    const path = samplePath(sp);
    targetPos.current.set(...path.pos);
    targetLook.current.set(...path.look);

    /* -- 2. Surprise events -------------------------------------------- */
    if (t > nextSurprise.current && !surprise.current) {
      surprise.current  = randomSurprise(t);
      nextSurprise.current = t + 4 + Math.random() * 6;
    }

    let surprisePos  = new THREE.Vector3();
    let surpriseLook = new THREE.Vector3();

    if (surprise.current) {
      const s   = surprise.current;
      const age = t - s.startTime;
      const pct = Math.min(age / s.duration, 1);

      // Each surprise pulses in and eases back out
      const pulse = pct < 0.3
        ? smoothstep(pct / 0.3)             // fast in
        : 1 - smoothstep((pct - 0.3) / 0.7); // slow fade out

      switch (s.kind) {
        case "LURCH_IN":
          /* Snap ~40% closer to robot's eye position */
          surprisePos.copy(targetPos.current).multiplyScalar(-0.4 * pulse);
          break;

        case "LOOK_AWAY":
          /* Glance hard left/right, then snap back */
          surpriseLook.copy(s.dir).multiplyScalar(2.5 * pulse);
          break;

        case "TILT_DOWN":
          /* Camera pitches nose-down — robot looms suddenly */
          surpriseLook.set(0, -1.5 * pulse, 0);
          surprisePos.set(0, -0.6 * pulse, 0);
          break;

        case "SHAKE":
          /* High-freq micro shake */
          const freq  = 38;
          const amp   = 0.04 * pulse;
          surprisePos.set(
            Math.sin(t * freq * 1.1) * amp,
            Math.sin(t * freq * 0.9) * amp * 0.5,
            Math.sin(t * freq * 1.3) * amp,
          );
          break;
      }

      if (pct >= 1) surprise.current = null;
    }

    /* -- 3. Gentle idle breath (always on) ----------------------------- */
    const breathAmp  = 0.025;
    const breathSpeed = 0.18;
    const breathY = Math.sin(t * breathSpeed * Math.PI * 2) * breathAmp;

    /* -- 4. Apply to camera -------------------------------------------- */
    const lerpSpeed = surprise.current?.kind === "SHAKE" ? 1.0 : 1.8;
    const finalPos  = targetPos.current.clone().add(surprisePos);
    finalPos.y += breathY;

    camera.position.lerp(finalPos, delta * lerpSpeed);

    const finalLook = targetLook.current.clone().add(surpriseLook);
    const currentLook = new THREE.Vector3();
    camera.getWorldDirection(currentLook);
    const desiredLook = finalLook.clone().sub(camera.position).normalize();
    currentLook.lerp(desiredLook, delta * lerpSpeed);
    camera.lookAt(camera.position.clone().add(currentLook));
  });

  return <primitive object={scene} />;
}

/* ── Scroll listener component — lives inside Canvas ─────────────────── */
function ScrollTracker() {
  useEffect(() => {
    const section = document.getElementById("projects");
    if (!section) return;

    const onScroll = () => {
      const rect = section.getBoundingClientRect();
      /* progress 0 → 1 across the 300vh scroll travel */
      const travel = rect.height - window.innerHeight;
      _scrollProgress = Math.max(0, Math.min(1, -rect.top / travel));
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return null;
}

/* ── Canvas export ────────────────────────────────────────────────────── */
export default function LostRobotScene() {
  return (
    <Canvas
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
      camera={{ position: [4.5, 1.8, 4.5], fov: 82, near: 0.02, far: 300 }}
      shadows
      style={{ width: "100%", height: "100%" }}
    >
      <AdaptiveDpr pixelated />

      {/* Atmospheric fog — density balanced so you see far enough */}
      <fogExp2 attach="fog" args={["#060d05", 0.048]} />

      {/* Canopy sunbeam */}
      <ambientLight intensity={0.06} color="#0c1e0e" />
      <directionalLight
        position={[3, 8, 1]}
        intensity={3.4}
        color="#d4a832"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      {/* Deep forest fill */}
      <directionalLight position={[-5, 3, -2]} intensity={1.0} color="#3a6b58" />
      {/* Firefly / moss ground glow */}
      <pointLight position={[0, -1.5, 0]} intensity={1.1} color="#c87a20" distance={7} decay={2} />
      {/* Robot eye — cold blue */}
      <pointLight position={[0.3, -0.4, 0.5]} intensity={2.0} color="#4ab8e8" distance={4} decay={2} />

      <ScrollTracker />

      <Suspense fallback={null}>
        <RobotWorld />
      </Suspense>
    </Canvas>
  );
}

useGLTF.preload(ROBOT_MODEL);
