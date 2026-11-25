import React, { useRef, useState } from 'react';
import {
  getAllRsvps,
  restoreRsvpsFromBackup,
  RsvpResponse,
} from '../services/tursoDb';

interface BackupRestorePanelProps {
  onRestoreSuccess?: () => void;
}

export const BackupRestorePanel: React.FC<BackupRestorePanelProps> = ({
  onRestoreSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Muat turun semua rekod ke fail .json
  const handleDownloadBackup = async () => {
    try {
      setLoading(true);
      setStatusMsg(null);
      const records = await getAllRsvps();

      const payload = {
        app: 'Wedding-Invitation-NH',
        exportedAt: new Date().toISOString(),
        totalRecords: records.length,
        records,
      };

      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const timestamp = new Date().toISOString().slice(0, 16).replace(':', '-');

      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-rsvp-${timestamp}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setStatusMsg(`Berjaya muat turun backup (${records.length} rekod).`);
    } catch (err) {
      console.error(err);
      setStatusMsg('Ralat semasa menjana fail backup.');
    } finally {
      setLoading(false);
    }
  };

  // Baca dan pulihkan rekod daripada fail .json yang dimuat naik
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      setStatusMsg(null);
      const text = await file.text();
      const parsed = JSON.parse(text);
      const records: RsvpResponse[] = Array.isArray(parsed)
        ? parsed
        : parsed.records;

      if (!Array.isArray(records) || records.length === 0) {
        setStatusMsg('Fail JSON tidak mempunyai rekod RSVP yang sah.');
        return;
      }

      const confirmed = window.confirm(
        `Sahkan pemulihan ${records.length} rekod RSVP ke dalam database Turso?`
      );
      if (!confirmed) return;

      const count = await restoreRsvpsFromBackup(records);
      setStatusMsg(`Berjaya memulihkan ${count} rekod ke Turso.`);
      onRestoreSuccess?.();
    } catch (err) {
      console.error(err);
      setStatusMsg('Fail JSON rosak atau tidak sepadan.');
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="p-4 rounded-xl border border-amber-500/30 bg-neutral-900/80 text-neutral-100 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-amber-400">
            Backup &amp; Pemulihan Data RSVP
          </h3>
          <p className="text-xs text-neutral-400">
            Simpan salinan luar talian (.json) atau pulihkan rekod ke Turso.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleDownloadBackup}
          disabled={loading}
          className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50"
        >
          {loading ? 'Memproses...' : 'Download Backup (.json)'}
        </button>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 border border-neutral-600 text-neutral-100 disabled:opacity-50"
        >
          Restore dari Backup (.json)
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      {statusMsg && (
        <p className="text-xs text-amber-300 bg-amber-950/40 px-3 py-1.5 rounded">
          {statusMsg}
        </p>
      )}
    </div>
  );
};
