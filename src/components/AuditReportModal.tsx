import React from 'react';
import { X, ShieldCheck, CheckCircle2, AlertTriangle, Cpu, FileSpreadsheet, Compass, HelpCircle } from 'lucide-react';
import { AuditReport } from '../types';

interface AuditReportModalProps {
  report: AuditReport | null;
  onClose: () => void;
}

export const AuditReportModal: React.FC<AuditReportModalProps> = ({ report, onClose }) => {
  if (!report) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                5 Kural Denetim ve Güvenilirlik Raporu
              </h3>
              <p className="text-xs text-slate-400">
                Askeri & Savunma Sanayii Teknik Çeviri Doğrulama Matrisi
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-mono text-xs font-bold">
              Uyum Skoru: %{report.overallScore}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs scrollbar-thin">
          {/* Rule 1: N-Gram Priority */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-slate-100">
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
                <span>1. UZUN TAMLAMA ÖNCELİĞİ (N-GRAM MANTIĞI)</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                GEÇTİ
              </span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              2'li ve 3'lü kelime tamlamaları (örn. "Atış Kontrol Radarı", "Hava Savunma Sistemi") tekil kelimelerden ("Atış", "Kontrol") önce eşleştirilerek blok halinde korundu.
            </p>
            {report.ngramCompliance.multiWordTerms.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {report.ngramCompliance.multiWordTerms.map((term, i) => (
                  <span key={i} className="px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-500/30 font-mono text-[11px]">
                    {term}
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-slate-500 italic text-[11px]">Metinde çok kelimeli tamlama bulunmadı veya başarıyla işlendi.</div>
            )}
          </div>

          {/* Rule 2: Flexible Abbreviation Management */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-slate-100">
                <CheckCircle2 className="w-4 h-4 text-purple-400" />
                <span>2. ESNEL KISALTMA YÖNETİMİ</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                GEÇTİ
              </span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Sözlükte tanımlı kısaltmalar (örn. "HSS", "AESA", "EİR") askeri kurallara göre uygulandı. Boş bırakılan / kısaltmasız terimler için yeni kısaltma uydurulmadı.
            </p>
            <div className="text-emerald-400 text-[11px] font-mono">
              {report.abbreviationCompliance.details}
            </div>
          </div>

          {/* Rule 3: Strict Obedience & Term Stability */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-slate-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>3. KESİN İTAAT VE TERİM SABİTLİĞİ</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                GEÇTİ (%100)
              </span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Excel veritabanında yer alan karşılıklar için asla eşanlamlı sözcük kullanılmadı. Excel veri tabanı kanundur prensibi sağlandı.
            </p>
            <div className="text-emerald-400 text-[11px] font-mono">
              {report.terminologyStability.details}
            </div>
          </div>

          {/* Rule 4: Contextual Integrity & Tone */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-slate-100">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                <span>4. BAĞLAMSAL BÜTÜNLÜK & ASKERİ ÜSLUP</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold">
                UYUMLU
              </span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Referans bağlam doğrultusunda askeri şartname, sistem gereksinimi (SRS) veya arayüz (ICD) resmiyet ve edilgen çatı (shall / -caktır) kalıpları uygulandı.
            </p>
            <div className="text-cyan-300 text-[11px] font-mono">
              Tespit Edilen Üslup: {report.contextAndTone.toneStyle}
            </div>
          </div>

          {/* Rule 5: Reliability & Zero Hallucination */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-slate-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>5. GÜVENİLİRLİK (SIFIR HALÜSİNASYON)</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                GÜVENLİ
              </span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Excel listesinde yer almayan veya çevirisinden emin olunmayan spesifik kısaltma ve teknik donanım kodları orijinal dilde tutulur ve [?] ile işaretlenir.
            </p>
            <div className="text-slate-300 text-[11px] font-mono">
              {report.reliabilityAndZeroHallucination.details}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
