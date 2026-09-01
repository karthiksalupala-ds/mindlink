"use client";

import { useMindStore } from "@/lib/store";
import { THOUGHT_COLORS } from "@/lib/types";

export default function Connections() {
  const { session } = useMindStore();
  if (!session) return null;

  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
      <defs>
        <marker
          id="arrow"
          markerWidth="8"
          markerHeight="8"
          refX="6"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L0,6 L6,3 z" fill="#94a3b8" />
        </marker>
      </defs>

      {session.connections.map((conn) => {
        const from = session.thoughts.find((t) => t.id === conn.fromId);
        const to = session.thoughts.find((t) => t.id === conn.toId);
        if (!from || !to) return null;

        // Center of nodes (node width ~260)
        const x1 = from.x + 130;
        const y1 = from.y + 40;
        const x2 = to.x + 130;
        const y2 = to.y + 40;

        // Slight curve
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2 - 30;

        const color = THOUGHT_COLORS[from.type] || "#94a3b8";

        return (
          <g key={conn.id}>
            <path
              d={`M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`}
              fill="none"
              stroke={color}
              strokeWidth="2"
              strokeOpacity="0.45"
              markerEnd="url(#arrow)"
            />
            {conn.label && (
              <text
                x={mx}
                y={my - 6}
                textAnchor="middle"
                className="fill-zinc-500 text-[10px]"
              >
                {conn.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
