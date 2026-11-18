import React from 'react';

interface FlowerConfig {
  id: number;
  left: string;
  size: number;
  duration: string;
  delay: string;
  driftX: string;
  spinStart: string;
  spinMid: string;
  spinEnd: string;
  opacity: number;
}

interface ButterflyConfig {
  id: number;
  top: string;
  size: number;
  duration: string;
  delay: string;
  flapDuration: string;
  direction: 'ltr' | 'rtl';
}

const FLOWERS: FlowerConfig[] = [
  { id: 1, left: '3%', size: 24, duration: '14s', delay: '-2s', driftX: '38px', spinStart: '-12deg', spinMid: '130deg', spinEnd: '290deg', opacity: 0.88 },
  { id: 2, left: '9%', size: 52, duration: '18s', delay: '-9s', driftX: '-34px', spinStart: '18deg', spinMid: '175deg', spinEnd: '350deg', opacity: 0.84 },
  { id: 3, left: '16%', size: 30, duration: '13.5s', delay: '-5s', driftX: '44px', spinStart: '0deg', spinMid: '145deg', spinEnd: '310deg', opacity: 0.9 },
  { id: 4, left: '23%', size: 64, duration: '21s', delay: '-14s', driftX: '-46px', spinStart: '-24deg', spinMid: '120deg', spinEnd: '260deg', opacity: 0.78 },
  { id: 5, left: '31%', size: 22, duration: '12.5s', delay: '-1s', driftX: '30px', spinStart: '28deg', spinMid: '190deg', spinEnd: '360deg', opacity: 0.92 },
  { id: 6, left: '39%', size: 44, duration: '16.5s', delay: '-11s', driftX: '-38px', spinStart: '-8deg', spinMid: '150deg', spinEnd: '315deg', opacity: 0.82 },
  { id: 7, left: '47%', size: 26, duration: '15s', delay: '-6s', driftX: '34px', spinStart: '14deg', spinMid: '165deg', spinEnd: '330deg', opacity: 0.86 },
  { id: 8, left: '56%', size: 58, duration: '19.5s', delay: '-15s', driftX: '-42px', spinStart: '-16deg', spinMid: '140deg', spinEnd: '280deg', opacity: 0.8 },
  { id: 9, left: '64%', size: 28, duration: '13.8s', delay: '-3.5s', driftX: '36px', spinStart: '22deg', spinMid: '180deg', spinEnd: '345deg', opacity: 0.9 },
  { id: 10, left: '72%', size: 46, duration: '17.2s', delay: '-10s', driftX: '-32px', spinStart: '-20deg', spinMid: '135deg', spinEnd: '295deg', opacity: 0.84 },
  { id: 11, left: '80%', size: 22, duration: '14.4s', delay: '-7.5s', driftX: '28px', spinStart: '10deg', spinMid: '170deg', spinEnd: '340deg', opacity: 0.88 },
  { id: 12, left: '87%', size: 60, duration: '20s', delay: '-16s', driftX: '-38px', spinStart: '-14deg', spinMid: '145deg', spinEnd: '300deg', opacity: 0.8 },
  { id: 13, left: '93%', size: 34, duration: '15.6s', delay: '-4.2s', driftX: '-26px', spinStart: '16deg', spinMid: '160deg', spinEnd: '325deg', opacity: 0.88 },
  { id: 14, left: '52%', size: 38, duration: '16.2s', delay: '-12.5s', driftX: '32px', spinStart: '-10deg', spinMid: '155deg', spinEnd: '310deg', opacity: 0.85 },
];

const BUTTERFLIES: ButterflyConfig[] = [
  { id: 1, top: '12%', size: 34, duration: '22s', delay: '-3s', flapDuration: '0.38s', direction: 'ltr' },
  { id: 2, top: '26%', size: 64, duration: '28s', delay: '-14s', flapDuration: '0.52s', direction: 'rtl' },
  { id: 3, top: '42%', size: 44, duration: '24s', delay: '-8s', flapDuration: '0.44s', direction: 'ltr' },
  { id: 4, top: '57%', size: 70, duration: '31s', delay: '-20s', flapDuration: '0.56s', direction: 'rtl' },
  { id: 5, top: '71%', size: 30, duration: '19s', delay: '-5s', flapDuration: '0.35s', direction: 'ltr' },
  { id: 6, top: '83%', size: 52, duration: '26s', delay: '-16s', flapDuration: '0.48s', direction: 'rtl' },
  { id: 7, top: '19%', size: 48, duration: '25s', delay: '-19s', flapDuration: '0.46s', direction: 'ltr' },
];

export function FloatingPetals() {
  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden z-20"
      aria-hidden="true"
    >
      {/* Drifting watercolor pink lilies in varied small & large sizes */}
      {FLOWERS.map((flower) => (
        <div
          key={`flower-${flower.id}`}
          className="absolute -top-20 animate-petal"
          style={
            {
              left: flower.left,
              '--petal-duration': flower.duration,
              '--petal-delay': flower.delay,
              '--drift-x': flower.driftX,
              '--spin-start': flower.spinStart,
              '--spin-mid': flower.spinMid,
              '--spin-end': flower.spinEnd,
              '--item-opacity': String(flower.opacity),
            } as React.CSSProperties
          }
        >
          <img
            src="/assets/aistudio/flower-Photoroom_39d640d9.png"
            alt=""
            aria-hidden="true"
            referrerPolicy="no-referrer"
            style={{ width: `${flower.size}px`, height: 'auto' }}
            className="object-contain drop-shadow-[0_4px_8px_rgba(107,29,58,0.12)]"
          />
        </div>
      ))}

      {/* Lively gliding watercolor butterflies in varied small & large sizes */}
      {BUTTERFLIES.map((butterfly) => (
        <div
          key={`butterfly-${butterfly.id}`}
          className={`absolute -left-24 ${
            butterfly.direction === 'ltr' ? 'animate-butterfly' : 'animate-butterfly-reverse'
          }`}
          style={
            {
              top: butterfly.top,
              '--fly-duration': butterfly.duration,
              '--fly-delay': butterfly.delay,
            } as React.CSSProperties
          }
        >
          <div
            className="animate-wing"
            style={{ '--flap-duration': butterfly.flapDuration } as React.CSSProperties}
          >
            <img
              src="/assets/aistudio/butterfly-Photoroom_e923260e.png"
              alt=""
              aria-hidden="true"
              referrerPolicy="no-referrer"
              style={{
                width: `${butterfly.size}px`,
                height: 'auto',
                transform: butterfly.direction === 'rtl' ? 'scaleX(-1)' : undefined,
              }}
              className="object-contain drop-shadow-[0_6px_10px_rgba(107,29,58,0.14)]"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
