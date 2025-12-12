import { test, expect } from '@playwright/test';

test.describe('테마 전환 (UI-003)', () => {
	test('초기 다크 모드', async ({ page }) => {
		await page.goto('/');

		const html = page.locator('html');
		await expect(html).toHaveClass(/dark/);
	});

	test('테마 토글 클릭 시 모드 전환', async ({ page }) => {
		await page.goto('/');

		const toggleButton = page.getByRole('button', { name: /테마/i });
		await expect(toggleButton).toBeVisible();

		// 클릭 전 다크모드
		const html = page.locator('html');
		await expect(html).toHaveClass(/dark/);

		// 토글 클릭
		await toggleButton.click();

		// 라이트 모드로 전환
		await expect(html).not.toHaveClass(/dark/);

		// 다시 클릭하면 다크모드
		await toggleButton.click();
		await expect(html).toHaveClass(/dark/);
	});
});
