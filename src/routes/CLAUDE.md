# zippt-ai 라우트 레이어

## 구조
- `+page.svelte` - 메인 채팅 페이지 (644줄, 핵심 파일)
- `api/chat/+server.ts` - 채팅 API 프록시 (korean-api-platform으로 포워딩)
- `api/feedback/+server.ts` - 피드백 수집

## ✅ 이미 구현된 기능 (+page.svelte)
- SSE 스트리밍: tool-input-start / tool-output-available / citation / text-delta
- 채팅 영속성: localStorage 기반 saveCurrentChat() / loadCurrentChat()
- 탭 이탈 자동 저장: visibilitychange / pagehide 이벤트
- 스트리밍 취소: AbortController
- 대기 시간 추적: streamStartTime (ChatList 순환 메시지 연동)

## ⚠️ 절대 규칙 - Svelte 5 반응성
messages 배열 수정은 반드시 배열 교체 방식으로:
```typescript
// ✅ 올바른 방식 (자식 컴포넌트에 전파됨)
messages[i] = { ...messages[i], content: newContent };

// ❌ 잘못된 방식 (자식 컴포넌트에 전파 안 됨)
messages[i].content = newContent;
```

## 컴포넌트 의존 관계
```
+page.svelte
  → ChatList.svelte (messages, streamStartTime prop 필수)
    → ThinkingIndicator.svelte
    → MessageToolbar.svelte
    → CitationsBar.svelte
    → WidgetRenderer
  → ChatInput.svelte
  → WelcomeHero.svelte (첫 화면, messages 없을 때)
```

## 수정 시 주의
- `streamStartTime` 관련 코드 삭제 금지 → ChatList 순환 메시지 동작 안 함
- `saveCurrentChat()` 호출 위치 변경 시 → 채팅 영속성 깨짐
- AbortController null 처리 반드시 유지
