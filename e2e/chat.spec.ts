import { test, expect } from '@playwright/test';

test.describe('채팅 기능', () => {
	test('메시지 입력 및 전송', async ({ page }) => {
		await page.goto('/');

		// 입력 필드 찾기 (textbox role로)
		const input = page.getByRole('textbox', { name: '메시지 입력' });
		await expect(input).toBeVisible();

		// 메시지 입력
		await input.fill('강남구 아파트 시세 알려줘');

		// 전송 버튼 클릭
		const sendButton = page.getByRole('button', { name: /전송|보내기/i });
		await sendButton.click();

		// 로딩 인디케이터 또는 응답 대기
		// (실제 API 호출은 mock 필요할 수 있음)
	});

	test('예시 질문 버튼 클릭', async ({ page }) => {
		await page.goto('/');

		// 예시 질문 버튼 찾기
		const exampleButton = page
			.getByRole('button')
			.filter({ hasText: /아파트|시세|부동산/i })
			.first();

		if (await exampleButton.isVisible()) {
			await exampleButton.click();

			// 입력 필드에 텍스트가 채워지거나 메시지가 전송됨
			const input = page.getByRole('textbox', { name: '메시지 입력' });
			// 확인 로직
		}
	});
});
