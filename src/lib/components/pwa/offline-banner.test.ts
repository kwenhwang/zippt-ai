import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import OfflineBanner from './offline-banner.svelte';

describe('OfflineBanner', () => {
	beforeEach(() => {
		// navigator.onLine을 true로 설정 (기본값)
		Object.defineProperty(navigator, 'onLine', {
			value: true,
			writable: true,
			configurable: true
		});
	});

	it('온라인 상태에서 오프라인 배너 숨김', () => {
		const { container } = render(OfflineBanner);
		const offlineBanner = container.querySelector('.bg-amber-600');
		expect(offlineBanner).toBeNull();
	});

	it('오프라인 상태에서 배너 표시', () => {
		// navigator.onLine을 false로 설정
		Object.defineProperty(navigator, 'onLine', {
			value: false,
			writable: true,
			configurable: true
		});

		const { container } = render(OfflineBanner);
		const offlineBanner = container.querySelector('.bg-amber-600');
		expect(offlineBanner).toBeInTheDocument();
		expect(screen.getByText(/오프라인 상태입니다/)).toBeInTheDocument();
	});

	it('오프라인 배너에 적절한 메시지 표시', () => {
		Object.defineProperty(navigator, 'onLine', {
			value: false,
			writable: true,
			configurable: true
		});

		render(OfflineBanner);
		expect(screen.getByText('오프라인 상태입니다. 저장된 대화만 볼 수 있어요.')).toBeInTheDocument();
	});

	it('온라인 상태에서 재연결 배너 숨김', () => {
		const { container } = render(OfflineBanner);
		const reconnectedBanner = container.querySelector('.bg-green-600');
		expect(reconnectedBanner).toBeNull();
	});
});
