-- SafeBridge 사용자 프로필 테이블 생성
CREATE TABLE IF NOT EXISTS public.user_profiles_2025_10_13_08_09 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('worker', 'employer')),
    full_name VARCHAR(100) NOT NULL,
    preferred_language VARCHAR(10) NOT NULL DEFAULT 'ko',
    industry_sector VARCHAR(50) NOT NULL DEFAULT 'agriculture',
    company_name VARCHAR(100),
    workplace_location JSONB,
    phone_number VARCHAR(20),
    emergency_contact JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 안전 알림 테이블
CREATE TABLE IF NOT EXISTS public.safety_alerts_2025_10_13_08_09 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_type VARCHAR(50) NOT NULL,
    severity_level INTEGER NOT NULL CHECK (severity_level BETWEEN 1 AND 5),
    title_ko TEXT NOT NULL,
    content_ko TEXT NOT NULL,
    target_industry VARCHAR(50) NOT NULL,
    target_region VARCHAR(100),
    weather_condition VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 다국어 번역 캐시 테이블
CREATE TABLE IF NOT EXISTS public.translation_cache_2025_10_13_08_09 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_text TEXT NOT NULL,
    source_language VARCHAR(10) NOT NULL DEFAULT 'ko',
    target_language VARCHAR(10) NOT NULL,
    translated_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 위험 예측 데이터 테이블
CREATE TABLE IF NOT EXISTS public.risk_predictions_2025_10_13_08_09 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    region VARCHAR(100) NOT NULL,
    industry_sector VARCHAR(50) NOT NULL,
    prediction_date DATE NOT NULL,
    risk_level INTEGER NOT NULL CHECK (risk_level BETWEEN 1 AND 5),
    weather_factors JSONB,
    safety_recommendations JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 사용자 알림 수신 기록 테이블
CREATE TABLE IF NOT EXISTS public.user_notifications_2025_10_13_08_09 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    alert_id UUID REFERENCES public.safety_alerts_2025_10_13_08_09(id),
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS 정책 설정
ALTER TABLE public.user_profiles_2025_10_13_08_09 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_alerts_2025_10_13_08_09 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.translation_cache_2025_10_13_08_09 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_predictions_2025_10_13_08_09 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications_2025_10_13_08_09 ENABLE ROW LEVEL SECURITY;

-- 사용자 프로필 정책
CREATE POLICY "Users can view own profile" ON public.user_profiles_2025_10_13_08_09
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.user_profiles_2025_10_13_08_09
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles_2025_10_13_08_09
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 안전 알림 정책 (모든 인증된 사용자가 조회 가능)
CREATE POLICY "Authenticated users can view alerts" ON public.safety_alerts_2025_10_13_08_09
    FOR SELECT USING (auth.role() = 'authenticated');

-- 번역 캐시 정책 (모든 인증된 사용자가 조회 가능)
CREATE POLICY "Authenticated users can view translations" ON public.translation_cache_2025_10_13_08_09
    FOR SELECT USING (auth.role() = 'authenticated');

-- 위험 예측 정책 (모든 인증된 사용자가 조회 가능)
CREATE POLICY "Authenticated users can view predictions" ON public.risk_predictions_2025_10_13_08_09
    FOR SELECT USING (auth.role() = 'authenticated');

-- 사용자 알림 정책
CREATE POLICY "Users can view own notifications" ON public.user_notifications_2025_10_13_08_09
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.user_notifications_2025_10_13_08_09
    FOR UPDATE USING (auth.uid() = user_id);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles_2025_10_13_08_09(user_id);
CREATE INDEX IF NOT EXISTS idx_safety_alerts_active ON public.safety_alerts_2025_10_13_08_09(is_active, created_at);
CREATE INDEX IF NOT EXISTS idx_translation_cache_lookup ON public.translation_cache_2025_10_13_08_09(source_text, target_language);
CREATE INDEX IF NOT EXISTS idx_risk_predictions_date ON public.risk_predictions_2025_10_13_08_09(prediction_date, region);
CREATE INDEX IF NOT EXISTS idx_user_notifications_user ON public.user_notifications_2025_10_13_08_09(user_id, is_read);