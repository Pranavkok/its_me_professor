/**
 * Shared hero scroll signal. Written by <HeroDirector/> (DOM side) and read by
 * the WebGL camera + model inside the canvas. A plain module object keeps
 * the two worlds in sync every frame without React re-renders.
 *
 *   p    — hero progress clamped to [0, 1] (drives the camera path)
 *   raw  — unclamped progress (can exceed 1, used to fade the model on exit)
 *   charY — detected character world-space Y (written by Scene, read by debug overlay)
 *   faceY — detected face world-space Y
 */
export const heroState = {
  p: 0,
  raw: 0,
  charY: -0.45 as number,
  faceY: -0.22 as number,
  detectionMethod: '' as string,
};
