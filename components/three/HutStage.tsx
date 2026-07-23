"use client";

import dynamic from "next/dynamic";

const HutScene = dynamic(() => import("./HutScene"), { ssr: false });

export default function HutStage() {
  return <HutScene />;
}
