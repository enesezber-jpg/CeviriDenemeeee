import { TermItem } from '../types';

export type IssueSeverity = 'critical' | 'warning' | 'info';

export interface IntegrityIssue {
  id: string;
  type: 'conflicting_translation' | 'reverse_conflicting_translation' | 'conflicting_abbreviation' | 'exact_duplicate' | 'near_match';
  severity: IssueSeverity;
  title: string;
  description: string;
  conflictingTerms: TermItem[];
  suggestedAction: string;
}

export interface IntegrityReport {
  totalIssues: number;
  criticalCount: number;
  warningCount: number;
  exactDuplicatesCount: number;
  conflictingCount: number;
  nearMatchesCount: number;
  isClean: boolean;
  issues: IntegrityIssue[];
}

// Levenshtein distance helper for near-match similarity detection
function levenshteinDistance(a: string, b: string): number {
  const an = a ? a.length : 0;
  const bn = b ? b.length : 0;
  if (an === 0) return bn;
  if (bn === 0) return an;
  const matrix = Array(bn + 1);
  for (let i = 0; i <= bn; ++i) {
    let row = Array(an + 1);
    row[0] = i;
    matrix[i] = row;
  }
  for (let i = 1; i <= an; ++i) {
    matrix[0][i] = i;
  }
  for (let i = 1; i <= bn; ++i) {
    for (let j = 1; j <= an; ++j) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1 // deletion
          )
        );
      }
    }
  }
  return matrix[bn][an];
}

