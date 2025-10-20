import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, X-Client-Info, apikey, Content-Type, X-Application-Name',
};

interface NotificationRequest {
  alertId?: string;
  userId?: string;
  targetIndustry?: string;
  targetRegion?: string;
  severityLevel?: number;
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

    const { alertId, userId, targetIndustry, targetRegion, severityLevel }: NotificationRequest = await req.json();

    let query = supabase
      .from('safety_alerts_2025_10_13_08_09')
      .select('*')
      .eq('is_active', true);

    // 필터 조건 적용
    if (alertId) {
      query = query.eq('id', alertId);
    }
    if (targetIndustry) {
      query = query.eq('target_industry', targetIndustry);
    }
    if (targetRegion) {
      query = query.eq('target_region', targetRegion);
    }
    if (severityLevel) {
      query = query.gte('severity_level', severityLevel);
    }

    const { data: alerts, error: alertError } = await query;

    if (alertError) {
      throw new Error(`Failed to fetch alerts: ${alertError.message}`);
    }

    if (!alerts || alerts.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No active alerts found', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 사용자별 알림 발송
    const notifications = [];
    
    for (const alert of alerts) {
      // 대상 사용자 조회
      let userQuery = supabase
        .from('user_profiles_2025_10_13_08_09')
        .select('user_id, preferred_language, industry_sector, workplace_location');

      if (userId) {
        userQuery = userQuery.eq('user_id', userId);
      } else {
        // 산업 분야별 필터링
        if (alert.target_industry !== '전국') {
          userQuery = userQuery.eq('industry_sector', alert.target_industry);
        }
      }

      const { data: users, error: userError } = await userQuery;

      if (userError) {
        console.error('User query error:', userError);
        continue;
      }

      if (!users || users.length === 0) {
        continue;
      }

      // 각 사용자에게 알림 발송
      for (const user of users) {
        try {
          // 번역된 알림 내용 가져오기
          const translatedContent = await getTranslatedContent(
            alert.title_ko,
            alert.content_ko,
            user.preferred_language
          );

          // 알림 기록 저장
          const { error: notificationError } = await supabase
            .from('user_notifications_2025_10_13_08_09')
            .insert({
              user_id: user.user_id,
              alert_id: alert.id,
              is_read: false
            });

          if (notificationError) {
            console.error('Notification insert error:', notificationError);
          }

          notifications.push({
            userId: user.user_id,
            alertId: alert.id,
            title: translatedContent.title,
            content: translatedContent.content,
            severityLevel: alert.severity_level,
            language: user.preferred_language,
            timestamp: new Date().toISOString()
          });

        } catch (error) {
          console.error(`Failed to send notification to user ${user.user_id}:`, error);
        }
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Notifications sent successfully',
        count: notifications.length,
        notifications: notifications.slice(0, 10) // 처음 10개만 반환
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Notification error:', error);
    return new Response(
      JSON.stringify({ error: 'Notification failed', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function getTranslatedContent(titleKo: string, contentKo: string, targetLanguage: string) {
  if (targetLanguage === 'ko') {
    return { title: titleKo, content: contentKo };
  }

  try {
    // 번역 API 호출 (실제 구현에서는 translate_text Edge Function 호출)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 번역 캐시에서 먼저 확인
    const { data: cachedTitle } = await supabase
      .from('translation_cache_2025_10_13_08_09')
      .select('translated_text')
      .eq('source_text', titleKo)
      .eq('target_language', targetLanguage)
      .single();

    const { data: cachedContent } = await supabase
      .from('translation_cache_2025_10_13_08_09')
      .select('translated_text')
      .eq('source_text', contentKo)
      .eq('target_language', targetLanguage)
      .single();

    return {
      title: cachedTitle?.translated_text || titleKo,
      content: cachedContent?.translated_text || contentKo
    };

  } catch (error) {
    console.error('Translation error:', error);
    return { title: titleKo, content: contentKo };
  }
}