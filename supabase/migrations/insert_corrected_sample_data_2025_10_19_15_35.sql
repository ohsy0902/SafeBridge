-- 수정된 종합 샘플 데이터 삽입

-- 1. 추가 사용자 프로필 (근로자들)
INSERT INTO user_profiles_2025_10_13_08_09 (user_id, user_type, full_name, preferred_language, industry_sector, company_name, workplace_location, phone_number, emergency_contact, created_at) VALUES
('11111111-1111-1111-1111-111111111111', 'worker', '김근로자', 'ko', 'agriculture', '농장A', '{"workplace": "농장A", "position": "농업근로자", "department": "채소재배", "shift": "주간", "experience_years": 3}', '010-1111-1111', '{"name": "김가족", "phone": "010-1111-0000", "relation": "family"}', NOW() - INTERVAL '30 days'),
('22222222-2222-2222-2222-222222222222', 'worker', '응우옌 반 투안', 'vi', 'agriculture', '농장A', '{"workplace": "농장A", "position": "농업근로자", "department": "과수재배", "shift": "주간", "experience_years": 2}', '010-2222-2222', '{"name": "Nguyen Family", "phone": "010-2222-0000", "relation": "family"}', NOW() - INTERVAL '25 days'),
('33333333-3333-3333-3333-333333333333', 'worker', '솜차이 프라사드', 'th', 'agriculture', '농장B', '{"workplace": "농장B", "position": "농업근로자", "department": "축산", "shift": "야간", "experience_years": 5}', '010-3333-3333', '{"name": "Somchai Family", "phone": "010-3333-0000", "relation": "family"}', NOW() - INTERVAL '20 days'),
('44444444-4444-4444-4444-444444444444', 'worker', '호세 델라 크루즈', 'fil', 'agriculture', '농장B', '{"workplace": "농장B", "position": "농업근로자", "department": "채소재배", "shift": "주간", "experience_years": 1}', '010-4444-4444', '{"name": "Dela Cruz Family", "phone": "010-4444-0000", "relation": "family"}', NOW() - INTERVAL '15 days'),
('55555555-5555-5555-5555-555555555555', 'worker', '부디 산토소', 'id', 'fishery', '어장A', '{"workplace": "어장A", "position": "어업근로자", "department": "양식", "shift": "주간", "experience_years": 4}', '010-5555-5555', '{"name": "Santoso Family", "phone": "010-5555-0000", "relation": "family"}', NOW() - INTERVAL '10 days'),
('66666666-6666-6666-6666-666666666666', 'worker', '라즈 구룽', 'ne', 'fishery', '어장A', '{"workplace": "어장A", "position": "어업근로자", "department": "어획", "shift": "야간", "experience_years": 6}', '010-6666-6666', '{"name": "Gurung Family", "phone": "010-6666-0000", "relation": "family"}', NOW() - INTERVAL '5 days'),
('77777777-7777-7777-7777-777777777777', 'worker', '리웨이', 'zh', 'agriculture', '농장C', '{"workplace": "농장C", "position": "농업근로자", "department": "화훼", "shift": "주간", "experience_years": 2}', '010-7777-7777', '{"name": "Li Family", "phone": "010-7777-0000", "relation": "family"}', NOW() - INTERVAL '3 days'),
('88888888-8888-8888-8888-888888888888', 'worker', 'John Smith', 'en', 'agriculture', '농장C', '{"workplace": "농장C", "position": "농업근로자", "department": "과수재배", "shift": "주간", "experience_years": 3}', '010-8888-8888', '{"name": "Smith Family", "phone": "010-8888-0000", "relation": "family"}', NOW() - INTERVAL '1 day'),
('99999999-9999-9999-9999-999999999999', 'employer', '김관리자', 'ko', 'agriculture', '농업법인 그린팜', '{"company": "농업법인 그린팜", "position": "농장관리자", "employees_count": 25, "business_type": "농업"}', '010-9999-9999', '{"name": "김부인", "phone": "010-9999-0000", "relation": "spouse"}', NOW() - INTERVAL '60 days');

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

