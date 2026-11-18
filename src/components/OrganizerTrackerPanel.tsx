import React, { useEffect, useMemo, useState } from 'react';
import type { User } from 'firebase/auth';
import {
  CheckCircle2,
  ClipboardList,
  Download,
  ExternalLink,
  Filter,
  Loader2,
  Lock,
  LogOut,
  MessageSquareHeart,
  Search,
  Star,
  Trash2,
  UserCheck,
  Users,
} from 'lucide-react';
import { PaperLaceCard } from './PaperLaceCard';
import {
  isVerifiedOrganizerUser,
  logout as firebaseLogout,
  signInWithGoogle,
} from '../utils/firebaseAuth';
import {
  deleteRsvpSubmission,
  subscribePrivateRsvps,
  updateOrganizerRsvpTracking,
} from '../utils/firestoreRsvp';
import {
  exportRsvpsToCsv,
  formatMalaysiaWhatsApp,
  ORGANIZER_EMAIL,
  RSVP_LIMITS,
  summarizeRsvpAnalytics,
  type GuestSide,
  type RsvpRecord,
} from '../utils/wedding';

interface OrganizerTrackerPanelProps {
  publicRsvps: RsvpRecord[];
  authUser: User | null;
  authReady: boolean;
}

const SIDE_LABELS: Record<GuestSide, string> = {
  bride: 'Pengantin Perempuan',
  groom: 'Pengantin Lelaki',
  friend: 'Rakan',
  colleague: 'Rakan Sekerja',
};

