import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, X-Client-Info, apikey, Content-Type, X-Application-Name',
};

interface WeatherRequest {
  region: string;
  industry: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { region, industry }: WeatherRequest = await req.json();

    if (!region || !industry) {
      return new Response(
        JSON.stringify({ error: 'Region and industry are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // OpenWeatherMap API 호출
    const weatherApiKey = Deno.env.get('OPENWEATHER_API_KEY');
    if (!weatherApiKey) {
      // API 키가 없는 경우 모의 데이터 사용
      const mockWeatherData = generateMockWeatherData(region, industry);
      
      // 위험 예측 데이터 저장
      const { error: insertError } = await supabase
        .from('risk_predictions_2025_10_13_08_09')
        .insert({
          region,
          industry_sector: industry,
          prediction_date: new Date().toISOString().split('T')[0],
          risk_level: mockWeatherData.riskLevel,
          weather_factors: mockWeatherData.weatherFactors,
          safety_recommendations: mockWeatherData.recommendations
        });

      if (insertError) {
        console.error('Database insert error:', insertError);
      }

      return new Response(
        JSON.stringify(mockWeatherData),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 실제 기상 데이터 조회
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${region}&appid=${weatherApiKey}&units=metric&lang=kr`;
    const weatherResponse = await fetch(weatherUrl);

    if (!weatherResponse.ok) {
      throw new Error(`Weather API error: ${weatherResponse.status}`);
    }

    const weatherData = await weatherResponse.json();
    
    // 위험도 계산
    const riskAssessment = calculateRiskLevel(weatherData, industry);
    
    // 안전 권고사항 생성
    const recommendations = generateSafetyRecommendations(riskAssessment, industry);

    // 위험 예측 데이터 저장
    const { error: insertError } = await supabase
      .from('risk_predictions_2025_10_13_08_09')
      .insert({
        region,
        industry_sector: industry,
        prediction_date: new Date().toISOString().split('T')[0],
        risk_level: riskAssessment.level,
        weather_factors: {
          temperature: weatherData.main.temp,
          humidity: weatherData.main.humidity,
          wind_speed: weatherData.wind.speed,
          weather_condition: weatherData.weather[0].main,
          visibility: weatherData.visibility
        },
        safety_recommendations: recommendations
      });

    if (insertError) {
      console.error('Database insert error:', insertError);
    }

    return new Response(
      JSON.stringify({
        region,
        industry,
        riskLevel: riskAssessment.level,
        weatherFactors: {
          temperature: weatherData.main.temp,
          humidity: weatherData.main.humidity,
          wind_speed: weatherData.wind.speed,
          weather_condition: weatherData.weather[0].main
        },
        recommendations,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Weather prediction error:', error);
    return new Response(
      JSON.stringify({ error: 'Weather prediction failed', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generateMockWeatherData(region: string, industry: string) {
  const mockData = {
    riskLevel: Math.floor(Math.random() * 5) + 1,
    weatherFactors: {
      temperature: Math.floor(Math.random() * 20) + 15,
      humidity: Math.floor(Math.random() * 40) + 40,
      wind_speed: Math.floor(Math.random() * 30) + 5,
      weather_condition: 'Clear'
    },
    recommendations: {
      ko: '현재 기상 조건을 고려한 안전 수칙을 준수하세요.',
      actions: ['정기적인 휴식', '수분 보충', '안전장비 착용']
    }
  };

  return mockData;
}

function calculateRiskLevel(weatherData: any, industry: string): { level: number; factors: string[] } {
  let riskLevel = 1;
  const factors = [];

  const temp = weatherData.main.temp;
  const windSpeed = weatherData.wind.speed;
  const humidity = weatherData.main.humidity;

  // 온도 기반 위험도
  if (temp > 35) {
    riskLevel = Math.max(riskLevel, 5);
    factors.push('극심한 폭염');
  } else if (temp > 30) {
    riskLevel = Math.max(riskLevel, 4);
    factors.push('폭염');
  } else if (temp < 0) {
    riskLevel = Math.max(riskLevel, 3);
    factors.push('한파');
  }

  // 풍속 기반 위험도
  if (windSpeed > 20) {
    riskLevel = Math.max(riskLevel, 4);
    factors.push('강풍');
  } else if (windSpeed > 15) {
    riskLevel = Math.max(riskLevel, 3);
    factors.push('바람');
  }

  // 산업별 추가 위험 요소
  if (industry === 'fishery') {
    if (windSpeed > 15) {
      riskLevel = Math.max(riskLevel, 4);
      factors.push('해상 위험');
    }
  }

  return { level: riskLevel, factors };
}

function generateSafetyRecommendations(riskAssessment: any, industry: string) {
  const recommendations = {
    ko: '',
    actions: [] as string[]
  };

  if (riskAssessment.level >= 4) {
    recommendations.ko = '높은 위험도로 인해 작업 중단을 권장합니다.';
    recommendations.actions = ['작업 중단', '안전한 곳으로 대피', '응급연락망 확인'];
  } else if (riskAssessment.level >= 3) {
    recommendations.ko = '주의가 필요한 기상 조건입니다.';
    recommendations.actions = ['작업 시간 단축', '안전장비 착용', '정기 휴식'];
  } else {
    recommendations.ko = '안전한 작업 조건입니다.';
    recommendations.actions = ['기본 안전수칙 준수', '수분 보충', '정기 점검'];
  }

  return recommendations;
}