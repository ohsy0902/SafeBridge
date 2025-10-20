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

    const { userId } = await req.json();
    
    // 현재 시간 기반으로 적절한 알림 생성
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    
    let alerts = [];
    
    // 시간대별 알림 로직
    if (hour >= 6 && hour < 9) {
      // 아침 시간대 (06:00-09:00)
      alerts = [
        {
          type: 'weather_warning',
          severity: 3,
          title: '오늘의 날씨 정보',
          message: `오늘 최고기온 ${25 + Math.floor(Math.random() * 15)}도 예상, 작업 시 주의하세요.`,
          time: `${hour}:${minute.toString().padStart(2, '0')}`
        },
        {
          type: 'safety_reminder',
          severity: 2,
          title: '작업 시작 전 점검',
          message: '안전장비 착용 및 장비 점검을 완료해주세요.',
          time: `${hour}:${minute.toString().padStart(2, '0')}`
        }
      ];
    } else if (hour >= 12 && hour < 14) {
      // 점심 시간대 (12:00-14:00)
      const temp = 28 + Math.floor(Math.random() * 10);
      alerts = [
        {
          type: 'heat_warning',
          severity: temp > 33 ? 4 : 3,
          title: '기온 주의보',
          message: `현재 기온 ${temp}도, ${temp > 33 ? '야외작업 중단 권고' : '충분한 수분 섭취 필요'}`,
          time: `${hour}:${minute.toString().padStart(2, '0')}`
        },
        {
          type: 'hydration_reminder',
          severity: 2,
          title: '수분 섭취 시간',
          message: '점심시간입니다. 충분한 물을 마시고 휴식을 취하세요.',
          time: `${hour}:${minute.toString().padStart(2, '0')}`
        }
      ];
    } else if (hour >= 15 && hour < 18) {
      // 오후 시간대 (15:00-18:00)
      alerts = [
        {
          type: 'equipment_check',
          severity: 3,
          title: '오후 작업 준비',
          message: '오후 작업 전 장비 재점검이 필요합니다.',
          time: `${hour}:${minute.toString().padStart(2, '0')}`
        },
        {
          type: 'weather_update',
          severity: 2,
          title: '날씨 업데이트',
          message: Math.random() > 0.5 ? '오후 소나기 예보, 실내 대피 준비' : '맑은 날씨 지속, 자외선 차단 필요',
          time: `${hour}:${minute.toString().padStart(2, '0')}`
        }
      ];
    } else if (hour >= 18 && hour < 21) {
      // 저녁 시간대 (18:00-21:00)
      alerts = [
        {
          type: 'work_completion',
          severity: 1,
          title: '작업 마무리',
          message: '오늘 작업을 완료하고 장비를 정리해주세요.',
          time: `${hour}:${minute.toString().padStart(2, '0')}`
        },
        {
          type: 'safety_summary',
          severity: 2,
          title: '오늘의 안전 현황',
          message: `오늘 안전사고 ${Math.floor(Math.random() * 2)}건, ${Math.random() > 0.7 ? '우수한' : '양호한'} 안전 관리`,
          time: `${hour}:${minute.toString().padStart(2, '0')}`
        }
      ];
    } else {
      // 야간/새벽 시간대
      alerts = [
        {
          type: 'night_safety',
          severity: 2,
          title: '야간 안전 수칙',
          message: '야간 작업 시 조명 확인 및 안전 수칙을 준수해주세요.',
          time: `${hour}:${minute.toString().padStart(2, '0')}`
        }
      ];
    }

    // 사용자 언어 설정 조회
    const { data: userProfile } = await supabaseClient
      .from('user_profiles_2025_10_13_08_09')
      .select('preferred_language')
      .eq('user_id', userId)
      .single();

    const userLanguage = userProfile?.preferred_language || 'ko';

    // 번역이 필요한 경우 번역 수행
    if (userLanguage !== 'ko') {
      for (let alert of alerts) {
        // 번역 캐시 확인
        const { data: cachedTranslation } = await supabaseClient
          .from('translation_cache_2025_10_13_08_09')
          .select('translated_text')
          .eq('source_text', alert.message)
          .eq('target_language', userLanguage)
          .single();

        if (cachedTranslation) {
          alert.message = cachedTranslation.translated_text;
        } else {
          // 간단한 번역 매핑 (실제로는 번역 API 호출)
          const translations = {
            'vi': {
              '오늘의 날씨 정보': 'Thông tin thời tiết hôm nay',
              '작업 시작 전 점검': 'Kiểm tra trước khi bắt đầu làm việc',
              '기온 주의보': 'Cảnh báo nhiệt độ',
              '수분 섭취 시간': 'Thời gian uống nước',
              '오후 작업 준비': 'Chuẩn bị làm việc buổi chiều',
              '날씨 업데이트': 'Cập nhật thời tiết',
              '작업 마무리': 'Hoàn thành công việc',
              '오늘의 안전 현황': 'Tình hình an toàn hôm nay',
              '야간 안전 수칙': 'Quy tắc an toàn ban đêm'
            },
            'th': {
              '오늘의 날씨 정보': 'ข้อมูลสภาพอากาศวันนี้',
              '작업 시작 전 점검': 'ตรวจสอบก่อนเริ่มงาน',
              '기온 주의보': 'คำเตือนอุณหภูมิ',
              '수분 섭취 시간': 'เวลาดื่มน้ำ',
              '오후 작업 준비': 'เตรียมงานช่วงบ่าย',
              '날씨 업데이트': 'อัปเดตสภาพอากาศ',
              '작업 마무리': 'เสร็จสิ้นงาน',
              '오늘의 안전 현황': 'สถานการณ์ความปลอดภัยวันนี้',
              '야간 안전 수칙': 'กฎความปลอดภัยกลางคืน'
            },
            'fil': {
              '오늘의 날씨 정보': 'Impormasyon sa panahon ngayon',
              '작업 시작 전 점검': 'Pagsusuri bago magsimula',
              '기온 주의보': 'Babala sa temperatura',
              '수분 섭취 시간': 'Oras ng pag-inom ng tubig',
              '오후 작업 준비': 'Paghahanda sa hapon',
              '날씨 업데이트': 'Update sa panahon',
              '작업 마무리': 'Pagtatapos ng trabaho',
              '오늘의 안전 현황': 'Kalagayan ng kaligtasan ngayon',
              '야간 안전 수칙': 'Mga patakaran sa gabi'
            },
            'id': {
              '오늘의 날씨 정보': 'Informasi cuaca hari ini',
              '작업 시작 전 점검': 'Pemeriksaan sebelum mulai kerja',
              '기온 주의보': 'Peringatan suhu',
              '수분 섭취 시간': 'Waktu minum air',
              '오후 작업 준비': 'Persiapan kerja sore',
              '날씨 업데이트': 'Update cuaca',
              '작업 마무리': 'Penyelesaian kerja',
              '오늘의 안전 현황': 'Status keselamatan hari ini',
              '야간 안전 수칙': 'Aturan keselamatan malam'
            }
          };

          if (translations[userLanguage] && translations[userLanguage][alert.title]) {
            alert.title = translations[userLanguage][alert.title];
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        alerts: alerts,
        currentTime: `${hour}:${minute.toString().padStart(2, '0')}`,
        timeZone: hour >= 6 && hour < 9 ? 'morning' : 
                  hour >= 12 && hour < 14 ? 'lunch' :
                  hour >= 15 && hour < 18 ? 'afternoon' :
                  hour >= 18 && hour < 21 ? 'evening' : 'night'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Time-based alerts error:', error);
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