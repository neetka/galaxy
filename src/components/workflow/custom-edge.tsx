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
        stroke="rgba(124, 58, 237, 0.08)"
        strokeWidth={8}
        style={{ filter: "blur(4px)" }}
      />
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: "hsl(263, 70%, 50%)",
          strokeWidth: 2,
          ...style,
        }}
      />
    </>
  );
}
