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

    const { userId, action } = await req.json();
    
    if (action === 'start_monitoring') {
      // 웨어러블 기기 연결 시뮬레이션
      const deviceInfo = {
        deviceId: `wearable_${userId.slice(-8)}`,
        deviceType: 'smartwatch',
        batteryLevel: 85 + Math.floor(Math.random() * 15),
        connectionStatus: 'connected',
        lastSync: new Date().toISOString()
      };

      return new Response(
        JSON.stringify({
          success: true,
          device: deviceInfo,
          message: "웨어러블 기기가 연결되었습니다. 자동 측정을 시작합니다."
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    if (action === 'auto_measure') {
      // 자동 건강 측정 시뮬레이션
      const healthData = generateRealisticHealthData(userId);
      
      // 건강 데이터 저장
      const { error: healthError } = await supabaseClient
        .from('health_data_2025_10_17_15_24')
        .insert({
          user_id: userId,
          health_metrics: healthData.metrics,
          risk_level: healthData.riskLevel,
          recorded_at: new Date().toISOString()
        });

      if (healthError) throw healthError;

      // 위험도 분석
      const riskAnalysis = analyzeHealthRisk(healthData.metrics);
      
      // 건강 위험 분석 저장
      const { error: analysisError } = await supabaseClient
        .from('health_risk_analysis_2025_10_17_15_24')
        .insert({
          user_id: userId,
          analysis_data: riskAnalysis.analysis,
          risk_score: riskAnalysis.score,
          recommendations: riskAnalysis.recommendations
        });

      if (analysisError) throw analysisError;

      // 알림 생성 (위험도가 높은 경우)
      let alerts = [];
      if (riskAnalysis.score > 3.0) {
        alerts.push({
          type: 'health_alert',
          severity: 'high',
          title: '건강 상태 주의',
          message: '건강 지표에 이상이 감지되었습니다. 즉시 휴식을 취하세요.',
          recommendations: riskAnalysis.recommendations
        });

        // 고용주에게 알림 발송
        await notifyEmployer(supabaseClient, userId, riskAnalysis);
      }

      return new Response(
        JSON.stringify({
          success: true,
          healthData: healthData.metrics,
          riskLevel: healthData.riskLevel,
          riskAnalysis: riskAnalysis,
          alerts: alerts,
          timestamp: new Date().toISOString()
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    if (action === 'get_history') {
      // 건강 데이터 히스토리 조회
      const { data: healthHistory } = await supabaseClient
        .from('health_data_2025_10_17_15_24')
        .select('*')
        .eq('user_id', userId)
        .order('recorded_at', { ascending: false })
        .limit(24); // 최근 24개 데이터

      const { data: analysisHistory } = await supabaseClient
        .from('health_risk_analysis_2025_10_17_15_24')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      return new Response(
        JSON.stringify({
          success: true,
          healthHistory: healthHistory || [],
          analysisHistory: analysisHistory || [],
          summary: generateHealthSummary(healthHistory || [])
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

  } catch (error) {
    console.error('Wearable health simulation error:', error);
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

// 현실적인 건강 데이터 생성 함수
function generateRealisticHealthData(userId: string) {
  const baseTime = new Date().getHours();
  const isWorkingHours = baseTime >= 8 && baseTime <= 18;
  const isHotTime = baseTime >= 12 && baseTime <= 16;
  
  // 사용자별 기본 건강 상태 (시드 기반)
  const userSeed = parseInt(userId.slice(-4), 16) % 100;
  const baseHeartRate = 65 + (userSeed % 20);
  const baseSystolic = 110 + (userSeed % 25);
  const baseDiastolic = 70 + (userSeed % 15);
  
  // 작업 시간과 환경에 따른 변동
  const workStress = isWorkingHours ? Math.random() * 15 : 0;
  const heatStress = isHotTime ? Math.random() * 20 : 0;
  
  const heartRate = Math.round(baseHeartRate + workStress + (heatStress * 0.5));
  const systolic = Math.round(baseSystolic + (workStress * 0.8) + (heatStress * 0.6));
  const diastolic = Math.round(baseDiastolic + (workStress * 0.5) + (heatStress * 0.4));
  const bodyTemp = 36.2 + (heatStress * 0.03) + (Math.random() * 0.6);
  
  const metrics = {
    heart_rate: heartRate,
    blood_pressure: {
      systolic: systolic,
      diastolic: diastolic
    },
    body_temperature: Math.round(bodyTemp * 10) / 10,
    steps: isWorkingHours ? 5000 + Math.floor(Math.random() * 8000) : Math.floor(Math.random() * 3000),
    sleep_hours: 6 + Math.random() * 3,
    stress_level: Math.round(1 + (workStress + heatStress) / 10),
    hydration_level: Math.round(70 + Math.random() * 30),
    oxygen_saturation: Math.round(96 + Math.random() * 4),
    skin_temperature: Math.round((bodyTemp + heatStress * 0.1) * 10) / 10
  };

  // 위험도 계산
  let riskLevel = 1.0;
  if (heartRate > 100) riskLevel += 1.0;
  if (systolic > 140 || diastolic > 90) riskLevel += 1.5;
  if (bodyTemp > 37.5) riskLevel += 2.0;
  if (metrics.stress_level > 3) riskLevel += 0.5;
  if (metrics.hydration_level < 60) riskLevel += 1.0;

  return {
    metrics: metrics,
    riskLevel: Math.min(riskLevel, 5.0)
  };
}

// 건강 위험도 분석 함수
function analyzeHealthRisk(metrics: any) {
  const analysis = {
    cardiovascular_risk: 1.0,
    heat_stress_risk: 1.0,
    fatigue_level: 1.0,
    hydration_status: "good"
  };

  const recommendations = [];

  // 심혈관 위험도
  if (metrics.heart_rate > 100 || metrics.blood_pressure.systolic > 140) {
    analysis.cardiovascular_risk = 3.5;
    recommendations.push("즉시 휴식을 취하세요");
    recommendations.push("의료진 상담을 받으세요");
  } else if (metrics.heart_rate > 85 || metrics.blood_pressure.systolic > 130) {
    analysis.cardiovascular_risk = 2.5;
    recommendations.push("충분한 휴식이 필요합니다");
  }

  // 열 스트레스 위험도
  if (metrics.body_temperature > 37.5) {
    analysis.heat_stress_risk = 4.0;
    recommendations.push("즉시 시원한 곳으로 이동하세요");
    recommendations.push("차가운 물을 마시세요");
  } else if (metrics.body_temperature > 37.0) {
    analysis.heat_stress_risk = 2.5;
    recommendations.push("그늘에서 휴식을 취하세요");
  }

  // 피로도
  if (metrics.stress_level > 3 || metrics.sleep_hours < 6) {
    analysis.fatigue_level = 3.0;
    recommendations.push("충분한 수면이 필요합니다");
  }

  // 수분 상태
  if (metrics.hydration_level < 60) {
    analysis.hydration_status = "low";
    recommendations.push("즉시 수분을 보충하세요");
  } else if (metrics.hydration_level < 80) {
    analysis.hydration_status = "adequate";
    recommendations.push("정기적으로 물을 마시세요");
  }

  const overallScore = (
    analysis.cardiovascular_risk + 
    analysis.heat_stress_risk + 
    analysis.fatigue_level
  ) / 3;

  return {
    analysis: analysis,
    score: Math.round(overallScore * 10) / 10,
    recommendations: recommendations
  };
}

// 고용주 알림 함수
async function notifyEmployer(supabaseClient: any, workerId: string, riskAnalysis: any) {
  try {
    // 근로자의 고용주 찾기 (실제로는 더 복잡한 로직 필요)
    const { data: employers } = await supabaseClient
      .from('user_profiles_2025_10_13_08_09')
      .select('user_id')
      .eq('user_type', 'employer');

    if (employers && employers.length > 0) {
      const employerId = employers[0].user_id;
      
      // 알림 큐에 추가
      await supabaseClient
        .from('notification_queue_2025_10_17_16_02')
        .insert({
          user_id: employerId,
          notification_type: 'worker_health_alert',
          title: '근로자 건강 이상 감지',
          message: `근로자의 건강 상태에 이상이 감지되었습니다. (위험도: ${riskAnalysis.score}/5)`,
          priority: 'high',
          scheduled_time: new Date().toISOString(),
          status: 'pending'
        });
    }
  } catch (error) {
    console.error('Employer notification error:', error);
  }
}

// 건강 요약 생성 함수
function generateHealthSummary(healthHistory: any[]) {
  if (healthHistory.length === 0) {
    return {
      averageHeartRate: 0,
      averageRiskLevel: 0,
      totalMeasurements: 0,
      trend: 'stable'
    };
  }

  const avgHeartRate = healthHistory.reduce((sum, record) => 
    sum + (record.health_metrics.heart_rate || 0), 0) / healthHistory.length;
  
  const avgRiskLevel = healthHistory.reduce((sum, record) => 
    sum + (record.risk_level || 0), 0) / healthHistory.length;

  // 트렌드 분석 (최근 5개 vs 이전 5개)
  const recent = healthHistory.slice(0, 5);
  const previous = healthHistory.slice(5, 10);
  
  let trend = 'stable';
  if (recent.length >= 3 && previous.length >= 3) {
    const recentAvg = recent.reduce((sum, r) => sum + r.risk_level, 0) / recent.length;
    const previousAvg = previous.reduce((sum, r) => sum + r.risk_level, 0) / previous.length;
    
    if (recentAvg > previousAvg + 0.5) trend = 'worsening';
    else if (recentAvg < previousAvg - 0.5) trend = 'improving';
  }

  return {
    averageHeartRate: Math.round(avgHeartRate),
    averageRiskLevel: Math.round(avgRiskLevel * 10) / 10,
    totalMeasurements: healthHistory.length,
    trend: trend
  };
}