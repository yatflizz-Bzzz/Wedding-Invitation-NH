import React, { useState } from 'react';

export type LilyCornerVariant =
  | 'sm'
  | 'md'
  | 'lg'
  | 'mixedA'
  | 'mixedB'
  | 'mixedC'
  | 'mixedD';

interface CornerSpec {
  topSize: string;
  bottomSize: string;
  topAnim: string;
  bottomAnim: string;
  topDur: string;
  topDelay: string;
  bottomDur: string;
  bottomDelay: string;
}

const CORNER_VARIANTS: Record<LilyCornerVariant, CornerSpec> = {
  sm: {
    topSize: 'w-14 h-14 sm:w-20 sm:h-20',
    bottomSize: 'w-16 h-16 sm:w-22 sm:h-22',
    topAnim: 'animate-lily-sway',
    bottomAnim: 'animate-lily-float',
    topDur: '4.9s',
    topDelay: '-0.5s',
    bottomDur: '5.6s',
    bottomDelay: '-1.9s',
  },
  md: {
    topSize: 'w-20 h-20 sm:w-28 sm:h-28',
    bottomSize: 'w-16 h-16 sm:w-24 sm:h-24',
    topAnim: 'animate-lily-bloom',
    bottomAnim: 'animate-lily-twist',
    topDur: '5.2s',
    topDelay: '-1.1s',
    bottomDur: '6.1s',
    bottomDelay: '-2.6s',
  },
  lg: {
    topSize: 'w-22 h-22 sm:w-32 sm:h-32',
    bottomSize: 'w-20 h-20 sm:w-28 sm:h-28',
    topAnim: 'animate-lily-float',
    bottomAnim: 'animate-lily-bloom',
    topDur: '5.9s',
    topDelay: '-0.8s',
    bottomDur: '4.7s',
    bottomDelay: '-2.2s',
  },
  mixedA: {
    topSize: 'w-22 h-22 sm:w-30 sm:h-30',
    bottomSize: 'w-14 h-14 sm:w-20 sm:h-20',
    topAnim: 'animate-lily-sway',
    bottomAnim: 'animate-lily-bloom',
    topDur: '5.4s',
    topDelay: '-1.5s',
    bottomDur: '4.3s',
    bottomDelay: '-0.4s',
  },
  mixedB: {
    topSize: 'w-15 h-15 sm:w-22 sm:h-22',
    bottomSize: 'w-22 h-22 sm:w-30 sm:h-30',
    topAnim: 'animate-lily-twist',
    bottomAnim: 'animate-lily-float',
    topDur: '6.3s',
    topDelay: '-2.0s',
    bottomDur: '5.1s',
    bottomDelay: '-0.9s',
  },
  mixedC: {
    topSize: 'w-18 h-18 sm:w-26 sm:h-26',
    bottomSize: 'w-15 h-15 sm:w-21 sm:h-21',
    topAnim: 'animate-lily-bloom',
    bottomAnim: 'animate-lily-sway',
    topDur: '4.5s',
    topDelay: '-1.3s',
    bottomDur: '5.8s',
    bottomDelay: '-2.8s',
  },
  mixedD: {
    topSize: 'w-16 h-16 sm:w-24 sm:h-24',
    bottomSize: 'w-20 h-20 sm:w-28 sm:h-28',
    topAnim: 'animate-lily-float',
    bottomAnim: 'animate-lily-twist',
    topDur: '5.6s',
    topDelay: '-0.6s',
    bottomDur: '6.5s',
    bottomDelay: '-1.7s',
  },
};

