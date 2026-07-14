"use client";

import {
  BaseEdge,
  getBezierPath,
  type EdgeProps,
} from "@xyflow/react";

export function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  selected,
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      {/* Glow effect underneath */}
      <path
        d={edgePath}
        fill="none"
        stroke={selected ? "rgba(124, 58, 237, 0.25)" : "rgba(124, 58, 237, 0.08)"}
        strokeWidth={selected ? 10 : 8}
        style={{ filter: "blur(4px)" }}
      />
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: selected ? "hsl(271, 91%, 60%)" : "hsl(263, 70%, 50%)",
          strokeWidth: selected ? 3 : 2,
          ...style,
        }}
      />
    </>
  );
}
