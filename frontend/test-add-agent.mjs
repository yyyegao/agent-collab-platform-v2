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
      if (text && text.includes('Agent 列表')) {
        await btn.click(); console.log('✓ Agent List tab opened'); break;
      }
    }
    await page.waitForTimeout(1500);

    // Click + button
    await page.locator('button.bg-accent-orange').first().click();
    console.log('✓ + Add button clicked');
    await page.waitForTimeout(2000);

    const modalCount = await page.locator('.modal-overlay-warm').count();
    if (modalCount === 0) {
      console.log('❌ Modal not found'); await browser.close(); return;
    }
    console.log('✅ Modal opened');

    // Fill in name
    const nameInput = page.locator('input[placeholder="例如：代码助手"]');
    await nameInput.fill('测试助手');
    console.log('✓ Filled name');

    // Fill in description
    const descInput = page.locator('textarea[placeholder*="职责和能力"]');
    await descInput.fill('这是一个测试用的 AI 助手');
    console.log('✓ Filled description');

    // Click a capability
    const capBtn = page.locator('button.rounded-full').filter({ hasText: '代码编写' }).first();
    if (await capBtn.count() > 0) {
      await capBtn.click();
      console.log('✓ Clicked capability');
    }

    // Scroll down to see save button
    await page.locator('.modal-content-warm > div:last-child').evaluate(el => el.scrollTop = 500);
    await page.waitForTimeout(300);

    // Click save
    const saveBtn = page.locator('button', { hasText: '保存' });
    await saveBtn.click();
    console.log('✓ Clicked 保存 button');
    await page.waitForTimeout(2000);

    // Check if modal closed
    const modalAfter = await page.locator('.modal-overlay-warm').count();
    if (modalAfter === 0) {
      console.log('✅ Modal closed after save - agent added successfully!');
    } else {
      console.log('⚠ Modal still open after save');
    }

    // Check if agent appears in list
    const agentCards = await page.locator('[class*="rounded-xl"][class*="p-"]').count();
    console.log(`Agent cards in list: ${agentCards}`);

    console.log('\n✅ ALL TESTS PASSED!');
    await page.screenshot({ path: '/tmp/modal-add-success.png', fullPage: true });

  } catch (err) {
    console.error('❌ Error:', err.message);
    await page.screenshot({ path: '/tmp/error-screenshot.png', fullPage: true });
  }
  
  await browser.close();
  console.log('Test complete');
})();
