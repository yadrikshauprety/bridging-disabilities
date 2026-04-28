/**
 * Hand-drawn, graffiti-style safe-feeling background for the landing page.
 * Soft hearts, sun rays, helping hands, bridges, sign-language gesture,
 * and braille dots — drawn as inline SVG so it scales crisp + is themeable.
 */
export function GraffitiBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.35]"
        viewBox="0 0 1200 900"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="rough">
            <feTurbulence baseFrequency="0.9" numOctaves="2" seed="3" />
            <feDisplacementMap in="SourceGraphic" scale="1.6" />
          </filter>
          <pattern id="dots" x="0" y="0" width="22" height="22" patternUnits="userSpaceOnUse">
            <circle cx="3" cy="3" r="1.6" fill="currentColor" />
          </pattern>
        </defs>

        {/* Soft sun in the corner */}
        <g style={{ color: "var(--warm)" }} filter="url(#rough)">
          <circle cx="120" cy="120" r="70" fill="currentColor" opacity="0.6" />
          {Array.from({ length: 12 }).map((_, i) => {
            const a = (i / 12) * Math.PI * 2;
            const x1 = 120 + Math.cos(a) * 90;
            const y1 = 120 + Math.sin(a) * 90;
            const x2 = 120 + Math.cos(a) * 130;
            const y2 = 120 + Math.sin(a) * 130;
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeWidth="6" strokeLinecap="round" />;
          })}
        </g>

        {/* Bridge silhouette */}
        <g style={{ color: "var(--primary)" }} filter="url(#rough)" opacity="0.55">
          <path d="M 60 720 Q 600 480 1140 720" stroke="currentColor" strokeWidth="10" fill="none" strokeLinecap="round" />
          <path d="M 60 720 L 60 820 M 1140 720 L 1140 820" stroke="currentColor" strokeWidth="10" strokeLinecap="round" />
          {Array.from({ length: 9 }).map((_, i) => {
            const x = 120 + i * 120;
            const y = 720 - Math.sin(((x - 60) / 1080) * Math.PI) * 240;
            return <line key={i} x1={x} y1={y} x2={x} y2={820} stroke="currentColor" strokeWidth="5" strokeLinecap="round" />;
          })}
        </g>

        {/* Hearts */}
        {[
          { x: 320, y: 200, s: 1.4, c: "var(--accent)" },
          { x: 980, y: 280, s: 1.0, c: "var(--accent)" },
          { x: 220, y: 560, s: 0.9, c: "var(--warm)" },
          { x: 880, y: 600, s: 1.2, c: "var(--accent)" },
        ].map((h, i) => (
          <g key={i} transform={`translate(${h.x} ${h.y}) scale(${h.s})`} style={{ color: h.c }} filter="url(#rough)">
            <path
              d="M0 18 C -22 -8 -50 12 0 48 C 50 12 22 -8 0 18 Z"
              fill="currentColor"
              opacity="0.7"
            />
            <path
              d="M0 18 C -22 -8 -50 12 0 48 C 50 12 22 -8 0 18 Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
          </g>
        ))}

        {/* ILY (I Love You) hand sign — stylised */}
        <g transform="translate(720 140)" style={{ color: "var(--primary)" }} filter="url(#rough)" opacity="0.7">
          <path d="M0 80 Q -10 30 10 10 L 30 10 L 30 60 L 50 60 L 50 -10 L 70 -10 L 70 60 L 90 60 L 90 30 L 110 30 L 110 90 Q 90 130 40 130 Z"
            fill="none" stroke="currentColor" strokeWidth="5" strokeLinejoin="round" />
        </g>

        {/* Open helping hand */}
        <g transform="translate(80 480) rotate(-15)" style={{ color: "var(--success)" }} filter="url(#rough)" opacity="0.55">
          <path d="M0 60 L 10 0 L 25 0 L 22 50 L 35 50 L 38 -10 L 53 -10 L 50 50 L 63 50 L 66 0 L 81 0 L 78 50 L 91 50 L 94 20 L 109 20 L 105 80 Q 80 130 30 120 Z"
            fill="none" stroke="currentColor" strokeWidth="5" strokeLinejoin="round" />
        </g>

        {/* Wheelchair glyph */}
        <g transform="translate(1020 460)" style={{ color: "var(--primary-glow)" }} filter="url(#rough)" opacity="0.55">
          <circle cx="0" cy="40" r="34" fill="none" stroke="currentColor" strokeWidth="5" />
          <circle cx="0" cy="40" r="10" fill="currentColor" />
          <circle cx="0" cy="-30" r="10" fill="currentColor" />
          <path d="M 0 -20 L 0 20 L 28 20 L 36 50" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" />
          <path d="M -6 6 L 22 6" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
        </g>

        {/* Braille dot field */}
        <g transform="translate(440 760)" style={{ color: "var(--primary)" }} opacity="0.45">
          <rect width="320" height="60" fill="url(#dots)" />
        </g>

        {/* Hand-written word "safe" */}
        <g transform="translate(540 380)" style={{ color: "var(--accent)" }} filter="url(#rough)" opacity="0.55">
          <path d="M 0 0 q 30 -30 60 0 t 60 0 m -30 -10 l 0 30 m 60 -20 q -20 -20 -40 0 t 40 20 t -40 20 m 60 -40 l 20 -20 l 20 40 m -34 -14 l 30 0 m 30 -10 l 0 30 m 0 -30 l 30 0 m -30 14 l 22 0"
            stroke="currentColor" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>

        {/* Stars / sparkles */}
        {[
          [180, 280], [420, 120], [860, 80], [1080, 220], [380, 700], [760, 720], [600, 240]
        ].map(([x, y], i) => (
          <g key={i} transform={`translate(${x} ${y})`} style={{ color: "var(--warm)" }} opacity="0.7">
            <path d="M0 -10 L 3 -3 L 10 0 L 3 3 L 0 10 L -3 3 L -10 0 L -3 -3 Z" fill="currentColor" />
          </g>
        ))}
      </svg>
    </div>
  );
}
