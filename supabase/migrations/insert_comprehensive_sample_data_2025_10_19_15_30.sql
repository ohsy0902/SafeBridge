-- 종합 샘플 데이터 삽입
-- 이 파일은 SafeBridge 플랫폼의 모든 기능을 테스트할 수 있는 샘플 데이터를 제공합니다.

-- 1. 추가 사용자 프로필 (근로자들)
INSERT INTO user_profiles_2025_10_13_08_09 (user_id, user_type, preferred_language, workplace_info, created_at) VALUES
('11111111-1111-1111-1111-111111111111', 'worker', 'ko', '{"workplace": "농장A", "position": "농업근로자", "department": "채소재배", "shift": "주간", "experience_years": 3}', NOW() - INTERVAL '30 days'),
('22222222-2222-2222-2222-222222222222', 'worker', 'vi', '{"workplace": "농장A", "position": "농업근로자", "department": "과수재배", "shift": "주간", "experience_years": 2}', NOW() - INTERVAL '25 days'),
('33333333-3333-3333-3333-333333333333', 'worker', 'th', '{"workplace": "농장B", "position": "농업근로자", "department": "축산", "shift": "야간", "experience_years": 5}', NOW() - INTERVAL '20 days'),
('44444444-4444-4444-4444-444444444444', 'worker', 'fil', '{"workplace": "농장B", "position": "농업근로자", "department": "채소재배", "shift": "주간", "experience_years": 1}', NOW() - INTERVAL '15 days'),
('55555555-5555-5555-5555-555555555555', 'worker', 'id', '{"workplace": "어장A", "position": "어업근로자", "department": "양식", "shift": "주간", "experience_years": 4}', NOW() - INTERVAL '10 days'),
('66666666-6666-6666-6666-666666666666', 'worker', 'ne', '{"workplace": "어장A", "position": "어업근로자", "department": "어획", "shift": "야간", "experience_years": 6}', NOW() - INTERVAL '5 days'),
('77777777-7777-7777-7777-777777777777', 'worker', 'zh', '{"workplace": "농장C", "position": "농업근로자", "department": "화훼", "shift": "주간", "experience_years": 2}', NOW() - INTERVAL '3 days'),
('88888888-8888-8888-8888-888888888888', 'worker', 'en', '{"workplace": "농장C", "position": "농업근로자", "department": "과수재배", "shift": "주간", "experience_years": 3}', NOW() - INTERVAL '1 day'),
('99999999-9999-9999-9999-999999999999', 'employer', 'ko', '{"company": "농업법인 그린팜", "position": "농장관리자", "employees_count": 25, "business_type": "농업"}', NOW() - INTERVAL '60 days');

-- 2. 건강 데이터 샘플 (자동 측정 시뮬레이션)
INSERT INTO health_data_2025_10_17_15_24 (user_id, health_metrics, risk_level, recorded_at) VALUES
-- 김근로자 (한국어)
('11111111-1111-1111-1111-111111111111', '{"heart_rate": 72, "blood_pressure": {"systolic": 120, "diastolic": 80}, "body_temperature": 36.5, "steps": 8500, "sleep_hours": 7.5, "stress_level": 2}', 1.5, NOW() - INTERVAL '1 hour'),
('11111111-1111-1111-1111-111111111111', '{"heart_rate": 85, "blood_pressure": {"systolic": 125, "diastolic": 82}, "body_temperature": 36.8, "steps": 12000, "sleep_hours": 6.5, "stress_level": 3}', 2.2, NOW() - INTERVAL '2 hours'),

-- 응우옌 (베트남어)
('22222222-2222-2222-2222-222222222222', '{"heart_rate": 78, "blood_pressure": {"systolic": 118, "diastolic": 78}, "body_temperature": 36.4, "steps": 9200, "sleep_hours": 8.0, "stress_level": 1}', 1.2, NOW() - INTERVAL '30 minutes'),
('22222222-2222-2222-2222-222222222222', '{"heart_rate": 92, "blood_pressure": {"systolic": 135, "diastolic": 88}, "body_temperature": 37.2, "steps": 15000, "sleep_hours": 5.5, "stress_level": 4}', 3.5, NOW() - INTERVAL '1.5 hours'),

-- 솜차이 (태국어)
('33333333-3333-3333-3333-333333333333', '{"heart_rate": 68, "blood_pressure": {"systolic": 115, "diastolic": 75}, "body_temperature": 36.3, "steps": 7800, "sleep_hours": 8.5, "stress_level": 1}', 1.0, NOW() - INTERVAL '45 minutes'),

