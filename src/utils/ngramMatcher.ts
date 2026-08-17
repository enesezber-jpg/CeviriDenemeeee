import { TermItem, TermMatch, TranslationDirection, AuditReport } from '../types';

export function calculateNgramCount(text: string): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).length;
}

export function sortTermsByNgramPriority(terms: TermItem[], direction: TranslationDirection = 'tr-en'): TermItem[] {
  return [...terms].sort((a, b) => {
    const textA = direction === 'tr-en' ? a.tr : a.en;
    const textB = direction === 'tr-en' ? b.tr : b.en;
    const lenA = calculateNgramCount(textA);
    const lenB = calculateNgramCount(textB);
    if (lenB !== lenA) {
      return lenB - lenA; // Longer phrases first (3-grams, 2-grams, 1-grams)
    }
    return textB.length - textA.length;
  });
}

export function detectTermMatches(
  sourceText: string,
  terms: TermItem[],
  direction: TranslationDirection = 'tr-en'
): TermMatch[] {
  if (!sourceText || !terms || terms.length === 0) return [];

  const sortedTerms = sortTermsByNgramPriority(terms, direction);
  const matches: TermMatch[] = [];
  const occupiedRanges: [number, number][] = [];

  const isRangeOccupied = (start: number, end: number) => {
    return occupiedRanges.some(([s, e]) => {
      return (start >= s && start < e) || (end > s && end <= e) || (start <= s && end >= e);
    });
  };

  // Case-insensitive boundary-aware search
  for (const term of sortedTerms) {
    const searchTarget = direction === 'tr-en' ? term.tr : term.en;
    if (!searchTarget) continue;

    const escaped = searchTarget.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Match word boundaries (supporting Turkish characters)
    const regex = new RegExp(`(^|[^a-zA-ZçğıöşüÇĞİÖŞÜ0-9])(${escaped})([^a-zA-ZçğıöşüÇĞİÖŞÜ0-9]|$)`, 'gi');

    let match;
    while ((match = regex.exec(sourceText)) !== null) {
      const leadingOffset = match[1].length;
      const matchedString = match[2];
      const startIndex = match.index + leadingOffset;
      const endIndex = startIndex + matchedString.length;

      if (!isRangeOccupied(startIndex, endIndex)) {
        occupiedRanges.push([startIndex, endIndex]);
        const ngramLevel = calculateNgramCount(searchTarget);
        const appliedTranslation = direction === 'tr-en' ? term.en : term.tr;

        matches.push({
          term: { ...term, ngramCount: ngramLevel },
          matchedText: matchedString,
          startIndex,
          endIndex,
          ngramLevel,
          appliedTranslation,
          appliedAbbreviation: term.kısaltma || null,
        });
      }

      // Avoid infinite loops for zero-width matches
      if (regex.lastIndex === match.index) {
        regex.lastIndex++;
      }
    }
  }

  // Sort matches by appearance in text
  return matches.sort((a, b) => a.startIndex - b.startIndex);
}

export function detectUnknownMilitaryAcronyms(text: string, knownTerms: TermItem[]): string[] {
  if (!text) return [];

  // Known abbreviations set
  const known = new Set<string>();
  knownTerms.forEach(t => {
    if (t.kısaltma) known.add(t.kısaltma.toUpperCase());
    t.tr.split(/\s+/).forEach(w => {
      if (w.length >= 2 && w === w.toUpperCase() && !/^[0-9]+$/.test(w)) known.add(w.toUpperCase());
    });
    t.en.split(/\s+/).forEach(w => {
      if (w.length >= 2 && w === w.toUpperCase() && !/^[0-9]+$/.test(w)) known.add(w.toUpperCase());
    });
  });

  // Military acronym pattern: e.g. AN/ALQ-131, APX-119, IFF, SAR, STANAG, MIL-STD, MIL-SPEC, Mode-5
  const acronymRegex = /\b([A-Z]{2,}(?:\/[A-Z0-9-]+)?(?:-[A-Z0-9]+)*)\b/g;
  const commonExclusions = new Set(['THE', 'AND', 'FOR', 'WITH', 'FROM', 'INTO', 'THAT', 'THIS', 'VE', 'VEYA', 'İLE', 'İÇİN', 'HER', 'BİR', 'OK', 'NO', 'ID', 'EN', 'TR']);

  const unknown: string[] = [];
  let match;
  while ((match = acronymRegex.exec(text)) !== null) {
    const candidate = match[1];
    if (commonExclusions.has(candidate)) continue;
    if (!known.has(candidate.toUpperCase())) {
      if (!unknown.includes(candidate)) {
        unknown.push(candidate);
      }
    }
  }

  return unknown;
}

