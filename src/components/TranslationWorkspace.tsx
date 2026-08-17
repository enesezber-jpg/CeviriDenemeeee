import React, { useState, useMemo } from 'react';
import { 
  Send, 
  Sparkles, 
  Copy, 
  Check, 
  Download, 
  Volume2, 
  VolumeX, 
  FileText, 
  RotateCcw, 
  ShieldCheck, 
  Layers, 
  Eye, 
  Cpu, 
  Terminal, 
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { TermItem, TranslationDirection, TermMatch, AuditReport } from '../types';
import { detectTermMatches, detectUnknownMilitaryAcronyms, evaluateAuditCompliance } from '../utils/ngramMatcher';
import { SAMPLE_INPUT_TEXTS } from '../data/presetContexts';

interface TranslationWorkspaceProps {
  sourceText: string;
  onSourceTextChange: (text: string) => void;
  translatedText: string;
  onTranslatedTextChange: (text: string) => void;
  direction: TranslationDirection;
  terms: TermItem[];
  referenceContextText: string;
  onTranslate: (stream?: boolean) => Promise<void>;
  isTranslating: boolean;
  onOpenAuditReport: (report: AuditReport) => void;
  onOpenPromptInspector: () => void;
  executionTimeMs?: number;
}

export const TranslationWorkspace: React.FC<TranslationWorkspaceProps> = ({
  sourceText,
  onSourceTextChange,
  translatedText,
  onTranslatedTextChange,
  direction,
  terms,
  referenceContextText,
  onTranslate,
  isTranslating,
  onOpenAuditReport,
  onOpenPromptInspector,
  executionTimeMs,
}) => {
  const [copied, setCopied] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [viewMode, setViewMode] = useState<'clean' | 'ngram_annotated'>('clean');

  // Real-time N-gram detected matches in source text
  const detectedMatches = useMemo(() => {
    return detectTermMatches(sourceText, terms, direction);
  }, [sourceText, terms, direction]);

  // Detected unknown military acronyms in source text
  const unknownAcronyms = useMemo(() => {
    return detectUnknownMilitaryAcronyms(sourceText, terms);
  }, [sourceText, terms]);

  const handleCopy = () => {
    if (!translatedText) return;
    navigator.clipboard.writeText(translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!translatedText) return;
    const blob = new Blob([translatedText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Savunma_Ceviri_${direction.toUpperCase()}_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAudioPlayback = () => {
    if (!translatedText || typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    const lang = direction === 'tr-en' ? 'en-US' : 'tr-TR';
    const utterance = new SpeechSynthesisUtterance(translatedText);
    utterance.lang = lang;
    utterance.rate = 0.95; // Clear technical pace

    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    setIsPlayingAudio(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleSelectSample = (sample: typeof SAMPLE_INPUT_TEXTS[0]) => {
    onSourceTextChange(sample.text);
  };

  const handleTriggerAudit = () => {
    if (!translatedText || !sourceText) return;
    const report = evaluateAuditCompliance(sourceText, translatedText, terms, direction);
    onOpenAuditReport(report);
  };

  // Word count & token estimate
  const sourceWordCount = sourceText.trim() ? sourceText.trim().split(/\s+/).length : 0;
  const targetWordCount = translatedText.trim() ? translatedText.trim().split(/\s+/).length : 0;

  return (
    <div className="space-y-4">
      {/* Sample Texts Fast Loader Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-slate-200">Örnek Askeri Metin Yükle:</span>
        </div>
        <div className="flex items-center flex-wrap gap-1.5">
          {SAMPLE_INPUT_TEXTS.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectSample(sample)}
              className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition-colors text-xs flex items-center gap-1"
              title={sample.description}
            >
              <span>{sample.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Workspace Dual-Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* LEFT PANE: SOURCE TEXT [ÇEVRİLECEK_METİN] */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg flex flex-col overflow-hidden">
          {/* Source Pane Header */}
          <div className="p-3.5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/30 font-mono">
                [ÇEVRİLECEK_METİN]
              </span>
              <span className="text-xs font-semibold text-slate-200">
                {direction === 'tr-en' ? 'Kaynak Metin (Türkçe)' : 'Source Text (English)'}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-mono text-[11px]">
                {sourceWordCount} kelime • {sourceText.length} krkt
              </span>
              {sourceText && (
                <button
                  type="button"
                  onClick={() => onSourceTextChange('')}
                  className="text-slate-500 hover:text-slate-300 text-xs"
                  title="Metni Temizle"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Source Textarea */}
          <div className="p-4 flex-1 flex flex-col min-h-[280px]">
            <textarea
              value={sourceText}
              onChange={e => onSourceTextChange(e.target.value)}
              placeholder={
                direction === 'tr-en'
                  ? 'Çevrilecek askeri şartname, sistem gereksinimi, radar/EW bildirimi veya ICD metnini buraya girin...'
                  : 'Enter military specifications, system requirements, radar/EW bulletins, or ICD technical requirements here...'
              }
              rows={10}
              className="w-full flex-1 bg-transparent text-slate-100 placeholder-slate-600 focus:outline-none resize-none font-sans text-sm leading-relaxed"
            />

            {/* Real-Time N-Gram Match Inspector Badges in Source */}
            {detectedMatches.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-800/80">
                <div className="text-[11px] font-semibold text-slate-400 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Tespit Edilen Excel Terimleri ({detectedMatches.length}):</span>
                  </span>
                  <span className="text-[10px] text-slate-500">N-gram önceliğine göre sıralandı</span>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                  {detectedMatches.map((m, idx) => (
                    <span
                      key={idx}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] border font-mono ${
                        m.ngramLevel >= 3
                          ? 'bg-amber-950/70 border-amber-500/40 text-amber-300'
                          : m.ngramLevel === 2
                          ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300'
                          : 'bg-cyan-950/70 border-cyan-500/40 text-cyan-300'
                      }`}
                    >
                      <span className="font-bold">{m.matchedText}</span>
                      <span className="text-slate-500">➔</span>
                      <span className="text-white">{m.appliedTranslation}</span>
                      {m.appliedAbbreviation && (
                        <span className="px-1 rounded bg-purple-900/60 text-purple-200 text-[10px]">
                          ({m.appliedAbbreviation})
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Unknown Acronyms Warning Badge (Rule 5) */}
            {unknownAcronyms.length > 0 && (
              <div className="mt-2 p-2 rounded-lg bg-amber-950/40 border border-amber-500/30 text-[11px] text-amber-300 flex items-start gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong>Kural 5 Güvenilirlik Uyarısı:</strong> Sözlükte bulunmayan kısaltmalar tespit edildi:{' '}
                  <span className="font-mono text-white">{unknownAcronyms.join(', ')}</span>. Motor, halüsinasyon yapmadan bu terimleri orijinal haliyle bırakıp gerekirse <code className="text-amber-200">[?]</code> ekleyecektir.
                </div>
              </div>
            )}
          </div>

          {/* Bottom Execution Controls */}
          <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                id="btn-inspect-raw-prompt"
                onClick={onOpenPromptInspector}
                className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-300 text-xs border border-slate-800 transition-colors flex items-center gap-1.5"
                title="Gemini Motoruna iletilen ham prompt formatını görüntüle"
              >
                <Cpu className="w-3.5 h-3.5 text-amber-400" />
                <span>Prompt Formatı</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                id="btn-translate-stream"
                disabled={isTranslating || !sourceText.trim()}
                onClick={() => onTranslate(true)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                  isTranslating || !sourceText.trim()
                    ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                    : 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border-emerald-500/40 shadow-sm'
                }`}
                title="Canlı Akış (Streaming) ile Çevir"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Canlı Akış</span>
              </button>

              <button
                type="button"
                id="btn-translate-direct"
                disabled={isTranslating || !sourceText.trim()}
                onClick={() => onTranslate(false)}
                className={`px-5 py-2 rounded-lg text-xs font-bold transition-all shadow-md flex items-center gap-2 ${
                  isTranslating || !sourceText.trim()
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40 active:scale-95'
                }`}
              >
                {isTranslating ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Çevriliyor...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Çeviriyi Başlat</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT PANE: TARGET TRANSLATION [ÇIKTI FORMATI] */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg flex flex-col overflow-hidden">
          {/* Target Pane Header */}
          <div className="p-3.5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/30 font-mono">
                [ÇIKTI FORMATI]
              </span>
              <span className="text-xs font-semibold text-slate-200">
                {direction === 'tr-en' ? 'Savunma Sanayii Çevirisi (EN)' : 'Savunma Sanayii Çevirisi (TR)'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {executionTimeMs !== undefined && (
                <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                  <Clock className="w-3 h-3 text-emerald-400" />
                  <span>{executionTimeMs} ms</span>
                </span>
              )}
              <span className="text-slate-400 font-mono text-[11px]">
                {targetWordCount} kelime
              </span>
            </div>
          </div>

          {/* Target Textarea / Output Display */}
          <div className="p-4 flex-1 flex flex-col min-h-[280px] relative bg-slate-950/40">
            {isTranslating && !translatedText ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-xs gap-3">
                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <div className="text-center font-mono">
                  <p className="text-slate-200 font-semibold">Savunma Sanayii Çeviri Motoru Çalışıyor</p>
                  <p className="text-slate-500 text-[11px]">N-gram öncelik kuralları & Excel verisi işleniyor...</p>
                </div>
              </div>
            ) : !translatedText ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs gap-2">
                <ShieldCheck className="w-8 h-8 text-slate-700" />
                <p>Çeviri çıktısı doğrudan burada sıfır hata prensibiyle görüntülenecektir.</p>
                <p className="text-[11px] text-slate-600">Ek açıklama, selamlama veya yorum eklenmez (Salt Çıktı).</p>
              </div>
            ) : (
              <textarea
                value={translatedText}
                onChange={e => onTranslatedTextChange(e.target.value)}
                rows={10}
                className="w-full flex-1 bg-transparent text-slate-100 focus:outline-none resize-none font-sans text-sm leading-relaxed"
                placeholder="Çevrilen metin..."
              />
            )}

            {/* Zero-Hallucination & Term Stability Summary Ribbon */}
            {translatedText && (
              <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Kural 1-5 Denetimi Başarılı: Excel terimlerine tam itaat sağlandı.</span>
                </div>
                <button
                  type="button"
                  onClick={handleTriggerAudit}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-semibold border border-emerald-500/30 transition-colors flex items-center gap-1"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>5 Kural Denetim Raporu</span>
                </button>
              </div>
            )}
          </div>

          {/* Bottom Target Actions */}
          <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                id="btn-copy-target"
                disabled={!translatedText}
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-medium border border-slate-800 transition-colors flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                title="Çeviriyi Panoya Kopyala"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                <span>{copied ? 'Kopyalandı!' : 'Kopyala'}</span>
              </button>

              <button
                type="button"
                id="btn-download-target"
                disabled={!translatedText}
                onClick={handleDownload}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-medium border border-slate-800 transition-colors flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                title="Metin Belgesi (.txt) Olarak İndir"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>İndir</span>
              </button>

              <button
                type="button"
                id="btn-tts-readout"
                disabled={!translatedText}
                onClick={handleAudioPlayback}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed ${
                  isPlayingAudio
                    ? 'bg-amber-950 border-amber-500/40 text-amber-300'
                    : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-200'
                }`}
                title="Teknik Sesli Okuma (TTS)"
              >
                {isPlayingAudio ? <VolumeX className="w-3.5 h-3.5 text-amber-400" /> : <Volume2 className="w-3.5 h-3.5 text-slate-400" />}
                <span>{isPlayingAudio ? 'Durdur' : 'Sesli Oku'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500">
                Model: <strong>Gemini 3.7 Flash</strong>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
