"""레시피 보강용 LLM 클라이언트 (EXAONE / Gemini). 같은 함수 모양이라 --provider로 바꿔 쓸 수 있어요.

EXAONE (docs.exaone.ai 확인 내용)
- POST https://api.exaone.ai/v1/chat/completions, Authorization: Bearer <키>, OpenAI 호환 형식
- 모델 id: k-exaone_v2.5 / 항상 추론(thinking)을 해서 reasoning_effort="low"로 줄여요
- JSON 스키마 모드(response_format)는 문서에 없어서, 프롬프트로 JSON을 요청하고 pydantic으로 검증해요
- 키 유효기간 30일, 비상업 용도. 한도를 넘으면 429 + retry-after 헤더
"""

import json
import re
import time
import urllib.error
import urllib.request

from common import env

JSON_BLOCK = re.compile(r"\{.*\}", re.S)


class RateLimited(Exception):
    def __init__(self, wait: float):
        super().__init__(f"429, {wait}s 뒤 다시")
        self.wait = wait


def _extract_json(text: str) -> dict:
    text = text.strip()
    text = re.sub(r"^```(?:json)?|```$", "", text, flags=re.M).strip()
    m = JSON_BLOCK.search(text)
    if not m:
        raise ValueError("응답에 JSON이 없어요")
    return json.loads(m.group(0))


def exaone_json(system: str, user: str) -> dict:
    key = env("EXAONE_API_KEY")
    if not key:
        raise RuntimeError("EXAONE_API_KEY가 없어요 (.env)")
    base = env("EXAONE_BASE_URL", "https://api.exaone.ai/v1").split("#")[0].strip() or "https://api.exaone.ai/v1"
    body = {
        "model": env("EXAONE_MODEL", "k-exaone_v2.5"),
        "messages": [{"role": "system", "content": system}, {"role": "user", "content": user}],
        "max_tokens": 24000,  # 추론 토큰 포함 (여러 레시피를 묶어 보낼 때 넉넉하게)
        "temperature": 0.3,
        "reasoning_effort": "low",
        "stream": False,
    }
    req = urllib.request.Request(
        f"{base.rstrip('/')}/chat/completions",
        data=json.dumps(body).encode(),
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=300) as r:
            data = json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        if e.code == 429:
            raise RateLimited(float(e.headers.get("retry-after", "20"))) from e
        raise RuntimeError(f"EXAONE {e.code}: {e.read().decode('utf-8', 'ignore')[:200]}") from e
    return _extract_json(data["choices"][0]["message"]["content"] or "")


def gemini_json(system: str, user: str, schema: type) -> dict:
    from google import genai
    from google.genai import errors, types

    client = genai.Client(api_key=env("GEMINI_API_KEY"), http_options=types.HttpOptions(timeout=120_000))
    model = env("GEMINI_MODEL", "gemini-3.5-flash-lite")
    try:
        resp = client.models.generate_content(
            model=model,
            contents=user,
            config=types.GenerateContentConfig(
                system_instruction=system,
                response_mime_type="application/json",
                response_schema=schema,
                temperature=0.3,
            ),
        )
    except errors.ClientError as e:
        if e.code == 429:
            raise RateLimited(30) from e
        raise
    return json.loads(resp.text or "{}")


def call(provider: str, system: str, user: str, schema: type) -> dict:
    for attempt in range(5):
        try:
            return exaone_json(system, user) if provider == "exaone" else gemini_json(system, user, schema)
        except RateLimited as e:
            print(f"    사용량 한도 — {e.wait:.0f}초 쉬어요")
            time.sleep(e.wait + attempt * 5)
    raise RuntimeError("한도 초과가 계속돼요. 나중에 이어서 실행하세요 (캐시가 남아 있어요)")