-- 호세 (필리핀어)
('44444444-4444-4444-4444-444444444444', '{"heart_rate": 88, "blood_pressure": {"systolic": 130, "diastolic": 85}, "body_temperature": 36.9, "steps": 11500, "sleep_hours": 6.0, "stress_level": 3}', 2.8, NOW() - INTERVAL '20 minutes'),

-- 부디 (인도네시아어)
('55555555-5555-5555-5555-555555555555', '{"heart_rate": 75, "blood_pressure": {"systolic": 122, "diastolic": 81}, "body_temperature": 36.6, "steps": 9800, "sleep_hours": 7.0, "stress_level": 2}', 1.8, NOW() - INTERVAL '10 minutes'),

-- 라즈 (네팔어)
('66666666-6666-6666-6666-666666666666', '{"heart_rate": 82, "blood_pressure": {"systolic": 128, "diastolic": 84}, "body_temperature": 36.7, "steps": 10500, "sleep_hours": 6.8, "stress_level": 2}', 2.1, NOW() - INTERVAL '5 minutes'),

-- 리웨이 (중국어)
('77777777-7777-7777-7777-777777777777', '{"heart_rate": 70, "blood_pressure": {"systolic": 117, "diastolic": 77}, "body_temperature": 36.4, "steps": 8800, "sleep_hours": 7.8, "stress_level": 1}', 1.3, NOW() - INTERVAL '15 minutes'),

-- 존 (영어)
('88888888-8888-8888-8888-888888888888', '{"heart_rate": 79, "blood_pressure": {"systolic": 123, "diastolic": 82}, "body_temperature": 36.6, "steps": 9500, "sleep_hours": 7.2, "stress_level": 2}', 1.7, NOW());

-- 3. 건강 위험 분석 데이터
INSERT INTO health_risk_analysis_2025_10_17_15_24 (user_id, analysis_data, risk_score, recommendations, created_at) VALUES
('11111111-1111-1111-1111-111111111111', '{"cardiovascular_risk": 2.1, "heat_stress_risk": 1.8, "fatigue_level": 2.5, "hydration_status": "adequate"}', 2.1, '["충분한 수분 섭취", "정기적인 휴식", "그늘에서 작업"]', NOW() - INTERVAL '1 hour'),
('22222222-2222-2222-2222-222222222222', '{"cardiovascular_risk": 3.2, "heat_stress_risk": 3.8, "fatigue_level": 4.1, "hydration_status": "low"}', 3.7, '["즉시 휴식 필요", "수분 보충", "의료진 상담"]', NOW() - INTERVAL '30 minutes'),
('33333333-3333-3333-3333-333333333333', '{"cardiovascular_risk": 1.2, "heat_stress_risk": 1.0, "fatigue_level": 1.5, "hydration_status": "good"}', 1.2, '["현재 상태 양호", "지속적인 모니터링"]', NOW() - INTERVAL '45 minutes');

-- 4. 시간대별 안전 알림 데이터
INSERT INTO safety_alerts_2025_10_13_08_09 (alert_type, severity_level, message, target_users, location_info, created_at) VALUES
-- 아침 시간대 (06:00-09:00)
('weather_warning', 3, '오늘 최고기온 35도 예상, 폭염주의보 발령', ARRAY['11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222'], '{"region": "경기도 화성시", "coordinates": {"lat": 37.2, "lng": 126.8}}', DATE_TRUNC('day', NOW()) + INTERVAL '7 hours'),
('safety_reminder', 2, '작업 시작 전 안전장비 점검 필수', ARRAY['11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333'], '{"workplace": "농장A"}', DATE_TRUNC('day', NOW()) + INTERVAL '6 hours 30 minutes'),

-- 점심 시간대 (12:00-14:00)
('heat_warning', 4, '현재 기온 33도, 야외작업 중단 권고', ARRAY['22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444'], '{"region": "충남 서산시"}', DATE_TRUNC('day', NOW()) + INTERVAL '13 hours'),
('hydration_reminder', 2, '수분 섭취 시간입니다. 충분한 물을 마시세요.', ARRAY['11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555'], '{"workplace": "전체"}', DATE_TRUNC('day', NOW()) + INTERVAL '12 hours 30 minutes'),

-- 오후 시간대 (15:00-18:00)
('equipment_check', 3, '오후 작업 전 장비 재점검 필요', ARRAY['33333333-3333-3333-3333-333333333333', '66666666-6666-6666-6666-666666666666'], '{"workplace": "농장B"}', DATE_TRUNC('day', NOW()) + INTERVAL '16 hours'),
('weather_update', 2, '오후 소나기 예보, 실내 대피 준비', ARRAY['77777777-7777-7777-7777-777777777777', '88888888-8888-8888-8888-888888888888'], '{"region": "전남 해남군"}', DATE_TRUNC('day', NOW()) + INTERVAL '15 hours 30 minutes'),

