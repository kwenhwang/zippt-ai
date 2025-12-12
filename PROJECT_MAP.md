# PROJECT_MAP.md

> zippt-ai 프로젝트 구조 및 문서 색인

## 프로젝트 개요

**프로젝트명**: zippt-ai (집피티 모바일)
**목적**: 모바일 최적화 부동산 AI 챗봇 UI/UX
**부모 프로젝트**: api-catalog (korean-api-platform)

---

## 디렉토리 구조

```
zippt-ai/
├── src/
│   ├── routes/                    # SvelteKit 라우팅
│   │   ├── +layout.svelte         # 루트 레이아웃
│   │   ├── +page.svelte           # 메인 채팅 페이지
│   │   ├── api/
│   │   │   └── chat/
│   │   │       └── +server.ts     # api-catalog 프록시
│   │   └── widgets-demo/          # 위젯 데모
│   ├── lib/
│   │   ├── components/
│   │   │   ├── ui/                # 기본 UI (Button, Card 등)
│   │   │   └── widgets/           # 데이터 시각화 위젯
│   │   ├── types/
│   │   │   └── widgets.ts         # 위젯 타입 정의
│   │   └── utils.ts               # 유틸리티
│   ├── app.html                   # HTML 템플릿
│   ├── app.css                    # 전역 스타일
│   └── app.d.ts                   # 타입 선언
├── static/                        # 정적 자산
├── docs/                          # 문서
│   └── ADR.md                     # 아키텍처 결정
├── CLAUDE.md                      # 워크플로우 가이드
├── PROJECT_MAP.md                 # 이 파일
├── PROJECT_STATUS.md              # 현황 및 로드맵
├── BACKLOG.md                     # 이슈 추적
├── CURRENT_PLAN.md                # 현재 작업 계획
├── package.json                   # 의존성
├── vite.config.ts                 # Vite 설정 (PWA)
├── svelte.config.js               # Svelte 설정
└── tsconfig.json                  # TypeScript 설정
```

---

## 핵심 파일

### 라우트

| 파일 | 역할 |
|------|------|
| `src/routes/+page.svelte` | 메인 채팅 인터페이스 |
| `src/routes/+layout.svelte` | 루트 레이아웃 |
| `src/routes/api/chat/+server.ts` | api-catalog 프록시 API |
| `src/routes/widgets-demo/+page.svelte` | 위젯 데모 페이지 |

### 컴포넌트

| 디렉토리 | 역할 |
|----------|------|
| `src/lib/components/ui/` | 기본 UI (bits-ui 기반) |
| `src/lib/components/widgets/` | 데이터 시각화 위젯 |

### 위젯 시스템

| 파일 | 역할 |
|------|------|
| `widgets/WidgetRenderer.svelte` | 위젯 라우터 |
| `widgets/PriceChart.svelte` | 가격 차트 |
| `widgets/CompareTable.svelte` | 비교 테이블 |
| `widgets/ComplexCard.svelte` | 단지 정보 카드 |
| `widgets/RankingsTable.svelte` | 순위 테이블 |
| `widgets/BarChart.svelte` | 막대 그래프 |
| `widgets/PieChart.svelte` | 원형 차트 |

---

## 문서 색인

| 문서 | 용도 | 상태 |
|------|------|------|
| `CLAUDE.md` | 워크플로우 가이드 | 활성 |
| `PROJECT_MAP.md` | 프로젝트 구조 (이 파일) | 활성 |
| `PROJECT_STATUS.md` | 현황 및 로드맵 | 활성 |
| `BACKLOG.md` | 이슈 추적 | 활성 |
| `CURRENT_PLAN.md` | 현재 작업 계획 | 임시 |
| `docs/ADR.md` | 아키텍처 결정 | 활성 |

---

## 기술 스택

| 분류 | 기술 |
|------|------|
| **프레임워크** | SvelteKit 2.48, Svelte 5.43 |
| **언어** | TypeScript 5.9 |
| **스타일** | TailwindCSS 4.1 |
| **UI** | bits-ui 2.14 |
| **차트** | D3, LayerChart |
| **아이콘** | lucide-svelte |
| **마크다운** | marked + DOMPurify |
| **PWA** | @vite-pwa/sveltekit |
| **빌드** | Vite 7.2 |
| **배포** | Vercel |

---

## 부모 프로젝트 연동

**api-catalog 위치**: `../api-catalog/korean-api-platform/`

**사용 API**:
- `POST /api/chat` - 챗봇 메시지 처리

**위젯 타입 매핑**:
| api-catalog | zippt-ai |
|-------------|----------|
| `price_trend` | `PriceChart` |
| `region_compare` | `CompareTable` |
| `rankings` | `RankingsTable` |
| `area_distribution` | `BarChart` |

---

**Last Updated**: 2025-12-09
