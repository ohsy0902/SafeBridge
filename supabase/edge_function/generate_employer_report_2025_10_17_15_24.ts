import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, X-Client-Info, apikey, Content-Type, X-Application-Name',
};

interface ReportRequest {
  employerId: string;
  reportType: string; // 'weekly_safety', 'monthly_health', 'quarterly_performance'
  startDate?: string;
  endDate?: string;
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

    const { employerId, reportType, startDate, endDate }: ReportRequest = await req.json();

    if (!employerId || !reportType) {
      return new Response(
        JSON.stringify({ error: 'Employer ID and report type are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 리포트 기간 설정
    const reportPeriod = calculateReportPeriod(reportType, startDate, endDate);

    // 고용주 산하 근로자 목록 조회
    const { data: workers, error: workersError } = await supabase
      .from('user_profiles_2025_10_13_08_09')
      .select('user_id, full_name, industry_sector, workplace_location')
      .eq('user_type', 'worker')
      .eq('industry_sector', 'agriculture'); // 임시로 농업 분야만

    if (workersError) {
      throw new Error(`Failed to fetch workers: ${workersError.message}`);
    }

    if (!workers || workers.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'No workers found for this employer',
          reportData: generateEmptyReport(reportType, reportPeriod)
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const workerIds = workers.map(w => w.user_id);

    // 안전 알림 데이터 조회
    const { data: safetyAlerts, error: alertsError } = await supabase
      .from('user_notifications_2025_10_13_08_09')
      .select(`
        *,
        safety_alerts_2025_10_13_08_09 (
          alert_type,
          severity_level,
          title_ko,
          target_industry
        )
      `)
      .in('user_id', workerIds)
      .gte('created_at', reportPeriod.start)
      .lte('created_at', reportPeriod.end);

    // 건강 위험도 분석 데이터 조회
    const { data: healthAnalyses, error: healthError } = await supabase
      .from('health_risk_analysis_2025_10_17_15_24')
      .select('*')
      .in('user_id', workerIds)
      .gte('analysis_date', reportPeriod.start.split('T')[0])
      .lte('analysis_date', reportPeriod.end.split('T')[0]);

    // 건강 데이터 조회
    const { data: healthData, error: healthDataError } = await supabase
      .from('health_data_2025_10_17_15_24')
      .select('*')
      .in('user_id', workerIds)
      .gte('created_at', reportPeriod.start)
      .lte('created_at', reportPeriod.end);

    // 사용자 피드백 조회
    const { data: feedback, error: feedbackError } = await supabase
      .from('user_feedback_2025_10_17_15_24')
      .select('*')
      .in('user_id', workerIds)
      .gte('created_at', reportPeriod.start)
      .lte('created_at', reportPeriod.end);

    // 리포트 데이터 생성
    const reportData = await generateComprehensiveReport({
      reportType,
      period: reportPeriod,
      workers,
      safetyAlerts: safetyAlerts || [],
      healthAnalyses: healthAnalyses || [],
      healthData: healthData || [],
      feedback: feedback || []
    });

    // 리포트 저장
    const { error: insertError } = await supabase
      .from('employer_reports_2025_10_17_15_24')
      .insert({
        employer_id: employerId,
        report_type: reportType,
        report_period_start: reportPeriod.start.split('T')[0],
        report_period_end: reportPeriod.end.split('T')[0],
        worker_count: workers.length,
        safety_incidents: reportData.summary.safetyIncidents,
        health_alerts: reportData.summary.healthAlerts,
        compliance_score: reportData.summary.complianceScore,
        report_data: reportData,
        auto_generated: true
      });

    if (insertError) {
      console.error('Report insert error:', insertError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        reportType,
        period: reportPeriod,
        workerCount: workers.length,
        reportData
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Report generation error:', error);
    return new Response(
      JSON.stringify({ error: 'Report generation failed', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function calculateReportPeriod(reportType: string, startDate?: string, endDate?: string) {
  const now = new Date();
  let start: Date, end: Date;

  if (startDate && endDate) {
    start = new Date(startDate);
    end = new Date(endDate);
  } else {
    switch (reportType) {
      case 'weekly_safety':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        end = now;
        break;
      case 'monthly_health':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'quarterly_performance':
        const quarter = Math.floor(now.getMonth() / 3);
        start = new Date(now.getFullYear(), quarter * 3 - 3, 1);
        end = new Date(now.getFullYear(), quarter * 3, 0);
        break;
      default:
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        end = now;
    }
  }

  return {
    start: start.toISOString(),
    end: end.toISOString()
  };
}

async function generateComprehensiveReport(data: any) {
  const { reportType, period, workers, safetyAlerts, healthAnalyses, healthData, feedback } = data;

  // 요약 통계 계산
  const summary = {
    totalWorkers: workers.length,
    safetyIncidents: safetyAlerts.filter((alert: any) => alert.safety_alerts_2025_10_13_08_09?.severity_level >= 4).length,
    healthAlerts: healthAnalyses.filter((analysis: any) => analysis.overall_risk_level >= 4).length,
    complianceScore: calculateComplianceScore(safetyAlerts, healthAnalyses, feedback),
    averageRiskLevel: calculateAverageRiskLevel(healthAnalyses),
    feedbackScore: calculateFeedbackScore(feedback)
  };

  // 상세 분석
  const detailedAnalysis = {
    safetyTrends: analyzeSafetyTrends(safetyAlerts),
    healthTrends: analyzeHealthTrends(healthAnalyses, healthData),
    riskDistribution: analyzeRiskDistribution(healthAnalyses),
    workerPerformance: analyzeWorkerPerformance(workers, healthAnalyses, safetyAlerts),
    recommendations: generateRecommendations(summary, safetyAlerts, healthAnalyses)
  };

  // 시각화 데이터
  const visualizationData = {
    riskLevelChart: generateRiskLevelChart(healthAnalyses),
    safetyIncidentChart: generateSafetyIncidentChart(safetyAlerts),
    healthTrendChart: generateHealthTrendChart(healthData),
    complianceChart: generateComplianceChart(summary)
  };

  return {
    summary,
    detailedAnalysis,
    visualizationData,
    period,
    generatedAt: new Date().toISOString(),
    reportType
  };
}

function calculateComplianceScore(safetyAlerts: any[], healthAnalyses: any[], feedback: any[]): number {
  let score = 100;

  // 안전 사고 감점
  const highSeverityAlerts = safetyAlerts.filter(alert => 
    alert.safety_alerts_2025_10_13_08_09?.severity_level >= 4
  ).length;
  score -= highSeverityAlerts * 10;

  // 건강 위험 감점
  const highRiskAnalyses = healthAnalyses.filter(analysis => 
    analysis.overall_risk_level >= 4
  ).length;
  score -= highRiskAnalyses * 5;

  // 피드백 점수 반영
  const avgFeedbackRating = feedback.length > 0 
    ? feedback.reduce((sum: number, f: any) => sum + (f.rating || 3), 0) / feedback.length
    : 3;
  score += (avgFeedbackRating - 3) * 5;

  return Math.max(0, Math.min(100, Math.round(score * 100) / 100));
}

function calculateAverageRiskLevel(healthAnalyses: any[]): number {
  if (healthAnalyses.length === 0) return 1;
  
  const totalRisk = healthAnalyses.reduce((sum, analysis) => sum + analysis.overall_risk_level, 0);
  return Math.round((totalRisk / healthAnalyses.length) * 100) / 100;
}

function calculateFeedbackScore(feedback: any[]): number {
  if (feedback.length === 0) return 3;
  
  const totalRating = feedback.reduce((sum, f) => sum + (f.rating || 3), 0);
  return Math.round((totalRating / feedback.length) * 100) / 100;
}

function analyzeSafetyTrends(safetyAlerts: any[]) {
  const trends = {
    totalAlerts: safetyAlerts.length,
    severityDistribution: {},
    typeDistribution: {},
    weeklyTrend: []
  };

  // 심각도별 분포
  safetyAlerts.forEach(alert => {
    const severity = alert.safety_alerts_2025_10_13_08_09?.severity_level || 1;
    trends.severityDistribution[severity] = (trends.severityDistribution[severity] || 0) + 1;
  });

  return trends;
}

function analyzeHealthTrends(healthAnalyses: any[], healthData: any[]) {
  return {
    totalAnalyses: healthAnalyses.length,
    averageRiskLevel: calculateAverageRiskLevel(healthAnalyses),
    riskTrend: healthAnalyses.map(analysis => ({
      date: analysis.analysis_date,
      riskLevel: analysis.overall_risk_level,
      confidence: analysis.confidence_score
    })),
    dataPoints: healthData.length
  };
}

function analyzeRiskDistribution(healthAnalyses: any[]) {
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  
  healthAnalyses.forEach(analysis => {
    distribution[analysis.overall_risk_level] = (distribution[analysis.overall_risk_level] || 0) + 1;
  });

  return distribution;
}

function analyzeWorkerPerformance(workers: any[], healthAnalyses: any[], safetyAlerts: any[]) {
  return workers.map(worker => {
    const workerHealthAnalyses = healthAnalyses.filter(analysis => analysis.user_id === worker.user_id);
    const workerAlerts = safetyAlerts.filter(alert => alert.user_id === worker.user_id);
    
    return {
      workerId: worker.user_id,
      workerName: worker.full_name,
      averageRiskLevel: calculateAverageRiskLevel(workerHealthAnalyses),
      alertCount: workerAlerts.length,
      lastAnalysisDate: workerHealthAnalyses[0]?.analysis_date || null
    };
  });
}

function generateRecommendations(summary: any, safetyAlerts: any[], healthAnalyses: any[]) {
  const recommendations = [];

  if (summary.averageRiskLevel > 3) {
    recommendations.push({
      priority: 'high',
      category: 'health',
      title: '건강 위험도 개선 필요',
      description: '근로자들의 평균 건강 위험도가 높습니다. 작업 환경 개선과 휴식 시간 증대를 검토하세요.',
      actions: ['환경 개선', '휴식 시간 증대', '건강 검진 실시']
    });
  }

  if (summary.safetyIncidents > 5) {
    recommendations.push({
      priority: 'critical',
      category: 'safety',
      title: '안전 사고 빈발',
      description: '안전 사고가 빈번히 발생하고 있습니다. 안전 교육과 장비 점검을 강화하세요.',
      actions: ['안전 교육 강화', '장비 점검', '작업 절차 재검토']
    });
  }

  if (summary.complianceScore < 80) {
    recommendations.push({
      priority: 'medium',
      category: 'compliance',
      title: '규정 준수율 개선',
      description: '규정 준수율이 낮습니다. 관련 교육과 모니터링을 강화하세요.',
      actions: ['규정 교육', '모니터링 강화', '피드백 수집']
    });
  }

  return recommendations;
}

function generateRiskLevelChart(healthAnalyses: any[]) {
  const distribution = analyzeRiskDistribution(healthAnalyses);
  return {
    type: 'bar',
    data: {
      labels: ['안전 (1)', '보통 (2)', '주의 (3)', '위험 (4)', '매우위험 (5)'],
      values: [distribution[1], distribution[2], distribution[3], distribution[4], distribution[5]]
    }
  };
}

function generateSafetyIncidentChart(safetyAlerts: any[]) {
  // 일별 안전 사고 추이
  const dailyIncidents = {};
  safetyAlerts.forEach(alert => {
    const date = alert.created_at.split('T')[0];
    dailyIncidents[date] = (dailyIncidents[date] || 0) + 1;
  });

  return {
    type: 'line',
    data: {
      labels: Object.keys(dailyIncidents).sort(),
      values: Object.keys(dailyIncidents).sort().map(date => dailyIncidents[date])
    }
  };
}

function generateHealthTrendChart(healthData: any[]) {
  // 건강 데이터 추이 (체온, 심박수 등)
  const trends = {};
  healthData.forEach(data => {
    const date = data.created_at.split('T')[0];
    if (!trends[date]) trends[date] = { count: 0, avgValue: 0 };
    trends[date].count++;
    trends[date].avgValue += (data.measurement_value.value || 0);
  });

  Object.keys(trends).forEach(date => {
    trends[date].avgValue = trends[date].avgValue / trends[date].count;
  });

  return {
    type: 'line',
    data: {
      labels: Object.keys(trends).sort(),
      values: Object.keys(trends).sort().map(date => trends[date].avgValue)
    }
  };
}

function generateComplianceChart(summary: any) {
  return {
    type: 'gauge',
    data: {
      value: summary.complianceScore,
      max: 100,
      label: '규정 준수율'
    }
  };
}

function generateEmptyReport(reportType: string, period: any) {
  return {
    summary: {
      totalWorkers: 0,
      safetyIncidents: 0,
      healthAlerts: 0,
      complianceScore: 100,
      averageRiskLevel: 1,
      feedbackScore: 3
    },
    message: '해당 기간에 데이터가 없습니다.',
    period,
    reportType
  };
}