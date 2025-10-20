-- 건강 모니터링 시스템 테이블 생성

-- 건강 데이터 수집 테이블
CREATE TABLE IF NOT EXISTS public.health_data_2025_10_17_15_24 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    measurement_type VARCHAR(50) NOT NULL, -- 'heart_rate', 'body_temp', 'blood_pressure', 'fatigue_level', 'hydration'
    measurement_value JSONB NOT NULL, -- 측정값 (숫자 또는 객체)
    measurement_unit VARCHAR(20), -- 단위 ('bpm', 'celsius', 'mmHg', 'scale_1_10')
    measurement_source VARCHAR(30) NOT NULL, -- 'manual', 'sensor', 'wearable', 'app_input'
    location_data JSONB, -- 측정 위치 정보
    environmental_factors JSONB, -- 온도, 습도 등 환경 요인
    work_activity VARCHAR(100), -- 작업 활동 종류
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 건강 위험도 분석 결과 테이블
CREATE TABLE IF NOT EXISTS public.health_risk_analysis_2025_10_17_15_24 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    analysis_date DATE NOT NULL DEFAULT CURRENT_DATE,
    overall_risk_level INTEGER NOT NULL CHECK (overall_risk_level BETWEEN 1 AND 5),
    risk_factors JSONB NOT NULL, -- 위험 요인들과 점수
    health_recommendations JSONB NOT NULL, -- 건강 권장사항
    predicted_issues JSONB, -- 예측되는 건강 문제들
    confidence_score DECIMAL(3,2), -- 예측 신뢰도 (0.00-1.00)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 사용자 피드백 테이블
CREATE TABLE IF NOT EXISTS public.user_feedback_2025_10_17_15_24 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    feedback_type VARCHAR(50) NOT NULL, -- 'alert_accuracy', 'translation_quality', 'health_prediction', 'safety_recommendation'
    target_id UUID, -- 피드백 대상 ID (alert_id, prediction_id 등)
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    feedback_text TEXT,
    improvement_suggestions TEXT,
    is_processed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 머신러닝 모델 성능 추적 테이블
CREATE TABLE IF NOT EXISTS public.ml_model_performance_2025_10_17_15_24 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_type VARCHAR(50) NOT NULL, -- 'risk_prediction', 'health_analysis', 'translation_quality'
    model_version VARCHAR(20) NOT NULL,
    accuracy_score DECIMAL(5,4),
    precision_score DECIMAL(5,4),
    recall_score DECIMAL(5,4),
    f1_score DECIMAL(5,4),
    training_data_size INTEGER,
    evaluation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    performance_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 고용주 대시보드 리포트 테이블
CREATE TABLE IF NOT EXISTS public.employer_reports_2025_10_17_15_24 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    report_type VARCHAR(50) NOT NULL, -- 'weekly_safety', 'monthly_health', 'quarterly_performance'
    report_period_start DATE NOT NULL,
    report_period_end DATE NOT NULL,
    worker_count INTEGER,
    safety_incidents INTEGER DEFAULT 0,
    health_alerts INTEGER DEFAULT 0,
    compliance_score DECIMAL(3,2), -- 규정 준수 점수
    report_data JSONB NOT NULL, -- 상세 리포트 데이터
    auto_generated BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 작업장 환경 데이터 테이블
CREATE TABLE IF NOT EXISTS public.workplace_environment_2025_10_17_15_24 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workplace_id VARCHAR(100) NOT NULL,
    employer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    location_data JSONB NOT NULL, -- 위치 정보
    environment_type VARCHAR(50) NOT NULL, -- 'indoor_farm', 'outdoor_field', 'fishing_vessel', 'greenhouse'
    sensor_data JSONB, -- 센서 데이터 (온도, 습도, 공기질 등)
    safety_equipment JSONB, -- 안전 장비 현황
    risk_assessment JSONB, -- 위험 평가 결과
    last_inspection_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS 정책 설정
ALTER TABLE public.health_data_2025_10_17_15_24 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_risk_analysis_2025_10_17_15_24 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_feedback_2025_10_17_15_24 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_model_performance_2025_10_17_15_24 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employer_reports_2025_10_17_15_24 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workplace_environment_2025_10_17_15_24 ENABLE ROW LEVEL SECURITY;

-- 건강 데이터 정책
CREATE POLICY "Users can view own health data" ON public.health_data_2025_10_17_15_24
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own health data" ON public.health_data_2025_10_17_15_24
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 건강 위험도 분석 정책
CREATE POLICY "Users can view own health analysis" ON public.health_risk_analysis_2025_10_17_15_24
    FOR SELECT USING (auth.uid() = user_id);

-- 사용자 피드백 정책
CREATE POLICY "Users can view own feedback" ON public.user_feedback_2025_10_17_15_24
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own feedback" ON public.user_feedback_2025_10_17_15_24
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ML 모델 성능 정책 (인증된 사용자만 조회 가능)
CREATE POLICY "Authenticated users can view ml performance" ON public.ml_model_performance_2025_10_17_15_24
    FOR SELECT USING (auth.role() = 'authenticated');

-- 고용주 리포트 정책
CREATE POLICY "Employers can view own reports" ON public.employer_reports_2025_10_17_15_24
    FOR SELECT USING (auth.uid() = employer_id);

-- 작업장 환경 정책
CREATE POLICY "Employers can view own workplace data" ON public.workplace_environment_2025_10_17_15_24
    FOR SELECT USING (auth.uid() = employer_id);

CREATE POLICY "Employers can manage own workplace data" ON public.workplace_environment_2025_10_17_15_24
    FOR ALL USING (auth.uid() = employer_id);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_health_data_user_date ON public.health_data_2025_10_17_15_24(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_health_data_type ON public.health_data_2025_10_17_15_24(measurement_type, created_at);
CREATE INDEX IF NOT EXISTS idx_health_risk_user_date ON public.health_risk_analysis_2025_10_17_15_24(user_id, analysis_date);
CREATE INDEX IF NOT EXISTS idx_feedback_type_processed ON public.user_feedback_2025_10_17_15_24(feedback_type, is_processed);
CREATE INDEX IF NOT EXISTS idx_employer_reports_period ON public.employer_reports_2025_10_17_15_24(employer_id, report_period_start, report_period_end);
CREATE INDEX IF NOT EXISTS idx_workplace_environment_employer ON public.workplace_environment_2025_10_17_15_24(employer_id, environment_type);