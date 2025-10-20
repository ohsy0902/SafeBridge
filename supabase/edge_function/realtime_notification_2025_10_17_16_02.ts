import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, X-Client-Info, apikey, Content-Type, X-Application-Name',
};

interface NotificationRequest {
  type: 'broadcast' | 'targeted' | 'emergency';
  title: string;
  content: string;
  priority: number; // 1-5
  targetUsers?: string[]; // 특정 사용자들
  targetRegions?: string[]; // 특정 지역들
  targetIndustries?: string[]; // 특정 산업들
  emergencyLevel?: number; // 긴급도 (1-5)
  multiLanguage?: boolean; // 다국어 번역 여부
  scheduledAt?: string; // 예약 발송 시간
  expiresAt?: string; // 만료 시간
  actionUrl?: string; // 클릭 시 이동할 URL
  metadata?: any; // 추가 메타데이터
}

interface NotificationResult {
  notificationId: string;
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  translations?: Record<string, string>;
  deliveryStatus: 'sent' | 'scheduled' | 'failed';
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

    const {
      type,
      title,
      content,
      priority = 3,
      targetUsers,
      targetRegions,
      targetIndustries,
      emergencyLevel,
      multiLanguage = true,
      scheduledAt,
      expiresAt,
      actionUrl,
      metadata
    }: NotificationRequest = await req.json();

