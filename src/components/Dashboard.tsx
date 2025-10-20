import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import HealthMonitoring from './HealthMonitoring';
import AutoHealthMonitoring from './AutoHealthMonitoring';
import EmployerDashboard from './EmployerDashboardFixed';
import EmergencyReport from './EmergencyReport';
import RealTimeChat from './RealTimeChat';
import LocationSettings from './LocationSettings';
import AIRiskPrediction from './AIRiskPrediction';
import { AlertTriangle, CheckCircle, Clock, MapPin, Thermometer, Wind, Users, Heart, MessageCircle, Settings, Brain } from 'lucide-react';
interface SafetyAlert {
  id: string;
  alert_type: string;
  severity_level: number;
  title_ko: string;
  content_ko: string;
  target_industry: string;
  target_region: string;
  weather_condition: string;
  created_at: string;
}

interface RiskPrediction {
  id: string;
  region: string;
  industry_sector: string;
  prediction_date: string;
  risk_level: number;
  weather_factors: any;
  safety_recommendations: any;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { currentLanguage, translate } = useLanguage();
  const [alerts, setAlerts] = useState<SafetyAlert[]>([]);
  const [predictions, setPredictions] = useState<RiskPrediction[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showEmergencyDialog, setShowEmergencyDialog] = useState(false);
  const [showChatDialog, setShowChatDialog] = useState(false);
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      const initializeDashboard = async () => {
        await fetchUserProfile();
        await fetchDashboardData();
      };
      initializeDashboard();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles_2025_10_13_08_09')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('User profile fetch error:', error);
        // 프로필이 없는 경우 기본값 설정
        setUserProfile({
          user_id: user?.id,
          user_type: 'worker',
          industry_sector: 'agriculture',
          full_name: user?.email?.split('@')[0] || '사용자'
        });
      } else {
        setUserProfile(data);
      }
    } catch (error) {
      console.error('User profile fetch error:', error);
      // 오류 발생 시에도 기본값 설정
      setUserProfile({
        user_id: user?.id,
        user_type: 'worker',
        industry_sector: 'agriculture',
        full_name: user?.email?.split('@')[0] || '사용자'
      });
    } finally {
      setLoading(false); // 프로필 조회 완료 후 로딩 해제
    }
  };

  const fetchDashboardData = async () => {
    if (refreshing) return;
    
    setRefreshing(true);
    try {
      // 안전 알림 조회
      const { data: alertsData, error: alertsError } = await supabase
        .from('safety_alerts_2025_10_13_08_09')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(5);

      if (alertsError) throw alertsError;

      // 위험 예측 조회
      const { data: predictionsData, error: predictionsError } = await supabase
        .from('risk_predictions_2025_10_13_08_09')
        .select('*')
        .gte('prediction_date', new Date().toISOString().split('T')[0])
        .order('prediction_date', { ascending: true })
        .limit(3);

      if (predictionsError) throw predictionsError;

      // 시간대별 안전 알림 가져오기
      const { data: timeBasedAlerts, error: timeAlertsError } = await supabase.functions.invoke(
        'time_based_alerts_2025_10_19_15_40',
        {
          body: { userId: user?.id }
        }
      );

      if (timeAlertsError) {
        console.error('Time-based alerts error:', timeAlertsError);
        setAlerts(alertsData || []);
      } else if (timeBasedAlerts?.success) {
        // 시간대별 알림과 기존 알림 합치기
        const combinedAlerts = [
          ...(timeBasedAlerts.alerts || []),
          ...(alertsData || [])
        ];
        setAlerts(combinedAlerts);
      } else {
        setAlerts(alertsData || []);
      }

      setPredictions(predictionsData || []);
      
      // 새로운 기상 예측 요청
      if (userProfile?.workplace_location) {
        try {
          const { data: weatherData } = await supabase.functions.invoke('weather_prediction_2025_10_13_08_09', {
            body: {
              latitude: 37.5665,
              longitude: 126.9780,
              userId: user?.id
            }
          });
          
          if (weatherData?.success) {
            setWeatherInfo(weatherData);
          }
        } catch (weatherError) {
          console.error('Weather prediction error:', weatherError);
        }
      }
      
    } catch (error) {
      console.error('Dashboard data fetch error:', error);
    } finally {
      setRefreshing(false);
      setLoading(false); // 중요: 로딩 상태 해제
    }
  };

  const getSeverityColor = (level: number) => {
    switch (level) {
      case 5: return 'bg-red-500';
      case 4: return 'bg-orange-500';
      case 3: return 'bg-yellow-500';
      case 2: return 'bg-blue-500';
      default: return 'bg-green-500';
    }
  };

  const getSeverityText = (level: number) => {
    switch (level) {
      case 5: return '매우 위험';
      case 4: return '위험';
      case 3: return '주의';
      case 2: return '보통';
      default: return '안전';
    }
  };

  const getRiskIcon = (level: number) => {
    if (level >= 4) return <AlertTriangle className="h-5 w-5 text-red-500" />;
    if (level >= 3) return <Clock className="h-5 w-5 text-yellow-500" />;
    return <CheckCircle className="h-5 w-5 text-green-500" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 고용주인 경우 고용주 전용 대시보드 표시
  if (userProfile?.user_type === 'employer') {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <EmployerDashboard />
        </div>
      </div>
    );
  }

  // 노동자인 경우 노동자 전용 대시보드 표시

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">SafeBridge 대시보드</h1>
              <p className="text-gray-600 mt-1">
                {userProfile?.user_type === 'worker' ? '실시간 안전 정보와 건강 모니터링' : '실시간 안전 정보와 위험 예측을 확인하세요'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">마지막 업데이트</p>
              <p className="text-lg font-semibold">{new Date().toLocaleString('ko-KR')}</p>
            </div>
          </div>
        </div>

        {/* 노동자용 탭 인터페이스 */}
        {userProfile?.user_type === 'worker' && (
          <Tabs defaultValue="safety" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="safety" className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm">
                <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">안전 알림</span>
                <span className="sm:hidden">안전</span>
              </TabsTrigger>
              <TabsTrigger value="ai-prediction" className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm">
                <Brain className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">AI 예측</span>
                <span className="sm:hidden">AI</span>
              </TabsTrigger>
              <TabsTrigger value="health" className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm">
                <Heart className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">건강 모니터링</span>
                <span className="sm:hidden">건강</span>
              </TabsTrigger>
              <TabsTrigger value="chat" className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm">
                <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">소통</span>
                <span className="sm:hidden">채팅</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm">
                <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">설정</span>
                <span className="sm:hidden">설정</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="safety" className="space-y-6">
              {renderSafetyDashboard()}
            </TabsContent>

            <TabsContent value="ai-prediction" className="space-y-6">
              <AIRiskPrediction />
            </TabsContent>

            <TabsContent value="health" className="space-y-6">
              <div className="space-y-6">
                <AutoHealthMonitoring />
                <HealthMonitoring />
              </div>
            </TabsContent>

            <TabsContent value="chat" className="space-y-6">
              <RealTimeChat />
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <LocationSettings />
            </TabsContent>
          </Tabs>
        )}

        {/* 기본 사용자 또는 프로필이 없는 경우 */}
        {(!userProfile || userProfile.user_type === 'worker') && !userProfile && renderSafetyDashboard()}
      </div>
    </div>
  );

  function renderSafetyDashboard() {
    return (
      <>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 실시간 안전 알림 */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  <span>실시간 안전 알림</span>
                </CardTitle>
                <CardDescription>
                  최신 안전 정보와 주의사항을 확인하세요
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {alerts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    현재 활성화된 안전 알림이 없습니다.
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <Alert key={alert.id} className="border-l-4 border-l-orange-500">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge className={getSeverityColor(alert.severity_level)}>
                              {getSeverityText(alert.severity_level)}
                            </Badge>
                            <Badge variant="outline">{alert.target_industry}</Badge>
                            <span className="text-sm text-gray-500 flex items-center">
                              <MapPin className="h-3 w-3 mr-1" />
                              {alert.target_region}
                            </span>
                          </div>
                          <h4 className="font-semibold text-gray-900 mb-1">{alert.title_ko}</h4>
                          <AlertDescription className="text-gray-700">
                            {alert.content_ko}
                          </AlertDescription>
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(alert.created_at).toLocaleString('ko-KR')}
                          </p>
                        </div>
                      </div>
                    </Alert>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* 위험 예측 */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Thermometer className="h-5 w-5 text-blue-500" />
                  <span>위험 예측</span>
                </CardTitle>
                <CardDescription>
                  향후 3일간 위험도 예측
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {predictions.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    예측 데이터가 없습니다.
                  </div>
                ) : (
                  predictions.map((prediction) => (
                    <div key={prediction.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getRiskIcon(prediction.risk_level)}
                          <span className="font-medium">{prediction.region}</span>
                        </div>
                        <Badge className={getSeverityColor(prediction.risk_level)}>
                          위험도 {prediction.risk_level}
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-gray-600">
                        <p className="mb-2">{new Date(prediction.prediction_date).toLocaleDateString('ko-KR')}</p>
                        
                        {prediction.weather_factors && (
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex items-center">
                              <Thermometer className="h-3 w-3 mr-1" />
                              {prediction.weather_factors.temperature}°C
                            </div>
                            <div className="flex items-center">
                              <Wind className="h-3 w-3 mr-1" />
                              {prediction.weather_factors.wind_speed}m/s
                            </div>
                          </div>
                        )}
                      </div>

                      {prediction.safety_recommendations?.ko && (
                        <div className="text-xs bg-gray-50 p-2 rounded">
                          <p className="font-medium mb-1">권장사항:</p>
                          <p>{prediction.safety_recommendations.ko}</p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 빠른 액션 버튼들 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 긴급 신고 */}
          <Dialog open={showEmergencyDialog} onOpenChange={setShowEmergencyDialog}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                className="stable-button h-16 sm:h-20 flex flex-col items-center justify-center space-y-2 touch-target"
              >
                <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-red-500" />
                <span className="text-sm sm:text-base">긴급 신고</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>긴급 상황 신고</DialogTitle>
                <DialogDescription>
                  긴급상황을 신고하면 즉시 관련 담당자에게 알림이 전송됩니다.
                </DialogDescription>
              </DialogHeader>
              <EmergencyReport 
                onReportSubmitted={() => setShowEmergencyDialog(false)}
                onClose={() => setShowEmergencyDialog(false)}
              />
            </DialogContent>
          </Dialog>
          
          {/* 데이터 새로고침 */}
          <Button 
            variant="outline" 
            className="stable-button h-16 sm:h-20 flex flex-col items-center justify-center space-y-2 touch-target"
            onClick={fetchDashboardData}
            disabled={refreshing}
          >
            <Clock className={`h-5 w-5 sm:h-6 sm:w-6 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="text-sm sm:text-base">
              {refreshing ? '새로고침 중...' : '데이터 새로고침'}
            </span>
          </Button>
          
          {/* 지역 설정 */}
          <Dialog open={showLocationDialog} onOpenChange={setShowLocationDialog}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                className="stable-button h-16 sm:h-20 flex flex-col items-center justify-center space-y-2 touch-target"
              >
                <MapPin className="h-5 w-5 sm:h-6 sm:w-6" />
                <span className="text-sm sm:text-base">지역 설정</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>지역 및 알림 설정</DialogTitle>
                <DialogDescription>
                  작업 지역과 알림 설정을 관리합니다.
                </DialogDescription>
              </DialogHeader>
              <LocationSettings onClose={() => setShowLocationDialog(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </>
    );
  }
};

export default Dashboard;