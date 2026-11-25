import React from 'react';
import { CardFlowerCorners, type LilyCornerVariant } from './BotanicalDecor';

interface PaperLaceCardProps {
  children: React.ReactNode;
  className?: string;
  showLilies?: boolean;
  showOvalGlow?: boolean;
  lilySize?: LilyCornerVariant;
}

export function PaperLaceCard({
  children,
  className = '',
  showLilies = true,
  showOvalGlow = true,
  lilySize = 'md',
}: PaperLaceCardProps) {
  return (
    <div
      className={`paper-lace-card relative rounded-[1.75rem] bg-[#ffffff]/96 p-5 sm:p-8 ${className}`}
    >
      {/* Bingkai Renda Ringan (CSS tanpa SVG berat supaya kad panjang di Admin tidak tersekat) */}
      <div
        className="pointer-events-none absolute inset-[3px] rounded-[1.55rem] border border-[#F4C9DC] bg-[#FDF2F7]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 14px 14px, rgba(255,255,255,0.92) 4px, transparent 5px), radial-gradient(circle at 14px 14px, transparent 9px, rgba(247,217,231,0.75) 10px, transparent 11px)',
          backgroundSize: '28px 28px',
        }}
        aria-hidden="true"
      />

      {/* Lembaran Kertas Dalam */}
      <div className="relative z-10 rounded-[1.35rem] border border-[#f5d3e3]/80 bg-[#ffffff] px-5 py-7 sm:px-9 sm:py-9 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.9)] overflow-x-clip">
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

      {/* Hiasan Bunga Lili */}
      {showLilies && <CardFlowerCorners variant={lilySize} />}
    </div>
  );
}
