export interface FamilyContact {
  role: string;
  phone: string;
  telHref: string;
}

export interface ScheduleItem {
  time: string;
  title: string;
  description: string;
}

export interface OutfitInspiration {
  id: string;
  title: string;
  subtitle: string;
  image: string;
}

export interface PastelSwatch {
  name: string;
  hex: string;
  borderHex: string;
  note: string;
}

export const WEDDING_DETAILS = {
  bride: 'Nabilah',
  groom: 'Hidayat',
  monogram: 'H N',
  parentsLine1: 'Mohd Yusof Bin Zainal',
  parentsLine2: 'Jamaayah Binti Ahmadon',
  dateDisplay: '27 Disember 2026',
  dayDisplay: 'Ahad, 27 Disember 2026',
  venueTitle: 'Royale Palace, Cyberjaya',
  venueFullAddress:
    'Royale Palace, Level 10, Skytech Tower, 2, Jalan Teknokrat 2, Cyber 4, 63000 Cyberjaya, Selangor',
  googleMapsUrl:
    'https://www.google.com/maps/search/?api=1&query=Royale+Palace+Skytech+Tower+Jalan+Teknokrat+2+Cyberjaya+Selangor',
  wazeUrl:
    'https://waze.com/ul?q=Royale%20Palace%20Skytech%20Tower%20Cyberjaya&navigate=yes',
  googleCalendarUrl:
    'https://calendar.google.com/calendar/render?action=TEMPLATE&text=Majlis+Perkahwinan+Nabilah+%26+Hidayat&dates=20261227T030000Z/20261227T080000Z&details=Walimatulurus+meraikan+penyatuan+Nabilah+%26+Hidayat.&location=Royale+Palace,+Level+10,+Skytech+Tower,+2,+Jalan+Teknokrat+2,+Cyber+4,+63000+Cyberjaya,+Selangor',
};

export const FAMILY_CONTACTS: FamilyContact[] = [
  { role: 'Ayah Pengantin', phone: '019-2700882', telHref: 'tel:+60192700882' },
  { role: 'Ibu Pengantin', phone: '013-2497603', telHref: 'tel:+60132497603' },
  { role: 'Abang Pengantin', phone: '013-5103151', telHref: 'tel:+60135103151' },
  { role: 'Kakak Pengantin', phone: '017-3795356', telHref: 'tel:+60173795356' },
];

export const WEDDING_SCHEDULE: ScheduleItem[] = [
  {
    time: '11:00 PAGI',
    title: 'Ketibaan Para Tetamu',
    description: 'Sambutan mesra tetamu, ruang bergambar flora & jamuan ringan',
  },
  {
    time: '12:45 TENGAH HARI',
    title: 'Perarakan Masuk Pengantin',
    description: 'Bacaan doa selamat, paluan kompang & santapan beradab',
  },
  {
    time: '2:00 PETANG',
    title: 'Sesi Bergambar',
    description: 'Potret keluarga & ucapan tahniah bersama pasangan mempelai',
  },
  {
    time: '4:00 PETANG',
    title: 'Majlis Bersurai',
    description: 'Ucapan terima kasih & pemberian cenderahati buat tetamu',
  },
];

export const DRESS_CODE_OUTFITS: OutfitInspiration[] = [
  {
    id: 'outfit-1',
    title: 'Baju Melayu & Sampin Klasik',
    subtitle: 'Pakaian tradisional lelaki yang kemas',
    image: '/assets/outfit-1.jpg',
  },
  {
    id: 'outfit-2',
    title: 'Kurta Pastel Lilac',
    subtitle: 'Gaya kasual kemas dan sopan',
    image: '/assets/outfit-2.jpg',
  },
  {
    id: 'outfit-3',
    title: 'Baju Melayu Biru Lembut',
    subtitle: 'Busana formal rona lembut',
    image: '/assets/outfit-3.jpg',
  },
  {
    id: 'outfit-4',
    title: 'Kebaya Sage & Orkid',
    subtitle: 'Renda bersulam warna pastel',
    image: '/assets/outfit-4.jpg',
  },
  {
    id: 'outfit-5',
    title: 'Baju Kurung Bunga Mawar',
    subtitle: 'Motif taman yang romantis',
    image: '/assets/outfit-5.jpg',
  },
  {
    id: 'outfit-6',
    title: 'Gaun Renda Biru Langit',
    subtitle: 'Busana formal pastel yang anggun',
    image: '/assets/outfit-6.jpg',
  },
];

export const PASTEL_SWATCHES: PastelSwatch[] = [
  {
    name: 'Hijau Sage Lembut',
    hex: '#C9E0BC',
    borderHex: '#A2C291',
    note: 'Rona daun taman pastel',
  },
  {
    name: 'Kuning Mentega',
    hex: '#FCEB9D',
    borderHex: '#E7CA63',
    note: 'Rona cahaya mentari hangat',
  },
  {
    name: 'Pic Aprikot',
    hex: '#FAD0B4',
    borderHex: '#E4A884',
    note: 'Kehangatan kelopak bunga lembut',
  },
  {
    name: 'Merah Jambu Blush',
    hex: '#F8C4D4',
    borderHex: '#DF95AE',
    note: 'Rona kelopak mawar utama',
  },
  {
    name: 'Biru Muda',
    hex: '#BCE2F5',
    borderHex: '#89BDD9',
    note: 'Rona langit pagi pastel',
  },
  {
    name: 'Mawar Lili',
    hex: '#F39CB8',
    borderHex: '#D17090',
    note: 'Sentuhan merah jambu romantis',
  },
];
