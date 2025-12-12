import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import TypingIndicator from './typing-indicator.svelte';

describe('TypingIndicator', () => {
	it('기본 메시지 표시', () => {
		const { container } = render(TypingIndicator);
		expect(screen.getByText('답변을 생성하고 있습니다...')).toBeInTheDocument();
	});

	it('커스텀 메시지 표시', () => {
		const { container } = render(TypingIndicator, { props: { message: '로딩 중' } });
		expect(screen.getByText('로딩 중')).toBeInTheDocument();
	});

	it('3개의 애니메이션 dot 렌더링', () => {
		const { container } = render(TypingIndicator);
		const dots = container.querySelectorAll('.animate-pulse-bounce');
		expect(dots.length).toBe(3);
	});

	it('모든 dot이 orange-500 색상을 가짐', () => {
		const { container } = render(TypingIndicator);
		const dots = container.querySelectorAll('.animate-pulse-bounce');
		dots.forEach((dot) => {
			expect(dot.classList.contains('bg-orange-500')).toBe(true);
		});
	});

	it('텍스트가 작은 사이즈로 렌더링', () => {
		const { container } = render(TypingIndicator);
		const textElement = screen.getByText('답변을 생성하고 있습니다...');
		expect(textElement.classList.contains('text-sm')).toBe(true);
	});
});
