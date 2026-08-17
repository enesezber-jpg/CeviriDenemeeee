import React, { useState } from 'react';
import { BookOpen, Compass, Check, Sparkles, Sliders, Info, RotateCcw } from 'lucide-react';
import { ReferenceContextItem } from '../types';
import { PRESET_REFERENCE_CONTEXTS } from '../data/presetContexts';

interface ReferenceContextManagerProps {
  referenceContextText: string;
  onUpdateContextText: (text: string) => void;
  activeContextId?: string;
  onSelectPresetContext: (item: ReferenceContextItem) => void;
}

export const ReferenceContextManager: React.FC<ReferenceContextManagerProps> = ({
  referenceContextText,
  onUpdateContextText,
  activeContextId,
  onSelectPresetContext,
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>(activeContextId || 'ctx-icd');

  const handleSelectPreset = (item: ReferenceContextItem) => {
    setSelectedPresetId(item.id);
    onSelectPresetContext(item);
  };

  const handleClear = () => {
    setSelectedPresetId('');
    onUpdateContextText('');
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-cyan-400" />
          <div>
            <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
              [REFERANS_BAĞLAM] Çeviri Hafızası & Askeri Standart
            </h2>
            <p className="text-xs text-slate-400">
              Kural 4: Bağlamsal bütünlük. Askeri standart (MIL-STD), arayüz (ICD) veya sistem gereksinimi (SRS) üslubunu belirler.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {referenceContextText && (
            <button
              type="button"
              onClick={handleClear}
              className="px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-md border border-slate-700 transition-colors flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Bağlamı Sıfırla</span>
            </button>
          )}
        </div>
      </div>

      {/* Preset Context Selector Tabs */}
      <div className="p-3 bg-slate-950/70 border-b border-slate-800/80">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-cyan-400" />
          <span>Hazır Askeri Dokümantasyon Şablonları:</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {PRESET_REFERENCE_CONTEXTS.map(ctx => {
            const isSelected = selectedPresetId === ctx.id;
            return (
              <button
                key={ctx.id}
                type="button"
                onClick={() => handleSelectPreset(ctx)}
                className={`p-2.5 rounded-lg text-left transition-all border text-xs flex flex-col justify-between ${
                  isSelected
                    ? 'bg-cyan-950/60 border-cyan-500/60 text-cyan-200 shadow-sm'
                    : 'bg-slate-900 hover:bg-slate-850 border-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-white truncate">{ctx.title}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                    {ctx.category}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  {ctx.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Reference Context Textarea */}
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <span>Aktif Referans Bağlam / Geçmiş Döküman Cümlesi</span>
            <span className="text-[10px] text-slate-500 font-normal">
              (Motora [REFERANS_BAĞLAM] olarak iletilir)
            </span>
          </label>
          <span className="text-[11px] text-slate-400 font-mono">
            {referenceContextText.length} karakter
          </span>
        </div>

        <textarea
          rows={3}
          value={referenceContextText}
          onChange={e => onUpdateContextText(e.target.value)}
          placeholder="Geçmiş teknik dokümandan referans bir cümle girin veya yukarıdaki şablonlardan birini seçin..."
          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-sans leading-relaxed resize-none"
        />

        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>
              Motor bu bağlamı inceleyerek <strong>"shall", "-caktır / -cektir", edilgen çatı</strong> gibi askeri standart kalıplarını uygular.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
