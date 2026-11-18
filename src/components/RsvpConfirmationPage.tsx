import React from 'react';
import {
  CalendarPlus,
  Check,
  ExternalLink,
  Heart,
  Sparkles,
} from 'lucide-react';
import {
  CardFlowerCorners,
  TwoCatsIllustration,
} from './BotanicalDecor';
import { WEDDING_DETAILS } from '../data/weddingData';
import { buildIcsContent } from '../utils/wedding';

interface RsvpConfirmationPageProps {
  guestName?: string;
  attendance?: 'hadir' | 'tidak_hadir' | string;
  onBackToInvitation?: () => void;
}

const FIREWORK_BURSTS = [
  { top: '7%', left: '14%', delay: '0s', scale: 0.9, color: '#d46f94' },
  { top: '9%', right: '14%', delay: '0.75s', scale: 0.95, color: '#d9a441' },
  { top: '24%', left: '8%', delay: '1.5s', scale: 0.78, color: '#e38aae' },
  { top: '23%', right: '8%', delay: '2.15s', scale: 0.82, color: '#c45b82' },
  { top: '4%', left: '50%', delay: '1.1s', scale: 0.72, color: '#e0b152' },
];

const SPARK_ANGLES = [0, 36, 72, 108, 144, 180, 216, 252, 288, 324];

