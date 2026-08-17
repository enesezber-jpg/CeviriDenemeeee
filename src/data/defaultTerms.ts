import { TermItem } from '../types';

export const INITIAL_DEFENSE_TERMS: TermItem[] = [
  // 3-Gram & Long Phrase terms (Top Priority)
  {
    id: 'term-1',
    tr: 'Aktif Faz Dizinli Radar',
    en: 'Active Electronically Scanned Array Radar',
    kısaltma: 'AESA',
    kategori: 'Radar & Sensör',
    notlar: '3 kelimelik tamlama - tekil kelimelerden önce eşleşmeli'
  },
  {
    id: 'term-2',
    tr: 'Atış Kontrol Radarı',
    en: 'Fire Control Radar',
    kısaltma: 'FCR',
    kategori: 'Radar & Sensör',
    notlar: '3 kelimelik tamlama - "Atış" ve "Kontrol" ayrılmamalıdır'
  },
  {
    id: 'term-3',
    tr: 'Hava Savunma Erken İhbar Radarı',
    en: 'Air Defense Early Warning Radar',
    kısaltma: 'EİR',
    kategori: 'Radar & Sensör',
    notlar: '4 kelimelik uzun tamlama'
  },
  {
    id: 'term-4',
    tr: 'Elektronik Harp Destek Tedbirleri',
    en: 'Electronic Support Measures',
    kısaltma: 'ED',
    kategori: 'Elektronik Harp',
    notlar: 'ESM / ED askeri karşılığı'
  },
  {
    id: 'term-5',
    tr: 'Elektronik Taarruz Sistemi',
    en: 'Electronic Attack System',
    kısaltma: 'ET',
    kategori: 'Elektronik Harp',
    notlar: 'EA / Jammer sistemleri'
  },
  {
    id: 'term-6',
    tr: 'Dost Düşman Tanıma Sistemi',
    en: 'Identification Friend or Foe System',
    kısaltma: 'IFF',
    kategori: 'Aviyonik & C4ISR',
    notlar: 'Mode 5 / Mode S standartları'
  },
  {
    id: 'term-7',
    tr: 'Arayüz Kontrol Dökümanı',
    en: 'Interface Control Document',
    kısaltma: null,
    kategori: 'Sistem Mühendisliği',
    notlar: 'Kısaltma yok - Asla yeni kısaltma uydurulmamalı (Kural 2)'
  },
  {
    id: 'term-8',
    tr: 'Taktik Veri Bağı Sistemi',
    en: 'Tactical Data Link System',
    kısaltma: 'TDL',
    kategori: 'Haberleşme & C4ISR',
    notlar: 'Link-16 / Link-22 standartları'
  },
  {
    id: 'term-9',
    tr: 'Elektro-Optik Keşif ve Gözetleme Sistemi',
    en: 'Electro-Optical Reconnaissance and Surveillance System',
    kısaltma: 'E/O',
    kategori: 'Optik & Sensör',
    notlar: 'FLIR / gündüz / lazer işaretleyici'
  },
  {
    id: 'term-10',
    tr: 'Kızılötesi Arayıcı Başlık',
    en: 'Infrared Seeker Head',
    kısaltma: 'IIR',
    kategori: 'Füze & Güdüm',
    notlar: 'Güdümlü mühimmat sensörü'
  },

  // 2-Gram compound terms (Medium Priority)
  {
    id: 'term-11',
    tr: 'Hava Savunma Sistemi',
    en: 'Air Defense System',
    kısaltma: 'HSS',
    kategori: 'Hava Savunma',
    notlar: 'HSS / ADS tamlaması'
  },
  {
    id: 'term-12',
    tr: 'Atış Kontrol',
    en: 'Fire Control',
    kısaltma: null,
    kategori: 'Silah Sistemleri',
    notlar: 'Kısaltma yok'
  },
  {
    id: 'term-13',
    tr: 'Komuta Kontrol',
    en: 'Command and Control',
    kısaltma: 'C2',
    kategori: 'C4ISR',
    notlar: 'C2 kısaltması'
  },
  {
    id: 'term-14',
    tr: 'Durumsal Farkındalık',
    en: 'Situational Awareness',
    kısaltma: 'SA',
    kategori: 'C4ISR',
    notlar: 'Taktik resim farkındalığı'
  },
  {
    id: 'term-15',
    tr: 'Güdüm Kiti',
    en: 'Guidance Kit',
    kısaltma: null,
    kategori: 'Mühimmat',
    notlar: 'Hassas güdüm kiti'
  },
  {
    id: 'term-16',
    tr: 'Seyrüsefer Sistemi',
    en: 'Navigation System',
    kısaltma: 'NAV',
    kategori: 'Aviyonik',
    notlar: 'INS/GPS seyrüsefer'
  },
  {
    id: 'term-17',
    tr: 'Ataletsel Seyrüsefer Sistemi',
    en: 'Inertial Navigation System',
    kısaltma: 'ANS',
    kategori: 'Aviyonik',
    notlar: 'INS / ANS karşılığı'
  },
  {
    id: 'term-18',
    tr: 'Öz Savunma Sistemi',
    en: 'Self Protection System',
    kısaltma: 'SPS',
    kategori: 'Elektronik Harp',
    notlar: 'Chaff/Flare ve radar ikaz'
  },
  {
    id: 'term-19',
    tr: 'Radar Kesit Alanı',
    en: 'Radar Cross Section',
    kısaltma: 'RKA',
    kategori: 'Radar & Sensör',
    notlar: 'RCS / RKA görünmezlik metriği'
  },
  {
    id: 'term-20',
    tr: 'Hedef Takip',
    en: 'Target Tracking',
    kısaltma: null,
    kategori: 'Radar & Sensör',
    notlar: 'Kısaltma yok'
  },
  {
    id: 'term-21',
    tr: 'Görev Bilgisayarı',
    en: 'Mission Computer',
    kısaltma: 'GB',
    kategori: 'Aviyonik',
    notlar: 'MC / GB merkezi işlem birimi'
  },
  {
    id: 'term-22',
    tr: 'Balistik Koruma',
    en: 'Ballistic Protection',
    kısaltma: null,
    kategori: 'Kara Araçları',
    notlar: 'STANAG 4569 seviyesi'
  },
  {
    id: 'term-23',
    tr: 'Lazer İkaz Alıcısı',
    en: 'Laser Warning Receiver',
    kısaltma: 'LWR',
    kategori: 'Elektronik Harp',
    notlar: 'LİS / LWR'
  },
  {
    id: 'term-24',
    tr: 'Füze İkaz Sistemi',
    en: 'Missile Warning System',
    kısaltma: 'MWS',
    kategori: 'Elektronik Harp',
    notlar: 'MWS / FİS'
  },
  {
    id: 'term-25',
    tr: 'Taktik Saha Muhabere Sistemi',
    en: 'Tactical Area Communications System',
    kısaltma: 'TASMUS',
    kategori: 'Haberleşme',
    notlar: 'Saha muhabere omurgası'
  },

  // 1-Gram single words (Base level terms)
  {
    id: 'term-26',
    tr: 'İz',
    en: 'Track',
    kısaltma: null,
    kategori: 'Radar & Taktik',
    notlar: 'Radar hedef izi (Track)'
  },
  {
    id: 'term-27',
    tr: 'Menzil',
    en: 'Range',
    kısaltma: null,
    kategori: 'Genel Teknik',
    notlar: 'Operasyonel menzil'
  },
  {
    id: 'term-28',
    tr: 'Angajman',
    en: 'Engagement',
    kısaltma: null,
    kategori: 'Silah & Doktrin',
    notlar: 'Hedefe müdahale'
  },
  {
    id: 'term-29',
    tr: 'Güdüm',
    en: 'Guidance',
    kısaltma: null,
    kategori: 'Füze & Kontrol',
    notlar: 'Füze sevk ve kontrol'
  },
  {
    id: 'term-30',
    tr: 'Kestirim',
    en: 'Direction Finding / Estimation',
    kısaltma: 'DF',
    kategori: 'Elektronik Harp',
    notlar: 'DF yön kestirimi'
  },
  {
    id: 'term-31',
    tr: 'Yankı',
    en: 'Echo / Clutter',
    kısaltma: null,
    kategori: 'Radar & Sensör',
    notlar: 'Radar kargaşa/yankı'
  },
  {
    id: 'term-32',
    tr: 'Tehdit',
    en: 'Threat',
    kısaltma: null,
    kategori: 'Taktik & Güvenlik',
    notlar: 'Tehdit değerlendirme'
  },
  {
    id: 'term-33',
    tr: 'Telsiz',
    en: 'Radio',
    kısaltma: null,
    kategori: 'Haberleşme',
    notlar: 'VHF/UHF telsiz'
  },
  {
    id: 'term-34',
    tr: 'Sorgulayıcı',
    en: 'Interrogator',
    kısaltma: null,
    kategori: 'Aviyonik & IFF',
    notlar: 'IFF sorgulayıcı birimi'
  },
  {
    id: 'term-35',
    tr: 'Cevaplayıcı',
    en: 'Transponder',
    kısaltma: 'XPNDR',
    kategori: 'Aviyonik & IFF',
    notlar: 'IFF cevaplayıcı'
  }
];

