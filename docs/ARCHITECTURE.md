# 아키텍처와 설계 결정

## 한눈에 보기

```
[브라우저]
  React 19 + Vite (정적 파일, CDN)
  ├─ 서버 데이터: TanStack Query (레시피는 staleTime: Infinity)
  ├─ 앱 상태: Zustand (촬영 흐름·설정·내 기록·조리 모드·토스트)
  └─ URL 상태: React Router (레시피 id, 추천 필터·정렬, 검색어)
        │  /api/*  (같은 도메인 → CORS 없음)
        ▼
[Vercel Python 서버리스] FastAPI
  ├─ POST /api/ingredients/detect  ── Gemini (사진 → 재료, 구조화된 출력)
  ├─ POST /api/recipes/recommend   ── SQL로 후보 추림 → matcher.py로 점수
  ├─ GET  /api/recipes/{id} · ?ids= · /search · /featured
  └─ GET  /api/health
        │  psycopg 3 + 작은 연결 풀 (Neon pooled 주소)
        ▼
[Neon PostgreSQL] recipes (GIN·trigram 인덱스), rate_limits

[오프라인 데이터 파이프라인 — 로컬에서 한 번]
  식약처 COOKRCP01 → 규칙 정리 → LLM 보강(EXAONE/Gemini) → recipes.json → DB
```

## 결정과 이유

### 1. Vite (Next.js 대신)
- 로그인·SEO가 필요 없는 앱이라 서버 렌더링 이득이 작아요.
- 정적 파일로 빌드돼 CDN에 그대로 올라가고, 서버 비용·콜드 스타트가 화면 표시에 영향을 주지 않아요.
- 화면마다 코드를 나눠(lazy route) 첫 화면 JS를 줄였어요.

### 2. Vercel + Neon (Cloud Run 대신)
- 카드 등록 없이 무료로 운영하는 게 조건이었어요.
- 프론트와 API가 한 프로젝트·한 도메인이라 CORS 설정이 없고, `main` 푸시가 곧 배포예요.
- 서버리스 제약(요청 본문 4.5MB, 인스턴스 여러 개)을 이렇게 풀었어요.
  - 사진은 브라우저에서 1280px JPEG로 줄여 보내요.
  - 사진 인식 횟수 제한은 메모리가 아니라 DB(`rate_limits`)에 세요. IP는 해시로만 저장해요.
- Neon에 서울 리전이 없어서 Neon과 함수를 모두 싱가포르에 두어 DB 왕복을 줄였어요.

### 3. 추천: SQL로 추리고 Python으로 점수 계산
- `main_ingredients && 내재료` (GIN 인덱스)로 겹치는 레시피만 먼저 가져와요. 싫어하는 재료·시간·종류·인분 필터도 SQL에서 걸러요.
- 점수 계산은 DB와 분리된 순수 함수(`matcher.py`)라서 규칙을 pytest로 바로 검증해요.
  - 점수 = 가진 주재료 ÷ 필요한 주재료
  - 기본 양념(사용자 설정)은 가진 것으로 계산
  - 없는 양념은 '부족'에 넣지 않고 점수만 조금 깎음 (양념 하나 때문에 추천이 빠지지 않게)
  - 조리 완료 후 "또 만들래요"를 준 요리와 같은 종류는 조금 올림

### 4. 재료 이름 맞추기를 한곳에서
- 인식 결과("계란")와 DB("달걀")가 달라도 같은 재료로 보도록 `normalize.py` 하나를 백엔드와 데이터 파이프라인이 같이 써요.
- Gemini 프롬프트에도 DB의 재료 이름 목록을 넣어서 처음부터 같은 이름으로 받아요.

### 5. LLM은 '실행 중'이 아니라 '데이터 만들 때'
- 식약처 데이터에는 조리 시간·인분·난이도·한 줄 소개·단계별 재료가 없어요. 이 값을 LLM으로 **한 번만** 만들어 DB에 넣었어요.
- 서비스 실행 중 LLM 호출은 사진 인식 하나뿐이에요. 비용과 응답 시간이 줄고, 30일마다 만료되는 EXAONE 키 때문에 서비스가 멈출 일도 없어요.
- 조리 단계 글은 원문 그대로 두고, 단계별 재료·타이머만 붙였어요. LLM 출력은 pydantic으로 검증하고 실패하면 규칙 기반 값으로 채워요.

### 6. 상태 관리 (props drilling 없음)

| 상태 | 어디에 | 이유 |
|---|---|---|
| 레시피·추천·검색 결과 | TanStack Query | 캐시·중복 요청 제거·이전 결과 유지(placeholderData). 레시피는 바뀌지 않아 다시 요청하지 않아요. PC는 카드에 마우스를 올리면 상세를 미리 받아요. |
| 촬영 흐름 (사진·인식 결과·켠 재료) | Zustand + sessionStorage | 여러 화면이 같이 쓰고, 뒤로 가기·새로고침에도 재료 목록이 남아야 해요 |
| 설정·내 기록 | Zustand + localStorage | 로그인 없이 기기에 저장. 저장소가 막힌 환경(사파리 개인정보 모드)에서도 멈추지 않게 감쌌어요 |
| 조리 모드 | Zustand | 타이머는 **종료 시각만 저장**하고, 매초 바뀌는 숫자는 타이머 컴포넌트 안에서만 다시 그려요 |
| 필터·정렬·검색어·레시피 id | URL | 공유·뒤로 가기·새로고침에 그대로 유지돼요 |

- 컴포넌트는 필요한 값만 selector로 꺼내요 (`useIsSaved(id)` → 카드 하나가 자기 찜 여부만 구독).
- React Compiler가 메모이제이션을 자동으로 해서 `useMemo`·`useCallback`을 손으로 쓰지 않았어요.
- 모바일·PC 레이아웃이 크게 달라서 `useMediaQuery`로 **한쪽만** 렌더링해요 (CSS로 숨기면 카메라 같은 무거운 화면이 두 번 마운트돼요).

### 7. 디자인 시스템 → 코드
- 피그마 변수(색 85개 × 테마 4종)를 CSS 변수로 옮기고 Tailwind v4 `@theme`에 연결했어요. 기본 팔레트를 지워서 토큰 밖의 색은 쓸 수 없어요.
- `html[data-theme]`만 바꾸면 Light·Ivory·Dark·Warm Dark가 바뀌어요. 첫 화면 전에 저장된 테마를 적용해 깜빡임이 없어요.
- 로고는 테마에 따라 글자색이 바뀌는 SVG 컴포넌트, 아이콘은 Phosphor(쓰는 것만 번들).

### 8. 웹에서 카메라
- `getUserMedia`로 디자인한 촬영 화면(뷰파인더·셔터·플래시·전환)을 그대로 구현했어요.
- 앱 안 브라우저처럼 카메라가 막히면 `<input capture>`로 폰 기본 카메라를 열어요.
- 조리 중 화면 꺼짐은 Screen Wake Lock API로 막고, 탭에 돌아오면 다시 요청해요.

## 테스트
- 백엔드 pytest 23개: 일치도 규칙(양념·싫어하는 재료·정렬·모드), API 응답 형식, 동의어, 인식 후처리(가짜 Gemini 응답)
- GitHub Actions: 프론트 lint·타입 검사·빌드, 백엔드 PostgreSQL 서비스 위에서 pytest

## 다음에 할 수 있는 것
- 카카오 로그인 + 찜 동기화 (Neon에 users·saved 테이블)
- PC ↔ 폰 사진 넘기기 (QR에 세션 id를 담고 폰 업로드를 PC가 받기)
- 술 → 안주 추천 서비스와 레시피 DB 공유
