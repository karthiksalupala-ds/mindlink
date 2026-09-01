"use client";

import { useMindStore } from "@/lib/store";
import { THOUGHT_COLORS } from "@/lib/types";

export default function Connections() {
  const { session } = useMindStore();
  if (!session) return null;

  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill="rgba(167,139,250,0.5)" />
        </marker>
      </defs>

      {session.connections.map((conn) => {
        const from = session.thoughts.find((t) => t.id === conn.fromId);
        const to = session.thoughts.find((t) => t.id === conn.toId);
        if (!from || !to) return null;

        const x1 = from.x + 134;
        const y1 = from.y + 48;
        const x2 = to.x + 134;
        const y2 = to.y + 48;
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2 - 40;
        const color = THOUGHT_COLORS[from.type] || "#a78bfa";

        return (
          <g key={conn.id} filter="url(#glow)">
            <path
              d={`M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`}
              fill="none"
              stroke={color}
              strokeWidth="2"
              strokeOpacity="0.55"
              markerEnd="url(#arrow)"
            />
            {conn.label && (
              <text x={mx} y={my - 8} textAnchor="middle" fill="rgba(200,200,220,0.6)" fontSize="10">
                {conn.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
