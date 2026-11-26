<p align="center">
  <img src="frontend/public/logo/logo-horizontal.svg" alt="찰칵셰프" height="56" />
</p>

<h3 align="center">냉장고 재료, 찍기만 하세요</h3>
<p align="center">사진 한 장으로 지금 만들 수 있는 한식을 찾아 주는 웹앱</p>

---

## 무엇을 하나요

1. **사진 올리기**: 냉장고 재료를 찍거나 앨범에서 골라요.
2. **재료 확인**: AI(Gemini)가 찾은 재료를 확인하고 고쳐요.
3. **요리 고르기**: 내 재료와 많이 겹치는 레시피부터 보여 줘요. 고른 요리는 단계별 조리 모드로 따라 만들어요.

## 기술 스택

| 영역 | 사용 기술 |
|---|---|
| 프론트엔드 | Vite, React 19, TypeScript, Tailwind CSS v4, TanStack Query, Zustand, React Router |
| 백엔드 | FastAPI (Vercel Python 서버리스) |
| DB | Neon PostgreSQL |
| AI | Gemini (사진 → 재료 인식), EXAONE (레시피 데이터 보강, 오프라인 1회) |
| 데이터 | 식품의약품안전처 조리식품 레시피 DB (COOKRCP01) |
| 배포 | Vercel + Neon (무료 플랜) |

## 폴더 구조

```
frontend/   Vite + React 앱
backend/    FastAPI 앱 (Vercel 서비스)
db/         DB 스키마
scripts/    데이터 수집·보강·적재 스크립트
data/       파이프라인 결과 (recipes.json)
docs/       배포 가이드, 아키텍처 문서
```

## 로컬 실행

> 자세한 내용은 [docs/DEPLOY.md](docs/DEPLOY.md)를 참고하세요.

## 데이터 출처

레시피 데이터: 식품의약품안전처 식품안전나라 조리식품 레시피 DB. AI 추천 결과는 참고용이에요. 알레르기 재료는 꼭 직접 확인해 주세요.
