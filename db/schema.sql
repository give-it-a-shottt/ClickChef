-- 찰칵셰프 DB 스키마 (로컬 Docker PostgreSQL과 Neon에서 같은 파일을 써요)
-- scripts/data/seed_db.py가 이 파일을 먼저 실행하고 레시피를 넣어요.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS recipes (
  id               integer PRIMARY KEY,         -- 식약처 RCP_SEQ
  name             text        NOT NULL,
  summary          text        NOT NULL DEFAULT '',
  category         text        NOT NULL DEFAULT '',   -- 요리 종류 (밥, 국&찌개, 반찬, 일품, 후식)
  method           text        NOT NULL DEFAULT '',   -- 조리 방법 (볶기, 끓이기 …)
  time_min         integer     NOT NULL DEFAULT 30,
  servings         integer     NOT NULL DEFAULT 2,
  difficulty       text        NOT NULL DEFAULT '보통' CHECK (difficulty IN ('쉬움', '보통', '어려움')),
  kcal             integer,
  image_url        text,
  main_ingredients text[]      NOT NULL DEFAULT '{}', -- 주재료 이름 (추천 매칭용)
  seasonings       text[]      NOT NULL DEFAULT '{}', -- 양념 이름
  ingredients      jsonb       NOT NULL DEFAULT '[]', -- [{name, amount, kind}]
  steps            jsonb       NOT NULL DEFAULT '[]', -- [{order, text, ingredients, timerSec, imageUrl}]
  tip              text,
  source           text        NOT NULL DEFAULT 'mfds',
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- "내 재료와 겹치는 레시피" (main_ingredients && 내 재료) 를 빠르게 찾는 인덱스
CREATE INDEX IF NOT EXISTS recipes_main_ingredients_gin ON recipes USING gin (main_ingredients);
-- 요리 이름 부분 검색·오타 검색 (ILIKE, similarity)
CREATE INDEX IF NOT EXISTS recipes_name_trgm ON recipes USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS recipes_category_time ON recipes (category, time_min);

-- 사진 인식 IP별 하루 횟수 (서버리스라 메모리 대신 DB에 세요)
CREATE TABLE IF NOT EXISTS rate_limits (
  ip    text    NOT NULL,
  day   date    NOT NULL,
  count integer NOT NULL DEFAULT 0,
  PRIMARY KEY (ip, day)
);
