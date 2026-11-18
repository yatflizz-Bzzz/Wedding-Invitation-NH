import React, { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';

export type ActivePage = 'invitation' | 'rsvp';

interface HeaderProps {
  activePage: ActivePage;
  onNavigatePage: (page: ActivePage, sectionId?: string) => void;
}

export function Header({ activePage, onNavigatePage }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [mobileMenuOpen]);

  const handleLinkClick = (page: ActivePage, sectionId?: string) => {
    setMobileMenuOpen(false);
    onNavigatePage(page, sectionId);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[#e892b0]/35 bg-[#fffdf7]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-8 px-4 py-3 sm:px-8">
        {/* Zone 1: 3D Heart Seal Brand Logo Button */}
        <button
          type="button"
          onClick={() => handleLinkClick('invitation', 'hero-invitation')}
          aria-label="Nabilah & Hidayat — Kembali ke Jemputan"
          className="seal-3d-wrap inline-flex items-center shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#6b1d3a]"
        >
          <img
            src="/assets/heart-seal.png"
            alt="Nabilah & Hidayat"
            referrerPolicy="no-referrer"
            className="seal-3d-img h-10 sm:h-11 w-auto object-contain"
          />
        </button>

        {/* Zone 2: Concise single-line navigation links in Bahasa Melayu */}
        <nav
          aria-label="Navigasi utama"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-[#6b1d3a]/85"
        >
          <button
            type="button"
            onClick={() => handleLinkClick('invitation', 'hero-invitation')}
            className={`whitespace-nowrap shrink-0 cursor-pointer pb-0.5 transition-colors hover:text-[#6b1d3a] ${
              activePage === 'invitation' ? 'border-b border-[#e892b0] text-[#6b1d3a]' : ''
            }`}
          >
            Jemputan
          </button>
          <button
            type="button"
            onClick={() => handleLinkClick('invitation', 'schedule-section')}
            className="whitespace-nowrap shrink-0 cursor-pointer pb-0.5 transition-colors hover:text-[#6b1d3a]"
          >
            Atur Cara
          </button>
          <button
            type="button"
            onClick={() => handleLinkClick('invitation', 'venue-section')}
            className="whitespace-nowrap shrink-0 cursor-pointer pb-0.5 transition-colors hover:text-[#6b1d3a]"
          >
            Lokasi
          </button>
          <button
            type="button"
            onClick={() => handleLinkClick('invitation', 'dresscode-section')}
            className="whitespace-nowrap shrink-0 cursor-pointer pb-0.5 transition-colors hover:text-[#6b1d3a]"
          >
            Kod Pakaian
          </button>
        </nav>

        {/* Zone 3: Single primary CTA + Mobile toggle */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => handleLinkClick('rsvp')}
            className={`whitespace-nowrap shrink-0 cursor-pointer rounded-full px-6 py-2 text-sm font-semibold tracking-wide transition-all duration-200 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6b1d3a] ${
              activePage === 'rsvp'
                ? 'btn-butter-silk text-[#4e1228] ring-2 ring-[#e892b0]'
                : 'btn-plum-silk text-[#fffdf7]'
            }`}
          >
            RSVP
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
            aria-expanded={mobileMenuOpen}
            className="md:hidden btn-blush-silk inline-flex h-10 w-10 items-center justify-center rounded-full text-[#6b1d3a] transition-all duration-200 active:scale-95 cursor-pointer"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <nav
          aria-label="Navigasi mudah alih"
          className="md:hidden border-t border-[#e892b0]/30 bg-[#fffdf7]/95 px-4 py-3 flex flex-wrap items-center justify-center gap-4 text-sm font-medium text-[#6b1d3a] animate-card-reveal"
        >
          <button
            type="button"
            onClick={() => handleLinkClick('invitation', 'hero-invitation')}
            className="px-2 py-1.5 whitespace-nowrap cursor-pointer"
          >
            Jemputan
          </button>
          <button
            type="button"
            onClick={() => handleLinkClick('invitation', 'schedule-section')}
            className="px-2 py-1.5 whitespace-nowrap cursor-pointer"
          >
            Atur Cara
          </button>
          <button
            type="button"
            onClick={() => handleLinkClick('invitation', 'venue-section')}
            className="px-2 py-1.5 whitespace-nowrap cursor-pointer"
          >
            Lokasi
          </button>
          <button
            type="button"
            onClick={() => handleLinkClick('invitation', 'dresscode-section')}
            className="px-2 py-1.5 whitespace-nowrap cursor-pointer"
          >
            Kod Pakaian
          </button>
          <button
            type="button"
            onClick={() => handleLinkClick('rsvp')}
            className="px-2 py-1.5 font-semibold underline decoration-[#e892b0] underline-offset-4 whitespace-nowrap cursor-pointer"
          >
            RSVP Tetamu
          </button>
        </nav>
      )}
    </header>
  );
}
