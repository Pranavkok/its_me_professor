"use client";

import dynamic from "next/dynamic";

const LostRobotScene = dynamic(() => import("./LostRobotScene"), { ssr: false });

export default function LostRobotStage() {
  return <LostRobotScene />;
}
