import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, X-Client-Info, apikey, Content-Type, X-Application-Name',
};

interface HealthAnalysisRequest {
  userId: string;
  analysisType?: string; // 'daily', 'weekly', 'real_time'
  includeEnvironmental?: boolean;
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

    const { userId, analysisType = 'daily', includeEnvironmental = true }: HealthAnalysisRequest = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 최근 건강 데이터 조회 (지난 7일)
    const { data: healthData, error: healthError } = await supabase
      .from('health_data_2025_10_17_15_24')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });

    if (healthError) {
      throw new Error(`Failed to fetch health data: ${healthError.message}`);
    }

    // 사용자 프로필 정보 조회
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles_2025_10_13_08_09')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
    }

    // 환경 데이터 조회 (선택적)
    let environmentalData = null;
    if (includeEnvironmental && userProfile?.workplace_location) {
      const { data: envData } = await supabase
        .from('workplace_environment_2025_10_17_15_24')
        .select('*')
        .eq('employer_id', userProfile.user_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      environmentalData = envData;
    }

    // AI 기반 건강 위험도 분석
    const analysisResult = await performHealthRiskAnalysis(healthData, userProfile, environmentalData);

    // 분석 결과 저장
    const { error: insertError } = await supabase
      .from('health_risk_analysis_2025_10_17_15_24')
      .insert({
        user_id: userId,
        analysis_date: new Date().toISOString().split('T')[0],
        overall_risk_level: analysisResult.riskLevel,
        risk_factors: analysisResult.riskFactors,
        health_recommendations: analysisResult.recommendations,
        predicted_issues: analysisResult.predictedIssues,
        confidence_score: analysisResult.confidence
      });

    if (insertError) {
      console.error('Analysis insert error:', insertError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        analysis: analysisResult,
        dataPoints: healthData?.length || 0,
        analysisDate: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Health analysis error:', error);
    return new Response(
      JSON.stringify({ error: 'Health analysis failed', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function performHealthRiskAnalysis(healthData: any[], userProfile: any, environmentalData: any) {
  // 기본 위험도 계산
  let riskLevel = 1;
  const riskFactors: any = {};
  const recommendations: any = { ko: [], en: [], actions: [] };
  const predictedIssues: any = [];
  let confidence = 0.7; // 기본 신뢰도

  if (!healthData || healthData.length === 0) {
    return {
      riskLevel: 1,
      riskFactors: { no_data: true },
      recommendations: {
        ko: ['건강 데이터를 정기적으로 입력해주세요.'],
        en: ['Please input health data regularly.'],
        actions: ['health_data_input']
      },
      predictedIssues: [],
      confidence: 0.3
    };
  }

  // 최근 데이터 분석
  const recentData = healthData.slice(0, 10); // 최근 10개 데이터
  
  // 심박수 분석
  const heartRateData = recentData.filter(d => d.measurement_type === 'heart_rate');
  if (heartRateData.length > 0) {
    const avgHeartRate = heartRateData.reduce((sum, d) => sum + (d.measurement_value.value || 0), 0) / heartRateData.length;
    
    if (avgHeartRate > 100) {
      riskLevel = Math.max(riskLevel, 4);
      riskFactors.elevated_heart_rate = { value: avgHeartRate, severity: 'high' };
      recommendations.ko.push('심박수가 높습니다. 충분한 휴식을 취하세요.');
      recommendations.en.push('Heart rate is elevated. Please take sufficient rest.');
      recommendations.actions.push('rest_break');
    } else if (avgHeartRate > 85) {
      riskLevel = Math.max(riskLevel, 3);
      riskFactors.elevated_heart_rate = { value: avgHeartRate, severity: 'moderate' };
    }
  }

  // 체온 분석
  const tempData = recentData.filter(d => d.measurement_type === 'body_temp');
  if (tempData.length > 0) {
    const avgTemp = tempData.reduce((sum, d) => sum + (d.measurement_value.value || 0), 0) / tempData.length;
    
    if (avgTemp > 37.5) {
      riskLevel = Math.max(riskLevel, 5);
      riskFactors.fever = { value: avgTemp, severity: 'critical' };
      recommendations.ko.push('발열이 감지되었습니다. 즉시 의료진에게 연락하세요.');
      recommendations.en.push('Fever detected. Contact medical personnel immediately.');
      recommendations.actions.push('medical_attention');
      predictedIssues.push({ type: 'heat_illness', probability: 0.8 });
    } else if (avgTemp > 37.0) {
      riskLevel = Math.max(riskLevel, 3);
      riskFactors.mild_fever = { value: avgTemp, severity: 'moderate' };
    }
  }

  // 피로도 분석
  const fatigueData = recentData.filter(d => d.measurement_type === 'fatigue_level');
  if (fatigueData.length > 0) {
    const avgFatigue = fatigueData.reduce((sum, d) => sum + (d.measurement_value.value || 0), 0) / fatigueData.length;
    
    if (avgFatigue > 8) {
      riskLevel = Math.max(riskLevel, 4);
      riskFactors.high_fatigue = { value: avgFatigue, severity: 'high' };
      recommendations.ko.push('극심한 피로가 감지되었습니다. 작업을 중단하고 휴식하세요.');
      recommendations.en.push('Severe fatigue detected. Stop work and rest.');
      recommendations.actions.push('work_stop');
    } else if (avgFatigue > 6) {
      riskLevel = Math.max(riskLevel, 3);
      riskFactors.moderate_fatigue = { value: avgFatigue, severity: 'moderate' };
    }
  }

  // 환경 요인 고려
  if (environmentalData?.sensor_data) {
    const envTemp = environmentalData.sensor_data.temperature;
    const humidity = environmentalData.sensor_data.humidity;
    
    if (envTemp > 35) {
      riskLevel = Math.max(riskLevel, 4);
      riskFactors.extreme_heat = { value: envTemp, severity: 'high' };
      recommendations.ko.push('극심한 더위입니다. 수분을 충분히 섭취하고 그늘에서 휴식하세요.');
      recommendations.en.push('Extreme heat. Drink plenty of water and rest in shade.');
      recommendations.actions.push('hydration', 'shade_rest');
      predictedIssues.push({ type: 'heat_stroke', probability: 0.6 });
    }
    
    if (humidity > 80 && envTemp > 30) {
      riskLevel = Math.max(riskLevel, 3);
      riskFactors.high_humidity_heat = { temperature: envTemp, humidity: humidity, severity: 'moderate' };
    }
  }

  // 산업별 위험 요인 고려
  if (userProfile?.industry_sector === 'agriculture') {
    if (riskLevel >= 3) {
      recommendations.ko.push('농작업 시 자주 휴식을 취하고 충분한 수분을 섭취하세요.');
      recommendations.en.push('Take frequent breaks and stay hydrated during farm work.');
    }
  } else if (userProfile?.industry_sector === 'fishery') {
    if (riskLevel >= 3) {
      recommendations.ko.push('어업 작업 시 안전장비를 착용하고 동료와 함께 작업하세요.');
      recommendations.en.push('Wear safety equipment and work with colleagues during fishing.');
    }
  }

  // 신뢰도 조정
  if (healthData.length > 20) confidence = Math.min(0.95, confidence + 0.2);
  if (environmentalData) confidence = Math.min(0.95, confidence + 0.1);

  return {
    riskLevel,
    riskFactors,
    recommendations,
    predictedIssues,
    confidence: Math.round(confidence * 100) / 100
  };
}