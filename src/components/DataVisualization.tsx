import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Calendar,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';

interface ChartData {
  date: string;
  riskLevel: number;
  weatherRisk: number;
  industryRisk: number;
  healthRisk: number;
  incidents: number;
}

interface StatsSummary {
  totalAlerts: number;
  avgRiskLevel: number;
  riskTrend: 'up' | 'down' | 'stable';
  mostCommonRisk: string;
  safetyScore: number;
}

const DataVisualization: React.FC = () => {
  const { user } = useAuth();
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [statsSummary, setStatsSummary] = useState<StatsSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('7days');
  const [chartType, setChartType] = useState('risk-trend');

  useEffect(() => {
    if (user) {
      fetchVisualizationData();
    }
  }, [user, timeRange]);

  const fetchVisualizationData = async () => {
    setLoading(true);
    try {
      // 시간 범위에 따른 날짜 계산
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeRange) {
        case '7days':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30days':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90days':
          startDate.setDate(endDate.getDate() - 90);
          break;
        default:
          startDate.setDate(endDate.getDate() - 7);
      }

      // 리스크 예측 데이터 조회
      const { data: riskData, error: riskError } = await supabase
        .from('risk_predictions_2025_10_13_08_09')
        .select('*')
        .eq('user_id', user?.id)
        .gte('prediction_date', startDate.toISOString().split('T')[0])
        .lte('prediction_date', endDate.toISOString().split('T')[0])
        .order('prediction_date', { ascending: true });

      if (riskError) throw riskError;

      // 안전 알림 데이터 조회
      const { data: alertsData, error: alertsError } = await supabase
        .from('safety_alerts_2025_10_13_08_09')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: true });

      if (alertsError) throw alertsError;

      // 긴급 신고 데이터 조회
      const { data: incidentsData, error: incidentsError } = await supabase
        .from('emergency_reports_2025_10_17_16_02')
        .select('*')
        .eq('reporter_id', user?.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: true });

      if (incidentsError) throw incidentsError;

      // 차트 데이터 생성
      const processedData = processChartData(riskData || [], alertsData || [], incidentsData || [], startDate, endDate);
      setChartData(processedData);

      // 통계 요약 생성
      const summary = generateStatsSummary(riskData || [], alertsData || [], incidentsData || []);
      setStatsSummary(summary);

    } catch (error) {
      console.error('Visualization data fetch error:', error);
      toast({
        title: "데이터 조회 실패",
        description: "시각화 데이터를 불러올 수 없습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const processChartData = (riskData: any[], alertsData: any[], incidentsData: any[], startDate: Date, endDate: Date): ChartData[] => {
    const data: ChartData[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      
      // 해당 날짜의 리스크 데이터 찾기
      const dayRiskData = riskData.find(r => r.prediction_date === dateStr);
      
      // 해당 날짜의 사고 건수 계산
      const dayIncidents = incidentsData.filter(i => 
        i.created_at.split('T')[0] === dateStr
      ).length;

      data.push({
        date: dateStr,
        riskLevel: dayRiskData?.risk_level || 0,
        weatherRisk: dayRiskData?.risk_factors?.weather || 0,
        industryRisk: dayRiskData?.risk_factors?.industry || 0,
        healthRisk: dayRiskData?.risk_factors?.health || 0,
        incidents: dayIncidents
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return data;
  };

  const generateStatsSummary = (riskData: any[], alertsData: any[], incidentsData: any[]): StatsSummary => {
    const totalAlerts = alertsData.length;
    const avgRiskLevel = riskData.length > 0 
      ? riskData.reduce((sum, r) => sum + r.risk_level, 0) / riskData.length 
      : 0;

    // 위험도 트렌드 계산
    let riskTrend: 'up' | 'down' | 'stable' = 'stable';
    if (riskData.length >= 2) {
      const recentRisk = riskData.slice(-3).reduce((sum, r) => sum + r.risk_level, 0) / 3;
      const olderRisk = riskData.slice(0, 3).reduce((sum, r) => sum + r.risk_level, 0) / 3;
      
      if (recentRisk > olderRisk + 0.5) riskTrend = 'up';
      else if (recentRisk < olderRisk - 0.5) riskTrend = 'down';
    }

    // 가장 흔한 위험 유형
    const riskTypes = incidentsData.map(i => i.emergency_type);
    const riskTypeCounts = riskTypes.reduce((acc, type) => {
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const mostCommonRisk = Object.keys(riskTypeCounts).length > 0
      ? Object.keys(riskTypeCounts).reduce((a, b) => riskTypeCounts[a] > riskTypeCounts[b] ? a : b)
      : 'none';

    // 안전 점수 계산 (5점 만점)
    const safetyScore = Math.max(1, 5 - avgRiskLevel);

    return {
      totalAlerts,
      avgRiskLevel: Math.round(avgRiskLevel * 10) / 10,
      riskTrend,
      mostCommonRisk,
      safetyScore: Math.round(safetyScore * 10) / 10
    };
  };

  const renderRiskTrendChart = () => {
    const maxRisk = Math.max(...chartData.map(d => d.riskLevel), 5);
    
    return (
      <div className="space-y-4">
        <div className="h-64 relative">
          <svg className="w-full h-full" viewBox="0 0 400 200">
            {/* 격자 */}
            {[0, 1, 2, 3, 4, 5].map(level => (
              <line
                key={level}
                x1="40"
                y1={180 - (level * 30)}
                x2="380"
                y2={180 - (level * 30)}
                stroke="#e5e7eb"
                strokeWidth="1"
              />
            ))}
            
            {/* Y축 라벨 */}
            {[0, 1, 2, 3, 4, 5].map(level => (
              <text
                key={level}
                x="30"
                y={185 - (level * 30)}
                fontSize="12"
                fill="#6b7280"
                textAnchor="end"
              >
                {level}
              </text>
            ))}

            {/* 리스크 레벨 라인 */}
            {chartData.length > 1 && (
              <polyline
                points={chartData.map((d, i) => 
                  `${40 + (i * (340 / (chartData.length - 1)))},${180 - (d.riskLevel * 30)}`
                ).join(' ')}
                fill="none"
                stroke="#ef4444"
                strokeWidth="3"
              />
            )}

            {/* 데이터 포인트 */}
            {chartData.map((d, i) => (
              <circle
                key={i}
                cx={40 + (i * (340 / Math.max(chartData.length - 1, 1)))}
                cy={180 - (d.riskLevel * 30)}
                r="4"
                fill="#ef4444"
              />
            ))}
          </svg>
        </div>
        
        {/* X축 라벨 */}
        <div className="flex justify-between text-xs text-gray-500 px-10">
          {chartData.map((d, i) => (
            i % Math.ceil(chartData.length / 5) === 0 && (
              <span key={i}>
                {new Date(d.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
              </span>
            )
          ))}
        </div>
      </div>
    );
  };

  const renderRiskFactorsChart = () => {
    const avgFactors = chartData.reduce((acc, d) => ({
      weather: acc.weather + d.weatherRisk,
      industry: acc.industry + d.industryRisk,
      health: acc.health + d.healthRisk
    }), { weather: 0, industry: 0, health: 0 });

    if (chartData.length > 0) {
      avgFactors.weather /= chartData.length;
      avgFactors.industry /= chartData.length;
      avgFactors.health /= chartData.length;
    }

    const factors = [
      { name: '기상 위험', value: avgFactors.weather, color: '#3b82f6' },
      { name: '산업 위험', value: avgFactors.industry, color: '#f59e0b' },
      { name: '건강 위험', value: avgFactors.health, color: '#ef4444' }
    ];

    return (
      <div className="space-y-4">
        {factors.map((factor, index) => (
          <div key={index} className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">{factor.name}</span>
              <span className="text-sm text-gray-500">{factor.value.toFixed(1)}/5</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="h-3 rounded-full transition-all duration-300"
                style={{
                  width: `${(factor.value / 5) * 100}%`,
                  backgroundColor: factor.color
                }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderIncidentsChart = () => {
    const maxIncidents = Math.max(...chartData.map(d => d.incidents), 1);
    
    return (
      <div className="space-y-4">
        <div className="h-64 flex items-end justify-between space-x-1">
          {chartData.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center">
              <div
                className="w-full bg-red-500 rounded-t transition-all duration-300"
                style={{
                  height: `${(d.incidents / maxIncidents) * 200}px`,
                  minHeight: d.incidents > 0 ? '4px' : '0px'
                }}
              />
              <span className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-left">
                {new Date(d.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const exportData = () => {
    const csvContent = [
      ['날짜', '위험도', '기상위험', '산업위험', '건강위험', '사고건수'],
      ...chartData.map(d => [
        d.date,
        d.riskLevel,
        d.weatherRisk,
        d.industryRisk,
        d.healthRisk,
        d.incidents
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `safebridge_data_${timeRange}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* 컨트롤 패널 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            <span>데이터 시각화</span>
          </CardTitle>
          <CardDescription>
            안전 데이터를 시각적으로 분석하고 트렌드를 파악합니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7days">최근 7일</SelectItem>
                  <SelectItem value="30days">최근 30일</SelectItem>
                  <SelectItem value="90days">최근 90일</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4" />
              <Select value={chartType} onValueChange={setChartType}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="risk-trend">위험도 추이</SelectItem>
                  <SelectItem value="risk-factors">위험 요소별</SelectItem>
                  <SelectItem value="incidents">사고 발생</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={fetchVisualizationData}
              disabled={loading}
              variant="outline"
              className="stable-button flex items-center space-x-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>새로고침</span>
            </Button>

            <Button
              onClick={exportData}
              variant="outline"
              className="stable-button flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>데이터 내보내기</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 통계 요약 */}
      {statsSummary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">총 알림</p>
                  <p className="text-2xl font-bold">{statsSummary.totalAlerts}</p>
                </div>
                <Activity className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">평균 위험도</p>
                  <p className="text-2xl font-bold">{statsSummary.avgRiskLevel}/5</p>
                </div>
                <BarChart3 className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">위험도 추세</p>
                  <div className="flex items-center space-x-2">
                    {statsSummary.riskTrend === 'up' && <TrendingUp className="h-5 w-5 text-red-500" />}
                    {statsSummary.riskTrend === 'down' && <TrendingDown className="h-5 w-5 text-green-500" />}
                    {statsSummary.riskTrend === 'stable' && <Activity className="h-5 w-5 text-gray-500" />}
                    <span className="text-lg font-bold">
                      {statsSummary.riskTrend === 'up' && '상승'}
                      {statsSummary.riskTrend === 'down' && '하락'}
                      {statsSummary.riskTrend === 'stable' && '안정'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">안전 점수</p>
                  <p className="text-2xl font-bold text-green-600">{statsSummary.safetyScore}/5</p>
                </div>
                <Badge 
                  className={`${
                    statsSummary.safetyScore >= 4 ? 'bg-green-500' :
                    statsSummary.safetyScore >= 3 ? 'bg-yellow-500' : 'bg-red-500'
                  } text-white`}
                >
                  {statsSummary.safetyScore >= 4 ? '우수' :
                   statsSummary.safetyScore >= 3 ? '보통' : '주의'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 차트 영역 */}
      <Card>
        <CardHeader>
          <CardTitle>
            {chartType === 'risk-trend' && '위험도 추이'}
            {chartType === 'risk-factors' && '위험 요소별 분석'}
            {chartType === 'incidents' && '사고 발생 현황'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
                <p className="text-gray-600">데이터를 불러오는 중...</p>
              </div>
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">표시할 데이터가 없습니다.</p>
                <p className="text-sm text-gray-500">다른 기간을 선택해보세요.</p>
              </div>
            </div>
          ) : (
            <>
              {chartType === 'risk-trend' && renderRiskTrendChart()}
              {chartType === 'risk-factors' && renderRiskFactorsChart()}
              {chartType === 'incidents' && renderIncidentsChart()}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DataVisualization;