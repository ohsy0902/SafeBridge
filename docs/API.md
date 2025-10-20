# SafeBridge API 문서

## 🔗 API 개요

SafeBridge는 Supabase Edge Functions를 통해 RESTful API를 제공합니다. 모든 API는 JWT 토큰 기반 인증을 사용합니다.

## 🔐 인증

### 헤더 설정
```javascript
const headers = {
  'Authorization': `Bearer ${supabaseToken}`,
  'Content-Type': 'application/json',
  'apikey': supabaseAnonKey
};
```

## 📡 Edge Functions API

### 1. 다국어 번역 API

**Endpoint**: `/functions/v1/translate_text_2025_10_13_08_09`

**Method**: `POST`

**Request Body**:
```json
{
  "text": "작업 중 안전모를 착용하세요",
  "targetLanguage": "en",
  "sourceLanguage": "ko"
}
```

**Response**:
```json
{
  "success": true,
  "translatedText": "Please wear a safety helmet while working",
  "confidence": 0.95,
  "cached": false
}
```

**지원 언어 코드**:
- `ko`: 한국어
- `en`: 영어
- `zh`: 중국어
- `vi`: 베트남어
- `th`: 태국어
- `fil`: 필리핀어
- `id`: 인도네시아어
- `ne`: 네팔어
- `km`: 캄보디아어
- `my`: 미얀마어

### 2. 기상 예측 API

**Endpoint**: `/functions/v1/weather_prediction_2025_10_13_08_09`

**Method**: `POST`

**Request Body**:
```json
{
  "latitude": 37.5665,
  "longitude": 126.9780,
  "userId": "user-uuid"
}
```

**Response**:
```json
{
  "success": true,
  "currentWeather": {
    "temperature": 25.3,
    "humidity": 65,
    "windSpeed": 3.2,
    "condition": "partly_cloudy"
  },
  "forecast": [
    {
      "date": "2024-10-20",
      "riskLevel": 2,
      "warnings": ["high_temperature"],
      "recommendations": ["수분 섭취 증가", "그늘에서 휴식"]
    }
  ],
  "riskPrediction": {
    "overall": 2.3,
    "factors": {
      "weather": 2.0,
      "season": 1.5,
      "location": 3.0
    }
  }
}
```

### 3. AI 리스크 예측 API

**Endpoint**: `/functions/v1/ai_risk_prediction_2025_10_17_16_02`

**Method**: `POST`

**Request Body**:
```json
{
  "userId": "user-uuid",
  "workplaceType": "agriculture",
  "currentConditions": {
    "weather": { "temperature": 35, "humidity": 80 },
    "workload": "high",
    "equipment": ["safety_helmet", "gloves"]
  }
}
```

**Response**:
```json
{
  "success": true,
  "riskAnalysis": {
    "overallRisk": 4.2,
    "riskFactors": {
      "environmental": 4.5,
      "physical": 3.8,
      "equipment": 2.1,
      "behavioral": 3.5
    },
    "predictions": [
      {
        "timeframe": "next_2_hours",
        "riskLevel": 4.8,
        "confidence": 0.87
      },
      {
        "timeframe": "next_24_hours",
        "riskLevel": 3.2,
        "confidence": 0.92
      }
    ],
    "recommendations": [
      {
        "priority": "critical",
        "action": "작업 중단 권고",
        "reason": "폭염 위험 임계치 초과"
      }
    ]
  }
}
```

### 4. 긴급 신고 API

**Endpoint**: `/functions/v1/emergency_report_2025_10_17_16_02`

**Method**: `POST`

**Request Body**:
```json
{
  "reportType": "workplace_accident",
  "severity": "high",
  "location": {
    "latitude": 37.5665,
    "longitude": 126.9780,
    "address": "서울시 중구 명동"
  },
  "description": "작업 중 낙상 사고 발생",
  "mediaUrls": ["https://example.com/photo1.jpg"]
}
```

**Response**:
```json
{
  "success": true,
  "reportId": "emergency-report-uuid",
  "chatRoomId": "chat-room-uuid",
  "estimatedResponseTime": "5-10분",
  "emergencyContacts": [
    {
      "type": "employer",
      "name": "김관리자",
      "phone": "010-1234-5678"
    },
    {
      "type": "emergency_service",
      "name": "119 소방서",
      "phone": "119"
    }
  ],
  "notificationsSent": 3
}
```

### 5. 고용주 리포트 생성 API

**Endpoint**: `/functions/v1/generate_employer_report_2025_10_17_15_24`

**Method**: `POST`

**Request Body**:
```json
{
  "employerId": "employer-uuid",
  "reportType": "weekly_safety",
  "dateRange": {
    "start": "2024-10-13",
    "end": "2024-10-19"
  }
}
```