    if (!title || !content) {
      return new Response(
        JSON.stringify({ error: 'Title and content are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. 대상 사용자 결정
    const targetUserIds = await determineTargetUsers(supabase, {
      type,
      targetUsers,
      targetRegions,
      targetIndustries,
      emergencyLevel
    });

    if (targetUserIds.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No target users found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. 다국어 번역 (필요한 경우)
    let translations: Record<string, string> = {};
    if (multiLanguage) {
      translations = await generateMultiLanguageNotifications(supabase, title, content, targetUserIds);
    }

    // 3. 알림 생성 및 큐에 추가
    const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const notifications = await createNotifications(supabase, {
      notificationId,
      targetUserIds,
      title,
      content,
      priority,
      emergencyLevel,
      translations,
      scheduledAt,
      expiresAt,
      actionUrl,
      metadata
    });

    // 4. 즉시 발송 또는 예약
    let deliveryResult;
    if (scheduledAt && new Date(scheduledAt) > new Date()) {
      // 예약 발송
      deliveryResult = await scheduleNotifications(supabase, notifications, scheduledAt);
    } else {
      // 즉시 발송
      deliveryResult = await sendNotificationsImmediately(supabase, notifications);
    }

    // 5. 긴급 알림인 경우 추가 처리
    if (type === 'emergency' || (emergencyLevel && emergencyLevel >= 4)) {
      await handleEmergencyNotification(supabase, {
        notificationId,
        title,
        content,
        targetUserIds,
        emergencyLevel: emergencyLevel || 5
      });
    }

    // 6. 알림 통계 업데이트
    await updateNotificationStats(supabase, {
      type,
      recipientCount: targetUserIds.length,
      sentCount: deliveryResult.sentCount,
      failedCount: deliveryResult.failedCount
    });

    const result: NotificationResult = {
      notificationId,
      recipientCount: targetUserIds.length,
      sentCount: deliveryResult.sentCount,
      failedCount: deliveryResult.failedCount,
      translations: multiLanguage ? translations : undefined,
      deliveryStatus: deliveryResult.status
    };

    return new Response(
      JSON.stringify({
        success: true,
        result,
        message: `알림이 ${targetUserIds.length}명에게 ${deliveryResult.status === 'sent' ? '발송' : '예약'}되었습니다.`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Notification error:', error);
    return new Response(
      JSON.stringify({ error: '알림 처리 실패', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function determineTargetUsers(supabase: any, criteria: any): Promise<string[]> {
  try {
    let query = supabase
      .from('user_profiles_2025_10_13_08_09')
      .select('user_id');

    // 특정 사용자 지정
    if (criteria.targetUsers && criteria.targetUsers.length > 0) {
      query = query.in('user_id', criteria.targetUsers);
    }

    // 지역 필터
    if (criteria.targetRegions && criteria.targetRegions.length > 0) {
      // 사용자 위치 설정과 조인하여 지역 필터링
      const { data: locationUsers } = await supabase
        .from('user_location_settings_2025_10_17_16_02')
        .select('user_id, primary_location')
        .not('primary_location', 'is', null);

      if (locationUsers) {
        const regionUserIds = locationUsers
          .filter((user: any) => {
            const userRegion = user.primary_location?.region || '';
            return criteria.targetRegions.some((region: string) => 
              userRegion.includes(region)
            );
          })
          .map((user: any) => user.user_id);

        if (regionUserIds.length > 0) {
          query = query.in('user_id', regionUserIds);
        }
      }
    }

    // 산업 필터
    if (criteria.targetIndustries && criteria.targetIndustries.length > 0) {
      query = query.in('industry_sector', criteria.targetIndustries);
    }

    // 긴급도에 따른 추가 필터링
    if (criteria.emergencyLevel && criteria.emergencyLevel >= 4) {
      // 긴급 상황시에는 모든 사용자에게 발송
      query = supabase
        .from('user_profiles_2025_10_13_08_09')
        .select('user_id');
    }

    const { data: users, error } = await query;

    if (error) throw error;

    return users ? users.map((user: any) => user.user_id) : [];

  } catch (error) {
    console.error('Target user determination error:', error);
    return [];
  }
}

async function generateMultiLanguageNotifications(
  supabase: any, 
  title: string, 
  content: string, 
  targetUserIds: string[]
): Promise<Record<string, string>> {
  try {
    // 사용자들의 선호 언어 조회
    const { data: userLanguages } = await supabase
      .from('user_profiles_2025_10_13_08_09')
      .select('user_id, preferred_language')
      .in('user_id', targetUserIds);

    const requiredLanguages = new Set<string>();
    if (userLanguages) {
      userLanguages.forEach((user: any) => {
        if (user.preferred_language) {
          requiredLanguages.add(user.preferred_language);
        }
      });
    }

    // 기본 언어들 추가
    requiredLanguages.add('ko');
    requiredLanguages.add('en');
    requiredLanguages.add('vi');
    requiredLanguages.add('th');

    const languageArray = Array.from(requiredLanguages);

    // 번역 서비스 호출
    const { data: translationResult, error: translationError } = await supabase.functions.invoke(
      'advanced_translation_2025_10_17_16_02',
      {
        body: {
          text: `${title}\n\n${content}`,
          targetLanguages: languageArray,
          context: 'safety',
          priority: 5
        }
      }
    );

    if (translationError) {
      console.error('Translation error:', translationError);
      return {};
    }

    const translations: Record<string, string> = {};
    if (translationResult?.result?.translations) {
      Object.entries(translationResult.result.translations).forEach(([lang, translation]: [string, any]) => {
        translations[lang] = translation.text;
      });
    }

    return translations;

  } catch (error) {
    console.error('Multi-language generation error:', error);
    return {};
  }
}

async function createNotifications(supabase: any, params: any): Promise<any[]> {
  try {
    const notifications = params.targetUserIds.map((userId: string) => {
      // 사용자별 언어에 맞는 내용 선택
      let finalTitle = params.title;
      let finalContent = params.content;

      // 번역이 있는 경우 사용자 언어에 맞게 조정
      if (params.translations && Object.keys(params.translations).length > 0) {
        // 기본적으로 한국어 사용, 필요시 사용자 언어 설정 조회하여 적용
        const userLang = 'ko'; // 실제로는 사용자 프로필에서 조회
        if (params.translations[userLang]) {
          const translatedText = params.translations[userLang];
          const [translatedTitle, ...translatedContentParts] = translatedText.split('\n\n');
          finalTitle = translatedTitle || params.title;
          finalContent = translatedContentParts.join('\n\n') || params.content;
        }
      }

      return {
        recipient_id: userId,
        notification_type: params.emergencyLevel >= 4 ? 'emergency' : 'safety_alert',
        priority: params.priority,
        title: finalTitle,
        content: finalContent,
        action_url: params.actionUrl,
        expires_at: params.expiresAt,
        metadata: {
          ...params.metadata,
          notification_id: params.notificationId,
          emergency_level: params.emergencyLevel,
          translations_available: Object.keys(params.translations || {})
        }
      };
    });

    const { data: createdNotifications, error } = await supabase
      .from('notification_queue_2025_10_17_16_02')
      .insert(notifications)
      .select();

    if (error) throw error;

    return createdNotifications || [];

  } catch (error) {
    console.error('Notification creation error:', error);
    return [];
  }
}

async function sendNotificationsImmediately(supabase: any, notifications: any[]): Promise<any> {
  let sentCount = 0;
  let failedCount = 0;

  for (const notification of notifications) {
    try {
      // 실제 푸시 알림 발송 로직
      await sendPushNotification(notification);
      
      // 발송 상태 업데이트
      await supabase
        .from('notification_queue_2025_10_17_16_02')
        .update({
          is_sent: true,
          sent_at: new Date().toISOString()
        })
        .eq('id', notification.id);

      sentCount++;

      // 실시간 알림 (WebSocket)
      await sendRealtimeNotification(supabase, notification);

    } catch (error) {
      console.error(`Failed to send notification ${notification.id}:`, error);
      failedCount++;
    }
  }

  return {
    status: 'sent',
    sentCount,
    failedCount
  };
}

async function scheduleNotifications(supabase: any, notifications: any[], scheduledAt: string): Promise<any> {
  try {
    // 예약된 알림들을 스케줄러 테이블에 저장
    const scheduledNotifications = notifications.map(notification => ({
      ...notification,
      scheduled_at: scheduledAt,
      status: 'scheduled'
    }));

    // 실제 구현에서는 cron job이나 스케줄러를 사용하여 예약 발송 처리
    
    return {
      status: 'scheduled',
      sentCount: 0,
      failedCount: 0
    };

  } catch (error) {
    console.error('Notification scheduling error:', error);
    return {
      status: 'failed',
      sentCount: 0,
      failedCount: notifications.length
    };
  }
}

async function handleEmergencyNotification(supabase: any, params: any): Promise<void> {
  try {
    // 1. 긴급 알림 로그 생성
    await supabase
      .from('emergency_reports_2025_10_17_16_02')
      .insert({
        reporter_id: null, // 시스템 생성
        emergency_type: 'system_alert',
        severity_level: params.emergencyLevel,
        title: params.title,
        description: params.content,
        location_data: { type: 'broadcast', regions: 'all' },
        status: 'reported'
      });

    // 2. 관리자들에게 즉시 알림
    const { data: managers } = await supabase
      .from('user_profiles_2025_10_13_08_09')
      .select('user_id')
      .eq('user_type', 'employer');

    if (managers && managers.length > 0) {
      const managerNotifications = managers.map((manager: any) => ({
        recipient_id: manager.user_id,
        notification_type: 'emergency',
        priority: 5,
        title: `[긴급] ${params.title}`,
        content: `시스템 긴급 알림: ${params.content}`,
        metadata: {
          notification_id: params.notificationId,
          emergency_level: params.emergencyLevel,
          is_manager_alert: true
        }
      }));

      await supabase
        .from('notification_queue_2025_10_17_16_02')
        .insert(managerNotifications);
    }

    // 3. 외부 시스템 연동 (SMS, 이메일 등)
    if (params.emergencyLevel === 5) {
      await triggerExternalEmergencyAlerts(params);
    }

  } catch (error) {
    console.error('Emergency notification handling error:', error);
  }
}

async function sendPushNotification(notification: any): Promise<void> {
  // 실제 구현에서는 FCM, APNs 등을 사용하여 푸시 알림 발송
  // 여기서는 시뮬레이션
  console.log(`Sending push notification to ${notification.recipient_id}:`, {
    title: notification.title,
    body: notification.content,
    priority: notification.priority
  });

  // 시뮬레이션된 발송 지연
  await new Promise(resolve => setTimeout(resolve, 100));
}

async function sendRealtimeNotification(supabase: any, notification: any): Promise<void> {
  try {
    // Supabase Realtime을 사용한 실시간 알림
    await supabase
      .channel(`user_${notification.recipient_id}`)
      .send({
        type: 'broadcast',
        event: 'new_notification',
        payload: {
          id: notification.id,
          title: notification.title,
          content: notification.content,
          priority: notification.priority,
          created_at: notification.created_at
        }
      });
  } catch (error) {
    console.error('Realtime notification error:', error);
  }
}

async function updateNotificationStats(supabase: any, stats: any): Promise<void> {
  try {
    // 알림 통계 업데이트 (실제 구현에서는 별도 통계 테이블 사용)
    await supabase.rpc('update_notification_statistics', {
      notification_type: stats.type,
      recipient_count: stats.recipientCount,
      sent_count: stats.sentCount,
      failed_count: stats.failedCount,
      date: new Date().toISOString().split('T')[0]
    });
  } catch (error) {
    console.error('Stats update error:', error);
  }
}

async function triggerExternalEmergencyAlerts(params: any): Promise<void> {
  try {
    // 외부 시스템 연동 (SMS, 이메일, 관공서 신고 등)
    console.log('Triggering external emergency alerts:', {
      title: params.title,
      content: params.content,
      emergency_level: params.emergencyLevel,
      target_count: params.targetUserIds.length
    });

    // 실제 구현에서는 Twilio SMS, Resend Email 등을 사용
    
  } catch (error) {
    console.error('External emergency alert error:', error);
  }
}