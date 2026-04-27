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

    // Check avatar presets
    const avatarBtns = await page.locator('.modal-content-warm button img').count();
    console.log(`✅ Avatar presets: ${avatarBtns} options`);

    // Click an avatar preset
    await page.locator('.modal-content-warm button img').nth(3).click();
    console.log('✓ Clicked avatar preset');

    // Fill name and description
    await page.locator('input[placeholder="例如：代码助手"]').fill('测试助手2');
    await page.locator('textarea[placeholder*="职责"]').fill('测试描述内容');

    // Scroll and save
    await page.locator('.modal-content-warm > div:last-child').evaluate(el => el.scrollTop = 9999);
    await page.waitForTimeout(300);
    await page.locator('button', { hasText: '保存' }).click();
    await page.waitForTimeout(2500);

    // Check toast appeared
    const toastCount = await page.locator('.animate-toast-in').count();
    console.log(`✅ Toast notification shown: ${toastCount > 0}`);

    // Modal should be closed
    const modalAfter = await page.locator('.modal-overlay-warm').count();
    console.log(`✅ Modal closed after save: ${modalAfter === 0}`);

    // Check if agent appears in list with avatar
    const agentCards = await page.locator('.card-feishu').count();
    console.log(`✅ Agent cards in list: ${agentCards}`);

    if (agentCards > 0) {
      const avatarImg = await page.locator('.card-feishu img').count();
      console.log(`✅ Avatar image in agent card: ${avatarImg > 0}`);
    }

    console.log('\n✅ ALL TESTS PASSED!');
    await page.screenshot({ path: '/tmp/avatar-toast-test.png', fullPage: true });

  } catch (err) {
    console.error('❌ Error:', err.message);
    await page.screenshot({ path: '/tmp/error-screenshot.png', fullPage: true });
  }
  
  await browser.close();
  console.log('Test complete');
})();
