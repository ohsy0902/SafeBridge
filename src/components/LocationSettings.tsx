import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { MapPin, Plus, Trash2, Save, Navigation } from 'lucide-react';

interface LocationSettingsProps {
  onClose?: () => void;
}

interface LocationSetting {
  id?: string;
  user_id: string;
  primary_location: any;
  secondary_locations: any[];
  notification_radius: number;
  auto_location_update: boolean;
  location_sharing_enabled: boolean;
  emergency_contacts: any[];
}

const LocationSettings: React.FC<LocationSettingsProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<LocationSetting>({
    user_id: user?.id || '',
    primary_location: { region: '', address: '', coordinates: null },
    secondary_locations: [],
    notification_radius: 10,
    auto_location_update: true,
    location_sharing_enabled: false,
    emergency_contacts: []
  });

  const [newSecondaryLocation, setNewSecondaryLocation] = useState({ region: '', address: '' });
  const [newEmergencyContact, setNewEmergencyContact] = useState({ name: '', phone: '', relation: '' });

  useEffect(() => {
    if (user) {
      fetchLocationSettings();
    }
  }, [user]);

  const fetchLocationSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('user_location_settings_2025_10_17_16_02')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error('Location settings fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    setLoading(true);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          try {
            // 자동 위치 감지 Edge Function 호출
            const { data, error } = await supabase.functions.invoke(
              'auto_location_detection_2025_10_19_15_45',
              {
                body: {
                  userId: user?.id,
                  latitude,
                  longitude
                }
              }
            );

            if (error) {
              console.error('Auto location detection error:', error);
              // 기본 위치 설정
              const coordinates = { lat: latitude, lng: longitude };
              setSettings(prev => ({
                ...prev,
                primary_location: {
                  ...prev.primary_location,
                  coordinates,
                  address: `위도: ${latitude.toFixed(4)}, 경도: ${longitude.toFixed(4)}`
                }
              }));
              
              toast({
                title: "위치 확인 완료",
                description: "현재 위치가 설정되었습니다.",
              });
            } else if (data?.success) {
              // 자동으로 감지된 위치 정보 설정
              setSettings(prev => ({
                ...prev,
                primary_location: {
                  address: data.location.address,
                  coordinates: data.location.coordinates,
                  workplace: data.location.workplace
                }
              }));
              
              toast({
                title: "위치 감지 완료",
                description: `현재 위치: ${data.location.address}`,
              });

              // 위치 기반 알림이 있다면 표시
              if (data.alerts && data.alerts.length > 0) {
                data.alerts.forEach((alert: any) => {
                  toast({
                    title: alert.title,
                    description: alert.message,
                    variant: alert.priority === 'high' ? 'destructive' : 'default',
                  });
                });
              }
            }
          } catch (error) {
            console.error('Location processing error:', error);
            // 기본 위치 설정
            const coordinates = { lat: latitude, lng: longitude };
            setSettings(prev => ({
              ...prev,
              primary_location: {
                ...prev.primary_location,
                coordinates,
                address: `위도: ${latitude.toFixed(4)}, 경도: ${longitude.toFixed(4)}`
              }
            }));
            
            toast({
              title: "위치 확인 완료",
              description: "현재 위치가 설정되었습니다.",
            });
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          toast({
            title: "위치 접근 오류",
            description: "위치 서비스를 사용할 수 없습니다. 브라우저 설정을 확인해주세요.",
            variant: "destructive",
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    } else {
      toast({
        title: "위치 서비스 미지원",
        description: "이 브라우저는 위치 서비스를 지원하지 않습니다.",
        variant: "destructive",
      });
    }
    
    setLoading(false);
  };

  const addSecondaryLocation = () => {
    if (!newSecondaryLocation.region || !newSecondaryLocation.address) {
      toast({
        title: "입력 오류",
        description: "지역과 주소를 모두 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    setSettings(prev => ({
      ...prev,
      secondary_locations: [...prev.secondary_locations, { ...newSecondaryLocation, id: Date.now() }]
    }));

    setNewSecondaryLocation({ region: '', address: '' });
  };

  const removeSecondaryLocation = (index: number) => {
    setSettings(prev => ({
      ...prev,
      secondary_locations: prev.secondary_locations.filter((_, i) => i !== index)
    }));
  };

  const addEmergencyContact = () => {
    if (!newEmergencyContact.name || !newEmergencyContact.phone) {
      toast({
        title: "입력 오류",
        description: "이름과 전화번호를 모두 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    setSettings(prev => ({
      ...prev,
      emergency_contacts: [...prev.emergency_contacts, { ...newEmergencyContact, id: Date.now() }]
    }));

    setNewEmergencyContact({ name: '', phone: '', relation: '' });
  };

  const removeEmergencyContact = (index: number) => {
    setSettings(prev => ({
      ...prev,
      emergency_contacts: prev.emergency_contacts.filter((_, i) => i !== index)
    }));
  };

  const saveSettings = async () => {
    setSaving(true);

    try {
      const { data, error } = await supabase
        .from('user_location_settings_2025_10_17_16_02')
        .upsert({
          ...settings,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "설정 저장 완료",
        description: "지역 및 알림 설정이 저장되었습니다.",
      });

      if (onClose) {
        onClose();
      }

    } catch (error) {
      console.error('Settings save error:', error);
      toast({
        title: "저장 실패",
        description: "설정 저장에 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">설정을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto">
      {/* 주 작업 지역 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="h-5 w-5" />
            <span>주 작업 지역</span>
          </CardTitle>
          <CardDescription>주로 작업하는 지역을 설정합니다</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primary-region">지역</Label>
              <Input
                id="primary-region"
                placeholder="예: 경기도 화성시"
                value={settings.primary_location.region}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  primary_location: { ...prev.primary_location, region: e.target.value }
                }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="primary-address">상세 주소</Label>
              <Input
                id="primary-address"
                placeholder="예: 농장 A동 3번지"
                value={settings.primary_location.address}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  primary_location: { ...prev.primary_location, address: e.target.value }
                }))}
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={getCurrentLocation}
              className="stable-button flex items-center space-x-2"
            >
              <Navigation className="h-4 w-4" />
              <span>현재 위치 확인</span>
            </Button>
            {settings.primary_location.coordinates && (
              <Badge variant="outline" className="text-green-600">
                위치 확인됨
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 보조 작업 지역 */}
      <Card>
        <CardHeader>
          <CardTitle>보조 작업 지역</CardTitle>
          <CardDescription>추가로 작업하는 지역들을 설정합니다</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {settings.secondary_locations.map((location, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{location.region}</p>
                  <p className="text-sm text-gray-500">{location.address}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSecondaryLocation(index)}
                  className="stable-button text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <Input
              placeholder="지역"
              value={newSecondaryLocation.region}
              onChange={(e) => setNewSecondaryLocation(prev => ({ ...prev, region: e.target.value }))}
            />
            <Input
              placeholder="주소"
              value={newSecondaryLocation.address}
              onChange={(e) => setNewSecondaryLocation(prev => ({ ...prev, address: e.target.value }))}
            />
            <Button
              onClick={addSecondaryLocation}
              className="stable-button flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>추가</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 알림 설정 */}
      <Card>
        <CardHeader>
          <CardTitle>알림 설정</CardTitle>
          <CardDescription>위치 기반 알림 설정을 관리합니다</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notification-radius">알림 반경 (km)</Label>
            <Input
              id="notification-radius"
              type="number"
              min="1"
              max="50"
              value={settings.notification_radius}
              onChange={(e) => setSettings(prev => ({ ...prev, notification_radius: parseInt(e.target.value) || 10 }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-location">자동 위치 업데이트</Label>
              <p className="text-sm text-gray-500">위치가 변경될 때 자동으로 업데이트합니다</p>
            </div>
            <Switch
              id="auto-location"
              checked={settings.auto_location_update}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, auto_location_update: checked }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="location-sharing">위치 공유</Label>
              <p className="text-sm text-gray-500">긴급상황 시 관리자와 위치를 공유합니다</p>
            </div>
            <Switch
              id="location-sharing"
              checked={settings.location_sharing_enabled}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, location_sharing_enabled: checked }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* 긴급 연락처 */}
      <Card>
        <CardHeader>
          <CardTitle>긴급 연락처</CardTitle>
          <CardDescription>긴급상황 시 연락할 사람들을 설정합니다</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {settings.emergency_contacts.map((contact, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{contact.name}</p>
                  <p className="text-sm text-gray-500">{contact.phone} • {contact.relation}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeEmergencyContact(index)}
                  className="stable-button text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            <Input
              placeholder="이름"
              value={newEmergencyContact.name}
              onChange={(e) => setNewEmergencyContact(prev => ({ ...prev, name: e.target.value }))}
            />
            <Input
              placeholder="전화번호"
              value={newEmergencyContact.phone}
              onChange={(e) => setNewEmergencyContact(prev => ({ ...prev, phone: e.target.value }))}
            />
            <Input
              placeholder="관계"
              value={newEmergencyContact.relation}
              onChange={(e) => setNewEmergencyContact(prev => ({ ...prev, relation: e.target.value }))}
            />
            <Button
              onClick={addEmergencyContact}
              className="stable-button flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>추가</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 저장 버튼 */}
      <div className="flex space-x-4">
        <Button
          onClick={saveSettings}
          disabled={saving}
          className="stable-button flex-1 flex items-center space-x-2"
        >
          <Save className="h-4 w-4" />
          <span>{saving ? '저장 중...' : '설정 저장'}</span>
        </Button>
        {onClose && (
          <Button
            variant="outline"
            onClick={onClose}
            className="stable-button"
          >
            취소
          </Button>
        )}
      </div>
    </div>
  );
};

export default LocationSettings;