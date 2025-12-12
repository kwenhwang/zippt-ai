import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Widget Accessibility (ARIA)', () => {
  const widgetsDir = path.resolve(__dirname);

  describe('BarChart.svelte', () => {
    const barChartContent = fs.readFileSync(
      path.join(widgetsDir, 'BarChart.svelte'),
      'utf-8'
    );

    it('should have aria-label attribute', () => {
      // 차트 컨테이너 또는 SVG 요소에 aria-label 속성 존재 확인
      const hasAriaLabel = /aria-label\s*=/.test(barChartContent);

      expect(hasAriaLabel).toBe(true);
    });

    it('should have role attribute', () => {
      // 차트 시맨틱 역할 정의 (role="img" 또는 role="figure")
      const hasRole = /role\s*=\s*["'](?:img|figure)["']/.test(barChartContent);

      expect(hasRole).toBe(true);
    });
  });

  describe('PieChart.svelte', () => {
    const pieChartContent = fs.readFileSync(
      path.join(widgetsDir, 'PieChart.svelte'),
      'utf-8'
    );

    it('should have aria-label attribute on path or g elements', () => {
      // SVG path 또는 g 요소에 aria-label 속성 존재 확인
      const hasAriaLabel = /aria-label\s*=/.test(pieChartContent);

      expect(hasAriaLabel).toBe(true);
    });

    it('should have role attribute', () => {
      // 차트 시맨틱 역할 정의 (role="img" 또는 role="figure")
      const hasRole = /role\s*=\s*["'](?:img|figure)["']/.test(pieChartContent);

      expect(hasRole).toBe(true);
    });
  });

  describe('PriceChart.svelte', () => {
    const priceChartContent = fs.readFileSync(
      path.join(widgetsDir, 'PriceChart.svelte'),
      'utf-8'
    );

    it('should have aria-label attribute', () => {
      // 차트 컨테이너 또는 SVG 요소에 aria-label 속성 존재 확인
      const hasAriaLabel = /aria-label\s*=/.test(priceChartContent);

      expect(hasAriaLabel).toBe(true);
    });

    it('should have role attribute', () => {
      // PriceChart의 인터랙티브 circle은 role="button" 사용 (클릭 가능)
      const hasRole = /role\s*=\s*["'](?:img|figure|button)["']/.test(priceChartContent);

      expect(hasRole).toBe(true);
    });
  });

  // P3에서 개선 예정 - 테이블/카드 위젯
  describe.skip('CompareTable.svelte (P3)', () => {
    const compareTableContent = fs.readFileSync(
      path.join(widgetsDir, 'CompareTable.svelte'),
      'utf-8'
    );

    it('should use semantic table element', () => {
      const hasTableElement = /<table/.test(compareTableContent);
      expect(hasTableElement).toBe(true);
    });

    it('should have table headers with scope attribute', () => {
      const hasScope = /<th\s+[^>]*scope\s*=\s*["'](?:col|row)["']/.test(compareTableContent);
      expect(hasScope).toBe(true);
    });
  });

  describe.skip('RankingsTable.svelte (P3)', () => {
    const rankingsTableContent = fs.readFileSync(
      path.join(widgetsDir, 'RankingsTable.svelte'),
      'utf-8'
    );

    it('should use semantic table element', () => {
      const hasTableElement = /<table/.test(rankingsTableContent);
      expect(hasTableElement).toBe(true);
    });

    it('should have table headers with scope attribute', () => {
      const hasScope = /<th\s+[^>]*scope\s*=\s*["'](?:col|row)["']/.test(rankingsTableContent);
      expect(hasScope).toBe(true);
    });
  });

  describe.skip('ComplexCard.svelte (P3)', () => {
    const complexCardContent = fs.readFileSync(
      path.join(widgetsDir, 'ComplexCard.svelte'),
      'utf-8'
    );

    it('should have aria-label for interactive elements', () => {
      const hasAriaLabel = /aria-label(?:ledby)?\s*=/.test(complexCardContent);
      expect(hasAriaLabel).toBe(true);
    });
  });
});
