import React, { createContext, useContext, useState, useEffect } from 'react';

interface Language {
  code: string;
  name: string;
  nativeName: string;
}

const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia' },
  { code: 'tl', name: 'Filipino', nativeName: 'Filipino' },
  { code: 'uz', name: 'Uzbek', nativeName: 'O\'zbek' },
  { code: 'km', name: 'Khmer', nativeName: 'ខ្មែរ' },
  { code: 'ne', name: 'Nepali', nativeName: 'नेपाली' }
];

interface LanguageContextType {
  currentLanguage: string;
  setLanguage: (language: string) => void;
  supportedLanguages: Language[];
  translate: (text: string, targetLanguage?: string) => Promise<string>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('ko');

  useEffect(() => {
    // Load saved language from localStorage
    const savedLanguage = localStorage.getItem('safebridge-language');
    if (savedLanguage && SUPPORTED_LANGUAGES.find(lang => lang.code === savedLanguage)) {
      setCurrentLanguage(savedLanguage);
    }
  }, []);

  const setLanguage = (language: string) => {
    setCurrentLanguage(language);
    localStorage.setItem('safebridge-language', language);
  };

  const translate = async (text: string, targetLanguage?: string): Promise<string> => {
    const target = targetLanguage || currentLanguage;
    
    if (target === 'ko') {
      return text; // 원본 텍스트가 한국어인 경우
    }

    try {
      // Supabase Edge Function을 통한 번역 요청
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          targetLanguage: target,
          sourceLanguage: 'ko'
        })
      });

      if (!response.ok) {
        throw new Error('Translation failed');
      }

      const result = await response.json();
      return result.translatedText || text;
    } catch (error) {
      console.error('Translation error:', error);
      return text; // 번역 실패 시 원본 텍스트 반환
    }
  };

  const value = {
    currentLanguage,
    setLanguage,
    supportedLanguages: SUPPORTED_LANGUAGES,
    translate,
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};