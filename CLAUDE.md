# zippt-ai - AI 부동산 채팅 앱

## 스택
- **프레임워크**: SvelteKit 2 + Svelte 5
- **스타일**: Tailwind CSS 4
- **UI**: shadcn-svelte
- **배포**: Vercel (GitHub 자동 배포)

## 아키텍처
```
사용자
  ↓
zippt-ai (SvelteKit, Vercel)
  ↓ /api/chat proxy
korean-api-platform (Next.js, Vercel)
  ↓
Backend Queue (Python, 10.0.1.14:8001)
  ↓
DuckDB (10.7M 실거래 데이터)
```

## 핵심 파일
| 파일 | 역할 |
|------|------|
| `src/routes/+page.svelte` | 메인 채팅 UI (644줄) |
| `src/routes/api/chat/+server.ts` | API 프록시 |
| `src/lib/components/chat/ChatList.svelte` | 메시지 목록 |
| `src/lib/utils/widget-mapper.ts` | 위젯 파싱 |
| `static/manifest.json` | PWA 설정 |

## ⚠️ Svelte 5 핵심 규칙
```typescript
// ✅ messages 수정 - 반드시 배열 교체
messages[i] = { ...messages[i], prop: value };

// ❌ 절대 금지 - 자식 컴포넌트 전파 안 됨
messages[i].prop = value;
```

## 배포
- GitHub push → Vercel 자동 배포
- 환경변수: Vercel 대시보드에서 관리
- PWA: manifest.json (short_name: "Zippt")
