/**
 * Placeholder for a section's 3D model. The real React Three Fiber
 * <Canvas> mounts here later — for now it reserves the exact space and
 * labels which .glb belongs to the section.
 */
export default function ModelStage({
  model,
  className = "",
  children,
}: {
  model: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      data-model={`model — ${model}`}
      className={`model-stage flex items-center justify-center rounded-sm ${className}`}
    >
      {children ?? (
        <span className="font-mono text-[0.7rem] tracking-[0.25em] text-faint uppercase">
          [ 3d stage ]
        </span>
      )}
    </div>
  );
}
