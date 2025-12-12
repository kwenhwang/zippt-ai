import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import ThemeToggle from './theme-toggle.svelte';

// mode-watcher는 이미 setupTests.ts에서 mock됨
// 여기서는 추가 설정만 진행

describe('ThemeToggle', () => {
	beforeEach(() => {
		// 각 테스트 전에 mock 리셋
		vi.clearAllMocks();
	});

	it('버튼 렌더링', () => {
		const { container } = render(ThemeToggle);
		const button = screen.getByRole('button');
		expect(button).toBeInTheDocument();
	});

	it('aria-label 접근성', () => {
		const { container } = render(ThemeToggle);
		const button = screen.getByLabelText('테마 전환');
		expect(button).toBeInTheDocument();
	});

	it('버튼이 적절한 스타일 클래스를 가짐', () => {
		const { container } = render(ThemeToggle);
		const button = screen.getByRole('button');
		expect(button.classList.contains('p-2')).toBe(true);
		expect(button.classList.contains('rounded-lg')).toBe(true);
	});

	it('터치 타겟 클래스 적용', () => {
		const { container } = render(ThemeToggle);
		const button = screen.getByRole('button');
		expect(button.classList.contains('touch-target')).toBe(true);
	});
});
