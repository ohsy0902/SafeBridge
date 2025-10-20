import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Heart, Thermometer, Activity, Droplets, AlertTriangle, TrendingUp, Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface HealthData {
  id: string;
  measurement_type: string;
  measurement_value: any;
  measurement_unit: string;
  measurement_source: string;
  work_activity: string;
  created_at: string;
}

interface HealthAnalysis {
  id: string;
  analysis_date: string;
  overall_risk_level: number;
  risk_factors: any;
  health_recommendations: any;
  confidence_score: number;
}

const HealthMonitoring: React.FC = () => {
  const { user } = useAuth();
  const [healthData, setHealthData] = useState<HealthData[]>([]);
  const [latestAnalysis, setLatestAnalysis] = useState<HealthAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInputForm, setShowInputForm] = useState(false);
  const [newMeasurement, setNewMeasurement] = useState({
    type: 'heart_rate',
    value: '',
    unit: 'bpm',
    source: 'manual',
    activity: ''
  });

  useEffect(() => {
    if (user) {
      fetchHealthData();
      fetchLatestAnalysis();
    }
  }, [user]);

  const fetchHealthData = async () => {
    try {
      const { data, error } = await supabase
        .from('health_data_2025_10_17_15_24')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setHealthData(data || []);
    } catch (error) {
      console.error('Health data fetch error:', error);
      toast({
        title: "데이터 조회 실패",
        description: "건강 데이터를 불러올 수 없습니다.",
        variant: "destructive",
      });
    }
  };

  const fetchLatestAnalysis = async () => {
    try {
      const { data, error } = await supabase
        .from('health_risk_analysis_2025_10_17_15_24')
        .select('*')
        .eq('user_id', user?.id)
        .order('analysis_date', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setLatestAnalysis(data);
    } catch (error) {
      console.error('Analysis fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMeasurement = async () => {
    if (!newMeasurement.value) {
      toast({
        title: "입력 오류",
        description: "측정값을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('health_data_2025_10_17_15_24')
        .insert({
          user_id: user?.id,
          measurement_type: newMeasurement.type,
          measurement_value: { value: parseFloat(newMeasurement.value) },
          measurement_unit: newMeasurement.unit,
          measurement_source: newMeasurement.source,
          work_activity: newMeasurement.activity
        });

      if (error) throw error;

      toast({
        title: "데이터 저장 완료",
        description: "건강 데이터가 성공적으로 저장되었습니다.",
      });

      setNewMeasurement({
        type: 'heart_rate',
        value: '',
        unit: 'bpm',
        source: 'manual',
        activity: ''
      });
      setShowInputForm(false);
      fetchHealthData();
      
      // 새로운 분석 요청
      requestHealthAnalysis();
    } catch (error) {
      console.error('Health data insert error:', error);
      toast({
        title: "저장 실패",
        description: "건강 데이터 저장에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const requestHealthAnalysis = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('health_analysis_2025_10_17_15_24', {
        body: {
          userId: user?.id,
          analysisType: 'real_time',
          includeEnvironmental: true
        }
      });

      if (error) throw error;

      toast({
        title: "건강 분석 완료",
        description: "최신 건강 위험도 분석이 완료되었습니다.",
      });

      fetchLatestAnalysis();
    } catch (error) {
      console.error('Health analysis error:', error);
      toast({
        title: "분석 실패",
        description: "건강 위험도 분석에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const getRiskLevelColor = (level: number) => {
    switch (level) {
      case 5: return 'bg-red-500';
      case 4: return 'bg-orange-500';
      case 3: return 'bg-yellow-500';
      case 2: return 'bg-blue-500';
      default: return 'bg-green-500';
    }
  };

  const getRiskLevelText = (level: number) => {
    switch (level) {
      case 5: return '매우 위험';
      case 4: return '위험';
      case 3: return '주의';
      case 2: return '보통';
      default: return '안전';
    }
  };

  const getMeasurementIcon = (type: string) => {
    switch (type) {
      case 'heart_rate': return <Heart className="h-4 w-4" />;
      case 'body_temp': return <Thermometer className="h-4 w-4" />;
      case 'fatigue_level': return <Activity className="h-4 w-4" />;
      case 'hydration': return <Droplets className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getMeasurementTypeText = (type: string) => {
    switch (type) {
      case 'heart_rate': return '심박수';
      case 'body_temp': return '체온';
      case 'fatigue_level': return '피로도';
      case 'hydration': return '수분 상태';
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">건강 모니터링</h2>
        <Button onClick={() => setShowInputForm(!showInputForm)} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>건강 데이터 입력</span>
        </Button>
      </div>

      {/* 건강 데이터 입력 폼 */}
      {showInputForm && (
        <Card>
          <CardHeader>
            <CardTitle>건강 데이터 입력</CardTitle>
            <CardDescription>현재 건강 상태를 입력해주세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="measurement-type">측정 항목</Label>
                <Select value={newMeasurement.type} onValueChange={(value) => 
                  setNewMeasurement(prev => ({ 
                    ...prev, 
                    type: value,
                    unit: value === 'heart_rate' ? 'bpm' : 
                          value === 'body_temp' ? 'celsius' : 
                          value === 'fatigue_level' ? 'scale_1_10' : 'scale_1_10'
                  }))
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="heart_rate">심박수</SelectItem>
                    <SelectItem value="body_temp">체온</SelectItem>
                    <SelectItem value="fatigue_level">피로도 (1-10)</SelectItem>
                    <SelectItem value="hydration">수분 상태 (1-10)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="measurement-value">측정값</Label>
                <Input
                  id="measurement-value"
                  type="number"
                  placeholder={
                    newMeasurement.type === 'heart_rate' ? '70' :
                    newMeasurement.type === 'body_temp' ? '36.5' :
                    '5'
                  }
                  value={newMeasurement.value}
                  onChange={(e) => setNewMeasurement(prev => ({ ...prev, value: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="work-activity">현재 작업</Label>
                <Input
                  id="work-activity"
                  placeholder="예: 농작물 수확, 어선 작업 등"
                  value={newMeasurement.activity}
                  onChange={(e) => setNewMeasurement(prev => ({ ...prev, activity: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="measurement-source">측정 방법</Label>
                <Select value={newMeasurement.source} onValueChange={(value) => 
                  setNewMeasurement(prev => ({ ...prev, source: value }))
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">수동 입력</SelectItem>
                    <SelectItem value="wearable">웨어러블 기기</SelectItem>
                    <SelectItem value="sensor">센서</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex space-x-2">
              <Button onClick={handleAddMeasurement}>저장</Button>
              <Button variant="outline" onClick={() => setShowInputForm(false)}>취소</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 최신 건강 위험도 분석 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>건강 위험도 분석</span>
            </CardTitle>
            <CardDescription>AI 기반 건강 상태 분석 결과</CardDescription>
          </CardHeader>
          <CardContent>
            {latestAnalysis ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">전체 위험도</span>
                  <Badge className={getRiskLevelColor(latestAnalysis.overall_risk_level)}>
                    {getRiskLevelText(latestAnalysis.overall_risk_level)}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>위험도 점수</span>
                    <span>{latestAnalysis.overall_risk_level}/5</span>
                  </div>
                  <Progress value={latestAnalysis.overall_risk_level * 20} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>분석 신뢰도</span>
                    <span>{Math.round((latestAnalysis.confidence_score || 0) * 100)}%</span>
                  </div>
                  <Progress value={(latestAnalysis.confidence_score || 0) * 100} className="h-2" />
                </div>

                {latestAnalysis.health_recommendations?.ko && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>권장사항:</strong>
                      <ul className="mt-2 space-y-1">
                        {latestAnalysis.health_recommendations.ko.map((rec: string, index: number) => (
                          <li key={index} className="text-sm">• {rec}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="text-xs text-gray-500">
                  마지막 분석: {new Date(latestAnalysis.analysis_date).toLocaleDateString('ko-KR')}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">아직 건강 분석 데이터가 없습니다.</p>
                <Button onClick={requestHealthAnalysis} variant="outline">
                  건강 분석 시작
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 최근 건강 데이터 */}
        <Card>
          <CardHeader>
            <CardTitle>최근 건강 데이터</CardTitle>
            <CardDescription>최근 입력된 건강 측정 데이터</CardDescription>
          </CardHeader>
          <CardContent>
            {healthData.length > 0 ? (
              <div className="space-y-3">
                {healthData.slice(0, 5).map((data) => (
                  <div key={data.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getMeasurementIcon(data.measurement_type)}
                      <div>
                        <p className="font-medium text-sm">{getMeasurementTypeText(data.measurement_type)}</p>
                        <p className="text-xs text-gray-500">
                          {data.work_activity && `${data.work_activity} • `}
                          {new Date(data.created_at).toLocaleString('ko-KR')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {data.measurement_value.value} {data.measurement_unit}
                      </p>
                      <p className="text-xs text-gray-500">{data.measurement_source}</p>
                    </div>
                  </div>
                ))}
                
                {healthData.length > 5 && (
                  <div className="text-center pt-2">
                    <Button variant="ghost" size="sm">
                      더 보기 ({healthData.length - 5}개 더)
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">건강 데이터가 없습니다.</p>
                <Button onClick={() => setShowInputForm(true)} variant="outline">
                  첫 번째 데이터 입력하기
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HealthMonitoring;