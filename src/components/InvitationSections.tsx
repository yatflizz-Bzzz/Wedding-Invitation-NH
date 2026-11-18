import React, { useEffect, useRef, useState } from 'react';
import {
  CalendarPlus,
  Check,
  Clock,
  Copy,
  ExternalLink,
  Heart,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  Sparkles,
} from 'lucide-react';
import {
  CardFlowerCorners,
  HeartWaxSeal,
  SwanPairMotif,
  SwirledMonogram,
  TwoCatsIllustration,
  WeddingCarIllustration,
  type LilyCornerVariant,
} from './BotanicalDecor';
import { PaperLaceCard } from './PaperLaceCard';
import {
  DRESS_CODE_OUTFITS,
  FAMILY_CONTACTS,
  PASTEL_SWATCHES,
  WEDDING_DETAILS,
  WEDDING_SCHEDULE,
} from '../data/weddingData';
import {
  buildIcsContent,
  calculateCountdown,
  formatMalaysiaWhatsApp,
  padTwoDigits,
} from '../utils/wedding';

interface InvitationSectionsProps {
  onGoToRsvp: () => void;
}

const CONTACT_LILY_VARIANTS: LilyCornerVariant[] = ['sm', 'mixedA', 'mixedB', 'mixedC'];

function ScrollSection({
  id,
  ariaLabelledBy,
  ariaLabel,
  className = '',
  children,
}: {
  id?: string;
  ariaLabelledBy?: string;
  ariaLabel?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.06, rootMargin: '0px 0px -30px 0px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      id={id}
      aria-labelledby={ariaLabelledBy}
      aria-label={ariaLabel}
      className={`transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none motion-reduce:opacity-100 motion-reduce:translate-y-0 ${
        visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-6 scale-[0.985]'
      } ${className}`}
    >
      {children}
    </section>
  );
}

export function InvitationSections({ onGoToRsvp }: InvitationSectionsProps) {
  const [countdown, setCountdown] = useState(() => calculateCountdown(Date.now()));
  const [addressCopied, setAddressCopied] = useState(false);
  const [selectedSwatchIndex, setSelectedSwatchIndex] = useState<number>(3);
  const [closingVisible, setClosingVisible] = useState(false);
  const closingSectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCountdown(calculateCountdown(Date.now()));
    }, 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const node = closingSectionRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setClosingVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setClosingVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(WEDDING_DETAILS.venueFullAddress);
      setAddressCopied(true);
      window.setTimeout(() => setAddressCopied(false), 2600);
    } catch {
      setAddressCopied(true);
      window.setTimeout(() => setAddressCopied(false), 2600);
    }
  };

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

  const activeSwatch = PASTEL_SWATCHES[selectedSwatchIndex];

  return (
    <div className="space-y-14 sm:space-y-20 pb-16 px-4 sm:px-8">
      {/* SECTION 1: Bismillah & Parents' Formal Invitation + Romantic Poem (Matches paper design) */}
      <ScrollSection ariaLabelledBy="invitation-parents-heading" className="mx-auto max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* Left Paper Card: Exact Bismillah & Parents design */}
          <div className="paper-baru-rose-card mx-auto w-full max-w-[432px] aspect-[945/1377] px-7 py-8 sm:px-13 sm:py-12 text-center flex flex-col justify-center transition-transform duration-300 hover:-translate-y-0.5">
            <CardFlowerCorners variant="mixedC" />
            <div className="flex flex-col justify-between h-full">
              <div className="my-auto">
                <div className="flex justify-center mb-1 sm:mb-2">
                  <SwirledMonogram className="w-8 h-9 sm:w-12 sm:h-14" />
                </div>
                <p
                  lang="ar"
                  dir="rtl"
                  className="text-2xl sm:text-3xl text-[#4e1228] font-semibold mb-1.5 sm:mb-4"
                >
                  بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                </p>

                <p className="text-[13px] sm:text-sm text-[#4e1228] leading-snug sm:leading-relaxed mb-1.5 sm:mb-3.5">
                  Dengan penuh rasa kesyukuran, kasih sayang dan doa restu kedua ibu bapa kami,
                </p>
                <h2
                  id="invitation-parents-heading"
                  className="font-display italic text-[15px] sm:text-lg font-semibold tracking-wide text-[#4e1228] uppercase"
                >
                  {WEDDING_DETAILS.parentsLine1}
                </h2>
                <p className="font-script text-2xl sm:text-3xl text-[#4e1228] my-0.5">&amp;</p>
                <h3 className="font-display italic text-[15px] sm:text-lg font-semibold tracking-wide text-[#4e1228] uppercase mb-1.5 sm:mb-4">
                  {WEDDING_DETAILS.parentsLine2}
                </h3>

                <p className="text-[13px] sm:text-sm text-[#4e1228] leading-snug sm:leading-relaxed mb-1.5 sm:mb-3.5">
                  dengan segala hormatnya menjemput Tuan/Puan hadir ke majlis perkahwinan puteri kesayangan mereka,
                </p>

                <p className="font-hero-swash text-2xl sm:text-3xl font-bold tracking-[0.06em] uppercase text-[#4e1228]">
                  {WEDDING_DETAILS.bride}
                </p>
                <p className="font-hero-swash text-lg sm:text-2xl font-bold text-[#4e1228] my-0.5">
                  &amp;
                </p>
                <p className="font-hero-swash text-2xl sm:text-3xl font-bold tracking-[0.06em] uppercase text-[#4e1228]">
                  {WEDDING_DETAILS.groom}
                </p>
              </div>
              <div className="mt-1.5 sm:mt-4 flex justify-center">
                <SwanPairMotif className="w-14 h-9 sm:w-22 sm:h-14" />
              </div>
            </div>
          </div>

          {/* Right Paper Card: Romantic Verse */}
          <div className="paper-baru-rose-card mx-auto w-full max-w-[432px] aspect-[945/1377] px-7 py-8 sm:px-13 sm:py-12 text-center flex flex-col justify-center transition-transform duration-300 hover:-translate-y-0.5">
            <CardFlowerCorners variant="mixedD" />
            <div className="relative flex flex-col justify-between h-full">
              <div className="my-auto py-1">
                <div className="flex justify-center mb-1.5 sm:mb-2">
                  <SwirledMonogram className="w-8 h-9 sm:w-11 sm:h-12" />
                </div>
                <p className="font-script text-[32px] sm:text-4xl text-[#4e1228] leading-tight mb-2.5 sm:mb-4">
                  Dua Hati, Satu Selamanya
                </p>
                <p className="text-[13.5px] sm:text-base text-[#4e1228] leading-relaxed mb-3 sm:mb-5">
                  Ikatan yang terbina ini merupakan permulaan sebuah perjalanan baharu
                  dalam menyulam kasih, membina keluarga dan melayari kehidupan bersama.
                </p>
                <p className="text-[13.5px] sm:text-base text-[#4e1228] leading-relaxed">
                  Besar harapan kami agar kehadiran Tuan/Puan dapat menyerikan majlis ini
                  serta mengiringi pasangan mempelai dengan doa agar rumah tangga yang dibina
                  sentiasa dilimpahi sakinah, mawaddah dan rahmah.
                </p>
              </div>
              <div className="pt-1.5 sm:pt-4 flex justify-center">
                <SwanPairMotif className="w-14 h-9 sm:w-22 sm:h-14" />
              </div>
            </div>
          </div>
        </div>
      </ScrollSection>

      {/* SECTION 2: Save The Date & Live Countdown */}
      <ScrollSection ariaLabelledBy="countdown-heading" className="mx-auto max-w-[480px]">
        <div className="paper-baru-rose-card mx-auto w-full aspect-[945/1377] px-7 pt-7 pb-9 sm:px-13 sm:pt-12 sm:pb-14 text-center flex flex-col justify-center">
          <CardFlowerCorners variant="lg" />
          <div className="mx-auto w-full max-w-md my-auto">
            <p className="font-script text-[26px] sm:text-4xl text-[#4e1228] mb-0.5 sm:mb-1">
              Raikan Cinta
            </p>
            <div className="flex justify-center mb-1 sm:mb-2.5">
              <img
                src="/assets/ribbon-doves.png"
                alt=""
                aria-hidden="true"
                referrerPolicy="no-referrer"
                className="w-24 sm:w-40 h-auto object-contain"
              />
            </div>

            <h2
              id="countdown-heading"
              className="font-hero-swash text-[22px] sm:text-3xl font-bold tracking-[0.06em] uppercase text-[#4e1228] leading-[1.12] flex flex-col items-center gap-0.5"
            >
              <span className="block">{WEDDING_DETAILS.bride}</span>
              <span className="block">{WEDDING_DETAILS.groom}</span>
            </h2>
            <p className="mt-1 sm:mt-2 font-display text-xs sm:text-sm font-semibold text-[#4e1228] tracking-wider uppercase">
              Ahad, 27 Disember 2026
            </p>
            <p className="mt-0.5 text-xs sm:text-sm font-medium text-[#4e1228] uppercase tracking-wide">
              {WEDDING_DETAILS.venueTitle}
            </p>

            {/* Countdown Panel */}
            <div className="mt-2 sm:mt-4 mx-auto max-w-xs sm:max-w-sm rounded-2xl sm:rounded-3xl border border-[#f2c8da] bg-gradient-to-br from-[#fdf4f8] via-[#ffffff] to-[#fdf6df] px-3 py-2 sm:px-5 sm:py-4 shadow-xs relative">
              <p className="font-display text-[11px] sm:text-xs tracking-[0.16em] uppercase text-[#4e1228] mb-1.5 sm:mb-3 font-semibold">
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
                    <p className="font-countdown-num text-2xl sm:text-4xl font-semibold leading-none tabular-nums text-[#c45b82] inline-flex items-center justify-center">
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
                        className="pointer-events-none absolute -right-1 sm:-right-1.5 top-0 font-countdown-num text-xl sm:text-3xl font-medium leading-none text-[#c45b82]/85"
                      >
                        :
                      </span>
                    )}
                    <p className="mt-1 font-countdown-label text-[11px] sm:text-xs font-normal uppercase tracking-[0.06em] text-[#b23c62]">
                      {unit.label}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-1.5 sm:mt-3 flex justify-center">
                <TwoCatsIllustration className="w-20 h-12 sm:w-32 sm:h-20" />
              </div>
            </div>

            <div className="mt-2.5 sm:mt-5 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2.5">
              <button
                type="button"
                onClick={handleDownloadIcs}
                className="btn-butter-silk inline-flex items-center gap-1.5 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-semibold text-[#4e1228] transition-all duration-200 active:scale-95 cursor-pointer"
              >
                <CalendarPlus className="h-3.5 w-3.5" />
                <span>Tambah ke Kalendar (.ics)</span>
              </button>
              <a
                href={WEDDING_DETAILS.googleCalendarUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ivory-silk inline-flex items-center gap-1.5 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-semibold text-[#591d36] transition-all duration-200 active:scale-95"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Kalendar Google</span>
              </a>
            </div>
          </div>
        </div>
      </ScrollSection>

      {/* SECTION 3: Tentative Wedding (Schedule) */}
      <ScrollSection
        id="schedule-section"
        ariaLabelledBy="schedule-heading"
        className="mx-auto max-w-4xl scroll-mt-24"
      >
        <div className="text-center mb-6">
          <h2
            id="schedule-heading"
            className="font-display italic text-3xl sm:text-4xl font-semibold tracking-wider uppercase text-[#6b1d3a] drop-shadow-[0_2px_10px_rgba(255,253,247,0.85)]"
          >
            ATUR CARA MAJLIS
          </h2>
        </div>

        <div className="schedule-doily-frame relative w-full px-4 py-5 sm:px-8 sm:py-8">
          <CardFlowerCorners variant="mixedA" />
          <div className="mx-auto max-w-lg py-2 font-font2-sans">
            <ol className="relative border-l-2 border-[#fffdf7]/85 ml-4 space-y-8 pl-7">
              {WEDDING_SCHEDULE.map((item) => (
                <li
                  key={item.time}
                  className="group relative transition-transform duration-300 ease-out hover:translate-x-1.5"
                >
                  <span
                    className="absolute -left-[37px] top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#6b1d3a] ring-4 ring-[#e5b1c2] transition-transform duration-300 group-hover:scale-115"
                    aria-hidden="true"
                  >
                    <Clock className="h-2.5 w-2.5 text-[#ffffff]" />
                  </span>
                  <p className="font-font2-sans text-xl font-semibold tracking-wide text-[#4e1228] tabular-nums">
                    {item.time}
                  </p>
                  <p className="font-font2-sans text-[17px] sm:text-lg font-semibold text-[#4e1228] mt-0.5">
                    {item.title}
                  </p>
                  <p className="font-font2-sans text-[15px] sm:text-base font-normal text-[#4e1228]/95 mt-1 leading-relaxed">
                    {item.description}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </ScrollSection>

      {/* SECTION 4: Location Venue */}
      <ScrollSection
        id="venue-section"
        ariaLabelledBy="venue-heading"
        className="mx-auto max-w-4xl scroll-mt-24"
      >
        <div className="text-center mb-6">
          <h2
            id="venue-heading"
            className="font-display italic text-3xl sm:text-4xl font-semibold tracking-wider uppercase text-[#6b1d3a] drop-shadow-[0_2px_10px_rgba(255,253,247,0.85)]"
          >
            LOKASI MAJLIS
          </h2>
        </div>

        <div className="paper-baru-rose-card px-6 py-10 sm:px-14 sm:py-14">
          <CardFlowerCorners variant="mixedB" />
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
            {/* Map Preview Card */}
            <div className="md:col-span-7 flex flex-col justify-between gap-3 rounded-2xl border-2 border-[#bce2f5] bg-[#ffffff] p-3 sm:p-4 shadow-xs">
              <div className="relative w-full aspect-[1112/676] overflow-hidden rounded-xl bg-[#2a2d34]">
                <img
                  src="/assets/venue-map.jpg"
                  alt="Peta menuju ke Royale Palace Cyberjaya melalui Jalan Teknokrat 2"
                  referrerPolicy="no-referrer"
                  className="block h-full w-full object-contain"
                />
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                  <span className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-[#591d36]">
                    <MapPin className="h-4 w-4 text-[#b23c62] shrink-0" />
                    <span>{WEDDING_DETAILS.venueTitle}</span>
                  </span>
                  <span className="text-[13px] text-[#591d36]/85">
                    Jalan Teknokrat 2, Cyber 4
                  </span>
                </div>
                <div className="rounded-xl border border-[#e892b0]/40 bg-[#fdf4d7]/55 px-3 py-2.5 text-[13px] text-[#591d36] leading-relaxed">
                  <span className="font-semibold text-[#591d36]">Laluan Masuk:</span>{' '}
                  Masuk dari Jalan Teknokrat 2 menghala ke Skytech Tower (bersebelahan SWCorp Malaysia &amp; Koppiku MKN).
                </div>
              </div>
            </div>

            {/* Address, QR & Directions */}
            <div className="md:col-span-5 flex flex-col justify-between rounded-2xl border-2 border-[#f5d3e3] bg-[#ffffff] p-5 text-center md:text-left">
              <div>
                <h3 className="font-display text-lg font-semibold text-[#591d36] mb-2">
                  Alamat Lokasi
                </h3>
                <p className="text-[15px] sm:text-base text-[#591d36] leading-relaxed">
                  {WEDDING_DETAILS.venueFullAddress}
                </p>

                <div className="mt-5 flex items-center justify-center md:justify-start gap-4 rounded-xl bg-[#fdf4d7]/65 p-3 border border-[#f5d3e3]">
                  <img
                    src="/assets/venue-qr.jpg"
                    alt="Kod QR arah ke Royale Palace Cyberjaya"
                    referrerPolicy="no-referrer"
                    className="h-20 w-20 rounded-lg border border-[#6b1d3a]/20 bg-white p-1 shrink-0"
                  />
                  <div className="text-left">
                    <p className="font-display text-[13px] uppercase tracking-widest text-[#591d36] font-semibold">
                      Imbas Untuk Arah
                    </p>
                    <p className="text-[13px] text-[#591d36]/85 mt-1 leading-snug">
                      Halakan kamera telefon anda atau tekan aplikasi peta di bawah.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-2.5">
                <div className="flex flex-wrap gap-2">
                  <a
                    href={WEDDING_DETAILS.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-plum-silk flex-1 inline-flex items-center justify-center gap-1.5 rounded-full px-3.5 py-2.5 text-[13px] sm:text-sm font-semibold text-[#fffdf7] whitespace-nowrap transition-all duration-200 active:scale-95"
                  >
                    <Navigation className="h-3.5 w-3.5 shrink-0" />
                    <span>Google Maps</span>
                  </a>
                  <a
                    href={WEDDING_DETAILS.wazeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-butter-silk flex-1 inline-flex items-center justify-center gap-1.5 rounded-full px-3.5 py-2.5 text-[13px] sm:text-sm font-semibold text-[#4e1228] whitespace-nowrap transition-all duration-200 active:scale-95"
                  >
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                    <span>Waze</span>
                  </a>
                </div>
                <button
                  type="button"
                  onClick={handleCopyAddress}
                  className="btn-blush-silk inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-[13px] sm:text-sm font-medium text-[#591d36] transition-all duration-200 active:scale-95 cursor-pointer"
                >
                  {addressCopied ? (
                    <>
                      <Check className="h-4 w-4 text-[#4e6b38]" />
                      <span>Alamat Disalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span>Salin Alamat Penuh</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </ScrollSection>

      {/* SECTION 5: Contact Us */}
      <ScrollSection ariaLabelledBy="contact-heading" className="mx-auto max-w-4xl">
        <div className="text-center mb-7">
          <h2
            id="contact-heading"
            className="font-display italic text-3xl sm:text-4xl font-semibold tracking-wider uppercase text-[#6b1d3a] drop-shadow-[0_2px_10px_rgba(255,253,247,0.85)]"
          >
            HUBUNGI KAMI
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {FAMILY_CONTACTS.map((contact, idx) => (
            <PaperLaceCard
              key={contact.role}
              lilySize={CONTACT_LILY_VARIANTS[idx % CONTACT_LILY_VARIANTS.length]}
              className="text-center transition-transform duration-300 hover:-translate-y-1"
            >
              <h3 className="font-display text-lg font-semibold text-[#591d36]">
                {contact.role}
              </h3>
              <p className="mt-1 font-display text-xl font-bold tabular-nums text-[#4e1228]">
                {contact.phone}
              </p>
              <div className="mt-4 flex items-center justify-center gap-3">
                <a
                  href={contact.telHref}
                  className="btn-butter-silk inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold text-[#591d36] transition-all active:scale-95"
                >
                  <Phone className="h-3.5 w-3.5" />
                  <span>Telefon</span>
                </a>
                <a
                  href={formatMalaysiaWhatsApp(contact.phone)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-plum-silk inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold text-[#fffdf7] transition-all active:scale-95"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </PaperLaceCard>
          ))}
        </div>
      </ScrollSection>

      {/* SECTION 6: Dress Code & Pastel Color */}
      <ScrollSection
        id="dresscode-section"
        ariaLabelledBy="dresscode-heading"
        className="mx-auto max-w-4xl scroll-mt-24"
      >
        <div className="text-center mb-6">
          <h2
            id="dresscode-heading"
            className="font-display italic text-3xl sm:text-4xl font-semibold tracking-wider uppercase text-[#6b1d3a] drop-shadow-[0_2px_10px_rgba(255,253,247,0.85)]"
          >
            KOD PAKAIAN
          </h2>
        </div>

        <div className="paper-baru-rose-card px-7 pt-12 pb-20 sm:px-16 sm:pt-16 sm:pb-24">
          <CardFlowerCorners variant="mixedD" />
          {/* 6 Outfit Inspiration Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-5">
            {DRESS_CODE_OUTFITS.map((outfit) => (
              <figure
                key={outfit.id}
                className="group rounded-2xl border border-[#f4c9dc] bg-[#ffffff] p-2 shadow-xs transition-all duration-300 hover:-translate-y-1.5 hover:shadow-md"
              >
                <div className="overflow-hidden rounded-xl aspect-[3/4] bg-[#fdf2f7]">
                  <img
                    src={outfit.image}
                    alt={outfit.title}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                </div>
                <figcaption className="pt-2 px-1 text-center">
                  <p className="font-display text-[13px] sm:text-sm font-semibold text-[#591d36] leading-snug">
                    {outfit.title}
                  </p>
                  <p className="text-xs text-[#591d36]/80 mt-0.5 leading-snug">
                    {outfit.subtitle}
                  </p>
                </figcaption>
              </figure>
            ))}
          </div>

          {/* Polite Dress Code Note */}
          <div
            className="mt-8 mx-auto w-full max-w-[356px] sm:max-w-[440px] aspect-[1412/836] bg-contain bg-no-repeat bg-center px-11 py-5 sm:px-14 sm:py-9 text-center flex items-center justify-center drop-shadow-[0_8px_18px_rgba(107,29,58,0.14)]"
            style={{ backgroundImage: 'url(/assets/aistudio/Bubble_paper_a119c838.png)' }}
          >
            <p className="font-canva-serif text-[11.5px] sm:text-sm font-normal uppercase tracking-[0.04em] sm:tracking-[0.05em] text-[#4e1228] leading-[1.48] sm:leading-relaxed">
              Dimohon untuk tidak memakai baju-T. Semua tetamu digalakkan berpakaian
              kasual kemas atau formal.
            </p>
          </div>

          {/* Interactive 3x2 (3 per row) Pastel Color Palette */}
          <div className="mt-8 text-center">
            <h3 className="font-display text-base sm:text-lg font-semibold uppercase tracking-[0.2em] text-[#4e1228] mb-4">
              Warna Pastel
            </h3>
            <div className="grid grid-cols-3 gap-4 sm:gap-6 max-w-[228px] sm:max-w-[264px] mx-auto justify-items-center">
              {PASTEL_SWATCHES.map((swatch, index) => {
                const isSelected = index === selectedSwatchIndex;
                return (
                  <button
                    key={swatch.name}
                    type="button"
                    onClick={() => setSelectedSwatchIndex(index)}
                    aria-label={`Pilih warna pastel ${swatch.name}`}
                    aria-pressed={isSelected}
                    className={`group flex flex-col items-center cursor-pointer transition-transform rounded-full p-0.5 ${
                      isSelected
                        ? 'scale-110 ring-2 ring-[#6b1d3a] ring-offset-2'
                        : 'hover:scale-105'
                    }`}
                  >
                    <img
                      src={`/assets/swatch-${index}.png`}
                      alt={swatch.name}
                      referrerPolicy="no-referrer"
                      className="h-12 w-12 sm:h-14 sm:w-14 object-contain"
                    />
                  </button>
                );
              })}
            </div>
            <p className="mt-4 text-[15px] font-medium text-[#4e1228]">
              {activeSwatch.name} <span aria-hidden="true">·</span>{' '}
              <span className="text-[#4e1228]/85">{activeSwatch.note}</span>
            </p>
          </div>
        </div>
      </ScrollSection>

      {/* SECTION 7: Closing Blessing Card (cut cleanly after transparent SVG car) */}
      <ScrollSection ariaLabel="Penutup dan Doa" className="mx-auto max-w-[480px]">
        <div className="paper-baru-rose-card mx-auto w-full aspect-[945/1377] px-7 py-8 sm:px-13 sm:py-12 text-center flex flex-col justify-center">
          <CardFlowerCorners variant="mixedC" />
          <div className="mx-auto w-full max-w-md my-auto">
            <div className="flex justify-center mb-1 sm:mb-2">
              <SwirledMonogram className="w-8 h-9 sm:w-12 sm:h-14" />
            </div>
            <div className="flex justify-center mb-2 sm:mb-4">
              <img
                src="/assets/ribbon-doves.png"
                alt=""
                aria-hidden="true"
                referrerPolicy="no-referrer"
                className="w-24 sm:w-44 h-auto object-contain"
              />
            </div>

            <p className="text-[13px] sm:text-base text-[#4e1228] leading-snug sm:leading-relaxed mb-2.5 sm:mb-4">
              Kehadiran Tuan/Puan pada hari yang bermakna ini amat kami hargai lebih
              daripada segala kata. Sempena meraikan penyatuan dua hati dan permulaan
              perjalanan hidup baharu bersama, kami amat berbesar hati menjemput
              Tuan/Puan berkongsi kasih, kegembiraan dan keberkatan majlis yang penuh
              kenangan ini.
            </p>
            <p className="text-[13px] sm:text-base text-[#4e1228] leading-snug sm:leading-relaxed">
              Segala doa restu, ucapan tahniah dan ingatan tulus daripada Tuan/Puan akan
              sentiasa terpahat indah di hati pasangan mempelai serta kedua-dua belah
              keluarga.
            </p>

            <div className="mt-2 sm:mt-5 flex justify-center">
              <WeddingCarIllustration className="w-18 sm:w-32 h-auto" />
            </div>
          </div>
        </div>
      </ScrollSection>

      {/* SECTION 8: Standalone "Jumpa anda di sana !!" Finale Page */}
      <section
        ref={closingSectionRef}
        id="closing-section"
        aria-labelledby="closing-heading"
        className="relative mx-auto max-w-4xl min-h-[74vh] sm:min-h-[80vh] flex flex-col items-center justify-center py-12 sm:py-16 text-center"
      >
        <h2
          id="closing-heading"
          aria-label="Jumpa anda di sana !!"
          className="font-display italic font-semibold text-[25px] sm:text-5xl text-[#6b1d3a] tracking-wide whitespace-nowrap mb-8 sm:mb-10 drop-shadow-[0_2px_12px_rgba(255,253,247,0.92)]"
        >
          {'Jumpa anda di sana !!'.split('').map((char, idx) => (
            <span
              key={`${idx}-${char}`}
              aria-hidden="true"
              className={closingVisible ? 'inline-block animate-letter-reveal' : 'inline-block opacity-0'}
              style={{
                whiteSpace: 'pre',
                animationDelay: closingVisible ? `${idx * 22}ms` : undefined,
              }}
            >
              {char}
            </span>
          ))}
        </h2>

        <div
          className={`flex justify-center mb-8 sm:mb-10 ${
            closingVisible ? 'animate-heart-seal-reveal' : 'opacity-0'
          }`}
        >
          <HeartWaxSeal
            className="w-56 h-56 sm:w-68 sm:h-68 drop-shadow-[0_14px_28px_rgba(107,29,58,0.22)] transition-transform duration-300 hover:scale-105"
            monogram={WEDDING_DETAILS.monogram}
          />
        </div>

        <div className={closingVisible ? 'animate-closing-cta-reveal' : 'opacity-0'}>
          <button
            type="button"
            onClick={onGoToRsvp}
            className="btn-plum-silk inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm sm:text-base font-semibold tracking-wide text-[#fffdf7] transition-all hover:scale-[1.03] active:scale-95 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6b1d3a]"
          >
            <Heart className="h-4 w-4 fill-current" />
            <span>Teruskan ke RSVP Tetamu</span>
            <Sparkles className="h-4 w-4" />
          </button>
        </div>
      </section>
    </div>
  );
}
