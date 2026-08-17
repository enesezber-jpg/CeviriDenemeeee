import React from 'react';
import { Shield, Cpu, Sparkles, BookOpen, FileSpreadsheet, RefreshCw, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';
import { TranslationDirection } from '../types';

interface HeaderProps {
  direction: TranslationDirection;
  onDirectionChange: (dir: TranslationDirection) => void;
  activeTermsCount: number;
  onOpenBatch: () => void;
  onOpenPromptInspector: () => void;
  isTranslating: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  direction,
  onDirectionChange,
  activeTermsCount,
  onOpenBatch,
  onOpenPromptInspector,
  isTranslating,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Logo & System Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-inner">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                Savunma Sanayii Teknik Çeviri Motoru
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="w-3 h-3" />
                Sıfır Hata Motoru
              </span>
            </div>
            <p className="text-xs text-slate-400">
              N-Gram Tamlama Önceliği • Excel Terim Sabitliği • Bağlamsal Askeri Üslup
            </p>
          </div>
        </div>

        {/* Center: Translation Direction Switcher */}
        <div className="flex items-center bg-slate-950/80 p-1 rounded-lg border border-slate-800">
          <button
            type="button"
            id="btn-direction-tr-en"
            onClick={() => onDirectionChange('tr-en')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
              direction === 'tr-en'
                ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>TR</span>
            <span className="text-[10px] opacity-70">➔</span>
            <span>EN</span>
            <span className="text-[10px] bg-black/20 px-1 py-0.2 rounded">Türkçe → İngilizce</span>
          </button>
          <button
            type="button"
            id="btn-direction-en-tr"
            onClick={() => onDirectionChange('en-tr')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
              direction === 'en-tr'
                ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>EN</span>
            <span className="text-[10px] opacity-70">➔</span>
            <span>TR</span>
            <span className="text-[10px] bg-black/20 px-1 py-0.2 rounded">English → Turkish</span>
          </button>
        </div>

        {/* Right Tools & Status Badges */}
        <div className="flex items-center gap-2">
          {/* Active Terms Badge */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Excel Terimleri:</span>
            <span className="font-bold text-emerald-400">{activeTermsCount}</span>
          </div>

          {/* Batch Excel Translate Modal Trigger */}
          <button
            type="button"
            id="btn-open-batch-modal"
            onClick={onOpenBatch}
            className="px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition-colors flex items-center gap-1.5"
            title="Excel Dosyası veya Toplu Metin Çevirisi"
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Toplu Çeviri</span>
          </button>

          {/* Prompt Inspector Modal Trigger */}
          <button
            type="button"
            id="btn-inspect-prompt"
            onClick={onOpenPromptInspector}
            className="px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition-colors flex items-center gap-1.5"
            title="Ham Motor Promptunu İncele"
          >
            <Cpu className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Girdi Formatı</span>
          </button>
        </div>
      </div>
    </header>
  );
};
