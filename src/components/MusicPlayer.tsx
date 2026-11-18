import React, { useEffect, useRef, useState } from 'react';
import { Music, VolumeX } from 'lucide-react';

export function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const userPausedRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const audio = new Audio('/assets/wedding-piano.mp3');
    audio.loop = true;
    audio.volume = 0.45;
    audioRef.current = audio;

    let cancelled = false;

    const tryAutoPlay = async () => {
      if (cancelled || userPausedRef.current || !audio.paused) return;
      try {
        await audio.play();
        if (!cancelled) {
          setIsPlaying(true);
          removeUnlockListeners();
        }
      } catch {
        // Browser blocked unmuted autoplay; keep listeners until first gesture
      }
    };

    const handleFirstGesture = () => {
      void tryAutoPlay();
    };

    const removeUnlockListeners = () => {
      window.removeEventListener('pointerdown', handleFirstGesture, true);
      window.removeEventListener('keydown', handleFirstGesture, true);
      window.removeEventListener('touchstart', handleFirstGesture, true);
    };

    window.addEventListener('pointerdown', handleFirstGesture, { capture: true, passive: true });
    window.addEventListener('keydown', handleFirstGesture, { capture: true, passive: true });
    window.addEventListener('touchstart', handleFirstGesture, { capture: true, passive: true });

    void tryAutoPlay();

    return () => {
      cancelled = true;
      removeUnlockListeners();
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  const toggleMusic = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      userPausedRef.current = true;
      audio.pause();
      setIsPlaying(false);
    } else {
      userPausedRef.current = false;
      try {
        await audio.play();
        setIsPlaying(true);
      } catch {
        setIsPlaying(false);
      }
    }
  };

  return (
    <button
      type="button"
      onClick={toggleMusic}
      title={isPlaying ? 'Jeda muzik piano perkahwinan' : 'Mainkan muzik piano perkahwinan'}
      aria-label={isPlaying ? 'Jeda muzik piano perkahwinan' : 'Mainkan muzik piano perkahwinan'}
      aria-pressed={isPlaying}
      className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full shadow-lg backdrop-blur-sm transition-transform duration-200 hover:scale-105 active:scale-95 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6b1d3a] ${
        isPlaying
          ? 'btn-blush-silk border-2 border-[#b23c62] text-[#6b1d3a]'
          : 'btn-ivory-silk border-2 border-[#e892b0]/80 text-[#6b1d3a]'
      }`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute inset-1 rounded-full border border-dashed ${
          isPlaying
            ? 'border-[#b23c62]/65 animate-[spin_5s_linear_infinite] motion-reduce:animate-none'
            : 'border-[#e892b0]/55'
        }`}
      />
      {isPlaying ? (
        <Music className="relative z-10 h-5 w-5 sm:h-6 sm:w-6 text-[#6b1d3a]" />
      ) : (
        <VolumeX className="relative z-10 h-5 w-5 text-[#6b1d3a]/85" />
      )}
    </button>
  );
}
