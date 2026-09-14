export function LaurelBranch({
  flip = false,
  className = "",
}: {
  flip?: boolean;
  className?: string;
}) {
  // A gently arcing branch (like a quarter of a wreath) rather than a
  // straight stem, with fine outlined leaves — thin line-art reads as
  // engraved and refined, where solid filled shapes read as clip-art.
  const nodes = [
    { x: 58, y: 228, len: 36, width: 12.5, angle: 66 },
    { x: 47, y: 194, len: 38, width: 13, angle: 58 },
    { x: 39, y: 158, len: 38, width: 12.5, angle: 50 },
    { x: 35, y: 122, len: 35, width: 11.5, angle: 42 },
    { x: 34, y: 88, len: 30, width: 10, angle: 33 },
    { x: 36, y: 58, len: 23, width: 7.5, angle: 24 },
    { x: 39, y: 32, len: 16, width: 5.5, angle: 14 },
  ];

  const leafPath = (len: number, width: number) =>
    `M0,0 Q${width},${-len * 0.5} 0,${-len} Q${-width},${-len * 0.5} 0,0 Z`;

  return (
    <svg
      viewBox="0 0 100 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={flip ? { transform: "scaleX(-1)" } : undefined}
      aria-hidden="true"
    >
      <path
        d="M58 228 C48 196 40 160 36 124 C34 100 34 96 34 88 C34 74 35 66 36 58 C37 46 38 40 39 32"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.6"
      />
      {nodes.map((n, i) => (
        <g key={i}>
          <g transform={`translate(${n.x}, ${n.y}) rotate(${-n.angle})`}>
            <path d={leafPath(n.len, n.width)} stroke="currentColor" strokeWidth="1.1" fill="currentColor" fillOpacity="0.08" />
            <line x1="0" y1="0" x2="0" y2={-n.len} stroke="currentColor" strokeWidth="0.75" opacity="0.55" />
          </g>
          <g transform={`translate(${n.x}, ${n.y}) rotate(${n.angle})`}>
            <path d={leafPath(n.len, n.width)} stroke="currentColor" strokeWidth="1.1" fill="currentColor" fillOpacity="0.08" />
            <line x1="0" y1="0" x2="0" y2={-n.len} stroke="currentColor" strokeWidth="0.75" opacity="0.55" />
          </g>
        </g>
      ))}
    </svg>
  );
}
