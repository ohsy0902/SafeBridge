import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { 
  Heart, 
  Activity, 
  Thermometer, 
  Droplets, 
  Battery,
  Smartphone,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Play,
  Pause
} from 'lucide-react';

interface HealthData {
  heart_rate: number;
  blood_pressure: {
    systolic: number;
    diastolic: number;
  };
  body_temperature: number;
  steps: number;
  sleep_hours: number;
  stress_level: number;
  hydration_level: number;
  oxygen_saturation: number;
  skin_temperature: number;
}

interface DeviceInfo {
  deviceId: string;
  deviceType: string;
  batteryLevel: number;
  connectionStatus: string;
  lastSync: string;
}

const AutoHealthMonitoring: React.FC = () => {
  const { user } = useAuth();
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [riskLevel, setRiskLevel] = useState<number>(0);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [loading, setLoading] = useState(false);
  const [healthHistory, setHealthHistory] = useState<any[]>([]);
  const [autoMeasureInterval, setAutoMeasureInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (user) {
      loadHealthHistory();
    }
    
    return () => {
      if (autoMeasureInterval) {
        clearInterval(autoMeasureInterval);
      }
    };
  }, [user]);

  const loadHealthHistory = async () => {
    try {
      const { data, error } = await supabase.functions.invoke(
        'wearable_health_simulation_2025_10_19_15_50',
        {
          body: {
            userId: user?.id,
            action: 'get_history'
          }
        }
      );

      if (error) {
        console.error('Health history error:', error);
      } else if (data?.success) {
        setHealthHistory(data.healthHistory || []);
        if (data.healthHistory && data.healthHistory.length > 0) {
          setHealthData(data.healthHistory[0].health_metrics);
          setRiskLevel(data.healthHistory[0].risk_level);
        }
      }
    } catch (error) {
      console.error('Load health history error:', error);
    }
  };

  const startWearableConnection = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        'wearable_health_simulation_2025_10_19_15_50',
        {
          body: {
            userId: user?.id,
            action: 'start_monitoring'
          }
        }
      );

      if (error) {
        console.error('Wearable connection error:', error);
        toast({
          title: "연결 실패",
          description: "웨어러블 기기 연결에 실패했습니다.",
          variant: "destructive",
        });
      } else if (data?.success) {
        setDeviceInfo(data.device);
        setIsMonitoring(true);
        
        toast({
          title: "기기 연결 완료",
          description: data.message,
        });

        // 자동 측정 시작 (30초마다)
        const interval = setInterval(() => {
          performAutoMeasurement();
        }, 30000);
        setAutoMeasureInterval(interval);
      }
    } catch (error) {
      console.error('Wearable connection error:', error);
    } finally {
      setLoading(false);
    }
  };

  const stopMonitoring = () => {
    if (autoMeasureInterval) {
      clearInterval(autoMeasureInterval);
      setAutoMeasureInterval(null);
    }
    setIsMonitoring(false);
    setDeviceInfo(null);
    
    toast({
      title: "모니터링 중단",
      description: "자동 건강 측정이 중단되었습니다.",
    });
  };

  const performAutoMeasurement = async () => {
    try {
      const { data, error } = await supabase.functions.invoke(
        'wearable_health_simulation_2025_10_19_15_50',
        {
          body: {
            userId: user?.id,
            action: 'auto_measure'
          }
        }
      );

      if (error) {
        console.error('Auto measurement error:', error);
      } else if (data?.success) {
        setHealthData(data.healthData);
        setRiskLevel(data.riskLevel);
        setRecommendations(data.riskAnalysis?.recommendations || []);
        
        // 히스토리 업데이트
        await loadHealthHistory();

        // 위험도가 높은 경우 알림
        if (data.alerts && data.alerts.length > 0) {
          data.alerts.forEach((alert: any) => {
            toast({
              title: alert.title,
              description: alert.message,
              variant: alert.severity === 'high' ? 'destructive' : 'default',
            });
          });
        }
      }
    } catch (error) {
      console.error('Auto measurement error:', error);
    }
  };

  const manualMeasurement = async () => {
    setLoading(true);
    await performAutoMeasurement();
    setLoading(false);
  };

  const getRiskLevelColor = (level: number) => {
    if (level >= 4) return 'bg-red-500';
    if (level >= 3) return 'bg-orange-500';
    if (level >= 2) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getRiskLevelText = (level: number) => {
    if (level >= 4) return '위험';
    if (level >= 3) return '주의';
    if (level >= 2) return '보통';
    return '양호';
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <TrendingUp className="h-4 w-4 text-red-500" />;
    if (current < previous) return <TrendingDown className="h-4 w-4 text-green-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  return (
    <div className="space-y-6">
      {/* 웨어러블 기기 연결 상태 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Smartphone className="h-5 w-5" />
            <span>웨어러블 기기 연결</span>
          </CardTitle>
          <CardDescription>
            스마트워치나 피트니스 트래커를 연결하여 자동 건강 모니터링을 시작하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isMonitoring ? (
            <div className="text-center py-6">
              <Button 
                onClick={startWearableConnection} 
                disabled={loading}
                className="stable-button"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                웨어러블 기기 연결
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <div>
                    <p className="font-medium">{deviceInfo?.deviceType || 'SmartWatch'}</p>
                    <p className="text-sm text-gray-500">기기 ID: {deviceInfo?.deviceId}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <Battery className="h-4 w-4" />
                    <span className="text-sm">{deviceInfo?.batteryLevel}%</span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={stopMonitoring}
                    className="stable-button"
                  >
                    <Pause className="h-4 w-4 mr-1" />
                    중단
                  </Button>
                </div>
              </div>
              
              <div className="text-center">
                <Button 
                  onClick={manualMeasurement} 
                  disabled={loading}
                  variant="outline"
                  className="stable-button"
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Activity className="h-4 w-4 mr-2" />
                  )}
                  수동 측정
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 현재 건강 상태 */}
      {healthData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>실시간 건강 상태</span>
              <Badge className={getRiskLevelColor(riskLevel)}>
                {getRiskLevelText(riskLevel)} ({riskLevel.toFixed(1)}/5)
              </Badge>
            </CardTitle>
            <CardDescription>
              마지막 측정: {new Date().toLocaleString('ko-KR')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <Heart className="h-8 w-8 text-red-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{healthData.heart_rate}</p>
                <p className="text-sm text-gray-500">심박수 (bpm)</p>
                {healthHistory.length > 1 && getTrendIcon(
                  healthData.heart_rate, 
                  healthHistory[1]?.health_metrics?.heart_rate || healthData.heart_rate
                )}
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <Activity className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">
                  {healthData.blood_pressure.systolic}/{healthData.blood_pressure.diastolic}
                </p>
                <p className="text-sm text-gray-500">혈압 (mmHg)</p>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <Thermometer className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{healthData.body_temperature}°C</p>
                <p className="text-sm text-gray-500">체온</p>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <Droplets className="h-8 w-8 text-cyan-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{healthData.hydration_level}%</p>
                <p className="text-sm text-gray-500">수분 수준</p>
              </div>
            </div>

            {/* 추가 건강 지표 */}
            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">스트레스 수준</span>
                    <span className="text-sm">{healthData.stress_level}/5</span>
                  </div>
                  <Progress value={healthData.stress_level * 20} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">산소포화도</span>
                    <span className="text-sm">{healthData.oxygen_saturation}%</span>
                  </div>
                  <Progress value={healthData.oxygen_saturation} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">오늘 걸음수</span>
                    <span className="text-sm">{healthData.steps.toLocaleString()}</span>
                  </div>
                  <Progress value={Math.min((healthData.steps / 10000) * 100, 100)} className="h-2" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 건강 권고사항 */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <span>건강 권고사항</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recommendations.map((recommendation, index) => (
                <Alert key={index}>
                  <AlertDescription>{recommendation}</AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 건강 히스토리 */}
      {healthHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>건강 데이터 히스토리</CardTitle>
            <CardDescription>최근 24시간 건강 측정 기록</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {healthHistory.slice(0, 5).map((record, index) => (
                <div key={record.id || index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <p className="text-sm font-medium">
                        {new Date(record.recorded_at).toLocaleTimeString('ko-KR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(record.recorded_at).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">심박수: </span>
                        <span className="font-medium">{record.health_metrics.heart_rate}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">체온: </span>
                        <span className="font-medium">{record.health_metrics.body_temperature}°C</span>
                      </div>
                      <div>
                        <span className="text-gray-500">수분: </span>
                        <span className="font-medium">{record.health_metrics.hydration_level}%</span>
                      </div>
                    </div>
                  </div>
                  <Badge className={getRiskLevelColor(record.risk_level)}>
                    {getRiskLevelText(record.risk_level)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AutoHealthMonitoring;