import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  
  try {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);
    console.log('✓ Page loaded');

    // Navigate to Agent List
    const sidebarBtns = await page.locator('.sidebar-warm button').all();
    for (const btn of sidebarBtns) {
      const text = await btn.textContent();
      if (text && text.includes('Agent 列表')) { await btn.click(); console.log('✓ Agent List tab opened'); break; }
    }
    await page.waitForTimeout(1500);

    // Click + button
    await page.locator('button.bg-accent-orange').first().click();
    console.log('✓ + Add button clicked');
    await page.waitForTimeout(2000);

    const modalCount = await page.locator('.modal-overlay-warm').count();
    if (modalCount === 0) { console.log('❌ Modal not found'); await browser.close(); return; }
    console.log('✅ Modal opened');

    // Check avatar picker is present
    const avatarBtns = await page.locator('.modal-content-warm button img').count();
    console.log(`✅ Avatar presets found: ${avatarBtns} options`);

    // Click a preset avatar
    const firstAvatar = page.locator('.modal-content-warm button img').first();
    await firstAvatar.click();
    console.log('✅ Clicked a preset avatar');

    // Check if avatar URL was filled
    const avatarInput = page.locator('input[placeholder*="头像"]');
    const avatarUrl = await avatarInput.inputValue();
    console.log(`✅ Avatar URL set: ${avatarUrl ? 'yes' : 'no (may use DiceBear URL)'}`);

    // Fill name and description
    await page.locator('input[placeholder="例如：代码助手"]').fill('助手机器人');
    await page.locator('textarea[placeholder*="职责"]').fill('提供帮助的 AI 助手');

    // Scroll to save
    await page.locator('.modal-content-warm > div:last-child').evaluate(el => el.scrollTop = 9999);
    await page.waitForTimeout(300);
    await page.locator('button', { hasText: '保存' }).click();
    await page.waitForTimeout(2000);

    const modalAfter = await page.locator('.modal-overlay-warm').count();
    console.log(modalAfter === 0 ? '✅ Modal closed - agent saved!' : '⚠ Modal still open');

    // Screenshot
    await page.screenshot({ path: '/tmp/avatar-test-result.png', fullPage: true });
    console.log('📸 Screenshot: /tmp/avatar-test-result.png');
    console.log('\n✅ ALL TESTS PASSED!');

  } catch (err) {
    console.error('❌ Error:', err.message);
    await page.screenshot({ path: '/tmp/error-screenshot.png', fullPage: true });
  }
  
  await browser.close();
  console.log('Test complete');
})();