function normalizeTerm(str: string): string {
  return (str || '')
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function checkGlossaryIntegrity(terms: TermItem[]): IntegrityReport {
  const issues: IntegrityIssue[] = [];
  const visitedExactPairs = new Set<string>();

  // 1. Group by Normalized TR Term to detect conflicting EN equivalents or exact duplicates
  const trGroups = new Map<string, TermItem[]>();
  terms.forEach(term => {
    const key = normalizeTerm(term.tr);
    if (!key) return;
    if (!trGroups.has(key)) trGroups.set(key, []);
    trGroups.get(key)!.push(term);
  });

  trGroups.forEach((group, normTr) => {
    if (group.length > 1) {
      // Check for exact duplicates
      const enSet = new Set<string>();
      const abbrSet = new Set<string>();
      const distinctEnMap = new Map<string, TermItem[]>();

      group.forEach(t => {
        const normEn = normalizeTerm(t.en);
        if (!distinctEnMap.has(normEn)) distinctEnMap.set(normEn, []);
        distinctEnMap.get(normEn)!.push(t);
        enSet.add(normEn);
        if (t.kısaltma) abbrSet.add(normalizeTerm(t.kısaltma));
      });

      // Exact Duplicates (Same TR, same EN)
      distinctEnMap.forEach((subGroup, normEn) => {
        if (subGroup.length > 1) {
          const pairKey = `exact-${normTr}-${normEn}`;
          if (!visitedExactPairs.has(pairKey)) {
            visitedExactPairs.add(pairKey);
            issues.push({
              id: `issue-dup-${subGroup[0].id}`,
              type: 'exact_duplicate',
              severity: 'warning',
              title: `Mükerrer Kayıt: "${subGroup[0].tr}"`,
              description: `"${subGroup[0].tr}" terimi ve "${subGroup[0].en}" çevirisi sözlükte ${subGroup.length} kez mükerrer olarak tanımlanmış.`,
              conflictingTerms: subGroup,
              suggestedAction: 'Fazla mükerrer kayıtları temizleyin.',
            });
          }
        }
      });

      // Conflicting EN Translations for the same TR term (Critical)
      if (distinctEnMap.size > 1) {
        issues.push({
          id: `issue-conf-tr-${group[0].id}`,
          type: 'conflicting_translation',
          severity: 'critical',
          title: `Çelişkili Karşılık (TR ➔ EN): "${group[0].tr}"`,
          description: `Aynı Türkçe terim için ${distinctEnMap.size} farklı İngilizce çeviri karşılığı tanımlanmış: ${Array.from(distinctEnMap.keys()).map(k => `"${k}"`).join(' vs ')}. Bu durum Kural 3 (Terim Sabitliği) açısından motorun belirsizlik yaşamasına sebep olur.`,
          conflictingTerms: group,
          suggestedAction: 'Tek bir standart savunma sanayii karşılığı seçin ve diğerini güncelleyin veya silin.',
        });
      }

      // Conflicting Abbreviations
      if (abbrSet.size > 1) {
        issues.push({
          id: `issue-abbr-${group[0].id}`,
          type: 'conflicting_abbreviation',
          severity: 'warning',
          title: `Çelişkili Kısaltma: "${group[0].tr}"`,
          description: `Aynı terim için farklı kısaltmalar (${Array.from(abbrSet).join(', ')}) tanımlanmış.`,
          conflictingTerms: group,
          suggestedAction: 'Resmi askeri kısaltmayı standartlaştırın.',
        });
      }
    }
  });

  // 2. Group by Normalized EN Term to detect reverse conflicting TR equivalents
  const enGroups = new Map<string, TermItem[]>();
  terms.forEach(term => {
    const key = normalizeTerm(term.en);
    if (!key) return;
    if (!enGroups.has(key)) enGroups.set(key, []);
    enGroups.get(key)!.push(term);
  });

  enGroups.forEach((group, normEn) => {
    if (group.length > 1) {
      const distinctTrMap = new Map<string, TermItem[]>();
      group.forEach(t => {
        const normTr = normalizeTerm(t.tr);
        if (!distinctTrMap.has(normTr)) distinctTrMap.set(normTr, []);
        distinctTrMap.get(normTr)!.push(t);
      });

      if (distinctTrMap.size > 1) {
        // Check if not already captured in forward conflicts
        const issueId = `issue-conf-en-${group[0].id}`;
        if (!issues.some(i => i.id === issueId)) {
          issues.push({
            id: issueId,
            type: 'reverse_conflicting_translation',
            severity: 'critical',
            title: `Ters Çelişkili Karşılık (EN ➔ TR): "${group[0].en}"`,
            description: `Aynı İngilizce terim için ${distinctTrMap.size} farklı Türkçe çeviri tanımlanmış: ${Array.from(distinctTrMap.keys()).map(k => `"${k}"`).join(' vs ')}. EN ➔ TR çevirisinde tutarsızlık yaratabilir.`,
            conflictingTerms: group,
            suggestedAction: 'Türkçe askeri doktrin karşılığını standartlaştırın.',
          });
        }
      }
    }
  });

  // 3. Near-Match Detection (Typos or subtle plural / casing / suffix differences)
  const checkedPairs = new Set<string>();
  for (let i = 0; i < terms.length; i++) {
    for (let j = i + 1; j < terms.length; j++) {
      const termA = terms[i];
      const termB = terms[j];
      const normA = normalizeTerm(termA.tr);
      const normB = normalizeTerm(termB.tr);

      // Skip exact match (already handled)
      if (normA === normB || normA.length < 4 || normB.length < 4) continue;

      const pairKey = [termA.id, termB.id].sort().join('--');
      if (checkedPairs.has(pairKey)) continue;
      checkedPairs.add(pairKey);

      const dist = levenshteinDistance(normA, normB);
      // Small distance threshold for typo/suffix detection (dist 1 or 2 on long terms)
      const maxLen = Math.max(normA.length, normB.length);
      const isVeryClose = (dist === 1 && maxLen >= 5) || (dist === 2 && maxLen >= 10);

      if (isVeryClose) {
        issues.push({
          id: `issue-near-${termA.id}-${termB.id}`,
          type: 'near_match',
          severity: 'info',
          title: `Benzer / Yakın Yazım: "${termA.tr}" ≈ "${termB.tr}"`,
          description: `"${termA.tr}" (${termA.en}) ile "${termB.tr}" (${termB.en}) terimleri arasında sadece ${dist} harflik yazım farkı var. İmla hatası veya eşanlamlı tamlama riski olabilir.`,
          conflictingTerms: [termA, termB],
          suggestedAction: 'Yazım hatası veya mükerrer tamlama olup olmadığını doğrulayın.',
        });
      }
    }
  }

  const criticalCount = issues.filter(i => i.severity === 'critical').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;
  const exactDuplicatesCount = issues.filter(i => i.type === 'exact_duplicate').length;
  const conflictingCount = issues.filter(i => i.type === 'conflicting_translation' || i.type === 'reverse_conflicting_translation').length;
  const nearMatchesCount = issues.filter(i => i.type === 'near_match').length;

  return {
    totalIssues: issues.length,
    criticalCount,
    warningCount,
    exactDuplicatesCount,
    conflictingCount,
    nearMatchesCount,
    isClean: issues.length === 0,
    issues,
  };
}

export function autoResolveExactDuplicates(terms: TermItem[]): { updatedTerms: TermItem[]; removedCount: number } {
  const seen = new Set<string>();
  const updatedTerms: TermItem[] = [];
  let removedCount = 0;

  terms.forEach(term => {
    const key = `${normalizeTerm(term.tr)}|||${normalizeTerm(term.en)}|||${normalizeTerm(term.kısaltma || '')}`;
    if (!seen.has(key)) {
      seen.add(key);
      updatedTerms.push(term);
    } else {
      removedCount++;
    }
  });

  return { updatedTerms, removedCount };
}
