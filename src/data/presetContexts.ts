import { ReferenceContextItem } from '../types';

export const PRESET_REFERENCE_CONTEXTS: ReferenceContextItem[] = [
  {
    id: 'ctx-icd',
    title: 'Arayüz Kontrol Dökümanı (ICD / AKD)',
    category: 'ICD',
    tone: 'technical_interface',
    description: 'Sistem bileşenleri arası sinyal, protokol ve mesajlaşma formatı bağlamı.',
    sourceSnippet: 'Atış Kontrol Radarı tarafından tespit edilen her bir hedef izi, Taktik Veri Bağı Sistemi üzerinden Görev Bilgisayarına saniyede 20 kez aktarılacaktır.',
    targetSnippet: 'Each target track detected by the Fire Control Radar (FCR) shall be transmitted to the Mission Computer (GB) via the Tactical Data Link System (TDL) at a rate of 20 Hz.'
  },
  {
    id: 'ctx-srs',
    title: 'Sistem Gereksinimleri Spesifikasyonu (SRS / SSS)',
    category: 'SRS',
    tone: 'military_spec',
    description: 'Resmi askeri isterler, sistem doğrulama ve "shall / -caktır" yüklem kalıpları.',
    sourceSnippet: 'Hava Savunma Sistemi, elektronik karıştırma koşulları altında Aktif Faz Dizinli Radar ile en az 150 km menzildeki hedefleri takip edebilmelidir.',
    targetSnippet: 'The Air Defense System (HSS) shall be capable of tracking targets at a minimum range of 150 km using the Active Electronically Scanned Array Radar (AESA) under electronic jamming conditions.'
  },
  {
    id: 'ctx-milstd',
    title: 'Askeri Standart (MIL-STD-810H / MIL-STD-461G)',
    category: 'MIL-STD',
    tone: 'formal_passive',
    description: 'Çevresel ve elektromanyetik uyumluluk askeri standart test prosedürleri.',
    sourceSnippet: 'Öz Savunma Sistemi alt birimleri, yüksek sıcaklık ve şok testlerine MIL-STD-810H Metot 516.8 uyarınca tabi tutulacaktır.',
    targetSnippet: 'Self Protection System (SPS) sub-units shall be subjected to high temperature and shock tests in accordance with MIL-STD-810H Method 516.8.'
  },
  {
    id: 'ctx-stanag',
    title: 'NATO STANAG Taktik Operasyon Prosedürü',
    category: 'STANAG',
    tone: 'imperative',
    description: 'NATO müttefik birlikte çalışabilirlik ve taktik angajman emirleri.',
    sourceSnippet: 'Dost Düşman Tanıma Sistemi (IFF) sorgulaması başarısız olan bilinmeyen hava temasları derhal Tehdit Değerlendirme ve Silah Tahsis modülüne yönlendirilir.',
    targetSnippet: 'Unknown air contacts with failed Identification Friend or Foe System (IFF) interrogation are immediately routed to the Threat Evaluation and Weapon Assignment module.'
  },
  {
    id: 'ctx-manual',
    title: 'Kullanım ve Bakım Kılavuzu (O&M Manual)',
    category: 'MANUAL',
    tone: 'formal_passive',
    description: 'Operatör konsolu, bakım seviyeleri ve adım adım operasyon adımları.',
    sourceSnippet: 'Lazer İkaz Alıcısı alarm verdiğinde, operatör karşı tedbir dağıtım sistemini manuel veya otomatik moda almalıdır.',
    targetSnippet: 'Upon alarm generation by the Laser Warning Receiver (LWR), the operator shall switch the countermeasure dispensing system to manual or automatic mode.'
  }
];

export const SAMPLE_INPUT_TEXTS: { label: string; direction: 'tr-en' | 'en-tr'; contextId: string; text: string; description: string }[] = [
  {
    label: 'Atış Kontrol & Radar Testi (N-Gram Odaklı)',
    direction: 'tr-en',
    contextId: 'ctx-icd',
    description: '2 ve 3 kelimelik tamlamalar ("Atış Kontrol Radarı", "Taktik Veri Bağı Sistemi", "İz") içerir.',
    text: `Atış Kontrol Radarı, tespit edilen hedef iz bilgilerini Arayüz Kontrol Dökümanı uyarınca Görev Bilgisayarına iletecektir. Hava Savunma Sistemi, Taktik Veri Bağı Sistemi üzerinden eş zamanlı 64 iz takibi gerçekleştirecektir. Sistemde tanımlanamayan AN/ALQ-131[?] karıştırma podu tespit edilmiştir.`
  },
  {
    label: 'Elektronik Harp & IFF Sistem Gereksinimi',
    direction: 'tr-en',
    contextId: 'ctx-srs',
    description: 'Kısaltmalı ("EİR", "ED", "IFF") ve kısaltmasız ("Arayüz Kontrol Dökümanı") terimler.',
    text: `Hava Savunma Erken İhbar Radarı, Elektronik Harp Destek Tedbirleri alt sistemi ile entegre çalışacaktır. Dost Düşman Tanıma Sistemi sorgulaması neticesinde radar kesit alanı düşük olan hedefler için angajman emri oluşturulacaktır.`
  },
  {
    label: 'İngilizce Askeri İster Metni (EN -> TR)',
    direction: 'en-tr',
    contextId: 'ctx-srs',
    description: 'English to Turkish military requirement translation adhering strictly to defense terminology.',
    text: `The Active Electronically Scanned Array Radar shall provide simultaneous target tracking and fire control capability. All track data shall be transmitted to the Command and Control center according to the Interface Control Document. Unknown EW payload APX-119[?] was observed in the sector.`
  },
  {
    label: 'Güdüm ve Aviyonik Entegrasyon İsteri',
    direction: 'tr-en',
    contextId: 'ctx-icd',
    description: 'Kızılötesi arayıcı başlık, ANS ve güdüm kiti tamlamaları.',
    text: `Kızılötesi Arayıcı Başlık ve Ataletsel Seyrüsefer Sistemi verileri, Görev Bilgisayarı tarafından füze güdüm kiti kontrol algoritmalarına girdi olarak sağlanacaktır.`
  }
];
