import React from 'react';
import {
  CalendarPlus,
  Check,
  Database,
  ExternalLink,
  Heart,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import {
  CardFlowerCorners,
  TwoCatsIllustration,
} from './BotanicalDecor';
import { WEDDING_DETAILS } from '../data/weddingData';
import { buildIcsContent, type RsvpRecord } from '../utils/wedding';

interface RsvpConfirmationPageProps {
  record: RsvpRecord;
  onBackToInvitation: () => void;
  onSubmitAnother: () => void;
}

const FIREWORK_BURSTS = [
  { top: '8%', left: '15%', delay: '0s', scale: 0.95, color: '#d46f94' },
  { top: '9%', left: '85%', delay: '0.65s', scale: 1.0, color: '#d9a441' },
  { top: '24%', left: '10%', delay: '1.3s', scale: 0.82, color: '#b23c62' },
  { top: '23%', left: '90%', delay: '1.95s', scale: 0.85, color: '#e0a93b' },
  { top: '5%', left: '50%', delay: '1.0s', scale: 0.78, color: '#e37ca3' },
  { top: '42%', left: '8%', delay: '2.4s', scale: 0.72, color: '#d9a441' },
  { top: '41%', left: '92%', delay: '1.65s', scale: 0.72, color: '#d46f94' },
];

const SPARK_ANGLES = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];