-- 4. 위험 예측 데이터
INSERT INTO risk_predictions_2025_10_13_08_09 (user_id, prediction_data, risk_level, prediction_period, created_at) VALUES
('11111111-1111-1111-1111-111111111111', '{"weather_risk": 3.2, "health_risk": 2.1, "equipment_risk": 1.5, "environmental_risk": 2.8}', 2.4, '24_hours', NOW() - INTERVAL '30 minutes'),
('22222222-2222-2222-2222-222222222222', '{"weather_risk": 4.1, "health_risk": 3.7, "equipment_risk": 2.0, "environmental_risk": 3.5}', 3.3, '24_hours', NOW() - INTERVAL '25 minutes'),
('33333333-3333-3333-3333-333333333333', '{"weather_risk": 1.8, "health_risk": 1.2, "equipment_risk": 1.0, "environmental_risk": 1.5}', 1.4, '24_hours', NOW() - INTERVAL '20 minutes'),
('44444444-4444-4444-4444-444444444444', '{"weather_risk": 2.9, "health_risk": 2.8, "equipment_risk": 2.2, "environmental_risk": 2.5}', 2.6, '24_hours', NOW() - INTERVAL '15 minutes'),
('55555555-5555-5555-5555-555555555555', '{"weather_risk": 2.1, "health_risk": 1.8, "equipment_risk": 1.8, "environmental_risk": 2.0}', 1.9, '24_hours', NOW() - INTERVAL '10 minutes');

-- 5. 고용주 리포트 샘플 데이터
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
        "workerName": "응우옌 반 투안",
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

-- 6. 번역 캐시 데이터 (다국어 지원)
INSERT INTO translation_cache_2025_10_13_08_09 (source_text, source_language, target_language, translated_text, confidence_score, created_at) VALUES
-- 한국어 -> 베트남어
('폭염주의보가 발령되었습니다', 'ko', 'vi', 'Cảnh báo nắng nóng đã được ban hành', 0.95, NOW()),
('안전모를 착용하세요', 'ko', 'vi', 'Hãy đeo mũ bảo hiểm', 0.98, NOW()),
('휴식 시간입니다', 'ko', 'vi', 'Đã đến giờ nghỉ ngơi', 0.97, NOW()),
('건강 상태를 확인하세요', 'ko', 'vi', 'Hãy kiểm tra tình trạng sức khỏe', 0.96, NOW()),

-- 한국어 -> 태국어  
('폭염주의보가 발령되었습니다', 'ko', 'th', 'ได้ออกคำเตือนคลื่นความร้อน', 0.94, NOW()),
('안전모를 착용하세요', 'ko', 'th', 'กรุณาสวมหมวกนิรภัย', 0.96, NOW()),
('휴식 시간입니다', 'ko', 'th', 'ถึงเวลาพักผ่อน', 0.95, NOW()),
('건강 상태를 확인하세요', 'ko', 'th', 'กรุณาตรวจสอบสภาพสุขภาพ', 0.94, NOW()),

-- 한국어 -> 필리핀어
('폭염주의보가 발령되었습니다', 'ko', 'fil', 'Nailabas na ang babala sa init', 0.93, NOW()),
('안전모를 착용하세요', 'ko', 'fil', 'Magsuot ng safety helmet', 0.97, NOW()),
('휴식 시간입니다', 'ko', 'fil', 'Oras na ng pahinga', 0.96, NOW()),
('건강 상태를 확인하세요', 'ko', 'fil', 'Suriin ang inyong kalusugan', 0.95, NOW()),

-- 한국어 -> 인도네시아어
('폭염주의보가 발령되었습니다', 'ko', 'id', 'Peringatan gelombang panas telah dikeluarkan', 0.94, NOW()),
('안전모를 착용하세요', 'ko', 'id', 'Silakan kenakan helm keselamatan', 0.98, NOW()),
('휴식 시간입니다', 'ko', 'id', 'Saatnya istirahat', 0.97, NOW()),
('건강 상태를 확인하세요', 'ko', 'id', 'Periksa kondisi kesehatan Anda', 0.96, NOW());

COMMIT;