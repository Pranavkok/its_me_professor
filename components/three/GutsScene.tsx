"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  useGLTF,
  Environment,
  Lightformer,
  ContactShadows,
  AdaptiveDpr,
} from "@react-three/drei";
import * as THREE from "three";
import { gutsState } from "@/lib/gutsState";

/* ============================================================================
 *  GUTS SCENE — 4-Act Scroll-Driven Cinematic Camera
 *
 *  The Berserk Guts model is displayed in a full-screen fixed canvas.
 *  The camera travels through 4 distinct cinematographic acts driven by
 *  the About section scroll progress (gutsState.p).
 *
 *  ACT I   (p 0.00→0.25): LOW ANGLE on sword — blade fills frame.
 *  ACT II  (p 0.25→0.50): RISES to wound/scar area — face, upper body.
 *  ACT III (p 0.50→0.75): PULLS BACK to full silhouette — lone swordsman.
 *  ACT IV  (p 0.75→1.00): TIGHT PUSH IN to face — telephoto, fills frame.
 *
 *  Lighting: chiaroscuro — ember fire from below-left, cold moonlight rim
 *  from above-right, minimal ambient. Maximises drama on cartoon mesh.
 * ============================================================================ */

const GUTS_MODEL = "/models/berserk_guts_black_swordsman.glb";

const easeInOut  = (t: number) => t * t * (3 - 2 * t);
const easeOut    = (t: number) => 1 - Math.pow(1 - t, 3);
const easeIn     = (t: number) => t * t * t;
const clamp01    = (t: number) => Math.min(1, Math.max(0, t));
const remap      = (v: number, lo: number, hi: number) =>
  clamp01((v - lo) / (hi - lo));

/* ── Detect which "zone" of the model to focus on ───────────────────────── */
interface ModelZones {
  swordY:  number;   // lowest cluster (blade / sword tip)
  woundY:  number;   // mid-upper body (scar / wound area)
  bodyY:   number;   // geometric center of full figure
  faceY:   number;   // top cluster (face / head)
  halfH:   number;   // half height of normalised model
}

function detectZones(scene: THREE.Object3D, scaledHalfH: number): ModelZones {
  const SLICES = 48;
  const weights = new Float32Array(SLICES);

  scene.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const b   = new THREE.Box3().setFromObject(mesh);
    const sz  = b.getSize(new THREE.Vector3());
    const vol = sz.x * sz.y * sz.z;
    let w = 0;
    if      (vol < 0.06) w = 6;
    else if (vol < 0.25) w = 3;
    else if (vol < 0.9)  w = 1;
    if (w > 0) {
      const cy    = b.getCenter(new THREE.Vector3()).y;
      const slice = Math.floor(((cy + scaledHalfH) / (scaledHalfH * 2)) * SLICES);
      if (slice >= 0 && slice < SLICES) weights[slice] += w;
    }
  });

  /* Find top N weighted slices for face/wound/body/sword */
  const sliceH = (scaledHalfH * 2) / SLICES;
  const sliceY = (i: number) => -scaledHalfH + i * sliceH + sliceH * 0.5;

  let peak = 0, peakSlice = Math.floor(SLICES * 0.6);
  for (let i = 0; i < SLICES; i++) {
    if (weights[i] > peak) { peak = weights[i]; peakSlice = i; }
  }

  const bodyY  = sliceY(peakSlice);
  const faceY  = bodyY + scaledHalfH * 0.38;   // head is ~38% halfH above body center
  const woundY = bodyY + scaledHalfH * 0.15;   // wounds/scar upper chest
  const swordY = bodyY - scaledHalfH * 0.55;   // sword tip / blade is below body center

  return { swordY, woundY, bodyY, faceY, halfH: scaledHalfH };
}

