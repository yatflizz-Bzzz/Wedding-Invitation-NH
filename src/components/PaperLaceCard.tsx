import React, { useId } from 'react';
import { CardFlowerCorners, type LilyCornerVariant } from './BotanicalDecor';

interface PaperLaceCardProps {
  children: React.ReactNode;
  className?: string;
  showLilies?: boolean;
  showOvalGlow?: boolean;
  lilySize?: LilyCornerVariant;
}

/**
 * Stationery paper card inspired by Copy_of_Kad_Digital_Kahwin_1.0__1__83479da0.mp4:
 * Crisp white paper, intricate blush-pink crocheted daisy-lace border,
 * soft blush oval inner glow, and interactive watercolor pink lilies at top-right & bottom-left.
 */
export function PaperLaceCard({
  children,
  className = '',
  showLilies = true,
  showOvalGlow = true,
  lilySize = 'md',
}: PaperLaceCardProps) {
  const patternId = useId().replace(/:/g, '');

  return (
    <div
      className={`paper-lace-card relative rounded-[1.75rem] bg-[#ffffff]/96 p-5 sm:p-8 ${className}`}
    >
      {/* Intricate Blush-Pink Crocheted Daisy Lace Border Layer */}
      <div className="pointer-events-none absolute inset-[3px] overflow-hidden rounded-[1.55rem] border border-[#F4C9DC]" aria-hidden="true">
        <svg className="h-full w-full">
          <defs>
            <pattern
              id={`lace-${patternId}`}
              width="28"
              height="28"
              patternUnits="userSpaceOnUse"
            >
              {/* Delicate crocheted mesh background */}
              <rect width="28" height="28" fill="#FDF2F7" />
              <circle cx="14" cy="14" r="11" fill="none" stroke="#F7D9E7" strokeWidth="1.2" />
              {/* 8-petal daisy rosette */}
              <g transform="translate(14,14)" fill="#FFFFFF" opacity="0.92">
                <ellipse cx="0" cy="-6.5" rx="1.7" ry="4" />
                <ellipse cx="0" cy="6.5" rx="1.7" ry="4" />
                <ellipse cx="-6.5" cy="0" rx="4" ry="1.7" />
                <ellipse cx="6.5" cy="0" rx="4" ry="1.7" />
                <ellipse cx="-4.6" cy="-4.6" rx="1.6" ry="3.8" transform="rotate(-45 -4.6 -4.6)" />
                <ellipse cx="4.6" cy="4.6" rx="1.6" ry="3.8" transform="rotate(-45 4.6 4.6)" />
                <ellipse cx="4.6" cy="-4.6" rx="1.6" ry="3.8" transform="rotate(45 4.6 -4.6)" />
                <ellipse cx="-4.6" cy="4.6" rx="1.6" ry="3.8" transform="rotate(45 -4.6 4.6)" />
                <circle cx="0" cy="0" r="2.2" fill="#F6D5E4" />
              </g>
              {/* Corner crochet dots */}
              <circle cx="0" cy="0" r="2" fill="#FFFFFF" opacity="0.85" />
              <circle cx="28" cy="0" r="2" fill="#FFFFFF" opacity="0.85" />
              <circle cx="0" cy="28" r="2" fill="#FFFFFF" opacity="0.85" />
              <circle cx="28" cy="28" r="2" fill="#FFFFFF" opacity="0.85" />
            </pattern>
          </defs>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill={`url(#lace-${patternId})`}
          />
        </svg>
      </div>

      {/* Crisp White Paper Inner Sheet with Soft Blush Oval Glow */}
      <div className="relative z-10 rounded-[1.35rem] border border-[#f5d3e3]/80 bg-[#ffffff] px-5 py-7 sm:px-9 sm:py-9 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.9)] overflow-hidden">
        {showOvalGlow && (
          <div
            className="pointer-events-none absolute inset-4 sm:inset-6 rounded-[999px]"
            style={{
              background:
                'radial-gradient(ellipse at center, rgba(251, 236, 243, 0.85) 0%, rgba(253, 246, 250, 0.65) 58%, rgba(255, 255, 255, 0) 100%)',
            }}
            aria-hidden="true"
          />
        )}
        <div className="relative z-10">{children}</div>
      </div>

      {/* Interactive Watercolor Pink Lilies: Top-Right & Bottom-Left */}
      {showLilies && <CardFlowerCorners variant={lilySize} />}
    </div>
  );
}
