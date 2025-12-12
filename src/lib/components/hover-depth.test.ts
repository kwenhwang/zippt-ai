import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Hover Depth Effects (Apple HIG)', () => {
  const cardContent = fs.readFileSync(
    path.resolve(__dirname, './ui/card/card.svelte'),
    'utf-8'
  );

  it('should have hover:shadow class in card.svelte', () => {
    // Apple HIG: 호버 시 그림자 효과로 깊이감 표현
    // hover:shadow-* 클래스 존재 확인
    const hasHoverShadow = /hover:shadow/.test(cardContent);

    expect(hasHoverShadow).toBe(true);
  });

  it('should have transition class in card.svelte', () => {
    // Apple HIG: 부드러운 애니메이션 전환
    // transition 클래스 존재 확인
    const hasTransition = /transition/.test(cardContent);

    expect(hasTransition).toBe(true);
  });

  it('should have hover translate effect in card.svelte', () => {
    // Apple HIG: 호버 시 미세한 이동 효과
    // hover:-translate-y-* 또는 hover:translate 클래스 존재 확인
    const hasHoverTranslate =
      /hover:-translate/.test(cardContent) ||
      /hover:translate/.test(cardContent);

    expect(hasHoverTranslate).toBe(true);
  });
});
