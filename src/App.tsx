import React, { useCallback, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { Analytics } from '@vercel/analytics/react';
import { Film, X } from 'lucide-react';
import { EnvelopeHero } from './components/EnvelopeHero';
import { ErrorBoundary } from './components/ErrorBoundary';
import { FloatingPetals } from './components/FloatingPetals';
import { Header, type ActivePage } from './components/Header';
import { InvitationSections } from './components/InvitationSections';
import { MusicPlayer } from './components/MusicPlayer';
import { RsvpPage } from './components/RsvpPage';
import { WEDDING_DETAILS } from './data/weddingData';
import { initOrganizerAuth, testFirestoreConnection } from './utils/firebaseAuth';
import { subscribePublicWishes } from './utils/firestoreRsvp';
import type { RsvpRecord } from './utils/wedding';

function getInitialRoute(): { page: ActivePage; autostart: boolean } {
  const params = new URLSearchParams(window.location.search);
  const autostart = params.get('autostart') === '1';
  const isRsvpPath = window.location.pathname.replace(/\/+$/, '') === '/rsvp';
  const isRsvpHash = window.location.hash === '#/rsvp' || window.location.hash === '#rsvp';
  return {
    page: isRsvpPath || isRsvpHash ? 'rsvp' : 'invitation',
    autostart,
  };
}

export default function App() {
  const initial = getInitialRoute();
  const [activePage, setActivePage] = useState<ActivePage>(initial.page);
  const [pagePhase, setPagePhase] = useState<'idle' | 'exiting' | 'entering'>('idle');
  const [rsvps, setRsvps] = useState<RsvpRecord[]>([]);
  const [isLoadingRsvps, setIsLoadingRsvps] = useState<boolean>(true);
  const [rsvpLoadError, setRsvpLoadError] = useState<string | null>(null);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [showVideoModal, setShowVideoModal] = useState<boolean>(false);
  const transitionTimersRef = React.useRef<number[]>([]);

  const clearTransitionTimers = useCallback(() => {
    transitionTimersRef.current.forEach((id) => window.clearTimeout(id));
    transitionTimersRef.current = [];
  }, []);

  useEffect(() => {
    return () => clearTransitionTimers();
  }, [clearTransitionTimers]);

  useEffect(() => {
    if (!showVideoModal) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowVideoModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showVideoModal]);

  useEffect(() => {
    void testFirestoreConnection();
    const unsubAuth = initOrganizerAuth((user, ready) => {
      setAuthUser(user);
      setAuthReady(ready);
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!authReady) return;
    setIsLoadingRsvps(true);
    setRsvpLoadError(null);
    const unsubWishes = subscribePublicWishes(
      (records) => {
        setRsvps(records);
        setIsLoadingRsvps(false);
      },
      (msg) => {
        setRsvpLoadError(msg);
        setIsLoadingRsvps(false);
      }
    );
    return () => unsubWishes();
  }, [authReady]);

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#/rsvp' || window.location.hash === '#rsvp') {
        setActivePage('rsvp');
      } else if (window.location.hash === '' || window.location.hash === '#/') {
        setActivePage('invitation');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleNavigatePage = (page: ActivePage, sectionId?: string) => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    const targetHash = page === 'rsvp' ? '/#/rsvp' : '/#/';

    // Same page smooth scroll (no cross-page veil needed)
    if (page === activePage) {
      window.history.replaceState(null, '', targetHash);
      if (sectionId) {
        const el = document.getElementById(sectionId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
          return;
        }
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Instant switch for reduced-motion accessibility
    if (prefersReducedMotion) {
      window.history.replaceState(null, '', targetHash);
      setActivePage(page);
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
      if (sectionId) {
        window.setTimeout(() => {
          document.getElementById(sectionId)?.scrollIntoView({ behavior: 'auto' });
        }, 40);
      }
      return;
    }

    // Smooth stationery cross-page transition
    clearTransitionTimers();
    setPagePhase('exiting');

    const swapTimer = window.setTimeout(() => {
      window.history.replaceState(null, '', targetHash);
      setActivePage(page);
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
      setPagePhase('entering');

      if (sectionId) {
        const scrollTimer = window.setTimeout(() => {
          document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
        }, 120);
        transitionTimersRef.current.push(scrollTimer);
      }

      const settleTimer = window.setTimeout(() => {
        setPagePhase('idle');
      }, 540);
      transitionTimersRef.current.push(settleTimer);
    }, 250);

    transitionTimersRef.current.push(swapTimer);
  };

  return (
    <div className="relative min-h-screen flex flex-col text-[#4e1228] overflow-x-clip">
      {/* Fixed Watercolor Meadow Background */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{ backgroundImage: "url('/assets/aistudio/Copy_of_Kad_Digital_Kahwin_1.0_7daeed5a.png')" }}
        aria-hidden="true"
      />
      {/* Soft Pastel Pink & Buttercream Veil for legibility */}
      <div
        className="fixed inset-0 z-10 bg-gradient-to-b from-[#fffdf7]/35 via-[#fbe9f0]/28 to-[#fdf4d7]/40 pointer-events-none"
        aria-hidden="true"
      />

      {/* Ambient Floating Petals & Butterflies */}
      <FloatingPetals />

      {/* Top Navigation Bar */}
      <Header activePage={activePage} onNavigatePage={handleNavigatePage} />

      {/* Smooth Cross-Page Floral Stationery Transition Veil */}
      {pagePhase !== 'idle' && (
        <div
          aria-hidden="true"
          className={`pointer-events-none fixed inset-0 z-[45] flex items-center justify-center bg-gradient-to-b from-[#fffdf7]/72 via-[#fbe9f0]/68 to-[#fdf4d7]/72 backdrop-blur-[3px] transition-opacity duration-300 ${
            pagePhase === 'exiting' ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="veil-crest-pop flex flex-col items-center gap-2 rounded-full border border-[#e892b0]/50 bg-[#fffdf7]/90 px-7 py-5 shadow-[0_14px_34px_rgba(107,29,58,0.16)]">
            <img
              src="/assets/heart-seal.png"
              alt=""
              className="h-14 w-14 object-contain drop-shadow-sm"
            />
            <p className="font-script text-2xl text-[#6b1d3a]">
              {activePage === 'rsvp' ? 'RSVP Tetamu' : 'Undangan Majlis'}
            </p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main
        key={activePage}
        className={`relative z-30 flex-1 ${
          pagePhase === 'exiting'
            ? 'page-stage-exit'
            : pagePhase === 'entering'
              ? 'page-stage-enter'
              : ''
        }`}
      >
        <ErrorBoundary>
          {activePage === 'invitation' ? (
            <>
              <EnvelopeHero
                initialOpen={initial.autostart}
                onGoToRsvp={() => handleNavigatePage('rsvp')}
              />
              <InvitationSections onGoToRsvp={() => handleNavigatePage('rsvp')} />
            </>
          ) : (
            <RsvpPage
              rsvps={rsvps}
              isLoading={isLoadingRsvps}
              loadError={rsvpLoadError}
              authUser={authUser}
              authReady={authReady}
              onRsvpSubmitted={(created) =>
                setRsvps((prev) =>
                  prev.some((item) => item.id === created.id) ? prev : [created, ...prev]
                )
              }
              onBackToInvitation={() => handleNavigatePage('invitation', 'hero-invitation')}
            />
          )}
        </ErrorBoundary>
      </main>

      {/* Pengaki */}
      <footer className="relative z-30 border-t border-[#e892b0]/40 bg-[#fffdf7]/88 backdrop-blur-sm py-6 px-4 text-center">
        <div className="mx-auto max-w-4xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm text-[#6b1d3a]/80">
          <p className="font-display">
            Majlis Perkahwinan {WEDDING_DETAILS.bride} &amp; {WEDDING_DETAILS.groom} ·{' '}
            {WEDDING_DETAILS.dateDisplay}
          </p>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setShowVideoModal(true)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6b1d3a] hover:underline underline-offset-4 cursor-pointer"
            >
              <Film className="h-3.5 w-3.5" />
              <span>Tonton Kad Video</span>
            </button>
            <button
              type="button"
              onClick={() => handleNavigatePage(activePage === 'rsvp' ? 'invitation' : 'rsvp')}
              className="text-xs font-semibold text-[#6b1d3a] hover:underline underline-offset-4 cursor-pointer"
            >
              {activePage === 'rsvp' ? 'Lihat Jemputan' : 'RSVP Tetamu'}
            </button>
          </div>
        </div>
      </footer>

      {/* Pemain Muzik Piano Terapung */}
      <MusicPlayer />

      {/* Modal Kad Video Asal */}
      {showVideoModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Video kad jemputan perkahwinan"
          onClick={() => setShowVideoModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-xs"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm rounded-3xl border-2 border-[#e892b0] bg-[#fffdf7] p-4 shadow-2xl animate-card-reveal"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="font-script text-2xl text-[#6b1d3a]">Kad Video Animasi</p>
              <button
                type="button"
                onClick={() => setShowVideoModal(false)}
                aria-label="Tutup paparan video"
                className="btn-blush-silk flex h-8 w-8 items-center justify-center rounded-full text-[#6b1d3a] transition-transform hover:scale-105 active:scale-95 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <video
              src="/assets/aistudio/Kad_Digital_Kahwin_1.0_1c17416e.mp4"
              controls
              playsInline
              className="w-full rounded-2xl max-h-[70vh] bg-black"
            />
          </div>
        </div>
      )}

      {/* Vercel Web Analytics */}
      <Analytics />
    </div>
  );
}
