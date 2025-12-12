import { test, expect } from '@playwright/test';

test.describe('오프라인 지원 (PWA-002)', () => {
	test('오프라인 시 배너 표시', async ({ page, context }) => {
		await page.goto('/');

		// 오프라인 모드 시뮬레이션
		await context.setOffline(true);

		// 오프라인 이벤트 트리거
		await page.evaluate(() => {
			window.dispatchEvent(new Event('offline'));
		});

		// 배너 표시 확인 (텍스트로 찾기)
		const banner = page.getByText(/오프라인|인터넷 연결/i);
		await expect(banner).toBeVisible({ timeout: 5000 });

		// 온라인 복구
		await context.setOffline(false);
		await page.evaluate(() => {
			window.dispatchEvent(new Event('online'));
		});

		// 배너 숨김 확인
		await expect(banner).not.toBeVisible({ timeout: 5000 });
	});
});
