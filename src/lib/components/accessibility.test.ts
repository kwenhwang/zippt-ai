import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('CSS Accessibility (Apple HIG)', () => {
  const cssContent = fs.readFileSync(
    path.resolve(__dirname, '../../app.css'),
    'utf-8'
  );

  it('should have line-height defined for body', () => {
    // Apple HIG 권장: 최소 1.5 줄 간격
    // Tailwind의 leading- 클래스 또는 직접 line-height 설정 확인
    const hasLineHeight =
      /line-height:\s*1\.[5-9]/.test(cssContent) || // 1.5 이상
      /line-height:\s*[2-9]/.test(cssContent) || // 2 이상
      /leading-/.test(cssContent); // Tailwind leading 클래스

    expect(hasLineHeight).toBe(true);
  });

  it('should support prefers-reduced-motion', () => {
    // Apple HIG: 모션 감소 설정 존중
    // 애니메이션/전환 효과를 비활성화하는 미디어 쿼리 확인
    const hasReducedMotion = /@media\s*\(prefers-reduced-motion:\s*reduce\)/.test(cssContent);

    expect(hasReducedMotion).toBe(true);
  });

  it('should use system font stack', () => {
    // Apple HIG: 네이티브 시스템 폰트 사용 권장
    // SF Pro, San Francisco 등 시스템 폰트 스택 확인
    const hasSystemFont =
      /-apple-system/.test(cssContent) ||
      /BlinkMacSystemFont/.test(cssContent) ||
      /system-ui/.test(cssContent);

    expect(hasSystemFont).toBe(true);
  });

  it('should have safe-area-inset-top defined', () => {
    // Apple HIG: Safe Area 상단 여백 (노치, 다이나믹 아일랜드 대응)
    // iOS 환경 변수 env(safe-area-inset-top) 사용 확인
    const hasSafeAreaTop = /env\(safe-area-inset-top\)/.test(cssContent);

    expect(hasSafeAreaTop).toBe(true);
  });

  it('should have safe-area-inset-bottom defined', () => {
    // Apple HIG: Safe Area 하단 여백 (홈 인디케이터 대응)
    // iOS 환경 변수 env(safe-area-inset-bottom) 사용 확인
    const hasSafeAreaBottom = /env\(safe-area-inset-bottom\)/.test(cssContent);

    expect(hasSafeAreaBottom).toBe(true);
  });

  it('should have typography scale defined', () => {
    // Apple HIG: 타이포그래피 계층 구조
    // 헤딩(h1, h2, h3) 및 본문(body) 스타일 클래스 정의 확인
    const hasH1 = /\.text-h1/.test(cssContent);
    const hasH2 = /\.text-h2/.test(cssContent);
    const hasH3 = /\.text-h3/.test(cssContent);
    const hasBody = /\.text-body/.test(cssContent);

    expect(hasH1).toBe(true);
    expect(hasH2).toBe(true);
    expect(hasH3).toBe(true);
    expect(hasBody).toBe(true);
  });
});
