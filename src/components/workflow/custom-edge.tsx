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
        stroke="rgba(147, 51, 234, 0.15)"
        strokeWidth={8}
        style={{ filter: "blur(4px)" }}
      />
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: "hsl(271, 91%, 65%)",
          strokeWidth: 2,
          ...style,
        }}
      />
    </>
  );
}
