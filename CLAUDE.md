# CLAUDE.md

> zippt-ai - 모바일 부동산 AI 챗봇 UI/UX 클라이언트 (v1.0)

## Project

**역할**: api-catalog의 UI/UX 프론트엔드 클라이언트
**Stack**: SvelteKit, Svelte 5, TailwindCSS 4, TypeScript
**백엔드**: api-catalog `/api/chat` API 사용
**배포**: Vercel

---

## 아키텍처

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

---

## 핵심 문서

| 문서 | 역할 | 위치 |
|------|------|------|
| `BACKLOG.md` | 이슈 추적 | 루트 |
| `PROJECT_STATUS.md` | 현황 및 로드맵 | 루트 |
| `PROJECT_MAP.md` | 프로젝트 구조 | 루트 |
| `docs/ADR.md` | 아키텍처 결정 | docs/ |

---

## 워크플로우

```
PM 지시 → `/p` 계획 → PM 승인 (ok) → `/e` 실행 → BACKLOG 업데이트
```

**글로벌 커맨드**:
- `/p` - Plan (CURRENT_PLAN.md 저장)
- `/e` - Execute (계획 실행)
- `/s` - Start (체크리스트)

---

## 절대 규칙 (6가지)

1. **PM 승인 필수** - 계획 없이 구현 금지
2. **UI/UX 전용** - AI 로직은 api-catalog에서 처리
3. **모바일 퍼스트** - 모든 UI는 모바일 우선 설계
4. **ADR 확인 필수** - 작업 전 아키텍처 결정 확인
5. **서브에이전트 우선** - 복잡한 작업은 위임
6. **api-catalog 수정 금지** - 부모 프로젝트는 읽기/참고만. 수정 필요 시 PM에게 요청사항 전달

### R&R 체크리스트 (수정 전 확인)
- [ ] 파일 경로가 `/home/ubuntu/zippt-ai/`로 시작하는가?
- [ ] `../api-catalog/` 경로면 → 읽기만, 수정 요청은 PM에게 전달

---

## 개발 명령어

```bash
pnpm install          # 의존성 설치
pnpm dev              # 개발 서버 (localhost:5173)
pnpm build            # 프로덕션 빌드
pnpm preview          # 빌드 미리보기
pnpm check            # TypeScript 체크
```

---

## 환경 변수

```bash
# .env
API_CATALOG_URL=https://sword33.duckdns.org  # api-catalog API
```

---

## 부모 프로젝트 참조

- **위치**: `../api-catalog/korean-api-platform/`
- **Chat API**: `POST /api/chat`
- **문서**: `../api-catalog/CLAUDE.md`

---

**Version**: 1.0
**Last Updated**: 2025-12-09