/* ── The Guts character component ─────────────────────────────────────────── */
function GutsCharacter() {
  const { scene } = useGLTF(GUTS_MODEL);
  const { size }  = useThree();
  const pivotGrp  = useRef<THREE.Group>(null);
  const normalised = useRef(false);
  const zones      = useRef<ModelZones>({ swordY: -1.5, woundY: 0.3, bodyY: 0, faceY: 0.8, halfH: 2 });

  /* ── Smooth camera state refs ──────────────────────────────────────────── */
  const camPos    = useRef(new THREE.Vector3(0, -1.5, 4));
  const camLookAt = useRef(new THREE.Vector3(0, -1.5, 0));
  const camFovRef = useRef(38);
  const modelRotY = useRef(0);

  /* ── Normalise + auto-scale model ─────────────────────────────────────── */
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

      const scaledHalfH = (dims.y * s) / 2;
      zones.current = detectZones(scene, scaledHalfH);

      gutsState.charY = zones.current.bodyY;
      gutsState.faceY = zones.current.faceY;

      console.log("[GutsScene] zones:", zones.current);
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

  const isMobile = size.width < 768;

  useFrame((state, delta) => {
    const g = pivotGrp.current;
    if (!g) return;

    const p = gutsState.p;
    const t = state.clock.elapsedTime;
    const k = delta;
    const z = zones.current;

    /* ================================================================
     *  4-ACT CAMERA SYSTEM
     *
     *  Each act = 0.25 of the scroll range.
     *  localP for each act = (p - actStart) / 0.25 → [0, 1]
     *
     *  We interpolate between act targets using smooth easing.
     * ================================================================ */

    // Act progress values (each 0→1 within its own window)
    const act1 = clamp01(remap(p, 0.00, 0.25));
    const act2 = clamp01(remap(p, 0.25, 0.50));
    const act3 = clamp01(remap(p, 0.50, 0.75));
    const act4 = clamp01(remap(p, 0.75, 1.00));

    /* ----------------------------------------------------------
     *  ACT I — The Blade
     *  Camera: low angle, very close to sword level.
     *  Looks upward from sword height — epic low shot.
     *  Slow orbital drift to reveal the sword from different angles.
     * ---------------------------------------------------------- */
    const a1Ease  = easeOut(act1);
    const a1PosX  = Math.sin(act1 * Math.PI * 0.8) * (isMobile ? 0.6 : 1.0); // slow orbit
    const a1PosY  = THREE.MathUtils.lerp(-2.0, z.swordY + 0.2, a1Ease);
    const a1PosZ  = THREE.MathUtils.lerp(5.5,  2.2, a1Ease);
    const a1LookY = THREE.MathUtils.lerp(z.swordY - 0.3, z.swordY + 0.1, a1Ease);
    const a1Fov   = THREE.MathUtils.lerp(55, 28, a1Ease);

    /* ----------------------------------------------------------
     *  ACT II — The Wound
     *  Camera: rises from sword level to the scar/wound area.
     *  Slow orbit continues, camera slightly off-axis (3/4 view).
     * ---------------------------------------------------------- */
    const a2Ease  = easeInOut(act2);
    const a2Orbit = Math.sin(act2 * Math.PI * 0.6 + 0.5) * (isMobile ? 0.5 : 0.9);
    const a2PosX  = a2Orbit;
    const a2PosY  = THREE.MathUtils.lerp(z.swordY + 0.2, z.woundY + 0.1, a2Ease);
    const a2PosZ  = THREE.MathUtils.lerp(2.2, 1.9, a2Ease);
    const a2LookY = THREE.MathUtils.lerp(z.swordY + 0.1, z.woundY, a2Ease);
    const a2Fov   = THREE.MathUtils.lerp(28, 24, a2Ease);

    /* ----------------------------------------------------------
     *  ACT III — The Silhouette
     *  Camera: pulls back dramatically to reveal full figure.
     *  Model rotates slowly — lone warrior standing his ground.
     * ---------------------------------------------------------- */
    const a3Ease  = easeOut(act3);
    const a3PosX  = THREE.MathUtils.lerp(a2Orbit, 0, a3Ease);
    const a3PosY  = THREE.MathUtils.lerp(z.woundY + 0.1, z.bodyY + 0.4, a3Ease);
    const a3PosZ  = THREE.MathUtils.lerp(1.9, 7.5, a3Ease);
    const a3LookY = THREE.MathUtils.lerp(z.woundY, z.bodyY, a3Ease);
    const a3Fov   = THREE.MathUtils.lerp(24, 42, a3Ease);

    /* ----------------------------------------------------------
     *  ACT IV — The Face
     *  Camera: hard push into the face. Telephoto compression.
     *  Letterbox bars in (handled by CSS). Breath micro-anim.
     * ---------------------------------------------------------- */
    const a4Ease  = easeIn(act4);
    const a4PosY  = THREE.MathUtils.lerp(z.bodyY + 0.4, z.faceY + 0.05, a4Ease);
    const a4PosZ  = THREE.MathUtils.lerp(7.5, 1.6, easeOut(act4));
    const a4LookY = THREE.MathUtils.lerp(z.bodyY, z.faceY, easeOut(act4));
    const a4Fov   = THREE.MathUtils.lerp(42, 18, easeInOut(act4));

    /* ── Blend between acts ────────────────────────────────────── */
    // We blend sequentially: A1 → A2 → A3 → A4
    // act2 blends out A1 into A2, etc.
    const blendX = p < 0.25
      ? a1PosX
      : p < 0.50
      ? THREE.MathUtils.lerp(a1PosX, a2PosX, easeInOut(act2))
      : p < 0.75
      ? THREE.MathUtils.lerp(a2PosX, a3PosX, easeInOut(act3))
      : THREE.MathUtils.lerp(a3PosX, 0,       easeInOut(act4));

    const blendY = p < 0.25
      ? a1PosY
      : p < 0.50
      ? THREE.MathUtils.lerp(a1PosY, a2PosY, easeInOut(act2))
      : p < 0.75
      ? THREE.MathUtils.lerp(a2PosY, a3PosY, easeInOut(act3))
      : THREE.MathUtils.lerp(a3PosY, a4PosY, easeInOut(act4));

    const blendZ = p < 0.25
      ? a1PosZ
      : p < 0.50
      ? THREE.MathUtils.lerp(a1PosZ, a2PosZ, easeInOut(act2))
      : p < 0.75
      ? THREE.MathUtils.lerp(a2PosZ, a3PosZ, easeInOut(act3))
      : THREE.MathUtils.lerp(a3PosZ, a4PosZ, easeInOut(act4));

    const blendLookY = p < 0.25
      ? a1LookY
      : p < 0.50
      ? THREE.MathUtils.lerp(a1LookY, a2LookY, easeInOut(act2))
      : p < 0.75
      ? THREE.MathUtils.lerp(a2LookY, a3LookY, easeInOut(act3))
      : THREE.MathUtils.lerp(a3LookY, a4LookY, easeInOut(act4));

    const blendFov = p < 0.25
      ? a1Fov
      : p < 0.50
      ? THREE.MathUtils.lerp(a1Fov, a2Fov, easeInOut(act2))
      : p < 0.75
      ? THREE.MathUtils.lerp(a2Fov, a3Fov, easeInOut(act3))
      : THREE.MathUtils.lerp(a3Fov, a4Fov, easeInOut(act4));

    /* ── Micro-breath (stronger in Acts II & IV close-ups) ────── */
    const breathStrength = p < 0.25 ? 0.006
      : p < 0.50 ? THREE.MathUtils.lerp(0.006, 0.012, easeInOut(act2))
      : p < 0.75 ? THREE.MathUtils.lerp(0.012, 0.005, easeInOut(act3))
      : THREE.MathUtils.lerp(0.005, 0.016, easeOut(act4));
    const bx = Math.sin(t * 1.15) * breathStrength;
    const by = Math.cos(t * 0.75) * breathStrength * 0.5;

    /* ── Apply to camera via smooth exponential lerp ──────────── */
    const targetPos    = new THREE.Vector3(blendX + bx, blendY + by, blendZ);
    const targetLookAt = new THREE.Vector3(0, blendLookY, 0);

    camPos.current.lerp(targetPos,       1 - Math.pow(0.010, k));
    camLookAt.current.lerp(targetLookAt, 1 - Math.pow(0.012, k));
    camFovRef.current = THREE.MathUtils.lerp(
      camFovRef.current, blendFov, 1 - Math.pow(0.022, k)
    );

    state.camera.position.copy(camPos.current);
    state.camera.lookAt(camLookAt.current);

    const cam = state.camera as THREE.PerspectiveCamera;
    cam.fov = camFovRef.current;
    cam.updateProjectionMatrix();

    /* ── Model rotation: slow idle in Act III, snap to front otherwise ── */
    if (p >= 0.50 && p < 0.75) {
      // Act III — slow contemplative rotation
      const spinSpeed = THREE.MathUtils.lerp(0.08, 0.03, act3);
      modelRotY.current += delta * spinSpeed;
    } else if (p < 0.50) {
      // Acts I & II — slightly off-axis but mostly front-on
      const targetRot = p < 0.25
        ? Math.sin(act1 * Math.PI * 0.4) * 0.35
        : Math.sin(act2 * Math.PI * 0.4 + 0.4) * 0.25;
      modelRotY.current = THREE.MathUtils.lerp(
        modelRotY.current, targetRot, 1 - Math.pow(0.008, k)
      );
    } else {
      // Act IV — snap fully front-on for the face close-up
      modelRotY.current = THREE.MathUtils.lerp(
        modelRotY.current, 0, 1 - Math.pow(0.003, k)
      );
    }
    g.rotation.y = modelRotY.current;

    /* ── Canvas opacity (fade in/out of section) ──────────────── */
    const raw        = gutsState.raw;
    const canvasIn   = clamp01((raw + 0.10) / 0.13);
    const canvasOut  = clamp01((raw - 0.97) / 0.13);
    const visibility = canvasIn * (1 - canvasOut);

    for (const m of materials) m.opacity = visibility;
    g.visible = visibility > 0.01;

    /* ── Gentle float ─────────────────────────────────────────── */
    // Only in Act III (full silhouette) — tiny hover adds life
    const floatAmt = p >= 0.50 && p < 0.75
      ? THREE.MathUtils.lerp(0, 0.04, easeInOut(act3)) * (1 - easeInOut(act4))
      : 0;
    g.position.y = Math.sin(t * 0.45) * floatAmt;
  });

  return (
    <group>
      <group ref={pivotGrp}>
        <primitive object={scene} />
      </group>
      <ContactShadows
        position={[0, zones.current.swordY - 0.5, 0]}
        opacity={0.6}
        scale={12}
        blur={3.5}
        far={8}
        color="#000000"
      />
    </group>
  );
}

