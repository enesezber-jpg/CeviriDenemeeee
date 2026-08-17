import React, { useState } from 'react';
import { X, Copy, Check, Terminal, Cpu, FileCode } from 'lucide-react';
import { TermItem } from '../types';
import { buildExactEnginePrompt } from '../utils/ngramMatcher';

interface PromptInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceText: string;
  terms: TermItem[];
  referenceContextText: string;
}

export const PromptInspectorModal: React.FC<PromptInspectorModalProps> = ({
  isOpen,
  onClose,
  sourceText,
  terms,
  referenceContextText,
}) => {
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedSystem, setCopiedSystem] = useState(false);

  if (!isOpen) return null;

  const rawPrompt = buildExactEnginePrompt(sourceText, terms, referenceContextText);

  const systemInstruction = `Sen, askeri ve savunma sanayii terminolojisinde uzmanlaşmış, sıfır hata toleransıyla çalışan profesyonel bir teknik çeviri motorusun. Sana çevrilecek metin ile birlikte, bir Excel dosyasından çekilmiş yapılandırılmış terim verileri sağlanacaktır.

Görevlerin ve Kuralların:
1. UZUN TAMLAMA ÖNCELİĞİ (N-GRAM MANTIĞI): Sana sağlanan [EXCEL_TERİM_VERİSİ] içindeki 2'li veya 3'lü kelime tamlamalarını (örn: "Atış Kontrol Radarı"), tekil kelimelerden (örn: "Atış", "Kontrol") daha önce ara ve eşleştir. Bir tamlama eşleştiğinde, o bloğu bir bütün olarak çevir, kelimeleri asla parçalama.
2. ESNEL KISALTMA YÖNETİMİ: Excel verisinde bir terimin yanında kısaltma belirtilmişse (örn: "Erken İhbar Radarı (EİR)"), çeviride bu kısaltmayı kurallara uygun olarak kullan. Eğer veride kısaltma yoksa veya boş bırakılmışsa, kesinlikle yeni bir kısaltma türetme; sadece açık halinin çevirisini yap.
3. KESİN İTAAT VE TERİM SABİTLİĞİ: [EXCEL_TERİM_VERİSİ] listesinde karşılığı verilen ifadeler için asla eşanlamlı kelime kullanma. Excel verisi kanundur.
4. BAĞLAMSAL BÜTÜNLÜK: [REFERANS_BAĞLAM] bölümündeki geçmiş çeviri örneklerini incele. Çevrilen cümlenin askeri bir standart, sistem gereksinimi veya teknik arayüz bağlamında olup olmadığını tespit et. Cümle yapısını ve üslubu bu bağlama göre (resmi, edilgen veya emredici) şekillendir.
5. GÜVENİLİRLİK: Excel listesinde olmayan, çevirisinden tam emin olmadığın spesifik bir kısaltma veya bileşenle karşılaşırsan, onu orijinal dilinde bırak ve sonuna köşeli parantez içinde [?] işareti ekle. Hallüsinasyon (hallucination) yaparak teknik terim icat etme.

GİRDİ FORMATI:
[ÇEVRİLECEK_METİN]: {Kullanıcının çevrilmesini istediği ham metin}
[EXCEL_TERİM_VERİSİ]: [
  {"tr": "Hava Savunma Sistemi", "en": "Air Defense System", "kısaltma": "HSS"},
  {"tr": "Arayüz Kontrol Dökümanı", "en": "Interface Control Document", "kısaltma": null},
  {"tr": "İz", "en": "Track", "kısaltma": null}
]
[REFERANS_BAĞLAM]: {Geçmiş dökümanlardan eşleşen benzer cümleler veya boş}

ÇIKTI FORMATI:
Sadece çevrilmiş metni ver. Çevirinin neden böyle yapıldığına dair hiçbir ek açıklama, selamlama, not veya yorum ekleme.`;

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(rawPrompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const handleCopySystem = () => {
    navigator.clipboard.writeText(systemInstruction);
    setCopiedSystem(true);
    setTimeout(() => setCopiedSystem(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-950 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Motor Prompt & Girdi Formatı İnceleyici
              </h3>
              <p className="text-[11px] text-slate-400">
                Gemini 3.7 Flash modeline iletilen tam yapılandırılmış veri blokları
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs scrollbar-thin">
          {/* User Prompt Box */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5 font-mono text-[11px]">
                <FileCode className="w-3.5 h-3.5 text-emerald-400" />
                <span>GÖNDERİLEN GİRDİ VERİSİ (User Content)</span>
              </span>
              <button
                type="button"
                onClick={handleCopyPrompt}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] flex items-center gap-1 border border-slate-700"
              >
                {copiedPrompt ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
                <span>{copiedPrompt ? 'Kopyalandı' : 'Girdiyi Kopyala'}</span>
              </button>
            </div>
            <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 font-mono text-[11px] overflow-x-auto whitespace-pre-wrap max-h-72 leading-relaxed">
              {rawPrompt}
            </pre>
          </div>

          {/* System Instructions Box */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5 font-mono text-[11px]">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                <span>SİSTEM TALİMATI (System Instruction & 5 Core Rules)</span>
              </span>
              <button
                type="button"
                onClick={handleCopySystem}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] flex items-center gap-1 border border-slate-700"
              >
                {copiedSystem ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
                <span>{copiedSystem ? 'Kopyalandı' : 'Talimatı Kopyala'}</span>
              </button>
            </div>
            <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 font-mono text-[11px] overflow-x-auto whitespace-pre-wrap max-h-48 leading-relaxed">
              {systemInstruction}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