function InteractiveCornerLily({
  positionClass,
  sizeClass,
  animClass,
  duration,
  delay,
  flipped = false,
}: {
  positionClass: string;
  sizeClass: string;
  animClass: string;
  duration: string;
  delay: string;
  flipped?: boolean;
}) {
  const [bloomCount, setBloomCount] = useState(0);

  const handleBloom = (event: React.MouseEvent) => {
    event.stopPropagation();
    setBloomCount((c) => c + 1);
  };

  return (
    <button
      type="button"
      onClick={handleBloom}
      aria-label="Sentuh bunga lili hiasan"
      className={`group/lily absolute z-20 cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b23c62] rounded-full ${positionClass} ${sizeClass}`}
    >
      <span
        className={`block h-full w-full ${animClass} transition-transform duration-300 ease-out group-hover/lily:scale-115 group-active/lily:scale-95`}
        style={
          {
            '--lily-dur': duration,
            '--lily-delay': delay,
          } as React.CSSProperties
        }
      >
        <img
          src="/assets/lily-tr.png"
          alt=""
          aria-hidden="true"
          referrerPolicy="no-referrer"
          className={`h-full w-full object-contain drop-shadow-sm transition-all duration-300 group-hover/lily:drop-shadow-[0_8px_16px_rgba(178,60,98,0.34)] ${
            flipped ? 'rotate-180' : ''
          }`}
        />
      </span>

      {/* Interactive micro-bloom petal sparkles when clicked/tapped */}
      {bloomCount > 0 && (
        <span
          key={bloomCount}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          <span
            className="absolute h-2.5 w-2.5 rounded-full bg-[#f69eb8] animate-sparkle-pop"
            style={{ '--sx': '-18px', '--sy': '-20px' } as React.CSSProperties}
          />
          <span
            className="absolute h-2 w-2 rounded-full bg-[#fceaa8] animate-sparkle-pop"
            style={{ '--sx': '18px', '--sy': '-16px' } as React.CSSProperties}
          />
          <span
            className="absolute h-2 w-2 rounded-full bg-[#e892b0] animate-sparkle-pop"
            style={{ '--sx': '4px', '--sy': '20px' } as React.CSSProperties}
          />
        </span>
      )}
    </button>
  );
}

export function CardFlowerCorners({
  variant = 'md',
}: {
  variant?: LilyCornerVariant;
}) {
  const spec = CORNER_VARIANTS[variant];
  return (
    <>
      <InteractiveCornerLily
        positionClass="-top-4 -right-4 sm:-top-6 sm:-right-6"
        sizeClass={spec.topSize}
        animClass={spec.topAnim}
        duration={spec.topDur}
        delay={spec.topDelay}
      />
      <InteractiveCornerLily
        positionClass="-bottom-4 -left-4 sm:-bottom-6 sm:-left-6"
        sizeClass={spec.bottomSize}
        animClass={spec.bottomAnim}
        duration={spec.bottomDur}
        delay={spec.bottomDelay}
        flipped
      />
    </>
  );
}

