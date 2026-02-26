export type AreaType = "Balance" | "SameTeam";

export interface NodeData { id: number; name: string; x: number; y: number; }
export interface AreaData { id: string; name?: string; type: AreaType; x: number; y: number; width: number; height: number; }
export interface PendingArea { startX: number; startY: number; currentX: number; currentY: number; }
export interface PendingAreaResolved { x: number; y: number; width: number; height: number; }
export interface AreaDialogResult { name: string; type: AreaType; }

export function rectsOverlap(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number }
): boolean {
  return !(a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y);
}
