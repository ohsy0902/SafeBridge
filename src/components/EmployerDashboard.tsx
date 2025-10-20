import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
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
import { toast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DataVisualization from './DataVisualization';

interface EmployerReport {
  id: string;
  report_type: string;
  report_period_start: string;
  report_period_end: string;
  worker_count: number;
  safety_incidents: number;
  health_alerts: number;
  compliance_score: number;
  report_data: any;
  created_at: string;
}

interface WorkerSummary {
  workerId: string;
  workerName: string;
  averageRiskLevel: number;
  alertCount: number;
  lastAnalysisDate: string | null;
}

const EmployerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<EmployerReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<EmployerReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportType, setReportType] = useState('weekly_safety');

  useEffect(() => {
    if (user) {
      fetchReports();
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
      toast({
        title: "리포트 조회 실패",
        description: "리포트 데이터를 불러올 수 없습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateNewReport = async () => {
    setGeneratingReport(true);
    
    try {
      // 먼저 현재 사용자가 고용주인지 확인
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles_2025_10_13_08_09')
        .select('user_type')
        .eq('user_id', user?.id)
        .single();

      if (profileError || userProfile?.user_type !== 'employer') {
        throw new Error('고용주 권한이 필요합니다.');
      }

      // 리포트 생성 요청
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

      // 리포트 목록 새로고침
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

  const getComplianceColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
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
          {renderOverviewDashboard()}
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          {renderReportsSection()}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <DataVisualization />
        </TabsContent>

        <TabsContent value="workers" className="space-y-6">
          {renderWorkersSection()}
        </TabsContent>
      </Tabs>
    </div>
  );

  function renderOverviewDashboard() {
    return (
      <>
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
      </>
    );
  }

  function renderReportsSection() {
    return (
      <>
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

        {/* 요약 통계 카드 */}
      {selectedReport && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">총 근로자</p>
                  <p className="text-2xl font-bold">{selectedReport.worker_count}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">안전 사고</p>
                  <p className="text-2xl font-bold text-red-600">{selectedReport.safety_incidents}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">건강 경고</p>
                  <p className="text-2xl font-bold text-orange-600">{selectedReport.health_alerts}</p>
                </div>
                <Heart className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">규정 준수율</p>
                  <p className={`text-2xl font-bold ${getComplianceColor(selectedReport.compliance_score)}`}>
                    {selectedReport.compliance_score}%
                  </p>
                </div>
                <Shield className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 리포트 목록 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>리포트 목록</span>
            </CardTitle>
            <CardDescription>생성된 안전 및 건강 리포트</CardDescription>
          </CardHeader>
          <CardContent>
            {reports.length > 0 ? (
              <div className="space-y-3">
                {reports.map((report) => (
                  <div 
                    key={report.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedReport?.id === report.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedReport(report)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm">{getReportTypeText(report.report_type)}</h4>
                      <Badge variant="outline" className="text-xs">
                        {new Date(report.created_at).toLocaleDateString('ko-KR')}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(report.report_period_start).toLocaleDateString('ko-KR')} ~ {' '}
                      {new Date(report.report_period_end).toLocaleDateString('ko-KR')}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-600">근로자 {report.worker_count}명</span>
                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="ghost" className="h-6 px-2">
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">생성된 리포트가 없습니다.</p>
                <Button onClick={generateNewReport} variant="outline" size="sm">
                  첫 번째 리포트 생성
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 상세 리포트 내용 */}
        <div className="lg:col-span-2">
          {selectedReport ? (
            <Card>
              <CardHeader>
                <CardTitle>{getReportTypeText(selectedReport.report_type)}</CardTitle>
                <CardDescription>
                  {new Date(selectedReport.report_period_start).toLocaleDateString('ko-KR')} ~ {' '}
                  {new Date(selectedReport.report_period_end).toLocaleDateString('ko-KR')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 규정 준수율 */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">규정 준수율</span>
                    <span className={`font-bold ${getComplianceColor(selectedReport.compliance_score)}`}>
                      {selectedReport.compliance_score}%
                    </span>
                  </div>
                  <Progress value={selectedReport.compliance_score} className="h-2" />
                </div>

                {/* 위험도 분포 */}
                {selectedReport.report_data?.detailedAnalysis?.riskDistribution && (
                  <div>
                    <h4 className="font-medium mb-3">위험도 분포</h4>
                    <div className="space-y-2">
                      {Object.entries(selectedReport.report_data.detailedAnalysis.riskDistribution).map(([level, count]) => (
                        <div key={level} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded ${getRiskLevelColor(parseInt(level))}`}></div>
                            <span className="text-sm">위험도 {level}</span>
                          </div>
                          <span className="text-sm font-medium">{count as number}명</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 근로자 성과 */}
                {selectedReport.report_data?.detailedAnalysis?.workerPerformance && (
                  <div>
                    <h4 className="font-medium mb-3">근로자 건강 상태</h4>
                    <div className="space-y-2">
                      {selectedReport.report_data.detailedAnalysis.workerPerformance.slice(0, 5).map((worker: WorkerSummary) => (
                        <div key={worker.workerId} className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <p className="font-medium text-sm">{worker.workerName}</p>
                            <p className="text-xs text-gray-500">
                              알림 {worker.alertCount}회
                              {worker.lastAnalysisDate && ` • 최근 분석: ${new Date(worker.lastAnalysisDate).toLocaleDateString('ko-KR')}`}
                            </p>
                          </div>
                          <Badge className={getRiskLevelColor(worker.averageRiskLevel)}>
                            위험도 {worker.averageRiskLevel.toFixed(1)}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 권장사항 */}
                {selectedReport.report_data?.detailedAnalysis?.recommendations && (
                  <div>
                    <h4 className="font-medium mb-3">권장사항</h4>
                    <div className="space-y-3">
                      {selectedReport.report_data.detailedAnalysis.recommendations.map((rec: any, index: number) => (
                        <Alert key={index} className={`border-l-4 ${
                          rec.priority === 'critical' ? 'border-l-red-500' :
                          rec.priority === 'high' ? 'border-l-orange-500' :
                          'border-l-yellow-500'
                        }`}>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <strong>{rec.title}</strong>
                                <Badge variant={
                                  rec.priority === 'critical' ? 'destructive' :
                                  rec.priority === 'high' ? 'default' : 'secondary'
                                }>
                                  {rec.priority === 'critical' ? '긴급' :
                                   rec.priority === 'high' ? '높음' : '보통'}
                                </Badge>
                              </div>
                              <p className="text-sm">{rec.description}</p>
                              {rec.actions && (
                                <ul className="text-sm space-y-1">
                                  {rec.actions.map((action: string, actionIndex: number) => (
                                    <li key={actionIndex} className="flex items-center space-x-2">
                                      <CheckCircle className="h-3 w-3 text-green-500" />
                                      <span>{action}</span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">리포트를 선택하여 상세 내용을 확인하세요.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployerDashboard;