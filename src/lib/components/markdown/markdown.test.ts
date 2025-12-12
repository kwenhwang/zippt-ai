import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Markdown Typography (Apple HIG)', () => {
	const rendererContent = fs.readFileSync(
		path.resolve(__dirname, './renderer.svelte'),
		'utf-8'
	);

	it('should have paragraph snippet defined', () => {
		// 마크다운에서 가장 많이 사용되는 요소인 paragraph snippet 존재 확인
		const hasParagraphSnippet = /{#snippet p\(/.test(rendererContent);

		expect(hasParagraphSnippet).toBe(true);
	});

	it('should apply leading-relaxed class to paragraphs', () => {
		// Apple HIG 권장: 가독성을 위한 충분한 줄 간격
		// paragraph snippet에 leading-relaxed 클래스 적용 확인
		const paragraphSnippetMatch = rendererContent.match(
			/{#snippet p\([^}]+\}[\s\S]*?{\/snippet}/
		);

		if (paragraphSnippetMatch) {
			const hasLeadingRelaxed = /leading-relaxed/.test(paragraphSnippetMatch[0]);
			expect(hasLeadingRelaxed).toBe(true);
		} else {
			// paragraph snippet이 없으면 테스트 실패 (첫 번째 테스트에서 잡힘)
			expect(paragraphSnippetMatch).toBeTruthy();
		}
	});

	it('should have text-3xl class for H1', () => {
		// Apple HIG: 명확한 시각적 계층 구조
		// H1에 text-3xl 클래스 적용 확인
		const h1SnippetMatch = rendererContent.match(/{#snippet h1\([^}]+\}[\s\S]*?{\/snippet}/);

		if (h1SnippetMatch) {
			const hasText3xl = /text-3xl/.test(h1SnippetMatch[0]);
			expect(hasText3xl).toBe(true);
		} else {
			expect(h1SnippetMatch).toBeTruthy();
		}
	});
});
