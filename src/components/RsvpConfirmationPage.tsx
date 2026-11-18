import { useEffect, useState } from 'react';
import {
  CalendarPlus,
  Check,
  Database,
  ExternalLink,
  Heart,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { CardFlowerCorners } from './BotanicalDecor';
import { WEDDING_DETAILS } from '../data/weddingData';
import {
  buildIcsContent,
  calculateCountdown,
  padTwoDigits,
  type RsvpRecord,
} from '../utils/wedding';

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
          <span
            className="absolute left-1/2 top-1/2 h-2.5 w-2.5 rounded-full animate-fw-core"
            style={{
              backgroundColor: burst.color,
              boxShadow: `0 0 10px ${burst.color}, 0 0 18px ${burst.color}`,
              animationDelay: burst.delay,
            }}
          />

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
  const [countdown, setCountdown] = useState(() => calculateCountdown(Date.now()));
  const isAttending = record.status === 'attending';

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCountdown(calculateCountdown(Date.now()));
    }, 1000);
    return () => window.clearInterval(interval);
  }, []);

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

      <div className="paper-baru-rose-card relative mx-auto w-full aspect-[945/1377] px-6 pt-5 pb-6 sm:px-12 sm:pt-10 sm:pb-12 text-center flex flex-col justify-center">
        <CardFlowerCorners variant="lg" />
        <CuteMiniFireworks />

        <div className="relative z-10 mx-auto w-full max-w-md my-auto">
          <div className="animate-thankyou-pop">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[#f2c8da] bg-[#fdf4f8]/95 px-3 py-0.5 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.14em] text-[#b23c62] mb-0.5 shadow-2xs">
              <Sparkles className="h-3 w-3 animate-pulse" />
              <span>RSVP Berjaya Disahkan</span>
              <Sparkles className="h-3 w-3 animate-pulse" />
            </div>

            <h1
              id="rsvp-thankyou-heading"
              className="font-script text-[26px] sm:text-[38px] text-[#4e1228] leading-tight animate-gentle-float"
            >
              Terima Kasih
            </h1>
            <p className="font-display text-[10px] sm:text-xs font-bold uppercase tracking-[0.15em] text-[#b23c62] -mt-0.5">
              Atas Maklum Balas Anda
            </p>
          </div>

          <div className="flex justify-center my-1 sm:my-2 animate-fade-up-1">
            <img
              src="/assets/ribbon-doves.png"
              alt=""
              aria-hidden="true"
              referrerPolicy="no-referrer"
              className="w-16 sm:w-32 h-auto object-contain"
            />
          </div>

          <h2 className="font-hero-swash text-[17px] sm:text-[24px] font-bold tracking-[0.06em] uppercase text-[#4e1228] leading-[1.06] flex flex-col items-center gap-0.5 animate-fade-up-1">
            <span className="block">{WEDDING_DETAILS.bride}</span>
            <span className="block">&amp;</span>
            <span className="block">{WEDDING_DETAILS.groom}</span>
          </h2>

          {/* Maklumat Pengesahan Tetamu (Tanpa Kotak Latar Belakang & Tanpa Kucing) */}
          <div className="mt-1.5 sm:mt-2.5 mx-auto max-w-[285px] sm:max-w-sm animate-fade-up-2">
            <div className="inline-flex items-center justify-center gap-1.5">
              <span className="flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-[#6b1d3a] text-[#fffdf7] shadow-2xs">
                <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              </span>
              <p className="font-display text-xs sm:text-sm font-bold text-[#4e1228]">
                {record.fullName}
              </p>
            </div>

            <p className="mt-0.5 text-[11px] sm:text-[13px] text-[#4e1228] leading-snug">
              {isAttending
                ? `Kehadiran untuk ${record.guestCount} tetamu (${record.sessionTime}) telah berjaya direkodkan.`
                : 'Terima kasih atas ingatan dan doa restu tulus anda buat kami berdua dari jauh.'}
            </p>

            <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-[#fdf4d7]/90 border border-[#e892b0]/50 px-2.5 py-0.5 text-[9.5px] sm:text-[11px] font-medium text-[#4e6b38]">
              <Database className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              <span>Tersimpan ke Pangkalan Data Majlis</span>
            </p>
          </div>

          {/* Countdown Panel dari Section 2 */}
          <div className="mt-2 sm:mt-3 mx-auto max-w-[290px] sm:max-w-sm rounded-2xl sm:rounded-3xl border border-[#f2c8da] bg-gradient-to-br from-[#fdf4f8] via-[#ffffff] to-[#fdf6df] px-3 py-1.5 sm:px-5 sm:py-3.5 shadow-xs relative animate-fade-up-2">
            <p className="font-display text-[10px] sm:text-xs tracking-[0.16em] uppercase text-[#4e1228] mb-1 sm:mb-2 font-semibold">
              Menghitung Hari Bahagia
            </p>

            <div
              className="grid grid-cols-4 gap-0.5 sm:gap-1.5 items-start text-[#d46f94]"
              aria-live="polite"
            >
              {[
                { label: 'Hari', value: padTwoDigits(countdown.days) },
                { label: 'Jam', value: padTwoDigits(countdown.hours) },
                { label: 'Minit', value: padTwoDigits(countdown.minutes) },
                { label: 'Saat', value: padTwoDigits(countdown.seconds) },
              ].map((unit, idx) => (
                <div
                  key={unit.label}
                  className="relative flex flex-col items-center justify-center py-0.5"
                >
                  <p className="font-countdown-num text-xl sm:text-3xl font-semibold leading-none tabular-nums text-[#c45b82] inline-flex items-center justify-center">
                    {unit.value.split('').map((digit, dIdx) => (
                      <span
                        key={`${dIdx}-${digit}`}
                        className="inline-block overflow-y-hidden px-[1.5px] h-[1.12em] leading-[1.12em]"
                      >
                        <span className="inline-block animate-digit-roll">
                          {digit}
                        </span>
                      </span>
                    ))}
                  </p>
                  {idx < 3 && (
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute -right-1 sm:-right-1.5 top-0 font-countdown-num text-lg sm:text-2xl font-medium leading-none text-[#c45b82]/85"
                    >
                      :
                    </span>
                  )}
                  <p className="mt-0.5 sm:mt-1 font-countdown-label text-[10px] sm:text-xs font-normal uppercase tracking-[0.06em] text-[#b23c62]">
                    {unit.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-2 sm:mt-3.5 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 animate-fade-up-2">
            {isAttending && (
              <>
                <button
                  type="button"
                  onClick={handleDownloadIcs}
                  className="btn-butter-silk inline-flex items-center gap-1 rounded-full px-3 sm:px-4 py-1 sm:py-1.5 text-[10.5px] sm:text-xs font-semibold text-[#4e1228] transition-all duration-200 active:scale-95 cursor-pointer"
                >
                  <CalendarPlus className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  <span>Kalendar (.ics)</span>
                </button>
                <a
                  href={WEDDING_DETAILS.googleCalendarUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-ivory-silk inline-flex items-center gap-1 rounded-full px-3 sm:px-4 py-1 sm:py-1.5 text-[10.5px] sm:text-xs font-semibold text-[#591d36] transition-all duration-200 active:scale-95"
                >
                  <ExternalLink className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  <span>Google Calendar</span>
                </a>
              </>
            )}

            <button
              type="button"
              onClick={onBackToInvitation}
              className="btn-plum-silk inline-flex items-center gap-1.5 rounded-full px-3.5 sm:px-4 py-1 sm:py-1.5 text-[10.5px] sm:text-xs font-semibold text-[#fffdf7] transition-all duration-200 active:scale-95 cursor-pointer"
            >
              <Heart className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-current" />
              <span>Kembali ke Jemputan</span>
            </button>

            <button
              type="button"
              onClick={onSubmitAnother}
              className="btn-ivory-silk inline-flex items-center gap-1 rounded-full px-3 py-1 sm:py-1.5 text-[10.5px] sm:text-xs font-medium text-[#591d36] transition-all duration-200 active:scale-95 cursor-pointer"
            >
              <RotateCcw className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              <span>Hantar RSVP Lain</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
