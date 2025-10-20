import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DataVisualization from './DataVisualization';
import { 
  Users, 
  AlertTriangle, 
  TrendingUp, 
  FileText, 
  Download,
  BarChart3,
  Shield,
  Heart,
  Clock,
  CheckCircle,
  RefreshCw
} from 'lucide-react';

interface EmployerReport {
  id: string;
  report_type: string;
  report_period_start: string;
  report_period_end: string;
  worker_count: number;
  overall_risk_score: number;
  compliance_score: number;
  total_workers: number;
  created_at: string;
}

interface WorkerStats {
  totalWorkers: number;
  activeAlerts: number;
  avgSafetyScore: number;
  monthlyIncidents: number;
}

interface RecentActivity {
  type: string;
  description: string;
  timestamp: string;
}

const EmployerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<EmployerReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<EmployerReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportType, setReportType] = useState('weekly_safety');
  const [workerStats, setWorkerStats] = useState<WorkerStats>({
    totalWorkers: 0,
    activeAlerts: 0,
    avgSafetyScore: 0,
    monthlyIncidents: 0
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);

  useEffect(() => {
    if (user) {
      fetchReports();
      fetchWorkerStats();
      fetchRecentActivities();
    }
  }, [user]);

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('employer_reports_2025_10_17_15_24')
        .select('*')
        .eq('employer_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setReports(data || []);
      
      if (data && data.length > 0) {
        setSelectedReport(data[0]);
      }
    } catch (error) {
      console.error('Reports fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkerStats = async () => {
    try {
      // 실제 구현에서는 근로자 통계를 조회
      setWorkerStats({
        totalWorkers: 25,
        activeAlerts: 3,
        avgSafetyScore: 4.2,
        monthlyIncidents: 1
      });
    } catch (error) {
      console.error('Worker stats fetch error:', error);
    }
  };

  const fetchRecentActivities = async () => {
    try {
      // 실제 구현에서는 최근 활동을 조회
      setRecentActivities([
        {
          type: 'alert',
          description: '폭염 주의보 발령 - 작업 시간 단축 권고',
          timestamp: '2시간 전'
        },
        {
          type: 'health',
          description: '김철수 근로자 건강 검진 완료',
          timestamp: '4시간 전'
        },
        {
          type: 'safety',
          description: '안전 교육 프로그램 완료 (참여율 95%)',
          timestamp: '1일 전'
        }
      ]);
    } catch (error) {
      console.error('Recent activities fetch error:', error);
    }
  };

  const generateNewReport = async () => {
    setGeneratingReport(true);
    
    try {
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles_2025_10_13_08_09')
        .select('user_type')
        .eq('user_id', user?.id)
        .single();

      if (profileError || userProfile?.user_type !== 'employer') {
        throw new Error('고용주 권한이 필요합니다.');
      }

      const { data, error } = await supabase.functions.invoke('generate_employer_report_2025_10_17_15_24', {
        body: {
          employerId: user?.id,
          reportType: reportType
        }
      });

      if (error) {
        console.error('Report generation error details:', error);
        throw new Error(error.message || '리포트 생성에 실패했습니다.');
      }

      toast({
        title: "리포트 생성 완료",
        description: `${getReportTypeText(reportType)}가 성공적으로 생성되었습니다.`,
      });

      await fetchReports();
      
    } catch (error) {
      console.error('Report generation error:', error);
      toast({
        title: "리포트 생성 실패",
        description: error.message || "리포트 생성 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setGeneratingReport(false);
    }
  };

  const getReportTypeText = (type: string) => {
    switch (type) {
      case 'weekly_safety': return '주간 안전 리포트';
      case 'monthly_health': return '월간 건강 리포트';
      case 'quarterly_performance': return '분기별 성과 리포트';
      default: return type;
    }
  };

  const getRiskLevelColor = (level: number) => {
    switch (Math.round(level)) {
      case 5: return 'bg-red-500';
      case 4: return 'bg-orange-500';
      case 3: return 'bg-yellow-500';
      case 2: return 'bg-blue-500';
      default: return 'bg-green-500';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">고용주 대시보드</h2>
          <p className="text-gray-600">근로자 안전 관리 및 리포트 현황</p>
        </div>
        <Button
          onClick={fetchReports}
          disabled={loading}
          className="stable-button flex items-center space-x-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>새로고침</span>
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">개요</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">리포트</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">분석</span>
          </TabsTrigger>
          <TabsTrigger value="workers" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">근로자</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* 통계 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">총 근로자</p>
                    <p className="text-2xl font-bold">{workerStats.totalWorkers}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">활성 알림</p>
                    <p className="text-2xl font-bold">{workerStats.activeAlerts}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">평균 안전 점수</p>
                    <p className="text-2xl font-bold">{workerStats.avgSafetyScore}/5</p>
                  </div>
                  <Shield className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">이번 달 사고</p>
                    <p className="text-2xl font-bold">{workerStats.monthlyIncidents}</p>
                  </div>
                  <Heart className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 최근 활동 */}
          <Card>
            <CardHeader>
              <CardTitle>최근 활동</CardTitle>
              <CardDescription>근로자들의 최근 안전 관련 활동</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
                    <div className={`w-3 h-3 rounded-full ${
                      activity.type === 'emergency' ? 'bg-red-500' :
                      activity.type === 'alert' ? 'bg-orange-500' :
                      activity.type === 'health' ? 'bg-blue-500' : 'bg-green-500'
                    }`} />
                    <div className="flex-1">
                      <p className="font-medium">{activity.description}</p>
                      <p className="text-sm text-gray-500">{activity.timestamp}</p>
                    </div>
                    <Badge variant={activity.type === 'emergency' ? 'destructive' : 'secondary'}>
                      {activity.type}
                    </Badge>
                  </div>
                ))}
                {recentActivities.length === 0 && (
                  <p className="text-center text-gray-500 py-8">최근 활동이 없습니다.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          {/* 리포트 생성 */}
          <Card>
            <CardHeader>
              <CardTitle>리포트 생성</CardTitle>
              <CardDescription>안전 및 건강 관련 리포트를 생성합니다</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly_safety">주간 안전 리포트</SelectItem>
                    <SelectItem value="monthly_health">월간 건강 리포트</SelectItem>
                    <SelectItem value="quarterly_performance">분기별 성과 리포트</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  onClick={generateNewReport} 
                  disabled={generatingReport}
                  className="stable-button flex items-center space-x-2"
                >
                  <FileText className="h-4 w-4" />
                  <span>{generatingReport ? '생성 중...' : '리포트 생성'}</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 기존 리포트 목록 */}
          <Card>
            <CardHeader>
              <CardTitle>생성된 리포트</CardTitle>
              <CardDescription>최근 생성된 리포트 목록</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reports.map((report) => (
                  <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <FileText className="h-8 w-8 text-blue-500" />
                      <div>
                        <h4 className="font-medium">{getReportTypeText(report.report_type)}</h4>
                        <p className="text-sm text-gray-500">
                          생성일: {new Date(report.created_at).toLocaleDateString('ko-KR')}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge className={getRiskLevelColor(report.overall_risk_score)} variant="secondary">
                            위험도: {report.overall_risk_score}/5
                          </Badge>
                          <Badge variant="outline">
                            {report.total_workers}명 대상
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" className="stable-button">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {reports.length === 0 && (
                  <p className="text-center text-gray-500 py-8">생성된 리포트가 없습니다.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <DataVisualization />
        </TabsContent>

        <TabsContent value="workers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>근로자 관리</CardTitle>
              <CardDescription>등록된 근로자들의 안전 상태를 모니터링합니다</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center py-8">
                  <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">근로자 관리</h3>
                  <p className="text-gray-500 mb-6">
                    근로자별 안전 상태와 건강 정보를 확인할 수 있습니다.
                  </p>
                  <Button className="stable-button">
                    근로자 목록 보기
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EmployerDashboard;