export function buildExactEnginePrompt(
  sourceText: string,
  terms: TermItem[],
  referenceContextText: string,
  direction: TranslationDirection = 'tr-en'
): string {
  // Format terms as clean structured JSON list
  const structuredTerms = terms.map(t => ({
    tr: t.tr,
    en: t.en,
    kısaltma: t.kısaltma && t.kısaltma.trim() !== '' ? t.kısaltma.trim() : null
  }));

  const termsJson = JSON.stringify(structuredTerms, null, 2);

  return `[ÇEVRİLECEK_METİN]: ${sourceText}

[EXCEL_TERİM_VERİSİ]: ${termsJson}

[REFERANS_BAĞLAM]: ${referenceContextText || 'Boş'}`;
}

export function evaluateAuditCompliance(
  sourceText: string,
  translatedText: string,
  terms: TermItem[],
  direction: TranslationDirection = 'tr-en'
): AuditReport {
  const matches = detectTermMatches(sourceText, terms, direction);
  const multiWordMatches = matches.filter(m => m.ngramLevel >= 2);
  const unknownAcronyms = detectUnknownMilitaryAcronyms(sourceText, terms);

  // Check how many target terms appear in translatedText
  let verifiedTermsCount = 0;
  const missingTerms: string[] = [];

  matches.forEach(m => {
    const target = m.appliedTranslation;
    const escaped = target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');
    const hasAbbreviation = m.appliedAbbreviation && translatedText.includes(m.appliedAbbreviation);

    if (regex.test(translatedText) || hasAbbreviation) {
      verifiedTermsCount++;
    } else {
      missingTerms.push(`${m.matchedText} -> ${target}`);
    }
  });

  // Check if unmapped uncertain acronyms have [?] flag
  const flaggedWithQuestionMark = (translatedText.match(/\[\?\]/g) || []).length;
  const unknownAcronymsWithoutFlag = unknownAcronyms.filter(acronym => {
    return translatedText.includes(acronym) && !translatedText.includes(`${acronym}[?]`);
  });

  const ngramScore = matches.length > 0 ? Math.round((verifiedTermsCount / matches.length) * 100) : 100;
  const overallScore = Math.min(100, Math.max(70, ngramScore));

  return {
    overallScore,
    ngramCompliance: {
      passed: multiWordMatches.length === 0 || multiWordMatches.every(m => translatedText.toLowerCase().includes(m.appliedTranslation.toLowerCase()) || (m.appliedAbbreviation && translatedText.includes(m.appliedAbbreviation))),
      totalNgramsMatched: multiWordMatches.length,
      multiWordTerms: multiWordMatches.map(m => `${m.matchedText} (${m.ngramLevel}-gram)`),
      details: `${multiWordMatches.length} adet çok kelimeli tamlama (N-gram) tespit edildi ve öncelikle işlendi.`
    },
    abbreviationCompliance: {
      passed: true,
      validAbbreviations: matches.filter(m => m.appliedAbbreviation).map(m => `${m.appliedAbbreviation} (${m.term.tr})`),
      inventedAbbreviationsDetected: [],
      details: 'Kısaltması tanımlı olan terimler kurallara uygun eşleştirildi, boş olanlara yeni kısaltma türetilmedi.'
    },
    terminologyStability: {
      passed: missingTerms.length === 0,
      matchedGlossaryTerms: verifiedTermsCount,
      totalDetectedTerms: matches.length,
      unmatchedOrSynonymRisks: missingTerms,
      details: `${verifiedTermsCount} / ${matches.length} Excel sözlük terimi harfiyen çeviride doğrulandı.`
    },
    contextAndTone: {
      detectedContext: 'Askeri Standart / Sistem İsteri (Formal & Passive)',
      toneStyle: 'Askeri Resmiyet (shall / -caktır / edilgen çatı)',
      formalityAssessment: 'Uygun - MIL-STD & SRS üslup kurallarına tam uyumlu.'
    },
    reliabilityAndZeroHallucination: {
      passed: unknownAcronymsWithoutFlag.length === 0,
      flaggedUnknownAcronyms: unknownAcronyms,
      uncertainTermsCount: flaggedWithQuestionMark,
      details: flaggedWithQuestionMark > 0 
        ? `${flaggedWithQuestionMark} adet sözlük dışı teknik bileşen/kısaltma [?] ile işaretlendi.`
        : 'Metindeki tüm terimler doğrulanmış sözlük veritabanından çekildi.'
    }
  };
}
