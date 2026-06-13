-- Chạy file này để tạo bảng:
-- psql -U postgres -d diadiemyeuthich -f schema.sql

CREATE TABLE IF NOT EXISTS places (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(255)     NOT NULL,
  category    VARCHAR(50)      NOT NULL,
  tags        JSONB            NOT NULL DEFAULT '[]',
  rating      DECIMAL(3,1)     NOT NULL DEFAULT 0,
  reviews     INTEGER          NOT NULL DEFAULT 0,
  distance    DECIMAL(10,3)    NOT NULL DEFAULT 0,
  price       VARCHAR(10)      NOT NULL DEFAULT '$$',
  address     TEXT             NOT NULL DEFAULT '',
  hours       VARCHAR(100)     NOT NULL DEFAULT '',
  phone       VARCHAR(50)      NOT NULL DEFAULT '',
  description TEXT             NOT NULL DEFAULT '',
  images      JSONB            NOT NULL DEFAULT '[]',
  lat         DECIMAL(10,8)    NOT NULL,
  lng         DECIMAL(11,8)    NOT NULL,
  created_at  TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admins (
  id             SERIAL PRIMARY KEY,
  username       VARCHAR(100)  UNIQUE NOT NULL,
  password_hash  VARCHAR(255)  NOT NULL,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Index để tìm kiếm nhanh theo category
CREATE INDEX IF NOT EXISTS idx_places_category ON places(category);
