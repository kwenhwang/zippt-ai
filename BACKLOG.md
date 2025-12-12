# BACKLOG.md

> zippt-ai 이슈 추적

---

## 이슈 관리 규칙

**ID 체계**:
| Prefix | 용도 |
|--------|------|
| `INIT-###` | 프로젝트 초기화 |
| `UI-###` | UI/UX 개발 |
| `API-###` | API 연동 |
| `PERF-###` | 성능 최적화 |
| `FIX-###` | 버그 수정 |
| `PWA-###` | PWA 기능 |

**상태**: `TODO` | `IN_PROGRESS` | `DONE` | `BLOCKED`

**우선순위**: P0 (긴급) | P1 (높음) | P2 (중간) | P3 (낮음)

---

## 활성 이슈

### P0 - 긴급

| ID | 제목 | 상태 | 담당 | 비고 |
|----|------|------|------|------|
| **API-001** | api-catalog Chat API 프록시 구현 | `DONE` | Claude | Phase 2 완료 |
| **API-004** | AI SDK Chat 클래스 마이그레이션 | `DONE` | 총괄개발자 | @ai-sdk/svelte v3.0.108 Chat 클래스 적용 |
| **API-005** | AI SDK v5 TypeScript 호환성 수정 | `DONE` | Claude | 13개 타입 에러 수정 |

### P1 - 높음

| ID | 제목 | 상태 | 담당 | 비고 |
|----|------|------|------|------|
| **API-002** | 위젯 타입 매핑 구현 | `DONE` | Claude | widget-mapper.ts 생성 |
| **API-003** | SSE 스트리밍 연동 | `DONE` | Claude | fetch + SSE 파싱 구현 |
| **FIX-001** | 기존 타입 에러 수정 | `DONE` | Claude | 타입 에러 0개 달성 |

### P2 - 중간

| ID | 제목 | 상태 | 담당 | 비고 |
|----|------|------|------|------|
| **UI-001** | 터치 UX 개선 | `DONE` | Claude | 44px+ 터치 타겟 적용 |
| **UI-002** | 로딩 상태 개선 | `DONE` | Claude | typing-indicator 구현 |
| **PWA-001** | 설치 유도 프롬프트 | `DONE` | Claude | install-prompt 컴포넌트 |
| **PWA-002** | 오프라인 지원 강화 | `DONE` | Claude | offline-banner + runtimeCaching |

### P3 - 낮음

| ID | 제목 | 상태 | 담당 | 비고 |
|----|------|------|------|------|
| **UI-003** | 다크/라이트 모드 토글 | `DONE` | Claude | theme-toggle + ModeWatcher |
| **UI-004** | 음성 입력 지원 | `TODO` | - | Web Speech API |
| **PERF-001** | Lighthouse 90+ 달성 | `DONE` | Claude | SEO/접근성/PWA 최적화 |
| **TEST-001** | 테스트 인프라 구축 | `DONE` | Claude | Vitest + Playwright + LHCI |

---

## 완료 이슈

| ID | 제목 | 완료일 | 비고 |
|----|------|--------|------|
| **INIT-001** | 프로젝트 문서 초기화 | 2025-12-09 | CLAUDE.md, PROJECT_MAP 등 |
| **INIT-002** | 아키텍처 결정 (ADR-001) | 2025-12-09 | UI/UX 전용 클라이언트 |
| **API-001** | api-catalog Chat API 프록시 구현 | 2025-12-09 | Phase 2 완료 |
| **API-002** | 위젯 타입 매핑 구현 | 2025-12-09 | widget-mapper.ts |
| **API-003** | SSE 스트리밍 연동 | 2025-12-09 | AI SDK Data Stream Protocol |
| **API-004** | AI SDK Chat 클래스 마이그레이션 | 2025-12-09 | @ai-sdk/svelte v3.0.108 |
| **API-005** | AI SDK v5 TypeScript 호환성 수정 | 2025-12-09 | 13개 에러 → 0개 |
| **UI-001** | 터치 UX 개선 | 2025-12-09 | 44px+ 터치 타겟 적용 |
| **UI-002** | 로딩 상태 개선 | 2025-12-09 | typing-indicator 컴포넌트 |
| **PWA-001** | 설치 유도 프롬프트 | 2025-12-09 | install-prompt 컴포넌트 |
| **PWA-002** | 오프라인 지원 강화 | 2025-12-09 | offline-banner + runtimeCaching |
| **UI-003** | 다크/라이트 모드 토글 | 2025-12-09 | theme-toggle + ModeWatcher |
| **PERF-001** | Lighthouse 90+ 달성 | 2025-12-09 | SEO/접근성/PWA 최적화 |
| **TEST-001** | 테스트 인프라 구축 | 2025-12-09 | Vitest 24 + E2E 24 통과 |

---

## 블로커

현재 블로커 없음.

---

## 담당 정의

| 역할 | 담당자 | 책임 |
|------|--------|------|
| PM | 프로젝트 매니저 | 우선순위 결정, 승인 |
| Claude | AI 개발자 | 구현, 문서화 |

---

**Last Updated**: 2025-12-09
