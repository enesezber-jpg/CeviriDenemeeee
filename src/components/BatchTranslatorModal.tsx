import React, { useState, useRef } from 'react';
import { X, Layers, Upload, Download, Play, CheckCircle2, AlertCircle, FileSpreadsheet, RefreshCw } from 'lucide-react';
import { TermItem } from '../types';
import * as XLSX from 'xlsx';
import { exportTranslationBatchToExcel } from '../utils/excelHelper';

interface BatchTranslatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  terms: TermItem[];
  referenceContextText: string;
}

interface BatchItem {
  id: string;
  original: string;
  translated?: string;
  status: 'pending' | 'translating' | 'done' | 'error';
  error?: string;
}

export const BatchTranslatorModal: React.FC<BatchTranslatorModalProps> = ({
  isOpen,
  onClose,
  terms,
  referenceContextText,
}) => {
  const [items, setItems] = useState<BatchItem[]>([
    {
      id: '1',
      original: 'Atış Kontrol Radarı, hedef iz bilgilerini Arayüz Kontrol Dökümanı uyarınca Görev Bilgisayarına iletecektir.',
      status: 'pending',
    },
    {
      id: '2',
      original: 'Hava Savunma Sistemi, Taktik Veri Bağı Sistemi üzerinden eş zamanlı 64 iz takibi gerçekleştirecektir.',
      status: 'pending',
    },
    {
      id: '3',
      original: 'Elektronik Harp Destek Tedbirleri ve Dost Düşman Tanıma Sistemi verileri Görev Bilgisayarında birleştirilir.',
      status: 'pending',
    },
  ]);

  const [multiLineInput, setMultiLineInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleAddFromText = () => {
    if (!multiLineInput.trim()) return;
    const lines = multiLineInput.split('\n').map(l => l.trim()).filter(Boolean);
    const newItems: BatchItem[] = lines.map((line, idx) => ({
      id: `batch-paste-${Date.now()}-${idx}`,
      original: line,
      status: 'pending',
    }));
    setItems(prev => [...prev, ...newItems]);
    setMultiLineInput('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      const newItems: BatchItem[] = [];
      rows.forEach((row, idx) => {
        if (Array.isArray(row) && row.length > 0) {
          const firstCol = String(row[0] || '').trim();
          if (firstCol && firstCol !== 'Kaynak Metin' && firstCol !== 'Source Text' && firstCol !== 'Text') {
            newItems.push({
              id: `batch-file-${Date.now()}-${idx}`,
              original: firstCol,
              status: 'pending',
            });
          }
        }
      });

      if (newItems.length > 0) {
        setItems(newItems);
      }
    } catch (err: any) {
      alert('Dosya okuma hatası: ' + (err.message || 'Geçersiz Excel dosyası'));
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRunBatch = async () => {
    if (items.length === 0 || isProcessing) return;
    setIsProcessing(true);
    setProgress(0);

    const updated = [...items];

    for (let i = 0; i < updated.length; i++) {
      updated[i].status = 'translating';
      setItems([...updated]);

      try {
        const response = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sourceText: updated[i].original,
            terms,
            referenceContextText,
          }),
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Translation failed');
        }

        const data = await response.json();
        updated[i].translated = data.translatedText;
        updated[i].status = 'done';
      } catch (err: any) {
        updated[i].status = 'error';
        updated[i].error = err.message;
      }

      setProgress(Math.round(((i + 1) / updated.length) * 100));
      setItems([...updated]);
    }

    setIsProcessing(false);
  };

  const handleDownloadExcel = () => {
    const exportRows = items.map(item => ({
      original: item.original,
      translated: item.translated || '',
      context: referenceContextText || 'Askeri Şartname / ICD',
    }));
    exportTranslationBatchToExcel(exportRows, `Savunma_Toplu_Ceviri_${Date.now()}.xlsx`);
  };

  const doneCount = items.filter(i => i.status === 'done').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Toplu Askeri Şartname & Doküman Çevirisi
              </h3>
              <p className="text-[11px] text-slate-400">
                Excel veya çok satırlı metinleri aktif {terms.length} adet savunma terimiyle sırayla çevirin
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
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-950 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".xlsx, .xls, .csv"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-400" />
                <span>Excel Dosyası Yükle</span>
              </button>

              <button
                type="button"
                onClick={() => setItems([])}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 text-xs"
              >
                Listeyi Temizle
              </button>
            </div>

            <div className="flex items-center gap-2">
              {doneCount > 0 && (
                <button
                  type="button"
                  onClick={handleDownloadExcel}
                  className="px-3 py-1.5 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-900 font-semibold text-xs flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Sonuçları Excel İndir ({doneCount})</span>
                </button>
              )}

              <button
                type="button"
                disabled={isProcessing || items.length === 0}
                onClick={handleRunBatch}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>İşleniyor (%{progress})</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span>Toplu Çeviriyi Başlat ({items.length})</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Paste Multi-line Box */}
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-2">
            <label className="text-[11px] font-semibold text-slate-400 block">
              Veya Her Satıra Bir Cümle Gelecek Şekilde Metin Yapıştırın:
            </label>
            <div className="flex gap-2">
              <textarea
                rows={2}
                value={multiLineInput}
                onChange={e => setMultiLineInput(e.target.value)}
                placeholder="Örn:&#10;Atış Kontrol Radarı hedef takip durumuna geçti.&#10;Hava Savunma Sistemi erken ihbar bildirimini aldı."
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500 resize-none font-sans"
              />
              <button
                type="button"
                onClick={handleAddFromText}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 font-semibold self-stretch flex items-center justify-center text-xs"
              >
                Ekle
              </button>
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 text-[10px] uppercase font-mono border-b border-slate-800">
                <tr>
                  <th className="px-3 py-2 w-12">#</th>
                  <th className="px-4 py-2 w-1/2">Kaynak Metin</th>
                  <th className="px-4 py-2 w-1/2">Savunma Sanayii Çevirisi</th>
                  <th className="px-3 py-2 w-24 text-right">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans text-[11px]">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-slate-500">
                      Çevrilecek cümle bulunmuyor. Excel dosyası yükleyin veya satır yapıştırın.
                    </td>
                  </tr>
                ) : (
                  items.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-900/40">
                      <td className="px-3 py-2 text-slate-500 font-mono">{idx + 1}</td>
                      <td className="px-4 py-2 text-slate-200 leading-relaxed">{item.original}</td>
                      <td className="px-4 py-2 text-cyan-200 font-medium leading-relaxed">
                        {item.translated || (
                          <span className="text-slate-600 italic">
                            {item.status === 'translating' ? 'Çevriliyor...' : 'Bekliyor'}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-[10px]">
                        {item.status === 'done' && (
                          <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                            Tamam
                          </span>
                        )}
                        {item.status === 'translating' && (
                          <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/30 animate-pulse">
                            Çevriliyor
                          </span>
                        )}
                        {item.status === 'pending' && (
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                            Kuyrukta
                          </span>
                        )}
                        {item.status === 'error' && (
                          <span className="px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-500/30" title={item.error}>
                            Hata
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex justify-between items-center text-xs">
          <span className="text-slate-400 text-[11px]">
            Toplam: <strong>{items.length}</strong> madde • Tamamlanan: <strong>{doneCount}</strong>
          </span>
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
