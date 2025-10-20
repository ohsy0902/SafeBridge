import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, X-Client-Info, apikey, Content-Type, X-Application-Name',
};

interface EmergencyReportRequest {
  emergencyType: string;
  severityLevel: number;
  title: string;
  description: string;
  locationData: any;
  contactInfo?: any;
  attachments?: any[];
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

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // JWT에서 사용자 ID 추출
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const {
      emergencyType,
      severityLevel,
      title,
      description,
      locationData,
      contactInfo,
      attachments
    }: EmergencyReportRequest = await req.json();

    if (!emergencyType || !severityLevel || !title || !description || !locationData) {
      return new Response(
        JSON.stringify({ error: 'Required fields missing' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 긴급 채팅방 생성
    const { data: chatRoom, error: roomError } = await supabase
      .from('chat_rooms_2025_10_17_16_02')
      .insert({
        room_type: 'emergency',
        room_name: `긴급상황: ${title}`,
        created_by: user.id,
        participants: [user.id], // 초기에는 신고자만 참여
        emergency_level: severityLevel,
        location_data: locationData
      })
      .select()
      .single();

    if (roomError) {
      throw new Error(`Failed to create chat room: ${roomError.message}`);
    }

    // 긴급 신고 생성
    const { data: emergencyReport, error: reportError } = await supabase
      .from('emergency_reports_2025_10_17_16_02')
      .insert({
        reporter_id: user.id,
        emergency_type: emergencyType,
        severity_level: severityLevel,
        title,
        description,
        location_data: locationData,
        contact_info: contactInfo,
        attachments: attachments || [],
        chat_room_id: chatRoom.id
      })
      .select()
      .single();

    if (reportError) {
      throw new Error(`Failed to create emergency report: ${reportError.message}`);
    }

    // 시스템 메시지 추가
    const { error: messageError } = await supabase
      .from('chat_messages_2025_10_17_16_02')
      .insert({
        room_id: chatRoom.id,
        sender_id: user.id,
        message_type: 'emergency',
        content: `긴급상황이 신고되었습니다.\n\n유형: ${getEmergencyTypeText(emergencyType)}\n심각도: ${severityLevel}/5\n설명: ${description}`,
        is_emergency: true
      });

    if (messageError) {
      console.error('Failed to create system message:', messageError);
    }

    // 관리자들에게 알림 발송
    await notifyManagers(supabase, emergencyReport, chatRoom);

    // 근처 사용자들에게 알림 (심각도 4 이상인 경우)
    if (severityLevel >= 4) {
      await notifyNearbyUsers(supabase, emergencyReport, locationData);
    }

    return new Response(
      JSON.stringify({
        success: true,
        emergencyReport,
        chatRoom,
        message: '긴급 신고가 접수되었습니다. 관련 담당자가 곧 연락드릴 예정입니다.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Emergency report error:', error);
    return new Response(
      JSON.stringify({ error: 'Emergency report failed', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function getEmergencyTypeText(type: string): string {
  switch (type) {
    case 'accident': return '사고';
    case 'health_emergency': return '건강 응급상황';
    case 'weather_danger': return '기상 위험';
    case 'equipment_failure': return '장비 고장';
    default: return '기타';
  }
}

async function notifyManagers(supabase: any, report: any, chatRoom: any) {
  try {
    // 고용주 타입 사용자들 조회
    const { data: managers } = await supabase
      .from('user_profiles_2025_10_13_08_09')
      .select('user_id, full_name')
      .eq('user_type', 'employer');

    if (!managers || managers.length === 0) return;

    // 관리자들을 채팅방에 추가
    const updatedParticipants = [chatRoom.created_by, ...managers.map((m: any) => m.user_id)];
    
    await supabase
      .from('chat_rooms_2025_10_17_16_02')
      .update({
        participants: updatedParticipants,
        updated_at: new Date().toISOString()
      })
      .eq('id', chatRoom.id);

    // 각 관리자에게 알림 생성
    const notifications = managers.map((manager: any) => ({
      recipient_id: manager.user_id,
      notification_type: 'emergency',
      priority: 5,
      title: `긴급 신고: ${report.title}`,
      content: `심각도 ${report.severity_level}/5의 긴급상황이 신고되었습니다. 즉시 확인이 필요합니다.`,
      action_url: `/chat/${chatRoom.id}`,
      metadata: {
        emergency_report_id: report.id,
        chat_room_id: chatRoom.id,
        severity_level: report.severity_level
      }
    }));

    await supabase
      .from('notification_queue_2025_10_17_16_02')
      .insert(notifications);

  } catch (error) {
    console.error('Failed to notify managers:', error);
  }
}

async function notifyNearbyUsers(supabase: any, report: any, locationData: any) {
  try {
    // 근처 사용자들에게 일반 안전 알림 발송
    const { data: nearbyUsers } = await supabase
      .from('user_location_settings_2025_10_17_16_02')
      .select('user_id, notification_radius')
      .eq('location_sharing_enabled', true);

    if (!nearbyUsers || nearbyUsers.length === 0) return;

    // 간단한 거리 기반 필터링 (실제로는 더 정교한 지리적 계산 필요)
    const notifications = nearbyUsers.map((user: any) => ({
      recipient_id: user.user_id,
      notification_type: 'safety_alert',
      priority: 4,
      title: '근처 긴급상황 발생',
      content: `근처에서 ${getEmergencyTypeText(report.emergency_type)} 관련 긴급상황이 발생했습니다. 주의하시기 바랍니다.`,
      metadata: {
        emergency_type: report.emergency_type,
        severity_level: report.severity_level,
        distance_km: 'unknown' // 실제 거리 계산 필요
      }
    }));

    await supabase
      .from('notification_queue_2025_10_17_16_02')
      .insert(notifications);

  } catch (error) {
    console.error('Failed to notify nearby users:', error);
  }
}