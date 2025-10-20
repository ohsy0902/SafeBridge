-- 실시간 소통 및 피드백 시스템 테이블 생성

-- 채팅방 테이블
CREATE TABLE IF NOT EXISTS public.chat_rooms_2025_10_17_16_02 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_type VARCHAR(50) NOT NULL, -- 'emergency', 'feedback', 'general', 'support'
    room_name VARCHAR(100) NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    participants JSONB NOT NULL DEFAULT '[]', -- 참여자 목록
    is_active BOOLEAN DEFAULT true,
    emergency_level INTEGER DEFAULT 0 CHECK (emergency_level BETWEEN 0 AND 5),
    location_data JSONB, -- 긴급 상황 위치 정보
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 채팅 메시지 테이블
CREATE TABLE IF NOT EXISTS public.chat_messages_2025_10_17_16_02 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES public.chat_rooms_2025_10_17_16_02(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    message_type VARCHAR(30) NOT NULL DEFAULT 'text', -- 'text', 'image', 'location', 'emergency', 'system'
    content TEXT NOT NULL,
    translated_content JSONB, -- 다국어 번역된 내용
    attachments JSONB, -- 첨부파일 정보
    is_emergency BOOLEAN DEFAULT false,
    is_read BOOLEAN DEFAULT false,
    read_by JSONB DEFAULT '[]', -- 읽은 사용자 목록
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 긴급 신고 테이블
CREATE TABLE IF NOT EXISTS public.emergency_reports_2025_10_17_16_02 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    emergency_type VARCHAR(50) NOT NULL, -- 'accident', 'health_emergency', 'weather_danger', 'equipment_failure', 'other'
    severity_level INTEGER NOT NULL CHECK (severity_level BETWEEN 1 AND 5),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    location_data JSONB NOT NULL, -- 위치 정보
    contact_info JSONB, -- 연락처 정보
    attachments JSONB, -- 사진, 동영상 등
    status VARCHAR(30) DEFAULT 'reported', -- 'reported', 'acknowledged', 'in_progress', 'resolved'
    assigned_to UUID REFERENCES auth.users(id),
    response_time TIMESTAMP WITH TIME ZONE,
    resolution_time TIMESTAMP WITH TIME ZONE,
    chat_room_id UUID REFERENCES public.chat_rooms_2025_10_17_16_02(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 지역 설정 테이블
CREATE TABLE IF NOT EXISTS public.user_location_settings_2025_10_17_16_02 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    primary_location JSONB NOT NULL, -- 주 작업 지역
    secondary_locations JSONB DEFAULT '[]', -- 보조 작업 지역들
    notification_radius INTEGER DEFAULT 10, -- 알림 반경 (km)
    auto_location_update BOOLEAN DEFAULT true,
    location_sharing_enabled BOOLEAN DEFAULT false,
    emergency_contacts JSONB DEFAULT '[]', -- 긴급 연락처
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 실시간 알림 큐 테이블
CREATE TABLE IF NOT EXISTS public.notification_queue_2025_10_17_16_02 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL, -- 'emergency', 'safety_alert', 'health_warning', 'chat_message', 'system'
    priority INTEGER NOT NULL DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    action_url VARCHAR(500), -- 클릭 시 이동할 URL
    is_sent BOOLEAN DEFAULT false,
    sent_at TIMESTAMP WITH TIME ZONE,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB, -- 추가 메타데이터
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS 정책 설정
ALTER TABLE public.chat_rooms_2025_10_17_16_02 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages_2025_10_17_16_02 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_reports_2025_10_17_16_02 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_location_settings_2025_10_17_16_02 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_queue_2025_10_17_16_02 ENABLE ROW LEVEL SECURITY;

-- 채팅방 정책
CREATE POLICY "Users can view rooms they participate in" ON public.chat_rooms_2025_10_17_16_02
    FOR SELECT USING (
        auth.uid() = created_by OR 
        auth.uid()::text = ANY(SELECT jsonb_array_elements_text(participants))
    );

CREATE POLICY "Users can create chat rooms" ON public.chat_rooms_2025_10_17_16_02
    FOR INSERT WITH CHECK (auth.uid() = created_by);

-- 채팅 메시지 정책
CREATE POLICY "Users can view messages in their rooms" ON public.chat_messages_2025_10_17_16_02
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.chat_rooms_2025_10_17_16_02 
            WHERE id = room_id AND (
                created_by = auth.uid() OR 
                auth.uid()::text = ANY(SELECT jsonb_array_elements_text(participants))
            )
        )
    );

CREATE POLICY "Users can send messages to their rooms" ON public.chat_messages_2025_10_17_16_02
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM public.chat_rooms_2025_10_17_16_02 
            WHERE id = room_id AND (
                created_by = auth.uid() OR 
                auth.uid()::text = ANY(SELECT jsonb_array_elements_text(participants))
            )
        )
    );

-- 긴급 신고 정책
CREATE POLICY "Users can view own emergency reports" ON public.emergency_reports_2025_10_17_16_02
    FOR SELECT USING (auth.uid() = reporter_id OR auth.uid() = assigned_to);

CREATE POLICY "Users can create emergency reports" ON public.emergency_reports_2025_10_17_16_02
    FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- 지역 설정 정책
CREATE POLICY "Users can manage own location settings" ON public.user_location_settings_2025_10_17_16_02
    FOR ALL USING (auth.uid() = user_id);

-- 알림 큐 정책
CREATE POLICY "Users can view own notifications" ON public.notification_queue_2025_10_17_16_02
    FOR SELECT USING (auth.uid() = recipient_id);

CREATE POLICY "Users can update own notifications" ON public.notification_queue_2025_10_17_16_02
    FOR UPDATE USING (auth.uid() = recipient_id);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_chat_rooms_participants ON public.chat_rooms_2025_10_17_16_02 USING GIN (participants);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_time ON public.chat_messages_2025_10_17_16_02(room_id, created_at);
CREATE INDEX IF NOT EXISTS idx_emergency_reports_status ON public.emergency_reports_2025_10_17_16_02(status, created_at);
CREATE INDEX IF NOT EXISTS idx_notification_queue_recipient ON public.notification_queue_2025_10_17_16_02(recipient_id, is_sent, priority);
CREATE INDEX IF NOT EXISTS idx_user_location_user ON public.user_location_settings_2025_10_17_16_02(user_id);

-- 실시간 알림을 위한 함수 생성
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
BEGIN
    -- 새 메시지가 생성되면 실시간 알림 발송
    PERFORM pg_notify(
        'new_message',
        json_build_object(
            'room_id', NEW.room_id,
            'sender_id', NEW.sender_id,
            'message_type', NEW.message_type,
            'is_emergency', NEW.is_emergency
        )::text
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
CREATE TRIGGER trigger_notify_new_message
    AFTER INSERT ON public.chat_messages_2025_10_17_16_02
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_message();