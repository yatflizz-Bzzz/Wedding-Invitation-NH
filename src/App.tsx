import React, { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Film, X } from 'lucide-react';
import { EnvelopeHero } from './components/EnvelopeHero';
import { ErrorBoundary } from './components/ErrorBoundary';
import { FloatingPetals } from './components/FloatingPetals';
import { Header, type ActivePage } from './components/Header';
import { InvitationSections } from './components/InvitationSections';
import { MusicPlayer } from './components/MusicPlayer';
import { OrganizerTrackerPanel } from './components/OrganizerTrackerPanel';
import { RsvpPage } from './components/RsvpPage';
import { WEDDING_DETAILS } from './data/weddingData';
import { getAllRsvps, initRsvpTable, type RsvpResponse } from './services/tursoDb';
import type { GuestSide, RsvpRecord } from './utils/wedding';

function checkIsAdminLocation(): boolean {
  if (typeof window === 'undefined') return false;
  const cleanPath = window.location.pathname.replace(/\/+$/, '');
  const hash = window.location.hash;
  return cleanPath === '/admin' || hash === '#/admin' || hash === '#admin';
}

function getInitialRoute(): { page: ActivePage; autostart: boolean; isAdmin: boolean } {
  const params = new URLSearchParams(window.location.search);
  const autostart = params.get('autostart') === '1';
  const isRsvpPath = window.location.pathname.replace(/\/+$/, '') === '/rsvp';
  const isRsvpHash = window.location.hash === '#/rsvp' || window.location.hash === '#rsvp';
  return {
    page: isRsvpPath || isRsvpHash ? 'rsvp' : 'invitation',
    autostart,
    isAdmin: checkIsAdminLocation(),
  };
}

function mapTursoRowToRecord(row: RsvpResponse): RsvpRecord {
  const isAttending =
    row.attendance_status === 'Hadir' || row.attendance_status === 'attending';

  let side: GuestSide = 'friend';
  if (
    row.guest_side === 'Keluarga Pengantin Perempuan' ||
    row.guest_side === 'Pengantin Perempuan'
  ) {
    side = 'bride';
  } else if (
    row.guest_side === 'Keluarga Pengantin Lelaki' ||
    row.guest_side === 'Pengantin Lelaki'
  ) {
    side = 'groom';
  } else if (row.guest_side === 'Rakan Sekerja') {
    side = 'colleague';
  }

  return {
    id: row.id,
    fullName: row.full_name,
    phone: row.phone ?? '',
    email: row.email ?? '',
    side,
    status: isAttending ? 'attending' : 'declining',
    guestCount: isAttending ? Math.max(0, Number(row.pax ?? 0)) : 0,
    sessionTime: row.arrival_time ?? '',
    dietaryNotes: row.dietary_notes ?? '',
    wishes: row.wishes ?? '',
    feedbackRating: row.rating ? Number(row.rating) : 0,
    feedbackComment: row.feedback ?? '',
    checkedIn:
      row.checkin_status === 'Sudah Tiba' ||
      row.checkin_status === 'Sudah Daftar Masuk',
    organizerNotes: row.organizer_notes ?? '',
    createdAt: row.submitted_at,
    updatedAt: row.submitted_at,
  };
}

