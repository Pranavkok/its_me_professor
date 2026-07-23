"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  useGLTF,
  useAnimations,
  Environment,
  Lightformer,
  ContactShadows,
  AdaptiveDpr,
} from "@react-three/drei";
import * as THREE from "three";
import { heroState } from "@/lib/heroState";

/* ============================================================================
 *  SIMPLE. DIRECT. FRONT-ON ZOOM.
 *
 *  Camera starts far back (z=42, y=7, wide FOV=62°) — full model visible.
 *  As user scrolls it zooms STRAIGHT IN from the front, descending to the
 *  red character's eye level, until the character's face fills the frame.
 *
 *  No side angles. No sweeping arcs. Just a clean, powerful front-on push.
 *  FOV narrows from 62° → 18° (telephoto compression — face becomes everything).
 * ============================================================================ */

const HERO_MODEL = "/models/cyber_warrior.glb";

const easeInOut = (t: number) => t * t * (3 - 2 * t);
const easeOut   = (t: number) => 1 - Math.pow(1 - t, 3);
const clamp01   = (t: number) => Math.min(1, Math.max(0, t));

function CyberWarrior() {
  const { scene, animations } = useGLTF(HERO_MODEL);
  const { size }  = useThree();
  const pivotGrp  = useRef<THREE.Group>(null);  // rotation + position control
  const modelGrp  = useRef<THREE.Group>(null);  // animation target
  const normalised = useRef(false);

  /* Character face focus */
  const charFocusY = useRef(-0.45);
  const faceFocusY = useRef(-0.22);

  /* Smooth camera state */
  const camPos    = useRef(new THREE.Vector3(0, 7, 42));
  const camLookAt = useRef(new THREE.Vector3(0, 0, 0));
  const camFovRef = useRef(62);
  const modelRotY = useRef(0);

  /* Play GLB animations if the model has any */
  const { actions } = useAnimations(animations, modelGrp);
  useEffect(() => {
    if (!actions) return;
    Object.values(actions).forEach((action) => {
      action?.reset().fadeIn(0.6).play();
    });
    return () => { Object.values(actions).forEach((a) => a?.stop()); };
  }, [actions]);

  const materials = useMemo(() => {
    if (!normalised.current) {
      scene.scale.set(1, 1, 1);
      scene.position.set(0, 0, 0);

      const bbox   = new THREE.Box3().setFromObject(scene);
      const dims   = bbox.getSize(new THREE.Vector3());
      const centre = bbox.getCenter(new THREE.Vector3());
      const maxDim = Math.max(dims.x, dims.y, dims.z) || 1;
      const s      = 5.5 / maxDim;

      scene.scale.setScalar(s);
      scene.position.set(-centre.x * s, -centre.y * s, -centre.z * s);

      const halfH = (dims.y * s) / 2;

      /* ── Smart detection: small-mesh density histogram ────────────
       *  Character (small detailed figure) has many small meshes.
       *  Stone/spire are few large meshes. Find where small ones cluster.
       * ─────────────────────────────────────────────────────────── */
      const SLICES  = 32;
      const weights = new Float32Array(SLICES);

      scene.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (!mesh.isMesh) return;
        const b   = new THREE.Box3().setFromObject(mesh);
        const sz  = b.getSize(new THREE.Vector3());
        const vol = sz.x * sz.y * sz.z;

        let w = 0;
        if      (vol < 0.06)  w = 5;   // tiny detail — armour plate, visor
        else if (vol < 0.25)  w = 3;   // small part — limb, torso piece
        else if (vol < 0.9)   w = 1;   // medium — could be character or small rock
        // large vol (stone): w = 0, skip

        if (w > 0) {
          const cy    = b.getCenter(new THREE.Vector3()).y;
          const slice = Math.floor(((cy + halfH) / (halfH * 2)) * SLICES);
          if (slice >= 0 && slice < SLICES) weights[slice] += w;
        }
      });

      let peak = 0, peakSlice = Math.floor(SLICES * 0.41); // fallback: 41%
      for (let i = 0; i < SLICES; i++) {
        if (weights[i] > peak) { peak = weights[i]; peakSlice = i; }
      }

      const sliceH           = (halfH * 2) / SLICES;
      charFocusY.current     = -halfH + peakSlice * sliceH + sliceH * 0.5;
      // Face sits ~0.50 world units above the detected body center.
      // This gives a bust/portrait frame: face + shoulders + upper chest.
      faceFocusY.current     = charFocusY.current + 0.50;

      heroState.charY = charFocusY.current;
      heroState.faceY = faceFocusY.current;

      console.log(
        '[Scene] charY:', charFocusY.current.toFixed(3),
        '| faceY:', faceFocusY.current.toFixed(3),
        '| peak weight:', peak
      );

      normalised.current = true;
    }

    const mats: THREE.Material[] = [];
    scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow    = true;
        mesh.receiveShadow = true;
        (Array.isArray(mesh.material) ? mesh.material : [mesh.material])
          .forEach((m) => { m.transparent = true; mats.push(m); });
      }
    });
    return mats;
  }, [scene]);

  const textShiftX = size.width >= 768 ? 1.1 : 0;

  useFrame((state, delta) => {
    const g = pivotGrp.current;
    if (!g) return;

    const p   = heroState.p;
    const t   = state.clock.elapsedTime;
    const k   = delta;
    const faceY = faceFocusY.current;
    const charY = charFocusY.current;

    /* ================================================================
     *  CAMERA — straight front-on zoom.
     *
     *  X: stays at 0 (dead center, no sweep)
     *  Z: 42 → 1.6  (easeOut — fast pull-in, slow final approach)
     *  Y: 7.0 → charY + 0.08 (crane descent to character eye level)
     *  FOV: 62 → 18 (telephoto — face becomes everything)
     * ================================================================ */

    // Z: pure front zoom — easeOut so it arrives dramatically
    // Final z=2.3 gives a bust/portrait framing: face + shoulders + chest
    const zoomEased = easeOut(p);
    const targetZ   = THREE.MathUtils.lerp(42, 2.3, zoomEased);

    // Y: crane descends to the character's FACE level (not body center)
    // Camera ends up at faceY — eye-level with the character's head
    const dropEased = easeOut(Math.min(1, p * 1.12));
    const targetY   = THREE.MathUtils.lerp(7.0, faceY + 0.05, dropEased);

    // X: stays centered — no drift, character face stays in the middle of the frame
    const targetX = 0;

    // FOV: 62° wide → 22° — wide enough to show face + shoulders + chest
    const targetFov = THREE.MathUtils.lerp(62, 22, easeInOut(p));

    /* ================================================================
     *  LOOK-AT — drifts from scene center to character face
     *
     *  Starts looking at bbox center (y=0), then drifts to faceY.
     *  Starts at the very beginning so the crane "finds" the character.
     * ================================================================ */
    const lookProgress = easeOut(p);
    const targetLookY  = THREE.MathUtils.lerp(0, faceY, lookProgress);

    /* ── Micro-breathe at close range (p > 0.80) ─────────────────── */
    const breatheAmt = THREE.MathUtils.lerp(0, 0.011, clamp01((p - 0.80) / 0.20));
    const bx = Math.sin(t * 1.2) * breatheAmt;
    const by = Math.cos(t * 0.8) * breatheAmt * 0.5;

    const targetPos    = new THREE.Vector3(targetX + bx, targetY + by, targetZ);
    const targetLookAt = new THREE.Vector3(0, targetLookY, 0);

    /* ── Smooth exponential lerp ──────────────────────────────────── */
    camPos.current.lerp(targetPos,    1 - Math.pow(0.013, k));
    camLookAt.current.lerp(targetLookAt, 1 - Math.pow(0.016, k));
    camFovRef.current = THREE.MathUtils.lerp(camFovRef.current, targetFov, 1 - Math.pow(0.025, k));

    state.camera.position.copy(camPos.current);
    state.camera.lookAt(camLookAt.current);

    const cam = state.camera as THREE.PerspectiveCamera;
    cam.fov = camFovRef.current;
    cam.updateProjectionMatrix();

    /* ================================================================
     *  MODEL — faces the camera the whole time.
     *  Slow idle rotation at the start (shows different angles of the
     *  stone composition), then gradually snaps to face-front (0°)
     *  so that when the camera arrives, the RED CHARACTER FACES IT.
     * ================================================================ */
    if (p < 0.25) {
      // Slow idle spin — model is a distant silhouette
      const speed = THREE.MathUtils.lerp(0.12, 0.02, p / 0.25);
      modelRotY.current += delta * speed;
    } else {
      // Exponential lock to 0° (face front) — completes by p ≈ 0.65
      modelRotY.current = THREE.MathUtils.lerp(
        modelRotY.current,
        0,
        1 - Math.pow(0.005, k)
      );
    }
    g.rotation.y = modelRotY.current;

    /* ── Model X shift for text at the very end ─────────────────── */
    const shiftX = THREE.MathUtils.lerp(
      0, textShiftX,
      easeInOut(clamp01((p - 0.88) / 0.12))
    );
    g.position.x = THREE.MathUtils.lerp(g.position.x, shiftX, 1 - Math.pow(0.04, k));

    /* ── Float + exit ────────────────────────────────────────────── */
    const leave      = THREE.MathUtils.smoothstep(heroState.raw, 0.95, 1.2);
    const visibility = 1 - leave;

    g.scale.setScalar(1 - leave * 0.3);
    g.position.y = Math.sin(t * 0.5) * 0.03 - leave * 2.2;

    for (const m of materials) m.opacity = visibility;
    g.visible = visibility > 0.01;
  });

  return (
    <group>
      {/* pivotGrp: handles rotation, position, scale, exit */}
      <group ref={pivotGrp}>
        {/* modelGrp: target for GLB animation mixer */}
        <group ref={modelGrp}>
          <primitive object={scene} />
        </group>
      </group>
      <ContactShadows
        position={[0, -2.8, 0]}
        opacity={0.5}
        scale={18}
        blur={4}
        far={9}
        color="#000000"
      />
    </group>
  );
}

