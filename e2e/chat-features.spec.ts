import { test, expect } from '@playwright/test';

test.describe('Chat Features', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('Feedback buttons toggle state', async ({ page }) => {
        // Send a message to get an assistant response
        await page.locator('textarea').fill('Test message');
        await page.keyboard.press('Enter');

        // Wait for response
        const assistantMessage = page.locator('.group\\/message').filter({ hasText: 'ZIPPT AI' }).last();
        await expect(assistantMessage).toBeVisible({ timeout: 10000 });



        // Toolbar is now always visible or at least physically present in DOM without hover
        // But the previous test was 'hover to show'. I'll keep hover just in case but update expectations if needed.
        // The toolbar logic changed to 'flex items-center gap-1 transition-opacity duration-200' 
        // without opacity-0, so it should be visible immediately.

        const likeButton = assistantMessage.getByLabel('좋아요');
        await expect(likeButton).toBeVisible();
        await likeButton.click();

        // Check if active state is applied (assuming class change or aria-pressed)
        await expect(likeButton).toHaveAttribute('aria-pressed', 'true');

        // Click again to toggle off
        await likeButton.click();
        await expect(likeButton).toHaveAttribute('aria-pressed', 'false');
    });

    test('Copy button works (mocked)', async ({ page }) => {
        await page.locator('textarea').fill('Test message');
        await page.keyboard.press('Enter');
        const assistantMessage = page.locator('.group\\/message').filter({ hasText: 'ZIPPT AI' }).last();
        await expect(assistantMessage).toBeVisible();

        const copyButton = assistantMessage.getByLabel('복사하기');
        await expect(copyButton).toBeVisible();

        // Grant permissions first
        await page.context().grantPermissions(['clipboard-write']);

        // Robust mock
        await page.addInitScript(() => {
            Object.defineProperty(navigator, 'clipboard', {
                value: {
                    writeText: async () => Promise.resolve(),
                },
                configurable: true
            });
        });

        await copyButton.click();
        // Check for success icon (Check icon replaces Copy icon)
        // We look for the SVG inside the button
        await expect(copyButton.locator('.text-green-500')).toBeVisible();
    });

    test('Edit user message', async ({ page }) => {
        await page.locator('textarea').fill('Wrong question');
        await page.keyboard.press('Enter');

        // Wait for user message to appear
        const userMessage = page.locator('.group\\/message').filter({ hasNotText: 'ZIPPT AI' }).last();
        await expect(userMessage).toContainText('Wrong question');

        const editButton = userMessage.getByLabel('질문 수정');
        await expect(editButton).toBeVisible();
        await editButton.click();

        // Check if textarea appears in place of message
        const editTextarea = userMessage.locator('textarea');
        await expect(editTextarea).toBeVisible();

        await editTextarea.fill('Corrected question');

        const saveButton = userMessage.getByRole('button', { name: '저장' });
        await saveButton.click();

        await expect(userMessage).toContainText('Corrected question');
        await expect(editTextarea).not.toBeVisible();
    });

    test('Accessibility check for toolbar', async ({ page }) => {
        await page.locator('textarea').fill('A11y test');
        await page.keyboard.press('Enter');
        const assistantMessage = page.locator('.group\\/message').filter({ hasText: 'ZIPPT AI' }).last();
        await expect(assistantMessage).toBeVisible();

        const toolbar = assistantMessage.locator('.flex.items-center.gap-1');
        await expect(toolbar).toBeVisible();

        // Basic check for aria labels
        await expect(toolbar.getByLabel('복사하기')).toBeVisible();
        await expect(toolbar.getByLabel('좋아요')).toBeVisible();
    });
});
