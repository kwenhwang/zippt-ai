import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Micro-interactions (Apple HIG)', () => {
  const cssContent = fs.readFileSync(
    path.resolve(__dirname, '../../app.css'),
    'utf-8'
  );

  const typingIndicatorContent = fs.readFileSync(
    path.resolve(__dirname, './ui/typing-indicator/typing-indicator.svelte'),
    'utf-8'
  );

  it('should have custom @keyframes pulse-bounce defined in app.css', () => {
    // Apple HIG: 커스텀 마이크로인터랙션
    // Tailwind의 기본 animate-bounce보다 부드러운 pulse-bounce 애니메이션 정의 확인
    const hasPulseBounceKeyframes = /@keyframes\s+pulse-bounce/.test(cssContent);

    expect(hasPulseBounceKeyframes).toBe(true);
  });

  it('should have .animate-pulse-bounce class defined in app.css', () => {
    // Apple HIG: 커스텀 애니메이션 클래스
    // .animate-pulse-bounce 유틸리티 클래스 정의 확인
    const hasPulseBounceClass = /\.animate-pulse-bounce/.test(cssContent);

    expect(hasPulseBounceClass).toBe(true);
  });

  it('should use custom animation class in typing-indicator.svelte', () => {
    // Apple HIG: 타이핑 인디케이터에 커스텀 애니메이션 적용
    // typing-indicator.svelte에서 animate-pulse-bounce 또는 커스텀 클래스 사용 확인
    const usesCustomAnimation =
      /animate-pulse-bounce/.test(typingIndicatorContent) ||
      /class="[^"]*\b(?:animate-pulse|animate-fade-in|custom-bounce)\b[^"]*"/.test(typingIndicatorContent);

    expect(usesCustomAnimation).toBe(true);
  });

  it('should have staggered animation delays in typing-indicator.svelte', () => {
    // Apple HIG: 순차적 애니메이션 지연
    // 3개의 점에 서로 다른 animation-delay 적용 확인
    const hasStaggeredDelays =
      /animation-delay:\s*0ms/.test(typingIndicatorContent) &&
      /animation-delay:\s*150ms/.test(typingIndicatorContent) &&
      /animation-delay:\s*300ms/.test(typingIndicatorContent);

    expect(hasStaggeredDelays).toBe(true);
  });

  it('should respect prefers-reduced-motion in custom animations', () => {
    // Apple HIG: 모션 감소 설정 존중
    // @keyframes 정의 근처에 prefers-reduced-motion 미디어 쿼리 확인
    const hasReducedMotionSupport =
      /@media\s*\(prefers-reduced-motion:\s*reduce\)/.test(cssContent) &&
      (/animation-duration:\s*0\.01ms/.test(cssContent) ||
       /animation:\s*none/.test(cssContent));

    expect(hasReducedMotionSupport).toBe(true);
  });

  it('should use smooth easing functions in custom animations', () => {
    // Apple HIG: 부드러운 easing 함수
    // ease-in-out, cubic-bezier 등 부드러운 타이밍 함수 사용 확인
    const hasSmoothEasing =
      /ease-in-out/.test(cssContent) ||
      /cubic-bezier/.test(cssContent) ||
      /ease-out/.test(cssContent);

    expect(hasSmoothEasing).toBe(true);
  });
});
