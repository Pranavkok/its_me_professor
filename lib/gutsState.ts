/**
 * Shared About-section scroll signal.
 * Written by <AboutDirector /> (DOM side) and read by GutsScene inside its canvas.
 * A plain mutable module object keeps both worlds in sync every frame
 * without triggering React re-renders.
 *
 *   p       — about progress clamped [0, 1]
 *   raw     — unclamped (used for fade-in / fade-out past bounds)
 *   visible — true while the about section is intersecting the viewport
 *   charY   — detected character world-space Y centre (written by GutsScene)
 *   faceY   — detected face world-space Y (written by GutsScene)
 */
export const gutsState = {
  p: 0,
  raw: 0,
  visible: false,
  charY: 0 as number,
  faceY: 0 as number,
};
