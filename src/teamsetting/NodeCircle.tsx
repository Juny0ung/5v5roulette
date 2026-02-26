import React from 'react';
import { Group, Circle, Text } from 'react-konva';
import { NodeData } from './types';

interface NodeCircleProps {
  node: NodeData;
  stageWidth: number;
  stageHeight: number;
  onMove: (id: number, x: number, y: number) => void;
}

export function NodeCircle({ node, stageWidth, stageHeight, onMove }: NodeCircleProps) {
  return (
    <Group
      x={node.x}
      y={node.y}
      draggable
      name="node"
      dragBoundFunc={(pos) => ({
        x: Math.max(18, Math.min(stageWidth - 18, pos.x)),
        y: Math.max(18, Math.min(stageHeight - 18, pos.y)),
      })}
      onDragEnd={(e) => {
        onMove(node.id, e.target.x(), e.target.y());
      }}
    >
      <Circle radius={18} fill="#E8E8E8" stroke="#333" strokeWidth={1.5} />
      {node.name && (
        <Text
          text={node.name}
          y={22}
          fontSize={15}
          fill="#ccc"
          width={70}
          offsetX={35}
          align="center"
          listening={false}
        />
      )}
    </Group>
  );
}
