export type TranslationDirection = 'tr-en' | 'en-tr';

export interface TermItem {
  id: string;
  tr: string;
  en: string;
  kısaltma?: string | null; // abbreviation e.g. "HSS", "AKD", "EİR"
  kategori?: string;
  notlar?: string;
  ngramCount?: number; // 1, 2, 3+ words for priority ranking
}

export interface ReferenceContextItem {
  id: string;
  title: string;
  category: 'MIL-STD' | 'SRS' | 'ICD' | 'STANAG' | 'MANUAL' | 'CUSTOM';
  sourceSnippet: string;
  targetSnippet: string;
  description: string;
  tone: 'formal_passive' | 'imperative' | 'technical_interface' | 'military_spec';
}

export interface TranslationOptions {
  direction: TranslationDirection;
  toneStyle: 'military_standard' | 'system_requirement' | 'technical_interface' | 'formal_passive' | 'tactical_imperative';
  enforceZeroHallucination: boolean;
  prioritizeNgrams: boolean;
  useAbbreviations: boolean;
  selectedCategories?: string[];
}

export interface TermMatch {
  term: TermItem;
  matchedText: string;
  startIndex: number;
  endIndex: number;
  ngramLevel: number;
  appliedTranslation: string;
  appliedAbbreviation?: string | null;
}

export interface AuditReport {
  overallScore: number; // 0 - 100
  ngramCompliance: {
    passed: boolean;
    totalNgramsMatched: number;
    multiWordTerms: string[];
    details: string;
  };
  abbreviationCompliance: {
    passed: boolean;
    validAbbreviations: string[];
    inventedAbbreviationsDetected: string[];
    details: string;
  };
  terminologyStability: {
    passed: boolean;
    matchedGlossaryTerms: number;
    totalDetectedTerms: number;
    unmatchedOrSynonymRisks: string[];
    details: string;
  };
  contextAndTone: {
    detectedContext: string;
    toneStyle: string;
    formalityAssessment: string;
  };
  reliabilityAndZeroHallucination: {
    passed: boolean;
    flaggedUnknownAcronyms: string[];
    uncertainTermsCount: number;
    details: string;
  };
}

export interface TranslationResponse {
  translatedText: string;
  matches: TermMatch[];
  audit?: AuditReport;
  rawPromptUsed?: string;
  executionTimeMs?: number;
}
