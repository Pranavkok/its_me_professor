"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, AdaptiveDpr, ContactShadows } from "@react-three/drei";
import * as THREE from "three";

/* ============================================================================
 *  IFRIT SCENE — cinematic camera orbiting a BIG, prominent model
 *
 *  Model is scaled to fill the viewport (~4 units tall).
 *  Camera is outside, moving around it like a film crew:
 *
 *  Scroll keyframes (5 stops matching the 5 UI stops):
 *    0.00  Full body — front, slightly low. You see all of Ifrit.
 *    0.25  Face close-up — camera pushes up to eye level.
 *    0.50  Dramatic low angle — camera near the ground looking up.
 *    0.75  Side sweep — camera arcs to the right flank at mid-height.
 *    1.00  Wide back-left — mysterious profile, Ifrit's power fills frame.
 *
 *  Surprise camera events: sudden push-in, shake, dramatic tilt.
 *  Ifrit slow-breathes (floating up/down) always.
 * ============================================================================ */

const IFRIT_MODEL = "/models/ifrit.glb";
let _ifritScroll = 0;

/* ── Cinematic camera keyframes ─────────────────────────────────────── */
const KF = [
  /* Full body, front — camera below eye level, slight upward tilt */
  { pos: [ 0.0, -0.5, 7.5],  look: [ 0.0,  0.5, 0.0] },
  /* Face close-up — push up to head height, zoom in tight        */
  { pos: [ 0.4,  2.2, 3.5],  look: [ 0.0,  2.0, 0.0] },
  /* Dramatic low angle — ground level, camera almost floor        */
  { pos: [ 1.2, -2.5, 5.0],  look: [ 0.0,  0.0, 0.0] },
  /* Right flank sweep — arc to the side, see the silhouette       */
  { pos: [ 6.5,  0.5, 3.0],  look: [ 0.0,  0.5, 0.0] },
  /* Back-left wide — mysterious angle, full power in frame         */
  { pos: [-4.5,  1.5,-4.5],  look: [ 0.0,  0.5, 0.0] },
];

function ss(x: number) {
  x = Math.max(0, Math.min(1, x));
  return x * x * (3 - 2 * x);
}
function sampleKF(t: number) {
  const n = KF.length - 1;
  const i = Math.min(Math.floor(t * n), n - 1);
  const f = ss(t * n - i);
  const a = KF[i], b = KF[i + 1];
  const l = (a: number, b: number) => a + (b - a) * f;
  return {
    pos:  [l(a.pos[0],b.pos[0]),  l(a.pos[1],b.pos[1]),  l(a.pos[2],b.pos[2])]  as [number,number,number],
    look: [l(a.look[0],b.look[0]),l(a.look[1],b.look[1]),l(a.look[2],b.look[2])] as [number,number,number],
  };
}

/* ── Surprise events ─────────────────────────────────────────────────── */
type SK = "PUSH_IN" | "SHAKE" | "DUTCH_TILT" | "SNAP_CLOSE";
interface Surprise { kind: SK; start: number; dur: number }

function mkSurprise(now: number): Surprise {
  const kinds: SK[] = ["PUSH_IN","SHAKE","DUTCH_TILT","SNAP_CLOSE"];
  const kind = kinds[Math.floor(Math.random() * kinds.length)];
  return { kind, start: now, dur: kind === "SHAKE" ? 0.5 : 1.4 };
}

