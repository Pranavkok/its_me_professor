"use client";

import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
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
 *  GUTS SCENE — Cinematic Scroll-Driven Camera
 *
 *  PART I   (p 0.00→0.25)
 *    Character faces AWAY (back to camera, modelRotY = π).
 *    Camera starts at the very BASE — ground/feet level — looking up.
 *    Slow crane rise along his back: feet → hips → mid-back.
 *
 *  PART II  (p 0.25→0.50)
 *    Camera continues rising: mid-back → shoulder blades → back of head.
 *    Still facing away. Silent. The nape of his neck. The sword hilt.
 *
 *  PART III (p 0.50→0.75)
 *    THE ROTATION. Character turns from back (π) → side profile (π/2).
 *    Camera barely moves — the model does all the work.
 *    easeInOut rotation: hesitant start, decisive middle, settle into side.
 *    Ends: tight zoomed side portrait — eye, jaw, cloak, scarred silhouette.
 *
 *  PART IV  (p 0.75→1.00) — TWO PHASES:
 *    Phase A (act4 0→0.60): Camera PULLS BACK as model turns front (π/2→0).
 *             The full lone swordsman is revealed for the first time.
 *    Phase B (act4 0.55→1.0): Hard reverse — camera PUSHES IN to the EYES.
 *             FOV compresses to 10°. Only the eyes. Section closes here.
 * ============================================================================ */

const GUTS_MODEL = "/models/berserk_guts_black_swordsman.glb";

const easeInOut = (t: number) => t * t * (3 - 2 * t);
const easeOut   = (t: number) => 1 - Math.pow(1 - t, 3);
const clamp01   = (t: number) => Math.min(1, Math.max(0, t));
const remap     = (v: number, lo: number, hi: number) =>
  clamp01((v - lo) / (hi - lo));

/* ── Anatomical zone detection ───────────────────────────────────────────── */
interface ModelZones {
  bottomY: number; // very bottom of the model (base / feet level)
  swordY:  number; // sword / lower body area
  hipY:    number; // hip level
  bodyY:   number; // torso centre (auto-detected peak mesh density)
  shoulderY: number; // shoulder / upper back
  faceY:   number; // face / head centre
  eyeY:    number; // eyes — the final frame
  halfH:   number; // half-height of normalised model
}

function detectZones(scene: THREE.Object3D, scaledHalfH: number): ModelZones {
  const SLICES  = 64;
  const weights = new Float32Array(SLICES);
  const sliceH  = (scaledHalfH * 2) / SLICES;
  const sliceY  = (i: number) => -scaledHalfH + i * sliceH + sliceH * 0.5;

  scene.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const b   = new THREE.Box3().setFromObject(mesh);
    const sz  = b.getSize(new THREE.Vector3());
    const vol = sz.x * sz.y * sz.z;
    // Higher weight for tiny, detailed meshes (face, hands, armour plates)
    let w = 0;
    if      (vol < 0.03) w = 8;
    else if (vol < 0.10) w = 5;
    else if (vol < 0.30) w = 2;
    else if (vol < 1.0)  w = 1;
    if (w > 0) {
      const cy    = b.getCenter(new THREE.Vector3()).y;
      const slice = Math.floor(((cy + scaledHalfH) / (scaledHalfH * 2)) * SLICES);
      if (slice >= 0 && slice < SLICES) weights[slice] += w;
    }
  });

  let peak = 0, peakSlice = Math.floor(SLICES * 0.45);
  for (let i = 0; i < SLICES; i++) {
    if (weights[i] > peak) { peak = weights[i]; peakSlice = i; }
  }

  const bodyY = sliceY(peakSlice);
  const H     = scaledHalfH;

  const zones: ModelZones = {
    bottomY:   -H,               // very base of model
    swordY:    bodyY - H * 0.62, // sword/feet area
    hipY:      bodyY - H * 0.30, // hip level
    bodyY,                       // torso auto-detected
    shoulderY: bodyY + H * 0.28, // shoulder blades (back view)
    faceY:     bodyY + H * 0.50, // face centre — raised for cartoon big head
    eyeY:      bodyY + H * 0.62, // eyes — cartoon characters have eyes high on their large heads
    halfH:     H,
  };

  console.log("[GutsScene] zones:", {
    bottomY: zones.bottomY.toFixed(2),
    bodyY:   zones.bodyY.toFixed(2),
    faceY:   zones.faceY.toFixed(2),
    eyeY:    zones.eyeY.toFixed(2),
    halfH:   H.toFixed(2),
  });

  return zones;
}