export function LilyBlossom({
  className = 'w-20 h-20',
  variant = 'pink',
}: {
  className?: string;
  variant?: 'pink' | 'yellow' | 'blush';
}) {
  const palette =
    variant === 'yellow'
      ? { outer: '#FCEB9D', mid: '#F9D876', inner: '#F4A9B8', center: '#D48A29', leaf: '#9BB97F' }
      : variant === 'blush'
        ? { outer: '#FBE2EC', mid: '#F4A9C2', inner: '#FCEB9D', center: '#B9486D', leaf: '#9EB984' }
        : { outer: '#F69EB8', mid: '#EB6D93', inner: '#FCE6A4', center: '#8F2147', leaf: '#8DAE72' };

  return (
    <svg viewBox="0 0 120 120" fill="none" className={className} aria-hidden="true">
      {/* Leaves */}
      <path d="M22 86 C10 70, 14 52, 34 56 C40 66, 34 82, 22 86 Z" fill={palette.leaf} opacity="0.82" />
      <path d="M98 84 C110 68, 104 48, 86 54 C80 65, 86 80, 98 84 Z" fill={palette.leaf} opacity="0.78" />
      <path d="M58 104 C48 92, 50 76, 62 76 C74 76, 72 92, 58 104 Z" fill={palette.leaf} opacity="0.75" />
      {/* 6 Watercolor Lily Petals */}
      <path d="M60 12 C73 24, 73 46, 60 58 C47 46, 47 24, 60 12 Z" fill={palette.outer} />
      <path d="M60 104 C73 92, 73 70, 60 58 C47 70, 47 92, 60 104 Z" fill={palette.outer} />
      <path d="M16 36 C33 34, 51 44, 58 58 C42 62, 24 52, 16 36 Z" fill={palette.mid} opacity="0.92" />
      <path d="M104 36 C87 34, 69 44, 62 58 C78 62, 96 52, 104 36 Z" fill={palette.mid} opacity="0.92" />
      <path d="M18 82 C26 66, 44 56, 58 58 C51 72, 34 84, 18 82 Z" fill={palette.outer} />
      <path d="M102 82 C94 66, 76 56, 62 58 C69 72, 86 84, 102 82 Z" fill={palette.outer} />
      {/* Soft inner highlight */}
      <circle cx="60" cy="58" r="13" fill={palette.inner} opacity="0.88" />
      {/* Stamens */}
      <path d="M60 58 L50 42 M60 58 L60 39 M60 58 L70 42 M60 58 L46 60 M60 58 L74 60" stroke={palette.center} strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="50" cy="41" r="2.2" fill="#D48A29" />
      <circle cx="60" cy="38" r="2.4" fill="#D48A29" />
      <circle cx="70" cy="41" r="2.2" fill="#D48A29" />
      <circle cx="45" cy="60" r="2" fill="#D48A29" />
      <circle cx="75" cy="60" r="2" fill="#D48A29" />
    </svg>
  );
}

export function FloralCornerCluster({
  className = 'w-32 h-32',
  flip = false,
}: {
  className?: string;
  flip?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 180 180"
      fill="none"
      className={`${className} ${flip ? '-scale-x-100' : ''}`}
      aria-hidden="true"
    >
      {/* Botanical leaves */}
      <path d="M22 145 C18 110, 40 90, 62 112 C48 134, 34 142, 22 145 Z" fill="#9EB983" opacity="0.82" />
      <path d="M52 155 C62 124, 92 118, 98 142 C82 156, 66 158, 52 155 Z" fill="#8EAD72" opacity="0.75" />
      <path d="M15 95 C38 78, 56 84, 54 106 C36 108, 24 104, 15 95 Z" fill="#B2CA98" opacity="0.8" />
      {/* Yellow buttercup blossom */}
      <g transform="translate(88, 92)">
        <circle cx="0" cy="-14" r="11" fill="#FCEB9D" />
        <circle cx="13" cy="-4" r="11" fill="#F9DF7B" />
        <circle cx="8" cy="11" r="11" fill="#FCEB9D" />
        <circle cx="-8" cy="11" r="11" fill="#F9DF7B" />
        <circle cx="-13" cy="-4" r="11" fill="#FCEB9D" />
        <circle cx="0" cy="0" r="7" fill="#E6A93B" />
      </g>
      {/* Main Pink Lily / Rose */}
      <g transform="translate(48, 58)">
        <path d="M0 -34 C14 -20, 14 0, 0 10 C-14 0, -14 -20, 0 -34 Z" fill="#F6A2BE" />
        <path d="M32 -8 C18 6, 0 6, -6 -6 C6 -18, 22 -18, 32 -8 Z" fill="#F9BDD2" />
        <path d="M-32 -8 C-18 6, 0 6, 6 -6 C-6 -18, -22 -18, -32 -8 Z" fill="#F9BDD2" />
        <path d="M22 24 C8 22, -4 10, -2 -2 C12 -2, 24 10, 22 24 Z" fill="#EE83A8" />
        <path d="M-22 24 C-8 22, 4 10, 2 -2 C-12 -2, -24 10, -22 24 Z" fill="#EE83A8" />
        <circle cx="0" cy="-2" r="9" fill="#FDF0C4" />
        <circle cx="-3" cy="-5" r="2" fill="#8C274B" />
        <circle cx="3" cy="-5" r="2" fill="#8C274B" />
        <circle cx="0" cy="2" r="2" fill="#8C274B" />
      </g>
      {/* Small Lavender/Pink Wildflower */}
      <g transform="translate(128, 42)">
        <circle cx="0" cy="-9" r="7" fill="#FAD7E3" />
        <circle cx="9" cy="-2" r="7" fill="#F5B4CA" />
        <circle cx="5" cy="8" r="7" fill="#FAD7E3" />
        <circle cx="-5" cy="8" r="7" fill="#F5B4CA" />
        <circle cx="-9" cy="-2" r="7" fill="#FAD7E3" />
        <circle cx="0" cy="0" r="4.5" fill="#FCE38A" />
      </g>
    </svg>
  );
}

