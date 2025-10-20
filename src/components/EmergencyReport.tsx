import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { AlertTriangle, MapPin, Phone, Camera, Send } from 'lucide-react';

interface EmergencyReportProps {
  onReportSubmitted?: (reportId: string) => void;
  onClose?: () => void;
}

const EmergencyReport: React.FC<EmergencyReportProps> = ({ onReportSubmitted, onClose }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    emergencyType: '',
    severityLevel: 3,
    title: '',
    description: '',
    contactPhone: '',
    locationDescription: ''
  });

  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          toast({
            title: "위치 확인 완료",
            description: "현재 위치가 확인되었습니다.",
          });
        },
        (error) => {
          console.error('Location error:', error);
          toast({
            title: "위치 확인 실패",
            description: "위치 정보를 가져올 수 없습니다. 수동으로 위치를 입력해주세요.",
            variant: "destructive",
          });
        }
      );
    } else {
      toast({
        title: "위치 서비스 미지원",
        description: "브라우저에서 위치 서비스를 지원하지 않습니다.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.emergencyType || !formData.title || !formData.description) {
      toast({
        title: "입력 오류",
        description: "필수 항목을 모두 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const locationData = {
        coordinates: currentLocation,
        description: formData.locationDescription,
        timestamp: new Date().toISOString()
      };

      const contactInfo = {
        phone: formData.contactPhone,
        email: user?.email
      };

      const { data, error } = await supabase.functions.invoke('emergency_report_2025_10_17_16_02', {
        body: {
          emergencyType: formData.emergencyType,
          severityLevel: formData.severityLevel,
          title: formData.title,
          description: formData.description,
          locationData,
          contactInfo
        }
      });

      if (error) throw error;

      toast({
        title: "긴급 신고 완료",
        description: "긴급 신고가 접수되었습니다. 관련 담당자가 곧 연락드릴 예정입니다.",
      });

      if (onReportSubmitted && data.emergencyReport) {
        onReportSubmitted(data.emergencyReport.id);
      }

      // 폼 초기화
      setFormData({
        emergencyType: '',
        severityLevel: 3,
        title: '',
        description: '',
        contactPhone: '',
        locationDescription: ''
      });
      setCurrentLocation(null);

      if (onClose) {
        onClose();
      }

    } catch (error) {
      console.error('Emergency report error:', error);
      toast({
        title: "신고 실패",
        description: "긴급 신고 처리 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getEmergencyTypeText = (type: string) => {
    switch (type) {
      case 'accident': return '사고';
      case 'health_emergency': return '건강 응급상황';
      case 'weather_danger': return '기상 위험';
      case 'equipment_failure': return '장비 고장';
      case 'other': return '기타';
      default: return type;
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

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-red-600">
          <AlertTriangle className="h-6 w-6" />
          <span>긴급 신고</span>
        </CardTitle>
        <CardDescription>
          긴급상황을 신고하면 즉시 관련 담당자에게 알림이 전송됩니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 긴급상황 유형 */}
          <div className="space-y-2">
            <Label htmlFor="emergency-type">긴급상황 유형 *</Label>
            <Select value={formData.emergencyType} onValueChange={(value) => handleInputChange('emergencyType', value)}>
              <SelectTrigger>
                <SelectValue placeholder="긴급상황 유형을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="accident">사고</SelectItem>
                <SelectItem value="health_emergency">건강 응급상황</SelectItem>
                <SelectItem value="weather_danger">기상 위험</SelectItem>
                <SelectItem value="equipment_failure">장비 고장</SelectItem>
                <SelectItem value="other">기타</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 심각도 */}
          <div className="space-y-2">
            <Label htmlFor="severity">심각도 *</Label>
            <div className="flex items-center space-x-4">
              <Select value={formData.severityLevel.toString()} onValueChange={(value) => handleInputChange('severityLevel', parseInt(value))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - 경미</SelectItem>
                  <SelectItem value="2">2 - 보통</SelectItem>
                  <SelectItem value="3">3 - 주의</SelectItem>
                  <SelectItem value="4">4 - 위험</SelectItem>
                  <SelectItem value="5">5 - 매우위험</SelectItem>
                </SelectContent>
              </Select>
              <div className={`w-4 h-4 rounded ${getSeverityColor(formData.severityLevel)}`}></div>
            </div>
          </div>

          {/* 제목 */}
          <div className="space-y-2">
            <Label htmlFor="title">제목 *</Label>
            <Input
              id="title"
              placeholder="긴급상황을 간단히 요약해주세요"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              required
            />
          </div>

          {/* 상세 설명 */}
          <div className="space-y-2">
            <Label htmlFor="description">상세 설명 *</Label>
            <Textarea
              id="description"
              placeholder="상황을 자세히 설명해주세요. 언제, 어디서, 무엇이, 어떻게 발생했는지 포함해주세요."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={4}
              required
            />
          </div>

          {/* 위치 정보 */}
          <div className="space-y-4">
            <Label>위치 정보</Label>
            <div className="flex items-center space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={getCurrentLocation}
                className="stable-button flex items-center space-x-2"
              >
                <MapPin className="h-4 w-4" />
                <span>현재 위치 확인</span>
              </Button>
              {currentLocation && (
                <span className="text-sm text-green-600">
                  위치 확인됨 ({currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)})
                </span>
              )}
            </div>
            <Input
              placeholder="위치 설명 (예: 3번 농장 북쪽 끝, 2층 작업실 등)"
              value={formData.locationDescription}
              onChange={(e) => handleInputChange('locationDescription', e.target.value)}
            />
          </div>

          {/* 연락처 */}
          <div className="space-y-2">
            <Label htmlFor="contact-phone">연락처</Label>
            <div className="flex items-center space-x-2">
              <Phone className="h-4 w-4 text-gray-500" />
              <Input
                id="contact-phone"
                type="tel"
                placeholder="010-1234-5678"
                value={formData.contactPhone}
                onChange={(e) => handleInputChange('contactPhone', e.target.value)}
              />
            </div>
          </div>

          {/* 주의사항 */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>중요:</strong> 생명이 위험한 응급상황인 경우 119에 먼저 신고하시고, 
              이 시스템은 작업장 내 안전 관리를 위한 보조 수단으로 활용해주세요.
            </AlertDescription>
          </Alert>

          {/* 제출 버튼 */}
          <div className="flex space-x-4">
            <Button
              type="submit"
              disabled={loading}
              className="stable-button flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              <Send className="h-4 w-4 mr-2" />
              {loading ? '신고 중...' : '긴급 신고'}
            </Button>
            {onClose && (
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="stable-button"
              >
                취소
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default EmergencyReport;