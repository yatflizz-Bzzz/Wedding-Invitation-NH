import React, { useState } from 'react';
import { MailOpen, RotateCcw, Heart, Sparkles } from 'lucide-react';
import {
  CardFlowerCorners,
  HeartWaxSeal,
  SwanPairMotif,
  SwirledMonogram,
} from './BotanicalDecor';
import { WEDDING_DETAILS } from '../data/weddingData';

interface EnvelopeHeroProps {
  initialOpen?: boolean;
  onGoToRsvp: () => void;
}

export function EnvelopeHero({ initialOpen = false, onGoToRsvp }: EnvelopeHeroProps) {
  const [isOpen, setIsOpen] = useState<boolean>(initialOpen);

  return (
    <section
      id="hero-invitation"
      className="relative px-4 pt-8 pb-12 sm:px-8 sm:pt-12 sm:pb-16"
    >
      <div className="mx-auto max-w-3xl">
        {!isOpen ? (
          <div
            key="sealed-envelope"
            className="relative mx-auto w-full max-w-[516px] aspect-[848/1243] bg-contain bg-no-repeat bg-center pt-14 pb-20 px-12 sm:pt-20 sm:pb-26 sm:px-20 text-center flex flex-col justify-center animate-card-reveal drop-shadow-[0_14px_34px_rgba(107,29,58,0.14)]"
            style={{ backgroundImage: 'url(/assets/aistudio/Kertas_pink_untuk_jemputan_e49abce0.png)' }}
          >
            <CardFlowerCorners variant="mixedA" />
            <div className="relative z-10 mx-auto w-full max-w-sm py-1">
              <p className="font-display text-xs sm:text-sm tracking-[0.18em] uppercase text-[#591d36] mb-1.5 sm:mb-2.5">
                Undangan Walimatulurus
              </p>
              <h1 className="font-hero-swash text-2xl sm:text-[34px] font-bold uppercase tracking-[0.06em] text-[#591d36] leading-[1.08] mb-1.5 sm:mb-2.5 flex flex-col items-center">
                <span>{WEDDING_DETAILS.bride}</span>
                <span className="text-lg sm:text-2xl my-0.5 text-[#8f294d]">
                  &amp;
                </span>
                <span>{WEDDING_DETAILS.groom}</span>
              </h1>
              <p className="font-display text-xs sm:text-sm font-medium text-[#6b1d3a] tracking-widest mb-3 sm:mb-6">
                27 DISEMBER 2026 · CYBERJAYA
              </p>

              {/* Sampul Renda Krim & Cop Lilin Hati */}
              <div className="relative mx-auto w-full max-w-[144px] sm:max-w-[232px] pt-0.5">
                <button
                  type="button"
                  onClick={() => setIsOpen(true)}
                  className="group relative flex w-full flex-col items-center justify-center cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#6b1d3a]"
                  aria-label="Buka sampul jemputan perkahwinan"
                >
                  <span className="relative block w-full">
                    <img
                      src="/assets/envelope-lace.png"
                      alt=""
                      aria-hidden="true"
                      referrerPolicy="no-referrer"
                      className="w-full h-auto object-contain animate-envelope-beckon transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                    <span className="absolute inset-0 flex items-center justify-center pt-2 sm:pt-3 animate-envelope-beckon pointer-events-none">
                      <HeartWaxSeal
                        className="w-12 h-12 sm:w-18 sm:h-18 animate-seal-beckon transition-transform duration-300 group-hover:scale-110 drop-shadow-sm"
                        monogram={WEDDING_DETAILS.monogram}
                      />
                    </span>
                  </span>
                  <span className="btn-plum-silk mt-2.5 sm:mt-4 inline-flex items-center gap-1.5 sm:gap-2 rounded-full px-4 sm:px-6 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-[#fffdf7] transition-all duration-200 group-hover:scale-[1.02]">
                    <MailOpen className="h-3.5 w-3.5" />
                    <span>Buka Jemputan</span>
                  </span>
                </button>
                <p className="mt-1.5 sm:mt-2 text-xs text-[#591d36]/90">
                  Tekan cop hati untuk membuka kad jemputan
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div
            key="opened-card"
            className="relative mx-auto w-full max-w-[516px] aspect-[848/1243] bg-contain bg-no-repeat bg-center pt-14 pb-20 px-12 sm:pt-20 sm:pb-26 sm:px-20 text-center flex flex-col justify-center animate-card-reveal drop-shadow-[0_14px_34px_rgba(107,29,58,0.14)]"
            style={{ backgroundImage: 'url(/assets/aistudio/Kertas_pink_untuk_jemputan_e49abce0.png)' }}
          >
            <CardFlowerCorners variant="mixedB" />
            <div className="relative z-10 mx-auto w-full max-w-sm py-1">
              <div className="flex justify-center mb-0.5 sm:mb-1">
                <SwirledMonogram className="w-8 h-9 sm:w-12 sm:h-14" />
              </div>

              <p className="font-script text-3xl sm:text-5xl text-[#591d36] mb-0.5">
                Raikan Cinta
              </p>
              <p className="font-display italic text-sm sm:text-base text-[#6b1d3a] mb-2 sm:mb-4">
                Majlis Perkahwinan
              </p>

              <h1 className="font-hero-swash text-2xl sm:text-4xl font-bold tracking-[0.06em] uppercase text-[#591d36]">
                {WEDDING_DETAILS.bride}
              </h1>

              <div className="my-1 sm:my-2.5 flex justify-center">
                <SwanPairMotif className="w-15 h-9 sm:w-24 sm:h-14" />
              </div>

              <p className="font-hero-swash text-2xl sm:text-4xl font-bold tracking-[0.06em] uppercase text-[#591d36]">
                {WEDDING_DETAILS.groom}
              </p>

              <div className="mt-2 sm:mt-5 inline-block border-y border-[#8b3a54]/40 px-4 sm:px-5 py-1 sm:py-1.5">
                <p className="font-display text-xs sm:text-sm tracking-[0.2em] text-[#591d36] font-medium">
                  27 DISEMBER 2026
                </p>
              </div>
              <p className="mt-1 sm:mt-1.5 text-xs sm:text-sm text-[#591d36]">
                {WEDDING_DETAILS.venueTitle}
              </p>

              {/* Tindakan Utama Kad Terbuka */}
              <div className="mt-3 sm:mt-6 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2.5">
                <button
                  type="button"
                  onClick={onGoToRsvp}
                  className="btn-plum-silk inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-semibold text-[#fffdf7] transition-all active:scale-95 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6b1d3a]"
                >
                  <Heart className="h-3.5 w-3.5 fill-current" />
                  <span>Sahkan RSVP</span>
                </button>
                <a
                  href="#schedule-section"
                  className="btn-butter-silk inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-semibold text-[#591d36] transition-all active:scale-95 cursor-pointer"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Lihat Butiran</span>
                </a>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="btn-ivory-silk inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 sm:px-4 sm:py-2 text-xs font-medium text-[#591d36] transition-all active:scale-95 cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Tutup Kad</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
