# 실행·배포 가이드

찰칵셰프를 로컬에서 실행하고 **Vercel + Neon**(카드 등록 없음, 무료)에 배포하는 순서예요.

```
브라우저 ──► Vercel (Hobby, 무료)
              ├─ frontend 서비스: Vite 빌드 → 전 세계 CDN
              └─ /api/** ──► backend 서비스: FastAPI (Python 서버리스, 싱가포르 sin1)
                               ├─ Neon PostgreSQL (싱가포르): 레시피
                               └─ Gemini API: 사진 → 재료
```

---

## 1. 로컬 실행

필요한 것: Node 22, Python 3.12 이상, Docker

```bash
# 0) 환경변수 (처음 한 번)
cp .env.example .env            # 키가 없어도 VISION_MOCK=1로 전체 흐름을 테스트할 수 있어요

# 1) DB (로컬 PostgreSQL) + 샘플 레시피 12개
docker compose up -d
python -m venv backend/.venv
backend/.venv/Scripts/pip install -r backend/requirements-dev.txt     # macOS/Linux: backend/.venv/bin/pip
backend/.venv/Scripts/python scripts/data/seed_db.py data/fixtures/recipes.sample.json

# 2) 백엔드 (http://localhost:8000/api/docs)
cd backend && .venv/Scripts/python -m uvicorn main:app --reload --port 8000

# 3) 프론트엔드 (http://localhost:5173) — /api 요청은 8000으로 넘어가요
cd frontend && npm ci && npm run dev
```

테스트: `cd backend && .venv/Scripts/python -m pytest -q` (DB가 켜져 있어야 API 테스트까지 돌아요)

> 폰에서 카메라를 테스트하려면 HTTPS가 필요해요. 로컬에서는 `npm run dev -- --host` 후 같은 와이파이의 폰으로 접속하면 앨범 선택은 되지만, 카메라 미리보기는 배포한 주소(https)에서 확인하세요.

---

## 2. 키 준비

