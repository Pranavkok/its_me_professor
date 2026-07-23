"use client";

import dynamic from "next/dynamic";

// GutsScene is client-only — never server-render the canvas.
const GutsScene = dynamic(() => import("./GutsScene"), { ssr: false });

export default function GutsStage() {
  return <GutsScene />;
}
