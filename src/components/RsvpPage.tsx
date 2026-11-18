import React, { useMemo, useState } from 'react';
import type { User } from 'firebase/auth';
import {
  ArrowLeft,
  CheckCircle2,
  Database,
  Heart,
  Loader2,
  Send,
  Star,
  Users,
} from 'lucide-react';
import {
  CardFlowerCorners,
  MeadowFlowerBorder,
  SwirledMonogram,
} from './BotanicalDecor';
import { ErrorBoundary } from './ErrorBoundary';
import { OrganizerTrackerPanel } from './OrganizerTrackerPanel';
import { PaperLaceCard } from './PaperLaceCard';
import { WEDDING_DETAILS } from '../data/weddingData';
import { submitRsvpToFirestore } from '../utils/firestoreRsvp';
import {
  normalizeRsvpPayload,
  RSVP_LIMITS,
  summarizeRsvps,
  validateRsvpForm,
  type AttendanceStatus,
  type GuestSide,
  type RsvpFormInput,
  type RsvpRecord,
  type RsvpValidationErrors,
} from '../utils/wedding';

interface RsvpPageProps {
  rsvps: RsvpRecord[];
  isLoading: boolean;
  loadError: string | null;
  authUser: User | null;
  authReady: boolean;
  onRsvpSubmitted: (created: RsvpRecord) => void;
  onBackToInvitation: () => void;
}

const INITIAL_FORM: RsvpFormInput = {
  fullName: '',
  phone: '',
  email: '',
  side: 'friend',
  status: 'attending',
  guestCount: 2,
  sessionTime: '11:00 PAGI - Ketibaan Tetamu',
  dietaryNotes: '',
  wishes: '',
  feedbackRating: 0,
  feedbackComment: '',
};

const SIDE_LABELS: Record<GuestSide, string> = {
  bride: 'Keluarga Pengantin Perempuan',
  groom: 'Keluarga Pengantin Lelaki',
  friend: 'Rakan',
  colleague: 'Rakan Sekerja',
};