**Response**:
```json
{
  "success": true,
  "reportId": "report-uuid",
  "reportData": {
    "summary": {
      "totalWorkers": 25,
      "safetyIncidents": 1,
      "healthAlerts": 3,
      "complianceScore": 87.5
    },
    "detailedAnalysis": {
      "riskDistribution": {
        "1": 5,
        "2": 12,
        "3": 6,
        "4": 2,
        "5": 0
      },
      "workerPerformance": [
        {
          "workerId": "worker-uuid",
          "workerName": "김근로자",
          "averageRiskLevel": 2.3,
          "alertCount": 2,
          "lastAnalysisDate": "2024-10-19"
        }
      ],
      "recommendations": [
        {
          "priority": "high",
          "title": "폭염 대비 안전 교육 강화",
          "description": "기온 상승에 따른 열사병 예방 교육 필요",
          "actions": [
            "안전 교육 프로그램 업데이트",
            "휴식 시간 증대",
            "수분 공급 시설 확충"
          ]
        }
      ]
    }
  }
}
```

### 6. 건강 분석 API

**Endpoint**: `/functions/v1/health_analysis_2025_10_17_15_24`

**Method**: `POST`

**Request Body**:
```json
{
  "userId": "user-uuid",
  "healthData": {
    "heartRate": 85,
    "bloodPressure": {
      "systolic": 120,
      "diastolic": 80
    },
    "bodyTemperature": 36.5,
    "symptoms": ["fatigue", "headache"],
    "workEnvironment": {
      "temperature": 32,
      "humidity": 75,
      "airQuality": "moderate"
    }
  }
}
```

**Response**:
```json
{
  "success": true,
  "healthAnalysis": {
    "overallRiskLevel": 3.2,
    "riskFactors": {
      "cardiovascular": 2.1,
      "respiratory": 2.8,
      "thermal": 4.5,
      "fatigue": 3.7
    },
    "recommendations": [
      {
        "category": "immediate",
        "action": "충분한 수분 섭취",
        "priority": "high"
      },
      {
        "category": "preventive",
        "action": "정기적인 휴식",
        "priority": "medium"
      }
    ],
    "alertLevel": "caution",
    "nextCheckTime": "2024-10-19T15:00:00Z"
  }
}
```

## 📊 데이터베이스 API (Supabase)

### 사용자 프로필 조회
```javascript
const { data, error } = await supabase
  .from('user_profiles_2025_10_13_08_09')
  .select('*')
  .eq('user_id', userId)
  .single();
```

### 안전 알림 조회
```javascript
const { data, error } = await supabase
  .from('safety_alerts_2025_10_13_08_09')
  .select('*')
  .contains('target_users', [userId])
  .order('created_at', { ascending: false })
  .limit(10);
```

### 실시간 채팅 메시지
```javascript
const { data, error } = await supabase
  .from('chat_messages_2025_10_17_16_02')
  .insert({
    room_id: roomId,
    sender_id: userId,
    message: messageText,
    message_type: 'text'
  });
```

## 🔄 실시간 구독

### 안전 알림 구독
```javascript
const subscription = supabase
  .channel('safety_alerts')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'safety_alerts_2025_10_13_08_09',
    filter: `target_users=cs.{${userId}}`
  }, (payload) => {
    console.log('새로운 안전 알림:', payload.new);
  })
  .subscribe();
```

### 채팅 메시지 구독
```javascript
const chatSubscription = supabase
  .channel(`chat_room_${roomId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'chat_messages_2025_10_17_16_02',
    filter: `room_id=eq.${roomId}`
  }, (payload) => {
    console.log('새로운 메시지:', payload.new);
  })
  .subscribe();
```

## ⚠️ 에러 처리

### 공통 에러 응답
```json
{
  "success": false,
  "error": {
    "code": "TRANSLATION_FAILED",
    "message": "번역 서비스에 연결할 수 없습니다",
    "details": "Google Translate API rate limit exceeded"
  }
}
```

### 에러 코드
- `AUTH_REQUIRED`: 인증 필요
- `INVALID_REQUEST`: 잘못된 요청
- `TRANSLATION_FAILED`: 번역 실패
- `WEATHER_API_ERROR`: 기상 API 오류
- `DATABASE_ERROR`: 데이터베이스 오류
- `RATE_LIMIT_EXCEEDED`: 요청 한도 초과

## 🚀 사용 예시

### React 컴포넌트에서 API 호출
```typescript
import { supabase } from '@/integrations/supabase/client';

const translateText = async (text: string, targetLang: string) => {
  try {
    const { data, error } = await supabase.functions.invoke(
      'translate_text_2025_10_13_08_09',
      {
        body: {
          text,
          targetLanguage: targetLang,
          sourceLanguage: 'ko'
        }
      }
    );

    if (error) throw error;
    return data.translatedText;
  } catch (error) {
    console.error('Translation error:', error);
    throw error;
  }
};
```

이 API 문서는 SafeBridge 플랫폼의 모든 주요 기능에 대한 프로그래밍 인터페이스를 제공합니다.