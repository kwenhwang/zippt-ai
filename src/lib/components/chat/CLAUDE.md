# 채팅 컴포넌트 레이어

## 컴포넌트 목록
| 파일 | 역할 | 크기 |
|------|------|------|
| `ChatList.svelte` | 메시지 목록 렌더러 (핵심) | 209줄 |
| `ChatInput.svelte` | 입력창 | 95줄 |
| `WelcomeHero.svelte` | 첫 화면 추천 질문 | 148줄 |
| `MessageToolbar.svelte` | 복사/피드백/편집 툴바 | 125줄 |
| `CitationsBar.svelte` | 인용 출처 표시 | 25줄 |
| `ThinkingIndicator.svelte` | 초기 로딩 애니메이션 | 16줄 |

## ✅ ChatList.svelte 구현 완료 기능
- processSteps 단계 표시 (spinner/checkmark)
- **15초 이상 대기 시 순환 메시지** (WAIT_MESSAGES 배열, 15초 간격)
- 마크다운 렌더링 (marked + DOMPurify)
- 위젯 파싱 및 렌더링
- 메시지 편집 모드
- 인용 표시

## ⚠️ ChatList.svelte 수정 시 주의
- `streamStartTime` prop은 page.svelte에서 필수로 전달받음 (0이면 순환 메시지 비활성)
- `$effect`의 `clearInterval` 제거 금지 → 메모리 누수
- `stepIdx` 변수 제거 금지 → isLastPending 계산에 필요

## ✅ WelcomeHero.svelte 구현 완료 기능
- 8개 추천 질문 풀에서 랜덤 4개 표시 (새로고침마다 다름)
- 카테고리 뱃지: 실거래가 / 지역비교 / 시세분석 / 단지정보
