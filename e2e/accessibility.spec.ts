import { test, expect } from '@playwright/test';

test.describe('접근성', () => {
	test('모든 버튼에 접근 가능한 이름', async ({ page }) => {
		await page.goto('/');

		const buttons = page.getByRole('button');
		const count = await buttons.count();

		for (let i = 0; i < count; i++) {
			const button = buttons.nth(i);
			const name = (await button.getAttribute('aria-label')) || (await button.textContent());
			expect(name).toBeTruthy();
		}
	});

	test('키보드 네비게이션', async ({ page }) => {
		await page.goto('/');

		// Tab으로 입력 필드 포커스
		await page.keyboard.press('Tab');
		await page.keyboard.press('Tab');

		// 포커스된 요소 확인
		const focused = page.locator(':focus');
		await expect(focused).toBeVisible();
	});
});
