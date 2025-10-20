# SafeBridge 아키텍처 문서

## 🏗 시스템 아키텍처

SafeBridge는 현대적인 웹 기술 스택을 기반으로 한 다국어 재난안전 플랫폼입니다.

## 📊 전체 구조도

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │  External APIs  │
│   (React)       │◄──►│  (Supabase)     │◄──►│  (Translation,  │
│                 │    │                 │    │   Weather, etc) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🎨 Frontend 아키텍처

### 기술 스택
- **React 18**: 컴포넌트 기반 UI 라이브러리
- **TypeScript**: 타입 안전성 보장
- **Tailwind CSS**: 유틸리티 기반 스타일링
- **Shadcn/ui**: 재사용 가능한 UI 컴포넌트
- **Recharts**: 데이터 시각화

### 폴더 구조
```
src/
├── components/          # 재사용 가능한 컴포넌트
│   ├── ui/             # 기본 UI 컴포넌트
│   ├── Dashboard.tsx   # 메인 대시보드
│   ├── AuthPage.tsx    # 인증 페이지
│   └── ...
├── contexts/           # React Context
│   ├── AuthContext.tsx # 인증 상태 관리
│   └── LanguageContext.tsx # 다국어 상태 관리
├── hooks/              # 커스텀 훅
├── integrations/       # 외부 서비스 통합
│   └── supabase/       # Supabase 클라이언트
├── pages/              # 페이지 컴포넌트
└── types/              # TypeScript 타입 정의
```

### 상태 관리
- **React Context**: 전역 상태 관리 (인증, 언어)
- **useState/useEffect**: 로컬 상태 관리
- **Supabase Realtime**: 실시간 데이터 동기화

## 🔧 Backend 아키텍처

### Supabase 구성요소
- **PostgreSQL**: 메인 데이터베이스
- **Edge Functions**: 서버리스 백엔드 로직
- **Real-time**: 실시간 데이터 구독
- **Auth**: 사용자 인증 및 권한 관리
- **Storage**: 파일 저장소

### 데이터베이스 스키마

#### 핵심 테이블
```sql
-- 사용자 프로필
user_profiles_2025_10_13_08_09
├── user_id (UUID, FK)
├── user_type (TEXT) -- 'worker' | 'employer'
├── preferred_language (TEXT)
├── workplace_info (JSONB)
└── created_at (TIMESTAMP)

-- 안전 알림
safety_alerts_2025_10_13_08_09
├── id (UUID, PK)
├── alert_type (TEXT)
├── severity_level (INTEGER)
├── message (TEXT)
├── target_users (TEXT[])
└── created_at (TIMESTAMP)

-- 건강 데이터
health_data_2025_10_17_15_24
├── id (UUID, PK)
├── user_id (UUID, FK)
├── health_metrics (JSONB)
├── risk_level (NUMERIC)
└── recorded_at (TIMESTAMP)
```

### Edge Functions

#### 주요 함수들
1. **translate_text_2025_10_13_08_09**: 다국어 번역 서비스
2. **weather_prediction_2025_10_13_08_09**: 기상 데이터 수집 및 예측
3. **ai_risk_prediction_2025_10_17_16_02**: AI 기반 리스크 예측
4. **emergency_report_2025_10_17_16_02**: 긴급 신고 처리
5. **generate_employer_report_2025_10_17_15_24**: 고용주 리포트 생성

## 🔐 보안 아키텍처

### Row Level Security (RLS)
```sql
-- 사용자는 자신의 데이터만 접근 가능
CREATE POLICY "Users can view own profile" ON user_profiles_2025_10_13_08_09
FOR SELECT USING (auth.uid() = user_id);

-- 고용주는 자신의 근로자 데이터만 접근 가능
CREATE POLICY "Employers can view their workers" ON health_data_2025_10_17_15_24
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_profiles_2025_10_13_08_09 
    WHERE user_id = auth.uid() AND user_type = 'employer'
  )
);
```

### API 키 관리
- **Supabase Secrets**: 민감한 API 키 저장
- **Environment Variables**: 공개 키 및 설정값
- **Edge Functions**: 서버 사이드에서 API 호출

## 🌐 다국어 아키텍처

### 번역 시스템
```typescript
// 번역 캐시 구조
interface TranslationCache {
  source_text: string;
  target_language: string;
  translated_text: string;
  confidence_score: number;
  cached_at: timestamp;
}
```

### 지원 언어
- 한국어 (ko)
- 영어 (en)
- 중국어 (zh)
- 베트남어 (vi)
- 태국어 (th)
- 필리핀어 (fil)
- 인도네시아어 (id)
- 네팔어 (ne)
- 캄보디아어 (km)
- 미얀마어 (my)

## 📱 모바일 최적화

### 반응형 디자인
```css
/* Tailwind CSS 브레이크포인트 */
sm: 640px   /* 모바일 */
md: 768px   /* 태블릿 */
lg: 1024px  /* 데스크톱 */
xl: 1280px  /* 대형 화면 */
```

### PWA 기능
- Service Worker
- 오프라인 지원
- 앱 설치 가능
- 푸시 알림

## 🔄 실시간 기능

### Supabase Realtime
```typescript
// 실시간 알림 구독
const subscription = supabase
  .channel('safety_alerts')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'safety_alerts_2025_10_13_08_09'
  }, (payload) => {
    // 새로운 알림 처리
  })
  .subscribe();
```

## 📊 모니터링 및 로깅

### 성능 모니터링
- Supabase Dashboard
- Edge Function 로그
- 클라이언트 사이드 에러 추적

### 로깅 전략
```typescript
// 구조화된 로깅
console.log({
  level: 'info',
  message: 'User action',
  userId: user.id,
  action: 'emergency_report',
  timestamp: new Date().toISOString()
});
```

## 🚀 배포 아키텍처

### CI/CD 파이프라인
```yaml
# GitHub Actions 워크플로우
name: Deploy SafeBridge
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
      - name: Install dependencies
        run: npm install
      - name: Build
        run: npm run build
      - name: Deploy
        run: npm run deploy
```

### 환경 분리
- **Development**: 로컬 개발 환경
- **Staging**: 테스트 환경
- **Production**: 운영 환경

## 🔮 확장성 고려사항

### 수평 확장
- Supabase 자동 스케일링
- Edge Functions 무제한 확장
- CDN을 통한 정적 자산 배포

### 성능 최적화
- 코드 스플리팅
- 이미지 최적화
- 캐싱 전략
- 데이터베이스 인덱싱

이 아키텍처는 SafeBridge의 확장성, 보안성, 성능을 보장하며 다국어 환경에서의 안정적인 서비스 제공을 목표로 설계되었습니다.