import math
import os
from typing import Any, Dict, Optional, Tuple
import requests


class WeatherCoordinationModule:
    """AI 코디 추천 엔진을 위한 날씨 및 기온 데이터 수집 및 프롬프트 변환 모듈.

    OpenWeatherMap API 및 기상청 단기예보(위경도 <-> 격자) 변환 확장 구조를 지원합니다.
    """

    OWM_WEATHER_URL = "https://api.openweathermap.org/data/2.5/weather"
    OWM_FORECAST_URL = "https://api.openweathermap.org/data/2.5/forecast"
    OWM_GEO_REVERSE_URL = "http://api.openweathermap.org/geo/1.0/reverse"
    OWM_GEO_DIRECT_URL = "http://api.openweathermap.org/geo/1.0/direct"

    # 3.4 기온 구간별 대표 의류 및 스타일링 표준 가이드
    TEMP_STYLING_GUIDE = [
        {"min": 28.0, "max": float("inf"), "items": "민소매, 반팔, 숏팬츠, 린넨 원피스, 샌들, 통기성 우수 소재"},
        {"min": 23.0, "max": 27.99, "items": "반팔티, 얇은 셔츠, 면바지, 슬랙스, 반바지"},
        {"min": 20.0, "max": 22.99, "items": "긴팔티, 가디건, 후드티, 청바지, 면바지, 슬랙스"},
        {"min": 17.0, "max": 19.99, "items": "니트, 맨투맨, 가디건, 자켓, 청바지, 자켓 레이어드"},
        {"min": 12.0, "max": 16.99, "items": "자켓, 트렌치코트, 야상, 스타킹, 니트, 청바지"},
        {"min": 9.0, "max": 11.99, "items": "트렌치코트, 야상, 자켓, 니트, 청바지, 스타킹, 방풍 아우터"},
        {"min": 5.0, "max": 8.99, "items": "울 코트, 가죽 자켓, 히트텍, 니트, 레깅스, 경량 패딩"},
        {"min": float("-inf"), "max": 4.99, "items": "패딩, 두꺼운 코트, 목도리, 장갑, 히트텍, 방한모자, 기모 안감 제품"},
    ]

    def __init__(self, api_key: str):
        """API 키 지정 및 기본 속성 초기화."""
        if not api_key:
            raise ValueError("OpenWeatherMap API Key가 필요합니다.")
        self.api_key = api_key

    # ==========================================
    # 3.1 & 외부 연동: 위치 검색 및 Reverse Geocoding
    # ==========================================
    def reverse_geocode(self, lat: float, lon: float) -> str:
        """위도/경도 기반 행정구역(지역명) 명칭 변환."""
        params = {"lat": lat, "lon": lon, "limit": 1, "appid": self.api_key}
        try:
            resp = requests.get(self.OWM_GEO_REVERSE_URL, params=params, timeout=5)
            if resp.status_code == 200:
                geo_data = resp.json()
                if geo_data and len(geo_data) > 0:
                    local_names = geo_data[0].get("local_names", {})
                    ko_name = local_names.get("ko")
                    city_name = geo_data[0].get("name", "")
                    country = geo_data[0].get("country", "")
                    return f"{ko_name or city_name}, {country}".strip(", ")
        except Exception:
            pass
        return f"좌표({lat:.4f}, {lon:.4f})"

    def get_coords_by_query(self, location_name: str) -> Tuple[float, float, str]:
        """사용자가 임의로 지정한 검색 위치(도시/지역명)의 좌표 조회."""
        params = {"q": location_name, "limit": 1, "appid": self.api_key}
        resp = requests.get(self.OWM_GEO_DIRECT_URL, params=params, timeout=5)
        if resp.status_code != 200:
            raise Exception(f"위치 검색 실패 (HTTP {resp.status_code}): {resp.text}")

        data = resp.json()
        if not data:
            raise ValueError(f"'{location_name}' 위치를 찾을 수 없습니다.")

        lat = data[0]["lat"]
        lon = data[0]["lon"]
        local_name = data[0].get("local_names", {}).get("ko", data[0].get("name", location_name))
        return lat, lon, local_name

    # ==========================================
    # 기상청 단기예보 격자 변환 확장 유틸리티 (Lambert Conformal Conic)
    # ==========================================
    @staticmethod
    def convert_to_kma_grid(lat: float, lon: float) -> Dict[str, int]:
        """기상청 단기예보 Open API용 위경도 -> 격자(nx, ny) 변환 함수."""
        RE = 6371.00877  # 지구 반경(km)
        GRID = 5.0  # 격자 간격(km)
        SLAT1 = 30.0  # 투영 위도1(degree)
        SLAT2 = 60.0  # 투영 위도2(degree)
        OLON = 126.0  # 기준점 경도(degree)
        OLAT = 38.0  # 기준점 위도(degree)
        XO = 43  # 기준점 X좌표(GRID)
        YO = 136  # 기준점 Y좌표(GRID)

        deg2rad = math.pi / 180.0
        re = RE / GRID
        slat1 = SLAT1 * deg2rad
        slat2 = SLAT2 * deg2rad
        olon = OLON * deg2rad
        olat = OLAT * deg2rad

        sn = math.tan(math.pi * 0.25 + slat2 * 0.5) / math.tan(math.pi * 0.25 + slat1 * 0.5)
        sn = math.log(math.cos(slat1) / math.cos(slat2)) / math.log(sn)
        sf = math.tan(math.pi * 0.25 + slat1 * 0.5)
        sf = math.pow(sf, sn) * math.cos(slat1) / sn
        ro = math.tan(math.pi * 0.25 + olat * 0.5)
        ro = re * sf / math.pow(ro, sn)

        ra = math.tan(math.pi * 0.25 + (lat) * deg2rad * 0.5)
        ra = re * sf / math.pow(ra, sn)
        theta = lon * deg2rad - olon
        if theta > math.pi:
            theta -= 2.0 * math.pi
        if theta < -math.pi:
            theta += 2.0 * math.pi
        theta *= sn

        nx = math.floor(ra * math.sin(theta) + XO + 0.5)
        ny = math.floor(ro - ra * math.cos(theta) + YO + 0.5)
        return {"nx": int(nx), "ny": int(ny)}

    # ==========================================
    # 3.2 핵심 메서드: 날씨 조회 & 파싱
    # ==========================================
    def get_weather_by_coords(self, lat: float, lon: float) -> dict:
        """위경도 좌표 기준 날씨 API 호출 (HTTP 200 검증 및 예외 처리)."""
        params = {
            "lat": lat,
            "lon": lon,
            "appid": self.api_key,
            "units": "metric",
            "lang": "kr",
        }
        try:
            response = requests.get(self.OWM_WEATHER_URL, params=params, timeout=10)
        except requests.RequestException as e:
            raise Exception(f"날씨 API 네트워크 요청 실패: {e}") from e

        if response.status_code != 200:
            raise Exception(f"날씨 API 호출 실패 [Status: {response.status_code}]: {response.text}")

        return response.json()

    def get_forecast_by_coords(self, lat: float, lon: float) -> dict:
        """시간대별 예보 API 호출 (확장 사양: 출퇴근/등하교 시간 분석용)."""
        params = {
            "lat": lat,
            "lon": lon,
            "appid": self.api_key,
            "units": "metric",
            "lang": "kr",
        }
        try:
            response = requests.get(self.OWM_FORECAST_URL, params=params, timeout=10)
            if response.status_code == 200:
                return response.json()
        except Exception:
            pass
        return {}

    def parse_weather_data(self, data: dict, custom_location_name: Optional[str] = None) -> dict:
        """API 응답 파싱 및 temp_difference 자동 계산."""
        main = data.get("main", {})
        weather_list = data.get("weather", [{}])
        weather_first = weather_list[0] if weather_list else {}
        wind = data.get("wind", {})
        clouds = data.get("clouds", {})

        temp_current = float(main.get("temp", 0.0))
        temp_min = float(main.get("temp_min", temp_current))
        temp_max = float(main.get("temp_max", temp_current))
        feels_like = float(main.get("feels_like", temp_current))
        temp_difference = round(temp_max - temp_min, 1)

        weather_condition = weather_first.get("main", "Clear")
        weather_description = weather_first.get("description", "")
        humidity = int(main.get("humidity", 0))
        wind_speed = float(wind.get("speed", 0.0))

        # 강수 확률(pop) 처리: 5일/3시간 예보 혹은 rain 블록 참고
        pop = 0
        if "pop" in data:
            pop = int(float(data["pop"]) * 100)
        elif "rain" in data or "Rain" in weather_condition:
            pop = 80
        elif "Snow" in weather_condition:
            pop = 70

        # 자외선 지수(uv_index) 추정 (단일 날씨 엔드포인트에는 없으므로 구름양 및 날씨 기반 근사치 계산)
        cloud_pct = clouds.get("all", 0)
        estimated_uv = round(max(1.0, 9.0 - (cloud_pct / 15.0)), 1)
        if "Rain" in weather_condition or "Snow" in weather_condition:
            estimated_uv = 1.5

        location = custom_location_name or data.get("name", "알 수 없는 위치")

        return {
            "location": location,
            "temp_current": round(temp_current, 1),
            "temp_min": round(temp_min, 1),
            "temp_max": round(temp_max, 1),
            "temp_difference": temp_difference,
            "feels_like": round(feels_like, 1),
            "weather_condition": weather_condition,
            "weather_description": weather_description,
            "pop": pop,
            "humidity": humidity,
            "wind_speed": round(wind_speed, 1),
            "uv_index": estimated_uv,
        }

    # ==========================================
    # 3.4 스타일링 가이드 룩업
    # ==========================================
    def get_clothing_guide(self, temperature: float) -> str:
        """기온 구간별 대표 의류 및 스타일링 가이드 조회."""
        for guide in self.TEMP_STYLING_GUIDE:
            if guide["min"] <= temperature <= guide["max"]:
                return guide["items"]
        return "기본 캐주얼 웨어"

    # ==========================================
    # 3.3 코디 제약조건 및 3.5 확장 사양 (개인화, TPO, 시간대별 예보)
    # ==========================================
    def generate_ai_prompt_context(
        self,
        weather_info: dict,
        user_preference: Optional[Dict[str, Any]] = None,
        tpo_info: Optional[Dict[str, Any]] = None,
        forecast_data: Optional[Dict[str, Any]] = None,
    ) -> str:
        """날씨 정보와 코디 제약조건, 개인화 옵션, TPO를 결합한 AI 주입용 구조화 프롬프트 생성."""
        # 1. 개인화 체감 기온 Offset 반영 (3.5 확장)
        # 예: user_preference = {"cold_sensitivity": "high", "heat_sensitivity": "normal", "temp_offset": 2.0}
        adjusted_feels_like = weather_info["feels_like"]
        offset_note = ""
        if user_preference:
            temp_offset = user_preference.get("temp_offset", 0.0)
            if user_preference.get("heat_sensitivity") == "high":
                temp_offset += 2.0
            elif user_preference.get("cold_sensitivity") == "high":
                temp_offset -= 2.0

            if temp_offset != 0.0:
                adjusted_feels_like = round(adjusted_feels_like + temp_offset, 1)
                offset_note = f" (사용자 체감 특성 반영 오프셋: {temp_offset:+.1f}°C -> 최종 체감 {adjusted_feels_like}°C)"

        # 2. 기온별 표준 스타일링 가이드 추천 의류 추출 (보정된 체감 온도 기준)
        base_styling_guide = self.get_clothing_guide(adjusted_feels_like)

        # 3. 코디 필수 제약조건 규칙 (3.3 요구사항)
        constraints = []
        if weather_info.get("temp_difference", 0) >= 8:
            constraints.append("일교차가 심하므로 탈착이 용이한 카디건이나 재킷 등 아우터 필수 포함.")

        if "Rain" in weather_info.get("weather_condition", "") or weather_info.get("pop", 0) >= 60:
            constraints.append("비가 오므로 레인부츠, 밝은 색상 지양, 신발 및 바지 단 방수 고려.")

        if adjusted_feels_like >= 28:
            constraints.append("덥고 습한 날씨이므로 린넨, 쿨링 소재의 얇은 옷차림 추천.")
        elif adjusted_feels_like <= 5:
            constraints.append("추운 날씨이므로 패딩, 코트, 목도리 등 방한 기모/울 소재 추천.")

        # 추가 기상 조건 (바람/자외선)
        if weather_info.get("wind_speed", 0.0) >= 6.0:
            constraints.append(f"강풍(풍속 {weather_info['wind_speed']}m/s)이 불므로 방풍 기능성 아우터 착용 권장.")
        if weather_info.get("uv_index", 0.0) >= 7.0:
            constraints.append(f"자외선 지수가 높음({weather_info['uv_index']}) 단계이므로 모자, 선글라스, 자외선 차단 겉옷 추천.")

        # 4. 시간대별 예보 연동 (3.5 확장)
        commute_alert = ""
        if forecast_data and "list" in forecast_data:
            # 향후 12시간 내 최저/최고 기온 분석
            upcoming_temps = [item["main"]["temp"] for item in forecast_data["list"][:4]]
            if upcoming_temps:
                f_min, f_max = min(upcoming_temps), max(upcoming_temps)
                if (f_max - f_min) >= 7.0:
                    commute_alert = f"출퇴근/등하교 시간대 기온차({round(f_max - f_min, 1)}°C)가 크므로 가벼운 외투를 꼭 소지하세요."

        if commute_alert:
            constraints.append(commute_alert)

        # 5. TPO 결합 (3.5 확장)
        tpo_context = ""
        if tpo_info:
            schedule = tpo_info.get("schedule", "일상 활동")
            indoor_outdoor = tpo_info.get("ratio", "실내외 혼합")
            dress_code = tpo_info.get("dress_code", "캐주얼")
            tpo_context = f"- 활동 일정/TPO: {schedule} (실내외 비율: {indoor_outdoor}, 스타일: {dress_code})"

        # 6. 최종 AI 프롬프트 컨텍스트 조합
        constraints_str = "\n".join([f"  * {c}" for c in constraints]) if constraints else "  * 특별한 기상 이상 없음. 표준 가이드 준수."

        prompt_context = f"""[오늘의 기상 분석 & 코디 추천 가이드 컨텍스트]
1. 위치: {weather_info['location']}
2. 기온 요약:
  - 현재 기온: {weather_info['temp_current']}°C (최저 {weather_info['temp_min']}°C / 최고 {weather_info['temp_max']}°C, 일교차: {weather_info['temp_difference']}°C)
  - 체감 온도: {weather_info['feels_like']}°C{offset_note}
3. 기상 세부:
  - 상태: {weather_info['weather_condition']} ({weather_info['weather_description']})
  - 강수 확률: {weather_info['pop']}%
  - 습도: {weather_info['humidity']}% | 풍속: {weather_info['wind_speed']}m/s | 자외선 지수: {weather_info['uv_index']}
4. 기온별 표준 추천 의류:
  - {base_styling_guide}
5. 필수 코디 제약조건 및 주의사항:
{constraints_str}
"""
        if tpo_context:
            prompt_context += f"6. 사용자 상황(TPO):\n  {tpo_context}\n"

        return prompt_context.strip()


# 호환성을 위한 별칭 지정
DailyWeatherModule = WeatherCoordinationModule


if __name__ == "__main__":
    import json

    print("==================================================")
    print("AI 코디 추천 날씨 수집 모듈 (WeatherCoordinationModule) 테스트")
    print("==================================================")

    # API 키 환경 변수 확인 (없을 경우 데모/모의 테스트 지원)
    api_key = os.environ.get("OPENWEATHERMAP_API_KEY", "DEMO_KEY")

    # 서울 시청 기준 좌표
    SEOUL_LAT = 37.5665
    SEOUL_LON = 126.9780

    module = WeatherCoordinationModule(api_key=api_key)

    # 기상청 단기예보 격자 좌표 변환 테스트
    kma_grid = WeatherCoordinationModule.convert_to_kma_grid(SEOUL_LAT, SEOUL_LON)
    print(f"\n[1] 기상청 단기예보 격자 변환: 위경도({SEOUL_LAT}, {SEOUL_LON}) -> 격자 {kma_grid}")

    # 실제 API 호출 또는 모의 응답 시뮬레이션
    if api_key != "DEMO_KEY":
        try:
            print("\n[2] 실제 OpenWeatherMap API 호출 중...")
            raw_weather = module.get_weather_by_coords(SEOUL_LAT, SEOUL_LON)
            location_name = module.reverse_geocode(SEOUL_LAT, SEOUL_LON)
            weather_data = module.parse_weather_data(raw_weather, custom_location_name=location_name)
        except Exception as e:
            print(f"API 호출 중 오류 발생: {e}")
            weather_data = None
    else:
        print("\n[2] 데모 모드로 모의 API 응답(Mock Response)을 파싱합니다.")
        mock_api_response = {
            "coord": {"lon": 126.978, "lat": 37.5665},
            "weather": [{"id": 500, "main": "Rain", "description": "가벼운 비", "icon": "10d"}],
            "main": {
                "temp": 14.5,
                "feels_like": 13.0,
                "temp_min": 8.0,
                "temp_max": 18.0,
                "humidity": 78,
            },
            "wind": {"speed": 4.5},
            "clouds": {"all": 85},
            "name": "Seoul",
        }
        weather_data = module.parse_weather_data(mock_api_response, custom_location_name="서울특별시 중구")

    if weather_data:
        print("\n[3] 파싱된 날씨 데이터:")
        print(json.dumps(weather_data, indent=2, ensure_ascii=False))

        # 확장 사양: 개인화 및 TPO 설정
        user_pref = {"cold_sensitivity": "high", "heat_sensitivity": "normal"}
        tpo_example = {
            "schedule": "오전 출근 및 저녁 야외 약속",
            "ratio": "실내 70% / 실외 30%",
            "dress_code": "비즈니스 캐주얼",
        }

        # 4. AI 주입용 프롬프트 생성
        prompt = module.generate_ai_prompt_context(
            weather_info=weather_data,
            user_preference=user_pref,
            tpo_info=tpo_example,
        )

        print("\n[4] 생성된 AI 프롬프트 컨텍스트:\n")
        print("--------------------------------------------------")
        print(prompt)
        print("--------------------------------------------------")
