import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('CSS Animations (Spring & Material Motion)', () => {
  const cssContent = fs.readFileSync(
    path.resolve(__dirname, '../../app.css'),
    'utf-8'
  );

  it('should have spring easing cubic-bezier defined', () => {
    // 스프링 애니메이션: cubic-bezier 커스텀 이징 함수 확인
    // 예: cubic-bezier(0.34, 1.56, 0.64, 1) - 탄성 효과
    const hasSpringEasing = /cubic-bezier\([^)]+\)/.test(cssContent);

    expect(hasSpringEasing).toBe(true);
  });

  it('should have shadow in transition-property', () => {
    // 섀도우 전환: box-shadow 또는 shadow가 transition-property에 포함 확인
    // Material Design 카드 호버 효과 등에 사용
    const hasShadowTransition =
      /transition-property:\s*[^;]*box-shadow/.test(cssContent) ||
      /transition-property:\s*[^;]*shadow/.test(cssContent);

    expect(hasShadowTransition).toBe(true);
  });

  it('should have animation CSS variables', () => {
    // 애니메이션 변수: --spring- 또는 --duration- CSS 변수 확인
    // 일관된 애니메이션 타이밍을 위한 커스텀 프로퍼티
    const hasSpringVar = /--spring-/.test(cssContent);
    const hasDurationVar = /--duration-/.test(cssContent);

    expect(hasSpringVar || hasDurationVar).toBe(true);
  });

  it('should have custom pulse-bounce keyframe animation', () => {
    // 커스텀 키프레임: @keyframes pulse-bounce 정의 확인
    // 타이핑 인디케이터, 로딩 스피너 등에 사용
    const hasPulseBounce = /@keyframes\s+pulse-bounce/.test(cssContent);

    expect(hasPulseBounce).toBe(true);
  });
});