export default function App() {
  const initial = getInitialRoute();
  const [activePage, setActivePage] = useState<ActivePage>(initial.page);
  const [isAdminRoute, setIsAdminRoute] = useState<boolean>(initial.isAdmin);
  const [pagePhase, setPagePhase] = useState<'idle' | 'exiting' | 'entering'>('idle');
  const [rsvps, setRsvps] = useState<RsvpRecord[]>([]);
  const [isLoadingRsvps, setIsLoadingRsvps] = useState<boolean>(true);
  const [rsvpLoadError, setRsvpLoadError] = useState<string | null>(null);
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

  const loadRsvpsFromTurso = useCallback(async () => {
    setIsLoadingRsvps(true);
    setRsvpLoadError(null);
    try {
      await initRsvpTable();
      const rows = await getAllRsvps();
      setRsvps(rows.map(mapTursoRowToRecord));
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Gagal memuatkan data RSVP daripada Turso.';
      setRsvpLoadError(msg);
    } finally {
      setIsLoadingRsvps(false);
    }
  }, []);

  useEffect(() => {
    void loadRsvpsFromTurso();
  }, [loadRsvpsFromTurso]);

  const handleAdminRecordsChanged = useCallback((updated: RsvpRecord[]) => {
    setRsvps(updated);
  }, []);

  useEffect(() => {
    const handleLocationChange = () => {
      if (checkIsAdminLocation()) {
        setIsAdminRoute(true);
        return;
      }
      setIsAdminRoute(false);
      if (window.location.hash === '#/rsvp' || window.location.hash === '#rsvp') {
        setActivePage('rsvp');
      } else if (window.location.hash === '' || window.location.hash === '#/') {
        setActivePage('invitation');
      }
    };
    window.addEventListener('hashchange', handleLocationChange);
    window.addEventListener('popstate', handleLocationChange);
    return () => {
      window.removeEventListener('hashchange', handleLocationChange);
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  const handleNavigatePage = (page: ActivePage, sectionId?: string) => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    const targetHash = page === 'rsvp' ? '/#/rsvp' : '/#/';

    if (!isAdminRoute && page === activePage) {
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

    if (prefersReducedMotion) {
      window.history.replaceState(null, '', targetHash);
      setIsAdminRoute(false);
      setActivePage(page);
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
      if (sectionId) {
        window.setTimeout(() => {
          document.getElementById(sectionId)?.scrollIntoView({ behavior: 'auto' });
        }, 40);
      }
      return;
    }

    clearTransitionTimers();
    setPagePhase('exiting');

    const swapTimer = window.setTimeout(() => {
      window.history.replaceState(null, '', targetHash);
      setIsAdminRoute(false);
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
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{ backgroundImage: "url('/assets/aistudio/Copy_of_Kad_Digital_Kahwin_1.0_7daeed5a.png')" }}
        aria-hidden="true"
      />
      <div
        className="fixed inset-0 z-10 bg-gradient-to-b from-[#fffdf7]/35 via-[#fbe9f0]/28 to-[#fdf4d7]/40 pointer-events-none"
        aria-hidden="true"
      />

      <FloatingPetals />

      <Header activePage={activePage} onNavigatePage={handleNavigatePage} />

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

      <main
        key={isAdminRoute ? 'admin' : activePage}
        className={`relative z-30 flex-1 pb-12 ${
          pagePhase === 'exiting'
            ? 'page-stage-exit'
            : pagePhase === 'entering'
              ? 'page-stage-enter'
              : ''
        }`}
      >
        <ErrorBoundary>
          {isAdminRoute ? (
            <div className="px-4 py-8 sm:px-8 sm:py-12">
              <div className="mx-auto max-w-5xl">
                <div className="mb-4">
                  <button
                    type="button"
                    onClick={() => handleNavigatePage('invitation', 'hero-invitation')}
                    className="btn-ivory-silk inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-[#591d36] transition-all active:scale-95 cursor-pointer"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Kembali ke Jemputan</span>
                  </button>
                </div>
                <OrganizerTrackerPanel
                  publicRsvps={rsvps}
                  onRecordsChanged={handleAdminRecordsChanged}
                />
              </div>
            </div>
          ) : activePage === 'invitation' ? (
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
              onRsvpSubmitted={(created) => {
                setRsvps((prev) =>
                  prev.some((item) => item.id === created.id) ? prev : [created, ...prev]
                );
                void loadRsvpsFromTurso();
              }}
              onBackToInvitation={() => handleNavigatePage('invitation', 'hero-invitation')}
            />
          )}
        </ErrorBoundary>
      </main>

      <footer className="relative z-30 border-t border-[#e892b0]/40 bg-[#fffdf7]/88 backdrop-blur-sm py-6 pb-24 px-4 text-center">
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

      <MusicPlayer />

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
    </div>
  );
}
