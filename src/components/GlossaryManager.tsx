import React, { useState, useMemo, useRef } from 'react';
import { 
  FileSpreadsheet, 
  Upload, 
  Download, 
  Plus, 
  Trash2, 
  Edit3, 
  Search, 
  Filter, 
  Check, 
  X, 
  Layers, 
  HelpCircle,
  Sparkles,
  BookOpen,
  ArrowUpDown,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Wand2,
  FileCode,
  FileText,
  ChevronDown
} from 'lucide-react';
import { TermItem } from '../types';
import { calculateNgramCount } from '../utils/ngramMatcher';
import { parseTermsFile, exportTermsToExcel, exportTermsToJson, exportTermsToCsv } from '../utils/excelHelper';
import { PRESET_DICTIONARIES } from '../data/defaultTerms';
import { checkGlossaryIntegrity, autoResolveExactDuplicates } from '../utils/integrityChecker';
import { DataIntegrityModal } from './DataIntegrityModal';

interface GlossaryManagerProps {
  terms: TermItem[];
  onUpdateTerms: (terms: TermItem[]) => void;
}

export const GlossaryManager: React.FC<GlossaryManagerProps> = ({
  terms,
  onUpdateTerms,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedNgramFilter, setSelectedNgramFilter] = useState<'all' | '3+' | '2' | '1'>('all');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isIntegrityModalOpen, setIsIntegrityModalOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  // New term form state
  const [newTr, setNewTr] = useState('');
  const [newEn, setNewEn] = useState('');
  const [newAbbr, setNewAbbr] = useState('');
  const [newCategory, setNewCategory] = useState('Radar & Sensör');
  const [newNotes, setNewNotes] = useState('');

  // Edit form state
  const [editTr, setEditTr] = useState('');
  const [editEn, setEditEn] = useState('');
  const [editAbbr, setEditAbbr] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const [notification, setNotification] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Real-time Data Integrity Audit Report
  const integrityReport = useMemo(() => {
    return checkGlossaryIntegrity(terms);
  }, [terms]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    terms.forEach(t => {
      if (t.kategori) set.add(t.kategori);
    });
    return Array.from(set);
  }, [terms]);

  const filteredTerms = useMemo(() => {
    return terms.filter(item => {
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery = 
        !q ||
        item.tr.toLowerCase().includes(q) ||
        item.en.toLowerCase().includes(q) ||
        (item.kısaltma && item.kısaltma.toLowerCase().includes(q)) ||
        (item.kategori && item.kategori.toLowerCase().includes(q)) ||
        (item.notlar && item.notlar.toLowerCase().includes(q));

      const matchesCat = selectedCategory === 'all' || item.kategori === selectedCategory;

      const ngramCount = calculateNgramCount(item.tr);
      let matchesNgram = true;
      if (selectedNgramFilter === '3+') matchesNgram = ngramCount >= 3;
      else if (selectedNgramFilter === '2') matchesNgram = ngramCount === 2;
      else if (selectedNgramFilter === '1') matchesNgram = ngramCount === 1;

      return matchesQuery && matchesCat && matchesNgram;
    });
  }, [terms, searchQuery, selectedCategory, selectedNgramFilter]);

  const ngramStats = useMemo(() => {
    let threePlus = 0;
    let two = 0;
    let one = 0;
    terms.forEach(t => {
      const count = calculateNgramCount(t.tr);
      if (count >= 3) threePlus++;
      else if (count === 2) two++;
      else one++;
    });
    return { threePlus, two, one, total: terms.length };
  }, [terms]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { terms: importedTerms, format } = await parseTermsFile(file);
      if (importedTerms.length === 0) {
        setNotification(`Yüklenen ${format.toUpperCase()} dosyasında geçerli terim kaydı bulunamadı.`);
        setTimeout(() => setNotification(null), 4000);
        return;
      }

      // Merge avoiding exact duplicates by tr
      const existingTrs = new Set(terms.map(t => t.tr.toLowerCase()));
      const newItems = importedTerms.filter(t => !existingTrs.has(t.tr.toLowerCase()));
      const updated = [...importedTerms, ...terms.filter(t => !importedTerms.some(it => it.tr.toLowerCase() === t.tr.toLowerCase()))];

      onUpdateTerms(updated);
      setNotification(`Başarılı: ${importedTerms.length} terim ${format.toUpperCase()} dosyasından aktarıldı (${newItems.length} yeni terim eklendi).`);
      setTimeout(() => setNotification(null), 4000);
    } catch (err: any) {
      setNotification(`Dosya içe aktarma hatası: ${err.message || 'Dosya biçimi geçersiz'}`);
      setTimeout(() => setNotification(null), 5000);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleExportExcel = () => {
    exportTermsToExcel(terms, `Savunma_Sanayii_Terimleri_${Date.now()}.xlsx`);
    setIsExportMenuOpen(false);
    setNotification('Excel tablosu indirildi (.xlsx).');
    setTimeout(() => setNotification(null), 3000);
  };

  const handleExportJson = () => {
    exportTermsToJson(terms, `Savunma_Sanayii_Terimleri_${Date.now()}.json`);
    setIsExportMenuOpen(false);
    setNotification('JSON terim veritabanı [EXCEL_TERİM_VERİSİ] formatında indirildi (.json).');
    setTimeout(() => setNotification(null), 3000);
  };

  const handleExportCsv = () => {
    exportTermsToCsv(terms, `Savunma_Sanayii_Terimleri_${Date.now()}.csv`);
    setIsExportMenuOpen(false);
    setNotification('CSV terim tablosu indirildi (.csv).');
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAddTerm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTr.trim() || !newEn.trim()) return;

    const newTerm: TermItem = {
      id: `term-${Date.now()}`,
      tr: newTr.trim(),
      en: newEn.trim(),
      kısaltma: newAbbr.trim() !== '' ? newAbbr.trim() : null,
      kategori: newCategory.trim() || 'Genel',
      notlar: newNotes.trim() || '',
    };

    onUpdateTerms([newTerm, ...terms]);
    setNewTr('');
    setNewEn('');
    setNewAbbr('');
    setNewNotes('');
    setIsAddingNew(false);
    setNotification(`Yeni terim eklendi: "${newTerm.tr}"`);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleStartEdit = (term: TermItem) => {
    setEditingId(term.id);
    setEditTr(term.tr);
    setEditEn(term.en);
    setEditAbbr(term.kısaltma || '');
    setEditCategory(term.kategori || 'Genel');
    setEditNotes(term.notlar || '');
  };

  const handleSaveEdit = (id: string) => {
    if (!editTr.trim() || !editEn.trim()) return;

    const updated = terms.map(t => {
      if (t.id === id) {
        return {
          ...t,
          tr: editTr.trim(),
          en: editEn.trim(),
          kısaltma: editAbbr.trim() !== '' ? editAbbr.trim() : null,
          kategori: editCategory.trim() || 'Genel',
          notlar: editNotes.trim() || '',
        };
      }
      return t;
    });

    onUpdateTerms(updated);
    setEditingId(null);
    setNotification('Terim güncellendi.');
    setTimeout(() => setNotification(null), 3000);
  };

  const handleDeleteTerm = (id: string) => {
    const updated = terms.filter(t => t.id !== id);
    onUpdateTerms(updated);
    setNotification('Terim silindi.');
    setTimeout(() => setNotification(null), 3000);
  };

  const handleLoadPreset = (presetTerms: TermItem[], name: string) => {
    onUpdateTerms(presetTerms);
    setNotification(`Sözlük yüklendi: ${name}`);
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg flex flex-col">
      {/* Header & Controls Bar */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white tracking-wide">
              [EXCEL_TERİM_VERİSİ] Sözlük Yönetimi
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-500/30">
              {terms.length} Kayıt
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Kural 1 & 3: 2'li/3'lü tamlamalar öncelikle eşleşir. Excel verisi kanundur, eşanlamlı kabul edilmez.
          </p>
        </div>

        {/* Action Buttons: Import, Export, Add */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Data Integrity Checker Button */}
          <button
            type="button"
            id="btn-open-integrity-checker"
            onClick={() => setIsIntegrityModalOpen(true)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 shadow-sm ${
              integrityReport.isClean
                ? 'bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border-emerald-500/40'
                : integrityReport.criticalCount > 0
                ? 'bg-red-950 hover:bg-red-900 text-red-200 border-red-500/50 animate-pulse'
                : 'bg-amber-950 hover:bg-amber-900 text-amber-200 border-amber-500/50'
            }`}
            title="Sözlükteki çelişkili, mükerrer veya hatalı terimleri otomatik tara ve çöz"
          >
            {integrityReport.isClean ? (
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
            )}
            <span>
              {integrityReport.isClean
                ? 'Veri Bütünlüğü: Sağlam (%100)'
                : `Veri Bütünlüğü: ${integrityReport.totalIssues} Uyarı!`}
            </span>
          </button>

          {/* Preset Selector Dropdown */}
          <div className="relative inline-block text-left">
            <select
              aria-label="Hazır Savunma Sözlükleri"
              onChange={(e) => {
                const idx = parseInt(e.target.value, 10);
                if (!isNaN(idx) && PRESET_DICTIONARIES[idx]) {
                  handleLoadPreset(PRESET_DICTIONARIES[idx].terms, PRESET_DICTIONARIES[idx].name);
                }
              }}
              defaultValue=""
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="" disabled>Hazır Sözlük Şablonu...</option>
              {PRESET_DICTIONARIES.map((p, idx) => (
                <option key={p.name} value={idx}>
                  {p.name} ({p.terms.length})
                </option>
              ))}
            </select>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".xlsx, .xls, .csv, .json"
            className="hidden"
            id="glossary-file-upload-input"
          />

          {/* Import Button */}
          <button
            type="button"
            id="btn-upload-terms-file"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5 shadow-sm"
            title="Excel (.xlsx), CSV (.csv) veya JSON (.json) dosyası yükle"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-400" />
            <span>Dosya İçe Aktar</span>
          </button>

          {/* Export Dropdown Menu */}
          <div className="relative inline-block text-left">
            <button
              type="button"
              id="btn-export-dropdown-toggle"
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5 shadow-sm"
              title="Terim listesini farklı formatlarda dışa aktar"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Dışa Aktar</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isExportMenuOpen && (
              <div 
                className="origin-top-right absolute right-0 mt-1.5 w-56 rounded-xl shadow-xl bg-slate-900 border border-slate-700 ring-1 ring-black ring-opacity-5 z-40 py-1 divide-y divide-slate-800 animate-fadeIn"
                onMouseLeave={() => setIsExportMenuOpen(false)}
              >
                <div className="px-3 py-2 text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                  Dışa Aktarma Formatları
                </div>

                <div className="py-1">
                  <button
                    type="button"
                    id="btn-export-json"
                    onClick={handleExportJson}
                    className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 hover:text-white flex items-center gap-2 transition-colors"
                  >
                    <FileCode className="w-4 h-4 text-amber-400" />
                    <div>
                      <div className="font-semibold flex items-center gap-1.5">
                        <span>JSON Dosyası (.json)</span>
                        <span className="px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 text-[10px] border border-amber-500/30">Motor Formatı</span>
                      </div>
                      <div className="text-[10px] text-slate-400">[EXCEL_TERİM_VERİSİ] şeması</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    id="btn-export-excel"
                    onClick={handleExportExcel}
                    className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 hover:text-white flex items-center gap-2 transition-colors"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                    <div>
                      <div className="font-semibold">Excel Tablosu (.xlsx)</div>
                      <div className="text-[10px] text-slate-400">Genişletilmiş sütunlar & N-Gram</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    id="btn-export-csv"
                    onClick={handleExportCsv}
                    className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 hover:text-white flex items-center gap-2 transition-colors"
                  >
                    <FileText className="w-4 h-4 text-cyan-400" />
                    <div>
                      <div className="font-semibold">CSV Dosyası (.csv)</div>
                      <div className="text-[10px] text-slate-400">UTF-8 noktalı virgül ayrıştırıcı</div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            id="btn-add-term-toggle"
            onClick={() => setIsAddingNew(!isAddingNew)}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
          >
            {isAddingNew ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            <span>{isAddingNew ? 'İptal' : 'Yeni Terim'}</span>
          </button>
        </div>
      </div>

      {/* Real-time Data Integrity Conflict Alert Banner */}
      {!integrityReport.isClean && (
        <div className="bg-red-950/70 border-b border-red-500/30 px-4 py-2.5 text-xs text-red-200 flex flex-wrap items-center justify-between gap-2 animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>
              <strong>Veri Bütünlüğü Uyarısı:</strong> Sözlük veritabanında{' '}
              {integrityReport.criticalCount > 0 && <span className="font-bold underline">{integrityReport.criticalCount} çelişkili çeviri karşılığı, </span>}
              {integrityReport.exactDuplicatesCount > 0 && <span>{integrityReport.exactDuplicatesCount} mükerrer kayıt, </span>}
              {integrityReport.nearMatchesCount > 0 && <span>{integrityReport.nearMatchesCount} yakın yazım uyuşmazlığı </span>}
              tespit edildi.
            </span>
          </div>

          <div className="flex items-center gap-2">
            {integrityReport.exactDuplicatesCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  const { updatedTerms, removedCount } = autoResolveExactDuplicates(terms);
                  onUpdateTerms(updatedTerms);
                  setNotification(`${removedCount} mükerrer kayıt temizlendi.`);
                  setTimeout(() => setNotification(null), 3000);
                }}
                className="px-2.5 py-1 rounded bg-amber-900/80 hover:bg-amber-800 text-amber-200 text-[11px] font-semibold border border-amber-500/40 flex items-center gap-1"
              >
                <Wand2 className="w-3 h-3" />
                <span>Mükerrerleri Temizle</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsIntegrityModalOpen(true)}
              className="px-3 py-1 rounded bg-red-900 hover:bg-red-800 text-white text-[11px] font-bold border border-red-500/50 shadow-sm"
            >
              Çelişkileri Çöz &rarr;
            </button>
          </div>
        </div>
      )}

      {/* Notification banner */}
      {notification && (
        <div className="bg-emerald-950/80 border-b border-emerald-500/30 px-4 py-2 text-xs text-emerald-300 flex items-center justify-between animate-fadeIn">
          <span>{notification}</span>
          <button onClick={() => setNotification(null)} className="text-emerald-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* New Term Form (Collapse/Expand) */}
      {isAddingNew && (
        <form onSubmit={handleAddTerm} className="p-4 bg-slate-950 border-b border-slate-800 text-xs">
          <div className="font-semibold text-emerald-400 mb-2 flex items-center gap-1.5">
            <Plus className="w-4 h-4" />
            <span>Yeni Askeri / Teknik Terim Ekle</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="md:col-span-2">
              <label className="block text-slate-400 text-[11px] mb-1">Türkçe Terim (TR) *</label>
              <input
                type="text"
                required
                placeholder="Örn: Aktif Faz Dizinli Radar"
                value={newTr}
                onChange={e => setNewTr(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-md px-2.5 py-1.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-slate-400 text-[11px] mb-1">İngilizce Karşılık (EN) *</label>
              <input
                type="text"
                required
                placeholder="Örn: Active Electronically Scanned Array Radar"
                value={newEn}
                onChange={e => setNewEn(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-md px-2.5 py-1.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 text-[11px] mb-1">Kısaltma (Varsa)</label>
              <input
                type="text"
                placeholder="Örn: AESA (Boşsa null)"
                value={newAbbr}
                onChange={e => setNewAbbr(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-md px-2.5 py-1.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
            <div>
              <label className="block text-slate-400 text-[11px] mb-1">Kategori</label>
              <input
                type="text"
                placeholder="Radar & Sensör, Elektronik Harp, C4ISR..."
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-md px-2.5 py-1.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-slate-400 text-[11px] mb-1">Not / Standart</label>
              <input
                type="text"
                placeholder="Örn: 3 kelimelik tamlama - tekil kelimelerden önce aranmalı"
                value={newNotes}
                onChange={e => setNewNotes(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-md px-2.5 py-1.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <button
              type="button"
              onClick={() => setIsAddingNew(false)}
              className="px-3 py-1.5 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-md font-medium"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md font-semibold flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Kaydet ve Sözlüğe Ekle</span>
            </button>
          </div>
        </form>
      )}

      {/* Filter and Search Toolbar */}
      <div className="p-3 bg-slate-950/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Search Input */}
        <div className="relative min-w-[220px] flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Terim, İngilizce karşılık veya kısaltma ara..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-8 pr-3 py-1.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* N-Gram Priority Filter Buttons */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
          <span className="text-[11px] text-slate-400 px-2 font-medium">N-Gram Önceliği:</span>
          <button
            type="button"
            onClick={() => setSelectedNgramFilter('all')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium ${
              selectedNgramFilter === 'all' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Tümü ({ngramStats.total})
          </button>
          <button
            type="button"
            onClick={() => setSelectedNgramFilter('3+')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium flex items-center gap-1 ${
              selectedNgramFilter === '3+' ? 'bg-amber-600 text-white' : 'text-amber-400/80 hover:text-amber-300'
            }`}
            title="3 ve üzeri kelimelik uzun tamlamalar (En yüksek öncelik)"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            3+ Gram ({ngramStats.threePlus})
          </button>
          <button
            type="button"
            onClick={() => setSelectedNgramFilter('2')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium flex items-center gap-1 ${
              selectedNgramFilter === '2' ? 'bg-emerald-600 text-white' : 'text-emerald-400/80 hover:text-emerald-300'
            }`}
            title="2 kelimelik bileşik tamlamalar (Orta öncelik)"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            2-Gram ({ngramStats.two})
          </button>
          <button
            type="button"
            onClick={() => setSelectedNgramFilter('1')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium flex items-center gap-1 ${
              selectedNgramFilter === '1' ? 'bg-cyan-600 text-white' : 'text-cyan-400/80 hover:text-cyan-300'
            }`}
            title="Tekil kelimeler"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
            1-Gram ({ngramStats.one})
          </button>
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            aria-label="Kategoriye Göre Filtrele"
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="bg-slate-900 border border-slate-700/80 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">Tüm Kategoriler ({terms.length})</option>
            {categories.map(c => (
              <option key={c} value={c}>
                {c} ({terms.filter(t => t.kategori === c).length})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Terms Table */}
      <div className="overflow-x-auto max-h-[380px] overflow-y-auto divide-y divide-slate-800 scrollbar-thin">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider sticky top-0 z-10 border-b border-slate-800">
            <tr>
              <th className="px-3 py-2 w-16">N-Gram</th>
              <th className="px-4 py-2">Türkçe Terim (TR)</th>
              <th className="px-4 py-2">İngilizce Karşılık (EN)</th>
              <th className="px-3 py-2 w-28">Kısaltma</th>
              <th className="px-3 py-2 w-32">Kategori</th>
              <th className="px-3 py-2 w-20 text-right">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
            {filteredTerms.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500 font-sans">
                  Aramanızla eşleşen savunma terimi bulunamadı.
                </td>
              </tr>
            ) : (
              filteredTerms.map(term => {
                const isEditing = editingId === term.id;
                const ngramCount = calculateNgramCount(term.tr);

                if (isEditing) {
                  return (
                    <tr key={term.id} className="bg-slate-800/90 font-sans">
                      <td className="px-3 py-2">
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-700 text-slate-300">
                          {ngramCount}G
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={editTr}
                          onChange={e => setEditTr(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-white"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={editEn}
                          onChange={e => setEditEn(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-white"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          placeholder="null"
                          value={editAbbr}
                          onChange={e => setEditAbbr(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-white"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={editCategory}
                          onChange={e => setEditCategory(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-white"
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleSaveEdit(term.id)}
                            className="p-1 text-emerald-400 hover:text-emerald-300"
                            title="Kaydet"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1 text-slate-400 hover:text-white"
                            title="İptal"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={term.id} className="hover:bg-slate-800/40 transition-colors group">
                    {/* N-Gram Priority Badge */}
                    <td className="px-3 py-2 font-sans">
                      {ngramCount >= 3 ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-500/30" title="3+ Gram (Öncelikli Tamlama)">
                          3+G
                        </span>
                      ) : ngramCount === 2 ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/30" title="2-Gram (Bileşik Terim)">
                          2G
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-400" title="1-Gram (Tekil Kelime)">
                          1G
                        </span>
                      )}
                    </td>

                    {/* TR Term */}
                    <td className="px-4 py-2 font-semibold text-slate-100 font-sans">
                      {term.tr}
                    </td>

                    {/* EN Term */}
                    <td className="px-4 py-2 text-cyan-200 font-sans">
                      {term.en}
                    </td>

                    {/* Abbreviation */}
                    <td className="px-3 py-2 font-sans">
                      {term.kısaltma ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950/80 text-purple-300 border border-purple-500/30">
                          {term.kısaltma}
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[10px] italic">
                          (Kısaltmasız)
                        </span>
                      )}
                    </td>

                    {/* Category */}
                    <td className="px-3 py-2 font-sans text-slate-400 text-[11px]">
                      {term.kategori || 'Genel'}
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-2 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleStartEdit(term)}
                          className="p-1 text-slate-400 hover:text-emerald-400 transition-colors"
                          title="Düzenle"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteTerm(term.id)}
                          className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                          title="Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="p-2.5 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            3+ Gram ({ngramStats.threePlus}): Öncelikli Tamlama
          </span>
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            2-Gram ({ngramStats.two}): Bileşik Terim
          </span>
        </div>
        <div className="text-slate-400">
          Toplam <strong>{terms.length}</strong> terim motor veri tabanında aktif.
        </div>
      </div>

      {/* Data Integrity Checker Modal */}
      <DataIntegrityModal
        isOpen={isIntegrityModalOpen}
        onClose={() => setIsIntegrityModalOpen(false)}
        report={integrityReport}
        terms={terms}
        onUpdateTerms={onUpdateTerms}
      />
    </div>
  );
};
