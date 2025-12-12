import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Semantic HTML (WCAG 2.1 Level AA)', () => {
  const pageContent = fs.readFileSync(
    path.resolve(__dirname, '../../routes/+page.svelte'),
    'utf-8'
  );

  it('should have <main> or role="main" element', () => {
    // WCAG 2.1: 랜드마크 역할 제공으로 스크린리더 탐색 향상
    // 메인 콘텐츠 영역을 명확히 정의
    const hasMainElement =
      /<main[\s>]/.test(pageContent) || // <main> 태그
      /role="main"/.test(pageContent); // role="main" 속성

    expect(hasMainElement).toBe(true);
  });

  it('should have <footer> or role="contentinfo" element', () => {
    // WCAG 2.1: 페이지 하단 정보 영역 정의
    // 저작권, 연락처, 기타 메타 정보를 포함하는 영역
    const hasFooterElement =
      /<footer[\s>]/.test(pageContent) || // <footer> 태그
      /role="contentinfo"/.test(pageContent); // role="contentinfo" 속성

    expect(hasFooterElement).toBe(true);
  });

  it('should have aria-live region for dynamic content', () => {
    // WCAG 2.1 4.1.3: 동적 콘텐츠 변경 알림
    // 챗봇 메시지 스트리밍 시 스크린리더에게 변경사항 알림
    const hasAriaLive = /aria-live=/.test(pageContent);

    expect(hasAriaLive).toBe(true);
  });
});
