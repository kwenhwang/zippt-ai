# Architecture Decision Records (ADR)

> zippt-ai 아키텍처 결정 기록

---

## ADR-001: UI/UX 전용 클라이언트 아키텍처

**상태**: 승인됨
**날짜**: 2025-12-09
**결정자**: PM

### 컨텍스트

zippt-ai 프로젝트의 역할과 범위를 정의해야 함.
부모 프로젝트(api-catalog)에 이미 완성된 AI 챗봇 API가 존재.

### 결정

zippt-ai는 **UI/UX 전용 클라이언트**로 구현한다.

```
┌─────────────────┐      ┌──────────────────────────┐
│   zippt-ai      │ ──→  │  api-catalog             │
│   (UI/UX)       │      │  /api/chat               │
│   SvelteKit     │ ←──  │  GPT-4o + 9개 도구       │
│   모바일 최적화  │      │  10.7M 거래 데이터       │
└─────────────────┘      └──────────────────────────┘
```

**역할 분리**:
- **zippt-ai**: 모바일 UI/UX만 담당 (AI 로직 없음)
- **api-catalog**: AI 챗봇 로직 + 데이터 처리

### 이유

1. **코드 중복 방지** - AI 로직을 두 곳에서 유지할 필요 없음
2. **일관성** - 부모 프로젝트와 동일한 응답 품질 보장
3. **유지보수** - 도구/프롬프트 업데이트를 한 곳에서 관리
4. **비용** - OpenAI API 키 별도 관리 불필요

### 결과

- OpenAI 직접 연동 제거
- api-catalog `/api/chat` API 프록시로 변경
- 위젯 타입 매핑 레이어 추가

### 대안 검토

**Option A**: 독립 풀스택 (기각)
- 장점: 완전한 독립성
- 단점: 코드 중복, 품질 불일치, 유지보수 부담

**Option B**: UI/UX 전용 (채택)
- 장점: 간소화, 일관성, 유지보수 용이
- 단점: api-catalog 의존성

---

## ADR-002: SvelteKit 프레임워크 선택

**상태**: 기존 결정 유지
**날짜**: 2025-12-09

### 컨텍스트

모바일 최적화 웹앱 프레임워크 선택.

### 결정

SvelteKit + Svelte 5를 사용한다.

### 이유

1. **번들 크기** - React/Next.js 대비 작은 번들
2. **성능** - 컴파일 타임 최적화
3. **Runes** - Svelte 5의 반응성 시스템
4. **PWA 지원** - @vite-pwa/sveltekit 통합

### 기술 스택

- SvelteKit 2.48
- Svelte 5.43
- TailwindCSS 4.1
- Vite 7.2

---

## ADR-003: api-catalog Chat API 스트리밍 프록시

**상태**: 승인됨
**날짜**: 2025-12-09

### 컨텍스트

api-catalog의 Chat API를 zippt-ai에서 호출하는 방식 결정.

### 결정

SvelteKit API 라우트에서 SSE 스트리밍 프록시를 구현한다.

```typescript
// src/routes/api/chat/+server.ts
export async function POST({ request }) {
  const body = await request.json();

  const response = await fetch(`${API_CATALOG_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: body.messages,
      stream: true
    })
  });

  return new Response(response.body, {
    headers: { 'Content-Type': 'text/event-stream' }
  });
}
```

### 이유

1. **CORS 회피** - 같은 도메인에서 API 호출
2. **세션 관리** - 서버에서 세션 ID 생성/관리
3. **에러 처리** - 클라이언트에 친화적인 에러 메시지

---

## ADR-004: 위젯 타입 매핑 전략

**상태**: 승인됨
**날짜**: 2025-12-09

### 컨텍스트

api-catalog와 zippt-ai의 위젯 타입 차이를 처리.

### 결정

타입 매핑 레이어를 구현하여 api-catalog 응답을 zippt-ai 위젯으로 변환한다.

**매핑 테이블**:
| api-catalog | zippt-ai |
|-------------|----------|
| `price_trend` | `PriceChart` |
| `region_compare` | `CompareTable` |
| `rankings` | `RankingsTable` |
| `area_distribution` | `BarChart` |

### 이유

1. **유연성** - 양쪽 변경에 독립적 대응
2. **확장성** - 새 위젯 타입 추가 용이
3. **호환성** - 기존 위젯 코드 유지

---

**Last Updated**: 2025-12-09
