import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import InstallPrompt from './install-prompt.svelte';

describe('InstallPrompt', () => {
	beforeEach(() => {
		// localStorage 초기화
		localStorage.clear();

		// matchMedia mock
		Object.defineProperty(window, 'matchMedia', {
			writable: true,
			value: vi.fn().mockImplementation((query) => ({
				matches: false,
				media: query,
				onchange: null,
				addListener: vi.fn(),
				removeListener: vi.fn(),
				addEventListener: vi.fn(),
				removeEventListener: vi.fn(),
				dispatchEvent: vi.fn()
			}))
		});
	});

	it('초기 상태에서 배너 숨김', () => {
		const { container } = render(InstallPrompt);
		// beforeinstallprompt 없으면 배너 표시 안함
		const banner = container.querySelector('.fixed.bottom-20');
		expect(banner).toBeNull();
	});

	it('dismiss된 경우 배너 표시하지 않음', () => {
		localStorage.setItem('pwa-install-dismissed', 'true');
		const { container } = render(InstallPrompt);
		const banner = container.querySelector('.fixed.bottom-20');
		expect(banner).toBeNull();
	});

	it('standalone 모드에서는 배너 표시하지 않음', () => {
		Object.defineProperty(window, 'matchMedia', {
			writable: true,
			value: vi.fn().mockImplementation((query) => ({
				matches: query === '(display-mode: standalone)',
				media: query,
				onchange: null,
				addListener: vi.fn(),
				removeListener: vi.fn(),
				addEventListener: vi.fn(),
				removeEventListener: vi.fn(),
				dispatchEvent: vi.fn()
			}))
		});

		const { container } = render(InstallPrompt);
		const banner = container.querySelector('.fixed.bottom-20');
		expect(banner).toBeNull();
	});
});