-- 저녁 시간대 (18:00-21:00)
('work_completion', 1, '오늘 작업 완료, 장비 정리 및 보관', ARRAY['11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222'], '{"workplace": "전체"}', DATE_TRUNC('day', NOW()) + INTERVAL '19 hours'),
('safety_summary', 2, '오늘 안전사고 0건, 우수한 안전 관리', ARRAY['99999999-9999-9999-9999-999999999999'], '{"workplace": "전체"}', DATE_TRUNC('day', NOW()) + INTERVAL '20 hours');

-- 5. 위험 예측 데이터
INSERT INTO risk_predictions_2025_10_13_08_09 (user_id, prediction_data, risk_level, prediction_period, created_at) VALUES
('11111111-1111-1111-1111-111111111111', '{"weather_risk": 3.2, "health_risk": 2.1, "equipment_risk": 1.5, "environmental_risk": 2.8}', 2.4, '24_hours', NOW() - INTERVAL '30 minutes'),
('22222222-2222-2222-2222-222222222222', '{"weather_risk": 4.1, "health_risk": 3.7, "equipment_risk": 2.0, "environmental_risk": 3.5}', 3.3, '24_hours', NOW() - INTERVAL '25 minutes'),
('33333333-3333-3333-3333-333333333333', '{"weather_risk": 1.8, "health_risk": 1.2, "equipment_risk": 1.0, "environmental_risk": 1.5}', 1.4, '24_hours', NOW() - INTERVAL '20 minutes'),
('44444444-4444-4444-4444-444444444444', '{"weather_risk": 2.9, "health_risk": 2.8, "equipment_risk": 2.2, "environmental_risk": 2.5}', 2.6, '24_hours', NOW() - INTERVAL '15 minutes'),
('55555555-5555-5555-5555-555555555555', '{"weather_risk": 2.1, "health_risk": 1.8, "equipment_risk": 1.8, "environmental_risk": 2.0}', 1.9, '24_hours', NOW() - INTERVAL '10 minutes');

-- 6. 고용주 리포트 샘플 데이터
INSERT INTO employer_reports_2025_10_17_15_24 (employer_id, report_type, report_period_start, report_period_end, worker_count, overall_risk_score, compliance_score, total_workers, report_data, created_at) VALUES
('99999999-9999-9999-9999-999999999999', 'weekly_safety', NOW() - INTERVAL '7 days', NOW(), 8, 2.3, 87.5, 8, '{
  "summary": {
    "totalWorkers": 8,
    "safetyIncidents": 0,
    "healthAlerts": 5,
    "complianceScore": 87.5,
    "averageRiskLevel": 2.3
  },
  "detailedAnalysis": {
    "riskDistribution": {
      "1": 2,
      "2": 3,
      "3": 2,
      "4": 1,
      "5": 0
    },
    "workerPerformance": [
      {
        "workerId": "11111111-1111-1111-1111-111111111111",
        "workerName": "김근로자",
        "averageRiskLevel": 2.1,
        "alertCount": 3,
        "lastAnalysisDate": "2024-10-19"
      },
      {
        "workerId": "22222222-2222-2222-2222-222222222222", 
        "workerName": "응우옌",
        "averageRiskLevel": 3.3,
        "alertCount": 5,
        "lastAnalysisDate": "2024-10-19"
      }
    ],
    "recommendations": [
      {
        "priority": "high",
        "title": "폭염 대비 안전 교육 강화",
        "description": "기온 상승에 따른 열사병 예방 교육 필요",
        "actions": ["안전 교육 프로그램 업데이트", "휴식 시간 증대", "수분 공급 시설 확충"]
      }
    ]
  }
}', NOW() - INTERVAL '1 day'),

('99999999-9999-9999-9999-999999999999', 'monthly_health', NOW() - INTERVAL '30 days', NOW(), 8, 2.1, 92.3, 8, '{
  "summary": {
    "totalWorkers": 8,
    "healthCheckups": 8,
    "healthAlerts": 12,
    "complianceScore": 92.3,
    "averageHealthScore": 4.2
  },
  "detailedAnalysis": {
    "healthTrends": {
      "cardiovascular": 2.1,
      "respiratory": 1.8,
      "musculoskeletal": 2.3,
      "mental_health": 1.9
    },
    "recommendations": [
      {
        "priority": "medium",
        "title": "정기 건강검진 확대",
        "description": "월 1회 기본 건강검진 실시 권고",
        "actions": ["건강검진 일정 수립", "의료진 상주 시간 확대"]
      }
    ]
  }
}', NOW() - INTERVAL '2 days');

