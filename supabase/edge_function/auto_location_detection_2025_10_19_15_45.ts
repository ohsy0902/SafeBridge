import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, X-Client-Info, apikey, Content-Type, X-Application-Name',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { userId, latitude, longitude } = await req.json();
    
    // 역지오코딩을 통한 주소 변환 (시뮬레이션)
    const address = await reverseGeocode(latitude, longitude);
    
    // 사용자의 기존 위치 설정 조회
    const { data: existingLocation } = await supabaseClient
      .from('user_location_settings_2025_10_17_16_02')
      .select('*')
      .eq('user_id', userId)
      .single();

    const locationData = {
      address: address,
      coordinates: { lat: latitude, lng: longitude },
      workplace: determineWorkplace(latitude, longitude),
      timestamp: new Date().toISOString()
    };

    if (existingLocation) {
      // 기존 위치 설정 업데이트
      const { error: updateError } = await supabaseClient
        .from('user_location_settings_2025_10_17_16_02')
        .update({
          primary_location: locationData,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (updateError) throw updateError;
    } else {
      // 새로운 위치 설정 생성
      const { error: insertError } = await supabaseClient
        .from('user_location_settings_2025_10_17_16_02')
        .insert({
          user_id: userId,
          primary_location: locationData,
          notification_radius: 5000,
          auto_location_update: true,
          location_sharing_enabled: true,
          emergency_contacts: [
            {
              name: "관리자",
              phone: "010-1234-5678",
              relation: "supervisor"
            }
          ]
        });

      if (insertError) throw insertError;
    }

    // 주변 위험 요소 확인
    const nearbyRisks = await checkNearbyRisks(latitude, longitude);
    
    // 위치 기반 안전 알림 생성
    const locationAlerts = await generateLocationAlerts(latitude, longitude, userId);

    return new Response(
      JSON.stringify({
        success: true,
        location: locationData,
        nearbyRisks: nearbyRisks,
        alerts: locationAlerts,
        message: "위치가 자동으로 업데이트되었습니다."
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Auto location detection error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

// 역지오코딩 시뮬레이션 함수
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  // 실제로는 Google Maps API나 다른 지오코딩 서비스를 사용
  // 여기서는 시뮬레이션된 주소 반환
  const addresses = [
    "경기도 화성시 농장로 123",
    "충청남도 서산시 어장길 456", 
    "전라남도 해남군 농업단지 789",
    "강원도 춘천시 농촌로 321",
    "경상북도 안동시 농장단지 654"
  ];
  
  // 좌표 기반으로 적절한 주소 선택
  const index = Math.floor((lat + lng) * 100) % addresses.length;
  return addresses[index];
}

// 작업장 결정 함수
function determineWorkplace(lat: number, lng: number): string {
  // 좌표 기반으로 작업장 결정
  if (lat > 37.0 && lng > 126.5) {
    return "농장A";
  } else if (lat > 36.0 && lng > 126.0) {
    return "농장B";
  } else if (lat > 35.0) {
    return "농장C";
  } else {
    return "어장A";
  }
}

// 주변 위험 요소 확인 함수
async function checkNearbyRisks(lat: number, lng: number) {
  // 시뮬레이션된 주변 위험 요소
  const risks = [
    {
      type: "weather",
      level: Math.floor(Math.random() * 5) + 1,
      description: "기상 위험",
      distance: Math.floor(Math.random() * 5000) + 500
    },
    {
      type: "equipment",
      level: Math.floor(Math.random() * 3) + 1,
      description: "장비 점검 필요",
      distance: Math.floor(Math.random() * 1000) + 100
    }
  ];

  return risks.filter(risk => risk.level > 2); // 위험도 3 이상만 반환
}

// 위치 기반 안전 알림 생성 함수
async function generateLocationAlerts(lat: number, lng: number, userId: string) {
  const alerts = [];
  
  // 작업장별 맞춤 알림
  const workplace = determineWorkplace(lat, lng);
  
  if (workplace.includes("농장")) {
    alerts.push({
      type: "agriculture_safety",
      title: "농업 안전 수칙",
      message: `${workplace}에서 작업 시 농기계 안전 수칙을 준수해주세요.`,
      priority: "medium"
    });
  } else if (workplace.includes("어장")) {
    alerts.push({
      type: "fishery_safety", 
      title: "어업 안전 수칙",
      message: `${workplace}에서 작업 시 구명조끼 착용을 필수로 해주세요.`,
      priority: "high"
    });
  }

  // 시간대별 추가 알림
  const hour = new Date().getHours();
  if (hour >= 12 && hour <= 14) {
    alerts.push({
      type: "heat_warning",
      title: "폭염 주의",
      message: "점심시간 야외 작업 시 충분한 휴식과 수분 섭취가 필요합니다.",
      priority: "high"
    });
  }

  return alerts;
}