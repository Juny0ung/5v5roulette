import React, { useState, useEffect } from 'react';
import { NodeData, AreaData } from './types';
import { CoordinatePlane } from './CoordinatePlane';

// Must match CoordinatePlane's STAGE_HEIGHT
const STAGE_HEIGHT = 500;
const COL_X: [number, number] = [100, 260];
const PADDING = 60;

function buildNodes(names: string[]): NodeData[] {
  const count = names.length;
  if (count === 0) return [];

  const col1Count = Math.ceil(count / 2);
  const col2Count = count - col1Count;

  const yForRow = (i: number, total: number): number => {
    if (total === 1) return Math.round(STAGE_HEIGHT / 2);
    return Math.round(PADDING + (i * (STAGE_HEIGHT - 2 * PADDING)) / (total - 1));
  };

  const nodes: NodeData[] = [];
  for (let i = 0; i < col1Count; i++) {
    nodes.push({ id: i + 1, name: names[i], x: COL_X[0], y: yForRow(i, col1Count) });
  }
  for (let i = 0; i < col2Count; i++) {
    nodes.push({ id: col1Count + i + 1, name: names[col1Count + i], x: COL_X[1], y: yForRow(i, col2Count) });
  }
  return nodes;
}

// ── Module-level API (survives component re-renders) ──────────────────────────

let _setNodes: ((nodes: NodeData[]) => void) | null = null;
let _snapshot: { nodes: NodeData[]; areas: AreaData[] } = { nodes: [], areas: [] };

/** Called from window.teamSetting.setNodes — sets node count and names. */
export function setTeamNodes(names: string[]): void {
  _setNodes?.(buildNodes(names));
}

/** Called from teamDicider.ts — returns current node positions and area data. */
export function getTeamSettingSnapshot(): { nodes: NodeData[]; areas: AreaData[] } {
  return _snapshot;
}

// ─────────────────────────────────────────────────────────────────────────────

export function TeamSetting() {
  const [nodes, setNodes] = useState<NodeData[]>(() => buildNodes(Array.from({ length: 10 }, () => '')));
  const [areas, setAreas] = useState<AreaData[]>([]);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);

  // Expose setter for external control
  useEffect(() => {
    _setNodes = setNodes;
    return () => { _setNodes = null; };
  }, []);

  // Keep snapshot in sync
  useEffect(() => {
    _snapshot = { nodes, areas };
  }, [nodes, areas]);

  function handleNodeMove(id: number, x: number, y: number) {
    setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, x, y } : n)));
  }

  function handleAreaAdd(area: AreaData) {
    setAreas((prev) => [...prev, area]);
  }

  function handleAreaChange(id: string, attrs: Partial<Pick<AreaData, 'x' | 'y' | 'width' | 'height' | 'name'>>) {
    setAreas((prev) => prev.map((a) => (a.id === id ? { ...a, ...attrs } : a)));
  }

  function handleAreaSelect(id: string | null) {
    setSelectedAreaId(id);
  }

  function handleAreaDelete(id: string) {
    setAreas((prev) => prev.filter((a) => a.id !== id));
    setSelectedAreaId((prev) => (prev === id ? null : prev));
  }

  return (
    <CoordinatePlane
      nodes={nodes}
      areas={areas}
      selectedAreaId={selectedAreaId}
      onNodeMove={handleNodeMove}
      onAreaAdd={handleAreaAdd}
      onAreaChange={handleAreaChange}
      onAreaSelect={handleAreaSelect}
      onAreaDelete={handleAreaDelete}
    />
  );
}