-- 7. 사용자 위치 설정 데이터
INSERT INTO user_location_settings_2025_10_17_16_02 (user_id, primary_location, secondary_location, notification_radius, auto_location_update, location_sharing_enabled, emergency_contacts, created_at) VALUES
('11111111-1111-1111-1111-111111111111', '{"address": "경기도 화성시 농장로 123", "coordinates": {"lat": 37.2, "lng": 126.8}, "workplace": "농장A"}', '{"address": "경기도 화성시 숙소동 456", "coordinates": {"lat": 37.21, "lng": 126.81}}', 5000, true, true, '[{"name": "김관리자", "phone": "010-1234-5678", "relation": "supervisor"}]', NOW() - INTERVAL '30 days'),
('22222222-2222-2222-2222-222222222222', '{"address": "경기도 화성시 농장로 123", "coordinates": {"lat": 37.2, "lng": 126.8}, "workplace": "농장A"}', '{"address": "경기도 화성시 외국인숙소 789", "coordinates": {"lat": 37.19, "lng": 126.82}}', 3000, true, true, '[{"name": "김관리자", "phone": "010-1234-5678", "relation": "supervisor"}, {"name": "응우옌형", "phone": "010-9876-5432", "relation": "friend"}]', NOW() - INTERVAL '25 days');

-- 8. 번역 캐시 데이터 (다국어 지원)
INSERT INTO translation_cache_2025_10_13_08_09 (source_text, source_language, target_language, translated_text, confidence_score, created_at) VALUES
-- 한국어 -> 베트남어
('폭염주의보가 발령되었습니다', 'ko', 'vi', 'Cảnh báo nắng nóng đã được ban hành', 0.95, NOW()),
('안전모를 착용하세요', 'ko', 'vi', 'Hãy đeo mũ bảo hiểm', 0.98, NOW()),
('휴식 시간입니다', 'ko', 'vi', 'Đã đến giờ nghỉ ngơi', 0.97, NOW()),

-- 한국어 -> 태국어  
('폭염주의보가 발령되었습니다', 'ko', 'th', 'ได้ออกคำเตือนคลื่นความร้อน', 0.94, NOW()),
('안전모를 착용하세요', 'ko', 'th', 'กรุณาสวมหมวกนิรภัย', 0.96, NOW()),
('휴식 시간입니다', 'ko', 'th', 'ถึงเวลาพักผ่อน', 0.95, NOW()),

-- 한국어 -> 필리핀어
('폭염주의보가 발령되었습니다', 'ko', 'fil', 'Nailabas na ang babala sa init', 0.93, NOW()),
('안전모를 착용하세요', 'ko', 'fil', 'Magsuot ng safety helmet', 0.97, NOW()),
('휴식 시간입니다', 'ko', 'fil', 'Oras na ng pahinga', 0.96, NOW()),

-- 한국어 -> 인도네시아어
('폭염주의보가 발령되었습니다', 'ko', 'id', 'Peringatan gelombang panas telah dikeluarkan', 0.94, NOW()),
('안전모를 착용하세요', 'ko', 'id', 'Silakan kenakan helm keselamatan', 0.98, NOW()),
('휴식 시간입니다', 'ko', 'id', 'Saatnya istirahat', 0.97, NOW());

-- 9. 알림 큐 데이터
INSERT INTO notification_queue_2025_10_17_16_02 (user_id, notification_type, title, message, priority, scheduled_time, status, created_at) VALUES
('11111111-1111-1111-1111-111111111111', 'safety_alert', '폭염 주의', '현재 기온이 35도를 넘었습니다. 충분한 휴식을 취하세요.', 'high', NOW() + INTERVAL '10 minutes', 'pending', NOW()),
('22222222-2222-2222-2222-222222222222', 'health_reminder', 'Nhắc nhở sức khỏe', 'Đã đến lúc kiểm tra sức khỏe định kỳ', 'medium', NOW() + INTERVAL '30 minutes', 'pending', NOW()),
('33333333-3333-3333-3333-333333333333', 'safety_alert', 'การเตือนความปลอดภัย', 'กรุณาตรวจสอบอุปกรณ์ความปลอดภัยก่อนเริ่มงาน', 'medium', NOW() + INTERVAL '1 hour', 'pending', NOW());

COMMIT;