/* ── Main character component ────────────────────────────────────────────── */
function GutsCharacter() {
  const { scene }   = useGLTF(GUTS_MODEL);
  const pivotGrp    = useRef<THREE.Group>(null);
  const normalised  = useRef(false);
  const zones       = useRef<ModelZones>({
    bottomY: -2.75, swordY: -1.95, hipY: -0.85, bodyY: 0,
    shoulderY: 0.77, faceY: 1.16, eyeY: 1.29, halfH: 2.75,
  });

  // Camera state — smooth exponential lerp targets
  const camPos    = useRef(new THREE.Vector3(0, -3.0, 4.0));
  const camLookAt = useRef(new THREE.Vector3(0, -2.4, 0));
  const camFovRef = useRef(50);
  const modelRotY = useRef(Math.PI); // Start facing AWAY

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
      zones.current      = detectZones(scene, (dims.y * s) / 2);
      gutsState.charY    = zones.current.bodyY;
      gutsState.faceY    = zones.current.faceY;
      normalised.current = true;
    }
    const mats: THREE.Material[] = [];
    scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = true; mesh.receiveShadow = true;
        (Array.isArray(mesh.material) ? mesh.material : [mesh.material])
          .forEach((m) => { m.transparent = true; mats.push(m); });
      }
    });
    return mats;
  }, [scene]);

  useFrame((state, delta) => {
    const g = pivotGrp.current;
    if (!g) return;
    const p = gutsState.p;
    const t = state.clock.elapsedTime;
    const k = delta;
    const z = zones.current;

    const act1 = clamp01(remap(p, 0.00, 0.25));
    const act2 = clamp01(remap(p, 0.25, 0.50));
    const act3 = clamp01(remap(p, 0.50, 0.75));
    const act4 = clamp01(remap(p, 0.75, 1.00));

    /* ══════════════════════════════════════════════════════════════════
     *  PART I — THE BASE
     *
     *  Camera is at the absolute bottom — at the character's feet level,
     *  looking UP at his back. Like kneeling at the base of a monument.
     *  Slow steady rise: feet → hips → mid-back.
     *  Character faces away. We see nothing but his back.
     * ══════════════════════════════════════════════════════════════════ */
    const t1    = easeOut(act1);
    const p1X   = 0;
    const p1Y   = THREE.MathUtils.lerp(z.bottomY - 0.2, z.hipY,       t1);
    const p1Z   = THREE.MathUtils.lerp(4.2,             3.6,           t1);
    const p1LkY = THREE.MathUtils.lerp(z.bottomY + 0.3, z.hipY + 0.1, t1);
    const p1Fov = THREE.MathUtils.lerp(52,              44,            easeInOut(act1));

    /* ══════════════════════════════════════════════════════════════════
     *  PART II — THE ASCENT
     *
     *  Camera continues its silent rise. From hips to shoulders to the
     *  back of his head. The sword hilt, the cloak, the nape of his neck.
     *  He stands still. Facing away. The camera discovers him from behind.
     * ══════════════════════════════════════════════════════════════════ */
    const t2    = easeOut(act2);
    const p2X   = 0;
    const p2Y   = THREE.MathUtils.lerp(z.hipY,       z.shoulderY + 0.1, t2);
    const p2Z   = THREE.MathUtils.lerp(3.6,          2.6,               t2);
    const p2LkY = THREE.MathUtils.lerp(z.hipY + 0.1, z.faceY - 0.15,   t2);
    const p2Fov = THREE.MathUtils.lerp(44,           33,                easeInOut(act2));

    /* ══════════════════════════════════════════════════════════════════
     *  PART III — THE ROTATION
     *
     *  The camera barely moves. The model does everything.
     *  Guts turns from AWAY (π) to SIDE PROFILE (π/2).
     *
     *  Camera drifts only slightly — a small lateral and depth adjustment
     *  to better frame the emerging profile. No wide sweeping camera arc
     *  here — the ROTATION of the character IS the shot.
     *
     *  easeInOut rotation = slow start (hesitation), fast middle (decisive),
     *  slow end (settling into the side view with weight).
     *
     *  End result: tight zoomed side portrait. One eye visible. One jaw.
     *  The cloak edge. Silence.
     * ══════════════════════════════════════════════════════════════════ */
    const t3    = easeInOut(act3);   // easeInOut for cinematic rotation feel
    const p3X   = THREE.MathUtils.lerp(0,    0.18, t3);  // subtle drift to frame profile
    const p3Y   = THREE.MathUtils.lerp(z.shoulderY + 0.1, z.faceY + 0.04, t3);
    const p3Z   = THREE.MathUtils.lerp(2.6,  2.15, t3);  // push slightly closer
    const p3LkY = THREE.MathUtils.lerp(z.faceY - 0.15,   z.faceY - 0.04, t3);
    const p3Fov = THREE.MathUtils.lerp(33,   23,   t3);  // zoom in — tight portrait

    /* ══════════════════════════════════════════════════════════════════
     *  PART IV — FULL BODY → EYES
     *
     *  Phase A (act4 0.00→0.60): PULL BACK.
     *    Camera retreats from tight side portrait to a wide full-body shot.
     *    Model continues rotating from side (π/2) to fully front-facing (0).
     *    For the first time — we see ALL of Guts.
     *    The lone swordsman. The full weight of him.
     *
     *  Phase B (act4 0.55→1.0): PUSH IN TO EYES.
     *    Hard reverse. Camera drives straight at his face.
     *    FOV narrows from 50° to 10° — extreme telephoto compression.
     *    The eyes fill the frame. Eyelids. Determination. The abyss.
     *    The section closes on this frame.
     * ══════════════════════════════════════════════════════════════════ */
    const act4a = clamp01(remap(act4, 0.00, 0.60));
    const act4b = clamp01(remap(act4, 0.55, 1.00));

    // Phase A — full body pull-back
    const t4a    = easeOut(act4a);
    const p4aX   = THREE.MathUtils.lerp(0.18,          0,              t4a);
    const p4aY   = THREE.MathUtils.lerp(z.faceY + 0.04, z.bodyY + 0.5, t4a);
    const p4aZ   = THREE.MathUtils.lerp(2.15,           9.5,            t4a);
    const p4aLkY = THREE.MathUtils.lerp(z.faceY - 0.04, z.bodyY + 0.1, t4a);
    const p4aFov = THREE.MathUtils.lerp(23,             50,             easeInOut(act4a));

    // Phase B — eye close-up
    // Camera Y and lookAt both target eyeY — but lookAt is slightly ABOVE
    // camera position so it reads as looking upward into the eyes, not at mouth
    const t4b    = easeOut(act4b);
    const p4bX   = 0;
    const p4bY   = THREE.MathUtils.lerp(z.bodyY + 0.5, z.eyeY - 0.08, t4b); // camera slightly below eye line
    const p4bZ   = THREE.MathUtils.lerp(9.5,           0.85,           t4b);
    const p4bLkY = THREE.MathUtils.lerp(z.bodyY + 0.1, z.eyeY + 0.04, t4b); // lookAt is AT / above eye line
    const p4bFov = THREE.MathUtils.lerp(50,            10,             easeInOut(act4b));

    // Blend A → B
    const bAB  = easeInOut(act4b);
    const p4X   = THREE.MathUtils.lerp(p4aX,   p4bX,   bAB);
    const p4Y   = THREE.MathUtils.lerp(p4aY,   p4bY,   bAB);
    const p4Z   = THREE.MathUtils.lerp(p4aZ,   p4bZ,   bAB);
    const p4LkY = THREE.MathUtils.lerp(p4aLkY, p4bLkY, bAB);
    const p4Fov = THREE.MathUtils.lerp(p4aFov, p4bFov, bAB);

    /* ── Select active act target ─────────────────────────────── */
    let tX: number, tY: number, tZ: number, tLkY: number, tFov: number;
    if      (p < 0.25) { tX=p1X; tY=p1Y; tZ=p1Z; tLkY=p1LkY; tFov=p1Fov; }
    else if (p < 0.50) { tX=p2X; tY=p2Y; tZ=p2Z; tLkY=p2LkY; tFov=p2Fov; }
    else if (p < 0.75) { tX=p3X; tY=p3Y; tZ=p3Z; tLkY=p3LkY; tFov=p3Fov; }
    else               { tX=p4X; tY=p4Y; tZ=p4Z; tLkY=p4LkY; tFov=p4Fov; }

    /* ── Micro-breath — strongest during eye close-up ─────────── */
    const breathAmt = p < 0.75
      ? 0.005
      : THREE.MathUtils.lerp(0.005, 0.022, easeOut(act4b));
    const bx = Math.sin(t * 1.05) * breathAmt;
    const by = Math.cos(t * 0.68) * breathAmt * 0.4;

    /* ── Apply camera (exponential lerp — buttery smooth) ──────── */
    camPos.current.lerp(
      new THREE.Vector3(tX + bx, tY + by, tZ),
      1 - Math.pow(0.008, k)
    );
    camLookAt.current.lerp(
      new THREE.Vector3(0, tLkY, 0),
      1 - Math.pow(0.010, k)
    );
    camFovRef.current = THREE.MathUtils.lerp(
      camFovRef.current, tFov, 1 - Math.pow(0.018, k)
    );
    state.camera.position.copy(camPos.current);
    state.camera.lookAt(camLookAt.current);
    const cam = state.camera as THREE.PerspectiveCamera;
    cam.fov = camFovRef.current;
    cam.updateProjectionMatrix();

    /* ══════════════════════════════════════════════════════════════════
     *  MODEL ROTATION
     *
     *  Part I-II : π        — back facing, held steady
     *  Part III  : π → π/2  — THE CINEMATIC ROTATION to side profile
     *              easeInOut = hesitant start, decisive, settling end
     *  Part IV-A : π/2 → 0  — turns to face camera (full body reveal)
     *  Part IV-B : 0         — dead front, locked for eye close-up
     * ══════════════════════════════════════════════════════════════════ */
    let targetRot: number;
    if (p < 0.50) {
      // Parts I & II — back facing, completely still
      targetRot = Math.PI;
    } else if (p < 0.75) {
      // Part III — THE ROTATION
      // Turns from back (π) to side (π/2) with cinematic easing
      targetRot = THREE.MathUtils.lerp(Math.PI, Math.PI / 2, easeInOut(act3));
    } else {
      // Part IV — side to front as camera pulls back
      // Rotation completes by act4a = 0.80 (before the eye push starts)
      const rotProgress = clamp01(remap(act4, 0, 0.75));
      targetRot = THREE.MathUtils.lerp(Math.PI / 2, 0, easeOut(rotProgress));
    }

    // Very fast lerp — near-direct, avoids jitter
    modelRotY.current = THREE.MathUtils.lerp(
      modelRotY.current, targetRot, 1 - Math.pow(0.001, k)
    );
    g.rotation.y  = modelRotY.current;
    g.position.y  = 0; // no float — he stands still

    /* ── Canvas fade at section boundaries ───────────────────────── */
    const raw     = gutsState.raw;
    const fadeIn  = clamp01((raw + 0.10) / 0.13);
    const fadeOut = clamp01((raw - 0.97) / 0.13);
    const vis     = fadeIn * (1 - fadeOut);
    for (const m of materials) m.opacity = vis;
    g.visible = vis > 0.01;
  });

  return (
    <group>
      <group ref={pivotGrp}>
        <primitive object={scene} />
      </group>
      <ContactShadows
        position={[0, -2.9, 0]}
        opacity={0.6}
        scale={14}
        blur={4}
        far={10}
        color="#000000"
      />
    </group>
  );
}

