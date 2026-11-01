CREATE TABLE IF NOT EXISTS users (
    user_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    preferred_fit VARCHAR(20) DEFAULT 'REGULAR',
    personal_color VARCHAR(30)
);

CREATE TABLE IF NOT EXISTS occasion_categories (
    category_id VARCHAR(30) PRIMARY KEY,
    category_name VARCHAR(50) NOT NULL,
    description TEXT
);

INSERT INTO occasion_categories (category_id, category_name, description) VALUES
('WORK_BUSINESS', '출근 및 비즈니스', '대면 미팅, 일반 사무실, 자율 복장, 외근'),
('AFTER_WORK', '퇴근 후 모임', '캐주얼 술자리, 고급 레스토랑, 문화생활'),
('WEEKEND_CASUAL', '휴일 및 데일리', '원마일웨어, 데이트, 나들이, 야외활동'),
('FORMAL_EVENT', '경조사 및 공식 행사', '결혼식 하객, 장례식/조문, 가족연회, 시상식'),
('SPECIAL_ANNIVERSARY', '기념일 및 특별한 날', '연인 기념일, 생일파티, 승진/합격 축하')
ON CONFLICT (category_id) DO NOTHING;

CREATE TABLE IF NOT EXISTS recommendation_matrix (
    matrix_id SERIAL PRIMARY KEY,
    occasion_type VARCHAR(50) NOT NULL UNIQUE,
    default_formality INT NOT NULL CHECK (default_formality BETWEEN 1 AND 5),
    recommended_dress_code VARCHAR(100) NOT NULL,
    base_items TEXT NOT NULL,
    outerwear TEXT,
    footwear_accessories TEXT NOT NULL,
    avoid_items TEXT NOT NULL
);

INSERT INTO recommendation_matrix 
(occasion_type, default_formality, recommended_dress_code, base_items, outerwear, footwear_accessories, avoid_items) VALUES
('WORK_MEETING', 4, 'Business Formal / Smart Executive', '테일러드 슬랙스, 드레스 셔츠', '네이비 테일러드 싱글 블레이저', '옥스포드/더비 가죽 구두, 가죽 토트백', '샌들/슬리퍼, 찢어진 데님, 네온 컬러 상의'),
('WORK_OFFICE', 3, 'Smart Casual', '테이퍼드 슬랙스, 옥스포드 셔츠 or 니트 폴로', '세미 언스트럭처드 블레이저, 파인게이지 가디건', '페니 로퍼 or 클린 레더 스니커즈', '과도한 데미지 진, 그래픽 티셔츠'),
('AFTER_WORK_DINNER', 2, 'Day-to-Night Convertible Casual', '치노 팬츠 or 슬랙스, 이너 실켓 티셔츠', '오버사이즈 캐주얼 블레이저', '스웨이드 로퍼 or 가죽 스니커즈', '경직된 풀 수트, 슬리퍼'),
('WEDDING_GUEST', 4, 'Semi-Formal / Clean Guest Look', '차콜/네이비 셋업 슬랙스, 모크넥 니트 or 셔츠', '미니멀 셋업 자켓 or 싱글 코트', '단정한 더비 슈즈 or 테슬 로퍼', '올 화이트 룩, 과도한 원색/형광, 츄리닝'),
('FUNERAL', 5, 'Dark Formal', '다크 무지 블랙 슬랙스, 플레인 화이트 셔츠', '블랙 싱글 수트 자켓 or 다크 오버코트', '블랙 플레인토 구두, 다크 삭스', '원색 의류, 맨발 노출, 샌들, 모자'),
('WEEKEND_OUTING', 1, 'Relaxed Daily Casual', '편안한 와이드 치노/데님, 베이직 맨투맨', '라이트 바람막이 or 가디건', '쿠셔닝 스니커즈, 백팩', '불편한 포멀 드레스 슈즈, 넥타이'),
('SPECIAL_ANNIVERSARY', 3, 'Romantic Smart Chic', '실키 오픈카라 셔츠, 슬림 테이퍼드 슬랙스', '클래식 울 블레이저 or 맥코트', '프리미엄 레더 첼시부츠 or 로퍼', '늘어난 티셔츠, 트레이닝복')
ON CONFLICT (occasion_type) DO NOTHING;

CREATE TABLE IF NOT EXISTS user_schedules (
    schedule_id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) REFERENCES users(user_id),
    primary_occasion VARCHAR(50) NOT NULL,
    secondary_occasion VARCHAR(50),
    formality_level INT NOT NULL CHECK (formality_level BETWEEN 1 AND 5),
    location_type VARCHAR(50) NOT NULL,
    min_temp INT,
    max_temp INT,
    precipitation_prob INT,
    fine_dust_level VARCHAR(20),
    mobility_type VARCHAR(30),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS recommendation_logs (
    log_id SERIAL PRIMARY KEY,
    schedule_id INT REFERENCES user_schedules(schedule_id),
    recommended_dress_code VARCHAR(100) NOT NULL,
    base_items JSONB NOT NULL,
    outerwear VARCHAR(150),
    footwear VARCHAR(150),
    transition_tip TEXT,
    avoid_items JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
