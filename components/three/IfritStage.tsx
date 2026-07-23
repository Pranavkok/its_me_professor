"use client";
import dynamic from "next/dynamic";
const IfritScene = dynamic(() => import("./IfritScene"), { ssr: false });
export default function IfritStage() { return <IfritScene />; }
