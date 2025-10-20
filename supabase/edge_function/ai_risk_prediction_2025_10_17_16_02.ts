import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, X-Client-Info, apikey, Content-Type, X-Application-Name',
};

interface RiskPredictionRequest {
  userId: string;
  region: string;
  industry: string;
  timeframe: string; // 'daily', 'weekly', 'monthly'
  includeHealthData?: boolean;
}

interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  uvIndex: number;
}

interface HealthRiskFactors {
  age: number;
  workExperience: number;
  healthConditions: string[];
  recentIncidents: number;
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

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const {
      userId,
      region,
      industry,
      timeframe,
      includeHealthData = false
    }: RiskPredictionRequest = await req.json();

    // 1. 기상 데이터 수집 및 분석
    const weatherRisk = await analyzeWeatherRisk(region, timeframe);
    
    // 2. 산업별 위험 요소 분석
    const industryRisk = await analyzeIndustryRisk(industry, region);
    
    // 3. 건강 데이터 기반 개인 위험도 분석 (옵션)
    let personalHealthRisk = null;
    if (includeHealthData) {
      personalHealthRisk = await analyzePersonalHealthRisk(supabase, userId);
    }
    
    // 4. 과거 사고 데이터 기반 패턴 분석
    const historicalRisk = await analyzeHistoricalPatterns(supabase, region, industry);
    
    // 5. AI 기반 종합 위험도 계산
    const comprehensiveRisk = calculateComprehensiveRisk({
      weatherRisk,
      industryRisk,
      personalHealthRisk,
      historicalRisk
    });
    
    // 6. 예측 결과 저장
    const predictionResult = await savePredictionResult(supabase, {
      userId,
      region,
      industry,
      timeframe,
      riskLevel: comprehensiveRisk.overallRisk,
      weatherRisk: comprehensiveRisk.weatherRisk,
      industryRisk: comprehensiveRisk.industryRisk,
      healthRisk: comprehensiveRisk.healthRisk,
      recommendations: comprehensiveRisk.recommendations,
      confidence: comprehensiveRisk.confidence
    });

    // 7. 실시간 알림 생성 (위험도가 높은 경우)
    if (comprehensiveRisk.overallRisk >= 4) {
      await createHighRiskAlert(supabase, userId, comprehensiveRisk);
    }

