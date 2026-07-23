"use client";

import dynamic from "next/dynamic";

// The WebGL scene is client-only — never server-render the canvas.
const Scene = dynamic(() => import("./Scene"), { ssr: false });

export default function Stage3D() {
  return <Scene />;
}
