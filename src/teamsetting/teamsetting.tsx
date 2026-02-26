import React, { useState, useEffect } from 'react';
import { NodeData, AreaData } from './types';
import { CoordinatePlane } from './CoordinatePlane';

// Must match CoordinatePlane's STAGE_HEIGHT
const STAGE_HEIGHT = 500;
const COL_X: [number, number] = [100, 260];
const PADDING = 60;

function buildNodes(names: string[], prevNodes?: NodeData[]): NodeData[] {
  const count = names.length;
  if (count === 0) return [];

  const yForRow = (i: number, total: number): number => {
    if (total === 1) return Math.round(STAGE_HEIGHT / 2);
    return Math.round(PADDING + (i * (STAGE_HEIGHT - 2 * PADDING)) / (total - 1));
  };

  const matchedNodes: (NodeData | null)[] = [];
  const usedIds = new Set<number>();

  for (const name of names) {
    const foundNode = prevNodes?.find((pNode) => pNode.name === name) || null;
    matchedNodes.push(foundNode);
    
    if (foundNode) {
      usedIds.add(foundNode.id);
    }
  }

  const availableIds: number[] = [];
  for (let i = 1; i <= count; i++) {
    if (!usedIds.has(i)) {
      availableIds.push(i);
    }
  }

  const nodes: NodeData[] = [];
  for (let i = 0; i < count; i++) {
    if (matchedNodes[i]) {
      nodes.push(matchedNodes[i]!);
    } else {
      const newId = availableIds.shift()!;
      nodes.push({
        id: newId,
        name: names[i],
        x: COL_X[newId > 5 ? 1 : 0],
        y: yForRow((newId - 1) % 5, 5)
      });
    }
  }

  return nodes;
}

// ── Module-level API (survives component re-renders) ──────────────────────────

let _setNodes: React.Dispatch<React.SetStateAction<NodeData[]>> | null = null;
let _snapshot: { nodes: NodeData[]; areas: AreaData[] } = { nodes: [], areas: [] };

/** Called from window.teamSetting.setNodes — sets node count and names. */
export function setTeamNodes(names: string[]): void {
  _setNodes?.((prevNodes) => buildNodes(names, prevNodes));
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
    const newAttrs = { ...attrs };
  
    if (newAttrs.name === "") {
      delete newAttrs.name;
    }
    
    setAreas((prev) => prev.map((a) => (a.id === id ? { ...a, ...newAttrs } : a)));
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
