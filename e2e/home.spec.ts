import { test, expect } from '@playwright/test';

test.describe('홈페이지', () => {
	test('페이지 로드 및 타이틀 확인', async ({ page }) => {
		await page.goto('/');
		await expect(page).toHaveTitle(/집피티/);
	});

	test('채팅 입력 필드 존재', async ({ page }) => {
		await page.goto('/');
		// textbox role로 정확히 찾기
		const input = page.getByRole('textbox', { name: '메시지 입력' });
		await expect(input).toBeVisible();
	});

	test('전송 버튼 존재', async ({ page }) => {
		await page.goto('/');
		const sendButton = page.getByRole('button', { name: /전송|보내기/i });
		await expect(sendButton).toBeVisible();
	});
});
