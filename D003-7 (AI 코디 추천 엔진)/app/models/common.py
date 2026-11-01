from enum import Enum


class Occasion(str, Enum):
    ALUMNI_GATHERING = "ALUMNI_GATHERING"  # 동창회
    FAMILY_EVENT = "FAMILY_EVENT"          # 경조사 / 가족 행사
    WORK = "WORK"                          # 비즈니스 / 출근
    TRAVEL = "TRAVEL"                      # 여행 / 나들이
    CASUAL = "CASUAL"                      # 일상 / 편안한 외출
    FORMAL_DINNER = "FORMAL_DINNER"        # 격식 있는 식사 / 모임


class FormalityLevel(int, Enum):
    CASUAL = 1
    SEMI_CASUAL = 2
    SMART_CASUAL = 3
    FORMAL = 4
    VERY_FORMAL = 5


class WeatherCondition(str, Enum):
    CLEAR = "CLEAR"
    CLOUDY = "CLOUDY"
    RAIN = "RAIN"
    SNOW = "SNOW"
    WINDY = "WINDY"


class Category(str, Enum):
    OUTER = "OUTER"
    TOP = "TOP"
    BOTTOM = "BOTTOM"
    SHOES = "SHOES"
    ACCESSORY = "ACCESSORY"


class Subcategory(str, Enum):
    # OUTER
    CARDIGAN = "CARDIGAN"
    LONG_CARDIGAN = "LONG_CARDIGAN"
    JACKET = "JACKET"
    TRENCH_COAT = "TRENCH_COAT"
    COAT = "COAT"
    HEAVY_COAT = "HEAVY_COAT"
    PADDING = "PADDING"
    DOWN_PADDING = "DOWN_PADDING"

    # TOP
    BLOUSE = "BLOUSE"
    KNIT = "KNIT"
    SHIRT = "SHIRT"
    T_SHIRT = "T_SHIRT"
    GRAPHIC_TEE = "GRAPHIC_TEE"
    HOODIE = "HOODIE"
    CROP_TOP = "CROP_TOP"
    SLEEVELESS = "SLEEVELESS"

    # BOTTOM
    SLACKS = "SLACKS"
    WIDE_SLACKS = "WIDE_SLACKS"
    PANTS = "PANTS"
    SKIRT = "SKIRT"
    PLEATED_SKIRT = "PLEATED_SKIRT"
    JEANS = "JEANS"
    RIPPED_JEANS = "RIPPED_JEANS"
    SHORT_PANTS = "SHORT_PANTS"
    TRACKSUIT = "TRACKSUIT"
    SWEATPANTS = "SWEATPANTS"

    # SHOES
    LOAFER = "LOAFER"
    PUMPS = "PUMPS"
    FLAT_SHOES = "FLAT_SHOES"
    BOOTS = "BOOTS"
    ANKLE_BOOTS = "ANKLE_BOOTS"
    SNEAKERS = "SNEAKERS"
    RUNNING_SHOES = "RUNNING_SHOES"
    SANDALS = "SANDALS"
    SLIPPERS = "SLIPPERS"

    # ACCESSORY
    SCARF = "SCARF"
    SILK_SCARF = "SILK_SCARF"
    BROOCH = "BROOCH"
    BAG = "BAG"
    TOTE_BAG = "TOTE_BAG"
    CAP = "CAP"
    WINTER_GLOVES = "WINTER_GLOVES"


class FitType(str, Enum):
    LOOSE = "LOOSE"
    A_LINE = "A_LINE"
    H_LINE = "H_LINE"
    WIDE = "WIDE"
    REGULAR = "REGULAR"
    STRAIGHT = "STRAIGHT"
    SLIM = "SLIM"
    OVERSIZED = "OVERSIZED"
    BODYCON = "BODYCON"
    CROP = "CROP"
    EXCESSIVE_CROP_TOP = "EXCESSIVE_CROP_TOP"
    FIT_AND_FLARE = "FIT_AND_FLARE"
    FREE = "FREE"


class MaterialType(str, Enum):
    CASHMERE = "CASHMERE"
    SILK = "SILK"
    SILK_100 = "SILK_100"
    WOOL = "WOOL"
    HEAVY_WOOL = "HEAVY_WOOL"
    LINEN = "LINEN"
    SEERSUCKER = "SEERSUCKER"
    THIN_MESH = "THIN_MESH"
    DOWN_PADDING = "DOWN_PADDING"
    FLEECE = "FLEECE"
    COTTON = "COTTON"
    DENIM = "DENIM"
    LEATHER = "LEATHER"
    SUEDE = "SUEDE"
    FABRIC_CANVAS = "FABRIC_CANVAS"


class Season(str, Enum):
    SPRING = "SPRING"
    SUMMER = "SUMMER"
    AUTUMN = "AUTUMN"
    WINTER = "WINTER"