function formatDateDisplay(iso: string): string {
  try {
    const dt = new Date(iso);
    if (Number.isNaN(dt.getTime())) return iso;
    return dt.toLocaleString('ms-MY', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function OrganizerTrackerPanel({
  publicRsvps,
  authUser,
  authReady,
}: OrganizerTrackerPanelProps) {
  const isOrganizer = isVerifiedOrganizerUser(authUser);

  const [privateRsvps, setPrivateRsvps] = useState<RsvpRecord[]>([]);
  const [isLoadingPrivate, setIsLoadingPrivate] = useState<boolean>(false);
  const [privateError, setPrivateError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Filters for organizer table
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'attending' | 'declining'>('all');
  const [sideFilter, setSideFilter] = useState<'all' | GuestSide>('all');
  const [checkInFilter, setCheckInFilter] = useState<'all' | 'checked-in' | 'pending'>('all');

  // Inline note editing & action states
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!authReady || !isOrganizer) {
      setPrivateRsvps([]);
      setIsLoadingPrivate(false);
      return;
    }

    setIsLoadingPrivate(true);
    setPrivateError(null);

    const unsubscribe = subscribePrivateRsvps(
      (records) => {
        setPrivateRsvps(records);
        setIsLoadingPrivate(false);
      },
      (msg) => {
        setPrivateError(msg);
        setIsLoadingPrivate(false);
      }
    );

    return () => unsubscribe();
  }, [authReady, isOrganizer]);

  // Public summary from public_wishes; enriched by privateRsvps when organizer is authenticated
  const activeDataset = isOrganizer && privateRsvps.length >= publicRsvps.length ? privateRsvps : publicRsvps;
  const analytics = useMemo(() => summarizeRsvpAnalytics(activeDataset), [activeDataset]);

  const filteredPrivateRecords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return privateRsvps.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (sideFilter !== 'all' && item.side !== sideFilter) return false;
      if (checkInFilter === 'checked-in' && !item.checkedIn) return false;
      if (checkInFilter === 'pending' && item.checkedIn) return false;
      if (!q) return true;
      return (
        item.fullName.toLowerCase().includes(q) ||
        item.phone.toLowerCase().includes(q) ||
        item.email.toLowerCase().includes(q) ||
        item.dietaryNotes.toLowerCase().includes(q) ||
        item.wishes.toLowerCase().includes(q) ||
        (item.feedbackComment || '').toLowerCase().includes(q) ||
        (item.organizerNotes || '').toLowerCase().includes(q)
      );
    });
  }, [privateRsvps, searchQuery, statusFilter, sideFilter, checkInFilter]);

  const handleGoogleLogin = async () => {
    setIsSigningIn(true);
    setAuthError(null);
    setActionFeedback(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      setAuthError(
        err instanceof Error && err.message
          ? err.message
          : 'Log masuk Google gagal atau tetingkap pop-up disekat.'
      );
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleLogout = async () => {
    await firebaseLogout();
    setPrivateRsvps([]);
    setActionFeedback(null);
    setAuthError(null);
  };

  const handleDownloadCsv = () => {
    const csvContent = exportRsvpsToCsv(privateRsvps);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.setAttribute('download', `rsvp-maklum-balas-nabilah-hidayat-${dateStamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setActionFeedback(`Fail CSV (${privateRsvps.length} rekod) berjaya dimuat turun.`);
  };

  const handleToggleCheckIn = async (record: RsvpRecord) => {
    setSavingId(record.id);
    setActionFeedback(null);
    try {
      const currentNotes = noteDrafts[record.id] ?? record.organizerNotes ?? '';
      await updateOrganizerRsvpTracking(record.id, {
        checkedIn: !record.checkedIn,
        organizerNotes: currentNotes,
      });
      setActionFeedback(
        !record.checkedIn
          ? `${record.fullName} ditandakan telah daftar masuk.`
          : `Status daftar masuk ${record.fullName} dikemas kini.`
      );
    } finally {
      setSavingId(null);
    }
  };

  const handleSaveNotes = async (record: RsvpRecord) => {
    setSavingId(record.id);
    setActionFeedback(null);
    try {
      const nextNotes = noteDrafts[record.id] ?? record.organizerNotes ?? '';
      await updateOrganizerRsvpTracking(record.id, {
        checkedIn: Boolean(record.checkedIn),
        organizerNotes: nextNotes,
      });
      setActionFeedback(`Catatan penganjur untuk ${record.fullName} berjaya disimpan.`);
    } finally {
      setSavingId(null);
    }
  };

  const handleConfirmDelete = async (record: RsvpRecord) => {
    setSavingId(record.id);
    setActionFeedback(null);
    try {
      await deleteRsvpSubmission(record.id);
      setConfirmDeleteId(null);
      setActionFeedback(`Rekod ${record.fullName} telah dipadam daripada pangkalan data.`);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <section aria-labelledby="organizer-tracker-heading" className="mt-10 mx-auto max-w-5xl">
      <PaperLaceCard lilySize="sm">
        {/* Tajuk Panel Penjejakan */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#f2c8da] pb-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#fdf4d7] border border-[#e892b0]/60 text-[#591d36]">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <h2
                id="organizer-tracker-heading"
                className="font-display text-lg sm:text-xl font-semibold text-[#591d36]"
              >
                Sistem Penjejakan RSVP &amp; Maklum Balas Penganjur
              </h2>
              <p className="text-xs sm:text-sm text-[#591d36]/80 mt-0.5">
                Semua pengesahan RSVP dan maklum balas pelawat disimpan terus ke pangkalan data awan masa nyata untuk dipantau di Vercel.
              </p>
            </div>
          </div>

          {authUser && (
            <button
              type="button"
              onClick={handleLogout}
              className="btn-ivory-silk inline-flex items-center gap-1.5 self-start sm:self-center rounded-full px-4 py-2 text-xs font-semibold text-[#591d36] transition-all active:scale-95 cursor-pointer shrink-0"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Log Keluar</span>
            </button>
          )}
        </div>

        {/* Ringkasan Analitik Umum (Tanpa PII) */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Pecahan Pihak Tetamu */}
          <div className="rounded-2xl border border-[#f2c8da] bg-[#ffffff]/90 p-3.5">
            <p className="flex items-center gap-1.5 font-display text-xs font-semibold uppercase tracking-wider text-[#591d36]/80">
              <Users className="h-3.5 w-3.5 text-[#b23c62]" />
              <span>Pecahan Pihak Tetamu</span>
            </p>
            <dl className="mt-2.5 space-y-1.5 text-xs">
              {(['bride', 'groom', 'friend', 'colleague'] as GuestSide[]).map((sideKey) => (
                <div key={sideKey} className="flex items-center justify-between text-[#591d36]">
                  <dt className="text-[#591d36]/80">{SIDE_LABELS[sideKey]}</dt>
                  <dd className="font-semibold tabular-nums">
                    {analytics.bySide[sideKey].guests} pax ({analytics.bySide[sideKey].parties})
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Pecahan Slot Masa */}
          <div className="rounded-2xl border border-[#f2c8da] bg-[#ffffff]/90 p-3.5">
            <p className="flex items-center gap-1.5 font-display text-xs font-semibold uppercase tracking-wider text-[#591d36]/80">
              <UserCheck className="h-3.5 w-3.5 text-[#b23c62]" />
              <span>Slot Ketibaan Tetamu</span>
            </p>
            {analytics.bySession.length === 0 ? (
              <p className="mt-3 text-xs text-[#591d36]/65">
                Belum ada tetamu mengesahkan kehadiran setakat ini.
              </p>
            ) : (
              <dl className="mt-2.5 space-y-1.5 text-xs">
                {analytics.bySession.map((slot) => (
                  <div
                    key={slot.sessionTime}
                    className="flex items-center justify-between gap-2 text-[#591d36]"
                  >
                    <dt className="truncate text-[#591d36]/80" title={slot.sessionTime}>
                      {slot.sessionTime}
                    </dt>
                    <dd className="shrink-0 font-semibold tabular-nums">
                      {slot.guests} pax
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </div>

          {/* Ringkasan Maklum Balas Pelawat */}
          <div className="rounded-2xl border border-[#f2c8da] bg-[#ffffff]/90 p-3.5">
            <p className="flex items-center gap-1.5 font-display text-xs font-semibold uppercase tracking-wider text-[#591d36]/80">
              <MessageSquareHeart className="h-3.5 w-3.5 text-[#b23c62]" />
              <span>Maklum Balas Pelawat</span>
            </p>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="font-display text-2xl font-bold tabular-nums text-[#591d36]">
                {analytics.feedbackRatingCount > 0 ? analytics.averageFeedbackRating.toFixed(1) : '—'}
              </span>
              <span className="text-xs text-[#591d36]/75">/ 5 bintang</span>
            </div>
            <p className="mt-1 text-xs text-[#591d36]/75">
              {analytics.feedbackRatingCount} penilaian diterima · {analytics.decliningParties} kiriman doa tidak dapat hadir
            </p>
          </div>
        </div>

        {/* Mesej Status / Ralat */}
        {authError && (
          <div
            role="alert"
            className="mt-4 rounded-2xl border border-[#b23c62] bg-[#fdf2f7] px-4 py-3 text-xs sm:text-sm text-[#8e1b42]"
          >
            {authError}
          </div>
        )}
        {privateError && (
          <div
            role="alert"
            className="mt-4 rounded-2xl border border-[#b23c62] bg-[#fdf2f7] px-4 py-3 text-xs sm:text-sm text-[#8e1b42]"
          >
            {privateError}
          </div>
        )}
        {actionFeedback && (
          <div className="mt-4 rounded-2xl border border-[#7b9a65]/50 bg-[#fdf4d7]/75 px-4 py-3 text-xs sm:text-sm text-[#4e6b38]">
            {actionFeedback}
          </div>
        )}

        {/* Gerbang Akses Penganjur */}
        {!authUser ? (
          <div className="mt-5 rounded-2xl border border-[#f2c8da] bg-[#ffffff]/92 p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="inline-flex items-center gap-1.5 font-display text-sm font-semibold text-[#591d36]">
                  <Lock className="h-4 w-4 text-[#b23c62]" />
                  <span>Buka Rekod Penuh &amp; Maklum Balas Peribadi Penganjur</span>
                </p>
                <p className="text-xs text-[#591d36]/80 leading-relaxed max-w-xl">
                  Log masuk menggunakan akaun penganjur (<span className="font-semibold">{ORGANIZER_EMAIL}</span>) untuk melihat nombor telefon WhatsApp tetamu, e-mel, keperluan makanan, maklum balas peribadi pelawat, daftar masuk majlis, dan muat turun fail Excel/CSV.
                </p>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isSigningIn}
                className="gsi-material-button shrink-0 cursor-pointer"
              >
                <div className="gsi-material-button-state" />
                <div className="gsi-material-button-content-wrapper">
                  <div className="gsi-material-button-icon">
                    <svg
                      version="1.1"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 48 48"
                      style={{ display: 'block' }}
                    >
                      <path
                        fill="#EA4335"
                        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                      />
                      <path
                        fill="#4285F4"
                        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                      />
                      <path
                        fill="#34A853"
                        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                      />
                      <path fill="none" d="M0 0h48v48H0z" />
                    </svg>
                  </div>
                  <span className="gsi-material-button-contents">
                    {isSigningIn ? 'Menyambung...' : 'Sign in with Google'}
                  </span>
                  <span style={{ display: 'none' }}>Sign in with Google</span>
                </div>
              </button>
            </div>

            <details className="mt-3 border-t border-[#f2c8da]/60 pt-2.5 text-xs text-[#591d36]/75">
              <summary className="cursor-pointer font-medium text-[#591d36] hover:underline">
                Nota penggunaan di Vercel.com
              </summary>
              <p className="mt-1.5 leading-relaxed">
                Tetamu boleh menghantar RSVP dan maklum balas di mana-mana domain Vercel tanpa log masuk. Untuk log masuk ke panel penganjur ini dari pautan <code className="rounded bg-[#fbe9f0] px-1 py-0.5">*.vercel.app</code> anda, pastikan domain Vercel tersebut didaftarkan di Firebase Console &rarr; Authentication &rarr; Settings &rarr; Authorized domains.
              </p>
            </details>
          </div>
        ) : !isOrganizer ? (
          <div className="mt-5 rounded-2xl border border-[#b23c62]/50 bg-[#fdf2f7] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="font-display text-sm font-semibold text-[#591d36]">
                Akaun Tidak Diberi Kuasa ({authUser.email || 'Tidak diketahui'})
              </p>
              <p className="text-xs text-[#591d36]/80 mt-0.5">
                Maklumat peribadi tetamu dilindungi dan hanya boleh diakses oleh e-mel penganjur yang disahkan ({ORGANIZER_EMAIL}).
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="btn-ivory-silk rounded-full px-4 py-2 text-xs font-semibold text-[#591d36] cursor-pointer shrink-0"
            >
              Tukar Akaun Google
            </button>
          </div>
        ) : (
          /* Papan Pemuka Penjejakan Penuh Penganjur */
          <div className="mt-5 space-y-5">
            {/* Bar Tindakan & KPI Penganjur */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-[#f2c8da] bg-[#fdf4d7]/55 p-4">
              <div>
                <p className="text-xs font-medium text-[#591d36]/75">
                  Log masuk disahkan sebagai Penganjur:
                </p>
                <p className="font-display text-sm sm:text-base font-semibold text-[#591d36]">
                  {authUser.email}
                </p>
                <p className="text-xs text-[#591d36]/80 mt-0.5">
                  Daftar masuk: {analytics.checkedInParties} kumpulan ({analytics.checkedInGuests} pax) · {analytics.feedbackCommentsCount} maklum balas bertulis
                </p>
              </div>

              <button
                type="button"
                onClick={handleDownloadCsv}
                disabled={privateRsvps.length === 0}
                className="btn-plum-silk inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-xs sm:text-sm font-semibold text-[#fffdf7] transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                <span>Muat Turun CSV / Excel ({privateRsvps.length})</span>
              </button>
            </div>

            {/* Carian & Penapis */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="relative sm:col-span-2 lg:col-span-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#591d36]/50" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama, telefon, maklum balas..."
                  aria-label="Cari rekod RSVP"
                  className="w-full rounded-xl border border-[#e892b0]/75 bg-[#ffffff] pl-9 pr-3 py-2 text-xs sm:text-sm text-[#4e1228] placeholder:text-[#4e1228]/45 focus:border-[#6b1d3a] focus:outline-none"
                />
              </div>

              <div>
                <label className="sr-only" htmlFor="tracker-status-filter">
                  Tapis Status Kehadiran
                </label>
                <select
                  id="tracker-status-filter"
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value as 'all' | 'attending' | 'declining')
                  }
                  className="w-full rounded-xl border border-[#e892b0]/75 bg-[#ffffff] px-3 py-2 text-xs sm:text-sm text-[#4e1228] focus:border-[#6b1d3a] focus:outline-none"
                >
                  <option value="all">Semua Kehadiran</option>
                  <option value="attending">Hadir Sahaja</option>
                  <option value="declining">Tidak Hadir</option>
                </select>
              </div>

              <div>
                <label className="sr-only" htmlFor="tracker-side-filter">
                  Tapis Pihak Tetamu
                </label>
                <select
                  id="tracker-side-filter"
                  value={sideFilter}
                  onChange={(e) => setSideFilter(e.target.value as 'all' | GuestSide)}
                  className="w-full rounded-xl border border-[#e892b0]/75 bg-[#ffffff] px-3 py-2 text-xs sm:text-sm text-[#4e1228] focus:border-[#6b1d3a] focus:outline-none"
                >
                  <option value="all">Semua Pihak</option>
                  <option value="bride">Pengantin Perempuan</option>
                  <option value="groom">Pengantin Lelaki</option>
                  <option value="friend">Rakan</option>
                  <option value="colleague">Rakan Sekerja</option>
                </select>
              </div>

              <div>
                <label className="sr-only" htmlFor="tracker-checkin-filter">
                  Tapis Status Daftar Masuk
                </label>
                <select
                  id="tracker-checkin-filter"
                  value={checkInFilter}
                  onChange={(e) =>
                    setCheckInFilter(e.target.value as 'all' | 'checked-in' | 'pending')
                  }
                  className="w-full rounded-xl border border-[#e892b0]/75 bg-[#ffffff] px-3 py-2 text-xs sm:text-sm text-[#4e1228] focus:border-[#6b1d3a] focus:outline-none"
                >
                  <option value="all">Semua Daftar Masuk</option>
                  <option value="checked-in">Sudah Daftar Masuk</option>
                  <option value="pending">Belum Tiba</option>
                </select>
              </div>
            </div>

            {/* Senarai Penuh Rekod Tetamu & Maklum Balas */}
            {isLoadingPrivate ? (
              <div className="py-8 flex items-center justify-center gap-2 text-sm text-[#591d36]/80">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Memuatkan rekod penuh tetamu...</span>
              </div>
            ) : filteredPrivateRecords.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#e892b0] bg-[#ffffff]/80 p-6 text-center text-sm text-[#591d36]/75">
                <Filter className="mx-auto h-5 w-5 mb-2 text-[#b23c62]" />
                <p>Tiada rekod sepadan dengan penapis semasa.</p>
              </div>
            ) : (
              <ul className="space-y-3.5 max-h-[680px] overflow-y-auto pr-1">
                {filteredPrivateRecords.map((record) => {
                  const isBusy = savingId === record.id;
                  const noteValue = noteDrafts[record.id] ?? record.organizerNotes ?? '';
                  const noteDirty = noteValue !== (record.organizerNotes ?? '');

                  return (
                    <li
                      key={record.id}
                      className="rounded-2xl border border-[#f2c8da] bg-[#ffffff] p-4 shadow-2xs space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-display text-base font-semibold text-[#591d36]">
                              {record.fullName}
                            </h3>
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                                record.status === 'attending'
                                  ? 'bg-[#eef6ea] text-[#3d612a] border border-[#b7d3a7]'
                                  : 'bg-[#fdf2f7] text-[#8e1b42] border border-[#e892b0]'
                              }`}
                            >
                              {record.status === 'attending'
                                ? `Hadir · ${record.guestCount} pax`
                                : 'Tidak Hadir'}
                            </span>
                            <span className="rounded-full bg-[#fbe9f0] px-2.5 py-0.5 text-[11px] font-medium text-[#591d36]">
                              {SIDE_LABELS[record.side]}
                            </span>
                          </div>
                          <p className="text-xs text-[#591d36]/75 mt-1">
                            Dihantar: {formatDateDisplay(record.createdAt)} ·{' '}
                            {record.sessionTime || 'Tiada slot'}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleToggleCheckIn(record)}
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer disabled:opacity-60 ${
                              record.checkedIn
                                ? 'bg-[#4d6e3a] text-[#ffffff]'
                                : 'btn-ivory-silk text-[#591d36]'
                            }`}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>
                              {record.checkedIn ? 'Sudah Daftar Masuk' : 'Tandakan Hadir'}
                            </span>
                          </button>

                          {confirmDeleteId === record.id ? (
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => handleConfirmDelete(record)}
                                className="rounded-full bg-[#9f1d45] px-3 py-1.5 text-xs font-semibold text-white cursor-pointer"
                              >
                                Sahkan Padam
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="rounded-full border border-[#e892b0] px-2.5 py-1.5 text-xs text-[#591d36] cursor-pointer"
                              >
                                Batal
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(record.id)}
                              aria-label={`Padam rekod ${record.fullName}`}
                              className="rounded-full border border-[#f2c8da] p-1.5 text-[#8e1b42] hover:bg-[#fdf2f7] cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Maklumat Hubungan (PII) */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[#591d36]">
                        <span>
                          Telefon: <strong className="font-semibold">{record.phone}</strong>
                        </span>
                        <a
                          href={formatMalaysiaWhatsApp(record.phone)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-semibold text-[#4d6e3a] hover:underline"
                        >
                          <span>WhatsApp</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                        {record.email && (
                          <span>
                            E-mel: <strong>{record.email}</strong>
                          </span>
                        )}
                        {record.dietaryNotes && (
                          <span className="rounded-lg bg-[#fdf4d7] px-2 py-0.5 text-[#591d36]">
                            Pemakanan/Khas: {record.dietaryNotes}
                          </span>
                        )}
                      </div>

                      {/* Ucapan & Maklum Balas Pelawat */}
                      {(record.wishes ||
                        (record.feedbackRating && record.feedbackRating > 0) ||
                        record.feedbackComment) && (
                        <div className="rounded-xl bg-[#fdf7fa] border border-[#f2c8da]/80 p-3 space-y-1.5 text-xs text-[#591d36]">
                          {record.wishes && (
                            <p>
                              <span className="font-semibold">Ucapan Tetamu:</span> &ldquo;{record.wishes}&rdquo;
                            </p>
                          )}
                          {(record.feedbackRating && record.feedbackRating > 0) ||
                          record.feedbackComment ? (
                            <div className="flex flex-wrap items-start gap-2 pt-1 border-t border-[#f2c8da]/60">
                              {record.feedbackRating && record.feedbackRating > 0 ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-[#fdf4d7] px-2 py-0.5 font-semibold text-[#591d36]">
                                  <Star className="h-3 w-3 fill-[#d4a017] text-[#d4a017]" />
                                  {record.feedbackRating}/5
                                </span>
                              ) : null}
                              {record.feedbackComment && (
                                <p className="flex-1">
                                  <span className="font-semibold">Maklum Balas Pelawat:</span>{' '}
                                  {record.feedbackComment}
                                </p>
                              )}
                            </div>
                          ) : null}
                        </div>
                      )}

                      {/* Catatan Penganjur */}
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          maxLength={RSVP_LIMITS.organizerNotesMax}
                          value={noteValue}
                          onChange={(e) =>
                            setNoteDrafts((prev) => ({
                              ...prev,
                              [record.id]: e.target.value,
                            }))
                          }
                          placeholder="Catatan penganjur (cth. Meja VIP 2, sudah hubungi)..."
                          aria-label={`Catatan penganjur untuk ${record.fullName}`}
                          className="flex-1 rounded-xl border border-[#e892b0]/75 bg-[#ffffff] px-3 py-1.5 text-xs text-[#4e1228] placeholder:text-[#4e1228]/45 focus:border-[#6b1d3a] focus:outline-none"
                        />
                        <button
                          type="button"
                          disabled={isBusy || !noteDirty}
                          onClick={() => handleSaveNotes(record)}
                          className="btn-blush-silk rounded-full px-4 py-1.5 text-xs font-semibold text-[#591d36] cursor-pointer disabled:opacity-45"
                        >
                          Simpan Catatan
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </PaperLaceCard>
    </section>
  );
}
