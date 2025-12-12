import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('PriceChart - Touch & Accessibility (Apple HIG)', () => {
  const componentContent = fs.readFileSync(
    path.resolve(__dirname, './PriceChart.svelte'),
    'utf-8'
  );

  it('should have enlarged touch areas (r="12" or larger)', () => {
    // Apple HIG: 최소 44x44pt 터치 영역 권장
    // SVG circle의 경우 r="12" 이상 (직경 24px 이상) 권장
    const hasLargeTouchArea =
      /r="1[2-9]/.test(componentContent) || // r="12"~"19"
      /r="[2-9]\d/.test(componentContent) || // r="20"~"99"
      /r="\d{3,}/.test(componentContent) || // r="100" 이상
      /r="\{[^}]*\}/.test(componentContent); // 동적 값 (e.g., r="{touchRadius}")

    expect(hasLargeTouchArea).toBe(true);
  });

  it('should support touch events (ontouchstart or on:touchstart)', () => {
    // Apple HIG: 터치 인터랙션 지원 필수
    // Svelte 이벤트 핸들러 또는 네이티브 터치 이벤트 확인
    const hasTouchEvent =
      /on:touchstart/.test(componentContent) ||
      /ontouchstart/.test(componentContent) ||
      /on:touchend/.test(componentContent) ||
      /ontouchend/.test(componentContent) ||
      /on:touchmove/.test(componentContent) ||
      /ontouchmove/.test(componentContent);

    expect(hasTouchEvent).toBe(true);
  });

  it('should support keyboard navigation (onkeydown or on:keydown)', () => {
    // Apple HIG: 키보드 내비게이션 지원 (VoiceOver, 외부 키보드)
    // Enter, Space, Arrow 키 등 핸들링 확인
    const hasKeyboardEvent =
      /on:keydown/.test(componentContent) ||
      /onkeydown/.test(componentContent) ||
      /on:keyup/.test(componentContent) ||
      /onkeyup/.test(componentContent) ||
      /on:keypress/.test(componentContent) ||
      /onkeypress/.test(componentContent);

    expect(hasKeyboardEvent).toBe(true);
  });

  it('should have focus styles (focus: or focus-visible:)', () => {
    // Apple HIG: 포커스 인디케이터 명확성 필수
    // Tailwind focus: 또는 focus-visible: 클래스 확인
    const hasFocusStyle =
      /focus:/.test(componentContent) ||
      /focus-visible:/.test(componentContent) ||
      /:focus/.test(componentContent); // CSS 스타일

    expect(hasFocusStyle).toBe(true);
  });

  it('should have ARIA labels for interactive elements', () => {
    // Apple HIG: VoiceOver 스크린 리더 지원
    // aria-label 속성 확인 (이미 구현됨, 회귀 방지)
    const hasAriaLabel = /aria-label=/.test(componentContent);

    expect(hasAriaLabel).toBe(true);
  });

  it('should have role="button" for interactive circles', () => {
    // Apple HIG: 의미론적 역할 명시
    // circle 요소에 role="button" 속성 확인 (이미 구현됨, 회귀 방지)
    const hasRoleButton = /role="button"/.test(componentContent);

    expect(hasRoleButton).toBe(true);
  });

  it('should have tabindex for keyboard focus', () => {
    // Apple HIG: 키보드 포커스 가능 요소
    // tabindex="0" 속성 확인 (이미 구현됨, 회귀 방지)
    const hasTabindex = /tabindex=/.test(componentContent);

    expect(hasTabindex).toBe(true);
  });
});
