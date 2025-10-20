import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  Shield, 
  Activity, 
  Cloud, 
  Factory, 
  Heart,
  RefreshCw,
  Target,
  BarChart3,
  Lightbulb
} from 'lucide-react';

interface RiskPrediction {
  overallRisk: number;
  weatherRisk: number;
  industryRisk: number;
  healthRisk: number;
  historicalRisk: number;
  confidence: number;
  recommendations: string[];
  analysis: {
    primaryRiskFactors: string[];
    urgentActions: string[];
    preventiveMeasures: string[];
  };
}

interface PredictionHistory {
  id: string;
  prediction_date: string;
  risk_level: number;
  confidence_score: number;
  risk_factors: any;
  recommendations: string[];
}

const AIRiskPrediction: React.FC = () => {
  const { user } = useAuth();
  const [prediction, setPrediction] = useState<RiskPrediction | null>(null);
  const [predictionHistory, setPredictionHistory] = useState<PredictionHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
      fetchPredictionHistory();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles_2025_10_13_08_09')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setUserProfile(data);
    } catch (error) {
      console.error('User profile fetch error:', error);
    }
  };

  const fetchPredictionHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('risk_predictions_2025_10_13_08_09')
        .select('*')
        .eq('user_id', user?.id)
        .order('prediction_date', { ascending: false })
        .limit(10);

      if (error) throw error;
      setPredictionHistory(data || []);
    } catch (error) {
      console.error('Prediction history fetch error:', error);
    }
  };

  const generateRiskPrediction = async () => {
    if (!userProfile) {
      toast({
        title: "프로필 정보 필요",
        description: "리스크 예측을 위해 사용자 프로필 정보가 필요합니다.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai_risk_prediction_2025_10_17_16_02', {
        body: {
          userId: user?.id,
          region: userProfile.workplace_location?.region || '서울',
          industry: userProfile.industry_sector || 'agriculture',
          timeframe: 'daily',
          includeHealthData: true
        }
      });

      if (error) throw error;

      setPrediction(data.riskAnalysis);
      await fetchPredictionHistory(); // 새로운 예측 후 히스토리 업데이트

      toast({
        title: "AI 리스크 예측 완료",
        description: "최신 데이터를 기반으로 리스크 분석이 완료되었습니다.",
      });

    } catch (error) {
      console.error('Risk prediction error:', error);
      toast({
        title: "예측 실패",
        description: "리스크 예측 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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

  const getRiskIcon = (type: string) => {
    switch (type) {
      case 'weather': return <Cloud className="h-4 w-4" />;
      case 'industry': return <Factory className="h-4 w-4" />;
      case 'health': return <Heart className="h-4 w-4" />;
      case 'historical': return <BarChart3 className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* AI 리스크 예측 헤더 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-6 w-6 text-purple-600" />
            <span>AI 기반 리스크 예측</span>
          </CardTitle>
          <CardDescription>
            인공지능이 기상, 산업, 건강, 과거 데이터를 종합 분석하여 개인별 위험도를 예측합니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                마지막 예측: {predictionHistory[0] ? 
                  new Date(predictionHistory[0].prediction_date).toLocaleDateString('ko-KR') : 
                  '없음'
                }
              </div>
              {prediction && (
                <Badge variant="outline" className="flex items-center space-x-1">
                  <Target className="h-3 w-3" />
                  <span>신뢰도: {Math.round(prediction.confidence * 100)}%</span>
                </Badge>
              )}
            </div>
            <Button
              onClick={generateRiskPrediction}
              disabled={loading}
              className="stable-button flex items-center space-x-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? '분석 중...' : 'AI 예측 실행'}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 예측 결과 */}
      {prediction && (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">종합 분석</span>
              <span className="sm:hidden">분석</span>
            </TabsTrigger>
            <TabsTrigger value="factors" className="flex items-center space-x-2">
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">위험 요소</span>
              <span className="sm:hidden">요소</span>
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="flex items-center space-x-2">
              <Lightbulb className="h-4 w-4" />
              <span className="hidden sm:inline">권장사항</span>
              <span className="sm:hidden">권장</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">예측 이력</span>
              <span className="sm:hidden">이력</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* 종합 위험도 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>종합 위험도</span>
                  <Badge className={`${getRiskLevelColor(prediction.overallRisk)} text-white`}>
                    레벨 {prediction.overallRisk} - {getRiskLevelText(prediction.overallRisk)}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">위험도 점수</span>
                    <span className="text-2xl font-bold">{prediction.overallRisk}/5</span>
                  </div>
                  <Progress value={prediction.overallRisk * 20} className="h-3" />
                  
                  {prediction.overallRisk >= 4 && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>높은 위험도가 감지되었습니다!</strong> 즉시 안전 조치를 취하시기 바랍니다.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 세부 위험 요소 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2 text-sm">
                    {getRiskIcon('weather')}
                    <span>기상 위험</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-2xl font-bold mb-2">{prediction.weatherRisk}/5</div>
                    <Progress value={prediction.weatherRisk * 20} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2 text-sm">
                    {getRiskIcon('industry')}
                    <span>산업 위험</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-2xl font-bold mb-2">{prediction.industryRisk}/5</div>
                    <Progress value={prediction.industryRisk * 20} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2 text-sm">
                    {getRiskIcon('health')}
                    <span>건강 위험</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-2xl font-bold mb-2">{prediction.healthRisk}/5</div>
                    <Progress value={prediction.healthRisk * 20} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2 text-sm">
                    {getRiskIcon('historical')}
                    <span>과거 패턴</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-2xl font-bold mb-2">{prediction.historicalRisk}/5</div>
                    <Progress value={prediction.historicalRisk * 20} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="factors" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    <span>주요 위험 요소</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {prediction.analysis.primaryRiskFactors.map((factor, index) => (
                      <Badge key={index} variant="destructive" className="mr-2 mb-2">
                        {factor}
                      </Badge>
                    ))}
                    {prediction.analysis.primaryRiskFactors.length === 0 && (
                      <p className="text-gray-500">현재 주요 위험 요소가 감지되지 않았습니다.</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-green-500" />
                    <span>예방 조치</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {prediction.analysis.preventiveMeasures.map((measure, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm">{measure}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-red-600">
                    <AlertTriangle className="h-5 w-5" />
                    <span>즉시 조치 사항</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {prediction.analysis.urgentActions.map((action, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg">
                        <div className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <span className="text-sm">{action}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-blue-600">
                    <Lightbulb className="h-5 w-5" />
                    <span>일반 권장사항</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {prediction.recommendations.map((recommendation, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                        <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <span className="text-sm">{recommendation}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>예측 이력</CardTitle>
                <CardDescription>
                  최근 AI 리스크 예측 결과들을 확인할 수 있습니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {predictionHistory.map((history) => (
                    <div key={history.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Badge className={`${getRiskLevelColor(history.risk_level)} text-white`}>
                          레벨 {history.risk_level}
                        </Badge>
                        <div>
                          <p className="font-medium">
                            {new Date(history.prediction_date).toLocaleDateString('ko-KR')}
                          </p>
                          <p className="text-sm text-gray-500">
                            신뢰도: {Math.round(history.confidence_score * 100)}%
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">
                          {history.recommendations.length}개 권장사항
                        </p>
                      </div>
                    </div>
                  ))}
                  {predictionHistory.length === 0 && (
                    <p className="text-center text-gray-500 py-8">
                      아직 예측 이력이 없습니다. AI 예측을 실행해보세요.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* 예측 결과가 없는 경우 */}
      {!prediction && !loading && (
        <Card>
          <CardContent className="text-center py-12">
            <Brain className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">AI 리스크 예측</h3>
            <p className="text-gray-500 mb-6">
              인공지능을 활용한 개인별 위험도 분석을 시작해보세요.
            </p>
            <Button
              onClick={generateRiskPrediction}
              className="stable-button"
            >
              첫 번째 예측 실행
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AIRiskPrediction;