-- Migration: Create Daily Fit Archive tables
-- Date: 2026-11-01

CREATE TABLE IF NOT EXISTS daily_fit_archives (
    archive_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    fit_date DATE NOT NULL,
    title VARCHAR(100),
    fitting_snapshot_url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500) NOT NULL,
    is_worn_in_reality BOOLEAN DEFAULT TRUE,
    privacy_level VARCHAR(20) DEFAULT 'PRIVATE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_fit_date UNIQUE (user_id, fit_date)
);

CREATE TABLE IF NOT EXISTS archive_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    archive_id UUID NOT NULL REFERENCES daily_fit_archives(archive_id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    item_source VARCHAR(20) NOT NULL,
    product_id VARCHAR(100),
    item_name VARCHAR(150) NOT NULL,
    brand VARCHAR(100),
    color VARCHAR(50),
    size VARCHAR(20),
    bounding_box JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fit_environment_contexts (
    context_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    archive_id UUID NOT NULL UNIQUE REFERENCES daily_fit_archives(archive_id) ON DELETE CASCADE,
    temperature_min NUMERIC(4, 1),
    temperature_max NUMERIC(4, 1),
    weather_condition VARCHAR(50),
    tpo_category VARCHAR(50),
    location_city VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS fit_user_feedback (
    feedback_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    archive_id UUID NOT NULL UNIQUE REFERENCES daily_fit_archives(archive_id) ON DELETE CASCADE,
    satisfaction_score INT CHECK (satisfaction_score BETWEEN 1 AND 5),
    fit_rating VARCHAR(50),
    memo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_archives_user_date ON daily_fit_archives(user_id, fit_date);
CREATE INDEX IF NOT EXISTS idx_archive_items_archive ON archive_items(archive_id);
CREATE INDEX IF NOT EXISTS idx_env_context_archive ON fit_environment_contexts(archive_id);
CREATE INDEX IF NOT EXISTS idx_feedback_archive ON fit_user_feedback(archive_id);