/* ── Ifrit model + camera controller ────────────────────────────────── */
function IfritModel() {
  const { scene }  = useGLTF(IFRIT_MODEL);
  const { camera } = useThree();
  const groupRef   = useRef<THREE.Group>(null);
  const ok         = useRef(false);
  const elapsed    = useRef(0);
  const nextSp     = useRef(5 + Math.random() * 5);
  const sp         = useRef<Surprise | null>(null);

  /* ── Scale model to ~4 units tall so it FILLS the screen ─────────── */
  useMemo(() => {
    if (ok.current) return;
    scene.scale.set(1, 1, 1);
    scene.position.set(0, 0, 0);

    const bbox = new THREE.Box3().setFromObject(scene);
    const dims = bbox.getSize(new THREE.Vector3());
    const ctr  = bbox.getCenter(new THREE.Vector3());
    const maxD = Math.max(dims.x, dims.y, dims.z) || 1;

    /* 4 units tall — big enough to dominate the frame */
    const s = 4.5 / maxD;
    scene.scale.setScalar(s);
    /* Centre, then drop so feet touch y=−2 */
    scene.position.set(-ctr.x * s, -ctr.y * s, -ctr.z * s);

    scene.traverse(o => {
      const m = o as THREE.Mesh;
      if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; }
    });
    ok.current = true;
  }, [scene]);

  /* ── Frame loop ──────────────────────────────────────────────────── */
  useFrame((_, dt) => {
    elapsed.current += dt;
    const now = elapsed.current;

    /* Ifrit breathes — slow float */
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(now * 0.6) * 0.08;
      /* Subtle sway */
      groupRef.current.rotation.y = Math.sin(now * 0.18) * 0.04;
    }

    /* ── Scroll-driven camera base ── */
    const path = sampleKF(Math.max(0, Math.min(1, _ifritScroll)));
    const tgtPos  = new THREE.Vector3(...path.pos);
    const tgtLook = new THREE.Vector3(...path.look);

    /* ── Surprise events ── */
    if (now > nextSp.current && !sp.current) {
      sp.current    = mkSurprise(now);
      nextSp.current = now + 4 + Math.random() * 7;
    }

    let dPos = new THREE.Vector3();
    let roll = 0;

    if (sp.current) {
      const s   = sp.current;
      const age = now - s.start;
      const pct = Math.min(age / s.dur, 1);
      const pulse = pct < 0.3 ? ss(pct / 0.3) : 1 - ss((pct - 0.3) / 0.7);

      if (s.kind === "PUSH_IN") {
        /* Lurch toward Ifrit by 30% of current distance */
        const toModel = tgtLook.clone().sub(tgtPos).normalize();
        dPos.copy(toModel).multiplyScalar(2.2 * pulse);
      } else if (s.kind === "SNAP_CLOSE") {
        /* Snap vertically up and close */
        dPos.set(0, 0.8 * pulse, -1.5 * pulse);
      } else if (s.kind === "DUTCH_TILT") {
        /* Camera rolls sideways — disorienting Dutch angle */
        roll = 0.28 * pulse;
      } else if (s.kind === "SHAKE") {
        const a = 0.055 * pulse;
        dPos.set(Math.sin(now * 44) * a, Math.sin(now * 37) * a * 0.5, Math.sin(now * 41) * a);
      }
      if (pct >= 1) sp.current = null;
    }

    /* ── Apply to camera ── */
    const lerpSpd = sp.current?.kind === "SHAKE" ? 1.0 : 1.6;
    camera.position.lerp(tgtPos.clone().add(dPos), dt * lerpSpd);

    /* LookAt with lerp */
    const dir  = new THREE.Vector3(); camera.getWorldDirection(dir);
    const want = tgtLook.clone().sub(camera.position).normalize();
    dir.lerp(want, dt * lerpSpd);
    camera.lookAt(camera.position.clone().add(dir));

    /* Dutch tilt — apply via up vector */
    const baseUp = new THREE.Vector3(0, 1, 0);
    if (Math.abs(roll) > 0.001) {
      baseUp.set(Math.sin(roll), Math.cos(roll), 0);
    }
    camera.up.lerp(baseUp, dt * 3);
  });

  return (
    <group ref={groupRef}>
      <primitive object={scene} />
    </group>
  );
}

/* ── Scroll tracker ──────────────────────────────────────────────────── */
function ScrollTracker() {
  useEffect(() => {
    const section = document.getElementById("contact");
    if (!section) return;
    const onScroll = () => {
      const r = section.getBoundingClientRect();
      const travel = r.height - window.innerHeight;
      _ifritScroll = Math.max(0, Math.min(1, -r.top / travel));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return null;
}

/* ── Pulsing fire lights ──────────────────────────────────────────────── */
function FireLights() {
  const key  = useRef<THREE.DirectionalLight>(null!);
  const fill = useRef<THREE.PointLight>(null!);
  const rim  = useRef<THREE.PointLight>(null!);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    /* Flicker the key light — fire-like */
    if (key.current)  key.current.intensity  = 5.0 + Math.sin(t * 8.2) * 1.5 + Math.sin(t * 13.7) * 0.8;
    if (fill.current) fill.current.intensity = 2.0 + Math.sin(t * 5.5) * 0.8;
    if (rim.current)  rim.current.intensity  = 3.0 + Math.sin(t * 7.1 + 1.4) * 1.2;
  });
  return (
    <>
      {/* Key — fire from below, classic monster lighting */}
      <directionalLight ref={key}  position={[0, -3, 4]}   color="#ff4400" castShadow shadow-mapSize={[2048,2048]} />
      {/* Fill — warm orange from the right */}
      <pointLight      ref={fill} position={[4,  2, 3]}   color="#ff8800" distance={14} decay={2} />
      {/* Rim — crimson from behind, separates from background */}
      <pointLight      ref={rim}  position={[-3, 3,-4]}   color="#cc1100" distance={12} decay={2} />
      {/* Lava glow from directly below */}
      <pointLight position={[0, -4, 0]} color="#ff2200" intensity={3.0} distance={10} decay={2} />
      {/* Eye-level fill — subtle warm gold */}
      <directionalLight position={[2, 1, 6]} intensity={1.5} color="#ffaa44" />
    </>
  );
}

/* ── Canvas export ───────────────────────────────────────────────────── */
export default function IfritScene() {
  return (
    <Canvas
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
      camera={{ position: [0, -0.5, 7.5], fov: 60, near: 0.1, far: 200 }}
      shadows
      style={{ width: "100%", height: "100%" }}
    >
      <AdaptiveDpr pixelated />

      {/* Atmospheric fire fog */}
      <fogExp2 attach="fog" args={["#100400", 0.038]} />

      <ambientLight intensity={0.04} color="#200800" />

      <FireLights />
      <ScrollTracker />

      <Suspense fallback={null}>
        <IfritModel />
        {/* Ground shadow — anchors the giant in space */}
        <ContactShadows
          position={[0, -2.6, 0]}
          opacity={0.7}
          scale={16}
          blur={4}
          far={10}
          color="#200500"
        />
      </Suspense>
    </Canvas>
  );
}

useGLTF.preload(IFRIT_MODEL);
