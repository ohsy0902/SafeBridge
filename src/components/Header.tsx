import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Globe, LogOut, User } from 'lucide-react';

const Header: React.FC = () => {
  const { user, signOut } = useAuth();
  const { currentLanguage, setLanguage, supportedLanguages } = useLanguage();

  return (
    <header className="mobile-header bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* 로고 */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-600 to-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs sm:text-sm">SB</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">SafeBridge</h1>
                <p className="text-xs text-gray-500">ITTA - In Time, To All</p>
              </div>
              <div className="sm:hidden">
                <h1 className="text-sm font-bold text-gray-900">SafeBridge</h1>
              </div>
            </div>
          </div>

          {/* 우측 메뉴 */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* 언어 선택 */}
            <div className="flex items-center space-x-1 sm:space-x-2">
              <Globe className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
              <Select value={currentLanguage} onValueChange={setLanguage}>
                <SelectTrigger className="w-20 sm:w-32 h-8 sm:h-10 text-xs sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {supportedLanguages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code} className="text-xs sm:text-sm">
                      {lang.nativeName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 사용자 정보 */}
            {user && (
              <div className="flex items-center space-x-1 sm:space-x-3">
                <div className="hidden sm:flex items-center space-x-2 text-sm">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-700 truncate max-w-32">{user.email}</span>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={signOut}
                  className="stable-button flex items-center space-x-1 h-8 sm:h-10 px-2 sm:px-3"
                >
                  <LogOut className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline text-xs sm:text-sm">로그아웃</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;