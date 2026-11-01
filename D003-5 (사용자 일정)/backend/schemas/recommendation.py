from typing import List, Optional
from enum import Enum
from pydantic import BaseModel, Field

class OccasionDetailType(str, Enum):
    WORK_MEETING = "WORK_MEETING"
    WORK_OFFICE = "WORK_OFFICE"
    WORK_CASUAL = "WORK_CASUAL"
    WORK_FIELD = "WORK_FIELD"
    AFTER_WORK_PUB = "AFTER_WORK_PUB"
    AFTER_WORK_DINNER = "AFTER_WORK_DINNER"
    AFTER_WORK_CULTURE = "AFTER_WORK_CULTURE"
    WEEKEND_DAILY = "WEEKEND_DAILY"
    WEEKEND_DATE = "WEEKEND_DATE"
    WEEKEND_OUTING = "WEEKEND_OUTING"
    WEEKEND_OUTDOOR = "WEEKEND_OUTDOOR"
    WEDDING_GUEST = "WEDDING_GUEST"
    FUNERAL = "FUNERAL"
    FAMILY_GATHERING = "FAMILY_GATHERING"
    FORMAL_CEREMONY = "FORMAL_CEREMONY"
    SPECIAL_ANNIVERSARY = "SPECIAL_ANNIVERSARY"
    BIRTHDAY_PARTY = "BIRTHDAY_PARTY"
    CELEBRATION_EVENT = "CELEBRATION_EVENT"

class MobilityType(str, Enum):
    WALKING = "WALKING"
    PUBLIC_TRANSIT = "PUBLIC_TRANSIT"
    CAR = "CAR"

class PreferredFit(str, Enum):
    OVERFIT = "OVERFIT"
    REGULAR = "REGULAR"
    SLIMFIT = "SLIMFIT"

class PersonalColor(str, Enum):
    WARM_TONE = "Warm Tone"
    COOL_TONE = "Cool Tone"

class WeatherInfo(BaseModel):
    min_temp: int = Field(default=12)
    max_temp: int = Field(default=22)
    precipitation_prob: int = Field(default=20)
    fine_dust_level: str = Field(default="보통")

class UserPreferences(BaseModel):
    preferred_fit: PreferredFit = PreferredFit.REGULAR
    personal_color: Optional[PersonalColor] = PersonalColor.WARM_TONE

class UserScheduleRequest(BaseModel):
    user_id: str = Field(default="usr_1001")
    primary_occasion: OccasionDetailType
    secondary_occasion: Optional[OccasionDetailType] = None
    formality_level: int = Field(default=3, ge=1, le=5)
    location_type: str = Field(default="INDOOR_OFFICE_THEN_RESTAURANT")
    weather: WeatherInfo
    mobility: MobilityType = MobilityType.PUBLIC_TRANSIT
    preferences: UserPreferences = Field(default_factory=UserPreferences)

class UserScheduleSummary(BaseModel):
    primary_occasion: str
    secondary_occasion: Optional[str] = None
    formality_level: int
    location: str

class RecommendedStyleRule(BaseModel):
    dress_code: str
    base_items: List[str]
    outerwear: str
    footwear: str
    transition_tip: Optional[str] = None
    avoid_items: List[str]

class RecommendationResponse(BaseModel):
    user_schedule: UserScheduleSummary
    recommended_style_rule: RecommendedStyleRule
