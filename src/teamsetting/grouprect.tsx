import React from 'react';
import { Group, Rect, Text, Circle } from 'react-konva';
import { AreaData } from './types';
import { useTranslate } from './useLocale';

interface AreaRectProps {
  area: AreaData;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (attrs: Partial<Pick<AreaData, 'x' | 'y' | 'width' | 'height'>>) => void;
  checkOverlap: (candidate: { x: number; y: number; width: number; height: number }) => boolean;
  onDelete: () => void;
  onRenameRequest: () => void;
}

const TYPE_COLORS: Record<string, { fill: string; stroke: string }> = {
  Balance: { fill: 'rgba(40,160,80,0.1)', stroke: '#28a050' },
  SameTeam: { fill: 'rgba(200,60,60,0.1)', stroke: '#c83c3c' },
};

const TYPE_LABELS: Record<string, string> = {
  Balance: 'Balance',
  SameTeam: 'Same Team',
};

export function AreaRect({ area, isSelected, onSelect, onChange, checkOverlap, onDelete, onRenameRequest }: AreaRectProps) {
  const t = useTranslate();
  const colors = TYPE_COLORS[area.type] ?? TYPE_COLORS['A'];

  return (
    <Group
      id={area.id}
      name="area-rect"
      x={area.x}
      y={area.y}
      draggable
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={(e) => {
        const candidate = {
          x: e.target.x(),
          y: e.target.y(),
          width: area.width,
          height: area.height,
        };
        if (checkOverlap(candidate)) {
          e.target.x(area.x);
          e.target.y(area.y);
          e.target.getLayer()?.batchDraw();
        } else {
          onChange({ x: e.target.x(), y: e.target.y() });
        }
      }}
      onTransformEnd={(e) => {
        const node = e.target;
        const sx = node.scaleX();
        const sy = node.scaleY();
        node.scaleX(1);
        node.scaleY(1);
        onChange({
          x: node.x(),
          y: node.y(),
          width: Math.max(20, area.width * sx),
          height: Math.max(20, area.height * sy),
        });
      }}
    >
      <Rect
        width={area.width}
        height={area.height}
        fill={colors.fill}
        stroke={isSelected ? '#fff' : colors.stroke}
        strokeWidth={isSelected ? 2 : 1}
        cornerRadius={4}
      />
      {!!area.name && (
        <Text
          x={6}
          y={6}
          text={`${area.name}`}
          fontSize={12}
          fill="#fff"
          onClick={(e) => { e.cancelBubble = true; onRenameRequest(); }}
          onTap={(e) => { e.cancelBubble = true; onRenameRequest(); }}
        />
      )}
      {/* Delete button — top-right corner */}
      <Group
        x={area.width - 10}
        y={10}
        onMouseDown={(e) => { e.cancelBubble = true; }}
        onClick={(e) => { e.cancelBubble = true; onDelete(); }}
        onTap={(e) => { e.cancelBubble = true; onDelete(); }}
      >
        <Circle radius={9} fill="rgba(30,30,40,0.75)" stroke="#888" strokeWidth={0.5} />
        <Text
          text="×"
          fontSize={13}
          fontStyle="bold"
          fill="#eee"
          width={18}
          height={18}
          offsetX={9}
          offsetY={9}
          align="center"
          verticalAlign="middle"
          listening={false}
        />
      </Group>
    </Group>
  );
}
