import React, { useState, useEffect, useRef } from 'react';
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
let _setAreas: React.Dispatch<React.SetStateAction<AreaData[]>> | null = null;
let _snapshot: { nodes: NodeData[]; areas: AreaData[] } = { nodes: [], areas: [] };
let _meetBalance: boolean = true;

export function getMeetBalance(): boolean {
  return _meetBalance;
}

/** Called from window.teamSetting.setNodes — sets node count and names. */
export function setTeamNodes(names: string[]): void {
  _setNodes?.((prevNodes) => buildNodes(names, prevNodes));
}

/** Called from teamDicider.ts — returns current node positions and area data. */
export function getTeamSettingSnapshot(): { nodes: NodeData[]; areas: AreaData[] } {
  return _snapshot;
}

export function importStr(): string {
  const localstr = localStorage.getItem('mbr_teamsetting');
  if (!localstr) return "";

  let nodes: NodeData[] = [];
  let areas: AreaData[] = [];
  let nodenames: string = "";
  const [ nodestr, areastr ] = localstr.split("%$%$", 2);
  if (nodestr) {
    nodestr.split("$%$%").forEach((line: string, i: number) => {
      const strs = line.split(",");
      
      const x = parseInt(strs[1]);
      const y = parseInt(strs[2]);
      if (isNaN(x) || isNaN(y)) return;
      
      nodenames += strs[0] + ',';

      nodes.push({
        id: i + 1,
        name: strs[0],
        x: x,
        y: y
      })
    });
  }

  if (areastr) {
    areastr.split("$%$%").forEach((line: string, i: number) => {
      const strs = line.split(",");
      
      const x = parseInt(strs[1]);
      const y = parseInt(strs[2]);
      if (isNaN(x) || isNaN(y)) return;
      
      const width = parseInt(strs[3]);
      const height = parseInt(strs[4]);
      if (isNaN(width) || isNaN(height)) return;

      if (strs[0] === "SameTeam") {
        areas.push({
          id: `area-${Date.now()}-${i}`,
          type: "SameTeam",
          x: x,
          y: y,
          width: width,
          height: height
        });
      } else {
        areas.push({
          id: `area-${Date.now()}-${i}`,
          name: strs[5],
          type: "Balance",
          x: x,
          y: y,
          width: width,
          height: height
        });
      }
    });
  }

  _setNodes?.(nodes);
  _setAreas?.(areas);

  return nodenames;
}

function exportStr(): string {
  let res = "";
  _snapshot.nodes.forEach((node: NodeData, i: number) => {
    if (i > 0) res += "$%$%";
    res += `${node.name},${node.x},${node.y}`;
  });
  res += "%$%$"
  _snapshot.areas.forEach((area: AreaData, i: number) => {
    if (i > 0) res += "$%$%"
    res += `${area.type},${area.x},${area.y},${area.width},${area.height}`;
    if (area.name) res += `,${area.name}`;
  })
  return res;
}

// ─────────────────────────────────────────────────────────────────────────────

export function TeamSetting() {
  const [nodes, setNodes] = useState<NodeData[]>(() => buildNodes(Array.from({ length: 10 }, () => '')));
  const [areas, setAreas] = useState<AreaData[]>([]);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [meetBalance, setMeetBalance] = useState<boolean>(true);
  const isMounted = useRef(false);

  // Expose setters for external control
  useEffect(() => {
    _setNodes = setNodes;
    _setAreas = setAreas;
    return () => { _setNodes = null; _setAreas = null; };
  }, []);

  // Sync meetBalance to module-level variable
  useEffect(() => {
    _meetBalance = meetBalance;
  }, [meetBalance]);

  // Keep snapshot in sync
  useEffect(() => {
    _snapshot = { nodes, areas };
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    localStorage.setItem('mbr_teamsetting', exportStr());
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
      meetBalance={meetBalance}
      onMeetBalanceChange={setMeetBalance}
      onNodeMove={handleNodeMove}
      onAreaAdd={handleAreaAdd}
      onAreaChange={handleAreaChange}
      onAreaSelect={handleAreaSelect}
      onAreaDelete={handleAreaDelete}
    />
  );
}
