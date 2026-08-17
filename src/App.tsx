import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Layers, 
  FileSpreadsheet, 
  BookOpen, 
  Cpu, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles,
  Info,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { TermItem, TranslationDirection, ReferenceContextItem, AuditReport } from './types';
import { INITIAL_DEFENSE_TERMS } from './data/defaultTerms';
import { PRESET_REFERENCE_CONTEXTS, SAMPLE_INPUT_TEXTS } from './data/presetContexts';
import { Header } from './components/Header';
import { TranslationWorkspace } from './components/TranslationWorkspace';
import { GlossaryManager } from './components/GlossaryManager';
import { ReferenceContextManager } from './components/ReferenceContextManager';
import { AuditReportModal } from './components/AuditReportModal';
import { PromptInspectorModal } from './components/PromptInspectorModal';
import { BatchTranslatorModal } from './components/BatchTranslatorModal';
import { evaluateAuditCompliance } from './utils/ngramMatcher';

export default function App() {
  const [direction, setDirection] = useState<TranslationDirection>('tr-en');
  const [terms, setTerms] = useState<TermItem[]>(INITIAL_DEFENSE_TERMS);
  
  // Default to first preset sample and context
  const [sourceText, setSourceText] = useState<string>(SAMPLE_INPUT_TEXTS[0].text);
  const [translatedText, setTranslatedText] = useState<string>('');
  const [referenceContextText, setReferenceContextText] = useState<string>(
    PRESET_REFERENCE_CONTEXTS[0].sourceSnippet + '\n' + PRESET_REFERENCE_CONTEXTS[0].targetSnippet
  );
  const [activeContextId, setActiveContextId] = useState<string>('ctx-icd');

  const [activeTab, setActiveTab] = useState<'workspace' | 'glossary' | 'context' | 'rules'>('workspace');
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [executionTimeMs, setExecutionTimeMs] = useState<number | undefined>(undefined);

  // Modals
  const [auditReport, setAuditReport] = useState<AuditReport | null>(null);
  const [isPromptInspectorOpen, setIsPromptInspectorOpen] = useState<boolean>(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState<boolean>(false);

  // Auto-translate initial sample on mount if desired or let user click
  const handleTranslate = async (stream: boolean = false) => {
    if (!sourceText.trim() || isTranslating) return;

    setIsTranslating(true);
    setTranslatedText('');
    setExecutionTimeMs(undefined);

    const startTime = Date.now();

    if (stream) {
      // Streaming SSE
      try {
        const response = await fetch('/api/translate-stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sourceText: sourceText.trim(),
            terms,
            referenceContextText: referenceContextText.trim(),
            direction,
          }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || 'Akış bağlantısı kurulamadı');
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder('utf-8');
        let accumulated = '';

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const textChunk = decoder.decode(value, { stream: true });
            const lines = textChunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  if (data.text) {
                    accumulated += data.text;
                    setTranslatedText(accumulated);
                  }
                  if (data.error) {
                    throw new Error(data.error);
                  }
                } catch (e) {
                  // Ignore JSON parse errors on partial chunks
                }
              }
            }
          }
        }
        setExecutionTimeMs(Date.now() - startTime);
      } catch (err: any) {
        console.error('Stream translation failed:', err);
        setTranslatedText(`[HATA]: ${err.message || 'Çeviri gerçekleştirilemedi'}`);
      } finally {
        setIsTranslating(false);
      }
    } else {
      // Direct POST
      try {
        const response = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sourceText: sourceText.trim(),
            terms,
            referenceContextText: referenceContextText.trim(),
            direction,
          }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || 'Çeviri motoru hatası');
        }

        const data = await response.json();
        setTranslatedText(data.translatedText || '');
        setExecutionTimeMs(data.executionTimeMs || Date.now() - startTime);
      } catch (err: any) {
        console.error('Translation error:', err);
        setTranslatedText(`[HATA]: ${err.message || 'Çeviri gerçekleştirilemedi'}`);
      } finally {
        setIsTranslating(false);
      }
    }
  };

  const handleSelectPresetContext = (item: ReferenceContextItem) => {
    setActiveContextId(item.id);
    setReferenceContextText(item.sourceSnippet + '\n' + item.targetSnippet);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Top Header */}
      <Header
        direction={direction}
        onDirectionChange={setDirection}
        activeTermsCount={terms.length}
        onOpenBatch={() => setIsBatchModalOpen(true)}
        onOpenPromptInspector={() => setIsPromptInspectorOpen(true)}
        isTranslating={isTranslating}
      />

      {/* Primary Navigation Tabs */}
      <div className="border-b border-slate-800 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-1 py-2">
            <button
              type="button"
              id="tab-workspace"
              onClick={() => setActiveTab('workspace')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'workspace'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              <Cpu className="w-4 h-4" />
              <span>Çeviri Çalışma Alanı</span>
            </button>

            <button
              type="button"
              id="tab-glossary"
              onClick={() => setActiveTab('glossary')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'glossary'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>[EXCEL_TERİM_VERİSİ] Sözlüğü ({terms.length})</span>
            </button>

            <button
              type="button"
              id="tab-context"
              onClick={() => setActiveTab('context')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'context'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <span>[REFERANS_BAĞLAM] & Standartlar</span>
            </button>

            <button
              type="button"
              id="tab-rules"
              onClick={() => setActiveTab('rules')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'rules'
                  ? 'bg-amber-950 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              <Shield className="w-4 h-4 text-amber-400" />
              <span>5 Temel Kural Rehberi</span>
            </button>
          </div>

          <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Motor Durumu: HAZIR (Sıfır Tolerans)</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'workspace' && (
          <div className="space-y-6">
            <TranslationWorkspace
              sourceText={sourceText}
              onSourceTextChange={setSourceText}
              translatedText={translatedText}
              onTranslatedTextChange={setTranslatedText}
              direction={direction}
              terms={terms}
              referenceContextText={referenceContextText}
              onTranslate={handleTranslate}
              isTranslating={isTranslating}
              onOpenAuditReport={setAuditReport}
              onOpenPromptInspector={() => setIsPromptInspectorOpen(true)}
              executionTimeMs={executionTimeMs}
            />

            {/* Quick Context Summary Widget under Workspace */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-950/80 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <span className="font-mono text-xs font-bold">1</span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">N-Gram Tamlama Önceliği</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    2'li ve 3'lü tamlamalar ("Atış Kontrol Radarı") tekil kelimelerden ("Atış", "Kontrol") önce eşleşir, kelimeler bölünmez.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-950/80 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                  <span className="font-mono text-xs font-bold">2</span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Esnel Kısaltma & Terim Sabitliği</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    Excel'de tanımlı kısaltma ("EİR") kullanılır; tanımsızsa yeni kısaltma uydurulmaz. Eşanlamlı sözcük kullanılmaz.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                  <span className="font-mono text-xs font-bold">3</span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Bağlamsal Bütünlük & Güvenilirlik</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    MIL-STD/ICD üslubu uygulanır. Emin olunmayan sözlük dışı teknik terimler [?] ile işaretlenir.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'glossary' && (
          <GlossaryManager
            terms={terms}
            onUpdateTerms={setTerms}
          />
        )}

        {activeTab === 'context' && (
          <ReferenceContextManager
            referenceContextText={referenceContextText}
            onUpdateContextText={setReferenceContextText}
            activeContextId={activeContextId}
            onSelectPresetContext={handleSelectPresetContext}
          />
        )}

        {activeTab === 'rules' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6 shadow-lg">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-400" />
                <span>Askeri ve Savunma Sanayii Teknik Çeviri Motoru: 5 Temel Kural</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Sıfır hata toleransıyla çalışan çeviri motorunun vazgeçilmez çalışma prensipleri:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Rule 1 */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-400">
                  <span className="px-2 py-0.5 rounded bg-amber-950 border border-amber-500/30 font-mono">1</span>
                  <span>UZUN TAMLAMA ÖNCELİĞİ (N-GRAM MANTIĞI)</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Excel terim verisindeki 2'li veya 3'lü tamlamalar (örn: <em>"Atış Kontrol Radarı"</em>), tekil kelimelerden (<em>"Atış"</em>, <em>"Kontrol"</em>) daha önce aranır ve eşleştirilir. Bir tamlama eşleştiğinde, o blok bir bütün olarak çevrilir; kelimeler asla parçalanmaz.
                </p>
              </div>

              {/* Rule 2 */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 font-bold text-purple-400">
                  <span className="px-2 py-0.5 rounded bg-purple-950 border border-purple-500/30 font-mono">2</span>
                  <span>ESNEL KISALTMA YÖNETİMİ</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Excel verisinde terimin yanında kısaltma belirtilmişse (örn: <em>"Erken İhbar Radarı (EİR)"</em>), çeviride bu kısaltma kurallara uygun kullanılır. Eğer veride kısaltma yoksa veya <code>null</code> ise, kesinlikle yeni bir kısaltma türetilmez; sadece açık halinin çevirisi yapılır.
                </p>
              </div>

              {/* Rule 3 */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 font-bold text-emerald-400">
                  <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/30 font-mono">3</span>
                  <span>KESİN İTAAT VE TERİM SABİTLİĞİ</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  [EXCEL_TERİM_VERİSİ] listesinde karşılığı verilen ifadeler için asla eşanlamlı kelime kullanılmaz. Excel verisi mutlak kanundur.
                </p>
              </div>

              {/* Rule 4 */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 font-bold text-cyan-400">
                  <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/30 font-mono">4</span>
                  <span>BAĞLAMSAL BÜTÜNLÜK</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  [REFERANS_BAĞLAM] bölümündeki geçmiş çeviri örnekleri incelenir. Cümlenin askeri standart (MIL-STD), sistem gereksinimi (SRS) veya arayüz (ICD) bağlamı tespit edilerek üslup resmi, edilgen ("shall / -caktır") olarak şekillendirilir.
                </p>
              </div>

              {/* Rule 5 */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 md:col-span-2">
                <div className="flex items-center gap-2 font-bold text-red-400">
                  <span className="px-2 py-0.5 rounded bg-red-950 border border-red-500/30 font-mono">5</span>
                  <span>GÜVENİLİRLİK (SIFIR HALÜSİNASYON)</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Excel listesinde olmayan, çevirisinden tam emin olunmayan spesifik bir kısaltma veya bileşenle karşılaşıldığında, orijinal dilinde bırakılır ve sonuna köşeli parantez içinde <code>[?]</code> işareti eklenir (örn. <code>AN/ALQ-131[?]</code>). Asla halüsinasyon yapılarak teknik terim uydurulmaz.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <AuditReportModal
        report={auditReport}
        onClose={() => setAuditReport(null)}
      />

      <PromptInspectorModal
        isOpen={isPromptInspectorOpen}
        onClose={() => setIsPromptInspectorOpen(false)}
        sourceText={sourceText}
        terms={terms}
        referenceContextText={referenceContextText}
      />

      <BatchTranslatorModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        terms={terms}
        referenceContextText={referenceContextText}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 text-slate-500 text-xs py-4 px-6 text-center">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Savunma Sanayii & Askeri Terminoloji Teknik Çeviri Platformu
          </span>
          <span className="font-mono text-[11px] text-slate-400">
            Model: Gemini 3.7 Flash • Sıfır Hata Toleransı
          </span>
        </div>
      </footer>
    </div>
  );
}
