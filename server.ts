import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SYSTEM_INSTRUCTION = `Sen, askeri ve savunma sanayii terminolojisinde uzmanlaşmış, sıfır hata toleransıyla çalışan profesyonel bir teknik çeviri motorusun. Sana çevrilecek metin ile birlikte, bir Excel dosyasından çekilmiş yapılandırılmış terim verileri sağlanacaktır.

Görevlerin ve Kuralların:
1. UZUN TAMLAMA ÖNCELİĞİ (N-GRAM MANTIĞI): Sana sağlanan [EXCEL_TERİM_VERİSİ] içindeki 2'li veya 3'lü kelime tamlamalarını (örn: "Atış Kontrol Radarı"), tekil kelimelerden (örn: "Atış", "Kontrol") daha önce ara ve eşleştir. Bir tamlama eşleştiğinde, o bloğu bir bütün olarak çevir, kelimeleri asla parçalama.
2. ESNEL KISALTMA YÖNETİMİ: Excel verisinde bir terimin yanında kısaltma belirtilmişse (örn: "Erken İhbar Radarı (EİR)"), çeviride bu kısaltmayı kurallara uygun olarak kullan. Eğer veride kısaltma yoksa veya boş bırakılmışsa, kesinlikle yeni bir kısaltma türetme; sadece açık halinin çevirisini yap.
3. KESİN İTAAT VE TERİM SABİTLİĞİ: [EXCEL_TERİM_VERİSİ] listesinde karşılığı verilen ifadeler için asla eşanlamlı kelime kullanma. Excel verisi kanundur.
4. BAĞLAMSAL BÜTÜNLÜK: [REFERANS_BAĞLAM] bölümündeki geçmiş çeviri örneklerini incele. Çevrilen cümlenin askeri bir standart, sistem gereksinimi veya teknik arayüz bağlamında olup olmadığını tespit et. Cümle yapısını ve üslubu bu bağlama göre (resmi, edilgen veya emredici) şekillendir.
5. GÜVENİLİRLİK: Excel listesinde olmayan, çevirisinden tam emin olmadığın spesifik bir kısaltma veya bileşenle karşılaşırsan, onu orijinal dilinde bırak ve sonuna köşeli parantez içinde [?] işareti ekle. Hallüsinasyon (hallucination) yaparak teknik terim icat etme.

GİRDİ FORMATI:
[ÇEVRİLECEK_METİN]: {Kullanıcının çevrilmesini istediği ham metin}
[EXCEL_TERİM_VERİSİ]: [
  {"tr": "Hava Savunma Sistemi", "en": "Air Defense System", "kısaltma": "HSS"},
  {"tr": "Arayüz Kontrol Dökümanı", "en": "Interface Control Document", "kısaltma": null},
  {"tr": "İz", "en": "Track", "kısaltma": null}
]
[REFERANS_BAĞLAM]: {Geçmiş dökümanlardan eşleşen benzer cümleler veya boş}

ÇIKTI FORMATI:
Sadece çevrilmiş metni ver. Çevirinin neden böyle yapıldığına dair hiçbir ek açıklama, selamlama, not veya yorum ekleme.`;

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not defined in environment variables');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      engine: 'Military & Defense Technical Translation Engine',
      model: 'gemini-3.7-flash',
      hasApiKey: !!process.env.GEMINI_API_KEY,
    });
  });

  // Direct Translation Endpoint
  app.post('/api/translate', async (req, res) => {
    try {
      const { sourceText, terms, referenceContextText, direction = 'tr-en' } = req.body;

      if (!sourceText || typeof sourceText !== 'string' || sourceText.trim() === '') {
        return res.status(400).json({ error: 'sourceText is required' });
      }

      const cleanTerms = Array.isArray(terms)
        ? terms.map((t: any) => ({
            tr: String(t.tr || '').trim(),
            en: String(t.en || '').trim(),
            kısaltma: t.kısaltma && String(t.kısaltma).trim() !== '' && String(t.kısaltma).toLowerCase() !== 'null'
              ? String(t.kısaltma).trim()
              : null,
          }))
        : [];

      const prompt = `[ÇEVRİLECEK_METİN]: ${sourceText.trim()}

[EXCEL_TERİM_VERİSİ]: ${JSON.stringify(cleanTerms, null, 2)}

[REFERANS_BAĞLAM]: ${referenceContextText && String(referenceContextText).trim() !== '' ? referenceContextText.trim() : 'Boş'}`;

      const ai = getGeminiClient();
      const startTime = Date.now();

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.05,
          topP: 0.9,
        },
      });

      const translatedText = response.text || '';
      const executionTimeMs = Date.now() - startTime;

      res.json({
        translatedText: translatedText.trim(),
        rawPromptUsed: prompt,
        executionTimeMs,
      });
    } catch (error: any) {
      console.error('Translation error:', error);
      res.status(500).json({
        error: error.message || 'Translation failed',
      });
    }
  });

  // Streaming Translation Endpoint (SSE)
  app.post('/api/translate-stream', async (req, res) => {
    try {
      const { sourceText, terms, referenceContextText } = req.body;

      if (!sourceText || typeof sourceText !== 'string' || sourceText.trim() === '') {
        return res.status(400).json({ error: 'sourceText is required' });
      }

      const cleanTerms = Array.isArray(terms)
        ? terms.map((t: any) => ({
            tr: String(t.tr || '').trim(),
            en: String(t.en || '').trim(),
            kısaltma: t.kısaltma && String(t.kısaltma).trim() !== '' && String(t.kısaltma).toLowerCase() !== 'null'
              ? String(t.kısaltma).trim()
              : null,
          }))
        : [];

      const prompt = `[ÇEVRİLECEK_METİN]: ${sourceText.trim()}

[EXCEL_TERİM_VERİSİ]: ${JSON.stringify(cleanTerms, null, 2)}

[REFERANS_BAĞLAM]: ${referenceContextText && String(referenceContextText).trim() !== '' ? referenceContextText.trim() : 'Boş'}`;

      const ai = getGeminiClient();

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const responseStream = await ai.models.generateContentStream({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.05,
          topP: 0.9,
        },
      });

      for await (const chunk of responseStream) {
        if (chunk.text) {
          res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
        }
      }

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error: any) {
      console.error('Streaming translation error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: error.message || 'Stream failed' });
      } else {
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
        res.end();
      }
    }
  });

  // Batch Translation Endpoint
  app.post('/api/batch-translate', async (req, res) => {
    try {
      const { items, terms, referenceContextText } = req.body;

      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'items array is required' });
      }

      const cleanTerms = Array.isArray(terms)
        ? terms.map((t: any) => ({
            tr: String(t.tr || '').trim(),
            en: String(t.en || '').trim(),
            kısaltma: t.kısaltma && String(t.kısaltma).trim() !== '' ? String(t.kısaltma).trim() : null,
          }))
        : [];

      const ai = getGeminiClient();
      const results: { original: string; translated: string }[] = [];

      for (const item of items) {
        const textToTranslate = typeof item === 'string' ? item : item.text;
        if (!textToTranslate || textToTranslate.trim() === '') continue;

        const prompt = `[ÇEVRİLECEK_METİN]: ${textToTranslate.trim()}

[EXCEL_TERİM_VERİSİ]: ${JSON.stringify(cleanTerms, null, 2)}

[REFERANS_BAĞLAM]: ${referenceContextText || 'Boş'}`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.7-flash',
          contents: prompt,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            temperature: 0.05,
          },
        });

        results.push({
          original: textToTranslate,
          translated: (response.text || '').trim(),
        });
      }

      res.json({ results });
    } catch (error: any) {
      console.error('Batch translation error:', error);
      res.status(500).json({ error: error.message || 'Batch translation failed' });
    }
  });

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[MIL-TERM ENGINE] Server operational on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup failure:', err);
  process.exit(1);
});
