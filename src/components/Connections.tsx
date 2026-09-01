"use client";

import { useMindStore } from "@/lib/store";
import { THOUGHT_COLORS } from "@/lib/types";

export default function Connections() {
  const { session } = useMindStore();
  if (!session) return null;

  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill="#a78bfa" />
        </marker>
      </defs>

      {session.connections.map((conn) => {
        const from = session.thoughts.find((t) => t.id === conn.fromId);
        const to = session.thoughts.find((t) => t.id === conn.toId);
        if (!from || !to) return null;

        const x1 = from.x + 125;
        const y1 = from.y + 36;
        const x2 = to.x + 125;
        const y2 = to.y + 36;
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2 - 40;
        const color = THOUGHT_COLORS[from.type] || "#a78bfa";

        return (
          <path
            key={conn.id}
            d={`M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeOpacity="0.55"
            filter="url(#glow)"
            markerEnd="url(#arrow)"
          />
        );
      })}
    </svg>
  );
}
