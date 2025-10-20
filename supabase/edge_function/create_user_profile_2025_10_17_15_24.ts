import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, X-Client-Info, apikey, Content-Type, X-Application-Name',
};

interface ProfileRequest {
  userId: string;
  fullName: string;
  userType: 'worker' | 'employer';
  preferredLanguage?: string;
  industrySector?: string;
  companyName?: string;
  workplaceLocation?: any;
  phoneNumber?: string;
  emergencyContact?: any;
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
      userId,
      fullName,
      userType,
      preferredLanguage = 'ko',
      industrySector = 'agriculture',
      companyName,
      workplaceLocation,
      phoneNumber,
      emergencyContact
    }: ProfileRequest = await req.json();

    if (!userId || !fullName || !userType) {
      return new Response(
        JSON.stringify({ error: 'User ID, full name, and user type are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 기존 프로필 확인
    const { data: existingProfile } = await supabase
      .from('user_profiles_2025_10_13_08_09')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existingProfile) {
      return new Response(
        JSON.stringify({ error: 'Profile already exists for this user' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 새 프로필 생성
    const { data: newProfile, error: profileError } = await supabase
      .from('user_profiles_2025_10_13_08_09')
      .insert({
        user_id: userId,
        user_type: userType,
        full_name: fullName,
        preferred_language: preferredLanguage,
        industry_sector: industrySector,
        company_name: companyName,
        workplace_location: workplaceLocation,
        phone_number: phoneNumber,
        emergency_contact: emergencyContact
      })
      .select()
      .single();

    if (profileError) {
      throw new Error(`Failed to create profile: ${profileError.message}`);
    }

    // 사용자 유형별 초기 설정
    if (userType === 'worker') {
      // 노동자용 초기 건강 분석 생성
      const { error: analysisError } = await supabase
        .from('health_risk_analysis_2025_10_17_15_24')
        .insert({
          user_id: userId,
          analysis_date: new Date().toISOString().split('T')[0],
          overall_risk_level: 1,
          risk_factors: { initial: true },
          health_recommendations: {
            ko: ['건강 데이터를 정기적으로 입력해주세요.', '안전 수칙을 준수해주세요.'],
            en: ['Please input health data regularly.', 'Please follow safety guidelines.'],
            actions: ['health_data_input', 'safety_compliance']
          },
          predicted_issues: [],
          confidence_score: 0.5
        });

      if (analysisError) {
        console.error('Initial health analysis creation error:', analysisError);
      }
    } else if (userType === 'employer') {
      // 고용주용 초기 작업장 환경 데이터 생성
      const { error: workplaceError } = await supabase
        .from('workplace_environment_2025_10_17_15_24')
        .insert({
          workplace_id: `workplace_${userId}_${Date.now()}`,
          employer_id: userId,
          location_data: workplaceLocation || { region: '미설정', address: '미설정' },
          environment_type: industrySector === 'fishery' ? 'fishing_vessel' : 'outdoor_field',
          sensor_data: {
            temperature: 25,
            humidity: 60,
            air_quality: 'good',
            last_updated: new Date().toISOString()
          },
          safety_equipment: {
            available: ['safety_helmet', 'work_gloves', 'safety_vest'],
            status: 'good',
            last_inspection: new Date().toISOString().split('T')[0]
          },
          risk_assessment: {
            overall_risk: 2,
            factors: ['weather_dependent', 'physical_labor'],
            last_assessment: new Date().toISOString().split('T')[0]
          },
          last_inspection_date: new Date().toISOString().split('T')[0]
        });

      if (workplaceError) {
        console.error('Initial workplace environment creation error:', workplaceError);
      }

      // 초기 리포트 생성
      try {
        const reportResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/generate_employer_report_2025_10_17_15_24`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            employerId: userId,
            reportType: 'weekly_safety'
          })
        });

        if (!reportResponse.ok) {
          console.error('Initial report generation failed:', await reportResponse.text());
        }
      } catch (reportError) {
        console.error('Initial report generation error:', reportError);
      }
    }

    // 환영 알림 생성
    const welcomeMessage = userType === 'worker' 
      ? '안전한 작업 환경을 위해 SafeBridge가 함께합니다. 건강 데이터를 입력하고 안전 알림을 확인하세요.'
      : 'SafeBridge 고용주 대시보드에 오신 것을 환영합니다. 근로자들의 안전과 건강을 효과적으로 관리하세요.';

    // 사용자 알림 생성 (환영 메시지)
    const { error: notificationError } = await supabase
      .from('user_notifications_2025_10_13_08_09')
      .insert({
        user_id: userId,
        alert_id: null, // 시스템 알림이므로 alert_id는 null
        is_read: false
      });

    if (notificationError) {
      console.error('Welcome notification creation error:', notificationError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        profile: newProfile,
        message: 'Profile created successfully',
        welcomeMessage
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Profile creation error:', error);
    return new Response(
      JSON.stringify({ error: 'Profile creation failed', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});