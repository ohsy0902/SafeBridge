import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, X-Client-Info, apikey, Content-Type, X-Application-Name',
};

interface TranslationRequest {
  text: string;
  targetLanguages: string[];
  sourceLanguage?: string;
  context?: string; // 'safety', 'health', 'emergency', 'general'
  priority?: number; // 1-5, 5 being highest
  enableTTS?: boolean;
  userId?: string;
}

interface TranslationResult {
  originalText: string;
  sourceLanguage: string;
  translations: Record<string, {
    text: string;
    confidence: number;
    audioUrl?: string;
  }>;
  context: string;
  timestamp: string;
}

// 지원 언어 목록 (SafeBridge 특화)
const SUPPORTED_LANGUAGES = {
  'ko': { name: '한국어', nativeName: '한국어', ttsSupported: true },
  'en': { name: 'English', nativeName: 'English', ttsSupported: true },
  'vi': { name: 'Vietnamese', nativeName: 'Tiếng Việt', ttsSupported: true },
  'th': { name: 'Thai', nativeName: 'ไทย', ttsSupported: true },
  'id': { name: 'Indonesian', nativeName: 'Bahasa Indonesia', ttsSupported: true },
  'my': { name: 'Myanmar', nativeName: 'မြန်မာ', ttsSupported: false },
  'km': { name: 'Khmer', nativeName: 'ខ្មែរ', ttsSupported: false },
  'lo': { name: 'Lao', nativeName: 'ລາວ', ttsSupported: false },
  'zh': { name: 'Chinese', nativeName: '中文', ttsSupported: true },
  'ja': { name: 'Japanese', nativeName: '日本語', ttsSupported: true },
  'ru': { name: 'Russian', nativeName: 'Русский', ttsSupported: true },
  'mn': { name: 'Mongolian', nativeName: 'Монгол', ttsSupported: false }
};