function CuteMiniFireworks() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden z-20"
    >
      {FIREWORK_BURSTS.map((burst, bIdx) => (
        <div
          key={bIdx}
          className="absolute w-14 h-14 -translate-x-1/2 -translate-y-1/2"
          style={{
            top: burst.top,
            left: burst.left,
            right: burst.right,
            transform: `translate(-50%, -50%) scale(${burst.scale})`,
          }}
        >
          {/* Center cute dot */}
          <span
            className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full animate-fw-core"
            style={{
              backgroundColor: burst.color,
              boxShadow: `0 0 8px ${burst.color}`,
              animationDelay: burst.delay,
            }}
          />

          {/* Radiating cute sparks */}
          {SPARK_ANGLES.map((angle) => (
            <span
              key={angle}
              className="absolute left-1/2 top-1/2 origin-bottom"
              style={{
                transform: `translate(-50%, -100%) rotate(${angle}deg)`,
              }}
            >
              <span
                className="block w-[2.5px] h-2.5 rounded-full animate-fw-spark"
                style={{
                  backgroundColor: burst.color,
                  boxShadow: `0 0 6px ${burst.color}`,
                  animationDelay: burst.delay,
                }}
              />
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

export function RsvpConfirmationPage({
  guestName,
  attendance,
  onBackToInvitation,
}: RsvpConfirmationPageProps) {
  const isNotAttending =
    attendance === 'tidak_hadir' ||
    attendance?.toLowerCase().includes('tidak');

  const handleDownloadIcs = () => {
    const ics = buildIcsContent();
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'Nabilah-Hidayat-Wedding.ics';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
  };

  return (
    <section
      aria-labelledby="rsvp-thankyou-heading"
      className="mx-auto max-w-[480px] px-4 py-6 sm:py-10"
    >
      <style>{`
        @keyframes fwCore {
          0%, 100% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.2);
          }
          20% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.2);
          }
          55% {
            opacity: 0.7;
            transform: translate(-50%, -50%) scale(0.6);
          }
          75% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0);
          }
        }

        @keyframes fwSpark {
          0% {
            opacity: 0;
            transform: translateY(4px) scaleY(0.3);
          }
          25% {
            opacity: 1;
            transform: translateY(-6px) scaleY(1.15);
          }
          65% {
            opacity: 0.85;
            transform: translateY(-16px) scaleY(0.75);
          }
          100% {
            opacity: 0;
            transform: translateY(-22px) scaleY(0.2);
          }
        }

        @keyframes thankYouPop {
          0% {
            opacity: 0;
            transform: translateY(14px) scale(0.92);
          }
          60% {
            opacity: 1;
            transform: translateY(-3px) scale(1.03);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes fadeUpSoft {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes gentleFloat {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-4px);
          }
        }

        .animate-fw-core {
          animation: fwCore 2.8s ease-out infinite;
        }

        .animate-fw-spark {
          animation: fwSpark 2.8s cubic-bezier(0.22, 1, 0.36, 1) infinite;
        }

        .animate-thankyou-pop {
          animation: thankYouPop 0.85s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .animate-fade-up-1 {
          animation: fadeUpSoft 0.75s cubic-bezier(0.22, 1, 0.36, 1) 0.25s both;
        }

        .animate-fade-up-2 {
          animation: fadeUpSoft 0.75s cubic-bezier(0.22, 1, 0.36, 1) 0.45s both;
        }

        .animate-gentle-float {
          animation: gentleFloat 3.2s ease-in-out infinite;
        }
      `}</style>

      {/* Card Design matching Section 2 */}
      <div className="paper-baru-rose-card relative mx-auto w-full aspect-[945/1377] px-7 pt-7 pb-9 sm:px-13 sm:pt-12 sm:pb-14 text-center flex flex-col justify-center">
        <CardFlowerCorners variant="lg" />
        <CuteMiniFireworks />

        <div className="relative z-10 mx-auto w-full max-w-md my-auto">
          {/* Animated Heading */}
          <div className="animate-thankyou-pop">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[#f2c8da] bg-[#fdf4f8]/90 px-3 py-1 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.14em] text-[#b23c62] mb-1.5 shadow-2xs">
              <Sparkles className="h-3 w-3 animate-pulse" />
              <span>RSVP Berjaya Disahkan</span>
              <Sparkles className="h-3 w-3 animate-pulse" />
            </div>

            <h1
              id="rsvp-thankyou-heading"
              className="font-script text-[32px] sm:text-[42px] text-[#4e1228] leading-tight animate-gentle-float"
            >
              Terima Kasih
            </h1>
            <p className="font-display text-xs sm:text-sm font-semibold uppercase tracking-[0.14em] text-[#b23c62] -mt-0.5">
              Atas Maklum Balas Anda
            </p>
          </div>

          {/* Ribbon Doves Motif (from Section 2) */}
          <div className="flex justify-center my-1.5 sm:my-2.5 animate-fade-up-1">
            <img
              src="/assets/ribbon-doves.png"
              alt=""
              aria-hidden="true"
              referrerPolicy="no-referrer"
              className="w-22 sm:w-36 h-auto object-contain"
            />
          </div>

          {/* Bride & Groom Names */}
          <h2 className="font-hero-swash text-[20px] sm:text-[26px] font-bold tracking-[0.06em] uppercase text-[#4e1228] leading-[1.1] flex flex-col items-center gap-0.5 animate-fade-up-1">
            <span className="block">{WEDDING_DETAILS.bride}</span>
            <span className="block">&amp;</span>
            <span className="block">{WEDDING_DETAILS.groom}</span>
          </h2>

          {/* Inner Gradient Panel (matching Section 2's Countdown Panel style) */}
          <div className="mt-2.5 sm:mt-4 mx-auto max-w-xs sm:max-w-sm rounded-2xl sm:rounded-3xl border border-[#f2c8da] bg-gradient-to-br from-[#fdf4f8] via-[#ffffff] to-[#fdf6df] px-4 py-3 sm:px-5 sm:py-4 shadow-xs animate-fade-up-2">
            <div className="mx-auto mb-1.5 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-[#6b1d3a] text-[#fffdf7] shadow-xs">
              <Check className="h-4 w-4" />
            </div>

            {guestName && (
              <p className="font-display text-xs sm:text-sm font-bold text-[#4e1228] mb-0.5">
                {guestName}
              </p>
            )}

            <p className="text-[12px] sm:text-[13.5px] text-[#4e1228] leading-relaxed">
              {isNotAttending
                ? 'Rekod maklum balas anda telah disimpan. Terima kasih atas ingatan dan doa restu buat kami berdua.'
                : 'Rekod kehadiran anda telah berjaya disimpan. Kami amat menantikan kehadiran anda untuk menyerikan hari bahagia kami.'}
            </p>

            <div className="mt-2 pt-2 border-t border-[#f2c8da]/70">
              <p className="font-display text-[11px] sm:text-xs font-semibold text-[#4e1228] tracking-wider uppercase">
                Ahad, 27 Disember 2026
              </p>
              <p className="text-[11px] sm:text-xs font-medium text-[#b23c62] uppercase tracking-wide">
                {WEDDING_DETAILS.venueTitle}
              </p>
            </div>

            <div className="mt-1.5 sm:mt-2.5 flex justify-center">
              <TwoCatsIllustration className="w-18 h-11 sm:w-28 sm:h-18" />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-2.5 sm:mt-4 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 animate-fade-up-2">
            {!isNotAttending && (
              <>
                <button
                  type="button"
                  onClick={handleDownloadIcs}
                  className="btn-butter-silk inline-flex items-center gap-1.5 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-semibold text-[#4e1228] transition-all duration-200 active:scale-95 cursor-pointer"
                >
                  <CalendarPlus className="h-3.5 w-3.5" />
                  <span>Simpan Kalendar (.ics)</span>
                </button>
                <a
                  href={WEDDING_DETAILS.googleCalendarUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-ivory-silk inline-flex items-center gap-1.5 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-semibold text-[#591d36] transition-all duration-200 active:scale-95"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Google Calendar</span>
                </a>
              </>
            )}

            {onBackToInvitation && (
              <button
                type="button"
                onClick={onBackToInvitation}
                className="btn-plum-silk inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 sm:py-2 text-xs font-semibold text-[#fffdf7] transition-all duration-200 active:scale-95 cursor-pointer"
              >
                <Heart className="h-3.5 w-3.5 fill-current" />
                <span>Kembali ke Jemputan</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}