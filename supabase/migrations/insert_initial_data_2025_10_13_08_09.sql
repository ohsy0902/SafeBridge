-- SafeBridge 초기 데이터 삽입
-- 농업/어업 분야 안전 알림 샘플 데이터
INSERT INTO public.safety_alerts_2025_10_13_08_09 (alert_type, severity_level, title_ko, content_ko, target_industry, target_region, weather_condition) VALUES
('weather_warning', 4, '폭염 경보 발령', '기온이 35도 이상으로 예상됩니다. 야외 작업 시 충분한 휴식과 수분 섭취를 하시고, 오전 10시~오후 4시 사이 작업을 피해주세요.', 'agriculture', '전국', 'extreme_heat'),
('safety_guideline', 3, '농약 살포 시 안전 수칙', '농약 살포 작업 시 반드시 보호장비를 착용하고, 바람이 강한 날에는 작업을 중단해주세요. 작업 후 손과 얼굴을 깨끗이 씻어주세요.', 'agriculture', '전국', 'normal'),
('weather_warning', 5, '태풍 경보 발령', '강한 태풍이 접근하고 있습니다. 모든 야외 작업을 중단하고 안전한 곳으로 대피하세요. 어선은 즉시 항구로 복귀해주세요.', 'fishery', '남해안', 'typhoon'),
('safety_guideline', 2, '어선 안전 점검 안내', '출항 전 구명조끼, 통신장비, 기상 정보를 반드시 확인하세요. 1인 조업은 위험하니 가급적 2인 이상 함께 작업하세요.', 'fishery', '전국', 'normal'),
('weather_warning', 3, '강풍 주의보', '시속 50km 이상의 강풍이 예상됩니다. 비닐하우스 고정 상태를 점검하고, 높은 곳에서의 작업을 피해주세요.', 'agriculture', '중부지방', 'strong_wind');

-- 위험 예측 샘플 데이터 (향후 3일간)
INSERT INTO public.risk_predictions_2025_10_13_08_09 (region, industry_sector, prediction_date, risk_level, weather_factors, safety_recommendations) VALUES
('경기도', 'agriculture', CURRENT_DATE + INTERVAL '1 day', 3, 
 '{"temperature": 32, "humidity": 75, "wind_speed": 15, "precipitation": 0}',
 '{"ko": "높은 기온으로 인한 열사병 위험. 오후 2-4시 작업 중단 권장", "actions": ["충분한 수분 섭취", "그늘에서 휴식", "보호복 착용"]}'),
('부산광역시', 'fishery', CURRENT_DATE + INTERVAL '1 day', 2,
 '{"wave_height": 1.5, "wind_speed": 20, "visibility": 8, "water_temp": 18}',
 '{"ko": "보통 수준의 기상 조건. 안전 수칙 준수하여 조업 가능", "actions": ["구명조끼 착용", "기상 변화 주시", "통신장비 점검"]}'),
('전라남도', 'agriculture', CURRENT_DATE + INTERVAL '2 days', 4,
 '{"temperature": 36, "humidity": 80, "uv_index": 9, "precipitation": 0}',
 '{"ko": "극심한 폭염 예상. 야외 작업 최소화 필요", "actions": ["작업 시간 단축", "냉각 조끼 착용", "응급처치 준비"]}'),
('제주도', 'fishery', CURRENT_DATE + INTERVAL '2 days', 5,
 '{"wave_height": 4.0, "wind_speed": 60, "visibility": 2, "storm_warning": true}',
 '{"ko": "태풍 영향으로 매우 위험. 모든 해상 작업 금지", "actions": ["즉시 입항", "선박 고정", "대피소 이동"]}'),
('강원도', 'agriculture', CURRENT_DATE + INTERVAL '3 days', 1,
 '{"temperature": 24, "humidity": 60, "wind_speed": 8, "precipitation": 5}',
 '{"ko": "양호한 기상 조건. 정상 작업 가능", "actions": ["기본 안전 수칙 준수", "정기 휴식", "수분 보충"]}');

-- 번역 캐시 샘플 데이터 (주요 안전 문구들)
INSERT INTO public.translation_cache_2025_10_13_08_09 (source_text, source_language, target_language, translated_text) VALUES
('폭염 경보 발령', 'ko', 'en', 'Heat Wave Warning Issued'),
('폭염 경보 발령', 'ko', 'vi', 'Cảnh báo sóng nhiệt được ban hành'),
('폭염 경보 발령', 'ko', 'th', 'ประกาศเตือนคลื่นความร้อน'),
('안전장비를 착용하세요', 'ko', 'en', 'Please wear safety equipment'),
('안전장비를 착용하세요', 'ko', 'vi', 'Vui lòng đeo thiết bị an toàn'),
('안전장비를 착용하세요', 'ko', 'th', 'โปรดสวมอุปกรณ์ความปลอดภัย'),
('즉시 대피하세요', 'ko', 'en', 'Evacuate immediately'),
('즉시 대피하세요', 'ko', 'vi', 'Sơ tán ngay lập tức'),
('즉시 대피하세요', 'ko', 'th', 'อพยพทันที'),
('충분한 휴식을 취하세요', 'ko', 'en', 'Take sufficient rest'),
('충분한 휴식을 취하세요', 'ko', 'vi', 'Nghỉ ngơi đầy đủ'),
('충분한 휴식을 취하세요', 'ko', 'th', 'พักผ่อนให้เพียงพอ');