// 안전 관련 전문 용어 사전
const SAFETY_TERMINOLOGY = {
  'ko': {
    '긴급상황': ['emergency', 'urgent situation', 'crisis'],
    '대피': ['evacuate', 'escape', 'flee'],
    '안전': ['safety', 'security', 'safe'],
    '위험': ['danger', 'risk', 'hazard'],
    '보호장비': ['protective equipment', 'safety gear', 'PPE'],
    '응급처치': ['first aid', 'emergency treatment', 'medical aid']
  },
  'en': {
    'emergency': ['긴급상황', 'tình huống khẩn cấp', 'สถานการณ์ฉุกเฉิน'],
    'evacuate': ['대피', 'sơ tán', 'อพยพ'],
    'safety': ['안전', 'an toàn', 'ความปลอดภัย'],
    'danger': ['위험', 'nguy hiểm', 'อันตราย'],
    'protective equipment': ['보호장비', 'thiết bị bảo hộ', 'อุปกรณ์ป้องกัน'],
    'first aid': ['응급처치', 'sơ cứu', 'การปฐมพยาบาล']
  }
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const {
      text,
      targetLanguages,
      sourceLanguage = 'auto',
      context = 'general',
      priority = 3,
      enableTTS = false,
      userId
    }: TranslationRequest = await req.json();

    if (!text || !targetLanguages || targetLanguages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Text and target languages are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. 캐시에서 기존 번역 확인
    const cachedTranslations = await checkTranslationCache(supabase, text, targetLanguages);
    
    // 2. 캐시되지 않은 언어들에 대해 번역 수행
    const uncachedLanguages = targetLanguages.filter(lang => !cachedTranslations[lang]);
    let newTranslations: Record<string, any> = {};
    
    if (uncachedLanguages.length > 0) {
      newTranslations = await performTranslations(text, uncachedLanguages, sourceLanguage, context);
      
      // 3. 새 번역 결과를 캐시에 저장
      await saveTranslationsToCache(supabase, text, newTranslations, context);
    }

    // 4. 모든 번역 결과 병합
    const allTranslations = { ...cachedTranslations, ...newTranslations };

    // 5. TTS 생성 (요청된 경우)
    if (enableTTS) {
      for (const [lang, translation] of Object.entries(allTranslations)) {
        if (SUPPORTED_LANGUAGES[lang]?.ttsSupported) {
          try {
            const audioUrl = await generateTTS(translation.text, lang);
            allTranslations[lang].audioUrl = audioUrl;
          } catch (ttsError) {
            console.error(`TTS generation failed for ${lang}:`, ttsError);
          }
        }
      }
    }

    // 6. 번역 품질 검증
    const qualityScores = await validateTranslationQuality(text, allTranslations, context);

    // 7. 사용 통계 업데이트
    if (userId) {
      await updateTranslationStats(supabase, userId, targetLanguages.length, context);
    }

    const result: TranslationResult = {
      originalText: text,
      sourceLanguage: sourceLanguage === 'auto' ? await detectLanguage(text) : sourceLanguage,
      translations: allTranslations,
      context,
      timestamp: new Date().toISOString()
    };

    return new Response(
      JSON.stringify({
        success: true,
        result,
        qualityScores,
        supportedLanguages: SUPPORTED_LANGUAGES,
        message: '다국어 번역이 완료되었습니다.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Translation error:', error);
    return new Response(
      JSON.stringify({ error: '번역 처리 실패', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function checkTranslationCache(supabase: any, text: string, targetLanguages: string[]): Promise<Record<string, any>> {
  try {
    const { data: cached } = await supabase
      .from('translation_cache_2025_10_13_08_09')
      .select('*')
      .eq('original_text', text)
      .in('target_language', targetLanguages);

    const cachedTranslations: Record<string, any> = {};
    
    if (cached) {
      cached.forEach((item: any) => {
        cachedTranslations[item.target_language] = {
          text: item.translated_text,
          confidence: item.confidence_score || 0.9,
          cached: true
        };
      });
    }

    return cachedTranslations;
  } catch (error) {
    console.error('Cache check error:', error);
    return {};
  }
}

async function performTranslations(
  text: string, 
  targetLanguages: string[], 
  sourceLanguage: string, 
  context: string
): Promise<Record<string, any>> {
  const translations: Record<string, any> = {};

  // 실제 구현에서는 Google Translate API, DeepL API 등을 사용
  // 여기서는 시뮬레이션된 번역 제공
  for (const lang of targetLanguages) {
    try {
      const translatedText = await simulateTranslation(text, lang, context);
      const confidence = calculateTranslationConfidence(text, translatedText, context);
      
      translations[lang] = {
        text: translatedText,
        confidence,
        cached: false
      };
    } catch (error) {
      console.error(`Translation failed for ${lang}:`, error);
      translations[lang] = {
        text: `[번역 실패: ${text}]`,
        confidence: 0,
        error: error.message
      };
    }
  }

  return translations;
}

async function simulateTranslation(text: string, targetLang: string, context: string): Promise<string> {
  // 실제 구현에서는 외부 번역 API 호출
  // 여기서는 안전 관련 용어에 대한 시뮬레이션 번역 제공
  
  const safetyTranslations: Record<string, Record<string, string>> = {
    'vi': {
      '긴급상황': 'Tình huống khẩn cấp',
      '대피하세요': 'Hãy sơ tán',
      '안전한 곳으로': 'Đến nơi an toàn',
      '위험합니다': 'Nguy hiểm',
      '보호장비를 착용하세요': 'Hãy đeo thiết bị bảo hộ',
      '응급처치가 필요합니다': 'Cần sơ cứu',
      '작업을 중단하세요': 'Hãy dừng công việc',
      '관리자에게 연락하세요': 'Hãy liên hệ với quản lý'
    },
    'th': {
      '긴급상황': 'สถานการณ์ฉุกเฉิน',
      '대피하세요': 'กรุณาอพยพ',
      '안전한 곳으로': 'ไปยังที่ปลอดภัย',
      '위험합니다': 'อันตราย',
      '보호장비를 착용하세요': 'กรุณาสวมอุปกรณ์ป้องกัน',
      '응급처치가 필요합니다': 'ต้องการการปฐมพยาบาล',
      '작업을 중단하세요': 'กรุณาหยุดการทำงาน',
      '관리자에게 연락하세요': 'กรุณาติดต่อผู้จัดการ'
    },
    'en': {
      '긴급상황': 'Emergency situation',
      '대피하세요': 'Please evacuate',
      '안전한 곳으로': 'To a safe place',
      '위험합니다': 'Dangerous',
      '보호장비를 착용하세요': 'Please wear protective equipment',
      '응급처치가 필요합니다': 'First aid needed',
      '작업을 중단하세요': 'Please stop work',
      '관리자에게 연락하세요': 'Please contact manager'
    },
    'id': {
      '긴급상황': 'Situasi darurat',
      '대피하세요': 'Silakan mengungsi',
      '안전한 곳으로': 'Ke tempat yang aman',
      '위험합니다': 'Berbahaya',
      '보호장비를 착용하세요': 'Silakan kenakan alat pelindung',
      '응급처치가 필요합니다': 'Perlu pertolongan pertama',
      '작업을 중단하세요': 'Silakan hentikan pekerjaan',
      '관리자에게 연락하세요': 'Silakan hubungi manajer'
    }
  };

  // 정확한 번역이 있는 경우 사용
  if (safetyTranslations[targetLang] && safetyTranslations[targetLang][text]) {
    return safetyTranslations[targetLang][text];
  }

  // 기본 시뮬레이션 번역
  return `[${targetLang.toUpperCase()}] ${text}`;
}

async function saveTranslationsToCache(supabase: any, originalText: string, translations: Record<string, any>, context: string): Promise<void> {
  try {
    const cacheEntries = Object.entries(translations).map(([lang, translation]) => ({
      original_text: originalText,
      target_language: lang,
      translated_text: translation.text,
      confidence_score: translation.confidence,
      context_type: context,
      created_at: new Date().toISOString()
    }));

    await supabase
      .from('translation_cache_2025_10_13_08_09')
      .insert(cacheEntries);
  } catch (error) {
    console.error('Cache save error:', error);
  }
}

async function generateTTS(text: string, language: string): Promise<string> {
  // 실제 구현에서는 Google Cloud TTS, Azure TTS 등을 사용
  // 여기서는 시뮬레이션된 오디오 URL 반환
  const audioId = `tts_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  return `https://safebridge-tts.example.com/audio/${audioId}.mp3`;
}

async function validateTranslationQuality(originalText: string, translations: Record<string, any>, context: string): Promise<Record<string, number>> {
  const qualityScores: Record<string, number> = {};

  for (const [lang, translation] of Object.entries(translations)) {
    // 번역 품질 검증 로직
    let score = translation.confidence || 0.8;

    // 안전 관련 컨텍스트에서 중요 용어 확인
    if (context === 'safety' || context === 'emergency') {
      if (containsSafetyTerms(originalText) && containsSafetyTerms(translation.text)) {
        score += 0.1;
      }
    }

    // 텍스트 길이 비교 (너무 짧거나 긴 번역은 품질이 낮을 수 있음)
    const lengthRatio = translation.text.length / originalText.length;
    if (lengthRatio < 0.3 || lengthRatio > 3.0) {
      score -= 0.2;
    }

    qualityScores[lang] = Math.max(0, Math.min(1, score));
  }

  return qualityScores;
}

async function updateTranslationStats(supabase: any, userId: string, translationCount: number, context: string): Promise<void> {
  try {
    await supabase.rpc('update_translation_stats', {
      user_id: userId,
      translation_count: translationCount,
      context_type: context
    });
  } catch (error) {
    console.error('Stats update error:', error);
  }
}

async function detectLanguage(text: string): Promise<string> {
  // 간단한 언어 감지 로직
  if (/[가-힣]/.test(text)) return 'ko';
  if (/[ก-๙]/.test(text)) return 'th';
  if (/[ა-ჰ]/.test(text)) return 'vi';
  if (/[а-я]/.test(text)) return 'ru';
  if (/[一-龯]/.test(text)) return 'zh';
  if (/[ひらがなカタカナ]/.test(text)) return 'ja';
  
  return 'en'; // 기본값
}

function calculateTranslationConfidence(originalText: string, translatedText: string, context: string): number {
  let confidence = 0.8; // 기본 신뢰도

  // 컨텍스트별 신뢰도 조정
  if (context === 'safety' || context === 'emergency') {
    confidence += 0.1; // 안전 관련 번역은 더 신중하게
  }

  // 텍스트 길이 기반 조정
  if (originalText.length > 100) {
    confidence -= 0.1; // 긴 텍스트는 번역 품질이 떨어질 수 있음
  }

  return Math.max(0.1, Math.min(1.0, confidence));
}

function containsSafetyTerms(text: string): boolean {
  const safetyKeywords = [
    '긴급', '위험', '안전', '대피', '응급', '사고', '경보',
    'emergency', 'danger', 'safety', 'evacuate', 'urgent', 'accident', 'alert',
    'khẩn cấp', 'nguy hiểm', 'an toàn', 'sơ tán',
    'ฉุกเฉิน', 'อันตราย', 'ปลอดภัย', 'อพยพ'
  ];

  return safetyKeywords.some(keyword => 
    text.toLowerCase().includes(keyword.toLowerCase())
  );
}