export function MeadowFlowerBorder() {
  const tufts = [
    { x: 36, scale: 0.98, anim: 'animate-grass-sway-a', flower: 'pink' as const },
    { x: 102, scale: 1.08, anim: 'animate-grass-sway-b', flower: 'butter' as const },
    { x: 168, scale: 0.92, anim: 'animate-grass-sway-c', flower: 'sky' as const },
    { x: 238, scale: 1.1, anim: 'animate-grass-sway-a', flower: 'pink' as const },
    { x: 308, scale: 0.94, anim: 'animate-grass-sway-b', flower: 'none' as const },
    { x: 376, scale: 1.06, anim: 'animate-grass-sway-c', flower: 'butter' as const },
    { x: 444, scale: 1.0, anim: 'animate-grass-sway-a', flower: 'pink' as const },
    { x: 512, scale: 1.08, anim: 'animate-grass-sway-b', flower: 'sky' as const },
    { x: 580, scale: 0.92, anim: 'animate-grass-sway-c', flower: 'none' as const },
    { x: 644, scale: 1.06, anim: 'animate-grass-sway-a', flower: 'butter' as const },
    { x: 696, scale: 0.94, anim: 'animate-grass-sway-b', flower: 'pink' as const },
  ];

  return (
    <svg
      viewBox="0 0 720 150"
      fill="none"
      className="block w-full h-auto overflow-visible"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="meadow-hill-back" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#cde0b8" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#9ab87d" stopOpacity="0.45" />
        </linearGradient>
        <linearGradient id="meadow-hill-front" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a7c78a" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#7b9a65" stopOpacity="0.55" />
        </linearGradient>
      </defs>

      {/* Soft undulating meadow hills */}
      <path
        d="M0 150 L0 112 Q100 84 210 108 T430 100 T620 110 L720 96 L720 150 Z"
        fill="url(#meadow-hill-back)"
      />
      <path
        d="M0 150 L0 124 Q130 102 270 124 T530 116 T720 122 L720 150 Z"
        fill="url(#meadow-hill-front)"
      />

      {/* Lively swaying sketch grass tufts & botanical wildflowers */}
      {tufts.map((tuft) => (
        <g key={tuft.x} transform={`translate(${tuft.x}, 146) scale(${tuft.scale})`}>
          <g className={tuft.anim}>
            {/* Layered organic sketch blades of grass */}
            <path
              d="M-12 4 C-16 -22, -24 -42, -32 -56 C-21 -40, -11 -22, -7 4 Z"
              fill="#86a86d"
              opacity="0.82"
            />
            <path
              d="M-4 4 C-7 -28, -4 -52, -10 -70 C0 -52, 2 -28, 1 4 Z"
              fill="#6f9356"
              opacity="0.88"
            />
            <path
              d="M4 4 C8 -24, 18 -46, 26 -62 C18 -44, 11 -24, 8 4 Z"
              fill="#97b87d"
              opacity="0.85"
            />
            <path
              d="M11 4 C18 -14, 26 -30, 34 -40 C26 -26, 20 -12, 15 4 Z"
              fill="#7b9a65"
              opacity="0.72"
            />
            {/* Crisp hand-drawn botanical ink accent strokes */}
            <path
              d="M-8 2 C-12 -20, -18 -38, -26 -50 M-1 2 C-3 -25, -2 -46, -7 -63 M7 2 C12 -20, 18 -38, 24 -54"
              stroke="#537240"
              strokeWidth="1.35"
              strokeLinecap="round"
              opacity="0.75"
            />

            {/* Swaying blossom perched on stem */}
            {tuft.flower === 'pink' && (
              <g transform="translate(-8, -72)">
                <path
                  d="M0 -11 C4 -5, 4 -1, 0 2 C-4 -1, -4 -5, 0 -11 Z"
                  fill="#f497b6"
                  stroke="#b23c62"
                  strokeWidth="0.9"
                />
                <path
                  d="M11 -2 C5 3, 1 3, -2 0 C1 -4, 5 -4, 11 -2 Z"
                  fill="#f8bfd3"
                  stroke="#b23c62"
                  strokeWidth="0.9"
                />
                <path
                  d="M-11 -2 C-5 3, -1 3, 2 0 C-1 -4, -5 -4, -11 -2 Z"
                  fill="#f8bfd3"
                  stroke="#b23c62"
                  strokeWidth="0.9"
                />
                <path
                  d="M7 9 C2 8, -2 4, 0 0 C4 1, 8 4, 7 9 Z"
                  fill="#ea7fa4"
                  stroke="#b23c62"
                  strokeWidth="0.9"
                />
                <path
                  d="M-7 9 C-2 8, 2 4, 0 0 C-4 1, -8 4, -7 9 Z"
                  fill="#ea7fa4"
                  stroke="#b23c62"
                  strokeWidth="0.9"
                />
                <circle cx="0" cy="-1" r="3" fill="#fce89f" stroke="#8c5a18" strokeWidth="0.7" />
              </g>
            )}

            {tuft.flower === 'butter' && (
              <g transform="translate(22, -62)">
                <ellipse cx="0" cy="-7" rx="3.2" ry="6" fill="#fef4c7" stroke="#c88d32" strokeWidth="0.8" />
                <ellipse cx="6.5" cy="-2" rx="6" ry="3.2" fill="#fce698" stroke="#c88d32" strokeWidth="0.8" />
                <ellipse cx="-6.5" cy="-2" rx="6" ry="3.2" fill="#fce698" stroke="#c88d32" strokeWidth="0.8" />
                <ellipse cx="4.5" cy="5.5" rx="3.5" ry="5.5" transform="rotate(-35 4.5 5.5)" fill="#fef4c7" stroke="#c88d32" strokeWidth="0.8" />
                <ellipse cx="-4.5" cy="5.5" rx="3.5" ry="5.5" transform="rotate(35 -4.5 5.5)" fill="#fef4c7" stroke="#c88d32" strokeWidth="0.8" />
                <circle cx="0" cy="-1" r="3.2" fill="#e29a3b" />
              </g>
            )}

            {tuft.flower === 'sky' && (
              <g transform="translate(4, -58)">
                <circle cx="0" cy="-5" r="3.8" fill="#cfe2f7" stroke="#5d83b5" strokeWidth="0.8" />
                <circle cx="5" cy="-1" r="3.8" fill="#b7d2f2" stroke="#5d83b5" strokeWidth="0.8" />
                <circle cx="3" cy="5" r="3.8" fill="#cfe2f7" stroke="#5d83b5" strokeWidth="0.8" />
                <circle cx="-3" cy="5" r="3.8" fill="#b7d2f2" stroke="#5d83b5" strokeWidth="0.8" />
                <circle cx="-5" cy="-1" r="3.8" fill="#cfe2f7" stroke="#5d83b5" strokeWidth="0.8" />
                <circle cx="0" cy="0" r="2.2" fill="#fceaa8" />
              </g>
            )}
          </g>
        </g>
      ))}

      {/* Small lively pastel butterfly hovering above the swaying grass */}
      <g transform="translate(362, 34)" className="animate-meadow-flutter">
        <g className="animate-wing">
          <path d="M-1 0 C-10 -12, -20 -8, -14 2 C-11 6, -4 5, -1 1 Z" fill="#f69eb8" opacity="0.92" />
          <path d="M1 0 C10 -12, 20 -8, 14 2 C11 6, 4 5, 1 1 Z" fill="#f69eb8" opacity="0.92" />
          <path d="M-1 2 C-8 4, -12 11, -6 14 C-2 15, -1 8, -1 2 Z" fill="#fceaa8" opacity="0.9" />
          <path d="M1 2 C8 4, 12 11, 6 14 C2 15, 1 8, 1 2 Z" fill="#fceaa8" opacity="0.9" />
        </g>
        <ellipse cx="0" cy="4" rx="1.2" ry="5.5" fill="#6b1d3a" />
      </g>
    </svg>
  );
}

