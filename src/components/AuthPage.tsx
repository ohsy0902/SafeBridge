import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Shield, Users, Globe } from 'lucide-react';

const AuthPage: React.FC = () => {
  const { signIn, signUp } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    userType: 'worker',
    industry: 'agriculture'
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await signIn(formData.email, formData.password);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { data, error } = await signUp(formData.email, formData.password, {
        full_name: formData.fullName,
        user_type: formData.userType
      });

      if (error) throw error;

      // 회원가입 성공 시 프로필 생성
      if (data.user) {
        try {
          const { data: profileData, error: profileError } = await supabase.functions.invoke('create_user_profile_2025_10_17_15_24', {
            body: {
              userId: data.user.id,
              fullName: formData.fullName,
              userType: formData.userType,
              preferredLanguage: 'ko',
              industrySector: formData.industry,
              companyName: formData.userType === 'employer' ? formData.fullName + ' 농장' : undefined
            }
          });

          if (profileError) {
            console.error('Profile creation error:', profileError);
            toast({
              title: "프로필 생성 실패",
              description: "사용자 프로필 생성에 실패했습니다. 로그인 후 프로필을 완성해주세요.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "회원가입 완료",
              description: "프로필이 성공적으로 생성되었습니다. 이메일 인증을 완료해주세요.",
            });
          }
        } catch (profileError) {
          console.error('Profile creation request error:', profileError);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mobile-container min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* 브랜드 소개 섹션 */}
        <div className="flex flex-col justify-center space-y-4 sm:space-y-6">
          <div className="text-center lg:text-left">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              SafeBridge
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 mb-4 sm:mb-6">
              외국인 노동자와 고용주를 위한<br />
              다국어 산업 안전 플랫폼
            </p>
            <p className="text-sm text-gray-500 mb-6 sm:mb-8">
              ITTA - In Time, To All
            </p>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center space-x-3">
              <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              <span className="text-sm sm:text-base text-gray-700">실시간 안전 알림 시스템</span>
            </div>
            <div className="flex items-center space-x-3">
              <Globe className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
              <span className="text-sm sm:text-base text-gray-700">10개 언어 지원</span>
            </div>
            <div className="flex items-center space-x-3">
              <Users className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
              <span className="text-sm sm:text-base text-gray-700">농업/어업 분야 특화</span>
            </div>
          </div>
        </div>

        {/* 로그인/회원가입 폼 */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">SafeBridge 시작하기</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              안전한 작업 환경을 위한 첫 걸음을 시작하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin" className="text-sm sm:text-base">로그인</TabsTrigger>
                <TabsTrigger value="signup" className="text-sm sm:text-base">회원가입</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email" className="text-sm sm:text-base">이메일</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                      className="text-sm sm:text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password" className="text-sm sm:text-base">비밀번호</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      required
                      className="text-sm sm:text-base"
                    />
                  </div>
                  <Button type="submit" className="stable-button w-full touch-target text-sm sm:text-base" disabled={isLoading}>
                    {isLoading ? '로그인 중...' : '로그인'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name" className="text-sm sm:text-base">이름</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="홍길동"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      required
                      className="text-sm sm:text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">이메일</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">비밀번호</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user-type">사용자 유형</Label>
                    <Select value={formData.userType} onValueChange={(value) => handleInputChange('userType', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="사용자 유형을 선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="worker">외국인 노동자</SelectItem>
                        <SelectItem value="employer">고용주/관리자</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="industry">산업 분야</Label>
                    <Select value={formData.industry} onValueChange={(value) => handleInputChange('industry', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="산업 분야를 선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="agriculture">농업</SelectItem>
                        <SelectItem value="fishery">어업</SelectItem>
                        <SelectItem value="manufacturing">제조업</SelectItem>
                        <SelectItem value="construction">건설업</SelectItem>
                        <SelectItem value="service">서비스업</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="stable-button w-full touch-target text-sm sm:text-base" disabled={isLoading}>
                    {isLoading ? '가입 중...' : '회원가입'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthPage;