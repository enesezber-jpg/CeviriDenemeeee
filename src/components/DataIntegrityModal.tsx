import React, { useState } from 'react';
import { 
  X, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  Trash2, 
  Check, 
  Edit3, 
  Wand2, 
  Layers, 
  RefreshCw,
  ArrowRight
} from 'lucide-react';
import { TermItem } from '../types';
import { IntegrityReport, IntegrityIssue, autoResolveExactDuplicates } from '../utils/integrityChecker';

interface DataIntegrityModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: IntegrityReport;
  terms: TermItem[];
  onUpdateTerms: (terms: TermItem[]) => void;
}

export const DataIntegrityModal: React.FC<DataIntegrityModalProps> = ({
  isOpen,
  onClose,
  report,
  terms,
  onUpdateTerms,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'critical' | 'duplicates' | 'near_matches'>('all');
  const [editingTermId, setEditingTermId] = useState<string | null>(null);
  const [editTr, setEditTr] = useState('');
  const [editEn, setEditEn] = useState('');
  const [editAbbr, setEditAbbr] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredIssues = report.issues.filter(issue => {
    if (filterType === 'critical') return issue.severity === 'critical';
    if (filterType === 'duplicates') return issue.type === 'exact_duplicate';
    if (filterType === 'near_matches') return issue.type === 'near_match';
    return true;
  });

  const handleAutoDeduplicate = () => {
    const { updatedTerms, removedCount } = autoResolveExactDuplicates(terms);
    onUpdateTerms(updatedTerms);
    setNotification(`${removedCount} adet mükerrer terim kaydı otomatik olarak temizlendi.`);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleKeepSpecificTerm = (keepId: string, removeIds: string[]) => {
    const updated = terms.filter(t => !removeIds.includes(t.id));
    onUpdateTerms(updated);
    setNotification('Çelişki çözüldü: Seçilen terim korundu, çelişkili olanlar kaldırıldı.');
    setTimeout(() => setNotification(null), 3000);
  };

  const handleStartEdit = (term: TermItem) => {
    setEditingTermId(term.id);
    setEditTr(term.tr);
    setEditEn(term.en);
    setEditAbbr(term.kısaltma || '');
  };

  const handleSaveEdit = (termId: string) => {
    const updated = terms.map(t => {
      if (t.id === termId) {
        return {
          ...t,
          tr: editTr.trim(),
          en: editEn.trim(),
          kısaltma: editAbbr.trim() || null,
        };
      }
      return t;
    });
    onUpdateTerms(updated);
    setEditingTermId(null);
    setNotification('Terim başarıyla güncellendi.');
    setTimeout(() => setNotification(null), 3000);
  };

  const handleDeleteSingle = (id: string) => {
    const updated = terms.filter(t => t.id !== id);
    onUpdateTerms(updated);
    setNotification('Terim silindi.');
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${
              report.isClean 
                ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-400'
                : report.criticalCount > 0 
                ? 'bg-red-950/80 border-red-500/40 text-red-400' 
                : 'bg-amber-950/80 border-amber-500/40 text-amber-400'
            }`}>
              {report.isClean ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Veri Bütünlüğü & Çelişki Denetimi</span>
                {report.isClean ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                    %100 Sağlam
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-950 text-red-300 border border-red-500/30">
                    {report.totalIssues} Sorun Tespit Edildi
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-400">
                Sözlükteki çelişkili çevirileri, mükerrerleri ve benzer yazım uyuşmazlıklarını denetleyin
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {report.exactDuplicatesCount > 0 && (
              <button
                type="button"
                id="btn-auto-deduplicate"
                onClick={handleAutoDeduplicate}
                className="px-3 py-1.5 rounded-lg bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                title="Tüm birebir aynı mükerrer terimleri tek tıkla sil"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>Mükerrerleri Temizle ({report.exactDuplicatesCount})</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notification banner */}
        {notification && (
          <div className="bg-emerald-950/90 border-b border-emerald-500/30 px-4 py-2 text-xs text-emerald-300 flex items-center justify-between">
            <span>{notification}</span>
            <button onClick={() => setNotification(null)} className="text-emerald-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Metrics Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-slate-950/60 border-b border-slate-800 text-xs font-mono">
          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
            <span className="text-slate-500 text-[10px] block">TOPLAM TERİM</span>
            <span className="text-white font-bold text-sm">{terms.length}</span>
          </div>
          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
            <span className="text-red-400 text-[10px] block">KRİTİK ÇELİŞKİLER</span>
            <span className="text-red-300 font-bold text-sm">{report.criticalCount}</span>
          </div>
          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
            <span className="text-amber-400 text-[10px] block">MÜKERRER KAYITLAR</span>
            <span className="text-amber-300 font-bold text-sm">{report.exactDuplicatesCount}</span>
          </div>
          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
            <span className="text-cyan-400 text-[10px] block">YAKIN YAZIM BENZERLİĞİ</span>
            <span className="text-cyan-300 font-bold text-sm">{report.nearMatchesCount}</span>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="p-2.5 bg-slate-950 border-b border-slate-800/80 flex items-center gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-2.5 py-1 rounded-md font-medium text-[11px] transition-colors ${
              filterType === 'all' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Tüm Sorunlar ({report.totalIssues})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('critical')}
            className={`px-2.5 py-1 rounded-md font-medium text-[11px] flex items-center gap-1 transition-colors ${
              filterType === 'critical' ? 'bg-red-900/80 text-red-200 border border-red-500/40' : 'text-red-400 hover:bg-red-950/40'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
            Kritik Çelişkiler ({report.criticalCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('duplicates')}
            className={`px-2.5 py-1 rounded-md font-medium text-[11px] flex items-center gap-1 transition-colors ${
              filterType === 'duplicates' ? 'bg-amber-900/80 text-amber-200 border border-amber-500/40' : 'text-amber-400 hover:bg-amber-950/40'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            Mükerrer Kayıtlar ({report.exactDuplicatesCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('near_matches')}
            className={`px-2.5 py-1 rounded-md font-medium text-[11px] flex items-center gap-1 transition-colors ${
              filterType === 'near_matches' ? 'bg-cyan-900/80 text-cyan-200 border border-cyan-500/40' : 'text-cyan-400 hover:bg-cyan-950/40'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
            Yakın / Benzer Yazımlar ({report.nearMatchesCount})
          </button>
        </div>

        {/* Issue Items List */}
        <div className="p-4 overflow-y-auto space-y-3 text-xs scrollbar-thin flex-1">
          {report.isClean ? (
            <div className="p-8 text-center flex flex-col items-center justify-center text-slate-400 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Sözlük Veri Bütünlüğü Kusursuz</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  Hiçbir çelişkili çeviri, mükerrer kayıt veya kural ihlali bulunmuyor. Savunma çeviri motoru Kural 3 (Terim Sabitliği) gereksinimini %100 doğrulukla karşılamaktadır.
                </p>
              </div>
            </div>
          ) : filteredIssues.length === 0 ? (
            <div className="p-6 text-center text-slate-500">
              Bu filtreye ait sorun bulunmuyor.
            </div>
          ) : (
            filteredIssues.map((issue) => (
              <div
                key={issue.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  issue.severity === 'critical'
                    ? 'bg-red-950/30 border-red-500/40'
                    : issue.severity === 'warning'
                    ? 'bg-amber-950/30 border-amber-500/40'
                    : 'bg-slate-950 border-slate-800'
                }`}
              >
                {/* Issue Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    {issue.severity === 'critical' ? (
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    ) : issue.severity === 'warning' ? (
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    ) : (
                      <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    )}
                    <span className="font-bold text-slate-100 text-xs">
                      {issue.title}
                    </span>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                    issue.severity === 'critical'
                      ? 'bg-red-950 text-red-300 border border-red-500/30'
                      : issue.severity === 'warning'
                      ? 'bg-amber-950 text-amber-300 border border-amber-500/30'
                      : 'bg-slate-800 text-slate-300'
                  }`}>
                    {issue.type.replace('_', ' ')}
                  </span>
                </div>

                <p className="text-slate-400 text-[11px] leading-relaxed mb-3">
                  {issue.description}
                </p>

                {/* Conflicting Candidates Matrix */}
                <div className="space-y-2 bg-slate-900/90 rounded-lg p-2.5 border border-slate-800">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    İlgili Terim Kayıtları:
                  </div>

                  {issue.conflictingTerms.map((term, idx) => {
                    const isEditing = editingTermId === term.id;

                    if (isEditing) {
                      return (
                        <div key={term.id} className="p-2 bg-slate-800 rounded border border-slate-700 space-y-2">
                          <div className="grid grid-cols-3 gap-2">
                            <input
                              type="text"
                              value={editTr}
                              onChange={e => setEditTr(e.target.value)}
                              className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-white"
                              placeholder="TR"
                            />
                            <input
                              type="text"
                              value={editEn}
                              onChange={e => setEditEn(e.target.value)}
                              className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-white"
                              placeholder="EN"
                            />
                            <input
                              type="text"
                              value={editAbbr}
                              onChange={e => setEditAbbr(e.target.value)}
                              className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-white"
                              placeholder="Kısaltma"
                            />
                          </div>
                          <div className="flex justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setEditingTermId(null)}
                              className="px-2 py-1 rounded bg-slate-700 text-slate-300 text-[11px]"
                            >
                              İptal
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(term.id)}
                              className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold"
                            >
                              Kaydet
                            </button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={term.id}
                        className="flex flex-wrap items-center justify-between gap-2 p-2 rounded bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-colors"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                          <span className="font-semibold text-slate-100 font-mono text-xs">{term.tr}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                          <span className="text-cyan-300 font-mono text-xs">{term.en}</span>
                          {term.kısaltma && (
                            <span className="px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/30 text-[10px] font-mono">
                              ({term.kısaltma})
                            </span>
                          )}
                          <span className="text-[10px] text-slate-500 ml-auto">[{term.kategori || 'Genel'}]</span>
                        </div>

                        <div className="flex items-center gap-1">
                          {issue.conflictingTerms.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const removeIds = issue.conflictingTerms
                                  .filter(t => t.id !== term.id)
                                  .map(t => t.id);
                                handleKeepSpecificTerm(term.id, removeIds);
                              }}
                              className="px-2 py-1 rounded bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold transition-colors"
                              title="Bu karşılığı standart kabul et ve çakışan diğerlerini sil"
                            >
                              Bu Kaydı Koru
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleStartEdit(term)}
                            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
                            title="Düzenle"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteSingle(term.id)}
                            className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-slate-800"
                            title="Bu Kaydı Sil"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400 text-[11px]">
            {report.isClean
              ? 'Tüm kayıtlar Askeri Terminoloji Standartlarına uygun.'
              : `${report.totalIssues} potansiyel veri bütünlüğü uyarısı listelendi.`}
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