export function WatercolorButterfly({
  className = 'w-14 h-14',
  tone = 'pink',
}: {
  className?: string;
  tone?: 'pink' | 'yellow';
}) {
  const fillTop = tone === 'yellow' ? '#FCEAA8' : '#F59BB9';
  const fillBottom = tone === 'yellow' ? '#F7D277' : '#E7789D';
  const accent = tone === 'yellow' ? '#E29E4B' : '#8C274B';

  return (
    <svg viewBox="0 0 80 80" fill="none" className={className} aria-hidden="true">
      <g className="animate-wing">
        {/* Left wings */}
        <path d="M39 38 C24 14, 6 20, 12 38 C16 46, 30 44, 39 40 Z" fill={fillTop} opacity="0.92" />
        <path d="M39 42 C24 44, 14 58, 24 64 C32 68, 38 56, 39 42 Z" fill={fillBottom} opacity="0.9" />
        {/* Right wings */}
        <path d="M41 38 C56 14, 74 20, 68 38 C64 46, 50 44, 41 40 Z" fill={fillTop} opacity="0.92" />
        <path d="M41 42 C56 44, 66 58, 56 64 C48 68, 42 56, 41 42 Z" fill={fillBottom} opacity="0.9" />
        {/* Wing dots */}
        <circle cx="21" cy="33" r="3" fill="#FFFDF7" opacity="0.7" />
        <circle cx="59" cy="33" r="3" fill="#FFFDF7" opacity="0.7" />
      </g>
      {/* Body & antennae */}
      <ellipse cx="40" cy="43" rx="2.4" ry="12" fill={accent} />
      <path d="M39 31 C36 23, 32 20, 29 21 M41 31 C44 23, 48 20, 51 21" stroke={accent} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function HeartWaxSeal({
  className = 'w-28 h-28',
}: {
  className?: string;
  monogram?: string;
}) {
  return (
    <img
      src="/assets/heart-seal.png"
      alt=""
      aria-hidden="true"
      referrerPolicy="no-referrer"
      className={`object-contain ${className}`}
    />
  );
}

export function SwirledMonogram({ className = 'w-14 h-16' }: { className?: string }) {
  return (
    <img
      src="/assets/hn-monogram.png"
      alt=""
      aria-hidden="true"
      referrerPolicy="no-referrer"
      className={`object-contain ${className}`}
    />
  );
}

export function SwanPairMotif({ className = 'w-20 h-14' }: { className?: string }) {
  return (
    <img
      src="/assets/swan-pair.png"
      alt=""
      aria-hidden="true"
      referrerPolicy="no-referrer"
      className={`object-contain ${className}`}
    />
  );
}

export function RibbonDovesMotif({ className = 'w-28 h-16' }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 80" fill="none" className={className} aria-hidden="true">
      {/* Left Dove */}
      <path
        d="M22 44 C12 34, 18 16, 34 24 C42 28, 48 36, 56 34 C60 32, 65 36, 62 42 C58 48, 44 52, 32 48 Z"
        fill="#E5EFFB"
        stroke="#7B9BC9"
        strokeWidth="1.8"
      />
      {/* Right Dove */}
      <path
        d="M138 44 C148 34, 142 16, 126 24 C118 28, 112 36, 104 34 C100 32, 95 36, 98 42 C102 48, 116 52, 128 48 Z"
        fill="#E5EFFB"
        stroke="#7B9BC9"
        strokeWidth="1.8"
      />
      {/* Blue Ribbon Bow */}
      <path d="M62 40 Q80 48 98 40" stroke="#7B9BC9" strokeWidth="2.4" fill="none" />
      <path d="M80 44 C70 36, 64 44, 74 50 L80 44 L86 50 C96 44, 90 36, 80 44 Z" fill="#9DC0EA" stroke="#6889BA" strokeWidth="1.4" />
      <path d="M77 48 L72 62 M83 48 L88 62" stroke="#6889BA" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function TwoCatsIllustration({ className = 'w-40 h-28' }: { className?: string }) {
  return (
    <img
      src="/assets/wedding-cats.png"
      alt=""
      aria-hidden="true"
      referrerPolicy="no-referrer"
      className={`object-contain ${className}`}
    />
  );
}

export function WeddingCarIllustration({ className = 'w-32 sm:w-36 h-auto' }: { className?: string }) {
  const ink = '#2d1c23';
  return (
    <svg viewBox="0 0 220 190" fill="none" className={className} aria-hidden="true">
      {/* Three wavy strings converging cleanly behind right deck */}
      <path d="M132 98 C135 78, 146 60, 144 42" stroke={ink} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M133 98 C146 82, 155 66, 165 53" stroke={ink} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M134 99 C153 90, 168 81, 179 73" stroke={ink} strokeWidth="1.5" strokeLinecap="round" />

      {/* Three floating heart balloons on top right (transparent) */}
      <g transform="translate(144, 29) rotate(-4)">
        <path
          d="M0 13 C-10 6, -15 -2, -10 -9 C-6 -14, -1 -11, 0 -6 C1 -11, 6 -14, 10 -9 C15 -2, 10 6, 0 13 Z"
          fill="none"
          stroke={ink}
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </g>
      <g transform="translate(166, 42) rotate(12)">
        <path
          d="M0 11.5 C-9 5, -13 -2, -8.5 -8 C-5 -12.5, -1 -9.5, 0 -5 C1 -9.5, 5 -12.5, 8.5 -8 C13 -2, 9 5, 0 11.5 Z"
          fill="none"
          stroke={ink}
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </g>
      <g transform="translate(182, 62) rotate(24)">
        <path
          d="M0 10.5 C-8 4.5, -12 -2, -8 -7.5 C-4.5 -11.5, -0.8 -8.5, 0 -4.5 C0.8 -8.5, 4.5 -11.5, 8 -7.5 C12 -2, 8 4.5, 0 10.5 Z"
          fill="none"
          stroke={ink}
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </g>

      {/* Rear Tires peeking cleanly beneath bumper */}
      <path d="M29 158 L29 169 C29 175, 48 175, 48 169 L48 158 Z" fill={ink} />
      <path d="M138 158 L138 169 C138 175, 157 175, 157 169 L157 158 Z" fill={ink} />

      {/* Windshield Frame + Couple Silhouettes (transparent) */}
      <path
        d="M51 98 L56 76 C58 70, 64 68, 93 68 C122 68, 128 70, 130 76 L135 98"
        fill="none"
        stroke={ink}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M56 96 L60 79 C61 74, 66 73, 93 73 C120 73, 125 74, 126 79 L130 96"
        stroke={ink}
        strokeWidth="1.2"
      />
      {/* Rearview mirror */}
      <rect x="88" y="75" width="10" height="4.5" rx="2" fill="none" stroke={ink} strokeWidth="1.2" />
      {/* Bride silhouette (left) */}
      <path
        d="M66 96 C66 91, 68 88.5, 72 88.5 C76 88.5, 77 91, 77 95"
        fill="none"
        stroke={ink}
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <circle cx="72" cy="83" r="5.2" fill="none" stroke={ink} strokeWidth="1.4" />
      {/* Groom silhouette (right) */}
      <path
        d="M101 96 C102 91, 106 88, 111 88 C116 88, 119 91, 120 96"
        fill="none"
        stroke={ink}
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <circle cx="111" cy="82.5" r="5.2" fill="none" stroke={ink} strokeWidth="1.4" />
      {/* Convertible top rim */}
      <path
        d="M44 102 C56 95, 130 95, 142 102"
        stroke={ink}
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      {/* Main Vintage Convertible Body (Rear View, transparent) */}
      <path
        d="M24 146 C22 126, 30 106, 48 100 C66 95, 120 95, 138 100 C156 106, 164 126, 162 146 C162 149.5, 152 151, 93 151 C34 151, 24 149.5, 24 146 Z"
        fill="none"
        stroke={ink}
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* Trunk Panel Seam */}
      <path
        d="M42 114 C40 132, 46 144, 93 144 C140 144, 146 132, 144 114"
        stroke={ink}
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M45 106 C64 101, 122 101, 141 106"
        stroke={ink}
        strokeWidth="1.2"
        strokeLinecap="round"
      />

      {/* Tall Oval Taillights on outer fenders (transparent) */}
      <ellipse cx="32" cy="133" rx="4.2" ry="9.5" fill="none" stroke={ink} strokeWidth="1.4" />
      <path d="M28.5 130 L35.5 130 M28.5 136 L35.5 136" stroke={ink} strokeWidth="1.1" />
      <ellipse cx="154" cy="133" rx="4.2" ry="9.5" fill="none" stroke={ink} strokeWidth="1.4" />
      <path d="M150.5 130 L157.5 130 M150.5 136 L157.5 136" stroke={ink} strokeWidth="1.1" />

      {/* Big Pleated Wedding Ribbon Bow on Trunk (transparent) */}
      <g transform="translate(93, 120)">
        {/* Left & Right Bow Loops */}
        <path
          d="M-4 -1.5 C-14 -12, -28 -11, -26 0 C-25 8, -12 8, -4 1.5"
          fill="none"
          stroke={ink}
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path d="M-21 -3 Q-12 -1 -5 0" stroke={ink} strokeWidth="1.1" strokeLinecap="round" />
        <path
          d="M4 -1.5 C14 -12, 28 -11, 26 0 C25 8, 12 8, 4 1.5"
          fill="none"
          stroke={ink}
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path d="M21 -3 Q12 -1 5 0" stroke={ink} strokeWidth="1.1" strokeLinecap="round" />
        {/* Trailing Ribbon Tails */}
        <path
          d="M-3 3 L-18 19 L-10 18 L-6 23 L-1 4"
          fill="none"
          stroke={ink}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M3 3 L18 19 L10 18 L6 23 L1 4"
          fill="none"
          stroke={ink}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* Center Bow Knot */}
        <circle cx="0" cy="0" r="4" fill="none" stroke={ink} strokeWidth="1.6" />
      </g>

      {/* Chrome Rear Bumper & Twin Overrider Guards (transparent) */}
      <path
        d="M19 154 C19 151, 26 151, 93 151 C160 151, 167 151, 167 154 C167 158, 160 159, 93 159 C26 159, 19 158, 19 154 Z"
        fill="none"
        stroke={ink}
        strokeWidth="1.8"
      />
      <rect x="52" y="151" width="6.5" height="8" rx="2.5" fill="none" stroke={ink} strokeWidth="1.5" />
      <rect x="127.5" y="151" width="6.5" height="8" rx="2.5" fill="none" stroke={ink} strokeWidth="1.5" />
    </svg>
  );
}