export default function Scene() {
  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      camera={{ position: [0, 7, 42], fov: 62 }}
      className="!fixed !inset-0 z-0 !pointer-events-none"
    >
      <AdaptiveDpr pixelated />
      <ambientLight intensity={0.2} />
      {/* Strong front key light — lights the character face directly */}
      <directionalLight position={[0, 4, 8]}   intensity={2.2}  color="#ffe4cc" castShadow />
      {/* Ember fill from below-left */}
      <directionalLight position={[-4, -1, 3]} intensity={0.9}  color="#c85028" />
      {/* Cool rim from behind */}
      <directionalLight position={[2, 3, -5]}  intensity={0.6}  color="#4a74b8" />

      <Suspense fallback={null}>
        <CyberWarrior />
        <Environment resolution={512}>
          <Lightformer intensity={3.5} position={[0, 4, 6]}   scale={[8, 6, 1]}  color="#ffffff" />
          <Lightformer intensity={1.6} position={[-4, 0, 2]}  scale={[4, 5, 1]}  color="#e0603a" />
          <Lightformer intensity={0.7} position={[4, 2, -4]}  scale={[4, 4, 1]}  color="#5070b0" />
        </Environment>
      </Suspense>
    </Canvas>
  );
}

useGLTF.preload(HERO_MODEL);
