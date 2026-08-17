import * as XLSX from 'xlsx';
import { TermItem } from '../types';

export function parseExcelFile(fileData: ArrayBuffer): Promise<TermItem[]> {
  return new Promise((resolve, reject) => {
    try {
      const workbook = XLSX.read(fileData, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (rawRows.length === 0) {
        resolve([]);
        return;
      }

      // Detect header row or assume standard positions
      let headerRowIndex = -1;
      let trCol = -1;
      let enCol = -1;
      let abbrCol = -1;
      let catCol = -1;
      let noteCol = -1;

      for (let r = 0; r < Math.min(rawRows.length, 5); r++) {
        const row = rawRows[r] || [];
        for (let c = 0; c < row.length; c++) {
          const val = String(row[c] || '').toLowerCase().trim();
          if (val === 'tr' || val === 'türkçe' || val === 'turkish' || val.includes('türkçe terim')) {
            trCol = c;
            headerRowIndex = r;
          } else if (val === 'en' || val === 'ingilizce' || val === 'english' || val.includes('ingilizce terim')) {
            enCol = c;
            headerRowIndex = r;
          } else if (val === 'kısaltma' || val === 'abbr' || val === 'abbreviation' || val === 'acronym') {
            abbrCol = c;
          } else if (val === 'kategori' || val === 'category' || val === 'alan') {
            catCol = c;
          } else if (val === 'notlar' || val === 'notes' || val === 'açıklama' || val === 'not') {
            noteCol = c;
          }
        }
        if (trCol !== -1 && enCol !== -1) break;
      }

      // Default fallback column indices if header not found
      if (trCol === -1 || enCol === -1) {
        trCol = 0;
        enCol = 1;
        abbrCol = 2;
        catCol = 3;
        noteCol = 4;
        headerRowIndex = 0;
      }

      const terms: TermItem[] = [];
      const startRow = headerRowIndex + 1;

      for (let r = startRow; r < rawRows.length; r++) {
        const row = rawRows[r];
        if (!row || row.length === 0) continue;

        const trVal = String(row[trCol] || '').trim();
        const enVal = String(row[enCol] || '').trim();
        const abbrVal = abbrCol !== -1 && row[abbrCol] ? String(row[abbrCol]).trim() : null;
        const catVal = catCol !== -1 && row[catCol] ? String(row[catCol]).trim() : 'Genel';
        const noteVal = noteCol !== -1 && row[noteCol] ? String(row[noteCol]).trim() : '';

        if (trVal && enVal && trVal !== 'TR' && enVal !== 'EN') {
          terms.push({
            id: `term-imported-${Date.now()}-${r}`,
            tr: trVal,
            en: enVal,
            kısaltma: abbrVal && abbrVal !== '' && abbrVal.toLowerCase() !== 'null' && abbrVal !== '-' ? abbrVal : null,
            kategori: catVal || 'Genel',
            notlar: noteVal
          });
        }
      }

      resolve(terms);
    } catch (err) {
      reject(err);
    }
  });
}

export function exportTermsToExcel(terms: TermItem[], filename: string = 'Savunma_Sanayii_Terim_Verisi.xlsx'): void {
  const exportData = terms.map((term, idx) => ({
    'No': idx + 1,
    'Türkçe Terim (TR)': term.tr,
    'İngilizce Karşılık (EN)': term.en,
    'Kısaltma (Abbr)': term.kısaltma || '',
    'Kategori': term.kategori || 'Genel',
    'Tamlama Seviyesi (N-Gram)': `${term.tr.split(/\s+/).length}-Gram`,
    'Notlar': term.notlar || ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  
  // Set column widths
  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 36 },
    { wch: 36 },
    { wch: 16 },
    { wch: 22 },
    { wch: 24 },
    { wch: 40 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Terim_Verisi');
  XLSX.writeFile(workbook, filename);
}

export function exportTermsToJson(terms: TermItem[], filename: string = 'Savunma_Sanayii_Terim_Verisi.json'): void {
  const structuredData = terms.map(term => ({
    tr: term.tr,
    en: term.en,
    kısaltma: term.kısaltma || null,
    kategori: term.kategori || 'Genel',
    notlar: term.notlar || '',
  }));

  const jsonString = JSON.stringify(structuredData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportTermsToCsv(terms: TermItem[], filename: string = 'Savunma_Sanayii_Terim_Verisi.csv'): void {
  const headers = ['Türkçe Terim (TR)', 'İngilizce Karşılık (EN)', 'Kısaltma', 'Kategori', 'Notlar'];
  const rows = terms.map(t => [
    `"${(t.tr || '').replace(/"/g, '""')}"`,
    `"${(t.en || '').replace(/"/g, '""')}"`,
    `"${(t.kısaltma || '').replace(/"/g, '""')}"`,
    `"${(t.kategori || '').replace(/"/g, '""')}"`,
    `"${(t.notlar || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function parseJsonFile(jsonString: string): TermItem[] {
  const parsed = JSON.parse(jsonString);
  const rawList = Array.isArray(parsed) ? parsed : parsed.terms || parsed.data || [];
  
  const terms: TermItem[] = [];
  rawList.forEach((item: any, idx: number) => {
    if (!item) return;
    const tr = String(item.tr || item.turkish || item.Turkish || item['Türkçe'] || item['Türkçe Terim'] || item.source || '').trim();
    const en = String(item.en || item.english || item.English || item['İngilizce'] || item['İngilizce Karşılık'] || item.target || '').trim();
    const abbr = item.kısaltma || item.kisaltma || item.abbr || item.abbreviation || item.Acronym || item.acronym || null;
    const cat = item.kategori || item.category || item.alan || 'Genel';
    const note = item.notlar || item.notes || item['açıklama'] || '';

    if (tr && en) {
      terms.push({
        id: `term-json-${Date.now()}-${idx}`,
        tr,
        en,
        kısaltma: abbr && String(abbr).trim() !== '' && String(abbr).toLowerCase() !== 'null' ? String(abbr).trim() : null,
        kategori: String(cat).trim() || 'Genel',
        notlar: String(note).trim()
      });
    }
  });

  return terms;
}

export async function parseTermsFile(file: File): Promise<{ terms: TermItem[]; format: 'xlsx' | 'csv' | 'json' }> {
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith('.json')) {
    const text = await file.text();
    const terms = parseJsonFile(text);
    return { terms, format: 'json' };
  } else {
    // xlsx, xls, csv
    const buffer = await file.arrayBuffer();
    const terms = await parseExcelFile(buffer);
    const format = fileName.endsWith('.csv') ? 'csv' : 'xlsx';
    return { terms, format };
  }
}

export function exportTranslationBatchToExcel(
  items: { original: string; translated: string; context?: string }[],
  filename: string = 'Savunma_Ceviri_Raporu.xlsx'
): void {
  const exportData = items.map((item, idx) => ({
    'Sıra': idx + 1,
    'Kaynak Metin': item.original,
    'Çevrilen Metin (Savunma Terminolojisi)': item.translated,
    'Bağlam / Standart': item.context || 'Askeri Standart'
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 60 },
    { wch: 60 },
    { wch: 25 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Çeviri_Sonuçları');
  XLSX.writeFile(workbook, filename);
}
