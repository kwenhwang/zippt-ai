# Apple HIG 기반 UI/UX 개선 계획

> zippt-ai 모바일 UX 최적화 - Apple Human Interface Guidelines 준수

**분석일**: 2025-12-12
**현재 점수**: 피드백 46/100, 접근성 50/100

---

## 분석 요약

### 1. 터치 타겟 & 여백
| 항목 | 현재 | 기준(44px) | 상태 |
|------|------|------------|------|
| 전송/정지 버튼 | 30px | 44px | ❌ Critical |
| 아이콘 버튼 | 36px | 44px | ⚠️ 미달 |
| 차트 포인트 | 8px | 44px | ❌ Critical |
| Safe Area | 미적용 | 필수 | ⚠️ 미구현 |

### 2. 피드백 & 애니메이션
| 항목 | 현재 | 기준 | 상태 |
|------|------|------|------|
| 버튼 :active | 없음 | 필수 | ❌ Critical |
| 애니메이션 easing | 혼재 | 통일 | ⚠️ 불일치 |
| Haptic 피드백 | 없음 | 권장 | ⚠️ 미구현 |

### 3. 타이포그래피 & 시각적 계층
| 항목 | 현재 | 기준 | 상태 |
|------|------|------|------|
| 줄 간격 | 거의 없음 | 1.4-1.5 | ❌ Critical |
| 폰트 패밀리 | 미정의 | 시스템 폰트 | ⚠️ 미구현 |
| H1 크기 | 20px | 28-32px | ⚠️ 너무 작음 |
| 본문 크기 | 14px | 17px | ⚠️ 너무 작음 |

### 4. 제스처 & 접근성
| 항목 | 현재 | 기준 | 상태 |
|------|------|------|------|
| prefers-reduced-motion | 없음 | WCAG 필수 | ❌ Critical |
| Semantic HTML | header만 | 전체 랜드마크 | ⚠️ 부족 |
| ARIA 랜드마크 | 일부만 | 전체 | ⚠️ 부족 |

---

## 개선 우선순위

### P0 - Critical (즉시 개선)

#### 1. 터치 타겟 44px 확보
**파일**: `src/routes/+page.svelte`, `src/lib/components/ui/button/button.svelte`
- 전송/정지 버튼: `p-1.5` → `min-w-11 min-h-11`
- 아이콘 버튼: `size-9` → `size-11`

#### 2. 버튼 :active 상태 추가
**파일**: `src/lib/components/ui/button/button.svelte`
```css
active:scale-95 active:opacity-90 transition-transform duration-150
```

#### 3. 줄 간격 전역 적용
**파일**: `src/app.css`
- 본문: `line-height: 1.5`
- prose: `leading-relaxed`

#### 4. prefers-reduced-motion 지원
**파일**: `src/app.css`
```css
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

---

### P1 - High (1주 내)

#### 5. Safe Area 적용
```css
header { padding-top: max(12px, env(safe-area-inset-top)); }
.input-area { padding-bottom: max(16px, env(safe-area-inset-bottom)); }
```

#### 6. 시스템 폰트 스택 정의
```css
font-family: -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Pretendard', sans-serif;
```

#### 7. Semantic HTML 개선
- 채팅 영역: `<main role="main">`
- 입력 영역: `<footer role="contentinfo">`

#### 8. 타이포그래피 스케일
- H1: 32px, H2: 28px, H3: 22px
- Body: 17px

---

### P2 - Medium (2주 내)

#### 9. 차트 터치 영역 확대
#### 10. Haptic 피드백 구현
#### 11. ARIA live 영역 추가
#### 12. 위젯 접근성 개선

---

### P3 - Low (개선 사항)

#### 13. 스와이프 제스처
#### 14. Pull-to-Refresh
#### 15. 스프링 애니메이션

---

## 작업 체크리스트

### Phase 1: P0 Critical
- [ ] 전송/정지 버튼 44px 확보
- [ ] 아이콘 버튼 크기 증가
- [ ] 버튼 :active 상태 추가
- [ ] 줄 간격 전역 적용
- [ ] prefers-reduced-motion 지원

### Phase 2: P1 High
- [ ] Safe Area 적용
- [ ] 시스템 폰트 스택 정의
- [ ] Semantic HTML 구조 개선
- [ ] 타이포그래피 스케일 정의

### Phase 3: P2 Medium
- [ ] 차트 터치 영역 확대
- [ ] Haptic 피드백 구현
- [ ] ARIA live 영역 추가

---

## 예상 결과

| 지표 | 현재 | 목표 |
|------|------|------|
| 피드백 점수 | 46/100 | 85/100 |
| 접근성 점수 | 50/100 | 90/100 |
| Lighthouse 접근성 | 90+ | 95+ |
| E2E 터치 테스트 | 23/24 | 24/24 |

---

## 주요 수정 파일

| 파일 | 수정 내용 |
|------|----------|
| `src/app.css` | 폰트, 줄 간격, Safe Area, reduced-motion |
| `src/lib/components/ui/button/button.svelte` | 터치 타겟, :active 상태 |
| `src/routes/+page.svelte` | Semantic HTML, 버튼 크기 |
| `src/lib/components/widgets/*.svelte` | 차트 접근성 |
| `src/lib/components/markdown/renderer.svelte` | 타이포그래피 |

---

**Last Updated**: 2025-12-12