/* ── Canvas ──────────────────────────────────────────────────────────────── */
export default function GutsScene() {
  return (
    <Canvas
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
      camera={{ position: [0, -3.0, 4.2], fov: 52 }}
      style={{
        position: "fixed", inset: 0, zIndex: 1,
        pointerEvents: "none",
        opacity: "var(--about-canvas, 0)",
      }}
    >
      <AdaptiveDpr pixelated />

      {/* ── Chiaroscuro lighting ──────────────────────────────────────
       *  Ember forge: below-left — battle fire, main key
       *  Moon rim: above-right-back — cold night, isolation
       *  Minimal ambient — shadows DEEP, back-view silhouette pops
       * ─────────────────────────────────────────────────────────── */}
      <ambientLight intensity={0.07} />
      {/* Ember fire — main key from below-left */}
      <directionalLight position={[-3, -2, 5]} intensity={3.0} color="#d45f1e" castShadow />
      {/* Soft front fill — barely there */}
      <directionalLight position={[ 0,  1, 5]} intensity={0.5} color="#ffe3b8" />
      {/* Cold moonlight rim — above-right-back */}
      <directionalLight position={[ 3,  7,-4]} intensity={2.0} color="#7ca8d4" />
      {/* Warm ground bounce */}
      <directionalLight position={[ 0, -4, 2]} intensity={0.4} color="#8b3a10" />

      <Suspense fallback={null}>
        <GutsCharacter />
        <Environment resolution={256}>
          <Lightformer intensity={4.5} position={[-4,-2, 3]} scale={[6,4,1]} color="#c0480f" />
          <Lightformer intensity={1.4} position={[ 4, 6,-3]} scale={[5,5,1]} color="#5580b8" />
          <Lightformer intensity={0.4} position={[ 0, 0, 6]} scale={[8,8,1]} color="#fff0e0" />
        </Environment>
      </Suspense>
    </Canvas>
  );
}

useGLTF.preload(GUTS_MODEL);
