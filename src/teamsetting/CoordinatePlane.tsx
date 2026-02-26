import React, { useRef, useState, useEffect, MutableRefObject } from 'react';
import type Konva from 'konva';
import { Stage, Layer, Rect, Transformer } from 'react-konva';
import { NodeData, AreaData, AreaType, PendingArea, PendingAreaResolved, rectsOverlap } from './types';
import { NodeCircle } from './NodeCircle';
import { AreaRect } from './grouprect';
import { useTranslate } from './useLocale';

const STAGE_HEIGHT = 500;
const MIN_AREA_SIZE = 20;

const GHOST_COLORS: Record<AreaType, { fill: string; stroke: string }> = {
  Balance: { fill: 'rgba(40,160,80,0.25)', stroke: '#28a050' },
  SameTeam: { fill: 'rgba(200,60,60,0.25)', stroke: '#c83c3c' },
};

const DEFAULT_NAMES: Record<AreaType, string> = {
  Balance: 'Balance',
  SameTeam: 'Same Team',
};

function normalizePendingArea(p: PendingArea): PendingAreaResolved {
  const x = Math.min(p.startX, p.currentX);
  const y = Math.min(p.startY, p.currentY);
  const width = Math.abs(p.currentX - p.startX);
  const height = Math.abs(p.currentY - p.startY);
  return { x, y, width, height };
}

interface CoordinatePlaneProps {
  nodes: NodeData[];
  areas: AreaData[];
  selectedAreaId: string | null;
  onNodeMove: (id: number, x: number, y: number) => void;
  onAreaAdd: (area: AreaData) => void;
  onAreaChange: (id: string, attrs: Partial<Pick<AreaData, 'x' | 'y' | 'width' | 'height' | 'name'>>) => void;
  onAreaSelect: (id: string | null) => void;
  onAreaDelete: (id: string) => void;
}