/* ── Canvas wrapper ──────────────────────────────────────────────────────── */
export default function GutsScene() {
  return (
    <Canvas
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
      camera={{ position: [0, -2.0, 5.5], fov: 55 }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1,
        pointerEvents: "none",
        opacity: "var(--about-canvas, 0)",
      }}
    >
      <AdaptiveDpr pixelated />

      {/* ── Chiaroscuro lighting ──────────────────────────────────
        *  Fire glow from below-left (warm ember — battle campfire)
        *  Cold moonlight rim from above-right (isolation, the night)
        *  Very low ambient — shadows are deep, silhouette pops
        * ─────────────────────────────────────────────────────── */}
      <ambientLight intensity={0.08} />

      {/* Ember fire: below-left — main key light */}
      <directionalLight position={[-3, -2, 4]}  intensity={2.8}  color="#d45f1e" castShadow />
      {/* Front fill — barely there, preserves mystery */}
      <directionalLight position={[0,  1,  5]}  intensity={0.6}  color="#ffe3b8" />
      {/* Moon rim: above-right-back — crisp silhouette edge */}
      <directionalLight position={[3,  6, -4]}  intensity={1.8}  color="#7ca8d4" />
      {/* Ground bounce: subtle warm from below */}
      <directionalLight position={[0, -4,  2]}  intensity={0.4}  color="#8b3a10" />

      <Suspense fallback={null}>
        <GutsCharacter />
        <Environment resolution={256}>
          {/* Ember forge glow */}
          <Lightformer intensity={4.0} position={[-4, -2, 3]}  scale={[6, 4, 1]}  color="#c0480f" />
          {/* Cold sky */}
          <Lightformer intensity={1.2} position={[4,  5, -3]}  scale={[5, 5, 1]}  color="#5580b8" />
          {/* Very faint front presence */}
          <Lightformer intensity={0.5} position={[0,  0,  6]}  scale={[8, 8, 1]}  color="#fff0e0" />
        </Environment>
      </Suspense>
    </Canvas>
  );
}

useGLTF.preload(GUTS_MODEL);