function CuteMiniFireworks() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden z-20"
    >
      {FIREWORK_BURSTS.map((burst, bIdx) => (
        <div
          key={bIdx}
          className="absolute w-16 h-16"
          style={{
            top: burst.top,
            left: burst.left,
            transform: `translate(-50%, -50%) scale(${burst.scale})`,
          }}
        >
          {/* Titik tengah bunga api */}
          <span
            className="absolute left-1/2 top-1/2 h-2.5 w-2.5 rounded-full animate-fw-core"
            style={{
              backgroundColor: burst.color,
              boxShadow: `0 0 10px ${burst.color}, 0 0 18px ${burst.color}`,
              animationDelay: burst.delay,
            }}
          />

          {/* Percikan kecil mengelilingi bunga api */}
          {SPARK_ANGLES.map((angle, sIdx) => (
            <span
              key={angle}
              className="absolute left-1/2 top-1/2 origin-bottom"
              style={{
                transform: `translate(-50%, -100%) rotate(${angle}deg)`,
              }}
            >
              <span
                className={`block rounded-full animate-fw-spark ${
                  sIdx % 2 === 0 ? 'w-[3px] h-3' : 'w-[2px] h-2'
                }`}
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
  record,
  onBackToInvitation,
  onSubmitAnother,
}: RsvpConfirmationPageProps) {
  const isAttending = record.status === 'attending';

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
      className="mx-auto max-w-[480px] px-4 py-8 sm:py-12"
    >
      <style>{`
        @keyframes fwCore {
          0%, 100% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.2);
          }
          18% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.25);
          }
          55% {
            opacity: 0.75;
            transform: translate(-50%, -50%) scale(0.65);
          }
          78% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0);
          }
        }

        @keyframes fwSpark {
          0% {
            opacity: 0;
            transform: translateY(4px) scaleY(0.3);
          }
          22% {
            opacity: 1;
            transform: translateY(-7px) scaleY(1.2);
          }
          65% {
            opacity: 0.9;
            transform: translateY(-18px) scaleY(0.8);
          }
          100% {
            opacity: 0;
            transform: translateY(-25px) scaleY(0.2);
          }
        }

        @keyframes thankYouPop {
          0% {
            opacity: 0;
            transform: translateY(16px) scale(0.9);
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
          animation: fwCore 2.7s ease-out infinite;
        }

        .animate-fw-spark {
          animation: fwSpark 2.7s cubic-bezier(0.22, 1, 0.36, 1) infinite;
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
          animation: gentleFloat 3s ease-in-out infinite;
        }
      `}</style>

      {/* Reka bentuk kad mengikut Section 2 */}
      <div className="paper-baru-rose-card relative mx-auto w-full aspect-[945/1377] px-7 pt-7 pb-9 sm:px-13 sm:pt-12 sm:pb-14 text-center flex flex-col justify-center">
        <CardFlowerCorners variant="lg" />
        <CuteMiniFireworks />

        <div className="relative z-10 mx-auto w-full max-w-md my-auto">
          {/* Animasi Tajuk Terima Kasih Atas Maklum Balas */}
          <div className="animate-thankyou-pop">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[#f2c8da] bg-[#fdf4f8]/95 px-3 py-0.5 text-[10.5px] sm:text-xs font-semibold uppercase tracking-[0.14em] text-[#b23c62] mb-1 shadow-2xs">
              <Sparkles className="h-3 w-3 animate-pulse" />
              <span>RSVP Berjaya Disahkan</span>
              <Sparkles className="h-3 w-3 animate-pulse" />
            </div>

            <h1
              id="rsvp-thankyou-heading"
              className="font-script text-[30px] sm:text-[42px] text-[#4e1228] leading-tight animate-gentle-float"
            >
              Terima Kasih
            </h1>
            <p className="font-display text-[11px] sm:text-sm font-bold uppercase tracking-[0.15em] text-[#b23c62] -mt-0.5">
              Atas Maklum Balas Anda
            </p>
          </div>

          {/* Motif Ribbon Doves (dari Section 2) */}
          <div className="flex justify-center my-1 sm:my-2.5 animate-fade-up-1">
            <img
              src="/assets/ribbon-doves.png"
              alt=""
              aria-hidden="true"
              referrerPolicy="no-referrer"
              className="w-20 sm:w-36 h-auto object-contain"
            />
          </div>

          {/* Nama Pengantin */}
          <h2 className="font-hero-swash text-[19px] sm:text-[26px] font-bold tracking-[0.06em] uppercase text-[#4e1228] leading-[1.1] flex flex-col items-center gap-0.5 animate-fade-up-1">
            <span className="block">{WEDDING_DETAILS.bride}</span>
            <span className="block">&amp;</span>
            <span className="block">{WEDDING_DETAILS.groom}</span>
          </h2>

          {/* Kotak Pengesahan (Gaya Countdown Panel Section 2) */}
          <div className="mt-2 sm:mt-4 mx-auto max-w-xs sm:max-w-sm rounded-2xl sm:rounded-3xl border border-[#f2c8da] bg-gradient-to-br from-[#fdf4f8] via-[#ffffff] to-[#fdf6df] px-3.5 py-2.5 sm:px-5 sm:py-4 shadow-xs animate-fade-up-2">
            <div className="mx-auto mb-1 flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-[#6b1d3a] text-[#fffdf7] shadow-xs">
              <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>

            <p className="font-display text-xs sm:text-sm font-bold text-[#4e1228]">
              {record.fullName}
            </p>

            <p className="mt-0.5 text-[11.5px] sm:text-[13.5px] text-[#4e1228] leading-snug sm:leading-relaxed">
              {isAttending
                ? `Kehadiran untuk ${record.guestCount} tetamu (${record.sessionTime}) telah berjaya direkodkan.`
                : 'Terima kasih atas ingatan dan doa restu tulus anda buat kami berdua dari jauh.'}
            </p>

            <p className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-[#fdf4d7] border border-[#e892b0]/50 px-2.5 py-0.5 text-[10px] sm:text-[11px] font-medium text-[#4e6b38]">
              <Database className="h-3 w-3" />
              <span>Tersimpan ke Pangkalan Data Majlis</span>
            </p>

            <div className="mt-1.5 sm:mt-2.5 flex justify-center">
              <TwoCatsIllustration className="w-16 h-10 sm:w-28 sm:h-18" />
            </div>
          </div>

          {/* Butang Tindakan */}
          <div className="mt-2.5 sm:mt-4 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 animate-fade-up-2">
            {isAttending && (
              <>
                <button
                  type="button"
                  onClick={handleDownloadIcs}
                  className="btn-butter-silk inline-flex items-center gap-1 rounded-full px-3 sm:px-4 py-1.5 text-[11px] sm:text-xs font-semibold text-[#4e1228] transition-all duration-200 active:scale-95 cursor-pointer"
                >
                  <CalendarPlus className="h-3.5 w-3.5" />
                  <span>Kalendar (.ics)</span>
                </button>
                <a
                  href={WEDDING_DETAILS.googleCalendarUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-ivory-silk inline-flex items-center gap-1 rounded-full px-3 sm:px-4 py-1.5 text-[11px] sm:text-xs font-semibold text-[#591d36] transition-all duration-200 active:scale-95"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Google Calendar</span>
                </a>
              </>
            )}

            <button
              type="button"
              onClick={onBackToInvitation}
              className="btn-plum-silk inline-flex items-center gap-1.5 rounded-full px-3.5 sm:px-4 py-1.5 text-[11px] sm:text-xs font-semibold text-[#fffdf7] transition-all duration-200 active:scale-95 cursor-pointer"
            >
              <Heart className="h-3.5 w-3.5 fill-current" />
              <span>Kembali ke Jemputan</span>
            </button>

            <button
              type="button"
              onClick={onSubmitAnother}
              className="btn-ivory-silk inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] sm:text-xs font-medium text-[#591d36] transition-all duration-200 active:scale-95 cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Hantar RSVP Lain</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