export const PRESET_DICTIONARIES: { name: string; description: string; terms: TermItem[] }[] = [
  {
    name: 'Tam Savunma Sanayii Sözlüğü (Standart)',
    description: 'Radar, Elektronik Harp, Aviyonik, Füze, Haberleşme ve C4ISR terimlerini içeren kapsamlı veri tabanı.',
    terms: INITIAL_DEFENSE_TERMS
  },
  {
    name: 'Radar ve Elektronik Harp (EW/Radar)',
    description: 'AESA, FCR, Jammer, ESM, ECM, IFF ve Radar Kesit Alanı odaklı terim seti.',
    terms: INITIAL_DEFENSE_TERMS.filter(t => t.kategori?.includes('Radar') || t.kategori?.includes('Elektronik'))
  },
  {
    name: 'C4ISR, Haberleşme ve Taktik Ağlar',
    description: 'Link-16, Komuta Kontrol, Görev Bilgisayarı ve Durumsal Farkındalık terimleri.',
    terms: INITIAL_DEFENSE_TERMS.filter(t => t.kategori?.includes('C4ISR') || t.kategori?.includes('Haberleşme') || t.kategori?.includes('Aviyonik'))
  },
  {
    name: 'Füze, Mühimmat ve Güdüm Sistemleri',
    description: 'Arayıcı başlıklar, güdüm kitleri, seyrüsefer ve balistik koruma terimleri.',
    terms: INITIAL_DEFENSE_TERMS.filter(t => t.kategori?.includes('Füze') || t.kategori?.includes('Mühimmat') || t.kategori?.includes('Kara') || t.kategori?.includes('Silah'))
  }
];