    return new Response(
      JSON.stringify({
        success: true,
        prediction: predictionResult,
        riskAnalysis: comprehensiveRisk,
        message: 'AI 기반 리스크 예측이 완료되었습니다.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('AI risk prediction error:', error);
    return new Response(
      JSON.stringify({ error: 'AI 리스크 예측 실패', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function analyzeWeatherRisk(region: string, timeframe: string): Promise<any> {
  // 실제 구현에서는 기상청 API 또는 OpenWeatherMap API 호출
  // 여기서는 시뮬레이션 데이터 사용
  const weatherData: WeatherData = {
    temperature: 32 + Math.random() * 10, // 32-42도
    humidity: 60 + Math.random() * 30,    // 60-90%
    windSpeed: Math.random() * 20,        // 0-20m/s
    precipitation: Math.random() * 50,    // 0-50mm
    uvIndex: 8 + Math.random() * 3        // 8-11
  };

  let riskScore = 1;
  const riskFactors = [];

  // 폭염 위험
  if (weatherData.temperature > 35) {
    riskScore += 2;
    riskFactors.push('폭염 경보');
  } else if (weatherData.temperature > 32) {
    riskScore += 1;
    riskFactors.push('폭염 주의보');
  }

  // 습도 위험
  if (weatherData.humidity > 80) {
    riskScore += 1;
    riskFactors.push('고습도');
  }

  // 강풍 위험
  if (weatherData.windSpeed > 15) {
    riskScore += 2;
    riskFactors.push('강풍 경보');
  } else if (weatherData.windSpeed > 10) {
    riskScore += 1;
    riskFactors.push('강풍 주의보');
  }

  // 강수 위험
  if (weatherData.precipitation > 30) {
    riskScore += 2;
    riskFactors.push('호우 경보');
  } else if (weatherData.precipitation > 10) {
    riskScore += 1;
    riskFactors.push('호우 주의보');
  }

  // UV 위험
  if (weatherData.uvIndex > 10) {
    riskScore += 1;
    riskFactors.push('자외선 위험');
  }

  return {
    riskScore: Math.min(riskScore, 5),
    weatherData,
    riskFactors,
    recommendations: generateWeatherRecommendations(riskFactors)
  };
}

async function analyzeIndustryRisk(industry: string, region: string): Promise<any> {
  const industryRiskProfiles = {
    agriculture: {
      baseRisk: 3,
      seasonalFactors: ['폭염', '가뭄', '해충'],
      equipmentRisks: ['농기계 사고', '화학물질 노출'],
      recommendations: ['정기 휴식', '보호장비 착용', '농기계 점검']
    },
    fishery: {
      baseRisk: 4,
      seasonalFactors: ['태풍', '해상 기상악화', '조류'],
      equipmentRisks: ['선박 사고', '어구 사고', '익수'],
      recommendations: ['기상 확인', '구명조끼 착용', '통신장비 점검']
    },
    construction: {
      baseRisk: 4,
      seasonalFactors: ['폭염', '강풍', '결빙'],
      equipmentRisks: ['추락', '중장비 사고', '감전'],
      recommendations: ['안전모 착용', '안전벨트 착용', '장비 점검']
    },
    manufacturing: {
      baseRisk: 3,
      seasonalFactors: ['정전', '화재'],
      equipmentRisks: ['기계 사고', '화학물질 노출', '화재'],
      recommendations: ['보호장비 착용', '정기 점검', '비상계획 숙지']
    }
  };

  const profile = industryRiskProfiles[industry] || industryRiskProfiles.agriculture;
  
  return {
    riskScore: profile.baseRisk,
    industryProfile: profile,
    seasonalRisks: profile.seasonalFactors,
    recommendations: profile.recommendations
  };
}

async function analyzePersonalHealthRisk(supabase: any, userId: string): Promise<any> {
  try {
    // 건강 데이터 조회
    const { data: healthData } = await supabase
      .from('health_data_2025_10_17_15_24')
      .select('*')
      .eq('user_id', userId)
      .order('recorded_at', { ascending: false })
      .limit(10);

    if (!healthData || healthData.length === 0) {
      return { riskScore: 2, message: '건강 데이터 부족' };
    }

    let riskScore = 1;
    const riskFactors = [];

    // 최근 건강 데이터 분석
    const recentData = healthData[0];
    
    if (recentData.heart_rate > 100) {
      riskScore += 1;
      riskFactors.push('높은 심박수');
    }
    
    if (recentData.blood_pressure_systolic > 140) {
      riskScore += 2;
      riskFactors.push('고혈압');
    }
    
    if (recentData.stress_level > 7) {
      riskScore += 1;
      riskFactors.push('높은 스트레스');
    }
    
    if (recentData.fatigue_level > 7) {
      riskScore += 1;
      riskFactors.push('높은 피로도');
    }

    return {
      riskScore: Math.min(riskScore, 5),
      riskFactors,
      recentData,
      recommendations: generateHealthRecommendations(riskFactors)
    };

  } catch (error) {
    console.error('Health risk analysis error:', error);
    return { riskScore: 2, message: '건강 데이터 분석 오류' };
  }
}

async function analyzeHistoricalPatterns(supabase: any, region: string, industry: string): Promise<any> {
  try {
    // 과거 사고 데이터 조회
    const { data: incidents } = await supabase
      .from('emergency_reports_2025_10_17_16_02')
      .select('*')
      .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()) // 최근 90일
      .order('created_at', { ascending: false });

    if (!incidents || incidents.length === 0) {
      return { riskScore: 2, message: '과거 데이터 부족' };
    }

    const incidentsByType = incidents.reduce((acc, incident) => {
      acc[incident.emergency_type] = (acc[incident.emergency_type] || 0) + 1;
      return acc;
    }, {});

    const totalIncidents = incidents.length;
    const avgSeverity = incidents.reduce((sum, inc) => sum + inc.severity_level, 0) / totalIncidents;

    let riskScore = Math.min(Math.floor(totalIncidents / 5) + 1, 5);
    
    return {
      riskScore,
      totalIncidents,
      avgSeverity,
      incidentsByType,
      trendAnalysis: analyzeTrend(incidents)
    };

  } catch (error) {
    console.error('Historical pattern analysis error:', error);
    return { riskScore: 2, message: '과거 패턴 분석 오류' };
  }
}

function calculateComprehensiveRisk(risks: any): any {
  const weights = {
    weather: 0.3,
    industry: 0.25,
    health: 0.25,
    historical: 0.2
  };

  const weatherRisk = risks.weatherRisk?.riskScore || 2;
  const industryRisk = risks.industryRisk?.riskScore || 2;
  const healthRisk = risks.personalHealthRisk?.riskScore || 2;
  const historicalRisk = risks.historicalRisk?.riskScore || 2;

  const overallRisk = Math.round(
    weatherRisk * weights.weather +
    industryRisk * weights.industry +
    healthRisk * weights.health +
    historicalRisk * weights.historical
  );

  const confidence = calculateConfidence(risks);
  const recommendations = generateComprehensiveRecommendations(risks);

  return {
    overallRisk: Math.min(Math.max(overallRisk, 1), 5),
    weatherRisk,
    industryRisk,
    healthRisk,
    historicalRisk,
    confidence,
    recommendations,
    analysis: {
      primaryRiskFactors: identifyPrimaryRiskFactors(risks),
      urgentActions: generateUrgentActions(overallRisk),
      preventiveMeasures: generatePreventiveMeasures(risks)
    }
  };
}

async function savePredictionResult(supabase: any, prediction: any): Promise<any> {
  const { data, error } = await supabase
    .from('risk_predictions_2025_10_13_08_09')
    .insert({
      user_id: prediction.userId,
      prediction_date: new Date().toISOString().split('T')[0],
      risk_level: prediction.riskLevel,
      risk_factors: {
        weather: prediction.weatherRisk,
        industry: prediction.industryRisk,
        health: prediction.healthRisk
      },
      recommendations: prediction.recommendations,
      confidence_score: prediction.confidence,
      region: prediction.region,
      industry_sector: prediction.industry
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function createHighRiskAlert(supabase: any, userId: string, riskAnalysis: any): Promise<void> {
  await supabase
    .from('notification_queue_2025_10_17_16_02')
    .insert({
      recipient_id: userId,
      notification_type: 'safety_alert',
      priority: 5,
      title: `높은 위험도 감지 (레벨 ${riskAnalysis.overallRisk})`,
      content: `AI 분석 결과 높은 위험도가 감지되었습니다. 즉시 안전 조치를 취하시기 바랍니다.`,
      metadata: {
        risk_level: riskAnalysis.overallRisk,
        primary_factors: riskAnalysis.analysis.primaryRiskFactors,
        urgent_actions: riskAnalysis.analysis.urgentActions
      }
    });
}

// 헬퍼 함수들
function generateWeatherRecommendations(riskFactors: string[]): string[] {
  const recommendations = [];
  
  if (riskFactors.includes('폭염 경보') || riskFactors.includes('폭염 주의보')) {
    recommendations.push('충분한 수분 섭취', '그늘에서 휴식', '작업 시간 단축');
  }
  
  if (riskFactors.includes('강풍 경보') || riskFactors.includes('강풍 주의보')) {
    recommendations.push('야외 작업 중단', '안전한 장소로 대피');
  }
  
  if (riskFactors.includes('호우 경보') || riskFactors.includes('호우 주의보')) {
    recommendations.push('실내 작업 전환', '배수로 점검', '전기 안전 확인');
  }
  
  return recommendations;
}

function generateHealthRecommendations(riskFactors: string[]): string[] {
  const recommendations = [];
  
  if (riskFactors.includes('높은 심박수')) {
    recommendations.push('충분한 휴식', '의료진 상담');
  }
  
  if (riskFactors.includes('고혈압')) {
    recommendations.push('염분 섭취 제한', '정기 혈압 측정', '의료진 상담');
  }
  
  if (riskFactors.includes('높은 스트레스')) {
    recommendations.push('스트레스 관리', '충분한 수면', '휴식 시간 확보');
  }
  
  return recommendations;
}

function generateComprehensiveRecommendations(risks: any): string[] {
  const recommendations = new Set<string>();
  
  // 각 위험 요소별 권장사항 수집
  if (risks.weatherRisk?.recommendations) {
    risks.weatherRisk.recommendations.forEach((rec: string) => recommendations.add(rec));
  }
  
  if (risks.industryRisk?.recommendations) {
    risks.industryRisk.recommendations.forEach((rec: string) => recommendations.add(rec));
  }
  
  if (risks.personalHealthRisk?.recommendations) {
    risks.personalHealthRisk.recommendations.forEach((rec: string) => recommendations.add(rec));
  }
  
  return Array.from(recommendations);
}

function calculateConfidence(risks: any): number {
  let confidence = 0.5; // 기본 신뢰도
  
  // 데이터 가용성에 따른 신뢰도 조정
  if (risks.weatherRisk) confidence += 0.2;
  if (risks.industryRisk) confidence += 0.15;
  if (risks.personalHealthRisk && risks.personalHealthRisk.riskScore > 0) confidence += 0.2;
  if (risks.historicalRisk && risks.historicalRisk.totalIncidents > 0) confidence += 0.15;
  
  return Math.min(confidence, 1.0);
}

function identifyPrimaryRiskFactors(risks: any): string[] {
  const factors = [];
  
  if (risks.weatherRisk?.riskScore >= 4) factors.push('기상 위험');
  if (risks.industryRisk?.riskScore >= 4) factors.push('산업 위험');
  if (risks.personalHealthRisk?.riskScore >= 4) factors.push('건강 위험');
  if (risks.historicalRisk?.riskScore >= 4) factors.push('과거 사고 패턴');
  
  return factors;
}

function generateUrgentActions(riskLevel: number): string[] {
  if (riskLevel >= 5) {
    return ['즉시 작업 중단', '안전한 장소로 대피', '관리자에게 연락'];
  } else if (riskLevel >= 4) {
    return ['작업 강도 조절', '안전 장비 점검', '동료와 상황 공유'];
  } else {
    return ['주의 깊게 작업', '정기 휴식', '안전 수칙 준수'];
  }
}

function generatePreventiveMeasures(risks: any): string[] {
  return [
    '정기 건강 검진',
    '안전 교육 참여',
    '보호 장비 착용',
    '기상 정보 확인',
    '비상 연락망 확인'
  ];
}

function analyzeTrend(incidents: any[]): string {
  if (incidents.length < 2) return '데이터 부족';
  
  const recentIncidents = incidents.filter(inc => 
    new Date(inc.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  ).length;
  
  const olderIncidents = incidents.length - recentIncidents;
  
  if (recentIncidents > olderIncidents) {
    return '증가 추세';
  } else if (recentIncidents < olderIncidents) {
    return '감소 추세';
  } else {
    return '안정 추세';
  }
}