export function CoordinatePlane({
  nodes,
  areas,
  selectedAreaId,
  onNodeMove,
  onAreaAdd,
  onAreaChange,
  onAreaSelect,
  onAreaDelete,
}: CoordinatePlaneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const isDrawingRef: MutableRefObject<boolean> = useRef(false);

  const t = useTranslate();
  const [stageWidth, setStageWidth] = useState(500);
  const [pendingArea, setPendingArea] = useState<PendingArea | null>(null);
  const [defaultType, setDefaultType] = useState<AreaType>("Balance");
  const [renamingArea, setRenamingArea] = useState<{ id: string; name: string; x: number; y: number } | null>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renamingArea) renameInputRef.current?.focus();
  }, [renamingArea?.id]);

  // ResizeObserver for responsive width
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setStageWidth(entry.contentRect.width || 500);
      }
    });
    observer.observe(container);
    setStageWidth(container.getBoundingClientRect().width || 500);
    return () => observer.disconnect();
  }, []);

  // Wire Transformer to selected area
  useEffect(() => {
    const tr = transformerRef.current;
    const stage = stageRef.current;
    if (!tr || !stage) return;
    if (selectedAreaId) {
      const node = stage.findOne(`#${selectedAreaId}`);
      tr.nodes(node ? [node] : []);
    } else {
      tr.nodes([]);
    }
    tr.getLayer()?.batchDraw();
  }, [selectedAreaId, areas]);

  function handleStageMouseDown(e: Konva.KonvaEventObject<MouseEvent>) {
    if (e.target !== e.target.getStage()) return;
    onAreaSelect(null);
    const stage = e.target.getStage();
    if (!stage) return;
    const pos = stage.getPointerPosition();
    if (!pos) return;
    isDrawingRef.current = true;
    setPendingArea({ startX: pos.x, startY: pos.y, currentX: pos.x, currentY: pos.y });
  }

  function handleStageMouseMove(e: Konva.KonvaEventObject<MouseEvent>) {
    if (!isDrawingRef.current) return;
    const stage = e.target.getStage();
    if (!stage) return;
    const pos = stage.getPointerPosition();
    if (!pos) return;
    setPendingArea((prev) => prev ? { ...prev, currentX: pos.x, currentY: pos.y } : prev);
  }

  function handleStageMouseUp() {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    if (!pendingArea) return;
    const resolved = normalizePendingArea(pendingArea);
    setPendingArea(null);
    if (resolved.width >= MIN_AREA_SIZE && resolved.height >= MIN_AREA_SIZE) {
      const conflict = areas
        .filter((a) => a.type === defaultType)
        .some((a) => rectsOverlap(a, resolved));
      if (!conflict) {
        if (defaultType === "Balance") {
          onAreaAdd({ id: `area-${Date.now()}`, name: t(DEFAULT_NAMES[defaultType]), type: defaultType, ...resolved });
        } else {
          onAreaAdd({ id: `area-${Date.now()}`, type: defaultType, ...resolved });
        }
      }
    }
  }

  function handleRenameRequest(id: string, name: string, x: number, y: number) {
    setRenamingArea({ id, name, x, y });
  }

  function handleRenameCommit() {
    if (!renamingArea) return;
    onAreaChange(renamingArea.id, { name: renamingArea.name });
    setRenamingArea(null);
  }

  const boundBoxFunc = (oldBox: Konva.Box, newBox: Konva.Box) => {
    const selected = areas.find((a) => a.id === selectedAreaId);
    if (!selected) return newBox;
    const candidate = {
      x: newBox.x,
      y: newBox.y,
      width: Math.max(MIN_AREA_SIZE, newBox.width),
      height: Math.max(MIN_AREA_SIZE, newBox.height),
    };
    const conflict = areas
      .filter((a) => a.type === selected.type && a.id !== selected.id)
      .some((a) => rectsOverlap(a, candidate));
    return conflict ? oldBox : { ...newBox, ...candidate };
  };

  const ghostColor = GHOST_COLORS[defaultType];

  return (
    <div style={{ width: '100%', maxWidth: 380, margin: '0 auto' }}>
      {/* Type selector — segmented control */}
      <div style={{
        display: 'flex', marginBottom: 6,
        background: '#17171f', borderRadius: 8, padding: 3,
      }}>
        {(["Balance", "SameTeam"] as AreaType[]).map((type) => {
          const active = defaultType === type;
          const color = type === "Balance" ? '#4cdd80' : '#f06060';
          const label = type === "Balance" ? t('Balance') : t('Same Team');
          return (
            <button
              key={type}
              onClick={() => setDefaultType(type)}
              style={{
                flex: 1, padding: '6px 0', borderRadius: 6, border: 'none',
                background: active ? `${color}22` : 'transparent',
                color: active ? color : '#555',
                fontWeight: active ? 'bold' : 'normal',
                fontSize: 12, cursor: 'pointer',
                boxShadow: active ? `inset 0 0 0 1px ${color}55` : 'none',
                transition: 'all 0.15s',
              }}
            >
              {label}
            </button>
          );
        })}
      </div>
      {/* Stage container */}
      <div ref={containerRef} style={{ position: 'relative', width: '100%', height: STAGE_HEIGHT }}>
        <Stage
          ref={stageRef}
          width={stageWidth}
          height={STAGE_HEIGHT}
          onMouseDown={handleStageMouseDown}
          onMouseMove={handleStageMouseMove}
          onMouseUp={handleStageMouseUp}
          style={{ background: '#2a2a3a', borderRadius: 8, display: 'block' }}
        >
          <Layer>
            {pendingArea && (
              <Rect
                {...normalizePendingArea(pendingArea)}
                fill={ghostColor.fill}
                stroke={ghostColor.stroke}
                strokeWidth={1}
                listening={false}
              />
            )}
            {areas.map((area) => (
              <AreaRect
                key={area.id}
                area={area}
                isSelected={area.id === selectedAreaId}
                onSelect={() => onAreaSelect(area.id)}
                onChange={(attrs) => onAreaChange(area.id, attrs)}
                checkOverlap={(c) =>
                  areas
                    .filter((a) => a.type === area.type && a.id !== area.id)
                    .some((a) => rectsOverlap(a, c))
                }
                onDelete={() => onAreaDelete(area.id)}
                onRenameRequest={() => handleRenameRequest(area.id, area.name ?? "", area.x, area.y)}
              />
            ))}
            <Transformer
              ref={transformerRef}
              rotateEnabled={false}
              boundBoxFunc={boundBoxFunc}
            />
            {nodes.map((node) => (
              <NodeCircle
                key={node.id}
                node={node}
                stageWidth={stageWidth}
                stageHeight={STAGE_HEIGHT}
                onMove={onNodeMove}
              />
            ))}
          </Layer>
        </Stage>
        {renamingArea && (
          <input
            ref={renameInputRef}
            value={renamingArea.name}
            onChange={(e) => setRenamingArea((prev) => prev ? { ...prev, name: e.target.value } : null)}
            onBlur={handleRenameCommit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); handleRenameCommit(); }
              if (e.key === 'Escape') setRenamingArea(null);
            }}
            style={{
              position: 'absolute',
              left: renamingArea.x + 6,
              top: renamingArea.y + 4,
              width: 110,
              background: '#1a1a2a',
              color: '#fff',
              border: '1px solid #4cdd80',
              borderRadius: 3,
              padding: '2px 5px',
              fontSize: 11,
              zIndex: 10,
              outline: 'none',
            }}
          />
        )}
      </div>
    </div>
  );
}