| 키 | 어디서 | 비용 | 쓰는 곳 |
|---|---|---|---|
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/apikey) → Create API key | 무료 (결제 연결 안 함) | 사진 → 재료 인식 (서비스 실행 중) |
| `MFDS_API_KEY` | [식품안전나라 공공데이터 활용](https://www.foodsafetykorea.go.kr/api/main.do) → 회원가입 → 인증키 신청 | 무료 | 레시피 원본 수집 (한 번) |
| `EXAONE_API_KEY` | [docs.exaone.ai](https://docs.exaone.ai) | 무료, **30일마다 만료** | 레시피 보강 (한 번) |

- Gemini 키는 **결제를 연결하지 않은 프로젝트**에서 만들어 주세요. 그러면 무료 한도만 쓰고, 한도를 넘으면 요금 대신 429 오류가 나요.
- Gemini 무료 등급은 Google이 입력을 서비스 개선에 쓸 수 있어요. 그래서 개인정보처리방침에 적어 두었어요.
- 키는 `.env`(커밋 안 됨)와 Vercel 환경변수에만 넣어요. **프론트엔드 코드에는 절대 넣지 않아요.**

키를 받은 뒤 바로 확인:

```bash
backend/.venv/Scripts/python scripts/try_gemini.py 냉장고사진.jpg
```

---

## 3. 레시피 데이터 만들기 (로컬에서 한 번)

```bash
PY=backend/.venv/Scripts/python
$PY scripts/data/fetch_mfds.py                 # 식약처 레시피 1,100여 건 → data/raw/ (커밋 안 됨)
$PY scripts/data/normalize.py                  # 규칙으로 1차 정리
$PY scripts/data/enrich.py --limit 5           # LLM 보강을 5개만 먼저 시험
$PY scripts/data/enrich.py                     # 전체 (중간에 멈춰도 다시 실행하면 이어서)
$PY scripts/data/build.py                      # → data/recipes.json (커밋해요)
$PY scripts/data/seed_db.py --replace          # 로컬 DB에 넣기
```

- 보강은 기본이 EXAONE이에요. Gemini로 하려면 `enrich.py --provider gemini`, `build.py --provider gemini`.
- 보강이 실패한 레시피는 규칙 기반 값(시간·난이도 어림)으로 채워져요.
- 이미지는 식약처 서버의 https 주소를 그대로 써요. 못 불러오면 화면에서 요리 종류별 일러스트로 바뀌어요.

---

## 4. Vercel + Neon 배포

### 4-1. Vercel 프로젝트 만들기
1. [vercel.com](https://vercel.com) → **Continue with GitHub** (카드 등록 없음, Hobby 플랜)
2. **Add New → Project → `ClickChef` 저장소 Import**
3. 루트의 `vercel.json`이 frontend·backend 두 서비스를 알려 줘요. Framework·Root Directory는 따로 바꾸지 않아요.

### 4-2. Neon 연결
1. Vercel 프로젝트 → **Storage → Create Database → Neon (Postgres)**
2. 리전은 **Singapore (aws-ap-southeast-1)** — Neon에는 서울 리전이 없어서 가장 가까운 곳이에요.
3. 연결하면 `DATABASE_URL`(pooled 주소)이 환경변수로 자동 등록돼요.

### 4-3. 환경변수 (Settings → Environment Variables)

| 이름 | 값 |
|---|---|
| `GEMINI_API_KEY` | AI Studio 키 |
| `GEMINI_MODEL` | `gemini-3.5-flash-lite` (빠르고 무료 사용자가 많아도 잘 응답해요) |
| `GEMINI_FALLBACK_MODEL` | `gemini-3.8-flash` (기본 모델이 혼잡·한도 초과면 자동으로 이 모델로) |
| `VISION_MOCK` | `0` |
| `DETECT_DAILY_LIMIT` | `30` |
| `RATE_LIMIT_SALT` | 아무 긴 문자열 (IP 해시용) |

### 4-4. 함수 리전
**Settings → Functions → Function Region → Singapore (sin1)**. DB와 같은 곳에 두어야 DB 왕복이 짧아요.

### 4-5. DB에 레시피 넣기 (내 컴퓨터에서)
```bash
# Neon 대시보드의 연결 주소를 잠깐 환경변수로 주고 실행
DATABASE_URL="postgresql://...neon.tech/neondb?sslmode=require" backend/.venv/Scripts/python scripts/data/seed_db.py --replace
```

### 4-6. 배포
- `main`에 푸시하면 자동으로 배포돼요. 다른 브랜치·PR은 미리보기 주소가 생겨요.
- 첫 배포는 Vercel 대시보드의 **Deploy** 버튼으로 해도 돼요.

---

## 5. 배포 후 확인

- [ ] `https://<프로젝트>.vercel.app/api/health` → `{"ok": true, "db": true, "visionMock": false}`
- [ ] `/recipes/1` 같은 화면 주소에서 새로고침해도 열리는지 (SPA 대체 규칙)
- [ ] 폰에서 촬영 → 재료 확인 → 추천 → 조리 모드 → 완료까지
- [ ] PC에서 사진 끌어다 놓기, QR로 폰 촬영 화면 열기
- [ ] 한동안 안 쓰다가 첫 요청 시간 (Neon이 잠들었다 깨는 시간)

---

## 6. 도메인 연결 (선택)

**도메인 하나를 사서 서브도메인으로 나눠 쓰는 걸 추천해요.**

| 주소 | 연결할 곳 |
|---|---|
| `snapchef.<도메인>` | 이 프로젝트 (Vercel) |
| `sool.<도메인>` | 술 페어링 서비스 (네이버 클라우드) |
| `<도메인>` | 포트폴리오 |

1. [Cloudflare Registrar](https://www.cloudflare.com/products/registrar/)에서 .com·.dev 구매 (원가 판매·DNS 무료·개인정보 보호 무료. 연 $10대, 구매 전 가격 확인). .kr이 필요하면 가비아에서 사야 해요.
2. Vercel → **Settings → Domains → `snapchef.<도메인>` 추가**
3. Cloudflare DNS → **CNAME `snapchef` → `cname.vercel-dns.com`**, 프록시는 **DNS only(회색 구름)**
4. 몇 분 뒤 Vercel이 HTTPS 인증서를 자동으로 발급해요.

도메인을 사기 전에는 `<프로젝트>.vercel.app` 주소를 그대로 써요.

---

## 7. 무료 한도와 주의할 점

| 항목 | 한도 | 대응 |
|---|---|---|
| Vercel 함수 요청 본문 | 4.5MB | 브라우저에서 사진을 1280px JPEG로 줄여 올려요 (3장 합쳐 1.5MB 안팎) |
| Vercel Hobby | 비상업용만 | 포트폴리오는 괜찮아요 |
| Neon 무료 | 프로젝트당 0.5GB, 쓰지 않으면 잠듦 | 레시피는 수 MB예요. 첫 요청이 조금 느릴 수 있어요 |
| Gemini 무료 | 분·일 요청 수 제한 | 한도 초과 시 429 → 화면에서 "직접 입력"으로 안내, IP당 하루 30회 제한 |
| EXAONE 키 | 30일 만료, 비상업 | 서비스 실행 중에는 쓰지 않아서 만료돼도 서비스는 멈추지 않아요 |

## 8. 문제 해결

- **`/api/...`가 404**: Vercel 배포 로그에서 backend 서비스가 빌드됐는지 확인하세요. 백엔드는 `/api`가 붙든 안 붙든 같은 라우트로 찾도록 만들어 두었어요.
- **`/api/health`에서 `db: false`**: `DATABASE_URL` 환경변수와 Neon 연결 상태를 확인하세요. 환경변수를 바꾼 뒤에는 다시 배포해야 반영돼요.
- **사진 인식이 계속 모의 결과**: `GEMINI_API_KEY`가 비었거나 `VISION_MOCK=1`이에요.
- **새 버전 배포 후 화면이 안 열림**: 예전 화면 코드를 찾는 경우라 앱이 "새 버전이 나왔어요 → 새로고침"을 보여 줘요.
