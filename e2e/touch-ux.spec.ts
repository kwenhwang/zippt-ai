import { test, expect } from '@playwright/test';

const MIN_TOUCH_TARGET = 44; // WCAG 2.5.5 기준

test.describe('터치 UX (UI-001)', () => {
	test('전송 버튼 터치 타겟 44px 이상', async ({ page }) => {
		await page.goto('/');

		// 메시지 입력 필드에 텍스트 입력하여 전송 버튼 활성화
		const textarea = page.locator('textarea').first();
		await textarea.fill('테스트 메시지');

		// 전송 버튼 찾기 (multimodal-input의 sendButton snippet)
		const sendButton = page.locator('button').filter({ has: page.locator('svg') }).last();
		await expect(sendButton).toBeVisible();

		const box = await sendButton.boundingBox();
		expect(box).not.toBeNull();
		expect(box!.height, '전송 버튼 높이가 44px 미만').toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
		expect(box!.width, '전송 버튼 너비가 44px 미만').toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
	});

	test('정지 버튼 터치 타겟 44px 이상', async ({ page }) => {
		await page.goto('/');

		// 메시지 전송하여 로딩 상태로 만들기
		const textarea = page.locator('textarea').first();
		await textarea.fill('테스트 메시지');

		const sendButton = page.locator('button').filter({ has: page.locator('svg') }).last();
		await sendButton.click();

		// 정지 버튼이 나타날 때까지 대기 (stopButton snippet)
		const stopButton = page.locator('button').filter({ has: page.locator('svg') }).last();
		await expect(stopButton).toBeVisible({ timeout: 5000 });

		const box = await stopButton.boundingBox();
		expect(box).not.toBeNull();
		expect(box!.height, '정지 버튼 높이가 44px 미만').toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
		expect(box!.width, '정지 버튼 너비가 44px 미만').toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
	});

	test('첨부 파일 버튼 터치 타겟 44px 이상', async ({ page }) => {
		await page.goto('/');

		// 입력 필드가 로드될 때까지 대기
		const textarea = page.locator('textarea').first();
		await expect(textarea).toBeVisible();

		// 좌측 하단의 첨부 파일 버튼 찾기 (absolute bottom-0, justify-start)
		// variant="ghost"인 버튼 (전송/정지 버튼은 border가 있음)
		const attachButton = page.locator('button[data-slot="button"]').filter({
			hasNot: page.locator('.border')
		}).first();

		// 버튼이 보이지 않을 수 있으므로 조건부 테스트
		const isVisible = await attachButton.isVisible().catch(() => false);
		if (isVisible) {
			const box = await attachButton.boundingBox();
			expect(box).not.toBeNull();
			expect(box!.height, '첨부 버튼 높이가 44px 미만').toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
			expect(box!.width, '첨부 버튼 너비가 44px 미만').toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
		} else {
			// 첨부 파일 버튼이 없는 경우 테스트 스킵
			console.log('첨부 파일 버튼을 찾을 수 없습니다. 테스트를 스킵합니다.');
		}
	});

	test('입력 필드 터치 타겟 44px 이상', async ({ page }) => {
		await page.goto('/');

		const textarea = page.locator('textarea').first();
		await expect(textarea).toBeVisible();

		const box = await textarea.boundingBox();
		expect(box).not.toBeNull();
		expect(box!.height, '입력 필드 높이가 44px 미만').toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
	});

	test('테마 토글 버튼 터치 타겟 44px 이상', async ({ page }) => {
		await page.goto('/');

		// 테마 토글 버튼 찾기 (layout의 ThemeToggle)
		const themeToggle = page.getByRole('button', { name: /테마|theme|다크모드|light|dark/i });

		// 테마 토글이 있는 경우에만 테스트
		const isVisible = await themeToggle.isVisible().catch(() => false);
		if (isVisible) {
			const box = await themeToggle.boundingBox();
			expect(box).not.toBeNull();
			expect(box!.height, '테마 토글 높이가 44px 미만').toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
			expect(box!.width, '테마 토글 너비가 44px 미만').toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
		}
	});
});