export function RsvpPage({
  rsvps,
  isLoading,
  loadError,
  authUser,
  authReady,
  onRsvpSubmitted,
  onBackToInvitation,
}: RsvpPageProps) {
  const [form, setForm] = useState<RsvpFormInput>(INITIAL_FORM);
  const [errors, setErrors] = useState<RsvpValidationErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRecord, setSubmittedRecord] = useState<RsvpRecord | null>(null);
  const [wishFilter, setWishFilter] = useState<'all' | 'attending' | 'declining'>('all');

  const summary = useMemo(() => summarizeRsvps(rsvps), [rsvps]);

  const filteredRsvps = useMemo(() => {
    if (wishFilter === 'all') return rsvps;
    return rsvps.filter((item) => item.status === wishFilter);
  }, [rsvps, wishFilter]);

  const handleFieldChange = <K extends keyof RsvpFormInput>(
    field: K,
    value: RsvpFormInput[K]
  ) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'status' && value === 'declining') {
        next.guestCount = 0;
      } else if (field === 'status' && value === 'attending' && prev.guestCount < 1) {
        next.guestCount = 1;
      }
      return next;
    });
    if (field in errors) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    setSubmitError(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const validationErrors = validateRsvpForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const payload = normalizeRsvpPayload(form);
      const created = await submitRsvpToFirestore(payload);
      onRsvpSubmitted(created);
      setSubmittedRecord(created);
      setForm(INITIAL_FORM);
      setErrors({});
    } catch (err) {
      let friendlyMsg = 'Tidak dapat menyimpan RSVP buat masa ini. Sila cuba lagi.';
      if (err instanceof Error && err.message) {
        try {
          const parsed = JSON.parse(err.message);
          friendlyMsg = parsed?.error || err.message;
        } catch {
          friendlyMsg = err.message;
        }
      }
      setSubmitError(friendlyMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="px-4 py-8 sm:px-8 sm:py-12 space-y-12">
      <div className="mx-auto max-w-5xl">
        {/* Butang kembali */}
        <div className="mb-6">
          <button
            type="button"
            onClick={onBackToInvitation}
            className="btn-ivory-silk inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-[#591d36] transition-all active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali ke Jemputan</span>
          </button>
        </div>

        {/* Sepanduk Utama RSVP */}
        <section className="mb-10 animate-card-reveal mx-auto max-w-2xl">
          <div
            className="relative mx-auto w-full max-w-[540px] aspect-[848/1243] bg-contain bg-no-repeat bg-center px-13 py-12 sm:px-18 sm:py-22 text-center flex flex-col justify-center drop-shadow-[0_14px_34px_rgba(107,29,58,0.14)]"
            style={{ backgroundImage: 'url(/assets/aistudio/Kertas_pink_untuk_jemputan_e49abce0.png)' }}
          >
            <CardFlowerCorners variant="mixedA" />
            <div className="relative z-10 mx-auto w-full max-w-[238px] sm:max-w-sm">
              <div className="flex justify-center mb-0.5 sm:mb-1">
                <SwirledMonogram className="w-7 h-8 sm:w-11 sm:h-12" />
              </div>
              <div className="flex justify-center mb-1 sm:mb-2">
                <img
                  src="/assets/rsvp-swan-pair.png"
                  alt=""
                  aria-hidden="true"
                  referrerPolicy="no-referrer"
                  className="w-16 h-8 sm:w-24 sm:h-12 object-contain"
                />
              </div>
              <p className="font-script text-[28px] sm:text-5xl text-[#591d36] leading-tight">
                Sila Balas
              </p>
              <h1 className="font-display text-[17px] sm:text-3xl font-semibold tracking-wider uppercase text-[#591d36] mt-0.5 sm:mt-1 leading-tight">
                RSVP &amp; Ucapan Tetamu
              </h1>
              <p className="mt-1.5 sm:mt-3 text-[11.5px] sm:text-sm text-[#4e1228] leading-snug sm:leading-relaxed">
                Kami amat menantikan kehadiran anda untuk meraikan majlis ini bersama pada{' '}
                <span className="font-semibold text-[#591d36]">
                  {WEDDING_DETAILS.dayDisplay}
                </span>{' '}
                di {WEDDING_DETAILS.venueTitle}. Sila sahkan kehadiran anda di bawah.
              </p>

              {/* Metrik Kehadiran Langsung */}
              <div className="mt-3 sm:mt-6 grid grid-cols-3 gap-1.5 sm:gap-3.5 max-w-md mx-auto">
                <div className="rounded-xl sm:rounded-2xl border border-[#f2c8da] bg-[#ffffff]/95 py-1.5 px-1 sm:py-3 sm:px-2 shadow-2xs">
                  <p className="font-display text-lg sm:text-3xl font-bold tabular-nums text-[#591d36]">
                    {summary.totalGuestsConfirmed}
                  </p>
                  <p className="text-[10.5px] sm:text-xs font-medium text-[#591d36]/85 mt-0.5 leading-tight">
                    Tetamu Disahkan
                  </p>
                </div>
                <div className="rounded-xl sm:rounded-2xl border border-[#f2c8da] bg-[#ffffff]/95 py-1.5 px-1 sm:py-3 sm:px-2 shadow-2xs">
                  <p className="font-display text-lg sm:text-3xl font-bold tabular-nums text-[#591d36]">
                    {summary.attendingParties}
                  </p>
                  <p className="text-[10.5px] sm:text-xs font-medium text-[#591d36]/85 mt-0.5 leading-tight">
                    Kumpulan Hadir
                  </p>
                </div>
                <div className="rounded-xl sm:rounded-2xl border border-[#f2c8da] bg-[#ffffff]/95 py-1.5 px-1 sm:py-3 sm:px-2 shadow-2xs">
                  <p className="font-display text-lg sm:text-3xl font-bold tabular-nums text-[#591d36]">
                    {summary.totalResponses}
                  </p>
                  <p className="text-[10.5px] sm:text-xs font-medium text-[#591d36]/85 mt-0.5 leading-tight">
                    Jumlah Ucapan
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Susun Atur Dua Lajur: Borang RSVP + Dinding Ucapan */}
        <ErrorBoundary>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Lajur Kiri: Borang Pengesahan RSVP & Maklum Balas Pelawat */}
            <section aria-labelledby="rsvp-form-heading" className="lg:col-span-7">
              <PaperLaceCard lilySize="mixedB">
                  if (submittedRecord) {
    return (
      <RsvpConfirmationPage
        record={submittedRecord}
        onBackToInvitation={onBackToInvitation}
        onSubmitAnother={() => setSubmittedRecord(null)}
      />
    );
  }

                  <div className="py-6 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#fdf4d7] border-2 border-[#e892b0] text-[#591d36]">
                      <CheckCircle2 className="h-9 w-9 text-[#5a8044]" />
                    </div>
                    <p className="font-script text-4xl text-[#591d36]">Terima Kasih!</p>
                    <h2
                      id="rsvp-form-heading"
                      className="font-display text-2xl font-semibold text-[#591d36] mt-1"
                    >
                      RSVP &amp; Maklum Balas Direkodkan
                    </h2>
                    <p className="mt-3 text-sm sm:text-base text-[#591d36]/85 max-w-md mx-auto leading-relaxed">
                      Terima kasih,{' '}
                      <span className="font-semibold">{submittedRecord.fullName}</span>.{' '}
                      {submittedRecord.status === 'attending'
                        ? `Kami telah menempah tempat untuk ${submittedRecord.guestCount} tetamu (${submittedRecord.sessionTime}).`
                        : 'Kami amat menghargai doa restu serta ingatan tulus anda dari jauh.'}
                    </p>
                    <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#fdf4d7] border border-[#e892b0]/50 px-3.5 py-1 text-xs font-medium text-[#4e6b38]">
                      <Database className="h-3.5 w-3.5" />
                      <span>Tersimpan terus ke Pangkalan Data Majlis</span>
                    </p>

                    <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => setSubmittedRecord(null)}
                        className="btn-plum-silk rounded-full px-6 py-2.5 text-sm font-semibold text-[#fffdf7] transition-all active:scale-95 cursor-pointer"
                      >
                        Hantar RSVP Lain
                      </button>
                      <button
                        type="button"
                        onClick={onBackToInvitation}
                        className="btn-ivory-silk rounded-full px-6 py-2.5 text-sm font-semibold text-[#591d36] transition-all active:scale-95 cursor-pointer"
                      >
                        Kembali ke Jemputan
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} noValidate className="space-y-5">
                    <div className="border-b border-[#f2c8da] pb-4">
                      <h2
                        id="rsvp-form-heading"
                        className="font-display text-2xl font-semibold text-[#591d36]"
                      >
                        Borang Pengesahan RSVP
                      </h2>
                      <p className="text-sm text-[#591d36]/75 mt-1">
                        Sila lengkapkan maklumat anda bagi memudahkan pihak keluarga membuat persiapan majlis.
                      </p>
                    </div>

                    {submitError && (
                      <div
                        role="alert"
                        className="rounded-2xl border border-[#b23c62] bg-[#fdf2f7] px-4 py-3 text-sm text-[#8e1b42]"
                      >
                        {submitError}
                      </div>
                    )}

                    {/* Pemilih Status Kehadiran */}
                    <fieldset>
                      <legend className="block text-sm font-semibold text-[#591d36] mb-2">
                        Adakah anda akan hadir? *
                      </legend>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {(
                          [
                            {
                              value: 'attending',
                              title: 'Hadir',
                              sub: 'Saya akan hadir memeriahkan majlis',
                            },
                            {
                              value: 'declining',
                              title: 'Tidak Dapat Hadir',
                              sub: 'Mengirimkan doa restu dari jauh',
                            },
                          ] as { value: AttendanceStatus; title: string; sub: string }[]
                        ).map((option) => {
                          const active = form.status === option.value;
                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => handleFieldChange('status', option.value)}
                              aria-pressed={active}
                              className={`rounded-2xl border-2 px-4 py-3 text-left transition-all cursor-pointer ${
                                active
                                  ? 'border-[#6b1d3a] bg-[#fdf4d7] shadow-xs'
                                  : 'border-[#f2c8da] bg-[#ffffff] hover:bg-[#fdf7fa]'
                              }`}
                            >
                              <p className="font-display text-sm font-semibold text-[#591d36]">
                                {option.title}
                              </p>
                              <p className="text-xs text-[#591d36]/75 mt-0.5">{option.sub}</p>
                            </button>
                          );
                        })}
                      </div>
                    </fieldset>

                    {/* Nama Penuh & Telefon */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="rsvp-fullName"
                          className="block text-sm font-semibold text-[#591d36] mb-1.5"
                        >
                          Nama Penuh *
                        </label>
                        <input
                          id="rsvp-fullName"
                          name="fullName"
                          type="text"
                          required
                          maxLength={RSVP_LIMITS.fullNameMax}
                          value={form.fullName}
                          onChange={(e) => handleFieldChange('fullName', e.target.value)}
                          placeholder="cth. Siti Nurhaliza"
                          className="w-full rounded-xl border border-[#e892b0]/75 bg-[#ffffff] px-3.5 py-2.5 text-sm text-[#4e1228] placeholder:text-[#4e1228]/40 focus:border-[#6b1d3a] focus:outline-none"
                        />
                        {errors.fullName && (
                          <p className="mt-1 text-xs font-medium text-[#9f1d45]">
                            {errors.fullName}
                          </p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="rsvp-phone"
                          className="block text-sm font-semibold text-[#591d36] mb-1.5"
                        >
                          No. Telefon / WhatsApp *
                        </label>
                        <input
                          id="rsvp-phone"
                          name="phone"
                          type="tel"
                          required
                          maxLength={RSVP_LIMITS.phoneMax}
                          value={form.phone}
                          onChange={(e) => handleFieldChange('phone', e.target.value)}
                          placeholder="cth. 012-3456789"
                          className="w-full rounded-xl border border-[#e892b0]/75 bg-[#ffffff] px-3.5 py-2.5 text-sm text-[#4e1228] placeholder:text-[#4e1228]/40 focus:border-[#6b1d3a] focus:outline-none"
                        />
                        {errors.phone && (
                          <p className="mt-1 text-xs font-medium text-[#9f1d45]">
                            {errors.phone}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* E-mel & Pihak Tetamu */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="rsvp-email"
                          className="block text-sm font-semibold text-[#591d36] mb-1.5"
                        >
                          Alamat E-mel (Pilihan)
                        </label>
                        <input
                          id="rsvp-email"
                          name="email"
                          type="email"
                          maxLength={RSVP_LIMITS.emailMax}
                          value={form.email}
                          onChange={(e) => handleFieldChange('email', e.target.value)}
                          placeholder="anda@contoh.com"
                          className="w-full rounded-xl border border-[#e892b0]/75 bg-[#ffffff] px-3.5 py-2.5 text-sm text-[#4e1228] placeholder:text-[#4e1228]/40 focus:border-[#6b1d3a] focus:outline-none"
                        />
                        {errors.email && (
                          <p className="mt-1 text-xs font-medium text-[#9f1d45]">
                            {errors.email}
                          </p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="rsvp-side"
                          className="block text-sm font-semibold text-[#591d36] mb-1.5"
                        >
                          Pihak Tetamu
                        </label>
                        <select
                          id="rsvp-side"
                          name="side"
                          value={form.side}
                          onChange={(e) =>
                            handleFieldChange('side', e.target.value as GuestSide)
                          }
                          className="w-full rounded-xl border border-[#e892b0]/75 bg-[#ffffff] px-3.5 py-2.5 text-sm text-[#4e1228] focus:border-[#6b1d3a] focus:outline-none"
                        >
                          <option value="bride">Keluarga Pengantin Perempuan</option>
                          <option value="groom">Keluarga Pengantin Lelaki</option>
                          <option value="friend">Rakan</option>
                          <option value="colleague">Rakan Sekerja</option>
                        </select>
                      </div>
                    </div>

                    {/* Bilangan Tetamu & Waktu Ketibaan (hanya apabila hadir) */}
                    {form.status === 'attending' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-2xl border border-[#f2c8da] bg-[#fdf4d7]/55 p-4">
                        <div>
                          <label
                            htmlFor="rsvp-guestCount"
                            className="block text-sm font-semibold text-[#591d36] mb-1.5"
                          >
                            Bilangan Tetamu (Pax) *
                          </label>
                          <select
                            id="rsvp-guestCount"
                            name="guestCount"
                            value={form.guestCount}
                            onChange={(e) =>
                              handleFieldChange('guestCount', Number(e.target.value))
      
                            className="w-full rounded-xl border border-[#e892b0]/75 bg-[#ffffff] px-3.5 py-2.5 text-sm text-[#4e1228] focus:border-[#6b1d3a] focus:outline-none"
                          >
                            {[1, 2, 3, 4, 5, 6].map((n) => (
                              <option key={n} value={n}>
                                {n} Tetamu
                              </option>
                            ))}
                          </select>
                          {errors.guestCount && (
                            <p className="mt-1 text-xs font-medium text-[#9f1d45]">
                              {errors.guestCount}
                            </p>
                          )}
                        </div>

                        <div>
                          <label
                            htmlFor="rsvp-session"
                            className="block text-sm font-semibold text-[#591d36] mb-1.5"
                          >
                            Waktu Ketibaan Pilihan
                          </label>
                          <select
                            id="rsvp-session"
                            name="sessionTime"
                            value={form.sessionTime}
                            onChange={(e) => handleFieldChange('sessionTime', e.target.value)}
                            className="w-full rounded-xl border border-[#e892b0]/75 bg-[#ffffff] px-3.5 py-2.5 text-sm text-[#4e1228] focus:border-[#6b1d3a] focus:outline-none"
                          >
                            <option value="11:00 PAGI - Ketibaan Tetamu">
                              11:00 PG · Ketibaan Tetamu
                            </option>
                            <option value="12:45 TENGAH HARI - Perarakan Pengantin">
                              12:45 TGH · Perarakan Pengantin
                            </option>
                            <option value="2:00 PETANG - Sesi Bergambar">
                              2:00 PTG · Sesi Bergambar
                            </option>
                          </select>
                        </div>

                        <div className="sm:col-span-2">
                          <label
                            htmlFor="rsvp-dietary"
                            className="block text-sm font-semibold text-[#591d36] mb-1.5"
                          >
                            Catatan Pemakanan / Permintaan Khas (Pilihan)
                          </label>
                          <input
                            id="rsvp-dietary"
                            name="dietaryNotes"
                            type="text"
                            maxLength={RSVP_LIMITS.dietaryNotesMax}
                            value={form.dietaryNotes}
                            onChange={(e) => handleFieldChange('dietaryNotes', e.target.value)}
                            placeholder="cth. Vegetarian, kerusi bayi diperlukan"
                            className="w-full rounded-xl border border-[#e892b0]/75 bg-[#ffffff] px-3.5 py-2.5 text-sm text-[#4e1228] placeholder:text-[#4e1228]/40 focus:border-[#6b1d3a] focus:outline-none"
                          />
                        </div>
                      </div>
                    )}

                    {/* Ucapan & Doa Buat Mempelai */}
                    <div>
                      <label
                        htmlFor="rsvp-wishes"
                        className="block text-sm font-semibold text-[#591d36] mb-1.5"
                      >
                        Ucapan &amp; Doa Buat Mempelai (Dipaparkan di Dinding Ucapan)
                      </label>
                      <textarea
                        id="rsvp-wishes"
                        name="wishes"
                        rows={3}
                        maxLength={RSVP_LIMITS.wishesMax}
                        value={form.wishes}
                        onChange={(e) => handleFieldChange('wishes', e.target.value)}
                        placeholder="Tuliskan ucapan indah atau doa buat Nabilah & Hidayat..."
                        className="w-full rounded-xl border border-[#e892b0]/75 bg-[#ffffff] px-3.5 py-2.5 text-sm text-[#4e1228] placeholder:text-[#4e1228]/40 focus:border-[#6b1d3a] focus:outline-none"
                      />
                      {errors.wishes && (
                        <p className="mt-1 text-xs font-medium text-[#9f1d45]">
                          {errors.wishes}
                        </p>
                      )}
                    </div>

                    {/* Maklum Balas Peribadi Pelawat Kepada Penganjur */}
                    <div className="rounded-2xl border border-[#f2c8da] bg-[#fdf7fa]/90 p-4 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-[#591d36]">
                            Maklum Balas Pelawat (Pilihan)
                          </p>
                          <p className="text-xs text-[#591d36]/75">
                            Nilaikan pengalaman kad digital ini &amp; hantar nota peribadi terus kepada tuan rumah.
                          </p>
                        </div>
                        <div className="flex items-center gap-1" role="group" aria-label="Penilaian pengalaman jemputan">
                          {[1, 2, 3, 4, 5].map((star) => {
                            const filled = (form.feedbackRating ?? 0) >= star;
                            return (
                              <button
                                key={star}
                                type="button"
                                onClick={() =>
                                  handleFieldChange(
                                    'feedbackRating',
                                    form.feedbackRating === star ? 0 : star
                                  )
                                }
                                aria-label={`Beri ${star} bintang`}
                                aria-pressed={filled}
                                className="p-1 transition-transform hover:scale-110 cursor-pointer"
                              >
                                <Star
                                  className={`h-5 w-5 ${
                                    filled
                                      ? 'fill-[#d4a017] text-[#d4a017]'
                                      : 'text-[#e892b0] hover:text-[#b23c62]'
                                  }`}
                                />
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <label htmlFor="rsvp-feedbackComment" className="sr-only">
                          Maklum Balas &amp; Cadangan Untuk Tuan Rumah
                        </label>
                        <textarea
                          id="rsvp-feedbackComment"
                          name="feedbackComment"
                          rows={3}
                          maxLength={RSVP_LIMITS.feedbackCommentMax}
                          value={form.feedbackComment ?? ''}
                          onChange={(e) =>
                            handleFieldChange('feedbackComment', e.target.value)
                          }
                          placeholder="Cadangan, pertanyaan parkir, atau maklum balas peribadi untuk penganjur..."
                          className="w-full rounded-xl border border-[#e892b0]/75 bg-[#ffffff] px-3.5 py-2 text-sm text-[#4e1228] placeholder:text-[#4e1228]/40 focus:border-[#6b1d3a] focus:outline-none"
                        />
                        {errors.feedbackComment && (
                          <p className="mt-1 text-xs font-medium text-[#9f1d45]">
                            {errors.feedbackComment}
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn-plum-silk w-full inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-sm sm:text-base font-semibold text-[#fffdf7] transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6b1d3a]"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Menyimpan RSVP Anda...</span>
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          <span>Sahkan RSVP</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </PaperLaceCard>
            </section>

            {/* Lajur Kanan: Dinding Ucapan Tetamu */}
            <aside aria-labelledby="wishes-wall-heading" className="lg:col-span-5">
              <PaperLaceCard lilySize="mixedD">
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div>
                    <p className="font-script text-3xl text-[#b23c62]">Ucapan &amp; Doa</p>
                    <h2
                      id="wishes-wall-heading"
                      className="font-display text-xl font-semibold text-[#591d36]"
                    >
                      Dinding Ucapan Tetamu
                    </h2>
                  </div>
                  <Heart className="h-5 w-5 text-[#e892b0] fill-[#fad7e3]" />
                </div>

                {/* Tab Penapis */}
                <div className="flex items-center gap-1 rounded-xl bg-[#fbe9f0] p-1 mb-5">
                  {[
                    { key: 'all', label: 'Semua' },
                    { key: 'attending', label: 'Hadir' },
                    { key: 'declining', label: 'Kiriman Doa' },
                  ].map((tab) => {
                    const active = wishFilter === tab.key;
                    return (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() =>
                          setWishFilter(tab.key as 'all' | 'attending' | 'declining')
                        }
                        className={`flex-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                          active
                            ? 'bg-[#ffffff] text-[#591d36] shadow-xs'
                            : 'text-[#591d36]/70 hover:text-[#591d36]'
                        }`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                {isLoading ? (
                  <div className="py-10 text-center text-sm text-[#591d36]/75">
                    Memuatkan ucapan tetamu...
                  </div>
                ) : loadError ? (
                  <div className="rounded-2xl border border-[#e892b0] bg-[#ffffff] p-4 text-sm text-[#8e1b42]">
                    {loadError}
                  </div>
                ) : filteredRsvps.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[#e892b0] bg-[#ffffff] p-6 text-center text-sm text-[#591d36]/75">
                    Tiada ucapan tetamu dalam paparan ini lagi. Jadilah yang pertama menghantar ucapan!
                  </div>
                ) : (
                  <ul className="space-y-3.5 max-h-[540px] overflow-y-auto pr-1">
                    {filteredRsvps.map((entry) => (
                      <li
                        key={entry.id}
                        className="rounded-2xl border border-[#f2c8da] bg-[#ffffff] p-4 shadow-2xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-display text-base font-semibold text-[#591d36]">
                              {entry.fullName}
                            </p>
                            <p className="text-xs text-[#591d36]/70 mt-0.5">
                              {SIDE_LABELS[entry.side]} <span aria-hidden="true">·</span>{' '}
                              {entry.status === 'attending' ? (
                                <span className="inline-flex items-center gap-1 font-medium text-[#4d6e3a]">
                                  <Users className="h-3 w-3" />
                                  {entry.guestCount} tetamu hadir
                                </span>
                              ) : (
                                <span className="font-medium text-[#8e415c]">
                                  Mengirimkan doa restu
                                </span>
                              )}
                            </p>
                          </div>
                          {entry.feedbackRating && entry.feedbackRating > 0 ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#fdf4d7] px-2 py-0.5 text-[11px] font-semibold text-[#591d36]">
                              <Star className="h-3 w-3 fill-[#d4a017] text-[#d4a017]" />
                              {entry.feedbackRating}
                            </span>
                          ) : null}
                        </div>

                        {entry.wishes && (
                          <p className="mt-2.5 text-sm italic text-[#591d36]/90 leading-relaxed">
                            &ldquo;{entry.wishes}&rdquo;
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-6 -mx-5 sm:-mx-9 -mb-7 sm:-mb-9">
                  <MeadowFlowerBorder />
                </div>
              </PaperLaceCard>
            </aside>
          </div>

          {/* Panel Penjejakan RSVP & Maklum Balas Penganjur */}
          <OrganizerTrackerPanel
            publicRsvps={rsvps}
            authUser={authUser}
            authReady={authReady}
          />
        </ErrorBoundary>
      </div>
    </div>
  );
}
