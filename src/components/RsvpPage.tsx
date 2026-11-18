import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  FileSpreadsheet,
  Heart,
  Link2,
  Loader2,
  LogOut,
  PlusCircle,
  RefreshCw,
  Send,
  Users,
} from 'lucide-react';
import type { User } from 'firebase/auth';
import {
  CardFlowerCorners,
  MeadowFlowerBorder,
  SwirledMonogram,
} from './BotanicalDecor';
import { PaperLaceCard } from './PaperLaceCard';
import { WEDDING_DETAILS } from '../data/weddingData';
import {
  getAccessToken,
  googleSignIn,
  initAuth,
  logout as firebaseLogout,
} from '../utils/firebaseAuth';
import {
  appendRsvpToSheet,
  createRsvpSpreadsheet,
  extractSpreadsheetId,
  fetchSpreadsheetMetadata,
  findOrCreateRsvpSpreadsheet,
  GoogleAuthExpiredError,
  readStoredSpreadsheetMeta,
  syncMissingRsvpsToSheet,
  writeStoredSpreadsheetMeta,
  type LinkedSpreadsheetMeta,
} from '../utils/googleSheetsRsvp';
import { submitRsvpWithFallback } from '../utils/rsvpStorage';
import {
  normalizeRsvpPayload,
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
  onRsvpSubmitted: (updatedList: RsvpRecord[], created: RsvpRecord) => void;
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
  onRsvpSubmitted,
  onBackToInvitation,
}: RsvpPageProps) {
  const [form, setForm] = useState<RsvpFormInput>(INITIAL_FORM);
  const [errors, setErrors] = useState<RsvpValidationErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRecord, setSubmittedRecord] = useState<RsvpRecord | null>(null);
  const [submittedToSheet, setSubmittedToSheet] = useState<boolean>(false);
  const [wishFilter, setWishFilter] = useState<'all' | 'attending' | 'declining'>('all');

  // Google Sheets & Drive Auth State (token cached strictly in memory)
  const [needsAuth, setNeedsAuth] = useState<boolean>(true);
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [sheetMeta, setSheetMeta] = useState<LinkedSpreadsheetMeta | null>(() =>
    readStoredSpreadsheetMeta()
  );
  const [sheetStatusMsg, setSheetStatusMsg] = useState<string | null>(null);
  const [sheetErrorMsg, setSheetErrorMsg] = useState<string | null>(null);
  const [isSyncingSheets, setIsSyncingSheets] = useState<boolean>(false);
  const [customSheetInput, setCustomSheetInput] = useState<string>('');
  const [pendingConfirmAction, setPendingConfirmAction] = useState<{
    title: string;
    description: string;
    confirmLabel: string;
    onConfirm: () => Promise<void>;
  } | null>(null);

  useEffect(() => {
    const unsubscribe = initAuth(
      (user) => {
        setGoogleUser(user);
        setNeedsAuth(false);
      },
      () => {
        setNeedsAuth(true);
      },
      (user) => {
        setGoogleUser(user);
      }
    );
    return () => unsubscribe();
  }, []);

  const ensureLinkedSpreadsheet = async (
    token: string,
    email?: string | null
  ): Promise<LinkedSpreadsheetMeta> => {
    const { meta, createdNew } = await findOrCreateRsvpSpreadsheet(token, email || undefined);
    setSheetMeta(meta);
    setSheetStatusMsg(
      createdNew
        ? `Hamparan baharu "${meta.title}" telah dicipta menggunakan akaun ${
            email || 'Google anda'
          }.`
        : `Disambungkan ke hamparan "${meta.title}".`
    );
    return meta;
  };

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    setSheetErrorMsg(null);
    setSheetStatusMsg(null);
    try {
      const result = await googleSignIn();
      setGoogleUser(result.user);
      setNeedsAuth(false);
      const meta = await ensureLinkedSpreadsheet(result.accessToken, result.user.email);
      // Offer immediate sync of existing local/server RSVPs if any
      if (rsvps.length > 0) {
        const synced = await syncMissingRsvpsToSheet(result.accessToken, meta, rsvps);
        if (synced.addedCount > 0) {
          setSheetStatusMsg(
            `${synced.addedCount} rekod RSVP & ucapan berjaya disimpan ke Google Sheets "${synced.meta.title}".`
          );
        }
      }
    } catch (err) {
      setSheetErrorMsg(
        err instanceof Error && err.message
          ? err.message
          : 'Log masuk Google gagal. Sila cuba lagi.'
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogout = async () => {
    await firebaseLogout();
    setGoogleUser(null);
    setNeedsAuth(true);
    setSheetStatusMsg(null);
    setSheetErrorMsg(null);
  };

  const requestSyncAllConfirmation = () => {
    const activeTitle = sheetMeta?.title || 'RSVP & Ucapan - Nabilah & Hidayat';
    setPendingConfirmAction({
      title: 'Segerakkan Semua Rekod RSVP ke Google Sheets?',
      description: `Tindakan ini akan menyemak dan menambah sehingga ${rsvps.length} rekod RSVP serta ucapan tetamu yang belum direkodkan ke dalam helaian Google Sheets "${activeTitle}".`,
      confirmLabel: 'Ya, Segerakkan Sekarang',
      onConfirm: async () => {
        const token = await getAccessToken();
        if (!token) {
          setNeedsAuth(true);
          setSheetErrorMsg('Sesi Google anda telah tamat. Sila log masuk semula.');
          return;
        }
        setIsSyncingSheets(true);
        setSheetErrorMsg(null);
        try {
          const meta =
            sheetMeta || (await ensureLinkedSpreadsheet(token, googleUser?.email));
          const res = await syncMissingRsvpsToSheet(token, meta, rsvps);
          setSheetMeta(res.meta);
          setSheetStatusMsg(
            res.addedCount > 0
              ? `${res.addedCount} rekod baharu berjaya disimpan ke Google Sheets.`
              : 'Semua rekod RSVP dan ucapan sudah pun disimpan dalam Google Sheets.'
          );
        } catch (err) {
          if (err instanceof GoogleAuthExpiredError) {
            setNeedsAuth(true);
          }
          setSheetErrorMsg(
            err instanceof Error ? err.message : 'Gagal menyegerakkan ke Google Sheets.'
          );
        } finally {
          setIsSyncingSheets(false);
        }
      },
    });
  };

  const requestCreateNewSheetConfirmation = () => {
    setPendingConfirmAction({
      title: 'Cipta Hamparan Google Sheets Baharu?',
      description: `Satu fail Google Sheets baharu bertajuk "RSVP & Ucapan - Nabilah & Hidayat" akan dicipta di bawah akaun ${
        googleUser?.email || 'Google anda'
      } dan dipautkan sebagai destinasi simpanan RSVP yang aktif.`,
      confirmLabel: 'Cipta Hamparan Baharu',
      onConfirm: async () => {
        const token = await getAccessToken();
        if (!token) {
          setNeedsAuth(true);
          setSheetErrorMsg('Sesi Google anda telah tamat. Sila log masuk semula.');
          return;
        }
        setIsSyncingSheets(true);
        setSheetErrorMsg(null);
        try {
          const created = await createRsvpSpreadsheet(token, googleUser?.email || undefined);
          writeStoredSpreadsheetMeta(created);
          setSheetMeta(created);
          const synced = await syncMissingRsvpsToSheet(token, created, rsvps);
          setSheetStatusMsg(
            `Hamparan baharu "${created.title}" dicipta dan ${synced.addedCount} rekod RSVP disimpan.`
          );
        } catch (err) {
          if (err instanceof GoogleAuthExpiredError) {
            setNeedsAuth(true);
          }
          setSheetErrorMsg(
            err instanceof Error ? err.message : 'Gagal mencipta Google Sheets baharu.'
          );
        } finally {
          setIsSyncingSheets(false);
        }
      },
    });
  };

  const requestLinkExistingSheetConfirmation = () => {
    const extractedId = extractSpreadsheetId(customSheetInput);
    if (!extractedId) {
      setSheetErrorMsg('Sila masukkan pautan URL atau ID Google Sheets yang sah.');
      return;
    }
    setPendingConfirmAction({
      title: 'Pautkan & Segerakkan ke Google Sheets Pilihan?',
      description: `Website akan membaca helaian pertama pada Google Sheets ID "${extractedId}", memastikan tajuk lajur tersedia, dan menyegerakkan rekod RSVP tetamu ke dalamnya.`,
      confirmLabel: 'Pautkan Hamparan Ini',
      onConfirm: async () => {
        const token = await getAccessToken();
        if (!token) {
          setNeedsAuth(true);
          setSheetErrorMsg('Sesi Google anda telah tamat. Sila log masuk semula.');
          return;
        }
        setIsSyncingSheets(true);
        setSheetErrorMsg(null);
        try {
          const meta = await fetchSpreadsheetMetadata(
            token,
            extractedId,
            googleUser?.email || undefined
          );
          writeStoredSpreadsheetMeta(meta);
          setSheetMeta(meta);
          setCustomSheetInput('');
          const synced = await syncMissingRsvpsToSheet(token, meta, rsvps);
          setSheetStatusMsg(
            `Berjaya dipautkan ke "${meta.title}" (${synced.addedCount} rekod ditambah).`
          );
        } catch (err) {
          if (err instanceof GoogleAuthExpiredError) {
            setNeedsAuth(true);
          }
          setSheetErrorMsg(
            err instanceof Error
              ? err.message
              : 'Tidak dapat mengakses hamparan tersebut. Pastikan ia milik akaun Google anda.'
          );
        } finally {
          setIsSyncingSheets(false);
        }
      },
    });
  };

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
    setSubmittedToSheet(false);

    try {
      const payload = normalizeRsvpPayload(form);
      const data = await submitRsvpWithFallback(payload);
      onRsvpSubmitted(data.rsvps, data.rsvp);

      // Automatically save to Google Sheets if authenticated token is available
      const token = await getAccessToken();
      if (token) {
        try {
          const activeMeta =
            sheetMeta || (await ensureLinkedSpreadsheet(token, googleUser?.email));
          const appended = await appendRsvpToSheet(token, activeMeta, data.rsvp);
          setSheetMeta(appended.meta);
          setSubmittedToSheet(true);
          setSheetStatusMsg(
            `Maklumat RSVP "${data.rsvp.fullName}" berjaya disimpan terus ke Google Sheets "${appended.meta.title}".`
          );
        } catch (sheetErr) {
          if (sheetErr instanceof GoogleAuthExpiredError) {
            setNeedsAuth(true);
          }
          setSheetErrorMsg(
            sheetErr instanceof Error
              ? `RSVP direkodkan, namun gagal disegerak ke Google Sheets: ${sheetErr.message}`
              : 'RSVP direkodkan, namun penyegerakan Google Sheets gagal.'
          );
        }
      }

      setSubmittedRecord(data.rsvp);
      setForm(INITIAL_FORM);
      setErrors({});
    } catch (err) {
      setSubmitError(
        err instanceof Error && err.message
          ? err.message
          : 'Tidak dapat menghubungi pelayan RSVP buat masa ini. Sila cuba lagi.'
      );
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Lajur Kiri: Borang Pengesahan RSVP */}
          <section aria-labelledby="rsvp-form-heading" className="lg:col-span-7">
            <PaperLaceCard lilySize="mixedB">
              {submittedRecord ? (
                <div className="py-6 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#fdf4d7] border-2 border-[#e892b0] text-[#591d36]">
                    <CheckCircle2 className="h-9 w-9 text-[#5a8044]" />
                  </div>
                  <p className="font-script text-4xl text-[#591d36]">Terima Kasih!</p>
                  <h2
                    id="rsvp-form-heading"
                    className="font-display text-2xl font-semibold text-[#591d36] mt-1"
                  >
                    RSVP Anda Telah Direkodkan
                  </h2>
                  <p className="mt-3 text-sm sm:text-base text-[#591d36]/85 max-w-md mx-auto leading-relaxed">
                    Terima kasih,{' '}
                    <span className="font-semibold">{submittedRecord.fullName}</span>.{' '}
                    {submittedRecord.status === 'attending'
                      ? `Kami telah menempah tempat untuk ${submittedRecord.guestCount} tetamu (${submittedRecord.sessionTime}).`
                      : 'Kami amat menghargai doa restu serta ingatan tulus anda dari jauh.'}
                  </p>
                  {submittedToSheet && sheetMeta && (
                    <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#fdf4d7] border border-[#e892b0]/50 px-3.5 py-1 text-xs font-medium text-[#4e6b38]">
                      <FileSpreadsheet className="h-3.5 w-3.5" />
                      <span>Tersimpan automatik ke Google Sheets ({sheetMeta.title})</span>
                    </p>
                  )}

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
                          }
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
                      Ucapan &amp; Doa Buat Mempelai
                    </label>
                    <textarea
                      id="rsvp-wishes"
                      name="wishes"
                      rows={3}
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

        {/* Integrasi Google Sheets Penganjur */}
        <section
          aria-labelledby="google-sheets-heading"
          className="mt-10 mx-auto max-w-4xl"
        >
          <PaperLaceCard lilySize="sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#f2c8da] pb-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#fdf4d7] border border-[#e892b0]/60 text-[#591d36]">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div>
                  <h2
                    id="google-sheets-heading"
                    className="font-display text-lg sm:text-xl font-semibold text-[#591d36]"
                  >
                    Simpanan Rekod Google Sheets
                  </h2>
                  <p className="text-xs sm:text-sm text-[#591d36]/80 mt-0.5">
                    Pautkan akaun Google anda untuk mencipta hamparan RSVP secara automatik jika belum wujud dan menyimpan semua maklum balas serta ucapan tetamu terus ke Google Sheets.
                  </p>
                </div>
              </div>

              {!needsAuth && googleUser ? (
                <button
                  type="button"
                  onClick={handleGoogleLogout}
                  className="btn-ivory-silk inline-flex items-center gap-1.5 self-start sm:self-center rounded-full px-4 py-2 text-xs font-semibold text-[#591d36] transition-all active:scale-95 cursor-pointer shrink-0"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Log Keluar</span>
                </button>
              ) : null}
            </div>

            {sheetErrorMsg && (
              <div
                role="alert"
                className="mt-4 rounded-2xl border border-[#b23c62] bg-[#fdf2f7] px-4 py-3 text-xs sm:text-sm text-[#8e1b42]"
              >
                {sheetErrorMsg}
              </div>
            )}

            {sheetStatusMsg && (
              <div className="mt-4 rounded-2xl border border-[#7b9a65]/50 bg-[#fdf4d7]/70 px-4 py-3 text-xs sm:text-sm text-[#4e6b38]">
                {sheetStatusMsg}
              </div>
            )}

            {needsAuth ? (
              <div className="mt-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-[#f2c8da] bg-[#ffffff]/90 p-4">
                <div>
                  <p className="font-display text-sm font-semibold text-[#591d36]">
                    Sambungkan Akaun Google Penganjur
                  </p>
                  <p className="text-xs text-[#591d36]/75 mt-1">
                    {googleUser?.email
                      ? `Log masuk sebagai ${googleUser.email} untuk mengaktifkan simpanan langsung ke Google Sheets.`
                      : 'Tekan butang di sebelah untuk membenarkan akses Google Sheets dan Google Drive bagi helaian RSVP anda.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isLoggingIn}
                  className="gsi-material-button shrink-0"
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
                      {isLoggingIn ? 'Menyambung...' : 'Sign in with Google'}
                    </span>
                    <span style={{ display: 'none' }}>Sign in with Google</span>
                  </div>
                </button>
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-[#f2c8da] bg-[#ffffff]/90 p-4">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-[#591d36]/75">
                      Disambungkan sebagai:{' '}
                      <span className="font-semibold text-[#591d36]">
                        {googleUser?.email || 'Akaun Google'}
                      </span>
                    </p>
                    <p className="font-display text-sm sm:text-base font-semibold text-[#591d36]">
                      {sheetMeta
                        ? `${sheetMeta.title} (Tab: ${sheetMeta.sheetName})`
                        : 'Hamparan belum dipilih'}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {sheetMeta?.spreadsheetUrl && (
                      <a
                        href={sheetMeta.spreadsheetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-butter-silk inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold text-[#4e1228] transition-all active:scale-95"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>Buka Google Sheets</span>
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={requestSyncAllConfirmation}
                      disabled={isSyncingSheets}
                      className="btn-plum-silk inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold text-[#fffdf7] transition-all active:scale-95 cursor-pointer disabled:opacity-60"
                    >
                      <RefreshCw
                        className={`h-3.5 w-3.5 ${isSyncingSheets ? 'animate-spin' : ''}`}
                      />
                      <span>Segerakkan Rekod ({rsvps.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={requestCreateNewSheetConfirmation}
                      disabled={isSyncingSheets}
                      className="btn-blush-silk inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold text-[#591d36] transition-all active:scale-95 cursor-pointer disabled:opacity-60"
                    >
                      <PlusCircle className="h-3.5 w-3.5" />
                      <span>Cipta Hamparan Baharu</span>
                    </button>
                  </div>
                </div>

                {/* Pautkan hamparan sedia ada melalui URL atau ID */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={customSheetInput}
                    onChange={(e) => setCustomSheetInput(e.target.value)}
                    placeholder="Pilihan: Tampal URL atau ID Google Sheets sedia ada..."
                    aria-label="URL atau ID Google Sheets sedia ada"
                    className="flex-1 rounded-xl border border-[#e892b0]/75 bg-[#ffffff] px-3.5 py-2 text-xs sm:text-sm text-[#4e1228] placeholder:text-[#4e1228]/45 focus:border-[#6b1d3a] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={requestLinkExistingSheetConfirmation}
                    disabled={isSyncingSheets || !customSheetInput.trim()}
                    className="btn-ivory-silk inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold text-[#591d36] transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    <Link2 className="h-3.5 w-3.5" />
                    <span>Pautkan Hamparan</span>
                  </button>
                </div>
              </div>
            )}
          </PaperLaceCard>
        </section>
      </div>

      {/* Modal Pengesahan Sebelum Mengubah Data Google Sheets */}
      {pendingConfirmAction && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="sheets-confirm-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-md rounded-3xl border-2 border-[#e892b0] bg-[#fffdf7] p-6 shadow-2xl animate-card-reveal">
            <h3
              id="sheets-confirm-title"
              className="font-display text-lg font-semibold text-[#591d36]"
            >
              {pendingConfirmAction.title}
            </h3>
            <p className="mt-2 text-sm text-[#591d36]/85 leading-relaxed">
              {pendingConfirmAction.description}
            </p>
            <div className="mt-5 flex flex-wrap justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setPendingConfirmAction(null)}
                className="btn-ivory-silk rounded-full px-4 py-2 text-xs sm:text-sm font-semibold text-[#591d36] cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={async () => {
                  const action = pendingConfirmAction.onConfirm;
                  setPendingConfirmAction(null);
                  await action();
                }}
                className="btn-plum-silk rounded-full px-5 py-2 text-xs sm:text-sm font-semibold text-[#fffdf7] cursor-pointer"
              >
                {pendingConfirmAction.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
