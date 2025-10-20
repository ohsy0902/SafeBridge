import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, X-Client-Info, apikey, Content-Type, X-Application-Name',
};

interface TranslateRequest {
  text: string;
  targetLanguage: string;
  sourceLanguage?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { text, targetLanguage, sourceLanguage = 'ko' }: TranslateRequest = await req.json();

    if (!text || !targetLanguage) {
      return new Response(
        JSON.stringify({ error: 'Text and target language are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 번역 캐시에서 먼저 확인
    const { data: cachedTranslation } = await supabase
      .from('translation_cache_2025_10_13_08_09')
      .select('translated_text')
      .eq('source_text', text)
      .eq('source_language', sourceLanguage)
      .eq('target_language', targetLanguage)
      .single();

    if (cachedTranslation) {
      return new Response(
        JSON.stringify({ 
          translatedText: cachedTranslation.translated_text,
          cached: true 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Google Translate API 호출
    const googleApiKey = Deno.env.get('GOOGLE_TRANSLATE_API_KEY');
    if (!googleApiKey) {
      return new Response(
        JSON.stringify({ error: 'Google Translate API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const translateUrl = `https://translation.googleapis.com/language/translate/v2?key=${googleApiKey}`;
    const translateResponse = await fetch(translateUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text,
        source: sourceLanguage,
        target: targetLanguage,
        format: 'text'
      })
    });

    if (!translateResponse.ok) {
      throw new Error(`Translation API error: ${translateResponse.status}`);
    }

    const translateResult = await translateResponse.json();
    const translatedText = translateResult.data.translations[0].translatedText;

    // 번역 결과를 캐시에 저장
    await supabase
      .from('translation_cache_2025_10_13_08_09')
      .insert({
        source_text: text,
        source_language: sourceLanguage,
        target_language: targetLanguage,
        translated_text: translatedText
      });

    return new Response(
      JSON.stringify({ 
        translatedText,
        cached: false 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Translation error:', error);
    return new Response(
      JSON.stringify({ error: 'Translation failed', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});